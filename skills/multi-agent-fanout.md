# Skill: Multi-Agent Fan-Out

## Trigger
"do all of this at once", "in parallel", "simultaneously", "run all three", "kick off research and write the content", any request that contains multiple distinct workstreams that don't depend on each other

## Goal
Decompose a request into parallel sub-tasks, dispatch them to specialized agents simultaneously, then synthesize the results — compressing what would be sequential 15-minute work into 3-4 minutes.

---

## Sub-Agents vs Agent Teams — Pick the Right Pattern

This skill covers **sub-agent fan-out**: independent parallel tasks that return results to the orchestrator. No peer-to-peer communication.

For tasks where agents need to **react to each other, pass work between specialists, or run QA loops** → use **`skills/agent-teams.md`** instead.

| Use Fan-Out (this skill) | Use Agent Teams |
|--------------------------|-----------------|
| Tasks are fully independent | Agents need to message each other |
| Results merge at orchestrator only | Work passes between agents (hand-off) |
| No QA or review loops needed | Need a QA agent to review and reject |
| Token efficiency matters | Quality matters more than cost |
| 2–6 isolated tasks | 3–5 coordinated specialists |

---

## When to Fan Out

Fan out when a request has 2+ independent workstreams. Examples:

| Request | Fan-Out Into |
|---------|-------------|
| "Prep for my call with [Company] tomorrow" | [1] Research company via competitive intel [2] Pull relevant context from memory [3] Draft call agenda |
| "Write a LinkedIn post and also research my top competitors" | [1] content-creator writes post [2] researcher runs competitive sweep |
| "Give me a morning briefing" | [1] Check calendar [2] Pull active project status [3] Check owners-inbox [4] Pull any relevant alerts |
| "Analyze my top 3 competitors" | [1] Research Competitor A [2] Research Competitor B [3] Research Competitor C |
| "Update all active automations and write a status report" | [1] Check each workflow [2] Pull performance data [3] Check project status |

---

## Fan-Out Protocol

### Step 1: Decompose
Break the request into N independent tasks. Tasks are independent if: Task B does not need the output of Task A to begin.

**Dependency check:**
```
Task A → Task B (dependent: run sequentially)
Task A  ┐
Task B  ├→ Synthesize (independent: run in parallel)
Task C  ┘
```

### Step 2: Assign Agents
Map each task to the appropriate agent from the roster:

| Task Type | Agent |
|-----------|-------|
| Web research, competitor analysis | researcher |
| Pipeline, client data, CRM | analyst |
| Content drafts (posts, articles) | content-creator |
| Calendar, scheduling, meeting prep | scheduler |
| Revenue, costs, invoicing | finance |
| Market research, lead prospecting | researcher |
| Product/growth analysis | analyst |
| App or automation builds | builder |

### Step 3: Dispatch (Parallel)
Launch all sub-agents simultaneously. Each gets:
- Clear, isolated task description (no shared state)
- Relevant memory context (which memory files to read)
- Defined output format and destination
- Timeout expectation

### Step 4: Synthesize
Once all sub-agents return:
1. Collect all outputs
2. Resolve any conflicts (e.g., two agents reference the same client differently)
3. Compose unified response or deliverable
4. Save to owners-inbox if it's a document, or respond directly if it's a briefing

---

## Dispatch Template

When spinning up a sub-agent, use this structure:

```
Agent: [agent-name]
Task: [single clear sentence of what to do]
Context: Read memory/[relevant].md before starting
Output: [exact format — table / markdown doc / JSON / direct response]
Destination: [owners-inbox/[path] OR return to orchestrator]
Timeout: [expected time — usually 2-3 min per task]
```

Example — 3-way fan-out for morning briefing:
```
Agent: scheduler
Task: Pull today's calendar events and flag any meetings needing prep
Context: Read memory/core.md
Output: Bulleted list with time, title, and "prep needed: yes/no"
Destination: return to orchestrator

Agent: analyst
Task: Pull active project/goal status — count by phase, flag any overdue items
Context: Read memory/context.md
Output: Status table (project | phase | next action | due date)
Destination: return to orchestrator

Agent: orchestrator
Task: Check owners-inbox/ for any unreviewed items
Context: None needed
Output: List of files + 1-line summary of each
Destination: return to orchestrator
```

---

## Synthesis Template

When all sub-agents return, synthesize using:

```
JARVIS BRIEFING — [date] [time]
━━━━━━━━━━━━━━━━━━━━━━━━━━━
[SECTION 1 from agent 1 output]

[SECTION 2 from agent 2 output]

[SECTION 3 from agent 3 output]
━━━━━━━━━━━━━━━━━━━━━━━━━━━
PRIORITY ACTION: [single most important thing to do right now]
```

---

## Rules
- Maximum 5 parallel agents at once — beyond that, group by priority and run in waves
- Each sub-agent gets isolated context — do NOT share the full conversation with all agents
- If one agent fails or times out: complete the briefing with available data, flag the failure clearly
- Fan-out only for independent tasks — never run parallel when Task B needs Task A's output
- Always synthesize into a single response — never dump 5 separate agent outputs at the operator unfiltered
- After fan-out: log the pattern to learnings.md if it was a new combination worth repeating as a skill
