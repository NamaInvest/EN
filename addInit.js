const fs = require('fs'); 
function addInit(p) { 
    let c = fs.readFileSync(p, 'utf8'); 
    
    // Add taxRate state if missing
    if (!c.includes('const [taxRate, setTaxRate]')) {
         let idx = c.indexOf('const [cart, setCart]');
         if (idx !== -1) {
             c = c.slice(0, idx) + 'const [taxRate, setTaxRate] = useState(15);\n    ' + c.slice(idx);
         } else {
             // For sales page, find something else
             let idx2 = c.indexOf('const [loading, setLoading]');
             if (idx2 !== -1) {
                 c = c.slice(0, idx2) + 'const [taxRate, setTaxRate] = useState(15);\n    ' + c.slice(idx2);
             }
         }
    }

    // Add initSettings hook
    if (!c.includes('initSettings()')) { 
        let idx = c.indexOf('useEffect(() => {'); 
        if (idx !== -1) {
            c = c.slice(0, idx) + 'const initSettings = async () => { try { const res = await fetch(\'/api/settings\'); if (res.ok) { const data = await res.json(); if (data.tax_rate !== undefined) setTaxRate(Number(data.tax_rate) || 0); } } catch (e) {} }; useEffect(() => { initSettings(); }, []);\n    ' + c.slice(idx); 
        }
    } 

    fs.writeFileSync(p, c); 
} 
addInit('src/app/pos/page.tsx'); 
addInit('src/app/restaurant-pos/page.tsx'); 
addInit('src/app/(dashboard)/sales/page.tsx'); 
console.log('Done!');
