const fs = require('fs');
const schemaPath = 'd:/namasoft9-3-main/prisma/schema.prisma';

const newModels = `
// ==================== ICE SUPER ADMIN MODULE ====================

model IceAdmin {
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

  role              IceAdminRole      @relation(fields: [roleId], references: [id])
  auditLogs         IceAuditLog[]
  supportTickets    IceSupportTicket[] @relation("TicketAssignee")
  loginLogs         IceLoginLog[]
  supportReplies    IceSupportReply[]

  @@map("ice_admins")
}

model IceAdminRole {
  id          Int         @id @default(autoincrement())
  name        String      @unique 
  permissions String      @db.Text
  createdAt   DateTime    @default(now()) @map("created_at")
  updatedAt   DateTime    @updatedAt @map("updated_at")
  admins      IceAdmin[]

  @@map("ice_admin_roles")
}

model IceSubscriptionPlan {
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

  subscriptions     IceTenantSubscription[]
  planModules       IcePlanModule[]

  @@map("ice_plans")
}

model IceTenantSubscription {
  id               Int       @id @default(autoincrement())
  tenantId         String    @unique @map("tenant_id") 
  planId           Int       @map("plan_id")
  status           String    @default("TRIAL") 
  startDate        DateTime  @map("start_date")
  endDate          DateTime  @map("end_date")
  billingCycle     String    @default("YEARLY") 
  paymentMethod    String?   @map("payment_method") 
  autoRenew        Boolean   @default(false) @map("auto_renew")
  createdAt        DateTime  @default(now()) @map("created_at")
  updatedAt        DateTime  @updatedAt @map("updated_at")

  plan             IceSubscriptionPlan      @relation(fields: [planId], references: [id])
  invoices         IceSubscriptionInvoice[]
  desktopLicenses  IceDesktopLicense[]

  @@index([tenantId, status])
  @@index([endDate])
  @@map("ice_tenant_subscriptions")
}

model IceSubscriptionInvoice {
  id               Int       @id @default(autoincrement())
  invoiceNo        String    @unique @map("invoice_no")
  tenantId         String    @map("tenant_id")
  subscriptionId   Int       @map("subscription_id")
  amount           Decimal   @default(0) @db.Decimal(10, 2)
  vatAmount        Decimal   @default(0) @map("vat_amount") @db.Decimal(10, 2)
  total            Decimal   @default(0) @db.Decimal(10, 2)
  status           String    @default("PENDING")
  paymentMethod    String?   @map("payment_method")
  paymentGateRef   String?   @map("payment_gate_ref")
  receiptNo        String?   @map("receipt_no") 
  issueDate        DateTime  @default(now()) @map("issue_date")
  dueDate          DateTime  @map("due_date")
  paidAt           DateTime? @map("paid_at")

  subscription     IceTenantSubscription @relation(fields: [subscriptionId], references: [id])

  @@index([tenantId])
  @@index([status])
  @@map("ice_subscription_invoices")
}

model IceSystemModule {
  id          Int      @id @default(autoincrement())
  code        String   @unique 
  nameAr      String   @map("name_ar")
  nameEn      String   @map("name_en")
  description String?
  parentId    Int?     @map("parent_id") 
  isActive    Boolean  @default(true) @map("is_active")
  createdAt   DateTime @default(now()) @map("created_at")

  parent        IceSystemModule?  @relation("SubModules", fields: [parentId], references: [id])
  subModules    IceSystemModule[] @relation("SubModules")
  planModules   IcePlanModule[]
  tenantModules IceTenantModule[]

  @@map("ice_system_modules")
}

model IcePlanModule {
  id          Int      @id @default(autoincrement())
  planId      Int      @map("plan_id")
  moduleId    Int      @map("module_id")

  plan        IceSubscriptionPlan @relation(fields: [planId], references: [id], onDelete: Cascade)
  module      IceSystemModule     @relation(fields: [moduleId], references: [id], onDelete: Cascade)

  @@unique([planId, moduleId])
  @@map("ice_plan_modules")
}

model IceTenantModule {
  id          Int      @id @default(autoincrement())
  tenantId    String   @map("tenant_id")
  moduleId    Int      @map("module_id")
  isActive    Boolean  @default(true) @map("is_active")

  module      IceSystemModule @relation(fields: [moduleId], references: [id], onDelete: Cascade)

  @@unique([tenantId, moduleId])
  @@map("ice_tenant_modules")
}

model IceDesktopLicense {
  id                Int       @id @default(autoincrement())
  licenseKey        String    @unique @map("license_key")
  tenantId          String    @map("tenant_id")
  subscriptionId    Int       @map("subscription_id")
  hardwareId        String?   @unique @map("hardware_id")
  deviceName        String?   @map("device_name")
  status            String    @default("ACTIVE") 
  appVersion        String?   @map("app_version")
  lastSyncAt        DateTime? @map("last_sync_at")
  offlineGraceDays  Int       @default(7) @map("offline_grace_days")
  createdAt         DateTime  @default(now()) @map("created_at")
  updatedAt         DateTime  @updatedAt @map("updated_at")

  subscription      IceTenantSubscription @relation(fields: [subscriptionId], references: [id], onDelete: Cascade)

  @@index([tenantId])
  @@map("ice_desktop_licenses")
}

model IceAuditLog {
  id          Int      @id @default(autoincrement())
  adminId     Int      @map("admin_id")
  action      String   
  entityType  String   @map("entity_type")
  entityId    String   @map("entity_id")
  oldValues   String?  @db.Text
  newValues   String?  @db.Text
  ipAddress   String   @map("ip_address")
  userAgent   String?  @map("user_agent")
  createdAt   DateTime @default(now()) @map("created_at")

  admin       IceAdmin @relation(fields: [adminId], references: [id])

  @@index([entityType, entityId])
  @@index([createdAt])
  @@map("ice_audit_logs")
}

model IceLoginLog {
  id          Int      @id @default(autoincrement())
  adminId     Int?     @map("admin_id")
  username    String?
  ipAddress   String   @map("ip_address")
  userAgent   String?  @map("user_agent")
  status      String   
  createdAt   DateTime @default(now()) @map("created_at")

  admin       IceAdmin? @relation(fields: [adminId], references: [id])

  @@index([ipAddress])
  @@index([createdAt])
  @@map("ice_login_logs")
}

model IceSupportTicket {
  id          Int      @id @default(autoincrement())
  ticketNo    String   @unique @map("ticket_no")
  tenantId    String   @map("tenant_id")
  subject     String
  status      String   @default("OPEN")
  priority    String   @default("MEDIUM") 
  assignedTo  Int?     @map("assigned_to")
  createdAt   DateTime @default(now()) @map("created_at")
  updatedAt   DateTime @updatedAt @map("updated_at")

  assignee    IceAdmin?     @relation("TicketAssignee", fields: [assignedTo], references: [id])
  replies     IceSupportReply[]

  @@index([tenantId])
  @@index([status])
  @@map("ice_support_tickets")
}

model IceSupportReply {
  id          Int      @id @default(autoincrement())
  ticketId    Int      @map("ticket_id")
  adminId     Int?     @map("admin_id")
  tenantUserId Int?    @map("tenant_user_id") 
  message     String   @db.Text
  isInternal  Boolean  @default(false) @map("is_internal")
  createdAt   DateTime @default(now()) @map("created_at")

  ticket      IceSupportTicket @relation(fields: [ticketId], references: [id], onDelete: Cascade)
  admin       IceAdmin?    @relation(fields: [adminId], references: [id])

  @@map("ice_support_replies")
}

model IceSystemSetting {
  id          Int      @id @default(autoincrement())
  key         String   @unique
  value       String   @db.Text
  description String?
  updatedAt   DateTime @updatedAt @map("updated_at")

  @@map("ice_system_settings")
}
`;

let content = fs.readFileSync(schemaPath, 'utf8');
if (!content.includes('model IceAdmin')) {
    fs.writeFileSync(schemaPath, content + '\n\n' + newModels);
    console.log("SUCCESS: ICE Super Admin models injected into schema.prisma");
} else {
    console.log("SKIPPED: AdminUser model already exists in schema.prisma");
}
