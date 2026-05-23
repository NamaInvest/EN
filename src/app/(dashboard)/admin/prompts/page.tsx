'use client';

import { useState, useEffect } from 'react';
import { useTranslation } from '@/lib/i18n';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
const _t = (ar: string, en: string) => ar; // i18n helper

export default function PromptsAdminPage() {
  const { t } = useTranslation();

    const [prompts, setPrompts] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [form, setForm] = useState({ key: '', systemPrompt: '', userTemplate: '', modelHint: 'gemini-2.5-flash' });

    useEffect(() => {
        fetchPrompts();
    }, []);

    async function fetchPrompts() {
        const res = await fetch('/api/admin/prompts');
        if (res.ok) {
            setPrompts(await res.json());
        }
        setLoading(false);
    }

    async function handleCreate(e: any) {
        e.preventDefault();
        const res = await fetch('/api/admin/prompts', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(form)
        });
        if (res.ok) {
            setForm({ key: '', systemPrompt: '', userTemplate: '', modelHint: 'gemini-2.5-flash' });
            fetchPrompts();
        }
    }

    return (
        <div className="p-6 space-y-6" dir="rtl">
            <div className="flex justify-between items-center">
                <h1 className="text-2xl font-bold">{t('ai.prompts_title')}</h1>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <Card className="lg:col-span-1">
                    <CardHeader>
                        <CardTitle>إنشاء Prompt جديد (Version +1)</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <form onSubmit={handleCreate} className="space-y-4">
                            <div>
                                <label className="block text-sm mb-1">{_t('المعرف (مفتاح)', 'المعرف (Key)')}</label>
                                <Input placeholder="مثال: cfo.daily_summary" value={form.key} onChange={(e: any) => setForm({...form, key: e.target.value})} required />
                            </div>
                            <div>
                                <label className="block text-sm mb-1">{_t('النموذج (نموذج)', 'النموذج (Model)')}</label>
                                <Input placeholder="gemini-2.5-flash" value={form.modelHint} onChange={(e: any) => setForm({...form, modelHint: e.target.value})} required />
                            </div>
                            <div>
                                <label className="block text-sm mb-1">{_t('موجه النظام', 'System Prompt')}</label>
                                <textarea className="flex w-full rounded-md border border-gray-300 bg-transparent px-3 py-2 text-sm shadow-sm placeholder:text-gray-400 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-blue-500 disabled:cursor-not-allowed disabled:opacity-50 h-32" placeholder="أنت مستشار مالي..." value={form.systemPrompt} onChange={(e: any) => setForm({...form, systemPrompt: e.target.value})} required />
                            </div>
                            <div>
                                <label className="block text-sm mb-1">{_t('قالب المستخدم', 'User Template')}</label>
                                <textarea className="flex w-full rounded-md border border-gray-300 bg-transparent px-3 py-2 text-sm shadow-sm placeholder:text-gray-400 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-blue-500 disabled:cursor-not-allowed disabled:opacity-50 h-24" placeholder="حلل هذه البيانات: {{salesCount}}" value={form.userTemplate} onChange={(e: any) => setForm({...form, userTemplate: e.target.value})} required />
                            </div>
                            <Button type="submit" className="w-full">حفظ الإصدار الجديد</Button>
                        </form>
                    </CardContent>
                </Card>

                <Card className="lg:col-span-2">
                    <CardHeader>
                        <CardTitle>مكتبة الـ Prompts</CardTitle>
                    </CardHeader>
                    <CardContent>
                        {loading ? <p>جاري التحميل...</p> : (
                            <div className="space-y-4">
                                {prompts.map(p => (
                                    <div key={p.id} className="p-4 border rounded-lg bg-gray-50/50">
                                        <div className="flex justify-between mb-2">
                                            <span className="font-bold font-mono text-blue-600">{p.key}</span>
                                            <span className="text-sm bg-gray-200 px-2 py-1 rounded">v{p.version}</span>
                                        </div>
                                        <p className="text-xs text-gray-500 mb-2">النموذج: {p.modelHint}</p>
                                        <div className="text-sm bg-white p-2 border rounded whitespace-pre-wrap mt-2 line-clamp-3">
                                            <span className="font-bold text-gray-500 block mb-1">{_t('نظام:', 'System:')}</span>
                                            {p.systemPrompt}
                                        </div>
                                    </div>
                                ))}
                                {prompts.length === 0 && <p className="text-gray-500">لا توجد قوالب حتى الآن.</p>}
                            </div>
                        )}
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
