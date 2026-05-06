// Bulk translate v3 dashboard pages — same template, different KPIs.
const fs = require('fs');
const path = require('path');

// Common replacements (apply to all v3 files)
const COMMON = [
    // Add RTL direction
    [/className="max-w-7xl mx-auto space-y-6 p-6"(?!\s+dir)/g, 'className="max-w-7xl mx-auto space-y-6 p-6" dir="rtl"'],
    // Common labels
    [/Export Report/g, 'تصدير التقرير'],
    [/Module Settings/g, 'إعدادات الموديول'],
    [/from last month/g, 'عن الشهر الماضي'],
    [/Core Process Analytics/g, 'تحليلات العمليات الأساسية'],
    [/Live Activity Feed/g, 'سجل النشاط المباشر'],
    [/System Event/g, 'حدث النظام'],
    [/Processed 2 mins ago via V3 Engine/g, 'معالجة منذ دقيقتين عبر محرك V3'],
    // RTL margin fix
    [/<TrendingUp className="w-3 h-3 mr-1"/g, '<TrendingUp className="w-3 h-3 ml-1"'],
    // Module-specific live telemetry sentence (rough — keep readable Arabic)
    [/Live telemetry from the V3 EventBus will render operational charts here based on the specific needs of ([A-Za-z &]+)\./g,
     'ستُعرض المخططات التشغيلية هنا اعتماداً على V3 EventBus حسب احتياجات قطاع $1.'],
];

// Per-file unique replacements: { filePath: [[en, ar], ...] }
const PER_FILE = {
    'src/app/(dashboard)/v3/distribution/page.tsx': [
        ['Wholesale & Distribution V3', 'البيع بالجملة والتوزيع V3'],
        ['Route Accounting, B2B Credit Limits, WMS with Bin Locations.', 'محاسبة المسارات، حدود الائتمان B2B، WMS بمواقع الصناديق'],
        ['Order Fill Rate', 'نسبة تلبية الطلبات'],
        ['Order Cycle Time', 'مدة دورة الطلب'],
        ['Inventory Turnover', 'دوران المخزون'],
        ['GMROI', 'العائد على الاستثمار في البضاعة'],
        ['Wholesale & Distribution', 'البيع بالجملة والتوزيع'],
    ],
    'src/app/(dashboard)/v3/manufacturing/page.tsx': [
        ['Advanced Manufacturing V3', 'التصنيع المتقدم V3'],
        ['Multi-level BOMs, MRP Engine, Routing & WIP.', 'قوائم مواد متعددة المستويات، MRP، المسارات، WIP'],
        ['OEE', 'الكفاءة الإجمالية للمعدات (OEE)'],
        ['Scrap Rate', 'نسبة التالف'],
        ['Cycle Time', 'مدة الدورة'],
        ['Yield Variance', 'انحراف العائد'],
        ['Advanced Manufacturing', 'التصنيع المتقدم'],
    ],
    'src/app/(dashboard)/v3/realestate/page.tsx': [
        ['Real Estate & Property V3', 'العقارات والأملاك V3'],
        ['Unit Management, Lease Contracts, Maintenance.', 'إدارة الوحدات، عقود الإيجار، الصيانة'],
        ['Occupancy Rate', 'نسبة الإشغال'],
        ['Rental Yield', 'العائد الإيجاري'],
        ['Maintenance Cost/SqFt', 'تكلفة الصيانة/م²'],
        ['Avg Lease Term', 'متوسط مدة الإيجار'],
        ['Real Estate & Property', 'العقارات والأملاك'],
    ],
};

function processFile(relPath, common, perFile) {
    const full = path.join(__dirname, relPath);
    if (!fs.existsSync(full)) {
        console.log(`  ⚠️  ${relPath} not found`);
        return false;
    }
    let content = fs.readFileSync(full, 'utf8');
    const original = content;

    // Apply common
    for (const [re, replacement] of common) {
        content = content.replace(re, replacement);
    }
    // Apply per-file
    if (perFile) {
        for (const [en, ar] of perFile) {
            content = content.split(en).join(ar);
        }
    }

    if (content !== original) {
        fs.writeFileSync(full, content);
        console.log(`  ✅ ${relPath}`);
        return true;
    } else {
        console.log(`  ⏭  ${relPath} (no changes)`);
        return false;
    }
}

console.log('========== TRANSLATING V3 DASHBOARDS ==========\n');
let count = 0;
for (const [file, perFile] of Object.entries(PER_FILE)) {
    if (processFile(file, COMMON, perFile)) count++;
}
console.log(`\nTranslated ${count} v3 files.`);
