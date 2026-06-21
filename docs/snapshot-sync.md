# Snapshot Sync — Maintainer Procedure

`data/snapshot.json` is the Free agent's knowledge base. This document describes how to regenerate it from the Pro snapshot generator (R4-9) when HPOS content changes.

The stub script `scripts/sync-snapshot.mjs` reserves the path and encodes this procedure as comments, but refuses to run until R4-9 is available. Use it as the authoritative reference for the wiring needed.

---

## When to regenerate

Regenerate `data/snapshot.json` whenever the HPOS knowledge base in `lumo-pro` changes — specifically on the changelog cadence when the Pro generator emits a new snapshot projection. The Free HPOS core is deliberately low-churn; most weeks nothing changes.

The signal: the Pro generator R4-9 produces a new snapshot output. That output is the input to this procedure.

---

## Manual procedure (until R4-9 is wired)

1. **Run the Pro snapshot generator (R4-9)** in `lumo-pro` to produce a fresh Free-projection snapshot. The generator emits a JSON file in the same shape as the current `data/snapshot.json` — `schemaVersion`, `generatedAt`, `source`, `entries[]`.

2. **Verify the Free projection contract** (see "Contract" below) before replacing the file. The generator should enforce this automatically, but the maintainer verifies before committing.

3. **Replace `data/snapshot.json`** with the new file.

4. **Run the full test suite** in `lumo`:
   ```
   npm run typecheck && npm test
   ```
   All 256 tests must stay green. If any snapshot-driven test fails, the new snapshot violates the contract — do not commit.

5. **Commit** with a message describing the content change (e.g., "update HPOS snapshot: woo 8.3 breaking-change note"). Do not reference internal plan or ticket IDs in the commit message.

---

## Contract

The following invariants must hold after every sync. The generator is expected to enforce them; the maintainer verifies before shipping.

**1. Free fields are preserved byte-stable unless the Pro summary genuinely changed.**

The Free render reads these fields from each entry:
- `summary`
- `code_example`
- `bad_pattern`
- `source_url`
- `test_step`
- `versions[0].woo_version_min` → rendered as "Affected: WooCommerce ≥ {woo_version_min}"

If none of these changed on the Pro side, the rendered Free output must be byte-identical to the previous version. A sync that changes only `generatedAt` must not alter the rendered Free Markdown for any entry.

**2. `generatedAt` advances.**

The envelope field `generatedAt` must be a newer ISO 8601 UTC timestamp than the previous file. Per-entry `updatedAt` advances only when that entry's content changed.

**3. `body` is never written into the snapshot.**

`body` is a Pro-only field. The generator emits the Free projection — `body` must not appear in `data/snapshot.json` under any entry. `src/lib/render.ts` hard-guards against reading `body`, but the snapshot must not carry it either.

**4. `schemaVersion` stays at `1`.**

The snapshot loader at `src/lib/snapshot.ts:85` rejects any file whose `schemaVersion` does not match the expected value. Do not increment this field without a corresponding loader update and full test pass.

**5. Slug stability.**

Existing entry slugs must not be renamed without a corresponding update to any tests or commands that reference them by slug. Slug changes are breaking changes for any cached state keyed on slug.

---

## Blocked on R4-9

The live regeneration script (`scripts/sync-snapshot.mjs`) is a stub until the Pro snapshot generator (R4-9) is built and its output shape is confirmed. When R4-9 lands, replace the stub with a real implementation that:

- Calls the R4-9 generator (or reads its output file)
- Applies the contract checks above programmatically
- Writes the verified snapshot to `data/snapshot.json`
- Exits non-zero if any contract check fails

Open a follow-up issue linking R4-9 to the stub→script swap before closing R4-9.
