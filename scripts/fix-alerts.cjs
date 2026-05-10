// Fix remaining alert() calls in menu and vendor-rfq pages
const fs = require('fs');
const path = require('path');

// ── menu/[tableId]/page.tsx ────────────────────────────────────────────
const menuPath = path.join('src', 'app', 'menu', '[tableId]', 'page.tsx');
if (fs.existsSync(menuPath)) {
  let c = fs.readFileSync(menuPath, 'utf8');
  if (!c.includes('errorMsg')) {
    c = c.replace('const [cart, setCart]', 'const [errorMsg, setErrorMsg] = useState("");\n  const [cart, setCart]');
  }
  c = c
    .split("alert(data.error || '\u062d\u062f\u062b \u062e\u0637\u0623');")
    .join("setErrorMsg(data.error || '\u062d\u062f\u062b \u062e\u0637\u0623'); setTimeout(() => setErrorMsg(''), 5000);")
    .split("alert('\u062d\u062f\u062b \u062e\u0637\u0623 \u0641\u064a \u0627\u0644\u0627\u062a\u0635\u0627\u0644');")
    .join("setErrorMsg('\u062d\u062f\u062b \u062e\u0637\u0623 \u0641\u064a \u0627\u0644\u0627\u062a\u0635\u0627\u0644'); setTimeout(() => setErrorMsg(''), 5000);");
  fs.writeFileSync(menuPath, c, 'utf8');
  console.log('  ✓ menu/[tableId]/page.tsx fixed');
} else {
  console.log('  SKIP: menu/[tableId]/page.tsx not found');
}

// ── portal/vendor/rfq/[id]/page.tsx ───────────────────────────────────
const rfqPath = path.join('src', 'app', 'portal', 'vendor', 'rfq', '[id]', 'page.tsx');
if (fs.existsSync(rfqPath)) {
  let c = fs.readFileSync(rfqPath, 'utf8');
  if (!c.includes('errMsg')) {
    c = c.replace('const [loading', 'const [errMsg, setErrMsg] = useState("");\n  const [loading');
  }
  c = c
    .split("if (!token) return alert('Token is missing');")
    .join("if (!token) { setErrMsg('Token is missing'); return; }")
    .split("alert('\u062a\u0645 \u062a\u0642\u062f\u064a\u0645 \u0639\u0631\u0636 \u0627\u0644\u0633\u0639\u0631 \u0628\u0646\u062c\u0627\u062d!');")
    .join("setErrMsg('\u2705 \u062a\u0645 \u062a\u0642\u062f\u064a\u0645 \u0639\u0631\u0636 \u0627\u0644\u0633\u0639\u0631 \u0628\u0646\u062c\u0627\u062d!'); setTimeout(() => setErrMsg(''), 5000);");
  // handle: alert(`خطأ: ${data.error}`);
  c = c.replace(/alert\(`خطأ: \$\{data\.error\}`\);/g,
    'setErrMsg(`خطأ: ${data.error}`); setTimeout(() => setErrMsg(""), 5000);');
  fs.writeFileSync(rfqPath, c, 'utf8');
  console.log('  ✓ portal/vendor/rfq/[id]/page.tsx fixed');
} else {
  console.log('  SKIP: portal/vendor/rfq/[id]/page.tsx not found');
}

console.log('\nDone!');
