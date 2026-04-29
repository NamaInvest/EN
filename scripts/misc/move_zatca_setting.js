const { Client } = require('ssh2');

function ssh(cmd) {
  return new Promise(r => {
    const c = new Client(); let out = '';
    const t = setTimeout(() => { c.end(); r(out + '[TIMEOUT]'); }, 120000);
    c.on('ready', () => c.exec(cmd, (e, s) => {
      if (e) { clearTimeout(t); r('[ERR]'); return; }
      s.on('data', d => out += d); s.stderr.on('data', d => out += d);
      s.on('close', () => { clearTimeout(t); c.end(); r(out.trim()); });
    })).connect({ host:'46.4.188.170', port:22, username:'root', password:'_ee4SWbxLVfH9b' });
  });
}

const N11 = '/www/wwwroot/n11.namainvist.com';

async function uploadFile(path, content) {
  const b64 = Buffer.from(content, 'utf8').toString('base64');
  const r = await ssh(`echo '${b64}' | base64 -d > '${path}' && echo OK`);
  return r.includes('OK');
}

(async () => {
    console.log("Reading settings/page.tsx...");
    let settingsCode = await ssh(`cat ${N11}/src/app/\\(dashboard\\)/settings/page.tsx`);
    
    // Remove the ZATCA block from settings/page.tsx
    const zatcaBlockRegex = /\{\s*title:\s*t\('sys\.str_4434'\),\s*keys:\s*\[[\s\S]*?\]\s*\},/g;
    settingsCode = settingsCode.replace(zatcaBlockRegex, '');
    
    console.log("Reading company-info/page.tsx...");
    let companyCode = await ssh(`cat ${N11}/src/app/\\(dashboard\\)/company-info/page.tsx`);
    
    // Add the Zatca section to company-info
    // In company-info we usually have a grid of inputs.
    // Let's find where the settings grid is rendered.
    const addZatcaStr = `
            {/* ZATCA Configuration */}
            <div className="col-span-1 md:col-span-2 bg-slate-50 dark:bg-slate-800/50 p-4 rounded-xl border border-slate-200 dark:border-slate-700/50 mt-4">
                <h3 className="text-lg font-bold text-slate-800 dark:text-white mb-4">{t('sys.str_4434')}</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                        <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">{t('sys.str_4435')}</label>
                        <select
                            className="w-full bg-white dark:bg-[#1a2332] border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white rounded-lg px-4 py-2"
                            value={settings['zatca_environment'] || ''}
                            onChange={(e) => setSettings({ ...settings, zatca_environment: e.target.value })}
                        >
                            <option value="">{t('sys.str_select_environment') || 'حدد البيئة'}</option>
                            <option value="sandbox">Sandbox (Developer)</option>
                            <option value="simulation">Simulation (Pre-Production)</option>
                            <option value="production">Production</option>
                        </select>
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">{t('sys.str_4436')}</label>
                        <input
                            type="text"
                            className="w-full bg-white dark:bg-[#1a2332] border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white rounded-lg px-4 py-2 placeholder-slate-400"
                            value={settings['zatca_otp'] || ''}
                            onChange={(e) => setSettings({ ...settings, zatca_otp: e.target.value })}
                            placeholder="e.g. 123456"
                        />
                    </div>
                </div>
            </div>`;
    
    // Insert before the Save button container
    if (companyCode.includes('</div>\n            {/* Actions */}')) {
         companyCode = companyCode.replace('</div>\n            {/* Actions */}', addZatcaStr + '\n        </div>\n            {/* Actions */}');
    } else if (companyCode.includes('</form>')) {
         // rough fallback
         companyCode = companyCode.replace('</form>', addZatcaStr + '\n</form>');
    } else {
        console.log("Could not find insertion point in company-info/page.tsx");
    }
    
    console.log("Uploading modified files...");
    await uploadFile(`${N11}/src/app/(dashboard)/settings/page.tsx`, settingsCode);
    await uploadFile(`${N11}/src/app/(dashboard)/company-info/page.tsx`, companyCode);
    
    console.log("Rebuilding N11...");
    console.log(await ssh(`cd ${N11} && npm run build 2>&1 | tail -25`));
    
    console.log("Restarting PM2...");
    console.log(await ssh(`pm2 restart n11`));
    
    console.log("Done.");
})();
