import ExcelJS from 'exceljs';

export interface ExcelColumn {
  header: string;
  key: string;
  width?: number;
  style?: Partial<ExcelJS.Style>;
}

export interface ExportOptions {
  sheetName: string;
  rtl?: boolean;
  columns: ExcelColumn[];
  freezeHeaders?: boolean;
}

export class ExcelService {
  /**
   * Generates a standardized Excel buffer for the NamaSoft system.
   * Supports RTL (Arabic), column formatting, and frozen headers.
   */
  static async export(data: any[], options: ExportOptions): Promise<Buffer> {
    const workbook = new ExcelJS.Workbook();
    const sheet = workbook.addWorksheet(options.sheetName);
    
    // Set RTL View for Arabic Support
    sheet.views = [{ rightToLeft: options.rtl ?? true }];

    // Configure Columns
    sheet.columns = options.columns.map(col => ({
      header: col.header,
      key: col.key,
      width: col.width || 15,
      style: col.style
    }));

    // Add Data
    sheet.addRows(data);

    // Styling the Header Row
    const headerRow = sheet.getRow(1);
    headerRow.font = { bold: true, color: { argb: 'FFFFFFFF' } };
    headerRow.fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FF1F4E79' } // Dark blue branding
    };
    headerRow.alignment = { vertical: 'middle', horizontal: 'center' };

    // Format all amount/currency columns if 'amount' or 'price' is in the key
    options.columns.forEach((col, index) => {
      if (col.key.toLowerCase().includes('amount') || col.key.toLowerCase().includes('price') || col.key.toLowerCase().includes('total')) {
        sheet.getColumn(index + 1).numFmt = '#,##0.00';
      }
    });

    // Freeze Headers
    if (options.freezeHeaders !== false) {
      (sheet.views[0] as any).state = 'frozen';
      (sheet.views[0] as any).ySplit = 1;
    }

    // Auto-filter for easy sorting by the user
    sheet.autoFilter = {
      from: { row: 1, column: 1 },
      to: { row: data.length + 1, column: options.columns.length }
    };

    // Return buffer to be sent to client
    const buffer = await workbook.xlsx.writeBuffer();
    return Buffer.from(buffer);
  }
}
