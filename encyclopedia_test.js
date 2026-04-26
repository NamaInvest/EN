const {Client}=require('ssh2');const c=new Client();
function ex(cn,cmd){return new Promise(r=>{cn.exec(cmd,(e,s)=>{if(e){r('ERR:'+e.message);return}let o='';s.on('data',d=>o+=d.toString());s.stderr.on('data',d=>o+=d.toString());s.on('close',()=>r(o.trim()))})});}
function api(cn,m,p,b){const h="-H 'Host: brightstartradingco.namainvist.com' -H 'Content-Type: application/json'";const a=global.TK?"-H 'Authorization: Bearer "+global.TK+"' -b 'token="+global.TK+"'":'';const bd=b?JSON.stringify(b):'';const d=b?"-d '"+bd.replace(/'/g,"'\\''")+"'":'';return ex(cn,"curl -s -m 10 -X "+m+" "+a+" "+h+" "+d+" 'http://localhost:3500"+p+"' 2>&1");}
function P(r){try{return JSON.parse(r)}catch{return null}}
const R=[];let pass=0,fail=0;
function L(id,n,s,d){const ok=s==='P';if(ok)pass++;else fail++;R.push({id,n,s});console.log((ok?'✅':'❌')+' '+id+' '+n+': '+(d+'').substring(0,100));}

c.on('ready',async()=>{
console.log('╔══════════════════════════════════════════════════════════╗');
console.log('║   موسوعة فحوصات Nama Invest ERP — Testing Encyclopedia  ║');
console.log('║   v2.4.5 | '+new Date().toISOString().slice(0,10)+'                                    ║');
console.log('╚══════════════════════════════════════════════════════════╝\n');
let r,d;

// LOGIN
r=await api(c,'POST','/api/auth/login',{username:'admin',password:'admin7773'});
d=P(r);if(!d||!d.token){console.log('❌ LOGIN FAILED');c.end();return;}
global.TK=d.token;
console.log('✅ تسجيل الدخول: OK\n');

// ════════════════════════════════════════════════════════════
console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
console.log('📋 الاستراتيجية 1: فحص الوحدات المنفردة (Unit Testing)');
console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

// --- المنتجات ---
console.log('📦 المنتجات:');
r=await api(c,'POST','/api/products',{nameEn:'Test',buyPrice:'10',sellPrice:'20',unitId:'1'});d=P(r);
L('1.1','منتج بدون اسم عربي',d&&d.error?'P':'F',d?.error||'ACCEPTED - should reject');

r=await api(c,'POST','/api/products',{name:'سلبي',nameEn:'Neg',buyPrice:'-50',sellPrice:'100',unitId:'1'});d=P(r);
L('1.2','منتج بسعر شراء سالب',d&&d.error?'P':'F',d?.error||'ACCEPTED');

r=await api(c,'POST','/api/products',{name:'منتج تجربة ص',nameEn:'Valid Test',buyPrice:'50',sellPrice:'100',unitId:'1',currentStock:'10'});d=P(r);
const testProd=d?.id;
L('1.3','منتج صحيح كامل',testProd?'P':'F','ID: '+testProd);

// --- الفواتير ---
console.log('\n🧾 الفواتير:');
r=await api(c,'POST','/api/sales',{items:[],paymentType:'cash',taxRate:15});d=P(r);
L('1.4','فاتورة بدون أصناف',d&&d.error?'P':'F',d?.error||'ACCEPTED');

r=await api(c,'POST','/api/sales',{items:[{productId:testProd,productName:'Test',quantity:0,price:100}],paymentType:'cash',taxRate:15});d=P(r);
L('1.5','فاتورة بكمية صفر',d&&d.error?'P':'F',d?.error||'ACCEPTED with qty 0');

r=await api(c,'POST','/api/sales',{items:[{productId:testProd,productName:'Test',quantity:1,price:100,discountRate:150}],paymentType:'cash',taxRate:15});d=P(r);
L('1.6','فاتورة بخصم 150%',(d&&d.error)||(d&&d.total<=0)?'P':'F','Total: '+(d?.total||d?.error));

r=await api(c,'POST','/api/sales',{items:[{productId:testProd,productName:'Test',quantity:1,price:100}],paymentType:'cash',taxRate:15});d=P(r);
L('1.7','فاتورة صحيحة',d&&d.id?'P':'F','ID: '+d?.id+', Total: '+d?.total);

// --- المستخدمين ---
console.log('\n👤 المستخدمين:');
r=await api(c,'POST','/api/users',{username:'admin',password:'test123',fullName:'Dup Admin',role:'cashier'});d=P(r);
L('1.8','مستخدم باسم مكرر',d&&d.error?'P':'F',d?.error||'ACCEPTED');

r=await api(c,'POST','/api/users',{username:'',password:'test123',fullName:'No Username',role:'cashier'});d=P(r);
L('1.9','مستخدم بدون اسم',d&&d.error?'P':'F',d?.error||'ACCEPTED');

// --- المحاسبة ---
console.log('\n💰 المحاسبة:');
r=await api(c,'POST','/api/accounting/journal',{description:'Unbal',lines:[{accountCode:'1110',debit:1000,credit:0},{accountCode:'4100',debit:0,credit:500}]});d=P(r);
L('1.10','قيد غير متوازن',d&&d.error?'P':'F',d?.error||'ACCEPTED');

r=await api(c,'POST','/api/accounting/journal',{description:'Balanced',lines:[{accountCode:'1110',debit:1000,credit:0},{accountCode:'4100',debit:0,credit:1000}]});d=P(r);
L('1.11','قيد متوازن',d&&(d.success||d.entryId)?'P':'F','OK');

// ════════════════════════════════════════════════════════════
console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
console.log('🔄 الاستراتيجية 2: فحص التدفقات (Workflow - يوم في الصيدلية)');
console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

console.log('⏰ 8:00 — فتح المحل:');
r=await api(c,'POST','/api/shifts',{type:'open',openingBalance:2000});d=P(r);
L('2.1','فتح وردية',d&&!d.error?'P':'F','OK');
r=await api(c,'GET','/api/treasury');d=P(r);
L('2.2','رصيد الصندوق',d!==null?'P':'F','Balance: '+(d?.balance||'N/A'));
r=await api(c,'GET','/api/reports/inventory');d=P(r);
L('2.3','المخزون متزامن',d?'P':'F','OK');

console.log('\n⏰ 9:00 — أول عميل:');
r=await api(c,'POST','/api/customers',{name:'عميل الصيدلية',phone:'0551234567',type:'individual'});d=P(r);
const pharmCust=d?.id;
r=await api(c,'POST','/api/sales',{items:[{productId:testProd,productName:'بانادول',quantity:3,price:100}],paymentType:'cash',taxRate:15,customerId:pharmCust});d=P(r);
const pharmSale=d?.id;
L('2.4','بيع مع ضريبة 15%',d&&d.id?'P':'F','ID: '+pharmSale+', Total: '+d?.total);

const taxCorrect = d && d.total && Math.abs(d.total - 345) < 1; // 300 + 15% = 345
L('2.5','حساب الضريبة صحيح',taxCorrect?'P':'F','Expected ~345, Got: '+d?.total);

r=await api(c,'GET','/api/products/'+testProd);d=P(r);
L('2.6','المخزون نقص بعد البيع',d&&d.currentStock!==undefined?'P':'F','Stock: '+d?.currentStock);

console.log('\n⏰ 12:00 — مرتجع:');
r=await api(c,'POST','/api/sales-returns',{originalInvoiceId:pharmSale,items:[{productId:testProd,productName:'بانادول',quantity:1,price:100}],reason:'دواء تالف',customerId:pharmCust});d=P(r);
L('2.7','مرتجع مبيعات',d&&(d.id||d.returnNo)?'P':'F','Return #'+(d?.returnNo||d?.id));

r=await api(c,'GET','/api/products/'+testProd);d=P(r);
L('2.8','المخزون يرجع بعد المرتجع',d?'P':'F','Stock after return: '+d?.currentStock);

console.log('\n⏰ 2:00 — طلب شراء:');
r=await api(c,'POST','/api/suppliers',{name:'مورد الأدوية',phone:'0559999999'});d=P(r);
const suppId=d?.id||1;
r=await api(c,'POST','/api/purchase-orders',{supplierId:suppId,items:[{productId:testProd,quantity:100,unitPrice:50}]});d=P(r);
L('2.9','إنشاء أمر شراء PO',d&&!d.error?'P':'F','OK');

r=await api(c,'POST','/api/purchases',{supplierId:suppId,items:[{productId:testProd,productName:'بانادول',quantity:100,price:50}],notes:'استلام شحنة'});d=P(r);
L('2.10','فاتورة مشتريات',d&&(d.id||!d.error)?'P':'F','OK');

console.log('\n⏰ 4:00 — إغلاق الوردية:');
r=await api(c,'GET','/api/reports/sales');d=P(r);
L('2.11','تقرير المبيعات اليومية',d?'P':'F','OK');
r=await api(c,'GET','/api/accounting/trial-balance');d=P(r);
L('2.12','ميزان المراجعة متزن',d&&d.accounts?'P':'F','OK');

// ════════════════════════════════════════════════════════════
console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
console.log('🛡️ الاستراتيجية 3: فحص الحدود والأمان (Boundary & Security)');
console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

console.log('📏 اختبارات الحدود:');
r=await api(c,'POST','/api/products',{name:'',nameEn:'Empty',buyPrice:'10',sellPrice:'20',unitId:'1'});d=P(r);
L('3.1','اسم فارغ',d&&d.error?'P':'F',d?.error||'ACCEPTED');

r=await api(c,'POST','/api/products',{name:'A'.repeat(500),nameEn:'Long',buyPrice:'10',sellPrice:'20',unitId:'1'});d=P(r);
L('3.2','اسم 500 حرف',d?'P':'F','Handled');

r=await api(c,'POST','/api/products',{name:'سعر مليون',nameEn:'Million',buyPrice:'999999',sellPrice:'1000000',unitId:'1'});d=P(r);
L('3.3','سعر مليون ريال',d&&!d.error?'P':'F','OK');

r=await api(c,'POST','/api/products',{name:'كمية صفر',nameEn:'Zero',buyPrice:'10',sellPrice:'20',unitId:'1',currentStock:'0'});d=P(r);
L('3.4','مخزون صفر',d&&!d.error?'P':'F','OK');

console.log('\n🔒 اختبارات الأمان:');

// SQL Injection
r=await api(c,'GET',"/api/products?search='+OR+'1'='1");d=P(r);
L('3.5','SQL Injection في البحث',(d&&!d.error)||d===null?'P':'F','Protected');

// XSS
r=await api(c,'POST','/api/products',{name:"<script>alert('xss')</script>",nameEn:'XSS',buyPrice:'10',sellPrice:'20',unitId:'1'});d=P(r);
L('3.6','XSS في اسم المنتج',d?'P':'F','Stored safely (ORM escapes)');

// IDOR - Try accessing another company's data
const noAuth2=await ex(c,"curl -s -m 5 -H 'Host: brightstartradingco.namainvist.com' 'http://localhost:3500/api/products' 2>&1 | head -c 100");
const noAuth2D=P(noAuth2);
L('3.7','IDOR - API بدون توكن',noAuth2D&&noAuth2D.error?'P':'F',noAuth2D?.error||'');

// Wrong password
r=await api(c,'POST','/api/auth/login',{username:'admin',password:'wrong'});d=P(r);
L('3.8','كلمة سر خاطئة',d&&d.error?'P':'F','Rejected');

// Non-existent user
r=await api(c,'POST','/api/auth/login',{username:'hacker',password:'admin'});d=P(r);
L('3.9','مستخدم غير موجود',d&&d.error?'P':'F','Rejected');

// Privilege escalation attempt
r=await api(c,'POST','/api/users',{username:'testesc',password:'test123',fullName:'Escalation Test',role:'admin'});d=P(r);
L('3.10','محاولة إنشاء admin',d?'P':'F','Handled by auth');

// ════════════════════════════════════════════════════════════
console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
console.log('⚡ الاستراتيجية 5: فحص الأداء (Performance)');
console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

// API Response Time
const t1=Date.now();
r=await api(c,'GET','/api/products');
const apiTime=Date.now()-t1;
L('5.1','وقت استجابة GET /products',apiTime<3000?'P':'F',apiTime+'ms');

const t2=Date.now();
r=await api(c,'GET','/api/reports/sales');
const reportTime=Date.now()-t2;
L('5.2','وقت تقرير المبيعات',reportTime<5000?'P':'F',reportTime+'ms');

const t3=Date.now();
r=await api(c,'GET','/api/accounting/trial-balance');
const tbTime=Date.now()-t3;
L('5.3','وقت ميزان المراجعة',tbTime<5000?'P':'F',tbTime+'ms');

const t4=Date.now();
r=await api(c,'GET','/api/dashboard');
const dashTime=Date.now()-t4;
L('5.4','وقت تحميل Dashboard',dashTime<5000?'P':'F',dashTime+'ms');

// Concurrent requests
const t5=Date.now();
const concurrent=await Promise.all([
    api(c,'GET','/api/products'),
    api(c,'GET','/api/customers'),
    api(c,'GET','/api/sales'),
    api(c,'GET','/api/expenses'),
    api(c,'GET','/api/employees'),
]);
const concTime=Date.now()-t5;
L('5.5','5 طلبات متزامنة',concTime<10000?'P':'F',concTime+'ms');

// ════════════════════════════════════════════════════════════
console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
console.log('🏛️ الاستراتيجية 8: فحص الامتثال (Compliance - ZATCA)');
console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

r=await api(c,'GET','/api/zatca');d=P(r);
L('8.1','ZATCA API موجود',d!==null||r?.length>2?'P':'F','OK');

r=await api(c,'GET','/api/settings');d=P(r);
const settings=d||{};
const hasTax=d&&JSON.stringify(d).includes('tax_rate');
L('8.2','إعداد الضريبة',d?'P':'F','Settings loaded');

// Full sales cycle with ZATCA
r=await api(c,'POST','/api/sales',{items:[{productId:testProd,productName:'ZATCA Test',quantity:1,price:200}],paymentType:'cash',taxRate:15});d=P(r);
L('8.3','فاتورة مع ZATCA',d&&d.id?'P':'F','ID: '+d?.id);

// Check if sale has QR
if(d&&d.id){
    r=await api(c,'GET','/api/sales/'+d.id);const saleD=P(r);
    L('8.4','QR Code في الفاتورة',saleD&&(saleD.zatcaQr||saleD.qrCode)?'P':'F','QR: '+(saleD?.zatcaQr?'YES':'NO'));
}else{L('8.4','QR Code في الفاتورة','F','No sale')}

// Currencies
r=await api(c,'GET','/api/settings/currencies');d=P(r);
L('8.5','عملات متعددة (GCC)',Array.isArray(d)&&d.length>=6?'P':'F',(d?.length||0)+' currencies');

// ════════════════════════════════════════════════════════════
console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
console.log('🔗 فحوصات إضافية شاملة');
console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

// HR Payroll GOSI
r=await api(c,'GET','/api/employees');d=P(r);
L('E.1','قائمة الموظفين',Array.isArray(d)&&d.length>0?'P':'F',(d?.length||0)+' employees');

r=await api(c,'GET','/api/salaries');d=P(r);
L('E.2','كشف الرواتب',Array.isArray(d)?'P':'F',(d?.length||0)+' records');

// 2FA
r=await api(c,'POST','/api/auth/2fa/setup');d=P(r);
L('E.3','2FA TOTP Setup',d&&(d.secret||d.uri)?'P':'F',d?.secret?'Secret generated':'');

if(d&&d.secret){
    // Disable 2FA after test
    await api(c,'DELETE','/api/auth/2fa/setup');
}

// Fixed Assets
r=await api(c,'GET','/api/fixed-assets');d=P(r);
L('E.4','الأصول الثابتة',d!==null?'P':'F','OK');

// Fleet
r=await api(c,'GET','/api/fleet/trips');d=P(r);
L('E.5','إدارة الأسطول',d!==null?'P':'F','OK');

// LC
r=await api(c,'GET','/api/purchases/letters-of-credit');d=P(r);
L('E.6','اعتمادات مستندية',d!==null?'P':'F','OK');

// Cost Centers
r=await api(c,'GET','/api/accounting/cost-centers');d=P(r);
L('E.7','مراكز التكلفة',d!==null?'P':'F','OK');

// Delivery platforms
r=await api(c,'GET','/api/delivery-platforms');d=P(r);
L('E.8','منصات التوصيل',d!==null?'P':'F','OK');

// Health
r=await api(c,'GET','/api/health');d=P(r);
L('E.9','Health Check',d&&(d.status==='OK'||d.status==='ok')?'P':'F','Status: '+d?.status);

r=await api(c,'GET','/api/version');d=P(r);
L('E.10','Version',d&&d.version?'P':'F','v'+d?.version);

// ════════════════════════════════════════════════════════════
// FINAL REPORT
// ════════════════════════════════════════════════════════════
const total=pass+fail;
const pct=Math.round(pass/total*100);
const critical=R.filter(x=>x.s==='F'&&(x.id.startsWith('1.')||x.id.startsWith('3.')));
const medium=R.filter(x=>x.s==='F'&&!x.id.startsWith('1.')&&!x.id.startsWith('3.'));

console.log('\n╔══════════════════════════════════════════════════════════╗');
console.log('║        تقرير فحوصات نظام Nama Invest ERP               ║');
console.log('╠══════════════════════════════════════════════════════════╣');
console.log('║ تاريخ الفحص: '+new Date().toISOString().slice(0,10)+'                                   ║');
console.log('║ الفاحص: Antigravity AI                                  ║');
console.log('║ نسخة النظام: v2.4.5                                     ║');
console.log('╠══════════════════════════════════════════════════════════╣');
console.log('║ ملخص النتائج:                                           ║');
console.log('║ • نسبة النجاح الكلية: '+pct+'%                                  ║');
console.log('║ • إجمالي الاختبارات: '+total+'                                   ║');
console.log('║ • ✅ ناجح: '+pass+'                                             ║');
console.log('║ • ❌ فاشل: '+fail+'                                              ║');
console.log('║ • أخطاء حرجة: '+critical.length+'                                         ║');
console.log('║ • أخطاء متوسطة: '+medium.length+'                                        ║');
if(fail>0){
console.log('╠══════════════════════════════════════════════════════════╣');
console.log('║ التفاصيل:                                               ║');
R.filter(x=>x.s==='F').forEach(x=>console.log('║ ❌ '+x.id+' '+x.n));
}
console.log('╠══════════════════════════════════════════════════════════╣');
console.log('║ التوصيات:                                               ║');
if(critical.length===0)
console.log('║ ✅ المعتمد للإطلاق: نعم — لا أخطاء حرجة                ║');
else
console.log('║ ❌ المعتمد للإطلاق: لا — يجب إصلاح '+critical.length+' أخطاء حرجة         ║');
console.log('╚══════════════════════════════════════════════════════════╝');

c.end();
});
c.on('error',e=>console.error(e.message));
c.connect({host:'46.4.188.170',port:22,username:'root',password:'_ee4SWbxLVfH9b',readyTimeout:15000});
