import fs from 'fs';
import path from 'path';
import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { BookOpen, FileText } from 'lucide-react';

export default async function DocsIndexPage() {
    const docsDir = path.join(process.cwd(), 'docs', 'gaps');
    let files: string[] = [];
    
    try {
        files = fs.readdirSync(docsDir).filter(f => f.endsWith('.md'));
    } catch (e) {
        console.error('Error reading docs directory', e);
    }

    return (
        <div className="max-w-7xl mx-auto p-6 space-y-6">
            <div className="flex items-center gap-3">
                <BookOpen className="w-8 h-8 text-blue-600" />
                <div>
                    <h1 className="text-3xl font-bold text-gray-900">System Documentation</h1>
                    <p className="text-gray-500">Official technical specifications and gap analysis modules.</p>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mt-8">
                {files.map(file => (
                    <Link key={file} href={`/docs/${file.replace('.md', '')}`}>
                        <Card className="hover:shadow-md transition-shadow cursor-pointer h-full border-gray-200 hover:border-blue-300">
                            <CardHeader className="pb-2">
                                <CardTitle className="text-lg flex items-center gap-2 text-blue-700">
                                    <FileText className="w-4 h-4" />
                                    {file.replace('.md', '').replace(/-/g, ' ').toUpperCase()}
                                </CardTitle>
                            </CardHeader>
                            <CardContent>
                                <p className="text-sm text-gray-500">
                                    Click to view the full specification and module requirements for this section.
                                </p>
                            </CardContent>
                        </Card>
                    </Link>
                ))}
                {files.length === 0 && (
                    <div className="col-span-full p-8 text-center text-gray-500 bg-gray-50 rounded-lg">
                        No documentation files found in the docs folder.
                    </div>
                )}
            </div>
        </div>
    );
}
