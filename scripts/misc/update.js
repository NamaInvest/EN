const fs = require('fs');
let code = fs.readFileSync('src/app/(dashboard)/company-info/page.tsx', 'utf8');

const stateVars =     const [fatooraStep, setFatooraStep] = useState(0);
    const [fatooraLoading, setFatooraLoading] = useState(false);
    const [fatooraMessage, setFatooraMessage] = useState('');
;
if(!code.includes('fatooraStep')) {
    code = code.replace('const [uploadingLogo, setUploadingLogo] = useState(false);', 'const [uploadingLogo, setUploadingLogo] = useState(false);\n' + stateVars);
}

const statusCheck =                 // Check ZATCA connection status from dedicated ZATCA API (reads from zatca_settings table)
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
                } catch { /* ZATCA status check failed, ignore */ }
;
if(!code.includes('zatcaStatus')) {
    code = code.replace("if (map['company_logo']) setLogoPreview(map['company_logo']);\n                }", "if (map['company_logo']) setLogoPreview(map['company_logo']);\n                }\n" + statusCheck.replace(/\\\\/g, '').replace(/\\\\\$/g, '$'));
}

const handleFatoora =     const handleFatooraAction = async (action: string) => {
        setFatooraLoading(true);
        setFatooraMessage('');
        try {
            const token = localStorage.getItem('token');
            const bodyData = { action };
            if (action === 'compliance-csid') {
                const otp = settings['zatca_otp'] || '';
                if (!otp) { showToast(t('sys.str_4534') || '«·—Ã«¡ ≈œŒ«· —„“ «· Õﬁﬁ OTP √Ê·«'); setFatooraLoading(false); return; }
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
                setFatooraMessage(\\\? \\\\\\);
                showToast(\\\? \\\\\\);
            }
        } catch (err) { console.error(err); setFatooraMessage('Œÿ√ ›Ì «·« ’«· »„‰’… ›« Ê—…'); }
        finally { setFatooraLoading(false); }
    };
;
if(!code.includes('handleFatooraAction')) {
    code = code.replace('const handleLogoDelete', handleFatoora.replace(/\\\\/g, '').replace(/\\\\\$/g, '$') + '\n    const handleLogoDelete');
}

const uiBlock =                 {/* ?? 4. —»ÿ „‰’… ›« Ê—… (Integration) ???????????? */}
                <div className="card" style={{ marginBottom: '20px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '16px', borderRadius: '10px', marginBottom: '16px', background: fatooraStep >= 3 ? 'linear-gradient(135deg, rgba(34,197,94,0.15), rgba(34,197,94,0.05))' : 'linear-gradient(135deg, rgba(239,68,68,0.15), rgba(239,68,68,0.05))', border: \\\2px solid \\\\\\ }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                            <div style={{ width: '48px', height: '48px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '24px', background: fatooraStep >= 3 ? 'rgba(34,197,94,0.2)' : 'rgba(239,68,68,0.2)', boxShadow: fatooraStep >= 3 ? '0 0 20px rgba(34,197,94,0.4)' : '0 0 20px rgba(239,68,68,0.4)', animation: fatooraStep >= 3 ? 'pulse 2s infinite' : undefined }}>
                                {fatooraStep >= 3 ? '??' : '??'}
                            </div>
                            <div>
                                <div style={{ fontWeight: '700', fontSize: '16px' }}>{fatooraStep >= 3 ? t('sys.str_4552') || '„ ’· »„‰’… ›« Ê—… («·≈‰ «Ã)' : t('sys.str_4553') || '€Ì— „ ’· (Ì ÿ·» ≈ﬂ„«· «·—»ÿ)'}</div>
                                <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>{fatooraStep >= 3 ? t('sys.str_4554') || '≈⁄œ«œ«  ZATCA „›⁄·… ÊÃ«Â“….' : t('sys.str_4555') || 'Ì—ÃÏ ≈ﬂ„«· ŒÿÊ«  «·—»ÿ »«·√”›·'}</div>
                            </div>
                        </div>
                    </div>

                    <h4 style={{ fontSize: '14px', fontWeight: '700', marginBottom: '16px' }}>{t('sys.str_4349') || 'ŒÿÊ«  «·—»ÿ „⁄ “« ﬂ«'}</h4>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                        {[
                            { step: 1, label: t('sys.str_4556') || '«·„—Õ·… 1: «· ”ÃÌ· (CSR)', action: 'compliance-csid', desc: '≈—”«· CSR „⁄ OTP „‰ »Ê«»… ›« Ê—…' },
                            { step: 2, label: t('sys.str_4557') || '«·„—Õ·… 2: «·«„ À«·', action: 'compliance-invoice', desc: '≈—”«· ›« Ê—…  Ã—Ì»Ì… ·· Õﬁﬁ' },
                            { step: 3, label: t('sys.str_4558') || '«·„—Õ·… 3: «·≈‰ «Ã', action: 'production-csid', desc: ' ›⁄Ì· «·—»ÿ «·„»«‘— „⁄ „‰’… ›« Ê—…' },
                        ].map(s => (
                            <div key={s.step} style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '12px', borderRadius: '8px', background: fatooraStep >= s.step ? 'rgba(34,197,94,0.08)' : 'var(--bg-card)', border: \\\1px solid \\\\\\ }}>
                                <div style={{ width: '32px', height: '32px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: '700', fontSize: '14px', background: fatooraStep >= s.step ? 'var(--success-light)' : 'var(--bg-card-hover)', color: fatooraStep >= s.step ? '#fff' : 'var(--text-muted)' }}>
                                    {fatooraStep >= s.step ? '?' : s.step}
                                </div>
                                <div style={{ flex: 1 }}>
                                    <div style={{ fontWeight: '600', fontSize: '13px' }}>{s.label}</div>
                                    <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>{s.desc}</div>
                                </div>
                                <button className=\\\tn btn-sm \\\\\\ onClick={() => handleFatooraAction(s.action)} disabled={fatooraLoading || (s.step > 1 && fatooraStep < s.step - 1)} style={{ minWidth: '80px' }}>
                                    {fatooraLoading ? '?' : (fatooraStep >= s.step ? (t('sys.str_4559') || '„ﬂ „·') : (t('sys.str_4560') || '»œ¡'))}
                                </button>
                            </div>
                        ))}
                    </div>
                    {fatooraMessage && (
                        <div style={{ marginTop: '12px', padding: '10px', borderRadius: '8px', background: fatooraMessage.includes('?') ? 'rgba(34,197,94,0.1)' : 'rgba(239,68,68,0.1)', fontSize: '13px', fontWeight: '600' }}>
                            {fatooraMessage}
                        </div>
                    )}
                </div>
;
if(!code.includes('4. —»ÿ „‰’… ›« Ê—… (Integration)')) {
    code = code.replace('            </div>\n        </>\n    );\n}', uiBlock.replace(/\\\\/g, '').replace(/\\\\\$/g, '$') + '\n            </div>\n        </>\n    );\n}');
}

fs.writeFileSync('src/app/(dashboard)/company-info/page.tsx', code);
console.log('? Updated company-info/page.tsx with Fatoora Wizard');
