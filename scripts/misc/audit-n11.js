const { Client } = require('ssh2');
const c = new Client();

c.on('ready', () => {
  // All routes from sidebar
  const routes = [
    // Dashboard
    '/dashboard', '/ai-bank', '/ai-copilot', '/ai-cfo', '/ai-scm', '/sys/alerts',
    // Sales & POS
    '/pos', '/restaurant-pos', '/shifts', '/sales', '/sales/history',
    '/price-quotes', '/sales/orders', '/sales/delivery-notes', '/sales-returns',
    '/recurring-invoices', '/sales/routes', '/sales/targets', '/sales/options',
    // Purchases
    '/purchases/options', '/purchases/requisitions', '/purchases/rfq',
    '/purchase-orders', '/purchases/grn', '/purchases', '/purchase-returns',
    '/purchases/letters-of-credit', '/reports/manual-purchases',
    // Inventory
    '/products', '/stock', '/stock/movements', '/stock-transfers',
    '/smart-transfers', '/stock/adjustments', '/warehouses', '/enterprise/wms',
    '/barcode', '/batches', '/inv/serials', '/stocktake/vision',
    '/stocktake', '/warehouses/options',
    // Manufacturing
    '/manufacturing', '/enterprise/mrp', '/enterprise/mrp/recipes', '/enterprise/quality',
    // Finance
    '/accounting', '/treasury', '/accounting/banks', '/treasury/checks',
    '/receipt-vouchers', '/expenses', '/fng/petty-cash-funds', '/fixed-assets',
    '/fng/budgets', '/installments', '/reports', '/reports/104-modules',
    '/reports/fraud-ai', '/treasury/bank-reconciliation',
    // CRM
    '/customers', '/crm/leads', '/loyalty', '/gift-cards', '/coupons',
    '/promotions', '/bookings', '/bookings/calendar', '/affiliates',
    // HR
    '/employees', '/attendance', '/salaries', '/vacations', '/hr/loans',
    '/hr/jobs', '/hr/evaluations', '/hr/training', '/hr/ai-enrollment',
    // Enterprise
    '/enterprise/projects', '/enterprise/property', '/rem/leases',
    '/rem/installments', '/enterprise/fleet', '/fleet/fuel', '/fleet/trips',
    '/shl/students', '/shl/classes', '/enterprise/legal',
    // Settings
    '/company-info', '/branches', '/settings/currencies', '/settings/approvals',
    '/whatsapp-hub', '/settings', '/audit-logs', '/maintenance',
    '/sys/health',
  ];

  const N11_PORT = 3011;
  const HOST = 'n11.namainvist.com';

  // Build curl commands for all routes
  const curlCmds = routes.map(r =>
    `echo -n "${r}: " && curl -s -o /dev/null -w "%{http_code}\\n" -H "Host: ${HOST}" --max-time 8 http://localhost:${N11_PORT}${r} 2>/dev/null`
  ).join('\n');

  const cmd = `
    echo "=== n11 HTTP Status Check for ALL ${routes.length} routes ==="
    echo "Port: ${N11_PORT} | Host: ${HOST}"
    echo ""
    
    ${curlCmds}
    
    echo ""
    echo "=== n11 PM2 Status ==="
    pm2 show n11 2>/dev/null | grep -E "status|uptime|↺|memory|pid" | head -8
    
    echo ""
    echo "=== n11 Recent Errors ==="
    tail -30 /root/.pm2/logs/n11-error.log 2>/dev/null | grep -v "^$" | tail -20
    
    echo ""
    echo "=== n11 Build Routes Count ==="
    ls /www/wwwroot/n11.namainvist.com/.next/server/app/'(dashboard)'/ 2>/dev/null | wc -l
    echo "built routes in (dashboard)"
  `;

  c.exec(cmd, (err, stream) => {
    stream.on('data', d => process.stdout.write(d.toString()));
    stream.stderr.on('data', d => process.stdout.write(d.toString()));
    stream.on('close', () => c.end());
  });
}).connect({ host: '46.4.188.170', port: 22, username: 'root', password: 'process.env.SSH_PASSWORD' });
