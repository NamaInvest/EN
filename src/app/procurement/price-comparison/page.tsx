'use client';
import { useState } from 'react';

const SUPPLIERS = [
    {
        name: 'شركة البن العربي', rating: 4.8,
        products: [
            { name: 'قهوة عربية خام 1كجم', price: 85, lastPrice: 82, unit: 'كجم', delivery: 3, minOrder: 50 },
            { name: 'هيل مطحون 500جم', price: 42, lastPrice: 45, unit: 'كجم', delivery: 3, minOrder: 20 },
        ]
    },
    {
        name: 'مورد التوابل المتحدة', rating: 4.2,
        products: [
            { name: 'قهوة عربية خام 1كجم', price: 79, lastPrice: 79, unit: 'كجم', delivery: 5, minOrder: 100 },
            { name: 'هيل مطحون 500جم', price: 38, lastPrice: 41, unit: 'كجم', delivery: 5, minOrder: 50 },
        ]
    },
    {
        name: 'الشركة الدولية للتوزيع', rating: 3.9,
        products: [
            { name: 'قهوة عربية خام 1كجم', price: 91, lastPrice: 88, unit: 'كجم', delivery: 2, minOrder: 10 },
        ]
    },
];

export default function SupplierPricePage() {
    const [selected, setSelected] = useState('قهوة عربية خام 1كجم');
    const [qty, setQty] = useState(100);

    const productNames = [...new Set(SUPPLIERS.flatMap(s => s.products.map(p => p.name)))];

    const comparison = SUPPLIERS.map(s => {
        const product = s.products.find(p => p.name === selected);
        return product ? { supplier: s.name, rating: s.rating, ...product, total: product.price * qty } : null;
    }).filter(Boolean).sort((a: any, b: any) => a.price - b.price);

    const bestPrice = comparison[0] as any;

    return (
        <div className="min-h-screen bg-gray-950 text-white p-6" dir="rtl">
            <div className="mb-6">
                <h1 className="text-2xl font-bold">⚖️ مقارنة أسعار الموردين</h1>
                <p className="text-gray-400 text-sm mt-1">اختر المادة والكمية للحصول على أفضل سعر</p>
            </div>

            {/* Filters */}
            <div className="flex flex-wrap gap-3 mb-6 bg-gray-900 p-4 rounded-2xl border border-gray-800">
                <div className="flex-1 min-w-40">
                    <label className="text-xs text-gray-400 block mb-1">المادة</label>
                    <select value={selected} onChange={e => setSelected(e.target.value)}
                        className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white text-sm">
                        {productNames.map(n => <option key={n}>{n}</option>)}
                    </select>
                </div>
                <div>
                    <label className="text-xs text-gray-400 block mb-1">الكمية</label>
                    <input type="number" value={qty} onChange={e => setQty(+e.target.value)} min={1}
                        className="w-32 bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white text-sm" />
                </div>
            </div>

            {/* Best deal banner */}
            {bestPrice && (
                <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-xl p-4 mb-5">
                    <div className="flex items-center gap-3">
                        <span className="text-2xl">🏆</span>
                        <div>
                            <p className="text-emerald-400 font-semibold">أفضل عرض: {bestPrice.supplier}</p>
                            <p className="text-sm text-gray-300">{bestPrice.price} ر.س/وحدة — إجمالي {bestPrice.total.toLocaleString()} ر.س لـ {qty} وحدة</p>
                        </div>
                    </div>
                </div>
            )}

            {/* Comparison table */}
            <div className="bg-gray-900 rounded-2xl border border-gray-800 overflow-hidden">
                <table className="w-full text-sm">
                    <thead><tr className="border-b border-gray-800 text-gray-400 text-xs">
                        <th className="text-right p-3">المورد</th>
                        <th className="text-right p-3">التقييم</th>
                        <th className="text-right p-3">السعر/وحدة</th>
                        <th className="text-right p-3">التغيير</th>
                        <th className="text-right p-3">إجمالي ({qty})</th>
                        <th className="text-right p-3">التوصيل</th>
                        <th className="text-right p-3">الحد الأدنى</th>
                        <th className="text-right p-3">إجراء</th>
                    </tr></thead>
                    <tbody>
                        {comparison.map((c: any, i) => {
                            const priceDiff = c.price - c.lastPrice;
                            const isBest = i === 0;
                            return (
                                <tr key={c.supplier} className={`border-b border-gray-800/50 ${isBest ? 'bg-emerald-500/5' : 'hover:bg-gray-800/30'}`}>
                                    <td className="p-3">
                                        <div className="flex items-center gap-2">
                                            {isBest && <span className="text-xs bg-emerald-500 text-white px-1.5 py-0.5 rounded font-bold">أفضل</span>}
                                            <span className="font-medium">{c.supplier}</span>
                                        </div>
                                    </td>
                                    <td className="p-3">
                                        <span className="text-amber-400">{'★'.repeat(Math.round(c.rating))}</span>
                                        <span className="text-gray-600 text-xs ml-1">{c.rating}</span>
                                    </td>
                                    <td className={`p-3 font-bold ${isBest ? 'text-emerald-400' : 'text-white'}`}>{c.price} ر.س</td>
                                    <td className="p-3">
                                        <span className={`text-xs ${priceDiff < 0 ? 'text-emerald-400' : priceDiff > 0 ? 'text-red-400' : 'text-gray-400'}`}>
                                            {priceDiff < 0 ? '↓' : priceDiff > 0 ? '↑' : '−'} {Math.abs(priceDiff)} ر.س
                                        </span>
                                    </td>
                                    <td className={`p-3 font-bold ${isBest ? 'text-emerald-400' : 'text-gray-300'}`}>{c.total.toLocaleString()} ر.س</td>
                                    <td className="p-3 text-gray-400">{c.delivery} أيام</td>
                                    <td className="p-3 text-gray-400">{c.minOrder} وحدة</td>
                                    <td className="p-3">
                                        <button className={`text-xs px-3 py-1.5 rounded-lg transition-colors ${isBest ? 'bg-emerald-500 hover:bg-emerald-600 text-white' : 'bg-gray-800 hover:bg-gray-700 text-gray-300'}`}>
                                            {isBest ? '✅ اطلب' : '📋 أضف للمقارنة'}
                                        </button>
                                    </td>
                                </tr>
                            );
                        })}
                    </tbody>
                </table>
            </div>

            {/* Savings callout */}
            {comparison.length > 1 && (
                <div className="mt-4 p-4 bg-blue-500/10 border border-blue-500/20 rounded-xl text-sm text-blue-300">
                    💡 الاختيار الأمثل يوفر <strong className="text-white">{((comparison[comparison.length-1] as any).total - bestPrice.total).toLocaleString()} ر.س</strong> مقارنةً بأغلى عرض على كمية {qty} وحدة
                </div>
            )}
        </div>
    );
}
