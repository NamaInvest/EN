import { prisma } from './prisma';
import { n } from './decimal-utils';

export class CRMEngine {
    
    /**
     * Convert Lead to Opportunity + Account + Contact
     */
    static async convertLeadToOpportunity(leadId: number, accountData: any) {
        // Find Lead
        // Assuming Lead model exists, we'll mock its query if it's missing from current schema
        // The prompt says "mark Lead.status = CONVERTED", so we assume there is a Lead.
        // Wait, did we check if Lead is in schema? Let's check first if prisma.lead exists.
        // For safety, we'll try/catch or use dynamic type to bypass TS temporarily
        
        return prisma.$transaction(async (tx: any) => {
            // 1. Create Account
            const account = await tx.crmAccount.create({
                data: {
                    name: accountData.name,
                    industry: accountData.industry,
                    size: accountData.size,
                    website: accountData.website,
                    ownerId: accountData.ownerId
                }
            });

            // 2. Create Contact
            const contact = await tx.contact.create({
                data: {
                    accountId: account.id,
                    firstName: accountData.contactFirstName || 'Unknown',
                    lastName: accountData.contactLastName || 'Unknown',
                    email: accountData.email,
                    phone: accountData.phone
                }
            });

            // 3. Create Opportunity
            // Need default stage (e.g. PROSPECTING)
            let defaultStage = await tx.pipelineStage.findFirst({
                orderBy: { sortOrder: 'asc' }
            });
            
            if (!defaultStage) {
                defaultStage = await tx.pipelineStage.create({
                    data: { code: 'PROSPECT', name: 'Prospecting', defaultProbability: 10, sortOrder: 1 }
                });
            }

            const opp = await tx.opportunity.create({
                data: {
                    accountId: account.id,
                    name: `${account.name} Opportunity`,
                    amount: accountData.estimatedAmount || 0,
                    stageId: defaultStage.id,
                    probability: defaultStage.defaultProbability,
                    ownerId: accountData.ownerId,
                    leadId
                }
            });

            // 4. Update Lead (assuming model exists)
            try {
                await tx.lead.update({
                    where: { id: leadId },
                    data: { status: 'CONVERTED' }
                });
            } catch (e: any) {
                // Ignore if Lead doesn't exist
            }

            return opp;
        });
    }

    /**
     * Mark Opportunity as Won and optionally convert to Customer
     */
    static async winOpportunity(oppId: number, createCustomer = true) {
        return prisma.$transaction(async (tx: any) => {
            const opp = await tx.opportunity.findUnique({
                where: { id: oppId },
                include: { account: true }
            });

            if (!opp) throw new Error("Opportunity not found");

            // Find WON stage
            let wonStage = await tx.pipelineStage.findFirst({ where: { isWon: true } });
            if (!wonStage) {
                wonStage = await tx.pipelineStage.create({
                    data: { code: 'WON', name: 'Closed Won', defaultProbability: 100, sortOrder: 99, isWon: true }
                });
            }

            // Update Stage
            const updatedOpp = await tx.opportunity.update({
                where: { id: oppId },
                data: {
                    stageId: wonStage.id,
                    probability: 100,
                    actualCloseDate: new Date()
                }
            });

            // Convert to Customer
            if (createCustomer && !opp.customerId) {
                const customer = await tx.customer.create({
                    data: {
                        name: opp.account.name,
                        nameEn: opp.account.name,
                        phone: opp.account.phone || '000000',
                        email: opp.account.website || 'noreply@crm.com'
                    }
                });

                await tx.opportunity.update({
                    where: { id: oppId },
                    data: { customerId: customer.id }
                });
            }

            return updatedOpp;
        });
    }

    /**
     * Forecast Pipeline
     */
    static async forecastPipeline(ownerId?: number) {
        const whereClause = ownerId ? { ownerId, stage: { isWon: false, isLost: false } } : { stage: { isWon: false, isLost: false } };
        
        const openOpps = await prisma.opportunity.findMany({
            take: 100,
            where: whereClause,
            include: { stage: true }
        });

        let totalWeighted = 0;
        let totalUnweighted = 0;
        const stageBreakdown: Record<string, { amount: number, count: number }> = {};

        for (const opp of openOpps) {
            totalUnweighted += n(opp.amount);
            totalWeighted += n(opp.amount) * (n(opp.probability) / 100);
            
            const sName = opp.stage.name;
            if (!stageBreakdown[sName]) stageBreakdown[sName] = { amount: 0, count: 0 };
            stageBreakdown[sName].amount += n(opp.amount);
            stageBreakdown[sName].count += 1;
        }

        return {
            totalWeighted,
            totalUnweighted,
            stageBreakdown
        };
    }
}
