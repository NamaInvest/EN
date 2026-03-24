'use client';

import { useState, useEffect } from 'react';

export default function StudentsPage() {
  const [students, setStudents] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/shl/students')
      .then(res => res.json())
      .then(data => {
        if (Array.isArray(data)) setStudents(data);
        setLoading(false);
      });
  }, []);

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">🏫 School - Students Directory</h1>
        <button className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-medium transition">
          + Enroll Student
        </button>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
        {loading ? (
          <div className="p-8 text-center text-slate-500">Loading students...</div>
        ) : students.length === 0 ? (
          <div className="p-8 text-center text-slate-500">No students found.</div>
        ) : (
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-slate-600">
                <th className="p-4 font-semibold">Student Code</th>
                <th className="p-4 font-semibold">Name</th>
                <th className="p-4 font-semibold">Guardian Info</th>
                <th className="p-4 font-semibold">Status</th>
              </tr>
            </thead>
            <tbody>
              {students.map(student => (
                <tr key={student.id} className="border-b border-slate-100 hover:bg-slate-50 transition">
                  <td className="p-4 font-mono text-slate-500">{student.studentCode}</td>
                  <td className="p-4 font-bold text-slate-700">{student.name}</td>
                  <td className="p-4 text-sm">
                    {student.guardianName} <br/><span className="text-slate-500">{student.guardianPhone}</span>
                  </td>
                  <td className="p-4">
                    <span className={`px-2 py-1 rounded text-xs font-semibold ${
                      student.status === 'ENROLLED' ? 'bg-green-100 text-green-700' : 'bg-slate-100 text-slate-700'
                    }`}>
                      {student.status}
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
