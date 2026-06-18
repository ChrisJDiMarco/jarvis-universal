const { app, BrowserWindow, nativeTheme, ipcMain, shell, Menu, dialog } = require('electron');
const path = require('path');
const fs   = require('fs');
const os   = require('os');
const { spawn } = require('child_process');

// ── Paths ────────────────────────────────────────────────────────
const CONFIG_DIR     = path.join(os.homedir(), '.cortex');
const STATE_FILE     = path.join(CONFIG_DIR, 'state.json');
const MINDS_FILE     = path.join(CONFIG_DIR, 'minds.json');
const MESH_FILE      = path.join(CONFIG_DIR, 'mesh.json');
const WORKFLOWS_FILE = path.join(CONFIG_DIR, 'workflows.json');
const ACTIVITY_FILE  = path.join(CONFIG_DIR, 'activity.json');
const SHARED_MEM_DIR = path.join(CONFIG_DIR, 'shared-memory');

function ensureConfigDir() {
  if (!fs.existsSync(CONFIG_DIR)) fs.mkdirSync(CONFIG_DIR, { recursive: true });
}

const pendingCreatedMindFolders = new Map();

// ── State persistence ────────────────────────────────────────────
function parseJSONFile(filePath) {
  return JSON.parse(fs.readFileSync(filePath, 'utf8'));
}

function loadJSON(filePath) {
  const backupPath = `${filePath}.bak`;
  try {
    if (fs.existsSync(filePath)) return parseJSONFile(filePath);
  } catch (err) {
    console.warn(`Unable to load ${filePath}; trying backup`, err.message);
  }

  try {
    if (fs.existsSync(backupPath)) return parseJSONFile(backupPath);
  } catch (err) {
    console.warn(`Unable to load backup ${backupPath}`, err.message);
  }

  return null;
}

function loadExternalJSONObject(filePath, label = 'JSON file') {
  const backupPath = `${filePath}.bak`;
  if (!fs.existsSync(filePath)) return { ok: true, data: {} };

  try {
    const data = parseJSONFile(filePath);
    if (!isPlainObject(data)) throw new Error(`${label} must contain a JSON object`);
    return { ok: true, data };
  } catch (err) {
    try {
      if (fs.existsSync(backupPath)) {
        const data = parseJSONFile(backupPath);
        if (!isPlainObject(data)) throw new Error(`${label} backup must contain a JSON object`);
        return { ok: true, data, recoveredFromBackup: true };
      }
    } catch (backupErr) {
      return { ok: false, error: `${label} and backup are not readable JSON: ${err.message}; backup: ${backupErr.message}` };
    }
    return { ok: false, error: `${label} is not readable JSON: ${err.message}` };
  }
}

function backupExistingJSON(filePath, backupPath) {
  if (!fs.existsSync(filePath)) return;

  try {
    parseJSONFile(filePath);
    fs.copyFileSync(filePath, backupPath);
  } catch (err) {
    console.warn(`Skipping backup for invalid JSON ${filePath}`, err.message);
  }
}

function saveJSON(filePath, data) {
  ensureConfigDir();
  const dir = path.dirname(filePath);
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });

  const tmpPath = path.join(dir, `.${path.basename(filePath)}.${process.pid}.${Date.now()}.tmp`);
  const backupPath = `${filePath}.bak`;

  try {
    backupExistingJSON(filePath, backupPath);
    fs.writeFileSync(tmpPath, JSON.stringify(data, null, 2), 'utf8');
    fs.renameSync(tmpPath, filePath);
  } catch (err) {
    try {
      if (fs.existsSync(tmpPath)) fs.unlinkSync(tmpPath);
    } catch {}
    throw err;
  }
}

function writeTextFileAtomic(filePath, content) {
  const dir = path.dirname(filePath);
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
  const tmpPath = path.join(dir, `.${path.basename(filePath)}.${process.pid}.${Date.now()}.tmp`);

  try {
    fs.writeFileSync(tmpPath, String(content ?? ''), 'utf8');
    fs.renameSync(tmpPath, filePath);
  } catch (err) {
    try {
      if (fs.existsSync(tmpPath)) fs.unlinkSync(tmpPath);
    } catch {}
    throw err;
  }
}

function isPlainObject(value) {
  return !!value && typeof value === 'object' && !Array.isArray(value);
}

function safeString(value, fallback = '', maxLength = 1000) {
  const str = typeof value === 'string' ? value : (value == null ? fallback : String(value));
  return str.replace(/\0/g, '').trim().slice(0, maxLength);
}

function safeNumber(value, fallback = 0, min = 0, max = Number.MAX_SAFE_INTEGER) {
  const num = Number(value);
  if (!Number.isFinite(num)) return fallback;
  return Math.min(max, Math.max(min, num));
}

function safeStringArray(value, maxItems = 100, maxLength = 200) {
  if (!Array.isArray(value)) return [];
  return value
    .map(item => safeString(item, '', maxLength))
    .filter(Boolean)
    .slice(0, maxItems);
}

function safeFileStem(value, fallback = 'file', maxLength = 160) {
  return (safeString(value, fallback, maxLength).replace(/[^a-zA-Z0-9._-]+/g, '-') || fallback).slice(0, maxLength);
}

function safeColor(value, fallback = '#6366f1') {
  const color = safeString(value, fallback, 40);
  return /^#[0-9a-fA-F]{3}(?:[0-9a-fA-F]{3})?(?:[0-9a-fA-F]{2})?$/.test(color) ? color : fallback;
}

const AI_PROVIDERS = new Set(['claude', 'codex']);

function normalizeProviderId(value, fallback = 'claude') {
  const provider = safeString(value, fallback, 40).toLowerCase();
  return AI_PROVIDERS.has(provider) ? provider : fallback;
}

function normalizeToolMap(value) {
  if (!isPlainObject(value)) return {};
  return Object.fromEntries(Object.entries(value)
    .map(([key, enabled]) => [safeString(key, '', 80), !!enabled])
    .filter(([key]) => key));
}

function normalizeCapabilities(value) {
  if (!isPlainObject(value)) return {};
  const allowedTrust = new Set(['system', 'workspace', 'external']);
  const allowedPolicy = new Set(['inspect', 'mutate', 'coordinate']);
  return Object.fromEntries(Object.entries(value).slice(0, 50).map(([name, group]) => {
    const normalizedName = safeString(name, '', 80);
    if (!normalizedName) return null;
    const source = isPlainObject(group) ? group : { tools: Array.isArray(group) ? group : [group] };
    const trust = safeString(source.trust, 'external', 40);
    const policy = safeString(source.policy, 'inspect', 40);
    return [normalizedName, {
      trust: allowedTrust.has(trust) ? trust : 'external',
      policy: allowedPolicy.has(policy) ? policy : 'inspect',
      tools: safeStringArray(source.tools, 80, 120),
    }];
  }).filter(Boolean));
}

function normalizeSharedMemoryConfig(value) {
  if (!isPlainObject(value)) return {};
  const allowed = new Set(['readwrite', 'read', 'none']);
  return Object.fromEntries(Object.entries(value).map(([key, config]) => {
    const access = isPlainObject(config) ? config.access : config;
    const normalizedAccess = allowed.has(access) ? access : 'readwrite';
    return [safeString(key, '', 120), { access: normalizedAccess }];
  }).filter(([key]) => key));
}

function normalizeMemoryVerification(value) {
  if (!isPlainObject(value)) return {};
  return Object.fromEntries(Object.entries(value).map(([id, entry]) => {
    const normalizedId = safeString(id, '', 1000);
    if (!normalizedId) return null;
    if (!isPlainObject(entry)) {
      const verifiedAt = safeString(entry, '', 80);
      return verifiedAt ? [normalizedId, { verifiedAt }] : null;
    }
    const verifiedAt = safeString(entry.verifiedAt, '', 80);
    if (!verifiedAt) return null;
    return [normalizedId, {
      verifiedAt,
      key: safeString(entry.key, '', 120),
      relativePath: safeString(entry.relativePath, '', 1000),
      name: safeString(entry.name, '', 240),
    }];
  }).filter(Boolean));
}

function normalizeWindowBounds(value) {
  if (!isPlainObject(value)) return undefined;
  const bounds = {};
  if (Number.isFinite(Number(value.width))) bounds.width = Math.round(safeNumber(value.width, 1200, 600, 10000));
  if (Number.isFinite(Number(value.height))) bounds.height = Math.round(safeNumber(value.height, 780, 400, 10000));
  if (Number.isFinite(Number(value.x))) bounds.x = Math.round(Number(value.x));
  if (Number.isFinite(Number(value.y))) bounds.y = Math.round(Number(value.y));
  return bounds.width && bounds.height ? bounds : undefined;
}

function normalizeState(value, { defaults = true } = {}) {
  const source = isPlainObject(value) ? value : {};
  const state = defaults ? { theme: 'light', defaultFolder: '~/JarvisOS', sharedMemory: {}, memoryVerification: {}, dismissedReadinessIds: [], welcomeDismissed: false, defaultProvider: 'claude' } : {};
  if ('theme' in source) state.theme = ['light', 'dark', 'system'].includes(source.theme) ? source.theme : (defaults ? 'light' : undefined);
  if ('defaultFolder' in source) state.defaultFolder = safeString(source.defaultFolder, '~/JarvisOS', 1000) || '~/JarvisOS';
  if ('defaultProvider' in source) state.defaultProvider = normalizeProviderId(source.defaultProvider);
  if ('sharedMemory' in source) state.sharedMemory = normalizeSharedMemoryConfig(source.sharedMemory);
  if ('memoryVerification' in source) state.memoryVerification = normalizeMemoryVerification(source.memoryVerification);
  if ('dismissedReadinessIds' in source) state.dismissedReadinessIds = safeStringArray(source.dismissedReadinessIds, 1000, 300);
  if ('welcomeDismissed' in source) state.welcomeDismissed = !!source.welcomeDismissed;
  if ('mcpInstalled' in source) state.mcpInstalled = !!source.mcpInstalled;
  const bounds = normalizeWindowBounds(source.windowBounds);
  if (bounds) state.windowBounds = bounds;
  Object.keys(state).forEach(key => state[key] === undefined && delete state[key]);
  return state;
}

function normalizeISODateString(value) {
  const raw = safeString(value, '', 80);
  if (!raw) return null;
  const parsed = new Date(raw);
  return Number.isNaN(parsed.getTime()) ? null : raw;
}

function uniqueRecordId(value, usedIds, fallbackPrefix = 'id', index = 0) {
  const fallback = `${fallbackPrefix}-${Date.now()}-${index}`;
  const base = safeString(value, '', 120) || fallback;
  if (!usedIds) return base;

  let candidate = base;
  let suffix = 2;
  while (usedIds.has(candidate)) {
    const suffixText = `-${suffix++}`;
    candidate = `${base.slice(0, Math.max(1, 120 - suffixText.length))}${suffixText}`;
  }
  usedIds.add(candidate);
  return candidate;
}

function normalizeSchedule(value, { resetRunning = false, index = 0, usedIds = null } = {}) {
  const source = isPlainObject(value) ? value : {};
  const id = uniqueRecordId(source.id, usedIds, 'sched', index);
  const allowedStatuses = new Set(['ready', 'running', 'complete', 'error', 'skipped']);
  const lastStatus = safeString(source.lastStatus, 'ready', 80) || 'ready';
  return {
    ...source,
    id,
    name: safeString(source.name, 'Untitled Schedule', 160) || 'Untitled Schedule',
    interval: safeString(source.interval, '', 40),
    action: safeString(source.action, '', 4000),
    enabled: !!source.enabled,
    running: resetRunning ? false : !!source.running,
    nextRun: normalizeISODateString(source.nextRun),
    lastRun: normalizeISODateString(source.lastRun),
    lastStatus: allowedStatuses.has(lastStatus) ? lastStatus : 'ready',
    lastError: safeString(source.lastError, '', 1000),
    lastOutput: safeString(source.lastOutput, '', 10000),
    lastDurationMs: safeNumber(source.lastDurationMs, 0, 0),
    lastCostUsd: safeNumber(source.lastCostUsd, 0, 0),
  };
}

function normalizeMind(value, key, options = {}) {
  const source = isPlainObject(value) ? value : {};
  const usedScheduleIds = new Set();
  const emoji = safeString(source.emoji, '', 20) || safeString(source.icon, '\u{1F9E0}', 20) || '\u{1F9E0}';
  const tagline = safeString(source.tagline, '', 300) || safeString(source.subtitle, '', 300);
  const personality = safeString(source.personality, '', 2000) || safeString(source.description, '', 2000);
  return {
    ...source,
    name: safeString(source.name, key, 160) || key,
    emoji,
    color: safeColor(source.color),
    tagline,
    personality,
    guardrail: safeString(source.guardrail, '', 4000),
    folder: safeString(source.folder, '', 1000),
    status: safeString(source.status, 'active', 80) || 'active',
    memory: safeNumber(source.memory, 0, 0, 100),
    sessions: Math.round(safeNumber(source.sessions, 0, 0)),
    lastActive: safeString(source.lastActive, 'Never', 120),
    specialties: safeStringArray(Array.isArray(source.specialties) ? source.specialties : source.tags, 80, 160),
    modes: safeStringArray(source.modes, 80, 160),
    distillation: isPlainObject(source.distillation) ? {
      compressionRatio: safeNumber(source.distillation.compressionRatio, 0, 0, 100),
      tokensRecovered: safeNumber(source.distillation.tokensRecovered, 0, 0),
      avgRestoreMs: safeNumber(source.distillation.avgRestoreMs, 0, 0),
      sessionsDistilled: safeNumber(source.distillation.sessionsDistilled, 0, 0),
    } : { compressionRatio: 0, tokensRecovered: 0, avgRestoreMs: 0, sessionsDistilled: 0 },
    capabilities: normalizeCapabilities(source.capabilities),
    schedules: Array.isArray(source.schedules)
      ? source.schedules.map((schedule, index) => normalizeSchedule(schedule, { ...options, index, usedIds: usedScheduleIds }))
      : [],
    mcpTools: normalizeToolMap(source.mcpTools),
  };
}

function defaultSystemCapabilities() {
  return { system: { trust: 'system', tools: ['Read','Write','Edit','Bash','Grep','Glob'], policy: 'mutate' } };
}

const MIND_DRAFT_PERSONALITIES = ['Dynamic & Adaptive', 'Sharp & Direct', 'Deep & Thorough', 'Creative & Bold'];
const MIND_DRAFT_SPECIALTIES = ['Strategy','Tech & Code','Research','Writing','Finance','Psychology','Philosophy','Negotiation','SEO','Automation','Sales','Design'];
const MIND_DRAFT_EMOJIS = ['\u{1F9E0}','\u26A1','\u{1F680}','\u{1F52E}','\u{1F3AF}','\u{1F4A1}','\u{1F525}','\u{1F30A}','\u{1F4DA}','\u{1F916}','\u{1F52D}','\u2728','\u270D\uFE0F','\u{1F4CA}','\u265F\uFE0F','\u2692\uFE0F'];
const MIND_DRAFT_MODE_COLORS = ['#6366f1', '#10b981', '#06b6d4', '#f59e0b'];

function uniqueStrings(values, maxItems = 10, maxLength = 120) {
  const seen = new Set();
  return safeStringArray(values, maxItems * 2, maxLength).filter(value => {
    const key = value.toLowerCase();
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  }).slice(0, maxItems);
}

function fallbackSpecialtiesFromBrief(brief) {
  const lower = safeString(brief, '', 4000).toLowerCase();
  const matches = [
    ['Tech & Code', /\b(code|engineer|software|architecture|debug|dev|build|ship|automation)\b/],
    ['Research', /\b(research|sources|study|analysis|investigate|learn)\b/],
    ['Writing', /\b(write|editor|content|copy|essay|script|newsletter)\b/],
    ['Finance', /\b(finance|money|invest|portfolio|budget|market|revenue)\b/],
    ['Strategy', /\b(strategy|plan|decision|operator|business|product|roadmap)\b/],
    ['Design', /\b(design|ux|ui|brand|visual|interface)\b/],
    ['Sales', /\b(sales|pipeline|prospect|customer|deal)\b/],
    ['Psychology', /\b(psychology|coach|habit|emotion|relationship|behavior)\b/],
  ].filter(([, pattern]) => pattern.test(lower)).map(([name]) => name);
  return matches.length ? matches.slice(0, 4) : ['Strategy'];
}

function titleCaseFromBrief(brief) {
  const words = safeString(brief, 'New Mind', 80)
    .replace(/[^a-zA-Z0-9\s-]+/g, ' ')
    .split(/\s+/)
    .filter(Boolean)
    .filter(word => !['a','an','the','for','with','and','or','to','of','that','who','mind','agent','assistant'].includes(word.toLowerCase()))
    .slice(0, 2);
  const base = words.length ? words.join(' ') : 'New Mind';
  return base.replace(/\b\w/g, char => char.toUpperCase());
}

function normalizeMindDraftMode(value, index = 0) {
  const source = isPlainObject(value) ? value : { name: value };
  const name = safeString(source.name, '', 80);
  if (!name) return null;
  return {
    name,
    desc: safeString(source.desc || source.description || source.behavior, '', 240) || 'Adapts behavior to the current request.',
    color: safeColor(source.color, MIND_DRAFT_MODE_COLORS[index % MIND_DRAFT_MODE_COLORS.length]),
  };
}

function defaultMindDraftModes(draft) {
  return [
    { name: 'Clarify', desc: 'Sharpens the request, constraints, and desired outcome before moving.', color: '#6366f1' },
    { name: 'Synthesize', desc: `Combines ${draft.specialties.slice(0, 2).join(' and ') || 'context'} into a useful working model.`, color: '#10b981' },
    { name: 'Act', desc: 'Turns the best next step into a concrete output or plan.', color: '#f59e0b' },
  ];
}

function normalizeMindDraftCapabilities(value) {
  const normalized = normalizeCapabilities(value);
  if (Object.keys(normalized).length) {
    if (!normalized.system) normalized.system = defaultSystemCapabilities().system;
    return normalized;
  }
  return {
    ...defaultSystemCapabilities(),
    knowledge: { trust: 'workspace', policy: 'inspect', tools: ['Read','Grep','Glob'] },
  };
}

function normalizeMindDraft(value, brief = '') {
  const source = isPlainObject(value?.draft) ? value.draft : (isPlainObject(value) ? value : {});
  const allowedPersonalities = new Set(MIND_DRAFT_PERSONALITIES);
  const allowedSpecialties = new Set(MIND_DRAFT_SPECIALTIES);
  const allowedEmojis = new Set(MIND_DRAFT_EMOJIS);
  const name = safeString(source.name, '', 80) || titleCaseFromBrief(brief);
  const personality = safeString(source.personality, '', 80);
  const specialties = uniqueStrings(source.specialties, 6, 80).filter(item => allowedSpecialties.has(item));
  const draft = {
    name,
    emoji: allowedEmojis.has(source.emoji) ? source.emoji : '\u{1F9E0}',
    tagline: safeString(source.tagline, '', 140) || 'Purpose-built cognitive partner',
    personality: allowedPersonalities.has(personality) ? personality : 'Dynamic & Adaptive',
    specialties: specialties.length ? specialties : fallbackSpecialtiesFromBrief(brief),
    guardrail: safeString(source.guardrail, '', 240) || 'Do not invent facts; ask for missing context when stakes are high.',
    folderName: safeFileStem(source.folderName || name.toLowerCase(), 'mind', 80).replace(/^[._-]+|[._-]+$/g, '').toLowerCase() || 'mind',
    capabilities: normalizeMindDraftCapabilities(source.capabilities),
  };
  const modes = Array.isArray(source.modes)
    ? source.modes.map(normalizeMindDraftMode).filter(Boolean).slice(0, 4)
    : [];
  draft.modes = modes.length ? modes : defaultMindDraftModes(draft);
  draft.soul = safeString(source.soul, '', 12000);
  draft.criticalFacts = safeString(source.criticalFacts || source.l1 || source.memory, '', 8000);
  return draft;
}

function buildMindDraftPrompt(brief) {
  return `You are JARVIS OS's Mind Architect. Create a complete, coherent mind configuration from the user's brief.

Return exactly one JSON object. Do not use markdown fences or prose outside JSON.

Schema:
{
  "name": "short distinctive name, 2-4 words max",
  "emoji": "one of: ${MIND_DRAFT_EMOJIS.join(' ')}",
  "tagline": "clear one-line job-to-be-done, max 90 chars",
  "personality": "one of: ${MIND_DRAFT_PERSONALITIES.join(' | ')}",
  "specialties": ["1-5 items, each one of: ${MIND_DRAFT_SPECIALTIES.join(' | ')}"],
  "guardrail": "the main failure mode this mind should avoid, max 180 chars",
  "folderName": "lowercase filesystem slug",
  "modes": [{"name":"mode name","desc":"when/how this mode behaves","color":"#RRGGBB"}],
  "capabilities": {"system":{"trust":"system","policy":"mutate","tools":["Read","Write","Edit","Bash","Grep","Glob"]}},
  "soul": "markdown identity file body with sections: Mission, Operating Style, Strengths, Failure Modes, Collaboration Contract",
  "criticalFacts": "markdown L1 memory body with sections: Owner Context, Active Work, Working Agreements. Do not invent private facts; use brief-derived working assumptions only."
}

Make the mind opinionated and useful without being gimmicky. Favor professional specificity over cute naming.

User brief:
${safeString(brief, '', 4000)}`;
}

function extractMindDraftObject(text) {
  const raw = safeString(text, '', 30000);
  const candidates = [raw];
  const fenced = raw.match(/```(?:json)?\s*([\s\S]*?)```/i);
  if (fenced) candidates.push(fenced[1].trim());
  const firstBrace = raw.indexOf('{');
  const lastBrace = raw.lastIndexOf('}');
  if (firstBrace >= 0 && lastBrace > firstBrace) candidates.push(raw.slice(firstBrace, lastBrace + 1));

  for (const candidate of candidates) {
    try {
      const parsed = JSON.parse(candidate);
      if (isPlainObject(parsed)) return parsed;
    } catch {}
  }
  return null;
}

function workflowDraftMindCatalog(minds) {
  return Object.entries(minds).map(([key, mind]) => ({
    key,
    name: safeString(mind.name, key, 120) || key,
    tagline: safeString(mind.tagline, '', 180),
    personality: safeString(mind.personality, '', 160),
    specialties: safeStringArray(mind.specialties, 6, 80),
    tools: Object.entries(mind.mcpTools || {})
      .filter(([, enabled]) => !!enabled)
      .map(([tool]) => safeString(tool, '', 80))
      .filter(Boolean)
      .slice(0, 12),
  })).slice(0, 18);
}

const AUTOMATION_TOOL_IDS = [
  'slack', 'gmail', 'imessage', 'gcal', 'notion', 'github', 'bash', 'desktop-cmd',
  'firecrawl', 'gdrive', 'apple-notes', 'pdf', 'spotify', 'n8n', 'composio',
  'browser', 'webhook', 'semantic-search', 'vector-db', 'deep-research',
  'knowledge-graph', 'bigquery', 'ga4-gsc', 'anomaly-detection', 'screen-recorder',
  'artifact-studio', 'image-gen', 'playcanvas',
];

const AUTOMATION_PATTERN_GUIDE = [
  {
    pattern: 'Spec-first execution contract',
    sources: ['Q00/ouroboros', 'coleam00/Archon', 'Synaptic-Labs-AI/PACT-Plugin'],
    apply: 'Turn vague requests into inputs, outputs, success criteria, validation gates, artifacts, and replay notes before execution.',
  },
  {
    pattern: 'Local knowledge graph and typed memory',
    sources: ['rowboatlabs/rowboat', 'vellum-ai/vellum-assistant', 'raroque/boop-agent'],
    apply: 'Separate episodic facts, durable preferences, procedures, commitments, project context, and shared memory; capture through review.',
  },
  {
    pattern: 'Dispatcher plus specialist workers',
    sources: ['raroque/boop-agent', 'VRSEN/OpenSwarm', 'garrytan/gstack'],
    apply: 'Keep the lead mind focused on routing and synthesis; send concrete work to narrow specialists with explicit deliverables.',
  },
  {
    pattern: 'Schema-rich connector validation',
    sources: ['czlonkowski/n8n-mcp', 'onyx-dot-app/onyx', 'Suganthan-Mohanadasan/Suganthans-BigQuery-MCP-Server'],
    apply: 'Prefer validated tool schemas, connector readiness checks, evidence requirements, and dry-run review before external action.',
  },
  {
    pattern: 'Benchmark and artifact discipline',
    sources: ['PolymathicAI/the_well', 'going-doer/Paper2Code', 'extropic-ai/thrml', 'addyosmani/recorder'],
    apply: 'Define evaluation data, expected artifacts, reproducible traces, and reviewable media/docs for complex work.',
  },
];

function buildWorkflowDraftPrompt(brief, minds) {
  const catalog = workflowDraftMindCatalog(minds);
  return `You are JARVIS OS's Workflow Architect. Convert the user's desired outcome into a concrete, reviewable workflow for the available JARVIS OS minds.

Return exactly one JSON object. Do not use markdown fences or prose outside JSON.

Available minds:
${JSON.stringify(catalog, null, 2)}

Schema:
{
  "name": "short workflow name, 2-5 words max",
  "description": "plain-language outcome, max 180 chars",
  "trigger": "manual",
  "steps": [
    {
      "mind": "one exact key from the available minds list",
      "provider": "claude or codex",
      "action": "specific runnable instruction for that mind, including expected output"
    }
  ],
  "notes": "short rationale for why these minds and steps were chosen"
}

Rules:
- Use only mind keys from the Available minds list.
- Prefer 2-5 steps, but use 1 step for a simple outcome and never more than 6.
- Each action must be clear enough to run as an independent prompt and should mention the concrete deliverable.
- Use "codex" for codebase edits, implementation, debugging, tests, repo inspection, or developer tooling.
- Use "claude" for research, synthesis, writing, strategy, planning, review, and general reasoning.
- Build useful handoffs: research before synthesis, implementation before review, drafting before polish.
- Do not invent external integrations. If a tool is not listed for a mind, keep the step tool-neutral.
- Keep the workflow editable and professional, not gimmicky.

User outcome:
${safeString(brief, '', 5000)}`;
}

function extractWorkflowDraftObject(text) {
  return extractMindDraftObject(text);
}

function buildAutomationDraftPrompt(brief, minds) {
  const catalog = workflowDraftMindCatalog(minds);
  return `You are JARVIS OS's Automation Architect. Convert the user's plain-English automation request into a complete, reviewable JARVIS OS automation blueprint.

Return exactly one JSON object. Do not use markdown fences or prose outside JSON.

Available minds:
${JSON.stringify(catalog, null, 2)}

Available tool IDs:
${AUTOMATION_TOOL_IDS.join(', ')}

Architecture patterns to apply when relevant:
${JSON.stringify(AUTOMATION_PATTERN_GUIDE, null, 2)}

Schema:
{
  "name": "short automation name, 2-5 words",
  "summary": "plain-language outcome, max 220 chars",
  "operatingSpec": {
    "inputs": ["what the automation needs before it runs"],
    "outputs": ["concrete artifacts or decisions it should produce"],
    "successCriteria": ["how the user can tell the run worked"],
    "failureModes": ["ways the automation can fail or need escalation"]
  },
  "workflow": {
    "name": "workflow name",
    "description": "what the workflow does",
    "steps": [
      {
        "mind": "one exact key from available minds",
        "provider": "claude or codex",
        "action": "specific runnable instruction with expected output"
      }
    ]
  },
  "schedule": {
    "enabled": false,
    "mind": "lead mind key",
    "name": "schedule name",
    "interval": "30m, 6h, 1d, or 7d; empty string when manual only",
    "action": "what the lead mind should do when schedule fires",
    "rationale": "why this cadence is appropriate"
  },
  "toolPlan": [
    {
      "mind": "mind key",
      "tools": ["tool ids from available tool IDs"],
      "reason": "why those tools are useful"
    }
  ],
  "evidencePolicy": {
    "sourceRequirements": ["what claims require sources, screenshots, logs, data, or citations"],
    "validationChecks": ["checks to perform before the user trusts the result"]
  },
  "executionPolicy": {
    "mode": "manual-first, scheduled-after-review, or human-approved-external-actions",
    "retry": "when to retry and when to stop",
    "budget": "time/cost/tool-use guardrail",
    "escalation": "when to ask the user instead of continuing"
  },
  "approvalPolicy": {
    "riskLevel": "low, medium, or high",
    "humanReview": true,
    "gates": ["specific actions that require approval before execution"]
  },
  "memoryPolicy": {
    "capture": "none, summary, decisions, or full",
    "targetMind": "mind key",
    "reviewRequired": true,
    "whatToRemember": ["durable context items to capture after review"]
  },
  "reviewChecklist": ["items the user should verify before enabling"],
  "notes": "short rationale and implementation notes"
}

Rules:
- Use only mind keys from the available minds list.
- Use only tool IDs from the available tool IDs list.
- Prefer 3-5 workflow steps and never more than 7.
- Use "codex" only for codebase edits, repo inspection, implementation, debugging, tests, or developer tooling.
- All schedules must default to enabled=false. JARVIS OS should not silently start recurring automations.
- If the request implies a recurring cadence, include a schedule interval. Use 1d for daily, 7d for weekly, 6h for several times a day, 30m only for urgent monitors.
- Approval gates must cover external messages, file/code edits, memory writes, destructive actions, purchases, calendar/email sends, and anything using Codex.
- Memory policy should be conservative: capture summaries/decisions after human review, not raw everything.
- Tool plan should suggest capabilities but not over-assign tools.
- Operating spec must make the automation replayable: explicit inputs, outputs, success criteria, and failure modes.
- Evidence policy must say how the automation avoids confident unsourced claims.
- Execution policy must start manual-first unless the user explicitly requests an ongoing monitor, and even then the schedule stays paused.
- Make the blueprint professional enough that a non-expert could understand and safely install it.

User automation request:
${safeString(brief, '', 6000)}`;
}

function normalizeWorkflowDraft(value, brief = '', minds = {}) {
  const source = isPlainObject(value?.workflow) ? value.workflow : (isPlainObject(value) ? value : {});
  const catalog = workflowDraftMindCatalog(minds);
  const fallbackKey = catalog[0]?.key || '';
  const sourceSteps = Array.isArray(source.steps) ? source.steps : [];
  const steps = sourceSteps.map((step, index) => {
    const sourceStep = isPlainObject(step) ? step : {};
    const mindRef = safeString(sourceStep.mind || sourceStep.mindKey || sourceStep.agent || sourceStep.owner, '', 160);
    const resolved = resolveWorkflowMind(minds, mindRef) || (catalog[index % Math.max(catalog.length, 1)] ? resolveWorkflowMind(minds, catalog[index % catalog.length].key) : null);
    const action = safeString(sourceStep.action || sourceStep.prompt || sourceStep.instruction || sourceStep.task, '', 1800);
    if (!action || !resolved) return null;
    return { mind: resolved.key, provider: normalizeProviderId(sourceStep.provider), action, status: 'idle' };
  }).filter(Boolean).slice(0, 6);

  if (!steps.length && fallbackKey) {
    steps.push({
      mind: fallbackKey,
      provider: 'claude',
      action: `Complete a first useful pass for this outcome: ${safeString(brief, '', 1500)}`,
      status: 'idle',
    });
  }

  const name = safeString(source.name, '', 120) || `${titleCaseFromBrief(brief)} Workflow`;
  const description = safeString(source.description || source.summary, '', 500) || safeString(brief, '', 220);
  return {
    name,
    description,
    trigger: 'manual',
    steps,
    status: 'idle',
    notes: safeString(source.notes || source.rationale || source.reviewNotes, '', 1000),
  };
}

function normalizeAutomationInterval(value) {
  const interval = safeString(value, '', 40).toLowerCase();
  return /^\d+(m|h|d)$/.test(interval) ? interval : '';
}

function normalizeAutomationMindKey(minds, mindRef, fallbackIndex = 0) {
  const catalog = workflowDraftMindCatalog(minds);
  const fallback = catalog[fallbackIndex % Math.max(catalog.length, 1)]?.key || '';
  const resolved = resolveWorkflowMind(minds, safeString(mindRef, '', 160)) || (fallback ? resolveWorkflowMind(minds, fallback) : null);
  return resolved?.key || fallback;
}

function normalizeToolSuggestion(value) {
  const tool = safeString(value, '', 80).toLowerCase();
  return AUTOMATION_TOOL_IDS.includes(tool) ? tool : '';
}

function normalizeAutomationDraft(value, brief = '', minds = {}) {
  const source = isPlainObject(value) ? value : {};
  const workflowSource = isPlainObject(source.workflow) ? source.workflow : source;
  const workflow = normalizeWorkflowDraft({
    ...workflowSource,
    name: workflowSource.name || source.name,
    description: workflowSource.description || source.summary,
    notes: workflowSource.notes || source.notes,
  }, brief, minds);
  const catalog = workflowDraftMindCatalog(minds);
  const leadMind = normalizeAutomationMindKey(minds, source.schedule?.mind || source.leadMind || workflow.steps[0]?.mind || catalog[0]?.key, 0);
  const targetMind = normalizeAutomationMindKey(minds, source.memoryPolicy?.targetMind || leadMind, 0);
  const scheduleSource = isPlainObject(source.schedule) ? source.schedule : {};
  const hasScheduleIntent = !!safeString(scheduleSource.interval || scheduleSource.cadence || '', '', 40);
  const scheduleInterval = normalizeAutomationInterval(scheduleSource.interval || scheduleSource.cadence);
  const schedule = {
    enabled: false,
    mind: leadMind,
    name: safeString(scheduleSource.name, workflow.name, 120) || workflow.name,
    interval: scheduleInterval,
    action: safeString(scheduleSource.action || scheduleSource.prompt, '', 2500) || `Run the ${workflow.name} automation for this request: ${safeString(brief, '', 1200)}. Use Review Center before taking external action or writing durable memory.`,
    rationale: safeString(scheduleSource.rationale || scheduleSource.reason, '', 600) || (hasScheduleIntent ? 'Cadence inferred from the automation request.' : 'Manual automation; enable a schedule only when the loop is ready.'),
  };

  const toolPlan = (Array.isArray(source.toolPlan) ? source.toolPlan : [])
    .map((item, index) => {
      const plan = isPlainObject(item) ? item : {};
      const mind = normalizeAutomationMindKey(minds, plan.mind, index);
      const tools = safeStringArray(plan.tools, 12, 80).map(normalizeToolSuggestion).filter(Boolean);
      if (!mind || !tools.length) return null;
      return {
        mind,
        tools: [...new Set(tools)].slice(0, 8),
        reason: safeString(plan.reason || plan.rationale, '', 500),
      };
    })
    .filter(Boolean)
    .slice(0, 8);

  const approvalSource = isPlainObject(source.approvalPolicy) ? source.approvalPolicy : {};
  const risk = safeString(approvalSource.riskLevel, 'medium', 20).toLowerCase();
  const gates = uniqueStrings(approvalSource.gates, 10, 180);
  const codexSteps = workflow.steps.filter(step => step.provider === 'codex').length;
  if (codexSteps && !gates.some(gate => gate.toLowerCase().includes('codex'))) gates.push('Approve Codex-backed steps before execution.');
  if (schedule.interval && !gates.some(gate => gate.toLowerCase().includes('schedule'))) gates.push('Enable the recurring schedule only after reviewing the first manual run.');

  const operatingSource = isPlainObject(source.operatingSpec) ? source.operatingSpec : {};
  const operatingSpec = {
    inputs: uniqueStrings(operatingSource.inputs || source.inputs, 8, 180),
    outputs: uniqueStrings(operatingSource.outputs || source.outputs, 8, 180),
    successCriteria: uniqueStrings(operatingSource.successCriteria || source.successCriteria, 8, 180),
    failureModes: uniqueStrings(operatingSource.failureModes || source.failureModes, 8, 180),
  };
  if (!operatingSpec.inputs.length) operatingSpec.inputs.push('A plain-language request, relevant JARVIS OS memory, and any connected tool context the user has approved.');
  if (!operatingSpec.outputs.length) operatingSpec.outputs.push('A reviewable workflow trace, concise summary, and next-action recommendations.');
  if (!operatingSpec.successCriteria.length) operatingSpec.successCriteria.push('The user can inspect the run, understand the sources and tradeoffs, and safely decide what to approve next.');
  if (!operatingSpec.failureModes.length) operatingSpec.failureModes.push('Missing context, unavailable tools, low-confidence findings, or any action that requires user approval.');

  const evidenceSource = isPlainObject(source.evidencePolicy) ? source.evidencePolicy : {};
  const evidencePolicy = {
    sourceRequirements: uniqueStrings(evidenceSource.sourceRequirements || evidenceSource.sources, 8, 180),
    validationChecks: uniqueStrings(evidenceSource.validationChecks || evidenceSource.checks, 8, 180),
  };
  if (!evidencePolicy.sourceRequirements.length) evidencePolicy.sourceRequirements.push('Cite sources, logs, files, screenshots, datasets, or connector records for factual claims.');
  if (!evidencePolicy.validationChecks.length) evidencePolicy.validationChecks.push('Run a first manual pass and review outputs before enabling recurrence or external actions.');

  const executionSource = isPlainObject(source.executionPolicy) ? source.executionPolicy : {};
  const executionModeFallback = schedule.interval ? 'scheduled-after-review' : 'manual-first';
  const executionPolicy = {
    mode: safeString(executionSource.mode, '', 120) || executionModeFallback,
    retry: safeString(executionSource.retry, '', 240) || 'Retry only after checking the failed step, missing tool, or stale context; stop after repeated low-confidence output.',
    budget: safeString(executionSource.budget, '', 240) || 'Prefer the smallest useful run; summarize tool use and ask before expensive or long-running work.',
    escalation: safeString(executionSource.escalation, '', 240) || 'Ask the user when approval, credentials, external sending, destructive edits, or ambiguous priorities are required.',
  };

  const memorySource = isPlainObject(source.memoryPolicy) ? source.memoryPolicy : {};
  const capture = ['none', 'summary', 'decisions', 'full'].includes(safeString(memorySource.capture, 'summary', 40).toLowerCase())
    ? safeString(memorySource.capture, 'summary', 40).toLowerCase()
    : 'summary';
  const whatToRemember = uniqueStrings(memorySource.whatToRemember || memorySource.items, 8, 180);

  return {
    name: safeString(source.name, workflow.name, 120) || workflow.name,
    summary: safeString(source.summary || workflow.description, '', 500) || workflow.description,
    operatingSpec,
    workflow,
    schedule,
    toolPlan,
    evidencePolicy,
    executionPolicy,
    approvalPolicy: {
      riskLevel: ['low', 'medium', 'high'].includes(risk) ? risk : 'medium',
      humanReview: approvalSource.humanReview !== false,
      gates: gates.length ? gates.slice(0, 12) : ['Review the first run before enabling recurring execution.', 'Approve durable memory writes before saving lessons.'],
    },
    memoryPolicy: {
      capture,
      targetMind,
      reviewRequired: memorySource.reviewRequired !== false,
      whatToRemember: whatToRemember.length ? whatToRemember : ['Useful decisions, durable preferences, recurring project context, and follow-up obligations.'],
    },
    reviewChecklist: uniqueStrings(source.reviewChecklist, 10, 180),
    notes: safeString(source.notes || source.rationale, '', 1200),
  };
}

function markdownList(items) {
  const list = uniqueStrings(items, 12, 240);
  return list.length ? list.map(item => `- ${item}`).join('\n') : '- None yet.';
}

function buildMindSoulContent(name, draft) {
  if (draft.soul) {
    const body = draft.soul.replace(/^#.*$/m, '').trim();
    return `# SOUL.MD - ${name}\n\n${body}\n`;
  }
  return `# SOUL.MD - ${name}

## Mission
${draft.tagline}

## Operating Style
- Personality: ${draft.personality}
- Domains: ${draft.specialties.join(', ') || 'Generalist'}
- Default stance: clarify the real objective, reason from context, and produce usable next steps.

## Strengths
${markdownList(draft.specialties.map(item => `${item} work with clear reasoning and practical outputs`))}

## Failure Modes
- ${draft.guardrail}

## Collaboration Contract
- Ask when missing information would materially change the answer.
- Separate known facts from assumptions.
- Prefer concrete deliverables over vague advice.
`;
}

function buildMindCriticalFactsContent(name, draft) {
  if (draft.criticalFacts) {
    const body = draft.criticalFacts.replace(/^#.*$/m, '').trim();
    return `# L1 Critical Facts - ${name}\n\n${body}\n`;
  }
  return `# L1 Critical Facts - ${name}

## Owner Context
- No private owner facts have been provided yet.

## Active Work
- This mind was created to help with: ${draft.tagline}

## Working Agreements
- Main guardrail: ${draft.guardrail}
- Load capability context from memory/cortex-capabilities.md when available.
`;
}

function buildStarterMindRegistryEntry(meta, key, folder) {
  const source = isPlainObject(meta) ? meta : {};
  return normalizeMind({
    ...source,
    name: source.name || key,
    emoji: source.emoji || source.icon,
    tagline: source.tagline || source.subtitle,
    personality: source.personality || source.description,
    specialties: Array.isArray(source.specialties) ? source.specialties : source.tags,
    folder,
    status: source.status || 'active',
    memory: source.memory ?? 0,
    sessions: source.sessions ?? 0,
    lastActive: source.lastActive || 'Just now',
    modes: source.modes || [],
    guardrail: source.guardrail || '',
    distillation: source.distillation || { compressionRatio: 0, tokensRecovered: 0, avgRestoreMs: 0, sessionsDistilled: 0 },
    capabilities: isPlainObject(source.capabilities) ? source.capabilities : defaultSystemCapabilities(),
    schedules: Array.isArray(source.schedules) ? source.schedules : [],
    mcpTools: isPlainObject(source.mcpTools) ? source.mcpTools : {},
  }, key, { resetRunning: true });
}

function normalizeMinds(value, options = {}) {
  if (!isPlainObject(value)) return {};
  return Object.fromEntries(Object.entries(value).map(([key, mind]) => {
    const normalizedKey = safeString(key, '', 120);
    if (!normalizedKey || !isPlainObject(mind)) return null;
    return [normalizedKey, normalizeMind(mind, normalizedKey, options)];
  }).filter(Boolean));
}

function normalizeWorkflowStep(value) {
  const source = isPlainObject(value) ? value : {};
  const allowedStatuses = new Set(['idle', 'running', 'complete', 'error']);
  const status = allowedStatuses.has(source.status) ? source.status : 'idle';
  return {
    ...source,
    mind: safeString(source.mind, '', 160),
    provider: normalizeProviderId(source.provider),
    action: safeString(source.action, '', 4000),
    status,
    output: safeString(source.output, '', 200000),
    duration_ms: safeNumber(source.duration_ms, 0, 0),
    cost_usd: safeNumber(source.cost_usd, 0, 0),
  };
}

function normalizeWorkflow(value, id, { resetStaleRunning = false } = {}) {
  const source = isPlainObject(value) ? value : {};
  const allowedStatuses = new Set(['idle', 'running', 'complete', 'error']);
  const allowedTriggers = new Set(['manual', 'schedule', 'mesh']);
  let status = allowedStatuses.has(source.status) ? source.status : 'idle';
  if (resetStaleRunning && status === 'running' && (!activeWorkflows || !activeWorkflows.has(id))) status = 'error';
  return {
    ...source,
    name: safeString(source.name, id, 180) || id,
    description: safeString(source.description, '', 1000),
    trigger: allowedTriggers.has(source.trigger) ? source.trigger : 'manual',
    status,
    lastRunContext: safeString(source.lastRunContext, '', 12000),
    lastRunAt: normalizeISODateString(source.lastRunAt),
    created: safeString(source.created, '', 80),
    steps: Array.isArray(source.steps) ? source.steps.map(normalizeWorkflowStep) : [],
  };
}

function normalizeWorkflows(value, options = {}) {
  if (!isPlainObject(value)) return {};
  return Object.fromEntries(Object.entries(value).map(([id, workflow]) => {
    const normalizedId = safeString(id, '', 120);
    if (!normalizedId || !isPlainObject(workflow)) return null;
    return [normalizedId, normalizeWorkflow(workflow, normalizedId, options)];
  }).filter(Boolean));
}

function normalizeActivity(value) {
  if (!Array.isArray(value)) return [];
  return value.filter(isPlainObject).map((event, idx) => {
    const timestamp = safeString(event.timestamp, '', 80);
    const parsed = timestamp ? new Date(timestamp) : null;
    const fallbackId = 'evt-' + Date.now() + '-' + idx;
    return {
      ...event,
      id: safeString(event.id, '', 160) || fallbackId,
      timestamp: parsed && !Number.isNaN(parsed.getTime()) ? timestamp : new Date().toISOString(),
      status: safeString(event.status, 'complete', 80) || 'complete',
      type: safeString(event.type, 'event', 120) || 'event',
      title: safeString(event.title, 'Activity', 240) || 'Activity',
      desc: safeString(event.desc, '', 2000),
      mind: safeString(event.mind, 'system', 160) || 'system',
      tags: safeStringArray(event.tags, 30, 80),
      durationMs: safeNumber(event.durationMs, 0, 0),
      costUsd: safeNumber(event.costUsd, 0, 0),
    };
  }).sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp)).slice(0, 500);
}

function normalizeMeshMessage(value, idx = 0) {
  if (!isPlainObject(value)) return null;
  const allowedTypes = new Set(['handoff', 'query', 'broadcast', 'response']);
  const allowedStatuses = new Set(['pending', 'processing', 'complete', 'error']);
  const timestamp = safeString(value.timestamp, '', 80);
  const parsed = timestamp ? new Date(timestamp) : null;
  return {
    ...value,
    id: safeString(value.id, '', 160) || `msg-${Date.now()}-${idx}`,
    from: safeString(value.from, 'Unknown', 160) || 'Unknown',
    to: safeString(value.to, 'Unknown', 160) || 'Unknown',
    type: allowedTypes.has(value.type) ? value.type : 'handoff',
    subject: safeString(value.subject, 'No subject', 240) || 'No subject',
    body: safeString(value.body, '', 200000),
    status: allowedStatuses.has(value.status) ? value.status : 'pending',
    timestamp: parsed && !Number.isNaN(parsed.getTime()) ? timestamp : new Date().toISOString(),
  };
}

function normalizeMeshMessages(value) {
  if (!Array.isArray(value)) return [];
  return value
    .map((message, idx) => normalizeMeshMessage(message, idx))
    .filter(Boolean)
    .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp))
    .slice(0, 1000);
}

function copyDirRecursive(sourceDir, destDir) {
  fs.mkdirSync(destDir, { recursive: true });
  const entries = fs.readdirSync(sourceDir, { withFileTypes: true });
  for (const entry of entries) {
    const sourcePath = path.join(sourceDir, entry.name);
    const destPath = path.join(destDir, entry.name);
    if (entry.isDirectory()) {
      copyDirRecursive(sourcePath, destPath);
    } else if (entry.isSymbolicLink()) {
      fs.symlinkSync(fs.readlinkSync(sourcePath), destPath);
    } else if (entry.isFile()) {
      fs.copyFileSync(sourcePath, destPath);
    }
  }
}

function emptyFolder(folderPath) {
  if (!fs.existsSync(folderPath) || !fs.lstatSync(folderPath).isDirectory()) return;
  for (const entry of fs.readdirSync(folderPath)) {
    fs.rmSync(path.join(folderPath, entry), { recursive: true, force: true });
  }
}

function rollbackInstallTargets(targets) {
  for (const target of [...targets].reverse()) {
    try {
      if (target.existedBefore) {
        emptyFolder(target.destDir);
      } else if (fs.existsSync(target.destDir)) {
        fs.rmSync(target.destDir, { recursive: true, force: true });
      }
    } catch (err) {
      console.warn('Unable to roll back starter install folder', target.destDir, err.message);
    }
    pendingCreatedMindFolders.delete(path.resolve(target.destDir));
  }
}

function trackCreatedMindFolder(folderPath, { existedBefore = false } = {}) {
  const resolved = assertSafeFolderTarget(folderPath);
  pendingCreatedMindFolders.set(resolved, { existedBefore: !!existedBefore });
  return resolved;
}

function commitCreatedMindFolders(folderPaths) {
  const committed = [];
  const uniquePaths = [...new Set((Array.isArray(folderPaths) ? folderPaths : [folderPaths]).map(folderPath => safeString(folderPath, '', 4000)).filter(Boolean))];
  for (const folderPath of uniquePaths) {
    try {
      const resolved = assertSafeFolderTarget(folderPath);
      if (pendingCreatedMindFolders.delete(resolved)) committed.push(resolved);
    } catch {}
  }
  return { ok: true, committed };
}

function assertCleanupCreatedMindFolder(folderPath) {
  const resolved = assertSafeFolderTarget(folderPath);
  const pending = pendingCreatedMindFolders.get(resolved);
  if (!pending) throw new Error('Cleanup target was not created by this JARVIS OS setup flow');
  if (!fs.existsSync(resolved)) return { resolved, pending };
  const stat = fs.lstatSync(resolved);
  if (!stat.isDirectory()) throw new Error('Cleanup target is not a folder');
  const registered = getRegisteredMindRoots().some(root => root === resolved);
  if (registered) throw new Error('Refusing to clean up a registered mind folder');
  if (!looksLikeMindFolder(resolved)) throw new Error('Cleanup target does not look like a JARVIS OS-created mind folder');
  return { resolved, pending };
}

function cleanupCreatedMindFolders(folderPaths) {
  const removed = [];
  const skipped = [];
  const errors = [];
  const uniquePaths = [...new Set((Array.isArray(folderPaths) ? folderPaths : [folderPaths]).map(folderPath => safeString(folderPath, '', 4000)).filter(Boolean))];

  for (const folderPath of uniquePaths) {
    try {
      const { resolved, pending } = assertCleanupCreatedMindFolder(folderPath);
      if (!fs.existsSync(resolved)) {
        skipped.push(resolved);
        pendingCreatedMindFolders.delete(resolved);
        continue;
      }
      if (pending.existedBefore) {
        emptyFolder(resolved);
      } else {
        fs.rmSync(resolved, { recursive: true, force: true });
      }
      pendingCreatedMindFolders.delete(resolved);
      removed.push(resolved);
    } catch (err) {
      errors.push({ folder: String(folderPath || ''), error: err.message });
    }
  }

  return {
    ok: errors.length === 0,
    removed,
    skipped,
    errors,
    error: errors[0]?.error || '',
  };
}

function expandUserPath(value) {
  const raw = safeString(value, '', 4000);
  if (!raw) throw new Error('Path is required');
  if (raw === '~') return os.homedir();
  if (raw.startsWith('~/') || raw.startsWith('~\\')) return path.resolve(os.homedir(), raw.slice(2));
  return path.resolve(raw);
}

function isPathInside(parentPath, candidatePath, { allowSame = false } = {}) {
  const parent = path.resolve(parentPath);
  const candidate = path.resolve(candidatePath);
  const relative = path.relative(parent, candidate);
  if (!relative) return allowSame;
  return !relative.startsWith('..') && !path.isAbsolute(relative);
}

function isProtectedPath(candidatePath) {
  const resolved = path.resolve(candidatePath);
  const root = path.parse(resolved).root;
  return resolved === root ||
    resolved === path.resolve(os.homedir()) ||
    resolved === path.resolve(CONFIG_DIR) ||
    isPathInside(CONFIG_DIR, resolved, { allowSame: true });
}

function assertSafeFolderTarget(folderPath) {
  const resolved = expandUserPath(folderPath);
  if (isProtectedPath(resolved)) throw new Error('Refusing to operate on a protected folder');
  return resolved;
}

function assertEmptyOrMissingFolder(folderPath, label = 'Destination folder') {
  const resolved = assertSafeFolderTarget(folderPath);
  if (!fs.existsSync(resolved)) return resolved;
  const stat = fs.lstatSync(resolved);
  if (!stat.isDirectory()) throw new Error(`${label} is not a folder`);
  if (fs.readdirSync(resolved).length > 0) throw new Error(`${label} already exists and is not empty`);
  return resolved;
}

function getRegisteredMindRoots() {
  const minds = normalizeMinds(loadJSON(MINDS_FILE));
  return Object.values(minds)
    .map(mind => {
      try { return mind.folder ? expandUserPath(mind.folder) : null; }
      catch { return null; }
    })
    .filter(Boolean);
}

function getAllowedContentRoots() {
  return [...getRegisteredMindRoots(), path.resolve(SHARED_MEM_DIR)];
}

function assertAllowedContentPath(filePath) {
  const resolved = expandUserPath(filePath);
  const allowed = getAllowedContentRoots().some(root => isPathInside(root, resolved));
  if (!allowed) throw new Error('File is outside JARVIS OS-managed mind or shared-memory folders');
  return resolved;
}

const MEMORY_IMPORT_TEXT_EXTENSIONS = new Set([
  '.md', '.markdown', '.txt', '.csv', '.tsv', '.json', '.jsonl', '.yaml', '.yml',
  '.js', '.jsx', '.ts', '.tsx', '.mjs', '.cjs', '.css', '.scss', '.html', '.xml',
  '.py', '.rb', '.go', '.rs', '.java', '.kt', '.swift', '.php', '.sh', '.zsh',
  '.sql', '.toml', '.ini', '.env', '.log'
]);
const MEMORY_IMPORT_EXCLUDED_DIRS = new Set([
  '.git', 'node_modules', 'dist', 'build', '.next', '.turbo', '.cache', 'coverage',
  'vendor', '.venv', 'venv', '__pycache__', '.DS_Store'
]);

function assertImportSourcePath(sourcePath) {
  const resolved = expandUserPath(sourcePath);
  if (!fs.existsSync(resolved)) throw new Error('Import source not found');
  const root = path.parse(resolved).root;
  if (resolved === root || resolved === path.resolve(os.homedir()) || resolved === path.resolve(CONFIG_DIR)) {
    throw new Error('Choose a specific file or project folder, not a protected top-level folder');
  }
  return resolved;
}

function isMemoryImportTextFile(filePath) {
  const base = path.basename(filePath);
  if (base.startsWith('.env')) return true;
  return MEMORY_IMPORT_TEXT_EXTENSIONS.has(path.extname(filePath).toLowerCase());
}

function readImportTextFile(filePath, maxBytes = 18000) {
  const stat = fs.statSync(filePath);
  if (!stat.isFile() || stat.size <= 0 || stat.size > 2 * 1024 * 1024) return null;
  if (!isMemoryImportTextFile(filePath)) return null;
  const fd = fs.openSync(filePath, 'r');
  try {
    const buffer = Buffer.alloc(Math.min(stat.size, maxBytes));
    const bytesRead = fs.readSync(fd, buffer, 0, buffer.length, 0);
    const text = buffer.subarray(0, bytesRead).toString('utf8').replace(/\0/g, '');
    if (!text.trim()) return null;
    return { text, size: stat.size, truncated: stat.size > bytesRead };
  } finally {
    fs.closeSync(fd);
  }
}

function collectMemoryImportSource(sourcePath) {
  const resolved = assertImportSourcePath(sourcePath);
  const stat = fs.statSync(resolved);
  const files = [];
  let bytes = 0;
  const maxFiles = 50;
  const maxBytes = 140000;

  const addFile = (filePath, relativePath) => {
    if (files.length >= maxFiles || bytes >= maxBytes) return;
    let read;
    try { read = readImportTextFile(filePath, Math.min(18000, maxBytes - bytes)); } catch { return; }
    if (!read) return;
    files.push({
      path: filePath,
      relativePath: safeString(relativePath || path.basename(filePath), path.basename(filePath), 500),
      size: read.size,
      truncated: read.truncated,
      text: read.text.slice(0, Math.max(0, maxBytes - bytes)),
    });
    bytes += files[files.length - 1].text.length;
  };

  const walk = (dir, prefix = '', depth = 0) => {
    if (files.length >= maxFiles || bytes >= maxBytes || depth > 5) return;
    let entries = [];
    try { entries = fs.readdirSync(dir, { withFileTypes: true }); } catch { return; }
    entries
      .filter(entry => !entry.name.startsWith('.') || entry.name === '.env')
      .sort((a, b) => Number(b.isFile()) - Number(a.isFile()) || a.name.localeCompare(b.name))
      .forEach(entry => {
        if (files.length >= maxFiles || bytes >= maxBytes) return;
        if (entry.isDirectory()) {
          if (MEMORY_IMPORT_EXCLUDED_DIRS.has(entry.name)) return;
          walk(path.join(dir, entry.name), prefix ? `${prefix}/${entry.name}` : entry.name, depth + 1);
        } else if (entry.isFile()) {
          const filePath = path.join(dir, entry.name);
          addFile(filePath, prefix ? `${prefix}/${entry.name}` : entry.name);
        }
      });
  };

  if (stat.isFile()) addFile(resolved, path.basename(resolved));
  else if (stat.isDirectory()) walk(resolved);
  else throw new Error('Import source must be a file or folder');

  if (!files.length) throw new Error('No readable text files found in the selected source');
  return {
    sourcePath: resolved,
    sourceName: path.basename(resolved),
    kind: stat.isDirectory() ? 'folder' : 'file',
    files,
    totalBytes: bytes,
    truncated: files.length >= maxFiles || bytes >= maxBytes || files.some(file => file.truncated),
  };
}

function buildMemoryImportBundle(source) {
  return source.files.map(file =>
    `--- FILE: ${file.relativePath} (${file.size} bytes${file.truncated ? ', excerpt truncated' : ''}) ---\n${file.text}`
  ).join('\n\n');
}

function buildMemoryImportPrompt({ source, title, targetMind }) {
  return `Create a durable JARVIS OS memory import for the target mind.

Return markdown only. Do not edit files directly.

Target mind: ${safeString(targetMind.name, '', 160)}
Mind role: ${safeString(targetMind.tagline || targetMind.personality, '', 500)}
Import title: ${safeString(title, '', 180)}
Source: ${source.sourcePath}
Source kind: ${source.kind}
Files included: ${source.files.length}${source.truncated ? ' (truncated excerpt set)' : ''}

Required markdown sections:
# ${safeString(title, source.sourceName, 180)}
## Source
## Executive Summary
## Durable Facts
## Decisions or Constraints
## Useful Details
## Open Questions
## Suggested Follow-ups
## Freshness

Rules:
- Preserve concrete facts, names, URLs, commands, constraints, and decisions.
- Say when evidence is excerpted or incomplete.
- Do not invent private facts beyond the source excerpts.
- Keep it concise enough to be loaded as memory later.

Source excerpts:
${buildMemoryImportBundle(source).slice(0, 140000)}`;
}

function uniqueMarkdownFilePath(dir, stem) {
  const safeStem = safeFileStem(stem, 'memory-import', 80).toLowerCase() || 'memory-import';
  let candidate = path.join(dir, `${safeStem}.md`);
  let suffix = 2;
  while (fs.existsSync(candidate)) candidate = path.join(dir, `${safeStem}-${suffix++}.md`);
  return candidate;
}

function normalizeGeneratedMarkdown(markdown, fallbackTitle) {
  const body = safeString(markdown, '', 200000);
  if (/^#\s+/m.test(body)) return body.trim() + '\n';
  return `# ${safeString(fallbackTitle, 'Memory Import', 180)}\n\n${body.trim()}\n`;
}

function buildWorkflowMemoryPrompt({ workflowId, workflow, targetMind }) {
  const steps = (workflow.steps || []).map((step, index) => ({
    index: index + 1,
    mind: step.mind,
    provider: normalizeProviderId(step.provider),
    action: safeString(step.action, '', 1000),
    status: safeString(step.status, 'idle', 80),
    output: safeString(step.output, '', 12000),
  }));
  return `Create durable JARVIS OS memory from this workflow run.

Return markdown only. Do not edit files directly.

Target mind: ${safeString(targetMind.name, '', 160)}
Workflow id: ${safeString(workflowId, '', 160)}
Workflow name: ${safeString(workflow.name, workflowId, 180)}
Workflow description: ${safeString(workflow.description, '', 500)}
Workflow status: ${safeString(workflow.status, 'idle', 80)}

Required markdown sections:
# Workflow Lesson: ${safeString(workflow.name, workflowId, 180)}
## What Happened
## Durable Lessons
## Reusable Pattern
## Decisions or Artifacts
## Failure Modes
## Next Time
## Freshness

Rules:
- Extract reusable lessons, decisions, constraints, and artifacts from the run.
- Do not pretend failed steps succeeded.
- Keep it concise and useful as future memory.
- Mention provider-specific observations only when useful.

Workflow steps and outputs:
${JSON.stringify(steps, null, 2).slice(0, 90000)}`;
}

function writeMindImportMemory(mind, title, markdown) {
  const folder = assertSafeFolderTarget(mind.folder);
  if (!fs.existsSync(folder) || !fs.statSync(folder).isDirectory()) throw new Error('Mind folder not found');
  const importsDir = path.join(folder, 'memory', 'imports');
  fs.mkdirSync(importsDir, { recursive: true });
  const date = new Date().toISOString().slice(0, 10);
  const filePath = uniqueMarkdownFilePath(importsDir, `${date}-${title}`);
  writeTextFileAtomic(filePath, markdown);
  return filePath;
}

function looksLikeMindFolder(folderPath) {
  return fs.existsSync(path.join(folderPath, 'CLAUDE.md')) ||
    fs.existsSync(path.join(folderPath, 'memory', 'soul.md')) ||
    fs.existsSync(path.join(folderPath, 'mind.json'));
}

function assertMindFolderOperation(folderPath, { requireRegistered = false, requireMindShape = false } = {}) {
  const resolved = assertSafeFolderTarget(folderPath);
  if (requireRegistered) {
    const registered = getRegisteredMindRoots().some(root => root === resolved);
    if (!registered) throw new Error('Folder is not registered as a JARVIS OS mind');
  }
  if (requireMindShape && fs.existsSync(resolved) && !looksLikeMindFolder(resolved)) {
    throw new Error('Folder does not look like a JARVIS OS mind folder');
  }
  return resolved;
}

// ── Window state ─────────────────────────────────────────────────
let mainWindow;
let windowBoundsSaveTimer = null;

function getWindowBounds() {
  const state = normalizeState(loadJSON(STATE_FILE));
  return state?.windowBounds || { width: 1200, height: 780 };
}

function saveWindowBounds() {
  if (!mainWindow) return;
  const bounds = mainWindow.getBounds();
  const state = normalizeState(loadJSON(STATE_FILE));
  state.windowBounds = bounds;
  saveJSON(STATE_FILE, state);
}

function scheduleWindowBoundsSave() {
  if (windowBoundsSaveTimer) clearTimeout(windowBoundsSaveTimer);
  windowBoundsSaveTimer = setTimeout(() => {
    windowBoundsSaveTimer = null;
    saveWindowBounds();
  }, 350);
}

function flushWindowBoundsSave() {
  if (windowBoundsSaveTimer) {
    clearTimeout(windowBoundsSaveTimer);
    windowBoundsSaveTimer = null;
  }
  saveWindowBounds();
}

// ── Theme ────────────────────────────────────────────────────────
function applyTheme(theme) {
  nativeTheme.themeSource = theme || 'light';
}

function getSavedTheme() {
  const state = normalizeState(loadJSON(STATE_FILE));
  return state?.theme || 'light';
}

// ── Window creation ──────────────────────────────────────────────
function createWindow() {
  const bounds = getWindowBounds();

  applyTheme(getSavedTheme());

  mainWindow = new BrowserWindow({
    width:  bounds.width,
    height: bounds.height,
    x: bounds.x,
    y: bounds.y,
    minWidth: 900,
    minHeight: 600,
    titleBarStyle: 'hiddenInset',
    trafficLightPosition: { x: 18, y: 18 },
    backgroundColor: getSavedTheme() === 'dark' ? '#0f0e17' : '#f5f4f9',
    show: false,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      nodeIntegration: false,
      contextIsolation: true,
    },
  });

  mainWindow.webContents.on('console-message', (_event, level, message, line, sourceId) => {
    if (!process.env.CORTEX_DEBUG_RENDERER) return;
    const levels = ['log', 'warn', 'error', 'debug'];
    console.log(`[renderer:${levels[level] || level}] ${message}${sourceId ? ` (${path.basename(sourceId)}:${line})` : ''}`);
  });
  mainWindow.webContents.on('render-process-gone', (_event, details) => {
    console.warn('Renderer process exited:', details.reason, details.exitCode);
  });

  mainWindow.loadFile('index.html');
  mainWindow.once('ready-to-show', () => mainWindow.show());

  // Save window bounds after resize/move settles, then flush once on close.
  mainWindow.on('resize', scheduleWindowBoundsSave);
  mainWindow.on('move',   scheduleWindowBoundsSave);
  mainWindow.on('close',  flushWindowBoundsSave);

  mainWindow.on('closed', () => { mainWindow = null; });
}

// ── Menu bar ─────────────────────────────────────────────────────
function buildMenu() {
  const template = [
    {
      label: app.name,
      submenu: [
        { role: 'about' },
        { type: 'separator' },
        {
          label: 'Settings\u2026',
          accelerator: 'CmdOrCtrl+,',
          click: () => mainWindow?.webContents.send('navigate', 'settings'),
        },
        { type: 'separator' },
        { role: 'hide' },
        { role: 'hideOthers' },
        { role: 'unhide' },
        { type: 'separator' },
        { role: 'quit' },
      ],
    },
    {
      label: 'File',
      submenu: [
        {
          label: 'New Mind',
          accelerator: 'CmdOrCtrl+N',
          click: () => mainWindow?.webContents.send('action', 'new-mind'),
        },
        { type: 'separator' },
        {
          label: 'Command Palette',
          accelerator: 'CmdOrCtrl+K',
          click: () => mainWindow?.webContents.send('action', 'command-palette'),
        },
      ],
    },
    {
      label: 'Edit',
      submenu: [
        { role: 'undo' },
        { role: 'redo' },
        { type: 'separator' },
        { role: 'cut' },
        { role: 'copy' },
        { role: 'paste' },
        { role: 'selectAll' },
      ],
    },
    {
      label: 'View',
      submenu: [
        { role: 'reload' },
        { role: 'forceReload' },
        { role: 'toggleDevTools' },
        { type: 'separator' },
        { role: 'resetZoom' },
        { role: 'zoomIn' },
        { role: 'zoomOut' },
        { type: 'separator' },
        { role: 'togglefullscreen' },
      ],
    },
    {
      label: 'Window',
      submenu: [
        { role: 'minimize' },
        { role: 'zoom' },
        { type: 'separator' },
        { role: 'close' },
      ],
    },
  ];

  Menu.setApplicationMenu(Menu.buildFromTemplate(template));
}


// ══════════════════════════════════════════════════════════════════
// IPC HANDLERS
// ══════════════════════════════════════════════════════════════════

// ── Open Claude Cowork ───────────────────────────────────────────
ipcMain.handle('open-folder', async (_, folderPath) => {
  try {
    const expanded = assertMindFolderOperation(folderPath, { requireRegistered: true });
    if (!fs.existsSync(expanded) || !fs.statSync(expanded).isDirectory()) return { ok: false, error: 'Mind folder not found' };
    const encoded = encodeURIComponent(expanded);
    await shell.openExternal(`claude://cowork/new?folder=${encoded}`);
    return { ok: true };
  } catch (err) {
    return { ok: false, error: err.message };
  }
});

// ── Read a file from disk ────────────────────────────────────────
ipcMain.handle('read-file', async (_, filePath) => {
  try {
    const expanded = assertAllowedContentPath(filePath);
    if (!fs.existsSync(expanded)) return { ok: false, error: 'File not found' };
    if (!fs.statSync(expanded).isFile()) return { ok: false, error: 'Not a file' };
    const content = fs.readFileSync(expanded, 'utf8');
    return { ok: true, content };
  } catch (err) {
    return { ok: false, error: err.message };
  }
});

// ── Write a file to disk ─────────────────────────────────────────
ipcMain.handle('write-file', async (_, payload = {}) => {
  try {
    const { filePath, content } = payload;
    const expanded = assertAllowedContentPath(filePath);
    writeTextFileAtomic(expanded, content);
    return { ok: true };
  } catch (err) {
    return { ok: false, error: err.message };
  }
});

ipcMain.handle('select-import-source', async () => {
  try {
    const result = await dialog.showOpenDialog(mainWindow, {
      title: 'Choose a file or folder to import into JARVIS OS memory',
      properties: ['openFile', 'openDirectory'],
    });
    if (result.canceled || !result.filePaths?.length) return { ok: true, canceled: true };
    return { ok: true, path: result.filePaths[0] };
  } catch (err) {
    return { ok: false, error: err.message };
  }
});

ipcMain.handle('ingest-memory-source', async (_, payload = {}) => {
  try {
    const minds = normalizeMinds(loadJSON(MINDS_FILE));
    const mindKey = safeString(payload.mindKey, '', 120);
    const mind = minds[mindKey];
    if (!mind) return { ok: false, error: 'Target mind not found' };

    const title = safeString(payload.title, '', 180) || `Imported ${path.basename(String(payload.sourcePath || 'source'))}`;
    const provider = normalizeProviderId(payload.provider || normalizeState(loadJSON(STATE_FILE)).defaultProvider);
    const source = collectMemoryImportSource(payload.sourcePath);
    const prompt = buildMemoryImportPrompt({ source, title, targetMind: mind });

    let folder;
    try {
      folder = assertSafeFolderTarget(mind.folder);
    } catch (err) {
      return { ok: false, error: 'Mind folder is not usable: ' + err.message };
    }

    const result = await runProviderPrompt(provider, folder, prompt, { timeoutMs: 3 * 60 * 1000 });
    if (!result.ok) return result;

    const markdown = normalizeGeneratedMarkdown(result.result, title);
    const filePath = writeMindImportMemory(mind, title, markdown);
    return {
      ok: true,
      filePath,
      relativePath: path.relative(folder, filePath),
      title,
      sourcePath: source.sourcePath,
      filesIncluded: source.files.length,
      provider: normalizeProviderId(result.provider || provider),
      duration_ms: result.duration_ms || 0,
      cost_usd: result.cost_usd || 0,
    };
  } catch (err) {
    return { ok: false, error: err.message };
  }
});

// ── Scaffold a new mind folder ───────────────────────────────────
ipcMain.handle('scaffold-mind', async (_, payload = {}) => {
  let rollbackTarget = null;
  try {
    const { folderPath } = payload;
    const name = safeString(payload.name, 'Untitled Mind', 160) || 'Untitled Mind';
    const profile = isPlainObject(payload.profile) ? normalizeMindDraft({ ...payload.profile, name }, name) : null;
    const existedBefore = fs.existsSync(expandUserPath(folderPath));
    const expanded = assertEmptyOrMissingFolder(folderPath);
    rollbackTarget = { destDir: expanded, existedBefore };
    fs.mkdirSync(path.join(expanded, 'memory'), { recursive: true });
    fs.mkdirSync(path.join(expanded, '.claude', 'agents'), { recursive: true });
    fs.mkdirSync(path.join(expanded, 'owners-inbox'), { recursive: true });
    fs.mkdirSync(path.join(expanded, 'skills'), { recursive: true });
    fs.mkdirSync(path.join(expanded, 'logs'), { recursive: true });

    writeTextFileAtomic(path.join(expanded, 'CLAUDE.md'),
      `# ${name}\n\n> Identity lives in \`memory/soul.md\`. This file handles routing and operations.\n\n## Session Start\n1. Read \`memory/soul.md\`\n2. Read \`memory/L1-critical-facts.md\`\n3. Read \`memory/cortex-capabilities.md\` if present\n4. Check \`owners-inbox/\` for pending handoffs\n\n## Shared Memory\n- When using JARVIS OS MCP shared-memory tools, pass \`mind_name: "${name}"\` so JARVIS OS can enforce access control.\n- Read shared context before cross-mind work and write only durable decisions or project updates.\n`
    );

    writeTextFileAtomic(path.join(expanded, 'memory', 'soul.md'),
      profile ? buildMindSoulContent(name, profile) :
      `# SOUL.MD \u2014 ${name}\n\n> Define this mind's identity, personality, and operating philosophy here.\n> Use the JARVIS OS app to edit it, or open the folder in your editor.\n`
    );

    writeTextFileAtomic(path.join(expanded, 'memory', 'L1-critical-facts.md'),
      profile ? buildMindCriticalFactsContent(name, profile) :
      `# L1 Critical Facts \u2014 ${name}\n\n> High-priority facts this mind should load at the start of every session.\n> Keep this concise, current, and dated when facts change.\n\n## Owner Context\n- [Add stable facts this mind should never miss]\n\n## Active Work\n- [Add current projects, constraints, or preferences]\n`
    );

    trackCreatedMindFolder(expanded, { existedBefore });
    return { ok: true };
  } catch (err) {
    if (rollbackTarget) rollbackInstallTargets([rollbackTarget]);
    return { ok: false, error: err.message };
  }
});

// ── Clean up unregistered folders created by failed setup flows ──
ipcMain.handle('cleanup-created-mind-folders', async (_, folderPaths) => {
  const result = cleanupCreatedMindFolders(folderPaths);
  return result.ok ? result : { ...result, error: result.error || 'Unable to clean up created folders' };
});

ipcMain.handle('commit-created-mind-folders', async (_, folderPaths) => commitCreatedMindFolders(folderPaths));

// ── Duplicate an existing mind folder ────────────────────────────
ipcMain.handle('copy-mind-folder', async (_, payload = {}) => {
  let dest;
  try {
    const { sourcePath, destPath } = payload;
    const source = assertMindFolderOperation(sourcePath, { requireRegistered: true });
    dest = assertSafeFolderTarget(destPath);
    if (!fs.existsSync(source)) return { ok: false, error: 'Source folder not found' };
    if (!fs.statSync(source).isDirectory()) return { ok: false, error: 'Source is not a folder' };
    if (fs.existsSync(dest)) return { ok: false, error: 'Destination already exists' };
    if (isPathInside(source, dest, { allowSame: true })) return { ok: false, error: 'Destination cannot be inside the source folder' };
    copyDirRecursive(source, dest);
    trackCreatedMindFolder(dest);
    return { ok: true };
  } catch (err) {
    try {
      if (fs.existsSync(dest)) fs.rmSync(dest, { recursive: true, force: true });
    } catch {}
    return { ok: false, error: err.message };
  }
});

// ── Scan a mind folder (real file metadata) ──────────────────────
ipcMain.handle('scan-folder', async (_, folderPath) => {
  try {
    const expanded = assertSafeFolderTarget(folderPath);
    if (!fs.existsSync(expanded)) return { ok: false, error: 'Folder not found' };
    if (!fs.statSync(expanded).isDirectory()) return { ok: false, error: 'Not a folder' };
    const files = [];
    const scan = (dir, prefix) => {
      let entries;
      try { entries = fs.readdirSync(dir, { withFileTypes: true }); } catch { return; }
      for (const entry of entries) {
        if (entry.name.startsWith('.')) continue;
        const fullPath = path.join(dir, entry.name);
        if (entry.isFile()) {
          const stat = fs.statSync(fullPath);
          files.push({
            name: entry.name,
            path: fullPath,
            relativePath: prefix ? `${prefix}/${entry.name}` : entry.name,
            size: stat.size,
            modified: stat.mtime.toISOString(),
            isMemory: prefix === 'memory' || prefix?.startsWith('memory/'),
          });
        } else if (entry.isDirectory()) {
          scan(fullPath, prefix ? `${prefix}/${entry.name}` : entry.name);
        }
      }
    };
    scan(expanded, '');
    return { ok: true, files };
  } catch (err) {
    return { ok: false, error: err.message };
  }
});

// ── Delete a mind folder (move to Trash) ─────────────────────────
ipcMain.handle('delete-folder', async (_, folderPath) => {
  try {
    const expanded = assertMindFolderOperation(folderPath, { requireMindShape: true });
    if (!fs.existsSync(expanded)) return { ok: false, error: 'Folder not found' };
    if (!fs.statSync(expanded).isDirectory()) return { ok: false, error: 'Not a folder' };
    await shell.trashItem(expanded);
    return { ok: true };
  } catch (err) {
    return { ok: false, error: err.message };
  }
});

// ── Reveal in Finder ─────────────────────────────────────────────
ipcMain.handle('reveal-in-finder', async (_, folderPath) => {
  try {
    const expanded = assertMindFolderOperation(folderPath, { requireRegistered: true });
    if (!fs.existsSync(expanded)) return { ok: false, error: 'Folder not found' };
    shell.showItemInFolder(expanded);
    return { ok: true };
  } catch (err) {
    return { ok: false, error: err.message };
  }
});

// ── Save / Load app state ────────────────────────────────────────
ipcMain.handle('save-state', async (_, state) => {
  try {
    const existing = normalizeState(loadJSON(STATE_FILE));
    const incoming = normalizeState(state, { defaults: false });
    const merged = normalizeState({ ...existing, ...incoming });
    saveJSON(STATE_FILE, merged);
    if (incoming.theme) applyTheme(incoming.theme);
    return { ok: true };
  } catch (err) {
    return { ok: false, error: err.message };
  }
});

ipcMain.handle('load-state', async () => {
  try {
    const state = normalizeState(loadJSON(STATE_FILE));
    return { ok: true, state };
  } catch (err) {
    return { ok: false, error: err.message };
  }
});

// ── Save / Load minds data ───────────────────────────────────────
ipcMain.handle('save-minds', async (_, mindsData) => {
  try {
    saveJSON(MINDS_FILE, normalizeMinds(mindsData));
    return { ok: true };
  } catch (err) {
    return { ok: false, error: err.message };
  }
});

ipcMain.handle('load-minds', async () => {
  try {
    const data = normalizeMinds(loadJSON(MINDS_FILE), { resetRunning: true });
    return { ok: true, minds: data };
  } catch (err) {
    return { ok: false, error: err.message };
  }
});

// ── Mesh (inter-mind messaging) ──────────────────────────────────
ipcMain.handle('load-mesh', async () => {
  try {
    return { ok: true, messages: normalizeMeshMessages(loadJSON(MESH_FILE)) };
  }
  catch (err) { return { ok: false, error: err.message }; }
});

ipcMain.handle('save-mesh', async (_, messages) => {
  try { saveJSON(MESH_FILE, normalizeMeshMessages(messages)); return { ok: true }; }
  catch (err) { return { ok: false, error: err.message }; }
});

// ── Workflows ────────────────────────────────────────────────────
ipcMain.handle('load-workflows', async () => {
  try { return { ok: true, workflows: normalizeWorkflows(loadJSON(WORKFLOWS_FILE), { resetStaleRunning: true }) }; }
  catch (err) { return { ok: false, error: err.message }; }
});

ipcMain.handle('save-workflows', async (_, workflows) => {
  try { saveJSON(WORKFLOWS_FILE, normalizeWorkflows(workflows)); return { ok: true }; }
  catch (err) { return { ok: false, error: err.message }; }
});

// ── Activity ─────────────────────────────────────────────────────
ipcMain.handle('load-activity', async () => {
  try { return { ok: true, activity: normalizeActivity(loadJSON(ACTIVITY_FILE)) }; }
  catch (err) { return { ok: false, error: err.message }; }
});

ipcMain.handle('save-activity', async (_, activity) => {
  try { saveJSON(ACTIVITY_FILE, normalizeActivity(activity)); return { ok: true }; }
  catch (err) { return { ok: false, error: err.message }; }
});

// ── Schedules ────────────────────────────────────────────────────
let activeTimers = {};
const MIN_SCHEDULE_INTERVAL_MS = 60 * 1000;
const MAX_SCHEDULE_INTERVAL_MS = 30 * 24 * 60 * 60 * 1000;

function normalizeScheduleIntervalMs(value) {
  const ms = Number(value);
  if (!Number.isFinite(ms) || !Number.isInteger(ms)) throw new Error('Schedule interval must be a whole number of milliseconds');
  if (ms < MIN_SCHEDULE_INTERVAL_MS) throw new Error('Schedule interval must be at least 1 minute');
  if (ms > MAX_SCHEDULE_INTERVAL_MS) throw new Error('Schedule interval cannot exceed 30 days');
  return ms;
}

function scheduleTimerKey(mindKey, scheduleId) {
  const normalizedMindKey = safeString(mindKey, '', 120);
  const normalizedScheduleId = safeString(scheduleId, '', 160);
  if (!normalizedScheduleId) throw new Error('Schedule id is required');
  return normalizedMindKey ? `${normalizedMindKey}::${normalizedScheduleId}` : normalizedScheduleId;
}

function stopScheduleTimer(timerKey) {
  if (!activeTimers[timerKey]) return false;
  clearInterval(activeTimers[timerKey]);
  delete activeTimers[timerKey];
  return true;
}

function stopScheduleTimers(mindKey, scheduleId) {
  const normalizedMindKey = safeString(mindKey, '', 120);
  const normalizedScheduleId = safeString(scheduleId, '', 160);
  if (!normalizedScheduleId) return 0;
  if (normalizedMindKey) return stopScheduleTimer(scheduleTimerKey(normalizedMindKey, normalizedScheduleId)) ? 1 : 0;
  return Object.keys(activeTimers)
    .filter(key => key === normalizedScheduleId || key.endsWith(`::${normalizedScheduleId}`))
    .reduce((count, key) => count + (stopScheduleTimer(key) ? 1 : 0), 0);
}

function hasScheduleTimer(mindKey, scheduleId) {
  const normalizedMindKey = safeString(mindKey, '', 120);
  const normalizedScheduleId = safeString(scheduleId, '', 160);
  if (!normalizedScheduleId) return false;
  if (normalizedMindKey) return !!activeTimers[scheduleTimerKey(normalizedMindKey, normalizedScheduleId)];
  return Object.keys(activeTimers).some(key => key === normalizedScheduleId || key.endsWith(`::${normalizedScheduleId}`));
}

function findRegisteredSchedule(minds, mindKey, scheduleId) {
  const mind = minds[mindKey];
  if (!mind) return null;
  return (mind.schedules || []).find(schedule => schedule.id === scheduleId) || null;
}

ipcMain.handle('start-schedule', async (_, payload = {}) => {
  try {
    const { mindKey, scheduleId, intervalMs } = payload;
    const minds = normalizeMinds(loadJSON(MINDS_FILE));
    const normalizedMindKey = safeString(mindKey, '', 120);
    const normalizedScheduleId = safeString(scheduleId, '', 160);
    const timerKey = scheduleTimerKey(normalizedMindKey, normalizedScheduleId);
    if (!normalizedMindKey || !minds[normalizedMindKey]) {
      stopScheduleTimer(timerKey);
      return { ok: false, error: 'Mind not found' };
    }
    if (!normalizedScheduleId) return { ok: false, error: 'Schedule id is required' };
    const schedule = findRegisteredSchedule(minds, normalizedMindKey, normalizedScheduleId);
    if (!schedule) {
      stopScheduleTimer(timerKey);
      return { ok: false, error: 'Schedule not found' };
    }
    if (!schedule.enabled) {
      stopScheduleTimer(timerKey);
      return { ok: false, error: 'Schedule is disabled' };
    }
    stopScheduleTimer(timerKey);
    let ms;
    try {
      ms = normalizeScheduleIntervalMs(intervalMs);
    } catch (err) {
      stopScheduleTimer(timerKey);
      return { ok: false, error: err.message };
    }
    activeTimers[timerKey] = setInterval(() => {
      if (mainWindow && !mainWindow.isDestroyed()) {
        mainWindow.webContents.send('schedule-fired', { mindKey: normalizedMindKey, scheduleId: normalizedScheduleId });
      }
    }, ms);
    return { ok: true, nextRun: new Date(Date.now() + ms).toISOString() };
  } catch (err) { return { ok: false, error: err.message }; }
});

ipcMain.handle('stop-schedule', async (_, payload = {}) => {
  const { mindKey, scheduleId } = payload;
  const stopped = stopScheduleTimers(mindKey, scheduleId);
  return { ok: true, stopped };
});

ipcMain.handle('get-schedule-status', async (_, payload = {}) => {
  const { mindKey, scheduleId } = payload;
  return { ok: true, isRunning: hasScheduleTimer(mindKey, scheduleId) };
});

// ── Shared Memory ────────────────────────────────────────────────
ipcMain.handle('ensure-shared-memory', async (_, payload = {}) => {
  try {
    const dirPath = payload?.dirPath || SHARED_MEM_DIR;
    const expanded = expandUserPath(dirPath);
    if (!isPathInside(CONFIG_DIR, expanded)) throw new Error('Shared memory must live inside JARVIS OS config');
    fs.mkdirSync(expanded, { recursive: true });
    const defaults = {
      'shared-context.md': '# Shared Context\n\n> Cross-mind context accessible to all minds.\n> Update this file when discoveries affect multiple minds.\n\n## Current Focus\n- [What the team of minds is working on]\n\n## Key Decisions\n- [Decisions that affect multiple minds]\n',
      'shared-decisions.md': '# Shared Decisions Log\n\n> Architectural and strategic decisions that all minds should know.\n\n## Decisions\n| Date | Decision | Rationale | Affected Minds |\n|------|----------|-----------|----------------|\n| | | | |\n',
      'shared-projects.md': '# Shared Projects\n\n> Active projects tracked across all minds.\n\n## Active Projects\n- **[Project Name]:** [Status] — Lead mind: [mind]\n',
    };
    for (const [name, content] of Object.entries(defaults)) {
      const fp = path.join(expanded, name);
      if (!fs.existsSync(fp)) writeTextFileAtomic(fp, content);
    }
    return { ok: true, path: expanded };
  } catch (err) { return { ok: false, error: err.message }; }
});

// ── Install starter minds ────────────────────────────────────────
ipcMain.handle('install-starter-minds', async (_, targetDir) => {
  const rollbackTargets = [];
  try {
    const expanded = assertSafeFolderTarget(targetDir);
    if (fs.existsSync(expanded) && !fs.statSync(expanded).isDirectory()) return { ok: false, error: 'Install target is not a folder' };
    const mindsSource = path.join(__dirname, 'minds');
    if (!fs.existsSync(mindsSource)) return { ok: false, error: 'Starter minds not found in app bundle' };

    const result = {};
    const entries = fs.readdirSync(mindsSource, { withFileTypes: true });
    const starters = [];

    for (const entry of entries) {
      if (!entry.isDirectory()) continue;
      const mindDir = path.join(mindsSource, entry.name);
      const metaPath = path.join(mindDir, 'mind.json');
      if (!fs.existsSync(metaPath)) continue;

      const meta = JSON.parse(fs.readFileSync(metaPath, 'utf8'));
      const destDir = path.join(expanded, entry.name);
      assertEmptyOrMissingFolder(destDir, `${meta.name || entry.name} starter mind folder`);
      starters.push({ entry, mindDir, meta, destDir });
    }

    for (const { entry, mindDir, meta, destDir } of starters) {
      const existedBefore = fs.existsSync(destDir);
      rollbackTargets.push({ destDir, existedBefore });
      copyDirRecursive(mindDir, destDir);
      trackCreatedMindFolder(destDir, { existedBefore });

      const key = entry.name;
      result[key] = buildStarterMindRegistryEntry(meta, key, destDir);
    }

    return { ok: true, minds: result };
  } catch (err) {
    rollbackInstallTargets(rollbackTargets);
    return { ok: false, error: err.message };
  }
});

// ── CLI Orchestration — Run Mind ─────────────────────────────────
const activeWorkflows = new Map();

function normalizeMindRef(value) {
  return String(value || '').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/-+$/, '');
}

function resolveWorkflowMind(minds, mindRef) {
  const ref = String(mindRef || '').trim();
  if (!ref) return null;
  if (minds[ref]) return { key: ref, mind: minds[ref] };
  const normalized = ref.toLowerCase();
  const slug = normalizeMindRef(ref);
  const match = Object.entries(minds).find(([key, mind]) =>
    key.toLowerCase() === normalized ||
    String(mind.name || '').toLowerCase() === normalized ||
    normalizeMindRef(mind.name || '') === slug
  );
  return match ? { key: match[0], mind: match[1] } : null;
}

function validateWorkflowForRun(wf, minds) {
  const issues = [];
  const steps = wf?.steps || [];
  if (!steps.length) issues.push('Workflow has no steps');
  steps.forEach((step, idx) => {
    const label = 'Step ' + (idx + 1);
    if (!String(step.action || '').trim()) issues.push(`${label} has no action`);
    const resolved = resolveWorkflowMind(minds, step.mind);
    if (!resolved) {
      issues.push(`${label} points to missing mind: ${step.mind || 'No mind selected'}`);
      return;
    }
    try {
      const folder = assertSafeFolderTarget(resolved.mind.folder);
      if (!folder || !fs.existsSync(folder) || !fs.statSync(folder).isDirectory()) {
        issues.push(`${label} mind folder not found: ${resolved.mind.folder || resolved.key}`);
      }
    } catch (err) {
      issues.push(`${label} mind folder is not usable: ${err.message}`);
    }
  });
  return issues;
}

function sendWorkflowUpdate(payload) {
  if (!mainWindow || mainWindow.isDestroyed()) return;
  try {
    mainWindow.webContents.send('workflow-step-update', payload);
  } catch (err) {
    console.warn('Unable to send workflow update', err.message);
  }
}

const CLAUDE_RUN_TIMEOUT_MS = 5 * 60 * 1000;
const CLAUDE_BACKGROUND_ALLOWED_TOOLS = [
  'Read',
  'LS',
  'Glob',
  'Grep',
  'WebFetch',
  'WebSearch',
];
const CLAUDE_BACKGROUND_SYSTEM_PROMPT = [
  'You are running inside JARVIS OS as a non-interactive background step.',
  'JARVIS OS has already shown the user an approval gate for this workflow run.',
  'Use the allowed read/search/fetch tools directly when needed.',
  'Do not ask the user to click hidden Claude permission prompts.',
  'Do not send external messages, modify remote systems, or perform destructive local edits.',
  'If a needed action is outside the allowed tools, return a concise blocked note with the exact tool or credential required.',
].join(' ');

function spawnClaude(args, options = {}) {
  return spawn('claude', args, options);
}

function spawnCodex(args, options = {}) {
  return spawn('codex', args, options);
}

function formatClaudeRunError({ stderr = '', code = null, signal = null, timedOut = false, timeoutMs = CLAUDE_RUN_TIMEOUT_MS } = {}) {
  if (timedOut) return `Claude CLI timed out after ${Math.round(timeoutMs / 1000)} seconds`;
  const stderrText = safeString(stderr, '', 4000);
  if (stderrText) return stderrText;
  if (signal) return `Claude CLI exited with signal ${signal}`;
  return `Claude CLI exited with code ${code}`;
}

function parseClaudeRunOutput(stdout, stderr, code, signal, { timedOut = false, timeoutMs = CLAUDE_RUN_TIMEOUT_MS } = {}) {
  if (timedOut) return { ok: false, error: formatClaudeRunError({ timedOut, timeoutMs }), timedOut: true };

  const raw = String(stdout || '').trim();
  let parsed = null;
  if (raw) {
    try { parsed = JSON.parse(raw); } catch {}
  }

  if (code !== 0) {
    return {
      ok: false,
      error: safeString(parsed?.error || parsed?.message, '', 4000) || formatClaudeRunError({ stderr, code, signal }),
    };
  }

  if (parsed) {
    return {
      ok: true,
      result: parsed.result || raw,
      duration_ms: parsed.duration_ms || 0,
      cost_usd: parsed.cost_usd || parsed.total_cost_usd || 0,
      session_id: parsed.session_id || null,
    };
  }

  if (raw) return { ok: true, result: raw, duration_ms: 0, cost_usd: 0, session_id: null };
  return { ok: false, error: formatClaudeRunError({ stderr, code, signal }) };
}

function stripAnsi(value) {
  return String(value || '').replace(/\x1B\[[0-?]*[ -/]*[@-~]/g, '').trim();
}

function runClaudePrompt(folder, prompt, { timeoutMs = CLAUDE_RUN_TIMEOUT_MS, onProcess } = {}) {
  return new Promise((resolve) => {
    let stdout = '';
    let stderr = '';
    let timedOut = false;
    let settled = false;
    let timeoutTimer = null;
    let forceKillTimer = null;

    const finish = (result) => {
      if (settled) return;
      settled = true;
      if (timeoutTimer) clearTimeout(timeoutTimer);
      if (forceKillTimer) clearTimeout(forceKillTimer);
      resolve(result);
    };

    const args = [
      '-p', prompt,
      '--output-format', 'json',
      '--permission-mode', 'acceptEdits',
      '--allowedTools', CLAUDE_BACKGROUND_ALLOWED_TOOLS.join(','),
      '--append-system-prompt', CLAUDE_BACKGROUND_SYSTEM_PROMPT,
    ];
    const proc = spawnClaude(args, {
      cwd: folder,
      env: { ...process.env },
      stdio: ['pipe', 'pipe', 'pipe'],
    });

    if (onProcess) onProcess(proc);

    timeoutTimer = setTimeout(() => {
      timedOut = true;
      if (!proc.killed) proc.kill('SIGTERM');
      forceKillTimer = setTimeout(() => {
        if (!settled && !proc.killed) proc.kill('SIGKILL');
      }, 5000);
    }, timeoutMs);

    proc.stdout.on('data', (data) => { stdout += data.toString(); });
    proc.stderr.on('data', (data) => { stderr += data.toString(); });

    proc.on('close', (code, signal) => {
      finish(parseClaudeRunOutput(stdout, stderr, code, signal, { timedOut, timeoutMs }));
    });

    proc.on('error', (err) => {
      finish({ ok: false, error: `Failed to spawn claude: ${err.message}. Is the Claude CLI installed?` });
    });
  });
}

const CODEX_RUN_TIMEOUT_MS = 10 * 60 * 1000;
const CORTEX_CODEX_MODEL = process.env.CORTEX_CODEX_MODEL || 'gpt-5.5';

function parseCodexJsonOutput(stdout) {
  const lines = String(stdout || '').split(/\r?\n/);
  let lastMessage = '';
  let threadId = null;
  let usage = null;

  lines.forEach(line => {
    const trimmed = line.trim();
    if (!trimmed || !trimmed.startsWith('{')) return;
    let event = null;
    try { event = JSON.parse(trimmed); } catch { return; }
    if (event.type === 'thread.started' && event.thread_id) threadId = event.thread_id;
    if (event.type === 'turn.completed' && event.usage) usage = event.usage;
    if (event.type === 'item.completed' && event.item?.type === 'agent_message' && event.item.text) {
      lastMessage = event.item.text;
    }
  });

  return {
    result: stripAnsi(lastMessage || stdout || '').trim(),
    threadId,
    usage,
  };
}

function formatCodexRunError({ stdout = '', stderr = '', code = null, signal = null } = {}) {
  const combined = stripAnsi([stderr, stdout].filter(Boolean).join('\n')).trim();
  if (/unknown variant `priority`/.test(combined) && /service_tier/.test(combined)) {
    return 'Codex CLI config is incompatible with headless exec: service_tier must be fast or flex. JARVIS OS now runs Codex steps with isolated background config; restart and retry.';
  }
  if (/not supported when using Codex with a ChatGPT account/.test(combined)) {
    return `Codex model is not available for this account. Set CORTEX_CODEX_MODEL to a supported model. Current model: ${CORTEX_CODEX_MODEL}`;
  }
  if (combined) return combined.slice(0, 4000);
  if (signal) return `Codex CLI exited with signal ${signal}`;
  return `Codex CLI exited with code ${code}`;
}

function runCodexPrompt(folder, prompt, { timeoutMs = CODEX_RUN_TIMEOUT_MS, onProcess } = {}) {
  return new Promise((resolve) => {
    let stdout = '';
    let stderr = '';
    let timedOut = false;
    let settled = false;
    let timeoutTimer = null;
    let forceKillTimer = null;
    const start = Date.now();

    const finish = (result) => {
      if (settled) return;
      settled = true;
      if (timeoutTimer) clearTimeout(timeoutTimer);
      if (forceKillTimer) clearTimeout(forceKillTimer);
      resolve(result);
    };

    const args = [
      'exec',
      '--ignore-user-config',
      '--json',
      '--ephemeral',
      '--skip-git-repo-check',
      '-m', CORTEX_CODEX_MODEL,
      '-c', 'approval_policy="never"',
      '--sandbox', 'workspace-write',
      '--color', 'never',
      '-C', folder,
      '-'
    ];
    const proc = spawnCodex(args, {
      cwd: folder,
      env: { ...process.env },
      stdio: ['pipe', 'pipe', 'pipe'],
    });

    if (onProcess) onProcess(proc);

    timeoutTimer = setTimeout(() => {
      timedOut = true;
      if (!proc.killed) proc.kill('SIGTERM');
      forceKillTimer = setTimeout(() => {
        if (!settled && !proc.killed) proc.kill('SIGKILL');
      }, 5000);
    }, timeoutMs);

    proc.stdout.on('data', (data) => { stdout += data.toString(); });
    proc.stderr.on('data', (data) => { stderr += data.toString(); });
    proc.stdin.on('error', () => {});
    proc.stdin.end(String(prompt || ''));

    proc.on('close', (code, signal) => {
      if (timedOut) {
        finish({ ok: false, error: `Codex CLI timed out after ${Math.round(timeoutMs / 1000)} seconds`, timedOut: true, provider: 'codex' });
        return;
      }
      if (code !== 0) {
        finish({ ok: false, error: formatCodexRunError({ stdout, stderr, code, signal }), provider: 'codex' });
        return;
      }
      const parsed = parseCodexJsonOutput(stdout);
      finish({
        ok: true,
        result: parsed.result || 'Codex completed without a final message.',
        duration_ms: Date.now() - start,
        cost_usd: 0,
        session_id: parsed.threadId,
        usage: parsed.usage,
        provider: 'codex',
      });
    });

    proc.on('error', (err) => {
      finish({ ok: false, error: `Failed to spawn codex: ${err.message}. Is the Codex CLI installed and logged in?`, provider: 'codex' });
    });
  });
}

function runProviderPrompt(provider, folder, prompt, options = {}) {
  const normalized = normalizeProviderId(provider);
  return normalized === 'codex'
    ? runCodexPrompt(folder, prompt, options)
    : runClaudePrompt(folder, prompt, options).then(result => ({ ...result, provider: 'claude' }));
}

ipcMain.handle('check-claude-cli', async () => {
  return new Promise((resolve) => {
    let stdout = '';
    let stderr = '';
    let settled = false;
    let proc = null;
    const timeoutTimer = setTimeout(() => {
      if (settled) return;
      settled = true;
      if (proc && !proc.killed) proc.kill('SIGTERM');
      resolve({ ok: false, installed: false, error: 'Claude CLI check timed out' });
    }, 5000);

    const finish = (result) => {
      if (settled) return;
      settled = true;
      clearTimeout(timeoutTimer);
      resolve(result);
    };

    proc = spawnClaude(['--version'], {
      cwd: __dirname,
      env: { ...process.env },
      stdio: ['ignore', 'pipe', 'pipe'],
    });

    proc.stdout.on('data', data => { stdout += data.toString(); });
    proc.stderr.on('data', data => { stderr += data.toString(); });
    proc.on('close', (code) => {
      const version = safeString(stdout || stderr, '', 300);
      finish(code === 0
        ? { ok: true, installed: true, version }
        : { ok: true, installed: false, error: version || `Claude CLI exited with code ${code}` });
    });
    proc.on('error', (err) => {
      finish({ ok: true, installed: false, error: `Claude CLI not available: ${err.message}` });
    });
  });
});

ipcMain.handle('check-codex-cli', async () => {
  return new Promise((resolve) => {
    let stdout = '';
    let stderr = '';
    let settled = false;
    let proc = null;
    const timeoutTimer = setTimeout(() => {
      if (settled) return;
      settled = true;
      if (proc && !proc.killed) proc.kill('SIGTERM');
      resolve({ ok: false, installed: false, error: 'Codex CLI check timed out' });
    }, 5000);

    const finish = (result) => {
      if (settled) return;
      settled = true;
      clearTimeout(timeoutTimer);
      resolve(result);
    };

    proc = spawnCodex(['--version'], {
      cwd: __dirname,
      env: { ...process.env },
      stdio: ['ignore', 'pipe', 'pipe'],
    });

    proc.stdout.on('data', data => { stdout += data.toString(); });
    proc.stderr.on('data', data => { stderr += data.toString(); });
    proc.on('close', (code) => {
      const version = safeString(stdout || stderr, '', 300);
      finish(code === 0
        ? { ok: true, installed: true, version }
        : { ok: true, installed: false, error: version || `Codex CLI exited with code ${code}` });
    });
    proc.on('error', (err) => {
      finish({ ok: true, installed: false, error: `Codex CLI not available: ${err.message}` });
    });
  });
});

ipcMain.handle('draft-mind-from-brief', async (_, payload = {}) => {
  const brief = safeString(payload.brief, '', 4000);
  if (!brief) return { ok: false, error: 'Describe the mind first' };

  const prompt = buildMindDraftPrompt(brief);
  const result = await runClaudePrompt(__dirname, prompt, { timeoutMs: 90 * 1000 });
  if (!result.ok) return result;

  const parsed = extractMindDraftObject(result.result);
  if (!parsed) return { ok: false, error: 'Claude returned an unusable mind draft' };

  return { ok: true, draft: normalizeMindDraft(parsed, brief) };
});

ipcMain.handle('draft-workflow-from-brief', async (_, payload = {}) => {
  const brief = safeString(payload.brief, '', 5000);
  if (!brief) return { ok: false, error: 'Describe the workflow outcome first' };

  const minds = normalizeMinds(loadJSON(MINDS_FILE));
  if (!Object.keys(minds).length) return { ok: false, error: 'Create or install at least one mind before drafting workflows' };

  const prompt = buildWorkflowDraftPrompt(brief, minds);
  const result = await runClaudePrompt(__dirname, prompt, { timeoutMs: 90 * 1000 });
  if (!result.ok) return result;

  const parsed = extractWorkflowDraftObject(result.result);
  if (!parsed) return { ok: false, error: 'Claude returned an unusable workflow draft' };

  const draft = normalizeWorkflowDraft(parsed, brief, minds);
  if (!draft.steps.length) return { ok: false, error: 'Claude did not produce any usable workflow steps' };

  return { ok: true, draft };
});

ipcMain.handle('draft-automation-from-brief', async (_, payload = {}) => {
  const brief = safeString(payload.brief, '', 6000);
  if (!brief) return { ok: false, error: 'Describe the automation first' };

  const minds = normalizeMinds(loadJSON(MINDS_FILE));
  if (!Object.keys(minds).length) return { ok: false, error: 'Create or install at least one mind before drafting automations' };

  const prompt = buildAutomationDraftPrompt(brief, minds);
  const result = await runClaudePrompt(__dirname, prompt, { timeoutMs: 110 * 1000 });
  if (!result.ok) return result;

  const parsed = extractWorkflowDraftObject(result.result);
  if (!parsed) return { ok: false, error: 'Claude returned an unusable automation draft' };

  const draft = normalizeAutomationDraft(parsed, brief, minds);
  if (!draft.workflow.steps.length) return { ok: false, error: 'Claude did not produce any usable automation steps' };

  return { ok: true, draft };
});

ipcMain.handle('run-mind', async (_, payload = {}) => {
  const { mindKey, prompt, previousOutput } = payload;
  const state = normalizeState(loadJSON(STATE_FILE));
  const provider = normalizeProviderId(payload.provider || state.defaultProvider);
  const minds = normalizeMinds(loadJSON(MINDS_FILE));
  const mind = minds[mindKey];
  if (!mind) return { ok: false, error: 'Mind not found: ' + mindKey };

  let folder;
  try {
    folder = assertSafeFolderTarget(mind.folder);
  } catch (err) {
    return { ok: false, error: 'Mind folder is not usable: ' + err.message };
  }
  if (!fs.existsSync(folder) || !fs.statSync(folder).isDirectory()) return { ok: false, error: 'Mind folder not found: ' + folder };

  // Build prompt with previous step context
  const promptText = safeString(prompt, '', 200000);
  if (!promptText) return { ok: false, error: 'Prompt is required' };
  let fullPrompt = promptText;
  if (previousOutput) {
    fullPrompt = `Context from previous step:\n\n${safeString(previousOutput, '', 50000)}\n\n---\n\nYour task: ${promptText}`;
  }

  return runProviderPrompt(provider, folder, fullPrompt);
});

// ── CLI Orchestration — Run Workflow Pipeline ────────────────────
ipcMain.handle('run-workflow', async (_, payload = {}) => {
  const { workflowId } = payload;
  const runContext = safeString(payload.runContext, '', 12000);
  const workflows = normalizeWorkflows(loadJSON(WORKFLOWS_FILE));
  const wf = workflows[workflowId];
  if (!wf) return { ok: false, error: 'Workflow not found' };
  if (activeWorkflows.has(workflowId)) return { ok: false, error: 'Workflow is already running' };

  const minds = normalizeMinds(loadJSON(MINDS_FILE));
  const validationIssues = validateWorkflowForRun(wf, minds);
  if (validationIssues.length) {
    return { ok: false, error: validationIssues[0], issues: validationIssues };
  }

  // Mark as running
  wf.status = 'running';
  wf.lastRunContext = runContext;
  wf.lastRunAt = new Date().toISOString();
  delete wf.lastMemoryCapture;
  wf.steps.forEach(s => { s.status = 'idle'; s.output = ''; s.duration_ms = 0; s.cost_usd = 0; });
  saveJSON(WORKFLOWS_FILE, workflows);

  let previousOutput = '';
  const runContextPrefix = runContext ? `Run brief from the operator:\n\n${runContext}\n\n---\n\n` : '';
  let cancelled = false;
  let currentProcess = null;
  let response = { ok: true, status: 'error' };

  // Store cancel handle
  activeWorkflows.set(workflowId, {
    cancel: () => {
      cancelled = true;
      if (currentProcess && !currentProcess.killed) currentProcess.kill('SIGTERM');
    }
  });

  try {
    for (let i = 0; i < wf.steps.length; i++) {
      if (cancelled) {
        wf.steps[i].status = 'error';
        wf.steps[i].output = 'Cancelled';
        break;
      }

      const step = wf.steps[i];
      const resolvedMind = resolveWorkflowMind(minds, step.mind);
      const provider = normalizeProviderId(step.provider || wf.provider);
      const mindKey = resolvedMind?.key || step.mind;
      const mind = resolvedMind?.mind;

      // Update step: running
      step.status = 'running';
      saveJSON(WORKFLOWS_FILE, workflows);
      sendWorkflowUpdate({ workflowId, stepIndex: i, status: 'running' });

      if (!mind) {
        step.status = 'error';
        step.output = 'Mind not found: ' + mindKey;
        saveJSON(WORKFLOWS_FILE, workflows);
        sendWorkflowUpdate({ workflowId, stepIndex: i, status: 'error', output: step.output });
        continue;
      }

      // Run the step via CLI
      let fullPrompt = `${runContextPrefix}${step.action}`;
      if (previousOutput) {
        fullPrompt = `${runContextPrefix}Context from previous step:\n\n${previousOutput.substring(0, 50000)}\n\n---\n\nYour task: ${step.action}`;
      }

      let folder;
      let folderError = '';
      try {
        folder = assertSafeFolderTarget(mind.folder);
      } catch (err) {
        folderError = err.message;
        folder = null;
      }

      const result = folder
        ? await runProviderPrompt(provider, folder, fullPrompt, {
          onProcess: (proc) => { currentProcess = proc; }
        })
        : { ok: false, error: `Mind folder is not usable: ${folderError}` };
      currentProcess = null;

      if (result.ok) {
        step.status = 'complete';
        step.output = result.result;
        step.duration_ms = result.duration_ms;
        step.cost_usd = result.cost_usd;
        previousOutput = result.result;
      } else {
        step.status = 'error';
        step.output = cancelled ? 'Cancelled' : result.error;
      }

      saveJSON(WORKFLOWS_FILE, workflows);
      sendWorkflowUpdate({
        workflowId, stepIndex: i,
        status: step.status,
        output: (step.output || '').substring(0, 2000),
        duration_ms: step.duration_ms,
        cost_usd: step.cost_usd
      });

      if (step.status === 'error') break;
    }

    wf.status = cancelled ? 'error' : (wf.steps.every(s => s.status === 'complete') ? 'complete' : 'error');
    saveJSON(WORKFLOWS_FILE, workflows);
    response = { ok: true, status: wf.status };
  } catch (err) {
    const message = err?.message || String(err || 'Workflow failed unexpectedly');
    wf.status = 'error';
    const runningIndex = wf.steps.findIndex(step => step.status === 'running');
    if (runningIndex >= 0) {
      wf.steps[runningIndex].status = 'error';
      wf.steps[runningIndex].output = 'Workflow failed unexpectedly: ' + message;
      sendWorkflowUpdate({
        workflowId,
        stepIndex: runningIndex,
        status: 'error',
        output: wf.steps[runningIndex].output.substring(0, 2000)
      });
    }
    try {
      saveJSON(WORKFLOWS_FILE, workflows);
    } catch (saveErr) {
      console.warn('Unable to persist workflow failure state', saveErr.message);
    }
    response = { ok: false, error: 'Workflow failed unexpectedly: ' + message, status: 'error' };
  } finally {
    currentProcess = null;
    activeWorkflows.delete(workflowId);
    sendWorkflowUpdate({ workflowId, status: wf.status, done: true });
  }

  return response;
});

ipcMain.handle('cancel-workflow', async (_, payload = {}) => {
  const { workflowId } = payload;
  const handle = activeWorkflows.get(workflowId);
  if (handle) { handle.cancel(); return { ok: true }; }
  return { ok: false, error: 'No active workflow' };
});

ipcMain.handle('capture-workflow-memory', async (_, payload = {}) => {
  try {
    const workflowId = safeString(payload.workflowId, '', 160);
    const workflows = normalizeWorkflows(loadJSON(WORKFLOWS_FILE));
    const workflow = workflows[workflowId];
    if (!workflow) return { ok: false, error: 'Workflow not found' };
    if (!(workflow.steps || []).some(step => step.output)) return { ok: false, error: 'Workflow has no captured output yet' };

    const minds = normalizeMinds(loadJSON(MINDS_FILE));
    const requestedMindKey = safeString(payload.mindKey, '', 120);
    const fallbackMind = (workflow.steps || [])
      .map(step => resolveWorkflowMind(minds, step.mind))
      .find(Boolean);
    const mindKey = minds[requestedMindKey] ? requestedMindKey : fallbackMind?.key;
    const mind = mindKey ? minds[mindKey] : null;
    if (!mind) return { ok: false, error: 'No target mind found for this workflow' };

    let folder;
    try {
      folder = assertSafeFolderTarget(mind.folder);
    } catch (err) {
      return { ok: false, error: 'Mind folder is not usable: ' + err.message };
    }

    const provider = normalizeProviderId(payload.provider || normalizeState(loadJSON(STATE_FILE)).defaultProvider);
    const prompt = buildWorkflowMemoryPrompt({ workflowId, workflow, targetMind: mind });
    const result = await runProviderPrompt(provider, folder, prompt, { timeoutMs: 3 * 60 * 1000 });
    if (!result.ok) return result;

    const title = `Workflow Lesson - ${workflow.name || workflowId}`;
    const markdown = normalizeGeneratedMarkdown(result.result, title);
    const filePath = writeMindImportMemory(mind, title, markdown);
    workflow.lastMemoryCapture = {
      capturedAt: new Date().toISOString(),
      filePath,
      relativePath: path.relative(folder, filePath),
      mindKey,
      mindName: mind.name,
      title,
      provider: normalizeProviderId(result.provider || provider),
      duration_ms: result.duration_ms || 0,
      cost_usd: result.cost_usd || 0,
    };
    workflows[workflowId] = workflow;
    saveJSON(WORKFLOWS_FILE, workflows);
    return {
      ok: true,
      filePath,
      relativePath: path.relative(folder, filePath),
      mindKey,
      title,
      provider: normalizeProviderId(result.provider || provider),
      duration_ms: result.duration_ms || 0,
      cost_usd: result.cost_usd || 0,
    };
  } catch (err) {
    return { ok: false, error: err.message };
  }
});

// ── MCP Server Registration ─────────────────────────────────────
const CLAUDE_DESKTOP_CONFIG = path.join(os.homedir(), 'Library', 'Application Support', 'Claude', 'claude_desktop_config.json');
const MCP_SERVER_PATH = path.join(__dirname, 'cortex-mcp-server.js');

ipcMain.handle('install-mcp-to-desktop', async () => {
  try {
    const loaded = loadExternalJSONObject(CLAUDE_DESKTOP_CONFIG, 'Claude Desktop config');
    if (!loaded.ok) return { ok: false, error: loaded.error };
    const config = loaded.data;
    if (!config.mcpServers) config.mcpServers = {};

    config.mcpServers['cortex-mesh'] = {
      command: 'node',
      args: [MCP_SERVER_PATH]
    };

    saveJSON(CLAUDE_DESKTOP_CONFIG, config);

    const recovered = loaded.recoveredFromBackup ? ' Recovered from the last valid backup before writing.' : '';
    return { ok: true, message: 'JARVIS OS Mesh MCP server registered. Restart Claude Desktop to activate.' + recovered };
  } catch (err) {
    return { ok: false, error: err.message };
  }
});

ipcMain.handle('check-mcp-installed', async () => {
  try {
    if (!fs.existsSync(CLAUDE_DESKTOP_CONFIG)) return { ok: true, installed: false };
    const loaded = loadExternalJSONObject(CLAUDE_DESKTOP_CONFIG, 'Claude Desktop config');
    if (!loaded.ok) return { ok: true, installed: false, error: loaded.error };
    const config = loaded.data;
    const installed = !!config.mcpServers?.['cortex-mesh'];
    return { ok: true, installed };
  } catch (err) {
    return { ok: true, installed: false };
  }
});

// ── Mesh inbox delivery (file-based) ────────────────────────────
ipcMain.handle('deliver-mesh-to-inbox', async (_, payload = {}) => {
  try {
    const { mindKey, message } = payload;
    const minds = normalizeMinds(loadJSON(MINDS_FILE));
    const mind = minds[mindKey];
    if (!mind) return { ok: false, error: 'Mind not found' };

    const folder = assertMindFolderOperation(mind.folder, { requireRegistered: true, requireMindShape: true });
    if (!fs.existsSync(folder) || !fs.statSync(folder).isDirectory()) return { ok: false, error: 'Mind folder not found' };
    const inboxDir = path.join(folder, 'owners-inbox');
    if (!fs.existsSync(inboxDir)) fs.mkdirSync(inboxDir, { recursive: true });

    const fileName = `${safeFileStem(message?.id, 'message-' + Date.now())}.md`;
    const subject = safeString(message?.subject, 'Mesh Message', 240) || 'Mesh Message';
    const content = `# Mesh Message: ${subject}\n\n- **From:** ${safeString(message?.from, 'Unknown', 160)}\n- **To:** ${safeString(message?.to, mind.name, 160)}\n- **Type:** ${safeString(message?.type, 'handoff', 80) || 'handoff'}\n- **Date:** ${safeString(message?.timestamp, new Date().toISOString(), 80) || new Date().toISOString()}\n\n---\n\n${String(message?.body || '')}\n`;
    writeTextFileAtomic(path.join(inboxDir, fileName), content);

    return { ok: true };
  } catch (err) {
    return { ok: false, error: err.message };
  }
});

// ── Mesh file watcher (detect external changes from MCP server) ─
let meshWatcher = null;
let meshWatchDebounce = null;

function startMeshWatcher() {
  if (meshWatcher) return;
  try {
    ensureConfigDir();
    meshWatcher = fs.watch(CONFIG_DIR, (_, filename) => {
      if (filename && filename !== path.basename(MESH_FILE)) return;
      if (meshWatchDebounce) clearTimeout(meshWatchDebounce);
      meshWatchDebounce = setTimeout(() => {
        if (mainWindow && !mainWindow.isDestroyed()) {
          mainWindow.webContents.send('mesh-updated', {});
        }
      }, 150);
    });
    meshWatcher.on('error', () => {
      stopMeshWatcher();
    });
  } catch {}
}

function stopMeshWatcher() {
  if (meshWatchDebounce) {
    clearTimeout(meshWatchDebounce);
    meshWatchDebounce = null;
  }
  if (meshWatcher) {
    try { meshWatcher.close(); } catch {}
    meshWatcher = null;
  }
}

// ── Get app metadata ─────────────────────────────────────────────
ipcMain.handle('get-app-info', async () => {
  return {
    ok: true,
    info: {
      version: app.getVersion(),
      electronVersion: process.versions.electron,
      chromeVersion: process.versions.chrome,
      nodeVersion: process.versions.node,
      platform: process.platform,
      arch: process.arch,
      configDir: CONFIG_DIR,
    },
  };
});


// ══════════════════════════════════════════════════════════════════
// APP LIFECYCLE
// ══════════════════════════════════════════════════════════════════
function clearAllScheduleTimers() {
  for (const timerKey of Object.keys(activeTimers)) stopScheduleTimer(timerKey);
}

function cancelActiveWorkflows() {
  for (const [workflowId, handle] of [...activeWorkflows.entries()]) {
    try { handle.cancel(); } catch (err) {
      console.warn('Unable to cancel workflow during shutdown', workflowId, err.message);
    }
    activeWorkflows.delete(workflowId);
  }
}

function cleanupRuntimeResources() {
  flushWindowBoundsSave();
  clearAllScheduleTimers();
  cancelActiveWorkflows();
  stopMeshWatcher();
}

app.whenReady().then(() => {
  buildMenu();
  createWindow();
  startMeshWatcher();
  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
});

app.on('before-quit', cleanupRuntimeResources);
