;!function(){try { var e="undefined"!=typeof globalThis?globalThis:"undefined"!=typeof global?global:"undefined"!=typeof window?window:"undefined"!=typeof self?self:{},n=(new e.Error).stack;n&&((e._debugIds|| (e._debugIds={}))[n]="4f444bd5-7027-1ffa-e646-c2774a242792")}catch(e){}}();
module.exports=[814747,(a,b,c)=>{b.exports=a.x("path",()=>require("path"))},669520,a=>{"use strict";let b=(0,a.i(170106).default)("refresh-cw",[["path",{d:"M3 12a9 9 0 0 1 9-9 9.75 9.75 0 0 1 6.74 2.74L21 8",key:"v9h5vc"}],["path",{d:"M21 3v5h-5",key:"1q7to0"}],["path",{d:"M21 12a9 9 0 0 1-9 9 9.75 9.75 0 0 1-6.74-2.74L3 16",key:"3uifl3"}],["path",{d:"M8 16H3v5",key:"1cv678"}]]);a.s(["RefreshCw",()=>b],669520)},504369,a=>{"use strict";var b=a.i(187924),c=a.i(572131),d=a.i(951192);function e({voucherData:a,autoPrint:e=!1,onClose:f}){var g;let h,{t:i}=(0,d.useTranslation)(),[j,k]=(0,c.useState)(""),[l,m]=(0,c.useState)("80mm"),[n,o]=(0,c.useState)(!1),p=(0,c.useRef)(null);(0,c.useEffect)(()=>{q()},[]),(0,c.useEffect)(()=>{if(e&&!n){let a=setTimeout(()=>{s(),o(!0)},500);return()=>clearTimeout(a)}},[e,n]);let q=async()=>{try{let a=await fetch("/api/settings");if(a.ok){let b=await a.json(),c={};b.forEach(a=>{c[a.key]=a.value}),k(c.company_name||i("sys.str_78")),m(c.printer_type||"80mm")}}catch(a){console.error(a)}},r={"58mm":{width:"58mm",padding:"2mm",fontSize:"10px",companySize:"14px",windowWidth:230},"76mm":{width:"76mm",padding:"3mm",fontSize:"11px",companySize:"16px",windowWidth:290},"80mm":{width:"80mm",padding:"4mm",fontSize:"12px",companySize:"18px",windowWidth:310},A4:{width:"210mm",padding:"15mm",fontSize:"16px",companySize:"24px",windowWidth:800},A5:{width:"148mm",padding:"10mm",fontSize:"14px",companySize:"20px",windowWidth:580}},s=(0,c.useCallback)(()=>{let a=r[l]||r["80mm"],b=window.open("","_blank",`width=${a.windowWidth},height=600`);b&&p.current?(b.document.write(`
      <!DOCTYPE html>
      <html dir="rtl" lang="ar">
      <head>
        <meta charset="UTF-8">
        <title>ط\xb3ظ†ط\xaf ظ‚ط\xa8ط\xb6</title>
        <style>
          @import url('https://fonts.googleapis.com/css2?family=Noto Sans Arabic:wght@400;600;800&display=swap');
          * { margin: 0; padding: 0; box-sizing: border-box; }
          body {
            font-family: 'Noto Sans Arabic', sans-serif;
            width: ${a.width};
            padding: ${a.padding};
            font-size: ${a.fontSize};
            line-height: 1.6;
            direction: rtl;
            color: #000;
          }
          .header { text-align: center; border-bottom: 2px solid #000; padding-bottom: 8px; margin-bottom: 12px; }
          .company-name { font-size: ${a.companySize}; font-weight: 800; }
          .voucher-title { font-size: 14px; font-weight: 700; margin-top: 4px; border: 1px solid #000; display: inline-block; padding: 2px 8px; border-radius: 4px; }
          .info-row { display: flex; justify-content: space-between; font-size: ${a.fontSize}; margin-bottom: 6px; }
          .content-box { border: 1px solid #000; padding: 8px; margin-top: 12px; border-radius: 4px; }
          .content-text { font-size: ${a.fontSize}; margin-bottom: 8px; text-align: justify; }
          .signature-section { display: flex; justify-content: space-between; margin-top: 24px; text-align: center; font-size: ${a.fontSize}; }
          .signature-box { border-top: 1px dashed #000; padding-top: 4px; width: 40%; }
          .footer { text-align: center; margin-top: 16px; font-size: 10px; color: #666; }
          @media print {
            body { width: ${a.width}; margin: 0; padding: ${a.padding}; }
            @page { margin: 0; size: ${a.width} auto; }
            * { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
          }
        </style>
      </head>
      <body>
        ${p.current.innerHTML}
        <script>
          window.onload = function() {
            setTimeout(function() { window.print(); window.close(); }, 300);
          };
        </script>
      </body>
      </html>
    `),b.document.close()):window.print()},[l]);return(0,b.jsx)("div",{className:"modal-overlay",onClick:f,children:(0,b.jsxs)("div",{className:"modal",onClick:a=>a.stopPropagation(),style:{maxWidth:"400px",background:"#fff",color:"#000"},children:[(0,b.jsxs)("div",{ref:p,style:{padding:"20px",fontFamily:"Noto Sans Arabic, sans-serif",direction:"rtl"},children:[(0,b.jsxs)("div",{className:"header",style:{textAlign:"center",borderBottom:"2px solid #000",paddingBottom:"12px",marginBottom:"16px"},children:[(0,b.jsx)("div",{style:{fontSize:"22px",fontWeight:"800",marginBottom:"4px"},children:j}),(0,b.jsx)("div",{style:{fontSize:"16px",fontWeight:"700",border:"1px solid #000",display:"inline-block",padding:"2px 12px",borderRadius:"4px"},children:i("sys.str_111")})]}),(0,b.jsxs)("div",{style:{display:"flex",justifyContent:"space-between",fontSize:"13px",marginBottom:"6px"},children:[(0,b.jsxs)("span",{children:[(0,b.jsx)("strong",{children:i("sys.str_112")})," ",a.receiptNumber]}),(0,b.jsxs)("span",{children:[(0,b.jsx)("strong",{children:i("sys.str_113")})," ",new Date(a.date).toLocaleDateString("ar-SA")]})]}),(0,b.jsxs)("div",{style:{border:"1px solid #000",padding:"12px",borderRadius:"6px",margin:"16px 0",background:"#fafafa",fontSize:"14px",lineHeight:"1.8"},children:[(0,b.jsxs)("div",{children:[(0,b.jsx)("strong",{children:i("sys.str_114")})," ",a.customerName]}),(a.customerTaxNo||a.customerCrNo||a.customerAddress)&&(0,b.jsxs)("div",{style:{fontSize:"12px",color:"#444",marginBottom:"8px",borderBottom:"1px dashed #ccc",paddingBottom:"4px"},children:[a.customerTaxNo&&(0,b.jsxs)("span",{style:{marginLeft:"12px"},children:[(0,b.jsx)("strong",{children:i("sys.str_56")})," ",a.customerTaxNo]}),a.customerCrNo&&(0,b.jsxs)("span",{style:{marginLeft:"12px"},children:[(0,b.jsx)("strong",{children:i("sys.str_115")})," ",a.customerCrNo]}),a.customerAddress&&(0,b.jsxs)("span",{children:[(0,b.jsx)("strong",{children:i("sys.str_61")})," ",a.customerAddress]})]}),(0,b.jsxs)("div",{children:[(0,b.jsx)("strong",{children:i("sys.str_116")})," ",(h=a.amount,new Intl.NumberFormat("ar-SA",{minimumFractionDigits:2,maximumFractionDigits:2}).format(h))," ",i("sys.str_117")]}),(0,b.jsxs)("div",{children:[(0,b.jsx)("strong",{children:i("sys.str_118")})," ",i("sys.str_119"),a.invoiceNumber]}),(0,b.jsxs)("div",{children:[(0,b.jsx)("strong",{children:i("sys.str_120")})," ",{cash:"ظ†ظ‚ط¯ط§ظ‹",card:"بطاقة ظ…ط¯ظ‰/ط§ط¦طھظ…ط§ظ†",transfer:"تحويل بنكي",split:"ظ…ظ‚ط³ظ‘ظ… (ظ†ظ‚ط¯/بطاقة)"}[g=a.paymentMethod]||g]})]}),(0,b.jsxs)("div",{style:{display:"flex",justifyContent:"space-between",marginTop:"32px",textAlign:"center",fontSize:"13px"},children:[(0,b.jsxs)("div",{style:{width:"45%"},children:[(0,b.jsx)("div",{style:{paddingBottom:"24px"},children:i("sys.str_121")}),(0,b.jsx)("div",{style:{borderTop:"1px dashed #000",paddingTop:"4px"},children:i("sys.str_122")})]}),(0,b.jsxs)("div",{style:{width:"45%"},children:[(0,b.jsx)("div",{style:{paddingBottom:"24px"},children:i("sys.str_123")}),(0,b.jsx)("div",{style:{borderTop:"1px dashed #000",paddingTop:"4px"},children:i("sys.str_122")})]})]}),(0,b.jsx)("div",{style:{textAlign:"center",marginTop:"24px",fontSize:"11px",color:"#666"},children:i("sys.str_124")})]}),(0,b.jsxs)("div",{style:{display:"flex",gap:"8px",padding:"16px",borderTop:"1px solid #eee"},className:"no-print",children:[(0,b.jsx)("button",{onClick:s,style:{flex:1,padding:"12px",background:"#3b82f6",color:"#fff",border:"none",borderRadius:"8px",fontSize:"14px",fontWeight:"600",cursor:"pointer",fontFamily:"Noto Sans Arabic"},children:i("sys.str_125")}),(0,b.jsx)("button",{onClick:f,style:{padding:"12px 24px",background:"#f1f5f9",color:"#334155",border:"none",borderRadius:"8px",fontSize:"14px",fontWeight:"600",cursor:"pointer",fontFamily:"Noto Sans Arabic"},children:i("sys.str_77")})]})]})})}a.s(["default",()=>e])}];

//# debugId=4f444bd5-7027-1ffa-e646-c2774a242792
//# sourceMappingURL=%5Broot-of-the-server%5D__cac25c41._.js.map