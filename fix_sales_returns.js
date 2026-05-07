const fs = require('fs');
const file = 'src/app/api/sales-returns/route.ts';
let code = fs.readFileSync(file, 'utf8');

const searchTop = `        // ── ZATCA Phase 2: Credit Note (إشعار دائن) ──────────────────────
        let zatcaQR = '';
        try {
            const zatcaSettings = await prisma.setting.findMany({`;

const replaceTop = `        // ── ZATCA Phase 2: Credit Note (إشعار دائن) ──────────────────────
        let zatcaQR = '';
        let signOutputGlobal: any = null;
        let creditNoteUuidGlobal = '';
        let zatcaSettingsObjGlobal: any = null;
        let hashFinalGlobal = '';
        let isStandardGlobal = false;
        let sGlobal: Record<string, string> = {};

        try {
            await prisma.$transaction(async (tx) => {
                await tx.$executeRaw\`SELECT id FROM "settings" WHERE "key" IN ('zatca_invoice_counter', 'zatca_last_pih') FOR UPDATE\`;
                const zatcaSettings = await tx.setting.findMany({`;

code = code.replace(searchTop, replaceTop);

// Find the reporting block to replace
const reportStartIndex = code.indexOf(`                        // Report Credit Note to ZATCA`);
const reportEndIndex = code.indexOf(`                    } catch (signErr: any) {`);

if (reportStartIndex !== -1 && reportEndIndex !== -1) {
    const reportBlock = code.substring(reportStartIndex, reportEndIndex);
    
    // Replace DB writes inside the remaining ZATCA block to use 'tx'
    let beforeReport = code.substring(0, reportStartIndex);
    beforeReport = beforeReport.replace(/await prisma\.setting\.upsert/g, 'await tx.setting.upsert');
    beforeReport = beforeReport.replace(/await prisma\.salesReturn\.update/g, 'await tx.salesReturn.update');
    beforeReport = beforeReport.replace(/await prisma\.\$executeRawUnsafe/g, 'await tx.$executeRawUnsafe');
    
    const afterReport = code.substring(reportEndIndex);
    
    const replaceReport = `                        signOutputGlobal = signOutput;
                        creditNoteUuidGlobal = creditNoteUuid;
                        zatcaSettingsObjGlobal = zatcaSettingsObj;
                        hashFinalGlobal = hashFinal;
                        isStandardGlobal = isStandard;
                        sGlobal = s;
                        
`;
    
    // Also we need to close the transaction block properly.
    // The transaction should end right after Phase 1 QR fallback.
    // Let's find "        } catch (zatcaErr) {"
    
    code = beforeReport + replaceReport + afterReport;
    
    const catchZatcaIndex = code.indexOf(`        } catch (zatcaErr) {`);
    if (catchZatcaIndex !== -1) {
        let finalCode = code.substring(0, catchZatcaIndex);
        
        // Inside Phase 1 QR fallback, it does await prisma.salesReturn.update, change to tx
        finalCode = finalCode.replace(/await prisma\.salesReturn\.update\(\{ where: \{ id: ret\.id \}, data: \{ zatcaQr: zatcaQR \} \}\);/, 'await tx.salesReturn.update({ where: { id: ret.id }, data: { zatcaQr: zatcaQR } });');
        
        const closeTransaction = `            }); // End of ZATCA transaction

            // Report Credit Note to ZATCA (Outside Transaction)
            if (sGlobal['zatca_production_secret'] && signOutputGlobal) {
                try {
                    const { ZatcaSigner } = await import('@/lib/zatca-signer');
                    const signer = new ZatcaSigner();
                    const zatcaResult = isStandardGlobal
                        ? await signer.clearInvoice(signOutputGlobal.signedXml, hashFinalGlobal, creditNoteUuidGlobal, zatcaSettingsObjGlobal)
                        : await signer.reportInvoice(signOutputGlobal.signedXml, hashFinalGlobal, creditNoteUuidGlobal, zatcaSettingsObjGlobal);

                    if (zatcaResult.status === 'reported' || zatcaResult.status === 'cleared') {
                        await prisma.salesReturn.update({ 
                            where: { id: ret.id }, 
                            data: { 
                                zatcaStatus: zatcaResult.status,
                                ...((zatcaResult as any).clearedInvoice ? { zatcaXml: Buffer.from((zatcaResult as any).clearedInvoice, 'base64').toString('utf-8') } : {})
                            } 
                        });
                        console.log(\`✅ Credit Note CN-\${returnNo} \${zatcaResult.status} to ZATCA\`);
                    } else {
                        await prisma.salesReturn.update({ where: { id: ret.id }, data: { zatcaStatus: 'failed', zatcaResponse: JSON.stringify(zatcaResult.validationResults) } });
                    }
                } catch (reportErr: any) {
                    await prisma.salesReturn.update({ where: { id: ret.id }, data: { zatcaStatus: 'failed', zatcaResponse: reportErr.message } });
                }
            }
`;
        
        code = finalCode + closeTransaction + code.substring(catchZatcaIndex);
    }
}

fs.writeFileSync(file, code);
console.log('Done rewriting ' + file);
