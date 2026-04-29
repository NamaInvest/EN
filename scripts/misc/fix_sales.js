const fs = require('fs');
let c = fs.readFileSync('c:/Users/1/Desktop/alfa/src/app/api/sales/route.ts', 'utf8');
c = c.replace(/\\\Product \\\$\\{item\\.productId\\}\\\/g, '\Product \\');
c = c.replace(/\\\INV\\\$\\{invoice\\.invoiceNo\\.toString\\(\\)\\.padStart\\(6, \\'0\\'\\)\\}\\\/g, '\INV\\');
c = c.replace(/\\\? Invoice \\\$\\{invoice\\.invoiceNo\\} Phase 2 reported to Fatoora\\\/g, '\? Invoice \ Phase 2 reported to Fatoora\');
c = c.replace(/\\\�� ��� \\\$\\{result\\.count\\} ������ ������\\\/g, '\�� ��� \ ������ ������\');
fs.writeFileSync('c:/Users/1/Desktop/alfa/src/app/api/sales/route.ts', c);
