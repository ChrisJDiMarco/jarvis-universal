# Seedance Prompt — [topic-slug]

**Date**: [YYYY-MM-DD]
**Word count target**: 60–100
**Validation**: see end of file

---

## Final Prompt

[Cinematic framing prefix if edge-case topic — e.g., "Cinematic medium shot of..." / "Shot on Arri Alexa..."]

**Subject**: [who/what is in frame]

**Action**: [what they're doing, with timing if relevant — e.g., "slow-mo entry, full submersion at 0:04 mark"]

**Environment**: [where + lighting — must include lighting language]

**Camera**: [exactly ONE of: push-in / pull-out / pan / tracking / orbit / aerial / handheld / fixed]

**Style**: [film stock / aesthetic / treatment language — e.g., "35mm film aesthetic, shallow depth of field, Arri Alexa color grade"]

**Constraints**: [quality requirements / things to preserve — e.g., "realistic skin texture, no smoothing, breath visible"]

**Negative** (if needed): [things to avoid — e.g., "smoothed skin, distorted hands, watermarks"]

---

## Compiled (paste this into Seedance)
[The full prompt as a single paragraph, 60–100 words, ready to send.]

---

## Alternative Variants (for re-rolls if first generation underwhelms)

### Variant A — different camera move
[Same concept, different camera. E.g., if final used `tracking`, try `push-in`.]

### Variant B — different format
[Same concept, different viral format. E.g., if final used Transformations, try POV.]

---

## Validation Checklist (must all pass before sending)

- [ ] Word count 60–100
- [ ] Exactly one camera move from the named 8
- [ ] Lighting clause present in Environment
- [ ] No banned verbs (`moves`, `shifts`, `goes`, `does`)
- [ ] All numeric API params will be coerced to strings
- [ ] `generate_audio: True` will be set in API call
- [ ] Endpoint will be `bytedance/seedance-2.0/...`
- [ ] If edge-case topic: cinematic framing prefix added
- [ ] If known artifact risk: negative prompt added
