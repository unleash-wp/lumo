# Lumo dogfood test — go-live candidate

English. For invited testers. Locked with the 2026-08-01 go-live candidate.

You are testing the **go-live candidate**, not a finished public checkout. Some paid
paths need an UnleashWP invite or license key. Free local works without an account.

**Honesty (read first):**

- Quiet ≠ clean. A quiet Free scan means “nothing in the Free snapshot matched,” not “this file is safe.”
- Free is a **local trial** only. Free never receives hosted MCP bytes from `mcp.unleash-wp.com`.
- **AI Forge Hosted** may appear as an entitlement on Solo Hosted / Pro / Team 20. Do **not** expect a live Forge Hosted install in this round.
- Do **not** expect “Ready for WP 7.1.” The catalogue has WP 7.0 plus a first 7.1 wave only.

---

## What you are testing

| Surface | What ships in this candidate |
| --- | --- |
| **Lumo Free** | Local CLI + local MCP + Free snapshot. `demo`, `scan`, `check`. |
| **Starter (Agent Core)** | Zip: Currency Guard + Code Reviewer (files only). |
| **Agent Team (Pack)** | Zip: 6 agents + skills (files only; bundled patterns frozen at kit date). |
| **Solo Hosted / Pro / Team 20** | Hosted MCP + Vol.1 living lookups (when key + deploy are live). Pack included. |
| **CI Action** | Pro / Team 20 only. Unlicensed run stays green and must say the gate did not run. |

Public ladder: Free → Starter 39 € → Agent Team 99 € → Solo Hosted 149 € → Pro 199 € → Team 20 · 599 €.

---

## 1. Free (everyone — do this first, ~5 min)

No account. This is the honesty demo.

```bash
# Published npm today (demo + scan work on 0.4.1):
npx @unleashwp/lumo demo

# Go-live candidate from GitHub (includes whole-file `check`):
npx -y github:unleash-wp/lumo#release/v1.0.0-go-live demo
npx -y github:unleash-wp/lumo#release/v1.0.0-go-live check path/to/bad-file.php
npx -y github:unleash-wp/lumo#release/v1.0.0-go-live scan
```

**Expect:** LOUD findings with dated sources on the demo samples. On your own file, either findings or an honest scope line — never a false “all clear.”

**Local MCP (optional):**

```bash
npx -y -p github:unleash-wp/lumo#release/v1.0.0-go-live lumo-mcp
```

Point Cursor / Claude at that stdio command. Free depth only.

---

## 2. Starter / Agent Team (files — if you received a zip)

1. Unzip the Core or Pack archive UnleashWP sent you (or from the Lemon Squeezy portal when live).
2. Install per `INSTALL-CROSS-TOOL.md` inside the zip (Cursor rules / Claude agents / Codex).
3. Ask the agent to review a known-bad `block.json` (apiVersion 2) or HPOS-bad PHP.

**Expect:** A bundled-pattern finding, **or** an explicit “Lumo Pro MCP not connected” note. Files installed ≠ live catalogue depth.

**Hosted MCP with a Core/Pack-only key must fail closed (402).** That is correct.

---

## 3. Solo Hosted / Pro / Team 20 (only with a paid key)

If you do **not** have a key yet: stop here and reply “waiting for key.” Production may still be mid-deploy.

1. Open https://mcp.unleash-wp.com/connect (after UnleashWP confirms deploy).
2. Paste the MCP JSON into Cursor with your Lemon Squeezy license as Bearer.
3. Call `lumo_check_code` on HPOS-bad PHP → expect LOUD.
4. Call `lumo_lookup` with slug `book-test-philosophy` → expect a Vol.1 reference answer.
5. **Pro / Team 20 only:** add `unleash-wp/lumo-action@v1` to a PR workflow with `LUMO_LICENSE_KEY` → LOUD on bad PHP. Second run **without** secrets → green check + summary that the gate **did not run**.

Do **not** expect Forge Hosted to open in this round.

---

## How to get Core / Pack zips

**Preferred (when portal live):** Lemon Squeezy customer portal download for Starter / Agent Team. Solo Hosted / Pro / Team 20 buyers get the Pack zip included (no second charge).

**This dogfood round:** UnleashWP will attach the dated zips to the invite email if the portal is not live yet:

- `lumo-agent-core-2026-08-01.zip` (Starter)
- `lumo-agent-pack-2026-08-01.zip` (Agent Team / included with hosted)

---

## Feedback (keep it simple)

Reply to the invite email with:

1. Tier you tested (Free / Starter / Agent Team / Solo / Pro / Team 20)
2. What worked (one sentence + command or screenshot)
3. What confused you or looked wrong
4. Anything that felt like a false all-clear

Optional: open a GitHub issue on [unleash-wp/lumo](https://github.com/unleash-wp/lumo/issues) with title `dogfood: …` and the same four points.

Thank you — your notes drive the next fix pass, then code review.
