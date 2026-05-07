'use client';
import React from 'react';
import { useTranslation } from '@/lib/i18n';
import { Card } from '@/components/ui/card';
import { Globe, Users, FileSignature } from 'lucide-react';

export default function VendorPortalDashboard() {
  const { lang } = useTranslation();
  const _t = (ar: string, en: string) => lang === 'ar' ? ar : en;
    return (
        <div className="max-w-7xl mx-auto space-y-6 p-6">
            <h1 className="text-3xl font-bold flex items-center gap-2">
                <Globe className="w-8 h-8 text-green-600" />
                Vendor Portal & Sourcing
            </h1>
            <p className="text-gray-500">Manage external vendor access, RFQ bidding, and supplier onboarding.</p>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <Card className="p-6">
                    <h2 className="text-xl font-semibold mb-2 flex items-center gap-2"><Users className="text-blue-500"/> Registered Vendors</h2>
                    <p className="text-3xl font-bold">0</p>
                    <p className="text-sm text-gray-500 mt-2">Active vendors with portal access.</p>
                </Card>
                <Card className="p-6">
                    <h2 className="text-xl font-semibold mb-2 flex items-center gap-2"><FileSignature className="text-orange-500"/> Open RFQs</h2>
                    <p className="text-3xl font-bold">0</p>
                    <p className="text-sm text-gray-500 mt-2">RFQs currently open for bidding.</p>
                </Card>
                <Card className="p-6">
                    <h2 className="text-xl font-semibold mb-2 flex items-center gap-2"><Globe className="text-green-500"/> Active Bids</h2>
                    <p className="text-3xl font-bold">0</p>
                    <p className="text-sm text-gray-500 mt-2">Bids submitted by vendors.</p>
                </Card>
            </div>
            
            <Card className="p-12 text-center text-gray-500 border-dashed">
                <Globe className="w-12 h-12 mx-auto text-gray-300 mb-3" />
                <h3 className="text-lg font-medium">Vendor Portal Initialized</h3>
                <p>The sourcing schemas are ready. Invite vendors to start receiving bids.</p>
            </Card>
        </div>
    );
}
