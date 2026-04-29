#!/usr/bin/env node
/**
 * ZATCA Invoice Signing Script (subprocess)
 * Uses zatca-xml-js SDK to sign invoices and generate Phase 2 QR codes
 * 
 * Input: JSON on stdin with { egsInfo, invoiceData, privateKey, certificate, action }
 * Output: JSON on stdout with { signed_invoice_string, invoice_hash, qr }
 * 
 * action: 'sign' = توقيع فاتورة | 'compliance' = فحص مطابقة
 */

const { EGS } = require('zatca-xml-js');

async function main() {
    let inputData = '';

    // Read JSON from stdin
    for await (const chunk of process.stdin) {
        inputData += chunk;
    }

    try {
        const input = JSON.parse(inputData);
        const { egsInfo, invoiceData, privateKey, certificate, action } = input;

        if (action === 'sign') {
            const egsUnit = new EGS(egsInfo);
            egsUnit.set({ private_key: privateKey, certificate: certificate });
            const { signed_invoice_string, invoice_hash, qr } = await egsUnit.signInvoice(invoiceData);

            console.log(JSON.stringify({
                success: true,
                signed_invoice_string,
                invoice_hash,
                qr
            }));
        } else if (action === 'compliance') {
            const egsUnit = new EGS(egsInfo);
            egsUnit.set({ private_key: privateKey, certificate: certificate });
            const result = await egsUnit.signInvoice(invoiceData);

            console.log(JSON.stringify({
                success: true,
                signed_invoice_string: result.signed_invoice_string,
                invoice_hash: result.invoice_hash,
                qr: result.qr
            }));
        } else {
            console.log(JSON.stringify({ success: false, error: 'Unknown action: ' + action }));
        }
    } catch (error) {
        console.log(JSON.stringify({
            success: false,
            error: error.message,
            stack: error.stack
        }));
    }
}

main();
