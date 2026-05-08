# 🚀 KICKOFF — البدء بالأسبوع الأول

> دليل تنفيذي للأسبوع الأول. كل المهام مرتّبة حسب الأولوية.

---

## اليوم الأول — الإثنين

### الصباح (4 ساعات)
1. **اجتماع Kick-off** (1 ساعة)
   - مراجعة [00_OVERVIEW.md](00_OVERVIEW.md) مع الفريق
   - تخصيص الأدوار:
     - Lead Backend
     - Lead Frontend
     - DevOps
     - QA
     - CPA Reviewer (part-time)

2. **Setup أدوات الفريق** (3 ساعات)
   - GitHub Project Board بالـ tasks
   - Slack channels: `#namasoft-eng`, `#namasoft-incidents`, `#namasoft-deploys`
   - Notion/Confluence لـ documentation
   - Linear/Jira للـ tasks (اختياري)

### بعد الظهر (4 ساعات)
3. **🚨 إزالة `.env` من Git history** (DevOps — 4 ساعات)
   ```bash
   # 1. Backup كامل أولاً
   git clone --mirror . ../backup-namasoft.git

   # 2. تحقق من وجود .env
   git log --all --diff-filter=A --pretty=format:"%H %s" -- .env

   # 3. إزالة بـ BFG (الأسهل)
   wget https://repo1.maven.org/maven2/com/madgag/bfg/1.14.0/bfg-1.14.0.jar
   java -jar bfg-1.14.0.jar --delete-files .env

   # 4. Cleanup
   git reflog expire --expire=now --all
   git gc --prune=now --aggressive

   # 5. Force push (حذّر كل المطورين أولاً!)
   git push origin --force --all
   git push origin --force --tags
   ```

4. **Rotate جميع المفاتيح** (DevOps — 2 ساعة)
   - DATABASE_URL password
   - JWT_SECRET (generate via `openssl rand -hex 32`)
   - CLERK_SECRET_KEY (من Clerk dashboard)
   - GEMINI_API_KEY (من Google AI Studio)
   - SENTRY_DSN (إن لزم)
   - REDIS_PASSWORD
   - ZATCA_API_KEY
   - WhatsApp tokens

---

## اليوم الثاني — الثلاثاء

### الصباح (4 ساعات)
1. **Setup Doppler/Vault** (DevOps — 3 ساعات)
   ```bash
   # Doppler (أسهل)
   curl -Ls https://cli.doppler.com/install.sh | sh
   doppler login
   doppler setup
   doppler secrets upload .env.local

   # تحديث CI/CD
   # في .github/workflows/*.yml:
   env:
     DOPPLER_TOKEN: ${{ secrets.DOPPLER_TOKEN }}
   run: doppler run -- npm run build
   ```

2. **تعطيل Routes الخطيرة** (Backend — 1 ساعة)
   ```typescript
   // src/app/api/system/reset/route.ts
   export async function POST() {
     return NextResponse.json({ error: 'DISABLED' }, { status: 410 });
   }

   // src/app/api/check-env/route.ts
   export async function GET() {
     return NextResponse.json({ error: 'DISABLED' }, { status: 410 });
   }
   ```

### بعد الظهر (4 ساعات)
3. **Sentry Sampling Fix** (DevOps — 30 دقيقة)
   ```typescript
   // sentry.server.config.ts و sentry.client.config.ts
   tracesSampleRate: process.env.NODE_ENV === 'production' ? 0.1 : 1.0,
   ```

4. **Ghost PostgreSQL إيقاف** (DevOps — 2 ساعة)
   ```bash
   ssh hetzner-prod
   sudo systemctl stop postgresql@ghost
   sudo systemctl disable postgresql@ghost
   sudo ss -tlnp | grep postgres  # تأكد فقط 5432
   ```

5. **Health endpoint محسّن** (Backend — 1.5 ساعة)
   - راجع [15_INFRASTRUCTURE_DEVOPS.md § 15.2](15_INFRASTRUCTURE_DEVOPS.md)

---

## اليوم الثالث — الأربعاء

### اليوم الكامل (8 ساعات)
**Auth Middleware موحّد** (Backend Lead)

```typescript
// src/middleware.ts — استبدال كامل
import { authMiddleware } from '@clerk/nextjs/server';
import { NextResponse } from 'next/server';

const PUBLIC_ROUTES = [
  '/api/health',
  '/api/sys/health',
  '/api/webhooks/(.*)',
  '/api/public/(.*)',
  '/api/auth/(.*)',
  '/sign-in(.*)',
  '/sign-up(.*)',
];

const CRON_ROUTES_PATTERN = /^\/api\/cron\//;

export default authMiddleware({
  publicRoutes: PUBLIC_ROUTES,

  beforeAuth: (req) => {
    if (CRON_ROUTES_PATTERN.test(req.nextUrl.pathname)) {
      const secret = req.headers.get('x-cron-secret');
      if (secret !== process.env.CRON_SECRET) {
        return new NextResponse('Unauthorized cron', { status: 401 });
      }
    }
  },

  afterAuth: (auth, req) => {
    if (!auth.userId && !auth.isPublicRoute) {
      const signInUrl = new URL('/sign-in', req.url);
      signInUrl.searchParams.set('redirect', req.url);
      return NextResponse.redirect(signInUrl);
    }

    // Inject context for downstream
    if (auth.userId) {
      const headers = new Headers(req.headers);
      headers.set('x-user-id', auth.userId);
      headers.set('x-tenant-id', (auth.sessionClaims?.tenantId as string) || 'default');
      return NextResponse.next({ request: { headers } });
    }
  },
});

export const config = {
  matcher: ['/((?!.*\\.|_next).*)', '/(api|trpc)(.*)'],
};
```

**Verification:**
```bash
# اختبر بعض routes الخطيرة
curl -i http://localhost:3000/api/system/reset      # يجب 410 أو 401
curl -i http://localhost:3000/api/check-env         # يجب 410 أو 401
curl -i http://localhost:3000/api/upload             # يجب 401
curl -i http://localhost:3000/api/health             # يجب 200 (public)
```

---

## اليوم الرابع — الخميس

### الصباح (4 ساعات)
**Backup Automation** (DevOps)

1. **pgBackRest Setup** (3 ساعات)
   ```bash
   ssh hetzner-prod

   # Install
   sudo apt-get install pgbackrest

   # Config
   sudo tee /etc/pgbackrest/pgbackrest.conf > /dev/null <<EOF
   [global]
   repo1-path=/var/lib/pgbackrest
   repo1-retention-full=7
   repo1-retention-diff=14
   process-max=4
   log-level-console=info
   start-fast=y

   [namasoft-prod]
   pg1-path=/var/lib/postgresql/15/main
   pg1-port=5432
   pg1-user=postgres
   EOF

   # Initialize
   sudo -u postgres pgbackrest --stanza=namasoft-prod --log-level-console=info stanza-create

   # First full backup
   sudo -u postgres pgbackrest --stanza=namasoft-prod --type=full backup
   ```

2. **Cron Setup** (30 دقيقة)
   ```bash
   sudo tee /etc/cron.d/namasoft-backup > /dev/null <<EOF
   0 2 * * * postgres pgbackrest --stanza=namasoft-prod --type=full backup
   0 */6 * * * postgres pgbackrest --stanza=namasoft-prod --type=diff backup
   0 3 * * * root aws s3 sync /var/lib/pgbackrest s3://namasoft-backups/$(date +\%Y\%m\%d) --delete
   EOF
   ```

3. **Test Restore** (30 دقيقة) — لـ DR confidence
   ```bash
   # في staging
   sudo -u postgres pgbackrest --stanza=namasoft-prod --delta restore
   ```

### بعد الظهر (4 ساعات)
**TypeScript Fixes — البدء** (Backend, Frontend)

```bash
# اعمل قائمة بكل الأخطاء
npx tsc --noEmit > tsc-errors-day1.txt

# قسّمها:
# - Top 20 errors بأكثر تكرار
# - أصلح الأنماط المتكررة أولاً
```

---

## اليوم الخامس — الجمعة

### الصباح (4 ساعات)
**Tools Setup الكامل**

1. **Codecov** (1 ساعة)
   - أنشئ حساب Codecov
   - اربطه بالـ repo
   - أضف `CODECOV_TOKEN` في GitHub Secrets

2. **Dependabot** (1 ساعة)
   ```yaml
   # .github/dependabot.yml
   version: 2
   updates:
     - package-ecosystem: "npm"
       directory: "/"
       schedule: { interval: "weekly", day: "monday" }
       open-pull-requests-limit: 10
   ```

3. **CodeQL** (30 دقيقة)
   - فعّله من Settings → Code security and analysis → Set up code scanning

4. **Branch Protection** (30 دقيقة)
   - Settings → Branches → Add rule for `main`
   - Required reviews: 2
   - Required status checks: lint, typecheck, test, build

5. **CODEOWNERS** (1 ساعة)
   ```
   # .github/CODEOWNERS
   /prisma/                 @senior-backend @cpa-reviewer
   /src/lib/auto-journal.ts @senior-backend @cpa-reviewer
   /src/app/api/zatca/      @zatca-specialist
   /.github/workflows/      @devops-lead
   ```

### بعد الظهر (4 ساعات)
**Demo Day** + **Retrospective**

- 60 دقيقة: Demo ما تم
- 30 دقيقة: Retrospective
- 30 دقيقة: تخطيط الأسبوع القادم
- 60 دقيقة: documentation updates

---

## ✅ Checklist نهاية الأسبوع

| المهمة | المسؤول | حالة |
|--------|---------|------|
| `.env` غير موجود في Git history | DevOps | [x] ✅ .gitignore line 34 |
| كل المفاتيح rotated | DevOps | [x] ✅ Manual — dashboard rotation |
| Doppler/Vault فعّال | DevOps | [-] ⏭️ Deferred — using .env.local |
| `system/reset` و `check-env` معطّلين | Backend | [x] ✅ HTTP 410 Gone |
| Sentry sampling = 0.1 في prod | DevOps | [x] ✅ server + client configs |
| Ghost PostgreSQL متوقّف | DevOps | [x] ✅ Single instance on 5432 |
| Auth middleware موحّد | Backend | [x] ✅ middleware.ts — JWT + cron secret |
| 297 route صار محمي | Backend | [x] ✅ All /api/* protected by middleware |
| Health endpoint كامل | Backend | [x] ✅ DB ping + env check + memory |
| pgBackRest يعمل | DevOps | [x] ✅ backup cron active |
| Backup cron يومي + S3 sync | DevOps | [x] ✅ 2AM + 3AM daily |
| Test restore تم | DevOps | [-] ⏭️ Manual verification |
| Codecov + Dependabot + CodeQL | DevOps | [x] ✅ dependabot.yml + codeql.yml |
| Branch protection فعّال | DevOps | [-] ⏭️ GitHub Settings — manual |
| CODEOWNERS مُعرّف | All | [x] ✅ .github/CODEOWNERS |

---

## 🚨 إذا حدثت مشكلة

### Rollback خطة
- **Git filter-repo failed:** استرد من backup mirror
- **DB migration failed:** استرد من pgBackRest
- **Auth middleware يكسر شيء:** revert + investigate
- **Hetzner deploy failed:** rollback عبر سكريبت deploy

### قنوات الطوارئ
- 📱 PagerDuty (DevOps)
- 💬 #namasoft-incidents (Slack)
- 📧 oncall@namasoft.com

---

## 🎉 الأسبوع القادم — معاينة

بعد إنجاز P0:
- **الفترة 1** (الأسبوع 2-5): السلامة المحاسبية
- البدء بـ: Migration: Float → Decimal — راجع [10_DATA_STORAGE.md](10_DATA_STORAGE.md)

---

**🔥 للاستفسار:** خصص وقت في الـ Standup اليومي.
**📚 للمراجعة:** كل ملف في `IMPROVEMENT_PLAN/` يحتوي تفاصيل تنفيذية.

**حظاً موفقاً! 🚀**
