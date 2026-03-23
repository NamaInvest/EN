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
            return (
                <div style={{ padding: '40px', margin: '20px', backgroundColor: '#fee2e2', border: '3px solid #ef4444', borderRadius: '15px', color: '#7f1d1d', direction: 'ltr', fontFamily: 'monospace' }}>
                    <h1 style={{ fontSize: '24px', fontWeight: 'bold', borderBottom: '2px solid #fca5a5', paddingBottom: '10px', marginBottom: '20px' }}>⚠️ FATAL CLIENT-SIDE EXCEPTION</h1>
                    <p style={{ fontWeight: 'bold', fontSize: '18px' }}>{this.state.error?.message}</p>
                    <pre style={{ backgroundColor: '#fecaca', padding: '20px', borderRadius: '10px', marginTop: '20px', whiteSpace: 'pre-wrap', fontSize: '14px' }}>
                        {this.state.error?.stack}
                    </pre>
                    <button 
                        onClick={() => window.location.reload()} 
                        style={{ marginTop: '30px', padding: '10px 20px', backgroundColor: '#ef4444', color: 'white', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold' }}
                    >
                        Try Refreshing
                    </button>
                </div>
            );
        }
        return this.props.children;
    }
}
