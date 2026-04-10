const https = require('https');

https.get('https://n11.namainvist.com/sales?v=new', (res) => {
    let data = '';
    res.on('data', chunk => data += chunk);
    res.on('end', () => {
        console.log("Includes 'خصم (ريال)':", data.includes("خصم (ريال)"));
        console.log("Includes 'discountValue':", data.includes("discountValue"));
        console.log("Length HTML:", data.length);
    });
});
