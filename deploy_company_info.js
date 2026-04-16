const fs = require('fs');
const { Client } = require('ssh2');

const code = fs.readFileSync('tmp_company_info.tsx', 'utf8');

const injection = `
                        {/* ZATCA Environment & OTP */}
                        <div className="input-group">
                            <label className="input-label">{t('sys.str_4435')}</label>
                            <select className="input" value={settings['zatca_environment'] || ''} onChange={e => set('zatca_environment', e.target.value)} style={inputStyle('zatca_environment')}>
                                <option value="">حدد بيئة زاتكا</option>
                                <option value="sandbox">Sandbox (Developer)</option>
                                <option value="simulation">Simulation (Pre-Production)</option>
                                <option value="production">Production (Live)</option>
                            </select>
                        </div>
                        <div className="input-group">
                            <label className="input-label">{t('sys.str_4436')}</label>
                            <input className="input" value={settings['zatca_otp'] || ''} onChange={e => set('zatca_otp', e.target.value)} style={inputStyle('zatca_otp')} placeholder="e.g. 123456" />
                        </div>
`;

// Insert the injection directly into the grid-2 of ZATCA section (around line 230)
const insertTarget = `<div className="grid-2">
                        {[`;

if (code.includes(insertTarget)) {
    // Find the LAST occurrence of `<div className="grid-2">` which is section 3.
    const sections = code.split('<div className="grid-2">');
    const lastSection = sections[sections.length - 1];
    sections[sections.length - 1] = injection + '\n                        {[' + lastSection.substring(lastSection.indexOf('{[' ) + 2);
    
    let newCode = sections.join('<div className="grid-2">');
    fs.writeFileSync('tmp_company_info_modified.tsx', newCode);
    console.log("Successfully modified tmp_company_info_modified.tsx");
} else {
    console.log("Could not find insertion target");
}

function sshDeploy() {
  return new Promise(r => {
    const content = fs.readFileSync('tmp_company_info_modified.tsx', 'utf8');
    const b64 = Buffer.from(content, 'utf8').toString('base64');
    
    const c = new Client();
    c.on('ready', () => {
      c.exec(`echo '${b64}' | base64 -d > /www/wwwroot/n11.namainvist.com/src/app/\\(dashboard\\)/company-info/page.tsx && cd /www/wwwroot/n11.namainvist.com && npm run build && pm2 restart n11`, (e, s) => {
        let out = '';
        s.on('data', d => out+=d);
        s.stderr.on('data', d => out+=d);
        s.on('close', () => {
            console.log(out.trim());
            c.end(); r();
        });
      });
    }).connect({ host:'46.4.188.170', port:22, username:'root', password:'_ee4SWbxLVfH9b' });
  });
}

sshDeploy();
