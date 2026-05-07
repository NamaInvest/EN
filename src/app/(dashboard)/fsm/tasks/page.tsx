'use client';
import React, { useEffect, useState } from 'react';
import { useTranslation } from '@/lib/i18n';
import { Card } from '@/components/ui/card';
import { CheckCircle, Navigation, Clock, Box } from 'lucide-react';

export default function TechnicianPortalPage() {
  const { lang } = useTranslation();
  const _t = (ar: string, en: string) => lang === 'ar' ? ar : en;
    const [tickets, setTickets] = useState([]);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        fetch('/api/fsm/tickets')
            .then(res => res.json())
            .then(data => {
                if (data.success) {
                    // For demo: filter open tickets assigned to any technician or no one
                    setTickets(data.tickets.filter((t: any) => t.status !== 'completed'));
                }
            });
    }, []);

    const completeTicket = async (ticketId: number) => {
        setLoading(true);
        try {
            const res = await fetch('/api/fsm/complete', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ ticketId, parts: [] })
            });
            const data = await res.json();
            if (data.success) {
                setTickets(tickets.filter((t: any) => t.id !== ticketId));
                alert('Ticket completed successfully!');
            }
        } catch (e) {
            console.error(e);
        }
        setLoading(false);
    };

    return (
        <div className="max-w-3xl mx-auto space-y-4 p-4 pb-20">
            <h1 className="text-2xl font-bold mb-6 border-b pb-4">My Tasks (Mobile View)</h1>

            {tickets.map((ticket: any) => (
                <Card key={ticket.id} className="p-4 border-l-4 border-l-blue-500 shadow-sm relative overflow-hidden">
                    <div className="flex justify-between items-start mb-2">
                        <div>
                            <span className="text-xs font-bold text-gray-400 block mb-1">TICKET</span>
                            <span className="font-bold text-lg">#{ticket.ticketNo}</span>
                        </div>
                        <span className="bg-orange-100 text-orange-700 text-xs px-2 py-1 rounded font-medium uppercase">
                            {ticket.priority}
                        </span>
                    </div>
                    
                    <p className="text-gray-700 dark:text-gray-300 my-3 text-sm">{ticket.description}</p>
                    
                    <div className="flex items-center gap-4 text-xs text-gray-500 mb-4 bg-gray-50 dark:bg-gray-800/50 p-2 rounded">
                        <div className="flex items-center gap-1"><Clock className="w-3 h-3"/> Today</div>
                        <div className="flex items-center gap-1 text-blue-600"><Navigation className="w-3 h-3"/> Navigate</div>
                    </div>

                    <div className="flex gap-2">
                        <button className="flex-1 bg-gray-100 hover:bg-gray-200 text-gray-800 py-2 rounded-md text-sm font-medium flex justify-center items-center gap-2 transition-colors">
                            <Box className="w-4 h-4" /> Add Parts
                        </button>
                        <button 
                            disabled={loading}
                            onClick={() => completeTicket(ticket.id)}
                            className="flex-1 bg-green-600 hover:bg-green-700 text-white py-2 rounded-md text-sm font-medium flex justify-center items-center gap-2 transition-colors">
                            <CheckCircle className="w-4 h-4" /> Complete
                        </button>
                    </div>
                </Card>
            ))}

            {tickets.length === 0 && (
                <div className="text-center p-12 text-gray-500">
                    <CheckCircle className="w-12 h-12 mx-auto text-green-300 mb-3" />
                    <p>You have no active tasks. Good job!</p>
                </div>
            )}
        </div>
    );
}
