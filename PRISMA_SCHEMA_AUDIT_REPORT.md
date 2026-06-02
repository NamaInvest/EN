# PRISMA SCHEMA AUDIT REPORT

> **التاريخ:** 2026-06-02 | **تقرير تدقيق مخطط قاعدة البيانات** | **وضع التقييم المقيد**

---

## 1. Summary
- **Checked At**: 2026-06-02T00:12:03.765Z
- **Overall Result**: `PRISMA_AUDIT_WARNINGS`
- **Total Models Analyzed**: `627`
- **Models with Soft-Delete (`deletedAt`):** `41` (6.5%)
- **Models with Composite Indexes (`@@index` / `@@unique` multi-field):** `129`
- **Total Decimal Fields:** `781`
  - *With Specified DB Precision (e.g., Decimal(20,6)):* `635`
  - *Without Specified DB Precision:* `146`
- **Total Float Fields:** `10` (All validated as non-monetary: YES)

---

## 2. Active Compliance & Audit Details

### 🛡️ Monetary Float Check
> [!IMPORTANT]
> **Financial Safety Rule:** Float must never be used to store monetary or financial values (prices, costs, wages, totals) as it leads to floating-point rounding errors.
✅ **Pass:** Zero monetary Float fields detected. All active Floats are confirmed to represent scientific or auxiliary data (e.g., latitude, temperature, confidence scores).

### 📐 Decimal Field DB Precision Details
postgres default decimals can lack bounds if not explicitly specified. Specifying precision (e.g., `@db.Decimal(20, 6)`) is strongly recommended for financial systems.
* **Fields missing explicit DB Precision:** 146
⚠️ **Warning:** The following decimal fields lack explicit `@db.Decimal(p, s)` constraints (Postgres will use defaults):
- `Product.buyPrice`
- `Product.sellPrice`
- `Product.taxRate`
- `Product.minQuantity`
- `Product.currentStock`
- `ProductUnit.sellPrice`
- `ProductUnit.buyPrice`
- `Customer.balance`
- `ProductStock.quantity`
- `SalesInvoice.subtotal`
- `SalesInvoice.discountRate`
- `SalesInvoice.discountValue`
- `SalesInvoice.taxValue`
- `SalesInvoice.total`
- `SalesInvoiceDetail.quantity`
- `SalesInvoiceDetail.price`
- `SalesInvoiceDetail.discountRate`
- `SalesInvoiceDetail.discountValue`
- `SalesInvoiceDetail.taxRate`
- `SalesInvoiceDetail.taxValue`
- `SalesInvoiceDetail.total`
- `SalesReturn.subtotal`
- `SalesReturn.taxValue`
- `SalesReturn.total`
- `SalesReturn.restockingFee`
- `SalesReturnDetail.quantity`
- `SalesReturnDetail.price`
- `SalesReturnDetail.discountRate`
- `SalesReturnDetail.discountValue`
- `SalesReturnDetail.taxRate`
- ... and 116 more fields.

### 🔄 Soft-Delete (`deletedAt`) Configuration
Soft-delete ensures record preservation. Operational tables must support soft-delete instead of hard-deletes.
* **Models WITH Soft-Delete:** 41
* **Models WITHOUT Soft-Delete:** 586 (Typically system configurations, relations tables, or static seeds)
* **Sample models configured with soft-delete:**
- `User`
- `Product`
- `ProductUnit`
- `Customer`
- `SalesInvoice`
- `SalesInvoiceDetail`
- `SalesReturn`
- `PurchaseOrder`
- `PurchaseOrderDetail`
- `PurchaseInvoice`
- `PurchaseInvoiceDetail`
- `PurchaseReturn`
- `StockMovement`
- `Treasury`
- `Employee`
- `Salary`
- `PriceQuote`
- `Booking`
- `Account`
- `JournalEntry`

---

## 3. High Performance Indexing & Composite Indexes
Composite indexes are critical for multi-tenant and foreign-key querying optimization.
* **Models using Multi-Field Composite Indexes:**
- Model **`UserBackupCode`**: index(userId, usedAt)
- Model **`MfaAttempt`**: index(userId, attemptedAt)
- Model **`TrustedDevice`**: index(userId, trustedUntil)
- Model **`MfaRecoveryRequest`**: index(userId, status), index(status, requestedAt)
- Model **`MfaUsedToken`**: unique(userId, tokenHash)
- Model **`UserPermission`**: unique(userId, module)
- Model **`Product`**: unique(tenantId, barcode), index(tenantId, active), index(tenantId, categoryId), index(tenantId, barcode), index(deletedAt, name)
- Model **`Customer`**: index(tenantId, name), index(deletedAt, createdAt)
- Model **`ProductStock`**: unique(productId, stockId), index(productId, stockId, binId)
- Model **`SalesInvoice`**: index(tenantId, customerId, date), index(tenantId, status), index(tenantId, invoiceNo), index(tenantId, branchId, date), index(tenantId, deletedAt), index(tenantId, zatcaIcv), index(tenantId, cleared, date), index(date, deletedAt), index(status, deletedAt)
- Model **`SalesInvoiceDetail`**: index(invoiceId, deletedAt)
- Model **`SalesReturn`**: index(tenantId, date)
- Model **`PurchaseOrder`**: index(status, deletedAt), index(date, deletedAt)
- Model **`PurchaseInvoice`**: index(tenantId, supplierId, date), index(date, deletedAt)
- Model **`StockMovement`**: index(tenantId, productId, date)
- Model **`Treasury`**: index(deletedAt, type)
- Model **`AuditLog`**: index(entityType, entityId)
- Model **`Employee`**: index(active, deletedAt)
- Model **`Attendance`**: index(employeeId, date)
- Model **`Account`**: index(tenantId, code)
- Model **`JournalEntry`**: index(tenantId, status, entryDate), index(tenantId, bookId, entryDate), index(tenantId, entryDate), index(entryDate, deletedAt), index(status, deletedAt)
- Model **`JournalLine`**: index(profitCenterId, accountId), index(projectId, accountId), index(bookId, entryId), index(entryId, accountId)
- Model **`CopaDocument`**: index(postingDate, customerId), index(postingDate, productId)
- Model **`PeriodCloseTask`**: unique(fiscalPeriodId, taskCode), index(fiscalPeriodId, status)
- Model **`ApprovalWorkflowStep`**: unique(workflowId, stepOrder)
- Model **`TenantFeatureFlag`**: unique(tenantAccountId, moduleName), unique(desktopLicenseId, moduleName)
- Model **`FiscalPeriod`**: unique(year, month)
- Model **`YearEndCloseTask`**: unique(runId, taskCode), index(runId, status), index(assigneeUserId, status)
- Model **`OpeningBalance`**: unique(fiscalYearId, accountId, costCenterId, branchId, projectId, bookId), index(fiscalYearId, accountId)
- Model **`ImmutableReport`**: index(fiscalYearId, reportType)
- Model **`ZATCARecord`**: index(invoiceId, invoiceType)
- Model **`FieldAuditLog`**: index(entityType, entityId), index(userId, changedAt)
- Model **`NumberingSequence`**: unique(code, branchId, fiscalYear, fiscalMonth), index(code, isActive)
- Model **`OpenItem`**: index(partyId, partyType, status), index(dueDate, status), index(currency, status), index(documentType, documentId)
- Model **`DisputeCase`**: index(customerId, status), index(assignedToUserId, status), index(raisedAt, status)
- Model **`DisputeCommunication`**: index(caseId, occurredAt)
- Model **`DeductionReason`**: index(category, active)
- Model **`BankStatement`**: index(bankAccountId, openingDate), index(fileFormat, importedAt)
- Model **`BankStatementLine`**: index(statementId, type)
- Model **`IntraDayBalance`**: index(bankAccountId, asOfTimestamp)
- Model **`BankImportError`**: index(bankAccountId, occurredAt)
- Model **`BankReconciliationException`**: index(resolvedAt, assignedToUserId), index(priority, createdAt)
- Model **`OutstandingCheck`**: index(bankAccountId, status)
- Model **`DepositInTransit`**: index(bankAccountId, status)
- Model **`FixedAsset`**: index(status, depreciationMethod), index(categoryId, status), index(locationId, branchId)
- Model **`AssetDepreciationLog`**: index(assetId, periodEnd)
- Model **`AssetImpairmentRecord`**: index(assetId, testDate)
- Model **`AssetMaintenanceRecord`**: index(assetId, performedDate)
- Model **`AssetUsageLog`**: index(assetId, periodEnd)
- Model **`AssetDocument`**: index(assetId, documentType)
- Model **`RoleFieldPermission`**: unique(roleName, modelName, fieldName)
- Model **`IfrsLeaseContract`**: index(status, endDate)
- Model **`IfrsLeaseScheduleLine`**: index(scheduleId, periodNumber), index(scheduleId, periodDate)
- Model **`IfrsLeaseModification`**: index(contractId, modificationDate)
- Model **`IfrsVariableLeasePayment`**: index(contractId, periodDate)
- Model **`PerformanceObligation`**: index(recognitionPattern, status)
- Model **`RevenueRecognitionLine`**: index(scheduleId, recognitionDate), index(status, recognitionDate)
- Model **`RevenueMilestone`**: unique(performanceObligationId, milestoneNumber)
- Model **`StandaloneSellingPrice`**: index(productServiceId, effectiveFrom)
- Model **`DunningLevel`**: index(levelNumber, active)
- Model **`DunningCampaign`**: index(customerId, status)
- Model **`DunningLetter`**: index(customerId, status), index(levelId, generatedAt)
- Model **`DunningCommunication`**: index(letterId, channel)
- Model **`PromiseToPay`**: index(customerId, status), index(promisedDate, status)
- Model **`CollectionAssignment`**: index(agencyId, status)
- Model **`CustomerCreditAction`**: index(customerId, performedAt)
- Model **`PaymentRun`**: index(status, createdAt), index(currency, dueDateUntil)
- Model **`PaymentRunLine`**: index(runId, status), index(currency, status)
- Model **`PaymentRunBankFile`**: index(fileFormat, generatedAt)
- Model **`PaymentRunApproval`**: index(runId, level), index(approverUserId, status)
- Model **`SupplierBankAccount`**: unique(supplierId, iban), index(supplierId, isActive)
- Model **`PaymentBlock`**: index(type, supplierId, active), index(type, invoiceId, active)
- Model **`DiscountOpportunity`**: index(status, discountWindowEnds), index(supplierId, status)
- Model **`CapacityCalendar`**: unique(workCenterId, date)
- Model **`AccountingBook`**: index(type, isActive)
- Model **`BookOnlyJournalCategory`**: unique(bookId, code)
- Model **`CustomFieldValue`**: unique(definitionId, entityId)
- Model **`LeaveBalance`**: unique(employeeId, year, leaveType)
- Model **`StatementBatch`**: index(status, startedAt)
- Model **`StatementAccessLog`**: index(customerId, accessedAt)
- Model **`StatementSchedule`**: index(enabled, nextRunAt)
- Model **`DocumentStateLog`**: index(entityType, entityId)
- Model **`ZakatAssessment`**: index(fiscalYearId, status)
- Model **`PdplDataSubjectRequest`**: index(status, dueDate), index(subjectType, subjectId)
- Model **`PdplConsent`**: unique(subjectType, subjectId, purpose)
- Model **`Notification`**: index(userId, isRead)
- Model **`Comment`**: index(model, recordId)
- Model **`PromptUsageLog`**: index(tenantId, promptKey, createdAt)
- Model **`LiquidityForecast`**: index(tenantId, forecastDate)
- Model **`ShopFloorSession`**: index(tenantId, status)
- Model **`AiConversation`**: index(tenantId, userId)
- Model **`LlmContextCache`**: unique(tenantId, cacheKey)
- Model **`AiToolDefinition`**: unique(tenantId, name)
- Model **`AiToolCallLog`**: index(tenantId, createdAt)
- Model **`ConsolidationMember`**: unique(groupId, entityId)
- Model **`EliminationRule`**: index(tenantId, groupId)
- Model **`DeferredTax`**: index(tenantId, asOfDate)
- Model **`DeferredTaxRollforward`**: unique(tenantId, fiscalYear, itemCode)
- Model **`WmsTask`**: index(tenantId, waveId)
- Model **`InventoryBin`**: unique(warehouseId, binCode)
- Model **`FinancialPeriod`**: unique(tenantId, period), index(tenantId, status)
- Model **`FinancialPeriodModuleLock`**: unique(tenantId, period, module), index(tenantId, status)
- Model **`AccrualEntry`**: index(tenantId, period), index(tenantId, type, status)
- Model **`CollectionActivity`**: index(tenantId, invoiceId), index(tenantId, customerId), index(tenantId, performedAt)
- Model **`PrepaymentSchedule`**: index(tenantId, period, status)
- Model **`DemandForecastV2`**: unique(tenantId, productId, warehouseId, forecastDate), index(tenantId, productId, warehouseId, forecastDate)
- Model **`EmissionLog`**: index(tenantId, date), index(tenantId, scope, date), index(tenantId, branchId, date)
- Model **`EnergyConsumption`**: unique(tenantId, branchId, date, source), index(tenantId, branchId, date)
- Model **`WaterConsumption`**: unique(tenantId, branchId, date)
- Model **`WasteLog`**: index(tenantId, date, type)
- Model **`SustainabilityGoal`**: index(tenantId, active)
- Model **`DiversitySnapshot`**: unique(tenantId, date)
- Model **`EVMSnapshot`**: unique(tenantId, projectId, asOfDate), index(tenantId, projectId)
- Model **`ActivityPool`**: unique(tenantId, name, period), index(tenantId, period)
- Model **`ProductActivityConsumption`**: index(tenantId, period)
- Model **`PoAcknowledgment`**: index(tenantId, vendorId)
- Model **`AdvanceShipNotice`**: index(tenantId, poId), index(tenantId, vendorId, status)
- Model **`VendorOnboardingStep`**: unique(vendorId, step), index(tenantId, vendorId)
- Model **`IceTenantSubscription`**: index(tenantId, status)
- Model **`IcePlanModule`**: unique(planId, moduleId)
- Model **`IceTenantModule`**: unique(tenantId, moduleId)
- Model **`IceAuditLog`**: index(entityType, entityId)
- Model **`IdempotencyRecord`**: unique(tenantId, endpoint, key)
- Model **`OutboxEvent`**: index(status, createdAt), unique(tenantId, idempotencyKey)
- Model **`SprintStory`**: unique(sprintId, storyId)
- Model **`OpenItemMatching`**: index(tenantId, salesInvoiceId, deletedAt), index(tenantId, purchaseInvoiceId, deletedAt), index(tenantId, treasuryId, deletedAt), index(tenantId, salesReturnId, deletedAt), index(tenantId, purchaseReturnId, deletedAt)
- Model **`ConsolidationEliminationRequest`**: unique(tenantId, groupId, periodKey, postingReference), index(tenantId, groupId, periodKey)
- Model **`ConsolidationEliminationApproval`**: index(tenantId, requestId)
- Model **`ConsolidationEliminationPosting`**: index(tenantId, requestId)

---

## 4. Final Verdict & Status
Overall prisma audit status set to `PRISMA_AUDIT_WARNINGS`.
