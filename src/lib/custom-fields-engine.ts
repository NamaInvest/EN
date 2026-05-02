import { prisma } from './prisma';

export class CustomFieldsEngine {

    /**
     * Define a new Custom Field for a specific entity type (e.g., "Customer", "Invoice")
     */
    static async defineField(entityType: string, fieldName: string, fieldLabel: string, fieldType: string, isRequired: boolean, validationRule: any = null) {
        return await prisma.customFieldDefinition.create({
            data: {
                entityType,
                fieldName,
                fieldLabel,
                fieldType,
                isRequired,
                validationRule: validationRule ? JSON.stringify(validationRule) : null
            }
        });
    }

    /**
     * Get all active Custom Fields for an entity type (used to render dynamic forms in UI)
     */
    static async getFieldsForEntity(entityType: string) {
        return await prisma.customFieldDefinition.findMany({
            where: { entityType, isActive: true },
            orderBy: { displayOrder: 'asc' }
        });
    }

    /**
     * Save values for Custom Fields attached to a specific entity record
     */
    static async saveValues(entityType: string, entityId: number, valuesMap: Record<string, any>) {
        // 1. Get field definitions
        const definitions = await prisma.customFieldDefinition.findMany({
            where: { entityType, isActive: true }
        });

        const defMap = new Map();
        for (const def of definitions) {
            defMap.set(def.fieldName, def);
        }

        const operations = [];

        // 2. Validate and prepare upsert operations
        for (const [fieldName, value] of Object.entries(valuesMap)) {
            const def = defMap.get(fieldName);
            
            if (!def) continue; // Ignore unknown fields

            // Basic required validation
            if (def.isRequired && (value === null || value === undefined || value === '')) {
                throw new Error(`Custom field '${def.fieldLabel}' is required.`);
            }

            // Convert value to JSON string for storage
            const jsonValue = JSON.stringify({ v: value });

            operations.push(
                prisma.customFieldValue.upsert({
                    where: {
                        definitionId_entityId: {
                            definitionId: def.id,
                            entityId: entityId
                        }
                    },
                    update: { value: jsonValue },
                    create: {
                        definitionId: def.id,
                        entityId: entityId,
                        value: jsonValue
                    }
                })
            );
        }

        // 3. Execute all upserts in a transaction
        if (operations.length > 0) {
            await prisma.$transaction(operations);
        }

        return true;
    }

    /**
     * Retrieve all Custom Field values for a specific entity record
     */
    static async getValues(entityType: string, entityId: number) {
        const values = await prisma.customFieldValue.findMany({
            where: {
                entityId,
                definition: { entityType }
            },
            include: { definition: true }
        });

        const result: Record<string, any> = {};
        for (const val of values) {
            const parsed = JSON.parse(val.value);
            result[val.definition.fieldName] = parsed.v;
        }

        return result;
    }
}
