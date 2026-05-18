تم التنفيذ بنجاح لـ Phase 7.3: API Override Wiring — Journal Posting.

### الملفات المعدلة والمضافة:
1. **`src/lib/governance/override-context.ts` (مضاف)**:
   - تم إنشاء Helper وظيفته استخراج `OverrideContext` بأمان من الـ `Headers` (`X-Soft-Lock-Override-Reason` و `X-Soft-Lock-Confirmation`) مع أخذ السياق الآمن من المصادقة `tenantId, actorRole, actorId`، ومنع اختراقها عبر الـ Body.
2. **`src/lib/auto-journal.ts` (معدل)**:
   - تم تحديث `createJournalEntry` لاستقبال `overrideContext` كـ parameter.
   - تم تمرير الـ context إلى نظام الـ Period Lock (`assertPeriodWritable`) ليتم اعتماده ضمن عمليات التحقق والـ AuditLog.
3. **`src/app/api/accounting/journal/route.ts` (معدل)**:
   - تمت إضافة استخراج الـ Override Context عبر `buildOverrideContextFromRequest` وتمريره لـ `createJournalEntry`.
   - تم استبدال الـ Dynamic Requires بمكتبات ES Modules القياسية لحل مشاكل الـ Type-checking والـ Testing.
4. **`tests/integration/accounting/journal-api-override.test.ts` (مضاف)**:
   - تمت كتابة اختبارات تكاملية لطبقة الـ API.
   - تم اختبار استخراج الـ Headers وتمريرها بشكل صحيح.
   - تم اختبار ومنع محاولات حقن وتغيير صلاحية المستخدم (`role`) أو الـ `tenantId` عبر الـ Body.

### الاختبارات:
- **`npm run typecheck`**: تم التشغيل بنجاح (Exit code: 0).
- **`npx vitest run tests/integration/accounting/journal-api-override.test.ts`**: تم اجتياز الاختبارات الثلاثة بنجاح (Exit code: 0).

### المخاطر المتبقية:
- حالياً هذا التحديث مفعل فقط للمسار الأساسي (القيود اليدوية). إذا كان هناك وحدات أخرى تستدعي `createJournalEntry` بدون طبقة الـ API، فإنها لن تمرر الـ `OverrideContext` إلا إذا تم ربط الـ Headers بها (Phase 7.4 لاحقاً).
- هذا يثبت جاهزية الـ Pattern لاستخدامه في موديولات المبيعات والمشتريات.

هل يحتاج تحديث Brain؟ 
- نعم، لإثبات نجاح هندسة الـ Override Pattern وتعميمها.

في انتظار موافقتك للانتقال للمرحلة القادمة أو للتعميم على باقي الأقسام.
