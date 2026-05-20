'use client';
import React, { useEffect, useState } from 'react';
import { LifeBuoy, Loader2, Headphones } from 'lucide-react';

export default function HelpDeskPage() {
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => setLoading(false), 800);
    return () => clearTimeout(timer);
  }, []);

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-6 flex items-center gap-2">
        <LifeBuoy className="text-primary" /> Help Desk Dashboard
      </h1>
      
      {loading ? (
        <div className="flex justify-center p-12"><Loader2 className="animate-spin text-primary" size={48} /></div>
      ) : (
        <div className="card p-8 text-center border border-(--border) bg-(--bg-secondary) rounded-xl shadow-sm">
          <Headphones className="mx-auto mb-4 text-gray-400" size={48} />
          <h2 className="text-lg font-bold mb-2">No Active Tickets</h2>
          <p className="text-(--text-muted)">There are no pending support tickets assigned to your queues.</p>
        </div>
      )}
    </div>
  );
}
