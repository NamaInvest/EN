# 1️⃣6️⃣ CI/CD | التكامل والنشر المستمر

## 🔍 الحالة الحالية

### ✅ الموجود
- `.github/workflows/ci.yml` (lint + typecheck + test + build)
- `.github/workflows/deploy.yml` (SSH-based to Hetzner)
- ESLint مع 50-warning limit
- TypeScript baseline-aware (لكن `ignoreBuildErrors: true` 🚨)
- Vitest tests in CI
- Health check + rollback في deploy

### 🔴 الفجوات
| الفجوة | الخطورة |
|--------|--------|
| **`ignoreBuildErrors: true`** يخفي 91 خطأ TS | 🔴🔴 |
| لا CodeQL security scan | 🔴 |
| لا Dependabot | 🔴 |
| لا npm audit / Snyk | 🔴 |
| لا coverage reporting (codecov) | 🟠 |
| لا SBOM generation | 🟡 |
| لا image scanning (Trivy) | 🟠 |
| لا Lighthouse CI | 🟡 |
| لا performance budgets | 🟡 |
| لا smoke tests بعد deploy | 🟠 |
| لا blue-green deployment | 🟡 |
| لا branch protection rules | 🔴 |

---

## 🎯 الخطة التفصيلية

### المرحلة 16.1 — إصلاح TypeScript (6 أيام)

```bash
# قبل تعديل next.config.ts، أصلح الأخطاء
npx tsc --noEmit > tsc-errors.txt

# اعمل عليها بالتدريج
# يمكن استخدام @typescript-eslint/no-unsafe-* للتنبيه
```

```typescript
// next.config.ts — بعد إصلاح كل الأخطاء
const config: NextConfig = {
  typescript: {
    ignoreBuildErrors: false,  // ⚠️ ENFORCE
  },
  eslint: {
    ignoreDuringBuilds: false,
  },
};
```

```yaml
# .github/workflows/ci.yml
- name: TypeScript check
  run: npx tsc --noEmit
  # FAIL CI لو فيه أي error
```

---

### المرحلة 16.2 — Security Scanning (3 أيام)

#### Dependabot
```yaml
# .github/dependabot.yml
version: 2
updates:
  - package-ecosystem: "npm"
    directory: "/"
    schedule: { interval: "weekly", day: "monday" }
    open-pull-requests-limit: 10
    groups:
      production-deps:
        dependency-type: "production"
        update-types: ["minor", "patch"]
      dev-deps:
        dependency-type: "development"

  - package-ecosystem: "github-actions"
    directory: "/"
    schedule: { interval: "weekly" }

  - package-ecosystem: "docker"
    directory: "/"
    schedule: { interval: "weekly" }
```

#### CodeQL
```yaml
# .github/workflows/codeql.yml
name: CodeQL
on:
  push: { branches: [main] }
  pull_request: { branches: [main] }
  schedule: [{ cron: '0 0 * * 0' }]

jobs:
  analyze:
    runs-on: ubuntu-latest
    permissions:
      security-events: write
      actions: read
      contents: read
    strategy:
      matrix:
        language: ['javascript-typescript']
    steps:
      - uses: actions/checkout@v4
      - uses: github/codeql-action/init@v3
        with: { languages: ${{ matrix.language }}, queries: security-extended }
      - uses: github/codeql-action/autobuild@v3
      - uses: github/codeql-action/analyze@v3
```

#### Snyk
```yaml
# .github/workflows/snyk.yml
- name: Snyk security scan
  uses: snyk/actions/node@master
  env: { SNYK_TOKEN: ${{ secrets.SNYK_TOKEN }} }
  with:
    args: --severity-threshold=high --fail-on=upgradable
```

#### npm audit في CI
```yaml
- name: npm audit
  run: |
    npm audit --audit-level=moderate --production
    # Use audit-ci for richer config:
    npx audit-ci --moderate
```

---

### المرحلة 16.3 — Coverage Reporting (1 يوم)

```typescript
// vitest.config.ts
export default defineConfig({
  test: {
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html', 'lcov'],
      exclude: [
        'node_modules/**',
        'dist/**',
        '**/*.config.ts',
        '**/*.d.ts',
        'scripts/**',
      ],
      thresholds: {
        lines: 80,
        functions: 80,
        branches: 75,
        statements: 80,
      },
    },
  },
});
```

```yaml
# .github/workflows/ci.yml
- name: Run tests with coverage
  run: npm run test:coverage

- name: Upload coverage to Codecov
  uses: codecov/codecov-action@v4
  with:
    token: ${{ secrets.CODECOV_TOKEN }}
    files: ./coverage/lcov.info
    flags: unittests
    fail_ci_if_error: true
```

---

### المرحلة 16.4 — Branch Protection + CODEOWNERS (1 يوم)

```yaml
# .github/CODEOWNERS
# Default: full team
*                       @your-team

# Critical paths require senior review
/prisma/                @senior-backend
/src/lib/auto-journal.ts @senior-backend @cpa-reviewer
/src/services/accounting/ @senior-backend @cpa-reviewer
/src/app/api/zatca/     @zatca-specialist
/src/middleware.ts      @senior-backend
/.github/workflows/     @devops-lead
```

```bash
# عبر GitHub API أو CLI
gh api -X PUT repos/:owner/:repo/branches/main/protection \
  --input protection-rules.json
```

```json
// protection-rules.json
{
  "required_status_checks": {
    "strict": true,
    "contexts": ["lint", "typecheck", "test", "build", "codeql", "snyk"]
  },
  "enforce_admins": false,
  "required_pull_request_reviews": {
    "required_approving_review_count": 2,
    "require_code_owner_reviews": true,
    "dismiss_stale_reviews": true
  },
  "restrictions": null,
  "allow_force_pushes": false,
  "allow_deletions": false,
  "required_linear_history": true,
  "required_conversation_resolution": true
}
```

---

### المرحلة 16.5 — SBOM + Image Scanning (2 أيام)

```yaml
# .github/workflows/sbom.yml
- name: Generate SBOM (CycloneDX)
  run: npx @cyclonedx/cyclonedx-npm --output-format json --output-file sbom.json

- name: Upload SBOM
  uses: actions/upload-artifact@v4
  with: { name: sbom, path: sbom.json }

# Image scanning
- name: Trivy scan
  uses: aquasecurity/trivy-action@master
  with:
    image-ref: 'registry.namasoft.com/web:${{ github.sha }}'
    format: 'sarif'
    output: 'trivy-results.sarif'
    severity: 'CRITICAL,HIGH'
    exit-code: '1'

- name: Upload Trivy results
  uses: github/codeql-action/upload-sarif@v3
  with: { sarif_file: 'trivy-results.sarif' }
```

---

### المرحلة 16.6 — Lighthouse CI (2 أيام)

```yaml
# .github/workflows/lighthouse.yml
name: Lighthouse CI
on: pull_request

jobs:
  lighthouse:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with: { node-version: 20 }

      - run: npm ci
      - run: npm run build

      - run: npm install -g @lhci/cli
      - run: lhci autorun
        env:
          LHCI_GITHUB_APP_TOKEN: ${{ secrets.LHCI_GITHUB_APP_TOKEN }}
```

```javascript
// lighthouserc.js
module.exports = {
  ci: {
    collect: {
      url: [
        'http://localhost:3000/',
        'http://localhost:3000/dashboard',
        'http://localhost:3000/sales/orders',
      ],
      numberOfRuns: 3,
    },
    assert: {
      assertions: {
        'categories:performance': ['error', { minScore: 0.85 }],
        'categories:accessibility': ['error', { minScore: 0.95 }],
        'categories:best-practices': ['error', { minScore: 0.9 }],
        'categories:seo': ['warn', { minScore: 0.85 }],
        'first-contentful-paint': ['warn', { maxNumericValue: 2000 }],
        'largest-contentful-paint': ['error', { maxNumericValue: 4000 }],
        'cumulative-layout-shift': ['error', { maxNumericValue: 0.1 }],
      },
    },
    upload: { target: 'temporary-public-storage' },
  },
};
```

---

### المرحلة 16.7 — Smoke Tests (2 أيام)

```yaml
# .github/workflows/deploy.yml — addition
- name: Deploy to production
  run: ./scripts/deploy.sh

- name: Smoke tests
  run: |
    # 1. Health check
    curl -f https://app.namasoft.com/api/health || exit 1

    # 2. Auth flow
    npx playwright test tests/smoke/auth.smoke.ts

    # 3. Create + read flow (ephemeral test tenant)
    npx playwright test tests/smoke/critical-flows.smoke.ts

  env:
    SMOKE_TEST_TENANT: smoke-${{ github.run_id }}
    SMOKE_TEST_TOKEN: ${{ secrets.SMOKE_TEST_TOKEN }}

- name: Rollback on smoke failure
  if: failure()
  run: ./scripts/rollback.sh
```

---

### المرحلة 16.8 — Blue-Green Deployment (4 أيام — اختياري)

```bash
#!/bin/bash
# scripts/blue-green-deploy.sh

# 1. Deploy to "green" (idle slot)
ssh prod "cd /opt/namasoft-green && git pull && npm ci && npm run build"
ssh prod "pm2 reload ecosystem.green.config.js"

# 2. Wait for green to be healthy
for i in {1..30}; do
  if curl -f https://green.namasoft.internal/api/health; then break; fi
  sleep 5
done

# 3. Run smoke tests against green
npm run smoke:green

# 4. Switch traffic (Cloudflare DNS or load balancer)
curl -X PATCH "https://api.cloudflare.com/.../dns_records/$RECORD_ID" \
  -H "Authorization: Bearer $CF_TOKEN" \
  -d '{"content": "green-server-ip"}'

# 5. Wait for DNS propagation
sleep 60

# 6. Mark blue as idle (will be next "green")
echo "Deployment successful"
```

---

### المرحلة 16.9 — Auto-Rollback on Anomaly (3 أيام)

```yaml
# .github/workflows/post-deploy-monitoring.yml
- name: Monitor metrics for 10 minutes
  run: |
    for i in {1..20}; do
      ERROR_RATE=$(curl -s "https://prometheus.namasoft.com/api/v1/query?query=rate(http_requests_total{status=~'5..'}[1m])" | jq '.data.result[0].value[1]')

      if (( $(echo "$ERROR_RATE > 0.05" | bc -l) )); then
        echo "Error rate too high: $ERROR_RATE"
        exit 1
      fi

      sleep 30
    done

- name: Rollback if anomaly
  if: failure()
  run: ./scripts/rollback.sh
```

---

## 📊 المخرجات

| المقياس | قبل | بعد |
|---------|-----|-----|
| TS errors hidden | 91 | 0 |
| Dependabot | لا | weekly |
| CodeQL | لا | على كل PR |
| Snyk | لا | على كل PR |
| Coverage report | لا | 80%+ enforced |
| SBOM | لا | per release |
| Image scanning | لا | Trivy |
| Lighthouse CI | لا | budgets enforced |
| Smoke tests | لا | بعد كل deploy |
| Branch protection | لا | كامل |
| Auto-rollback | جزئي | metrics-based |

---

## ⏱️ الجدول الزمني
- **المدة:** 24 يوم عمل
- **الفريق:** 1 DevOps + backend
- **الأولوية:** 🟠 عالية

---

## ✅ معايير القبول
- [x] `ignoreBuildErrors: false` في next.config
- [x] Dependabot يفتح PRs أسبوعياً
- [x] CodeQL + Snyk يمران على كل PR
- [x] Coverage > 80% required
- [x] CODEOWNERS فعّال
- [x] Branch protection على main + staging
- [x] Lighthouse Performance > 85
- [x] Smoke tests بعد كل deploy
- [x] Auto-rollback عند anomaly
