# AI-Powered Ad Creative Generation — Research Report
Date: 2026-02-22 | Researcher subagent

---

## 1. Platform Ad Specs (2026)

### Google Ads
- **Display (Responsive)**: Upload headlines, logos, images, descriptions → Google auto-generates variations. Key static sizes: 300×250, 728×90, 160×600, 320×50, 468×60
- **YouTube video**: 16:9, min 1280×720, .MP4/.MOV; Skippable 6s–3min, non-skippable 15–20s, Bumper 6s max
- **Demand Gen**: Images 1200×628 (landscape), 1200×1200 (square), 1080×1920 (portrait); Videos same YouTube specs

### Meta / Facebook
- **Feed image**: 1080×1080 (1:1) or 1080×1350 (4:5); JPG/PNG; max 30MB; <20% text
- **Feed video**: min 1080×1080; 1s–241min; max 4GB; H.264/.MP4
- **Stories/Reels**: 1080×1920 (9:16); video 1s–60s; leave 250px top/bottom safe zone

### LinkedIn
- **Sponsored image**: 1200×628 (landscape) or 1200×1200 (square); JPG/PNG; max 5MB
- **Video ads**: 16:9 or 1:1; 3s–30min; 75KB–200MB; H.264

### TikTok In-Feed
- **Video**: 9:16 preferred (1:1 and 16:9 also work); min 540×960, recommended 720×1280+; max 500MB; 5–60s (21–34s optimal)
- **Aspect ratio**: Always shoot 9:16 native for best performance

---

## 2. AI Image Generation for Ads

### Tools
- **Gemini / Imagen (Google)**: Native to Performance Max, asset library, Product Studio. "Nanobanana" model trained for ad-safe formatting. Gemini 2.5 Flash Image supports character consistency, blending multiple images, targeted transformations
- **Midjourney / DALL-E 3**: Better for artistic/lifestyle creatives
- **AdCreative.ai**: End-to-end ad image generation with CTR optimization scores
- **Canva AI**: Quick branded variations, template-based

### Prompt Patterns for Ad Creatives
```
Product shot: "Studio photo of [product] on [surface], soft shadow, white background,
  commercial photography style, 4K"

Lifestyle: "Young professional woman using [product] in modern home office,
  natural light, warm tones, candid moment, 4K"

Brand-consistent: "...in [brand colors], [brand style adjectives],
  [consistent seed number for variations]"
```

### Brand Consistency Tricks
- Define a "style prompt" once: `"dark academia, film noir, deep shadows, muted emerald"` — apply to all
- Re-use seed number + original prompt for cohesive campaign variations
- Upload brand color hex + logo reference images for color-accurate outputs

### Resolution Requirements
- Minimum 1080px on shortest side for all platforms
- Export PNG for static (transparency support), JPG for backgrounds (smaller file)
- Generate at 2× intended size, downscale for sharpness

---

## 3. AI Video Generation for Ads

### Tools
- **HeyGen**: AI avatars for UGC-style talking-head ads, instant delivery, ~$29/mo
- **Arcads.ai**: Scripted UGC avatar ads at scale
- **Mintly / InVideo AI**: TikTok-style UGC videos
- **Runway ML / Kling AI**: Product demo video generation
- **Veed.io**: Script → video with AI voiceover

### Format Recommendations by Length
| Length | Use Case | Platform |
|--------|----------|----------|
| 6s     | Bumper/Brand recall | YouTube, Display |
| 15s    | Awareness, product intro | All platforms |
| 21–34s | Performance/UGC (TikTok sweet spot) | TikTok, Reels |
| 30–60s | Demo, testimonial | YouTube, Facebook |

### Hook Strategies (First 3 Seconds)
- **Problem hook**: "Struggling with [pain point]? Here's how..."
- **Curiosity hook**: "You won't believe what [product] does..."
- **Social proof hook**: "10,000 customers can't be wrong..."
- **Visual pattern break**: Unexpected motion, bold text, color contrast in frame 1
- **Direct address**: Look directly at camera, call out target audience ("Hey founders...")

### UGC-Style Video Patterns
- Shaky cam / casual framing (authenticity signal)
- Before/after reveal
- Talking head with on-screen text callouts
- Voiceover + screen recording (SaaS demos)

---

## 4. Creative Testing Framework

### Meta's 5×5×5 Matrix
- **Concepts** (5): Core value props / angles
- **Actors** (5): Different AI personas / faces
- **Hooks** (5): Unique opening lines
- = 125 weekly variations; let algorithm find winners

### Testing Hierarchy
1. **Hook first** — same body, 3 different openers; measure 3-second hold rate
2. **Format second** — static vs video vs carousel for same offer
3. **Creative angle third** — benefit, social proof, fear, urgency

### Key Metrics to Track
- 3-second video hold rate (>30% = good hook)
- Watch-through rate
- CTR (benchmark: 1-3% Meta, 0.5-1.5% LinkedIn)
- ROAS / CPL for conversion validation

### Iteration Cycle
- Week 1-2: Launch 5+ variations per ad set
- Week 2: Kill <median CTR, scale >1.5× median
- Week 4: New concept batch based on winner patterns
- Refresh every 4-6 weeks (ad fatigue)

### Winning Patterns (2025-2026 data)
- Native/UGC-style outperforms polished in most verticals
- Vertical 9:16 outperforms 1:1 on mobile-first placements
- First-frame text overlay boosts hold rate 15-20%
- Real customer faces > stock/AI avatars for trust signals (unless brand-new product)

---

## 5. Tools Summary

| Tool | Best For | Pricing |
|------|----------|---------|
| AdCreative.ai | Bulk image ads + CTR score | $29+/mo |
| Pencil AI | Creative performance prediction + gen | $99+/mo |
| HeyGen | UGC avatar video | $29+/mo |
| Canva | Quick design iterations | $15/mo |
| Figma | Precise design system ad templates | $15/mo |
| Runway ML | Product video generation | $15+/mo |

---

## Unresolved Questions
- Imagen 3 / Gemini 2.5 Flash Image API pricing for bulk ad generation workflows?
- ClaudeKit integration target: generate → export → upload to ad platform directly, or just generate assets?
- Which platform should be prioritized first for ClaudeKit ad creative command (Meta vs Google)?
