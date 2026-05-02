# 🚀 Nama ERP - The Global Enterprise Roadmap Documentation
# 🚀 نظام نماء لإدارة موارد المؤسسات - وثيقة خارطة الطريق العالمية

*Version 9.3 (Enterprise Edition) | الإصدار 9.3 (نسخة الشركات الكبرى)*
*Generated on: 2024 | تاريخ الإصدار: 2024*

This document serves as the comprehensive guide and architectural overview of the **Nama ERP** system following the completion of the Global Enterprise Master Roadmap. 
تعتبر هذه الوثيقة دليلاً شاملاً ونظرة معمارية عامة لنظام **نماء ERP** بعد اكتمال خارطة الطريق العالمية لنسخة الشركات الكبرى.

---

## 📖 Table of Contents | الفهرس
1. [Introduction | مقدمة](#1-introduction--مقدمة)
2. [Architectural Overview | النظرة المعمارية](#2-architectural-overview--النظرة-المعمارية)
3. [Phase A: Saudi HR Compliance | المرحلة أ: نظام الموارد البشرية والامتثال السعودي 🇸🇦](#3-phase-a-saudi-hr-compliance--المرحلة-أ-نظام-الموارد-البشرية-والامتثال-السعودي-)
4. [Phase B: Treasury Excellence | المرحلة ب: إدارة الخزينة والبنوك 🏦](#4-phase-b-treasury-excellence--المرحلة-ب-إدارة-الخزينة-والبنوك-)
5. [Phase C: AR/AP Mastery | المرحلة ج: إدارة الموردين والعملاء 🤝](#5-phase-c-arap-mastery--المرحلة-ج-إدارة-الموردين-والعملاء-)
6. [Phase D: Manufacturing | المرحلة د: التصنيع وحساب التكاليف 🏭](#6-phase-d-manufacturing--المرحلة-د-التصنيع-وحساب-التكاليف-)
7. [Phase E: IFRS Governance | المرحلة هـ: الامتثال المالي الدولي 📊](#7-phase-e-ifrs-governance--المرحلة-هـ-الامتثال-المالي-الدولي-)
8. [Phase F: Enterprise BPM | المرحلة و: محرك سير العمل والاعتمادات ⚙️](#8-phase-f-enterprise-bpm--المرحلة-و-محرك-سير-العمل-والاعتمادات-)
9. [Deployment | الرفع والتشغيل 🐳](#9-deployment--الرفع-والتشغيل-)

---

## 1. Introduction | مقدمة
**English:** Nama ERP has evolved from a standard POS and accounting tool into a full-scale Enterprise Resource Planning (ERP) giant. It is designed to rival international systems like SAP and Oracle NetSuite, while offering deep native localization for the Saudi Arabian market (ZATCA, GOSI, WPS, Mudad).

**عربي:** تطور نظام نماء من مجرد نقطة بيع وبرنامج محاسبي تقليدي إلى عملاق أنظمة تخطيط موارد المؤسسات (ERP). تم تصميمه لينافس الأنظمة العالمية مثل SAP و Oracle NetSuite، مع تقديم دعم وتوطين عميق وحصري للسوق السعودي (ضريبة القيمة المضافة ZATCA، التأمينات GOSI، حماية الأجور WPS، منصة مدد).

---

## 2. Architectural Overview | النظرة المعمارية
**English / عربي:**
- **Core Framework (إطار العمل الأساسي):** Next.js (React) App Router for Frontend & API.
- **Database (قاعدة البيانات):** PostgreSQL + Prisma ORM (handling 150+ tables | إدارة أكثر من 150 جدول).
- **Styling (واجهة المستخدم):** TailwindCSS + Shadcn/UI.
- **Data Safety (أمان البيانات):** Fully transactional financial entries ensuring absolute immutability and IFRS compliance (قيود مالية غير قابلة للتعديل لضمان التوافق مع المعايير الدولية).
- **Infrastructure (البنية التحتية):** Docker-ready, standalone output (جاهز للحاويات والرفع السحابي).

---

## 3. Phase A: Saudi HR Compliance | المرحلة أ: نظام الموارد البشرية والامتثال السعودي 🇸🇦
**English:** Ensuring 100% legal compliance with Saudi labor laws.
**عربي:** ضمان الامتثال القانوني بنسبة 100% لنظام العمل السعودي.

- **WPS Generator (نظام حماية الأجور) (`wps-generator.ts`)**
  - Generates `SIF_V2` format files acceptable by SAMA and Mudad. (يولد ملفات SIF المعتمدة لدى البنك المركزي ومدد).
  - Validates IBAN formats (يتحقق من صحة الآيبان).
  
- **GOSI Engine v2 (محرك التأمينات الاجتماعية) (`gosi-engine.ts`)**
  - Automates 2024 calculations (19% Saudis, 2% non-Saudis). (حساب آلي للتأمينات: 19% للسعودي و 2% أخطار لغير السعودي).
  - Validates limits (1,500 - 45,000 SAR) (يتأكد من السقف الأدنى والأعلى للأجور).

- **End-of-Service (EOS) (مكافأة نهاية الخدمة)**
  - Calculates accruals based on Article 84 of the Saudi Labor Law. (احتساب المخصصات بناءً على المادة 84 من نظام العمل).

---

## 4. Phase B: Treasury Excellence | المرحلة ب: إدارة الخزينة والبنوك 🏦
**English:** Eradicating manual bank statement entry and cash flow guesswork.
**عربي:** القضاء على الإدخال اليدوي لحركات البنوك والتخمين في التدفقات النقدية.

- **Bank Statement Parser (قارئ كشوفات الحساب) (`bank-statement-importer.ts`)**
  - Parses MT940 and CSV statements. (قراءة ملفات MT940 الدولية للبنك).

- **Auto-Bank Recon Engine (محرك التسوية البنكية الآلي) (`bank-recon-engine.ts`)**
  - Matches bank lines to GL transactions (±3 days). (يطابق حركات البنك مع القيود الدفترية آلياً).
  - Applies automated rules for bank charges. (قواعد آلية لرمي الرسوم البنكية على المصروفات).

- **Cash Flow Forecaster (التنبؤ بالتدفقات النقدية)**
  - Predicts liquidity using AP/AR and payroll dues. (يتنبأ بالسيولة بناءً على فواتير الموردين والعملاء والرواتب).

---

## 5. Phase C: AR/AP Mastery | المرحلة ج: إدارة الموردين والعملاء 🤝
**English:** Preventing overpayments and ensuring strong debt collection.
**عربي:** منع الدفعات الزائدة وضمان تحصيل الديون بكفاءة.

- **Three-Way Matching (المطابقة الثلاثية) (`three-way-match.ts`)**
  - Validates Purchase Invoice ↔ PO ↔ GRN. (يطابق فاتورة المورد مع أمر الشراء وإيصال الاستلام).
  - Configurable tolerances blocks payments on huge variance. (يوقف دفع الفواتير التي تتجاوز نسبة السماحية).

- **Dunning Letters (إشعارات الديون والتأخير) (`dunning-engine.ts`)**
  - Multi-level escalation for overdue accounts. (تصعيد إشعارات متدرج للعملاء المتأخرين).
  - Auto-generates late fees and blocks accounts. (يفرض غرامات تأخير ويحظر حساب العميل المتعثر آلياً).

---

## 6. Phase D: Manufacturing | المرحلة د: التصنيع وحساب التكاليف 🏭
**English:** Supporting complex production processes.
**عربي:** دعم عمليات الإنتاج والتصنيع المعقدة.

- **BOM Engine (محرك قائمة المواد)**
  - Tracks raw material, labor, and overhead. (يتتبع تكلفة المواد الخام، العمالة، والمصاريف الإضافية).
- **Perpetual Costing (الجرد المستمر والتكلفة)**
  - Auto-posts Inventory Valuation & COGS journals. (ينشئ قيود تكلفة البضاعة المباعة وتقييم المخزون آلياً لحظة الاستلام أو التسليم).

---

## 7. Phase E: IFRS Governance | المرحلة هـ: الامتثال المالي الدولي 📊
**English:** Strict adherence to International Financial Reporting Standards.
**عربي:** الامتثال الصارم للمعايير الدولية للتقارير المالية.

- **Journal Entry Immutability (حصانة القيود المحاسبية)**
  - Postings cannot be edited/deleted. Corrections require a reversal entry. (يُمنع التعديل والحذف للقيود، والتصحيح يتم بقيد عكسي).
- **ZATCA VAT Reporting (إقرارات الزكاة والضريبة)**
  - Automated quarterly tax calculation box. (صندوق حساب الإقرار الضريبي ربع السنوي آلياً).

---

## 8. Phase F: Enterprise BPM | المرحلة و: محرك سير العمل والاعتمادات ⚙️
**English:** Orchestrating complex business rules and multi-level approvals.
**عربي:** إدارة قواعد العمل المعقدة والاعتمادات متعددة المستويات.

- **BPM Engine (`bpm-engine.ts`)**
  - Supports conditional routing (e.g., If > 50,000 SAR -> CEO). (يدعم التوجيه الشرطي والموافقات).
  - SLA tracking and auto-escalations. (تتبع وقت الخدمة SLA وتصعيد التأخيرات).
  - Visual Workflow Designer. (لوحة تصميم مرئية لمسارات الاعتماد).

---

## 9. Deployment | الرفع والتشغيل 🐳
**English:** Production-ready packaging.
**عربي:** التغليف الجاهز لبيئة الإنتاج.

- **Dockerization**
  - Uses `Dockerfile` with optimized Next.js standalone mode. (استخدام الدوكر للتشغيل كحاوية معزولة).
- **Deployment Script (`deploy.sh`)**
  - Runs Prisma migrations and detached containers instantly. (سكريبت ينفذ الهجرة البرمجية ويرفع النظام في ثوانٍ).

---
**🏆 Nama ERP is now fully Enterprise-Ready! | نماء إي آر بي أصبح الآن نظام شركات عالمي متكامل!**
