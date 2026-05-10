import { prisma } from './prisma';
import { logger } from '@/lib/logger';

const log = logger.child({ service: 'quality-management' });

export class QualityManagementEngine {

    /**
     * Define Quality Specifications for a product
     */
    static async defineSpec(productId: number, parametersJson: string) {
        return await prisma.qualitySpec.upsert({
            where: { productId },
            update: { parameters: parametersJson },
            create: { productId, parameters: parametersJson }
        });
    }

    /**
     * Submit an Inspection result
     */
    static async submitInspection(referenceNumber: string, productId: number, inspectedQty: number, resultsJson: string, inspectorId: number) {
        // Fetch Spec
        const spec = await prisma.qualitySpec.findUnique({
            where: { productId }
        });

        if (!spec) throw new Error("No Quality Spec defined for this product");

        // Parse Specs & Results
        const parameters = JSON.parse(spec.parameters);
        const results = JSON.parse(resultsJson);

        let isPass = true;
        let failNotes = [];

        // Auto-Evaluate Results vs Spec limits
        // Example spec format: { "moisture": { "min": 2, "max": 5 } }
        for (const [key, value] of Object.entries(results)) {
            const numVal = value as number;
            const paramSpec = parameters[key];
            if (paramSpec) {
                if (paramSpec.min !== undefined && numVal < paramSpec.min) {
                    isPass = false;
                    failNotes.push(`${key} (${numVal}) is below minimum (${paramSpec.min})`);
                }
                if (paramSpec.max !== undefined && numVal > paramSpec.max) {
                    isPass = false;
                    failNotes.push(`${key} (${numVal}) is above maximum (${paramSpec.max})`);
                }
            }
        }

        const status = isPass ? 'PASS' : 'FAIL';

        return prisma.$transaction(async (tx) => {
            const inspection = await tx.qualityInspection.create({
                data: {
                    referenceNumber,
                    
                    productId,
                    inspectedQty,
                    results: resultsJson,
                    status,
                    inspectorId
                }
            });

            // If it fails, auto-generate Non-Conformance Report (NCR)
            if (!isPass) {
                await tx.nonConformanceReport.create({
                    data: {
                        inspectionId: inspection.id,
                        severity: 'HIGH', // Default to HIGH pending review
                        description: `Auto-generated NCR from failed inspection. Reasons: ${failNotes.join(', ')}`,
                        dispositionType: 'REWORK' // Default pending review
                    }
                });
            }

            return inspection;
        });
    }

    /**
     * Create Corrective and Preventive Action (CAPA) from an NCR
     */
    static async createCAPA(ncrId: number, rootCause: string, action: string, owner: string, dueDate: Date) {
        const ncr = await prisma.nonConformanceReport.findUnique({
            where: { id: ncrId }
        });

        if (!ncr) throw new Error("NCR not found");

        return await prisma.correctiveAction.create({
            data: {
                ncrId,
                rootCause,
                action,
                owner,
                dueDate,
                status: 'OPEN'
            }
        });
    }
}
