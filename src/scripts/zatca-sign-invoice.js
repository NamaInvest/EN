#!/usr/bin/env node
const { EGS } = require('zatca-xml-js');

async function main() {
    let inputData = '';
    for await (const chunk of process.stdin) { inputData += chunk; }
    try {
        const input = JSON.parse(inputData);
        // Fallback or default structure based on standard zatca-xml-js usage
        const { egsInfo, invoiceData, privateKey, certificate } = input;
        
        const egsUnit = new EGS(egsInfo);
        if (privateKey && certificate) {
            egsUnit.set({ private_key: privateKey, certificate: certificate });
        } else {
            // For first time onboarding if generating CSR here
            await egsUnit.generateNewKeysAndCSR(true, 'ZATCA-Code-Signing');
        }

        if (invoiceData) {
            const res = await egsUnit.signInvoice(invoiceData);
            console.log(JSON.stringify({ success: true, ...res }));
        } else {
            console.log(JSON.stringify({ 
                success: true, 
                csr: egsUnit.get().csr, 
                privateKey: egsUnit.get().private_key 
            }));
        }
    } catch (e) { 
        console.log(JSON.stringify({ success: false, error: e.message })); 
    }
}
main();
