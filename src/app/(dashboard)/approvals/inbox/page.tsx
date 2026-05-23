'use client';

import React, { useState, useEffect } from 'react';
import { useTranslation } from '@/lib/i18n';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { useToast } from '@/components/Toast';

export default function ApprovalInboxPage() {
  const { success: toastSuccess, error: toastError, warning: toastWarning } = useToast();
  const { lang } = useTranslation();
  const _t = (ar: string, en: string) => lang === 'ar' ? ar : en;
    const [requests, setRequests] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [selectedRequest, setSelectedRequest] = useState<any>(null);
    const [actionType, setActionType] = useState<'approve' | 'reject' | 'delegate' | null>(null);
    const [notes, setNotes] = useState('');
    const [rejectReason, setRejectReason] = useState('insufficient docs');

    useEffect(() => {
        fetchRequests();
    }, []);

    const fetchRequests = async () => {
        try {
            const res = await fetch('/api/approvals/inbox?status=pending');
            const data = await res.json();
            setRequests(data);
        } catch (error) {
            console.error('Error fetching approvals', error);
        } finally {
            setLoading(false);
        }
    };

    const handleAction = async () => {
        if (!selectedRequest || !actionType) return;
        
        try {
            const endpoint = `/api/approvals/${selectedRequest.id}/${actionType}`;
            const res = await fetch(endpoint, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ notes, reason: rejectReason })
            });
            
            if (res.ok) {
                setActionType(null);
                setSelectedRequest(null);
                setNotes('');
                fetchRequests(); // Refresh inbox
            } else {
                toastWarning('Action failed');
            }
        } catch (error) {
            console.error('Action error', error);
        }
    };

    return (
        <div className="p-6 space-y-6">
            <h1 className="text-3xl font-bold tracking-tight">{_t('البريد الوارد للموافقة', 'Approval Inbox')}</h1>
            
            <Card>
                <CardHeader>
                    <CardTitle>{_t('بانتظار الموافقة', 'Pending Approvals')}</CardTitle>
                </CardHeader>
                <CardContent>
                    {loading ? <p>{_t('جاري التحميل...', 'Loading...')}</p> : (
                        <div className="overflow-x-auto">
                            <table className="w-full text-sm text-left">
                                <thead className="text-xs text-gray-700 uppercase bg-gray-50 dark:bg-gray-700 dark:text-gray-400">
                                    <tr>
                                        <th className="px-4 py-3">{_t('نوع المستند', 'Document Type')}</th>
                                        <th className="px-4 py-3">{_t('معرف المستند', 'Document ID')}</th>
                                        <th className="px-4 py-3">{_t('مقدم بواسطة', 'Submitted By')}</th>
                                        <th className="px-4 py-3">{_t('التاريخ', 'Date')}</th>
                                        <th className="px-4 py-3">{_t('الحالة', 'Status')}</th>
                                        <th className="px-4 py-3 text-right">{_t('إجراءات', 'Actions')}</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {requests.map(req => (
                                        <tr key={req.id} className="border-b dark:border-gray-700 hover:bg-gray-100 dark:hover:bg-gray-800">
                                            <td className="px-4 py-3 font-medium">{req.documentType}</td>
                                            <td className="px-4 py-3">#{req.documentId}</td>
                                            <td className="px-4 py-3">{req.requester?.fullName || 'Unknown'}</td>
                                            <td className="px-4 py-3">{new Date(req.requestedAt).toLocaleDateString()}</td>
                                            <td className="px-4 py-3">
                                                <Badge variant="outline" className="bg-yellow-100 text-yellow-800">{req.status}</Badge>
                                            </td>
                                            <td className="px-4 py-3 text-right space-x-2">
                                                <Button size="sm" variant="outline" className="border-green-500 text-green-600 hover:bg-green-50" onClick={() => { setSelectedRequest(req); setActionType('approve'); }}>{_t('يعتمد', 'Approve')}</Button>
                                                <Button size="sm" variant="outline" className="border-red-500 text-red-600 hover:bg-red-50" onClick={() => { setSelectedRequest(req); setActionType('reject'); }}>{_t('يرفض', 'Reject')}</Button>
                                            </td>
                                        </tr>
                                    ))}
                                    {requests.length === 0 && (
                                        <tr><td colSpan={6} className="text-center py-6 text-gray-500">No pending approvals! You are all caught up.</td></tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                    )}
                </CardContent>
            </Card>

            {/* Action Modal (Simplified inline for demo) */}
            {actionType && selectedRequest && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
                    <Card className="w-[400px]">
                        <CardHeader>
                            <CardTitle className="capitalize">{actionType} {_t('طلب #', 'Request #')}{selectedRequest.id}</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            {actionType === 'reject' && (
                                <div>
                                    <label className="text-sm font-medium">{_t('سبب', 'Reason')}</label>
                                    <select 
                                        className="w-full mt-1 border rounded p-2 text-sm"
                                        value={rejectReason}
                                        onChange={e => setRejectReason(e.target.value)}
                                    >
                                        <option value="insufficient docs">{_t('المستندات غير كافية', 'Insufficient Docs')}</option>
                                        <option value="over budget">{_t('أكثر من الميزانية', 'Over Budget')}</option>
                                        <option value="unauthorized">{_t('غير مصرح به', 'Unauthorized')}</option>
                                        <option value="other">{_t('أخرى', 'Other')}</option>
                                    </select>
                                </div>
                            )}
                            <div>
                                <label className="text-sm font-medium">{_t('التعليقات (اختياري)', 'Comments (Optional)')}</label>
                                <textarea 
                                    className="w-full mt-1 border rounded p-2 text-sm" 
                                    rows={3} 
                                    value={notes}
                                    onChange={e => setNotes(e.target.value)}
                                    placeholder="Add your notes here..."
                                />
                            </div>
                            <div className="flex justify-end space-x-2 pt-4">
                                <Button variant="outline" onClick={() => setActionType(null)}>{_t('إلغاء', 'Cancel')}</Button>
                                <Button 
                                    variant="default" 
                                    className={actionType === 'approve' ? 'bg-green-600 hover:bg-green-700' : 'bg-red-600 hover:bg-red-700'}
                                    onClick={handleAction}
                                >
                                    {_t('تأكيد', 'Confirm')}{actionType}
                                </Button>
                            </div>
                        </CardContent>
                    </Card>
                </div>
            )}
        </div>
    );
}
