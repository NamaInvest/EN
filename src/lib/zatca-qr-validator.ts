/**
 * ZATCA Phase 2 QR Code TLV Decoder and Validator
 * Decodes the base64 TLV (Tag-Length-Value) payload of a ZATCA QR code to verify its contents.
 */

export interface ZATCAQrData {
  sellerName: string;
  vatRegistrationNumber: string;
  timestamp: string;
  invoiceTotal: string;
  vatTotal: string;
  invoiceHash?: string;
  ecdsaSignature?: string;
  ecdsaPublicKey?: string;
  ecdsaSignatureSignature?: string;
}

export class ZATCAQrValidator {
  /**
   * Decodes a Base64 encoded TLV QR Code from ZATCA.
   */
  static decode(base64Qr: string): ZATCAQrData {
    const buffer = Buffer.from(base64Qr, 'base64');
    const result: Partial<ZATCAQrData> = {};
    let offset = 0;

    while (offset < buffer.length) {
      const tag = buffer.readUInt8(offset);
      const length = buffer.readUInt8(offset + 1);
      const value = buffer.subarray(offset + 2, offset + 2 + length);
      
      switch (tag) {
        case 1:
          result.sellerName = value.toString('utf8');
          break;
        case 2:
          result.vatRegistrationNumber = value.toString('utf8');
          break;
        case 3:
          result.timestamp = value.toString('utf8');
          break;
        case 4:
          result.invoiceTotal = value.toString('utf8');
          break;
        case 5:
          result.vatTotal = value.toString('utf8');
          break;
        case 6:
          result.invoiceHash = value.toString('base64');
          break;
        case 7:
          result.ecdsaSignature = value.toString('base64');
          break;
        case 8:
          result.ecdsaPublicKey = value.toString('base64');
          break;
        case 9:
          result.ecdsaSignatureSignature = value.toString('base64');
          break;
        default:
          break;
      }

      offset += 2 + length;
    }

    return result as ZATCAQrData;
  }

  /**
   * Validates if the given QR code string has all mandatory Phase 2 elements.
   */
  static isValidPhase2(base64Qr: string): boolean {
    try {
      const data = this.decode(base64Qr);
      return !!(
        data.sellerName &&
        data.vatRegistrationNumber &&
        data.timestamp &&
        data.invoiceTotal &&
        data.vatTotal &&
        data.invoiceHash &&
        data.ecdsaSignature &&
        data.ecdsaPublicKey
      );
    } catch {
      return false;
    }
  }
}
