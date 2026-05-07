# 03 — الفجوات العالمية P2 + P3

> 78 بنداً. تفصيل أقل (تعريف + برومنت موجز).
> تنفّذ بعد إنهاء P0+P1 أو حسب الطلب من العملاء.

---

## P2 — Medium Priority (52 بند)

| # | الميزة | في | البرومنت |
|---|---|---|---|
| P2-01 | Hedging & Treasury Risk (FX/Commodity/Rate) | SAP TRM, Oracle Risk Cloud | `/erp-build-feature treasury-hedging` — Forwards/Swaps/Options accounting per IFRS 9 + MTM revaluation + hedge effectiveness testing |
| P2-02 | Transfer Pricing & Intercompany Documentation | SAP, Oracle | `/erp-build-feature transfer-pricing` — TP policies + BEPS/CbCR + Master/Local file generation |
| P2-03 | Disclosure Management | SAP, Oracle Narrative | `/erp-build-feature disclosure-mgmt` — Authoring of board reports with linked figures + XBRL tagging |
| P2-04 | Tax Provisioning (Current + Deferred) | Oracle TRCS | `/erp-build-feature tax-provision` — IAS 12 calc + ETR rec + uncertain positions |
| P2-05 | Demand Sensing / Statistical Forecast | SAP IBP DS | `/erp-build-feature demand-sensing` — ML forecast using POS + weather + promo + holiday signals |
| P2-06 | Multi-Echelon Inventory Optimization (MEIO) | SAP IBP, Oracle | `/erp-build-feature meio` — Safety stock optimization across DC/branch/store |
| P2-07 | Trade Promotion Mgmt (TPM) & Rebates | SAP TPM, Oracle | `/erp-build-feature tpm-rebates` — Promotion plans + rebate accruals + claim processing |
| P2-08 | Strategic Sourcing & e-Auctions | SAP Ariba, Oracle | `/erp-build-feature strategic-sourcing` — RFI/RFP/RFQ + reverse auction + weighted scoring |
| P2-09 | Catalog Management & Punchout (cXML/OCI) | Ariba, Oracle SS | `/erp-build-feature procurement-punchout` — Internal catalog + cXML/OCI session handler |
| P2-10 | Engineering Change Management (ECM/ECO) | SAP ECM, Agile | `/erp-build-feature ecm-eco` — ECR→ECO→ECN workflow + impact analysis |
| P2-11 | Recipe / Process Manufacturing | SAP PI, Oracle OPM | `/erp-build-feature recipe-mfg` — Formulas + co-products + by-products + scaled batch |
| P2-12 | Quality SPC Control Charts | SAP QM SPC | `/erp-build-feature qm-spc` — X-bar R, p, c charts + Cp/Cpk + Western Electric rules |
| P2-13 | Quality CAPA Workflow | SAP QM, Oracle | `/erp-build-feature qm-capa` — NCR linked to CAPA + RCA + action plans + verification |
| P2-14 | Calibration of Instruments | SAP PM, Oracle | `/erp-build-feature qm-calibration` — Instrument master + cal schedule + records + alerts |
| P2-15 | Allocations Engine (Multi-Step, Reciprocal) | SAP CO Cycles | `/erp-build-feature allocations-engine` — Driver-based + step-down + reciprocal + preview |
| P2-16 | Customer Credit Risk Scoring | SAP FSCM | `/erp-build-feature credit-scoring` — Internal score + Simah field + auto-recalc |
| P2-17 | Murabaha / Sukuk Loan Mgmt | Custom | `/erp-build-feature islamic-finance` — Murabaha cost+profit + Sukuk coupon + Tawarruq + Sharia accounting |
| P2-18 | OEE Drill-Down (Availability × Performance × Quality) | SAP DM | `/erp-build-feature oee-drilldown` — Loss tree + Pareto + target vs actual |
| P2-19 | Goals/OKR Cascade & Continuous Performance | SuccessFactors, Oracle | `/erp-build-feature okr-performance` — Org→Team→Individual goals + check-ins + 9-box |
| P2-20 | Shift Bidding & Self-Service Swap | Kronos, Workday | `/erp-build-feature shift-bidding` — Open-shift board + bidding + peer swap |
| P2-21 | Workforce Scheduling / Labor Forecast | Oracle WFM | `/erp-build-feature labor-scheduling` — Demand-driven shifts + skills + fatigue rules |
| P2-22 | Learning Management System (LMS) | SuccessFactors LMS | `/erp-build-feature lms-full` — Course catalog + SCORM + certifications + HRDF tracking |
| P2-23 | SOX / Internal Controls (ICFR) | SAP GRC PC, Oracle | `/erp-build-feature sox-controls` — Control library + testing + deficiency tracking |
| P2-24 | Internal Audit Management | SAP Audit, AuditBoard | `/erp-build-feature internal-audit-mgmt` — Audit universe + plan + workpapers + findings |
| P2-25 | Trade Compliance / GTS | SAP GTS, Oracle GTM | `/erp-build-feature trade-compliance` — HS classification + license mgmt + RPS + GAFTA/GCC origin |
| P2-26 | Project Manufacturing / ETO | SAP PS+CO+PP | `/erp-build-feature project-mfg-eto` — Project BOM + segregated stock + WIP capitalization |
| P2-27 | Real Estate Sales-Overage Rent | Yardi, MRI | `/erp-build-feature percentage-rent` — Tenant sales reporting + breakpoint + overage calc |
| P2-28 | Returns Management Engineering | SAP, Oracle | `/erp-build-feature reverse-logistics` — RMA disposition + defect analysis + recovery |
| P2-29 | Loyalty Programs Full | SAP Emarsys, Oracle | `/erp-build-feature loyalty-full` — Tiers + redemptions + accrual liability |
| P2-30 | E-commerce Connectors (Salla/Zid + Bayan) | Custom | `/erp-build-feature saudi-ecom-connectors` — full bidirectional sync + reconciliation |
| P2-31 | iPaaS / API Gateway with Rate Limit Mgmt | MuleSoft, OIC | `/erp-build-feature api-gateway` — Centralized API key + rate limit + monitoring |
| P2-32 | Field-Level Permissions (Row + Cell) | SAP, Oracle | `/erp-build-feature field-permissions-full` — Extend FieldPermission to row-level + cell-level |
| P2-33 | Vendor KYC Onboarding | SAP Ariba SLP | `/erp-build-feature vendor-kyc` — Self-service signup + doc upload + sanctions check |
| P2-34 | IFRS 9 ECL Forward-Looking Macros | SAP FPSL | `/erp-build-feature ecl-macros` — Macro variables (oil, GDP, CPI) + scenario weighting |
| P2-35 | Anomaly Detection & Predictive Alerts | SAP SAC | `/erp-build-feature ai-anomaly-alerts` — ML watching KPIs + auto alerts on anomalies |
| P2-36 | BPMN Workflow Designer (visual) | SAP BPM, Oracle BPM | `/erp-build-feature bpmn-designer` — Visual workflow editor + execution engine |
| P2-37 | Drop-Ship Order Routing | NetSuite | `/erp-build-feature dropship-orchestration` — Auto-create supplier PO + ASN + 3-way reconciliation |
| P2-38 | Consignment Inventory (Vendor at Customer) | SAP MM | `/erp-build-feature consignment-inventory` — Stock at customer + bill on consumption + VMI |
| P2-39 | Quote Versioning & Win/Loss Analysis | NetSuite, Dynamics | `/erp-build-feature quote-versioning` — Revision history + win/loss reasons + competitor field |
| P2-40 | Subscription Mid-Cycle Changes | NetSuite SuiteBilling | `/erp-build-feature subscription-changes` — Upgrade/downgrade + proration + revenue auto-adjust |
| P2-41 | Customer Statement with Disputes | SAP FSCM | `/erp-build-feature ar-disputes` — Dispute reason per invoice + dispute aging |
| P2-42 | Maverick Spend Analysis | SAP, Coupa | `/erp-build-feature maverick-spend` — Off-PO + off-contract reporting |
| P2-43 | Wave Picking & Cartonization | SAP EWM | `/erp-build-feature wave-cartonization` — Wave creation + cartonization algo + labels |
| P2-44 | Multi-UoM Catch-Weight | Oracle OPM, SAP CW | `/erp-build-feature catch-weight` — Sold-by-weight stocked-by-piece + dual UoM costing |
| P2-45 | Co-Products & By-Products in BOM | SAP PP-PI, Oracle OPM | `/erp-build-feature coproducts-byproducts` — BOM line types + cost split rules |
| P2-46 | Activity-Based Costing (ABC) | SAP CO-ABC | `/erp-build-feature abc-costing` — Activities + drivers + overhead allocation |
| P2-47 | Background Check & Pre-Hire | SuccessFactors, Workday | `/erp-build-feature background-check` — Provider integration + checklist + offer-conditional |
| P2-48 | Channel Partner Management | SAP, Oracle | `/erp-build-feature channel-partners` — Partner master + tiered pricing + co-marketing |
| P2-49 | Knowledge Base & AI Deflection | Salesforce, Zendesk | `/erp-build-feature knowledge-base-ai` — KB articles + AI chatbot + deflection metric |
| P2-50 | Vendor Risk Monitoring | SAP, Coupa | `/erp-build-feature vendor-risk-monitoring` — Risk scoring + monitoring + alerts |
| P2-51 | Total Rewards Statement | SuccessFactors TRS | `/erp-build-feature total-rewards-statement` — PDF/portal showing employee total package |
| P2-52 | Vendor-Managed Inventory (VMI) | SAP, Oracle | `/erp-build-feature vmi-full` — Stock at customer + supplier-driven replenishment |

---

## P3 — Low Priority (26 بند)

| # | الميزة | في | البرومنت موجز |
|---|---|---|---|
| P3-01 | Dynamic Discounting & Supply Chain Finance | SAP Ariba Pay | Sliding-scale early payment + bank-funded factoring |
| P3-02 | Asset Performance Mgmt (APM) / Predictive Maintenance | SAP APM, IBM Maximo | IoT ingestion + RUL prediction + FMEA |
| P3-03 | Product Lifecycle Mgmt (PLM) Full | SAP PLM, Agile | CAD integration + NPI workflow + regulatory |
| P3-04 | Yard Management & Dock Scheduling | SAP YL | Trailer check-in + yard locations + dock appointments |
| P3-05 | Voice Picking / Pick-to-Light | SAP EWM | Voice-directed picking + light-directed |
| P3-06 | Andon Real-Time Issue Escalation | SAP DM Andon | Operator call buttons + escalation timer |
| P3-07 | Returnable Packaging / Pallet Tracking | SAP RTI | Container master + dispatch/return + deposit |
| P3-08 | 360-Degree Feedback | SuccessFactors 360 | Reviewer pool + anonymous survey + reports |
| P3-09 | Succession & Talent Mgmt | SuccessFactors | 9-box + successors + career paths + IDPs |
| P3-10 | Whistleblower / Ethics Hotline | NAVEX, EthicsPoint | Anonymous channel + case mgmt |
| P3-11 | Higher Ed / School Mgmt Full SIS | Oracle PeopleSoft | Admissions + programs + grades + financial aid |
| P3-12 | Healthcare / Hospital Mgmt (HIS) | Cerner, Epic | EMR + OPD/IPD + pharmacy + lab + NPHIES |
| P3-13 | Public Sector / Fund Accounting | SAP PSM, Oracle PS | Fund accounting + encumbrance + grant mgmt |
| P3-14 | Banking & Insurance Verticals | SAP Banking, Temenos | Loan/Murabaha origination + deposit + claims |
| P3-15 | ESG / Sustainability Reporting | SAP SCT, Workiva | Scope 1/2/3 GHG + GRI/SASB/CSRD reports |
| P3-16 | Insurance Claims / Self-Insurance | SAP, Oracle | Multi-policy program + claims + recoveries |
| P3-17 | Punchout Catalogs (cXML/OCI) | Ariba | Already in P2-09 partially |
| P3-18 | Rebate Agreements (Volume Tiers) | SAP, Oracle | Already in P2-07 partially |
| P3-19 | Slotting Optimization | SAP EWM | Bin-velocity + recommended slot |
| P3-20 | Dock Door Scheduling | SAP YL | Already in P3-04 |
| P3-21 | Fleet Fuel Card Integration | Custom | WAFI/Petromin transaction import |
| P3-22 | Fixed Assets Insurance Linkage | SAP EAM | Insurance per asset + premium allocation |
| P3-23 | Component Accounting (already P1-22) | — | covered |
| P3-24 | Omnichannel Order Mgmt (BOPIS) | NetSuite SuiteCommerce | Order capture in any channel + ship-from-store |
| P3-25 | Brand/Restaurant: Online Reservations Engine | OpenTable-like | Multi-restaurant booking + table mgmt |
| P3-26 | DAM (Digital Asset Management) | OpenText, Bynder | Image/video library + brand assets + licensing |

---

## كيف تستخدم هذا الملف

كل سطر في الجدول يحتوي على البرومنت الموجز. عندما تحتاج التفاصيل:

```
استخدم البرومنت الموجز + خذ Schema/UI/Logic مرجعياً من P0/P1 المماثل
أو: اطلب مني توسيعه بـ /erp-build-feature [name]
```

**ملاحظة:** ميزات P2/P3 لا تنفذها قبل P0/P1 إلا إذا كان عميلك يطلبها بصفتها مفصلية.

→ تابع في `04_SAUDI_GAPS.md` للامتثال السعودي.
