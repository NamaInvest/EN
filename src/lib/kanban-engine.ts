/**
 * Kanban Board Engine (G-05)
 * ══════════════════════════
 * Generic Kanban view for any model with status field
 * Used in: CRM, Support Tickets, Manufacturing, Recruitment
 */

import type { PrismaClient } from '@prisma/client';

export type KanbanColumn = {
    id: string;
    title: string;
    titleAr: string;
    color: string;
    cards: KanbanCard[];
    count: number;
};

export type KanbanCard = {
    id: number;
    title: string;
    subtitle?: string;
    badge?: string;
    color?: string;
    assignee?: string;
    date?: string;
    amount?: number;
};

export type KanbanConfig = {
    model: string;
    statusField: string;
    titleField: string;
    subtitleField?: string;
    amountField?: string;
    dateField?: string;
    columns: Array<{ status: string; title: string; titleAr: string; color: string }>;
};

const PRESETS: Record<string, KanbanConfig> = {
    crm_leads: {
        model: 'crmLead',
        statusField: 'stage',
        titleField: 'name',
        subtitleField: 'company',
        amountField: 'expectedRevenue',
        columns: [
            { status: 'NEW', title: 'New', titleAr: 'جديد', color: '#2196F3' },
            { status: 'QUALIFIED', title: 'Qualified', titleAr: 'مؤهل', color: '#FF9800' },
            { status: 'PROPOSAL', title: 'Proposal', titleAr: 'عرض سعر', color: '#9C27B0' },
            { status: 'NEGOTIATION', title: 'Negotiation', titleAr: 'تفاوض', color: '#F44336' },
            { status: 'WON', title: 'Won', titleAr: 'فوز', color: '#4CAF50' },
            { status: 'LOST', title: 'Lost', titleAr: 'خسارة', color: '#757575' },
        ],
    },
    support_tickets: {
        model: 'supportTicket',
        statusField: 'status',
        titleField: 'subject',
        subtitleField: 'customerName',
        columns: [
            { status: 'OPEN', title: 'Open', titleAr: 'مفتوح', color: '#2196F3' },
            { status: 'IN_PROGRESS', title: 'In Progress', titleAr: 'قيد المعالجة', color: '#FF9800' },
            { status: 'WAITING', title: 'Waiting', titleAr: 'بانتظار الرد', color: '#9C27B0' },
            { status: 'RESOLVED', title: 'Resolved', titleAr: 'تم الحل', color: '#4CAF50' },
            { status: 'CLOSED', title: 'Closed', titleAr: 'مغلق', color: '#757575' },
        ],
    },
    manufacturing: {
        model: 'manufacturingOrder',
        statusField: 'status',
        titleField: 'orderNumber',
        subtitleField: 'productName',
        columns: [
            { status: 'PLANNED', title: 'Planned', titleAr: 'مخطط', color: '#2196F3' },
            { status: 'RELEASED', title: 'Released', titleAr: 'صادر', color: '#FF9800' },
            { status: 'IN_PROGRESS', title: 'In Progress', titleAr: 'قيد التنفيذ', color: '#9C27B0' },
            { status: 'COMPLETED', title: 'Completed', titleAr: 'مكتمل', color: '#4CAF50' },
        ],
    },
    recruitment: {
        model: 'jobApplication',
        statusField: 'stage',
        titleField: 'applicantName',
        subtitleField: 'email',
        columns: [
            { status: 'NEW', title: 'New', titleAr: 'جديد', color: '#2196F3' },
            { status: 'SCREENING', title: 'Screening', titleAr: 'فرز', color: '#FF9800' },
            { status: 'INTERVIEW', title: 'Interview', titleAr: 'مقابلة', color: '#9C27B0' },
            { status: 'OFFER', title: 'Offer', titleAr: 'عرض وظيفي', color: '#4CAF50' },
            { status: 'HIRED', title: 'Hired', titleAr: 'تم التوظيف', color: '#00BCD4' },
            { status: 'REJECTED', title: 'Rejected', titleAr: 'مرفوض', color: '#757575' },
        ],
    },
};

export class KanbanEngine {
    static getPresets(): string[] { return Object.keys(PRESETS); }
    static getConfig(preset: string): KanbanConfig | null { return PRESETS[preset] || null; }

    static async loadBoard(prisma: PrismaClient, preset: string, filters?: Record<string, any>): Promise<KanbanColumn[]> {
        const config = PRESETS[preset];
        if (!config) throw new Error(`Preset ${preset} not found`);

        const model = (prisma as any)[config.model];
        if (!model) {
            return config.columns.map(c => ({ id: c.status, title: c.title, titleAr: c.titleAr, color: c.color, cards: [], count: 0 }));
        }

        const records = await model.findMany({ where: filters || {}, take: 500, orderBy: { id: 'desc' } }).catch(() => []);
        const columns: KanbanColumn[] = config.columns.map(col => {
            const cards = records
                .filter((r: any) => r[config.statusField] === col.status)
                .map((r: any) => ({
                    id: r.id,
                    title: r[config.titleField] || `#${r.id}`,
                    subtitle: config.subtitleField ? r[config.subtitleField] : undefined,
                    amount: config.amountField ? Number(r[config.amountField]) : undefined,
                    date: config.dateField ? r[config.dateField] : undefined,
                }));
            return { id: col.status, title: col.title, titleAr: col.titleAr, color: col.color, cards, count: cards.length };
        });
        return columns;
    }

    static async moveCard(prisma: PrismaClient, preset: string, cardId: number, newStatus: string): Promise<boolean> {
        const config = PRESETS[preset];
        if (!config) return false;
        const model = (prisma as any)[config.model];
        if (!model) return false;
        try {
            await model.update({ where: { id: cardId }, data: { [config.statusField]: newStatus } });
            return true;
        } catch { return false; }
    }
}
