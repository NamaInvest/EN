const XLSX = require('xlsx');
const wb = XLSX.readFile('C:\\Users\\1\\Desktop\\Supermarket-Products (2).xlsx');
const ws = wb.Sheets[wb.SheetNames[0]];
const data = XLSX.utils.sheet_to_json(ws);
console.log('Sheet:', wb.SheetNames[0]);
console.log('Total:', data.length);
console.log('Cols:', Object.keys(data[0]));
console.log(JSON.stringify(data.slice(0, 3), null, 2));
