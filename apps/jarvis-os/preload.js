const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electronAPI', {
  // ── File operations ────────────────────────────────────
  openFolder:     (folderPath)             => ipcRenderer.invoke('open-folder',     folderPath),
  readFile:       (filePath)               => ipcRenderer.invoke('read-file',       filePath),
  writeFile:      (filePath, content)      => ipcRenderer.invoke('write-file',      { filePath, content }),
  selectImportSource: ()                   => ipcRenderer.invoke('select-import-source'),
  ingestMemorySource: (payload)            => ipcRenderer.invoke('ingest-memory-source', payload),
  scanFolder:     (folderPath)             => ipcRenderer.invoke('scan-folder',     folderPath),
  deleteFolder:   (folderPath)             => ipcRenderer.invoke('delete-folder',   folderPath),
  revealInFinder: (folderPath)             => ipcRenderer.invoke('reveal-in-finder', folderPath),

  // ── Mind management ────────────────────────────────────
  scaffoldMind:   (name, folderPath, profile = null) => ipcRenderer.invoke('scaffold-mind',   { name, folderPath, profile }),
  copyMindFolder: (sourcePath, destPath)    => ipcRenderer.invoke('copy-mind-folder', { sourcePath, destPath }),

  // ── First-run setup ─────────────────────────────────────
  installStarterMinds: (targetDir)         => ipcRenderer.invoke('install-starter-minds', targetDir),
  cleanupCreatedMindFolders: (folderPaths) => ipcRenderer.invoke('cleanup-created-mind-folders', folderPaths),
  commitCreatedMindFolders: (folderPaths)  => ipcRenderer.invoke('commit-created-mind-folders', folderPaths),

  // ── Mesh (inter-mind messaging) ────────────────────────
  loadMesh:       ()                       => ipcRenderer.invoke('load-mesh'),
  saveMesh:       (messages)               => ipcRenderer.invoke('save-mesh',       messages),

  // ── Workflows ──────────────────────────────────────────
  loadWorkflows:  ()                       => ipcRenderer.invoke('load-workflows'),
  saveWorkflows:  (workflows)              => ipcRenderer.invoke('save-workflows',  workflows),

  // ── Activity ───────────────────────────────────────────
  loadActivity:   ()                       => ipcRenderer.invoke('load-activity'),
  saveActivity:   (activity)               => ipcRenderer.invoke('save-activity',   activity),

  // ── Schedules ──────────────────────────────────────────
  startSchedule:  (mindKey, schedId, ms)   => ipcRenderer.invoke('start-schedule',  { mindKey, scheduleId: schedId, intervalMs: ms }),
  stopSchedule:   (schedId, mindKey)       => ipcRenderer.invoke('stop-schedule',   { mindKey, scheduleId: schedId }),
  getScheduleStatus: (schedId, mindKey)    => ipcRenderer.invoke('get-schedule-status', { mindKey, scheduleId: schedId }),

  // ── Shared Memory ──────────────────────────────────────
  ensureSharedMemory: (dirPath)            => ipcRenderer.invoke('ensure-shared-memory', { dirPath }),

  // ── State persistence ──────────────────────────────────
  saveState:      (state)                  => ipcRenderer.invoke('save-state',      state),
  loadState:      ()                       => ipcRenderer.invoke('load-state'),
  saveMinds:      (mindsData)              => ipcRenderer.invoke('save-minds',      mindsData),
  loadMinds:      ()                       => ipcRenderer.invoke('load-minds'),

  // ── CLI Orchestration ───────────────────────────────────
  checkClaudeCli: ()                       => ipcRenderer.invoke('check-claude-cli'),
  checkCodexCli:  ()                       => ipcRenderer.invoke('check-codex-cli'),
  draftMindFromBrief: (brief)               => ipcRenderer.invoke('draft-mind-from-brief', { brief }),
  draftWorkflowFromBrief: (brief)           => ipcRenderer.invoke('draft-workflow-from-brief', { brief }),
  draftAutomationFromBrief: (brief)         => ipcRenderer.invoke('draft-automation-from-brief', { brief }),
  runMind:        (mindKey, prompt, prev, provider) => ipcRenderer.invoke('run-mind', { mindKey, prompt, previousOutput: prev, provider }),
  runWorkflow:    (workflowId, runContext = '') => ipcRenderer.invoke('run-workflow', { workflowId, runContext }),
  cancelWorkflow: (workflowId)             => ipcRenderer.invoke('cancel-workflow', { workflowId }),
  captureWorkflowMemory: (workflowId, mindKey, provider) => ipcRenderer.invoke('capture-workflow-memory', { workflowId, mindKey, provider }),

  // ── MCP Server Management ──────────────────────────────
  installMcpToDesktop: ()                  => ipcRenderer.invoke('install-mcp-to-desktop'),
  checkMcpInstalled:   ()                  => ipcRenderer.invoke('check-mcp-installed'),

  // ── Mesh delivery (file-based) ─────────────────────────
  deliverMeshToInbox: (mindKey, message)   => ipcRenderer.invoke('deliver-mesh-to-inbox', { mindKey, message }),

  // ── App info ───────────────────────────────────────────
  getAppInfo:     ()                       => ipcRenderer.invoke('get-app-info'),

  // ── Menu / main process messages ───────────────────────
  onNavigate:     (callback)               => ipcRenderer.on('navigate', (_, view) => callback(view)),
  onAction:       (callback)               => ipcRenderer.on('action',   (_, action) => callback(action)),
  onScheduleFired:(callback)               => ipcRenderer.on('schedule-fired', (_, data) => callback(data)),
  onWorkflowStep: (callback)               => ipcRenderer.on('workflow-step-update', (_, data) => callback(data)),
  onMeshUpdated:  (callback)               => ipcRenderer.on('mesh-updated', (_, data) => callback(data)),
});
