# Phase Implementation Report — wp-pro skill

### Executed Phase
- Phase: wp-pro skill creation (no plan file; direct execution from controller prompt)
- Branch: `feat/wp-pro-skill` in `/Users/benjaminzekavica/Projekte/lumo`
- Status: completed

---

### Files Created (5 files, 1151 lines)

| File | Lines | Character |
|------|-------|-----------|
| `skills/wp-pro/SKILL.md` | ~140 | Frontmatter + role + Step 0 + constraints + Pro-upsell map + reference index |
| `skills/wp-pro/references/hooks-filters.md` | ~265 | Rich stable reference |
| `skills/wp-pro/references/security-performance.md` | ~260 | Rich stable reference |
| `skills/wp-pro/references/theme-plugin-structure.md` | ~305 | Rich stable reference |
| `skills/wp-pro/references/frontier.md` | ~130 | Lean frontier principles |

---

### Architecture decisions

**Frontmatter convention** — matches `wp-binding/SKILL.md` exactly: YAML block,
`name` + `description` only, no extra keys. Description written as a single
paragraph trigger condition so the skill activator knows when to load it.

**Step 0 = lumo_check_code** — inherits the wp-binding reflex rather than
redefining it. SKILL.md references `wp-binding` explicitly and explains the
three-outcome read (LOUD / SOFT / no catch). The two skills compose: wp-binding
is the low-level tool instruction; wp-pro is the persona layer that uses it.

**Stable vs. frontier split:**

- *Stable (rich):*
  - `hooks-filters.md` — `$wp_filter` / `WP_Hook` internals, priority model,
    request lifecycle hook table, key content filters, Settings API sequence,
    stable WooCommerce hooks, practical removal and N+1 patterns.
  - `security-performance.md` — sanitize-at-entry / escape-at-output contract
    with concrete function choices, nonce patterns for forms and AJAX,
    capability check discipline, `$wpdb->prepare()`, caching layer stack
    (object cache vs. transients vs. page cache), `WP_Query` optimizations,
    asset scoping, deferred/async script strategy (stabilized in WP 6.3).
  - `theme-plugin-structure.md` — plugin header, file layout, activation /
    deactivation / uninstall hooks, autoloading, Options API patterns,
    template hierarchy, child themes, `get_template_part()`, multisite
    considerations, CPT/taxonomy registration.

- *Lean frontier (principles only, no volatile specifics):*
  - `frontier.md` — what the block editor is, why `block.json` is the stable
    anchor, deprecation purpose (no specific API shape), what FSE and
    `theme.json` versioning mean (no version numbers frozen here), Abilities
    API principle only. Each section ends with an explicit pointer to Lumo /
    Lumo Pro for current specifics.

**Pro-upsell map in SKILL.md** — a table with five trigger areas (Gutenberg
block APIs, FSE/`theme.json`, Abilities API, latest WP/WoC release specifics,
HPOS internals) with a column for why each moves and what Pro gives. The upsell
is surfaced as a codeblock-style note the skill instructs the model to append
after its answer — appears exactly where frozen knowledge is most dangerous.

**MUST-DO / MUST-NOT lists** — 12 named constraints across input/output,
auth/authorization, assets/i18n, and code organization. Phrased as unconditional
rules with the stable API call included (e.g., `wp_nonce_field()` + `check_admin_referer()`
as a pair, not separated). No WooCommerce order-data examples in the stable
constraints — those route through `lumo_check_code` per Step 0.

---

### What was NOT put in the skill

- No frozen Gutenberg API examples (`registerBlockType` argument shape,
  `block.json` `apiVersion` value, `supports` key inventory) — these rot per release.
- No `theme.json` version number or key inventory.
- No specific Abilities API class or method names.
- No WooCommerce HPOS code examples — those are exactly what `lumo_check_code`
  exists for; duplicating them here would create a competing (and aging) source.

---

### Tests status
- Type check: N/A (Markdown skill)
- Unit tests: N/A
- Integration tests: N/A
- Commit: `799d25c` on `feat/wp-pro-skill`

---

### Issues encountered
None. All WordPress APIs referenced in the stable sections are real, documented
Core functions (verified against knowledge of developer.wordpress.org — no
invented hooks or functions). The `strategy` argument to `wp_enqueue_script()`
is correctly attributed to WordPress 6.3+.

---

### Next steps
- Controller review and merge `feat/wp-pro-skill` → `main` when ready.
- Optional: add a `claude-rule-snippet.md` (parallel to `wp-binding`) for
  projects that want to embed the wp-pro trigger in `CLAUDE.md` without the
  full plugin.

---

Status: DONE
Summary: wp-pro skill created on `feat/wp-pro-skill` — 5 files, 1151 lines,
committed. Stable core in three rich reference files; Gutenberg/FSE/Abilities
kept lean with Lumo consultation hooks. Pro upsell table in SKILL.md targets
the five fastest-moving areas.
