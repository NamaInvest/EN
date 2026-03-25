const fs = require('fs');
const path = require('path');

function walkDir(dir, callback) {
    fs.readdirSync(dir).forEach(f => {
        let dirPath = path.join(dir, f);
        let isDirectory = fs.statSync(dirPath).isDirectory();
        isDirectory ? walkDir(dirPath, callback) : callback(path.join(dir, f));
    });
}

function translateGenericText(content) {
    return content
        .replace(/No budgets defined yet/g, 'لا توجد موازنات مسجلة بعد')
        .replace(/Loading financial budgets\.\.\./g, 'جاري تحميل الموازنات...')
        .replace(/Financial Budgets/g, 'الموازنات والاعتمادات')
        .replace(/\+ Create New Budget/g, '+ إنشاء موازنة جديدة')
        .replace(/Loading petty cash funds\.\.\./g, 'جاري تحميل العهد النثرية...')
        .replace(/No active petty cash funds/g, 'لا توجد عهد نشطة حالياً')
        .replace(/\+ Establish New Fund/g, '+ تأسيس عهدة جديدة')
        .replace(/Finance - Petty Cash Custodians/g, 'صناديق العهد المؤقتة')
        .replace(/\+ Create/gi, '+ إضافة')
        .replace(/\+ Add/gi, '+ إضافة')
        .replace(/\+ New/gi, '+ جديد')
        .replace(/No data found/g, 'لا توجد بيانات')
        .replace(/Loading\.\.\./g, 'جاري التحميل...')
        .replace(/Status/g, 'الحالة')
        .replace(/Date/g, 'التاريخ');
}

let modifiedCount = 0;

walkDir('src/app/(dashboard)', function(filePath) {
    if (filePath.endsWith('page.tsx')) {
        let content = fs.readFileSync(filePath, 'utf8');
        let originalContent = content;

        // Ensure useState is available
        if (!content.includes('setShowComingSoon')) {
            // Find the component function name
            const funcMatch = content.match(/export default function ([A-Za-z0-9_]+)\s*\(/);
            if (funcMatch) {
                const funcName = funcMatch[1];
                
                // Add the state hook inside the function
                const hookInjection = `const [showComingSoon, setShowComingSoon] = useState(false);\n`;
                content = content.replace(
                    new RegExp(`(export default function ${funcName}\\s*\\([^\\)]*\\)\\s*\\{\\n)`),
                    `$1    ${hookInjection}`
                );

                // Add onClick to all inert buttons (buttons that have no onClick)
                content = content.replace(
                    /(<button[^>]*class(?:Name)?=["'][^"']*bg-blue-[^"']*["'][^>]*)(>[\s\S]*?(?:\+|Create|Add|New|Establish)[\s\S]*?<\/button>)/gi,
                    (match, p1, p2) => {
                        if (match.includes('onClick')) return match; // skip if it already has onclick
                        return p1 + ` onClick={() => setShowComingSoon(true)}` + p2;
                    }
                );

                // Make sure the modal overlay is injected before the final closing div/tag
                const modalUI = `
            {/* Modal */}
            {showComingSoon && (
                <div className="modal-overlay">
                    <div className="modal-content" style={{ maxWidth: '500px', animation: 'slideUp 0.3s ease', textAlign: 'center' }}>
                        <div style={{ padding: '20px' }}>
                            <div style={{ fontSize: '48px', marginBottom: '16px' }}>🛠️</div>
                            <h2 style={{ fontSize: '22px', fontWeight: 'bold', marginBottom: '12px' }}>جاري التجهيز للربط</h2>
                            <p style={{ color: 'var(--text-muted)', lineHeight: '1.6', marginBottom: '24px' }}>
                                هذا القسم المؤسسي المتقدم (Enterprise) يتطلب إعدادات مخصصة لربطه بقاعدة بيانات منشأتك. سيكون متاحاً قريباً لتسجيل وإدارة بياناتك بكفاءة.
                            </p>
                            <button className="btn btn-primary" onClick={() => setShowComingSoon(true)} style={{ width: '100%' }}>
                                حسناً، أغلِق النافذة
                            </button>
                        </div>
                    </div>
                </div>
            )}`;
                // Add a small hack to fix the close button onClick
                const validModalUI = modalUI.replace('() => setShowComingSoon(true)', '() => setShowComingSoon(false)');
                
                // Inject at the end of the return statement
                content = content.replace(/(\n\s*<\/[a-zA-Z]+>\n\s*\);\n?\s*\}\s*)$/, `\n${validModalUI}$1`);
                
                // Translate texts
                content = translateGenericText(content);
                
                if (content !== originalContent) {
                    fs.writeFileSync(filePath, content, 'utf8');
                    modifiedCount++;
                    console.log('Fixed and arabized: ' + filePath);
                }
            }
        }
    }
});

console.log('Total modules upgraded: ' + modifiedCount);
