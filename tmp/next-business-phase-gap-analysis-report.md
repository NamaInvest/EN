# تقرير تحليل الفجوات للمرحلة التالية (Gap Analysis)

تم إجراء تحليل شامل للفجوات في النظام، ولم يتم العثور على أي فجوة من الفئتين P0 أو P1 تمنع التشغيل أو تشكل خطراً أمنياً أو مالياً. الفجوات المحددة تقع ضمن التحسينات والتكاملات القابلة للتخطيط.

## الفجوة GAP-P4-001 (P2): دعم الطباعة المتعددة لنقاط بيع متعددة المستأجرين
- **MODULE**: Sales / POS
- **PAGE**: `/pos`, `/restaurant-pos`
- **FILE**: `src/app/(dashboard)/pos/page.tsx`
- **API**: WebSocket QZ Tray
- **DESCRIPTION**: الحاجة إلى تحسين إدارة الطابعات المحلية لتدعم إرسال أوامر الطباعة لعدة طابعات متزامنة (طابعة فواتير، طابعة مطبخ، طابعة ملصقات) بناء على إعدادات المستأجر دون تداخل.
- **RISK_LEVEL**: LOW (تحسين ميزة تشغيلية)
- **BUSINESS_IMPACT**: زيادة سرعة إنجاز فواتير المطاعم ونقاط البيع الكبرى.
- **TECHNICAL_IMPACT**: بسيط (إضافة مصفوفة إعدادات الطابعات في لوحة التحكم).
- **RECOMMENDED_FIX**: السماح للصراف بتعريف أكثر من طابعة محلية نشطة في إعدادات نقاط البيع وتخزينها محلياً.
- **SAFE_TO_IMPLEMENT**: YES
- **REQUIRES_DB_CHANGE**: NO
- **REQUIRES_ENV_CHANGE**: NO
- **REQUIRES_DEPLOY**: YES
- **REQUIRES_APPROVAL**: YES

## الفجوة GAP-P4-002 (P3): إضافة دليل مساعدة سريع (Tooltip Help) لشارة اتصال الطابعة
- **MODULE**: UI/UX
- **PAGE**: `/pos`, `/sales/terminal`
- **FILE**: `src/app/(dashboard)/pos/page.tsx`
- **API**: None
- **DESCRIPTION**: تقديم تلميحات توضيحية للمستخدمين لشرح حالات الاتصال بالطابعة (متصل/غير متصل) والخطوات المقترحة للحل في حال تعطل QZ Tray.
- **RISK_LEVEL**: LOW (تحسين تجربة مستخدم)
- **BUSINESS_IMPACT**: تقليل تذاكر الدعم الفني الخاصة بالطابعات.
- **TECHNICAL_IMPACT**: لا يذكر.
- **RECOMMENDED_FIX**: استخدام مكونات Shadcn UI Tooltip لإظهار نص ارشادي عند مرور مؤشر الفأرة على شارة الطابعة.
- **SAFE_TO_IMPLEMENT**: YES
- **REQUIRES_DB_CHANGE**: NO
- **REQUIRES_ENV_CHANGE**: NO
- **REQUIRES_DEPLOY**: YES
- **REQUIRES_APPROVAL**: NO
