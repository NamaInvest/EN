/**
 * Email Templates Engine
 */
import type { PrismaClient } from '@prisma/client';
import { logger } from '@/lib/logger';

const log = logger.child({ service: 'D:.namasoft9-3-main.src.lib.email-templa' });
const p = (prisma: PrismaClient) => prisma as any;

const DEFAULT_TEMPLATES = [
    { key: 'invoice_reminder', nameAr: 'تذكير بالفاتورة', nameEn: 'Invoice Reminder', subject: 'تذكير: فاتورة مستحقة #{{invoiceNumber}}', body: 'عزيزي {{customerName}},\n\nنود تذكيركم بأن الفاتورة رقم #{{invoiceNumber}} بمبلغ {{amount}} ريال مستحقة بتاريخ {{dueDate}}.\n\nمع تحيات,\n{{companyName}}' },
    { key: 'welcome_customer', nameAr: 'ترحيب بعميل جديد', nameEn: 'Welcome Customer', subject: 'مرحباً بك في {{companyName}}', body: 'عزيزي {{customerName}},\n\nنرحب بك كعميل جديد ونتطلع لخدمتك.\n\nمع تحيات,\n{{companyName}}' },
    { key: 'order_confirmation', nameAr: 'تأكيد طلب', nameEn: 'Order Confirmation', subject: 'تأكيد الطلب #{{orderNumber}}', body: 'عزيزي {{customerName}},\n\nتم تأكيد طلبك رقم #{{orderNumber}} بمبلغ {{amount}} ريال.\n\nسيتم الشحن خلال {{deliveryDays}} أيام عمل.\n\nمع تحيات,\n{{companyName}}' },
    { key: 'payment_receipt', nameAr: 'إيصال دفع', nameEn: 'Payment Receipt', subject: 'إيصال الدفع - {{amount}} ريال', body: 'عزيزي {{customerName}},\n\nنؤكد استلامنا مبلغ {{amount}} ريال بتاريخ {{paymentDate}}.\nرقم المرجع: {{reference}}\n\nشكراً لك,\n{{companyName}}' },
];

export class EmailTemplateEngine {
    static async list(prisma: PrismaClient, tenantId: string) {
        const custom = await p(prisma).emailTemplate?.findMany?.({ where: { tenantId } }) || [];
        if (custom.length > 0) return custom;
        return DEFAULT_TEMPLATES.map((t, i) => ({ id: i + 1, ...t, tenantId }));
    }
    static async create(prisma: PrismaClient, data: { key: string; nameAr: string; nameEn: string; subject: string; body: string; tenantId: string }) {
        return p(prisma).emailTemplate?.create?.({ data }) || { id: Date.now(), ...data };
    }
    static async update(prisma: PrismaClient, id: number, data: { subject?: string; body?: string }) {
        return p(prisma).emailTemplate?.update?.({ where: { id }, data }) || {};
    }
    static renderTemplate(template: { subject: string; body: string }, vars: Record<string, string>) {
        let subject = template.subject;
        let body = template.body;
        for (const [key, val] of Object.entries(vars)) {
            const regex = new RegExp(`{{${key}}}`, 'g');
            subject = subject.replace(regex, val);
            body = body.replace(regex, val);
        }
        return { subject, body };
    }
}
