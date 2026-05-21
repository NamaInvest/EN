import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

export async function GET(req: Request) {
    const { searchParams } = new URL(req.url);
    const role = searchParams.get('role');
    const topic = searchParams.get('topic');

    try {
        if (topic) {
            // Serve tooltip
            const tooltipPath = path.join(process.cwd(), `docs/user-manual/_tooltips/${topic}.md`);
            if (fs.existsSync(tooltipPath)) {
                const content = fs.readFileSync(tooltipPath, 'utf8');
                return NextResponse.json({ content });
            }
            return NextResponse.json({ content: 'Tooltip not found.' }, { status: 404 });
        }

        if (role) {
            // Serve role manual
            const manualPath = path.join(process.cwd(), `docs/user-manual/${role}/manual.md`);
            if (fs.existsSync(manualPath)) {
                const content = fs.readFileSync(manualPath, 'utf8');
                return NextResponse.json({ content });
            }
            return NextResponse.json({ content: 'Manual not found for this role.' }, { status: 404 });
        }

        return NextResponse.json({ error: 'Provide role or topic param' }, { status: 400 });
    } catch (error) {
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
