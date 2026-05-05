import fs from 'fs';
import path from 'path';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface Props {
    params: {
        slug: string;
    };
}

export default async function DocViewPage({ params }: Props) {
    const filePath = path.join(process.cwd(), 'docs', 'gaps', `${params.slug}.md`);
    let content = '';
    
    try {
        if (fs.existsSync(filePath)) {
            content = fs.readFileSync(filePath, 'utf8');
        } else {
            content = '# Error\nDocument not found.';
        }
    } catch (e) {
        content = '# Error\nFailed to load document.';
    }

    return (
        <div className="max-w-5xl mx-auto p-6 space-y-6">
            <Link href="/docs">
                <Button variant="ghost" className="mb-4 text-blue-600 hover:bg-blue-50">
                    <ArrowLeft className="w-4 h-4 mr-2" /> Back to Docs
                </Button>
            </Link>

            <div className="bg-white p-8 rounded-xl shadow-sm border border-gray-200">
                <div className="prose prose-blue max-w-none prose-headings:border-b prose-headings:pb-2 prose-h1:text-3xl prose-h2:text-2xl prose-table:w-full prose-th:bg-gray-100 prose-th:p-2 prose-td:p-2 prose-td:border-t">
                    {/* Native simple markdown rendering or raw text. For full support we'd use react-markdown, but pre format is safer for now if it's not installed */}
                    <pre className="whitespace-pre-wrap font-sans text-sm text-gray-800 bg-transparent border-0 p-0 m-0">
                        {content}
                    </pre>
                </div>
            </div>
        </div>
    );
}
