# BPF #8: Issue-to-Resolve (I2R) — Customer Service End-to-End

> **المرجعيات:** ServiceNow CSM、Salesforce Service Cloud、Zendesk、Freshdesk، SAP CX Service
> **الموديولات:** Customer, Support Tickets, Field Service, Returns, AR, Loyalty, Maintenance

---

## 1) الفلو

```
[Customer Reports Issue]
   ↓ via channel (phone/email/portal/WhatsApp/chat)
[Ticket Created]
   ↓ classification (AI-assisted)
[Routed to Right Team]
   ↓ priority + SLA
[First Response]
   ↓ investigation
[Root Cause Identified]
   ↓ solution path
[Resolution Type Decision]
   ↓ branches:
   - Field Service Dispatch (covered #36)
   - Replacement Order (covered Q2C #1)
   - Refund (RMA workflow)
   - Repair (in-house)
   - Knowledge Base Article (self-help)
   ↓ resolution
[Customer Confirmation]
   ↓ feedback
[Ticket Closed]
   ↓ optional
[Loyalty Compensation]
[Customer Satisfaction Survey]
```

**~12 stages، 7 modules**

---

## 2) البرومنت

```
بناء I2R orchestration:

موجود (skeleton): /api/field-service, RMA, Maintenance

النواقص:
A) Multi-channel intake (phone/email/portal/WhatsApp/chat)
B) AI ticket classification
C) Smart routing (skill + load + SLA)
D) SLA management with escalations
E) Knowledge Base
F) Customer satisfaction (CSAT) surveys
G) Service contracts integration
H) Compensation logic (refund/credit/loyalty/free service)

أنشئ:
- src/lib/i2r-orchestrator.ts
- src/lib/ai-ticket-classifier.ts
- prisma: SupportTicket, TicketEvent, KbArticle, CSATResponse
- UI: /service/ticket-pipeline + customer self-service portal
```

---

## 3) السيناريوهات (8)

### A — Standard Support Ticket
```
1. Customer emails: "Product X broken"
2. Email parsed → Ticket auto-created
3. AI classifies: Category=Hardware, Priority=Normal
4. Routed to Tier 1 Support
5. Agent responds in 2h (within SLA)
6. Investigation → identifies issue
7. Solution: Field service visit
8. FS technician dispatched (BPF skipped to #36)
9. Issue resolved
10. Customer confirms via portal
11. Ticket closed
12. CSAT survey sent → 4/5 rating
```

### B — Critical Issue (P1)
```
- Production system down at customer site
- Ticket priority: P1 (Critical)
- SLA: 1 hour response
- Auto-escalates to senior + manager
- Conference call with customer
- Multiple specialists join
- Workaround in 30 min
- Permanent fix in 4h
- Postmortem document created
- KB article published
```

### C — Recurring Customer Issue
```
- Customer has 5 tickets in last 30 days about same issue
- AI flags: chronic problem
- Priority elevated
- Senior engineer assigned
- Root cause: defective batch
- Solution: replace all units (recall)
- Linked to CAPA + batch recall workflow
```

### D — Field Service Visit
```
- Ticket: AC not cooling
- Service contract checked → covered
- Schedule technician for tomorrow
- Customer notified (SMS + email)
- Tech arrives → diagnoses → repairs
- Customer signs digitally
- Parts used recorded
- Ticket closed
- Invoice (or covered by contract)
```

### E — RMA (Refund)
```
- Customer wants refund (not satisfied)
- /service/tickets/[id]/escalate-rma
- Manager approves (within return policy)
- RMA created (cross to Q2C #1 returns)
- Customer ships product back
- Inspected → approved
- Refund processed
- Loyalty points clawback
- Ticket closed
```

### F — Knowledge Base Self-Help
```
- Customer searches help center
- Finds article: "How to reset password"
- Resolves issue without ticket
- Feedback: "Was this helpful?" → Yes
- KB analytics shows usage
- Reduces ticket volume
```

### G — Multi-channel Conversation
```
- Customer starts on WhatsApp
- Gets agent
- Conversation continues
- Customer joins from web later
- Same ticket, same agent, full history
- Agent responds anywhere → all channels updated
```

### H — Service Contract Renewal
```
- Customer's AMC expiring 30 days
- Auto-alert customer + sales
- Renewal proposal: same terms or +5%
- Customer accepts
- New contract → continuity
- Tickets continue covered
```

### sad-1 — Customer Becomes Hostile
```
- Customer angry, threatens lawsuit
- Escalate to manager
- Possibly legal team
- Document everything
- Resolve or compensate (with concession)
- Note in customer record (for future)
```

### sad-2 — Tech Cannot Fix
```
- Field service visits, can't resolve
- Escalate to engineering
- Product replacement may be needed
- May need refund
- Customer compensated for inconvenience
```

---

## 4) JEs in I2R

```
[Ticket Created]
   ↓ no JE (operational)
[Service Performed (under contract)]
   ↓ no JE if covered
   ↓ or accrued cost recovery from contract revenue
[Service Performed (T&M billing)]
   ↓ JE: DR AR / CR Service Revenue
   ↓ JE: DR Tax Receivable / CR VAT
[Parts Used]
   ↓ JE: DR COGS / CR Inventory (parts)
[RMA Refund]
   ↓ JE: DR Sales Returns / CR AR (or Cash if already paid)
   ↓ JE: DR Inventory / CR COGS (if returnable)
[Compensation (loyalty)]
   ↓ no JE (operational, but liability)
[Compensation (free product)]
   ↓ JE: DR Customer Compensation Expense / CR Inventory
```

---

## 5) Schema

```prisma
model SupportTicket {
  id              Int       @id @default(autoincrement())
  ticketNumber    String    @unique
  
  customerId      Int?
  contactId       Int?
  
  // Source
  channel         String    // 'EMAIL' | 'PHONE' | 'PORTAL' | 'WHATSAPP' | 'CHAT' | 'IN_PERSON' | 'WEBHOOK'
  externalRef     String?   // email message ID, etc.
  
  // Classification
  subject         String
  description     String    @db.Text
  category        String?
  subCategory     String?
  productId       Int?
  
  priority        String    @default("NORMAL")  // LOW | NORMAL | HIGH | URGENT | CRITICAL_P1
  severity        String    @default("MEDIUM")  // LOW | MEDIUM | HIGH | CRITICAL
  
  // Status
  status          String    @default("OPEN")  // OPEN | ASSIGNED | IN_PROGRESS | WAITING_CUSTOMER | RESOLVED | CLOSED | REOPENED
  
  // Assignment
  assignedTeamId  Int?
  assignedToUserId String?
  
  // SLA
  serviceContractId Int?
  slaResponseMinutes Int?
  slaResolutionMinutes Int?
  responseSlaDeadline DateTime?
  resolutionSlaDeadline DateTime?
  responseSlaMet  Boolean?
  resolutionSlaMet Boolean?
  
  // Lifecycle
  createdAt       DateTime  @default(now())
  firstResponseAt DateTime?
  resolvedAt      DateTime?
  closedAt        DateTime?
  reopenedAt      DateTime?
  reopenCount     Int       @default(0)
  
  // Resolution
  resolutionType  String?   // 'INFORMATION' | 'WORKAROUND' | 'FIX' | 'REPLACEMENT' | 'REFUND' | 'NO_FIX'
  rootCause       String?
  resolutionDescription String? @db.Text
  
  // Linked records
  fieldServiceWoId Int?
  rmaId           Int?
  replacementSoId Int?
  refundJournalId Int?
  
  // CSAT
  csatScore       Int?      // 1-5
  csatFeedback    String?
  csatSurveyedAt  DateTime?
  
  events          TicketEvent[]
  comments        TicketComment[]
  attachments     TicketAttachment[]
  
  @@index([status, priority])
  @@index([assignedToUserId, status])
  @@index([customerId, createdAt])
}

model TicketEvent {
  id              BigInt    @id @default(autoincrement())
  ticketId        Int
  ticket          SupportTicket @relation(fields: [ticketId], references: [id])
  
  eventType       String    // 'CREATED' | 'ASSIGNED' | 'STATUS_CHANGE' | 'COMMENT' | 'ATTACHMENT' | 'CHANNEL_SWITCH' | 'ESCALATED' | 'SLA_BREACH' | 'RESOLVED' | 'REOPENED'
  
  fromValue       String?
  toValue         String?
  
  performedByUserId String?
  performedByCustomer Boolean @default(false)
  
  metadata        Json?
  occurredAt      DateTime  @default(now())
  
  @@index([ticketId, occurredAt])
}

model TicketComment {
  id              Int       @id @default(autoincrement())
  ticketId        Int
  ticket          SupportTicket @relation(fields: [ticketId], references: [id])
  
  visibility      String    @default("PUBLIC")  // PUBLIC (visible to customer) | INTERNAL
  
  body            String    @db.Text
  
  authorUserId    String?
  authorCustomerId Int?
  
  channel         String?   // which channel comment originated
  
  createdAt       DateTime  @default(now())
}

model TicketAttachment {
  id              Int       @id @default(autoincrement())
  ticketId        Int
  ticket          SupportTicket @relation(fields: [ticketId], references: [id])
  
  fileUrl         String
  fileName        String
  fileType        String
  fileSizeBytes   Int
  
  uploadedAt      DateTime  @default(now())
  uploadedByUserId String?
  uploadedByCustomerId Int?
}

model SupportTeam {
  id              Int       @id @default(autoincrement())
  teamCode        String    @unique
  name            String
  
  category        String    // 'TIER_1' | 'TIER_2' | 'ENGINEERING' | 'BILLING' | 'FIELD_SERVICE'
  
  memberUserIds   String[]
  managerUserId   String?
  
  defaultSlaResponseMinutes Int @default(120)
  defaultSlaResolutionMinutes Int @default(2880)
}

model KbArticle {
  id              Int       @id @default(autoincrement())
  articleCode     String    @unique
  
  title           String
  category        String
  
  content         String    @db.Text
  videoUrl        String?
  
  language        String    @default("ar")
  
  status          String    @default("DRAFT")  // DRAFT | PUBLISHED | ARCHIVED
  publishedAt     DateTime?
  
  views           Int       @default(0)
  helpfulCount    Int       @default(0)
  notHelpfulCount Int       @default(0)
  
  authorUserId    String
  
  relatedTicketIds Int[]    // tickets that helped craft this article
  productIds      Int[]
}

model CSATResponse {
  id              Int       @id @default(autoincrement())
  ticketId        Int       @unique
  
  score           Int       // 1-5
  npsScore        Int?      // 0-10 separate question
  feedback        String?   @db.Text
  
  channelOfResponse String?
  respondedAt     DateTime  @default(now())
}
```

---

## 6) Forms (8)

A: Ticket Creation (multi-channel)
B: Ticket Assignment
C: Comment / Reply (with channel routing)
D: Status Change (with reason)
E: Escalation
F: Resolution (type + description)
G: KB Article Creation
H: CSAT Survey

---

## 7) Tables

A: Tickets Queue (per agent + filters)
B: SLA Status (red/yellow/green per ticket)
C: Team Workload
D: Resolution Time Analysis
E: Top Issues (recurring)
F: KB Articles + Performance
G: CSAT Trend
H: Customer 360 (tickets per customer)

---

## 8) Buttons

| ID | الزر | المرحلة |
|----|------|---------|
| btn-i2r-create | + تذكرة | 1 |
| btn-i2r-assign | إسناد | 2 |
| btn-i2r-reply | رد | comments |
| btn-i2r-escalate | تصعيد | mid |
| btn-i2r-merge | دمج تذاكر | duplicate |
| btn-i2r-link-fs | + خدمة ميدانية | resolution |
| btn-i2r-link-rma | + RMA | resolution |
| btn-i2r-create-replacement | + بديل | resolution |
| btn-i2r-refund | استرداد | resolution |
| btn-i2r-resolve | حل | resolution |
| btn-i2r-close | إغلاق | end |
| btn-i2r-reopen | إعادة فتح | reopen |
| btn-i2r-csat-send | إرسال استطلاع | post-close |
| btn-i2r-kb-create | + مقال KB | learning |
| btn-i2r-customer-compensate | تعويض العميل | resolution |

---

## 9) Reports

- Ticket Volume Trend
- First Response Time
- Resolution Time
- SLA Compliance %
- CSAT Trend
- Agent Performance
- Top Issues by Category
- Recurring Customer Issues
- KB Article Effectiveness
- Channel Distribution

---

## 10) Notifications

- Ticket assigned
- SLA approaching breach
- SLA breached
- Customer responded
- Status changed
- Escalated
- Resolved
- Reopened
- CSAT received
- Critical P1 (immediate)

---

## 11) Permissions

| Action | Agent | Sup | Mgr | Customer |
|--------|-------|-----|-----|----------|
| View own tickets | ✓ | ✓ | ✓ | ✓ |
| View team | ✗ | ✓ | ✓ | ✗ |
| Create | ✓ | ✓ | ✓ | ✓ |
| Assign | ✗ | ✓ | ✓ | ✗ |
| Escalate | ✓ | ✓ | ✓ | ✗ |
| Resolve | ✓ own | ✓ | ✓ | ✗ |
| Close | ✓ own | ✓ | ✓ | ✓ own |
| Refund (large) | ✗ | ✗ | ✓ | request |
| KB articles | ✗ | ✓ | ✓ | ✗ |

---

## 12) Integrations

- Email parsers (auto-create from inbox)
- Phone systems (CTI integration)
- WhatsApp Business
- Live chat platforms
- Helpdesk software (Zendesk if migrating)
- AI classification (OpenAI/Gemini)
- Field service (#36)
- RMA system (Q2C #1)
- Knowledge management

---

## 13) Tests

```typescript
describe('I2R Cycle', () => {
  test('multi-channel intake creates ticket')
  test('AI classification routes correctly')
  test('SLA timer starts on creation')
  test('auto-escalation on SLA breach')
  test('field service link integrates')
  test('RMA refund integration')
  test('KB self-help reduces tickets')
  test('CSAT collected post-resolution')
})
```

---

## 14) Edge Cases

| Case | Behavior |
|------|----------|
| Customer escalates to legal | special handling + record |
| Ticket from non-customer (fraud) | flag + investigate |
| Multiple tickets same issue | merge |
| Customer reopens after resolve | new ticket vs reopen decision |
| Agent leaves with open tickets | reassign |
| Critical P1 outside business hours | on-call rotation |
| Customer doesn't respond 30 days | auto-close + notify |
| Service contract expires mid-ticket | continue or T&M |

---

## 15) إحصائيات BPF #8

- 7 موديولات • 12 stages • CSAT loop
- 6 جداول schema • 8 forms • 8 grids • 15 buttons cross-module
- 8 سيناريوهات + 2 sad paths

---

**انتهى BPF #8 / 8 (الأخير).**
