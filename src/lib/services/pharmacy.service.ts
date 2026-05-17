export type PharmacyEventType =
    | 'PHARMACY_PRESCRIPTION_CREATED'
    | 'PHARMACY_PRESCRIPTION_DISPENSED'
    | 'PHARMACY_CONTROLLED_DRUG_DISPENSED';

export interface SafePharmacyItemPayload {
    drugId: number;
    productId: number;
    stockId: number;
    dispensedQty: number;
}

export interface SafePharmacyPayload {
    tenantId: string;
    prescriptionId: number;
    status: 'pending' | 'partial' | 'dispensed';
    pharmacistId: string;
    timestamp: string;
    items?: SafePharmacyItemPayload[];
}

export class PharmacyPayloadSanitizer {
    /**
     * Extracts only the allowed safe fields for the Outbox Payload
     * ensuring no PII/PHI data is included.
     */
    static sanitize(rawPayload: any): SafePharmacyPayload {
        // Assert no forbidden fields exist in the rawPayload (Fail-fast validation)
        this.assertNoSensitiveFields(rawPayload);

        const safePayload: SafePharmacyPayload = {
            tenantId: rawPayload.tenantId,
            prescriptionId: rawPayload.prescriptionId,
            status: rawPayload.status,
            pharmacistId: rawPayload.pharmacistId,
            timestamp: rawPayload.timestamp,
        };

        if (Array.isArray(rawPayload.items)) {
            safePayload.items = rawPayload.items.map((item: any) => {
                this.assertNoSensitiveFields(item);
                return {
                    drugId: item.drugId,
                    productId: item.productId,
                    stockId: item.stockId,
                    dispensedQty: item.dispensedQty,
                };
            });
        }

        return safePayload;
    }

    /**
     * Strongly rejects any payload attempting to pass PII/PHI.
     */
    static assertNoSensitiveFields(obj: any) {
        if (!obj || typeof obj !== 'object') return;

        const forbiddenFields = [
            'patientId', 'patientName', 'patientNationalId', 'phone',
            'doctorName', 'doctorLicense', 'clinicName',
            'imageUrl', 'notes', 'allergies',
            'drugName', 'dosage'
        ];

        for (const field of forbiddenFields) {
            if (field in obj) {
                throw new Error(`CRITICAL SECURITY ALERT: Attempted to leak sensitive field '${field}' into Outbox Payload.`);
            }
        }
    }
}

export class PharmacyService {
    // Pharmacy logic (Create, Dispense) will be implemented here
    // using the PharmacyPayloadSanitizer to ensure secure Outbox payloads.
}
