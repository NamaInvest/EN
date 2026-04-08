const fs = require('fs');

const map = {
    'sys.str_4045': '📄 جديدة (F2)',
    'sys.str_4046': '🚫 إلغاء (F4)',
    'sys.str_4047': '⏸️ تعليق',
    'sys.str_4048': '▶️ استرجاع',
    'sys.str_4049': '📋 الفواتير (F8)',
    'sys.str_4050': '🔙 مرتجعات المبيعات (F9)',
    'sys.str_4051': 'الفواتير السابقة',
    'sys.str_4052': 'رقم وتاريخ',
    'sys.str_4053': 'العميل',
    'sys.str_4054': 'تأكيد',
    'sys.str_4055': 'إغلاق',
    'sys.str_4056': 'الدفع عبر مدى',
    'sys.str_4057': 'العميل: ',
    'sys.str_4058': 'استرجاع الفاتورة',
    'sys.str_4059': 'الدفع عبر بطاقة مدى',
    'sys.str_4060': 'يرجى تمرير البطاقة على جهاز الدفع...',
    'sys.str_4061': 'في انتظار تأكيد عملية الدفع من جهاز مدى',
    'sys.str_4062': 'تمت عملية الدفع بنجاح!',
    'sys.str_4063': 'جاري إكمال الطلب...',
    'sys.str_4064': 'الرجاء إدخال الكمية بشكل صحيح',
    'sys.str_4065': 'في انتظار موافقة العميل على الطلب من هاتفه...',
    'sys.str_4066': 'تم تاكيد العملية بنجاح! جاري اكمال الطلب...',
    'sys.str_4070': 'دفع مقسوم',
    'sys.str_4071': 'تابي',
    'sys.str_4072': 'تمارا',
    'sys.str_4073': 'نقدي',
    'sys.str_4074': 'مدى',
    'sys.str_4075': 'تحويل',
    'sys.str_4081': 'نقدي (عام)'
};

['src/app/pos/page.tsx', 'src/app/restaurant-pos/page.tsx', 'src/app/(dashboard)/sales/page.tsx'].forEach(p => {
    if (!fs.existsSync(p)) return;
    let code = fs.readFileSync(p, 'utf8');
    for (const [key, val] of Object.entries(map)) {
        code = code.replace(new RegExp(`t\\('${key}'\\)`, 'g'), `"${val}"`);
    }
    fs.writeFileSync(p, code);
});
console.log('Done mapping.');
