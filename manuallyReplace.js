const fs = require('fs');

function manualReplace(p) {
    let c = fs.readFileSync(p, 'utf8');

    let oldBlock = `        // Mada Interceptor
        if ((paymentMethod === 'CARD' || (paymentMethod === 'SPLIT' && Number(splitCard) > 0)) && !showMadaModal) {
            setShowMadaModal(true);
            setMadaStatus('WAITING');
            setTimeout(() => {
                setMadaStatus('APPROVED');
                setTimeout(() => {
                    setShowMadaModal(false);
                    handleCheckout(paymentMethod); // Proceed with actual checkout
                }, 1500);
            }, 2500);
            return;
        }`;

    let newBlock = `        // Universal Mada Interceptor
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

    if (c.includes(oldBlock)) {
        c = c.replace(oldBlock, newBlock);
        fs.writeFileSync(p, c);
        console.log('Replaced block in', p);
    } else {
        console.log('Could not find oldBlock in', p);
    }
}

manualReplace('src/app/pos/page.tsx');
manualReplace('src/app/restaurant-pos/page.tsx');
