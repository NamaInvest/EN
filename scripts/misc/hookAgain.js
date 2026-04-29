const fs = require('fs');

function hookAgain(p) {
    let c = fs.readFileSync(p, 'utf8');
    
    // First let's check what the file currently looks like regarding the interceptor
    let targ1 = /\/\/ Mada Interceptor[\s\S]*?return;\n\s*\}/;
    let targ2 = /if \(\(paymentMethod === 'CARD' \|\| \(paymentMethod === 'SPLIT' && Number\(splitCard\) > 0\)\) && !showMadaModal\) \{[\s\S]*?return;\n\s*\}/;
    
    let rep = `// Universal Mada Interceptor
        if ((paymentMethod === 'CARD' || (paymentMethod === 'SPLIT' && Number(splitCard) > 0))) {
            setShowMadaModal(true);
            setMadaStatus('WAITING');
            const amountToSend = paymentMethod === 'CARD' ? finalTotal : Number(splitCard);
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

    if (c.match(targ1)) {
        c = c.replace(targ1, rep);
        console.log('Success replacing targ1', p);
    } else if (c.match(targ2)) {
        c = c.replace(targ2, rep);
        console.log('Success replacing targ2', p);
    } else {
        console.log('Not found at all', p);
        return;
    }

    fs.writeFileSync(p, c, 'utf8');
}

hookAgain('src/app/pos/page.tsx');
hookAgain('src/app/restaurant-pos/page.tsx');
