#!/usr/bin/env python3
"""Local JARVIS Control Center server.

Serves the dashboard and exposes a small SQLite-backed mission API. The runner
boundary is intentionally narrow: dashboard input becomes a structured Mission,
then the server chooses a safe runtime path and records logs/artifacts.
"""

from __future__ import annotations

import json
import os
import re
import shutil
import sqlite3
import subprocess
import sys
import time
import uuid
from datetime import datetime, timezone
from http import HTTPStatus
from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path
from urllib.parse import parse_qs, unquote, urlparse


ROOT = Path(__file__).resolve().parents[2]
STATIC_DIR = ROOT / "apps" / "control-center"
DB_PATH = ROOT / "data" / "jarvis-control-center.db"
OUTPUT_DIR = ROOT / "owners-inbox" / "control-center"
RUN_LOG_DIR = ROOT / "logs" / "control-center"
DEFAULT_PORT = 5174

AGENTS = {
    "orchestrator": {
        "role": "Routing, memory, system awareness",
        "model": "Opus",
        "skills": ["jarvis-control-plane", "memory-management", "agent-teams"],
        "status": "primary",
    },
    "builder": {
        "role": "Apps, workflows, integrations, code",
        "model": "Sonnet/Opus",
        "skills": ["workflow-builder", "vibecode-app-builder", "self-healing-executor"],
        "status": "ready",
    },
    "researcher": {
        "role": "Deep research, citations, evidence",
        "model": "Sonnet",
        "skills": ["researcher-deep", "competitive-intel", "claim-verifier"],
        "status": "ready",
    },
    "analyst": {
        "role": "Market, SEO, competitive intelligence",
        "model": "Sonnet/Opus",
        "skills": ["market-research", "funded-company-analyzer", "seo-content-engine"],
        "status": "ready",
    },
    "web-designer": {
        "role": "Interfaces, motion, prototypes",
        "model": "Sonnet/Opus",
        "skills": ["elite-web-ui", "huashu-design", "frontend-patterns"],
        "status": "ready",
    },
    "scheduler": {
        "role": "Calendar, briefings, priorities",
        "model": "Haiku/Sonnet",
        "skills": ["morning-briefing", "weekly-review", "persistent-daemon"],
        "status": "ready",
    },
    "content-creator": {
        "role": "Writing, posts, newsletters",
        "model": "Sonnet",
        "skills": ["content-creation", "article-writing", "claim-verifier"],
        "status": "ready",
    },
    "finance": {
        "role": "Revenue, costs, invoices, budgets",
        "model": "Haiku/Sonnet",
        "skills": ["finance-tracking", "investor-materials", "market-research"],
        "status": "available",
    },
    "app-studio": {
        "role": "Web, mobile, backend app pipeline",
        "model": "Sonnet/Opus",
        "skills": ["app-studio", "self-healing-executor", "deployment-patterns"],
        "status": "available",
    },
}

SKILL_CATALOG = [
    {
        "name": "jarvis-control-plane",
        "area": "OS",
        "detail": "Dashboard, mission queue, channel gateway, safe runner, memory, and ledger.",
    },
    {
        "name": "researcher-deep",
        "area": "Research",
        "detail": "Scope, collect, screen, extract, synthesize, and deliver sourced research.",
    },
    {
        "name": "workflow-builder",
        "area": "Automation",
        "detail": "Design and deploy automation workflows with direct integrations first.",
    },
    {
        "name": "vibecode-app-builder",
        "area": "Build",
        "detail": "Structured app build process from PRD through launch for web apps.",
    },
    {
        "name": "app-studio",
        "area": "Build",
        "detail": "Web, mobile, backend monorepo pipeline with QA and preview phases.",
    },
    {
        "name": "memory-management",
        "area": "Memory",
        "detail": "Write loop with security scan, cap checks, and activity logging.",
    },
    {
        "name": "persistent-daemon",
        "area": "Monitoring",
        "detail": "Scheduled monitors, alerts, and heartbeat follow-ups.",
    },
    {
        "name": "elite-web-ui",
        "area": "Design",
        "detail": "Premium interactive web interfaces and visual systems.",
    },
]

CHANNELS = {
    "Dashboard": {"state": "ready", "enabled": True},
    "Telegram": {"state": "adapter endpoint", "enabled": False},
    "Slack": {"state": "adapter endpoint", "enabled": False},
    "War Room": {"state": "voice shell", "enabled": True},
}

POLICIES = {
    "Operator allowlist": {"detail": "Required for remote ingress", "enabled": True},
    "PIN challenge": {"detail": "High-risk mission gate", "enabled": False},
    "Exfiltration guard": {"detail": "Secrets and private memory", "enabled": True},
    "Kill phrase": {"detail": "Pause all inbound execution", "enabled": True},
}

AUTOMATION_SEEDS = [
    {
        "id": "AUTO-morning-briefing",
        "name": "Morning Briefing",
        "trigger": "Daily at 8:00 AM",
        "agent": "scheduler",
        "skill": "morning-briefing",
        "status": "Paused",
    },
    {
        "id": "AUTO-weekly-review",
        "name": "Weekly Review",
        "trigger": "Friday at 5:00 PM",
        "agent": "orchestrator",
        "skill": "weekly-review",
        "status": "Paused",
    },
    {
        "id": "AUTO-inbox-sweep",
        "name": "Owners Inbox Sweep",
        "trigger": "Every weekday at 4:00 PM",
        "agent": "orchestrator",
        "skill": "memory-management",
        "status": "Paused",
    },
    {
        "id": "AUTO-control-heartbeat",
        "name": "Control Plane Heartbeat",
        "trigger": "Every 6 hours",
        "agent": "analyst",
        "skill": "jarvis-control-plane",
        "status": "Paused",
    },
]

SETTINGS_DEFAULTS = {
    "paused": "false",
    "runner_mode": "auto",
    "runner_max_budget": "0.35",
    "runner_timeout": "120",
    "runner_permission": "answer-only",
    "artifact_retention_days": "14",
}


def now() -> str:
    return datetime.now(timezone.utc).isoformat(timespec="seconds")


def row_dict(row: sqlite3.Row) -> dict:
    return {key: row[key] for key in row.keys()}


def connect() -> sqlite3.Connection:
    DB_PATH.parent.mkdir(parents=True, exist_ok=True)
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    conn.execute("PRAGMA foreign_keys = ON")
    return conn


def init_db() -> None:
    OUTPUT_DIR.mkdir(parents=True, exist_ok=True)
    RUN_LOG_DIR.mkdir(parents=True, exist_ok=True)
    with connect() as conn:
        conn.executescript(
            """
            CREATE TABLE IF NOT EXISTS settings (
                key TEXT PRIMARY KEY,
                value TEXT NOT NULL
            );

            CREATE TABLE IF NOT EXISTS missions (
                id TEXT PRIMARY KEY,
                title TEXT NOT NULL,
                detail TEXT NOT NULL,
                prompt TEXT NOT NULL,
                agent TEXT NOT NULL,
                skill TEXT NOT NULL,
                source TEXT NOT NULL,
                status TEXT NOT NULL,
                risk TEXT NOT NULL,
                priority INTEGER NOT NULL DEFAULT 0,
                cost REAL NOT NULL DEFAULT 0,
                output_summary TEXT NOT NULL DEFAULT '',
                output_path TEXT NOT NULL DEFAULT '',
                raw_log_path TEXT NOT NULL DEFAULT '',
                created_at TEXT NOT NULL,
                updated_at TEXT NOT NULL
            );

            CREATE TABLE IF NOT EXISTS mission_runs (
                id TEXT PRIMARY KEY,
                mission_id TEXT NOT NULL REFERENCES missions(id) ON DELETE CASCADE,
                runtime TEXT NOT NULL,
                command TEXT NOT NULL,
                status TEXT NOT NULL,
                started_at TEXT NOT NULL,
                ended_at TEXT NOT NULL DEFAULT '',
                exit_code INTEGER,
                stdout_path TEXT NOT NULL DEFAULT '',
                stderr_path TEXT NOT NULL DEFAULT '',
                output_summary TEXT NOT NULL DEFAULT '',
                cost_estimate REAL NOT NULL DEFAULT 0
            );

            CREATE TABLE IF NOT EXISTS mission_events (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                mission_id TEXT,
                type TEXT NOT NULL,
                message TEXT NOT NULL,
                payload TEXT NOT NULL DEFAULT '{}',
                created_at TEXT NOT NULL
            );

            CREATE TABLE IF NOT EXISTS usage_ledger (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                mission_id TEXT,
                run_id TEXT,
                amount REAL NOT NULL,
                label TEXT NOT NULL,
                created_at TEXT NOT NULL
            );

            CREATE TABLE IF NOT EXISTS channel_identities (
                channel TEXT NOT NULL,
                external_id TEXT NOT NULL,
                display_name TEXT NOT NULL,
                allowed INTEGER NOT NULL DEFAULT 0,
                PRIMARY KEY (channel, external_id)
            );

            CREATE TABLE IF NOT EXISTS security_events (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                mission_id TEXT,
                channel TEXT NOT NULL,
                decision TEXT NOT NULL,
                reason TEXT NOT NULL,
                created_at TEXT NOT NULL
            );

            CREATE TABLE IF NOT EXISTS automations (
                id TEXT PRIMARY KEY,
                name TEXT NOT NULL,
                trigger TEXT NOT NULL,
                agent TEXT NOT NULL,
                skill TEXT NOT NULL,
                status TEXT NOT NULL,
                last_run_at TEXT NOT NULL DEFAULT '',
                created_at TEXT NOT NULL,
                updated_at TEXT NOT NULL
            );
            """
        )
        seed_settings(conn)
        seed_missions(conn)
        seed_automations(conn)


def seed_settings(conn: sqlite3.Connection) -> None:
    defaults = dict(SETTINGS_DEFAULTS)
    for name, channel in CHANNELS.items():
        defaults[f"channel:{name}"] = "true" if channel["enabled"] else "false"
    for name, policy in POLICIES.items():
        defaults[f"policy:{name}"] = "true" if policy["enabled"] else "false"
    for key, value in defaults.items():
        conn.execute(
            "INSERT OR IGNORE INTO settings(key, value) VALUES(?, ?)",
            (key, value),
        )


def seed_automations(conn: sqlite3.Connection) -> None:
    stamp = now()
    for item in AUTOMATION_SEEDS:
        conn.execute(
            """
            INSERT OR IGNORE INTO automations(
                id, name, trigger, agent, skill, status, created_at, updated_at
            ) VALUES(?, ?, ?, ?, ?, ?, ?, ?)
            """,
            (
                item["id"],
                item["name"],
                item["trigger"],
                item["agent"],
                item["skill"],
                item["status"],
                stamp,
                stamp,
            ),
        )


def seed_missions(conn: sqlite3.Connection) -> None:
    existing = conn.execute("SELECT COUNT(*) AS count FROM missions").fetchone()["count"]
    if existing:
        return

    samples = [
        (
            "MIS-1042",
            "Safe runner contract",
            "Define JSON contract, stdout log, and Codex/Claude fallback.",
            "Build the safe runner contract and SQLite mission tables for JARVIS.",
            "builder",
            "jarvis-control-plane",
            "Dashboard",
            "Queued",
            "Medium",
            0.42,
        ),
        (
            "MIS-1041",
            "Control plane gap audit",
            "ClaudeClaw/video reference translated into JARVIS roadmap.",
            "Audit the current JARVIS control plane gaps.",
            "orchestrator",
            "jarvis-control-plane",
            "Dashboard",
            "Done",
            "Low",
            0.18,
        ),
        (
            "MIS-1040",
            "Memory recall decision",
            "Persist control-plane-first decision before voice layers.",
            "Save the decision that the control plane comes before voice layers.",
            "researcher",
            "memory-management",
            "Memory",
            "Done",
            "Low",
            0.08,
        ),
        (
            "MIS-1039",
            "Channel gateway threat model",
            "Allowlist, PIN, kill phrase, exfil guard, audit trail.",
            "Threat model external channel ingress for JARVIS.",
            "analyst",
            "workflow-builder",
            "Slack",
            "Queued",
            "High",
            0.61,
        ),
    ]
    stamp = now()
    for mission in samples:
        conn.execute(
            """
            INSERT INTO missions(
                id, title, detail, prompt, agent, skill, source, status, risk,
                cost, created_at, updated_at
            ) VALUES(?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            """,
            (*mission, stamp, stamp),
        )
        add_event(conn, mission[0], "seed", f"{mission[0]} seeded into mission queue")


def get_setting(conn: sqlite3.Connection, key: str, default: str = "") -> str:
    row = conn.execute("SELECT value FROM settings WHERE key = ?", (key,)).fetchone()
    return row["value"] if row else default


def set_setting(conn: sqlite3.Connection, key: str, value: str) -> None:
    conn.execute(
        "INSERT INTO settings(key, value) VALUES(?, ?) ON CONFLICT(key) DO UPDATE SET value = excluded.value",
        (key, value),
    )


def add_event(
    conn: sqlite3.Connection,
    mission_id: str | None,
    event_type: str,
    message: str,
    payload: dict | None = None,
) -> None:
    conn.execute(
        "INSERT INTO mission_events(mission_id, type, message, payload, created_at) VALUES(?, ?, ?, ?, ?)",
        (mission_id, event_type, message, json.dumps(payload or {}), now()),
    )


def add_security_event(
    conn: sqlite3.Connection,
    mission_id: str | None,
    channel: str,
    decision: str,
    reason: str,
) -> None:
    conn.execute(
        "INSERT INTO security_events(mission_id, channel, decision, reason, created_at) VALUES(?, ?, ?, ?, ?)",
        (mission_id, channel, decision, reason, now()),
    )


def list_missions(conn: sqlite3.Connection) -> list[dict]:
    rows = conn.execute(
        "SELECT * FROM missions ORDER BY created_at DESC, id DESC LIMIT 100"
    ).fetchall()
    return [row_dict(row) for row in rows]


def list_events(conn: sqlite3.Connection) -> list[dict]:
    rows = conn.execute(
        "SELECT * FROM mission_events ORDER BY id DESC LIMIT 40"
    ).fetchall()
    return [row_dict(row) for row in rows]


def list_runs(conn: sqlite3.Connection) -> list[dict]:
    rows = conn.execute(
        "SELECT * FROM mission_runs ORDER BY started_at DESC LIMIT 20"
    ).fetchall()
    return [row_dict(row) for row in rows]


def list_security_events(conn: sqlite3.Connection) -> list[dict]:
    rows = conn.execute(
        "SELECT * FROM security_events ORDER BY id DESC LIMIT 50"
    ).fetchall()
    return [row_dict(row) for row in rows]


def list_automations(conn: sqlite3.Connection) -> list[dict]:
    rows = conn.execute(
        "SELECT * FROM automations ORDER BY created_at ASC"
    ).fetchall()
    return [row_dict(row) for row in rows]


def list_artifacts(conn: sqlite3.Connection) -> list[dict]:
    rows = conn.execute(
        """
        SELECT
            mission_runs.id AS run_id,
            mission_runs.mission_id,
            mission_runs.runtime,
            mission_runs.status,
            mission_runs.started_at,
            mission_runs.ended_at,
            mission_runs.stdout_path,
            mission_runs.stderr_path,
            mission_runs.output_summary,
            missions.title,
            missions.agent,
            missions.skill,
            missions.output_path
        FROM mission_runs
        JOIN missions ON missions.id = mission_runs.mission_id
        ORDER BY mission_runs.started_at DESC
        LIMIT 60
        """
    ).fetchall()
    artifacts: list[dict] = []
    seen: set[str] = set()
    for row in rows:
        item = row_dict(row)
        item["exists"] = bool(item["output_path"] and Path(item["output_path"]).exists())
        if item["output_path"]:
            seen.add(item["output_path"])
        artifacts.append(item)

    if OUTPUT_DIR.exists():
        for path in sorted(OUTPUT_DIR.glob("*.md"), key=lambda item: item.stat().st_mtime, reverse=True):
            resolved = str(path)
            if resolved in seen:
                continue
            artifacts.append(
                {
                    "run_id": "",
                    "mission_id": path.stem,
                    "runtime": "file",
                    "status": "Saved",
                    "started_at": datetime.fromtimestamp(path.stat().st_mtime, timezone.utc).isoformat(timespec="seconds"),
                    "ended_at": "",
                    "stdout_path": "",
                    "stderr_path": "",
                    "output_summary": "",
                    "title": path.stem,
                    "agent": "",
                    "skill": "",
                    "output_path": resolved,
                    "exists": True,
                }
            )
    return artifacts[:80]


def usage_total(conn: sqlite3.Connection) -> float:
    row = conn.execute("SELECT COALESCE(SUM(amount), 0) AS total FROM usage_ledger").fetchone()
    return float(row["total"])


def channel_state(conn: sqlite3.Connection) -> list[dict]:
    return [
        {
            "name": name,
            "state": value["state"],
            "enabled": get_setting(conn, f"channel:{name}", "false") == "true",
        }
        for name, value in CHANNELS.items()
    ]


def policy_state(conn: sqlite3.Connection) -> list[dict]:
    return [
        {
            "name": name,
            "detail": value["detail"],
            "enabled": get_setting(conn, f"policy:{name}", "false") == "true",
        }
        for name, value in POLICIES.items()
    ]


def resolve_runner_mode(conn: sqlite3.Connection | None = None) -> str:
    mode = os.getenv("JARVIS_RUNNER_MODE", "").strip().lower()
    if not mode and conn:
        mode = get_setting(conn, "runner_mode", "auto").strip().lower()
    mode = mode or "auto"
    if mode not in {"auto", "claude", "codex", "local"}:
        mode = "auto"
    if mode != "auto":
        return mode
    if shutil.which("claude"):
        return "claude"
    if shutil.which("codex"):
        return "codex"
    return "local"


def runner_settings(conn: sqlite3.Connection) -> dict:
    configured = get_setting(conn, "runner_mode", SETTINGS_DEFAULTS["runner_mode"])
    budget = get_setting(conn, "runner_max_budget", SETTINGS_DEFAULTS["runner_max_budget"])
    timeout = get_setting(conn, "runner_timeout", SETTINGS_DEFAULTS["runner_timeout"])
    permission = get_setting(conn, "runner_permission", SETTINGS_DEFAULTS["runner_permission"])
    retention = get_setting(conn, "artifact_retention_days", SETTINGS_DEFAULTS["artifact_retention_days"])
    return {
        "runnerMode": configured,
        "resolvedRunnerMode": resolve_runner_mode(conn),
        "runnerMaxBudget": budget,
        "runnerTimeout": timeout,
        "runnerPermission": permission,
        "artifactRetentionDays": retention,
        "dbPath": str(DB_PATH),
        "outputDir": str(OUTPUT_DIR),
        "runLogDir": str(RUN_LOG_DIR),
        "root": str(ROOT),
    }


def setup_state() -> dict:
    core_path = ROOT / "memory" / "core.md"
    l1_path = ROOT / "memory" / "L1-critical-facts.md"
    try:
        core_text = core_path.read_text(encoding="utf-8")
    except FileNotFoundError:
        core_text = ""
    configured = not core_text.startswith("# JARVIS Universal — Setup Needed")
    return {
        "configured": configured,
        "status": "Configured" if configured else "First run needed",
        "corePath": str(core_path),
        "l1Path": str(l1_path),
        "nextStep": "Ask the 3 first-run questions and populate memory/core.md" if not configured else "Read L0 and L1 at session start",
    }


def create_automation(
    conn: sqlite3.Connection,
    name: str,
    trigger: str,
    agent: str,
    skill: str,
    status: str = "Paused",
) -> dict:
    if not name.strip():
        raise ValueError("automation name is required")
    automation_id = f"AUTO-{uuid.uuid4().hex[:8]}"
    stamp = now()
    conn.execute(
        """
        INSERT INTO automations(id, name, trigger, agent, skill, status, created_at, updated_at)
        VALUES(?, ?, ?, ?, ?, ?, ?, ?)
        """,
        (
            automation_id,
            name.strip()[:80],
            trigger.strip()[:120] or "Manual",
            agent if agent in AGENTS else "orchestrator",
            skill.strip()[:80] or "jarvis-control-plane",
            status if status in {"Active", "Paused"} else "Paused",
            stamp,
            stamp,
        ),
    )
    add_event(conn, None, "automation", f"{automation_id} automation created")
    return row_dict(conn.execute("SELECT * FROM automations WHERE id = ?", (automation_id,)).fetchone())


def update_settings(conn: sqlite3.Connection, data: dict) -> None:
    mode = str(data.get("runnerMode", data.get("runner_mode", ""))).strip().lower()
    if mode:
        if mode not in {"auto", "claude", "codex", "local"}:
            raise ValueError("runnerMode must be auto, claude, codex, or local")
        set_setting(conn, "runner_mode", mode)

    budget_raw = data.get("runnerMaxBudget", data.get("runner_max_budget"))
    if budget_raw is not None and str(budget_raw).strip():
        try:
            budget = float(budget_raw)
        except ValueError as exc:
            raise ValueError("runnerMaxBudget must be a number") from exc
        if budget < 0 or budget > 5:
            raise ValueError("runnerMaxBudget must be between 0 and 5")
        set_setting(conn, "runner_max_budget", f"{budget:.2f}")

    timeout_raw = data.get("runnerTimeout", data.get("runner_timeout"))
    if timeout_raw is not None and str(timeout_raw).strip():
        try:
            timeout = int(timeout_raw)
        except ValueError as exc:
            raise ValueError("runnerTimeout must be an integer") from exc
        if timeout < 10 or timeout > 900:
            raise ValueError("runnerTimeout must be between 10 and 900 seconds")
        set_setting(conn, "runner_timeout", str(timeout))

    permission = str(data.get("runnerPermission", data.get("runner_permission", ""))).strip()
    if permission:
        if permission not in {"answer-only", "read-only"}:
            raise ValueError("runnerPermission must be answer-only or read-only")
        set_setting(conn, "runner_permission", permission)

    retention_raw = data.get("artifactRetentionDays", data.get("artifact_retention_days"))
    if retention_raw is not None and str(retention_raw).strip():
        try:
            days = int(retention_raw)
        except ValueError as exc:
            raise ValueError("artifactRetentionDays must be an integer") from exc
        if days < 1 or days > 365:
            raise ValueError("artifactRetentionDays must be between 1 and 365")
        set_setting(conn, "artifact_retention_days", str(days))

    add_event(conn, None, "settings", "Runner settings updated")


def memory_hits(query: str = "") -> list[dict]:
    search = (query or "control plane").strip()
    try:
        result = subprocess.run(
            [sys.executable, "memory/memory_search.py", search, "--top", "4"],
            cwd=ROOT,
            text=True,
            capture_output=True,
            timeout=8,
            check=False,
        )
    except Exception as exc:
        return [{"title": "Memory search unavailable", "detail": str(exc)}]

    hits: list[dict] = []
    current: dict | None = None
    for line in result.stdout.splitlines():
        if line.startswith("[") and "]" in line:
            if current:
                hits.append(current)
            current = {"title": line.split("]", 1)[-1].strip(), "detail": ""}
        elif current and line.strip():
            current["detail"] = (current["detail"] + " " + line.strip()).strip()
    if current:
        hits.append(current)
    if hits:
        return hits[:4]
    return [
        {
            "title": "Control plane decision",
            "detail": "Dashboard, queue, runner, and security come before voice and avatar layers.",
        }
    ]


def create_mission(
    conn: sqlite3.Connection,
    prompt: str,
    agent: str,
    skill: str,
    source: str,
    risk: str,
) -> dict:
    if not prompt:
        raise ValueError("prompt is required")
    mission_id = f"MIS-{int(time.time())}-{uuid.uuid4().hex[:4]}"
    title = prompt[:64].strip() + ("..." if len(prompt) > 64 else "")
    detail = f"Skill: {skill}"
    stamp = now()
    safe_agent = agent if agent in AGENTS else "orchestrator"
    safe_risk = risk if risk in {"Low", "Medium", "High"} else "Low"
    conn.execute(
        """
        INSERT INTO missions(
            id, title, detail, prompt, agent, skill, source, status, risk,
            cost, created_at, updated_at
        ) VALUES(?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        """,
        (
            mission_id,
            title or "Untitled mission",
            detail,
            prompt,
            safe_agent,
            skill or "jarvis-control-plane",
            source or "Dashboard",
            "Queued",
            safe_risk,
            0.05,
            stamp,
            stamp,
        ),
    )
    conn.execute(
        "INSERT INTO usage_ledger(mission_id, run_id, amount, label, created_at) VALUES(?, ?, ?, ?, ?)",
        (mission_id, "", 0.05, "mission enqueue", stamp),
    )
    add_event(conn, mission_id, "queued", f"{mission_id} queued from {source or 'Dashboard'}")
    return row_dict(conn.execute("SELECT * FROM missions WHERE id = ?", (mission_id,)).fetchone())


SECRET_PATTERNS = [
    re.compile(r"sk-[A-Za-z0-9_\-]{12,}"),
    re.compile(r"(?i)(api[_-]?key|token|secret|password)\s*[:=]\s*['\"]?[^'\"\s]+"),
    re.compile(r"-----BEGIN [A-Z ]*PRIVATE KEY-----.*?-----END [A-Z ]*PRIVATE KEY-----", re.S),
]


def redact(text: str) -> str:
    redacted = text
    for pattern in SECRET_PATTERNS:
        redacted = pattern.sub("[REDACTED]", redacted)
    return redacted


def runner_mode(conn: sqlite3.Connection | None = None) -> str:
    return resolve_runner_mode(conn)


def build_runner_prompt(mission: dict) -> str:
    return f"""
You are JARVIS, operating inside the JARVIS Universal Agentic OS control center.

Mission:
- id: {mission['id']}
- source: {mission['source']}
- target agent: {mission['agent']}
- skill: {mission['skill']}
- risk: {mission['risk']}

User request:
{mission['prompt']}

Return a concise operator-facing result with:
1. What you did or would do now.
2. Any files/artifacts touched or proposed.
3. Any blocker or approval needed.
4. The safest next action.

Do not run shell commands. Do not reveal secrets. Keep it brief.
""".strip()


def run_external_runtime(
    mode: str,
    mission: dict,
    run_id: str,
    settings: dict | None = None,
) -> tuple[int, str, str, str]:
    prompt = build_runner_prompt(mission)
    settings = settings or {}
    max_budget = str(settings.get("runnerMaxBudget") or os.getenv("JARVIS_RUNNER_MAX_BUDGET", "0.35"))
    timeout = int(settings.get("runnerTimeout") or os.getenv("JARVIS_RUNNER_TIMEOUT", "120"))
    if mode == "claude":
        command = [
            "claude",
            "-p",
            "--output-format",
            "json",
            "--permission-mode",
            "dontAsk",
            "--max-budget-usd",
            max_budget,
            "--tools",
            "",
            "--agent",
            mission["agent"],
            prompt,
        ]
    elif mode == "codex":
        command = [
            "codex",
            "exec",
            "--cd",
            str(ROOT),
            "--ask-for-approval",
            "never",
            "--sandbox",
            "read-only",
            prompt,
        ]
    else:
        summary = local_runner_summary(mission)
        return 0, summary, "", "local"

    try:
        completed = subprocess.run(
            command,
            cwd=ROOT,
            text=True,
            capture_output=True,
            timeout=timeout,
            check=False,
        )
    except Exception as exc:
        summary = f"Runtime {mode} was unavailable, so JARVIS used the local safe runner fallback. Reason: {exc}"
        return 0, summary + "\n\n" + local_runner_summary(mission), "", "local-fallback"

    stdout = completed.stdout.strip()
    stderr = completed.stderr.strip()
    summary = parse_runtime_output(stdout) if stdout else ""
    if completed.returncode != 0 or not summary:
        fallback = local_runner_summary(mission)
        summary = (
            f"Runtime {mode} did not return a clean result, so JARVIS preserved the logs and used a local safe summary.\n\n"
            f"{fallback}"
        )
    return completed.returncode, summary, stderr, mode


def parse_runtime_output(stdout: str) -> str:
    try:
        payload = json.loads(stdout)
    except json.JSONDecodeError:
        return stdout
    if isinstance(payload, dict):
        for key in ("result", "response", "content", "summary", "text"):
            value = payload.get(key)
            if isinstance(value, str) and value.strip():
                return value.strip()
        return json.dumps(payload, indent=2)
    return str(payload)


def local_runner_summary(mission: dict) -> str:
    return (
        f"Mission {mission['id']} was accepted by the safe local runner.\n\n"
        f"Target agent: {mission['agent']}\n"
        f"Skill: {mission['skill']}\n"
        f"Risk: {mission['risk']}\n\n"
        "The runner did not execute arbitrary shell commands. It recorded the mission, passed the security boundary, "
        "and staged the next implementation step for operator review. Enable `JARVIS_RUNNER_MODE=claude` or "
        "`JARVIS_RUNNER_MODE=codex` to use the installed agent runtime from this dashboard."
    )


def write_artifact(mission: dict, run_id: str, summary: str) -> Path:
    OUTPUT_DIR.mkdir(parents=True, exist_ok=True)
    path = OUTPUT_DIR / f"{mission['id']}-{run_id}.md"
    path.write_text(
        (
            f"# {mission['title']}\n\n"
            f"- Mission: `{mission['id']}`\n"
            f"- Agent: `{mission['agent']}`\n"
            f"- Skill: `{mission['skill']}`\n"
            f"- Source: `{mission['source']}`\n"
            f"- Risk: `{mission['risk']}`\n\n"
            "## Result\n\n"
            f"{summary}\n"
        ),
        encoding="utf-8",
    )
    return path


def run_mission(conn: sqlite3.Connection, mission_id: str | None = None) -> dict:
    if get_setting(conn, "paused", "false") == "true":
        raise ValueError("Inbound execution is paused")

    if mission_id:
        row = conn.execute("SELECT * FROM missions WHERE id = ?", (mission_id,)).fetchone()
    else:
        row = conn.execute(
            "SELECT * FROM missions WHERE status = 'Queued' ORDER BY created_at ASC LIMIT 1"
        ).fetchone()
    if not row:
        raise ValueError("No queued mission found")

    mission = row_dict(row)
    if mission["status"] == "Running":
        raise ValueError(f"{mission['id']} is already running")
    if mission["status"] == "Done":
        return mission

    run_id = f"RUN-{uuid.uuid4().hex[:8]}"
    start = now()
    current_settings = runner_settings(conn)
    selected_mode = current_settings["resolvedRunnerMode"]
    conn.execute(
        "UPDATE missions SET status = 'Running', updated_at = ? WHERE id = ?",
        (start, mission["id"]),
    )
    add_event(conn, mission["id"], "ingress", f"{mission['id']} entered ingress")
    add_event(conn, mission["id"], "security", f"{mission['id']} passed safe runner policy")
    add_event(conn, mission["id"], "router", f"{mission['id']} routed to {mission['agent']}")
    add_event(conn, mission["id"], "runner", f"{mission['id']} runner started")
    conn.execute(
        """
        INSERT INTO mission_runs(id, mission_id, runtime, command, status, started_at)
        VALUES(?, ?, ?, ?, ?, ?)
        """,
        (run_id, mission["id"], selected_mode, "safe-runtime-boundary", "Running", start),
    )
    conn.commit()

    code, stdout, stderr, actual_mode = run_external_runtime(selected_mode, mission, run_id, current_settings)
    summary = redact(stdout.strip())
    stderr = redact(stderr.strip())

    stdout_path = RUN_LOG_DIR / f"{run_id}.out.log"
    stderr_path = RUN_LOG_DIR / f"{run_id}.err.log"
    stdout_path.write_text(summary, encoding="utf-8")
    stderr_path.write_text(stderr, encoding="utf-8")
    artifact_path = write_artifact(mission, run_id, summary)
    cost = 0.19 if actual_mode.startswith("local") else 0.35
    end = now()
    status = "Done" if code == 0 or summary else "Failed"

    conn.execute(
        """
        UPDATE mission_runs
        SET runtime = ?, status = ?, ended_at = ?, exit_code = ?, stdout_path = ?,
            stderr_path = ?, output_summary = ?, cost_estimate = ?
        WHERE id = ?
        """,
        (
            actual_mode,
            status,
            end,
            code,
            str(stdout_path),
            str(stderr_path),
            summary[:2000],
            cost,
            run_id,
        ),
    )
    conn.execute(
        """
        UPDATE missions
        SET status = ?, cost = cost + ?, output_summary = ?, output_path = ?,
            raw_log_path = ?, updated_at = ?
        WHERE id = ?
        """,
        (
            status,
            cost,
            summary[:2000],
            str(artifact_path),
            str(stdout_path),
            end,
            mission["id"],
        ),
    )
    conn.execute(
        "INSERT INTO usage_ledger(mission_id, run_id, amount, label, created_at) VALUES(?, ?, ?, ?, ?)",
        (mission["id"], run_id, cost, f"{actual_mode} run", end),
    )
    add_event(conn, mission["id"], "guard", f"{mission['id']} output guard completed")
    add_event(conn, mission["id"], "reply", f"{mission['id']} completed via {actual_mode}")
    conn.commit()
    return row_dict(conn.execute("SELECT * FROM missions WHERE id = ?", (mission["id"],)).fetchone())


def state_payload(conn: sqlite3.Connection, memory_query: str = "") -> dict:
    missions = list_missions(conn)
    settings = runner_settings(conn)
    return {
        "paused": get_setting(conn, "paused", "false") == "true",
        "runnerMode": settings["resolvedRunnerMode"],
        "settings": settings,
        "setup": setup_state(),
        "agents": [{"name": name, **profile} for name, profile in AGENTS.items()],
        "skills": SKILL_CATALOG,
        "missions": missions,
        "events": list_events(conn),
        "runs": list_runs(conn),
        "artifacts": list_artifacts(conn),
        "automations": list_automations(conn),
        "channels": channel_state(conn),
        "policies": policy_state(conn),
        "securityEvents": list_security_events(conn),
        "memoryHits": memory_hits(memory_query),
        "usageTotal": usage_total(conn),
    }


class Handler(BaseHTTPRequestHandler):
    server_version = "JARVISControlCenter/0.1"

    def do_GET(self) -> None:
        parsed = urlparse(self.path)
        if parsed.path == "/api/state":
            params = parse_qs(parsed.query)
            with connect() as conn:
                self.send_json(state_payload(conn, params.get("q", [""])[0]))
            return
        if parsed.path == "/api/memory/search":
            params = parse_qs(parsed.query)
            self.send_json({"memoryHits": memory_hits(params.get("q", [""])[0])})
            return
        if parsed.path == "/api/artifacts":
            with connect() as conn:
                self.send_json({"artifacts": list_artifacts(conn)})
            return
        if parsed.path == "/api/settings":
            with connect() as conn:
                self.send_json({"settings": runner_settings(conn), "setup": setup_state()})
            return
        self.serve_static(parsed.path)

    def do_HEAD(self) -> None:
        parsed = urlparse(self.path)
        if parsed.path.startswith("/api/"):
            self.send_response(HTTPStatus.OK)
            self.send_header("Content-Type", "application/json; charset=utf-8")
            self.end_headers()
            return
        self.serve_static(parsed.path, head_only=True)

    def do_POST(self) -> None:
        parsed = urlparse(self.path)
        data = self.read_json()
        try:
            with connect() as conn:
                if parsed.path == "/api/missions":
                    mission = create_mission(
                        conn,
                        str(data.get("prompt", "")).strip(),
                        str(data.get("agent", "orchestrator")),
                        str(data.get("skill", "jarvis-control-plane")),
                        str(data.get("source", "Dashboard")),
                        str(data.get("risk", "Low")),
                    )
                    self.send_json({"mission": mission, "state": state_payload(conn)})
                    return
                if parsed.path == "/api/settings":
                    update_settings(conn, data)
                    self.send_json({"state": state_payload(conn)})
                    return
                if parsed.path == "/api/automations":
                    automation = create_automation(
                        conn,
                        str(data.get("name", "")).strip(),
                        str(data.get("trigger", "Manual")).strip(),
                        str(data.get("agent", "orchestrator")).strip(),
                        str(data.get("skill", "jarvis-control-plane")).strip(),
                        str(data.get("status", "Paused")).strip(),
                    )
                    self.send_json({"automation": automation, "state": state_payload(conn)})
                    return
                match = re.match(r"^/api/automations/([^/]+)/toggle$", parsed.path)
                if match:
                    automation_id = unquote(match.group(1))
                    row = conn.execute("SELECT status FROM automations WHERE id = ?", (automation_id,)).fetchone()
                    if not row:
                        raise ValueError("automation not found")
                    next_status = "Paused" if row["status"] == "Active" else "Active"
                    conn.execute(
                        "UPDATE automations SET status = ?, updated_at = ? WHERE id = ?",
                        (next_status, now(), automation_id),
                    )
                    add_event(conn, None, "automation", f"{automation_id} {next_status.lower()}")
                    self.send_json({"state": state_payload(conn)})
                    return
                if parsed.path == "/api/missions/next/run":
                    mission = run_mission(conn)
                    self.send_json({"mission": mission, "state": state_payload(conn)})
                    return
                match = re.match(r"^/api/missions/([^/]+)/run$", parsed.path)
                if match:
                    mission = run_mission(conn, unquote(match.group(1)))
                    self.send_json({"mission": mission, "state": state_payload(conn)})
                    return
                match = re.match(r"^/api/channels/([^/]+)/ingest$", parsed.path)
                if match:
                    mission = self.ingest_channel(conn, unquote(match.group(1)), data)
                    self.send_json({"mission": mission, "state": state_payload(conn)})
                    return
                match = re.match(r"^/api/channels/([^/]+)/toggle$", parsed.path)
                if match:
                    channel = unquote(match.group(1))
                    current = get_setting(conn, f"channel:{channel}", "false") == "true"
                    set_setting(conn, f"channel:{channel}", "false" if current else "true")
                    add_event(conn, None, "channel", f"{channel} ingress {'disabled' if current else 'enabled'}")
                    self.send_json({"state": state_payload(conn)})
                    return
                match = re.match(r"^/api/policies/(.+)/toggle$", parsed.path)
                if match:
                    policy = unquote(match.group(1))
                    current = get_setting(conn, f"policy:{policy}", "false") == "true"
                    set_setting(conn, f"policy:{policy}", "false" if current else "true")
                    add_event(conn, None, "policy", f"{policy} {'relaxed' if current else 'armed'}")
                    self.send_json({"state": state_payload(conn)})
                    return
                if parsed.path == "/api/system/pause":
                    paused = bool(data.get("paused", False))
                    set_setting(conn, "paused", "true" if paused else "false")
                    add_event(conn, None, "system", "Inbound execution paused" if paused else "Inbound execution re-armed")
                    self.send_json({"state": state_payload(conn)})
                    return
        except ValueError as exc:
            self.send_json({"error": str(exc)}, status=HTTPStatus.BAD_REQUEST)
            return
        except Exception as exc:
            self.send_json({"error": str(exc)}, status=HTTPStatus.INTERNAL_SERVER_ERROR)
            return
        self.send_json({"error": "Not found"}, status=HTTPStatus.NOT_FOUND)

    def ingest_channel(self, conn: sqlite3.Connection, channel: str, data: dict) -> dict:
        if get_setting(conn, f"channel:{channel}", "false") != "true":
            add_security_event(conn, None, channel, "deny", "channel disabled")
            raise ValueError(f"{channel} ingress is disabled")
        prompt = str(data.get("prompt", "")).strip()
        if not prompt:
            raise ValueError("prompt is required")
        risk = str(data.get("risk", "Low"))
        pin_required = get_setting(conn, "policy:PIN challenge", "false") == "true" and risk == "High"
        expected_pin = os.getenv("JARVIS_CONTROL_PIN", "")
        if pin_required and (not expected_pin or data.get("pin") != expected_pin):
            add_security_event(conn, None, channel, "deny", "PIN required")
            raise ValueError("PIN required for high-risk channel mission")
        mission = create_mission(
            conn,
            prompt,
            str(data.get("agent", "orchestrator")),
            str(data.get("skill", "jarvis-control-plane")),
            channel,
            risk,
        )
        add_security_event(conn, mission["id"], channel, "allow", "channel ingress accepted")
        return mission

    def serve_static(self, path: str, head_only: bool = False) -> None:
        target = STATIC_DIR / (path.lstrip("/") or "index.html")
        if target.is_dir():
            target = target / "index.html"
        try:
            resolved = target.resolve()
            resolved.relative_to(STATIC_DIR.resolve())
        except ValueError:
            self.send_error(HTTPStatus.FORBIDDEN)
            return
        if not resolved.exists():
            self.send_error(HTTPStatus.NOT_FOUND)
            return
        content_type = "text/plain"
        if resolved.suffix == ".html":
            content_type = "text/html; charset=utf-8"
        elif resolved.suffix == ".css":
            content_type = "text/css; charset=utf-8"
        elif resolved.suffix == ".js":
            content_type = "application/javascript; charset=utf-8"
        elif resolved.suffix == ".svg":
            content_type = "image/svg+xml"
        body = resolved.read_bytes()
        self.send_response(HTTPStatus.OK)
        self.send_header("Content-Type", content_type)
        self.send_header("Content-Length", str(len(body)))
        self.end_headers()
        if not head_only:
            self.wfile.write(body)

    def read_json(self) -> dict:
        length = int(self.headers.get("Content-Length", "0"))
        if length <= 0:
            return {}
        raw = self.rfile.read(length)
        try:
            return json.loads(raw.decode("utf-8"))
        except json.JSONDecodeError:
            return {}

    def send_json(self, payload: dict, status: HTTPStatus = HTTPStatus.OK) -> None:
        body = json.dumps(payload, ensure_ascii=False).encode("utf-8")
        self.send_response(status)
        self.send_header("Content-Type", "application/json; charset=utf-8")
        self.send_header("Content-Length", str(len(body)))
        self.end_headers()
        self.wfile.write(body)

    def log_message(self, fmt: str, *args: object) -> None:
        sys.stderr.write(f"[{now()}] {self.address_string()} {fmt % args}\n")


def main() -> None:
    init_db()
    port = int(os.getenv("JARVIS_CONTROL_CENTER_PORT", str(DEFAULT_PORT)))
    server = ThreadingHTTPServer(("127.0.0.1", port), Handler)
    print(f"JARVIS Control Center running at http://127.0.0.1:{port}")
    print(f"SQLite DB: {DB_PATH}")
    server.serve_forever()


if __name__ == "__main__":
    main()
