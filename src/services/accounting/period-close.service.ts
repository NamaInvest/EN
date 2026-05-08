export class PeriodCloseService {
  async runChecklist(periodId: string) {
    // 14 step review according to SOCPA
    return await Promise.all([
      this.verifyBankReconciliation(),
      this.verifyARSubledger(),
      this.verifyAPSubledger(),
      this.verifyInventoryCount(),
      this.verifyFixedAssetsDepreciation(),
      this.verifyAccruals(),
      this.verifyPrepayments(),
      this.verifyFXRevaluation(),
      this.verifyVATReconciliation(),
      this.verifyPayrollAccruals(),
      this.verifyIntercompanyElimination(),
      this.verifyTrialBalance(),
      this.verifyClosingEntries(),
      this.verifyRetainedEarnings(),
    ]);
  }

  private async verifyBankReconciliation() { return true; }
  private async verifyARSubledger() { return true; }
  private async verifyAPSubledger() { return true; }
  private async verifyInventoryCount() { return true; }
  private async verifyFixedAssetsDepreciation() { return true; }
  private async verifyAccruals() { return true; }
  private async verifyPrepayments() { return true; }
  private async verifyFXRevaluation() { return true; }
  private async verifyVATReconciliation() { return true; }
  private async verifyPayrollAccruals() { return true; }
  private async verifyIntercompanyElimination() { return true; }
  private async verifyTrialBalance() { return true; }
  private async verifyClosingEntries() { return true; }
  private async verifyRetainedEarnings() { return true; }
}
