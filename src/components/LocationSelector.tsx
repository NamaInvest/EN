'use client';

import { useState, useEffect } from 'react';
import { MapPin, Check, X } from 'lucide-react';
import { useTranslation } from "@/lib/i18n";

interface LocationSelectorProps {
    value?: string;
    onChange: (locationJson: string) => void;
}

export default function LocationSelector({ value, onChange }: LocationSelectorProps) {
    const { t } = useTranslation();
    const [isOpen, setIsOpen] = useState(false);
    const [locData, setLocData] = useState({ zone: '', rack: '', shelf: '', bin: '' });

    useEffect(() => {
        if (value) {
            try {
                // Parse existing location string
                // Support both JSON format and legacy format if any
                if (value.startsWith('{')) {
                    setLocData(JSON.parse(value));
                }
            } catch (e) { }
        } else {
            setLocData({ zone: '', rack: '', shelf: '', bin: '' });
        }
    }, [value, isOpen]);

    const handleSave = () => {
        // Only save if at least one field is filled
        if (locData.zone || locData.rack || locData.shelf || locData.bin) {
            onChange(JSON.stringify(locData));
        } else {
            onChange('');
        }
        setIsOpen(false);
    };

    // Derived brief label for the button
    let btnLabel = 'تحديد الموقع (In-route)';
    let isSet = false;
    if (value && value.startsWith('{')) {
        try {
            const p = JSON.parse(value);
            if (p.zone || p.rack || p.shelf || p.bin) {
                isSet = true;
                const parts = [];
                if (p.zone) parts.push(`Z:${p.zone}`);
                if (p.rack) parts.push(`R:${p.rack}`);
                if (p.shelf) parts.push(`S:${p.shelf}`);
                if (p.bin) parts.push(`B:${p.bin}`);
                btnLabel = parts.join(' | ');
            }
        } catch (e) { }
    }

    return (
        <>
            <button
                type="button"
                onClick={() => setIsOpen(true)}
                className="btn btn-outline"
                style={{
                    fontSize: '12px',
                    padding: '4px 8px',
                    borderColor: isSet ? '#10b981' : 'var(--border)',
                    color: isSet ? '#10b981' : 'inherit',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '4px',
                    minWidth: '130px',
                    justifyContent: 'center',
                    overflow: 'hidden',
                    whiteSpace: 'nowrap',
                    textOverflow: 'ellipsis'
                }}
            >
                <MapPin size={14} /> {btnLabel}
            </button>

            {isOpen && (
                <div style={{
                    position: 'fixed', inset: 0, zIndex: 99999,
                    backgroundColor: 'rgba(0,0,0,0.5)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center'
                }}>
                    <div className="animate-scale-in" style={{
                        backgroundColor: 'var(--card-bg, white)',
                        borderRadius: '12px',
                        padding: '24px',
                        width: '350px',
                        boxShadow: '0 10px 25px rgba(0,0,0,0.2)'
                    }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                            <h3 style={{ margin: 0, fontSize: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                                <MapPin size={18} color="#6366f1" /> {t('sys.str_85')}</h3>
                            <button type="button" onClick={() => setIsOpen(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)' }}>
                                <X size={20} />
                            </button>
                        </div>

                        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginBottom: '25px' }}>
                            <div>
                                <label style={{ display: 'block', fontSize: '12px', marginBottom: '4px', color: 'var(--text-muted)' }}>{t('sys.str_86')}</label>
                                <input type="text" className="input" placeholder={t('sys.str_93')}
                                    value={locData.zone} onChange={e => setLocData({ ...locData, zone: e.target.value })} />
                            </div>
                            <div>
                                <label style={{ display: 'block', fontSize: '12px', marginBottom: '4px', color: 'var(--text-muted)' }}>{t('sys.str_87')}</label>
                                <input type="text" className="input" placeholder={t('sys.str_94')}
                                    value={locData.rack} onChange={e => setLocData({ ...locData, rack: e.target.value })} />
                            </div>
                            <div>
                                <label style={{ display: 'block', fontSize: '12px', marginBottom: '4px', color: 'var(--text-muted)' }}>{t('sys.str_88')}</label>
                                <input type="text" className="input" placeholder={t('sys.str_95')}
                                    value={locData.shelf} onChange={e => setLocData({ ...locData, shelf: e.target.value })} />
                            </div>
                            <div>
                                <label style={{ display: 'block', fontSize: '12px', marginBottom: '4px', color: 'var(--text-muted)' }}>{t('sys.str_89')}</label>
                                <input type="text" className="input" placeholder={t('sys.str_96')}
                                    value={locData.bin} onChange={e => setLocData({ ...locData, bin: e.target.value })} />
                            </div>
                        </div>

                        <div style={{ display: 'flex', gap: '10px' }}>
                            <button type="button" onClick={() => { onChange(''); setIsOpen(false); }} className="btn btn-outline" style={{ flex: 1 }}>
                                {t('sys.str_90')}</button>
                            <button type="button" onClick={handleSave} className="btn btn-primary" style={{ flex: 1, backgroundColor: '#10b981' }}>
                                <Check size={16} style={{ marginRight: '4px' }} /> {t('sys.str_91')}</button>
                        </div>
                    </div>
                </div>
            )}
        </>
    );
}
