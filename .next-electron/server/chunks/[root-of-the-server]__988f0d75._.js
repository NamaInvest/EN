;!function(){try { var e="undefined"!=typeof globalThis?globalThis:"undefined"!=typeof global?global:"undefined"!=typeof window?window:"undefined"!=typeof self?self:{},n=(new e.Error).stack;n&&((e._debugIds|| (e._debugIds={}))[n]="dedd60e4-f371-601b-f838-e44907eaab9c")}catch(e){}}();
module.exports=[254799,(e,t,r)=>{t.exports=e.x("crypto",()=>require("crypto"))},688947,(e,t,r)=>{t.exports=e.x("stream",()=>require("stream"))},141528,(e,t,r)=>{function c(e,t,r,c){return Math.round(e/r)+" "+c+(t>=1.5*r?"s":"")}t.exports=function(e,t){t=t||{};var r,n,a,o,i=typeof e;if("string"===i&&e.length>0){var s=e;if(!((s=String(s)).length>100)){var u=/^(-?(?:\d+)?\.?\d+) *(milliseconds?|msecs?|ms|seconds?|secs?|s|minutes?|mins?|m|hours?|hrs?|h|days?|d|weeks?|w|years?|yrs?|y)?$/i.exec(s);if(u){var d=parseFloat(u[1]);switch((u[2]||"ms").toLowerCase()){case"years":case"year":case"yrs":case"yr":case"y":return 315576e5*d;case"weeks":case"week":case"w":return 6048e5*d;case"days":case"day":case"d":return 864e5*d;case"hours":case"hour":case"hrs":case"hr":case"h":return 36e5*d;case"minutes":case"minute":case"mins":case"min":case"m":return 6e4*d;case"seconds":case"second":case"secs":case"sec":case"s":return 1e3*d;case"milliseconds":case"millisecond":case"msecs":case"msec":case"ms":return d;default:break}}}return}if("number"===i&&isFinite(e)){return t.long?(n=Math.abs(r=e))>=864e5?c(r,n,864e5,"day"):n>=36e5?c(r,n,36e5,"hour"):n>=6e4?c(r,n,6e4,"minute"):n>=1e3?c(r,n,1e3,"second"):r+" ms":(o=Math.abs(a=e))>=864e5?Math.round(a/864e5)+"d":o>=36e5?Math.round(a/36e5)+"h":o>=6e4?Math.round(a/6e4)+"m":o>=1e3?Math.round(a/1e3)+"s":a+"ms"}throw Error("val is not a non-empty string or a valid number. val="+JSON.stringify(e))}},193695,(e,t,r)=>{t.exports=e.x("next/dist/shared/lib/no-fallback-error.external.js",()=>require("next/dist/shared/lib/no-fallback-error.external.js"))},442315,(e,t,r)=>{"use strict";t.exports=e.r(918622)},347540,(e,t,r)=>{"use strict";t.exports=e.r(442315).vendored["react-rsc"].React},819481,(e,t,r)=>{"use strict";var c=Object.defineProperty,n=Object.getOwnPropertyDescriptor,a=Object.getOwnPropertyNames,o=Object.prototype.hasOwnProperty,i={},s={RequestCookies:()=>f,ResponseCookies:()=>y,parseCookie:()=>l,parseSetCookie:()=>p,stringifyCookie:()=>d};for(var u in s)c(i,u,{get:s[u],enumerable:!0});function d(e){var t;let r=["path"in e&&e.path&&`Path=${e.path}`,"expires"in e&&(e.expires||0===e.expires)&&`Expires=${("number"==typeof e.expires?new Date(e.expires):e.expires).toUTCString()}`,"maxAge"in e&&"number"==typeof e.maxAge&&`Max-Age=${e.maxAge}`,"domain"in e&&e.domain&&`Domain=${e.domain}`,"secure"in e&&e.secure&&"Secure","httpOnly"in e&&e.httpOnly&&"HttpOnly","sameSite"in e&&e.sameSite&&`SameSite=${e.sameSite}`,"partitioned"in e&&e.partitioned&&"Partitioned","priority"in e&&e.priority&&`Priority=${e.priority}`].filter(Boolean),c=`${e.name}=${encodeURIComponent(null!=(t=e.value)?t:"")}`;return 0===r.length?c:`${c}; ${r.join("; ")}`}function l(e){let t=new Map;for(let r of e.split(/; */)){if(!r)continue;let e=r.indexOf("=");if(-1===e){t.set(r,"true");continue}let[c,n]=[r.slice(0,e),r.slice(e+1)];try{t.set(c,decodeURIComponent(null!=n?n:"true"))}catch{}}return t}function p(e){if(!e)return;let[[t,r],...c]=l(e),{domain:n,expires:a,httponly:o,maxage:i,path:s,samesite:u,secure:d,partitioned:p,priority:f}=Object.fromEntries(c.map(([e,t])=>[e.toLowerCase().replace(/-/g,""),t]));{var y,h,g={name:t,value:decodeURIComponent(r),domain:n,...a&&{expires:new Date(a)},...o&&{httpOnly:!0},..."string"==typeof i&&{maxAge:Number(i)},path:s,...u&&{sameSite:m.includes(y=(y=u).toLowerCase())?y:void 0},...d&&{secure:!0},...f&&{priority:b.includes(h=(h=f).toLowerCase())?h:void 0},...p&&{partitioned:!0}};let e={};for(let t in g)g[t]&&(e[t]=g[t]);return e}}t.exports=((e,t,r,i)=>{if(t&&"object"==typeof t||"function"==typeof t)for(let r of a(t))o.call(e,r)||void 0===r||c(e,r,{get:()=>t[r],enumerable:!(i=n(t,r))||i.enumerable});return e})(c({},"__esModule",{value:!0}),i);var m=["strict","lax","none"],b=["low","medium","high"],f=class{constructor(e){this._parsed=new Map,this._headers=e;const t=e.get("cookie");if(t)for(const[e,r]of l(t))this._parsed.set(e,{name:e,value:r})}[Symbol.iterator](){return this._parsed[Symbol.iterator]()}get size(){return this._parsed.size}get(...e){let t="string"==typeof e[0]?e[0]:e[0].name;return this._parsed.get(t)}getAll(...e){var t;let r=Array.from(this._parsed);if(!e.length)return r.map(([e,t])=>t);let c="string"==typeof e[0]?e[0]:null==(t=e[0])?void 0:t.name;return r.filter(([e])=>e===c).map(([e,t])=>t)}has(e){return this._parsed.has(e)}set(...e){let[t,r]=1===e.length?[e[0].name,e[0].value]:e,c=this._parsed;return c.set(t,{name:t,value:r}),this._headers.set("cookie",Array.from(c).map(([e,t])=>d(t)).join("; ")),this}delete(e){let t=this._parsed,r=Array.isArray(e)?e.map(e=>t.delete(e)):t.delete(e);return this._headers.set("cookie",Array.from(t).map(([e,t])=>d(t)).join("; ")),r}clear(){return this.delete(Array.from(this._parsed.keys())),this}[Symbol.for("edge-runtime.inspect.custom")](){return`RequestCookies ${JSON.stringify(Object.fromEntries(this._parsed))}`}toString(){return[...this._parsed.values()].map(e=>`${e.name}=${encodeURIComponent(e.value)}`).join("; ")}},y=class{constructor(e){var t,r,c;this._parsed=new Map,this._headers=e;const n=null!=(c=null!=(r=null==(t=e.getSetCookie)?void 0:t.call(e))?r:e.get("set-cookie"))?c:[];for(const e of Array.isArray(n)?n:function(e){if(!e)return[];var t,r,c,n,a,o=[],i=0;function s(){for(;i<e.length&&/\s/.test(e.charAt(i));)i+=1;return i<e.length}for(;i<e.length;){for(t=i,a=!1;s();)if(","===(r=e.charAt(i))){for(c=i,i+=1,s(),n=i;i<e.length&&"="!==(r=e.charAt(i))&&";"!==r&&","!==r;)i+=1;i<e.length&&"="===e.charAt(i)?(a=!0,i=n,o.push(e.substring(t,c)),t=i):i=c+1}else i+=1;(!a||i>=e.length)&&o.push(e.substring(t,e.length))}return o}(n)){const t=p(e);t&&this._parsed.set(t.name,t)}}get(...e){let t="string"==typeof e[0]?e[0]:e[0].name;return this._parsed.get(t)}getAll(...e){var t;let r=Array.from(this._parsed.values());if(!e.length)return r;let c="string"==typeof e[0]?e[0]:null==(t=e[0])?void 0:t.name;return r.filter(e=>e.name===c)}has(e){return this._parsed.has(e)}set(...e){let[t,r,c]=1===e.length?[e[0].name,e[0].value,e[0]]:e,n=this._parsed;return n.set(t,function(e={name:"",value:""}){return"number"==typeof e.expires&&(e.expires=new Date(e.expires)),e.maxAge&&(e.expires=new Date(Date.now()+1e3*e.maxAge)),(null===e.path||void 0===e.path)&&(e.path="/"),e}({name:t,value:r,...c})),function(e,t){for(let[,r]of(t.delete("set-cookie"),e)){let e=d(r);t.append("set-cookie",e)}}(n,this._headers),this}delete(...e){let[t,r]="string"==typeof e[0]?[e[0]]:[e[0].name,e[0]];return this.set({...r,name:t,value:"",expires:new Date(0)})}[Symbol.for("edge-runtime.inspect.custom")](){return`ResponseCookies ${JSON.stringify(Object.fromEntries(this._parsed))}`}toString(){return[...this._parsed.values()].map(d).join("; ")}}},463021,(e,t,r)=>{t.exports=e.x("@prisma/client-2c3a283f134fdcb6",()=>require("@prisma/client-2c3a283f134fdcb6"))},410430,(e,t,r)=>{t.exports=e.x("async_hooks",()=>require("async_hooks"))},698043,e=>{"use strict";var t=e.i(463021),r=e.i(410430);let c=new r.AsyncLocalStorage,n=new Map;function a(e){let t=process.env.DATABASE_URL||"postgresql://postgres:RootPassNama123@localhost:5432/n11_db?schema=public";return"true"===process.env.DESKTOP_MODE?t:t.replace(/\/([^/?]+)(\?|$)/,`/${e}_db$2`)}function o(e){return n.has(e)||n.set(e,new t.PrismaClient({datasources:{db:{url:a(e)}},log:[]})),n.get(e)}let i=new r.AsyncLocalStorage;function s(t){if("true"===process.env.DESKTOP_MODE)return"local";let r=c.getStore();if(r)return r;let n=i.getStore();if(n)return n;try{if(t?.headers){let e="function"==typeof t.headers.get?t.headers.get("x-tenant"):t.headers["x-tenant"];if(e)return e}}catch{}try{let{headers:t}=e.r(493458),r=t();if(r&&"function"==typeof r.get){let e=r.get("x-tenant");if(e&&"string"==typeof e)return e}}catch{}return process.env.TENANT?process.env.TENANT:process.env.DEFAULT_TENANT?process.env.DEFAULT_TENANT:"n11"}function u(e){return o(s(e))}async function d(e,t){return c.run(e,t)}let l=new Proxy({},{get(e,t){let r=c.getStore()||i.getStore();r||(r=function(){try{let e=globalThis.__NEXT_REQUEST_CONTEXT__?.get?.();if(e?.headers){let t=e.headers.get?.("x-tenant")||e.headers["x-tenant"];if(t&&"string"==typeof t)return t}}catch{}return null}()),r||(r=process.env.TENANT||process.env.DEFAULT_TENANT||"n11");let n=o(r),a=n[t];return"function"==typeof a?a.bind(n):a}});e.s(["currentRequestStore",0,i,"default",0,l,"getClient",()=>o,"getDbUrl",()=>a,"getPrisma",()=>u,"getTenantPrisma",0,u,"prisma",()=>l,"resolveTenant",()=>s,"tenantContext",0,c,"withTenant",()=>d])},918622,(e,t,r)=>{t.exports=e.x("next/dist/compiled/next-server/app-page-turbo.runtime.prod.js",()=>require("next/dist/compiled/next-server/app-page-turbo.runtime.prod.js"))},556704,(e,t,r)=>{t.exports=e.x("next/dist/server/app-render/work-async-storage.external.js",()=>require("next/dist/server/app-render/work-async-storage.external.js"))},832319,(e,t,r)=>{t.exports=e.x("next/dist/server/app-render/work-unit-async-storage.external.js",()=>require("next/dist/server/app-render/work-unit-async-storage.external.js"))},324725,(e,t,r)=>{t.exports=e.x("next/dist/server/app-render/after-task-async-storage.external.js",()=>require("next/dist/server/app-render/after-task-async-storage.external.js"))},224361,(e,t,r)=>{t.exports=e.x("util",()=>require("util"))},500874,(e,t,r)=>{t.exports=e.x("buffer",()=>require("buffer"))},675418,e=>{"use strict";var t=e.i(89171);let r={P2002:"البيانات موجودة مسبقاً (تكرار)",P2025:"السجل المطلوب غير موجود",P2003:"خطأ في العلاقات — تأكد من صحة المراجع",P2014:"هذه البيانات مرتبطة بسجلات أخرى",P2016:"خطأ في الاستعلام",P2021:"الجدول غير موجود",P2022:"العمود غير موجود"};function c(e,n="حدث خطأ في المعالجة، يرجى المحاولة لاحقاً",a={}){let o=a.context?`[${a.context}]`:"[API]";console.error(`${o} Error:`,e);let i=e?.code;return i&&r[i]?t.NextResponse.json({error:r[i]},{status:a.status||400}):e?.isKnownError===!0&&e?.message?t.NextResponse.json({error:e.message},{status:a.status||400}):t.NextResponse.json({error:n},{status:a.status||500})}e.s(["apiError",()=>c])},200164,e=>{"use strict";var t=e.i(698043);let r="1110",c="1120",n="1300",a="1310",o="1400",i="2100",s="2300",u="5120",d="5200";async function l(e){let r=await t.default.account.findFirst({where:{code:e}});return r?.id||null}async function p(){let e=await t.default.journalEntry.findFirst({orderBy:{id:"desc"}}),r=e?parseInt(e.entryNumber.replace("JE","")):0;return`JE${(r+1).toString().padStart(6,"0")}`}async function m(e){try{let r=e.lines.reduce((e,t)=>e+t.debit,0),c=e.lines.reduce((e,t)=>e+t.credit,0);if(Math.abs(r-c)>.01)return{success:!1,error:`القيد غير متوازن: مدين ${r} ≠ دائن ${c}`};let n=[];for(let t of e.lines){if(0===t.debit&&0===t.credit&&0===(t.foreignDebit||0)&&0===(t.foreignCredit||0))continue;let e=await l(t.accountCode);if(!e)return{success:!1,error:`حساب غير موجود: ${t.accountCode}`};n.push({accountId:e,costCenterId:t.costCenterId,debit:t.debit,credit:t.credit,foreignDebit:t.foreignDebit||t.debit,foreignCredit:t.foreignCredit||t.credit,description:t.description})}let a=await p(),o=e.date||new Date().toISOString().split("T")[0],i=await t.default.journalEntry.create({data:{entryNumber:a,entryDate:o,description:e.description,reference:e.reference,totalDebit:Math.round(100*r)/100,totalCredit:Math.round(100*c)/100,status:"posted",createdBy:e.userId,branchId:e.branchId,currencyId:e.currencyId||null,exchangeRate:e.exchangeRate||1,lines:{create:n.map(e=>({accountId:e.accountId,costCenterId:e.costCenterId||null,debit:Math.round(100*e.debit)/100,credit:Math.round(100*e.credit)/100,foreignDebit:Math.round(100*e.foreignDebit)/100,foreignCredit:Math.round(100*e.foreignCredit)/100,description:e.description}))}}});for(let e of n){let r=await t.default.account.findUnique({where:{id:e.accountId}});if(r){let c=0;c=["asset","expense"].includes(r.type)?e.debit-e.credit:e.credit-e.debit,await t.default.account.update({where:{id:e.accountId},data:{balance:{increment:Math.round(100*c)/100}}})}}return{success:!0,entryId:i.id}}catch(e){return console.error("Auto-journal error:",e),{success:!1,error:String(e)}}}async function b(e){let t=[];if("split"===e.paymentType)e.splitCash&&e.splitCash>0&&t.push({accountCode:r,debit:e.splitCash,credit:0,description:`تحصيل نقدي - فاتورة بيع #${e.invoiceNo}`}),e.splitCard&&e.splitCard>0&&t.push({accountCode:c,debit:e.splitCard,credit:0,description:`تحصيل شبكة - فاتورة بيع #${e.invoiceNo}`});else{let n="cash"===e.paymentType?r:"bank"===e.paymentType?c:"1200";t.push({accountCode:n,debit:e.total,credit:0,description:`تحصيل فاتورة بيع #${e.invoiceNo}`})}let n=e.subtotal-(e.discountValue||0);return t.push({accountCode:"4100",debit:0,credit:n,description:`مبيعات فاتورة #${e.invoiceNo}`}),e.taxValue>0&&t.push({accountCode:s,debit:0,credit:e.taxValue,description:`ضريبة مبيعات فاتورة #${e.invoiceNo}`}),e.discountValue&&e.discountValue>0&&t.push({accountCode:"4120",debit:e.discountValue,credit:0,description:`خصم فاتورة بيع #${e.invoiceNo}`}),m({description:`فاتورة بيع #${e.invoiceNo}`,reference:`SALE-${e.invoiceNo}`,lines:t,userId:e.userId,branchId:e.branchId,date:e.date})}async function f(e){let t=[],n="cash"===e.paymentType?r:"bank"===e.paymentType?c:i,a=0;if(e.landedCosts&&e.landedCosts.length>0)for(let r of e.landedCosts)a+=r.amountValue,t.push({accountCode:r.accountCode,debit:0,credit:r.amountValue,description:`توزيع تكلفة: ${r.description} لفاتورة #${e.invoiceNo}`});return t.push({accountCode:"5100",debit:e.subtotal+a,credit:0,description:`مشتريات فاتورة #${e.invoiceNo} ${a>0?"(متضمنة تكاليف الاستيراد)":""}`}),e.taxValue>0&&t.push({accountCode:o,debit:e.taxValue,credit:0,description:`ضريبة مشتريات فاتورة #${e.invoiceNo}`}),t.push({accountCode:n,debit:0,credit:e.total,description:`سداد فاتورة شراء #${e.invoiceNo}`}),m({description:`فاتورة شراء #${e.invoiceNo}`,reference:`PUR-${e.invoiceNo}`,lines:t,userId:e.userId,branchId:e.branchId,date:e.date})}async function y(e){let t={رواتب:d,إيجار:"5300",كهرباء:"5400",اتصالات:"5500",صيانة:"5600",تسويق:"5700",إدارية:"5800"}[e.category]||"5950";return m({description:`مصروف: ${e.description}`,reference:`EXP-${e.id}`,lines:[{accountCode:t,costCenterId:e.costCenterId||void 0,debit:e.amount,credit:0,description:e.description},{accountCode:r,debit:0,credit:e.amount,description:`سداد مصروف #${e.id}`}],userId:e.userId,branchId:e.branchId,date:e.date})}async function h(e){let t=e.total-e.taxValue;return m({description:`مرتجع مبيعات #${e.returnNo}`,reference:`SRET-${e.returnNo}`,lines:[{accountCode:"4110",debit:t,credit:0},{accountCode:s,debit:e.taxValue,credit:0},{accountCode:r,debit:0,credit:e.total}],userId:e.userId,branchId:e.branchId,date:e.date})}async function g(e){return m({description:`راتب ${e.employeeName}`,reference:`SAL-${Date.now()}`,lines:[{accountCode:d,debit:e.netSalary,credit:0,description:`راتب ${e.employeeName}`},{accountCode:r,debit:0,credit:e.netSalary,description:`سداد راتب ${e.employeeName}`}],userId:e.userId,branchId:e.branchId,date:e.date})}async function x(e){let t=[];return"transit_out"===e.type?(t.push({accountCode:a,debit:e.totalCost,credit:0,description:`إرسال بضاعة للفرع الهدف: ${e.productName}`}),t.push({accountCode:n,debit:0,credit:e.totalCost,description:`مخزون صادر بالطريق: ${e.productName}`})):(t.push({accountCode:n,debit:e.totalCost,credit:0,description:`استلام بضاعة محولة: ${e.productName}`}),t.push({accountCode:a,debit:0,credit:e.totalCost,description:`إقفال حساب بضاعة بالطريق: ${e.productName}`})),m({description:`حركة تحويل مخزوني رقم #${e.movementId} - ${"transit_out"===e.type?"إرسال":"استلام"}`,reference:e.reference,lines:t,userId:e.userId,branchId:e.branchId,date:e.date||new Date().toISOString().split("T")[0]})}async function I(e){let t="cash"===e.paymentType?r:"bank"===e.paymentType?c:i;return m({description:`مرتجع مشتريات #${e.returnNo}`,reference:`PRET-${e.returnNo}`,lines:[{accountCode:t,debit:e.total,credit:0,description:`استرداد نقدي لمرتجع مشتريات #${e.returnNo}`},{accountCode:n,debit:0,credit:e.subtotal,description:`نقص مخزون بسبب الاسترجاع #${e.returnNo}`},{accountCode:o,debit:0,credit:e.taxValue,description:`عكس ضريبة المدخلات لمرتجع #${e.returnNo}`}],userId:e.userId,branchId:e.branchId,date:e.date})}async function C(e){let t=[],r=Math.abs(e.diffCost);return e.diffCost>0?(t.push({accountCode:n,debit:r,credit:0,description:`زيادة تسوية جردية: ${e.reason}`}),t.push({accountCode:u,debit:0,credit:r,description:`إيراد عرضي من تسوية مخزون: ${e.reason}`})):(t.push({accountCode:u,debit:r,credit:0,description:`خسارة تسوية عجز: ${e.reason}`}),t.push({accountCode:n,debit:0,credit:r,description:`نقص تسوية جردية: ${e.reason}`})),m({description:`تسوية أصدة مستودع (الجرد)`,reference:`ADJ-${Date.now()}`,lines:t,userId:e.userId,branchId:e.branchId,date:e.date})}async function v(e){return m({description:`سند إدخال مخزني #${e.grnNo} من ${e.supplierName||"مورد"}`,reference:`GRN-${e.grnNo}`,lines:[{accountCode:n,debit:e.totalCost,credit:0,description:`استلام مخزون وارد سند ادخال #${e.grnNo}`},{accountCode:"2110",debit:0,credit:e.totalCost,description:`استحقاق استلام بضاعة غير مفوترة #${e.grnNo}`}],userId:e.userId,branchId:e.branchId,date:e.date})}e.s(["createJournalEntry",()=>m,"postExpense",()=>y,"postGRN",()=>v,"postInventoryAdjustment",()=>C,"postPurchaseInvoice",()=>f,"postPurchaseReturn",()=>I,"postSalary",()=>g,"postSalesInvoice",()=>b,"postSalesReturn",()=>h,"postStockTransfer",()=>x])},755168,(e,t,r)=>{t.exports=e.x("pg-587764f78a6c7a9c",()=>require("pg-587764f78a6c7a9c"))},395056,e=>{"use strict";let t=e=>Math.round(100*e)/100;function r(e,c="المبلغ",n={}){let{allowNegative:a=!1,maxValue:o=0x3b9ac9ff}=n,i=Number(e);if(isNaN(i)||!isFinite(i))throw Error(`${c} غير صالح`);if(!a&&i<0)throw Error(`${c} لا يمكن أن يكون سالباً`);if(i>o)throw Error(`${c} تجاوز الحد الأقصى (${o.toLocaleString()})`);return t(i)}e.s(["round2",0,t,"validateMoney",()=>r])},106025,e=>{"use strict";var t=e.i(698043);async function r(e,r){let c=e?Number(e):1,n=await t.default.stock.findUnique({where:{id:c},select:{branchId:!0}});return{stockId:c,branchId:n?.branchId??r??null}}async function c(){let e=await t.default.branch.findFirst({where:{isActive:!0},orderBy:{id:"asc"},select:{id:!0}});return e?.id??null}e.s(["getMainBranchId",()=>c,"resolveStockAndBranch",()=>r])},226993,e=>{"use strict";var t=e.i(89171);async function r(t,r){try{let{Pool:c}=e.r(755168),n=new c({connectionString:process.env.MASTER_DB_URL||"postgresql://n11_db:n11_pass123@localhost:5432/n11_db"}),a=null;try{a=(await n.query(`SELECT subscription_status, plan, trial_ends_at, invoice_quota, product_quota, user_quota
                 FROM tenant_accounts WHERE subdomain = $1 LIMIT 1`,[t])).rows[0]||null}finally{await n.end()}if(!a)return{allowed:!0,reason:"ok"};let o=a.subscription_status,i=a.plan||"free";if(("basic"===i||"professional"===i||"enterprise"===i)&&"user"!==r)return{allowed:!0,reason:"ok",plan:i};if("trial"===o&&a.trial_ends_at){let e=new Date,t=new Date(a.trial_ends_at);if(e>t)return{allowed:!1,reason:"trial_expired",plan:i,message:"انتهت الفترة التجريبية. قم بالترقية لمتابعة الاستخدام."}}let s=new c({connectionString:`postgresql://n11_db:n11_pass123@localhost:5432/${t}_db`}),u=0,d=0;try{if("invoice"===r){d=a.invoice_quota||30;let e=await s.query("SELECT COUNT(*) as cnt FROM sales_invoices");u=parseInt(e.rows[0]?.cnt||"0")}else if("product"===r){d=a.product_quota||1e3;let e=await s.query("SELECT COUNT(*) as cnt FROM products WHERE active = true");u=parseInt(e.rows[0]?.cnt||"0")}else if("user"===r){d=a.user_quota??1;let e=await s.query("SELECT COUNT(*) as cnt FROM users");u=parseInt(e.rows[0]?.cnt||"0")}}finally{await s.end()}if(u>=d)return{allowed:!1,reason:"quota_exceeded",resource:r,limit:d,current:u,plan:i,message:"invoice"===r?`وصلت للحد الأقصى من الفواتير (${d}). قم بالترقية لإصدار فواتير غير محدودة.`:"product"===r?`وصلت للحد الأقصى من الأصناف (${d}). قم بالترقية لإضافة أصناف غير محدودة.`:`وصلت للحد الأقصى من المستخدمين (${d}). قم بالترقية لإضافة مستخدمين إضافيين.`};return{allowed:!0,reason:"ok",plan:i,limit:d,current:u}}catch(e){return console.error("[quotaGuard] Error:",e),{allowed:!0,reason:"ok"}}}function c(e){return t.NextResponse.json({error:"trial_expired"===e.reason?"trial_expired":"quota_exceeded",message:e.message||"تجاوزت الحد المسموح في خطتك الحالية.",resource:e.resource,limit:e.limit,current:e.current,plan:e.plan,upgradeUrl:"https://namainvist.com/pricing"},{status:402})}e.s(["checkQuota",()=>r,"quotaErrorResponse",()=>c])},137705,e=>{"use strict";function t(e,t){let r=Buffer.from(t,"utf-8"),c=Buffer.from([e]),n=Buffer.from([r.length]);return Buffer.concat([c,n,r])}function r(e){let r=[t(1,e.sellerName),t(2,e.vatNumber),t(3,e.timestamp),t(4,e.totalWithVat.toFixed(2)),t(5,e.vatAmount.toFixed(2))];return Buffer.concat(r).toString("base64")}function c(e){let t=e.supplier.address.countryCode||"SA",r=e.customer.address.countryCode||"SA",c=e.invoiceLines.map(e=>{let t=parseFloat(e.lineExtensionAmount).toFixed(2),r=(parseFloat(e.lineExtensionAmount)*(parseFloat(e.taxPercent)/100)).toFixed(2);return`
    <cac:InvoiceLine>
      <cbc:ID>${n(e.id)}</cbc:ID>
      <cbc:InvoicedQuantity unitCode="${n(e.unitCode)}">${n(e.quantity)}</cbc:InvoicedQuantity>
      <cbc:LineExtensionAmount currencyID="SAR">${n(t)}</cbc:LineExtensionAmount>
      <cac:TaxTotal>
        <cbc:TaxAmount currencyID="SAR">${n(r)}</cbc:TaxAmount>
        <cbc:RoundingAmount currencyID="SAR">${n((parseFloat(t)+parseFloat(r)).toFixed(2))}</cbc:RoundingAmount>
      </cac:TaxTotal>
      <cac:Item>
        <cbc:Name>${n(e.itemName)}</cbc:Name>
        <cac:ClassifiedTaxCategory>
          <cbc:ID>S</cbc:ID>
          <cbc:Percent>${n(e.taxPercent)}</cbc:Percent>
          <cac:TaxScheme>
            <cbc:ID>VAT</cbc:ID>
          </cac:TaxScheme>
        </cac:ClassifiedTaxCategory>
      </cac:Item>
      <cac:Price>
        <cbc:PriceAmount currencyID="SAR">${n(t)}</cbc:PriceAmount>
      </cac:Price>
    </cac:InvoiceLine>`}).join(""),a=parseFloat(e.taxAmount),o=(parseFloat(e.totalAmount)-a).toFixed(2);return`<?xml version="1.0" encoding="UTF-8"?>
<Invoice xmlns="urn:oasis:names:specification:ubl:schema:xsd:Invoice-2" xmlns:cac="urn:oasis:names:specification:ubl:schema:xsd:CommonAggregateComponents-2" xmlns:cbc="urn:oasis:names:specification:ubl:schema:xsd:CommonBasicComponents-2" xmlns:ext="urn:oasis:names:specification:ubl:schema:xsd:CommonExtensionComponents-2">
  <ext:UBLExtensions>SET_UBL_EXTENSIONS_STRING</ext:UBLExtensions>
  <cbc:ProfileID>${n(e.profileID)}</cbc:ProfileID>
  <cbc:ID>${n(e.id)}</cbc:ID>
  <cbc:UUID>${n(e.uuid)}</cbc:UUID>
  <cbc:IssueDate>${n(e.issueDate)}</cbc:IssueDate>
  <cbc:IssueTime>${n(e.issueTime)}</cbc:IssueTime>
  <cbc:InvoiceTypeCode name="${n(e.invoiceTypeName)}">${n(e.invoiceTypeCode)}</cbc:InvoiceTypeCode>
  <cbc:DocumentCurrencyCode>${n(e.currencyCode)}</cbc:DocumentCurrencyCode>
  <cbc:TaxCurrencyCode>${n(e.taxCurrencyCode)}</cbc:TaxCurrencyCode>
  ${"381"===e.invoiceTypeCode||"383"===e.invoiceTypeCode?`
  <cac:BillingReference>
    <cac:InvoiceDocumentReference>
      <cbc:ID>INV-123456</cbc:ID>
    </cac:InvoiceDocumentReference>
  </cac:BillingReference>`:""}
  <cac:AdditionalDocumentReference>
    <cbc:ID>ICV</cbc:ID>
    <cbc:UUID>1</cbc:UUID>
  </cac:AdditionalDocumentReference>
  <cac:AdditionalDocumentReference>
    <cbc:ID>PIH</cbc:ID>
    <cac:Attachment>
      <cbc:EmbeddedDocumentBinaryObject mimeCode="text/plain">NWZlY2ViNjZmZmM4NmYzOGQ5NTI3ODZjNmQ2OTZjNzljMmRiYzIzOWRkNGU5MWI0NjcyOWQ3M2EyN2ZiNTdlOQ==</cbc:EmbeddedDocumentBinaryObject>
    </cac:Attachment>
  </cac:AdditionalDocumentReference>
  <cac:AdditionalDocumentReference>
    <cbc:ID>QR</cbc:ID>
    <cac:Attachment>
      <cbc:EmbeddedDocumentBinaryObject mimeCode="text/plain">SET_QR_CODE_DATA</cbc:EmbeddedDocumentBinaryObject>
    </cac:Attachment>
  </cac:AdditionalDocumentReference>
  <cac:Signature>
    <cbc:ID>urn:oasis:names:specification:ubl:signature:Invoice</cbc:ID>
    <cbc:SignatureMethod>urn:oasis:names:specification:ubl:dsig:enveloped:xades</cbc:SignatureMethod>
  </cac:Signature>
  <cac:AccountingSupplierParty>
    <cac:Party>
      <cac:PartyIdentification>
        <cbc:ID schemeID="CRN">${n(e.supplier.companyID)}</cbc:ID>
      </cac:PartyIdentification>
      <cac:PostalAddress>
        <cbc:StreetName>${n(e.supplier.address.streetName)}</cbc:StreetName>
        <cbc:BuildingNumber>${n(e.supplier.address.buildingNumber)}</cbc:BuildingNumber>
        <cbc:CitySubdivisionName>${n(e.supplier.address.citySubdivisionName)}</cbc:CitySubdivisionName>
        <cbc:CityName>${n(e.supplier.address.cityName)}</cbc:CityName>
        <cbc:PostalZone>${n(e.supplier.address.postalZone)}</cbc:PostalZone>
        <cac:Country>
          <cbc:IdentificationCode>${n(t)}</cbc:IdentificationCode>
        </cac:Country>
      </cac:PostalAddress>
      <cac:PartyTaxScheme>
        <cbc:CompanyID>${n(e.supplier.registrationName)}</cbc:CompanyID>
        <cac:TaxScheme>
          <cbc:ID>VAT</cbc:ID>
        </cac:TaxScheme>
      </cac:PartyTaxScheme>
      <cac:PartyLegalEntity>
        <cbc:RegistrationName>${n(e.supplier.registrationName||"Seller")}</cbc:RegistrationName>
      </cac:PartyLegalEntity>
    </cac:Party>
  </cac:AccountingSupplierParty>
  <cac:AccountingCustomerParty>
    <cac:Party>
      <cac:PartyIdentification>
        <cbc:ID schemeID="NAT">1323211234</cbc:ID>
      </cac:PartyIdentification>
      <cac:PostalAddress>
        <cbc:StreetName>${n(e.customer.address.streetName)}</cbc:StreetName>
        <cbc:BuildingNumber>${n(e.customer.address.buildingNumber)}</cbc:BuildingNumber>
        <cbc:CitySubdivisionName>${n(e.customer.address.citySubdivisionName)}</cbc:CitySubdivisionName>
        <cbc:CityName>${n(e.customer.address.cityName)}</cbc:CityName>
        <cbc:PostalZone>${n(e.customer.address.postalZone)}</cbc:PostalZone>
        <cac:Country>
          <cbc:IdentificationCode>${n(r)}</cbc:IdentificationCode>
        </cac:Country>
      </cac:PostalAddress>
      <cac:PartyTaxScheme>
        <cbc:CompanyID>${n(e.customer.companyID)}</cbc:CompanyID>
        <cac:TaxScheme>
          <cbc:ID>VAT</cbc:ID>
        </cac:TaxScheme>
      </cac:PartyTaxScheme>
      <cac:PartyLegalEntity>
        <cbc:RegistrationName>${n(e.customer.registrationName||"Customer")}</cbc:RegistrationName>
      </cac:PartyLegalEntity>
    </cac:Party>
  </cac:AccountingCustomerParty>
  <cac:Delivery>
    <cbc:ActualDeliveryDate>${n(e.issueDate)}</cbc:ActualDeliveryDate>
  </cac:Delivery>
  ${"381"===e.invoiceTypeCode||"383"===e.invoiceTypeCode?`
  <cac:PaymentMeans>
    <cbc:PaymentMeansCode>10</cbc:PaymentMeansCode>
    <cbc:InstructionNote>Compliance Test Reason</cbc:InstructionNote>
  </cac:PaymentMeans>`:""}
  <cac:TaxTotal>
    <cbc:TaxAmount currencyID="SAR">${n(e.taxAmount)}</cbc:TaxAmount>
    <cac:TaxSubtotal>
      <cbc:TaxableAmount currencyID="SAR">${n(o)}</cbc:TaxableAmount>
      <cbc:TaxAmount currencyID="SAR">${n(e.taxAmount)}</cbc:TaxAmount>
      <cac:TaxCategory>
        <cbc:ID>S</cbc:ID>
        <cbc:Percent>15.00</cbc:Percent>
        <cac:TaxScheme>
          <cbc:ID>VAT</cbc:ID>
        </cac:TaxScheme>
      </cac:TaxCategory>
    </cac:TaxSubtotal>
  </cac:TaxTotal>
  <cac:LegalMonetaryTotal>
    <cbc:LineExtensionAmount currencyID="SAR">${n(o)}</cbc:LineExtensionAmount>
    <cbc:TaxExclusiveAmount currencyID="SAR">${n(o)}</cbc:TaxExclusiveAmount>
    <cbc:TaxInclusiveAmount currencyID="SAR">${n(e.totalAmount)}</cbc:TaxInclusiveAmount>
    <cbc:AllowanceTotalAmount currencyID="SAR">0.00</cbc:AllowanceTotalAmount>
    <cbc:ChargeTotalAmount currencyID="SAR">0.00</cbc:ChargeTotalAmount>
    <cbc:PayableAmount currencyID="SAR">${n(e.totalAmount)}</cbc:PayableAmount>
  </cac:LegalMonetaryTotal>
  ${c}
</Invoice>`}function n(e){return e.replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;").replace(/"/g,"&quot;").replace(/'/g,"&apos;")}e.i(254799),e.s(["generateZATCAXml",()=>c,"generateZatcaQRContent",()=>r])},94743,e=>{e.v(t=>Promise.all(["server/chunks/[root-of-the-server]__c968cf1e._.js","server/chunks/[root-of-the-server]__29adc2e3._.js","server/chunks/[root-of-the-server]__bdb49646._.js"].map(t=>e.l(t))).then(()=>t(586856)))}];

//# debugId=dedd60e4-f371-601b-f838-e44907eaab9c
//# sourceMappingURL=%5Broot-of-the-server%5D__988f0d75._.js.map