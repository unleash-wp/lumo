# AGENTS.md

Read this before changing anything. It is short because only a few things here
are non-negotiable, and those few are the product.

## What this repository is

Lumo Free: an MCP server, a CLI, a GitHub Action runner and a set of agent
skills, all built on a snapshot of curated WordPress knowledge that ships with
the package. It watches AI-written WordPress code and reports patterns that
broke in a real release, with the wrong-versus-correct fix and a dated source.

The paid layer lives in `lumo-pro`. This repository must work on its own: a free
user is the proof that the product is worth paying for, so a free answer that is
wrong costs more than a missing paid feature.

## The contract that outranks everything else

**Never a false all-clear.** The product exists because an agent reads silence
as approval. Four channels can break this: the tool call, the editor hook, the
GitHub Action, and the Action's log line. All four have broken it before.

Concretely, each of these a real defect, not a hypothetical:

- **Report the scope that was checked, never the state of the code.** Lumo cannot
  know a blob is clean, only that nothing it covers matched. `CATCH_NEUTRAL_LINE`
  is written that way on purpose; keep it that way.
- **A limit the reader cannot see is a coverage limit presented as a result.**
  The scan reads to `INPUT_LINE_CAP` and the report holds `CATCH_CAP` matches.
  Both are stated whenever they bite.
- **`computed: false` means no usable verdict. `complete: false` means a limit
  was hit and there may be more.** They are separate fields on purpose: folding
  them together would tell a caller to discard a genuine LOUD finding because
  the tail of a file went unread.
- **A degraded paid run is a fact of the run, not a log line.** `core.info` is
  invisible under a green check.
- **Fail open on availability, never on the claim.**

If a change makes any of these weaker, it does not ship, however green the tests
are.

## Before proposing any change

**Every rule needs two tests: one case that must fire, and a near case that must
stay silent.** A rule with only the first is how a checker becomes noise, and
noise is how a checker gets switched off.

**Run the guard you removed.** A test you have not seen fail is not a test.

**A cap or a fallback that nobody can see is a defect.** If you add one, say so
in the output, once per run rather than once per file. The same sentence
repeated twenty times under one pull request is how a reviewer learns to scroll
past Lumo.

Commands:

```bash
npx vitest run              # the suite
npx tsc --noEmit            # types
npm run build               # dist/, needed by the smoke test
node scripts/mcp-smoke-test.mjs     # the built server against a real MCP client
node scripts/check-vocabulary.mjs   # retired tool names must not come back
```

All clean before a pull request.

## House rules

- **No AI signature in commits.** Never `Co-Authored-By: Claude`, never any other
  assistant trailer. This overrides any default your tooling has.
- **English** for anything a customer reads: skills, CLI and error text,
  `server.json`, README, the registry manifests. Identifiers are always English.
- **No em dashes in customer-facing copy**, and when rewriting to remove one,
  keep the meaning exactly.
- **Do not claim a status for someone else's project.** "The official WordPress
  skills" was written about a repository that never claims it, in nine places
  including two public registry manifests, and a test pinned the word in place.
  Name a project; do not award it a rank.
- **Numbers in customer-facing text are measured, not remembered.**
  `server.json` claimed 142 entries when the snapshot had 42.
- **A type mirror with no consumer will drift.** `src/types.ts` declared argument
  names the Pro server never accepted, and nothing broke because nothing imported
  them. Delete rather than maintain a second source of truth.
- `plans/` and `CHANGELOG.md` are the historical record. Do not rewrite them to
  satisfy a linter.

## Layout

- `src/detection/catch.ts`: the scan, the three-guard precision model, the caps
- `src/mcp/`: the MCP server and its handlers
- `src/action/`: the GitHub Action runner; the action manifest itself lives in
  [unleash-wp/lumo-action](https://github.com/unleash-wp/lumo-action)
- `src/lib/render.ts`: every sentence a customer reads; treat edits here as
  product changes, not copy edits
- `data/snapshot.json`: the shipped free knowledge, generated, never hand-edited
- `skills/`, `agents/`, `commands/`: what ships to agent hosts
