// @ts-nocheck
import { prisma } from "./prisma";
import crypto from "crypto";
import { logger } from '@/lib/logger';

const log = logger.child({ service: 'year-end-engine' });

export class YearEndCloseEngine {
  /**
   * 1. Initiate the Year-End Close run for a specific fiscal year.
   * This creates a YearEndCloseRun record and spawns all 28 closing tasks.
   */
  static async initiateRun(fiscalYearId: number, userId: string) {
    const fy = await prisma.fiscalYear.findUnique({
      where: { id: fiscalYearId },
    });
    if (!fy) throw new Error("Fiscal Year not found");
    if (fy.status !== "OPEN") throw new Error(`Cannot initiate close for a ${fy.status} year`);

    // Check if there is already an active run
    const existingRun = await prisma.yearEndCloseRun.findFirst({
      where: { fiscalYearId, status: "IN_PROGRESS" },
    });
    if (existingRun) throw new Error("A close run is already in progress.");

    return await prisma.$transaction(async (tx) => {
      const run = await tx.yearEndCloseRun.create({
        data: {
          fiscalYearId,
          status: "IN_PROGRESS",
          startedByUserId: userId,
        },
      });

      // Populate 28 checklist tasks
      const tasksToCreate = [
        // Phase 1: Pre-Close Checks
        { code: "PRE_01", name: "Ensure all Fiscal Periods are Closed", category: "PRE_CLOSE", seq: 1, auto: true },
        { code: "PRE_02", name: "Reconcile Bank Accounts", category: "PRE_CLOSE", seq: 2, auto: false },
        { code: "PRE_03", name: "Clear Suspense Accounts", category: "PRE_CLOSE", seq: 3, auto: false },
        { code: "PRE_04", name: "Verify Unposted Journals", category: "PRE_CLOSE", seq: 4, auto: true },
        
        // Phase 2: Accruals & Adjustments
        { code: "ADJ_01", name: "Post Depreciation Journals", category: "ADJUSTMENTS", seq: 5, auto: false },
        { code: "ADJ_02", name: "Record Accrued Liabilities", category: "ADJUSTMENTS", seq: 6, auto: false },
        { code: "ADJ_03", name: "Record Prepaid Expense Amortization", category: "ADJUSTMENTS", seq: 7, auto: false },
        { code: "ADJ_04", name: "Foreign Currency Revaluation", category: "ADJUSTMENTS", seq: 8, auto: true },
        
        // Phase 3: Inventory & Costing
        { code: "INV_01", name: "Physical Inventory Count Reconciliation", category: "ADJUSTMENTS", seq: 9, auto: false },
        { code: "INV_02", name: "Calculate WIP and COGS", category: "ADJUSTMENTS", seq: 10, auto: true },
        { code: "INV_03", name: "Inventory Valuation Adjustment (NRV)", category: "ADJUSTMENTS", seq: 11, auto: false },
        
        // Phase 4: Receivables & ECL
        { code: "AR_01", name: "Calculate ECL (IFRS 9)", category: "PROVISIONS", seq: 12, auto: true },
        { code: "AR_02", name: "Write-off Bad Debts", category: "PROVISIONS", seq: 13, auto: false },
        
        // Phase 5: HR & Payroll
        { code: "HR_01", name: "End of Service (EOS) Provision", category: "PROVISIONS", seq: 14, auto: true },
        { code: "HR_02", name: "Vacation Accrual Provision", category: "PROVISIONS", seq: 15, auto: true },
        
        // Phase 6: Tax & Zakat
        { code: "TAX_01", name: "Reconcile VAT Accounts", category: "TAX", seq: 16, auto: true },
        { code: "TAX_02", name: "Calculate Zakat Provision", category: "TAX", seq: 17, auto: false },
        { code: "TAX_03", name: "Calculate Corporate Tax Provision", category: "TAX", seq: 18, auto: false },
        { code: "TAX_04", name: "WHT Reconciliations", category: "TAX", seq: 19, auto: false },
        
        // Phase 7: Inter-Company (If Applicable)
        { code: "IC_01", name: "Inter-company Reconciliation", category: "INTER_PERIOD", seq: 20, auto: false },
        { code: "IC_02", name: "Elimination Entries", category: "INTER_PERIOD", seq: 21, auto: false },
        
        // Phase 8: Trial Balance Review
        { code: "TB_01", name: "Generate Preliminary Trial Balance", category: "REPORTING", seq: 22, auto: true },
        { code: "TB_02", name: "Management Review & Approval", category: "REPORTING", seq: 23, auto: false },
        
        // Phase 9: System Closing Operations
        { code: "SYS_01", name: "Lock Subsidiary Ledgers (AP, AR, FA, INV)", category: "CLOSING", seq: 24, auto: true },
        { code: "SYS_02", name: "Calculate Net Income / Loss", category: "CLOSING", seq: 25, auto: true },
        { code: "SYS_03", name: "Generate Closing Journal (Zero out P&L)", category: "CLOSING", seq: 26, auto: true },
        { code: "SYS_04", name: "Generate Opening Balance Journal for New Year", category: "CLOSING", seq: 27, auto: true },
        
        // Phase 10: Finalization
        { code: "FIN_01", name: "Generate Immutable Financial Statements", category: "REPORTING", seq: 28, auto: true },
      ];

      await tx.yearEndCloseTask.createMany({
        data: tasksToCreate.map((t: any) => ({
          runId: run.id,
          taskCode: t.code,
          taskName: t.name,
          taskNameAr: t.name, // Usually we would map this properly
          category: t.category,
          sequenceNumber: t.seq,
          autoExecutable: t.auto,
          status: "PENDING",
        })),
      });

      return run;
    });
  }

  /**
   * 2. Auto-Execute a specific task
   */
  static async executeAutoTask(runId: number, taskCode: string, userId: string) {
    const task = await prisma.yearEndCloseTask.findUnique({
      where: { runId_taskCode: { runId, taskCode } },
    });
    if (!task) throw new Error("Task not found");
    if (!task.autoExecutable) throw new Error("This task requires manual completion");

    await prisma.yearEndCloseTask.update({
      where: { id: task.id },
      data: { status: "IN_PROGRESS", startedAt: new Date() },
    });

    try {
      // Mocking task execution for auto tasks
      // In reality, each taskCode would call a specific engine method
      // e.g., if (taskCode === 'PRE_01') await verifyFiscalPeriodsClosed(runId);
      
      await prisma.yearEndCloseTask.update({
        where: { id: task.id },
        data: {
          status: "DONE",
          completedAt: new Date(),
          completedByUserId: userId,
          result: { success: true, timestamp: new Date() },
        },
      });
    } catch (error: any) {
      await prisma.yearEndCloseTask.update({
        where: { id: task.id },
        data: {
          status: "FAILED",
          errorMessage: error.message,
        },
      });
      throw error;
    }
  }

  /**
   * 3. Complete a manual task
   */
  static async completeManualTask(runId: number, taskCode: string, userId: string, notes?: string, fileId?: number) {
    const task = await prisma.yearEndCloseTask.findUnique({
      where: { runId_taskCode: { runId, taskCode } },
    });
    if (!task) throw new Error("Task not found");

    await prisma.yearEndCloseTask.update({
      where: { id: task.id },
      data: {
        status: "DONE",
        completedAt: new Date(),
        completedByUserId: userId,
        notes,
        evidenceFileId: fileId,
      },
    });
  }

  /**
   * 4. Finalize the Close Process
   * Must ensure all tasks are DONE
   */
  static async finalizeClose(runId: number, userId: string) {
    const run = await prisma.yearEndCloseRun.findUnique({
      where: { id: runId },
      include: { tasks: true, fiscalYear: true },
    });

    if (!run) throw new Error("Run not found");
    const incompleteTasks = run.tasks.filter((t: any) => t.status !== "DONE" && t.status !== "SKIPPED");
    if (incompleteTasks.length > 0) {
      throw new Error(`Cannot finalize: ${incompleteTasks.length} tasks are incomplete.`);
    }

    // Logic: calculate Retained Earnings and post closing journal
    // For this prototype, we'll mark the run and year as closed.
    
    await prisma.$transaction(async (tx) => {
      // 1. Update Run
      await tx.yearEndCloseRun.update({
        where: { id: runId },
        data: {
          status: "COMPLETED",
          completedAt: new Date(),
        },
      });

      // 2. Update Fiscal Year
      await tx.fiscalYear.update({
        where: { id: run.fiscalYearId },
        data: {
          status: "LOCKED",
          closedAt: new Date(),
          closedByUserId: userId,
        },
      });
    });

    return { success: true, message: "Fiscal Year closed successfully" };
  }

  /**
   * 5. Generate Immutable Reports and sign them
   */
  static async generateImmutableReports(runId: number, userId: string) {
    const run = await prisma.yearEndCloseRun.findUnique({
      where: { id: runId },
    });
    if (!run) throw new Error("Run not found");

    const reportTypes = ["TRIAL_BALANCE", "INCOME_STATEMENT", "BALANCE_SHEET"];
    
    for (const rType of reportTypes) {
      const mockPayload = { type: rType, data: "Mock data for " + rType };
      const payloadString = JSON.stringify(mockPayload);
      const hash = crypto.createHash("sha256").update(payloadString).digest("hex");

      await prisma.immutableReport.create({
        data: {
          fiscalYearId: run.fiscalYearId,
          reportType: rType,
          asOfDate: new Date(),
          generatedByUserId: userId,
          payload: mockPayload,
          hash,
        },
      });
    }

    await prisma.yearEndCloseRun.update({
      where: { id: runId },
      data: { reportsGeneratedAt: new Date() },
    });
  }
}
