const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, 'src/lib/featuresList.json');
let content = fs.readFileSync(filePath, 'utf8');

// The replacement map based on the exact garbled strings found
const replacements = {
    "saving ? 'âڈ³ ط¬ط§ط±ظچ ط§ظ„حفظ...' : 'ًں’¾ حفظ ط§ظ„طھط؛ظٹظٹط±ط§طھ'": "saving ? '⏳ جارٍ الحفظ...' : '💾 حفظ التغييرات'",
    "savingUnit ? 'âڈ³' : 'â‍• إضافة'": "savingUnit ? '⏳' : '➕ إضافة'",
    "âœ• (حذف عنصر)": "✖ (حذف عنصر)",
    "âœ• (تفاعل)": "✖ (تفاعل)",
    "+ طµظ†ظپ ظٹط¯ظˆظٹ (تفاعل)": "+ صنف يدوي (تفاعل)",
    "âœ… تحويل ظ„فاتورة (تفاعل)": "✅ تحويل لفاتورة (تفاعل)",
    "converting ? 'âڈ³ جاري ط§ظ„تحويل...' : 'âœ… ط¥ظ†ط´ط§ط، الفاتورة'": "converting ? '⏳ جاري التحويل...' : '✅ إنشاء الفاتورة'",
    "â›” Global Access Suspension": "⛔ Global Access Suspension",
    "ًںژ¨ (فتح نافذة)": "🎨 (فتح نافذة)",
    "ظ†ظ‚ط·ط© ط§ظ„ط¨ظٹط¹ (POS)": "نقطة البيع (POS)",
    "ظ…ظƒظˆظ†ط§طھ ظ…ط´طھط±ظƒط© (Shared)": "مكونات مشتركة (Shared)",
    "/* The actual panel â€” opens DOWNWARD */": "/* The actual panel — opens DOWNWARD */"
};

let replaceCount = 0;
for (const [garbled, fixed] of Object.entries(replacements)) {
    const regex = new RegExp(garbled.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'g');
    const matches = content.match(regex);
    if (matches) {
        replaceCount += matches.length;
        content = content.replace(regex, fixed);
    }
}

fs.writeFileSync(filePath, content, 'utf8');
console.log(`Replaced ${replaceCount} instances of garbled text.`);
