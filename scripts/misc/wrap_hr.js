const fs = require('fs');
const filePath = 'c:/Users/1/Desktop/alfa/src/app/hr/page.tsx';
let file = fs.readFileSync(filePath, 'utf8');

if (!file.includes('import FeatureGuard')) {
    file = file.replace("import Link from 'next/link';", "import Link from 'next/link';\nimport FeatureGuard from '@/hooks/FeatureGuard';");
}

file = file.replace(
    "onClick={() => deleteEmployee(emp.id)}",
    "onClick={() => deleteEmployee(emp.id)}"
); // Need to see exactly what to replace first.

fs.writeFileSync(filePath, file);
console.log("Done HR Check");
