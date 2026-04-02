const fs = require('fs');
const https = require('https');

async function translateText(text, targetLang) {
    if(!text || text.trim() === '') return text;
    // Map languages
    let tl = targetLang;
    if (tl === 'ur') tl = 'ur';
    else if (tl === 'bn') tl = 'bn';
    else if (tl === 'hi') tl = 'hi';
    else tl = 'en';

    const url = `https://translate.googleapis.com/translate_a/single?client=gtx&sl=ar&tl=${tl}&dt=t&q=${encodeURIComponent(text)}`;
    
    return new Promise((resolve, reject) => {
        https.get(url, (res) => {
            let data = '';
            res.on('data', chunk => data += chunk);
            res.on('end', () => {
                try {
                    const parsed = JSON.parse(data);
                    let result = '';
                    parsed[0].forEach(item => result += item[0]);
                    resolve(result);
                } catch (e) {
                    resolve(text); // Fallback to original
                }
            });
        }).on('error', () => resolve(text));
    });
}

async function run() {
    console.log("Starting translation...");
    const dict = JSON.parse(fs.readFileSync('batch1_extracted.json', 'utf8'));
    const keys = Object.keys(dict);
    
    const enDict = {};
    const hiDict = {};
    const urDict = {};
    const bnDict = {};
    
    for (let i = 0; i < keys.length; i++) {
        const key = keys[i];
        const text = dict[key].ar;
        console.log(`[${i+1}/${keys.length}] Translating: ${text}`);
        
        enDict[key] = await translateText(text, 'en');
        hiDict[key] = await translateText(text, 'hi');
        urDict[key] = await translateText(text, 'ur');
        bnDict[key] = await translateText(text, 'bn');
        
        // Small delay to avoid API rate limits
        await new Promise(r => setTimeout(r, 200));
    }
    
    fs.writeFileSync('batch1_en.json', JSON.stringify(enDict, null, 2));
    fs.writeFileSync('batch1_hi.json', JSON.stringify(hiDict, null, 2));
    fs.writeFileSync('batch1_ur.json', JSON.stringify(urDict, null, 2));
    fs.writeFileSync('batch1_bn.json', JSON.stringify(bnDict, null, 2));
    
    console.log('Translations completed and saved.');
}

run();
