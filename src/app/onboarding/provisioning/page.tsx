'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Terminal, CheckCircle2, Server, Globe, Database, Shield, LayoutDashboard } from 'lucide-react';

const PROVISIONING_STEPS = [
    { id: 'init', label: 'تهيئة بيئة العمل المعزولة', duration: 1500, icon: Server },
    { id: 'hetzner', label: 'إنشاء خادم جديد (Hetzner Cloud - n11)', duration: 3000, icon: Globe },
    { id: 'db', label: 'نسخ وتجهيز قاعدة البيانات الخاصة', duration: 2500, icon: Database },
    { id: 'zatca', label: 'توليد مفاتيح التشفير وربط ZATCA Phase 2 (Fatoora)', duration: 4000, icon: Shield },
    { id: 'done', label: 'اكتمل التجهيز! جاري التوجيه...', duration: 1000, icon: CheckCircle2 }
];

export default function ProvisioningTerminal() {
    const router = useRouter();
    const [currentStepIndex, setCurrentStepIndex] = useState(0);
    const [logs, setLogs] = useState<string[]>([]);

    useEffect(() => {
        let isSubscribed = true;
        let timeout: NodeJS.Timeout | undefined;

        const runSteps = async () => {
            for (let i = 0; i < PROVISIONING_STEPS.length; i++) {
                if (!isSubscribed) return;
                setCurrentStepIndex(i);
                
                const step = PROVISIONING_STEPS[i];
                // Simulate logs
                setLogs(prev => [...prev, `[SYSTEM] Starting: ${step.label}...`]);
                
                if (step.id === 'hetzner') {
                    setTimeout(() => setLogs(prev => [...prev, `[HETZNER API] Allocating IPv4... Success`]), 1000);
                    setTimeout(() => setLogs(prev => [...prev, `[HETZNER API] Booting Ubuntu 24.04 image...`]), 2000);
                }
                if (step.id === 'db') {
                    setTimeout(() => setLogs(prev => [...prev, `[PRISMA] Running migrations... OK`]), 1000);
                    setTimeout(() => setLogs(prev => [...prev, `[PRISMA] Seeding initial charts of accounts... OK`]), 2000);
                }
                if (step.id === 'zatca') {
                    setTimeout(() => setLogs(prev => [...prev, `[ZATCA SDK] Generating Private Key (secp256k1)...`]), 1000);
                    setTimeout(() => setLogs(prev => [...prev, `[ZATCA SDK] Building CSR (Certificate Signing Request)...`]), 2000);
                    setTimeout(() => setLogs(prev => [...prev, `[ZATCA SDK] Vault secured. OK`]), 3500);
                }

                await new Promise(resolve => setTimeout(resolve, step.duration));
                setLogs(prev => [...prev, `[SYSTEM] Completed: ${step.label}`]);
            }

            if (isSubscribed) {
                setTimeout(() => {
                    // Force log in to dashboard
                    localStorage.setItem('user', JSON.stringify({ name: 'مدير النظام التنفيذي', role: 'admin', server: 'n11' }));
                    window.location.href = '/dashboard';
                }, 1500);
            }
        };

        runSteps();

        return () => {
            isSubscribed = false;
            clearTimeout(timeout);
        };
    }, []);

    return (
        <div className="provision-ui" dir="rtl">
            <style jsx>{`
                .provision-ui {
                    min-height: 100vh;
                    background: #0f172a;
                    color: white;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    font-family: 'Courier New', Courier, monospace;
                    padding: 2rem;
                    background-image: radial-gradient(circle at center, #1e293b 0%, #0f172a 100%);
                }
                .terminal-card {
                    width: 100%;
                    max-width: 900px;
                    background: rgba(15, 23, 42, 0.9);
                    border: 1px solid #334155;
                    border-radius: 16px;
                    overflow: hidden;
                    box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.5);
                    display: flex;
                    flex-direction: column;
                }
                .terminal-header {
                    background: #1e293b;
                    padding: 1rem 1.5rem;
                    display: flex;
                    align-items: center;
                    gap: 1rem;
                    border-bottom: 1px solid #334155;
                }
                .dots { display: flex; gap: 8px; }
                .dot { width: 12px; height: 12px; border-radius: 50%; }
                .dot-r { background: #ef4444; }
                .dot-y { background: #f59e0b; }
                .dot-g { background: #22c55e; }
                .terminal-title {
                    font-family: 'Inter', sans-serif;
                    font-weight: 600;
                    color: #94a3b8;
                    display: flex;
                    align-items: center;
                    gap: 0.5rem;
                }
                
                .terminal-body {
                    display: grid;
                    grid-template-columns: 350px 1fr;
                    min-height: 500px;
                }

                .steps-pane {
                    background: rgba(30, 41, 59, 0.5);
                    padding: 2rem;
                    border-left: 1px solid #334155;
                    font-family: 'Inter', sans-serif;
                }
                .step-item {
                    display: flex;
                    align-items: center;
                    gap: 1rem;
                    margin-bottom: 2rem;
                    opacity: 0.4;
                    transition: all 0.3s;
                }
                .step-item.active { opacity: 1; transform: translateX(-5px); }
                .step-item.completed { opacity: 0.8; color: #10b981; }
                
                .icon-box {
                    width: 40px; height: 40px;
                    border-radius: 10px;
                    background: #334155;
                    display: flex; align-items: center; justify-content: center;
                }
                .active .icon-box { background: #3b82f6; color: white; box-shadow: 0 0 15px rgba(59,130,246,0.5); }
                .completed .icon-box { background: #10b981; color: white; }
                
                .step-text { font-weight: 600; font-size: 0.95rem; }

                .logs-pane {
                    padding: 2rem;
                    overflow-y: auto;
                    font-size: 0.9rem;
                    line-height: 1.6;
                    color: #cbd5e1;
                    display: flex;
                    flex-direction: column;
                    justify-content: flex-end;
                }
                .log-line {
                    margin-bottom: 0.5rem;
                    animation: typeIn 0.2s ease-out;
                }
                .log-line span {
                    color: #3b82f6;
                    margin-left: 0.5rem;
                }
                @keyframes typeIn {
                    from { opacity: 0; transform: translateY(5px); }
                    to { opacity: 1; transform: translateY(0); }
                }
                .spinner {
                    display: inline-block;
                    width: 14px; height: 14px;
                    border: 2px solid rgba(255,255,255,0.3);
                    border-radius: 50%;
                    border-top-color: #fff;
                    animation: spin 1s ease-in-out infinite;
                    margin-left: 10px;
                }
                @keyframes spin { to { transform: rotate(360deg); } }
            `}</style>

            <div className="terminal-card">
                <div className="terminal-header">
                    <div className="dots">
                        <div className="dot dot-r"></div>
                        <div className="dot dot-y"></div>
                        <div className="dot dot-g"></div>
                    </div>
                    <div className="terminal-title">
                        <Terminal size={18} />
                        Automated Tenant Provisioning
                    </div>
                </div>

                <div className="terminal-body">
                    <div className="steps-pane">
                        <h3 style={{ color: 'white', marginBottom: '2rem', fontSize: '1.2rem' }}>مسار تشغيل الخادم</h3>
                        {PROVISIONING_STEPS.map((step, index) => {
                            const Icon = step.icon;
                            let statusClass = '';
                            if (index < currentStepIndex) statusClass = 'completed';
                            else if (index === currentStepIndex) statusClass = 'active';

                            return (
                                <div key={step.id} className={`step-item ${statusClass}`}>
                                    <div className="icon-box">
                                        <Icon size={20} />
                                    </div>
                                    <div className="step-text">{step.label}</div>
                                    {index === currentStepIndex && <div className="spinner"></div>}
                                </div>
                            );
                        })}
                    </div>
                    
                    <div className="logs-pane">
                        {logs.map((log, i) => (
                            <div key={i} className="log-line">
                                <span>{'>'}</span> {log}
                            </div>
                        ))}
                        {currentStepIndex < PROVISIONING_STEPS.length - 1 && (
                            <div className="log-line" style={{ display: 'flex', alignItems: 'center', color: '#10b981' }}>
                                <span className="spinner" style={{ borderColor: 'rgba(16, 185, 129, 0.3)', borderTopColor: '#10b981' }}></span> _جاري التنفيذ
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
