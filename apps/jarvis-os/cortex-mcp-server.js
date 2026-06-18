#!/usr/bin/env node
// ═══════════════════════════════════════════════════════════════════
// JARVIS OS MCP Message Bus — Inter-Mind Communication Server
// ═══════════════════════════════════════════════════════════════════
// Stdio-based MCP server (JSON-RPC 2.0) that gives Claude sessions
// the ability to send/receive messages between minds, read shared
// memory, and discover the mind network.
//
// Launched automatically by Claude Desktop via mcpServers config.
// Zero dependencies — pure Node.js.
// ═══════════════════════════════════════════════════════════════════

const fs = require('fs');
const path = require('path');
const os = require('os');
const readline = require('readline');

const CONFIG_DIR = path.join(os.homedir(), '.cortex');
const STATE_FILE = path.join(CONFIG_DIR, 'state.json');
const MESH_FILE = path.join(CONFIG_DIR, 'mesh.json');
const MINDS_FILE = path.join(CONFIG_DIR, 'minds.json');
const WORKFLOWS_FILE = path.join(CONFIG_DIR, 'workflows.json');
const ACTIVITY_FILE = path.join(CONFIG_DIR, 'activity.json');
const SHARED_MEM_DIR = path.join(CONFIG_DIR, 'shared-memory');
const ALLOWED_SHARED_FILES = new Set(['shared-context.md', 'shared-decisions.md', 'shared-projects.md']);

function safeString(value, fallback = '', maxLength = 4000) {
  const str = typeof value === 'string' ? value : (value == null ? fallback : String(value));
  return str.replace(/\0/g, '').trim().slice(0, maxLength);
}

function safeFileStem(value, fallback = 'message', maxLength = 160) {
  return (safeString(value, fallback, maxLength).replace(/[^a-zA-Z0-9._-]+/g, '-') || fallback).slice(0, maxLength);
}

function isPlainObject(value) {
  return !!value && typeof value === 'object' && !Array.isArray(value);
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

function expandUserPath(value) {
  const raw = safeString(value, '', 4000);
  if (!raw) return '';
  if (raw === '~') return os.homedir();
  if (raw.startsWith('~/') || raw.startsWith('~\\')) return path.resolve(os.homedir(), raw.slice(2));
  return path.resolve(raw);
}

function resolveSharedMemoryFile(file) {
  const fileName = safeString(file, 'shared-context.md', 120) || 'shared-context.md';
  if (!ALLOWED_SHARED_FILES.has(fileName)) {
    return { ok: false, error: `Shared file "${fileName}" is not allowed.` };
  }
  const fp = path.resolve(SHARED_MEM_DIR, fileName);
  const relative = path.relative(SHARED_MEM_DIR, fp);
  if (relative.startsWith('..') || path.isAbsolute(relative)) {
    return { ok: false, error: `Shared file "${fileName}" is outside shared memory.` };
  }
  return { ok: true, fileName, fp };
}

// ── Atomic JSON helpers ─────────────────────────────────────────
function parseJSONFile(fp) {
  return JSON.parse(fs.readFileSync(fp, 'utf8'));
}

function loadJSON(fp) {
  const backup = `${fp}.bak`;
  try {
    if (fs.existsSync(fp)) return parseJSONFile(fp);
  } catch (err) {
    console.warn(`Unable to load ${fp}; trying backup`, err.message);
  }

  try {
    if (fs.existsSync(backup)) return parseJSONFile(backup);
  } catch (err) {
    console.warn(`Unable to load backup ${backup}`, err.message);
  }

  return null;
}

function backupExistingJSON(fp, backup) {
  if (!fs.existsSync(fp)) return;
  try {
    parseJSONFile(fp);
    fs.copyFileSync(fp, backup);
  } catch (err) {
    console.warn(`Skipping backup for invalid JSON ${fp}`, err.message);
  }
}

function saveJSONAtomic(fp, data) {
  const dir = path.dirname(fp);
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
  const tmp = path.join(dir, `.${path.basename(fp)}.${process.pid}.${Date.now()}.tmp`);
  const backup = `${fp}.bak`;
  try {
    backupExistingJSON(fp, backup);
    fs.writeFileSync(tmp, JSON.stringify(data, null, 2), 'utf8');
    fs.renameSync(tmp, fp);
  } catch (err) {
    try {
      if (fs.existsSync(tmp)) fs.unlinkSync(tmp);
    } catch {}
    throw err;
  }
}

function writeTextFileAtomic(fp, content) {
  const dir = path.dirname(fp);
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
  const tmp = path.join(dir, `.${path.basename(fp)}.${process.pid}.${Date.now()}.tmp`);
  try {
    fs.writeFileSync(tmp, String(content ?? ''), 'utf8');
    fs.renameSync(tmp, fp);
  } catch (err) {
    try {
      if (fs.existsSync(tmp)) fs.unlinkSync(tmp);
    } catch {}
    throw err;
  }
}

function resolveMindFolder(folderPath) {
  const folder = expandUserPath(folderPath);
  if (!folder) return { ok: false, error: 'Mind folder is missing' };
  if (!fs.existsSync(folder) || !fs.statSync(folder).isDirectory()) {
    return { ok: false, error: 'Mind folder not found' };
  }
  const hasClaude = fs.existsSync(path.join(folder, 'CLAUDE.md'));
  const hasMemory = fs.existsSync(path.join(folder, 'memory')) && fs.statSync(path.join(folder, 'memory')).isDirectory();
  if (!hasClaude && !hasMemory) {
    return { ok: false, error: 'Mind folder does not look like a JARVIS OS mind folder' };
  }
  return { ok: true, folder };
}

function findMindByName(mindName) {
  if (!mindName) return null;
  const normalized = safeString(mindName, '', 160).toLowerCase();
  const minds = loadJSON(MINDS_FILE) || {};
  const entry = Object.entries(minds).find(([, mind]) =>
    isPlainObject(mind) &&
    safeString(mind.name, '', 160).toLowerCase() === normalized
  );
  if (!entry) return null;
  return { key: entry[0], mind: entry[1] };
}

function getSharedMemoryAccess(mindName) {
  const match = findMindByName(mindName);
  if (!match) {
    return {
      ok: false,
      message: `Unknown mind "${mindName || ''}". Pass your exact JARVIS OS mind name as mind_name.`,
    };
  }
  const state = loadJSON(STATE_FILE) || {};
  const access = state.sharedMemory?.[match.key]?.access || 'readwrite';
  return { ok: true, access, ...match };
}

function accessDenied(message) {
  return { isError: true, content: [{ type: 'text', text: message }] };
}

function formatResourceDate(value) {
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return '';
  return parsed.toISOString();
}

function resourceText(uri, text, mimeType = 'text/markdown') {
  return {
    contents: [{
      uri,
      mimeType,
      text: String(text || ''),
    }],
  };
}

const RESOURCES = [
  {
    uri: 'cortex://minds',
    name: 'JARVIS OS Minds',
    description: 'Registered JARVIS OS minds with roles, folders, tools, schedules, and memory posture.',
    mimeType: 'text/markdown',
  },
  {
    uri: 'cortex://workflows',
    name: 'JARVIS OS Workflows',
    description: 'Saved multi-mind workflow definitions, providers, status, and latest step traces.',
    mimeType: 'text/markdown',
  },
  {
    uri: 'cortex://activity',
    name: 'JARVIS OS Activity',
    description: 'Recent local JARVIS OS events such as mind runs, workflow steps, memory imports, and repairs.',
    mimeType: 'text/markdown',
  },
  {
    uri: 'cortex://shared-memory',
    name: 'JARVIS OS Shared Memory',
    description: 'Shared memory files exposed through the JARVIS OS MCP server.',
    mimeType: 'text/markdown',
  },
];

function buildMindsResource() {
  const minds = loadJSON(MINDS_FILE) || {};
  const state = loadJSON(STATE_FILE) || {};
  const lines = ['# JARVIS OS Minds', ''];
  const entries = Object.entries(minds).filter(([, mind]) => isPlainObject(mind));
  if (!entries.length) return '# JARVIS OS Minds\n\nNo minds registered.';
  entries.forEach(([key, mind]) => {
    const tools = [];
    Object.entries(mind.mcpTools || {}).forEach(([tool, enabled]) => { if (enabled) tools.push(tool); });
    const sharedAccess = state.sharedMemory?.[key]?.access || 'readwrite';
    lines.push(`## ${mind.name || key}`);
    lines.push(`- Key: ${key}`);
    lines.push(`- Emoji: ${mind.emoji || ''}`);
    lines.push(`- Tagline: ${safeString(mind.tagline || mind.personality || '', '', 500)}`);
    lines.push(`- Folder: ${mind.folder || ''}`);
    lines.push(`- Status: ${mind.status || 'active'}`);
    lines.push(`- Specialties: ${(mind.specialties || []).join(', ') || 'None declared'}`);
    lines.push(`- Tools: ${tools.join(', ') || 'None declared'}`);
    lines.push(`- Shared memory access: ${sharedAccess}`);
    lines.push(`- Schedules: ${(mind.schedules || []).length}`);
    lines.push('');
  });
  return lines.join('\n');
}

function buildWorkflowsResource() {
  const workflows = loadJSON(WORKFLOWS_FILE) || {};
  const minds = loadJSON(MINDS_FILE) || {};
  const lines = ['# JARVIS OS Workflows', ''];
  const entries = Object.entries(workflows).filter(([, workflow]) => isPlainObject(workflow));
  if (!entries.length) return '# JARVIS OS Workflows\n\nNo workflows saved.';
  entries.forEach(([workflowId, workflow]) => {
    const steps = Array.isArray(workflow.steps) ? workflow.steps : [];
    lines.push(`## ${workflow.name || workflowId}`);
    lines.push(`- ID: ${workflowId}`);
    lines.push(`- Status: ${workflow.status || 'idle'}`);
    lines.push(`- Trigger: ${workflow.trigger || 'manual'}`);
    lines.push(`- Description: ${safeString(workflow.description || '', '', 800)}`);
    lines.push(`- Steps: ${steps.length}`);
    steps.forEach((step, index) => {
      const mind = minds[step.mind] || {};
      const output = safeString(step.output || '', '', 280);
      const meta = [
        step.provider ? `provider=${step.provider}` : '',
        step.status ? `status=${step.status}` : '',
        step.duration_ms ? `duration_ms=${step.duration_ms}` : '',
        step.cost_usd ? `cost_usd=${step.cost_usd}` : '',
      ].filter(Boolean).join(', ');
      lines.push(`  ${index + 1}. ${mind.name || step.mind || 'Missing mind'} — ${safeString(step.action || '', '', 500)}${meta ? ` (${meta})` : ''}`);
      if (output) lines.push(`     Output preview: ${output.replace(/\s+/g, ' ')}`);
    });
    lines.push('');
  });
  return lines.join('\n');
}

function buildActivityResource() {
  const loaded = loadJSON(ACTIVITY_FILE);
  const events = Array.isArray(loaded) ? loaded : [];
  const lines = ['# JARVIS OS Activity', ''];
  const normalized = events
    .filter(event => isPlainObject(event))
    .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp))
    .slice(0, 80);
  if (!normalized.length) return '# JARVIS OS Activity\n\nNo activity recorded.';
  normalized.forEach(event => {
    const tags = Array.isArray(event.tags) ? event.tags.join(', ') : '';
    lines.push(`- ${formatResourceDate(event.timestamp) || 'unknown time'} | ${event.mind || 'system'} | ${event.title || 'Activity'}`);
    if (event.desc) lines.push(`  ${safeString(event.desc, '', 800)}`);
    if (tags) lines.push(`  Tags: ${tags}`);
  });
  return lines.join('\n');
}

function buildSharedMemoryResource() {
  const lines = ['# JARVIS OS Shared Memory', ''];
  ALLOWED_SHARED_FILES.forEach(fileName => {
    const fp = path.join(SHARED_MEM_DIR, fileName);
    lines.push(`## ${fileName}`);
    if (!fs.existsSync(fp)) {
      lines.push('Not created yet.');
      lines.push('');
      return;
    }
    lines.push(safeString(fs.readFileSync(fp, 'utf8'), '', 8000));
    lines.push('');
  });
  return lines.join('\n');
}

function readResource(uri) {
  switch (uri) {
    case 'cortex://minds':
      return resourceText(uri, buildMindsResource());
    case 'cortex://workflows':
      return resourceText(uri, buildWorkflowsResource());
    case 'cortex://activity':
      return resourceText(uri, buildActivityResource());
    case 'cortex://shared-memory':
      return resourceText(uri, buildSharedMemoryResource());
    default:
      return null;
  }
}

// ── Tool definitions ────────────────────────────────────────────
const TOOLS = [
  {
    name: 'check_inbox',
    description: 'Check for pending mesh messages addressed to this mind. Returns an array of unread messages with their id, sender, subject, body, and type.',
    inputSchema: {
      type: 'object',
      properties: {
        mind_name: { type: 'string', description: 'Your mind name (e.g. "Atlas", "Forge")' }
      },
      required: ['mind_name']
    }
  },
  {
    name: 'send_to_mind',
    description: 'Send a message to another mind in the JARVIS OS network. The message will appear in their inbox and in the JARVIS OS mesh dashboard.',
    inputSchema: {
      type: 'object',
      properties: {
        from: { type: 'string', description: 'Your mind name (the sender)' },
        to: { type: 'string', description: 'Target mind name (the recipient)' },
        subject: { type: 'string', description: 'Brief subject line' },
        body: { type: 'string', description: 'Full message content' },
        type: { type: 'string', enum: ['handoff', 'query', 'broadcast', 'response'], description: 'Message type: handoff (pass work), query (ask question), broadcast (status update), response (reply)' }
      },
      required: ['from', 'to', 'subject', 'body']
    }
  },
  {
    name: 'mark_read',
    description: 'Mark a mesh message as complete/read after processing it.',
    inputSchema: {
      type: 'object',
      properties: {
        message_id: { type: 'string', description: 'The message ID to mark as read' }
      },
      required: ['message_id']
    }
  },
  {
    name: 'get_shared_context',
    description: 'Read a shared memory file if this mind has shared-memory access. Pass your exact JARVIS OS mind name so access control can be enforced.',
    inputSchema: {
      type: 'object',
      properties: {
        mind_name: { type: 'string', description: 'Your JARVIS OS mind name (e.g. "Atlas", "Forge")' },
        file: { type: 'string', enum: ['shared-context.md', 'shared-decisions.md', 'shared-projects.md'], description: 'Which shared file to read (defaults to shared-context.md)' }
      },
      required: ['mind_name']
    }
  },
  {
    name: 'update_shared_context',
    description: 'Append a dated entry to a shared memory file if this mind has read/write access. Pass your exact JARVIS OS mind name so access control can be enforced.',
    inputSchema: {
      type: 'object',
      properties: {
        mind_name: { type: 'string', description: 'Your JARVIS OS mind name (e.g. "Atlas", "Forge")' },
        file: { type: 'string', enum: ['shared-context.md', 'shared-decisions.md', 'shared-projects.md'], description: 'Which shared file to update' },
        entry: { type: 'string', description: 'The content to append (will be auto-dated)' }
      },
      required: ['mind_name', 'file', 'entry']
    }
  },
  {
    name: 'list_minds',
    description: 'List all minds registered in the JARVIS OS network with their names, specialties, and status.',
    inputSchema: {
      type: 'object',
      properties: {}
    }
  }
];

// ── Tool implementations ────────────────────────────────────────
function handleToolCall(name, args) {
  switch (name) {
    case 'check_inbox': return toolCheckInbox(args);
    case 'send_to_mind': return toolSendToMind(args);
    case 'mark_read': return toolMarkRead(args);
    case 'get_shared_context': return toolGetSharedContext(args);
    case 'update_shared_context': return toolUpdateSharedContext(args);
    case 'list_minds': return toolListMinds(args);
    default: return { isError: true, content: [{ type: 'text', text: `Unknown tool: ${name}` }] };
  }
}

function toolCheckInbox({ mind_name } = {}) {
  const messages = normalizeMeshMessages(loadJSON(MESH_FILE));
  const targetName = safeString(mind_name, '', 160).toLowerCase();
  if (!targetName) return accessDenied('Pass your exact JARVIS OS mind name as mind_name.');
  const pending = messages.filter(m =>
    safeString(m.to, '', 160).toLowerCase() === targetName && m.status === 'pending'
  );
  if (pending.length === 0) {
    return { content: [{ type: 'text', text: 'No pending messages in your inbox.' }] };
  }
  const summary = pending.map(m =>
    `[${m.id}] From: ${m.from} | Type: ${m.type || 'message'} | Subject: ${m.subject}\n${m.body}`
  ).join('\n\n---\n\n');
  return { content: [{ type: 'text', text: `${pending.length} pending message(s):\n\n${summary}` }] };
}

function toolSendToMind({ from, to, subject, body, type } = {}) {
  const sender = findMindByName(from);
  const target = findMindByName(to);
  if (!sender) return accessDenied(`Unknown sender mind "${safeString(from, '', 160)}".`);
  if (!target) return accessDenied(`Unknown target mind "${safeString(to, '', 160)}".`);
  const messages = normalizeMeshMessages(loadJSON(MESH_FILE));
  const msg = {
    id: 'msg-' + Date.now() + '-' + Math.random().toString(36).slice(2, 6),
    from: sender.mind.name,
    to: target.mind.name,
    subject: safeString(subject, 'No subject', 240) || 'No subject',
    body: safeString(body, '', 200000),
    type: ['handoff', 'query', 'broadcast', 'response'].includes(type) ? type : 'handoff',
    status: 'pending',
    timestamp: new Date().toISOString()
  };
  messages.push(msg);
  if (!fs.existsSync(CONFIG_DIR)) fs.mkdirSync(CONFIG_DIR, { recursive: true });
  saveJSONAtomic(MESH_FILE, messages);

  // Also write to the target mind's owners-inbox for file-based delivery
  const targetMind = target.mind;
  if (targetMind && targetMind.folder) {
    const resolvedFolder = resolveMindFolder(targetMind.folder);
    if (resolvedFolder.ok) {
      const inboxDir = path.join(resolvedFolder.folder, 'owners-inbox');
      if (!fs.existsSync(inboxDir)) fs.mkdirSync(inboxDir, { recursive: true });
      const inboxFile = path.join(inboxDir, `${safeFileStem(msg.id)}.md`);
      const content = `# Mesh Message: ${msg.subject}\n\n- **From:** ${msg.from}\n- **Type:** ${msg.type}\n- **Date:** ${msg.timestamp}\n\n---\n\n${msg.body}\n`;
      try { writeTextFileAtomic(inboxFile, content); } catch {}
    }
  }

  return { content: [{ type: 'text', text: `Message sent to ${msg.to} (ID: ${msg.id}). Subject: "${msg.subject}"` }] };
}

function toolMarkRead({ message_id } = {}) {
  const messages = normalizeMeshMessages(loadJSON(MESH_FILE));
  const messageId = safeString(message_id, '', 160);
  const msg = messages.find(m => m.id === messageId);
  if (!msg) return { content: [{ type: 'text', text: `Message ${messageId || '(missing id)'} not found.` }] };
  msg.status = 'complete';
  saveJSONAtomic(MESH_FILE, messages);
  return { content: [{ type: 'text', text: `Message ${messageId} marked as complete.` }] };
}

function toolGetSharedContext({ file, mind_name } = {}) {
  const access = getSharedMemoryAccess(mind_name);
  if (!access.ok) return accessDenied(access.message);
  if (access.access === 'none') {
    return accessDenied(`${access.mind.name} does not have access to shared memory.`);
  }

  const resolved = resolveSharedMemoryFile(file);
  if (!resolved.ok) return accessDenied(resolved.error);
  const { fileName, fp } = resolved;
  if (!fs.existsSync(fp)) {
    return { content: [{ type: 'text', text: `Shared file "${fileName}" not found. It will be created when you run JARVIS OS.` }] };
  }
  const content = fs.readFileSync(fp, 'utf8');
  return { content: [{ type: 'text', text: content }] };
}

function toolUpdateSharedContext({ file, entry, mind_name } = {}) {
  const access = getSharedMemoryAccess(mind_name);
  if (!access.ok) return accessDenied(access.message);
  if (access.access !== 'readwrite') {
    return accessDenied(`${access.mind.name} has ${access.access === 'read' ? 'read-only' : 'no'} access to shared memory.`);
  }

  const resolved = resolveSharedMemoryFile(file);
  if (!resolved.ok) return accessDenied(resolved.error);
  const { fileName, fp } = resolved;
  if (!fs.existsSync(SHARED_MEM_DIR)) fs.mkdirSync(SHARED_MEM_DIR, { recursive: true });
  const existing = fs.existsSync(fp) ? fs.readFileSync(fp, 'utf8') : `# ${fileName}\n`;
  const dated = `\n## ${new Date().toISOString().split('T')[0]}\n${safeString(entry, '', 200000)}\n`;
  writeTextFileAtomic(fp, existing + dated);
  return { content: [{ type: 'text', text: `Updated ${fileName} with new entry.` }] };
}

function toolListMinds() {
  const minds = loadJSON(MINDS_FILE) || {};
  if (Object.keys(minds).length === 0) {
    return { content: [{ type: 'text', text: 'No minds registered in JARVIS OS.' }] };
  }
  const list = Object.entries(minds).filter(([, m]) => isPlainObject(m)).map(([key, m]) =>
    `- **${m.name}** (${m.emoji || ''}) — ${m.tagline || m.personality || ''}\n  Specialties: ${(m.specialties || []).join(', ')}`
  ).join('\n');
  if (!list) return { content: [{ type: 'text', text: 'No minds registered in JARVIS OS.' }] };
  return { content: [{ type: 'text', text: `Registered minds:\n\n${list}` }] };
}

// ── JSON-RPC 2.0 transport ──────────────────────────────────────
function send(obj) {
  const json = JSON.stringify(obj);
  process.stdout.write(json + '\n');
}

function handleMessage(msg) {
  const { id, method, params } = msg;

  switch (method) {
    case 'initialize':
      send({
        jsonrpc: '2.0', id,
        result: {
          protocolVersion: '2024-11-05',
          capabilities: { tools: {}, resources: {} },
          serverInfo: { name: 'cortex-mesh', version: '0.2.0' }
        }
      });
      break;

    case 'notifications/initialized':
      // No response needed for notifications
      break;

    case 'tools/list':
      send({ jsonrpc: '2.0', id, result: { tools: TOOLS } });
      break;

    case 'resources/list':
      send({ jsonrpc: '2.0', id, result: { resources: RESOURCES } });
      break;

    case 'resources/read': {
      const { uri } = params || {};
      const result = readResource(safeString(uri, '', 400));
      if (result) {
        send({ jsonrpc: '2.0', id, result });
      } else {
        send({ jsonrpc: '2.0', id, error: { code: -32602, message: `Unknown resource: ${uri || ''}` } });
      }
      break;
    }

    case 'tools/call': {
      const { name, arguments: args } = params || {};
      try {
        const result = handleToolCall(name, args || {});
        send({ jsonrpc: '2.0', id, result });
      } catch (err) {
        send({
          jsonrpc: '2.0', id,
          result: { isError: true, content: [{ type: 'text', text: `Error: ${err.message}` }] }
        });
      }
      break;
    }

    case 'ping':
      send({ jsonrpc: '2.0', id, result: {} });
      break;

    default:
      if (id) {
        send({ jsonrpc: '2.0', id, error: { code: -32601, message: `Method not found: ${method}` } });
      }
  }
}

// ── Stdin reader ────────────────────────────────────────────────
const rl = readline.createInterface({ input: process.stdin, terminal: false });

rl.on('line', (line) => {
  if (!line.trim()) return;
  try {
    const msg = JSON.parse(line);
    handleMessage(msg);
  } catch (err) {
    process.stderr.write(`Parse error: ${err.message}\n`);
  }
});

rl.on('close', () => process.exit(0));
process.stderr.write('JARVIS OS MCP server started.\n');
