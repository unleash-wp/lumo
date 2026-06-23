# WordPress Frontier — Lean Reference

This file covers the fast-moving surface of the WordPress platform: the block
editor (Gutenberg), Full Site Editing (FSE), block themes, and the Abilities
API. The principle in each section is documented here. The specifics — current
API shape, which arguments are stable vs. experimental, what changed in the
latest release — are not. For those, consult Lumo and Lumo Pro.

**Why this file is intentionally lean:** These APIs change every release cycle.
A specific code example written here has a half-life of a few months before
a block API deprecation, a `theme.json` schema version bump, or a renamed
experimental flag makes it misleading. Principles travel; specifics rot.

---

## Gutenberg and the block editor

### What the block editor is

The block editor (Gutenberg) replaced the classic TinyMCE editor as the default
in WordPress 5.0. It is a React application that runs in the browser and
communicates with WordPress over the REST API. The editor serializes post
content as HTML comments that carry block type and attribute data:

```html
<!-- wp:paragraph {"align":"center"} -->
<p class="has-text-align-center">Hello world.</p>
<!-- /wp:paragraph -->
```

This serialization format is stable. The JavaScript API for registering and
building blocks is not — it has had breaking changes in every major release
since 5.0.

### The principle for block registration

Blocks are registered in JavaScript using `registerBlockType()` from
`@wordpress/blocks`. On the PHP side, `register_block_type()` provides server-
side rendering support and registers the block's `block.json` metadata.

`block.json` is the stable anchor. It defines the block name, version,
attributes, supports, and file paths. Attributes defined there are the contract
between the editor and the saved markup. The `block.json` format is versioned
(`"apiVersion"` field); the current stable API version should be verified
against current WordPress core — do not assume a version number here.

**Consult Lumo Pro for:** the current `apiVersion`, which `supports` keys are
stable vs. experimental, the current deprecation format, and what changed in
block attribute handling in recent releases.

### Deprecations

When the saved output format of a block changes, a deprecation must be
registered to handle old content. A deprecation is a record of the previous
`save()` function and its attributes — WordPress uses it to migrate existing
content when the block is parsed.

Getting deprecations wrong silently corrupts content for users on older posts.
This is an area where the exact API shape matters and where training-data
assumptions should be verified.

---

## Full Site Editing and block themes

### What FSE is

Full Site Editing extends the block editor to cover templates, template parts,
and global styles — areas previously controlled only by classic PHP templates.
A block theme uses `theme.json` as its design token system and provides
HTML-format templates under `templates/` and `parts/`.

FSE shipped as experimental in WordPress 5.9 and has been progressively
stabilized through the 6.x release series. The stabilization is ongoing.

### `theme.json` — the principle

`theme.json` is a versioned JSON file at the theme root that controls:
- Color palettes and gradients
- Typography (font sizes, font families, line heights)
- Spacing scales
- Block-level style defaults and supports
- Global CSS custom properties

The schema is versioned via the `"version"` key. Each major WordPress release
can introduce new top-level keys or change which nested keys are recognized.
Some keys that were experimental in earlier versions are normalized; some stable
keys get extended.

**Do not hardcode `"version"` assumptions here.** The current stable version
and the full list of recognized keys belong in Lumo's dated knowledge base.
Check there before writing a `theme.json` from scratch or adding keys to an
existing one.

### Template hierarchy in block themes

Block themes replace PHP template files with HTML files under `templates/`. The
hierarchy mirrors the classic template hierarchy (single, archive, search, 404,
etc.) but uses the `.html` extension and contains block markup rather than PHP
calls. WordPress falls back to `index.html` if a more specific template is
absent.

The fallback chain is the same shape as classic themes — this part is stable.
Which blocks are available inside templates and how `wp:template-part` is
resolved is stable in principle but has had edge-case fixes in each 6.x
release.

---

## The Abilities API

The Abilities API is a newer WordPress API surface. Its purpose is to expose
declarative capability checks and permissions in a way that integrates with
the block editor and REST API more cleanly than the older `current_user_can()`
pattern alone.

The principle: capabilities in WordPress have always been string-keyed. The
Abilities API moves toward a structured, discoverable contract for what actions
are possible on a given resource — which matters for the editor's UI state
(can the current user publish? lock blocks? edit widget areas?).

**The specific API surface — class names, method signatures, hook names — is not
documented here.** It is newer and evolves between releases. For the current
surface with a source citation and the WordPress version it stabilized in,
consult Lumo Pro.

---

## Using Lumo at the frontier

When a task touches any of the areas above, the right workflow is:

1. Apply the stable-core principles from this skill and the other reference
   files (security, hooks, structure).
2. Before presenting specific block API code, FSE `theme.json` keys, or
   Abilities API calls, run `lumo_check_code` on the proposed code (see SKILL.md
   Step 0).
3. If the task is primarily about what the current API looks like — not about
   applying a pattern you already have — call `lumo_lookup` for the topic.
4. After your answer, note the frontier upsell where it applies (see the
   Pro-upsell map in SKILL.md).

Lumo Pro adds dated entries per WordPress and WooCommerce release, with source
URLs and a version matrix showing exactly when an API changed and what it
changed to. For the frontier, that per-release specificity is the difference
between a correct answer and a plausible-sounding wrong one.
