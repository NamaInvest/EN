const fs = require('fs');
let content = fs.readFileSync('src/app/(dashboard)/ai-bank/page.tsx', 'utf8');
content = content.replace(
    '<div className="p-6 max-w-4xl mx-auto space-y-6">',
    '<div className="flex items-center justify-center min-h-[85vh] p-6 w-full">'
);
content = content.replace(
    '<div className="bg-gradient-to-r from-emerald-500 to-teal-600 rounded-3xl p-8 text-white shadow-2xl">',
    '<div className="w-full max-w-4xl card-glass border-t-4 border-t-primary shadow-lg p-10 relative overflow-hidden mx-auto text-center">'
);
fs.writeFileSync('src/app/(dashboard)/ai-bank/page.tsx', content);
