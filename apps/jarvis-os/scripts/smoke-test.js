#!/usr/bin/env node
const assert = require('assert');
const fs = require('fs');
const os = require('os');
const path = require('path');
const vm = require('vm');
const { spawnSync } = require('child_process');

const ROOT = path.resolve(__dirname, '..');

function read(file) {
  return fs.readFileSync(path.join(ROOT, file), 'utf8');
}

function runNodeCheck(file) {
  const result = spawnSync(process.execPath, ['--check', file], {
    cwd: ROOT,
    encoding: 'utf8',
  });
  if (result.status !== 0) {
    throw new Error(`node --check ${file} failed\n${result.stderr || result.stdout}`);
  }
}

function assertInlineScriptsParse() {
  const html = read('index.html');
  const scripts = [...html.matchAll(/<script[^>]*>([\s\S]*?)<\/script>/gi)]
    .map(match => match[1].trim())
    .filter(Boolean);
  assert(scripts.length > 0, 'index.html should contain an inline app script');
  scripts.forEach((script, index) => {
    new vm.Script(script, { filename: `index.html<script:${index + 1}>` });
  });
}

function loadRendererHelpers() {
  const source = read('index.html');
  const start = source.indexOf('function esc(str)');
  const end = source.indexOf('async function requireBridgeOk', start);
  assert(start >= 0 && end > start, 'Could not extract renderer helper block');
  return new Function(`${source.slice(start, end)}\nreturn { esc, jsArg, safeColor, normalizeCapabilityGroupsForRender, makeClientRecordId };`)();
}

function loadMainHelpers(tmpDir, activeWorkflows = new Map()) {
  const source = read('main.js');
  const start = source.indexOf('function ensureConfigDir');
  const end = source.indexOf('// ── Window state');
  assert(start >= 0 && end > start, 'Could not extract main.js helper block');

  const configDir = path.join(tmpDir, '.cortex');
  const mindsFile = path.join(configDir, 'minds.json');
  const sharedMemDir = path.join(configDir, 'shared-memory');
  const helperSource = source.slice(start, end);
  const factory = new Function(
    'fs',
    'path',
    'os',
    'process',
    'CONFIG_DIR',
    'MINDS_FILE',
    'SHARED_MEM_DIR',
    'activeWorkflows',
    `${helperSource}\nreturn {
      saveJSON,
      loadJSON,
      loadExternalJSONObject,
      writeTextFileAtomic,
      normalizeState,
      normalizeMinds,
      buildStarterMindRegistryEntry,
      normalizeMeshMessages,
      normalizeWorkflows,
      normalizeActivity,
      assertAllowedContentPath,
      assertSafeFolderTarget,
      assertEmptyOrMissingFolder,
      trackCreatedMindFolder,
      commitCreatedMindFolders,
      rollbackInstallTargets,
      cleanupCreatedMindFolders,
      assertMindFolderOperation
    };`
  );

  return {
    configDir,
    mindsFile,
    sharedMemDir,
    helpers: factory(fs, path, os, process, configDir, mindsFile, sharedMemDir, activeWorkflows),
  };
}

function assertNormalizationAndBackup() {
  const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'cortex-normalize-'));
  try {
    const activeWorkflows = new Map([['active-wf', {}]]);
    const { helpers } = loadMainHelpers(tmpDir, activeWorkflows);
    const {
      normalizeState,
      normalizeMinds,
      normalizeMeshMessages,
      normalizeWorkflows,
      normalizeActivity,
      buildStarterMindRegistryEntry,
      saveJSON,
      loadJSON,
      loadExternalJSONObject,
      writeTextFileAtomic,
    } = helpers;

    const state = normalizeState({
      theme: 'neon',
      defaultFolder: '\0 ~/Brains ',
      windowBounds: { width: 10, height: '20', x: '4.9', y: -9.2 },
      sharedMemory: { atlas: { access: 'read' }, forge: 'bogus' },
      dismissedReadinessIds: ['a', 42, '', null],
      welcomeDismissed: 'yes',
      defaultProvider: 'bogus',
    });
    assert.strictEqual(state.theme, 'light');
    assert.strictEqual(state.defaultFolder, '~/Brains');
    assert.deepStrictEqual(state.windowBounds, { width: 600, height: 400, x: 5, y: -9 });
    assert.deepStrictEqual(state.sharedMemory, {
      atlas: { access: 'read' },
      forge: { access: 'readwrite' },
    });
    assert.deepStrictEqual(state.dismissedReadinessIds, ['a', '42']);
    assert.strictEqual(state.welcomeDismissed, true);
    assert.strictEqual(state.defaultProvider, 'claude');

    const minds = normalizeMinds({
      atlas: {
        name: 'Atlas',
        icon: '🧭',
        subtitle: 'Atlas subtitle',
        description: 'Atlas description',
        tags: ['Navigator', null],
        color: 'not-a-color',
        status: '',
        memory: 500,
        sessions: -2,
        mcpTools: { slack: 1 },
        capabilities: {
          system: { trust: 'root', policy: 'delete', tools: ['Read', 42, '', null] },
          quick: ['Bash', null, ''],
        },
        schedules: [
          {
            id: '',
            name: '',
            interval: '1d',
            action: 'think',
            enabled: true,
            running: true,
            nextRun: 'not-a-date',
            lastRun: 'also-bad',
            lastStatus: 'surprising',
          },
          {
            id: 'dup',
            name: 'Second',
            interval: '1h',
            action: 'review',
            enabled: true,
          },
          {
            id: 'dup',
            name: 'Third',
            interval: '2h',
            action: 'plan',
            enabled: false,
          },
          {
            id: '',
            name: 'Fourth',
            interval: '3h',
            action: 'write',
            enabled: false,
          },
        ],
      },
      bad: null,
    }, { resetRunning: true });
    assert.deepStrictEqual(Object.keys(minds), ['atlas']);
    assert.strictEqual(minds.atlas.emoji, '🧭');
    assert.strictEqual(minds.atlas.color, '#6366f1');
    assert.strictEqual(minds.atlas.tagline, 'Atlas subtitle');
    assert.strictEqual(minds.atlas.personality, 'Atlas description');
    assert.deepStrictEqual(minds.atlas.specialties, ['Navigator']);
    assert.strictEqual(minds.atlas.status, 'active');
    assert.strictEqual(minds.atlas.memory, 100);
    assert.strictEqual(minds.atlas.sessions, 0);
    assert.deepStrictEqual(minds.atlas.capabilities.system, {
      trust: 'external',
      policy: 'inspect',
      tools: ['Read', '42'],
    });
    assert.deepStrictEqual(minds.atlas.capabilities.quick, {
      trust: 'external',
      policy: 'inspect',
      tools: ['Bash'],
    });
    assert.strictEqual(minds.atlas.schedules.length, 4);
    const scheduleIds = minds.atlas.schedules.map(schedule => schedule.id);
    assert.strictEqual(new Set(scheduleIds).size, scheduleIds.length);
    assert.strictEqual(minds.atlas.schedules[0].running, false);
    assert.ok(scheduleIds[0].startsWith('sched-'));
    assert.strictEqual(scheduleIds[1], 'dup');
    assert.strictEqual(scheduleIds[2], 'dup-2');
    assert.ok(scheduleIds[3].startsWith('sched-'));
    assert.notStrictEqual(scheduleIds[0], scheduleIds[3]);
    assert.strictEqual(minds.atlas.schedules[0].nextRun, null);
    assert.strictEqual(minds.atlas.schedules[0].lastRun, null);
    assert.strictEqual(minds.atlas.schedules[0].lastStatus, 'ready');

    const starter = buildStarterMindRegistryEntry({
      name: 'Starter',
      icon: '✨',
      color: '#123abc',
      subtitle: 'Starter subtitle',
      description: 'Starter description',
      tags: ['Setup'],
      schedules: [{ id: '', name: 'Daily', interval: '1d', action: 'Review', enabled: true, running: true }],
      mcpTools: { github: 1 },
    }, 'starter', path.join(tmpDir, 'starter'));
    assert.strictEqual(starter.name, 'Starter');
    assert.strictEqual(starter.emoji, '✨');
    assert.strictEqual(starter.tagline, 'Starter subtitle');
    assert.strictEqual(starter.personality, 'Starter description');
    assert.deepStrictEqual(starter.specialties, ['Setup']);
    assert.strictEqual(starter.folder, path.join(tmpDir, 'starter'));
    assert.strictEqual(starter.schedules.length, 1);
    assert.strictEqual(starter.schedules[0].running, false);
    assert.ok(starter.schedules[0].id.startsWith('sched-'));
    assert.deepStrictEqual(starter.mcpTools, { github: true });

    const workflows = normalizeWorkflows({
      'stale-wf': { status: 'running', trigger: 'bad', lastRunContext: 123, lastRunAt: 'not-a-date', steps: [{ mind: 'atlas', provider: 'bogus', action: 123, status: 'weird' }] },
      'active-wf': { status: 'running', steps: [] },
    }, { resetStaleRunning: true });
    assert.strictEqual(workflows['stale-wf'].status, 'error');
    assert.strictEqual(workflows['active-wf'].status, 'running');
    assert.strictEqual(workflows['stale-wf'].steps[0].action, '123');
    assert.strictEqual(workflows['stale-wf'].steps[0].provider, 'claude');
    assert.strictEqual(workflows['stale-wf'].steps[0].status, 'idle');
    assert.strictEqual(workflows['stale-wf'].lastRunContext, '123');
    assert.strictEqual(workflows['stale-wf'].lastRunAt, null);

    const activity = normalizeActivity([{ id: '', timestamp: 'not-a-date', title: '', tags: ['ok', null, ''] }, 'bad']);
    assert.strictEqual(activity.length, 1);
    assert.ok(activity[0].id.startsWith('evt-'));
    assert.strictEqual(activity[0].title, 'Activity');
    assert.deepStrictEqual(activity[0].tags, ['ok']);

    const mesh = normalizeMeshMessages([
      null,
      { id: '', from: '\0 Atlas ', to: 'Forge', type: 'strange', status: 'bogus', subject: '', body: 123, timestamp: 'nope' },
      { id: 'ok', from: 'Forge', to: 'Atlas', type: 'query', status: 'complete', subject: 'Done', body: 'Processed', timestamp: '2026-01-01T00:00:00.000Z' },
    ]);
    assert.strictEqual(mesh.length, 2);
    assert.strictEqual(mesh[0].status, 'pending');
    assert.strictEqual(mesh[0].type, 'handoff');
    assert.strictEqual(mesh[0].body, '123');
    assert.strictEqual(mesh[1].id, 'ok');

    const file = path.join(tmpDir, 'state.json');
    saveJSON(file, { version: 1 });
    saveJSON(file, { version: 2 });
    fs.writeFileSync(file, '{bad', 'utf8');
    const originalWarn = console.warn;
    console.warn = () => {};
    try {
      assert.deepStrictEqual(loadJSON(file), { version: 1 });
    } finally {
      console.warn = originalWarn;
    }

    const externalFile = path.join(tmpDir, 'Claude', 'claude_desktop_config.json');
    assert.deepStrictEqual(loadExternalJSONObject(externalFile, 'External config'), { ok: true, data: {} });
    saveJSON(externalFile, { mcpServers: { existing: { command: 'node' } } });
    saveJSON(externalFile, { mcpServers: { newer: { command: 'node' } } });
    fs.writeFileSync(externalFile, '{bad', 'utf8');
    const recoveredExternal = loadExternalJSONObject(externalFile, 'External config');
    assert.strictEqual(recoveredExternal.ok, true);
    assert.strictEqual(recoveredExternal.recoveredFromBackup, true);
    assert.deepStrictEqual(recoveredExternal.data, { mcpServers: { existing: { command: 'node' } } });
    fs.rmSync(`${externalFile}.bak`, { force: true });
    const badExternal = loadExternalJSONObject(externalFile, 'External config');
    assert.strictEqual(badExternal.ok, false);
    assert.match(badExternal.error, /External config is not readable JSON/);

    const textFile = path.join(tmpDir, 'memory', 'soul.md');
    writeTextFileAtomic(textFile, '# Soul\n');
    writeTextFileAtomic(textFile, '# Soul v2\n');
    assert.strictEqual(fs.readFileSync(textFile, 'utf8'), '# Soul v2\n');
    assert.deepStrictEqual(fs.readdirSync(path.dirname(textFile)).filter(name => name.endsWith('.tmp')), []);
  } finally {
    fs.rmSync(tmpDir, { recursive: true, force: true });
  }
}

function assertPathGuards() {
  const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'cortex-paths-'));
  try {
    const { mindsFile, sharedMemDir, helpers } = loadMainHelpers(tmpDir);
    const mindDir = path.join(tmpDir, 'Minds', 'atlas');
    const plainDir = path.join(tmpDir, 'plain');
    fs.mkdirSync(path.join(mindDir, 'memory'), { recursive: true });
    fs.mkdirSync(plainDir, { recursive: true });
    fs.mkdirSync(sharedMemDir, { recursive: true });
    fs.writeFileSync(path.join(mindDir, 'CLAUDE.md'), '# Atlas\n');
    fs.writeFileSync(path.join(mindDir, 'memory', 'soul.md'), '# Soul\n');
    helpers.saveJSON(mindsFile, { atlas: { name: 'Atlas', folder: mindDir } });

    assert.strictEqual(
      helpers.assertAllowedContentPath(path.join(mindDir, 'memory', 'soul.md')),
      path.join(mindDir, 'memory', 'soul.md')
    );
    assert.strictEqual(
      helpers.assertAllowedContentPath(path.join(sharedMemDir, 'shared-context.md')),
      path.join(sharedMemDir, 'shared-context.md')
    );
    assert.throws(() => helpers.assertAllowedContentPath(path.join(tmpDir, 'outside.md')), /outside JARVIS OS-managed/);
    assert.throws(() => helpers.assertSafeFolderTarget(os.homedir()), /protected/);
    assert.throws(() => helpers.assertSafeFolderTarget(path.dirname(sharedMemDir)), /protected/);
    assert.strictEqual(helpers.assertEmptyOrMissingFolder(path.join(tmpDir, 'new-mind')), path.join(tmpDir, 'new-mind'));
    assert.strictEqual(helpers.assertEmptyOrMissingFolder(plainDir), plainDir);
    fs.writeFileSync(path.join(plainDir, 'note.md'), '# Note\n');
    assert.throws(() => helpers.assertEmptyOrMissingFolder(plainDir), /already exists and is not empty/);
    assert.throws(() => helpers.assertEmptyOrMissingFolder(path.join(mindDir, 'CLAUDE.md')), /is not a folder/);

    const newInstallDir = path.join(tmpDir, 'install-new');
    const existingInstallDir = path.join(tmpDir, 'install-existing');
    fs.mkdirSync(path.join(newInstallDir, 'memory'), { recursive: true });
    fs.writeFileSync(path.join(newInstallDir, 'memory', 'soul.md'), '# Partial\n');
    fs.mkdirSync(existingInstallDir, { recursive: true });
    fs.writeFileSync(path.join(existingInstallDir, 'copied.md'), '# Copied\n');
    helpers.rollbackInstallTargets([
      { destDir: newInstallDir, existedBefore: false },
      { destDir: existingInstallDir, existedBefore: true },
    ]);
    assert.strictEqual(fs.existsSync(newInstallDir), false);
    assert.deepStrictEqual(fs.readdirSync(existingInstallDir), []);

    const cleanupDir = path.join(tmpDir, 'cleanup-created');
    fs.mkdirSync(path.join(cleanupDir, 'memory'), { recursive: true });
    fs.writeFileSync(path.join(cleanupDir, 'CLAUDE.md'), '# Cleanup\n');
    fs.writeFileSync(path.join(cleanupDir, 'memory', 'soul.md'), '# Soul\n');
    const untrackedCleanup = helpers.cleanupCreatedMindFolders([cleanupDir]);
    assert.strictEqual(untrackedCleanup.ok, false);
    assert.match(untrackedCleanup.error, /not created by this JARVIS OS setup flow/);
    helpers.trackCreatedMindFolder(cleanupDir);
    helpers.trackCreatedMindFolder(path.join(tmpDir, 'already-gone'));
    const cleanupRes = helpers.cleanupCreatedMindFolders([cleanupDir, path.join(tmpDir, 'already-gone')]);
    assert.strictEqual(cleanupRes.ok, true);
    assert.strictEqual(fs.existsSync(cleanupDir), false);
    assert.strictEqual(cleanupRes.removed.length, 1);
    assert.strictEqual(cleanupRes.skipped.length, 1);

    const existingCleanupDir = path.join(tmpDir, 'cleanup-existing');
    fs.mkdirSync(path.join(existingCleanupDir, 'memory'), { recursive: true });
    fs.writeFileSync(path.join(existingCleanupDir, 'CLAUDE.md'), '# Cleanup\n');
    fs.writeFileSync(path.join(existingCleanupDir, 'memory', 'soul.md'), '# Soul\n');
    helpers.trackCreatedMindFolder(existingCleanupDir, { existedBefore: true });
    const existingCleanupRes = helpers.cleanupCreatedMindFolders([existingCleanupDir]);
    assert.strictEqual(existingCleanupRes.ok, true);
    assert.strictEqual(fs.existsSync(existingCleanupDir), true);
    assert.deepStrictEqual(fs.readdirSync(existingCleanupDir), []);

    const committedDir = path.join(tmpDir, 'cleanup-committed');
    fs.mkdirSync(path.join(committedDir, 'memory'), { recursive: true });
    fs.writeFileSync(path.join(committedDir, 'CLAUDE.md'), '# Committed\n');
    fs.writeFileSync(path.join(committedDir, 'memory', 'soul.md'), '# Soul\n');
    helpers.trackCreatedMindFolder(committedDir);
    const commitRes = helpers.commitCreatedMindFolders([committedDir]);
    assert.strictEqual(commitRes.ok, true);
    assert.strictEqual(commitRes.committed.length, 1);
    const committedCleanup = helpers.cleanupCreatedMindFolders([committedDir]);
    assert.strictEqual(committedCleanup.ok, false);
    assert.match(committedCleanup.error, /not created by this JARVIS OS setup flow/);

    helpers.trackCreatedMindFolder(mindDir);
    const registeredCleanup = helpers.cleanupCreatedMindFolders([mindDir]);
    assert.strictEqual(registeredCleanup.ok, false);
    assert.match(registeredCleanup.error, /registered mind folder/);

    helpers.trackCreatedMindFolder(plainDir);
    const plainCleanup = helpers.cleanupCreatedMindFolders([plainDir]);
    assert.strictEqual(plainCleanup.ok, false);
    assert.match(plainCleanup.error, /does not look like a JARVIS OS-created mind folder/);

    assert.strictEqual(helpers.assertMindFolderOperation(mindDir, { requireMindShape: true }), mindDir);
    assert.throws(() => helpers.assertMindFolderOperation(plainDir, { requireMindShape: true }), /look like a JARVIS OS mind folder/);
  } finally {
    fs.rmSync(tmpDir, { recursive: true, force: true });
  }
}

function assertMcpAccessGuards() {
  const source = read('cortex-mcp-server.js');
  const end = source.indexOf('// ── JSON-RPC');
  assert(end > 0, 'Could not isolate MCP tool section');

  const tmpHome = fs.mkdtempSync(path.join(os.tmpdir(), 'cortex-mcp-'));
  try {
    const configDir = path.join(tmpHome, '.cortex');
    const sharedDir = path.join(configDir, 'shared-memory');
    const atlasDir = path.join(tmpHome, 'atlas');
    const forgeDir = path.join(tmpHome, 'forge');
    const plainDir = path.join(tmpHome, 'plain-target');
    fs.mkdirSync(path.join(atlasDir, 'owners-inbox'), { recursive: true });
    fs.mkdirSync(path.join(forgeDir, 'owners-inbox'), { recursive: true });
    fs.mkdirSync(path.join(plainDir, 'owners-inbox'), { recursive: true });
    fs.mkdirSync(sharedDir, { recursive: true });
    fs.writeFileSync(path.join(atlasDir, 'CLAUDE.md'), '# Atlas\n', 'utf8');
    fs.writeFileSync(path.join(forgeDir, 'CLAUDE.md'), '# Forge\n', 'utf8');
    fs.writeFileSync(path.join(sharedDir, 'shared-context.md'), '# Shared\n', 'utf8');
    fs.writeFileSync(path.join(configDir, 'minds.json'), JSON.stringify({
      atlas: { name: 'Atlas', folder: atlasDir },
      forge: { name: 'Forge', folder: forgeDir },
      plain: { name: 'Plain', folder: plainDir },
      malformed: null,
    }, null, 2));
    fs.writeFileSync(path.join(configDir, 'state.json'), JSON.stringify({
      sharedMemory: { atlas: { access: 'readwrite' }, forge: { access: 'read' } },
    }, null, 2));
    fs.writeFileSync(path.join(configDir, 'workflows.json'), JSON.stringify({
      review: {
        name: 'Review Flow',
        status: 'complete',
        trigger: 'manual',
        description: 'Traceable review path',
        steps: [{ mind: 'forge', provider: 'codex', action: 'Review code', status: 'complete', output: 'Looks good' }],
      },
    }, null, 2));
    fs.writeFileSync(path.join(configDir, 'activity.json'), JSON.stringify([
      { timestamp: new Date().toISOString(), mind: 'forge', title: 'Workflow complete', desc: 'Review Flow', tags: ['workflow'] },
    ], null, 2));

    const sandbox = {
      console,
      process: { pid: process.pid, stdout: { write() {} }, stderr: { write() {} }, stdin: {} },
      require(name) {
        if (name === 'os') return { ...os, homedir: () => tmpHome };
        return require(name);
      },
    };
    vm.createContext(sandbox);
    vm.runInContext(
      `${source.slice(0, end)}
      this.api = {
        resolveSharedMemoryFile,
        toolGetSharedContext,
        toolUpdateSharedContext,
        toolSendToMind,
        toolCheckInbox,
        toolMarkRead,
        toolListMinds,
        readResource,
        RESOURCES,
        loadJSON,
        saveJSONAtomic,
        resolveMindFolder,
        normalizeMeshMessages
      };`,
      sandbox,
      { filename: 'cortex-mcp-server.js' }
    );

    const { api } = sandbox;
    const meshFile = path.join(configDir, 'mesh.json');
    api.saveJSONAtomic(meshFile, [{ id: 'older' }]);
    api.saveJSONAtomic(meshFile, [{ id: 'newer' }]);
    fs.writeFileSync(meshFile, '{bad', 'utf8');
    const originalWarn = console.warn;
    let recoveredMesh;
    console.warn = () => {};
    try {
      recoveredMesh = api.loadJSON(meshFile);
    } finally {
      console.warn = originalWarn;
    }
    assert.deepStrictEqual(JSON.parse(JSON.stringify(recoveredMesh)), [{ id: 'older' }]);
    console.warn = () => {};
    try {
      api.saveJSONAtomic(meshFile, []);
    } finally {
      console.warn = originalWarn;
    }
    const normalizedMcpMesh = api.normalizeMeshMessages([null, { to: 'Forge', status: 'weird', subject: '', body: 42 }]);
    assert.strictEqual(JSON.parse(JSON.stringify(normalizedMcpMesh)).length, 1);
    assert.strictEqual(normalizedMcpMesh[0].status, 'pending');
    assert.strictEqual(normalizedMcpMesh[0].type, 'handoff');

    assert.strictEqual(api.toolCheckInbox().isError, true);
    assert.strictEqual(api.resolveSharedMemoryFile('../outside.md').ok, false);
    assert.strictEqual(api.resolveMindFolder(forgeDir).ok, true);
    assert.strictEqual(api.resolveMindFolder(plainDir).ok, false);
    assert.strictEqual(api.toolGetSharedContext({ mind_name: 'Atlas', file: '../outside.md' }).isError, true);
    assert.strictEqual(api.toolUpdateSharedContext({ mind_name: 'Forge', file: 'shared-context.md', entry: 'Nope' }).isError, true);
    assert.ok(api.toolMarkRead().content[0].text.includes('missing id'));
    assert.ok(api.toolListMinds().content[0].text.includes('Registered minds'));
    assert.ok(api.RESOURCES.some(resource => resource.uri === 'cortex://workflows'));
    assert.ok(api.readResource('cortex://minds').contents[0].text.includes('Atlas'));
    assert.ok(api.readResource('cortex://workflows').contents[0].text.includes('Review Flow'));
    assert.ok(api.readResource('cortex://activity').contents[0].text.includes('Workflow complete'));
    assert.ok(api.readResource('cortex://shared-memory').contents[0].text.includes('Shared'));

    api.saveJSONAtomic(meshFile, [
      null,
      { id: 'raw', from: 'Atlas', to: 'Forge', status: 'pending', subject: 'Raw', body: 'Hello', type: 'query' },
      { id: 'coerced', from: 'Atlas', to: 'Forge', status: 'not-real', subject: '', body: 99, type: 'odd' },
    ]);
    const dirtyInbox = api.toolCheckInbox({ mind_name: 'Forge' }).content[0].text;
    assert.ok(dirtyInbox.includes('Raw'));
    assert.ok(dirtyInbox.includes('coerced'));
    assert.ok(api.toolMarkRead({ message_id: 'raw' }).content[0].text.includes('marked as complete'));

    const sendRes = api.toolSendToMind({ from: 'Atlas', to: 'Forge', subject: 'Review', body: 'Please review', type: 'query' });
    assert.ok(sendRes.content[0].text.includes('Message sent to Forge'));
    assert.strictEqual(fs.readdirSync(path.join(forgeDir, 'owners-inbox')).length, 1);
    assert.ok(api.toolCheckInbox({ mind_name: 'Forge' }).content[0].text.includes('Review'));

    const plainRes = api.toolSendToMind({ from: 'Atlas', to: 'Plain', subject: 'No file write', body: 'Mesh only', type: 'query' });
    assert.ok(plainRes.content[0].text.includes('Message sent to Plain'));
    assert.strictEqual(fs.readdirSync(path.join(plainDir, 'owners-inbox')).length, 0);
  } finally {
    fs.rmSync(tmpHome, { recursive: true, force: true });
  }
}

function assertAtomicTextWriteContracts() {
  const main = read('main.js');
  const mcp = read('cortex-mcp-server.js');
  const writeFileStart = main.indexOf("ipcMain.handle('write-file'");
  const scaffoldStart = main.indexOf("ipcMain.handle('scaffold-mind'");
  const scheduleStart = main.indexOf('// ── Schedules');
  const deliverStart = main.indexOf("ipcMain.handle('deliver-mesh-to-inbox'");
  assert(writeFileStart >= 0 && scaffoldStart > writeFileStart && scheduleStart > scaffoldStart && deliverStart > scheduleStart, 'Could not isolate text write handlers');
  const writeFileBody = main.slice(writeFileStart, scaffoldStart);
  const scaffoldToSchedules = main.slice(scaffoldStart, scheduleStart);
  const mainDeliverBody = main.slice(deliverStart);
  assert.ok(main.includes('function writeTextFileAtomic(filePath, content)'), 'main process should define an atomic text writer');
  assert.ok(writeFileBody.includes('writeTextFileAtomic(expanded, content)'), 'memory file saves should use atomic text writes');
  assert.ok(scaffoldToSchedules.includes("writeTextFileAtomic(path.join(expanded, 'CLAUDE.md')"), 'scaffolded CLAUDE.md should use atomic text writes');
  assert.ok(scaffoldToSchedules.includes("writeTextFileAtomic(path.join(expanded, 'memory', 'soul.md')"), 'scaffolded soul.md should use atomic text writes');
  assert.ok(main.includes('writeTextFileAtomic(fp, content)'), 'shared-memory default files should use atomic text writes');
  assert.ok(main.includes('function writeMindImportMemory') && main.includes('writeTextFileAtomic(filePath, markdown)'), 'memory imports should use atomic text writes');
  assert.ok(mainDeliverBody.includes('writeTextFileAtomic(path.join(inboxDir, fileName), content)'), 'main mesh inbox delivery should use atomic text writes');
  assert.ok(mcp.includes('function writeTextFileAtomic(fp, content)'), 'MCP server should define an atomic text writer');
  assert.ok(mcp.includes('writeTextFileAtomic(inboxFile, content)'), 'MCP inbox delivery should use atomic text writes');
  assert.ok(mcp.includes('writeTextFileAtomic(fp, existing + dated)'), 'MCP shared-context updates should use atomic text writes');
}

function assertMeshNormalizationContracts() {
  const main = read('main.js');
  const mcp = read('cortex-mcp-server.js');
  const loadMeshStart = main.indexOf("ipcMain.handle('load-mesh'");
  const saveMeshStart = main.indexOf("ipcMain.handle('save-mesh'");
  const workflowsStart = main.indexOf('// ── Workflows', saveMeshStart);
  assert(loadMeshStart >= 0 && saveMeshStart > loadMeshStart && workflowsStart > saveMeshStart, 'Could not isolate main mesh IPC handlers');
  const mainMeshBody = main.slice(loadMeshStart, workflowsStart);
  assert.ok(main.includes('function normalizeMeshMessages(value)'), 'main process should normalize mesh messages');
  assert.ok(mainMeshBody.includes('normalizeMeshMessages(loadJSON(MESH_FILE))'), 'load-mesh should normalize persisted mesh messages');
  assert.ok(mainMeshBody.includes('saveJSON(MESH_FILE, normalizeMeshMessages(messages))'), 'save-mesh should normalize incoming mesh messages');
  assert.ok(mcp.includes('function normalizeMeshMessages(value)'), 'MCP server should normalize mesh messages');
  assert.ok(mcp.includes('const messages = normalizeMeshMessages(loadJSON(MESH_FILE));'), 'MCP tools should normalize mesh messages before use');
}

function assertStarterInstallGuardMarkers() {
  const source = read('main.js');
  const start = source.indexOf("ipcMain.handle('install-starter-minds'");
  const end = source.indexOf('// ── CLI Orchestration', start);
  assert(start >= 0 && end > start, 'Could not isolate starter install handler');
  const handler = source.slice(start, end);
  assert.ok(handler.includes('assertEmptyOrMissingFolder(destDir'), 'starter install should preflight destination folders');
  assert.ok(handler.includes('copyDirRecursive(mindDir, destDir)'), 'starter install should use the shared recursive copy helper');
  assert.ok(!handler.includes('const copyDir ='), 'starter install should not define a separate copy helper');
  assert.ok(
    handler.indexOf('assertEmptyOrMissingFolder(destDir') < handler.indexOf('copyDirRecursive(mindDir, destDir)'),
    'starter install should preflight collisions before copying files'
  );
  assert.ok(handler.includes('rollbackTargets.push'), 'starter install should track folders it creates');
  assert.ok(handler.includes('rollbackInstallTargets(rollbackTargets)'), 'starter install should roll back partial folders on failure');
  assert.ok(source.includes('function buildStarterMindRegistryEntry(meta, key, folder)'), 'starter metadata should have a normalized registry builder');
  assert.ok(handler.includes('buildStarterMindRegistryEntry(meta, key, destDir)'), 'starter install should normalize metadata through the registry builder');
}

function assertBrowserPreviewStartupContract() {
  const html = read('index.html');
  const bridgeStart = html.indexOf('const REQUIRED_ELECTRON_API = [');
  const initStart = html.indexOf('async function init()');
  const initEnd = html.indexOf('// Listen for menu commands', initStart);
  const readinessStart = html.indexOf('function buildReadinessInsights');
  const readinessEnd = html.indexOf('async function runReadinessAction', readinessStart);
  const pulseStart = html.indexOf('function renderPulse');
  const pulseEnd = html.indexOf('function renderActivity', pulseStart);
  const cmdStart = html.indexOf('function getCmdItems');
  const cmdEnd = html.indexOf('function filterCmd', cmdStart);
  assert(bridgeStart >= 0, 'renderer should define the Electron bridge contract');
  assert(initStart >= 0 && initEnd > initStart, 'Could not isolate renderer init');
  assert(readinessStart >= 0 && readinessEnd > readinessStart, 'Could not isolate readiness builder');
  assert(pulseStart >= 0 && pulseEnd > pulseStart, 'Could not isolate Pulse renderer');
  assert(cmdStart >= 0 && cmdEnd > cmdStart, 'Could not isolate command palette builder');

  const bridgeBlock = html.slice(bridgeStart, initStart);
  const initBody = html.slice(initStart, initEnd);
  const readinessBody = html.slice(readinessStart, readinessEnd);
  const pulseBody = html.slice(pulseStart, pulseEnd);
  const cmdBody = html.slice(cmdStart, cmdEnd);
  const rawElectronRefs = [...html.matchAll(/window\.electronAPI/g)].map(match => match.index);

  assert.ok(bridgeBlock.includes('function getElectronAPI()'), 'renderer should validate the Electron API before using it');
  assert.ok(bridgeBlock.includes('function isBrowserPreviewMode()'), 'renderer should define an explicit browser preview mode');
  assert.ok(bridgeBlock.includes('REQUIRED_ELECTRON_API.every'), 'renderer should require the full preload contract');
  assert.ok(bridgeBlock.includes("'installStarterMinds'"), 'bridge contract should include starter install support');
  assert.ok(bridgeBlock.includes("'selectImportSource'") && bridgeBlock.includes("'ingestMemorySource'"), 'bridge contract should include memory import support');
  assert.ok(bridgeBlock.includes("'checkClaudeCli'"), 'bridge contract should include Claude CLI setup verification');
  assert.ok(bridgeBlock.includes("'checkCodexCli'"), 'bridge contract should include Codex CLI setup verification');
  assert.ok(bridgeBlock.includes("'draftMindFromBrief'"), 'bridge contract should include AI mind draft support');
  assert.ok(bridgeBlock.includes("'draftWorkflowFromBrief'"), 'bridge contract should include AI workflow draft support');
  assert.ok(bridgeBlock.includes("'draftAutomationFromBrief'"), 'bridge contract should include Automate This draft support');
  assert.ok(bridgeBlock.includes("'openFolder'"), 'bridge contract should include session launch support');
  assert.ok(initBody.includes('const api = getElectronAPI();'), 'init should use the validated bridge helper');
  assert.ok(initBody.includes('if (api) {'), 'init should only load persisted data through a validated bridge');
  assert.ok(initBody.includes('minds = buildStarterPreviewMinds();'), 'browser preview should seed bundled starter minds');
  assert.ok(initBody.includes('hasMinds = true;'), 'browser preview starter minds should bypass the empty welcome path');
  assert.ok(readinessBody.includes('if (isBrowserPreviewMode()) return [];'), 'browser preview should not raise operational readiness issues');
  assert.ok(pulseBody.includes('Read-only preview of the bundled starter minds'), 'Pulse should explain browser preview mode');
  assert.ok(pulseBody.includes('operational checks are disabled until the app runs with the Electron bridge'), 'Pulse should not imply preview readiness is a full audit');
  assert.ok(cmdBody.includes('const previewMode = isBrowserPreviewMode();'), 'command palette should know when it is in browser preview mode');
  assert.ok(cmdBody.includes('if (!previewMode && mindKeys.length && !appSettings.mcpInstalled)'), 'preview command palette should hide runtime MCP setup prompts');
  assert.ok(cmdBody.includes("if (!previewMode) items.push({ section:'Minds', icon:'&#x25B6;'"), 'preview command palette should hide session launch commands');
  assert.strictEqual(rawElectronRefs.length, 1, 'renderer should only touch window.electronAPI inside getElectronAPI');
}

function assertDeleteMindOrder() {
  const html = read('index.html');
  const start = html.indexOf('async function deleteMind');
  const end = html.indexOf('function getDuplicateMindTarget', start);
  assert(start >= 0 && end > start, 'Could not isolate deleteMind');
  const body = html.slice(start, end);
  const persistIdx = body.indexOf('const persisted = await persistMinds()');
  const deleteIdx = body.indexOf('const res = await api.deleteFolder(m.folder)');
  const stopIdx = body.indexOf('await api.stopSchedule(sched.id, key)');
  assert.ok(persistIdx >= 0, 'deleteMind should persist registry changes');
  assert.ok(deleteIdx >= 0, 'deleteMind should move the folder after persistence');
  assert.ok(stopIdx >= 0, 'deleteMind should stop schedules after folder deletion');
  assert.ok(persistIdx < deleteIdx, 'deleteMind should persist registry updates before moving the folder to Trash');
  assert.ok(deleteIdx < stopIdx, 'deleteMind should stop timers only after folder deletion succeeds or is already missing');
  assert.ok(
    body.includes('await restoreRegistrySnapshot(snapshot);') && body.includes("showToast('Delete failed: '"),
    'deleteMind should restore the registry if folder deletion fails after persistence'
  );
}

function assertClaudeRunnerContract() {
  const source = read('main.js');
  const spawnCalls = source.match(/spawn\('claude'/g) || [];
  const codexSpawnCalls = source.match(/spawn\('codex'/g) || [];
  assert.strictEqual(spawnCalls.length, 1, 'Claude CLI spawning should be centralized');
  assert.strictEqual(codexSpawnCalls.length, 1, 'Codex CLI spawning should be centralized');
  assert.ok(source.includes('function runClaudePrompt('), 'main process should use a shared Claude runner');
  assert.ok(source.includes('function runCodexPrompt('), 'main process should use a shared Codex runner');
  assert.ok(source.includes('function runProviderPrompt('), 'main process should route runs through a provider abstraction');
  assert.ok(source.includes('function spawnClaude('), 'main process should centralize Claude process spawning');
  assert.ok(source.includes('function spawnCodex('), 'main process should centralize Codex process spawning');
  assert.ok(source.includes('Claude CLI timed out after'), 'Claude runner should report timeouts clearly');
  assert.ok(source.includes('Codex CLI timed out after'), 'Codex runner should report timeouts clearly');
  assert.ok(source.includes('CLAUDE_BACKGROUND_ALLOWED_TOOLS') && source.includes("'WebFetch'") && source.includes("'WebSearch'"), 'Claude background runs should pre-allow safe research tools');
  assert.ok(source.includes("'--permission-mode', 'acceptEdits'"), 'Claude background runs should avoid hidden permission prompts');
  assert.ok(source.includes("'--ignore-user-config'") && source.includes('CORTEX_CODEX_MODEL'), 'Codex background runs should use isolated supported config');
  assert.ok(source.includes('function parseCodexJsonOutput(') && source.includes("'--json'"), 'Codex background runs should parse JSONL output');
  assert.ok(!source.includes("'--ask-for-approval'"), 'Codex runner should not use removed approval flag');
  assert.ok(!source.includes('timeout: 300000'), 'Claude runner should not rely on spawn timeout options');

  const runMindStart = source.indexOf("ipcMain.handle('run-mind'");
  const draftStart = source.indexOf("ipcMain.handle('draft-mind-from-brief'");
  const draftWorkflowStart = source.indexOf("ipcMain.handle('draft-workflow-from-brief'");
  const draftAutomationStart = source.indexOf("ipcMain.handle('draft-automation-from-brief'");
  const cliCheckStart = source.indexOf("ipcMain.handle('check-claude-cli'");
  const codexCheckStart = source.indexOf("ipcMain.handle('check-codex-cli'");
  const runWorkflowStart = source.indexOf("ipcMain.handle('run-workflow'");
  const cancelStart = source.indexOf("ipcMain.handle('cancel-workflow'");
  assert(runMindStart >= 0 && runWorkflowStart > runMindStart && cancelStart > runWorkflowStart, 'Could not isolate run handlers');
  assert(draftStart >= 0 && draftStart < runMindStart, 'Could not isolate AI mind draft handler');
  assert(draftWorkflowStart >= 0 && draftWorkflowStart > draftStart && draftWorkflowStart < runMindStart, 'Could not isolate AI workflow draft handler');
  assert(draftAutomationStart >= 0 && draftAutomationStart > draftWorkflowStart && draftAutomationStart < runMindStart, 'Could not isolate Automate This draft handler');
  assert(cliCheckStart >= 0 && cliCheckStart < draftStart, 'Could not isolate Claude CLI check handler');
  assert(codexCheckStart >= 0 && codexCheckStart > cliCheckStart && codexCheckStart < draftStart, 'Could not isolate Codex CLI check handler');
  const cliCheckBody = source.slice(cliCheckStart, draftStart);
  const draftBody = source.slice(draftStart, draftWorkflowStart);
  const draftWorkflowBody = source.slice(draftWorkflowStart, draftAutomationStart);
  const draftAutomationBody = source.slice(draftAutomationStart, runMindStart);
  const runMindBody = source.slice(runMindStart, runWorkflowStart);
  const workflowBody = source.slice(runWorkflowStart, cancelStart);
  assert.ok(source.includes('function buildAutomationDraftPrompt('), 'Automate This should build a dedicated automation prompt');
  assert.ok(source.includes('function normalizeAutomationDraft('), 'Automate This drafts should be normalized before returning');
  assert.ok(source.includes('AUTOMATION_PATTERN_GUIDE'), 'Automate This should apply repo-inspired architecture patterns');
  assert.ok(source.includes('operatingSpec') && source.includes('evidencePolicy') && source.includes('executionPolicy'), 'Automate This should return an operating contract');
  assert.ok(cliCheckBody.includes("spawnClaude(['--version']"), 'Claude CLI setup check should use shared Claude spawning');
  assert.ok(cliCheckBody.includes("spawnCodex(['--version']"), 'Codex CLI setup check should use shared Codex spawning');
  assert.ok(draftBody.includes('runClaudePrompt(__dirname, prompt'), 'AI mind drafts should use the shared Claude runner');
  assert.ok(draftBody.includes('normalizeMindDraft(parsed, brief)'), 'AI mind drafts should normalize generated JSON before returning');
  assert.ok(draftWorkflowBody.includes('runClaudePrompt(__dirname, prompt'), 'AI workflow drafts should use the shared Claude runner');
  assert.ok(draftWorkflowBody.includes('normalizeWorkflowDraft(parsed, brief, minds)'), 'AI workflow drafts should normalize generated JSON before returning');
  assert.ok(draftAutomationBody.includes('runClaudePrompt(__dirname, prompt'), 'Automate This drafts should use the shared Claude runner');
  assert.ok(draftAutomationBody.includes('normalizeAutomationDraft(parsed, brief, minds)'), 'Automate This drafts should normalize generated JSON before returning');
  assert.ok(runMindBody.includes('return runProviderPrompt(provider, folder, fullPrompt)'), 'single mind runs should use provider router');
  assert.ok(workflowBody.includes('await runProviderPrompt(provider, folder, fullPrompt'), 'workflow steps should use provider router');
  assert.ok(workflowBody.includes('safeString(payload.runContext') && workflowBody.includes('Run brief from the operator'), 'workflow runs should inject per-run brief context');
  assert.ok(workflowBody.includes('currentProcess.kill'), 'workflow cancellation should kill the active Claude process');
  assert.ok(workflowBody.includes("step.output = cancelled ? 'Cancelled'"), 'workflow cancellation should report Cancelled');
}

function assertWorkflowCleanupContract() {
  const source = read('main.js');
  const runWorkflowStart = source.indexOf("ipcMain.handle('run-workflow'");
  const cancelStart = source.indexOf("ipcMain.handle('cancel-workflow'");
  assert(runWorkflowStart >= 0 && cancelStart > runWorkflowStart, 'Could not isolate run-workflow handler');
  const workflowBody = source.slice(runWorkflowStart, cancelStart);
  const finallyStart = workflowBody.indexOf('finally {');
  assert.ok(source.includes('function sendWorkflowUpdate(payload)'), 'main process should guard workflow renderer updates');
  assert.ok(workflowBody.includes('} catch (err) {'), 'run-workflow should catch unexpected runner errors');
  assert.ok(finallyStart >= 0, 'run-workflow should use finally for cleanup');
  assert.ok(
    workflowBody.indexOf('activeWorkflows.delete(workflowId)', finallyStart) > finallyStart,
    'run-workflow should always clear activeWorkflows in finally'
  );
  assert.ok(
    workflowBody.includes("wf.status = 'error'") && workflowBody.includes('Workflow failed unexpectedly: '),
    'run-workflow should persist and surface unexpected failures'
  );
  assert.ok(
    workflowBody.includes('sendWorkflowUpdate({ workflowId, status: wf.status, done: true });'),
    'run-workflow should always notify the renderer when a workflow exits'
  );
}

function assertMcpInstallContract() {
  const source = read('main.js');
  const installStart = source.indexOf("ipcMain.handle('install-mcp-to-desktop'");
  const checkStart = source.indexOf("ipcMain.handle('check-mcp-installed'");
  const deliverStart = source.indexOf("ipcMain.handle('deliver-mesh-to-inbox'");
  assert(installStart >= 0 && checkStart > installStart && deliverStart > checkStart, 'Could not isolate MCP registration handlers');
  const installBody = source.slice(installStart, checkStart);
  const checkBody = source.slice(checkStart, deliverStart);
  const deliverBody = source.slice(deliverStart);
  assert.ok(source.includes('function loadExternalJSONObject('), 'main process should have a structured external JSON loader');
  assert.ok(installBody.includes("loadExternalJSONObject(CLAUDE_DESKTOP_CONFIG, 'Claude Desktop config')"), 'MCP install should validate Claude Desktop config before writing');
  assert.ok(installBody.includes('saveJSON(CLAUDE_DESKTOP_CONFIG, config)'), 'MCP install should use atomic backup-aware writes');
  assert.ok(installBody.includes('recoveredFromBackup'), 'MCP install should surface backup recovery');
  assert.ok(checkBody.includes("loadExternalJSONObject(CLAUDE_DESKTOP_CONFIG, 'Claude Desktop config')"), 'MCP status check should tolerate malformed Claude config');
  assert.ok(
    deliverBody.includes("assertMindFolderOperation(mind.folder, { requireRegistered: true, requireMindShape: true })"),
    'main-process mesh inbox delivery should only write into registered JARVIS OS-shaped mind folders'
  );
}

function assertScheduleTimerContract() {
  const source = read('main.js');
  const html = read('index.html');
  const preload = read('preload.js');
  assert.ok(source.includes('function normalizeCapabilities(value)'), 'main process should normalize persisted capability groups');
  assert.ok(source.includes('function scheduleTimerKey(mindKey, scheduleId)'), 'main process should define mind-scoped schedule timer keys');
  assert.ok(source.includes('function normalizeISODateString(value)'), 'main process should validate persisted schedule timestamps');
  assert.ok(source.includes('function uniqueRecordId(value, usedIds'), 'main process should de-duplicate persisted record IDs');
  assert.ok(source.includes('usedScheduleIds'), 'mind normalization should track schedule IDs per mind');
  assert.ok(source.includes("new Set(['ready', 'running', 'complete', 'error', 'skipped'])"), 'main process should constrain persisted schedule statuses');
  assert.ok(source.includes('function normalizeScheduleIntervalMs(value)'), 'main process should validate schedule interval input');
  assert.ok(source.includes('Schedule interval must be at least 1 minute'), 'main process should reject too-short schedule intervals');
  assert.ok(source.includes('Schedule interval cannot exceed 30 days'), 'main process should reject too-long schedule intervals');
  assert.ok(!source.includes('safeNumber(intervalMs'), 'main process should not coerce invalid schedule intervals');
  assert.ok(source.includes('function findRegisteredSchedule(minds, mindKey, scheduleId)'), 'main process should verify schedules are registered before starting timers');
  assert.ok(source.includes('`${normalizedMindKey}::${normalizedScheduleId}`'), 'main schedule timer key should include the mind key');
  assert.ok(source.includes('activeTimers[timerKey] = setInterval'), 'main schedule timers should be stored by composite key');
  assert.ok(source.includes('key.endsWith(`::${normalizedScheduleId}`)'), 'main stop/status should preserve legacy schedule-id fallback');
  assert.ok(source.includes("return { ok: false, error: 'Schedule not found' }"), 'main process should reject missing schedule timers');
  assert.ok(source.includes("return { ok: false, error: 'Schedule is disabled' }"), 'main process should reject disabled schedule timers');
  assert.ok(preload.includes('stopSchedule:   (schedId, mindKey)'), 'preload stopSchedule should accept a mind key');
  assert.ok(preload.includes('getScheduleStatus: (schedId, mindKey)'), 'preload getScheduleStatus should accept a mind key');
  assert.ok(html.includes('function scheduleRunKey(mindKey, scheduleId)'), 'renderer should use mind-scoped active schedule keys');
  assert.ok(html.includes('activeScheduleRuns.add(runKey)'), 'renderer should track running schedules by composite key');
  assert.ok(html.includes('api.stopSchedule(sched.id, key)'), 'renderer should stop schedule timers with a mind key');
}

function assertRuntimeCleanupContract() {
  const source = read('main.js');
  assert.ok(source.includes('function stopMeshWatcher()'), 'main process should be able to close the mesh watcher');
  assert.ok(source.includes("meshWatcher.on('error'"), 'mesh watcher should reset itself after watcher errors');
  assert.ok(source.includes('function clearAllScheduleTimers()'), 'main process should clear schedule timers on shutdown');
  assert.ok(source.includes('function cancelActiveWorkflows()'), 'main process should cancel active workflows on shutdown');
  assert.ok(source.includes('function cleanupRuntimeResources()'), 'main process should centralize runtime cleanup');
  assert.ok(source.includes('flushWindowBoundsSave();'), 'runtime cleanup should flush pending window bounds');
  assert.ok(source.includes('clearAllScheduleTimers();'), 'runtime cleanup should clear schedule timers');
  assert.ok(source.includes('cancelActiveWorkflows();'), 'runtime cleanup should cancel workflow processes');
  assert.ok(source.includes('stopMeshWatcher();'), 'runtime cleanup should close mesh watcher resources');
  assert.ok(source.includes("app.on('before-quit', cleanupRuntimeResources);"), 'app should clean runtime resources before quit');
}

function assertRendererSafetyContract() {
  const html = read('index.html');
  const { jsArg, safeColor, normalizeCapabilityGroupsForRender, makeClientRecordId } = loadRendererHelpers();
  const unsafeEscJsArgs = html.match(/onclick="[^"]*'\$\{esc\(/g) || [];
  const dangerousArg = 'bad");alert(1)//<tag>&\u2028';
  const encodedArg = jsArg(dangerousArg);
  const decodedHandler = `openDetail(${encodedArg})`.replace(/&quot;/g, '"');
  const originalRandom = Math.random;
  const originalNow = Date.now;
  const renderedCapabilities = normalizeCapabilityGroupsForRender({
    system: { trust: 'root', policy: 'delete', tools: ['Read', 7, '', null] },
    quick: 'Bash',
  });
  let generatedId;
  try {
    Math.random = () => 0;
    Date.now = () => 1234;
    generatedId = makeClientRecordId('wf', ['wf-1234-0']);
  } finally {
    Math.random = originalRandom;
    Date.now = originalNow;
  }
  assert.ok(html.includes('function jsArg(value)'), 'renderer should encode dynamic JavaScript string arguments');
  assert.ok(html.includes('function safeColor(value'), 'renderer should validate persisted colors before using them in CSS');
  assert.ok(html.includes('function normalizeCapabilityGroupsForRender(value)'), 'renderer should defensively normalize capability groups');
  assert.ok(encodedArg.startsWith('&quot;') && encodedArg.endsWith('&quot;'), 'jsArg should be safe inside double-quoted HTML attributes');
  assert.ok(!encodedArg.includes('<') && !encodedArg.includes('>'), 'jsArg should not allow raw angle brackets');
  assert.strictEqual(vm.runInNewContext(decodedHandler, { openDetail: value => value }), dangerousArg);
  assert.strictEqual(safeColor('red;background:url(x)'), '#6366f1');
  assert.strictEqual(safeColor('#abc'), '#abc');
  assert.strictEqual(safeColor('#abcdef'), '#abcdef');
  assert.deepStrictEqual(renderedCapabilities, [
    { name: 'system', trust: 'external', policy: 'inspect', tools: ['Read', '7'] },
    { name: 'quick', trust: 'external', policy: 'inspect', tools: ['Bash'] },
  ]);
  assert.strictEqual(generatedId, 'wf-1234-2');
  assert.ok(html.includes('const color = safeColor(m.color);'), 'mind cards/details should use validated mind colors');
  assert.ok(html.includes('const capGroups = normalizeCapabilityGroupsForRender(m.capabilities);'), 'detail panel should render normalized capability groups');
  assert.ok(html.includes('const capabilityGroups = normalizeCapabilityGroupsForRender(mind.capabilities);'), 'capability manifest should render normalized capability groups');
  assert.ok(html.includes('onclick="openDetail(${jsArg(key)})"'), 'mind cards should pass keys as encoded JavaScript literals');
  assert.ok(html.includes('onclick="openMem(${jsArg(f.path)},${jsArg(f.name)})"'), 'memory cards should pass paths as encoded JavaScript literals');
  assert.ok(!html.includes('<style>.mind-card[data-key='), 'mind cards should not inject per-card CSS selectors from persisted keys');
  assert.strictEqual(unsafeEscJsArgs.length, 0, 'renderer should not use HTML escaping as JavaScript string escaping in onclick handlers');
  assert.ok(!html.includes('m.color ||'), 'renderer should not render raw persisted mind colors');
  assert.ok(html.includes("makeClientRecordId('msg', meshMessages.map(message => message.id))"), 'mesh messages should use collision-resistant client IDs');
  assert.ok(html.includes("makeClientRecordId('wf', workflows)"), 'workflows should use collision-resistant client IDs');
  assert.ok(html.includes("makeClientRecordId('sched', mind.schedules.map(schedule => schedule.id))"), 'schedules should use collision-resistant client IDs');
}

function assertRendererContractMarkers() {
  const html = read('index.html');
  const preload = read('preload.js');
  const checks = [
    ['shared memory payload uses dirPath', preload.includes('{ dirPath }')],
    ['open session checks launch result', html.includes('Launch failed: ')],
    ['reveal checks result', html.includes('Reveal failed: ')],
    ['mesh save is guarded', html.includes("return requireBridgeOk('Save mesh'")],
    ['mesh rollback exists', html.includes('meshMessages = previousMessages;')],
    ['mesh inbox warning surfaced', html.includes('Inbox delivery failed: ')],
    ['memory importer IPC is exposed', preload.includes('selectImportSource') && preload.includes('ingestMemorySource') && preload.includes('ingest-memory-source')],
    ['workflow lesson IPC is exposed', preload.includes('captureWorkflowMemory') && preload.includes('capture-workflow-memory')],
    ['workflow run context IPC is exposed', preload.includes('runContext') && preload.includes("{ workflowId, runContext }")],
    ['cleanup IPC is exposed', preload.includes('cleanupCreatedMindFolders')],
    ['commit IPC is exposed', preload.includes('commitCreatedMindFolders')],
    ['AI draft IPC is exposed', preload.includes('draftMindFromBrief')],
    ['AI workflow draft IPC is exposed', preload.includes('draftWorkflowFromBrief') && preload.includes('draft-workflow-from-brief')],
    ['Automate This IPC is exposed', preload.includes('draftAutomationFromBrief') && preload.includes('draft-automation-from-brief')],
    ['Claude CLI check IPC is exposed', preload.includes('checkClaudeCli') && preload.includes('check-claude-cli')],
    ['Codex CLI check IPC is exposed', preload.includes('checkCodexCli') && preload.includes('check-codex-cli')],
    ['scaffold accepts AI profile', preload.includes('profile = null') && preload.includes('{ name, folderPath, profile }')],
    ['AI mind modal exists', html.includes('AI Mind Architect') && html.includes('id="mind-brief"')],
    ['AI draft applies fields', html.includes('function applyMindDraft(draft)') && html.includes('pendingMindDraft = draft')],
    ['AI draft passes scaffold profile', html.includes('const scaffoldProfile = !wasEditing && pendingMindDraft') && html.includes('api.scaffoldMind(name, folder, scaffoldProfile)')],
    ['AI workflow architect exists', html.includes('AI Workflow Architect') && html.includes('id="wf-brief"') && html.includes('function generateWorkflowDraft()')],
    ['AI workflow draft opens builder', html.includes('openWfBuilder(null, pendingWorkflowDraft)') && html.includes('Review AI Workflow')],
    ['Automate This UI exists', html.includes('Automate This') && html.includes('id="automation-brief"') && html.includes('function generateAutomationDraft()')],
    ['Automate This applies full blueprint', html.includes('function applyAutomationDraft()') && html.includes('approvalPolicy') && html.includes('memoryPolicy') && html.includes('toolPlan')],
    ['Automate This operating contract exists', html.includes('operatingSpec') && html.includes('evidencePolicy') && html.includes('executionPolicy')],
    ['repo pattern scan exists', html.includes('const ECOSYSTEM_PATTERNS') && html.includes('Open-source Pattern Scan') && html.includes('Install Research Pack')],
    ['repo-inspired templates exist', html.includes('Spec-First Build Harness') && html.includes('Knowledge Graph Consolidation') && html.includes('Connector Validation Lab') && html.includes('Artifact Deliverable Studio')],
    ['expanded tool registry exists', html.includes('n8n MCP') && html.includes('Semantic Code Search') && html.includes('BigQuery') && html.includes('Screen Recorder')],
    ['Automate This command exists', html.includes("title:'Automate This'") && html.includes("document.getElementById('automation-brief')?.focus()")],
    ['provider controls exist', html.includes('const AI_PROVIDERS') && html.includes('function updateDefaultProvider') && html.includes('wf-step-provider') && html.includes('run-mind-provider-')],
    ['workflow steps persist provider', html.includes('provider: normalizeProviderId(el.querySelector') && html.includes('providerOptionsHTML(providerVal)')],
    ['memory importer exists', html.includes('Memory Importer') && html.includes('function importMemorySource()') && html.includes('memory-import-source')],
    ['workflow memory capture exists', html.includes('function captureWorkflowMemory(wfId)') && html.includes('Capture Memory')],
    ['workflow run brief exists', html.includes('function workflowRunContextConfig(wf)') && html.includes('returnContext:true') && html.includes('Last run brief')],
    ['workflow approval explains background tools', html.includes('Background tools: safe read/search/fetch tools may run without hidden provider popups')],
    ['tool registry uses structured cards', html.includes('class="tool-category-header"') && html.includes('class="tool-mind-toggle') && html.includes('aria-pressed=')],
    ['tool registry removed old inline toggle strip', !html.includes('display:flex;flex-wrap:wrap;gap:4px;margin-top:8px')],
    ['guide tab is first-class view', html.includes('data-view="guide"') && html.includes('id="view-guide"') && html.includes('function renderGuide()') && html.includes("navTo('guide')")],
    ['setup tab verifies app readiness', html.includes('data-view="setup"') && html.includes('id="view-setup"') && html.includes('function renderSetup()') && html.includes('function verifySetup()') && html.includes('Verify Everything')],
    ['review center is first-class view', html.includes('data-view="review"') && html.includes('id="view-review"') && html.includes('function renderReviewCenter()') && html.includes('Review Center')],
    ['approval gate modal exists', html.includes('id="approval-modal"') && html.includes('function requestApproval') && html.includes('function resolveApproval')],
    ['risky actions request approval', html.includes('Approve Workflow Run') && html.includes('Approve Memory Import') && html.includes('Approve Codex Mind Run')],
    ['trace timeline and scorecards exist', html.includes('function renderWorkflowTraceCard') && html.includes('function buildMindScorecard') && html.includes('Mind Evaluation')],
    ['automation templates exist', html.includes('const AUTOMATION_TEMPLATES') && html.includes('Daily Command Center') && html.includes('Website Growth Lab') && html.includes('Weekly Review Ritual')],
    ['automation template installer exists', html.includes('function renderAutomationTemplateLibrary()') && html.includes('function installAllAutomationTemplates()') && html.includes('function installAutomationTemplates')],
    ['automation templates seed paused schedules', html.includes('enabled: false') && html.includes('Related JARVIS OS workflow') && html.includes('paused schedule')],
    ['post-install cleanup exists', html.includes('const installedFolders = Object.values(res.minds)') && html.includes('cleanupCreatedMindFolders(installedFolders')],
    ['post-install commit exists', html.includes('commitCreatedMindFolders(installedFolders')],
    ['failed duplicate uses cleanup not trash', html.includes('cleanupCreatedMindFolders([target.folder]') && !html.includes('deleteFolder(target.folder).catch')],
    ['successful duplicate commits folder', html.includes('commitCreatedMindFolders([target.folder]')],
    ['successful create commits folder', html.includes('if (!wasEditing) await commitCreatedMindFolders([folder]')],
    ['schedule resume handles failure', html.includes('Some schedules could not be resumed')],
    ['workflow run catches rejection', html.includes('Workflow error: ') && html.includes('}).catch(err =>')],
    ['cancel workflow checks result', html.includes('Cancel failed: ')],
    ['blank-slate choice persists', html.includes('appSettings.welcomeDismissed = true;') && html.includes('hasMinds || appSettings.welcomeDismissed')],
    ['blank-slate can reopen starter pack', html.includes('function showStarterPackWelcome()') && html.includes('Install Starter Pack')],
  ];
  const missing = checks.filter(([, ok]) => !ok).map(([name]) => name);
  assert.deepStrictEqual(missing, []);
}

function main() {
  ['main.js', 'preload.js', 'cortex-mcp-server.js'].forEach(runNodeCheck);
  assertInlineScriptsParse();
  assertNormalizationAndBackup();
  assertPathGuards();
  assertMcpAccessGuards();
  assertAtomicTextWriteContracts();
  assertMeshNormalizationContracts();
  assertStarterInstallGuardMarkers();
  assertBrowserPreviewStartupContract();
  assertDeleteMindOrder();
  assertClaudeRunnerContract();
  assertWorkflowCleanupContract();
  assertMcpInstallContract();
  assertScheduleTimerContract();
  assertRuntimeCleanupContract();
  assertRendererSafetyContract();
  assertRendererContractMarkers();
  console.log('JARVIS OS smoke checks passed');
}

main();
