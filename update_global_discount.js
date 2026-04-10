const fs = require('fs');
const file = 'd:/namasoft9-3-main/src/app/(dashboard)/sales/page.tsx';
let content = fs.readFileSync(file, 'utf8');

// 1. Add discountValueState right near discountRate
content = content.replace(
    /const \[discountRate, setDiscountRate\] = useState\(0\);/,
    "const [discountRate, setDiscountRate] = useState(0);\n    const [discountValueState, setDiscountValueState] = useState(0);"
);

// 2. Add discountValueState to Calculations
content = content.replace(
    /const regularDiscountValue = subtotal \* \(discountRate \/ 100\);/g,
    "const regularDiscountValue = (subtotal * (discountRate / 100)) + discountValueState;"
);

// 3. UI replacement in the footer
content = content.replace(
    /<span style=\{\{ fontSize: '14px', fontWeight: '600' \}\}>%<\/span>/g,
    `<span style={{ fontSize: '14px', fontWeight: '600' }}>%</span>
                                    <input className="input" type="number" min="0" step="0.01"
                                        placeholder="خصم بالريال"
                                        value={discountValueState} onChange={e => setDiscountValueState(parseFloat(e.target.value) || 0)}
                                        onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); showToast(\`✅ تم تطبيق خصم \${discountValueState} ر.س\`); } }}
                                        style={{ width: '90px', textAlign: 'center', padding: '6px 8px', fontWeight: '700', marginLeft: '10px' }} dir="ltr" />
                                    <span style={{ fontSize: '14px', fontWeight: '600' }}>ر.س</span>`
);

// 4. Fix clear discount button
content = content.replace(
    /\{discountRate > 0 && \(\s*<button onClick=\{\(\) => \{ setDiscountRate\(0\); showToast\(t\('sys\.str_847'\)\); \}\}/g,
    `{(discountRate > 0 || discountValueState > 0) && (
                                        <button onClick={() => { setDiscountRate(0); setDiscountValueState(0); showToast(t('sys.str_847')); }}`
);

// 5. Fix remaining display text of discount
content = content.replace(
    /discountRate > 0 \? `- \$\{fmt\(regularDiscountValue\)\}` : '0\.00'/g,
    "(discountRate > 0 || discountValueState > 0) ? `- ${fmt(regularDiscountValue)}` : '0.00'"
);

// Apply it!
fs.writeFileSync(file, content);
console.log('Successfully updated Global discount feature');
