import React from 'react';
import { BookOpen, UserCheck, AlertOctagon } from 'lucide-react';
import { useTranslation } from "@/lib/i18n";

export default function TrainingComplianceDashboard() {
    const { lang } = useTranslation();
        const _t = (ar: string, en: string) => lang === 'ar' ? ar : en;
  const employees = [
    { id: 1, name: 'Ahmad M.', role: 'DevOps', status: 'Compliant', lastCompleted: '2026-01-15' },
    { id: 2, name: 'Sarah T.', role: 'HR Manager', status: 'Pending', lastCompleted: '2025-04-10' },
    { id: 3, name: 'Omar K.', role: 'Backend Dev', status: 'Compliant', lastCompleted: '2026-02-20' },
    { id: 4, name: 'Nour S.', role: 'Accountant', status: 'Overdue', lastCompleted: '2025-01-05' },
  ];

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-6">Security Awareness Training Compliance</h1>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <div className="bg-(--bg-secondary) border border-(--border) p-4 rounded-xl flex items-center gap-4">
          <div className="p-3 bg-blue-100 text-blue-600 rounded-lg"><BookOpen size={24} /></div>
          <div>
            <p className="text-sm text-(--text-muted)">Total Employees</p>
            <p className="text-2xl font-bold">142</p>
          </div>
        </div>
        <div className="bg-(--bg-secondary) border border-(--border) p-4 rounded-xl flex items-center gap-4">
          <div className="p-3 bg-green-100 text-green-600 rounded-lg"><UserCheck size={24} /></div>
          <div>
            <p className="text-sm text-(--text-muted)">Compliant (Last 12 Mo)</p>
            <p className="text-2xl font-bold">128</p>
          </div>
        </div>
        <div className="bg-(--bg-secondary) border border-(--border) p-4 rounded-xl flex items-center gap-4">
          <div className="p-3 bg-red-100 text-red-600 rounded-lg"><AlertOctagon size={24} /></div>
          <div>
            <p className="text-sm text-(--text-muted)">{_t('متأخر', 'Overdue')}</p>
            <p className="text-2xl font-bold">14</p>
          </div>
        </div>
      </div>

      <div className="bg-(--bg-primary) border border-(--border) rounded-xl overflow-hidden">
        <table className="w-full text-left" dir="ltr">
          <thead className="bg-(--bg-secondary) border-b border-(--border)">
            <tr>
              <th className="p-4 text-sm font-semibold">{_t('موظف', 'Employee')}</th>
              <th className="p-4 text-sm font-semibold">{_t('الدور', 'Role')}</th>
              <th className="p-4 text-sm font-semibold">{_t('الحالة', 'Status')}</th>
              <th className="p-4 text-sm font-semibold">{_t('أخير مكتمل', 'Last Completed')}</th>
              <th className="p-4 text-sm font-semibold">{_t('إجراء', 'Action')}</th>
            </tr>
          </thead>
          <tbody>
            {employees.map(emp => (
              <tr key={emp.id} className="border-b border-(--border) hover:bg-(--bg-secondary)">
                <td className="p-4 text-sm font-medium">{emp.name}</td>
                <td className="p-4 text-sm text-(--text-muted)">{emp.role}</td>
                <td className="p-4 text-sm">
                  <span className={`inline-flex px-2 py-0.5 rounded-full text-xs font-medium
                    ${emp.status === 'Compliant' ? 'bg-green-100 text-green-800' :
                      emp.status === 'Overdue' ? 'bg-red-100 text-red-800' :
                      'bg-yellow-100 text-yellow-800'
                    }`}>
                    {emp.status}
                  </span>
                </td>
                <td className="p-4 text-sm text-(--text-muted)">{emp.lastCompleted}</td>
                <td className="p-4 text-sm">
                  {emp.status !== 'Compliant' && (
                    <button className="text-blue-600 hover:underline">Send Reminder</button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
