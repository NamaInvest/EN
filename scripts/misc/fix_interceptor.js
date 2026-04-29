const fs = require('fs');

function fixInterceptor(filePath) {
    let content = fs.readFileSync(filePath, 'utf8');
    
    let target = `        // Mada Interceptor
        if (paymentMethod === 'CARD' && !showMadaModal) {
            setShowMadaModal(true);
            setMadaStatus('WAITING');
            setTimeout(() => {
                setMadaStatus('APPROVED');
                setTimeout(() => {
                    setShowMadaModal(false);
                    handleCheckout('CARD'); // Proceed with actual checkout
                }, 1500);
            }, 2500);
            return;
        }`;

    let replacement = `        // Mada Interceptor
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

    if (content.includes(target)) {
        fs.writeFileSync(filePath, content.replace(target, replacement));
        console.log(`Replaced correctly in ${filePath}`);
    } else {
        console.log(`Could not find target in ${filePath}`);
    }
}

fixInterceptor('src/app/pos/page.tsx');
fixInterceptor('src/app/restaurant-pos/page.tsx');
