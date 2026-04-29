const fs = require('fs');

function setupMada(path) {
    let content = fs.readFileSync(path, 'utf8');

    // Add import if missing
    if (!content.includes('import { useMadaTerminal }')) {
        content = content.replace(/import React, \{ useState, useEffect \} from 'react';/, "import React, { useState, useEffect } from 'react';\nimport { useMadaTerminal } from '@/hooks/useMadaTerminal';");
        // Also fallback if 'import React' format is different
        content = content.replace(/import \{ useState, [^\}]+\} from 'react';/, "$&\nimport { useMadaTerminal } from '@/hooks/useMadaTerminal';");
    }

    // Add hook call if missing
    if (!content.includes('sendMadaPayment } = useMadaTerminal()')) {
        let hookCall = `    const { status: madaTermStatus, connect: connectMada, disconnect: disconnectMada, sendPayment: sendMadaPayment } = useMadaTerminal();\n`;
        content = content.replace(/const \[cart, setCart\] = useState/, hookCall + "    $&");
    }

    // Add UI Button if missing
    if (!content.includes('connectMada')) {
        let btnHtml = `<div className="flex items-center gap-4">\n                <button onClick={connectMada} className="px-4 py-2 bg-indigo-600 text-white rounded-lg text-sm flex gap-2 items-center hover:bg-indigo-700 transition" title="ربط جهاز مدى / شبكة">\n                    {madaTermStatus === 'CONNECTED' ? '🔗 الشبكة متصلة' : '🔌 ربط الشبكة'}\n                </button>`;
        content = content.replace(/<div className="flex items-center gap-4">/, btnHtml);
    }

    let regex = /\/\/\s*Mada Interceptor[\s\S]*?return;\n\s*\}/;
    let fallbackRegex = /if \(\(paymentMethod === 'CARD' \|\| \(paymentMethod === 'SPLIT' && Number\(splitCard\) > 0\)\) && !showMadaModal\) \{[\s\S]*?return;\n\s*\}/;
    
    let rep = `// Universal Mada Interceptor
        if ((paymentMethod === 'CARD' || (paymentMethod === 'SPLIT' && Number(splitCard) > 0)) && !showMadaModal) {
            setShowMadaModal(true);
            setMadaStatus('WAITING');
            const amountToSend = paymentMethod === 'CARD' ? finalTotal : Number(splitCard);
            
            (async () => {
                try {
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
                } catch(e) {
                    setMadaStatus('REJECTED');
                    setTimeout(() => setShowMadaModal(false), 2000);
                }
            })();
            return;
        }`;

    if (content.match(regex)) {
        content = content.replace(regex, rep);
    } else if (content.match(fallbackRegex)) {
        content = content.replace(fallbackRegex, rep);
    }

    fs.writeFileSync(path, content, 'utf8');
}

setupMada('src/app/pos/page.tsx');
setupMada('src/app/restaurant-pos/page.tsx');
