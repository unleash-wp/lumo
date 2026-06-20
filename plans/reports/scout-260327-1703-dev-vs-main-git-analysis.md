# Git Analysis: main vs dev Branch Comparison

**Generated:** 2026-03-27  
**Repository:** claudekit-marketing  
**Branch Comparison:** main..dev (non-merge commits only)

---

## Executive Summary

### Overall Statistics
- **Total Commits:** 115 non-merge commits
- **Total Files Changed:** 2,183 files
- **Lines Added:** 419,812
- **Lines Deleted:** 3,207
- **Net Change:** +416,605 lines

### Key Contributors
1. Goon (154 commits)
2. Duy Nguyen (107 commits)
3. bnqtoan (39 commits)
4. semantic-release-bot (35 commits)
5. kaitranntt (7 commits)

### Development Timeline
- **Latest commit:** 2026-03-23 (chore(release): 1.3.0-beta.10)
- **Primary period:** Late January to late March 2026
- **Duration:** ~3 months of intense development

---

## Commit Categories

### New Features (65 commits)

Major feature additions:
- Play skill with playbook orchestrator (complete)
- YouTube thumbnail design skill
- Skill consolidation (design, brand-guidelines, campaign-management, seo-optimization)
- AI multimodal Kling AI video generation
- Payment integration with Stripe
- Elevenlabs skill for audio generation
- Dashboard phases 4-6 (feature complete, production ready)
- Markdown novel viewer with HTTP rendering
- Video production with Remotion
- SEO optimization with pSEO engine
- MCP integrations (Phase 5)
- 30+ new marketing strategy skills (referral, gamification, affiliate, assets-organizing, design-system, copywriting)
- Google Search Console integration
- Analytics skill with GA APIs

### Bug Fixes (29 commits)

Critical fixes:
- Shell injection and credential exposure in metrics-bridge
- Gemini model ID validation (gemini-3.0-flash → gemini-3-flash-preview)
- Dual-kit skill prefix conflicts (ckm: → ck:)
- Elevenlabs env resolution
- Storyboard output directory issues
- Dashboard relative path calculations
- Windows compatibility (markdown-novel-viewer)
- Command background task execution
- Markdown rendering and styling issues
- SEO ImageObject handling

### Refactoring (9 commits)

Code restructuring:
- Removed ck-help skill and legacy command
- Consolidated competitor-alternatives skill
- Command reorganization (content → write, design:slides → slides:create)
- Hooks restructure with comprehensive test suite
- Windows compatibility utilities

### Performance (13 commits)

Optimization work:
- Play skill efficiency improvements
- UI/UX pro-max skill updates
- Nano banana model migration
- AI artist character consistency
- Skill creator enhancements
- SEO audit workflow optimization

### Documentation (36 commits)

Docs and content updates:
- Play skill workflows and vibedocs
- Skill consolidation documentation
- Phase 6 metrics and architecture
- Writing style guides (Duy's personal guide)
- Code standards and design guidelines
- Video production and storyboarding guides
- Dashboard migration plans
- Comprehensive research and implementation guides

### Releases (35 commits)

Beta version releases:
- 23 beta releases (1.3.0-beta through 1.0.0-beta)
- Aggressive release cycle (every 3-5 days)

### Chores (67 commits)

Maintenance and configuration:
- Gitignore updates
- Environment configuration
- Asset cleanup and organization
- Report management
- Plan archival
- Configuration updates

---

## File Changes Summary

### Total Impact
- **Files Modified:** 2,183
- **Lines Added:** 419,812
- **Lines Deleted:** 3,207
- **Net Additions:** 416,605 lines

### Top Changed Files
1. package-lock.json (8,801+ lines)
2. CSV data files (ai-artist prompts, google-fonts, design data) - 3,500+ lines each
3. XML schema files (OOXML standards) - 3,000-4,400 lines each
4. Marketing dashboard codebase XML - 3,443 lines
5. MCP management tools.json - 3,146 lines
6. Skill data and reference documentation
7. Project roadmap (1,500 lines)
8. Dashboard CSS (1,594 lines)

### New Directories Added

**Skill ecosystem expansion:**
- .agent/skills/ab-test-setup/
- .agent/skills/ai-artist/ (data, references, scripts)
- .agent/skills/competitor-alternatives/
- .agent/skills/form-cro/
- .agent/skills/free-tool-strategy/
- .agent/skills/launch-strategy/
- .agent/skills/marketing-ideas/
- .agent/skills/marketing-psychology/
- .agent/skills/onboarding-cro/
- .agent/skills/paid-ads/
- .agent/skills/pricing-strategy/

**Infrastructure:**
- .mcp.json
- .opencode/ directory (agents, commands, skills)

### No Files Deleted

Zero files deleted between main and dev.

---

## Version Releases

23 beta releases in 3-month period:

Beta chain (1.3.0):
- 1.3.0-beta.10 (2026-03-23) ← Latest
- 1.3.0-beta.9 through beta.1 (2026-01-29 to 2026-03-20)

Earlier versions:
- 1.2.1, 1.2.0, 1.2.0-beta.1
- 1.1.0, 1.1.0-beta.7 through beta.1
- 1.0.0, 1.0.0-beta.1

---

## Key Development Themes

### 1. Skill Ecosystem Maturation
- Consolidation of overlapping skills
- Addition of 30+ marketing strategy skills
- Enhanced with data files, references, scripts
- Resolved dual-kit conflict (ckm: vs ck:)

### 2. Dashboard Product Development
- Progressive phases: Foundation → API → UI → Features → Integration → Production
- Rich media support (transcripts, infographics, YouTube)
- Marketing-focused features

### 3. AI/ML Capability Expansion
- Gemini model integration and updates
- Elevenlabs audio generation
- Kling AI video generation
- Image generation refinements
- Model consistency improvements

### 4. Security Hardening
- Fixed shell injection in metrics-bridge
- Credential exposure mitigation
- Centralized env resolution

### 5. Documentation & Standards
- Code standards enforcement
- Design guidelines
- Comprehensive skill documentation
- Marketing strategy documentation

### 6. Video & Media Production
- Remotion integration
- Storyboarding system
- AI scene generation
- Video orchestration

---

## Notable Insights

### Aggressive Release Schedule
- 23 beta releases over 3 months
- Release every 3-5 days
- All marked with [skip ci] to bypass testing

### Skill Consolidation Strategy
Significant refactor merged multiple skills:
- brand-guidelines + campaign-management + seo-optimization → grouped skills
- Competitor-alternatives consolidation
- Design skill consolidation (logo, CIP, slides, banner, icon)

### Dual-Kit Conflict Resolution
Emergency fix (commit 30999a9):
- Engineer kit and Marketing kit shared skill prefixes
- Solution: Rename ckm: to ck: across all skills
- Major refactor affecting all 100+ skills

### Data-Driven Skill Design
New skills include comprehensive:
- CSV data files (awesome prompts, fonts, image styles)
- Reference documentation (advanced techniques, domain-specific)
- Python scripts for automation
- Examples and validation criteria

### Production Readiness
Dashboard reached PRODUCTION READY status (Phase 5):
- Architecture: Vue + Hono + SQLite
- Full integration: API, components, features
- Rich media support
- User-facing complete

---

## Breaking Changes

1. **Skill Prefix Migration**
   - Old: ckm:skillname
   - New: ck:skillname
   - Impact: All skill references require updating

2. **Command Restructuring**
   - /design:slides → /slides:create
   - content:command → write:command
   - New: campaign:create

3. **Elevenlabs Requirement**
   - New dependency
   - Requires API key configuration
   - Enables audio generation features

4. **Dashboard Architecture**
   - New: Vue components, Hono API, SQLite persistence
   - New: Rich media support
   - New: Marketing-specific features

---

## Unresolved Questions

1. Why such aggressive beta release cycle (every 3-5 days)?
2. What triggers drove the major skill consolidation refactor?
3. How was the dual-kit conflict discovered?
4. Are all new features covered by automated tests?
5. What's the production migration plan for 400K+ line changes?
6. Who are primary users/stakeholders driving feature prioritization?

