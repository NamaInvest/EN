import React from 'react';
import { Card } from '@/components/ui/card';
import { Handshake, Search } from 'lucide-react';

export default function DunningPromisesPage() {
    return (
        <div className="max-w-7xl mx-auto space-y-6 p-6">
            <h1 className="text-3xl font-bold flex items-center gap-2"><Handshake /> Promise to Pay</h1>
            <Card className="p-12 text-center text-gray-500">
                <Search className="w-12 h-12 mx-auto text-gray-300 mb-3" />
                <h3 className="text-lg font-medium text-gray-900">No active promises</h3>
                <p>Track customer payment commitments here.</p>
            </Card>
        </div>
    );
}
