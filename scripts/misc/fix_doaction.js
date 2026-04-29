const fs = require('fs');
let c = fs.readFileSync('src/app/ice/page.tsx', 'utf8');

// Fix 1: Replace the doAction function (lines ~214-233)
const doActionOld = `    const doAction = async (action: string, extra: Record<string, any> = {}) => {
        if (!selected || busy) return;
        setBusy(action);
        try {
            const res = await fetch('/api/ice/toggle', {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ subdomain: selected.subdomain, action, ...extra }),
            });
            const data = await res.json();
            if (data.success) {
                await fetchTenants();
                // Re-sync selected
                setSelected(prev => prev ? { ...prev, ...extra } : prev);
            } else {`;

const doActionNew = `    const doAction = async (action: string, extra: Record<string, any> = {}) => {
        if (!selected || busy) return;
        setBusy(action);
        try {
            const isDelete = action === 'delete';
            const res = await fetch('/api/ice/toggle', {
                method: isDelete ? 'DELETE' : 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ subdomain: selected.subdomain, action, ...extra }),
            });
            const data = await res.json();
            if (data.success) {
                await fetchTenants();
                if (isDelete) {
                    setSelected(null);
                    alert('\u2705 تم حذف الحساب بنجاح');
                } else {
                    setSelected(prev => prev ? { ...prev, ...extra } : prev);
                }
            } else {`;

if (c.includes(doActionOld)) {
  c = c.replace(doActionOld, doActionNew);
  console.log('Fixed doAction function');
} else {
  console.log('doAction not found by exact match, trying partial...');
  // Try partial match
  const idx = c.indexOf('const doAction = async');
  if (idx > -1) {
    // Find the end of this function
    const endPattern = "finally { setBusy(''); }\n    };";
    const endIdx = c.indexOf(endPattern, idx);
    if (endIdx > -1) {
      const oldFunc = c.substring(idx, endIdx + endPattern.length);
      const newFunc = `const doAction = async (action: string, extra: Record<string, any> = {}) => {
        if (!selected || busy) return;
        setBusy(action);
        try {
            const isDelete = action === 'delete';
            const res = await fetch('/api/ice/toggle', {
                method: isDelete ? 'DELETE' : 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ subdomain: selected.subdomain, action, ...extra }),
            });
            const data = await res.json();
            if (data.success) {
                await fetchTenants();
                if (isDelete) {
                    setSelected(null);
                    alert('\u2705 تم حذف الحساب بنجاح');
                } else {
                    setSelected(prev => prev ? { ...prev, ...extra } : prev);
                }
            } else {
                alert('\u26a0\ufe0f خطأ: ' + (data.error || 'فشل الإجراء'));
            }
        } catch { alert('\u26a0\ufe0f خطأ في الاتصال بالخادم'); }
        finally { setBusy(''); }
    };`;
      c = c.substring(0, idx) + newFunc + c.substring(endIdx + endPattern.length);
      console.log('Fixed doAction via partial match');
    }
  }
}

// Fix 2: Also fix the catch in toggleSection if it's garbled
const toggleCatchGarbled = c.match(/catch \{ alert\('[^']*[\u0637\u0638][^']*'\)/g);
if (toggleCatchGarbled) {
  for (const match of toggleCatchGarbled) {
    c = c.replace(match, "catch { alert('\u26a0\ufe0f خطأ في الاتصال بالخادم')");
    console.log('Fixed garbled catch');
  }
}

fs.writeFileSync('src/app/ice/page.tsx', c, 'utf8');

// Verify
const remaining = (c.match(/[\u0637\u0638][\u00a0-\u00ff]/g) || []).length;
console.log('Remaining garbled pairs:', remaining);
console.log('Done!');
