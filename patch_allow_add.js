const fs = require('fs');

// --- 1. Patch sales options page ---
let optionsCode = fs.readFileSync('src/app/(dashboard)/sales/options/page.tsx', 'utf8');

// Add state
optionsCode = optionsCode.replace(
    /const \[allowNegativeStock, setAllowNegativeStock\] = useState\(false\);/,
    "const [allowNegativeStock, setAllowNegativeStock] = useState(false);\n    const [allowAddProduct, setAllowAddProduct] = useState(true);"
);

// Load state
optionsCode = optionsCode.replace(
    /const negativeRaw = getSetting\('POS_ALLOW_NEGATIVE_STOCK', 'false'\);\n        setAllowNegativeStock\(negativeRaw === 'true'\);/,
    `const negativeRaw = getSetting('POS_ALLOW_NEGATIVE_STOCK', 'false');
        setAllowNegativeStock(negativeRaw === 'true');
        
        const allowAddRaw = getSetting('POS_ALLOW_ADD_PRODUCT', 'true');
        setAllowAddProduct(allowAddRaw === 'true');`
);

// Save state
optionsCode = optionsCode.replace(
    /POS_ALLOW_NEGATIVE_STOCK: allowNegativeStock \? 'true' : 'false',/,
    "POS_ALLOW_NEGATIVE_STOCK: allowNegativeStock ? 'true' : 'false',\n                POS_ALLOW_ADD_PRODUCT: allowAddProduct ? 'true' : 'false',"
);

// Add UI
const uiBlock = `                    </div>
                </div>

                {/* Allow Add Product */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '24px', paddingBottom: '24px', borderBottom: '1px solid var(--border)' }}>
                    <div style={{ flex: 1 }}>
                        <h3 style={{ fontSize: '18px', fontWeight: 'bold', marginBottom: '4px' }}>السماح بإضافة منتج غير موجود</h3>
                        <p style={{ fontSize: '14px', color: 'var(--text-muted)', margin: 0 }}>
                            عند الإيقاف لن يظهر زر "إضافة منتج جديد" في شاشة المبيعات، ويجب إضافة المنتجات من قسم المستودعات فقط.
                        </p>
                    </div>
                    <div>
                        <label style={{ position: 'relative', display: 'inline-block', width: '50px', height: '28px' }}>
                            <input type="checkbox" style={{ opacity: 0, width: 0, height: 0 }} 
                                checked={allowAddProduct} 
                                onChange={e => setAllowAddProduct(e.target.checked)} />
                            <span style={{
                                position: 'absolute', cursor: 'pointer', top: 0, left: 0, right: 0, bottom: 0,
                                backgroundColor: allowAddProduct ? 'var(--primary)' : '#ccc',
                                transition: '.4s', borderRadius: '34px'
                            }}>
                                <span style={{
                                    position: 'absolute', content: '""', height: '20px', width: '20px',
                                    left: allowAddProduct ? '26px' : '4px', bottom: '4px',
                                    backgroundColor: 'white', transition: '.4s', borderRadius: '50%'
                                }}></span>
                            </span>
                        </label>
                    </div>
                </div>`;

optionsCode = optionsCode.replace(/\/\* Allow Negative Stock \*\//, uiBlock + '\n\n                {/* Allow Negative Stock */}');

fs.writeFileSync('src/app/(dashboard)/sales/options/page.tsx', optionsCode);

// --- 2. Patch sales page ---
let salesCode = fs.readFileSync('src/app/(dashboard)/sales/page.tsx', 'utf8');

salesCode = salesCode.replace(
    /const allowNegativeStock = getSetting\('POS_ALLOW_NEGATIVE_STOCK', 'false'\) === 'true';/,
    "const allowNegativeStock = getSetting('POS_ALLOW_NEGATIVE_STOCK', 'false') === 'true';\n    const allowAddProduct = getSetting('POS_ALLOW_ADD_PRODUCT', 'true') === 'true';"
);

salesCode = salesCode.replace(
    /<button className="btn btn-primary btn-sm" onClick=\{openAddProduct\}>\{t\('sys\.str_764'\)\}<\/button>/,
    "{allowAddProduct && <button className=\"btn btn-primary btn-sm\" onClick={openAddProduct}>{t('sys.str_764')}</button>}"
);

fs.writeFileSync('src/app/(dashboard)/sales/page.tsx', salesCode);

console.log('done');
