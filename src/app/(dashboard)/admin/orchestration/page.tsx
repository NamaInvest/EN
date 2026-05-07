import { _t } from '@/lib/server-t';
'use client';
import React, { useEffect, useState } from 'react';
import { useTranslation } from '@/lib/i18n';
import { Card } from '@/components/ui/card';
import { Network, Activity, ShieldAlert, CheckCircle, Clock } from 'lucide-react';
import { JourneyTimeline } from '@/components/v2/JourneyTimeline';

export default function OrchestrationDashboard() {
  const { lang } = useTranslation();
  const _t = (ar: string, en: string) => lang === 'ar' ? ar : en;
    const [data, setData] = useState<any>({ sagas: [], events: [], journeys: null });

    useEffect(() => {
        fetch('/api/admin/orchestration')
            .then(res => res.json())
            .then(res => {
                if (res.success) setData(res);
            });
    }, []);

    // Dummy data to demonstrate V2 SLA Tracking and Document Linking
    const dummyQ2CSteps = [
        { id: '1', title: 'Lead Captured', documentId: 'LD-1042', status: 'COMPLETED', timestamp: '08:00 AM' },
        { id: '2', title: 'Quote Approved', documentId: 'QT-2099', status: 'COMPLETED', timestamp: '09:15 AM' },
        { id: '3', title: 'Sales Order', documentId: 'SO-5021', status: 'COMPLETED', timestamp: '10:30 AM' },
        { id: '4', title: 'Delivery (PoD)', documentId: 'DN-8812', status: 'ACTIVE', timestamp: 'Pending SLA: 2hrs' },
        { id: '5', title: 'Invoice & Cash', status: 'PENDING' },
    ];

    return (
        <div className="max-w-7xl mx-auto space-y-6 p-6">
            <h1 className="text-3xl font-bold flex items-center gap-2">
                <Network className="w-8 h-8 text-indigo-600" />{_t('V2 Orchestration & SLA Tracking', 'V2 Orchestration & SLA Tracking')}</h1>
            <p className="text-gray-500">{_t('Cross-module Saga Tracking, Event Driven Hand-offs, and SLA Monitoring.', 'Cross-module Saga Tracking, Event Driven Hand-offs, and SLA Monitoring.')}</p>

            <Card className="p-6">
                <div className="flex justify-between items-center mb-4">
                    <h2 className="text-xl font-semibold flex items-center gap-2"><Clock /> Live Journey: Quote-to-Cash (Q2C)</h2>
                    <span className="bg-blue-100 text-blue-700 px-3 py-1 rounded-full text-sm font-bold">SLA: On Track</span>
                </div>
                <JourneyTimeline journeyType="Q2C" steps={dummyQ2CSteps as any} />
            </Card>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <Card className="p-6">
                    <h2 className="text-xl font-semibold mb-4 flex items-center gap-2"><Activity />{_t('Active Sagas (State Machines)', 'Active Sagas (State Machines)')}</h2>
                    <div className="space-y-3">
                        {data.sagas.map((saga: any) => (
                            <div key={saga.id} className="p-3 border rounded-lg bg-gray-50 dark:bg-gray-800">
                                <div className="flex justify-between items-center mb-2">
                                    <span className="font-bold">{saga.journeyType}</span>
                                    <span className={`text-xs px-2 py-1 rounded ${saga.status === 'COMPLETED' ? 'bg-green-100 text-green-700' : 'bg-orange-100 text-orange-700'}`}>
                                        {saga.status}
                                    </span>
                                </div>
                                <p className="text-xs text-gray-500">Current State: <span className="font-semibold text-gray-800 dark:text-gray-200">{saga.currentState}</span></p>
                                <div className="mt-2 text-xs flex flex-wrap gap-1">
                                    {saga.steps.map((step: any) => (
                                        <span key={step.id} className={`px-2 py-0.5 rounded border ${step.status === 'SUCCESS' ? 'border-green-200 text-green-700 bg-green-50' : 'border-red-200 text-red-700 bg-red-50'}`}>
                                            {step.stepName}
                                        </span>
                                    ))}
                                </div>
                            </div>
                        ))}
                        {data.sagas.length === 0 && <p className="text-sm text-gray-500">{_t('No active sagas found.', 'No active sagas found.')}</p>}
                    </div>
                </Card>

                <Card className="p-6">
                    <h2 className="text-xl font-semibold mb-4 flex items-center gap-2"><ShieldAlert />{_t('Cross-Module Event Bus', 'Cross-Module Event Bus')}</h2>
                    <div className="space-y-3">

                        {data.events.map((ev: any) => (
                            <div key={ev.id} className="p-3 border rounded-lg bg-gray-50 dark:bg-gray-800 flex justify-between items-center">
                                <div>
                                    <div className="font-bold flex items-center gap-2">
                                        {ev.status === 'PROCESSED' ? <CheckCircle className="w-4 h-4 text-green-500" /> : <Activity className="w-4 h-4 text-orange-500" />}
                                        {ev.eventType}
                                    </div>
                                    <p className="text-xs text-gray-500 mt-1">Source: {ev.sourceModule}</p>
                                </div>
                                <span className="text-xs bg-gray-200 dark:bg-gray-700 px-2 py-1 rounded font-mono">
                                    {new Date(ev.createdAt).toLocaleTimeString()}
                                </span>
                            </div>
                        ))}
                        {data.events.length === 0 && <p className="text-sm text-gray-500">{_t('No events logged.', 'No events logged.')}</p>}
                    </div>
                </Card>
            </div>

            {/* SLA Monitored Journeys */}
            <Card className="p-6">
                <h2 className="text-xl font-semibold mb-4 flex items-center gap-2"><Clock />{_t('Active SLA Tracked Journeys (End-to-End)', 'Active SLA Tracked Journeys (End-to-End)')}</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                    {data.journeys && Object.entries(data.journeys).map(([key, journeyList]: [string, any]) => {
                        if (!journeyList || journeyList.length === 0) return null;
                        return journeyList.map((j: any) => (
                            <div key={`${key}-${j.id}`} className="p-4 border rounded shadow-sm bg-white dark:bg-gray-800 flex flex-col gap-2">
                                <div className="flex justify-between items-center">
                                    <p className="font-bold">{key.toUpperCase()} #{j.id}</p>
                                    {j.slaBreached ? (
                                        <span className="flex items-center text-red-600 text-xs font-bold bg-red-100 px-2 py-1 rounded"><ShieldAlert className="w-3 h-3 mr-1" />{_t('BREACHED', 'BREACHED')}</span>
                                    ) : (
                                        <span className="text-green-600 text-xs bg-green-100 px-2 py-1 rounded">{_t('On Track', 'On Track')}</span>
                                    )}
                                </div>
                                <p className="text-sm text-gray-500">Status: {j.status}</p>
                                <p className="text-xs text-gray-400">Started: {new Date(j.startedAt).toLocaleDateString()}</p>
                            </div>
                        ));
                    })}
                    {!data.journeys && (
                        <p className="text-gray-500 text-sm text-center col-span-full">{_t('No active SLA tracked journeys yet.', 'No active SLA tracked journeys yet.')}</p>
                    )}
                </div>
            </Card>
        </div>
    );
}
