const fs = require('fs');
const file = 'c:/Users/1/Desktop/alfa/src/app/(dashboard)/sales/page.tsx';
let content = fs.readFileSync(file, 'utf8');

// Remove Headers
content = content.replace(
    /<th style=\{\{ width: '80px' \}\}>\{t\('sys.str_766'\)\}<\/th>\s*<th style=\{\{ width: '90px' \}\}>خصم \(ريال\)<\/th>/,
    ""
);

// Fix colspan
content = content.replace(/colSpan=\{7\}/, "colSpan={5}");

// Remove Body TDs
const searchTds = `                                                <td>
                                                    <input className="input" type="number" min="0" max="100"
                                                        value={item.discountRate} onChange={e => updateCartItem(idx, 'discountRate', parseFloat(e.target.value) || 0)}
                                                        style={{ textAlign: 'center', padding: '6px 8px' }} dir="ltr" />
                                                </td>
                                                <td>
                                                    <input className="input" type="number" min="0"
                                                        value={item.discountValue || 0} onChange={e => updateCartItem(idx, 'discountValue', parseFloat(e.target.value) || 0)}
                                                        style={{ textAlign: 'center', padding: '6px 8px' }} dir="ltr" />
                                                </td>`;

content = content.replace(searchTds, "");

fs.writeFileSync(file, content);
console.log('Successfully removed item-level discount UI');
