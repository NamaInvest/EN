const fs = require('fs');
const https = require('https');

async function translateText(text, targetLang) {
    if(!text || text.trim() === '') return text;
    let tl = targetLang;
    if (tl === 'ur') tl = 'ur';
    else if (tl === 'bn') tl = 'bn';
    else if (tl === 'hi') tl = 'hi';
    else tl = 'en';

    // Free Google Translate URL
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
                    resolve(text);
                }
            });
        }).on('error', () => resolve(text));
    });
}

async function run() {
    console.log("Starting GLOBAL translation...");
    const dict = JSON.parse(fs.readFileSync('all_extracted_strings.json', 'utf8'));
    const keys = Object.keys(dict);
    
    // Check if we already have progress
    let enDict = fs.existsSync('all_en.json') ? JSON.parse(fs.readFileSync('all_en.json', 'utf8')) : {};
    let hiDict = fs.existsSync('all_hi.json') ? JSON.parse(fs.readFileSync('all_hi.json', 'utf8')) : {};
    let urDict = fs.existsSync('all_ur.json') ? JSON.parse(fs.readFileSync('all_ur.json', 'utf8')) : {};
    let bnDict = fs.existsSync('all_bn.json') ? JSON.parse(fs.readFileSync('all_bn.json', 'utf8')) : {};
    
    let toTranslate = keys.filter(k => !enDict[k] || !hiDict[k] || !urDict[k] || !bnDict[k]);
    console.log(`Found ${toTranslate.length} entirely new strings to translate out of ${keys.length}.`);

    // Only translate the first 100 new ones per run to avoid immediate rate limits,
    // or just run all of them if the user prefers speed. We'll run them all.
    for (let i = 0; i < toTranslate.length; i++) {
        const key = toTranslate[i];
        const text = dict[key].ar;
        console.log(`[${i+1}/${toTranslate.length}] Translating (Global): ${text}`);
        
        if(!enDict[key]) enDict[key] = await translateText(text, 'en');
        if(!hiDict[key]) hiDict[key] = await translateText(text, 'hi');
        if(!urDict[key]) urDict[key] = await translateText(text, 'ur');
        if(!bnDict[key]) bnDict[key] = await translateText(text, 'bn');
        
        // Save progress every 50 to avoid data loss
        if(i % 50 === 0) {
            fs.writeFileSync('all_en.json', JSON.stringify(enDict, null, 2));
            fs.writeFileSync('all_hi.json', JSON.stringify(hiDict, null, 2));
            fs.writeFileSync('all_ur.json', JSON.stringify(urDict, null, 2));
            fs.writeFileSync('all_bn.json', JSON.stringify(bnDict, null, 2));
        }
        
        await new Promise(r => setTimeout(r, 100)); // 100ms
    }
    
    fs.writeFileSync('all_en.json', JSON.stringify(enDict, null, 2));
    fs.writeFileSync('all_hi.json', JSON.stringify(hiDict, null, 2));
    fs.writeFileSync('all_ur.json', JSON.stringify(urDict, null, 2));
    fs.writeFileSync('all_bn.json', JSON.stringify(bnDict, null, 2));
    
    console.log('Global Translations completed and saved.');
}

run();
