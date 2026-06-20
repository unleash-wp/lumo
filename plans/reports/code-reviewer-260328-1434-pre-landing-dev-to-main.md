# Pre-Landing Review: dev → main

**Date:** 2026-03-28
**Branch:** dev → main
**Commits reviewed:** last 15 (8336b79 back to 9bbe495)
**Code files diff:** ~99K lines across .js/.cjs/.mjs/.py/.sh

---

## Summary

Pre-Landing Review: **3 issues** (0 critical, 3 informational)

**0 critical issues found.**

---

## CRITICAL

None.

Prior security fixes already landed in this batch:
- `7993b10` fix(play): replaced `execSync` with `execFileSync` for GA4/GSC, replaced `curl+execSync` with `https` module for Stripe calls, added path traversal check in template-loader.cjs
- `d3976c7` fix(youtube-thumbnail): centralized `resolve_env` for API key, no hardcoded secrets

---

## INFORMATIONAL

### 1. `ffmpeg`/`ffprobe` commands use unquoted `${timestamp}` parameter
- `.claude/skills/video/scripts/optimize-for-platform.cjs:338`
  ```js
  const cmd = `ffmpeg -y -ss ${timestamp} -i "${inputPath}" -vframes 1 ...`
  ```
  `timestamp` arrives from CLI arg (`args[++i]`) with no format validation. A value like `00:00:01; rm -rf /` would execute. `inputPath` and `outputPath` are quoted but `timestamp` is not.
  - **Context:** This is a local developer CLI tool invoked by Claude agent, not web-facing. Risk is low in practice but inconsistent with the shell-injection fixes already applied in `metrics-bridge.cjs`.
  - **Fix:** Validate timestamp matches `/^\d{2}:\d{2}:\d{2}(\.\d+)?$/` before use, or switch to `execFileSync('ffmpeg', [...])` array form.

### 2. Statusline tests pipe JSON through `echo | execSync` with single-quote escaping
- `.claude/hooks/tests/` (statusline test files)
  ```js
  execSync(`echo '${minimalInput.replace(/'/g, "'\\''")}' | node .claude/statusline.cjs`, ...)
  ```
  The `replace` handles single quotes correctly for POSIX shells. However the pattern is fragile — JSON values containing `\n` or other shell-significant sequences could still behave unexpectedly on some shells. Inputs are hardcoded test fixtures so no real injection risk here, but the safer pattern is to pass JSON via `stdin` pipe directly (e.g., `{ input: minimalInput }` to `spawnSync`) instead of via `echo`.
  - **Impact:** Test reliability only, no security risk.

### 3. `analyze-video.cjs` / `extract-captions.cjs` pass `videoPath` from CLI into `execSync` template literal
- `.claude/skills/video/scripts/analyze-video.cjs` and `extract-captions.cjs`
  ```js
  `python "${AI_MULTIMODAL_SCRIPT}" --task analyze --files "${videoPath}" ...`
  ```
  `videoPath` is quoted but if it contains `"` or shell metacharacters the quoting breaks. The `prompt` field does `replace(/"/g, '\\"')` which partially mitigates for the prompt arg, but `videoPath` has no sanitization.
  - **Context:** Same as #1 — local CLI tool only.
  - **Fix:** Use `execFileSync('python', [script, '--task', 'analyze', '--files', videoPath, ...])` array form to avoid shell parsing entirely.

---

## Positive Observations

- Security fixes for the most dangerous patterns (Stripe key in `ps aux`, shell injection in GA4/GSC commands) were properly resolved before this PR.
- `youtube-thumbnail` API key now uses centralized `resolve_env` pattern consistently with the rest of the codebase.
- No `.env` files (only `.env.example`) committed.
- No hardcoded API keys/secrets found in production code paths.
- `telegram_notify.sh` correctly uses `jq -Rs .` to escape message content before curl.
- Test fixtures use clearly fake values (`test_key_123`, `wrong_key`).
- `subprocess.run` calls in Python scripts consistently use list-form args (not `shell=True`).

---

## Recommended Actions

1. (Optional, before merge) Validate `timestamp` format in `optimize-for-platform.cjs:336` — one-liner regex check eliminates the unquoted injection surface.
2. (Post-merge backlog) Migrate `analyze-video.cjs` and `extract-captions.cjs` to use `execFileSync` array form for `python` invocations, consistent with `metrics-bridge.cjs` pattern.
3. (Post-merge backlog) Refactor statusline tests to use `spawnSync` with piped stdin instead of `echo | execSync`.

---

## Unresolved Questions

None.
