const fs = require('fs');
const { Client } = require('ssh2');

(async () => {
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

    // 1. Add generatingKeys state
    if (!code.includes('const [generatingKeys, setGeneratingKeys] = useState(false);')) {
      code = code.replace(/const \[fatooraStep, setFatooraStep\] = useState\(0\);/,
                          "const [generatingKeys, setGeneratingKeys] = useState(false);\n    const [fatooraStep, setFatooraStep] = useState(0);");
    }

    // 2. Add handleGenerateKeys function
    const generateFn = `
    const handleGenerateKeys = async () => {
        if (!confirm(t('sys.str_4531') || 'تحذير: توليد مفاتيح جديدة سيلغي الشهادات القديمة. هل أنت متأكد؟')) return;
        setGeneratingKeys(true);
        try {
            const token = localStorage.getItem('token');
            const res = await fetch('/api/settings/generate-keys', {
                method: 'POST',
                headers: { Authorization: \`Bearer \${token}\` },
            });
            if (res.ok) {
                const settingsRes = await fetch('/api/settings', { headers: { Authorization: \`Bearer \${token}\` } });
                if (settingsRes.ok) {
                    const data = await settingsRes.json();
                    const map: Record<string, string> = {};
                    data.forEach((s: any) => { map[s.key] = s.value; });
                    setSettings(map);
                }
                showToast(t('sys.str_4532') || '✅ تم توليد المفاتيح والـ CSR بنجاح');
            } else {
                showToast(t('sys.str_4533') || '❌ فشل التوليد');
            }
        } catch (err) { console.error(err); showToast('❌ استثناء أثناء التوليد'); }
        finally { setGeneratingKeys(false); }
    };
`;
    if (!code.includes('handleGenerateKeys = async')) {
       code = code.replace(/const handleFatooraAction = async/, generateFn + '\n    const handleFatooraAction = async');
    }

    // 3. Add Keys Status UI just above ZATCA Onboarding Block
    const keysUi = `
                                {/* Keys Generator Block */}
                                <div style={{ marginTop: '16px', padding: '16px', background: 'var(--bg-card-hover)', borderRadius: '12px', border: '1px solid var(--border)', gridColumn: '1 / -1', marginBottom: '8px' }}>
                                    <h4 style={{ fontSize: '14px', fontWeight: '700', marginBottom: '12px' }}>مفاتيح التشفير والمصادقة (CSR / RSA)</h4>
                                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '12px' }}>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                                            <div style={{
                                                width: '12px', height: '12px', borderRadius: '50%',
                                                background: settings['zatca_private_key'] && settings['zatca_csr_base64'] ? 'var(--success-light)' : 'var(--danger)',
                                                boxShadow: settings['zatca_private_key'] && settings['zatca_csr_base64'] ? '0 0 8px var(--success-light)' : '0 0 8px var(--danger)',
                                            }} />
                                            <span style={{ fontWeight: '600', fontSize: '14px' }}>
                                                {settings['zatca_private_key'] && settings['zatca_csr_base64']
                                                    ? 'المفاتيح متوفرة وجاهزة للربط'
                                                    : 'المفاتيح مفقودة (يجب توليدها قبل الربط)'}
                                            </span>
                                        </div>
                                        <button
                                            className="btn btn-primary btn-sm"
                                            onClick={(e) => { e.preventDefault(); handleGenerateKeys(); }}
                                            disabled={generatingKeys}
                                            style={{ whiteSpace: 'nowrap' }}
                                        >
                                            {generatingKeys ? '⏳ جارٍ التوليد...' : '⚙️ توليد مفاتيح تشفير جديدة (Generate CSR)'}
                                        </button>
                                    </div>
                                    <p style={{ fontSize: '11px', color: 'var(--text-muted)', margin: '8px 0 0' }}>ملاحظة: لابد من "حفظ التغييرات" أولاً لأي بيانات قمت بتعديلها في هذه الشاشة قبل الضغط على التوليد، لضمان صحة التشفير.</p>
                                </div>
`;
    // Insert just before Fatoora Onboarding Block
    if (!code.includes('Keys Generator Block')) {
        code = code.replace(/\{\/\* ZATCA Onboarding Block \*\/\}/, keysUi + '\n                            {/* ZATCA Onboarding Block */}');
    }

    const b64 = Buffer.from(code, 'utf8').toString('base64');
    console.log("Uploading modified page...");
    console.log(await sshCmd(`echo '${b64}' | base64 -d > /www/wwwroot/n11.namainvist.com/src/app/\\(dashboard\\)/company-info/page.tsx`));
    console.log("Rebuilding N11...");
    console.log(await sshCmd(`cd /www/wwwroot/n11.namainvist.com && npm run build && pm2 restart n11`));
    console.log("Done");
})();
