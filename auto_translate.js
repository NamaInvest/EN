const fs = require('fs');
const path = require('path');

// 1. Load dictionaries
const enDict = JSON.parse(fs.readFileSync('src/locales/en.json', 'utf8'));
const arDict = JSON.parse(fs.readFileSync('src/locales/ar.json', 'utf8'));

const enToAr = {
    "Actions": "إجراءات",
    "Status": "الحالة",
    "Search": "بحث",
    "Create": "إنشاء",
    "Edit": "تعديل",
    "Delete": "حذف",
    "Cancel": "إلغاء",
    "Save": "حفظ",
    "Submit": "إرسال",
    "Next": "التالي",
    "Previous": "السابق",
    "Dashboard": "لوحة التحكم",
    "Details": "التفاصيل",
    "Active": "نشط",
    "Inactive": "غير نشط",
    "Name": "الاسم",
    "Date": "التاريخ",
    "Amount": "المبلغ",
    "Total": "الإجمالي",
    "Type": "النوع",
    "Settings": "الإعدادات",
    "Export": "تصدير",
    "Import": "استيراد",
    "Print": "طباعة",
    "View": "عرض"
};

// Build map from locales
for (const key of Object.keys(enDict)) {
    if (typeof enDict[key] === 'string' && typeof arDict[key] === 'string') {
        enToAr[enDict[key].trim()] = arDict[key].trim();
        enToAr[enDict[key].toLowerCase().trim()] = arDict[key].trim();
    }
}

function walk(dir) {
    let results = [];
    const list = fs.readdirSync(dir);
    list.forEach(file => {
        const fullPath = path.join(dir, file);
        if (fs.statSync(fullPath).isDirectory()) {
            results = results.concat(walk(fullPath));
        } else if (fullPath.endsWith('.tsx')) {
            results.push(fullPath);
        }
    });
    return results;
}

const files = walk('src/app/(dashboard)');
let fixedCount = 0;

files.forEach(file => {
    let content = fs.readFileSync(file, 'utf8');
    let modified = false;

    // Check if file has useTranslation
    if (!content.includes('useTranslation')) {
        return; // Skip if no i18n context at all to avoid breaking hooks
    }

    // Ensure _t helper exists
    if (!content.includes('const _t =')) {
        content = content.replace(
            /const\s+{\s*lang\s*(?:,\s*t)?\s*}\s*=\s*useTranslation\(\);/,
            "const { lang } = useTranslation();\n  const _t = (ar: string, en: string) => lang === 'ar' ? ar : en;"
        );
    }

    // Regex to match > English Text < or >English Text<
    // Only matching strings that start with an uppercase letter and contain letters/spaces
    const textRegex = />\s*([A-Z][a-zA-Z\s\(\)&]{2,})\s*</g;
    
    content = content.replace(textRegex, (match, p1) => {
        const text = p1.trim();
        // Ignore very long sentences or purely uppercase like ID
        if (text.length > 50 || text === text.toUpperCase()) return match;

        let arText = enToAr[text] || enToAr[text.toLowerCase()];
        
        // Custom fallbacks for common dashboard words if exact match fails
        if (!arText) {
            if (text.includes('Dashboard')) arText = text.replace('Dashboard', 'لوحة التحكم');
            else if (text.includes('Create')) arText = text.replace('Create', 'إنشاء');
            else if (text.includes('Manage')) arText = text.replace('Manage', 'إدارة');
        }

        if (arText && arText !== text) {
            modified = true;
            return `>{_t('${arText.replace(/'/g, "\\'")}', '${text.replace(/'/g, "\\'")}')}<`;
        }
        
        return match;
    });

    if (modified) {
        fs.writeFileSync(file, content, 'utf8');
        fixedCount++;
        console.log(`[Translated] ${file}`);
    }
});

console.log(`\n🎉 Successfully translated UI elements in ${fixedCount} files!`);
