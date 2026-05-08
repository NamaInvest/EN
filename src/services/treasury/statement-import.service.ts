export class StatementImportService {
  async parseMT940(fileContent: string) {
    // Stub: MT940 parser
    return { transactions: [] };
  }

  async parseCSV(fileContent: string, format: 'ALRAJHI' | 'SNB' | 'RIYAD') {
    // Stub: CSV per bank format
    return { transactions: [] };
  }

  async autoCategorize(transactions: any[]) {
    // Stub: Auto-categorization rules
    return { categorized: [] };
  }
}
