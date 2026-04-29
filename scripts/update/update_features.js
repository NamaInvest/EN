const fs = require('fs');

const features = [
  {
    "module": "المخزون (Inventory)",
    "key": "products__________________________",
    "label": "حذف كل التصنيفات (حذف عنصر)"
  },
  {
    "module": "المخزون (Inventory)",
    "key": "delete_all_products",
    "label": "حذف كل المنتجات (حذف عنصر)"
  },
  {
    "module": "المخزون (Inventory)",
    "key": "reset_stock",
    "label": "🔄 تصفير المخزون"
  },
  {
    "module": "الإعدادات (Settings)",
    "key": "settings_______________________________________________________",
    "label": "فرمتة وتهيئة النظام بالكامل (الرجوع لضبط المصنع) (تفاعل)"
  }
];

fs.writeFileSync('src/lib/featuresList.json', JSON.stringify(features, null, 2), 'utf8');
console.log("featuresList.json updated successfully.");
