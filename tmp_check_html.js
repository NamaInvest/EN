const https = require('https');

https.get('https://n2.namainvist.com/dashboard', (res) => {
    let data = '';
    res.on('data', chunk => data += chunk);
    res.on('end', () => {
        console.log("HTML length:", data.length);
        console.log("Loads chunks?", data.includes('static/chunks/'));
        console.log("Matches our English chunk?", data.includes('3200f935e44feb33.js'));
        console.log("Contains AI Copilot?", data.includes('AI Copilot'));
        console.log("Contains الوكيل المساعد?", data.includes('الوكيل المساعد'));
    });
}).on('error', (e) => console.error(e));
