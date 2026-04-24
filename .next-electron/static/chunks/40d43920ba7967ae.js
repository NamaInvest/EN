;!function(){try { var e="undefined"!=typeof globalThis?globalThis:"undefined"!=typeof global?global:"undefined"!=typeof window?window:"undefined"!=typeof self?self:{},n=(new e.Error).stack;n&&((e._debugIds|| (e._debugIds={}))[n]="b263275f-f21b-825a-8527-d62347fa8e96")}catch(e){}}();
(globalThis.TURBOPACK||(globalThis.TURBOPACK=[])).push(["object"==typeof document?document.currentScript:void 0,178583,t=>{"use strict";let e=(0,t.i(475254).default)("file-text",[["path",{d:"M6 22a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h8a2.4 2.4 0 0 1 1.704.706l3.588 3.588A2.4 2.4 0 0 1 20 8v12a2 2 0 0 1-2 2z",key:"1oefj6"}],["path",{d:"M14 2v5a1 1 0 0 0 1 1h5",key:"wfsgrz"}],["path",{d:"M10 9H8",key:"b1mrlr"}],["path",{d:"M16 13H8",key:"t4e002"}],["path",{d:"M16 17H8",key:"z1uh3a"}]]);t.s(["FileText",()=>e],178583)},555436,t=>{"use strict";let e=(0,t.i(475254).default)("search",[["path",{d:"m21 21-4.34-4.34",key:"14j7rj"}],["circle",{cx:"11",cy:"11",r:"8",key:"4ej97u"}]]);t.s(["Search",()=>e],555436)},87316,t=>{"use strict";let e=(0,t.i(475254).default)("calendar",[["path",{d:"M8 2v4",key:"1cmpym"}],["path",{d:"M16 2v4",key:"4m81vk"}],["rect",{width:"18",height:"18",x:"3",y:"4",rx:"2",key:"1hopcy"}],["path",{d:"M3 10h18",key:"8toen8"}]]);t.s(["Calendar",()=>e],87316)},790092,t=>{"use strict";let e=(0,t.i(475254).default)("refresh-ccw",[["path",{d:"M21 12a9 9 0 0 0-9-9 9.75 9.75 0 0 0-6.74 2.74L3 8",key:"14sxne"}],["path",{d:"M3 3v5h5",key:"1xhq8a"}],["path",{d:"M3 12a9 9 0 0 0 9 9 9.75 9.75 0 0 0 6.74-2.74L21 16",key:"1hlbsb"}],["path",{d:"M16 16h5v5",key:"ccwih5"}]]);t.s(["RefreshCcw",()=>e],790092)},538714,t=>{"use strict";var e=t.i(843476),i=t.i(271645),s=t.i(533499),r=t.i(500932);let n=t=>{let i,s,n,a,o,d,l=(0,r.c)(10),{width:c,height:p,className:x,color:h}=t,m=void 0===c?24:c,g=void 0===p?24:p,y=void 0===x?"":x,u=void 0===h?"currentColor":h;return l[0]===Symbol.for("react.memo_cache_sentinel")?(i={display:"inline-block",verticalAlign:"middle"},s=(0,e.jsx)("path",{d:"M42.5 10 L42.5 50 L20 55 L20 40 L30 37.5 L30 10 Z"}),n=(0,e.jsx)("path",{d:"M42.5 58 L42.5 75 C 42.5 85, 30 90, 15 90 L 15 78 C 25 78, 30 75, 30 65 L 30 60 L 20 62 L 20 48 Z"}),a=(0,e.jsx)("path",{d:"M57.5 10 L57.5 60 L80 55 L80 40 L67.5 42.5 L67.5 10 Z"}),o=(0,e.jsx)("path",{d:"M57.5 68 L57.5 90 L85 85 L85 75 L67.5 78 L67.5 68 Z"}),l[0]=i,l[1]=s,l[2]=n,l[3]=a,l[4]=o):(i=l[0],s=l[1],n=l[2],a=l[3],o=l[4]),l[5]!==y||l[6]!==u||l[7]!==g||l[8]!==m?(d=(0,e.jsxs)("svg",{width:m,height:g,viewBox:"0 0 100 100",fill:u,className:y,xmlns:"http://www.w3.org/2000/svg",style:i,children:[s,n,a,o]}),l[5]=y,l[6]=u,l[7]=g,l[8]=m,l[9]=d):d=l[9],d};function a({invoiceId:t,invoiceData:r,autoPrint:a=!1,isQuote:o=!1,onClose:d}){let{t:l}=(0,s.useTranslation)(),[c,p]=(0,i.useState)(""),[x,h]=(0,i.useState)(""),[m,g]=(0,i.useState)(""),[y,u]=(0,i.useState)("الكاشير"),[f,b]=(0,i.useState)(""),[j,w]=(0,i.useState)(""),[v,S]=(0,i.useState)(""),[N,z]=(0,i.useState)(!0),[A,_]=(0,i.useState)(!1),[C,W]=(0,i.useState)("80mm"),k=(0,i.useRef)(null);(0,i.useEffect)(()=>{(async()=>{let e=await L(),i=window.localStorage.getItem("token");i&&fetch("/api/auth/me",{headers:{Authorization:"Bearer "+i}}).then(t=>t.json()).then(t=>{(t?.user?.fullName||t?.user?.username)&&u(t.user.fullName||t.user.username)}).catch(()=>{}),o?z(!1):t?await $(e?.companyName,e?.vatNumber):r&&await T(e?.companyName,e?.vatNumber)})()},[t,r,o]),(0,i.useEffect)(()=>{if(a&&!N&&!A){if(!o&&!c)return;let t=setTimeout(()=>{M(),_(!0)},500);return()=>clearTimeout(t)}},[a,N,c,A,o]);let L=async()=>{try{let t=await fetch("/api/settings");if(t.ok){let e=await t.json(),i={};e.forEach(t=>{i[t.key]=t.value});let s=i.company_name||i.company_name_ar||l("sys.str_78"),r=i.tax_number||"";return h(s),g(r),W(i.printer_type||"80mm"),b(i.zatca_city||i.company_city||""),w(i.zatca_crn||i.cr_number||""),S(i.company_address||i.company_address_ar||""),{companyName:s,vatNumber:r}}}catch(t){console.error(t)}return null},$=async(e,i)=>{try{let s=await fetch("/api/zatca/qr",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({invoiceId:t,companyName:e,taxNumber:i})});if(s.ok){let t=await s.json();p(t.qrDataUrl)}}catch(t){console.error(t)}finally{z(!1)}},T=async(t,e)=>{if(r)try{let i=await fetch("/api/zatca/qr",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({companyName:t,taxNumber:e,total:r.grandTotal,tax:r.taxAmount,date:r.date||new Date().toISOString()})});if(i.ok){let t=await i.json();p(t.qrDataUrl)}}catch(t){console.error(t)}finally{z(!1)}},q={"58mm":{width:"58mm",padding:"2mm",fontSize:"10px",companySize:"14px",qrSize:"90px",windowWidth:230},"76mm":{width:"76mm",padding:"3mm",fontSize:"11px",companySize:"16px",qrSize:"110px",windowWidth:290},"80mm":{width:"80mm",padding:"4mm",fontSize:"12px",companySize:"18px",qrSize:"120px",windowWidth:310},A4:{width:"210mm",padding:"15mm",fontSize:"14px",companySize:"24px",qrSize:"150px",windowWidth:800},A5:{width:"148mm",padding:"10mm",fontSize:"13px",companySize:"20px",qrSize:"140px",windowWidth:580}},M=(0,i.useCallback)((t=!1)=>{let e=q[C]||q["80mm"],i=o?l("sys.str_79"):["A4","A5"].includes(C)?l("sys.str_80"):l("sys.str_81");if(!k.current)return;let s=`
      <!DOCTYPE html>
      <html dir="rtl" lang="ar">
      <head>
        <meta charset="UTF-8">
        <title>${i}</title>
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
          ${!o?`
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
        ${k.current.innerHTML}
      </body>
      </html>
        `;if(!0===t){let t=window.open("","_blank",`width=${e.windowWidth},height=600`);if(!t)return void window.print();t.document.write(s),t.document.write(`
        <script>
          window.onload = function() {
            setTimeout(function() { window.print(); window.close(); }, 300);
          };
        </script>
            `),t.document.close()}else{let t=document.createElement("iframe");t.style.position="fixed",t.style.right="-9999px",t.style.bottom="-9999px",t.style.width=e.windowWidth+"px",t.style.height="600px",document.body.appendChild(t);let i=t.contentWindow?.document;i&&(i.open(),i.write(s),i.close()),setTimeout(()=>{t.contentWindow&&(t.contentWindow.focus(),t.contentWindow.print()),setTimeout(()=>{try{document.body.removeChild(t)}catch(t){}},5e3)},800)}},[C,o,l,q]),D=(0,i.useCallback)(()=>{let e=document.createElement("script");e.src="https://cdnjs.cloudflare.com/ajax/libs/html2pdf.js/0.10.1/html2pdf.bundle.min.js",e.onload=()=>{let e=t=>new Intl.NumberFormat("ar-SA",{minimumFractionDigits:2,maximumFractionDigits:2}).format(t);if(!r)return;let i=`
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
                            <h2>الرقم الضريبي : <span dir="ltr">${m}</span></h2>
                            <h3>${o?"عرض سعر / Quotation":"فاتورة ضريبية / Tax Invoice"}</h3>
                        </div>
                        
                        <table class="info-table">
                            <tbody>
                                <tr>
                                    <td class="ar-cell">
                                        <div><strong>المدينة:</strong> ${f}</div>
                                        <div><strong>العنوان:</strong> ${v}</div>
                                        <div><strong>رقم السجل التجاري:</strong> <span dir="ltr">${j}</span></div>
                                    </td>
                                    <td class="en-cell">
                                        <div><strong>City:</strong> ${f}</div>
                                        <div><strong>Address:</strong> ${v}</div>
                                        <div><strong>CR Number:</strong> ${j}</div>
                                    </td>
                                </tr>
                                <tr>
                                    <td class="ar-cell">
                                        <div><strong>الكاشير:</strong> ${y}</div>
                                        <div><strong>العميل:</strong> ${r.customerName||"عميل نقدي"}</div>
                                        <div><strong>رقم الفاتورة:</strong> <span dir="ltr">${r.invoiceNumber}</span></div>
                                        <div><strong>تاريخ الإصدار:</strong> <span dir="ltr">${new Date(r.date).toLocaleString("en-GB")}</span></div>
                                    </td>
                                    <td class="en-cell">
                                        <div><strong>Cashier:</strong> ${y}</div>
                                        <div><strong>Customer:</strong> ${r.customerName||"Cash Customer"}</div>
                                        <div><strong>Invoice No:</strong> ${r.invoiceNumber}</div>
                                        <div><strong>Issue Date:</strong> ${new Date(r.date).toLocaleString("en-GB")}</div>
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
                                ${r.items.map(t=>`
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
                                    <td style="font-weight: 600;">${e(r.subtotal)}</td>
                                </tr>
                                ${r.discount>0?`
                                <tr>
                                    <td colSpan="3" style="text-align: left; font-weight: 600; color: #e11d48;">
                                        <div class="split-total">
                                            <span>الخصم</span>
                                            <span class="en-text">Discount</span>
                                        </div>
                                    </td>
                                    <td style="font-weight: 600; color: #e11d48;">-${e(r.discount)}</td>
                                </tr>
                                `:""}
                                <tr>
                                    <td colSpan="3" style="text-align: left; font-weight: 600;">
                                        <div class="split-total">
                                            <span>ضريبة القيمة المضافة (${r.taxRate}%)</span>
                                            <span class="en-text">VAT (${r.taxRate}%)</span>
                                        </div>
                                    </td>
                                    <td style="font-weight: 600;">${e(r.taxAmount)}</td>
                                </tr>
                                <tr>
                                    <td colSpan="3" style="text-align: left; font-size: 16px; font-weight: 900;">
                                        <div class="split-total">
                                            <span>الإجمالي الكلي</span>
                                            <span class="en-text">Grand Total</span>
                                        </div>
                                    </td>
                                    <td style="font-size: 16px; font-weight: 900;">${e(r.grandTotal)} <svg width="12" height="12" viewBox="0 0 100 100" fill="#000" style="display:inline-block;vertical-align:middle;margin-right:2px"><path d="M42.5 10 L42.5 50 L20 55 L20 40 L30 37.5 L30 10 Z"></path><path d="M42.5 58 L42.5 75 C 42.5 85, 30 90, 15 90 L 15 78 C 25 78, 30 75, 30 65 L 30 60 L 20 62 L 20 48 Z"></path><path d="M57.5 10 L57.5 60 L80 55 L80 40 L67.5 42.5 L67.5 10 Z"></path><path d="M57.5 68 L57.5 90 L85 85 L85 75 L67.5 78 L67.5 68 Z"></path></svg></td>
                                </tr>
                            </tbody>
                        </table>
                        
                        <div style="margin-top: 40px; display: flex; justify-content: center; align-items: center; width: 100%;">
                            ${!o&&c?`<img src="${c}" style="width: 150px; height: 150px;" />`:""}
                        </div>
                    </div>
                </body>
                </html>
            `;window.html2pdf().from(i).set({margin:0,filename:`Invoice_${r?.invoiceNumber||t||Date.now()}.pdf`,image:{type:"jpeg",quality:1},html2canvas:{scale:2,useCORS:!0},jsPDF:{unit:"mm",format:"a4",orientation:"portrait"}}).save()},document.body.appendChild(e)},[r,t,C,o,x,f,v,j,m,y,c]);if(!r)return null;let F=t=>new Intl.NumberFormat("ar-SA",{minimumFractionDigits:2,maximumFractionDigits:2}).format(t);return(0,e.jsx)("div",{className:"modal-overlay",onClick:d,children:(0,e.jsxs)("div",{className:"modal",onClick:t=>t.stopPropagation(),style:{maxWidth:"400px",background:"#fff",color:"#000"},children:[(0,e.jsxs)("div",{ref:k,style:{padding:"20px",fontFamily:"Noto Sans Arabic, sans-serif",direction:"rtl"},children:[(0,e.jsxs)("div",{className:"header",style:{textAlign:"center",paddingBottom:"12px",marginBottom:"12px"},children:[(0,e.jsx)("div",{style:{fontSize:"22px",fontWeight:"800",marginBottom:"2px"},children:x}),m&&(0,e.jsxs)("div",{style:{fontSize:"11px",color:"#666"},children:[l("sys.str_56"),m]}),(0,e.jsx)("div",{style:{fontSize:"10px",color:"#999",marginTop:"2px"},children:o?l("sys.str_82"):["A4","A5"].includes(C)?l("sys.str_80"):l("sys.str_81")})]}),(0,e.jsx)("table",{style:{width:"100%",borderCollapse:"collapse",fontSize:"11px",marginBottom:"8px",border:"1px solid #000",borderWidth:"1px"},children:(0,e.jsxs)("tbody",{children:[(0,e.jsxs)("tr",{children:[(0,e.jsxs)("td",{colSpan:2,style:{padding:"6px",border:"1px solid #000",borderWidth:"1px"},children:[(0,e.jsxs)("strong",{children:[l("sys.str_84"),":"]})," ",(0,e.jsx)("span",{dir:"ltr",children:r.invoiceNumber})]}),(0,e.jsxs)("td",{colSpan:2,style:{padding:"6px",border:"1px solid #000",borderWidth:"1px"},children:[(0,e.jsx)("strong",{children:"التاريخ:"})," ",(0,e.jsx)("span",{dir:"ltr",children:new Date(r.date).toLocaleString("ar-SA")})]})]}),(0,e.jsxs)("tr",{children:[(0,e.jsxs)("td",{colSpan:2,style:{padding:"6px",border:"1px solid #000",borderWidth:"1px"},children:[(0,e.jsx)("strong",{children:"الكاشير:"})," ",y]}),(0,e.jsxs)("td",{colSpan:2,style:{padding:"6px",border:"1px solid #000",borderWidth:"1px"},children:[(0,e.jsx)("strong",{children:"العميل:"})," ",r.customerName||"عميل نقدي"]})]}),(r.customerTaxNo||r.customerCrNo||r.customerAddress)&&(0,e.jsx)("tr",{children:(0,e.jsxs)("td",{colSpan:4,style:{padding:"6px",border:"1px solid #000",borderWidth:"1px",background:"#fafafa"},children:[r.customerTaxNo&&(0,e.jsxs)("div",{children:[(0,e.jsx)("strong",{children:l("sys.str_59")})," ",r.customerTaxNo]}),r.customerCrNo&&(0,e.jsxs)("div",{children:[(0,e.jsx)("strong",{children:l("sys.str_60")})," ",r.customerCrNo]}),r.customerAddress&&(0,e.jsxs)("div",{children:[(0,e.jsx)("strong",{children:l("sys.str_61")})," ",r.customerAddress]})]})}),(0,e.jsxs)("tr",{style:{background:"#f0f0f0",WebkitPrintColorAdjust:"exact",printColorAdjust:"exact"},children:[(0,e.jsx)("th",{style:{textAlign:"right",padding:"6px",fontWeight:"800",border:"1px solid #000",borderWidth:"1px"},children:l("sys.str_63")}),(0,e.jsx)("th",{style:{textAlign:"center",padding:"6px",fontWeight:"800",border:"1px solid #000",borderWidth:"1px",width:"40px"},children:l("sys.str_64")}),(0,e.jsx)("th",{style:{textAlign:"center",padding:"6px",fontWeight:"800",border:"1px solid #000",borderWidth:"1px",width:"60px"},children:l("sys.str_65")}),(0,e.jsx)("th",{style:{textAlign:"center",padding:"6px",fontWeight:"800",border:"1px solid #000",borderWidth:"1px",width:"70px"},children:l("sys.str_66")})]}),r.items.map((t,i)=>(0,e.jsxs)("tr",{children:[(0,e.jsx)("td",{style:{padding:"4px 6px",border:"1px solid #000",borderWidth:"1px"},children:t.name}),(0,e.jsx)("td",{style:{textAlign:"center",padding:"4px",border:"1px solid #000",borderWidth:"1px"},children:t.quantity}),(0,e.jsx)("td",{style:{textAlign:"center",padding:"4px",border:"1px solid #000",borderWidth:"1px"},children:F(t.price)}),(0,e.jsx)("td",{style:{textAlign:"center",padding:"4px",border:"1px solid #000",borderWidth:"1px"},children:F(t.total)})]},i)),(0,e.jsxs)("tr",{children:[(0,e.jsx)("td",{colSpan:3,style:{padding:"6px",textAlign:"left",fontWeight:"600",border:"1px solid #000",borderWidth:"1px"},children:l("sys.str_67")}),(0,e.jsx)("td",{style:{padding:"6px",textAlign:"center",fontWeight:"600",border:"1px solid #000",borderWidth:"1px"},children:F(r.subtotal)})]}),r.discount>0&&(0,e.jsxs)("tr",{children:[(0,e.jsx)("td",{colSpan:3,style:{padding:"6px",textAlign:"left",fontWeight:"600",color:"#e11d48",border:"1px solid #000",borderWidth:"1px"},children:l("sys.str_69")}),(0,e.jsxs)("td",{style:{padding:"6px",textAlign:"center",fontWeight:"600",color:"#e11d48",border:"1px solid #000",borderWidth:"1px"},children:["-",F(r.discount)]})]}),(0,e.jsxs)("tr",{children:[(0,e.jsxs)("td",{colSpan:3,style:{padding:"6px",textAlign:"left",fontWeight:"600",border:"1px solid #000",borderWidth:"1px"},children:[l("sys.str_70"),r.taxRate,"%):"]}),(0,e.jsx)("td",{style:{padding:"6px",textAlign:"center",fontWeight:"600",border:"1px solid #000",borderWidth:"1px"},children:F(r.taxAmount)})]}),(0,e.jsxs)("tr",{children:[(0,e.jsx)("td",{colSpan:3,style:{padding:"8px",textAlign:"left",fontSize:"14px",fontWeight:"900",border:"1px solid #000",borderWidth:"1px",background:"#f9f9f9",WebkitPrintColorAdjust:"exact",printColorAdjust:"exact"},children:l("sys.str_71")}),(0,e.jsxs)("td",{style:{padding:"8px",textAlign:"center",fontSize:"14px",fontWeight:"900",border:"1px solid #000",borderWidth:"1px",background:"#f9f9f9",WebkitPrintColorAdjust:"exact",printColorAdjust:"exact"},children:[F(r.grandTotal)," ",(0,e.jsx)(n,{width:12,height:12,color:"#000"})]})]})]})}),!o&&(0,e.jsx)("div",{style:{textAlign:"center",margin:"16px auto 0",paddingTop:"12px",maxWidth:"140px"},className:"qr-section",children:N?(0,e.jsx)("div",{style:{padding:"16px",color:"#999",fontSize:"11px"},children:l("sys.str_72")}):c?(0,e.jsxs)(e.Fragment,{children:[(0,e.jsx)("img",{src:c,alt:"ZATCA QR Code",style:{width:"120px",height:"120px",margin:"0 auto",display:"block"}}),(0,e.jsx)("div",{style:{fontSize:"8px",color:"#666",marginTop:"4px",textAlign:"center"},children:l("sys.str_73")})]}):null}),(0,e.jsx)("div",{className:"footer",style:{textAlign:"center",marginTop:"12px",fontSize:"10px",color:"#999",borderTop:"1px solid #000",paddingTop:"8px"},children:l("sys.str_74")})]}),(0,e.jsxs)("div",{style:{display:"flex",gap:"8px",padding:"16px",borderTop:"1px solid #eee",flexWrap:"wrap"},className:"no-print",children:[(0,e.jsx)("button",{onClick:()=>M(!1),style:{flex:1,padding:"12px",background:"#6C63FF",color:"#fff",border:"none",borderRadius:"8px",fontSize:"14px",fontWeight:"600",cursor:"pointer",fontFamily:"Noto Sans Arabic"},children:"طباعة فورية"}),(0,e.jsx)("button",{onClick:()=>M(!0),style:{flex:1,padding:"12px",background:"#3b82f6",color:"#fff",border:"none",borderRadius:"8px",fontSize:"14px",fontWeight:"600",cursor:"pointer",fontFamily:"Noto Sans Arabic"},children:"خيارات الطباعة"}),(0,e.jsx)("button",{onClick:D,style:{flex:1,padding:"12px",background:"#ef4444",color:"#fff",border:"none",borderRadius:"8px",fontSize:"14px",fontWeight:"600",cursor:"pointer",fontFamily:"Noto Sans Arabic"},children:l("sys.str_76")}),(0,e.jsx)("button",{onClick:d,style:{padding:"12px 24px",background:"#f1f5f9",color:"#334155",border:"none",borderRadius:"8px",fontSize:"14px",fontWeight:"600",cursor:"pointer",fontFamily:"Noto Sans Arabic"},children:l("sys.str_77")})]})]})})}t.s(["default",()=>a],538714)},630038,t=>{"use strict";var e=t.i(843476),i=t.i(271645),s=t.i(555436),r=t.i(303281),n=t.i(87316),a=t.i(790092),o=t.i(178583),d=t.i(538714),l=t.i(533499),c=t.i(783036);function p(){let{t}=(0,l.useTranslation)(),{error:p,success:x}=(0,c.useToast)(),[h,m]=(0,i.useState)([]),[g,y]=(0,i.useState)(!1),[u,f]=(0,i.useState)(""),[b,j]=(0,i.useState)(""),[w,v]=(0,i.useState)(""),[S,N]=(0,i.useState)(!1),[z,A]=(0,i.useState)(null),_=async()=>{y(!0);try{let t=localStorage.getItem("token"),e=new URLSearchParams;u&&e.append("from",u),b&&e.append("to",b);let i=await fetch(`/api/sales?${e.toString()}`,{headers:{Authorization:`Bearer ${t}`}});if(i.ok){let t=await i.json();m(Array.isArray(t)?t:[])}}catch(t){p(t?.message||"حدث خطأ")}finally{y(!1)}};(0,i.useEffect)(()=>{_()},[]);let C=h.filter(t=>{if(!w)return!0;let e=w.toLowerCase();return String(t.invoiceNo).includes(e)||(t.customer?.name||"").toLowerCase().includes(e)});return(0,e.jsxs)("div",{className:"history-page",children:[(0,e.jsxs)("div",{className:"page-header",style:{marginBottom:"2rem"},children:[(0,e.jsxs)("h1",{className:"page-title",style:{display:"flex",alignItems:"center",gap:"0.5rem"},children:[(0,e.jsx)(o.FileText,{size:28,color:"var(--primary)"})," ",t("sales.str_2413")]}),(0,e.jsx)("p",{style:{color:"var(--text-muted)",margin:"0.5rem 0 0 0"},children:t("sales.str_2414")})]}),(0,e.jsx)("div",{className:"card",style:{marginBottom:"2rem"},children:(0,e.jsxs)("form",{onSubmit:t=>{t.preventDefault(),_()},className:"filter-grid",style:{display:"grid",gridTemplateColumns:"repeat(auto-fit, minmax(200px, 1fr))",gap:"1.5rem",alignItems:"end"},children:[(0,e.jsxs)("div",{children:[(0,e.jsxs)("label",{className:"form-label",style:{display:"flex",alignItems:"center",gap:"0.5rem"},children:[(0,e.jsx)(n.Calendar,{size:16})," ",t("sales.str_2415")]}),(0,e.jsx)("input",{type:"date",className:"input",value:u,onChange:t=>f(t.target.value)})]}),(0,e.jsxs)("div",{children:[(0,e.jsxs)("label",{className:"form-label",style:{display:"flex",alignItems:"center",gap:"0.5rem"},children:[(0,e.jsx)(n.Calendar,{size:16})," ",t("sales.str_2416")]}),(0,e.jsx)("input",{type:"date",className:"input",value:b,onChange:t=>j(t.target.value)})]}),(0,e.jsxs)("div",{children:[(0,e.jsxs)("label",{className:"form-label",style:{display:"flex",alignItems:"center",gap:"0.5rem"},children:[(0,e.jsx)(s.Search,{size:16})," ",t("sales.str_2417")]}),(0,e.jsx)("input",{type:"text",className:"input",placeholder:t("sales.str_2423"),value:w,onChange:t=>v(t.target.value)})]}),(0,e.jsxs)("div",{style:{display:"flex",gap:"1rem"},children:[(0,e.jsx)("button",{type:"submit",className:"btn btn-primary",style:{flex:1},disabled:g,children:g?t("sales.str_2424"):t("sales.str_2425")}),(0,e.jsx)("button",{type:"button",className:"btn btn-secondary",onClick:()=>{f(""),j(""),v(""),setTimeout(_,100)},title:t("sales.str_2426"),children:(0,e.jsx)(a.RefreshCcw,{size:18})})]})]})}),(0,e.jsx)("div",{className:"card table-container",children:(0,e.jsxs)("table",{className:"table",children:[(0,e.jsx)("thead",{children:(0,e.jsxs)("tr",{children:[(0,e.jsx)("th",{children:t("sys.str_510")}),(0,e.jsx)("th",{children:t("sales.str_2418")}),(0,e.jsx)("th",{children:t("sys.str_673")}),(0,e.jsx)("th",{children:t("sys.str_1046")}),(0,e.jsx)("th",{children:t("sales.str_2419")}),(0,e.jsx)("th",{style:{textAlign:"center"},children:t("sys.str_435")})]})}),(0,e.jsx)("tbody",{children:g&&0===h.length?(0,e.jsx)("tr",{children:(0,e.jsx)("td",{colSpan:6,style:{textAlign:"center",padding:"3rem"},children:t("sys.str_168")})}):0===C.length?(0,e.jsx)("tr",{children:(0,e.jsx)("td",{colSpan:6,style:{textAlign:"center",padding:"3rem",color:"var(--text-muted)"},children:t("sales.str_2420")})}):C.map(i=>(0,e.jsxs)("tr",{children:[(0,e.jsxs)("td",{style:{fontWeight:"bold"},children:["#",i.invoiceNo]}),(0,e.jsx)("td",{style:{direction:"ltr",textAlign:"right"},children:new Date(i.date).toLocaleString("ar-SA")}),(0,e.jsx)("td",{children:i.customer?.name||(0,e.jsx)("span",{className:"badge badge-gray",children:t("sales.str_2421")})}),(0,e.jsx)("td",{children:(0,e.jsx)("span",{className:`badge ${"cash"===i.paymentType.toLowerCase()?"badge-success":"badge-primary"}`,children:i.paymentType.toUpperCase()})}),(0,e.jsxs)("td",{style:{fontWeight:"bold",color:"var(--success)"},children:[Number(i.total).toLocaleString()," ",t("sys.str_68")]}),(0,e.jsx)("td",{style:{textAlign:"center"},children:(0,e.jsxs)("button",{className:"btn btn-secondary btn-sm",onClick:()=>{let e;return e=(i.details||[]).map(t=>({name:t.productName,quantity:t.quantity,price:t.price,total:t.quantity*t.price*(1-(t.discountRate||0)/100)})),void(A({invoiceId:i.id,invoiceNumber:String(i.invoiceNo),date:i.date,customerName:i.customer?.name||t("sys.str_752"),customerTaxNo:i.customer?.taxNumber,customerCrNo:i.customer?.crNo,customerAddress:i.customer?.address,paymentMethod:i.paymentType,items:e,subtotal:i.subtotal,discount:i.discountValue||0,taxRate:15,taxAmount:i.taxValue,grandTotal:i.total}),N(!0))},style:{display:"inline-flex",alignItems:"center",gap:"0.5rem"},children:[(0,e.jsx)(r.Printer,{size:16})," ",t("sales.str_2422")]})})]},i.id))})]})}),S&&z&&(0,e.jsx)(d.default,{invoiceData:z,onClose:()=>N(!1)})]})}t.s(["default",()=>p])}]);

//# debugId=b263275f-f21b-825a-8527-d62347fa8e96