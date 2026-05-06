# Skill: Karpathy Loop (Auto-Research Architecture)

## Trigger
"karpathy loop", "auto-research", "self-optimize", "run experiments overnight", "optimize [metric] automatically", "let it run and find improvements", "autonomous experimentation"

## Origin
Andrej Karpathy's 630-line Python script (March 8, 2026). An agent pointed at a training codebase ran 700 experiments in 2 days, found 20 genuine improvements, cut training time 11%, and caught a bug Karpathy had missed. Third Layer (YC startup) applied the same pattern to agent harnesses — a meta-agent rewrote the task-agent's scaffolding overnight and hit #1 on two benchmarks. All prior entries on those leaderboards were hand-engineered by humans.

## Goal
Turn any system with a measurable metric into a self-optimizing loop. The agent runs experiments, evaluates results, keeps improvements, and iterates — without human intervention per cycle.

---

## The Loop

```
1. DEFINE    → Pick the system + the one metric to optimize
2. BASELINE  → Measure current performance
3. HYPOTHESIZE → Generate experiment variants (prompt changes, config changes, code changes)
4. RUN       → Execute variants in isolation
5. EVALUATE  → Score each variant against the metric
6. KEEP      → Promote improvements; discard regressions
7. LOG       → Record what was tried, what worked, why
8. REPEAT    → Generate next hypothesis batch from what was learned
```

---

## Prerequisites (MUST VERIFY BEFORE STARTING)

The Karpathy Loop fails — and compounds errors — without these foundations:

### 1. A Single, Measurable Metric
The loop needs one number to optimize. Without it, "improvement" is undefined.

| System | Candidate Metric |
|--------|-----------------|
| Public-records detector | Precision@k on verified true-positive set |
| JARVIS agent prompts | Task completion rate on eval set |
| MetaClaw lessons | Lesson reuse rate (injections that prevent errors) |
| Golden Thread content | Engagement rate per asset |
| Product onboarding | % reaching aha moment within 5 screens |

### 2. Solid Memory Architecture
Auto-research on broken memory compounds mistakes. Verify before starting:
- [ ] Agent has access to experiment history (what was tried)
- [ ] Results are persisted between runs (not just in context)
- [ ] The metric is being logged consistently

### 3. Experiment Isolation
Each experiment variant must:
- Run independently (not affect the current production system)
- Be reversible (keep the original as baseline)
- Be logged (what changed, what result came out)

---

## JARVIS Implementation Pattern

### Phase 1: Baseline Measurement
```
1. Read current system state (prompt, config, or code)
2. Run against the eval set / test cases
3. Record baseline metric score
4. Log to: logs/karpathy-loop/{system-name}/baseline.json
```

### Phase 2: Hypothesis Generation
Use the harness-optimizer agent to generate N experiment variants:
```
Prompt: "Given this [system prompt / config / code], generate 5 variants that might 
improve [metric]. Each variant should change ONE thing. Explain the hypothesis for each."
```

### Phase 3: Parallel Experiment Execution
Use multi-agent-fanout to run all variants simultaneously:
```
- Agent 1: Test variant A against eval set, report metric score
- Agent 2: Test variant B against eval set, report metric score
- ...
- Agent N: Test variant N against eval set, report metric score
```

### Phase 4: Evaluate + Promote
```
1. Collect scores from all agents
2. Find variants that beat baseline by > threshold (default: 5%)
3. Promote winner as new baseline
4. Log: what changed, delta improvement, hypothesis that was validated
```

### Phase 5: Learn + Iterate
```
1. Extract the principle from what worked (MetaClaw-style)
2. Generate next hypothesis batch informed by what succeeded/failed
3. Repeat from Phase 2
```

---

## JARVIS-Specific Applications (Priority Order)

### 1. JARVIS Agent Prompt Optimization
- **Metric**: Task completion rate on a fixed eval set of 20 representative tasks
- **Experiment variants**: Rephrase instructions, reorder sections, add/remove examples
- **Run frequency**: Weekly, after MetaClaw accumulates 5+ new lessons
- **Agent**: harness-optimizer

### 2. Public-Records Detection Pipeline
- **Metric**: Precision on verified lapse test cases (manually curated ground truth)
- **Experiment variants**: Different extraction prompts, different filter thresholds, different data sources
- **Run frequency**: After each new data batch

### 3. MetaClaw Lesson Quality
- **Metric**: % of injected lessons that prevent a repeat error (tracked in error-recovery.md)
- **Experiment variants**: Different lesson formats, different injection templates
- **Run frequency**: Monthly

---

## Experiment Log Format

All Karpathy Loop runs write to `logs/karpathy-loop/{system}/`:

```json
{
  "run_id": "kl-{system}-{date}",
  "system": "jarvis-orchestrator-prompt",
  "metric": "task_completion_rate",
  "baseline_score": 0.72,
  "variants_tested": 5,
  "winner": {
    "variant_id": "v3",
    "change": "Added 'explore before planning' instruction to opening paragraph",
    "score": 0.81,
    "delta": "+12.5%"
  },
  "promoted_to_production": true,
  "lesson": "Explicit exploration instruction improves task completion on unfamiliar codebases"
}
```

---

## Failure Modes + Guards

| Failure Mode | Guard |
|-------------|-------|
| Context rot (agent forgets what it tried) | Persist experiment log to file between runs |
| Metric gaming (agent finds shortcut that scores well but doesn't generalize) | Validate winner on held-out test set before promoting |
| Compounding bad improvements | Keep N-generation rollback history; weekly human review |
| Runaway token spend | Cap experiments per run (default: 5 variants × 20 eval cases = 100 LLM calls max) |
| No real improvement found | Log "no winner" and increase hypothesis diversity next round |

---

## Quick Start: First Karpathy Loop in 30 Minutes

```
1. Pick one system (start with: JARVIS morning briefing prompt)
2. Define metric: "How many of the 10 standard morning briefing items does it surface correctly?"
3. Create eval set: 10 test cases with known correct outputs
4. Run baseline: measure current score
5. Ask harness-optimizer agent: "Generate 5 variants of this prompt that might improve score on these 10 test cases"
6. Run variants with multi-agent-fanout
7. Promote winner, log result
8. Schedule weekly re-run
```

---

## Rules
- Never run the loop without a defined metric — "better" is not a metric
- Always keep the baseline as a rollback option
- Log every run; the log IS the loop's memory
- First loop should be reversible (prompt changes, not code changes)
- Human review required before promoting any code change to production
- Cap at 5 variants per run until the pattern is proven in your context

---

## Related
[[metaclaw-learning]]  [[multi-agent-fanout]]  [[self-healing-executor]]  [[harness-optimizer agent]]
