const fs = require('fs');
let sPage = fs.readFileSync('src/app/(dashboard)/settings/page.tsx', 'utf8');

// Remove from getSettingGroups
sPage = sPage.replace(/\{\s*title:\s*t\('sys\.str_4434'\),\s*keys:\s*\[[\s\S]*?\]\s*\},/, '');

// Extract and remove the wizard block
const wizardRegex = /\{group\.title\.includes\(t\('sys\.str_4551'\)\) && \([\s\S]*?\}\)[\s\S]*?\([\s\S]*?\}\)\s*\}\)/;
const wizardMatch = sPage.match(wizardRegex);
const wizardBlock = wizardMatch ? wizardMatch[0] : '';
if(wizardBlock) {
    sPage = sPage.replace(wizardBlock, '');
} else {
    console.log("Could not find wizard block in settings!");
}

fs.writeFileSync('src/app/(dashboard)/settings/page.tsx', sPage);

let cPage = fs.readFileSync('src/app/(dashboard)/company-info/page.tsx', 'utf8');

// Now inject inside company-info
const zatcaInputBlock = \
                        <div className="input-group">
                            <label className="input-label">{t('sys.str_4435')}</label>
                            <select className="input" value={settings['zatca_environment'] || 'simulation'} onChange={e => set('zatca_environment', e.target.value)} style={inputStyle('zatca_environment')}>
                                <option value="simulation">{t('sys.str_4342') || 'مرحلة المحاكاة (Simulation)'}</option>
                                <option value="production">{t('sys.str_4343') || 'مرحلة الإنتاج (Production)'}</option>
                            </select>
                        </div>
                        <div className="input-group">
                            <label className="input-label">{t('sys.str_4436')}</label>
                            <input className="input" type="text" value={settings['zatca_otp'] || ''} onChange={e => set('zatca_otp', e.target.value)} style={inputStyle('zatca_otp')} />
                        </div>\;

if(!cPage.includes('zatca_environment')) {
    cPage = cPage.replace('{ key: \\'zatca_crn\\', label: t(\\'sys.str_4401\\') },', zatcaInputBlock + '\\n                            { key: \\'zatca_crn\\', label: t(\\'sys.str_4401\\') },');
}

// Inject the wizard states
const statesBlock = \
    const [fatooraStep, setFatooraStep] = useState(0);
    const [fatooraLoading, setFatooraLoading] = useState(false);
    const [fatooraMessage, setFatooraMessage] = useState('');\;
if(!cPage.includes('fatooraStep')) {
    cPage = cPage.replace('const [uploadingLogo, setUploadingLogo] = useState(false);', 'const [uploadingLogo, setUploadingLogo] = useState(false);\\n' + statesBlock);
}

// Check status effect
const checkStatus = \
                try {
                    const zatcaRes = await fetch('/api/zatca?type=status', { headers: { Authorization: \\\Bearer \\\\\\ } });
                    if (zatcaRes.ok) {
                        const zatcaStatus = await zatcaRes.json();
                        if (zatcaStatus.status === 'connected' || zatcaStatus.has_production_csid) {
                            setFatooraStep(3);
                        } else if (zatcaStatus.status === 'compliance_passed') {
                            setFatooraStep(2);
                        } else if (zatcaStatus.status === 'compliance_csid') {
                            setFatooraStep(1);
                        }
                    }
                } catch { }\;
if(!cPage.includes('zatcaStatus')) {
    cPage = cPage.replace("if (map['company_logo']) setLogoPreview(map['company_logo']);\\n                }", "if (map['company_logo']) setLogoPreview(map['company_logo']);\\n                }\\n" + checkStatus);
}

// handleFatooraAction
const actionHandler = \
    const handleFatooraAction = async (action: string) => {
        setFatooraLoading(true);
        setFatooraMessage('');
        try {
            const token = localStorage.getItem('token');
            const bodyData = { action, otp: '' };
            if (action === 'compliance-csid') {
                const otp = settings['zatca_otp'] || '';
                if (!otp) { showToast(t('sys.str_4534') || 'OTP مطلوب'); setFatooraLoading(false); return; }
                bodyData.otp = otp;
            }
            const res = await fetch('/api/zatca', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', Authorization: \\\Bearer \\\\\\ },
                body: JSON.stringify(bodyData),
            });
            const data = await res.json();
            if (data.success) {
                setFatooraMessage(data.message);
                showToast(data.message);
                if (action === 'compliance-csid') setFatooraStep(1);
                if (action === 'compliance-invoice') setFatooraStep(2);
                if (action === 'production-csid') setFatooraStep(3);
            } else {
                setFatooraMessage(\\\❌ \\\\\\);
                showToast(\\\❌ \\\\\\);
            }
        } catch (err) { setFatooraMessage('❌ خطأ في الاتصال'); }
        finally { setFatooraLoading(false); }
    };
\;
if(!cPage.includes('handleFatooraAction')) {
    cPage = cPage.replace('const handleLogoDelete', actionHandler + '\\n    const handleLogoDelete');
}

// Insert Wizard UI
const wizUI = \
                {/* ── المعالج (ZATCA Wizard) ──────────── */}
                <div className="card" style={{ marginBottom: '20px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '16px', borderRadius: '10px', marginBottom: '16px', background: fatooraStep >= 3 ? 'linear-gradient(135deg, rgba(34,197,94,0.15), rgba(34,197,94,0.05))' : 'linear-gradient(135deg, rgba(239,68,68,0.15), rgba(239,68,68,0.05))', border: \\\2px solid \\\\\\ }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                            <div style={{ width: '48px', height: '48px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '24px', background: fatooraStep >= 3 ? 'rgba(34,197,94,0.2)' : 'rgba(239,68,68,0.2)', boxShadow: fatooraStep >= 3 ? '0 0 20px rgba(34,197,94,0.4)' : '0 0 20px rgba(239,68,68,0.4)' }}>
                                {fatooraStep >= 3 ? '🟢' : '🔴'}
                            </div>
                            <div>
                                <div style={{ fontWeight: '700', fontSize: '16px' }}>{fatooraStep >= 3 ? (t('sys.str_4552') || 'متصل') : (t('sys.str_4553') || 'غير متصل')}</div>
                                <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>{fatooraStep >= 3 ? (t('sys.str_4554') || 'جاهزة') : (t('sys.str_4555') || 'أكمل الربط')}</div>
                            </div>
                        </div>
                    </div>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                        {[
                            { step: 1, label: t('sys.str_4556') || 'CSR', action: 'compliance-csid' },
                            { step: 2, label: t('sys.str_4557') || 'Verification', action: 'compliance-invoice' },
                            { step: 3, label: t('sys.str_4558') || 'Production', action: 'production-csid' },
                        ].map(s => (
                            <div key={s.step} style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '12px', borderRadius: '8px', background: fatooraStep >= s.step ? 'rgba(34,197,94,0.08)' : 'var(--bg-card)', border: \\\1px solid \\\\\\ }}>
                                <div style={{ width: '32px', height: '32px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: '700', fontSize: '14px', background: fatooraStep >= s.step ? 'var(--success-light)' : 'var(--bg-card-hover)', color: fatooraStep >= s.step ? '#fff' : 'var(--text-muted)' }}>
                                    {fatooraStep >= s.step ? '✓' : s.step}
                                </div>
                                <div style={{ flex: 1 }}>
                                    <div style={{ fontWeight: '600', fontSize: '13px' }}>{s.label}</div>
                                </div>
                                <button className=\\\tn btn-sm \\\\\\ onClick={() => handleFatooraAction(s.action)} disabled={fatooraLoading || (s.step > 1 && fatooraStep < s.step - 1)} style={{ minWidth: '80px' }}>
                                    {fatooraLoading ? '⏳' : (fatooraStep >= s.step ? (t('sys.str_4559') || 'مكتمل') : (t('sys.str_4560') || 'بدء'))}
                                </button>
                            </div>
                        ))}
                    </div>
                </div>
\;
if(!cPage.includes('ZATCA Wizard')) {
    cPage = cPage.replace('            </div>\\n        </>\\n    );\\n}', wizUI + '\\n            </div>\\n        </>\\n    );\\n}');
}

fs.writeFileSync('src/app/(dashboard)/company-info/page.tsx', cPage);
console.log('✅ Extraction and Injection complete!');
