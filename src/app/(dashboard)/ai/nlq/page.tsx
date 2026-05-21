'use client';
import React, { useState } from 'react';
import { MessageSquare, Loader2 } from 'lucide-react';

export default function NLQPage() {
  const [query, setQuery] = useState('');
  const [result, setResult] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  const ask = async () => {
    if (!query) return;
    setLoading(true);
    try {
      const res = await fetch('/api/ai/nlq', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ question: query })
      });
      const d = await res.json();
      setResult(d);
    } catch (e) {
      setResult({ error: 'Failed to fetch' });
    }
    setLoading(false);
  };

  return (
    <div className="p-6 max-w-5xl mx-auto">
      <h1 className="text-2xl font-bold mb-4 flex items-center gap-2">
        <MessageSquare className="text-primary" /> AI Natural Language Query (NLQ)
      </h1>
      <div className="card p-6 border border-(--) bg-(--) mb-6 rounded-xl shadow-sm">
        <div className="flex gap-2">
          <input 
            type="text" 
            value={query} 
            onChange={e => setQuery(e.target.value)}
            placeholder="اسأل سؤالاً باللغة العربية عن بياناتك..."
            className="flex-1 p-3 border border-(--) rounded-lg bg-(--) text-(--) outline-none focus:ring-2 focus:ring-blue-500"
            onKeyDown={e => e.key === 'Enter' && ask()}
            dir="auto"
          />
          <button 
            onClick={ask} 
            disabled={loading}
            className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg disabled:opacity-50 transition-colors"
          >
            {loading ? <Loader2 className="animate-spin" size={20} /> : 'Ask AI'}
          </button>
        </div>
      </div>

      {result && (
        <div className="card p-6 border border-(--) bg-(--) rounded-xl shadow-sm">
          <h2 className="text-xl font-bold mb-4">Result</h2>
          <pre className="p-4 bg-gray-50 dark:bg-gray-900 border border-(--) rounded-lg overflow-auto text-sm" dir="ltr">
            {JSON.stringify(result, null, 2)}
          </pre>
        </div>
      )}
    </div>
  );
}
