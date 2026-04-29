const { Client } = require('ssh2');
const c = new Client();
c.on('ready', () => {
  const BASE = '/www/wwwroot/namainvist.com/src/app/(dashboard)';
  const cmd = `
    echo "=== Checking missing sidebar routes ==="
    declare -a ROUTES=(
      "restaurant-pos"
      "sales/routes"
      "sales/targets" 
      "sales/options"
      "purchases/requisitions"
      "purchases/rfq"
      "purchases/grn"
      "purchases/letters-of-credit"
      "enterprise/wms"
      "stocktake/vision"
      "warehouses/options"
      "enterprise/mrp"
      "enterprise/mrp/recipes"
      "enterprise/quality"
      "reports/104-modules"
      "reports/fraud-ai"
      "treasury/bank-reconciliation"
      "bookings/calendar"
      "fleet/fuel"
      "fleet/trips"
      "shl/students"
      "shl/classes"
      "sys/health"
      "sys/alerts"
      "ice"
      "pos"
      "ai-bank"
      "ai-cfo"
      "ai-copilot"
      "ai-scm"
    )
    for route in "\${ROUTES[@]}"; do
      if [ -f "${BASE}/\${route}/page.tsx" ] || [ -f "${BASE}/\${route}/page.jsx" ]; then
        echo "✅ /\${route}"
      else
        echo "❌ /\${route} — MISSING"
      fi
    done
    
    echo ""
    echo "=== Checking enterprise subdirs ==="
    ls ${BASE}/enterprise/ 2>/dev/null
    
    echo ""
    echo "=== Checking fleet subdir ==="
    ls ${BASE}/fleet/ 2>/dev/null || echo "(no fleet dir)"
    ls ${BASE}/enterprise/fleet/ 2>/dev/null || echo "(no enterprise/fleet dir)"
    
    echo ""
    echo "=== pos page.tsx exists? ==="
    ls -la ${BASE}/pos/page.tsx 2>/dev/null || echo "pos/page.tsx NOT FOUND"
    head -5 ${BASE}/pos/page.tsx 2>/dev/null
  `;
  c.exec(cmd, (err, stream) => {
    stream.on('data', d => process.stdout.write(d.toString()));
    stream.stderr.on('data', d => process.stdout.write(d.toString()));
    stream.on('close', () => c.end());
  });
}).connect({ host: '46.4.188.170', port: 22, username: 'root', password: '_ee4SWbxLVfH9b' });
