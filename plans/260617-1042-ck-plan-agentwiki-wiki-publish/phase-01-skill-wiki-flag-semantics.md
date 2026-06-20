---
phase: 1
title: Skill Wiki Flag Semantics
status: completed
priority: P2
effort: 45m
---

# Phase 1: Skill Wiki Flag Semantics

## Overview

Document `--wiki` as a composable `ck:plan` output flag that publishes the
final plan artifact to AgentWiki when a CLI or MCP surface is available.

## Implementation Steps

1. Update `claude/skills/ck-plan/SKILL.md` frontmatter description, keywords,
   and argument hint to include `--wiki`.
2. Add `--wiki` to composable flags with clear behavior.
3. Add an AgentWiki publish mode section:
   - CLI detection with `command -v agentwiki` and `agentwiki whoami`.
   - Markdown command path using `agentwiki doc upload` or `doc create`, then
     `doc publish` or `doc share`.
   - HTML command path using `agentwiki sites upload`.
   - MCP fallback when AgentWiki document/upload/site tools are exposed.
4. Add privacy and failure rules: redact secrets/local-only paths, publish only
   reviewed artifacts, and skip without failing when unavailable.
5. Update relevant `ck-plan/references/*.md` files so output requirements and
   organization rules mention wiki URLs.

## Success Criteria

- [ ] `--wiki` is discoverable from skill metadata.
- [ ] The behavior is precise enough to execute from CLI help.
- [ ] The behavior composes with `--html` and `--github`.
- [ ] Security constraints prevent accidental secret/path publication.
