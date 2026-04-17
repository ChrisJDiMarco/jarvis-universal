# Skill: Self-Healing Execution Loop

## Trigger
"build and test workflow", "auto-fix", "self-healing mode", "deploy with validation", auto-invoked by n8n-workflow-builder during Step 4 (Test)

## Goal
Execute any JARVIS-generated artifact (n8n workflow JSON, code, automation config) through a validate → execute → diagnose → repair → retry loop — inspired by AutoResearchClaw's CodeAgent v2 self-healing experiment runner. Dramatically increases first-time deployment success rate.

---

## Architecture: Plan → Validate → Execute → Heal Loop

```
Artifact → VALIDATE (structural) → EXECUTE (test run) → PASS? → Deploy
                                         ↓ FAIL
                                    DIAGNOSE error
                                         ↓
                                    REPAIR artifact
                                         ↓
                                    RE-VALIDATE → RE-EXECUTE
                                    (max 5 iterations)
```

---

## Supported Artifact Types

| Type | Validation | Execution | Repair |
|------|-----------|-----------|--------|
| n8n workflow JSON | Schema check, node connectivity, credential refs | Test execution via n8n API | Regenerate failing nodes |
| Python script | AST parse, import check, security scan | Sandbox execution | LLM-guided fix from error trace |
| Shell script | Syntax check (bash -n) | Sandboxed execution | Fix from error output |
| API config | Endpoint validation, auth check | Test request | Fix auth/endpoint/payload |

---

## Phase 1: PLAN (Haiku)
**Purpose**: Before building, create a structural plan

For n8n workflows:
```json
{
  "workflow_name": "",
  "trigger_type": "webhook | schedule | manual | event",
  "nodes": [
    {"name": "", "type": "", "depends_on": [], "critical": true}
  ],
  "data_flow": "description of what data moves where",
  "error_handling": "what happens on failure",
  "credentials_needed": ["ghl-api-key", "anthropic-api-key"],
  "test_payload": {}
}
```

For code:
```json
{
  "purpose": "",
  "inputs": [],
  "outputs": [],
  "dependencies": [],
  "security_constraints": ["no eval", "no subprocess", "no network unless required"],
  "test_cases": [
    {"input": {}, "expected_output": {}}
  ]
}
```

---

## Phase 2: VALIDATE (Programmatic — NO LLM)

### n8n Workflow Validation
1. **Schema check**: Valid JSON, has `nodes` array, has `connections` object
2. **Node connectivity**: Every node (except trigger) has at least one incoming connection
3. **No orphans**: Every node's output connects somewhere (except terminal nodes)
4. **Credential references**: All referenced credentials exist in the known credentials list
5. **Required fields**: Each node type has its required parameters set
6. **Error handler**: At least one Error Trigger node exists (or Continue On Fail on non-critical nodes)

### Code Validation (AST-based, like AutoResearchClaw)
1. **Parse**: AST parse succeeds (no syntax errors)
2. **Security scan**: No dangerous operations:
   - Block: `eval()`, `exec()`, `subprocess`, `os.system`, `__import__`
   - Flag: `open()` for write, network calls (allowed only if explicitly needed)
3. **Import check**: All imports are from allowed/installed packages
4. **Output format**: Code produces expected output format (check for print/return)

### Validation Verdicts
- **PASS**: All checks pass → proceed to execution
- **WARN**: Non-critical issues found → proceed but log warnings
- **FAIL**: Critical issues → go directly to REPAIR (skip execution)

---

## Phase 3: EXECUTE (Test Run)

### n8n Workflows
1. Use `execute_workflow` MCP tool with test payload
2. Capture: execution status, node outputs, error messages, execution time
3. If manual testing needed: save workflow to `n8n-configs/` and provide test instructions

### Code
1. Execute in sandbox (JARVIS working directory, no network)
2. Capture: stdout, stderr, exit code, execution time
3. Time guard: kill after 60 seconds (prevent infinite loops)

### Execution Verdicts
- **SUCCESS**: Clean execution, expected output format → proceed to deploy
- **PARTIAL**: Some nodes/steps succeeded, others failed → targeted repair
- **FAILURE**: Complete failure → full diagnosis
- **TIMEOUT**: Exceeded time limit → check for infinite loops, reduce scope

---

## Phase 4: DIAGNOSE (Haiku — pattern match errors)

When execution fails, extract a structured diagnosis:

```json
{
  "error_type": "syntax | runtime | auth | timeout | data_format | logic | dependency",
  "error_message": "exact error text",
  "failing_component": "which node or line failed",
  "root_cause_hypothesis": "best guess at why",
  "repair_strategy": "what to change",
  "known_fix": null  // populated from skills/learned/error-recovery.md if match found
}
```

### Check MetaClaw First
Before generating a new diagnosis, search `skills/learned/error-recovery.md` for matching errors:
- If exact match found → use known fix immediately (skip LLM diagnosis)
- If similar match found → use as starting point for repair
- If no match → generate new diagnosis

### Common Error Patterns (pre-loaded)
| Error Pattern | Likely Cause | Fix |
|--------------|-------------|-----|
| `401 Unauthorized` | Bad/expired credentials | Refresh credential, verify scope |
| `429 Too Many Requests` | Rate limited | Add delay node, reduce batch size |
| `TypeError: Cannot read property` | Null data in pipeline | Add null check / IF node |
| `ECONNREFUSED` | Service not running | Check service URL, retry with backoff |
| `Invalid JSON` | Malformed output from prev node | Add JSON parse + try/catch |
| `ModuleNotFoundError` | Missing Python package | pip install in sandbox |

---

## Phase 5: REPAIR (Sonnet — needs reasoning)

Based on diagnosis, apply targeted fixes:

### For n8n Workflows
1. **Node-level repair**: Regenerate only the failing node + its connections
2. **Data flow repair**: Fix the data mapping between nodes (expression syntax)
3. **Auth repair**: Update credential reference or add auth retry
4. **Logic repair**: Add missing IF/Switch nodes for edge cases

### For Code
1. **Line-level repair**: Fix the specific failing line/function
2. **Import repair**: Add missing imports or fix versions
3. **Logic repair**: Fix the algorithm based on test case failures
4. **Security repair**: Replace blocked operations with safe alternatives

### Repair Rules
- **Targeted, not wholesale**: Fix only what's broken, don't regenerate the whole artifact
- **Preserve working parts**: Never modify nodes/code that passed validation
- **Explain the fix**: Add a comment or sticky note explaining what was changed and why
- **Version the artifact**: Save pre-repair version as `[name]-v[N].json` before modifying

---

## Phase 6: RE-VALIDATE → RE-EXECUTE (Loop)

After repair:
1. Run Phase 2 (VALIDATE) again on the repaired artifact
2. If validation passes: Run Phase 3 (EXECUTE) again
3. Track iteration count

### Loop Limits
- **Max iterations**: 5 (configurable)
- **Escalation at 3**: After 3 failed attempts, log a detailed report and ask the operator for input
- **Hard stop at 5**: Save all artifacts + diagnosis history, alert the operator via iMessage

### Iteration Log
Each iteration is logged to `logs/healing-loops.log`:
```
[2026-03-25 14:30] [workflow-name] Iteration 1: FAIL — 401 on API node → refreshed credential
[2026-03-25 14:31] [workflow-name] Iteration 2: FAIL — null data at node 4 → added IF check
[2026-03-25 14:32] [workflow-name] Iteration 3: SUCCESS — all nodes passed, output matches expected
```

---

## Phase 7: DEPLOY + LEARN

### On Success
1. Activate workflow in n8n / save code to final location
2. Update `n8n-configs/README.md` with deployment record
3. If any repair iterations happened → extract MetaClaw lessons:
   - What error occurred
   - What fixed it
   - Store in `skills/learned/error-recovery.md`
4. Notify the operator: "[Workflow] deployed. Required [N] repair iterations. All tests passing."

### On Failure (max iterations reached)
1. Save all artifacts + full diagnosis history to `owners-inbox/failures/[name]-diagnosis.md`
2. Include: what we tried, what failed, recommended manual fix
3. Alert the operator via iMessage: "[Workflow] needs manual review — 5 repair attempts exhausted. Report in owners-inbox."
4. Store failure pattern in MetaClaw for future avoidance

---

## Integration with n8n-workflow-builder

The self-healing executor replaces the existing Step 4 (Test) in the n8n-workflow-builder skill:

**Old flow**: Build → Manual test → Hope it works
**New flow**: Build → Plan (Phase 1) → Validate → Execute → Heal if needed → Deploy

To invoke from n8n-workflow-builder, add after Step 3:
```
### Step 4: Self-Healing Test + Deploy
Invoke `self-healing-executor` with:
- artifact_type: "n8n_workflow"
- artifact_path: path to workflow JSON
- test_payload: sample data for the trigger
- max_iterations: 5
- strictness: HIGH (all nodes must pass)
```

---

## Model Routing

| Phase | Model | Why |
|-------|-------|-----|
| PLAN | Haiku | Structural planning, templated |
| VALIDATE | None (programmatic) | Code checks only |
| EXECUTE | None (tool call) | n8n API or sandbox |
| DIAGNOSE | Haiku | Pattern matching errors to fixes |
| REPAIR | Sonnet | Needs reasoning to generate correct fix |
| LEARN | Haiku | Lesson extraction |

---

## Rules
- Validation is ALWAYS programmatic — never ask an LLM "does this look right?"
- Check MetaClaw error-recovery lessons BEFORE generating new diagnoses
- Never modify working nodes/code during repair — targeted fixes only
- Version artifacts before each repair attempt — never lose the original
- Time guard: 60s per execution, 5 min total per healing loop
- Log every iteration — this data feeds MetaClaw and helps the operator understand failure patterns
- If the same error type appears 3+ times across different workflows → it's a systemic issue, flag for architectural review
- Escalate at 3 iterations, hard stop at 5 — don't burn tokens on infinite repair loops
