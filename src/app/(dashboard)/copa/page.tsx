'use client';
import React, { useState, useEffect } from 'react';
import { Search, ServerCrash, Loader2, DatabaseBackup } from 'lucide-react';
import { useTranslation } from "@/lib/i18n";

export default function GenericModulePage() {
 const { t } = useTranslation();
 const [data, setData] = useState<any[]>([]);
 const [loading, setLoading] = useState(true);
 const [error, setError] = useState<string | null>(null);
 const [searchQuery, setSearchQuery] = useState('');

 useEffect(() => {
   const fetchData = async () => {
     try {
       setLoading(true);
       const res = await fetch('/api/copa');
       if (!res.ok) throw new Error('فشل جلب البيانات');
       const json = await res.json();
       setData(Array.isArray(json) ? json : json.data || Object.values(json).find(Array.isArray) || [json]);
     } catch (err: any) {
       setError(err.message);
     } finally {
       setLoading(false);
     }
   };
   fetchData();
 }, []);

 const filteredData = data.filter(item => 
   !searchQuery || JSON.stringify(item).toLowerCase().includes(searchQuery.toLowerCase())
 );

 return (
   <div className="page-content" style={{ padding: '2rem', maxWidth: '1200px', margin: '0 auto', direction: 'rtl' }}>
     <h1 style={{ marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
       <DatabaseBackup size={24} color="var(--primary)" /> تحليل الربحية COPA
     </h1>

     <div className="card" style={{ marginBottom: '2rem' }}>
       <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
         <Search size={20} color="var(--text-muted)" />
         <input 
           type="text" 
           className="input" 
           style={{ flex: 1 }} 
           placeholder="بحث في جميع الحقول..." 
           value={searchQuery}
           onChange={e => setSearchQuery(e.target.value)}
         />
       </div>
     </div>

     {loading ? (
       <div style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-muted)' }}>
         <Loader2 className="animate-spin" size={32} style={{ margin: '0 auto 1rem' }} />
         جاري التحميل...
       </div>
     ) : error ? (
       <div className="card" style={{ textAlign: 'center', padding: '3rem', color: '#ef4444' }}>
         <ServerCrash size={48} opacity={0.5} style={{ marginBottom: '1rem' }} />
         <p>حدث خطأ أثناء الاتصال بالخادم</p>
         <p style={{ fontSize: '0.85rem', opacity: 0.8 }}>{error}</p>
       </div>
     ) : filteredData.length === 0 ? (
       <div className="card" style={{ textAlign: 'center', padding: '4rem', color: 'var(--text-muted)' }}>
         <DatabaseBackup size={48} opacity={0.2} style={{ marginBottom: '1rem' }} />
         <p>لا يوجد بيانات لعرضها</p>
       </div>
     ) : (
       <div className="card" style={{ overflowX: 'auto' }}>
         <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'right' }}>
           <thead>
             <tr style={{ borderBottom: '2px solid var(--border)' }}>
               {Object.keys(filteredData[0] || {}).slice(0, 6).map(key => (
                 <th key={key} style={{ padding: '1rem', color: 'var(--text-muted)' }}>{key}</th>
               ))}
             </tr>
           </thead>
           <tbody>
             {filteredData.map((row, idx) => (
               <tr key={row.id || idx} style={{ borderBottom: '1px solid var(--border)' }}>
                 {Object.keys(filteredData[0] || {}).slice(0, 6).map(key => (
                   <td key={key} style={{ padding: '1rem' }}>
                     {typeof row[key] === 'object' ? JSON.stringify(row[key]) : String(row[key])}
                   </td>
                 ))}
               </tr>
             ))}
           </tbody>
         </table>
       </div>
     )}
   </div>
 );
}
