const fs = require('fs');
const path = require('path');

const dir = path.join(__dirname, 'src', 'app');

async function translateText(text) {
    // Protect variables like ${count} or {{count}}
    let variables = [];
    let processedText = text.replace(/(\$\{[^}]+\}|\{\{[^}]+\}\})/g, (match) => {
        variables.push(match);
        return `__VAR_${variables.length - 1}__`;
    });

    try {
        const url = `https://translate.googleapis.com/translate_a/single?client=gtx&sl=en&tl=ar&dt=t&q=${encodeURIComponent(processedText)}`;
        const res = await fetch(url);
        const data = await res.json();
        let translated = data[0].map(x => x[0]).join('');
        
        // Restore variables
        variables.forEach((variable, idx) => {
            translated = translated.replace(new RegExp(`__VAR_${idx}__`, 'gi'), variable);
            translated = translated.replace(new RegExp(`__VAR_${idx}`, 'gi'), variable); // Sometimes google trims the underscores
            translated = translated.replace(new RegExp(`VAR_${idx}`, 'gi'), variable);
        });
        return translated;
    } catch(e) {
        console.error(`Failed to translate: ${text}`);
        return null;
    }
}

function getAllFiles(dirPath, arrayOfFiles) {
    const files = fs.readdirSync(dirPath);
    arrayOfFiles = arrayOfFiles || [];
    files.forEach(function(file) {
        if (fs.statSync(dirPath + "/" + file).isDirectory()) {
            arrayOfFiles = getAllFiles(dirPath + "/" + file, arrayOfFiles);
        } else {
            if (file.endsWith('.tsx') || file.endsWith('.ts')) {
                arrayOfFiles.push(path.join(dirPath, "/", file));
            }
        }
    });
    return arrayOfFiles;
}

async function run() {
    console.log('Loading unique phrases...');
    const phrases = JSON.parse(fs.readFileSync('unique_phrases.json', 'utf8'));
    const dictionary = {};
    
    // Load existing dict if any
    if (fs.existsSync('dict.json')) {
        Object.assign(dictionary, JSON.parse(fs.readFileSync('dict.json', 'utf8')));
    }

    console.log(`Translating ${phrases.length} phrases...`);
    let count = 0;
    for (const phrase of phrases) {
        if (!dictionary[phrase] && phrase.match(/[a-zA-Z]/)) {
            const translated = await translateText(phrase);
            if (translated) {
                dictionary[phrase] = translated;
            }
            await new Promise(r => setTimeout(r, 200)); // Sleep to prevent rate limit
            count++;
            if (count % 20 === 0) console.log(`Translated ${count} / ${phrases.length}`);
        }
    }
    
    fs.writeFileSync('dict.json', JSON.stringify(dictionary, null, 2));
    console.log('Dictionary saved! Now updating files...');

    let updatedFiles = 0;
    let updatedOccurrences = 0;
    const files = getAllFiles(dir);
    
    for (const file of files) {
        let content = fs.readFileSync(file, 'utf8');
        let fileChanged = false;

        const regex = /_t\(\s*(['"`])(.*?)\1\s*,\s*(['"`])(.*?)\3\s*\)/g;
        content = content.replace(regex, (match, q1, arg1, q2, arg2) => {
            if (arg1 === arg2 && dictionary[arg1]) {
                fileChanged = true;
                updatedOccurrences++;
                // Use double quotes for Arabic to avoid single quote conflicts if any, or just preserve
                const cleanAr = dictionary[arg1].replace(/'/g, "\\'");
                return `_t('${cleanAr}', ${q2}${arg2}${q2})`;
            }
            return match;
        });

        if (fileChanged) {
            fs.writeFileSync(file, content, 'utf8');
            updatedFiles++;
        }
    }

    console.log(`Successfully updated ${updatedOccurrences} occurrences in ${updatedFiles} files!`);
}

run();
