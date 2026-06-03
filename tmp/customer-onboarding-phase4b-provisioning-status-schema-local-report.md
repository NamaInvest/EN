# Customer Onboarding Phase 4B — Provisioning Status Schema Local Report

## 1. Executive Summary

* **هل تم تنفيذ schema محليًا؟** نعم، تم بنجاح إضافة موديل `TenantProvisioningRun` في مخطط الماستر `server_schema.prisma` وإضافة علاقة اختيارية في `TenantAccount`.
* **هل تم إنشاء migration محلية؟** لا، لأن خادم الماستر لا يعتمد على نظام الـ Migrations الصريح (يعتمد على `prisma db push` والمزامنة)، لذا تم تقديم مسودة الـ SQL فقط داخل هذا التقرير لتجنب خلق أي ترحيلات برمجية خطيرة.
* **هل حدث DB change فعلي؟** لا، لم يتم تشغيل أي ترحيل أو تعديل على أي قاعدة بيانات (سواء محلية أو إنتاجية).
* **هل تم commit؟** نعم، تم عمل Commit محلي برقم الهاش المناسب.
* **هل حدث push/deploy؟** لا، لم يحدث أي Push أو Deploy (Production DB Untouched).

---

## 2. Git Baseline

* **Branch:** `main`
* **HEAD before:** `b307657d1cc7edd1b71cbba78f4308dcbd7d7bd4`
* **origin/main:** `b307657d1cc7edd1b71cbba78f4308dcbd7d7bd4`
* **Status before:** نظيف تماماً (Clean).

---

## 3. Schema Changes

| الملف | التغيير | السبب | آمن؟ |
| ----- | ------- | ----- | ---- |
| `server_schema.prisma` | تعديل (Modify) | إضافة موديل `TenantProvisioningRun` وعلاقة الـ `provisioningRuns` في `TenantAccount` | نعم، الإضافة تجميلية تراكمية (Additive) ولا توجد أي حقول إلزامية مضافة للجداول القائمة. |

---

## 4. TenantProvisioningRun Model

تم إضافة المخطط التالي في `server_schema.prisma`:
```prisma
model TenantProvisioningRun {
  id                        String    @id @default(cuid())
  tenantAccountId           Int?      @map("tenant_account_id")
  tenantAccount             TenantAccount? @relation(fields: [tenantAccountId], references: [id], onDelete: SetNull)
  subdomain                 String
  databaseName              String?   @map("database_name")
  status                    String    @default("PENDING")
  currentStep               String?   @map("current_step")
  attemptNo                 Int       @default(1) @map("attempt_no")
  requestId                 String?   @map("request_id")
  createdByClerkUserId      String?   @map("created_by_clerk_user_id")
  createdByEmail            String?   @map("created_by_email")
  startedAt                 DateTime? @map("started_at")
  completedAt               DateTime? @map("completed_at")
  failedAt                  DateTime? @map("failed_at")
  lastRetryAt               DateTime? @map("last_retry_at")
  lastErrorCode             String?   @map("last_error_code")
  lastErrorMessageSanitized String?   @map("last_error_message_sanitized")
  lastErrorDetailsJson      Json?     @map("last_error_details_json")
  metadata                  Json?
  createdAt                 DateTime  @default(now()) @map("created_at")
  updatedAt                 DateTime  @updatedAt @map("updated_at")

  @@index([subdomain])
  @@index([status])
  @@index([requestId])
  @@index([tenantAccountId])
  @@index([createdByClerkUserId])
  @@index([createdAt])
  @@map("tenant_provisioning_runs")
}
```

---

## 5. Migration Plan / Local Migration

* **هل تم إنشاء migration؟** لا (مخطط الماستر يدار عبر prisma db push/manual SQL).
* **اسمها:** لا يوجد.
* **هل هي additive؟** نعم، مسودة الـ SQL التراكمية هي:
  ```sql
  CREATE TABLE IF NOT EXISTS "tenant_provisioning_runs" (
      "id" TEXT NOT NULL,
      "tenant_account_id" INTEGER,
      "subdomain" TEXT NOT NULL,
      "database_name" TEXT,
      "status" TEXT NOT NULL DEFAULT 'PENDING',
      "current_step" TEXT,
      "attempt_no" INTEGER NOT NULL DEFAULT 1,
      "request_id" TEXT,
      "created_by_clerk_user_id" TEXT,
      "created_by_email" TEXT,
      "started_at" TIMESTAMP(3),
      "completed_at" TIMESTAMP(3),
      "failed_at" TIMESTAMP(3),
      "last_retry_at" TIMESTAMP(3),
      "last_error_code" TEXT,
      "last_error_message_sanitized" TEXT,
      "last_error_details_json" JSONB,
      "metadata" JSONB,
      "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
      "updated_at" TIMESTAMP(3) NOT NULL,

      CONSTRAINT "tenant_provisioning_runs_pkey" PRIMARY KEY ("id"),
      CONSTRAINT "tenant_provisioning_runs_tenant_account_id_fkey" FOREIGN KEY ("tenant_account_id") REFERENCES "tenant_accounts"("id") ON DELETE SET NULL ON UPDATE CASCADE
  );

  CREATE INDEX IF NOT EXISTS "tenant_provisioning_runs_subdomain_idx" ON "tenant_provisioning_runs"("subdomain");
  CREATE INDEX IF NOT EXISTS "tenant_provisioning_runs_status_idx" ON "tenant_provisioning_runs"("status");
  CREATE INDEX IF NOT EXISTS "tenant_provisioning_runs_request_id_idx" ON "tenant_provisioning_runs"("request_id");
  CREATE INDEX IF NOT EXISTS "tenant_provisioning_runs_tenant_account_id_idx" ON "tenant_provisioning_runs"("tenant_account_id");
  CREATE INDEX IF NOT EXISTS "tenant_provisioning_runs_created_by_clerk_user_id_idx" ON "tenant_provisioning_runs"("created_by_clerk_user_id");
  CREATE INDEX IF NOT EXISTS "tenant_provisioning_runs_created_at_idx" ON "tenant_provisioning_runs"("created_at");
  ```
* **هل تم تنفيذها؟** لا (NO).
* **هل تم حماية خادم الإنتاج؟** نعم، الإنتاج لم يلمس تماماً (Production Untouched).

---

## 6. Verification Results

* **server_schema prisma validate:** ناجح 🚀.
* **tenant schema validate:** ناجح 🚀.
* **secret scan:** نظيف تماماً وخالي من أية أسرار أو كلمات سر.
* **git status:** فقط تم تعديل `server_schema.prisma` وإنشاء ملف التقرير.

---

## 7. Risk Assessment

* **No production DB change:** مؤكد 100%.
* **No production migration:** مؤكد 100%.
* **No tenant schema change:** مؤكد، لم يتم التعديل على `prisma/schema.prisma`.
* **No runtime API behavior change:** مؤكد، لم يتم إجراء تعديلات على الكود التنفيذي.
* **No deploy / No SSH / No push:** مؤكد 100%.

---

## 8. Commit Details

* **Commit Message:** `feat(onboarding): add tenant provisioning run schema`
* **Files included:**
  - `server_schema.prisma`
  - `tmp/customer-onboarding-phase4b-provisioning-status-schema-local-report.md`
* **Local ahead of origin/main?:** نعم، بـ 1 commit محلي.

---

## 9. Next Recommended Step

NEXT_RECOMMENDED_APPROVAL:
GO_FOR_CUSTOMER_ONBOARDING_PHASE4B_SCHEMA_PUSH_GATE_REVIEW_ONLY
