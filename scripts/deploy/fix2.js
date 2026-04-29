const fs = require('fs');

try {
    let content = fs.readFileSync('src/app/(dashboard)/ai-scm/page.tsx', 'utf8');
    content = content.replace(
        '<div className="p-6 max-w-4xl mx-auto space-y-6">',
        '<div className="flex items-center justify-center min-h-[85vh] p-6 w-full">'
    );
    content = content.replace(
        '<div className="bg-gradient-to-r from-purple-600 to-indigo-700 rounded-3xl p-8 text-white shadow-2xl">',
        '<div className="w-full max-w-4xl card-glass border-t-4 border-t-primary shadow-lg p-10 relative overflow-hidden mx-auto text-center">'
    );
    fs.writeFileSync('src/app/(dashboard)/ai-scm/page.tsx', content);
} catch(e){}

try {
    let content2 = fs.readFileSync('src/app/(dashboard)/ai-cfo/page.tsx', 'utf8');
    content2 = content2.replace(
        '<div className="p-6 max-w-4xl mx-auto space-y-6">',
        '<div className="flex items-center justify-center min-h-[85vh] p-6 w-full">'
    );
    content2 = content2.replace(
        '<div className="bg-gradient-to-r from-blue-600 to-blue-800 rounded-3xl p-8 text-white shadow-2xl">',
        '<div className="w-full max-w-4xl card-glass border-t-4 border-t-primary shadow-lg p-10 relative overflow-hidden mx-auto text-center">'
    );
    fs.writeFileSync('src/app/(dashboard)/ai-cfo/page.tsx', content2);
} catch(e){}

try {
    let content3 = fs.readFileSync('src/app/(dashboard)/ai-copilot/page.tsx', 'utf8');
    content3 = content3.replace(
        '<div className="p-6 max-w-4xl mx-auto space-y-6">',
        '<div className="flex items-center justify-center min-h-[85vh] p-6 w-full">'
    );
    content3 = content3.replace(
        '<div className="bg-gradient-to-r from-violet-600 to-purple-800 rounded-3xl p-8 text-white shadow-2xl">',
        '<div className="w-full max-w-4xl card-glass border-t-4 border-t-primary shadow-lg p-10 relative overflow-hidden mx-auto text-center">'
    );
    fs.writeFileSync('src/app/(dashboard)/ai-copilot/page.tsx', content3);
} catch(e){}
