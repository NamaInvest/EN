const fs = require('fs');
let c = fs.readFileSync('src/components/Providers.tsx', 'utf8');
if (!c.includes('SessionProvider')) {
    c = c.replace("} from '@/lib/SettingsContext';", "} from '@/lib/SettingsContext';\nimport { SessionProvider } from 'next-auth/react';");
    c = c.replace("<SettingsProvider>", "<SessionProvider><SettingsProvider>");
    c = c.replace("</SettingsProvider>", "</SettingsProvider></SessionProvider>");
    fs.writeFileSync('src/components/Providers.tsx', c);
}
