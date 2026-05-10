import { logger } from '@/lib/logger';

const log = logger.child({ service: 'bank-files.sepa-pain-001' });

export class SEPAFileGenerator {
    static generate(paymentRun: any, companyBankDetails: any, format = 'pain.001.001.09') {
        // Simplified ISO 20022 XML structure
        let xml = `<?xml version="1.0" encoding="UTF-8"?>\n`;
        xml += `<Document xmlns="urn:iso:std:iso:20022:tech:xsd:${format}">\n`;
        xml += `  <CstmrCdtTrfInitn>\n`;
        xml += `    <GrpHdr>\n`;
        xml += `      <MsgId>MSG-${paymentRun.id}-${Date.now()}</MsgId>\n`;
        xml += `      <CreDtTm>${new Date().toISOString()}</CreDtTm>\n`;
        xml += `      <NbOfTxs>${paymentRun.lines.length}</NbOfTxs>\n`;
        xml += `      <InitgPty><Nm>Company Name</Nm></InitgPty>\n`;
        xml += `    </GrpHdr>\n`;
        xml += `    <PmtInf>\n`;
        xml += `      <PmtInfId>PMTINF-${paymentRun.id}</PmtInfId>\n`;
        xml += `      <PmtMtd>TRF</PmtMtd>\n`;
        xml += `      <ReqdExctnDt>${paymentRun.runDate.toISOString().split('T')[0]}</ReqdExctnDt>\n`;
        xml += `      <Dbtr><Nm>Company Name</Nm></Dbtr>\n`;
        xml += `      <DbtrAcct><Id><IBAN>${companyBankDetails.iban || 'SA1234567890'}</IBAN></Id></DbtrAcct>\n`;
        xml += `      <DbtrAgt><FinInstnId><BICFI>${companyBankDetails.bic || 'BANKSA'}</BICFI></FinInstnId></DbtrAgt>\n`;
        
        for (const line of paymentRun.lines) {
            xml += `      <CdtTrfTxInf>\n`;
            xml += `        <PmtId><EndToEndId>E2E-${line.id}</EndToEndId></PmtId>\n`;
            xml += `        <Amt><InstdAmt Ccy="SAR">${line.amount.toFixed(2)}</InstdAmt></Amt>\n`;
            xml += `        <CdtrAgt><FinInstnId><BICFI>RCVBB</BICFI></FinInstnId></CdtrAgt>\n`;
            xml += `        <Cdtr><Nm>${line.supplier?.name || 'Vendor'}</Nm></Cdtr>\n`;
            xml += `        <CdtrAcct><Id><IBAN>SA0987654321</IBAN></Id></CdtrAcct>\n`;
            xml += `      </CdtTrfTxInf>\n`;
        }
        
        xml += `    </PmtInf>\n`;
        xml += `  </CstmrCdtTrfInitn>\n`;
        xml += `</Document>\n`;
        
        return xml;
    }
}
