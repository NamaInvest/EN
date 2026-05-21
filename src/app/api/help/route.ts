import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

/**
 * Help API Endpoint
 * Provides contextual in-app manual content based on the user's role and current route.
 */
export async function GET(request: Request) {
    const { searchParams } = new URL(request.url);
    const role = searchParams.get('role');
    const route = searchParams.get('route');

    if (!role || !route) {
        return NextResponse.json({ error: 'Missing role or route parameter' }, { status: 400 });
    }

    try {
        const manualPath = path.resolve(process.cwd(), `docs/user-manual/${role}/manual.md`);
        if (!fs.existsSync(manualPath)) {
            return NextResponse.json({ content: 'No specific manual found for your role.' });
        }

        const content = fs.readFileSync(manualPath, 'utf8');
        
        // Convert route (e.g. /accounting/invoices) to a search keyword
        const routeKeyword = route.split('/').pop() || route;
        
        // Extract section based on keyword using a Regex that looks for headers
        // Example: matches from "## Invoices" to the next "## "
        const sectionRegex = new RegExp(`(## [\\s\\S]*?${routeKeyword}[\\s\\S]*?)(?=\\n## |$)`, 'i');
        const match = content.match(sectionRegex);

        if (match && match[0]) {
            return NextResponse.json({ content: match[0].trim() });
        }
        
        // Fallback to table of contents or general intro if specific section not found
        const fallbackRegex = /(# [\s\S]*?\n[\s\S]*?(?=\n## |$))/i;
        const fallbackMatch = content.match(fallbackRegex);

        
        return NextResponse.json({ 
            content: fallbackMatch ? fallbackMatch[0].trim() : 'Contextual help not found for this page, but you can search the manual.',
            fullManualAvailable: true
        });

    } catch (e) {
        console.error('Help API Error:', e);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
