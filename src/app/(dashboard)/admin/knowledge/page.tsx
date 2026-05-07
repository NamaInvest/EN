'use client';

import { useState, useEffect } from 'react';
import { useTranslation } from '@/lib/i18n';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

export default function KnowledgeAdminPage() {
  const { t } = useTranslation();

    const [docs, setDocs] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [form, setForm] = useState({ title: '', category: '', content: '' });

    useEffect(() => {
        fetchDocs();
    }, []);

    async function fetchDocs() {
        const res = await fetch('/api/admin/knowledge');
        if (res.ok) {
            setDocs(await res.json());
        }
        setLoading(false);
    }

    async function handleCreate(e: any) {
        e.preventDefault();
        const res = await fetch('/api/admin/knowledge', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(form)
        });
        if (res.ok) {
            setForm({ title: '', category: '', content: '' });
            fetchDocs();
        }
    }

    return (
        <div className="p-6 space-y-6" dir="rtl">
            <div className="flex justify-between items-center">
                <h1 className="text-2xl font-bold">{t('ai.knowledge_title')}</h1>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <Card className="lg:col-span-1">
                    <CardHeader>
                        <CardTitle>إضافة مستند جديد</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <form onSubmit={handleCreate} className="space-y-4">
                            <div>
                                <label className="block text-sm mb-1">عنوان المستند</label>
                                <Input placeholder="سياسة الإجازات 2026" value={form.title} onChange={(e: any) => setForm({...form, title: e.target.value})} required />
                            </div>
                            <div>
                                <label className="block text-sm mb-1">التصنيف</label>
                                <Input placeholder="HR" value={form.category} onChange={(e: any) => setForm({...form, category: e.target.value})} required />
                            </div>
                            <div>
                                <label className="block text-sm mb-1">المحتوى</label>
                                <textarea className="flex w-full rounded-md border border-gray-300 bg-transparent px-3 py-2 text-sm shadow-sm placeholder:text-gray-400 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-blue-500 disabled:cursor-not-allowed disabled:opacity-50 h-40" placeholder="أدخل محتوى المستند هنا... سيتم تحويله إلى أشعة Vectors" value={form.content} onChange={(e: any) => setForm({...form, content: e.target.value})} required />
                            </div>
                            <Button type="submit" className="w-full">حفظ وتوليد الـ Embeddings</Button>
                        </form>
                    </CardContent>
                </Card>

                <Card className="lg:col-span-2">
                    <CardHeader>
                        <CardTitle>فهرس المعرفة</CardTitle>
                    </CardHeader>
                    <CardContent>
                        {loading ? <p>جاري التحميل...</p> : (
                            <div className="space-y-4">
                                {docs.map(d => (
                                    <div key={d.id} className="p-4 border rounded-lg bg-gray-50/50 flex justify-between items-center">
                                        <div>
                                            <h3 className="font-bold">{d.title}</h3>
                                            <p className="text-xs text-gray-500">التصنيف: {d.metadata?.category}</p>
                                        </div>
                                        <div className="text-sm bg-blue-100 text-blue-700 px-2 py-1 rounded border border-blue-200">
                                            مفهرس 🟢
                                        </div>
                                    </div>
                                ))}
                                {docs.length === 0 && <p className="text-gray-500">لا توجد مستندات. قم بإضافة المعرفة ليستخدمها الـ AI.</p>}
                            </div>
                        )}
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
