/**
 * ZATCA QR Engine (Phase 30.7 - ZATCA Phase 2 Compliance)
 * ──────────────────────────────────────────────────────────
 * Generates and validates ZATCA Phase 2 compliant QR Codes using TLV (Tag-Length-Value) encoding in Base64.
 * The QR code must contain Seller Name, VAT Number, Timestamp, Total Amount, and VAT Amount.
 * In Phase 2, it also requires the Cryptographic Hash, ECDSA Signature, and the Public Key.
 */

import { logger } from '@/lib/logger';

const log = logger.child({ service: 'ZatcaQrEngine' });

export interface ZatcaQrData {
    sellerName: string;
    vatRegistrationNumber: string;
    timestamp: string; // ISO 8601
    invoiceTotal: number;
    vatTotal: number;
    // Phase 2 specific fields
    invoiceHash?: string; 
    ecdsaSignature?: string;
    publicKey?: string;
}

export class ZatcaQrEngine {

    /**
     * Generates a Base64 encoded TLV string for the ZATCA QR code.
     */
    static generateBase64Qr(data: ZatcaQrData): string {
        try {
            const tlvArray: Buffer[] = [];

            // Tag 1: Seller Name
            tlvArray.push(this.getTlvBuffer(1, data.sellerName));
            // Tag 2: VAT Registration Number
            tlvArray.push(this.getTlvBuffer(2, data.vatRegistrationNumber));
            // Tag 3: Timestamp
            tlvArray.push(this.getTlvBuffer(3, data.timestamp));
            // Tag 4: Invoice Total (with VAT)
            tlvArray.push(this.getTlvBuffer(4, data.invoiceTotal.toFixed(2)));
            // Tag 5: VAT Total
            tlvArray.push(this.getTlvBuffer(5, data.vatTotal.toFixed(2)));

            // Phase 2 Additions
            if (data.invoiceHash) {
                // Tag 6: Hash of XML Invoice
                tlvArray.push(this.getTlvBuffer(6, data.invoiceHash));
            }
            if (data.ecdsaSignature) {
                // Tag 7: ECDSA Signature
                tlvArray.push(this.getTlvBuffer(7, data.ecdsaSignature));
            }
            if (data.publicKey) {
                // Tag 8: ECDSA Public Key
                tlvArray.push(this.getTlvBuffer(8, data.publicKey));
            }

            // Concatenate all buffers and convert to Base64
            const qrBuffer = Buffer.concat(tlvArray);
            const qrBase64 = qrBuffer.toString('base64');
            
            log.info(`Generated ZATCA QR Base64 successfully for Seller: ${data.sellerName}`);
            return qrBase64;

        } catch (error: any) {
            log.error('Failed to generate ZATCA QR Code', { error: error.message });
            throw new Error(`ZATCA QR Code generation failed: ${error.message}`);
        }
    }

    /**
     * Helper to encode a single Tag, Length, Value into a Buffer.
     */
    private static getTlvBuffer(tag: number, value: string): Buffer {
        const valueBuffer = Buffer.from(value, 'utf8');
        const tagBuffer = Buffer.from([tag]);
        const lengthBuffer = Buffer.from([valueBuffer.length]);
        
        return Buffer.concat([tagBuffer, lengthBuffer, valueBuffer]);
    }
}
