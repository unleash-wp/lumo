# Google Ads API v19 — Python Integration Research

**Date:** 2026-02-22 | **Package:** `google-ads==29.1.0` (latest, Feb 2026) | **Requires:** Python 3.9+

---

## 1. Required Credentials

| Credential | Where to get |
|---|---|
| `developer_token` | Google Ads Manager (MCC) → Tools → API Center |
| `client_id` / `client_secret` | Google Cloud Console → OAuth 2.0 Client |
| `refresh_token` | Run `generate_user_credentials.py` sample |
| `customer_id` | 10-digit account ID, no hyphens |
| `login_customer_id` | MCC account ID (if managing sub-accounts) |

---

## 2. Setup

```bash
pip install google-ads==29.1.0
```

**`google-ads.yaml`** (place in project root or `~/.config/google-ads.yaml`):
```yaml
developer_token: YOUR_DEVELOPER_TOKEN
client_id: YOUR_CLIENT_ID
client_secret: YOUR_CLIENT_SECRET
refresh_token: YOUR_REFRESH_TOKEN
login_customer_id: YOUR_MCC_CUSTOMER_ID  # omit if single account
```

**Client init:**
```python
from google.ads.googleads.client import GoogleAdsClient

client = GoogleAdsClient.load_from_storage("google-ads.yaml")
# or from env/dict: GoogleAdsClient.load_from_dict({...})
```

---

## 3. Create a Search Campaign (Budget → Campaign → Ad Group → Keyword)

```python
import uuid
from google.ads.googleads.client import GoogleAdsClient

def create_campaign(client, customer_id):
    # --- Budget ---
    budget_svc = client.get_service("CampaignBudgetService")
    budget_op = client.get_type("CampaignBudgetOperation")
    b = budget_op.create
    b.name = f"Budget {uuid.uuid4()}"
    b.amount_micros = 1_000_000  # $1.00/day (micros = millionths)
    b.delivery_method = client.enums.BudgetDeliveryMethodEnum.STANDARD
    budget_resp = budget_svc.mutate_campaign_budgets(customer_id=customer_id, operations=[budget_op])
    budget_rn = budget_resp.results[0].resource_name

    # --- Campaign ---
    camp_svc = client.get_service("CampaignService")
    camp_op = client.get_type("CampaignOperation")
    c = camp_op.create
    c.name = f"Search Campaign {uuid.uuid4()}"
    c.status = client.enums.CampaignStatusEnum.PAUSED  # start paused
    c.advertising_channel_type = client.enums.AdvertisingChannelTypeEnum.SEARCH
    c.campaign_budget = budget_rn
    c.manual_cpc.enhanced_cpc_enabled = True
    c.network_settings.target_google_search = True
    c.network_settings.target_search_network = True
    camp_resp = camp_svc.mutate_campaigns(customer_id=customer_id, operations=[camp_op])
    campaign_rn = camp_resp.results[0].resource_name
    print(f"Created campaign: {campaign_rn}")

    # --- Ad Group ---
    ag_svc = client.get_service("AdGroupService")
    ag_op = client.get_type("AdGroupOperation")
    ag = ag_op.create
    ag.name = f"Ad Group {uuid.uuid4()}"
    ag.campaign = campaign_rn
    ag.status = client.enums.AdGroupStatusEnum.ENABLED
    ag.type_ = client.enums.AdGroupTypeEnum.SEARCH_STANDARD
    ag.cpc_bid_micros = 500_000  # $0.50 CPC
    ag_resp = ag_svc.mutate_ad_groups(customer_id=customer_id, operations=[ag_op])
    ag_rn = ag_resp.results[0].resource_name

    # --- Keyword ---
    criterion_svc = client.get_service("AdGroupCriterionService")
    criterion_op = client.get_type("AdGroupCriterionOperation")
    kw = criterion_op.create
    kw.ad_group = ag_rn
    kw.status = client.enums.AdGroupCriterionStatusEnum.ENABLED
    kw.keyword.text = "python programming"
    kw.keyword.match_type = client.enums.KeywordMatchTypeEnum.EXACT
    criterion_svc.mutate_ad_group_criteria(customer_id=customer_id, operations=[criterion_op])
    return campaign_rn
```

---

## 4. Campaign Performance Report (GAQL)

```python
def get_performance(client, customer_id, days=30):
    ga_svc = client.get_service("GoogleAdsService")
    query = f"""
        SELECT
            campaign.id,
            campaign.name,
            campaign.status,
            metrics.impressions,
            metrics.clicks,
            metrics.cost_micros,
            metrics.conversions,
            metrics.conversions_value,
            metrics.ctr,
            metrics.average_cpc
        FROM campaign
        WHERE segments.date DURING LAST_{days}_DAYS
          AND campaign.status != 'REMOVED'
        ORDER BY metrics.cost_micros DESC
    """
    stream = ga_svc.search_stream(customer_id=customer_id, query=query)
    rows = []
    for batch in stream:
        for row in batch.results:
            cost = row.metrics.cost_micros / 1_000_000
            conv_value = row.metrics.conversions_value
            roas = conv_value / cost if cost > 0 else 0  # ROAS = revenue / spend
            rows.append({
                "id": row.campaign.id,
                "name": row.campaign.name,
                "impressions": row.metrics.impressions,
                "clicks": row.metrics.clicks,
                "cost": cost,
                "conversions": row.metrics.conversions,
                "roas": round(roas, 2),
                "ctr": round(row.metrics.ctr * 100, 2),
            })
    return rows
```

> **Note:** `cost_micros` = millionths of account currency. `ROAS = conversions_value / (cost_micros / 1e6)`.

---

## 5. Pause / Enable a Campaign

```python
def set_campaign_status(client, customer_id, campaign_resource_name, pause=True):
    camp_svc = client.get_service("CampaignService")
    camp_op = client.get_type("CampaignOperation")
    c = camp_op.update
    c.resource_name = campaign_resource_name
    c.status = (client.enums.CampaignStatusEnum.PAUSED if pause
                else client.enums.CampaignStatusEnum.ENABLED)
    client.copy_from(camp_op.update_mask, protobuf_helpers.field_mask(None, c._pb))
    camp_svc.mutate_campaigns(customer_id=customer_id, operations=[camp_op])
```

> Use `proto.field_mask` or `google.protobuf.field_mask_pb2.FieldMask` to specify `update_mask=["status"]`.

---

## 6. Add Negative Keywords to a Campaign

```python
def add_negative_keyword(client, customer_id, campaign_resource_name, keyword_text):
    criterion_svc = client.get_service("CampaignCriterionService")
    criterion_op = client.get_type("CampaignCriterionOperation")
    neg = criterion_op.create
    neg.campaign = campaign_resource_name
    neg.negative = True
    neg.keyword.text = keyword_text
    neg.keyword.match_type = client.enums.KeywordMatchTypeEnum.BROAD  # broad = widest exclusion
    criterion_svc.mutate_campaign_criteria(customer_id=customer_id, operations=[criterion_op])
    print(f"Added negative keyword: '{keyword_text}'")
```

---

## 7. Budget Management

```python
def update_budget(client, customer_id, budget_resource_name, daily_budget_usd):
    budget_svc = client.get_service("CampaignBudgetService")
    budget_op = client.get_type("CampaignBudgetOperation")
    b = budget_op.update
    b.resource_name = budget_resource_name
    b.amount_micros = int(daily_budget_usd * 1_000_000)
    budget_svc.mutate_campaign_budgets(customer_id=customer_id, operations=[budget_op])
```

Get budget resource name via GAQL: `SELECT campaign_budget.resource_name FROM campaign_budget`.

---

## 8. Key GAQL Notes

- **Resources:** `campaign`, `ad_group`, `ad_group_criterion`, `campaign_budget`
- **Date filters:** `DURING LAST_30_DAYS`, `DURING THIS_MONTH`, or explicit `>= '2025-01-01'`
- **Segments:** Adding `segments.date` breaks metrics into daily rows
- **SearchStream** (streaming) preferred over `search` (paged) for large result sets
- **Field compatibility:** Not all fields can be queried together — use [Query Validator](https://developers.google.com/google-ads/api/docs/query/overview)

---

## 9. Rate Limits & Quotas

| Limit | Value |
|---|---|
| Max operations per mutate request | 10,000 |
| Daily operations (Basic access) | 15,000 |
| Daily operations (Standard access) | Unlimited |
| QPS | Varies by server load; uses Token Bucket algo |
| Rate limit error | `RESOURCE_TEMPORARILY_EXHAUSTED` |

**Best practices:**
- Batch mutations: send up to 1,000 operations per call for efficiency
- Use `search_stream` over `search` for reports (no pagination overhead)
- Retry on `RESOURCE_TEMPORARILY_EXHAUSTED` with exponential backoff
- Standard Access required for production; apply via API Center in MCC account

---

## 10. Auth Summary

```python
# Minimal google-ads.yaml
developer_token: "XXXXXXXXXXXXXXXXXXXXXXXX"  # 22 chars from MCC > Tools > API Center
client_id: "xxxx.apps.googleusercontent.com"
client_secret: "XXXX"
refresh_token: "1//XXXX"  # generate via oauth flow once
# login_customer_id: "1234567890"  # MCC ID, no hyphens
```

Generate refresh token once using official script:
```bash
python -m examples.authentication.generate_user_credentials
```

---

## Sources
- [Python Client Lib Overview](https://developers.google.com/google-ads/api/docs/client-libs/python)
- [Quick Start / First Call](https://developers.google.com/google-ads/api/docs/get-started/make-first-call)
- [Search Campaign Guide](https://developers.google.com/google-ads/api/docs/campaigns/search-campaigns/getting-started)
- [GAQL Overview](https://developers.google.com/google-ads/api/docs/query/overview)
- [Rate Limits](https://developers.google.com/google-ads/api/docs/best-practices/quotas)
- [google-ads-python GitHub](https://github.com/googleads/google-ads-python)
- [PyPI: google-ads](https://pypi.org/project/google-ads/)

## Unresolved Questions
- `update_mask` exact pattern for campaign status update — verify with `protobuf_helpers.field_mask` or manual `FieldMask(paths=["status"])`
- Standard Access approval timeline (can take days/weeks for production use)
- Conversion tracking setup required before `conversions_value` populates in reports
