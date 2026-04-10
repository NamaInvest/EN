const fs = require('fs');

const file = 'd:/namasoft9-3-main/src/app/(dashboard)/sales/page.tsx';
let content = fs.readFileSync(file, 'utf8');

// 1. Add discountValue to CartItem interface
content = content.replace(
    /price: number; discountRate: number; taxRate: number;/,
    "price: number; discountRate: number; discountValue?: number; taxRate: number;"
);

// 2. Change addToCart to PREPEND rather than APPEND
content = content.replace(
    /const existing = cart\.find\(c => c\.productId === p\.id\);\s*if \(existing\) \{\s*setCart\(cart\.map\(c => c\.productId === p\.id \? \{ \.\.\.c, quantity: c\.quantity \+ 1 \} : c\)\);\s*\} else \{\s*setCart\(\[\.\.\.cart, \{/s,
    `const existing = cart.find(c => c.productId === p.id);
        if (existing) {
            // Update quantity AND move item to the top
            setCart([
                { ...existing, quantity: existing.quantity + 1 },
                ...cart.filter(c => c.productId !== p.id)
            ]);
        } else {
            setCart([{`
);

// Close brackets for addToCart prepend addition
content = content.replace(
    /stock: p\.currentStock, unitName: p\.unit\?\.name \|\| t\('sys\.str_813'\),\s*\}\]\);\s*\}/s,
    `discountValue: 0, stock: p.currentStock, unitName: p.unit?.name || t('sys.str_813'),
            }, ...cart]);
        }`
);

// 3. Update the global subtotal calculation logic
content = content.replace(
    /const disc = itemTotal \* \(item\.discountRate \/ 100\);\s*return sum \+ \(itemTotal - disc\);/,
    "const disc = itemTotal * (item.discountRate / 100) + (item.discountValue || 0);\n        return sum + Math.max(0, itemTotal - disc);"
);

content = content.replace(
    /return sum \+ \(itemTotal \* \(item\.discountRate \/ 100\)\);/,
    "return sum + (itemTotal * (item.discountRate / 100)) + (item.discountValue || 0);"
);

// 4. Update the per-item calculation in the table mapping
content = content.replace(
    /const itemDisc = itemSub \* \(item\.discountRate \/ 100\);\s*const itemTotal = itemSub - itemDisc;/,
    "const itemDisc = itemSub * (item.discountRate / 100) + (item.discountValue || 0);\n                                        const itemTotal = Math.max(0, itemSub - itemDisc);"
);

// 5. Add "خصم (ريال)" to the table headers
content = content.replace(
    /<th style=\{\{ width: '80px' \}\}>\{t\('sys\.str_766'\)\}<\/th>/,
    `<th style={{ width: '80px' }}>{t('sys.str_766')}</th>
                                        <th style={{ width: '90px' }}>خصم (ريال)</th>`
);

// 6. Add "خصم (ريال)" input to the table row cells
content = content.replace(
    /onChange=\{e => updateCartItem\(idx, 'discountRate', parseFloat\(e\.target\.value\) \|\| 0\)\}\s*style=\{\{ textAlign: 'center', padding: '6px 8px' \}\} dir="ltr" \/>\s*<\/td>/s,
    `onChange={e => updateCartItem(idx, 'discountRate', parseFloat(e.target.value) || 0)}
                                                        style={{ textAlign: 'center', padding: '6px 8px' }} dir="ltr" />
                                                </td>
                                                <td>
                                                    <input className="input" type="number" min="0"
                                                        value={item.discountValue || 0} onChange={e => updateCartItem(idx, 'discountValue', parseFloat(e.target.value) || 0)}
                                                        style={{ textAlign: 'center', padding: '6px 8px' }} dir="ltr" />
                                                </td>`
);

// The colSpan needs to be increased by 1 for the empty state
content = content.replace(
    /<td colSpan=\{6\}>(.*?)<div className="empty-state"/s,
    '<td colSpan={7}>$1<div className="empty-state"'
);


fs.writeFileSync(file, content);
console.log('Successfully updated cart reverse and fixed discount features!');
