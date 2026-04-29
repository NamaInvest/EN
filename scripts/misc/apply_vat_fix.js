const fs = require('fs');

function fixFile(path, isSales) {
    let content = fs.readFileSync(path, 'utf8');
    
    // Add taxRate state
    if (!content.includes('const [taxRate, setTaxRate]')) {
        content = content.replace(
            /(const \[loading, setLoading\] = useState.*?;\n)/,
            `$1    const [taxRate, setTaxRate] = useState(15);\n`
        );
        // If the above replace didn't work (sales page maybe):
        if (!content.includes('const [taxRate, setTaxRate]')) {
             content = content.replace(
                /(const \[cart, setCart.*?\n)/,
                `$1    const [taxRate, setTaxRate] = useState(15);\n`
             );
        }
        if (!content.includes('const [taxRate, setTaxRate]')) {
             content = content.replace(
                /(const \[search, setSearch.*?\n)/,
                `$1    const [taxRate, setTaxRate] = useState(15);\n`
             );
        }
    }

    // Add fetch inside useEffect
    if (!content.includes('fetch(\'/api/settings\')')) {
        const fetchCode = `
        const initSettings = async () => {
            try {
                const res = await fetch('/api/settings');
                if (res.ok) {
                    const data = await res.json();
                    if (data.tax_rate !== undefined) setTaxRate(Number(data.tax_rate) || 0);
                }
            } catch (e) {}
        };
        initSettings();
`;
        content = content.replace(
            /(const handleKeyDown =.*?;\n)/,
            fetchCode + '$1'
        );
    }

    // Replace hardcoded 0.15 with dynamic taxRate
    if (isSales) {
        content = content.replace(/const taxValue = afterDiscount \* 0\.15;/g, 'const taxValue = afterDiscount * (taxRate / 100);');
        content = content.replace(/const heldWithTax = heldTotal \* 1\.15;/g, 'const heldWithTax = heldTotal + (heldTotal * (taxRate / 100));');
    } else {
        content = content.replace(/const tax = total \* 0\.15;.*?\n/g, 'const tax = total * (taxRate / 100);\n');
    }

    fs.writeFileSync(path, content);
}

fixFile('src/app/pos/page.tsx', false);
fixFile('src/app/restaurant-pos/page.tsx', false);
fixFile('src/app/(dashboard)/sales/page.tsx', true);

console.log('VAT fix applied successfully!');
