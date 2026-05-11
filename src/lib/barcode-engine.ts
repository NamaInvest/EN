/**
 * Barcode & Print Engine
 * ──────────────────────────────────────────────────────────
 * Generates barcodes (EAN-13, Code-128, QR) and constructs 
 * Raw Print Commands (ZPL for Zebra, ESC/POS for Receipts) 
 * for thermal printers used in Warehouses and POS.
 */
import { logger } from '@/lib/logger';
import bwipjs from 'bwip-js';
import QRCode from 'qrcode';

const log = logger.child({ service: 'BarcodeEngine' });

export class BarcodeEngine {
  /**
   * Generate Code 128 Barcode as Base64 PNG image
   */
  static async generateCode128(text: string): Promise<string> {
    try {
      const buffer = await bwipjs.toBuffer({
        bcid: 'code128',
        text: text,
        scale: 3,
        height: 10,
        includetext: true,
        textxalign: 'center',
      });
      return `data:image/png;base64,${buffer.toString('base64')}`;
    } catch (err: any) {
      log.error('Failed to generate Code128', { text, error: err.message });
      throw new Error(`Barcode generation failed: ${err.message}`);
    }
  }

  /**
   * Generate EAN-13 Barcode as Base64 PNG image
   */
  static async generateEAN13(text: string): Promise<string> {
    try {
      const buffer = await bwipjs.toBuffer({
        bcid: 'ean13',
        text: text,
        scale: 3,
        height: 10,
        includetext: true,
        textxalign: 'center',
      });
      return `data:image/png;base64,${buffer.toString('base64')}`;
    } catch (err: any) {
      log.error('Failed to generate EAN13', { text, error: err.message });
      throw new Error(`EAN13 generation failed: ${err.message}`);
    }
  }

  /**
   * Generate QR Code as Base64 PNG image
   */
  static async generateQR(text: string, size = 200): Promise<string> {
    try {
      return await QRCode.toDataURL(text, {
        width: size,
        margin: 1,
        color: { dark: '#000000', light: '#ffffff' }
      });
    } catch (err: any) {
      log.error('Failed to generate QR code', { text, error: err.message });
      throw new Error(`QR generation failed: ${err.message}`);
    }
  }

  /**
   * ──────────────────────────────────────────────────────────
   * ZPL (Zebra Programming Language) Generators for Thermal Printers
   * ──────────────────────────────────────────────────────────
   */

  /**
   * Generates a standard ZPL Inventory Label (50mm x 30mm)
   * Designed for Zebra GK420t / ZD420 and similar.
   */
  static generateZPLProductLabel(product: {
    sku: string;
    barcode: string;
    nameAr: string; // Arabic name (requires ZPL font preloading on printer or image conversion)
    nameEn: string;
    price: number;
    currency?: string;
  }): string {
    // Note: Printing native Arabic in ZPL requires Swiss 721 font loaded into the printer's E: drive (e.g., E:TT0003M_.FNT)
    // For universal compatibility, we use English/Latin chars or fallback to ASCII.
    // If exact Arabic rendering is needed, the backend should convert text to PNG and send hex to ZPL.
    const priceStr = `${product.price.toFixed(2)} ${product.currency || 'SAR'}`;
    const safeNameEn = product.nameEn.substring(0, 30); // truncate to fit

    return `
^XA
^PW400
^LL240
^CI28
^FO20,20^A0N,25,25^FD${safeNameEn}^FS
^FO20,60^A0N,20,20^FDSKU: ${product.sku}^FS
^FO20,100^BY2,2,60^BCN,,Y,N^FD${product.barcode}^FS
^FO20,190^A0N,30,30^FD${priceStr}^FS
^XZ
    `.trim();
  }

  /**
   * Generates an Asset Tracking Tag Label with QR Code
   */
  static generateZPLAssetTag(asset: {
    code: string;
    description: string;
    department: string;
  }): string {
    return `
^XA
^PW400
^LL200
^FO20,20^A0N,30,30^FDAsset Tag^FS
^FO20,60^A0N,20,20^FD${asset.description}^FS
^FO20,90^A0N,20,20^FDDept: ${asset.department}^FS
^FO250,20^BQN,2,5^FDQA,${asset.code}^FS
^FO20,160^A0N,25,25^FDCode: ${asset.code}^FS
^XZ
    `.trim();
  }

  /**
   * ──────────────────────────────────────────────────────────
   * ESC/POS (Epson Standard Code for POS) Basic Helpers
   * ──────────────────────────────────────────────────────────
   */

  static getEscPosInit(): Buffer {
    return Buffer.from([0x1B, 0x40]); // Initialize Printer
  }

  static getEscPosCut(): Buffer {
    return Buffer.from([0x1D, 0x56, 0x41, 0x10]); // Partial Cut
  }

  static getEscPosText(text: string): Buffer {
    // Very basic ASCII text to buffer
    return Buffer.from(text + '\n', 'ascii');
  }

  /**
   * Formats a basic POS Receipt in ESC/POS raw format
   * (Text-based, suitable for quick network printer dumps)
   */
  static buildEscPosReceipt(receipt: {
    header: string;
    items: { name: string; qty: number; total: number }[];
    total: number;
    taxAmount: number;
    footer: string;
  }): Buffer {
    const bufs: Buffer[] = [];
    bufs.push(this.getEscPosInit());
    
    // Bold Header
    bufs.push(Buffer.from([0x1B, 0x45, 0x01])); // Bold On
    bufs.push(this.getEscPosText(`       ${receipt.header}       \n`));
    bufs.push(Buffer.from([0x1B, 0x45, 0x00])); // Bold Off
    
    bufs.push(this.getEscPosText('--------------------------------\n'));
    bufs.push(this.getEscPosText('Item           Qty         Total\n'));
    bufs.push(this.getEscPosText('--------------------------------\n'));

    for (const item of receipt.items) {
      const name = item.name.substring(0, 12).padEnd(14, ' ');
      const qty = item.qty.toString().padEnd(10, ' ');
      const total = item.total.toFixed(2).padStart(8, ' ');
      bufs.push(this.getEscPosText(`${name}${qty}${total}\n`));
    }

    bufs.push(this.getEscPosText('--------------------------------\n'));
    bufs.push(this.getEscPosText(`Subtotal:              ${(receipt.total - receipt.taxAmount).toFixed(2)}\n`));
    bufs.push(this.getEscPosText(`VAT:                   ${receipt.taxAmount.toFixed(2)}\n`));
    bufs.push(Buffer.from([0x1B, 0x45, 0x01])); // Bold
    bufs.push(this.getEscPosText(`TOTAL:                 ${receipt.total.toFixed(2)}\n`));
    bufs.push(Buffer.from([0x1B, 0x45, 0x00])); // Unbold
    
    bufs.push(this.getEscPosText('\n'));
    bufs.push(this.getEscPosText(`      ${receipt.footer}      \n\n\n\n`));

    bufs.push(this.getEscPosCut());

    return Buffer.concat(bufs);
  }
}
