'use client';
import React, { useEffect, useState } from 'react';
import { BarChart3, Loader2, AlertTriangle } from 'lucide-react';

export default function DemandForecastPage() {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/ai/demand-forecast?productId=1') // Example
      .then(res => res.json())
      .then(d => {
        setData(d);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-4 flex items-center gap-2">
        <BarChart3 className="text-primary" /> AI Demand Forecast
      </h1>
      
      {loading ? (
        <div className="flex justify-center p-12"><Loader2 className="animate-spin text-primary" size={48} /></div>
      ) : !data || data.error ? (
        <div className="card p-8 text-center text-red-500 border border-red-200 bg-red-50">
          <AlertTriangle className="mx-auto mb-4" size={48} />
          <p>Please select a product or check API connection.</p>
          <p className="text-sm opacity-80 mt-2">{data?.error || 'No data found'}</p>
        </div>
      ) : (
        <div className="card p-6 border border-(--) bg-(--) rounded-xl shadow-sm">
          <h2 className="text-xl mb-4">Forecast for: {data.product?.name || 'Product ' + data.product?.id}</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="p-4 bg-(--) rounded-lg border border-(--)">
              <div className="text-sm text-gray-500">Current Stock</div>
              <div className="text-2xl font-bold">{data.product?.currentStock || 0}</div>
            </div>
            <div className="p-4 bg-(--) rounded-lg border border-(--)">
              <div className="text-sm text-gray-500">Forecasted Demand ({data.forecast?.period})</div>
              <div className="text-2xl font-bold">{data.forecast?.forecastedDemand || 0}</div>
            </div>
            <div className="p-4 bg-(--) rounded-lg border border-(--)">
              <div className="text-sm text-gray-500">Trend</div>
              <div className="text-2xl font-bold">{data.forecast?.trendLabel || 'N/A'}</div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
