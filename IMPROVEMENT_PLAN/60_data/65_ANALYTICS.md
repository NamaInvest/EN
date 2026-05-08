# 65 — Product Analytics | تحليلات المنتج

## 🟡 الأولوية: متوسط

## 🎯 الخطة

### 65.1 — Analytics Stack (3 أيام)
- **Web/App:** PostHog (open source) + GA4
- **Backend Events:** PostHog API
- **A/B Testing:** PostHog Feature Flags
- **Heatmaps:** Hotjar / Microsoft Clarity (مجاني)
- **Session Replay:** PostHog
- **Customer Data Platform:** Optional (Segment)

### 65.2 — Event Tracking (5 أيام)
```typescript
// Standardized events
posthog.capture('invoice_created', {
  invoice_id, amount, customer_id, branch_id,
  payment_method, has_discount,
});

// Critical events to track:
- user_signed_up
- onboarding_step_completed
- onboarding_completed
- first_invoice_created
- first_payment_received
- feature_used (per feature)
- error_encountered
- subscription_upgraded
- support_ticket_opened
- churned
```

### 65.3 — Funnels (4 أيام)
- Sign-up → Onboarding → First Invoice → Payment
- Trial → Paid
- Free → Pro
- Per industry vertical

### 65.4 — Cohort Analysis (3 أيام)
- Retention by signup month
- Revenue retention
- Feature adoption

### 65.5 — User Segmentation (3 أيام)
- By plan
- By industry
- By usage level
- By revenue contribution
- For targeted campaigns

### 65.6 — Custom Dashboards (4 أيام)
- Product Manager dashboard
- Engineering dashboard (errors, performance)
- Marketing dashboard (acquisition)
- Customer Success dashboard (health)

### 65.7 — Privacy Compliance (3 أيام)
- PDPL-compliant tracking
- Consent management
- Anonymization
- Data retention policies

### 65.8 — Insights Generation (5 أيام)
- AI-generated insights ("you have 30% drop in feature X")
- Anomaly detection
- Weekly summaries to team
- Notion / Slack integration

## 📊 KPIs
| KPI | قبل | بعد |
|-----|-----|-----|
| Events tracked | غير معلوم | 50+ |
| Conversion analysis | لا | per funnel |
| Feature adoption tracking | لا | per feature |
| Insights actionability | غير مقاس | weekly |

## ⏱️ المدة: 30 يوم عمل
