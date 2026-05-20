'use client';
import React, { useEffect, useState } from 'react';
import { FileSignature, Loader2, AlertTriangle, Calendar } from 'lucide-react';

export default function SupplierContractsPage() {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/procurement/supplier-contracts?expiringSoon=true')
      .then(res => res.json())
      .then(d => {
        setData(d);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-6 flex items-center gap-2">
        <FileSignature className="text-primary" /> Supplier Contracts (Expiring Soon)
      </h1>
      
      {loading ? (
        <div className="flex justify-center p-12"><Loader2 className="animate-spin text-primary" size={48} /></div>
      ) : !data || data.error ? (
        <div className="card p-8 text-center text-red-500 border border-red-200 bg-red-50 rounded-xl shadow-sm">
          <AlertTriangle className="mx-auto mb-4" size={48} />
          <p>Failed to load contracts data or schema is syncing.</p>
        </div>
      ) : data.contracts?.length === 0 ? (
        <div className="card p-8 text-center border border-[var(--border)] bg-[var(--bg-secondary)] rounded-xl shadow-sm">
          <Calendar className="mx-auto mb-4 text-gray-400" size={48} />
          <p className="text-[var(--text-muted)]">No active contracts expiring soon.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {data.contracts?.map((c: any, i: number) => (
            <div key={i} className="card p-5 border border-[var(--border)] bg-[var(--bg-secondary)] rounded-xl shadow-sm">
              <h3 className="text-lg font-bold mb-2">{c.title || c.contractNo}</h3>
              <div className="text-sm text-[var(--text-muted)] mb-4">{c.supplier?.name || 'Unknown Supplier'}</div>
              <div className="flex justify-between items-center text-sm">
                <span className="bg-orange-100 text-orange-800 px-2 py-1 rounded font-medium">
                  {c.daysRemaining} days left
                </span>
                <span className="font-mono" dir="ltr">{new Date(c.endDate).toLocaleDateString()}</span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
