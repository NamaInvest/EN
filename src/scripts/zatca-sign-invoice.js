#!/usr/bin/env node
// This script runs asynchronously to sign ZATCA invoices without blocking the Next.js main thread.

let inputData = '';

process.stdin.on('data', chunk => {
    inputData += chunk;
});

process.stdin.on('end', async () => {
    try {
        const input = JSON.parse(inputData);
        const { egsInfo, invoiceData, privateKey, certificate } = input;
        
        // We defer requiring zatca-xml-js until runtime to avoid Next.js module build failures on unsupported archs.
        const { EGS } = require('zatca-xml-js');

        const egsUnit = new EGS(egsInfo);
        
        // Ensure private_key and certificate are properly formatted with PEM headers if missing
        let formattedKey = privateKey;
        if (!formattedKey.includes('BEGIN EC PRIVATE KEY')) {
            formattedKey = `-----BEGIN EC PRIVATE KEY-----\n${privateKey}\n-----END EC PRIVATE KEY-----`;
        }
        
        let formattedCert = certificate;
        if (!formattedCert.includes('BEGIN CERTIFICATE')) {
            formattedCert = `-----BEGIN CERTIFICATE-----\n${certificate}\n-----END CERTIFICATE-----`;
        }
        
        egsUnit.set({ 
            private_key: formattedKey, 
            certificate: formattedCert 
        });

        // Sign the invoice and generate QR code internally via zatca-xml-js
        const res = await egsUnit.signInvoice(invoiceData);
        
        console.log(JSON.stringify({ success: true, ...res }));
    } catch (e) {
        console.log(JSON.stringify({ success: false, error: e.message || String(e) }));
    }
});
