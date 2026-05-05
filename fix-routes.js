const fs = require('fs');
const path = require('path');

const routes = [
  'clinic/emr',
  'construction/boq',
  'distribution/wms',
  'manufacturing/mrp',
  'realestate/leases',
  'restaurant/kds',
  'retail/pos',
  'school/sis',
  'services/timesheet'
];

routes.forEach(route => {
  const filePath = path.join(__dirname, 'src', 'app', 'api', 'v3', route, 'route.ts');
  if (fs.existsSync(filePath)) {
    let content = fs.readFileSync(filePath, 'utf8');
    content = content.replace(/\\n/g, '\n');
    fs.writeFileSync(filePath, content);
  }
});
console.log('Fixed API routes');
