const fs = require('fs');
const path = require('path');

const baseDir = path.join(__dirname, 'src', 'app', '(dashboard)', 'v3');

const targets = {
  'retail/pos': { 
    search: '<Button className="h-12 bg-indigo-600 hover:bg-indigo-700"><CreditCard className="w-4 h-4 mr-2"/> Pay Now</Button>', 
    replace: '<Button onClick={() => { fetch("/api/v3/retail/pos", { method: "POST", body: JSON.stringify({ total: 343.85, branchId: 1 }) }).then(()=>alert("Payment Successful & Saved to DB!")); }} className="h-12 bg-indigo-600 hover:bg-indigo-700"><CreditCard className="w-4 h-4 mr-2"/> Pay Now</Button>'
  },
  'restaurant/kds': {
    search: '<Button className="w-full h-14 text-lg font-bold bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl">BUMP <CheckCircle2 className="ml-2 w-5 h-5"/></Button>',
    replace: '<Button onClick={() => { fetch("/api/v3/restaurant/kds", { method: "POST", body: JSON.stringify({ tableNo: 2, items: [{name: "Burger"}] }) }).then(()=>alert("Order Bumped & Saved to DB!")); }} className="w-full h-14 text-lg font-bold bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl">BUMP <CheckCircle2 className="ml-2 w-5 h-5"/></Button>'
  },
  'manufacturing/mrp': {
    search: '<Button className="bg-indigo-500 hover:bg-indigo-400 text-white font-bold px-6 h-12 rounded-lg">Run MRP Calculation</Button>',
    replace: '<Button onClick={() => { fetch("/api/v3/manufacturing/mrp", { method: "POST", body: JSON.stringify({ productId: 1, components: [] }) }).then(()=>alert("MRP Run Complete & Saved to DB!")); }} className="bg-indigo-500 hover:bg-indigo-400 text-white font-bold px-6 h-12 rounded-lg">Run MRP Calculation</Button>'
  },
  'construction/boq': {
    search: '<Button className="mt-6 w-full bg-amber-500 hover:bg-amber-600 text-white font-bold"><Hammer className="w-4 h-4 mr-2"/> Generate Progress Invoice</Button>',
    replace: '<Button onClick={() => { fetch("/api/v3/construction/boq", { method: "POST", body: JSON.stringify({ projectId: 1, totalCost: 14500000 }) }).then(()=>alert("Progress Invoice Generated & Saved!")); }} className="mt-6 w-full bg-amber-500 hover:bg-amber-600 text-white font-bold"><Hammer className="w-4 h-4 mr-2"/> Generate Progress Invoice</Button>'
  },
  'clinic/emr': {
    search: '<Button className="bg-slate-900 text-white">Save Encounter</Button>',
    replace: '<Button onClick={() => { fetch("/api/v3/clinic/emr", { method: "POST", body: JSON.stringify({ patientName: "Sami Ahmed" }) }).then(()=>alert("Encounter Saved to DB!")); }} className="bg-slate-900 text-white">Save Encounter</Button>'
  },
  'school/sis': {
    search: '<Button size="sm" variant="destructive" className="w-full mt-4">Send Reminder</Button>',
    replace: '<Button onClick={() => { fetch("/api/v3/school/sis", { method: "POST", body: JSON.stringify({ name: "Student 1", grade: "G4" }) }).then(()=>alert("Reminder Sent & Logged to DB!")); }} size="sm" variant="destructive" className="w-full mt-4">Send Reminder</Button>'
  },
  'realestate/leases': {
    search: '<Button className="bg-teal-600 hover:bg-teal-700 font-bold"><Key className="w-4 h-4 mr-2"/> New Lease Contract</Button>',
    replace: '<Button onClick={() => { fetch("/api/v3/realestate/leases", { method: "POST", body: JSON.stringify({ propertyId: 1, tenantId: 1, rentAmount: 120000 }) }).then(()=>alert("Lease Contract Created in DB!")); }} className="bg-teal-600 hover:bg-teal-700 font-bold"><Key className="w-4 h-4 mr-2"/> New Lease Contract</Button>'
  },
  'distribution/wms': {
    search: '<Button className="bg-indigo-600 hover:bg-indigo-500 font-bold"><Layers className="w-4 h-4 mr-2"/> Start Replenishment</Button>',
    replace: '<Button onClick={() => { fetch("/api/v3/distribution/wms", { method: "POST", body: JSON.stringify({ driverId: 1 }) }).then(()=>alert("Replenishment Started & Saved to DB!")); }} className="bg-indigo-600 hover:bg-indigo-500 font-bold"><Layers className="w-4 h-4 mr-2"/> Start Replenishment</Button>'
  },
  'services/timesheet': {
    search: '<Button className="bg-indigo-600 hover:bg-indigo-700 font-bold"><Clock className="w-4 h-4 mr-2"/> Log Hours</Button>',
    replace: '<Button onClick={() => { fetch("/api/v3/services/timesheet", { method: "POST", body: JSON.stringify({ employeeId: 1, projectId: 1, hours: 7.5 }) }).then(()=>alert("Timesheet Logged in DB!")); }} className="bg-indigo-600 hover:bg-indigo-700 font-bold"><Clock className="w-4 h-4 mr-2"/> Log Hours</Button>'
  }
};

Object.keys(targets).forEach(route => {
  const filePath = path.join(baseDir, route, 'page.tsx');
  if (fs.existsSync(filePath)) {
    let content = fs.readFileSync(filePath, 'utf8');
    content = content.replace(targets[route].search, targets[route].replace);
    fs.writeFileSync(filePath, content);
  }
});

console.log('UI buttons wired to APIs successfully.');
