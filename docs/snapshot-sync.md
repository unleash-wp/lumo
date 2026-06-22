# Snapshot Sync — Consumer Side

`data/snapshot.json` is the Free agent's knowledge base. It is **generated** in
the private `lumo-pro` repository — do not edit it by hand.

---

## Provenance

The generator in `lumo-pro` reads the Pro knowledge DB, projects every published
entry to the Free shape (no `body`, `tier: "free"`), and writes a deterministic
JSON artifact. A committed golden copy (`lumo-pro/src/snapshot/snapshot.golden.json`)
and a CI byte-parity guard ensure the generator output is always in sync with what
ships here.

---

## Update procedure

```sh
# In lumo-pro (on a content branch):
npm run snapshot:generate -- /tmp/new-snapshot.json
diff lumo-pro/src/snapshot/snapshot.golden.json /tmp/new-snapshot.json  # must be content-only
cp /tmp/new-snapshot.json lumo-pro/src/snapshot/snapshot.golden.json
git add lumo-pro/src/snapshot/snapshot.golden.json && git commit

# Copy the artifact here:
cp /tmp/new-snapshot.json data/snapshot.json

# Verify this repo:
npm run typecheck && npm test   # all tests must stay green

git add data/snapshot.json && git commit -m "update snapshot: <reason>"
```

Full generator-side documentation: `lumo-pro/docs/snapshot-sync.md`.

---

## SCHEMA_VERSION bump protocol

`schemaVersion` is currently `1`. Bump it only when the snapshot shape changes in
a way the loader (`src/lib/snapshot.ts`) cannot accept without modification. A new
optional field does not require a bump; a removed or renamed field does.

When bumping:

1. Update `schemaVersion` in the lumo-pro generator.
2. Update the loader in `src/lib/snapshot.ts` to handle the new version.
3. Update `tests/snapshot.test.ts` if it pins the version value.
4. Follow the update procedure above.

Ship the loader change before shipping the new artifact — the loader rejects an
unknown version and the agent will fail to start if the order is reversed.

---

## Contract

Every update must satisfy these invariants (enforced by `tests/snapshot.test.ts`):

- Exactly the documented number of entries, each with the 4 expected slugs.
- No `body` key on any entry.
- `tier: "free"` on every entry.
- `schemaVersion: 1` (until explicitly bumped with a coordinated loader change).
- `generatedAt` equals `max(updatedAt)` across all entries.
- Field order per entry: `slug, title, category_slug, summary, code_example,
  bad_pattern, source_url, test_step, tier, updatedAt, versions`.

If any test fails after copying the new artifact, do not commit — the generator
output violates the contract and the bug must be fixed in lumo-pro.

---

## What sync-snapshot.mjs does

`scripts/sync-snapshot.mjs` prints the update procedure above and exits 0. It is
a pointer, not an automation — the actual generation happens in lumo-pro.
