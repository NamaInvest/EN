const fs = require('fs');

function injectHook(filePath) {
    let c = fs.readFileSync(filePath, 'utf8');

    if (c.includes('useMadaTerminal')) {
        console.log('Already hooked:', filePath);
        return;
    }

    // 1. Add Import
    c = c.replace(/import \{ useState, [^\}]+\} from 'react';/, "$&\nimport { useMadaTerminal } from '@/hooks/useMadaTerminal';");

    // 2. Add Hook inside component
    let idx = c.indexOf('const [cart, setCart] = useState');
    if (idx !== -1) {
        c = c.slice(0, idx) + 'const { status: madaTermStatus, connect: connectMada, disconnect: disconnectMada, sendPayment: sendMadaPayment } = useMadaTerminal();\n    ' + c.slice(idx);
    }

    // 3. Replace the interceptor block
    let target = /\/\/ Mada Interceptor[\s\S]*?return;\n\s*\}/;
    
    let replacement = `// Universal Mada Interceptor
        if ((paymentMethod === 'CARD' || (paymentMethod === 'SPLIT' && Number(splitCard) > 0))) {
            setShowMadaModal(true);
            setMadaStatus('WAITING');
            const amountToSend = paymentMethod === 'CARD' ? finalTotal : Number(splitCard);
            
            // Await real or simulated hardware response
            const success = await sendMadaPayment(amountToSend);
            
            if (success) {
                setMadaStatus('APPROVED');
                setTimeout(() => { 
                    setShowMadaModal(false); 
                    handleCheckout(paymentMethod); 
                }, 1500);
            } else {
                setMadaStatus('REJECTED');
                setTimeout(() => setShowMadaModal(false), 2000);
            }
            return;
        }`;

    if (c.match(target)) {
        c = c.replace(target, replacement);
    } else {
        console.log("Could not find Mada Interceptor block in", filePath);
    }

    // 4. Add the Connect terminal button in UI 
    // We can add it next to the language selector in the header
    let headerTarget = /<div className="flex items-center gap-4">/;
    let btnHtml = `<div className="flex items-center gap-4">\n                <button onClick={connectMada} className="px-4 py-2 bg-indigo-600 text-white rounded-lg text-sm flex gap-2 items-center hover:bg-indigo-700 transition" title="ربط جهاز مدى / شبكة">\n                    {madaTermStatus === 'CONNECTED' ? '🔗 متصل' : '🔌 ربط الشبكة'}\n                </button>`;
    
    if (c.match(headerTarget)) {
        c = c.replace(headerTarget, btnHtml);
    }

    fs.writeFileSync(filePath, c, 'utf8');
    console.log('Successfully hooked:', filePath);
}

injectHook('src/app/pos/page.tsx');
injectHook('src/app/restaurant-pos/page.tsx');
