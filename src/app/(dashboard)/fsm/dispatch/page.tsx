import { _t } from '@/lib/server-t';
'use client';
import React, { useEffect, useState } from 'react';
import { useTranslation } from '@/lib/i18n';
import { Card } from '@/components/ui/card';
import { Map, Calendar, Users } from 'lucide-react';

export default function DispatchBoardPage() {
  const { lang } = useTranslation();
  const _t = (ar: string, en: string) => lang === 'ar' ? ar : en;
    const [tickets, setTickets] = useState([]);

    useEffect(() => {
        fetch('/api/fsm/tickets')
            .then(res => res.json())
            .then(data => {
                if (data.success) setTickets(data.tickets);
            });
    }, []);

    const unassigned = tickets.filter((t: any) => !t.technicianId && t.status !== 'completed');
    const assigned = tickets.filter((t: any) => t.technicianId && t.status !== 'completed');

    return (
        <div className="max-w-7xl mx-auto space-y-6 p-6">
            <h1 className="text-3xl font-bold flex items-center gap-2"><Map />{_t('Dispatch Board', 'Dispatch Board')}</h1>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Unassigned Tickets */}
                <Card className="p-4 bg-gray-50 dark:bg-gray-800/30">
                    <h2 className="font-semibold text-lg mb-4 flex items-center gap-2 border-b pb-2">
                        <span className="w-3 h-3 bg-red-500 rounded-full"></span>
                        Unassigned ({unassigned.length})
                    </h2>
                    <div className="space-y-3 min-h-[300px]">
                        {unassigned.map((ticket: any) => (
                            <Card key={ticket.id} className="p-3 cursor-pointer hover:border-blue-500 transition-colors shadow-sm">
                                <div className="flex justify-between items-start mb-2">
                                    <span className="font-medium">#{ticket.ticketNo}</span>
                                    <span className="text-xs bg-red-100 text-red-700 px-2 py-0.5 rounded uppercase">{ticket.priority}</span>
                                </div>
                                <p className="text-sm text-gray-600 dark:text-gray-400 line-clamp-2">{ticket.description}</p>
                                <div className="mt-3 text-xs text-gray-500 flex items-center gap-1">
                                    <Calendar className="w-3 h-3" /> {new Date(ticket.createdAt).toLocaleDateString()}
                                </div>
                            </Card>
                        ))}
                    </div>
                </Card>

                {/* Assigned/In Progress */}
                <Card className="p-4 bg-blue-50/50 dark:bg-blue-900/10">
                    <h2 className="font-semibold text-lg mb-4 flex items-center gap-2 border-b pb-2">
                        <span className="w-3 h-3 bg-blue-500 rounded-full"></span>
                        Assigned ({assigned.length})
                    </h2>
                    <div className="space-y-3 min-h-[300px]">
                        {assigned.map((ticket: any) => (
                            <Card key={ticket.id} className="p-3 border-blue-200 dark:border-blue-800 shadow-sm">
                                <div className="flex justify-between items-start mb-2">
                                    <span className="font-medium">#{ticket.ticketNo}</span>
                                    <span className="text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded uppercase">{ticket.status}</span>
                                </div>
                                <p className="text-sm text-gray-600 dark:text-gray-400 line-clamp-2">{ticket.description}</p>
                                <div className="mt-3 pt-2 border-t flex justify-between items-center text-xs">
                                    <span className="flex items-center gap-1 text-gray-600"><Users className="w-3 h-3" /> Tech #{ticket.technicianId}</span>
                                </div>
                            </Card>
                        ))}
                    </div>
                </Card>
            </div>
        </div>
    );
}
