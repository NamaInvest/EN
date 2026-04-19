'use client';

import { useEffect } from 'react';

interface QuotaModalProps {
    open: boolean;
    onClose: () => void;
    reason: 'trial_expired' | 'quota_exceeded' | null;
    resource?: string;
    limit?: number;
    current?: number;
    message?: string;
}

export default function QuotaModal({ open, onClose, reason, resource, limit, current, message }: QuotaModalProps) {
    useEffect(() => {
        if (open) {
            document.body.style.overflow = 'hidden';
        } else {
            document.body.style.overflow = '';
        }
        return () => { document.body.style.overflow = ''; };
    }, [open]);

    if (!open) return null;

    const isExpired = reason === 'trial_expired';

    const icons: Record<string, string> = {
        invoice: 'ًں§¾', product: 'ًں“¦', user: 'ًں‘¤',
    };
    const resourceIcon = icons[resource || ''] || 'âڑ ï¸ڈ';

    const resourceLabel: Record<string, string> = {
        invoice: 'ط§ظ„ظپظˆط§طھظٹط±', product: 'ط§ظ„ط£طµظ†ط§ظپ', user: 'ط§ظ„ظ…ط³طھط®ط¯ظ…ظٹظ†',
    };
    const rLabel = resourceLabel[resource || ''] || resource || '';

    return (
        <div
            onClick={onClose}
            style={{
                position: 'fixed', inset: 0, zIndex: 9999,
                background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(4px)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                padding: 16,
            }}
        >
            <div
                onClick={e => e.stopPropagation()}
                style={{
                    background: 'linear-gradient(135deg, #0f172a 0%, #1e1b4b 100%)',
                    border: '1px solid rgba(139,92,246,0.4)',
                    borderRadius: 20, padding: 36,
                    maxWidth: 440, width: '100%',
                    boxShadow: '0 25px 50px rgba(0,0,0,0.5), 0 0 80px rgba(139,92,246,0.15)',
                    textAlign: 'center',
                    direction: 'rtl',
                    fontFamily: "'Tajawal', 'Lateef', sans-serif",
                }}
            >
                {/* Icon */}
                <div style={{
                    width: 70, height: 70, borderRadius: '50%',
                    background: isExpired ? 'rgba(239,68,68,0.15)' : 'rgba(139,92,246,0.15)',
                    border: `2px solid ${isExpired ? '#ef4444' : '#7c3aed'}`,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    margin: '0 auto 20px', fontSize: 32,
                }}>
                    {isExpired ? 'âڈ°' : resourceIcon}
                </div>

                {/* Title */}
                <h2 style={{
                    fontSize: 22, fontWeight: 700, margin: '0 0 10px',
                    color: isExpired ? '#fca5a5' : '#c4b5fd',
                }}>
                    {isExpired ? 'ط§ظ†طھظ‡طھ ظپطھط±ط© ط§ظ„طھط¬ط±ط¨ط©' : `ط§ط³طھظ†ظپط¯طھ ط­طµط© ${rLabel}`}
                </h2>

                {/* Message */}
                <p style={{ color: '#94a3b8', fontSize: 14, lineHeight: 1.7, margin: '0 0 20px' }}>
                    {message || (isExpired
                        ? 'ط§ظ†طھظ‡طھ ظپطھط±ط© ط§ظ„طھط¬ط±ط¨ط© ط§ظ„ظ…ط¬ط§ظ†ظٹط©. ظ‚ظ… ط¨ط§ظ„طھط±ظ‚ظٹط© ظ„ظ…طھط§ط¨ط¹ط© ط§ط³طھط®ط¯ط§ظ… ط§ظ„ظ†ط¸ط§ظ… ط¨ط¯ظˆظ† ظ‚ظٹظˆط¯.'
                        : `ظ„ظ‚ط¯ ظˆطµظ„طھ ظ„ظ„ط­ط¯ ط§ظ„ط£ظ‚طµظ‰ ط§ظ„ظ…ط³ظ…ظˆط­ ط¨ظ‡. ظ‚ظ… ط¨ط§ظ„طھط±ظ‚ظٹط© ظ„ظ„ط­طµظˆظ„ ط¹ظ„ظ‰ ط­طµطµ ط؛ظٹط± ظ…ط­ط¯ظˆط¯ط©.`)}
                </p>

                {/* Usage bar (for quota_exceeded) */}
                {!isExpired && limit && current !== undefined && (
                    <div style={{ margin: '0 0 20px' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, color: '#64748b', marginBottom: 6 }}>
                            <span>ط§ظ„ط§ط³طھط®ط¯ط§ظ… ط§ظ„ط­ط§ظ„ظٹ</span>
                            <span style={{ color: '#a78bfa' }}>{current} / {limit}</span>
                        </div>
                        <div style={{ height: 8, background: '#1e293b', borderRadius: 99, overflow: 'hidden' }}>
                            <div style={{
                                height: '100%',
                                width: `${Math.min(100, (current / limit) * 100)}%`,
                                background: 'linear-gradient(90deg, #7c3aed, #a855f7)',
                                borderRadius: 99,
                                transition: 'width 0.5s ease',
                            }} />
                        </div>
                    </div>
                )}

                {/* Actions */}
                <div style={{ display: 'flex', gap: 12, flexDirection: 'column' }}>
                    <a
                        href="/pricing"
                        style={{
                            display: 'block', padding: '14px 24px',
                            background: 'linear-gradient(135deg, #7c3aed, #a855f7)',
                            color: 'white', borderRadius: 12, textDecoration: 'none',
                            fontWeight: 700, fontSize: 15,
                            boxShadow: '0 4px 20px rgba(124,58,237,0.4)',
                            transition: 'transform 0.15s, box-shadow 0.15s',
                        }}
                        onMouseOver={e => {
                            (e.currentTarget as HTMLAnchorElement).style.transform = 'translateY(-2px)';
                            (e.currentTarget as HTMLAnchorElement).style.boxShadow = '0 8px 28px rgba(124,58,237,0.5)';
                        }}
                        onMouseOut={e => {
                            (e.currentTarget as HTMLAnchorElement).style.transform = '';
                            (e.currentTarget as HTMLAnchorElement).style.boxShadow = '0 4px 20px rgba(124,58,237,0.4)';
                        }}
                    >
                        ًںڑ€ طھط±ظ‚ظٹط© ط§ظ„ط§ط´طھط±ط§ظƒ ط§ظ„ط¢ظ†
                    </a>
                    <button
                        onClick={onClose}
                        style={{
                            background: 'transparent', border: '1px solid #1e293b',
                            color: '#64748b', borderRadius: 12, padding: '10px 24px',
                            cursor: 'pointer', fontSize: 13,
                        }}
                    >
                        ط¥ط؛ظ„ط§ظ‚
                    </button>
                </div>

                {/* WhatsApp CTA */}
                <div style={{ marginTop: 16, paddingTop: 16, borderTop: '1px solid #1e293b' }}>
                    <a
                        href="https://wa.me/966531206628?text=ط£ط±ظٹط¯ ط§ظ„ط§ط´طھط±ط§ظƒ ظپظٹ ظ†ظ…ط§ ط¥ظ†ظپط³طھ"
                        target="_blank"
                        rel="noreferrer"
                        style={{ color: '#22c55e', fontSize: 13, textDecoration: 'none' }}
                    >
                        ًں’¬ طھظˆط§طµظ„ ظ…ط¹ظ†ط§ ط¹ظ„ظ‰ ظˆط§طھط³ط§ط¨ ظ„ظ„ط§ط´طھط±ط§ظƒ ط§ظ„ظپظˆط±ظٹ
                    </a>
                </div>
            </div>
        </div>
    );
}

