const fs = require('fs');

let f = 'src/app/invoice/[id]/page.tsx';
let c = fs.readFileSync(f, 'utf8');

c = c.replace(/\|\| نما إنفست<\/h2>/g, "|| 'نما إنفست'}</h2>");
c = c.replace(/\|\| شكراً لتسوقكم معنا/g, "|| 'شكراً لتسوقكم معنا'}");
c = c.replace(/\|\| عميل نقدي<\/p>/g, "|| 'عميل نقدي'}</p>");
c = c.replace(/\|\| النظام<\/p>/g, "|| 'النظام'}</p>");

fs.writeFileSync(f, c);

let ai = 'src/app/(dashboard)/ai-copilot/page.tsx';
let aiC = fs.readFileSync(ai, 'utf8');
if(aiC.includes("import { useTranslation }")) {
    aiC = aiC.replace("import { useTranslation } from \"@/lib/i18n\";\n", "");
    if(!aiC.includes("import { useTranslation }")) {
        aiC = aiC.replace(/'use client';/, "'use client';\nimport { useTranslation } from \"@/lib/i18n\";");
    }
}
fs.writeFileSync(ai, aiC);

console.log('Fixed syntaxes successfully');
