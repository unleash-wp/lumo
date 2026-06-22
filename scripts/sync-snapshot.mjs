#!/usr/bin/env node
/**
 * data/snapshot.json is generated in the private lumo-pro repository.
 *
 * To update it:
 *   1. In lumo-pro: npm run snapshot:generate -- /tmp/new-snapshot.json
 *   2. Review the diff against lumo-pro/src/snapshot/snapshot.golden.json.
 *   3. Copy the artifact here: cp /tmp/new-snapshot.json data/snapshot.json
 *   4. Run: npm run typecheck && npm test
 *   5. Commit the result.
 *
 * Full procedure: lumo-pro/docs/snapshot-sync.md
 */

console.log(
  'data/snapshot.json is generated in the private lumo-pro repo.\n' +
  'See lumo-pro/docs/snapshot-sync.md for the update procedure.',
);
process.exit(0);
