# Plugin System Architecture Report
**Date:** March 2, 2026 | **Source:** claudekit-engineer `.claude/` structure analysis

## Executive Summary

Claude Engineer uses a **skill-based architecture** that has evolved into a **plugin-compatible system**. Skills are NOT plugins, but the infrastructure supports exporting skills as plugins through `.claude-plugin/` manifests. The "ck:" prefix is a **naming convention** for skill activation, not a plugin registration mechanism.

## Directory Structure

```
.claude/
├── agents/              # Task-specific agents (16 files, no plugins)
├── commands/            # Slash commands (minimal - only .DS_Store)
├── command-archive/     # Archived commands (preserved for reference)
├── hooks/               # Session/subagent hooks (24 files)
├── skills/              # 79 domain-specific skills
│   ├── .venv/          # Python dependencies (isolated)
│   ├── plan/
│   │   └── SKILL.md    # FRONTMATTER with "name: ck:plan"
│   ├── cook/
│   │   └── SKILL.md    # FRONTMATTER with "name: ck:cook"
│   ├── skill-creator/
│   │   └── references/
│   │       ├── plugin-marketplace-overview.md
│   │       ├── plugin-marketplace-schema.md
│   │       └── plugin-marketplace-*
│   └── 76 other skills
├── rules/               # Development workflows (dev-rules, primary-workflow, etc.)
├── schemas/             # JSON schema definitions
├── scripts/             # 21 utility scripts
├── output-styles/       # 6 coding level output styles
├── .ck.json            # Configuration with plan naming, hooks, trust settings
├── .env                # Environment variables
├── settings.json       # Runtime settings (hooks, statusLine)
├── metadata.json       # Package metadata (version, build date, deletions list)
└── statusline.cjs      # Terminal status line generator
```

## Plugin System Architecture

### Registration Mechanism: "ck:" Prefix Pattern

Skills are **activated by naming convention**, not configuration files. The "ck:" prefix indicates a skill is:
- Auto-discoverable
- Directly invokable via slash commands
- Requires no manual registration

**Examples:**
- `name: ck:plan` → `/ck:plan [task]`
- `name: ck:cook` → `/ck:cook [task]`
- `name: ck:debug` → `/ck:debug [issue]`

### Skill Structure (YAML Frontmatter)

Every skill MUST include FRONTMATTER in `SKILL.md`:

```yaml
---
name: ck:plan                          # Skill activation name (ck: prefix)
description: "Brief capability..."      # <200 chars for auto-activation
argument-hint: "[arg] OR option"        # User-facing hint
metadata:
  author: claudekit
  version: "1.0.0"
license: MIT
---

# Skill Content (Markdown)
Instructions follow YAML frontmatter...
```

**Key fields:**
- `name` — Must start with `ck:` for core skills
- `description` — Used by Claude to auto-activate relevant skills
- `metadata.version` — Tracked for updates
- `license` — Required for distribution

### Skill Anatomy

```
skill-name/
├── SKILL.md              # Required: <150 lines, includes frontmatter
├── scripts/              # Optional: executable code (.sh, .cjs, .py)
│   ├── main.cjs         # Node.js scripts
│   ├── validate.sh      # Bash scripts
│   └── processor.py     # Python scripts (.venv available)
├── references/           # Optional: docs loaded as-needed
│   ├── workflow-modes.md
│   ├── edge-cases.md
│   └── [...detailed docs]
└── assets/               # Optional: outputs or templates
```

**Sizing:** Keeps SKILL.md <150 lines; detailed docs in `references/` loaded only when needed.

## Plugin Marketplace System

Skills can be **packaged as plugins** for distribution via marketplaces. NO marketplace is currently configured in Claude Engineer; references exist for future use.

### Plugin Distribution Flow (Future-Ready)

1. **Create plugin structure:**
   ```
   marketplace/
   ├── .claude-plugin/
   │   └── marketplace.json        # Catalog
   └── plugins/
       └── review-plugin/
           ├── .claude-plugin/
           │   └── plugin.json     # Manifest
           └── skills/
               └── review/
                   └── SKILL.md
   ```

2. **User installation:**
   ```bash
   /plugin marketplace add ./my-plugins
   /plugin install review-plugin@my-plugins
   ```

3. **Validation:**
   ```bash
   /plugin validate .
   claude plugin validate .
   ```

### Marketplace Configuration Schema

**marketplace.json (required fields):**
```json
{
  "name": "my-plugins",                    # Kebab-case, no spaces
  "owner": { "name": "Your Name" },
  "plugins": [
    {
      "name": "plugin-id",
      "source": "./plugins/plugin-id",    # Relative path
      "description": "..."
    }
  ]
}
```

**Optional metadata:**
- `metadata.description` — Marketplace description
- `metadata.version` — Marketplace version
- `metadata.pluginRoot` — Base dir for source paths

**Plugin entry fields:**
- `version` — Plugin version
- `author` — Author info
- `homepage` — Docs URL
- `repository` — Source code URL
- `license` — SPDX ID (MIT, Apache-2.0, etc.)
- `keywords`, `tags` — Discovery/categorization
- `commands`, `agents`, `hooks` — Component overrides

**Reserved marketplace names (cannot use):**
- `claude-code-marketplace`
- `claude-code-plugins`
- `claude-plugins-official`
- `anthropic-plugins`
- `agent-teams`
- Names impersonating official marketplaces

## Configuration Files

### .ck.json (Global Configuration)
Defines plan structure, validation, hooks, gemini settings:
```json
{
  "codingLevel": -1,                    # User coding proficiency
  "statusline": "minimal",              # Terminal output level
  "privacyBlock": true,                 # Privacy hook enforcement
  "plan": {
    "namingFormat": "{date}-{issue}-{slug}",
    "dateFormat": "YYMMDD-HHmm",
    "reportsDir": "reports",
    "validation": { "mode": "prompt", "minQuestions": 3 }
  },
  "skills": {
    "research": { "useGemini": true }   # Research skill uses Gemini
  }
}
```

### settings.json (Runtime Settings)
Configures hooks and statusline:
```json
{
  "statusLine": {
    "type": "command",
    "command": "node .claude/statusline.cjs"
  },
  "hooks": {
    "SessionStart": [...],
    "SubagentStart": [...],
    "UserPromptSubmit": [...]
  }
}
```

### metadata.json (Package Info)
Tracks version, deletions, build date:
```json
{
  "version": "2.13.1-beta.2",
  "name": "claudekit-engineer",
  "description": "Boilerplate for professional software projects",
  "buildDate": "2026-02-26T16:20:56.927Z",
  "deletions": [
    "agents/copywriter.md",
    "skills/.shadowed/**",
    "command-archive/**"
  ]
}
```

## Agents System

Agents are **NOT plugins**. They're role-based subagents defined in markdown:

```
agents/
├── brainstormer.md
├── code-reviewer.md
├── debugger.md
├── fullstack-developer.md
├── planner.md
├── tester.md
└── 9 others
```

**Agent frontmatter:**
```yaml
---
name: debugger
description: "Investigation and analysis expertise..."
model: sonnet
memory: project
tools: Glob, Grep, Read, Edit, Bash...
---
```

**Usage:** Delegated via Task tool, NOT slash commands.

## Hooks System

Hooks automate context injection and reminders:

```
hooks/
├── session-init.cjs             # SessionStart: Setup on resume/startup
├── subagent-init.cjs            # SubagentStart: Per-subagent setup
├── dev-rules-reminder.cjs       # UserPromptSubmit: Dev rules reminder
├── privacy-block.cjs            # PreToolUse: Privacy enforcement
├── scout-block.cjs              # PreToolUse: Scout rate limiting
└── 19 others
```

**Hook config in settings.json:**
```json
{
  "hooks": {
    "SessionStart": [
      { "matcher": "startup|resume", "hooks": [...] }
    ],
    "UserPromptSubmit": [
      { "hooks": [...] }
    ],
    "PreToolUse": [
      { "matcher": "Bash|Glob|Grep", "hooks": [...] }
    ]
  }
}
```

## Key Findings

| Aspect | Status | Details |
|--------|--------|---------|
| **Plugin Manifests** | Not Used | `.claude-plugin/` dirs do NOT exist in engineer kit |
| **"ck:" Prefix** | Naming Convention | Indicates auto-discoverable skills, NOT plugin registration |
| **Skill Registration** | Auto-Discovery | Claude reads SKILL.md frontmatter to activate skills by description |
| **Plugin System** | Ready (Not Active) | Infrastructure documented in skill-creator skill; not yet deployed |
| **Config Files** | 3 Active | `.ck.json`, `settings.json`, `metadata.json` |
| **Hooks** | 24 Files | Session, subagent, tool use hooks for automation |
| **Agents** | 16 Files | Role-based subagents, delegated via Task tool |
| **Skills** | 79 Total | Domain-specific instructions with optional scripts/references |

## Implications for claudekit-marketing

**Status: Marketing kit should NOT implement plugin system yet**

### What TO Do:
1. ✓ Use "ck:" prefix for marketing-specific skills (e.g., `ck:brand-guidelines`)
2. ✓ Create SKILL.md with frontmatter + description for auto-activation
3. ✓ Organize skills with `scripts/`, `references/`, `assets/` subdirs
4. ✓ Use hooks for brand context injection (as currently done with `inject-brand-context.cjs`)
5. ✓ Define agents for marketing roles (e.g., copywriter, seo-specialist)

### What NOT To Do (Yet):
1. ✗ Don't create `.claude-plugin/plugin.json` manifests
2. ✗ Don't create marketplace.json (plugin distribution)
3. ✗ Don't hardcode values in skills—always read from user's docs/
4. ✗ Don't register skills in config files—use "ck:" prefix

### Brand Injection Pattern (Current Best Practice)

Keep existing approach:
```
User runs /ck:brand-guidelines
  ↓
inject-brand-context.cjs reads user's docs/brand-guidelines.md
  ↓
Context injected into prompt
  ↓
Skill activates with brand values
```

**This works without plugin system.**

## Comparison: Skills vs. Plugins

| Aspect | Skills | Plugins |
|--------|--------|---------|
| **Activation** | "ck:" prefix + auto-discovery | `/plugin install` + marketplace |
| **Registration** | Frontmatter in SKILL.md | `.claude-plugin/plugin.json` |
| **Distribution** | Git repository | Marketplace catalog |
| **Version Tracking** | metadata.version in frontmatter | Plugin marketplace versioning |
| **Use Case** | Internal reusable instructions | Third-party extensions |
| **Coupling** | Tight to kit repository | Loose; separate distribution |

## Scripts & Dependencies

All dependencies isolated in `.venv/`:
```bash
.claude/skills/.venv/bin/python3 scripts/xxx.py  # Use venv interpreter
```

Shared Python packages (google-genai, pypdf, etc.) installed via `install.sh`.

## Unresolved Questions

1. **Plugin Distribution Timeline:** When will Claude Engineer release plugins to official marketplace?
2. **Backward Compatibility:** Will "ck:" prefix remain after plugin system activates?
3. **Marketing Kit Distribution:** Should claudekit-marketing eventually become a plugin marketplace?

## References

- **Skill Creator Docs:** `.claude/skills/skill-creator/references/`
- **Plugin Marketplace Docs:** `.claude/skills/skill-creator/references/plugin-marketplace-*.md`
- **Official Docs:** https://code.claude.com/docs/en/plugins.md
- **Configuration:** `.claude/.ck.json` schema in `.claude/schemas/`
