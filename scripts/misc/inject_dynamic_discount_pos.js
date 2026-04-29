const fs = require('fs');
const file = 'c:/Users/1/Desktop/alfa/src/app/(dashboard)/sales/page.tsx';
let content = fs.readFileSync(file, 'utf8');

// 1. Add import
if (!content.includes("import { useSettings }")) {
    content = content.replace("import { useTranslation } from \"@/lib/i18n\";", "import { useTranslation } from \"@/lib/i18n\";\nimport { useSettings } from '@/lib/SettingsContext';");
}

// 2. Add Hooks inside SalesPage
const hooksInsert = `    const { t } = useTranslation();
    const { getSetting } = useSettings();
    const discountEnabled = getSetting('POS_DISCOUNT_ENABLED', 'true') === 'true';
    const rulesRaw = getSetting('POS_DISCOUNT_RULES', '[]');
    const [discountRules, setDiscountRules] = useState<{minAmount: number, maxDiscount: number}[]>([]);

    useEffect(() => {
        try {
            const parsed = JSON.parse(rulesRaw);
            if(Array.isArray(parsed)) setDiscountRules(parsed);
        } catch(e) {}
    }, [rulesRaw]);`;

content = content.replace("    const { t } = useTranslation();", hooksInsert);

// 3. Compute max discount inside subtotal/total block.
// Let's find: const subtotal = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
// and intercept it inside a useMemo if not already, wait, it's just a const right now.
const totalBlock = `    const subtotal = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    const invoiceDiscount = subtotal * (discountRate / 100) + discountValueState;
    const taxableAmount = Math.max(0, subtotal - invoiceDiscount);`;

const newTotalBlock = `    const subtotal = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    const maxAllowedDiscount = (() => {
        if (!discountEnabled) return 0;
        if (discountRules.length === 0) return Infinity;
        const applicableRules = discountRules.filter(r => r.minAmount <= subtotal);
        if (applicableRules.length === 0) return 0;
        return Math.max(...applicableRules.map(r => r.maxDiscount));
    })();
    const invoiceDiscount = subtotal * (discountRate / 100) + discountValueState;
    const taxableAmount = Math.max(0, subtotal - invoiceDiscount);`;

content = content.replace(totalBlock, newTotalBlock);

// 4. Update the input UI for the footer discount
const footerInputBlock = `                                    <input className="input" type="number" min="0" step="0.01"
                                        id="discount-input"
                                        value={discountRate} onChange={e => setDiscountRate(parseFloat(e.target.value) || 0)}
                                        onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); showToast(\`✅ تم تطبيق خصم \${discountRate}%\`); } }}
                                        style={{ width: '70px', textAlign: 'center', padding: '6px 8px', fontWeight: '700' }} dir="ltr" />
                                    <span style={{ fontSize: '14px', fontWeight: '600' }}>%</span>
                                    <input className="input" type="number" min="0" step="0.01"
                                        placeholder="خصم بالريال"
                                        value={discountValueState} onChange={e => setDiscountValueState(parseFloat(e.target.value) || 0)}
                                        onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); showToast(\`✅ تم تطبيق خصم \${discountValueState} ر.س\`); } }}
                                        style={{ width: '90px', textAlign: 'center', padding: '6px 8px', fontWeight: '700', marginLeft: '10px' }} dir="ltr" />
                                    <span style={{ fontSize: '14px', fontWeight: '600' }}>ر.س</span>`;


const newFooterInputBlock = `                                    {discountEnabled ? (
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
                                                }}
                                                onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); showToast(\`✅ تم تطبيق خصم \${discountRate}%\`); } }}
                                                style={{ width: '70px', textAlign: 'center', padding: '6px 8px', fontWeight: '700' }} dir="ltr" />
                                            <span style={{ fontSize: '14px', fontWeight: '600' }}>%</span>
                                            <input className="input" type="number" min="0" step="0.01"
                                                placeholder="خصم بالريال"
                                                value={discountValueState} onChange={e => {
                                                    const val = parseFloat(e.target.value) || 0;
                                                    if (discountRules.length > 0 && val > maxAllowedDiscount) {
                                                        showToast(\`❌ عذراً، أقصى خصم مسموح لهذه الفاتورة هو \${maxAllowedDiscount} ريال\`);
                                                        // Fallback to max allowed to help cashier explicitly if they want
                                                        // setDiscountValueState(maxAllowedDiscount);
                                                        return;
                                                    }
                                                    setDiscountValueState(val);
                                                }}
                                                onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); showToast(\`✅ تم تطبيق خصم \${discountValueState} ر.س\`); } }}
                                                style={{ width: '90px', textAlign: 'center', padding: '6px 8px', fontWeight: '700', marginLeft: '10px' }} dir="ltr" />
                                            <span style={{ fontSize: '14px', fontWeight: '600' }}>ر.س</span>
                                        </>
                                    ) : (
                                        <span style={{ fontSize: '13px', color: 'var(--text-muted)' }}>الخصم غير مفعل حالياً</span>
                                    )}`;

content = content.replace(footerInputBlock, newFooterInputBlock);

fs.writeFileSync(file, content);
console.log('Successfully injected dynamic discount logic into POS page');
