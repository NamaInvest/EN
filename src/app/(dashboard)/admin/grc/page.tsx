import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ShieldAlert, Fingerprint, GitMerge, FileCheck, Search, Activity, Lock, AlertOctagon } from 'lucide-react';
import Link from 'next/link';

export default function GrcDashboard() {
    const sodViolations = [
        { id: 1, user: 'ahmed.y', rule: 'SOD-001 (إنشاء واعتماد PO)', status: 'مفتوح', risk: 'عالي', date: '2026-05-04' },
        { id: 2, user: 'sara.k', rule: 'SOD-005 (إنشاء مورد ودفع)', status: 'تحت التحقيق', risk: 'حرج', date: '2026-05-03' },
    ];

    const kpis = {
        openFindings: 14,
        criticalRisks: 3,
        sodViolations: 2,
        policyCompliance: 92
    };

    return (
        <div className="max-w-7xl mx-auto space-y-6 p-6" dir="rtl">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight text-gray-900 flex items-center gap-2">
                        <Lock className="w-8 h-8 text-slate-800" />
                        الحوكمة والمخاطر والامتثال (GRC)
                    </h1>
                    <p className="text-gray-500 mt-1">إدارة فصل الواجبات (SoD) وسجلات التدقيق ومخاطر المؤسسة</p>
                </div>
                <div className="flex gap-2">
                    <Button variant="outline" className="bg-white">
                        <FileCheck className="w-4 h-4 ml-2" />
                        تصدير تقرير GRC
                    </Button>
                    <Link href="/admin/grc/audit-log">
                        <Button className="bg-slate-800 hover:bg-slate-900 text-white shadow-sm">
                            <Search className="w-4 h-4 ml-2" />
                            البحث في سجل التدقيق
                        </Button>
                    </Link>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <Card className="bg-gradient-to-br from-red-50 to-white border-red-100">
                    <CardContent className="p-4">
                        <div className="flex items-center justify-between">
                            <p className="text-sm font-medium text-red-600">ملاحظات مفتوحة</p>
                            <AlertOctagon className="w-4 h-4 text-red-400" />
                        </div>
                        <h3 className="text-2xl font-bold text-gray-900 mt-2">{kpis.openFindings}</h3>
                        <p className="text-xs text-red-500 mt-1">تتطلب معالجة</p>
                    </CardContent>
                </Card>
                <Card className="bg-gradient-to-br from-orange-50 to-white border-orange-100">
                    <CardContent className="p-4">
                        <div className="flex items-center justify-between">
                            <p className="text-sm font-medium text-orange-600">انتهاكات فصل الواجبات</p>
                            <GitMerge className="w-4 h-4 text-orange-400" />
                        </div>
                        <h3 className="text-2xl font-bold text-gray-900 mt-2">{kpis.sodViolations}</h3>
                        <p className="text-xs text-orange-500 mt-1">تعارضات نشطة</p>
                    </CardContent>
                </Card>
                <Card className="bg-gradient-to-br from-amber-50 to-white border-amber-100">
                    <CardContent className="p-4">
                        <div className="flex items-center justify-between">
                            <p className="text-sm font-medium text-amber-600">مخاطر حرجة</p>
                            <ShieldAlert className="w-4 h-4 text-amber-400" />
                        </div>
                        <h3 className="text-2xl font-bold text-gray-900 mt-2">{kpis.criticalRisks}</h3>
                        <p className="text-xs text-amber-500 mt-1">في سجل المخاطر</p>
                    </CardContent>
                </Card>
                <Card className="bg-gradient-to-br from-emerald-50 to-white border-emerald-100">
                    <CardContent className="p-4">
                        <div className="flex items-center justify-between">
                            <p className="text-sm font-medium text-emerald-600">الامتثال للسياسات</p>
                            <FileCheck className="w-4 h-4 text-emerald-400" />
                        </div>
                        <h3 className="text-2xl font-bold text-gray-900 mt-2">{kpis.policyCompliance}%</h3>
                        <p className="text-xs text-emerald-500 mt-1">إقرارات الموظفين</p>
                    </CardContent>
                </Card>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <Card className="overflow-hidden border-gray-200 shadow-sm bg-white">
                    <div className="p-4 border-b border-gray-100 flex items-center justify-between">
                        <h3 className="font-semibold text-gray-800 flex items-center gap-2">
                            <GitMerge className="w-4 h-4 text-orange-500" />
                            انتهاكات SoD الأخيرة
                        </h3>
                        <Button variant="ghost" size="sm" className="text-slate-600">إدارة القواعد</Button>
                    </div>
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm text-right">
                            <thead className="bg-gray-50 text-gray-600 border-b">
                                <tr>
                                    <th className="px-4 py-3 font-medium">المستخدم</th>
                                    <th className="px-4 py-3 font-medium">القاعدة المنتهكة</th>
                                    <th className="px-4 py-3 font-medium">الخطورة</th>
                                    <th className="px-4 py-3 font-medium">الحالة</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100">
                                {sodViolations.map((v) => (
                                    <tr key={v.id} className="hover:bg-gray-50 transition-colors">
                                        <td className="px-4 py-3 font-medium text-gray-900">{v.user}</td>
                                        <td className="px-4 py-3 text-gray-700">{v.rule}</td>
                                        <td className="px-4 py-3">
                                            <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-bold ${
                                                v.risk === 'حرج' ? 'bg-red-100 text-red-800' : 'bg-orange-100 text-orange-800'
                                            }`}>
                                                {v.risk}
                                            </span>
                                        </td>
                                        <td className="px-4 py-3">
                                            <span className="text-xs font-medium text-gray-500">{v.status}</span>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </Card>

                <Card className="border-gray-200 shadow-sm bg-white">
                    <div className="p-4 border-b border-gray-100">
                        <h3 className="font-semibold text-gray-800">أدوات الامتثال والتدقيق</h3>
                    </div>
                    <div className="p-4 grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <Link href="/admin/grc/audit-log">
                            <div className="p-4 border rounded-lg hover:border-slate-500 hover:shadow-md transition-all cursor-pointer group">
                                <Fingerprint className="w-6 h-6 text-slate-500 mb-2 group-hover:scale-110 transition-transform" />
                                <h4 className="font-medium text-gray-900">سجل التدقيق المؤسسي</h4>
                                <p className="text-xs text-gray-500 mt-1">سجلات غير قابلة للتلاعب لجميع عمليات CRUD وأحداث الوصول</p>
                            </div>
                        </Link>
                        <Link href="/admin/grc/risks">
                            <div className="p-4 border rounded-lg hover:border-amber-500 hover:shadow-md transition-all cursor-pointer group">
                                <ShieldAlert className="w-6 h-6 text-amber-500 mb-2 group-hover:scale-110 transition-transform" />
                                <h4 className="font-medium text-gray-900">سجل المخاطر</h4>
                                <p className="text-xs text-gray-500 mt-1">تحديد وتقييم ومعالجة المخاطر الإستراتيجية والتشغيلية</p>
                            </div>
                        </Link>
                        <Link href="/admin/grc/policies">
                            <div className="p-4 border rounded-lg hover:border-emerald-500 hover:shadow-md transition-all cursor-pointer group">
                                <FileCheck className="w-6 h-6 text-emerald-500 mb-2 group-hover:scale-110 transition-transform" />
                                <h4 className="font-medium text-gray-900">إدارة السياسات</h4>
                                <p className="text-xs text-gray-500 mt-1">تتبع إقرارات الموظفين والتحديثات</p>
                            </div>
                        </Link>
                        <div className="p-4 border rounded-lg hover:border-indigo-500 hover:shadow-md transition-all cursor-pointer group bg-indigo-50/30">
                            <Activity className="w-6 h-6 text-indigo-500 mb-2 group-hover:scale-110 transition-transform" />
                            <h4 className="font-medium text-gray-900">التدقيق الداخلي</h4>
                            <p className="text-xs text-gray-500 mt-1">تخطيط وتنفيذ عمليات التدقيق الداخلي وتتبع الملاحظات</p>
                        </div>
                    </div>
                </Card>
            </div>
        </div>
    );
}
