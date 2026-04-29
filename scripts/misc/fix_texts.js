const fs = require('fs');
const path = require('path');

const replacements = {
    'Loading contracts...': 'جاري تحميل العقود...',
    'No lease contracts found.': 'لا توجد عقود مسجلة.',
    'No rent installments found.': 'لا توجد أقساط مسجلة.',
    'Loading rent installments...': 'جاري تحميل الأقساط...',
    'Real Estate - Lease Contracts': 'إدارة الأملاك - عقود الإيجار',
    'New Contract': 'عقد جديد',
    'Contract #': 'رقم العقد',
    'Unknown': 'غير معروف',
    'Loading commission rules...': 'جاري تحميل القواعد...',
    'No commission rules defined.': 'لا توجد قواعد عمولات مسجلة.',
    'New Appraisal': 'تقييم جديد',
    'Submit Appraisal': 'حفظ التقييم'
};

function walkDir(dir, callback) {
    fs.readdirSync(dir).forEach(f => {
        const dirPath = path.join(dir, f);
        if (fs.statSync(dirPath).isDirectory()) walkDir(dirPath, callback);
        else if (dirPath.endsWith('.tsx')) callback(dirPath);
    });
}

walkDir('src/app/(dashboard)', (filePath) => {
    let content = fs.readFileSync(filePath, 'utf8');
    let newContent = content;
    
    for (const [eng, ar] of Object.entries(replacements)) {
        const escaped = eng.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&');
        newContent = newContent.replace(new RegExp('>' + escaped + '<', 'g'), '>' + ar + '<');
        newContent = newContent.replace(new RegExp('>' + escaped + ' <', 'g'), '>' + ar + ' <');
        newContent = newContent.replace(new RegExp('> ' + escaped + '<', 'g'), '> ' + ar + '<');
        newContent = newContent.replace(new RegExp(`'${escaped}'`, 'g'), `'${ar}'`);
        newContent = newContent.replace(new RegExp(`"${escaped}"`, 'g'), `"${ar}"`);
        newContent = newContent.replace(new RegExp('🏢 ' + escaped, 'g'), '🏢 ' + ar);
        newContent = newContent.replace(new RegExp('\\+ ' + escaped, 'g'), '+ ' + ar);
    }

    if (content !== newContent) {
        fs.writeFileSync(filePath, newContent, 'utf8');
        console.log('Fixed translations in:', filePath);
    }
});
