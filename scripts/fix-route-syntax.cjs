const fs = require('fs');
const path = require('path');
const ROOT = path.join(__dirname, '..');

// Fix stock-transfers route broken IIFE
{
  const f = path.join(ROOT, 'src/app/api/stock-transfers/route.ts');
  let c = fs.readFileSync(f, 'utf8');
  
  // Find lines 122-142 and rebuild them cleanly
  const lines = c.split('\n');
  const newLines = [];
  let skip = false;
  
  for (let i = 0; i < lines.length; i++) {
    const l = lines[i];
    
    // Start of the broken block (line 122 area)
    if (l.includes('// ── Auto-Journal: قيد تحويل مخزون')) {
      skip = true;
      newLines.push(l); // keep comment
      // Add clean replacement
      newLines.push('        if (fromStockId && toStockId && items.length > 0) {');
      newLines.push("            const firstName = items[0]?.productName || 'بضاعة محولة';");
      newLines.push('            const totalQty  = items.reduce((s, i) => s + (Number(i.quantity) || 0), 0);');
      newLines.push('            const totalCost = items.reduce((s, i) => {');
      newLines.push('                const unitCost = Number(i.unitCost || i.avgCost || i.costPrice || 0);');
      newLines.push('                return s + (unitCost * Number(i.quantity || 0));');
      newLines.push('            }, 0);');
      newLines.push('            postStockTransfer({');
      newLines.push('                movementId:  transfer.id,');
      newLines.push('                reference:   `STK-${transferNo}`,');
      newLines.push("                type:        'transit_out',");
      newLines.push('                totalCost:   totalCost > 0 ? totalCost : totalQty,');
      newLines.push('                productName: firstName,');
      newLines.push('                userId:      auth.userId,');
      newLines.push("                date:        new Date().toISOString().split('T')[0],");
      newLines.push("            }).catch(err => log.error('auto-journal stock-transfer', { msg: err.message }));");
      newLines.push('        }');
      continue;
    }
    
    // Skip lines until we hit the closing of the old broken block
    if (skip) {
      if (l.includes('.catch(err') && l.includes('stock-transfer')) {
        skip = false; // end of broken block
      }
      // Also end on "return NextResponse.json(transfer"
      if (l.includes('return NextResponse.json(transfer')) {
        skip = false;
        newLines.push(l);
      }
      continue;
    }
    
    newLines.push(l);
  }
  
  fs.writeFileSync(f, newLines.join('\n'), 'utf8');
  console.log('stock-transfers: fixed');
}

// Fix shopfloor log.error signature
{
  const f = path.join(ROOT, 'src/app/api/manufacturing/shopfloor/route.ts');
  let c = fs.readFileSync(f, 'utf8');
  // Fix log.error(e) -> log.error('shopfloor error', { message: e.message })
  c = c.replace(/log\.error\(e\)/g, "log.error('shopfloor error', { message: e?.message })");
  fs.writeFileSync(f, c, 'utf8');
  console.log('shopfloor: log.error fixed');
}

console.log('Done!');
