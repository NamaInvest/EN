'use client';

import { useState, useEffect } from 'react';

export default function AcademicClassesPage() {
  const [classes, setClasses] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/shl/classes')
      .then(res => res.json())
      .then(data => {
        if (Array.isArray(data)) setClasses(data);
        setLoading(false);
      });
  }, []);

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">🏫 School - Academic Classes</h1>
        <button className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-medium transition">
          + Create Class Group
        </button>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
        {loading ? (
          <div className="p-8 text-center text-slate-500">Loading academic classes...</div>
        ) : classes.length === 0 ? (
          <div className="p-8 text-center text-slate-500">No classes found.</div>
        ) : (
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-slate-600">
                <th className="p-4 font-semibold">Class Name</th>
                <th className="p-4 font-semibold">Grade Level</th>
                <th className="p-4 font-semibold">Teacher</th>
                <th className="p-4 font-semibold">Students Enrolled</th>
              </tr>
            </thead>
            <tbody>
              {classes.map(cls => (
                <tr key={cls.id} className="border-b border-slate-100 hover:bg-slate-50 transition">
                  <td className="p-4 font-bold text-slate-700">{cls.className} <br/><span className="text-xs font-normal text-slate-400">AY {cls.academicYear}</span></td>
                  <td className="p-4 font-medium text-indigo-600">{cls.gradeLevel}</td>
                  <td className="p-4">{cls.teacher?.name || 'Unassigned'}</td>
                  <td className="p-4 font-medium text-slate-600">
                    {cls.enrollments?.length || 0} / {cls.capacity} Enrolled
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
