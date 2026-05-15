# DATABASE MAP

## Global Rules
- **Tenant Isolation:** Most tables have `tenantId`.
- **Soft Deletes:** Often uses `status` flags rather than physical deletion.

## Discovered Models (612)
### User
- Tenant Isolated: No
- Contains Financial Fields: No

### UserBackupCode
- Tenant Isolated: Yes
- Contains Financial Fields: No

### MfaAttempt
- Tenant Isolated: Yes
- Contains Financial Fields: No

### TrustedDevice
- Tenant Isolated: Yes
- Contains Financial Fields: No

### MfaPolicy
- Tenant Isolated: Yes
- Contains Financial Fields: No

### MfaRecoveryRequest
- Tenant Isolated: Yes
- Contains Financial Fields: No

### MfaUsedToken
- Tenant Isolated: Yes
- Contains Financial Fields: No

### UserPermission
- Tenant Isolated: Yes
- Contains Financial Fields: No

### Category
- Tenant Isolated: Yes
- Contains Financial Fields: No

### Unit
- Tenant Isolated: Yes
- Contains Financial Fields: No

### Product
- Tenant Isolated: Yes
- Contains Financial Fields: No

### ProductUnit
- Tenant Isolated: Yes
- Contains Financial Fields: No

### Customer
- Tenant Isolated: Yes
- Contains Financial Fields: Yes

### Stock
- Tenant Isolated: Yes
- Contains Financial Fields: No

### ProductStock
- Tenant Isolated: Yes
- Contains Financial Fields: No

### SalesInvoice
- Tenant Isolated: Yes
- Contains Financial Fields: No

### SalesInvoiceDetail
- Tenant Isolated: Yes
- Contains Financial Fields: No

### SalesReturn
- Tenant Isolated: Yes
- Contains Financial Fields: No

### SalesReturnDetail
- Tenant Isolated: Yes
- Contains Financial Fields: No

### PurchaseOrder
- Tenant Isolated: Yes
- Contains Financial Fields: Yes

### PurchaseOrderDetail
- Tenant Isolated: Yes
- Contains Financial Fields: No

### PurchaseInvoice
- Tenant Isolated: Yes
- Contains Financial Fields: Yes

### PurchaseInvoiceDetail
- Tenant Isolated: Yes
- Contains Financial Fields: No

### PurchaseReturn
- Tenant Isolated: Yes
- Contains Financial Fields: No

### PurchaseReturnDetail
- Tenant Isolated: Yes
- Contains Financial Fields: No

### StockMovement
- Tenant Isolated: Yes
- Contains Financial Fields: No

### Expense
- Tenant Isolated: Yes
- Contains Financial Fields: Yes

### Treasury
- Tenant Isolated: Yes
- Contains Financial Fields: Yes

### Setting
- Tenant Isolated: Yes
- Contains Financial Fields: No

### AuditLog
- Tenant Isolated: Yes
- Contains Financial Fields: No

### Employee
- Tenant Isolated: Yes
- Contains Financial Fields: No

### Attendance
- Tenant Isolated: Yes
- Contains Financial Fields: No

### Salary
- Tenant Isolated: Yes
- Contains Financial Fields: No

### Vacation
- Tenant Isolated: Yes
- Contains Financial Fields: No

### PriceQuote
- Tenant Isolated: Yes
- Contains Financial Fields: No

### QuoteRevision
- Tenant Isolated: Yes
- Contains Financial Fields: No

### PriceQuoteDetail
- Tenant Isolated: Yes
- Contains Financial Fields: No

### StockTransfer
- Tenant Isolated: Yes
- Contains Financial Fields: No

### StockTransferDetail
- Tenant Isolated: Yes
- Contains Financial Fields: No

### Booking
- Tenant Isolated: Yes
- Contains Financial Fields: No

### Maintenance
- Tenant Isolated: Yes
- Contains Financial Fields: No

### Account
- Tenant Isolated: Yes
- Contains Financial Fields: No

### JournalEntry
- Tenant Isolated: Yes
- Contains Financial Fields: Yes

### JournalLine
- Tenant Isolated: Yes
- Contains Financial Fields: Yes

### ProfitCenter
- Tenant Isolated: Yes
- Contains Financial Fields: No

### Segment
- Tenant Isolated: Yes
- Contains Financial Fields: No

### CopaCharacteristic
- Tenant Isolated: Yes
- Contains Financial Fields: No

### CopaValueField
- Tenant Isolated: Yes
- Contains Financial Fields: No

### CopaDocument
- Tenant Isolated: Yes
- Contains Financial Fields: No

### CopaAllocationRule
- Tenant Isolated: Yes
- Contains Financial Fields: No

### NumberSequence
- Tenant Isolated: Yes
- Contains Financial Fields: No

### DocumentStateMachine
- Tenant Isolated: Yes
- Contains Financial Fields: No

### PeriodCloseTask
- Tenant Isolated: Yes
- Contains Financial Fields: No

### ApprovalWorkflow
- Tenant Isolated: Yes
- Contains Financial Fields: No

### ApprovalWorkflowStep
- Tenant Isolated: Yes
- Contains Financial Fields: No

### Quotation
- Tenant Isolated: Yes
- Contains Financial Fields: Yes

### QuotationItem
- Tenant Isolated: Yes
- Contains Financial Fields: No

### Installment
- Tenant Isolated: Yes
- Contains Financial Fields: Yes

### InstallmentPayment
- Tenant Isolated: Yes
- Contains Financial Fields: Yes

### LoyaltyPoint
- Tenant Isolated: Yes
- Contains Financial Fields: No

### LoyaltyTransaction
- Tenant Isolated: Yes
- Contains Financial Fields: No

### Promotion
- Tenant Isolated: Yes
- Contains Financial Fields: No

### Coupon
- Tenant Isolated: Yes
- Contains Financial Fields: No

### CouponUsage
- Tenant Isolated: Yes
- Contains Financial Fields: Yes

### GiftCard
- Tenant Isolated: Yes
- Contains Financial Fields: No

### Stocktake
- Tenant Isolated: Yes
- Contains Financial Fields: No

### StocktakeItem
- Tenant Isolated: Yes
- Contains Financial Fields: No

### Branch
- Tenant Isolated: Yes
- Contains Financial Fields: No

### Shift
- Tenant Isolated: Yes
- Contains Financial Fields: No

### Company
- Tenant Isolated: Yes
- Contains Financial Fields: No

### Subscription
- Tenant Isolated: Yes
- Contains Financial Fields: No

### SubscriptionPayment
- Tenant Isolated: Yes
- Contains Financial Fields: Yes

### Recipe
- Tenant Isolated: Yes
- Contains Financial Fields: No

### RecipeIngredient
- Tenant Isolated: Yes
- Contains Financial Fields: No

### ManufacturingOrder
- Tenant Isolated: Yes
- Contains Financial Fields: No

### Machine
- Tenant Isolated: Yes
- Contains Financial Fields: No

### ManufacturingWastage
- Tenant Isolated: Yes
- Contains Financial Fields: No

### WorkCenter
- Tenant Isolated: Yes
- Contains Financial Fields: No

### RecipeOperation
- Tenant Isolated: Yes
- Contains Financial Fields: No

### RecipeByProduct
- Tenant Isolated: Yes
- Contains Financial Fields: No

### ManufacturingCost
- Tenant Isolated: Yes
- Contains Financial Fields: Yes

### QualityCheck
- Tenant Isolated: Yes
- Contains Financial Fields: No

### MachineMaintenance
- Tenant Isolated: Yes
- Contains Financial Fields: No

### MachineTelemetry
- Tenant Isolated: Yes
- Contains Financial Fields: No

### TraceabilityLog
- Tenant Isolated: Yes
- Contains Financial Fields: No

### LetterOfCredit
- Tenant Isolated: Yes
- Contains Financial Fields: Yes

### BankAccount
- Tenant Isolated: Yes
- Contains Financial Fields: Yes

### BankTransaction
- Tenant Isolated: Yes
- Contains Financial Fields: Yes

### ProductBatch
- Tenant Isolated: Yes
- Contains Financial Fields: No

### CostCenter
- Tenant Isolated: Yes
- Contains Financial Fields: No

### EmployeeLoan
- Tenant Isolated: Yes
- Contains Financial Fields: Yes

### Currency
- Tenant Isolated: Yes
- Contains Financial Fields: Yes

### ExchangeRate
- Tenant Isolated: Yes
- Contains Financial Fields: No

### ApprovalRule
- Tenant Isolated: Yes
- Contains Financial Fields: Yes

### ApprovalRequest
- Tenant Isolated: Yes
- Contains Financial Fields: No

### ApprovalStep
- Tenant Isolated: Yes
- Contains Financial Fields: No

### DocumentArchive
- Tenant Isolated: Yes
- Contains Financial Fields: No

### LandedCost
- Tenant Isolated: Yes
- Contains Financial Fields: Yes

### CheckTransaction
- Tenant Isolated: Yes
- Contains Financial Fields: Yes

### BankReconciliation
- Tenant Isolated: Yes
- Contains Financial Fields: No

### PettyCashTransaction
- Tenant Isolated: Yes
- Contains Financial Fields: Yes

### Route
- Tenant Isolated: Yes
- Contains Financial Fields: No

### SalesTarget
- Tenant Isolated: Yes
- Contains Financial Fields: Yes

### SalesOrder
- Tenant Isolated: Yes
- Contains Financial Fields: No

### SalesOrderDetail
- Tenant Isolated: Yes
- Contains Financial Fields: No

### DeliveryNote
- Tenant Isolated: Yes
- Contains Financial Fields: No

### DeliveryNoteDetail
- Tenant Isolated: Yes
- Contains Financial Fields: No

### Project
- Tenant Isolated: Yes
- Contains Financial Fields: No

### ProjectBudgetLine
- Tenant Isolated: Yes
- Contains Financial Fields: No

### SupplierContract
- Tenant Isolated: Yes
- Contains Financial Fields: No

### ProjectTask
- Tenant Isolated: Yes
- Contains Financial Fields: No

### WarehouseZone
- Tenant Isolated: Yes
- Contains Financial Fields: No

### WarehouseRack
- Tenant Isolated: Yes
- Contains Financial Fields: No

### WarehouseBin
- Tenant Isolated: Yes
- Contains Financial Fields: No

### PromissoryNote
- Tenant Isolated: Yes
- Contains Financial Fields: Yes

### LetterOfGuarantee
- Tenant Isolated: Yes
- Contains Financial Fields: Yes

### Asset
- Tenant Isolated: Yes
- Contains Financial Fields: No

### Lead
- Tenant Isolated: Yes
- Contains Financial Fields: No

### Vehicle
- Tenant Isolated: Yes
- Contains Financial Fields: No

### 
- Tenant Isolated: No
- Contains Financial Fields: No

### Property
- Tenant Isolated: Yes
- Contains Financial Fields: No

### PropertyUnit
- Tenant Isolated: Yes
- Contains Financial Fields: No

### QualityInspection
- Tenant Isolated: Yes
- Contains Financial Fields: No

### PurchaseRequisition
- Tenant Isolated: Yes
- Contains Financial Fields: No

### PurchaseRequisitionDetail
- Tenant Isolated: Yes
- Contains Financial Fields: No

### RequestForQuotation
- Tenant Isolated: Yes
- Contains Financial Fields: No

### RequestForQuotationDetail
- Tenant Isolated: Yes
- Contains Financial Fields: No

### GoodsReceiptNote
- Tenant Isolated: Yes
- Contains Financial Fields: No

### GoodsReceiptNoteDetail
- Tenant Isolated: Yes
- Contains Financial Fields: No

### JobPosting
- Tenant Isolated: Yes
- Contains Financial Fields: No

### JobApplicant
- Tenant Isolated: Yes
- Contains Financial Fields: No

### EmployeeEvaluation
- Tenant Isolated: Yes
- Contains Financial Fields: No

### TrainingCourse
- Tenant Isolated: Yes
- Contains Financial Fields: No

### TrainingEnrollment
- Tenant Isolated: Yes
- Contains Financial Fields: No

### LeaseContract
- Tenant Isolated: Yes
- Contains Financial Fields: Yes

### RentInstallment
- Tenant Isolated: Yes
- Contains Financial Fields: Yes

### FleetTrip
- Tenant Isolated: Yes
- Contains Financial Fields: No

### FuelLog
- Tenant Isolated: Yes
- Contains Financial Fields: No

### Student
- Tenant Isolated: Yes
- Contains Financial Fields: No

### AcademicClass
- Tenant Isolated: Yes
- Contains Financial Fields: No

### ClassEnrollment
- Tenant Isolated: Yes
- Contains Financial Fields: No

### Budget
- Tenant Isolated: Yes
- Contains Financial Fields: Yes

### BudgetLine
- Tenant Isolated: Yes
- Contains Financial Fields: Yes

### Encumbrance
- Tenant Isolated: Yes
- Contains Financial Fields: Yes

### CommissionRule
- Tenant Isolated: Yes
- Contains Financial Fields: Yes

### SalesmanCommission
- Tenant Isolated: Yes
- Contains Financial Fields: Yes

### ProductSerialNumber
- Tenant Isolated: Yes
- Contains Financial Fields: No

### PettyCashFund
- Tenant Isolated: Yes
- Contains Financial Fields: No

### SystemAlert
- Tenant Isolated: Yes
- Contains Financial Fields: No

### TenantAccount
- Tenant Isolated: Yes
- Contains Financial Fields: No

### DesktopLicense
- Tenant Isolated: Yes
- Contains Financial Fields: No

### TenantFeatureFlag
- Tenant Isolated: Yes
- Contains Financial Fields: No

### RestaurantZone
- Tenant Isolated: Yes
- Contains Financial Fields: No

### RestaurantTable
- Tenant Isolated: Yes
- Contains Financial Fields: No

### RestaurantSession
- Tenant Isolated: Yes
- Contains Financial Fields: No

### DesktopCrashReport
- Tenant Isolated: Yes
- Contains Financial Fields: No

### WorkShift
- Tenant Isolated: Yes
- Contains Financial Fields: No

### VendorRating
- Tenant Isolated: Yes
- Contains Financial Fields: No

### FiscalPeriod
- Tenant Isolated: Yes
- Contains Financial Fields: No

### FiscalYear
- Tenant Isolated: Yes
- Contains Financial Fields: No

### YearEndCloseRun
- Tenant Isolated: Yes
- Contains Financial Fields: No

### YearEndCloseTask
- Tenant Isolated: Yes
- Contains Financial Fields: No

### OpeningBalance
- Tenant Isolated: Yes
- Contains Financial Fields: Yes

### ImmutableReport
- Tenant Isolated: Yes
- Contains Financial Fields: No

### FiscalYearReopenRequest
- Tenant Isolated: Yes
- Contains Financial Fields: No

### ServiceTicket
- Tenant Isolated: Yes
- Contains Financial Fields: No

### Shipment
- Tenant Isolated: Yes
- Contains Financial Fields: No

### PharmacyDrug
- Tenant Isolated: Yes
- Contains Financial Fields: No

### PharmacyPatient
- Tenant Isolated: Yes
- Contains Financial Fields: No

### Prescription
- Tenant Isolated: Yes
- Contains Financial Fields: No

### PrescriptionItem
- Tenant Isolated: Yes
- Contains Financial Fields: No

### InsuranceClaim
- Tenant Isolated: Yes
- Contains Financial Fields: Yes

### ControlledDrugLog
- Tenant Isolated: Yes
- Contains Financial Fields: No

### MedicationLog
- Tenant Isolated: Yes
- Contains Financial Fields: No

### ZATCARecord
- Tenant Isolated: Yes
- Contains Financial Fields: No

### RentInvoice
- Tenant Isolated: Yes
- Contains Financial Fields: No

### RentInvoiceDetail
- Tenant Isolated: Yes
- Contains Financial Fields: No

### SchoolInvoice
- Tenant Isolated: Yes
- Contains Financial Fields: No

### SchoolInvoiceDetail
- Tenant Isolated: Yes
- Contains Financial Fields: No

### PayrollInvoice
- Tenant Isolated: Yes
- Contains Financial Fields: No

### PayrollInvoiceDetail
- Tenant Isolated: Yes
- Contains Financial Fields: Yes

### FieldAuditLog
- Tenant Isolated: Yes
- Contains Financial Fields: No

### NumberingSequence
- Tenant Isolated: Yes
- Contains Financial Fields: No

### PeriodCloseTaskTemplate
- Tenant Isolated: Yes
- Contains Financial Fields: No

### PeriodCloseChecklist
- Tenant Isolated: Yes
- Contains Financial Fields: No

### PeriodLockLog
- Tenant Isolated: Yes
- Contains Financial Fields: No

### JournalTemplate
- Tenant Isolated: Yes
- Contains Financial Fields: No

### JournalTemplateLine
- Tenant Isolated: Yes
- Contains Financial Fields: No

### FxRevaluationRun
- Tenant Isolated: Yes
- Contains Financial Fields: No

### IntercompanyTransaction
- Tenant Isolated: Yes
- Contains Financial Fields: Yes

### ConsolidationGroup
- Tenant Isolated: Yes
- Contains Financial Fields: No

### ConsolidationRun
- Tenant Isolated: Yes
- Contains Financial Fields: No

### ConsolidationLine
- Tenant Isolated: Yes
- Contains Financial Fields: Yes

### AllocationRule
- Tenant Isolated: Yes
- Contains Financial Fields: No

### AllocationTarget
- Tenant Isolated: Yes
- Contains Financial Fields: No

### AllocationRun
- Tenant Isolated: Yes
- Contains Financial Fields: Yes

### PaymentTerm
- Tenant Isolated: Yes
- Contains Financial Fields: No

### PaymentTermInstallment
- Tenant Isolated: Yes
- Contains Financial Fields: No

### OpenItem
- Tenant Isolated: Yes
- Contains Financial Fields: Yes

### ItemApplication
- Tenant Isolated: Yes
- Contains Financial Fields: No

### DisputeCase
- Tenant Isolated: Yes
- Contains Financial Fields: Yes

### DisputeAttachment
- Tenant Isolated: Yes
- Contains Financial Fields: No

### DisputeCommunication
- Tenant Isolated: Yes
- Contains Financial Fields: No

### DeductionReason
- Tenant Isolated: Yes
- Contains Financial Fields: No

### WriteoffPolicy
- Tenant Isolated: Yes
- Contains Financial Fields: No

### CustomerCreditScore
- Tenant Isolated: Yes
- Contains Financial Fields: Yes

### CustomerCreditScoreHistory
- Tenant Isolated: Yes
- Contains Financial Fields: Yes

### BankStatement
- Tenant Isolated: Yes
- Contains Financial Fields: No

### BankStatementLine
- Tenant Isolated: Yes
- Contains Financial Fields: Yes

### IntraDayBalance
- Tenant Isolated: Yes
- Contains Financial Fields: No

### BankImportError
- Tenant Isolated: Yes
- Contains Financial Fields: No

### BankStatementReviewItem
- Tenant Isolated: Yes
- Contains Financial Fields: Yes

### BankReconRule
- Tenant Isolated: Yes
- Contains Financial Fields: No

### BankReconPeriod
- Tenant Isolated: Yes
- Contains Financial Fields: No

### BankReconciliationException
- Tenant Isolated: Yes
- Contains Financial Fields: No

### OutstandingCheck
- Tenant Isolated: Yes
- Contains Financial Fields: Yes

### DepositInTransit
- Tenant Isolated: Yes
- Contains Financial Fields: Yes

### BankReconMatch
- Tenant Isolated: Yes
- Contains Financial Fields: No

### CashFlowForecast
- Tenant Isolated: Yes
- Contains Financial Fields: No

### FixedAsset
- Tenant Isolated: Yes
- Contains Financial Fields: No

### 
- Tenant Isolated: No
- Contains Financial Fields: No

### FixedAssetCategory
- Tenant Isolated: Yes
- Contains Financial Fields: No

### AssetDepreciationLog
- Tenant Isolated: Yes
- Contains Financial Fields: No

### AssetImpairmentRecord
- Tenant Isolated: Yes
- Contains Financial Fields: No

### AssetTransferRecord
- Tenant Isolated: Yes
- Contains Financial Fields: No

### AssetMaintenanceRecord
- Tenant Isolated: Yes
- Contains Financial Fields: No

### AssetInsuranceClaim
- Tenant Isolated: Yes
- Contains Financial Fields: No

### CashGeneratingUnit
- Tenant Isolated: Yes
- Contains Financial Fields: No

### AssetUsageLog
- Tenant Isolated: Yes
- Contains Financial Fields: No

### AssetReclassification
- Tenant Isolated: Yes
- Contains Financial Fields: No

### AssetDocument
- Tenant Isolated: Yes
- Contains Financial Fields: No

### PhysicalCountSession
- Tenant Isolated: Yes
- Contains Financial Fields: No

### PhysicalCountScan
- Tenant Isolated: Yes
- Contains Financial Fields: No

### PhysicalCountVariance
- Tenant Isolated: Yes
- Contains Financial Fields: No

### ProductVariant
- Tenant Isolated: Yes
- Contains Financial Fields: No

### PickList
- Tenant Isolated: Yes
- Contains Financial Fields: No

### PickListLine
- Tenant Isolated: Yes
- Contains Financial Fields: No

### PutawayRule
- Tenant Isolated: Yes
- Contains Financial Fields: No

### ProductSubstitute
- Tenant Isolated: Yes
- Contains Financial Fields: No

### InventoryPlanning
- Tenant Isolated: Yes
- Contains Financial Fields: No

### StockReservation
- Tenant Isolated: Yes
- Contains Financial Fields: No

### RoleFieldPermission
- Tenant Isolated: Yes
- Contains Financial Fields: Yes

### SegregationOfDutiesRule
- Tenant Isolated: Yes
- Contains Financial Fields: No

### ApiKey
- Tenant Isolated: Yes
- Contains Financial Fields: No

### UserDelegation
- Tenant Isolated: Yes
- Contains Financial Fields: No

### EndOfServiceCalculation
- Tenant Isolated: Yes
- Contains Financial Fields: Yes

### PayrollRun
- Tenant Isolated: Yes
- Contains Financial Fields: Yes

### WPSBatch
- Tenant Isolated: Yes
- Contains Financial Fields: Yes

### WPSBatchItem
- Tenant Isolated: Yes
- Contains Financial Fields: No

### GOSIContribution
- Tenant Isolated: Yes
- Contains Financial Fields: Yes

### GOSIMonthlyFile
- Tenant Isolated: Yes
- Contains Financial Fields: Yes

### ThreeWayMatch
- Tenant Isolated: Yes
- Contains Financial Fields: Yes

### ThreeWayMatchLine
- Tenant Isolated: Yes
- Contains Financial Fields: No

### TolerancePolicy
- Tenant Isolated: Yes
- Contains Financial Fields: Yes

### CashApplicationBatch
- Tenant Isolated: Yes
- Contains Financial Fields: Yes

### CashApplication
- Tenant Isolated: Yes
- Contains Financial Fields: Yes

### BOMVersion
- Tenant Isolated: Yes
- Contains Financial Fields: No

### EngineeringChangeOrder
- Tenant Isolated: Yes
- Contains Financial Fields: No

### IfrsLeaseContract
- Tenant Isolated: Yes
- Contains Financial Fields: No

### IfrsLeaseSchedule
- Tenant Isolated: Yes
- Contains Financial Fields: No

### IfrsLeaseScheduleLine
- Tenant Isolated: Yes
- Contains Financial Fields: No

### IfrsLeaseModification
- Tenant Isolated: Yes
- Contains Financial Fields: No

### IfrsLeaseTermination
- Tenant Isolated: Yes
- Contains Financial Fields: No

### IfrsSublease
- Tenant Isolated: Yes
- Contains Financial Fields: No

### IfrsLeaseImpairment
- Tenant Isolated: Yes
- Contains Financial Fields: No

### IfrsVariableLeasePayment
- Tenant Isolated: Yes
- Contains Financial Fields: Yes

### SalesContract
- Tenant Isolated: Yes
- Contains Financial Fields: No

### PerformanceObligation
- Tenant Isolated: Yes
- Contains Financial Fields: No

### DeferredRevenueSchedule
- Tenant Isolated: Yes
- Contains Financial Fields: No

### RevenueRecognitionLine
- Tenant Isolated: Yes
- Contains Financial Fields: No

### RevenueMilestone
- Tenant Isolated: Yes
- Contains Financial Fields: Yes

### ContractModificationRecord
- Tenant Isolated: Yes
- Contains Financial Fields: No

### VariableConsiderationUpdate
- Tenant Isolated: Yes
- Contains Financial Fields: Yes

### StandaloneSellingPrice
- Tenant Isolated: Yes
- Contains Financial Fields: No

### AssetImpairment
- Tenant Isolated: Yes
- Contains Financial Fields: Yes

### AssetRevaluation
- Tenant Isolated: Yes
- Contains Financial Fields: Yes

### CustomReport
- Tenant Isolated: Yes
- Contains Financial Fields: No

### ReportSchedule
- Tenant Isolated: Yes
- Contains Financial Fields: No

### DunningLevel
- Tenant Isolated: Yes
- Contains Financial Fields: No

### DunningCampaign
- Tenant Isolated: Yes
- Contains Financial Fields: Yes

### DunningLetter
- Tenant Isolated: Yes
- Contains Financial Fields: No

### DunningCommunication
- Tenant Isolated: Yes
- Contains Financial Fields: No

### PromiseToPay
- Tenant Isolated: Yes
- Contains Financial Fields: No

### CollectionAgency
- Tenant Isolated: Yes
- Contains Financial Fields: No

### CollectionAssignment
- Tenant Isolated: Yes
- Contains Financial Fields: Yes

### CustomerCreditAction
- Tenant Isolated: Yes
- Contains Financial Fields: No

### BpmWorkflow
- Tenant Isolated: Yes
- Contains Financial Fields: No

### BpmInstance
- Tenant Isolated: Yes
- Contains Financial Fields: No

### BpmTask
- Tenant Isolated: Yes
- Contains Financial Fields: No

### PaymentRun
- Tenant Isolated: Yes
- Contains Financial Fields: No

### PaymentRunLine
- Tenant Isolated: Yes
- Contains Financial Fields: Yes

### PaymentRunBankFile
- Tenant Isolated: Yes
- Contains Financial Fields: No

### PaymentRunApproval
- Tenant Isolated: Yes
- Contains Financial Fields: No

### SupplierBankAccount
- Tenant Isolated: Yes
- Contains Financial Fields: No

### PaymentBlock
- Tenant Isolated: Yes
- Contains Financial Fields: No

### DiscountOpportunity
- Tenant Isolated: Yes
- Contains Financial Fields: No

### WHTRule
- Tenant Isolated: Yes
- Contains Financial Fields: No

### WHTTransaction
- Tenant Isolated: Yes
- Contains Financial Fields: Yes

### WhtForm14Batch
- Tenant Isolated: Yes
- Contains Financial Fields: No

### ECLModel
- Tenant Isolated: Yes
- Contains Financial Fields: No

### ECLAssessment
- Tenant Isolated: Yes
- Contains Financial Fields: Yes

### StandardCostVersion
- Tenant Isolated: Yes
- Contains Financial Fields: No

### VarianceTransaction
- Tenant Isolated: Yes
- Contains Financial Fields: Yes

### SubcontractingPO
- Tenant Isolated: Yes
- Contains Financial Fields: No

### SubcontractMovement
- Tenant Isolated: Yes
- Contains Financial Fields: No

### QualitySpec
- Tenant Isolated: Yes
- Contains Financial Fields: No

### NonConformanceReport
- Tenant Isolated: Yes
- Contains Financial Fields: No

### CorrectiveAction
- Tenant Isolated: Yes
- Contains Financial Fields: No

### MasterProductionSchedule
- Tenant Isolated: Yes
- Contains Financial Fields: No

### CapacityCalendar
- Tenant Isolated: Yes
- Contains Financial Fields: No

### ScheduledOperation
- Tenant Isolated: Yes
- Contains Financial Fields: No

### RMA
- Tenant Isolated: Yes
- Contains Financial Fields: No

### WarrantyClaim
- Tenant Isolated: Yes
- Contains Financial Fields: No

### WarrantyPolicy
- Tenant Isolated: Yes
- Contains Financial Fields: No

### InvoiceMatchResult
- Tenant Isolated: Yes
- Contains Financial Fields: No

### AccountingBook
- Tenant Isolated: Yes
- Contains Financial Fields: No

### AccountMapping
- Tenant Isolated: Yes
- Contains Financial Fields: Yes

### AccountMappingTemplate
- Tenant Isolated: Yes
- Contains Financial Fields: No

### BookComparison
- Tenant Isolated: Yes
- Contains Financial Fields: No

### BookOnlyJournalCategory
- Tenant Isolated: Yes
- Contains Financial Fields: No

### CustomFieldDefinition
- Tenant Isolated: Yes
- Contains Financial Fields: No

### CustomFieldValue
- Tenant Isolated: Yes
- Contains Financial Fields: No

### LeaveBalance
- Tenant Isolated: Yes
- Contains Financial Fields: No

### LeaveAccrual
- Tenant Isolated: Yes
- Contains Financial Fields: No

### LeaveRequest
- Tenant Isolated: Yes
- Contains Financial Fields: No

### DocumentExpiryAlert
- Tenant Isolated: Yes
- Contains Financial Fields: No

### BackupRecord
- Tenant Isolated: Yes
- Contains Financial Fields: No

### PaymentGateway
- Tenant Isolated: Yes
- Contains Financial Fields: No

### PaymentTransaction
- Tenant Isolated: Yes
- Contains Financial Fields: Yes

### SavedPaymentMethod
- Tenant Isolated: Yes
- Contains Financial Fields: No

### GovApiCredentials
- Tenant Isolated: Yes
- Contains Financial Fields: No

### GovApiTransaction
- Tenant Isolated: Yes
- Contains Financial Fields: No

### DunningPolicy
- Tenant Isolated: Yes
- Contains Financial Fields: No

### DunningRun
- Tenant Isolated: Yes
- Contains Financial Fields: No

### DunningTemplate
- Tenant Isolated: Yes
- Contains Financial Fields: No

### PosSession
- Tenant Isolated: Yes
- Contains Financial Fields: No

### PosSessionMovement
- Tenant Isolated: Yes
- Contains Financial Fields: Yes

### CrmAccount
- Tenant Isolated: Yes
- Contains Financial Fields: No

### Contact
- Tenant Isolated: Yes
- Contains Financial Fields: No

### PipelineStage
- Tenant Isolated: Yes
- Contains Financial Fields: No

### Opportunity
- Tenant Isolated: Yes
- Contains Financial Fields: Yes

### Activity
- Tenant Isolated: Yes
- Contains Financial Fields: No

### SubscriptionPlan
- Tenant Isolated: Yes
- Contains Financial Fields: No

### CustomerSubscription
- Tenant Isolated: Yes
- Contains Financial Fields: Yes

### SubscriptionInvoice
- Tenant Isolated: Yes
- Contains Financial Fields: Yes

### AttributeGroup
- Tenant Isolated: Yes
- Contains Financial Fields: No

### StatementTemplate
- Tenant Isolated: Yes
- Contains Financial Fields: No

### StatementDispatchLog
- Tenant Isolated: Yes
- Contains Financial Fields: Yes

### StatementBatch
- Tenant Isolated: Yes
- Contains Financial Fields: No

### StatementAccessLog
- Tenant Isolated: Yes
- Contains Financial Fields: No

### StatementSchedule
- Tenant Isolated: Yes
- Contains Financial Fields: No

### CustomerStatementTemplate
- Tenant Isolated: Yes
- Contains Financial Fields: No

### EventLog
- Tenant Isolated: Yes
- Contains Financial Fields: No

### SagaTransaction
- Tenant Isolated: Yes
- Contains Financial Fields: No

### OrchestrationStep
- Tenant Isolated: Yes
- Contains Financial Fields: No

### PLMProject
- Tenant Isolated: Yes
- Contains Financial Fields: No

### VendorPortalUser
- Tenant Isolated: Yes
- Contains Financial Fields: No

### VendorBid
- Tenant Isolated: Yes
- Contains Financial Fields: Yes

### VendorBidDetail
- Tenant Isolated: Yes
- Contains Financial Fields: No

### VendorPortalToken
- Tenant Isolated: Yes
- Contains Financial Fields: No

### Q2CJourney
- Tenant Isolated: Yes
- Contains Financial Fields: No

### P2PJourney
- Tenant Isolated: Yes
- Contains Financial Fields: No

### H2RJourney
- Tenant Isolated: Yes
- Contains Financial Fields: No

### R2RJourney
- Tenant Isolated: Yes
- Contains Financial Fields: No

### O2DJourney
- Tenant Isolated: Yes
- Contains Financial Fields: No

### PlanToProduceJourney
- Tenant Isolated: Yes
- Contains Financial Fields: No

### A2RJourney
- Tenant Isolated: Yes
- Contains Financial Fields: No

### I2RJourney
- Tenant Isolated: Yes
- Contains Financial Fields: No

### ComplianceAuditLog
- Tenant Isolated: Yes
- Contains Financial Fields: No

### RetailPOSOrder
- Tenant Isolated: Yes
- Contains Financial Fields: No

### RestaurantKDSTicket
- Tenant Isolated: Yes
- Contains Financial Fields: No

### ManufacturingBOM
- Tenant Isolated: Yes
- Contains Financial Fields: No

### ConstructionBOQ
- Tenant Isolated: Yes
- Contains Financial Fields: No

### ClinicPatientRecord
- Tenant Isolated: Yes
- Contains Financial Fields: No

### SchoolStudent
- Tenant Isolated: Yes
- Contains Financial Fields: No

### RealEstateLease
- Tenant Isolated: Yes
- Contains Financial Fields: No

### DistributionRoute
- Tenant Isolated: Yes
- Contains Financial Fields: No

### ServiceTimesheet
- Tenant Isolated: Yes
- Contains Financial Fields: No

### DocumentStateLog
- Tenant Isolated: Yes
- Contains Financial Fields: No

### PriceList
- Tenant Isolated: Yes
- Contains Financial Fields: No

### PriceRule
- Tenant Isolated: Yes
- Contains Financial Fields: No

### ClinicRoom
- Tenant Isolated: Yes
- Contains Financial Fields: No

### DoctorSchedule
- Tenant Isolated: Yes
- Contains Financial Fields: No

### Appointment
- Tenant Isolated: Yes
- Contains Financial Fields: No

### Medication
- Tenant Isolated: Yes
- Contains Financial Fields: No

### ClinicPrescription
- Tenant Isolated: Yes
- Contains Financial Fields: No

### ClinicPrescriptionItem
- Tenant Isolated: Yes
- Contains Financial Fields: No

### LabTest
- Tenant Isolated: Yes
- Contains Financial Fields: No

### LabOrder
- Tenant Isolated: Yes
- Contains Financial Fields: No

### LabResult
- Tenant Isolated: Yes
- Contains Financial Fields: No

### ZakatAssessment
- Tenant Isolated: Yes
- Contains Financial Fields: No

### ZakatAdjustment
- Tenant Isolated: Yes
- Contains Financial Fields: Yes

### SaudizationSnapshot
- Tenant Isolated: Yes
- Contains Financial Fields: No

### QiwaContract
- Tenant Isolated: Yes
- Contains Financial Fields: Yes

### PdplDataSubjectRequest
- Tenant Isolated: Yes
- Contains Financial Fields: No

### PdplConsent
- Tenant Isolated: Yes
- Contains Financial Fields: No

### PdplBreachIncident
- Tenant Isolated: Yes
- Contains Financial Fields: No

### VatCategory
- Tenant Isolated: Yes
- Contains Financial Fields: No

### WebhookSubscription
- Tenant Isolated: Yes
- Contains Financial Fields: No

### WebhookDeliveryLog
- Tenant Isolated: Yes
- Contains Financial Fields: No

### WorkflowDefinition
- Tenant Isolated: Yes
- Contains Financial Fields: No

### WorkflowInstance
- Tenant Isolated: Yes
- Contains Financial Fields: No

### ImportJob
- Tenant Isolated: Yes
- Contains Financial Fields: No

### PrintTemplate
- Tenant Isolated: Yes
- Contains Financial Fields: No

### CustomDashboard
- Tenant Isolated: Yes
- Contains Financial Fields: No

### TimesheetEntry
- Tenant Isolated: Yes
- Contains Financial Fields: No

### DmsDocument
- Tenant Isolated: Yes
- Contains Financial Fields: No

### DmsFolder
- Tenant Isolated: Yes
- Contains Financial Fields: No

### ServiceContract
- Tenant Isolated: Yes
- Contains Financial Fields: No

### InspectionPlan
- Tenant Isolated: Yes
- Contains Financial Fields: No

### InspectionResult
- Tenant Isolated: Yes
- Contains Financial Fields: No

### Notification
- Tenant Isolated: Yes
- Contains Financial Fields: No

### Comment
- Tenant Isolated: No
- Contains Financial Fields: No

### 
- Tenant Isolated: Yes
- Contains Financial Fields: No

### ReorderRule
- Tenant Isolated: Yes
- Contains Financial Fields: No

### ExpenseReport
- Tenant Isolated: Yes
- Contains Financial Fields: Yes

### ExpenseLine
- Tenant Isolated: Yes
- Contains Financial Fields: Yes

### DeferralSchedule
- Tenant Isolated: Yes
- Contains Financial Fields: Yes

### DeferralEntry
- Tenant Isolated: Yes
- Contains Financial Fields: Yes

### ProjectPhase
- Tenant Isolated: Yes
- Contains Financial Fields: No

### ProjectMilestone
- Tenant Isolated: Yes
- Contains Financial Fields: No

### ProjectRisk
- Tenant Isolated: Yes
- Contains Financial Fields: No

### ProjectResource
- Tenant Isolated: Yes
- Contains Financial Fields: No

### ProjectTimeEntry
- Tenant Isolated: Yes
- Contains Financial Fields: No

### CrmCampaign
- Tenant Isolated: Yes
- Contains Financial Fields: No

### CrmCampaignMember
- Tenant Isolated: Yes
- Contains Financial Fields: No

### SupportTicket
- Tenant Isolated: Yes
- Contains Financial Fields: No

### TicketComment
- Tenant Isolated: Yes
- Contains Financial Fields: No

### SlaPolicy
- Tenant Isolated: Yes
- Contains Financial Fields: No

### BiDashboard
- Tenant Isolated: Yes
- Contains Financial Fields: No

### BiWidget
- Tenant Isolated: Yes
- Contains Financial Fields: No

### BiKpiDefinition
- Tenant Isolated: Yes
- Contains Financial Fields: No

### BudgetVersion
- Tenant Isolated: Yes
- Contains Financial Fields: No

### BudgetScenario
- Tenant Isolated: Yes
- Contains Financial Fields: No

### BudgetScenarioLine
- Tenant Isolated: Yes
- Contains Financial Fields: Yes

### BudgetTransfer
- Tenant Isolated: Yes
- Contains Financial Fields: Yes

### BudgetAlert
- Tenant Isolated: Yes
- Contains Financial Fields: No

### ContractTemplate
- Tenant Isolated: Yes
- Contains Financial Fields: No

### ContractClause
- Tenant Isolated: Yes
- Contains Financial Fields: No

### ContractRevision
- Tenant Isolated: Yes
- Contains Financial Fields: No

### ContractRenewal
- Tenant Isolated: Yes
- Contains Financial Fields: No

### StoreFront
- Tenant Isolated: Yes
- Contains Financial Fields: No

### OnlineOrder
- Tenant Isolated: Yes
- Contains Financial Fields: Yes

### OnlineOrderLine
- Tenant Isolated: Yes
- Contains Financial Fields: No

### ProductReview
- Tenant Isolated: Yes
- Contains Financial Fields: No

### DataRetentionPolicy
- Tenant Isolated: Yes
- Contains Financial Fields: No

### RiskRegister
- Tenant Isolated: Yes
- Contains Financial Fields: No

### ComplianceRule
- Tenant Isolated: Yes
- Contains Financial Fields: No

### ComplianceCheck
- Tenant Isolated: Yes
- Contains Financial Fields: No

### InternalAudit
- Tenant Isolated: Yes
- Contains Financial Fields: No

### AuditFinding
- Tenant Isolated: Yes
- Contains Financial Fields: No

### KBArticle
- Tenant Isolated: Yes
- Contains Financial Fields: No

### KBCategory
- Tenant Isolated: Yes
- Contains Financial Fields: No

### Event
- Tenant Isolated: Yes
- Contains Financial Fields: No

### EventRegistration
- Tenant Isolated: Yes
- Contains Financial Fields: No

### SignatureRequest
- Tenant Isolated: Yes
- Contains Financial Fields: No

### SignatureLog
- Tenant Isolated: Yes
- Contains Financial Fields: No

### MaintenanceSchedule
- Tenant Isolated: Yes
- Contains Financial Fields: No

### MaintenanceWorkOrder
- Tenant Isolated: Yes
- Contains Financial Fields: No

### FreightOrder
- Tenant Isolated: Yes
- Contains Financial Fields: No

### CarrierRate
- Tenant Isolated: Yes
- Contains Financial Fields: No

### LmsCourse
- Tenant Isolated: Yes
- Contains Financial Fields: No

### LmsCourseModule
- Tenant Isolated: Yes
- Contains Financial Fields: No

### LmsCourseEnrollment
- Tenant Isolated: Yes
- Contains Financial Fields: No

### PlanningSlot
- Tenant Isolated: Yes
- Contains Financial Fields: No

### PortalUser
- Tenant Isolated: Yes
- Contains Financial Fields: No

### PortalMessage
- Tenant Isolated: Yes
- Contains Financial Fields: No

### RentalAgreement
- Tenant Isolated: Yes
- Contains Financial Fields: Yes

### RentalReturn
- Tenant Isolated: Yes
- Contains Financial Fields: No

### FieldServiceOrder
- Tenant Isolated: Yes
- Contains Financial Fields: No

### PromptTemplate
- Tenant Isolated: Yes
- Contains Financial Fields: No

### PromptUsageLog
- Tenant Isolated: Yes
- Contains Financial Fields: No

### 
- Tenant Isolated: Yes
- Contains Financial Fields: No

### KnowledgeDocument
- Tenant Isolated: Yes
- Contains Financial Fields: No

### CashPositionSnapshot
- Tenant Isolated: Yes
- Contains Financial Fields: No

### LiquidityForecast
- Tenant Isolated: Yes
- Contains Financial Fields: Yes

### LiquidityScenario
- Tenant Isolated: Yes
- Contains Financial Fields: No

### AtpRule
- Tenant Isolated: Yes
- Contains Financial Fields: No

### AtpCheck
- Tenant Isolated: Yes
- Contains Financial Fields: No

### InvoiceCapture
- Tenant Isolated: Yes
- Contains Financial Fields: No

### OcrTrainingData
- Tenant Isolated: Yes
- Contains Financial Fields: No

### ShopFloorSession
- Tenant Isolated: Yes
- Contains Financial Fields: No

### AndonCall
- Tenant Isolated: Yes
- Contains Financial Fields: No

### AiConversation
- Tenant Isolated: Yes
- Contains Financial Fields: No

### AiConversationMessage
- Tenant Isolated: Yes
- Contains Financial Fields: No

### TenantQuota
- Tenant Isolated: Yes
- Contains Financial Fields: No

### LlmContextCache
- Tenant Isolated: Yes
- Contains Financial Fields: No

### AiToolDefinition
- Tenant Isolated: Yes
- Contains Financial Fields: No

### AiToolCallLog
- Tenant Isolated: Yes
- Contains Financial Fields: No

### KnowledgeChunk
- Tenant Isolated: Yes
- Contains Financial Fields: No

### BudgetDriver
- Tenant Isolated: Yes
- Contains Financial Fields: No

### ConsolidationMember
- Tenant Isolated: Yes
- Contains Financial Fields: No

### EliminationRule
- Tenant Isolated: Yes
- Contains Financial Fields: No

### DeferredTax
- Tenant Isolated: Yes
- Contains Financial Fields: Yes

### DeferredTaxRollforward
- Tenant Isolated: Yes
- Contains Financial Fields: No

### CGU
- Tenant Isolated: Yes
- Contains Financial Fields: Yes

### ImpairmentTest
- Tenant Isolated: Yes
- Contains Financial Fields: Yes

### TPMethod
- Tenant Isolated: No
- Contains Financial Fields: No

### TPTransaction
- Tenant Isolated: Yes
- Contains Financial Fields: Yes

### TPBenchmarkStudy
- Tenant Isolated: No
- Contains Financial Fields: No

### TPDocumentation
- Tenant Isolated: No
- Contains Financial Fields: No

### ICNettingCycle
- Tenant Isolated: Yes
- Contains Financial Fields: No

### ICNettingLine
- Tenant Isolated: No
- Contains Financial Fields: Yes

### ContractAsset
- Tenant Isolated: Yes
- Contains Financial Fields: Yes

### ContractLiability
- Tenant Isolated: Yes
- Contains Financial Fields: Yes

### GaapLayer
- Tenant Isolated: Yes
- Contains Financial Fields: No

### GaapAdjustment
- Tenant Isolated: Yes
- Contains Financial Fields: No

### CashAppRule
- Tenant Isolated: Yes
- Contains Financial Fields: Yes

### PosSyncLog
- Tenant Isolated: Yes
- Contains Financial Fields: No

### CreditLimitHistory
- Tenant Isolated: Yes
- Contains Financial Fields: No

### PricingRule
- Tenant Isolated: Yes
- Contains Financial Fields: No

### BPMNProcess
- Tenant Isolated: Yes
- Contains Financial Fields: No

### BPMNTask
- Tenant Isolated: Yes
- Contains Financial Fields: No

### MobileDevice
- Tenant Isolated: Yes
- Contains Financial Fields: No

### TaxRegime
- Tenant Isolated: Yes
- Contains Financial Fields: No

### ShiftSchedule
- Tenant Isolated: Yes
- Contains Financial Fields: No

### OvertimeRequest
- Tenant Isolated: Yes
- Contains Financial Fields: No

### MudadSyncLog
- Tenant Isolated: Yes
- Contains Financial Fields: No

### WmsWave
- Tenant Isolated: Yes
- Contains Financial Fields: No

### DemandForecast
- Tenant Isolated: Yes
- Contains Financial Fields: No

### InventoryBin
- Tenant Isolated: Yes
- Contains Financial Fields: No

### EquityStatementLine
- Tenant Isolated: Yes
- Contains Financial Fields: Yes

### CashFlowLine
- Tenant Isolated: Yes
- Contains Financial Fields: Yes

### FsNote
- Tenant Isolated: Yes
- Contains Financial Fields: No

### OperatingSegment
- Tenant Isolated: Yes
- Contains Financial Fields: No

### SegmentResult
- Tenant Isolated: No
- Contains Financial Fields: No

### CopaAllocation
- Tenant Isolated: No
- Contains Financial Fields: No

### AssetRetirementObligation
- Tenant Isolated: Yes
- Contains Financial Fields: No

### AROAccretion
- Tenant Isolated: No
- Contains Financial Fields: Yes

### DunningExecution
- Tenant Isolated: Yes
- Contains Financial Fields: No

### BadDebtProvision
- Tenant Isolated: Yes
- Contains Financial Fields: Yes

### VendorOnboarding
- Tenant Isolated: Yes
- Contains Financial Fields: No

### ReverseAuction
- Tenant Isolated: Yes
- Contains Financial Fields: No

### AuctionBid
- Tenant Isolated: No
- Contains Financial Fields: Yes

### SpendCategory
- Tenant Isolated: Yes
- Contains Financial Fields: No

### SpendClassification
- Tenant Isolated: Yes
- Contains Financial Fields: No

### BlanketPO
- Tenant Isolated: Yes
- Contains Financial Fields: No

### BlanketPORelease
- Tenant Isolated: No
- Contains Financial Fields: Yes

### DropShipLink
- Tenant Isolated: No
- Contains Financial Fields: No

### SlottingRecommendation
- Tenant Isolated: Yes
- Contains Financial Fields: No

### CrossDockAssignment
- Tenant Isolated: Yes
- Contains Financial Fields: No

### ShopfloorStation
- Tenant Isolated: Yes
- Contains Financial Fields: No

### ShopfloorEvent
- Tenant Isolated: No
- Contains Financial Fields: No

### ScheduleRun
- Tenant Isolated: Yes
- Contains Financial Fields: No

### SpcChart
- Tenant Isolated: Yes
- Contains Financial Fields: No

### SpcMeasurement
- Tenant Isolated: No
- Contains Financial Fields: No

### OEERecord
- Tenant Isolated: Yes
- Contains Financial Fields: No

### SopCycle
- Tenant Isolated: Yes
- Contains Financial Fields: No

### CalibratableEquipment
- Tenant Isolated: Yes
- Contains Financial Fields: No

### CalibrationRecord
- Tenant Isolated: No
- Contains Financial Fields: No

### SuccessionPlan
- Tenant Isolated: Yes
- Contains Financial Fields: No

### SuccessionCandidate
- Tenant Isolated: No
- Contains Financial Fields: No

### NineBoxRating
- Tenant Isolated: Yes
- Contains Financial Fields: No

### Competency
- Tenant Isolated: Yes
- Contains Financial Fields: No

### EmployeeCompetency
- Tenant Isolated: No
- Contains Financial Fields: No

### CareerPath
- Tenant Isolated: No
- Contains Financial Fields: No

### CompReviewCycle
- Tenant Isolated: Yes
- Contains Financial Fields: No

### EmployeeCompProposal
- Tenant Isolated: No
- Contains Financial Fields: No

### Objective
- Tenant Isolated: Yes
- Contains Financial Fields: No

### KeyResult
- Tenant Isolated: No
- Contains Financial Fields: No

### Candidate
- Tenant Isolated: Yes
- Contains Financial Fields: No

### JobApplication
- Tenant Isolated: No
- Contains Financial Fields: No

### AttendanceDevice
- Tenant Isolated: Yes
- Contains Financial Fields: No

### AttendancePunch
- Tenant Isolated: Yes
- Contains Financial Fields: No

### SafetyIncident
- Tenant Isolated: Yes
- Contains Financial Fields: No

### AudienceSegment
- Tenant Isolated: Yes
- Contains Financial Fields: No

### CampaignJourney
- Tenant Isolated: No
- Contains Financial Fields: No

### CustomerHealth
- Tenant Isolated: Yes
- Contains Financial Fields: No

### SalesTerritory
- Tenant Isolated: Yes
- Contains Financial Fields: No

### SalesQuota
- Tenant Isolated: Yes
- Contains Financial Fields: Yes

### ForecastCommit
- Tenant Isolated: Yes
- Contains Financial Fields: Yes

### SurveyTemplate
- Tenant Isolated: Yes
- Contains Financial Fields: No

### SurveyResponse
- Tenant Isolated: Yes
- Contains Financial Fields: No

### Conversation
- Tenant Isolated: Yes
- Contains Financial Fields: No

### ConversationMessage
- Tenant Isolated: No
- Contains Financial Fields: No

### CustomPage
- Tenant Isolated: Yes
- Contains Financial Fields: No

### CustomForm
- Tenant Isolated: Yes
- Contains Financial Fields: No

### SsoProvider
- Tenant Isolated: Yes
- Contains Financial Fields: No

### EncryptedField
- Tenant Isolated: No
- Contains Financial Fields: No

### PeriodLock
- Tenant Isolated: Yes
- Contains Financial Fields: No

### AccrualEntry
- Tenant Isolated: Yes
- Contains Financial Fields: Yes

### CollectionActivity
- Tenant Isolated: Yes
- Contains Financial Fields: Yes

### PrepaymentSchedule
- Tenant Isolated: Yes
- Contains Financial Fields: Yes

### DemandForecastV2
- Tenant Isolated: Yes
- Contains Financial Fields: No

### EmissionLog
- Tenant Isolated: Yes
- Contains Financial Fields: No

### EnergyConsumption
- Tenant Isolated: Yes
- Contains Financial Fields: No

### WaterConsumption
- Tenant Isolated: Yes
- Contains Financial Fields: No

### WasteLog
- Tenant Isolated: Yes
- Contains Financial Fields: No

### SustainabilityGoal
- Tenant Isolated: Yes
- Contains Financial Fields: No

### DiversitySnapshot
- Tenant Isolated: Yes
- Contains Financial Fields: No

### EVMSnapshot
- Tenant Isolated: Yes
- Contains Financial Fields: No

### ActivityPool
- Tenant Isolated: Yes
- Contains Financial Fields: No

### ProductActivityConsumption
- Tenant Isolated: Yes
- Contains Financial Fields: No

### PoAcknowledgment
- Tenant Isolated: Yes
- Contains Financial Fields: No

### AdvanceShipNotice
- Tenant Isolated: Yes
- Contains Financial Fields: No

### VendorOnboardingStep
- Tenant Isolated: Yes
- Contains Financial Fields: No

### WaiterCall
- Tenant Isolated: Yes
- Contains Financial Fields: No

### IceAdmin
- Tenant Isolated: No
- Contains Financial Fields: No

### IceAdminRole
- Tenant Isolated: No
- Contains Financial Fields: No

### IceSubscriptionPlan
- Tenant Isolated: No
- Contains Financial Fields: No

### IceTenantSubscription
- Tenant Isolated: Yes
- Contains Financial Fields: No

### IceSubscriptionInvoice
- Tenant Isolated: Yes
- Contains Financial Fields: Yes

### IceSystemModule
- Tenant Isolated: No
- Contains Financial Fields: No

### IcePlanModule
- Tenant Isolated: No
- Contains Financial Fields: No

### IceTenantModule
- Tenant Isolated: Yes
- Contains Financial Fields: No

### IceDesktopLicense
- Tenant Isolated: Yes
- Contains Financial Fields: No

### IceAuditLog
- Tenant Isolated: No
- Contains Financial Fields: No

### IceLoginLog
- Tenant Isolated: No
- Contains Financial Fields: No

### IceSupportTicket
- Tenant Isolated: Yes
- Contains Financial Fields: No

### IceSupportReply
- Tenant Isolated: No
- Contains Financial Fields: No

### IceSystemSetting
- Tenant Isolated: No
- Contains Financial Fields: No

### IdempotencyRecord
- Tenant Isolated: Yes
- Contains Financial Fields: No

