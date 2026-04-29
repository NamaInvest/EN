const fs = require('fs');
const file = 'c:/Users/1/Desktop/alfa/src/app/(dashboard)/sales/page.tsx';
let content = fs.readFileSync(file, 'utf8');

const lines = content.split('\n');

// 1. Add discountValueState state var if missing
const rateIdx = lines.findIndex(l => l.includes('const [discountRate, setDiscountRate] = useState(0);'));
if (rateIdx !== -1 && !lines[rateIdx + 1].includes('discountValueState')) {
    lines.splice(rateIdx + 1, 0, '    const [discountValueState, setDiscountValueState] = useState(0);');
    console.log("Injected discountValueState state");
}

// 2. Add computation logic
const subtotalIdx = lines.findIndex(l => l.includes('    const subtotal = cart.reduce((sum, item) => {'));
if (subtotalIdx !== -1) {
    const regularIdx = lines.findIndex((l, i) => i > subtotalIdx && l.includes('const regularDiscountValue'));
    if (regularIdx !== -1) {
        const replacementStr = `    const maxAllowedDiscount = (() => {
        if (!discountEnabled) return 0;
        if (discountRules.length === 0) return Infinity;
        const applicableRules = discountRules.filter(r => r.minAmount <= subtotal);
        if (applicableRules.length === 0) return 0;
        return Math.max(...applicableRules.map(r => r.maxDiscount));
    })();
    const maxAllowedDiscountPercent = (() => {
        if (!discountEnabled) return 0;
        if (discountRules.length === 0) return 100;
        const applicableRules = discountRules.filter(r => r.minAmount <= subtotal);
        if (applicableRules.length === 0) return 0;
        return Math.max(...applicableRules.map(r => r.maxDiscountPercent || 0));
    })();
    const regularDiscountValue = subtotal * (discountRate / 100) + discountValueState;`;
        if (!lines[regularIdx].includes('discountValueState')) {
             lines[regularIdx] = replacementStr;
             console.log("Injected calculation logic");
        }
    }
}

fs.writeFileSync(file, lines.join('\n'));
