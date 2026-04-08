const fs = require('fs');
const https = require('https');

const arDict = JSON.parse(fs.readFileSync('valid_missing.json', 'utf8'));

// Format texts to maintain some uniformity
const keys = Object.keys(arDict);
const texts = keys.map(k => arDict[k]);

async function translateBatch(texts, targetLang) {
    const batched = texts.join(' \n'); // Joining with newline helps some delimiters
    try {
        const url = `https://translate.googleapis.com/translate_a/single?client=gtx&sl=ar&tl=${targetLang}&dt=t&q=${encodeURIComponent(batched)}`;
        return new Promise((resolve) => {
            https.get(url, (res) => {
                let body = '';
                res.on('data', chunk => body += chunk.toString('utf8'));
                res.on('end', () => {
                    try {
                        const parsed = JSON.parse(body);
                        const str = parsed[0].map(x => x[0]).join('');
                        resolve(str.split('\n').map(s => s.trim()));
                    } catch (e) {
                        resolve(texts); // fallback to original on error
                    }
                });
            }).on('error', () => resolve(texts));
        });
    } catch {
        return texts;
    }
}

async function run() {
    console.log('Translating', keys.length, 'entries to en, hi, bn, ur...');
    const langs = ['en', 'hi', 'bn', 'ur'];
    
    // We break into batches of 50 to avoid URL length limits
    const BATCH_SIZE = 40;
    const finalDicts = { en: {}, hi: {}, bn: {}, ur: {} };
    
    for (const lang of langs) {
        console.log(`Starting ${lang}...`);
        for (let i = 0; i < texts.length; i += BATCH_SIZE) {
            const batchTexts = texts.slice(i, i + BATCH_SIZE);
            const batchKeys = keys.slice(i, i + BATCH_SIZE);
            
            const translated = await translateBatch(batchTexts, lang);
            
            for (let j = 0; j < batchKeys.length; j++) {
                finalDicts[lang][batchKeys[j]] = translated[j] || batchTexts[j];
            }
            process.stdout.write('.');
        }
        console.log(`\nFinished ${lang}`);
        fs.writeFileSync(`missing_${lang}.json`, JSON.stringify(finalDicts[lang], null, 2));
    }
    
    console.log('All translations done!');
}

run();
