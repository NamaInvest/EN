const fs = require('fs');

async function testZatcaApi() {
    try {
        console.log("Fetching CSR from N2 database (GET)...");
        
        const res = await fetch('https://n2.namainvist.com/api/zatca/test', {
           method: 'GET'
        });
        
        const data = await res.json();
        const rawCsr = data.csr || "";
        const base64Clean = rawCsr.replace(/[\\r\\n\\s]/g, "");
        console.log("CSR LENGTH:", base64Clean.length);
        if(!base64Clean) return console.log("NO CSR in DB!");

        console.log("SENDING TO ZATCA DIRECTLY with OTP 123456...");
        const zatcaRes = await fetch('https://gw-fatoora.zatca.gov.sa/e-invoicing/developer-portal/compliance', {
            method: 'POST',
            headers: {
                'Accept': 'application/json',
                'Accept-Version': 'V2',
                'Accept-Language': 'en',
                'OTP': '123456', // Fake OTP
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ csr: base64Clean })
        });
        
        console.log('ZATCA HTTP CODE:', zatcaRes.status);
        const errTxt = await zatcaRes.text();
        console.log('ZATCA RAW ERROR TEXT:', errTxt);
        
    } catch(e) {
        console.error("TEST FAILED:", e.message);
    }
}
testZatcaApi();
