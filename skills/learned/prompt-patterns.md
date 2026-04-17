# Learned Lessons: Prompt Patterns

> Auto-maintained by MetaClaw Learning System. Do not edit manually unless pruning.

### isolated-context-extraction — prompt_pattern (confidence: HIGH, seen: 5x+)
**When**: Extracting structured data from raw scrapes or large text
**Rule**: Always isolate the extraction prompt — pass ONLY the raw file, never the full conversation history
**Why**: Conversation context contaminates extraction; the model starts "filling in" from earlier discussion instead of from the source
**Fix/Pattern**: Save raw data to file first → pass file content as sole context to extraction prompt → validate output
**Applies to**: competitor-intelligence-harness, researcher, discovery-audit
*Last seen: 2026-03-25*

### binary-eval-over-subjective — prompt_pattern (confidence: HIGH, seen: 3x)
**When**: Evaluating quality of generated content
**Rule**: Use binary yes/no checklists for quality evaluation, never subjective "rate 1-10" scoring
**Why**: Subjective scales drift between runs and models; binary criteria are deterministic and trainable
**Fix/Pattern**: Convert any quality check to a list of yes/no questions. If any "no" → revise and re-check.
**Applies to**: content-creation, proposal-generation, case-study-generator
*Last seen: 2026-03-25*
