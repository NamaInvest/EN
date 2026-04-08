const fs = require('fs');

function buildMadaHook(file) {
    let content = fs.readFileSync(file, 'utf8');

    // 1. Add import
    if (!content.includes('useMadaTerminal')) {
        content = content.replace(/import \{ useState, [^\}]+\} from 'react';/, "$&\nimport { useMadaTerminal } from '@/hooks/useMadaTerminal';");
        
        let hookInsert = "const { status: madaTermStatus, connect: connectMada, sendPayment: sendMadaPayment } = useMadaTerminal();\n    ";
        let stateMarker = content.indexOf('const [cart, setCart] = useState');
        if (stateMarker !== -1) {
            content = content.slice(0, stateMarker) + hookInsert + content.slice(stateMarker);
        }

        // 2. Add UI Button
        let btnHtml = `<div className="flex items-center gap-4">\n                <button onClick={connectMada} className="px-4 py-2 bg-indigo-600 text-white rounded-lg text-sm flex gap-2 items-center hover:bg-indigo-700 transition" title="ربط جهاز مدى / شبكة">\n                    {madaTermStatus === 'CONNECTED' ? '🔗 متصل' : '🔌 ربط الشبكة'}\n                </button>`;
        content = content.replace(/<div className="flex items-center gap-4">/, btnHtml);
    }

    // 3. Replace handleCheckout logic
    let regex = /\/\/\s*Mada Interceptor[\s\S]*?\}[\s\S]*?return;\n\s*\}/;
    if (content.match(regex)) {
        let newBlock = `// Universal Mada Interceptor
        if ((paymentMethod === 'CARD' || (paymentMethod === 'SPLIT' && Number(splitCard) > 0)) && !showMadaModal) {
            setShowMadaModal(true);
            setMadaStatus('WAITING');
            const amountToSend = paymentMethod === 'CARD' ? finalTotal : Number(splitCard);
            
            // Auto invoke the async wrapper
            (async () => {
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
            })();
            return;
        }`;
        content = content.replace(regex, newBlock);
        console.log('Successfully replaced Interceptor in', file);
    } else {
        console.log('Regex un-matched in', file);
    }
    
    fs.writeFileSync(file, content, 'utf8');
}

buildMadaHook('src/app/pos/page.tsx');
buildMadaHook('src/app/restaurant-pos/page.tsx');
