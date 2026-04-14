const fs = require('fs');
const path = require('path');

const cssFile = path.join('d:\\namasoft9-3-main\\src\\app\\globals.css');
let content = fs.readFileSync(cssFile, 'utf8');

const whiteTheme = `
/* ================= THEME ENGINE: PURE WHITE (N11) ================= */
:root.theme-white {
  --primary: #1E293B;
  --primary-light: #334155;
  --primary-dark: #0F172A;
  --success: #16A34A;
  --success-light: #22C55E;
  --danger: #DC2626;
  --danger-light: #EF4444;
  --warning: #D97706;
  --warning-light: #F59E0B;
  --info: #2563EB;
  --info-light: #3B82F6;
  --bg-dark: #FFFFFF;
  --bg-darker: #FFFFFF;
  --bg-card: #FFFFFF;
  --bg-card-hover: #F8FAFC;
  --bg-sidebar: #FFFFFF;
  --text: #000000;
  --text-secondary: #1E293B;
  --text-muted: #475569;
  --border: #CBD5E1;
  --border-light: #94A3B8;
  --glass: rgba(255, 255, 255, 0.98);
  --glass-border: rgba(0, 0, 0, 0.08);
  --shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
  --shadow-lg: 0 8px 24px rgba(0, 0, 0, 0.12);
  --gradient-primary: linear-gradient(135deg, #1E293B 0%, #334155 100%);
  --gradient-success: linear-gradient(135deg, #16A34A 0%, #22C55E 100%);
  --gradient-danger: linear-gradient(135deg, #DC2626 0%, #EF4444 100%);
  --gradient-warning: linear-gradient(135deg, #D97706 0%, #F59E0B 100%);
  --gradient-info: linear-gradient(135deg, #2563EB 0%, #3B82F6 100%);
  --gradient-purple: linear-gradient(135deg, #7C3AED 0%, #8B5CF6 100%);
  --gradient-cyan: linear-gradient(135deg, #0891B2 0%, #06B6D4 100%);
}
:root.theme-white body { background: #FFFFFF !important; color: #000000 !important; }
:root.theme-white body::before { display: none; }
:root.theme-white .page-header { background: rgba(255,255,255,0.95) !important; border-bottom: 1px solid #CBD5E1; }
:root.theme-white .sidebar { border-left: 1px solid #CBD5E1; box-shadow: -2px 0 8px rgba(0,0,0,0.06); }
:root.theme-white .input { background: #FFFFFF; border-color: #CBD5E1; color: #000000; }
:root.theme-white select.input { color: #000000 !important; }
:root.theme-white ::-webkit-scrollbar-thumb { background: rgba(0,0,0,0.15); }
:root.theme-white ::-webkit-scrollbar-thumb:hover { background: rgba(0,0,0,0.25); }

`;

const marker = '/* ================= THEME ENGINE: LUXURY WEALTH ================= */';

if (content.includes('theme-white')) {
    console.log('⚠️  theme-white موجود مسبقاً!');
} else if (content.includes(marker)) {
    const newContent = content.replace(marker, whiteTheme + marker);
    fs.writeFileSync(cssFile, newContent, 'utf8');
    console.log('✅ تم إضافة theme-white بنجاح!');
    console.log(`📄 حجم الملف الجديد: ${(fs.statSync(cssFile).size / 1024).toFixed(1)} KB`);
} else {
    console.log('❌ ما وجدت المكان الصحيح للإضافة');
}
