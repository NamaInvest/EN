;!function(){try { var e="undefined"!=typeof globalThis?globalThis:"undefined"!=typeof global?global:"undefined"!=typeof window?window:"undefined"!=typeof self?self:{},n=(new e.Error).stack;n&&((e._debugIds|| (e._debugIds={}))[n]="25a47102-cc1a-8576-2ff3-2b0abab79b1d")}catch(e){}}();
module.exports=[452549,a=>{"use strict";var b=a.i(187924),c=a.i(572131),d=a.i(951192);let e=({width:a=24,height:c=24,className:d="",color:e="currentColor"})=>(0,b.jsxs)("svg",{width:a,height:c,viewBox:"0 0 100 100",fill:e,className:d,xmlns:"http://www.w3.org/2000/svg",style:{display:"inline-block",verticalAlign:"middle"},children:[(0,b.jsx)("path",{d:"M42.5 10 L42.5 50 L20 55 L20 40 L30 37.5 L30 10 Z"}),(0,b.jsx)("path",{d:"M42.5 58 L42.5 75 C 42.5 85, 30 90, 15 90 L 15 78 C 25 78, 30 75, 30 65 L 30 60 L 20 62 L 20 48 Z"}),(0,b.jsx)("path",{d:"M57.5 10 L57.5 60 L80 55 L80 40 L67.5 42.5 L67.5 10 Z"}),(0,b.jsx)("path",{d:"M57.5 68 L57.5 90 L85 85 L85 75 L67.5 78 L67.5 68 Z"})]});function f({invoiceId:a,invoiceData:f,autoPrint:g=!1,isQuote:h=!1,onClose:i}){let{t:j}=(0,d.useTranslation)(),[k,l]=(0,c.useState)(""),[m,n]=(0,c.useState)(""),[o,p]=(0,c.useState)(""),[q,r]=(0,c.useState)("الكاشير"),[s,t]=(0,c.useState)(""),[u,v]=(0,c.useState)(""),[w,x]=(0,c.useState)(""),[y,z]=(0,c.useState)(!0),[A,B]=(0,c.useState)(!1),[C,D]=(0,c.useState)("80mm"),E=(0,c.useRef)(null);(0,c.useEffect)(()=>{(async()=>{let b=await F(),c=window.localStorage.getItem("token");c&&fetch("/api/auth/me",{headers:{Authorization:"Bearer "+c}}).then(a=>a.json()).then(a=>{(a?.user?.fullName||a?.user?.username)&&r(a.user.fullName||a.user.username)}).catch(()=>{}),h?z(!1):a?await G(b?.companyName,b?.vatNumber):f&&await H(b?.companyName,b?.vatNumber)})()},[a,f,h]),(0,c.useEffect)(()=>{if(g&&!y&&!A){if(!h&&!k)return;let a=setTimeout(()=>{J(),B(!0)},500);return()=>clearTimeout(a)}},[g,y,k,A,h]);let F=async()=>{try{let a=await fetch("/api/settings");if(a.ok){let b=await a.json(),c={};b.forEach(a=>{c[a.key]=a.value});let d=c.company_name||c.company_name_ar||j("sys.str_78"),e=c.tax_number||"";return n(d),p(e),D(c.printer_type||"80mm"),t(c.zatca_city||c.company_city||""),v(c.zatca_crn||c.cr_number||""),x(c.company_address||c.company_address_ar||""),{companyName:d,vatNumber:e}}}catch(a){console.error(a)}return null},G=async(b,c)=>{try{let d=await fetch("/api/zatca/qr",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({invoiceId:a,companyName:b,taxNumber:c})});if(d.ok){let a=await d.json();l(a.qrDataUrl)}}catch(a){console.error(a)}finally{z(!1)}},H=async(a,b)=>{if(f)try{let c=await fetch("/api/zatca/qr",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({companyName:a,taxNumber:b,total:f.grandTotal,tax:f.taxAmount,date:f.date||new Date().toISOString()})});if(c.ok){let a=await c.json();l(a.qrDataUrl)}}catch(a){console.error(a)}finally{z(!1)}},I={"58mm":{width:"58mm",padding:"2mm",fontSize:"10px",companySize:"14px",qrSize:"90px",windowWidth:230},"76mm":{width:"76mm",padding:"3mm",fontSize:"11px",companySize:"16px",qrSize:"110px",windowWidth:290},"80mm":{width:"80mm",padding:"4mm",fontSize:"12px",companySize:"18px",qrSize:"120px",windowWidth:310},A4:{width:"210mm",padding:"15mm",fontSize:"14px",companySize:"24px",qrSize:"150px",windowWidth:800},A5:{width:"148mm",padding:"10mm",fontSize:"13px",companySize:"20px",qrSize:"140px",windowWidth:580}},J=(0,c.useCallback)((a=!1)=>{let b=I[C]||I["80mm"],c=h?j("sys.str_79"):["A4","A5"].includes(C)?j("sys.str_80"):j("sys.str_81");if(!E.current)return;let d=`
      <!DOCTYPE html>
      <html dir="rtl" lang="ar">
      <head>
        <meta charset="UTF-8">
        <title>${c}</title>
        <style>
          @import url('https://fonts.googleapis.com/css2?family=Noto Sans Arabic:wght@400;600;800&display=swap');
          * { margin: 0; padding: 0; box-sizing: border-box; }
          body {
            font-family: 'Noto Sans Arabic', sans-serif;
            width: ${b.width};
            padding: ${b.padding};
            font-size: ${b.fontSize};
            line-height: 1.4;
            direction: rtl;
            color: #000;
          }
          .header { text-align: center; border-bottom: 2px solid #000; padding-bottom: 8px; margin-bottom: 8px; }
          .company-name { font-size: ${b.companySize}; font-weight: 800; }
          .vat-num { font-size: 10px; color: #666; }
          .invoice-type { font-size: 10px; color: #999; margin-top: 2px; }
          .info-row { display: flex; justify-content: space-between; font-size: 11px; margin-bottom: 2px; }
          .items-table { width: 100%; border-collapse: collapse; margin: 8px 0; font-size: ${b.fontSize}; border: 1px solid #000; }
          .items-table th, .items-table td { border: 1px solid #000 !important; padding: 4px; text-align: center; }
          .items-table th { font-weight: 600; background: #f9f9f9 !important; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
          .items-table td:first-child, .items-table th:first-child { text-align: right; }
          .totals { padding-top: 8px; }
          .total-row { display: flex; justify-content: space-between; font-size: ${b.fontSize}; margin-bottom: 2px; }
          .grand-total { font-size: 16px; font-weight: 800; border-top: 1px solid #000; padding-top: 6px; margin-top: 4px; }
          .discount { color: #e11d48; }
          ${!h?`
          .qr-section { text-align: center; margin-top: 12px; padding-top: 8px; }
          .qr-section img { width: ${b.qrSize}; height: ${b.qrSize}; }
          .qr-label { font-size: 8px; color: #666; margin-top: 2px; }
          `:""}
          .footer { text-align: center; margin-top: 8px; font-size: 10px; color: #999; border-top: 1px solid #000; padding-top: 8px; }
          @media print {
            body { width: ${b.width}; margin: 0; padding: ${b.padding}; }
            @page { margin: 0; size: ${b.width} auto; }
            table, th, td { border: 1px solid #000 !important; }
            th { border: 1px solid #000 !important; }
            td { border: 1px solid #000 !important; }
            * { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
          }
        </style>
      </head>
      <body>
        ${E.current.innerHTML}
      </body>
      </html>
        `;if(!0===a){let a=window.open("","_blank",`width=${b.windowWidth},height=600`);if(!a)return void window.print();a.document.write(d),a.document.write(`
        <script>
          window.onload = function() {
            setTimeout(function() { window.print(); window.close(); }, 300);
          };
        </script>
            `),a.document.close()}else{let a=document.createElement("iframe");a.style.position="fixed",a.style.right="-9999px",a.style.bottom="-9999px",a.style.width=b.windowWidth+"px",a.style.height="600px",document.body.appendChild(a);let c=a.contentWindow?.document;c&&(c.open(),c.write(d),c.close()),setTimeout(()=>{a.contentWindow&&(a.contentWindow.focus(),a.contentWindow.print()),setTimeout(()=>{try{document.body.removeChild(a)}catch(a){}},5e3)},800)}},[C,h,j,I]),K=(0,c.useCallback)(()=>{let b=document.createElement("script");b.src="https://cdnjs.cloudflare.com/ajax/libs/html2pdf.js/0.10.1/html2pdf.bundle.min.js",b.onload=()=>{let b=a=>new Intl.NumberFormat("ar-SA",{minimumFractionDigits:2,maximumFractionDigits:2}).format(a);if(!f)return;let c=`
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
                            <h1>${m}</h1>
                            <h2>الرقم الضريبي : <span dir="ltr">${o}</span></h2>
                            <h3>${h?"عرض سعر / Quotation":"فاتورة ضريبية / Tax Invoice"}</h3>
                        </div>
                        
                        <table class="info-table">
                            <tbody>
                                <tr>
                                    <td class="ar-cell">
                                        <div><strong>المدينة:</strong> ${s}</div>
                                        <div><strong>العنوان:</strong> ${w}</div>
                                        <div><strong>رقم السجل التجاري:</strong> <span dir="ltr">${u}</span></div>
                                    </td>
                                    <td class="en-cell">
                                        <div><strong>City:</strong> ${s}</div>
                                        <div><strong>Address:</strong> ${w}</div>
                                        <div><strong>CR Number:</strong> ${u}</div>
                                    </td>
                                </tr>
                                <tr>
                                    <td class="ar-cell">
                                        <div><strong>الكاشير:</strong> ${q}</div>
                                        <div><strong>العميل:</strong> ${f.customerName||"عميل نقدي"}</div>
                                        <div><strong>رقم الفاتورة:</strong> <span dir="ltr">${f.invoiceNumber}</span></div>
                                        <div><strong>تاريخ الإصدار:</strong> <span dir="ltr">${new Date(f.date).toLocaleString("en-GB")}</span></div>
                                    </td>
                                    <td class="en-cell">
                                        <div><strong>Cashier:</strong> ${q}</div>
                                        <div><strong>Customer:</strong> ${f.customerName||"Cash Customer"}</div>
                                        <div><strong>Invoice No:</strong> ${f.invoiceNumber}</div>
                                        <div><strong>Issue Date:</strong> ${new Date(f.date).toLocaleString("en-GB")}</div>
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
                                ${f.items.map(a=>`
                                    <tr>
                                        <td style="text-align: right;">${a.name}</td>
                                        <td>${a.quantity}</td>
                                        <td>${b(a.price)}</td>
                                        <td>${b(a.total)}</td>
                                    </tr>
                                `).join("")}
                                
                                <tr>
                                    <td colSpan="3" style="text-align: left; font-weight: 600;">
                                        <div class="split-total">
                                            <span>الإجمالي الفرعي</span>
                                            <span class="en-text">Subtotal</span>
                                        </div>
                                    </td>
                                    <td style="font-weight: 600;">${b(f.subtotal)}</td>
                                </tr>
                                ${f.discount>0?`
                                <tr>
                                    <td colSpan="3" style="text-align: left; font-weight: 600; color: #e11d48;">
                                        <div class="split-total">
                                            <span>الخصم</span>
                                            <span class="en-text">Discount</span>
                                        </div>
                                    </td>
                                    <td style="font-weight: 600; color: #e11d48;">-${b(f.discount)}</td>
                                </tr>
                                `:""}
                                <tr>
                                    <td colSpan="3" style="text-align: left; font-weight: 600;">
                                        <div class="split-total">
                                            <span>ضريبة القيمة المضافة (${f.taxRate}%)</span>
                                            <span class="en-text">VAT (${f.taxRate}%)</span>
                                        </div>
                                    </td>
                                    <td style="font-weight: 600;">${b(f.taxAmount)}</td>
                                </tr>
                                <tr>
                                    <td colSpan="3" style="text-align: left; font-size: 16px; font-weight: 900;">
                                        <div class="split-total">
                                            <span>الإجمالي الكلي</span>
                                            <span class="en-text">Grand Total</span>
                                        </div>
                                    </td>
                                    <td style="font-size: 16px; font-weight: 900;">${b(f.grandTotal)} <svg width="12" height="12" viewBox="0 0 100 100" fill="#000" style="display:inline-block;vertical-align:middle;margin-right:2px"><path d="M42.5 10 L42.5 50 L20 55 L20 40 L30 37.5 L30 10 Z"></path><path d="M42.5 58 L42.5 75 C 42.5 85, 30 90, 15 90 L 15 78 C 25 78, 30 75, 30 65 L 30 60 L 20 62 L 20 48 Z"></path><path d="M57.5 10 L57.5 60 L80 55 L80 40 L67.5 42.5 L67.5 10 Z"></path><path d="M57.5 68 L57.5 90 L85 85 L85 75 L67.5 78 L67.5 68 Z"></path></svg></td>
                                </tr>
                            </tbody>
                        </table>
                        
                        <div style="margin-top: 40px; display: flex; justify-content: center; align-items: center; width: 100%;">
                            ${!h&&k?`<img src="${k}" style="width: 150px; height: 150px;" />`:""}
                        </div>
                    </div>
                </body>
                </html>
            `;window.html2pdf().from(c).set({margin:0,filename:`Invoice_${f?.invoiceNumber||a||Date.now()}.pdf`,image:{type:"jpeg",quality:1},html2canvas:{scale:2,useCORS:!0},jsPDF:{unit:"mm",format:"a4",orientation:"portrait"}}).save()},document.body.appendChild(b)},[f,a,C,h,m,s,w,u,o,q,k]);if(!f)return null;let L=a=>new Intl.NumberFormat("ar-SA",{minimumFractionDigits:2,maximumFractionDigits:2}).format(a);return(0,b.jsx)("div",{className:"modal-overlay",onClick:i,children:(0,b.jsxs)("div",{className:"modal",onClick:a=>a.stopPropagation(),style:{maxWidth:"400px",background:"#fff",color:"#000"},children:[(0,b.jsxs)("div",{ref:E,style:{padding:"20px",fontFamily:"Noto Sans Arabic, sans-serif",direction:"rtl"},children:[(0,b.jsxs)("div",{className:"header",style:{textAlign:"center",paddingBottom:"12px",marginBottom:"12px"},children:[(0,b.jsx)("div",{style:{fontSize:"22px",fontWeight:"800",marginBottom:"2px"},children:m}),o&&(0,b.jsxs)("div",{style:{fontSize:"11px",color:"#666"},children:[j("sys.str_56"),o]}),(0,b.jsx)("div",{style:{fontSize:"10px",color:"#999",marginTop:"2px"},children:h?j("sys.str_82"):["A4","A5"].includes(C)?j("sys.str_80"):j("sys.str_81")})]}),(0,b.jsx)("table",{style:{width:"100%",borderCollapse:"collapse",fontSize:"11px",marginBottom:"8px",border:"1px solid #000",borderWidth:"1px"},children:(0,b.jsxs)("tbody",{children:[(0,b.jsxs)("tr",{children:[(0,b.jsxs)("td",{colSpan:2,style:{padding:"6px",border:"1px solid #000",borderWidth:"1px"},children:[(0,b.jsxs)("strong",{children:[j("sys.str_84"),":"]})," ",(0,b.jsx)("span",{dir:"ltr",children:f.invoiceNumber})]}),(0,b.jsxs)("td",{colSpan:2,style:{padding:"6px",border:"1px solid #000",borderWidth:"1px"},children:[(0,b.jsx)("strong",{children:"التاريخ:"})," ",(0,b.jsx)("span",{dir:"ltr",children:new Date(f.date).toLocaleString("ar-SA")})]})]}),(0,b.jsxs)("tr",{children:[(0,b.jsxs)("td",{colSpan:2,style:{padding:"6px",border:"1px solid #000",borderWidth:"1px"},children:[(0,b.jsx)("strong",{children:"الكاشير:"})," ",q]}),(0,b.jsxs)("td",{colSpan:2,style:{padding:"6px",border:"1px solid #000",borderWidth:"1px"},children:[(0,b.jsx)("strong",{children:"العميل:"})," ",f.customerName||"عميل نقدي"]})]}),(f.customerTaxNo||f.customerCrNo||f.customerAddress)&&(0,b.jsx)("tr",{children:(0,b.jsxs)("td",{colSpan:4,style:{padding:"6px",border:"1px solid #000",borderWidth:"1px",background:"#fafafa"},children:[f.customerTaxNo&&(0,b.jsxs)("div",{children:[(0,b.jsx)("strong",{children:j("sys.str_59")})," ",f.customerTaxNo]}),f.customerCrNo&&(0,b.jsxs)("div",{children:[(0,b.jsx)("strong",{children:j("sys.str_60")})," ",f.customerCrNo]}),f.customerAddress&&(0,b.jsxs)("div",{children:[(0,b.jsx)("strong",{children:j("sys.str_61")})," ",f.customerAddress]})]})}),(0,b.jsxs)("tr",{style:{background:"#f0f0f0",WebkitPrintColorAdjust:"exact",printColorAdjust:"exact"},children:[(0,b.jsx)("th",{style:{textAlign:"right",padding:"6px",fontWeight:"800",border:"1px solid #000",borderWidth:"1px"},children:j("sys.str_63")}),(0,b.jsx)("th",{style:{textAlign:"center",padding:"6px",fontWeight:"800",border:"1px solid #000",borderWidth:"1px",width:"40px"},children:j("sys.str_64")}),(0,b.jsx)("th",{style:{textAlign:"center",padding:"6px",fontWeight:"800",border:"1px solid #000",borderWidth:"1px",width:"60px"},children:j("sys.str_65")}),(0,b.jsx)("th",{style:{textAlign:"center",padding:"6px",fontWeight:"800",border:"1px solid #000",borderWidth:"1px",width:"70px"},children:j("sys.str_66")})]}),f.items.map((a,c)=>(0,b.jsxs)("tr",{children:[(0,b.jsx)("td",{style:{padding:"4px 6px",border:"1px solid #000",borderWidth:"1px"},children:a.name}),(0,b.jsx)("td",{style:{textAlign:"center",padding:"4px",border:"1px solid #000",borderWidth:"1px"},children:a.quantity}),(0,b.jsx)("td",{style:{textAlign:"center",padding:"4px",border:"1px solid #000",borderWidth:"1px"},children:L(a.price)}),(0,b.jsx)("td",{style:{textAlign:"center",padding:"4px",border:"1px solid #000",borderWidth:"1px"},children:L(a.total)})]},c)),(0,b.jsxs)("tr",{children:[(0,b.jsx)("td",{colSpan:3,style:{padding:"6px",textAlign:"left",fontWeight:"600",border:"1px solid #000",borderWidth:"1px"},children:j("sys.str_67")}),(0,b.jsx)("td",{style:{padding:"6px",textAlign:"center",fontWeight:"600",border:"1px solid #000",borderWidth:"1px"},children:L(f.subtotal)})]}),f.discount>0&&(0,b.jsxs)("tr",{children:[(0,b.jsx)("td",{colSpan:3,style:{padding:"6px",textAlign:"left",fontWeight:"600",color:"#e11d48",border:"1px solid #000",borderWidth:"1px"},children:j("sys.str_69")}),(0,b.jsxs)("td",{style:{padding:"6px",textAlign:"center",fontWeight:"600",color:"#e11d48",border:"1px solid #000",borderWidth:"1px"},children:["-",L(f.discount)]})]}),(0,b.jsxs)("tr",{children:[(0,b.jsxs)("td",{colSpan:3,style:{padding:"6px",textAlign:"left",fontWeight:"600",border:"1px solid #000",borderWidth:"1px"},children:[j("sys.str_70"),f.taxRate,"%):"]}),(0,b.jsx)("td",{style:{padding:"6px",textAlign:"center",fontWeight:"600",border:"1px solid #000",borderWidth:"1px"},children:L(f.taxAmount)})]}),(0,b.jsxs)("tr",{children:[(0,b.jsx)("td",{colSpan:3,style:{padding:"8px",textAlign:"left",fontSize:"14px",fontWeight:"900",border:"1px solid #000",borderWidth:"1px",background:"#f9f9f9",WebkitPrintColorAdjust:"exact",printColorAdjust:"exact"},children:j("sys.str_71")}),(0,b.jsxs)("td",{style:{padding:"8px",textAlign:"center",fontSize:"14px",fontWeight:"900",border:"1px solid #000",borderWidth:"1px",background:"#f9f9f9",WebkitPrintColorAdjust:"exact",printColorAdjust:"exact"},children:[L(f.grandTotal)," ",(0,b.jsx)(e,{width:12,height:12,color:"#000"})]})]})]})}),!h&&(0,b.jsx)("div",{style:{textAlign:"center",margin:"16px auto 0",paddingTop:"12px",maxWidth:"140px"},className:"qr-section",children:y?(0,b.jsx)("div",{style:{padding:"16px",color:"#999",fontSize:"11px"},children:j("sys.str_72")}):k?(0,b.jsxs)(b.Fragment,{children:[(0,b.jsx)("img",{src:k,alt:"ZATCA QR Code",style:{width:"120px",height:"120px",margin:"0 auto",display:"block"}}),(0,b.jsx)("div",{style:{fontSize:"8px",color:"#666",marginTop:"4px",textAlign:"center"},children:j("sys.str_73")})]}):null}),(0,b.jsx)("div",{className:"footer",style:{textAlign:"center",marginTop:"12px",fontSize:"10px",color:"#999",borderTop:"1px solid #000",paddingTop:"8px"},children:j("sys.str_74")})]}),(0,b.jsxs)("div",{style:{display:"flex",gap:"8px",padding:"16px",borderTop:"1px solid #eee",flexWrap:"wrap"},className:"no-print",children:[(0,b.jsx)("button",{onClick:()=>J(!1),style:{flex:1,padding:"12px",background:"#6C63FF",color:"#fff",border:"none",borderRadius:"8px",fontSize:"14px",fontWeight:"600",cursor:"pointer",fontFamily:"Noto Sans Arabic"},children:"طباعة فورية"}),(0,b.jsx)("button",{onClick:()=>J(!0),style:{flex:1,padding:"12px",background:"#3b82f6",color:"#fff",border:"none",borderRadius:"8px",fontSize:"14px",fontWeight:"600",cursor:"pointer",fontFamily:"Noto Sans Arabic"},children:"خيارات الطباعة"}),(0,b.jsx)("button",{onClick:K,style:{flex:1,padding:"12px",background:"#ef4444",color:"#fff",border:"none",borderRadius:"8px",fontSize:"14px",fontWeight:"600",cursor:"pointer",fontFamily:"Noto Sans Arabic"},children:j("sys.str_76")}),(0,b.jsx)("button",{onClick:i,style:{padding:"12px 24px",background:"#f1f5f9",color:"#334155",border:"none",borderRadius:"8px",fontSize:"14px",fontWeight:"600",cursor:"pointer",fontFamily:"Noto Sans Arabic"},children:j("sys.str_77")})]})]})})}a.s(["default",()=>f],452549)}];

//# debugId=25a47102-cc1a-8576-2ff3-2b0abab79b1d
//# sourceMappingURL=src_components_InvoiceReceipt_tsx_f0d8b86b._.js.map