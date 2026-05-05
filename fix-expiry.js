const fs = require('fs');
let code = fs.readFileSync('src/lib/document-expiry.ts', 'utf8');

// 1. Remove `documentId: number;` from ExpiryAlert interface
code = code.replace(/documentId: number;\n/g, '');

// 2. Remove `documentId: doc.id,`
code = code.replace(/documentId: doc.id,\n/g, '');
code = code.replace(/documentId: alert.documentId,\n/g, '');
code = code.replace(/documentId: a.documentId,\n/g, '');

// 3. Remove `documentId: doc.id` from where clauses
code = code.replace(/documentId: doc.id,\n/g, '');

// 4. In `scanAndAlert`, fix employeeDocs query
code = code.replace(/const employeeDocs = await prisma\.employeeDocument\.findMany\(\{[\s\S]*?\}\);/g, 
`const employeeDocs = await prisma.documentArchive.findMany({
        where: { documentType: 'EMPLOYEE', expiryDate: { not: null } },
      });`);

// 5. In `scanAndAlert`, fix employeeDocs loop
code = code.replace(/doc\.employee\?\.name \|\| doc\.employee\?\.fullName \|\| ''/g, 'doc.docName || "Employee"');
code = code.replace(/doc\.employeeId/g, 'doc.documentId');

// 6. In `scanAndAlert`, fix companyDocs query
code = code.replace(/const companyDocs = await prisma\.companyDocument\.findMany\(\{[\s\S]*?\}\);/g, 
`const companyDocs = await prisma.documentArchive.findMany({
        where: { documentType: 'COMPANY', expiryDate: { not: null } },
      });`);

// 7. In `scanAndAlert`, fix companyDocs loop
code = code.replace(/doc\.companyName \|\| 'Company'/g, 'doc.docName || "Company"');
code = code.replace(/doc\.companyId \|\| 0/g, 'doc.documentId');

// 8. Fix `documentNumber` typing: `doc.documentNumber || ''` might be missing if `DocumentArchive` doesn't have it.
code = code.replace(/documentNumber: doc\.documentNumber \|\| ''/g, 'documentNumber: ""');

// 9. In `getDashboard`, fix type errors
code = code.replace(/notifiedAt: alert\.notifiedAt,/g, 'notifiedAt: alert.lastNotifiedAt,');

// 10. In `getEmployeeAlerts`, fix type errors
code = code.replace(/notifiedAt: a\.notifiedAt,/g, 'notifiedAt: a.lastNotifiedAt,');

// 11. Fix `documentNumber` in `ExpiryAlert` interface to allow null
code = code.replace(/documentNumber: string;\n/g, 'documentNumber: string | null;\n');

// 12. Fix `markRenewed`
code = code.replace(/if \(alert\.holderType === 'EMPLOYEE'\) \{[\s\S]*?\} else \{[\s\S]*?\}/g, 
`        await prisma.documentArchive.updateMany({
          where: { documentId: alert.holderId || 0, documentType: alert.holderType },
          data: { expiryDate: newExpiryDate },
        });`);

fs.writeFileSync('src/lib/document-expiry.ts', code);
