;!function(){try { var e="undefined"!=typeof globalThis?globalThis:"undefined"!=typeof global?global:"undefined"!=typeof window?window:"undefined"!=typeof self?self:{},n=(new e.Error).stack;n&&((e._debugIds|| (e._debugIds={}))[n]="4a2dffa1-4767-07d7-fa89-1b1ebcd7260d")}catch(e){}}();
module.exports=[10343,e=>{"use strict";var t=e.i(698043);async function a(){let e=await t.default.setting.findUnique({where:{key:"telegram_bot_token"}});return e?.value||process.env.TELEGRAM_BOT_TOKEN||""}async function n(){let e=await t.default.setting.findUnique({where:{key:"gemini_api_key"}});return e?.value||process.env.GEMINI_API_KEY||""}async function i(){let e=await a();return`https://api.telegram.org/bot${e}`}async function r(e,t,a="HTML"){let n=await i();await fetch(`${n}/sendMessage`,{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({chat_id:e,text:t,parse_mode:a})})}function s(e){let t=e;for(let[e,a]of Object.entries({"٠":"0","١":"1","٢":"2","٣":"3","٤":"4","٥":"5","٦":"6","٧":"7","٨":"8","٩":"9"}))t=t.replace(RegExp(e,"g"),a);let a={صفر:0,واحد:1,اثنين:2,ثلاث:3,اربع:4,أربع:4,خمس:5,ست:6,سبع:7,ثمان:8,تسع:9,عشر:10,عشرين:20,ثلاثين:30,اربعين:40,أربعين:40,خمسين:50,ستين:60,سبعين:70,ثمانين:80,تسعين:90,مية:100,مئة:100,ميتين:200,مئتين:200,ثلاثمية:300,اربعمية:400,خمسمية:500,الف:1e3,ألف:1e3,الفين:2e3,ألفين:2e3};for(let[e,n]of Object.entries(a))if(t.includes(e)){if(t.includes("الاف")||t.includes("آلاف")||t.includes("الف")){let e=t.split(/الاف|آلاف|ألاف/)[0].trim();for(let[t,n]of Object.entries(a))if(e.includes(t)&&n<100)return 1e3*n}return n}let n=t.match(/[\d,]+\.?\d*/);return n?parseFloat(n[0].replace(/,/g,"")):0}function c(e){return e.toLocaleString("en-SA",{minimumFractionDigits:2,maximumFractionDigits:2})}async function u(){let e=new Date;e.setHours(0,0,0,0);let a=await t.default.salesInvoice.findMany({where:{date:{gte:e}}}),n=a.reduce((e,t)=>e+(t.total||0),0);return`📊 <b>مبيعات اليوم</b>

📄 عدد الفواتير: <b>${a.length}</b>
💰 إجمالي المبيعات: <b>${c(n)} ر.س</b>`}async function l(){let e=new Date;e.setDate(1),e.setHours(0,0,0,0);let a=await t.default.salesInvoice.findMany({where:{date:{gte:e}}}),n=a.reduce((e,t)=>e+(t.total||0),0);return`📊 <b>مبيعات الشهر</b>

📄 عدد الفواتير: <b>${a.length}</b>
💰 الإجمالي: <b>${c(n)} ر.س</b>`}async function o(){let e=(await t.default.treasury.findMany()).reduce((e,t)=>e+("in"===t.type?t.amount:-t.amount),0);return`🏦 <b>رصيد الخزينة</b>

💰 الرصيد الحالي: <b>${c(e)} ر.س</b>`}async function d(){let e=await t.default.product.findMany({where:{currentStock:{lt:5}},orderBy:{currentStock:"asc"},take:20});if(0===e.length)return"✅ <b>المخزون ممتاز!</b>\nلا توجد أصناف ناقصة";let a=`⚠️ <b>أصناف ناقصة (مخزون أقل من 5)</b>

`;return e.forEach(e=>{a+=`• ${e.name}: <b>${e.currentStock||0}</b> ${0===(e.currentStock||0)?"🔴":"🟡"}
`}),a}async function p(){return`📦 <b>عدد المنتجات:</b> ${await t.default.product.count()}`}async function f(){return`👥 <b>عدد العملاء والموردين:</b> ${await t.default.customer.count()}`}async function b(){return`👷 <b>عدد الموظفين:</b> ${await t.default.employee.count()}`}async function w(){let e=new Date;e.setHours(0,0,0,0);let a=await t.default.user.findMany({include:{permissions:!0,salesInvoices:{where:{date:{gte:e}}}},orderBy:{id:"asc"}});if(0===a.length)return"❌ لا يوجد مستخدمين";let n={admin:"👑 مدير",cashier:"💰 كاشير",accountant:"📊 محاسب",data_entry:"📝 مدخل بيانات"},i=`👥 <b>المستخدمين (${a.length})</b>
━━━━━━━━━━━━━━━━━━

`;return a.forEach(e=>{let t=n[e.role]||e.role,a=e.salesInvoices.reduce((e,t)=>e+(t.total||0),0);i+=`${e.active?"🟢":"🔴"} <b>${e.fullName}</b> (@${e.username})
   ${t} | صلاحيات: ${e.permissions.length>0?e.permissions.length+" قسم":"كاملة"}
`,e.salesInvoices.length>0&&(i+=`   📊 مبيعات اليوم: <b>${e.salesInvoices.length}</b> فاتورة | <b>${c(a)} ر.س</b>
`),i+=`
`}),i}async function m(e){let a=new Date;a.setHours(0,0,0,0);let n=new Date;n.setDate(1),n.setHours(0,0,0,0);let i=await t.default.user.findFirst({where:{OR:[{username:{contains:e}},{fullName:{contains:e}}]},include:{salesInvoices:{where:{date:{gte:n}}}}});if(!i)return`❌ لم يتم العثور على مستخدم بهذا الاسم: ${e}`;let r=i.salesInvoices.filter(e=>e.date>=a),s=r.reduce((e,t)=>e+(t.total||0),0),u=i.salesInvoices.reduce((e,t)=>e+(t.total||0),0);return`👤 <b>تقرير المستخدم: ${i.fullName}</b>
━━━━━━━━━━━━━━━━━━

📊 مبيعات اليوم: <b>${r.length}</b> فاتورة | <b>${c(s)} ر.س</b>
📈 مبيعات الشهر: <b>${i.salesInvoices.length}</b> فاتورة | <b>${c(u)} ر.س</b>
`}async function g(){let e=new Date;e.setHours(0,0,0,0);let a=await t.default.expense.findMany({where:{date:{gte:e}}}),n=a.reduce((e,t)=>e+(t.amount||0),0);return`💸 <b>مصروفات اليوم</b>

📄 عدد: <b>${a.length}</b>
💰 الإجمالي: <b>${c(n)} ر.س</b>`}async function y(){let e=new Date;e.setDate(e.getDate()-30);let a=await t.default.salesInvoiceDetail.findMany({where:{invoice:{date:{gte:e}}}}),n=new Map;a.forEach(e=>{n.set(e.productName||"غير معروف",(n.get(e.productName||"غير معروف")||0)+(e.quantity||0))});let i=[...n.entries()].sort((e,t)=>t[1]-e[1]).slice(0,10);if(0===i.length)return"📊 لا توجد مبيعات في آخر 30 يوم";let r=`🏆 <b>أعلى 10 منتجات مبيعاً (آخر 30 يوم)</b>

`;return i.forEach(([e,t],a)=>{r+=`${a+1}. ${e}: <b>${t}</b>
`}),r}async function h(e){if(e<=0)return"❌ المبلغ غير صحيح";let a=.15*e,n=await t.default.purchaseInvoice.count();return await t.default.purchaseInvoice.create({data:{invoiceNo:n+1,date:new Date,subtotal:e,discountRate:0,discountValue:0,taxValue:a,total:e+a,paymentType:"cash",paid:e+a,remaining:0,notes:"تم الإضافة عبر بوت تلجرام"}}),await t.default.treasury.create({data:{type:"out",amount:e+a,description:`مشتريات #${n+1} (تلجرام)`,referenceType:"purchase",date:new Date}}),`✅ <b>تم تسجيل مشتريات</b>

💰 المبلغ: <b>${c(e)} ر.س</b>
📊 الضريبة: <b>${c(a)} ر.س</b>
📋 الإجمالي: <b>${c(e+a)} ر.س</b>
📄 فاتورة رقم: <b>#${n+1}</b>`}async function $(e,a){return e<=0?"❌ المبلغ غير صحيح":(await t.default.expense.create({data:{amount:e,description:a||"مصروف عبر تلجرام",date:new Date}}),await t.default.treasury.create({data:{type:"out",amount:e,description:`مصروف: ${a||"عام"} (تلجرام)`,referenceType:"expense",date:new Date}}),`✅ <b>تم تسجيل مصروف</b>

💰 المبلغ: <b>${c(e)} ر.س</b>
📝 الوصف: ${a||"مصروف عام"}`)}async function v(){let e=new Date;e.setHours(0,0,0,0);let a=await t.default.salesInvoice.findMany({where:{date:{gte:e}}}),n=a.reduce((e,t)=>e+(t.total||0),0),i=await t.default.purchaseInvoice.findMany({where:{date:{gte:e}}}),r=i.reduce((e,t)=>e+(t.total||0),0),s=await t.default.expense.findMany({where:{date:{gte:e}}}),u=s.reduce((e,t)=>e+(t.amount||0),0),l=await t.default.product.count({where:{currentStock:{lt:5}}}),o=(await t.default.treasury.findMany()).reduce((e,t)=>e+("in"===t.type?t.amount:-t.amount),0);return`📋 <b>التقرير اليومي</b> - ${new Date().toLocaleDateString("ar-SA")}
━━━━━━━━━━━━━━━━━━
🧾 المبيعات: <b>${a.length}</b> فاتورة | <b>${c(n)} ر.س</b>
📦 المشتريات: <b>${i.length}</b> فاتورة | <b>${c(r)} ر.س</b>
💸 المصروفات: <b>${s.length}</b> | <b>${c(u)} ر.س</b>
━━━━━━━━━━━━━━━━━━
📊 صافي اليوم: <b>${c(n-r-u)} ر.س</b>
🏦 رصيد الخزينة: <b>${c(o)} ر.س</b>
⚠️ أصناف ناقصة: <b>${l}</b>`}async function I(e,i){await r(i,"⚙️ جاري قراءة الفاتورة بالذكاء الاصطناعي... لحظات من فضلك.");try{let s,c=await a(),u=await n();if(!u)return void await r(i,"❌ مفتاح Gemini API غير متوفر في الإعدادات.");let l=await fetch(`https://api.telegram.org/bot${c}/getFile?file_id=${e}`),o=await l.json(),d=o.result?.file_path;if(!d)return void await r(i,"❌ فشل في جلب مسار الصورة من السيرفر.");let p=await fetch(`https://api.telegram.org/file/bot${c}/${d}`),f=await p.arrayBuffer(),b=Buffer.from(f).toString("base64"),w=`
أنت خبير في قراءة الفواتير الضريبية السعودية باللغتين العربية والإنجليزية.
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
إذا تعذر إيجاد أي حقل أو كان فارغاً اجعله null للمحتوى النصي و 0 للأرقام. استخدم السعر قبل الضريبة للـ price إذا أمكن.
`,m=await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${u.replace(/[\"\'\\]/g,"").trim()}`,{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({contents:[{parts:[{text:w},{inline_data:{mime_type:"image/jpeg",data:b}}]}],generationConfig:{temperature:.1,response_mime_type:"application/json"}})});if(!m.ok)return void await r(i,"❌ فشل في الاتصال بالذكاء الاصطناعي.");let g=await m.json(),y=g.candidates?.[0]?.content?.parts?.[0]?.text||"{}";try{s=JSON.parse(y.replace(/```json/g,"").replace(/```/g,"").trim())}catch(e){await r(i,"❌ فشل في فهم صيغة البيانات من الذكاء الاصطناعي.");return}if(!s.grandTotal)return void await r(i,"❌ لم يتم استخراج الإجمالي من الفاتورة بوضوح.");let h=await t.default.$transaction(async e=>{let t=null;if(s.supplierName){let a=await e.customer.findFirst({where:{name:s.supplierName,type:1}});a||(a=await e.customer.create({data:{name:s.supplierName,type:1,taxNumber:s.taxNumber||null}})),t=a.id}let a=await e.purchaseInvoice.findFirst({orderBy:{invoiceNo:"desc"}}),n=(a?.invoiceNo||0)+1;parseFloat(s.grandTotal);let i=[];for(let t of s.items||[]){if(!t.name)continue;let a=await e.product.findFirst({where:{name:t.name}});a?(parseFloat(t.price)||0)>0&&await e.product.update({where:{id:a.id},data:{buyPrice:parseFloat(t.price)}}):a=await e.product.create({data:{name:t.name,barcode:Math.floor(1e8+9e8*Math.random()).toString(),sellPrice:1.5*(parseFloat(t.price)||0),buyPrice:parseFloat(t.price)||0}});let n=parseFloat(t.quantity)||1;i.push({productId:a.id,productName:a.name,quantity:n,price:parseFloat(t.price)||0,taxRate:15,taxValue:(parseFloat(t.price)||0)*n*.15,total:parseFloat(t.total)||(parseFloat(t.price)||0)*n*1.15,discountRate:0,discountValue:0})}if(0===i.length)throw Error("لا توجد أصناف");let r=i.reduce((e,t)=>e+t.price*t.quantity,0),c=.15*r,u=r+c,l=await e.purchaseInvoice.create({data:{invoiceNo:n,supplierId:t,stockId:1,subtotal:r,taxValue:c,total:u,paid:u,remaining:0,supplierInvoiceNo:s.invoiceNo||null,paymentType:"cash",status:"completed",receiptStatus:"received",notes:"إضافة آلية بذكاء تلجرام",details:{create:i}},include:{details:!0,supplier:!0}});for(let t of l.details)await e.product.update({where:{id:t.productId},data:{currentStock:{increment:t.quantity}}}),await e.productStock.upsert({where:{productId_stockId:{productId:t.productId,stockId:1}},update:{quantity:{increment:t.quantity}},create:{productId:t.productId,stockId:1,quantity:t.quantity}});return await e.treasury.create({data:{type:"out",amount:u,description:`مشتريات آلي #${n} (${l.supplier?.name||"عام"})`,referenceType:"purchase",referenceId:l.id,date:new Date}}),l});await r(i,`✅ <b>تم استخراج الفاتورة وإضافتها بنجاح!</b>
━━━━━━━━━━━━━━━━━━

📄 فاتورة رقم: <b>#${h.invoiceNo}</b>
🏢 المورد: <b>${h.supplier?.name||"غير محدد"}</b>
📦 عدد الأصناف: <b>${h.details.length}</b>

💵 الإجمالي (مع الضريبة): <b>${h.total.toLocaleString("en-US",{minimumFractionDigits:2})} ر.س</b>`)}catch(e){console.error("Telegram AI Invoice Error:",e),await r(i,`❌ عذراً، لم نتمكن من تسجيل الفاتورة.
${e.message||""}`)}}async function N(e){let t=e.trim().toLowerCase();if("/start"===t||"/help"===t||t.includes("مساعد")||t.includes("الأوامر")||t.includes("اوامر"))return`🤖 <b>مرحباً بك في بوت نما سوفت!</b>

📊 <b>الاستفسارات:</b>
• مبيعات اليوم
• مبيعات الشهر
• مصروفات اليوم
• رصيد الخزينة
• المخزون الناقص
• أعلى المنتجات مبيعاً
• عدد المنتجات
• عدد العملاء
• عدد الموظفين
• تقرير يومي

👥 <b>المستخدمين:</b>
• المستخدمين
• مبيعات [اسم]

✍️ <b>العمليات:</b>
• مشتريات 10000
• مصروف 500 إيجار

📸 <b>الذكاء الاصطناعي:</b>
• أرسل صورة لفاتورة مشتريات، وسيقوم البوت بقراءتها وإضافتها آلياً!`;if((t.includes("مبيعات")||t.includes("بيع"))&&(t.includes("اليوم")||t.includes("يوم")))return await u();if((t.includes("مبيعات")||t.includes("بيع"))&&(t.includes("شهر")||t.includes("الشهر")))return await l();if(t.includes("خزينة")||t.includes("رصيد")||t.includes("الخزنة")||t.includes("الرصيد"))return await o();if(t.includes("ناقص")||t.includes("نقص")||t.includes("مخزون")&&(t.includes("قليل")||t.includes("ناقص")||t.includes("نفذ")))return await d();if(t.includes("أعلى")||t.includes("اعلى")||t.includes("أكثر")||t.includes("اكثر")||t.includes("ترتيب"))return await y();if(t.includes("منتج")&&(t.includes("كم")||t.includes("عدد")))return await p();if((t.includes("عميل")||t.includes("عملاء")||t.includes("زبون"))&&(t.includes("كم")||t.includes("عدد")))return await f();if((t.includes("موظف")||t.includes("موظفين"))&&(t.includes("كم")||t.includes("عدد")))return await b();if(t.includes("مستخدم")||t.includes("مستخدمين")||"/users"===t)return await w();if(t.includes("مبيعات")&&!t.includes("اليوم")&&!t.includes("شهر")&&!t.includes("يوم")){let e=t.replace(/مبيعات/g,"").trim();if(e.length>0)return await m(e)}if(t.includes("مصروف")&&(t.includes("اليوم")||t.includes("يوم")))return await g();if(t.includes("تقرير")||t.includes("ملخص")||t.includes("اليوم")&&!t.includes("مبيعات")&&!t.includes("مصروف"))return await v();if(t.includes("مشتريات")||t.includes("شراء")||t.includes("اشتري")){let e=s(t);return e>0?await h(e):"❓ حدد المبلغ. مثال: <b>مشتريات 10000</b>"}if(t.includes("مصروف")||t.includes("صرف")||t.includes("سدد")){let e=s(t),a=t.replace(/[\d,\.]+/g,"").replace(/مصروف|صرف|سدد|ريال|ر\.س/g,"").trim();return e>0?await $(e,a):"❓ حدد المبلغ. مثال: <b>مصروف 500 إيجار</b>"}return t.includes("مخزون")||t.includes("بضاعة")||t.includes("ستوك")?await d():`❓ لم أفهم الأمر.

أرسل <b>/help</b> لعرض الأوامر المتاحة.`}async function S(e,t){await r(t,"⚙️ جاري الاستماع وتحليل المقطع الصوتي بالذكاء الاصطناعي...");try{let i,s=await a(),c=await n();if(!c)return void await r(t,"❌ مفتاح Gemini API غير متوفر في الإعدادات لتفعيل الأوامر الصوتية.");let u=await fetch(`https://api.telegram.org/bot${s}/getFile?file_id=${e}`),l=await u.json(),o=l.result?.file_path;if(!o)return void await r(t,"❌ فشل في جلب المسار الصوتي من السيرفر.");let d=await fetch(`https://api.telegram.org/file/bot${s}/${o}`),p=await d.arrayBuffer(),f=Buffer.from(p).toString("base64"),b=`
أنت خبير أنظمة ERP والذكاء الاصطناعي. استمع بعناية فائقة للمقطع الصوتي المرسل لك باللغة العربية (وقد يحتوي على لهجة عامية سعودية).
المقطع قد يكون أمراً بإضافة مصروف، أو إضافة فاتورة مشتريات سريعة، أو استعلاماً عن النظام (مثل: كم المبيعات، أو كم الخزينة).

استخرج النية (intent) وأرجع النتيجة بصيغة JSON فقط:
{
  "transcript": "النص الكامل للمقطع الصوتي الذي قاله المستخدم بدقة",
  "intent": "expense" | "purchase" | "inquiry" | "unknown",
  "amount": 0,
  "description": "وصف المصروف إذا كان expense"
}

الإرشادات:
- إذا قال "صرفنا 500 حق صيانة"، النية expense، المبلغ 500، الوصف "صيانة".
- إذا قال "اشترينا بضاعة بـ 1000"، النية purchase، المبلغ 1000.
- إذا كان المقطع عبارة عن سؤال (مثلاً: عطني مبيعات اليوم، كم رصيد الخزنة، كم عدد العملاء)، اجعل النية inquiry.
- لا تضع أي نصوص إضافية خارج الـ JSON. تأكد من أن الـ JSON صالح تماماً.
`,w=await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${c.replace(/[\"\'\\]/g,"").trim()}`,{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({contents:[{parts:[{text:b},{inline_data:{mime_type:"audio/ogg",data:f}}]}],generationConfig:{temperature:.1,response_mime_type:"application/json"}})});if(!w.ok)return void await r(t,"❌ فشل في الاتصال بالذكاء الاصطناعي (Gemini).");let m=await w.json(),g=m.candidates?.[0]?.content?.parts?.[0]?.text||"{}";try{i=JSON.parse(g.replace(/```json/g,"").replace(/```/g,"").trim())}catch(e){await r(t,"❌ فشل في فهم المقطع الصوتي بشكل صحيح.");return}let{transcript:y,intent:v,amount:I,description:S}=i,D="";D="expense"===v&&I>0?await $(I,S||"مصروف صوتي"):"purchase"===v&&I>0?await h(I):await N(y||"غير مفهوم"),await r(t,`🎙️ <i>${y||"..."}</i>

${D}`)}catch(e){console.error("Telegram AI Voice Error:",e),await r(t,`❌ عذراً، لم نتمكن من معالجة الصوت.
${e.message||""}`)}}e.s(["getBotToken",()=>a,"getGeminiKey",()=>n,"processMessage",()=>N,"processPhoto",()=>I,"processVoice",()=>S,"sendMessage",()=>r])}];

//# debugId=4a2dffa1-4767-07d7-fa89-1b1ebcd7260d
//# sourceMappingURL=src_lib_telegram-bot_ts_5da89743._.js.map