# Google Ads Best Practices 2025–2026

**Date:** 2026-02-22 | **Scope:** Campaign setup, bidding, creative, tools

---

## 1. Campaign Types — When to Use What

| Type | Best For | Key Requirement |
|------|----------|-----------------|
| Search | High-intent, bottom-funnel | Keyword list + negative keywords |
| Display | Retargeting, brand awareness | Creative assets (image/responsive) |
| Video | YouTube brand reach | 15–30s skippable or 6s bumper |
| Performance Max | Full-funnel, e-com/lead gen | 30+ conversions/month, product feed |
| Demand Gen | Top-funnel social-style reach | Strong video/image creative |

---

## 2. Campaign Setup Best Practices

**Search:**
- Use Responsive Search Ads (RSA) — 15 headlines, 4 descriptions min
- Tight ad group theme (3–5 closely related keywords per group)
- Enable all relevant assets (sitelinks, callouts, structured snippets, images)
- Use Exact + Phrase match for control; Broad only with Smart Bidding + conversion data

**Performance Max (PMax):**
- Requires 30+ conversions/month to learn effectively (50+ ideal)
- Add campaign-level negative keywords (up to 10,000 in 2025)
- Provide diverse asset groups: multiple headlines, descriptions, images, logos, videos
- Video is mandatory — auto-generated video performs poorly; create intentional 15–30s assets
- Separate campaigns by product category or margin tier for better budget control
- Audience signals = seed data for Google AI (use Customer Match + remarketing lists)
- Learning period: 2–4 weeks; don't make major changes until 50 conversions accumulated

**Demand Gen:**
- Separate prospecting vs. remarketing campaigns
- Tailor creative per placement: short videos for Shorts, carousels for Discover/Gmail
- Launch with Maximize Conversions → switch to tCPA after 50+ conversions
- Allow 60–90 days to stabilize; it's brand-building, not direct response

---

## 3. Keyword Research & Strategy

- **Google Keyword Planner** — baseline search volume + forecasts (free)
- **SEMrush / SpyFu** — competitor keyword gaps + ad copy spying
- Match types: Lead gen = Exact/Phrase; e-com broad can work with tROAS
- Negative keywords: Review Search Terms report weekly; build shared negative lists
- In PMax: campaign negatives now supported (2025 feature) — critical to add immediately

---

## 4. Bidding Strategies

| Strategy | When to Use | Min Data |
|----------|-------------|----------|
| Maximize Clicks | New campaigns, no conversion data | None |
| Manual CPC + eCPC | Testing phase, low volume | None |
| Maximize Conversions | Have conversion tracking, scaling | 15–20 conv/mo |
| Target CPA | Stable lead gen, known CPL target | 30+ conv/mo |
| Target ROAS | E-com, conversion values assigned | 50+ conv/mo |
| Maximize Conv. Value | E-com with varied product values | 30+ conv/mo |

**Rules:**
- Don't set tCPA/tROAS below actual average — constrains reach severely
- Change budget and bidding targets separately (not simultaneously)
- Allow 4-week stabilization window after any bid strategy change

---

## 5. Quality Score Optimization

Three pillars: **Expected CTR + Ad Relevance + Landing Page Experience**

- Match keyword → ad copy → landing page (exact theme alignment)
- Mobile page load speed critical: 1-second delay = ~20% fewer conversions
- Write specific RSA headlines targeting search intent, not generic CTAs
- Assets (extensions) don't directly raise QS but lift CTR → improves Expected CTR component
- Aim for QS 7+ on core keywords; 9–10 unlocks lowest CPCs

---

## 6. Ad Assets (Extensions)

Must-haves for every Search campaign:
- **Sitelinks** — 4+ (sends users to specific pages)
- **Callouts** — 4+ (USPs: "Free Shipping", "24/7 Support")
- **Structured Snippets** — list products/services/features
- **Images** — proven CTR lift; 1200x628px and 1:1 square
- **Call assets** — for local/phone-driven businesses
- **Promotion assets** — for sale periods
- **Price assets** — for e-com with clear pricing

---

## 7. Conversion Tracking Setup

- Use **Google Tag (gtag.js)** or Google Tag Manager — never rely on imported GA4 goals alone for bidding
- Set up **Enhanced Conversions** (hash first-party data) — improves accuracy 10–20%
- Assign conversion values even for leads (avg deal size × close rate)
- Primary vs. secondary conversions: only primary drives bidding
- For e-com: implement dynamic remarketing tag with product IDs

---

## 8. Creative Specs (2025)

**Responsive Display Ads:**
- Images: 1200x628 (landscape), 1200x1200 (square), 600x314 (logo)
- Headlines: 5 (30 chars each), Descriptions: 5 (90 chars each)

**Video Ads:**
- Skippable In-Stream: 12s–3min (skip after 5s); 16:9
- Bumper: exactly 6s, non-skippable
- Shorts: vertical 9:16, 6–60s
- Demand Gen: 1:1, 4:5, 9:16, 16:9 all supported

**Image Ads (Demand Gen):**
- Landscape: 1200x628 | Square: 1200x1200 | Portrait: 960x1200
- Max 20% text overlay

---

## 9. Budget Management & Pacing

- Set daily budget = monthly target ÷ 30.4 (Google can overspend 2× daily, but stays within monthly)
- Use **Shared Budgets** for related campaigns with variable demand
- Monitor **Budget Lost IS** vs. **Rank Lost IS** to diagnose where to invest
- For PMax: budget needs room to explore — too-tight budgets stall learning
- Use Google Ads Scripts to alert on budget pacing anomalies (free automation)

---

## 10. Google Ads Scripts for Automation

High-value free scripts:
- **Budget Pacing** — alert when campaign over/underspends
- **Quality Score Tracker** — log QS changes in Google Sheets
- **Broken URLs** — scan destination URLs for 404s
- **Search Term Harvester** — auto-add converting terms as keywords
- Source: [Google Ads Developer Hub](https://developers.google.com/google-ads/scripts/docs/intro)

---

## 11. Third-Party Tools

| Tool | Best For | Pricing |
|------|----------|---------|
| **Optmyzr** | Automation + QS tracking + bid rules | $66–$208/mo |
| **SEMrush** | Keyword research + competitor ad intel | $99+/mo |
| **SpyFu** | Competitor keyword + historical ad data | $39+/mo |
| **WordStream** | Simplified management for SMBs | Custom |
| **DataSlayer** | Reporting/dashboards from Google Ads → Sheets | $19+/mo |
| **Google Ads Editor** | Bulk edits offline (free, native) | Free |

Most serious operations: SEMrush for research → Optmyzr or native UI for management.

---

## Sources

- [Google Ads PMax Best Practices 2026 - ALM Corp](https://almcorp.com/blog/google-ads-performance-max-2026-strategy-guide/)
- [Performance Max Complete Guide - Store Growers](https://www.storegrowers.com/performance-max-campaigns/)
- [Google Smart Bidding Strategies 2025 - Define Digital](https://www.definedigitalacademy.com/blog/google-ads-smart-bidding-strategies-2025)
- [Demand Gen Best Practices - Search Engine Land](https://searchengineland.com/google-demand-gen-campaigns-migration-and-best-practices-433014)
- [Google Ads Quality Score 2025 - Store Growers](https://www.storegrowers.com/google-ads-quality-score/)
- [Best Google Ads Management Software 2025 - SEO.ai](https://seo.ai/blog/best-google-ads-management-software)
- [Demand Gen Asset Specs - Google Ads Help](https://support.google.com/google-ads/answer/13704860?hl=en)

---

## Unresolved Questions

1. Does the target account have existing conversion history? (determines whether to start with Smart Bidding or manual)
2. E-com or lead gen focus? (determines tROAS vs. tCPA suitability)
3. Monthly budget range? (affects PMax viability vs. focused Search campaigns)
4. Is Enhanced Conversions already enabled on the account?
