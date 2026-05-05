'use client';
import React, { useEffect, useState } from 'react';
import { Card } from '@/components/ui/card';
import { Activity, Wrench, CheckCircle, Clock } from 'lucide-react';

export default function FSMDashboardPage() {
    const [tickets, setTickets] = useState([]);

    useEffect(() => {
        fetch('/api/fsm/tickets')
            .then(res => res.json())
            .then(data => {
                if (data.success) setTickets(data.tickets);
            })
            .catch(err => console.error(err));
    }, []);

    const openCount = tickets.filter((t: any) => t.status === 'open').length;
    const completedCount = tickets.filter((t: any) => t.status === 'completed').length;

    return (
        <div className="max-w-7xl mx-auto space-y-6 p-6">
            <div className="flex justify-between items-center">
                <h1 className="text-3xl font-bold flex items-center gap-2"><Wrench /> Field Service Dashboard</h1>
                <a href="/fsm/dispatch" className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700">Dispatch Board</a>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <Card className="p-6 flex items-center gap-4">
                    <div className="w-12 h-12 bg-blue-100 text-blue-600 rounded-lg flex items-center justify-center">
                        <Activity className="w-6 h-6" />
                    </div>
                    <div>
                        <p className="text-sm text-gray-500">Total Tickets</p>
                        <h3 className="text-2xl font-bold">{tickets.length}</h3>
                    </div>
                </Card>
                <Card className="p-6 flex items-center gap-4">
                    <div className="w-12 h-12 bg-orange-100 text-orange-600 rounded-lg flex items-center justify-center">
                        <Clock className="w-6 h-6" />
                    </div>
                    <div>
                        <p className="text-sm text-gray-500">Open Tickets</p>
                        <h3 className="text-2xl font-bold">{openCount}</h3>
                    </div>
                </Card>
                <Card className="p-6 flex items-center gap-4">
                    <div className="w-12 h-12 bg-green-100 text-green-600 rounded-lg flex items-center justify-center">
                        <CheckCircle className="w-6 h-6" />
                    </div>
                    <div>
                        <p className="text-sm text-gray-500">Completed Tickets</p>
                        <h3 className="text-2xl font-bold">{completedCount}</h3>
                    </div>
                </Card>
            </div>

            <Card className="p-6">
                <h2 className="text-xl font-semibold mb-4">Recent Tickets</h2>
                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="border-b bg-gray-50 dark:bg-gray-800">
                                <th className="p-3">Ticket #</th>
                                <th className="p-3">Description</th>
                                <th className="p-3">Priority</th>
                                <th className="p-3">Status</th>
                                <th className="p-3">Technician</th>
                            </tr>
                        </thead>
                        <tbody>
                            {tickets.slice(0, 10).map((ticket: any) => (
                                <tr key={ticket.id} className="border-b hover:bg-gray-50 dark:hover:bg-gray-800/50">
                                    <td className="p-3 font-medium">#{ticket.ticketNo}</td>
                                    <td className="p-3 truncate max-w-xs">{ticket.description}</td>
                                    <td className="p-3">
                                        <span className={`px-2 py-1 rounded text-xs uppercase ${
                                            ticket.priority === 'high' || ticket.priority === 'urgent' ? 'bg-red-100 text-red-700' : 'bg-blue-100 text-blue-700'
                                        }`}>
                                            {ticket.priority}
                                        </span>
                                    </td>
                                    <td className="p-3">
                                        <span className={`px-2 py-1 rounded text-xs uppercase ${
                                            ticket.status === 'completed' ? 'bg-green-100 text-green-700' : 'bg-orange-100 text-orange-700'
                                        }`}>
                                            {ticket.status}
                                        </span>
                                    </td>
                                    <td className="p-3">{ticket.technicianId ? `Tech #${ticket.technicianId}` : 'Unassigned'}</td>
                                </tr>
                            ))}
                            {tickets.length === 0 && (
                                <tr><td colSpan={5} className="p-6 text-center text-gray-500">No tickets found</td></tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </Card>
        </div>
    );
}
