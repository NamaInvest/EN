const fs = require('fs');
fs.appendFileSync('src/lib/gaps/index.ts', '\nexport * from "./restaurant-core-engine";\n');
