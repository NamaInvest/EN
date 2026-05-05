const fs = require('fs');
const path = require('path');

const baseDir = path.join(__dirname, 'src', 'app', '(dashboard)', 'v3');

const enhancements = {
  'retail/pos': {
    buttons: [
      { label: 'Omnichannel Sync', icon: 'RefreshCcw', color: 'bg-blue-500' },
      { label: 'Clienteling AI', icon: 'BrainCircuit', color: 'bg-purple-500' },
      { label: 'Offline Mode (Active)', icon: 'WifiOff', color: 'bg-emerald-500' }
    ]
  },
  'restaurant/kds': {
    buttons: [
      { label: 'Sync Aggregators (Jahez)', icon: 'CloudDownload', color: 'bg-orange-500' },
      { label: 'QR Orders Queue', icon: 'QrCode', color: 'bg-indigo-500' },
      { label: 'Waste Tracking', icon: 'Trash2', color: 'bg-red-500' }
    ]
  },
  'manufacturing/mrp': {
    buttons: [
      { label: 'IoT Sensors Sync', icon: 'Cpu', color: 'bg-teal-500' },
      { label: 'Predictive Maintenance AI', icon: 'Wrench', color: 'bg-amber-500' },
      { label: 'Digital Twin View', icon: 'BoxSelect', color: 'bg-indigo-500' }
    ]
  },
  'construction/boq': {
    buttons: [
      { label: 'Open BIM Viewer 3D', icon: 'Building2', color: 'bg-stone-600' },
      { label: 'Drone Survey Import', icon: 'Plane', color: 'bg-blue-600' },
      { label: 'Weather Impact Forecast', icon: 'CloudRain', color: 'bg-sky-500' }
    ]
  },
  'clinic/emr': {
    buttons: [
      { label: 'Start Telehealth Call', icon: 'Video', color: 'bg-blue-500' },
      { label: 'Sync Apple Health', icon: 'Watch', color: 'bg-rose-500' },
      { label: 'AI Claim Scrubbing', icon: 'ShieldCheck', color: 'bg-emerald-600' }
    ]
  },
  'school/sis': {
    buttons: [
      { label: 'Predictive Dropout AI', icon: 'Brain', color: 'bg-purple-600' },
      { label: 'Plagiarism Scanner', icon: 'ScanSearch', color: 'bg-slate-600' },
      { label: 'RFID Live Tracking', icon: 'MapPin', color: 'bg-red-500' }
    ]
  },
  'realestate/leases': {
    buttons: [
      { label: 'Generate Smart Lock PIN', icon: 'KeyRound', color: 'bg-teal-600' },
      { label: '3D Virtual Tour', icon: 'Glasses', color: 'bg-indigo-500' },
      { label: 'Tenant Social Portal', icon: 'MessageSquare', color: 'bg-sky-500' }
    ]
  },
  'distribution/wms': {
    buttons: [
      { label: 'AI Route Optimization', icon: 'Route', color: 'bg-emerald-600' },
      { label: 'Enable Voice Picking', icon: 'Mic', color: 'bg-blue-500' },
      { label: 'Robotic Conveyor API', icon: 'Bot', color: 'bg-slate-700' }
    ]
  },
  'services/timesheet': {
    buttons: [
      { label: 'Passive Time Tracker', icon: 'Eye', color: 'bg-indigo-600' },
      { label: 'AI Contract Analysis', icon: 'FileSearch', color: 'bg-purple-600' },
      { label: 'Resource Forecast', icon: 'TrendingUp', color: 'bg-emerald-500' }
    ]
  }
};

Object.keys(enhancements).forEach(route => {
  const filePath = path.join(baseDir, route, 'page.tsx');
  if (fs.existsSync(filePath)) {
    let content = fs.readFileSync(filePath, 'utf8');
    
    if (!content.includes('GLOBAL ENTERPRISE FEATURES')) {
      const injectionPoint = '<div className="';
      const firstDivIndex = content.indexOf(injectionPoint);
      
      if (firstDivIndex !== -1) {
        const icons = enhancements[route].buttons.map(b => b.icon);
        const iconImportMatch = content.match(/import \\{ (.*?) \\} from 'lucide-react';/);
        if (iconImportMatch) {
          const existingIcons = iconImportMatch[1].split(',').map(s => s.trim());
          const newIcons = [...new Set([...existingIcons, ...icons, 'BrainCircuit', 'RefreshCcw', 'WifiOff', 'CloudDownload', 'QrCode', 'Trash2', 'Cpu', 'Wrench', 'BoxSelect', 'Building2', 'Plane', 'CloudRain', 'Video', 'Watch', 'ShieldCheck', 'Brain', 'ScanSearch', 'MapPin', 'KeyRound', 'Glasses', 'MessageSquare', 'Route', 'Mic', 'Bot', 'Eye', 'FileSearch', 'TrendingUp'])];
          content = content.replace(iconImportMatch[0], "import { " + newIcons.join(', ') + " } from 'lucide-react';");
        }

        const buttonsHtml = enhancements[route].buttons.map(b => 
          '<Button className="' + b.color + ' text-white font-bold hover:opacity-90 shadow-lg"><' + b.icon + ' className="w-4 h-4 mr-2"/> ' + b.label + '</Button>'
        ).join('\\n        ');

        const barHtml = [
          '      {/* Global System Features Bar */} ',
          '      <div className="bg-slate-900 border border-slate-700 p-4 rounded-xl shadow-xl flex justify-between items-center mb-6 animate-fade-in">',
          '        <div className="flex items-center gap-2">',
          '          <span className="text-yellow-400 font-black tracking-widest text-sm border border-yellow-400/50 bg-yellow-400/10 px-2 py-1 rounded">GLOBAL ENTERPRISE FEATURES</span>',
          '        </div>',
          '        <div className="flex gap-3">',
          '        ' + buttonsHtml,
          '        </div>',
          '      </div>'
        ].join('\\n');

        const insertPos = content.indexOf('>', firstDivIndex) + 1;
        content = content.slice(0, insertPos) + barHtml + content.slice(insertPos);
        fs.writeFileSync(filePath, content);
      }
    }
  }
});

console.log('Global enhancements injected successfully into all 9 V3 modules.');
