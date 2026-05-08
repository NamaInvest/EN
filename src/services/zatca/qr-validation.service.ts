/**
 * ZATCA QR Code Validator — TLV (Tag-Length-Value) decoder.
 * Per ZATCA specifications: QR encodes seller name, VAT number,
 * timestamp, total with VAT, VAT amount, and digital signature.
 */

export interface ZATCAQRData {
  sellerName: string;
  vatNumber: string;
  timestamp: string;
  totalWithVat: string;
  vatAmount: string;
  xmlHash?: string;
  publicKey?: string;
  signature?: string;
}

export class ZATCAQrValidationService {
  /**
   * Decode TLV-encoded Base64 QR string
   */
  decodeQR(base64QR: string): ZATCAQRData {
    const buffer = Buffer.from(base64QR, 'base64');
    const result: Record<number, string> = {};
    let offset = 0;

    while (offset < buffer.length) {
      const tag = buffer[offset++];
      const length = buffer[offset++];
      const value = buffer.slice(offset, offset + length).toString('utf8');
      offset += length;
      result[tag] = value;
    }

    return {
      sellerName: result[1] ?? '',
      vatNumber: result[2] ?? '',
      timestamp: result[3] ?? '',
      totalWithVat: result[4] ?? '',
      vatAmount: result[5] ?? '',
      xmlHash: result[6],
      publicKey: result[7],
      signature: result[8],
    };
  }

  /**
   * Validate QR data against invoice data
   */
  validateQR(
    base64QR: string,
    expected: Partial<ZATCAQRData>
  ): { isValid: boolean; errors: string[] } {
    const errors: string[] = [];
    try {
      const decoded = this.decodeQR(base64QR);
      if (expected.vatNumber && decoded.vatNumber !== expected.vatNumber) {
        errors.push(`VAT number mismatch: got ${decoded.vatNumber}`);
      }
      if (expected.totalWithVat && decoded.totalWithVat !== expected.totalWithVat) {
        errors.push(`Total mismatch: got ${decoded.totalWithVat}`);
      }
      if (expected.vatAmount && decoded.vatAmount !== expected.vatAmount) {
        errors.push(`VAT amount mismatch: got ${decoded.vatAmount}`);
      }
    } catch (e) {
      errors.push('Failed to decode QR: ' + String(e));
    }
    return { isValid: errors.length === 0, errors };
  }
}
