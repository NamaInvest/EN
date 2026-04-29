const fs = require('fs');

function fixMadaButtons(p) {
    let content = fs.readFileSync(p, 'utf8');
    
    let regex = /\{madaStatus === 'WAITING' && \([\s\S]*?<button[\s\S]*?onClick=\{[\s\S]*?setShowMadaModal\(false\)[\s\S]*?\}[\s\S]*?>\{t\('sys\.str_4046'\)\}<\/button>[\s\S]*?\)\}/;
    
    if (content.match(regex)) {
        let replacement = `{madaStatus === 'WAITING' && (
                        <div style={{ display: 'flex', gap: '1rem', marginTop: '1rem' }}>
                            <button
                                onClick={() => setShowMadaModal(false)}
                                style={{ background: '#fef2f2', border: '1px solid #fee2e2', padding: '8px 16px', borderRadius: '8px', color: '#ef4444', cursor: 'pointer', fontWeight: 600, flex: 1 }}
                            >
                                {t('sys.str_4046')}
                            </button>
                            <button
                                onClick={() => {
                                    setShowMadaModal(false);
                                    handleCheckout('CARD');
                                }}
                                style={{ background: '#ecfdf5', border: '1px solid #d1fae5', padding: '8px 16px', borderRadius: '8px', color: '#10b981', cursor: 'pointer', fontWeight: 600, flex: 1 }}
                            >
                                الدفع يدوياً
                            </button>
                        </div>
                    )}`;
        content = content.replace(regex, replacement);
        fs.writeFileSync(p, content, 'utf8');
        console.log('Fixed buttons in', p);
    } else {
        console.log('Regex not matched in', p);
    }
}

fixMadaButtons('src/app/pos/page.tsx');
fixMadaButtons('src/app/restaurant-pos/page.tsx');
