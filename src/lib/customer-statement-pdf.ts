import { prisma } from './prisma';
import puppeteer from 'puppeteer';
import Handlebars from 'handlebars';
import { logger } from '@/lib/logger';

const log = logger.child({ service: 'customer-statement-pdf' });

export class CustomerStatementPdfEngine {
    /**
     * Generates a PDF buffer for a customer statement.
     */
    static async generatePdf(
        customerId: number,
        dateFrom: Date,
        dateTo: Date,
        templateId?: number
    ): Promise<{ pdfBuffer: Buffer; html: string; hash: string }> {
        // Fetch customer
        const customer = await prisma.customer.findUnique({
            where: { id: customerId },
            include: { statementTemplate: true },
        });

        if (!customer) throw new Error('Customer not found');

        // Resolve template
        const resolvedTemplateId = templateId || customer.statementTemplateId;
        let templateData: any = null;
        
        if (resolvedTemplateId) {
            templateData = await prisma.statementTemplate.findUnique({
                where: { id: resolvedTemplateId },
            });
        }

        if (!templateData) {
            // Fallback default template configuration
            templateData = {
                name: 'Default Template',
                language: customer.statementLanguage || 'ar',
                layoutType: 'STANDARD',
                primaryColor: '#1e40af',
                accentColor: '#dbeafe',
                fontFamily: 'Cairo',
                includeQR: true,
                showTaxBreakdown: false,
                zatcaCompliant: false,
                headerHtml: '<h1>كشف حساب - Customer Statement</h1>',
                footerHtml: '<p>Thank you for your business. شكراً لتعاملكم معنا.</p>',
            };
        }

        // Fetch statement data via the main engine
        const { CustomerStatementEngine } = await import('./customer-statement');
        const statementData = await CustomerStatementEngine.generateStatement(
            customerId,
            dateFrom,
            dateTo,
            customer.statementIncludeOpenOnly
        );

        // Render HTML using Handlebars
        const htmlContent = this.compileHtml(templateData, statementData);

        // Generate PDF
        const browser = await puppeteer.launch({ headless: true });
        const page = await browser.newPage();
        
        await page.setContent(htmlContent, { waitUntil: 'networkidle0' });
        
        // Add watermark if configured
        if (customer.statementWatermark) {
            await page.evaluate((watermark) => {
                const div = document.createElement('div');
                div.style.position = 'fixed';
                div.style.top = '50%';
                div.style.left = '50%';
                div.style.transform = 'translate(-50%, -50%) rotate(-45deg)';
                div.style.fontSize = '120px';
                div.style.color = 'rgba(255, 0, 0, 0.1)';
                div.style.zIndex = '9999';
                div.style.pointerEvents = 'none';
                div.style.fontWeight = 'bold';
                div.innerText = watermark;
                document.body.appendChild(div);
            }, customer.statementWatermark);
        }

        const pdfBuffer = await page.pdf({
            format: 'A4',
            printBackground: true,
            margin: { top: '20mm', right: '20mm', bottom: '20mm', left: '20mm' }
        });

        await browser.close();

        // Calculate a simple hash (in a real scenario use crypto module)
        const crypto = await import('crypto');
        const hash = crypto.createHash('sha256').update(pdfBuffer).digest('hex');

        return { pdfBuffer: Buffer.from(pdfBuffer), html: htmlContent, hash };
    }

    private static compileHtml(templateData: any, statementData: any): string {
        const source = `
        <!DOCTYPE html>
        <html lang="{{lang}}" dir="{{dir}}">
        <head>
            <meta charset="UTF-8">
            <title>Statement</title>
            <style>
                body {
                    font-family: '{{template.fontFamily}}', sans-serif;
                    color: #333;
                }
                .header { background-color: {{template.accentColor}}; color: {{template.primaryColor}}; padding: 20px; }
                table { width: 100%; border-collapse: collapse; margin-top: 20px; }
                th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
                th { background-color: {{template.primaryColor}}; color: white; }
                .rtl { text-align: right; direction: rtl; }
            </style>
        </head>
        <body class="{{#if isRtl}}rtl{{/if}}">
            {{{template.headerHtml}}}
            
            <div class="header">
                <h2>Statement for: {{data.customer.name}}</h2>
                <p>Period: {{data.statementPeriod.from}} to {{data.statementPeriod.to}}</p>
            </div>

            <div class="summary">
                <p>Opening Balance: {{data.openingBalance}}</p>
                <p>Closing Balance: {{data.closingBalance}}</p>
            </div>

            <table>
                <thead>
                    <tr>
                        <th>Date</th>
                        <th>Reference</th>
                        <th>Type</th>
                        <th>Debit</th>
                        <th>Credit</th>
                        <th>Balance</th>
                    </tr>
                </thead>
                <tbody>
                    {{#each data.transactions}}
                    <tr>
                        <td>{{this.date}}</td>
                        <td>{{this.reference}}</td>
                        <td>{{this.type}}</td>
                        <td>{{this.debit}}</td>
                        <td>{{this.credit}}</td>
                        <td>{{this.balance}}</td>
                    </tr>
                    {{/each}}
                </tbody>
            </table>

            <div class="aging">
                <h3>Aging Summary</h3>
                <p>Current: {{data.aging.current}} | 30 Days: {{data.aging.thirtyDays}} | 60 Days: {{data.aging.sixtyDays}} | 90+ Days: {{data.aging.ninetyDays}}</p>
            </div>

            {{{template.footerHtml}}}
        </body>
        </html>
        `;

        const template = Handlebars.compile(source);
        return template({
            template: templateData,
            data: statementData,
            lang: templateData.language === 'ar' ? 'ar' : 'en',
            dir: templateData.language === 'ar' ? 'rtl' : 'ltr',
            isRtl: templateData.language === 'ar'
        });
    }
}
