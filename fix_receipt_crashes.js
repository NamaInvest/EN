const fs = require('fs');
const file = 'd:/namasoft9-3-main/src/components/InvoiceReceipt.tsx';
let c = fs.readFileSync(file, 'utf8');

// Fix API Auth Fetch
const badFetch = "fetch('/api/auth/me').then(r=>r.json()).then(s => { if(s?.user?.fullName || s?.user?.username) setCashierName(s.user.fullName || s.user.username); }).catch(()=>{});";
const goodFetch = `
            const tk = localStorage.getItem('token');
            if (tk) {
                fetch('/api/auth/me', { headers: { 'Authorization': 'Bearer ' + tk } })
                .then(r=>r.json())
                .then(s => { if(s?.user?.fullName || s?.user?.username) setCashierName(s.user.fullName || s.user.username); })
                .catch(()=>{});
            }
`;
c = c.replace(badFetch, goodFetch);

// Fix HTML2PDF Crash Options (width & putOnlyUsedFonts removal)
// My previous script injected: `jsPDF: { unit: 'mm', format: [76, 297], orientation: 'portrait', putOnlyUsedFonts: true }`
c = c.replace(
    "jsPDF: { unit: 'mm', format: [76, 297], orientation: 'portrait', putOnlyUsedFonts: true }",
    "jsPDF: { unit: 'mm', format: [76, 297], orientation: 'portrait' }"
);

// To ensure HTML2PDF respects the 80mm container instead of exploding to A4 scale, 
// we explicitly constraint `element` width before feeding it to html2pdf:
const beforeCrash = "document.body.appendChild(element);";
const afterCrash = "document.body.appendChild(element);\n            element.style.width = '300px';\n            element.style.margin = '0 auto';";
if (!c.includes("element.style.width = '300px';")) {
    c = c.replace(beforeCrash, afterCrash);
}

fs.writeFileSync(file, c);
console.log('Fixed PDF Export bug and Auth Token bug');
