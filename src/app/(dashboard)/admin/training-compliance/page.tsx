import React from 'react';

export default function TrainingCompliancePage() {
    return (
        <div className="p-6 max-w-7xl mx-auto">
            <h1 className="text-2xl font-bold mb-6 text-gray-900">Training & Compliance Oversight</h1>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
                    <h3 className="text-sm font-medium text-gray-500">Overall Compliance Rate</h3>
                    <p className="text-3xl font-bold mt-2 text-green-600">92%</p>
                </div>
                <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
                    <h3 className="text-sm font-medium text-gray-500">Overdue Trainings</h3>
                    <p className="text-3xl font-bold mt-2 text-red-600">14 Users</p>
                </div>
                <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
                    <h3 className="text-sm font-medium text-gray-500">Certificates Issued (30 Days)</h3>
                    <p className="text-3xl font-bold mt-2 text-blue-600">45</p>
                </div>
            </div>

            <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                <div className="p-4 border-b border-gray-200 bg-gray-50 flex justify-between items-center">
                    <h2 className="text-lg font-semibold">Employees Overdue for Mandatory Training</h2>
                    <button className="text-sm bg-gray-200 hover:bg-gray-300 text-gray-800 px-3 py-1.5 rounded-md font-medium transition-colors">
                        Send Reminders to All
                    </button>
                </div>
                <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-white">
                        <tr>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Employee</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Role</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Missing Course</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Due Date</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Action</th>
                        </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                        <tr>
                            <td className="px-6 py-4 text-sm font-medium text-gray-900">Ahmed Al-Fahad</td>
                            <td className="px-6 py-4 text-sm text-gray-500">Cashier</td>
                            <td className="px-6 py-4 text-sm text-gray-900">PDPL Data Privacy</td>
                            <td className="px-6 py-4 text-sm text-red-600 font-medium">2 Days Ago</td>
                            <td className="px-6 py-4 text-sm text-teal-600 hover:text-teal-800 cursor-pointer font-medium">Remind</td>
                        </tr>
                    </tbody>
                </table>
            </div>
        </div>
    );
}
