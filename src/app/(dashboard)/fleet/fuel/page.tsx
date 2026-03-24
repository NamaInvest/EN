'use client';

import { useState, useEffect } from 'react';

export default function FleetFuelPage() {
  const [logs, setLogs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/fleet/fuel')
      .then(res => res.json())
      .then(data => {
        if (Array.isArray(data)) setLogs(data);
        setLoading(false);
      });
  }, []);

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">⛽ Fleet Management - Fuel Logs</h1>
        <button className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-medium transition">
          + Record Fuel Purchase
        </button>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
        {loading ? (
          <div className="p-8 text-center text-slate-500">Loading fuel logs...</div>
        ) : logs.length === 0 ? (
          <div className="p-8 text-center text-slate-500">No fuel records found.</div>
        ) : (
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-slate-600">
                <th className="p-4 font-semibold">Date</th>
                <th className="p-4 font-semibold">Vehicle</th>
                <th className="p-4 font-semibold">Driver</th>
                <th className="p-4 font-semibold">Amount (Liters)</th>
                <th className="p-4 font-semibold">Total Cost</th>
                <th className="p-4 font-semibold">Odometer</th>
              </tr>
            </thead>
            <tbody>
              {logs.map(log => (
                <tr key={log.id} className="border-b border-slate-100 hover:bg-slate-50 transition">
                  <td className="p-4 text-slate-600">{new Date(log.date).toLocaleDateString()}</td>
                  <td className="p-4 font-bold text-slate-700">{log.vehicle?.plateNumber} <br/><span className="text-xs font-normal text-slate-500">{log.vehicle?.make}</span></td>
                  <td className="p-4">{log.driver?.name || 'Unknown'}</td>
                  <td className="p-4 font-medium text-amber-600">{log.liters.toFixed(2)} L</td>
                  <td className="p-4 font-medium text-slate-700">SAR {log.cost.toLocaleString()}</td>
                  <td className="p-4 font-mono text-slate-500">{log.odometerReading.toLocaleString()} km</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
