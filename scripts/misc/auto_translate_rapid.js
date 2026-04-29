const fs = require('fs');
const https = require('https');

async function translateText(text, targetLang) {
    if(!text || text.trim() === '') return text;
    let tl = targetLang;
    if (tl === 'ur') tl = 'ur';
    else if (tl === 'bn') tl = 'bn';
    else if (tl === 'hi') tl = 'hi';
    else tl = 'en';

    const url = `https://translate.googleapis.com/translate_a/single?client=gtx&sl=ar&tl=${tl}&dt=t&q=${encodeURIComponent(text)}`;
    return new Promise(resolve => {
        https.get(url, res => {
            let data = '';
            res.on('data', chunk => data += chunk);
            res.on('end', () => {
                try {
                    let result = '';
                    JSON.parse(data)[0].forEach(item => result += item[0]);
                    resolve(result);
                } catch (e) { resolve(text); }
            });
        }).on('error', () => resolve(text));
    });
}

function chunkArray(myArray, chunk_size) {
    var index = 0;
    var arrayLength = myArray.length;
    var tempArray = [];
    for (index = 0; index < arrayLength; index += chunk_size) {
        myChunk = myArray.slice(index, index+chunk_size);
        tempArray.push(myChunk);
    }
    return tempArray;
}

// Translate multiple items in parallel using a low concurrency to avoid ban
async function run() {
    console.log("Starting translation worker...");
    const dict = JSON.parse(fs.readFileSync('all_extracted_strings.json', 'utf8'));
    const keys = Object.keys(dict);
    
    let enDict = fs.existsSync('all_en.json') ? JSON.parse(fs.readFileSync('all_en.json', 'utf8')) : {};
    let hiDict = fs.existsSync('all_hi.json') ? JSON.parse(fs.readFileSync('all_hi.json', 'utf8')) : {};
    let urDict = fs.existsSync('all_ur.json') ? JSON.parse(fs.readFileSync('all_ur.json', 'utf8')) : {};
    let bnDict = fs.existsSync('all_bn.json') ? JSON.parse(fs.readFileSync('all_bn.json', 'utf8')) : {};
    
    let toTranslate = keys.filter(k => !enDict[k] || !hiDict[k] || !urDict[k] || !bnDict[k]);
    console.log(`Found ${toTranslate.length} strings to translate.`);
    
    // Concurrency = 15 simultaneously
    const chunks = chunkArray(toTranslate, 15);
    
    let processed = 0;
    for (const chunk of chunks) {
        const promises = chunk.map(async (key) => {
             const text = dict[key].ar;
             if(!enDict[key]) enDict[key] = await translateText(text, 'en');
             if(!hiDict[key]) hiDict[key] = await translateText(text, 'hi');
             if(!urDict[key]) urDict[key] = await translateText(text, 'ur');
             if(!bnDict[key]) bnDict[key] = await translateText(text, 'bn');
        });
        
        await Promise.all(promises);
        processed += chunk.length;
        process.stdout.write(`\rTranslating [${processed}/${toTranslate.length}]...`);
        
        if (processed % 150 === 0) {
            fs.writeFileSync('all_en.json', JSON.stringify(enDict, null, 2));
            fs.writeFileSync('all_hi.json', JSON.stringify(hiDict, null, 2));
            fs.writeFileSync('all_ur.json', JSON.stringify(urDict, null, 2));
            fs.writeFileSync('all_bn.json', JSON.stringify(bnDict, null, 2));
        }
        
        await new Promise(r => setTimeout(r, 150)); // Tiny sleep to protect against 429
    }
    
    fs.writeFileSync('all_en.json', JSON.stringify(enDict, null, 2));
    fs.writeFileSync('all_hi.json', JSON.stringify(hiDict, null, 2));
    fs.writeFileSync('all_ur.json', JSON.stringify(urDict, null, 2));
    fs.writeFileSync('all_bn.json', JSON.stringify(bnDict, null, 2));
    
    console.log('\\n✅ Translation completed successfully!');
}

run();
