const fs = require('fs');
const schemaPath = 'd:/namasoft9-3-main/prisma/schema.prisma';

const newModels = `
// ==================== ICE SUPER ADMIN MODULE ====================

/// @description: Super Admin Users for the ICE panel. Isolated from tenant users.
model AdminUser {
  id                Int       @id @default(autoincrement())
  username          String    @unique
  email             String    @unique
  passwordHash      String    @map("password_hash")
  fullName          String    @map("full_name")
  roleId            Int       @map("role_id")
  active            Boolean   @default(true)
  twoFactorSecret   String?   @map("two_factor_secret")
  twoFactorEnabled  Boolean   @default(false) @map("two_factor_enabled")
  lastLoginAt       DateTime? @map("last_login_at")
  lastLoginIp       String?   @map("last_login_ip")
  createdAt         DateTime  @default(now()) @map("created_at")
  updatedAt         DateTime  @updatedAt @map("updated_at")
  deletedAt         DateTime? @map("deleted_at")

  role              AdminRole         @relation(fields: [roleId], references: [id])
  auditLogs         AdminAuditLog[]
  supportTickets    SupportTicket[]   @relation("TicketAssignee")
  loginLogs         AdminLoginLog[]
  supportReplies    SupportReply[]

  @@map("admins")
}

/// @description: Roles mapping to permissions (e.g., Support, Super Admin, Sales).
model AdminRole {
  id          Int         @id @default(autoincrement())
  name        String      @unique // Super Admin, Support, Sales, Accountant, Technical
  permissions String      @db.Text // JSON Array of permissions
  createdAt   DateTime    @default(now()) @map("created_at")
  updatedAt   DateTime    @updatedAt @map("updated_at")
  admins      AdminUser[]

  @@map("admin_roles")
}

/// @description: Available plans (e.g., Free Trial, Enterprise) containing limit configurations.
model SubscriptionPlan {
  id                Int       @id @default(autoincrement())
  name              String    @unique 
  priceMonthly      Decimal   @default(0) @map("price_monthly") @db.Decimal(10, 2)
  priceYearly       Decimal   @default(0) @map("price_yearly") @db.Decimal(10, 2)
  maxUsers          Int       @default(1) @map("max_users")
  maxBranches       Int       @default(1) @map("max_branches")
  maxInvoices       Int       @default(100) @map("max_invoices")
  maxProducts       Int       @default(100) @map("max_products")
  maxDesktopDevices Int       @default(0) @map("max_desktop_devices")
  allowZatcaPhase2  Boolean   @default(false) @map("allow_zatca_phase2")
  allowDesktop      Boolean   @default(false) @map("allow_desktop")
  dailyBackups      Boolean   @default(false) @map("daily_backups")
  active            Boolean   @default(true)
  createdAt         DateTime  @default(now()) @map("created_at")
  updatedAt         DateTime  @updatedAt @map("updated_at")
  deletedAt         DateTime? @map("deleted_at")

  subscriptions     TenantSubscription[]
  planModules       PlanModule[]

  @@map("plans")
}

/// @description: Active/Historical subscriptions mapped to tenant subdomain string IDs.
model TenantSubscription {
  id               Int       @id @default(autoincrement())
  tenantId         String    @unique @map("tenant_id") // References subdomain
  planId           Int       @map("plan_id")
  status           String    @default("TRIAL") // TRIAL, ACTIVE, SUSPENDED, EXPIRED, CANCELLED
  startDate        DateTime  @map("start_date")
  endDate          DateTime  @map("end_date")
  billingCycle     String    @default("YEARLY") // MONTHLY, YEARLY
  paymentMethod    String?   @map("payment_method") 
  autoRenew        Boolean   @default(false) @map("auto_renew")
  createdAt        DateTime  @default(now()) @map("created_at")
  updatedAt        DateTime  @updatedAt @map("updated_at")

  plan             SubscriptionPlan      @relation(fields: [planId], references: [id])
  invoices         SubscriptionInvoice[]
  desktopLicenses  DesktopLicense[]

  @@index([tenantId, status])
  @@index([endDate])
  @@map("subscriptions")
}

/// @description: Billing and invoices generated for the subscriptions.
model SubscriptionInvoice {
  id               Int       @id @default(autoincrement())
  invoiceNo        String    @unique @map("invoice_no")
  tenantId         String    @map("tenant_id")
  subscriptionId   Int       @map("subscription_id")
  amount           Decimal   @default(0) @db.Decimal(10, 2)
  vatAmount        Decimal   @default(0) @map("vat_amount") @db.Decimal(10, 2)
  total            Decimal   @default(0) @db.Decimal(10, 2)
  status           String    @default("PENDING") // PAID, PENDING, FAILED, REFUNDED
  paymentMethod    String?   @map("payment_method")
  paymentGateRef   String?   @map("payment_gate_ref") // Moyasar / HyperPay ID
  receiptNo        String?   @map("receipt_no") 
  issueDate        DateTime  @default(now()) @map("issue_date")
  dueDate          DateTime  @map("due_date")
  paidAt           DateTime? @map("paid_at")

  subscription     TenantSubscription @relation(fields: [subscriptionId], references: [id])

  @@index([tenantId])
  @@index([status])
  @@map("subscription_invoices")
}

/// @description: Available ERP System Modules (e.g., ACC, POS, CRM).
model SystemModule {
  id          Int      @id @default(autoincrement())
  code        String   @unique 
  nameAr      String   @map("name_ar")
  nameEn      String   @map("name_en")
  description String?
  parentId    Int?     @map("parent_id") // Self relation for sub-modules
  isActive    Boolean  @default(true) @map("is_active")
  createdAt   DateTime @default(now()) @map("created_at")

  parent        SystemModule?  @relation("SubModules", fields: [parentId], references: [id])
  subModules    SystemModule[] @relation("SubModules")
  planModules   PlanModule[]
  tenantModules TenantModule[]

  @@map("system_modules")
}

/// @description: Modules automatically granted based on chosen Plan.
model PlanModule {
  id          Int      @id @default(autoincrement())
  planId      Int      @map("plan_id")
  moduleId    Int      @map("module_id")

  plan        SubscriptionPlan @relation(fields: [planId], references: [id], onDelete: Cascade)
  module      SystemModule     @relation(fields: [moduleId], references: [id], onDelete: Cascade)

  @@unique([planId, moduleId])
  @@map("plan_modules")
}

/// @description: Specifically overridden module access per Tenant.
model TenantModule {
  id          Int      @id @default(autoincrement())
  tenantId    String   @map("tenant_id")
  moduleId    Int      @map("module_id")
  isActive    Boolean  @default(true) @map("is_active")

  module      SystemModule @relation(fields: [moduleId], references: [id], onDelete: Cascade)

  @@unique([tenantId, moduleId])
  @@map("tenant_modules")
}

/// @description: Device-locked licenses for Qt/Electron Desktop apps syncing to Cloud.
model DesktopLicense {
  id                Int       @id @default(autoincrement())
  licenseKey        String    @unique @map("license_key")
  tenantId          String    @map("tenant_id")
  subscriptionId    Int       @map("subscription_id")
  hardwareId        String?   @unique @map("hardware_id") // Unique Device Fingerprint
  deviceName        String?   @map("device_name")
  status            String    @default("ACTIVE") // ACTIVE, REVOKED, EXPIRED
  appVersion        String?   @map("app_version")
  lastSyncAt        DateTime? @map("last_sync_at")
  offlineGraceDays  Int       @default(7) @map("offline_grace_days")
  createdAt         DateTime  @default(now()) @map("created_at")
  updatedAt         DateTime  @updatedAt @map("updated_at")

  subscription      TenantSubscription @relation(fields: [subscriptionId], references: [id], onDelete: Cascade)

  @@index([tenantId])
  @@map("desktop_licenses")
}

/// @description: Immutable audit trail for all operations executed inside ICE Admin Panel.
model AdminAuditLog {
  id          Int      @id @default(autoincrement())
  adminId     Int      @map("admin_id")
  action      String   // CREATE, UPDATE, DELETE, IMPERSONATE
  entityType  String   @map("entity_type") // TENANT, SUBSCRIPTION, ADMIN, MODULE
  entityId    String   @map("entity_id")
  oldValues   String?  @db.Text // JSON representation of previous state
  newValues   String?  @db.Text // JSON representation of new state
  ipAddress   String   @map("ip_address")
  userAgent   String?  @map("user_agent")
  createdAt   DateTime @default(now()) @map("created_at")

  admin       AdminUser @relation(fields: [adminId], references: [id])

  @@index([entityType, entityId])
  @@index([createdAt])
  @@map("admin_audit_logs")
}

/// @description: Logon monitoring for security and brute force mitigation.
model AdminLoginLog {
  id          Int      @id @default(autoincrement())
  adminId     Int?     @map("admin_id") // Nullable if incorrect username
  username    String?
  ipAddress   String   @map("ip_address")
  userAgent   String?  @map("user_agent")
  status      String   // SUCCESS, FAILED_PASSWORD, FAILED_2FA, LOCKED
  createdAt   DateTime @default(now()) @map("created_at")

  admin       AdminUser? @relation(fields: [adminId], references: [id])

  @@index([ipAddress])
  @@index([createdAt])
  @@map("admin_login_logs")
}

/// @description: Internal ticketing system inside ICE to communicate with tenants.
model SupportTicket {
  id          Int      @id @default(autoincrement())
  ticketNo    String   @unique @map("ticket_no")
  tenantId    String   @map("tenant_id")
  subject     String
  status      String   @default("OPEN") // OPEN, IN_PROGRESS, RESOLVED, CLOSED
  priority    String   @default("MEDIUM") // LOW, MEDIUM, HIGH, CRITICAL
  assignedTo  Int?     @map("assigned_to")
  createdAt   DateTime @default(now()) @map("created_at")
  updatedAt   DateTime @updatedAt @map("updated_at")

  assignee    AdminUser?     @relation("TicketAssignee", fields: [assignedTo], references: [id])
  replies     SupportReply[]

  @@index([tenantId])
  @@index([status])
  @@map("support_tickets")
}

/// @description: Ticket communication thread, identifying internal vs public replies.
model SupportReply {
  id          Int      @id @default(autoincrement())
  ticketId    Int      @map("ticket_id")
  adminId     Int?     @map("admin_id") // Null if replied by tenant
  tenantUserId Int?    @map("tenant_user_id") 
  message     String   @db.Text
  isInternal  Boolean  @default(false) @map("is_internal") // Hidden from tenants
  createdAt   DateTime @default(now()) @map("created_at")

  ticket      SupportTicket @relation(fields: [ticketId], references: [id], onDelete: Cascade)
  admin       AdminUser?    @relation(fields: [adminId], references: [id])

  @@map("support_replies")
}

/// @description: Global platform configuration and variables.
model SystemSetting {
  id          Int      @id @default(autoincrement())
  key         String   @unique
  value       String   @db.Text
  description String?
  updatedAt   DateTime @updatedAt @map("updated_at")

  @@map("system_settings")
}
`;

let content = fs.readFileSync(schemaPath, 'utf8');
if (!content.includes('model AdminUser')) {
    fs.writeFileSync(schemaPath, content + '\\n\\n' + newModels);
    console.log("SUCCESS: ICE Super Admin models injected into schema.prisma");
} else {
    console.log("SKIPPED: AdminUser model already exists in schema.prisma");
}
