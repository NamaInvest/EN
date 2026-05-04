import { prisma } from './prisma';
import nodemailer from 'nodemailer'; // Assuming nodemailer is used, as it's standard. Could be sendgrid as well.

export class CustomerStatementEmailEngine {
    
    /**
     * Sends a customer statement via email.
     */
    static async sendEmail(
        customerId: number,
        pdfBuffer: Buffer,
        dateFrom: Date,
        dateTo: Date,
        templateId?: number
    ): Promise<{ messageId: string; status: string; errorMessage?: string }> {
        const customer = await prisma.customer.findUnique({
            where: { id: customerId },
            include: { statementTemplate: true },
        });

        if (!customer) throw new Error('Customer not found');

        const resolvedTemplateId = templateId || customer.statementTemplateId;
        let templateData: any = null;

        if (resolvedTemplateId) {
            templateData = await prisma.statementTemplate.findUnique({
                where: { id: resolvedTemplateId },
            });
        }

        const toEmail = customer.statementEmail || customer.email;
        if (!toEmail) throw new Error('Customer has no email address configured for statements');

        const subject = templateData?.emailSubject || `Customer Statement - ${customer.name} - ${dateFrom.toDateString()} to ${dateTo.toDateString()}`;
        const bodyHtml = templateData?.emailBodyHtml || `
            <p>Dear ${customer.name},</p>
            <p>Please find attached your statement of account for the period ${dateFrom.toDateString()} to ${dateTo.toDateString()}.</p>
            <p>Best Regards,</p>
            <p>Finance Team</p>
        `;
        const bodyText = templateData?.emailBodyText || `Dear ${customer.name},\nPlease find attached your statement for the period ${dateFrom.toDateString()} to ${dateTo.toDateString()}.`;

        // Dummy transporter setup (Replace with actual SMTP or SendGrid setup)
        // const transporter = nodemailer.createTransport({ ... });
        
        try {
            // Mock sending email
            // const info = await transporter.sendMail({
            //     from: '"Finance Dept" <finance@namasoft.com>',
            //     to: toEmail,
            //     cc: customer.statementCcEmails || undefined,
            //     bcc: customer.statementBccEmails || undefined,
            //     subject: subject,
            //     text: bodyText,
            //     html: bodyHtml,
            //     attachments: [{
            //         filename: `Statement_${customer.name}_${dateFrom.toISOString().split('T')[0]}.pdf`,
            //         content: pdfBuffer,
            //         contentType: 'application/pdf'
            //     }]
            // });
            
            const messageId = `mock-msg-id-${Date.now()}`;
            return { messageId, status: 'SENT' };
        } catch (error: any) {
            return { messageId: '', status: 'FAILED', errorMessage: error.message };
        }
    }
}
