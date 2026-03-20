"use client";

import { useState, useEffect } from "react";
import { Scale, FileText, ChevronDown, ChevronRight, Download, Filter } from "lucide-react";

export default function TrialBalancePage() {
    const [accounts, setAccounts] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [dates, setDates] = useState({ from: "", to: "" });
    const [expandedNodes, setExpandedNodes] = useState<Set<number>>(new Set());

    useEffect(() => {
        fetchTrialBalance();
    }, []);

    const fetchTrialBalance = async () => {
        setLoading(true);
        try {
            const token = localStorage.getItem("token") || "";
            const param = new URLSearchParams();
            if (dates.from) param.set('from', dates.from);
            if (dates.to) param.set('to', dates.to);

            const res = await fetch(`/api/accounting/trial-balance?${param.toString()}`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            if (res.ok) {
                const data = await res.json();
                setAccounts(data.accounts || []);
            }
        } catch (e) {
            console.error(e);
        } finally {
            setLoading(false);
        }
    };

    const toggleNode = (id: number) => {
        const next = new Set(expandedNodes);
        if (next.has(id)) next.delete(id);
        else next.add(id);
        setExpandedNodes(next);
    };

    // Build the hierarchical tree and compute parent totals
    const buildTree = (parentId: number = 0): any[] => {
        const children = accounts.filter(a => a.parentId === parentId);
        
        return children.map((child: any) => {
            const descendants: any[] = buildTree(child.id);
            
            // A parent's rolled-up debit and credit is its own explicit lines + all descendants' lines
            const rolledDebit = descendants.reduce((acc: any, d: any) => acc + d.rolledDebit, child.periodDebit || 0);
            const rolledCredit = descendants.reduce((acc: any, d: any) => acc + d.rolledCredit, child.periodCredit || 0);
            const rolledNet = descendants.reduce((acc: any, d: any) => acc + d.rolledNet, child.netBalance || 0);

            return {
                ...child,
                children: descendants,
                rolledDebit,
                rolledCredit,
                rolledNet
            };
        });
    };

    const renderRows = (nodes: any[], depth: number = 0) => {
        let result: any[] = [];
        
        nodes.forEach(node => {
            const isExpanded = expandedNodes.has(node.id);
            const hasChildren = node.children && node.children.length > 0;
            const isTopLevel = depth === 0;

            result.push(
                <tr key={node.id} className={`border-b border-slate-100 hover:bg-slate-50 transition ${isTopLevel ? 'bg-slate-50 border-t-2 border-slate-200' : ''}`}>
                    <td className="px-4 py-3 cursor-pointer" onClick={() => hasChildren && toggleNode(node.id)}>
                        <div className="flex items-center gap-2" style={{ paddingRight: `${depth * 24}px` }}>
                            {hasChildren ? (
                                isExpanded ? <ChevronDown size={16} className="text-slate-500"/> : <ChevronRight size={16} className="text-slate-500"/>
                            ) : <div className="w-4 h-4" />}
                            
                            <span className={`font-mono ${isTopLevel ? 'font-bold text-slate-800' : 'text-slate-600'}`}>{node.code}</span>
                            <span className={`${isTopLevel ? 'font-bold text-slate-800' : 'text-slate-700'}`}>{node.name}</span>
                        </div>
                    </td>
                    <td className="px-4 py-3 text-center text-xs text-slate-400 uppercase">{node.type}</td>
                    <td className="px-4 py-3 text-left font-semibold text-slate-600" dir="ltr">{node.rolledDebit?.toLocaleString(undefined, { minimumFractionDigits: 2 })}</td>
                    <td className="px-4 py-3 text-left font-semibold text-slate-600" dir="ltr">{node.rolledCredit?.toLocaleString(undefined, { minimumFractionDigits: 2 })}</td>
                    <td className={`px-4 py-3 text-left font-bold ${node.rolledNet >= 0 ? 'text-emerald-600' : 'text-red-500'}`} dir="ltr">
                        {node.rolledNet?.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                    </td>
                </tr>
            );

            if (isExpanded && hasChildren) {
                result = [...result, ...renderRows(node.children, depth + 1)];
            }
        });

        return result;
    };

    const tree = buildTree(0);
    const totalCompanyDebit = tree.reduce((acc: number, curr: any) => acc + curr.rolledDebit, 0);
    const totalCompanyCredit = tree.reduce((acc: number, curr: any) => acc + curr.rolledCredit, 0);
    const isBalanced = Math.abs(totalCompanyDebit - totalCompanyCredit) < 0.01;

    return (
        <div className="p-6 max-w-7xl mx-auto">
            <div className="flex justify-between items-center mb-6">
                <div>
                    <h1 className="text-3xl font-extrabold text-slate-800 flex items-center gap-3">
                        <Scale className="w-8 h-8 text-indigo-600" /> ميزان المراجعة الشجري (Trial Balance)
                    </h1>
                    <p className="text-slate-500 mt-2">تحليل القوائم المالية والأرصدة الختامية لجميع مستويات الدليل المحاسبي.</p>
                </div>
                
                <div className="flex gap-4">
                    <div className="flex items-center gap-2 bg-white rounded shadow-sm border px-3 py-1.5">
                        <Filter size={16} className="text-slate-400" />
                        <input type="date" className="text-sm outline-none text-slate-600" value={dates.from} onChange={e => setDates({...dates, from: e.target.value})} />
                        <span className="text-slate-300">-</span>
                        <input type="date" className="text-sm outline-none text-slate-600" value={dates.to} onChange={e => setDates({...dates, to: e.target.value})} />
                        <button onClick={fetchTrialBalance} className="bg-indigo-600 text-white px-3 py-1 rounded text-xs ms-2">تطبيق</button>
                    </div>
                </div>
            </div>

            <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
                {loading ? (
                    <div className="p-12 text-center text-slate-400">جاري تحميل المعاملات المحاسبية...</div>
                ) : (
                    <table className="w-full text-sm text-right">
                        <thead className="bg-indigo-50 border-b border-indigo-100 text-indigo-900">
                            <tr>
                                <th className="px-4 py-4 font-bold">الحساب (رقم / إسم)</th>
                                <th className="px-4 py-4 font-bold text-center">النوع</th>
                                <th className="px-4 py-4 font-bold text-left">مدين (Debit)</th>
                                <th className="px-4 py-4 font-bold text-left">دائن (Credit)</th>
                                <th className="px-4 py-4 font-bold text-left">الرصيد المُرصد (Net)</th>
                            </tr>
                        </thead>
                        <tbody>
                            {renderRows(tree, 0)}
                        </tbody>
                        <tfoot className="bg-slate-800 text-white font-bold">
                            <tr>
                                <td className="px-4 py-4 text-center" colSpan={2}>الإجمالي المطابق (Total)</td>
                                <td className="px-4 py-4 text-left font-mono" dir="ltr">{totalCompanyDebit.toLocaleString(undefined, { minimumFractionDigits: 2 })}</td>
                                <td className="px-4 py-4 text-left font-mono" dir="ltr">{totalCompanyCredit.toLocaleString(undefined, { minimumFractionDigits: 2 })}</td>
                                <td className="px-4 py-4 text-center">
                                    {isBalanced ? 
                                        <span className="bg-emerald-500 text-white text-xs px-2 py-1 rounded">الميزان متطابق ✅</span> : 
                                        <span className="bg-red-500 text-white text-xs px-2 py-1 rounded">يوجد خلل ❌</span>
                                    }
                                </td>
                            </tr>
                        </tfoot>
                    </table>
                )}
            </div>
        </div>
    );
}
