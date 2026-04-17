# Requirement Document Template

> Use this for any task that is: multi-agent, >1 hour of execution, or irreversible.
> Quick tasks (<30 min, reversible, single agent) skip the RD.

---

# RD: [Task Name]

**Date**: [date]
**Operator**: [name]
**Status**: Draft → Review → Approved → In Progress → Done

---

## 1. Problem / Goal

> What are we trying to accomplish? What decision or outcome does this enable?

[2-3 sentences max]

---

## 2. Scope

### In Scope
- [Deliverable 1]
- [Deliverable 2]

### Out of Scope
- [What we're explicitly NOT doing]

### Success Criteria
- [ ] [How we know this is done — specific and measurable]
- [ ] [Second success criterion]

---

## 3. Agents & Skills Required

| Agent / Skill | Role in This Task |
|---------------|------------------|
| [agent name] | [what they're doing] |
| [skill name] | [when it's invoked] |

---

## 4. What JARVIS Handles vs. What the Operator Handles

| JARVIS | Operator |
|--------|----------|
| [what JARVIS does autonomously] | [what requires operator input or decision] |

---

## 5. Phases & Checkpoints

### Phase 1: [Name]
- [ ] [Step 1]
- [ ] [Step 2]
- **Checkpoint**: Operator reviews [output] before Phase 2 begins

### Phase 2: [Name]
- [ ] [Step 1]
- [ ] [Step 2]
- **Checkpoint**: [what gets reviewed]

---

## 6. Risks & Guardrails

| Risk | Likelihood | Mitigation |
|------|-----------|------------|
| [e.g., API rate limit hit] | Medium | [Add retry logic, batch requests] |
| [e.g., wrong data used] | Low | [Verify source before processing] |

---

## 7. Output

- **Primary deliverable**: [file path or format]
- **Secondary outputs**: [any supporting files]
- **Review location**: `owners-inbox/[subfolder]/`

---

## Approval

- [ ] Operator has reviewed and approved this RD
- [ ] All ambiguities resolved before execution begins

---
*JARVIS will not begin execution until this RD is marked Approved.*
