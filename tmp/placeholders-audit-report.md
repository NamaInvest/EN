# Placeholders Audit Report

## ملخص تنفيذي (Executive Summary)
تم إجراء فحص شامل للمشروع (Deep Scan) للبحث عن الشاشات غير المكتملة والتي تحتوي على مكونات مثل `FeatureDisabledPanel` أو `ComingSoonModule` أو ما شابه ذلك.

- **عدد الشاشات غير المكتملة:** 31 شاشة.
- **نوع المشكلة السائد:** الاعتماد على `FeatureDisabledPanel` لسد الفراغ في صفحات لم يتم بناء واجهتها بالكامل بعد.
- **حالة قاعدة البيانات (Database):** معظم الشاشات تمتلك جداول مجهزة مسبقاً في `Prisma Schema` (مثل `WmsWave`, `LiquidityForecast`, `MasterProductionSchedule`, `PosSession` وغيرها).
- **حالة الـ API:** بعض الأقسام تمتلك واجهات برمجية مبدئية (مثل `wms/waves` و `manufacturing/aps`) بينما يفتقر البعض الآخر للـ API (مثل `treasury/cash-forecast`).

---

## جدول الشاشات غير المكتملة (Incomplete Screens Table)

| اسم القسم | المسار (Route) | الملف المسؤول (File) | نوع المشكلة | هل يوجد API؟ | هل يوجد Prisma Model؟ | مستوى الخطورة (Severity) |
|---|---|---|---|---|---|---|
| أرشيف النظام | `/ice_archive` | `app/(dashboard)/_ice_archive/page.tsx` | FeatureDisabledPanel | غير معروف | نعم (`IceAuditLog`) | MEDIUM |
| إدارة الموجات (WMS) | `/wms/waves` | `app/(dashboard)/wms/waves/page.tsx` | FeatureDisabledPanel | نعم | نعم (`WmsWave`) | CRITICAL |
| التنبؤ بالسيولة | `/treasury/cash-forecast` | `app/(dashboard)/treasury/cash-forecast/page.tsx` | FeatureDisabledPanel | لا | نعم (`LiquidityForecast`) | CRITICAL |
| سياسة مستوى الخدمة | `/support/sla` | `app/(dashboard)/support/sla/page.tsx` | FeatureDisabledPanel | مجهول | نعم (`SlaPolicy`) | HIGH |
| مكتب المساعدة | `/support/help-desk` | `app/(dashboard)/support/help-desk/page.tsx` | FeatureDisabledPanel | مجهول | نعم (`SupportTicket`) | HIGH |
| مراقبة الورديات | `/shifts/monitor` | `app/(dashboard)/shifts/monitor/page.tsx` | FeatureDisabledPanel | مجهول | نعم (`ShiftSchedule`) | CRITICAL |
| إعدادات Webhooks | `/settings/webhooks` | `app/(dashboard)/settings/webhooks/page.tsx` | FeatureDisabledPanel | مجهول | نعم (`WebhookSubscription`) | HIGH |
| إعدادات State Machine | `/settings/state-machine` | `app/(dashboard)/settings/state-machine/page.tsx` | FeatureDisabledPanel | مجهول | نعم (`WorkflowDefinition`) | HIGH |
| إعدادات الدخول الموحد | `/settings/sso` | `app/(dashboard)/settings/sso/page.tsx` | FeatureDisabledPanel | مجهول | نعم (`SsoProvider`) | HIGH |
| تقارير BI Cube | `/reports/bi-cube` | `app/(dashboard)/reports/bi-cube/page.tsx` | FeatureDisabledPanel | مجهول | نعم (`BiDashboard`) | MEDIUM |
| تسعير المبيعات CPQ | `/sales/cpq` | `app/(dashboard)/sales/cpq/page.tsx` | FeatureDisabledPanel | مجهول | نعم | CRITICAL |
| الخريطة الذكية للمبيعات | `/sales/smart-map` | `app/(dashboard)/sales/smart-map/page.tsx` | FeatureDisabledPanel | مجهول | نعم (`SalesTerritory`) | HIGH |
| تحليل الإنفاق | `/procurement/spend-analytics` | `app/(dashboard)/procurement/spend-analytics/page.tsx` | FeatureDisabledPanel | نعم | نعم (`SpendCategory`) | CRITICAL |
| عقود الموردين | `/procurement/supplier-contracts` | `app/(dashboard)/procurement/supplier-contracts/page.tsx` | FeatureDisabledPanel | مجهول | نعم (`ContractTemplate`) | CRITICAL |
| تقييم الموردين | `/procurement/vendor-scorecard` | `app/(dashboard)/procurement/vendor-scorecard/page.tsx` | FeatureDisabledPanel | مجهول | نعم (`VendorBid`) | HIGH |
| مقارنة الأسعار | `/procurement/price-comparison` | `app/(dashboard)/procurement/price-comparison/page.tsx` | FeatureDisabledPanel | مجهول | نعم (`ReverseAuction`) | HIGH |
| محاسب نقاط البيع | `/pos/accountant` | `app/(dashboard)/pos/accountant/page.tsx` | FeatureDisabledPanel | لا | نعم (`PosSession`) | CRITICAL |
| الصيدلية | `/pharmacy` | `app/(dashboard)/pharmacy/page.tsx` | FeatureDisabledPanel | مجهول | نعم (`Medication`) | CRITICAL |
| مدير الصيدلية | `/pharmacy/manager` | `app/(dashboard)/pharmacy/manager/page.tsx` | FeatureDisabledPanel | مجهول | نعم (`Medication`) | CRITICAL |
| تحليلات التسويق | `/marketing/analytics` | `app/(dashboard)/marketing/analytics/page.tsx` | FeatureDisabledPanel | مجهول | نعم (`CrmCampaign`) | MEDIUM |
| جدولة الإنتاج (APS) | `/manufacturing/aps` | `app/(dashboard)/manufacturing/aps/page.tsx` | FeatureDisabledPanel | نعم | نعم (`MasterProductionSchedule`) | CRITICAL |
| الصيانة الوقائية | `/maintenance/preventive` | `app/(dashboard)/maintenance/preventive/page.tsx` | FeatureDisabledPanel | مجهول | نعم (`MaintenanceSchedule`) | HIGH |
| تتبع الأسطول | `/fleet/tracking` | `app/(dashboard)/fleet/tracking/page.tsx` | FeatureDisabledPanel | مجهول | نعم (`FreightOrder`) | HIGH |
| محفظة المشاريع | `/enterprise/portfolio` | `app/(dashboard)/enterprise/portfolio/page.tsx` | FeatureDisabledPanel | مجهول | نعم (`PLMProject`) | HIGH |
| إدارة القيمة المكتسبة | `/enterprise/projects/evm` | `app/(dashboard)/enterprise/projects/evm/page.tsx` | FeatureDisabledPanel | مجهول | نعم (`EVMSnapshot`) | HIGH |
| تجربة العملاء | `/crm/cx-nps` | `app/(dashboard)/crm/cx-nps/page.tsx` | FeatureDisabledPanel | مجهول | نعم (`SurveyResponse`) | HIGH |
| الحسابات الرئيسية | `/crm/key-accounts` | `app/(dashboard)/crm/key-accounts/page.tsx` | FeatureDisabledPanel | مجهول | نعم (`CrmAccount`) | HIGH |
| المحاسبة المشتركة | `/accounting/inter-company` | `app/(dashboard)/accounting/inter-company/page.tsx` | FeatureDisabledPanel | نعم | نعم (`ICNettingCycle`) | CRITICAL |
| التنبؤ بالطلب (AI) | `/ai/demand-forecast` | `app/(dashboard)/ai/demand-forecast/page.tsx` | FeatureDisabledPanel | مجهول | نعم (`DemandForecast`) | HIGH |
| البحث الطبيعي (AI) | `/ai/nlq` | `app/(dashboard)/ai/nlq/page.tsx` | FeatureDisabledPanel | مجهول | نعم (`AiConversation`) | HIGH |
| المبيعات الذكية (AI) | `/ai/sales-coach` | `app/(dashboard)/ai/sales-coach/page.tsx` | FeatureDisabledPanel | مجهول | نعم (`AiConversation`) | HIGH |

