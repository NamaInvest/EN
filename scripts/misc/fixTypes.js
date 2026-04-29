const fs = require('fs');
let files = ['src/app/pos/page.tsx', 'src/app/restaurant-pos/page.tsx'];
files.forEach(p => {
    let c = fs.readFileSync(p, 'utf8');
    c = c.replace(/handleCheckout\('CARD'\);/g, "handleCheckout(paymentType === 'split' ? 'SPLIT' : 'CARD');");
    fs.writeFileSync(p, c);
});
console.log('Fixed to paymentType bounds');
