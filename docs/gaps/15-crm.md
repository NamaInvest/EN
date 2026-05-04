# النقص #15: CRM (Leads + Opportunities + Accounts + Activities) — مواصفات تفصيلية

> **المرجعيات:** Salesforce CRM، HubSpot، Microsoft Dynamics CRM、Zoho CRM、Pipedrive、Freshsales، SAP Customer Experience

---

## 1. البرومنت الكامل

```
وسّع CRM لمستوى Salesforce:

موجود:
- src/lib/crm-engine.ts
- prisma: Lead, CrmAccount, Contact, Opportunity, PipelineStage, Activity

النواقص:

A) Lead Management:
   - Lead scoring (BANT/CHAMP/MEDDIC)
   - Lead source tracking + ROI per source
   - Lead routing rules (round-robin, territory, score)
   - Lead nurturing (email sequences)
   - Lead-to-account matching (de-dup)
   - Web-to-lead form
   - Lead conversion to Account/Contact/Opportunity

B) Pipeline & Forecasting:
   - Multiple pipelines (per product/team)
   - Custom stages per pipeline
   - Stage probability + close confidence
   - Forecast categories (commit/best/upside)
   - Win/Loss analysis with reasons
   - Activity tracking per opp
   - Quote integration

C) Account Management:
   - Account hierarchy (parent/sub)
   - Account team (multiple owners)
   - Key contacts + decision makers
   - Account plans
   - Whitespace analysis
   - Account 360 view

D) Activity Management:
   - Tasks, Calls, Emails, Meetings, Notes
   - Calendar integration (Google/Outlook)
   - Email tracking (open/click)
   - Call recording (optional)
   - Meeting outcomes
   - Templates for common activities

E) Marketing Integration:
   - Campaigns + cost tracking
   - Email marketing (templates + sequences)
   - Landing pages
   - Web tracking (UTM)
   - Attribution model

F) Customer Health:
   - Health score per account
   - At-risk indicators
   - Churn prediction (AI)
   - NPS surveys

G) WhatsApp/SMS Integration:
   - Conversations within CRM
   - Templates
   - Bulk broadcast (with consent)

H) AI:
   - Lead scoring AI
   - Next best action
   - Email composition
   - Conversation summarization

I) APIs (50+ endpoints)

J) UI: 18 pages

K) Tests: 60+
```

---

## 2. السيناريوهات (8)

### A — Lead Inbound from Website
```
1. Visitor fills form on website
2. Webhook → POST /crm/leads (web source)
3. Lead created with UTM parameters
4. Lead scoring runs:
   - Demographic (industry, size, role): 40 points
   - Behavioral (pages visited, downloads): 30 points
   - Total: 70 → Hot Lead
5. Routing rule: hot leads → assign to senior rep
6. Auto-email: "Thanks for your interest"
7. Sales rep gets notification
8. Calls within 5 min (SLA)
```

### B — Lead Conversion
```
1. Qualified lead "ABC Corp - John Smith - Sales Director"
2. Rep: [Convert]
3. Wizard:
   - Create Account: ABC Corp (auto-detect existing)
   - Create Contact: John Smith
   - Create Opportunity: "ABC Corp - Annual License" 50K SAR
4. Activities migrate from lead → opportunity
5. Lead status: CONVERTED
```

### C — Opportunity Pipeline Movement
```
- Opp moves through stages:
  - Qualification (10%) → Discovery (25%) → Proposal (50%) → Negotiation (75%) → Closed Won (100%)
- Each stage has required fields + activities
- Probability auto-updates
- Forecast updates accordingly
- Stale opps (no activity 14 days) flagged
```

### D — Account Hierarchy + Whitespace
```
- Parent: ABC Holding
- Subs: ABC Saudi, ABC UAE, ABC Egypt
- Whitespace analysis:
  - ABC Saudi has 3 products
  - ABC UAE has 2 products
  - Whitespace: cross-sell 1 to UAE, 2 to Egypt
- Account plan generated
```

### E — Activity & Email Tracking
```
- Rep sends proposal email
- Email opened by customer (tracking pixel)
- Customer clicks 3 links
- Auto-task: "Follow up - prospect engaged"
- Rep sees engagement timeline
```

### F — WhatsApp Conversation
```
- Customer messages on WhatsApp Business
- Routed to lead/opp owner
- Inline conversation in CRM
- Templates available (with consent)
- Bot handles FAQ → escalates to human
```

### G — Forecast Roll-up
```
- Sales VP sees forecast:
  - Commit: 1.2M (closed + 90%+ probability)
  - Best Case: 2.5M (50%+ probability)
  - Upside: 4M (all open)
- Drills down by region, rep, product
- Quarterly target: 2M → 60% commit
```

### H — Lost Deal Analysis
```
- Opp marked Lost: $200K
- Reason dropdown: Price/Competitor/Timing/Features/No-go
- Selected: Price (lost to "X Co")
- Required: textarea explanation
- Aggregated: 35% of losses are price → strategy adjustment
```

---

## 3. تدفق البيانات

```
[Web Form] → POST /webhooks/crm/web-lead
   ↓ create Lead + score
   ↓ assign by routing rules
   ↓ trigger nurture sequence

[Convert Lead] → POST /crm/leads/:id/convert
   ↓ create/match Account
   ↓ create Contact
   ↓ create Opportunity
   ↓ migrate activities

[Activity] → POST /crm/activities
   ↓ create Activity
   ↓ if email → track via pixel
   ↓ if meeting → calendar sync
   ↓ update last activity on parent (lead/opp/account)

[Stage Move] → POST /crm/opps/:id/stage
   ↓ validate required fields for new stage
   ↓ update probability
   ↓ create stage history record
   ↓ trigger workflow (if any)

[Forecast Calc] → cron daily
   ↓ aggregate open opps by category
   ↓ apply weighting
   ↓ store Forecast snapshot
```

---

## 4. Prisma Schema (إضافات)

```prisma
model Lead {
  // ... existing
  source              String      // 'WEB' | 'EMAIL' | 'PHONE' | 'TRADE_SHOW' | 'REFERRAL' | 'PARTNER' | 'SOCIAL' | 'COLD_OUTREACH'
  utmCampaign         String?
  utmSource           String?
  utmMedium           String?
  utmContent          String?
  
  industry            String?
  companySize         String?     // 'SOLO' | 'SME' | 'MID' | 'LARGE' | 'ENTERPRISE'
  jobTitle            String?
  budget              Decimal?    @db.Decimal(20,4)
  authorityLevel      String?     // 'INFLUENCER' | 'DECISION_MAKER' | 'CHAMPION' | 'GATEKEEPER'
  needLevel           String?     // 'EXPLORING' | 'EVALUATING' | 'COMMITTED'
  timeline            String?     // 'IMMEDIATE' | '1_MONTH' | '3_MONTHS' | '6_MONTHS' | 'NONE'
  
  // BANT/MEDDIC
  bantScore           Int?
  meddicData          Json?
  
  // Scoring
  score               Int         @default(0)
  scoreUpdatedAt      DateTime?
  scoreFactors        Json?       // {demographic: 40, behavioral: 30, ...}
  isHot               Boolean     @default(false)
  
  // Routing
  assignedToId        Int?
  assignedAt          DateTime?
  territoryId         Int?
  
  // SLA
  firstResponseAt     DateTime?
  firstResponseSlaSec Int?
  
  // Conversion
  convertedAt         DateTime?
  convertedToAccountId Int?
  convertedToContactId Int?
  convertedToOpportunityId Int?
  
  activities          Activity[]
  scoreHistory        LeadScoreHistory[]
  
  @@index([score, isHot, status])
}

model LeadScoreHistory {
  id            Int       @id @default(autoincrement())
  leadId        Int
  lead          Lead      @relation(fields: [leadId], references: [id])
  scoreBefore   Int
  scoreAfter    Int
  reason        String
  changedAt     DateTime  @default(now())
}

model LeadRoutingRule {
  id            Int       @id @default(autoincrement())
  name          String
  conditions    Json      // [{field, operator, value}]
  assignmentType String   // 'ROUND_ROBIN' | 'TERRITORY' | 'SCORE_BASED' | 'PRODUCT_BASED' | 'SPECIFIC_USER'
  assigneeIds   Int[]
  priority      Int
  active        Boolean   @default(true)
}

model CrmAccount {
  // ... existing
  parentAccountId     Int?
  parentAccount       CrmAccount? @relation("AccountHierarchy", fields: [parentAccountId], references: [id])
  childAccounts       CrmAccount[] @relation("AccountHierarchy")
  
  industry            String?
  size                String?
  annualRevenue       Decimal?    @db.Decimal(20,4)
  employees           Int?
  
  // Account team
  primaryOwnerId      Int?
  teamMemberIds       Int[]
  
  // Health
  healthScore         Int?        // 0-100
  healthStatus        String?     // 'HEALTHY' | 'AT_RISK' | 'CRITICAL'
  healthFactors       Json?
  lastEngagementAt    DateTime?
  
  // Customer journey
  lifecycleStage      String      @default("LEAD")  // LEAD | PROSPECT | CUSTOMER | LOYAL | CHURNED
  
  customerSince       DateTime?
  totalRevenue        Decimal?    @db.Decimal(20,4)
  
  // Strategic
  strategicTier       String?     // 'TIER_1' | 'TIER_2' | 'TIER_3'
  accountPlan         AccountPlan?
}

model AccountPlan {
  id                  Int         @id @default(autoincrement())
  accountId           Int         @unique
  account             CrmAccount  @relation(fields: [accountId], references: [id])
  fiscalYear          Int
  
  goals               Json        // [{description, targetRevenue, dueDate}]
  whitespaceAnalysis  Json?
  competitiveLandscape Json?
  keyDecisionMakers   Json?
  challenges          String?     @db.Text
  opportunities       String?     @db.Text
  
  reviewedAt          DateTime?
  approvedByUserId    String?
}

model Pipeline {
  id            Int       @id @default(autoincrement())
  name          String
  description   String?
  isDefault     Boolean   @default(false)
  productCategoryIds Int[]?
  active        Boolean   @default(true)
  stages        PipelineStage[]
}

model PipelineStage {
  // ... existing
  pipelineId        Int?
  pipeline          Pipeline?   @relation(fields: [pipelineId], references: [id])
  
  name              String
  sequenceNumber    Int
  probability       Decimal     @db.Decimal(5,2)
  forecastCategory  String      // 'COMMIT' | 'BEST_CASE' | 'PIPELINE' | 'OMITTED'
  
  requiredFields    String[]
  requiredActivities String[]
  
  isClosed          Boolean     @default(false)
  isWon             Boolean     @default(false)
  staleAfterDays    Int?
}

model Opportunity {
  // ... existing
  pipelineId        Int?
  stageId           Int
  
  forecastCategory  String?     // override stage default
  closeDate         DateTime
  expectedRevenue   Decimal?    @db.Decimal(20,4)  // amount × probability
  
  competitor        String?
  
  wonReason         String?
  lostReason        String?
  lostReasonDetails String?     @db.Text
  lostToCompetitor  String?
  
  stageHistory      OpportunityStageHistory[]
  products          OpportunityProduct[]
  
  daysSinceLastActivity Int?
  isStale           Boolean     @default(false)
  
  @@index([stageId, closeDate, status])
  @@index([accountId, status])
}

model OpportunityStageHistory {
  id              Int           @id @default(autoincrement())
  opportunityId   Int
  opportunity     Opportunity   @relation(fields: [opportunityId], references: [id])
  fromStageId     Int?
  toStageId       Int
  movedAt         DateTime      @default(now())
  movedByUserId   String
  daysInStage     Int?
  notes           String?
}

model OpportunityProduct {
  id              Int           @id @default(autoincrement())
  opportunityId   Int
  opportunity     Opportunity   @relation(fields: [opportunityId], references: [id])
  productId       Int?
  description     String
  quantity        Decimal       @db.Decimal(20,4)
  unitPrice       Decimal       @db.Decimal(20,4)
  totalPrice      Decimal       @db.Decimal(20,4)
}

model Activity {
  // ... existing
  type              String      // CALL | EMAIL | MEETING | TASK | NOTE | WHATSAPP | SMS | LINKEDIN
  direction         String?     // INBOUND | OUTBOUND
  subject           String
  description       String?     @db.Text
  
  startTime         DateTime
  endTime           DateTime?
  durationMinutes   Int?
  
  // Polymorphic links
  leadId            Int?
  contactId         Int?
  accountId         Int?
  opportunityId     Int?
  caseId            Int?
  
  ownerUserId       String
  
  // Email-specific
  emailMessageId    String?
  emailOpenedAt     DateTime?
  emailClickedAt    DateTime?
  emailClicksCount  Int?        @default(0)
  emailBouncedAt    DateTime?
  
  // Call-specific
  callDirection     String?
  callOutcome       String?
  callDurationSec   Int?
  callRecordingUrl  String?
  
  // Meeting-specific
  meetingLocation   String?
  meetingAttendees  Json?
  meetingNotes      String?
  meetingFollowUp   String?
  
  // Task-specific
  taskStatus        String?     // PENDING | IN_PROGRESS | DONE | CANCELLED
  taskPriority      String?     // LOW | NORMAL | HIGH | URGENT
  taskDueDate       DateTime?
  
  // Outcome
  outcome           String?     // POSITIVE | NEUTRAL | NEGATIVE
  
  completedAt       DateTime?
  completedByUserId String?
}

model Campaign {
  id            Int       @id @default(autoincrement())
  name          String
  type          String    // 'EMAIL' | 'EVENT' | 'WEBINAR' | 'PAID_AD' | 'SOCIAL' | 'CONTENT'
  status        String    @default("PLANNED")  // PLANNED | ACTIVE | COMPLETED | CANCELLED
  startDate     DateTime
  endDate       DateTime?
  budget        Decimal?  @db.Decimal(20,4)
  actualCost    Decimal?  @db.Decimal(20,4)
  
  targetSegment Json?
  
  // Metrics
  reach         Int       @default(0)
  clicks        Int       @default(0)
  conversions   Int       @default(0)
  revenue       Decimal?  @db.Decimal(20,4)
  
  members       CampaignMember[]
}

model CampaignMember {
  id            Int       @id @default(autoincrement())
  campaignId    Int
  campaign      Campaign  @relation(fields: [campaignId], references: [id])
  leadId        Int?
  contactId     Int?
  responseStatus String?  // SENT | DELIVERED | OPENED | CLICKED | RESPONDED | BOUNCED | UNSUBSCRIBED
}

model Forecast {
  id            Int       @id @default(autoincrement())
  fiscalYear    Int
  fiscalQuarter Int?
  fiscalMonth   Int?
  ownerUserId   String?
  
  commit        Decimal   @db.Decimal(20,4)
  bestCase      Decimal   @db.Decimal(20,4)
  pipeline      Decimal   @db.Decimal(20,4)
  closed        Decimal   @db.Decimal(20,4)
  target        Decimal?  @db.Decimal(20,4)
  
  generatedAt   DateTime  @default(now())
}

model NpsSurvey {
  id            Int       @id @default(autoincrement())
  customerId    Int?
  contactId     Int?
  accountId     Int?
  
  score         Int       // 0-10
  category      String    // 'PROMOTER' | 'PASSIVE' | 'DETRACTOR'
  feedback      String?   @db.Text
  
  surveyId      String
  responseAt    DateTime  @default(now())
  followedUpBy  String?
  followUpAt    DateTime?
}
```

---

## 5. Forms & Fields

### Form A: Lead
| Field | Type | Required |
|-------|------|----------|
| companyName | text | ✓ |
| firstName + lastName | text | ✓ |
| jobTitle | text | ✗ |
| email | email | ✓ |
| phone | tel | ✗ |
| source | dropdown | ✓ |
| utm fields | text | auto |
| industry | dropdown | ✗ |
| companySize | dropdown | ✗ |
| budget | money | ✗ |
| timeline | dropdown | ✗ |
| notes | textarea | ✗ |

### Form B: Convert Lead
| Field | Type | Required |
|-------|------|----------|
| createAccount | toggle | ✓ default true |
| accountName | text | conditional (or pick existing) |
| createContact | toggle | ✓ default true |
| createOpportunity | toggle | ✓ |
| oppName | text | conditional |
| oppAmount | money | conditional |
| oppCloseDate | datepicker | conditional |
| oppStage | dropdown | conditional |

### Form C: Opportunity
| Field | Type | Required |
|-------|------|----------|
| name | text | ✓ |
| accountId | autocomplete | ✓ |
| amount | money | ✓ |
| currency | dropdown | ✓ |
| stageId | dropdown | ✓ |
| pipelineId | dropdown | ✓ |
| probability | percent | auto |
| closeDate | datepicker | ✓ |
| expectedRevenue | calc | auto |
| competitor | text | ✗ |
| products | dynamic table | ✗ |
| ownerId | user picker | ✓ |
| forecastCategory | dropdown | auto |

### Form D: Activity (varies by type)
- Common: type, subject, description, dates, parent record, owner, outcome
- Email: subject, body (template), tracking toggle
- Call: direction, duration, outcome, recording
- Meeting: location, attendees, notes, follow-up

### Form E: Account Plan
- Goals, whitespace, competitive, decision makers, challenges, opportunities

### Form F: Campaign
- Name, type, dates, budget, target segment, members

---

## 6. Tables & Columns

### Grid A: Leads
| Column | Width |
|--------|-------|
| Score | progress + color | 80 |
| Lead # | 120 |
| Company | 200 |
| Contact | 180 |
| Title | 150 |
| Source | badge | 130 |
| Owner | user | 130 |
| Status | badge | 130 |
| Created | date | 110 |
| First Response | duration | 130 |
| Last Activity | datetime | 150 |
| Actions: [Convert] [Disqualify] | 180 |

### Grid B: Opportunities Kanban (visual)
- Columns = Stages
- Cards = Opps
- Drag-drop to move stages
- Filters: by owner, pipeline, close date

### Grid C: Opportunities Table
| Column | Width |
|--------|-------|
| Opp # | 120 |
| Name | 200 |
| Account | 180 |
| Amount | money | 130 |
| Currency | 80 |
| Stage | badge | 130 |
| Probability | percent | 100 |
| Expected | money | 130 |
| Forecast Cat | badge | 110 |
| Close Date | date | 110 |
| Days in Stage | number | 110 |
| Stale | indicator | 80 |
| Owner | user | 130 |
| Actions: [Move Stage] [Win] [Lose] | 200 |

### Grid D: Accounts
| Column | Width |
|--------|-------|
| Name | 200 |
| Tier | badge | 100 |
| Industry | 130 |
| Size | badge | 100 |
| Health | gauge | 100 |
| Lifecycle | badge | 130 |
| Annual Revenue | money | 150 |
| Total Revenue (us) | money | 150 |
| Owner | user | 130 |
| Last Engagement | datetime | 150 |
| Actions: [View] [Plan] [Whitespace] | 200 |

### Grid E: Activities Calendar / List
- Calendar view (per user, per team)
- List view: type, subject, date, parent, status

### Grid F: Forecast View
| Column | Width |
|--------|-------|
| Owner | 150 |
| Quota | money | 130 |
| Closed | money | 130 |
| Commit | money | 130 |
| Best Case | money | 130 |
| Pipeline | money | 130 |
| Coverage % | percent | 110 |
| Gap to Quota | money | 130 |

---

## 7. Buttons & Actions

| ID | الزر | اللون | Permission |
|----|------|-------|------------|
| btn-lead-create | + lead | 🟢 | role.sales |
| btn-lead-import | استيراد جماعي | ⬜ | role.sales_supervisor |
| btn-lead-convert | تحويل | 🟢 | role.sales |
| btn-lead-disqualify | استبعاد | 🔴 | role.sales + reason |
| btn-lead-assign | إسناد | ⬜ | role.sales_supervisor |
| btn-lead-merge | دمج (de-dup) | 🟡 | role.sales_supervisor |
| btn-lead-recalc-score | إعادة احتساب الـ Score | ⬜ | role.sales |
| btn-account-create | + account | 🟢 | role.sales |
| btn-account-merge | دمج | 🟡 | role.sales_manager |
| btn-account-team-add | + عضو فريق | ⬜ | role.account_owner |
| btn-account-plan | خطة الحساب | ⬜ | role.account_owner |
| btn-account-whitespace | تحليل الفجوة | ⬜ | role.sales |
| btn-opp-create | + opportunity | 🟢 | role.sales |
| btn-opp-stage-move | نقل المرحلة | 🟦 | role.sales |
| btn-opp-mark-won | كسبت | 🟢 | role.sales |
| btn-opp-mark-lost | خسرت | 🔴 | role.sales + reason |
| btn-opp-clone | استنساخ | ⬜ | role.sales |
| btn-opp-create-quote | + عرض سعر | 🟦 | role.sales |
| btn-activity-call | + اتصال | 🟦 | role.sales |
| btn-activity-email | + بريد | 🟦 | role.sales |
| btn-activity-meeting | + اجتماع | 🟦 | role.sales |
| btn-activity-task | + مهمة | 🟢 | any |
| btn-activity-note | + ملاحظة | ⬜ | any |
| btn-activity-complete | إنجاز | 🟢 | owner |
| btn-bulk-email | بريد جماعي | 🟦 | role.sales_supervisor |
| btn-whatsapp-send | إرسال WhatsApp | 🟢 | role.sales |
| btn-whatsapp-broadcast | بث جماعي | 🟦 | role.sales_supervisor |
| btn-campaign-create | + حملة | 🟢 | role.marketing |
| btn-campaign-add-members | + أعضاء | ⬜ | role.marketing |
| btn-campaign-launch | إطلاق | 🟢 | role.marketing_manager |
| btn-forecast-submit | تقديم التوقع | 🟢 | role.sales_rep |
| btn-forecast-roll-up | تجميع | 🟦 | role.sales_manager |
| btn-nps-send | إرسال NPS | 🟦 | role.sales |
| btn-export-leads | تصدير | ⬜ | role.sales |
| btn-import-csv | استيراد CSV | ⬜ | role.sales_supervisor |
| btn-routing-rule-create | + قاعدة توجيه | 🟢 | role.sales_manager |

---

## 8. Search & Filters

### Leads:
- Score range, Source, Status, Owner, Industry, Created date, Has activity, SLA breach

### Accounts:
- Tier, Industry, Health status, Lifecycle, Owner, Has open opps

### Opps:
- Stage, Pipeline, Owner, Close date, Amount range, Forecast cat, Stale, Has competitor

### Activities:
- Type, Owner, Status, Due date, Parent record, Outcome

---

## 9. Reports & Exports

| التقرير | الوصف |
|---------|------|
| Lead Conversion | by source/score |
| Lead Source ROI | revenue per source |
| Lead Aging | unresponded |
| Pipeline Report | by stage/owner |
| Forecast Report | commit/best/pipeline |
| Win/Loss Analysis | reasons |
| Activity Productivity | per rep |
| Email Performance | open/click rates |
| Account Health Distribution | tiers |
| Customer Journey | stages |
| NPS Trend | over time |
| Campaign ROI | per campaign |
| Quota Attainment | per rep |
| Stage Velocity | days per stage |

---

## 10. Dashboards & Widgets

- KPIs: New Leads / Conversion Rate / Pipeline / Forecast / Activities Today
- Charts: Funnel, Stage velocity, Source mix, Health distribution
- Lists: Hot leads, Stale opps, Today's tasks, Birthdays/anniversaries

---

## 11. Notifications

| Event | Channel | Recipient |
|-------|---------|-----------|
| Lead assigned | email + in-app | owner |
| SLA breach (no response) | email + in-app | owner + manager |
| Opp moved to next stage | in-app | owner |
| Opp stale | in-app | owner |
| Opp won/lost | email | team |
| Email opened by prospect | in-app | sender |
| Meeting reminder | email + push | owner |
| Activity overdue | in-app | owner |
| NPS detractor response | email | account owner |
| Birthday/anniversary | in-app | owner |
| Campaign milestone | email | marketing |

---

## 12. Permissions Matrix

| Action | Sales Rep | Manager | Marketing | Admin |
|--------|-----------|---------|-----------|-------|
| Create lead | ✓ | ✓ | ✓ | ✓ |
| View own | ✓ | ✓ | ✓ | ✓ |
| View team | ✗ | ✓ | ✓ | ✓ |
| View all | ✗ | ✗ | ✗ | ✓ |
| Convert | ✓ | ✓ | ✗ | ✓ |
| Reassign | ✗ | ✓ | ✗ | ✓ |
| Merge | ✗ | ✓ | ✗ | ✓ |
| Edit pipeline | ✗ | ✓ | ✗ | ✓ |
| Win/Lose opp | ✓ own | ✓ | ✗ | ✓ |
| Create campaign | ✗ | ✓ | ✓ | ✓ |
| Bulk email | ✗ | ✓ | ✓ | ✓ |
| Configure routing | ✗ | ✗ | ✗ | ✓ |
| Configure stages | ✗ | ✓ | ✗ | ✓ |
| View forecast all | ✗ | ✓ | ✗ | ✓ |

---

## 13. Integrations

| النظام | الغرض |
|--------|------|
| Gmail / Outlook | email tracking + sync |
| Google Calendar / Outlook | meeting sync |
| LinkedIn Sales Navigator | profile lookup |
| WhatsApp Business API | messaging |
| Zoom / Teams / Meet | meeting links |
| HubSpot / Marketo | marketing automation |
| Slack | notifications |
| Twilio | call recording, SMS |
| OpenAI / Gemini | AI suggestions |
| Mailchimp / SendGrid | email campaigns |
| Salla / Shopify | e-commerce sync |

---

## 14. Keyboard Shortcuts

| Shortcut | Action |
|----------|--------|
| `Ctrl+L` | New lead |
| `Ctrl+O` | New opp |
| `Ctrl+T` | New task |
| `Ctrl+E` | New email |
| `Ctrl+M` | New meeting |
| `/` | Quick search |

---

## 15. Mobile / Print

- Mobile sales app (lead/opp/activity on the go)
- Push notifications for assignments
- Voice-to-note for activities
- Print: account plan, opp summary

---

## 16. Audit & Logging

- Lead conversions logged
- Stage changes with timestamp
- Activity creates/edits
- Email tracking events
- Forecast submissions

---

## 17. Test Cases

```typescript
describe('Lead Scoring', () => {
  test('demographic factors')
  test('behavioral factors')
  test('hot lead threshold')
  test('routing by score')
})

describe('Conversion', () => {
  test('creates account/contact/opp')
  test('migrates activities')
  test('marks lead converted')
  test('handles existing account match')
})

describe('Pipeline', () => {
  test('stage probability auto-update')
  test('required fields enforcement')
  test('stale detection')
  test('forecast roll-up')
})

describe('Activities', () => {
  test('email tracking')
  test('calendar sync')
  test('overdue alerts')
})
```

---

## 18. Edge Cases

| الحالة | السلوك |
|--------|--------|
| Duplicate lead | suggest merge |
| Lead with no email | require phone |
| Owner inactive | reassign |
| Opp closed but reopened | new opp |
| Account merge with linked opps | reassign all |
| Email with multiple matches | prompt user |
| Activity in past | accept (back-dating) |
| Forecast for closed period | locked |

---

**نهاية مواصفات النقص #15**

> 8 سيناريوهات • 12 جداول schema • 6 forms • 6 grids • 35 button • 14 reports
