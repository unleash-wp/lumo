# Grounding contract — how Lumo avoids hallucinated verdicts

Lumo's product value is trust in version facts. A single invented "this broke
in 6.4" or a single false "looks clean" costs more than a hundred missed
nitpicks. This contract states the anti-hallucination rules once, and maps
each rule to the place in the product that enforces it — enforced meaning a
test or a code path, not a request politely made in a prompt.

## The contract

1. **Version facts come from the engine, never from a model's memory.**
   Model layers (review stage, skills, agents) may observe code; only the
   deterministic rule engine may date a break, and every LOUD verdict carries
   a source.
2. **Uncertainty is said out loud.** Every surface has an "I cannot verify
   this" form and is instructed to prefer it over a guess.
3. **A claim needs a quote.** Model output that references code must quote
   the code it references; a point that cannot quote its evidence is dropped,
   not softened.
4. **Failure announces itself.** A layer that did not run says so — it never
   returns something shaped like a clean verdict.
5. **Silence in doubt.** When a surface cannot meet rules 1-4, it says less,
   not more.

## Where each rule is enforced

| Surface | Enforcement |
|---|---|
| Rule engine (`classify`) | LOUD requires CERTAIN plus a version stamp, or the documented always-wrong route with a non-empty source URL; the renderer refuses to format a LOUD result without its anchor. |
| `lumo_check_code` (free MCP) | Structured verdict carries `computed`; `false` means the layer did not run and clients must decide nothing from the other fields. Bell, silence and degradation cases are pinned by tests. |
| `lumo scan --ci` (CI gate, Pro) | Runs only with a licence key; without one it prints DID NOT RUN and stays green. Every fail-open path prints the same explicit line, so a skipped gate is never presented as a clean result. Exit 1 only on LOUD. |
| GitHub Action review stage | The prompt hands engine findings over as the only established facts, forbids fresh version claims, requires a verbatim quote per point (no quote, no point), restricts knowledge to the visible diff, and licenses silence. The fences are pinned by copy-regression tests. |
| Skills (`wp-binding`, `wp-knowledge`) | Both degrade honestly without the MCP: they announce that the live layer is not connected and refuse to simulate a check or improvise WooCommerce version facts. |
| Lumo Pro agent team | Each agent verifies its Pro MCP tools are reachable before working and stops with "the review could not run" when they are not; findings without a tool-returned source are labeled heuristic suspicion, separated from sourced findings. |
| Knowledge pipeline | Nothing is published without the runnable verification sandbox passing (correct example exits 0, bad pattern exits 2); third-party model output never enters the knowledge base directly. |
| Release gate | Every rule ships with a bell/silence test pair, and the agent-facing eval set is executed in CI, not admired. |

## What this does not claim

These rules reduce hallucinated verdicts; they do not abolish hallucination
in general-purpose model output around the verdicts. That residual risk is
why every surface separates "the engine established this" from "a model
observed this", and why the engine alone decides exit codes.
