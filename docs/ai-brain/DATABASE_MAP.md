# Database Map
This file contains all automatically discovered database models.

# 08 - قاعدة البيانات الكاملة — جميع الجداول والعلاقات (Full Database Schema)

> **إجمالي الأسطر في schema.prisma:** 11948

> **تم التوليد تلقائياً من الكود الفعلي بتاريخ:** 2026-05-14T08:21:19.703Z

## إحصائيات
- **عدد الجداول (Models):** 608
- **عدد التعدادات (Enums):** 2

## فهرس الجداول
1. `User` (60 حقل)
2. `UserBackupCode` (11 حقل)
3. `MfaAttempt` (14 حقل)
4. `TrustedDevice` (17 حقل)
5. `MfaPolicy` (18 حقل)
6. `MfaRecoveryRequest` (13 حقل)
7. `MfaUsedToken` (7 حقل)
8. `UserPermission` (10 حقل)
9. `Category` (6 حقل)
10. `Unit` (5 حقل)
11. `Product` (58 حقل)
12. `ProductUnit` (19 حقل)
13. `Customer` (110 حقل)
14. `Stock` (15 حقل)
15. `ProductStock` (14 حقل)
16. `SalesInvoice` (54 حقل)
17. `SalesInvoiceDetail` (19 حقل)
18. `SalesReturn` (26 حقل)
19. `SalesReturnDetail` (16 حقل)
20. `PurchaseOrder` (30 حقل)
21. `PurchaseOrderDetail` (15 حقل)
22. `PurchaseInvoice` (37 حقل)
23. `PurchaseInvoiceDetail` (15 حقل)
24. `PurchaseReturn` (21 حقل)
25. `PurchaseReturnDetail` (14 حقل)
26. `StockMovement` (18 حقل)
27. `Expense` (13 حقل)
28. `Treasury` (13 حقل)
29. `Setting` (5 حقل)
30. `AuditLog` (12 حقل)
31. `Employee` (63 حقل)
32. `Attendance` (8 حقل)
33. `Salary` (16 حقل)
34. `Vacation` (9 حقل)
35. `PriceQuote` (17 حقل)
36. `QuoteRevision` (8 حقل)
37. `PriceQuoteDetail` (9 حقل)
38. `StockTransfer` (9 حقل)
39. `StockTransferDetail` (7 حقل)
40. `Booking` (13 حقل)
41. `Maintenance` (11 حقل)
42. `Account` (22 حقل)
43. `JournalEntry` (29 حقل)
44. `JournalLine` (31 حقل)
45. `ProfitCenter` (9 حقل)
46. `Segment` (8 حقل)
47. `CopaCharacteristic` (5 حقل)
48. `CopaValueField` (6 حقل)
49. `CopaDocument` (17 حقل)
50. `CopaAllocationRule` (7 حقل)
51. `NumberSequence` (12 حقل)
52. `DocumentStateMachine` (9 حقل)
53. `PeriodCloseTask` (13 حقل)
54. `ApprovalWorkflow` (8 حقل)
55. `ApprovalWorkflowStep` (9 حقل)
56. `Quotation` (14 حقل)
57. `QuotationItem` (10 حقل)
58. `Installment` (12 حقل)
59. `InstallmentPayment` (10 حقل)
60. `LoyaltyPoint` (8 حقل)
61. `LoyaltyTransaction` (8 حقل)
62. `Promotion` (17 حقل)
63. `Coupon` (13 حقل)
64. `CouponUsage` (8 حقل)
65. `GiftCard` (9 حقل)
66. `Stocktake` (12 حقل)
67. `StocktakeItem` (9 حقل)
68. `Branch` (26 حقل)
69. `Shift` (17 حقل)
70. `Company` (14 حقل)
71. `Subscription` (13 حقل)
72. `SubscriptionPayment` (9 حقل)
73. `Recipe` (20 حقل)
74. `RecipeIngredient` (13 حقل)
75. `ManufacturingOrder` (23 حقل)
76. `Machine` (14 حقل)
77. `ManufacturingWastage` (14 حقل)
78. `WorkCenter` (10 حقل)
79. `RecipeOperation` (9 حقل)
80. `RecipeByProduct` (8 حقل)
81. `ManufacturingCost` (8 حقل)
82. `QualityCheck` (9 حقل)
83. `MachineMaintenance` (11 حقل)
84. `MachineTelemetry` (8 حقل)
85. `TraceabilityLog` (7 حقل)
86. `LetterOfCredit` (22 حقل)
87. `BankAccount` (32 حقل)
88. `BankTransaction` (12 حقل)
89. `ProductBatch` (21 حقل)
90. `CostCenter` (16 حقل)
91. `EmployeeLoan` (12 حقل)
92. `Currency` (16 حقل)
93. `ExchangeRate` (6 حقل)
94. `ApprovalRule` (11 حقل)
95. `ApprovalRequest` (9 حقل)
96. `ApprovalStep` (10 حقل)
97. `DocumentArchive` (10 حقل)
98. `LandedCost` (16 حقل)
99. `CheckTransaction` (17 حقل)
100. `BankReconciliation` (11 حقل)
101. `PettyCashTransaction` (12 حقل)
102. `Route` (9 حقل)
103. `SalesTarget` (8 حقل)
104. `SalesOrder` (19 حقل)
105. `SalesOrderDetail` (10 حقل)
106. `DeliveryNote` (11 حقل)
107. `DeliveryNoteDetail` (10 حقل)
108. `Project` (18 حقل)
109. `ProjectBudgetLine` (10 حقل)
110. `SupplierContract` (17 حقل)
111. `ProjectTask` (9 حقل)
112. `WarehouseZone` (8 حقل)
113. `WarehouseRack` (8 حقل)
114. `WarehouseBin` (13 حقل)
115. `PromissoryNote` (10 حقل)
116. `LetterOfGuarantee` (12 حقل)
117. `Asset` (20 حقل)
118. `Lead` (15 حقل)
119. `Vehicle` (17 حقل)
120. `Property` (10 حقل)
121. `PropertyUnit` (13 حقل)
122. `QualityInspection` (14 حقل)
123. `PurchaseRequisition` (13 حقل)
124. `PurchaseRequisitionDetail` (9 حقل)
125. `RequestForQuotation` (12 حقل)
126. `RequestForQuotationDetail` (9 حقل)
127. `GoodsReceiptNote` (18 حقل)
128. `GoodsReceiptNoteDetail` (12 حقل)
129. `JobPosting` (9 حقل)
130. `JobApplicant` (10 حقل)
131. `EmployeeEvaluation` (13 حقل)
132. `TrainingCourse` (10 حقل)
133. `TrainingEnrollment` (8 حقل)
134. `LeaseContract` (13 حقل)
135. `RentInstallment` (9 حقل)
136. `FleetTrip` (13 حقل)
137. `FuelLog` (11 حقل)
138. `Student` (11 حقل)
139. `AcademicClass` (9 حقل)
140. `ClassEnrollment` (8 حقل)
141. `Budget` (10 حقل)
142. `BudgetLine` (12 حقل)
143. `Encumbrance` (12 حقل)
144. `CommissionRule` (9 حقل)
145. `SalesmanCommission` (11 حقل)
146. `ProductSerialNumber` (11 حقل)
147. `PettyCashFund` (9 حقل)
148. `SystemAlert` (10 حقل)
149. `TenantAccount` (20 حقل)
150. `DesktopLicense` (32 حقل)
151. `TenantFeatureFlag` (10 حقل)
152. `RestaurantZone` (5 حقل)
153. `RestaurantTable` (10 حقل)
154. `RestaurantSession` (8 حقل)
155. `DesktopCrashReport` (12 حقل)
156. `WorkShift` (7 حقل)
157. `VendorRating` (10 حقل)
158. `FiscalPeriod` (11 حقل)
159. `FiscalYear` (17 حقل)
160. `YearEndCloseRun` (14 حقل)
161. `YearEndCloseTask` (23 حقل)
162. `OpeningBalance` (15 حقل)
163. `ImmutableReport` (18 حقل)
164. `FiscalYearReopenRequest` (14 حقل)
165. `ServiceTicket` (18 حقل)
166. `Shipment` (17 حقل)
167. `PharmacyDrug` (18 حقل)
168. `PharmacyPatient` (18 حقل)
169. `Prescription` (20 حقل)
170. `PrescriptionItem` (12 حقل)
171. `InsuranceClaim` (16 حقل)
172. `ControlledDrugLog` (15 حقل)
173. `MedicationLog` (9 حقل)
174. `ZATCARecord` (11 حقل)
175. `RentInvoice` (11 حقل)
176. `RentInvoiceDetail` (9 حقل)
177. `SchoolInvoice` (10 حقل)
178. `SchoolInvoiceDetail` (8 حقل)
179. `PayrollInvoice` (11 حقل)
180. `PayrollInvoiceDetail` (8 حقل)
181. `FieldAuditLog` (14 حقل)
182. `NumberingSequence` (16 حقل)
183. `PeriodCloseTaskTemplate` (8 حقل)
184. `PeriodCloseChecklist` (12 حقل)
185. `PeriodLockLog` (8 حقل)
186. `JournalTemplate` (12 حقل)
187. `JournalTemplateLine` (9 حقل)
188. `FxRevaluationRun` (10 حقل)
189. `IntercompanyTransaction` (10 حقل)
190. `ConsolidationGroup` (9 حقل)
191. `ConsolidationRun` (9 حقل)
192. `ConsolidationLine` (12 حقل)
193. `AllocationRule` (12 حقل)
194. `AllocationTarget` (8 حقل)
195. `AllocationRun` (9 حقل)
196. `PaymentTerm` (9 حقل)
197. `PaymentTermInstallment` (6 حقل)
198. `OpenItem` (39 حقل)
199. `ItemApplication` (28 حقل)
200. `DisputeCase` (32 حقل)
201. `DisputeAttachment` (10 حقل)
202. `DisputeCommunication` (12 حقل)
203. `DeductionReason` (10 حقل)
204. `WriteoffPolicy` (11 حقل)
205. `CustomerCreditScore` (8 حقل)
206. `CustomerCreditScoreHistory` (7 حقل)
207. `BankStatement` (31 حقل)
208. `BankStatementLine` (43 حقل)
209. `IntraDayBalance` (9 حقل)
210. `BankImportError` (11 حقل)
211. `BankStatementReviewItem` (10 حقل)
212. `BankReconRule` (19 حقل)
213. `BankReconPeriod` (24 حقل)
214. `BankReconciliationException` (13 حقل)
215. `OutstandingCheck` (12 حقل)
216. `DepositInTransit` (9 حقل)
217. `BankReconMatch` (11 حقل)
218. `CashFlowForecast` (14 حقل)
219. `FixedAsset` (83 حقل)
220. `FixedAssetCategory` (16 حقل)
221. `AssetDepreciationLog` (14 حقل)
222. `AssetImpairmentRecord` (19 حقل)
223. `AssetTransferRecord` (20 حقل)
224. `AssetMaintenanceRecord` (18 حقل)
225. `AssetInsuranceClaim` (18 حقل)
226. `CashGeneratingUnit` (10 حقل)
227. `AssetUsageLog` (12 حقل)
228. `AssetReclassification` (14 حقل)
229. `AssetDocument` (10 حقل)
230. `PhysicalCountSession` (15 حقل)
231. `PhysicalCountScan` (10 حقل)
232. `PhysicalCountVariance` (11 حقل)
233. `ProductVariant` (14 حقل)
234. `PickList` (8 حقل)
235. `PickListLine` (11 حقل)
236. `PutawayRule` (6 حقل)
237. `ProductSubstitute` (5 حقل)
238. `InventoryPlanning` (9 حقل)
239. `StockReservation` (9 حقل)
240. `RoleFieldPermission` (6 حقل)
241. `SegregationOfDutiesRule` (6 حقل)
242. `ApiKey` (8 حقل)
243. `UserDelegation` (8 حقل)
244. `EndOfServiceCalculation` (26 حقل)
245. `PayrollRun` (11 حقل)
246. `WPSBatch` (15 حقل)
247. `WPSBatchItem` (12 حقل)
248. `GOSIContribution` (20 حقل)
249. `GOSIMonthlyFile` (12 حقل)
250. `ThreeWayMatch` (27 حقل)
251. `ThreeWayMatchLine` (12 حقل)
252. `TolerancePolicy` (8 حقل)
253. `CashApplicationBatch` (11 حقل)
254. `CashApplication` (9 حقل)
255. `BOMVersion` (10 حقل)
256. `EngineeringChangeOrder` (16 حقل)
257. `IfrsLeaseContract` (59 حقل)
258. `IfrsLeaseSchedule` (11 حقل)
259. `IfrsLeaseScheduleLine` (20 حقل)
260. `IfrsLeaseModification` (21 حقل)
261. `IfrsLeaseTermination` (15 حقل)
262. `IfrsSublease` (14 حقل)
263. `IfrsLeaseImpairment` (15 حقل)
264. `IfrsVariableLeasePayment` (11 حقل)
265. `SalesContract` (30 حقل)
266. `PerformanceObligation` (32 حقل)
267. `DeferredRevenueSchedule` (14 حقل)
268. `RevenueRecognitionLine` (13 حقل)
269. `RevenueMilestone` (14 حقل)
270. `ContractModificationRecord` (16 حقل)
271. `VariableConsiderationUpdate` (14 حقل)
272. `StandaloneSellingPrice` (12 حقل)
273. `AssetImpairment` (10 حقل)
274. `AssetRevaluation` (11 حقل)
275. `CustomReport` (11 حقل)
276. `ReportSchedule` (12 حقل)
277. `DunningLevel` (38 حقل)
278. `DunningCampaign` (12 حقل)
279. `DunningLetter` (27 حقل)
280. `DunningCommunication` (16 حقل)
281. `PromiseToPay` (18 حقل)
282. `CollectionAgency` (15 حقل)
283. `CollectionAssignment` (15 حقل)
284. `CustomerCreditAction` (11 حقل)
285. `BpmWorkflow` (11 حقل)
286. `BpmInstance` (11 حقل)
287. `BpmTask` (14 حقل)
288. `PaymentRun` (39 حقل)
289. `PaymentRunLine` (38 حقل)
290. `PaymentRunBankFile` (25 حقل)
291. `PaymentRunApproval` (15 حقل)
292. `SupplierBankAccount` (25 حقل)
293. `PaymentBlock` (14 حقل)
294. `DiscountOpportunity` (13 حقل)
295. `WHTRule` (8 حقل)
296. `WHTTransaction` (17 حقل)
297. `WhtForm14Batch` (11 حقل)
298. `ECLModel` (7 حقل)
299. `ECLAssessment` (11 حقل)
300. `StandardCostVersion` (10 حقل)
301. `VarianceTransaction` (11 حقل)
302. `SubcontractingPO` (11 حقل)
303. `SubcontractMovement` (9 حقل)
304. `QualitySpec` (6 حقل)
305. `NonConformanceReport` (10 حقل)
306. `CorrectiveAction` (10 حقل)
307. `MasterProductionSchedule` (8 حقل)
308. `CapacityCalendar` (8 حقل)
309. `ScheduledOperation` (10 حقل)
310. `RMA` (12 حقل)
311. `WarrantyClaim` (12 حقل)
312. `WarrantyPolicy` (8 حقل)
313. `InvoiceMatchResult` (10 حقل)
314. `AccountingBook` (26 حقل)
315. `AccountMapping` (15 حقل)
316. `AccountMappingTemplate` (13 حقل)
317. `BookComparison` (14 حقل)
318. `BookOnlyJournalCategory` (8 حقل)
319. `CustomFieldDefinition` (12 حقل)
320. `CustomFieldValue` (6 حقل)
321. `LeaveBalance` (14 حقل)
322. `LeaveAccrual` (9 حقل)
323. `LeaveRequest` (18 حقل)
324. `DocumentExpiryAlert` (21 حقل)
325. `BackupRecord` (10 حقل)
326. `PaymentGateway` (9 حقل)
327. `PaymentTransaction` (16 حقل)
328. `SavedPaymentMethod` (13 حقل)
329. `GovApiCredentials` (10 حقل)
330. `GovApiTransaction` (13 حقل)
331. `DunningPolicy` (7 حقل)
332. `DunningRun` (12 حقل)
333. `DunningTemplate` (8 حقل)
334. `PosSession` (15 حقل)
335. `PosSessionMovement` (8 حقل)
336. `CrmAccount` (11 حقل)
337. `Contact` (15 حقل)
338. `PipelineStage` (9 حقل)
339. `Opportunity` (21 حقل)
340. `Activity` (16 حقل)
341. `SubscriptionPlan` (12 حقل)
342. `CustomerSubscription` (17 حقل)
343. `SubscriptionInvoice` (11 حقل)
344. `AttributeGroup` (4 حقل)
345. `StatementTemplate` (32 حقل)
346. `StatementDispatchLog` (35 حقل)
347. `StatementBatch` (18 حقل)
348. `StatementAccessLog` (12 حقل)
349. `StatementSchedule` (10 حقل)
350. `CustomerStatementTemplate` (12 حقل)
351. `EventLog` (9 حقل)
352. `SagaTransaction` (9 حقل)
353. `OrchestrationStep` (7 حقل)
354. `PLMProject` (7 حقل)
355. `VendorPortalUser` (8 حقل)
356. `VendorBid` (9 حقل)
357. `VendorBidDetail` (7 حقل)
358. `VendorPortalToken` (7 حقل)
359. `Q2CJourney` (13 حقل)
360. `P2PJourney` (14 حقل)
361. `H2RJourney` (8 حقل)
362. `R2RJourney` (7 حقل)
363. `O2DJourney` (10 حقل)
364. `PlanToProduceJourney` (9 حقل)
365. `A2RJourney` (8 حقل)
366. `I2RJourney` (9 حقل)
367. `ComplianceAuditLog` (8 حقل)
368. `RetailPOSOrder` (6 حقل)
369. `RestaurantKDSTicket` (6 حقل)
370. `ManufacturingBOM` (6 حقل)
371. `ConstructionBOQ` (6 حقل)
372. `ClinicPatientRecord` (6 حقل)
373. `SchoolStudent` (5 حقل)
374. `RealEstateLease` (8 حقل)
375. `DistributionRoute` (6 حقل)
376. `ServiceTimesheet` (7 حقل)
377. `DocumentStateLog` (10 حقل)
378. `PriceList` (14 حقل)
379. `PriceRule` (12 حقل)
380. `ClinicRoom` (6 حقل)
381. `DoctorSchedule` (8 حقل)
382. `Appointment` (14 حقل)
383. `Medication` (7 حقل)
384. `ClinicPrescription` (10 حقل)
385. `ClinicPrescriptionItem` (10 حقل)
386. `LabTest` (8 حقل)
387. `LabOrder` (10 حقل)
388. `LabResult` (9 حقل)
389. `ZakatAssessment` (25 حقل)
390. `ZakatAdjustment` (8 حقل)
391. `SaudizationSnapshot` (13 حقل)
392. `QiwaContract` (14 حقل)
393. `PdplDataSubjectRequest` (14 حقل)
394. `PdplConsent` (11 حقل)
395. `PdplBreachIncident` (16 حقل)
396. `VatCategory` (9 حقل)
397. `WebhookSubscription` (11 حقل)
398. `WebhookDeliveryLog` (8 حقل)
399. `WorkflowDefinition` (8 حقل)
400. `WorkflowInstance` (8 حقل)
401. `ImportJob` (12 حقل)
402. `PrintTemplate` (12 حقل)
403. `CustomDashboard` (6 حقل)
404. `TimesheetEntry` (11 حقل)
405. `DmsDocument` (13 حقل)
406. `DmsFolder` (4 حقل)
407. `ServiceContract` (13 حقل)
408. `InspectionPlan` (5 حقل)
409. `InspectionResult` (8 حقل)
410. `Notification` (9 حقل)
411. `Comment` (10 حقل)
412. `ReorderRule` (11 حقل)
413. `ExpenseReport` (9 حقل)
414. `ExpenseLine` (11 حقل)
415. `DeferralSchedule` (10 حقل)
416. `DeferralEntry` (8 حقل)
417. `ProjectPhase` (14 حقل)
418. `ProjectMilestone` (13 حقل)
419. `ProjectRisk` (12 حقل)
420. `ProjectResource` (13 حقل)
421. `ProjectTimeEntry` (14 حقل)
422. `CrmCampaign` (17 حقل)
423. `CrmCampaignMember` (9 حقل)
424. `SupportTicket` (19 حقل)
425. `TicketComment` (8 حقل)
426. `SlaPolicy` (11 حقل)
427. `BiDashboard` (11 حقل)
428. `BiWidget` (12 حقل)
429. `BiKpiDefinition` (13 حقل)
430. `BudgetVersion` (11 حقل)
431. `BudgetScenario` (10 حقل)
432. `BudgetScenarioLine` (10 حقل)
433. `BudgetTransfer` (11 حقل)
434. `BudgetAlert` (9 حقل)
435. `ContractTemplate` (9 حقل)
436. `ContractClause` (8 حقل)
437. `ContractRevision` (8 حقل)
438. `ContractRenewal` (11 حقل)
439. `StoreFront` (13 حقل)
440. `OnlineOrder` (24 حقل)
441. `OnlineOrderLine` (9 حقل)
442. `ProductReview` (9 حقل)
443. `DataRetentionPolicy` (9 حقل)
444. `RiskRegister` (11 حقل)
445. `ComplianceRule` (10 حقل)
446. `ComplianceCheck` (10 حقل)
447. `InternalAudit` (10 حقل)
448. `AuditFinding` (11 حقل)
449. `KBArticle` (13 حقل)
450. `KBCategory` (7 حقل)
451. `Event` (14 حقل)
452. `EventRegistration` (11 حقل)
453. `SignatureRequest` (10 حقل)
454. `SignatureLog` (9 حقل)
455. `MaintenanceSchedule` (12 حقل)
456. `MaintenanceWorkOrder` (13 حقل)
457. `FreightOrder` (14 حقل)
458. `CarrierRate` (10 حقل)
459. `LmsCourse` (12 حقل)
460. `LmsCourseModule` (9 حقل)
461. `LmsCourseEnrollment` (9 حقل)
462. `PlanningSlot` (10 حقل)
463. `PortalUser` (9 حقل)
464. `PortalMessage` (8 حقل)
465. `RentalAgreement` (15 حقل)
466. `RentalReturn` (10 حقل)
467. `FieldServiceOrder` (20 حقل)
468. `PromptTemplate` (15 حقل)
469. `PromptUsageLog` (12 حقل)
470. `KnowledgeDocument` (15 حقل)
471. `CashPositionSnapshot` (6 حقل)
472. `LiquidityForecast` (10 حقل)
473. `LiquidityScenario` (6 حقل)
474. `AtpRule` (10 حقل)
475. `AtpCheck` (9 حقل)
476. `InvoiceCapture` (14 حقل)
477. `OcrTrainingData` (5 حقل)
478. `ShopFloorSession` (15 حقل)
479. `AndonCall` (10 حقل)
480. `AiConversation` (7 حقل)
481. `AiConversationMessage` (11 حقل)
482. `TenantQuota` (10 حقل)
483. `LlmContextCache` (9 حقل)
484. `AiToolDefinition` (9 حقل)
485. `AiToolCallLog` (11 حقل)
486. `KnowledgeChunk` (12 حقل)
487. `BudgetDriver` (7 حقل)
488. `ConsolidationMember` (10 حقل)
489. `EliminationRule` (11 حقل)
490. `DeferredTax` (18 حقل)
491. `DeferredTaxRollforward` (9 حقل)
492. `CGU` (7 حقل)
493. `ImpairmentTest` (11 حقل)
494. `TPMethod` (5 حقل)
495. `TPTransaction` (15 حقل)
496. `TPBenchmarkStudy` (9 حقل)
497. `TPDocumentation` (8 حقل)
498. `ICNettingCycle` (7 حقل)
499. `ICNettingLine` (9 حقل)
500. `ContractAsset` (7 حقل)
501. `ContractLiability` (7 حقل)
502. `GaapLayer` (6 حقل)
503. `GaapAdjustment` (7 حقل)
504. `CashAppRule` (6 حقل)
505. `PosSyncLog` (7 حقل)
506. `CreditLimitHistory` (8 حقل)
507. `PricingRule` (7 حقل)
508. `BPMNProcess` (7 حقل)
509. `BPMNTask` (8 حقل)
510. `MobileDevice` (6 حقل)
511. `TaxRegime` (6 حقل)
512. `ShiftSchedule` (8 حقل)
513. `OvertimeRequest` (8 حقل)
514. `MudadSyncLog` (6 حقل)
515. `WmsWave` (7 حقل)
516. `DemandForecast` (7 حقل)
517. `InventoryBin` (7 حقل)
518. `EquityStatementLine` (7 حقل)
519. `CashFlowLine` (7 حقل)
520. `FsNote` (7 حقل)
521. `OperatingSegment` (6 حقل)
522. `SegmentResult` (7 حقل)
523. `CopaAllocation` (5 حقل)
524. `AssetRetirementObligation` (8 حقل)
525. `AROAccretion` (5 حقل)
526. `DunningExecution` (8 حقل)
527. `BadDebtProvision` (7 حقل)
528. `VendorOnboarding` (12 حقل)
529. `ReverseAuction` (10 حقل)
530. `AuctionBid` (6 حقل)
531. `SpendCategory` (6 حقل)
532. `SpendClassification` (7 حقل)
533. `BlanketPO` (10 حقل)
534. `BlanketPORelease` (7 حقل)
535. `DropShipLink` (5 حقل)
536. `SlottingRecommendation` (8 حقل)
537. `CrossDockAssignment` (7 حقل)
538. `ShopfloorStation` (8 حقل)
539. `ShopfloorEvent` (6 حقل)
540. `ScheduleRun` (5 حقل)
541. `SpcChart` (10 حقل)
542. `SpcMeasurement` (8 حقل)
543. `OEERecord` (11 حقل)
544. `SopCycle` (6 حقل)
545. `CalibratableEquipment` (7 حقل)
546. `CalibrationRecord` (7 حقل)
547. `SuccessionPlan` (5 حقل)
548. `SuccessionCandidate` (6 حقل)
549. `NineBoxRating` (7 حقل)
550. `Competency` (6 حقل)
551. `EmployeeCompetency` (6 حقل)
552. `CareerPath` (4 حقل)
553. `CompReviewCycle` (6 حقل)
554. `EmployeeCompProposal` (7 حقل)
555. `Objective` (7 حقل)
556. `KeyResult` (6 حقل)
557. `Candidate` (7 حقل)
558. `JobApplication` (6 حقل)
559. `AttendanceDevice` (6 حقل)
560. `AttendancePunch` (9 حقل)
561. `SafetyIncident` (10 حقل)
562. `AudienceSegment` (6 حقل)
563. `CampaignJourney` (3 حقل)
564. `CustomerHealth` (7 حقل)
565. `SalesTerritory` (6 حقل)
566. `SalesQuota` (6 حقل)
567. `ForecastCommit` (8 حقل)
568. `SurveyTemplate` (5 حقل)
569. `SurveyResponse` (8 حقل)
570. `Conversation` (8 حقل)
571. `ConversationMessage` (6 حقل)
572. `CustomPage` (7 حقل)
573. `CustomForm` (6 حقل)
574. `SsoProvider` (9 حقل)
575. `EncryptedField` (8 حقل)
576. `PeriodLock` (11 حقل)
577. `AccrualEntry` (18 حقل)
578. `CollectionActivity` (11 حقل)
579. `PrepaymentSchedule` (9 حقل)
580. `DemandForecastV2` (14 حقل)
581. `EmissionLog` (14 حقل)
582. `EnergyConsumption` (8 حقل)
583. `WaterConsumption` (6 حقل)
584. `WasteLog` (7 حقل)
585. `SustainabilityGoal` (9 حقل)
586. `DiversitySnapshot` (10 حقل)
587. `EVMSnapshot` (20 حقل)
588. `ActivityPool` (8 حقل)
589. `ProductActivityConsumption` (6 حقل)
590. `PoAcknowledgment` (8 حقل)
591. `AdvanceShipNotice` (12 حقل)
592. `VendorOnboardingStep` (9 حقل)
593. `WaiterCall` (7 حقل)
594. `IceAdmin` (19 حقل)
595. `IceAdminRole` (6 حقل)
596. `IceSubscriptionPlan` (18 حقل)
597. `IceTenantSubscription` (14 حقل)
598. `IceSubscriptionInvoice` (15 حقل)
599. `IceSystemModule` (12 حقل)
600. `IcePlanModule` (5 حقل)
601. `IceTenantModule` (5 حقل)
602. `IceDesktopLicense` (13 حقل)
603. `IceAuditLog` (11 حقل)
604. `IceLoginLog` (8 حقل)
605. `IceSupportTicket` (11 حقل)
606. `IceSupportReply` (9 حقل)
607. `IceSystemSetting` (5 حقل)
608. `IdempotencyRecord` (12 حقل)

---

## Model: `User`
| الحقل | النوع | الوصف |
|---|---|---|
| `id` | `Int` | @id @default(autoincrement()) |
| `username` | `String` | @unique |
| `passwordHash` | `String` | @map("password_hash") |
| `fullName` | `String` | @map("full_name") |
| `role` | `String` | @default("cashier") // admin, cashier, accountant |
| `phone` | `String?` |  |
| `active` | `Boolean` | @default(true) |
| `sessionToken` | `String?` | @map("session_token") |
| `deviceToken` | `String?` | @map("device_token") |
| `deviceName` | `String?` | @map("device_name") |
| `deviceBoundAt` | `DateTime?` | @map("device_bound_at") |
| `createdAt` | `DateTime` | @default(now()) @map("created_at") |
| `permissions` | `UserPermission[]` |  |
| `salesInvoices` | `SalesInvoice[]` |  |
| `purchaseInvoices` | `PurchaseInvoice[]` |  |
| `purchaseOrders` | `PurchaseOrder[]` | @relation("PurchaseOrderCreator") |
| `approvals` | `PurchaseOrder[]` | @relation("PurchaseOrderApprover") |
| `expenses` | `Expense[]` |  |
| `treasuryEntries` | `Treasury[]` |  |
| `auditLogs` | `AuditLog[]` |  |
| `stockMovements` | `StockMovement[]` |  |
| `shifts` | `Shift[]` |  |
| `branchId` | `Int?` | @map("branch_id") |
| `branch` | `Branch?` | @relation(fields: [branchId], references: [id]) |
| `approvalRules` | `ApprovalRule[]` | @relation("RuleApprover") |
| `approvalRequests` | `ApprovalRequest[]` | @relation("ApprovalRequester") |
| `approvalSteps` | `ApprovalStep[]` | @relation("StepApprover") |
| `archives` | `DocumentArchive[]` |  |
| `prRequisitions` | `PurchaseRequisition[]` | @relation("PRRequester") |
| `prApprovals` | `PurchaseRequisition[]` | @relation("PRApprover") |
| `rfqs` | `RequestForQuotation[]` |  |
| `goodsReceipts` | `GoodsReceiptNote[]` |  |
| `alerts` | `SystemAlert[]` |  |
| `defaultPage` | `String?` | @map("default_page") // (see field name for description) |
| `totpSecretEncrypted` | `String?` | @db.Text |
| `totpIv` | `String?` | @db.VarChar(32) |
| `totpAuthTag` | `String?` | @db.VarChar(32) |
| `mfaEnabled` | `Boolean` | @default(false) |
| `mfaMethod` | `String?` | // 'TOTP' | 'SMS' | 'EMAIL' | 'HARDWARE_KEY' |
| `mfaPendingActivation` | `Boolean` | @default(false) |
| `mfaEnrolledAt` | `DateTime?` |  |
| `mfaLastUsedAt` | `DateTime?` |  |
| `mfaFailedAttempts` | `Int` | @default(0) |
| `mfaLockedUntil` | `DateTime?` |  |
| `mfaRequiredByPolicy` | `Boolean` | @default(false) |
| `mfaPolicyId` | `Int?` |  |
| `mfaPolicy` | `MfaPolicy?` | @relation(fields: [mfaPolicyId], references: [id]) |
| `mfaGracePeriodEndsAt` | `DateTime?` |  |
| `mfaPhoneVerified` | `String?` | // E.164 format |
| `mfaPhoneVerifiedAt` | `DateTime?` |  |
| `backupCodes` | `UserBackupCode[]` |  |
| `mfaAttempts` | `MfaAttempt[]` |  |
| `trustedDevices` | `TrustedDevice[]` |  |
| `recoveryRequests` | `MfaRecoveryRequest[]` |  |
| `usedTokens` | `MfaUsedToken[]` |  |
| `dispensedRx` | `Prescription[]` | @relation("PrescriptionPharmacist") |
| `controlledLogs` | `ControlledDrugLog[]` | @relation("ControlledDrugPharmacist") |
| `posSessions` | `PosSession[]` |  |
| `DocumentStateLog` | `DocumentStateLog[]` |  |
| `deletedAt` | `DateTime?` | // P1.2 soft-delete ط·آ·ط¢آ·ط·آ¢ط¢آ·ط·آ·ط¢آ¢ط·آ¢ط¢آ·ط·آ·ط¢آ·ط·آ¢ط¢آ¢ط·آ·ط¢آ¢ط·آ¢ط¢آ·ط·آ·ط¢آ·ط·آ¢ط¢آ·ط·آ·ط¢آ¢ط·آ¢ط¢آ¢ط·آ·ط¢آ·ط·آ¢ط¢آ¢ط·آ·ط¢آ¢ط·آ¢ط¢آ£ط·آ·ط¢آ·ط·آ¢ط¢آ·ط·آ·ط¢آ¢ط·آ¢ط¢آ·ط·آ·ط¢آ·ط·آ¢ط¢آ¢ط·آ·ط¢آ¢ط·آ¢ط¢آ¢ط·آ·ط¢آ·ط·آ¢ط¢آ·ط·آ·ط¢آ¢ط·آ¢ط¢آ¢ط·آ·ط¢آ·ط·آ¢ط¢آ¢ط·آ·ط¢آ¢ط·آ¢ط¢آ¢ط·آ·ط¢آ·ط·آ¢ط¢آ·ط·آ·ط¢آ¢ط·آ¢ط¢آ·ط·آ·ط¢آ·ط·آ¢ط¢آ¢ط·آ·ط¢آ¢ط·آ¢ط¢آ£ط·آ·ط¢آ·ط·آ¢ط¢آ·ط·آ·ط¢آ¢ط·آ¢ط¢آ¢ط·آ·ط¢آ·ط·آ¢ط¢آ¢ط·آ·ط¢آ¢ط·آ¢ط¢آ¢ط·آ·ط¢آ·ط·آ¢ط¢آ·ط·آ·ط¢آ¢ط·آ¢ط¢آ£ط·آ·ط¢آ·ط·آ¢ط¢آ¢ط·آ·ط¢آ¢ط·آ¢ط¢آ¢ط·آ·ط¢آ·ط·آ¢ط¢آ£ط·آ·ط¢آ¢ط·آ¢ط¢آ¢ط·آ·ط¢آ£ط·آ¢ط¢آ¢ط·آ£ط¢آ¢ط£آ¢أ¢â€ڑآ¬ط¹â€کط·آ¢ط¢آ¬ط·آ·ط¢آ¹ط£آ¢أ¢â€ڑآ¬ط¹آ©ط·آ·ط¢آ·ط·آ¢ط¢آ¢ط·آ·ط¢آ¢ط·آ¢ط¢آ¬ط·آ·ط¢آ·ط·آ¢ط¢آ·ط·آ·ط¢آ¢ط·آ¢ط¢آ¹ط·آ·ط¢آ£ط·آ¢ط¢آ¢ط·آ£ط¢آ¢ط£آ¢أ¢â€ڑآ¬ط¹â€کط·آ¢ط¢آ¬ط·آ·ط¢آ¹ط·آ¢ط¢آ©ط·آ·ط¢آ·ط·آ¢ط¢آ·ط·آ·ط¢آ¢ط·آ¢ط¢آ·ط·آ·ط¢آ·ط·آ¢ط¢آ¢ط·آ·ط¢آ¢ط·آ¢ط¢آ¢ط·آ·ط¢آ·ط·آ¢ط¢آ·ط·آ·ط¢آ¢ط·آ¢ط¢آ¢ط·آ·ط¢آ·ط·آ¢ط¢آ¢ط·آ·ط¢آ¢ط·آ¢ط¢آ¬ط·آ·ط¢آ·ط·آ¢ط¢آ·ط·آ·ط¢آ¢ط·آ¢ط¢آ·ط·آ·ط¢آ·ط·آ¢ط¢آ¢ط·آ·ط¢آ¢ط·آ¢ط¢آ£ط·آ·ط¢آ·ط·آ¢ط¢آ·ط·آ·ط¢آ¢ط·آ¢ط¢آ¢ط·آ·ط¢آ·ط·آ¢ط¢آ¢ط·آ·ط¢آ¢ط·آ¢ط¢آ¢ط·آ·ط¢آ·ط·آ¢ط¢آ·ط·آ·ط¢آ¢ط·آ¢ط¢آ£ط·آ·ط¢آ·ط·آ¢ط¢آ¢ط·آ·ط¢آ¢ط·آ¢ط¢آ¢ط·آ·ط¢آ·ط·آ¢ط¢آ£ط·آ·ط¢آ¢ط·آ¢ط¢آ¢ط·آ·ط¢آ£ط·آ¢ط¢آ¢ط·آ£ط¢آ¢ط£آ¢أ¢â‚¬ع‘ط¢آ¬ط·آ¹أ¢â‚¬ع©ط·آ·ط¢آ¢ط·آ¢ط¢آ¬ط·آ·ط¢آ·ط·آ¢ط¢آ¹ط·آ£ط¢آ¢ط£آ¢أ¢â‚¬ع‘ط¢آ¬ط·آ¹ط¢آ©ط·آ·ط¢آ·ط·آ¢ط¢آ·ط·آ·ط¢آ¢ط·آ¢ط¢آ¢ط·آ·ط¢آ·ط·آ¢ط¢آ¢ط·آ·ط¢آ¢ط·آ¢ط¢آ¬ط·آ·ط¢آ·ط·آ¢ط¢آ·ط·آ·ط¢آ¢ط·آ¢ط¢آ£ط·آ·ط¢آ·ط·آ¢ط¢آ¢ط·آ·ط¢آ¢ط·آ¢ط¢آ¢ط·آ·ط¢آ·ط·آ¢ط¢آ£ط·آ·ط¢آ¢ط·آ¢ط¢آ¢ط·آ·ط¢آ£ط·آ¢ط¢آ¢ط·آ£ط¢آ¢ط£آ¢أ¢â€ڑآ¬ط¹â€کط·آ¢ط¢آ¬ط·آ·ط¢آ¹ط£آ¢أ¢â€ڑآ¬ط¹آ©ط·آ·ط¢آ·ط·آ¢ط¢آ¢ط·آ·ط¢آ¢ط·آ¢ط¢آ¬ط·آ·ط¢آ·ط·آ¢ط¢آ·ط·آ·ط¢آ¢ط·آ¢ط¢آ¥ط·آ·ط¢آ£ط·آ¢ط¢آ¢ط·آ£ط¢آ¢ط£آ¢أ¢â€ڑآ¬ط¹â€کط·آ¢ط¢آ¬ط·آ£ط¢آ¢ط£آ¢أ¢â€ڑآ¬أ¢â‚¬ع†ط·آ¢ط¢آ¢ do not use hard DELETE |

## Model: `UserBackupCode`
| الحقل | النوع | الوصف |
|---|---|---|
| `id` | `Int` | @id @default(autoincrement()) |
| `tenantId` | `String` | @default("default") @map("tenant_id") |
| `userId` | `Int` |  |
| `user` | `User` | @relation(fields: [userId], references: [id], onDelete: Cascade) |
| `codeHash` | `String` | // bcrypt |
| `codeHint` | `String` | // first 2 chars in plain (for display "ABط·آ·ط¢آ·ط·آ¢ط¢آ·ط·آ·ط¢آ¢ط·آ¢ط¢آ·ط·آ·ط¢آ·ط·آ¢ط¢آ¢ط·آ·ط¢آ¢ط·آ¢ط¢آ·ط·آ·ط¢آ·ط·آ¢ط¢آ·ط·آ·ط¢آ¢ط·آ¢ط¢آ¢ط·آ·ط¢آ·ط·آ¢ط¢آ¢ط·آ·ط¢آ¢ط·آ¢ط¢آ£ط·آ·ط¢آ·ط·آ¢ط¢آ·ط·آ·ط¢آ¢ط·آ¢ط¢آ·ط·آ·ط¢آ·ط·آ¢ط¢آ¢ط·آ·ط¢آ¢ط·آ¢ط¢آ¢ط·آ·ط¢آ·ط·آ¢ط¢آ·ط·آ·ط¢آ¢ط·آ¢ط¢آ¢ط·آ·ط¢آ·ط·آ¢ط¢آ¢ط·آ·ط¢آ¢ط·آ¢ط¢آ¢ط·آ·ط¢آ·ط·آ¢ط¢آ·ط·آ·ط¢آ¢ط·آ¢ط¢آ·ط·آ·ط¢آ·ط·آ¢ط¢آ¢ط·آ·ط¢آ¢ط·آ¢ط¢آ£ط·آ·ط¢آ·ط·آ¢ط¢آ·ط·آ·ط¢آ¢ط·آ¢ط¢آ¢ط·آ·ط¢آ·ط·آ¢ط¢آ¢ط·آ·ط¢آ¢ط·آ¢ط¢آ¢ط·آ·ط¢آ·ط·آ¢ط¢آ·ط·آ·ط¢آ¢ط·آ¢ط¢آ£ط·آ·ط¢آ·ط·آ¢ط¢آ¢ط·آ·ط¢آ¢ط·آ¢ط¢آ¢ط·آ·ط¢آ·ط·آ¢ط¢آ£ط·آ·ط¢آ¢ط·آ¢ط¢آ¢ط·آ·ط¢آ£ط·آ¢ط¢آ¢ط·آ£ط¢آ¢ط£آ¢أ¢â€ڑآ¬ط¹â€کط·آ¢ط¢آ¬ط·آ·ط¢آ¹ط£آ¢أ¢â€ڑآ¬ط¹آ©ط·آ·ط¢آ·ط·آ¢ط¢آ¢ط·آ·ط¢آ¢ط·آ¢ط¢آ¬ط·آ·ط¢آ·ط·آ¢ط¢آ·ط·آ·ط¢آ¢ط·آ¢ط¢آ¹ط·آ·ط¢آ£ط·آ¢ط¢آ¢ط·آ£ط¢آ¢ط£آ¢أ¢â€ڑآ¬ط¹â€کط·آ¢ط¢آ¬ط·آ·ط¢آ¹ط·آ¢ط¢آ©ط·آ·ط¢آ·ط·آ¢ط¢آ·ط·آ·ط¢آ¢ط·آ¢ط¢آ·ط·آ·ط¢آ·ط·آ¢ط¢آ¢ط·آ·ط¢آ¢ط·آ¢ط¢آ¢ط·آ·ط¢آ·ط·آ¢ط¢آ·ط·آ·ط¢آ¢ط·آ¢ط¢آ¢ط·آ·ط¢آ·ط·آ¢ط¢آ¢ط·آ·ط¢آ¢ط·آ¢ط¢آ¬ط·آ·ط¢آ·ط·آ¢ط¢آ·ط·آ·ط¢آ¢ط·آ¢ط¢آ·ط·آ·ط¢آ·ط·آ¢ط¢آ¢ط·آ·ط¢آ¢ط·آ¢ط¢آ·ط·آ·ط¢آ·ط·آ¢ط¢آ·ط·آ·ط¢آ¢ط·آ¢ط¢آ¢ط·آ·ط¢آ·ط·آ¢ط¢آ¢ط·آ·ط¢آ¢ط·آ¢ط¢آ¢ط·آ·ط¢آ·ط·آ¢ط¢آ·ط·آ·ط¢آ¢ط·آ¢ط¢آ·ط·آ·ط¢آ·ط·آ¢ط¢آ¢ط·آ·ط¢آ¢ط·آ¢ط¢آ¢ط·آ·ط¢آ·ط·آ¢ط¢آ·ط·آ·ط¢آ¢ط·آ¢ط¢آ¢ط·آ·ط¢آ·ط·آ¢ط¢آ¢ط·آ·ط¢آ¢ط·آ¢ط¢آ¢ط·آ·ط¢آ·ط·آ¢ط¢آ·ط·آ·ط¢آ¢ط·آ¢ط¢آ·ط·آ·ط¢آ·ط·آ¢ط¢آ¢ط·آ·ط¢آ¢ط·آ¢ط¢آ·ط·آ·ط¢آ·ط·آ¢ط¢آ·ط·آ·ط¢آ¢ط·آ¢ط¢آ¢ط·آ·ط¢آ·ط·آ¢ط¢آ¢ط·آ·ط¢آ¢ط·آ¢ط¢آ£ط·آ·ط¢آ·ط·آ¢ط¢آ·ط·آ·ط¢آ¢ط·آ¢ط¢آ·ط·آ·ط¢آ·ط·آ¢ط¢آ¢ط·آ·ط¢آ¢ط·آ¢ط¢آ¢ط·آ·ط¢آ·ط·آ¢ط¢آ·ط·آ·ط¢آ¢ط·آ¢ط¢آ¢ط·آ·ط¢آ·ط·آ¢ط¢آ¢ط·آ·ط¢آ¢ط·آ¢ط¢آ¢ط·آ·ط¢آ·ط·آ¢ط¢آ·ط·آ·ط¢آ¢ط·آ¢ط¢آ·ط·آ·ط¢آ·ط·آ¢ط¢آ¢ط·آ·ط¢آ¢ط·آ¢ط¢آ£ط·آ·ط¢آ·ط·آ¢ط¢آ·ط·آ·ط¢آ¢ط·آ¢ط¢آ¢ط·آ·ط¢آ·ط·آ¢ط¢آ¢ط·آ·ط¢آ¢ط·آ¢ط¢آ¢ط·آ·ط¢آ·ط·آ¢ط¢آ·ط·آ·ط¢آ¢ط·آ¢ط¢آ£ط·آ·ط¢آ·ط·آ¢ط¢آ¢ط·آ·ط¢آ¢ط·آ¢ط¢آ¢ط·آ·ط¢آ·ط·آ¢ط¢آ£ط·آ·ط¢آ¢ط·آ¢ط¢آ¢ط·آ·ط¢آ£ط·آ¢ط¢آ¢ط·آ£ط¢آ¢ط£آ¢أ¢â€ڑآ¬ط¹â€کط·آ¢ط¢آ¬ط·آ·ط¢آ¹ط£آ¢أ¢â€ڑآ¬ط¹آ©ط·آ·ط¢آ·ط·آ¢ط¢آ¢ط·آ·ط¢آ¢ط·آ¢ط¢آ¬ط·آ·ط¢آ·ط·آ¢ط¢آ·ط·آ·ط¢آ¢ط·آ¢ط¢آ¹ط·آ·ط¢آ£ط·آ¢ط¢آ¢ط·آ£ط¢آ¢ط£آ¢أ¢â€ڑآ¬ط¹â€کط·آ¢ط¢آ¬ط·آ·ط¢آ¹ط·آ¢ط¢آ©ط·آ·ط¢آ·ط·آ¢ط¢آ·ط·آ·ط¢آ¢ط·آ¢ط¢آ·ط·آ·ط¢آ·ط·آ¢ط¢آ¢ط·آ·ط¢آ¢ط·آ¢ط¢آ¢ط·آ·ط¢آ·ط·آ¢ط¢آ·ط·آ·ط¢آ¢ط·آ¢ط¢آ¢ط·آ·ط¢آ·ط·آ¢ط¢آ¢ط·آ·ط¢آ¢ط·آ¢ط¢آ¬ط·آ·ط¢آ·ط·آ¢ط¢آ·ط·آ·ط¢آ¢ط·آ¢ط¢آ·ط·آ·ط¢آ·ط·آ¢ط¢آ¢ط·آ·ط¢آ¢ط·آ¢ط¢آ·ط·آ·ط¢آ·ط·آ¢ط¢آ·ط·آ·ط¢آ¢ط·آ¢ط¢آ¢ط·آ·ط¢آ·ط·آ¢ط¢آ¢ط·آ·ط¢آ¢ط·آ¢ط¢آ¢ط·آ·ط¢آ·ط·آ¢ط¢آ·ط·آ·ط¢آ¢ط·آ¢ط¢آ·ط·آ·ط¢آ·ط·آ¢ط¢آ¢ط·آ·ط¢آ¢ط·آ¢ط¢آ¢ط·آ·ط¢آ·ط·آ¢ط¢آ·ط·آ·ط¢آ¢ط·آ¢ط¢آ¢ط·آ·ط¢آ·ط·آ¢ط¢آ¢ط·آ·ط¢آ¢ط·آ¢ط¢آ¢-ط·آ·ط¢آ·ط·آ¢ط¢آ·ط·آ·ط¢آ¢ط·آ¢ط¢آ·ط·آ·ط¢آ·ط·آ¢ط¢آ¢ط·آ·ط¢آ¢ط·آ¢ط¢آ·ط·آ·ط¢آ·ط·آ¢ط¢آ·ط·آ·ط¢آ¢ط·آ¢ط¢آ¢ط·آ·ط¢آ·ط·آ¢ط¢آ¢ط·آ·ط¢آ¢ط·آ¢ط¢آ£ط·آ·ط¢آ·ط·آ¢ط¢آ·ط·آ·ط¢آ¢ط·آ¢ط¢آ·ط·آ·ط¢آ·ط·آ¢ط¢آ¢ط·آ·ط¢آ¢ط·آ¢ط¢آ¢ط·آ·ط¢آ·ط·آ¢ط¢آ·ط·آ·ط¢آ¢ط·آ¢ط¢آ¢ط·آ·ط¢آ·ط·آ¢ط¢آ¢ط·آ·ط¢آ¢ط·آ¢ط¢آ¢ط·آ·ط¢آ·ط·آ¢ط¢آ·ط·آ·ط¢آ¢ط·آ¢ط¢آ·ط·آ·ط¢آ·ط·آ¢ط¢آ¢ط·آ·ط¢آ¢ط·آ¢ط¢آ£ط·آ·ط¢آ·ط·آ¢ط¢آ·ط·آ·ط¢آ¢ط·آ¢ط¢آ¢ط·آ·ط¢آ·ط·آ¢ط¢آ¢ط·آ·ط¢آ¢ط·آ¢ط¢آ¢ط·آ·ط¢آ·ط·آ¢ط¢آ·ط·آ·ط¢آ¢ط·آ¢ط¢آ£ط·آ·ط¢آ·ط·آ¢ط¢آ¢ط·آ·ط¢آ¢ط·آ¢ط¢آ¢ط·آ·ط¢آ·ط·آ¢ط¢آ£ط·آ·ط¢آ¢ط·آ¢ط¢آ¢ط·آ·ط¢آ£ط·آ¢ط¢آ¢ط·آ£ط¢آ¢ط£آ¢أ¢â€ڑآ¬ط¹â€کط·آ¢ط¢آ¬ط·آ·ط¢آ¹ط£آ¢أ¢â€ڑآ¬ط¹آ©ط·آ·ط¢آ·ط·آ¢ط¢آ¢ط·آ·ط¢آ¢ط·آ¢ط¢آ¬ط·آ·ط¢آ·ط·آ¢ط¢آ·ط·آ·ط¢آ¢ط·آ¢ط¢آ¹ط·آ·ط¢آ£ط·آ¢ط¢آ¢ط·آ£ط¢آ¢ط£آ¢أ¢â€ڑآ¬ط¹â€کط·آ¢ط¢آ¬ط·آ·ط¢آ¹ط·آ¢ط¢آ©ط·آ·ط¢آ·ط·آ¢ط¢آ·ط·آ·ط¢آ¢ط·آ¢ط¢آ·ط·آ·ط¢آ·ط·آ¢ط¢آ¢ط·آ·ط¢آ¢ط·آ¢ط¢آ¢ط·آ·ط¢آ·ط·آ¢ط¢آ·ط·آ·ط¢آ¢ط·آ¢ط¢آ¢ط·آ·ط¢آ·ط·آ¢ط¢آ¢ط·آ·ط¢آ¢ط·آ¢ط¢آ¬ط·آ·ط¢آ·ط·آ¢ط¢آ·ط·آ·ط¢آ¢ط·آ¢ط¢آ·ط·آ·ط¢آ·ط·آ¢ط¢آ¢ط·آ·ط¢آ¢ط·آ¢ط¢آ·ط·آ·ط¢آ·ط·آ¢ط¢آ·ط·آ·ط¢آ¢ط·آ¢ط¢آ¢ط·آ·ط¢آ·ط·آ¢ط¢آ¢ط·آ·ط¢آ¢ط·آ¢ط¢آ¢ط·آ·ط¢آ·ط·آ¢ط¢آ·ط·آ·ط¢آ¢ط·آ¢ط¢آ·ط·آ·ط¢آ·ط·آ¢ط¢آ¢ط·آ·ط¢آ¢ط·آ¢ط¢آ¢ط·آ·ط¢آ·ط·آ¢ط¢آ·ط·آ·ط¢آ¢ط·آ¢ط¢آ¢ط·آ·ط¢آ·ط·آ¢ط¢آ¢ط·آ·ط¢آ¢ط·آ¢ط¢آ¢ط·آ·ط¢آ·ط·آ¢ط¢آ·ط·آ·ط¢آ¢ط·آ¢ط¢آ·ط·آ·ط¢آ·ط·آ¢ط¢آ¢ط·آ·ط¢آ¢ط·آ¢ط¢آ·ط·آ·ط¢آ·ط·آ¢ط¢آ·ط·آ·ط¢آ¢ط·آ¢ط¢آ¢ط·آ·ط¢آ·ط·آ¢ط¢آ¢ط·آ·ط¢آ¢ط·آ¢ط¢آ£ط·آ·ط¢آ·ط·آ¢ط¢آ·ط·آ·ط¢آ¢ط·آ¢ط¢آ·ط·آ·ط¢آ·ط·آ¢ط¢آ¢ط·آ·ط¢آ¢ط·آ¢ط¢آ¢ط·آ·ط¢آ·ط·آ¢ط¢آ·ط·آ·ط¢آ¢ط·آ¢ط¢آ¢ط·آ·ط¢آ·ط·آ¢ط¢آ¢ط·آ·ط¢آ¢ط·آ¢ط¢آ¢ط·آ·ط¢آ·ط·آ¢ط¢آ·ط·آ·ط¢آ¢ط·آ¢ط¢آ·ط·آ·ط¢آ·ط·آ¢ط¢آ¢ط·آ·ط¢آ¢ط·آ¢ط¢آ£ط·آ·ط¢آ·ط·آ¢ط¢آ·ط·آ·ط¢آ¢ط·آ¢ط¢آ¢ط·آ·ط¢آ·ط·آ¢ط¢آ¢ط·آ·ط¢آ¢ط·آ¢ط¢آ¢ط·آ·ط¢آ·ط·آ¢ط¢آ·ط·آ·ط¢آ¢ط·آ¢ط¢آ£ط·آ·ط¢آ·ط·آ¢ط¢آ¢ط·آ·ط¢آ¢ط·آ¢ط¢آ¢ط·آ·ط¢آ·ط·آ¢ط¢آ£ط·آ·ط¢آ¢ط·آ¢ط¢آ¢ط·آ·ط¢آ£ط·آ¢ط¢آ¢ط·آ£ط¢آ¢ط£آ¢أ¢â€ڑآ¬ط¹â€کط·آ¢ط¢آ¬ط·آ·ط¢آ¹ط£آ¢أ¢â€ڑآ¬ط¹آ©ط·آ·ط¢آ·ط·آ¢ط¢آ¢ط·آ·ط¢آ¢ط·آ¢ط¢آ¬ط·آ·ط¢آ·ط·آ¢ط¢آ·ط·آ·ط¢آ¢ط·آ¢ط¢آ¹ط·آ·ط¢آ£ط·آ¢ط¢آ¢ط·آ£ط¢آ¢ط£آ¢أ¢â€ڑآ¬ط¹â€کط·آ¢ط¢آ¬ط·آ·ط¢آ¹ط·آ¢ط¢آ©ط·آ·ط¢آ·ط·آ¢ط¢آ·ط·آ·ط¢آ¢ط·آ¢ط¢آ·ط·آ·ط¢آ·ط·آ¢ط¢آ¢ط·آ·ط¢آ¢ط·آ¢ط¢آ¢ط·آ·ط¢آ·ط·آ¢ط¢آ·ط·آ·ط¢آ¢ط·آ¢ط¢آ¢ط·آ·ط¢آ·ط·آ¢ط¢آ¢ط·آ·ط¢آ¢ط·آ¢ط¢آ¬ط·آ·ط¢آ·ط·آ¢ط¢آ·ط·آ·ط¢آ¢ط·آ¢ط¢آ·ط·آ·ط¢آ·ط·آ¢ط¢آ¢ط·آ·ط¢آ¢ط·آ¢ط¢آ·ط·آ·ط¢آ·ط·آ¢ط¢آ·ط·آ·ط¢آ¢ط·آ¢ط¢آ¢ط·آ·ط¢آ·ط·آ¢ط¢آ¢ط·آ·ط¢آ¢ط·آ¢ط¢آ¢ط·آ·ط¢آ·ط·آ¢ط¢آ·ط·آ·ط¢آ¢ط·آ¢ط¢آ·ط·آ·ط¢آ·ط·آ¢ط¢آ¢ط·آ·ط¢آ¢ط·آ¢ط¢آ¢ط·آ·ط¢آ·ط·آ¢ط¢آ·ط·آ·ط¢آ¢ط·آ¢ط¢آ¢ط·آ·ط¢آ·ط·آ¢ط¢آ¢ط·آ·ط¢آ¢ط·آ¢ط¢آ¢CD") |
| `usedAt` | `DateTime?` |  |
| `ipUsedFrom` | `String?` |  |
| `userAgentUsed` | `String?` |  |
| `createdAt` | `DateTime` | @default(now()) |
| `generatedBatchId` | `String` | // groups 10 codes generated together |

## Model: `MfaAttempt`
| الحقل | النوع | الوصف |
|---|---|---|
| `id` | `Int` | @id @default(autoincrement()) |
| `tenantId` | `String` | @default("default") @map("tenant_id") |
| `userId` | `Int` |  |
| `user` | `User` | @relation(fields: [userId], references: [id], onDelete: Cascade) |
| `success` | `Boolean` |  |
| `method` | `String` | // 'totp' | 'backup_code' | 'sms' | 'email' |
| `ipAddress` | `String?` |  |
| `userAgent` | `String?` |  |
| `countryCode` | `String?` | // from IP geolocation |
| `city` | `String?` |  |
| `failureReason` | `String?` | // 'invalid_code' | 'expired' | 'replay' | 'rate_limit' |
| `attemptedAt` | `DateTime` | @default(now()) |
| `sessionId` | `String?` |  |
| `deviceFingerprint` | `String?` |  |

## Model: `TrustedDevice`
| الحقل | النوع | الوصف |
|---|---|---|
| `id` | `Int` | @id @default(autoincrement()) |
| `tenantId` | `String` | @default("default") @map("tenant_id") |
| `userId` | `Int` |  |
| `user` | `User` | @relation(fields: [userId], references: [id], onDelete: Cascade) |
| `deviceFingerprint` | `String` | @unique |
| `deviceName` | `String` | // "Chrome on Windows 11" |
| `browser` | `String?` |  |
| `os` | `String?` |  |
| `ipAddress` | `String` |  |
| `countryCode` | `String?` |  |
| `city` | `String?` |  |
| `trustedAt` | `DateTime` | @default(now()) |
| `trustedUntil` | `DateTime` |  |
| `lastUsedAt` | `DateTime?` |  |
| `revokedAt` | `DateTime?` |  |
| `revokedReason` | `String?` |  |
| `revokedByUserId` | `Int?` | // self or admin |

## Model: `MfaPolicy`
| الحقل | النوع | الوصف |
|---|---|---|
| `id` | `Int` | @id @default(autoincrement()) |
| `tenantId` | `String` | @default("default") @map("tenant_id") |
| `name` | `String` |  |
| `description` | `String?` |  |
| `enabled` | `Boolean` | @default(true) |
| `requireForRoles` | `String[]` | // ['ADMIN', 'CFO', 'ACCOUNTANT'] |
| `requireForActions` | `String[]` | // ['DELETE_JE', 'POST_PAYMENT', 'CHANGE_BANK_ACCOUNT'] |
| `allowedMethods` | `String[]` | // ['TOTP', 'HARDWARE_KEY'] |
| `trustedDeviceDays` | `Int` | @default(30) |
| `sessionTimeoutMinutes` | `Int` | @default(480) // 8 hours |
| `enforceFromDate` | `DateTime` |  |
| `gracePeriodDays` | `Int` | @default(7) |
| `stepUpRequired` | `Boolean` | @default(false) |
| `stepUpAfterMinutes` | `Int` | @default(60) |
| `createdByUserId` | `Int` |  |
| `createdAt` | `DateTime` | @default(now()) |
| `updatedAt` | `DateTime` | @updatedAt |
| `users` | `User[]` |  |

## Model: `MfaRecoveryRequest`
| الحقل | النوع | الوصف |
|---|---|---|
| `id` | `Int` | @id @default(autoincrement()) |
| `tenantId` | `String` | @default("default") @map("tenant_id") |
| `userId` | `Int` |  |
| `user` | `User` | @relation(fields: [userId], references: [id]) |
| `requestedAt` | `DateTime` | @default(now()) |
| `reason` | `String` |  |
| `evidenceFileUrl` | `String?` | // ID upload |
| `ipAddress` | `String` |  |
| `status` | `String` | @default("PENDING") // PENDING | APPROVED | REJECTED | EXPIRED |
| `reviewedByUserId` | `Int?` |  |
| `reviewedAt` | `DateTime?` |  |
| `reviewNotes` | `String?` |  |
| `newSecretGenerated` | `Boolean` | @default(false) |

## Model: `MfaUsedToken`
| الحقل | النوع | الوصف |
|---|---|---|
| `id` | `Int` | @id @default(autoincrement()) |
| `tenantId` | `String` | @default("default") @map("tenant_id") |
| `userId` | `Int` |  |
| `user` | `User` | @relation(fields: [userId], references: [id], onDelete: Cascade) |
| `tokenHash` | `String` | // SHA-256 of code (for replay protection) |
| `usedAt` | `DateTime` | @default(now()) |
| `expiresAt` | `DateTime` | // 90 seconds after usedAt |

## Model: `UserPermission`
| الحقل | النوع | الوصف |
|---|---|---|
| `id` | `Int` | @id @default(autoincrement()) |
| `tenantId` | `String` | @default("default") @map("tenant_id") |
| `userId` | `Int` | @map("user_id") |
| `module` | `String` |  |
| `canView` | `Boolean` | @default(true) @map("can_view") |
| `canAdd` | `Boolean` | @default(false) @map("can_add") |
| `canEdit` | `Boolean` | @default(false) @map("can_edit") |
| `canDelete` | `Boolean` | @default(false) @map("can_delete") |
| `canPrint` | `Boolean` | @default(false) @map("can_print") |
| `user` | `User` | @relation(fields: [userId], references: [id]) |

## Model: `Category`
| الحقل | النوع | الوصف |
|---|---|---|
| `id` | `Int` | @id @default(autoincrement()) |
| `tenantId` | `String` | @default("default") @map("tenant_id") |
| `name` | `String` |  |
| `parentId` | `Int` | @default(0) @map("parent_id") |
| `description` | `String?` |  |
| `products` | `Product[]` |  |

## Model: `Unit`
| الحقل | النوع | الوصف |
|---|---|---|
| `id` | `Int` | @id @default(autoincrement()) |
| `tenantId` | `String` | @default("default") @map("tenant_id") |
| `name` | `String` |  |
| `products` | `Product[]` |  |
| `productUnits` | `ProductUnit[]` |  |

## Model: `Product`
| الحقل | النوع | الوصف |
|---|---|---|
| `id` | `Int` | @id @default(autoincrement()) |
| `tenantId` | `String` | @default("default") @map("tenant_id") |
| `name` | `String` |  |
| `barcode` | `String?` |  |
| `categoryId` | `Int?` | @map("category_id") |
| `unitId` | `Int` | @default(1) @map("unit_id") |
| `buyPrice` | `Decimal` | @default(0) @map("buy_price") |
| `sellPrice` | `Decimal` | @default(0) @map("sell_price") |
| `taxRate` | `Decimal` | @default(15) @map("tax_rate") |
| `taxType` | `String` | @default("VAT") @map("tax_type") |
| `minQuantity` | `Decimal` | @default(0) @map("min_quantity") |
| `currentStock` | `Decimal` | @default(0) @map("current_stock") |
| `description` | `String?` |  |
| `active` | `Boolean` | @default(true) |
| `createdAt` | `DateTime` | @default(now()) @map("created_at") |
| `nameEn` | `String` | @default("") @map("name_en") |
| `brandAr` | `String` | @default("") @map("brand_ar") |
| `brandEn` | `String` | @default("") @map("brand_en") |
| `sizeInfo` | `String` | @default("") @map("size_info") |
| `imagePath` | `String` | @default("") @map("image_path") |
| `sellByWeight` | `Boolean` | @default(false) @map("sell_by_weight") |
| `expiryDate` | `String?` | @map("expiry_date") |
| `binLocation` | `String?` | @map("bin_location") |
| `category` | `Category?` | @relation(fields: [categoryId], references: [id]) |
| `unit` | `Unit?` | @relation(fields: [unitId], references: [id]) |
| `salesDetails` | `SalesInvoiceDetail[]` |  |
| `purchaseDetails` | `PurchaseInvoiceDetail[]` |  |
| `purchaseOrderDetails` | `PurchaseOrderDetail[]` |  |
| `stockMovements` | `StockMovement[]` |  |
| `productStocks` | `ProductStock[]` |  |
| `batches` | `ProductBatch[]` |  |
| `finishedRecipes` | `Recipe[]` | @relation("RecipeFinishedProduct") |
| `rawRecipes` | `RecipeIngredient[]` | @relation("RecipeRawProduct") |
| `wastages` | `ManufacturingWastage[]` |  |
| `recipeByProducts` | `RecipeByProduct[]` |  |
| `salesReturnDetails` | `SalesReturnDetail[]` |  |
| `purchaseReturnDetails` | `PurchaseReturnDetail[]` |  |
| `pharmacyDrug` | `PharmacyDrug?` |  |
| `SalesOrderDetail` | `SalesOrderDetail[]` |  |
| `DeliveryNoteDetail` | `DeliveryNoteDetail[]` |  |
| `prDetails` | `PurchaseRequisitionDetail[]` |  |
| `rfqDetails` | `RequestForQuotationDetail[]` |  |
| `grnDetails` | `GoodsReceiptNoteDetail[]` |  |
| `serialNumbers` | `ProductSerialNumber[]` |  |
| `productUnits` | `ProductUnit[]` |  |
| `EngineeringChangeOrder` | `EngineeringChangeOrder[]` |  |
| `StandardCostVersion` | `StandardCostVersion[]` |  |
| `VarianceTransaction` | `VarianceTransaction[]` |  |
| `SubcontractingPO` | `SubcontractingPO[]` |  |
| `SubcontractMovement` | `SubcontractMovement[]` |  |
| `QualitySpec` | `QualitySpec?` |  |
| `QualityInspection` | `QualityInspection[]` |  |
| `variants` | `ProductVariant[]` |  |
| `hasVariants` | `Boolean` | @default(false) @map("has_variants") |
| `variantAttributeIds` | `String?` | @map("variant_attribute_ids") // JSON array |
| `PriceRule` | `PriceRule[]` |  |
| `deletedAt` | `DateTime?` | @map("deleted_at") |
| `deletedBy` | `String?` | @map("deleted_by") |

## Model: `ProductUnit`
| الحقل | النوع | الوصف |
|---|---|---|
| `id` | `Int` | @id @default(autoincrement()) |
| `tenantId` | `String` | @default("default") @map("tenant_id") |
| `productId` | `Int` | @map("product_id") |
| `unitId` | `Int` | @map("unit_id") |
| `barcode` | `String?` | @unique |
| `sellPrice` | `Decimal` | @map("sell_price") |
| `buyPrice` | `Decimal` | @default(0) @map("buy_price") |
| `factor` | `Decimal` | @default(1) @db.Decimal(20, 6) // (see field name for description) |
| `isBase` | `Boolean` | @default(false) @map("is_base") |
| `unitStock` | `Decimal` | @default(0) @map("unit_stock") @db.Decimal(20, 4) // (see field name for description) |
| `parentUnitId` | `Int?` | @map("parent_unit_id") // (see field name for description) |
| `parentQty` | `Decimal` | @default(1) @map("parent_qty") @db.Decimal(20, 4) // (see field name for description) |
| `sortOrder` | `Int` | @default(0) @map("sort_order") // (see field name for description) |
| `product` | `Product` | @relation(fields: [productId], references: [id], onDelete: Cascade) |
| `unit` | `Unit` | @relation(fields: [unitId], references: [id]) |
| `parentUnit` | `ProductUnit?` | @relation("UnitHierarchy", fields: [parentUnitId], references: [id]) |
| `childUnits` | `ProductUnit[]` | @relation("UnitHierarchy") |
| `deletedAt` | `DateTime?` | @map("deleted_at") |
| `deletedBy` | `String?` | @map("deleted_by") |

## Model: `Customer`
| الحقل | النوع | الوصف |
|---|---|---|
| `id` | `Int` | @id @default(autoincrement()) |
| `tenantId` | `String` | @default("default") @map("tenant_id") |
| `customerNo` | `String?` | @unique @map("customer_no") |
| `name` | `String` |  |
| `phone` | `String?` |  |
| `email` | `String?` |  |
| `address` | `String?` |  |
| `street` | `String?` |  |
| `buildingNumber` | `String?` | @map("building_number") |
| `district` | `String?` |  |
| `city` | `String?` |  |
| `postalCode` | `String?` | @map("postal_code") |
| `type` | `Int` | @default(0) // 0=customer, 1=supplier, 2=both |
| `balance` | `Decimal` | @default(0) |
| `creditLimit` | `Decimal` | @default(0) @map("credit_limit") @db.Decimal(20, 4) |
| `taxNumber` | `String?` | @map("tax_number") |
| `crNo` | `String?` | @map("cr_no") |
| `notes` | `String?` |  |
| `active` | `Boolean` | @default(true) |
| `status` | `String` | @default("ACTIVE") |
| `password` | `String?` | // For B2B Portal |
| `b2bEnabled` | `Boolean` | @default(false) @map("b2b_enabled") |
| `createdAt` | `DateTime` | @default(now()) @map("created_at") |
| `salesInvoices` | `SalesInvoice[]` |  |
| `purchaseInvoices` | `PurchaseInvoice[]` |  |
| `purchaseOrders` | `PurchaseOrder[]` |  |
| `installments` | `Installment[]` |  |
| `loyaltyPoints` | `LoyaltyPoint[]` |  |
| `bookings` | `Booking[]` |  |
| `lettersOfCredit` | `LetterOfCredit[]` |  |
| `customerChecks` | `CheckTransaction[]` | @relation("CheckCustomer") |
| `supplierChecks` | `CheckTransaction[]` | @relation("CheckSupplier") |
| `routeId` | `Int?` | @map("route_id") |
| `route` | `Route?` | @relation(fields: [routeId], references: [id]) |
| `salesOrders` | `SalesOrder[]` |  |
| `deliveryNotes` | `DeliveryNote[]` |  |
| `projects` | `Project[]` |  |
| `promissoryNotes` | `PromissoryNote[]` |  |
| `rfqs` | `RequestForQuotation[]` |  |
| `goodsReceipts` | `GoodsReceiptNote[]` |  |
| `leaseContracts` | `LeaseContract[]` |  |
| `purchaseReturns` | `PurchaseReturn[]` |  |
| `supplierContracts` | `SupplierContract[]` | @relation("SupplierContracts") |
| `whtTransactions` | `WHTTransaction[]` |  |
| `RentInvoice` | `RentInvoice[]` |  |
| `ECLAssessment` | `ECLAssessment[]` |  |
| `PaymentRunLine` | `PaymentRunLine[]` |  |
| `SubcontractingPO` | `SubcontractingPO[]` |  |
| `savedPaymentMethods` | `SavedPaymentMethod[]` |  |
| `dunningRuns` | `DunningRun[]` |  |
| `subscriptions` | `CustomerSubscription[]` |  |
| `emailStatementsEnabled` | `Boolean` | @default(false) |
| `statementFrequency` | `String` | @default("NEVER") // NEVER | MONTHLY | QUARTERLY | YEARLY | ON_DEMAND |
| `statementChannel` | `String` | @default("EMAIL") // EMAIL | WHATSAPP | SMS | PORTAL_ONLY | EMAIL_AND_WHATSAPP |
| `statementEmail` | `String?` | // override |
| `statementWhatsapp` | `String?` | // override |
| `statementCcEmails` | `String?` | // comma-separated |
| `statementBccEmails` | `String?` |  |
| `statementLanguage` | `String` | @default("ar") // ar | en | bilingual |
| `statementTemplateId` | `Int?` |  |
| `statementTemplate` | `StatementTemplate?` | @relation(fields: [statementTemplateId], references: [id]) |
| `statementDayOfMonth` | `Int` | @default(1) // when to send (1-28) |
| `statementSendTime` | `String` | @default("06:00") // HH:mm |
| `statementIncludeAging` | `Boolean` | @default(true) |
| `statementIncludeClosed` | `Boolean` | @default(false) |
| `statementIncludeOpenOnly` | `Boolean` | @default(false) |
| `statementWatermark` | `String?` | // PAID | OVERDUE | CONFIDENTIAL | null |
| `statementSinceLastSent` | `Boolean` | @default(false) // since last statement vs all time |
| `emailDeliveryIssue` | `String?` |  |
| `emailDeliveryIssueDate` | `DateTime?` |  |
| `emailLastBounceReason` | `String?` |  |
| `statementDispatchLogs` | `StatementDispatchLog[]` |  |
| `statementAccessLogs` | `StatementAccessLog[]` |  |
| `dunningCurrentLevel` | `Int` | @default(0) |
| `dunningLastRunAt` | `DateTime?` |  |
| `dunningSnoozeUntil` | `DateTime?` |  |
| `dunningSnoozeReason` | `String?` |  |
| `dunningSnoozedByUserId` | `String?` |  |
| `dunningPaused` | `Boolean` | @default(false) |
| `dunningPauseReason` | `String?` |  |
| `creditHold` | `Boolean` | @default(false) |
| `creditHoldReason` | `String?` |  |
| `creditHoldDate` | `DateTime?` |  |
| `creditHoldByUserId` | `String?` |  |
| `creditHoldExpiresAt` | `DateTime?` |  |
| `legalActionInProgress` | `Boolean` | @default(false) |
| `legalCaseId` | `Int?` |  |
| `inCollectionAgency` | `Boolean` | @default(false) |
| `dunningPreferredChannel` | `String` | @default("EMAIL") |
| `dunningOptOutChannels` | `String[]` | // ['SMS', 'WHATSAPP'] |
| `promisesToPay` | `PromiseToPay[]` |  |
| `campaigns` | `DunningCampaign[]` |  |
| `letters` | `DunningLetter[]` |  |
| `collectionAssignments` | `CollectionAssignment[]` |  |
| `creditActions` | `CustomerCreditAction[]` |  |
| `SupplierBankAccount` | `SupplierBankAccount[]` |  |
| `SalesContract` | `SalesContract[]` |  |
| `IfrsLeaseContract` | `IfrsLeaseContract[]` |  |
| `FixedAsset` | `FixedAsset[]` |  |
| `PriceList` | `PriceList[]` |  |
| `Appointment` | `Appointment[]` |  |
| `ClinicPrescription` | `ClinicPrescription[]` |  |
| `LabOrder` | `LabOrder[]` |  |
| `isForeignVendor` | `Boolean` | @default(false) @map("is_foreign_vendor") |
| `whtCountryCode` | `String?` | @map("wht_country_code") |
| `whtTaxResidencyCert` | `String?` | @map("wht_tax_residency_cert") |
| `whtTaxResidencyExpiry` | `DateTime?` | @map("wht_tax_residency_expiry") |
| `defaultWhtRuleId` | `Int?` | @map("default_wht_rule_id") |
| `deletedAt` | `DateTime?` | @map("deleted_at") |
| `deletedBy` | `String?` | @map("deleted_by") |

## Model: `Stock`
| الحقل | النوع | الوصف |
|---|---|---|
| `id` | `Int` | @id @default(autoincrement()) |
| `tenantId` | `String` | @default("default") @map("tenant_id") |
| `name` | `String` |  |
| `address` | `String?` |  |
| `active` | `Boolean` | @default(true) |
| `salesInvoices` | `SalesInvoice[]` |  |
| `purchaseInvoices` | `PurchaseInvoice[]` |  |
| `purchaseOrders` | `PurchaseOrder[]` |  |
| `stockMovements` | `StockMovement[]` |  |
| `productStocks` | `ProductStock[]` |  |
| `warehouseZones` | `WarehouseZone[]` |  |
| `branch` | `Branch?` | @relation(fields: [branchId], references: [id]) |
| `branchId` | `Int?` | @map("branch_id") |
| `goodsReceipts` | `GoodsReceiptNote[]` |  |
| `ProductSerialNumber` | `ProductSerialNumber[]` |  |

## Model: `ProductStock`
| الحقل | النوع | الوصف |
|---|---|---|
| `id` | `Int` | @id @default(autoincrement()) |
| `tenantId` | `String` | @default("default") @map("tenant_id") |
| `productId` | `Int` | @map("product_id") |
| `variantId` | `Int?` | @map("variant_id") |
| `stockId` | `Int` | @map("stock_id") |
| `binId` | `Int?` | @map("bin_id") |
| `quantity` | `Decimal` | @default(0) |
| `location` | `String?` | @map("location") |
| `createdAt` | `DateTime` | @default(now()) @map("created_at") |
| `updatedAt` | `DateTime` | @updatedAt @map("updated_at") |
| `product` | `Product` | @relation(fields: [productId], references: [id], onDelete: Cascade) |
| `variant` | `ProductVariant?` | @relation(fields: [variantId], references: [id]) |
| `stock` | `Stock` | @relation(fields: [stockId], references: [id], onDelete: Cascade) |
| `bin` | `WarehouseBin?` | @relation(fields: [binId], references: [id]) |

## Model: `SalesInvoice`
| الحقل | النوع | الوصف |
|---|---|---|
| `id` | `Int` | @id @default(autoincrement()) |
| `tenantId` | `String` | @default("default") @map("tenant_id") |
| `invoiceNo` | `Int` | @map("invoice_no") |
| `date` | `DateTime` | @default(now()) |
| `customerId` | `Int?` | @map("customer_id") |
| `stockId` | `Int` | @default(1) @map("stock_id") |
| `subtotal` | `Decimal` | @default(0) |
| `discountRate` | `Decimal` | @default(0) @map("discount_rate") |
| `discountValue` | `Decimal` | @default(0) @map("discount_value") |
| `taxValue` | `Decimal` | @default(0) @map("tax_value") |
| `total` | `Decimal` | @default(0) |
| `paid` | `Decimal` | @default(0) @db.Decimal(20, 4) |
| `remaining` | `Decimal` | @default(0) @db.Decimal(20, 4) |
| `paymentType` | `String` | @default("cash") @map("payment_type") |
| `splitCash` | `Decimal?` | @default(0) @map("split_cash") @db.Decimal(20, 4) |
| `splitCard` | `Decimal?` | @default(0) @map("split_card") @db.Decimal(20, 4) |
| `status` | `String` | @default("completed") |
| `userId` | `Int?` | @map("user_id") |
| `notes` | `String?` |  |
| `taxType` | `String?` | @default("VAT") @map("tax_type") |
| `currencyId` | `Int?` | @map("currency_id") |
| `exchangeRate` | `Decimal?` | @default(1.0) @map("exchange_rate") @db.Decimal(18, 8) |
| `currency` | `Currency?` | @relation(fields: [currencyId], references: [id]) |
| `zatcaStatus` | `String?` | @default("pending") @map("zatca_status") |
| `zatcaHash` | `String?` | @map("zatca_hash") |
| `zatcaQr` | `String?` | @map("zatca_qr") |
| `zatcaResponse` | `String?` | @map("zatca_response") |
| `zatcaXml` | `String?` | @map("zatca_xml") |
| `salesRepId` | `Int?` | @map("sales_rep_id") |
| `docType` | `String?` | @default("invoice") @map("doc_type") // invoice, simplified_debit, standard_debit |
| `originalInvoiceId` | `Int?` | @map("original_invoice_id") |
| `customer` | `Customer?` | @relation(fields: [customerId], references: [id]) |
| `stock` | `Stock?` | @relation(fields: [stockId], references: [id]) |
| `salesRep` | `Employee?` | @relation("SalesInvoiceRep", fields: [salesRepId], references: [id]) |
| `user` | `User?` | @relation(fields: [userId], references: [id]) |
| `details` | `SalesInvoiceDetail[]` |  |
| `branchId` | `Int?` | @map("branch_id") |
| `branch` | `Branch?` | @relation(fields: [branchId], references: [id]) |
| `shift` | `Shift?` | @relation(fields: [shiftId], references: [id]) |
| `shiftId` | `Int?` | @map("shift_id") |
| `costCenterId` | `Int?` | @map("cost_center_id") |
| `costCenter` | `CostCenter?` | @relation(fields: [costCenterId], references: [id]) |
| `payments` | `PaymentTransaction[]` |  |
| `subscriptionInvoices` | `SubscriptionInvoice[]` |  |
| `deletedAt` | `DateTime?` | @map("deleted_at") |
| `deletedBy` | `String?` | @map("deleted_by") |
| `zatcaUuid` | `String?` | @map("zatca_uuid") |
| `zatcaIcv` | `Int?` | @map("zatca_icv") |
| `zatcaPih` | `String?` | @map("zatca_pih") |
| `zatcaSignedXml` | `String?` | @map("zatca_signed_xml") @db.Text |
| `zatcaReportedAt` | `DateTime?` | @map("zatca_reported_at") |
| `cleared` | `Boolean` | @default(false) @map("zatca_cleared") |
| `clearedAt` | `DateTime?` | @map("zatca_cleared_at") |
| `clearanceUuid` | `String?` | @map("zatca_clearance_uuid") |

## Model: `SalesInvoiceDetail`
| الحقل | النوع | الوصف |
|---|---|---|
| `id` | `Int` | @id @default(autoincrement()) |
| `tenantId` | `String` | @default("default") @map("tenant_id") |
| `invoiceId` | `Int` | @map("invoice_id") |
| `productId` | `Int` | @map("product_id") |
| `variantId` | `Int?` | @map("variant_id") |
| `productName` | `String?` | @map("product_name") |
| `quantity` | `Decimal` | @default(1) |
| `price` | `Decimal` | @default(0) |
| `discountRate` | `Decimal` | @default(0) @map("discount_rate") |
| `discountValue` | `Decimal` | @default(0) @map("discount_value") |
| `taxRate` | `Decimal` | @default(15) @map("tax_rate") |
| `taxValue` | `Decimal` | @default(0) @map("tax_value") |
| `total` | `Decimal` | @default(0) |
| `invoice` | `SalesInvoice` | @relation(fields: [invoiceId], references: [id], onDelete: Cascade) |
| `product` | `Product` | @relation(fields: [productId], references: [id]) |
| `variant` | `ProductVariant?` | @relation(fields: [variantId], references: [id]) |
| `batch` | `ProductBatch?` | @relation(fields: [batchId], references: [id]) |
| `batchId` | `Int?` | @map("batch_id") |
| `deletedAt` | `DateTime?` | // P1.2 soft-delete ط·آ·ط¢آ·ط·آ¢ط¢آ·ط·آ·ط¢آ¢ط·آ¢ط¢آ·ط·آ·ط¢آ·ط·آ¢ط¢آ¢ط·آ·ط¢آ¢ط·آ¢ط¢آ·ط·آ·ط¢آ·ط·آ¢ط¢آ·ط·آ·ط¢آ¢ط·آ¢ط¢آ¢ط·آ·ط¢آ·ط·آ¢ط¢آ¢ط·آ·ط¢آ¢ط·آ¢ط¢آ£ط·آ·ط¢آ·ط·آ¢ط¢آ·ط·آ·ط¢آ¢ط·آ¢ط¢آ·ط·آ·ط¢آ·ط·آ¢ط¢آ¢ط·آ·ط¢آ¢ط·آ¢ط¢آ¢ط·آ·ط¢آ·ط·آ¢ط¢آ·ط·آ·ط¢آ¢ط·آ¢ط¢آ¢ط·آ·ط¢آ·ط·آ¢ط¢آ¢ط·آ·ط¢آ¢ط·آ¢ط¢آ¢ط·آ·ط¢آ·ط·آ¢ط¢آ·ط·آ·ط¢آ¢ط·آ¢ط¢آ·ط·آ·ط¢آ·ط·آ¢ط¢آ¢ط·آ·ط¢آ¢ط·آ¢ط¢آ£ط·آ·ط¢آ·ط·آ¢ط¢آ·ط·آ·ط¢آ¢ط·آ¢ط¢آ¢ط·آ·ط¢آ·ط·آ¢ط¢آ¢ط·آ·ط¢آ¢ط·آ¢ط¢آ¢ط·آ·ط¢آ·ط·آ¢ط¢آ·ط·آ·ط¢آ¢ط·آ¢ط¢آ£ط·آ·ط¢آ·ط·آ¢ط¢آ¢ط·آ·ط¢آ¢ط·آ¢ط¢آ¢ط·آ·ط¢آ·ط·آ¢ط¢آ£ط·آ·ط¢آ¢ط·آ¢ط¢آ¢ط·آ·ط¢آ£ط·آ¢ط¢آ¢ط·آ£ط¢آ¢ط£آ¢أ¢â€ڑآ¬ط¹â€کط·آ¢ط¢آ¬ط·آ·ط¢آ¹ط£آ¢أ¢â€ڑآ¬ط¹آ©ط·آ·ط¢آ·ط·آ¢ط¢آ¢ط·آ·ط¢آ¢ط·آ¢ط¢آ¬ط·آ·ط¢آ·ط·آ¢ط¢آ·ط·آ·ط¢آ¢ط·آ¢ط¢آ¹ط·آ·ط¢آ£ط·آ¢ط¢آ¢ط·آ£ط¢آ¢ط£آ¢أ¢â€ڑآ¬ط¹â€کط·آ¢ط¢آ¬ط·آ·ط¢آ¹ط·آ¢ط¢آ©ط·آ·ط¢آ·ط·آ¢ط¢آ·ط·آ·ط¢آ¢ط·آ¢ط¢آ·ط·آ·ط¢آ·ط·آ¢ط¢آ¢ط·آ·ط¢آ¢ط·آ¢ط¢آ¢ط·آ·ط¢آ·ط·آ¢ط¢آ·ط·آ·ط¢آ¢ط·آ¢ط¢آ¢ط·آ·ط¢آ·ط·آ¢ط¢آ¢ط·آ·ط¢آ¢ط·آ¢ط¢آ¬ط·آ·ط¢آ·ط·آ¢ط¢آ·ط·آ·ط¢آ¢ط·آ¢ط¢آ·ط·آ·ط¢آ·ط·آ¢ط¢آ¢ط·آ·ط¢آ¢ط·آ¢ط¢آ£ط·آ·ط¢آ·ط·آ¢ط¢آ·ط·آ·ط¢آ¢ط·آ¢ط¢آ¢ط·آ·ط¢آ·ط·آ¢ط¢آ¢ط·آ·ط¢آ¢ط·آ¢ط¢آ¢ط·آ·ط¢آ·ط·آ¢ط¢آ·ط·آ·ط¢آ¢ط·آ¢ط¢آ£ط·آ·ط¢آ·ط·آ¢ط¢آ¢ط·آ·ط¢آ¢ط·آ¢ط¢آ¢ط·آ·ط¢آ·ط·آ¢ط¢آ£ط·آ·ط¢آ¢ط·آ¢ط¢آ¢ط·آ·ط¢آ£ط·آ¢ط¢آ¢ط·آ£ط¢آ¢ط£آ¢أ¢â‚¬ع‘ط¢آ¬ط·آ¹أ¢â‚¬ع©ط·آ·ط¢آ¢ط·آ¢ط¢آ¬ط·آ·ط¢آ·ط·آ¢ط¢آ¹ط·آ£ط¢آ¢ط£آ¢أ¢â‚¬ع‘ط¢آ¬ط·آ¹ط¢آ©ط·آ·ط¢آ·ط·آ¢ط¢آ·ط·آ·ط¢آ¢ط·آ¢ط¢آ¢ط·آ·ط¢آ·ط·آ¢ط¢آ¢ط·آ·ط¢آ¢ط·آ¢ط¢آ¬ط·آ·ط¢آ·ط·آ¢ط¢آ·ط·آ·ط¢آ¢ط·آ¢ط¢آ£ط·آ·ط¢آ·ط·آ¢ط¢آ¢ط·آ·ط¢آ¢ط·آ¢ط¢آ¢ط·آ·ط¢آ·ط·آ¢ط¢آ£ط·آ·ط¢آ¢ط·آ¢ط¢آ¢ط·آ·ط¢آ£ط·آ¢ط¢آ¢ط·آ£ط¢آ¢ط£آ¢أ¢â€ڑآ¬ط¹â€کط·آ¢ط¢آ¬ط·آ·ط¢آ¹ط£آ¢أ¢â€ڑآ¬ط¹آ©ط·آ·ط¢آ·ط·آ¢ط¢آ¢ط·آ·ط¢آ¢ط·آ¢ط¢آ¬ط·آ·ط¢آ·ط·آ¢ط¢آ·ط·آ·ط¢آ¢ط·آ¢ط¢آ¥ط·آ·ط¢آ£ط·آ¢ط¢آ¢ط·آ£ط¢آ¢ط£آ¢أ¢â€ڑآ¬ط¹â€کط·آ¢ط¢آ¬ط·آ£ط¢آ¢ط£آ¢أ¢â€ڑآ¬أ¢â‚¬ع†ط·آ¢ط¢آ¢ do not use hard DELETE |

## Model: `SalesReturn`
| الحقل | النوع | الوصف |
|---|---|---|
| `id` | `Int` | @id @default(autoincrement()) |
| `tenantId` | `String` | @default("default") @map("tenant_id") |
| `returnNo` | `Int` | @map("return_no") |
| `originalInvoiceId` | `Int?` | @map("original_invoice_id") |
| `date` | `DateTime` | @default(now()) |
| `customerId` | `Int?` | @map("customer_id") |
| `subtotal` | `Decimal` | @default(0) |
| `taxValue` | `Decimal` | @default(0) @map("tax_value") |
| `total` | `Decimal` | @default(0) |
| `userId` | `Int?` | @map("user_id") |
| `notes` | `String?` |  |
| `destinationStockId` | `Int?` | @map("destination_stock_id") |
| `restockingFee` | `Decimal` | @default(0) @map("restocking_fee") |
| `zatcaStatus` | `String?` | @default("pending") @map("zatca_status") |
| `zatcaHash` | `String?` | @map("zatca_hash") |
| `zatcaQr` | `String?` | @map("zatca_qr") |
| `zatcaResponse` | `String?` | @map("zatca_response") |
| `zatcaXml` | `String?` | @map("zatca_xml") |
| `status` | `String` | @default("REQUESTED") // REQUESTED, APPROVED, RECEIVED, INSPECTED, REFUNDED, REJECTED |
| `branch` | `Branch?` | @relation(fields: [branchId], references: [id]) |
| `shift` | `Shift?` | @relation(fields: [shiftId], references: [id]) |
| `branchId` | `Int?` | @map("branch_id") |
| `shiftId` | `Int?` | @map("shift_id") |
| `details` | `SalesReturnDetail[]` |  |
| `deletedAt` | `DateTime?` | @map("deleted_at") |
| `deletedBy` | `String?` | @map("deleted_by") |

## Model: `SalesReturnDetail`
| الحقل | النوع | الوصف |
|---|---|---|
| `id` | `Int` | @id @default(autoincrement()) |
| `tenantId` | `String` | @default("default") @map("tenant_id") |
| `returnId` | `Int` | @map("return_id") |
| `productId` | `Int` | @map("product_id") |
| `productName` | `String?` | @map("product_name") |
| `quantity` | `Decimal` | @default(1) |
| `price` | `Decimal` | @default(0) |
| `discountRate` | `Decimal` | @default(0) @map("discount_rate") |
| `discountValue` | `Decimal` | @default(0) @map("discount_value") |
| `taxRate` | `Decimal` | @default(15) @map("tax_rate") |
| `taxValue` | `Decimal` | @default(0) @map("tax_value") |
| `total` | `Decimal` | @default(0) |
| `reason` | `String?` |  |
| `condition` | `String?` | // good, repairable, scrap |
| `return` | `SalesReturn` | @relation(fields: [returnId], references: [id], onDelete: Cascade) |
| `product` | `Product` | @relation(fields: [productId], references: [id]) |

## Model: `PurchaseOrder`
| الحقل | النوع | الوصف |
|---|---|---|
| `id` | `Int` | @id @default(autoincrement()) |
| `tenantId` | `String` | @default("default") @map("tenant_id") |
| `orderNo` | `Int` | @map("order_no") |
| `date` | `DateTime` | @default(now()) |
| `supplierId` | `Int?` | @map("supplier_id") |
| `stockId` | `Int` | @default(1) @map("stock_id") |
| `subtotal` | `Decimal` | @default(0) |
| `taxValue` | `Decimal` | @default(0) @map("tax_value") |
| `total` | `Decimal` | @default(0) |
| `status` | `String` | @default("pending") // pending, approved, rejected, completed |
| `approvedBy` | `Int?` | @map("approved_by") |
| `userId` | `Int?` | @map("user_id") |
| `branchId` | `Int?` | @map("branch_id") |
| `notes` | `String?` |  |
| `isForeign` | `Boolean` | @default(false) @map("is_foreign") |
| `letterOfCreditId` | `Int?` | @map("letter_of_credit_id") |
| `salesOrderId` | `Int?` | @map("sales_order_id") |
| `supplier` | `Customer?` | @relation(fields: [supplierId], references: [id]) |
| `salesOrder` | `SalesOrder?` | @relation(fields: [salesOrderId], references: [id]) |
| `stock` | `Stock?` | @relation(fields: [stockId], references: [id]) |
| `user` | `User?` | @relation(name: "PurchaseOrderCreator", fields: [userId], references: [id]) |
| `approver` | `User?` | @relation(name: "PurchaseOrderApprover", fields: [approvedBy], references: [id]) |
| `branch` | `Branch?` | @relation(fields: [branchId], references: [id]) |
| `details` | `PurchaseOrderDetail[]` |  |
| `letterOfCredit` | `LetterOfCredit?` | @relation(fields: [letterOfCreditId], references: [id]) |
| `landedCosts` | `LandedCost[]` |  |
| `goodsReceipts` | `GoodsReceiptNote[]` |  |
| `ThreeWayMatch` | `ThreeWayMatch[]` |  |
| `deletedAt` | `DateTime?` | // P1.2 soft-delete ط·آ·ط¢آ·ط·آ¢ط¢آ·ط·آ·ط¢آ¢ط·آ¢ط¢آ·ط·آ·ط¢آ·ط·آ¢ط¢آ¢ط·آ·ط¢آ¢ط·آ¢ط¢آ·ط·آ·ط¢آ·ط·آ¢ط¢آ·ط·آ·ط¢آ¢ط·آ¢ط¢آ¢ط·آ·ط¢آ·ط·آ¢ط¢آ¢ط·آ·ط¢آ¢ط·آ¢ط¢آ£ط·آ·ط¢آ·ط·آ¢ط¢آ·ط·آ·ط¢آ¢ط·آ¢ط¢آ·ط·آ·ط¢آ·ط·آ¢ط¢آ¢ط·آ·ط¢آ¢ط·آ¢ط¢آ¢ط·آ·ط¢آ·ط·آ¢ط¢آ·ط·آ·ط¢آ¢ط·آ¢ط¢آ¢ط·آ·ط¢آ·ط·آ¢ط¢آ¢ط·آ·ط¢آ¢ط·آ¢ط¢آ¢ط·آ·ط¢آ·ط·آ¢ط¢آ·ط·آ·ط¢آ¢ط·آ¢ط¢آ·ط·آ·ط¢آ·ط·آ¢ط¢آ¢ط·آ·ط¢آ¢ط·آ¢ط¢آ£ط·آ·ط¢آ·ط·آ¢ط¢آ·ط·آ·ط¢آ¢ط·آ¢ط¢آ¢ط·آ·ط¢آ·ط·آ¢ط¢آ¢ط·آ·ط¢آ¢ط·آ¢ط¢آ¢ط·آ·ط¢آ·ط·آ¢ط¢آ·ط·آ·ط¢آ¢ط·آ¢ط¢آ£ط·آ·ط¢آ·ط·آ¢ط¢آ¢ط·آ·ط¢آ¢ط·آ¢ط¢آ¢ط·آ·ط¢آ·ط·آ¢ط¢آ£ط·آ·ط¢آ¢ط·آ¢ط¢آ¢ط·آ·ط¢آ£ط·آ¢ط¢آ¢ط·آ£ط¢آ¢ط£آ¢أ¢â€ڑآ¬ط¹â€کط·آ¢ط¢آ¬ط·آ·ط¢آ¹ط£آ¢أ¢â€ڑآ¬ط¹آ©ط·آ·ط¢آ·ط·آ¢ط¢آ¢ط·آ·ط¢آ¢ط·آ¢ط¢آ¬ط·آ·ط¢آ·ط·آ¢ط¢آ·ط·آ·ط¢آ¢ط·آ¢ط¢آ¹ط·آ·ط¢آ£ط·آ¢ط¢آ¢ط·آ£ط¢آ¢ط£آ¢أ¢â€ڑآ¬ط¹â€کط·آ¢ط¢آ¬ط·آ·ط¢آ¹ط·آ¢ط¢آ©ط·آ·ط¢آ·ط·آ¢ط¢آ·ط·آ·ط¢آ¢ط·آ¢ط¢آ·ط·آ·ط¢آ·ط·آ¢ط¢آ¢ط·آ·ط¢آ¢ط·آ¢ط¢آ¢ط·آ·ط¢آ·ط·آ¢ط¢آ·ط·آ·ط¢آ¢ط·آ¢ط¢آ¢ط·آ·ط¢آ·ط·آ¢ط¢آ¢ط·آ·ط¢آ¢ط·آ¢ط¢آ¬ط·آ·ط¢آ·ط·آ¢ط¢آ·ط·آ·ط¢آ¢ط·آ¢ط¢آ·ط·آ·ط¢آ·ط·آ¢ط¢آ¢ط·آ·ط¢آ¢ط·آ¢ط¢آ£ط·آ·ط¢آ·ط·آ¢ط¢آ·ط·آ·ط¢آ¢ط·آ¢ط¢آ¢ط·آ·ط¢آ·ط·آ¢ط¢آ¢ط·آ·ط¢آ¢ط·آ¢ط¢آ¢ط·آ·ط¢آ·ط·آ¢ط¢آ·ط·آ·ط¢آ¢ط·آ¢ط¢آ£ط·آ·ط¢آ·ط·آ¢ط¢آ¢ط·آ·ط¢آ¢ط·آ¢ط¢آ¢ط·آ·ط¢آ·ط·آ¢ط¢آ£ط·آ·ط¢آ¢ط·آ¢ط¢آ¢ط·آ·ط¢آ£ط·آ¢ط¢آ¢ط·آ£ط¢آ¢ط£آ¢أ¢â‚¬ع‘ط¢آ¬ط·آ¹أ¢â‚¬ع©ط·آ·ط¢آ¢ط·آ¢ط¢آ¬ط·آ·ط¢آ·ط·آ¢ط¢آ¹ط·آ£ط¢آ¢ط£آ¢أ¢â‚¬ع‘ط¢آ¬ط·آ¹ط¢آ©ط·آ·ط¢آ·ط·آ¢ط¢آ·ط·آ·ط¢آ¢ط·آ¢ط¢آ¢ط·آ·ط¢آ·ط·آ¢ط¢آ¢ط·آ·ط¢آ¢ط·آ¢ط¢آ¬ط·آ·ط¢آ·ط·آ¢ط¢آ·ط·آ·ط¢آ¢ط·آ¢ط¢آ£ط·آ·ط¢آ·ط·آ¢ط¢آ¢ط·آ·ط¢آ¢ط·آ¢ط¢آ¢ط·آ·ط¢آ·ط·آ¢ط¢آ£ط·آ·ط¢آ¢ط·آ¢ط¢آ¢ط·آ·ط¢آ£ط·آ¢ط¢آ¢ط·آ£ط¢آ¢ط£آ¢أ¢â€ڑآ¬ط¹â€کط·آ¢ط¢آ¬ط·آ·ط¢آ¹ط£آ¢أ¢â€ڑآ¬ط¹آ©ط·آ·ط¢آ·ط·آ¢ط¢آ¢ط·آ·ط¢آ¢ط·آ¢ط¢آ¬ط·آ·ط¢آ·ط·آ¢ط¢آ·ط·آ·ط¢آ¢ط·آ¢ط¢آ¥ط·آ·ط¢آ£ط·آ¢ط¢آ¢ط·آ£ط¢آ¢ط£آ¢أ¢â€ڑآ¬ط¹â€کط·آ¢ط¢آ¬ط·آ£ط¢آ¢ط£آ¢أ¢â€ڑآ¬أ¢â‚¬ع†ط·آ¢ط¢آ¢ do not use hard DELETE |
| `promisedDate` | `DateTime?` |  |

## Model: `PurchaseOrderDetail`
| الحقل | النوع | الوصف |
|---|---|---|
| `id` | `Int` | @id @default(autoincrement()) |
| `tenantId` | `String` | @default("default") @map("tenant_id") |
| `orderId` | `Int` | @map("order_id") |
| `productId` | `Int` | @map("product_id") |
| `productName` | `String?` | @map("product_name") |
| `quantity` | `Decimal` | @default(1) |
| `price` | `Decimal` | @default(0) |
| `discountRate` | `Decimal` | @default(0) @map("discount_rate") |
| `discountValue` | `Decimal` | @default(0) @map("discount_value") |
| `taxRate` | `Decimal` | @default(15) @map("tax_rate") |
| `taxValue` | `Decimal` | @default(0) @map("tax_value") |
| `total` | `Decimal` | @default(0) |
| `order` | `PurchaseOrder` | @relation(fields: [orderId], references: [id], onDelete: Cascade) |
| `product` | `Product` | @relation(fields: [productId], references: [id]) |
| `deletedAt` | `DateTime?` | // P1.2 soft-delete ط·آ·ط¢آ·ط·آ¢ط¢آ·ط·آ·ط¢آ¢ط·آ¢ط¢آ·ط·آ·ط¢آ·ط·آ¢ط¢آ¢ط·آ·ط¢آ¢ط·آ¢ط¢آ·ط·آ·ط¢آ·ط·آ¢ط¢آ·ط·آ·ط¢آ¢ط·آ¢ط¢آ¢ط·آ·ط¢آ·ط·آ¢ط¢آ¢ط·آ·ط¢آ¢ط·آ¢ط¢آ£ط·آ·ط¢آ·ط·آ¢ط¢آ·ط·آ·ط¢آ¢ط·آ¢ط¢آ·ط·آ·ط¢آ·ط·آ¢ط¢آ¢ط·آ·ط¢آ¢ط·آ¢ط¢آ¢ط·آ·ط¢آ·ط·آ¢ط¢آ·ط·آ·ط¢آ¢ط·آ¢ط¢آ¢ط·آ·ط¢آ·ط·آ¢ط¢آ¢ط·آ·ط¢آ¢ط·آ¢ط¢آ¢ط·آ·ط¢آ·ط·آ¢ط¢آ·ط·آ·ط¢آ¢ط·آ¢ط¢آ·ط·آ·ط¢آ·ط·آ¢ط¢آ¢ط·آ·ط¢آ¢ط·آ¢ط¢آ£ط·آ·ط¢آ·ط·آ¢ط¢آ·ط·آ·ط¢آ¢ط·آ¢ط¢آ¢ط·آ·ط¢آ·ط·آ¢ط¢آ¢ط·آ·ط¢آ¢ط·آ¢ط¢آ¢ط·آ·ط¢آ·ط·آ¢ط¢آ·ط·آ·ط¢آ¢ط·آ¢ط¢آ£ط·آ·ط¢آ·ط·آ¢ط¢آ¢ط·آ·ط¢آ¢ط·آ¢ط¢آ¢ط·آ·ط¢آ·ط·آ¢ط¢آ£ط·آ·ط¢آ¢ط·آ¢ط¢آ¢ط·آ·ط¢آ£ط·آ¢ط¢آ¢ط·آ£ط¢آ¢ط£آ¢أ¢â€ڑآ¬ط¹â€کط·آ¢ط¢آ¬ط·آ·ط¢آ¹ط£آ¢أ¢â€ڑآ¬ط¹آ©ط·آ·ط¢آ·ط·آ¢ط¢آ¢ط·آ·ط¢آ¢ط·آ¢ط¢آ¬ط·آ·ط¢آ·ط·آ¢ط¢آ·ط·آ·ط¢آ¢ط·آ¢ط¢آ¹ط·آ·ط¢آ£ط·آ¢ط¢آ¢ط·آ£ط¢آ¢ط£آ¢أ¢â€ڑآ¬ط¹â€کط·آ¢ط¢آ¬ط·آ·ط¢آ¹ط·آ¢ط¢آ©ط·آ·ط¢آ·ط·آ¢ط¢آ·ط·آ·ط¢آ¢ط·آ¢ط¢آ·ط·آ·ط¢آ·ط·آ¢ط¢آ¢ط·آ·ط¢آ¢ط·آ¢ط¢آ¢ط·آ·ط¢آ·ط·آ¢ط¢آ·ط·آ·ط¢آ¢ط·آ¢ط¢آ¢ط·آ·ط¢آ·ط·آ¢ط¢آ¢ط·آ·ط¢آ¢ط·آ¢ط¢آ¬ط·آ·ط¢آ·ط·آ¢ط¢آ·ط·آ·ط¢آ¢ط·آ¢ط¢آ·ط·آ·ط¢آ·ط·آ¢ط¢آ¢ط·آ·ط¢آ¢ط·آ¢ط¢آ£ط·آ·ط¢آ·ط·آ¢ط¢آ·ط·آ·ط¢آ¢ط·آ¢ط¢آ¢ط·آ·ط¢آ·ط·آ¢ط¢آ¢ط·آ·ط¢آ¢ط·آ¢ط¢آ¢ط·آ·ط¢آ·ط·آ¢ط¢آ·ط·آ·ط¢آ¢ط·آ¢ط¢آ£ط·آ·ط¢آ·ط·آ¢ط¢آ¢ط·آ·ط¢آ¢ط·آ¢ط¢آ¢ط·آ·ط¢آ·ط·آ¢ط¢آ£ط·آ·ط¢آ¢ط·آ¢ط¢آ¢ط·آ·ط¢آ£ط·آ¢ط¢آ¢ط·آ£ط¢آ¢ط£آ¢أ¢â‚¬ع‘ط¢آ¬ط·آ¹أ¢â‚¬ع©ط·آ·ط¢آ¢ط·آ¢ط¢آ¬ط·آ·ط¢آ·ط·آ¢ط¢آ¹ط·آ£ط¢آ¢ط£آ¢أ¢â‚¬ع‘ط¢آ¬ط·آ¹ط¢آ©ط·آ·ط¢آ·ط·آ¢ط¢آ·ط·آ·ط¢آ¢ط·آ¢ط¢آ¢ط·آ·ط¢آ·ط·آ¢ط¢آ¢ط·آ·ط¢آ¢ط·آ¢ط¢آ¬ط·آ·ط¢آ·ط·آ¢ط¢آ·ط·آ·ط¢آ¢ط·آ¢ط¢آ£ط·آ·ط¢آ·ط·آ¢ط¢آ¢ط·آ·ط¢آ¢ط·آ¢ط¢آ¢ط·آ·ط¢آ·ط·آ¢ط¢آ£ط·آ·ط¢آ¢ط·آ¢ط¢آ¢ط·آ·ط¢آ£ط·آ¢ط¢آ¢ط·آ£ط¢آ¢ط£آ¢أ¢â€ڑآ¬ط¹â€کط·آ¢ط¢آ¬ط·آ·ط¢آ¹ط£آ¢أ¢â€ڑآ¬ط¹آ©ط·آ·ط¢آ·ط·آ¢ط¢آ¢ط·آ·ط¢آ¢ط·آ¢ط¢آ¬ط·آ·ط¢آ·ط·آ¢ط¢آ·ط·آ·ط¢آ¢ط·آ¢ط¢آ¥ط·آ·ط¢آ£ط·آ¢ط¢آ¢ط·آ£ط¢آ¢ط£آ¢أ¢â€ڑآ¬ط¹â€کط·آ¢ط¢آ¬ط·آ£ط¢آ¢ط£آ¢أ¢â€ڑآ¬أ¢â‚¬ع†ط·آ¢ط¢آ¢ do not use hard DELETE |

## Model: `PurchaseInvoice`
| الحقل | النوع | الوصف |
|---|---|---|
| `id` | `Int` | @id @default(autoincrement()) |
| `tenantId` | `String` | @default("default") @map("tenant_id") |
| `invoiceNo` | `Int` | @map("invoice_no") |
| `isManual` | `Boolean` | @default(false) @map("is_manual") |
| `date` | `DateTime` | @default(now()) |
| `supplierId` | `Int?` | @map("supplier_id") |
| `stockId` | `Int` | @default(1) @map("stock_id") |
| `subtotal` | `Decimal` | @default(0) |
| `discountRate` | `Decimal` | @default(0) @map("discount_rate") |
| `discountValue` | `Decimal` | @default(0) @map("discount_value") |
| `taxValue` | `Decimal` | @default(0) @map("tax_value") |
| `total` | `Decimal` | @default(0) |
| `paid` | `Decimal` | @default(0) @db.Decimal(20, 4) |
| `remaining` | `Decimal` | @default(0) @db.Decimal(20, 4) |
| `supplierInvoiceNo` | `String?` | @map("supplier_invoice_no") |
| `purchaseOrderId` | `Int?` | @map("purchase_order_id") |
| `ppvAmount` | `Decimal` | @default(0) @map("ppv_amount") @db.Decimal(20, 4) |
| `paymentType` | `String` | @default("cash") @map("payment_type") |
| `status` | `String` | @default("completed") |
| `receiptStatus` | `String` | @default("received") @map("receipt_status") |
| `userId` | `Int?` | @map("user_id") |
| `notes` | `String?` |  |
| `taxType` | `String?` | @default("VAT") @map("tax_type") |
| `currencyId` | `Int?` | @map("currency_id") |
| `exchangeRate` | `Decimal?` | @default(1.0) @map("exchange_rate") @db.Decimal(18, 8) |
| `currency` | `Currency?` | @relation(fields: [currencyId], references: [id]) |
| `supplier` | `Customer?` | @relation(fields: [supplierId], references: [id]) |
| `stock` | `Stock?` | @relation(fields: [stockId], references: [id]) |
| `user` | `User?` | @relation(fields: [userId], references: [id]) |
| `details` | `PurchaseInvoiceDetail[]` |  |
| `branchId` | `Int?` | @map("branch_id") |
| `branch` | `Branch?` | @relation(fields: [branchId], references: [id]) |
| `ThreeWayMatch` | `ThreeWayMatch?` |  |
| `whtTransactions` | `WHTTransaction[]` |  |
| `deletedAt` | `DateTime?` | @map("deleted_at") |
| `deletedBy` | `String?` | @map("deleted_by") |
| `hasException` | `Boolean` | @default(false) |

## Model: `PurchaseInvoiceDetail`
| الحقل | النوع | الوصف |
|---|---|---|
| `id` | `Int` | @id @default(autoincrement()) |
| `tenantId` | `String` | @default("default") @map("tenant_id") |
| `invoiceId` | `Int` | @map("invoice_id") |
| `productId` | `Int` | @map("product_id") |
| `productName` | `String?` | @map("product_name") |
| `quantity` | `Decimal` | @default(1) |
| `price` | `Decimal` | @default(0) |
| `discountRate` | `Decimal` | @default(0) @map("discount_rate") |
| `discountValue` | `Decimal` | @default(0) @map("discount_value") |
| `taxRate` | `Decimal` | @default(15) @map("tax_rate") |
| `taxValue` | `Decimal` | @default(0) @map("tax_value") |
| `total` | `Decimal` | @default(0) |
| `invoice` | `PurchaseInvoice` | @relation(fields: [invoiceId], references: [id], onDelete: Cascade) |
| `product` | `Product` | @relation(fields: [productId], references: [id]) |
| `deletedAt` | `DateTime?` | // P1.2 soft-delete ط·آ·ط¢آ·ط·آ¢ط¢آ·ط·آ·ط¢آ¢ط·آ¢ط¢آ·ط·آ·ط¢آ·ط·آ¢ط¢آ¢ط·آ·ط¢آ¢ط·آ¢ط¢آ·ط·آ·ط¢آ·ط·آ¢ط¢آ·ط·آ·ط¢آ¢ط·آ¢ط¢آ¢ط·آ·ط¢آ·ط·آ¢ط¢آ¢ط·آ·ط¢آ¢ط·آ¢ط¢آ£ط·آ·ط¢آ·ط·آ¢ط¢آ·ط·آ·ط¢آ¢ط·آ¢ط¢آ·ط·آ·ط¢آ·ط·آ¢ط¢آ¢ط·آ·ط¢آ¢ط·آ¢ط¢آ¢ط·آ·ط¢آ·ط·آ¢ط¢آ·ط·آ·ط¢آ¢ط·آ¢ط¢آ¢ط·آ·ط¢آ·ط·آ¢ط¢آ¢ط·آ·ط¢آ¢ط·آ¢ط¢آ¢ط·آ·ط¢آ·ط·آ¢ط¢آ·ط·آ·ط¢آ¢ط·آ¢ط¢آ·ط·آ·ط¢آ·ط·آ¢ط¢آ¢ط·آ·ط¢آ¢ط·آ¢ط¢آ£ط·آ·ط¢آ·ط·آ¢ط¢آ·ط·آ·ط¢آ¢ط·آ¢ط¢آ¢ط·آ·ط¢آ·ط·آ¢ط¢آ¢ط·آ·ط¢آ¢ط·آ¢ط¢آ¢ط·آ·ط¢آ·ط·آ¢ط¢آ·ط·آ·ط¢آ¢ط·آ¢ط¢آ£ط·آ·ط¢آ·ط·آ¢ط¢آ¢ط·آ·ط¢آ¢ط·آ¢ط¢آ¢ط·آ·ط¢آ·ط·آ¢ط¢آ£ط·آ·ط¢آ¢ط·آ¢ط¢آ¢ط·آ·ط¢آ£ط·آ¢ط¢آ¢ط·آ£ط¢آ¢ط£آ¢أ¢â€ڑآ¬ط¹â€کط·آ¢ط¢آ¬ط·آ·ط¢آ¹ط£آ¢أ¢â€ڑآ¬ط¹آ©ط·آ·ط¢آ·ط·آ¢ط¢آ¢ط·آ·ط¢آ¢ط·آ¢ط¢آ¬ط·آ·ط¢آ·ط·آ¢ط¢آ·ط·آ·ط¢آ¢ط·آ¢ط¢آ¹ط·آ·ط¢آ£ط·آ¢ط¢آ¢ط·آ£ط¢آ¢ط£آ¢أ¢â€ڑآ¬ط¹â€کط·آ¢ط¢آ¬ط·آ·ط¢آ¹ط·آ¢ط¢آ©ط·آ·ط¢آ·ط·آ¢ط¢آ·ط·آ·ط¢آ¢ط·آ¢ط¢آ·ط·آ·ط¢آ·ط·آ¢ط¢آ¢ط·آ·ط¢آ¢ط·آ¢ط¢آ¢ط·آ·ط¢آ·ط·آ¢ط¢آ·ط·آ·ط¢آ¢ط·آ¢ط¢آ¢ط·آ·ط¢آ·ط·آ¢ط¢آ¢ط·آ·ط¢آ¢ط·آ¢ط¢آ¬ط·آ·ط¢آ·ط·آ¢ط¢آ·ط·آ·ط¢آ¢ط·آ¢ط¢آ·ط·آ·ط¢آ·ط·آ¢ط¢آ¢ط·آ·ط¢آ¢ط·آ¢ط¢آ£ط·آ·ط¢آ·ط·آ¢ط¢آ·ط·آ·ط¢آ¢ط·آ¢ط¢آ¢ط·آ·ط¢آ·ط·آ¢ط¢آ¢ط·آ·ط¢آ¢ط·آ¢ط¢آ¢ط·آ·ط¢آ·ط·آ¢ط¢آ·ط·آ·ط¢آ¢ط·آ¢ط¢آ£ط·آ·ط¢آ·ط·آ¢ط¢آ¢ط·آ·ط¢آ¢ط·آ¢ط¢آ¢ط·آ·ط¢آ·ط·آ¢ط¢آ£ط·آ·ط¢آ¢ط·آ¢ط¢آ¢ط·آ·ط¢آ£ط·آ¢ط¢آ¢ط·آ£ط¢آ¢ط£آ¢أ¢â‚¬ع‘ط¢آ¬ط·آ¹أ¢â‚¬ع©ط·آ·ط¢آ¢ط·آ¢ط¢آ¬ط·آ·ط¢آ·ط·آ¢ط¢آ¹ط·آ£ط¢آ¢ط£آ¢أ¢â‚¬ع‘ط¢آ¬ط·آ¹ط¢آ©ط·آ·ط¢آ·ط·آ¢ط¢آ·ط·آ·ط¢آ¢ط·آ¢ط¢آ¢ط·آ·ط¢آ·ط·آ¢ط¢آ¢ط·آ·ط¢آ¢ط·آ¢ط¢آ¬ط·آ·ط¢آ·ط·آ¢ط¢آ·ط·آ·ط¢آ¢ط·آ¢ط¢آ£ط·آ·ط¢آ·ط·آ¢ط¢آ¢ط·آ·ط¢آ¢ط·آ¢ط¢آ¢ط·آ·ط¢آ·ط·آ¢ط¢آ£ط·آ·ط¢آ¢ط·آ¢ط¢آ¢ط·آ·ط¢آ£ط·آ¢ط¢آ¢ط·آ£ط¢آ¢ط£آ¢أ¢â€ڑآ¬ط¹â€کط·آ¢ط¢آ¬ط·آ·ط¢آ¹ط£آ¢أ¢â€ڑآ¬ط¹آ©ط·آ·ط¢آ·ط·آ¢ط¢آ¢ط·آ·ط¢آ¢ط·آ¢ط¢آ¬ط·آ·ط¢آ·ط·آ¢ط¢آ·ط·آ·ط¢آ¢ط·آ¢ط¢آ¥ط·آ·ط¢آ£ط·آ¢ط¢آ¢ط·آ£ط¢آ¢ط£آ¢أ¢â€ڑآ¬ط¹â€کط·آ¢ط¢آ¬ط·آ£ط¢آ¢ط£آ¢أ¢â€ڑآ¬أ¢â‚¬ع†ط·آ¢ط¢آ¢ do not use hard DELETE |

## Model: `PurchaseReturn`
| الحقل | النوع | الوصف |
|---|---|---|
| `id` | `Int` | @id @default(autoincrement()) |
| `tenantId` | `String` | @default("default") @map("tenant_id") |
| `returnNo` | `Int` | @map("return_no") |
| `originalInvoiceId` | `Int?` | @map("original_invoice_id") |
| `date` | `DateTime` | @default(now()) |
| `supplierId` | `Int?` | @map("supplier_id") |
| `subtotal` | `Decimal` | @default(0) |
| `discountRate` | `Decimal` | @default(0) @map("discount_rate") |
| `discountValue` | `Decimal` | @default(0) @map("discount_value") |
| `taxValue` | `Decimal` | @default(0) @map("tax_value") |
| `total` | `Decimal` | @default(0) |
| `userId` | `Int?` | @map("user_id") |
| `branchId` | `Int?` | @map("branch_id") |
| `notes` | `String?` |  |
| `zatcaStatus` | `String?` | @default("pending") @map("zatca_status") |
| `zatcaQr` | `String?` | @map("zatca_qr") |
| `supplier` | `Customer?` | @relation(fields: [supplierId], references: [id]) |
| `branch` | `Branch?` | @relation(fields: [branchId], references: [id]) |
| `details` | `PurchaseReturnDetail[]` |  |
| `deletedAt` | `DateTime?` | @map("deleted_at") |
| `deletedBy` | `String?` | @map("deleted_by") |

## Model: `PurchaseReturnDetail`
| الحقل | النوع | الوصف |
|---|---|---|
| `id` | `Int` | @id @default(autoincrement()) |
| `tenantId` | `String` | @default("default") @map("tenant_id") |
| `returnId` | `Int` | @map("return_id") |
| `productId` | `Int` | @map("product_id") |
| `productName` | `String?` | @map("product_name") |
| `quantity` | `Decimal` | @default(1) |
| `price` | `Decimal` | @default(0) |
| `discountRate` | `Decimal` | @default(0) @map("discount_rate") |
| `discountValue` | `Decimal` | @default(0) @map("discount_value") |
| `taxRate` | `Decimal` | @default(15) @map("tax_rate") |
| `taxValue` | `Decimal` | @default(0) @map("tax_value") |
| `total` | `Decimal` | @default(0) |
| `return` | `PurchaseReturn` | @relation(fields: [returnId], references: [id], onDelete: Cascade) |
| `product` | `Product` | @relation(fields: [productId], references: [id]) |

## Model: `StockMovement`
| الحقل | النوع | الوصف |
|---|---|---|
| `id` | `Int` | @id @default(autoincrement()) |
| `tenantId` | `String` | @default("default") @map("tenant_id") |
| `productId` | `Int` | @map("product_id") |
| `stockId` | `Int` | @default(1) @map("stock_id") |
| `type` | `String` | // in, out, transfer, adjustment |
| `quantity` | `Decimal` | @default(0) |
| `referenceType` | `String?` | @map("reference_type") |
| `referenceId` | `Int?` | @map("reference_id") |
| `date` | `DateTime` | @default(now()) |
| `userId` | `Int?` | @map("user_id") |
| `notes` | `String?` |  |
| `product` | `Product` | @relation(fields: [productId], references: [id]) |
| `stock` | `Stock` | @relation(fields: [stockId], references: [id]) |
| `user` | `User?` | @relation(fields: [userId], references: [id]) |
| `batch` | `ProductBatch?` | @relation(fields: [batchId], references: [id]) |
| `batchId` | `Int?` | @map("batch_id") |
| `deletedAt` | `DateTime?` | @map("deleted_at") |
| `deletedBy` | `String?` | @map("deleted_by") |

## Model: `Expense`
| الحقل | النوع | الوصف |
|---|---|---|
| `id` | `Int` | @id @default(autoincrement()) |
| `tenantId` | `String` | @default("default") @map("tenant_id") |
| `date` | `DateTime` | @default(now()) |
| `category` | `String?` |  |
| `description` | `String` |  |
| `amount` | `Decimal` | @default(0) |
| `userId` | `Int?` | @map("user_id") |
| `costCenterId` | `Int?` | @map("cost_center_id") |
| `notes` | `String?` |  |
| `user` | `User?` | @relation(fields: [userId], references: [id]) |
| `branchId` | `Int?` | @map("branch_id") |
| `branch` | `Branch?` | @relation(fields: [branchId], references: [id]) |
| `costCenter` | `CostCenter?` | @relation(fields: [costCenterId], references: [id]) |

## Model: `Treasury`
| الحقل | النوع | الوصف |
|---|---|---|
| `id` | `Int` | @id @default(autoincrement()) |
| `tenantId` | `String` | @default("default") @map("tenant_id") |
| `date` | `DateTime` | @default(now()) |
| `type` | `String` | // in, out |
| `amount` | `Decimal` | @default(0) |
| `description` | `String?` |  |
| `referenceType` | `String?` | @map("reference_type") |
| `referenceId` | `Int?` | @map("reference_id") |
| `userId` | `Int?` | @map("user_id") |
| `user` | `User?` | @relation(fields: [userId], references: [id]) |
| `branch` | `Branch?` | @relation(fields: [branchId], references: [id]) |
| `branchId` | `Int?` | @map("branch_id") |
| `deletedAt` | `DateTime?` | // P1.2 soft-delete ط·آ·ط¢آ·ط·آ¢ط¢آ·ط·آ·ط¢آ¢ط·آ¢ط¢آ·ط·آ·ط¢آ·ط·آ¢ط¢آ¢ط·آ·ط¢آ¢ط·آ¢ط¢آ·ط·آ·ط¢آ·ط·آ¢ط¢آ·ط·آ·ط¢آ¢ط·آ¢ط¢آ¢ط·آ·ط¢آ·ط·آ¢ط¢آ¢ط·آ·ط¢آ¢ط·آ¢ط¢آ£ط·آ·ط¢آ·ط·آ¢ط¢آ·ط·آ·ط¢آ¢ط·آ¢ط¢آ·ط·آ·ط¢آ·ط·آ¢ط¢آ¢ط·آ·ط¢آ¢ط·آ¢ط¢آ¢ط·آ·ط¢آ·ط·آ¢ط¢آ·ط·آ·ط¢آ¢ط·آ¢ط¢آ¢ط·آ·ط¢آ·ط·آ¢ط¢آ¢ط·آ·ط¢آ¢ط·آ¢ط¢آ¢ط·آ·ط¢آ·ط·آ¢ط¢آ·ط·آ·ط¢آ¢ط·آ¢ط¢آ·ط·آ·ط¢آ·ط·آ¢ط¢آ¢ط·آ·ط¢آ¢ط·آ¢ط¢آ£ط·آ·ط¢آ·ط·آ¢ط¢آ·ط·آ·ط¢آ¢ط·آ¢ط¢آ¢ط·آ·ط¢آ·ط·آ¢ط¢آ¢ط·آ·ط¢آ¢ط·آ¢ط¢آ¢ط·آ·ط¢آ·ط·آ¢ط¢آ·ط·آ·ط¢آ¢ط·آ¢ط¢آ£ط·آ·ط¢آ·ط·آ¢ط¢آ¢ط·آ·ط¢آ¢ط·آ¢ط¢آ¢ط·آ·ط¢آ·ط·آ¢ط¢آ£ط·آ·ط¢آ¢ط·آ¢ط¢آ¢ط·آ·ط¢آ£ط·آ¢ط¢آ¢ط·آ£ط¢آ¢ط£آ¢أ¢â€ڑآ¬ط¹â€کط·آ¢ط¢آ¬ط·آ·ط¢آ¹ط£آ¢أ¢â€ڑآ¬ط¹آ©ط·آ·ط¢آ·ط·آ¢ط¢آ¢ط·آ·ط¢آ¢ط·آ¢ط¢آ¬ط·آ·ط¢آ·ط·آ¢ط¢آ·ط·آ·ط¢آ¢ط·آ¢ط¢آ¹ط·آ·ط¢آ£ط·آ¢ط¢آ¢ط·آ£ط¢آ¢ط£آ¢أ¢â€ڑآ¬ط¹â€کط·آ¢ط¢آ¬ط·آ·ط¢آ¹ط·آ¢ط¢آ©ط·آ·ط¢آ·ط·آ¢ط¢آ·ط·آ·ط¢آ¢ط·آ¢ط¢آ·ط·آ·ط¢آ·ط·آ¢ط¢آ¢ط·آ·ط¢آ¢ط·آ¢ط¢آ¢ط·آ·ط¢آ·ط·آ¢ط¢آ·ط·آ·ط¢آ¢ط·آ¢ط¢آ¢ط·آ·ط¢آ·ط·آ¢ط¢آ¢ط·آ·ط¢آ¢ط·آ¢ط¢آ¬ط·آ·ط¢آ·ط·آ¢ط¢آ·ط·آ·ط¢آ¢ط·آ¢ط¢آ·ط·آ·ط¢آ·ط·آ¢ط¢آ¢ط·آ·ط¢آ¢ط·آ¢ط¢آ£ط·آ·ط¢آ·ط·آ¢ط¢آ·ط·آ·ط¢آ¢ط·آ¢ط¢آ¢ط·آ·ط¢آ·ط·آ¢ط¢آ¢ط·آ·ط¢آ¢ط·آ¢ط¢آ¢ط·آ·ط¢آ·ط·آ¢ط¢آ·ط·آ·ط¢آ¢ط·آ¢ط¢آ£ط·آ·ط¢آ·ط·آ¢ط¢آ¢ط·آ·ط¢آ¢ط·آ¢ط¢آ¢ط·آ·ط¢آ·ط·آ¢ط¢آ£ط·آ·ط¢آ¢ط·آ¢ط¢آ¢ط·آ·ط¢آ£ط·آ¢ط¢آ¢ط·آ£ط¢آ¢ط£آ¢أ¢â‚¬ع‘ط¢آ¬ط·آ¹أ¢â‚¬ع©ط·آ·ط¢آ¢ط·آ¢ط¢آ¬ط·آ·ط¢آ·ط·آ¢ط¢آ¹ط·آ£ط¢آ¢ط£آ¢أ¢â‚¬ع‘ط¢آ¬ط·آ¹ط¢آ©ط·آ·ط¢آ·ط·آ¢ط¢آ·ط·آ·ط¢آ¢ط·آ¢ط¢آ¢ط·آ·ط¢آ·ط·آ¢ط¢آ¢ط·آ·ط¢آ¢ط·آ¢ط¢آ¬ط·آ·ط¢آ·ط·آ¢ط¢آ·ط·آ·ط¢آ¢ط·آ¢ط¢آ£ط·آ·ط¢آ·ط·آ¢ط¢آ¢ط·آ·ط¢آ¢ط·آ¢ط¢آ¢ط·آ·ط¢آ·ط·آ¢ط¢آ£ط·آ·ط¢آ¢ط·آ¢ط¢آ¢ط·آ·ط¢آ£ط·آ¢ط¢آ¢ط·آ£ط¢آ¢ط£آ¢أ¢â€ڑآ¬ط¹â€کط·آ¢ط¢آ¬ط·آ·ط¢آ¹ط£آ¢أ¢â€ڑآ¬ط¹آ©ط·آ·ط¢آ·ط·آ¢ط¢آ¢ط·آ·ط¢آ¢ط·آ¢ط¢آ¬ط·آ·ط¢آ·ط·آ¢ط¢آ·ط·آ·ط¢آ¢ط·آ¢ط¢آ¥ط·آ·ط¢آ£ط·آ¢ط¢آ¢ط·آ£ط¢آ¢ط£آ¢أ¢â€ڑآ¬ط¹â€کط·آ¢ط¢آ¬ط·آ£ط¢آ¢ط£آ¢أ¢â€ڑآ¬أ¢â‚¬ع†ط·آ¢ط¢آ¢ do not use hard DELETE |

## Model: `Setting`
| الحقل | النوع | الوصف |
|---|---|---|
| `id` | `Int` | @id @default(autoincrement()) |
| `tenantId` | `String` | @default("default") @map("tenant_id") |
| `key` | `String` | @unique |
| `value` | `String?` |  |
| `description` | `String?` |  |

## Model: `AuditLog`
| الحقل | النوع | الوصف |
|---|---|---|
| `id` | `String` | @id @default(cuid()) |
| `tenantId` | `String` | @default("default") @map("tenant_id") |
| `userId` | `Int?` | @map("user_id") |
| `action` | `String` | // kept as String for backward compat ط·آ·ط¢آ·ط·آ¢ط¢آ·ط·آ·ط¢آ¢ط·آ¢ط¢آ·ط·آ·ط¢آ·ط·آ¢ط¢آ¢ط·آ·ط¢آ¢ط·آ¢ط¢آ·ط·آ·ط¢آ·ط·آ¢ط¢آ·ط·آ·ط¢آ¢ط·آ¢ط¢آ¢ط·آ·ط¢آ·ط·آ¢ط¢آ¢ط·آ·ط¢آ¢ط·آ¢ط¢آ£ط·آ·ط¢آ·ط·آ¢ط¢آ·ط·آ·ط¢آ¢ط·آ¢ط¢آ·ط·آ·ط¢آ·ط·آ¢ط¢آ¢ط·آ·ط¢آ¢ط·آ¢ط¢آ¢ط·آ·ط¢آ·ط·آ¢ط¢آ·ط·آ·ط¢آ¢ط·آ¢ط¢آ¢ط·آ·ط¢آ·ط·آ¢ط¢آ¢ط·آ·ط¢آ¢ط·آ¢ط¢آ¢ط·آ·ط¢آ·ط·آ¢ط¢آ·ط·آ·ط¢آ¢ط·آ¢ط¢آ·ط·آ·ط¢آ·ط·آ¢ط¢آ¢ط·آ·ط¢آ¢ط·آ¢ط¢آ£ط·آ·ط¢آ·ط·آ¢ط¢آ·ط·آ·ط¢آ¢ط·آ¢ط¢آ¢ط·آ·ط¢آ·ط·آ¢ط¢آ¢ط·آ·ط¢آ¢ط·آ¢ط¢آ¢ط·آ·ط¢آ·ط·آ¢ط¢آ·ط·آ·ط¢آ¢ط·آ¢ط¢آ£ط·آ·ط¢آ·ط·آ¢ط¢آ¢ط·آ·ط¢آ¢ط·آ¢ط¢آ¢ط·آ·ط¢آ·ط·آ¢ط¢آ£ط·آ·ط¢آ¢ط·آ¢ط¢آ¢ط·آ·ط¢آ£ط·آ¢ط¢آ¢ط·آ£ط¢آ¢ط£آ¢أ¢â€ڑآ¬ط¹â€کط·آ¢ط¢آ¬ط·آ·ط¢آ¹ط£آ¢أ¢â€ڑآ¬ط¹آ©ط·آ·ط¢آ·ط·آ¢ط¢آ¢ط·آ·ط¢آ¢ط·آ¢ط¢آ¬ط·آ·ط¢آ·ط·آ¢ط¢آ·ط·آ·ط¢آ¢ط·آ¢ط¢آ¹ط·آ·ط¢آ£ط·آ¢ط¢آ¢ط·آ£ط¢آ¢ط£آ¢أ¢â€ڑآ¬ط¹â€کط·آ¢ط¢آ¬ط·آ·ط¢آ¹ط·آ¢ط¢آ©ط·آ·ط¢آ·ط·آ¢ط¢آ·ط·آ·ط¢آ¢ط·آ¢ط¢آ·ط·آ·ط¢آ·ط·آ¢ط¢آ¢ط·آ·ط¢آ¢ط·آ¢ط¢آ¢ط·آ·ط¢آ·ط·آ¢ط¢آ·ط·آ·ط¢آ¢ط·آ¢ط¢آ¢ط·آ·ط¢آ·ط·آ¢ط¢آ¢ط·آ·ط¢آ¢ط·آ¢ط¢آ¬ط·آ·ط¢آ·ط·آ¢ط¢آ·ط·آ·ط¢آ¢ط·آ¢ط¢آ·ط·آ·ط¢آ·ط·آ¢ط¢آ¢ط·آ·ط¢آ¢ط·آ¢ط¢آ£ط·آ·ط¢آ·ط·آ¢ط¢آ·ط·آ·ط¢آ¢ط·آ¢ط¢آ¢ط·آ·ط¢آ·ط·آ¢ط¢آ¢ط·آ·ط¢آ¢ط·آ¢ط¢آ¢ط·آ·ط¢آ·ط·آ¢ط¢آ·ط·آ·ط¢آ¢ط·آ¢ط¢آ£ط·آ·ط¢آ·ط·آ¢ط¢آ¢ط·آ·ط¢آ¢ط·آ¢ط¢آ¢ط·آ·ط¢آ·ط·آ¢ط¢آ£ط·آ·ط¢آ¢ط·آ¢ط¢آ¢ط·آ·ط¢آ£ط·آ¢ط¢آ¢ط·آ£ط¢آ¢ط£آ¢أ¢â‚¬ع‘ط¢آ¬ط·آ¹أ¢â‚¬ع©ط·آ·ط¢آ¢ط·آ¢ط¢آ¬ط·آ·ط¢آ·ط·آ¢ط¢آ¹ط·آ£ط¢آ¢ط£آ¢أ¢â‚¬ع‘ط¢آ¬ط·آ¹ط¢آ©ط·آ·ط¢آ·ط·آ¢ط¢آ·ط·آ·ط¢آ¢ط·آ¢ط¢آ¢ط·آ·ط¢آ·ط·آ¢ط¢آ¢ط·آ·ط¢آ¢ط·آ¢ط¢آ¬ط·آ·ط¢آ·ط·آ¢ط¢آ·ط·آ·ط¢آ¢ط·آ¢ط¢آ£ط·آ·ط¢آ·ط·آ¢ط¢آ¢ط·آ·ط¢آ¢ط·آ¢ط¢آ¢ط·آ·ط¢آ·ط·آ¢ط¢آ£ط·آ·ط¢آ¢ط·آ¢ط¢آ¢ط·آ·ط¢آ£ط·آ¢ط¢آ¢ط·آ£ط¢آ¢ط£آ¢أ¢â€ڑآ¬ط¹â€کط·آ¢ط¢آ¬ط·آ·ط¢آ¹ط£آ¢أ¢â€ڑآ¬ط¹آ©ط·آ·ط¢آ·ط·آ¢ط¢آ¢ط·آ·ط¢آ¢ط·آ¢ط¢آ¬ط·آ·ط¢آ·ط·آ¢ط¢آ·ط·آ·ط¢آ¢ط·آ¢ط¢آ¥ط·آ·ط¢آ£ط·آ¢ط¢آ¢ط·آ£ط¢آ¢ط£آ¢أ¢â€ڑآ¬ط¹â€کط·آ¢ط¢آ¬ط·آ£ط¢آ¢ط£آ¢أ¢â€ڑآ¬أ¢â‚¬ع†ط·آ¢ط¢آ¢ see AuditAction enum for valid values |
| `tableName` | `String?` | @map("table_name") |
| `recordId` | `String?` | @map("record_id") |
| `details` | `String?` |  |
| `createdAt` | `DateTime` | @default(now()) @map("created_at") |
| `diff` | `Json?` | // { before: {...}, after: {...} } for field-level changes |
| `ipAddress` | `String?` | @map("ip_address") |
| `userAgent` | `String?` | @map("user_agent") |
| `user` | `User?` | @relation(fields: [userId], references: [id]) |

## Model: `Employee`
| الحقل | النوع | الوصف |
|---|---|---|
| `id` | `Int` | @id @default(autoincrement()) |
| `tenantId` | `String` | @default("default") @map("tenant_id") |
| `employeeNo` | `String?` | @unique @map("employee_no") |
| `name` | `String` |  |
| `phone` | `String?` |  |
| `position` | `String?` |  |
| `salary` | `Decimal` | @default(0) |
| `housingAllowance` | `Decimal` | @default(0) @map("housing_allowance") @db.Decimal(20, 4) |
| `transportAllowance` | `Decimal` | @default(0) @map("transport_allowance") @db.Decimal(20, 4) |
| `otherAllowance` | `Decimal` | @default(0) @map("other_allowance") @db.Decimal(20, 4) |
| `bankName` | `String?` | @map("bank_name") |
| `iban` | `String?` |  |
| `startDate` | `String?` | @map("start_date") |
| `active` | `Boolean` | @default(true) |
| `createdAt` | `DateTime` | @default(now()) @map("created_at") |
| `branchId` | `Int?` | @map("branch_id") |
| `branch` | `Branch?` | @relation(fields: [branchId], references: [id]) |
| `nationality` | `String` | @default("SAUDI") // SAUDI, GCC, EXPAT, MILITARY, GOV_EMPLOYEE |
| `iqamaNumber` | `String?` | @map("iqama_number") // Encrypted ideally |
| `passportNumber` | `String?` | @map("passport_number") |
| `idNumber` | `String?` | @map("id_number") |
| `birthDate` | `DateTime?` | @map("birth_date") |
| `gender` | `String?` |  |
| `maritalStatus` | `String?` | @map("marital_status") |
| `faceDescriptor` | `String?` | @map("face_descriptor") @db.Text |
| `department` | `String?` |  |
| `managerId` | `Int?` | @map("manager_id") |
| `manager` | `Employee?` | @relation("EmployeeToManager", fields: [managerId], references: [id]) |
| `subordinates` | `Employee[]` | @relation("EmployeeToManager") |
| `attendance` | `Attendance[]` |  |
| `salaries` | `Salary[]` |  |
| `pettyCashes` | `PettyCashTransaction[]` |  |
| `salesTargets` | `SalesTarget[]` |  |
| `salesOrders` | `SalesOrder[]` |  |
| `salesInvoices` | `SalesInvoice[]` | @relation("SalesInvoiceRep") |
| `routes` | `Route[]` | @relation("RouteSalesRep") |
| `evaluationsReceived` | `EmployeeEvaluation[]` | @relation("Evaluatee") |
| `evaluationsGiven` | `EmployeeEvaluation[]` | @relation("Evaluator") |
| `trainings` | `TrainingEnrollment[]` |  |
| `fleetTrips` | `FleetTrip[]` |  |
| `fuelLogs` | `FuelLog[]` |  |
| `classesTaught` | `AcademicClass[]` |  |
| `commissions` | `SalesmanCommission[]` |  |
| `pettyCashFunds` | `PettyCashFund[]` |  |
| `Vacation` | `Vacation[]` |  |
| `EmployeeLoan` | `EmployeeLoan[]` |  |
| `PayrollInvoice` | `PayrollInvoice[]` |  |
| `EndOfServiceCalculation` | `EndOfServiceCalculation[]` |  |
| `WPSBatchItem` | `WPSBatchItem[]` |  |
| `LeaveBalance` | `LeaveBalance[]` |  |
| `LeaveAccrual` | `LeaveAccrual[]` |  |
| `LeaveRequest` | `LeaveRequest[]` |  |
| `DoctorSchedule` | `DoctorSchedule[]` |  |
| `Appointment` | `Appointment[]` |  |
| `ClinicPrescription` | `ClinicPrescription[]` |  |
| `LabOrder` | `LabOrder[]` |  |
| `qiwaWageProtectionId` | `String?` | @map("qiwa_wage_protection_id") |
| `mudadStatus` | `String?` | @map("mudad_status") // ACTIVE | PENDING | SUSPENDED |
| `qiwaContracts` | `QiwaContract[]` |  |
| `projectResources` | `ProjectResource[]` | @relation("ProjectEmployee") |
| `projectTimeEntries` | `ProjectTimeEntry[]` | @relation("TimeEntryEmployee") |
| `deletedAt` | `DateTime?` | @map("deleted_at") |
| `deletedBy` | `String?` | @map("deleted_by") |

## Model: `Attendance`
| الحقل | النوع | الوصف |
|---|---|---|
| `id` | `Int` | @id @default(autoincrement()) |
| `tenantId` | `String` | @default("default") @map("tenant_id") |
| `employeeId` | `Int` | @map("employee_id") |
| `date` | `String` |  |
| `checkIn` | `String?` | @map("check_in") |
| `checkOut` | `String?` | @map("check_out") |
| `notes` | `String?` |  |
| `employee` | `Employee` | @relation(fields: [employeeId], references: [id]) |

## Model: `Salary`
| الحقل | النوع | الوصف |
|---|---|---|
| `id` | `Int` | @id @default(autoincrement()) |
| `tenantId` | `String` | @default("default") @map("tenant_id") |
| `employeeId` | `Int` | @map("employee_id") |
| `month` | `Int` |  |
| `year` | `Int` |  |
| `basicSalary` | `Decimal` | @default(0) @map("basic_salary") @db.Decimal(20, 4) |
| `additions` | `Decimal` | @default(0) @db.Decimal(20, 4) |
| `deductions` | `Decimal` | @default(0) @db.Decimal(20, 4) |
| `gosiDeduction` | `Decimal` | @default(0) @map("gosi_deduction") @db.Decimal(20, 4) |
| `loanDeduction` | `Decimal` | @default(0) @map("loan_deduction") @db.Decimal(20, 4) |
| `netSalary` | `Decimal` | @default(0) @map("net_salary") @db.Decimal(20, 4) |
| `paidDate` | `DateTime` | @default(now()) @map("paid_date") |
| `notes` | `String?` |  |
| `employee` | `Employee` | @relation(fields: [employeeId], references: [id]) |
| `deletedAt` | `DateTime?` | @map("deleted_at") |
| `deletedBy` | `String?` | @map("deleted_by") |

## Model: `Vacation`
| الحقل | النوع | الوصف |
|---|---|---|
| `id` | `Int` | @id @default(autoincrement()) |
| `tenantId` | `String` | @default("default") @map("tenant_id") |
| `employeeId` | `Int` | @map("employee_id") |
| `type` | `String` | @default("annual") |
| `dateFrom` | `String` | @map("date_from") |
| `dateTo` | `String` | @map("date_to") |
| `status` | `String` | @default("approved") |
| `notes` | `String?` |  |
| `employee` | `Employee` | @relation(fields: [employeeId], references: [id]) |

## Model: `PriceQuote`
| الحقل | النوع | الوصف |
|---|---|---|
| `id` | `Int` | @id @default(autoincrement()) |
| `tenantId` | `String` | @default("default") @map("tenant_id") |
| `quoteNo` | `Int` | @map("quote_no") |
| `date` | `DateTime` | @default(now()) |
| `customerId` | `Int?` | @map("customer_id") |
| `total` | `Decimal` | @default(0) |
| `status` | `String` | @default("pending") // DRAFT, SENT, ACCEPTED, REJECTED, EXPIRED, CONVERTED, SUPERSEDED |
| `userId` | `Int?` | @map("user_id") |
| `notes` | `String?` |  |
| `versionNumber` | `Int` | @default(1) @map("version_number") |
| `parentQuoteId` | `Int?` | @map("parent_quote_id") |
| `convertedToSalesOrderId` | `Int?` | @map("converted_to_sales_order_id") |
| `convertedAt` | `DateTime?` | @map("converted_at") |
| `details` | `PriceQuoteDetail[]` |  |
| `revisions` | `QuoteRevision[]` |  |
| `deletedAt` | `DateTime?` | @map("deleted_at") |
| `deletedBy` | `String?` | @map("deleted_by") |

## Model: `QuoteRevision`
| الحقل | النوع | الوصف |
|---|---|---|
| `id` | `Int` | @id @default(autoincrement()) |
| `tenantId` | `String` | @default("default") @map("tenant_id") |
| `quoteId` | `Int` | @map("quote_id") |
| `version` | `Int` |  |
| `changes` | `String?` | // JSON |
| `revisedBy` | `Int?` | @map("revised_by") |
| `revisedAt` | `DateTime` | @default(now()) @map("revised_at") |
| `quote` | `PriceQuote` | @relation(fields: [quoteId], references: [id], onDelete: Cascade) |

## Model: `PriceQuoteDetail`
| الحقل | النوع | الوصف |
|---|---|---|
| `id` | `Int` | @id @default(autoincrement()) |
| `tenantId` | `String` | @default("default") @map("tenant_id") |
| `quoteId` | `Int` | @map("quote_id") |
| `productId` | `Int?` | @map("product_id") |
| `productName` | `String?` | @map("product_name") |
| `quantity` | `Decimal` | @default(1) |
| `price` | `Decimal` | @default(0) |
| `total` | `Decimal` | @default(0) |
| `quote` | `PriceQuote` | @relation(fields: [quoteId], references: [id], onDelete: Cascade) |

## Model: `StockTransfer`
| الحقل | النوع | الوصف |
|---|---|---|
| `id` | `Int` | @id @default(autoincrement()) |
| `tenantId` | `String` | @default("default") @map("tenant_id") |
| `transferNo` | `Int` | @map("transfer_no") |
| `date` | `DateTime` | @default(now()) |
| `fromStockId` | `Int?` | @map("from_stock_id") |
| `toStockId` | `Int?` | @map("to_stock_id") |
| `userId` | `Int?` | @map("user_id") |
| `notes` | `String?` |  |
| `details` | `StockTransferDetail[]` |  |

## Model: `StockTransferDetail`
| الحقل | النوع | الوصف |
|---|---|---|
| `id` | `Int` | @id @default(autoincrement()) |
| `tenantId` | `String` | @default("default") @map("tenant_id") |
| `transferId` | `Int` | @map("transfer_id") |
| `productId` | `Int?` | @map("product_id") |
| `productName` | `String?` | @map("product_name") |
| `quantity` | `Decimal` | @default(0) |
| `transfer` | `StockTransfer` | @relation(fields: [transferId], references: [id], onDelete: Cascade) |

## Model: `Booking`
| الحقل | النوع | الوصف |
|---|---|---|
| `id` | `Int` | @id @default(autoincrement()) |
| `tenantId` | `String` | @default("default") @map("tenant_id") |
| `bookingNo` | `Int` | @map("booking_no") |
| `date` | `DateTime` | @default(now()) |
| `customerId` | `Int?` | @map("customer_id") |
| `total` | `Decimal` | @default(0) |
| `deposit` | `Decimal` | @default(0) @db.Decimal(20, 4) |
| `status` | `String` | @default("pending") |
| `userId` | `Int?` | @map("user_id") |
| `notes` | `String?` |  |
| `customer` | `Customer?` | @relation(fields: [customerId], references: [id]) |
| `deletedAt` | `DateTime?` | @map("deleted_at") |
| `deletedBy` | `String?` | @map("deleted_by") |

## Model: `Maintenance`
| الحقل | النوع | الوصف |
|---|---|---|
| `id` | `Int` | @id @default(autoincrement()) |
| `tenantId` | `String` | @default("default") @map("tenant_id") |
| `date` | `DateTime` | @default(now()) |
| `customerName` | `String?` | @map("customer_name") |
| `phone` | `String?` |  |
| `deviceType` | `String?` | @map("device_type") |
| `problem` | `String?` |  |
| `cost` | `Decimal` | @default(0) @db.Decimal(20, 4) |
| `status` | `String` | @default("pending") |
| `userId` | `Int?` | @map("user_id") |
| `notes` | `String?` |  |

## Model: `Account`
| الحقل | النوع | الوصف |
|---|---|---|
| `id` | `Int` | @id @default(autoincrement()) |
| `tenantId` | `String` | @default("default") @map("tenant_id") |
| `code` | `String` |  |
| `name` | `String` |  |
| `nameEn` | `String` | @default("") @map("name_en") |
| `type` | `String` | // asset, liability, equity, revenue, expense |
| `parentId` | `Int` | @default(0) @map("parent_id") |
| `level` | `Int` | @default(1) |
| `isActive` | `Boolean` | @default(true) @map("is_active") |
| `balance` | `Decimal` | @default(0) |
| `zakatCategory` | `String?` | @map("zakat_category") |
| `journalLines` | `JournalLine[]` |  |
| `LandedCost` | `LandedCost[]` |  |
| `bankChecks` | `CheckTransaction[]` | @relation("CheckBankAccount") |
| `bankRecons` | `BankReconciliation[]` |  |
| `BudgetLine` | `BudgetLine[]` |  |
| `Encumbrance` | `Encumbrance[]` |  |
| `sourceMappings` | `AccountMapping[]` | @relation("SourceAccount") |
| `targetMappings` | `AccountMapping[]` | @relation("TargetAccount") |
| `OpeningBalance` | `OpeningBalance[]` |  |
| `deletedAt` | `DateTime?` | @map("deleted_at") |
| `deletedBy` | `String?` | @map("deleted_by") |

## Model: `JournalEntry`
| الحقل | النوع | الوصف |
|---|---|---|
| `id` | `Int` | @id @default(autoincrement()) |
| `tenantId` | `String` | @default("default") @map("tenant_id") |
| `entryNumber` | `String` | @map("entry_number") |
| `entryDate` | `String` | @map("entry_date") |
| `description` | `String?` |  |
| `reference` | `String?` |  |
| `totalDebit` | `Decimal` | @default(0) @map("total_debit") @db.Decimal(20, 4) |
| `totalCredit` | `Decimal` | @default(0) @map("total_credit") @db.Decimal(20, 4) |
| `status` | `String` | @default("posted") |
| `createdBy` | `Int?` | @map("created_by") |
| `createdAt` | `DateTime` | @default(now()) @map("created_at") |
| `currencyId` | `Int?` | @map("currency_id") |
| `exchangeRate` | `Decimal` | @default(1.0) @map("exchange_rate") @db.Decimal(18, 8) |
| `autoReverseDate` | `DateTime?` | @map("auto_reverse_date") |
| `isReversal` | `Boolean` | @default(false) @map("is_reversal") |
| `lines` | `JournalLine[]` |  |
| `branch` | `Branch?` | @relation(fields: [branchId], references: [id]) |
| `branchId` | `Int?` | @map("branch_id") |
| `bookId` | `Int?` | @map("book_id") |
| `book` | `AccountingBook?` | @relation(fields: [bookId], references: [id]) |
| `replicatedFromId` | `Int?` |  |
| `replicatedFrom` | `JournalEntry?` | @relation("Replications", fields: [replicatedFromId], references: [id]) |
| `replications` | `JournalEntry[]` | @relation("Replications") |
| `bookOnly` | `Boolean` | @default(false) |
| `fxRateUsed` | `Decimal?` | @db.Decimal(20, 8) |
| `fxRateDate` | `DateTime?` |  |
| `fxRateSource` | `String?` |  |
| `deletedAt` | `DateTime?` | @map("deleted_at") |
| `deletedBy` | `String?` | @map("deleted_by") |

## Model: `JournalLine`
| الحقل | النوع | الوصف |
|---|---|---|
| `id` | `Int` | @id @default(autoincrement()) |
| `tenantId` | `String` | @default("default") @map("tenant_id") |
| `entryId` | `Int` | @map("entry_id") |
| `accountId` | `Int` | @map("account_id") |
| `costCenterId` | `Int?` | @map("cost_center_id") |
| `description` | `String?` |  |
| `debit` | `Decimal` | @default(0) @db.Decimal(20, 4) |
| `credit` | `Decimal` | @default(0) @db.Decimal(20, 4) |
| `foreignDebit` | `Decimal` | @default(0) @map("foreign_debit") @db.Decimal(20, 4) |
| `foreignCredit` | `Decimal` | @default(0) @map("foreign_credit") @db.Decimal(20, 4) |
| `isReconciled` | `Boolean` | @default(false) @map("is_reconciled") |
| `reconciliationId` | `Int?` | @map("reconciliation_id") |
| `profitCenterId` | `Int?` | @map("profit_center_id") |
| `projectId` | `Int?` | @map("project_id") |
| `segmentId` | `Int?` | @map("segment_id") |
| `productId` | `Int?` | @map("product_id") |
| `customerId` | `Int?` | @map("customer_id") |
| `vendorId` | `Int?` | @map("vendor_id") |
| `employeeId` | `Int?` | @map("employee_id") |
| `assetId` | `Int?` | @map("asset_id") |
| `bookId` | `Int?` | @map("book_id") |
| `fxRate` | `Decimal?` | @db.Decimal(18, 8) |
| `quantity` | `Decimal?` | @db.Decimal(20, 4) |
| `uom` | `String?` |  |
| `entry` | `JournalEntry` | @relation(fields: [entryId], references: [id], onDelete: Cascade) |
| `account` | `Account` | @relation(fields: [accountId], references: [id]) |
| `costCenter` | `CostCenter?` | @relation(fields: [costCenterId], references: [id]) |
| `bankRecon` | `BankReconciliation?` | @relation(fields: [reconciliationId], references: [id]) |
| `profitCenter` | `ProfitCenter?` | @relation(fields: [profitCenterId], references: [id]) |
| `segment` | `Segment?` | @relation(fields: [segmentId], references: [id]) |
| `deletedAt` | `DateTime?` | // P1.2 soft-delete ط·آ·ط¢آ·ط·آ¢ط¢آ·ط·آ·ط¢آ¢ط·آ¢ط¢آ·ط·آ·ط¢آ·ط·آ¢ط¢آ¢ط·آ·ط¢آ¢ط·آ¢ط¢آ·ط·آ·ط¢آ·ط·آ¢ط¢آ·ط·آ·ط¢آ¢ط·آ¢ط¢آ¢ط·آ·ط¢آ·ط·آ¢ط¢آ¢ط·آ·ط¢آ¢ط·آ¢ط¢آ£ط·آ·ط¢آ·ط·آ¢ط¢آ·ط·آ·ط¢آ¢ط·آ¢ط¢آ·ط·آ·ط¢آ·ط·آ¢ط¢آ¢ط·آ·ط¢آ¢ط·آ¢ط¢آ¢ط·آ·ط¢آ·ط·آ¢ط¢آ·ط·آ·ط¢آ¢ط·آ¢ط¢آ¢ط·آ·ط¢آ·ط·آ¢ط¢آ¢ط·آ·ط¢آ¢ط·آ¢ط¢آ¢ط·آ·ط¢آ·ط·آ¢ط¢آ·ط·آ·ط¢آ¢ط·آ¢ط¢آ·ط·آ·ط¢آ·ط·آ¢ط¢آ¢ط·آ·ط¢آ¢ط·آ¢ط¢آ£ط·آ·ط¢آ·ط·آ¢ط¢آ·ط·آ·ط¢آ¢ط·آ¢ط¢آ¢ط·آ·ط¢آ·ط·آ¢ط¢آ¢ط·آ·ط¢آ¢ط·آ¢ط¢آ¢ط·آ·ط¢آ·ط·آ¢ط¢آ·ط·آ·ط¢آ¢ط·آ¢ط¢آ£ط·آ·ط¢آ·ط·آ¢ط¢آ¢ط·آ·ط¢آ¢ط·آ¢ط¢آ¢ط·آ·ط¢آ·ط·آ¢ط¢آ£ط·آ·ط¢آ¢ط·آ¢ط¢آ¢ط·آ·ط¢آ£ط·آ¢ط¢آ¢ط·آ£ط¢آ¢ط£آ¢أ¢â€ڑآ¬ط¹â€کط·آ¢ط¢آ¬ط·آ·ط¢آ¹ط£آ¢أ¢â€ڑآ¬ط¹آ©ط·آ·ط¢آ·ط·آ¢ط¢آ¢ط·آ·ط¢آ¢ط·آ¢ط¢آ¬ط·آ·ط¢آ·ط·آ¢ط¢آ·ط·آ·ط¢آ¢ط·آ¢ط¢آ¹ط·آ·ط¢آ£ط·آ¢ط¢آ¢ط·آ£ط¢آ¢ط£آ¢أ¢â€ڑآ¬ط¹â€کط·آ¢ط¢آ¬ط·آ·ط¢آ¹ط·آ¢ط¢آ©ط·آ·ط¢آ·ط·آ¢ط¢آ·ط·آ·ط¢آ¢ط·آ¢ط¢آ·ط·آ·ط¢آ·ط·آ¢ط¢آ¢ط·آ·ط¢آ¢ط·آ¢ط¢آ¢ط·آ·ط¢آ·ط·آ¢ط¢آ·ط·آ·ط¢آ¢ط·آ¢ط¢آ¢ط·آ·ط¢آ·ط·آ¢ط¢آ¢ط·آ·ط¢آ¢ط·آ¢ط¢آ¬ط·آ·ط¢آ·ط·آ¢ط¢آ·ط·آ·ط¢آ¢ط·آ¢ط¢آ·ط·آ·ط¢آ·ط·آ¢ط¢آ¢ط·آ·ط¢آ¢ط·آ¢ط¢آ£ط·آ·ط¢آ·ط·آ¢ط¢آ·ط·آ·ط¢آ¢ط·آ¢ط¢آ¢ط·آ·ط¢آ·ط·آ¢ط¢آ¢ط·آ·ط¢آ¢ط·آ¢ط¢آ¢ط·آ·ط¢آ·ط·آ¢ط¢آ·ط·آ·ط¢آ¢ط·آ¢ط¢آ£ط·آ·ط¢آ·ط·آ¢ط¢آ¢ط·آ·ط¢آ¢ط·آ¢ط¢آ¢ط·آ·ط¢آ·ط·آ¢ط¢آ£ط·آ·ط¢آ¢ط·آ¢ط¢آ¢ط·آ·ط¢آ£ط·آ¢ط¢آ¢ط·آ£ط¢آ¢ط£آ¢أ¢â‚¬ع‘ط¢آ¬ط·آ¹أ¢â‚¬ع©ط·آ·ط¢آ¢ط·آ¢ط¢آ¬ط·آ·ط¢آ·ط·آ¢ط¢آ¹ط·آ£ط¢آ¢ط£آ¢أ¢â‚¬ع‘ط¢آ¬ط·آ¹ط¢آ©ط·آ·ط¢آ·ط·آ¢ط¢آ·ط·آ·ط¢آ¢ط·آ¢ط¢آ¢ط·آ·ط¢آ·ط·آ¢ط¢آ¢ط·آ·ط¢آ¢ط·آ¢ط¢آ¬ط·آ·ط¢آ·ط·آ¢ط¢آ·ط·آ·ط¢آ¢ط·آ¢ط¢آ£ط·آ·ط¢آ·ط·آ¢ط¢آ¢ط·آ·ط¢آ¢ط·آ¢ط¢آ¢ط·آ·ط¢آ·ط·آ¢ط¢آ£ط·آ·ط¢آ¢ط·آ¢ط¢آ¢ط·آ·ط¢آ£ط·آ¢ط¢آ¢ط·آ£ط¢آ¢ط£آ¢أ¢â€ڑآ¬ط¹â€کط·آ¢ط¢آ¬ط·آ·ط¢آ¹ط£آ¢أ¢â€ڑآ¬ط¹آ©ط·آ·ط¢آ·ط·آ¢ط¢آ¢ط·آ·ط¢آ¢ط·آ¢ط¢آ¬ط·آ·ط¢آ·ط·آ¢ط¢آ·ط·آ·ط¢آ¢ط·آ¢ط¢آ¥ط·آ·ط¢آ£ط·آ¢ط¢آ¢ط·آ£ط¢آ¢ط£آ¢أ¢â€ڑآ¬ط¹â€کط·آ¢ط¢آ¬ط·آ£ط¢آ¢ط£آ¢أ¢â€ڑآ¬أ¢â‚¬ع†ط·آ¢ط¢آ¢ do not use hard DELETE |

## Model: `ProfitCenter`
| الحقل | النوع | الوصف |
|---|---|---|
| `id` | `Int` | @id @default(autoincrement()) |
| `tenantId` | `String` | @default("default") @map("tenant_id") |
| `code` | `String` | @unique |
| `name` | `String` |  |
| `nameEn` | `String?` | @map("name_en") |
| `parentId` | `Int?` | @map("parent_id") |
| `isActive` | `Boolean` | @default(true) @map("is_active") |
| `createdAt` | `DateTime` | @default(now()) @map("created_at") |
| `journalLines` | `JournalLine[]` |  |

## Model: `Segment`
| الحقل | النوع | الوصف |
|---|---|---|
| `id` | `Int` | @id @default(autoincrement()) |
| `tenantId` | `String` | @default("default") @map("tenant_id") |
| `code` | `String` | @unique |
| `name` | `String` |  |
| `nameEn` | `String?` | @map("name_en") |
| `type` | `String` | @default("GEO") // GEO | PRODUCT_LINE | CHANNEL |
| `isActive` | `Boolean` | @default(true) @map("is_active") |
| `journalLines` | `JournalLine[]` |  |

## Model: `CopaCharacteristic`
| الحقل | النوع | الوصف |
|---|---|---|
| `id` | `Int` | @id @default(autoincrement()) |
| `tenantId` | `String` | @default("default") @map("tenant_id") |
| `code` | `String` | @unique |
| `name` | `String` |  |
| `type` | `String` | // CUSTOMER | PRODUCT | CHANNEL | REGION | SEGMENT | CUSTOM |

## Model: `CopaValueField`
| الحقل | النوع | الوصف |
|---|---|---|
| `id` | `Int` | @id @default(autoincrement()) |
| `tenantId` | `String` | @default("default") @map("tenant_id") |
| `code` | `String` | @unique |
| `name` | `String` |  |
| `aggregation` | `String` | @default("SUM") // SUM | AVG | COUNT |
| `glAccountId` | `Int?` | @map("gl_account_id") |

## Model: `CopaDocument`
| الحقل | النوع | الوصف |
|---|---|---|
| `id` | `Int` | @id @default(autoincrement()) |
| `tenantId` | `String` | @default("default") @map("tenant_id") |
| `postingDate` | `DateTime` | @map("posting_date") |
| `sourceType` | `String` | @map("source_type") // SALES_INVOICE | SALES_RETURN | COGS | MANUAL |
| `sourceId` | `Int` | @map("source_id") |
| `customerId` | `Int?` | @map("customer_id") |
| `productId` | `Int?` | @map("product_id") |
| `channelCode` | `String?` | @map("channel_code") |
| `regionCode` | `String?` | @map("region_code") |
| `profitCenterId` | `Int?` | @map("profit_center_id") |
| `segmentId` | `Int?` | @map("segment_id") |
| `revenue` | `Decimal` | @default(0) @db.Decimal(20, 4) |
| `cogs` | `Decimal` | @default(0) @db.Decimal(20, 4) |
| `discount` | `Decimal` | @default(0) @db.Decimal(20, 4) |
| `freight` | `Decimal` | @default(0) @db.Decimal(20, 4) |
| `contributionMargin` | `Decimal` | @default(0) @map("contribution_margin") @db.Decimal(20, 4) |
| `createdAt` | `DateTime` | @default(now()) @map("created_at") |

## Model: `CopaAllocationRule`
| الحقل | النوع | الوصف |
|---|---|---|
| `id` | `Int` | @id @default(autoincrement()) |
| `tenantId` | `String` | @default("default") @map("tenant_id") |
| `name` | `String` |  |
| `basis` | `String` | // REVENUE | HEADCOUNT | EQUAL | CUSTOM_FORMULA |
| `srcAccount` | `String` | @map("src_account") |
| `dstChars` | `Json` | @map("dst_chars") // JSON: target characteristic combos |
| `active` | `Boolean` | @default(true) |

## Model: `NumberSequence`
| الحقل | النوع | الوصف |
|---|---|---|
| `id` | `Int` | @id @default(autoincrement()) |
| `tenantId` | `String` | @default("default") @map("tenant_id") |
| `code` | `String` | @unique // INV, PO, GRN, JE, SO, SQ, RFQ, CN, DN, PAY, etc. |
| `name` | `String` |  |
| `prefix` | `String` | @default("") // e.g. "INV-", "PO-2026-" |
| `suffix` | `String` | @default("") |
| `padLength` | `Int` | @default(6) @map("pad_length") |
| `lastNumber` | `Int` | @default(0) @map("last_number") |
| `resetPeriod` | `String` | @default("NEVER") @map("reset_period") // NEVER | YEARLY | MONTHLY |
| `fiscalYearId` | `Int?` | @map("fiscal_year_id") |
| `isActive` | `Boolean` | @default(true) @map("is_active") |
| `createdAt` | `DateTime` | @default(now()) @map("created_at") |

## Model: `DocumentStateMachine`
| الحقل | النوع | الوصف |
|---|---|---|
| `id` | `Int` | @id @default(autoincrement()) |
| `tenantId` | `String` | @default("default") @map("tenant_id") |
| `docType` | `String` | @map("doc_type") // SALES_INVOICE | PURCHASE_ORDER | JOURNAL_ENTRY | etc. |
| `fromState` | `String` | @map("from_state") |
| `toState` | `String` | @map("to_state") |
| `action` | `String` | // submit | approve | reject | cancel | reverse | close |
| `requiredRole` | `String?` | @map("required_role") // admin | accountant | manager |
| `autoActions` | `Json?` | @map("auto_actions") // JSON: [{type:'POST_JE'},{type:'SEND_EMAIL'}] |
| `isActive` | `Boolean` | @default(true) @map("is_active") |

## Model: `PeriodCloseTask`
| الحقل | النوع | الوصف |
|---|---|---|
| `id` | `Int` | @id @default(autoincrement()) |
| `tenantId` | `String` | @default("default") @map("tenant_id") |
| `fiscalPeriodId` | `Int` | @map("fiscal_period_id") |
| `taskCode` | `String` | @map("task_code") // RECON_BANK | DEPRECIATION | FX_REVAL | ACCRUE_EXP | CLOSE_SUB | POST_TAX |
| `taskName` | `String` | @map("task_name") |
| `sequence` | `Int` | @default(0) |
| `status` | `String` | @default("PENDING") // PENDING | IN_PROGRESS | COMPLETED | SKIPPED | FAILED |
| `assigneeId` | `Int?` | @map("assignee_id") |
| `completedAt` | `DateTime?` | @map("completed_at") |
| `completedBy` | `Int?` | @map("completed_by") |
| `notes` | `String?` |  |
| `dependsOn` | `Json?` | @map("depends_on") // array of task codes that must complete first |
| `autoRun` | `Boolean` | @default(false) @map("auto_run") // if true, system auto-executes |

## Model: `ApprovalWorkflow`
| الحقل | النوع | الوصف |
|---|---|---|
| `id` | `Int` | @id @default(autoincrement()) |
| `tenantId` | `String` | @default("default") @map("tenant_id") |
| `code` | `String` | @unique |
| `name` | `String` |  |
| `docType` | `String` | @map("doc_type") // PURCHASE_ORDER | JOURNAL_ENTRY | PAYMENT | LEAVE_REQUEST |
| `isActive` | `Boolean` | @default(true) @map("is_active") |
| `conditions` | `Json?` | // JSON: {minAmount: 10000, currency: 'SAR'} |
| `steps` | `ApprovalWorkflowStep[]` |  |

## Model: `ApprovalWorkflowStep`
| الحقل | النوع | الوصف |
|---|---|---|
| `id` | `Int` | @id @default(autoincrement()) |
| `tenantId` | `String` | @default("default") @map("tenant_id") |
| `workflowId` | `Int` | @map("workflow_id") |
| `stepOrder` | `Int` | @map("step_order") |
| `approverType` | `String` | @map("approver_type") // USER | ROLE | MANAGER | CUSTOM |
| `approverId` | `Int?` | @map("approver_id") // userId or roleId |
| `approverRole` | `String?` | @map("approver_role") |
| `escalateAfterHours` | `Int?` | @map("escalate_after_hours") |
| `workflow` | `ApprovalWorkflow` | @relation(fields: [workflowId], references: [id]) |

## Model: `Quotation`
| الحقل | النوع | الوصف |
|---|---|---|
| `id` | `Int` | @id @default(autoincrement()) |
| `tenantId` | `String` | @default("default") @map("tenant_id") |
| `quotationNumber` | `String` | @map("quotation_number") |
| `customerId` | `Int?` | @map("customer_id") |
| `quotationDate` | `String` | @map("quotation_date") |
| `expiryDate` | `String?` | @map("expiry_date") |
| `total` | `Decimal` | @default(0) |
| `taxAmount` | `Decimal` | @default(0) @map("tax_amount") @db.Decimal(20, 4) |
| `grandTotal` | `Decimal` | @default(0) @map("grand_total") @db.Decimal(20, 4) |
| `status` | `String` | @default("draft") |
| `notes` | `String?` |  |
| `createdBy` | `Int?` | @map("created_by") |
| `createdAt` | `DateTime` | @default(now()) @map("created_at") |
| `items` | `QuotationItem[]` |  |

## Model: `QuotationItem`
| الحقل | النوع | الوصف |
|---|---|---|
| `id` | `Int` | @id @default(autoincrement()) |
| `tenantId` | `String` | @default("default") @map("tenant_id") |
| `quotationId` | `Int` | @map("quotation_id") |
| `productId` | `Int?` | @map("product_id") |
| `description` | `String?` |  |
| `quantity` | `Decimal` | @default(1) |
| `unitPrice` | `Decimal` | @default(0) @map("unit_price") @db.Decimal(20, 4) |
| `taxRate` | `Decimal` | @default(15) @map("tax_rate") |
| `total` | `Decimal` | @default(0) |
| `quotation` | `Quotation` | @relation(fields: [quotationId], references: [id], onDelete: Cascade) |

## Model: `Installment`
| الحقل | النوع | الوصف |
|---|---|---|
| `id` | `Int` | @id @default(autoincrement()) |
| `tenantId` | `String` | @default("default") @map("tenant_id") |
| `invoiceId` | `Int` | @map("invoice_id") |
| `customerId` | `Int` | @map("customer_id") |
| `totalAmount` | `Decimal` | @map("total_amount") @db.Decimal(20, 4) |
| `paidAmount` | `Decimal` | @default(0) @map("paid_amount") @db.Decimal(20, 4) |
| `remaining` | `Decimal` | @db.Decimal(20, 4) |
| `installmentCount` | `Int` | @default(1) @map("installment_count") |
| `status` | `String` | @default("active") |
| `createdAt` | `DateTime` | @default(now()) @map("created_at") |
| `customer` | `Customer` | @relation(fields: [customerId], references: [id]) |
| `payments` | `InstallmentPayment[]` |  |

## Model: `InstallmentPayment`
| الحقل | النوع | الوصف |
|---|---|---|
| `id` | `Int` | @id @default(autoincrement()) |
| `tenantId` | `String` | @default("default") @map("tenant_id") |
| `installmentId` | `Int` | @map("installment_id") |
| `paymentDate` | `String` | @map("payment_date") |
| `dueDate` | `String` | @map("due_date") |
| `amount` | `Decimal` |  |
| `paid` | `Boolean` | @default(false) |
| `paidDate` | `String?` | @map("paid_date") |
| `installment` | `Installment` | @relation(fields: [installmentId], references: [id], onDelete: Cascade) |
| `deletedAt` | `DateTime?` | // P1.2 soft-delete ط·آ·ط¢آ·ط·آ¢ط¢آ·ط·آ·ط¢آ¢ط·آ¢ط¢آ·ط·آ·ط¢آ·ط·آ¢ط¢آ¢ط·آ·ط¢آ¢ط·آ¢ط¢آ·ط·آ·ط¢آ·ط·آ¢ط¢آ·ط·آ·ط¢آ¢ط·آ¢ط¢آ¢ط·آ·ط¢آ·ط·آ¢ط¢آ¢ط·آ·ط¢آ¢ط·آ¢ط¢آ£ط·آ·ط¢آ·ط·آ¢ط¢آ·ط·آ·ط¢آ¢ط·آ¢ط¢آ·ط·آ·ط¢آ·ط·آ¢ط¢آ¢ط·آ·ط¢آ¢ط·آ¢ط¢آ¢ط·آ·ط¢آ·ط·آ¢ط¢آ·ط·آ·ط¢آ¢ط·آ¢ط¢آ¢ط·آ·ط¢آ·ط·آ¢ط¢آ¢ط·آ·ط¢آ¢ط·آ¢ط¢آ¢ط·آ·ط¢آ·ط·آ¢ط¢آ·ط·آ·ط¢آ¢ط·آ¢ط¢آ·ط·آ·ط¢آ·ط·آ¢ط¢آ¢ط·آ·ط¢آ¢ط·آ¢ط¢آ£ط·آ·ط¢آ·ط·آ¢ط¢آ·ط·آ·ط¢آ¢ط·آ¢ط¢آ¢ط·آ·ط¢آ·ط·آ¢ط¢آ¢ط·آ·ط¢آ¢ط·آ¢ط¢آ¢ط·آ·ط¢آ·ط·آ¢ط¢آ·ط·آ·ط¢آ¢ط·آ¢ط¢آ£ط·آ·ط¢آ·ط·آ¢ط¢آ¢ط·آ·ط¢آ¢ط·آ¢ط¢آ¢ط·آ·ط¢آ·ط·آ¢ط¢آ£ط·آ·ط¢آ¢ط·آ¢ط¢آ¢ط·آ·ط¢آ£ط·آ¢ط¢آ¢ط·آ£ط¢آ¢ط£آ¢أ¢â€ڑآ¬ط¹â€کط·آ¢ط¢آ¬ط·آ·ط¢آ¹ط£آ¢أ¢â€ڑآ¬ط¹آ©ط·آ·ط¢آ·ط·آ¢ط¢آ¢ط·آ·ط¢آ¢ط·آ¢ط¢آ¬ط·آ·ط¢آ·ط·آ¢ط¢آ·ط·آ·ط¢آ¢ط·آ¢ط¢آ¹ط·آ·ط¢آ£ط·آ¢ط¢آ¢ط·آ£ط¢آ¢ط£آ¢أ¢â€ڑآ¬ط¹â€کط·آ¢ط¢آ¬ط·آ·ط¢آ¹ط·آ¢ط¢آ©ط·آ·ط¢آ·ط·آ¢ط¢آ·ط·آ·ط¢آ¢ط·آ¢ط¢آ·ط·آ·ط¢آ·ط·آ¢ط¢آ¢ط·آ·ط¢آ¢ط·آ¢ط¢آ¢ط·آ·ط¢آ·ط·آ¢ط¢آ·ط·آ·ط¢آ¢ط·آ¢ط¢آ¢ط·آ·ط¢آ·ط·آ¢ط¢آ¢ط·آ·ط¢آ¢ط·آ¢ط¢آ¬ط·آ·ط¢آ·ط·آ¢ط¢آ·ط·آ·ط¢آ¢ط·آ¢ط¢آ·ط·آ·ط¢آ·ط·آ¢ط¢آ¢ط·آ·ط¢آ¢ط·آ¢ط¢آ£ط·آ·ط¢آ·ط·آ¢ط¢آ·ط·آ·ط¢آ¢ط·آ¢ط¢آ¢ط·آ·ط¢آ·ط·آ¢ط¢آ¢ط·آ·ط¢آ¢ط·آ¢ط¢آ¢ط·آ·ط¢آ·ط·آ¢ط¢آ·ط·آ·ط¢آ¢ط·آ¢ط¢آ£ط·آ·ط¢آ·ط·آ¢ط¢آ¢ط·آ·ط¢آ¢ط·آ¢ط¢آ¢ط·آ·ط¢آ·ط·آ¢ط¢آ£ط·آ·ط¢آ¢ط·آ¢ط¢آ¢ط·آ·ط¢آ£ط·آ¢ط¢آ¢ط·آ£ط¢آ¢ط£آ¢أ¢â‚¬ع‘ط¢آ¬ط·آ¹أ¢â‚¬ع©ط·آ·ط¢آ¢ط·آ¢ط¢آ¬ط·آ·ط¢آ·ط·آ¢ط¢آ¹ط·آ£ط¢آ¢ط£آ¢أ¢â‚¬ع‘ط¢آ¬ط·آ¹ط¢آ©ط·آ·ط¢آ·ط·آ¢ط¢آ·ط·آ·ط¢آ¢ط·آ¢ط¢آ¢ط·آ·ط¢آ·ط·آ¢ط¢آ¢ط·آ·ط¢آ¢ط·آ¢ط¢آ¬ط·آ·ط¢آ·ط·آ¢ط¢آ·ط·آ·ط¢آ¢ط·آ¢ط¢آ£ط·آ·ط¢آ·ط·آ¢ط¢آ¢ط·آ·ط¢آ¢ط·آ¢ط¢آ¢ط·آ·ط¢آ·ط·آ¢ط¢آ£ط·آ·ط¢آ¢ط·آ¢ط¢آ¢ط·آ·ط¢آ£ط·آ¢ط¢آ¢ط·آ£ط¢آ¢ط£آ¢أ¢â€ڑآ¬ط¹â€کط·آ¢ط¢آ¬ط·آ·ط¢آ¹ط£آ¢أ¢â€ڑآ¬ط¹آ©ط·آ·ط¢آ·ط·آ¢ط¢آ¢ط·آ·ط¢آ¢ط·آ¢ط¢آ¬ط·آ·ط¢آ·ط·آ¢ط¢آ·ط·آ·ط¢آ¢ط·آ¢ط¢آ¥ط·آ·ط¢آ£ط·آ¢ط¢آ¢ط·آ£ط¢آ¢ط£آ¢أ¢â€ڑآ¬ط¹â€کط·آ¢ط¢آ¬ط·آ£ط¢آ¢ط£آ¢أ¢â€ڑآ¬أ¢â‚¬ع†ط·آ¢ط¢آ¢ do not use hard DELETE |

## Model: `LoyaltyPoint`
| الحقل | النوع | الوصف |
|---|---|---|
| `id` | `Int` | @id @default(autoincrement()) |
| `tenantId` | `String` | @default("default") @map("tenant_id") |
| `customerId` | `Int` | @map("customer_id") |
| `points` | `Int` | @default(0) |
| `totalEarned` | `Int` | @default(0) @map("total_earned") |
| `totalRedeemed` | `Int` | @default(0) @map("total_redeemed") |
| `tier` | `String` | @default("bronze") |
| `customer` | `Customer` | @relation(fields: [customerId], references: [id]) |

## Model: `LoyaltyTransaction`
| الحقل | النوع | الوصف |
|---|---|---|
| `id` | `Int` | @id @default(autoincrement()) |
| `tenantId` | `String` | @default("default") @map("tenant_id") |
| `customerId` | `Int` | @map("customer_id") |
| `invoiceId` | `Int?` | @map("invoice_id") |
| `points` | `Int` |  |
| `type` | `String` | // earned, redeemed |
| `description` | `String?` |  |
| `createdAt` | `DateTime` | @default(now()) @map("created_at") |

## Model: `Promotion`
| الحقل | النوع | الوصف |
|---|---|---|
| `id` | `Int` | @id @default(autoincrement()) |
| `tenantId` | `String` | @default("default") @map("tenant_id") |
| `name` | `String` |  |
| `type` | `String` | // bogo, percentage, fixed, quantity, category, happy_hour |
| `discountType` | `String` | @default("percentage") @map("discount_type") |
| `discountValue` | `Decimal` | @default(0) @map("discount_value") |
| `buyQty` | `Int` | @default(0) @map("buy_qty") |
| `getQty` | `Int` | @default(0) @map("get_qty") |
| `minQty` | `Int` | @default(0) @map("min_qty") |
| `categoryId` | `Int` | @default(0) @map("category_id") |
| `productId` | `Int` | @default(0) @map("product_id") |
| `startDate` | `String?` | @map("start_date") |
| `endDate` | `String?` | @map("end_date") |
| `startTime` | `String?` | @map("start_time") |
| `endTime` | `String?` | @map("end_time") |
| `isActive` | `Boolean` | @default(true) @map("is_active") |
| `createdAt` | `DateTime` | @default(now()) @map("created_at") |

## Model: `Coupon`
| الحقل | النوع | الوصف |
|---|---|---|
| `id` | `Int` | @id @default(autoincrement()) |
| `tenantId` | `String` | @default("default") @map("tenant_id") |
| `code` | `String` | @unique |
| `discountType` | `String` | @default("percentage") @map("discount_type") |
| `discountValue` | `Decimal` | @default(0) @map("discount_value") |
| `minOrder` | `Decimal` | @default(0) @map("min_order") @db.Decimal(20, 4) |
| `maxUses` | `Int` | @default(0) @map("max_uses") |
| `usedCount` | `Int` | @default(0) @map("used_count") |
| `startDate` | `String?` | @map("start_date") |
| `endDate` | `String?` | @map("end_date") |
| `isActive` | `Boolean` | @default(true) @map("is_active") |
| `createdAt` | `DateTime` | @default(now()) @map("created_at") |
| `usages` | `CouponUsage[]` |  |

## Model: `CouponUsage`
| الحقل | النوع | الوصف |
|---|---|---|
| `id` | `Int` | @id @default(autoincrement()) |
| `tenantId` | `String` | @default("default") @map("tenant_id") |
| `couponId` | `Int` | @map("coupon_id") |
| `invoiceId` | `Int?` | @map("invoice_id") |
| `customerId` | `Int?` | @map("customer_id") |
| `discountAmount` | `Decimal` | @default(0) @map("discount_amount") @db.Decimal(20, 4) |
| `usedAt` | `DateTime` | @default(now()) @map("used_at") |
| `coupon` | `Coupon` | @relation(fields: [couponId], references: [id]) |

## Model: `GiftCard`
| الحقل | النوع | الوصف |
|---|---|---|
| `id` | `Int` | @id @default(autoincrement()) |
| `tenantId` | `String` | @default("default") @map("tenant_id") |
| `code` | `String` | @unique |
| `initialBalance` | `Decimal` | @map("initial_balance") @db.Decimal(20, 4) |
| `currentBalance` | `Decimal` | @map("current_balance") @db.Decimal(20, 4) |
| `customerId` | `Int?` | @map("customer_id") |
| `expiryDate` | `String?` | @map("expiry_date") |
| `isActive` | `Boolean` | @default(true) @map("is_active") |
| `createdAt` | `DateTime` | @default(now()) @map("created_at") |

## Model: `Stocktake`
| الحقل | النوع | الوصف |
|---|---|---|
| `id` | `Int` | @id @default(autoincrement()) |
| `tenantId` | `String` | @default("default") @map("tenant_id") |
| `stocktakeDate` | `String` | @map("stocktake_date") |
| `totalItems` | `Int` | @default(0) @map("total_items") |
| `matched` | `Int` | @default(0) |
| `over` | `Int` | @default(0) |
| `short` | `Int` | @default(0) |
| `status` | `String` | @default("completed") |
| `notes` | `String?` |  |
| `createdBy` | `Int?` | @map("created_by") |
| `createdAt` | `DateTime` | @default(now()) @map("created_at") |
| `items` | `StocktakeItem[]` |  |

## Model: `StocktakeItem`
| الحقل | النوع | الوصف |
|---|---|---|
| `id` | `Int` | @id @default(autoincrement()) |
| `tenantId` | `String` | @default("default") @map("tenant_id") |
| `stocktakeId` | `Int` | @map("stocktake_id") |
| `productId` | `Int` | @map("product_id") |
| `systemQty` | `Decimal` | @default(0) @map("system_qty") @db.Decimal(20, 4) |
| `actualQty` | `Decimal` | @default(0) @map("actual_qty") @db.Decimal(20, 4) |
| `difference` | `Decimal` | @default(0) @db.Decimal(20, 4) |
| `status` | `String` | @default("matched") |
| `stocktake` | `Stocktake` | @relation(fields: [stocktakeId], references: [id], onDelete: Cascade) |

## Model: `Branch`
| الحقل | النوع | الوصف |
|---|---|---|
| `id` | `Int` | @id @default(autoincrement()) |
| `tenantId` | `String` | @default("default") @map("tenant_id") |
| `companyId` | `Int` | @map("company_id") |
| `name` | `String` |  |
| `nameEn` | `String?` | @map("name_en") |
| `address` | `String?` |  |
| `phone` | `String?` |  |
| `isActive` | `Boolean` | @default(true) @map("is_active") |
| `createdAt` | `DateTime` | @default(now()) @map("created_at") |
| `company` | `Company` | @relation(fields: [companyId], references: [id]) |
| `users` | `User[]` |  |
| `stocks` | `Stock[]` |  |
| `salesInvoices` | `SalesInvoice[]` |  |
| `salesReturns` | `SalesReturn[]` |  |
| `purchases` | `PurchaseInvoice[]` |  |
| `purchaseOrders` | `PurchaseOrder[]` |  |
| `expenses` | `Expense[]` |  |
| `treasury` | `Treasury[]` |  |
| `journals` | `JournalEntry[]` |  |
| `shifts` | `Shift[]` |  |
| `bankAccounts` | `BankAccount[]` |  |
| `employees` | `Employee[]` |  |
| `costCenters` | `CostCenter[]` |  |
| `purchaseReturns` | `PurchaseReturn[]` |  |
| `deletedAt` | `DateTime?` | @map("deleted_at") |
| `deletedBy` | `String?` | @map("deleted_by") |

## Model: `Shift`
| الحقل | النوع | الوصف |
|---|---|---|
| `id` | `Int` | @id @default(autoincrement()) |
| `tenantId` | `String` | @default("default") @map("tenant_id") |
| `userId` | `Int` | @map("user_id") |
| `stockId` | `Int?` | @map("stock_id") |
| `startTime` | `DateTime` | @default(now()) @map("start_time") |
| `endTime` | `DateTime?` | @map("end_time") |
| `status` | `String` | @default("open") // open, closed |
| `startingCash` | `Decimal` | @default(0) @map("starting_cash") @db.Decimal(20, 4) |
| `endingCashExpected` | `Decimal?` | @map("ending_cash_expected") @db.Decimal(20, 4) |
| `endingCashActual` | `Decimal?` | @map("ending_cash_actual") @db.Decimal(20, 4) |
| `difference` | `Decimal?` | @db.Decimal(20, 4) |
| `notes` | `String?` |  |
| `user` | `User` | @relation(fields: [userId], references: [id]) |
| `invoices` | `SalesInvoice[]` |  |
| `salesReturns` | `SalesReturn[]` | // For returning money from the drawer |
| `branchId` | `Int?` | @map("branch_id") |
| `branch` | `Branch?` | @relation(fields: [branchId], references: [id]) |

## Model: `Company`
| الحقل | النوع | الوصف |
|---|---|---|
| `id` | `Int` | @id @default(autoincrement()) |
| `tenantId` | `String` | @default("default") @map("tenant_id") |
| `name` | `String` |  |
| `nameEn` | `String?` | @map("name_en") |
| `taxNumber` | `String?` | @map("tax_number") |
| `commercialRecord` | `String?` | @map("commercial_record") |
| `address` | `String?` |  |
| `logoPath` | `String?` | @map("logo_path") |
| `ownershipPct` | `Decimal` | @default(100.0) @map("ownership_pct") @db.Decimal(8, 4) |
| `createdAt` | `DateTime` | @default(now()) @map("created_at") |
| `branches` | `Branch[]` |  |
| `subscriptions` | `Subscription[]` |  |
| `deletedAt` | `DateTime?` | @map("deleted_at") |
| `deletedBy` | `String?` | @map("deleted_by") |

## Model: `Subscription`
| الحقل | النوع | الوصف |
|---|---|---|
| `id` | `Int` | @id @default(autoincrement()) |
| `tenantId` | `String` | @default("default") @map("tenant_id") |
| `companyId` | `Int` | @map("company_id") |
| `planLabel` | `String` | @default("BASIC") @map("plan_label") // BASIC, PRO, ENTERPRISE |
| `status` | `String` | @default("ACTIVE") // TRIAL, ACTIVE, EXPIRED, SUSPENDED |
| `startDate` | `DateTime` | @default(now()) @map("start_date") |
| `endDate` | `DateTime` | @map("end_date") |
| `notes` | `String?` |  |
| `createdAt` | `DateTime` | @default(now()) @map("created_at") |
| `company` | `Company` | @relation(fields: [companyId], references: [id]) |
| `payments` | `SubscriptionPayment[]` |  |
| `deletedAt` | `DateTime?` | @map("deleted_at") |
| `deletedBy` | `String?` | @map("deleted_by") |

## Model: `SubscriptionPayment`
| الحقل | النوع | الوصف |
|---|---|---|
| `id` | `Int` | @id @default(autoincrement()) |
| `tenantId` | `String` | @default("default") @map("tenant_id") |
| `subscriptionId` | `Int` | @map("subscription_id") |
| `amount` | `Decimal` | @default(0) |
| `paymentMethod` | `String` | @default("bank_transfer") @map("payment_method") // bank_transfer, online |
| `reference` | `String?` |  |
| `paidAt` | `DateTime` | @default(now()) @map("paid_at") |
| `isConfirmed` | `Boolean` | @default(true) @map("is_confirmed") |
| `subscription` | `Subscription` | @relation(fields: [subscriptionId], references: [id], onDelete: Cascade) |

## Model: `Recipe`
| الحقل | النوع | الوصف |
|---|---|---|
| `id` | `Int` | @id @default(autoincrement()) |
| `tenantId` | `String` | @default("default") @map("tenant_id") |
| `finishedProductId` | `Int` | @map("finished_product_id") |
| `name` | `String` |  |
| `totalCost` | `Decimal` | @default(0) @map("total_cost") @db.Decimal(20, 4) |
| `isActive` | `Boolean` | @default(true) @map("is_active") |
| `scrapPercentage` | `Decimal` | @default(0) @map("scrap_percentage") @db.Decimal(8, 4) |
| `expectedYieldQty` | `Decimal?` | @map("expected_yield_qty") @db.Decimal(20, 4) |
| `expectedYieldWeight` | `Decimal?` | @map("expected_yield_weight") @db.Decimal(20, 4) |
| `weightBefore` | `Decimal?` | @map("weight_before") @db.Decimal(20, 4) |
| `weightAfter` | `Decimal?` | @map("weight_after") @db.Decimal(20, 4) |
| `qtyBefore` | `Decimal?` | @map("qty_before") @db.Decimal(20, 4) |
| `qtyAfter` | `Decimal?` | @map("qty_after") @db.Decimal(20, 4) |
| `createdAt` | `DateTime` | @default(now()) @map("created_at") |
| `finishedProduct` | `Product` | @relation("RecipeFinishedProduct", fields: [finishedProductId], references: [id]) |
| `ingredients` | `RecipeIngredient[]` |  |
| `orders` | `ManufacturingOrder[]` |  |
| `operations` | `RecipeOperation[]` |  |
| `byProducts` | `RecipeByProduct[]` |  |
| `BOMVersion` | `BOMVersion[]` |  |

## Model: `RecipeIngredient`
| الحقل | النوع | الوصف |
|---|---|---|
| `id` | `Int` | @id @default(autoincrement()) |
| `tenantId` | `String` | @default("default") @map("tenant_id") |
| `recipeId` | `Int` | @map("recipe_id") |
| `rawProductId` | `Int` | @map("raw_product_id") |
| `quantity` | `Decimal` | @default(1) |
| `estimatedCost` | `Decimal` | @default(0) @map("estimated_cost") @db.Decimal(20, 4) |
| `scrapPercentage` | `Decimal` | @default(0) @map("scrap_percentage") @db.Decimal(8, 4) |
| `weightBefore` | `Decimal?` | @map("weight_before") @db.Decimal(20, 4) |
| `weightAfter` | `Decimal?` | @map("weight_after") @db.Decimal(20, 4) |
| `qtyBefore` | `Decimal?` | @map("qty_before") @db.Decimal(20, 4) |
| `qtyAfter` | `Decimal?` | @map("qty_after") @db.Decimal(20, 4) |
| `recipe` | `Recipe` | @relation(fields: [recipeId], references: [id], onDelete: Cascade) |
| `rawProduct` | `Product` | @relation("RecipeRawProduct", fields: [rawProductId], references: [id]) |

## Model: `ManufacturingOrder`
| الحقل | النوع | الوصف |
|---|---|---|
| `id` | `Int` | @id @default(autoincrement()) |
| `tenantId` | `String` | @default("default") @map("tenant_id") |
| `orderNumber` | `String` | @map("order_number") |
| `recipeId` | `Int` | @map("recipe_id") |
| `machineId` | `Int?` | @map("machine_id") |
| `quantityToProduce` | `Decimal` | @map("quantity_to_produce") @db.Decimal(20, 4) |
| `startDate` | `DateTime` | @default(now()) @map("start_date") |
| `endDate` | `DateTime?` | @map("end_date") |
| `status` | `String` | @default("draft") // draft, in_progress, completed, cancelled |
| `totalCost` | `Decimal` | @default(0) @map("total_cost") @db.Decimal(20, 4) |
| `wipAccountId` | `Int?` | @map("wip_account_id") // Link to WIP Account if applicable |
| `stockId` | `Int` | @default(1) @map("stock_id") |
| `userId` | `Int?` | @map("user_id") |
| `notes` | `String?` |  |
| `yieldQty` | `Decimal?` | @map("yield_qty") @db.Decimal(20, 4) |
| `yieldWeight` | `Decimal?` | @map("yield_weight") @db.Decimal(20, 4) |
| `journalEntryId` | `Int?` | @map("journal_entry_id") |
| `recipe` | `Recipe` | @relation(fields: [recipeId], references: [id]) |
| `machine` | `Machine?` | @relation(fields: [machineId], references: [id]) |
| `wastages` | `ManufacturingWastage[]` |  |
| `costs` | `ManufacturingCost[]` |  |
| `qualityChecks` | `QualityCheck[]` |  |
| `VarianceTransaction` | `VarianceTransaction[]` |  |

## Model: `Machine`
| الحقل | النوع | الوصف |
|---|---|---|
| `id` | `Int` | @id @default(autoincrement()) |
| `tenantId` | `String` | @default("default") @map("tenant_id") |
| `name` | `String` |  |
| `code` | `String?` | @unique |
| `hourlyCost` | `Decimal` | @default(0) @map("hourly_cost") @db.Decimal(20, 4) |
| `energyCost` | `Decimal` | @default(0) @map("energy_cost") @db.Decimal(20, 4) // For Green Manufacturing |
| `carbonRate` | `Decimal` | @default(0) @map("carbon_rate") @db.Decimal(20, 4) // kg CO2 per hour |
| `status` | `String` | @default("active") // active, maintenance, offline |
| `branchId` | `Int?` | @map("branch_id") |
| `createdAt` | `DateTime` | @default(now()) @map("created_at") |
| `orders` | `ManufacturingOrder[]` |  |
| `workCenters` | `WorkCenter[]` |  |
| `maintenanceLogs` | `MachineMaintenance[]` |  |
| `telemetry` | `MachineTelemetry[]` |  |

## Model: `ManufacturingWastage`
| الحقل | النوع | الوصف |
|---|---|---|
| `id` | `Int` | @id @default(autoincrement()) |
| `tenantId` | `String` | @default("default") @map("tenant_id") |
| `manufacturingOrderId` | `Int` | @map("manufacturing_order_id") |
| `rawProductId` | `Int` | @map("raw_product_id") |
| `lostQuantity` | `Decimal` | @map("lost_quantity") @db.Decimal(20, 4) |
| `wastedCost` | `Decimal` | @default(0) @map("wasted_cost") @db.Decimal(20, 4) |
| `reason` | `String?` |  |
| `wastageWeight` | `Decimal?` | @map("wastage_weight") @db.Decimal(20, 4) |
| `wastagePhotoUrl` | `String?` | @map("wastage_photo_url") |
| `serialOrBatchNumber` | `String?` | @map("serial_or_batch_number") |
| `journalEntryId` | `Int?` | @map("journal_entry_id") |
| `reportedAt` | `DateTime` | @default(now()) @map("reported_at") |
| `order` | `ManufacturingOrder` | @relation(fields: [manufacturingOrderId], references: [id], onDelete: Cascade) |
| `rawProduct` | `Product` | @relation(fields: [rawProductId], references: [id]) |

## Model: `WorkCenter`
| الحقل | النوع | الوصف |
|---|---|---|
| `id` | `Int` | @id @default(autoincrement()) |
| `tenantId` | `String` | @default("default") @map("tenant_id") |
| `name` | `String` |  |
| `code` | `String?` | @unique |
| `costPerHour` | `Decimal` | @default(0) @map("cost_per_hour") @db.Decimal(20, 4) |
| `capacity` | `Decimal` | @default(1) @db.Decimal(20, 4) |
| `isActive` | `Boolean` | @default(true) @map("is_active") |
| `machineId` | `Int?` | @map("machine_id") |
| `operations` | `RecipeOperation[]` |  |
| `machine` | `Machine?` | @relation(fields: [machineId], references: [id]) |

## Model: `RecipeOperation`
| الحقل | النوع | الوصف |
|---|---|---|
| `id` | `Int` | @id @default(autoincrement()) |
| `tenantId` | `String` | @default("default") @map("tenant_id") |
| `recipeId` | `Int` | @map("recipe_id") |
| `workCenterId` | `Int` | @map("work_center_id") |
| `operationName` | `String` | @map("operation_name") |
| `sequenceNumber` | `Int` | @map("sequence_number") |
| `durationMinutes` | `Decimal` | @default(0) @map("duration_minutes") @db.Decimal(20, 4) |
| `recipe` | `Recipe` | @relation(fields: [recipeId], references: [id], onDelete: Cascade) |
| `workCenter` | `WorkCenter` | @relation(fields: [workCenterId], references: [id]) |

## Model: `RecipeByProduct`
| الحقل | النوع | الوصف |
|---|---|---|
| `id` | `Int` | @id @default(autoincrement()) |
| `tenantId` | `String` | @default("default") @map("tenant_id") |
| `recipeId` | `Int` | @map("recipe_id") |
| `productId` | `Int` | @map("product_id") |
| `quantity` | `Decimal` | @default(0) |
| `costShare` | `Decimal` | @default(0) @map("cost_share_percent") @db.Decimal(20, 4) // Percentage of total cost assigned to this byproduct |
| `recipe` | `Recipe` | @relation(fields: [recipeId], references: [id], onDelete: Cascade) |
| `product` | `Product` | @relation(fields: [productId], references: [id]) |

## Model: `ManufacturingCost`
| الحقل | النوع | الوصف |
|---|---|---|
| `id` | `Int` | @id @default(autoincrement()) |
| `tenantId` | `String` | @default("default") @map("tenant_id") |
| `manufacturingOrderId` | `Int` | @map("manufacturing_order_id") |
| `costType` | `String` | // material, labor, overhead, scrap |
| `amount` | `Decimal` |  |
| `description` | `String?` |  |
| `createdAt` | `DateTime` | @default(now()) @map("created_at") |
| `order` | `ManufacturingOrder` | @relation(fields: [manufacturingOrderId], references: [id], onDelete: Cascade) |

## Model: `QualityCheck`
| الحقل | النوع | الوصف |
|---|---|---|
| `id` | `Int` | @id @default(autoincrement()) |
| `tenantId` | `String` | @default("default") @map("tenant_id") |
| `manufacturingOrderId` | `Int` | @map("manufacturing_order_id") |
| `inspectorName` | `String` | @map("inspector_name") |
| `checkType` | `String` | // pre_production, in_process, final_inspection |
| `status` | `String` | // pass, fail, rework |
| `notes` | `String?` |  |
| `createdAt` | `DateTime` | @default(now()) @map("created_at") |
| `order` | `ManufacturingOrder` | @relation(fields: [manufacturingOrderId], references: [id], onDelete: Cascade) |

## Model: `MachineMaintenance`
| الحقل | النوع | الوصف |
|---|---|---|
| `id` | `Int` | @id @default(autoincrement()) |
| `tenantId` | `String` | @default("default") @map("tenant_id") |
| `machineId` | `Int` | @map("machine_id") |
| `maintenanceType` | `String` | // preventive, repair |
| `description` | `String` |  |
| `cost` | `Decimal` | @default(0) @db.Decimal(20, 4) |
| `scheduledDate` | `DateTime` | @map("scheduled_date") |
| `completedDate` | `DateTime?` | @map("completed_date") |
| `status` | `String` | @default("pending") // pending, completed |
| `createdAt` | `DateTime` | @default(now()) @map("created_at") |
| `machine` | `Machine` | @relation(fields: [machineId], references: [id], onDelete: Cascade) |

## Model: `MachineTelemetry`
| الحقل | النوع | الوصف |
|---|---|---|
| `id` | `Int` | @id @default(autoincrement()) |
| `tenantId` | `String` | @default("default") @map("tenant_id") |
| `machineId` | `Int` | @map("machine_id") |
| `temperature` | `Float?` |  |
| `vibration` | `Float?` |  |
| `piecesProduced` | `Int` | @default(0) @map("pieces_produced") |
| `recordedAt` | `DateTime` | @default(now()) @map("recorded_at") |
| `machine` | `Machine` | @relation(fields: [machineId], references: [id], onDelete: Cascade) |

## Model: `TraceabilityLog`
| الحقل | النوع | الوصف |
|---|---|---|
| `id` | `Int` | @id @default(autoincrement()) |
| `tenantId` | `String` | @default("default") @map("tenant_id") |
| `orderId` | `Int` | @map("order_id") |
| `rawBatchId` | `Int?` | @map("raw_batch_id") |
| `finishedBatchId` | `Int?` | @map("finished_batch_id") |
| `action` | `String` | // consumed, produced |
| `recordedAt` | `DateTime` | @default(now()) @map("recorded_at") |

## Model: `LetterOfCredit`
| الحقل | النوع | الوصف |
|---|---|---|
| `id` | `Int` | @id @default(autoincrement()) |
| `tenantId` | `String` | @default("default") @map("tenant_id") |
| `lcNumber` | `String` | @unique @map("lc_number") |
| `bankId` | `Int` | @map("bank_id") |
| `supplierId` | `Int` | @map("supplier_id") |
| `amount` | `Decimal` |  |
| `currencyId` | `Int` | @map("currency_id") |
| `exchangeRate` | `Decimal` | @default(1.0) @map("exchange_rate") @db.Decimal(18, 8) |
| `openDate` | `DateTime` | @default(now()) @map("open_date") |
| `expiryDate` | `DateTime` | @map("expiry_date") |
| `status` | `String` | @default("draft") // draft, open, shipped, closed |
| `marginPercent` | `Decimal` | @default(0) @map("margin_percent") @db.Decimal(8, 4) |
| `marginPaid` | `Decimal` | @default(0) @map("margin_paid") @db.Decimal(20, 4) |
| `portOfLoading` | `String?` | @map("port_of_loading") |
| `portOfDischarge` | `String?` | @map("port_of_discharge") |
| `notes` | `String?` |  |
| `createdAt` | `DateTime` | @default(now()) @map("created_at") |
| `bank` | `BankAccount` | @relation(fields: [bankId], references: [id]) |
| `supplier` | `Customer` | @relation(fields: [supplierId], references: [id]) |
| `currency` | `Currency` | @relation(fields: [currencyId], references: [id]) |
| `purchaseOrders` | `PurchaseOrder[]` |  |
| `landedCosts` | `LandedCost[]` |  |

## Model: `BankAccount`
| الحقل | النوع | الوصف |
|---|---|---|
| `id` | `Int` | @id @default(autoincrement()) |
| `tenantId` | `String` | @default("default") @map("tenant_id") |
| `branchId` | `Int?` | @map("branch_id") |
| `bankName` | `String` | @map("bank_name") |
| `accountName` | `String` | @map("account_name") |
| `accountNumber` | `String` | @map("account_number") |
| `iban` | `String?` |  |
| `currency` | `String` | @default("SAR") |
| `currentBalance` | `Decimal` | @default(0) @map("current_balance") @db.Decimal(20, 4) |
| `isActive` | `Boolean` | @default(true) @map("is_active") |
| `bankCode` | `String?` | // 'ALRAJHI' | 'NCB' | 'SAB' | 'SAMBA' | 'ANB' | 'BSF' |
| `preferredFileFormat` | `String?` |  |
| `fileEncoding` | `String` | @default("utf-8") |
| `fileColumnMapping` | `Json?` | // for csv-generic |
| `openBankingProvider` | `String?` | // 'LEAN' | 'TARABUT' | 'NONE' |
| `openBankingAccountId` | `String?` | // provider's account ID |
| `openBankingConsentExpiresAt` | `DateTime?` |  |
| `openBankingLastFetchAt` | `DateTime?` |  |
| `openBankingFetchEnabled` | `Boolean` | @default(false) |
| `openBankingFetchFrequency` | `String` | @default("DAILY") // 'HOURLY' | 'DAILY' | 'WEEKLY' |
| `intraDayBalance` | `Decimal?` | @db.Decimal(20, 4) |
| `intraDayBalanceUpdatedAt` | `DateTime?` |  |
| `branch` | `Branch?` | @relation(fields: [branchId], references: [id]) |
| `transactions` | `BankTransaction[]` |  |
| `lcs` | `LetterOfCredit[]` |  |
| `lgs` | `LetterOfGuarantee[]` |  |
| `statements` | `BankStatement[]` |  |
| `intraDayBalances` | `IntraDayBalance[]` |  |
| `BankReconRule` | `BankReconRule[]` |  |
| `BankReconPeriod` | `BankReconPeriod[]` |  |
| `deletedAt` | `DateTime?` | @map("deleted_at") |
| `deletedBy` | `String?` | @map("deleted_by") |

## Model: `BankTransaction`
| الحقل | النوع | الوصف |
|---|---|---|
| `id` | `Int` | @id @default(autoincrement()) |
| `tenantId` | `String` | @default("default") @map("tenant_id") |
| `bankAccountId` | `Int` | @map("bank_account_id") |
| `transactionDate` | `DateTime` | @map("transaction_date") |
| `type` | `String` |  |
| `amount` | `Decimal` |  |
| `description` | `String?` |  |
| `reference` | `String?` |  |
| `isReconciled` | `Boolean` | @default(false) @map("is_reconciled") |
| `reconciledWithId` | `Int?` | @map("reconciled_with_id") |
| `createdAt` | `DateTime` | @default(now()) @map("created_at") |
| `bankAccount` | `BankAccount` | @relation(fields: [bankAccountId], references: [id]) |

## Model: `ProductBatch`
| الحقل | النوع | الوصف |
|---|---|---|
| `id` | `Int` | @id @default(autoincrement()) |
| `tenantId` | `String` | @default("default") @map("tenant_id") |
| `productId` | `Int` | @map("product_id") |
| `batchNumber` | `String` | @map("batch_number") |
| `productionDate` | `DateTime?` | @map("production_date") |
| `expiryDate` | `DateTime?` | @map("expiry_date") |
| `initialQuantity` | `Decimal` | @map("initial_quantity") @db.Decimal(20, 4) |
| `currentQuantity` | `Decimal` | @map("current_quantity") @db.Decimal(20, 4) |
| `unitCost` | `Decimal` | @map("unit_cost") @db.Decimal(20, 4) |
| `status` | `String` | @default("AVAILABLE") // AVAILABLE, QUARANTINED, EXPIRED, RECALLED, CONSUMED |
| `supplierBatchNumber` | `String?` | @map("supplier_batch_number") |
| `qrCode` | `String?` | @map("qr_code") |
| `quarantineReason` | `String?` | @map("quarantine_reason") |
| `recalledAt` | `DateTime?` | @map("recalled_at") |
| `recallReason` | `String?` | @map("recall_reason") |
| `createdAt` | `DateTime` | @default(now()) @map("created_at") |
| `product` | `Product` | @relation(fields: [productId], references: [id]) |
| `salesDetails` | `SalesInvoiceDetail[]` |  |
| `stockMovements` | `StockMovement[]` |  |
| `grnDetails` | `GoodsReceiptNoteDetail[]` |  |
| `deliveryDetails` | `DeliveryNoteDetail[]` |  |

## Model: `CostCenter`
| الحقل | النوع | الوصف |
|---|---|---|
| `id` | `Int` | @id @default(autoincrement()) |
| `tenantId` | `String` | @default("default") @map("tenant_id") |
| `code` | `String` | @unique |
| `name` | `String` |  |
| `nameEn` | `String?` | @map("name_en") |
| `isActive` | `Boolean` | @default(true) @map("is_active") |
| `branchId` | `Int?` | @map("branch_id") |
| `createdAt` | `DateTime` | @default(now()) @map("created_at") |
| `branch` | `Branch?` | @relation(fields: [branchId], references: [id]) |
| `journalLines` | `JournalLine[]` |  |
| `expenses` | `Expense[]` |  |
| `salesInvoices` | `SalesInvoice[]` |  |
| `BudgetLine` | `BudgetLine[]` |  |
| `Encumbrance` | `Encumbrance[]` |  |
| `deletedAt` | `DateTime?` | @map("deleted_at") |
| `deletedBy` | `String?` | @map("deleted_by") |

## Model: `EmployeeLoan`
| الحقل | النوع | الوصف |
|---|---|---|
| `id` | `Int` | @id @default(autoincrement()) |
| `tenantId` | `String` | @default("default") @map("tenant_id") |
| `employeeId` | `Int` | @map("employee_id") |
| `amount` | `Decimal` |  |
| `monthlyDeduction` | `Decimal` | @map("monthly_deduction") @db.Decimal(20, 4) |
| `remainingAmount` | `Decimal` | @map("remaining_amount") @db.Decimal(20, 4) |
| `reason` | `String?` |  |
| `startDate` | `DateTime` | @map("start_date") |
| `status` | `String` | @default("active") // active, paid, suspended |
| `createdAt` | `DateTime` | @default(now()) @map("created_at") |
| `employee` | `Employee` | @relation(fields: [employeeId], references: [id]) |
| `deletedAt` | `DateTime?` | // P1.2 soft-delete ط·آ·ط¢آ·ط·آ¢ط¢آ·ط·آ·ط¢آ¢ط·آ¢ط¢آ·ط·آ·ط¢آ·ط·آ¢ط¢آ¢ط·آ·ط¢آ¢ط·آ¢ط¢آ·ط·آ·ط¢آ·ط·آ¢ط¢آ·ط·آ·ط¢آ¢ط·آ¢ط¢آ¢ط·آ·ط¢آ·ط·آ¢ط¢آ¢ط·آ·ط¢آ¢ط·آ¢ط¢آ£ط·آ·ط¢آ·ط·آ¢ط¢آ·ط·آ·ط¢آ¢ط·آ¢ط¢آ·ط·آ·ط¢آ·ط·آ¢ط¢آ¢ط·آ·ط¢آ¢ط·آ¢ط¢آ¢ط·آ·ط¢آ·ط·آ¢ط¢آ·ط·آ·ط¢آ¢ط·آ¢ط¢آ¢ط·آ·ط¢آ·ط·آ¢ط¢آ¢ط·آ·ط¢آ¢ط·آ¢ط¢آ¢ط·آ·ط¢آ·ط·آ¢ط¢آ·ط·آ·ط¢آ¢ط·آ¢ط¢آ·ط·آ·ط¢آ·ط·آ¢ط¢آ¢ط·آ·ط¢آ¢ط·آ¢ط¢آ£ط·آ·ط¢آ·ط·آ¢ط¢آ·ط·آ·ط¢آ¢ط·آ¢ط¢آ¢ط·آ·ط¢آ·ط·آ¢ط¢آ¢ط·آ·ط¢آ¢ط·آ¢ط¢آ¢ط·آ·ط¢آ·ط·آ¢ط¢آ·ط·آ·ط¢آ¢ط·آ¢ط¢آ£ط·آ·ط¢آ·ط·آ¢ط¢آ¢ط·آ·ط¢آ¢ط·آ¢ط¢آ¢ط·آ·ط¢آ·ط·آ¢ط¢آ£ط·آ·ط¢آ¢ط·آ¢ط¢آ¢ط·آ·ط¢آ£ط·آ¢ط¢آ¢ط·آ£ط¢آ¢ط£آ¢أ¢â€ڑآ¬ط¹â€کط·آ¢ط¢آ¬ط·آ·ط¢آ¹ط£آ¢أ¢â€ڑآ¬ط¹آ©ط·آ·ط¢آ·ط·آ¢ط¢آ¢ط·آ·ط¢آ¢ط·آ¢ط¢آ¬ط·آ·ط¢آ·ط·آ¢ط¢آ·ط·آ·ط¢آ¢ط·آ¢ط¢آ¹ط·آ·ط¢آ£ط·آ¢ط¢آ¢ط·آ£ط¢آ¢ط£آ¢أ¢â€ڑآ¬ط¹â€کط·آ¢ط¢آ¬ط·آ·ط¢آ¹ط·آ¢ط¢آ©ط·آ·ط¢آ·ط·آ¢ط¢آ·ط·آ·ط¢آ¢ط·آ¢ط¢آ·ط·آ·ط¢آ·ط·آ¢ط¢آ¢ط·آ·ط¢آ¢ط·آ¢ط¢آ¢ط·آ·ط¢آ·ط·آ¢ط¢آ·ط·آ·ط¢آ¢ط·آ¢ط¢آ¢ط·آ·ط¢آ·ط·آ¢ط¢آ¢ط·آ·ط¢آ¢ط·آ¢ط¢آ¬ط·آ·ط¢آ·ط·آ¢ط¢آ·ط·آ·ط¢آ¢ط·آ¢ط¢آ·ط·آ·ط¢آ·ط·آ¢ط¢آ¢ط·آ·ط¢آ¢ط·آ¢ط¢آ£ط·آ·ط¢آ·ط·آ¢ط¢آ·ط·آ·ط¢آ¢ط·آ¢ط¢آ¢ط·آ·ط¢آ·ط·آ¢ط¢آ¢ط·آ·ط¢آ¢ط·آ¢ط¢آ¢ط·آ·ط¢آ·ط·آ¢ط¢آ·ط·آ·ط¢آ¢ط·آ¢ط¢آ£ط·آ·ط¢آ·ط·آ¢ط¢آ¢ط·آ·ط¢آ¢ط·آ¢ط¢آ¢ط·آ·ط¢آ·ط·آ¢ط¢آ£ط·آ·ط¢آ¢ط·آ¢ط¢آ¢ط·آ·ط¢آ£ط·آ¢ط¢آ¢ط·آ£ط¢آ¢ط£آ¢أ¢â‚¬ع‘ط¢آ¬ط·آ¹أ¢â‚¬ع©ط·آ·ط¢آ¢ط·آ¢ط¢آ¬ط·آ·ط¢آ·ط·آ¢ط¢آ¹ط·آ£ط¢آ¢ط£آ¢أ¢â‚¬ع‘ط¢آ¬ط·آ¹ط¢آ©ط·آ·ط¢آ·ط·آ¢ط¢آ·ط·آ·ط¢آ¢ط·آ¢ط¢آ¢ط·آ·ط¢آ·ط·آ¢ط¢آ¢ط·آ·ط¢آ¢ط·آ¢ط¢آ¬ط·آ·ط¢آ·ط·آ¢ط¢آ·ط·آ·ط¢آ¢ط·آ¢ط¢آ£ط·آ·ط¢آ·ط·آ¢ط¢آ¢ط·آ·ط¢آ¢ط·آ¢ط¢آ¢ط·آ·ط¢آ·ط·آ¢ط¢آ£ط·آ·ط¢آ¢ط·آ¢ط¢آ¢ط·آ·ط¢آ£ط·آ¢ط¢آ¢ط·آ£ط¢آ¢ط£آ¢أ¢â€ڑآ¬ط¹â€کط·آ¢ط¢آ¬ط·آ·ط¢آ¹ط£آ¢أ¢â€ڑآ¬ط¹آ©ط·آ·ط¢آ·ط·آ¢ط¢آ¢ط·آ·ط¢آ¢ط·آ¢ط¢آ¬ط·آ·ط¢آ·ط·آ¢ط¢آ·ط·آ·ط¢آ¢ط·آ¢ط¢آ¥ط·آ·ط¢آ£ط·آ¢ط¢آ¢ط·آ£ط¢آ¢ط£آ¢أ¢â€ڑآ¬ط¹â€کط·آ¢ط¢آ¬ط·آ£ط¢آ¢ط£آ¢أ¢â€ڑآ¬أ¢â‚¬ع†ط·آ¢ط¢آ¢ do not use hard DELETE |

## Model: `Currency`
| الحقل | النوع | الوصف |
|---|---|---|
| `id` | `Int` | @id @default(autoincrement()) |
| `tenantId` | `String` | @default("default") @map("tenant_id") |
| `code` | `String` | @unique |
| `nameAr` | `String` | @map("name_ar") |
| `nameEn` | `String?` | @map("name_en") |
| `symbol` | `String?` |  |
| `exchangeRate` | `Decimal` | @default(1.0) @map("exchange_rate") @db.Decimal(18, 8) |
| `isDefault` | `Boolean` | @default(false) @map("is_default") |
| `isActive` | `Boolean` | @default(true) @map("is_active") |
| `createdAt` | `DateTime` | @default(now()) @map("created_at") |
| `updatedAt` | `DateTime` | @updatedAt @map("updated_at") |
| `exchangeRates` | `ExchangeRate[]` |  |
| `LetterOfCredit` | `LetterOfCredit[]` |  |
| `LandedCost` | `LandedCost[]` |  |
| `salesInvoices` | `SalesInvoice[]` |  |
| `purchaseInvoices` | `PurchaseInvoice[]` |  |

## Model: `ExchangeRate`
| الحقل | النوع | الوصف |
|---|---|---|
| `id` | `Int` | @id @default(autoincrement()) |
| `tenantId` | `String` | @default("default") @map("tenant_id") |
| `currencyId` | `Int` | @map("currency_id") |
| `rate` | `Decimal` | @db.Decimal(20, 4) |
| `date` | `DateTime` | @default(now()) |
| `currency` | `Currency` | @relation(fields: [currencyId], references: [id]) |

## Model: `ApprovalRule`
| الحقل | النوع | الوصف |
|---|---|---|
| `id` | `Int` | @id @default(autoincrement()) |
| `tenantId` | `String` | @default("default") @map("tenant_id") |
| `documentType` | `String` | @map("document_type") // e.g. 'PURCHASE_ORDER', 'JOURNAL_ENTRY' |
| `minAmount` | `Decimal` | @default(0) @map("min_amount") @db.Decimal(20, 4) |
| `maxAmount` | `Decimal?` | @map("max_amount") @db.Decimal(20, 4) // Null means unlimited |
| `approverRole` | `String` | @map("approver_role") // 'manager', 'admin' etc. Or use approverId |
| `approverId` | `Int?` | @map("approver_id") |
| `level` | `Int` | @default(1) // To support multi-step approvals |
| `isActive` | `Boolean` | @default(true) @map("is_active") |
| `createdAt` | `DateTime` | @default(now()) @map("created_at") |
| `approver` | `User?` | @relation("RuleApprover", fields: [approverId], references: [id]) |

## Model: `ApprovalRequest`
| الحقل | النوع | الوصف |
|---|---|---|
| `id` | `Int` | @id @default(autoincrement()) |
| `tenantId` | `String` | @default("default") @map("tenant_id") |
| `documentType` | `String` | @map("document_type") |
| `documentId` | `Int` | @map("document_id") |
| `status` | `String` | @default("pending") // pending, approved, rejected |
| `requestedBy` | `Int` | @map("requested_by") |
| `requestedAt` | `DateTime` | @default(now()) @map("requested_at") |
| `steps` | `ApprovalStep[]` |  |
| `requester` | `User` | @relation("ApprovalRequester", fields: [requestedBy], references: [id]) |

## Model: `ApprovalStep`
| الحقل | النوع | الوصف |
|---|---|---|
| `id` | `Int` | @id @default(autoincrement()) |
| `tenantId` | `String` | @default("default") @map("tenant_id") |
| `requestId` | `Int` | @map("request_id") |
| `approverId` | `Int?` | @map("approver_id") |
| `status` | `String` | @default("pending") // pending, approved, rejected |
| `notes` | `String?` |  |
| `actionDate` | `DateTime?` | @map("action_date") |
| `level` | `Int` | @default(1) |
| `request` | `ApprovalRequest` | @relation(fields: [requestId], references: [id], onDelete: Cascade) |
| `approver` | `User?` | @relation("StepApprover", fields: [approverId], references: [id]) |

## Model: `DocumentArchive`
| الحقل | النوع | الوصف |
|---|---|---|
| `id` | `Int` | @id @default(autoincrement()) |
| `tenantId` | `String` | @default("default") @map("tenant_id") |
| `documentType` | `String` | @map("document_type") // e.g. EMPLOYEE, CUSTOMER, PURCHASE_INVOICE |
| `documentId` | `Int` | @map("document_id") |
| `docName` | `String` | @map("doc_name") |
| `fileUrl` | `String` | @map("file_url") |
| `expiryDate` | `DateTime?` | @map("expiry_date") |
| `createdAt` | `DateTime` | @default(now()) @map("created_at") |
| `createdBy` | `Int?` | @map("created_by") |
| `creator` | `User?` | @relation(fields: [createdBy], references: [id]) |

## Model: `LandedCost`
| الحقل | النوع | الوصف |
|---|---|---|
| `id` | `Int` | @id @default(autoincrement()) |
| `tenantId` | `String` | @default("default") @map("tenant_id") |
| `purchaseOrderId` | `Int?` | @map("purchase_order_id") |
| `letterOfCreditId` | `Int?` | @map("letter_of_credit_id") |
| `expenseAccountId` | `Int` | @map("expense_account_id") // Account where cost is posted (e.g. Customs, Freight) |
| `description` | `String` |  |
| `amount` | `Decimal` |  |
| `currencyId` | `Int?` | @map("currency_id") |
| `exchangeRate` | `Decimal` | @default(1.0) @map("exchange_rate") @db.Decimal(18, 8) |
| `allocationMethod` | `String` | @default("value") // value, quantity, weight |
| `isAllocated` | `Boolean` | @default(false) @map("is_allocated") |
| `createdAt` | `DateTime` | @default(now()) @map("created_at") |
| `purchaseOrder` | `PurchaseOrder?` | @relation(fields: [purchaseOrderId], references: [id], onDelete: Cascade) |
| `letterOfCredit` | `LetterOfCredit?` | @relation(fields: [letterOfCreditId], references: [id], onDelete: Cascade) |
| `expenseAccount` | `Account` | @relation(fields: [expenseAccountId], references: [id]) |
| `currency` | `Currency?` | @relation(fields: [currencyId], references: [id]) |

## Model: `CheckTransaction`
| الحقل | النوع | الوصف |
|---|---|---|
| `id` | `Int` | @id @default(autoincrement()) |
| `tenantId` | `String` | @default("default") @map("tenant_id") |
| `type` | `String` | // (see field name for description) |
| `checkNumber` | `String` | @map("check_number") |
| `bankName` | `String` | @map("bank_name") |
| `dueDate` | `DateTime` | @map("due_date") |
| `amount` | `Decimal` |  |
| `status` | `String` | @default("PENDING") // PENDING, UNDER_COLLECTION, CLEARED, BOUNCED |
| `notes` | `String?` |  |
| `customerId` | `Int?` | @map("customer_id") |
| `supplierId` | `Int?` | @map("supplier_id") |
| `bankAccountId` | `Int?` | @map("bank_account_id") // GL Account for the bank |
| `createdAt` | `DateTime` | @default(now()) @map("created_at") |
| `updatedAt` | `DateTime` | @updatedAt @map("updated_at") |
| `customer` | `Customer?` | @relation("CheckCustomer", fields: [customerId], references: [id]) |
| `supplier` | `Customer?` | @relation("CheckSupplier", fields: [supplierId], references: [id]) |
| `bankAccount` | `Account?` | @relation("CheckBankAccount", fields: [bankAccountId], references: [id]) |

## Model: `BankReconciliation`
| الحقل | النوع | الوصف |
|---|---|---|
| `id` | `Int` | @id @default(autoincrement()) |
| `tenantId` | `String` | @default("default") @map("tenant_id") |
| `bankAccountId` | `Int` | @map("bank_account_id") |
| `statementDate` | `DateTime` | @map("statement_date") |
| `statementBalance` | `Decimal` | @map("statement_balance") @db.Decimal(20, 4) |
| `systemBalance` | `Decimal` | @map("system_balance") @db.Decimal(20, 4) |
| `difference` | `Decimal` | @db.Decimal(20, 4) |
| `status` | `String` | @default("DRAFT") // DRAFT, RECONCILED |
| `createdAt` | `DateTime` | @default(now()) @map("created_at") |
| `bankAccount` | `Account` | @relation(fields: [bankAccountId], references: [id]) |
| `journalLines` | `JournalLine[]` |  |

## Model: `PettyCashTransaction`
| الحقل | النوع | الوصف |
|---|---|---|
| `id` | `Int` | @id @default(autoincrement()) |
| `tenantId` | `String` | @default("default") @map("tenant_id") |
| `employeeId` | `Int` | @map("employee_id") |
| `amount` | `Decimal` |  |
| `requestDate` | `DateTime` | @default(now()) @map("request_date") |
| `status` | `String` | @default("PENDING") // PENDING, APPROVED, DISBURSED, SETTLED |
| `purpose` | `String?` |  |
| `settlementAmount` | `Decimal` | @default(0) @map("settlement_amount") @db.Decimal(20, 4) |
| `difference` | `Decimal` | @default(0) @db.Decimal(20, 4) |
| `notes` | `String?` |  |
| `createdAt` | `DateTime` | @default(now()) @map("created_at") |
| `employee` | `Employee` | @relation(fields: [employeeId], references: [id]) |

## Model: `Route`
| الحقل | النوع | الوصف |
|---|---|---|
| `id` | `Int` | @id @default(autoincrement()) |
| `tenantId` | `String` | @default("default") @map("tenant_id") |
| `name` | `String` |  |
| `description` | `String?` |  |
| `active` | `Boolean` | @default(true) |
| `salesRepId` | `Int?` | @map("sales_rep_id") |
| `createdAt` | `DateTime` | @default(now()) @map("created_at") |
| `customers` | `Customer[]` |  |
| `salesRep` | `Employee?` | @relation("RouteSalesRep", fields: [salesRepId], references: [id]) |

## Model: `SalesTarget`
| الحقل | النوع | الوصف |
|---|---|---|
| `id` | `Int` | @id @default(autoincrement()) |
| `tenantId` | `String` | @default("default") @map("tenant_id") |
| `employeeId` | `Int` | @map("employee_id") |
| `year` | `Int` |  |
| `month` | `Int` |  |
| `targetAmount` | `Decimal` | @map("target_amount") @db.Decimal(20, 4) |
| `createdAt` | `DateTime` | @default(now()) @map("created_at") |
| `employee` | `Employee` | @relation(fields: [employeeId], references: [id]) |

## Model: `SalesOrder`
| الحقل | النوع | الوصف |
|---|---|---|
| `id` | `Int` | @id @default(autoincrement()) |
| `tenantId` | `String` | @default("default") @map("tenant_id") |
| `orderNo` | `Int` | @map("order_no") |
| `date` | `DateTime` | @default(now()) |
| `customerId` | `Int?` | @map("customer_id") |
| `stockId` | `Int` | @default(1) |
| `salesRepId` | `Int?` | @map("sales_rep_id") |
| `subtotal` | `Decimal` | @default(0) |
| `taxValue` | `Decimal` | @default(0) |
| `total` | `Decimal` | @default(0) |
| `status` | `String` | @default("pending") // pending, approved, delivered, invoiced, cancelled |
| `isDropShip` | `Boolean` | @default(false) @map("is_drop_ship") |
| `userId` | `Int?` |  |
| `notes` | `String?` |  |
| `customer` | `Customer?` | @relation(fields: [customerId], references: [id]) |
| `salesRep` | `Employee?` | @relation(fields: [salesRepId], references: [id]) |
| `details` | `SalesOrderDetail[]` |  |
| `deliveryNotes` | `DeliveryNote[]` |  |
| `purchaseOrders` | `PurchaseOrder[]` |  |

## Model: `SalesOrderDetail`
| الحقل | النوع | الوصف |
|---|---|---|
| `id` | `Int` | @id @default(autoincrement()) |
| `tenantId` | `String` | @default("default") @map("tenant_id") |
| `orderId` | `Int` | @map("order_id") |
| `productId` | `Int` | @map("product_id") |
| `productName` | `String?` |  |
| `quantity` | `Decimal` | @default(1) |
| `price` | `Decimal` | @default(0) |
| `total` | `Decimal` | @default(0) |
| `order` | `SalesOrder` | @relation(fields: [orderId], references: [id], onDelete: Cascade) |
| `product` | `Product` | @relation(fields: [productId], references: [id]) |

## Model: `DeliveryNote`
| الحقل | النوع | الوصف |
|---|---|---|
| `id` | `Int` | @id @default(autoincrement()) |
| `tenantId` | `String` | @default("default") @map("tenant_id") |
| `noteNo` | `Int` | @map("note_no") |
| `date` | `DateTime` | @default(now()) |
| `salesOrderId` | `Int?` | @map("sales_order_id") |
| `customerId` | `Int?` | @map("customer_id") |
| `status` | `String` | @default("pending") // pending, delivered |
| `userId` | `Int?` |  |
| `salesOrder` | `SalesOrder?` | @relation(fields: [salesOrderId], references: [id]) |
| `customer` | `Customer?` | @relation(fields: [customerId], references: [id]) |
| `details` | `DeliveryNoteDetail[]` |  |

## Model: `DeliveryNoteDetail`
| الحقل | النوع | الوصف |
|---|---|---|
| `id` | `Int` | @id @default(autoincrement()) |
| `tenantId` | `String` | @default("default") @map("tenant_id") |
| `noteId` | `Int` | @map("note_id") |
| `productId` | `Int` | @map("product_id") |
| `productName` | `String?` |  |
| `quantity` | `Decimal` | @default(1) |
| `note` | `DeliveryNote` | @relation(fields: [noteId], references: [id], onDelete: Cascade) |
| `product` | `Product` | @relation(fields: [productId], references: [id]) |
| `ProductBatch` | `ProductBatch?` | @relation(fields: [productBatchId], references: [id]) |
| `productBatchId` | `Int?` |  |

## Model: `Project`
| الحقل | النوع | الوصف |
|---|---|---|
| `id` | `Int` | @id @default(autoincrement()) |
| `tenantId` | `String` | @default("default") @map("tenant_id") |
| `name` | `String` |  |
| `description` | `String?` |  |
| `customerId` | `Int?` | @map("customer_id") |
| `budget` | `Decimal` | @default(0) @db.Decimal(20, 4) |
| `startDate` | `DateTime?` | @map("start_date") |
| `endDate` | `DateTime?` | @map("end_date") |
| `status` | `String` | @default("ACTIVE") |
| `createdAt` | `DateTime` | @default(now()) @map("created_at") |
| `customer` | `Customer?` | @relation(fields: [customerId], references: [id]) |
| `tasks` | `ProjectTask[]` |  |
| `budgetLines` | `ProjectBudgetLine[]` | // P8: Itemized budget |
| `phases` | `ProjectPhase[]` |  |
| `milestones` | `ProjectMilestone[]` |  |
| `risks` | `ProjectRisk[]` |  |
| `resources` | `ProjectResource[]` |  |
| `timeEntries` | `ProjectTimeEntry[]` |  |

## Model: `ProjectBudgetLine`
| الحقل | النوع | الوصف |
|---|---|---|
| `id` | `Int` | @id @default(autoincrement()) |
| `tenantId` | `String` | @default("default") @map("tenant_id") |
| `projectId` | `Int` | @map("project_id") |
| `category` | `String` | // (see field name for description) |
| `description` | `String` |  |
| `planned` | `Decimal` | @default(0) @db.Decimal(20, 4) // (see field name for description) |
| `actual` | `Decimal` | @default(0) @db.Decimal(20, 4) // (see field name for description) |
| `notes` | `String?` |  |
| `createdAt` | `DateTime` | @default(now()) @map("created_at") |
| `project` | `Project` | @relation(fields: [projectId], references: [id], onDelete: Cascade) |

## Model: `SupplierContract`
| الحقل | النوع | الوصف |
|---|---|---|
| `id` | `Int` | @id @default(autoincrement()) |
| `tenantId` | `String` | @default("default") @map("tenant_id") |
| `contractNo` | `String` | @unique @map("contract_no") |
| `supplierId` | `Int` | @map("supplier_id") |
| `title` | `String` |  |
| `description` | `String?` |  |
| `startDate` | `DateTime` | @map("start_date") |
| `endDate` | `DateTime` | @map("end_date") |
| `value` | `Decimal` | @default(0) |
| `currency` | `String` | @default("SAR") |
| `paymentTerms` | `String?` | @map("payment_terms") // (see field name for description) |
| `status` | `String` | @default("active") // active, expired, terminated |
| `autoRenew` | `Boolean` | @default(false) @map("auto_renew") |
| `alertDaysBefore` | `Int` | @default(30) @map("alert_days_before") |
| `notes` | `String?` |  |
| `createdAt` | `DateTime` | @default(now()) @map("created_at") |
| `supplier` | `Customer` | @relation("SupplierContracts", fields: [supplierId], references: [id]) |

## Model: `ProjectTask`
| الحقل | النوع | الوصف |
|---|---|---|
| `id` | `Int` | @id @default(autoincrement()) |
| `tenantId` | `String` | @default("default") @map("tenant_id") |
| `projectId` | `Int` | @map("project_id") |
| `name` | `String` |  |
| `description` | `String?` |  |
| `cost` | `Decimal` | @default(0) @db.Decimal(20, 4) |
| `status` | `String` | @default("PENDING") |
| `project` | `Project` | @relation(fields: [projectId], references: [id], onDelete: Cascade) |
| `timeEntries` | `ProjectTimeEntry[]` |  |

## Model: `WarehouseZone`
| الحقل | النوع | الوصف |
|---|---|---|
| `id` | `Int` | @id @default(autoincrement()) |
| `tenantId` | `String` | @default("default") @map("tenant_id") |
| `stockId` | `Int` | @map("stock_id") |
| `name` | `String` |  |
| `description` | `String?` |  |
| `type` | `String` | @default("BULK") // BULK, PICK, RECEIVING, SHIPPING, QC |
| `stock` | `Stock` | @relation(fields: [stockId], references: [id]) |
| `racks` | `WarehouseRack[]` |  |

## Model: `WarehouseRack`
| الحقل | النوع | الوصف |
|---|---|---|
| `id` | `Int` | @id @default(autoincrement()) |
| `tenantId` | `String` | @default("default") @map("tenant_id") |
| `zoneId` | `Int` | @map("zone_id") |
| `name` | `String` |  |
| `rows` | `Int` | @default(1) |
| `columns` | `Int` | @default(1) |
| `zone` | `WarehouseZone` | @relation(fields: [zoneId], references: [id], onDelete: Cascade) |
| `bins` | `WarehouseBin[]` |  |

## Model: `WarehouseBin`
| الحقل | النوع | الوصف |
|---|---|---|
| `id` | `Int` | @id @default(autoincrement()) |
| `tenantId` | `String` | @default("default") @map("tenant_id") |
| `rackId` | `Int` | @map("rack_id") |
| `name` | `String` |  |
| `barcode` | `String?` |  |
| `maxWeight` | `Decimal` | @default(0) @map("max_weight") @db.Decimal(20, 4) |
| `maxVolume` | `Decimal` | @default(0) @map("max_volume") @db.Decimal(20, 4) |
| `currentUtilization` | `Decimal` | @default(0) @map("current_utilization") @db.Decimal(20, 4) |
| `position` | `String?` | // e.g. "R1-C2" |
| `binType` | `String` | @default("EACH") // PALLET, CASE, EACH |
| `status` | `String` | @default("AVAILABLE") // AVAILABLE, RESERVED, FULL, BLOCKED |
| `rack` | `WarehouseRack` | @relation(fields: [rackId], references: [id], onDelete: Cascade) |
| `productStocks` | `ProductStock[]` |  |

## Model: `PromissoryNote`
| الحقل | النوع | الوصف |
|---|---|---|
| `id` | `Int` | @id @default(autoincrement()) |
| `tenantId` | `String` | @default("default") @map("tenant_id") |
| `noteNumber` | `String` | @unique @map("note_number") |
| `customerId` | `Int` | @map("customer_id") |
| `amount` | `Decimal` |  |
| `dueDate` | `DateTime` | @map("due_date") |
| `status` | `String` | @default("PENDING") |
| `notes` | `String?` |  |
| `createdAt` | `DateTime` | @default(now()) @map("created_at") |
| `customer` | `Customer` | @relation(fields: [customerId], references: [id]) |

## Model: `LetterOfGuarantee`
| الحقل | النوع | الوصف |
|---|---|---|
| `id` | `Int` | @id @default(autoincrement()) |
| `tenantId` | `String` | @default("default") @map("tenant_id") |
| `lgNumber` | `String` | @unique @map("lg_number") |
| `bankId` | `Int` | @map("bank_id") |
| `customerId` | `Int?` | @map("customer_id") |
| `type` | `String` |  |
| `amount` | `Decimal` |  |
| `issueDate` | `DateTime` | @map("issue_date") |
| `expiryDate` | `DateTime` | @map("expiry_date") |
| `status` | `String` | @default("ACTIVE") |
| `notes` | `String?` |  |
| `bank` | `BankAccount` | @relation(fields: [bankId], references: [id]) |

## Model: `Asset`
| الحقل | النوع | الوصف |
|---|---|---|
| `id` | `Int` | @id @default(autoincrement()) |
| `tenantId` | `String` | @default("default") @map("tenant_id") |
| `barcode` | `String` | @unique |
| `name` | `String` |  |
| `category` | `String` | // e.g., 'Vehicles', 'IT Equipment', 'Furniture' |
| `purchasePrice` | `Decimal` | @default(0) @map("purchase_price") @db.Decimal(20, 4) |
| `currentValue` | `Decimal` | @default(0) @map("current_value") @db.Decimal(20, 4) |
| `salvageValue` | `Decimal` | @default(0) @map("salvage_value") @db.Decimal(20, 4) |
| `usefulLifeYears` | `Int` | @default(5) @map("useful_life_years") |
| `depreciationType` | `String` | @default("STRAIGHT_LINE") // STRAIGHT_LINE, DECLINING_BALANCE |
| `purchaseDate` | `DateTime` | @default(now()) @map("purchase_date") |
| `status` | `String` | @default("ACTIVE") // ACTIVE, DEPRECIATED, DISPOSED, SOLD |
| `location` | `String?` |  |
| `notes` | `String?` |  |
| `createdAt` | `DateTime` | @default(now()) @map("created_at") |
| `updatedAt` | `DateTime` | @updatedAt @map("updated_at") |
| `AssetImpairment` | `AssetImpairment[]` |  |
| `AssetRevaluation` | `AssetRevaluation[]` |  |
| `deletedAt` | `DateTime?` | @map("deleted_at") |
| `deletedBy` | `String?` | @map("deleted_by") |

## Model: `Lead`
| الحقل | النوع | الوصف |
|---|---|---|
| `id` | `Int` | @id @default(autoincrement()) |
| `tenantId` | `String` | @default("default") @map("tenant_id") |
| `companyName` | `String` | @map("company_name") |
| `contactPerson` | `String` | @map("contact_person") |
| `email` | `String?` |  |
| `phone` | `String?` |  |
| `source` | `String?` | // e.g., 'Website', 'Cold Call', 'Referral' |
| `industry` | `String?` |  |
| `status` | `String` | @default("NEW") // NEW, CONTACTED, QUALIFIED, LOST, CONVERTED |
| `assignedToId` | `Int?` | @map("assigned_to_id") |
| `expectedRevenue` | `Decimal` | @default(0) @map("expected_revenue") @db.Decimal(20, 4) |
| `probability` | `Int` | @default(10) // 10% to 100% |
| `notes` | `String?` |  |
| `createdAt` | `DateTime` | @default(now()) @map("created_at") |
| `updatedAt` | `DateTime` | @updatedAt @map("updated_at") |

## Model: `Vehicle`
| الحقل | النوع | الوصف |
|---|---|---|
| `id` | `Int` | @id @default(autoincrement()) |
| `tenantId` | `String` | @default("default") @map("tenant_id") |
| `plateNumber` | `String` | @unique @map("plate_number") |
| `make` | `String` |  |
| `model` | `String` |  |
| `year` | `Int` |  |
| `vinCode` | `String?` | @map("vin_code") |
| `type` | `String` | // 'TRUCK', 'VAN', 'SEDAN' |
| `status` | `String` | @default("AVAILABLE") // AVAILABLE, IN_MAINTENANCE, ON_TRIP, RETIRED |
| `insuranceExpiry` | `DateTime?` | @map("insurance_expiry") |
| `licenseExpiry` | `DateTime?` | @map("license_expiry") |
| `driverId` | `Int?` | @map("driver_id") |
| `currentOdometer` | `Int` | @default(0) @map("current_odometer") |
| `createdAt` | `DateTime` | @default(now()) @map("created_at") |
| `updatedAt` | `DateTime` | @updatedAt @map("updated_at") |
| `trips` | `FleetTrip[]` |  |
| `fuelLogs` | `FuelLog[]` |  |

## Model: `Property`
| الحقل | النوع | الوصف |
|---|---|---|
| `id` | `Int` | @id @default(autoincrement()) |
| `tenantId` | `String` | @default("default") @map("tenant_id") |
| `name` | `String` |  |
| `type` | `String` | // 'COMMERCIAL_BUILDING', 'RESIDENTIAL_COMPLEX', 'LAND' |
| `address` | `String?` |  |
| `totalUnits` | `Int` | @default(1) @map("total_units") |
| `status` | `String` | @default("ACTIVE") |
| `createdAt` | `DateTime` | @default(now()) @map("created_at") |
| `updatedAt` | `DateTime` | @updatedAt @map("updated_at") |
| `units` | `PropertyUnit[]` |  |

## Model: `PropertyUnit`
| الحقل | النوع | الوصف |
|---|---|---|
| `id` | `Int` | @id @default(autoincrement()) |
| `tenantId` | `String` | @default("default") @map("tenant_id") |
| `propertyId` | `Int` | @map("property_id") |
| `property` | `Property` | @relation(fields: [propertyId], references: [id], onDelete: Cascade) |
| `unitNumber` | `String` | @map("unit_number") |
| `type` | `String` | // 'OFFICE', 'APARTMENT', 'SHOP' |
| `floor` | `Int` | @default(1) |
| `areaSqm` | `Decimal` | @default(0) @map("area_sqm") @db.Decimal(20, 4) |
| `rentYearly` | `Decimal` | @default(0) @map("rent_yearly") @db.Decimal(20, 4) |
| `status` | `String` | @default("VACANT") // VACANT, OCCUPIED, MAINTENANCE |
| `createdAt` | `DateTime` | @default(now()) @map("created_at") |
| `updatedAt` | `DateTime` | @updatedAt @map("updated_at") |
| `leaseContracts` | `LeaseContract[]` |  |

## Model: `QualityInspection`
| الحقل | النوع | الوصف |
|---|---|---|
| `id` | `Int` | @id @default(autoincrement()) |
| `tenantId` | `String` | @default("default") @map("tenant_id") |
| `referenceNumber` | `String` | @unique @map("reference_number") // Link to GRN or MO |
| `inspectorId` | `Int` | @map("inspector_id") |
| `status` | `String` | @default("PENDING") // PENDING, PASSED, FAILED, REWORK |
| `notes` | `String?` |  |
| `inspectionDate` | `DateTime` | @default(now()) @map("inspection_date") |
| `createdAt` | `DateTime` | @default(now()) @map("created_at") |
| `updatedAt` | `DateTime` | @updatedAt @map("updated_at") |
| `NonConformanceReport` | `NonConformanceReport[]` |  |
| `productId` | `Int?` | @map("product_id") |
| `inspectedQty` | `Decimal?` | @map("inspected_qty") @db.Decimal(20, 4) |
| `results` | `String?` | // JSON string |
| `product` | `Product?` | @relation(fields: [productId], references: [id]) |

## Model: `PurchaseRequisition`
| الحقل | النوع | الوصف |
|---|---|---|
| `id` | `Int` | @id @default(autoincrement()) |
| `tenantId` | `String` | @default("default") @map("tenant_id") |
| `reqNo` | `Int` | @map("req_no") |
| `date` | `DateTime` | @default(now()) |
| `department` | `String?` |  |
| `status` | `String` | @default("pending") // pending, approved, rejected |
| `requestedBy` | `Int?` | @map("requested_by") |
| `approvedBy` | `Int?` | @map("approved_by") |
| `notes` | `String?` |  |
| `requester` | `User?` | @relation("PRRequester", fields: [requestedBy], references: [id]) |
| `approver` | `User?` | @relation("PRApprover", fields: [approvedBy], references: [id]) |
| `details` | `PurchaseRequisitionDetail[]` |  |
| `deletedAt` | `DateTime?` | // P1.2 soft-delete ط·آ·ط¢آ·ط·آ¢ط¢آ·ط·آ·ط¢آ¢ط·آ¢ط¢آ·ط·آ·ط¢آ·ط·آ¢ط¢آ¢ط·آ·ط¢آ¢ط·آ¢ط¢آ·ط·آ·ط¢آ·ط·آ¢ط¢آ·ط·آ·ط¢آ¢ط·آ¢ط¢آ¢ط·آ·ط¢آ·ط·آ¢ط¢آ¢ط·آ·ط¢آ¢ط·آ¢ط¢آ£ط·آ·ط¢آ·ط·آ¢ط¢آ·ط·آ·ط¢آ¢ط·آ¢ط¢آ·ط·آ·ط¢آ·ط·آ¢ط¢آ¢ط·آ·ط¢آ¢ط·آ¢ط¢آ¢ط·آ·ط¢آ·ط·آ¢ط¢آ·ط·آ·ط¢آ¢ط·آ¢ط¢آ¢ط·آ·ط¢آ·ط·آ¢ط¢آ¢ط·آ·ط¢آ¢ط·آ¢ط¢آ¢ط·آ·ط¢آ·ط·آ¢ط¢آ·ط·آ·ط¢آ¢ط·آ¢ط¢آ·ط·آ·ط¢آ·ط·آ¢ط¢آ¢ط·آ·ط¢آ¢ط·آ¢ط¢آ£ط·آ·ط¢آ·ط·آ¢ط¢آ·ط·آ·ط¢آ¢ط·آ¢ط¢آ¢ط·آ·ط¢آ·ط·آ¢ط¢آ¢ط·آ·ط¢آ¢ط·آ¢ط¢آ¢ط·آ·ط¢آ·ط·آ¢ط¢آ·ط·آ·ط¢آ¢ط·آ¢ط¢آ£ط·آ·ط¢آ·ط·آ¢ط¢آ¢ط·آ·ط¢آ¢ط·آ¢ط¢آ¢ط·آ·ط¢آ·ط·آ¢ط¢آ£ط·آ·ط¢آ¢ط·آ¢ط¢آ¢ط·آ·ط¢آ£ط·آ¢ط¢آ¢ط·آ£ط¢آ¢ط£آ¢أ¢â€ڑآ¬ط¹â€کط·آ¢ط¢آ¬ط·آ·ط¢آ¹ط£آ¢أ¢â€ڑآ¬ط¹آ©ط·آ·ط¢آ·ط·آ¢ط¢آ¢ط·آ·ط¢آ¢ط·آ¢ط¢آ¬ط·آ·ط¢آ·ط·آ¢ط¢آ·ط·آ·ط¢آ¢ط·آ¢ط¢آ¹ط·آ·ط¢آ£ط·آ¢ط¢آ¢ط·آ£ط¢آ¢ط£آ¢أ¢â€ڑآ¬ط¹â€کط·آ¢ط¢آ¬ط·آ·ط¢آ¹ط·آ¢ط¢آ©ط·آ·ط¢آ·ط·آ¢ط¢آ·ط·آ·ط¢آ¢ط·آ¢ط¢آ·ط·آ·ط¢آ·ط·آ¢ط¢آ¢ط·آ·ط¢آ¢ط·آ¢ط¢آ¢ط·آ·ط¢آ·ط·آ¢ط¢آ·ط·آ·ط¢آ¢ط·آ¢ط¢آ¢ط·آ·ط¢آ·ط·آ¢ط¢آ¢ط·آ·ط¢آ¢ط·آ¢ط¢آ¬ط·آ·ط¢آ·ط·آ¢ط¢آ·ط·آ·ط¢آ¢ط·آ¢ط¢آ·ط·آ·ط¢آ·ط·آ¢ط¢آ¢ط·آ·ط¢آ¢ط·آ¢ط¢آ£ط·آ·ط¢آ·ط·آ¢ط¢آ·ط·آ·ط¢آ¢ط·آ¢ط¢آ¢ط·آ·ط¢آ·ط·آ¢ط¢آ¢ط·آ·ط¢آ¢ط·آ¢ط¢آ¢ط·آ·ط¢آ·ط·آ¢ط¢آ·ط·آ·ط¢آ¢ط·آ¢ط¢آ£ط·آ·ط¢آ·ط·آ¢ط¢آ¢ط·آ·ط¢آ¢ط·آ¢ط¢آ¢ط·آ·ط¢آ·ط·آ¢ط¢آ£ط·آ·ط¢آ¢ط·آ¢ط¢آ¢ط·آ·ط¢آ£ط·آ¢ط¢آ¢ط·آ£ط¢آ¢ط£آ¢أ¢â‚¬ع‘ط¢آ¬ط·آ¹أ¢â‚¬ع©ط·آ·ط¢آ¢ط·آ¢ط¢آ¬ط·آ·ط¢آ·ط·آ¢ط¢آ¹ط·آ£ط¢آ¢ط£آ¢أ¢â‚¬ع‘ط¢آ¬ط·آ¹ط¢آ©ط·آ·ط¢آ·ط·آ¢ط¢آ·ط·آ·ط¢آ¢ط·آ¢ط¢آ¢ط·آ·ط¢آ·ط·آ¢ط¢آ¢ط·آ·ط¢آ¢ط·آ¢ط¢آ¬ط·آ·ط¢آ·ط·آ¢ط¢آ·ط·آ·ط¢آ¢ط·آ¢ط¢آ£ط·آ·ط¢آ·ط·آ¢ط¢آ¢ط·آ·ط¢آ¢ط·آ¢ط¢آ¢ط·آ·ط¢آ·ط·آ¢ط¢آ£ط·آ·ط¢آ¢ط·آ¢ط¢آ¢ط·آ·ط¢آ£ط·آ¢ط¢آ¢ط·آ£ط¢آ¢ط£آ¢أ¢â€ڑآ¬ط¹â€کط·آ¢ط¢آ¬ط·آ·ط¢آ¹ط£آ¢أ¢â€ڑآ¬ط¹آ©ط·آ·ط¢آ·ط·آ¢ط¢آ¢ط·آ·ط¢آ¢ط·آ¢ط¢آ¬ط·آ·ط¢آ·ط·آ¢ط¢آ·ط·آ·ط¢آ¢ط·آ¢ط¢آ¥ط·آ·ط¢آ£ط·آ¢ط¢آ¢ط·آ£ط¢آ¢ط£آ¢أ¢â€ڑآ¬ط¹â€کط·آ¢ط¢آ¬ط·آ£ط¢آ¢ط£آ¢أ¢â€ڑآ¬أ¢â‚¬ع†ط·آ¢ط¢آ¢ do not use hard DELETE |

## Model: `PurchaseRequisitionDetail`
| الحقل | النوع | الوصف |
|---|---|---|
| `id` | `Int` | @id @default(autoincrement()) |
| `tenantId` | `String` | @default("default") @map("tenant_id") |
| `reqId` | `Int` | @map("req_id") |
| `productId` | `Int` | @map("product_id") |
| `productName` | `String?` | @map("product_name") |
| `quantity` | `Decimal` | @default(1) |
| `notes` | `String?` |  |
| `requisition` | `PurchaseRequisition` | @relation(fields: [reqId], references: [id], onDelete: Cascade) |
| `product` | `Product` | @relation(fields: [productId], references: [id]) |

## Model: `RequestForQuotation`
| الحقل | النوع | الوصف |
|---|---|---|
| `id` | `Int` | @id @default(autoincrement()) |
| `tenantId` | `String` | @default("default") @map("tenant_id") |
| `rfqNo` | `Int` | @map("rfq_no") |
| `date` | `DateTime` | @default(now()) |
| `dueDate` | `DateTime?` | @map("due_date") |
| `supplierId` | `Int?` | @map("supplier_id") |
| `status` | `String` | @default("draft") // draft, sent, received, closed |
| `userId` | `Int?` | @map("user_id") |
| `notes` | `String?` |  |
| `supplier` | `Customer?` | @relation(fields: [supplierId], references: [id]) |
| `user` | `User?` | @relation(fields: [userId], references: [id]) |
| `details` | `RequestForQuotationDetail[]` |  |

## Model: `RequestForQuotationDetail`
| الحقل | النوع | الوصف |
|---|---|---|
| `id` | `Int` | @id @default(autoincrement()) |
| `tenantId` | `String` | @default("default") @map("tenant_id") |
| `rfqId` | `Int` | @map("rfq_id") |
| `productId` | `Int` | @map("product_id") |
| `productName` | `String?` | @map("product_name") |
| `quantity` | `Decimal` | @default(1) |
| `targetPrice` | `Decimal?` | @map("target_price") @db.Decimal(20, 4) |
| `rfq` | `RequestForQuotation` | @relation(fields: [rfqId], references: [id], onDelete: Cascade) |
| `product` | `Product` | @relation(fields: [productId], references: [id]) |

## Model: `GoodsReceiptNote`
| الحقل | النوع | الوصف |
|---|---|---|
| `id` | `Int` | @id @default(autoincrement()) |
| `tenantId` | `String` | @default("default") @map("tenant_id") |
| `grnNo` | `Int` | @map("grn_no") |
| `date` | `DateTime` | @default(now()) |
| `supplierId` | `Int?` | @map("supplier_id") |
| `orderId` | `Int?` | @map("order_id") |
| `stockId` | `Int` | @default(1) @map("stock_id") |
| `status` | `String` | @default("received") // received, partial, inspected |
| `receivedBy` | `Int?` | @map("received_by") |
| `notes` | `String?` |  |
| `supplier` | `Customer?` | @relation(fields: [supplierId], references: [id]) |
| `order` | `PurchaseOrder?` | @relation(fields: [orderId], references: [id]) |
| `stock` | `Stock?` | @relation(fields: [stockId], references: [id]) |
| `receiver` | `User?` | @relation(fields: [receivedBy], references: [id]) |
| `details` | `GoodsReceiptNoteDetail[]` |  |
| `asnId` | `String?` |  |
| `expectedArrivalDate` | `DateTime?` |  |
| `rejectionQty` | `Decimal?` | @db.Decimal(15, 4) |

## Model: `GoodsReceiptNoteDetail`
| الحقل | النوع | الوصف |
|---|---|---|
| `id` | `Int` | @id @default(autoincrement()) |
| `tenantId` | `String` | @default("default") @map("tenant_id") |
| `grnId` | `Int` | @map("grn_id") |
| `productId` | `Int` | @map("product_id") |
| `productName` | `String?` | @map("product_name") |
| `quantity` | `Decimal` | @default(1) |
| `acceptedQty` | `Decimal` | @default(1) @map("accepted_qty") @db.Decimal(20, 4) |
| `rejectedQty` | `Decimal` | @default(0) @map("rejected_qty") @db.Decimal(20, 4) |
| `grn` | `GoodsReceiptNote` | @relation(fields: [grnId], references: [id], onDelete: Cascade) |
| `product` | `Product` | @relation(fields: [productId], references: [id]) |
| `batch` | `ProductBatch?` | @relation(fields: [batchId], references: [id]) |
| `batchId` | `Int?` | @map("batch_id") |

## Model: `JobPosting`
| الحقل | النوع | الوصف |
|---|---|---|
| `id` | `Int` | @id @default(autoincrement()) |
| `tenantId` | `String` | @default("default") @map("tenant_id") |
| `title` | `String` |  |
| `department` | `String?` |  |
| `description` | `String?` |  |
| `requirements` | `String?` |  |
| `status` | `String` | @default("OPEN") // OPEN, CLOSED, DRAFT |
| `createdAt` | `DateTime` | @default(now()) @map("created_at") |
| `applicants` | `JobApplicant[]` |  |

## Model: `JobApplicant`
| الحقل | النوع | الوصف |
|---|---|---|
| `id` | `Int` | @id @default(autoincrement()) |
| `tenantId` | `String` | @default("default") @map("tenant_id") |
| `jobPostingId` | `Int` | @map("job_posting_id") |
| `name` | `String` |  |
| `email` | `String?` |  |
| `phone` | `String?` |  |
| `resumeUrl` | `String?` | @map("resume_url") |
| `status` | `String` | @default("APPLIED") // APPLIED, INTERVIEWED, HIRED, REJECTED |
| `appliedAt` | `DateTime` | @default(now()) @map("applied_at") |
| `jobPosting` | `JobPosting` | @relation(fields: [jobPostingId], references: [id]) |

## Model: `EmployeeEvaluation`
| الحقل | النوع | الوصف |
|---|---|---|
| `id` | `Int` | @id @default(autoincrement()) |
| `tenantId` | `String` | @default("default") @map("tenant_id") |
| `employeeId` | `Int` | @map("employee_id") |
| `evaluatorId` | `Int` | @map("evaluator_id") |
| `evaluationDate` | `DateTime` | @map("evaluation_date") |
| `period` | `String` | @default("ANNUAL") // Q1, Q2, ANNUAL |
| `score` | `Float` | @default(0) |
| `strengths` | `String?` |  |
| `weaknesses` | `String?` |  |
| `recommendations` | `String?` |  |
| `createdAt` | `DateTime` | @default(now()) @map("created_at") |
| `employee` | `Employee` | @relation(name: "Evaluatee", fields: [employeeId], references: [id]) |
| `evaluator` | `Employee` | @relation(name: "Evaluator", fields: [evaluatorId], references: [id]) |

## Model: `TrainingCourse`
| الحقل | النوع | الوصف |
|---|---|---|
| `id` | `Int` | @id @default(autoincrement()) |
| `tenantId` | `String` | @default("default") @map("tenant_id") |
| `title` | `String` |  |
| `provider` | `String?` |  |
| `startDate` | `DateTime` | @map("start_date") |
| `endDate` | `DateTime` | @map("end_date") |
| `cost` | `Decimal` | @default(0) @db.Decimal(20, 4) |
| `status` | `String` | @default("SCHEDULED") // SCHEDULED, COMPLETED, CANCELLED |
| `createdAt` | `DateTime` | @default(now()) @map("created_at") |
| `enrollments` | `TrainingEnrollment[]` |  |

## Model: `TrainingEnrollment`
| الحقل | النوع | الوصف |
|---|---|---|
| `id` | `Int` | @id @default(autoincrement()) |
| `tenantId` | `String` | @default("default") @map("tenant_id") |
| `courseId` | `Int` | @map("course_id") |
| `employeeId` | `Int` | @map("employee_id") |
| `status` | `String` | @default("ENROLLED") // ENROLLED, COMPLETED, DROPPED |
| `score` | `Float?` |  |
| `course` | `TrainingCourse` | @relation(fields: [courseId], references: [id]) |
| `employee` | `Employee` | @relation(fields: [employeeId], references: [id]) |

## Model: `LeaseContract`
| الحقل | النوع | الوصف |
|---|---|---|
| `id` | `Int` | @id @default(autoincrement()) |
| `contractNumber` | `String` | @unique @map("contract_number") |
| `unitId` | `Int` | @map("unit_id") |
| `tenantId` | `Int` | @map("tenant_id") // Links to Customer |
| `startDate` | `DateTime` | @map("start_date") |
| `endDate` | `DateTime` | @map("end_date") |
| `rentAmount` | `Decimal` | @map("rent_amount") @db.Decimal(20, 4) |
| `paymentFrequency` | `String` | @default("MONTHLY") // MONTHLY, QUARTERLY, YEARLY |
| `status` | `String` | @default("ACTIVE") // ACTIVE, EXPIRED, TERMINATED |
| `createdAt` | `DateTime` | @default(now()) @map("created_at") |
| `unit` | `PropertyUnit` | @relation(fields: [unitId], references: [id]) |
| `tenant` | `Customer` | @relation(fields: [tenantId], references: [id]) |
| `installments` | `RentInstallment[]` |  |

## Model: `RentInstallment`
| الحقل | النوع | الوصف |
|---|---|---|
| `id` | `Int` | @id @default(autoincrement()) |
| `tenantId` | `String` | @default("default") @map("tenant_id") |
| `contractId` | `Int` | @map("contract_id") |
| `dueDate` | `DateTime` | @map("due_date") |
| `amount` | `Decimal` |  |
| `isPaid` | `Boolean` | @default(false) @map("is_paid") |
| `paidDate` | `DateTime?` | @map("paid_date") |
| `receiptNumber` | `String?` | @map("receipt_number") |
| `contract` | `LeaseContract` | @relation(fields: [contractId], references: [id]) |

## Model: `FleetTrip`
| الحقل | النوع | الوصف |
|---|---|---|
| `id` | `Int` | @id @default(autoincrement()) |
| `tenantId` | `String` | @default("default") @map("tenant_id") |
| `vehicleId` | `Int` | @map("vehicle_id") |
| `driverId` | `Int` | @map("driver_id") |
| `departureTime` | `DateTime` | @map("departure_time") |
| `arrivalTime` | `DateTime?` | @map("arrival_time") |
| `startLocation` | `String` | @map("start_location") |
| `endLocation` | `String` | @map("end_location") |
| `distanceKm` | `Decimal` | @default(0) @map("distance_km") @db.Decimal(20, 4) |
| `notes` | `String?` |  |
| `status` | `String` | @default("IN_PROGRESS") // IN_PROGRESS, COMPLETED, CANCELLED |
| `vehicle` | `Vehicle` | @relation(fields: [vehicleId], references: [id]) |
| `driver` | `Employee` | @relation(fields: [driverId], references: [id]) |

## Model: `FuelLog`
| الحقل | النوع | الوصف |
|---|---|---|
| `id` | `Int` | @id @default(autoincrement()) |
| `tenantId` | `String` | @default("default") @map("tenant_id") |
| `vehicleId` | `Int` | @map("vehicle_id") |
| `driverId` | `Int` | @map("driver_id") |
| `date` | `DateTime` | @default(now()) |
| `liters` | `Decimal` | @db.Decimal(20, 4) |
| `cost` | `Decimal` | @db.Decimal(20, 4) |
| `odometerReading` | `Int` | @map("odometer_reading") |
| `receiptUrl` | `String?` | @map("receipt_url") |
| `vehicle` | `Vehicle` | @relation(fields: [vehicleId], references: [id]) |
| `driver` | `Employee` | @relation(fields: [driverId], references: [id]) |

## Model: `Student`
| الحقل | النوع | الوصف |
|---|---|---|
| `id` | `Int` | @id @default(autoincrement()) |
| `tenantId` | `String` | @default("default") @map("tenant_id") |
| `studentCode` | `String` | @unique @map("student_code") |
| `name` | `String` |  |
| `dateOfBirth` | `DateTime` | @map("date_of_birth") |
| `guardianName` | `String?` | @map("guardian_name") |
| `guardianPhone` | `String?` | @map("guardian_phone") |
| `status` | `String` | @default("ENROLLED") // ENROLLED, GRADUATED, DROPPED |
| `createdAt` | `DateTime` | @default(now()) @map("created_at") |
| `enrollments` | `ClassEnrollment[]` |  |
| `SchoolInvoice` | `SchoolInvoice[]` |  |

## Model: `AcademicClass`
| الحقل | النوع | الوصف |
|---|---|---|
| `id` | `Int` | @id @default(autoincrement()) |
| `tenantId` | `String` | @default("default") @map("tenant_id") |
| `className` | `String` | @map("class_name") |
| `gradeLevel` | `String` | @map("grade_level") |
| `academicYear` | `String` | @map("academic_year") |
| `capacity` | `Int` | @default(30) |
| `teacherId` | `Int?` | @map("teacher_id") |
| `teacher` | `Employee?` | @relation(fields: [teacherId], references: [id]) |
| `enrollments` | `ClassEnrollment[]` |  |

## Model: `ClassEnrollment`
| الحقل | النوع | الوصف |
|---|---|---|
| `id` | `Int` | @id @default(autoincrement()) |
| `tenantId` | `String` | @default("default") @map("tenant_id") |
| `studentId` | `Int` | @map("student_id") |
| `classId` | `Int` | @map("class_id") |
| `enrollmentDate` | `DateTime` | @default(now()) @map("enrollment_date") |
| `tuitionFee` | `Decimal` | @default(0) @map("tuition_fee") @db.Decimal(20, 4) |
| `student` | `Student` | @relation(fields: [studentId], references: [id]) |
| `academicClass` | `AcademicClass` | @relation(fields: [classId], references: [id]) |

## Model: `Budget`
| الحقل | النوع | الوصف |
|---|---|---|
| `id` | `Int` | @id @default(autoincrement()) |
| `tenantId` | `String` | @default("default") @map("tenant_id") |
| `name` | `String` |  |
| `fiscalYear` | `Int` | @map("fiscal_year") |
| `startDate` | `DateTime` | @map("start_date") |
| `endDate` | `DateTime` | @map("end_date") |
| `totalAmount` | `Decimal` | @default(0) @map("total_amount") @db.Decimal(20, 4) |
| `status` | `String` | @default("DRAFT") // DRAFT, APPROVED, CLOSED |
| `createdAt` | `DateTime` | @default(now()) @map("created_at") |
| `lines` | `BudgetLine[]` |  |

## Model: `BudgetLine`
| الحقل | النوع | الوصف |
|---|---|---|
| `id` | `Int` | @id @default(autoincrement()) |
| `tenantId` | `String` | @default("default") @map("tenant_id") |
| `budgetId` | `Int` | @map("budget_id") |
| `accountId` | `Int` | @map("account_id") // General Ledger Account |
| `costCenterId` | `Int?` | @map("cost_center_id") |
| `allocatedAmount` | `Decimal` | @map("allocated_amount") @db.Decimal(20, 4) |
| `spentAmount` | `Decimal` | @default(0) @map("spent_amount") @db.Decimal(20, 4) |
| `variance` | `Decimal` | @default(0) @db.Decimal(20, 4) // Computed practically |
| `notes` | `String?` |  |
| `budget` | `Budget` | @relation(fields: [budgetId], references: [id], onDelete: Cascade) |
| `account` | `Account` | @relation(fields: [accountId], references: [id]) |
| `costCenter` | `CostCenter?` | @relation(fields: [costCenterId], references: [id]) |

## Model: `Encumbrance`
| الحقل | النوع | الوصف |
|---|---|---|
| `id` | `Int` | @id @default(autoincrement()) |
| `tenantId` | `String` | @default("default") @map("tenant_id") |
| `sourceDocType` | `String` | @map("source_doc_type") // PO, PR, EXPENSE |
| `sourceDocId` | `Int` | @map("source_doc_id") |
| `accountId` | `Int` | @map("account_id") |
| `costCenterId` | `Int?` | @map("cost_center_id") |
| `amount` | `Decimal` |  |
| `status` | `String` | @default("ACTIVE") // ACTIVE, RELEASED, CANCELLED |
| `createdAt` | `DateTime` | @default(now()) @map("created_at") |
| `releasedAt` | `DateTime?` | @map("released_at") |
| `account` | `Account` | @relation(fields: [accountId], references: [id]) |
| `costCenter` | `CostCenter?` | @relation(fields: [costCenterId], references: [id]) |

## Model: `CommissionRule`
| الحقل | النوع | الوصف |
|---|---|---|
| `id` | `Int` | @id @default(autoincrement()) |
| `tenantId` | `String` | @default("default") @map("tenant_id") |
| `name` | `String` |  |
| `targetAmount` | `Decimal` | @map("target_amount") @db.Decimal(20, 4) |
| `rewardType` | `String` | @default("PERCENTAGE") // PERCENTAGE or FIXED |
| `rewardValue` | `Decimal` | @map("reward_value") @db.Decimal(20, 4) |
| `isActive` | `Boolean` | @default(true) @map("is_active") |
| `createdAt` | `DateTime` | @default(now()) @map("created_at") |
| `payments` | `SalesmanCommission[]` |  |

## Model: `SalesmanCommission`
| الحقل | النوع | الوصف |
|---|---|---|
| `id` | `Int` | @id @default(autoincrement()) |
| `tenantId` | `String` | @default("default") @map("tenant_id") |
| `employeeId` | `Int` | @map("employee_id") |
| `ruleId` | `Int` | @map("rule_id") |
| `calculatedAmount` | `Decimal` | @map("calculated_amount") @db.Decimal(20, 4) |
| `periodMonth` | `Int` | @map("period_month") |
| `periodYear` | `Int` | @map("period_year") |
| `isPaid` | `Boolean` | @default(false) @map("is_paid") |
| `paymentDate` | `DateTime?` | @map("payment_date") |
| `employee` | `Employee` | @relation(fields: [employeeId], references: [id]) |
| `rule` | `CommissionRule` | @relation(fields: [ruleId], references: [id]) |

## Model: `ProductSerialNumber`
| الحقل | النوع | الوصف |
|---|---|---|
| `id` | `Int` | @id @default(autoincrement()) |
| `tenantId` | `String` | @default("default") @map("tenant_id") |
| `productId` | `Int` | @map("product_id") |
| `serialNumber` | `String` | @unique @map("serial_number") |
| `stockId` | `Int` | @map("stock_id") |
| `status` | `String` | @default("IN_STOCK") // IN_STOCK, SOLD, RETURNED, DEFECTIVE |
| `purchaseInvoiceId` | `Int?` | @map("purchase_invoice_id") |
| `salesInvoiceId` | `Int?` | @map("sales_invoice_id") |
| `createdAt` | `DateTime` | @default(now()) @map("created_at") |
| `product` | `Product` | @relation(fields: [productId], references: [id]) |
| `stock` | `Stock` | @relation(fields: [stockId], references: [id]) |

## Model: `PettyCashFund`
| الحقل | النوع | الوصف |
|---|---|---|
| `id` | `Int` | @id @default(autoincrement()) |
| `tenantId` | `String` | @default("default") @map("tenant_id") |
| `custodianId` | `Int` | @map("custodian_id") // Employee |
| `fundName` | `String` | @map("fund_name") |
| `maxLimit` | `Decimal` | @map("max_limit") @db.Decimal(20, 4) |
| `currentBalance` | `Decimal` | @map("current_balance") @db.Decimal(20, 4) |
| `status` | `String` | @default("ACTIVE") |
| `createdAt` | `DateTime` | @default(now()) @map("created_at") |
| `custodian` | `Employee` | @relation(fields: [custodianId], references: [id]) |

## Model: `SystemAlert`
| الحقل | النوع | الوصف |
|---|---|---|
| `id` | `Int` | @id @default(autoincrement()) |
| `tenantId` | `String` | @default("default") @map("tenant_id") |
| `userId` | `Int` | @map("user_id") |
| `title` | `String` |  |
| `message` | `String` |  |
| `read` | `Boolean` | @default(false) |
| `alertType` | `String` | @default("INFO") // INFO, WARNING, URGENT, WORKFLOW |
| `linkUrl` | `String?` | @map("link_url") |
| `createdAt` | `DateTime` | @default(now()) @map("created_at") |
| `user` | `User` | @relation(fields: [userId], references: [id]) |

## Model: `TenantAccount`
| الحقل | النوع | الوصف |
|---|---|---|
| `id` | `Int` | @id @default(autoincrement()) |
| `tenantId` | `String` | @default("default") @map("tenant_id") |
| `clerkUserId` | `String?` | @unique @map("clerk_user_id") // Clerk user ID for fast lookup |
| `userEmail` | `String` | @unique @map("user_email") |
| `orgName` | `String` | @map("org_name") |
| `vatNumber` | `String` | @map("vat_number") |
| `subdomain` | `String` | @unique // e.g., 'n11', 'n12' |
| `status` | `String` | @default("pending") // pending, active, suspended |
| `createdAt` | `DateTime` | @default(now()) @map("created_at") |
| `updatedAt` | `DateTime` | @updatedAt @map("updated_at") |
| `paymentStatus` | `String` | @default("pending") @map("payment_status") // pending, paid, cancelled |
| `subscriptionDuration` | `String` | @default("1_year") @map("subscription_duration") // 1_year, 6_months, 1_month |
| `subscriptionStatus` | `String?` | @default("trial") @map("subscription_status") // trial, active, suspended |
| `plan` | `String?` | @default("free") @map("plan") // free, basic, professional, enterprise |
| `trialEndsAt` | `DateTime?` | @map("trial_ends_at") |
| `invoiceQuota` | `Int?` | @default(30) @map("invoice_quota") |
| `productQuota` | `Int?` | @default(1000) @map("product_quota") |
| `userQuota` | `Int?` | @default(1) @map("user_quota") |
| `desktopLicenses` | `DesktopLicense[]` |  |
| `featureFlags` | `TenantFeatureFlag[]` |  |

## Model: `DesktopLicense`
| الحقل | النوع | الوصف |
|---|---|---|
| `id` | `Int` | @id @default(autoincrement()) |
| `tenantId` | `String` | @default("default") @map("tenant_id") |
| `licenseKey` | `String` | @unique @map("license_key") |
| `hardwareId` | `String?` | @map("hardware_id") |
| `companyNameAr` | `String?` | @map("company_name_ar") |
| `companyNameEn` | `String?` | @map("company_name_en") |
| `businessDomain` | `String?` | @map("business_domain") |
| `mobile` | `String?` | @map("mobile") |
| `vatNumber` | `String?` | @map("vat_number") |
| `crnNumber` | `String?` | @map("crn_number") |
| `city` | `String?` | @map("city") |
| `cityEn` | `String?` | @map("city_en") |
| `district` | `String?` | @map("district") |
| `streetName` | `String?` | @map("street_name") |
| `buildingNo` | `String?` | @map("building_no") |
| `postalCode` | `String?` | @map("postal_code") |
| `contactEmail` | `String?` | @map("contact_email") |
| `contactPhone` | `String?` | @map("contact_phone") |
| `status` | `String?` | @default("trial") |
| `appVersion` | `String?` | @map("app_version") |
| `maxDevices` | `Int?` | @default(1) @map("max_devices") |
| `activatedDevices` | `Int?` | @default(0) @map("activated_devices") |
| `trialEndsAt` | `DateTime?` | @map("trial_ends_at") |
| `expiresAt` | `DateTime?` | @map("expires_at") |
| `activatedAt` | `DateTime?` | @map("activated_at") |
| `lastVerifiedAt` | `DateTime?` | @map("last_verified_at") |
| `notes` | `String?` | @map("notes") |
| `createdAt` | `DateTime?` | @default(now()) @map("created_at") |
| `updatedAt` | `DateTime?` | @default(now()) @map("updated_at") |
| `tenantAccountId` | `Int?` | @map("tenant_account_id") |
| `tenantAccount` | `TenantAccount?` | @relation(fields: [tenantAccountId], references: [id]) |
| `featureFlags` | `TenantFeatureFlag[]` |  |

## Model: `TenantFeatureFlag`
| الحقل | النوع | الوصف |
|---|---|---|
| `id` | `Int` | @id @default(autoincrement()) |
| `tenantId` | `String` | @default("default") @map("tenant_id") |
| `moduleName` | `String` | @map("module_name") |
| `isEnabled` | `Boolean` | @default(true) @map("is_enabled") |
| `createdAt` | `DateTime?` | @default(now()) @map("created_at") |
| `updatedAt` | `DateTime?` | @default(now()) @map("updated_at") |
| `tenantAccountId` | `Int?` | @map("tenant_account_id") |
| `tenantAccount` | `TenantAccount?` | @relation(fields: [tenantAccountId], references: [id]) |
| `desktopLicenseId` | `Int?` | @map("desktop_license_id") |
| `desktopLicense` | `DesktopLicense?` | @relation(fields: [desktopLicenseId], references: [id]) |

## Model: `RestaurantZone`
| الحقل | النوع | الوصف |
|---|---|---|
| `id` | `Int` | @id @default(autoincrement()) |
| `tenantId` | `String` | @default("default") @map("tenant_id") |
| `name` | `String` |  |
| `branchId` | `Int?` | @map("branch_id") |
| `tables` | `RestaurantTable[]` |  |

## Model: `RestaurantTable`
| الحقل | النوع | الوصف |
|---|---|---|
| `id` | `Int` | @id @default(autoincrement()) |
| `tenantId` | `String` | @default("default") @map("tenant_id") |
| `zoneId` | `Int` | @map("zone_id") |
| `name` | `String` |  |
| `capacity` | `Int` | @default(4) |
| `status` | `String` | @default("Available") // Available, Occupied, Reserved |
| `qrToken` | `String?` | @unique @map("qr_token") |
| `zone` | `RestaurantZone` | @relation(fields: [zoneId], references: [id]) |
| `sessions` | `RestaurantSession[]` |  |
| `waiterCalls` | `WaiterCall[]` |  |

## Model: `RestaurantSession`
| الحقل | النوع | الوصف |
|---|---|---|
| `id` | `Int` | @id @default(autoincrement()) |
| `tenantId` | `String` | @default("default") @map("tenant_id") |
| `tableId` | `Int` | @map("table_id") |
| `startTime` | `DateTime` | @default(now()) @map("start_time") |
| `endTime` | `DateTime?` | @map("end_time") |
| `customerId` | `Int?` | @map("customer_id") |
| `status` | `String` | @default("Active") // Active, Closed |
| `table` | `RestaurantTable` | @relation(fields: [tableId], references: [id]) |

## Model: `DesktopCrashReport`
| الحقل | النوع | الوصف |
|---|---|---|
| `id` | `Int` | @id @default(autoincrement()) |
| `tenantId` | `String` | @default("default") @map("tenant_id") |
| `timestamp` | `DateTime` | @default(now()) |
| `osPlatform` | `String?` | @map("os_platform") |
| `osRelease` | `String?` | @map("os_release") |
| `appVersion` | `String?` | @map("app_version") |
| `errorMessage` | `String` | @map("error_message") |
| `stackTrace` | `String?` | @map("stack_trace") |
| `tenantInfo` | `String?` | @map("tenant_info") |
| `isResolved` | `Boolean` | @default(false) @map("is_resolved") |
| `notes` | `String?` |  |
| `createdAt` | `DateTime` | @default(now()) @map("created_at") |

## Model: `WorkShift`
| الحقل | النوع | الوصف |
|---|---|---|
| `id` | `Int` | @id @default(autoincrement()) |
| `tenantId` | `String` | @default("default") @map("tenant_id") |
| `name` | `String` | // (see field name for description) |
| `startTime` | `String` | @map("start_time") // "08:00" |
| `endTime` | `String` | @map("end_time") // "16:00" |
| `breakMins` | `Int` | @default(60) @map("break_mins") |
| `active` | `Boolean` | @default(true) |

## Model: `VendorRating`
| الحقل | النوع | الوصف |
|---|---|---|
| `id` | `Int` | @id @default(autoincrement()) |
| `tenantId` | `String` | @default("default") @map("tenant_id") |
| `supplierId` | `Int` | @map("supplier_id") |
| `grnId` | `Int?` | @map("grn_id") |
| `quality` | `Int` | @default(5) // (see field name for description) |
| `delivery` | `Int` | @default(5) // (see field name for description) |
| `pricing` | `Int` | @default(5) // (see field name for description) |
| `notes` | `String?` |  |
| `ratedBy` | `Int?` | @map("rated_by") |
| `ratedAt` | `DateTime` | @default(now()) @map("rated_at") |

## Model: `FiscalPeriod`
| الحقل | النوع | الوصف |
|---|---|---|
| `id` | `Int` | @id @default(autoincrement()) |
| `tenantId` | `String` | @default("default") @map("tenant_id") |
| `year` | `Int` |  |
| `month` | `Int` |  |
| `status` | `String` | @default("open") // open, closed, locked |
| `closedBy` | `Int?` | @map("closed_by") |
| `closedAt` | `DateTime?` | @map("closed_at") |
| `notes` | `String?` |  |
| `periodCloseChecklists` | `PeriodCloseChecklist[]` |  |
| `periodLockLogs` | `PeriodLockLog[]` |  |
| `fiscalYear` | `FiscalYear?` | @relation(fields: [year], references: [yearNumber]) |

## Model: `FiscalYear`
| الحقل | النوع | الوصف |
|---|---|---|
| `id` | `Int` | @id @default(autoincrement()) |
| `tenantId` | `String` | @default("default") @map("tenant_id") |
| `yearNumber` | `Int` | @unique |
| `startDate` | `DateTime` |  |
| `endDate` | `DateTime` |  |
| `status` | `String` | @default("OPEN") // OPEN, CLOSING_IN_PROGRESS, LOCKED, REOPENED |
| `closingJournalId` | `Int?` |  |
| `rolloverJournalId` | `Int?` |  |
| `closedAt` | `DateTime?` |  |
| `closedByUserId` | `String?` |  |
| `reopenedAt` | `DateTime?` |  |
| `reopenedByUserId` | `String?` |  |
| `reopenedReason` | `String?` |  |
| `periods` | `FiscalPeriod[]` |  |
| `closeRuns` | `YearEndCloseRun[]` |  |
| `openingBalances` | `OpeningBalance[]` |  |
| `immutableReports` | `ImmutableReport[]` |  |

## Model: `YearEndCloseRun`
| الحقل | النوع | الوصف |
|---|---|---|
| `id` | `Int` | @id @default(autoincrement()) |
| `tenantId` | `String` | @default("default") @map("tenant_id") |
| `fiscalYearId` | `Int` |  |
| `fiscalYear` | `FiscalYear` | @relation(fields: [fiscalYearId], references: [id]) |
| `status` | `String` | // 'IN_PROGRESS' | 'COMPLETED' | 'FAILED' | 'ROLLED_BACK' |
| `startedAt` | `DateTime` | @default(now()) |
| `startedByUserId` | `String` |  |
| `completedAt` | `DateTime?` |  |
| `closingJournalId` | `Int?` |  |
| `rolloverJournalId` | `Int?` |  |
| `reportsGeneratedAt` | `DateTime?` |  |
| `errors` | `Json?` |  |
| `metadata` | `Json?` | // {totalRevenue, totalExpenses, netPL, ...} |
| `tasks` | `YearEndCloseTask[]` |  |

## Model: `YearEndCloseTask`
| الحقل | النوع | الوصف |
|---|---|---|
| `id` | `Int` | @id @default(autoincrement()) |
| `tenantId` | `String` | @default("default") @map("tenant_id") |
| `runId` | `Int` |  |
| `run` | `YearEndCloseRun` | @relation(fields: [runId], references: [id], onDelete: Cascade) |
| `taskCode` | `String` | // unique code per type |
| `taskName` | `String` |  |
| `taskNameAr` | `String` |  |
| `category` | `String` | // 'PRE_CLOSE' | 'ADJUSTMENTS' | 'PROVISIONS' | 'TAX' | 'INTER_PERIOD' | 'CLOSING' | 'REPORTING' |
| `sequenceNumber` | `Int` | // execution order within category |
| `autoExecutable` | `Boolean` | @default(false) |
| `status` | `String` | // 'PENDING' | 'IN_PROGRESS' | 'DONE' | 'SKIPPED' | 'FAILED' | 'BLOCKED' |
| `dependencies` | `String[]` | // taskCodes that must be done first |
| `assigneeUserId` | `String?` |  |
| `estimatedMinutes` | `Int?` |  |
| `startedAt` | `DateTime?` |  |
| `completedAt` | `DateTime?` |  |
| `completedByUserId` | `String?` |  |
| `evidenceFileId` | `Int?` |  |
| `evidenceRequired` | `Boolean` | @default(false) |
| `notes` | `String?` |  |
| `result` | `Json?` | // task-specific output |
| `errorMessage` | `String?` |  |
| `retryCount` | `Int` | @default(0) |

## Model: `OpeningBalance`
| الحقل | النوع | الوصف |
|---|---|---|
| `id` | `Int` | @id @default(autoincrement()) |
| `tenantId` | `String` | @default("default") @map("tenant_id") |
| `fiscalYearId` | `Int` |  |
| `fiscalYear` | `FiscalYear` | @relation(fields: [fiscalYearId], references: [id]) |
| `accountId` | `Int` |  |
| `account` | `Account` | @relation(fields: [accountId], references: [id]) |
| `amountDebit` | `Decimal` | @db.Decimal(20, 4) |
| `amountCredit` | `Decimal` | @db.Decimal(20, 4) |
| `currency` | `String` | @default("SAR") |
| `costCenterId` | `Int?` |  |
| `branchId` | `Int?` |  |
| `projectId` | `Int?` |  |
| `bookId` | `Int` | @default(1) |
| `sourceJournalId` | `Int` | // Brought forward JE |
| `createdAt` | `DateTime` | @default(now()) |

## Model: `ImmutableReport`
| الحقل | النوع | الوصف |
|---|---|---|
| `id` | `Int` | @id @default(autoincrement()) |
| `tenantId` | `String` | @default("default") @map("tenant_id") |
| `fiscalYearId` | `Int?` |  |
| `fiscalYear` | `FiscalYear?` | @relation(fields: [fiscalYearId], references: [id]) |
| `reportType` | `String` | // 'TRIAL_BALANCE' | 'INCOME_STATEMENT' | 'BALANCE_SHEET' | 'CASH_FLOW' | 'EQUITY_CHANGES' | 'NOTES_TO_FS' |
| `asOfDate` | `DateTime` |  |
| `generatedAt` | `DateTime` | @default(now()) |
| `generatedByUserId` | `String` |  |
| `payload` | `Json` | // full report data |
| `pdfFileUrl` | `String?` |  |
| `excelFileUrl` | `String?` |  |
| `jsonFileUrl` | `String?` |  |
| `hash` | `String` | // SHA-256 of payload |
| `signedAt` | `DateTime?` |  |
| `signedByUserId` | `String?` |  |
| `signature` | `String?` | // digital signature (base64) |
| `bookId` | `Int?` |  |
| `language` | `String` | @default("ar") |

## Model: `FiscalYearReopenRequest`
| الحقل | النوع | الوصف |
|---|---|---|
| `id` | `Int` | @id @default(autoincrement()) |
| `tenantId` | `String` | @default("default") @map("tenant_id") |
| `fiscalYearId` | `Int` |  |
| `requestedAt` | `DateTime` | @default(now()) |
| `requestedByUserId` | `String` |  |
| `reason` | `String` |  |
| `justification` | `String` | @db.Text |
| `externalAuditorEmail` | `String?` |  |
| `externalAuditorSignature` | `String?` |  |
| `status` | `String` | @default("PENDING") // PENDING | APPROVED | REJECTED |
| `reviewedByUserId` | `String?` |  |
| `reviewedAt` | `DateTime?` |  |
| `reviewNotes` | `String?` |  |
| `approvalChain` | `Json` | // [{userId, approvedAt, role}] |

## Model: `ServiceTicket`
| الحقل | النوع | الوصف |
|---|---|---|
| `id` | `Int` | @id @default(autoincrement()) |
| `tenantId` | `String` | @default("default") @map("tenant_id") |
| `ticketNo` | `Int` | @map("ticket_no") |
| `customerId` | `Int?` | @map("customer_id") |
| `technicianId` | `Int?` | @map("technician_id") |
| `type` | `String` | @default("repair") // repair, installation, maintenance, inspection |
| `priority` | `String` | @default("normal") // low, normal, high, urgent |
| `description` | `String?` |  |
| `scheduledDate` | `DateTime?` | @map("scheduled_date") |
| `completedDate` | `DateTime?` | @map("completed_date") |
| `status` | `String` | @default("open") // open, assigned, in_progress, completed, cancelled |
| `laborCost` | `Decimal` | @default(0) @map("labor_cost") @db.Decimal(20, 4) |
| `partsCost` | `Decimal` | @default(0) @map("parts_cost") @db.Decimal(20, 4) |
| `totalCost` | `Decimal` | @default(0) @map("total_cost") @db.Decimal(20, 4) |
| `latitude` | `Float?` |  |
| `longitude` | `Float?` |  |
| `notes` | `String?` |  |
| `createdAt` | `DateTime` | @default(now()) @map("created_at") |

## Model: `Shipment`
| الحقل | النوع | الوصف |
|---|---|---|
| `id` | `Int` | @id @default(autoincrement()) |
| `tenantId` | `String` | @default("default") @map("tenant_id") |
| `salesInvoiceId` | `Int?` | @map("sales_invoice_id") |
| `purchaseOrderId` | `Int?` | @map("purchase_order_id") |
| `carrier` | `String` | @default("") // SMSA, DHL, Aramex, FedEx |
| `trackingNumber` | `String` | @default("") @map("tracking_number") |
| `status` | `String` | @default("pending") // pending, picked_up, in_transit, delivered, returned |
| `estimatedDelivery` | `DateTime?` | @map("estimated_delivery") |
| `actualDelivery` | `DateTime?` | @map("actual_delivery") |
| `shippingCost` | `Decimal` | @default(0) @map("shipping_cost") @db.Decimal(20, 4) |
| `recipientName` | `String` | @default("") @map("recipient_name") |
| `recipientPhone` | `String` | @default("") @map("recipient_phone") |
| `recipientAddress` | `String` | @default("") @map("recipient_address") |
| `recipientCity` | `String` | @default("") @map("recipient_city") |
| `notes` | `String?` |  |
| `createdAt` | `DateTime` | @default(now()) @map("created_at") |
| `updatedAt` | `DateTime` | @updatedAt @map("updated_at") |

## Model: `PharmacyDrug`
| الحقل | النوع | الوصف |
|---|---|---|
| `id` | `Int` | @id @default(autoincrement()) |
| `tenantId` | `String` | @default("default") @map("tenant_id") |
| `productId` | `Int` | @unique @map("product_id") // (see field name for description) |
| `sfdaNumber` | `String` | @map("sfda_number") // (see field name for description) |
| `genericName` | `String` | @map("generic_name") // (see field name for description) |
| `genericNameEn` | `String` | @default("") @map("generic_name_en") |
| `drugClass` | `String` | @default("OTC") @map("drug_class") // OTC | Rx | CONTROLLED |
| `manufacturer` | `String?` |  |
| `countryOfOrigin` | `String?` | @map("country_of_origin") |
| `storageTemp` | `String` | @default("room") @map("storage_temp") // room | refrigerated | frozen |
| `mohMaxPrice` | `Decimal` | @default(0) @map("moh_max_price") @db.Decimal(20, 4) // (see field name for description) |
| `requiresRx` | `Boolean` | @default(false) @map("requires_rx") |
| `isControlled` | `Boolean` | @default(false) @map("is_controlled") // (see field name for description) |
| `active` | `Boolean` | @default(true) |
| `createdAt` | `DateTime` | @default(now()) @map("created_at") |
| `product` | `Product` | @relation(fields: [productId], references: [id]) |
| `prescriptionItems` | `PrescriptionItem[]` |  |
| `controlledLogs` | `ControlledDrugLog[]` |  |

## Model: `PharmacyPatient`
| الحقل | النوع | الوصف |
|---|---|---|
| `id` | `Int` | @id @default(autoincrement()) |
| `tenantId` | `String` | @default("default") @map("tenant_id") |
| `nationalId` | `String` | @unique @map("national_id") |
| `name` | `String` |  |
| `nameEn` | `String?` | @map("name_en") |
| `dateOfBirth` | `String?` | @map("date_of_birth") |
| `gender` | `String?` | // M | F |
| `phone` | `String?` |  |
| `allergies` | `String?` | // JSON array of allergy strings |
| `insuranceCompany` | `String?` | @map("insurance_company") |
| `insuranceCardNo` | `String?` | @map("insurance_card_no") |
| `copayPercent` | `Decimal` | @default(20) @map("copay_percent") @db.Decimal(8, 4) // (see field name for description) |
| `notes` | `String?` |  |
| `createdAt` | `DateTime` | @default(now()) @map("created_at") |
| `updatedAt` | `DateTime` | @updatedAt @map("updated_at") |
| `prescriptions` | `Prescription[]` |  |
| `insuranceClaims` | `InsuranceClaim[]` |  |
| `medicationLogs` | `MedicationLog[]` |  |

## Model: `Prescription`
| الحقل | النوع | الوصف |
|---|---|---|
| `id` | `Int` | @id @default(autoincrement()) |
| `tenantId` | `String` | @default("default") @map("tenant_id") |
| `patientId` | `Int` | @map("patient_id") |
| `wasfatyRef` | `String?` | @map("wasfaty_ref") // (see field name for description) |
| `doctorName` | `String?` | @map("doctor_name") |
| `doctorLicense` | `String?` | @map("doctor_license") |
| `clinicName` | `String?` | @map("clinic_name") |
| `prescriptionDate` | `String` | @map("prescription_date") |
| `expiryDate` | `String?` | @map("expiry_date") |
| `source` | `String` | @default("wasfaty") // wasfaty | paper | otc |
| `status` | `String` | @default("pending") // pending | dispensed | partial | cancelled |
| `imageUrl` | `String?` | @map("image_url") // (see field name for description) |
| `pharmacistId` | `Int?` | @map("pharmacist_id") |
| `dispensedAt` | `DateTime?` | @map("dispensed_at") |
| `notes` | `String?` |  |
| `createdAt` | `DateTime` | @default(now()) @map("created_at") |
| `patient` | `PharmacyPatient` | @relation(fields: [patientId], references: [id]) |
| `pharmacist` | `User?` | @relation("PrescriptionPharmacist", fields: [pharmacistId], references: [id]) |
| `items` | `PrescriptionItem[]` |  |
| `claims` | `InsuranceClaim[]` |  |

## Model: `PrescriptionItem`
| الحقل | النوع | الوصف |
|---|---|---|
| `id` | `Int` | @id @default(autoincrement()) |
| `tenantId` | `String` | @default("default") @map("tenant_id") |
| `prescriptionId` | `Int` | @map("prescription_id") |
| `drugId` | `Int` | @map("drug_id") |
| `drugName` | `String` | @map("drug_name") |
| `dosage` | `String?` | // (see field name for description) |
| `durationDays` | `Int?` | @map("duration_days") |
| `quantity` | `Decimal` |  |
| `dispensedQty` | `Decimal` | @default(0) @map("dispensed_qty") @db.Decimal(20, 4) |
| `status` | `String` | @default("pending") // pending | dispensed | partial |
| `prescription` | `Prescription` | @relation(fields: [prescriptionId], references: [id], onDelete: Cascade) |
| `drug` | `PharmacyDrug` | @relation(fields: [drugId], references: [id]) |

## Model: `InsuranceClaim`
| الحقل | النوع | الوصف |
|---|---|---|
| `id` | `Int` | @id @default(autoincrement()) |
| `tenantId` | `String` | @default("default") @map("tenant_id") |
| `patientId` | `Int` | @map("patient_id") |
| `prescriptionId` | `Int?` | @map("prescription_id") |
| `salesInvoiceId` | `Int?` | @map("sales_invoice_id") |
| `insuranceCompany` | `String` | @map("insurance_company") |
| `claimRef` | `String?` | @unique @map("claim_ref") // (see field name for description) |
| `totalAmount` | `Decimal` | @map("total_amount") @db.Decimal(20, 4) |
| `insuranceAmount` | `Decimal` | @map("insurance_amount") @db.Decimal(20, 4) // (see field name for description) |
| `patientAmount` | `Decimal` | @map("patient_amount") @db.Decimal(20, 4) // (see field name for description) |
| `status` | `String` | @default("submitted") // submitted | approved | rejected | paid |
| `rejectionReason` | `String?` | @map("rejection_reason") |
| `submittedAt` | `DateTime` | @default(now()) @map("submitted_at") |
| `resolvedAt` | `DateTime?` | @map("resolved_at") |
| `patient` | `PharmacyPatient` | @relation(fields: [patientId], references: [id]) |
| `prescription` | `Prescription?` | @relation(fields: [prescriptionId], references: [id]) |

## Model: `ControlledDrugLog`
| الحقل | النوع | الوصف |
|---|---|---|
| `id` | `Int` | @id @default(autoincrement()) |
| `tenantId` | `String` | @default("default") @map("tenant_id") |
| `drugId` | `Int` | @map("drug_id") |
| `patientNationalId` | `String` | @map("patient_national_id") |
| `patientName` | `String` | @map("patient_name") |
| `doctorName` | `String` | @map("doctor_name") |
| `doctorLicense` | `String` | @map("doctor_license") |
| `pharmacistId` | `Int` | @map("pharmacist_id") |
| `quantity` | `Decimal` |  |
| `batchNo` | `String?` | @map("batch_no") |
| `dispensedAt` | `DateTime` | @default(now()) @map("dispensed_at") |
| `notes` | `String?` |  |
| `createdAt` | `DateTime` | @default(now()) @map("created_at") |
| `drug` | `PharmacyDrug` | @relation(fields: [drugId], references: [id]) |
| `pharmacist` | `User` | @relation("ControlledDrugPharmacist", fields: [pharmacistId], references: [id]) |

## Model: `MedicationLog`
| الحقل | النوع | الوصف |
|---|---|---|
| `id` | `Int` | @id @default(autoincrement()) |
| `tenantId` | `String` | @default("default") @map("tenant_id") |
| `patientId` | `Int` | @map("patient_id") |
| `drugName` | `String` | @map("drug_name") |
| `dosage` | `String?` |  |
| `quantity` | `Decimal` |  |
| `pharmacistId` | `Int?` | @map("pharmacist_id") |
| `dispensedAt` | `DateTime` | @default(now()) @map("dispensed_at") |
| `patient` | `PharmacyPatient` | @relation(fields: [patientId], references: [id]) |

## Model: `ZATCARecord`
| الحقل | النوع | الوصف |
|---|---|---|
| `id` | `Int` | @id @default(autoincrement()) |
| `tenantId` | `String` | @default("default") @map("tenant_id") |
| `invoiceId` | `Int` | @map("invoice_id") |
| `invoiceType` | `String` | @map("invoice_type") // POS, RENT, SCHOOL, PAYROLL |
| `status` | `String` | @default("sent") // sent, confirmed, failed |
| `zatcaHash` | `String?` | @map("zatca_hash") |
| `zatcaQr` | `String?` | @map("zatca_qr") |
| `zatcaResponse` | `String?` | @map("zatca_response") |
| `zatcaXml` | `String?` | @map("zatca_xml") |
| `tenantAccountId` | `Int?` | @map("tenant_account_id") |
| `createdAt` | `DateTime` | @default(now()) @map("created_at") |

## Model: `RentInvoice`
| الحقل | النوع | الوصف |
|---|---|---|
| `id` | `Int` | @id @default(autoincrement()) |
| `tenantId` | `String` | @default("default") @map("tenant_id") |
| `invoiceNo` | `String` | @map("invoice_no") |
| `status` | `String` | @default("pending") |
| `total` | `Decimal` | @default(0) |
| `customerId` | `Int?` | @map("customer_id") |
| `tenantAccountId` | `Int?` | @map("tenant_account_id") |
| `createdAt` | `DateTime` | @default(now()) @map("created_at") |
| `customer` | `Customer?` | @relation(fields: [customerId], references: [id]) |
| `details` | `RentInvoiceDetail[]` |  |
| `deletedAt` | `DateTime?` | // P1.2 soft-delete ط·آ·ط¢آ·ط·آ¢ط¢آ·ط·آ·ط¢آ¢ط·آ¢ط¢آ·ط·آ·ط¢آ·ط·آ¢ط¢آ¢ط·آ·ط¢آ¢ط·آ¢ط¢آ·ط·آ·ط¢آ·ط·آ¢ط¢آ·ط·آ·ط¢آ¢ط·آ¢ط¢آ¢ط·آ·ط¢آ·ط·آ¢ط¢آ¢ط·آ·ط¢آ¢ط·آ¢ط¢آ£ط·آ·ط¢آ·ط·آ¢ط¢آ·ط·آ·ط¢آ¢ط·آ¢ط¢آ·ط·آ·ط¢آ·ط·آ¢ط¢آ¢ط·آ·ط¢آ¢ط·آ¢ط¢آ¢ط·آ·ط¢آ·ط·آ¢ط¢آ·ط·آ·ط¢آ¢ط·آ¢ط¢آ¢ط·آ·ط¢آ·ط·آ¢ط¢آ¢ط·آ·ط¢آ¢ط·آ¢ط¢آ¢ط·آ·ط¢آ·ط·آ¢ط¢آ·ط·آ·ط¢آ¢ط·آ¢ط¢آ·ط·آ·ط¢آ·ط·آ¢ط¢آ¢ط·آ·ط¢آ¢ط·آ¢ط¢آ£ط·آ·ط¢آ·ط·آ¢ط¢آ·ط·آ·ط¢آ¢ط·آ¢ط¢آ¢ط·آ·ط¢آ·ط·آ¢ط¢آ¢ط·آ·ط¢آ¢ط·آ¢ط¢آ¢ط·آ·ط¢آ·ط·آ¢ط¢آ·ط·آ·ط¢آ¢ط·آ¢ط¢آ£ط·آ·ط¢آ·ط·آ¢ط¢آ¢ط·آ·ط¢آ¢ط·آ¢ط¢آ¢ط·آ·ط¢آ·ط·آ¢ط¢آ£ط·آ·ط¢آ¢ط·آ¢ط¢آ¢ط·آ·ط¢آ£ط·آ¢ط¢آ¢ط·آ£ط¢آ¢ط£آ¢أ¢â€ڑآ¬ط¹â€کط·آ¢ط¢آ¬ط·آ·ط¢آ¹ط£آ¢أ¢â€ڑآ¬ط¹آ©ط·آ·ط¢آ·ط·آ¢ط¢آ¢ط·آ·ط¢آ¢ط·آ¢ط¢آ¬ط·آ·ط¢آ·ط·آ¢ط¢آ·ط·آ·ط¢آ¢ط·آ¢ط¢آ¹ط·آ·ط¢آ£ط·آ¢ط¢آ¢ط·آ£ط¢آ¢ط£آ¢أ¢â€ڑآ¬ط¹â€کط·آ¢ط¢آ¬ط·آ·ط¢آ¹ط·آ¢ط¢آ©ط·آ·ط¢آ·ط·آ¢ط¢آ·ط·آ·ط¢آ¢ط·آ¢ط¢آ·ط·آ·ط¢آ·ط·آ¢ط¢آ¢ط·آ·ط¢آ¢ط·آ¢ط¢آ¢ط·آ·ط¢آ·ط·آ¢ط¢آ·ط·آ·ط¢آ¢ط·آ¢ط¢آ¢ط·آ·ط¢آ·ط·آ¢ط¢آ¢ط·آ·ط¢آ¢ط·آ¢ط¢آ¬ط·آ·ط¢آ·ط·آ¢ط¢آ·ط·آ·ط¢آ¢ط·آ¢ط¢آ·ط·آ·ط¢آ·ط·آ¢ط¢آ¢ط·آ·ط¢آ¢ط·آ¢ط¢آ£ط·آ·ط¢آ·ط·آ¢ط¢آ·ط·آ·ط¢آ¢ط·آ¢ط¢آ¢ط·آ·ط¢آ·ط·آ¢ط¢آ¢ط·آ·ط¢آ¢ط·آ¢ط¢آ¢ط·آ·ط¢آ·ط·آ¢ط¢آ·ط·آ·ط¢آ¢ط·آ¢ط¢آ£ط·آ·ط¢آ·ط·آ¢ط¢آ¢ط·آ·ط¢آ¢ط·آ¢ط¢آ¢ط·آ·ط¢آ·ط·آ¢ط¢آ£ط·آ·ط¢آ¢ط·آ¢ط¢آ¢ط·آ·ط¢آ£ط·آ¢ط¢آ¢ط·آ£ط¢آ¢ط£آ¢أ¢â‚¬ع‘ط¢آ¬ط·آ¹أ¢â‚¬ع©ط·آ·ط¢آ¢ط·آ¢ط¢آ¬ط·آ·ط¢آ·ط·آ¢ط¢آ¹ط·آ£ط¢آ¢ط£آ¢أ¢â‚¬ع‘ط¢آ¬ط·آ¹ط¢آ©ط·آ·ط¢آ·ط·آ¢ط¢آ·ط·آ·ط¢آ¢ط·آ¢ط¢آ¢ط·آ·ط¢آ·ط·آ¢ط¢آ¢ط·آ·ط¢آ¢ط·آ¢ط¢آ¬ط·آ·ط¢آ·ط·آ¢ط¢آ·ط·آ·ط¢آ¢ط·آ¢ط¢آ£ط·آ·ط¢آ·ط·آ¢ط¢آ¢ط·آ·ط¢آ¢ط·آ¢ط¢آ¢ط·آ·ط¢آ·ط·آ¢ط¢آ£ط·آ·ط¢آ¢ط·آ¢ط¢آ¢ط·آ·ط¢آ£ط·آ¢ط¢آ¢ط·آ£ط¢آ¢ط£آ¢أ¢â€ڑآ¬ط¹â€کط·آ¢ط¢آ¬ط·آ·ط¢آ¹ط£آ¢أ¢â€ڑآ¬ط¹آ©ط·آ·ط¢آ·ط·آ¢ط¢آ¢ط·آ·ط¢آ¢ط·آ¢ط¢آ¬ط·آ·ط¢آ·ط·آ¢ط¢آ·ط·آ·ط¢آ¢ط·آ¢ط¢آ¥ط·آ·ط¢آ£ط·آ¢ط¢آ¢ط·آ£ط¢آ¢ط£آ¢أ¢â€ڑآ¬ط¹â€کط·آ¢ط¢آ¬ط·آ£ط¢آ¢ط£آ¢أ¢â€ڑآ¬أ¢â‚¬ع†ط·آ¢ط¢آ¢ do not use hard DELETE |

## Model: `RentInvoiceDetail`
| الحقل | النوع | الوصف |
|---|---|---|
| `id` | `Int` | @id @default(autoincrement()) |
| `tenantId` | `String` | @default("default") @map("tenant_id") |
| `invoiceId` | `Int` | @map("invoice_id") |
| `description` | `String?` |  |
| `quantity` | `Decimal` | @default(1) |
| `unitPrice` | `Decimal` | @default(0) @db.Decimal(20, 4) |
| `total` | `Decimal` | @default(0) |
| `invoice` | `RentInvoice` | @relation(fields: [invoiceId], references: [id], onDelete: Cascade) |
| `deletedAt` | `DateTime?` | // P1.2 soft-delete ط·آ·ط¢آ·ط·آ¢ط¢آ·ط·آ·ط¢آ¢ط·آ¢ط¢آ·ط·آ·ط¢آ·ط·آ¢ط¢آ¢ط·آ·ط¢آ¢ط·آ¢ط¢آ·ط·آ·ط¢آ·ط·آ¢ط¢آ·ط·آ·ط¢آ¢ط·آ¢ط¢آ¢ط·آ·ط¢آ·ط·آ¢ط¢آ¢ط·آ·ط¢آ¢ط·آ¢ط¢آ£ط·آ·ط¢آ·ط·آ¢ط¢آ·ط·آ·ط¢آ¢ط·آ¢ط¢آ·ط·آ·ط¢آ·ط·آ¢ط¢آ¢ط·آ·ط¢آ¢ط·آ¢ط¢آ¢ط·آ·ط¢آ·ط·آ¢ط¢آ·ط·آ·ط¢آ¢ط·آ¢ط¢آ¢ط·آ·ط¢آ·ط·آ¢ط¢آ¢ط·آ·ط¢آ¢ط·آ¢ط¢آ¢ط·آ·ط¢آ·ط·آ¢ط¢آ·ط·آ·ط¢آ¢ط·آ¢ط¢آ·ط·آ·ط¢آ·ط·آ¢ط¢آ¢ط·آ·ط¢آ¢ط·آ¢ط¢آ£ط·آ·ط¢آ·ط·آ¢ط¢آ·ط·آ·ط¢آ¢ط·آ¢ط¢آ¢ط·آ·ط¢آ·ط·آ¢ط¢آ¢ط·آ·ط¢آ¢ط·آ¢ط¢آ¢ط·آ·ط¢آ·ط·آ¢ط¢آ·ط·آ·ط¢آ¢ط·آ¢ط¢آ£ط·آ·ط¢آ·ط·آ¢ط¢آ¢ط·آ·ط¢آ¢ط·آ¢ط¢آ¢ط·آ·ط¢آ·ط·آ¢ط¢آ£ط·آ·ط¢آ¢ط·آ¢ط¢آ¢ط·آ·ط¢آ£ط·آ¢ط¢آ¢ط·آ£ط¢آ¢ط£آ¢أ¢â€ڑآ¬ط¹â€کط·آ¢ط¢آ¬ط·آ·ط¢آ¹ط£آ¢أ¢â€ڑآ¬ط¹آ©ط·آ·ط¢آ·ط·آ¢ط¢آ¢ط·آ·ط¢آ¢ط·آ¢ط¢آ¬ط·آ·ط¢آ·ط·آ¢ط¢آ·ط·آ·ط¢آ¢ط·آ¢ط¢آ¹ط·آ·ط¢آ£ط·آ¢ط¢آ¢ط·آ£ط¢آ¢ط£آ¢أ¢â€ڑآ¬ط¹â€کط·آ¢ط¢آ¬ط·آ·ط¢آ¹ط·آ¢ط¢آ©ط·آ·ط¢آ·ط·آ¢ط¢آ·ط·آ·ط¢آ¢ط·آ¢ط¢آ·ط·آ·ط¢آ·ط·آ¢ط¢آ¢ط·آ·ط¢آ¢ط·آ¢ط¢آ¢ط·آ·ط¢آ·ط·آ¢ط¢آ·ط·آ·ط¢آ¢ط·آ¢ط¢آ¢ط·آ·ط¢آ·ط·آ¢ط¢آ¢ط·آ·ط¢آ¢ط·آ¢ط¢آ¬ط·آ·ط¢آ·ط·آ¢ط¢آ·ط·آ·ط¢آ¢ط·آ¢ط¢آ·ط·آ·ط¢آ·ط·آ¢ط¢آ¢ط·آ·ط¢آ¢ط·آ¢ط¢آ£ط·آ·ط¢آ·ط·آ¢ط¢آ·ط·آ·ط¢آ¢ط·آ¢ط¢آ¢ط·آ·ط¢آ·ط·آ¢ط¢آ¢ط·آ·ط¢آ¢ط·آ¢ط¢آ¢ط·آ·ط¢آ·ط·آ¢ط¢آ·ط·آ·ط¢آ¢ط·آ¢ط¢آ£ط·آ·ط¢آ·ط·آ¢ط¢آ¢ط·آ·ط¢آ¢ط·آ¢ط¢آ¢ط·آ·ط¢آ·ط·آ¢ط¢آ£ط·آ·ط¢آ¢ط·آ¢ط¢آ¢ط·آ·ط¢آ£ط·آ¢ط¢آ¢ط·آ£ط¢آ¢ط£آ¢أ¢â‚¬ع‘ط¢آ¬ط·آ¹أ¢â‚¬ع©ط·آ·ط¢آ¢ط·آ¢ط¢آ¬ط·آ·ط¢آ·ط·آ¢ط¢آ¹ط·آ£ط¢آ¢ط£آ¢أ¢â‚¬ع‘ط¢آ¬ط·آ¹ط¢آ©ط·آ·ط¢آ·ط·آ¢ط¢آ·ط·آ·ط¢آ¢ط·آ¢ط¢آ¢ط·آ·ط¢آ·ط·آ¢ط¢آ¢ط·آ·ط¢آ¢ط·آ¢ط¢آ¬ط·آ·ط¢آ·ط·آ¢ط¢آ·ط·آ·ط¢آ¢ط·آ¢ط¢آ£ط·آ·ط¢آ·ط·آ¢ط¢آ¢ط·آ·ط¢آ¢ط·آ¢ط¢آ¢ط·آ·ط¢آ·ط·آ¢ط¢آ£ط·آ·ط¢آ¢ط·آ¢ط¢آ¢ط·آ·ط¢آ£ط·آ¢ط¢آ¢ط·آ£ط¢آ¢ط£آ¢أ¢â€ڑآ¬ط¹â€کط·آ¢ط¢آ¬ط·آ·ط¢آ¹ط£آ¢أ¢â€ڑآ¬ط¹آ©ط·آ·ط¢آ·ط·آ¢ط¢آ¢ط·آ·ط¢آ¢ط·آ¢ط¢آ¬ط·آ·ط¢آ·ط·آ¢ط¢آ·ط·آ·ط¢آ¢ط·آ¢ط¢آ¥ط·آ·ط¢آ£ط·آ¢ط¢آ¢ط·آ£ط¢آ¢ط£آ¢أ¢â€ڑآ¬ط¹â€کط·آ¢ط¢آ¬ط·آ£ط¢آ¢ط£آ¢أ¢â€ڑآ¬أ¢â‚¬ع†ط·آ¢ط¢آ¢ do not use hard DELETE |

## Model: `SchoolInvoice`
| الحقل | النوع | الوصف |
|---|---|---|
| `id` | `Int` | @id @default(autoincrement()) |
| `tenantId` | `String` | @default("default") @map("tenant_id") |
| `invoiceNo` | `String` | @map("invoice_no") |
| `status` | `String` | @default("pending") |
| `total` | `Decimal` | @default(0) |
| `studentId` | `Int?` | @map("student_id") |
| `tenantAccountId` | `Int?` | @map("tenant_account_id") |
| `createdAt` | `DateTime` | @default(now()) @map("created_at") |
| `student` | `Student?` | @relation(fields: [studentId], references: [id]) |
| `details` | `SchoolInvoiceDetail[]` |  |

## Model: `SchoolInvoiceDetail`
| الحقل | النوع | الوصف |
|---|---|---|
| `id` | `Int` | @id @default(autoincrement()) |
| `tenantId` | `String` | @default("default") @map("tenant_id") |
| `invoiceId` | `Int` | @map("invoice_id") |
| `description` | `String?` |  |
| `quantity` | `Decimal` | @default(1) |
| `unitPrice` | `Decimal` | @default(0) @db.Decimal(20, 4) |
| `total` | `Decimal` | @default(0) |
| `invoice` | `SchoolInvoice` | @relation(fields: [invoiceId], references: [id], onDelete: Cascade) |

## Model: `PayrollInvoice`
| الحقل | النوع | الوصف |
|---|---|---|
| `id` | `Int` | @id @default(autoincrement()) |
| `tenantId` | `String` | @default("default") @map("tenant_id") |
| `invoiceNo` | `String` | @map("invoice_no") |
| `period` | `String?` |  |
| `total` | `Decimal` | @default(0) |
| `employeeId` | `Int?` | @map("employee_id") |
| `tenantAccountId` | `Int?` | @map("tenant_account_id") |
| `createdAt` | `DateTime` | @default(now()) @map("created_at") |
| `employee` | `Employee?` | @relation(fields: [employeeId], references: [id]) |
| `details` | `PayrollInvoiceDetail[]` |  |
| `deletedAt` | `DateTime?` | // P1.2 soft-delete ط·آ·ط¢آ·ط·آ¢ط¢آ·ط·آ·ط¢آ¢ط·آ¢ط¢آ·ط·آ·ط¢آ·ط·آ¢ط¢آ¢ط·آ·ط¢آ¢ط·آ¢ط¢آ·ط·آ·ط¢آ·ط·آ¢ط¢آ·ط·آ·ط¢آ¢ط·آ¢ط¢آ¢ط·آ·ط¢آ·ط·آ¢ط¢آ¢ط·آ·ط¢آ¢ط·آ¢ط¢آ£ط·آ·ط¢آ·ط·آ¢ط¢آ·ط·آ·ط¢آ¢ط·آ¢ط¢آ·ط·آ·ط¢آ·ط·آ¢ط¢آ¢ط·آ·ط¢آ¢ط·آ¢ط¢آ¢ط·آ·ط¢آ·ط·آ¢ط¢آ·ط·آ·ط¢آ¢ط·آ¢ط¢آ¢ط·آ·ط¢آ·ط·آ¢ط¢آ¢ط·آ·ط¢آ¢ط·آ¢ط¢آ¢ط·آ·ط¢آ·ط·آ¢ط¢آ·ط·آ·ط¢آ¢ط·آ¢ط¢آ·ط·آ·ط¢آ·ط·آ¢ط¢آ¢ط·آ·ط¢آ¢ط·آ¢ط¢آ£ط·آ·ط¢آ·ط·آ¢ط¢آ·ط·آ·ط¢آ¢ط·آ¢ط¢آ¢ط·آ·ط¢آ·ط·آ¢ط¢آ¢ط·آ·ط¢آ¢ط·آ¢ط¢آ¢ط·آ·ط¢آ·ط·آ¢ط¢آ·ط·آ·ط¢آ¢ط·آ¢ط¢آ£ط·آ·ط¢آ·ط·آ¢ط¢آ¢ط·آ·ط¢آ¢ط·آ¢ط¢آ¢ط·آ·ط¢آ·ط·آ¢ط¢آ£ط·آ·ط¢آ¢ط·آ¢ط¢آ¢ط·آ·ط¢آ£ط·آ¢ط¢آ¢ط·آ£ط¢آ¢ط£آ¢أ¢â€ڑآ¬ط¹â€کط·آ¢ط¢آ¬ط·آ·ط¢آ¹ط£آ¢أ¢â€ڑآ¬ط¹آ©ط·آ·ط¢آ·ط·آ¢ط¢آ¢ط·آ·ط¢آ¢ط·آ¢ط¢آ¬ط·آ·ط¢آ·ط·آ¢ط¢آ·ط·آ·ط¢آ¢ط·آ¢ط¢آ¹ط·آ·ط¢آ£ط·آ¢ط¢آ¢ط·آ£ط¢آ¢ط£آ¢أ¢â€ڑآ¬ط¹â€کط·آ¢ط¢آ¬ط·آ·ط¢آ¹ط·آ¢ط¢آ©ط·آ·ط¢آ·ط·آ¢ط¢آ·ط·آ·ط¢آ¢ط·آ¢ط¢آ·ط·آ·ط¢آ·ط·آ¢ط¢آ¢ط·آ·ط¢آ¢ط·آ¢ط¢آ¢ط·آ·ط¢آ·ط·آ¢ط¢آ·ط·آ·ط¢آ¢ط·آ¢ط¢آ¢ط·آ·ط¢آ·ط·آ¢ط¢آ¢ط·آ·ط¢آ¢ط·آ¢ط¢آ¬ط·آ·ط¢آ·ط·آ¢ط¢آ·ط·آ·ط¢آ¢ط·آ¢ط¢آ·ط·آ·ط¢آ·ط·آ¢ط¢آ¢ط·آ·ط¢آ¢ط·آ¢ط¢آ£ط·آ·ط¢آ·ط·آ¢ط¢آ·ط·آ·ط¢آ¢ط·آ¢ط¢آ¢ط·آ·ط¢آ·ط·آ¢ط¢آ¢ط·آ·ط¢آ¢ط·آ¢ط¢آ¢ط·آ·ط¢آ·ط·آ¢ط¢آ·ط·آ·ط¢آ¢ط·آ¢ط¢آ£ط·آ·ط¢آ·ط·آ¢ط¢آ¢ط·آ·ط¢آ¢ط·آ¢ط¢آ¢ط·آ·ط¢آ·ط·آ¢ط¢آ£ط·آ·ط¢آ¢ط·آ¢ط¢آ¢ط·آ·ط¢آ£ط·آ¢ط¢آ¢ط·آ£ط¢آ¢ط£آ¢أ¢â‚¬ع‘ط¢آ¬ط·آ¹أ¢â‚¬ع©ط·آ·ط¢آ¢ط·آ¢ط¢آ¬ط·آ·ط¢آ·ط·آ¢ط¢آ¹ط·آ£ط¢آ¢ط£آ¢أ¢â‚¬ع‘ط¢آ¬ط·آ¹ط¢آ©ط·آ·ط¢آ·ط·آ¢ط¢آ·ط·آ·ط¢آ¢ط·آ¢ط¢آ¢ط·آ·ط¢آ·ط·آ¢ط¢آ¢ط·آ·ط¢آ¢ط·آ¢ط¢آ¬ط·آ·ط¢آ·ط·آ¢ط¢آ·ط·آ·ط¢آ¢ط·آ¢ط¢آ£ط·آ·ط¢آ·ط·آ¢ط¢آ¢ط·آ·ط¢آ¢ط·آ¢ط¢آ¢ط·آ·ط¢آ·ط·آ¢ط¢آ£ط·آ·ط¢آ¢ط·آ¢ط¢آ¢ط·آ·ط¢آ£ط·آ¢ط¢آ¢ط·آ£ط¢آ¢ط£آ¢أ¢â€ڑآ¬ط¹â€کط·آ¢ط¢آ¬ط·آ·ط¢آ¹ط£آ¢أ¢â€ڑآ¬ط¹آ©ط·آ·ط¢آ·ط·آ¢ط¢آ¢ط·آ·ط¢آ¢ط·آ¢ط¢آ¬ط·آ·ط¢آ·ط·آ¢ط¢آ·ط·آ·ط¢آ¢ط·آ¢ط¢آ¥ط·آ·ط¢آ£ط·آ¢ط¢آ¢ط·آ£ط¢آ¢ط£آ¢أ¢â€ڑآ¬ط¹â€کط·آ¢ط¢آ¬ط·آ£ط¢آ¢ط£آ¢أ¢â€ڑآ¬أ¢â‚¬ع†ط·آ¢ط¢آ¢ do not use hard DELETE |

## Model: `PayrollInvoiceDetail`
| الحقل | النوع | الوصف |
|---|---|---|
| `id` | `Int` | @id @default(autoincrement()) |
| `tenantId` | `String` | @default("default") @map("tenant_id") |
| `invoiceId` | `Int` | @map("invoice_id") |
| `description` | `String?` |  |
| `amount` | `Decimal` | @default(0) |
| `type` | `String` | @default("addition") // addition, deduction |
| `invoice` | `PayrollInvoice` | @relation(fields: [invoiceId], references: [id], onDelete: Cascade) |
| `deletedAt` | `DateTime?` | // P1.2 soft-delete ط·آ·ط¢آ·ط·آ¢ط¢آ·ط·آ·ط¢آ¢ط·آ¢ط¢آ·ط·آ·ط¢آ·ط·آ¢ط¢آ¢ط·آ·ط¢آ¢ط·آ¢ط¢آ·ط·آ·ط¢آ·ط·آ¢ط¢آ·ط·آ·ط¢آ¢ط·آ¢ط¢آ¢ط·آ·ط¢آ·ط·آ¢ط¢آ¢ط·آ·ط¢آ¢ط·آ¢ط¢آ£ط·آ·ط¢آ·ط·آ¢ط¢آ·ط·آ·ط¢آ¢ط·آ¢ط¢آ·ط·آ·ط¢آ·ط·آ¢ط¢آ¢ط·آ·ط¢آ¢ط·آ¢ط¢آ¢ط·آ·ط¢آ·ط·آ¢ط¢آ·ط·آ·ط¢آ¢ط·آ¢ط¢آ¢ط·آ·ط¢آ·ط·آ¢ط¢آ¢ط·آ·ط¢آ¢ط·آ¢ط¢آ¢ط·آ·ط¢آ·ط·آ¢ط¢آ·ط·آ·ط¢آ¢ط·آ¢ط¢آ·ط·آ·ط¢آ·ط·آ¢ط¢آ¢ط·آ·ط¢آ¢ط·آ¢ط¢آ£ط·آ·ط¢آ·ط·آ¢ط¢آ·ط·آ·ط¢آ¢ط·آ¢ط¢آ¢ط·آ·ط¢آ·ط·آ¢ط¢آ¢ط·آ·ط¢آ¢ط·آ¢ط¢آ¢ط·آ·ط¢آ·ط·آ¢ط¢آ·ط·آ·ط¢آ¢ط·آ¢ط¢آ£ط·آ·ط¢آ·ط·آ¢ط¢آ¢ط·آ·ط¢آ¢ط·آ¢ط¢آ¢ط·آ·ط¢آ·ط·آ¢ط¢آ£ط·آ·ط¢آ¢ط·آ¢ط¢آ¢ط·آ·ط¢آ£ط·آ¢ط¢آ¢ط·آ£ط¢آ¢ط£آ¢أ¢â€ڑآ¬ط¹â€کط·آ¢ط¢آ¬ط·آ·ط¢آ¹ط£آ¢أ¢â€ڑآ¬ط¹آ©ط·آ·ط¢آ·ط·آ¢ط¢آ¢ط·آ·ط¢آ¢ط·آ¢ط¢آ¬ط·آ·ط¢آ·ط·آ¢ط¢آ·ط·آ·ط¢آ¢ط·آ¢ط¢آ¹ط·آ·ط¢آ£ط·آ¢ط¢آ¢ط·آ£ط¢آ¢ط£آ¢أ¢â€ڑآ¬ط¹â€کط·آ¢ط¢آ¬ط·آ·ط¢آ¹ط·آ¢ط¢آ©ط·آ·ط¢آ·ط·آ¢ط¢آ·ط·آ·ط¢آ¢ط·آ¢ط¢آ·ط·آ·ط¢آ·ط·آ¢ط¢آ¢ط·آ·ط¢آ¢ط·آ¢ط¢آ¢ط·آ·ط¢آ·ط·آ¢ط¢آ·ط·آ·ط¢آ¢ط·آ¢ط¢آ¢ط·آ·ط¢آ·ط·آ¢ط¢آ¢ط·آ·ط¢آ¢ط·آ¢ط¢آ¬ط·آ·ط¢آ·ط·آ¢ط¢آ·ط·آ·ط¢آ¢ط·آ¢ط¢آ·ط·آ·ط¢آ·ط·آ¢ط¢آ¢ط·آ·ط¢آ¢ط·آ¢ط¢آ£ط·آ·ط¢آ·ط·آ¢ط¢آ·ط·آ·ط¢آ¢ط·آ¢ط¢آ¢ط·آ·ط¢آ·ط·آ¢ط¢آ¢ط·آ·ط¢آ¢ط·آ¢ط¢آ¢ط·آ·ط¢آ·ط·آ¢ط¢آ·ط·آ·ط¢آ¢ط·آ¢ط¢آ£ط·آ·ط¢آ·ط·آ¢ط¢آ¢ط·آ·ط¢آ¢ط·آ¢ط¢آ¢ط·آ·ط¢آ·ط·آ¢ط¢آ£ط·آ·ط¢آ¢ط·آ¢ط¢آ¢ط·آ·ط¢آ£ط·آ¢ط¢آ¢ط·آ£ط¢آ¢ط£آ¢أ¢â‚¬ع‘ط¢آ¬ط·آ¹أ¢â‚¬ع©ط·آ·ط¢آ¢ط·آ¢ط¢آ¬ط·آ·ط¢آ·ط·آ¢ط¢آ¹ط·آ£ط¢آ¢ط£آ¢أ¢â‚¬ع‘ط¢آ¬ط·آ¹ط¢آ©ط·آ·ط¢آ·ط·آ¢ط¢آ·ط·آ·ط¢آ¢ط·آ¢ط¢آ¢ط·آ·ط¢آ·ط·آ¢ط¢آ¢ط·آ·ط¢آ¢ط·آ¢ط¢آ¬ط·آ·ط¢آ·ط·آ¢ط¢آ·ط·آ·ط¢آ¢ط·آ¢ط¢آ£ط·آ·ط¢آ·ط·آ¢ط¢آ¢ط·آ·ط¢آ¢ط·آ¢ط¢آ¢ط·آ·ط¢آ·ط·آ¢ط¢آ£ط·آ·ط¢آ¢ط·آ¢ط¢آ¢ط·آ·ط¢آ£ط·آ¢ط¢آ¢ط·آ£ط¢آ¢ط£آ¢أ¢â€ڑآ¬ط¹â€کط·آ¢ط¢آ¬ط·آ·ط¢آ¹ط£آ¢أ¢â€ڑآ¬ط¹آ©ط·آ·ط¢آ·ط·آ¢ط¢آ¢ط·آ·ط¢آ¢ط·آ¢ط¢آ¬ط·آ·ط¢آ·ط·آ¢ط¢آ·ط·آ·ط¢آ¢ط·آ¢ط¢آ¥ط·آ·ط¢آ£ط·آ¢ط¢آ¢ط·آ£ط¢آ¢ط£آ¢أ¢â€ڑآ¬ط¹â€کط·آ¢ط¢آ¬ط·آ£ط¢آ¢ط£آ¢أ¢â€ڑآ¬أ¢â‚¬ع†ط·آ¢ط¢آ¢ do not use hard DELETE |

## Model: `FieldAuditLog`
| الحقل | النوع | الوصف |
|---|---|---|
| `id` | `Int` | @id @default(autoincrement()) |
| `tenantId` | `String` | @default("default") @map("tenant_id") |
| `entityType` | `String` | @map("entity_type") // (see field name for description) |
| `entityId` | `Int` | @map("entity_id") // (see field name for description) |
| `fieldName` | `String` | @map("field_name") // (see field name for description) |
| `oldValue` | `String?` | @map("old_value") // JSON-stringified |
| `newValue` | `String?` | @map("new_value") // JSON-stringified |
| `changeType` | `String` | @map("change_type") // create | update | delete |
| `userId` | `Int?` | @map("user_id") |
| `userEmail` | `String?` | @map("user_email") |
| `ipAddress` | `String?` | @map("ip_address") |
| `userAgent` | `String?` | @map("user_agent") |
| `transactionId` | `String?` | @map("transaction_id") // (see field name for description) |
| `changedAt` | `DateTime` | @default(now()) @map("changed_at") |

## Model: `NumberingSequence`
| الحقل | النوع | الوصف |
|---|---|---|
| `id` | `Int` | @id @default(autoincrement()) |
| `tenantId` | `String` | @default("default") @map("tenant_id") |
| `code` | `String` | @map("code") // JE, INV, PO, GRN, PR, RFQ, SO, DN, FA, EMP, SAL, WO, ... |
| `name` | `String?` | // (see field name for description) |
| `prefix` | `String` | @default("") |
| `suffix` | `String` | @default("") |
| `padLength` | `Int` | @default(6) @map("pad_length") // (see field name for description) |
| `current` | `BigInt` | @default(0) // (see field name for description) |
| `resetFrequency` | `String` | @default("never") @map("reset_frequency") // never | yearly | monthly |
| `branchId` | `Int?` | @map("branch_id") |
| `fiscalYear` | `Int?` | @map("fiscal_year") // (see field name for description) |
| `fiscalMonth` | `Int?` | @map("fiscal_month") // (see field name for description) |
| `lastReset` | `DateTime?` | @map("last_reset") |
| `isActive` | `Boolean` | @default(true) @map("is_active") |
| `createdAt` | `DateTime` | @default(now()) @map("created_at") |
| `updatedAt` | `DateTime` | @updatedAt @map("updated_at") |

## Model: `PeriodCloseTaskTemplate`
| الحقل | النوع | الوصف |
|---|---|---|
| `id` | `Int` | @id @default(autoincrement()) |
| `tenantId` | `String` | @default("default") @map("tenant_id") |
| `name` | `String` |  |
| `sequence` | `Int` |  |
| `applicableModule` | `String` | @map("applicable_module") |
| `isMandatory` | `Boolean` | @default(true) @map("is_mandatory") |
| `createdAt` | `DateTime` | @default(now()) @map("created_at") |
| `updatedAt` | `DateTime` | @updatedAt @map("updated_at") |

## Model: `PeriodCloseChecklist`
| الحقل | النوع | الوصف |
|---|---|---|
| `id` | `Int` | @id @default(autoincrement()) |
| `tenantId` | `String` | @default("default") @map("tenant_id") |
| `fiscalPeriodId` | `Int` | @map("fiscal_period_id") |
| `fiscalPeriod` | `FiscalPeriod` | @relation(fields: [fiscalPeriodId], references: [id], onDelete: Cascade) |
| `taskName` | `String` | @map("task_name") |
| `sequence` | `Int` |  |
| `owner` | `String?` |  |
| `status` | `String` | @default("PENDING") |
| `completedAt` | `DateTime?` | @map("completed_at") |
| `notes` | `String?` | @db.Text |
| `createdAt` | `DateTime` | @default(now()) @map("created_at") |
| `updatedAt` | `DateTime` | @updatedAt @map("updated_at") |

## Model: `PeriodLockLog`
| الحقل | النوع | الوصف |
|---|---|---|
| `id` | `Int` | @id @default(autoincrement()) |
| `tenantId` | `String` | @default("default") @map("tenant_id") |
| `fiscalPeriodId` | `Int` | @map("fiscal_period_id") |
| `fiscalPeriod` | `FiscalPeriod` | @relation(fields: [fiscalPeriodId], references: [id], onDelete: Cascade) |
| `action` | `String` |  |
| `actionBy` | `String` | @map("action_by") |
| `actionAt` | `DateTime` | @default(now()) @map("action_at") |
| `reason` | `String?` | @db.Text |

## Model: `JournalTemplate`
| الحقل | النوع | الوصف |
|---|---|---|
| `id` | `Int` | @id @default(autoincrement()) |
| `tenantId` | `String` | @default("default") @map("tenant_id") |
| `name` | `String` |  |
| `description` | `String?` |  |
| `isRecurring` | `Boolean` | @default(false) @map("is_recurring") |
| `frequency` | `String?` | // DAILY, WEEKLY, MONTHLY, YEARLY |
| `nextRunDate` | `DateTime?` | @map("next_run_date") |
| `endDate` | `DateTime?` | @map("end_date") |
| `autoReverse` | `Boolean` | @default(false) @map("auto_reverse") |
| `createdAt` | `DateTime` | @default(now()) @map("created_at") |
| `updatedAt` | `DateTime` | @updatedAt @map("updated_at") |
| `lines` | `JournalTemplateLine[]` |  |

## Model: `JournalTemplateLine`
| الحقل | النوع | الوصف |
|---|---|---|
| `id` | `Int` | @id @default(autoincrement()) |
| `tenantId` | `String` | @default("default") @map("tenant_id") |
| `templateId` | `Int` | @map("template_id") |
| `template` | `JournalTemplate` | @relation(fields: [templateId], references: [id], onDelete: Cascade) |
| `accountId` | `Int` | @map("account_id") |
| `debitFormula` | `String?` | @map("debit_formula") |
| `creditFormula` | `String?` | @map("credit_formula") |
| `description` | `String?` |  |
| `costCenterId` | `Int?` | @map("cost_center_id") |

## Model: `FxRevaluationRun`
| الحقل | النوع | الوصف |
|---|---|---|
| `id` | `Int` | @id @default(autoincrement()) |
| `tenantId` | `String` | @default("default") @map("tenant_id") |
| `fiscalPeriodId` | `Int` | @map("fiscal_period_id") |
| `runDate` | `DateTime` | @map("run_date") |
| `exchangeRateUsed` | `Decimal` | @map("exchange_rate_used") @db.Decimal(18, 4) |
| `totalGain` | `Decimal` | @default(0) @map("total_gain") @db.Decimal(18, 4) |
| `totalLoss` | `Decimal` | @default(0) @map("total_loss") @db.Decimal(18, 4) |
| `journalEntryId` | `Int?` | @map("journal_entry_id") |
| `status` | `String` | @default("DRAFT") // DRAFT, POSTED |
| `createdBy` | `String` | @map("created_by") |

## Model: `IntercompanyTransaction`
| الحقل | النوع | الوصف |
|---|---|---|
| `id` | `Int` | @id @default(autoincrement()) |
| `tenantId` | `String` | @default("default") @map("tenant_id") |
| `sourceCompanyId` | `Int` | @map("source_company_id") |
| `targetCompanyId` | `Int` | @map("target_company_id") |
| `sourceJEId` | `Int` | @map("source_je_id") |
| `targetJEId` | `Int?` | @map("target_je_id") |
| `amount` | `Decimal` | @default(0) |
| `type` | `String` | @default("AR_AP") // AR_AP, SALES_COGS, INVESTMENT_EQUITY, UNREALIZED_PROFIT |
| `status` | `String` | @default("PENDING") // PENDING, RECONCILED, ELIMINATED |
| `reconciledAt` | `DateTime?` | @map("reconciled_at") |

## Model: `ConsolidationGroup`
| الحقل | النوع | الوصف |
|---|---|---|
| `id` | `Int` | @id @default(autoincrement()) |
| `tenantId` | `String` | @default("default") @map("tenant_id") |
| `name` | `String` |  |
| `parentCompanyId` | `Int` | @map("parent_company_id") |
| `baseCurrency` | `String` | @default("SAR") @map("base_currency") |
| `isActive` | `Boolean` | @default(true) @map("is_active") |
| `runs` | `ConsolidationRun[]` |  |
| `members` | `ConsolidationMember[]` |  |
| `eliminationRules` | `EliminationRule[]` |  |

## Model: `ConsolidationRun`
| الحقل | النوع | الوصف |
|---|---|---|
| `id` | `Int` | @id @default(autoincrement()) |
| `tenantId` | `String` | @default("default") @map("tenant_id") |
| `groupId` | `Int` | @map("group_id") |
| `group` | `ConsolidationGroup` | @relation(fields: [groupId], references: [id]) |
| `fiscalPeriodId` | `Int` | @map("fiscal_period_id") |
| `status` | `String` | @default("DRAFT") |
| `userId` | `Int?` | @map("user_id") |
| `createdAt` | `DateTime` | @default(now()) @map("created_at") |
| `lines` | `ConsolidationLine[]` |  |

## Model: `ConsolidationLine`
| الحقل | النوع | الوصف |
|---|---|---|
| `id` | `Int` | @id @default(autoincrement()) |
| `tenantId` | `String` | @default("default") @map("tenant_id") |
| `runId` | `Int` | @map("run_id") |
| `type` | `String` | // ELIMINATION, TRANSLATION, NCI |
| `debitAccountId` | `Int?` | @map("debit_account_id") |
| `creditAccountId` | `Int?` | @map("credit_account_id") |
| `amount` | `Decimal` |  |
| `sourceCompanyId` | `Int?` | @map("source_company_id") |
| `targetCompanyId` | `Int?` | @map("target_company_id") |
| `description` | `String?` |  |
| `createdAt` | `DateTime` | @default(now()) @map("created_at") |
| `run` | `ConsolidationRun` | @relation(fields: [runId], references: [id], onDelete: Cascade) |

## Model: `AllocationRule`
| الحقل | النوع | الوصف |
|---|---|---|
| `id` | `Int` | @id @default(autoincrement()) |
| `tenantId` | `String` | @default("default") @map("tenant_id") |
| `name` | `String` |  |
| `sourceAccountId` | `Int?` | @map("source_account_id") |
| `sourceCostCenterId` | `Int?` | @map("source_cost_center_id") |
| `basis` | `String` | // fixed_%, headcount, sqft, revenue, custom |
| `schedule` | `String?` |  |
| `period` | `String?` |  |
| `isActive` | `Boolean` | @default(true) @map("is_active") |
| `priority` | `Int` | @default(1) |
| `targets` | `AllocationTarget[]` |  |
| `runs` | `AllocationRun[]` |  |

## Model: `AllocationTarget`
| الحقل | النوع | الوصف |
|---|---|---|
| `id` | `Int` | @id @default(autoincrement()) |
| `tenantId` | `String` | @default("default") @map("tenant_id") |
| `ruleId` | `Int` | @map("rule_id") |
| `targetCostCenterId` | `Int` | @map("target_cost_center_id") |
| `targetAccountId` | `Int?` | @map("target_account_id") |
| `percentage` | `Decimal?` | @db.Decimal(8, 4) |
| `customWeight` | `Decimal?` | @map("custom_weight") @db.Decimal(20, 4) |
| `rule` | `AllocationRule` | @relation(fields: [ruleId], references: [id], onDelete: Cascade) |

## Model: `AllocationRun`
| الحقل | النوع | الوصف |
|---|---|---|
| `id` | `Int` | @id @default(autoincrement()) |
| `tenantId` | `String` | @default("default") @map("tenant_id") |
| `ruleId` | `Int` | @map("rule_id") |
| `fiscalPeriodId` | `Int` | @map("fiscal_period_id") |
| `sourceAmount` | `Decimal` | @map("source_amount") @db.Decimal(20, 4) |
| `journalEntryId` | `Int?` | @map("journal_entry_id") |
| `status` | `String` | @default("COMPLETED") |
| `runAt` | `DateTime` | @default(now()) @map("run_at") |
| `rule` | `AllocationRule` | @relation(fields: [ruleId], references: [id], onDelete: Cascade) |

## Model: `PaymentTerm`
| الحقل | النوع | الوصف |
|---|---|---|
| `id` | `Int` | @id @default(autoincrement()) |
| `tenantId` | `String` | @default("default") @map("tenant_id") |
| `code` | `String` | @unique |
| `name` | `String` |  |
| `type` | `String` | // net, due_on_receipt, installments, 2_10_net_30 |
| `netDays` | `Int?` | @map("net_days") |
| `discountDays` | `Int?` | @map("discount_days") |
| `discountPercent` | `Decimal?` | @map("discount_percent") @db.Decimal(5, 2) |
| `installments` | `PaymentTermInstallment[]` |  |

## Model: `PaymentTermInstallment`
| الحقل | النوع | الوصف |
|---|---|---|
| `id` | `Int` | @id @default(autoincrement()) |
| `tenantId` | `String` | @default("default") @map("tenant_id") |
| `termId` | `Int` | @map("term_id") |
| `term` | `PaymentTerm` | @relation(fields: [termId], references: [id], onDelete: Cascade) |
| `daysAfterInvoice` | `Int` | @map("days_after_invoice") |
| `percentOfTotal` | `Decimal` | @map("percent_of_total") @db.Decimal(5, 2) |

## Model: `OpenItem`
| الحقل | النوع | الوصف |
|---|---|---|
| `id` | `Int` | @id @default(autoincrement()) |
| `tenantId` | `String` | @default("default") @map("tenant_id") |
| `partyId` | `Int` |  |
| `partyType` | `String` | // 'customer' | 'vendor' |
| `documentType` | `String` | // 'invoice' | 'credit_note' | 'payment' | 'advance' |
| `documentId` | `Int` |  |
| `documentNumber` | `String` |  |
| `documentDate` | `DateTime` |  |
| `dueDate` | `DateTime?` |  |
| `amount` | `Decimal` | @db.Decimal(20, 4) |
| `openAmount` | `Decimal` | @db.Decimal(20, 4) |
| `currency` | `String` | @default("SAR") |
| `originalAmount` | `Decimal` | @db.Decimal(20, 4) |
| `originalOpenAmount` | `Decimal` | @db.Decimal(20, 4) |
| `exchangeRate` | `Decimal` | @default(1) @db.Decimal(20, 8) |
| `rateDate` | `DateTime?` |  |
| `status` | `String` | @default("OPEN") // OPEN | PARTIAL | CLEARED | WRITTEN_OFF | DISPUTED_FULL |
| `disputedAmount` | `Decimal?` | @db.Decimal(20, 4) |
| `disputeStatus` | `String?` | // null | ACTIVE | RESOLVED | LITIGATING |
| `disputeCases` | `DisputeCase[]` |  |
| `promiseToPayDate` | `DateTime?` |  |
| `promiseToPayAmount` | `Decimal?` | @db.Decimal(20, 4) |
| `promiseStatus` | `String?` | // null | ACTIVE | KEPT | BROKEN |
| `riskLevel` | `String` | @default("NORMAL") // LOW | NORMAL | HIGH | CRITICAL |
| `blockedForCollection` | `Boolean` | @default(false) |
| `blockReason` | `String?` |  |
| `dunningLevel` | `Int` | @default(0) |
| `lastReminderSentAt` | `DateTime?` |  |
| `remindersCount` | `Int` | @default(0) |
| `snoozedUntil` | `DateTime?` |  |
| `snoozeReason` | `String?` |  |
| `externalReference` | `String?` |  |
| `parentOpenItemId` | `Int?` |  |
| `parentOpenItem` | `OpenItem?` | @relation("OpenItemSplits", fields: [parentOpenItemId], references: [id]) |
| `splits` | `OpenItem[]` | @relation("OpenItemSplits") |
| `applicationsAsPayment` | `ItemApplication[]` | @relation("ApplicationPayment") |
| `applicationsAsInvoice` | `ItemApplication[]` | @relation("ApplicationInvoice") |
| `createdAt` | `DateTime` | @default(now()) |
| `updatedAt` | `DateTime` | @updatedAt |

## Model: `ItemApplication`
| الحقل | النوع | الوصف |
|---|---|---|
| `id` | `Int` | @id @default(autoincrement()) |
| `tenantId` | `String` | @default("default") @map("tenant_id") |
| `paymentOpenItemId` | `Int` |  |
| `paymentOpenItem` | `OpenItem` | @relation("ApplicationPayment", fields: [paymentOpenItemId], references: [id]) |
| `invoiceOpenItemId` | `Int` |  |
| `invoiceOpenItem` | `OpenItem` | @relation("ApplicationInvoice", fields: [invoiceOpenItemId], references: [id]) |
| `appliedAmount` | `Decimal` | @db.Decimal(20, 4) |
| `appliedCurrency` | `String` |  |
| `invoiceCurrency` | `String` |  |
| `paymentCurrency` | `String` |  |
| `exchangeRateUsed` | `Decimal` | @db.Decimal(20, 8) |
| `fxGainLoss` | `Decimal?` | @db.Decimal(20, 4) |
| `fxGainLossAccountId` | `Int?` |  |
| `discountAmount` | `Decimal?` | @db.Decimal(20, 4) |
| `discountAccountId` | `Int?` |  |
| `writeoffAmount` | `Decimal?` | @db.Decimal(20, 4) |
| `writeoffReason` | `String?` |  |
| `writeoffAccountId` | `Int?` |  |
| `writeoffApprovedByUserId` | `String?` |  |
| `matchStrategy` | `String` | // 'MANUAL' | 'FIFO' | 'LIFO' | 'LARGEST' | 'REFERENCE' | 'SMART' |
| `matchConfidence` | `Decimal?` | @db.Decimal(5, 2) |
| `appliedAt` | `DateTime` | @default(now()) |
| `appliedByUserId` | `String` |  |
| `journalEntryId` | `Int?` |  |
| `reversedAt` | `DateTime?` |  |
| `reversedByUserId` | `String?` |  |
| `reversalReason` | `String?` |  |
| `reversalJournalId` | `Int?` |  |

## Model: `DisputeCase`
| الحقل | النوع | الوصف |
|---|---|---|
| `id` | `Int` | @id @default(autoincrement()) |
| `tenantId` | `String` | @default("default") @map("tenant_id") |
| `caseNumber` | `String` | @unique |
| `openItemId` | `Int` |  |
| `openItem` | `OpenItem` | @relation(fields: [openItemId], references: [id]) |
| `customerId` | `Int` |  |
| `amount` | `Decimal` | @db.Decimal(20, 4) |
| `currency` | `String` |  |
| `reasonCode` | `String` | // FK to DeductionReason |
| `reasonText` | `String` |  |
| `description` | `String` | @db.Text |
| `severity` | `String` | @default("MEDIUM") // LOW | MEDIUM | HIGH | CRITICAL |
| `priority` | `String` | @default("NORMAL") // LOW | NORMAL | HIGH | URGENT |
| `status` | `String` | @default("OPEN") // OPEN | INVESTIGATING | PENDING_CUSTOMER | PENDING_INTERNAL | RESOLVED | CANCELLED |
| `raisedAt` | `DateTime` | @default(now()) |
| `raisedByUserId` | `String` |  |
| `expectedResolution` | `DateTime?` |  |
| `assignedToUserId` | `String?` |  |
| `assignedAt` | `DateTime?` |  |
| `escalationLevel` | `Int` | @default(0) |
| `escalatedAt` | `DateTime?` |  |
| `escalatedToUserId` | `String?` |  |
| `resolvedAt` | `DateTime?` |  |
| `resolvedByUserId` | `String?` |  |
| `resolution` | `String?` | // 'ACCEPT_CUSTOMER' | 'REJECT_CLAIM' | 'PARTIAL_CREDIT' | 'WRITEOFF' | 'LITIGATE' |
| `resolutionAmount` | `Decimal?` | @db.Decimal(20, 4) |
| `resolutionNotes` | `String?` | @db.Text |
| `resolutionJournalId` | `Int?` |  |
| `creditNoteId` | `Int?` |  |
| `attachments` | `DisputeAttachment[]` |  |
| `communications` | `DisputeCommunication[]` |  |
| `customerSatisfactionScore` | `Int?` |  |

## Model: `DisputeAttachment`
| الحقل | النوع | الوصف |
|---|---|---|
| `id` | `Int` | @id @default(autoincrement()) |
| `tenantId` | `String` | @default("default") @map("tenant_id") |
| `caseId` | `Int` |  |
| `case` | `DisputeCase` | @relation(fields: [caseId], references: [id], onDelete: Cascade) |
| `fileUrl` | `String` |  |
| `fileName` | `String` |  |
| `fileType` | `String` |  |
| `fileSizeBytes` | `Int` |  |
| `uploadedAt` | `DateTime` | @default(now()) |
| `uploadedByUserId` | `String` |  |

## Model: `DisputeCommunication`
| الحقل | النوع | الوصف |
|---|---|---|
| `id` | `Int` | @id @default(autoincrement()) |
| `tenantId` | `String` | @default("default") @map("tenant_id") |
| `caseId` | `Int` |  |
| `case` | `DisputeCase` | @relation(fields: [caseId], references: [id], onDelete: Cascade) |
| `type` | `String` | // EMAIL | CALL | MEETING | INTERNAL_NOTE | LETTER |
| `direction` | `String?` | // INBOUND | OUTBOUND |
| `content` | `String` | @db.Text |
| `fromAddress` | `String?` |  |
| `toAddress` | `String?` |  |
| `occurredAt` | `DateTime` | @default(now()) |
| `recordedByUserId` | `String` |  |
| `attachments` | `Json?` |  |

## Model: `DeductionReason`
| الحقل | النوع | الوصف |
|---|---|---|
| `id` | `Int` | @id @default(autoincrement()) |
| `tenantId` | `String` | @default("default") @map("tenant_id") |
| `code` | `String` | @unique |
| `nameAr` | `String` |  |
| `nameEn` | `String` |  |
| `category` | `String` | // PRICING | QUALITY | DELIVERY | SHORT_PAY | ADMIN | TAX | OTHER |
| `defaultResolution` | `String?` |  |
| `requiresEvidence` | `Boolean` | @default(true) |
| `glAccountId` | `Int?` | // default account for resolution |
| `active` | `Boolean` | @default(true) |

## Model: `WriteoffPolicy`
| الحقل | النوع | الوصف |
|---|---|---|
| `id` | `Int` | @id @default(autoincrement()) |
| `tenantId` | `String` | @default("default") @map("tenant_id") |
| `name` | `String` |  |
| `customerSegmentId` | `Int?` |  |
| `underAmount` | `Decimal` | @db.Decimal(20, 4) // auto-writeoff if abs(diff) < this |
| `glAccountId` | `Int` | // where to post (Rounding, Bank Charges, etc.) |
| `requiresApproval` | `Boolean` | @default(false) |
| `approverRole` | `String?` |  |
| `active` | `Boolean` | @default(true) |
| `effectiveFrom` | `DateTime` |  |
| `effectiveTo` | `DateTime?` |  |

## Model: `CustomerCreditScore`
| الحقل | النوع | الوصف |
|---|---|---|
| `id` | `Int` | @id @default(autoincrement()) |
| `tenantId` | `String` | @default("default") @map("tenant_id") |
| `customerId` | `Int` | @unique |
| `currentScore` | `Int` | // 0-100 |
| `previousScore` | `Int?` |  |
| `scoreDate` | `DateTime` | @default(now()) |
| `factors` | `Json` | // {paymentHistory: 30, disputes: 20, dso: 15, ...} |
| `history` | `CustomerCreditScoreHistory[]` |  |

## Model: `CustomerCreditScoreHistory`
| الحقل | النوع | الوصف |
|---|---|---|
| `id` | `Int` | @id @default(autoincrement()) |
| `tenantId` | `String` | @default("default") @map("tenant_id") |
| `customerCreditScoreId` | `Int` |  |
| `customerCreditScore` | `CustomerCreditScore` | @relation(fields: [customerCreditScoreId], references: [id]) |
| `score` | `Int` |  |
| `changeReason` | `String?` |  |
| `recordedAt` | `DateTime` | @default(now()) |

## Model: `BankStatement`
| الحقل | النوع | الوصف |
|---|---|---|
| `id` | `Int` | @id @default(autoincrement()) |
| `tenantId` | `String` | @default("default") @map("tenant_id") |
| `bankAccountId` | `Int` |  |
| `bankAccount` | `BankAccount` | @relation(fields: [bankAccountId], references: [id]) |
| `statementNumber` | `String?` |  |
| `sequenceNumber` | `Int?` |  |
| `fileFormat` | `String` | // 'MT940' | 'MT942' | 'CAMT053' | 'CAMT052' | 'CAMT054' | 'OFX' | 'BAI2' | 'CSV' | 'EXCEL' | 'PDF_OCR' | 'API_OPEN_BANKING' |
| `fileUrl` | `String?` |  |
| `fileName` | `String?` |  |
| `fileHash` | `String?` |  |
| `fileSizeBytes` | `Int?` |  |
| `importedAt` | `DateTime` | @default(now()) |
| `importedByUserId` | `String?` |  |
| `importMethod` | `String` | // 'MANUAL' | 'API' | 'OCR' | 'WEBHOOK' | 'CRON_AUTO' |
| `currency` | `String` |  |
| `openingBalance` | `Decimal` | @db.Decimal(20, 4) |
| `openingDate` | `DateTime` |  |
| `closingBalance` | `Decimal` | @db.Decimal(20, 4) |
| `closingDate` | `DateTime` |  |
| `validationStatus` | `String` | @default("PENDING") // 'PENDING' | 'VALID' | 'BALANCE_MISMATCH' | 'DUPLICATE' | 'INVALID_FORMAT' |
| `validationDifference` | `Decimal?` | @db.Decimal(20, 4) |
| `validationOverridden` | `Boolean` | @default(false) |
| `validationOverrideReason` | `String?` |  |
| `duplicatesCount` | `Int` | @default(0) |
| `lowConfidenceCount` | `Int` | @default(0) |
| `totalTransactions` | `Int` | @default(0) |
| `parseConfidence` | `Decimal?` | @db.Decimal(5, 2) // for OCR |
| `reconStatus` | `String` | @default("NOT_STARTED") // NOT_STARTED | IN_PROGRESS | COMPLETED | PARTIAL |
| `reconciliationId` | `Int?` |  |
| `lines` | `BankStatementLine[]` |  |
| `intraDay` | `Boolean` | @default(false) |

## Model: `BankStatementLine`
| الحقل | النوع | الوصف |
|---|---|---|
| `id` | `Int` | @id @default(autoincrement()) |
| `tenantId` | `String` | @default("default") @map("tenant_id") |
| `statementId` | `Int` |  |
| `statement` | `BankStatement` | @relation(fields: [statementId], references: [id], onDelete: Cascade) |
| `transactionDate` | `DateTime` |  |
| `valueDate` | `DateTime?` |  |
| `postingDate` | `DateTime?` |  |
| `amount` | `Decimal` | @db.Decimal(20, 4) |
| `currency` | `String` | @default("SAR") |
| `type` | `String` | // 'DEBIT' | 'CREDIT' |
| `description` | `String` | @db.Text |
| `reference` | `String?` |  |
| `externalReference` | `String?` | // bank's internal ref |
| `counterpartyName` | `String?` |  |
| `counterpartyIBAN` | `String?` |  |
| `counterpartyBank` | `String?` |  |
| `counterpartyCountry` | `String?` |  |
| `category` | `String?` | // auto-classified: 'TRANSFER' | 'FEE' | 'INTEREST' | 'CHECK' | 'CARD' | 'CASH' | 'STANDING_ORDER' | 'DIRECT_DEBIT' | 'FX' | 'OTHER' |
| `categoryConfidence` | `Decimal?` | @db.Decimal(5, 2) |
| `ocrConfidence` | `Decimal?` | @db.Decimal(5, 2) // for PDF OCR per-field |
| `needsReview` | `Boolean` | @default(false) |
| `reviewedAt` | `DateTime?` |  |
| `reviewedByUserId` | `String?` |  |
| `isDuplicate` | `Boolean` | @default(false) |
| `duplicateOfLineId` | `Int?` |  |
| `hash` | `String` | @default("") // SHA-256 of (date+amount+ref+counterparty) |
| `rawData` | `Json?` |  |
| `matchStatus` | `String` | @default("UNMATCHED") // 'UNMATCHED' | 'AUTO_MATCHED' | 'MANUAL_MATCHED' | 'EXCEPTION' | 'IGNORED' |
| `matchedToType` | `String?` | // 'JE' | 'PAYMENT' | 'CHECK' | 'CASH_RECEIPT' |
| `matchedToId` | `Int?` |  |
| `matchedAt` | `DateTime?` |  |
| `matchedByUserId` | `String?` |  |
| `matchConfidence` | `Decimal?` | @db.Decimal(5, 2) |
| `matchStrategy` | `String?` | // 'EXACT' | 'FUZZY' | 'AI' | 'RULE' |
| `aiSuggestion` | `Json?` | // raw AI response |
| `matchedJournalId` | `Int?` |  |
| `matchedToIds` | `Int[]` | // for aggregate matches |
| `splitParentId` | `Int?` | // if this line is part of a split |
| `reconciliationId` | `Int?` |  |
| `reconciliation` | `BankReconPeriod?` | @relation(fields: [reconciliationId], references: [id]) |
| `exception` | `BankReconciliationException?` |  |
| `BankReconMatch` | `BankReconMatch[]` |  |
| `reviewItem` | `BankStatementReviewItem?` |  |

## Model: `IntraDayBalance`
| الحقل | النوع | الوصف |
|---|---|---|
| `id` | `Int` | @id @default(autoincrement()) |
| `tenantId` | `String` | @default("default") @map("tenant_id") |
| `bankAccountId` | `Int` |  |
| `bankAccount` | `BankAccount` | @relation(fields: [bankAccountId], references: [id]) |
| `asOfTimestamp` | `DateTime` |  |
| `balance` | `Decimal` | @db.Decimal(20, 4) |
| `currency` | `String` |  |
| `source` | `String` | // 'CAMT052' | 'API' | 'WEBSITE_SCRAPE' |
| `receivedAt` | `DateTime` | @default(now()) |

## Model: `BankImportError`
| الحقل | النوع | الوصف |
|---|---|---|
| `id` | `Int` | @id @default(autoincrement()) |
| `tenantId` | `String` | @default("default") @map("tenant_id") |
| `bankAccountId` | `Int?` |  |
| `fileName` | `String?` |  |
| `errorType` | `String` | // 'PARSE_ERROR' | 'BALANCE_MISMATCH' | 'DUPLICATE' | 'UNKNOWN_FORMAT' | 'UNKNOWN_ACCOUNT' |
| `errorMessage` | `String` | @db.Text |
| `fileSnippet` | `String?` | @db.Text |
| `occurredAt` | `DateTime` | @default(now()) |
| `resolvedAt` | `DateTime?` |  |
| `resolvedByUserId` | `String?` |  |
| `resolution` | `String?` |  |

## Model: `BankStatementReviewItem`
| الحقل | النوع | الوصف |
|---|---|---|
| `id` | `Int` | @id @default(autoincrement()) |
| `tenantId` | `String` | @default("default") @map("tenant_id") |
| `lineId` | `Int` | @unique |
| `line` | `BankStatementLine` | @relation(fields: [lineId], references: [id], onDelete: Cascade) |
| `fieldsToReview` | `String[]` | // ['amount', 'date', 'description'] |
| `ocrSnippet` | `String?` | // image cropped of the field |
| `suggestedValues` | `Json?` |  |
| `reviewerNotes` | `String?` |  |
| `reviewedAt` | `DateTime?` |  |
| `reviewedByUserId` | `String?` |  |

## Model: `BankReconRule`
| الحقل | النوع | الوصف |
|---|---|---|
| `id` | `Int` | @id @default(autoincrement()) |
| `tenantId` | `String` | @default("default") @map("tenant_id") |
| `ruleNumber` | `String` | @unique @default(cuid()) |
| `name` | `String` |  |
| `bankAccountId` | `Int?` | // null = applies to all |
| `bankAccount` | `BankAccount?` | @relation(fields: [bankAccountId], references: [id]) |
| `conditions` | `Json` | // [{field: 'description', operator: 'contains', value: 'BANK FEE'}] |
| `action` | `String` | // 'CREATE_JE' | 'MATCH_TO_VENDOR' | 'MATCH_TO_CUSTOMER' | 'IGNORE' | 'CATEGORIZE' |
| `actionParams` | `Json` | // {accountId, description, etc.} |
| `priority` | `Int` | @default(100) |
| `successCount` | `Int` | @default(0) |
| `failureCount` | `Int` | @default(0) |
| `successRate` | `Decimal?` | @db.Decimal(5, 2) |
| `enabled` | `Boolean` | @default(true) |
| `learnedFromLineId` | `Int?` | // origin of this rule |
| `createdByUserId` | `String?` |  |
| `createdAt` | `DateTime` | @default(now()) |
| `updatedAt` | `DateTime` | @updatedAt |
| `lastAppliedAt` | `DateTime?` |  |

## Model: `BankReconPeriod`
| الحقل | النوع | الوصف |
|---|---|---|
| `id` | `Int` | @id @default(autoincrement()) |
| `tenantId` | `String` | @default("default") @map("tenant_id") |
| `bankAccountId` | `Int` |  |
| `bankAccount` | `BankAccount` | @relation(fields: [bankAccountId], references: [id]) |
| `reconciliationNumber` | `String` | @unique @default(cuid()) |
| `periodStart` | `DateTime` |  |
| `periodEnd` | `DateTime` |  |
| `bookBalance` | `Decimal` | @db.Decimal(20, 4) |
| `bankBalance` | `Decimal` | @db.Decimal(20, 4) |
| `reconcilingItems` | `Json` | // {outstandingChecks: [...], depositsInTransit: [...], adjustments: [...]} |
| `totalReconcilingItems` | `Decimal` | @db.Decimal(20, 4) |
| `adjustedBookBalance` | `Decimal` | @db.Decimal(20, 4) |
| `difference` | `Decimal` | @db.Decimal(20, 4) |
| `status` | `String` | @default("DRAFT") // DRAFT | PENDING_APPROVAL | APPROVED | LOCKED | REOPENED |
| `pdfUrl` | `String?` |  |
| `pdfHash` | `String?` |  |
| `createdByUserId` | `String` |  |
| `createdAt` | `DateTime` | @default(now()) |
| `submittedAt` | `DateTime?` |  |
| `approvedByUserId` | `String?` |  |
| `approvedAt` | `DateTime?` |  |
| `lockedAt` | `DateTime?` |  |
| `notes` | `String?` | @db.Text |
| `matchedLines` | `BankStatementLine[]` |  |

## Model: `BankReconciliationException`
| الحقل | النوع | الوصف |
|---|---|---|
| `id` | `Int` | @id @default(autoincrement()) |
| `tenantId` | `String` | @default("default") @map("tenant_id") |
| `lineId` | `Int` | @unique |
| `line` | `BankStatementLine` | @relation(fields: [lineId], references: [id], onDelete: Cascade) |
| `reason` | `String` | // 'NO_MATCH' | 'LOW_CONFIDENCE' | 'AMBIGUOUS' | 'AGGREGATE_NEEDED' |
| `suggestions` | `Json` | // candidate matches with confidence |
| `assignedToUserId` | `String?` |  |
| `priority` | `String` | @default("NORMAL") |
| `resolvedAt` | `DateTime?` |  |
| `resolvedByUserId` | `String?` |  |
| `resolution` | `String?` | // 'MATCHED' | 'JE_CREATED' | 'IGNORED' | 'WRITTEN_OFF' |
| `resolutionNotes` | `String?` |  |
| `createdAt` | `DateTime` | @default(now()) |

## Model: `OutstandingCheck`
| الحقل | النوع | الوصف |
|---|---|---|
| `id` | `Int` | @id @default(autoincrement()) |
| `tenantId` | `String` | @default("default") @map("tenant_id") |
| `checkId` | `Int?` |  |
| `checkNumber` | `String?` |  |
| `bankAccountId` | `Int` |  |
| `issuedDate` | `DateTime` |  |
| `amount` | `Decimal` | @db.Decimal(20, 4) |
| `payee` | `String` |  |
| `status` | `String` | @default("OUTSTANDING") // OUTSTANDING | CLEARED | STALE | CANCELLED |
| `daysOutstanding` | `Int` | @default(0) |
| `clearedDate` | `DateTime?` |  |
| `matchedLineId` | `Int?` |  |

## Model: `DepositInTransit`
| الحقل | النوع | الوصف |
|---|---|---|
| `id` | `Int` | @id @default(autoincrement()) |
| `tenantId` | `String` | @default("default") @map("tenant_id") |
| `bankAccountId` | `Int` |  |
| `depositDate` | `DateTime` |  |
| `amount` | `Decimal` | @db.Decimal(20, 4) |
| `source` | `String` | // customer name or reference |
| `status` | `String` | @default("IN_TRANSIT") // IN_TRANSIT | CLEARED | RETURNED |
| `clearedDate` | `DateTime?` |  |
| `matchedLineId` | `Int?` |  |

## Model: `BankReconMatch`
| الحقل | النوع | الوصف |
|---|---|---|
| `id` | `Int` | @id @default(autoincrement()) |
| `tenantId` | `String` | @default("default") @map("tenant_id") |
| `bankLineId` | `Int` |  |
| `bankLine` | `BankStatementLine` | @relation(fields: [bankLineId], references: [id], onDelete: Cascade) |
| `matchType` | `String` | // EXACT, FUZZY, RULE, AI, MANUAL |
| `matchedTo` | `String` | // JE_ID, PAYMENT_ID, RECEIPT_ID, NEW_JE |
| `confidence` | `Decimal` | @db.Decimal(5, 2) |
| `ruleId` | `Int?` |  |
| `journalEntryId` | `Int?` |  |
| `matchedBy` | `Int` |  |
| `matchedAt` | `DateTime` | @default(now()) |

## Model: `CashFlowForecast`
| الحقل | النوع | الوصف |
|---|---|---|
| `id` | `Int` | @id @default(autoincrement()) |
| `tenantId` | `String` | @default("default") @map("tenant_id") |
| `forecastDate` | `DateTime` | @map("forecast_date") |
| `period` | `String` | // DAILY, WEEKLY, MONTHLY, QUARTERLY |
| `scenario` | `String?` | @default("REALISTIC") |
| `inflows` | `Decimal` | @default(0) @db.Decimal(18, 4) |
| `outflows` | `Decimal` | @default(0) @db.Decimal(18, 4) |
| `netPosition` | `Decimal` | @default(0) @map("net_position") @db.Decimal(18, 4) |
| `openingBalance` | `Decimal?` | @map("opening_balance") @db.Decimal(20, 4) |
| `closingBalance` | `Decimal?` | @map("closing_balance") @db.Decimal(20, 4) |
| `horizonMonths` | `Int?` | @map("horizon_months") |
| `bucketsJson` | `String?` | @map("buckets_json") @db.Text |
| `alertsJson` | `String?` | @map("alerts_json") @db.Text |
| `generatedAt` | `DateTime` | @default(now()) @map("generated_at") |

## Model: `FixedAsset`
| الحقل | النوع | الوصف |
|---|---|---|
| `id` | `Int` | @id @default(autoincrement()) |
| `tenantId` | `String` | @default("default") @map("tenant_id") |
| `assetNumber` | `String` | @unique |
| `name` | `String` |  |
| `nameAr` | `String?` |  |
| `description` | `String?` | @db.Text |
| `categoryId` | `Int?` |  |
| `category` | `FixedAssetCategory?` | @relation(fields: [categoryId], references: [id]) |
| `parentAssetId` | `Int?` |  |
| `parentAsset` | `FixedAsset?` | @relation("AssetComponents", fields: [parentAssetId], references: [id]) |
| `components` | `FixedAsset[]` | @relation("AssetComponents") |
| `isComposite` | `Boolean` | @default(false) |
| `isComponent` | `Boolean` | @default(false) |
| `componentType` | `String?` | // 'STRUCTURE' | 'ROOF' | 'HVAC' | 'OTHER' |
| `acquisitionDate` | `DateTime` |  |
| `acquisitionCost` | `Decimal` | @db.Decimal(20, 4) |
| `currency` | `String` | @default("SAR") |
| `vendorId` | `Int?` |  |
| `vendor` | `Customer?` | @relation(fields: [vendorId], references: [id]) |
| `invoiceId` | `Int?` |  |
| `acquisitionJournalId` | `Int?` |  |
| `depreciationMethod` | `String` | // 'STRAIGHT_LINE' | 'DECLINING_BALANCE' | 'DOUBLE_DECLINING' | 'SUM_OF_YEARS_DIGITS' | 'UNITS_OF_PRODUCTION' | 'HOURS_OF_OPERATION' | 'MACRS_3' | 'MACRS_5' | 'MACRS_7' | 'MACRS_10' | 'NO_DEPRECIATION' |
| `usefulLifeYears` | `Int?` |  |
| `usefulLifeMonths` | `Int?` |  |
| `declineRate` | `Decimal?` | @db.Decimal(5, 4) |
| `totalEstimatedUnits` | `Decimal?` | @db.Decimal(20, 4) |
| `unitsConsumed` | `Decimal` | @default(0) @db.Decimal(20, 4) |
| `totalEstimatedHours` | `Decimal?` | @db.Decimal(20, 4) |
| `hoursOperated` | `Decimal` | @default(0) @db.Decimal(20, 4) |
| `salvageValue` | `Decimal` | @default(0) @db.Decimal(20, 4) |
| `depreciationConvention` | `String` | @default("FULL_MONTH") // 'FULL_MONTH' | 'HALF_YEAR' | 'MID_MONTH' | 'MID_QUARTER' |
| `depreciationStartDate` | `DateTime` |  |
| `accumulatedDepreciation` | `Decimal` | @default(0) @db.Decimal(20, 4) |
| `accumulatedImpairment` | `Decimal` | @default(0) @db.Decimal(20, 4) |
| `currentBookValue` | `Decimal` | @db.Decimal(20, 4) |
| `status` | `String` | @default("ACTIVE") // 'CWIP' | 'ACTIVE' | 'DISPOSED' | 'WRITTEN_OFF' | 'TRANSFERRED' | 'HELD_FOR_SALE' | 'IMPAIRED' | 'IDLE' |
| `statusChangedAt` | `DateTime?` |  |
| `disposalDate` | `DateTime?` |  |
| `disposalProceeds` | `Decimal?` | @db.Decimal(20, 4) |
| `disposalGainLoss` | `Decimal?` | @db.Decimal(20, 4) |
| `disposalJournalId` | `Int?` |  |
| `disposalType` | `String?` | // 'SALE' | 'SCRAP' | 'DONATION' | 'WRITE_OFF' | 'EXCHANGE' |
| `heldForSaleDate` | `DateTime?` |  |
| `heldForSaleJournalId` | `Int?` |  |
| `locationId` | `Int?` |  |
| `branchId` | `Int?` |  |
| `costCenterId` | `Int?` |  |
| `custodianEmployeeId` | `Int?` |  |
| `insurancePolicyNumber` | `String?` |  |
| `insuranceProvider` | `String?` |  |
| `insurancePremium` | `Decimal?` | @db.Decimal(10, 2) |
| `insuranceExpiryDate` | `DateTime?` |  |
| `insuredValue` | `Decimal?` | @db.Decimal(20, 4) |
| `serialNumber` | `String?` |  |
| `barcode` | `String?` | @unique |
| `rfidTag` | `String?` |  |
| `manufacturer` | `String?` |  |
| `model` | `String?` |  |
| `modelYear` | `Int?` |  |
| `registrationNumber` | `String?` |  |
| `warrantyStartDate` | `DateTime?` |  |
| `warrantyEndDate` | `DateTime?` |  |
| `warrantyVendorId` | `Int?` |  |
| `cguId` | `Int?` |  |
| `cgu` | `CashGeneratingUnit?` | @relation(fields: [cguId], references: [id]) |
| `assetAccountId` | `Int?` |  |
| `accumDepAccountId` | `Int?` |  |
| `depExpenseAccountId` | `Int?` |  |
| `nextMaintenanceDate` | `DateTime?` |  |
| `maintenanceFrequencyMonths` | `Int?` |  |
| `lastPhysicalCountDate` | `DateTime?` |  |
| `lastPhysicalCountStatus` | `String?` | // 'FOUND' | 'MISSING' | 'WRONG_LOCATION' |
| `createdByUserId` | `String` |  |
| `createdAt` | `DateTime` | @default(now()) |
| `updatedAt` | `DateTime` | @updatedAt |
| `depreciationLog` | `AssetDepreciationLog[]` |  |
| `impairmentRecords` | `AssetImpairmentRecord[]` |  |
| `transferRecords` | `AssetTransferRecord[]` |  |
| `maintenanceRecords` | `AssetMaintenanceRecord[]` |  |
| `insuranceClaims` | `AssetInsuranceClaim[]` |  |
| `usageLog` | `AssetUsageLog[]` |  |
| `documents` | `AssetDocument[]` |  |
| `reclassifications` | `AssetReclassification[]` |  |

## Model: `FixedAssetCategory`
| الحقل | النوع | الوصف |
|---|---|---|
| `id` | `Int` | @id @default(autoincrement()) |
| `tenantId` | `String` | @default("default") @map("tenant_id") |
| `code` | `String` | @unique |
| `nameAr` | `String` |  |
| `nameEn` | `String` |  |
| `parentCategoryId` | `Int?` |  |
| `parentCategory` | `FixedAssetCategory?` | @relation("CategoryHierarchy", fields: [parentCategoryId], references: [id]) |
| `childCategories` | `FixedAssetCategory[]` | @relation("CategoryHierarchy") |
| `defaultDepreciationMethod` | `String?` |  |
| `defaultUsefulLife` | `Int?` |  |
| `defaultSalvageValuePercent` | `Decimal?` | @db.Decimal(5, 2) |
| `assetAccountId` | `Int?` |  |
| `accumDepAccountId` | `Int?` |  |
| `depExpenseAccountId` | `Int?` |  |
| `active` | `Boolean` | @default(true) |
| `assets` | `FixedAsset[]` |  |

## Model: `AssetDepreciationLog`
| الحقل | النوع | الوصف |
|---|---|---|
| `id` | `Int` | @id @default(autoincrement()) |
| `tenantId` | `String` | @default("default") @map("tenant_id") |
| `assetId` | `Int` |  |
| `asset` | `FixedAsset` | @relation(fields: [assetId], references: [id], onDelete: Cascade) |
| `periodStart` | `DateTime` |  |
| `periodEnd` | `DateTime` |  |
| `openingNbv` | `Decimal` | @db.Decimal(20, 4) |
| `depreciationAmount` | `Decimal` | @db.Decimal(20, 4) |
| `closingNbv` | `Decimal` | @db.Decimal(20, 4) |
| `method` | `String` |  |
| `unitsThisPeriod` | `Decimal?` | @db.Decimal(20, 4) |
| `hoursThisPeriod` | `Decimal?` | @db.Decimal(20, 4) |
| `journalEntryId` | `Int` |  |
| `recognizedAt` | `DateTime` | @default(now()) |

## Model: `AssetImpairmentRecord`
| الحقل | النوع | الوصف |
|---|---|---|
| `id` | `Int` | @id @default(autoincrement()) |
| `tenantId` | `String` | @default("default") @map("tenant_id") |
| `assetId` | `Int` |  |
| `asset` | `FixedAsset` | @relation(fields: [assetId], references: [id]) |
| `testDate` | `DateTime` |  |
| `carryingAmount` | `Decimal` | @db.Decimal(20, 4) |
| `fairValueLessCosts` | `Decimal?` | @db.Decimal(20, 4) |
| `valueInUse` | `Decimal?` | @db.Decimal(20, 4) |
| `recoverableAmount` | `Decimal` | @db.Decimal(20, 4) |
| `impairmentLoss` | `Decimal` | @db.Decimal(20, 4) |
| `reversal` | `Boolean` | @default(false) |
| `reversalReason` | `String?` |  |
| `calculationMethod` | `String` | // 'DCF' | 'COMPARABLE_SALES' | 'COST_APPROACH' | 'EXPERT_VALUATION' |
| `evidence` | `String?` | @db.Text |
| `evidenceFileId` | `Int?` |  |
| `journalEntryId` | `Int` |  |
| `testedByUserId` | `String` |  |
| `approvedByUserId` | `String?` |  |
| `approvedAt` | `DateTime?` |  |

## Model: `AssetTransferRecord`
| الحقل | النوع | الوصف |
|---|---|---|
| `id` | `Int` | @id @default(autoincrement()) |
| `tenantId` | `String` | @default("default") @map("tenant_id") |
| `assetId` | `Int` |  |
| `asset` | `FixedAsset` | @relation(fields: [assetId], references: [id]) |
| `transferDate` | `DateTime` |  |
| `transferType` | `String` | // 'LOCATION' | 'BRANCH' | 'COST_CENTER' | 'CUSTODIAN' | 'COMPOSITE' |
| `fromLocationId` | `Int?` |  |
| `toLocationId` | `Int?` |  |
| `fromBranchId` | `Int?` |  |
| `toBranchId` | `Int?` |  |
| `fromCostCenterId` | `Int?` |  |
| `toCostCenterId` | `Int?` |  |
| `fromCustodianId` | `Int?` |  |
| `toCustodianId` | `Int?` |  |
| `bookValueAtTransfer` | `Decimal` | @db.Decimal(20, 4) |
| `reason` | `String` | @db.Text |
| `journalEntryId` | `Int?` |  |
| `approvedByUserId` | `String?` |  |
| `createdByUserId` | `String` |  |
| `createdAt` | `DateTime` | @default(now()) |

## Model: `AssetMaintenanceRecord`
| الحقل | النوع | الوصف |
|---|---|---|
| `id` | `Int` | @id @default(autoincrement()) |
| `tenantId` | `String` | @default("default") @map("tenant_id") |
| `assetId` | `Int` |  |
| `asset` | `FixedAsset` | @relation(fields: [assetId], references: [id]) |
| `type` | `String` | // 'PREVENTIVE' | 'CORRECTIVE' | 'INSPECTION' | 'OVERHAUL' |
| `scheduledDate` | `DateTime?` |  |
| `performedDate` | `DateTime?` |  |
| `cost` | `Decimal?` | @db.Decimal(20, 4) |
| `capitalize` | `Boolean` | @default(false) |
| `capitalizationReason` | `String?` |  |
| `description` | `String` | @db.Text |
| `performedByVendorId` | `Int?` |  |
| `performedByEmployeeId` | `Int?` |  |
| `partsReplaced` | `Json?` |  |
| `hoursWorked` | `Decimal?` | @db.Decimal(8, 2) |
| `journalEntryId` | `Int?` |  |
| `nextDueDate` | `DateTime?` |  |
| `attachments` | `Json?` |  |

## Model: `AssetInsuranceClaim`
| الحقل | النوع | الوصف |
|---|---|---|
| `id` | `Int` | @id @default(autoincrement()) |
| `tenantId` | `String` | @default("default") @map("tenant_id") |
| `assetId` | `Int` |  |
| `asset` | `FixedAsset` | @relation(fields: [assetId], references: [id]) |
| `claimNumber` | `String` | @unique |
| `claimDate` | `DateTime` |  |
| `incidentDate` | `DateTime` |  |
| `incidentDescription` | `String` | @db.Text |
| `claimedAmount` | `Decimal` | @db.Decimal(20, 4) |
| `approvedAmount` | `Decimal?` | @db.Decimal(20, 4) |
| `receivedAmount` | `Decimal?` | @db.Decimal(20, 4) |
| `status` | `String` | @default("FILED") // 'FILED' | 'UNDER_REVIEW' | 'APPROVED' | 'REJECTED' | 'PAID' |
| `insuranceCompany` | `String` |  |
| `policyNumber` | `String?` |  |
| `journalEntryId` | `Int?` |  |
| `attachments` | `Json?` |  |
| `filedByUserId` | `String` |  |
| `filedAt` | `DateTime` | @default(now()) |

## Model: `CashGeneratingUnit`
| الحقل | النوع | الوصف |
|---|---|---|
| `id` | `Int` | @id @default(autoincrement()) |
| `tenantId` | `String` | @default("default") @map("tenant_id") |
| `code` | `String` | @unique |
| `name` | `String` |  |
| `description` | `String?` |  |
| `lastTestDate` | `DateTime?` |  |
| `nextScheduledTestDate` | `DateTime?` |  |
| `recoverableAmount` | `Decimal?` | @db.Decimal(20, 4) |
| `responsibleEmployeeId` | `Int?` |  |
| `assets` | `FixedAsset[]` |  |

## Model: `AssetUsageLog`
| الحقل | النوع | الوصف |
|---|---|---|
| `id` | `Int` | @id @default(autoincrement()) |
| `tenantId` | `String` | @default("default") @map("tenant_id") |
| `assetId` | `Int` |  |
| `asset` | `FixedAsset` | @relation(fields: [assetId], references: [id]) |
| `periodStart` | `DateTime` |  |
| `periodEnd` | `DateTime` |  |
| `unitsProduced` | `Decimal?` | @db.Decimal(20, 4) |
| `hoursOperated` | `Decimal?` | @db.Decimal(20, 4) |
| `downtimeHours` | `Decimal?` | @db.Decimal(20, 4) |
| `efficiency` | `Decimal?` | @db.Decimal(5, 2) |
| `recordedByUserId` | `String` |  |
| `recordedAt` | `DateTime` | @default(now()) |

## Model: `AssetReclassification`
| الحقل | النوع | الوصف |
|---|---|---|
| `id` | `Int` | @id @default(autoincrement()) |
| `tenantId` | `String` | @default("default") @map("tenant_id") |
| `assetId` | `Int` |  |
| `asset` | `FixedAsset` | @relation(fields: [assetId], references: [id]) |
| `reclassificationDate` | `DateTime` |  |
| `fromCategoryId` | `Int?` |  |
| `toCategoryId` | `Int?` |  |
| `fromStatus` | `String` |  |
| `toStatus` | `String` |  |
| `reason` | `String` | @db.Text |
| `fairValueAdjustment` | `Decimal?` | @db.Decimal(20, 4) |
| `journalEntryId` | `Int?` |  |
| `approvedByUserId` | `String?` |  |
| `createdByUserId` | `String` |  |

## Model: `AssetDocument`
| الحقل | النوع | الوصف |
|---|---|---|
| `id` | `Int` | @id @default(autoincrement()) |
| `tenantId` | `String` | @default("default") @map("tenant_id") |
| `assetId` | `Int` |  |
| `asset` | `FixedAsset` | @relation(fields: [assetId], references: [id], onDelete: Cascade) |
| `documentType` | `String` | // 'INVOICE' | 'WARRANTY' | 'INSURANCE' | 'PHOTO' | 'MANUAL' | 'CERTIFICATE' |
| `fileUrl` | `String` |  |
| `fileName` | `String` |  |
| `uploadedAt` | `DateTime` | @default(now()) |
| `uploadedByUserId` | `String` |  |
| `expiryDate` | `DateTime?` |  |

## Model: `PhysicalCountSession`
| الحقل | النوع | الوصف |
|---|---|---|
| `id` | `Int` | @id @default(autoincrement()) |
| `tenantId` | `String` | @default("default") @map("tenant_id") |
| `sessionNumber` | `String` | @unique |
| `scheduledDate` | `DateTime` |  |
| `startedAt` | `DateTime?` |  |
| `completedAt` | `DateTime?` |  |
| `scope` | `Json` | // {locationIds, branchIds, categoryIds} |
| `totalAssetsExpected` | `Int` |  |
| `totalAssetsFound` | `Int` | @default(0) |
| `totalVariances` | `Int` | @default(0) |
| `status` | `String` | @default("PLANNED") // 'PLANNED' | 'IN_PROGRESS' | 'RECONCILING' | 'COMPLETED' |
| `scans` | `PhysicalCountScan[]` |  |
| `variances` | `PhysicalCountVariance[]` |  |
| `startedByUserId` | `String?` |  |
| `completedByUserId` | `String?` |  |

## Model: `PhysicalCountScan`
| الحقل | النوع | الوصف |
|---|---|---|
| `id` | `Int` | @id @default(autoincrement()) |
| `tenantId` | `String` | @default("default") @map("tenant_id") |
| `sessionId` | `Int` |  |
| `session` | `PhysicalCountSession` | @relation(fields: [sessionId], references: [id], onDelete: Cascade) |
| `assetId` | `Int?` |  |
| `scannedCode` | `String` | // barcode or serial |
| `scannedAt` | `DateTime` | @default(now()) |
| `scannedByUserId` | `String` |  |
| `locationId` | `Int?` |  |
| `conditionNotes` | `String?` |  |

## Model: `PhysicalCountVariance`
| الحقل | النوع | الوصف |
|---|---|---|
| `id` | `Int` | @id @default(autoincrement()) |
| `tenantId` | `String` | @default("default") @map("tenant_id") |
| `sessionId` | `Int` |  |
| `session` | `PhysicalCountSession` | @relation(fields: [sessionId], references: [id], onDelete: Cascade) |
| `assetId` | `Int?` |  |
| `varianceType` | `String` | // 'MISSING' | 'EXTRA' | 'WRONG_LOCATION' | 'DAMAGED' |
| `expectedLocation` | `Int?` |  |
| `actualLocation` | `Int?` |  |
| `resolution` | `String?` | // 'WRITE_OFF' | 'TRANSFER' | 'ADD_NEW' | 'INVESTIGATE' |
| `resolvedAt` | `DateTime?` |  |
| `journalEntryId` | `Int?` |  |

## Model: `ProductVariant`
| الحقل | النوع | الوصف |
|---|---|---|
| `id` | `Int` | @id @default(autoincrement()) |
| `tenantId` | `String` | @default("default") @map("tenant_id") |
| `parentProductId` | `Int` | @map("parent_product_id") |
| `sku` | `String?` | @unique |
| `barcode` | `String?` | @unique |
| `attributes` | `String` | // JSON object e.g. {"Size": "M", "Color": "Red"} |
| `costOverride` | `Decimal?` | @map("cost_override") @db.Decimal(20, 4) |
| `priceOverride` | `Decimal?` | @map("price_override") @db.Decimal(20, 4) |
| `weight` | `Decimal?` | @db.Decimal(20, 4) |
| `image` | `String?` |  |
| `isActive` | `Boolean` | @default(true) @map("is_active") |
| `product` | `Product` | @relation(fields: [parentProductId], references: [id], onDelete: Cascade) |
| `stock` | `ProductStock[]` |  |
| `salesDetails` | `SalesInvoiceDetail[]` |  |

## Model: `PickList`
| الحقل | النوع | الوصف |
|---|---|---|
| `id` | `Int` | @id @default(autoincrement()) |
| `tenantId` | `String` | @default("default") @map("tenant_id") |
| `salesOrderId` | `Int?` | @map("sales_order_id") // Optional relation if linking to order |
| `status` | `String` | @default("PENDING") // PENDING, PICKING, COMPLETED, CANCELLED |
| `assignedTo` | `Int?` | @map("assigned_to") |
| `pickStrategyUsed` | `String?` | @map("pick_strategy_used") |
| `createdAt` | `DateTime` | @default(now()) @map("created_at") |
| `lines` | `PickListLine[]` |  |

## Model: `PickListLine`
| الحقل | النوع | الوصف |
|---|---|---|
| `id` | `Int` | @id @default(autoincrement()) |
| `tenantId` | `String` | @default("default") @map("tenant_id") |
| `listId` | `Int` | @map("list_id") |
| `productId` | `Int` | @map("product_id") |
| `variantId` | `Int?` | @map("variant_id") |
| `batchId` | `Int?` | @map("batch_id") |
| `sourceBinId` | `Int?` | @map("source_bin_id") |
| `qty` | `Decimal` | @db.Decimal(20, 4) |
| `status` | `String` | @default("PENDING") // PENDING, PICKED, SHORT |
| `pickedAt` | `DateTime?` | @map("picked_at") |
| `list` | `PickList` | @relation(fields: [listId], references: [id], onDelete: Cascade) |

## Model: `PutawayRule`
| الحقل | النوع | الوصف |
|---|---|---|
| `id` | `Int` | @id @default(autoincrement()) |
| `tenantId` | `String` | @default("default") @map("tenant_id") |
| `productId` | `Int?` | @map("product_id") |
| `categoryId` | `Int?` | @map("category_id") |
| `preferredZoneId` | `Int` | @map("preferred_zone_id") |
| `fillStrategy` | `String` | @default("FIRST_EMPTY") // FIRST_EMPTY, FILL_PARTIAL, BY_VELOCITY |

## Model: `ProductSubstitute`
| الحقل | النوع | الوصف |
|---|---|---|
| `id` | `Int` | @id @default(autoincrement()) |
| `tenantId` | `String` | @default("default") @map("tenant_id") |
| `productId` | `Int` | @map("product_id") |
| `substituteId` | `Int` | @map("substitute_id") |
| `preferenceLevel` | `Int` | @default(1) @map("preference_level") |

## Model: `InventoryPlanning`
| الحقل | النوع | الوصف |
|---|---|---|
| `id` | `Int` | @id @default(autoincrement()) |
| `tenantId` | `String` | @default("default") @map("tenant_id") |
| `productId` | `Int` | @map("product_id") |
| `warehouseId` | `Int` | @map("warehouse_id") |
| `minStockLevel` | `Decimal` | @default(0) @map("min_stock_level") @db.Decimal(18, 4) |
| `maxStockLevel` | `Decimal` | @default(0) @map("max_stock_level") @db.Decimal(18, 4) |
| `reorderPoint` | `Decimal` | @default(0) @map("reorder_point") @db.Decimal(18, 4) |
| `safetyStock` | `Decimal` | @default(0) @map("safety_stock") @db.Decimal(18, 4) |
| `leadTimeDays` | `Int` | @default(0) @map("lead_time_days") |

## Model: `StockReservation`
| الحقل | النوع | الوصف |
|---|---|---|
| `id` | `Int` | @id @default(autoincrement()) |
| `tenantId` | `String` | @default("default") @map("tenant_id") |
| `productId` | `Int` | @map("product_id") |
| `warehouseId` | `Int` | @map("warehouse_id") |
| `quantity` | `Decimal` | @db.Decimal(18, 4) |
| `documentType` | `String` | @map("document_type") // SO, WO |
| `documentId` | `Int` | @map("document_id") |
| `expiresAt` | `DateTime?` | @map("expires_at") |
| `status` | `String` | @default("ACTIVE") // ACTIVE, CONSUMED, CANCELLED |

## Model: `RoleFieldPermission`
| الحقل | النوع | الوصف |
|---|---|---|
| `id` | `Int` | @id @default(autoincrement()) |
| `tenantId` | `String` | @default("default") @map("tenant_id") |
| `roleName` | `String` | @map("role_name") |
| `modelName` | `String` | @map("model_name") // e.g. 'JournalEntry' |
| `fieldName` | `String` | @map("field_name") // e.g. 'amount' |
| `permission` | `String` | @default("READ") // READ, WRITE, HIDDEN |

## Model: `SegregationOfDutiesRule`
| الحقل | النوع | الوصف |
|---|---|---|
| `id` | `Int` | @id @default(autoincrement()) |
| `tenantId` | `String` | @default("default") @map("tenant_id") |
| `ruleName` | `String` | @map("rule_name") |
| `actionA` | `String` | @map("action_a") // e.g. 'CREATE_PO' |
| `actionB` | `String` | @map("action_b") // e.g. 'APPROVE_PO' |
| `description` | `String?` |  |

## Model: `ApiKey`
| الحقل | النوع | الوصف |
|---|---|---|
| `id` | `Int` | @id @default(autoincrement()) |
| `tenantId` | `String` | @default("default") @map("tenant_id") |
| `name` | `String` |  |
| `keyHash` | `String` | @unique @map("key_hash") |
| `scopes` | `String` | // JSON array of scopes ['READ:GL', 'WRITE:AP'] |
| `expiresAt` | `DateTime?` | @map("expires_at") |
| `lastUsedAt` | `DateTime?` | @map("last_used_at") |
| `isActive` | `Boolean` | @default(true) @map("is_active") |

## Model: `UserDelegation`
| الحقل | النوع | الوصف |
|---|---|---|
| `id` | `Int` | @id @default(autoincrement()) |
| `tenantId` | `String` | @default("default") @map("tenant_id") |
| `delegatorUserId` | `String` | @map("delegator_user_id") |
| `delegateeUserId` | `String` | @map("delegatee_user_id") |
| `module` | `String` | // e.g. 'APPROVALS', 'ALL' |
| `startDate` | `DateTime` | @map("start_date") |
| `endDate` | `DateTime` | @map("end_date") |
| `isActive` | `Boolean` | @default(true) @map("is_active") |

## Model: `EndOfServiceCalculation`
| الحقل | النوع | الوصف |
|---|---|---|
| `id` | `Int` | @id @default(autoincrement()) |
| `tenantId` | `String` | @default("default") @map("tenant_id") |
| `employeeId` | `Int` | @map("employee_id") |
| `employee` | `Employee` | @relation(fields: [employeeId], references: [id]) |
| `calculationDate` | `DateTime` | @default(now()) @map("calculation_date") |
| `joinDate` | `DateTime` | @map("join_date") |
| `endDate` | `DateTime` | @map("end_date") |
| `reasonForLeaving` | `String` | @map("reason_for_leaving") // RESIGNATION, TERMINATION, RETIREMENT, DEATH, FORCE_MAJEURE |
| `yearsOfService` | `Decimal` | @map("years_of_service") @db.Decimal(10, 4) |
| `lastBasicSalary` | `Decimal` | @map("last_basic_salary") @db.Decimal(15, 2) |
| `lastFullSalary` | `Decimal` | @map("last_full_salary") @db.Decimal(15, 2) |
| `firstFiveYearsAmount` | `Decimal` | @map("first_five_years_amount") @db.Decimal(15, 2) // ط·آ·ط¢آ·ط·آ¢ط¢آ·ط·آ·ط¢آ¢ط·آ¢ط¢آ·ط·آ·ط¢آ·ط·آ¢ط¢آ¢ط·آ·ط¢آ¢ط·آ¢ط¢آ·ط·آ·ط¢آ·ط·آ¢ط¢آ·ط·آ·ط¢آ¢ط·آ¢ط¢آ¢ط·آ·ط¢آ·ط·آ¢ط¢آ¢ط·آ·ط¢آ¢ط·آ¢ط¢آ£ط·آ·ط¢آ·ط·آ¢ط¢آ·ط·آ·ط¢آ¢ط·آ¢ط¢آ·ط·آ·ط¢آ·ط·آ¢ط¢آ¢ط·آ·ط¢آ¢ط·آ¢ط¢آ¢ط·آ·ط¢آ·ط·آ¢ط¢آ·ط·آ·ط¢آ¢ط·آ¢ط¢آ¢ط·آ·ط¢آ·ط·آ¢ط¢آ¢ط·آ·ط¢آ¢ط·آ¢ط¢آ¯ط·آ·ط¢آ·ط·آ¢ط¢آ·ط·آ·ط¢آ¢ط·آ¢ط¢آ·ط·آ·ط¢آ·ط·آ¢ط¢آ¢ط·آ·ط¢آ¢ط·آ¢ط¢آ·ط·آ·ط¢آ·ط·آ¢ط¢آ·ط·آ·ط¢آ¢ط·آ¢ط¢آ¢ط·آ·ط¢آ·ط·آ¢ط¢آ¢ط·آ·ط¢آ¢ط·آ¢ط¢آ·ط·آ·ط¢آ·ط·آ¢ط¢آ·ط·آ·ط¢آ¢ط·آ¢ط¢آ·ط·آ·ط¢آ·ط·آ¢ط¢آ¢ط·آ·ط¢آ¢ط·آ¢ط¢آ¹ط·آ·ط¢آ·ط·آ¢ط¢آ·ط·آ·ط¢آ¢ط·آ¢ط¢آ·ط·آ·ط¢آ£ط·آ¢ط¢آ¢ط·آ£ط¢آ¢ط£آ¢أ¢â€ڑآ¬ط¹â€کط·آ¢ط¢آ¬ط·آ·ط¢آ·ط£آ¢أ¢â€ڑآ¬ط·â€؛ط·آ·ط¢آ·ط·آ¢ط¢آ·ط·آ·ط¢آ¢ط·آ¢ط¢آ·ط·آ·ط¢آ·ط·آ¢ط¢آ¢ط·آ·ط¢آ¢ط·آ¢ط¢آ·ط·آ·ط¢آ·ط·آ¢ط¢آ·ط·آ·ط¢آ¢ط·آ¢ط¢آ¢ط·آ·ط¢آ·ط·آ¢ط¢آ¢ط·آ·ط¢آ¢ط·آ¢ط¢آ¢ط·آ·ط¢آ·ط·آ¢ط¢آ·ط·آ·ط¢آ¢ط·آ¢ط¢آ·ط·آ·ط¢آ·ط·آ¢ط¢آ¢ط·آ·ط¢آ¢ط·آ¢ط¢آ¢ط·آ·ط¢آ·ط·آ¢ط¢آ·ط·آ·ط¢آ¢ط·آ¢ط¢آ¢ط·آ·ط¢آ·ط·آ¢ط¢آ¢ط·آ·ط¢آ¢ط·آ¢ط¢آ½ط·آ·ط¢آ·ط·آ¢ط¢آ·ط·آ·ط¢آ¢ط·آ¢ط¢آ·ط·آ·ط¢آ·ط·آ¢ط¢آ¢ط·آ·ط¢آ¢ط·آ¢ط¢آ·ط·آ·ط¢آ·ط·آ¢ط¢آ·ط·آ·ط¢آ¢ط·آ¢ط¢آ¢ط·آ·ط¢آ·ط·آ¢ط¢آ¢ط·آ·ط¢آ¢ط·آ¢ط¢آ£ط·آ·ط¢آ·ط·آ¢ط¢آ·ط·آ·ط¢آ¢ط·آ¢ط¢آ·ط·آ·ط¢آ·ط·آ¢ط¢آ¢ط·آ·ط¢آ¢ط·آ¢ط¢آ¢ط·آ·ط¢آ·ط·آ¢ط¢آ·ط·آ·ط¢آ¢ط·آ¢ط¢آ¢ط·آ·ط¢آ·ط·آ¢ط¢آ¢ط·آ·ط¢آ¢ط·آ¢ط¢آ¯ط·آ·ط¢آ·ط·آ¢ط¢آ·ط·آ·ط¢آ¢ط·آ¢ط¢آ·ط·آ·ط¢آ·ط·آ¢ط¢آ¢ط·آ·ط¢آ¢ط·آ¢ط¢آ·ط·آ·ط¢آ·ط·آ¢ط¢آ·ط·آ·ط¢آ¢ط·آ¢ط¢آ¢ط·آ·ط¢آ·ط·آ¢ط¢آ¢ط·آ·ط¢آ¢ط·آ¢ط¢آ·ط·آ·ط¢آ·ط·آ¢ط¢آ·ط·آ·ط¢آ¢ط·آ¢ط¢آ·ط·آ·ط¢آ·ط·آ¢ط¢آ¢ط·آ·ط¢آ¢ط·آ¢ط¢آ¹ط·آ·ط¢آ·ط·آ¢ط¢آ·ط·آ·ط¢آ¢ط·آ¢ط¢آ·ط·آ·ط¢آ£ط·آ¢ط¢آ¢ط·آ£ط¢آ¢ط£آ¢أ¢â€ڑآ¬ط¹â€کط·آ¢ط¢آ¬ط·آ·ط¢آ·ط£آ¢أ¢â€ڑآ¬ط·â€؛ط·آ·ط¢آ·ط·آ¢ط¢آ·ط·آ·ط¢آ¢ط·آ¢ط¢آ·ط·آ·ط¢آ·ط·آ¢ط¢آ¢ط·آ·ط¢آ¢ط·آ¢ط¢آ·ط·آ·ط¢آ·ط·آ¢ط¢آ·ط·آ·ط¢آ¢ط·آ¢ط¢آ¢ط·آ·ط¢آ·ط·آ¢ط¢آ¢ط·آ·ط¢آ¢ط·آ¢ط¢آ¢ط·آ·ط¢آ·ط·آ¢ط¢آ·ط·آ·ط¢آ¢ط·آ¢ط¢آ·ط·آ·ط¢آ·ط·آ¢ط¢آ¢ط·آ·ط¢آ¢ط·آ¢ط¢آ¢ط·آ·ط¢آ·ط·آ¢ط¢آ·ط·آ·ط¢آ¢ط·آ¢ط¢آ¢ط·آ·ط¢آ·ط·آ¢ط¢آ¢ط·آ·ط¢آ¢ط·آ¢ط¢آ½ط·آ·ط¢آ·ط·آ¢ط¢آ·ط·آ·ط¢آ¢ط·آ¢ط¢آ·ط·آ·ط¢آ·ط·آ¢ط¢آ¢ط·آ·ط¢آ¢ط·آ¢ط¢آ·ط·آ·ط¢آ·ط·آ¢ط¢آ·ط·آ·ط¢آ¢ط·آ¢ط¢آ¢ط·آ·ط¢آ·ط·آ¢ط¢آ¢ط·آ·ط¢آ¢ط·آ¢ط¢آ£ط·آ·ط¢آ·ط·آ¢ط¢آ·ط·آ·ط¢آ¢ط·آ¢ط¢آ·ط·آ·ط¢آ·ط·آ¢ط¢آ¢ط·آ·ط¢آ¢ط·آ¢ط¢آ¢ط·آ·ط¢آ·ط·آ¢ط¢آ·ط·آ·ط¢آ¢ط·آ¢ط¢آ¢ط·آ·ط¢آ·ط·آ¢ط¢آ¢ط·آ·ط¢آ¢ط·آ¢ط¢آ¯ط·آ·ط¢آ·ط·آ¢ط¢آ·ط·آ·ط¢آ¢ط·آ¢ط¢آ·ط·آ·ط¢آ·ط·آ¢ط¢آ¢ط·آ·ط¢آ¢ط·آ¢ط¢آ·ط·آ·ط¢آ·ط·آ¢ط¢آ·ط·آ·ط¢آ¢ط·آ¢ط¢آ¢ط·آ·ط¢آ·ط·آ¢ط¢آ¢ط·آ·ط¢آ¢ط·آ¢ط¢آ·ط·آ·ط¢آ·ط·آ¢ط¢آ·ط·آ·ط¢آ¢ط·آ¢ط¢آ·ط·آ·ط¢آ·ط·آ¢ط¢آ¢ط·آ·ط¢آ¢ط·آ¢ط¢آ¹ط·آ·ط¢آ·ط·آ¢ط¢آ·ط·آ·ط¢آ¢ط·آ¢ط¢آ·ط·آ·ط¢آ£ط·آ¢ط¢آ¢ط·آ£ط¢آ¢ط£آ¢أ¢â€ڑآ¬ط¹â€کط·آ¢ط¢آ¬ط·آ·ط¢آ·ط£آ¢أ¢â€ڑآ¬ط·â€؛ط·آ·ط¢آ·ط·آ¢ط¢آ·ط·آ·ط¢آ¢ط·آ¢ط¢آ·ط·آ·ط¢آ·ط·آ¢ط¢آ¢ط·آ·ط¢آ¢ط·آ¢ط¢آ·ط·آ·ط¢آ·ط·آ¢ط¢آ·ط·آ·ط¢آ¢ط·آ¢ط¢آ¢ط·آ·ط¢آ·ط·آ¢ط¢آ¢ط·آ·ط¢آ¢ط·آ¢ط¢آ¢ط·آ·ط¢آ·ط·آ¢ط¢آ·ط·آ·ط¢آ¢ط·آ¢ط¢آ·ط·آ·ط¢آ·ط·آ¢ط¢آ¢ط·آ·ط¢آ¢ط·آ¢ط¢آ¢ط·آ·ط¢آ·ط·آ¢ط¢آ·ط·آ·ط¢آ¢ط·آ¢ط¢آ¢ط·آ·ط¢آ·ط·آ¢ط¢آ¢ط·آ·ط¢آ¢ط·آ¢ط¢آ½ ط·آ·ط¢آ·ط·آ¢ط¢آ·ط·آ·ط¢آ¢ط·آ¢ط¢آ·ط·آ·ط¢آ·ط·آ¢ط¢آ¢ط·آ·ط¢آ¢ط·آ¢ط¢آ·ط·آ·ط¢آ·ط·آ¢ط¢آ·ط·آ·ط¢آ¢ط·آ¢ط¢آ¢ط·آ·ط¢آ·ط·آ¢ط¢آ¢ط·آ·ط¢آ¢ط·آ¢ط¢آ£ط·آ·ط¢آ·ط·آ¢ط¢آ·ط·آ·ط¢آ¢ط·آ¢ط¢آ·ط·آ·ط¢آ·ط·آ¢ط¢آ¢ط·آ·ط¢آ¢ط·آ¢ط¢آ¢ط·آ·ط¢آ·ط·آ¢ط¢آ·ط·آ·ط¢آ¢ط·آ¢ط¢آ¢ط·آ·ط¢آ·ط·آ¢ط¢آ¢ط·آ·ط¢آ¢ط·آ¢ط¢آ¯ط·آ·ط¢آ·ط·آ¢ط¢آ·ط·آ·ط¢آ¢ط·آ¢ط¢آ·ط·آ·ط¢آ·ط·آ¢ط¢آ¢ط·آ·ط¢آ¢ط·آ¢ط¢آ·ط·آ·ط¢آ·ط·آ¢ط¢آ·ط·آ·ط¢آ¢ط·آ¢ط¢آ¢ط·آ·ط¢آ·ط·آ¢ط¢آ¢ط·آ·ط¢آ¢ط·آ¢ط¢آ·ط·آ·ط¢آ·ط·آ¢ط¢آ·ط·آ·ط¢آ¢ط·آ¢ط¢آ·ط·آ·ط¢آ·ط·آ¢ط¢آ¢ط·آ·ط¢آ¢ط·آ¢ط¢آ¹ط·آ·ط¢آ·ط·آ¢ط¢آ·ط·آ·ط¢آ¢ط·آ¢ط¢آ·ط·آ·ط¢آ£ط·آ¢ط¢آ¢ط·آ£ط¢آ¢ط£آ¢أ¢â€ڑآ¬ط¹â€کط·آ¢ط¢آ¬ط·آ·ط¢آ·ط£آ¢أ¢â€ڑآ¬ط·â€؛ط·آ·ط¢آ·ط·آ¢ط¢آ·ط·آ·ط¢آ¢ط·آ¢ط¢آ·ط·آ·ط¢آ·ط·آ¢ط¢آ¢ط·آ·ط¢آ¢ط·آ¢ط¢آ·ط·آ·ط¢آ·ط·آ¢ط¢آ·ط·آ·ط¢آ¢ط·آ¢ط¢آ¢ط·آ·ط¢آ·ط·آ¢ط¢آ¢ط·آ·ط¢آ¢ط·آ¢ط¢آ¢ط·آ·ط¢آ·ط·آ¢ط¢آ·ط·آ·ط¢آ¢ط·آ¢ط¢آ·ط·آ·ط¢آ·ط·آ¢ط¢آ¢ط·آ·ط¢آ¢ط·آ¢ط¢آ¢ط·آ·ط¢آ·ط·آ¢ط¢آ·ط·آ·ط¢آ¢ط·آ¢ط¢آ¢ط·آ·ط¢آ·ط·آ¢ط¢آ¢ط·آ·ط¢آ¢ط·آ¢ط¢آ½ط·آ·ط¢آ·ط·آ¢ط¢آ·ط·آ·ط¢آ¢ط·آ¢ط¢آ·ط·آ·ط¢آ·ط·آ¢ط¢آ¢ط·آ·ط¢آ¢ط·آ¢ط¢آ·ط·آ·ط¢آ·ط·آ¢ط¢آ·ط·آ·ط¢آ¢ط·آ¢ط¢آ¢ط·آ·ط¢آ·ط·آ¢ط¢آ¢ط·آ·ط¢آ¢ط·آ¢ط¢آ£ط·آ·ط¢آ·ط·آ¢ط¢آ·ط·آ·ط¢آ¢ط·آ¢ط¢آ·ط·آ·ط¢آ·ط·آ¢ط¢آ¢ط·آ·ط¢آ¢ط·آ¢ط¢آ¢ط·آ·ط¢آ·ط·آ¢ط¢آ·ط·آ·ط¢آ¢ط·آ¢ط¢آ¢ط·آ·ط¢آ·ط·آ¢ط¢آ¢ط·آ·ط¢آ¢ط·آ¢ط¢آ¯ط·آ·ط¢آ·ط·آ¢ط¢آ·ط·آ·ط¢آ¢ط·آ¢ط¢آ·ط·آ·ط¢آ·ط·آ¢ط¢آ¢ط·آ·ط¢آ¢ط·آ¢ط¢آ·ط·آ·ط¢آ·ط·آ¢ط¢آ·ط·آ·ط¢آ¢ط·آ¢ط¢آ¢ط·آ·ط¢آ·ط·آ¢ط¢آ¢ط·آ·ط¢آ¢ط·آ¢ط¢آ·ط·آ·ط¢آ·ط·آ¢ط¢آ·ط·آ·ط¢آ¢ط·آ¢ط¢آ·ط·آ·ط¢آ·ط·آ¢ط¢آ¢ط·آ·ط¢آ¢ط·آ¢ط¢آ¹ط·آ·ط¢آ·ط·آ¢ط¢آ·ط·آ·ط¢آ¢ط·آ¢ط¢آ·ط·آ·ط¢آ£ط·آ¢ط¢آ¢ط·آ£ط¢آ¢ط£آ¢أ¢â€ڑآ¬ط¹â€کط·آ¢ط¢آ¬ط·آ·ط¢آ·ط£آ¢أ¢â€ڑآ¬ط·â€؛ط·آ·ط¢آ·ط·آ¢ط¢آ·ط·آ·ط¢آ¢ط·آ¢ط¢آ·ط·آ·ط¢آ·ط·آ¢ط¢آ¢ط·آ·ط¢آ¢ط·آ¢ط¢آ·ط·آ·ط¢آ·ط·آ¢ط¢آ·ط·آ·ط¢آ¢ط·آ¢ط¢آ¢ط·آ·ط¢آ·ط·آ¢ط¢آ¢ط·آ·ط¢آ¢ط·آ¢ط¢آ¢ط·آ·ط¢آ·ط·آ¢ط¢آ·ط·آ·ط¢آ¢ط·آ¢ط¢آ·ط·آ·ط¢آ·ط·آ¢ط¢آ¢ط·آ·ط¢آ¢ط·آ¢ط¢آ¢ط·آ·ط¢آ·ط·آ¢ط¢آ·ط·آ·ط¢آ¢ط·آ¢ط¢آ¢ط·آ·ط¢آ·ط·آ¢ط¢آ¢ط·آ·ط¢آ¢ط·آ¢ط¢آ½ط·آ·ط¢آ·ط·آ¢ط¢آ·ط·آ·ط¢آ¢ط·آ¢ط¢آ·ط·آ·ط¢آ·ط·آ¢ط¢آ¢ط·آ·ط¢آ¢ط·آ¢ط¢آ·ط·آ·ط¢آ·ط·آ¢ط¢آ·ط·آ·ط¢آ¢ط·آ¢ط¢آ¢ط·آ·ط¢آ·ط·آ¢ط¢آ¢ط·آ·ط¢آ¢ط·آ¢ط¢آ£ط·آ·ط¢آ·ط·آ¢ط¢آ·ط·آ·ط¢آ¢ط·آ¢ط¢آ·ط·آ·ط¢آ·ط·آ¢ط¢آ¢ط·آ·ط¢آ¢ط·آ¢ط¢آ¢ط·آ·ط¢آ·ط·آ¢ط¢آ·ط·آ·ط¢آ¢ط·آ¢ط¢آ¢ط·آ·ط¢آ·ط·آ¢ط¢آ¢ط·آ·ط¢آ¢ط·آ¢ط¢آ¯ط·آ·ط¢آ·ط·آ¢ط¢آ·ط·آ·ط¢آ¢ط·آ¢ط¢آ·ط·آ·ط¢آ·ط·آ¢ط¢آ¢ط·آ·ط¢آ¢ط·آ¢ط¢آ·ط·آ·ط¢آ·ط·آ¢ط¢آ·ط·آ·ط¢آ¢ط·آ¢ط¢آ¢ط·آ·ط¢آ·ط·آ¢ط¢آ¢ط·آ·ط¢آ¢ط·آ¢ط¢آ·ط·آ·ط¢آ·ط·آ¢ط¢آ·ط·آ·ط¢آ¢ط·آ¢ط¢آ·ط·آ·ط¢آ·ط·آ¢ط¢آ¢ط·آ·ط¢آ¢ط·آ¢ط¢آ¹ط·آ·ط¢آ·ط·آ¢ط¢آ·ط·آ·ط¢آ¢ط·آ¢ط¢آ·ط·آ·ط¢آ£ط·آ¢ط¢آ¢ط·آ£ط¢آ¢ط£آ¢أ¢â€ڑآ¬ط¹â€کط·آ¢ط¢آ¬ط·آ·ط¢آ·ط£آ¢أ¢â€ڑآ¬ط·â€؛ط·آ·ط¢آ·ط·آ¢ط¢آ·ط·آ·ط¢آ¢ط·آ¢ط¢آ·ط·آ·ط¢آ·ط·آ¢ط¢آ¢ط·آ·ط¢آ¢ط·آ¢ط¢آ·ط·آ·ط¢آ·ط·آ¢ط¢آ·ط·آ·ط¢آ¢ط·آ¢ط¢آ¢ط·آ·ط¢آ·ط·آ¢ط¢آ¢ط·آ·ط¢آ¢ط·آ¢ط¢آ¢ط·آ·ط¢آ·ط·آ¢ط¢آ·ط·آ·ط¢آ¢ط·آ¢ط¢آ·ط·آ·ط¢آ·ط·آ¢ط¢آ¢ط·آ·ط¢آ¢ط·آ¢ط¢آ¢ط·آ·ط¢آ·ط·آ¢ط¢آ·ط·آ·ط¢آ¢ط·آ¢ط¢آ¢ط·آ·ط¢آ·ط·آ¢ط¢آ¢ط·آ·ط¢آ¢ط·آ¢ط¢آ½ ط·آ·ط¢آ·ط·آ¢ط¢آ·ط·آ·ط¢آ¢ط·آ¢ط¢آ·ط·آ·ط¢آ·ط·آ¢ط¢آ¢ط·آ·ط¢آ¢ط·آ¢ط¢آ·ط·آ·ط¢آ·ط·آ¢ط¢آ·ط·آ·ط¢آ¢ط·آ¢ط¢آ¢ط·آ·ط¢آ·ط·آ¢ط¢آ¢ط·آ·ط¢آ¢ط·آ¢ط¢آ£ط·آ·ط¢آ·ط·آ¢ط¢آ·ط·آ·ط¢آ¢ط·آ¢ط¢آ·ط·آ·ط¢آ·ط·آ¢ط¢آ¢ط·آ·ط¢آ¢ط·آ¢ط¢آ¢ط·آ·ط¢آ·ط·آ¢ط¢آ·ط·آ·ط¢آ¢ط·آ¢ط¢آ¢ط·آ·ط¢آ·ط·آ¢ط¢آ¢ط·آ·ط¢آ¢ط·آ¢ط¢آ¯ط·آ·ط¢آ·ط·آ¢ط¢آ·ط·آ·ط¢آ¢ط·آ¢ط¢آ·ط·آ·ط¢آ·ط·آ¢ط¢آ¢ط·آ·ط¢آ¢ط·آ¢ط¢آ·ط·آ·ط¢آ·ط·آ¢ط¢آ·ط·آ·ط¢آ¢ط·آ¢ط¢آ¢ط·آ·ط¢آ·ط·آ¢ط¢آ¢ط·آ·ط¢آ¢ط·آ¢ط¢آ·ط·آ·ط¢آ·ط·آ¢ط¢آ·ط·آ·ط¢آ¢ط·آ¢ط¢آ·ط·آ·ط¢آ·ط·آ¢ط¢آ¢ط·آ·ط¢آ¢ط·آ¢ط¢آ¹ط·آ·ط¢آ·ط·آ¢ط¢آ·ط·آ·ط¢آ¢ط·آ¢ط¢آ·ط·آ·ط¢آ£ط·آ¢ط¢آ¢ط·آ£ط¢آ¢ط£آ¢أ¢â€ڑآ¬ط¹â€کط·آ¢ط¢آ¬ط·آ·ط¢آ·ط£آ¢أ¢â€ڑآ¬ط·â€؛ط·آ·ط¢آ·ط·آ¢ط¢آ·ط·آ·ط¢آ¢ط·آ¢ط¢آ·ط·آ·ط¢آ·ط·آ¢ط¢آ¢ط·آ·ط¢آ¢ط·آ¢ط¢آ·ط·آ·ط¢آ·ط·آ¢ط¢آ·ط·آ·ط¢آ¢ط·آ¢ط¢آ¢ط·آ·ط¢آ·ط·آ¢ط¢آ¢ط·آ·ط¢آ¢ط·آ¢ط¢آ¢ط·آ·ط¢آ·ط·آ¢ط¢آ·ط·آ·ط¢آ¢ط·آ¢ط¢آ·ط·آ·ط¢آ·ط·آ¢ط¢آ¢ط·آ·ط¢آ¢ط·آ¢ط¢آ¢ط·آ·ط¢آ·ط·آ¢ط¢آ·ط·آ·ط¢آ¢ط·آ¢ط¢آ¢ط·آ·ط¢آ·ط·آ¢ط¢آ¢ط·آ·ط¢آ¢ط·آ¢ط¢آ½ط·آ·ط¢آ·ط·آ¢ط¢آ·ط·آ·ط¢آ¢ط·آ¢ط¢آ·ط·آ·ط¢آ·ط·آ¢ط¢آ¢ط·آ·ط¢آ¢ط·آ¢ط¢آ·ط·آ·ط¢آ·ط·آ¢ط¢آ·ط·آ·ط¢آ¢ط·آ¢ط¢آ¢ط·آ·ط¢آ·ط·آ¢ط¢آ¢ط·آ·ط¢آ¢ط·آ¢ط¢آ£ط·آ·ط¢آ·ط·آ¢ط¢آ·ط·آ·ط¢آ¢ط·آ¢ط¢آ·ط·آ·ط¢آ·ط·آ¢ط¢آ¢ط·آ·ط¢آ¢ط·آ¢ط¢آ¢ط·آ·ط¢آ·ط·آ¢ط¢آ·ط·آ·ط¢آ¢ط·آ¢ط¢آ¢ط·آ·ط¢آ·ط·آ¢ط¢آ¢ط·آ·ط¢آ¢ط·آ¢ط¢آ¯ط·آ·ط¢آ·ط·آ¢ط¢آ·ط·آ·ط¢آ¢ط·آ¢ط¢آ·ط·آ·ط¢آ·ط·آ¢ط¢آ¢ط·آ·ط¢آ¢ط·آ¢ط¢آ·ط·آ·ط¢آ·ط·آ¢ط¢آ·ط·آ·ط¢آ¢ط·آ¢ط¢آ¢ط·آ·ط¢آ·ط·آ¢ط¢آ¢ط·آ·ط¢آ¢ط·آ¢ط¢آ·ط·آ·ط¢آ·ط·آ¢ط¢آ·ط·آ·ط¢آ¢ط·آ¢ط¢آ·ط·آ·ط¢آ·ط·آ¢ط¢آ¢ط·آ·ط¢آ¢ط·آ¢ط¢آ¹ط·آ·ط¢آ·ط·آ¢ط¢آ·ط·آ·ط¢آ¢ط·آ¢ط¢آ·ط·آ·ط¢آ£ط·آ¢ط¢آ¢ط·آ£ط¢آ¢ط£آ¢أ¢â€ڑآ¬ط¹â€کط·آ¢ط¢آ¬ط·آ·ط¢آ·ط£آ¢أ¢â€ڑآ¬ط·â€؛ط·آ·ط¢آ·ط·آ¢ط¢آ·ط·آ·ط¢آ¢ط·آ¢ط¢آ·ط·آ·ط¢آ·ط·آ¢ط¢آ¢ط·آ·ط¢آ¢ط·آ¢ط¢آ·ط·آ·ط¢آ·ط·آ¢ط¢آ·ط·آ·ط¢آ¢ط·آ¢ط¢آ¢ط·آ·ط¢آ·ط·آ¢ط¢آ¢ط·آ·ط¢آ¢ط·آ¢ط¢آ¢ط·آ·ط¢آ·ط·آ¢ط¢آ·ط·آ·ط¢آ¢ط·آ¢ط¢آ·ط·آ·ط¢آ·ط·آ¢ط¢آ¢ط·آ·ط¢آ¢ط·آ¢ط¢آ¢ط·آ·ط¢آ·ط·آ¢ط¢آ·ط·آ·ط¢آ¢ط·آ¢ط¢آ¢ط·آ·ط¢آ·ط·آ¢ط¢آ¢ط·آ·ط¢آ¢ط·آ¢ط¢آ½ط·آ·ط¢آ·ط·آ¢ط¢آ·ط·آ·ط¢آ¢ط·آ¢ط¢آ·ط·آ·ط¢آ·ط·آ¢ط¢آ¢ط·آ·ط¢آ¢ط·آ¢ط¢آ·ط·آ·ط¢آ·ط·آ¢ط¢آ·ط·آ·ط¢آ¢ط·آ¢ط¢آ¢ط·آ·ط¢آ·ط·آ¢ط¢آ¢ط·آ·ط¢آ¢ط·آ¢ط¢آ£ط·آ·ط¢آ·ط·آ¢ط¢آ·ط·آ·ط¢آ¢ط·آ¢ط¢آ·ط·آ·ط¢آ·ط·آ¢ط¢آ¢ط·آ·ط¢آ¢ط·آ¢ط¢آ¢ط·آ·ط¢آ·ط·آ¢ط¢آ·ط·آ·ط¢آ¢ط·آ¢ط¢آ¢ط·آ·ط¢آ·ط·آ¢ط¢آ¢ط·آ·ط¢آ¢ط·آ¢ط¢آ¯ط·آ·ط¢آ·ط·آ¢ط¢آ·ط·آ·ط¢آ¢ط·آ¢ط¢آ·ط·آ·ط¢آ·ط·آ¢ط¢آ¢ط·آ·ط¢آ¢ط·آ¢ط¢آ·ط·آ·ط¢آ·ط·آ¢ط¢آ·ط·آ·ط¢آ¢ط·آ¢ط¢آ¢ط·آ·ط¢آ·ط·آ¢ط¢آ¢ط·آ·ط¢آ¢ط·آ¢ط¢آ·ط·آ·ط¢آ·ط·آ¢ط¢آ·ط·آ·ط¢آ¢ط·آ¢ط¢آ·ط·آ·ط¢آ·ط·آ¢ط¢آ¢ط·آ·ط¢آ¢ط·آ¢ط¢آ¹ط·آ·ط¢آ·ط·آ¢ط¢آ·ط·آ·ط¢آ¢ط·آ¢ط¢آ·ط·آ·ط¢آ£ط·آ¢ط¢آ¢ط·آ£ط¢آ¢ط£آ¢أ¢â€ڑآ¬ط¹â€کط·آ¢ط¢آ¬ط·آ·ط¢آ·ط£آ¢أ¢â€ڑآ¬ط·â€؛ط·آ·ط¢آ·ط·آ¢ط¢آ·ط·آ·ط¢آ¢ط·آ¢ط¢آ·ط·آ·ط¢آ·ط·آ¢ط¢آ¢ط·آ·ط¢آ¢ط·آ¢ط¢آ·ط·آ·ط¢آ·ط·آ¢ط¢آ·ط·آ·ط¢آ¢ط·آ¢ط¢آ¢ط·آ·ط¢آ·ط·آ¢ط¢آ¢ط·آ·ط¢آ¢ط·آ¢ط¢آ¢ط·آ·ط¢آ·ط·آ¢ط¢آ·ط·آ·ط¢آ¢ط·آ¢ط¢آ·ط·آ·ط¢آ·ط·آ¢ط¢آ¢ط·آ·ط¢آ¢ط·آ¢ط¢آ¢ط·آ·ط¢آ·ط·آ¢ط¢آ·ط·آ·ط¢آ¢ط·آ¢ط¢آ¢ط·آ·ط¢آ·ط·آ¢ط¢آ¢ط·آ·ط¢آ¢ط·آ¢ط¢آ½ ط·آ·ط¢آ·ط·آ¢ط¢آ·ط·آ·ط¢آ¢ط·آ¢ط¢آ·ط·آ·ط¢آ·ط·آ¢ط¢آ¢ط·آ·ط¢آ¢ط·آ¢ط¢آ·ط·آ·ط¢آ·ط·آ¢ط¢آ·ط·آ·ط¢آ¢ط·آ¢ط¢آ¢ط·آ·ط¢آ·ط·آ¢ط¢آ¢ط·آ·ط¢آ¢ط·آ¢ط¢آ£ط·آ·ط¢آ·ط·آ¢ط¢آ·ط·آ·ط¢آ¢ط·آ¢ط¢آ·ط·آ·ط¢آ·ط·آ¢ط¢آ¢ط·آ·ط¢آ¢ط·آ¢ط¢آ¢ط·آ·ط¢آ·ط·آ¢ط¢آ·ط·آ·ط¢آ¢ط·آ¢ط¢آ¢ط·آ·ط¢آ·ط·آ¢ط¢آ¢ط·آ·ط¢آ¢ط·آ¢ط¢آ¯ط·آ·ط¢آ·ط·آ¢ط¢آ·ط·آ·ط¢آ¢ط·آ¢ط¢آ·ط·آ·ط¢آ·ط·آ¢ط¢آ¢ط·آ·ط¢آ¢ط·آ¢ط¢آ·ط·آ·ط¢آ·ط·آ¢ط¢آ·ط·آ·ط¢آ¢ط·آ¢ط¢آ¢ط·آ·ط¢آ·ط·آ¢ط¢آ¢ط·آ·ط¢آ¢ط·آ¢ط¢آ·ط·آ·ط¢آ·ط·آ¢ط¢آ·ط·آ·ط¢آ¢ط·آ¢ط¢آ·ط·آ·ط¢آ·ط·آ¢ط¢آ¢ط·آ·ط¢آ¢ط·آ¢ط¢آ¹ط·آ·ط¢آ·ط·آ¢ط¢آ·ط·آ·ط¢آ¢ط·آ¢ط¢آ·ط·آ·ط¢آ£ط·آ¢ط¢آ¢ط·آ£ط¢آ¢ط£آ¢أ¢â€ڑآ¬ط¹â€کط·آ¢ط¢آ¬ط·آ·ط¢آ·ط£آ¢أ¢â€ڑآ¬ط·â€؛ط·آ·ط¢آ·ط·آ¢ط¢آ·ط·آ·ط¢آ¢ط·آ¢ط¢آ·ط·آ·ط¢آ·ط·آ¢ط¢آ¢ط·آ·ط¢آ¢ط·آ¢ط¢آ·ط·آ·ط¢آ·ط·آ¢ط¢آ·ط·آ·ط¢آ¢ط·آ¢ط¢آ¢ط·آ·ط¢آ·ط·آ¢ط¢آ¢ط·آ·ط¢آ¢ط·آ¢ط¢آ¢ط·آ·ط¢آ·ط·آ¢ط¢آ·ط·آ·ط¢آ¢ط·آ¢ط¢آ·ط·آ·ط¢آ·ط·آ¢ط¢آ¢ط·آ·ط¢آ¢ط·آ¢ط¢آ¢ط·آ·ط¢آ·ط·آ¢ط¢آ·ط·آ·ط¢آ¢ط·آ¢ط¢آ¢ط·آ·ط¢آ·ط·آ¢ط¢آ¢ط·آ·ط¢آ¢ط·آ¢ط¢آ½ط·آ·ط¢آ·ط·آ¢ط¢آ·ط·آ·ط¢آ¢ط·آ¢ط¢آ·ط·آ·ط¢آ·ط·آ¢ط¢آ¢ط·آ·ط¢آ¢ط·آ¢ط¢آ·ط·آ·ط¢آ·ط·آ¢ط¢آ·ط·آ·ط¢آ¢ط·آ¢ط¢آ¢ط·آ·ط¢آ·ط·آ¢ط¢آ¢ط·آ·ط¢آ¢ط·آ¢ط¢آ£ط·آ·ط¢آ·ط·آ¢ط¢آ·ط·آ·ط¢آ¢ط·آ¢ط¢آ·ط·آ·ط¢آ·ط·آ¢ط¢آ¢ط·آ·ط¢آ¢ط·آ¢ط¢آ¢ط·آ·ط¢آ·ط·آ¢ط¢آ·ط·آ·ط¢آ¢ط·آ¢ط¢آ¢ط·آ·ط¢آ·ط·آ¢ط¢آ¢ط·آ·ط¢آ¢ط·آ¢ط¢آ¯ط·آ·ط¢آ·ط·آ¢ط¢آ·ط·آ·ط¢آ¢ط·آ¢ط¢آ·ط·آ·ط¢آ·ط·آ¢ط¢آ¢ط·آ·ط¢آ¢ط·آ¢ط¢آ·ط·آ·ط¢آ·ط·آ¢ط¢آ·ط·آ·ط¢آ¢ط·آ¢ط¢آ¢ط·آ·ط¢آ·ط·آ¢ط¢آ¢ط·آ·ط¢آ¢ط·آ¢ط¢آ·ط·آ·ط¢آ·ط·آ¢ط¢آ·ط·آ·ط¢آ¢ط·آ¢ط¢آ·ط·آ·ط¢آ·ط·آ¢ط¢آ¢ط·آ·ط¢آ¢ط·آ¢ط¢آ¹ط·آ·ط¢آ·ط·آ¢ط¢آ·ط·آ·ط¢آ¢ط·آ¢ط¢آ·ط·آ·ط¢آ£ط·آ¢ط¢آ¢ط·آ£ط¢آ¢ط£آ¢أ¢â€ڑآ¬ط¹â€کط·آ¢ط¢آ¬ط·آ·ط¢آ·ط£آ¢أ¢â€ڑآ¬ط·â€؛ط·آ·ط¢آ·ط·آ¢ط¢آ·ط·آ·ط¢آ¢ط·آ¢ط¢آ·ط·آ·ط¢آ·ط·آ¢ط¢آ¢ط·آ·ط¢آ¢ط·آ¢ط¢آ·ط·آ·ط¢آ·ط·آ¢ط¢آ·ط·آ·ط¢آ¢ط·آ¢ط¢آ¢ط·آ·ط¢آ·ط·آ¢ط¢آ¢ط·آ·ط¢آ¢ط·آ¢ط¢آ¢ط·آ·ط¢آ·ط·آ¢ط¢آ·ط·آ·ط¢آ¢ط·آ¢ط¢آ·ط·آ·ط¢آ·ط·آ¢ط¢آ¢ط·آ·ط¢آ¢ط·آ¢ط¢آ¢ط·آ·ط¢آ·ط·آ¢ط¢آ·ط·آ·ط¢آ¢ط·آ¢ط¢آ¢ط·آ·ط¢آ·ط·آ¢ط¢آ¢ط·آ·ط¢آ¢ط·آ¢ط¢آ½ط·آ·ط¢آ·ط·آ¢ط¢آ·ط·آ·ط¢آ¢ط·آ¢ط¢آ·ط·آ·ط¢آ·ط·آ¢ط¢آ¢ط·آ·ط¢آ¢ط·آ¢ط¢آ·ط·آ·ط¢آ·ط·آ¢ط¢آ·ط·آ·ط¢آ¢ط·آ¢ط¢آ¢ط·آ·ط¢آ·ط·آ¢ط¢آ¢ط·آ·ط¢آ¢ط·آ¢ط¢آ£ط·آ·ط¢آ·ط·آ¢ط¢آ·ط·آ·ط¢آ¢ط·آ¢ط¢آ·ط·آ·ط¢آ·ط·آ¢ط¢آ¢ط·آ·ط¢آ¢ط·آ¢ط¢آ¢ط·آ·ط¢آ·ط·آ¢ط¢آ·ط·آ·ط¢آ¢ط·آ¢ط¢آ¢ط·آ·ط¢آ·ط·آ¢ط¢آ¢ط·آ·ط¢آ¢ط·آ¢ط¢آ¯ط·آ·ط¢آ·ط·آ¢ط¢آ·ط·آ·ط¢آ¢ط·آ¢ط¢آ·ط·آ·ط¢آ·ط·آ¢ط¢آ¢ط·آ·ط¢آ¢ط·آ¢ط¢آ·ط·آ·ط¢آ·ط·آ¢ط¢آ·ط·آ·ط¢آ¢ط·آ¢ط¢آ¢ط·آ·ط¢آ·ط·آ¢ط¢آ¢ط·آ·ط¢آ¢ط·آ¢ط¢آ·ط·آ·ط¢آ·ط·آ¢ط¢آ·ط·آ·ط¢آ¢ط·آ¢ط¢آ·ط·آ·ط¢آ·ط·آ¢ط¢آ¢ط·آ·ط¢آ¢ط·آ¢ط¢آ¹ط·آ·ط¢آ·ط·آ¢ط¢آ·ط·آ·ط¢آ¢ط·آ¢ط¢آ·ط·آ·ط¢آ£ط·آ¢ط¢آ¢ط·آ£ط¢آ¢ط£آ¢أ¢â€ڑآ¬ط¹â€کط·آ¢ط¢آ¬ط·آ·ط¢آ·ط£آ¢أ¢â€ڑآ¬ط·â€؛ط·آ·ط¢آ·ط·آ¢ط¢آ·ط·آ·ط¢آ¢ط·آ¢ط¢آ·ط·آ·ط¢آ·ط·آ¢ط¢آ¢ط·آ·ط¢آ¢ط·آ¢ط¢آ·ط·آ·ط¢آ·ط·آ¢ط¢آ·ط·آ·ط¢آ¢ط·آ¢ط¢آ¢ط·آ·ط¢آ·ط·آ¢ط¢آ¢ط·آ·ط¢آ¢ط·آ¢ط¢آ¢ط·آ·ط¢آ·ط·آ¢ط¢آ·ط·آ·ط¢آ¢ط·آ¢ط¢آ·ط·آ·ط¢آ·ط·آ¢ط¢آ¢ط·آ·ط¢آ¢ط·آ¢ط¢آ¢ط·آ·ط¢آ·ط·آ¢ط¢آ·ط·آ·ط¢آ¢ط·آ¢ط¢آ¢ط·آ·ط¢آ·ط·آ¢ط¢آ¢ط·آ·ط¢آ¢ط·آ¢ط¢آ½ |
| `remainingYearsAmount` | `Decimal` | @map("remaining_years_amount") @db.Decimal(15, 2) // ط·آ·ط¢آ·ط·آ¢ط¢آ·ط·آ·ط¢آ¢ط·آ¢ط¢آ·ط·آ·ط¢آ·ط·آ¢ط¢آ¢ط·آ·ط¢آ¢ط·آ¢ط¢آ·ط·آ·ط¢آ·ط·آ¢ط¢آ·ط·آ·ط¢آ¢ط·آ¢ط¢آ¢ط·آ·ط¢آ·ط·آ¢ط¢آ¢ط·آ·ط¢آ¢ط·آ¢ط¢آ£ط·آ·ط¢آ·ط·آ¢ط¢آ·ط·آ·ط¢آ¢ط·آ¢ط¢آ·ط·آ·ط¢آ·ط·آ¢ط¢آ¢ط·آ·ط¢آ¢ط·آ¢ط¢آ¢ط·آ·ط¢آ·ط·آ¢ط¢آ·ط·آ·ط¢آ¢ط·آ¢ط¢آ¢ط·آ·ط¢آ·ط·آ¢ط¢آ¢ط·آ·ط¢آ¢ط·آ¢ط¢آ¯ط·آ·ط¢آ·ط·آ¢ط¢آ·ط·آ·ط¢آ¢ط·آ¢ط¢آ·ط·آ·ط¢آ·ط·آ¢ط¢آ¢ط·آ·ط¢آ¢ط·آ¢ط¢آ·ط·آ·ط¢آ·ط·آ¢ط¢آ·ط·آ·ط¢آ¢ط·آ¢ط¢آ¢ط·آ·ط¢آ·ط·آ¢ط¢آ¢ط·آ·ط¢آ¢ط·آ¢ط¢آ·ط·آ·ط¢آ·ط·آ¢ط¢آ·ط·آ·ط¢آ¢ط·آ¢ط¢آ·ط·آ·ط¢آ·ط·آ¢ط¢آ¢ط·آ·ط¢آ¢ط·آ¢ط¢آ¹ط·آ·ط¢آ·ط·آ¢ط¢آ·ط·آ·ط¢آ¢ط·آ¢ط¢آ·ط·آ·ط¢آ£ط·آ¢ط¢آ¢ط·آ£ط¢آ¢ط£آ¢أ¢â€ڑآ¬ط¹â€کط·آ¢ط¢آ¬ط·آ·ط¢آ·ط£آ¢أ¢â€ڑآ¬ط·â€؛ط·آ·ط¢آ·ط·آ¢ط¢آ·ط·آ·ط¢آ¢ط·آ¢ط¢آ·ط·آ·ط¢آ·ط·آ¢ط¢آ¢ط·آ·ط¢آ¢ط·آ¢ط¢آ·ط·آ·ط¢آ·ط·آ¢ط¢آ·ط·آ·ط¢آ¢ط·آ¢ط¢آ¢ط·آ·ط¢آ·ط·آ¢ط¢آ¢ط·آ·ط¢آ¢ط·آ¢ط¢آ¢ط·آ·ط¢آ·ط·آ¢ط¢آ·ط·آ·ط¢آ¢ط·آ¢ط¢آ·ط·آ·ط¢آ·ط·آ¢ط¢آ¢ط·آ·ط¢آ¢ط·آ¢ط¢آ¢ط·آ·ط¢آ·ط·آ¢ط¢آ·ط·آ·ط¢آ¢ط·آ¢ط¢آ¢ط·آ·ط¢آ·ط·آ¢ط¢آ¢ط·آ·ط¢آ¢ط·آ¢ط¢آ½ط·آ·ط¢آ·ط·آ¢ط¢آ·ط·آ·ط¢آ¢ط·آ¢ط¢آ·ط·آ·ط¢آ·ط·آ¢ط¢آ¢ط·آ·ط¢آ¢ط·آ¢ط¢آ·ط·آ·ط¢آ·ط·آ¢ط¢آ·ط·آ·ط¢آ¢ط·آ¢ط¢آ¢ط·آ·ط¢آ·ط·آ¢ط¢آ¢ط·آ·ط¢آ¢ط·آ¢ط¢آ£ط·آ·ط¢آ·ط·آ¢ط¢آ·ط·آ·ط¢آ¢ط·آ¢ط¢آ·ط·آ·ط¢آ·ط·آ¢ط¢آ¢ط·آ·ط¢آ¢ط·آ¢ط¢آ¢ط·آ·ط¢آ·ط·آ¢ط¢آ·ط·آ·ط¢آ¢ط·آ¢ط¢آ¢ط·آ·ط¢آ·ط·آ¢ط¢آ¢ط·آ·ط¢آ¢ط·آ¢ط¢آ¯ط·آ·ط¢آ·ط·آ¢ط¢آ·ط·آ·ط¢آ¢ط·آ¢ط¢آ·ط·آ·ط¢آ·ط·آ¢ط¢آ¢ط·آ·ط¢آ¢ط·آ¢ط¢آ·ط·آ·ط¢آ·ط·آ¢ط¢آ·ط·آ·ط¢آ¢ط·آ¢ط¢آ¢ط·آ·ط¢آ·ط·آ¢ط¢آ¢ط·آ·ط¢آ¢ط·آ¢ط¢آ·ط·آ·ط¢آ·ط·آ¢ط¢آ·ط·آ·ط¢آ¢ط·آ¢ط¢آ·ط·آ·ط¢آ·ط·آ¢ط¢آ¢ط·آ·ط¢آ¢ط·آ¢ط¢آ¹ط·آ·ط¢آ·ط·آ¢ط¢آ·ط·آ·ط¢آ¢ط·آ¢ط¢آ·ط·آ·ط¢آ£ط·آ¢ط¢آ¢ط·آ£ط¢آ¢ط£آ¢أ¢â€ڑآ¬ط¹â€کط·آ¢ط¢آ¬ط·آ·ط¢آ·ط£آ¢أ¢â€ڑآ¬ط·â€؛ط·آ·ط¢آ·ط·آ¢ط¢آ·ط·آ·ط¢آ¢ط·آ¢ط¢آ·ط·آ·ط¢آ·ط·آ¢ط¢آ¢ط·آ·ط¢آ¢ط·آ¢ط¢آ·ط·آ·ط¢آ·ط·آ¢ط¢آ·ط·آ·ط¢آ¢ط·آ¢ط¢آ¢ط·آ·ط¢آ·ط·آ¢ط¢آ¢ط·آ·ط¢آ¢ط·آ¢ط¢آ¢ط·آ·ط¢آ·ط·آ¢ط¢آ·ط·آ·ط¢آ¢ط·آ¢ط¢آ·ط·آ·ط¢آ·ط·آ¢ط¢آ¢ط·آ·ط¢آ¢ط·آ¢ط¢آ¢ط·آ·ط¢آ·ط·آ¢ط¢آ·ط·آ·ط¢آ¢ط·آ¢ط¢آ¢ط·آ·ط¢آ·ط·آ¢ط¢آ¢ط·آ·ط¢آ¢ط·آ¢ط¢آ½ط·آ·ط¢آ·ط·آ¢ط¢آ·ط·آ·ط¢آ¢ط·آ¢ط¢آ·ط·آ·ط¢آ·ط·آ¢ط¢آ¢ط·آ·ط¢آ¢ط·آ¢ط¢آ·ط·آ·ط¢آ·ط·آ¢ط¢آ·ط·آ·ط¢آ¢ط·آ¢ط¢آ¢ط·آ·ط¢آ·ط·آ¢ط¢آ¢ط·آ·ط¢آ¢ط·آ¢ط¢آ£ط·آ·ط¢آ·ط·آ¢ط¢آ·ط·آ·ط¢آ¢ط·آ¢ط¢آ·ط·آ·ط¢آ·ط·آ¢ط¢آ¢ط·آ·ط¢آ¢ط·آ¢ط¢آ¢ط·آ·ط¢آ·ط·آ¢ط¢آ·ط·آ·ط¢آ¢ط·آ¢ط¢آ¢ط·آ·ط¢آ·ط·آ¢ط¢آ¢ط·آ·ط¢آ¢ط·آ¢ط¢آ¯ط·آ·ط¢آ·ط·آ¢ط¢آ·ط·آ·ط¢آ¢ط·آ¢ط¢آ·ط·آ·ط¢آ·ط·آ¢ط¢آ¢ط·آ·ط¢آ¢ط·آ¢ط¢آ·ط·آ·ط¢آ·ط·آ¢ط¢آ·ط·آ·ط¢آ¢ط·آ¢ط¢آ¢ط·آ·ط¢آ·ط·آ¢ط¢آ¢ط·آ·ط¢آ¢ط·آ¢ط¢آ·ط·آ·ط¢آ·ط·آ¢ط¢آ·ط·آ·ط¢آ¢ط·آ¢ط¢آ·ط·آ·ط¢آ·ط·آ¢ط¢آ¢ط·آ·ط¢آ¢ط·آ¢ط¢آ¹ط·آ·ط¢آ·ط·آ¢ط¢آ·ط·آ·ط¢آ¢ط·آ¢ط¢آ·ط·آ·ط¢آ£ط·آ¢ط¢آ¢ط·آ£ط¢آ¢ط£آ¢أ¢â€ڑآ¬ط¹â€کط·آ¢ط¢آ¬ط·آ·ط¢آ·ط£آ¢أ¢â€ڑآ¬ط·â€؛ط·آ·ط¢آ·ط·آ¢ط¢آ·ط·آ·ط¢آ¢ط·آ¢ط¢آ·ط·آ·ط¢آ·ط·آ¢ط¢آ¢ط·آ·ط¢آ¢ط·آ¢ط¢آ·ط·آ·ط¢آ·ط·آ¢ط¢آ·ط·آ·ط¢آ¢ط·آ¢ط¢آ¢ط·آ·ط¢آ·ط·آ¢ط¢آ¢ط·آ·ط¢آ¢ط·آ¢ط¢آ¢ط·آ·ط¢آ·ط·آ¢ط¢آ·ط·آ·ط¢آ¢ط·آ¢ط¢آ·ط·آ·ط¢آ·ط·آ¢ط¢آ¢ط·آ·ط¢آ¢ط·آ¢ط¢آ¢ط·آ·ط¢آ·ط·آ¢ط¢آ·ط·آ·ط¢آ¢ط·آ¢ط¢آ¢ط·آ·ط¢آ·ط·آ¢ط¢آ¢ط·آ·ط¢آ¢ط·آ¢ط¢آ½ ط·آ·ط¢آ·ط·آ¢ط¢آ·ط·آ·ط¢آ¢ط·آ¢ط¢آ·ط·آ·ط¢آ·ط·آ¢ط¢آ¢ط·آ·ط¢آ¢ط·آ¢ط¢آ·ط·آ·ط¢آ·ط·آ¢ط¢آ·ط·آ·ط¢آ¢ط·آ¢ط¢آ¢ط·آ·ط¢آ·ط·آ¢ط¢آ¢ط·آ·ط¢آ¢ط·آ¢ط¢آ£ط·آ·ط¢آ·ط·آ¢ط¢آ·ط·آ·ط¢آ¢ط·آ¢ط¢آ·ط·آ·ط¢آ·ط·آ¢ط¢آ¢ط·آ·ط¢آ¢ط·آ¢ط¢آ¢ط·آ·ط¢آ·ط·آ¢ط¢آ·ط·آ·ط¢آ¢ط·آ¢ط¢آ¢ط·آ·ط¢آ·ط·آ¢ط¢آ¢ط·آ·ط¢آ¢ط·آ¢ط¢آ¯ط·آ·ط¢آ·ط·آ¢ط¢آ·ط·آ·ط¢آ¢ط·آ¢ط¢آ·ط·آ·ط¢آ·ط·آ¢ط¢آ¢ط·آ·ط¢آ¢ط·آ¢ط¢آ·ط·آ·ط¢آ·ط·آ¢ط¢آ·ط·آ·ط¢آ¢ط·آ¢ط¢آ¢ط·آ·ط¢آ·ط·آ¢ط¢آ¢ط·آ·ط¢آ¢ط·آ¢ط¢آ·ط·آ·ط¢آ·ط·آ¢ط¢آ·ط·آ·ط¢آ¢ط·آ¢ط¢آ·ط·آ·ط¢آ·ط·آ¢ط¢آ¢ط·آ·ط¢آ¢ط·آ¢ط¢آ¹ط·آ·ط¢آ·ط·آ¢ط¢آ·ط·آ·ط¢آ¢ط·آ¢ط¢آ·ط·آ·ط¢آ£ط·آ¢ط¢آ¢ط·آ£ط¢آ¢ط£آ¢أ¢â€ڑآ¬ط¹â€کط·آ¢ط¢آ¬ط·آ·ط¢آ·ط£آ¢أ¢â€ڑآ¬ط·â€؛ط·آ·ط¢آ·ط·آ¢ط¢آ·ط·آ·ط¢آ¢ط·آ¢ط¢آ·ط·آ·ط¢آ·ط·آ¢ط¢آ¢ط·آ·ط¢آ¢ط·آ¢ط¢آ·ط·آ·ط¢آ·ط·آ¢ط¢آ·ط·آ·ط¢آ¢ط·آ¢ط¢آ¢ط·آ·ط¢آ·ط·آ¢ط¢آ¢ط·آ·ط¢آ¢ط·آ¢ط¢آ¢ط·آ·ط¢آ·ط·آ¢ط¢آ·ط·آ·ط¢آ¢ط·آ¢ط¢آ·ط·آ·ط¢آ·ط·آ¢ط¢آ¢ط·آ·ط¢آ¢ط·آ¢ط¢آ¢ط·آ·ط¢آ·ط·آ¢ط¢آ·ط·آ·ط¢آ¢ط·آ¢ط¢آ¢ط·آ·ط¢آ·ط·آ¢ط¢آ¢ط·آ·ط¢آ¢ط·آ¢ط¢آ½ط·آ·ط¢آ·ط·آ¢ط¢آ·ط·آ·ط¢آ¢ط·آ¢ط¢آ·ط·آ·ط¢آ·ط·آ¢ط¢آ¢ط·آ·ط¢آ¢ط·آ¢ط¢آ·ط·آ·ط¢آ·ط·آ¢ط¢آ·ط·آ·ط¢آ¢ط·آ¢ط¢آ¢ط·آ·ط¢آ·ط·آ¢ط¢آ¢ط·آ·ط¢آ¢ط·آ¢ط¢آ£ط·آ·ط¢آ·ط·آ¢ط¢آ·ط·آ·ط¢آ¢ط·آ¢ط¢آ·ط·آ·ط¢آ·ط·آ¢ط¢آ¢ط·آ·ط¢آ¢ط·آ¢ط¢آ¢ط·آ·ط¢آ·ط·آ¢ط¢آ·ط·آ·ط¢آ¢ط·آ¢ط¢آ¢ط·آ·ط¢آ·ط·آ¢ط¢آ¢ط·آ·ط¢آ¢ط·آ¢ط¢آ¯ط·آ·ط¢آ·ط·آ¢ط¢آ·ط·آ·ط¢آ¢ط·آ¢ط¢آ·ط·آ·ط¢آ·ط·آ¢ط¢آ¢ط·آ·ط¢آ¢ط·آ¢ط¢آ·ط·آ·ط¢آ·ط·آ¢ط¢آ·ط·آ·ط¢آ¢ط·آ¢ط¢آ¢ط·آ·ط¢آ·ط·آ¢ط¢آ¢ط·آ·ط¢آ¢ط·آ¢ط¢آ·ط·آ·ط¢آ·ط·آ¢ط¢آ·ط·آ·ط¢آ¢ط·آ¢ط¢آ·ط·آ·ط¢آ·ط·آ¢ط¢آ¢ط·آ·ط¢آ¢ط·آ¢ط¢آ¹ط·آ·ط¢آ·ط·آ¢ط¢آ·ط·آ·ط¢آ¢ط·آ¢ط¢آ·ط·آ·ط¢آ£ط·آ¢ط¢آ¢ط·آ£ط¢آ¢ط£آ¢أ¢â€ڑآ¬ط¹â€کط·آ¢ط¢آ¬ط·آ·ط¢آ·ط£آ¢أ¢â€ڑآ¬ط·â€؛ط·آ·ط¢آ·ط·آ¢ط¢آ·ط·آ·ط¢آ¢ط·آ¢ط¢آ·ط·آ·ط¢آ·ط·آ¢ط¢آ¢ط·آ·ط¢آ¢ط·آ¢ط¢آ·ط·آ·ط¢آ·ط·آ¢ط¢آ·ط·آ·ط¢آ¢ط·آ¢ط¢آ¢ط·آ·ط¢آ·ط·آ¢ط¢آ¢ط·آ·ط¢آ¢ط·آ¢ط¢آ¢ط·آ·ط¢آ·ط·آ¢ط¢آ·ط·آ·ط¢آ¢ط·آ¢ط¢آ·ط·آ·ط¢آ·ط·آ¢ط¢آ¢ط·آ·ط¢آ¢ط·آ¢ط¢آ¢ط·آ·ط¢آ·ط·آ¢ط¢آ·ط·آ·ط¢آ¢ط·آ¢ط¢آ¢ط·آ·ط¢آ·ط·آ¢ط¢آ¢ط·آ·ط¢آ¢ط·آ¢ط¢آ½ط·آ·ط¢آ·ط·آ¢ط¢آ·ط·آ·ط¢آ¢ط·آ¢ط¢آ·ط·آ·ط¢آ·ط·آ¢ط¢آ¢ط·آ·ط¢آ¢ط·آ¢ط¢آ·ط·آ·ط¢آ·ط·آ¢ط¢آ·ط·آ·ط¢آ¢ط·آ¢ط¢آ¢ط·آ·ط¢آ·ط·آ¢ط¢آ¢ط·آ·ط¢آ¢ط·آ¢ط¢آ£ط·آ·ط¢آ·ط·آ¢ط¢آ·ط·آ·ط¢آ¢ط·آ¢ط¢آ·ط·آ·ط¢آ·ط·آ¢ط¢آ¢ط·آ·ط¢آ¢ط·آ¢ط¢آ¢ط·آ·ط¢آ·ط·آ¢ط¢آ·ط·آ·ط¢آ¢ط·آ¢ط¢آ¢ط·آ·ط¢آ·ط·آ¢ط¢آ¢ط·آ·ط¢آ¢ط·آ¢ط¢آ¯ط·آ·ط¢آ·ط·آ¢ط¢آ·ط·آ·ط¢آ¢ط·آ¢ط¢آ·ط·آ·ط¢آ·ط·آ¢ط¢آ¢ط·آ·ط¢آ¢ط·آ¢ط¢آ·ط·آ·ط¢آ·ط·آ¢ط¢آ·ط·آ·ط¢آ¢ط·آ¢ط¢آ¢ط·آ·ط¢آ·ط·آ¢ط¢آ¢ط·آ·ط¢آ¢ط·آ¢ط¢آ·ط·آ·ط¢آ·ط·آ¢ط¢آ·ط·آ·ط¢آ¢ط·آ¢ط¢آ·ط·آ·ط¢آ·ط·آ¢ط¢آ¢ط·آ·ط¢آ¢ط·آ¢ط¢آ¹ط·آ·ط¢آ·ط·آ¢ط¢آ·ط·آ·ط¢آ¢ط·آ¢ط¢آ·ط·آ·ط¢آ£ط·آ¢ط¢آ¢ط·آ£ط¢آ¢ط£آ¢أ¢â€ڑآ¬ط¹â€کط·آ¢ط¢آ¬ط·آ·ط¢آ·ط£آ¢أ¢â€ڑآ¬ط·â€؛ط·آ·ط¢آ·ط·آ¢ط¢آ·ط·آ·ط¢آ¢ط·آ¢ط¢آ·ط·آ·ط¢آ·ط·آ¢ط¢آ¢ط·آ·ط¢آ¢ط·آ¢ط¢آ·ط·آ·ط¢آ·ط·آ¢ط¢آ·ط·آ·ط¢آ¢ط·آ¢ط¢آ¢ط·آ·ط¢آ·ط·آ¢ط¢آ¢ط·آ·ط¢آ¢ط·آ¢ط¢آ¢ط·آ·ط¢آ·ط·آ¢ط¢آ·ط·آ·ط¢آ¢ط·آ¢ط¢آ·ط·آ·ط¢آ·ط·آ¢ط¢آ¢ط·آ·ط¢آ¢ط·آ¢ط¢آ¢ط·آ·ط¢آ·ط·آ¢ط¢آ·ط·آ·ط¢آ¢ط·آ¢ط¢آ¢ط·آ·ط¢آ·ط·آ¢ط¢آ¢ط·آ·ط¢آ¢ط·آ¢ط¢آ½ط·آ·ط¢آ·ط·آ¢ط¢آ·ط·آ·ط¢آ¢ط·آ¢ط¢آ·ط·آ·ط¢آ·ط·آ¢ط¢آ¢ط·آ·ط¢آ¢ط·آ¢ط¢آ·ط·آ·ط¢آ·ط·آ¢ط¢آ·ط·آ·ط¢آ¢ط·آ¢ط¢آ¢ط·آ·ط¢آ·ط·آ¢ط¢آ¢ط·آ·ط¢آ¢ط·آ¢ط¢آ£ط·آ·ط¢آ·ط·آ¢ط¢آ·ط·آ·ط¢آ¢ط·آ¢ط¢آ·ط·آ·ط¢آ·ط·آ¢ط¢آ¢ط·آ·ط¢آ¢ط·آ¢ط¢آ¢ط·آ·ط¢آ·ط·آ¢ط¢آ·ط·آ·ط¢آ¢ط·آ¢ط¢آ¢ط·آ·ط¢آ·ط·آ¢ط¢آ¢ط·آ·ط¢آ¢ط·آ¢ط¢آ¯ط·آ·ط¢آ·ط·آ¢ط¢آ·ط·آ·ط¢آ¢ط·آ¢ط¢آ·ط·آ·ط¢آ·ط·آ¢ط¢آ¢ط·آ·ط¢آ¢ط·آ¢ط¢آ·ط·آ·ط¢آ·ط·آ¢ط¢آ·ط·آ·ط¢آ¢ط·آ¢ط¢آ¢ط·آ·ط¢آ·ط·آ¢ط¢آ¢ط·آ·ط¢آ¢ط·آ¢ط¢آ·ط·آ·ط¢آ·ط·آ¢ط¢آ·ط·آ·ط¢آ¢ط·آ¢ط¢آ·ط·آ·ط¢آ·ط·آ¢ط¢آ¢ط·آ·ط¢آ¢ط·آ¢ط¢آ¹ط·آ·ط¢آ·ط·آ¢ط¢آ·ط·آ·ط¢آ¢ط·آ¢ط¢آ·ط·آ·ط¢آ£ط·آ¢ط¢آ¢ط·آ£ط¢آ¢ط£آ¢أ¢â€ڑآ¬ط¹â€کط·آ¢ط¢آ¬ط·آ·ط¢آ·ط£آ¢أ¢â€ڑآ¬ط·â€؛ط·آ·ط¢آ·ط·آ¢ط¢آ·ط·آ·ط¢آ¢ط·آ¢ط¢آ·ط·آ·ط¢آ·ط·آ¢ط¢آ¢ط·آ·ط¢آ¢ط·آ¢ط¢آ·ط·آ·ط¢آ·ط·آ¢ط¢آ·ط·آ·ط¢آ¢ط·آ¢ط¢آ¢ط·آ·ط¢آ·ط·آ¢ط¢آ¢ط·آ·ط¢آ¢ط·آ¢ط¢آ¢ط·آ·ط¢آ·ط·آ¢ط¢آ·ط·آ·ط¢آ¢ط·آ¢ط¢آ·ط·آ·ط¢آ·ط·آ¢ط¢آ¢ط·آ·ط¢آ¢ط·آ¢ط¢آ¢ط·آ·ط¢آ·ط·آ¢ط¢آ·ط·آ·ط¢آ¢ط·آ¢ط¢آ¢ط·آ·ط¢آ·ط·آ¢ط¢آ¢ط·آ·ط¢آ¢ط·آ¢ط¢آ½ ط·آ·ط¢آ·ط·آ¢ط¢آ·ط·آ·ط¢آ¢ط·آ¢ط¢آ·ط·آ·ط¢آ·ط·آ¢ط¢آ¢ط·آ·ط¢آ¢ط·آ¢ط¢آ·ط·آ·ط¢آ·ط·آ¢ط¢آ·ط·آ·ط¢آ¢ط·آ¢ط¢آ¢ط·آ·ط¢آ·ط·آ¢ط¢آ¢ط·آ·ط¢آ¢ط·آ¢ط¢آ£ط·آ·ط¢آ·ط·آ¢ط¢آ·ط·آ·ط¢آ¢ط·آ¢ط¢آ·ط·آ·ط¢آ·ط·آ¢ط¢آ¢ط·آ·ط¢آ¢ط·آ¢ط¢آ¢ط·آ·ط¢آ·ط·آ¢ط¢آ·ط·آ·ط¢آ¢ط·آ¢ط¢آ¢ط·آ·ط¢آ·ط·آ¢ط¢آ¢ط·آ·ط¢آ¢ط·آ¢ط¢آ¯ط·آ·ط¢آ·ط·آ¢ط¢آ·ط·آ·ط¢آ¢ط·آ¢ط¢آ·ط·آ·ط¢آ·ط·آ¢ط¢آ¢ط·آ·ط¢آ¢ط·آ¢ط¢آ·ط·آ·ط¢آ·ط·آ¢ط¢آ·ط·آ·ط¢آ¢ط·آ¢ط¢آ¢ط·آ·ط¢آ·ط·آ¢ط¢آ¢ط·آ·ط¢آ¢ط·آ¢ط¢آ·ط·آ·ط¢آ·ط·آ¢ط¢آ·ط·آ·ط¢آ¢ط·آ¢ط¢آ·ط·آ·ط¢آ·ط·آ¢ط¢آ¢ط·آ·ط¢آ¢ط·آ¢ط¢آ¹ط·آ·ط¢آ·ط·آ¢ط¢آ·ط·آ·ط¢آ¢ط·آ¢ط¢آ·ط·آ·ط¢آ£ط·آ¢ط¢آ¢ط·آ£ط¢آ¢ط£آ¢أ¢â€ڑآ¬ط¹â€کط·آ¢ط¢آ¬ط·آ·ط¢آ·ط£آ¢أ¢â€ڑآ¬ط·â€؛ط·آ·ط¢آ·ط·آ¢ط¢آ·ط·آ·ط¢آ¢ط·آ¢ط¢آ·ط·آ·ط¢آ·ط·آ¢ط¢آ¢ط·آ·ط¢آ¢ط·آ¢ط¢آ·ط·آ·ط¢آ·ط·آ¢ط¢آ·ط·آ·ط¢آ¢ط·آ¢ط¢آ¢ط·آ·ط¢آ·ط·آ¢ط¢آ¢ط·آ·ط¢آ¢ط·آ¢ط¢آ¢ط·آ·ط¢آ·ط·آ¢ط¢آ·ط·آ·ط¢آ¢ط·آ¢ط¢آ·ط·آ·ط¢آ·ط·آ¢ط¢آ¢ط·آ·ط¢آ¢ط·آ¢ط¢آ¢ط·آ·ط¢آ·ط·آ¢ط¢آ·ط·آ·ط¢آ¢ط·آ¢ط¢آ¢ط·آ·ط¢آ·ط·آ¢ط¢آ¢ط·آ·ط¢آ¢ط·آ¢ط¢آ½ط·آ·ط¢آ·ط·آ¢ط¢آ·ط·آ·ط¢آ¢ط·آ¢ط¢آ·ط·آ·ط¢آ·ط·آ¢ط¢آ¢ط·آ·ط¢آ¢ط·آ¢ط¢آ·ط·آ·ط¢آ·ط·آ¢ط¢آ·ط·آ·ط¢آ¢ط·آ¢ط¢آ¢ط·آ·ط¢آ·ط·آ¢ط¢آ¢ط·آ·ط¢آ¢ط·آ¢ط¢آ£ط·آ·ط¢آ·ط·آ¢ط¢آ·ط·آ·ط¢آ¢ط·آ¢ط¢آ·ط·آ·ط¢آ·ط·آ¢ط¢آ¢ط·آ·ط¢آ¢ط·آ¢ط¢آ¢ط·آ·ط¢آ·ط·آ¢ط¢آ·ط·آ·ط¢آ¢ط·آ¢ط¢آ¢ط·آ·ط¢آ·ط·آ¢ط¢آ¢ط·آ·ط¢آ¢ط·آ¢ط¢آ¯ط·آ·ط¢آ·ط·آ¢ط¢آ·ط·آ·ط¢آ¢ط·آ¢ط¢آ·ط·آ·ط¢آ·ط·آ¢ط¢آ¢ط·آ·ط¢آ¢ط·آ¢ط¢آ·ط·آ·ط¢آ·ط·آ¢ط¢آ·ط·آ·ط¢آ¢ط·آ¢ط¢آ¢ط·آ·ط¢آ·ط·آ¢ط¢آ¢ط·آ·ط¢آ¢ط·آ¢ط¢آ·ط·آ·ط¢آ·ط·آ¢ط¢آ·ط·آ·ط¢آ¢ط·آ¢ط¢آ·ط·آ·ط¢آ·ط·آ¢ط¢آ¢ط·آ·ط¢آ¢ط·آ¢ط¢آ¹ط·آ·ط¢آ·ط·آ¢ط¢آ·ط·آ·ط¢آ¢ط·آ¢ط¢آ·ط·آ·ط¢آ£ط·آ¢ط¢آ¢ط·آ£ط¢آ¢ط£آ¢أ¢â€ڑآ¬ط¹â€کط·آ¢ط¢آ¬ط·آ·ط¢آ·ط£آ¢أ¢â€ڑآ¬ط·â€؛ط·آ·ط¢آ·ط·آ¢ط¢آ·ط·آ·ط¢آ¢ط·آ¢ط¢آ·ط·آ·ط¢آ·ط·آ¢ط¢آ¢ط·آ·ط¢آ¢ط·آ¢ط¢آ·ط·آ·ط¢آ·ط·آ¢ط¢آ·ط·آ·ط¢آ¢ط·آ¢ط¢آ¢ط·آ·ط¢آ·ط·آ¢ط¢آ¢ط·آ·ط¢آ¢ط·آ¢ط¢آ¢ط·آ·ط¢آ·ط·آ¢ط¢آ·ط·آ·ط¢آ¢ط·آ¢ط¢آ·ط·آ·ط¢آ·ط·آ¢ط¢آ¢ط·آ·ط¢آ¢ط·آ¢ط¢آ¢ط·آ·ط¢آ·ط·آ¢ط¢آ·ط·آ·ط¢آ¢ط·آ¢ط¢آ¢ط·آ·ط¢آ·ط·آ¢ط¢آ¢ط·آ·ط¢آ¢ط·آ¢ط¢آ½ط·آ·ط¢آ·ط·آ¢ط¢آ·ط·آ·ط¢آ¢ط·آ¢ط¢آ·ط·آ·ط¢آ·ط·آ¢ط¢آ¢ط·آ·ط¢آ¢ط·آ¢ط¢آ·ط·آ·ط¢آ·ط·آ¢ط¢آ·ط·آ·ط¢آ¢ط·آ¢ط¢آ¢ط·آ·ط¢آ·ط·آ¢ط¢آ¢ط·آ·ط¢آ¢ط·آ¢ط¢آ£ط·آ·ط¢آ·ط·آ¢ط¢آ·ط·آ·ط¢آ¢ط·آ¢ط¢آ·ط·آ·ط¢آ·ط·آ¢ط¢آ¢ط·آ·ط¢آ¢ط·آ¢ط¢آ¢ط·آ·ط¢آ·ط·آ¢ط¢آ·ط·آ·ط¢آ¢ط·آ¢ط¢آ¢ط·آ·ط¢آ·ط·آ¢ط¢آ¢ط·آ·ط¢آ¢ط·آ¢ط¢آ¯ط·آ·ط¢آ·ط·آ¢ط¢آ·ط·آ·ط¢آ¢ط·آ¢ط¢آ·ط·آ·ط¢آ·ط·آ¢ط¢آ¢ط·آ·ط¢آ¢ط·آ¢ط¢آ·ط·آ·ط¢آ·ط·آ¢ط¢آ·ط·آ·ط¢آ¢ط·آ¢ط¢آ¢ط·آ·ط¢آ·ط·آ¢ط¢آ¢ط·آ·ط¢آ¢ط·آ¢ط¢آ·ط·آ·ط¢آ·ط·آ¢ط¢آ·ط·آ·ط¢آ¢ط·آ¢ط¢آ·ط·آ·ط¢آ·ط·آ¢ط¢آ¢ط·آ·ط¢آ¢ط·آ¢ط¢آ¹ط·آ·ط¢آ·ط·آ¢ط¢آ·ط·آ·ط¢آ¢ط·آ¢ط¢آ·ط·آ·ط¢آ£ط·آ¢ط¢آ¢ط·آ£ط¢آ¢ط£آ¢أ¢â€ڑآ¬ط¹â€کط·آ¢ط¢آ¬ط·آ·ط¢آ·ط£آ¢أ¢â€ڑآ¬ط·â€؛ط·آ·ط¢آ·ط·آ¢ط¢آ·ط·آ·ط¢آ¢ط·آ¢ط¢آ·ط·آ·ط¢آ·ط·آ¢ط¢آ¢ط·آ·ط¢آ¢ط·آ¢ط¢آ·ط·آ·ط¢آ·ط·آ¢ط¢آ·ط·آ·ط¢آ¢ط·آ¢ط¢آ¢ط·آ·ط¢آ·ط·آ¢ط¢آ¢ط·آ·ط¢آ¢ط·آ¢ط¢آ¢ط·آ·ط¢آ·ط·آ¢ط¢آ·ط·آ·ط¢آ¢ط·آ¢ط¢آ·ط·آ·ط¢آ·ط·آ¢ط¢آ¢ط·آ·ط¢آ¢ط·آ¢ط¢آ¢ط·آ·ط¢آ·ط·آ¢ط¢آ·ط·آ·ط¢آ¢ط·آ¢ط¢آ¢ط·آ·ط¢آ·ط·آ¢ط¢آ¢ط·آ·ط¢آ¢ط·آ¢ط¢آ½ ط·آ·ط¢آ·ط·آ¢ط¢آ·ط·آ·ط¢آ¢ط·آ¢ط¢آ·ط·آ·ط¢آ·ط·آ¢ط¢آ¢ط·آ·ط¢آ¢ط·آ¢ط¢آ·ط·آ·ط¢آ·ط·آ¢ط¢آ·ط·آ·ط¢آ¢ط·آ¢ط¢آ¢ط·آ·ط¢آ·ط·آ¢ط¢آ¢ط·آ·ط¢آ¢ط·آ¢ط¢آ£ط·آ·ط¢آ·ط·آ¢ط¢آ·ط·آ·ط¢آ¢ط·آ¢ط¢آ·ط·آ·ط¢آ·ط·آ¢ط¢آ¢ط·آ·ط¢آ¢ط·آ¢ط¢آ¢ط·آ·ط¢آ·ط·آ¢ط¢آ·ط·آ·ط¢آ¢ط·آ¢ط¢آ¢ط·آ·ط¢آ·ط·آ¢ط¢آ¢ط·آ·ط¢آ¢ط·آ¢ط¢آ¯ط·آ·ط¢آ·ط·آ¢ط¢آ·ط·آ·ط¢آ¢ط·آ¢ط¢آ·ط·آ·ط¢آ·ط·آ¢ط¢آ¢ط·آ·ط¢آ¢ط·آ¢ط¢آ·ط·آ·ط¢آ·ط·آ¢ط¢آ·ط·آ·ط¢آ¢ط·آ¢ط¢آ¢ط·آ·ط¢آ·ط·آ¢ط¢آ¢ط·آ·ط¢آ¢ط·آ¢ط¢آ·ط·آ·ط¢آ·ط·آ¢ط¢آ·ط·آ·ط¢آ¢ط·آ¢ط¢آ·ط·آ·ط¢آ·ط·آ¢ط¢آ¢ط·آ·ط¢آ¢ط·آ¢ط¢آ¹ط·آ·ط¢آ·ط·آ¢ط¢آ·ط·آ·ط¢آ¢ط·آ¢ط¢آ·ط·آ·ط¢آ£ط·آ¢ط¢آ¢ط·آ£ط¢آ¢ط£آ¢أ¢â€ڑآ¬ط¹â€کط·آ¢ط¢آ¬ط·آ·ط¢آ·ط£آ¢أ¢â€ڑآ¬ط·â€؛ط·آ·ط¢آ·ط·آ¢ط¢آ·ط·آ·ط¢آ¢ط·آ¢ط¢آ·ط·آ·ط¢آ·ط·آ¢ط¢آ¢ط·آ·ط¢آ¢ط·آ¢ط¢آ·ط·آ·ط¢آ·ط·آ¢ط¢آ·ط·آ·ط¢آ¢ط·آ¢ط¢آ¢ط·آ·ط¢آ·ط·آ¢ط¢آ¢ط·آ·ط¢آ¢ط·آ¢ط¢آ¢ط·آ·ط¢آ·ط·آ¢ط¢آ·ط·آ·ط¢آ¢ط·آ¢ط¢آ·ط·آ·ط¢آ·ط·آ¢ط¢آ¢ط·آ·ط¢آ¢ط·آ¢ط¢آ¢ط·آ·ط¢آ·ط·آ¢ط¢آ·ط·آ·ط¢آ¢ط·آ¢ط¢آ¢ط·آ·ط¢آ·ط·آ¢ط¢آ¢ط·آ·ط¢آ¢ط·آ¢ط¢آ½ط·آ·ط¢آ·ط·آ¢ط¢آ·ط·آ·ط¢آ¢ط·آ¢ط¢آ·ط·آ·ط¢آ·ط·آ¢ط¢آ¢ط·آ·ط¢آ¢ط·آ¢ط¢آ·ط·آ·ط¢آ·ط·آ¢ط¢آ·ط·آ·ط¢آ¢ط·آ¢ط¢آ¢ط·آ·ط¢آ·ط·آ¢ط¢آ¢ط·آ·ط¢آ¢ط·آ¢ط¢آ£ط·آ·ط¢آ·ط·آ¢ط¢آ·ط·آ·ط¢آ¢ط·آ¢ط¢آ·ط·آ·ط¢آ·ط·آ¢ط¢آ¢ط·آ·ط¢آ¢ط·آ¢ط¢آ¢ط·آ·ط¢آ·ط·آ¢ط¢آ·ط·آ·ط¢آ¢ط·آ¢ط¢آ¢ط·آ·ط¢آ·ط·آ¢ط¢آ¢ط·آ·ط¢آ¢ط·آ¢ط¢آ¯ط·آ·ط¢آ·ط·آ¢ط¢آ·ط·آ·ط¢آ¢ط·آ¢ط¢آ·ط·آ·ط¢آ·ط·آ¢ط¢آ¢ط·آ·ط¢آ¢ط·آ¢ط¢آ·ط·آ·ط¢آ·ط·آ¢ط¢آ·ط·آ·ط¢آ¢ط·آ¢ط¢آ¢ط·آ·ط¢آ·ط·آ¢ط¢آ¢ط·آ·ط¢آ¢ط·آ¢ط¢آ·ط·آ·ط¢آ·ط·آ¢ط¢آ·ط·آ·ط¢آ¢ط·آ¢ط¢آ·ط·آ·ط¢آ·ط·آ¢ط¢آ¢ط·آ·ط¢آ¢ط·آ¢ط¢آ¹ط·آ·ط¢آ·ط·آ¢ط¢آ·ط·آ·ط¢آ¢ط·آ¢ط¢آ·ط·آ·ط¢آ£ط·آ¢ط¢آ¢ط·آ£ط¢آ¢ط£آ¢أ¢â€ڑآ¬ط¹â€کط·آ¢ط¢آ¬ط·آ·ط¢آ·ط£آ¢أ¢â€ڑآ¬ط·â€؛ط·آ·ط¢آ·ط·آ¢ط¢آ·ط·آ·ط¢آ¢ط·آ¢ط¢آ·ط·آ·ط¢آ·ط·آ¢ط¢آ¢ط·آ·ط¢آ¢ط·آ¢ط¢آ·ط·آ·ط¢آ·ط·آ¢ط¢آ·ط·آ·ط¢آ¢ط·آ¢ط¢آ¢ط·آ·ط¢آ·ط·آ¢ط¢آ¢ط·آ·ط¢آ¢ط·آ¢ط¢آ¢ط·آ·ط¢آ·ط·آ¢ط¢آ·ط·آ·ط¢آ¢ط·آ¢ط¢آ·ط·آ·ط¢آ·ط·آ¢ط¢آ¢ط·آ·ط¢آ¢ط·آ¢ط¢آ¢ط·آ·ط¢آ·ط·آ¢ط¢آ·ط·آ·ط¢آ¢ط·آ¢ط¢آ¢ط·آ·ط¢آ·ط·آ¢ط¢آ¢ط·آ·ط¢آ¢ط·آ¢ط¢آ½ط·آ·ط¢آ·ط·آ¢ط¢آ·ط·آ·ط¢آ¢ط·آ¢ط¢آ·ط·آ·ط¢آ·ط·آ¢ط¢آ¢ط·آ·ط¢آ¢ط·آ¢ط¢آ·ط·آ·ط¢آ·ط·آ¢ط¢آ·ط·آ·ط¢آ¢ط·آ¢ط¢آ¢ط·آ·ط¢آ·ط·آ¢ط¢آ¢ط·آ·ط¢آ¢ط·آ¢ط¢آ£ط·آ·ط¢آ·ط·آ¢ط¢آ·ط·آ·ط¢آ¢ط·آ¢ط¢آ·ط·آ·ط¢آ·ط·آ¢ط¢آ¢ط·آ·ط¢آ¢ط·آ¢ط¢آ¢ط·آ·ط¢آ·ط·آ¢ط¢آ·ط·آ·ط¢آ¢ط·آ¢ط¢آ¢ط·آ·ط¢آ·ط·آ¢ط¢آ¢ط·آ·ط¢آ¢ط·آ¢ط¢آ¯ط·آ·ط¢آ·ط·آ¢ط¢آ·ط·آ·ط¢آ¢ط·آ¢ط¢آ·ط·آ·ط¢آ·ط·آ¢ط¢آ¢ط·آ·ط¢آ¢ط·آ¢ط¢آ·ط·آ·ط¢آ·ط·آ¢ط¢آ·ط·آ·ط¢آ¢ط·آ¢ط¢آ¢ط·آ·ط¢آ·ط·آ¢ط¢آ¢ط·آ·ط¢آ¢ط·آ¢ط¢آ·ط·آ·ط¢آ·ط·آ¢ط¢آ·ط·آ·ط¢آ¢ط·آ¢ط¢آ·ط·آ·ط¢آ·ط·آ¢ط¢آ¢ط·آ·ط¢آ¢ط·آ¢ط¢آ¹ط·آ·ط¢آ·ط·آ¢ط¢آ·ط·آ·ط¢آ¢ط·آ¢ط¢آ·ط·آ·ط¢آ£ط·آ¢ط¢آ¢ط·آ£ط¢آ¢ط£آ¢أ¢â€ڑآ¬ط¹â€کط·آ¢ط¢آ¬ط·آ·ط¢آ·ط£آ¢أ¢â€ڑآ¬ط·â€؛ط·آ·ط¢آ·ط·آ¢ط¢آ·ط·آ·ط¢آ¢ط·آ¢ط¢آ·ط·آ·ط¢آ·ط·آ¢ط¢آ¢ط·آ·ط¢آ¢ط·آ¢ط¢آ·ط·آ·ط¢آ·ط·آ¢ط¢آ·ط·آ·ط¢آ¢ط·آ¢ط¢آ¢ط·آ·ط¢آ·ط·آ¢ط¢آ¢ط·آ·ط¢آ¢ط·آ¢ط¢آ¢ط·آ·ط¢آ·ط·آ¢ط¢آ·ط·آ·ط¢آ¢ط·آ¢ط¢آ·ط·آ·ط¢آ·ط·آ¢ط¢آ¢ط·آ·ط¢آ¢ط·آ¢ط¢آ¢ط·آ·ط¢آ·ط·آ¢ط¢آ·ط·آ·ط¢آ¢ط·آ¢ط¢آ¢ط·آ·ط¢آ·ط·آ¢ط¢آ¢ط·آ·ط¢آ¢ط·آ¢ط¢آ½ ط·آ·ط¢آ·ط·آ¢ط¢آ·ط·آ·ط¢آ¢ط·آ¢ط¢آ·ط·آ·ط¢آ·ط·آ¢ط¢آ¢ط·آ·ط¢آ¢ط·آ¢ط¢آ·ط·آ·ط¢آ·ط·آ¢ط¢آ·ط·آ·ط¢آ¢ط·آ¢ط¢آ¢ط·آ·ط¢آ·ط·آ¢ط¢آ¢ط·آ·ط¢آ¢ط·آ¢ط¢آ£ط·آ·ط¢آ·ط·آ¢ط¢آ·ط·آ·ط¢آ¢ط·آ¢ط¢آ·ط·آ·ط¢آ·ط·آ¢ط¢آ¢ط·آ·ط¢آ¢ط·آ¢ط¢آ¢ط·آ·ط¢آ·ط·آ¢ط¢آ·ط·آ·ط¢آ¢ط·آ¢ط¢آ¢ط·آ·ط¢آ·ط·آ¢ط¢آ¢ط·آ·ط¢آ¢ط·آ¢ط¢آ¯ط·آ·ط¢آ·ط·آ¢ط¢آ·ط·آ·ط¢آ¢ط·آ¢ط¢آ·ط·آ·ط¢آ·ط·آ¢ط¢آ¢ط·آ·ط¢آ¢ط·آ¢ط¢آ·ط·آ·ط¢آ·ط·آ¢ط¢آ·ط·آ·ط¢آ¢ط·آ¢ط¢آ¢ط·آ·ط¢آ·ط·آ¢ط¢آ¢ط·آ·ط¢آ¢ط·آ¢ط¢آ·ط·آ·ط¢آ·ط·آ¢ط¢آ·ط·آ·ط¢آ¢ط·آ¢ط¢آ·ط·آ·ط¢آ·ط·آ¢ط¢آ¢ط·آ·ط¢آ¢ط·آ¢ط¢آ¹ط·آ·ط¢آ·ط·آ¢ط¢آ·ط·آ·ط¢آ¢ط·آ¢ط¢آ·ط·آ·ط¢آ£ط·آ¢ط¢آ¢ط·آ£ط¢آ¢ط£آ¢أ¢â€ڑآ¬ط¹â€کط·آ¢ط¢آ¬ط·آ·ط¢آ·ط£آ¢أ¢â€ڑآ¬ط·â€؛ط·آ·ط¢آ·ط·آ¢ط¢آ·ط·آ·ط¢آ¢ط·آ¢ط¢آ·ط·آ·ط¢آ·ط·آ¢ط¢آ¢ط·آ·ط¢آ¢ط·آ¢ط¢آ·ط·آ·ط¢آ·ط·آ¢ط¢آ·ط·آ·ط¢آ¢ط·آ¢ط¢آ¢ط·آ·ط¢آ·ط·آ¢ط¢آ¢ط·آ·ط¢آ¢ط·آ¢ط¢آ¢ط·آ·ط¢آ·ط·آ¢ط¢آ·ط·آ·ط¢آ¢ط·آ¢ط¢آ·ط·آ·ط¢آ·ط·آ¢ط¢آ¢ط·آ·ط¢آ¢ط·آ¢ط¢آ¢ط·آ·ط¢آ·ط·آ¢ط¢آ·ط·آ·ط¢آ¢ط·آ¢ط¢آ¢ط·آ·ط¢آ·ط·آ¢ط¢آ¢ط·آ·ط¢آ¢ط·آ¢ط¢آ½ط·آ·ط¢آ·ط·آ¢ط¢آ·ط·آ·ط¢آ¢ط·آ¢ط¢آ·ط·آ·ط¢آ·ط·آ¢ط¢آ¢ط·آ·ط¢آ¢ط·آ¢ط¢آ·ط·آ·ط¢آ·ط·آ¢ط¢آ·ط·آ·ط¢آ¢ط·آ¢ط¢آ¢ط·آ·ط¢آ·ط·آ¢ط¢آ¢ط·آ·ط¢آ¢ط·آ¢ط¢آ£ط·آ·ط¢آ·ط·آ¢ط¢آ·ط·آ·ط¢آ¢ط·آ¢ط¢آ·ط·آ·ط¢آ·ط·آ¢ط¢آ¢ط·آ·ط¢آ¢ط·آ¢ط¢آ¢ط·آ·ط¢آ·ط·آ¢ط¢آ·ط·آ·ط¢آ¢ط·آ¢ط¢آ¢ط·آ·ط¢آ·ط·آ¢ط¢آ¢ط·آ·ط¢آ¢ط·آ¢ط¢آ¯ط·آ·ط¢آ·ط·آ¢ط¢آ·ط·آ·ط¢آ¢ط·آ¢ط¢آ·ط·آ·ط¢آ·ط·آ¢ط¢آ¢ط·آ·ط¢آ¢ط·آ¢ط¢آ·ط·آ·ط¢آ·ط·آ¢ط¢آ·ط·آ·ط¢آ¢ط·آ¢ط¢آ¢ط·آ·ط¢آ·ط·آ¢ط¢آ¢ط·آ·ط¢آ¢ط·آ¢ط¢آ·ط·آ·ط¢آ·ط·آ¢ط¢آ·ط·آ·ط¢آ¢ط·آ¢ط¢آ·ط·آ·ط¢آ·ط·آ¢ط¢آ¢ط·آ·ط¢آ¢ط·آ¢ط¢آ¹ط·آ·ط¢آ·ط·آ¢ط¢آ·ط·آ·ط¢آ¢ط·آ¢ط¢آ·ط·آ·ط¢آ£ط·آ¢ط¢آ¢ط·آ£ط¢آ¢ط£آ¢أ¢â€ڑآ¬ط¹â€کط·آ¢ط¢آ¬ط·آ·ط¢آ·ط£آ¢أ¢â€ڑآ¬ط·â€؛ط·آ·ط¢آ·ط·آ¢ط¢آ·ط·آ·ط¢آ¢ط·آ¢ط¢آ·ط·آ·ط¢آ·ط·آ¢ط¢آ¢ط·آ·ط¢آ¢ط·آ¢ط¢آ·ط·آ·ط¢آ·ط·آ¢ط¢آ·ط·آ·ط¢آ¢ط·آ¢ط¢آ¢ط·آ·ط¢آ·ط·آ¢ط¢آ¢ط·آ·ط¢آ¢ط·آ¢ط¢آ¢ط·آ·ط¢آ·ط·آ¢ط¢آ·ط·آ·ط¢آ¢ط·آ¢ط¢آ·ط·آ·ط¢آ·ط·آ¢ط¢آ¢ط·آ·ط¢آ¢ط·آ¢ط¢آ¢ط·آ·ط¢آ·ط·آ¢ط¢آ·ط·آ·ط¢آ¢ط·آ¢ط¢آ¢ط·آ·ط¢آ·ط·آ¢ط¢آ¢ط·آ·ط¢آ¢ط·آ¢ط¢آ½ط·آ·ط¢آ·ط·آ¢ط¢آ·ط·آ·ط¢آ¢ط·آ¢ط¢آ·ط·آ·ط¢آ·ط·آ¢ط¢آ¢ط·آ·ط¢آ¢ط·آ¢ط¢آ·ط·آ·ط¢آ·ط·آ¢ط¢آ·ط·آ·ط¢آ¢ط·آ¢ط¢آ¢ط·آ·ط¢آ·ط·آ¢ط¢آ¢ط·آ·ط¢آ¢ط·آ¢ط¢آ£ط·آ·ط¢آ·ط·آ¢ط¢آ·ط·آ·ط¢آ¢ط·آ¢ط¢آ·ط·آ·ط¢آ·ط·آ¢ط¢آ¢ط·آ·ط¢آ¢ط·آ¢ط¢آ¢ط·آ·ط¢آ·ط·آ¢ط¢آ·ط·آ·ط¢آ¢ط·آ¢ط¢آ¢ط·آ·ط¢آ·ط·آ¢ط¢آ¢ط·آ·ط¢آ¢ط·آ¢ط¢آ¯ط·آ·ط¢آ·ط·آ¢ط¢آ·ط·آ·ط¢آ¢ط·آ¢ط¢آ·ط·آ·ط¢آ·ط·آ¢ط¢آ¢ط·آ·ط¢آ¢ط·آ¢ط¢آ·ط·آ·ط¢آ·ط·آ¢ط¢آ·ط·آ·ط¢آ¢ط·آ¢ط¢آ¢ط·آ·ط¢آ·ط·آ¢ط¢آ¢ط·آ·ط¢آ¢ط·آ¢ط¢آ·ط·آ·ط¢آ·ط·آ¢ط¢آ·ط·آ·ط¢آ¢ط·آ¢ط¢آ·ط·آ·ط¢آ·ط·آ¢ط¢آ¢ط·آ·ط¢آ¢ط·آ¢ط¢آ¹ط·آ·ط¢آ·ط·آ¢ط¢آ·ط·آ·ط¢آ¢ط·آ¢ط¢آ·ط·آ·ط¢آ£ط·آ¢ط¢آ¢ط·آ£ط¢آ¢ط£آ¢أ¢â€ڑآ¬ط¹â€کط·آ¢ط¢آ¬ط·آ·ط¢آ·ط£آ¢أ¢â€ڑآ¬ط·â€؛ط·آ·ط¢آ·ط·آ¢ط¢آ·ط·آ·ط¢آ¢ط·آ¢ط¢آ·ط·آ·ط¢آ·ط·آ¢ط¢آ¢ط·آ·ط¢آ¢ط·آ¢ط¢آ·ط·آ·ط¢آ·ط·آ¢ط¢آ·ط·آ·ط¢آ¢ط·آ¢ط¢آ¢ط·آ·ط¢آ·ط·آ¢ط¢آ¢ط·آ·ط¢آ¢ط·آ¢ط¢آ¢ط·آ·ط¢آ·ط·آ¢ط¢آ·ط·آ·ط¢آ¢ط·آ¢ط¢آ·ط·آ·ط¢آ·ط·آ¢ط¢آ¢ط·آ·ط¢آ¢ط·آ¢ط¢آ¢ط·آ·ط¢آ·ط·آ¢ط¢آ·ط·آ·ط¢آ¢ط·آ¢ط¢آ¢ط·آ·ط¢آ·ط·آ¢ط¢آ¢ط·آ·ط¢آ¢ط·آ¢ط¢آ½ 5 |
| `resignationFactor` | `Decimal` | @map("resignation_factor") @db.Decimal(5, 4) // 0.33 / 0.67 / 1.00 |
| `unpaidVacationAmount` | `Decimal` | @map("unpaid_vacation_amount") @db.Decimal(15, 2) |
| `unpaidOvertimeAmount` | `Decimal` | @map("unpaid_overtime_amount") @db.Decimal(15, 2) |
| `outstandingLoanAmount` | `Decimal` | @map("outstanding_loan_amount") @db.Decimal(15, 2) |
| `totalEOS` | `Decimal` | @map("total_eos") @db.Decimal(15, 2) |
| `netSettlement` | `Decimal` | @map("net_settlement") @db.Decimal(15, 2) |
| `status` | `String` | @default("DRAFT") // DRAFT, APPROVED, PAID |
| `journalEntryId` | `Int?` | @map("journal_entry_id") |
| `approvedBy` | `Int?` | @map("approved_by") |
| `approvedAt` | `DateTime?` | @map("approved_at") |
| `paidAt` | `DateTime?` | @map("paid_at") |
| `createdAt` | `DateTime` | @default(now()) @map("created_at") |
| `updatedAt` | `DateTime` | @updatedAt @map("updated_at") |

## Model: `PayrollRun`
| الحقل | النوع | الوصف |
|---|---|---|
| `id` | `Int` | @id @default(autoincrement()) |
| `tenantId` | `String` | @default("default") @map("tenant_id") |
| `month` | `Int` |  |
| `year` | `Int` |  |
| `runDate` | `DateTime` | @default(now()) @map("run_date") |
| `totalAmount` | `Decimal` | @map("total_amount") @db.Decimal(18, 2) |
| `status` | `String` | @default("DRAFT") // DRAFT, APPROVED, PAID |
| `approvedBy` | `Int?` | @map("approved_by") |
| `journalEntryId` | `Int?` | @map("journal_entry_id") |
| `wpsBatches` | `WPSBatch[]` |  |
| `gosiContributions` | `GOSIContribution[]` |  |

## Model: `WPSBatch`
| الحقل | النوع | الوصف |
|---|---|---|
| `id` | `Int` | @id @default(autoincrement()) |
| `tenantId` | `String` | @default("default") @map("tenant_id") |
| `payrollRunId` | `Int` | @map("payroll_run_id") |
| `payrollRun` | `PayrollRun` | @relation(fields: [payrollRunId], references: [id]) |
| `bankCode` | `String` | @map("bank_code") // SAR, NCB, RJHI, etc. |
| `batchNumber` | `String` | @unique @map("batch_number") |
| `totalAmount` | `Decimal` | @map("total_amount") @db.Decimal(18, 2) |
| `totalEmployees` | `Int` | @map("total_employees") |
| `fileFormat` | `String` | @default("SIF_V2") @map("file_format") |
| `fileContent` | `String?` | @map("file_content") @db.Text // generated SIF text |
| `fileGeneratedAt` | `DateTime?` | @map("file_generated_at") |
| `uploadedAt` | `DateTime?` | @map("uploaded_at") |
| `status` | `String` | @default("PENDING") // PENDING, GENERATED, UPLOADED, ACCEPTED, REJECTED |
| `rejectionReason` | `String?` | @map("rejection_reason") |
| `items` | `WPSBatchItem[]` |  |

## Model: `WPSBatchItem`
| الحقل | النوع | الوصف |
|---|---|---|
| `id` | `Int` | @id @default(autoincrement()) |
| `tenantId` | `String` | @default("default") @map("tenant_id") |
| `batchId` | `Int` | @map("batch_id") |
| `batch` | `WPSBatch` | @relation(fields: [batchId], references: [id]) |
| `employeeId` | `Int` | @map("employee_id") |
| `employee` | `Employee` | @relation(fields: [employeeId], references: [id]) |
| `iban` | `String` | // IBAN ط·آ·ط¢آ·ط·آ¢ط¢آ·ط·آ·ط¢آ¢ط·آ¢ط¢آ·ط·آ·ط¢آ·ط·آ¢ط¢آ¢ط·آ·ط¢آ¢ط·آ¢ط¢آ·ط·آ·ط¢آ·ط·آ¢ط¢آ·ط·آ·ط¢آ¢ط·آ¢ط¢آ¢ط·آ·ط¢آ·ط·آ¢ط¢آ¢ط·آ·ط¢آ¢ط·آ¢ط¢آ£ط·آ·ط¢آ·ط·آ¢ط¢آ·ط·آ·ط¢آ¢ط·آ¢ط¢آ·ط·آ·ط¢آ·ط·آ¢ط¢آ¢ط·آ·ط¢آ¢ط·آ¢ط¢آ¢ط·آ·ط¢آ·ط·آ¢ط¢آ·ط·آ·ط¢آ¢ط·آ¢ط¢آ¢ط·آ·ط¢آ·ط·آ¢ط¢آ¢ط·آ·ط¢آ¢ط·آ¢ط¢آ¯ط·آ·ط¢آ·ط·آ¢ط¢آ·ط·آ·ط¢آ¢ط·آ¢ط¢آ·ط·آ·ط¢آ·ط·آ¢ط¢آ¢ط·آ·ط¢آ¢ط·آ¢ط¢آ·ط·آ·ط¢آ·ط·آ¢ط¢آ·ط·آ·ط¢آ¢ط·آ¢ط¢آ¢ط·آ·ط¢آ·ط·آ¢ط¢آ¢ط·آ·ط¢آ¢ط·آ¢ط¢آ·ط·آ·ط¢آ·ط·آ¢ط¢آ·ط·آ·ط¢آ¢ط·آ¢ط¢آ·ط·آ·ط¢آ·ط·آ¢ط¢آ¢ط·آ·ط¢آ¢ط·آ¢ط¢آ¹ط·آ·ط¢آ·ط·آ¢ط¢آ·ط·آ·ط¢آ¢ط·آ¢ط¢آ·ط·آ·ط¢آ£ط·آ¢ط¢آ¢ط·آ£ط¢آ¢ط£آ¢أ¢â€ڑآ¬ط¹â€کط·آ¢ط¢آ¬ط·آ·ط¢آ·ط£آ¢أ¢â€ڑآ¬ط·â€؛ط·آ·ط¢آ·ط·آ¢ط¢آ·ط·آ·ط¢آ¢ط·آ¢ط¢آ·ط·آ·ط¢آ·ط·آ¢ط¢آ¢ط·آ·ط¢آ¢ط·آ¢ط¢آ·ط·آ·ط¢آ·ط·آ¢ط¢آ·ط·آ·ط¢آ¢ط·آ¢ط¢آ¢ط·آ·ط¢آ·ط·آ¢ط¢آ¢ط·آ·ط¢آ¢ط·آ¢ط¢آ¢ط·آ·ط¢آ·ط·آ¢ط¢آ·ط·آ·ط¢آ¢ط·آ¢ط¢آ·ط·آ·ط¢آ·ط·آ¢ط¢آ¢ط·آ·ط¢آ¢ط·آ¢ط¢آ¢ط·آ·ط¢آ·ط·آ¢ط¢آ·ط·آ·ط¢آ¢ط·آ¢ط¢آ¢ط·آ·ط¢آ·ط·آ¢ط¢آ¢ط·آ·ط¢آ¢ط·آ¢ط¢آ½ط·آ·ط¢آ·ط·آ¢ط¢آ·ط·آ·ط¢آ¢ط·آ¢ط¢آ·ط·آ·ط¢آ·ط·آ¢ط¢آ¢ط·آ·ط¢آ¢ط·آ¢ط¢آ·ط·آ·ط¢آ·ط·آ¢ط¢آ·ط·آ·ط¢آ¢ط·آ¢ط¢آ¢ط·آ·ط¢آ·ط·آ¢ط¢آ¢ط·آ·ط¢آ¢ط·آ¢ط¢آ£ط·آ·ط¢آ·ط·آ¢ط¢آ·ط·آ·ط¢آ¢ط·آ¢ط¢آ·ط·آ·ط¢آ·ط·آ¢ط¢آ¢ط·آ·ط¢آ¢ط·آ¢ط¢آ¢ط·آ·ط¢آ·ط·آ¢ط¢آ·ط·آ·ط¢آ¢ط·آ¢ط¢آ¢ط·آ·ط¢آ·ط·آ¢ط¢آ¢ط·آ·ط¢آ¢ط·آ¢ط¢آ¯ط·آ·ط¢آ·ط·آ¢ط¢آ·ط·آ·ط¢آ¢ط·آ¢ط¢آ·ط·آ·ط¢آ·ط·آ¢ط¢آ¢ط·آ·ط¢آ¢ط·آ¢ط¢آ·ط·آ·ط¢آ·ط·آ¢ط¢آ·ط·آ·ط¢آ¢ط·آ¢ط¢آ¢ط·آ·ط¢آ·ط·آ¢ط¢آ¢ط·آ·ط¢آ¢ط·آ¢ط¢آ·ط·آ·ط¢آ·ط·آ¢ط¢آ·ط·آ·ط¢آ¢ط·آ¢ط¢آ·ط·آ·ط¢آ·ط·آ¢ط¢آ¢ط·آ·ط¢آ¢ط·آ¢ط¢آ¹ط·آ·ط¢آ·ط·آ¢ط¢آ·ط·آ·ط¢آ¢ط·آ¢ط¢آ·ط·آ·ط¢آ£ط·آ¢ط¢آ¢ط·آ£ط¢آ¢ط£آ¢أ¢â€ڑآ¬ط¹â€کط·آ¢ط¢آ¬ط·آ·ط¢آ·ط£آ¢أ¢â€ڑآ¬ط·â€؛ط·آ·ط¢آ·ط·آ¢ط¢آ·ط·آ·ط¢آ¢ط·آ¢ط¢آ·ط·آ·ط¢آ·ط·آ¢ط¢آ¢ط·آ·ط¢آ¢ط·آ¢ط¢آ·ط·آ·ط¢آ·ط·آ¢ط¢آ·ط·آ·ط¢آ¢ط·آ¢ط¢آ¢ط·آ·ط¢آ·ط·آ¢ط¢آ¢ط·آ·ط¢آ¢ط·آ¢ط¢آ¢ط·آ·ط¢آ·ط·آ¢ط¢آ·ط·آ·ط¢آ¢ط·آ¢ط¢آ·ط·آ·ط¢آ·ط·آ¢ط¢آ¢ط·آ·ط¢آ¢ط·آ¢ط¢آ¢ط·آ·ط¢آ·ط·آ¢ط¢آ·ط·آ·ط¢آ¢ط·آ¢ط¢آ¢ط·آ·ط¢آ·ط·آ¢ط¢آ¢ط·آ·ط¢آ¢ط·آ¢ط¢آ½ط·آ·ط¢آ·ط·آ¢ط¢آ·ط·آ·ط¢آ¢ط·آ¢ط¢آ·ط·آ·ط¢آ·ط·آ¢ط¢آ¢ط·آ·ط¢آ¢ط·آ¢ط¢آ·ط·آ·ط¢آ·ط·آ¢ط¢آ·ط·آ·ط¢آ¢ط·آ¢ط¢آ¢ط·آ·ط¢آ·ط·آ¢ط¢آ¢ط·آ·ط¢آ¢ط·آ¢ط¢آ£ط·آ·ط¢آ·ط·آ¢ط¢آ·ط·آ·ط¢آ¢ط·آ¢ط¢آ·ط·آ·ط¢آ·ط·آ¢ط¢آ¢ط·آ·ط¢آ¢ط·آ¢ط¢آ¢ط·آ·ط¢آ·ط·آ¢ط¢آ·ط·آ·ط¢آ¢ط·آ¢ط¢آ¢ط·آ·ط¢آ·ط·آ¢ط¢آ¢ط·آ·ط¢آ¢ط·آ¢ط¢آ¯ط·آ·ط¢آ·ط·آ¢ط¢آ·ط·آ·ط¢آ¢ط·آ¢ط¢آ·ط·آ·ط¢آ·ط·آ¢ط¢آ¢ط·آ·ط¢آ¢ط·آ¢ط¢آ·ط·آ·ط¢آ·ط·آ¢ط¢آ·ط·آ·ط¢آ¢ط·آ¢ط¢آ¢ط·آ·ط¢آ·ط·آ¢ط¢آ¢ط·آ·ط¢آ¢ط·آ¢ط¢آ·ط·آ·ط¢آ·ط·آ¢ط¢آ·ط·آ·ط¢آ¢ط·آ¢ط¢آ·ط·آ·ط¢آ·ط·آ¢ط¢آ¢ط·آ·ط¢آ¢ط·آ¢ط¢آ¹ط·آ·ط¢آ·ط·آ¢ط¢آ·ط·آ·ط¢آ¢ط·آ¢ط¢آ·ط·آ·ط¢آ£ط·آ¢ط¢آ¢ط·آ£ط¢آ¢ط£آ¢أ¢â€ڑآ¬ط¹â€کط·آ¢ط¢آ¬ط·آ·ط¢آ·ط£آ¢أ¢â€ڑآ¬ط·â€؛ط·آ·ط¢آ·ط·آ¢ط¢آ·ط·آ·ط¢آ¢ط·آ¢ط¢آ·ط·آ·ط¢آ·ط·آ¢ط¢آ¢ط·آ·ط¢آ¢ط·آ¢ط¢آ·ط·آ·ط¢آ·ط·آ¢ط¢آ·ط·آ·ط¢آ¢ط·آ¢ط¢آ¢ط·آ·ط¢آ·ط·آ¢ط¢آ¢ط·آ·ط¢آ¢ط·آ¢ط¢آ¢ط·آ·ط¢آ·ط·آ¢ط¢آ·ط·آ·ط¢آ¢ط·آ¢ط¢آ·ط·آ·ط¢آ·ط·آ¢ط¢آ¢ط·آ·ط¢آ¢ط·آ¢ط¢آ¢ط·آ·ط¢آ·ط·آ¢ط¢آ·ط·آ·ط¢آ¢ط·آ¢ط¢آ¢ط·آ·ط¢آ·ط·آ¢ط¢آ¢ط·آ·ط¢آ¢ط·آ¢ط¢آ½ط·آ·ط¢آ·ط·آ¢ط¢آ·ط·آ·ط¢آ¢ط·آ¢ط¢آ·ط·آ·ط¢آ·ط·آ¢ط¢آ¢ط·آ·ط¢آ¢ط·آ¢ط¢آ·ط·آ·ط¢آ·ط·آ¢ط¢آ·ط·آ·ط¢آ¢ط·آ¢ط¢آ¢ط·آ·ط¢آ·ط·آ¢ط¢آ¢ط·آ·ط¢آ¢ط·آ¢ط¢آ£ط·آ·ط¢آ·ط·آ¢ط¢آ·ط·آ·ط¢آ¢ط·آ¢ط¢آ·ط·آ·ط¢آ·ط·آ¢ط¢آ¢ط·آ·ط¢آ¢ط·آ¢ط¢آ¢ط·آ·ط¢آ·ط·آ¢ط¢آ·ط·آ·ط¢آ¢ط·آ¢ط¢آ¢ط·آ·ط¢آ·ط·آ¢ط¢آ¢ط·آ·ط¢آ¢ط·آ¢ط¢آ¯ط·آ·ط¢آ·ط·آ¢ط¢آ·ط·آ·ط¢آ¢ط·آ¢ط¢آ·ط·آ·ط¢آ·ط·آ¢ط¢آ¢ط·آ·ط¢آ¢ط·آ¢ط¢آ·ط·آ·ط¢آ·ط·آ¢ط¢آ·ط·آ·ط¢آ¢ط·آ¢ط¢آ¢ط·آ·ط¢آ·ط·آ¢ط¢آ¢ط·آ·ط¢آ¢ط·آ¢ط¢آ·ط·آ·ط¢آ·ط·آ¢ط¢آ·ط·آ·ط¢آ¢ط·آ¢ط¢آ·ط·آ·ط¢آ·ط·آ¢ط¢آ¢ط·آ·ط¢آ¢ط·آ¢ط¢آ¹ط·آ·ط¢آ·ط·آ¢ط¢آ·ط·آ·ط¢آ¢ط·آ¢ط¢آ·ط·آ·ط¢آ£ط·آ¢ط¢آ¢ط·آ£ط¢آ¢ط£آ¢أ¢â€ڑآ¬ط¹â€کط·آ¢ط¢آ¬ط·آ·ط¢آ·ط£آ¢أ¢â€ڑآ¬ط·â€؛ط·آ·ط¢آ·ط·آ¢ط¢آ·ط·آ·ط¢آ¢ط·آ¢ط¢آ·ط·آ·ط¢آ·ط·آ¢ط¢آ¢ط·آ·ط¢آ¢ط·آ¢ط¢آ·ط·آ·ط¢آ·ط·آ¢ط¢آ·ط·آ·ط¢آ¢ط·آ¢ط¢آ¢ط·آ·ط¢آ·ط·آ¢ط¢آ¢ط·آ·ط¢آ¢ط·آ¢ط¢آ¢ط·آ·ط¢آ·ط·آ¢ط¢آ·ط·آ·ط¢آ¢ط·آ¢ط¢آ·ط·آ·ط¢آ·ط·آ¢ط¢آ¢ط·آ·ط¢آ¢ط·آ¢ط¢آ¢ط·آ·ط¢آ·ط·آ¢ط¢آ·ط·آ·ط¢آ¢ط·آ¢ط¢آ¢ط·آ·ط¢آ·ط·آ¢ط¢آ¢ط·آ·ط¢آ¢ط·آ¢ط¢آ½ط·آ·ط¢آ·ط·آ¢ط¢آ·ط·آ·ط¢آ¢ط·آ¢ط¢آ·ط·آ·ط¢آ·ط·آ¢ط¢آ¢ط·آ·ط¢آ¢ط·آ¢ط¢آ·ط·آ·ط¢آ·ط·آ¢ط¢آ·ط·آ·ط¢آ¢ط·آ¢ط¢آ¢ط·آ·ط¢آ·ط·آ¢ط¢آ¢ط·آ·ط¢آ¢ط·آ¢ط¢آ£ط·آ·ط¢آ·ط·آ¢ط¢آ·ط·آ·ط¢آ¢ط·آ¢ط¢آ·ط·آ·ط¢آ·ط·آ¢ط¢آ¢ط·آ·ط¢آ¢ط·آ¢ط¢آ¢ط·آ·ط¢آ·ط·آ¢ط¢آ·ط·آ·ط¢آ¢ط·آ¢ط¢آ¢ط·آ·ط¢آ·ط·آ¢ط¢آ¢ط·آ·ط¢آ¢ط·آ¢ط¢آ¯ط·آ·ط¢آ·ط·آ¢ط¢آ·ط·آ·ط¢آ¢ط·آ¢ط¢آ·ط·آ·ط¢آ·ط·آ¢ط¢آ¢ط·آ·ط¢آ¢ط·آ¢ط¢آ·ط·آ·ط¢آ·ط·آ¢ط¢آ·ط·آ·ط¢آ¢ط·آ¢ط¢آ¢ط·آ·ط¢آ·ط·آ¢ط¢آ¢ط·آ·ط¢آ¢ط·آ¢ط¢آ·ط·آ·ط¢آ·ط·آ¢ط¢آ·ط·آ·ط¢آ¢ط·آ¢ط¢آ·ط·آ·ط¢آ·ط·آ¢ط¢آ¢ط·آ·ط¢آ¢ط·آ¢ط¢آ¹ط·آ·ط¢آ·ط·آ¢ط¢آ·ط·آ·ط¢آ¢ط·آ¢ط¢آ·ط·آ·ط¢آ£ط·آ¢ط¢آ¢ط·آ£ط¢آ¢ط£آ¢أ¢â€ڑآ¬ط¹â€کط·آ¢ط¢آ¬ط·آ·ط¢آ·ط£آ¢أ¢â€ڑآ¬ط·â€؛ط·آ·ط¢آ·ط·آ¢ط¢آ·ط·آ·ط¢آ¢ط·آ¢ط¢آ·ط·آ·ط¢آ·ط·آ¢ط¢آ¢ط·آ·ط¢آ¢ط·آ¢ط¢آ·ط·آ·ط¢آ·ط·آ¢ط¢آ·ط·آ·ط¢آ¢ط·آ¢ط¢آ¢ط·آ·ط¢آ·ط·آ¢ط¢آ¢ط·آ·ط¢آ¢ط·آ¢ط¢آ¢ط·آ·ط¢آ·ط·آ¢ط¢آ·ط·آ·ط¢آ¢ط·آ¢ط¢آ·ط·آ·ط¢آ·ط·آ¢ط¢آ¢ط·آ·ط¢آ¢ط·آ¢ط¢آ¢ط·آ·ط¢آ·ط·آ¢ط¢آ·ط·آ·ط¢آ¢ط·آ¢ط¢آ¢ط·آ·ط¢آ·ط·آ¢ط¢آ¢ط·آ·ط¢آ¢ط·آ¢ط¢آ½ط·آ·ط¢آ·ط·آ¢ط¢آ·ط·آ·ط¢آ¢ط·آ¢ط¢آ·ط·آ·ط¢آ·ط·آ¢ط¢آ¢ط·آ·ط¢آ¢ط·آ¢ط¢آ·ط·آ·ط¢آ·ط·آ¢ط¢آ·ط·آ·ط¢آ¢ط·آ¢ط¢آ¢ط·آ·ط¢آ·ط·آ¢ط¢آ¢ط·آ·ط¢آ¢ط·آ¢ط¢آ£ط·آ·ط¢آ·ط·آ¢ط¢آ·ط·آ·ط¢آ¢ط·آ¢ط¢آ·ط·آ·ط¢آ·ط·آ¢ط¢آ¢ط·آ·ط¢آ¢ط·آ¢ط¢آ¢ط·آ·ط¢آ·ط·آ¢ط¢آ·ط·آ·ط¢آ¢ط·آ¢ط¢آ¢ط·آ·ط¢آ·ط·آ¢ط¢آ¢ط·آ·ط¢آ¢ط·آ¢ط¢آ¯ط·آ·ط¢آ·ط·آ¢ط¢آ·ط·آ·ط¢آ¢ط·آ¢ط¢آ·ط·آ·ط¢آ·ط·آ¢ط¢آ¢ط·آ·ط¢آ¢ط·آ¢ط¢آ·ط·آ·ط¢آ·ط·آ¢ط¢آ·ط·آ·ط¢آ¢ط·آ¢ط¢آ¢ط·آ·ط¢آ·ط·آ¢ط¢آ¢ط·آ·ط¢آ¢ط·آ¢ط¢آ·ط·آ·ط¢آ·ط·آ¢ط¢آ·ط·آ·ط¢آ¢ط·آ¢ط¢آ·ط·آ·ط¢آ·ط·آ¢ط¢آ¢ط·آ·ط¢آ¢ط·آ¢ط¢آ¹ط·آ·ط¢آ·ط·آ¢ط¢آ·ط·آ·ط¢آ¢ط·آ¢ط¢آ·ط·آ·ط¢آ£ط·آ¢ط¢آ¢ط·آ£ط¢آ¢ط£آ¢أ¢â€ڑآ¬ط¹â€کط·آ¢ط¢آ¬ط·آ·ط¢آ·ط£آ¢أ¢â€ڑآ¬ط·â€؛ط·آ·ط¢آ·ط·آ¢ط¢آ·ط·آ·ط¢آ¢ط·آ¢ط¢آ·ط·آ·ط¢آ·ط·آ¢ط¢آ¢ط·آ·ط¢آ¢ط·آ¢ط¢آ·ط·آ·ط¢آ·ط·آ¢ط¢آ·ط·آ·ط¢آ¢ط·آ¢ط¢آ¢ط·آ·ط¢آ·ط·آ¢ط¢آ¢ط·آ·ط¢آ¢ط·آ¢ط¢آ¢ط·آ·ط¢آ·ط·آ¢ط¢آ·ط·آ·ط¢آ¢ط·آ¢ط¢آ·ط·آ·ط¢آ·ط·آ¢ط¢آ¢ط·آ·ط¢آ¢ط·آ¢ط¢آ¢ط·آ·ط¢آ·ط·آ¢ط¢آ·ط·آ·ط¢آ¢ط·آ¢ط¢آ¢ط·آ·ط¢آ·ط·آ¢ط¢آ¢ط·آ·ط¢آ¢ط·آ¢ط¢آ½ط·آ·ط¢آ·ط·آ¢ط¢آ·ط·آ·ط¢آ¢ط·آ¢ط¢آ·ط·آ·ط¢آ·ط·آ¢ط¢آ¢ط·آ·ط¢آ¢ط·آ¢ط¢آ·ط·آ·ط¢آ·ط·آ¢ط¢آ·ط·آ·ط¢آ¢ط·آ¢ط¢آ¢ط·آ·ط¢آ·ط·آ¢ط¢آ¢ط·آ·ط¢آ¢ط·آ¢ط¢آ£ط·آ·ط¢آ·ط·آ¢ط¢آ·ط·آ·ط¢آ¢ط·آ¢ط¢آ·ط·آ·ط¢آ·ط·آ¢ط¢آ¢ط·آ·ط¢آ¢ط·آ¢ط¢آ¢ط·آ·ط¢آ·ط·آ¢ط¢آ·ط·آ·ط¢آ¢ط·آ¢ط¢آ¢ط·آ·ط¢آ·ط·آ¢ط¢آ¢ط·آ·ط¢آ¢ط·آ¢ط¢آ¯ط·آ·ط¢آ·ط·آ¢ط¢آ·ط·آ·ط¢آ¢ط·آ¢ط¢آ·ط·آ·ط¢آ·ط·آ¢ط¢آ¢ط·آ·ط¢آ¢ط·آ¢ط¢آ·ط·آ·ط¢آ·ط·آ¢ط¢آ·ط·آ·ط¢آ¢ط·آ¢ط¢آ¢ط·آ·ط¢آ·ط·آ¢ط¢آ¢ط·آ·ط¢آ¢ط·آ¢ط¢آ·ط·آ·ط¢آ·ط·آ¢ط¢آ·ط·آ·ط¢آ¢ط·آ¢ط¢آ·ط·آ·ط¢آ·ط·آ¢ط¢آ¢ط·آ·ط¢آ¢ط·آ¢ط¢آ¹ط·آ·ط¢آ·ط·آ¢ط¢آ·ط·آ·ط¢آ¢ط·آ¢ط¢آ·ط·آ·ط¢آ£ط·آ¢ط¢آ¢ط·آ£ط¢آ¢ط£آ¢أ¢â€ڑآ¬ط¹â€کط·آ¢ط¢آ¬ط·آ·ط¢آ·ط£آ¢أ¢â€ڑآ¬ط·â€؛ط·آ·ط¢آ·ط·آ¢ط¢آ·ط·آ·ط¢آ¢ط·آ¢ط¢آ·ط·آ·ط¢آ·ط·آ¢ط¢آ¢ط·آ·ط¢آ¢ط·آ¢ط¢آ·ط·آ·ط¢آ·ط·آ¢ط¢آ·ط·آ·ط¢آ¢ط·آ¢ط¢آ¢ط·آ·ط¢آ·ط·آ¢ط¢آ¢ط·آ·ط¢آ¢ط·آ¢ط¢آ¢ط·آ·ط¢آ·ط·آ¢ط¢آ·ط·آ·ط¢آ¢ط·آ¢ط¢آ·ط·آ·ط¢آ·ط·آ¢ط¢آ¢ط·آ·ط¢آ¢ط·آ¢ط¢آ¢ط·آ·ط¢آ·ط·آ¢ط¢آ·ط·آ·ط¢آ¢ط·آ¢ط¢آ¢ط·آ·ط¢آ·ط·آ¢ط¢آ¢ط·آ·ط¢آ¢ط·آ¢ط¢آ½ |
| `basicSalary` | `Decimal` | @map("basic_salary") @db.Decimal(15, 2) |
| `housingAllowance` | `Decimal` | @map("housing_allowance") @db.Decimal(15, 2) |
| `otherAllowance` | `Decimal` | @map("other_allowance") @db.Decimal(15, 2) |
| `totalSalary` | `Decimal` | @map("total_salary") @db.Decimal(15, 2) |
| `paymentStatus` | `String` | @default("PENDING") @map("payment_status") |

## Model: `GOSIContribution`
| الحقل | النوع | الوصف |
|---|---|---|
| `id` | `Int` | @id @default(autoincrement()) |
| `tenantId` | `String` | @default("default") @map("tenant_id") |
| `employeeId` | `Int` | @map("employee_id") |
| `payrollRunId` | `Int` | @map("payroll_run_id") |
| `payrollRun` | `PayrollRun` | @relation(fields: [payrollRunId], references: [id]) |
| `contributionMonth` | `DateTime` | @map("contribution_month") |
| `isSaudi` | `Boolean` | @map("is_saudi") |
| `basicSalary` | `Decimal` | @map("basic_salary") @db.Decimal(15, 2) |
| `housingAllowance` | `Decimal` | @map("housing_allowance") @db.Decimal(15, 2) |
| `subjectWage` | `Decimal` | @map("subject_wage") @db.Decimal(15, 2) // bounded by min/max |
| `employeePensionAmount` | `Decimal` | @default(0) @map("employee_pension_amount") @db.Decimal(15, 2) // 9% |
| `employerPensionAmount` | `Decimal` | @default(0) @map("employer_pension_amount") @db.Decimal(15, 2) // 9% |
| `employeeSANEDAmount` | `Decimal` | @default(0) @map("employee_saned_amount") @db.Decimal(15, 2) // 1% |
| `employerSANEDAmount` | `Decimal` | @default(0) @map("employer_saned_amount") @db.Decimal(15, 2) // 1% |
| `occupationalHazardsAmount` | `Decimal` | @default(0) @map("occupational_hazards_amount") @db.Decimal(15, 2) // 1% or 2% |
| `totalEmployeeDeduction` | `Decimal` | @map("total_employee_deduction") @db.Decimal(15, 2) |
| `totalEmployerContribution` | `Decimal` | @map("total_employer_contribution") @db.Decimal(15, 2) |
| `totalAmount` | `Decimal` | @map("total_amount") @db.Decimal(15, 2) |
| `status` | `String` | @default("PENDING") // PENDING, GENERATED, SUBMITTED, PAID |
| `journalEntryId` | `Int?` | @map("journal_entry_id") |

## Model: `GOSIMonthlyFile`
| الحقل | النوع | الوصف |
|---|---|---|
| `id` | `Int` | @id @default(autoincrement()) |
| `tenantId` | `String` | @default("default") @map("tenant_id") |
| `month` | `DateTime` | @unique |
| `totalEmployees` | `Int` | @map("total_employees") |
| `totalEmployeeContribution` | `Decimal` | @map("total_employee_contribution") |
| `totalEmployerContribution` | `Decimal` | @map("total_employer_contribution") |
| `totalAmount` | `Decimal` | @map("total_amount") |
| `fileContent` | `String` | @map("file_content") @db.Text |
| `generatedAt` | `DateTime` | @map("generated_at") |
| `submittedAt` | `DateTime?` | @map("submitted_at") |
| `paidAt` | `DateTime?` | @map("paid_at") |
| `receiptNumber` | `String?` | @map("receipt_number") |

## Model: `ThreeWayMatch`
| الحقل | النوع | الوصف |
|---|---|---|
| `id` | `Int` | @id @default(autoincrement()) |
| `tenantId` | `String` | @default("default") @map("tenant_id") |
| `invoiceId` | `Int` | @unique @map("invoice_id") |
| `invoice` | `PurchaseInvoice` | @relation(fields: [invoiceId], references: [id]) |
| `purchaseOrderId` | `Int` | @map("purchase_order_id") |
| `purchaseOrder` | `PurchaseOrder` | @relation(fields: [purchaseOrderId], references: [id]) |
| `poTotalAmount` | `Decimal` | @map("po_total_amount") @db.Decimal(18, 2) |
| `poTotalQuantity` | `Decimal` | @map("po_total_quantity") @db.Decimal(18, 4) |
| `grnTotalAmount` | `Decimal` | @map("grn_total_amount") @db.Decimal(18, 2) |
| `grnTotalQuantity` | `Decimal` | @map("grn_total_quantity") @db.Decimal(18, 4) |
| `invoiceTotalAmount` | `Decimal` | @map("invoice_total_amount") @db.Decimal(18, 2) |
| `invoiceTotalQuantity` | `Decimal` | @map("invoice_total_quantity") @db.Decimal(18, 4) |
| `priceVariance` | `Decimal` | @map("price_variance") @db.Decimal(18, 2) |
| `priceVariancePercent` | `Decimal` | @map("price_variance_percent") @db.Decimal(8, 4) |
| `quantityVariance` | `Decimal` | @map("quantity_variance") @db.Decimal(18, 4) |
| `quantityVariancePercent` | `Decimal` | @map("quantity_variance_percent") @db.Decimal(8, 4) |
| `priceTolerancePercent` | `Decimal` | @map("price_tolerance_percent") @db.Decimal(8, 4) |
| `quantityTolerancePercent` | `Decimal` | @map("quantity_tolerance_percent") @db.Decimal(8, 4) |
| `matchStatus` | `String` | @map("match_status") // MATCHED, PRICE_HOLD, QTY_HOLD, BOTH_HOLD, MANUAL_REVIEW |
| `isWithinTolerance` | `Boolean` | @map("is_within_tolerance") |
| `paymentBlocked` | `Boolean` | @default(false) @map("payment_blocked") |
| `approvalRequestId` | `Int?` | @map("approval_request_id") |
| `matchedAt` | `DateTime` | @default(now()) @map("matched_at") |
| `resolvedBy` | `Int?` | @map("resolved_by") |
| `resolvedAt` | `DateTime?` | @map("resolved_at") |
| `resolutionNotes` | `String?` | @map("resolution_notes") |
| `lines` | `ThreeWayMatchLine[]` |  |

## Model: `ThreeWayMatchLine`
| الحقل | النوع | الوصف |
|---|---|---|
| `id` | `Int` | @id @default(autoincrement()) |
| `tenantId` | `String` | @default("default") @map("tenant_id") |
| `matchId` | `Int` | @map("match_id") |
| `match` | `ThreeWayMatch` | @relation(fields: [matchId], references: [id]) |
| `productId` | `Int` | @map("product_id") |
| `poQuantity` | `Decimal` | @map("po_quantity") @db.Decimal(18, 4) |
| `poUnitPrice` | `Decimal` | @map("po_unit_price") @db.Decimal(18, 4) |
| `grnQuantity` | `Decimal` | @map("grn_quantity") @db.Decimal(18, 4) |
| `invoiceQuantity` | `Decimal` | @map("invoice_quantity") @db.Decimal(18, 4) |
| `invoiceUnitPrice` | `Decimal` | @map("invoice_unit_price") @db.Decimal(18, 4) |
| `priceMatched` | `Boolean` | @map("price_matched") |
| `qtyMatched` | `Boolean` | @map("qty_matched") |

## Model: `TolerancePolicy`
| الحقل | النوع | الوصف |
|---|---|---|
| `id` | `Int` | @id @default(autoincrement()) |
| `tenantId` | `String` | @default("default") @map("tenant_id") |
| `name` | `String` |  |
| `appliesTo` | `String` | @map("applies_to") // VENDOR_CATEGORY, PRODUCT_CATEGORY, AMOUNT_RANGE |
| `priceTolerancePercent` | `Decimal` | @map("price_tolerance_percent") @db.Decimal(8, 4) |
| `quantityTolerancePercent` | `Decimal` | @map("quantity_tolerance_percent") @db.Decimal(8, 4) |
| `amountToleranceAbs` | `Decimal` | @map("amount_tolerance_abs") @db.Decimal(18, 2) |
| `isActive` | `Boolean` | @default(true) @map("is_active") |

## Model: `CashApplicationBatch`
| الحقل | النوع | الوصف |
|---|---|---|
| `id` | `Int` | @id @default(autoincrement()) |
| `tenantId` | `String` | @default("default") @map("tenant_id") |
| `customerId` | `Int` | @map("customer_id") |
| `paymentId` | `Int` | @map("payment_id") // ID from OpenItem |
| `totalReceived` | `Decimal` | @map("total_received") @db.Decimal(18, 2) |
| `totalApplied` | `Decimal` | @map("total_applied") @db.Decimal(18, 2) |
| `unappliedAmount` | `Decimal` | @map("unapplied_amount") @db.Decimal(18, 2) |
| `applicationMethod` | `String` | @map("application_method") // AUTO, MANUAL, AI |
| `appliedBy` | `Int` | @map("applied_by") |
| `appliedAt` | `DateTime` | @default(now()) @map("applied_at") |
| `applications` | `CashApplication[]` |  |

## Model: `CashApplication`
| الحقل | النوع | الوصف |
|---|---|---|
| `id` | `Int` | @id @default(autoincrement()) |
| `tenantId` | `String` | @default("default") @map("tenant_id") |
| `batchId` | `Int` | @map("batch_id") |
| `batch` | `CashApplicationBatch` | @relation(fields: [batchId], references: [id]) |
| `invoiceId` | `Int` | @map("invoice_id") // ID from OpenItem |
| `appliedAmount` | `Decimal` | @map("applied_amount") @db.Decimal(18, 2) |
| `discountTaken` | `Decimal` | @default(0) @map("discount_taken") @db.Decimal(18, 2) |
| `writeOffAmount` | `Decimal` | @default(0) @map("write_off_amount") @db.Decimal(18, 2) |
| `remainingInvoiceBalance` | `Decimal` | @map("remaining_invoice_balance") @db.Decimal(18, 2) |

## Model: `BOMVersion`
| الحقل | النوع | الوصف |
|---|---|---|
| `id` | `Int` | @id @default(autoincrement()) |
| `tenantId` | `String` | @default("default") @map("tenant_id") |
| `recipeId` | `Int` | @map("recipe_id") |
| `recipe` | `Recipe` | @relation(fields: [recipeId], references: [id]) |
| `versionNumber` | `String` | @map("version_number") |
| `effectiveFrom` | `DateTime` | @map("effective_from") |
| `effectiveTo` | `DateTime?` | @map("effective_to") |
| `status` | `String` | @default("DRAFT") // DRAFT, ACTIVE, OBSOLETE |
| `ecoFrom` | `EngineeringChangeOrder[]` | @relation("FromBOMVersion") |
| `ecoTo` | `EngineeringChangeOrder[]` | @relation("ToBOMVersion") |

## Model: `EngineeringChangeOrder`
| الحقل | النوع | الوصف |
|---|---|---|
| `id` | `Int` | @id @default(autoincrement()) |
| `tenantId` | `String` | @default("default") @map("tenant_id") |
| `ecoNumber` | `String` | @unique @map("eco_number") |
| `productId` | `Int` | @map("product_id") |
| `product` | `Product` | @relation(fields: [productId], references: [id]) |
| `fromBomVersionId` | `Int?` | @map("from_bom_version_id") |
| `fromBomVersion` | `BOMVersion?` | @relation("FromBOMVersion", fields: [fromBomVersionId], references: [id]) |
| `toBomVersionId` | `Int?` | @map("to_bom_version_id") |
| `toBomVersion` | `BOMVersion?` | @relation("ToBOMVersion", fields: [toBomVersionId], references: [id]) |
| `reason` | `String` | @db.Text |
| `status` | `String` | @default("PENDING") // PENDING, APPROVED, REJECTED, IMPLEMENTED |
| `effectiveDate` | `DateTime?` | @map("effective_date") |
| `requestedBy` | `Int` | @map("requested_by") |
| `requestedAt` | `DateTime` | @default(now()) @map("requested_at") |
| `approvedBy` | `Int?` | @map("approved_by") |
| `approvedAt` | `DateTime?` | @map("approved_at") |

## Model: `IfrsLeaseContract`
| الحقل | النوع | الوصف |
|---|---|---|
| `id` | `Int` | @id @default(autoincrement()) |
| `tenantId` | `String` | @default("default") @map("tenant_id") |
| `contractNumber` | `String` | @unique |
| `lessor` | `String` |  |
| `lessorContact` | `String?` |  |
| `lessorVendorId` | `Int?` |  |
| `lessorVendor` | `Customer?` | @relation(fields: [lessorVendorId], references: [id]) |
| `leaseClass` | `String` | // 'PROPERTY' | 'VEHICLE' | 'EQUIPMENT' | 'IT_EQUIPMENT' | 'FURNITURE' | 'OTHER' |
| `assetDescription` | `String` |  |
| `assetLocation` | `String?` |  |
| `startDate` | `DateTime` |  |
| `endDate` | `DateTime` |  |
| `termMonths` | `Int` |  |
| `hasExtensionOption` | `Boolean` | @default(false) |
| `extensionTerms` | `String?` |  |
| `exerciseOptionLikely` | `Boolean?` |  |
| `paymentAmount` | `Decimal` | @db.Decimal(20, 4) |
| `paymentFrequency` | `String` | @default("MONTHLY") // 'MONTHLY' | 'QUARTERLY' | 'SEMI_ANNUAL' | 'ANNUAL' |
| `paymentTiming` | `String` | @default("END") // 'BEGIN' (annuity due) | 'END' (ordinary) |
| `paymentDayOfMonth` | `Int` | @default(1) |
| `hasVariablePayments` | `Boolean` | @default(false) |
| `variablePaymentBasis` | `String?` | // 'INDEX' | 'USAGE' | 'PERFORMANCE' |
| `variablePaymentDescription` | `String?` |  |
| `currency` | `String` | @default("SAR") |
| `ibr` | `Decimal` | @db.Decimal(8, 4) // annual % |
| `ibrSource` | `String?` | // 'BANK_QUOTE' | 'MARKET_AVERAGE' | 'GOVERNMENT_BOND' |
| `ibrDate` | `DateTime?` |  |
| `initialDirectCosts` | `Decimal` | @default(0) @db.Decimal(20, 4) |
| `initialDirectCostsPaidAt` | `DateTime?` |  |
| `leaseIncentive` | `Decimal` | @default(0) @db.Decimal(20, 4) |
| `exemption` | `String?` | // 'SHORT_TERM' | 'LOW_VALUE' | null |
| `exemptionReason` | `String?` |  |
| `rouAccountId` | `Int` |  |
| `liabilityAccountId` | `Int` |  |
| `interestAccountId` | `Int` |  |
| `depreciationAccountId` | `Int` |  |
| `accumDepreciationAccountId` | `Int` |  |
| `cashAccountId` | `Int` |  |
| `expenseAccountId` | `Int?` | // for exempt leases |
| `pvOfPayments` | `Decimal?` | @db.Decimal(20, 4) |
| `rouAssetValue` | `Decimal?` | @db.Decimal(20, 4) |
| `liabilityValue` | `Decimal?` | @db.Decimal(20, 4) |
| `currentRouNbv` | `Decimal?` | @db.Decimal(20, 4) |
| `currentLiability` | `Decimal?` | @db.Decimal(20, 4) |
| `status` | `String` | @default("DRAFT") // 'DRAFT' | 'ACTIVE' | 'TERMINATED' | 'EXPIRED' | 'MODIFIED' | 'IMPAIRED' |
| `approvedAt` | `DateTime?` |  |
| `approvedByUserId` | `String?` |  |
| `initialJournalId` | `Int?` |  |
| `terminationJournalId` | `Int?` |  |
| `hasSublease` | `Boolean` | @default(false) |
| `createdByUserId` | `String` |  |
| `createdAt` | `DateTime` | @default(now()) |
| `updatedAt` | `DateTime` | @updatedAt |
| `schedule` | `IfrsLeaseSchedule?` |  |
| `modifications` | `IfrsLeaseModification[]` |  |
| `terminations` | `IfrsLeaseTermination[]` |  |
| `subleases` | `IfrsSublease[]` |  |
| `impairments` | `IfrsLeaseImpairment[]` |  |
| `variablePayments` | `IfrsVariableLeasePayment[]` |  |

## Model: `IfrsLeaseSchedule`
| الحقل | النوع | الوصف |
|---|---|---|
| `id` | `Int` | @id @default(autoincrement()) |
| `tenantId` | `String` | @default("default") @map("tenant_id") |
| `contractId` | `Int` | @unique |
| `contract` | `IfrsLeaseContract` | @relation(fields: [contractId], references: [id], onDelete: Cascade) |
| `generatedAt` | `DateTime` | @default(now()) |
| `isCurrent` | `Boolean` | @default(true) |
| `versionNumber` | `Int` | @default(1) |
| `totalPayments` | `Decimal` | @db.Decimal(20, 4) |
| `totalInterest` | `Decimal` | @db.Decimal(20, 4) |
| `pvAtGeneration` | `Decimal` | @db.Decimal(20, 4) |
| `lines` | `IfrsLeaseScheduleLine[]` |  |

## Model: `IfrsLeaseScheduleLine`
| الحقل | النوع | الوصف |
|---|---|---|
| `id` | `Int` | @id @default(autoincrement()) |
| `tenantId` | `String` | @default("default") @map("tenant_id") |
| `scheduleId` | `Int` |  |
| `schedule` | `IfrsLeaseSchedule` | @relation(fields: [scheduleId], references: [id], onDelete: Cascade) |
| `periodNumber` | `Int` |  |
| `periodDate` | `DateTime` |  |
| `openingLiability` | `Decimal` | @db.Decimal(20, 4) |
| `interestExpense` | `Decimal` | @db.Decimal(20, 4) |
| `payment` | `Decimal` | @db.Decimal(20, 4) |
| `principal` | `Decimal` | @db.Decimal(20, 4) |
| `closingLiability` | `Decimal` | @db.Decimal(20, 4) |
| `rouDepreciation` | `Decimal` | @db.Decimal(20, 4) |
| `rouOpeningNbv` | `Decimal` | @db.Decimal(20, 4) |
| `rouClosingNbv` | `Decimal` | @db.Decimal(20, 4) |
| `recognizedAt` | `DateTime?` |  |
| `interestJournalId` | `Int?` |  |
| `paymentJournalId` | `Int?` |  |
| `depreciationJournalId` | `Int?` |  |
| `variableComponent` | `Decimal?` | @db.Decimal(20, 4) |
| `notes` | `String?` |  |

## Model: `IfrsLeaseModification`
| الحقل | النوع | الوصف |
|---|---|---|
| `id` | `Int` | @id @default(autoincrement()) |
| `tenantId` | `String` | @default("default") @map("tenant_id") |
| `contractId` | `Int` |  |
| `contract` | `IfrsLeaseContract` | @relation(fields: [contractId], references: [id]) |
| `modificationDate` | `DateTime` |  |
| `modificationType` | `String` | // 'EXTENSION' | 'REDUCTION' | 'PAYMENT_CHANGE' | 'SCOPE_CHANGE' | 'IBR_CHANGE' |
| `oldPaymentAmount` | `Decimal?` | @db.Decimal(20, 4) |
| `newPaymentAmount` | `Decimal?` | @db.Decimal(20, 4) |
| `oldEndDate` | `DateTime?` |  |
| `newEndDate` | `DateTime?` |  |
| `oldIbr` | `Decimal?` | @db.Decimal(8, 4) |
| `newIbr` | `Decimal?` | @db.Decimal(8, 4) |
| `rouAdjustment` | `Decimal?` | @db.Decimal(20, 4) |
| `liabilityAdjustment` | `Decimal?` | @db.Decimal(20, 4) |
| `remeasurementJournalId` | `Int?` |  |
| `newScheduleId` | `Int?` |  |
| `reason` | `String` | @db.Text |
| `approvedByUserId` | `String?` |  |
| `approvedAt` | `DateTime?` |  |
| `createdByUserId` | `String` |  |
| `createdAt` | `DateTime` | @default(now()) |

## Model: `IfrsLeaseTermination`
| الحقل | النوع | الوصف |
|---|---|---|
| `id` | `Int` | @id @default(autoincrement()) |
| `tenantId` | `String` | @default("default") @map("tenant_id") |
| `contractId` | `Int` | @unique |
| `contract` | `IfrsLeaseContract` | @relation(fields: [contractId], references: [id]) |
| `terminationDate` | `DateTime` |  |
| `terminationType` | `String` | // 'EARLY_BY_LESSEE' | 'EARLY_BY_LESSOR' | 'EXPIRED' | 'MUTUAL' |
| `remainingLiability` | `Decimal` | @db.Decimal(20, 4) |
| `remainingRouNbv` | `Decimal` | @db.Decimal(20, 4) |
| `penaltyAmount` | `Decimal` | @default(0) @db.Decimal(20, 4) |
| `refundAmount` | `Decimal` | @default(0) @db.Decimal(20, 4) |
| `gainLoss` | `Decimal` | @db.Decimal(20, 4) |
| `terminationJournalId` | `Int` |  |
| `reason` | `String` | @db.Text |
| `createdByUserId` | `String` |  |
| `createdAt` | `DateTime` | @default(now()) |

## Model: `IfrsSublease`
| الحقل | النوع | الوصف |
|---|---|---|
| `id` | `Int` | @id @default(autoincrement()) |
| `tenantId` | `String` | @default("default") @map("tenant_id") |
| `mainLeaseId` | `Int` |  |
| `mainLease` | `IfrsLeaseContract` | @relation(fields: [mainLeaseId], references: [id]) |
| `sublessee` | `String` |  |
| `sublessorContractId` | `Int?` | // separate contract record |
| `type` | `String` | // 'OPERATING' | 'FINANCE' |
| `startDate` | `DateTime` |  |
| `endDate` | `DateTime` |  |
| `paymentAmount` | `Decimal` | @db.Decimal(20, 4) |
| `paymentFrequency` | `String` |  |
| `netInvestmentInLease` | `Decimal?` | @db.Decimal(20, 4) |
| `derecognitionJournalId` | `Int?` |  |
| `status` | `String` | @default("ACTIVE") |

## Model: `IfrsLeaseImpairment`
| الحقل | النوع | الوصف |
|---|---|---|
| `id` | `Int` | @id @default(autoincrement()) |
| `tenantId` | `String` | @default("default") @map("tenant_id") |
| `contractId` | `Int` |  |
| `contract` | `IfrsLeaseContract` | @relation(fields: [contractId], references: [id]) |
| `testDate` | `DateTime` |  |
| `carryingAmount` | `Decimal` | @db.Decimal(20, 4) |
| `recoverableAmount` | `Decimal` | @db.Decimal(20, 4) |
| `impairmentLoss` | `Decimal` | @db.Decimal(20, 4) |
| `reversal` | `Boolean` | @default(false) |
| `reversalReason` | `String?` |  |
| `evidence` | `String?` |  |
| `journalEntryId` | `Int` |  |
| `approvedByUserId` | `String?` |  |
| `createdByUserId` | `String` |  |
| `createdAt` | `DateTime` | @default(now()) |

## Model: `IfrsVariableLeasePayment`
| الحقل | النوع | الوصف |
|---|---|---|
| `id` | `Int` | @id @default(autoincrement()) |
| `tenantId` | `String` | @default("default") @map("tenant_id") |
| `contractId` | `Int` |  |
| `contract` | `IfrsLeaseContract` | @relation(fields: [contractId], references: [id]) |
| `periodDate` | `DateTime` |  |
| `amount` | `Decimal` | @db.Decimal(20, 4) |
| `basisDescription` | `String` | // "5 SAR per km ط·آ·ط¢آ·ط·آ¢ط¢آ·ط·آ·ط¢آ¢ط·آ¢ط¢آ·ط·آ·ط¢آ·ط·آ¢ط¢آ¢ط·آ·ط¢آ¢ط·آ¢ط¢آ·ط·آ·ط¢آ·ط·آ¢ط¢آ·ط·آ·ط¢آ¢ط·آ¢ط¢آ¢ط·آ·ط¢آ·ط·آ¢ط¢آ¢ط·آ·ط¢آ¢ط·آ¢ط¢آ·ط·آ·ط¢آ·ط·آ¢ط¢آ·ط·آ·ط¢آ¢ط·آ¢ط¢آ·ط·آ·ط¢آ·ط·آ¢ط¢آ¢ط·آ·ط¢آ¢ط·آ¢ط¢آ¢ط·آ·ط¢آ·ط·آ¢ط¢آ·ط·آ·ط¢آ¢ط·آ¢ط¢آ¢ط·آ·ط¢آ·ط·آ¢ط¢آ¢ط·آ·ط¢آ¢ط·آ¢ط¢آ£ط·آ·ط¢آ·ط·آ¢ط¢آ·ط·آ·ط¢آ¢ط·آ¢ط¢آ·ط·آ·ط¢آ·ط·آ¢ط¢آ¢ط·آ·ط¢آ¢ط·آ¢ط¢آ£ط·آ·ط¢آ·ط·آ¢ط¢آ·ط·آ·ط¢آ¢ط·آ¢ط¢آ¢ط·آ·ط¢آ·ط·آ¢ط¢آ¢ط·آ·ط¢آ¢ط·آ¢ط¢آ¢ط·آ·ط¢آ·ط·آ¢ط¢آ·ط·آ·ط¢آ¢ط·آ¢ط¢آ£ط·آ·ط¢آ·ط·آ¢ط¢آ¢ط·آ·ط¢آ¢ط·آ¢ط¢آ¢ط·آ·ط¢آ·ط·آ¢ط¢آ£ط·آ·ط¢آ¢ط·آ¢ط¢آ¢ط·آ·ط¢آ£ط·آ¢ط¢آ¢ط·آ£ط¢آ¢ط£آ¢أ¢â‚¬ع‘ط¢آ¬ط·آ¹أ¢â‚¬ع©ط·آ·ط¢آ¢ط·آ¢ط¢آ¬ط·آ·ط¢آ·ط·آ¢ط¢آ¹ط·آ£ط¢آ¢ط£آ¢أ¢â‚¬ع‘ط¢آ¬ط·آ¹ط¢آ©ط·آ·ط¢آ·ط·آ¢ط¢آ·ط·آ·ط¢آ¢ط·آ¢ط¢آ¢ط·آ·ط¢آ·ط·آ¢ط¢آ¢ط·آ·ط¢آ¢ط·آ¢ط¢آ¬ط·آ·ط¢آ·ط·آ¢ط¢آ·ط·آ·ط¢آ¢ط·آ¢ط¢آ£ط·آ·ط¢آ·ط·آ¢ط¢آ¢ط·آ·ط¢آ¢ط·آ¢ط¢آ¢ط·آ·ط¢آ·ط·آ¢ط¢آ£ط·آ·ط¢آ¢ط·آ¢ط¢آ¢ط·آ·ط¢آ£ط·آ¢ط¢آ¢ط·آ£ط¢آ¢ط£آ¢أ¢â€ڑآ¬ط¹â€کط·آ¢ط¢آ¬ط·آ·ط¢آ¹ط£آ¢أ¢â€ڑآ¬ط¹آ©ط·آ·ط¢آ·ط·آ¢ط¢آ¢ط·آ·ط¢آ¢ط·آ¢ط¢آ¬ط·آ·ط¢آ·ط·آ¢ط¢آ£ط·آ·ط¢آ¢ط·آ¢ط¢آ¢ط·آ·ط¢آ£ط·آ¢ط¢آ¢ط·آ£ط¢آ¢ط£آ¢أ¢â‚¬ع‘ط¢آ¬ط·آ¹أ¢â‚¬ع©ط·آ·ط¢آ¢ط·آ¢ط¢آ¬ط·آ·ط¢آ·ط·آ¢ط¢آ¥ط·آ£ط¢آ¢ط£آ¢أ¢â‚¬ع‘ط¢آ¬ط£آ¢أ¢â‚¬â€چط¢آ¢ 2,000 km" |
| `indexValue` | `Decimal?` | @db.Decimal(20, 8) // if INDEX-based |
| `expenseJournalId` | `Int?` |  |
| `recordedAt` | `DateTime` | @default(now()) |
| `recordedByUserId` | `String` |  |

## Model: `SalesContract`
| الحقل | النوع | الوصف |
|---|---|---|
| `id` | `Int` | @id @default(autoincrement()) |
| `tenantId` | `String` | @default("default") @map("tenant_id") |
| `contractNumber` | `String` | @unique |
| `customerId` | `Int` |  |
| `customer` | `Customer` | @relation(fields: [customerId], references: [id]) |
| `description` | `String?` |  |
| `startDate` | `DateTime` |  |
| `endDate` | `DateTime?` |  |
| `totalContractValue` | `Decimal` | @db.Decimal(20, 4) |
| `currency` | `String` |  |
| `status` | `String` | @default("DRAFT") // 'DRAFT' | 'ACTIVE' | 'COMPLETED' | 'CANCELLED' | 'TERMINATED' | 'MODIFIED' |
| `parentContractId` | `Int?` |  |
| `parentContract` | `SalesContract?` | @relation("ContractModifications", fields: [parentContractId], references: [id]) |
| `modifications` | `SalesContract[]` | @relation("ContractModifications") |
| `variableConsideration` | `Json?` | // {expectedValue, mostLikelyAmount, scenarios, constraint} |
| `variableConstraintAmount` | `Decimal?` | @db.Decimal(20, 4) |
| `refundLiabilityEstimate` | `Decimal?` | @db.Decimal(20, 4) |
| `refundLiabilityRate` | `Decimal?` | @db.Decimal(5, 4) |
| `totalSsp` | `Decimal?` | @db.Decimal(20, 4) |
| `discountPercent` | `Decimal?` | @db.Decimal(5, 4) |
| `salesPersonId` | `Int?` |  |
| `approvalStatus` | `String?` | @default("PENDING") |
| `approvedAt` | `DateTime?` |  |
| `approvedByUserId` | `String?` |  |
| `createdByUserId` | `String` |  |
| `createdAt` | `DateTime` | @default(now()) |
| `updatedAt` | `DateTime` | @updatedAt |
| `performanceObligations` | `PerformanceObligation[]` |  |
| `contractModificationsLog` | `ContractModificationRecord[]` |  |
| `variableUpdates` | `VariableConsiderationUpdate[]` |  |

## Model: `PerformanceObligation`
| الحقل | النوع | الوصف |
|---|---|---|
| `id` | `Int` | @id @default(autoincrement()) |
| `tenantId` | `String` | @default("default") @map("tenant_id") |
| `poNumber` | `String` | @unique |
| `contractId` | `Int` |  |
| `contract` | `SalesContract` | @relation(fields: [contractId], references: [id], onDelete: Cascade) |
| `description` | `String` |  |
| `productServiceId` | `Int?` | // link to Product if applicable |
| `standaloneSellingPrice` | `Decimal` | @db.Decimal(20, 4) |
| `sspMethod` | `String` | @default("OBSERVABLE") // 'OBSERVABLE' | 'ADJUSTED_MARKET' | 'EXPECTED_COST_PLUS_MARGIN' | 'RESIDUAL' |
| `allocatedAmount` | `Decimal` | @db.Decimal(20, 4) |
| `recognitionPattern` | `String` | // 'POINT_IN_TIME' | 'OVER_TIME_STRAIGHT_LINE' | 'OVER_TIME_USAGE' | 'OVER_TIME_PCT_COMPLETION_INPUT' | 'OVER_TIME_PCT_COMPLETION_OUTPUT' | 'MILESTONE' |
| `startDate` | `DateTime?` |  |
| `endDate` | `DateTime?` |  |
| `expectedCompletionDate` | `DateTime?` |  |
| `completedAt` | `DateTime?` |  |
| `completionMethod` | `String?` |  |
| `recognizedAmount` | `Decimal` | @default(0) @db.Decimal(20, 4) |
| `remainingAmount` | `Decimal` | @db.Decimal(20, 4) |
| `percentComplete` | `Decimal` | @default(0) @db.Decimal(5, 4) |
| `totalEstimatedCost` | `Decimal?` | @db.Decimal(20, 4) |
| `cumulativeCostIncurred` | `Decimal` | @default(0) @db.Decimal(20, 4) |
| `costRevisedAt` | `DateTime?` |  |
| `totalEstimatedUsage` | `Decimal?` | @db.Decimal(20, 4) |
| `cumulativeUsage` | `Decimal` | @default(0) @db.Decimal(20, 4) |
| `pricePerUnit` | `Decimal?` | @db.Decimal(20, 8) |
| `schedule` | `DeferredRevenueSchedule?` |  |
| `milestones` | `RevenueMilestone[]` |  |
| `contractLiabilityAccountId` | `Int?` |  |
| `contractAssetAccountId` | `Int?` |  |
| `revenueAccountId` | `Int?` |  |
| `status` | `String` | @default("ACTIVE") // 'ACTIVE' | 'COMPLETED' | 'CANCELLED' | 'MODIFIED' |
| `createdAt` | `DateTime` | @default(now()) |

## Model: `DeferredRevenueSchedule`
| الحقل | النوع | الوصف |
|---|---|---|
| `id` | `Int` | @id @default(autoincrement()) |
| `tenantId` | `String` | @default("default") @map("tenant_id") |
| `performanceObligationId` | `Int` | @unique |
| `performanceObligation` | `PerformanceObligation` | @relation(fields: [performanceObligationId], references: [id]) |
| `totalAmount` | `Decimal` | @db.Decimal(20, 4) |
| `recognitionStartDate` | `DateTime` |  |
| `recognitionEndDate` | `DateTime` |  |
| `frequency` | `String` | // 'DAILY' | 'MONTHLY' | 'QUARTERLY' | 'ANNUAL' | 'CUSTOM' |
| `totalLines` | `Int` |  |
| `recognizedLines` | `Int` | @default(0) |
| `generatedAt` | `DateTime` | @default(now()) |
| `isCurrent` | `Boolean` | @default(true) |
| `versionNumber` | `Int` | @default(1) |
| `lines` | `RevenueRecognitionLine[]` |  |

## Model: `RevenueRecognitionLine`
| الحقل | النوع | الوصف |
|---|---|---|
| `id` | `Int` | @id @default(autoincrement()) |
| `tenantId` | `String` | @default("default") @map("tenant_id") |
| `scheduleId` | `Int` |  |
| `schedule` | `DeferredRevenueSchedule` | @relation(fields: [scheduleId], references: [id], onDelete: Cascade) |
| `performanceObligationId` | `Int` |  |
| `lineNumber` | `Int` |  |
| `recognitionDate` | `DateTime` |  |
| `scheduledAmount` | `Decimal` | @db.Decimal(20, 4) |
| `recognizedAmount` | `Decimal?` | @db.Decimal(20, 4) |
| `recognizedAt` | `DateTime?` |  |
| `status` | `String` | @default("PENDING") // 'PENDING' | 'RECOGNIZED' | 'ADJUSTED' | 'CANCELLED' | 'DEFERRED' |
| `journalEntryId` | `Int?` |  |
| `notes` | `String?` |  |

## Model: `RevenueMilestone`
| الحقل | النوع | الوصف |
|---|---|---|
| `id` | `Int` | @id @default(autoincrement()) |
| `tenantId` | `String` | @default("default") @map("tenant_id") |
| `performanceObligationId` | `Int` |  |
| `performanceObligation` | `PerformanceObligation` | @relation(fields: [performanceObligationId], references: [id], onDelete: Cascade) |
| `milestoneNumber` | `Int` |  |
| `description` | `String` |  |
| `amount` | `Decimal` | @db.Decimal(20, 4) |
| `expectedDate` | `DateTime` |  |
| `actualCompletionDate` | `DateTime?` |  |
| `status` | `String` | @default("PENDING") // 'PENDING' | 'COMPLETED' | 'DELAYED' | 'CANCELLED' |
| `evidenceFileId` | `Int?` |  |
| `approvedByUserId` | `String?` |  |
| `approvedAt` | `DateTime?` |  |
| `journalEntryId` | `Int?` |  |

## Model: `ContractModificationRecord`
| الحقل | النوع | الوصف |
|---|---|---|
| `id` | `Int` | @id @default(autoincrement()) |
| `tenantId` | `String` | @default("default") @map("tenant_id") |
| `contractId` | `Int` |  |
| `contract` | `SalesContract` | @relation(fields: [contractId], references: [id]) |
| `modificationType` | `String` | // 'NEW_CONTRACT' | 'CUMULATIVE_CATCH_UP' | 'PROSPECTIVE' |
| `modificationDate` | `DateTime` |  |
| `changeInScope` | `String?` |  |
| `changeInPrice` | `Decimal?` | @db.Decimal(20, 4) |
| `changeInDuration` | `Int?` | // months |
| `newContractId` | `Int?` | // if NEW_CONTRACT |
| `catchUpJournalId` | `Int?` | // if CUMULATIVE_CATCH_UP |
| `description` | `String?` | @db.Text |
| `approvedByUserId` | `String?` |  |
| `approvedAt` | `DateTime?` |  |
| `createdByUserId` | `String` |  |
| `createdAt` | `DateTime` | @default(now()) |

## Model: `VariableConsiderationUpdate`
| الحقل | النوع | الوصف |
|---|---|---|
| `id` | `Int` | @id @default(autoincrement()) |
| `tenantId` | `String` | @default("default") @map("tenant_id") |
| `contractId` | `Int` |  |
| `contract` | `SalesContract` | @relation(fields: [contractId], references: [id]) |
| `estimateMethod` | `String` | // 'EXPECTED_VALUE' | 'MOST_LIKELY_AMOUNT' |
| `scenarios` | `Json` | // [{description, probability, amount}] |
| `expectedValue` | `Decimal` | @db.Decimal(20, 4) |
| `constrainedAmount` | `Decimal` | @db.Decimal(20, 4) |
| `effectiveDate` | `DateTime` |  |
| `trueUpRequired` | `Boolean` | @default(false) |
| `trueUpJournalId` | `Int?` |  |
| `reason` | `String?` |  |
| `estimatedByUserId` | `String` |  |
| `estimatedAt` | `DateTime` | @default(now()) |

## Model: `StandaloneSellingPrice`
| الحقل | النوع | الوصف |
|---|---|---|
| `id` | `Int` | @id @default(autoincrement()) |
| `tenantId` | `String` | @default("default") @map("tenant_id") |
| `productServiceId` | `Int?` |  |
| `description` | `String` |  |
| `price` | `Decimal` | @db.Decimal(20, 4) |
| `currency` | `String` | @default("SAR") |
| `method` | `String` | // 'OBSERVABLE' | 'ADJUSTED_MARKET' | 'EXPECTED_COST_PLUS_MARGIN' | 'RESIDUAL' |
| `effectiveFrom` | `DateTime` |  |
| `effectiveTo` | `DateTime?` |  |
| `source` | `String?` | // 'PRICE_LIST' | 'MARKET_STUDY' | 'COST_BASED' | 'CONTRACT' |
| `evidence` | `String?` |  |
| `createdByUserId` | `String` |  |

## Model: `AssetImpairment`
| الحقل | النوع | الوصف |
|---|---|---|
| `id` | `Int` | @id @default(autoincrement()) |
| `tenantId` | `String` | @default("default") @map("tenant_id") |
| `assetId` | `Int` | @map("asset_id") |
| `asset` | `Asset` | @relation(fields: [assetId], references: [id]) |
| `date` | `DateTime` |  |
| `carryingAmount` | `Decimal` | @map("carrying_amount") @db.Decimal(20, 4) |
| `recoverableAmount` | `Decimal` | @map("recoverable_amount") @db.Decimal(20, 4) |
| `impairmentLoss` | `Decimal` | @map("impairment_loss") @db.Decimal(20, 4) |
| `reason` | `String?` |  |
| `journalEntryId` | `Int?` | @map("journal_entry_id") |

## Model: `AssetRevaluation`
| الحقل | النوع | الوصف |
|---|---|---|
| `id` | `Int` | @id @default(autoincrement()) |
| `tenantId` | `String` | @default("default") @map("tenant_id") |
| `assetId` | `Int` | @map("asset_id") |
| `asset` | `Asset` | @relation(fields: [assetId], references: [id]) |
| `date` | `DateTime` |  |
| `carryingAmount` | `Decimal` | @map("carrying_amount") @db.Decimal(20, 4) |
| `fairValue` | `Decimal` | @map("fair_value") @db.Decimal(20, 4) |
| `revaluationSurplus` | `Decimal` | @map("revaluation_surplus") @db.Decimal(20, 4) // If positive |
| `revaluationDeficit` | `Decimal` | @map("revaluation_deficit") @db.Decimal(20, 4) // If negative |
| `evaluatorName` | `String?` | @map("evaluator_name") |
| `journalEntryId` | `Int?` | @map("journal_entry_id") |

## Model: `CustomReport`
| الحقل | النوع | الوصف |
|---|---|---|
| `id` | `Int` | @id @default(autoincrement()) |
| `tenantId` | `String` | @default("default") @map("tenant_id") |
| `name` | `String` |  |
| `description` | `String?` |  |
| `module` | `String` | @default("FINANCIAL") // FINANCIAL, SALES, PURCHASES, INVENTORY, MANUFACTURING |
| `config` | `Json` | // Stores selected dimensions, measures, filters, sort orders, and chart types |
| `isPublic` | `Boolean` | @default(false) @map("is_public") |
| `createdBy` | `Int` | @map("created_by") |
| `createdAt` | `DateTime` | @default(now()) @map("created_at") |
| `updatedAt` | `DateTime` | @updatedAt @map("updated_at") |
| `schedules` | `ReportSchedule[]` |  |

## Model: `ReportSchedule`
| الحقل | النوع | الوصف |
|---|---|---|
| `id` | `Int` | @id @default(autoincrement()) |
| `tenantId` | `String` | @default("default") @map("tenant_id") |
| `reportId` | `Int` | @map("report_id") |
| `report` | `CustomReport` | @relation(fields: [reportId], references: [id], onDelete: Cascade) |
| `format` | `String` | @default("EXCEL") // EXCEL, PDF, CSV |
| `frequency` | `String` | @default("WEEKLY") // DAILY, WEEKLY, MONTHLY |
| `emailRecipients` | `String` | @map("email_recipients") // Comma separated emails |
| `lastRunAt` | `DateTime?` | @map("last_run_at") |
| `nextRunAt` | `DateTime?` | @map("next_run_at") |
| `status` | `String` | @default("ACTIVE") // ACTIVE, PAUSED |
| `createdBy` | `Int` | @map("created_by") |
| `createdAt` | `DateTime` | @default(now()) @map("created_at") |

## Model: `DunningLevel`
| الحقل | النوع | الوصف |
|---|---|---|
| `id` | `Int` | @id @default(autoincrement()) |
| `tenantId` | `String` | @default("default") @map("tenant_id") |
| `levelNumber` | `Int` | @unique // 1, 2, 3, 4 |
| `nameAr` | `String` |  |
| `nameEn` | `String` |  |
| `description` | `String?` |  |
| `daysOverdue` | `Int` | // minimum days |
| `minOpenAmount` | `Decimal?` | @db.Decimal(20, 4) |
| `customerSegments` | `String[]` | // applies to which segments |
| `templateHtmlAr` | `String` | @db.Text |
| `templateHtmlEn` | `String?` | @db.Text |
| `emailSubjectAr` | `String` |  |
| `emailSubjectEn` | `String?` |  |
| `emailBodyAr` | `String` | @db.Text |
| `emailBodyEn` | `String?` | @db.Text |
| `whatsappTemplateName` | `String?` | // pre-approved by Meta |
| `smsTemplate` | `String?` |  |
| `lateFeeAmount` | `Decimal?` | @db.Decimal(10, 2) |
| `lateFeeFormula` | `String?` | // 'FLAT' | 'PERCENT' | 'TIERED' |
| `lateFeePercent` | `Decimal?` | @db.Decimal(5, 2) |
| `interestRateMonthly` | `Decimal?` | @db.Decimal(5, 4) // per month |
| `feeAccountId` | `Int?` |  |
| `interestAccountId` | `Int?` |  |
| `blockCustomer` | `Boolean` | @default(false) |
| `legalAction` | `Boolean` | @default(false) |
| `escalateToAgency` | `Boolean` | @default(false) |
| `sendEmail` | `Boolean` | @default(true) |
| `sendWhatsApp` | `Boolean` | @default(false) |
| `sendSms` | `Boolean` | @default(false) |
| `createCallTask` | `Boolean` | @default(false) |
| `autoRunEnabled` | `Boolean` | @default(true) |
| `manualReviewRequired` | `Boolean` | @default(false) |
| `approvalRoleRequired` | `String?` | // 'AR_MANAGER' | 'CFO' |
| `abTestVariantId` | `Int?` |  |
| `active` | `Boolean` | @default(true) |
| `createdAt` | `DateTime` | @default(now()) |
| `updatedAt` | `DateTime` | @updatedAt |
| `letters` | `DunningLetter[]` |  |

## Model: `DunningCampaign`
| الحقل | النوع | الوصف |
|---|---|---|
| `id` | `Int` | @id @default(autoincrement()) |
| `tenantId` | `String` | @default("default") @map("tenant_id") |
| `campaignNumber` | `String` | @unique |
| `customerId` | `Int` |  |
| `customer` | `Customer` | @relation(fields: [customerId], references: [id]) |
| `startedAt` | `DateTime` | @default(now()) |
| `endedAt` | `DateTime?` |  |
| `status` | `String` | @default("ACTIVE") // ACTIVE | PAUSED | COMPLETED | CANCELLED |
| `totalAmountAtStart` | `Decimal` | @db.Decimal(20, 4) |
| `amountCollected` | `Decimal` | @default(0) @db.Decimal(20, 4) |
| `letters` | `DunningLetter[]` |  |
| `triggeredBy` | `String` | // 'CRON' | 'MANUAL' | 'API' |

## Model: `DunningLetter`
| الحقل | النوع | الوصف |
|---|---|---|
| `id` | `Int` | @id @default(autoincrement()) |
| `tenantId` | `String` | @default("default") @map("tenant_id") |
| `letterNumber` | `String` | @unique |
| `campaignId` | `Int` |  |
| `campaign` | `DunningCampaign` | @relation(fields: [campaignId], references: [id]) |
| `customerId` | `Int` |  |
| `customer` | `Customer` | @relation(fields: [customerId], references: [id]) |
| `levelId` | `Int` |  |
| `level` | `DunningLevel` | @relation(fields: [levelId], references: [id]) |
| `invoiceIds` | `Int[]` | // open items covered |
| `totalAmountDue` | `Decimal` | @db.Decimal(20, 4) |
| `oldestDueDate` | `DateTime` |  |
| `daysOverdue` | `Int` |  |
| `pdfUrl` | `String?` |  |
| `pdfHash` | `String?` |  |
| `lateFeeAmount` | `Decimal?` | @db.Decimal(10, 2) |
| `interestAmount` | `Decimal?` | @db.Decimal(10, 2) |
| `lateFeeJournalId` | `Int?` |  |
| `customerResponseAt` | `DateTime?` |  |
| `customerResponse` | `String?` | @db.Text |
| `customerResponseChannel` | `String?` |  |
| `status` | `String` | @default("GENERATED") // GENERATED | SENT | DELIVERED | OPENED | RESPONDED | RESOLVED |
| `snoozedUntil` | `DateTime?` |  |
| `snoozedReason` | `String?` |  |
| `snoozedByUserId` | `String?` |  |
| `generatedAt` | `DateTime` | @default(now()) |
| `communications` | `DunningCommunication[]` |  |

## Model: `DunningCommunication`
| الحقل | النوع | الوصف |
|---|---|---|
| `id` | `Int` | @id @default(autoincrement()) |
| `tenantId` | `String` | @default("default") @map("tenant_id") |
| `letterId` | `Int` |  |
| `letter` | `DunningLetter` | @relation(fields: [letterId], references: [id]) |
| `channel` | `String` | // 'EMAIL' | 'WHATSAPP' | 'SMS' | 'PHONE_CALL' | 'PHYSICAL_MAIL' | 'PORTAL' |
| `direction` | `String` | @default("OUTBOUND") // OUTBOUND | INBOUND |
| `sentAt` | `DateTime` | @default(now()) |
| `recipientAddress` | `String` |  |
| `status` | `String` | // 'SENT' | 'DELIVERED' | 'READ' | 'OPENED' | 'BOUNCED' | 'FAILED' |
| `externalMessageId` | `String?` |  |
| `errorMessage` | `String?` |  |
| `responseReceived` | `String?` | @db.Text |
| `responseReceivedAt` | `DateTime?` |  |
| `spokeWith` | `String?` | // for phone calls |
| `callDurationSeconds` | `Int?` |  |
| `callOutcome` | `String?` | // 'PROMISE' | 'DISPUTE' | 'NO_ANSWER' | 'BUSY' | 'WRONG_NUMBER' | 'PAYMENT_CONFIRMED' |

## Model: `PromiseToPay`
| الحقل | النوع | الوصف |
|---|---|---|
| `id` | `Int` | @id @default(autoincrement()) |
| `tenantId` | `String` | @default("default") @map("tenant_id") |
| `customerId` | `Int` |  |
| `customer` | `Customer` | @relation(fields: [customerId], references: [id]) |
| `openItemIds` | `Int[]` |  |
| `promisedAmount` | `Decimal` | @db.Decimal(20, 4) |
| `promisedDate` | `DateTime` |  |
| `status` | `String` | @default("ACTIVE") // ACTIVE | KEPT | BROKEN | CANCELLED |
| `recordedByUserId` | `String` |  |
| `recordedAt` | `DateTime` | @default(now()) |
| `channel` | `String` | // 'PHONE' | 'EMAIL' | 'MEETING' | 'WHATSAPP' | 'PORTAL' |
| `spokeTo` | `String?` |  |
| `notes` | `String?` | @db.Text |
| `reminderDate` | `DateTime?` |  |
| `reminderSent` | `Boolean` | @default(false) |
| `outcomeNotes` | `String?` |  |
| `outcomeRecordedAt` | `DateTime?` |  |
| `outcomeRecordedByUserId` | `String?` |  |

## Model: `CollectionAgency`
| الحقل | النوع | الوصف |
|---|---|---|
| `id` | `Int` | @id @default(autoincrement()) |
| `tenantId` | `String` | @default("default") @map("tenant_id") |
| `name` | `String` |  |
| `contactPerson` | `String?` |  |
| `contactEmail` | `String?` |  |
| `contactPhone` | `String?` |  |
| `commissionPercent` | `Decimal` | @db.Decimal(5, 2) |
| `apiEndpoint` | `String?` |  |
| `apiKey` | `String?` | // encrypted |
| `active` | `Boolean` | @default(true) |
| `performanceScore` | `Decimal?` | @db.Decimal(5, 2) |
| `totalAssignedCount` | `Int` | @default(0) |
| `totalCollected` | `Decimal` | @default(0) @db.Decimal(20, 4) |
| `totalCommissionPaid` | `Decimal` | @default(0) @db.Decimal(20, 4) |
| `assignments` | `CollectionAssignment[]` |  |

## Model: `CollectionAssignment`
| الحقل | النوع | الوصف |
|---|---|---|
| `id` | `Int` | @id @default(autoincrement()) |
| `tenantId` | `String` | @default("default") @map("tenant_id") |
| `agencyId` | `Int` |  |
| `agency` | `CollectionAgency` | @relation(fields: [agencyId], references: [id]) |
| `customerId` | `Int` |  |
| `customer` | `Customer` | @relation(fields: [customerId], references: [id]) |
| `assignedAt` | `DateTime` | @default(now()) |
| `assignedByUserId` | `String` |  |
| `amountAssigned` | `Decimal` | @db.Decimal(20, 4) |
| `invoiceIds` | `Int[]` |  |
| `status` | `String` | @default("ASSIGNED") // ASSIGNED | IN_PROGRESS | COLLECTED | FAILED | RETURNED |
| `collectedAmount` | `Decimal` | @default(0) @db.Decimal(20, 4) |
| `commissionAmount` | `Decimal?` | @db.Decimal(20, 4) |
| `closedAt` | `DateTime?` |  |
| `notes` | `String?` | @db.Text |

## Model: `CustomerCreditAction`
| الحقل | النوع | الوصف |
|---|---|---|
| `id` | `Int` | @id @default(autoincrement()) |
| `tenantId` | `String` | @default("default") @map("tenant_id") |
| `customerId` | `Int` |  |
| `customer` | `Customer` | @relation(fields: [customerId], references: [id]) |
| `action` | `String` | // 'HOLD' | 'RELEASE' | 'REDUCE_LIMIT' | 'INCREASE_LIMIT' |
| `reason` | `String` |  |
| `performedAt` | `DateTime` | @default(now()) |
| `performedByUserId` | `String` |  |
| `approvedByUserId` | `String?` |  |
| `oldValue` | `Json?` |  |
| `newValue` | `Json?` |  |

## Model: `BpmWorkflow`
| الحقل | النوع | الوصف |
|---|---|---|
| `id` | `Int` | @id @default(autoincrement()) |
| `tenantId` | `String` | @default("default") @map("tenant_id") |
| `name` | `String` |  |
| `entityType` | `String` | @map("entity_type") // e.g., PurchaseOrder, JournalEntry, LeaveRequest |
| `triggerEvent` | `String` | @map("trigger_event") // ON_CREATE, ON_UPDATE, MANUAL |
| `definition` | `Json` |  |
| `isActive` | `Boolean` | @default(true) @map("is_active") |
| `version` | `Int` | @default(1) |
| `createdAt` | `DateTime` | @default(now()) @map("created_at") |
| `updatedAt` | `DateTime` | @updatedAt @map("updated_at") |
| `instances` | `BpmInstance[]` |  |

## Model: `BpmInstance`
| الحقل | النوع | الوصف |
|---|---|---|
| `id` | `Int` | @id @default(autoincrement()) |
| `tenantId` | `String` | @default("default") @map("tenant_id") |
| `workflowId` | `Int` | @map("workflow_id") |
| `workflow` | `BpmWorkflow` | @relation(fields: [workflowId], references: [id]) |
| `entityId` | `Int` | @map("entity_id") // ID of the specific PO or JE |
| `status` | `String` | @default("RUNNING") // RUNNING, COMPLETED, CANCELLED, FAILED |
| `currentStepId` | `String` | @map("current_step_id") // Node ID from JSON definition |
| `contextData` | `Json?` | @map("context_data") // Variables collected during execution |
| `startedAt` | `DateTime` | @default(now()) @map("started_at") |
| `completedAt` | `DateTime?` | @map("completed_at") |
| `tasks` | `BpmTask[]` |  |

## Model: `BpmTask`
| الحقل | النوع | الوصف |
|---|---|---|
| `id` | `Int` | @id @default(autoincrement()) |
| `tenantId` | `String` | @default("default") @map("tenant_id") |
| `instanceId` | `Int` | @map("instance_id") |
| `instance` | `BpmInstance` | @relation(fields: [instanceId], references: [id], onDelete: Cascade) |
| `stepId` | `String` | @map("step_id") |
| `taskName` | `String` | @map("task_name") |
| `assigneeId` | `Int?` | @map("assignee_id") // Specific user |
| `assigneeRole` | `String?` | @map("assignee_role") // Or role (e.g., Finance Manager) |
| `status` | `String` | @default("PENDING") // PENDING, APPROVED, REJECTED, ESCALATED |
| `comments` | `String?` | @db.Text |
| `slaDueDate` | `DateTime?` | @map("sla_due_date") |
| `escalatedTo` | `Int?` | @map("escalated_to") |
| `createdAt` | `DateTime` | @default(now()) @map("created_at") |
| `completedAt` | `DateTime?` | @map("completed_at") |

## Model: `PaymentRun`
| الحقل | النوع | الوصف |
|---|---|---|
| `id` | `Int` | @id @default(autoincrement()) |
| `tenantId` | `String` | @default("default") @map("tenant_id") |
| `runNumber` | `String` | @unique @default(cuid()) // using cuid as default for now |
| `description` | `String?` |  |
| `status` | `String` | @default("DRAFT") |
| `dueDateUntil` | `DateTime` |  |
| `currency` | `String` |  |
| `paymentMethod` | `String` | // 'BANK_TRANSFER' | 'CHECK' | 'WIRE' | 'CASH' | 'BNPL' |
| `bankAccountId` | `Int` | // source account |
| `totalAmount` | `Decimal` | @db.Decimal(20, 4) |
| `totalCount` | `Int` | @default(0) |
| `successCount` | `Int` | @default(0) |
| `failedCount` | `Int` | @default(0) |
| `estimatedSavings` | `Decimal?` | @db.Decimal(20, 4) |
| `actualSavings` | `Decimal?` | @db.Decimal(20, 4) |
| `bankCharges` | `Decimal?` | @db.Decimal(20, 4) |
| `proposedAt` | `DateTime?` |  |
| `proposedByUserId` | `String?` |  |
| `submittedForApprovalAt` | `DateTime?` |  |
| `approvedAt` | `DateTime?` |  |
| `filesGeneratedAt` | `DateTime?` |  |
| `sentToBankAt` | `DateTime?` |  |
| `sentToBankByUserId` | `String?` |  |
| `confirmedAt` | `DateTime?` |  |
| `confirmedByUserId` | `String?` |  |
| `postedAt` | `DateTime?` |  |
| `postedByUserId` | `String?` |  |
| `cancelledAt` | `DateTime?` |  |
| `cancelledByUserId` | `String?` |  |
| `cancellationReason` | `String?` |  |
| `journalEntryId` | `Int?` |  |
| `reversalJournalId` | `Int?` |  |
| `approvalRequiredCount` | `Int` | @default(1) |
| `approvalReceivedCount` | `Int` | @default(0) |
| `lines` | `PaymentRunLine[]` |  |
| `bankFiles` | `PaymentRunBankFile[]` |  |
| `approvals` | `PaymentRunApproval[]` |  |
| `createdAt` | `DateTime` | @default(now()) |
| `deletedAt` | `DateTime?` | // P1.2 soft-delete ط·آ·ط¢آ·ط·آ¢ط¢آ·ط·آ·ط¢آ¢ط·آ¢ط¢آ·ط·آ·ط¢آ·ط·آ¢ط¢آ¢ط·آ·ط¢آ¢ط·آ¢ط¢آ·ط·آ·ط¢آ·ط·آ¢ط¢آ·ط·آ·ط¢آ¢ط·آ¢ط¢آ¢ط·آ·ط¢آ·ط·آ¢ط¢آ¢ط·آ·ط¢آ¢ط·آ¢ط¢آ£ط·آ·ط¢آ·ط·آ¢ط¢آ·ط·آ·ط¢آ¢ط·آ¢ط¢آ·ط·آ·ط¢آ·ط·آ¢ط¢آ¢ط·آ·ط¢آ¢ط·آ¢ط¢آ¢ط·آ·ط¢آ·ط·آ¢ط¢آ·ط·آ·ط¢آ¢ط·آ¢ط¢آ¢ط·آ·ط¢آ·ط·آ¢ط¢آ¢ط·آ·ط¢آ¢ط·آ¢ط¢آ¢ط·آ·ط¢آ·ط·آ¢ط¢آ·ط·آ·ط¢آ¢ط·آ¢ط¢آ·ط·آ·ط¢آ·ط·آ¢ط¢آ¢ط·آ·ط¢آ¢ط·آ¢ط¢آ£ط·آ·ط¢آ·ط·آ¢ط¢آ·ط·آ·ط¢آ¢ط·آ¢ط¢آ¢ط·آ·ط¢آ·ط·آ¢ط¢آ¢ط·آ·ط¢آ¢ط·آ¢ط¢آ¢ط·آ·ط¢آ·ط·آ¢ط¢آ·ط·آ·ط¢آ¢ط·آ¢ط¢آ£ط·آ·ط¢آ·ط·آ¢ط¢آ¢ط·آ·ط¢آ¢ط·آ¢ط¢آ¢ط·آ·ط¢آ·ط·آ¢ط¢آ£ط·آ·ط¢آ¢ط·آ¢ط¢آ¢ط·آ·ط¢آ£ط·آ¢ط¢آ¢ط·آ£ط¢آ¢ط£آ¢أ¢â€ڑآ¬ط¹â€کط·آ¢ط¢آ¬ط·آ·ط¢آ¹ط£آ¢أ¢â€ڑآ¬ط¹آ©ط·آ·ط¢آ·ط·آ¢ط¢آ¢ط·آ·ط¢آ¢ط·آ¢ط¢آ¬ط·آ·ط¢آ·ط·آ¢ط¢آ·ط·آ·ط¢آ¢ط·آ¢ط¢آ¹ط·آ·ط¢آ£ط·آ¢ط¢آ¢ط·آ£ط¢آ¢ط£آ¢أ¢â€ڑآ¬ط¹â€کط·آ¢ط¢آ¬ط·آ·ط¢آ¹ط·آ¢ط¢آ©ط·آ·ط¢آ·ط·آ¢ط¢آ·ط·آ·ط¢آ¢ط·آ¢ط¢آ·ط·آ·ط¢آ·ط·آ¢ط¢آ¢ط·آ·ط¢آ¢ط·آ¢ط¢آ¢ط·آ·ط¢آ·ط·آ¢ط¢آ·ط·آ·ط¢آ¢ط·آ¢ط¢آ¢ط·آ·ط¢آ·ط·آ¢ط¢آ¢ط·آ·ط¢آ¢ط·آ¢ط¢آ¬ط·آ·ط¢آ·ط·آ¢ط¢آ·ط·آ·ط¢آ¢ط·آ¢ط¢آ·ط·آ·ط¢آ·ط·آ¢ط¢آ¢ط·آ·ط¢آ¢ط·آ¢ط¢آ£ط·آ·ط¢آ·ط·آ¢ط¢آ·ط·آ·ط¢آ¢ط·آ¢ط¢آ¢ط·آ·ط¢آ·ط·آ¢ط¢آ¢ط·آ·ط¢آ¢ط·آ¢ط¢آ¢ط·آ·ط¢آ·ط·آ¢ط¢آ·ط·آ·ط¢آ¢ط·آ¢ط¢آ£ط·آ·ط¢آ·ط·آ¢ط¢آ¢ط·آ·ط¢آ¢ط·آ¢ط¢آ¢ط·آ·ط¢آ·ط·آ¢ط¢آ£ط·آ·ط¢آ¢ط·آ¢ط¢آ¢ط·آ·ط¢آ£ط·آ¢ط¢آ¢ط·آ£ط¢آ¢ط£آ¢أ¢â‚¬ع‘ط¢آ¬ط·آ¹أ¢â‚¬ع©ط·آ·ط¢آ¢ط·آ¢ط¢آ¬ط·آ·ط¢آ·ط·آ¢ط¢آ¹ط·آ£ط¢آ¢ط£آ¢أ¢â‚¬ع‘ط¢آ¬ط·آ¹ط¢آ©ط·آ·ط¢آ·ط·آ¢ط¢آ·ط·آ·ط¢آ¢ط·آ¢ط¢آ¢ط·آ·ط¢آ·ط·آ¢ط¢آ¢ط·آ·ط¢آ¢ط·آ¢ط¢آ¬ط·آ·ط¢آ·ط·آ¢ط¢آ·ط·آ·ط¢آ¢ط·آ¢ط¢آ£ط·آ·ط¢آ·ط·آ¢ط¢آ¢ط·آ·ط¢آ¢ط·آ¢ط¢آ¢ط·آ·ط¢آ·ط·آ¢ط¢آ£ط·آ·ط¢آ¢ط·آ¢ط¢آ¢ط·آ·ط¢آ£ط·آ¢ط¢آ¢ط·آ£ط¢آ¢ط£آ¢أ¢â€ڑآ¬ط¹â€کط·آ¢ط¢آ¬ط·آ·ط¢آ¹ط£آ¢أ¢â€ڑآ¬ط¹آ©ط·آ·ط¢آ·ط·آ¢ط¢آ¢ط·آ·ط¢آ¢ط·آ¢ط¢آ¬ط·آ·ط¢آ·ط·آ¢ط¢آ·ط·آ·ط¢آ¢ط·آ¢ط¢آ¥ط·آ·ط¢آ£ط·آ¢ط¢آ¢ط·آ£ط¢آ¢ط£آ¢أ¢â€ڑآ¬ط¹â€کط·آ¢ط¢آ¬ط·آ£ط¢آ¢ط£آ¢أ¢â€ڑآ¬أ¢â‚¬ع†ط·آ¢ط¢آ¢ do not use hard DELETE |

## Model: `PaymentRunLine`
| الحقل | النوع | الوصف |
|---|---|---|
| `id` | `Int` | @id @default(autoincrement()) |
| `tenantId` | `String` | @default("default") @map("tenant_id") |
| `runId` | `Int` |  |
| `run` | `PaymentRun` | @relation(fields: [runId], references: [id], onDelete: Cascade) |
| `supplierId` | `Int` |  |
| `supplier` | `Customer` | @relation(fields: [supplierId], references: [id]) |
| `openItemIds` | `Int[]` |  |
| `invoiceCount` | `Int` | @default(1) |
| `amount` | `Decimal` | @db.Decimal(20, 4) |
| `currency` | `String` |  |
| `exchangeRate` | `Decimal` | @default(1) @db.Decimal(20, 8) |
| `amountFunctional` | `Decimal` | @db.Decimal(20, 4) // converted to base currency |
| `discountAmount` | `Decimal?` | @db.Decimal(20, 4) |
| `discountTaken` | `Boolean` | @default(false) |
| `discountWindowEnds` | `DateTime?` |  |
| `beneficiaryName` | `String` |  |
| `beneficiaryIBAN` | `String?` |  |
| `beneficiarySwift` | `String?` |  |
| `beneficiaryBankName` | `String?` |  |
| `beneficiaryBankAddress` | `String?` |  |
| `beneficiaryCountry` | `String?` |  |
| `beneficiaryAccountNumber` | `String?` | // when no IBAN (US) |
| `beneficiaryRoutingNumber` | `String?` | // ABA for US |
| `paymentMethod` | `String` |  |
| `paymentReference` | `String?` | // for supplier's reference |
| `paymentPurpose` | `String?` | // for compliance |
| `status` | `String` | // 'PENDING' | 'EXCLUDED' | 'GENERATED' | 'SENT' | 'CONFIRMED' | 'FAILED' | 'RETURNED' | 'CANCELLED' |
| `failureReason` | `String?` |  |
| `failureCode` | `String?` |  |
| `externalReference` | `String?` | // bank's reference |
| `bankConfirmedAt` | `DateTime?` |  |
| `bankFees` | `Decimal?` | @db.Decimal(20, 4) |
| `excludedAt` | `DateTime?` |  |
| `excludedReason` | `String?` |  |
| `excludedByUserId` | `String?` |  |
| `createdAt` | `DateTime` | @default(now()) |
| `updatedAt` | `DateTime` | @updatedAt |
| `deletedAt` | `DateTime?` | // P1.2 soft-delete ط·آ·ط¢آ·ط·آ¢ط¢آ·ط·آ·ط¢آ¢ط·آ¢ط¢آ·ط·آ·ط¢آ·ط·آ¢ط¢آ¢ط·آ·ط¢آ¢ط·آ¢ط¢آ·ط·آ·ط¢آ·ط·آ¢ط¢آ·ط·آ·ط¢آ¢ط·آ¢ط¢آ¢ط·آ·ط¢آ·ط·آ¢ط¢آ¢ط·آ·ط¢آ¢ط·آ¢ط¢آ£ط·آ·ط¢آ·ط·آ¢ط¢آ·ط·آ·ط¢آ¢ط·آ¢ط¢آ·ط·آ·ط¢آ·ط·آ¢ط¢آ¢ط·آ·ط¢آ¢ط·آ¢ط¢آ¢ط·آ·ط¢آ·ط·آ¢ط¢آ·ط·آ·ط¢آ¢ط·آ¢ط¢آ¢ط·آ·ط¢آ·ط·آ¢ط¢آ¢ط·آ·ط¢آ¢ط·آ¢ط¢آ¢ط·آ·ط¢آ·ط·آ¢ط¢آ·ط·آ·ط¢آ¢ط·آ¢ط¢آ·ط·آ·ط¢آ·ط·آ¢ط¢آ¢ط·آ·ط¢آ¢ط·آ¢ط¢آ£ط·آ·ط¢آ·ط·آ¢ط¢آ·ط·آ·ط¢آ¢ط·آ¢ط¢آ¢ط·آ·ط¢آ·ط·آ¢ط¢آ¢ط·آ·ط¢آ¢ط·آ¢ط¢آ¢ط·آ·ط¢آ·ط·آ¢ط¢آ·ط·آ·ط¢آ¢ط·آ¢ط¢آ£ط·آ·ط¢آ·ط·آ¢ط¢آ¢ط·آ·ط¢آ¢ط·آ¢ط¢آ¢ط·آ·ط¢آ·ط·آ¢ط¢آ£ط·آ·ط¢آ¢ط·آ¢ط¢آ¢ط·آ·ط¢آ£ط·آ¢ط¢آ¢ط·آ£ط¢آ¢ط£آ¢أ¢â€ڑآ¬ط¹â€کط·آ¢ط¢آ¬ط·آ·ط¢آ¹ط£آ¢أ¢â€ڑآ¬ط¹آ©ط·آ·ط¢آ·ط·آ¢ط¢آ¢ط·آ·ط¢آ¢ط·آ¢ط¢آ¬ط·آ·ط¢آ·ط·آ¢ط¢آ·ط·آ·ط¢آ¢ط·آ¢ط¢آ¹ط·آ·ط¢آ£ط·آ¢ط¢آ¢ط·آ£ط¢آ¢ط£آ¢أ¢â€ڑآ¬ط¹â€کط·آ¢ط¢آ¬ط·آ·ط¢آ¹ط·آ¢ط¢آ©ط·آ·ط¢آ·ط·آ¢ط¢آ·ط·آ·ط¢آ¢ط·آ¢ط¢آ·ط·آ·ط¢آ·ط·آ¢ط¢آ¢ط·آ·ط¢آ¢ط·آ¢ط¢آ¢ط·آ·ط¢آ·ط·آ¢ط¢آ·ط·آ·ط¢آ¢ط·آ¢ط¢آ¢ط·آ·ط¢آ·ط·آ¢ط¢آ¢ط·آ·ط¢آ¢ط·آ¢ط¢آ¬ط·آ·ط¢آ·ط·آ¢ط¢آ·ط·آ·ط¢آ¢ط·آ¢ط¢آ·ط·آ·ط¢آ·ط·آ¢ط¢آ¢ط·آ·ط¢آ¢ط·آ¢ط¢آ£ط·آ·ط¢آ·ط·آ¢ط¢آ·ط·آ·ط¢آ¢ط·آ¢ط¢آ¢ط·آ·ط¢آ·ط·آ¢ط¢آ¢ط·آ·ط¢آ¢ط·آ¢ط¢آ¢ط·آ·ط¢آ·ط·آ¢ط¢آ·ط·آ·ط¢آ¢ط·آ¢ط¢آ£ط·آ·ط¢آ·ط·آ¢ط¢آ¢ط·آ·ط¢آ¢ط·آ¢ط¢آ¢ط·آ·ط¢آ·ط·آ¢ط¢آ£ط·آ·ط¢آ¢ط·آ¢ط¢آ¢ط·آ·ط¢آ£ط·آ¢ط¢آ¢ط·آ£ط¢آ¢ط£آ¢أ¢â‚¬ع‘ط¢آ¬ط·آ¹أ¢â‚¬ع©ط·آ·ط¢آ¢ط·آ¢ط¢آ¬ط·آ·ط¢آ·ط·آ¢ط¢آ¹ط·آ£ط¢آ¢ط£آ¢أ¢â‚¬ع‘ط¢آ¬ط·آ¹ط¢آ©ط·آ·ط¢آ·ط·آ¢ط¢آ·ط·آ·ط¢آ¢ط·آ¢ط¢آ¢ط·آ·ط¢آ·ط·آ¢ط¢آ¢ط·آ·ط¢آ¢ط·آ¢ط¢آ¬ط·آ·ط¢آ·ط·آ¢ط¢آ·ط·آ·ط¢آ¢ط·آ¢ط¢آ£ط·آ·ط¢آ·ط·آ¢ط¢آ¢ط·آ·ط¢آ¢ط·آ¢ط¢آ¢ط·آ·ط¢آ·ط·آ¢ط¢آ£ط·آ·ط¢آ¢ط·آ¢ط¢آ¢ط·آ·ط¢آ£ط·آ¢ط¢آ¢ط·آ£ط¢آ¢ط£آ¢أ¢â€ڑآ¬ط¹â€کط·آ¢ط¢آ¬ط·آ·ط¢آ¹ط£آ¢أ¢â€ڑآ¬ط¹آ©ط·آ·ط¢آ·ط·آ¢ط¢آ¢ط·آ·ط¢آ¢ط·آ¢ط¢آ¬ط·آ·ط¢آ·ط·آ¢ط¢آ·ط·آ·ط¢آ¢ط·آ¢ط¢آ¥ط·آ·ط¢آ£ط·آ¢ط¢آ¢ط·آ£ط¢آ¢ط£آ¢أ¢â€ڑآ¬ط¹â€کط·آ¢ط¢آ¬ط·آ£ط¢آ¢ط£آ¢أ¢â€ڑآ¬أ¢â‚¬ع†ط·آ¢ط¢آ¢ do not use hard DELETE |

## Model: `PaymentRunBankFile`
| الحقل | النوع | الوصف |
|---|---|---|
| `id` | `Int` | @id @default(autoincrement()) |
| `tenantId` | `String` | @default("default") @map("tenant_id") |
| `runId` | `Int` |  |
| `run` | `PaymentRun` | @relation(fields: [runId], references: [id], onDelete: Cascade) |
| `fileFormat` | `String` | // 'SARIE' | 'SEPA_PAIN001' | 'NACHA' | 'SWIFT_MT103' | 'SWIFT_MT202' | 'CSV_GENERIC' | 'CHECK_PRINT_PDF' |
| `bankCode` | `String?` | // ALRAJHI, NCB, SAB, SAMBA, etc. |
| `bankAccountId` | `Int` | // source |
| `fileUrl` | `String` |  |
| `fileName` | `String` |  |
| `fileHash` | `String` | // SHA-256 |
| `fileSizeBytes` | `Int` |  |
| `generatedAt` | `DateTime` | @default(now()) |
| `generatedByUserId` | `String` |  |
| `txnCount` | `Int` |  |
| `totalAmount` | `Decimal` | @db.Decimal(20, 4) |
| `currency` | `String` |  |
| `uploadedToBankAt` | `DateTime?` |  |
| `uploadedByUserId` | `String?` |  |
| `uploadConfirmationRef` | `String?` |  |
| `confirmationFileUrl` | `String?` |  |
| `confirmationParsedAt` | `DateTime?` |  |
| `successCount` | `Int?` |  |
| `failedCount` | `Int?` |  |
| `encrypted` | `Boolean` | @default(false) |
| `encryptionKeyId` | `String?` |  |

## Model: `PaymentRunApproval`
| الحقل | النوع | الوصف |
|---|---|---|
| `id` | `Int` | @id @default(autoincrement()) |
| `tenantId` | `String` | @default("default") @map("tenant_id") |
| `runId` | `Int` |  |
| `run` | `PaymentRun` | @relation(fields: [runId], references: [id], onDelete: Cascade) |
| `approverUserId` | `String` |  |
| `approverRole` | `String` | // 'AP_MANAGER' | 'FINANCE_MANAGER' | 'CFO' | 'CEO' | 'BOARD' |
| `level` | `Int` | // 1, 2, 3 |
| `isParallel` | `Boolean` | @default(false) |
| `status` | `String` | // 'PENDING' | 'APPROVED' | 'REJECTED' | 'DELEGATED' | 'EXPIRED' |
| `decisionAt` | `DateTime?` |  |
| `comments` | `String?` |  |
| `delegatedToUserId` | `String?` |  |
| `delegationReason` | `String?` |  |
| `reminderSentAt` | `DateTime?` |  |
| `expiresAt` | `DateTime?` |  |

## Model: `SupplierBankAccount`
| الحقل | النوع | الوصف |
|---|---|---|
| `id` | `Int` | @id @default(autoincrement()) |
| `tenantId` | `String` | @default("default") @map("tenant_id") |
| `supplierId` | `Int` |  |
| `supplier` | `Customer` | @relation(fields: [supplierId], references: [id]) |
| `isDefault` | `Boolean` | @default(false) |
| `isActive` | `Boolean` | @default(true) |
| `isVerified` | `Boolean` | @default(false) |
| `verificationDate` | `DateTime?` |  |
| `verificationMethod` | `String?` | // 'PENNY_TEST' | 'DOCUMENT' | 'PHONE_CONFIRM' |
| `beneficiaryName` | `String` | // may differ from supplier name |
| `iban` | `String?` |  |
| `swift` | `String?` |  |
| `bankName` | `String` |  |
| `bankAddress` | `String?` |  |
| `countryCode` | `String` |  |
| `currency` | `String` |  |
| `accountNumber` | `String?` | // for non-IBAN countries |
| `routingNumber` | `String?` | // ABA for US |
| `branchCode` | `String?` |  |
| `intermediaryBankSwift` | `String?` | // for international transfers |
| `intermediaryBankAccount` | `String?` |  |
| `notes` | `String?` |  |
| `createdAt` | `DateTime` | @default(now()) |
| `createdByUserId` | `String` |  |
| `lastUsedAt` | `DateTime?` |  |

## Model: `PaymentBlock`
| الحقل | النوع | الوصف |
|---|---|---|
| `id` | `Int` | @id @default(autoincrement()) |
| `tenantId` | `String` | @default("default") @map("tenant_id") |
| `type` | `String` | // 'SUPPLIER' | 'INVOICE' |
| `supplierId` | `Int?` |  |
| `invoiceId` | `Int?` |  |
| `reason` | `String` | // 'COMPLIANCE_CHECK' | 'DISPUTE' | 'QUALITY_HOLD' | 'OTHER' |
| `description` | `String?` |  |
| `blockedAt` | `DateTime` | @default(now()) |
| `blockedByUserId` | `String` |  |
| `approvedReleaseRoles` | `String[]` | // who can release |
| `releasedAt` | `DateTime?` |  |
| `releasedByUserId` | `String?` |  |
| `releaseReason` | `String?` |  |
| `active` | `Boolean` | @default(true) |

## Model: `DiscountOpportunity`
| الحقل | النوع | الوصف |
|---|---|---|
| `id` | `Int` | @id @default(autoincrement()) |
| `tenantId` | `String` | @default("default") @map("tenant_id") |
| `invoiceId` | `Int` |  |
| `supplierId` | `Int` |  |
| `invoiceAmount` | `Decimal` | @db.Decimal(20, 4) |
| `discountPercent` | `Decimal` | @db.Decimal(5, 2) |
| `discountAmount` | `Decimal` | @db.Decimal(20, 4) |
| `discountWindowEnds` | `DateTime` |  |
| `netDueDate` | `DateTime` |  |
| `annualizedReturn` | `Decimal` | @db.Decimal(8, 4) // implied APR if discount taken |
| `status` | `String` | @default("AVAILABLE") // 'AVAILABLE' | 'TAKEN' | 'FORFEITED' | 'EXPIRED' |
| `takenInRunId` | `Int?` |  |
| `calculatedAt` | `DateTime` | @default(now()) |

## Model: `WHTRule`
| الحقل | النوع | الوصف |
|---|---|---|
| `id` | `Int` | @id @default(autoincrement()) |
| `tenantId` | `String` | @default("default") @map("tenant_id") |
| `countryCode` | `String` | @map("country_code") |
| `serviceType` | `String` | @map("service_type") |
| `residentRate` | `Decimal` | @map("resident_rate") @db.Decimal(8, 4) |
| `nonResidentRate` | `Decimal` | @map("non_resident_rate") @db.Decimal(8, 4) |
| `effectiveFrom` | `DateTime` | @map("effective_from") |
| `treatyOverrides` | `String?` | @map("treaty_overrides") |

## Model: `WHTTransaction`
| الحقل | النوع | الوصف |
|---|---|---|
| `id` | `Int` | @id @default(autoincrement()) |
| `tenantId` | `String` | @default("default") @map("tenant_id") |
| `supplierId` | `Int` | @map("supplier_id") |
| `invoiceId` | `Int` | @map("invoice_id") |
| `baseAmount` | `Decimal` | @map("base_amount") @db.Decimal(20, 4) |
| `whtRate` | `Decimal` | @map("wht_rate") @db.Decimal(8, 4) |
| `whtAmount` | `Decimal` | @map("wht_amount") @db.Decimal(20, 4) |
| `certificateNumber` | `String?` | @map("certificate_number") |
| `paidToZATCA` | `Boolean` | @default(false) @map("paid_to_zatca") |
| `createdAt` | `DateTime` | @default(now()) @map("created_at") |
| `supplier` | `Customer` | @relation(fields: [supplierId], references: [id]) |
| `invoice` | `PurchaseInvoice` | @relation(fields: [invoiceId], references: [id]) |
| `serviceCategory` | `String?` | @map("service_category") // RENT | ROYALTY | TECHNICAL | DIVIDENDS | MGMT_FEES |
| `treatyApplied` | `Boolean` | @default(false) @map("treaty_applied") |
| `treatyCountry` | `String?` | @map("treaty_country") |
| `form14BatchId` | `Int?` | @map("form14_batch_id") |
| `form14Batch` | `WhtForm14Batch?` | @relation(fields: [form14BatchId], references: [id]) |

## Model: `WhtForm14Batch`
| الحقل | النوع | الوصف |
|---|---|---|
| `id` | `Int` | @id @default(autoincrement()) |
| `tenantId` | `String` | @default("default") @map("tenant_id") |
| `period` | `String` | // YYYY-MM |
| `totalGross` | `Decimal` | @map("total_gross") @db.Decimal(20, 4) |
| `totalWht` | `Decimal` | @map("total_wht") @db.Decimal(20, 4) |
| `status` | `String` | @default("DRAFT") // DRAFT | SUBMITTED | FILED | REJECTED |
| `zatcaRef` | `String?` | @map("zatca_ref") |
| `filedAt` | `DateTime?` | @map("filed_at") |
| `xmlPayload` | `String?` | @map("xml_payload") @db.Text |
| `createdAt` | `DateTime` | @default(now()) @map("created_at") |
| `transactions` | `WHTTransaction[]` |  |

## Model: `ECLModel`
| الحقل | النوع | الوصف |
|---|---|---|
| `id` | `Int` | @id @default(autoincrement()) |
| `tenantId` | `String` | @default("default") @map("tenant_id") |
| `customerSegment` | `String` | @map("customer_segment") |
| `stage1Pct` | `Decimal` | @map("stage1_pct") @db.Decimal(8, 4) |
| `stage2Pct` | `Decimal` | @map("stage2_pct") @db.Decimal(8, 4) |
| `stage3Pct` | `Decimal` | @map("stage3_pct") @db.Decimal(8, 4) |
| `lookbackMonths` | `Int` | @default(12) @map("lookback_months") |

## Model: `ECLAssessment`
| الحقل | النوع | الوصف |
|---|---|---|
| `id` | `Int` | @id @default(autoincrement()) |
| `tenantId` | `String` | @default("default") @map("tenant_id") |
| `customerId` | `Int` | @map("customer_id") |
| `fiscalPeriodId` | `Int` | @map("fiscal_period_id") |
| `exposure` | `Decimal` | @db.Decimal(20, 4) |
| `stage` | `Int` | // 1, 2, or 3 |
| `probabilityOfDefault` | `Decimal` | @map("probability_of_default") @db.Decimal(8, 4) |
| `lossGivenDefault` | `Decimal` | @map("loss_given_default") @db.Decimal(20, 4) |
| `eclAmount` | `Decimal` | @map("ecl_amount") @db.Decimal(20, 4) |
| `runAt` | `DateTime` | @default(now()) @map("run_at") |
| `customer` | `Customer` | @relation(fields: [customerId], references: [id]) |

## Model: `StandardCostVersion`
| الحقل | النوع | الوصف |
|---|---|---|
| `id` | `Int` | @id @default(autoincrement()) |
| `tenantId` | `String` | @default("default") @map("tenant_id") |
| `productId` | `Int` | @map("product_id") |
| `effectiveFrom` | `DateTime` | @map("effective_from") |
| `materialCost` | `Decimal` | @map("material_cost") @db.Decimal(20, 4) |
| `laborCost` | `Decimal` | @map("labor_cost") @db.Decimal(20, 4) |
| `overheadCost` | `Decimal` | @map("overhead_cost") @db.Decimal(20, 4) |
| `totalStdCost` | `Decimal` | @map("total_std_cost") @db.Decimal(20, 4) |
| `isActive` | `Boolean` | @default(true) @map("is_active") |
| `product` | `Product` | @relation(fields: [productId], references: [id]) |

## Model: `VarianceTransaction`
| الحقل | النوع | الوصف |
|---|---|---|
| `id` | `Int` | @id @default(autoincrement()) |
| `tenantId` | `String` | @default("default") @map("tenant_id") |
| `type` | `String` | // PURCHASE_PRICE, MATERIAL_USAGE, LABOR_RATE, OVERHEAD_VOLUME |
| `productId` | `Int` | @map("product_id") |
| `manufacturingOrderId` | `Int?` | @map("manufacturing_order_id") |
| `amount` | `Decimal` |  |
| `debit` | `Decimal` | @db.Decimal(20, 4) |
| `credit` | `Decimal` | @db.Decimal(20, 4) |
| `postedAt` | `DateTime` | @default(now()) @map("posted_at") |
| `product` | `Product` | @relation(fields: [productId], references: [id]) |
| `mo` | `ManufacturingOrder?` | @relation(fields: [manufacturingOrderId], references: [id]) |

## Model: `SubcontractingPO`
| الحقل | النوع | الوصف |
|---|---|---|
| `id` | `Int` | @id @default(autoincrement()) |
| `tenantId` | `String` | @default("default") @map("tenant_id") |
| `supplierId` | `Int` | @map("supplier_id") |
| `productToReceive` | `Int` | @map("product_to_receive") |
| `productsToSend` | `String` | @map("products_to_send") // JSON array |
| `expectedDate` | `DateTime` | @map("expected_date") |
| `status` | `String` | @default("DRAFT") // DRAFT, ISSUED, PARTIAL_RECEIPT, COMPLETED |
| `createdAt` | `DateTime` | @default(now()) @map("created_at") |
| `supplier` | `Customer` | @relation(fields: [supplierId], references: [id]) |
| `product` | `Product` | @relation(fields: [productToReceive], references: [id]) |
| `movements` | `SubcontractMovement[]` |  |

## Model: `SubcontractMovement`
| الحقل | النوع | الوصف |
|---|---|---|
| `id` | `Int` | @id @default(autoincrement()) |
| `tenantId` | `String` | @default("default") @map("tenant_id") |
| `scPoId` | `Int` | @map("sc_po_id") |
| `type` | `String` | // ISSUE, RETURN, RECEIVE_FINISHED |
| `productId` | `Int` | @map("product_id") |
| `qty` | `Decimal` | @db.Decimal(20, 4) |
| `postedAt` | `DateTime` | @default(now()) @map("posted_at") |
| `po` | `SubcontractingPO` | @relation(fields: [scPoId], references: [id]) |
| `product` | `Product` | @relation(fields: [productId], references: [id]) |

## Model: `QualitySpec`
| الحقل | النوع | الوصف |
|---|---|---|
| `id` | `Int` | @id @default(autoincrement()) |
| `tenantId` | `String` | @default("default") @map("tenant_id") |
| `productId` | `Int` | @unique @map("product_id") |
| `parameters` | `String` | // JSON e.g. {"moisture": {"min": 2, "max": 5}} |
| `createdAt` | `DateTime` | @default(now()) @map("created_at") |
| `product` | `Product` | @relation(fields: [productId], references: [id]) |

## Model: `NonConformanceReport`
| الحقل | النوع | الوصف |
|---|---|---|
| `id` | `Int` | @id @default(autoincrement()) |
| `tenantId` | `String` | @default("default") @map("tenant_id") |
| `inspectionId` | `Int` | @map("inspection_id") |
| `severity` | `String` | // LOW, MEDIUM, HIGH, CRITICAL |
| `description` | `String` |  |
| `dispositionType` | `String` | @map("disposition_type") // USE_AS_IS, REWORK, RETURN_VENDOR, SCRAP |
| `costImpact` | `Decimal` | @default(0) @map("cost_impact") @db.Decimal(20, 4) |
| `createdAt` | `DateTime` | @default(now()) @map("created_at") |
| `inspection` | `QualityInspection` | @relation(fields: [inspectionId], references: [id]) |
| `capas` | `CorrectiveAction[]` |  |

## Model: `CorrectiveAction`
| الحقل | النوع | الوصف |
|---|---|---|
| `id` | `Int` | @id @default(autoincrement()) |
| `tenantId` | `String` | @default("default") @map("tenant_id") |
| `ncrId` | `Int` | @map("ncr_id") |
| `rootCause` | `String` | @map("root_cause") |
| `action` | `String` |  |
| `owner` | `String` |  |
| `dueDate` | `DateTime` | @map("due_date") |
| `status` | `String` | @default("OPEN") // OPEN, IN_PROGRESS, CLOSED |
| `effectivenessReview` | `String?` | @map("effectiveness_review") |
| `ncr` | `NonConformanceReport` | @relation(fields: [ncrId], references: [id]) |

## Model: `MasterProductionSchedule`
| الحقل | النوع | الوصف |
|---|---|---|
| `id` | `Int` | @id @default(autoincrement()) |
| `tenantId` | `String` | @default("default") @map("tenant_id") |
| `period` | `String` | // e.g. "2026-W18" or "2026-05" |
| `productId` | `Int` | @map("product_id") |
| `scheduledQty` | `Decimal` | @map("scheduled_qty") @db.Decimal(20, 4) |
| `demandSource` | `String?` | @map("demand_source") // JSON e.g. {"salesForecast": 500, "openOrders": 200} |
| `status` | `String` | @default("DRAFT") // DRAFT, APPROVED, IN_PROGRESS, DONE |
| `createdAt` | `DateTime` | @default(now()) @map("created_at") |

## Model: `CapacityCalendar`
| الحقل | النوع | الوصف |
|---|---|---|
| `id` | `Int` | @id @default(autoincrement()) |
| `tenantId` | `String` | @default("default") @map("tenant_id") |
| `workCenterId` | `Int` | @map("work_center_id") |
| `date` | `DateTime` |  |
| `availableHours` | `Decimal` | @default(8) @map("available_hours") @db.Decimal(20, 4) |
| `plannedHours` | `Decimal` | @default(0) @map("planned_hours") @db.Decimal(20, 4) |
| `actualHours` | `Decimal` | @default(0) @map("actual_hours") @db.Decimal(20, 4) |
| `utilizationPct` | `Decimal` | @default(0) @map("utilization_pct") @db.Decimal(20, 4) |

## Model: `ScheduledOperation`
| الحقل | النوع | الوصف |
|---|---|---|
| `id` | `Int` | @id @default(autoincrement()) |
| `tenantId` | `String` | @default("default") @map("tenant_id") |
| `manufacturingOrderId` | `Int` | @map("manufacturing_order_id") |
| `operationId` | `Int` | @map("operation_id") |
| `workCenterId` | `Int` | @map("work_center_id") |
| `plannedStart` | `DateTime` | @map("planned_start") |
| `plannedEnd` | `DateTime` | @map("planned_end") |
| `sequence` | `Int` | @default(1) |
| `status` | `String` | @default("PLANNED") // PLANNED, SCHEDULED, IN_PROGRESS, DONE |
| `dependencies` | `String?` | // JSON array of operation IDs |

## Model: `RMA`
| الحقل | النوع | الوصف |
|---|---|---|
| `id` | `Int` | @id @default(autoincrement()) |
| `tenantId` | `String` | @default("default") @map("tenant_id") |
| `salesInvoiceId` | `Int` | @map("sales_invoice_id") |
| `customerId` | `Int` | @map("customer_id") |
| `requestedAt` | `DateTime` | @default(now()) @map("requested_at") |
| `requestedBy` | `String?` | @map("requested_by") |
| `reason` | `String` | // DEFECTIVE, WRONG_ITEM, DAMAGED_SHIPPING, CHANGED_MIND, WARRANTY |
| `status` | `String` | @default("REQUESTED") // REQUESTED, APPROVED, REJECTED, RECEIVED, REFUNDED, CLOSED |
| `resolution` | `String?` | // REFUND, REPLACE, REPAIR, CREDIT_NOTE |
| `approvedBy` | `String?` | @map("approved_by") |
| `items` | `String` | // JSON |
| `notes` | `String?` |  |

## Model: `WarrantyClaim`
| الحقل | النوع | الوصف |
|---|---|---|
| `id` | `Int` | @id @default(autoincrement()) |
| `tenantId` | `String` | @default("default") @map("tenant_id") |
| `productId` | `Int` | @map("product_id") |
| `serialNumber` | `String?` | @map("serial_number") |
| `customerId` | `Int` | @map("customer_id") |
| `soldDate` | `DateTime` | @map("sold_date") |
| `warrantyExpiry` | `DateTime` | @map("warranty_expiry") |
| `issueDescription` | `String` | @map("issue_description") |
| `claimDate` | `DateTime` | @default(now()) @map("claim_date") |
| `status` | `String` | @default("OPEN") // OPEN, IN_PROGRESS, RESOLVED, REJECTED |
| `repairOrderId` | `Int?` | @map("repair_order_id") |
| `replacementOrderId` | `Int?` | @map("replacement_order_id") |

## Model: `WarrantyPolicy`
| الحقل | النوع | الوصف |
|---|---|---|
| `id` | `Int` | @id @default(autoincrement()) |
| `tenantId` | `String` | @default("default") @map("tenant_id") |
| `productId` | `Int?` | @map("product_id") |
| `categoryId` | `Int?` | @map("category_id") |
| `durationMonths` | `Int` | @map("duration_months") |
| `type` | `String` | @default("LIMITED") // LIMITED, FULL, EXTENDED |
| `conditions` | `String?` | // TEXT |
| `costToCustomer` | `Decimal` | @default(0) @map("cost_to_customer") @db.Decimal(20, 4) |

## Model: `InvoiceMatchResult`
| الحقل | النوع | الوصف |
|---|---|---|
| `id` | `Int` | @id @default(autoincrement()) |
| `tenantId` | `String` | @default("default") @map("tenant_id") |
| `invoiceId` | `Int` | @map("invoice_id") |
| `status` | `String` | @default("MANUAL_REVIEW") // MATCHED, HOLD_PRICE, HOLD_QTY, HOLD_TOTAL, MANUAL_REVIEW |
| `priceDiff` | `Decimal` | @default(0) @map("price_diff") @db.Decimal(20, 4) |
| `qtyDiff` | `Decimal` | @default(0) @map("qty_diff") @db.Decimal(20, 4) |
| `totalDiff` | `Decimal` | @default(0) @map("total_diff") @db.Decimal(20, 4) |
| `resolvedBy` | `String?` | @map("resolved_by") |
| `resolvedAt` | `DateTime?` | @map("resolved_at") |
| `resolution` | `String?` |  |

## Model: `AccountingBook`
| الحقل | النوع | الوصف |
|---|---|---|
| `id` | `Int` | @id @default(autoincrement()) |
| `tenantId` | `String` | @default("default") @map("tenant_id") |
| `code` | `String` | @unique |
| `name` | `String` | @default("Book") |
| `nameAr` | `String?` |  |
| `description` | `String?` |  |
| `type` | `String` | @default("PRIMARY") // 'PRIMARY' | 'TAX' | 'MANAGEMENT' | 'GROUP' | 'STATUTORY' | 'REGULATORY' |
| `gaapStandard` | `String` | @default("IFRS") // 'IFRS' | 'SOCPA' | 'US_GAAP' | 'IND_AS' | 'ZAKAT' | 'HKFRS' | 'ASPE' | 'CUSTOM' |
| `baseCurrency` | `String` | @default("SAR") |
| `isPrimary` | `Boolean` | @default(false) |
| `isActive` | `Boolean` | @default(true) |
| `fiscalYearStart` | `String` | @default("01-01") // MM-DD |
| `sourceBookId` | `Int?` |  |
| `sourceBook` | `AccountingBook?` | @relation("BookReplication", fields: [sourceBookId], references: [id]) |
| `derivedBooks` | `AccountingBook[]` | @relation("BookReplication") |
| `autoReplicate` | `Boolean` | @default(true) |
| `replicateOnPost` | `Boolean` | @default(true) |
| `exchangeRateSource` | `String` | @default("ECB") // 'ECB' | 'SAMA' | 'CUSTOM' | 'MANUAL' |
| `exchangeRateMethod` | `String` | @default("AVERAGE") // 'AVERAGE' | 'CLOSING' | 'HISTORICAL' | 'TRANSACTION' |
| `createdByUserId` | `String` | @default("system") |
| `createdAt` | `DateTime` | @default(now()) |
| `updatedAt` | `DateTime` | @updatedAt |
| `mappings` | `AccountMapping[]` |  |
| `journalEntries` | `JournalEntry[]` |  |
| `bookAComparisons` | `BookComparison[]` | @relation("BookCompA") |
| `bookBComparisons` | `BookComparison[]` | @relation("BookCompB") |

## Model: `AccountMapping`
| الحقل | النوع | الوصف |
|---|---|---|
| `id` | `Int` | @id @default(autoincrement()) |
| `tenantId` | `String` | @default("default") @map("tenant_id") |
| `bookId` | `Int` |  |
| `book` | `AccountingBook` | @relation(fields: [bookId], references: [id], onDelete: Cascade) |
| `sourceAccountId` | `Int` |  |
| `sourceAccount` | `Account` | @relation("SourceAccount", fields: [sourceAccountId], references: [id]) |
| `targetAccountId` | `Int?` |  |
| `targetAccount` | `Account?` | @relation("TargetAccount", fields: [targetAccountId], references: [id]) |
| `rule` | `String` | // 'PASS' | 'EXCLUDE' | 'AMOUNT_PCT' | 'SPLIT' | 'CURRENCY_TRANSLATE' | 'CUSTOM_FORMULA' |
| `ruleParams` | `Json?` | // {pct: 50, splitTo: [{accountId, pct}], formula: 'amount * 0.85', etc.} |
| `effectiveFrom` | `DateTime` | @default(now()) |
| `effectiveTo` | `DateTime?` |  |
| `notes` | `String?` |  |
| `createdByUserId` | `String?` |  |
| `createdAt` | `DateTime` | @default(now()) |

## Model: `AccountMappingTemplate`
| الحقل | النوع | الوصف |
|---|---|---|
| `id` | `Int` | @id @default(autoincrement()) |
| `tenantId` | `String` | @default("default") @map("tenant_id") |
| `code` | `String` | @unique |
| `name` | `String` |  |
| `description` | `String?` |  |
| `fromGaap` | `String` | // 'IFRS' |
| `toGaap` | `String` | // 'ZAKAT' |
| `countryCode` | `String?` |  |
| `industry` | `String?` |  |
| `mappings` | `Json` | // [{sourceAccountCode, targetAccountCode, rule, params}] |
| `isOfficial` | `Boolean` | @default(false) |
| `popularity` | `Int` | @default(0) |
| `rating` | `Decimal?` | @db.Decimal(3, 2) |

## Model: `BookComparison`
| الحقل | النوع | الوصف |
|---|---|---|
| `id` | `Int` | @id @default(autoincrement()) |
| `tenantId` | `String` | @default("default") @map("tenant_id") |
| `bookAId` | `Int` |  |
| `bookA` | `AccountingBook` | @relation("BookCompA", fields: [bookAId], references: [id]) |
| `bookBId` | `Int` |  |
| `bookB` | `AccountingBook` | @relation("BookCompB", fields: [bookBId], references: [id]) |
| `asOfDate` | `DateTime` |  |
| `totalDifference` | `Decimal` | @db.Decimal(20, 4) |
| `differencesDetailed` | `Json` | // [{accountCode, balanceA, balanceB, diff, explanation, mappingId?}] |
| `explanationsCount` | `Int` | @default(0) |
| `unexplainedCount` | `Int` | @default(0) |
| `generatedAt` | `DateTime` | @default(now()) |
| `generatedByUserId` | `String` |  |
| `pdfUrl` | `String?` |  |

## Model: `BookOnlyJournalCategory`
| الحقل | النوع | الوصف |
|---|---|---|
| `id` | `Int` | @id @default(autoincrement()) |
| `tenantId` | `String` | @default("default") @map("tenant_id") |
| `bookId` | `Int` |  |
| `code` | `String` |  |
| `name` | `String` |  |
| `description` | `String?` |  |
| `defaultAccounts` | `Int[]` |  |
| `requiresApproval` | `Boolean` | @default(false) |

## Model: `CustomFieldDefinition`
| الحقل | النوع | الوصف |
|---|---|---|
| `id` | `Int` | @id @default(autoincrement()) |
| `tenantId` | `String` | @default("default") @map("tenant_id") |
| `entityType` | `String` | @map("entity_type") // Customer, Product, Invoice, etc. |
| `fieldName` | `String` | @map("field_name") |
| `fieldLabel` | `String` | @map("field_label") |
| `fieldType` | `String` | @map("field_type") // TEXT, NUMBER, DATE, DROPDOWN, CHECKBOX |
| `validationRule` | `String?` | @map("validation_rule") // JSON e.g. {"min": 0, "max": 100} |
| `isRequired` | `Boolean` | @default(false) @map("is_required") |
| `displayOrder` | `Int` | @default(0) @map("display_order") |
| `sectionName` | `String?` | @map("section_name") |
| `isActive` | `Boolean` | @default(true) @map("is_active") |
| `values` | `CustomFieldValue[]` |  |

## Model: `CustomFieldValue`
| الحقل | النوع | الوصف |
|---|---|---|
| `id` | `Int` | @id @default(autoincrement()) |
| `tenantId` | `String` | @default("default") @map("tenant_id") |
| `definitionId` | `Int` | @map("definition_id") |
| `entityId` | `Int` | @map("entity_id") // The ID of the generic entity |
| `value` | `String` | // Stored as JSON string to preserve type regardless of fieldType |
| `definition` | `CustomFieldDefinition` | @relation(fields: [definitionId], references: [id], onDelete: Cascade) |

## Model: `LeaveBalance`
| الحقل | النوع | الوصف |
|---|---|---|
| `id` | `Int` | @id @default(autoincrement()) |
| `tenantId` | `String` | @default("default") @map("tenant_id") |
| `employeeId` | `Int` | @map("employee_id") |
| `employee` | `Employee` | @relation(fields: [employeeId], references: [id]) |
| `year` | `Int` |  |
| `leaveType` | `String` | @map("leave_type") // ANNUAL, SICK, MATERNITY, etc. |
| `entitlement` | `Decimal` | @db.Decimal(8, 2) // Total days entitled |
| `accrued` | `Decimal` | @default(0) @db.Decimal(8, 2) // Days accrued so far |
| `used` | `Decimal` | @default(0) @db.Decimal(8, 2) // Days used |
| `pending` | `Decimal` | @default(0) @db.Decimal(8, 2) // Days pending approval |
| `carryOver` | `Decimal` | @default(0) @map("carry_over") @db.Decimal(8, 2) // Carried from prev year |
| `balance` | `Decimal` | @default(0) @db.Decimal(8, 2) // Available balance (accrued + carryOver - used - pending) |
| `createdAt` | `DateTime` | @default(now()) @map("created_at") |
| `updatedAt` | `DateTime` | @updatedAt @map("updated_at") |

## Model: `LeaveAccrual`
| الحقل | النوع | الوصف |
|---|---|---|
| `id` | `Int` | @id @default(autoincrement()) |
| `tenantId` | `String` | @default("default") @map("tenant_id") |
| `employeeId` | `Int` | @map("employee_id") |
| `employee` | `Employee` | @relation(fields: [employeeId], references: [id]) |
| `accrualDate` | `DateTime` | @map("accrual_date") |
| `leaveType` | `String` | @map("leave_type") |
| `daysAccrued` | `Decimal` | @map("days_accrued") @db.Decimal(8, 4) |
| `runBy` | `String?` | @map("run_by") |
| `createdAt` | `DateTime` | @default(now()) @map("created_at") |

## Model: `LeaveRequest`
| الحقل | النوع | الوصف |
|---|---|---|
| `id` | `Int` | @id @default(autoincrement()) |
| `tenantId` | `String` | @default("default") @map("tenant_id") |
| `employeeId` | `Int` | @map("employee_id") |
| `employee` | `Employee` | @relation(fields: [employeeId], references: [id]) |
| `leaveType` | `String` | @map("leave_type") |
| `startDate` | `DateTime` | @map("start_date") |
| `endDate` | `DateTime` | @map("end_date") |
| `days` | `Decimal` | @db.Decimal(8, 2) |
| `reason` | `String?` |  |
| `attachmentUrl` | `String?` | @map("attachment_url") |
| `status` | `String` | @default("PENDING") // PENDING, APPROVED, REJECTED |
| `approvedBy` | `Int?` | @map("approved_by") |
| `approvedAt` | `DateTime?` | @map("approved_at") |
| `rejectedBy` | `Int?` | @map("rejected_by") |
| `rejectedAt` | `DateTime?` | @map("rejected_at") |
| `rejectionReason` | `String?` | @map("rejection_reason") |
| `createdAt` | `DateTime` | @default(now()) @map("created_at") |
| `updatedAt` | `DateTime` | @updatedAt @map("updated_at") |

## Model: `DocumentExpiryAlert`
| الحقل | النوع | الوصف |
|---|---|---|
| `id` | `Int` | @id @default(autoincrement()) |
| `tenantId` | `String` | @default("default") @map("tenant_id") |
| `holderType` | `String` | @map("holder_type") // EMPLOYEE, COMPANY |
| `holderId` | `Int?` | @map("holder_id") // Employee ID or null for company docs |
| `holderName` | `String` | @map("holder_name") |
| `documentType` | `String` | @map("document_type") // IQAMA, WORK_PERMIT, CR, PASSPORT, etc. |
| `documentNumber` | `String?` | @map("document_number") |
| `expiryDate` | `DateTime` | @map("expiry_date") |
| `daysRemaining` | `Int` | @map("days_remaining") |
| `severity` | `String` | // EXPIRED, CRITICAL, WARNING, INFO |
| `estimatedCost` | `Decimal?` | @map("estimated_cost") @db.Decimal(15, 2) |
| `status` | `String` | @default("ACTIVE") // ACTIVE, RENEWED, DISMISSED |
| `renewedAt` | `DateTime?` | @map("renewed_at") |
| `renewedBy` | `Int?` | @map("renewed_by") |
| `newExpiryDate` | `DateTime?` | @map("new_expiry_date") |
| `dismissedAt` | `DateTime?` | @map("dismissed_at") |
| `dismissReason` | `String?` | @map("dismiss_reason") |
| `notifiedVia` | `String?` | @map("notified_via") // DASHBOARD, EMAIL, SMS, WHATSAPP |
| `lastNotifiedAt` | `DateTime?` | @map("last_notified_at") |
| `createdAt` | `DateTime` | @default(now()) @map("created_at") |
| `updatedAt` | `DateTime` | @updatedAt @map("updated_at") |

## Model: `BackupRecord`
| الحقل | النوع | الوصف |
|---|---|---|
| `id` | `Int` | @id @default(autoincrement()) |
| `type` | `String` | // FULL, INCREMENTAL, WAL |
| `startedAt` | `DateTime` | @default(now()) @map("started_at") |
| `completedAt` | `DateTime?` | @map("completed_at") |
| `sizeBytes` | `BigInt?` | @map("size_bytes") |
| `location` | `String` | // S3 key or local path |
| `tenantId` | `Int?` | @map("tenant_id") |
| `status` | `String` | // PENDING, COMPLETED, FAILED |
| `restoreTestedAt` | `DateTime?` | @map("restore_tested_at") |
| `errorMessage` | `String?` | @map("error_message") |

## Model: `PaymentGateway`
| الحقل | النوع | الوصف |
|---|---|---|
| `id` | `Int` | @id @default(autoincrement()) |
| `tenantId` | `String` | @default("default") @map("tenant_id") |
| `provider` | `String` | // MOYASAR, HYPERPAY, STRIPE, etc. |
| `credentials` | `String` | // Store JSON as text, ideally encrypted |
| `env` | `String` | @default("TEST") // TEST, PROD |
| `isActive` | `Boolean` | @default(true) @map("is_active") |
| `createdAt` | `DateTime` | @default(now()) @map("created_at") |
| `transactions` | `PaymentTransaction[]` |  |
| `savedMethods` | `SavedPaymentMethod[]` |  |

## Model: `PaymentTransaction`
| الحقل | النوع | الوصف |
|---|---|---|
| `id` | `Int` | @id @default(autoincrement()) |
| `tenantId` | `String` | @default("default") @map("tenant_id") |
| `gatewayId` | `Int` | @map("gateway_id") |
| `invoiceId` | `Int` | @map("invoice_id") |
| `amount` | `Decimal` | @db.Decimal(15, 2) |
| `currency` | `String` | @default("SAR") |
| `method` | `String` | // MADA, VISA, APPLE_PAY |
| `providerTransactionId` | `String?` | @map("provider_transaction_id") |
| `status` | `String` | // PENDING, CAPTURED, FAILED, REFUNDED |
| `failureReason` | `String?` | @map("failure_reason") |
| `createdAt` | `DateTime` | @default(now()) @map("created_at") |
| `capturedAt` | `DateTime?` | @map("captured_at") |
| `refundedAt` | `DateTime?` | @map("refunded_at") |
| `gateway` | `PaymentGateway` | @relation(fields: [gatewayId], references: [id]) |
| `invoice` | `SalesInvoice` | @relation(fields: [invoiceId], references: [id]) |
| `deletedAt` | `DateTime?` | // P1.2 soft-delete ط·آ·ط¢آ·ط·آ¢ط¢آ·ط·آ·ط¢آ¢ط·آ¢ط¢آ·ط·آ·ط¢آ·ط·آ¢ط¢آ¢ط·آ·ط¢آ¢ط·آ¢ط¢آ·ط·آ·ط¢آ·ط·آ¢ط¢آ·ط·آ·ط¢آ¢ط·آ¢ط¢آ¢ط·آ·ط¢آ·ط·آ¢ط¢آ¢ط·آ·ط¢آ¢ط·آ¢ط¢آ£ط·آ·ط¢آ·ط·آ¢ط¢آ·ط·آ·ط¢آ¢ط·آ¢ط¢آ·ط·آ·ط¢آ·ط·آ¢ط¢آ¢ط·آ·ط¢آ¢ط·آ¢ط¢آ¢ط·آ·ط¢آ·ط·آ¢ط¢آ·ط·آ·ط¢آ¢ط·آ¢ط¢آ¢ط·آ·ط¢آ·ط·آ¢ط¢آ¢ط·آ·ط¢آ¢ط·آ¢ط¢آ¢ط·آ·ط¢آ·ط·آ¢ط¢آ·ط·آ·ط¢آ¢ط·آ¢ط¢آ·ط·آ·ط¢آ·ط·آ¢ط¢آ¢ط·آ·ط¢آ¢ط·آ¢ط¢آ£ط·آ·ط¢آ·ط·آ¢ط¢آ·ط·آ·ط¢آ¢ط·آ¢ط¢آ¢ط·آ·ط¢آ·ط·آ¢ط¢آ¢ط·آ·ط¢آ¢ط·آ¢ط¢آ¢ط·آ·ط¢آ·ط·آ¢ط¢آ·ط·آ·ط¢آ¢ط·آ¢ط¢آ£ط·آ·ط¢آ·ط·آ¢ط¢آ¢ط·آ·ط¢آ¢ط·آ¢ط¢آ¢ط·آ·ط¢آ·ط·آ¢ط¢آ£ط·آ·ط¢آ¢ط·آ¢ط¢آ¢ط·آ·ط¢آ£ط·آ¢ط¢آ¢ط·آ£ط¢آ¢ط£آ¢أ¢â€ڑآ¬ط¹â€کط·آ¢ط¢آ¬ط·آ·ط¢آ¹ط£آ¢أ¢â€ڑآ¬ط¹آ©ط·آ·ط¢آ·ط·آ¢ط¢آ¢ط·آ·ط¢آ¢ط·آ¢ط¢آ¬ط·آ·ط¢آ·ط·آ¢ط¢آ·ط·آ·ط¢آ¢ط·آ¢ط¢آ¹ط·آ·ط¢آ£ط·آ¢ط¢آ¢ط·آ£ط¢آ¢ط£آ¢أ¢â€ڑآ¬ط¹â€کط·آ¢ط¢آ¬ط·آ·ط¢آ¹ط·آ¢ط¢آ©ط·آ·ط¢آ·ط·آ¢ط¢آ·ط·آ·ط¢آ¢ط·آ¢ط¢آ·ط·آ·ط¢آ·ط·آ¢ط¢آ¢ط·آ·ط¢آ¢ط·آ¢ط¢آ¢ط·آ·ط¢آ·ط·آ¢ط¢آ·ط·آ·ط¢آ¢ط·آ¢ط¢آ¢ط·آ·ط¢آ·ط·آ¢ط¢آ¢ط·آ·ط¢آ¢ط·آ¢ط¢آ¬ط·آ·ط¢آ·ط·آ¢ط¢آ·ط·آ·ط¢آ¢ط·آ¢ط¢آ·ط·آ·ط¢آ·ط·آ¢ط¢آ¢ط·آ·ط¢آ¢ط·آ¢ط¢آ£ط·آ·ط¢آ·ط·آ¢ط¢آ·ط·آ·ط¢آ¢ط·آ¢ط¢آ¢ط·آ·ط¢آ·ط·آ¢ط¢آ¢ط·آ·ط¢آ¢ط·آ¢ط¢آ¢ط·آ·ط¢آ·ط·آ¢ط¢آ·ط·آ·ط¢آ¢ط·آ¢ط¢آ£ط·آ·ط¢آ·ط·آ¢ط¢آ¢ط·آ·ط¢آ¢ط·آ¢ط¢آ¢ط·آ·ط¢آ·ط·آ¢ط¢آ£ط·آ·ط¢آ¢ط·آ¢ط¢آ¢ط·آ·ط¢آ£ط·آ¢ط¢آ¢ط·آ£ط¢آ¢ط£آ¢أ¢â‚¬ع‘ط¢آ¬ط·آ¹أ¢â‚¬ع©ط·آ·ط¢آ¢ط·آ¢ط¢آ¬ط·آ·ط¢آ·ط·آ¢ط¢آ¹ط·آ£ط¢آ¢ط£آ¢أ¢â‚¬ع‘ط¢آ¬ط·آ¹ط¢آ©ط·آ·ط¢آ·ط·آ¢ط¢آ·ط·آ·ط¢آ¢ط·آ¢ط¢آ¢ط·آ·ط¢آ·ط·آ¢ط¢آ¢ط·آ·ط¢آ¢ط·آ¢ط¢آ¬ط·آ·ط¢آ·ط·آ¢ط¢آ·ط·آ·ط¢آ¢ط·آ¢ط¢آ£ط·آ·ط¢آ·ط·آ¢ط¢آ¢ط·آ·ط¢آ¢ط·آ¢ط¢آ¢ط·آ·ط¢آ·ط·آ¢ط¢آ£ط·آ·ط¢آ¢ط·آ¢ط¢آ¢ط·آ·ط¢آ£ط·آ¢ط¢آ¢ط·آ£ط¢آ¢ط£آ¢أ¢â€ڑآ¬ط¹â€کط·آ¢ط¢آ¬ط·آ·ط¢آ¹ط£آ¢أ¢â€ڑآ¬ط¹آ©ط·آ·ط¢آ·ط·آ¢ط¢آ¢ط·آ·ط¢آ¢ط·آ¢ط¢آ¬ط·آ·ط¢آ·ط·آ¢ط¢آ·ط·آ·ط¢آ¢ط·آ¢ط¢آ¥ط·آ·ط¢آ£ط·آ¢ط¢آ¢ط·آ£ط¢آ¢ط£آ¢أ¢â€ڑآ¬ط¹â€کط·آ¢ط¢آ¬ط·آ£ط¢آ¢ط£آ¢أ¢â€ڑآ¬أ¢â‚¬ع†ط·آ¢ط¢آ¢ do not use hard DELETE |

## Model: `SavedPaymentMethod`
| الحقل | النوع | الوصف |
|---|---|---|
| `id` | `Int` | @id @default(autoincrement()) |
| `tenantId` | `String` | @default("default") @map("tenant_id") |
| `customerId` | `Int` | @map("customer_id") |
| `gatewayId` | `Int` | @map("gateway_id") |
| `type` | `String` | // CARD, TOKEN |
| `last4` | `String?` |  |
| `expiry` | `String?` |  |
| `providerToken` | `String` | @map("provider_token") |
| `isDefault` | `Boolean` | @default(false) @map("is_default") |
| `createdAt` | `DateTime` | @default(now()) @map("created_at") |
| `customer` | `Customer` | @relation(fields: [customerId], references: [id]) |
| `gateway` | `PaymentGateway` | @relation(fields: [gatewayId], references: [id]) |
| `subscriptions` | `CustomerSubscription[]` |  |

## Model: `GovApiCredentials`
| الحقل | النوع | الوصف |
|---|---|---|
| `id` | `Int` | @id @default(autoincrement()) |
| `tenantId` | `String` | @default("default") @map("tenant_id") |
| `provider` | `String` | // MUDAD, QIWA, ABSHER, MUQEEM, GOSI, ZATCA_EGS |
| `apiKey` | `String` | // encrypted |
| `apiSecret` | `String` | // encrypted |
| `env` | `String` | @default("SANDBOX") // SANDBOX, PRODUCTION |
| `accessToken` | `String?` |  |
| `tokenExpiry` | `DateTime?` |  |
| `isActive` | `Boolean` | @default(true) @map("is_active") |
| `transactions` | `GovApiTransaction[]` |  |

## Model: `GovApiTransaction`
| الحقل | النوع | الوصف |
|---|---|---|
| `id` | `Int` | @id @default(autoincrement()) |
| `tenantId` | `String` | @default("default") @map("tenant_id") |
| `provider` | `String` |  |
| `endpoint` | `String` |  |
| `method` | `String` |  |
| `requestBody` | `String?` | // JSON text |
| `responseBody` | `String?` | // JSON text |
| `status` | `String` | // PENDING, SUCCESS, FAILED, RETRYING |
| `errorMessage` | `String?` | @map("error_message") |
| `retryCount` | `Int` | @default(0) @map("retry_count") |
| `createdAt` | `DateTime` | @default(now()) @map("created_at") |
| `credentialsId` | `Int` | @map("credentials_id") |
| `credentials` | `GovApiCredentials` | @relation(fields: [credentialsId], references: [id]) |

## Model: `DunningPolicy`
| الحقل | النوع | الوصف |
|---|---|---|
| `id` | `Int` | @id @default(autoincrement()) |
| `tenantId` | `String` | @default("default") @map("tenant_id") |
| `name` | `String` |  |
| `currency` | `String` | @default("SAR") |
| `customerSegment` | `String?` | @map("customer_segment") |
| `isActive` | `Boolean` | @default(true) @map("is_active") |
| `levels` | `String` | // JSON: array of level thresholds and actions |

## Model: `DunningRun`
| الحقل | النوع | الوصف |
|---|---|---|
| `id` | `Int` | @id @default(autoincrement()) |
| `tenantId` | `String` | @default("default") @map("tenant_id") |
| `runDate` | `DateTime` | @default(now()) @map("run_date") |
| `customerId` | `Int` | @map("customer_id") |
| `invoiceIds` | `String` | // JSON array of invoice IDs |
| `level` | `Int` |  |
| `channelsUsed` | `String` | // JSON array of channels |
| `totalFeesAdded` | `Decimal` | @default(0) @map("total_fees_added") @db.Decimal(20, 4) |
| `status` | `String` | @default("PENDING") // PENDING, SENT, FAILED |
| `errorMessage` | `String?` | @map("error_message") |
| `createdAt` | `DateTime` | @default(now()) @map("created_at") |
| `customer` | `Customer` | @relation(fields: [customerId], references: [id]) |

## Model: `DunningTemplate`
| الحقل | النوع | الوصف |
|---|---|---|
| `id` | `Int` | @id @default(autoincrement()) |
| `tenantId` | `String` | @default("default") @map("tenant_id") |
| `code` | `String` | @unique |
| `language` | `String` | @default("ar") |
| `channel` | `String` | // EMAIL, SMS, WHATSAPP, LETTER |
| `subject` | `String?` |  |
| `bodyHtml` | `String` | @map("body_html") @db.Text |
| `attachStatement` | `Boolean` | @default(true) @map("attach_statement") |

## Model: `PosSession`
| الحقل | النوع | الوصف |
|---|---|---|
| `id` | `Int` | @id @default(autoincrement()) |
| `tenantId` | `String` | @default("default") @map("tenant_id") |
| `userId` | `Int` | @map("user_id") |
| `terminalId` | `Int?` | @map("terminal_id") |
| `branchId` | `Int?` | @map("branch_id") |
| `openingFloat` | `Decimal` | @default(0) @map("opening_float") @db.Decimal(20, 4) |
| `closingFloat` | `Decimal?` | @map("closing_float") @db.Decimal(20, 4) |
| `expectedClosing` | `Decimal?` | @map("expected_closing") @db.Decimal(20, 4) |
| `variance` | `Decimal?` | @db.Decimal(20, 4) |
| `openedAt` | `DateTime` | @default(now()) @map("opened_at") |
| `closedAt` | `DateTime?` | @map("closed_at") |
| `status` | `String` | @default("OPEN") // OPEN, CLOSED |
| `notes` | `String?` |  |
| `user` | `User` | @relation(fields: [userId], references: [id]) |
| `movements` | `PosSessionMovement[]` |  |

## Model: `PosSessionMovement`
| الحقل | النوع | الوصف |
|---|---|---|
| `id` | `Int` | @id @default(autoincrement()) |
| `tenantId` | `String` | @default("default") @map("tenant_id") |
| `sessionId` | `Int` | @map("session_id") |
| `type` | `String` | // CASH_IN, CASH_OUT, DROP, LIFT |
| `amount` | `Decimal` |  |
| `reason` | `String?` |  |
| `createdAt` | `DateTime` | @default(now()) @map("created_at") |
| `session` | `PosSession` | @relation(fields: [sessionId], references: [id], onDelete: Cascade) |

## Model: `CrmAccount`
| الحقل | النوع | الوصف |
|---|---|---|
| `id` | `Int` | @id @default(autoincrement()) |
| `tenantId` | `String` | @default("default") @map("tenant_id") |
| `name` | `String` |  |
| `industry` | `String?` |  |
| `size` | `String?` | // SME, MID, LARGE, ENTERPRISE |
| `website` | `String?` |  |
| `parentAccountId` | `Int?` | @map("parent_account_id") |
| `ownerId` | `Int?` | @map("owner_id") |
| `createdAt` | `DateTime` | @default(now()) @map("created_at") |
| `contacts` | `Contact[]` |  |
| `opportunities` | `Opportunity[]` |  |

## Model: `Contact`
| الحقل | النوع | الوصف |
|---|---|---|
| `id` | `Int` | @id @default(autoincrement()) |
| `tenantId` | `String` | @default("default") @map("tenant_id") |
| `accountId` | `Int` | @map("account_id") |
| `firstName` | `String` | @map("first_name") |
| `lastName` | `String` | @map("last_name") |
| `title` | `String?` |  |
| `email` | `String?` |  |
| `phone` | `String?` |  |
| `mobile` | `String?` |  |
| `isDecisionMaker` | `Boolean` | @default(false) @map("is_decision_maker") |
| `reportsToId` | `Int?` | @map("reports_to_id") |
| `createdBy` | `Int?` | @map("created_by") |
| `account` | `CrmAccount` | @relation(fields: [accountId], references: [id], onDelete: Cascade) |
| `deletedAt` | `DateTime?` | @map("deleted_at") |
| `deletedBy` | `String?` | @map("deleted_by") |

## Model: `PipelineStage`
| الحقل | النوع | الوصف |
|---|---|---|
| `id` | `Int` | @id @default(autoincrement()) |
| `tenantId` | `String` | @default("default") @map("tenant_id") |
| `code` | `String` | @unique |
| `name` | `String` |  |
| `defaultProbability` | `Decimal` | @map("default_probability") @db.Decimal(8, 4) |
| `sortOrder` | `Int` | @map("sort_order") |
| `isWon` | `Boolean` | @default(false) @map("is_won") |
| `isLost` | `Boolean` | @default(false) @map("is_lost") |
| `opportunities` | `Opportunity[]` |  |

## Model: `Opportunity`
| الحقل | النوع | الوصف |
|---|---|---|
| `id` | `Int` | @id @default(autoincrement()) |
| `tenantId` | `String` | @default("default") @map("tenant_id") |
| `accountId` | `Int` | @map("account_id") |
| `name` | `String` |  |
| `amount` | `Decimal` | @default(0) |
| `currency` | `String` | @default("SAR") |
| `stageId` | `Int` | @map("stage_id") |
| `probability` | `Decimal` | @default(0) @db.Decimal(20, 4) |
| `expectedCloseDate` | `DateTime?` | @map("expected_close_date") |
| `actualCloseDate` | `DateTime?` | @map("actual_close_date") |
| `ownerId` | `Int?` | @map("owner_id") |
| `source` | `String?` |  |
| `leadId` | `Int?` | @map("lead_id") |
| `products` | `String?` | // JSON |
| `lostReason` | `String?` | @map("lost_reason") |
| `wonReason` | `String?` | @map("won_reason") |
| `customerId` | `Int?` | @map("customer_id") |
| `createdAt` | `DateTime` | @default(now()) @map("created_at") |
| `account` | `CrmAccount` | @relation(fields: [accountId], references: [id]) |
| `stage` | `PipelineStage` | @relation(fields: [stageId], references: [id]) |
| `activities` | `Activity[]` |  |

## Model: `Activity`
| الحقل | النوع | الوصف |
|---|---|---|
| `id` | `Int` | @id @default(autoincrement()) |
| `tenantId` | `String` | @default("default") @map("tenant_id") |
| `type` | `String` | // CALL, EMAIL, MEETING, TASK, NOTE |
| `subject` | `String` |  |
| `description` | `String?` | @db.Text |
| `accountId` | `Int?` | @map("account_id") |
| `contactId` | `Int?` | @map("contact_id") |
| `opportunityId` | `Int?` | @map("opportunity_id") |
| `leadId` | `Int?` | @map("lead_id") |
| `ownerId` | `Int?` | @map("owner_id") |
| `dueDate` | `DateTime?` | @map("due_date") |
| `completedAt` | `DateTime?` | @map("completed_at") |
| `durationMinutes` | `Int?` | @map("duration_minutes") |
| `outcome` | `String?` | // POSITIVE, NEUTRAL, NEGATIVE |
| `createdAt` | `DateTime` | @default(now()) @map("created_at") |
| `opportunity` | `Opportunity?` | @relation(fields: [opportunityId], references: [id]) |

## Model: `SubscriptionPlan`
| الحقل | النوع | الوصف |
|---|---|---|
| `id` | `Int` | @id @default(autoincrement()) |
| `tenantId` | `String` | @default("default") @map("tenant_id") |
| `code` | `String` | @unique |
| `name` | `String` |  |
| `billingCycle` | `String` | // MONTHLY, QUARTERLY, YEARLY |
| `price` | `Decimal` |  |
| `setupFee` | `Decimal?` | @map("setup_fee") @db.Decimal(20, 4) |
| `trialDays` | `Int` | @default(0) @map("trial_days") |
| `features` | `String?` | // JSON |
| `isActive` | `Boolean` | @default(true) @map("is_active") |
| `createdAt` | `DateTime` | @default(now()) @map("created_at") |
| `subscriptions` | `CustomerSubscription[]` |  |

## Model: `CustomerSubscription`
| الحقل | النوع | الوصف |
|---|---|---|
| `id` | `Int` | @id @default(autoincrement()) |
| `tenantId` | `String` | @default("default") @map("tenant_id") |
| `customerId` | `Int` | @map("customer_id") |
| `planId` | `Int` | @map("plan_id") |
| `startDate` | `DateTime` | @default(now()) @map("start_date") |
| `currentPeriodStart` | `DateTime` | @map("current_period_start") |
| `currentPeriodEnd` | `DateTime` | @map("current_period_end") |
| `nextBillingDate` | `DateTime` | @map("next_billing_date") |
| `status` | `String` | @default("ACTIVE") // TRIAL, ACTIVE, PAST_DUE, PAUSED, CANCELLED, ENDED |
| `cancelAtPeriodEnd` | `Boolean` | @default(false) @map("cancel_at_period_end") |
| `paymentMethodId` | `Int?` | @map("payment_method_id") |
| `prorationCredit` | `Decimal` | @default(0) @map("proration_credit") @db.Decimal(20, 4) |
| `createdAt` | `DateTime` | @default(now()) @map("created_at") |
| `customer` | `Customer` | @relation(fields: [customerId], references: [id]) |
| `plan` | `SubscriptionPlan` | @relation(fields: [planId], references: [id]) |
| `paymentMethod` | `SavedPaymentMethod?` | @relation(fields: [paymentMethodId], references: [id]) |
| `invoices` | `SubscriptionInvoice[]` |  |

## Model: `SubscriptionInvoice`
| الحقل | النوع | الوصف |
|---|---|---|
| `id` | `Int` | @id @default(autoincrement()) |
| `tenantId` | `String` | @default("default") @map("tenant_id") |
| `subscriptionId` | `Int` | @map("subscription_id") |
| `periodStart` | `DateTime` | @map("period_start") |
| `periodEnd` | `DateTime` | @map("period_end") |
| `amount` | `Decimal` |  |
| `salesInvoiceId` | `Int?` | @map("sales_invoice_id") |
| `status` | `String` | @default("PENDING") // PENDING, PAID, FAILED |
| `createdAt` | `DateTime` | @default(now()) @map("created_at") |
| `subscription` | `CustomerSubscription` | @relation(fields: [subscriptionId], references: [id], onDelete: Cascade) |
| `salesInvoice` | `SalesInvoice?` | @relation(fields: [salesInvoiceId], references: [id]) |

## Model: `AttributeGroup`
| الحقل | النوع | الوصف |
|---|---|---|
| `id` | `Int` | @id @default(autoincrement()) |
| `tenantId` | `String` | @default("default") @map("tenant_id") |
| `name` | `String` | // e.g. "Size", "Color" |
| `values` | `String?` | // JSON array of values e.g. ["S", "M", "L"] |

## Model: `StatementTemplate`
| الحقل | النوع | الوصف |
|---|---|---|
| `id` | `Int` | @id @default(autoincrement()) |
| `tenantId` | `String` | @default("default") @map("tenant_id") |
| `name` | `String` |  |
| `nameAr` | `String` |  |
| `description` | `String?` |  |
| `isDefault` | `Boolean` | @default(false) |
| `isActive` | `Boolean` | @default(true) |
| `language` | `String` | @default("ar") // ar | en | bilingual |
| `layoutType` | `String` | @default("STANDARD") // STANDARD | DETAILED | SUMMARY | LEGAL |
| `logoUrl` | `String?` |  |
| `primaryColor` | `String` | @default("#1e40af") |
| `accentColor` | `String` | @default("#dbeafe") |
| `fontFamily` | `String` | @default("Cairo") |
| `sections` | `Json` | // [{type: 'HEADER', visible: true, order: 1, config: {}}, ...] |
| `headerHtml` | `String?` | @db.Text |
| `footerHtml` | `String?` | @db.Text |
| `emailSubject` | `String` | // "ط·آ·ط¢آ·ط·آ¢ط¢آ·ط·آ·ط¢آ¢ط·آ¢ط¢آ·ط·آ·ط¢آ·ط·آ¢ط¢آ¢ط·آ·ط¢آ¢ط·آ¢ط¢آ·ط·آ·ط¢آ·ط·آ¢ط¢آ·ط·آ·ط¢آ¢ط·آ¢ط¢آ¢ط·آ·ط¢آ·ط·آ¢ط¢آ¢ط·آ·ط¢آ¢ط·آ¢ط¢آ·ط·آ·ط¢آ·ط·آ¢ط¢آ·ط·آ·ط¢آ¢ط·آ¢ط¢آ·ط·آ·ط¢آ·ط·آ¢ط¢آ¢ط·آ·ط¢آ¢ط·آ¢ط¢آ¢ط·آ·ط¢آ·ط·آ¢ط¢آ·ط·آ·ط¢آ¢ط·آ¢ط¢آ¢ط·آ·ط¢آ·ط·آ¢ط¢آ¢ط·آ·ط¢آ¢ط·آ¢ط¢آ¸ط·آ·ط¢آ·ط·آ¢ط¢آ·ط·آ·ط¢آ¢ط·آ¢ط¢آ·ط·آ·ط¢آ·ط·آ¢ط¢آ¢ط·آ·ط¢آ¢ط·آ¢ط¢آ·ط·آ·ط¢آ·ط·آ¢ط¢آ·ط·آ·ط¢آ¢ط·آ¢ط¢آ¢ط·آ·ط¢آ·ط·آ¢ط¢آ¢ط·آ·ط¢آ¢ط·آ¢ط¢آ¦ط·آ·ط¢آ·ط·آ¢ط¢آ·ط·آ·ط¢آ¢ط·آ¢ط¢آ£ط·آ·ط¢آ·ط·آ¢ط¢آ¢ط·آ·ط¢آ¢ط·آ¢ط¢آ¢ط·آ·ط¢آ·ط·آ¢ط¢آ£ط·آ·ط¢آ¢ط·آ¢ط¢آ¢ط·آ·ط¢آ£ط·آ¢ط¢آ¢ط·آ£ط¢آ¢ط£آ¢أ¢â€ڑآ¬ط¹â€کط·آ¢ط¢آ¬ط·آ·ط¢آ¹ط£آ¢أ¢â€ڑآ¬ط¹آ©ط·آ·ط¢آ·ط·آ¢ط¢آ¢ط·آ·ط¢آ¢ط·آ¢ط¢آ¬ط·آ·ط¢آ·ط·آ¢ط¢آ£ط·آ·ط¢آ¢ط·آ¢ط¢آ¢ط·آ·ط¢آ£ط·آ¢ط¢آ¢ط·آ£ط¢آ¢ط£آ¢أ¢â€ڑآ¬ط¹â€کط·آ¢ط¢آ¬ط·آ£ط¢آ¢ط£آ¢أ¢â‚¬ع‘ط¢آ¬ط·آ¹أ¢â‚¬آ ط·آ·ط¢آ·ط·آ¢ط¢آ¢ط·آ·ط¢آ¢ط·آ¢ط¢آ¢ط·آ·ط¢آ·ط·آ¢ط¢آ·ط·آ·ط¢آ¢ط·آ¢ط¢آ·ط·آ·ط¢آ·ط·آ¢ط¢آ¢ط·آ·ط¢آ¢ط·آ¢ط¢آ·ط·آ·ط¢آ·ط·آ¢ط¢آ·ط·آ·ط¢آ¢ط·آ¢ط¢آ¢ط·آ·ط¢آ·ط·آ¢ط¢آ¢ط·آ·ط¢آ¢ط·آ¢ط¢آ·ط·آ·ط¢آ·ط·آ¢ط¢آ·ط·آ·ط¢آ¢ط·آ¢ط¢آ·ط·آ·ط¢آ·ط·آ¢ط¢آ¢ط·آ·ط¢آ¢ط·آ¢ط¢آ¢ط·آ·ط¢آ·ط·آ¢ط¢آ·ط·آ·ط¢آ¢ط·آ¢ط¢آ¢ط·آ·ط¢آ·ط·آ¢ط¢آ¢ط·آ·ط¢آ¢ط·آ¢ط¢آ·ط·آ·ط¢آ·ط·آ¢ط¢آ·ط·آ·ط¢آ¢ط·آ¢ط¢آ·ط·آ·ط¢آ·ط·آ¢ط¢آ¢ط·آ·ط¢آ¢ط·آ¢ط¢آ·ط·آ·ط¢آ·ط·آ¢ط¢آ·ط·آ·ط¢آ¢ط·آ¢ط¢آ¢ط·آ·ط¢آ·ط·آ¢ط¢آ¢ط·آ·ط¢آ¢ط·آ¢ط¢آ¢ط·آ·ط¢آ·ط·آ¢ط¢آ·ط·آ·ط¢آ¢ط·آ¢ط¢آ·ط·آ·ط¢آ·ط·آ¢ط¢آ¢ط·آ·ط¢آ¢ط·آ¢ط¢آ¢ط·آ·ط¢آ·ط·آ¢ط¢آ·ط·آ·ط¢آ¢ط·آ¢ط¢آ¢ط·آ·ط¢آ·ط·آ¢ط¢آ¢ط·آ·ط¢آ¢ط·آ¢ط¢آ´ط·آ·ط¢آ·ط·آ¢ط¢آ·ط·آ·ط¢آ¢ط·آ¢ط¢آ·ط·آ·ط¢آ·ط·آ¢ط¢آ¢ط·آ·ط¢آ¢ط·آ¢ط¢آ·ط·آ·ط¢آ·ط·آ¢ط¢آ·ط·آ·ط¢آ¢ط·آ¢ط¢آ¢ط·آ·ط¢آ·ط·آ¢ط¢آ¢ط·آ·ط¢آ¢ط·آ¢ط¢آ·ط·آ·ط¢آ·ط·آ¢ط¢آ·ط·آ·ط¢آ¢ط·آ¢ط¢آ·ط·آ·ط¢آ·ط·آ¢ط¢آ¢ط·آ·ط¢آ¢ط·آ¢ط¢آ¢ط·آ·ط¢آ·ط·آ¢ط¢آ·ط·آ·ط¢آ¢ط·آ¢ط¢آ¢ط·آ·ط¢آ·ط·آ¢ط¢آ¢ط·آ·ط¢آ¢ط·آ¢ط¢آ¸ط·آ·ط¢آ·ط·آ¢ط¢آ·ط·آ·ط¢آ¢ط·آ¢ط¢آ·ط·آ·ط¢آ·ط·آ¢ط¢آ¢ط·آ·ط¢آ¢ط·آ¢ط¢آ·ط·آ·ط¢آ·ط·آ¢ط¢آ·ط·آ·ط¢آ¢ط·آ¢ط¢آ¢ط·آ·ط¢آ·ط·آ¢ط¢آ¢ط·آ·ط¢آ¢ط·آ¢ط¢آ¸ط·آ·ط¢آ·ط·آ¢ط¢آ·ط·آ·ط¢آ¢ط·آ¢ط¢آ·ط·آ·ط¢آ·ط·آ¢ط¢آ¢ط·آ·ط¢آ¢ط·آ¢ط¢آ¢ط·آ·ط¢آ·ط·آ¢ط¢آ·ط·آ·ط¢آ¢ط·آ¢ط¢آ¢ط·آ·ط¢آ·ط·آ¢ط¢آ¢ط·آ·ط¢آ¢ط·آ¢ط¢آ¾ ط·آ·ط¢آ·ط·آ¢ط¢آ·ط·آ·ط¢آ¢ط·آ¢ط¢آ·ط·آ·ط¢آ·ط·آ¢ط¢آ¢ط·آ·ط¢آ¢ط·آ¢ط¢آ·ط·آ·ط¢آ·ط·آ¢ط¢آ·ط·آ·ط¢آ¢ط·آ¢ط¢آ¢ط·آ·ط¢آ·ط·آ¢ط¢آ¢ط·آ·ط¢آ¢ط·آ¢ط¢آ·ط·آ·ط¢آ·ط·آ¢ط¢آ·ط·آ·ط¢آ¢ط·آ¢ط¢آ·ط·آ·ط¢آ·ط·آ¢ط¢آ¢ط·آ·ط¢آ¢ط·آ¢ط¢آ¢ط·آ·ط¢آ·ط·آ¢ط¢آ·ط·آ·ط¢آ¢ط·آ¢ط¢آ¢ط·آ·ط¢آ·ط·آ¢ط¢آ¢ط·آ·ط¢آ¢ط·آ¢ط¢آ·ط·آ·ط¢آ·ط·آ¢ط¢آ·ط·آ·ط¢آ¢ط·آ¢ط¢آ·ط·آ·ط¢آ·ط·آ¢ط¢آ¢ط·آ·ط¢آ¢ط·آ¢ط¢آ·ط·آ·ط¢آ·ط·آ¢ط¢آ·ط·آ·ط¢آ¢ط·آ¢ط¢آ¢ط·آ·ط¢آ·ط·آ¢ط¢آ¢ط·آ·ط¢آ¢ط·آ¢ط¢آ¢ط·آ·ط¢آ·ط·آ¢ط¢آ·ط·آ·ط¢آ¢ط·آ¢ط¢آ·ط·آ·ط¢آ·ط·آ¢ط¢آ¢ط·آ·ط¢آ¢ط·آ¢ط¢آ¢ط·آ·ط¢آ·ط·آ¢ط¢آ·ط·آ·ط¢آ¢ط·آ¢ط¢آ¢ط·آ·ط¢آ·ط·آ¢ط¢آ¢ط·آ·ط¢آ¢ط·آ¢ط¢آ­ط·آ·ط¢آ·ط·آ¢ط¢آ·ط·آ·ط¢آ¢ط·آ¢ط¢آ·ط·آ·ط¢آ·ط·آ¢ط¢آ¢ط·آ·ط¢آ¢ط·آ¢ط¢آ·ط·آ·ط¢آ·ط·آ¢ط¢آ·ط·آ·ط¢آ¢ط·آ¢ط¢آ¢ط·آ·ط¢آ·ط·آ¢ط¢آ¢ط·آ·ط¢آ¢ط·آ¢ط¢آ·ط·آ·ط¢آ·ط·آ¢ط¢آ·ط·آ·ط¢آ¢ط·آ¢ط¢آ·ط·آ·ط¢آ·ط·آ¢ط¢آ¢ط·آ·ط¢آ¢ط·آ¢ط¢آ¢ط·آ·ط¢آ·ط·آ¢ط¢آ·ط·آ·ط¢آ¢ط·آ¢ط¢آ¢ط·آ·ط¢آ·ط·آ¢ط¢آ¢ط·آ·ط¢آ¢ط·آ¢ط¢آ·ط·آ·ط¢آ·ط·آ¢ط¢آ·ط·آ·ط¢آ¢ط·آ¢ط¢آ·ط·آ·ط¢آ·ط·آ¢ط¢آ¢ط·آ·ط¢آ¢ط·آ¢ط¢آ·ط·آ·ط¢آ·ط·آ¢ط¢آ·ط·آ·ط¢آ¢ط·آ¢ط¢آ¢ط·آ·ط¢آ·ط·آ¢ط¢آ¢ط·آ·ط¢آ¢ط·آ¢ط¢آ¢ط·آ·ط¢آ·ط·آ¢ط¢آ·ط·آ·ط¢آ¢ط·آ¢ط¢آ·ط·آ·ط¢آ·ط·آ¢ط¢آ¢ط·آ·ط¢آ¢ط·آ¢ط¢آ¢ط·آ·ط¢آ·ط·آ¢ط¢آ·ط·آ·ط¢آ¢ط·آ¢ط¢آ¢ط·آ·ط¢آ·ط·آ¢ط¢آ¢ط·آ·ط¢آ¢ط·آ¢ط¢آ³ط·آ·ط¢آ·ط·آ¢ط¢آ·ط·آ·ط¢آ¢ط·آ¢ط¢آ·ط·آ·ط¢آ·ط·آ¢ط¢آ¢ط·آ·ط¢آ¢ط·آ¢ط¢آ·ط·آ·ط¢آ·ط·آ¢ط¢آ·ط·آ·ط¢آ¢ط·آ¢ط¢آ¢ط·آ·ط¢آ·ط·آ¢ط¢آ¢ط·آ·ط¢آ¢ط·آ¢ط¢آ·ط·آ·ط¢آ·ط·آ¢ط¢آ·ط·آ·ط¢آ¢ط·آ¢ط¢آ·ط·آ·ط¢آ·ط·آ¢ط¢آ¢ط·آ·ط¢آ¢ط·آ¢ط¢آ¢ط·آ·ط¢آ·ط·آ¢ط¢آ·ط·آ·ط¢آ¢ط·آ¢ط¢آ¢ط·آ·ط¢آ·ط·آ¢ط¢آ¢ط·آ·ط¢آ¢ط·آ¢ط¢آ·ط·آ·ط¢آ·ط·آ¢ط¢آ·ط·آ·ط¢آ¢ط·آ¢ط¢آ·ط·آ·ط¢آ·ط·آ¢ط¢آ¢ط·آ·ط¢آ¢ط·آ¢ط¢آ·ط·آ·ط¢آ·ط·آ¢ط¢آ·ط·آ·ط¢آ¢ط·آ¢ط¢آ¢ط·آ·ط¢آ·ط·آ¢ط¢آ¢ط·آ·ط¢آ¢ط·آ¢ط¢آ¢ط·آ·ط¢آ·ط·آ¢ط¢آ·ط·آ·ط¢آ¢ط·آ¢ط¢آ·ط·آ·ط¢آ·ط·آ¢ط¢آ¢ط·آ·ط¢آ¢ط·آ¢ط¢آ¢ط·آ·ط¢آ·ط·آ¢ط¢آ·ط·آ·ط¢آ¢ط·آ¢ط¢آ¢ط·آ·ط¢آ·ط·آ¢ط¢آ¢ط·آ·ط¢آ¢ط·آ¢ط¢آ§ط·آ·ط¢آ·ط·آ¢ط¢آ·ط·آ·ط¢آ¢ط·آ¢ط¢آ·ط·آ·ط¢آ·ط·آ¢ط¢آ¢ط·آ·ط¢آ¢ط·آ¢ط¢آ·ط·آ·ط¢آ·ط·آ¢ط¢آ·ط·آ·ط¢آ¢ط·آ¢ط¢آ¢ط·آ·ط¢آ·ط·آ¢ط¢آ¢ط·آ·ط¢آ¢ط·آ¢ط¢آ·ط·آ·ط¢آ·ط·آ¢ط¢آ·ط·آ·ط¢آ¢ط·آ¢ط¢آ·ط·آ·ط¢آ·ط·آ¢ط¢آ¢ط·آ·ط¢آ¢ط·آ¢ط¢آ¢ط·آ·ط¢آ·ط·آ¢ط¢آ·ط·آ·ط¢آ¢ط·آ¢ط¢آ¢ط·آ·ط¢آ·ط·آ¢ط¢آ¢ط·آ·ط¢آ¢ط·آ¢ط¢آ·ط·آ·ط¢آ·ط·آ¢ط¢آ·ط·آ·ط¢آ¢ط·آ¢ط¢آ·ط·آ·ط¢آ·ط·آ¢ط¢آ¢ط·آ·ط¢آ¢ط·آ¢ط¢آ·ط·آ·ط¢آ·ط·آ¢ط¢آ·ط·آ·ط¢آ¢ط·آ¢ط¢آ¢ط·آ·ط¢آ·ط·آ¢ط¢آ¢ط·آ·ط¢آ¢ط·آ¢ط¢آ¢ط·آ·ط¢آ·ط·آ¢ط¢آ·ط·آ·ط¢آ¢ط·آ¢ط¢آ·ط·آ·ط¢آ·ط·آ¢ط¢آ¢ط·آ·ط¢آ¢ط·آ¢ط¢آ¢ط·آ·ط¢آ·ط·آ¢ط¢آ·ط·آ·ط¢آ¢ط·آ¢ط¢آ¢ط·آ·ط¢آ·ط·آ¢ط¢آ¢ط·آ·ط¢آ¢ط·آ¢ط¢آ¨ {{customerName}} - {{period}}" |
| `emailBodyHtml` | `String` | @db.Text |
| `emailBodyText` | `String` | @db.Text |
| `includeQR` | `Boolean` | @default(true) |
| `includeSignature` | `Boolean` | @default(false) |
| `signatureFileId` | `Int?` |  |
| `signatoryName` | `String?` |  |
| `signatoryRole` | `String?` |  |
| `includePaymentInstructions` | `Boolean` | @default(true) |
| `paymentInstructionsHtml` | `String?` | @db.Text |
| `zatcaCompliant` | `Boolean` | @default(false) |
| `showTaxBreakdown` | `Boolean` | @default(false) |
| `customers` | `Customer[]` |  |
| `createdAt` | `DateTime` | @default(now()) |
| `updatedAt` | `DateTime` | @updatedAt |
| `createdByUserId` | `String` |  |

## Model: `StatementDispatchLog`
| الحقل | النوع | الوصف |
|---|---|---|
| `id` | `Int` | @id @default(autoincrement()) |
| `tenantId` | `String` | @default("default") @map("tenant_id") |
| `customerId` | `Int` |  |
| `customer` | `Customer` | @relation(fields: [customerId], references: [id]) |
| `templateId` | `Int?` |  |
| `dateFrom` | `DateTime` |  |
| `dateTo` | `DateTime` |  |
| `generatedAt` | `DateTime` | @default(now()) |
| `pdfUrl` | `String?` |  |
| `pdfHash` | `String?` |  |
| `pdfSizeBytes` | `Int?` |  |
| `openingBalance` | `Decimal` | @db.Decimal(20, 4) |
| `closingBalance` | `Decimal` | @db.Decimal(20, 4) |
| `transactionsCount` | `Int` |  |
| `totalDebits` | `Decimal` | @db.Decimal(20, 4) |
| `totalCredits` | `Decimal` | @db.Decimal(20, 4) |
| `agingSnapshot` | `Json?` | // {0-30, 31-60, ...} |
| `deliveryChannel` | `String` | // EMAIL | WHATSAPP | SMS | PORTAL | DOWNLOAD |
| `recipientAddress` | `String?` |  |
| `ccAddresses` | `String?` |  |
| `bccAddresses` | `String?` |  |
| `status` | `String` | @default("GENERATED") // GENERATED | SENT | DELIVERED | OPENED | CLICKED | BOUNCED | FAILED | SOFT_BOUNCED |
| `externalMessageId` | `String?` |  |
| `errorMessage` | `String?` |  |
| `retryCount` | `Int` | @default(0) |
| `sentAt` | `DateTime?` |  |
| `deliveredAt` | `DateTime?` |  |
| `openedAt` | `DateTime?` |  |
| `clickedAt` | `DateTime?` |  |
| `bouncedAt` | `DateTime?` |  |
| `triggeredBy` | `String` | // 'MANUAL' | 'CRON_MONTHLY' | 'CRON_QUARTERLY' | 'BULK' | 'PORTAL' | 'API' |
| `triggeredByUserId` | `String?` |  |
| `batchId` | `Int?` |  |
| `batch` | `StatementBatch?` | @relation(fields: [batchId], references: [id]) |
| `deliveryEvents` | `Json?` | // raw webhook events |

## Model: `StatementBatch`
| الحقل | النوع | الوصف |
|---|---|---|
| `id` | `Int` | @id @default(autoincrement()) |
| `tenantId` | `String` | @default("default") @map("tenant_id") |
| `batchNumber` | `String` | @unique |
| `startedAt` | `DateTime` | @default(now()) |
| `startedByUserId` | `String?` |  |
| `triggeredBy` | `String` | // 'CRON_MONTHLY' | 'CRON_QUARTERLY' | 'MANUAL_BULK' |
| `totalCount` | `Int` |  |
| `processedCount` | `Int` | @default(0) |
| `successCount` | `Int` | @default(0) |
| `failedCount` | `Int` | @default(0) |
| `status` | `String` | @default("PROCESSING") // PROCESSING | COMPLETED | FAILED | CANCELLED |
| `completedAt` | `DateTime?` |  |
| `filterCriteria` | `Json` | // for reproducibility |
| `templateId` | `Int?` |  |
| `dateFrom` | `DateTime` |  |
| `dateTo` | `DateTime` |  |
| `dispatchLogs` | `StatementDispatchLog[]` |  |
| `errorLog` | `Json?` |  |

## Model: `StatementAccessLog`
| الحقل | النوع | الوصف |
|---|---|---|
| `id` | `Int` | @id @default(autoincrement()) |
| `tenantId` | `String` | @default("default") @map("tenant_id") |
| `customerId` | `Int` |  |
| `customer` | `Customer` | @relation(fields: [customerId], references: [id]) |
| `dispatchLogId` | `Int?` |  |
| `accessedAt` | `DateTime` | @default(now()) |
| `accessChannel` | `String` | // 'PORTAL' | 'EMAIL_LINK' | 'DOWNLOAD' |
| `ipAddress` | `String?` |  |
| `userAgent` | `String?` |  |
| `countryCode` | `String?` |  |
| `city` | `String?` |  |
| `duration` | `Int?` | // seconds spent (if portal) |

## Model: `StatementSchedule`
| الحقل | النوع | الوصف |
|---|---|---|
| `id` | `Int` | @id @default(autoincrement()) |
| `tenantId` | `String` | @default("default") @map("tenant_id") |
| `name` | `String` |  |
| `cronExpression` | `String` | // standard cron |
| `templateId` | `Int?` |  |
| `filterCriteria` | `Json` | // who to send |
| `enabled` | `Boolean` | @default(true) |
| `lastRunAt` | `DateTime?` |  |
| `nextRunAt` | `DateTime?` |  |
| `successRate` | `Decimal?` | @db.Decimal(5, 2) |

## Model: `CustomerStatementTemplate`
| الحقل | النوع | الوصف |
|---|---|---|
| `id` | `Int` | @id @default(autoincrement()) |
| `tenantId` | `String` | @default("default") @map("tenant_id") |
| `name` | `String` |  |
| `isDefault` | `Boolean` | @default(false) |
| `headerMessage` | `String?` |  |
| `footerMessage` | `String?` |  |
| `showAging` | `Boolean` | @default(true) |
| `showPaidInvoices` | `Boolean` | @default(false) |
| `primaryColor` | `String?` | @default("#000000") |
| `createdBy` | `Int?` |  |
| `createdAt` | `DateTime` | @default(now()) |
| `updatedAt` | `DateTime` | @updatedAt |

## Model: `EventLog`
| الحقل | النوع | الوصف |
|---|---|---|
| `id` | `Int` | @id @default(autoincrement()) |
| `tenantId` | `String` | @default("default") @map("tenant_id") |
| `eventType` | `String` |  |
| `payload` | `Json` |  |
| `sourceModule` | `String` |  |
| `status` | `String` | @default("PENDING") |
| `errorReason` | `String?` | @db.Text |
| `createdAt` | `DateTime` | @default(now()) |
| `processedAt` | `DateTime?` |  |

## Model: `SagaTransaction`
| الحقل | النوع | الوصف |
|---|---|---|
| `id` | `String` | @id @default(uuid()) |
| `tenantId` | `String` | @default("default") @map("tenant_id") |
| `journeyType` | `String` |  |
| `currentState` | `String` |  |
| `context` | `Json` |  |
| `status` | `String` | @default("ACTIVE") |
| `startedAt` | `DateTime` | @default(now()) |
| `updatedAt` | `DateTime` | @updatedAt |
| `steps` | `OrchestrationStep[]` |  |

## Model: `OrchestrationStep`
| الحقل | النوع | الوصف |
|---|---|---|
| `id` | `Int` | @id @default(autoincrement()) |
| `tenantId` | `String` | @default("default") @map("tenant_id") |
| `sagaId` | `String` |  |
| `saga` | `SagaTransaction` | @relation(fields: [sagaId], references: [id], onDelete: Cascade) |
| `stepName` | `String` |  |
| `status` | `String` |  |
| `timestamp` | `DateTime` | @default(now()) |

## Model: `PLMProject`
| الحقل | النوع | الوصف |
|---|---|---|
| `id` | `Int` | @id @default(autoincrement()) |
| `tenantId` | `String` | @default("default") @map("tenant_id") |
| `name` | `String` |  |
| `phase` | `String` | @default("IDEATION") |
| `productId` | `Int?` |  |
| `budget` | `Decimal` | @default(0) @db.Decimal(20, 4) |
| `createdAt` | `DateTime` | @default(now()) |

## Model: `VendorPortalUser`
| الحقل | النوع | الوصف |
|---|---|---|
| `id` | `Int` | @id @default(autoincrement()) |
| `tenantId` | `String` | @default("default") @map("tenant_id") |
| `vendorName` | `String` |  |
| `email` | `String` | @unique |
| `passwordHash` | `String` |  |
| `status` | `String` | @default("ACTIVE") |
| `createdAt` | `DateTime` | @default(now()) |
| `bids` | `VendorBid[]` |  |

## Model: `VendorBid`
| الحقل | النوع | الوصف |
|---|---|---|
| `id` | `Int` | @id @default(autoincrement()) |
| `tenantId` | `String` | @default("default") @map("tenant_id") |
| `rfqId` | `Int` |  |
| `vendorId` | `Int` |  |
| `vendor` | `VendorPortalUser` | @relation(fields: [vendorId], references: [id], onDelete: Cascade) |
| `amount` | `Decimal` |  |
| `status` | `String` | @default("SUBMITTED") |
| `createdAt` | `DateTime` | @default(now()) |
| `details` | `VendorBidDetail[]` |  |

## Model: `VendorBidDetail`
| الحقل | النوع | الوصف |
|---|---|---|
| `id` | `Int` | @id @default(autoincrement()) |
| `tenantId` | `String` | @default("default") @map("tenant_id") |
| `bidId` | `Int` |  |
| `bid` | `VendorBid` | @relation(fields: [bidId], references: [id], onDelete: Cascade) |
| `rfqDetailId` | `Int` |  |
| `unitPrice` | `Decimal` | @db.Decimal(20, 4) |
| `deliveryDays` | `Int` | @default(0) |

## Model: `VendorPortalToken`
| الحقل | النوع | الوصف |
|---|---|---|
| `id` | `Int` | @id @default(autoincrement()) |
| `tenantId` | `String` | @default("default") @map("tenant_id") |
| `token` | `String` | @unique |
| `vendorId` | `Int` |  |
| `rfqId` | `Int` |  |
| `expiresAt` | `DateTime` |  |
| `createdAt` | `DateTime` | @default(now()) |

## Model: `Q2CJourney`
| الحقل | النوع | الوصف |
|---|---|---|
| `id` | `Int` | @id @default(autoincrement()) |
| `tenantId` | `String` | @default("default") @map("tenant_id") |
| `sagaId` | `String` | @unique |
| `leadId` | `Int?` |  |
| `quoteId` | `Int?` |  |
| `salesOrderId` | `Int?` |  |
| `invoiceId` | `Int?` |  |
| `paymentId` | `Int?` |  |
| `status` | `String` | @default("ACTIVE") // ACTIVE, CLOSED, CANCELLED |
| `slaBreached` | `Boolean` | @default(false) |
| `startedAt` | `DateTime` | @default(now()) |
| `completedAt` | `DateTime?` |  |
| `totalValue` | `Decimal` | @default(0) @db.Decimal(20, 4) |

## Model: `P2PJourney`
| الحقل | النوع | الوصف |
|---|---|---|
| `id` | `Int` | @id @default(autoincrement()) |
| `tenantId` | `String` | @default("default") @map("tenant_id") |
| `sagaId` | `String` | @unique |
| `prId` | `Int?` |  |
| `rfqId` | `Int?` |  |
| `poId` | `Int?` |  |
| `grnId` | `Int?` |  |
| `invoiceId` | `Int?` |  |
| `paymentId` | `Int?` |  |
| `status` | `String` | @default("ACTIVE") |
| `slaBreached` | `Boolean` | @default(false) |
| `startedAt` | `DateTime` | @default(now()) |
| `completedAt` | `DateTime?` |  |
| `totalValue` | `Decimal` | @default(0) @db.Decimal(20, 4) |

## Model: `H2RJourney`
| الحقل | النوع | الوصف |
|---|---|---|
| `id` | `Int` | @id @default(autoincrement()) |
| `tenantId` | `String` | @default("default") @map("tenant_id") |
| `sagaId` | `String` | @unique |
| `candidateId` | `Int?` |  |
| `employeeId` | `Int?` |  |
| `status` | `String` | @default("ACTIVE") // RECRUITING, ONBOARDING, ACTIVE, RETIRED |
| `startedAt` | `DateTime` | @default(now()) |
| `completedAt` | `DateTime?` |  |

## Model: `R2RJourney`
| الحقل | النوع | الوصف |
|---|---|---|
| `id` | `Int` | @id @default(autoincrement()) |
| `tenantId` | `String` | @default("default") @map("tenant_id") |
| `sagaId` | `String` | @unique |
| `periodId` | `Int` |  |
| `status` | `String` | @default("ACTIVE") // RECONCILIATION, ADJUSTMENTS, CLOSING, REPORTING |
| `startedAt` | `DateTime` | @default(now()) |
| `completedAt` | `DateTime?` |  |

## Model: `O2DJourney`
| الحقل | النوع | الوصف |
|---|---|---|
| `id` | `Int` | @id @default(autoincrement()) |
| `tenantId` | `String` | @default("default") @map("tenant_id") |
| `sagaId` | `String` | @unique |
| `salesOrderId` | `Int` |  |
| `fulfillmentId` | `Int?` |  |
| `dispatchId` | `Int?` |  |
| `status` | `String` | @default("ACTIVE") // PICKING, PACKING, DISPATCHED, DELIVERED |
| `slaBreached` | `Boolean` | @default(false) |
| `startedAt` | `DateTime` | @default(now()) |
| `completedAt` | `DateTime?` |  |

## Model: `PlanToProduceJourney`
| الحقل | النوع | الوصف |
|---|---|---|
| `id` | `Int` | @id @default(autoincrement()) |
| `tenantId` | `String` | @default("default") @map("tenant_id") |
| `sagaId` | `String` | @unique |
| `forecastId` | `Int?` |  |
| `mrpId` | `Int?` |  |
| `workOrderId` | `Int?` |  |
| `status` | `String` | @default("ACTIVE") // PLANNING, PROCUREMENT, PRODUCTION, QUALITY, FINISHED |
| `startedAt` | `DateTime` | @default(now()) |
| `completedAt` | `DateTime?` |  |

## Model: `A2RJourney`
| الحقل | النوع | الوصف |
|---|---|---|
| `id` | `Int` | @id @default(autoincrement()) |
| `tenantId` | `String` | @default("default") @map("tenant_id") |
| `sagaId` | `String` | @unique |
| `prId` | `Int?` |  |
| `assetId` | `Int?` |  |
| `status` | `String` | @default("ACTIVE") // CAPEX, ACQUIRED, DEPRECIATING, DISPOSED |
| `startedAt` | `DateTime` | @default(now()) |
| `completedAt` | `DateTime?` |  |

## Model: `I2RJourney`
| الحقل | النوع | الوصف |
|---|---|---|
| `id` | `Int` | @id @default(autoincrement()) |
| `tenantId` | `String` | @default("default") @map("tenant_id") |
| `sagaId` | `String` | @unique |
| `ticketId` | `Int` |  |
| `resolutionId` | `Int?` |  |
| `status` | `String` | @default("ACTIVE") // LOGGED, ASSIGNED, RESOLVING, CLOSED |
| `slaBreached` | `Boolean` | @default(false) |
| `startedAt` | `DateTime` | @default(now()) |
| `completedAt` | `DateTime?` |  |

## Model: `ComplianceAuditLog`
| الحقل | النوع | الوصف |
|---|---|---|
| `id` | `Int` | @id @default(autoincrement()) |
| `tenantId` | `String` | @default("default") @map("tenant_id") |
| `concernArea` | `String` | // e.g. "Data Privacy", "Access Control", "ZATCA" |
| `severity` | `String` | // LOW, MEDIUM, HIGH, CRITICAL |
| `description` | `String` | @db.Text |
| `isResolved` | `Boolean` | @default(false) |
| `resolvedAt` | `DateTime?` |  |
| `createdAt` | `DateTime` | @default(now()) |

## Model: `RetailPOSOrder`
| الحقل | النوع | الوصف |
|---|---|---|
| `id` | `Int` | @id @default(autoincrement()) |
| `tenantId` | `String` | @default("default") @map("tenant_id") |
| `branchId` | `Int?` |  |
| `total` | `Decimal` |  |
| `status` | `String` |  |
| `createdAt` | `DateTime` | @default(now()) |

## Model: `RestaurantKDSTicket`
| الحقل | النوع | الوصف |
|---|---|---|
| `id` | `Int` | @id @default(autoincrement()) |
| `tenantId` | `String` | @default("default") @map("tenant_id") |
| `tableNo` | `Int?` |  |
| `status` | `String` |  |
| `items` | `Json` |  |
| `createdAt` | `DateTime` | @default(now()) |

## Model: `ManufacturingBOM`
| الحقل | النوع | الوصف |
|---|---|---|
| `id` | `Int` | @id @default(autoincrement()) |
| `tenantId` | `String` | @default("default") @map("tenant_id") |
| `productId` | `Int` |  |
| `components` | `Json` |  |
| `version` | `String` |  |
| `createdAt` | `DateTime` | @default(now()) |

## Model: `ConstructionBOQ`
| الحقل | النوع | الوصف |
|---|---|---|
| `id` | `Int` | @id @default(autoincrement()) |
| `tenantId` | `String` | @default("default") @map("tenant_id") |
| `projectId` | `Int` |  |
| `items` | `Json` |  |
| `totalCost` | `Decimal` | @db.Decimal(20, 4) |
| `createdAt` | `DateTime` | @default(now()) |

## Model: `ClinicPatientRecord`
| الحقل | النوع | الوصف |
|---|---|---|
| `id` | `Int` | @id @default(autoincrement()) |
| `tenantId` | `String` | @default("default") @map("tenant_id") |
| `patientName` | `String` |  |
| `icd10Codes` | `Json?` |  |
| `vitals` | `Json?` |  |
| `createdAt` | `DateTime` | @default(now()) |

## Model: `SchoolStudent`
| الحقل | النوع | الوصف |
|---|---|---|
| `id` | `Int` | @id @default(autoincrement()) |
| `tenantId` | `String` | @default("default") @map("tenant_id") |
| `name` | `String` |  |
| `grade` | `String` |  |
| `enrollmentDate` | `DateTime` | @default(now()) |

## Model: `RealEstateLease`
| الحقل | النوع | الوصف |
|---|---|---|
| `id` | `Int` | @id @default(autoincrement()) |
| `propertyId` | `Int` |  |
| `tenantId` | `Int` |  |
| `startDate` | `DateTime` |  |
| `endDate` | `DateTime` |  |
| `rentAmount` | `Decimal` | @db.Decimal(20, 4) |
| `status` | `String` |  |
| `createdAt` | `DateTime` | @default(now()) |

## Model: `DistributionRoute`
| الحقل | النوع | الوصف |
|---|---|---|
| `id` | `Int` | @id @default(autoincrement()) |
| `tenantId` | `String` | @default("default") @map("tenant_id") |
| `driverId` | `Int` |  |
| `stops` | `Json` |  |
| `status` | `String` |  |
| `createdAt` | `DateTime` | @default(now()) |

## Model: `ServiceTimesheet`
| الحقل | النوع | الوصف |
|---|---|---|
| `id` | `Int` | @id @default(autoincrement()) |
| `tenantId` | `String` | @default("default") @map("tenant_id") |
| `employeeId` | `Int` |  |
| `projectId` | `Int` |  |
| `hours` | `Decimal` | @db.Decimal(20, 4) |
| `date` | `DateTime` |  |
| `createdAt` | `DateTime` | @default(now()) |

## Model: `DocumentStateLog`
| الحقل | النوع | الوصف |
|---|---|---|
| `id` | `Int` | @id @default(autoincrement()) |
| `tenantId` | `String` | @default("default") @map("tenant_id") |
| `entityType` | `String` | @map("entity_type") |
| `entityId` | `Int` | @map("entity_id") |
| `fromState` | `String` | @map("from_state") |
| `toState` | `String` | @map("to_state") |
| `userId` | `Int?` | @map("user_id") |
| `user` | `User?` | @relation(fields: [userId], references: [id]) |
| `reason` | `String?` | @db.Text |
| `createdAt` | `DateTime` | @default(now()) @map("created_at") |

## Model: `PriceList`
| الحقل | النوع | الوصف |
|---|---|---|
| `id` | `Int` | @id @default(autoincrement()) |
| `tenantId` | `String` | @default("default") @map("tenant_id") |
| `name` | `String` |  |
| `currency` | `String` | @default("SAR") |
| `validFrom` | `DateTime` | @map("valid_from") |
| `validTo` | `DateTime?` | @map("valid_to") |
| `customerId` | `Int?` | @map("customer_id") |
| `customer` | `Customer?` | @relation(fields: [customerId], references: [id]) |
| `customerCategoryId` | `Int?` | @map("customer_category_id") |
| `channelId` | `String?` | @map("channel_id") // e.g. POS, Online, Wholesale |
| `priority` | `Int` | @default(0) |
| `isActive` | `Boolean` | @default(true) @map("is_active") |
| `createdAt` | `DateTime` | @default(now()) @map("created_at") |
| `rules` | `PriceRule[]` |  |

## Model: `PriceRule`
| الحقل | النوع | الوصف |
|---|---|---|
| `id` | `Int` | @id @default(autoincrement()) |
| `tenantId` | `String` | @default("default") @map("tenant_id") |
| `priceListId` | `Int` | @map("price_list_id") |
| `priceList` | `PriceList` | @relation(fields: [priceListId], references: [id], onDelete: Cascade) |
| `productId` | `Int?` | @map("product_id") |
| `product` | `Product?` | @relation(fields: [productId], references: [id]) |
| `productCategoryId` | `Int?` | @map("product_category_id") |
| `minQty` | `Decimal` | @default(0) @map("min_qty") @db.Decimal(18, 4) |
| `maxQty` | `Decimal?` | @map("max_qty") @db.Decimal(18, 4) |
| `unitPrice` | `Decimal` | @map("unit_price") @db.Decimal(18, 4) |
| `discountPct` | `Decimal?` | @map("discount_pct") @db.Decimal(8, 4) |
| `formula` | `String?` | // e.g. "cost * 1.25" |

## Model: `ClinicRoom`
| الحقل | النوع | الوصف |
|---|---|---|
| `id` | `Int` | @id @default(autoincrement()) |
| `tenantId` | `String` | @default("default") @map("tenant_id") |
| `name` | `String` |  |
| `type` | `String` | @default("CONSULTATION") // CONSULTATION, PROCEDURE, LAB, RECEPTION |
| `isActive` | `Boolean` | @default(true) @map("is_active") |
| `appointments` | `Appointment[]` |  |

## Model: `DoctorSchedule`
| الحقل | النوع | الوصف |
|---|---|---|
| `id` | `Int` | @id @default(autoincrement()) |
| `tenantId` | `String` | @default("default") @map("tenant_id") |
| `doctorId` | `Int` | @map("doctor_id") |
| `dayOfWeek` | `Int` | @map("day_of_week") // 0 = Sunday, etc. |
| `startTime` | `String` | @map("start_time") // "08:00" |
| `endTime` | `String` | @map("end_time") // "16:00" |
| `slotDuration` | `Int` | @default(15) @map("slot_duration") // minutes |
| `doctor` | `Employee` | @relation(fields: [doctorId], references: [id]) |

## Model: `Appointment`
| الحقل | النوع | الوصف |
|---|---|---|
| `id` | `Int` | @id @default(autoincrement()) |
| `tenantId` | `String` | @default("default") @map("tenant_id") |
| `patientId` | `Int` | @map("patient_id") |
| `doctorId` | `Int` | @map("doctor_id") |
| `roomId` | `Int?` | @map("room_id") |
| `type` | `String` | @default("CONSULT") // CONSULT, FOLLOWUP, PROCEDURE |
| `status` | `String` | @default("SCHEDULED") // SCHEDULED, ARRIVED, IN_PROGRESS, COMPLETED, NO_SHOW, CANCELLED |
| `date` | `DateTime` |  |
| `startTime` | `String` | @map("start_time") |
| `duration` | `Int` | @default(15) |
| `notes` | `String?` |  |
| `patient` | `Customer` | @relation(fields: [patientId], references: [id]) |
| `doctor` | `Employee` | @relation(fields: [doctorId], references: [id]) |
| `room` | `ClinicRoom?` | @relation(fields: [roomId], references: [id]) |

## Model: `Medication`
| الحقل | النوع | الوصف |
|---|---|---|
| `id` | `Int` | @id @default(autoincrement()) |
| `tenantId` | `String` | @default("default") @map("tenant_id") |
| `code` | `String` | @unique // SFDA code |
| `name` | `String` |  |
| `activeIng` | `String` | @map("active_ingredient") |
| `form` | `String` | // TABLET, SYRUP, INJECTION |
| `strength` | `String` |  |

## Model: `ClinicPrescription`
| الحقل | النوع | الوصف |
|---|---|---|
| `id` | `Int` | @id @default(autoincrement()) |
| `tenantId` | `String` | @default("default") @map("tenant_id") |
| `patientId` | `Int` | @map("patient_id") |
| `doctorId` | `Int` | @map("doctor_id") |
| `date` | `DateTime` | @default(now()) |
| `status` | `String` | @default("ACTIVE") // ACTIVE, DISPENSED, CANCELLED |
| `notes` | `String?` |  |
| `patient` | `Customer` | @relation(fields: [patientId], references: [id]) |
| `doctor` | `Employee` | @relation(fields: [doctorId], references: [id]) |
| `items` | `ClinicPrescriptionItem[]` |  |

## Model: `ClinicPrescriptionItem`
| الحقل | النوع | الوصف |
|---|---|---|
| `id` | `Int` | @id @default(autoincrement()) |
| `tenantId` | `String` | @default("default") @map("tenant_id") |
| `prescriptionId` | `Int` | @map("prescription_id") |
| `medicationId` | `Int` | @map("medication_id") |
| `dose` | `String` |  |
| `frequency` | `String` |  |
| `duration` | `String` |  |
| `route` | `String` |  |
| `instructions` | `String?` |  |
| `prescription` | `ClinicPrescription` | @relation(fields: [prescriptionId], references: [id]) |

## Model: `LabTest`
| الحقل | النوع | الوصف |
|---|---|---|
| `id` | `Int` | @id @default(autoincrement()) |
| `tenantId` | `String` | @default("default") @map("tenant_id") |
| `code` | `String` | @unique // LOINC or local code |
| `name` | `String` |  |
| `category` | `String` |  |
| `price` | `Decimal` | @default(0) |
| `normalRange` | `String?` | @map("normal_range") |
| `unit` | `String?` |  |

## Model: `LabOrder`
| الحقل | النوع | الوصف |
|---|---|---|
| `id` | `Int` | @id @default(autoincrement()) |
| `tenantId` | `String` | @default("default") @map("tenant_id") |
| `patientId` | `Int` | @map("patient_id") |
| `doctorId` | `Int` | @map("doctor_id") |
| `date` | `DateTime` | @default(now()) |
| `status` | `String` | @default("PENDING") // PENDING, IN_PROCESS, COMPLETED |
| `notes` | `String?` |  |
| `patient` | `Customer` | @relation(fields: [patientId], references: [id]) |
| `doctor` | `Employee` | @relation(fields: [doctorId], references: [id]) |
| `results` | `LabResult[]` |  |

## Model: `LabResult`
| الحقل | النوع | الوصف |
|---|---|---|
| `id` | `Int` | @id @default(autoincrement()) |
| `tenantId` | `String` | @default("default") @map("tenant_id") |
| `orderId` | `Int` | @map("order_id") |
| `testId` | `Int` | @map("test_id") |
| `value` | `String` |  |
| `isAbnormal` | `Boolean` | @default(false) @map("is_abnormal") |
| `enteredBy` | `Int?` | @map("entered_by") |
| `date` | `DateTime` | @default(now()) |
| `order` | `LabOrder` | @relation(fields: [orderId], references: [id]) |

## Model: `ZakatAssessment`
| الحقل | النوع | الوصف |
|---|---|---|
| `id` | `Int` | @id @default(autoincrement()) |
| `tenantId` | `String` | @default("default") @map("tenant_id") |
| `fiscalYearId` | `Int` | @map("fiscal_year_id") |
| `assessmentDate` | `DateTime` | @default(now()) @map("assessment_date") |
| `status` | `String` | @default("DRAFT") // DRAFT | FINALIZED | FILED | PAID | AMENDED |
| `hijriYear` | `String?` | @map("hijri_year") // 1447, 1448 |
| `equity` | `Decimal` | @default(0) @db.Decimal(20, 4) |
| `longTermLiabilities` | `Decimal` | @default(0) @map("long_term_liabilities") @db.Decimal(20, 4) |
| `netProfit` | `Decimal` | @default(0) @map("net_profit") @db.Decimal(20, 4) |
| `fixedAssetsBookValue` | `Decimal` | @default(0) @map("fixed_assets_book_value") @db.Decimal(20, 4) |
| `longTermInvestments` | `Decimal` | @default(0) @map("long_term_investments") @db.Decimal(20, 4) |
| `adjustmentsTotal` | `Decimal` | @default(0) @map("adjustments_total") @db.Decimal(20, 4) |
| `zakatableBase` | `Decimal` | @default(0) @map("zakatable_base") @db.Decimal(20, 4) |
| `zakatRate` | `Decimal` | @default(0.025) @map("zakat_rate") @db.Decimal(5, 4) |
| `zakatDue` | `Decimal` | @default(0) @map("zakat_due") @db.Decimal(20, 4) |
| `saudiOwnershipPct` | `Decimal` | @default(1.0000) @map("saudi_ownership_pct") @db.Decimal(5, 4) |
| `zatcaTransactionId` | `String?` | @map("zatca_transaction_id") |
| `filingReference` | `String?` | @map("filing_reference") |
| `filedAt` | `DateTime?` | @map("filed_at") |
| `filedByUserId` | `Int?` | @map("filed_by_user_id") |
| `journalEntryId` | `Int?` | @map("journal_entry_id") |
| `notes` | `String?` | @db.Text |
| `createdAt` | `DateTime` | @default(now()) @map("created_at") |
| `updatedAt` | `DateTime` | @updatedAt @map("updated_at") |
| `adjustments` | `ZakatAdjustment[]` |  |

## Model: `ZakatAdjustment`
| الحقل | النوع | الوصف |
|---|---|---|
| `id` | `Int` | @id @default(autoincrement()) |
| `tenantId` | `String` | @default("default") @map("tenant_id") |
| `assessmentId` | `Int` | @map("assessment_id") |
| `category` | `String` | // ADD | DEDUCT |
| `description` | `String` |  |
| `amount` | `Decimal` | @db.Decimal(20, 4) |
| `glAccountId` | `Int?` | @map("gl_account_id") |
| `assessment` | `ZakatAssessment` | @relation(fields: [assessmentId], references: [id], onDelete: Cascade) |

## Model: `SaudizationSnapshot`
| الحقل | النوع | الوصف |
|---|---|---|
| `id` | `Int` | @id @default(autoincrement()) |
| `tenantId` | `String` | @default("default") @map("tenant_id") |
| `snapshotDate` | `DateTime` | @map("snapshot_date") |
| `totalEmployees` | `Int` | @map("total_employees") |
| `saudiEmployees` | `Int` | @map("saudi_employees") |
| `saudiPct` | `Decimal` | @map("saudi_pct") @db.Decimal(5, 4) |
| `activityCode` | `String` | @map("activity_code") |
| `sizeBracket` | `String` | @map("size_bracket") // MICRO | SMALL | MEDIUM | LARGE | GIANT |
| `nitaqatBand` | `String` | @map("nitaqat_band") // PLATINUM | GREEN_HIGH | GREEN_MID | GREEN_LOW | YELLOW | RED |
| `nitaqatThresholds` | `Json?` | @map("nitaqat_thresholds") |
| `qiwaSyncId` | `String?` | @map("qiwa_sync_id") |
| `source` | `String` | @default("MANUAL") // MANUAL | QIWA_API | IMPORT |
| `createdAt` | `DateTime` | @default(now()) @map("created_at") |

## Model: `QiwaContract`
| الحقل | النوع | الوصف |
|---|---|---|
| `id` | `Int` | @id @default(autoincrement()) |
| `tenantId` | `String` | @default("default") @map("tenant_id") |
| `employeeId` | `Int` | @map("employee_id") |
| `contractNo` | `String` | @unique @map("contract_no") |
| `contractType` | `String` | @map("contract_type") // UNLIMITED | FIXED | PART_TIME | SEASONAL | FLEXIBLE |
| `qiwaStatus` | `String` | @map("qiwa_status") // ACTIVE | EXPIRED | TERMINATED | PENDING |
| `startDate` | `DateTime` | @map("start_date") |
| `endDate` | `DateTime?` | @map("end_date") |
| `position` | `String?` |  |
| `wageAmount` | `Decimal?` | @map("wage_amount") @db.Decimal(20, 4) |
| `wageCurrency` | `String` | @default("SAR") @map("wage_currency") |
| `syncedAt` | `DateTime?` | @map("synced_at") |
| `createdAt` | `DateTime` | @default(now()) @map("created_at") |
| `employee` | `Employee` | @relation(fields: [employeeId], references: [id], onDelete: Cascade) |

## Model: `PdplDataSubjectRequest`
| الحقل | النوع | الوصف |
|---|---|---|
| `id` | `Int` | @id @default(autoincrement()) |
| `tenantId` | `String` | @default("default") @map("tenant_id") |
| `requestType` | `String` | @map("request_type") // ACCESS | ERASE | RECTIFY | RESTRICT | PORTABILITY |
| `subjectType` | `String` | @map("subject_type") // EMPLOYEE | CUSTOMER | VENDOR | USER |
| `subjectId` | `Int` | @map("subject_id") |
| `subjectIdentifier` | `String` | @map("subject_identifier") // ID/iqama used to verify |
| `status` | `String` | @default("RECEIVED") // RECEIVED | IN_PROGRESS | COMPLETED | REJECTED |
| `receivedAt` | `DateTime` | @default(now()) @map("received_at") |
| `dueDate` | `DateTime` | @map("due_date") // 30 days from receivedAt per PDPL Art 12 |
| `completedAt` | `DateTime?` | @map("completed_at") |
| `evidenceUrl` | `String?` | @map("evidence_url") |
| `handledByUserId` | `Int?` | @map("handled_by_user_id") |
| `rejectionReason` | `String?` | @map("rejection_reason") |
| `createdAt` | `DateTime` | @default(now()) @map("created_at") |

## Model: `PdplConsent`
| الحقل | النوع | الوصف |
|---|---|---|
| `id` | `Int` | @id @default(autoincrement()) |
| `tenantId` | `String` | @default("default") @map("tenant_id") |
| `subjectType` | `String` | @map("subject_type") |
| `subjectId` | `Int` | @map("subject_id") |
| `purpose` | `String` | // MARKETING | HR_PROCESSING | DATA_SHARING | ANALYTICS |
| `granted` | `Boolean` | @default(false) |
| `grantedAt` | `DateTime?` | @map("granted_at") |
| `revokedAt` | `DateTime?` | @map("revoked_at") |
| `legalBasis` | `String` | @map("legal_basis") // CONSENT | CONTRACT | LEGAL_OBLIGATION | VITAL_INTEREST | PUBLIC_INTEREST |
| `evidenceHash` | `String?` | @map("evidence_hash") |
| `createdAt` | `DateTime` | @default(now()) @map("created_at") |

## Model: `PdplBreachIncident`
| الحقل | النوع | الوصف |
|---|---|---|
| `id` | `Int` | @id @default(autoincrement()) |
| `tenantId` | `String` | @default("default") @map("tenant_id") |
| `detectedAt` | `DateTime` | @map("detected_at") |
| `reportedAt` | `DateTime?` | @map("reported_at") |
| `category` | `String` | // UNAUTHORIZED_ACCESS | DATA_LEAK | RANSOMWARE | LOSS | OTHER |
| `severity` | `String` | // LOW | MEDIUM | HIGH | CRITICAL |
| `affectedRecords` | `Int` | @map("affected_records") |
| `affectedDataCategories` | `Json?` | @map("affected_data_categories") |
| `rootCause` | `String?` | @map("root_cause") |
| `containmentActions` | `String?` | @map("containment_actions") @db.Text |
| `notificationToSdaia` | `Boolean` | @default(false) @map("notification_to_sdaia") |
| `sdaiaRefNo` | `String?` | @map("sdaia_ref_no") |
| `notificationToSubjects` | `Boolean` | @default(false) @map("notification_to_subjects") |
| `status` | `String` | @default("DETECTED") // DETECTED | CONTAINED | INVESTIGATING | RESOLVED | CLOSED |
| `ownerUserId` | `Int?` | @map("owner_user_id") |
| `createdAt` | `DateTime` | @default(now()) @map("created_at") |

## Model: `VatCategory`
| الحقل | النوع | الوصف |
|---|---|---|
| `id` | `Int` | @id @default(autoincrement()) |
| `tenantId` | `String` | @default("default") @map("tenant_id") |
| `code` | `String` | @unique // S | Z | E | O | RC |
| `nameAr` | `String` | @map("name_ar") |
| `nameEn` | `String` | @map("name_en") |
| `rate` | `Decimal` | @db.Decimal(5, 4) // 0.1500 for 15% |
| `zatcaCode` | `String` | @map("zatca_code") // VATEX-SA-29 etc. |
| `exemptionReasonRequired` | `Boolean` | @default(false) @map("exemption_reason_required") |
| `isActive` | `Boolean` | @default(true) @map("is_active") |

## Model: `WebhookSubscription`
| الحقل | النوع | الوصف |
|---|---|---|
| `id` | `Int` | @id @default(autoincrement()) |
| `tenantId` | `String` | @default("default") @map("tenant_id") |
| `url` | `String` |  |
| `events` | `String` | @db.Text // JSON array of event names |
| `secret` | `String` | // HMAC signing secret |
| `description` | `String` | @default("") |
| `isActive` | `Boolean` | @default(true) @map("is_active") |
| `failCount` | `Int` | @default(0) @map("fail_count") |
| `lastDeliveredAt` | `DateTime?` | @map("last_delivered_at") |
| `createdAt` | `DateTime` | @default(now()) @map("created_at") |
| `deliveryLogs` | `WebhookDeliveryLog[]` |  |

## Model: `WebhookDeliveryLog`
| الحقل | النوع | الوصف |
|---|---|---|
| `id` | `Int` | @id @default(autoincrement()) |
| `tenantId` | `String` | @default("default") @map("tenant_id") |
| `subscriptionId` | `Int` | @map("subscription_id") |
| `event` | `String` |  |
| `statusCode` | `Int` | @default(0) @map("status_code") |
| `error` | `String?` | @db.Text |
| `deliveredAt` | `DateTime` | @default(now()) @map("delivered_at") |
| `subscription` | `WebhookSubscription` | @relation(fields: [subscriptionId], references: [id], onDelete: Cascade) |

## Model: `WorkflowDefinition`
| الحقل | النوع | الوصف |
|---|---|---|
| `id` | `Int` | @id @default(autoincrement()) |
| `name` | `String` |  |
| `targetModel` | `String` | @map("target_model") |
| `isActive` | `Boolean` | @default(true) @map("is_active") |
| `states` | `Json` |  |
| `transitions` | `Json` |  |
| `tenantId` | `String` | @map("tenant_id") |
| `createdAt` | `DateTime` | @default(now()) @map("created_at") |

## Model: `WorkflowInstance`
| الحقل | النوع | الوصف |
|---|---|---|
| `id` | `Int` | @id @default(autoincrement()) |
| `definitionId` | `Int` | @map("definition_id") |
| `recordModel` | `String` | @map("record_model") |
| `recordId` | `Int` | @map("record_id") |
| `currentState` | `String` | @map("current_state") |
| `history` | `Json` |  |
| `tenantId` | `String` | @map("tenant_id") |
| `createdAt` | `DateTime` | @default(now()) @map("created_at") |

## Model: `ImportJob`
| الحقل | النوع | الوصف |
|---|---|---|
| `id` | `Int` | @id @default(autoincrement()) |
| `targetModel` | `String` | @map("target_model") |
| `fileName` | `String` | @map("file_name") |
| `totalRows` | `Int` | @default(0) @map("total_rows") |
| `successRows` | `Int` | @default(0) @map("success_rows") |
| `errorRows` | `Int` | @default(0) @map("error_rows") |
| `status` | `String` | @default("PENDING") |
| `mapping` | `Json` |  |
| `errors` | `Json?` |  |
| `createdBy` | `Int` | @map("created_by") |
| `tenantId` | `String` | @map("tenant_id") |
| `createdAt` | `DateTime` | @default(now()) @map("created_at") |

## Model: `PrintTemplate`
| الحقل | النوع | الوصف |
|---|---|---|
| `id` | `Int` | @id @default(autoincrement()) |
| `name` | `String` |  |
| `targetModel` | `String` | @map("target_model") |
| `pageSize` | `String` | @default("A4") @map("page_size") |
| `orientation` | `String` | @default("portrait") |
| `margins` | `Json?` |  |
| `headerHtml` | `String?` | @map("header_html") @db.Text |
| `bodyHtml` | `String?` | @map("body_html") @db.Text |
| `footerHtml` | `String?` | @map("footer_html") @db.Text |
| `styles` | `Json?` |  |
| `isDefault` | `Boolean` | @default(false) @map("is_default") |
| `tenantId` | `String` | @map("tenant_id") |

## Model: `CustomDashboard`
| الحقل | النوع | الوصف |
|---|---|---|
| `id` | `Int` | @id @default(autoincrement()) |
| `name` | `String` |  |
| `userId` | `Int?` | @map("user_id") |
| `roleId` | `Int?` | @map("role_id") |
| `layout` | `Json` |  |
| `tenantId` | `String` | @map("tenant_id") |

## Model: `TimesheetEntry`
| الحقل | النوع | الوصف |
|---|---|---|
| `id` | `Int` | @id @default(autoincrement()) |
| `employeeId` | `Int` | @map("employee_id") |
| `projectId` | `Int?` | @map("project_id") |
| `taskId` | `Int?` | @map("task_id") |
| `date` | `DateTime` |  |
| `hours` | `Decimal` | @db.Decimal(5, 2) |
| `description` | `String?` |  |
| `billable` | `Boolean` | @default(false) |
| `status` | `String` | @default("DRAFT") |
| `tenantId` | `String` | @map("tenant_id") |
| `createdAt` | `DateTime` | @default(now()) @map("created_at") |

## Model: `DmsDocument`
| الحقل | النوع | الوصف |
|---|---|---|
| `id` | `Int` | @id @default(autoincrement()) |
| `name` | `String` |  |
| `path` | `String` |  |
| `mimeType` | `String` | @map("mime_type") |
| `size` | `Int` |  |
| `folderId` | `Int?` | @map("folder_id") |
| `linkedModel` | `String?` | @map("linked_model") |
| `linkedId` | `Int?` | @map("linked_id") |
| `version` | `Int` | @default(1) |
| `tags` | `String?` |  |
| `uploadedBy` | `Int` | @map("uploaded_by") |
| `tenantId` | `String` | @map("tenant_id") |
| `createdAt` | `DateTime` | @default(now()) @map("created_at") |

## Model: `DmsFolder`
| الحقل | النوع | الوصف |
|---|---|---|
| `id` | `Int` | @id @default(autoincrement()) |
| `name` | `String` |  |
| `parentId` | `Int?` | @map("parent_id") |
| `tenantId` | `String` | @map("tenant_id") |

## Model: `ServiceContract`
| الحقل | النوع | الوصف |
|---|---|---|
| `id` | `Int` | @id @default(autoincrement()) |
| `number` | `String` |  |
| `title` | `String` |  |
| `type` | `String` |  |
| `partyId` | `Int` | @map("party_id") |
| `startDate` | `DateTime` | @map("start_date") |
| `endDate` | `DateTime` | @map("end_date") |
| `value` | `Decimal` | @db.Decimal(20, 4) |
| `renewalType` | `String` | @default("MANUAL") @map("renewal_type") |
| `status` | `String` | @default("ACTIVE") |
| `alertDays` | `Int` | @default(30) @map("alert_days") |
| `tenantId` | `String` | @map("tenant_id") |
| `createdAt` | `DateTime` | @default(now()) @map("created_at") |

## Model: `InspectionPlan`
| الحقل | النوع | الوصف |
|---|---|---|
| `id` | `Int` | @id @default(autoincrement()) |
| `productId` | `Int` | @map("product_id") |
| `name` | `String` |  |
| `parameters` | `Json` |  |
| `tenantId` | `String` | @map("tenant_id") |

## Model: `InspectionResult`
| الحقل | النوع | الوصف |
|---|---|---|
| `id` | `Int` | @id @default(autoincrement()) |
| `planId` | `Int` | @map("plan_id") |
| `batchId` | `Int?` | @map("batch_id") |
| `inspectedBy` | `Int` | @map("inspected_by") |
| `results` | `Json` |  |
| `verdict` | `String` |  |
| `tenantId` | `String` | @map("tenant_id") |
| `createdAt` | `DateTime` | @default(now()) @map("created_at") |

## Model: `Notification`
| الحقل | النوع | الوصف |
|---|---|---|
| `id` | `Int` | @id @default(autoincrement()) |
| `userId` | `Int` | @map("user_id") |
| `type` | `String` | // APPROVAL, INVOICE_DUE, LOW_STOCK, TASK, SYSTEM |
| `title` | `String` |  |
| `body` | `String?` |  |
| `link` | `String?` |  |
| `isRead` | `Boolean` | @default(false) @map("is_read") |
| `tenantId` | `String` | @map("tenant_id") |
| `createdAt` | `DateTime` | @default(now()) @map("created_at") |

## Model: `Comment`
| الحقل | النوع | الوصف |
|---|---|---|
| `id` | `Int` | @id @default(autoincrement()) |
| `model` | `String` | // SalesInvoice, PurchaseOrder, Party... |
| `recordId` | `Int` | @map("record_id") |
| `userId` | `Int` | @map("user_id") |
| `body` | `String` |  |
| `type` | `String` | @default("COMMENT") // COMMENT, SYSTEM_LOG, STATUS_CHANGE |
| `attachments` | `Json?` |  |
| `mentions` | `Json?` |  |
| `tenantId` | `String` | @map("tenant_id") |
| `createdAt` | `DateTime` | @default(now()) @map("created_at") |

## Model: `ReorderRule`
| الحقل | النوع | الوصف |
|---|---|---|
| `id` | `Int` | @id @default(autoincrement()) |
| `productId` | `Int` | @map("product_id") |
| `warehouseId` | `Int?` | @map("warehouse_id") |
| `minQty` | `Decimal` | @map("min_qty") |
| `maxQty` | `Decimal` | @map("max_qty") |
| `reorderQty` | `Decimal` | @map("reorder_qty") |
| `leadTimeDays` | `Int` | @default(7) @map("lead_time_days") |
| `safetyStock` | `Decimal` | @default(0) @map("safety_stock") |
| `supplierId` | `Int?` | @map("supplier_id") |
| `isActive` | `Boolean` | @default(true) @map("is_active") |
| `tenantId` | `String` | @map("tenant_id") |

## Model: `ExpenseReport`
| الحقل | النوع | الوصف |
|---|---|---|
| `id` | `Int` | @id @default(autoincrement()) |
| `employeeId` | `Int` | @map("employee_id") |
| `title` | `String` |  |
| `totalAmount` | `Decimal` | @default(0) @map("total_amount") |
| `status` | `String` | @default("DRAFT") // DRAFT, SUBMITTED, APPROVED, REJECTED, PAID |
| `approvedBy` | `Int?` | @map("approved_by") |
| `tenantId` | `String` | @map("tenant_id") |
| `createdAt` | `DateTime` | @default(now()) @map("created_at") |
| `lines` | `ExpenseLine[]` |  |

## Model: `ExpenseLine`
| الحقل | النوع | الوصف |
|---|---|---|
| `id` | `Int` | @id @default(autoincrement()) |
| `tenantId` | `String` | @default("default") @map("tenant_id") |
| `reportId` | `Int` | @map("report_id") |
| `date` | `DateTime` |  |
| `category` | `String` | // TRAVEL, FOOD, TRANSPORT, ACCOMMODATION, OTHER |
| `description` | `String?` |  |
| `amount` | `Decimal` |  |
| `receiptUrl` | `String?` | @map("receipt_url") |
| `ocrData` | `Json?` | @map("ocr_data") |
| `vendor` | `String?` |  |
| `report` | `ExpenseReport` | @relation(fields: [reportId], references: [id]) |

## Model: `DeferralSchedule`
| الحقل | النوع | الوصف |
|---|---|---|
| `id` | `Int` | @id @default(autoincrement()) |
| `invoiceId` | `Int` | @map("invoice_id") |
| `lineItemId` | `Int?` | @map("line_item_id") |
| `type` | `String` | // REVENUE, EXPENSE |
| `totalAmount` | `Decimal` | @map("total_amount") |
| `startDate` | `DateTime` | @map("start_date") |
| `endDate` | `DateTime` | @map("end_date") |
| `periods` | `Int` |  |
| `tenantId` | `String` | @map("tenant_id") |
| `entries` | `DeferralEntry[]` |  |

## Model: `DeferralEntry`
| الحقل | النوع | الوصف |
|---|---|---|
| `id` | `Int` | @id @default(autoincrement()) |
| `tenantId` | `String` | @default("default") @map("tenant_id") |
| `scheduleId` | `Int` | @map("schedule_id") |
| `periodDate` | `DateTime` | @map("period_date") |
| `amount` | `Decimal` |  |
| `journalId` | `Int?` | @map("journal_id") |
| `status` | `String` | @default("PENDING") // PENDING, POSTED |
| `schedule` | `DeferralSchedule` | @relation(fields: [scheduleId], references: [id]) |

## Model: `ProjectPhase`
| الحقل | النوع | الوصف |
|---|---|---|
| `id` | `Int` | @id @default(autoincrement()) |
| `tenantId` | `String` | @default("default") @map("tenant_id") |
| `projectId` | `Int` | @map("project_id") |
| `name` | `String` |  |
| `description` | `String?` |  |
| `startDate` | `DateTime?` | @map("start_date") |
| `endDate` | `DateTime?` | @map("end_date") |
| `status` | `String` | @default("NOT_STARTED") // NOT_STARTED, IN_PROGRESS, COMPLETED, ON_HOLD |
| `progress` | `Decimal` | @default(0) @db.Decimal(8, 4) // 0-100 |
| `sortOrder` | `Int` | @default(0) @map("sort_order") |
| `color` | `String?` | @default("#3B82F6") |
| `createdAt` | `DateTime` | @default(now()) @map("created_at") |
| `project` | `Project` | @relation(fields: [projectId], references: [id], onDelete: Cascade) |
| `milestones` | `ProjectMilestone[]` |  |

## Model: `ProjectMilestone`
| الحقل | النوع | الوصف |
|---|---|---|
| `id` | `Int` | @id @default(autoincrement()) |
| `tenantId` | `String` | @default("default") @map("tenant_id") |
| `projectId` | `Int` | @map("project_id") |
| `phaseId` | `Int?` | @map("phase_id") |
| `name` | `String` |  |
| `description` | `String?` |  |
| `dueDate` | `DateTime` | @map("due_date") |
| `completedDate` | `DateTime?` | @map("completed_date") |
| `status` | `String` | @default("PENDING") // PENDING, ACHIEVED, MISSED, CANCELLED |
| `deliverables` | `String?` | // JSON array of deliverable names |
| `createdAt` | `DateTime` | @default(now()) @map("created_at") |
| `project` | `Project` | @relation(fields: [projectId], references: [id], onDelete: Cascade) |
| `phase` | `ProjectPhase?` | @relation(fields: [phaseId], references: [id]) |

## Model: `ProjectRisk`
| الحقل | النوع | الوصف |
|---|---|---|
| `id` | `Int` | @id @default(autoincrement()) |
| `tenantId` | `String` | @default("default") @map("tenant_id") |
| `projectId` | `Int` | @map("project_id") |
| `title` | `String` |  |
| `description` | `String?` |  |
| `probability` | `String` | @default("MEDIUM") // LOW, MEDIUM, HIGH, CRITICAL |
| `impact` | `String` | @default("MEDIUM") // LOW, MEDIUM, HIGH, CRITICAL |
| `mitigationPlan` | `String?` | @map("mitigation_plan") |
| `status` | `String` | @default("OPEN") // OPEN, MITIGATED, OCCURRED, CLOSED |
| `ownerId` | `Int?` | @map("owner_id") |
| `createdAt` | `DateTime` | @default(now()) @map("created_at") |
| `project` | `Project` | @relation(fields: [projectId], references: [id], onDelete: Cascade) |

## Model: `ProjectResource`
| الحقل | النوع | الوصف |
|---|---|---|
| `id` | `Int` | @id @default(autoincrement()) |
| `tenantId` | `String` | @default("default") @map("tenant_id") |
| `projectId` | `Int` | @map("project_id") |
| `employeeId` | `Int?` | @map("employee_id") |
| `resourceName` | `String?` | @map("resource_name") |
| `role` | `String` | @default("MEMBER") // PM, LEAD, MEMBER, CONSULTANT |
| `allocation` | `Decimal` | @default(100) @db.Decimal(20, 4) // percentage 0-100 |
| `hourlyRate` | `Decimal` | @default(0) @map("hourly_rate") @db.Decimal(20, 4) |
| `startDate` | `DateTime?` | @map("start_date") |
| `endDate` | `DateTime?` | @map("end_date") |
| `createdAt` | `DateTime` | @default(now()) @map("created_at") |
| `project` | `Project` | @relation(fields: [projectId], references: [id], onDelete: Cascade) |
| `employee` | `Employee?` | @relation("ProjectEmployee", fields: [employeeId], references: [id]) |

## Model: `ProjectTimeEntry`
| الحقل | النوع | الوصف |
|---|---|---|
| `id` | `Int` | @id @default(autoincrement()) |
| `tenantId` | `String` | @default("default") @map("tenant_id") |
| `projectId` | `Int` | @map("project_id") |
| `taskId` | `Int?` | @map("task_id") |
| `employeeId` | `Int?` | @map("employee_id") |
| `date` | `DateTime` |  |
| `hours` | `Decimal` | @default(0) @db.Decimal(20, 4) |
| `description` | `String?` |  |
| `billable` | `Boolean` | @default(true) |
| `approved` | `Boolean` | @default(false) |
| `createdAt` | `DateTime` | @default(now()) @map("created_at") |
| `project` | `Project` | @relation(fields: [projectId], references: [id], onDelete: Cascade) |
| `task` | `ProjectTask?` | @relation(fields: [taskId], references: [id]) |
| `employee` | `Employee?` | @relation("TimeEntryEmployee", fields: [employeeId], references: [id]) |

## Model: `CrmCampaign`
| الحقل | النوع | الوصف |
|---|---|---|
| `id` | `Int` | @id @default(autoincrement()) |
| `tenantId` | `String` | @default("default") @map("tenant_id") |
| `name` | `String` |  |
| `type` | `String` | @default("EMAIL") // EMAIL, SMS, WHATSAPP, SOCIAL, EVENT |
| `status` | `String` | @default("DRAFT") // DRAFT, SCHEDULED, ACTIVE, PAUSED, COMPLETED |
| `startDate` | `DateTime?` | @map("start_date") |
| `endDate` | `DateTime?` | @map("end_date") |
| `budget` | `Decimal` | @default(0) @db.Decimal(20, 4) |
| `actualCost` | `Decimal` | @default(0) @map("actual_cost") @db.Decimal(20, 4) |
| `targetCount` | `Int` | @default(0) @map("target_count") |
| `sentCount` | `Int` | @default(0) @map("sent_count") |
| `openCount` | `Int` | @default(0) @map("open_count") |
| `clickCount` | `Int` | @default(0) @map("click_count") |
| `convertCount` | `Int` | @default(0) @map("convert_count") |
| `description` | `String?` |  |
| `createdAt` | `DateTime` | @default(now()) @map("created_at") |
| `members` | `CrmCampaignMember[]` |  |

## Model: `CrmCampaignMember`
| الحقل | النوع | الوصف |
|---|---|---|
| `id` | `Int` | @id @default(autoincrement()) |
| `tenantId` | `String` | @default("default") @map("tenant_id") |
| `campaignId` | `Int` | @map("campaign_id") |
| `customerId` | `Int?` | @map("customer_id") |
| `leadId` | `Int?` | @map("lead_id") |
| `status` | `String` | @default("PENDING") // PENDING, SENT, OPENED, CLICKED, CONVERTED, BOUNCED |
| `respondedAt` | `DateTime?` | @map("responded_at") |
| `createdAt` | `DateTime` | @default(now()) @map("created_at") |
| `campaign` | `CrmCampaign` | @relation(fields: [campaignId], references: [id], onDelete: Cascade) |

## Model: `SupportTicket`
| الحقل | النوع | الوصف |
|---|---|---|
| `id` | `Int` | @id @default(autoincrement()) |
| `tenantId` | `String` | @default("default") @map("tenant_id") |
| `ticketNo` | `String` | @unique @map("ticket_no") |
| `customerId` | `Int?` | @map("customer_id") |
| `subject` | `String` |  |
| `description` | `String?` |  |
| `priority` | `String` | @default("MEDIUM") // LOW, MEDIUM, HIGH, URGENT |
| `status` | `String` | @default("OPEN") // OPEN, IN_PROGRESS, WAITING, RESOLVED, CLOSED |
| `category` | `String?` | // TECHNICAL, BILLING, GENERAL, FEATURE_REQUEST |
| `assignedTo` | `Int?` | @map("assigned_to") |
| `slaId` | `Int?` | @map("sla_id") |
| `dueDate` | `DateTime?` | @map("due_date") |
| `resolvedAt` | `DateTime?` | @map("resolved_at") |
| `closedAt` | `DateTime?` | @map("closed_at") |
| `firstResponseAt` | `DateTime?` | @map("first_response_at") |
| `satisfaction` | `Int?` | // 1-5 rating |
| `createdAt` | `DateTime` | @default(now()) @map("created_at") |
| `sla` | `SlaPolicy?` | @relation(fields: [slaId], references: [id]) |
| `comments` | `TicketComment[]` |  |

## Model: `TicketComment`
| الحقل | النوع | الوصف |
|---|---|---|
| `id` | `Int` | @id @default(autoincrement()) |
| `tenantId` | `String` | @default("default") @map("tenant_id") |
| `ticketId` | `Int` | @map("ticket_id") |
| `userId` | `Int?` | @map("user_id") |
| `content` | `String` |  |
| `isInternal` | `Boolean` | @default(false) @map("is_internal") |
| `createdAt` | `DateTime` | @default(now()) @map("created_at") |
| `ticket` | `SupportTicket` | @relation(fields: [ticketId], references: [id], onDelete: Cascade) |

## Model: `SlaPolicy`
| الحقل | النوع | الوصف |
|---|---|---|
| `id` | `Int` | @id @default(autoincrement()) |
| `tenantId` | `String` | @default("default") @map("tenant_id") |
| `name` | `String` |  |
| `description` | `String?` |  |
| `responseHours` | `Int` | @default(4) @map("response_hours") |
| `resolutionHours` | `Int` | @default(24) @map("resolution_hours") |
| `priority` | `String` | @default("MEDIUM") // LOW, MEDIUM, HIGH, URGENT |
| `escalateAfterHours` | `Int` | @default(8) @map("escalate_after_hours") |
| `active` | `Boolean` | @default(true) |
| `createdAt` | `DateTime` | @default(now()) @map("created_at") |
| `tickets` | `SupportTicket[]` |  |

## Model: `BiDashboard`
| الحقل | النوع | الوصف |
|---|---|---|
| `id` | `Int` | @id @default(autoincrement()) |
| `tenantId` | `String` | @default("default") @map("tenant_id") |
| `name` | `String` |  |
| `description` | `String?` |  |
| `layout` | `String?` | @db.Text // JSON layout config |
| `isDefault` | `Boolean` | @default(false) @map("is_default") |
| `createdBy` | `Int?` | @map("created_by") |
| `shared` | `Boolean` | @default(false) |
| `createdAt` | `DateTime` | @default(now()) @map("created_at") |
| `updatedAt` | `DateTime` | @updatedAt @map("updated_at") |
| `widgets` | `BiWidget[]` |  |

## Model: `BiWidget`
| الحقل | النوع | الوصف |
|---|---|---|
| `id` | `Int` | @id @default(autoincrement()) |
| `tenantId` | `String` | @default("default") @map("tenant_id") |
| `dashboardId` | `Int` | @map("dashboard_id") |
| `title` | `String` |  |
| `type` | `String` | // CHART_BAR, CHART_LINE, CHART_PIE, CHART_DONUT, KPI_CARD, TABLE, GAUGE, HEATMAP |
| `dataSource` | `String` | @map("data_source") // sales_invoices, purchase_invoices, inventory, hr, etc. |
| `query` | `String?` | @db.Text // JSON query config |
| `config` | `String?` | @db.Text // JSON visual config (colors, labels, etc.) |
| `position` | `String?` | // JSON {x, y, w, h} for grid layout |
| `refreshRate` | `Int` | @default(0) @map("refresh_rate") // seconds, 0 = manual |
| `createdAt` | `DateTime` | @default(now()) @map("created_at") |
| `dashboard` | `BiDashboard` | @relation(fields: [dashboardId], references: [id], onDelete: Cascade) |

## Model: `BiKpiDefinition`
| الحقل | النوع | الوصف |
|---|---|---|
| `id` | `Int` | @id @default(autoincrement()) |
| `tenantId` | `String` | @default("default") @map("tenant_id") |
| `name` | `String` |  |
| `description` | `String?` |  |
| `formula` | `String` | // SQL or predefined key |
| `unit` | `String` | @default("SAR") // SAR, %, COUNT, DAYS |
| `target` | `Decimal?` | @db.Decimal(20, 4) |
| `warningThreshold` | `Decimal?` | @map("warning_threshold") @db.Decimal(20, 4) |
| `dangerThreshold` | `Decimal?` | @map("danger_threshold") @db.Decimal(20, 4) |
| `direction` | `String` | @default("UP") // UP = higher is better, DOWN = lower is better |
| `category` | `String` | @default("FINANCIAL") // FINANCIAL, SALES, HR, INVENTORY, MANUFACTURING |
| `active` | `Boolean` | @default(true) |
| `createdAt` | `DateTime` | @default(now()) @map("created_at") |

## Model: `BudgetVersion`
| الحقل | النوع | الوصف |
|---|---|---|
| `id` | `Int` | @id @default(autoincrement()) |
| `tenantId` | `String` | @default("default") @map("tenant_id") |
| `budgetId` | `Int` | @map("budget_id") |
| `version` | `Int` | @default(1) |
| `name` | `String` | // "Original", "Q2 Revision", "Mid-Year" |
| `status` | `String` | @default("DRAFT") // DRAFT, SUBMITTED, APPROVED, REJECTED |
| `approvedBy` | `Int?` | @map("approved_by") |
| `approvedAt` | `DateTime?` | @map("approved_at") |
| `notes` | `String?` |  |
| `createdAt` | `DateTime` | @default(now()) @map("created_at") |
| `lines` | `BudgetScenarioLine[]` |  |

## Model: `BudgetScenario`
| الحقل | النوع | الوصف |
|---|---|---|
| `id` | `Int` | @id @default(autoincrement()) |
| `tenantId` | `String` | @default("default") @map("tenant_id") |
| `name` | `String` | // "Best Case", "Worst Case", "Most Likely" |
| `description` | `String?` |  |
| `baseYear` | `Int` | @map("base_year") |
| `growthRate` | `Decimal?` | @map("growth_rate") @db.Decimal(8, 4) // % overall growth assumption |
| `status` | `String` | @default("ACTIVE") |
| `createdBy` | `Int?` | @map("created_by") |
| `createdAt` | `DateTime` | @default(now()) @map("created_at") |
| `lines` | `BudgetScenarioLine[]` |  |

## Model: `BudgetScenarioLine`
| الحقل | النوع | الوصف |
|---|---|---|
| `id` | `Int` | @id @default(autoincrement()) |
| `tenantId` | `String` | @default("default") @map("tenant_id") |
| `scenarioId` | `Int?` | @map("scenario_id") |
| `versionId` | `Int?` | @map("version_id") |
| `accountId` | `Int` | @map("account_id") |
| `period` | `String` | // "2026-01", "2026-02" etc. |
| `amount` | `Decimal` |  |
| `notes` | `String?` |  |
| `scenario` | `BudgetScenario?` | @relation(fields: [scenarioId], references: [id]) |
| `version` | `BudgetVersion?` | @relation(fields: [versionId], references: [id]) |

## Model: `BudgetTransfer`
| الحقل | النوع | الوصف |
|---|---|---|
| `id` | `Int` | @id @default(autoincrement()) |
| `tenantId` | `String` | @default("default") @map("tenant_id") |
| `fromAccountId` | `Int` | @map("from_account_id") |
| `toAccountId` | `Int` | @map("to_account_id") |
| `amount` | `Decimal` |  |
| `reason` | `String` |  |
| `status` | `String` | @default("PENDING") // PENDING, APPROVED, REJECTED |
| `requestedBy` | `Int?` | @map("requested_by") |
| `approvedBy` | `Int?` | @map("approved_by") |
| `approvedAt` | `DateTime?` | @map("approved_at") |
| `createdAt` | `DateTime` | @default(now()) @map("created_at") |

## Model: `BudgetAlert`
| الحقل | النوع | الوصف |
|---|---|---|
| `id` | `Int` | @id @default(autoincrement()) |
| `tenantId` | `String` | @default("default") @map("tenant_id") |
| `accountId` | `Int` | @map("account_id") |
| `threshold` | `Decimal` | @db.Decimal(20, 4) // % of budget consumed |
| `alertType` | `String` | @default("WARNING") // WARNING, CRITICAL, BLOCKED |
| `notifyEmail` | `String?` | @map("notify_email") |
| `active` | `Boolean` | @default(true) |
| `triggeredAt` | `DateTime?` | @map("triggered_at") |
| `createdAt` | `DateTime` | @default(now()) @map("created_at") |

## Model: `ContractTemplate`
| الحقل | النوع | الوصف |
|---|---|---|
| `id` | `Int` | @id @default(autoincrement()) |
| `tenantId` | `String` | @default("default") @map("tenant_id") |
| `name` | `String` |  |
| `category` | `String` | @default("GENERAL") // GENERAL, SALES, PURCHASE, EMPLOYMENT, LEASE |
| `content` | `String` | @db.Text // HTML/Markdown template |
| `clauses` | `ContractClause[]` |  |
| `active` | `Boolean` | @default(true) |
| `createdAt` | `DateTime` | @default(now()) @map("created_at") |
| `updatedAt` | `DateTime` | @updatedAt @map("updated_at") |

## Model: `ContractClause`
| الحقل | النوع | الوصف |
|---|---|---|
| `id` | `Int` | @id @default(autoincrement()) |
| `tenantId` | `String` | @default("default") @map("tenant_id") |
| `templateId` | `Int` | @map("template_id") |
| `title` | `String` |  |
| `content` | `String` | @db.Text |
| `mandatory` | `Boolean` | @default(false) |
| `sortOrder` | `Int` | @default(0) @map("sort_order") |
| `template` | `ContractTemplate` | @relation(fields: [templateId], references: [id]) |

## Model: `ContractRevision`
| الحقل | النوع | الوصف |
|---|---|---|
| `id` | `Int` | @id @default(autoincrement()) |
| `tenantId` | `String` | @default("default") @map("tenant_id") |
| `contractId` | `Int` | @map("contract_id") |
| `version` | `Int` | @default(1) |
| `changes` | `String?` | @db.Text // JSON diff |
| `revisedBy` | `Int?` | @map("revised_by") |
| `reason` | `String?` |  |
| `createdAt` | `DateTime` | @default(now()) @map("created_at") |

## Model: `ContractRenewal`
| الحقل | النوع | الوصف |
|---|---|---|
| `id` | `Int` | @id @default(autoincrement()) |
| `tenantId` | `String` | @default("default") @map("tenant_id") |
| `contractId` | `Int` | @map("contract_id") |
| `renewalDate` | `DateTime` | @map("renewal_date") |
| `newEndDate` | `DateTime` | @map("new_end_date") |
| `priceAdjustment` | `Decimal?` | @map("price_adjustment") @db.Decimal(20, 4) // % change |
| `status` | `String` | @default("PENDING") // PENDING, APPROVED, RENEWED, DECLINED |
| `autoRenew` | `Boolean` | @default(false) @map("auto_renew") |
| `reminderDays` | `Int` | @default(30) @map("reminder_days") |
| `notifiedAt` | `DateTime?` | @map("notified_at") |
| `createdAt` | `DateTime` | @default(now()) @map("created_at") |

## Model: `StoreFront`
| الحقل | النوع | الوصف |
|---|---|---|
| `id` | `Int` | @id @default(autoincrement()) |
| `name` | `String` |  |
| `slug` | `String` | @unique |
| `domain` | `String?` |  |
| `theme` | `String` | @default("default") |
| `currency` | `String` | @default("SAR") |
| `language` | `String` | @default("ar") |
| `logoUrl` | `String?` | @map("logo_url") |
| `status` | `String` | @default("ACTIVE") // ACTIVE, MAINTENANCE, DISABLED |
| `settings` | `String?` | @db.Text // JSON: colors, header, footer, SEO |
| `tenantId` | `String` | @map("tenant_id") |
| `createdAt` | `DateTime` | @default(now()) @map("created_at") |
| `orders` | `OnlineOrder[]` |  |

## Model: `OnlineOrder`
| الحقل | النوع | الوصف |
|---|---|---|
| `id` | `Int` | @id @default(autoincrement()) |
| `storeId` | `Int` | @map("store_id") |
| `orderNo` | `String` | @unique @map("order_no") |
| `customerId` | `Int?` | @map("customer_id") |
| `customerEmail` | `String?` | @map("customer_email") |
| `customerPhone` | `String?` | @map("customer_phone") |
| `shippingAddress` | `String?` | @map("shipping_address") @db.Text |
| `subtotal` | `Decimal` | @default(0) |
| `taxAmount` | `Decimal` | @default(0) @map("tax_amount") @db.Decimal(20, 4) |
| `shippingCost` | `Decimal` | @default(0) @map("shipping_cost") @db.Decimal(20, 4) |
| `discount` | `Decimal` | @default(0) @db.Decimal(20, 4) |
| `total` | `Decimal` | @default(0) |
| `status` | `String` | @default("PENDING") // PENDING, CONFIRMED, PROCESSING, SHIPPED, DELIVERED, CANCELLED |
| `paymentStatus` | `String` | @default("UNPAID") @map("payment_status") // UNPAID, PAID, REFUNDED |
| `paymentMethod` | `String?` | @map("payment_method") // CARD, MADA, APPLE_PAY, COD |
| `paymentRef` | `String?` | @map("payment_ref") |
| `shippingMethod` | `String?` | @map("shipping_method") |
| `trackingNumber` | `String?` | @map("tracking_number") |
| `notes` | `String?` |  |
| `tenantId` | `String` | @map("tenant_id") |
| `createdAt` | `DateTime` | @default(now()) @map("created_at") |
| `updatedAt` | `DateTime` | @updatedAt @map("updated_at") |
| `store` | `StoreFront` | @relation(fields: [storeId], references: [id]) |
| `items` | `OnlineOrderLine[]` |  |

## Model: `OnlineOrderLine`
| الحقل | النوع | الوصف |
|---|---|---|
| `id` | `Int` | @id @default(autoincrement()) |
| `tenantId` | `String` | @default("default") @map("tenant_id") |
| `orderId` | `Int` | @map("order_id") |
| `productId` | `Int` | @map("product_id") |
| `productName` | `String` | @map("product_name") |
| `quantity` | `Int` | @default(1) |
| `unitPrice` | `Decimal` | @map("unit_price") @db.Decimal(20, 4) |
| `total` | `Decimal` | @default(0) |
| `order` | `OnlineOrder` | @relation(fields: [orderId], references: [id]) |

## Model: `ProductReview`
| الحقل | النوع | الوصف |
|---|---|---|
| `id` | `Int` | @id @default(autoincrement()) |
| `tenantId` | `String` | @default("default") @map("tenant_id") |
| `productId` | `Int` | @map("product_id") |
| `customerId` | `Int?` | @map("customer_id") |
| `customerName` | `String?` | @map("customer_name") |
| `rating` | `Int` | @default(5) // 1-5 |
| `comment` | `String?` | @db.Text |
| `approved` | `Boolean` | @default(false) |
| `createdAt` | `DateTime` | @default(now()) @map("created_at") |

## Model: `DataRetentionPolicy`
| الحقل | النوع | الوصف |
|---|---|---|
| `id` | `Int` | @id @default(autoincrement()) |
| `tenantId` | `String` | @default("default") @map("tenant_id") |
| `tableName` | `String` | @unique @map("table_name") |
| `retentionDays` | `Int` | @map("retention_days") |
| `archiveEnabled` | `Boolean` | @default(false) @map("archive_enabled") |
| `deleteAfterArchive` | `Boolean` | @default(false) @map("delete_after_archive") |
| `lastCleanup` | `DateTime?` | @map("last_cleanup") |
| `active` | `Boolean` | @default(true) |
| `createdAt` | `DateTime` | @default(now()) @map("created_at") |

## Model: `RiskRegister`
| الحقل | النوع | الوصف |
|---|---|---|
| `id` | `Int` | @id @default(autoincrement()) |
| `title` | `String` |  |
| `category` | `String` | @default("OPERATIONAL") |
| `likelihood` | `Int` | @default(1) |
| `impact` | `Int` | @default(1) |
| `riskScore` | `Int` | @default(1) @map("risk_score") |
| `owner` | `String?` |  |
| `mitigationPlan` | `String?` | @map("mitigation_plan") @db.Text |
| `status` | `String` | @default("OPEN") |
| `tenantId` | `String` | @map("tenant_id") |
| `createdAt` | `DateTime` | @default(now()) @map("created_at") |

## Model: `ComplianceRule`
| الحقل | النوع | الوصف |
|---|---|---|
| `id` | `Int` | @id @default(autoincrement()) |
| `name` | `String` |  |
| `regulation` | `String?` |  |
| `description` | `String?` | @db.Text |
| `frequency` | `String` | @default("MONTHLY") |
| `responsible` | `String?` |  |
| `lastCheckDate` | `DateTime?` | @map("last_check_date") |
| `tenantId` | `String` | @map("tenant_id") |
| `createdAt` | `DateTime` | @default(now()) @map("created_at") |
| `checks` | `ComplianceCheck[]` |  |

## Model: `ComplianceCheck`
| الحقل | النوع | الوصف |
|---|---|---|
| `id` | `Int` | @id @default(autoincrement()) |
| `tenantId` | `String` | @default("default") @map("tenant_id") |
| `ruleId` | `Int` | @map("rule_id") |
| `checkDate` | `DateTime` | @map("check_date") |
| `result` | `String` | @default("PASS") |
| `evidence` | `String?` | @db.Text |
| `checkedBy` | `String?` | @map("checked_by") |
| `notes` | `String?` |  |
| `createdAt` | `DateTime` | @default(now()) @map("created_at") |
| `rule` | `ComplianceRule` | @relation(fields: [ruleId], references: [id]) |

## Model: `InternalAudit`
| الحقل | النوع | الوصف |
|---|---|---|
| `id` | `Int` | @id @default(autoincrement()) |
| `title` | `String` |  |
| `scope` | `String?` | @db.Text |
| `auditor` | `String?` |  |
| `startDate` | `DateTime?` | @map("start_date") |
| `endDate` | `DateTime?` | @map("end_date") |
| `status` | `String` | @default("PLANNED") |
| `tenantId` | `String` | @map("tenant_id") |
| `createdAt` | `DateTime` | @default(now()) @map("created_at") |
| `findings` | `AuditFinding[]` |  |

## Model: `AuditFinding`
| الحقل | النوع | الوصف |
|---|---|---|
| `id` | `Int` | @id @default(autoincrement()) |
| `tenantId` | `String` | @default("default") @map("tenant_id") |
| `auditId` | `Int` | @map("audit_id") |
| `title` | `String` |  |
| `severity` | `String` | @default("MEDIUM") |
| `recommendation` | `String?` | @db.Text |
| `responsibleAction` | `String?` | @map("responsible_action") |
| `dueDate` | `DateTime?` | @map("due_date") |
| `status` | `String` | @default("OPEN") |
| `createdAt` | `DateTime` | @default(now()) @map("created_at") |
| `audit` | `InternalAudit` | @relation(fields: [auditId], references: [id]) |

## Model: `KBArticle`
| الحقل | النوع | الوصف |
|---|---|---|
| `id` | `Int` | @id @default(autoincrement()) |
| `title` | `String` |  |
| `content` | `String` | @db.Text |
| `categoryId` | `Int?` | @map("category_id") |
| `tags` | `String?` |  |
| `views` | `Int` | @default(0) |
| `helpful` | `Int` | @default(0) |
| `authorId` | `Int?` | @map("author_id") |
| `status` | `String` | @default("DRAFT") |
| `tenantId` | `String` | @map("tenant_id") |
| `createdAt` | `DateTime` | @default(now()) @map("created_at") |
| `updatedAt` | `DateTime` | @updatedAt @map("updated_at") |
| `category` | `KBCategory?` | @relation(fields: [categoryId], references: [id]) |

## Model: `KBCategory`
| الحقل | النوع | الوصف |
|---|---|---|
| `id` | `Int` | @id @default(autoincrement()) |
| `name` | `String` |  |
| `parentId` | `Int?` | @map("parent_id") |
| `icon` | `String?` |  |
| `sortOrder` | `Int` | @default(0) @map("sort_order") |
| `tenantId` | `String` | @map("tenant_id") |
| `articles` | `KBArticle[]` |  |

## Model: `Event`
| الحقل | النوع | الوصف |
|---|---|---|
| `id` | `Int` | @id @default(autoincrement()) |
| `title` | `String` |  |
| `type` | `String` | @default("WORKSHOP") |
| `location` | `String?` |  |
| `startDate` | `DateTime` | @map("start_date") |
| `endDate` | `DateTime` | @map("end_date") |
| `capacity` | `Int` | @default(100) |
| `registeredCount` | `Int` | @default(0) @map("registered_count") |
| `ticketPrice` | `Decimal` | @default(0) @map("ticket_price") @db.Decimal(20, 4) |
| `status` | `String` | @default("UPCOMING") |
| `description` | `String?` | @db.Text |
| `tenantId` | `String` | @map("tenant_id") |
| `createdAt` | `DateTime` | @default(now()) @map("created_at") |
| `registrations` | `EventRegistration[]` |  |

## Model: `EventRegistration`
| الحقل | النوع | الوصف |
|---|---|---|
| `id` | `Int` | @id @default(autoincrement()) |
| `tenantId` | `String` | @default("default") @map("tenant_id") |
| `eventId` | `Int` | @map("event_id") |
| `name` | `String` |  |
| `email` | `String` |  |
| `phone` | `String?` |  |
| `ticketType` | `String` | @default("GENERAL") @map("ticket_type") |
| `status` | `String` | @default("REGISTERED") |
| `checkedInAt` | `DateTime?` | @map("checked_in_at") |
| `createdAt` | `DateTime` | @default(now()) @map("created_at") |
| `event` | `Event` | @relation(fields: [eventId], references: [id]) |

## Model: `SignatureRequest`
| الحقل | النوع | الوصف |
|---|---|---|
| `id` | `Int` | @id @default(autoincrement()) |
| `documentUrl` | `String` | @map("document_url") |
| `title` | `String` |  |
| `senderId` | `Int?` | @map("sender_id") |
| `recipients` | `String?` | @db.Text |
| `status` | `String` | @default("PENDING") |
| `expiresAt` | `DateTime?` | @map("expires_at") |
| `tenantId` | `String` | @map("tenant_id") |
| `createdAt` | `DateTime` | @default(now()) @map("created_at") |
| `logs` | `SignatureLog[]` |  |

## Model: `SignatureLog`
| الحقل | النوع | الوصف |
|---|---|---|
| `id` | `Int` | @id @default(autoincrement()) |
| `tenantId` | `String` | @default("default") @map("tenant_id") |
| `requestId` | `Int` | @map("request_id") |
| `signerId` | `Int?` | @map("signer_id") |
| `signerName` | `String?` | @map("signer_name") |
| `signedAt` | `DateTime` | @default(now()) @map("signed_at") |
| `ipAddress` | `String?` | @map("ip_address") |
| `signatureData` | `String?` | @map("signature_data") @db.Text |
| `request` | `SignatureRequest` | @relation(fields: [requestId], references: [id]) |

## Model: `MaintenanceSchedule`
| الحقل | النوع | الوصف |
|---|---|---|
| `id` | `Int` | @id @default(autoincrement()) |
| `assetId` | `Int?` | @map("asset_id") |
| `assetName` | `String?` | @map("asset_name") |
| `type` | `String` | @default("PREVENTIVE") |
| `frequency` | `String` | @default("MONTHLY") |
| `lastDate` | `DateTime?` | @map("last_date") |
| `nextDate` | `DateTime?` | @map("next_date") |
| `assignedTo` | `String?` | @map("assigned_to") |
| `status` | `String` | @default("ACTIVE") |
| `tenantId` | `String` | @map("tenant_id") |
| `createdAt` | `DateTime` | @default(now()) @map("created_at") |
| `workOrders` | `MaintenanceWorkOrder[]` |  |

## Model: `MaintenanceWorkOrder`
| الحقل | النوع | الوصف |
|---|---|---|
| `id` | `Int` | @id @default(autoincrement()) |
| `scheduleId` | `Int?` | @map("schedule_id") |
| `assetId` | `Int?` | @map("asset_id") |
| `priority` | `String` | @default("MEDIUM") |
| `description` | `String?` | @db.Text |
| `startDate` | `DateTime?` | @map("start_date") |
| `completedDate` | `DateTime?` | @map("completed_date") |
| `cost` | `Decimal` | @default(0) @db.Decimal(20, 4) |
| `technicianNotes` | `String?` | @map("technician_notes") @db.Text |
| `status` | `String` | @default("OPEN") |
| `tenantId` | `String` | @map("tenant_id") |
| `createdAt` | `DateTime` | @default(now()) @map("created_at") |
| `schedule` | `MaintenanceSchedule?` | @relation(fields: [scheduleId], references: [id]) |

## Model: `FreightOrder`
| الحقل | النوع | الوصف |
|---|---|---|
| `id` | `Int` | @id @default(autoincrement()) |
| `orderNo` | `String` | @unique @map("order_no") |
| `type` | `String` | @default("OUTBOUND") |
| `carrierId` | `Int?` | @map("carrier_id") |
| `origin` | `String?` |  |
| `destination` | `String?` |  |
| `weight` | `Decimal` | @default(0) @db.Decimal(20, 4) |
| `volume` | `Decimal` | @default(0) @db.Decimal(20, 4) |
| `cost` | `Decimal` | @default(0) @db.Decimal(20, 4) |
| `status` | `String` | @default("DRAFT") |
| `trackingNo` | `String?` | @map("tracking_no") |
| `eta` | `DateTime?` |  |
| `tenantId` | `String` | @map("tenant_id") |
| `createdAt` | `DateTime` | @default(now()) @map("created_at") |

## Model: `CarrierRate`
| الحقل | النوع | الوصف |
|---|---|---|
| `id` | `Int` | @id @default(autoincrement()) |
| `carrierName` | `String` | @map("carrier_name") |
| `zoneFrom` | `String?` | @map("zone_from") |
| `zoneTo` | `String?` | @map("zone_to") |
| `weightMin` | `Decimal` | @default(0) @map("weight_min") @db.Decimal(20, 4) |
| `weightMax` | `Decimal` | @default(9999) @map("weight_max") @db.Decimal(20, 4) |
| `rate` | `Decimal` | @default(0) @db.Decimal(20, 4) |
| `currency` | `String` | @default("SAR") |
| `tenantId` | `String` | @map("tenant_id") |
| `createdAt` | `DateTime` | @default(now()) @map("created_at") |

## Model: `LmsCourse`
| الحقل | النوع | الوصف |
|---|---|---|
| `id` | `Int` | @id @default(autoincrement()) |
| `title` | `String` |  |
| `description` | `String?` | @db.Text |
| `category` | `String?` |  |
| `instructor` | `String?` |  |
| `duration` | `Int` | @default(0) |
| `level` | `String` | @default("BEGINNER") |
| `published` | `Boolean` | @default(false) |
| `tenantId` | `String` | @map("tenant_id") |
| `createdAt` | `DateTime` | @default(now()) @map("created_at") |
| `modules` | `LmsCourseModule[]` |  |
| `enrollments` | `LmsCourseEnrollment[]` |  |

## Model: `LmsCourseModule`
| الحقل | النوع | الوصف |
|---|---|---|
| `id` | `Int` | @id @default(autoincrement()) |
| `tenantId` | `String` | @default("default") @map("tenant_id") |
| `courseId` | `Int` | @map("course_id") |
| `title` | `String` |  |
| `content` | `String?` | @db.Text |
| `videoUrl` | `String?` | @map("video_url") |
| `sortOrder` | `Int` | @default(0) @map("sort_order") |
| `duration` | `Int` | @default(0) |
| `course` | `LmsCourse` | @relation(fields: [courseId], references: [id]) |

## Model: `LmsCourseEnrollment`
| الحقل | النوع | الوصف |
|---|---|---|
| `id` | `Int` | @id @default(autoincrement()) |
| `tenantId` | `String` | @default("default") @map("tenant_id") |
| `courseId` | `Int` | @map("course_id") |
| `employeeId` | `Int?` | @map("employee_id") |
| `progress` | `Int` | @default(0) |
| `score` | `Int?` |  |
| `startedAt` | `DateTime` | @default(now()) @map("started_at") |
| `completedAt` | `DateTime?` | @map("completed_at") |
| `course` | `LmsCourse` | @relation(fields: [courseId], references: [id]) |

## Model: `PlanningSlot`
| الحقل | النوع | الوصف |
|---|---|---|
| `id` | `Int` | @id @default(autoincrement()) |
| `employeeId` | `Int?` | @map("employee_id") |
| `employeeName` | `String?` | @map("employee_name") |
| `role` | `String?` |  |
| `startTime` | `DateTime` | @map("start_time") |
| `endTime` | `DateTime` | @map("end_time") |
| `notes` | `String?` |  |
| `color` | `String?` |  |
| `tenantId` | `String` | @map("tenant_id") |
| `createdAt` | `DateTime` | @default(now()) @map("created_at") |

## Model: `PortalUser`
| الحقل | النوع | الوصف |
|---|---|---|
| `id` | `Int` | @id @default(autoincrement()) |
| `partyId` | `Int?` | @map("party_id") |
| `name` | `String` |  |
| `email` | `String` |  |
| `passwordHash` | `String` | @map("password_hash") |
| `lastLogin` | `DateTime?` | @map("last_login") |
| `status` | `String` | @default("ACTIVE") |
| `tenantId` | `String` | @map("tenant_id") |
| `createdAt` | `DateTime` | @default(now()) @map("created_at") |

## Model: `PortalMessage`
| الحقل | النوع | الوصف |
|---|---|---|
| `id` | `Int` | @id @default(autoincrement()) |
| `portalUserId` | `Int` | @map("portal_user_id") |
| `subject` | `String` |  |
| `body` | `String` | @db.Text |
| `direction` | `String` | @default("INBOUND") |
| `read` | `Boolean` | @default(false) |
| `tenantId` | `String` | @map("tenant_id") |
| `createdAt` | `DateTime` | @default(now()) @map("created_at") |

## Model: `RentalAgreement`
| الحقل | النوع | الوصف |
|---|---|---|
| `id` | `Int` | @id @default(autoincrement()) |
| `agreementNo` | `String` | @unique @map("agreement_no") |
| `customerId` | `Int?` | @map("customer_id") |
| `customerName` | `String?` | @map("customer_name") |
| `itemName` | `String` | @map("item_name") |
| `startDate` | `DateTime` | @map("start_date") |
| `endDate` | `DateTime` | @map("end_date") |
| `dailyRate` | `Decimal` | @default(0) @map("daily_rate") @db.Decimal(20, 4) |
| `totalAmount` | `Decimal` | @default(0) @map("total_amount") @db.Decimal(20, 4) |
| `deposit` | `Decimal` | @default(0) @db.Decimal(20, 4) |
| `status` | `String` | @default("ACTIVE") |
| `notes` | `String?` | @db.Text |
| `tenantId` | `String` | @map("tenant_id") |
| `createdAt` | `DateTime` | @default(now()) @map("created_at") |
| `returns` | `RentalReturn[]` |  |

## Model: `RentalReturn`
| الحقل | النوع | الوصف |
|---|---|---|
| `id` | `Int` | @id @default(autoincrement()) |
| `tenantId` | `String` | @default("default") @map("tenant_id") |
| `agreementId` | `Int` | @map("agreement_id") |
| `returnDate` | `DateTime` | @map("return_date") |
| `condition` | `String` | @default("GOOD") |
| `damageNotes` | `String?` | @map("damage_notes") @db.Text |
| `damageCost` | `Decimal` | @default(0) @map("damage_cost") @db.Decimal(20, 4) |
| `inspectedBy` | `String?` | @map("inspected_by") |
| `createdAt` | `DateTime` | @default(now()) @map("created_at") |
| `agreement` | `RentalAgreement` | @relation(fields: [agreementId], references: [id]) |

## Model: `FieldServiceOrder`
| الحقل | النوع | الوصف |
|---|---|---|
| `id` | `Int` | @id @default(autoincrement()) |
| `orderNo` | `String` | @unique @map("order_no") |
| `customerId` | `Int?` | @map("customer_id") |
| `customerName` | `String?` | @map("customer_name") |
| `address` | `String?` |  |
| `lat` | `Float?` |  |
| `lng` | `Float?` |  |
| `technicianId` | `Int?` | @map("technician_id") |
| `technicianName` | `String?` | @map("technician_name") |
| `scheduledDate` | `DateTime?` | @map("scheduled_date") |
| `priority` | `String` | @default("MEDIUM") |
| `serviceType` | `String` | @default("REPAIR") @map("service_type") |
| `description` | `String?` | @db.Text |
| `resolution` | `String?` | @db.Text |
| `startTime` | `DateTime?` | @map("start_time") |
| `endTime` | `DateTime?` | @map("end_time") |
| `status` | `String` | @default("SCHEDULED") |
| `cost` | `Decimal` | @default(0) @db.Decimal(20, 4) |
| `tenantId` | `String` | @map("tenant_id") |
| `createdAt` | `DateTime` | @default(now()) @map("created_at") |

## Model: `PromptTemplate`
| الحقل | النوع | الوصف |
|---|---|---|
| `id` | `String` | @id @default(cuid()) |
| `tenantId` | `String?` | @map("tenant_id") // null = global default |
| `key` | `String` | // "cfo.daily_summary", "copilot.system" |
| `version` | `Int` |  |
| `systemPrompt` | `String` | @map("system_prompt") @db.Text |
| `userTemplate` | `String` | @map("user_template") @db.Text // with {{placeholders}} |
| `examples` | `Json?` | // few-shot examples |
| `outputSchema` | `Json?` | @map("output_schema") // JSON schema if structured |
| `modelHint` | `String?` | @map("model_hint") // "gemini-2.5-flash" | "gpt-4o-mini" |
| `temperature` | `Float` | @default(0.3) |
| `maxTokens` | `Int` | @default(2048) @map("max_tokens") |
| `active` | `Boolean` | @default(true) |
| `evalScore` | `Float?` | @map("eval_score") // last eval run score |
| `createdBy` | `String` | @map("created_by") |
| `createdAt` | `DateTime` | @default(now()) @map("created_at") |

## Model: `PromptUsageLog`
| الحقل | النوع | الوصف |
|---|---|---|
| `id` | `String` | @id @default(cuid()) |
| `tenantId` | `String` | @map("tenant_id") |
| `promptKey` | `String` | @map("prompt_key") |
| `promptVersion` | `Int` | @map("prompt_version") |
| `model` | `String` |  |
| `promptTokens` | `Int` | @map("prompt_tokens") |
| `completionTokens` | `Int` | @map("completion_tokens") |
| `latencyMs` | `Int` | @map("latency_ms") |
| `success` | `Boolean` |  |
| `errorCode` | `String?` | @map("error_code") |
| `costUsd` | `Decimal?` | @map("cost_usd") @db.Decimal(10, 6) |
| `createdAt` | `DateTime` | @default(now()) @map("created_at") |

## Model: `KnowledgeDocument`
| الحقل | النوع | الوصف |
|---|---|---|
| `id` | `String` | @id @default(cuid()) |
| `tenantId` | `String` | @map("tenant_id") |
| `title` | `String` |  |
| `content` | `String` | @db.Text |
| `sourceType` | `String` | @default("manual") @map("source_type") // zatca | policy | invoice | contract | manual | ifrs | labor-law |
| `sourceUrl` | `String?` | @map("source_url") |
| `sourceRef` | `String?` | @map("source_ref") // e.g. page number, section |
| `metadata` | `Json?` | // { tags, language, authorId, ... } |
| `embeddingVersion` | `String` | @default("text-embedding-004") @map("embedding_version") |
| `chunkCount` | `Int` | @default(0) @map("chunk_count") |
| `isActive` | `Boolean` | @default(true) @map("is_active") |
| `deletedAt` | `DateTime?` | @map("deleted_at") |
| `createdAt` | `DateTime` | @default(now()) @map("created_at") |
| `updatedAt` | `DateTime` | @updatedAt @map("updated_at") |
| `chunks` | `KnowledgeChunk[]` |  |

## Model: `CashPositionSnapshot`
| الحقل | النوع | الوصف |
|---|---|---|
| `id` | `String` | @id @default(cuid()) |
| `tenantId` | `String` | @map("tenant_id") |
| `capturedAt` | `DateTime` | @map("captured_at") |
| `totalCashSAR` | `Decimal` | @map("total_cash_sar") @db.Decimal(18, 4) |
| `bankCount` | `Int` | @map("bank_count") |
| `data` | `Json` | // {bankAccountId, balance, currency, sarEquivalent}[] |

## Model: `LiquidityForecast`
| الحقل | النوع | الوصف |
|---|---|---|
| `id` | `String` | @id @default(cuid()) |
| `tenantId` | `String` | @map("tenant_id") |
| `scenarioId` | `String` | @map("scenario_id") |
| `forecastDate` | `DateTime` | @map("forecast_date") |
| `weekNumber` | `Int` | @map("week_number") // 1..13 |
| `category` | `String` | // AR_INFLOW | AP_OUTFLOW | PAYROLL | CAPEX | LOAN | TAX |
| `expectedAmount` | `Decimal` | @map("expected_amount") @db.Decimal(18, 4) |
| `actualAmount` | `Decimal?` | @map("actual_amount") @db.Decimal(18, 4) |
| `varianceAmount` | `Decimal?` | @map("variance_amount") @db.Decimal(18, 4) |
| `notes` | `String?` |  |

## Model: `LiquidityScenario`
| الحقل | النوع | الوصف |
|---|---|---|
| `id` | `String` | @id @default(cuid()) |
| `tenantId` | `String` | @map("tenant_id") |
| `name` | `String` | // "Base", "Stress", "Best" |
| `weights` | `Json` | // adjustments per category |
| `createdBy` | `String` | @map("created_by") |
| `createdAt` | `DateTime` | @default(now()) @map("created_at") |

## Model: `AtpRule`
| الحقل | النوع | الوصف |
|---|---|---|
| `id` | `String` | @id @default(cuid()) |
| `tenantId` | `String` | @map("tenant_id") |
| `productId` | `String?` | @map("product_id") // null = default |
| `warehouseId` | `String?` | @map("warehouse_id") |
| `bufferDays` | `Int` | @map("buffer_days") // safety buffer |
| `considerInbound` | `Boolean` | @default(true) @map("consider_inbound") |
| `considerProduction` | `Boolean` | @default(true) @map("consider_production") |
| `considerAllocations` | `Boolean` | @default(true) @map("consider_allocations") |
| `alternateWarehouses` | `Json?` | @map("alternate_warehouses") // [warehouseId, priority] |
| `active` | `Boolean` | @default(true) |

## Model: `AtpCheck`
| الحقل | النوع | الوصف |
|---|---|---|
| `id` | `String` | @id @default(cuid()) |
| `tenantId` | `String` | @map("tenant_id") |
| `productId` | `String` | @map("product_id") |
| `requestedQty` | `Decimal` | @map("requested_qty") @db.Decimal(18, 4) |
| `requestedDate` | `DateTime` | @map("requested_date") |
| `warehouseId` | `String` | @map("warehouse_id") |
| `result` | `Json` | // {available, dates: [{date, qty, source}], suggestion} |
| `createdBy` | `String` | @map("created_by") |
| `createdAt` | `DateTime` | @default(now()) @map("created_at") |

## Model: `InvoiceCapture`
| الحقل | النوع | الوصف |
|---|---|---|
| `id` | `String` | @id @default(cuid()) |
| `tenantId` | `String` | @map("tenant_id") |
| `source` | `String` | // EMAIL | UPLOAD | ZATCA_API | EDI |
| `fileUrl` | `String` | @map("file_url") |
| `ocrRawText` | `String?` | @map("ocr_raw_text") @db.Text |
| `extractedData` | `Json` | @map("extracted_data") // {vendor, vatNumber, invoiceNo, date, total, lines} |
| `matchStatus` | `String` | @default("PENDING") @map("match_status") // PENDING | MATCHED_PO | MATCHED_GRN | EXCEPTION | POSTED |
| `matchedPoId` | `String?` | @map("matched_po_id") |
| `matchedGrnId` | `String?` | @map("matched_grn_id") |
| `exceptionReason` | `String?` | @map("exception_reason") |
| `confidence` | `Float` | @default(0) // 0.0 - 1.0 |
| `reviewedBy` | `String?` | @map("reviewed_by") |
| `postedAsInvoiceId` | `String?` | @map("posted_as_invoice_id") |
| `createdAt` | `DateTime` | @default(now()) @map("created_at") |

## Model: `OcrTrainingData`
| الحقل | النوع | الوصف |
|---|---|---|
| `id` | `String` | @id @default(cuid()) |
| `tenantId` | `String` | @map("tenant_id") |
| `vendorId` | `String` | @map("vendor_id") |
| `template` | `Json` | // field positions/regex patterns |
| `accuracy` | `Float` |  |

## Model: `ShopFloorSession`
| الحقل | النوع | الوصف |
|---|---|---|
| `id` | `String` | @id @default(cuid()) |
| `tenantId` | `String` | @map("tenant_id") |
| `workCenterId` | `String` | @map("work_center_id") |
| `operatorId` | `String` | @map("operator_id") |
| `manufacturingOrderId` | `String` | @map("manufacturing_order_id") |
| `operationId` | `String` | @map("operation_id") |
| `startedAt` | `DateTime` | @map("started_at") |
| `pausedAt` | `DateTime?` | @map("paused_at") |
| `completedAt` | `DateTime?` | @map("completed_at") |
| `goodQty` | `Decimal?` | @map("good_qty") @db.Decimal(18, 4) |
| `scrapQty` | `Decimal?` | @map("scrap_qty") @db.Decimal(18, 4) |
| `scrapReason` | `String?` | @map("scrap_reason") |
| `downtimeMinutes` | `Int?` | @map("downtime_minutes") |
| `downtimeReason` | `String?` | @map("downtime_reason") |
| `status` | `String` | // ACTIVE | PAUSED | COMPLETED | ABANDONED |

## Model: `AndonCall`
| الحقل | النوع | الوصف |
|---|---|---|
| `id` | `String` | @id @default(cuid()) |
| `tenantId` | `String` | @map("tenant_id") |
| `workCenterId` | `String` | @map("work_center_id") |
| `callType` | `String` | @map("call_type") // MATERIAL | MAINTENANCE | QUALITY | SUPERVISOR |
| `calledBy` | `String` | @map("called_by") |
| `calledAt` | `DateTime` | @map("called_at") |
| `respondedBy` | `String?` | @map("responded_by") |
| `respondedAt` | `DateTime?` | @map("responded_at") |
| `resolvedAt` | `DateTime?` | @map("resolved_at") |
| `resolutionNote` | `String?` | @map("resolution_note") |

## Model: `AiConversation`
| الحقل | النوع | الوصف |
|---|---|---|
| `id` | `String` | @id @default(cuid()) |
| `tenantId` | `String` | @map("tenant_id") |
| `userId` | `String` | @map("user_id") |
| `title` | `String?` |  |
| `startedAt` | `DateTime` | @default(now()) @map("started_at") |
| `endedAt` | `DateTime?` | @map("ended_at") |
| `messages` | `AiConversationMessage[]` |  |

## Model: `AiConversationMessage`
| الحقل | النوع | الوصف |
|---|---|---|
| `id` | `String` | @id @default(cuid()) |
| `tenantId` | `String` | @default("default") @map("tenant_id") |
| `conversationId` | `String` | @map("conversation_id") |
| `role` | `String` | // "user" | "assistant" | "tool" |
| `content` | `String` | @db.Text |
| `toolCalls` | `Json?` | @map("tool_calls") |
| `toolResults` | `Json?` | @map("tool_results") |
| `promptTokens` | `Int?` | @map("prompt_tokens") |
| `completionTokens` | `Int?` | @map("completion_tokens") |
| `createdAt` | `DateTime` | @default(now()) @map("created_at") |
| `conversation` | `AiConversation` | @relation(fields: [conversationId], references: [id]) |

## Model: `TenantQuota`
| الحقل | النوع | الوصف |
|---|---|---|
| `id` | `String` | @id @default(cuid()) |
| `tenantId` | `String` | @unique @map("tenant_id") |
| `tier` | `String` | @default("free") // free | pro | enterprise |
| `maxAiTokens` | `Int` | @default(500000) @map("max_ai_tokens") // monthly |
| `maxApiCalls` | `Int` | @default(10000) @map("max_api_calls") // monthly |
| `maxStorageGb` | `Decimal` | @default(5) @map("max_storage_gb") @db.Decimal(20, 4) |
| `usedAiTokens` | `Int` | @default(0) @map("used_ai_tokens") |
| `usedApiCalls` | `Int` | @default(0) @map("used_api_calls") |
| `usedStorageGb` | `Decimal` | @default(0) @map("used_storage_gb") @db.Decimal(20, 4) |
| `resetAt` | `DateTime` | @map("reset_at") |

## Model: `LlmContextCache`
| الحقل | النوع | الوصف |
|---|---|---|
| `id` | `String` | @id @default(cuid()) |
| `tenantId` | `String` | @map("tenant_id") |
| `cacheKey` | `String` | @map("cache_key") // sha256 of (systemPrompt + staticContext) |
| `provider` | `String` | // gemini | anthropic | openai |
| `providerCacheId` | `String` | @map("provider_cache_id") // returned by provider |
| `tokenCount` | `Int` | @map("token_count") |
| `expiresAt` | `DateTime` | @map("expires_at") |
| `hitCount` | `Int` | @default(0) @map("hit_count") |
| `createdAt` | `DateTime` | @default(now()) @map("created_at") |

## Model: `AiToolDefinition`
| الحقل | النوع | الوصف |
|---|---|---|
| `id` | `String` | @id @default(cuid()) |
| `tenantId` | `String?` | @map("tenant_id") // null = global default |
| `name` | `String` | // get_customer_balance, list_open_invoices, ... |
| `description` | `String` | @db.Text |
| `parameters` | `Json` | // JSON-Schema for arguments |
| `handlerType` | `String` | @map("handler_type") // DB_QUERY | API_CALL | MUTATION |
| `permission` | `String?` | // role required to invoke |
| `active` | `Boolean` | @default(true) |
| `createdAt` | `DateTime` | @default(now()) @map("created_at") |

## Model: `AiToolCallLog`
| الحقل | النوع | الوصف |
|---|---|---|
| `id` | `String` | @id @default(cuid()) |
| `tenantId` | `String` | @map("tenant_id") |
| `conversationId` | `String?` | @map("conversation_id") |
| `toolName` | `String` | @map("tool_name") |
| `arguments` | `Json` |  |
| `result` | `Json?` |  |
| `success` | `Boolean` |  |
| `errorMessage` | `String?` | @map("error_message") @db.Text |
| `durationMs` | `Int` | @map("duration_ms") |
| `invokedBy` | `String` | @map("invoked_by") // userId or "agent" |
| `createdAt` | `DateTime` | @default(now()) @map("created_at") |

## Model: `KnowledgeChunk`
| الحقل | النوع | الوصف |
|---|---|---|
| `id` | `String` | @id @default(cuid()) |
| `tenantId` | `String` | @map("tenant_id") |
| `documentId` | `String` | @map("document_id") |
| `chunkIndex` | `Int` | @map("chunk_index") |
| `content` | `String` | @db.Text |
| `embedding` | `Float[]` | // migrated to vector(768) via raw SQL ط·آ·ط¢آ·ط·آ¢ط¢آ·ط·آ·ط¢آ¢ط·آ¢ط¢آ·ط·آ·ط¢آ·ط·آ¢ط¢آ¢ط·آ·ط¢آ¢ط·آ¢ط¢آ·ط·آ·ط¢آ·ط·آ¢ط¢آ·ط·آ·ط¢آ¢ط·آ¢ط¢آ¢ط·آ·ط¢آ·ط·آ¢ط¢آ¢ط·آ·ط¢آ¢ط·آ¢ط¢آ£ط·آ·ط¢آ·ط·آ¢ط¢آ·ط·آ·ط¢آ¢ط·آ¢ط¢آ·ط·آ·ط¢آ·ط·آ¢ط¢آ¢ط·آ·ط¢آ¢ط·آ¢ط¢آ¢ط·آ·ط¢آ·ط·آ¢ط¢آ·ط·آ·ط¢آ¢ط·آ¢ط¢آ¢ط·آ·ط¢آ·ط·آ¢ط¢آ¢ط·آ·ط¢آ¢ط·آ¢ط¢آ¢ط·آ·ط¢آ·ط·آ¢ط¢آ·ط·آ·ط¢آ¢ط·آ¢ط¢آ·ط·آ·ط¢آ·ط·آ¢ط¢آ¢ط·آ·ط¢آ¢ط·آ¢ط¢آ£ط·آ·ط¢آ·ط·آ¢ط¢آ·ط·آ·ط¢آ¢ط·آ¢ط¢آ¢ط·آ·ط¢آ·ط·آ¢ط¢آ¢ط·آ·ط¢آ¢ط·آ¢ط¢آ¢ط·آ·ط¢آ·ط·آ¢ط¢آ·ط·آ·ط¢آ¢ط·آ¢ط¢آ£ط·آ·ط¢آ·ط·آ¢ط¢آ¢ط·آ·ط¢آ¢ط·آ¢ط¢آ¢ط·آ·ط¢آ·ط·آ¢ط¢آ£ط·آ·ط¢آ¢ط·آ¢ط¢آ¢ط·آ·ط¢آ£ط·آ¢ط¢آ¢ط·آ£ط¢آ¢ط£آ¢أ¢â€ڑآ¬ط¹â€کط·آ¢ط¢آ¬ط·آ·ط¢آ¹ط£آ¢أ¢â€ڑآ¬ط¹آ©ط·آ·ط¢آ·ط·آ¢ط¢آ¢ط·آ·ط¢آ¢ط·آ¢ط¢آ¬ط·آ·ط¢آ·ط·آ¢ط¢آ·ط·آ·ط¢آ¢ط·آ¢ط¢آ¹ط·آ·ط¢آ£ط·آ¢ط¢آ¢ط·آ£ط¢آ¢ط£آ¢أ¢â€ڑآ¬ط¹â€کط·آ¢ط¢آ¬ط·آ·ط¢آ¹ط·آ¢ط¢آ©ط·آ·ط¢آ·ط·آ¢ط¢آ·ط·آ·ط¢آ¢ط·آ¢ط¢آ·ط·آ·ط¢آ·ط·آ¢ط¢آ¢ط·آ·ط¢آ¢ط·آ¢ط¢آ¢ط·آ·ط¢آ·ط·آ¢ط¢آ·ط·آ·ط¢آ¢ط·آ¢ط¢آ¢ط·آ·ط¢آ·ط·آ¢ط¢آ¢ط·آ·ط¢آ¢ط·آ¢ط¢آ¬ط·آ·ط¢آ·ط·آ¢ط¢آ·ط·آ·ط¢آ¢ط·آ¢ط¢آ·ط·آ·ط¢آ·ط·آ¢ط¢آ¢ط·آ·ط¢آ¢ط·آ¢ط¢آ£ط·آ·ط¢آ·ط·آ¢ط¢آ·ط·آ·ط¢آ¢ط·آ¢ط¢آ¢ط·آ·ط¢آ·ط·آ¢ط¢آ¢ط·آ·ط¢آ¢ط·آ¢ط¢آ¢ط·آ·ط¢آ·ط·آ¢ط¢آ·ط·آ·ط¢آ¢ط·آ¢ط¢آ£ط·آ·ط¢آ·ط·آ¢ط¢آ¢ط·آ·ط¢آ¢ط·آ¢ط¢آ¢ط·آ·ط¢آ·ط·آ¢ط¢آ£ط·آ·ط¢آ¢ط·آ¢ط¢آ¢ط·آ·ط¢آ£ط·آ¢ط¢آ¢ط·آ£ط¢آ¢ط£آ¢أ¢â‚¬ع‘ط¢آ¬ط·آ¹أ¢â‚¬ع©ط·آ·ط¢آ¢ط·آ¢ط¢آ¬ط·آ·ط¢آ·ط·آ¢ط¢آ¹ط·آ£ط¢آ¢ط£آ¢أ¢â‚¬ع‘ط¢آ¬ط·آ¹ط¢آ©ط·آ·ط¢آ·ط·آ¢ط¢آ·ط·آ·ط¢آ¢ط·آ¢ط¢آ¢ط·آ·ط¢آ·ط·آ¢ط¢آ¢ط·آ·ط¢آ¢ط·آ¢ط¢آ¬ط·آ·ط¢آ·ط·آ¢ط¢آ·ط·آ·ط¢آ¢ط·آ¢ط¢آ£ط·آ·ط¢آ·ط·آ¢ط¢آ¢ط·آ·ط¢آ¢ط·آ¢ط¢آ¢ط·آ·ط¢آ·ط·آ¢ط¢آ£ط·آ·ط¢آ¢ط·آ¢ط¢آ¢ط·آ·ط¢آ£ط·آ¢ط¢آ¢ط·آ£ط¢آ¢ط£آ¢أ¢â€ڑآ¬ط¹â€کط·آ¢ط¢آ¬ط·آ·ط¢آ¹ط£آ¢أ¢â€ڑآ¬ط¹آ©ط·آ·ط¢آ·ط·آ¢ط¢آ¢ط·آ·ط¢آ¢ط·آ¢ط¢آ¬ط·آ·ط¢آ·ط·آ¢ط¢آ·ط·آ·ط¢آ¢ط·آ¢ط¢آ¥ط·آ·ط¢آ£ط·آ¢ط¢آ¢ط·آ£ط¢آ¢ط£آ¢أ¢â€ڑآ¬ط¹â€کط·آ¢ط¢آ¬ط·آ£ط¢آ¢ط£آ¢أ¢â€ڑآ¬أ¢â‚¬ع†ط·آ¢ط¢آ¢ see migration |
| `tokenCount` | `Int` | @map("token_count") |
| `embeddingVersion` | `String` | @default("text-embedding-004") @map("embedding_version") |
| `metadata` | `Json?` | // { page, section, title, ... } |
| `isActive` | `Boolean` | @default(true) @map("is_active") |
| `createdAt` | `DateTime` | @default(now()) @map("created_at") |
| `document` | `KnowledgeDocument` | @relation(fields: [documentId], references: [id], onDelete: Cascade) |

## Model: `BudgetDriver`
| الحقل | النوع | الوصف |
|---|---|---|
| `id` | `String` | @id @default(cuid()) |
| `tenantId` | `String` | @map("tenant_id") |
| `versionId` | `String` | @map("version_id") // FK to BudgetVersion (loose) |
| `driverName` | `String` | @map("driver_name") |
| `unit` | `String?` | // SAR, USD, PERSONS, % |
| `values` | `Json` | // { "2026-01": 1000, "2026-02": 1100, ... } |
| `createdAt` | `DateTime` | @default(now()) @map("created_at") |

## Model: `ConsolidationMember`
| الحقل | النوع | الوصف |
|---|---|---|
| `id` | `String` | @id @default(cuid()) |
| `tenantId` | `String` | @default("default") @map("tenant_id") |
| `groupId` | `Int` | @map("group_id") |
| `entityId` | `String` | @map("entity_id") // tenant or sub-tenant id |
| `ownership` | `Decimal` | @db.Decimal(7, 4) // e.g. 0.7500 |
| `consolidationMethod` | `String` | @map("consolidation_method") // FULL | PROPORTIONAL | EQUITY |
| `acquisitionDate` | `DateTime` | @map("acquisition_date") |
| `active` | `Boolean` | @default(true) |
| `createdAt` | `DateTime` | @default(now()) @map("created_at") |
| `group` | `ConsolidationGroup` | @relation(fields: [groupId], references: [id], onDelete: Cascade) |

## Model: `EliminationRule`
| الحقل | النوع | الوصف |
|---|---|---|
| `id` | `String` | @id @default(cuid()) |
| `tenantId` | `String` | @map("tenant_id") |
| `groupId` | `Int` | @map("group_id") |
| `ruleName` | `String` | @map("rule_name") |
| `ruleType` | `String` | @map("rule_type") // INTERCOMPANY_AR_AP | INTERCOMPANY_REVENUE_COGS | INVESTMENT_EQUITY | UNREALIZED_PROFIT |
| `sourceAccount` | `String?` | @map("source_account") // GL code |
| `targetAccount` | `String?` | @map("target_account") // GL code (offset) |
| `formula` | `String?` | @db.Text // expression: e.g. "abs(A.4100) - abs(B.5100)" |
| `active` | `Boolean` | @default(true) |
| `createdAt` | `DateTime` | @default(now()) @map("created_at") |
| `group` | `ConsolidationGroup` | @relation(fields: [groupId], references: [id], onDelete: Cascade) |

## Model: `DeferredTax`
| الحقل | النوع | الوصف |
|---|---|---|
| `id` | `Int` | @id @default(autoincrement()) |
| `tenantId` | `String` | @map("tenant_id") |
| `asOfDate` | `DateTime` | @map("as_of_date") |
| `itemCode` | `String` | @map("item_code") // FIXED_ASSET_DEPR, INVENTORY_NRV, LOAN_LOSS, ACCRUED_LIAB, REVALUATION, FX_UNREALIZED, ... |
| `description` | `String` |  |
| `accountingBase` | `Decimal` | @map("accounting_base") @db.Decimal(18, 2) // Carrying Amount per books |
| `taxBase` | `Decimal` | @map("tax_base") @db.Decimal(18, 2) // Tax Base |
| `temporaryDiff` | `Decimal` | @map("temporary_diff") @db.Decimal(18, 2) // accountingBase - taxBase |
| `diffType` | `String` | @map("diff_type") // TAXABLE_TEMP_DIFF | DEDUCTIBLE_TEMP_DIFF | NONE |
| `taxRate` | `Decimal` | @map("tax_rate") @db.Decimal(7, 4) // 0.20 = 20% |
| `deferredTaxAmount` | `Decimal` | @map("deferred_tax_amount") @db.Decimal(18, 2) // temporaryDiff * taxRate |
| `classification` | `String` | // DTL (liability) | DTA (asset) |
| `recoverability` | `String?` | // PROBABLE | UNCERTAIN ط·آ·ط¢آ·ط·آ¢ط¢آ·ط·آ·ط¢آ¢ط·آ¢ط¢آ·ط·آ·ط¢آ·ط·آ¢ط¢آ¢ط·آ·ط¢آ¢ط·آ¢ط¢آ£ط·آ·ط¢آ·ط·آ¢ط¢آ·ط·آ·ط¢آ¢ط·آ¢ط¢آ¢ط·آ·ط¢آ·ط·آ¢ط¢آ¢ط·آ·ط¢آ¢ط·آ¢ط¢آ¢ط·آ·ط¢آ·ط·آ¢ط¢آ·ط·آ·ط¢آ¢ط·آ¢ط¢آ£ط·آ·ط¢آ·ط·آ¢ط¢آ¢ط·آ·ط¢آ¢ط·آ¢ط¢آ¢ط·آ·ط¢آ·ط·آ¢ط¢آ£ط·آ·ط¢آ¢ط·آ¢ط¢آ¢ط·آ·ط¢آ£ط·آ¢ط¢آ¢ط·آ£ط¢آ¢ط£آ¢أ¢â‚¬ع‘ط¢آ¬ط·آ¹أ¢â‚¬ع©ط·آ·ط¢آ¢ط·آ¢ط¢آ¬ط·آ·ط¢آ·ط·آ¢ط¢آ¹ط·آ£ط¢آ¢ط£آ¢أ¢â‚¬ع‘ط¢آ¬ط·آ¹ط¢آ©ط·آ·ط¢آ·ط·آ¢ط¢آ·ط·آ·ط¢آ¢ط·آ¢ط¢آ¢ط·آ·ط¢آ·ط·آ¢ط¢آ¢ط·آ·ط¢آ¢ط·آ¢ط¢آ¬ط·آ·ط¢آ·ط·آ¢ط¢آ·ط·آ·ط¢آ¢ط·آ¢ط¢آ£ط·آ·ط¢آ·ط·آ¢ط¢آ¢ط·آ·ط¢آ¢ط·آ¢ط¢آ¢ط·آ·ط¢آ·ط·آ¢ط¢آ£ط·آ·ط¢آ¢ط·آ¢ط¢آ¢ط·آ·ط¢آ£ط·آ¢ط¢آ¢ط·آ£ط¢آ¢ط£آ¢أ¢â€ڑآ¬ط¹â€کط·آ¢ط¢آ¬ط·آ·ط¢آ¹ط£آ¢أ¢â€ڑآ¬ط¹آ©ط·آ·ط¢آ·ط·آ¢ط¢آ¢ط·آ·ط¢آ¢ط·آ¢ط¢آ¬ط·آ·ط¢آ·ط·آ¢ط¢آ£ط·آ·ط¢آ¢ط·آ¢ط¢آ¢ط·آ·ط¢آ£ط·آ¢ط¢آ¢ط·آ£ط¢آ¢ط£آ¢أ¢â‚¬ع‘ط¢آ¬ط·آ¹أ¢â‚¬ع©ط·آ·ط¢آ¢ط·آ¢ط¢آ¬ط·آ·ط¢آ·ط·آ¢ط¢آ¥ط·آ£ط¢آ¢ط£آ¢أ¢â‚¬ع‘ط¢آ¬ط£آ¢أ¢â‚¬â€چط¢آ¢ for DTA as per IAS 12.34-35 |
| `expectedReversal` | `DateTime?` | @map("expected_reversal") |
| `journalEntryId` | `Int?` | @map("journal_entry_id") |
| `status` | `String` | @default("DRAFT") // DRAFT, RECOGNIZED, REVERSED |
| `createdAt` | `DateTime` | @default(now()) @map("created_at") |
| `updatedAt` | `DateTime` | @updatedAt @map("updated_at") |

## Model: `DeferredTaxRollforward`
| الحقل | النوع | الوصف |
|---|---|---|
| `id` | `Int` | @id @default(autoincrement()) |
| `tenantId` | `String` | @map("tenant_id") |
| `fiscalYear` | `Int` | @map("fiscal_year") |
| `itemCode` | `String` | @map("item_code") |
| `openingBalance` | `Decimal` | @map("opening_balance") @db.Decimal(18, 2) |
| `recognizedInPL` | `Decimal` | @map("recognized_in_pl") @db.Decimal(18, 2) // Tax expense |
| `recognizedInOCI` | `Decimal` | @map("recognized_in_oci") @db.Decimal(18, 2) // Hedge / Revaluation |
| `recognizedInEq` | `Decimal` | @map("recognized_in_eq") @db.Decimal(18, 2) // Direct equity |
| `closingBalance` | `Decimal` | @map("closing_balance") @db.Decimal(18, 2) |

## Model: `CGU`
| الحقل | النوع | الوصف |
|---|---|---|
| `id` | `Int` | @id @default(autoincrement()) |
| `tenantId` | `String` | @map("tenant_id") |
| `code` | `String` | @unique |
| `name` | `String` |  |
| `description` | `String?` | @db.Text |
| `assets` | `Json` | // List of asset IDs belonging to this CGU |
| `carryingAmount` | `Decimal` | @map("carrying_amount") @db.Decimal(18, 2) |

## Model: `ImpairmentTest`
| الحقل | النوع | الوصف |
|---|---|---|
| `id` | `Int` | @id @default(autoincrement()) |
| `tenantId` | `String` | @map("tenant_id") |
| `cguId` | `Int` | @map("cgu_id") |
| `testDate` | `DateTime` | @map("test_date") |
| `carryingAmount` | `Decimal` | @map("carrying_amount") @db.Decimal(18, 2) |
| `valueInUse` | `Decimal` | @map("value_in_use") @db.Decimal(18, 2) // DCF value |
| `fairValue` | `Decimal` | @map("fair_value") @db.Decimal(18, 2) // FV less costs of disposal |
| `recoverableAmt` | `Decimal` | @map("recoverable_amt") @db.Decimal(18, 2) // max(valueInUse, fairValue) |
| `impairmentLoss` | `Decimal` | @map("impairment_loss") @db.Decimal(18, 2) // carryingAmount - recoverableAmt (min 0) |
| `status` | `String` | @default("DRAFT") // DRAFT, POSTED |
| `journalEntryId` | `Int?` | @map("journal_entry_id") |

## Model: `TPMethod`
| الحقل | النوع | الوصف |
|---|---|---|
| `id` | `Int` | @id @default(autoincrement()) |
| `code` | `String` | @unique // CUP, RPM, CPM, TNMM, PROFIT_SPLIT |
| `name` | `String` |  |
| `description` | `String` | @db.Text |
| `whenToUse` | `String` | @map("when_to_use") @db.Text |

## Model: `TPTransaction`
| الحقل | النوع | الوصف |
|---|---|---|
| `id` | `Int` | @id @default(autoincrement()) |
| `tenantId` | `String` | @map("tenant_id") |
| `fromCompanyId` | `Int` | @map("from_company_id") |
| `toCompanyId` | `Int` | @map("to_company_id") |
| `transactionType` | `String` | @map("transaction_type") // SALE_GOODS, SALE_SERVICES, ROYALTY, INTEREST, COST_SHARE, IP_LICENSE |
| `description` | `String` |  |
| `amount` | `Decimal` | @db.Decimal(18, 2) |
| `currency` | `String` |  |
| `taxYear` | `Int` | @map("tax_year") |
| `methodId` | `Int` | @map("method_id") |
| `armsLengthRange` | `Json` | @map("arms_length_range") // {min, median, max} |
| `actualPrice` | `Decimal` | @map("actual_price") @db.Decimal(18, 4) |
| `withinRange` | `Boolean` | @map("within_range") |
| `benchmarkStudyId` | `Int?` | @map("benchmark_study_id") |
| `documentationStatus` | `String` | @default("PENDING") @map("documentation_status") // PENDING, IN_PROGRESS, COMPLETE |

## Model: `TPBenchmarkStudy`
| الحقل | النوع | الوصف |
|---|---|---|
| `id` | `Int` | @id @default(autoincrement()) |
| `studyName` | `String` | @map("study_name") |
| `industryCode` | `String` | @map("industry_code") |
| `comparables` | `Json` | // [{name, country, ratio, source}] |
| `resultStatistic` | `String` | @map("result_statistic") // INTERQUARTILE_RANGE |
| `studyDate` | `DateTime` | @map("study_date") |
| `validUntil` | `DateTime` | @map("valid_until") |
| `preparedBy` | `String` | @map("prepared_by") |
| `fileUrl` | `String?` | @map("file_url") |

## Model: `TPDocumentation`
| الحقل | النوع | الوصف |
|---|---|---|
| `id` | `Int` | @id @default(autoincrement()) |
| `taxYear` | `Int` | @map("tax_year") |
| `documentType` | `String` | @map("document_type") // MASTER_FILE, LOCAL_FILE, CBCR |
| `companyId` | `Int` | @map("company_id") |
| `generatedAt` | `DateTime` | @map("generated_at") |
| `generatedBy` | `String` | @map("generated_by") |
| `fileUrl` | `String` | @map("file_url") |
| `contentJson` | `Json` | @map("content_json") // structured data |

## Model: `ICNettingCycle`
| الحقل | النوع | الوصف |
|---|---|---|
| `id` | `Int` | @id @default(autoincrement()) |
| `tenantId` | `String` | @map("tenant_id") |
| `cycleName` | `String` | @map("cycle_name") |
| `cutOffDate` | `DateTime` | @map("cut_off_date") |
| `settlementDate` | `DateTime` | @map("settlement_date") |
| `status` | `String` | @default("DRAFT") // DRAFT, PROPOSED, SETTLED |
| `createdAt` | `DateTime` | @default(now()) @map("created_at") |

## Model: `ICNettingLine`
| الحقل | النوع | الوصف |
|---|---|---|
| `id` | `Int` | @id @default(autoincrement()) |
| `cycleId` | `Int` | @map("cycle_id") |
| `fromCompanyId` | `Int` | @map("from_company_id") |
| `toCompanyId` | `Int` | @map("to_company_id") |
| `invoiceId` | `Int?` | @map("invoice_id") |
| `currency` | `String` |  |
| `grossAmount` | `Decimal` | @map("gross_amount") @db.Decimal(18, 2) |
| `nettingAmount` | `Decimal` | @map("netting_amount") @db.Decimal(18, 2) |
| `settledAmount` | `Decimal` | @map("settled_amount") @db.Decimal(18, 2) |

## Model: `ContractAsset`
| الحقل | النوع | الوصف |
|---|---|---|
| `id` | `Int` | @id @default(autoincrement()) |
| `tenantId` | `String` | @map("tenant_id") |
| `contractId` | `Int` | @map("contract_id") |
| `amount` | `Decimal` | @db.Decimal(18, 2) |
| `recognizedAt` | `DateTime` | @map("recognized_at") |
| `expectedBillingDate` | `DateTime` | @map("expected_billing_date") |
| `status` | `String` | @default("ACTIVE") |

## Model: `ContractLiability`
| الحقل | النوع | الوصف |
|---|---|---|
| `id` | `Int` | @id @default(autoincrement()) |
| `tenantId` | `String` | @map("tenant_id") |
| `contractId` | `Int` | @map("contract_id") |
| `amount` | `Decimal` | @db.Decimal(18, 2) |
| `advanceReceivedAt` | `DateTime` | @map("advance_received_at") |
| `expectedRecognitionDate` | `DateTime` | @map("expected_recognition_date") |
| `status` | `String` | @default("ACTIVE") |

## Model: `GaapLayer`
| الحقل | النوع | الوصف |
|---|---|---|
| `id` | `Int` | @id @default(autoincrement()) |
| `tenantId` | `String` | @map("tenant_id") |
| `code` | `String` | @unique // TAX, BOOK, IFRS, US_GAAP, LOCAL |
| `name` | `String` |  |
| `parentLayerId` | `Int?` | @map("parent_layer_id") // derivation chain |
| `isPrimary` | `Boolean` | @default(false) @map("is_primary") |

## Model: `GaapAdjustment`
| الحقل | النوع | الوصف |
|---|---|---|
| `id` | `Int` | @id @default(autoincrement()) |
| `tenantId` | `String` | @map("tenant_id") |
| `sourceJeId` | `Int` | @map("source_je_id") |
| `targetLayerId` | `Int` | @map("target_layer_id") |
| `adjustmentType` | `String` | @map("adjustment_type") // ELIMINATE, ADD, MODIFY |
| `description` | `String` |  |
| `journalLines` | `Json` | @map("journal_lines") |

## Model: `CashAppRule`
| الحقل | النوع | الوصف |
|---|---|---|
| `id` | `Int` | @id @default(autoincrement()) |
| `tenantId` | `String` | @map("tenant_id") |
| `name` | `String` |  |
| `matchLevel` | `Int` | // 1-6 |
| `criteria` | `Json` | // { amountTolerance, dateTolerance, invoiceMatch } |
| `action` | `String` | // AUTO_APPLY, SUGGEST |

## Model: `PosSyncLog`
| الحقل | النوع | الوصف |
|---|---|---|
| `id` | `Int` | @id @default(autoincrement()) |
| `tenantId` | `String` | @map("tenant_id") |
| `posId` | `Int` | @map("pos_id") |
| `syncDate` | `DateTime` | @default(now()) @map("sync_date") |
| `recordCount` | `Int` | @map("record_count") |
| `status` | `String` | // SUCCESS, PARTIAL, FAILED |
| `errorDetails` | `Json?` | @map("error_details") |

## Model: `CreditLimitHistory`
| الحقل | النوع | الوصف |
|---|---|---|
| `id` | `Int` | @id @default(autoincrement()) |
| `tenantId` | `String` | @map("tenant_id") |
| `customerId` | `Int` | @map("customer_id") |
| `oldLimit` | `Decimal` | @map("old_limit") @db.Decimal(18, 2) |
| `newLimit` | `Decimal` | @map("new_limit") @db.Decimal(18, 2) |
| `changedBy` | `String` | @map("changed_by") |
| `changeDate` | `DateTime` | @default(now()) @map("change_date") |
| `reason` | `String?` |  |

## Model: `PricingRule`
| الحقل | النوع | الوصف |
|---|---|---|
| `id` | `Int` | @id @default(autoincrement()) |
| `tenantId` | `String` | @map("tenant_id") |
| `name` | `String` |  |
| `priority` | `Int` |  |
| `conditions` | `Json` | // { customerGroup, qtyMin, validFrom, validTo } |
| `action` | `Json` | // { discountType: 'PERCENT', value: 10 } |
| `active` | `Boolean` | @default(true) |

## Model: `BPMNProcess`
| الحقل | النوع | الوصف |
|---|---|---|
| `id` | `Int` | @id @default(autoincrement()) |
| `tenantId` | `String` | @map("tenant_id") |
| `code` | `String` | @unique |
| `name` | `String` |  |
| `xmlDefinition` | `String` | @map("xml_definition") @db.Text |
| `version` | `Int` | @default(1) |
| `active` | `Boolean` | @default(true) |

## Model: `BPMNTask`
| الحقل | النوع | الوصف |
|---|---|---|
| `id` | `Int` | @id @default(autoincrement()) |
| `tenantId` | `String` | @map("tenant_id") |
| `processId` | `Int` | @map("process_id") |
| `taskName` | `String` | @map("task_name") |
| `assignee` | `String?` |  |
| `status` | `String` | @default("PENDING") // PENDING, COMPLETED, FAILED |
| `payload` | `Json?` |  |
| `createdAt` | `DateTime` | @default(now()) @map("created_at") |

## Model: `MobileDevice`
| الحقل | النوع | الوصف |
|---|---|---|
| `id` | `Int` | @id @default(autoincrement()) |
| `tenantId` | `String` | @map("tenant_id") |
| `deviceId` | `String` | @unique @map("device_id") |
| `userId` | `String` | @map("user_id") |
| `lastSyncAt` | `DateTime` | @map("last_sync_at") |
| `status` | `String` | @default("ACTIVE") |

## Model: `TaxRegime`
| الحقل | النوع | الوصف |
|---|---|---|
| `id` | `Int` | @id @default(autoincrement()) |
| `tenantId` | `String` | @map("tenant_id") |
| `countryCode` | `String` | @map("country_code") |
| `regimeName` | `String` | @map("regime_name") |
| `currency` | `String` |  |
| `taxRate` | `Decimal` | @map("tax_rate") @db.Decimal(5, 2) |

## Model: `ShiftSchedule`
| الحقل | النوع | الوصف |
|---|---|---|
| `id` | `Int` | @id @default(autoincrement()) |
| `tenantId` | `String` | @map("tenant_id") |
| `employeeId` | `Int` | @map("employee_id") |
| `date` | `DateTime` |  |
| `shiftType` | `String` | @map("shift_type") // MORNING, EVENING, NIGHT |
| `startTime` | `DateTime` | @map("start_time") |
| `endTime` | `DateTime` | @map("end_time") |
| `status` | `String` | @default("PUBLISHED") |

## Model: `OvertimeRequest`
| الحقل | النوع | الوصف |
|---|---|---|
| `id` | `Int` | @id @default(autoincrement()) |
| `tenantId` | `String` | @map("tenant_id") |
| `employeeId` | `Int` | @map("employee_id") |
| `requestDate` | `DateTime` | @map("request_date") |
| `hours` | `Decimal` | @db.Decimal(5, 2) |
| `reason` | `String?` |  |
| `status` | `String` | @default("PENDING") // PENDING, APPROVED, REJECTED |
| `approvedBy` | `Int?` | @map("approved_by") |

## Model: `MudadSyncLog`
| الحقل | النوع | الوصف |
|---|---|---|
| `id` | `Int` | @id @default(autoincrement()) |
| `tenantId` | `String` | @map("tenant_id") |
| `payrollRunId` | `Int` | @map("payroll_run_id") |
| `syncDate` | `DateTime` | @default(now()) @map("sync_date") |
| `status` | `String` | // SUCCESS, FAILED |
| `errorDetails` | `Json?` | @map("error_details") |

## Model: `WmsWave`
| الحقل | النوع | الوصف |
|---|---|---|
| `id` | `Int` | @id @default(autoincrement()) |
| `tenantId` | `String` | @map("tenant_id") |
| `waveNumber` | `String` | @unique @map("wave_number") |
| `status` | `String` | @default("DRAFT") // DRAFT, ALLOCATED, PICKING, COMPLETED |
| `priority` | `Int` | @default(1) |
| `assignedTo` | `Int?` | @map("assigned_to") |
| `createdAt` | `DateTime` | @default(now()) @map("created_at") |

## Model: `DemandForecast`
| الحقل | النوع | الوصف |
|---|---|---|
| `id` | `Int` | @id @default(autoincrement()) |
| `tenantId` | `String` | @map("tenant_id") |
| `itemId` | `Int` | @map("item_id") |
| `targetDate` | `DateTime` | @map("target_date") |
| `forecastQty` | `Decimal` | @map("forecast_qty") @db.Decimal(18, 2) |
| `confidence` | `Decimal` | @db.Decimal(5, 2) |
| `modelUsed` | `String` | @map("model_used") // AI_ARIMA, ML_REGRESSION |

## Model: `InventoryBin`
| الحقل | النوع | الوصف |
|---|---|---|
| `id` | `Int` | @id @default(autoincrement()) |
| `tenantId` | `String` | @map("tenant_id") |
| `warehouseId` | `Int` | @map("warehouse_id") |
| `binCode` | `String` | @map("bin_code") |
| `capacity` | `Decimal` | @db.Decimal(18, 2) |
| `currentVol` | `Decimal` | @default(0) @map("current_vol") @db.Decimal(18, 2) |
| `status` | `String` | @default("ACTIVE") |

## Model: `EquityStatementLine`
| الحقل | النوع | الوصف |
|---|---|---|
| `id` | `Int` | @id @default(autoincrement()) |
| `tenantId` | `String` | @map("tenant_id") |
| `period` | `String` |  |
| `column` | `String` |  |
| `row` | `String` |  |
| `amount` | `Decimal` | @db.Decimal(18, 2) |
| `layer` | `String` | @default("BOOK") |

## Model: `CashFlowLine`
| الحقل | النوع | الوصف |
|---|---|---|
| `id` | `Int` | @id @default(autoincrement()) |
| `tenantId` | `String` | @map("tenant_id") |
| `period` | `String` |  |
| `method` | `String` | @default("DIRECT") |
| `category` | `String` |  |
| `subCategory` | `String` | @map("sub_category") |
| `amount` | `Decimal` | @db.Decimal(18, 2) |

## Model: `FsNote`
| الحقل | النوع | الوصف |
|---|---|---|
| `id` | `Int` | @id @default(autoincrement()) |
| `tenantId` | `String` | @map("tenant_id") |
| `period` | `String` |  |
| `noteNumber` | `Int` | @map("note_number") |
| `noteType` | `String` | @map("note_type") |
| `content` | `Json` |  |
| `generatedAt` | `DateTime` | @default(now()) @map("generated_at") |

## Model: `OperatingSegment`
| الحقل | النوع | الوصف |
|---|---|---|
| `id` | `Int` | @id @default(autoincrement()) |
| `tenantId` | `String` | @map("tenant_id") |
| `code` | `String` | @unique |
| `name` | `String` |  |
| `managerId` | `Int?` | @map("manager_id") |
| `isReportable` | `Boolean` | @default(true) @map("is_reportable") |

## Model: `SegmentResult`
| الحقل | النوع | الوصف |
|---|---|---|
| `id` | `Int` | @id @default(autoincrement()) |
| `segmentId` | `Int` | @map("segment_id") |
| `period` | `String` |  |
| `revenue` | `Decimal` | @db.Decimal(18, 2) |
| `opex` | `Decimal` | @db.Decimal(18, 2) |
| `assets` | `Decimal` | @db.Decimal(18, 2) |
| `liabilities` | `Decimal` | @db.Decimal(18, 2) |

## Model: `CopaAllocation`
| الحقل | النوع | الوصف |
|---|---|---|
| `id` | `Int` | @id @default(autoincrement()) |
| `sourceCC` | `Int` | @map("source_cc") |
| `targetDim` | `String` | @map("target_dim") |
| `allocationKey` | `String` | @map("allocation_key") |
| `percent` | `Decimal` | @db.Decimal(7, 4) |

## Model: `AssetRetirementObligation`
| الحقل | النوع | الوصف |
|---|---|---|
| `id` | `Int` | @id @default(autoincrement()) |
| `tenantId` | `String` | @map("tenant_id") |
| `assetId` | `Int` | @map("asset_id") |
| `estimatedSettlementCost` | `Decimal` | @map("estimated_settlement_cost") @db.Decimal(18, 2) |
| `estimatedSettlementDate` | `DateTime` | @map("estimated_settlement_date") |
| `discountRate` | `Decimal` | @map("discount_rate") @db.Decimal(7, 4) |
| `presentValue` | `Decimal` | @map("present_value") @db.Decimal(18, 2) |
| `status` | `String` | @default("ACTIVE") |

## Model: `AROAccretion`
| الحقل | النوع | الوصف |
|---|---|---|
| `id` | `Int` | @id @default(autoincrement()) |
| `aroId` | `Int` | @map("aro_id") |
| `period` | `DateTime` |  |
| `accretionAmount` | `Decimal` | @map("accretion_amount") @db.Decimal(18, 2) |
| `journalEntryId` | `Int?` | @map("journal_entry_id") |

## Model: `DunningExecution`
| الحقل | النوع | الوصف |
|---|---|---|
| `id` | `Int` | @id @default(autoincrement()) |
| `tenantId` | `String` | @map("tenant_id") |
| `customerId` | `Int` | @map("customer_id") |
| `invoiceId` | `Int` | @map("invoice_id") |
| `level` | `Int` |  |
| `executedAt` | `DateTime` | @default(now()) @map("executed_at") |
| `channel` | `String` |  |
| `status` | `String` |  |

## Model: `BadDebtProvision`
| الحقل | النوع | الوصف |
|---|---|---|
| `id` | `Int` | @id @default(autoincrement()) |
| `tenantId` | `String` | @map("tenant_id") |
| `customerId` | `Int` | @map("customer_id") |
| `provisionAmount` | `Decimal` | @map("provision_amount") @db.Decimal(18, 2) |
| `period` | `String` |  |
| `approvalStatus` | `String` | @default("PENDING") @map("approval_status") |
| `reason` | `String?` |  |

## Model: `VendorOnboarding`
| الحقل | النوع | الوصف |
|---|---|---|
| `id` | `Int` | @id @default(autoincrement()) |
| `tenantId` | `String` | @map("tenant_id") |
| `vendorId` | `Int?` | @map("vendor_id") |
| `applicationData` | `Json` | @map("application_data") |
| `kycDocuments` | `Json?` | @map("kyc_documents") |
| `riskScore` | `Decimal?` | @map("risk_score") @db.Decimal(5, 2) |
| `sanctionsMatch` | `Boolean` | @default(false) @map("sanctions_match") |
| `amlChecks` | `Json?` | @map("aml_checks") |
| `status` | `String` | @default("PENDING") |
| `currentStage` | `String` | @default("INITIAL") @map("current_stage") |
| `createdAt` | `DateTime` | @default(now()) @map("created_at") |
| `updatedAt` | `DateTime` | @updatedAt @map("updated_at") |

## Model: `ReverseAuction`
| الحقل | النوع | الوصف |
|---|---|---|
| `id` | `Int` | @id @default(autoincrement()) |
| `tenantId` | `String` | @map("tenant_id") |
| `rfqId` | `Int` | @map("rfq_id") |
| `title` | `String` |  |
| `startTime` | `DateTime` | @map("start_time") |
| `endTime` | `DateTime` | @map("end_time") |
| `status` | `String` | @default("DRAFT") |
| `currentLowBid` | `Decimal?` | @map("current_low_bid") @db.Decimal(18, 2) |
| `winnerId` | `Int?` | @map("winner_id") |
| `autoExtendMinutes` | `Int` | @default(5) @map("auto_extend_minutes") |

## Model: `AuctionBid`
| الحقل | النوع | الوصف |
|---|---|---|
| `id` | `Int` | @id @default(autoincrement()) |
| `auctionId` | `Int` | @map("auction_id") |
| `vendorId` | `Int` | @map("vendor_id") |
| `amount` | `Decimal` | @db.Decimal(18, 2) |
| `submittedAt` | `DateTime` | @default(now()) @map("submitted_at") |
| `isWinner` | `Boolean` | @default(false) @map("is_winner") |

## Model: `SpendCategory`
| الحقل | النوع | الوصف |
|---|---|---|
| `id` | `Int` | @id @default(autoincrement()) |
| `tenantId` | `String` | @map("tenant_id") |
| `code` | `String` | @unique |
| `name` | `String` |  |
| `parentId` | `Int?` | @map("parent_id") |
| `approvalThreshold` | `Decimal?` | @map("approval_threshold") @db.Decimal(18, 2) |

## Model: `SpendClassification`
| الحقل | النوع | الوصف |
|---|---|---|
| `id` | `Int` | @id @default(autoincrement()) |
| `tenantId` | `String` | @map("tenant_id") |
| `transactionType` | `String` | @map("transaction_type") |
| `transactionId` | `Int` | @map("transaction_id") |
| `categoryId` | `Int` | @map("category_id") |
| `classifiedBy` | `String` | @map("classified_by") |
| `confidence` | `Decimal?` | @db.Decimal(5, 2) |

## Model: `BlanketPO`
| الحقل | النوع | الوصف |
|---|---|---|
| `id` | `Int` | @id @default(autoincrement()) |
| `tenantId` | `String` | @map("tenant_id") |
| `poNumber` | `String` | @unique @map("po_number") |
| `vendorId` | `Int` | @map("vendor_id") |
| `validFrom` | `DateTime` | @map("valid_from") |
| `validTo` | `DateTime` | @map("valid_to") |
| `totalValue` | `Decimal` | @map("total_value") @db.Decimal(18, 2) |
| `consumedValue` | `Decimal` | @default(0) @map("consumed_value") @db.Decimal(18, 2) |
| `remainingValue` | `Decimal` | @map("remaining_value") @db.Decimal(18, 2) |
| `status` | `String` | @default("ACTIVE") |

## Model: `BlanketPORelease`
| الحقل | النوع | الوصف |
|---|---|---|
| `id` | `Int` | @id @default(autoincrement()) |
| `blanketPoId` | `Int` | @map("blanket_po_id") |
| `releaseNumber` | `String` | @map("release_number") |
| `releaseDate` | `DateTime` | @map("release_date") |
| `quantity` | `Decimal` | @db.Decimal(18, 2) |
| `amount` | `Decimal` | @db.Decimal(18, 2) |
| `status` | `String` | @default("RELEASED") |

## Model: `DropShipLink`
| الحقل | النوع | الوصف |
|---|---|---|
| `id` | `Int` | @id @default(autoincrement()) |
| `soId` | `Int` | @map("so_id") |
| `poId` | `Int` | @map("po_id") |
| `trackingNumber` | `String?` | @map("tracking_number") |
| `carrierId` | `Int?` | @map("carrier_id") |

## Model: `SlottingRecommendation`
| الحقل | النوع | الوصف |
|---|---|---|
| `id` | `Int` | @id @default(autoincrement()) |
| `tenantId` | `String` | @map("tenant_id") |
| `itemId` | `Int` | @map("item_id") |
| `currentBin` | `String?` | @map("current_bin") |
| `suggestedBin` | `String` | @map("suggested_bin") |
| `velocityClass` | `String` | @map("velocity_class") |
| `generatedAt` | `DateTime` | @default(now()) @map("generated_at") |
| `status` | `String` | @default("PENDING") |

## Model: `CrossDockAssignment`
| الحقل | النوع | الوصف |
|---|---|---|
| `id` | `Int` | @id @default(autoincrement()) |
| `tenantId` | `String` | @map("tenant_id") |
| `grnId` | `Int` | @map("grn_id") |
| `soId` | `Int` | @map("so_id") |
| `itemId` | `Int` | @map("item_id") |
| `quantity` | `Decimal` | @db.Decimal(18, 2) |
| `status` | `String` | @default("PENDING") |

## Model: `ShopfloorStation`
| الحقل | النوع | الوصف |
|---|---|---|
| `id` | `Int` | @id @default(autoincrement()) |
| `tenantId` | `String` | @map("tenant_id") |
| `workCenterId` | `Int` | @map("work_center_id") |
| `code` | `String` |  |
| `operatorId` | `Int?` | @map("operator_id") |
| `currentWoId` | `Int?` | @map("current_wo_id") |
| `status` | `String` | @default("IDLE") |
| `lastHeartbeat` | `DateTime?` | @map("last_heartbeat") |

## Model: `ShopfloorEvent`
| الحقل | النوع | الوصف |
|---|---|---|
| `id` | `Int` | @id @default(autoincrement()) |
| `stationId` | `Int` | @map("station_id") |
| `eventType` | `String` | @map("event_type") |
| `quantity` | `Int?` |  |
| `rejectReason` | `String?` | @map("reject_reason") |
| `occurredAt` | `DateTime` | @default(now()) @map("occurred_at") |

## Model: `ScheduleRun`
| الحقل | النوع | الوصف |
|---|---|---|
| `id` | `Int` | @id @default(autoincrement()) |
| `tenantId` | `String` | @map("tenant_id") |
| `runDate` | `DateTime` | @default(now()) @map("run_date") |
| `horizonDays` | `Int` | @map("horizon_days") |
| `status` | `String` | @default("RUNNING") |

## Model: `SpcChart`
| الحقل | النوع | الوصف |
|---|---|---|
| `id` | `Int` | @id @default(autoincrement()) |
| `tenantId` | `String` | @map("tenant_id") |
| `processCode` | `String` | @map("process_code") |
| `chartType` | `String` | @map("chart_type") |
| `parameterMeasured` | `String` | @map("parameter_measured") |
| `unitOfMeasure` | `String` | @map("unit_of_measure") |
| `ucl` | `Decimal` | @db.Decimal(18, 4) |
| `lcl` | `Decimal` | @db.Decimal(18, 4) |
| `target` | `Decimal` | @db.Decimal(18, 4) |
| `subgroupSize` | `Int` | @map("subgroup_size") |

## Model: `SpcMeasurement`
| الحقل | النوع | الوصف |
|---|---|---|
| `id` | `Int` | @id @default(autoincrement()) |
| `chartId` | `Int` | @map("chart_id") |
| `subgroupNumber` | `Int` | @map("subgroup_number") |
| `measurements` | `Json` |  |
| `mean` | `Decimal` | @db.Decimal(18, 4) |
| `range` | `Decimal` | @db.Decimal(18, 4) |
| `outOfControl` | `Boolean` | @default(false) @map("out_of_control") |
| `occurredAt` | `DateTime` | @default(now()) @map("occurred_at") |

## Model: `OEERecord`
| الحقل | النوع | الوصف |
|---|---|---|
| `id` | `Int` | @id @default(autoincrement()) |
| `tenantId` | `String` | @map("tenant_id") |
| `machineId` | `Int` | @map("machine_id") |
| `shiftId` | `Int?` | @map("shift_id") |
| `availability` | `Decimal` | @db.Decimal(5, 4) |
| `performance` | `Decimal` | @db.Decimal(5, 4) |
| `quality` | `Decimal` | @db.Decimal(5, 4) |
| `oee` | `Decimal` | @db.Decimal(5, 4) |
| `totalCount` | `Int` | @map("total_count") |
| `rejectCount` | `Int` | @map("reject_count") |
| `recordedAt` | `DateTime` | @default(now()) @map("recorded_at") |

## Model: `SopCycle`
| الحقل | النوع | الوصف |
|---|---|---|
| `id` | `Int` | @id @default(autoincrement()) |
| `tenantId` | `String` | @map("tenant_id") |
| `cycleMonth` | `DateTime` | @map("cycle_month") |
| `status` | `String` | @default("STAGE1") |
| `stageOutputs` | `Json?` | @map("stage_outputs") |
| `executiveDecisions` | `Json?` | @map("executive_decisions") |

## Model: `CalibratableEquipment`
| الحقل | النوع | الوصف |
|---|---|---|
| `id` | `Int` | @id @default(autoincrement()) |
| `tenantId` | `String` | @map("tenant_id") |
| `equipmentNumber` | `String` | @unique @map("equipment_number") |
| `description` | `String` |  |
| `calibrationFrequencyDays` | `Int` | @map("calibration_frequency_days") |
| `lastCalibrated` | `DateTime` | @map("last_calibrated") |
| `nextCalibrationDue` | `DateTime` | @map("next_calibration_due") |

## Model: `CalibrationRecord`
| الحقل | النوع | الوصف |
|---|---|---|
| `id` | `Int` | @id @default(autoincrement()) |
| `equipmentId` | `Int` | @map("equipment_id") |
| `calibrationDate` | `DateTime` | @map("calibration_date") |
| `performedBy` | `Int` | @map("performed_by") |
| `result` | `String` |  |
| `certificateUrl` | `String?` | @map("certificate_url") |
| `nextDueDate` | `DateTime` | @map("next_due_date") |

## Model: `SuccessionPlan`
| الحقل | النوع | الوصف |
|---|---|---|
| `id` | `Int` | @id @default(autoincrement()) |
| `tenantId` | `String` | @map("tenant_id") |
| `positionId` | `Int` | @map("position_id") |
| `incumbentId` | `Int?` | @map("incumbent_id") |
| `riskOfLoss` | `String` | @map("risk_of_loss") |

## Model: `SuccessionCandidate`
| الحقل | النوع | الوصف |
|---|---|---|
| `id` | `Int` | @id @default(autoincrement()) |
| `planId` | `Int` | @map("plan_id") |
| `employeeId` | `Int` | @map("employee_id") |
| `readiness` | `String` |  |
| `gaps` | `Json` |  |
| `developmentPlan` | `Json?` | @map("development_plan") |

## Model: `NineBoxRating`
| الحقل | النوع | الوصف |
|---|---|---|
| `id` | `Int` | @id @default(autoincrement()) |
| `tenantId` | `String` | @map("tenant_id") |
| `employeeId` | `Int` | @map("employee_id") |
| `reviewCycle` | `String` | @map("review_cycle") |
| `performance` | `Int` |  |
| `potential` | `Int` |  |
| `box` | `Int` |  |

## Model: `Competency`
| الحقل | النوع | الوصف |
|---|---|---|
| `id` | `Int` | @id @default(autoincrement()) |
| `tenantId` | `String` | @map("tenant_id") |
| `code` | `String` | @unique |
| `category` | `String` |  |
| `name` | `String` |  |
| `levels` | `Json` |  |

## Model: `EmployeeCompetency`
| الحقل | النوع | الوصف |
|---|---|---|
| `id` | `Int` | @id @default(autoincrement()) |
| `employeeId` | `Int` | @map("employee_id") |
| `competencyId` | `Int` | @map("competency_id") |
| `currentLevel` | `Int` | @map("current_level") |
| `assessedAt` | `DateTime` | @map("assessed_at") |
| `assessedBy` | `Int` | @map("assessed_by") |

## Model: `CareerPath`
| الحقل | النوع | الوصف |
|---|---|---|
| `id` | `Int` | @id @default(autoincrement()) |
| `fromJobId` | `Int` | @map("from_job_id") |
| `toJobId` | `Int` | @map("to_job_id") |
| `requiredYears` | `Int` | @map("required_years") |

## Model: `CompReviewCycle`
| الحقل | النوع | الوصف |
|---|---|---|
| `id` | `Int` | @id @default(autoincrement()) |
| `tenantId` | `String` | @map("tenant_id") |
| `name` | `String` |  |
| `fiscalYear` | `Int` | @map("fiscal_year") |
| `budgetPool` | `Decimal` | @map("budget_pool") @db.Decimal(18, 2) |
| `status` | `String` | @default("OPEN") |

## Model: `EmployeeCompProposal`
| الحقل | النوع | الوصف |
|---|---|---|
| `id` | `Int` | @id @default(autoincrement()) |
| `cycleId` | `Int` | @map("cycle_id") |
| `employeeId` | `Int` | @map("employee_id") |
| `currentSalary` | `Decimal` | @map("current_salary") @db.Decimal(18, 2) |
| `proposedIncrease` | `Decimal` | @map("proposed_increase") @db.Decimal(18, 2) |
| `proposedNewSalary` | `Decimal` | @map("proposed_new_salary") @db.Decimal(18, 2) |
| `approvalStatus` | `String` | @default("PENDING") @map("approval_status") |

## Model: `Objective`
| الحقل | النوع | الوصف |
|---|---|---|
| `id` | `Int` | @id @default(autoincrement()) |
| `tenantId` | `String` | @map("tenant_id") |
| `ownerEmpId` | `Int` | @map("owner_emp_id") |
| `title` | `String` |  |
| `period` | `String` |  |
| `parentObjectiveId` | `Int?` | @map("parent_objective_id") |
| `level` | `String` |  |

## Model: `KeyResult`
| الحقل | النوع | الوصف |
|---|---|---|
| `id` | `Int` | @id @default(autoincrement()) |
| `objectiveId` | `Int` | @map("objective_id") |
| `title` | `String` |  |
| `targetValue` | `Decimal` | @map("target_value") @db.Decimal(18, 2) |
| `currentValue` | `Decimal` | @default(0) @map("current_value") @db.Decimal(18, 2) |
| `confidence` | `Int` | @default(3) |

## Model: `Candidate`
| الحقل | النوع | الوصف |
|---|---|---|
| `id` | `Int` | @id @default(autoincrement()) |
| `tenantId` | `String` | @map("tenant_id") |
| `name` | `String` |  |
| `email` | `String` |  |
| `phone` | `String?` |  |
| `resumeUrl` | `String?` | @map("resume_url") |
| `source` | `String` | @default("CAREER_PAGE") |

## Model: `JobApplication`
| الحقل | النوع | الوصف |
|---|---|---|
| `id` | `Int` | @id @default(autoincrement()) |
| `candidateId` | `Int` | @map("candidate_id") |
| `requisitionId` | `Int?` | @map("requisition_id") |
| `stage` | `String` | @default("APPLIED") |
| `screenScore` | `Decimal?` | @map("screen_score") @db.Decimal(5, 2) |
| `rejectionReason` | `String?` | @map("rejection_reason") |

## Model: `AttendanceDevice`
| الحقل | النوع | الوصف |
|---|---|---|
| `id` | `Int` | @id @default(autoincrement()) |
| `tenantId` | `String` | @map("tenant_id") |
| `deviceCode` | `String` | @unique @map("device_code") |
| `location` | `String` |  |
| `type` | `String` |  |
| `lastSync` | `DateTime?` | @map("last_sync") |

## Model: `AttendancePunch`
| الحقل | النوع | الوصف |
|---|---|---|
| `id` | `Int` | @id @default(autoincrement()) |
| `tenantId` | `String` | @map("tenant_id") |
| `employeeId` | `Int` | @map("employee_id") |
| `deviceId` | `Int?` | @map("device_id") |
| `punchType` | `String` | @map("punch_type") |
| `punchTime` | `DateTime` | @map("punch_time") |
| `geoLatitude` | `Decimal?` | @map("geo_latitude") @db.Decimal(10, 8) |
| `geoLongitude` | `Decimal?` | @map("geo_longitude") @db.Decimal(11, 8) |
| `matchConfidence` | `Decimal?` | @map("match_confidence") @db.Decimal(5, 2) |

## Model: `SafetyIncident`
| الحقل | النوع | الوصف |
|---|---|---|
| `id` | `Int` | @id @default(autoincrement()) |
| `tenantId` | `String` | @map("tenant_id") |
| `incidentNumber` | `String` | @unique @map("incident_number") |
| `reportedBy` | `Int` | @map("reported_by") |
| `occurredAt` | `DateTime` | @map("occurred_at") |
| `location` | `String` |  |
| `severity` | `String` |  |
| `description` | `String` | @db.Text |
| `status` | `String` | @default("REPORTED") |
| `rootCause` | `String?` | @map("root_cause") |

## Model: `AudienceSegment`
| الحقل | النوع | الوصف |
|---|---|---|
| `id` | `Int` | @id @default(autoincrement()) |
| `tenantId` | `String` | @map("tenant_id") |
| `name` | `String` |  |
| `filterJson` | `Json` | @map("filter_json") |
| `estimatedSize` | `Int` | @default(0) @map("estimated_size") |
| `lastRefreshed` | `DateTime?` | @map("last_refreshed") |

## Model: `CampaignJourney`
| الحقل | النوع | الوصف |
|---|---|---|
| `id` | `Int` | @id @default(autoincrement()) |
| `campaignId` | `Int` | @map("campaign_id") |
| `journeyJson` | `Json` | @map("journey_json") |

## Model: `CustomerHealth`
| الحقل | النوع | الوصف |
|---|---|---|
| `id` | `Int` | @id @default(autoincrement()) |
| `tenantId` | `String` | @map("tenant_id") |
| `customerId` | `Int` | @map("customer_id") |
| `score` | `Decimal` | @db.Decimal(5, 2) |
| `churnRisk` | `String` | @map("churn_risk") |
| `factors` | `Json` |  |
| `computedAt` | `DateTime` | @default(now()) @map("computed_at") |

## Model: `SalesTerritory`
| الحقل | النوع | الوصف |
|---|---|---|
| `id` | `Int` | @id @default(autoincrement()) |
| `tenantId` | `String` | @map("tenant_id") |
| `code` | `String` | @unique |
| `name` | `String` |  |
| `managerId` | `Int` | @map("manager_id") |
| `regions` | `Json` |  |

## Model: `SalesQuota`
| الحقل | النوع | الوصف |
|---|---|---|
| `id` | `Int` | @id @default(autoincrement()) |
| `tenantId` | `String` | @map("tenant_id") |
| `userId` | `Int` | @map("user_id") |
| `period` | `String` |  |
| `quotaAmount` | `Decimal` | @map("quota_amount") @db.Decimal(18, 2) |
| `actualAmount` | `Decimal` | @default(0) @map("actual_amount") @db.Decimal(18, 2) |

## Model: `ForecastCommit`
| الحقل | النوع | الوصف |
|---|---|---|
| `id` | `Int` | @id @default(autoincrement()) |
| `tenantId` | `String` | @map("tenant_id") |
| `userId` | `Int` | @map("user_id") |
| `period` | `String` |  |
| `commitAmount` | `Decimal` | @map("commit_amount") @db.Decimal(18, 2) |
| `bestCaseAmount` | `Decimal` | @map("best_case_amount") @db.Decimal(18, 2) |
| `actualAmount` | `Decimal?` | @map("actual_amount") @db.Decimal(18, 2) |
| `submittedAt` | `DateTime` | @default(now()) @map("submitted_at") |

## Model: `SurveyTemplate`
| الحقل | النوع | الوصف |
|---|---|---|
| `id` | `Int` | @id @default(autoincrement()) |
| `tenantId` | `String` | @map("tenant_id") |
| `name` | `String` |  |
| `type` | `String` |  |
| `questions` | `Json` |  |

## Model: `SurveyResponse`
| الحقل | النوع | الوصف |
|---|---|---|
| `id` | `Int` | @id @default(autoincrement()) |
| `tenantId` | `String` | @map("tenant_id") |
| `templateId` | `Int` | @map("template_id") |
| `customerId` | `Int?` | @map("customer_id") |
| `answers` | `Json` |  |
| `npsScore` | `Int?` | @map("nps_score") |
| `csatScore` | `Int?` | @map("csat_score") |
| `respondedAt` | `DateTime` | @default(now()) @map("responded_at") |

## Model: `Conversation`
| الحقل | النوع | الوصف |
|---|---|---|
| `id` | `Int` | @id @default(autoincrement()) |
| `tenantId` | `String` | @map("tenant_id") |
| `channelType` | `String` | @map("channel_type") |
| `customerId` | `Int?` | @map("customer_id") |
| `assignedTo` | `Int?` | @map("assigned_to") |
| `status` | `String` | @default("OPEN") |
| `tags` | `Json?` |  |
| `createdAt` | `DateTime` | @default(now()) @map("created_at") |

## Model: `ConversationMessage`
| الحقل | النوع | الوصف |
|---|---|---|
| `id` | `Int` | @id @default(autoincrement()) |
| `conversationId` | `Int` | @map("conversation_id") |
| `direction` | `String` |  |
| `content` | `String` | @db.Text |
| `sentAt` | `DateTime` | @default(now()) @map("sent_at") |
| `sentBy` | `Int?` | @map("sent_by") |

## Model: `CustomPage`
| الحقل | النوع | الوصف |
|---|---|---|
| `id` | `Int` | @id @default(autoincrement()) |
| `tenantId` | `String` | @map("tenant_id") |
| `slug` | `String` | @unique |
| `title` | `String` |  |
| `layout` | `Json` |  |
| `permissions` | `Json` |  |
| `publishedAt` | `DateTime?` | @map("published_at") |

## Model: `CustomForm`
| الحقل | النوع | الوصف |
|---|---|---|
| `id` | `Int` | @id @default(autoincrement()) |
| `tenantId` | `String` | @map("tenant_id") |
| `name` | `String` |  |
| `entityBinding` | `String` | @map("entity_binding") |
| `fields` | `Json` |  |
| `submitAction` | `Json` | @map("submit_action") |

## Model: `SsoProvider`
| الحقل | النوع | الوصف |
|---|---|---|
| `id` | `Int` | @id @default(autoincrement()) |
| `tenantId` | `String` | @map("tenant_id") |
| `type` | `String` |  |
| `name` | `String` |  |
| `metadataUrl` | `String?` | @map("metadata_url") |
| `clientId` | `String?` | @map("client_id") |
| `clientSecret` | `String?` | @map("client_secret") |
| `attributeMapping` | `Json?` | @map("attribute_mapping") |
| `isActive` | `Boolean` | @default(true) @map("is_active") |

## Model: `EncryptedField`
| الحقل | النوع | الوصف |
|---|---|---|
| `id` | `Int` | @id @default(autoincrement()) |
| `entityType` | `String` | @map("entity_type") |
| `entityId` | `Int` | @map("entity_id") |
| `fieldName` | `String` | @map("field_name") |
| `ciphertext` | `String` | @db.Text |
| `dekId` | `String` | @map("dek_id") |
| `iv` | `String` |  |
| `authTag` | `String` | @map("auth_tag") |

## Model: `PeriodLock`
| الحقل | النوع | الوصف |
|---|---|---|
| `id` | `Int` | @id @default(autoincrement()) |
| `tenantId` | `String` | @map("tenant_id") |
| `period` | `String` | // YYYY-MM |
| `status` | `String` | @default("OPEN") // OPEN | LOCKED | TEMP_UNLOCKED |
| `lockedBy` | `String?` | @map("locked_by") |
| `lockedAt` | `DateTime?` | @map("locked_at") |
| `unlockedBy` | `String?` | @map("unlocked_by") |
| `unlockedAt` | `DateTime?` | @map("unlocked_at") |
| `reason` | `String?` |  |
| `createdAt` | `DateTime` | @default(now()) @map("created_at") |
| `updatedAt` | `DateTime` | @updatedAt @map("updated_at") |

## Model: `AccrualEntry`
| الحقل | النوع | الوصف |
|---|---|---|
| `id` | `Int` | @id @default(autoincrement()) |
| `tenantId` | `String` | @map("tenant_id") |
| `type` | `String` | // ACCRUAL | PREPAYMENT |
| `period` | `String` | // YYYY-MM |
| `description` | `String` |  |
| `amount` | `Decimal` | @db.Decimal(15, 2) |
| `monthlyAmount` | `Decimal?` | @map("monthly_amount") @db.Decimal(15, 2) |
| `months` | `Int` | @default(1) |
| `remainingMonths` | `Int` | @default(0) @map("remaining_months") |
| `startDate` | `DateTime?` | @map("start_date") |
| `expenseAccountId` | `Int?` | @map("expense_account_id") |
| `accrualAccountId` | `Int?` | @map("accrual_account_id") |
| `journalEntryId` | `Int?` | @map("journal_entry_id") |
| `reference` | `String?` |  |
| `status` | `String` | @default("ACTIVE") // ACTIVE | COMPLETED | CANCELLED |
| `createdBy` | `String?` | @map("created_by") |
| `createdAt` | `DateTime` | @default(now()) @map("created_at") |
| `updatedAt` | `DateTime` | @updatedAt @map("updated_at") |

## Model: `CollectionActivity`
| الحقل | النوع | الوصف |
|---|---|---|
| `id` | `Int` | @id @default(autoincrement()) |
| `tenantId` | `String` | @map("tenant_id") |
| `customerId` | `Int?` | @map("customer_id") |
| `invoiceId` | `Int?` | @map("invoice_id") |
| `type` | `String` | // CALL | EMAIL | VISIT | LEGAL_NOTICE | WRITE_OFF | PROMISE | PAYMENT_RECEIVED | ESCALATED_BROKEN_PROMISE | DUNNING_L1..L4 |
| `notes` | `String?` | @db.Text |
| `dueAmount` | `Decimal?` | @map("due_amount") @db.Decimal(15, 2) |
| `daysPastDue` | `Int?` | @map("days_past_due") |
| `performedAt` | `DateTime` | @map("performed_at") |
| `performedBy` | `String` | @map("performed_by") |
| `createdAt` | `DateTime` | @default(now()) @map("created_at") |

## Model: `PrepaymentSchedule`
| الحقل | النوع | الوصف |
|---|---|---|
| `id` | `Int` | @id @default(autoincrement()) |
| `tenantId` | `String` | @map("tenant_id") |
| `accrualEntryId` | `Int` | @map("accrual_entry_id") |
| `period` | `String` | // YYYY-MM |
| `monthlyAmount` | `Decimal` | @map("monthly_amount") @db.Decimal(15, 2) |
| `journalEntryId` | `Int?` | @map("journal_entry_id") |
| `status` | `String` | @default("PENDING") // PENDING | POSTED | SKIPPED |
| `postedAt` | `DateTime?` | @map("posted_at") |
| `createdAt` | `DateTime` | @default(now()) @map("created_at") |

## Model: `DemandForecastV2`
| الحقل | النوع | الوصف |
|---|---|---|
| `id` | `String` | @id @default(cuid()) |
| `tenantId` | `String` |  |
| `productId` | `String` |  |
| `warehouseId` | `String` |  |
| `forecastDate` | `DateTime` |  |
| `horizonDays` | `Int` |  |
| `p50` | `Decimal` | @db.Decimal(15, 4) |
| `p90` | `Decimal` | @db.Decimal(15, 4) |
| `p99` | `Decimal` | @db.Decimal(15, 4) |
| `lowerBound` | `Decimal` | @db.Decimal(15, 4) |
| `upperBound` | `Decimal` | @db.Decimal(15, 4) |
| `modelVersion` | `String` |  |
| `mape` | `Decimal?` | @db.Decimal(6, 4) |
| `fittedAt` | `DateTime` | @default(now()) |

## Model: `EmissionLog`
| الحقل | النوع | الوصف |
|---|---|---|
| `id` | `String` | @id @default(cuid()) |
| `tenantId` | `String` |  |
| `date` | `DateTime` |  |
| `scope` | `Int` | // 1, 2, or 3 |
| `factorKey` | `String` |  |
| `qty` | `Decimal` | @db.Decimal(15, 4) |
| `unit` | `String` |  |
| `kgCO2e` | `Decimal` | @db.Decimal(15, 4) |
| `factorSource` | `String` |  |
| `branchId` | `String?` |  |
| `vendorId` | `String?` |  |
| `productId` | `String?` |  |
| `reference` | `String?` |  |
| `createdAt` | `DateTime` | @default(now()) |

## Model: `EnergyConsumption`
| الحقل | النوع | الوصف |
|---|---|---|
| `id` | `String` | @id @default(cuid()) |
| `tenantId` | `String` |  |
| `branchId` | `String` |  |
| `date` | `DateTime` |  |
| `source` | `String` | // GRID, SOLAR, DIESEL_GENERATOR |
| `kwh` | `Decimal` | @db.Decimal(15, 4) |
| `cost` | `Decimal?` | @db.Decimal(15, 4) |
| `createdAt` | `DateTime` | @default(now()) |

## Model: `WaterConsumption`
| الحقل | النوع | الوصف |
|---|---|---|
| `id` | `String` | @id @default(cuid()) |
| `tenantId` | `String` |  |
| `branchId` | `String` |  |
| `date` | `DateTime` |  |
| `m3` | `Decimal` | @db.Decimal(15, 4) |
| `cost` | `Decimal?` | @db.Decimal(15, 4) |

## Model: `WasteLog`
| الحقل | النوع | الوصف |
|---|---|---|
| `id` | `String` | @id @default(cuid()) |
| `tenantId` | `String` |  |
| `branchId` | `String` |  |
| `date` | `DateTime` |  |
| `type` | `String` | // HAZARDOUS | RECYCLABLE | GENERAL | ORGANIC |
| `kg` | `Decimal` | @db.Decimal(15, 4) |
| `disposal` | `String?` | // LANDFILL | RECYCLING | INCINERATION | COMPOSTING |

## Model: `SustainabilityGoal`
| الحقل | النوع | الوصف |
|---|---|---|
| `id` | `String` | @id @default(cuid()) |
| `tenantId` | `String` |  |
| `kpi` | `String` | // EMISSIONS_TOTAL | EMISSIONS_INTENSITY | ENERGY_RENEWABLE_PERCENT | ... |
| `targetValue` | `Decimal` | @db.Decimal(15, 4) |
| `baselineValue` | `Decimal` | @db.Decimal(15, 4) |
| `baselineDate` | `DateTime` |  |
| `targetDate` | `DateTime` |  |
| `unit` | `String` |  |
| `active` | `Boolean` | @default(true) |

## Model: `DiversitySnapshot`
| الحقل | النوع | الوصف |
|---|---|---|
| `id` | `String` | @id @default(cuid()) |
| `tenantId` | `String` |  |
| `date` | `DateTime` |  |
| `totalEmployees` | `Int` |  |
| `female` | `Int` |  |
| `male` | `Int` |  |
| `saudiNationals` | `Int` |  |
| `expats` | `Int` |  |
| `disability` | `Int` |  |
| `nationalitiesJson` | `Json` |  |

## Model: `EVMSnapshot`
| الحقل | النوع | الوصف |
|---|---|---|
| `id` | `String` | @id @default(cuid()) |
| `tenantId` | `String` |  |
| `projectId` | `String` |  |
| `asOfDate` | `DateTime` |  |
| `BAC` | `Decimal` | @db.Decimal(15, 4) |
| `PV` | `Decimal` | @db.Decimal(15, 4) |
| `EV` | `Decimal` | @db.Decimal(15, 4) |
| `AC` | `Decimal` | @db.Decimal(15, 4) |
| `CV` | `Decimal` | @db.Decimal(15, 4) |
| `SV` | `Decimal` | @db.Decimal(15, 4) |
| `CPI` | `Decimal` | @db.Decimal(8, 4) |
| `SPI` | `Decimal` | @db.Decimal(8, 4) |
| `EAC_classic` | `Decimal` | @db.Decimal(15, 4) |
| `ETC` | `Decimal` | @db.Decimal(15, 4) |
| `VAC` | `Decimal` | @db.Decimal(15, 4) |
| `TCPI` | `Decimal` | @db.Decimal(8, 4) |
| `percentComplete` | `Decimal` | @db.Decimal(8, 4) |
| `health` | `String` | // GREEN | YELLOW | RED |
| `forecastCompletionDate` | `DateTime` |  |
| `createdAt` | `DateTime` | @default(now()) |

## Model: `ActivityPool`
| الحقل | النوع | الوصف |
|---|---|---|
| `id` | `String` | @id @default(cuid()) |
| `tenantId` | `String` |  |
| `name` | `String` |  |
| `driver` | `String` | // 'machine_hours', 'setups', 'inspections' |
| `totalCost` | `Decimal` | @db.Decimal(15, 4) |
| `totalDriverUnits` | `Decimal` | @db.Decimal(15, 4) |
| `period` | `DateTime` |  |
| `active` | `Boolean` | @default(true) |

## Model: `ProductActivityConsumption`
| الحقل | النوع | الوصف |
|---|---|---|
| `id` | `String` | @id @default(cuid()) |
| `tenantId` | `String` |  |
| `productId` | `String` |  |
| `activityPoolId` | `String` |  |
| `driverConsumed` | `Decimal` | @db.Decimal(15, 4) |
| `period` | `DateTime` |  |

## Model: `PoAcknowledgment`
| الحقل | النوع | الوصف |
|---|---|---|
| `id` | `String` | @id @default(cuid()) |
| `tenantId` | `String` |  |
| `poId` | `String` |  |
| `vendorId` | `String` |  |
| `acknowledgedAt` | `DateTime` | @default(now()) |
| `promisedDate` | `DateTime` |  |
| `ackQtyJson` | `Json?` |  |
| `notes` | `String?` |  |

## Model: `AdvanceShipNotice`
| الحقل | النوع | الوصف |
|---|---|---|
| `id` | `String` | @id @default(cuid()) |
| `tenantId` | `String` |  |
| `poId` | `String` |  |
| `vendorId` | `String` |  |
| `packagesJson` | `Json` |  |
| `containerNo` | `String?` |  |
| `carrier` | `String?` |  |
| `trackingNumber` | `String?` |  |
| `etd` | `DateTime` |  |
| `eta` | `DateTime` |  |
| `status` | `String` | // SHIPPED | IN_TRANSIT | ARRIVED | RECEIVED |
| `submittedAt` | `DateTime` | @default(now()) |

## Model: `VendorOnboardingStep`
| الحقل | النوع | الوصف |
|---|---|---|
| `id` | `String` | @id @default(cuid()) |
| `tenantId` | `String` |  |
| `vendorId` | `String` |  |
| `step` | `String` | // LEGAL_INFO | BANKING_DETAILS | ... |
| `data` | `Json` |  |
| `status` | `String` | // PENDING | COMPLETED | REJECTED |
| `submittedAt` | `DateTime?` |  |
| `reviewedById` | `String?` |  |
| `reviewedAt` | `DateTime?` |  |

## Model: `WaiterCall`
| الحقل | النوع | الوصف |
|---|---|---|
| `id` | `Int` | @id @default(autoincrement()) |
| `tenantId` | `String` | @default("default") @map("tenant_id") |
| `tableId` | `Int` | @map("table_id") |
| `status` | `String` | @default("PENDING") // PENDING, RESPONDED |
| `createdAt` | `DateTime` | @default(now()) @map("created_at") |
| `resolvedAt` | `DateTime?` | @map("resolved_at") |
| `table` | `RestaurantTable` | @relation(fields: [tableId], references: [id], onDelete: Cascade) |

## Model: `IceAdmin`
| الحقل | النوع | الوصف |
|---|---|---|
| `id` | `Int` | @id @default(autoincrement()) |
| `username` | `String` | @unique |
| `email` | `String` | @unique |
| `passwordHash` | `String` | @map("password_hash") |
| `fullName` | `String` | @map("full_name") |
| `roleId` | `Int` | @map("role_id") |
| `active` | `Boolean` | @default(true) |
| `twoFactorSecret` | `String?` | @map("two_factor_secret") |
| `twoFactorEnabled` | `Boolean` | @default(false) @map("two_factor_enabled") |
| `lastLoginAt` | `DateTime?` | @map("last_login_at") |
| `lastLoginIp` | `String?` | @map("last_login_ip") |
| `createdAt` | `DateTime` | @default(now()) @map("created_at") |
| `updatedAt` | `DateTime` | @updatedAt @map("updated_at") |
| `deletedAt` | `DateTime?` | @map("deleted_at") |
| `role` | `IceAdminRole` | @relation(fields: [roleId], references: [id]) |
| `auditLogs` | `IceAuditLog[]` |  |
| `supportTickets` | `IceSupportTicket[]` | @relation("TicketAssignee") |
| `loginLogs` | `IceLoginLog[]` |  |
| `supportReplies` | `IceSupportReply[]` |  |

## Model: `IceAdminRole`
| الحقل | النوع | الوصف |
|---|---|---|
| `id` | `Int` | @id @default(autoincrement()) |
| `name` | `String` | @unique |
| `permissions` | `String` | @db.Text |
| `createdAt` | `DateTime` | @default(now()) @map("created_at") |
| `updatedAt` | `DateTime` | @updatedAt @map("updated_at") |
| `admins` | `IceAdmin[]` |  |

## Model: `IceSubscriptionPlan`
| الحقل | النوع | الوصف |
|---|---|---|
| `id` | `Int` | @id @default(autoincrement()) |
| `name` | `String` | @unique |
| `priceMonthly` | `Decimal` | @default(0) @map("price_monthly") @db.Decimal(10, 2) |
| `priceYearly` | `Decimal` | @default(0) @map("price_yearly") @db.Decimal(10, 2) |
| `maxUsers` | `Int` | @default(1) @map("max_users") |
| `maxBranches` | `Int` | @default(1) @map("max_branches") |
| `maxInvoices` | `Int` | @default(100) @map("max_invoices") |
| `maxProducts` | `Int` | @default(100) @map("max_products") |
| `maxDesktopDevices` | `Int` | @default(0) @map("max_desktop_devices") |
| `allowZatcaPhase2` | `Boolean` | @default(false) @map("allow_zatca_phase2") |
| `allowDesktop` | `Boolean` | @default(false) @map("allow_desktop") |
| `dailyBackups` | `Boolean` | @default(false) @map("daily_backups") |
| `active` | `Boolean` | @default(true) |
| `createdAt` | `DateTime` | @default(now()) @map("created_at") |
| `updatedAt` | `DateTime` | @updatedAt @map("updated_at") |
| `deletedAt` | `DateTime?` | @map("deleted_at") |
| `subscriptions` | `IceTenantSubscription[]` |  |
| `planModules` | `IcePlanModule[]` |  |

## Model: `IceTenantSubscription`
| الحقل | النوع | الوصف |
|---|---|---|
| `id` | `Int` | @id @default(autoincrement()) |
| `tenantId` | `String` | @unique @map("tenant_id") |
| `planId` | `Int` | @map("plan_id") |
| `status` | `String` | @default("TRIAL") |
| `startDate` | `DateTime` | @map("start_date") |
| `endDate` | `DateTime` | @map("end_date") |
| `billingCycle` | `String` | @default("YEARLY") |
| `paymentMethod` | `String?` | @map("payment_method") |
| `autoRenew` | `Boolean` | @default(false) @map("auto_renew") |
| `createdAt` | `DateTime` | @default(now()) @map("created_at") |
| `updatedAt` | `DateTime` | @updatedAt @map("updated_at") |
| `plan` | `IceSubscriptionPlan` | @relation(fields: [planId], references: [id]) |
| `invoices` | `IceSubscriptionInvoice[]` |  |
| `desktopLicenses` | `IceDesktopLicense[]` |  |

## Model: `IceSubscriptionInvoice`
| الحقل | النوع | الوصف |
|---|---|---|
| `id` | `Int` | @id @default(autoincrement()) |
| `invoiceNo` | `String` | @unique @map("invoice_no") |
| `tenantId` | `String` | @map("tenant_id") |
| `subscriptionId` | `Int` | @map("subscription_id") |
| `amount` | `Decimal` | @default(0) @db.Decimal(10, 2) |
| `vatAmount` | `Decimal` | @default(0) @map("vat_amount") @db.Decimal(10, 2) |
| `total` | `Decimal` | @default(0) @db.Decimal(10, 2) |
| `status` | `String` | @default("PENDING") |
| `paymentMethod` | `String?` | @map("payment_method") |
| `paymentGateRef` | `String?` | @map("payment_gate_ref") |
| `receiptNo` | `String?` | @map("receipt_no") |
| `issueDate` | `DateTime` | @default(now()) @map("issue_date") |
| `dueDate` | `DateTime` | @map("due_date") |
| `paidAt` | `DateTime?` | @map("paid_at") |
| `subscription` | `IceTenantSubscription` | @relation(fields: [subscriptionId], references: [id]) |

## Model: `IceSystemModule`
| الحقل | النوع | الوصف |
|---|---|---|
| `id` | `Int` | @id @default(autoincrement()) |
| `code` | `String` | @unique |
| `nameAr` | `String` | @map("name_ar") |
| `nameEn` | `String` | @map("name_en") |
| `description` | `String?` |  |
| `parentId` | `Int?` | @map("parent_id") |
| `isActive` | `Boolean` | @default(true) @map("is_active") |
| `createdAt` | `DateTime` | @default(now()) @map("created_at") |
| `parent` | `IceSystemModule?` | @relation("SubModules", fields: [parentId], references: [id]) |
| `subModules` | `IceSystemModule[]` | @relation("SubModules") |
| `planModules` | `IcePlanModule[]` |  |
| `tenantModules` | `IceTenantModule[]` |  |

## Model: `IcePlanModule`
| الحقل | النوع | الوصف |
|---|---|---|
| `id` | `Int` | @id @default(autoincrement()) |
| `planId` | `Int` | @map("plan_id") |
| `moduleId` | `Int` | @map("module_id") |
| `plan` | `IceSubscriptionPlan` | @relation(fields: [planId], references: [id], onDelete: Cascade) |
| `module` | `IceSystemModule` | @relation(fields: [moduleId], references: [id], onDelete: Cascade) |

## Model: `IceTenantModule`
| الحقل | النوع | الوصف |
|---|---|---|
| `id` | `Int` | @id @default(autoincrement()) |
| `tenantId` | `String` | @map("tenant_id") |
| `moduleId` | `Int` | @map("module_id") |
| `isActive` | `Boolean` | @default(true) @map("is_active") |
| `module` | `IceSystemModule` | @relation(fields: [moduleId], references: [id], onDelete: Cascade) |

## Model: `IceDesktopLicense`
| الحقل | النوع | الوصف |
|---|---|---|
| `id` | `Int` | @id @default(autoincrement()) |
| `licenseKey` | `String` | @unique @map("license_key") |
| `tenantId` | `String` | @map("tenant_id") |
| `subscriptionId` | `Int` | @map("subscription_id") |
| `hardwareId` | `String?` | @unique @map("hardware_id") |
| `deviceName` | `String?` | @map("device_name") |
| `status` | `String` | @default("ACTIVE") |
| `appVersion` | `String?` | @map("app_version") |
| `lastSyncAt` | `DateTime?` | @map("last_sync_at") |
| `offlineGraceDays` | `Int` | @default(7) @map("offline_grace_days") |
| `createdAt` | `DateTime` | @default(now()) @map("created_at") |
| `updatedAt` | `DateTime` | @updatedAt @map("updated_at") |
| `subscription` | `IceTenantSubscription` | @relation(fields: [subscriptionId], references: [id], onDelete: Cascade) |

## Model: `IceAuditLog`
| الحقل | النوع | الوصف |
|---|---|---|
| `id` | `Int` | @id @default(autoincrement()) |
| `adminId` | `Int` | @map("admin_id") |
| `action` | `String` |  |
| `entityType` | `String` | @map("entity_type") |
| `entityId` | `String` | @map("entity_id") |
| `oldValues` | `String?` | @db.Text |
| `newValues` | `String?` | @db.Text |
| `ipAddress` | `String` | @map("ip_address") |
| `userAgent` | `String?` | @map("user_agent") |
| `createdAt` | `DateTime` | @default(now()) @map("created_at") |
| `admin` | `IceAdmin` | @relation(fields: [adminId], references: [id]) |

## Model: `IceLoginLog`
| الحقل | النوع | الوصف |
|---|---|---|
| `id` | `Int` | @id @default(autoincrement()) |
| `adminId` | `Int?` | @map("admin_id") |
| `username` | `String?` |  |
| `ipAddress` | `String` | @map("ip_address") |
| `userAgent` | `String?` | @map("user_agent") |
| `status` | `String` |  |
| `createdAt` | `DateTime` | @default(now()) @map("created_at") |
| `admin` | `IceAdmin?` | @relation(fields: [adminId], references: [id]) |

## Model: `IceSupportTicket`
| الحقل | النوع | الوصف |
|---|---|---|
| `id` | `Int` | @id @default(autoincrement()) |
| `ticketNo` | `String` | @unique @map("ticket_no") |
| `tenantId` | `String` | @map("tenant_id") |
| `subject` | `String` |  |
| `status` | `String` | @default("OPEN") |
| `priority` | `String` | @default("MEDIUM") |
| `assignedTo` | `Int?` | @map("assigned_to") |
| `createdAt` | `DateTime` | @default(now()) @map("created_at") |
| `updatedAt` | `DateTime` | @updatedAt @map("updated_at") |
| `assignee` | `IceAdmin?` | @relation("TicketAssignee", fields: [assignedTo], references: [id]) |
| `replies` | `IceSupportReply[]` |  |

## Model: `IceSupportReply`
| الحقل | النوع | الوصف |
|---|---|---|
| `id` | `Int` | @id @default(autoincrement()) |
| `ticketId` | `Int` | @map("ticket_id") |
| `adminId` | `Int?` | @map("admin_id") |
| `tenantUserId` | `Int?` | @map("tenant_user_id") |
| `message` | `String` | @db.Text |
| `isInternal` | `Boolean` | @default(false) @map("is_internal") |
| `createdAt` | `DateTime` | @default(now()) @map("created_at") |
| `ticket` | `IceSupportTicket` | @relation(fields: [ticketId], references: [id], onDelete: Cascade) |
| `admin` | `IceAdmin?` | @relation(fields: [adminId], references: [id]) |

## Model: `IceSystemSetting`
| الحقل | النوع | الوصف |
|---|---|---|
| `id` | `Int` | @id @default(autoincrement()) |
| `key` | `String` | @unique |
| `value` | `String` | @db.Text |
| `description` | `String?` |  |
| `updatedAt` | `DateTime` | @updatedAt @map("updated_at") |

## Model: `IdempotencyRecord`
| الحقل | النوع | الوصف |
|---|---|---|
| `id` | `Int` | @id @default(autoincrement()) |
| `tenantId` | `String` | @map("tenant_id") |
| `key` | `String` | @db.VarChar(100) |
| `endpoint` | `String` |  |
| `requestHash` | `String` |  |
| `status` | `IdempotencyStatus` | @default(IN_PROGRESS) |
| `responseCode` | `Int?` |  |
| `responseBody` | `Json?` |  |
| `lockedAt` | `DateTime` | @default(now()) @map("locked_at") |
| `expiresAt` | `DateTime` | @map("expires_at") |
| `createdAt` | `DateTime` | @default(now()) @map("created_at") |
| `updatedAt` | `DateTime` | @updatedAt @map("updated_at") |

---

## التعدادات (Enums)

### `AuditAction`
القيم: `CREATE`, `UPDATE`, `DELETE`, `APPROVE`, `REJECT`, `POST`, `REVERSE`, `CANCEL`, `VOID`, `PRINT`, `EXPORT`, `LOGIN`, `LOGOUT`

### `IdempotencyStatus`
القيم: `IN_PROGRESS`, `COMPLETED`, `FAILED`

