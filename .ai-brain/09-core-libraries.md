# 09 - المكتبات والأدوات الأساسية (Core Libraries & Utils)

> **عدد الملفات في src/lib:** 591
> **تم التوليد تلقائياً بتاريخ:** 2026-06-02T07:57:11.696Z

## `src/lib/ab-testing.ts` (89 سطر)
### الثوابت المُصدّرة:
- `abTesting`

## `src/lib/account-hierarchy-engine.ts` (61 سطر)
### الفئات:
- `AccountHierarchyEngine`

## `src/lib/accounting/year-end-close.ts` (345 سطر)
### الفئات:
- `YearEndCloseEngine`
### الواجهات (Interfaces):
- `YearEndCloseValidation`
- `ClosingJEResult`

## `src/lib/accounting-engine.ts` (100 سطر)
### الفئات:
- `AccountingEngine`

## `src/lib/activity-engine.ts` (36 سطر)
### الفئات:
- `ActivityEngine`

## `src/lib/aging-engine.ts` (162 سطر)
### الفئات:
- `AgingEngine`
### الواجهات (Interfaces):
- `AgingBucket`
- `AgingReportResult`

## `src/lib/ai/ai-finetuning-engine.ts` (14 سطر)
### الفئات:
- `AiFinetuningEngine`

## `src/lib/ai/ai-governance-engine.ts` (14 سطر)
### الفئات:
- `AiGovernanceEngine`

## `src/lib/ai/ai-vision-engine.ts` (14 سطر)
### الفئات:
- `AiVisionEngine`

## `src/lib/ai/ai-voice-engine.ts` (14 سطر)
### الفئات:
- `AiVoiceEngine`

## `src/lib/ai/context-manager.ts` (108 سطر)
### الفئات:
- `ContextManager`
### الواجهات (Interfaces):
- `ContextChunk`
- `AllocatedContext`

## `src/lib/ai/multi-agent-engine.ts` (81 سطر)
### الفئات:
- `MultiAgentEngine`
### الواجهات (Interfaces):
- `AgentTask`
### الأنواع (Types):
- `AgentRole`

## `src/lib/ai-copilot-engine.ts` (53 سطر)
### الفئات:
- `AICopilotEngine`

## `src/lib/ai-cost.ts` (100 سطر)
### الثوابت المُصدّرة:
- `aiCost`

## `src/lib/ai-eval.ts` (178 سطر)
### الثوابت المُصدّرة:
- `aiEval`
- `NAMA_EVAL_SUITE`

## `src/lib/ai-job-queue.ts` (133 سطر)
### الدوال المُصدّرة:
- `registerWorker(queueName: string, handler: JobHandler)`
- `enqueueJob(queueName: string, payload: any, maxAttempts: number = 3)`
- `getJobStatus(jobId: string)`
- `getQueueJobs(queueName: string, limit: number = 50)`
- `getQueueStats()`

## `src/lib/ai-personas.ts` (67 سطر)
### الدوال المُصدّرة:
- `getPersona(id: string)`
### الثوابت المُصدّرة:
- `personas`
### الواجهات (Interfaces):
- `AIPersona`

## `src/lib/allocation-engine.ts` (179 سطر)
### الفئات:
- `AllocationEngine`

## `src/lib/ap-ocr-engine.ts` (77 سطر)
### الفئات:
- `APOCREngine`
### الواجهات (Interfaces):
- `ExtractedInvoice`

## `src/lib/api/api-key-auth.ts` (156 سطر)
### الدوال المُصدّرة:
- `authenticateApiKey(req: NextRequest)`
- `requireScope(scope: string)`
- `invalidateApiKeyCache(rawKey?: string)`
- `generateApiKey()`
### الواجهات (Interfaces):
- `ApiKeyAuth`

## `src/lib/api/idempotency.ts` (164 سطر)
### الدوال المُصدّرة:
- `withIdempotencyMiddleware(handler: RouteHandler, options?: {
  required?: boolean;
  ttl?: number;
})`
- `getIdempotencyCacheStats()`
### الثوابت المُصدّرة:
- `POST`
### الأنواع (Types):
- `RouteHandler`

## `src/lib/api/rate-limit.ts` (211 سطر)
### الدوال المُصدّرة:
- `rateLimit(key: string, options: RateLimitOptions)`
- `getClientIp(req: { headers: { get: (key: string)`
- `checkApiKeyRateLimit(
  quota: ApiKeyQuota,
  req?: { nextUrl?: { pathname: string } }
)`
- `getApiKeyQuotaStats(quota: ApiKeyQuota, path = 'api')`
- `checkRateLimit(
  req: { headers: { get: (key: string)`
### الثوابت المُصدّرة:
- `RATE_LIMITS`
### الواجهات (Interfaces):
- `ApiKeyQuota`
### الأنواع (Types):
- `RateLimitPreset`

## `src/lib/api/validate-request.ts` (240 سطر)
### الدوال المُصدّرة:
- `POST(req: NextRequest)`
### الثوابت المُصدّرة:
- `SalesInvoiceItemSchema`
- `CreateSalesInvoiceSchema`
- `PostInvoiceSchema`
- `CreateSalesReturnSchema`
- `PurchaseOrderItemSchema`
- `CreatePurchaseOrderSchema`
- `ReceiveGRNSchema`
- `StockTransferSchema`
- `StockAdjustmentSchema`
- `RunPayrollSchema`
- `PostPayrollSchema`
- `JournalLineSchema`
- `CreateJournalEntrySchema`
- `CreatePaymentSchema`
- `CreateLeaveRequestSchema`
- `PaginationSchema`
- `DateRangeSchema`
- `TenantQuerySchema`

## `src/lib/api/versioning.ts` (122 سطر)
### الدوال المُصدّرة:
- `extractApiVersion(req: NextRequest)`
- `validateVersion(version: number)`
- `addVersionHeaders(response: NextResponse, version: number)`
- `rewriteVersionedUrl(req: NextRequest)`
- `getVersionInfo(version: number)`
### الواجهات (Interfaces):
- `VersionInfo`

## `src/lib/api/with-cron.ts` (97 سطر)
### الدوال المُصدّرة:
- `withCron(handler: CronHandler)`
- `generateCronSignature(path: string, secret: string = CRON_SECRET)`
### الثوابت المُصدّرة:
- `POST`

## `src/lib/api/with-route.ts` (393 سطر)
### الدوال المُصدّرة:
- `withRoute(handler: RouteHandler, options: WithRouteOptions = {})`
### الواجهات (Interfaces):
- `RouteAuth`
- `RouteContext`
- `WithRouteOptions`
### الأنواع (Types):
- `RouteHandler`
- `RateLimitTier`

## `src/lib/api/_test-route.ts` (15 سطر)
### الثوابت المُصدّرة:
- `GET`
- `POST`

## `src/lib/api-error.ts` (115 سطر)
### الدوال المُصدّرة:
- `apiError(
    error: unknown,
    fallback = 'حدث خطأ في المعالجة، يرجى المحاولة لاحقاً)`
- `knownError(message: string, status = 400)`
- `validateAmount(value: unknown, fieldName = 'المبلغ')`
- `validatePositiveInt(value: unknown, fieldName = 'المعرّف')`
- `requireFields(body: Record<string, unknown>, fields: string[])`

## `src/lib/api-handler.ts` (216 سطر)
### الدوال المُصدّرة:
- `withApiHandler(handler: RouteHandler, options: HandlerOptions = {})`
- `handleApiError(error: unknown)`
### الثوابت المُصدّرة:
- `POST`
### الفئات:
- `AppError`
### الواجهات (Interfaces):
- `HandlerContext`

## `src/lib/api-keys.ts` (141 سطر)
### الثوابت المُصدّرة:
- `apiKeys`
- `API_SCOPES`

## `src/lib/approval-engine.ts` (306 سطر)
### الفئات:
- `ApprovalEngine`
### الواجهات (Interfaces):
- `SubmitOptions`
- `ApproveOptions`
- `RejectOptions`
- `ApprovalStatus`

## `src/lib/approval-sla-engine.ts` (277 سطر)
### الفئات:
- `ApprovalSLAEngine`
### الواجهات (Interfaces):
- `SLAConfig`
- `OverdueApproval`
- `SLACheckResult`

## `src/lib/approval-workflow-engine.ts` (28 سطر)
### الفئات:
- `ApprovalWorkflowEngine`

## `src/lib/aps-scheduler.ts` (114 سطر)
### الفئات:
- `APSScheduler`
### الأنواع (Types):
- `ScheduledJob`

## `src/lib/aro-engine.ts` (25 سطر)
### الفئات:
- `AROEngine`

## `src/lib/asset-lifecycle-engine.ts` (279 سطر)
### الفئات:
- `AssetLifecycleEngine`
### الواجهات (Interfaces):
- `AssetInput`
- `DepreciationScheduleRow`
- `AssetSchedule`
- `ImpairmentTest`
- `DisposalResult`
### الأنواع (Types):
- `DepreciationMethod`

## `src/lib/asset-physical-verification-engine.ts` (167 سطر)
### الفئات:
- `AssetPhysicalVerificationEngine`
### الواجهات (Interfaces):
- `VerificationScan`
- `VerificationVarianceReport`

## `src/lib/asset-revaluation-engine.ts` (95 سطر)
### الفئات:
- `AssetRevaluationEngine`
### الواجهات (Interfaces):
- `RevaluationRequest`

## `src/lib/ats-engine.ts` (42 سطر)
### الفئات:
- `ATSEngine`

## `src/lib/audit-trail.ts` (56 سطر)
### الدوال المُصدّرة:
- `logAuditEvent(
  txOrPrisma: Prisma.TransactionClient | PrismaClient,
  payload: AuditEventPay)`
### الواجهات (Interfaces):
- `AuditEventPayload`

## `src/lib/audit.ts` (27 سطر)
### الدوال المُصدّرة:
- `logAuditAction(params: {
    userId: number;
    action: string;
    tableName: string;
   )`

## `src/lib/auth.ts` (234 سطر)
### الدوال المُصدّرة:
- `hashPassword(password: string)`
- `comparePassword(password: string, hash: string)`
- `generateToken(payload: JWTPayload)`
- `verifyToken(token: string)`
- `getTokenFromRequest(request: NextRequest)`
- `getUserFromRequest(request: NextRequest)`
- `generateSessionToken()`
- `hasPermission(userId: number, module: string, prismaClient?: any)`
- `isLegacyAdmin(userId: number, prismaClient?: any)`
- `withGuard(handler: (request: NextRequest, params: any, user: JWTPayload)`
### الثوابت المُصدّرة:
- `GET`
### الواجهات (Interfaces):
- `JWTPayload`

## `src/lib/auto-decompose.ts` (94 سطر)
### الدوال المُصدّرة:
- `autoDecomposeIfNeeded(
    tx: TxClient,
    productId: number,
    soldQty: number
)`

## `src/lib/auto-journal.test.ts` (170 سطر)

## `src/lib/auto-journal.ts` (1240 سطر)
### الدوال المُصدّرة:
- `postSalesInvoice(invoice: any)`
- `postPurchaseInvoice(invoice: any)`
- `postExpense(expense: {
    id: number;
    category: string;
    amount: number;
    des)`
- `postSalesReturn(ret: {
    returnNo: number;
    total: number;
    taxValue: number;
    to)`
- `postSalary(salary: {
    employeeName: string;
    netSalary: number;
    userId?: numbe)`
- `postStockTransfer(transfer: {
    movementId: number;
    reference: string;
    type: 'transit)`
- `postPurchaseReturn(ret: {
    returnNo: number;
    subtotal: number;
    taxValue: number;
   )`
- `postInventoryAdjustment(adj: {
    productId: number;
    diffCost: number; // positive = increase sto)`
- `postGRN(grn: {
    grnNo: number;
    totalCost: number;
    supplierName?: string;
)`
- `postManufacturingCompletion(params: {
    orderNumber: string;
    standardCost: number;  // التكلفة المعي)`
- `postMaterialIssueToWIP(params: {
    orderNumber: string;
    materialCost: number;
    userId?: num)`
- `postWagePayrollAccrual(params: {
    payrollId: string;
    grossAmount: number;
    netAmount: numb)`
- `postEmployerGOSIAccrual(params: {
    payrollId: string;
    employerGosiAmount: number;
    userId?:)`
- `postWpsPayment(params: {
    paymentId: string;
    totalPaid: number;
    bankAccountCode?:)`
- `postEOSAccrual(params: {
    period: string; // e.g. "2026-05"
    accrualAmount: number;
  )`
- `inheritDimensions(
    headerDims: Partial<JournalDimensions>,
    lineDims?: Partial<JournalDim)`
- `validateDimensionRules(
    accountCode: string,
    dims: Partial<JournalDimensions>,
    costCente)`
- `postAssetAcquisition(params: {
    assetId: string;
    assetName: string;
    cost: number;
    )`
- `postMonthlyDepreciation(params: {
    period: string; // e.g. "2026-05"
    assetId: string;
    depr)`
- `postAssetDisposal(params: {
    assetId: string;
    originalCost: number;
    accumulatedDepre)`
- `postAccrualEntry(params: {
    expenseAccountCode: string; // e.g. SALARIES or ELECTRICITY
    )`
- `postDeferralEntry(params: {
    amount: number;
    description: string;
    reference: string;)`
- `postInstallmentBilling(params: {
    contractId: string;
    totalAmount: number; // Principal + Inte)`
- `postInstallmentReceive(params: {
    contractId: string;
    installmentAmount: number;
    principa)`
- `postGiftCardSold(params: {
    cardId: string;
    amount: number;
    paymentType: 'cash' | ')`
- `postFXRevaluation(params: {
    period: string;
    accountCode: string; // e.g. AP or AR
    b)`
- `postPurchasePayment(params: {
    invoiceNo: string | number;
    amount: number;
    paymentType)`
- `postSalesPayment(params: {
    invoiceNo: string | number;
    amount: number;
    paymentType)`
- `reverseJournalByReference(params: {
    originalReference: string;
    userId?: number | null;
    bran)`
### الأنواع (Types):
- `JournalDimensions`

## `src/lib/b2b-auth.ts` (37 سطر)
### الدوال المُصدّرة:
- `generateB2BToken(payload: B2BJWTPayload)`
- `verifyB2BToken(token: string)`
- `getB2BUserFromRequest(request: NextRequest)`
### الواجهات (Interfaces):
- `B2BJWTPayload`

## `src/lib/backup-engine.ts` (86 سطر)
### الفئات:
- `BackupEngine`

## `src/lib/bad-debt-engine.ts` (114 سطر)
### الفئات:
- `BadDebtEngine`
### الواجهات (Interfaces):
- `Invoice`
- `BadDebtReport`

## `src/lib/bank-feed-engine.ts` (46 سطر)
### الفئات:
- `BankFeedEngine`

## `src/lib/bank-files/sepa-pain-001.ts` (42 سطر)
### الفئات:
- `SEPAFileGenerator`

## `src/lib/bank-parsers/mt940.ts` (127 سطر)
### الفئات:
- `MT940Parser`
### الواجهات (Interfaces):
- `ParsedBankLine`
- `ParsedBankStatement`

## `src/lib/bank-recon-engine.ts` (127 سطر)
### الفئات:
- `BankReconEngine`

## `src/lib/bank-recon-exceptions.ts` (218 سطر)
### الفئات:
- `BankReconExceptionEngine`
### الواجهات (Interfaces):
- `ReconException`
- `ExceptionSummary`
### الأنواع (Types):
- `ExceptionStatus`
- `ResolutionType`

## `src/lib/bank-reconciliation-ui-engine.ts` (173 سطر)
### الفئات:
- `BankReconciliationEngine`
### الأنواع (Types):
- `MatchResult`

## `src/lib/bank-reconciliation.ts` (96 سطر)
### الفئات:
- `BankReconciliationEngine`

## `src/lib/bank-statement-engine.ts` (227 سطر)
### الفئات:
- `BankStatementEngine`

## `src/lib/bank-statement-importer.ts` (209 سطر)
### الفئات:
- `BankStatementImporter`
### الواجهات (Interfaces):
- `BankTransaction`
- `ImportResult`

## `src/lib/bank-statement-parser.ts` (466 سطر)
### الدوال المُصدّرة:
- `detectFormat(content: string)`
- `parseBankStatement(
  content: string,
  format?: StatementFormat,
  csvColumnMap?: CSVColumnMap)`
### الفئات:
- `MT940Parser`
- `CAMT053Parser`
- `CSVBankParser`
### الواجهات (Interfaces):
- `ParsedBankTransaction`
- `ParseResult`
- `CSVColumnMap`
### الأنواع (Types):
- `StatementFormat`

## `src/lib/barcode-engine.ts` (193 سطر)
### الفئات:
- `BarcodeEngine`

## `src/lib/bi-cube-engine.ts` (162 سطر)
### الفئات:
- `BICubeEngine`
### الأنواع (Types):
- `CubeDimension`
- `CubeMeasure`
- `CubeCell`

## `src/lib/blanket-po-engine.ts` (19 سطر)
### الفئات:
- `BlanketPOEngine`

## `src/lib/bnpl.test.ts` (78 سطر)

## `src/lib/bnpl.ts` (235 سطر)
### الدوال المُصدّرة:
- `getBnplKeys()`
- `createTabbySession({ amount, orderId, phone, items, customerName }: any, keys: any)`
- `getTabbyPaymentStatus(paymentId: string, keys: any)`
- `createTamaraSession({ amount, orderId, phone, items, customerName }: any, keys: any)`
- `getTamaraOrderStatus(orderId: string, keys: any)`

## `src/lib/bom-engine.ts` (86 سطر)
### الفئات:
- `BOMEngine`

## `src/lib/bpm-engine.ts` (224 سطر)
### الفئات:
- `BPMEngine`

## `src/lib/bpmn-engine.ts` (23 سطر)
### الفئات:
- `BPMNEngine`

## `src/lib/budget-control.ts` (159 سطر)
### الفئات:
- `BudgetControlEngine`

## `src/lib/budget-engine.ts` (156 سطر)
### الفئات:
- `BudgetEngine`

## `src/lib/budget-variance-engine.ts` (119 سطر)
### الفئات:
- `BudgetVarianceEngine`
### الواجهات (Interfaces):
- `BudgetVarianceReport`

## `src/lib/cache.ts` (168 سطر)
### الثوابت المُصدّرة:
- `cache`

## `src/lib/calibration-engine.ts` (26 سطر)
### الفئات:
- `CalibrationEngine`

## `src/lib/capacity-planning-engine.ts` (141 سطر)
### الفئات:
- `CapacityPlanningEngine`
### الواجهات (Interfaces):
- `WorkCenterCapacity`
- `CapacityLoadResult`

## `src/lib/cash-app-engine.ts` (23 سطر)
### الفئات:
- `CashAppEngine`

## `src/lib/cash-application-engine.ts` (304 سطر)
### الفئات:
- `CashApplicationEngine`
### الواجهات (Interfaces):
- `OpenInvoice`
- `MatchResult`

## `src/lib/cash-application.ts` (196 سطر)
### الفئات:
- `CashApplicationEngine`

## `src/lib/cash-flow-forecast.ts` (209 سطر)
### الفئات:
- `CashFlowForecastEngine`
### الواجهات (Interfaces):
- `WeeklyForecast`
- `CashFlowForecast`

## `src/lib/cash-flow-forecasting.ts` (455 سطر)
### الفئات:
- `CashFlowForecastingEngine`

## `src/lib/cash-flow-indirect-engine.ts` (156 سطر)
### الفئات:
- `CashFlowIndirectEngine`
### الواجهات (Interfaces):
- `CashFlowStatement`

## `src/lib/cash-forecast-engine.ts` (157 سطر)
### الفئات:
- `CashForecastEngine`
### الأنواع (Types):
- `CashForecastPeriod`

## `src/lib/cashflow-direct-engine.ts` (30 سطر)
### الفئات:
- `CashflowDirectEngine`

## `src/lib/cashflow-engine.ts` (166 سطر)
### الفئات:
- `CashFlowEngine`

## `src/lib/cdn-manager.ts` (44 سطر)
### الثوابت المُصدّرة:
- `cdnManager`

## `src/lib/chains/base/chain.interface.ts` (36 سطر)
### الفئات:
- `ChainRunner`
### الواجهات (Interfaces):
- `Chain`

## `src/lib/chains/index.ts` (86 سطر)
### الواجهات (Interfaces):
- `ChainContext`

## `src/lib/chains/parallel/multi-report.chain.ts` (24 سطر)
### الثوابت المُصدّرة:
- `multiReportChain`

## `src/lib/chains/payment-run.chain.ts` (42 سطر)
### الثوابت المُصدّرة:
- `paymentRunChain`
### الفئات:
- `PaymentRunChain`

## `src/lib/chains/react/react-agent.ts` (56 سطر)
### الفئات:
- `ReActAgent`

## `src/lib/chains/reflexion/self-corrector.ts` (36 سطر)

## `src/lib/chains/router/intent-router.chain.ts` (25 سطر)
### الثوابت المُصدّرة:
- `intentRouterChain`

## `src/lib/chains/sequential/invoice-process.chain.ts` (36 سطر)
### الثوابت المُصدّرة:
- `invoiceProcessChain`

## `src/lib/chatter-engine.ts` (25 سطر)
### الفئات:
- `ChatterEngine`

## `src/lib/cheque-management-engine.ts` (168 سطر)
### الفئات:
- `ChequeManagementEngine`
### الواجهات (Interfaces):
- `ProcessChequeOpts`
### الأنواع (Types):
- `ChequeType`
- `ChequeStatus`

## `src/lib/close/index.ts` (68 سطر)
### الدوال المُصدّرة:
- `closeApi(prisma: PrismaClient)`
### الأنواع (Types):
- `CloseApi`

## `src/lib/cloud-storage.ts` (129 سطر)
### الدوال المُصدّرة:
- `uploadFile(
    buffer: Buffer,
    originalName: string,
    folder = 'general'
)`
- `deleteFile(key: string)`
- `getFileUrl(key: string)`

## `src/lib/collection-workflow-engine.ts` (197 سطر)
### الفئات:
- `CollectionWorkflowEngine`
### الواجهات (Interfaces):
- `PromiseToPay`
- `CollectionAction`
### الأنواع (Types):
- `CollectionStatus`

## `src/lib/commission-engine.ts` (42 سطر)
### الفئات:
- `CommissionEngine`

## `src/lib/commitments-register-engine.ts` (257 سطر)
### الفئات:
- `CommitmentsRegisterEngine`
### الواجهات (Interfaces):
- `CommitmentItem`
- `CommitmentsRegister`
### الأنواع (Types):
- `CommitmentType`
- `CommitmentStatus`

## `src/lib/comp-review-engine.ts` (32 سطر)
### الفئات:
- `CompReviewEngine`

## `src/lib/comparative-financial-report-engine.ts` (125 سطر)
### الفئات:
- `ComparativeFinancialReportEngine`
### الواجهات (Interfaces):
- `ComparativeLineItem`
- `ComparativeFinancialStatement`

## `src/lib/competency-engine.ts` (30 سطر)
### الفئات:
- `CompetencyEngine`

## `src/lib/compliance-kb-seed.ts` (114 سطر)
### الدوال المُصدّرة:
- `getComplianceSeeds()`
- `searchSeeds(query: string)`
### الثوابت المُصدّرة:
- `COMPLIANCE_KB_SEED`

## `src/lib/consolidation-elimination-approval.ts` (355 سطر)
### الفئات:
- `ConsolidationEliminationApprovalService`
### الواجهات (Interfaces):
- `ConsolidationEliminationRequest`
- `SubmitRequestInput`
- `ApproveByCfoInput`
- `ApproveByMasterAdminInput`
- `RejectRequestInput`
- `ValidateReadinessInput`

## `src/lib/consolidation-elimination-posting.ts` (454 سطر)
### الفئات:
- `ConsolidationEliminationPostingService`
### الواجهات (Interfaces):
- `PostingPreviewResult`

## `src/lib/consolidation-engine.ts` (366 سطر)
### الفئات:
- `ConsolidationEngine`
### الواجهات (Interfaces):
- `ConsolidationResult`

## `src/lib/context/business-context.ts` (50 سطر)
### الدوال المُصدّرة:
- `buildBusinessContext(req: NextRequest)`
### الواجهات (Interfaces):
- `BusinessContext`

## `src/lib/context/conversation-memory.ts` (65 سطر)
### الفئات:
- `ConversationMemory`
### الواجهات (Interfaces):
- `Message`

## `src/lib/context/mcp-bridge.ts` (34 سطر)
### الدوال المُصدّرة:
- `getCombinedTools()`
### الفئات:
- `MCPBridge`

## `src/lib/context/with-context.ts` (30 سطر)

## `src/lib/contract-asset-engine.ts` (39 سطر)
### الفئات:
- `ContractAssetEngine`

## `src/lib/contract-engine.ts` (83 سطر)
### الفئات:
- `ContractEngine`

## `src/lib/copa-engine.ts` (26 سطر)
### الفئات:
- `COPAEngine`

## `src/lib/costing.ts` (156 سطر)
### الدوال المُصدّرة:
- `averageCost(batches: CostBatch[])`
- `fifoCost(batches: CostBatch[], sellQuantity: number)`
- `lifoCost(batches: CostBatch[], sellQuantity: number)`
- `calculateCost(
  method: CostingMethod,
  batches: CostBatch[],
  sellQuantity: number
)`
### الواجهات (Interfaces):
- `CostBatch`
### الأنواع (Types):
- `CostingMethod`

## `src/lib/cpq-engine.ts` (174 سطر)
### الفئات:
- `CPQEngine`
### الأنواع (Types):
- `PricingRule`
- `QuoteLine`

## `src/lib/credit-check-engine.ts` (138 سطر)
### الفئات:
- `CreditCheckEngine`
### الأنواع (Types):
- `CreditCheckResult`

## `src/lib/credit-check.ts` (109 سطر)
### الدوال المُصدّرة:
- `checkCredit(
    tx: Omit<PrismaClient, "$connect" | "$disconnect" | "$on" | "$transaction")`
### الواجهات (Interfaces):
- `CreditCheckResult`

## `src/lib/credit-limit-engine.ts` (242 سطر)
### الفئات:
- `CreditLimitEngine`
### الواجهات (Interfaces):
- `CreditLimitCheckResult`
### الأنواع (Types):
- `CreditStatus`

## `src/lib/crm-engine.ts` (164 سطر)
### الفئات:
- `CRMEngine`

## `src/lib/cron-guard.ts` (75 سطر)
### الدوال المُصدّرة:
- `guardCron(req: NextRequest)`
### الثوابت المُصدّرة:
- `requireCronSecret`

## `src/lib/cross-dock-engine.ts` (16 سطر)
### الفئات:
- `CrossDockEngine`

## `src/lib/custom-fields-engine.ts` (114 سطر)
### الفئات:
- `CustomFieldsEngine`

## `src/lib/custom-report-engine.ts` (177 سطر)
### الفئات:
- `CustomReportEngine`
### الواجهات (Interfaces):
- `ReportConfig`

## `src/lib/customer-health-engine.ts` (37 سطر)
### الفئات:
- `CustomerHealthEngine`

## `src/lib/customer-portal-engine.ts` (69 سطر)
### الفئات:
- `CustomerPortalEngine`

## `src/lib/customer-statement-email.ts` (74 سطر)
### الفئات:
- `CustomerStatementEmailEngine`

## `src/lib/customer-statement-pdf.ts` (181 سطر)
### الفئات:
- `CustomerStatementPdfEngine`

## `src/lib/customer-statement-scheduler.ts` (141 سطر)
### الفئات:
- `CustomerStatementScheduler`

## `src/lib/customer-statement.ts` (137 سطر)
### الفئات:
- `CustomerStatementEngine`

## `src/lib/customer360-engine.ts` (48 سطر)
### الفئات:
- `Customer360Engine`

## `src/lib/customs/customs-bayan-engine.ts` (85 سطر)
### الفئات:
- `CustomsBayanEngine`
### الواجهات (Interfaces):
- `ImportItem`
- `CustomsCalculationResult`

## `src/lib/dashboard-builder-engine.ts` (141 سطر)
### الفئات:
- `DashboardBuilderEngine`
### الأنواع (Types):
- `WidgetType`
- `WidgetConfig`
- `DashboardDef`

## `src/lib/data/analytics-engine.ts` (16 سطر)
### الفئات:
- `AnalyticsEngine`

## `src/lib/data/anomaly-detection-engine.ts` (102 سطر)
### الفئات:
- `AnomalyDetectionEngine`
### الواجهات (Interfaces):
- `AnomalyAlert`

## `src/lib/data/bi-reporting-engine.ts` (14 سطر)
### الفئات:
- `BiReportingEngine`

## `src/lib/data/data-migration-engine.ts` (14 سطر)
### الفئات:
- `DataMigrationEngine`

## `src/lib/data/data-warehouse-engine.ts` (65 سطر)
### الفئات:
- `DataWarehouseEngine`

## `src/lib/data/forecasting-engine.ts` (14 سطر)
### الفئات:
- `ForecastingEngine`

## `src/lib/data-masking-engine.ts` (55 سطر)
### الفئات:
- `DataMaskingEngine`

## `src/lib/db/transaction.ts` (181 سطر)
### الواجهات (Interfaces):
- `TransactionRetryOptions`
### الأنواع (Types):
- `TxClient`
- `FinancialTxClient`
- `InventoryTxClient`

## `src/lib/db/__tests__/transaction.test.ts` (93 سطر)

## `src/lib/decimal-utils.ts` (62 سطر)
### الدوال المُصدّرة:
- `n(value: Prisma.Decimal | number | string | null | undefined)`
- `d(value: number | string | null | undefined)`
- `sumD(values: (Prisma.Decimal | number | null | undefined)`
- `roundN(value: number, decimals: number = 2)`

## `src/lib/deferral-engine.ts` (39 سطر)
### الفئات:
- `DeferralEngine`

## `src/lib/deferred-tax-engine.ts` (152 سطر)
### الفئات:
- `DeferredTaxEngine`
### الواجهات (Interfaces):
- `DeferredTaxItem`
- `DeferredTaxReport`

## `src/lib/delivery-note-engine.ts` (139 سطر)
### الفئات:
- `DeliveryNoteEngine`

## `src/lib/demand-sensing-engine.ts` (21 سطر)
### الفئات:
- `DemandSensingEngine`

## `src/lib/depreciation-engine.ts` (333 سطر)
### الفئات:
- `DepreciationEngine`
### الواجهات (Interfaces):
- `DepreciationScheduleLine`
- `AssetDepreciationResult`
- `MonthlyDepreciationRun`
### الأنواع (Types):
- `DepreciationMethod`

## `src/lib/design-tokens.ts` (97 سطر)
### الثوابت المُصدّرة:
- `tokens`
### الأنواع (Types):
- `TokenColors`
- `TokenSpacing`

## `src/lib/dms-engine.ts` (59 سطر)
### الفئات:
- `DMSEngine`

## `src/lib/document-embeddings.ts` (102 سطر)
### الدوال المُصدّرة:
- `ingestDocument(doc: DocumentSource)`
- `searchDocuments(
    query: string,
    tenantId: string,
    topK: number = 5
)`
- `batchIngest(documents: DocumentSource[])`

## `src/lib/document-expiry.ts` (405 سطر)
### الفئات:
- `DocumentExpiryEngine`
### الواجهات (Interfaces):
- `ExpiryAlert`
- `ExpiryDashboard`
- `ScanResult`
### الأنواع (Types):
- `DocumentType`
- `AlertSeverity`

## `src/lib/document-state-machine.test.ts` (118 سطر)

## `src/lib/document-state-machine.ts` (259 سطر)
### الدوال المُصدّرة:
- `canTransition(
    from: DocumentStatusValue | string,
    to: DocumentStatusValue | string,)`
- `nextStates(
    from: DocumentStatusValue | string,
    docType: DocumentTypeValue
)`
- `isTerminal(status: DocumentStatusValue | string)`
- `assertEditable(
    status: DocumentStatusValue | string,
    docType: DocumentTypeValue
)`
- `assertReversible(
    status: DocumentStatusValue | string,
    docType: DocumentTypeValue
)`
### الثوابت المُصدّرة:
- `DocumentStatus`
- `DocumentType`
- `TRANSITIONS_TABLE`
### الأنواع (Types):
- `DocumentStatusValue`
- `DocumentTypeValue`

## `src/lib/dropship-engine.ts` (20 سطر)
### الفئات:
- `DropShipEngine`

## `src/lib/dunning-engine-v2.ts` (247 سطر)
### الفئات:
- `DunningEngineV2`

## `src/lib/dunning-engine.ts` (147 سطر)
### الفئات:
- `DunningEngine`

## `src/lib/ecl-engine.ts` (212 سطر)
### الثوابت المُصدّرة:
- `DEFAULT_ECL_MATRIX`
### الفئات:
- `ECLEngine`
### الواجهات (Interfaces):
- `ECLBucket`
- `ECLInvoiceRow`
- `ECLReport`

## `src/lib/eco-engine.ts` (45 سطر)
### الفئات:
- `ECOEngine`

## `src/lib/ehs-engine.ts` (32 سطر)
### الفئات:
- `EHSEngine`

## `src/lib/email-template-engine.ts` (40 سطر)
### الفئات:
- `EmailTemplateEngine`

## `src/lib/email.ts` (213 سطر)
### الدوال المُصدّرة:
- `sendEmail(opts: EmailOptions)`
- `welcomeEmailTemplate(fullName: string, username: string, password: string, systemUrl: string)`
- `invoiceEmailTemplate(customerName: string, invoiceNo: number, total: number, pdfUrl?: string)`
- `passwordResetTemplate(fullName: string, newPassword: string)`
### الواجهات (Interfaces):
- `EmailOptions`

## `src/lib/employee-loan-engine.ts` (151 سطر)
### الفئات:
- `EmployeeLoanEngine`
### الواجهات (Interfaces):
- `LoanRequest`
### الأنواع (Types):
- `LoanStatus`

## `src/lib/employee-onboarding-engine.ts` (115 سطر)
### الفئات:
- `EmployeeOnboardingEngine`
### الواجهات (Interfaces):
- `OnboardingPlan`
### الأنواع (Types):
- `OnboardingTaskStatus`

## `src/lib/employee-performance-engine.ts` (166 سطر)
### الفئات:
- `EmployeePerformanceEngine`
### الواجهات (Interfaces):
- `PerformanceGoal`
### الأنواع (Types):
- `AppraisalStatus`

## `src/lib/encryption.ts` (89 سطر)
### الدوال المُصدّرة:
- `encrypt(plaintext: string)`
- `decrypt(ciphertext: string)`
- `isEncrypted(text: string)`
- `maskSensitive(text: string, showFirst: number = 4, showLast: number = 4)`

## `src/lib/env-validator.ts` (244 سطر)
### الدوال المُصدّرة:
- `validateEnvironment(opts: { throwOnCritical?: boolean } = {})`
- `getEnvSummary()`
### الفئات:
- `EnvValidationError`

## `src/lib/env.ts` (93 سطر)
### الدوال المُصدّرة:
- `getEnv()`
- `getAIProviderKey(provider: 'gemini' | 'openai' | 'anthropic')`
- `redactSecret(secret: string)`
### الأنواع (Types):
- `EnvConfig`

## `src/lib/eos-engine.ts` (231 سطر)
### الفئات:
- `EOSEngine`
### الواجهات (Interfaces):
- `EOSInput`
- `EOSCalculation`
### الأنواع (Types):
- `TerminationReason`

## `src/lib/equity-statement-engine.ts` (23 سطر)
### الفئات:
- `EquityStatementEngine`

## `src/lib/erp-tools.ts` (285 سطر)
### الدوال المُصدّرة:
- `getTool(name: string)`
- `executeTool(name: string, params: Record<string, unknown>)`
- `listTools()`
### الثوابت المُصدّرة:
- `erpTools`
### الواجهات (Interfaces):
- `ERPTool`

## `src/lib/esignature-engine.ts` (76 سطر)
### الفئات:
- `ESignatureEngine`

## `src/lib/ess-engine.ts` (59 سطر)
### الفئات:
- `ESSEngine`

## `src/lib/event-bus.ts` (130 سطر)
### الفئات:
- `EventBus`
### الأنواع (Types):
- `EventPayload`
- `EventHandler`

## `src/lib/excel-service.ts` (74 سطر)
### الفئات:
- `ExcelService`
### الواجهات (Interfaces):
- `ExcelColumn`
- `ExportOptions`

## `src/lib/expense-report-engine.ts` (56 سطر)
### الفئات:
- `ExpenseReportEngine`

## `src/lib/feature-flags.ts` (73 سطر)
### الدوال المُصدّرة:
- `fetchFeatureFlags()`
- `isEnabled(key: string, tenantId?: string, userId?: string)`

## `src/lib/few-shot-examples.ts` (89 سطر)
### الدوال المُصدّرة:
- `getFewShotExamples(promptKey: string)`
- `formatExamplesForPrompt(promptKey: string)`
- `listExampleKeys()`
### الواجهات (Interfaces):
- `FewShotExample`

## `src/lib/field-audit-engine.ts` (239 سطر)
### الدوال المُصدّرة:
- `logFieldChanges(
  prisma:    PrismaClient,
  tableName: string,
  recordId:  number | string)`
- `detectChanges(
  oldObj:        Record<string, any>,
  newObj:        Record<string, any>,
)`
- `installAuditMiddleware(prisma: PrismaClient)`
- `getAuditHistory(
  prisma:    PrismaClient,
  tableName: string,
  recordId:  number | string)`
- `getUserAuditTrail(
  prisma: PrismaClient,
  userId: number,
  limit:  number = 200,
)`
- `getRecentActivity(
  prisma:   PrismaClient,
  tenantId: string,
  limit:    number = 50,
)`
### الواجهات (Interfaces):
- `FieldChange`
- `AuditEntry`

## `src/lib/field-audit.test.ts` (112 سطر)

## `src/lib/field-audit.ts` (321 سطر)
### الدوال المُصدّرة:
- `newTxId()`
- `logFieldChanges(
    prisma: PrismaClient | any,
    entityType: string,
    entityId: number)`
- `logCreate(
    prisma: PrismaClient | any,
    entityType: string,
    entityId: number)`
- `logDelete(
    prisma: PrismaClient | any,
    entityType: string,
    entityId: number)`
- `withAuditedUpdate(
    prisma: PrismaClient | any,
    modelName: string,              // e.g. ')`
- `withAuditedDelete(
    prisma: PrismaClient | any,
    modelName: string,
    entityId: number,)`
- `auditContextFromRequest(
    request: Request,
    user?: { userId?: number; username?: string; role?:)`
### الثوابت المُصدّرة:
- `SENSITIVE_ENTITIES`
### الواجهات (Interfaces):
- `AuditContext`

## `src/lib/field-encryption-engine.ts` (44 سطر)
### الفئات:
- `FieldEncryptionEngine`

## `src/lib/field-permission.ts` (63 سطر)
### الدوال المُصدّرة:
- `applyFieldPermissions(role: string, entityName: string, data: any | any[])`

## `src/lib/financial-close-engine.ts` (45 سطر)
### الفئات:
- `FinancialCloseEngine`

## `src/lib/financial-consolidation-engine.ts` (696 سطر)
### الفئات:
- `FinancialConsolidationEngine`
### الواجهات (Interfaces):
- `EntityBalance`
- `EliminationAdjustment`
- `ConsolidatedRow`
- `IntercompanyMatch`
- `CompanyBranchValidation`
- `ProposedLine`
- `ProposedJournalEntry`
- `DryRunResult`
- `ConsolidationResult`

## `src/lib/financial-notes-engine.ts` (109 سطر)
### الفئات:
- `FinancialNotesEngine`
### الواجهات (Interfaces):
- `FinancialNote`

## `src/lib/financial-statements-engine.ts` (937 سطر)
### الدوال المُصدّرة:
- `generateDisclosureNotes(
  reportType: 'INCOME_STATEMENT' | 'BALANCE_SHEET' | 'CASH_FLOW' | 'TRIAL_BALA)`
### الفئات:
- `FinancialStatementsEngine`
### الواجهات (Interfaces):
- `FsLine`
- `BalanceSheetResult`
- `IncomeStatementResult`
- `CashFlowResult`
- `IndirectCFLine`
- `IndirectCashFlowResult`
- `DimensionalFilters`
- `DisclosureNoteSection`
- `DisclosureNotesResult`

## `src/lib/fixed-assets-engine.ts` (216 سطر)
### الفئات:
- `FixedAssetsEngine`

## `src/lib/fleet-advanced-engine.ts` (29 سطر)
### الفئات:
- `FleetAdvancedEngine`

## `src/lib/form-builder-engine.ts` (33 سطر)
### الفئات:
- `FormBuilderEngine`

## `src/lib/formatters.ts` (72 سطر)
### الدوال المُصدّرة:
- `formatDateAR(dateInput: string | Date)`
- `formatDateTimeAR(dateInput: string | Date)`
- `formatCurrencyAR(amount: number)`
- `formatNumberAR(num: number)`

## `src/lib/fs-notes-engine.ts` (51 سطر)
### الفئات:
- `FsNotesEngine`

## `src/lib/fx-revaluation-engine.ts` (1507 سطر)
### الفئات:
- `FXRevaluationEngine`
### الواجهات (Interfaces):
- `FXRevalLine`
- `FXRevalResult`

## `src/lib/fx-revaluation.ts` (216 سطر)
### الفئات:
- `FxRevaluationEngine`

## `src/lib/gaps/abc-costing-engine.ts` (240 سطر)
### الدوال المُصدّرة:
- `computeActivityRates(pools: ActivityPool[])`
- `allocateActivityCosts(
  consumption: ProductActivityConsumption[],
  rates: ActivityRate[]
)`
- `summarizeProductCosts(
  allocations: { productId: string; activityId: string; allocatedCost: number })`
- `computeTDABCCost(resource: Omit<TimeDrivenResource, 'costPerMinute'>)`
- `evaluateTimeEquation(
  eq: TimeEquation,
  variables: Record<string, number>
)`
- `allocateJointCost(
  totalJointCost: number,
  products: JointProduct[],
  method: JointAllocation)`
- `backflush(
  bom: BillOfMaterialsLine[],
  finishedQty: number,
  scrapPercent = 0
)`
- `computeMaterialVariances(input: {
  stdPrice: number;
  actualPrice: number;
  stdQty: number;
  actualQt)`
- `computeLaborVariances(input: {
  stdRate: number;
  actualRate: number;
  stdHours: number;
  actualHo)`
### الواجهات (Interfaces):
- `ActivityPool`
- `ActivityRate`
- `ProductActivityConsumption`
- `TimeDrivenResource`
- `TimeEquation`
- `JointProduct`
- `BillOfMaterialsLine`
- `BackflushResult`
- `CostVariance`
### الأنواع (Types):
- `JointAllocationMethod`

## `src/lib/gaps/anomaly-detection-engine.ts` (523 سطر)
### الدوال المُصدّرة:
- `runAnomalyDetection(opts: RunOptions)`
### الثوابت المُصدّرة:
- `DETECTORS`
### الواجهات (Interfaces):
- `AnomalyFinding`
- `RunOptions`
### الأنواع (Types):
- `DetectorName`

## `src/lib/gaps/anomaly-explanation.ts` (146 سطر)
### الدوال المُصدّرة:
- `explainAnomaly(finding: AnomalyFinding)`
- `explainAnomalyWithLLM(
  finding: AnomalyFinding,
  llm: { generate: (p: string)`
### الواجهات (Interfaces):
- `AnomalyExplanation`

## `src/lib/gaps/customer-portal-v2-engine.ts` (265 سطر)
### الدوال المُصدّرة:
- `getPortalDashboard(
  prisma: PrismaClient,
  ctx: PortalCustomerContext
)`
- `browsePortalCatalog(
  prisma: PrismaClient,
  query: PortalCatalogQuery
)`
- `placePortalOrder(
  prisma: PrismaClient,
  input: PortalOrderInput
)`
- `submitDispute(prisma: PrismaClient, input: DisputeInput)`
- `savePaymentMethod(
  prisma: PrismaClient,
  input: SavePaymentMethodInput
)`
### الواجهات (Interfaces):
- `PortalCustomerContext`
- `PortalDashboard`
- `PortalCatalogQuery`
- `PortalCatalogItem`
- `PortalOrderInput`
- `PortalOrderResult`
- `DisputeInput`
- `SavePaymentMethodInput`

## `src/lib/gaps/demand-forecast-v2-engine.ts` (238 سطر)
### الدوال المُصدّرة:
- `aggregateDaily(points: { date: Date; qty: number }[])`
- `forecastDemand(
  productId: string,
  warehouseId: string,
  history: SalesPoint[],
  config?:)`
- `computeReorderParameters(
  forecast: ForecastResult,
  leadTimeDays: number,
  serviceLevel: 0.9 | 0.95 )`
- `computeEOQ(annualDemand: number, orderCost: number, holdingCostPerUnit: number)`
- `newsvendorOptimalQty(
  forecast: ForecastResult,
  underageCost: number, // lost margin from stockou)`
### الواجهات (Interfaces):
- `SalesPoint`
- `ForecastConfig`
- `ForecastPoint`
- `ForecastResult`

## `src/lib/gaps/document-ai-extraction.ts` (183 سطر)
### الدوال المُصدّرة:
- `extractInvoice(llm: VisionLLM, fileUrl: string)`
- `extractReceipt(llm: VisionLLM, fileUrl: string)`
- `extractIqama(llm: VisionLLM, fileUrl: string)`
- `validateExtractedInvoiceAgainstZatca(
  extracted: ExtractedInvoice,
  lookup: (vatNumber: string)`
### الثوابت المُصدّرة:
- `InvoiceExtractionSchema`
- `ReceiptExtractionSchema`
- `IqamaExtractionSchema`
- `INVOICE_EXTRACTION_PROMPT`
- `IQAMA_EXTRACTION_PROMPT`
### الواجهات (Interfaces):
- `VisionLLM`
- `ZatcaVendorLookup`
### الأنواع (Types):
- `ExtractedInvoice`
- `ExtractedReceipt`
- `ExtractedIqama`

## `src/lib/gaps/esg-engine.ts` (223 سطر)
### الدوال المُصدّرة:
- `computeEmission(entry: EmissionEntry)`
- `summarizeEmissions(
  logs: EmissionLog[],
  options?: { revenue?: number; employeeCount?: number })`
- `computeDiversityKPIs(snap: DiversitySnapshot)`
- `progressTowardGoal(
  current: number,
  goal: SustainabilityGoal
)`
- `buildSGIReport(input: {
  organizationName: string;
  emissions: PeriodEmissionsSummary;
  base)`
### الثوابت المُصدّرة:
- `EMISSION_FACTORS`
### الواجهات (Interfaces):
- `EmissionFactor`
- `EmissionEntry`
- `EmissionLog`
- `PeriodEmissionsSummary`
- `DiversitySnapshot`
- `DiversityKPIs`
- `SustainabilityGoal`
- `SGIReport`
### الأنواع (Types):
- `EmissionScope`

## `src/lib/gaps/evm-engine.ts` (199 سطر)
### الدوال المُصدّرة:
- `computeEVM(input: EVMInputs)`
- `buildSCurve(input: EVMInputs, periodDays = 7)`
- `detectEVMIssues(snap: EVMSnapshot)`
### الواجهات (Interfaces):
- `ProjectBudgetLine`
- `ProjectMilestone`
- `ProjectActualCost`
- `EVMSnapshot`
- `EVMInputs`
- `SCurvePoint`
- `EVMIssue`

## `src/lib/gaps/index.ts` (21 سطر)

## `src/lib/gaps/olap-cube-engine.ts` (225 سطر)
### الدوال المُصدّرة:
- `buildCubeSQL(query: CubeQuery)`
- `getCubeMatviewsSQL()`
- `getCubeRefreshSQL()`
### الواجهات (Interfaces):
- `CubeDimension`
- `CubeMeasure`
- `CubeQuery`
- `CubeRow`
- `CubeResult`
### الأنواع (Types):
- `AggregationFn`

## `src/lib/gaps/restaurant-core-engine.ts` (137 سطر)
### الفئات:
- `RestaurantCoreEngine`

## `src/lib/gaps/vendor-portal-v2-engine.ts` (306 سطر)
### الدوال المُصدّرة:
- `acknowledgePO(prisma: PrismaClient, input: AckPOInput)`
- `submitASN(prisma: PrismaClient, input: SubmitASNInput)`
- `extractInvoiceFromFile(_fileS3Key: string)`
- `submitVendorInvoice(
  prisma: PrismaClient,
  input: SubmitVendorInvoiceInput
)`
- `getVendorScorecard(
  prisma: PrismaClient,
  ctx: VendorPortalContext,
  period: { from: Date; to:)`
- `recordOnboardingStep(
  prisma: PrismaClient,
  ctx: VendorPortalContext,
  step: OnboardingStepName,)`
### الثوابت المُصدّرة:
- `ONBOARDING_STEPS`
### الواجهات (Interfaces):
- `VendorPortalContext`
- `AckPOInput`
- `AckPOResult`
- `SubmitASNInput`
- `ASNResult`
- `SubmitVendorInvoiceInput`
- `VendorExtractedInvoice`
- `VendorScorecard`
### الأنواع (Types):
- `OnboardingStepName`

## `src/lib/gaps/__tests__/engines.test.ts` (364 سطر)

## `src/lib/getDefaults.ts` (73 سطر)
### الدوال المُصدّرة:
- `resolveStockAndBranch(
    requestedStockId?: number | string | null,
    fallbackBranchId?: number )`
- `getMainStockId()`
- `getMainBranchId()`

## `src/lib/global-search-engine.ts` (121 سطر)
### الفئات:
- `GlobalSearchEngine`
### الواجهات (Interfaces):
- `SearchResult`

## `src/lib/gosi/gosi-engine.ts` (136 سطر)
### الفئات:
- `GosiEngine`
### الواجهات (Interfaces):
- `GosiCalculationResult`

## `src/lib/gosi-engine.ts` (210 سطر)
### الفئات:
- `GOSIEngine`

## `src/lib/gosi-service.ts` (177 سطر)
### الفئات:
- `GOSIService`
### الواجهات (Interfaces):
- `GOSIRegistration`
- `EmployeeStatus`

## `src/lib/governance/override-context.ts` (26 سطر)
### الدوال المُصدّرة:
- `buildOverrideContextFromRequest(
  req: Request,
  context: { tenantId: string; actorId: string; actorRole: stri)`

## `src/lib/governance/period-lock.ts` (299 سطر)
### الدوال المُصدّرة:
- `assertPeriodWritable({
  tenantId,
  postingDate,
  operationType,
  module,
  actor,
  overrideConte)`
### الفئات:
- `PeriodLockViolation`
### الواجهات (Interfaces):
- `OverrideContext`
- `AssertPeriodWritableOptions`

## `src/lib/governance/tenant-guard.ts` (218 سطر)
### الدوال المُصدّرة:
- `normalizeTenantId(value?: string | number | null)`
- `assertTenant(tenantId?: string | number | null)`
- `isLegacyTenant(tenantSlug: string)`
- `isSystemTenant(tenantSlug: string)`
- `getRecordTenantId(tenantSlug: string, desktopMode = process.env.DESKTOP_MODE === 'true')`
- `getTenantMode(tenantSlug: string, desktopMode = process.env.DESKTOP_MODE === 'true')`
- `buildTenantContext(tenantSlug: string, source: string, extras: Partial<TenantContextInfo> = {})`
- `requireTenantId(request: NextRequest | Request | { headers?: unknown; tenantId?: string | null })`
- `validateTenantAccess(req: Request | NextRequest)`
- `getAllowedTenantValues(context: TenantContextInfo)`
- `requireTenantContext(req: NextRequest | Request | { headers?: unknown; tenantId?: string | null })`
- `assertTenantAccess(req: Request | NextRequest, requiredTenantId?: string)`
- `assertTenantContextMatch(input: TenantMatchInput)`
- `assertTenantScopedOperation(
  model: string,
  operation: string,
  args: unknown,
  tenantId?: string
)`
### الثوابت المُصدّرة:
- `TENANT_ISOLATION_ERROR`
### الواجهات (Interfaces):
- `TenantContextInfo`
- `TenantMatchInput`
### الأنواع (Types):
- `TenantMode`
- `TenantWhere`

## `src/lib/governance-engine.ts` (108 سطر)
### الفئات:
- `GovernanceEngine`

## `src/lib/gr-ir-clearing-engine.ts` (442 سطر)
### الفئات:
- `GRIRClearingEngine`
### الواجهات (Interfaces):
- `GRIRLine`
- `GRIRReport`
- `POGrinsDetail`
- `POGrn`
- `PODetail`
- `POSupplier`
- `POWithDetails`
- `InvoiceDetail`
- `InvoiceWithDetails`
### الأنواع (Types):
- `GRIRMatchStatus`

## `src/lib/hedge-accounting-engine.ts` (500 سطر)
### الفئات:
- `HedgeAccountingEngine`
### الواجهات (Interfaces):
- `HedgeRelationship`
- `EffectivenessTest`
- `HedgeJournalEntries`
### الأنواع (Types):
- `HedgeType`
- `HedgeStatus`
- `InstrumentType`

## `src/lib/help-desk-engine.ts` (29 سطر)
### الفئات:
- `HelpDeskEngine`

## `src/lib/hijri.ts` (98 سطر)
### الدوال المُصدّرة:
- `toHijri(date: Date = new Date()`
- `formatHijri(date: Date = new Date()`
- `formatDualDate(date: Date = new Date()`
- `formatHijriNumeric(date: Date = new Date()`

## `src/lib/hr/saudi-labor-law-engine.ts` (107 سطر)
### الفئات:
- `SaudiLaborLawEngine`
### الواجهات (Interfaces):
- `EosCalculationParams`
- `EosCalculationResult`

## `src/lib/hr-scope.ts` (61 سطر)
### الدوال المُصدّرة:
- `getHrScope(auth: JWTPayload, tenantId: string, isEmployeeTable: boolean = false)`

## `src/lib/i18n-helpers.ts` (52 سطر)
### الدوال المُصدّرة:
- `formatCurrency(amount: number, locale: string = 'ar-SA')`
- `formatDate(date: Date | string, locale: string = 'ar-SA')`
- `formatNumber(n: number, locale: string = 'ar-SA')`
- `plural(word: string, count: number, lang: string = 'ar')`

## `src/lib/ic-elimination-engine.ts` (264 سطر)
### الفئات:
- `ICEliminationEngine`
### الواجهات (Interfaces):
- `ICBalance`
- `ICReconciliationReport`
- `UnrealizedProfitItem`
### الأنواع (Types):
- `ICTransactionType`

## `src/lib/ic-netting-engine.ts` (11 سطر)
### الفئات:
- `ICNettingEngine`

## `src/lib/idempotency.ts` (92 سطر)
### الدوال المُصدّرة:
- `lockIdempotencyKey(tenantId: string, routeName: string, idempotencyKey: string, ttlSeconds = 86400)`
- `completeIdempotencyKey(tenantId: string, routeName: string, idempotencyKey: string, ttlSeconds = 86400)`
- `unlockIdempotencyKey(tenantId: string, routeName: string, idempotencyKey: string)`
- `withIdempotency(
    req: NextRequest | any,
    endpoint: string,
    handler: ()`

## `src/lib/ifrs-engines.ts` (209 سطر)
### الفئات:
- `RevenueRecognitionEngine`
- `AssetImpairmentEngine`

## `src/lib/ifrs16-lease-engine.ts` (223 سطر)
### الفئات:
- `IFRS16LeaseEngine`
### الواجهات (Interfaces):
- `LeaseInput`
- `LeaseScheduleRow`
- `IFRS16Lease`

## `src/lib/ifrs9-ecl.ts` (157 سطر)
### الفئات:
- `IFRS9Engine`

## `src/lib/impairment-engine.ts` (147 سطر)
### الفئات:
- `ImpairmentEngine`
### الواجهات (Interfaces):
- `ImpairmentItem`
- `ImpairmentReport`

## `src/lib/import-export-engine.ts` (254 سطر)
### الفئات:
- `ImportExportEngine`
### الأنواع (Types):
- `ColumnDetection`
- `MappingValidation`
- `ImportResult`

## `src/lib/instrumentation/metrics.ts` (225 سطر)
### الثوابت المُصدّرة:
- `httpRequestsTotal`
- `httpRequestDuration`
- `journalEntriesPosted`
- `webhookDeliveries`
- `llmTokensConsumed`
- `apiKeyRequests`
- `approvalRequests`
- `activeWebhookSubs`
- `idempotencyHits`
- `register`

## `src/lib/instrumentation/otel.ts` (14 سطر)
### الدوال المُصدّرة:
- `initOtel()`

## `src/lib/integrations/accounting-migration-engine.ts` (17 سطر)
### الفئات:
- `AccountingMigrationEngine`

## `src/lib/integrations/ai-ocr-engine.ts` (80 سطر)
### الفئات:
- `AiOcrEngine`
### الواجهات (Interfaces):
- `InvoiceData`
### الأنواع (Types):
- `OcrProvider`

## `src/lib/integrations/bank-integration-engine.ts` (17 سطر)
### الفئات:
- `BankIntegrationEngine`

## `src/lib/integrations/ecommerce-sync-engine.ts` (80 سطر)
### الفئات:
- `EcommerceSyncEngine`
### الأنواع (Types):
- `EcommercePlatform`

## `src/lib/integrations/government-portals-engine.ts` (17 سطر)
### الفئات:
- `GovernmentPortalsEngine`

## `src/lib/integrations/payment-gateway-engine.ts` (92 سطر)
### الفئات:
- `PaymentGatewayEngine`
### الواجهات (Interfaces):
- `ChargeRequest`
- `ChargeResult`

## `src/lib/integrations/productivity-engine.ts` (17 سطر)
### الفئات:
- `ProductivityEngine`

## `src/lib/integrations/shipping-engine.ts` (92 سطر)
### الفئات:
- `ShippingEngine`
### الواجهات (Interfaces):
- `ShipmentData`
- `ShipmentResult`
### الأنواع (Types):
- `ShippingProvider`

## `src/lib/intercompany-engine.ts` (41 سطر)
### الفئات:
- `IntercompanyEngine`

## `src/lib/inventory-analytics-engine.ts` (377 سطر)
### الفئات:
- `ABCXYZEngine`
- `SlowMovingEngine`
- `StockReservationEngine`
### الواجهات (Interfaces):
- `ABCXYZItem`
- `SlowMovingItem`
- `StockReservation`
### الأنواع (Types):
- `ABCClass`
- `XYZClass`

## `src/lib/inventory-bin-engine.ts` (14 سطر)
### الفئات:
- `InventoryBinEngine`

## `src/lib/inventory-engine.ts` (110 سطر)
### الفئات:
- `InventoryEngine`

## `src/lib/ipaas-engine.ts` (62 سطر)
### الفئات:
- `IPaaSEngine`

## `src/lib/kanban-engine.ts` (140 سطر)
### الفئات:
- `KanbanEngine`
### الأنواع (Types):
- `KanbanColumn`
- `KanbanCard`
- `KanbanConfig`

## `src/lib/kb-rag-engine.ts` (41 سطر)
### الفئات:
- `KBRAGEngine`

## `src/lib/landed-cost-engine.ts` (145 سطر)
### الفئات:
- `LandedCostEngine`
### الواجهات (Interfaces):
- `ReceiptItem`
- `AdditionalCost`
- `AllocatedCostLine`
### الأنواع (Types):
- `AllocationMethod`

## `src/lib/langchain-chains.ts` (64 سطر)
### الثوابت المُصدّرة:
- `chains`

## `src/lib/langchain-orchestrator.ts` (582 سطر)
### الدوال المُصدّرة:
- `createRegistryChain(promptKey: string, tenantId: string | null = null)`
- `invokeChain(promptKey: string, vars: Record<string, any>, tenantId: string | null = null)`

## `src/lib/lease-accounting-engine.ts` (232 سطر)
### الفئات:
- `LeaseAccountingEngine`

## `src/lib/leave-engine.ts` (674 سطر)
### الفئات:
- `LeaveEngine`
### الواجهات (Interfaces):
- `LeaveBalance`
- `AccrualResult`
- `LeaveRequestResult`
### الأنواع (Types):
- `LeaveType`
- `AccrualFrequency`

## `src/lib/llm-client.ts` (98 سطر)
### الدوال المُصدّرة:
- `callLLM(promptKey: string, vars: Record<string, any>, tenantId: string | null = null, en)`

## `src/lib/lms-engine.ts` (49 سطر)
### الفئات:
- `LMSEngine`

## `src/lib/localization-engine.ts` (54 سطر)
### الثوابت المُصدّرة:
- `LOCALES`
### الفئات:
- `LocalizationEngine`

## `src/lib/logger.ts` (74 سطر)
### الثوابت المُصدّرة:
- `logger`

## `src/lib/lot-engine.ts` (71 سطر)
### الفئات:
- `LotEngine`

## `src/lib/loyalty-points-engine.ts` (168 سطر)
### الفئات:
- `LoyaltyEngine`
### الواجهات (Interfaces):
- `PointsEarnRequest`
- `PointsRedeemRequest`
### الأنواع (Types):
- `LoyaltyTier`

## `src/lib/manufacturing-accounting.ts` (159 سطر)
### الفئات:
- `ManufacturingAccountingEngine`

## `src/lib/marketing-automation-engine.ts` (22 سطر)
### الفئات:
- `MarketingAutomationEngine`

## `src/lib/material-issuance.ts` (150 سطر)
### الفئات:
- `MaterialIssuanceEngine`

## `src/lib/mcp-bridge.ts` (94 سطر)
### الفئات:
- `MCPBridge`
### الواجهات (Interfaces):
- `MCPRequest`
- `MCPResponse`

## `src/lib/mes-engine.ts` (20 سطر)
### الفئات:
- `MESEngine`

## `src/lib/mes-oee-engine.ts` (125 سطر)
### الفئات:
- `MesOeeEngine`
### الواجهات (Interfaces):
- `MachineStatus`
- `OEEData`
- `MESReport`

## `src/lib/mfa-engine.ts` (303 سطر)
### الفئات:
- `MfaEngine`

## `src/lib/mobile-sync-engine.ts` (16 سطر)
### الفئات:
- `MobileSyncEngine`

## `src/lib/money.test.ts` (66 سطر)

## `src/lib/money.ts` (37 سطر)
### الدوال المُصدّرة:
- `validateMoney(
    value: unknown,
    fieldName: string = 'المبلغ',
    options: { allowNe)`
### الثوابت المُصدّرة:
- `round2`

## `src/lib/month-end-close-engine.ts` (410 سطر)
### الفئات:
- `MonthEndCloseEngine`
### الواجهات (Interfaces):
- `CloseTask`
- `MonthEndCloseRun`
### الأنواع (Types):
- `CloseTaskStatus`

## `src/lib/mps-engine.ts` (88 سطر)
### الفئات:
- `MPSEngine`

## `src/lib/mrp-engine.ts` (145 سطر)
### الدوال المُصدّرة:
- `runMRP(manufacturingOrderId: number)`

## `src/lib/mudad-api.ts` (218 سطر)
### الدوال المُصدّرة:
- `getMudadClient(prismaClient: any)`
### الفئات:
- `MudadAPI`
### الواجهات (Interfaces):
- `MudadConfig`
- `MudadPayrollFile`
- `MudadPaymentStatus`
- `MudadEmployerStatus`

## `src/lib/mudad-compliance.ts` (197 سطر)
### الدوال المُصدّرة:
- `checkMudadCompliance(
    prisma: any,
    tenantId: string
)`
- `updateMudadStatus(
    prisma: any,
    employeeId: number,
    status: string,
    tenantId: )`
- `bulkUpdateMudadStatus(
    prisma: any,
    updates: Array<{ employeeId: number; status: string }>,)`
- `getUnprotectedEmployees(
    prisma: any,
    tenantId: string
)`
- `validateForMudad(employee: any)`
- `generateMudadReport(
    prisma: any,
    month: string, // YYYY-MM
    tenantId: string
)`
### الأنواع (Types):
- `MudadComplianceStatus`

## `src/lib/mudad-sync-engine.ts` (19 سطر)
### الفئات:
- `MudadSyncEngine`

## `src/lib/multi-book-engine-v2.ts` (246 سطر)
### الفئات:
- `MultiBookEngineV2`
### الواجهات (Interfaces):
- `BookDiff`
- `BookReconciliationReport`
### الأنواع (Types):
- `GaapStandard`

## `src/lib/multi-book-engine.ts` (116 سطر)
### الفئات:
- `MultiBookEngine`

## `src/lib/multi-country-payroll-engine.ts` (60 سطر)
### الفئات:
- `MultiCountryPayrollEngine`
### الواجهات (Interfaces):
- `PayrollCalculation`

## `src/lib/multi-gaap-engine.ts` (54 سطر)
### الفئات:
- `MultiGAAPEngine`

## `src/lib/najiz/najiz-engine.ts` (58 سطر)
### الفئات:
- `NajizEngine`
### الواجهات (Interfaces):
- `ExecutionRequest`

## `src/lib/nlq-engine.ts` (115 سطر)
### الفئات:
- `NLQEngine`

## `src/lib/notes-to-fs-engine.ts` (405 سطر)
### الفئات:
- `NotesToFinancialStatements`
### الواجهات (Interfaces):
- `FinancialNote`

## `src/lib/notification-engine.ts` (33 سطر)
### الفئات:
- `NotificationEngine`

## `src/lib/notifications.ts` (278 سطر)
### الثوابت المُصدّرة:
- `notifications`

## `src/lib/nps-engine.ts` (29 سطر)
### الفئات:
- `NPSEngine`

## `src/lib/numbering-engine.ts` (205 سطر)
### الفئات:
- `NumberingEngine`

## `src/lib/numbering.ts` (163 سطر)
### الدوال المُصدّرة:
- `getNextNumber(
  tx: any, 
  code: string, 
  branchId?: number | null, 
  fiscalYear?: nu)`
- `peekNextNumber(
  tx: any,
  code: string,
  options?: { branchId?: number | null }
)`
- `resetSequence(
  tx: any,
  code: string,
  branchId?: number | null,
  fiscalYear?: numbe)`
### الثوابت المُصدّرة:
- `NUMBERING_DEFAULTS`

## `src/lib/observability/correlation.ts` (68 سطر)
### الدوال المُصدّرة:
- `getCorrelationId()`
- `generateTraceId()`
- `generateSpanId()`
- `getCorrelationHeaders()`
- `buildCorrelationMeta()`

## `src/lib/observability/diagnostics.ts` (381 سطر)
### الفئات:
- `OperationalDiagnostics`
### الواجهات (Interfaces):
- `OutboxHealthReport`
- `OverrideMonitoringReport`
- `PeriodLockHealthReport`
- `FinancialAuditGapReport`
- `OperationalDiagnosticsReport`

## `src/lib/observability/financial-trace.ts` (136 سطر)
### الدوال المُصدّرة:
- `traceOverrideUsed(
  context: FinancialTraceContext & { traceId?: string; reason?: string }
)`
- `tracePeriodLockRejection(
  context: FinancialTraceContext & {
    rejectionCode: 'LOCKED' | 'MASTER_OVER)`
### الواجهات (Interfaces):
- `FinancialTraceContext`
- `FinancialTraceResult`

## `src/lib/observability/logger.ts` (292 سطر)
### الثوابت المُصدّرة:
- `logger`
- `EnterpriseLogger`
### الواجهات (Interfaces):
- `StructuredLogPayload`

## `src/lib/observability/request-context.ts` (64 سطر)
### الدوال المُصدّرة:
- `getRequestContext()`
- `createChildContext(overrides: Partial<RequestContext>)`
### الثوابت المُصدّرة:
- `requestContextStore`
### الواجهات (Interfaces):
- `RequestContext`

## `src/lib/observability/tenant-telemetry.ts` (178 سطر)
### الدوال المُصدّرة:
- `recordTenantViolation(
  attemptedTenantId: string,
  resource: string,
  action: string,
  extra?: Re)`
- `logTenantProvisioning(
  tenantId: string,
  status: 'STARTED' | 'SUCCESS' | 'FAILED',
  durationMs?: )`
- `recordTenantOperation(
  tenantId: string,
  operationType: string,
  module: string,
  durationMs?: n)`
- `recordTenantOverride(
  tenantId: string,
  module: string,
  operationType: string,
  actorId: strin)`
- `getTenantRuntimeMetrics(tenantId: string)`
- `getAllTenantRuntimeMetrics()`
- `resetTenantMetrics(tenantId: string)`

## `src/lib/observability.ts` (127 سطر)
### الدوال المُصدّرة:
- `incrementCounter(name: string, labels: Record<string, string> = {}, delta: number = 1)`
- `setGauge(name: string, value: number, labels: Record<string, string> = {})`
- `recordHistogram(name: string, value: number, labels: Record<string, string> = {})`
- `getMetricsSummary()`
### الثوابت المُصدّرة:
- `apiMetrics`
- `llmMetrics`
- `dbMetrics`

## `src/lib/oee-engine.ts` (29 سطر)
### الفئات:
- `OEEEngine`

## `src/lib/offline-sync-engine.ts` (169 سطر)
### الفئات:
- `OfflineSyncEngine`
### الواجهات (Interfaces):
- `PendingAction`
- `SyncResult`
### الأنواع (Types):
- `SyncActionType`

## `src/lib/okr-engine.ts` (33 سطر)
### الفئات:
- `OKREngine`

## `src/lib/omnichannel-engine.ts` (30 سطر)
### الفئات:
- `OmnichannelEngine`

## `src/lib/open-items-engine.ts` (289 سطر)
### الفئات:
- `OpenItemsEngine`
### الواجهات (Interfaces):
- `AllocationInput`
- `ApplyPaymentInput`
- `AgingBucket`
- `AgingReport`
### الأنواع (Types):
- `PartyType`
- `DisputeResolution`

## `src/lib/open-items.ts` (305 سطر)
### الفئات:
- `OpenItemsEngine`

## `src/lib/openapi/generator.ts` (25 سطر)
### الدوال المُصدّرة:
- `generateOpenAPI()`
### الثوابت المُصدّرة:
- `registry`

## `src/lib/openapi.ts` (1295 سطر)
### الدوال المُصدّرة:
- `getOpenAPISpec()`

## `src/lib/orchestrator/index.ts` (18 سطر)
### الدوال المُصدّرة:
- `initLangSmith()`

## `src/lib/orchestrator/streaming.ts` (31 سطر)
### الدوال المُصدّرة:
- `streamChain(
  chainName: string,
  input: any,
  ctx: BusinessContext
)`

## `src/lib/orchestrator/tool-registry.ts` (59 سطر)
### الثوابت المُصدّرة:
- `toolRegistry`
### الفئات:
- `ToolRegistry`
### الواجهات (Interfaces):
- `ToolDefinition`

## `src/lib/orchestrator/tools/index.ts` (31 سطر)
### الدوال المُصدّرة:
- `registerAllTools()`

## `src/lib/overtime-approval-engine.ts` (15 سطر)
### الفئات:
- `OvertimeApprovalEngine`

## `src/lib/pagination.ts` (155 سطر)
### الدوال المُصدّرة:
- `parsePagination(req: NextRequest | URLSearchParams)`
- `buildPaginationMeta(page: number, limit: number, total: number)`
- `buildOrderBy(
  sortBy:        string | null,
  sortDir:       'asc' | 'desc',
  allowedFi)`
### الواجهات (Interfaces):
- `PaginationParams`
- `PaginationMeta`
- `PaginatedResponse`

## `src/lib/payment-gateway/moyasar.ts` (109 سطر)
### الفئات:
- `MoyasarEngine`

## `src/lib/payment-run-engine.ts` (325 سطر)
### الفئات:
- `PaymentRunEngine`

## `src/lib/payment-terms.ts` (58 سطر)
### الفئات:
- `PaymentTermsEngine`

## `src/lib/payroll-reconciliation-engine.ts` (124 سطر)
### الفئات:
- `PayrollReconciliationEngine`
### الواجهات (Interfaces):
- `PayrollVarianceReport`

## `src/lib/pdf-service.ts` (50 سطر)
### الفئات:
- `PDFService`

## `src/lib/pdpl/pdpl-engine.ts` (108 سطر)
### الفئات:
- `PdplEngine`
### الأنواع (Types):
- `ConsentPurpose`

## `src/lib/pdpl-engine.ts` (261 سطر)
### الدوال المُصدّرة:
- `createDSR(
    prisma: PrismaClient,
    data: {
        requestType: string; // ACCESS)`
- `fulfillAccess(
    prisma: PrismaClient,
    requestId: number,
    handledByUserId: number)`
- `eraseSubject(
    prisma: PrismaClient,
    requestId: number,
    handledByUserId: number)`
- `recordBreach(
    prisma: PrismaClient,
    data: {
        category: string;
        sev)`
- `getDSRQueue(
    prisma: PrismaClient
)`
- `getOverdueDSRs(
    prisma: PrismaClient
)`
- `checkConsent(
    prisma: PrismaClient,
    subjectType: string,
    subjectId: number,
 )`
- `recordConsent(
    prisma: PrismaClient,
    data: {
        subjectType: string;
        )`
- `getActiveBreaches(
    prisma: PrismaClient
)`

## `src/lib/period-close-engine.ts` (381 سطر)
### الدوال المُصدّرة:
- `initPeriodCloseTasks(
  prisma: PrismaClient,
  periodId: number,
  tenantId: string
)`
- `completeTask(
  prisma:    PrismaClient,
  periodId:  number,
  taskCode:  string,
  user)`
- `getPeriodCloseStatus(
  prisma:   PrismaClient,
  periodId: number,
  tenantId?: string
)`
- `executeSoftClose(
  prisma:   PrismaClient,
  periodId: number,
  userId:   string
)`
- `executeHardClose(
  prisma:   PrismaClient,
  periodId: number,
  userId:   string
)`
### الثوابت المُصدّرة:
- `SOCPA_CLOSE_STEPS`
### الأنواع (Types):
- `StepCode`

## `src/lib/period-close.ts` (284 سطر)
### الفئات:
- `PeriodCloseEngine`

## `src/lib/period-lock-engine.ts` (181 سطر)
### الفئات:
- `PeriodLockEngine`
### الواجهات (Interfaces):
- `PeriodLockResult`
### الأنواع (Types):
- `PeriodStatus`

## `src/lib/picking-fefo.ts` (69 سطر)
### الدوال المُصدّرة:
- `allocateFEFO(
    prisma: PrismaClient,
    productId: number,
    requiredQty: number,
 )`
### الواجهات (Interfaces):
- `FefoAllocationResult`

## `src/lib/pii-mask.ts` (97 سطر)
### الدوال المُصدّرة:
- `maskPII(text: string)`
- `detectPII(text: string)`
### الواجهات (Interfaces):
- `MaskResult`

## `src/lib/pivot-engine.ts` (63 سطر)
### الفئات:
- `PivotEngine`

## `src/lib/platform/auth-sso-engine.ts` (64 سطر)
### الفئات:
- `AuthSsoEngine`
### الواجهات (Interfaces):
- `RoleDefinition`
### الأنواع (Types):
- `PermissionAction`
- `PermissionScope`

## `src/lib/platform/desktop-electron-engine.ts` (16 سطر)
### الفئات:
- `DesktopElectronEngine`

## `src/lib/platform/mobile-pwa-engine.ts` (17 سطر)
### الفئات:
- `MobilePwaEngine`

## `src/lib/platform/notifications-engine.ts` (17 سطر)
### الفئات:
- `NotificationsEngine`

## `src/lib/platform/print-barcode-engine.ts` (14 سطر)
### الفئات:
- `PrintBarcodeEngine`

## `src/lib/platform/realtime-engine.ts` (16 سطر)
### الفئات:
- `RealtimeEngine`

## `src/lib/platform/reporting-engine.ts` (64 سطر)
### الفئات:
- `ReportingEngine`
### الواجهات (Interfaces):
- `ReportRequest`
### الأنواع (Types):
- `ReportFormat`

## `src/lib/platform/search-engine.ts` (14 سطر)
### الفئات:
- `SearchEngine`

## `src/lib/pos-session-engine.ts` (167 سطر)
### الفئات:
- `PosSessionEngine`

## `src/lib/pos-sync-engine.ts` (19 سطر)
### الفئات:
- `PosSyncEngine`

## `src/lib/preventive-maintenance.ts` (87 سطر)
### الفئات:
- `PreventiveMaintenanceEngine`

## `src/lib/pricing-rule-engine.ts` (13 سطر)
### الفئات:
- `PricingRuleEngine`

## `src/lib/print-template-engine.ts` (171 سطر)
### الفئات:
- `PrintTemplateEngine`
### الأنواع (Types):
- `TemplateField`

## `src/lib/prisma-audit.ts` (202 سطر)
### الدوال المُصدّرة:
- `applyAuditMiddleware(prisma: any)`

## `src/lib/prisma-soft-delete.ts` (121 سطر)
### الدوال المُصدّرة:
- `applySoftDeleteMiddleware(prisma: any)`
- `restoreRecord(
  prisma: any,
  model: string,
  where: Record<string, any>
)`
- `hardDelete(prisma: any, model: string, where: any)`

## `src/lib/prisma.ts` (319 سطر)
### الدوال المُصدّرة:
- `getDbUrl(tenant: string, isRead = false)`
- `getClient(tenant: string, options: { read?: boolean } = {})`
- `resolveTenantContext(req?: TenantRequest, options: ResolveTenantOptions = {})`
- `resolveTenant(req?: TenantRequest, options: ResolveTenantOptions = {})`
- `getPrisma(req?: Request | TenantRequest, options: { read?: boolean; requireTenant?: boolea)`
### الثوابت المُصدّرة:
- `tenantContext`
- `currentRequestStore`
- `getTenantPrisma`
### الواجهات (Interfaces):
- `ResolveTenantOptions`

## `src/lib/privacy-filter.ts` (37 سطر)
### الدوال المُصدّرة:
- `redactPII(text: string)`
- `maskEntityNames(entities: any[], nameField = 'name')`

## `src/lib/product/documentation-engine.ts` (14 سطر)
### الفئات:
- `DocumentationEngine`

## `src/lib/product/knowledge-base-engine.ts` (14 سطر)
### الفئات:
- `KnowledgeBaseEngine`

## `src/lib/product/marketing-engine.ts` (14 سطر)
### الفئات:
- `MarketingEngine`

## `src/lib/product/partner-program-engine.ts` (14 سطر)
### الفئات:
- `PartnerProgramEngine`

## `src/lib/product/pricing-billing-engine.ts` (100 سطر)
### الفئات:
- `PricingBillingEngine`
### الواجهات (Interfaces):
- `PlanDetails`
### الأنواع (Types):
- `PlanTier`

## `src/lib/product/support-engine.ts` (14 سطر)
### الفئات:
- `SupportEngine`

## `src/lib/product/tenant-onboarding-engine.ts` (82 سطر)
### الفئات:
- `TenantOnboardingEngine`
### الأنواع (Types):
- `OnboardingStep`

## `src/lib/product/training-engine.ts` (14 سطر)
### الفئات:
- `TrainingEngine`

## `src/lib/product-variant-engine.ts` (67 سطر)
### الفئات:
- `ProductVariantEngine`

## `src/lib/project-costing-engine.ts` (256 سطر)
### الفئات:
- `ProjectCostingEngine`
### الواجهات (Interfaces):
- `ProjectCostReport`
- `EVMReport`

## `src/lib/project-profitability-engine.ts` (141 سطر)
### الفئات:
- `ProjectProfitabilityEngine`
### الواجهات (Interfaces):
- `EarnedValueMetrics`
- `ProfitabilityReport`

## `src/lib/project-revenue-recognition-engine.ts` (136 سطر)
### الفئات:
- `ProjectRevenueRecognitionEngine`
### الواجهات (Interfaces):
- `RevenueRecognitionReport`

## `src/lib/promotions-engine.ts` (163 سطر)
### الفئات:
- `PromotionsEngine`
### الواجهات (Interfaces):
- `CartItem`
- `PromotionRule`
### الأنواع (Types):
- `PromoType`

## `src/lib/prompt-cache.ts` (199 سطر)
### الدوال المُصدّرة:
- `getCachedPrompt(
    tenantId: string,
    systemPrompt: string,
    staticContext?: string
)`
- `setCachedPrompt(
    tenantId: string,
    systemPrompt: string,
    staticContext?: string,)`
- `getCacheStats()`
- `pruneCache()`
- `clearCache()`

## `src/lib/prompt-registry.ts` (192 سطر)
### الثوابت المُصدّرة:
- `promptRegistry`

## `src/lib/prompts/ab-testing/traffic-splitter.ts` (53 سطر)
### الدوال المُصدّرة:
- `resolvePromptVersion(
    tenantId: string | null,
    promptKey: string,
    enableABTest: boolea)`

## `src/lib/prompts/eval/llm-judge.ts` (61 سطر)
### الدوال المُصدّرة:
- `evaluatePromptOutput(
    promptContext: string,
    userQuery: string,
    aiOutput: string
)`

## `src/lib/prompts/eval/ragas-runner.ts` (83 سطر)
### الدوال المُصدّرة:
- `runEvalSuite(promptKey: string)`

## `src/lib/prompts/library/audit/daily-audit.prompt.ts` (26 سطر)
### الثوابت المُصدّرة:
- `template`
- `model`
- `temperature`
- `maxTokens`

## `src/lib/prompts/library/cfo/daily-summary.prompt.ts` (33 سطر)
### الثوابت المُصدّرة:
- `template`
- `model`
- `temperature`
- `maxTokens`

## `src/lib/prompts/library/cfo/monthly-analysis.prompt.ts` (31 سطر)
### الثوابت المُصدّرة:
- `template`
- `model`
- `temperature`
- `maxTokens`

## `src/lib/prompts/library/copilot/general-assistant.prompt.ts` (18 سطر)
### الثوابت المُصدّرة:
- `systemPrompt`
- `template`
- `model`
- `temperature`
- `maxTokens`

## `src/lib/prompts/library/fraud/invoice-anomaly.prompt.ts` (29 سطر)
### الثوابت المُصدّرة:
- `template`
- `model`
- `temperature`
- `maxTokens`

## `src/lib/prompts/library/ocr/invoice-extract.prompt.ts` (24 سطر)
### الثوابت المُصدّرة:
- `template`
- `model`
- `temperature`
- `maxTokens`

## `src/lib/prompts/registry.ts` (80 سطر)
### الدوال المُصدّرة:
- `getPrompt(key: string, tenantId: string | null = null, enableABTest: boolean = false)`
- `renderPrompt(template: string, vars: Record<string, any>)`
- `logPromptUsage(data: {
    tenantId: string;
    promptKey: string;
    promptVersion: numbe)`

## `src/lib/prompts/router.ts` (73 سطر)
### الثوابت المُصدّرة:
- `promptRouter`
### الفئات:
- `PromptRouter`
### الواجهات (Interfaces):
- `PromptIntent`
- `ModuleCatalog`

## `src/lib/prompts/system/compose.ts` (32 سطر)
### الدوال المُصدّرة:
- `composeSystemPrompt(
  persona: PersonaType,
  variables: Record<string, string>
)`
### الأنواع (Types):
- `PersonaType`

## `src/lib/prompts/system/guardrails/content-filter.ts` (9 سطر)
### الثوابت المُصدّرة:
- `CONTENT_FILTER`

## `src/lib/prompts/system/guardrails/output-schemas.ts` (25 سطر)
### الثوابت المُصدّرة:
- `CFOAlertSchema`
- `CFOResponseSchema`

## `src/lib/prompts/system/guardrails/pii-redactor.ts` (19 سطر)
### الدوال المُصدّرة:
- `redactPII(text: string)`

## `src/lib/prompts/system/guardrails/refusal-patterns.ts` (9 سطر)
### الثوابت المُصدّرة:
- `REFUSAL_PATTERNS`

## `src/lib/prompts/system/guardrails/safety-rules.ts` (9 سطر)
### الثوابت المُصدّرة:
- `SAFETY_RULES`

## `src/lib/prompts/system/personas/auditor.persona.ts` (14 سطر)
### الثوابت المُصدّرة:
- `AUDITOR_PERSONA`

## `src/lib/prompts/system/personas/base.persona.ts` (24 سطر)
### الثوابت المُصدّرة:
- `BASE_PERSONA`

## `src/lib/prompts/system/personas/cfo.persona.ts` (25 سطر)
### الثوابت المُصدّرة:
- `CFO_PERSONA`

## `src/lib/prompts/system/personas/copilot.persona.ts` (14 سطر)
### الثوابت المُصدّرة:
- `COPILOT_PERSONA`

## `src/lib/prompts/system/personas/fraud-detector.persona.ts` (13 سطر)
### الثوابت المُصدّرة:
- `FRAUD_DETECTOR_PERSONA`

## `src/lib/prompts/system/personas/hr-assistant.persona.ts` (13 سطر)
### الثوابت المُصدّرة:
- `HR_ASSISTANT_PERSONA`

## `src/lib/prompts/system/personas/nlq.persona.ts` (14 سطر)
### الثوابت المُصدّرة:
- `NLQ_PERSONA`

## `src/lib/prompts/system/personas/ocr-extractor.persona.ts` (13 سطر)
### الثوابت المُصدّرة:
- `OCR_EXTRACTOR_PERSONA`

## `src/lib/prompts/system/personas/procurement.persona.ts` (13 سطر)
### الثوابت المُصدّرة:
- `PROCUREMENT_PERSONA`

## `src/lib/qiwa/qiwa-engine.ts` (118 سطر)
### الفئات:
- `QiwaEngine`
### الواجهات (Interfaces):
- `NitaqatStatus`
- `QiwaContract`
### الأنواع (Types):
- `NitaqatColor`

## `src/lib/qiwa-engine.ts` (258 سطر)
### الدوال المُصدّرة:
- `classifySizeBracket(totalEmployees: number)`
- `classifyNitaqat(
    saudiPct: number,
    activityCode: string,
    sizeBracket: string
)`
- `computeSaudizationPct(
    prisma: PrismaClient
)`
- `takeSaudizationSnapshot(
    prisma: PrismaClient,
    activityCode: string = 'DEFAULT',
    source: )`
- `projectImpact(
    currentTotal: number,
    currentSaudi: number,
    saudiHires: number,)`
- `syncWorkforce(
    prisma: PrismaClient,
    activityCode: string = 'DEFAULT'
)`
- `getLatestSnapshot(
    prisma: PrismaClient
)`
- `getSnapshotHistory(
    prisma: PrismaClient,
    limit: number = 12
)`
- `getEmployeeContracts(
    prisma: PrismaClient,
    employeeId: number
)`

## `src/lib/quality-inspection-engine.ts` (84 سطر)
### الفئات:
- `QualityInspectionEngine`
### الأنواع (Types):
- `InspectionParameter`

## `src/lib/quality-management.ts` (107 سطر)
### الفئات:
- `QualityManagementEngine`

## `src/lib/queue/index.ts` (237 سطر)
### الثوابت المُصدّرة:
- `redisConnection`
- `emailQueue`
- `pdfQueue`
- `syncQueue`
- `reportQueue`
- `aiAuditQueue`
- `systemReconciliationQueue`
- `outboxRelayQueue`
- `startWorkers`

## `src/lib/quotaGuard.test.ts` (101 سطر)

## `src/lib/quotaGuard.ts` (149 سطر)
### الدوال المُصدّرة:
- `checkQuota(tenant: string, resource: 'invoice' | 'product' | 'user')`
- `quotaErrorResponse(result: QuotaResult)`
### الواجهات (Interfaces):
- `QuotaResult`

## `src/lib/quote-engine.ts` (139 سطر)
### الفئات:
- `QuoteEngine`

## `src/lib/qz.ts` (133 سطر)
### الدوال المُصدّرة:
- `connectQZ()`
- `printReceiptHTML(printerName: string, htmlHtml: string)`
- `printRawESCPOS(printerConfig: QZPrinterConfig, escposData: string[])`
- `getLocalPrinters()`
### الواجهات (Interfaces):
- `QZPrinterConfig`

## `src/lib/rag/citations/tracker.ts` (50 سطر)
### الفئات:
- `CitationTracker`
### الواجهات (Interfaces):
- `Citation`

## `src/lib/rag/evaluation/ragas-runner.ts` (36 سطر)
### الفئات:
- `RAGASEvaluator`
### الواجهات (Interfaces):
- `GoldenTestCase`
- `EvaluationResult`

## `src/lib/rag/pipeline.ts` (187 سطر)
### الفئات:
- `RAGPipeline`
### الواجهات (Interfaces):
- `RAGRequest`
- `RetrievedChunk`
- `RAGResponse`

## `src/lib/rag/query-transformers/hyde.transformer.ts` (24 سطر)
### الفئات:
- `HyDETransformer`

## `src/lib/rag/query-transformers/multi-query.transformer.ts` (24 سطر)
### الفئات:
- `MultiQueryTransformer`

## `src/lib/rag/sources.ts` (22 سطر)
### الثوابت المُصدّرة:
- `KNOWLEDGE_SOURCES`

## `src/lib/rag-pipeline.ts` (342 سطر)
### الدوال المُصدّرة:
- `chunkText(text: string, chunkSize = 500, overlap = 50)`
### الثوابت المُصدّرة:
- `ragPipeline`
### الواجهات (Interfaces):
- `RagDocument`
- `RagCitation`
- `RagResponse`
- `RagQueryOptions`

## `src/lib/rate-limit.ts` (101 سطر)
### الدوال المُصدّرة:
- `rateLimit(
    req: Request,
    options: RateLimitOptions = {}
)`
- `rateLimitOrReject(
    req: Request,
    options?: RateLimitOptions
)`

## `src/lib/rate-limiter.ts` (96 سطر)
### الثوابت المُصدّرة:
- `rateLimiter`
- `RATE_LIMITS`

## `src/lib/realized-fx-engine.ts` (291 سطر)
### الفئات:
- `RealizedFXEngine`
### الواجهات (Interfaces):
- `RealizedFXEntry`
- `RealizedFXReport`

## `src/lib/rebate-engine.ts` (144 سطر)
### الفئات:
- `RebateEngine`
### الأنواع (Types):
- `RebateProgram`
- `RebateTier`

## `src/lib/recruitment-engine.ts` (81 سطر)
### الفئات:
- `RecruitmentEngine`

## `src/lib/recurring-billing-engine.ts` (219 سطر)
### الفئات:
- `RecurringBillingEngine`
### الواجهات (Interfaces):
- `RecurringBillingPeriod`
- `MidCycleTaxSplit`
### الأنواع (Types):
- `BillingFrequency`

## `src/lib/recurring-journal-runner.ts` (96 سطر)
### الفئات:
- `RecurringJournalRunner`

## `src/lib/reorder-engine.ts` (39 سطر)
### الفئات:
- `ReorderEngine`

## `src/lib/report-builder-engine.ts` (64 سطر)
### الفئات:
- `ReportBuilderEngine`
### الواجهات (Interfaces):
- `ReportColumn`
- `ReportDefinition`

## `src/lib/revenue-recognition-ifrs15.ts` (149 سطر)
### الدوال المُصدّرة:
- `allocateTransactionPrice(contract: RevenueContract)`
- `calculateRecognizedRevenue(
    obligation: PerformanceObligation,
    asOfDate: string
)`
- `generateRevenueSchedule(contract: RevenueContract)`
- `generateRevenueJournalEntries(schedule: ReturnType<typeof generateRevenueSchedule>)`
### الواجهات (Interfaces):
- `RevenueContract`
- `PerformanceObligation`

## `src/lib/revenue-recognition.ts` (98 سطر)
### الفئات:
- `RevenueRecognitionEngine`

## `src/lib/reverse-auction-engine.ts` (35 سطر)
### الفئات:
- `ReverseAuctionEngine`

## `src/lib/reverse-charge-vat.ts` (177 سطر)
### الدوال المُصدّرة:
- `isReverseCharge(invoice: PurchaseInvoiceForRC)`
- `calculateReverseCharge(invoice: PurchaseInvoiceForRC)`
- `buildVatReturnRCSection(invoices: PurchaseInvoiceForRC[])`
### الثوابت المُصدّرة:
- `VAT_RATE`
- `RC_ACCOUNTS`
### الواجهات (Interfaces):
- `PurchaseInvoiceForRC`
- `ReverseChargeResult`
- `VatReturnRCSection`
- `RCTransaction`

## `src/lib/rfq-vendor-comparison-engine.ts` (174 سطر)
### الفئات:
- `RfqVendorComparisonEngine`
### الواجهات (Interfaces):
- `VendorQuoteInput`
- `QuoteComparisonResult`
### الأنواع (Types):
- `AwardCriteria`

## `src/lib/rfx-auction-engine.ts` (127 سطر)
### الفئات:
- `RFxAuctionEngine`
### الواجهات (Interfaces):
- `Bid`
- `RFxAuction`
- `RFxAuctionReport`

## `src/lib/rma-engine.ts` (61 سطر)
### الفئات:
- `RMAEngine`

## `src/lib/rolling-budget-engine.ts` (316 سطر)
### الفئات:
- `RollingBudgetEngine`
### الواجهات (Interfaces):
- `DriverValue`
- `RollingForecastLine`
- `VarianceLine`
### الأنواع (Types):
- `Scenario`
- `DriverKey`

## `src/lib/saga-orchestrator.ts` (48 سطر)
### الفئات:
- `SagaOrchestrator`

## `src/lib/salary-advances-engine.ts` (140 سطر)
### الفئات:
- `SalaryAdvancesEngine`
### الواجهات (Interfaces):
- `AdvanceRequest`
### الأنواع (Types):
- `AdvanceStatus`

## `src/lib/salary-structure-engine.ts` (105 سطر)
### الفئات:
- `SalaryStructureEngine`
### الواجهات (Interfaces):
- `SalaryComponent`
- `EmployeeSalaryStructure`
### الأنواع (Types):
- `ComponentType`

## `src/lib/sales-forecast-engine.ts` (26 سطر)
### الفئات:
- `SalesForecastEngine`

## `src/lib/sales-forecast.ts` (152 سطر)
### الفئات:
- `SalesForecastEngine`
### الأنواع (Types):
- `ForecastPeriod`

## `src/lib/salla.ts` (119 سطر)
### الدوال المُصدّرة:
- `syncProductToSalla(product: any)`
- `syncStockToSalla(sku: string, newQuantity: number)`

## `src/lib/sama/sama-open-banking-engine.ts` (79 سطر)
### الفئات:
- `SamaOpenBankingEngine`
### الواجهات (Interfaces):
- `BankAccount`
- `BankTransaction`

## `src/lib/saudi-compliance/index.ts` (259 سطر)
### الدوال المُصدّرة:
- `saudiCompliance(prisma: PrismaClient, tenantId: string)`
### الواجهات (Interfaces):
- `GOSIResult`
- `NitaqatStatus`
### الأنواع (Types):
- `SaudiComplianceFacade`

## `src/lib/saudi-eos-engine.ts` (182 سطر)
### الفئات:
- `SaudiEOSEngine`
### الواجهات (Interfaces):
- `EOSResult`
### الأنواع (Types):
- `EOSReason`

## `src/lib/saudi-gov/mudad.ts` (88 سطر)
### الفئات:
- `MudadEngine`

## `src/lib/saudization-nitaqat-engine.ts` (141 سطر)
### الفئات:
- `SaudizationNitaqatEngine`
### الواجهات (Interfaces):
- `SaudizationReport`
### الأنواع (Types):
- `NitaqatBand`

## `src/lib/scheduled-action-engine.ts` (27 سطر)
### الفئات:
- `ScheduledActionEngine`

## `src/lib/security/financial-policy-engine.ts` (42 سطر)
### الفئات:
- `FinancialPolicyEngine`

## `src/lib/security/journal-validation-layer.ts` (26 سطر)
### الفئات:
- `JournalValidationLayer`

## `src/lib/security/tenant-guard.ts` (20 سطر)

## `src/lib/security-headers.ts` (153 سطر)
### الدوال المُصدّرة:
- `applySecurityHeaders(
  req:      NextRequest,
  response: NextResponse,
)`
- `addRateLimitHeaders(
  response:  NextResponse,
  limit:     number,
  remaining: number,
  rese)`
- `handlePreflight(req: NextRequest)`

## `src/lib/seed-socpa-coa.ts` (110 سطر)
### الدوال المُصدّرة:
- `seedSocpaCoA(
  tenantId: string,
  prisma: any,
)`

## `src/lib/segment-reporting-engine.ts` (28 سطر)
### الفئات:
- `SegmentReportingEngine`

## `src/lib/sentry.ts` (162 سطر)
### الدوال المُصدّرة:
- `captureError(
  error: unknown,
  context: SentryContext = {}
)`
- `captureMessage(
  message: string,
  level: 'info' | 'warning' | 'error' = 'info',
  context)`
- `setUserContext(userId: string | number, tenantId?: string)`
### الثوابت المُصدّرة:
- `Sentry`

## `src/lib/serial-batch-tracking-engine.ts` (170 سطر)
### الفئات:
- `SerialBatchTrackingEngine`
### الواجهات (Interfaces):
- `BatchAllocationRequest`
### الأنواع (Types):
- `ItemTrackingType`

## `src/lib/server-t.ts` (37 سطر)
### الدوال المُصدّرة:
- `getServerLang()`
- `_t(ar: string, _en: string)`

## `src/lib/service-sla.ts` (68 سطر)
### الفئات:
- `ServiceSLAEngine`

## `src/lib/services/accounting-journal.service.ts` (201 سطر)
### الفئات:
- `AccountingJournalService`
### الأنواع (Types):
- `CreateJournalEntryDTO`

## `src/lib/services/accounting.service.ts` (269 سطر)
### الفئات:
- `AccountingService`
### الواجهات (Interfaces):
- `JournalLineInput`
- `CreateJournalInput`

## `src/lib/services/hr/payroll.service.ts` (50 سطر)
### الفئات:
- `PayrollService`
### الواجهات (Interfaces):
- `PayrollRunPayload`
### الأنواع (Types):
- `FinancialTxClient`

## `src/lib/services/hr.service.ts` (145 سطر)
### الفئات:
- `HRService`

## `src/lib/services/index.ts` (12 سطر)

## `src/lib/services/inter-company.service.ts` (155 سطر)
### الثوابت المُصدّرة:
- `ICPayloadSchema`
### الفئات:
- `InterCompanyService`

## `src/lib/services/inventory-adjustment.service.ts` (88 سطر)
### الفئات:
- `InventoryAdjustmentService`

## `src/lib/services/inventory-allocation.service.ts` (57 سطر)
### الفئات:
- `InventoryAllocationService`
### الواجهات (Interfaces):
- `InventoryAllocationPayload`
### الأنواع (Types):
- `InventoryTxClient`

## `src/lib/services/inventory.service.ts` (97 سطر)
### الفئات:
- `InventoryService`
### الواجهات (Interfaces):
- `StockAdjustmentPayload`
- `StockMovementPayload`
### الأنواع (Types):
- `TxClient`

## `src/lib/services/manufacturing-aps.service.ts` (254 سطر)
### الفئات:
- `ManufacturingApsService`

## `src/lib/services/manufacturing.service.ts` (176 سطر)
### الفئات:
- `ManufacturingService`

## `src/lib/services/open-items.service.ts` (949 سطر)
### الفئات:
- `OpenItemsService`
### الواجهات (Interfaces):
- `AllocationRequest`

## `src/lib/services/outbox.service.ts` (97 سطر)
### الفئات:
- `OutboxService`
### الواجهات (Interfaces):
- `CreateOutboxEventInput`
- `OutboxDiagnostics`
### الأنواع (Types):
- `TxClient`

## `src/lib/services/payroll.service.ts` (22 سطر)
### الفئات:
- `PayrollService`

## `src/lib/services/pharmacy.service.ts` (79 سطر)
### الفئات:
- `PharmacyPayloadSanitizer`
- `PharmacyService`
### الواجهات (Interfaces):
- `SafePharmacyItemPayload`
- `SafePharmacyPayload`
### الأنواع (Types):
- `PharmacyEventType`

## `src/lib/services/pos-accountant.service.ts` (80 سطر)
### الثوابت المُصدّرة:
- `PosSyncPayloadSchema`
### الفئات:
- `PosAccountantService`

## `src/lib/services/sales.service.ts` (157 سطر)
### الفئات:
- `SalesService`

## `src/lib/services/subledger-accounting.ts` (339 سطر)
### الثوابت المُصدّرة:
- `ACCOUNTS_SLA`
### الفئات:
- `SubledgerAccountingService`
### الأنواع (Types):
- `SLAPurchaseInvoiceDTO`
- `SLASalesInvoiceDTO`

## `src/lib/services/transfer.service.ts` (59 سطر)
### الفئات:
- `TransferService`

## `src/lib/services/treasury-forecast.service.ts` (58 سطر)
### الثوابت المُصدّرة:
- `CashForecastPayloadSchema`
### الفئات:
- `TreasuryForecastService`

## `src/lib/services/treasury-posting.service.ts` (195 سطر)
### الفئات:
- `TreasuryPostingService`

## `src/lib/services/wms-waves.service.ts` (206 سطر)
### الفئات:
- `WmsWavesService`
### الأنواع (Types):
- `PickTaskPreview`

## `src/lib/shift-schedule-engine.ts` (15 سطر)
### الفئات:
- `ShiftScheduleEngine`

## `src/lib/shipping-engine.ts` (33 سطر)
### الفئات:
- `ShippingEngine`

## `src/lib/slotting-engine.ts` (23 سطر)
### الفئات:
- `SlottingEngine`

## `src/lib/sms.ts` (102 سطر)
### الدوال المُصدّرة:
- `sendSMS(phone: string, message: string)`

## `src/lib/sop-engine.ts` (31 سطر)
### الفئات:
- `SOPEngine`

## `src/lib/spc-engine.ts` (25 سطر)
### الفئات:
- `SPCEngine`

## `src/lib/spend-analysis-engine.ts` (156 سطر)
### الفئات:
- `SpendAnalysisEngine`
### الواجهات (Interfaces):
- `SpendCategoryReport`
- `MaverickSpendReport`

## `src/lib/spend-analytics-engine.ts` (23 سطر)
### الفئات:
- `SpendAnalyticsEngine`

## `src/lib/spend-analytics.ts` (79 سطر)
### الفئات:
- `SpendAnalyticsEngine`

## `src/lib/sre/chaos-engineering-engine.ts` (16 سطر)
### الفئات:
- `ChaosEngineeringEngine`

## `src/lib/sre/finops-engine.ts` (14 سطر)
### الفئات:
- `FinopsEngine`

## `src/lib/sre/incident-response-engine.ts` (57 سطر)
### الفئات:
- `IncidentResponseEngine`
### الواجهات (Interfaces):
- `IncidentAlert`
### الأنواع (Types):
- `IncidentSeverity`

## `src/lib/sre/performance-engine.ts` (46 سطر)
### الفئات:
- `PerformanceEngine`

## `src/lib/sre/sla-slo-engine.ts` (14 سطر)
### الفئات:
- `SlaSloEngine`

## `src/lib/sso-engine.ts` (34 سطر)
### الفئات:
- `SSOEngine`

## `src/lib/standard-cost-engine.ts` (182 سطر)
### الفئات:
- `StandardCostEngine`

## `src/lib/state-machine/__tests__/enforcer.test.ts` (240 سطر)

## `src/lib/state-machine-engine.ts` (116 سطر)
### الدوال المُصدّرة:
- `transition(
    prisma: PrismaClient,
    docType: string,
    currentState: string,
  )`
- `getAvailableActions(
    prisma: PrismaClient,
    docType: string,
    currentState: string
)`
- `seedDefaultTransitions(prisma: PrismaClient)`
### الواجهات (Interfaces):
- `TransitionResult`

## `src/lib/state-machine.ts` (238 سطر)
### الدوال المُصدّرة:
- `getStateMachineFor(entityType: string)`
### الثوابت المُصدّرة:
- `InvoiceMachine`
- `PurchaseOrderMachine`
- `LeaveRequestMachine`
- `JournalMachine`
### الفئات:
- `StateMachine`
### الواجهات (Interfaces):
- `TransitionContext`
### الأنواع (Types):
- `BaseState`

## `src/lib/statutory-reports-engine.ts` (207 سطر)
### الفئات:
- `StatutoryReportsEngine`

## `src/lib/stock-images/unsplash.ts` (41 سطر)
### الفئات:
- `UnsplashService`
### الواجهات (Interfaces):
- `StockImage`

## `src/lib/storage/r2.ts` (17 سطر)
### الثوابت المُصدّرة:
- `r2Client`
### الفئات:
- `R2Storage`

## `src/lib/storage/upload-pipeline.ts` (52 سطر)
### الفئات:
- `AssetUploadPipeline`
### الواجهات (Interfaces):
- `UploadedAsset`

## `src/lib/storage/watermark.ts` (20 سطر)
### الفئات:
- `WatermarkService`

## `src/lib/streaming.ts` (58 سطر)
### الدوال المُصدّرة:
- `createSSEStream(generator: AsyncGenerator<string>)`
- `createSSEResponse(stream: ReadableStream)`

## `src/lib/subcontracting-engine.ts` (143 سطر)
### الفئات:
- `SubcontractingEngine`

## `src/lib/subscription-engine.ts` (180 سطر)
### الفئات:
- `SubscriptionEngine`

## `src/lib/succession-engine.ts` (77 سطر)
### الفئات:
- `SuccessionEngine`
### الواجهات (Interfaces):
- `EmployeePerformance`
- `NineBoxReport`

## `src/lib/supplier-portal-engine.ts` (44 سطر)
### الفئات:
- `SupplierPortalEngine`

## `src/lib/system-audit.ts` (121 سطر)
### الدوال المُصدّرة:
- `runSystemReconciliation(prisma: any)`

## `src/lib/tax-regime-engine.ts` (14 سطر)
### الفئات:
- `TaxRegimeEngine`

## `src/lib/tax-validation.ts` (77 سطر)
### الدوال المُصدّرة:
- `validateTaxRate(
  taxRate: number,
  tenantId: string,
  prisma: any
)`

## `src/lib/telegram-bot.ts` (492 سطر)
### الدوال المُصدّرة:
- `getBotToken()`
- `getGeminiKey()`
- `sendMessage(chatId: number, text: string, parseMode = 'HTML')`
- `processPhoto(fileId: string, chatId: number)`
- `processMessage(text: string)`
- `processVoice(fileId: string, chatId: number)`

## `src/lib/telemetry.ts` (146 سطر)
### الثوابت المُصدّرة:
- `telemetry`

## `src/lib/tenant/tenant-guard.ts` (20 سطر)

## `src/lib/territory-engine.ts` (29 سطر)
### الفئات:
- `TerritoryEngine`

## `src/lib/three-way-match-engine.ts` (326 سطر)
### الفئات:
- `ThreeWayMatchEngine`
### الواجهات (Interfaces):
- `MatchVariance`
- `ThreeWayMatchResult`
- `ThreeWayMatchConfig`
### الأنواع (Types):
- `MatchStatus`

## `src/lib/three-way-match-tolerance-engine.ts` (193 سطر)
### الفئات:
- `ThreeWayMatchEngine`
### الواجهات (Interfaces):
- `ThreeWayMatchInput`
- `ThreeWayMatchResult`
### الأنواع (Types):
- `MatchStatus`

## `src/lib/three-way-match.ts` (139 سطر)
### الفئات:
- `ThreeWayMatchEngine`

## `src/lib/timesheet-engine.ts` (105 سطر)
### الفئات:
- `TimesheetEngine`

## `src/lib/tna-engine.ts` (38 سطر)
### الفئات:
- `TNAEngine`

## `src/lib/token-budget.ts` (118 سطر)
### الدوال المُصدّرة:
- `estimateTokens(text: string)`
- `checkTokenBudget(
    promptTokens: number,
    config: Partial<TokenBudgetConfig> = {}
)`
- `getMonthlyQuota(tier: string)`
- `checkMonthlyQuota(
    usedTokens: number,
    tier: string = 'free'
)`
- `chunkText(text: string, maxTokensPerChunk: number = 4000)`

## `src/lib/totp.ts` (84 سطر)
### الدوال المُصدّرة:
- `generateTOTPSecret()`
- `generateTOTP(secret: string, time?: number)`
- `verifyTOTP(secret: string, token: string)`
- `buildTOTPUri(secret: string, username: string, issuer = 'NamaInvest')`

## `src/lib/transfer-pricing-engine.ts` (117 سطر)
### الفئات:
- `TransferPricingEngine`
### الواجهات (Interfaces):
- `IntercompanyTransaction`
- `TransferPricingReport`

## `src/lib/translations.ts` (21 سطر)
### الدوال المُصدّرة:
- `translate(key: string, lang: Language)`
### الأنواع (Types):
- `Language`

## `src/lib/treasury-cash-position-engine.ts` (288 سطر)
### الفئات:
- `TreasuryCashPositionEngine`
### الواجهات (Interfaces):
- `BankBalance`
- `CashFlowForecast`
- `CashPosition`

## `src/lib/types.ts` (175 سطر)
### الواجهات (Interfaces):
- `AuthUser`
- `ProductBase`
- `InvoiceItem`
- `SaleInvoice`
- `Customer`
- `Employee`
- `Expense`
- `StockMovement`
- `Branch`
- `ApiResponse`
- `DateRangeFilter`
- `PriceQuoteItem`
- `PriceQuote`
- `BankTransaction`

## `src/lib/usePagePermission.test.ts` (69 سطر)

## `src/lib/usePagePermission.ts` (59 سطر)
### الدوال المُصدّرة:
- `usePagePermission(moduleKey: string)`

## `src/lib/utils/safe-data.ts` (59 سطر)
### الدوال المُصدّرة:
- `toNumber(value: unknown, fallback = 0)`
- `toStringValue(value: unknown, fallback = '')`
- `hasArray(value: unknown)`

## `src/lib/utils.ts` (10 سطر)
### الدوال المُصدّرة:
- `cn(...inputs: ClassValue[])`

## `src/lib/validations/financial-schemas.ts` (336 سطر)
### الثوابت المُصدّرة:
- `zId`
- `zIdStr`
- `zTenantId`
- `zAmount`
- `zAmountAny`
- `zDate`
- `zPeriod`
- `zYear`
- `zCurrency`
- `zEntryNum`
- `zNotes`
- `zUserId`
- `JournalLineSchema`
- `CreateJournalEntrySchema`
- `ApplyPaymentSchema`
- `DisputeSchema`
- `BankMatchSchema`
- `BankReconRuleSchema`
- `TreasuryCashPositionSchema`
- `LiquidityForecastSchema`
- `RunPayrollSchema`
- `PayrollProvisionSchema`
- `WpsGenerateSchema`
- `HrTimesheetSchema`
- `HrLeaveAccrualSchema`
- `HrEosSchema`
- `HrGosiSchema`
- `HrPerformanceSchema`
- `FiscalYearSchema`
- `ClosePeriodSchema`
- `YearEndInitiateSchema`
- `BudgetSchema`
- `BudgetControlSchema`
- `DunningRunSchema`
- `PromiseToPaySchema`
- `CreditNoteSchema`
- `ZatcaOnboardSchema`
- `ZatcaGenerateSchema`
- `ApCaptureSchema`
- `ApMatchSchema`
- `FxRevaluationSchema`
- `ConsolidationSchema`
- `RevenueRecognitionSchema`
- `AllocationSchema`
- `EclRunSchema`
- `PaymentRunProposeSchema`
- `MultiBookAdjustmentSchema`

## `src/lib/validations.test.ts` (170 سطر)

## `src/lib/validations.ts` (248 سطر)
### الثوابت المُصدّرة:
- `amountSchema`
- `treasuryCreateSchema`
- `expenseCreateSchema`
- `expenseUpdateSchema`
- `salesCreateSchema`
- `purchaseCreateSchema`
- `purchasePaymentSchema`
- `purchaseReturnCreateSchema`
- `salesReturnCreateSchema`
- `salaryCreateSchema`
- `journalCreateSchema`
- `customerCreateSchema`
- `productCreateSchema`
- `accountCreateSchema`
- `stockTransferSchema`
- `paginationSchema`

## `src/lib/variance-engine.ts` (86 سطر)
### الفئات:
- `VarianceEngine`

## `src/lib/vat-classifier.ts` (159 سطر)
### الدوال المُصدّرة:
- `seedVatCategories(prisma: PrismaClient)`
- `classifyLine(params: {
    productCategory?: string;
    customerCountry?: string;
    ven)`
- `computeVatPerCategory(
    prisma: PrismaClient,
    periodStart: string,
    periodEnd: string
)`
- `buildVatReturn(
    prisma: PrismaClient,
    periodStart: string,
    periodEnd: string
)`
- `getVatCategories(prisma: PrismaClient)`
### الثوابت المُصدّرة:
- `DEFAULT_VAT_CATEGORIES`

## `src/lib/vector/chunking/recursive-splitter.ts` (67 سطر)
### الفئات:
- `RecursiveCharacterSplitter`
### الواجهات (Interfaces):
- `Chunk`

## `src/lib/vector/embedding/cache.ts` (15 سطر)
### الفئات:
- `EmbeddingCache`

## `src/lib/vector/embedding/gemini.embedder.ts` (35 سطر)
### الفئات:
- `GeminiEmbedder`

## `src/lib/vector/ingestion/pipeline.ts` (58 سطر)
### الفئات:
- `IngestionPipeline`
### الواجهات (Interfaces):
- `KnowledgeSource`
- `IngestResult`

## `src/lib/vector/retrieval/hybrid-search.ts` (68 سطر)
### الفئات:
- `HybridSearcher`
### الواجهات (Interfaces):
- `SearchOptions`
- `SearchResult`

## `src/lib/vector/store/pgvector.adapter.ts` (102 سطر)
### الفئات:
- `PgvectorStore`

## `src/lib/vector/store/vector-store.interface.ts` (39 سطر)
### الواجهات (Interfaces):
- `VectorFilter`
- `VectorDocument`
- `SearchQuery`
- `SearchResult`
- `VectorStore`

## `src/lib/vector-store.ts` (219 سطر)
### الدوال المُصدّرة:
- `addDocumentToVectorMine(
    tenantId: string,
    title: string,
    content: string,
    metadata:)`
- `searchVectorMine(
    tenantId: string,
    query: string,
    topK = 5
)`
- `queryRAG(tenantId: string, userQuery: string)`
- `searchChunksPgVector(
    tenantId: string,
    query: string,
    topK = 10,
    similarityThres)`
- `ingestDocumentChunks(
    tenantId: string,
    documentId: string,
    text: string,
)`

## `src/lib/vendor-contract-engine.ts` (128 سطر)
### الفئات:
- `VendorContractEngine`
### الواجهات (Interfaces):
- `ContractItemPrice`
- `VendorContractInput`
### الأنواع (Types):
- `ContractStatus`

## `src/lib/vendor-onboarding-engine.ts` (131 سطر)
### الفئات:
- `VendorOnboardingEngine`
### الواجهات (Interfaces):
- `VendorComplianceDoc`
- `VendorScoring`
- `VendorOnboardingReport`

## `src/lib/vendor-portal-engine.ts` (26 سطر)
### الفئات:
- `VendorPortalEngine`

## `src/lib/vendor-scorecard.ts` (135 سطر)
### الفئات:
- `VendorScorecardEngine`
### الأنواع (Types):
- `VendorScore`

## `src/lib/vendor-scoring.ts` (48 سطر)
### الدوال المُصدّرة:
- `calculateVendorScore(supplierId: number, prisma: any)`

## `src/lib/vendor-statement.ts` (121 سطر)
### الفئات:
- `VendorStatementEngine`

## `src/lib/wbs-engine.ts` (127 سطر)
### الفئات:
- `WBSEngine`
### الأنواع (Types):
- `EVMMetrics`

## `src/lib/webhook-engine.ts` (42 سطر)
### الفئات:
- `WebhookEngine`

## `src/lib/webhook-guard.ts` (85 سطر)
### الفئات:
- `WebhookGuard`

## `src/lib/webhooks/manager.ts` (76 سطر)
### الفئات:
- `WebhookManager`

## `src/lib/webhooks/webhook-orchestrator.ts` (112 سطر)
### الفئات:
- `WebhookOrchestrator`
### الواجهات (Interfaces):
- `WebhookPayload`
### الأنواع (Types):
- `WebhookSource`

## `src/lib/webhooks.ts` (171 سطر)
### الثوابت المُصدّرة:
- `webhooks`
- `WEBHOOK_EVENTS`
### الواجهات (Interfaces):
- `WebhookSubscription`

## `src/lib/wht-engine.ts` (278 سطر)
### الفئات:
- `WHTEngine`

## `src/lib/wip-production-tracking-engine.ts` (142 سطر)
### الفئات:
- `WIPTrackingEngine`
### الواجهات (Interfaces):
- `MaterialIssueRequest`
- `FinishedGoodsReceiptRequest`
### الأنواع (Types):
- `ProductionStatus`

## `src/lib/wms-engine.ts` (80 سطر)
### الفئات:
- `WmsEngine`

## `src/lib/wms-wave-engine.ts` (15 سطر)
### الفئات:
- `WmsWaveEngine`

## `src/lib/workflow/approval/runtime.ts` (242 سطر)
### الفئات:
- `ApprovalRuntime`
### الواجهات (Interfaces):
- `SubmitApprovalInput`
- `ApprovalDecision`

## `src/lib/workflow/engine/state-machine.ts` (184 سطر)
### الفئات:
- `StateMachineEngine`
### الواجهات (Interfaces):
- `TransitionResult`
- `AutoAction`

## `src/lib/workflow/index.ts` (35 سطر)

## `src/lib/workflow/saga/coordinator.ts` (49 سطر)
### الفئات:
- `Saga`
### الواجهات (Interfaces):
- `SagaStep`

## `src/lib/workflow/saga/purchase-sagas.ts` (275 سطر)
### الدوال المُصدّرة:
- `buildPurchaseOrderSaga(prisma: PrismaClient)`
- `buildGRNSaga(prisma: PrismaClient)`
### الواجهات (Interfaces):
- `PurchaseOrderSagaCtx`
- `GRNSagaCtx`

## `src/lib/workflow/saga/sagas.ts` (422 سطر)
### الدوال المُصدّرة:
- `buildSalesInvoiceSaga(prisma: PrismaClient)`
- `buildPayrollRunSaga(prisma: PrismaClient)`
- `buildMonthCloseSaga(prisma: PrismaClient)`
### الواجهات (Interfaces):
- `SalesInvoiceSagaCtx`
- `PayrollRunSagaCtx`
- `MonthCloseSagaCtx`

## `src/lib/workflow-builder-engine.ts` (215 سطر)
### الفئات:
- `WorkflowBuilderEngine`
### الأنواع (Types):
- `WorkflowState`
- `TransitionCondition`
- `TransitionAction`
- `WorkflowTransition`
- `WorkflowDef`

## `src/lib/wps/mudad-integration-engine.ts` (78 سطر)
### الفئات:
- `MudadIntegrationEngine`
### الواجهات (Interfaces):
- `MudadSubmissionResult`

## `src/lib/wps/wps-sif-generator.ts` (121 سطر)
### الفئات:
- `WpsSifGenerator`
### الواجهات (Interfaces):
- `WpsEmployeeRow`
### الأنواع (Types):
- `BankFormat`

## `src/lib/wps-generator.ts` (454 سطر)
### الفئات:
- `WPSGenerator`
### الواجهات (Interfaces):
- `WPSValidationResult`
- `WPSValidationError`
- `MudadSubmissionResult`

## `src/lib/year-end-close.ts` (315 سطر)
### الفئات:
- `YearEndCloseEngine`
### الواجهات (Interfaces):
- `YearEndValidation`
- `ChecklistTask`
- `ClosingJEPreview`

## `src/lib/year-end-engine.ts` (242 سطر)
### الفئات:
- `YearEndCloseEngine`

## `src/lib/year-end-processing-engine.ts` (93 سطر)
### الفئات:
- `YearEndProcessingEngine`

## `src/lib/zakat/zakat-tax-engine.ts` (96 سطر)
### الفئات:
- `ZakatTaxEngine`
### الواجهات (Interfaces):
- `ZakatBaseParams`
- `WhtCalculationParams`

## `src/lib/zakat-engine.ts` (316 سطر)
### الفئات:
- `ZakatEngine`
### الأنواع (Types):
- `ZakatBaseBreakdown`

## `src/lib/zatca/zatca-counter-service.ts` (84 سطر)
### الفئات:
- `ZatcaCounterService`

## `src/lib/zatca/zatca-onboarding-engine.ts` (109 سطر)
### الفئات:
- `ZatcaOnboardingEngine`
### الواجهات (Interfaces):
- `CsrData`

## `src/lib/zatca/zatca-qr-engine.ts` (83 سطر)
### الفئات:
- `ZatcaQrEngine`
### الواجهات (Interfaces):
- `ZatcaQrData`

## `src/lib/zatca-counter-service.ts` (61 سطر)
### الفئات:
- `ZATCACounterService`

## `src/lib/zatca-fatoora.ts` (344 سطر)
### الدوال المُصدّرة:
- `generateCSR(params: {
    commonName: string;      // e.g. EGS unit name
    organizationN)`
- `getComplianceCSID(params: {
    csrBase64: string;
    otp: string;
    environment?: ZatcaEnvi)`
- `submitComplianceInvoice(params: {
    binarySecurityToken: string;
    secret: string;
    invoiceHas)`
- `getProductionCSID(params: {
    complianceRequestId: string;
    binarySecurityToken: string;
 )`
- `reportInvoice(params: {
    binarySecurityToken: string;
    secret: string;
    invoiceHas)`
- `clearInvoice(params: {
    binarySecurityToken: string;
    secret: string;
    invoiceHas)`
- `getInitialPIH()`
- `hashInvoiceXml(xmlString: string)`
### الواجهات (Interfaces):
- `ZatcaCSIDResponse`
- `ZatcaInvoiceResponse`
### الأنواع (Types):
- `ZatcaEnvironment`

## `src/lib/zatca-java.ts` (219 سطر)
### الفئات:
- `ZatcaJavaAdapter`

## `src/lib/zatca-qr-validator.ts` (91 سطر)
### الفئات:
- `ZATCAQrValidator`
### الواجهات (Interfaces):
- `ZATCAQrData`

## `src/lib/zatca-signer.ts` (265 سطر)
### الفئات:
- `ZatcaSigner`
### الواجهات (Interfaces):
- `ZatcaSettings`
- `InvoiceLine`
- `InvoiceData`
- `SignResult`

## `src/lib/zatca-vault.ts` (74 سطر)
### الفئات:
- `ZatcaVault`

## `src/lib/zatca.test.ts` (57 سطر)

## `src/lib/zatca.ts` (599 سطر)
### الدوال المُصدّرة:
- `generateZatcaQRContent(data: {
  sellerName: string;
  vatNumber: string;
  timestamp: string;
  to)`
- `decodeZatcaQR(base64Content: string)`
- `generateZATCAXml(data: InvoiceData)`
- `generateXmlHash(xmlString: string)`
- `generateECDSASignature(data: string, privateKeyBase64: string)`
- `extractPublicKeyFromCertificate(certBase64: string)`
- `generatePhase2QRContent(qrData: QrDataModel)`
- `initializeZatca(config: ZatcaConfig)`
- `generateZatcaQR(params: {
  invoiceLines: InvoiceLine[];
  invoiceRelationType?: InvoiceRelati)`
- `getQrCodeContent(qrData: QrDataModel)`
- `generateZatcaKeyPair()`
### الواجهات (Interfaces):
- `Address`
- `Supplier`
- `Customer`
- `InvoiceLine`
- `InvoiceData`
- `QrDataModel`
- `ZatcaConfig`
### الأنواع (Types):
- `InvoiceRelationType`

## `src/lib/__tests__/ai-stack.test.ts` (85 سطر)

## `src/lib/__tests__/auto-cash-application.test.ts` (83 سطر)

## `src/lib/__tests__/auto-journal.test.ts` (36 سطر)

## `src/lib/__tests__/bank-statement-importer.test.ts` (193 سطر)

## `src/lib/__tests__/commission.test.ts` (87 سطر)

## `src/lib/__tests__/consolidation-elimination-approval.test.ts` (452 سطر)

## `src/lib/__tests__/consolidation-elimination-posting.test.ts` (293 سطر)

## `src/lib/__tests__/decimal-arithmetic.property.test.ts` (60 سطر)

## `src/lib/__tests__/dunning-engine-v2.test.ts` (143 سطر)

## `src/lib/__tests__/financial-consolidation-engine.test.ts` (500 سطر)

## `src/lib/__tests__/financial-schemas.test.ts` (223 سطر)

## `src/lib/__tests__/financial-statements-engine.test.ts` (254 سطر)

## `src/lib/__tests__/fixed-asset-depreciation.test.ts` (92 سطر)

## `src/lib/__tests__/gosi-rates.test.ts` (49 سطر)

## `src/lib/__tests__/idempotency.test.ts` (108 سطر)

## `src/lib/__tests__/observability-correlation.test.ts` (153 سطر)

## `src/lib/__tests__/observability-diagnostics.test.ts` (244 سطر)

## `src/lib/__tests__/open-items-engine.test.ts` (145 سطر)

## `src/lib/__tests__/outbox-diagnostics.test.ts` (78 سطر)

## `src/lib/__tests__/p1-services.test.ts` (124 سطر)

## `src/lib/__tests__/payroll-posting.test.ts` (91 سطر)

## `src/lib/__tests__/purchase-atomicity.test.ts` (134 سطر)

## `src/lib/__tests__/sales-atomicity.test.ts` (169 سطر)

## `src/lib/__tests__/tenant-isolation.test.ts` (97 سطر)

## `src/lib/__tests__/wht-service.test.ts` (77 سطر)

## `src/lib/__tests__/year-end-close.test.ts` (146 سطر)

## `src/lib/__tests__/zakat-calculator.test.ts` (65 سطر)

## `src/lib/__tests__/zatca-services.test.ts` (78 سطر)

## `src/lib/i18n.tsx` (119 سطر)
### الدوال المُصدّرة:
- `I18nProvider({ children }: { children: ReactNode })`
- `useTranslation()`
### الثوابت المُصدّرة:
- `languages`
### الواجهات (Interfaces):
- `LanguageInfo`

## `src/lib/i18n_from_server.tsx` (7 سطر)

## `src/lib/SettingsContext.tsx` (73 سطر)
### الدوال المُصدّرة:
- `SettingsProvider({ children }: { children: React.ReactNode })`
- `useSettings()`
### الواجهات (Interfaces):
- `Setting`

## `src/lib/theme.tsx` (142 سطر)
### الدوال المُصدّرة:
- `useTheme()`
- `ThemeProvider({ children }: { children: React.ReactNode })`
### الثوابت المُصدّرة:
- `DESIGN_TOKENS`

