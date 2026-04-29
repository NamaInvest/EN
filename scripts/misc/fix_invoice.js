const fs = require('fs');
const p = 'src/app/invoice/[id]/page.tsx';
let code = fs.readFileSync(p, 'utf8');

// This is a server component using a React hook (useTranslation) - that's illegal.
// Fix: replace useTranslation with a hardcoded translation map (server-side).

// Remove the useTranslation import and replace with a local dictionary
code = code.replace(
    /import \{ useTranslation \} from "[^"]+";?\n/g,
    ''
);
code = code.replace(
    /import \{ useTranslation \} from '[^']+';?\n/g,
    ''
);

// Remove const { t } = useTranslation();
code = code.replace(/\s*const \{ t \} = useTranslation\(\);\s*\n/g, '\n');

// Add a local t function right inside the async function, before the data fetching
// Find the beginning of the function body
const insertPoint = code.indexOf('const { id } = await params;');
if (insertPoint === -1) {
    console.log('Could not find insertion point');
    process.exit(1);
}

const localT = `    // Local translations for server component
    const translations: Record<string, string> = {
        'sys.str_1576': 'فاتورة ضريبية',
        'sys.str_9': 'الرقم',
        'sys.str_1577': 'رقم الفاتورة',
        'sys.str_56': 'المبلغ',
        'sys.str_84': 'المجموع',
        'sys.str_113': 'التاريخ',
        'sys.str_4598': 'الكمية',
        'sys.str_752': 'الوحدة',
        'sys.str_4599': 'سعر الوحدة',
        'stock.str_1485': 'الوصف',
        'sys.str_801': 'ضريبة القيمة المضافة',
        'sys.str_64': 'المنتج',
        'sys.str_947': 'الرقم الضريبي',
        'sys.str_1579': 'المجموع قبل الضريبة',
        'sys.str_68': 'ريال سعودي',
        'sys.str_69': 'ريال سعودي',
        'sys.str_1580': 'ضريبة القيمة المضافة (15%)',
        'sys.str_1581': 'الإجمالي شامل الضريبة',
        'sys.str_1582': 'شكراً لتعاملكم معنا',
    };
    const t = (key: string) => translations[key] ?? key;
`;

code = code.substring(0, insertPoint) + localT + '\n    ' + code.substring(insertPoint);

fs.writeFileSync(p, code);
console.log('Fixed invoice/[id]/page.tsx - replaced hook with local dict');
