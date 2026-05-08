# 74 — FinOps | تحسين تكلفة السحابة

## 🟠 الأولوية: عالي

## 🎯 الخطة

### 74.1 — Cost Visibility (5 أيام)
**Track:**
- Hetzner servers + load balancers
- Cloudflare R2 storage + bandwidth
- LLM API (Gemini, OpenAI fallback)
- Sentry
- LangSmith / Helicone
- Doppler / Vault
- Stripe fees
- Email provider (Resend / Postmark)
- WhatsApp Business API

**Dashboard:**
- Cost per service
- Cost per tenant
- Cost trends
- Forecasted costs

### 74.2 — Cost Allocation (3 أيام)
- Per-tenant cost (compute + storage + AI)
- Identify unprofitable tenants
- Adjust pricing if needed

### 74.3 — Right-Sizing (5 أيام)
- Server utilization audit
- Right-size based on actual usage
- Spot instances where applicable
- Reserved instances for predictable load

### 74.4 — Storage Optimization (4 أيام)
- Tiered storage (hot/warm/cold)
- Archive old data to glacier
- Compress backups
- Delete temporary files
- Image deduplication

### 74.5 — Database Cost Optimization (4 أيام)
- Query optimization (cheaper than scaling)
- Connection pooling
- Read replicas vs vertical scaling
- Archive old data
- Partitioning

### 74.6 — LLM Cost Management (5 أيام)
- Cache embeddings
- Use cheaper models when sufficient (flash vs pro)
- Token budgets per tenant
- Prompt optimization (shorter = cheaper)
- Batch API where possible
- Self-hosted Ollama for non-critical

### 74.7 — CDN Cost (3 أيام)
- Cloudflare R2 (no egress fees)
- Optimize image sizes
- Lazy loading
- Cache headers tuning

### 74.8 — Vendor Optimization (5 أيام)
- Annual prepay discounts
- Volume discounts (e.g., Sentry > 50K events)
- Free tier maximization
- Open source alternatives (Sentry → SigNoz; LangSmith → Langfuse)

### 74.9 — FinOps Reviews (monthly) (2 days/month)
- Cost trends review
- Budget vs actual
- New initiatives ROI
- Optimization opportunities

### 74.10 — Per-Tenant Profitability (4 أيام)
- Revenue per tenant
- Cost per tenant
- Margin per tenant
- Identify subsidies (free/cheap tenants costing more)

## 📊 KPIs
| KPI | قبل | بعد |
|-----|-----|-----|
| Cost visibility | جزئي | per-service + per-tenant |
| Monthly cost | غير مقاس | tracked + forecast |
| LLM cost per query | غير مقاس | < $0.001 |
| Profitable tenants % | غير معلوم | > 90% |
| Annual savings | غير محسوب | > 30% |

## ⏱️ المدة: 40 يوم عمل + ongoing
