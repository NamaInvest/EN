const fs = require('fs');
const file = 'c:/Users/1/Desktop/alfa/src/app/(dashboard)/sales/page.tsx';
let content = fs.readFileSync(file, 'utf8');

// 1. Update state type for discountRules
content = content.replace(
    /const \[discountRules, setDiscountRules\] = useState<\{minAmount: number, maxDiscount: number\}\[\]>\(\[\]\);/,
    "const [discountRules, setDiscountRules] = useState<{minAmount: number, maxDiscount: number, maxDiscountPercent?: number}[]>([]);"
);

// 2. Add maxAllowedDiscountPercent calculation
const maxRiyalCalc = `        return Math.max(...applicableRules.map(r => r.maxDiscount));
    })();`;
const maxPercentCalc = `        return Math.max(...applicableRules.map(r => r.maxDiscount));
    })();
    const maxAllowedDiscountPercent = (() => {
        if (!discountEnabled) return 0;
        if (discountRules.length === 0) return 100;
        const applicableRules = discountRules.filter(r => r.minAmount <= subtotal);
        if (applicableRules.length === 0) return 0;
        return Math.max(...applicableRules.map(r => r.maxDiscountPercent || 0));
    })();`;

content = content.replace(maxRiyalCalc, maxPercentCalc);

// 3. Update the inputs logic
const oldFooterInputBlock = `                                    {discountEnabled ? (
                                        <>
                                            <input className="input" type="number" min="0" step="0.01"
                                                id="discount-input"
                                                value={discountRate} onChange={e => {
                                                    const val = parseFloat(e.target.value) || 0;
                                                    const projectedVal = subtotal * (val / 100);
                                                    if (discountRules.length > 0 && projectedVal > maxAllowedDiscount) {
                                                        showToast(\`❌ عذراً، أقصى خصم مسموح لهذه الفاتورة هو \${maxAllowedDiscount} ريال\`);
                                                        setDiscountRate(0);
                                                        return;
                                                    }
                                                    setDiscountRate(val);
                                                }}`;

const newFooterInputBlock = `                                    {discountEnabled ? (
                                        <>
                                            <input className="input" type="number" min="0" step="0.01"
                                                id="discount-input"
                                                value={discountRate} onChange={e => {
                                                    const val = parseFloat(e.target.value) || 0;
                                                    if (discountRules.length > 0 && val > maxAllowedDiscountPercent) {
                                                        showToast(\`❌ عذراً، أقصى نسبة خصم مسموحة هي \${maxAllowedDiscountPercent}%\`);
                                                        // setDiscountRate(maxAllowedDiscountPercent);
                                                        return;
                                                    }
                                                    // optionally we can also check if it exceeds Riyal limit, but since we have a dedicated % limit we use that.
                                                    setDiscountRate(val);
                                                }}`;

content = content.replace(oldFooterInputBlock, newFooterInputBlock);

fs.writeFileSync(file, content);
console.log('Successfully patched page.tsx for percentage discount limits!');
