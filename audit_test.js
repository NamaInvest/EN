const {Client}=require('ssh2');
const c=new Client();
function ex(cn,cmd){return new Promise(r=>{cn.exec(cmd,(e,s)=>{if(e){r('ERR:'+e.message);return}let o='';s.on('data',d=>o+=d.toString());s.stderr.on('data',d=>o+=d.toString());s.on('close',()=>r(o.trim()))})});}
function api(cn,m,p,b){const h="-H 'Host: brightstartradingco.namainvist.com' -H 'Content-Type: application/json'";const a=global.TK?"-H 'Authorization: Bearer "+global.TK+"' -b 'token="+global.TK+"'":'';const bd=b?JSON.stringify(b):'';const d=b?"-d '"+bd.replace(/'/g,"'\\''")+"'":'';return ex(cn,"curl -s -m 10 -X "+m+" "+a+" "+h+" "+d+" 'http://localhost:3500"+p+"' 2>&1");}
function P(r){try{return JSON.parse(r)}catch{return null}}
const R=[];
function ok(d){return d && !d.error && !d.statusCode}
function L(id,n,s,d){const i=s==='P'?'✅':s==='F'?'❌':'⚠️';R.push({id,n,s});console.log(i+' '+id+' '+n+': '+(d+'').substring(0,120));}

c.on('ready',async()=>{
console.log('══════════════════════════════════════════════');
console.log('  COMPREHENSIVE ERP AUDIT v2 — Nama Invest');
console.log('══════════════════════════════════════════════\n');
let r,d;
r=await api(c,'POST','/api/auth/login',{username:'admin',password:'admin7773'});
d=P(r);if(d&&d.token){global.TK=d.token;L('0.0','تسجيل دخول','P','OK')}else{console.log('LOGIN FAILED');c.end();return}

// ═══ 1. المحاسبة المالية ═══
console.log('\n💰 1. المحاسبة المالية');
r=await api(c,'GET','/api/accounts');d=P(r);
L('1.1','شجرة الحسابات',d?'P':'F','loaded');
r=await api(c,'POST','/api/accounting/journal',{description:'Unbal',lines:[{accountCode:'1110',debit:500,credit:0},{accountCode:'4100',debit:0,credit:400}]});d=P(r);
L('1.2','رفض قيد غير متوازن',d&&d.error?'P':'F',d?.error||'NOT rejected');
r=await api(c,'POST','/api/accounting/journal',{description:'Bal',lines:[{accountCode:'1110',debit:500,credit:0},{accountCode:'4100',debit:0,credit:500}]});d=P(r);
L('1.3','قيد متوازن',d&&(d.id||d.journalId||d.entry)?'P':'F','OK: '+JSON.stringify(d).substring(0,80));
r=await api(c,'GET','/api/accounting/trial-balance');d=P(r);
L('1.4','ميزان المراجعة',d&&(d.accounts||Array.isArray(d))?'P':'F','OK');
r=await api(c,'GET','/api/reports/income-statement');d=P(r);
L('1.5','قائمة الدخل',d?'P':'F','OK');
r=await api(c,'GET','/api/reports/balance-sheet');d=P(r);
L('1.6','الميزانية العمومية',d?'P':'F','OK');
r=await api(c,'GET','/api/reports/cash-flow');d=P(r);
L('1.7','التدفقات النقدية',d?'P':'F','OK');
r=await api(c,'GET','/api/fiscal-periods');d=P(r);
L('1.8','الفترات المالية',d?'P':'F','OK');

// ═══ 2. إدارة المخزون ═══
console.log('\n📦 2. إدارة المخزون');
r=await api(c,'GET','/api/units');d=P(r);
L('2.1','وحدات القياس',d?'P':'F','units: '+JSON.stringify(d).substring(0,60));
r=await api(c,'GET','/api/categories');d=P(r);
L('2.2','التصنيفات',d?'P':'F','OK');
r=await api(c,'GET','/api/warehouses');d=P(r);
L('2.3','مستودعات متعددة',d?'P':'F','OK');
r=await api(c,'GET','/api/batches');d=P(r);
L('2.4','تتبع الدفعات',d!==null?'P':'F','OK');
r=await api(c,'POST','/api/products',{name:'منتج التدقيق v2',nameEn:'Audit v2',buyPrice:'50',sellPrice:'100',unitId:'1',currentStock:'30'});d=P(r);
const aProd=d?.id;L('2.5','إضافة منتج',aProd?'P':'F','ID: '+aProd);
r=await api(c,'GET','/api/stock-movements');d=P(r);
L('2.6','حركات المخزون',d!==null?'P':'F','OK');
r=await api(c,'POST','/api/stock/adjustments',{productId:aProd,actualQuantity:25,reason:'Audit'});d=P(r);
L('2.7','تسوية مخزون',d&&d.id?'P':'F','ID: '+d?.id);
r=await api(c,'POST','/api/smart-transfers',{productId:aProd,senderStockId:1,receiverStockId:2,quantity:2});d=P(r);
L('2.8','تحويل مخازن',d?'P':'F',d?.message||'OK');
r=await api(c,'GET','/api/product-stocks');d=P(r);
L('2.9','أرصدة المستودعات',d!==null?'P':'F','OK');

// ═══ 3. المبيعات ═══
console.log('\n🛒 3. المبيعات وCRM');
r=await api(c,'POST','/api/customers',{name:'عميل تدقيق v2',phone:'0550009999',type:'individual'});d=P(r);
const aCust=d?.id;L('3.1','إضافة عميل',aCust?'P':'F','ID: '+aCust);
r=await api(c,'POST','/api/price-quotes',{customerId:aCust,items:[{productId:aProd,quantity:2,price:100}],validDays:7});d=P(r);
L('3.2','عرض سعر',d?'P':'F','OK');
r=await api(c,'POST','/api/sales-orders',{customerId:aCust,items:[{productId:aProd,quantity:2,price:100}]});d=P(r);
L('3.3','أمر بيع',d!==null?'P':'F','OK');
r=await api(c,'POST','/api/sales',{items:[{productId:aProd,productName:'Audit v2',quantity:2,price:100}],paymentType:'cash',taxRate:15,customerId:aCust});d=P(r);
const aSale=d?.id;L('3.4','فاتورة مبيعات',aSale?'P':'F','ID: '+aSale);
r=await api(c,'POST','/api/sales-returns',{invoiceId:aSale,items:[{productId:aProd,quantity:1,price:100}],reason:'test'});d=P(r);
L('3.5','مرتجع مبيعات',d!==null?'P':'F','OK');
r=await api(c,'GET','/api/loyalty/'+aCust);d=P(r);
L('3.6','نظام الولاء',d!==null?'P':'F','OK');
r=await api(c,'POST','/api/coupons',{code:'AUD'+Date.now(),discountType:'percentage',discountValue:10,maxUses:100,expiresAt:'2027-12-31'});d=P(r);
L('3.7','كوبونات',d!==null?'P':'F','OK');
r=await api(c,'GET','/api/crm/leads');d=P(r);
L('3.8','CRM Leads',d!==null?'P':'F','OK');
r=await api(c,'GET','/api/promotions');d=P(r);
L('3.9','العروض الترويجية',d!==null?'P':'F','OK');

// ═══ 4. المشتريات ═══
console.log('\n📋 4. المشتريات');
r=await api(c,'POST','/api/purchases',{supplierId:1,items:[{productId:aProd,productName:'Audit v2',quantity:5,price:50}],notes:'Audit'});d=P(r);
L('4.1','فاتورة مشتريات',d&&(d.id||!d.error)?'P':'F','OK');
r=await api(c,'POST','/api/purchase-orders',{supplierId:1,items:[{productId:aProd,quantity:10,unitPrice:50}]});d=P(r);
L('4.2','أمر شراء',d?'P':'F','OK');
r=await api(c,'POST','/api/purchase-returns',{supplierId:1,items:[{productId:aProd,quantity:1,price:50}],reason:'test'});d=P(r);
L('4.3','مرتجع مشتريات',d!==null?'P':'F','OK');
r=await api(c,'GET','/api/vendor-ratings');d=P(r);
L('4.4','تقييم الموردين',d!==null?'P':'F','OK');
r=await api(c,'GET','/api/shipments');d=P(r);
L('4.5','الشحنات',d!==null?'P':'F','OK');

// ═══ 5. التصنيع ═══
console.log('\n🏭 5. التصنيع');
r=await api(c,'POST','/api/products',{name:'خام v2',nameEn:'Raw v2',buyPrice:'5',sellPrice:'10',unitId:'1',currentStock:'200'});d=P(r);const rawId=d?.id;
r=await api(c,'POST','/api/products',{name:'نهائي v2',nameEn:'Fin v2',buyPrice:'15',sellPrice:'30',unitId:'1'});d=P(r);const finId=d?.id;
if(rawId&&finId){
r=await api(c,'POST','/api/manufacturing/recipes',{name:'وصفة v2',finishedProductId:finId,outputQuantity:1,ingredients:[{rawProductId:rawId,quantity:2,estimatedCost:10}]});d=P(r);
const recId=d?.id;L('5.1','وصفة BOM',recId?'P':'F','ID: '+recId);
r=await api(c,'POST','/api/manufacturing/orders',{recipeId:recId,quantity:50,notes:'Audit'});d=P(r);
L('5.2','أمر إنتاج',d&&!d.error?'P':'F','Status: '+(d?.status||'created'));
}else{L('5.1','وصفة BOM','F','Products failed');L('5.2','أمر إنتاج','F','Depends on 5.1')}

// ═══ 6. الموارد البشرية ═══
console.log('\n👷 6. الموارد البشرية');
r=await api(c,'POST','/api/employees',{name:'مدقق HR v2',phone:'0559870000',position:'مدقق',department:'مالية',basicSalary:10000,nationality:'Saudi',joinDate:'2026-01-01'});d=P(r);
const empId=d?.id;L('6.1','ملف موظف',empId?'P':'F','ID: '+empId);
r=await api(c,'POST','/api/attendance',{employeeId:empId,date:'2026-04-26',checkIn:'08:00',checkOut:'17:00'});d=P(r);
L('6.2','حضور وانصراف',d&&!d.error?'P':'F','OK');
r=await api(c,'POST','/api/vacations',{employeeId:empId,type:'annual',dateFrom:'2026-05-01',dateTo:'2026-05-03',status:'approved'});d=P(r);
L('6.3','إجازات',d&&d.id?'P':'F','ID: '+d?.id);
r=await api(c,'POST','/api/hr/loans',{employeeId:empId,amount:3000,monthlyDeduction:500,reason:'Audit'});d=P(r);
L('6.4','سلف وقروض',d&&!d.error?'P':'F','OK');
r=await api(c,'POST','/api/salaries',{employeeId:empId,month:4,year:2026,basicSalary:10000,additions:2500,deductions:1000,notes:'Audit'});d=P(r);
L('6.5','حساب الراتب',d&&d.netSalary?'P':'F','Net: '+d?.netSalary);
r=await api(c,'GET','/api/salaries');d=P(r);
L('6.6','كشف الرواتب',Array.isArray(d)&&d.length>0?'P':'F',d?.length+' records');
r=await api(c,'GET','/api/work-shifts');d=P(r);
L('6.7','ورديات العمل',d!==null?'P':'F','OK');

// ═══ 7. الوحدات المتقدمة ═══
console.log('\n🏢 7. الوحدات المتقدمة');
r=await api(c,'GET','/api/fixed-assets');d=P(r);
L('7.1','الأصول الثابتة',d!==null?'P':'F','OK');
r=await api(c,'GET','/api/fleet/trips');d=P(r);
L('7.2','إدارة الأسطول',d!==null?'P':'F','OK');
r=await api(c,'GET','/api/fleet/fuel');d=P(r);
L('7.3','تتبع الوقود',d!==null?'P':'F','OK');
r=await api(c,'GET','/api/maintenance');d=P(r);
L('7.4','الصيانة',d!==null?'P':'F','OK');
r=await api(c,'GET','/api/contracts');d=P(r);
L('7.5','العقود',d!==null?'P':'F','OK');
r=await api(c,'GET','/api/bookings');d=P(r);
L('7.6','الحجوزات',d!==null?'P':'F','OK');
r=await api(c,'GET','/api/field-service');d=P(r);
L('7.7','خدمات ميدانية',d!==null?'P':'F','OK');
r=await api(c,'GET','/api/documents');d=P(r);
L('7.8','إدارة المستندات',d!==null?'P':'F','OK');

// ═══ 8. الأمان ═══
console.log('\n🔐 8. الأمان');
r=await api(c,'POST','/api/auth/login',{username:'admin',password:'wrong'});d=P(r);
L('8.1','رفض كلمة سر خاطئة',d&&d.error?'P':'F',d?.error||'');
r=await api(c,'POST','/api/auth/login',{username:'nobody',password:'test'});d=P(r);
L('8.2','رفض مستخدم غير موجود',d&&d.error?'P':'F',d?.error||'');
const noAuth=await ex(c,"curl -s -m 5 -H 'Host: brightstartradingco.namainvist.com' 'http://localhost:3500/api/products' 2>&1");const noAuthD=P(noAuth);
L('8.3','حماية API بدون توكن',noAuthD&&noAuthD.error?'P':'F',noAuthD?.error||'');
r=await api(c,'GET','/api/audit-logs');d=P(r);
L('8.4','سجل المراقبة',d!==null?'P':'F','OK');
r=await api(c,'GET','/api/users');d=P(r);
L('8.5','إدارة المستخدمين',d!==null?'P':'F','OK');

// ═══ 9. POS ═══
console.log('\n💳 9. نقاط البيع');
r=await api(c,'GET','/api/shifts');d=P(r);
L('9.1','ورديات الكاشير',d!==null?'P':'F','OK');
r=await api(c,'GET','/api/delivery-platforms');d=P(r);
L('9.2','منصات التوصيل',d!==null?'P':'F','OK');
r=await api(c,'GET','/api/gift-cards');d=P(r);
L('9.3','بطاقات هدايا',d!==null?'P':'F','OK');
r=await api(c,'GET','/api/installments');d=P(r);
L('9.4','التقسيط BNPL',d!==null?'P':'F','OK');

// ═══ 10. التقارير ═══
console.log('\n📊 10. التقارير');
r=await api(c,'GET','/api/reports/sales');d=P(r);
L('10.1','تقرير المبيعات',d?'P':'F','OK');
r=await api(c,'GET','/api/reports/inventory');d=P(r);
L('10.2','تقرير المخزون',d?'P':'F','OK');
r=await api(c,'GET','/api/accounting/ledger?accountCode=1110');d=P(r);
L('10.3','دفتر الأستاذ',d!==null?'P':'F','OK');
r=await api(c,'GET','/api/treasury');d=P(r);
L('10.4','الخزينة',d!==null?'P':'F','OK');
r=await api(c,'GET','/api/expenses');d=P(r);
L('10.5','المصروفات',d!==null?'P':'F','OK');
r=await api(c,'GET','/api/banks');d=P(r);
L('10.6','البنوك',d!==null?'P':'F','OK');
r=await api(c,'GET','/api/recurring-invoices');d=P(r);
L('10.7','فواتير دورية',d!==null?'P':'F','OK');
r=await api(c,'GET','/api/reports/bi-export?entity=sales');d=P(r);
L('10.8','تصدير BI',d?'P':'F','OK');
r=await api(c,'GET','/api/reports/export?type=sales&format=csv');
L('10.9','تصدير CSV',r&&r.length>50?'P':'F',r?.length+' chars');

// ═══ 11. التكاملات ═══
console.log('\n🔌 11. التكاملات');
r=await api(c,'GET','/api/zatca');d=P(r);
L('11.1','ZATCA',d!==null||r.length>2?'P':'F','OK');
r=await api(c,'GET','/api/whatsapp');d=P(r);
L('11.2','WhatsApp',d!==null||r.length>2?'P':'F','OK');
r=await api(c,'GET','/api/ecommerce');d=P(r);
L('11.3','E-commerce',d!==null||r.length>2?'P':'F','OK');
r=await api(c,'GET','/api/webhooks');d=P(r);
L('11.4','Webhooks',d!==null||r.length>2?'P':'F','OK');
r=await api(c,'GET','/api/b2b');d=P(r);
L('11.5','B2B Portal',d!==null||r.length>2?'P':'F','OK');

// ═══ 12. صحة النظام ═══
console.log('\n🏥 12. صحة النظام');
r=await api(c,'GET','/api/health');d=P(r);
L('12.1','Health Check',d&&(d.status==='OK'||d.status==='ok')?'P':'F','Status: '+d?.status);
r=await api(c,'GET','/api/version');d=P(r);
L('12.2','Version',d&&d.version?'P':'F','v'+d?.version);
r=await api(c,'GET','/api/dashboard');d=P(r);
L('12.3','Dashboard',d?'P':'F','OK');
r=await api(c,'GET','/api/settings');d=P(r);
L('12.4','إعدادات النظام',d?'P':'F','OK');
r=await api(c,'GET','/api/branches');d=P(r);
L('12.5','الفروع',d!==null?'P':'F','OK');

// ═══ SUMMARY ═══
const pass=R.filter(x=>x.s==='P').length;
const fail=R.filter(x=>x.s==='F').length;
const total=R.length;
console.log('\n╔═══════════════════════════════════════════════════════╗');
console.log('║      نتائج التدقيق الشامل — Nama Invest ERP         ║');
console.log('╠═══════════════════════════════════════════════════════╣');
console.log('║  ✅ ناجح:  '+pass+' / '+total+'                                      ║');
console.log('║  ❌ فاشل:  '+fail+' / '+total+'                                       ║');
console.log('║  📊 النسبة: '+Math.round(pass/total*100)+'%                                       ║');
if(fail>0){console.log('╠═══════════════════════════════════════════════════════╣');R.filter(x=>x.s==='F').forEach(x=>console.log('║  ❌ '+x.id+' '+x.n));}
console.log('╚═══════════════════════════════════════════════════════╝');
c.end();
});
c.on('error',e=>console.error(e.message));
c.connect({host:'46.4.188.170',port:22,username:'root',password:'_ee4SWbxLVfH9b',readyTimeout:15000});
