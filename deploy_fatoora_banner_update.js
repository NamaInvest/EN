const fs = require('fs');
const { Client } = require('ssh2');

(async () => {
    // 1. Download company-info
    function sshCmd(cmd) {
      return new Promise(r => {
        const c = new Client(); let out = '';
        c.on('ready', () => c.exec(cmd, (e, s) => {
          s.on('data', d => out+=d); s.stderr.on('data', d => out+=d);
          s.on('close', () => { c.end(); r(out); });
        })).connect({ host:'46.4.188.170', port:22, username:'root', password:'_ee4SWbxLVfH9b' });
      });
    }

    let code = await sshCmd('cat /www/wwwroot/n11.namainvist.com/src/app/\\(dashboard\\)/company-info/page.tsx');
    if (!code || code.includes('No such file')) return console.log('Failed to read file');

    // states
    const states = `    const [fatooraStep, setFatooraStep] = useState(0);
    const [fatooraLoading, setFatooraLoading] = useState(false);
    const [fatooraMessage, setFatooraMessage] = useState('');

    const handleFatooraAction = async (action: string) => {
        setFatooraLoading(true);
        setFatooraMessage('');
        try {
            const token = localStorage.getItem('token');
            const bodyData: Record<string, any> = { action };
            if (action === 'compliance-csid') {
                const otp = settings['zatca_otp'] || '';
                if (!otp) { showToast(t('sys.str_4534') || 'الرجاء إدخال رمز OTP الخاص بزاتكا أولاً'); setFatooraLoading(false); return; }
                bodyData.otp = otp;
            }
            const res = await fetch('/api/zatca', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', Authorization: \`Bearer \${token}\` },
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
                setFatooraMessage(\`❌ \${data.error || data.message}\`);
                showToast(\`❌ \${data.error || data.message}\`);
            }
        } catch (err) { console.error(err); setFatooraMessage('حدث خطأ'); }
        finally { setFatooraLoading(false); }
    };
`;
    // Insert states after const [uploadingLogo...
    code = code.replace(/const \[uploadingLogo, setUploadingLogo\] = useState\(false\);/, 
         "const [uploadingLogo, setUploadingLogo] = useState(false);\n" + states);

    // Insert effect call
    const effStr = `                // Check ZATCA status
                try {
                    const zatcaRes = await fetch('/api/zatca?type=status', { headers: { Authorization: \`Bearer \${token}\` } });
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
`;
    code = code.replace(/if \(map\['company_logo'\]\) setLogoPreview\(map\['company_logo'\]\);/,
                      "if (map['company_logo']) setLogoPreview(map['company_logo']);\n" + effStr);


    // Insert JSX UI after zatca_otp div
    const jsxStr = `                        {/* ZATCA Onboarding Block */}
                            <div style={{ marginTop: '16px', padding: '20px', background: 'var(--bg-card-hover)', borderRadius: '12px', border: '1px solid var(--border)', gridColumn: '1 / -1' }}>
                                <div style={{
                                    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                                    padding: '16px', borderRadius: '10px', marginBottom: '16px',
                                    background: fatooraStep >= 3 ? 'linear-gradient(135deg, rgba(34,197,94,0.15), rgba(34,197,94,0.05))' : 'linear-gradient(135deg, rgba(239,68,68,0.15), rgba(239,68,68,0.05))',
                                    border: \`2px solid \${fatooraStep >= 3 ? 'rgba(34,197,94,0.5)' : 'rgba(239,68,68,0.5)'}\`,
                                }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                                        <div style={{
                                            width: '48px', height: '48px', borderRadius: '50%',
                                            display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '24px',
                                            background: fatooraStep >= 3 ? 'rgba(34,197,94,0.2)' : 'rgba(239,68,68,0.2)',
                                            boxShadow: fatooraStep >= 3 ? '0 0 20px rgba(34,197,94,0.4)' : '0 0 20px rgba(239,68,68,0.4)',
                                        }}>
                                            {fatooraStep >= 3 ? '🟢' : '🔴'}
                                        </div>
                                        <div>
                                            <div style={{ fontWeight: '700', fontSize: '16px' }}>
                                                {fatooraStep >= 3 ? 'متصل بمنصة فاتورة' : 'غير متصل (يلزم استكمال خطوات الربط)'}
                                            </div>
                                        </div>
                                    </div>
                                </div>
                                <h4 style={{ fontSize: '14px', fontWeight: '700', marginBottom: '16px' }}>خطوات الربط (ZATCA Onboarding)</h4>
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                                    {[
                                        { step: 1, label: 'توليد وربط شهادة CSID', action: 'compliance-csid', desc: 'إرسال CSR واستلام شهادة الالتزام' },
                                        { step: 2, label: 'فحص فواتير الالتزام', action: 'compliance-invoice', desc: 'إرسال فواتير تجريبية لمطابقتها' },
                                        { step: 3, label: 'استخراج شهادة الإنتاج PCSID', action: 'production-csid', desc: 'تفعيل الربط الجذري مع هيئة الزكاة' },
                                    ].map(s => (
                                        <div key={s.step} style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '12px', borderRadius: '8px', background: fatooraStep >= s.step ? 'rgba(34,197,94,0.08)' : 'var(--bg-card)' }}>
                                            <div style={{ width: '32px', height: '32px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: '700', fontSize: '14px', background: fatooraStep >= s.step ? 'var(--success-light)' : 'var(--bg-card-hover)', color: fatooraStep >= s.step ? '#fff' : 'var(--text-muted)' }}>
                                                {fatooraStep >= s.step ? '✓' : s.step}
                                            </div>
                                            <div style={{ flex: 1 }}>
                                                <div style={{ fontWeight: '600', fontSize: '13px' }}>{s.label}</div>
                                                <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>{s.desc}</div>
                                            </div>
                                            <button
                                                className={\`btn btn-sm \${fatooraStep >= s.step ? 'btn-success' : 'btn-primary'}\`}
                                                onClick={(e) => { e.preventDefault(); handleFatooraAction(s.action); }}
                                                disabled={fatooraLoading || (s.step > 1 && fatooraStep < s.step - 1)}
                                                style={{ minWidth: '80px', color: '#fff' }}
                                            >
                                                {fatooraLoading ? '⏳' : fatooraStep >= s.step ? 'مكتمل' : 'تنفيذ'}
                                            </button>
                                        </div>
                                    ))}
                                </div>
                                {fatooraMessage && (
                                    <div style={{ marginTop: '12px', padding: '10px', borderRadius: '8px', background: fatooraMessage.includes('✅') ? 'rgba(34,197,94,0.1)' : 'rgba(239,68,68,0.1)', fontSize: '13px', fontWeight: '600' }}>
                                        {fatooraMessage}
                                    </div>
                                )}
                            </div>
`;
    // Insert after zatca_otp div ends with </div>
    const splitPoint = `e => set('zatca_otp', e.target.value)} style={inputStyle('zatca_otp')} placeholder="e.g. 123456" />
                        </div>`;
    code = code.replace(splitPoint, splitPoint + '\n' + jsxStr);

    // Save and deploy
    const b64 = Buffer.from(code, 'utf8').toString('base64');
    console.log("Uploading modified page...");
    console.log(await sshCmd(`echo '${b64}' | base64 -d > /www/wwwroot/n11.namainvist.com/src/app/\\(dashboard\\)/company-info/page.tsx`));
    console.log("Rebuilding N11...");
    console.log(await sshCmd(`cd /www/wwwroot/n11.namainvist.com && npm run build 2>&1 | tail -25 && pm2 restart n11`));
    console.log("Done");
})();
