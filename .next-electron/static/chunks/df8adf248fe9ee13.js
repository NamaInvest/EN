;!function(){try { var e="undefined"!=typeof globalThis?globalThis:"undefined"!=typeof global?global:"undefined"!=typeof window?window:"undefined"!=typeof self?self:{},n=(new e.Error).stack;n&&((e._debugIds|| (e._debugIds={}))[n]="2da57b4d-907a-2f2c-2eb1-4bcfac1c623b")}catch(e){}}();
(globalThis.TURBOPACK||(globalThis.TURBOPACK=[])).push(["object"==typeof document?document.currentScript:void 0,538714,t=>{"use strict";var e=t.i(843476),s=t.i(271645),r=t.i(533499),i=t.i(500932);let o=t=>{let s,r,o,a,n,l,d=(0,i.c)(10),{width:c,height:p,className:x,color:m}=t,h=void 0===c?24:c,f=void 0===p?24:p,u=void 0===x?"":x,g=void 0===m?"currentColor":m;return d[0]===Symbol.for("react.memo_cache_sentinel")?(s={display:"inline-block",verticalAlign:"middle"},r=(0,e.jsx)("path",{d:"M42.5 10 L42.5 50 L20 55 L20 40 L30 37.5 L30 10 Z"}),o=(0,e.jsx)("path",{d:"M42.5 58 L42.5 75 C 42.5 85, 30 90, 15 90 L 15 78 C 25 78, 30 75, 30 65 L 30 60 L 20 62 L 20 48 Z"}),a=(0,e.jsx)("path",{d:"M57.5 10 L57.5 60 L80 55 L80 40 L67.5 42.5 L67.5 10 Z"}),n=(0,e.jsx)("path",{d:"M57.5 68 L57.5 90 L85 85 L85 75 L67.5 78 L67.5 68 Z"}),d[0]=s,d[1]=r,d[2]=o,d[3]=a,d[4]=n):(s=d[0],r=d[1],o=d[2],a=d[3],n=d[4]),d[5]!==u||d[6]!==g||d[7]!==f||d[8]!==h?(l=(0,e.jsxs)("svg",{width:h,height:f,viewBox:"0 0 100 100",fill:g,className:u,xmlns:"http://www.w3.org/2000/svg",style:s,children:[r,o,a,n]}),d[5]=u,d[6]=g,d[7]=f,d[8]=h,d[9]=l):l=d[9],l};function a({invoiceId:t,invoiceData:i,autoPrint:a=!1,isQuote:n=!1,onClose:l}){let{t:d}=(0,r.useTranslation)(),[c,p]=(0,s.useState)(""),[x,m]=(0,s.useState)(""),[h,f]=(0,s.useState)(""),[u,g]=(0,s.useState)("الكاشير"),[b,y]=(0,s.useState)(""),[w,v]=(0,s.useState)(""),[j,N]=(0,s.useState)(""),[S,k]=(0,s.useState)(!0),[z,_]=(0,s.useState)(!1),[A,$]=(0,s.useState)("80mm"),C=(0,s.useRef)(null);(0,s.useEffect)(()=>{(async()=>{let e=await L(),s=window.localStorage.getItem("token");s&&fetch("/api/auth/me",{headers:{Authorization:"Bearer "+s}}).then(t=>t.json()).then(t=>{(t?.user?.fullName||t?.user?.username)&&g(t.user.fullName||t.user.username)}).catch(()=>{}),n?k(!1):t?await W(e?.companyName,e?.vatNumber):i&&await T(e?.companyName,e?.vatNumber)})()},[t,i,n]),(0,s.useEffect)(()=>{if(a&&!S&&!z){if(!n&&!c)return;let t=setTimeout(()=>{E(),_(!0)},500);return()=>clearTimeout(t)}},[a,S,c,z,n]);let L=async()=>{try{let t=await fetch("/api/settings");if(t.ok){let e=await t.json(),s={};e.forEach(t=>{s[t.key]=t.value});let r=s.company_name||s.company_name_ar||d("sys.str_78"),i=s.tax_number||"";return m(r),f(i),$(s.printer_type||"80mm"),y(s.zatca_city||s.company_city||""),v(s.zatca_crn||s.cr_number||""),N(s.company_address||s.company_address_ar||""),{companyName:r,vatNumber:i}}}catch(t){console.error(t)}return null},W=async(e,s)=>{try{let r=await fetch("/api/zatca/qr",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({invoiceId:t,companyName:e,taxNumber:s})});if(r.ok){let t=await r.json();p(t.qrDataUrl)}}catch(t){console.error(t)}finally{k(!1)}},T=async(t,e)=>{if(i)try{let s=await fetch("/api/zatca/qr",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({companyName:t,taxNumber:e,total:i.grandTotal,tax:i.taxAmount,date:i.date||new Date().toISOString()})});if(s.ok){let t=await s.json();p(t.qrDataUrl)}}catch(t){console.error(t)}finally{k(!1)}},F={"58mm":{width:"58mm",padding:"2mm",fontSize:"10px",companySize:"14px",qrSize:"90px",windowWidth:230},"76mm":{width:"76mm",padding:"3mm",fontSize:"11px",companySize:"16px",qrSize:"110px",windowWidth:290},"80mm":{width:"80mm",padding:"4mm",fontSize:"12px",companySize:"18px",qrSize:"120px",windowWidth:310},A4:{width:"210mm",padding:"15mm",fontSize:"14px",companySize:"24px",qrSize:"150px",windowWidth:800},A5:{width:"148mm",padding:"10mm",fontSize:"13px",companySize:"20px",qrSize:"140px",windowWidth:580}},E=(0,s.useCallback)((t=!1)=>{let e=F[A]||F["80mm"],s=n?d("sys.str_79"):["A4","A5"].includes(A)?d("sys.str_80"):d("sys.str_81");if(!C.current)return;let r=`
      <!DOCTYPE html>
      <html dir="rtl" lang="ar">
      <head>
        <meta charset="UTF-8">
        <title>${s}</title>
        <style>
          @import url('https://fonts.googleapis.com/css2?family=Noto Sans Arabic:wght@400;600;800&display=swap');
          * { margin: 0; padding: 0; box-sizing: border-box; }
          body {
            font-family: 'Noto Sans Arabic', sans-serif;
            width: ${e.width};
            padding: ${e.padding};
            font-size: ${e.fontSize};
            line-height: 1.4;
            direction: rtl;
            color: #000;
          }
          .header { text-align: center; border-bottom: 2px solid #000; padding-bottom: 8px; margin-bottom: 8px; }
          .company-name { font-size: ${e.companySize}; font-weight: 800; }
          .vat-num { font-size: 10px; color: #666; }
          .invoice-type { font-size: 10px; color: #999; margin-top: 2px; }
          .info-row { display: flex; justify-content: space-between; font-size: 11px; margin-bottom: 2px; }
          .items-table { width: 100%; border-collapse: collapse; margin: 8px 0; font-size: ${e.fontSize}; border: 1px solid #000; }
          .items-table th, .items-table td { border: 1px solid #000 !important; padding: 4px; text-align: center; }
          .items-table th { font-weight: 600; background: #f9f9f9 !important; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
          .items-table td:first-child, .items-table th:first-child { text-align: right; }
          .totals { padding-top: 8px; }
          .total-row { display: flex; justify-content: space-between; font-size: ${e.fontSize}; margin-bottom: 2px; }
          .grand-total { font-size: 16px; font-weight: 800; border-top: 1px solid #000; padding-top: 6px; margin-top: 4px; }
          .discount { color: #e11d48; }
          ${!n?`
          .qr-section { text-align: center; margin-top: 12px; padding-top: 8px; }
          .qr-section img { width: ${e.qrSize}; height: ${e.qrSize}; }
          .qr-label { font-size: 8px; color: #666; margin-top: 2px; }
          `:""}
          .footer { text-align: center; margin-top: 8px; font-size: 10px; color: #999; border-top: 1px solid #000; padding-top: 8px; }
          @media print {
            body { width: ${e.width}; margin: 0; padding: ${e.padding}; }
            @page { margin: 0; size: ${e.width} auto; }
            table, th, td { border: 1px solid #000 !important; }
            th { border: 1px solid #000 !important; }
            td { border: 1px solid #000 !important; }
            * { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
          }
        </style>
      </head>
      <body>
        ${C.current.innerHTML}
      </body>
      </html>
        `;if(!0===t){let t=window.open("","_blank",`width=${e.windowWidth},height=600`);if(!t)return void window.print();t.document.write(r),t.document.write(`
        <script>
          window.onload = function() {
            setTimeout(function() { window.print(); window.close(); }, 300);
          };
        </script>
            `),t.document.close()}else{let t=document.createElement("iframe");t.style.position="fixed",t.style.right="-9999px",t.style.bottom="-9999px",t.style.width=e.windowWidth+"px",t.style.height="600px",document.body.appendChild(t);let s=t.contentWindow?.document;s&&(s.open(),s.write(r),s.close()),setTimeout(()=>{t.contentWindow&&(t.contentWindow.focus(),t.contentWindow.print()),setTimeout(()=>{try{document.body.removeChild(t)}catch(t){}},5e3)},800)}},[A,n,d,F]),O=(0,s.useCallback)(()=>{let e=document.createElement("script");e.src="https://cdnjs.cloudflare.com/ajax/libs/html2pdf.js/0.10.1/html2pdf.bundle.min.js",e.onload=()=>{let e=t=>new Intl.NumberFormat("ar-SA",{minimumFractionDigits:2,maximumFractionDigits:2}).format(t);if(!i)return;let s=`
                <html dir="rtl" lang="ar">
                <head>
                    <style>
                        @import url('https://fonts.googleapis.com/css2?family=Noto Sans Arabic:wght@400;600;800&display=swap');
                        * { margin: 0; padding: 0; box-sizing: border-box; }
                        body {
                            font-family: 'Noto Sans Arabic', sans-serif;
                            line-height: 1.4;
                            direction: rtl;
                            color: #000;
                            background: white;
                            width: 100%;
                        }
                        .a4-container { width: 100%; padding: 40px; }
                        .a4-header { text-align: center; margin-bottom: 20px; }
                        .a4-header h1 { font-size: 26px; font-weight: 800; margin-bottom: 5px; }
                        .a4-header h2 { font-size: 16px; font-weight: 600; margin-bottom: 5px; }
                        .a4-header h3 { font-size: 14px; color: #666; font-weight: bold; }
                        
                        .info-table { width: 100%; border-collapse: collapse; margin-bottom: 20px; font-size: 12px; border: 2px solid #000; }
                        .info-table td { border: 1px solid #000; padding: 8px; vertical-align: top; }
                        .info-table .ar-cell { text-align: right; width: 50%; }
                        .info-table .en-cell { text-align: left; direction: ltr; width: 50%; }
                        .info-table strong { display: inline-block; width: 120px; }
                        .info-table .en-cell strong { width: 100px; }

                        .items-table { width: 100%; border-collapse: collapse; margin: 15px 0; font-size: 12px; border: 1px solid #000; }
                        .items-table th, .items-table td { border: 1px solid #000 !important; padding: 8px; text-align: center; }
                        .items-table th { font-weight: 600; background: #f9f9f9 !important; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
                        .items-table td:first-child, .items-table th:first-child { text-align: right; }
                        
                        .split-total { display: flex; justify-content: space-between; align-items: center; width: 100%; }
                        .split-total .en-text { font-size: 10px; color: #555; }
                    </style>
                </head>
                <body>
                    <div class="a4-container">
                        <div class="a4-header">
                            <h1>${x}</h1>
                            <h2>الرقم الضريبي : <span dir="ltr">${h}</span></h2>
                            <h3>${n?"عرض سعر / Quotation":"فاتورة ضريبية / Tax Invoice"}</h3>
                        </div>
                        
                        <table class="info-table">
                            <tbody>
                                <tr>
                                    <td class="ar-cell">
                                        <div><strong>المدينة:</strong> ${b}</div>
                                        <div><strong>العنوان:</strong> ${j}</div>
                                        <div><strong>رقم السجل التجاري:</strong> <span dir="ltr">${w}</span></div>
                                    </td>
                                    <td class="en-cell">
                                        <div><strong>City:</strong> ${b}</div>
                                        <div><strong>Address:</strong> ${j}</div>
                                        <div><strong>CR Number:</strong> ${w}</div>
                                    </td>
                                </tr>
                                <tr>
                                    <td class="ar-cell">
                                        <div><strong>الكاشير:</strong> ${u}</div>
                                        <div><strong>العميل:</strong> ${i.customerName||"عميل نقدي"}</div>
                                        <div><strong>رقم الفاتورة:</strong> <span dir="ltr">${i.invoiceNumber}</span></div>
                                        <div><strong>تاريخ الإصدار:</strong> <span dir="ltr">${new Date(i.date).toLocaleString("en-GB")}</span></div>
                                    </td>
                                    <td class="en-cell">
                                        <div><strong>Cashier:</strong> ${u}</div>
                                        <div><strong>Customer:</strong> ${i.customerName||"Cash Customer"}</div>
                                        <div><strong>Invoice No:</strong> ${i.invoiceNumber}</div>
                                        <div><strong>Issue Date:</strong> ${new Date(i.date).toLocaleString("en-GB")}</div>
                                    </td>
                                </tr>
                            </tbody>
                        </table>

                        <table class="items-table">
                            <thead>
                                <tr>
                                    <th style="text-align: right;">المنتج<br/><span style="font-size:10px;font-weight:normal">Product</span></th>
                                    <th>الكمية<br/><span style="font-size:10px;font-weight:normal">Qty</span></th>
                                    <th>سعر الوحدة<br/><span style="font-size:10px;font-weight:normal">Unit Price</span></th>
                                    <th>الإجمالي<br/><span style="font-size:10px;font-weight:normal">Total</span></th>
                                </tr>
                            </thead>
                            <tbody>
                                ${i.items.map(t=>`
                                    <tr>
                                        <td style="text-align: right;">${t.name}</td>
                                        <td>${t.quantity}</td>
                                        <td>${e(t.price)}</td>
                                        <td>${e(t.total)}</td>
                                    </tr>
                                `).join("")}
                                
                                <tr>
                                    <td colSpan="3" style="text-align: left; font-weight: 600;">
                                        <div class="split-total">
                                            <span>الإجمالي الفرعي</span>
                                            <span class="en-text">Subtotal</span>
                                        </div>
                                    </td>
                                    <td style="font-weight: 600;">${e(i.subtotal)}</td>
                                </tr>
                                ${i.discount>0?`
                                <tr>
                                    <td colSpan="3" style="text-align: left; font-weight: 600; color: #e11d48;">
                                        <div class="split-total">
                                            <span>الخصم</span>
                                            <span class="en-text">Discount</span>
                                        </div>
                                    </td>
                                    <td style="font-weight: 600; color: #e11d48;">-${e(i.discount)}</td>
                                </tr>
                                `:""}
                                <tr>
                                    <td colSpan="3" style="text-align: left; font-weight: 600;">
                                        <div class="split-total">
                                            <span>ضريبة القيمة المضافة (${i.taxRate}%)</span>
                                            <span class="en-text">VAT (${i.taxRate}%)</span>
                                        </div>
                                    </td>
                                    <td style="font-weight: 600;">${e(i.taxAmount)}</td>
                                </tr>
                                <tr>
                                    <td colSpan="3" style="text-align: left; font-size: 16px; font-weight: 900;">
                                        <div class="split-total">
                                            <span>الإجمالي الكلي</span>
                                            <span class="en-text">Grand Total</span>
                                        </div>
                                    </td>
                                    <td style="font-size: 16px; font-weight: 900;">${e(i.grandTotal)} <svg width="12" height="12" viewBox="0 0 100 100" fill="#000" style="display:inline-block;vertical-align:middle;margin-right:2px"><path d="M42.5 10 L42.5 50 L20 55 L20 40 L30 37.5 L30 10 Z"></path><path d="M42.5 58 L42.5 75 C 42.5 85, 30 90, 15 90 L 15 78 C 25 78, 30 75, 30 65 L 30 60 L 20 62 L 20 48 Z"></path><path d="M57.5 10 L57.5 60 L80 55 L80 40 L67.5 42.5 L67.5 10 Z"></path><path d="M57.5 68 L57.5 90 L85 85 L85 75 L67.5 78 L67.5 68 Z"></path></svg></td>
                                </tr>
                            </tbody>
                        </table>
                        
                        <div style="margin-top: 40px; display: flex; justify-content: center; align-items: center; width: 100%;">
                            ${!n&&c?`<img src="${c}" style="width: 150px; height: 150px;" />`:""}
                        </div>
                    </div>
                </body>
                </html>
            `;window.html2pdf().from(s).set({margin:0,filename:`Invoice_${i?.invoiceNumber||t||Date.now()}.pdf`,image:{type:"jpeg",quality:1},html2canvas:{scale:2,useCORS:!0},jsPDF:{unit:"mm",format:"a4",orientation:"portrait"}}).save()},document.body.appendChild(e)},[i,t,A,n,x,b,j,w,h,u,c]);if(!i)return null;let M=t=>new Intl.NumberFormat("ar-SA",{minimumFractionDigits:2,maximumFractionDigits:2}).format(t);return(0,e.jsx)("div",{className:"modal-overlay",onClick:l,children:(0,e.jsxs)("div",{className:"modal",onClick:t=>t.stopPropagation(),style:{maxWidth:"400px",background:"#fff",color:"#000"},children:[(0,e.jsxs)("div",{ref:C,style:{padding:"20px",fontFamily:"Noto Sans Arabic, sans-serif",direction:"rtl"},children:[(0,e.jsxs)("div",{className:"header",style:{textAlign:"center",paddingBottom:"12px",marginBottom:"12px"},children:[(0,e.jsx)("div",{style:{fontSize:"22px",fontWeight:"800",marginBottom:"2px"},children:x}),h&&(0,e.jsxs)("div",{style:{fontSize:"11px",color:"#666"},children:[d("sys.str_56"),h]}),(0,e.jsx)("div",{style:{fontSize:"10px",color:"#999",marginTop:"2px"},children:n?d("sys.str_82"):["A4","A5"].includes(A)?d("sys.str_80"):d("sys.str_81")})]}),(0,e.jsx)("table",{style:{width:"100%",borderCollapse:"collapse",fontSize:"11px",marginBottom:"8px",border:"1px solid #000",borderWidth:"1px"},children:(0,e.jsxs)("tbody",{children:[(0,e.jsxs)("tr",{children:[(0,e.jsxs)("td",{colSpan:2,style:{padding:"6px",border:"1px solid #000",borderWidth:"1px"},children:[(0,e.jsxs)("strong",{children:[d("sys.str_84"),":"]})," ",(0,e.jsx)("span",{dir:"ltr",children:i.invoiceNumber})]}),(0,e.jsxs)("td",{colSpan:2,style:{padding:"6px",border:"1px solid #000",borderWidth:"1px"},children:[(0,e.jsx)("strong",{children:"التاريخ:"})," ",(0,e.jsx)("span",{dir:"ltr",children:new Date(i.date).toLocaleString("ar-SA")})]})]}),(0,e.jsxs)("tr",{children:[(0,e.jsxs)("td",{colSpan:2,style:{padding:"6px",border:"1px solid #000",borderWidth:"1px"},children:[(0,e.jsx)("strong",{children:"الكاشير:"})," ",u]}),(0,e.jsxs)("td",{colSpan:2,style:{padding:"6px",border:"1px solid #000",borderWidth:"1px"},children:[(0,e.jsx)("strong",{children:"العميل:"})," ",i.customerName||"عميل نقدي"]})]}),(i.customerTaxNo||i.customerCrNo||i.customerAddress)&&(0,e.jsx)("tr",{children:(0,e.jsxs)("td",{colSpan:4,style:{padding:"6px",border:"1px solid #000",borderWidth:"1px",background:"#fafafa"},children:[i.customerTaxNo&&(0,e.jsxs)("div",{children:[(0,e.jsx)("strong",{children:d("sys.str_59")})," ",i.customerTaxNo]}),i.customerCrNo&&(0,e.jsxs)("div",{children:[(0,e.jsx)("strong",{children:d("sys.str_60")})," ",i.customerCrNo]}),i.customerAddress&&(0,e.jsxs)("div",{children:[(0,e.jsx)("strong",{children:d("sys.str_61")})," ",i.customerAddress]})]})}),(0,e.jsxs)("tr",{style:{background:"#f0f0f0",WebkitPrintColorAdjust:"exact",printColorAdjust:"exact"},children:[(0,e.jsx)("th",{style:{textAlign:"right",padding:"6px",fontWeight:"800",border:"1px solid #000",borderWidth:"1px"},children:d("sys.str_63")}),(0,e.jsx)("th",{style:{textAlign:"center",padding:"6px",fontWeight:"800",border:"1px solid #000",borderWidth:"1px",width:"40px"},children:d("sys.str_64")}),(0,e.jsx)("th",{style:{textAlign:"center",padding:"6px",fontWeight:"800",border:"1px solid #000",borderWidth:"1px",width:"60px"},children:d("sys.str_65")}),(0,e.jsx)("th",{style:{textAlign:"center",padding:"6px",fontWeight:"800",border:"1px solid #000",borderWidth:"1px",width:"70px"},children:d("sys.str_66")})]}),i.items.map((t,s)=>(0,e.jsxs)("tr",{children:[(0,e.jsx)("td",{style:{padding:"4px 6px",border:"1px solid #000",borderWidth:"1px"},children:t.name}),(0,e.jsx)("td",{style:{textAlign:"center",padding:"4px",border:"1px solid #000",borderWidth:"1px"},children:t.quantity}),(0,e.jsx)("td",{style:{textAlign:"center",padding:"4px",border:"1px solid #000",borderWidth:"1px"},children:M(t.price)}),(0,e.jsx)("td",{style:{textAlign:"center",padding:"4px",border:"1px solid #000",borderWidth:"1px"},children:M(t.total)})]},s)),(0,e.jsxs)("tr",{children:[(0,e.jsx)("td",{colSpan:3,style:{padding:"6px",textAlign:"left",fontWeight:"600",border:"1px solid #000",borderWidth:"1px"},children:d("sys.str_67")}),(0,e.jsx)("td",{style:{padding:"6px",textAlign:"center",fontWeight:"600",border:"1px solid #000",borderWidth:"1px"},children:M(i.subtotal)})]}),i.discount>0&&(0,e.jsxs)("tr",{children:[(0,e.jsx)("td",{colSpan:3,style:{padding:"6px",textAlign:"left",fontWeight:"600",color:"#e11d48",border:"1px solid #000",borderWidth:"1px"},children:d("sys.str_69")}),(0,e.jsxs)("td",{style:{padding:"6px",textAlign:"center",fontWeight:"600",color:"#e11d48",border:"1px solid #000",borderWidth:"1px"},children:["-",M(i.discount)]})]}),(0,e.jsxs)("tr",{children:[(0,e.jsxs)("td",{colSpan:3,style:{padding:"6px",textAlign:"left",fontWeight:"600",border:"1px solid #000",borderWidth:"1px"},children:[d("sys.str_70"),i.taxRate,"%):"]}),(0,e.jsx)("td",{style:{padding:"6px",textAlign:"center",fontWeight:"600",border:"1px solid #000",borderWidth:"1px"},children:M(i.taxAmount)})]}),(0,e.jsxs)("tr",{children:[(0,e.jsx)("td",{colSpan:3,style:{padding:"8px",textAlign:"left",fontSize:"14px",fontWeight:"900",border:"1px solid #000",borderWidth:"1px",background:"#f9f9f9",WebkitPrintColorAdjust:"exact",printColorAdjust:"exact"},children:d("sys.str_71")}),(0,e.jsxs)("td",{style:{padding:"8px",textAlign:"center",fontSize:"14px",fontWeight:"900",border:"1px solid #000",borderWidth:"1px",background:"#f9f9f9",WebkitPrintColorAdjust:"exact",printColorAdjust:"exact"},children:[M(i.grandTotal)," ",(0,e.jsx)(o,{width:12,height:12,color:"#000"})]})]})]})}),!n&&(0,e.jsx)("div",{style:{textAlign:"center",margin:"16px auto 0",paddingTop:"12px",maxWidth:"140px"},className:"qr-section",children:S?(0,e.jsx)("div",{style:{padding:"16px",color:"#999",fontSize:"11px"},children:d("sys.str_72")}):c?(0,e.jsxs)(e.Fragment,{children:[(0,e.jsx)("img",{src:c,alt:"ZATCA QR Code",style:{width:"120px",height:"120px",margin:"0 auto",display:"block"}}),(0,e.jsx)("div",{style:{fontSize:"8px",color:"#666",marginTop:"4px",textAlign:"center"},children:d("sys.str_73")})]}):null}),(0,e.jsx)("div",{className:"footer",style:{textAlign:"center",marginTop:"12px",fontSize:"10px",color:"#999",borderTop:"1px solid #000",paddingTop:"8px"},children:d("sys.str_74")})]}),(0,e.jsxs)("div",{style:{display:"flex",gap:"8px",padding:"16px",borderTop:"1px solid #eee",flexWrap:"wrap"},className:"no-print",children:[(0,e.jsx)("button",{onClick:()=>E(!1),style:{flex:1,padding:"12px",background:"#6C63FF",color:"#fff",border:"none",borderRadius:"8px",fontSize:"14px",fontWeight:"600",cursor:"pointer",fontFamily:"Noto Sans Arabic"},children:"طباعة فورية"}),(0,e.jsx)("button",{onClick:()=>E(!0),style:{flex:1,padding:"12px",background:"#3b82f6",color:"#fff",border:"none",borderRadius:"8px",fontSize:"14px",fontWeight:"600",cursor:"pointer",fontFamily:"Noto Sans Arabic"},children:"خيارات الطباعة"}),(0,e.jsx)("button",{onClick:O,style:{flex:1,padding:"12px",background:"#ef4444",color:"#fff",border:"none",borderRadius:"8px",fontSize:"14px",fontWeight:"600",cursor:"pointer",fontFamily:"Noto Sans Arabic"},children:d("sys.str_76")}),(0,e.jsx)("button",{onClick:l,style:{padding:"12px 24px",background:"#f1f5f9",color:"#334155",border:"none",borderRadius:"8px",fontSize:"14px",fontWeight:"600",cursor:"pointer",fontFamily:"Noto Sans Arabic"},children:d("sys.str_77")})]})]})})}t.s(["default",()=>a],538714)},228410,300135,737173,t=>{"use strict";let e,s;var r,i=t.i(843476),o=t.i(271645),a=t.i(533499),n=t.i(37727);function l({isOpen:t,onClose:e}){let s,r,{t:l}=(0,a.useTranslation)(),[d,c]=(0,o.useState)(""),[p,x]=(0,o.useState)(null),[m,h]=(0,o.useState)([]),[f,u]=(0,o.useState)(""),[g,b]=(0,o.useState)(!1),[y,w]=(0,o.useState)(""),[v,j]=(0,o.useState)("");if(!t)return null;let N=t=>t.toLocaleString("en-SA",{minimumFractionDigits:2}),S=async()=>{if(d){b(!0),w(""),j(""),x(null),h([]);try{let t=await fetch(`/api/sales?invoiceNo=${d}`);if(t.ok){let e=await t.json();if(e&&e.length>0){let t=e[0];x(t);let s=t.details.map(t=>({productId:t.productId,productName:t.productName,soldQuantity:t.quantity,returnQuantity:0,price:t.price,discountRate:t.discountRate}));h(s)}else w(l("sales.str_1144")||"الفاتورة غير موجودة")}else w(l("sales.str_1145")||"خطأ في جلب الفاتورة")}catch(t){console.error(t),w(l("sales.str_1146")||"حدث خطأ بالاتصال")}b(!1)}},k=(s=0,m.forEach(t=>{if(t.returnQuantity>0){let e=t.returnQuantity*t.price,r=e*(t.discountRate/100);s+=e-r}}),r=.15*s,{subtotal:s,tax:r,total:s+r}),z=async()=>{let t=m.filter(t=>t.returnQuantity>0).map(t=>({productId:t.productId,productName:t.productName,quantity:t.returnQuantity,price:t.price,discountRate:t.discountRate}));if(0===t.length)return void w(l("sales.str_1147")||"يجب تحديد كمية صالحة للارجاع");let s={originalInvoiceId:p?.id,notes:f,items:t};try{let t=await fetch("/api/sales-returns",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify(s)});if(t.ok)j("✅ تم إنشاء فاتورة الاسترجاع بنجاح"),c(""),x(null),h([]),u(""),setTimeout(()=>{j(""),e()},2e3);else{let e=await t.json();w(e.error||l("sales.str_1148"))}}catch(t){console.error(t),w(l("sales.str_1149")||"فشل في الاتصال وحفظ المرتجع")}};return(0,i.jsxs)(i.Fragment,{children:[(0,i.jsx)("div",{className:"fixed inset-0 bg-black/60 z-[9998]",onClick:e}),(0,i.jsxs)("div",{className:"fixed top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 bg-white rounded-xl shadow-2xl z-[9999] w-[95%] max-w-4xl p-0 overflow-hidden flex flex-col",style:{maxHeight:"90vh"},children:[(0,i.jsxs)("div",{className:"bg-slate-50 border-b border-slate-100 p-4 flex justify-between items-center",children:[(0,i.jsxs)("h2",{className:"text-lg font-bold text-slate-800 flex items-center gap-2",children:[(0,i.jsx)("span",{className:"text-red-500",children:"↩"})," ",l("sales.str_1128")||"استرجاع فاتورة (مرتجع)"]}),(0,i.jsx)("button",{onClick:e,className:"p-1 hover:bg-slate-200 rounded-lg text-slate-500 transition",children:(0,i.jsx)(n.X,{size:20})})]}),(0,i.jsxs)("div",{className:"p-6 overflow-y-auto flex-1",children:[v&&(0,i.jsx)("div",{className:"mb-6 p-4 bg-green-50 text-green-700 border border-green-200 rounded-lg font-bold",children:v}),(0,i.jsxs)("div",{className:"flex gap-4 items-end mb-8 bg-slate-50 p-4 rounded-xl border border-slate-100",children:[(0,i.jsxs)("div",{className:"flex-1",children:[(0,i.jsx)("label",{className:"text-xs font-bold text-slate-500 block mb-2",children:l("sales.str_1129")||"رقم الفاتورة الأصلي"}),(0,i.jsx)("input",{value:d,onChange:t=>c(t.target.value),placeholder:l("sales.str_1150")||"أدخل رقم الفاتورة للبحث",onKeyDown:t=>"Enter"===t.key&&S(),className:"w-full px-4 py-2.5 rounded-lg border border-slate-200 focus:border-red-500 focus:ring-1 focus:ring-red-500 outline-none transition"})]}),(0,i.jsx)("button",{className:"px-6 py-2.5 bg-slate-800 text-white font-bold rounded-lg hover:bg-slate-700 transition disabled:opacity-50",onClick:S,disabled:g||!d,children:g?l("sales.str_1151"):l("sales.str_1152")||"بحث عن الفاتورة"})]}),y&&(0,i.jsx)("div",{className:"mb-6 p-3 bg-red-50 text-red-600 rounded-lg text-sm border border-red-100",children:y}),p&&(0,i.jsxs)("div",{className:"bg-white border border-slate-200 rounded-xl overflow-hidden",children:[(0,i.jsxs)("div",{className:"flex justify-between items-center p-4 bg-slate-50 border-b border-slate-200 text-sm",children:[(0,i.jsxs)("div",{children:[(0,i.jsx)("span",{className:"text-slate-500",children:l("sales.str_1130")})," ",(0,i.jsxs)("strong",{className:"text-slate-800",children:["#",p.invoiceNo]})]}),(0,i.jsxs)("div",{children:[(0,i.jsx)("span",{className:"text-slate-500",children:l("sys.str_113")})," ",(0,i.jsx)("strong",{className:"text-slate-800",children:new Date(p.date).toLocaleDateString("ar-SA")})]}),(0,i.jsxs)("div",{children:[(0,i.jsx)("span",{className:"text-slate-500",children:l("sales.str_1131")})," ",(0,i.jsxs)("strong",{className:"text-slate-800",children:[N(p.total)," ",l("sys.str_68")]})]})]}),(0,i.jsx)("div",{className:"overflow-x-auto",children:(0,i.jsxs)("table",{className:"w-full text-sm",children:[(0,i.jsx)("thead",{className:"bg-slate-50 border-b border-slate-200",children:(0,i.jsxs)("tr",{children:[(0,i.jsx)("th",{className:"p-3 text-right font-bold text-slate-600",children:l("sys.str_63")||"المنتج"}),(0,i.jsx)("th",{className:"p-3 text-center font-bold text-slate-600",children:l("sales.str_1132")||"الكمية المباعة"}),(0,i.jsx)("th",{className:"p-3 text-center font-bold text-slate-600 w-40",children:l("sales.str_1133")||"كمية الإرجاع"}),(0,i.jsx)("th",{className:"p-3 text-left font-bold text-slate-600",children:l("sales.str_1134")||"إجمالي الخصم (للمرتجع)"})]})}),(0,i.jsx)("tbody",{className:"divide-y divide-slate-100",children:m.map(t=>{let e=t.returnQuantity*t.price*(1-t.discountRate/100)*1.15;return(0,i.jsxs)("tr",{className:"hover:bg-slate-50/50",children:[(0,i.jsx)("td",{className:"p-3 font-semibold text-slate-800",children:t.productName}),(0,i.jsx)("td",{className:"p-3 text-center font-mono text-slate-500",children:t.soldQuantity}),(0,i.jsx)("td",{className:"p-3 text-center",children:(0,i.jsx)("input",{type:"number",min:"0",max:t.soldQuantity,value:0===t.returnQuantity?"":t.returnQuantity,placeholder:"0",onChange:e=>{var s;let r;return s=t.productId,r=parseFloat(e.target.value)||0,void h(t=>t.map(t=>{if(t.productId===s){let e=Math.max(0,Math.min(r,t.soldQuantity));return{...t,returnQuantity:e}}return t}))},className:"w-20 px-3 py-1.5 rounded-md border border-red-200 focus:border-red-500 text-center font-bold outline-none"})}),(0,i.jsx)("td",{className:"p-3 text-left font-mono font-bold text-red-500",children:e>0?`-${N(e)}`:"0.00"})]},t.productId)})})]})}),(0,i.jsxs)("div",{className:"bg-slate-50 p-4 border-t border-slate-200 flex flex-col md:flex-row justify-between items-center gap-4",children:[(0,i.jsxs)("div",{className:"flex-1 w-full relative",children:[(0,i.jsx)("label",{className:"text-xs font-bold text-slate-500 block mb-1",children:l("sales.str_1135")||"ملاحظات وتسبب الارجاع (اختياري)"}),(0,i.jsx)("input",{value:f,onChange:t=>u(t.target.value),placeholder:l("sales.str_1153")||"اكتب أي ملاحظات هنا..",className:"w-full max-w-sm px-4 py-2 rounded-lg border border-slate-200 focus:border-red-500 outline-none"})]}),(0,i.jsxs)("div",{className:"text-left bg-white p-3 rounded-lg border border-slate-200 min-w-[200px]",children:[(0,i.jsxs)("div",{className:"text-xs text-slate-500 flex justify-between mb-1",children:[(0,i.jsx)("span",{children:l("sales.str_1136")||"المجموع الفرعي:"}),(0,i.jsx)("span",{className:"font-mono",children:N(k.subtotal)})]}),(0,i.jsxs)("div",{className:"text-xs text-slate-500 flex justify-between mb-2",children:[(0,i.jsx)("span",{children:l("sales.str_1137")||"الضريبة (15%):"}),(0,i.jsx)("span",{className:"font-mono",children:N(k.tax)})]}),(0,i.jsxs)("div",{className:"text-base text-red-600 font-bold flex justify-between border-t border-slate-100 pt-2 mt-1",children:[(0,i.jsx)("span",{children:l("sales.str_1138")||"قيمة المرتجع:"}),(0,i.jsxs)("span",{className:"font-mono",children:[N(k.total)," ",l("sys.str_68")||"ر.س"]})]})]})]})]})]}),(0,i.jsxs)("div",{className:"p-4 border-t border-slate-100 bg-white flex justify-end gap-3",children:[(0,i.jsx)("button",{className:"px-6 py-2.5 font-bold rounded-lg text-slate-600 hover:bg-slate-100 transition",onClick:e,children:"إلغاء"}),p&&(0,i.jsx)("button",{className:"px-8 py-2.5 bg-red-500 hover:bg-red-600 text-white font-bold rounded-lg transition shadow-sm shadow-red-500/20 disabled:opacity-50 disabled:cursor-not-allowed",onClick:z,disabled:0===k.total,children:l("sales.str_1139")||"اعتماد وترجيع المبلغ"})]})]})]})}t.s(["default",()=>l],228410);var d=t.i(500932),c=t.i(495590);function p(t){let e,s=(0,d.c)(4),{featureKey:r,children:o,fallback:a}=t,n=void 0===a?null:a;if(!(0,c.useFeatureFlag)(r)){let t;return s[0]!==n?(t=(0,i.jsx)(i.Fragment,{children:n}),s[0]=n,s[1]=t):t=s[1],t}return s[2]!==o?(e=(0,i.jsx)(i.Fragment,{children:o}),s[2]=o,s[3]=e):e=s[3],e}t.s(["FeatureGuard",()=>p],300135);var x=t.i(475254);let m=(0,x.default)("wifi",[["path",{d:"M12 20h.01",key:"zekei9"}],["path",{d:"M2 8.82a15 15 0 0 1 20 0",key:"dnpr2z"}],["path",{d:"M5 12.859a10 10 0 0 1 14 0",key:"1x1e6c"}],["path",{d:"M8.5 16.429a5 5 0 0 1 7 0",key:"1bycff"}]]),h=(0,x.default)("wifi-off",[["path",{d:"M12 20h.01",key:"zekei9"}],["path",{d:"M8.5 16.429a5 5 0 0 1 7 0",key:"1bycff"}],["path",{d:"M5 12.859a10 10 0 0 1 5.17-2.69",key:"1dl1wf"}],["path",{d:"M19 12.859a10 10 0 0 0-2.007-1.523",key:"4k23kn"}],["path",{d:"M2 8.82a15 15 0 0 1 4.177-2.643",key:"1grhjp"}],["path",{d:"M22 8.82a15 15 0 0 0-11.288-3.764",key:"z3jwby"}],["path",{d:"m2 2 20 20",key:"1ooewy"}]]),f=(0,x.default)("cloud",[["path",{d:"M17.5 19H9a7 7 0 1 1 6.71-9h1.79a4.5 4.5 0 1 1 0 9Z",key:"p7xjir"}]]),u=(0,x.default)("cloud-off",[["path",{d:"M10.94 5.274A7 7 0 0 1 15.71 10h1.79a4.5 4.5 0 0 1 4.222 6.057",key:"1uxyv8"}],["path",{d:"M18.796 18.81A4.5 4.5 0 0 1 17.5 19H9A7 7 0 0 1 5.79 5.78",key:"99tcn7"}],["path",{d:"m2 2 20 20",key:"1ooewy"}]]);var g=t.i(16715);let b={data:""},y=/(?:([\u0080-\uFFFF\w-%@]+) *:? *([^{;]+?);|([^;}{]*?) *{)|(}\s*)/g,w=/\/\*[^]*?\*\/|  +/g,v=/\n+/g,j=(t,e)=>{let s="",r="",i="";for(let o in t){let a=t[o];"@"==o[0]?"i"==o[1]?s=o+" "+a+";":r+="f"==o[1]?j(a,o):o+"{"+j(a,"k"==o[1]?"":e)+"}":"object"==typeof a?r+=j(a,e?e.replace(/([^,])+/g,t=>o.replace(/([^,]*:\S+\([^)]*\))|([^,])+/g,e=>/&/.test(e)?e.replace(/&/g,t):t?t+" "+e:e)):o):null!=a&&(o=/^--/.test(o)?o:o.replace(/[A-Z]/g,"-$&").toLowerCase(),i+=j.p?j.p(o,a):o+":"+a+";")}return s+(e&&i?e+"{"+i+"}":i)+r},N={},S=t=>{if("object"==typeof t){let e="";for(let s in t)e+=s+S(t[s]);return e}return t};function k(t){let e,s,r=this||{},i=t.call?t(r.p):t;return((t,e,s,r,i)=>{var o;let a=S(t),n=N[a]||(N[a]=(t=>{let e=0,s=11;for(;e<t.length;)s=101*s+t.charCodeAt(e++)>>>0;return"go"+s})(a));if(!N[n]){let e=a!==t?t:(t=>{let e,s,r=[{}];for(;e=y.exec(t.replace(w,""));)e[4]?r.shift():e[3]?(s=e[3].replace(v," ").trim(),r.unshift(r[0][s]=r[0][s]||{})):r[0][e[1]]=e[2].replace(v," ").trim();return r[0]})(t);N[n]=j(i?{["@keyframes "+n]:e}:e,s?"":"."+n)}let l=s&&N.g?N.g:null;return s&&(N.g=N[n]),o=N[n],l?e.data=e.data.replace(l,o):-1===e.data.indexOf(o)&&(e.data=r?o+e.data:e.data+o),n})(i.unshift?i.raw?(e=[].slice.call(arguments,1),s=r.p,i.reduce((t,r,i)=>{let o=e[i];if(o&&o.call){let t=o(s),e=t&&t.props&&t.props.className||/^go/.test(t)&&t;o=e?"."+e:t&&"object"==typeof t?t.props?"":j(t,""):!1===t?"":t}return t+r+(null==o?"":o)},"")):i.reduce((t,e)=>Object.assign(t,e&&e.call?e(r.p):e),{}):i,(t=>{if("object"==typeof window){let e=(t?t.querySelector("#_goober"):window._goober)||Object.assign(document.createElement("style"),{innerHTML:" ",id:"_goober"});return e.nonce=window.__nonce__,e.parentNode||(t||document.head).appendChild(e),e.firstChild}return t||b})(r.target),r.g,r.o,r.k)}k.bind({g:1});let z,_,A,$=k.bind({k:1});function C(t,e){let s=this||{};return function(){let r=arguments;function i(o,a){let n=Object.assign({},o),l=n.className||i.className;s.p=Object.assign({theme:_&&_()},n),s.o=/ *go\d+/.test(l),n.className=k.apply(s,r)+(l?" "+l:""),e&&(n.ref=a);let d=t;return t[0]&&(d=n.as||t,delete n.as),A&&d[0]&&A(n),z(d,n)}return e?e(i):i}}var L=(t,e)=>"function"==typeof t?t(e):t,W=(e=0,()=>(++e).toString()),T="default",F=(t,e)=>{let{toastLimit:s}=t.settings;switch(e.type){case 0:return{...t,toasts:[e.toast,...t.toasts].slice(0,s)};case 1:return{...t,toasts:t.toasts.map(t=>t.id===e.toast.id?{...t,...e.toast}:t)};case 2:let{toast:r}=e;return F(t,{type:+!!t.toasts.find(t=>t.id===r.id),toast:r});case 3:let{toastId:i}=e;return{...t,toasts:t.toasts.map(t=>t.id===i||void 0===i?{...t,dismissed:!0,visible:!1}:t)};case 4:return void 0===e.toastId?{...t,toasts:[]}:{...t,toasts:t.toasts.filter(t=>t.id!==e.toastId)};case 5:return{...t,pausedAt:e.time};case 6:let o=e.time-(t.pausedAt||0);return{...t,pausedAt:void 0,toasts:t.toasts.map(t=>({...t,pauseDuration:t.pauseDuration+o}))}}},E=[],O={toasts:[],pausedAt:void 0,settings:{toastLimit:20}},M={},I=(t,e=T)=>{M[e]=F(M[e]||O,t),E.forEach(([t,s])=>{t===e&&s(M[e])})},D=t=>Object.keys(M).forEach(e=>I(t,e)),q=(t=T)=>e=>{I(e,t)},R=t=>(e,s)=>{let r,i=((t,e="blank",s)=>({createdAt:Date.now(),visible:!0,dismissed:!1,type:e,ariaProps:{role:"status","aria-live":"polite"},message:t,pauseDuration:0,...s,id:(null==s?void 0:s.id)||W()}))(e,t,s);return q(i.toasterId||(r=i.id,Object.keys(M).find(t=>M[t].toasts.some(t=>t.id===r))))({type:2,toast:i}),i.id},P=(t,e)=>R("blank")(t,e);P.error=R("error"),P.success=R("success"),P.loading=R("loading"),P.custom=R("custom"),P.dismiss=(t,e)=>{let s={type:3,toastId:t};e?q(e)(s):D(s)},P.dismissAll=t=>P.dismiss(void 0,t),P.remove=(t,e)=>{let s={type:4,toastId:t};e?q(e)(s):D(s)},P.removeAll=t=>P.remove(void 0,t),P.promise=(t,e,s)=>{let r=P.loading(e.loading,{...s,...null==s?void 0:s.loading});return"function"==typeof t&&(t=t()),t.then(t=>{let i=e.success?L(e.success,t):void 0;return i?P.success(i,{id:r,...s,...null==s?void 0:s.success}):P.dismiss(r),t}).catch(t=>{let i=e.error?L(e.error,t):void 0;i?P.error(i,{id:r,...s,...null==s?void 0:s.error}):P.dismiss(r)}),t};var Q=$`
from {
  transform: scale(0) rotate(45deg);
	opacity: 0;
}
to {
 transform: scale(1) rotate(45deg);
  opacity: 1;
}`,B=$`
from {
  transform: scale(0);
  opacity: 0;
}
to {
  transform: scale(1);
  opacity: 1;
}`,Z=$`
from {
  transform: scale(0) rotate(90deg);
	opacity: 0;
}
to {
  transform: scale(1) rotate(90deg);
	opacity: 1;
}`,U=C("div")`
  width: 20px;
  opacity: 0;
  height: 20px;
  border-radius: 10px;
  background: ${t=>t.primary||"#ff4b4b"};
  position: relative;
  transform: rotate(45deg);

  animation: ${Q} 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275)
    forwards;
  animation-delay: 100ms;

  &:after,
  &:before {
    content: '';
    animation: ${B} 0.15s ease-out forwards;
    animation-delay: 150ms;
    position: absolute;
    border-radius: 3px;
    opacity: 0;
    background: ${t=>t.secondary||"#fff"};
    bottom: 9px;
    left: 4px;
    height: 2px;
    width: 12px;
  }

  &:before {
    animation: ${Z} 0.15s ease-out forwards;
    animation-delay: 180ms;
    transform: rotate(90deg);
  }
`,H=$`
  from {
    transform: rotate(0deg);
  }
  to {
    transform: rotate(360deg);
  }
`,J=C("div")`
  width: 12px;
  height: 12px;
  box-sizing: border-box;
  border: 2px solid;
  border-radius: 100%;
  border-color: ${t=>t.secondary||"#e0e0e0"};
  border-right-color: ${t=>t.primary||"#616161"};
  animation: ${H} 1s linear infinite;
`,G=$`
from {
  transform: scale(0) rotate(45deg);
	opacity: 0;
}
to {
  transform: scale(1) rotate(45deg);
	opacity: 1;
}`,K=$`
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
}`,V=C("div")`
  width: 20px;
  opacity: 0;
  height: 20px;
  border-radius: 10px;
  background: ${t=>t.primary||"#61d345"};
  position: relative;
  transform: rotate(45deg);

  animation: ${G} 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275)
    forwards;
  animation-delay: 100ms;
  &:after {
    content: '';
    box-sizing: border-box;
    animation: ${K} 0.2s ease-out forwards;
    opacity: 0;
    animation-delay: 200ms;
    position: absolute;
    border-right: 2px solid;
    border-bottom: 2px solid;
    border-color: ${t=>t.secondary||"#fff"};
    bottom: 6px;
    left: 6px;
    height: 10px;
    width: 6px;
  }
`,X=C("div")`
  position: absolute;
`,Y=C("div")`
  position: relative;
  display: flex;
  justify-content: center;
  align-items: center;
  min-width: 20px;
  min-height: 20px;
`,tt=$`
from {
  transform: scale(0.6);
  opacity: 0.4;
}
to {
  transform: scale(1);
  opacity: 1;
}`,te=C("div")`
  position: relative;
  transform: scale(0.6);
  opacity: 0.4;
  min-width: 20px;
  animation: ${tt} 0.3s 0.12s cubic-bezier(0.175, 0.885, 0.32, 1.275)
    forwards;
`,ts=({toast:t})=>{let{icon:e,type:s,iconTheme:r}=t;return void 0!==e?"string"==typeof e?o.createElement(te,null,e):e:"blank"===s?null:o.createElement(Y,null,o.createElement(J,{...r}),"loading"!==s&&o.createElement(X,null,"error"===s?o.createElement(U,{...r}):o.createElement(V,{...r})))},tr=C("div")`
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
`,ti=C("div")`
  display: flex;
  justify-content: center;
  margin: 4px 10px;
  color: inherit;
  flex: 1 1 auto;
  white-space: pre-line;
`;function to(){let[t,e]=(0,o.useState)(!1),[s,r]=(0,o.useState)(0),[a,n]=(0,o.useState)(!1);(0,o.useEffect)(()=>{e(!navigator.onLine);let t=()=>{e(!1),P.success("تمت استعادة الاتصال بالإنترنت",{position:"top-left"}),d()},s=()=>{e(!0),P.error("انقطع الاتصال بالإنترنت - يتم العمل على قاعدة البيانات المحلية",{position:"top-left",duration:5e3})};window.addEventListener("online",t),window.addEventListener("offline",s),l();let r=setInterval(()=>{navigator.onLine&&d()},6e4);return()=>{window.removeEventListener("online",t),window.removeEventListener("offline",s),clearInterval(r)}},[]);let l=(0,o.useCallback)(async()=>{if(window.electron)try{let t=await window.electron.invoke("offline-db-get-pending");r(t?.length||0)}catch(t){}},[]),d=(0,o.useCallback)(async()=>{if(window.electron&&!a&&navigator.onLine)try{let t=await window.electron.invoke("offline-db-get-pending");if(!t||0===t.length)return;n(!0),r(t.length);let e=0;for(let s of t)try{if(s.retryCount>10)continue;let t=s.data._endpoint||"/api/pos/invoice",r={...s.data};delete r._endpoint;let i=await fetch(t,{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify(r)});(await i.json()).success?(await window.electron.invoke("offline-db-mark-synced",s.uuid),e++):await window.electron.invoke("offline-db-increment-retry",s.uuid)}catch(t){await window.electron.invoke("offline-db-increment-retry",s.uuid)}e>0&&(P.success(`تمت مزامنة ${e} فاتورة مع السحابة بنجاح`),await window.electron.invoke("offline-db-delete-synced"))}catch(t){console.error("Sync error:",t)}finally{n(!1),l()}},[a,l]),c=async(e,s="/api/pos/invoice")=>{if(t){if(window.electron){let t={...e,_endpoint:s},r=await window.electron.invoke("offline-db-save-invoice",t);if(r)return P.success("تم الحفظ محلياً (Offline)",{icon:"💾"}),l(),{success:!0,offline:!0,uuid:r}}return P.error("فشل الحفظ - البرنامج غير متصل بالخادم ولا يدعم الحفظ المحلي"),{success:!1,error:"Offline without local DB"}}try{let t=await fetch(s,{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify(e)}),r=await t.json();if(!r.success)throw Error(r.error);return{success:!0,offline:!1,...r}}catch(t){if(window.electron){let t={...e,_endpoint:s},r=await window.electron.invoke("offline-db-save-invoice",t);if(r)return P.error("فشل الاتصال - تم حفظ الفاتورة محلياً وسيتم رفعها لاحقاً"),l(),{success:!0,offline:!0,uuid:r}}return{success:!1,error:t.message}}};return{isOffline:t,pendingCount:s,isSyncing:a,saveInvoiceWithSync:c,OfflineBadge:()=>window.electron?(0,i.jsxs)("div",{className:"flex items-center gap-3",children:[t?(0,i.jsxs)("div",{className:"flex items-center gap-2 bg-red-900/40 text-red-400 px-3 py-1.5 rounded-full border border-red-800/50 text-sm font-bold animate-pulse",children:[(0,i.jsx)(h,{size:16}),(0,i.jsx)("span",{children:"غير متصل (Offline)"})]}):(0,i.jsxs)("div",{className:"flex items-center gap-2 bg-emerald-900/40 text-emerald-400 px-3 py-1.5 rounded-full border border-emerald-800/50 text-sm font-bold",children:[(0,i.jsx)(m,{size:16}),(0,i.jsx)("span",{children:"متصل بالسحابة"})]}),s>0&&(0,i.jsxs)("button",{onClick:()=>!t&&d(),disabled:t||a,className:`flex items-center gap-2 px-3 py-1.5 rounded-full text-sm font-bold transition-all ${t?"bg-orange-900/40 text-orange-400 border border-orange-800/50 cursor-not-allowed":"bg-blue-900/40 text-blue-400 border border-blue-800/50 hover:bg-blue-800/50 cursor-pointer"}`,title:"مزامنة الفواتير",children:[a?(0,i.jsx)(g.RefreshCw,{size:16,className:"animate-spin"}):t?(0,i.jsx)(u,{size:16}):(0,i.jsx)(f,{size:16}),(0,i.jsxs)("span",{children:[s," بانتظار الرفع"]})]})]}):null,syncPendingInvoices:d,cacheProducts:async t=>{window.electron&&t.length>0&&await window.electron.invoke("offline-db-save-products",t)},refreshPendingCount:l}}o.memo(({toast:t,position:e,style:r,children:i})=>{let a=t.height?((t,e)=>{let r=t.includes("top")?1:-1,[i,o]=(()=>{if(void 0===s&&"u">typeof window){let t=matchMedia("(prefers-reduced-motion: reduce)");s=!t||t.matches}return s})()?["0%{opacity:0;} 100%{opacity:1;}","0%{opacity:1;} 100%{opacity:0;}"]:[`
0% {transform: translate3d(0,${-200*r}%,0) scale(.6); opacity:.5;}
100% {transform: translate3d(0,0,0) scale(1); opacity:1;}
`,`
0% {transform: translate3d(0,0,-1px) scale(1); opacity:1;}
100% {transform: translate3d(0,${-150*r}%,-1px) scale(.6); opacity:0;}
`];return{animation:e?`${$(i)} 0.35s cubic-bezier(.21,1.02,.73,1) forwards`:`${$(o)} 0.4s forwards cubic-bezier(.06,.71,.55,1)`}})(t.position||e||"top-center",t.visible):{opacity:0},n=o.createElement(ts,{toast:t}),l=o.createElement(ti,{...t.ariaProps},L(t.message,t));return o.createElement(tr,{className:t.className,style:{...a,...r,...t.style}},"function"==typeof i?i({icon:n,message:l}):o.createElement(o.Fragment,null,n,l))}),r=o.createElement,j.p=void 0,z=r,_=void 0,A=void 0,k`
  z-index: 9999;
  > * {
    pointer-events: auto;
  }
`,t.s(["useOfflineSync",()=>to],737173)}]);

//# debugId=2da57b4d-907a-2f2c-2eb1-4bcfac1c623b