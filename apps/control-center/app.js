const iconPaths = {
  dashboard: '<rect x="3" y="3" width="7" height="7"></rect><rect x="14" y="3" width="7" height="7"></rect><rect x="14" y="14" width="7" height="7"></rect><rect x="3" y="14" width="7" height="7"></rect>',
  agents: '<path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"></path><circle cx="9" cy="7" r="4"></circle><path d="M22 21v-2a4 4 0 0 0-3-3.87"></path><path d="M16 3.13a4 4 0 0 1 0 7.75"></path>',
  memory: '<ellipse cx="12" cy="5" rx="9" ry="3"></ellipse><path d="M3 5v14c0 1.66 4.03 3 9 3s9-1.34 9-3V5"></path><path d="M3 12c0 1.66 4.03 3 9 3s9-1.34 9-3"></path>',
  channels: '<path d="M4.9 19.1a10 10 0 0 1 0-14.2"></path><path d="M7.8 16.2a6 6 0 0 1 0-8.4"></path><circle cx="12" cy="12" r="2"></circle><path d="M16.2 7.8a6 6 0 0 1 0 8.4"></path><path d="M19.1 4.9a10 10 0 0 1 0 14.2"></path>',
  shield: '<path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10"></path><path d="m9 12 2 2 4-4"></path>',
  command: '<path d="M18 3a3 3 0 0 0-3 3v12a3 3 0 1 0 3-3H6a3 3 0 1 0 3 3V6a3 3 0 1 0-3 3h12a3 3 0 1 0 0-6"></path>',
  play: '<polygon points="6 3 20 12 6 21 6 3"></polygon>',
  pause: '<rect x="6" y="4" width="4" height="16"></rect><rect x="14" y="4" width="4" height="16"></rect>',
  plus: '<circle cx="12" cy="12" r="10"></circle><path d="M8 12h8"></path><path d="M12 8v8"></path>',
  search: '<circle cx="11" cy="11" r="8"></circle><path d="m21 21-4.35-4.35"></path>',
  lock: '<rect x="3" y="11" width="18" height="11" rx="2"></rect><path d="M7 11V7a5 5 0 0 1 10 0v4"></path>',
  monitor: '<rect x="2" y="3" width="20" height="14" rx="2"></rect><path d="M8 21h8"></path><path d="M12 17v4"></path>',
  message: '<path d="M21 15a4 4 0 0 1-4 4H7l-4 4V7a4 4 0 0 1 4-4h10a4 4 0 0 1 4 4z"></path>',
  hash: '<path d="M4 9h16"></path><path d="M4 15h16"></path><path d="M10 3 8 21"></path><path d="m16 3-2 18"></path>',
  mic: '<path d="M12 2a3 3 0 0 0-3 3v7a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3Z"></path><path d="M19 10v2a7 7 0 0 1-14 0v-2"></path><path d="M12 19v3"></path>',
  spark: '<path d="m12 3 1.9 5.8L20 11l-6.1 2.2L12 19l-1.9-5.8L4 11l6.1-2.2L12 3Z"></path>',
  clock: '<circle cx="12" cy="12" r="10"></circle><path d="M12 6v6l4 2"></path>',
  file: '<path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8Z"></path><path d="M14 2v6h6"></path>',
  settings: '<path d="M12.22 2h-.44a2 2 0 0 0-2 2l-.13 1.09a7.9 7.9 0 0 0-1.35.56l-.99-.66a2 2 0 0 0-2.56.24l-.31.31a2 2 0 0 0-.24 2.56l.66.99c-.23.43-.42.88-.56 1.35L3.2 10.57a2 2 0 0 0-1.2 1.91v.44a2 2 0 0 0 1.2 1.91l1.1.13c.14.47.33.92.56 1.35l-.66.99a2 2 0 0 0 .24 2.56l.31.31a2 2 0 0 0 2.56.24l.99-.66c.43.23.88.42 1.35.56l.13 1.09a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2l.13-1.09c.47-.14.92-.33 1.35-.56l.99.66a2 2 0 0 0 2.56-.24l.31-.31a2 2 0 0 0 .24-2.56l-.66-.99c.23-.43.42-.88.56-1.35l1.1-.13a2 2 0 0 0 1.2-1.91v-.44a2 2 0 0 0-1.2-1.91l-1.1-.13a7.9 7.9 0 0 0-.56-1.35l.66-.99a2 2 0 0 0-.24-2.56l-.31-.31a2 2 0 0 0-2.56-.24l-.99.66a7.9 7.9 0 0 0-1.35-.56L14.22 4a2 2 0 0 0-2-2Z"></path><circle cx="12" cy="12" r="3"></circle>',
};

const channelIcons = {
  Dashboard: "monitor",
  Telegram: "message",
  Slack: "hash",
  "War Room": "mic",
};

const agentColors = ["#20d0b2", "#5aa7ff", "#a78bfa", "#f2b84b", "#ff6b8a", "#64d989", "#78a6ff"];

const quickTasks = {
  research: {
    prompt: "Research this market and give me the best next move.",
    agent: "researcher",
    skill: "researcher-deep",
    source: "Dashboard",
    risk: "Low",
  },
  write: {
    prompt: "Draft a clear post in my voice about this idea.",
    agent: "content-creator",
    skill: "content-creation",
    source: "Dashboard",
    risk: "Low",
  },
  build: {
    prompt: "Build or fix this workflow and verify it works.",
    agent: "builder",
    skill: "workflow-builder",
    source: "Dashboard",
    risk: "Medium",
  },
  organize: {
    prompt: "Give me a clear briefing and organize my priorities.",
    agent: "scheduler",
    skill: "morning-briefing",
    source: "Dashboard",
    risk: "Low",
  },
  analyze: {
    prompt: "Analyze this business and tell me what matters most.",
    agent: "analyst",
    skill: "competitive-intel",
    source: "Dashboard",
    risk: "Low",
  },
  monitor: {
    prompt: "Monitor this and alert me when something needs action.",
    agent: "orchestrator",
    skill: "persistent-daemon",
    source: "Dashboard",
    risk: "Medium",
  },
};

const state = {
  paused: false,
  viewMode: "simple",
  activeModule: "mission-control",
  activeFilter: "all",
  selectedRisk: "Low",
  selectedPack: "Builder",
  activeAgent: "orchestrator",
  voiceMode: "Main",
  runnerMode: "local",
  usageTotal: 0,
  missions: [],
  agents: [],
  channels: [],
  policies: [],
  securityEvents: [],
  memoryHits: [],
  skills: [],
  setup: {},
  settings: {},
  automations: [],
  artifacts: [],
  events: [],
  runs: [],
  pipelineIndex: -1,
  pipelineTimer: null,
};

const paletteItems = [
  ["Run next mission", "Advance the next queued mission through the safe runner"],
  ["Pause inbound", "Toggle channel ingress kill switch"],
  ["Open Builder pack", "Select builder, app, workflow, and control-plane skills"],
  ["Search memory", "Focus the recall browser"],
  ["Queue channel gateway", "Create a Telegram or Slack adapter mission"],
  ["Switch advanced view", "Inspect runner, channels, policies, and logs"],
];

const elements = {
  appShell: document.querySelector(".app-shell"),
  missionRows: document.querySelector("#missionRows"),
  queuedCount: document.querySelector("#queuedCount"),
  runningCount: document.querySelector("#runningCount"),
  costToday: document.querySelector("#costToday"),
  riskPosture: document.querySelector("#riskPosture"),
  pipelineState: document.querySelector("#pipelineState"),
  pipelineSteps: document.querySelector("#pipelineSteps"),
  terminalLog: document.querySelector("#terminalLog"),
  activityList: document.querySelector("#activityList"),
  agentGrid: document.querySelector("#agentGrid"),
  activeAgent: document.querySelector("#activeAgent"),
  channelStack: document.querySelector("#channelStack"),
  policyList: document.querySelector("#policyList"),
  memoryResults: document.querySelector("#memoryResults"),
  memorySearch: document.querySelector("#memorySearch"),
  usageLedger: document.querySelector("#usageLedger"),
  missionForm: document.querySelector("#missionForm"),
  pauseButton: document.querySelector("#pauseButton"),
  runButton: document.querySelector("#runButton"),
  commandButton: document.querySelector("#commandButton"),
  commandPalette: document.querySelector("#commandPalette"),
  paletteInput: document.querySelector("#paletteInput"),
  paletteResults: document.querySelector("#paletteResults"),
  selectedPack: document.querySelector("#selectedPack"),
  clearLogButton: document.querySelector("#clearLogButton"),
  networkCanvas: document.querySelector("#networkCanvas"),
  simpleForm: document.querySelector("#simpleForm"),
  simplePrompt: document.querySelector("#simplePrompt"),
  simpleMissionList: document.querySelector("#simpleMissionList"),
  simpleRunButton: document.querySelector("#simpleRunButton"),
  simpleAnswer: document.querySelector("#simpleAnswer"),
  runtimeMode: document.querySelector("#runtimeMode"),
  runnerStatus: document.querySelector("#runnerStatus"),
  moduleTitle: document.querySelector("#moduleTitle"),
  agentModuleCount: document.querySelector("#agentModuleCount"),
  agentModuleCanvas: document.querySelector("#agentModuleCanvas"),
  agentDirectory: document.querySelector("#agentDirectory"),
  agentDetail: document.querySelector("#agentDetail"),
  skillCatalog: document.querySelector("#skillCatalog"),
  setupStatus: document.querySelector("#setupStatus"),
  setupPaths: document.querySelector("#setupPaths"),
  memoryModuleForm: document.querySelector("#memoryModuleForm"),
  memoryModuleSearch: document.querySelector("#memoryModuleSearch"),
  memoryModuleResults: document.querySelector("#memoryModuleResults"),
  channelMatrix: document.querySelector("#channelMatrix"),
  channelIngestForm: document.querySelector("#channelIngestForm"),
  securityMode: document.querySelector("#securityMode"),
  securityPolicyList: document.querySelector("#securityPolicyList"),
  securityEvents: document.querySelector("#securityEvents"),
  securityPauseButton: document.querySelector("#securityPauseButton"),
  automationList: document.querySelector("#automationList"),
  automationForm: document.querySelector("#automationForm"),
  artifactCount: document.querySelector("#artifactCount"),
  artifactList: document.querySelector("#artifactList"),
  settingsResolvedMode: document.querySelector("#settingsResolvedMode"),
  settingsForm: document.querySelector("#settingsForm"),
  runnerModeSelect: document.querySelector("#runnerModeSelect"),
  runnerBudgetInput: document.querySelector("#runnerBudgetInput"),
  runnerTimeoutInput: document.querySelector("#runnerTimeoutInput"),
  runnerPermissionSelect: document.querySelector("#runnerPermissionSelect"),
  artifactRetentionInput: document.querySelector("#artifactRetentionInput"),
  settingsPaths: document.querySelector("#settingsPaths"),
};

function svg(name) {
  return `<svg viewBox="0 0 24 24" aria-hidden="true">${iconPaths[name] || iconPaths.dashboard}</svg>`;
}

function hydrateIcons(root = document) {
  root.querySelectorAll("[data-icon]").forEach((node) => {
    node.innerHTML = svg(node.dataset.icon);
  });
}

function formatCost(value) {
  return `$${Number(value || 0).toFixed(2)}`;
}

function timeLabel(value, index = 0) {
  if (!value) return index === 0 ? "now" : `${index * 4}m ago`;
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return index === 0 ? "now" : `${index * 4}m ago`;
  return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
}

function escapeHtml(value) {
  return String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

function compactText(value, limit = 280) {
  const text = String(value || "").replace(/\s+/g, " ").trim();
  if (text.length <= limit) return text;
  return `${text.slice(0, limit).trim()}...`;
}

async function api(path, options = {}) {
  const response = await fetch(path, {
    headers: { "Content-Type": "application/json" },
    ...options,
    body: options.body ? JSON.stringify(options.body) : undefined,
  });
  const payload = await response.json();
  if (!response.ok) throw new Error(payload.error || `Request failed: ${response.status}`);
  return payload;
}

function applyServerState(payload) {
  const next = payload.state || payload;
  state.paused = Boolean(next.paused);
  state.runnerMode = next.runnerMode || "local";
  state.usageTotal = Number(next.usageTotal || 0);
  state.missions = next.missions || [];
  state.agents = next.agents || [];
  state.channels = next.channels || [];
  state.policies = next.policies || [];
  state.securityEvents = next.securityEvents || [];
  state.memoryHits = next.memoryHits || [];
  state.skills = next.skills || [];
  state.setup = next.setup || {};
  state.settings = next.settings || {};
  state.automations = next.automations || [];
  state.artifacts = next.artifacts || [];
  state.events = next.events || [];
  state.runs = next.runs || [];
  renderAll();
}

async function loadState() {
  try {
    const query = encodeURIComponent(elements.memorySearch?.value || "control plane");
    applyServerState(await api(`/api/state?q=${query}`));
  } catch (error) {
    state.events.unshift({ message: `Backend unavailable: ${error.message}` });
    renderActivity();
  }
}

function renderAll() {
  elements.appShell.dataset.paused = String(state.paused);
  elements.runtimeMode.textContent = `${state.runnerMode} runner`;
  elements.runnerStatus.textContent = state.paused ? "Inbound paused" : "SQLite queue online";
  elements.pauseButton.classList.toggle("paused", state.paused);
  elements.pauseButton.querySelector("span:last-child").textContent = state.paused ? "Inbound paused" : "Pause inbound";
  elements.riskPosture.textContent = state.paused ? "Paused" : "Armed";
  elements.securityMode.textContent = state.paused ? "Paused" : "Armed";
  elements.settingsResolvedMode.textContent = `${state.runnerMode} resolved`;
  renderMissions();
  renderAgents();
  renderChannels();
  renderPolicies();
  renderMemory();
  renderSetup();
  renderSkills();
  renderChannelMatrix();
  renderSecurityModule();
  renderAutomations();
  renderArtifacts();
  renderSettings();
  renderLedger();
  renderActivity();
  renderPipeline();
  drawNetwork();
  drawNetwork(elements.agentModuleCanvas, 320);
}

function renderMissions() {
  const filtered = state.missions.filter((mission) => {
    return state.activeFilter === "all" || mission.status === state.activeFilter;
  });

  elements.missionRows.innerHTML = filtered
    .map((mission) => {
      return `
        <article class="mission-card" data-risk="${escapeHtml(mission.risk)}">
          <div class="mission-head">
            <div class="mission-title">
              <strong>${escapeHtml(mission.title)}</strong>
              <span>${escapeHtml(mission.detail || mission.prompt)}</span>
            </div>
            <span class="badge ${mission.status.toLowerCase()}">${escapeHtml(mission.status)}</span>
          </div>
          <div class="mission-meta">
            <span class="badge ${mission.risk.toLowerCase()}">${escapeHtml(mission.risk)}</span>
            <span class="pill">${escapeHtml(mission.agent)}</span>
            <span class="pill">${escapeHtml(mission.source)}</span>
            <span class="pill">${escapeHtml(mission.id)}</span>
          </div>
        </article>
      `;
    })
    .join("");

  elements.queuedCount.textContent = state.missions.filter((mission) => mission.status === "Queued").length;
  elements.runningCount.textContent = state.missions.filter((mission) => mission.status === "Running").length;
  elements.costToday.textContent = formatCost(state.usageTotal);
  renderSimpleMissions();
}

function renderSimpleMissions() {
  const active = state.missions.filter((mission) => mission.status !== "Done").slice(0, 4);
  const visible = active.length ? active : state.missions.slice(0, 3);

  elements.simpleMissionList.innerHTML = `
    <div class="simple-list">
      ${visible
        .map((mission) => {
          return `
            <article class="simple-item">
              <div>
                <strong>${escapeHtml(mission.title)}</strong>
                <span>${escapeHtml(mission.agent)} · ${escapeHtml(mission.source)}</span>
              </div>
              <span class="badge ${mission.status.toLowerCase()}">${escapeHtml(mission.status)}</span>
            </article>
          `;
        })
        .join("")}
    </div>
  `;

  const latest = state.missions.find((mission) => mission.output_summary) || state.missions[0];
  if (latest) {
    elements.simpleAnswer.innerHTML = `
      <strong>${escapeHtml(latest.title)}</strong>
      <span>${escapeHtml(compactText(latest.output_summary || "Queued in the SQLite mission system. Click Run next to execute through the safe runner."))}</span>
    `;
  }
}

function renderAgents() {
  const agents = state.agents.length ? state.agents : [{ name: "orchestrator", role: "Routing and memory" }];
  elements.agentModuleCount.textContent = `${agents.length} agents`;
  elements.agentGrid.innerHTML = agents
    .map((agent) => {
      const active = agent.name === state.activeAgent;
      return `
        <button class="agent-card ${active ? "active" : ""}" type="button" data-agent="${escapeHtml(agent.name)}">
          <div class="agent-card-head">
            <strong>${escapeHtml(agent.name)}</strong>
            <span class="badge low">${active ? "pinned" : "ready"}</span>
          </div>
          <span>${escapeHtml(agent.role)}</span>
        </button>
      `;
    })
    .join("");

  elements.agentDirectory.innerHTML = agents
    .map((agent) => {
      const active = agent.name === state.activeAgent;
      return `
        <button class="agent-card ${active ? "active" : ""}" type="button" data-agent="${escapeHtml(agent.name)}">
          <div class="agent-card-head">
            <strong>${escapeHtml(agent.name)}</strong>
            <span class="badge ${active ? "low" : "queued"}">${escapeHtml(agent.status || "ready")}</span>
          </div>
          <span>${escapeHtml(agent.role)}</span>
          <small>${escapeHtml(agent.model || "Model routed by task")}</small>
        </button>
      `;
    })
    .join("");

  const activeAgent = agents.find((agent) => agent.name === state.activeAgent) || agents[0];
  if (activeAgent) {
    elements.agentDetail.innerHTML = `
      <p class="eyebrow">Pinned agent</p>
      <h3>${escapeHtml(activeAgent.name)}</h3>
      <p>${escapeHtml(activeAgent.role)}</p>
      <div class="detail-row"><span>Model</span><strong>${escapeHtml(activeAgent.model || "Task-routed")}</strong></div>
      <div class="detail-row"><span>Status</span><strong>${escapeHtml(activeAgent.status || "ready")}</strong></div>
      <div class="chip-row">
        ${(activeAgent.skills || []).map((skill) => `<span class="pill">${escapeHtml(skill)}</span>`).join("")}
      </div>
    `;
  }

  document.querySelectorAll("[data-agent]").forEach((button) => {
    button.addEventListener("click", () => {
      state.activeAgent = button.dataset.agent;
      elements.activeAgent.textContent = `${state.activeAgent} pinned`;
      renderAgents();
      drawNetwork();
      drawNetwork(elements.agentModuleCanvas, 320);
    });
  });
}

function renderChannels() {
  elements.channelStack.innerHTML = state.channels
    .map((channel) => {
      return `
        <button class="channel-item" type="button" data-channel="${escapeHtml(channel.name)}">
          <span class="channel-main">
            <span data-icon="${channelIcons[channel.name] || "channels"}"></span>
            <span>
              <strong>${escapeHtml(channel.name)}</strong>
              <span>${escapeHtml(channel.state)}</span>
            </span>
          </span>
          <span class="switch ${channel.enabled ? "on" : ""}" aria-hidden="true"></span>
        </button>
      `;
    })
    .join("");

  hydrateIcons(elements.channelStack);
  elements.channelStack.querySelectorAll("[data-channel]").forEach((button) => {
    button.addEventListener("click", async () => {
      try {
        applyServerState(await api(`/api/channels/${encodeURIComponent(button.dataset.channel)}/toggle`, { method: "POST" }));
      } catch (error) {
        showAnswer("Channel toggle blocked", error.message);
      }
    });
  });
}

function renderPolicies() {
  elements.policyList.innerHTML = state.policies
    .map((policy) => {
      return `
        <button class="policy-item" type="button" data-policy="${escapeHtml(policy.name)}">
          <span class="policy-main">
            <span data-icon="${policy.enabled ? "shield" : "lock"}"></span>
            <span>
              <strong>${escapeHtml(policy.name)}</strong>
              <span>${escapeHtml(policy.detail)}</span>
            </span>
          </span>
          <span class="switch ${policy.enabled ? "on" : ""}" aria-hidden="true"></span>
        </button>
      `;
    })
    .join("");

  hydrateIcons(elements.policyList);
  elements.policyList.querySelectorAll("[data-policy]").forEach((button) => {
    button.addEventListener("click", async () => {
      try {
        applyServerState(await api(`/api/policies/${encodeURIComponent(button.dataset.policy)}/toggle`, { method: "POST" }));
      } catch (error) {
        showAnswer("Policy toggle blocked", error.message);
      }
    });
  });
}

function renderMemory() {
  elements.memoryResults.innerHTML = state.memoryHits
    .map((hit) => `<article class="memory-hit"><strong>${escapeHtml(hit.title)}</strong><span>${escapeHtml(hit.detail)}</span></article>`)
    .join("");
  elements.memoryModuleResults.innerHTML = state.memoryHits
    .map((hit) => {
      return `
        <article class="memory-hit expanded">
          <strong>${escapeHtml(hit.title)}</strong>
          <span>${escapeHtml(hit.detail)}</span>
        </article>
      `;
    })
    .join("");
}

function renderSetup() {
  const setup = state.setup || {};
  elements.setupStatus.textContent = setup.status || "Unknown";
  elements.setupStatus.classList.toggle("warning-pill", setup.configured === false);
  elements.setupPaths.innerHTML = `
    <div class="path-row"><span>Core memory</span><code>${escapeHtml(setup.corePath || "memory/core.md")}</code></div>
    <div class="path-row"><span>L1 facts</span><code>${escapeHtml(setup.l1Path || "memory/L1-critical-facts.md")}</code></div>
    <div class="path-row"><span>Next step</span><strong>${escapeHtml(setup.nextStep || "Load memory at session start")}</strong></div>
  `;
}

function renderSkills() {
  elements.skillCatalog.innerHTML = state.skills
    .map((skill) => {
      return `
        <article class="capability-card">
          <span class="badge low">${escapeHtml(skill.area)}</span>
          <strong>${escapeHtml(skill.name)}</strong>
          <p>${escapeHtml(skill.detail)}</p>
        </article>
      `;
    })
    .join("");
}

function renderChannelMatrix() {
  elements.channelMatrix.innerHTML = state.channels
    .map((channel) => {
      return `
        <article class="matrix-card">
          <div class="matrix-head">
            <span data-icon="${channelIcons[channel.name] || "channels"}"></span>
            <strong>${escapeHtml(channel.name)}</strong>
            <span class="switch ${channel.enabled ? "on" : ""}" aria-hidden="true"></span>
          </div>
          <p>${escapeHtml(channel.state)}</p>
          <button class="ghost-button" type="button" data-channel="${escapeHtml(channel.name)}">
            ${channel.enabled ? "Disable" : "Enable"}
          </button>
        </article>
      `;
    })
    .join("");
  hydrateIcons(elements.channelMatrix);
  elements.channelMatrix.querySelectorAll("[data-channel]").forEach((button) => {
    button.addEventListener("click", async () => {
      try {
        applyServerState(await api(`/api/channels/${encodeURIComponent(button.dataset.channel)}/toggle`, { method: "POST" }));
      } catch (error) {
        showAnswer("Channel toggle blocked", error.message);
      }
    });
  });
}

function renderSecurityModule() {
  elements.securityPolicyList.innerHTML = state.policies
    .map((policy) => {
      return `
        <button class="policy-item" type="button" data-policy="${escapeHtml(policy.name)}">
          <span class="policy-main">
            <span data-icon="${policy.enabled ? "shield" : "lock"}"></span>
            <span>
              <strong>${escapeHtml(policy.name)}</strong>
              <span>${escapeHtml(policy.detail)}</span>
            </span>
          </span>
          <span class="switch ${policy.enabled ? "on" : ""}" aria-hidden="true"></span>
        </button>
      `;
    })
    .join("");
  hydrateIcons(elements.securityPolicyList);
  elements.securityPolicyList.querySelectorAll("[data-policy]").forEach((button) => {
    button.addEventListener("click", async () => {
      try {
        applyServerState(await api(`/api/policies/${encodeURIComponent(button.dataset.policy)}/toggle`, { method: "POST" }));
      } catch (error) {
        showAnswer("Policy toggle blocked", error.message);
      }
    });
  });

  const events = state.securityEvents.length ? state.securityEvents : [{ created_at: "", reason: "No security decisions recorded yet." }];
  elements.securityEvents.innerHTML = events
    .slice(0, 12)
    .map((event, index) => {
      const detail = event.reason ? `${event.decision || "info"}: ${event.reason}` : event.message || "security event";
      return `<li><time>${timeLabel(event.created_at, index)}</time><span>${escapeHtml(detail)}</span></li>`;
    })
    .join("");
}

function renderAutomations() {
  elements.automationList.innerHTML = state.automations
    .map((automation) => {
      return `
        <article class="automation-card">
          <div>
            <strong>${escapeHtml(automation.name)}</strong>
            <span>${escapeHtml(automation.trigger)}</span>
          </div>
          <div class="automation-actions">
            <span class="badge ${automation.status === "Active" ? "low" : "queued"}">${escapeHtml(automation.status)}</span>
            <button class="ghost-button" type="button" data-automation="${escapeHtml(automation.id)}">
              ${automation.status === "Active" ? "Pause" : "Activate"}
            </button>
          </div>
          <small>${escapeHtml(automation.agent)} · ${escapeHtml(automation.skill)}</small>
        </article>
      `;
    })
    .join("");
  elements.automationList.querySelectorAll("[data-automation]").forEach((button) => {
    button.addEventListener("click", async () => {
      try {
        applyServerState(await api(`/api/automations/${encodeURIComponent(button.dataset.automation)}/toggle`, { method: "POST" }));
      } catch (error) {
        showAnswer("Automation toggle blocked", error.message);
      }
    });
  });
}

function renderArtifacts() {
  elements.artifactCount.textContent = `${state.artifacts.length} saved`;
  elements.artifactList.innerHTML = state.artifacts.length
    ? state.artifacts
        .map((artifact) => {
          return `
            <article class="artifact-card">
              <div>
                <strong>${escapeHtml(artifact.title || artifact.mission_id)}</strong>
                <span>${escapeHtml(artifact.mission_id)} · ${escapeHtml(artifact.runtime)} · ${escapeHtml(artifact.status)}</span>
              </div>
              <code>${escapeHtml(artifact.output_path || artifact.stdout_path || "No artifact path")}</code>
              <p>${escapeHtml(artifact.output_summary || "Run artifact recorded by the safe runner boundary.").slice(0, 260)}</p>
            </article>
          `;
        })
        .join("")
    : `<article class="artifact-card"><strong>No artifacts yet</strong><span>Run a mission to create an owners-inbox output.</span></article>`;
}

function renderSettings() {
  const settings = state.settings || {};
  elements.runnerModeSelect.value = settings.runnerMode || "auto";
  elements.runnerBudgetInput.value = settings.runnerMaxBudget || "0.35";
  elements.runnerTimeoutInput.value = settings.runnerTimeout || "120";
  elements.runnerPermissionSelect.value = settings.runnerPermission || "answer-only";
  elements.artifactRetentionInput.value = settings.artifactRetentionDays || "14";
  elements.settingsPaths.innerHTML = `
    <div class="path-row"><span>Workspace</span><code>${escapeHtml(settings.root || "")}</code></div>
    <div class="path-row"><span>SQLite</span><code>${escapeHtml(settings.dbPath || "")}</code></div>
    <div class="path-row"><span>Artifacts</span><code>${escapeHtml(settings.outputDir || "")}</code></div>
    <div class="path-row"><span>Run logs</span><code>${escapeHtml(settings.runLogDir || "")}</code></div>
  `;
}

function renderLedger() {
  elements.usageLedger.innerHTML = state.missions
    .slice(0, 6)
    .map((mission) => {
      return `<div class="ledger-row"><span>${escapeHtml(mission.id)} ${escapeHtml(mission.agent)}</span><strong>${formatCost(mission.cost)}</strong></div>`;
    })
    .join("");
}

function renderActivity() {
  elements.activityList.innerHTML = state.events
    .slice(0, 9)
    .map((event, index) => {
      return `<li><time>${timeLabel(event.created_at, index)}</time><span>${escapeHtml(event.message || event)}</span></li>`;
    })
    .join("");
}

function renderPalette() {
  const query = elements.paletteInput.value.trim().toLowerCase();
  const items = paletteItems.filter(([title, detail]) => {
    return !query || `${title} ${detail}`.toLowerCase().includes(query);
  });

  elements.paletteResults.innerHTML = items
    .map(([title, detail]) => `<button class="palette-item" type="button"><strong>${title}</strong><span>${detail}</span></button>`)
    .join("");
}

function setViewMode(mode) {
  state.viewMode = mode;
  elements.appShell.dataset.view = mode;
  document.querySelectorAll("[data-view-mode]").forEach((button) => {
    button.classList.toggle("active", button.dataset.viewMode === mode);
  });
  window.setTimeout(drawNetwork, 80);
  window.setTimeout(() => drawNetwork(elements.agentModuleCanvas, 320), 80);
}

const moduleTitles = {
  "mission-control": "JARVIS Mission Control",
  agents: "Agent Mesh",
  setup: "Operator Setup",
  memory: "Memory Recall",
  channels: "Channel Gateway",
  security: "Security Center",
  automations: "Automation Registry",
  artifacts: "Artifacts & Runs",
  settings: "Runtime Settings",
};

function setActiveModule(moduleName) {
  state.activeModule = moduleName || "mission-control";
  elements.appShell.dataset.module = state.activeModule;
  elements.moduleTitle.textContent = moduleTitles[state.activeModule] || "JARVIS Control Center";
  document.querySelectorAll("[data-module-link]").forEach((item) => {
    item.classList.toggle("active", item.dataset.moduleLink === state.activeModule);
  });
  document.querySelectorAll("[data-module-panel]").forEach((panel) => {
    panel.classList.toggle("active", panel.dataset.modulePanel === state.activeModule);
  });
  if (state.viewMode !== "advanced" && state.activeModule !== "mission-control") {
    setViewMode("advanced");
  }
  window.setTimeout(() => {
    drawNetwork();
    drawNetwork(elements.agentModuleCanvas, 320);
  }, 80);
}

function renderPipeline() {
  const steps = [...elements.pipelineSteps.querySelectorAll("[data-stage]")];
  steps.forEach((step, index) => {
    step.classList.toggle("active", index === state.pipelineIndex);
    step.classList.toggle("done", index < state.pipelineIndex);
  });
  elements.pipelineState.textContent = state.pipelineIndex >= 0 ? steps[state.pipelineIndex].dataset.stage : "Idle";
}

function startPipelineAnimation() {
  stopPipelineAnimation();
  const stages = [...elements.pipelineSteps.querySelectorAll("[data-stage]")];
  state.pipelineIndex = 0;
  elements.terminalLog.innerHTML = "";
  renderPipeline();
  elements.terminalLog.insertAdjacentHTML("beforeend", `<div>[${timeLabel()}] Dashboard requested safe runner execution</div>`);
  state.pipelineTimer = window.setInterval(() => {
    state.pipelineIndex = Math.min(state.pipelineIndex + 1, stages.length - 1);
    const stage = stages[state.pipelineIndex].dataset.stage;
    elements.terminalLog.insertAdjacentHTML("beforeend", `<div>[${timeLabel()}] ${stage}: in progress</div>`);
    elements.terminalLog.scrollTop = elements.terminalLog.scrollHeight;
    renderPipeline();
  }, 900);
}

function stopPipelineAnimation(summary = "") {
  if (state.pipelineTimer) {
    window.clearInterval(state.pipelineTimer);
    state.pipelineTimer = null;
  }
  state.pipelineIndex = -1;
  renderPipeline();
  if (summary) {
    elements.terminalLog.insertAdjacentHTML("beforeend", `<div>[${timeLabel()}] Reply: ${escapeHtml(summary.slice(0, 240))}</div>`);
  }
}

async function runNextMission() {
  if (state.paused) {
    showAnswer("Execution paused", "Inbound execution is paused. Re-arm the system before running missions.");
    return;
  }
  startPipelineAnimation();
  try {
    const payload = await api("/api/missions/next/run", { method: "POST" });
    const mission = payload.mission;
    applyServerState(payload);
    stopPipelineAnimation(mission.output_summary || `${mission.id} completed`);
    showAnswer(`${mission.title} completed`, mission.output_summary || "Mission completed through the safe runner boundary.");
  } catch (error) {
    stopPipelineAnimation(error.message);
    showAnswer("Runner blocked", error.message);
    await loadState();
  }
}

async function queueMission({ prompt, agent, skill, source, risk }) {
  const payload = await api("/api/missions", {
    method: "POST",
    body: { prompt, agent, skill, source, risk },
  });
  applyServerState(payload);
  return payload.mission;
}

async function addMission(event) {
  event.preventDefault();
  const form = new FormData(elements.missionForm);
  const prompt = String(form.get("prompt") || "").trim();
  if (!prompt) return;

  try {
    const mission = await queueMission({
      prompt,
      agent: String(form.get("agent") || state.activeAgent),
      source: String(form.get("source") || "Dashboard"),
      skill: String(form.get("skill") || "jarvis-control-plane"),
      risk: state.selectedRisk,
    });
    showAnswer(mission.title, "Queued in SQLite. Click Run next to execute through the safe runner.");
  } catch (error) {
    showAnswer("Queue failed", error.message);
  }
}

async function addSimpleMission(event) {
  event.preventDefault();
  const prompt = elements.simplePrompt.value.trim();
  if (!prompt) return;

  try {
    const mission = await queueMission({
      prompt,
      agent: "orchestrator",
      source: "Dashboard",
      skill: "jarvis-control-plane",
      risk: "Low",
    });
    showAnswer(mission.title, "Queued for orchestrator triage. Advanced view shows routing, policy, and runner state.");
  } catch (error) {
    showAnswer("Queue failed", error.message);
  }
}

async function ingestChannelMission(event) {
  event.preventDefault();
  const form = new FormData(elements.channelIngestForm);
  const channel = String(form.get("channel") || "Dashboard");
  const prompt = String(form.get("prompt") || "").trim();
  const risk = String(form.get("risk") || "Low");
  if (!prompt) return;

  try {
    const payload = await api(`/api/channels/${encodeURIComponent(channel)}/ingest`, {
      method: "POST",
      body: {
        prompt,
        risk,
        agent: state.activeAgent || "orchestrator",
        skill: "jarvis-control-plane",
      },
    });
    applyServerState(payload);
    showAnswer(payload.mission.title, `Ingested from ${channel} and queued for ${payload.mission.agent}.`);
  } catch (error) {
    showAnswer("Ingress blocked", error.message);
  }
}

async function addAutomation(event) {
  event.preventDefault();
  const form = new FormData(elements.automationForm);
  try {
    const payload = await api("/api/automations", {
      method: "POST",
      body: {
        name: String(form.get("name") || ""),
        trigger: String(form.get("trigger") || ""),
        agent: String(form.get("agent") || "orchestrator"),
        skill: String(form.get("skill") || "persistent-daemon"),
        status: "Paused",
      },
    });
    applyServerState(payload);
    showAnswer(payload.automation.name, "Automation saved to the local registry.");
  } catch (error) {
    showAnswer("Automation blocked", error.message);
  }
}

async function saveSettings(event) {
  event.preventDefault();
  const form = new FormData(elements.settingsForm);
  try {
    applyServerState(
      await api("/api/settings", {
        method: "POST",
        body: {
          runnerMode: String(form.get("runnerMode") || "auto"),
          runnerMaxBudget: String(form.get("runnerMaxBudget") || "0.35"),
          runnerTimeout: String(form.get("runnerTimeout") || "120"),
          runnerPermission: String(form.get("runnerPermission") || "answer-only"),
          artifactRetentionDays: String(form.get("artifactRetentionDays") || "14"),
        },
      }),
    );
    showAnswer("Settings saved", `Resolved runner is ${state.runnerMode}.`);
  } catch (error) {
    showAnswer("Settings blocked", error.message);
  }
}

async function applyQuickTask(taskName) {
  const task = quickTasks[taskName];
  if (!task) return;
  elements.simplePrompt.value = task.prompt;
  try {
    const mission = await queueMission(task);
    showAnswer(mission.title, `Queued for ${mission.agent} with ${mission.skill}.`);
  } catch (error) {
    showAnswer("Queue failed", error.message);
  }
}

function showAnswer(title, detail) {
  elements.simpleAnswer.innerHTML = `<strong>${escapeHtml(title)}</strong><span>${escapeHtml(detail)}</span>`;
}

async function togglePause() {
  try {
    applyServerState(
      await api("/api/system/pause", {
        method: "POST",
        body: { paused: !state.paused },
      }),
    );
  } catch (error) {
    showAnswer("Pause toggle failed", error.message);
  }
}

function openPalette() {
  elements.commandPalette.classList.add("open");
  elements.commandPalette.setAttribute("aria-hidden", "false");
  elements.paletteInput.focus();
  renderPalette();
}

function closePalette() {
  elements.commandPalette.classList.remove("open");
  elements.commandPalette.setAttribute("aria-hidden", "true");
}

function drawNetwork(targetCanvas = elements.networkCanvas, height = 300) {
  const canvas = targetCanvas;
  if (!canvas || elements.appShell.dataset.view !== "advanced") return;
  const ctx = canvas.getContext("2d");
  const rect = canvas.getBoundingClientRect();
  const scale = window.devicePixelRatio || 1;
  canvas.width = Math.max(1, Math.round(rect.width * scale));
  canvas.height = Math.round(height * scale);
  ctx.scale(scale, scale);

  const w = rect.width || 740;
  const h = height;
  ctx.clearRect(0, 0, w, h);
  ctx.strokeStyle = "rgba(219,229,242,0.10)";
  ctx.lineWidth = 1;

  for (let x = 20; x < w; x += 36) {
    ctx.beginPath();
    ctx.moveTo(x, 0);
    ctx.lineTo(x, h);
    ctx.stroke();
  }
  for (let y = 20; y < h; y += 36) {
    ctx.beginPath();
    ctx.moveTo(0, y);
    ctx.lineTo(w, y);
    ctx.stroke();
  }

  const agents = state.agents.length ? state.agents : [{ name: "orchestrator", role: "Routing" }];
  const center = { x: w / 2, y: h / 2 };
  const radius = Math.min(w, h) * 0.34;
  const nodes = agents.map((agent, index) => {
    const angle = (Math.PI * 2 * index) / agents.length - Math.PI / 2;
    return {
      ...agent,
      color: agentColors[index % agentColors.length],
      x: center.x + Math.cos(angle) * radius,
      y: center.y + Math.sin(angle) * radius,
    };
  });

  nodes.forEach((node) => {
    ctx.beginPath();
    ctx.moveTo(center.x, center.y);
    ctx.lineTo(node.x, node.y);
    ctx.strokeStyle = node.name === state.activeAgent ? "rgba(32,208,178,0.86)" : "rgba(90,167,255,0.28)";
    ctx.lineWidth = node.name === state.activeAgent ? 2 : 1;
    ctx.stroke();
  });

  ctx.beginPath();
  ctx.arc(center.x, center.y, 34, 0, Math.PI * 2);
  ctx.fillStyle = "rgba(32,208,178,0.18)";
  ctx.fill();
  ctx.strokeStyle = "rgba(32,208,178,0.72)";
  ctx.stroke();
  ctx.fillStyle = "#eef5ff";
  ctx.font = "700 12px Inter, sans-serif";
  ctx.textAlign = "center";
  ctx.fillText("JARVIS", center.x, center.y + 4);

  nodes.forEach((node) => {
    ctx.beginPath();
    ctx.arc(node.x, node.y, node.name === state.activeAgent ? 18 : 14, 0, Math.PI * 2);
    ctx.fillStyle = `${node.color}33`;
    ctx.fill();
    ctx.strokeStyle = node.color;
    ctx.lineWidth = node.name === state.activeAgent ? 2 : 1;
    ctx.stroke();
    ctx.fillStyle = "#dbe7f7";
    ctx.font = "700 11px Inter, sans-serif";
    ctx.fillText(node.name.split("-")[0], node.x, node.y + 32);
  });
}

function attachEvents() {
  document.querySelectorAll("[data-filter]").forEach((button) => {
    button.addEventListener("click", () => {
      document.querySelectorAll("[data-filter]").forEach((item) => item.classList.remove("active"));
      button.classList.add("active");
      state.activeFilter = button.dataset.filter || "all";
      renderMissions();
    });
  });

  document.querySelectorAll("[data-risk]").forEach((button) => {
    button.addEventListener("click", () => {
      document.querySelectorAll("[data-risk]").forEach((item) => item.classList.remove("active"));
      button.classList.add("active");
      state.selectedRisk = button.dataset.risk || "Low";
    });
  });

  document.querySelectorAll("[data-pack]").forEach((button) => {
    button.addEventListener("click", () => {
      document.querySelectorAll("[data-pack]").forEach((item) => item.classList.remove("active"));
      button.classList.add("active");
      state.selectedPack = button.dataset.pack;
      elements.selectedPack.textContent = `${state.selectedPack} pack`;
    });
  });

  document.querySelectorAll("[data-voice-mode]").forEach((button) => {
    button.addEventListener("click", () => {
      document.querySelectorAll("[data-voice-mode]").forEach((item) => item.classList.remove("active"));
      button.classList.add("active");
      state.voiceMode = button.dataset.voiceMode;
    });
  });

  document.querySelectorAll("[data-module-link]").forEach((link) => {
    link.addEventListener("click", (event) => {
      event.preventDefault();
      setActiveModule(link.dataset.moduleLink);
    });
  });

  elements.missionForm.addEventListener("submit", addMission);
  elements.simpleForm.addEventListener("submit", addSimpleMission);
  elements.channelIngestForm.addEventListener("submit", ingestChannelMission);
  elements.automationForm.addEventListener("submit", addAutomation);
  elements.settingsForm.addEventListener("submit", saveSettings);
  elements.memoryModuleForm.addEventListener("submit", async (event) => {
    event.preventDefault();
    if (elements.memorySearch) {
      elements.memorySearch.value = elements.memoryModuleSearch.value;
    }
    await loadState();
  });
  elements.securityPauseButton.addEventListener("click", togglePause);
  elements.simpleRunButton.addEventListener("click", runNextMission);
  elements.pauseButton.addEventListener("click", togglePause);
  elements.runButton.addEventListener("click", runNextMission);
  elements.commandButton.addEventListener("click", openPalette);
  elements.paletteInput.addEventListener("input", renderPalette);
  elements.memorySearch.addEventListener("input", async () => {
    if (elements.memoryModuleSearch) {
      elements.memoryModuleSearch.value = elements.memorySearch.value;
    }
    await loadState();
  });
  elements.clearLogButton.addEventListener("click", () => {
    state.events = [];
    renderActivity();
  });
  document.querySelectorAll("[data-view-mode]").forEach((button) => {
    button.addEventListener("click", () => setViewMode(button.dataset.viewMode || "simple"));
  });
  document.querySelectorAll("[data-quick-task]").forEach((button) => {
    button.addEventListener("click", () => applyQuickTask(button.dataset.quickTask));
  });
  elements.commandPalette.addEventListener("click", (event) => {
    if (event.target === elements.commandPalette) closePalette();
  });
  document.addEventListener("keydown", (event) => {
    if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "k") {
      event.preventDefault();
      openPalette();
    }
    if (event.key === "Escape") closePalette();
  });
  window.addEventListener("resize", () => {
    drawNetwork();
    drawNetwork(elements.agentModuleCanvas, 320);
  });
}

async function boot() {
  hydrateIcons();
  attachEvents();
  renderPalette();
  setViewMode("simple");
  setActiveModule("mission-control");
  await loadState();
}

boot();
