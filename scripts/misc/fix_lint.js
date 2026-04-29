const fs = require('fs');
const path = require('path');

function getFiles(dir) {
    let files = [];
    fs.readdirSync(dir).forEach(file => {
        let fullPath = path.join(dir, file);
        if (fs.statSync(fullPath).isDirectory()) {
            files = files.concat(getFiles(fullPath));
        } else if (fullPath.endsWith('.tsx') || fullPath.endsWith('.ts')) {
            files.push(fullPath);
        }
    });
    return files;
}

const files = getFiles('./src/app/(dashboard)');

const functionNamesToHoist = [
    'load',
    'loadJournals',
    'loadLedger',
    'loadTrialBalance',
    'loadIncomeStatement',
    'loadBalanceSheet',
    'loadEmployees',
    'loadCustomers',
    'loadProducts',
    'loadSettings',
    'loadStocks',
    'loadStocktakes',
    'fetchData',
    'fetchProducts'
];

files.forEach(file => {
    let content = fs.readFileSync(file, 'utf8');
    let dirty = false;

    functionNamesToHoist.forEach(fn => {
        // Regex to match: const fnName = async () => {
        // allowing spaces
        const rgx = new RegExp(`const ${fn} = async \\(\\) => \\{`, 'g');
        if (rgx.test(content)) {
            content = content.replace(rgx, `async function ${fn}() {`);
            dirty = true;
        }
    });

    if (dirty) {
        fs.writeFileSync(file, content, 'utf8');
        console.log(`Fixed hoisting in: ${file}`);
    }
});
