# دليل مراقبة وتشغيل عمال طوابير BullMQ (BullMQ Workers Operations & Monitoring Guide)

يوضح هذا الدليل المعماري والتشغيلي هيكلية عمال خلفية النظام (Workers) القائمة على طوابير **BullMQ** في مشروع **Namasoft ERP / Nama Invest ERP**، وكيفية تتبع الأخطاء وجسور الفشل والمراقبة لضمان استقرار العمليات الكثيفة في بيئة الإنتاج.

---

## 🏛️ 1. هندسة ومعمارية الطوابير (Queue Architecture)

تُدار العمليات الخلفية الكثيفة وغير المتزامنة في النظام عبر طوابير BullMQ مدعومة بمخزن بيانات Redis سريع. تنقسم الطوابير البرمجية إلى:

```
[Client / Next.js API] ──(Job Payload)──► [Redis Store]
                                                │
  ┌───────────────────────┬─────────────────────┼─────────────────────┐
  ▼                       ▼                     ▼                     ▼
[AI / RAG Queue]    [Billing Queue]     [Mail / Sms Queue]    [Outbox Queue]
(ai-queue)          (billing-queue)     (communication)       (outbox-queue)
```

1. **`ai-queue`** (طابور الذكاء الاصطناعي):
   - **العمال**: `src/workers/ai/ai-worker.ts`
   - **الوظيفة**: استخراج الرؤى المالية والتصنيف التلقائي للبيانات وبناء متجهات المعرفة (Vector embeddings).
2. **`billing-queue`** (طابور الفوترة وحسابات الزكاة والـ PDF):
   - **العمال**: `src/workers/billing-worker.ts`
   - **الوظيفة**: توليد وتوقيع فواتير ZATCA الرقمية وصياغة ملفات PDF الضخمة وتشفيرها.
3. **`communication-queue`** (طابور الإشعارات والرسائل):
   - **العمال**: `src/workers/whatsapp.ts` & `src/workers/mail-worker.ts`
   - **الوظيفة**: إرسال إشعارات الواتساب ورسائل البريد الإلكتروني للمستخدمين والعملاء.
4. **`outbox-queue`** (طابور المعاملات الموزعة):
   - **العمال**: `src/workers/outbox/outbox-worker.ts`
   - **الوظيفة**: نقل ومزامنة التغييرات المحاسبية وجداول عزل المستأجرين مع خوادم الفروع.

---

## 🔍 2. مراقبة الأداء والذاكرة (Performance & Memory Monitoring)

تخضع كافة مهام BullMQ لمراقبة حية وحثيثة مدمجة مع نظام المراقبة الهيكلية:

- **تكامل Winston**:
  - يتم تسجيل بداية المهام ومخرجاتها وزمن التنفيذ لكل مهمة في ملف سجلات Winston المركزي (`logs/app.log`).
- **تكامل OpenTelemetry**:
  - يتم تعيين معرف أثر فريد (Trace ID) لكل مهمة يمر من لوحة الفوترة أو المبيعات حتى عمال الطوابير، مما يتيح تتبع الاختناقات (Bottlenecks) عبر اللوحات الإدارية.
- **مراقبة الذاكرة (Memory Overhead Check)**:
  - عمال الـ Node.js للعمليات الطويلة محددون بسقف ذاكرة صارم لتفادي تسريب الذاكرة (Memory leaks):
    ```bash
    # سقف الذاكرة لعمال BullMQ في خادم الإنتاج
    cross-env NODE_OPTIONS=--max-old-space-size=2048 node dist/scripts/start_workers.js
    ```

---

## 🛠️ 3. جسر الفشل ومعالجة الأخطاء (Worker Failure Handling & Recovery)

عند تعثر أي مهمة (Failed Job) نتيجة خطأ بالشبكة أو تعطل خوادم خارجية، يتم معالجة الفشل بالتدابير التلقائية التالية:

1. **آلية إعادة المحاولة الأسية (Exponential Backoff Retry)**:
   - يتم تكوين المهام لإعادة المحاولة تلقائياً قبل تسجيل الفشل النهائي:
     ```typescript
     await queue.add('generate-invoice', payload, {
       attempts: 3,
       backoff: {
         type: 'exponential',
         delay: 5000 // يبدأ بـ 5 ثوانٍ ثم يتضاعف
       }
     });
     ```
2. **منفذ الفشل النهائي (Failed Event Bridge)**:
   - يستمع كل عامل لحدث الفشل `failed` ويسجله بالكامل مع الـ stack trace الخاص به:
     ```typescript
     worker.on('failed', (job, err) => {
       logger.error(`Job ${job.id} failed in queue ${job.queueName}: ${err.message}`, {
         jobId: job.id,
         queue: job.queueName,
         error: err.stack,
         tenantId: job.data.tenantId
       });
       // إرسال تنبيه فوري لنظام المراقبة (Sentry / SIEM)
       sentry.captureException(err);
     });
     ```

---

## ⚙️ 4. إدارة المهام عبر PM2 (PM2 Operations)

يُدار تشغيل العمال بشكل معزول في خادم الإنتاج عن تطبيق Next.js لضمان عدم تأثر تصفح المستخدمين بالعمليات الخلفية الثقيلة.

- **أمر بدء تشغيل العمال عبر PM2**:
  ```bash
  pm2 start npm --name "n1-worker" -- run worker
  ```
- **عرض حالة واستهلاك العمال للذاكرة**:
  ```bash
  pm2 show n1-worker
  ```
- **إعادة تشغيل العمال صامتاً بعد التحديث**:
  ```bash
  pm2 reload n1-worker
  ```
- **مراقبة السجلات الحية للعمال**:
  ```bash
  pm2 logs n1-worker
  ```
