'use client';

import { useState, useEffect } from 'react';

export default function FleetTripsPage() {
  const [trips, setTrips] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/fleet/trips')
      .then(res => res.json())
      .then(data => {
        if (Array.isArray(data)) setTrips(data);
        setLoading(false);
      });
  }, []);

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">🚚 Fleet Management - Trips</h1>
        <button className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-medium transition">
          + Log New Trip
        </button>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
        {loading ? (
          <div className="p-8 text-center text-slate-500">Loading fleet trips...</div>
        ) : trips.length === 0 ? (
          <div className="p-8 text-center text-slate-500">No trips logged yet.</div>
        ) : (
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-slate-600">
                <th className="p-4 font-semibold">Vehicle</th>
                <th className="p-4 font-semibold">Driver</th>
                <th className="p-4 font-semibold">Route</th>
                <th className="p-4 font-semibold">Departure</th>
                <th className="p-4 font-semibold">Status</th>
              </tr>
            </thead>
            <tbody>
              {trips.map(trip => (
                <tr key={trip.id} className="border-b border-slate-100 hover:bg-slate-50 transition">
                  <td className="p-4 font-bold text-slate-700">
                    {trip.vehicle?.plateNumber || 'Unknown'} <br/>
                    <span className="text-xs font-normal text-slate-500">{trip.vehicle?.make} {trip.vehicle?.model}</span>
                  </td>
                  <td className="p-4">{trip.driver?.name || 'Unknown'}</td>
                  <td className="p-4 text-sm">
                    <span className="text-blue-600">{trip.startLocation}</span> ➔ <span className="text-emerald-600">{trip.endLocation}</span>
                  </td>
                  <td className="p-4 text-sm text-slate-500">
                    {new Date(trip.departureTime).toLocaleString()}
                  </td>
                  <td className="p-4">
                    <span className={`px-2 py-1 rounded text-xs font-semibold ${
                      trip.status === 'COMPLETED' ? 'bg-green-100 text-green-700' :
                      trip.status === 'IN_PROGRESS' ? 'bg-amber-100 text-amber-700' : 'bg-slate-100 text-slate-700'
                    }`}>
                      {trip.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
