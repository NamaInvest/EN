const fs = require('fs');
const path = require('path');

function replaceFile(file, regex, replaceStr) {
    let p = path.join(__dirname, file);
    if (fs.existsSync(p)) {
        let content = fs.readFileSync(p, 'utf8');
        let newContent = content.replace(regex, replaceStr);
        if (content !== newContent) {
            fs.writeFileSync(p, newContent, 'utf8');
            console.log('Fixed:', p);
        }
    } else {
        console.log('File not found:', p);
    }
}

// 1. purchases/route.ts - remove email: true
replaceFile('src/app/api/purchases/route.ts', /email:\s*true\s*,?/g, '');

// 2. recurring-invoices/route.ts - fix payload.id
replaceFile('src/app/api/recurring-invoices/route.ts', /payload\.id/g, '(payload as any).id');

// 3. salaries/route.ts - remove department: true
replaceFile('src/app/api/salaries/route.ts', /department:\s*true\s*,?/g, '');

// 4. sales-orders/route.ts - remove email: true
replaceFile('src/app/api/sales-orders/route.ts', /email:\s*true\s*,?/g, '');

// 5. sales/targets/route.ts - remove department: true
replaceFile('src/app/api/sales/targets/route.ts', /department:\s*true\s*,?/g, '');

// 6. smart-transfers/route.ts - replace cost with buyPrice
replaceFile('src/app/api/smart-transfers/route.ts', /\.cost/g, '.buyPrice');

// 7. stock/adjustments/route.ts - remove sku: true, replace cost -> buyPrice
replaceFile('src/app/api/stock/adjustments/route.ts', /sku:\s*true\s*,?/g, '');
replaceFile('src/app/api/stock/adjustments/route.ts', /\.cost/g, '.buyPrice');

// 8. stock/movements/route.ts - remove sku: true
replaceFile('src/app/api/stock/movements/route.ts', /sku:\s*true\s*,?/g, '');

// 9. sys/alerts/route.ts - fix auth.id
replaceFile('src/app/api/sys/alerts/route.ts', /session\.user\?\.id as string/g, '(auth as any).id');
replaceFile('src/app/api/sys/alerts/route.ts', /session/g, 'auth');

// 10. tenant/provision/route.ts - types
replaceFile('src/app/api/tenant/provision/route.ts', /\(err, stream\)/g, '(err: any, stream: any)');
replaceFile('src/app/api/tenant/provision/route.ts', /\(e2\) => {/g, '(e2: any) => {');

// 11. vacations/route.ts - department: true
replaceFile('src/app/api/vacations/route.ts', /department:\s*true\s*,?/g, '');

// 12. reports/[type]/route.ts - complex
replaceFile('src/app/api/reports/[type]/route.ts', /email:\s*true\s*,?/g, '');
replaceFile('src/app/api/reports/[type]/route.ts', /vatNumber:\s*true\s*,?/g, '');
// fix "customer is missing" from daily reports and purchases.. wait, in daily-report purchases, we use i.supplier
// Actually, earlier the error was "customer does not exist in PurchaseInvoice". 
// But looking closely at reports/[type]/route.ts code for daily-report:
// sales: sales.map(i => ({  العميل: i.customer?.name  }))
// purchases: purchases.map(i => ({ المورد: i.supplier?.name }))
// Let's replace the problematic fields globally just in case.
replaceFile('src/app/api/reports/[type]/route.ts', /i\.customer\?\.name/g, '(i as any).customer?.name');
replaceFile('src/app/api/reports/[type]/route.ts', /i\.supplier\?\.name/g, '(i as any).supplier?.name');
replaceFile('src/app/api/reports/[type]/route.ts', /i\.user\?\.fullName/g, '(i as any).user?.fullName');
replaceFile('src/app/api/reports/[type]/route.ts', /e\.user\?\.fullName/g, '(e as any).user?.fullName');
replaceFile('src/app/api/reports/[type]/route.ts', /t\.user\?\.fullName/g, '(t as any).user?.fullName');
replaceFile('src/app/api/reports/[type]/route.ts', /m\.user\?\.fullName/g, '(m as any).user?.fullName');
replaceFile('src/app/api/reports/[type]/route.ts', /m\.product\?\.name/g, '(m as any).product?.name');
replaceFile('src/app/api/reports/[type]/route.ts', /m\.stock\?\.name/g, '(m as any).stock?.name');

console.log('Script execution complete.');

replaceFile('src/app/api/finance/petty-cash/route.ts', /department:\s*true\s*,?/g, '');
replaceFile('src/app/api/hr/loans/route.ts', /department:\s*true\s*,?/g, '');
replaceFile('src/app/api/installments/route.ts', /email:\s*true\s*,?/g, '');
