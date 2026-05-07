import { _t } from '@/lib/server-t';
'use client';
import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { BookOpen, FileText } from 'lucide-react';
import { useTranslation } from '@/lib/i18n';

export default function DocsIndexPage() {
  const { lang } = useTranslation();
  const _t = (ar: string, en: string) => lang === 'ar' ? ar : en;
    let files: string[] = [];

    return (
        <div className="max-w-7xl mx-auto p-6 space-y-6">
            <div className="flex items-center gap-3">
                <BookOpen className="w-8 h-8 text-blue-600" />
                <div>
                    <h1 className="text-3xl font-bold text-gray-900">{_t('System Documentation', 'System Documentation')}</h1>
                    <p className="text-gray-500">{_t('Official technical specifications and gap analysis modules.', 'Official technical specifications and gap analysis modules.')}</p>
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
                                <p className="text-sm text-gray-500">{_t('Click to view the full specification and module requirements for this section.', 'Click to view the full specification and module requirements for this section.')}</p>
                            </CardContent>
                        </Card>
                    </Link>
                ))}
                {files.length === 0 && (
                    <div className="col-span-full p-8 text-center text-gray-500 bg-gray-50 rounded-lg">{_t('No documentation files found in the docs folder.', 'No documentation files found in the docs folder.')}</div>
                )}
            </div>
        </div>
    );
}
