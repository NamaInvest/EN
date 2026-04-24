;!function(){try { var e="undefined"!=typeof globalThis?globalThis:"undefined"!=typeof global?global:"undefined"!=typeof window?window:"undefined"!=typeof self?self:{},n=(new e.Error).stack;n&&((e._debugIds|| (e._debugIds={}))[n]="545bed19-3f16-dc73-43dc-37bde21dbe17")}catch(e){}}();
module.exports=[917663,890942,616143,a=>{"use strict";let b,c;var d,e=a.i(187924),f=a.i(572131),g=a.i(951192),h=a.i(633508);function i({isOpen:a,onClose:b}){let c,d,{t:i}=(0,g.useTranslation)(),[j,k]=(0,f.useState)(""),[l,m]=(0,f.useState)(null),[n,o]=(0,f.useState)([]),[p,q]=(0,f.useState)(""),[r,s]=(0,f.useState)(!1),[t,u]=(0,f.useState)(""),[v,w]=(0,f.useState)("");if(!a)return null;let x=a=>a.toLocaleString("en-SA",{minimumFractionDigits:2}),y=async()=>{if(j){s(!0),u(""),w(""),m(null),o([]);try{let a=await fetch(`/api/sales?invoiceNo=${j}`);if(a.ok){let b=await a.json();if(b&&b.length>0){let a=b[0];m(a);let c=a.details.map(a=>({productId:a.productId,productName:a.productName,soldQuantity:a.quantity,returnQuantity:0,price:a.price,discountRate:a.discountRate}));o(c)}else u(i("sales.str_1144")||"الفاتورة غير موجودة")}else u(i("sales.str_1145")||"خطأ في جلب الفاتورة")}catch(a){console.error(a),u(i("sales.str_1146")||"حدث خطأ بالاتصال")}s(!1)}},z=(c=0,n.forEach(a=>{if(a.returnQuantity>0){let b=a.returnQuantity*a.price,d=b*(a.discountRate/100);c+=b-d}}),d=.15*c,{subtotal:c,tax:d,total:c+d}),A=async()=>{let a=n.filter(a=>a.returnQuantity>0).map(a=>({productId:a.productId,productName:a.productName,quantity:a.returnQuantity,price:a.price,discountRate:a.discountRate}));if(0===a.length)return void u(i("sales.str_1147")||"يجب تحديد كمية صالحة للارجاع");let c={originalInvoiceId:l?.id,notes:p,items:a};try{let a=await fetch("/api/sales-returns",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify(c)});if(a.ok)w("✅ تم إنشاء فاتورة الاسترجاع بنجاح"),k(""),m(null),o([]),q(""),setTimeout(()=>{w(""),b()},2e3);else{let b=await a.json();u(b.error||i("sales.str_1148"))}}catch(a){console.error(a),u(i("sales.str_1149")||"فشل في الاتصال وحفظ المرتجع")}};return(0,e.jsxs)(e.Fragment,{children:[(0,e.jsx)("div",{className:"fixed inset-0 bg-black/60 z-[9998]",onClick:b}),(0,e.jsxs)("div",{className:"fixed top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 bg-white rounded-xl shadow-2xl z-[9999] w-[95%] max-w-4xl p-0 overflow-hidden flex flex-col",style:{maxHeight:"90vh"},children:[(0,e.jsxs)("div",{className:"bg-slate-50 border-b border-slate-100 p-4 flex justify-between items-center",children:[(0,e.jsxs)("h2",{className:"text-lg font-bold text-slate-800 flex items-center gap-2",children:[(0,e.jsx)("span",{className:"text-red-500",children:"↩"})," ",i("sales.str_1128")||"استرجاع فاتورة (مرتجع)"]}),(0,e.jsx)("button",{onClick:b,className:"p-1 hover:bg-slate-200 rounded-lg text-slate-500 transition",children:(0,e.jsx)(h.X,{size:20})})]}),(0,e.jsxs)("div",{className:"p-6 overflow-y-auto flex-1",children:[v&&(0,e.jsx)("div",{className:"mb-6 p-4 bg-green-50 text-green-700 border border-green-200 rounded-lg font-bold",children:v}),(0,e.jsxs)("div",{className:"flex gap-4 items-end mb-8 bg-slate-50 p-4 rounded-xl border border-slate-100",children:[(0,e.jsxs)("div",{className:"flex-1",children:[(0,e.jsx)("label",{className:"text-xs font-bold text-slate-500 block mb-2",children:i("sales.str_1129")||"رقم الفاتورة الأصلي"}),(0,e.jsx)("input",{value:j,onChange:a=>k(a.target.value),placeholder:i("sales.str_1150")||"أدخل رقم الفاتورة للبحث",onKeyDown:a=>"Enter"===a.key&&y(),className:"w-full px-4 py-2.5 rounded-lg border border-slate-200 focus:border-red-500 focus:ring-1 focus:ring-red-500 outline-none transition"})]}),(0,e.jsx)("button",{className:"px-6 py-2.5 bg-slate-800 text-white font-bold rounded-lg hover:bg-slate-700 transition disabled:opacity-50",onClick:y,disabled:r||!j,children:r?i("sales.str_1151"):i("sales.str_1152")||"بحث عن الفاتورة"})]}),t&&(0,e.jsx)("div",{className:"mb-6 p-3 bg-red-50 text-red-600 rounded-lg text-sm border border-red-100",children:t}),l&&(0,e.jsxs)("div",{className:"bg-white border border-slate-200 rounded-xl overflow-hidden",children:[(0,e.jsxs)("div",{className:"flex justify-between items-center p-4 bg-slate-50 border-b border-slate-200 text-sm",children:[(0,e.jsxs)("div",{children:[(0,e.jsx)("span",{className:"text-slate-500",children:i("sales.str_1130")})," ",(0,e.jsxs)("strong",{className:"text-slate-800",children:["#",l.invoiceNo]})]}),(0,e.jsxs)("div",{children:[(0,e.jsx)("span",{className:"text-slate-500",children:i("sys.str_113")})," ",(0,e.jsx)("strong",{className:"text-slate-800",children:new Date(l.date).toLocaleDateString("ar-SA")})]}),(0,e.jsxs)("div",{children:[(0,e.jsx)("span",{className:"text-slate-500",children:i("sales.str_1131")})," ",(0,e.jsxs)("strong",{className:"text-slate-800",children:[x(l.total)," ",i("sys.str_68")]})]})]}),(0,e.jsx)("div",{className:"overflow-x-auto",children:(0,e.jsxs)("table",{className:"w-full text-sm",children:[(0,e.jsx)("thead",{className:"bg-slate-50 border-b border-slate-200",children:(0,e.jsxs)("tr",{children:[(0,e.jsx)("th",{className:"p-3 text-right font-bold text-slate-600",children:i("sys.str_63")||"المنتج"}),(0,e.jsx)("th",{className:"p-3 text-center font-bold text-slate-600",children:i("sales.str_1132")||"الكمية المباعة"}),(0,e.jsx)("th",{className:"p-3 text-center font-bold text-slate-600 w-40",children:i("sales.str_1133")||"كمية الإرجاع"}),(0,e.jsx)("th",{className:"p-3 text-left font-bold text-slate-600",children:i("sales.str_1134")||"إجمالي الخصم (للمرتجع)"})]})}),(0,e.jsx)("tbody",{className:"divide-y divide-slate-100",children:n.map(a=>{let b=a.returnQuantity*a.price*(1-a.discountRate/100)*1.15;return(0,e.jsxs)("tr",{className:"hover:bg-slate-50/50",children:[(0,e.jsx)("td",{className:"p-3 font-semibold text-slate-800",children:a.productName}),(0,e.jsx)("td",{className:"p-3 text-center font-mono text-slate-500",children:a.soldQuantity}),(0,e.jsx)("td",{className:"p-3 text-center",children:(0,e.jsx)("input",{type:"number",min:"0",max:a.soldQuantity,value:0===a.returnQuantity?"":a.returnQuantity,placeholder:"0",onChange:b=>{var c;let d;return c=a.productId,d=parseFloat(b.target.value)||0,void o(a=>a.map(a=>{if(a.productId===c){let b=Math.max(0,Math.min(d,a.soldQuantity));return{...a,returnQuantity:b}}return a}))},className:"w-20 px-3 py-1.5 rounded-md border border-red-200 focus:border-red-500 text-center font-bold outline-none"})}),(0,e.jsx)("td",{className:"p-3 text-left font-mono font-bold text-red-500",children:b>0?`-${x(b)}`:"0.00"})]},a.productId)})})]})}),(0,e.jsxs)("div",{className:"bg-slate-50 p-4 border-t border-slate-200 flex flex-col md:flex-row justify-between items-center gap-4",children:[(0,e.jsxs)("div",{className:"flex-1 w-full relative",children:[(0,e.jsx)("label",{className:"text-xs font-bold text-slate-500 block mb-1",children:i("sales.str_1135")||"ملاحظات وتسبب الارجاع (اختياري)"}),(0,e.jsx)("input",{value:p,onChange:a=>q(a.target.value),placeholder:i("sales.str_1153")||"اكتب أي ملاحظات هنا..",className:"w-full max-w-sm px-4 py-2 rounded-lg border border-slate-200 focus:border-red-500 outline-none"})]}),(0,e.jsxs)("div",{className:"text-left bg-white p-3 rounded-lg border border-slate-200 min-w-[200px]",children:[(0,e.jsxs)("div",{className:"text-xs text-slate-500 flex justify-between mb-1",children:[(0,e.jsx)("span",{children:i("sales.str_1136")||"المجموع الفرعي:"}),(0,e.jsx)("span",{className:"font-mono",children:x(z.subtotal)})]}),(0,e.jsxs)("div",{className:"text-xs text-slate-500 flex justify-between mb-2",children:[(0,e.jsx)("span",{children:i("sales.str_1137")||"الضريبة (15%):"}),(0,e.jsx)("span",{className:"font-mono",children:x(z.tax)})]}),(0,e.jsxs)("div",{className:"text-base text-red-600 font-bold flex justify-between border-t border-slate-100 pt-2 mt-1",children:[(0,e.jsx)("span",{children:i("sales.str_1138")||"قيمة المرتجع:"}),(0,e.jsxs)("span",{className:"font-mono",children:[x(z.total)," ",i("sys.str_68")||"ر.س"]})]})]})]})]})]}),(0,e.jsxs)("div",{className:"p-4 border-t border-slate-100 bg-white flex justify-end gap-3",children:[(0,e.jsx)("button",{className:"px-6 py-2.5 font-bold rounded-lg text-slate-600 hover:bg-slate-100 transition",onClick:b,children:"إلغاء"}),l&&(0,e.jsx)("button",{className:"px-8 py-2.5 bg-red-500 hover:bg-red-600 text-white font-bold rounded-lg transition shadow-sm shadow-red-500/20 disabled:opacity-50 disabled:cursor-not-allowed",onClick:A,disabled:0===z.total,children:i("sales.str_1139")||"اعتماد وترجيع المبلغ"})]})]})]})}a.s(["default",()=>i],917663);var j=a.i(599529);function k({featureKey:a,children:b,fallback:c=null}){return(0,j.useFeatureFlag)(a)?(0,e.jsx)(e.Fragment,{children:b}):(0,e.jsx)(e.Fragment,{children:c})}a.s(["FeatureGuard",()=>k],890942);var l=a.i(170106);let m=(0,l.default)("wifi",[["path",{d:"M12 20h.01",key:"zekei9"}],["path",{d:"M2 8.82a15 15 0 0 1 20 0",key:"dnpr2z"}],["path",{d:"M5 12.859a10 10 0 0 1 14 0",key:"1x1e6c"}],["path",{d:"M8.5 16.429a5 5 0 0 1 7 0",key:"1bycff"}]]),n=(0,l.default)("wifi-off",[["path",{d:"M12 20h.01",key:"zekei9"}],["path",{d:"M8.5 16.429a5 5 0 0 1 7 0",key:"1bycff"}],["path",{d:"M5 12.859a10 10 0 0 1 5.17-2.69",key:"1dl1wf"}],["path",{d:"M19 12.859a10 10 0 0 0-2.007-1.523",key:"4k23kn"}],["path",{d:"M2 8.82a15 15 0 0 1 4.177-2.643",key:"1grhjp"}],["path",{d:"M22 8.82a15 15 0 0 0-11.288-3.764",key:"z3jwby"}],["path",{d:"m2 2 20 20",key:"1ooewy"}]]),o=(0,l.default)("cloud",[["path",{d:"M17.5 19H9a7 7 0 1 1 6.71-9h1.79a4.5 4.5 0 1 1 0 9Z",key:"p7xjir"}]]),p=(0,l.default)("cloud-off",[["path",{d:"M10.94 5.274A7 7 0 0 1 15.71 10h1.79a4.5 4.5 0 0 1 4.222 6.057",key:"1uxyv8"}],["path",{d:"M18.796 18.81A4.5 4.5 0 0 1 17.5 19H9A7 7 0 0 1 5.79 5.78",key:"99tcn7"}],["path",{d:"m2 2 20 20",key:"1ooewy"}]]);var q=a.i(669520);let r={data:""},s=/(?:([\u0080-\uFFFF\w-%@]+) *:? *([^{;]+?);|([^;}{]*?) *{)|(}\s*)/g,t=/\/\*[^]*?\*\/|  +/g,u=/\n+/g,v=(a,b)=>{let c="",d="",e="";for(let f in a){let g=a[f];"@"==f[0]?"i"==f[1]?c=f+" "+g+";":d+="f"==f[1]?v(g,f):f+"{"+v(g,"k"==f[1]?"":b)+"}":"object"==typeof g?d+=v(g,b?b.replace(/([^,])+/g,a=>f.replace(/([^,]*:\S+\([^)]*\))|([^,])+/g,b=>/&/.test(b)?b.replace(/&/g,a):a?a+" "+b:b)):f):null!=g&&(f=/^--/.test(f)?f:f.replace(/[A-Z]/g,"-$&").toLowerCase(),e+=v.p?v.p(f,g):f+":"+g+";")}return c+(b&&e?b+"{"+e+"}":e)+d},w={},x=a=>{if("object"==typeof a){let b="";for(let c in a)b+=c+x(a[c]);return b}return a};function y(a){let b,c,d=this||{},e=a.call?a(d.p):a;return((a,b,c,d,e)=>{var f;let g=x(a),h=w[g]||(w[g]=(a=>{let b=0,c=11;for(;b<a.length;)c=101*c+a.charCodeAt(b++)>>>0;return"go"+c})(g));if(!w[h]){let b=g!==a?a:(a=>{let b,c,d=[{}];for(;b=s.exec(a.replace(t,""));)b[4]?d.shift():b[3]?(c=b[3].replace(u," ").trim(),d.unshift(d[0][c]=d[0][c]||{})):d[0][b[1]]=b[2].replace(u," ").trim();return d[0]})(a);w[h]=v(e?{["@keyframes "+h]:b}:b,c?"":"."+h)}let i=c&&w.g?w.g:null;return c&&(w.g=w[h]),f=w[h],i?b.data=b.data.replace(i,f):-1===b.data.indexOf(f)&&(b.data=d?f+b.data:b.data+f),h})(e.unshift?e.raw?(b=[].slice.call(arguments,1),c=d.p,e.reduce((a,d,e)=>{let f=b[e];if(f&&f.call){let a=f(c),b=a&&a.props&&a.props.className||/^go/.test(a)&&a;f=b?"."+b:a&&"object"==typeof a?a.props?"":v(a,""):!1===a?"":a}return a+d+(null==f?"":f)},"")):e.reduce((a,b)=>Object.assign(a,b&&b.call?b(d.p):b),{}):e,d.target||r,d.g,d.o,d.k)}y.bind({g:1});let z,A,B,C=y.bind({k:1});function D(a,b){let c=this||{};return function(){let d=arguments;function e(f,g){let h=Object.assign({},f),i=h.className||e.className;c.p=Object.assign({theme:A&&A()},h),c.o=/ *go\d+/.test(i),h.className=y.apply(c,d)+(i?" "+i:""),b&&(h.ref=g);let j=a;return a[0]&&(j=h.as||a,delete h.as),B&&j[0]&&B(h),z(j,h)}return b?b(e):e}}var E=(a,b)=>"function"==typeof a?a(b):a,F=(b=0,()=>(++b).toString()),G="default",H=(a,b)=>{let{toastLimit:c}=a.settings;switch(b.type){case 0:return{...a,toasts:[b.toast,...a.toasts].slice(0,c)};case 1:return{...a,toasts:a.toasts.map(a=>a.id===b.toast.id?{...a,...b.toast}:a)};case 2:let{toast:d}=b;return H(a,{type:+!!a.toasts.find(a=>a.id===d.id),toast:d});case 3:let{toastId:e}=b;return{...a,toasts:a.toasts.map(a=>a.id===e||void 0===e?{...a,dismissed:!0,visible:!1}:a)};case 4:return void 0===b.toastId?{...a,toasts:[]}:{...a,toasts:a.toasts.filter(a=>a.id!==b.toastId)};case 5:return{...a,pausedAt:b.time};case 6:let f=b.time-(a.pausedAt||0);return{...a,pausedAt:void 0,toasts:a.toasts.map(a=>({...a,pauseDuration:a.pauseDuration+f}))}}},I=[],J={toasts:[],pausedAt:void 0,settings:{toastLimit:20}},K={},L=(a,b=G)=>{K[b]=H(K[b]||J,a),I.forEach(([a,c])=>{a===b&&c(K[b])})},M=a=>Object.keys(K).forEach(b=>L(a,b)),N=(a=G)=>b=>{L(b,a)},O=a=>(b,c)=>{let d,e=((a,b="blank",c)=>({createdAt:Date.now(),visible:!0,dismissed:!1,type:b,ariaProps:{role:"status","aria-live":"polite"},message:a,pauseDuration:0,...c,id:(null==c?void 0:c.id)||F()}))(b,a,c);return N(e.toasterId||(d=e.id,Object.keys(K).find(a=>K[a].toasts.some(a=>a.id===d))))({type:2,toast:e}),e.id},P=(a,b)=>O("blank")(a,b);P.error=O("error"),P.success=O("success"),P.loading=O("loading"),P.custom=O("custom"),P.dismiss=(a,b)=>{let c={type:3,toastId:a};b?N(b)(c):M(c)},P.dismissAll=a=>P.dismiss(void 0,a),P.remove=(a,b)=>{let c={type:4,toastId:a};b?N(b)(c):M(c)},P.removeAll=a=>P.remove(void 0,a),P.promise=(a,b,c)=>{let d=P.loading(b.loading,{...c,...null==c?void 0:c.loading});return"function"==typeof a&&(a=a()),a.then(a=>{let e=b.success?E(b.success,a):void 0;return e?P.success(e,{id:d,...c,...null==c?void 0:c.success}):P.dismiss(d),a}).catch(a=>{let e=b.error?E(b.error,a):void 0;e?P.error(e,{id:d,...c,...null==c?void 0:c.error}):P.dismiss(d)}),a};var Q=C`
from {
  transform: scale(0) rotate(45deg);
	opacity: 0;
}
to {
 transform: scale(1) rotate(45deg);
  opacity: 1;
}`,R=C`
from {
  transform: scale(0);
  opacity: 0;
}
to {
  transform: scale(1);
  opacity: 1;
}`,S=C`
from {
  transform: scale(0) rotate(90deg);
	opacity: 0;
}
to {
  transform: scale(1) rotate(90deg);
	opacity: 1;
}`,T=D("div")`
  width: 20px;
  opacity: 0;
  height: 20px;
  border-radius: 10px;
  background: ${a=>a.primary||"#ff4b4b"};
  position: relative;
  transform: rotate(45deg);

  animation: ${Q} 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275)
    forwards;
  animation-delay: 100ms;

  &:after,
  &:before {
    content: '';
    animation: ${R} 0.15s ease-out forwards;
    animation-delay: 150ms;
    position: absolute;
    border-radius: 3px;
    opacity: 0;
    background: ${a=>a.secondary||"#fff"};
    bottom: 9px;
    left: 4px;
    height: 2px;
    width: 12px;
  }

  &:before {
    animation: ${S} 0.15s ease-out forwards;
    animation-delay: 180ms;
    transform: rotate(90deg);
  }
`,U=C`
  from {
    transform: rotate(0deg);
  }
  to {
    transform: rotate(360deg);
  }
`,V=D("div")`
  width: 12px;
  height: 12px;
  box-sizing: border-box;
  border: 2px solid;
  border-radius: 100%;
  border-color: ${a=>a.secondary||"#e0e0e0"};
  border-right-color: ${a=>a.primary||"#616161"};
  animation: ${U} 1s linear infinite;
`,W=C`
from {
  transform: scale(0) rotate(45deg);
	opacity: 0;
}
to {
  transform: scale(1) rotate(45deg);
	opacity: 1;
}`,X=C`
0% {
	height: 0;
	width: 0;
	opacity: 0;
}
40% {
  height: 0;
	width: 6px;
	opacity: 1;
}
100% {
  opacity: 1;
  height: 10px;
}`,Y=D("div")`
  width: 20px;
  opacity: 0;
  height: 20px;
  border-radius: 10px;
  background: ${a=>a.primary||"#61d345"};
  position: relative;
  transform: rotate(45deg);

  animation: ${W} 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275)
    forwards;
  animation-delay: 100ms;
  &:after {
    content: '';
    box-sizing: border-box;
    animation: ${X} 0.2s ease-out forwards;
    opacity: 0;
    animation-delay: 200ms;
    position: absolute;
    border-right: 2px solid;
    border-bottom: 2px solid;
    border-color: ${a=>a.secondary||"#fff"};
    bottom: 6px;
    left: 6px;
    height: 10px;
    width: 6px;
  }
`,Z=D("div")`
  position: absolute;
`,$=D("div")`
  position: relative;
  display: flex;
  justify-content: center;
  align-items: center;
  min-width: 20px;
  min-height: 20px;
`,_=C`
from {
  transform: scale(0.6);
  opacity: 0.4;
}
to {
  transform: scale(1);
  opacity: 1;
}`,aa=D("div")`
  position: relative;
  transform: scale(0.6);
  opacity: 0.4;
  min-width: 20px;
  animation: ${_} 0.3s 0.12s cubic-bezier(0.175, 0.885, 0.32, 1.275)
    forwards;
`,ab=({toast:a})=>{let{icon:b,type:c,iconTheme:d}=a;return void 0!==b?"string"==typeof b?f.createElement(aa,null,b):b:"blank"===c?null:f.createElement($,null,f.createElement(V,{...d}),"loading"!==c&&f.createElement(Z,null,"error"===c?f.createElement(T,{...d}):f.createElement(Y,{...d})))},ac=D("div")`
  display: flex;
  align-items: center;
  background: #fff;
  color: #363636;
  line-height: 1.3;
  will-change: transform;
  box-shadow: 0 3px 10px rgba(0, 0, 0, 0.1), 0 3px 3px rgba(0, 0, 0, 0.05);
  max-width: 350px;
  pointer-events: auto;
  padding: 8px 10px;
  border-radius: 8px;
`,ad=D("div")`
  display: flex;
  justify-content: center;
  margin: 4px 10px;
  color: inherit;
  flex: 1 1 auto;
  white-space: pre-line;
`;function ae(){let[a,b]=(0,f.useState)(!1),[c,d]=(0,f.useState)(0),[g,h]=(0,f.useState)(!1);(0,f.useEffect)(()=>{b(!navigator.onLine);let a=()=>{b(!1),P.success("تمت استعادة الاتصال بالإنترنت",{position:"top-left"}),j()},c=()=>{b(!0),P.error("انقطع الاتصال بالإنترنت - يتم العمل على قاعدة البيانات المحلية",{position:"top-left",duration:5e3})};window.addEventListener("online",a),window.addEventListener("offline",c),i();let d=setInterval(()=>{navigator.onLine&&j()},6e4);return()=>{window.removeEventListener("online",a),window.removeEventListener("offline",c),clearInterval(d)}},[]);let i=(0,f.useCallback)(async()=>{},[]),j=(0,f.useCallback)(async()=>{},[g,i]),k=async(b,c="/api/pos/invoice")=>{if(a){if(window.electron){let a={...b,_endpoint:c},d=await window.electron.invoke("offline-db-save-invoice",a);if(d)return P.success("تم الحفظ محلياً (Offline)",{icon:"💾"}),i(),{success:!0,offline:!0,uuid:d}}return P.error("فشل الحفظ - البرنامج غير متصل بالخادم ولا يدعم الحفظ المحلي"),{success:!1,error:"Offline without local DB"}}try{let a=await fetch(c,{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify(b)}),d=await a.json();if(!d.success)throw Error(d.error);return{success:!0,offline:!1,...d}}catch(a){if(window.electron){let a={...b,_endpoint:c},d=await window.electron.invoke("offline-db-save-invoice",a);if(d)return P.error("فشل الاتصال - تم حفظ الفاتورة محلياً وسيتم رفعها لاحقاً"),i(),{success:!0,offline:!0,uuid:d}}return{success:!1,error:a.message}}};return{isOffline:a,pendingCount:c,isSyncing:g,saveInvoiceWithSync:k,OfflineBadge:()=>window.electron?(0,e.jsxs)("div",{className:"flex items-center gap-3",children:[a?(0,e.jsxs)("div",{className:"flex items-center gap-2 bg-red-900/40 text-red-400 px-3 py-1.5 rounded-full border border-red-800/50 text-sm font-bold animate-pulse",children:[(0,e.jsx)(n,{size:16}),(0,e.jsx)("span",{children:"غير متصل (Offline)"})]}):(0,e.jsxs)("div",{className:"flex items-center gap-2 bg-emerald-900/40 text-emerald-400 px-3 py-1.5 rounded-full border border-emerald-800/50 text-sm font-bold",children:[(0,e.jsx)(m,{size:16}),(0,e.jsx)("span",{children:"متصل بالسحابة"})]}),c>0&&(0,e.jsxs)("button",{onClick:()=>!a&&j(),disabled:a||g,className:`flex items-center gap-2 px-3 py-1.5 rounded-full text-sm font-bold transition-all ${a?"bg-orange-900/40 text-orange-400 border border-orange-800/50 cursor-not-allowed":"bg-blue-900/40 text-blue-400 border border-blue-800/50 hover:bg-blue-800/50 cursor-pointer"}`,title:"مزامنة الفواتير",children:[g?(0,e.jsx)(q.RefreshCw,{size:16,className:"animate-spin"}):a?(0,e.jsx)(p,{size:16}):(0,e.jsx)(o,{size:16}),(0,e.jsxs)("span",{children:[c," بانتظار الرفع"]})]})]}):null,syncPendingInvoices:j,cacheProducts:async a=>{window.electron&&a.length>0&&await window.electron.invoke("offline-db-save-products",a)},refreshPendingCount:i}}f.memo(({toast:a,position:b,style:d,children:e})=>{let g=a.height?((a,b)=>{let d=a.includes("top")?1:-1,[e,f]=c?["0%{opacity:0;} 100%{opacity:1;}","0%{opacity:1;} 100%{opacity:0;}"]:[`
0% {transform: translate3d(0,${-200*d}%,0) scale(.6); opacity:.5;}
100% {transform: translate3d(0,0,0) scale(1); opacity:1;}
`,`
0% {transform: translate3d(0,0,-1px) scale(1); opacity:1;}
100% {transform: translate3d(0,${-150*d}%,-1px) scale(.6); opacity:0;}
`];return{animation:b?`${C(e)} 0.35s cubic-bezier(.21,1.02,.73,1) forwards`:`${C(f)} 0.4s forwards cubic-bezier(.06,.71,.55,1)`}})(a.position||b||"top-center",a.visible):{opacity:0},h=f.createElement(ab,{toast:a}),i=f.createElement(ad,{...a.ariaProps},E(a.message,a));return f.createElement(ac,{className:a.className,style:{...g,...d,...a.style}},"function"==typeof e?e({icon:h,message:i}):f.createElement(f.Fragment,null,h,i))}),d=f.createElement,v.p=void 0,z=d,A=void 0,B=void 0,y`
  z-index: 9999;
  > * {
    pointer-events: auto;
  }
`,a.s(["useOfflineSync",()=>ae],616143)}];

//# debugId=545bed19-3f16-dc73-43dc-37bde21dbe17
//# sourceMappingURL=src_components_PosReturnsModal_tsx_32209e6a._.js.map