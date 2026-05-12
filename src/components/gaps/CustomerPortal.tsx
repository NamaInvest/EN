'use client';

import React, { useState } from 'react';

export default function CustomerPortal({ customerId, tenantId }: { customerId: string; tenantId: string }) {
  const [activeTab, setActiveTab] = useState<'INVOICES' | 'DISPUTES' | 'PAYMENT_METHODS'>('INVOICES');

  return (
    <div className="p-6 bg-white rounded-lg shadow-sm">
      <h1 className="text-2xl font-bold mb-4">Customer Portal</h1>
      <div className="flex border-b mb-4">
        <button 
          className={`py-2 px-4 ${activeTab === 'INVOICES' ? 'border-b-2 border-blue-600 text-blue-600' : 'text-gray-500'}`}
          onClick={() => setActiveTab('INVOICES')}
        >
          My Invoices
        </button>
        <button 
          className={`py-2 px-4 ${activeTab === 'DISPUTES' ? 'border-b-2 border-blue-600 text-blue-600' : 'text-gray-500'}`}
          onClick={() => setActiveTab('DISPUTES')}
        >
          Disputes
        </button>
        <button 
          className={`py-2 px-4 ${activeTab === 'PAYMENT_METHODS' ? 'border-b-2 border-blue-600 text-blue-600' : 'text-gray-500'}`}
          onClick={() => setActiveTab('PAYMENT_METHODS')}
        >
          Payment Methods
        </button>
      </div>

      <div className="mt-4">
        {activeTab === 'INVOICES' && (
          <div>
            <h2 className="text-lg font-semibold mb-2">Recent Invoices</h2>
            <div className="flex gap-4 mb-4">
              <div className="p-4 bg-red-50 text-red-700 rounded w-1/3">
                <div className="text-sm">Unpaid Balance</div>
                <div className="text-2xl font-bold">SAR 0.00</div>
              </div>
            </div>
            <div className="mt-4 p-8 border border-dashed text-center text-gray-400 rounded">
              All invoices are paid.
            </div>
          </div>
        )}

        {activeTab === 'DISPUTES' && (
          <div>
            <h2 className="text-lg font-semibold mb-2">Open Disputes</h2>
            <button className="bg-blue-600 text-white px-4 py-2 rounded mb-4">Raise New Dispute</button>
            <div className="mt-4 p-8 border border-dashed text-center text-gray-400 rounded">
              No active disputes found.
            </div>
          </div>
        )}

        {activeTab === 'PAYMENT_METHODS' && (
          <div>
            <h2 className="text-lg font-semibold mb-2">Saved Payment Methods</h2>
            <p className="text-sm text-gray-500 mb-4">Manage your cards and digital wallets securely.</p>
            <button className="bg-blue-600 text-white px-4 py-2 rounded mb-4">Add New Card</button>
            <div className="mt-4 p-8 border border-dashed text-center text-gray-400 rounded">
              No saved payment methods.
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
