;!function(){try { var e="undefined"!=typeof globalThis?globalThis:"undefined"!=typeof global?global:"undefined"!=typeof window?window:"undefined"!=typeof self?self:{},n=(new e.Error).stack;n&&((e._debugIds|| (e._debugIds={}))[n]="97b877b3-73cc-833c-6e28-5d735e13cbb2")}catch(e){}}();
module.exports=[918622,(e,t,c)=>{t.exports=e.x("next/dist/compiled/next-server/app-page-turbo.runtime.prod.js",()=>require("next/dist/compiled/next-server/app-page-turbo.runtime.prod.js"))},556704,(e,t,c)=>{t.exports=e.x("next/dist/server/app-render/work-async-storage.external.js",()=>require("next/dist/server/app-render/work-async-storage.external.js"))},832319,(e,t,c)=>{t.exports=e.x("next/dist/server/app-render/work-unit-async-storage.external.js",()=>require("next/dist/server/app-render/work-unit-async-storage.external.js"))},324725,(e,t,c)=>{t.exports=e.x("next/dist/server/app-render/after-task-async-storage.external.js",()=>require("next/dist/server/app-render/after-task-async-storage.external.js"))},224361,(e,t,c)=>{t.exports=e.x("util",()=>require("util"))},814747,(e,t,c)=>{t.exports=e.x("path",()=>require("path"))},254799,(e,t,c)=>{t.exports=e.x("crypto",()=>require("crypto"))},688947,(e,t,c)=>{t.exports=e.x("stream",()=>require("stream"))},141528,(e,t,c)=>{function r(e,t,c,r){return Math.round(e/c)+" "+r+(t>=1.5*c?"s":"")}t.exports=function(e,t){t=t||{};var c,a,n,s,o=typeof e;if("string"===o&&e.length>0){var i=e;if(!((i=String(i)).length>100)){var u=/^(-?(?:\d+)?\.?\d+) *(milliseconds?|msecs?|ms|seconds?|secs?|s|minutes?|mins?|m|hours?|hrs?|h|days?|d|weeks?|w|years?|yrs?|y)?$/i.exec(i);if(u){var l=parseFloat(u[1]);switch((u[2]||"ms").toLowerCase()){case"years":case"year":case"yrs":case"yr":case"y":return 315576e5*l;case"weeks":case"week":case"w":return 6048e5*l;case"days":case"day":case"d":return 864e5*l;case"hours":case"hour":case"hrs":case"hr":case"h":return 36e5*l;case"minutes":case"minute":case"mins":case"min":case"m":return 6e4*l;case"seconds":case"second":case"secs":case"sec":case"s":return 1e3*l;case"milliseconds":case"millisecond":case"msecs":case"msec":case"ms":return l;default:break}}}return}if("number"===o&&isFinite(e)){return t.long?(a=Math.abs(c=e))>=864e5?r(c,a,864e5,"day"):a>=36e5?r(c,a,36e5,"hour"):a>=6e4?r(c,a,6e4,"minute"):a>=1e3?r(c,a,1e3,"second"):c+" ms":(s=Math.abs(n=e))>=864e5?Math.round(n/864e5)+"d":s>=36e5?Math.round(n/36e5)+"h":s>=6e4?Math.round(n/6e4)+"m":s>=1e3?Math.round(n/1e3)+"s":n+"ms"}throw Error("val is not a non-empty string or a valid number. val="+JSON.stringify(e))}},193695,(e,t,c)=>{t.exports=e.x("next/dist/shared/lib/no-fallback-error.external.js",()=>require("next/dist/shared/lib/no-fallback-error.external.js"))},442315,(e,t,c)=>{"use strict";t.exports=e.r(918622)},347540,(e,t,c)=>{"use strict";t.exports=e.r(442315).vendored["react-rsc"].React},819481,(e,t,c)=>{"use strict";var r=Object.defineProperty,a=Object.getOwnPropertyDescriptor,n=Object.getOwnPropertyNames,s=Object.prototype.hasOwnProperty,o={},i={RequestCookies:()=>y,ResponseCookies:()=>x,parseCookie:()=>m,parseSetCookie:()=>d,stringifyCookie:()=>l};for(var u in i)r(o,u,{get:i[u],enumerable:!0});function l(e){var t;let c=["path"in e&&e.path&&`Path=${e.path}`,"expires"in e&&(e.expires||0===e.expires)&&`Expires=${("number"==typeof e.expires?new Date(e.expires):e.expires).toUTCString()}`,"maxAge"in e&&"number"==typeof e.maxAge&&`Max-Age=${e.maxAge}`,"domain"in e&&e.domain&&`Domain=${e.domain}`,"secure"in e&&e.secure&&"Secure","httpOnly"in e&&e.httpOnly&&"HttpOnly","sameSite"in e&&e.sameSite&&`SameSite=${e.sameSite}`,"partitioned"in e&&e.partitioned&&"Partitioned","priority"in e&&e.priority&&`Priority=${e.priority}`].filter(Boolean),r=`${e.name}=${encodeURIComponent(null!=(t=e.value)?t:"")}`;return 0===c.length?r:`${r}; ${c.join("; ")}`}function m(e){let t=new Map;for(let c of e.split(/; */)){if(!c)continue;let e=c.indexOf("=");if(-1===e){t.set(c,"true");continue}let[r,a]=[c.slice(0,e),c.slice(e+1)];try{t.set(r,decodeURIComponent(null!=a?a:"true"))}catch{}}return t}function d(e){if(!e)return;let[[t,c],...r]=m(e),{domain:a,expires:n,httponly:s,maxage:o,path:i,samesite:u,secure:l,partitioned:d,priority:y}=Object.fromEntries(r.map(([e,t])=>[e.toLowerCase().replace(/-/g,""),t]));{var x,f,g={name:t,value:decodeURIComponent(c),domain:a,...n&&{expires:new Date(n)},...s&&{httpOnly:!0},..."string"==typeof o&&{maxAge:Number(o)},path:i,...u&&{sameSite:p.includes(x=(x=u).toLowerCase())?x:void 0},...l&&{secure:!0},...y&&{priority:b.includes(f=(f=y).toLowerCase())?f:void 0},...d&&{partitioned:!0}};let e={};for(let t in g)g[t]&&(e[t]=g[t]);return e}}t.exports=((e,t,c,o)=>{if(t&&"object"==typeof t||"function"==typeof t)for(let c of n(t))s.call(e,c)||void 0===c||r(e,c,{get:()=>t[c],enumerable:!(o=a(t,c))||o.enumerable});return e})(r({},"__esModule",{value:!0}),o);var p=["strict","lax","none"],b=["low","medium","high"],y=class{constructor(e){this._parsed=new Map,this._headers=e;const t=e.get("cookie");if(t)for(const[e,c]of m(t))this._parsed.set(e,{name:e,value:c})}[Symbol.iterator](){return this._parsed[Symbol.iterator]()}get size(){return this._parsed.size}get(...e){let t="string"==typeof e[0]?e[0]:e[0].name;return this._parsed.get(t)}getAll(...e){var t;let c=Array.from(this._parsed);if(!e.length)return c.map(([e,t])=>t);let r="string"==typeof e[0]?e[0]:null==(t=e[0])?void 0:t.name;return c.filter(([e])=>e===r).map(([e,t])=>t)}has(e){return this._parsed.has(e)}set(...e){let[t,c]=1===e.length?[e[0].name,e[0].value]:e,r=this._parsed;return r.set(t,{name:t,value:c}),this._headers.set("cookie",Array.from(r).map(([e,t])=>l(t)).join("; ")),this}delete(e){let t=this._parsed,c=Array.isArray(e)?e.map(e=>t.delete(e)):t.delete(e);return this._headers.set("cookie",Array.from(t).map(([e,t])=>l(t)).join("; ")),c}clear(){return this.delete(Array.from(this._parsed.keys())),this}[Symbol.for("edge-runtime.inspect.custom")](){return`RequestCookies ${JSON.stringify(Object.fromEntries(this._parsed))}`}toString(){return[...this._parsed.values()].map(e=>`${e.name}=${encodeURIComponent(e.value)}`).join("; ")}},x=class{constructor(e){var t,c,r;this._parsed=new Map,this._headers=e;const a=null!=(r=null!=(c=null==(t=e.getSetCookie)?void 0:t.call(e))?c:e.get("set-cookie"))?r:[];for(const e of Array.isArray(a)?a:function(e){if(!e)return[];var t,c,r,a,n,s=[],o=0;function i(){for(;o<e.length&&/\s/.test(e.charAt(o));)o+=1;return o<e.length}for(;o<e.length;){for(t=o,n=!1;i();)if(","===(c=e.charAt(o))){for(r=o,o+=1,i(),a=o;o<e.length&&"="!==(c=e.charAt(o))&&";"!==c&&","!==c;)o+=1;o<e.length&&"="===e.charAt(o)?(n=!0,o=a,s.push(e.substring(t,r)),t=o):o=r+1}else o+=1;(!n||o>=e.length)&&s.push(e.substring(t,e.length))}return s}(a)){const t=d(e);t&&this._parsed.set(t.name,t)}}get(...e){let t="string"==typeof e[0]?e[0]:e[0].name;return this._parsed.get(t)}getAll(...e){var t;let c=Array.from(this._parsed.values());if(!e.length)return c;let r="string"==typeof e[0]?e[0]:null==(t=e[0])?void 0:t.name;return c.filter(e=>e.name===r)}has(e){return this._parsed.has(e)}set(...e){let[t,c,r]=1===e.length?[e[0].name,e[0].value,e[0]]:e,a=this._parsed;return a.set(t,function(e={name:"",value:""}){return"number"==typeof e.expires&&(e.expires=new Date(e.expires)),e.maxAge&&(e.expires=new Date(Date.now()+1e3*e.maxAge)),(null===e.path||void 0===e.path)&&(e.path="/"),e}({name:t,value:c,...r})),function(e,t){for(let[,c]of(t.delete("set-cookie"),e)){let e=l(c);t.append("set-cookie",e)}}(a,this._headers),this}delete(...e){let[t,c]="string"==typeof e[0]?[e[0]]:[e[0].name,e[0]];return this.set({...c,name:t,value:"",expires:new Date(0)})}[Symbol.for("edge-runtime.inspect.custom")](){return`ResponseCookies ${JSON.stringify(Object.fromEntries(this._parsed))}`}toString(){return[...this._parsed.values()].map(l).join("; ")}}},463021,(e,t,c)=>{t.exports=e.x("@prisma/client-2c3a283f134fdcb6",()=>require("@prisma/client-2c3a283f134fdcb6"))},410430,(e,t,c)=>{t.exports=e.x("async_hooks",()=>require("async_hooks"))},698043,e=>{"use strict";var t=e.i(463021),c=e.i(410430);let r=new c.AsyncLocalStorage,a=new Map;function n(e){let t=process.env.DATABASE_URL||"postgresql://postgres:RootPassNama123@localhost:5432/n11_db?schema=public";return"true"===process.env.DESKTOP_MODE?t:t.replace(/\/([^/?]+)(\?|$)/,`/${e}_db$2`)}function s(e){return a.has(e)||a.set(e,new t.PrismaClient({datasources:{db:{url:n(e)}},log:[]})),a.get(e)}let o=new c.AsyncLocalStorage;function i(t){if("true"===process.env.DESKTOP_MODE)return"local";let c=r.getStore();if(c)return c;let a=o.getStore();if(a)return a;try{if(t?.headers){let e="function"==typeof t.headers.get?t.headers.get("x-tenant"):t.headers["x-tenant"];if(e)return e}}catch{}try{let{headers:t}=e.r(493458),c=t();if(c&&"function"==typeof c.get){let e=c.get("x-tenant");if(e&&"string"==typeof e)return e}}catch{}return process.env.TENANT?process.env.TENANT:process.env.DEFAULT_TENANT?process.env.DEFAULT_TENANT:"n11"}function u(e){return s(i(e))}async function l(e,t){return r.run(e,t)}let m=new Proxy({},{get(e,t){let c=r.getStore()||o.getStore();c||(c=function(){try{let e=globalThis.__NEXT_REQUEST_CONTEXT__?.get?.();if(e?.headers){let t=e.headers.get?.("x-tenant")||e.headers["x-tenant"];if(t&&"string"==typeof t)return t}}catch{}return null}()),c||(c=process.env.TENANT||process.env.DEFAULT_TENANT||"n11");let a=s(c),n=a[t];return"function"==typeof n?n.bind(a):n}});e.s(["currentRequestStore",0,o,"default",0,m,"getClient",()=>s,"getDbUrl",()=>n,"getPrisma",()=>u,"getTenantPrisma",0,u,"prisma",()=>m,"resolveTenant",()=>i,"tenantContext",0,r,"withTenant",()=>l])},500874,(e,t,c)=>{t.exports=e.x("buffer",()=>require("buffer"))},522734,(e,t,c)=>{t.exports=e.x("fs",()=>require("fs"))},233405,(e,t,c)=>{t.exports=e.x("child_process",()=>require("child_process"))},446786,(e,t,c)=>{t.exports=e.x("os",()=>require("os"))},137705,e=>{"use strict";function t(e,t){let c=Buffer.from(t,"utf-8"),r=Buffer.from([e]),a=Buffer.from([c.length]);return Buffer.concat([r,a,c])}function c(e){let c=[t(1,e.sellerName),t(2,e.vatNumber),t(3,e.timestamp),t(4,e.totalWithVat.toFixed(2)),t(5,e.vatAmount.toFixed(2))];return Buffer.concat(c).toString("base64")}function r(e){let t=e.supplier.address.countryCode||"SA",c=e.customer.address.countryCode||"SA",r=e.invoiceLines.map(e=>{let t=parseFloat(e.lineExtensionAmount).toFixed(2),c=(parseFloat(e.lineExtensionAmount)*(parseFloat(e.taxPercent)/100)).toFixed(2);return`
    <cac:InvoiceLine>
      <cbc:ID>${a(e.id)}</cbc:ID>
      <cbc:InvoicedQuantity unitCode="${a(e.unitCode)}">${a(e.quantity)}</cbc:InvoicedQuantity>
      <cbc:LineExtensionAmount currencyID="SAR">${a(t)}</cbc:LineExtensionAmount>
      <cac:TaxTotal>
        <cbc:TaxAmount currencyID="SAR">${a(c)}</cbc:TaxAmount>
        <cbc:RoundingAmount currencyID="SAR">${a((parseFloat(t)+parseFloat(c)).toFixed(2))}</cbc:RoundingAmount>
      </cac:TaxTotal>
      <cac:Item>
        <cbc:Name>${a(e.itemName)}</cbc:Name>
        <cac:ClassifiedTaxCategory>
          <cbc:ID>S</cbc:ID>
          <cbc:Percent>${a(e.taxPercent)}</cbc:Percent>
          <cac:TaxScheme>
            <cbc:ID>VAT</cbc:ID>
          </cac:TaxScheme>
        </cac:ClassifiedTaxCategory>
      </cac:Item>
      <cac:Price>
        <cbc:PriceAmount currencyID="SAR">${a(t)}</cbc:PriceAmount>
      </cac:Price>
    </cac:InvoiceLine>`}).join(""),n=parseFloat(e.taxAmount),s=(parseFloat(e.totalAmount)-n).toFixed(2);return`<?xml version="1.0" encoding="UTF-8"?>
<Invoice xmlns="urn:oasis:names:specification:ubl:schema:xsd:Invoice-2" xmlns:cac="urn:oasis:names:specification:ubl:schema:xsd:CommonAggregateComponents-2" xmlns:cbc="urn:oasis:names:specification:ubl:schema:xsd:CommonBasicComponents-2" xmlns:ext="urn:oasis:names:specification:ubl:schema:xsd:CommonExtensionComponents-2">
  <ext:UBLExtensions>SET_UBL_EXTENSIONS_STRING</ext:UBLExtensions>
  <cbc:ProfileID>${a(e.profileID)}</cbc:ProfileID>
  <cbc:ID>${a(e.id)}</cbc:ID>
  <cbc:UUID>${a(e.uuid)}</cbc:UUID>
  <cbc:IssueDate>${a(e.issueDate)}</cbc:IssueDate>
  <cbc:IssueTime>${a(e.issueTime)}</cbc:IssueTime>
  <cbc:InvoiceTypeCode name="${a(e.invoiceTypeName)}">${a(e.invoiceTypeCode)}</cbc:InvoiceTypeCode>
  <cbc:DocumentCurrencyCode>${a(e.currencyCode)}</cbc:DocumentCurrencyCode>
  <cbc:TaxCurrencyCode>${a(e.taxCurrencyCode)}</cbc:TaxCurrencyCode>
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
        <cbc:ID schemeID="CRN">${a(e.supplier.companyID)}</cbc:ID>
      </cac:PartyIdentification>
      <cac:PostalAddress>
        <cbc:StreetName>${a(e.supplier.address.streetName)}</cbc:StreetName>
        <cbc:BuildingNumber>${a(e.supplier.address.buildingNumber)}</cbc:BuildingNumber>
        <cbc:CitySubdivisionName>${a(e.supplier.address.citySubdivisionName)}</cbc:CitySubdivisionName>
        <cbc:CityName>${a(e.supplier.address.cityName)}</cbc:CityName>
        <cbc:PostalZone>${a(e.supplier.address.postalZone)}</cbc:PostalZone>
        <cac:Country>
          <cbc:IdentificationCode>${a(t)}</cbc:IdentificationCode>
        </cac:Country>
      </cac:PostalAddress>
      <cac:PartyTaxScheme>
        <cbc:CompanyID>${a(e.supplier.registrationName)}</cbc:CompanyID>
        <cac:TaxScheme>
          <cbc:ID>VAT</cbc:ID>
        </cac:TaxScheme>
      </cac:PartyTaxScheme>
      <cac:PartyLegalEntity>
        <cbc:RegistrationName>${a(e.supplier.registrationName||"Seller")}</cbc:RegistrationName>
      </cac:PartyLegalEntity>
    </cac:Party>
  </cac:AccountingSupplierParty>
  <cac:AccountingCustomerParty>
    <cac:Party>
      <cac:PartyIdentification>
        <cbc:ID schemeID="NAT">1323211234</cbc:ID>
      </cac:PartyIdentification>
      <cac:PostalAddress>
        <cbc:StreetName>${a(e.customer.address.streetName)}</cbc:StreetName>
        <cbc:BuildingNumber>${a(e.customer.address.buildingNumber)}</cbc:BuildingNumber>
        <cbc:CitySubdivisionName>${a(e.customer.address.citySubdivisionName)}</cbc:CitySubdivisionName>
        <cbc:CityName>${a(e.customer.address.cityName)}</cbc:CityName>
        <cbc:PostalZone>${a(e.customer.address.postalZone)}</cbc:PostalZone>
        <cac:Country>
          <cbc:IdentificationCode>${a(c)}</cbc:IdentificationCode>
        </cac:Country>
      </cac:PostalAddress>
      <cac:PartyTaxScheme>
        <cbc:CompanyID>${a(e.customer.companyID)}</cbc:CompanyID>
        <cac:TaxScheme>
          <cbc:ID>VAT</cbc:ID>
        </cac:TaxScheme>
      </cac:PartyTaxScheme>
      <cac:PartyLegalEntity>
        <cbc:RegistrationName>${a(e.customer.registrationName||"Customer")}</cbc:RegistrationName>
      </cac:PartyLegalEntity>
    </cac:Party>
  </cac:AccountingCustomerParty>
  <cac:Delivery>
    <cbc:ActualDeliveryDate>${a(e.issueDate)}</cbc:ActualDeliveryDate>
  </cac:Delivery>
  ${"381"===e.invoiceTypeCode||"383"===e.invoiceTypeCode?`
  <cac:PaymentMeans>
    <cbc:PaymentMeansCode>10</cbc:PaymentMeansCode>
    <cbc:InstructionNote>Compliance Test Reason</cbc:InstructionNote>
  </cac:PaymentMeans>`:""}
  <cac:TaxTotal>
    <cbc:TaxAmount currencyID="SAR">${a(e.taxAmount)}</cbc:TaxAmount>
    <cac:TaxSubtotal>
      <cbc:TaxableAmount currencyID="SAR">${a(s)}</cbc:TaxableAmount>
      <cbc:TaxAmount currencyID="SAR">${a(e.taxAmount)}</cbc:TaxAmount>
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
    <cbc:LineExtensionAmount currencyID="SAR">${a(s)}</cbc:LineExtensionAmount>
    <cbc:TaxExclusiveAmount currencyID="SAR">${a(s)}</cbc:TaxExclusiveAmount>
    <cbc:TaxInclusiveAmount currencyID="SAR">${a(e.totalAmount)}</cbc:TaxInclusiveAmount>
    <cbc:AllowanceTotalAmount currencyID="SAR">0.00</cbc:AllowanceTotalAmount>
    <cbc:ChargeTotalAmount currencyID="SAR">0.00</cbc:ChargeTotalAmount>
    <cbc:PayableAmount currencyID="SAR">${a(e.totalAmount)}</cbc:PayableAmount>
  </cac:LegalMonetaryTotal>
  ${r}
</Invoice>`}function a(e){return e.replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;").replace(/"/g,"&quot;").replace(/'/g,"&apos;")}e.i(254799),e.s(["generateZATCAXml",()=>r,"generateZatcaQRContent",()=>c])}];

//# debugId=97b877b3-73cc-833c-6e28-5d735e13cbb2
//# sourceMappingURL=%5Broot-of-the-server%5D__4eefeebb._.js.map