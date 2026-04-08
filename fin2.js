const fs = require('fs');

let p = ['src/app/pos/page.tsx', 'src/app/restaurant-pos/page.tsx'];
p.forEach(f => {
    let c = fs.readFileSync(f, 'utf8');
    
    // First, make sure useMadaTerminal is injected if not already
    if (!c.includes('useMadaTerminal')) {
        c = c.replace(/import \{ useState, [^\}]+\} from 'react';/, "$&\nimport { useMadaTerminal } from '@/hooks/useMadaTerminal';");
        
        let hookInsert = "const { status: madaTermStatus, connect: connectMada, disconnect: disconnectMada, sendPayment: sendMadaPayment } = useMadaTerminal();\n    ";
        let stateMarker = c.indexOf('const [cart, setCart] = useState');
        if (stateMarker !== -1) {
            c = c.slice(0, stateMarker) + hookInsert + c.slice(stateMarker);
        }

        let headerTarget = /<div className="flex items-center gap-4">/;
        let btnHtml = `<div className="flex items-center gap-4">\n                <button onClick={connectMada} className="px-4 py-2 bg-indigo-600 text-white rounded-lg text-sm flex gap-2 items-center hover:bg-indigo-700 transition" title="ربط جهاز مدى / شبكة">\n                    {madaTermStatus === 'CONNECTED' ? '🔗 الشبكة متصلة' : '🔌 ربط الشبكة'}\n                </button>`;
        c = c.replace(headerTarget, btnHtml);
    }
    
    let r = /\/\/ Universal Mada Interceptor[\s\S]*?return;\n\s*\}/;
    if(c.match(r)) {
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
        c = c.replace(r, rep);
        fs.writeFileSync(f, c);
        console.log('Replaced successfully', f);
    } else {
        console.log('Not found in', f);
    }
});
