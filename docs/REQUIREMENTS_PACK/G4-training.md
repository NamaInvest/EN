# G4 — Training Videos

## الحالة الحالية
- `docs/MASTER_PACK/22-training/training-program.md` (1 ملف)
- `IMPROVEMENT_PLAN/50_product/57_TRAINING.md`
- **لا فيديوهات فعلية منتجة**
- لا LMS integration

## الفجوة (مقابل SAP Learning Hub / NetSuite Learn)
- صفر فيديو production
- لا certification tracking
- لا quizzes
- لا attendance/progress dashboards

## 🎯 Ready Prompt

```
المهمة: نظام training videos + LMS مدمج.

السياق:
- 14 دور رئيسي يحتاجون training
- Remotion skill متاح في Claude Code (لتوليد فيديوهات code-based)
- Bunny CDN cheap option للـ video hosting

المخرجات:
1) Per-role training script:
   docs/MASTER_PACK/22-training/<role>/script.md
   كل script = 30 دقيقة:
   - Scene 1 (3m): Welcome + login + UI overview
   - Scene 2 (10m): Walkthrough golden path
     مثال tax_officer: VAT categories → WHT Form 14 → submission
   - Scene 3 (8m): Common errors + recovery
     مثال: forgot SDAIA refNo → how to add
   - Scene 4 (5m): Tips + shortcuts
   - Scene 5 (4m): Quiz (5 questions multiple choice)

2) Video production:
   استخدم Remotion skill:

   Option A — Code-driven videos (cheapest):
   - Remotion generates from script.md + screenshots
   - Voiceover via TTS (Azure Speech or ElevenLabs)
   - 1-2 minute render time per video
   - Output: docs/MASTER_PACK/22-training/<role>/video.mp4

   Option B — Human-recorded (higher quality, costlier):
   - Senior staff records screen + voiceover
   - Tools: Loom, OBS, Camtasia
   - Edit + upload

   Choose A initially, B later for refinements

3) Hosting:
   Upload all videos to Bunny CDN:
   - Cheap ($0.01/GB delivered)
   - Custom domain: videos.namainvest.com
   - HLS streaming
   - Subtitle support (.vtt files)

4) LMS dashboard:
   src/app/(dashboard)/learn/page.tsx:
   - Course catalog (videos by role)
   - Progress tracking per user
   - Quizzes after each video
   - Certificates upon completion

5) Subtitles (i18n):
   For each video, generate .vtt files:
   - Arabic (primary)
   - English

6) Quiz infrastructure:
   prisma model:
   ```
   model TrainingVideo {
     id Int @id
     title String
     role String
     videoUrl String
     duration Int  // seconds
     quizQuestions Json  // array of {question, options, correctIndex}
   }

   model TrainingProgress {
     userId Int
     videoId Int
     watchedSeconds Int
     completedAt DateTime?
     quizScore Int?
     certificateUrl String?
   }
   ```

7) Certificate generation:
   Upon passing quiz (≥80%):
   - Generate PDF certificate via puppeteer
   - Include: user name, course, date, signature
   - Store in S3
   - Email to user
   - Print: nice corporate template

8) Compliance training (mandatory):
   Some training is required by law:
   - PDPL awareness (all employees, annually)
   - Security training (developers, annually)
   - Saudi labor law (HR, on-hire)

   Tracking in /admin/training-compliance:
   - Who completed what + when
   - Who's overdue → email reminder
   - Audit log for compliance officers

القيود:
- Arabic voiceover primary, English second
- max 30 min per video (longer = boring)
- subtitles must match voiceover accurately
- video files < 200MB (HLS streaming preferred)
```

## السيناريو

شركة سعودية كبيرة (200 موظف) تستخدم Namasoft:

**Onboarding day**:
1. عامل جديد يدخل النظام
2. Welcome screen: "أكمل تدريبك (إلزامي)"
3. Course assigned: "Cashier Basics" (30 min)
4. يضغط play → يتعلم خطوة بخطوة
5. End of video → quiz 5 سؤال
6. Score 4/5 → ✓ passed
7. Certificate PDF generated → emailed
8. Manager dashboard: "user X completed Cashier course"

**Annual PDPL refresher**:
9. مرّت سنة منذ آخر training
10. system sends email reminder
11. /learn/pdpl-2026 course
12. كل الموظفين يكملونها قبل deadline
13. Compliance officer dashboard: "94% completion (188/200)"
14. Sends reminder to remaining 12

**New feature training**:
15. Release v2.5 يضيف ميزة "WHT Form 14"
16. Tax officer dashboard: "New training available"
17. 10 دقيقة فيديو جديد عن الـ feature
18. Tax officer يكملها → ready to use

## Data Flow

```
[Video production flow]
1. Write script: docs/MASTER_PACK/22-training/cashier/script.md
   ↓
2. Generate screenshots:
   playwright script captures /pos page in various states
   ↓
3. Run Remotion skill:
   Inputs: script + screenshots + voiceover audio
   ↓
   Compose video timeline
   ↓
   Render to MP4
   ↓
4. Generate subtitles:
   Whisper transcribe audio → .vtt
   Translate to English → .vtt
   ↓
5. Upload to Bunny CDN:
   POST to Bunny API
   Get public URL
   ↓
6. Store metadata:
   INSERT INTO training_video {...}

[User learning flow]
User opens /learn
   ↓
GET /api/learn/courses?role=<user.role>
   ↓
Display catalog with progress
   ↓
User clicks "Start Course"
   ↓
Video player loads (Bunny HLS)
   ↓
Every 10 sec → POST /api/learn/progress
   { videoId, watchedSeconds }
   ↓
Video ends → Quiz overlay
   ↓
User answers 5 questions
   ↓
POST /api/learn/quiz-submit
   ↓
If score ≥ 80%:
   - Mark complete
   - Generate certificate (puppeteer)
   - Upload to S3
   - Email to user
Else:
   - Show "Try again"
   - Suggest review video

[Compliance tracking]
Cron daily @ 03:00:
   ↓
For each user:
   For each required course (by role + global):
     Check completedAt
     If null OR > 12 months ago:
       Schedule reminder email
   ↓
Send batch of reminder emails
   ↓
Update /admin/training-compliance metrics
```

## ملفات المُنتَج

- `docs/MASTER_PACK/22-training/<role>/script.md` × 14
- `docs/MASTER_PACK/22-training/<role>/video.mp4` × 14
- `docs/MASTER_PACK/22-training/<role>/subtitles-ar.vtt` × 14
- `docs/MASTER_PACK/22-training/<role>/subtitles-en.vtt` × 14
- `src/app/(dashboard)/learn/page.tsx`
- `src/app/(dashboard)/learn/[courseId]/page.tsx`
- `src/app/api/learn/courses/route.ts`
- `src/app/api/learn/progress/route.ts`
- `src/app/api/learn/quiz-submit/route.ts`
- `src/app/(dashboard)/admin/training-compliance/page.tsx`
- `scripts/generate-training-videos.ts` (uses Remotion)
- `scripts/generate-certificate.ts` (uses puppeteer)
- `prisma/schema.prisma` — TrainingVideo, TrainingProgress (new)
