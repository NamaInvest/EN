'use client';
import { useState } from 'react';

export default function StoriesPage() {
    return (
        <div className="p-6 max-w-7xl mx-auto">
            <div className="flex justify-between items-center mb-6">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">User Stories Backlog</h1>
                    <p className="text-gray-500">Manage, estimate, and assign user stories to sprints.</p>
                </div>
                <button className="bg-blue-600 text-white px-4 py-2 rounded-md font-medium hover:bg-blue-700">
                    + New Story
                </button>
            </div>

            <div className="bg-white shadow rounded-lg overflow-hidden border border-gray-200">
                <div className="p-4 border-b border-gray-200 bg-gray-50 flex gap-4">
                    <select className="border border-gray-300 rounded px-3 py-1.5 text-sm">
                        <option>All Modules</option>
                        <option>HR</option>
                        <option>Accounting</option>
                        <option>Sales</option>
                    </select>
                    <select className="border border-gray-300 rounded px-3 py-1.5 text-sm">
                        <option>All Statuses</option>
                        <option>BACKLOG</option>
                        <option>IN PROGRESS</option>
                        <option>DONE</option>
                    </select>
                </div>
                
                <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                        <tr>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">ID</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Action</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Points</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                        </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                        <tr>
                            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-blue-600">US-HR-12</td>
                            <td className="px-6 py-4 text-sm text-gray-900">Process leave request</td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">5</td>
                            <td className="px-6 py-4 whitespace-nowrap">
                                <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-yellow-100 text-yellow-800">
                                    BACKLOG
                                </span>
                            </td>
                        </tr>
                        <tr>
                            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-blue-600">US-ACC-05</td>
                            <td className="px-6 py-4 text-sm text-gray-900">Post balanced JE</td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">3</td>
                            <td className="px-6 py-4 whitespace-nowrap">
                                <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-green-100 text-green-800">
                                    DONE
                                </span>
                            </td>
                        </tr>
                    </tbody>
                </table>
            </div>
        </div>
    );
}
