'use client';

import { useTranslation } from "@/lib/i18n";

export default function SprintProgressPage() {
    const { lang, _t } = useTranslation();

    return (
        <div className="p-6">
            <div className="mb-6">
                <h1 className="text-2xl font-bold text-gray-900">{_t(' ﬁœ„ «·”»—Ì‰  12', 'Sprint 12 Progress')}</h1>
                <p className="text-gray-500">{_t('  »⁄ ”—⁄… «·”»—Ì‰  Ê„Œÿÿ «·«Õ —«ﬁ.', 'Track current sprint velocity and burndown.')}</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                <div className="bg-white p-6 rounded-lg shadow border border-gray-200">
                    <h3 className="text-gray-500 text-sm font-medium">{_t('≈Ã„«·Ì «·‰ﬁ«ÿ', 'Total Points')}</h3>
                    <p className="text-3xl font-bold mt-2">34</p>
                </div>
                <div className="bg-white p-6 rounded-lg shadow border border-gray-200">
                    <h3 className="text-gray-500 text-sm font-medium">{_t('„ﬂ „·', 'Completed')}</h3>
                    <p className="text-3xl font-bold mt-2 text-green-600">21</p>
                </div>
                <div className="bg-white p-6 rounded-lg shadow border border-gray-200">
                    <h3 className="text-gray-500 text-sm font-medium">{_t('„ »ﬁÌ', 'Remaining')}</h3>
                    <p className="text-3xl font-bold mt-2 text-blue-600">13</p>
                </div>
            </div>

            <div className="bg-white rounded-lg shadow border border-gray-200 p-6">
                <h2 className="text-lg font-bold mb-4">{_t('„Œÿÿ «·«Õ —«ﬁ', 'Burndown Chart Placeholder')}</h2>
                <div className="h-64 bg-gray-50 border border-dashed border-gray-300 flex items-center justify-center text-gray-400">
                    [ Chart Visualization via Recharts ]
                </div>
            </div>
        </div>
    );
}
