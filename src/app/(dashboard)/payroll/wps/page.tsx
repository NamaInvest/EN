'use client';

import React, { useState, useEffect } from 'react';
import { useTranslation } from '@/lib/i18n';
import { useToast } from '@/components/Toast';

export default function WPSPage() {
    const { lang } = useTranslation();
    const { success, info, error } = useToast();
    const _t = (ar: string, en: string) => lang === 'ar' ? ar : en;

    const [batches, setBatches] = useState<any[]>([]);
    const [loading, setLoading] = useState(false);
    
    // Form state
    const [payrollRunId, setPayrollRunId] = useState('');
    const [bankCode, setBankCode] = useState('SAR');
    const [companyId, setCompanyId] = useState('1');

    useEffect(() => {
        fetchHistory();
    }, []);

    const fetchHistory = async () => {
        try {
            const res = await fetch('/api/payroll/wps/history');
            if (res.ok) {
                const data = await res.json();
                setBatches(data);
            }
        } catch (error) {
            console.error(error);
        }
    };

    const handleGenerate = async () => {
        if (!payrollRunId || !bankCode || !companyId) {
            alert('Please fill in all fields');
            return;
        }

        setLoading(true);
        try {
            const res = await fetch('/api/payroll/wps/generate', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ 
                    payrollRunId: parseInt(payrollRunId), 
                    bankCode, 
                    companyId: parseInt(companyId) 
                }),
            });

            const data = await res.json();
            
            if (!res.ok) throw new Error(data.error || 'Failed to generate SIF');

            alert('WPS Batch Generated successfully');
            fetchHistory(); // Refresh history
        } catch (error: any) {
            alert(error.message);
        } finally {
            setLoading(false);
        }
    };

    const handleDownload = (batchId: number, fileName: string) => {
        window.open(`/api/payroll/wps/${batchId}/download`, '_blank');
    };

    const handleMarkUploaded = async (batchId: number) => {
        try {
            const res = await fetch(`/api/payroll/wps/${batchId}/mark-uploaded`, {
                method: 'POST'
            });
            if (!res.ok) throw new Error('Failed to update status');
            alert('Marked as uploaded');
            fetchHistory();
        } catch (error: any) {
            alert(error.message);
        }
    };

    return (
        <div className="page-content animate-fade-in" style={{ padding: '24px' }}>
            <div className="page-header">
                <h1 className="page-title">Wage Protection System (WPS)</h1>
                <p style={{ color: 'var(--text-muted)' }}>Generate and manage SAMA compliant SIF files for salary transfer.</p>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'minmax(300px, 1fr) 2fr', gap: '24px', marginTop: '24px' }}>
                {/* Generator Form */}
                <div className="card">
                    <h3 style={{ marginBottom: '16px', fontSize: '16px', fontWeight: 'bold' }}>Generate New SIF</h3>
                    
                    <div style={{ marginBottom: '12px' }}>
                        <label style={{ display: 'block', fontSize: '13px', marginBottom: '6px' }}>Payroll Run ID</label>
                        <input 
                            type="number" 
                            placeholder="e.g. 1" 
                            value={payrollRunId}
                            onChange={(e) => setPayrollRunId(e.target.value)}
                            style={{ width: '100%', padding: '8px 12px', borderRadius: '6px', border: '1px solid var(--border)' }}
                        />
                    </div>
                    <div style={{ marginBottom: '12px' }}>
                        <label style={{ display: 'block', fontSize: '13px', marginBottom: '6px' }}>Company ID</label>
                        <input 
                            type="number" 
                            placeholder="e.g. 1" 
                            value={companyId}
                            onChange={(e) => setCompanyId(e.target.value)}
                            style={{ width: '100%', padding: '8px 12px', borderRadius: '6px', border: '1px solid var(--border)' }}
                        />
                    </div>
                    <div style={{ marginBottom: '16px' }}>
                        <label style={{ display: 'block', fontSize: '13px', marginBottom: '6px' }}>Bank Code (SAMA)</label>
                        <select 
                            value={bankCode}
                            onChange={(e) => setBankCode(e.target.value)}
                            style={{ width: '100%', padding: '8px 12px', borderRadius: '6px', border: '1px solid var(--border)' }}
                        >
                            <option value="SAR">Saudi Awwal Bank (SABB/Alawwal)</option>
                            <option value="NCB">Saudi National Bank (SNB/NCB)</option>
                            <option value="RJHI">Al Rajhi Bank</option>
                            <option value="RIAD">Riyad Bank</option>
                            <option value="ALIN">Alinma Bank</option>
                            <option value="ARB">Arab National Bank (ANB)</option>
                        </select>
                    </div>
                    
                    <button 
                        className="btn btn-primary"
                        style={{ width: '100%', padding: '10px' }}
                        onClick={handleGenerate} 
                        disabled={loading}
                    >
                        {loading ? 'Generating...' : 'Generate WPS File'}
                    </button>
                </div>

                {/* History Table */}
                <div className="card">
                    <h3 style={{ marginBottom: '16px', fontSize: '16px', fontWeight: 'bold' }}>Generated Batches History</h3>
                    
                    {batches.length === 0 ? (
                        <div className="empty-state">
                            <div className="empty-state-text">No WPS batches generated yet.</div>
                        </div>
                    ) : (
                        <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                            <thead>
                                <tr style={{ background: 'rgba(0,0,0,0.03)' }}>
                                    <th style={{ padding: '10px' }}>Batch Number</th>
                                    <th style={{ padding: '10px' }}>Bank</th>
                                    <th style={{ padding: '10px' }}>Employees</th>
                                    <th style={{ padding: '10px' }}>Total Amount</th>
                                    <th style={{ padding: '10px' }}>Status</th>
                                    <th style={{ padding: '10px', textAlign: 'right' }}>Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {batches.map((batch) => (
                                    <tr key={batch.id} style={{ borderBottom: '1px solid var(--border)' }}>
                                        <td style={{ padding: '10px', fontFamily: 'monospace' }}>{batch.batchNumber}</td>
                                        <td style={{ padding: '10px' }}>{batch.bankCode}</td>
                                        <td style={{ padding: '10px' }}>{batch.totalEmployees}</td>
                                        <td style={{ padding: '10px', fontFamily: 'monospace' }}>
                                            {parseFloat(batch.totalAmount).toLocaleString('en-SA', { style: 'currency', currency: 'SAR' })}
                                        </td>
                                        <td style={{ padding: '10px' }}>
                                            <span style={{ 
                                                padding: '4px 8px', borderRadius: '4px', fontSize: '11px',
                                                background: batch.status === 'UPLOADED' ? '#22c55e20' : '#f59e0b20',
                                                color: batch.status === 'UPLOADED' ? '#22c55e' : '#f59e0b'
                                            }}>
                                                {batch.status}
                                            </span>
                                        </td>
                                        <td style={{ padding: '10px', textAlign: 'right' }}>
                                            <button 
                                                className="btn btn-sm"
                                                style={{ marginRight: '8px' }}
                                                title="Download SIF"
                                                onClick={() => handleDownload(batch.id, `WPS_${batch.batchNumber}.txt`)}
                                            >
                                                Download
                                            </button>
                                            {batch.status === 'GENERATED' && (
                                                <button 
                                                    className="btn btn-primary btn-sm"
                                                    title="Mark as Uploaded to Bank"
                                                    onClick={() => handleMarkUploaded(batch.id)}
                                                >
                                                    Mark Uploaded
                                                </button>
                                            )}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    )}
                </div>
            </div>
        </div>
    );
}
