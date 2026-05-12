'use client';

import React, { useState } from 'react';

export default function VendorPortal({ vendorId, tenantId }: { vendorId: string; tenantId: string }) {
  const [activeTab, setActiveTab] = useState<'POS' | 'ASNS' | 'ONBOARDING'>('POS');

  return (
    <div className="p-6 bg-white rounded-lg shadow-sm">
      <h1 className="text-2xl font-bold mb-4">Vendor Portal</h1>
      <div className="flex border-b mb-4">
        <button 
          className={`py-2 px-4 ${activeTab === 'POS' ? 'border-b-2 border-blue-600 text-blue-600' : 'text-gray-500'}`}
          onClick={() => setActiveTab('POS')}
        >
          Purchase Orders
        </button>
        <button 
          className={`py-2 px-4 ${activeTab === 'ASNS' ? 'border-b-2 border-blue-600 text-blue-600' : 'text-gray-500'}`}
          onClick={() => setActiveTab('ASNS')}
        >
          Shipments (ASN)
        </button>
        <button 
          className={`py-2 px-4 ${activeTab === 'ONBOARDING' ? 'border-b-2 border-blue-600 text-blue-600' : 'text-gray-500'}`}
          onClick={() => setActiveTab('ONBOARDING')}
        >
          Onboarding
        </button>
      </div>

      <div className="mt-4">
        {activeTab === 'POS' && (
          <div>
            <h2 className="text-lg font-semibold mb-2">Pending Purchase Orders</h2>
            <p className="text-sm text-gray-500">Acknowledge POs and provide promised dates.</p>
            {/* Table placeholder */}
            <div className="mt-4 p-8 border border-dashed text-center text-gray-400 rounded">
              No pending POs found.
            </div>
          </div>
        )}

        {activeTab === 'ASNS' && (
          <div>
            <h2 className="text-lg font-semibold mb-2">Advance Ship Notices</h2>
            <button className="bg-blue-600 text-white px-4 py-2 rounded mb-4">Create New ASN</button>
            <div className="mt-4 p-8 border border-dashed text-center text-gray-400 rounded">
              No recent shipments.
            </div>
          </div>
        )}

        {activeTab === 'ONBOARDING' && (
          <div>
            <h2 className="text-lg font-semibold mb-2">Vendor Onboarding Profile</h2>
            <p className="text-sm text-gray-500 mb-4">Complete your profile to unlock full portal access.</p>
            <div className="space-y-3">
              <div className="flex justify-between items-center p-3 bg-gray-50 rounded">
                <span>Legal Information</span>
                <span className="text-green-600 text-sm font-semibold">Completed</span>
              </div>
              <div className="flex justify-between items-center p-3 bg-gray-50 rounded">
                <span>Banking Details</span>
                <span className="text-yellow-600 text-sm font-semibold">Pending Review</span>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
