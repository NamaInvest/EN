import puppeteer from 'puppeteer';

export class PDFService {
  /**
   * Generates a PDF from raw HTML using headless Chrome/Chromium.
   * Ideal for ZATCA-compliant invoices and precise pixel-perfect layouts.
   */
  static async generate(htmlContent: string, options?: { format?: 'A4' | 'Letter'; landscape?: boolean }): Promise<Buffer> {
    let browser;
    try {
      // Launch browser (will use system chromium if available on Linux, or downloaded bundle)
      browser = await puppeteer.launch({
        headless: true,
        args: [
          '--no-sandbox',
          '--disable-setuid-sandbox',
          '--disable-dev-shm-usage', // Helps with memory issues on VPS
        ]
      });

      const page = await browser.newPage();
      
      // We set the content and wait for network idle to ensure fonts/images load
      await page.setContent(htmlContent, { waitUntil: 'load' });

      // Generate the PDF Buffer
      const pdfBuffer = await page.pdf({
        format: options?.format || 'A4',
        printBackground: true, // Crucial for CSS backgrounds/colors
        landscape: options?.landscape || false,
        margin: {
          top: '10mm',
          right: '10mm',
          bottom: '10mm',
          left: '10mm'
        }
      });

      return Buffer.from(pdfBuffer);
    } catch (error: any) {
      console.error('PDF Generation Failed:', error);
      throw new Error(`Failed to generate PDF: ${error.message}`);
    } finally {
      if (browser) {
        await browser.close();
      }
    }
  }
}
