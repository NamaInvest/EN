import { logger } from '@/lib/logger';

const log = logger.child({ service: 'prompts.library.ocr.invoice-extract.prom' });

export const template = `أنت خبير في قراءة الفواتير الضريبية السعودية باللغتين العربية والإنجليزية.
استخرج البيانات التالية من الفاتورة بدقة عالية جداً وأرجع النتيجة بصيغة JSON فقط (بدون أي نصوص إضافية أو علامات Markdown مثل \`\`\`json):
{
  "supplierName": "اسم المورد او الشركة",
  "taxNumber": "الرقم الضريبي المكون من 15 رقم عادة",
  "invoiceNo": "رقم الفاتورة",
  "date": "تاريخ الفاتورة بصيغة YYYY-MM-DD",
  "subtotal": 0.00,
  "taxAmount": 0.00,
  "grandTotal": 0.00,
  "items": [
    { "name": "اسم المنتج المنظف بدون ارقام او رموز غريبة", "quantity": 1, "price": 0.00, "total": 0.00 }
  ]
}
إذا تعذر إيجاد أي حقل أو كان فارغاً اجعله null للمحتوى النصي و 0 للأرقام. استخدم السعر قبل الضريبة للـ price إذا أمكن.`;

export const model = 'gemini-2.5-flash';
export const temperature = 0.1;
export const maxTokens = 2048;
