const fs = require('fs');
const file = 'c:/Users/1/Desktop/alfa/src/app/(dashboard)/sales/options/page.tsx';
let content = fs.readFileSync(file, 'utf8');

if (!content.includes('const [taxEnabled, setTaxEnabled] = useState(true);')) {
    content = content.replace(
        "const [couponsEnabled, setCouponsEnabled] = useState(true);",
        "const [couponsEnabled, setCouponsEnabled] = useState(true);\n    const [taxEnabled, setTaxEnabled] = useState(true);"
    );
    
    content = content.replace(
        "const couponsRaw = getSetting('POS_COUPONS_ENABLED', 'true');",
        "const taxRaw = getSetting('POS_TAX_ENABLED', 'true');\n        setTaxEnabled(taxRaw === 'true');\n        \n        const couponsRaw = getSetting('POS_COUPONS_ENABLED', 'true');"
    );
    
    content = content.replace(
        "POS_COUPONS_ENABLED: couponsEnabled ? 'true' : 'false',",
        "POS_COUPONS_ENABLED: couponsEnabled ? 'true' : 'false',\n                POS_TAX_ENABLED: taxEnabled ? 'true' : 'false',"
    );

    const couponsToggleBlock = "                {/* Enable/Disable Coupons */}";
    const taxToggleBlock = `                {/* Enable/Disable Tax */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '24px', paddingBottom: '24px', borderBottom: '1px solid var(--border)' }}>
                    <div style={{ flex: 1 }}>
                        <h3 style={{ fontSize: '18px', fontWeight: 'bold', marginBottom: '4px' }}>تفعيل ضريبة القيمة المضافة</h3>
                        <p style={{ fontSize: '14px', color: 'var(--text-muted)', margin: 0 }}>
                            عند الإيقاف سيتم البيع بدون حساب وحفظ الضريبة على فاتورة المبيعات للمستهلك ولن تظهر في الشاشة.
                        </p>
                    </div>
                    <div>
                        <label style={{ position: 'relative', display: 'inline-block', width: '50px', height: '28px' }}>
                            <input type="checkbox" style={{ opacity: 0, width: 0, height: 0 }} 
                                checked={taxEnabled} 
                                onChange={e => setTaxEnabled(e.target.checked)} />
                            <span style={{
                                position: 'absolute', cursor: 'pointer', top: 0, left: 0, right: 0, bottom: 0,
                                backgroundColor: taxEnabled ? 'var(--primary)' : '#ccc',
                                transition: '.4s', borderRadius: '34px'
                            }}>
                                <span style={{
                                    position: 'absolute', content: '""', height: '20px', width: '20px',
                                    left: taxEnabled ? '26px' : '4px', bottom: '4px',
                                    backgroundColor: 'white', transition: '.4s', borderRadius: '50%'
                                }}></span>
                            </span>
                        </label>
                    </div>
                </div>

                {/* Enable/Disable Coupons */}`;
    
    content = content.replace(couponsToggleBlock, taxToggleBlock);
    
    fs.writeFileSync(file, content);
    console.log("Successfully injected tax options!");
} else {
    console.log("Already injected!");
}
