'use client';
import { useState, useEffect } from 'react';
import { useTranslation } from '@/lib/i18n';

export default function OrgChartPage() {
    const { lang } = useTranslation();
    const isAr = lang === 'ar';
    const [employees, setEmployees] = useState<any[]>([]);
    const [filter, setFilter] = useState('');

    useEffect(() => {
        fetch('/api/hr/employees?limit=200').then(r=>r.json()).then(d=>{ const arr = d?.employees || d?.data || (Array.isArray(d)?d:[]); setEmployees(arr); }).catch(()=>{});
    }, []);

    const buildTree = (parentId: number | null): any[] => {
        return employees.filter(e => (e.managerId||null) === parentId).map(e => ({ ...e, children: buildTree(e.id) }));
    };
    const tree = buildTree(null);
    const filtered = filter ? employees.filter(e => e.name?.includes(filter) || e.department?.includes(filter)) : [];

    const renderNode = (node: any, level: number) => (
        <div key={node.id} style={{ marginInlineStart: level * 32, marginBottom: 4 }}>
            <div style={{ display:'flex', alignItems:'center', gap:10, padding:'8px 14px', borderRadius:10, background: level===0?'#E3F2FD': level===1?'#F3E5F5':'#fff', border:'1px solid #e8e8e8', cursor:'pointer', transition:'all 0.2s' }}>
                <div style={{ width:36, height:36, borderRadius:'50%', background:'linear-gradient(135deg,#667eea,#764ba2)', display:'flex', alignItems:'center', justifyContent:'center', color:'#fff', fontWeight:700, fontSize:14 }}>
                    {(node.name||'?')[0]}
                </div>
                <div style={{ flex:1 }}>
                    <div style={{ fontWeight:600, fontSize:14 }}>{node.name || `Employee #${node.id}`}</div>
                    <div style={{ fontSize:11, color:'#888' }}>{node.jobTitle || node.position || '-'} | {node.department || '-'}</div>
                </div>
                {node.children?.length > 0 && <span style={{ fontSize:11, background:'#e0e0e0', padding:'2px 8px', borderRadius:8 }}>{node.children.length}</span>}
            </div>
            {node.children?.map((c: any) => renderNode(c, level + 1))}
        </div>
    );

    return (
        <div style={{ padding:24, direction:isAr?'rtl':'ltr' }}>
            <h1 style={{ fontSize:24, fontWeight:700, marginBottom:16 }}>{isAr?'🏢 الهيكل التنظيمي':'🏢 Organization Chart'}</h1>
            <input value={filter} onChange={e=>setFilter(e.target.value)} placeholder={isAr?'بحث بالاسم أو القسم...':'Search name or dept...'} style={{ width:'100%', maxWidth:400, padding:'10px 16px', borderRadius:10, border:'1px solid #ddd', marginBottom:20, fontSize:14 }} />
            {filter && filtered.length > 0 && (
                <div style={{ background:'#fff', borderRadius:12, padding:16, marginBottom:16, boxShadow:'0 2px 8px rgba(0,0,0,0.06)' }}>
                    <div style={{ fontSize:12, color:'#888', marginBottom:8 }}>{filtered.length} {isAr?'نتيجة':'results'}</div>
                    {filtered.slice(0,10).map(e => (
                        <div key={e.id} style={{ display:'flex', alignItems:'center', gap:8, padding:'6px 0', borderBottom:'1px solid #f5f5f5' }}>
                            <span style={{ fontWeight:600 }}>{e.name}</span>
                            <span style={{ fontSize:12, color:'#888' }}>{e.department || '-'}</span>
                        </div>
                    ))}
                </div>
            )}
            <div style={{ background:'#fff', borderRadius:12, padding:20, boxShadow:'0 2px 8px rgba(0,0,0,0.06)', minHeight:300 }}>
                {tree.length > 0 ? tree.map(n => renderNode(n, 0)) : (
                    <div style={{ textAlign:'center', color:'#ccc', padding:60 }}>
                        <div style={{ fontSize:48, marginBottom:8 }}>🏢</div>
                        <div>{isAr?'لا يوجد بيانات':'No data yet'}</div>
                    </div>
                )}
            </div>
        </div>
    );
}
