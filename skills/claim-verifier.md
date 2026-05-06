# Skill: Claim Verifier (Anti-Fabrication Layer)

## Trigger
"verify this", "fact check", "check the claims in", as explicit post-processing step on: content-creation, case-study-generator, proposal-generation, discovery-audit

## Invocation
**Explicit post-processing only — do not auto-invoke on casual mentions of "verify" or "check" in conversation.**
Claim verification requires the full output document as input. Firing on conversational references to "verify" without a complete artifact to check produces false positives and wasted tool calls. Only invoke after a content artifact is complete and ready for publication review.

## Goal
Extract every factual claim, statistic, and data point from JARVIS-generated content — then verify each against source material or live web data. Inspired by AutoResearchClaw's VerifiedRegistry + PaperVerifier pattern. Zero hallucinated stats in anything the operator publishes.

---

## Architecture: Extract → Verify → Sanitize

```
Content Draft → EXTRACT claims → VERIFY each → SANITIZE unverified → Clean Draft
```

---

## Phase 1: EXTRACT CLAIMS (Haiku)

**Input**: Any JARVIS-generated content (post, report, audit, case study, proposal)

**Prompt** (pass ONLY the content, isolated context):
```
Extract every factual claim from this content. A "claim" is any statement that:
- Cites a specific number, percentage, or statistic
- References a study, report, or named source
- Asserts a trend or market fact
- Quotes or attributes a statement to someone
- States a before/after metric or result

Return as JSON array:
[
  {
    "claim_id": 1,
    "text": "exact quote from the content",
    "type": "statistic | source_reference | trend | quote | metric",
    "verification_needed": "what specific fact needs checking",
    "location": "which section/paragraph"
  }
]

If the content contains zero verifiable claims, return an empty array.
```

**Output**: `data/verification/[content-slug]-claims.json`

---

## Phase 2: VERIFY (Haiku + Firecrawl)

For each extracted claim, run the appropriate verification:

### Statistic / Metric Claims
1. Search via `firecrawl_search`: `[exact stat] source study`
2. If found: record source URL + matching text
3. If not found: search for the general topic + check if a different number appears
4. Verdict: VERIFIED (source found) | DISPUTED (different number found) | UNVERIFIED (no source)

### Source Reference Claims
1. Search for the cited source (report name, study author, publication)
2. Verify it exists and says what the content claims it says
3. Verdict: VERIFIED | MISATTRIBUTED | FABRICATED

### Trend Claims
1. Search for recent (2024-2026) evidence of the claimed trend
2. Check if multiple sources corroborate
3. Verdict: VERIFIED | PARTIAL (some support) | UNVERIFIED

### Quote Claims
1. Search for the exact quote + attributed speaker
2. Verdict: VERIFIED | UNVERIFIED (can't find original)

### Before/After Metric Claims (from case studies, audits)
1. Check against JARVIS's own data: `data/audits/`, `data/clients/`, CRM records
2. Cross-reference with any source docs the operator provided
3. Verdict: VERIFIED_INTERNAL | UNVERIFIED

**Verification output per claim**:
```json
{
  "claim_id": 1,
  "verdict": "VERIFIED | DISPUTED | UNVERIFIED | MISATTRIBUTED | FABRICATED",
  "source_url": "url if found",
  "source_text": "matching text from source",
  "actual_value": "if disputed, what the real number is",
  "confidence": "HIGH | MEDIUM | LOW"
}
```

**Output**: `data/verification/[content-slug]-verified.json`

---

## Phase 3: SANITIZE (Sonnet)

Based on verification results, process the content:

### VERIFIED claims → Keep as-is, optionally add source link
### DISPUTED claims → Replace with correct value from source, add citation
### UNVERIFIED claims → Three options:
1. **Remove**: Delete the claim entirely (safest)
2. **Soften**: Change "X% of companies..." → "Many companies..." (remove specific number)
3. **Flag**: Add "[citation needed]" for the operator to manually verify

**Default behavior**: Soften unverified stats, remove fabricated sources, correct disputed numbers.

### FABRICATED / MISATTRIBUTED → Remove immediately, log to MetaClaw

---

## Phase 4: REPORT

Generate a verification summary appended to the content file:

```markdown
---
## Verification Report
**Claims checked**: [N]
**Verified**: [X] | **Disputed (corrected)**: [Y] | **Unverified (softened)**: [Z] | **Removed**: [W]
**Verification score**: [X/N × 100]%

### Corrections Made
- Claim: "[original text]" → Corrected to: "[new text]" — Source: [url]
- Claim: "[original text]" → Softened to: "[new text]" — No source found

### Sources Added
- [url1] — used to verify [claim]
- [url2] — used to verify [claim]
---
```

---

## Integration with Content Pipeline

### Auto-Trigger Rules
These skills automatically invoke claim-verifier as a post-processing step:

| Skill | When to Verify | Strictness |
|-------|---------------|------------|
| content-creation | Before saving to owners-inbox | MEDIUM (soften unverified) |
| case-study-generator | Before delivering | HIGH (remove unverified — client metrics must be traceable) |
| proposal-generation | Before delivering | MEDIUM (soften unverified market stats) |
| discovery-audit | Phase 3 revenue model numbers | HIGH (must use client's actual numbers or stated benchmarks) |
| researcher-deep | Part of Phase 6 delivery | Already handled — but run as final check |

### Strictness Levels
- **HIGH**: Remove all unverified claims. Every number needs a source.
- **MEDIUM**: Soften unverified claims (remove specific numbers, keep directional statements). Flag for the operator.
- **LOW**: Log unverified claims but don't modify content. Report only.

---

## VerifiedRegistry (Persistent Ground-Truth Store)

For recurring data points JARVIS uses often (industry benchmarks, client metrics, pricing):

**File**: `data/verified-registry.json`

```json
{
  "benchmarks": {
    "speed_to_lead_5min": {
      "claim": "Responding within 5 minutes increases conversion by 21x",
      "source": "https://...",
      "verified_date": "2026-03-25",
      "confidence": "HIGH"
    },
    "ai_exposure_customer_service": {
      "claim": "Customer service reps are 70.1% AI-exposed",
      "source": "internal research",
      "verified_date": "2026-03-24",
      "confidence": "HIGH"
    }
  },
  "client_metrics": {}
}
```

**Usage**: Before running full verification, check the registry first. If a claim matches a registry entry that was verified within 30 days, skip the web search — use the cached verification.

**Maintenance**: Update registry entries during weekly review if sources have changed.

---

## Model Routing

| Phase | Model | Why |
|-------|-------|-----|
| EXTRACT | Haiku | Pattern extraction, no reasoning |
| VERIFY | Haiku + Firecrawl | Search + comparison, not synthesis |
| SANITIZE | Sonnet | Needs to rewrite naturally while preserving voice |
| REPORT | Haiku | Templated output |

---

## MetaClaw Integration

- If a specific LLM-generated stat is found to be fabricated 2+ times → store as lesson in `skills/learned/prompt-patterns.md` with the pattern to avoid
- If a source consistently provides reliable data → store as lesson in `skills/learned/tool-routing.md`
- Track fabrication rate per content type over time — if a skill consistently produces unverified claims, flag for prompt improvement

---

## Rules
- Never verify by asking the LLM "is this true?" — verification is always source-based (web search or internal data)
- The VerifiedRegistry is a cache, not a source of truth — entries expire after 30 days
- Client metrics (case studies, audit results) must be verified against JARVIS's own records, not web searches
- Fabricated sources (studies that don't exist) are the highest-severity finding — always remove and log
- the operator's voice must survive sanitization — don't make corrections sound robotic
- Verification adds 1-3 minutes to content creation — worth it for credibility
- If verification score < 60%, flag the entire piece for manual review before publishing
