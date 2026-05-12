const fs = require('fs');
let c = fs.readFileSync('src/app/(dashboard)/restaurant-pos/page.tsx', 'utf8');
c = c.replace(
    "if (posMode === 'FLOOR') fetchFloorPlan();",
    "if (posMode === 'FLOOR') {\n            fetchFloorPlan();\n            const interval = setInterval(fetchFloorPlan, 10000);\n            return () => clearInterval(interval);\n        }"
);
fs.writeFileSync('src/app/(dashboard)/restaurant-pos/page.tsx', c);
console.log("Updated successfully");
