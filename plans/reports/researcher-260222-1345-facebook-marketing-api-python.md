# Research Report: Facebook Marketing API v21 — Python SDK

**Date:** 2026-02-22
**Sources:** Official SDK repo, PyPI, Medium guides, rate limit docs

---

## Executive Summary

Meta's `facebook-business` Python SDK wraps the Marketing API v21 (`https://graph.facebook.com/v21.0`). It uses a CRUD object model: `AdAccount → Campaign → AdSet → Ad`. Authentication requires 4 credentials. Insights are pulled via `get_insights()` on any object. Rate limits are usage-based (score header), not fixed RPS.

---

## 1. Installation & Auth

```bash
pip install facebook-business
```

```python
from facebook_business.api import FacebookAdsApi
from facebook_business.adobjects.adaccount import AdAccount
from facebook_business.adobjects.campaign import Campaign
from facebook_business.adobjects.adset import AdSet
from facebook_business.adobjects.ad import Ad
from facebook_business.adobjects.adimage import AdImage
from facebook_business.adobjects.adcreative import AdCreative
from facebook_business.adobjects.customaudience import CustomAudience

APP_ID = "your_app_id"
APP_SECRET = "your_app_secret"
ACCESS_TOKEN = "your_long_lived_token"  # System User token recommended
AD_ACCOUNT_ID = "act_123456789"

FacebookAdsApi.init(APP_ID, APP_SECRET, ACCESS_TOKEN, api_version="v21.0")
account = AdAccount(AD_ACCOUNT_ID)
```

**Token types:** Page Access Token (pages), User Access Token (short-lived), System User Token (long-lived, recommended for automation).

---

## 2. Create Campaign → AdSet → Ad

```python
# --- Campaign ---
campaign = account.create_campaign(fields=[], params={
    Campaign.Field.name: "My Campaign",
    Campaign.Field.objective: Campaign.Objective.outcome_traffic,
    Campaign.Field.status: Campaign.Status.paused,
    Campaign.Field.special_ad_categories: [],
})
campaign_id = campaign["id"]

# --- AdSet ---
adset = account.create_ad_set(fields=[], params={
    AdSet.Field.name: "My AdSet",
    AdSet.Field.campaign_id: campaign_id,
    AdSet.Field.billing_event: AdSet.BillingEvent.impressions,
    AdSet.Field.optimization_goal: AdSet.OptimizationGoal.link_clicks,
    AdSet.Field.daily_budget: 1000,        # cents (= $10/day)
    AdSet.Field.bid_amount: 100,           # cents
    AdSet.Field.targeting: {
        "geo_locations": {"countries": ["US"]},
        "age_min": 25,
        "age_max": 45,
    },
    AdSet.Field.status: AdSet.Status.paused,
    AdSet.Field.start_time: "2026-03-01T00:00:00-0800",
})
adset_id = adset["id"]

# --- Upload Image Creative ---
img = account.create_ad_image(fields=[], params={
    AdImage.Field.filename: "/path/to/image.jpg",
})
img_hash = img[AdImage.Field.hash]

creative = account.create_ad_creative(fields=[], params={
    AdCreative.Field.name: "My Creative",
    AdCreative.Field.object_story_spec: {
        "page_id": "your_page_id",
        "link_data": {
            "image_hash": img_hash,
            "link": "https://yoursite.com",
            "message": "Check this out!",
        },
    },
})

# --- Ad ---
ad = account.create_ad(fields=[], params={
    Ad.Field.name: "My Ad",
    Ad.Field.adset_id: adset_id,
    Ad.Field.creative: {"creative_id": creative["id"]},
    Ad.Field.status: Ad.Status.paused,
})
```

---

## 3. Get Insights / Performance

```python
from facebook_business.adobjects.adsinsights import AdsInsights

insights = campaign.get_insights(fields=[
    AdsInsights.Field.campaign_name,
    AdsInsights.Field.impressions,
    AdsInsights.Field.clicks,
    AdsInsights.Field.spend,
    AdsInsights.Field.ctr,
    AdsInsights.Field.cpc,
    AdsInsights.Field.actions,          # conversions breakdown
    AdsInsights.Field.purchase_roas,    # ROAS
], params={
    "date_preset": AdsInsights.DatePreset.last_7d,
    "level": "campaign",
})

for row in insights:
    print(row[AdsInsights.Field.campaign_name], row[AdsInsights.Field.spend])
    # purchase_roas is a list: [{"action_type": "omni_purchase", "value": "3.5"}]
```

**Account-level insights:**
```python
account.get_insights(fields=[...], params={"level": "ad", "date_preset": "last_30d"})
```

---

## 4. Pause / Enable Campaign

```python
# Pause
campaign.api_update(fields=[], params={Campaign.Field.status: Campaign.Status.paused})

# Enable
campaign.api_update(fields=[], params={Campaign.Field.status: Campaign.Status.active})

# Same pattern for AdSet and Ad
ad.api_update(fields=[], params={Ad.Field.status: Ad.Status.paused})
```

---

## 5. Audience Management

```python
# Custom Audience (customer list)
audience = account.create_custom_audience(fields=[], params={
    CustomAudience.Field.name: "My Customer List",
    CustomAudience.Field.subtype: CustomAudience.Subtype.custom,
    CustomAudience.Field.description: "Uploaded CRM list",
    CustomAudience.Field.customer_file_source: "USER_PROVIDED_ONLY",
})

# Lookalike
from facebook_business.adobjects.lookalikespecs import LookalikeSpecs
lookalike = account.create_lookalike_audience(fields=[], params={
    "name": "Lookalike 1%",
    "origin_audience_id": audience["id"],
    "lookalike_spec": {
        "type": "similarity",
        "ratio": 0.01,
        "country": "US",
    },
})

# Use in targeting
targeting = {
    "custom_audiences": [{"id": audience["id"]}],
    "geo_locations": {"countries": ["US"]},
}
```

---

## 6. Budget Management

```python
# Update daily budget on AdSet
adset.api_update(fields=[], params={
    AdSet.Field.daily_budget: 5000,  # $50/day in cents
})

# Lifetime budget (mutually exclusive with daily_budget)
adset.api_update(fields=[], params={
    AdSet.Field.lifetime_budget: 100000,  # $1000 total
    AdSet.Field.end_time: "2026-04-01T00:00:00-0800",
})
```

---

## 7. Rate Limits & Best Practices

| Aspect | Detail |
|--------|--------|
| Score header | `X-Business-Use-Case-Usage` — watch for `call_count`, `total_cpu_time`, `total_time` |
| Throttle trigger | Score reaches 100% → 429 error |
| Recovery | Exponential backoff: 1s → 2s → 4s → 8s → 64s cap, max 5 retries |
| Batch API | Use `FacebookAdsApiBatch` for bulk reads (up to 50 calls/batch) |
| Token | Use System User token (never expires) for automation |
| Versioning | v21.0 current; old versions deprecated 2 years after release |

```python
import time, random

def api_call_with_retry(fn, max_retries=5):
    for attempt in range(max_retries):
        try:
            return fn()
        except Exception as e:
            if "429" in str(e) or "throttled" in str(e).lower():
                wait = (2 ** attempt) + random.uniform(0, 1)
                time.sleep(min(wait, 64))
            else:
                raise
    raise Exception("Max retries exceeded")
```

---

## Key Fields Reference

| Object | Common Fields |
|--------|--------------|
| Campaign | `name`, `objective`, `status`, `special_ad_categories` |
| AdSet | `campaign_id`, `daily_budget`, `billing_event`, `optimization_goal`, `targeting`, `bid_amount` |
| Ad | `adset_id`, `creative`, `status`, `name` |
| Insights | `impressions`, `clicks`, `spend`, `ctr`, `cpc`, `actions`, `purchase_roas`, `reach` |

**Objectives (v21):** `outcome_traffic`, `outcome_awareness`, `outcome_engagement`, `outcome_leads`, `outcome_sales`, `outcome_app_promotion`

---

## Resources

- [facebook-python-business-sdk (GitHub)](https://github.com/facebook/facebook-python-business-sdk)
- [PyPI: facebook-business](https://pypi.org/project/facebook-business/)
- [Marketing API Docs](https://developers.facebook.com/docs/marketing-apis)
- [Rate Limit Handling](https://reintech.io/blog/handling-facebook-api-rate-limiting-throttling)

---

## Unresolved Questions

1. Video upload flow — requires resumable upload via `AdVideo` object; not covered here.
2. Conversion API (CAPI) server-side events integration not covered.
3. Instagram-specific placements — requires `instagram_actor_id` in `object_story_spec`.
4. Automated Rules API — separate endpoint for rule-based pause/budget triggers.
