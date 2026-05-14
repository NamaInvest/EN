# 62 - خارطة الطريق المستقبلية (Future Roadmap)

> الميزات القادمة + الديون التقنية + الرؤية الاستراتيجية

---

## 🎯 الرؤية الاستراتيجية

### الـ Vision:
> "أن نصبح ERP السعودي الأول، منافسة SAP/Oracle/NetSuite بالسعر والدعم المحلي والامتثال السعودي"

### الـ Mission:
> "تمكين الشركات السعودية من النمو بنظام محاسبي شامل، سهل الاستخدام، متوافق 100% مع الأنظمة السعودية"

### الـ Goals (3-5 سنوات):
- **Year 1-2:** الوصول لـ 500+ tenant
- **Year 3:** الوصول لـ 2000+ tenant
- **Year 5:** Regional expansion (الخليج)

---

## 📅 Roadmap الـ Phases

### Phase 0 (الحالي — Foundation):
**Q1-Q2 2026:**
- ✅ Multi-tenant Phase 2 (DB per tenant)
- ✅ ZATCA Phase 2
- ✅ POS (Retail + Restaurant)
- 🟡 Period Close Engine الكامل
- 🟡 Numbering Engine المتقدم
- 🟡 Document State Machine
- 🟡 Audit Trail Field-Level
- 🟡 Approval Workflow Builder

---

### Phase 1 (Q3-Q4 2026 — Advanced Accounting):

#### Multi-GAAP / Multi-Book:
- IFRS + US GAAP + Local books
- Per-tenant book selection
- Currency translation rules

#### Inter-Company Eliminations:
- IC transactions automated
- Consolidated statements
- Currency translation
- Minority interest

#### Recurring JE:
- Templates
- Auto-generate
- Approval workflow

#### Allocations Engine الكامل:
- Multi-step allocations
- Statistical drivers
- What-if simulations

#### Revenue Recognition (IFRS 15):
- 5-step model
- Contract liability
- Variable consideration

---

### Phase 2 (Q1-Q2 2027 — AR/AP & Treasury):

#### Sub-Ledger Accounting (SLA):
- Open items management
- Aging accurate
- Auto-clearing

#### Payment Terms المتقدمة:
- 2/10 Net 30
- Multiple installments
- Down payments

#### Cash Application Engine:
- Auto-match payments to invoices
- ML-based suggestions
- Discount/penalty handling

#### Dunning المتقدم:
- Multi-level (1-5)
- Multi-channel (Email + SMS + WhatsApp + Phone)
- Auto-escalation
- Legal action integration (Najiz)

#### Three-Way Match المحسّن:
- Configurable tolerances
- Approval thresholds
- Auto-block payment if mismatch

#### Bank Reconciliation Auto-Match:
- AI-powered
- Open Banking integration
- Real-time matching

#### Cash Forecasting المتقدم:
- ML predictions
- Scenario planning
- Sensitivity analysis

#### Open Banking SA:
- API integration with major banks
- Direct payments
- Live balance feeds

---

### Phase 3 (Q3-Q4 2027 — Assets, Manufacturing, HR):

#### Fixed Assets الكامل:
- CWIP (Construction in Progress)
- Multiple depreciation methods (SL/DDB/SYD/UOP)
- Asset impairment IAS 36
- Disposal accounting
- Insurance integration
- Component depreciation
- Asset transfer between tenants (Inter-co)

#### IFRS 16 الكامل:
- Lease modifications
- Sublease accounting
- Lease incentives
- Reassessment

#### Manufacturing المتقدم:
- Standard Costing الكامل
- Variance Analysis (Price, Usage, Efficiency, Volume)
- Co-Products & By-Products
- Subcontracting الكامل
- ECO (Engineering Change Order)
- PLM (Product Lifecycle Management)

#### HR Provisioning Engine:
- EOS Actuarial (real)
- Multi-country payroll
- Compensation reviews
- Succession planning
- Org chart المتقدم

#### WPS API Integration:
- مباشر مع Mudad
- لا upload يدوي

#### GOSI Direct Integration:
- Auto-submission
- Real-time validation

#### Qiwa Integration:
- Contract management
- Visa processing
- Transfer of sponsorship

---

### Phase 4 (2028 — Intelligence & Scale):

#### AI Advanced:
- **Fine-tuned models** للسعودية
- **Custom AI assistants** per tenant
- **Predictive analytics** (sales, inventory, cash flow)
- **Anomaly detection** متقدم
- **Document understanding** (contracts, invoices)
- **Voice interface** (Arabic)
- **Automation** بـ no-code

#### Workflow Builder (BPMN):
- Drag-and-drop
- Visual programming
- Custom logic
- Multi-step approvals
- Conditional routing

#### Advanced Reporting:
- BI Cube الكامل
- Pivot tables
- Custom dashboards
- Data warehouse
- Real-time analytics
- Mobile dashboards

#### Mobile Apps الكامل:
- iOS + Android native
- All features available
- Offline-first
- Push notifications

#### High Availability (HA):
- Multi-server architecture
- Active-Active replication
- Auto-failover
- 99.99% uptime SLA

#### Multi-Region:
- Saudi (primary)
- UAE (secondary)
- Egypt (tertiary)
- Compliance per region

#### Marketplace:
- 3rd-party apps
- Add-ons
- Integrations marketplace
- Developer SDK

---

### Phase 5 (2029+ — Vision):

#### AI-First ERP:
- Conversational interface
- Predictive autopilot
- Self-healing systems
- Auto-optimization

#### Industry Specializations:
- Healthcare (deep clinic)
- Education (deep school)
- Real Estate (deep)
- Construction (deep)
- Manufacturing (vertical-specific)

#### Embedded Banking:
- Built-in banking services
- Direct loans
- Trade finance
- Treasury management

#### Embedded Insurance:
- Auto policies
- Health insurance
- Asset insurance

#### Carbon & ESG:
- Carbon footprint tracking
- ESG reporting
- Sustainability dashboards

#### Web3 & Blockchain:
- Smart contracts
- Supply chain tracking
- Tokenized assets (regulatory permitting)

---

## 💸 Technical Debt المعروفة

### Critical (يحتاج معالجة قريبة):

#### 1. Multi-Book Accounting (مفقود):
- Impact: شركات international لا تستطيع استخدام النظام
- Effort: 6+ شهور
- ROI: عالي

#### 2. Universal Journal Pattern:
- Issue: كل source له auto-journal منفصل
- Impact: تكرار كود + صعوبة الصيانة
- Effort: 3-4 شهور
- ROI: متوسط (refactor)

#### 3. Sub-Ledger Open Items:
- Issue: لا open items framework
- Impact: AR/AP aging غير دقيق
- Effort: 4-5 شهور
- ROI: عالي

#### 4. Workflow Engine الكامل:
- Issue: approvals متناثرة
- Impact: صعوبة التخصيص
- Effort: 6+ شهور
- ROI: عالي

#### 5. Test Coverage:
- Current: ~30-40%
- Target: 80%+
- Effort: مستمر
- ROI: عالي (تجنب bugs)

### Medium (للتحسين):

#### 6. Performance:
- Some queries slow
- Need indexes
- Need caching
- Effort: 1-2 شهور

#### 7. Mobile UX:
- Some screens not optimized
- Need responsive design audit
- Effort: 2-3 شهور

#### 8. Documentation:
- API docs incomplete
- User docs limited
- Internal docs scattered
- Effort: 2 شهور

### Low (Nice to have):

#### 9. Localization:
- English partial
- Other Arabic dialects
- Effort: 1 شهر

#### 10. Theming:
- More themes
- Custom branding
- Effort: 2 أسابيع

---

## 📊 Module Completion Targets

### 1 Year Targets:
| الموديول | الحالي | الهدف |
|---|---|---|
| ZATCA | 84% | 95% |
| المحاسبة | 65% | 85% |
| التقارير | 50% | 80% |
| HR/Payroll | 45% | 75% |
| التصنيع | 40% | 70% |
| AR/AP | 35% | 75% |
| المخزون | 34% | 75% |
| الخزينة | 25% | 70% |
| الأصول | 18% | 70% |
| Saudi Compliance | 18% | 80% |
| **Overall** | **37%** | **75%** |

---

## 💰 Investment Required

### Team Growth:
- **2026:** Hire 5 (total 10)
- **2027:** Hire 10 (total 20)
- **2028:** Hire 15 (total 35)

### Infrastructure:
- **2026:** 50K SAR/year
- **2027:** 150K SAR/year
- **2028:** 500K SAR/year (multi-region)

### Total 3-year Budget:
- **Salaries:** 10-15M SAR
- **Infrastructure:** 1-2M SAR
- **Marketing:** 2-5M SAR
- **R&D:** 2-3M SAR
- **Total:** 15-25M SAR

### Revenue Targets:
- **2026:** 5-10M SAR ARR
- **2027:** 20-40M SAR ARR
- **2028:** 50-100M SAR ARR

---

## 🎯 Key Milestones

### Q1 2026:
- [ ] Period Close Engine الكامل
- [ ] Numbering Engine
- [ ] Audit Trail Field-Level
- [ ] 100 paying tenants
- [ ] الـ Saudi CPA certification

### Q2 2026:
- [ ] Approval Workflow Builder
- [ ] AR/AP المتقدم
- [ ] 200 paying tenants

### Q3 2026:
- [ ] Multi-Book Accounting
- [ ] Revenue Recognition IFRS 15
- [ ] 350 paying tenants

### Q4 2026:
- [ ] Inter-Company
- [ ] Consolidation
- [ ] 500 paying tenants
- [ ] الـ Series A Funding

### 2027:
- [ ] Cash Application Engine
- [ ] Open Banking integration
- [ ] WPS API direct
- [ ] Mobile apps launch
- [ ] 1000 tenants

### 2028:
- [ ] Fixed Assets الكامل
- [ ] Manufacturing الكامل
- [ ] AI Advanced features
- [ ] HA Infrastructure
- [ ] 2000 tenants

### 2029:
- [ ] Multi-region
- [ ] UAE expansion
- [ ] Marketplace
- [ ] 5000 tenants

---

## 🚀 Innovation Pipeline

### الـ R&D Projects:

#### 1. AI Agent للمحاسبة:
- Autonomous accountant
- يحل problems
- يجد errors
- يقترح تحسينات

#### 2. Voice ERP:
- "أنشئ فاتورة لأحمد بمنتج X كمية 5"
- يستجيب بالعربي
- يدعم لهجات سعودية

#### 3. AR للجرد:
- Augmented Reality
- توجيه العامل في المستودع
- جرد بصري متقدم

#### 4. Blockchain للـ Audit Trail:
- Immutable records
- توثيق قانوني
- شفافية كاملة

#### 5. Quantum-Ready:
- Post-quantum cryptography
- للمستقبل البعيد
- ZATCA compliance future

---

## 📈 الـ Competition Strategy

### المنافسين:
- **SAP/Oracle/NetSuite** — high-end, expensive
- **Onyx Pro** — local, basic
- **QuickBooks** — small, not Saudi-compliant
- **Zoho** — affordable, generic
- **Wafeq** — Saudi, growing

### ميزتنا التنافسية:
- ✅ **سعودي 100%** (ZATCA, GOSI, WPS, EOS مدمج)
- ✅ **AI-Native** (Copilot, CFO, Auditor)
- ✅ **سعر متوسط** (5x أرخص من NetSuite)
- ✅ **Desktop + Web** (مرونة)
- ✅ **Arabic-first**
- ✅ **حلول قطاعية** (Pharmacy, Clinic, School, Restaurant)
- ✅ **Multi-tenant true SaaS**

### استراتيجية الدخول:
1. **Land:** SMEs (الأكثر استعداداً للتبني)
2. **Expand:** Mid-market
3. **Conquer:** Enterprise (مع reference accounts)

---

## 🎓 Education & Marketing

### للسوق:
- محتوى تعليمي عربي عن ERP
- Webinars شهرية
- Case studies من العملاء
- Certified partners
- ZATCA-certified consultants

### للفريق:
- Internal training
- Conferences (مثل GITEX)
- Hackathons
- Open source contributions

---

## 🔄 الـ Continuous Improvement

### المبادئ:
1. **Customer-driven** — كل feature له طلب عميل
2. **Data-driven** — استخدام الـ analytics للقرارات
3. **Quality first** — لا تسريع على حساب الجودة
4. **Saudi-first** — كل ميزة تأخذ بعين الاعتبار السعودية
5. **AI-native** — كل feature يستخدم AI إن أمكن

### الـ Process:
- 2-week sprints
- Quarterly OKRs
- Annual planning
- Regular retrospectives

---

## ⚠️ Risks

### Technical Risks:
- Multi-tenant complexity
- DB performance at scale
- AI cost management
- Security threats

### Business Risks:
- Competition (big players)
- Regulation changes (ZATCA, PDPL)
- Customer churn
- Talent acquisition

### Mitigation:
- Strong tech foundations
- Compliance focus
- Customer success obsession
- Talent strategy

---

## 🎯 Success Metrics

### Customer:
- NPS > 50
- Churn < 5% annually
- CSAT > 4.5/5

### Business:
- MRR growth > 10%/month
- LTV/CAC > 3x
- Gross margin > 70%

### Product:
- Feature velocity (releases/month)
- Bug rate
- Time-to-fix
- Test coverage

### Tech:
- Uptime 99.9%
- Performance (P95 < 500ms)
- Security incidents (0 critical/year)
- Tech debt ratio
