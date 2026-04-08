const fs = require('fs'); 
function fixInterceptor(p) { 
    let c = fs.readFileSync(p, 'utf8'); 
    let m1 = c.match(/if \(paymentMethod === 'CARD' && !showMadaModal\) \{[\s\S]*?handleCheckout\('CARD'\);[\s\S]*?\}, 1500\);[\s\S]*?\}, 2500\);[\s\S]*?return;[\s\S]*?\}/); 
    if (m1) { 
        let rep = m1[0].replace(/if \(paymentMethod === 'CARD' && !showMadaModal\) \{/, "if ((paymentMethod === 'CARD' || (paymentMethod === 'SPLIT' && Number(splitCard) > 0)) && !showMadaModal) {").replace(/handleCheckout\('CARD'\);/, "handleCheckout(paymentMethod);"); 
        fs.writeFileSync(p, c.replace(m1[0], rep)); 
        console.log('Fixed', p); 
    } else {
        console.log('Not found in', p); 
    }
} 
fixInterceptor('src/app/pos/page.tsx'); 
fixInterceptor('src/app/restaurant-pos/page.tsx');
