'use client';
import React from 'react';

export default class GlobalErrorBoundary extends React.Component<{children: React.ReactNode}, {hasError: boolean, error: Error | null}> {
    constructor(props: {children: React.ReactNode}) {
        super(props);
        this.state = { hasError: false, error: null };
    }

    static getDerivedStateFromError(error: Error) {
        return { hasError: true, error };
    }

    componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
        console.error("Global Error Caught:", error, errorInfo);
    }

    render() {
        if (this.state.hasError) {
            const isDev = typeof window !== 'undefined' && (
                window.location.hostname === 'localhost' || 
                window.location.hostname === '127.0.0.1'
            );

            return (
                <div style={{ 
                    padding: '40px', 
                    margin: '30px auto', 
                    maxWidth: '800px',
                    backgroundColor: '#fffbeb', 
                    border: '1px solid #fef3c7', 
                    borderRadius: '16px', 
                    color: '#78350f', 
                    direction: 'rtl', 
                    fontFamily: 'system-ui, -apple-system, sans-serif',
                    boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.05), 0 4px 6px -2px rgba(0, 0, 0, 0.05)'
                }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '20px' }}>
                        <span style={{ fontSize: '32px' }}>⚠️</span>
                        <h1 style={{ fontSize: '22px', fontWeight: 'bold', margin: 0, color: '#9a3412' }}>حدث خطأ غير متوقع في النظام</h1>
                    </div>
                    
                    <p style={{ fontSize: '16px', lineHeight: '1.6', marginBottom: '24px', color: '#451a03' }}>
                        نعتذر عن هذا الخلل المؤقت. يرجى محاولة تحديث الصفحة. إذا استمرت المشكلة، يرجى التواصل مع فريق الدعم الفني.
                    </p>

                    <div style={{ display: 'flex', gap: '12px', direction: 'rtl' }}>
                        <button 
                            onClick={() => window.location.reload()} 
                            style={{ 
                                padding: '10px 24px', 
                                backgroundColor: '#ea580c', 
                                color: 'white', 
                                border: 'none', 
                                borderRadius: '8px', 
                                cursor: 'pointer', 
                                fontWeight: 'bold',
                                fontSize: '15px',
                                transition: 'background-color 0.2s'
                            }}
                            onMouseOver={(e) => (e.currentTarget.style.backgroundColor = '#c2410c')}
                            onMouseOut={(e) => (e.currentTarget.style.backgroundColor = '#ea580c')}
                        >
                            تحديث الصفحة / Refresh Page
                        </button>
                    </div>

                    {isDev && this.state.error && (
                        <div style={{ marginTop: '30px', textAlign: 'left', direction: 'ltr' }}>
                            <h3 style={{ fontSize: '14px', color: '#9a3412', marginBottom: '8px' }}>Development Stack Trace:</h3>
                            <pre style={{ 
                                backgroundColor: '#fff7ed', 
                                padding: '16px', 
                                borderRadius: '8px', 
                                border: '1px solid #ffedd5',
                                overflowX: 'auto', 
                                fontSize: '13px', 
                                color: '#9a3412',
                                fontFamily: 'monospace'
                            }}>
                                {this.state.error.message}
                                {"\n\n"}
                                {this.state.error.stack}
                            </pre>
                        </div>
                    )}
                </div>
            );
        }
        return this.props.children;
    }
}
