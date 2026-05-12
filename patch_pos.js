const fs = require('fs');

let posCode = fs.readFileSync('src/app/(dashboard)/pos/page.tsx', 'utf8');

// 1. Add OfflineSync, WebSerial, InvoiceReceipt imports
posCode = posCode.replace(
  `import { useToast } from '@/components/Toast';`,
  `import { useToast } from '@/components/Toast';\nimport { useOfflineSync } from '@/hooks/useOfflineSync';\nimport { InvoiceReceipt } from '@/components/InvoiceReceipt';`
);

// 2. We need to write the new POS page from scratch because it's too complex to patch via regex.
