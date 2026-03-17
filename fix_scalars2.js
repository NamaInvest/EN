const fs = require('fs');
let schema = fs.readFileSync('schema_ready.prisma', 'utf-8');

const regex = /(model\s+SalesInvoice\s+\{[\s\S]*?\n)(\})/;
schema = schema.replace(regex, `$1  shiftId Int? @map("shift_id")\n$2`);

fs.writeFileSync('schema_final_ready.prisma', schema);
console.log('Fixed SalesInvoice shiftId!');
