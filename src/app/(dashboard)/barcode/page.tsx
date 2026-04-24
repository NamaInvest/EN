'use client';

import { useState, useEffect } from 'react';
import { useTranslation } from "@/lib/i18n";

interface Product {
    id: number;
    name: string;
    barcode: string;
    sellPrice: number;
}

const LABEL_SIZES: { value: string; label: string; w: string; h: string; fontSize: string; barcodeH: string }[] = [
    { value: '30x20', label: 'ًںڈ·ï¸ڈ 30أ—20mm', w: '30mm', h: '20mm', fontSize: '7px', barcodeH: '12mm' },
    { value: '40x30', label: 'ًںڈ·ï¸ڈ 40أ—30mm', w: '40mm', h: '30mm', fontSize: '8px', barcodeH: '18mm' },
    { value: '50x25', label: 'ًںڈ·ï¸ڈ 50أ—25mm', w: '50mm', h: '25mm', fontSize: '9px', barcodeH: '16mm' },
    { value: '50x30', label: 'ًںڈ·ï¸ڈ 50أ—30mm (ظ…ط®طµطµ)', w: '50mm', h: '30mm', fontSize: '9px', barcodeH: '20mm' },
    { value: '100x50', label: 'ًںڈ·ï¸ڈ 100أ—50mm', w: '100mm', h: '50mm', fontSize: '12px', barcodeH: '32mm' },
];

export default function BarcodePage() {
    const { t } = useTranslation();
    const [products, setProducts] = useState<Product[]>([]);
    const [search, setSearch] = useState('');
    const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
    const [manualBarcode, setManualBarcode] = useState('');
    const [manualName, setManualName] = useState('');
    const [qty, setQty] = useState(1);
    const [labelSize, setLabelSize] = useState('50x30');
    const [showPrice, setShowPrice] = useState(true);
    const [companyName, setCompanyName] = useState('');
    const [toast, setToast] = useState('');
    const [showDropdown, setShowDropdown] = useState(false);

    useEffect(() => {
        const token = localStorage.getItem('token');
        // Load products
        fetch('/api/products', { headers: { Authorization: `Bearer ${token}` } })
            .then(r => r.ok ? r.json() : [])
            .then(setProducts)
            .catch(() => { });
        // Load settings
        fetch('/api/settings', { headers: { Authorization: `Bearer ${token}` } })
            .then(r => r.ok ? r.json() : [])
            .then((data: { key: string; value: string }[]) => {
                const map: Record<string, string> = {};
                data.forEach(s => { map[s.key] = s.value; });
                setCompanyName(map['company_name'] || '');
                if (map['barcode_label_size']) setLabelSize(map['barcode_label_size']);
            })
            .catch(() => { });
    }, []);

    const filteredProducts = search.length > 0
        ? products.filter(p =>
            p.name.includes(search) ||
            (p.barcode && p.barcode.includes(search))
        ).slice(0, 10)
        : [];

    const showToast = (msg: string) => { setToast(msg); setTimeout(() => setToast(''), 3000); };

    const selectProduct = (p: Product) => {
        setSelectedProduct(p);
        setManualBarcode(p.barcode || '');
        setManualName(p.name);
        setSearch('');
        setShowDropdown(false);
    };

    const generateBarcode = () => {
        const prefix = '628';
        const ts = Date.now().toString().slice(-9);
        const base = prefix + ts;
        let sum = 0;
        for (let i = 0; i < 12; i++) {
            sum += parseInt(base[i]) * (i % 2 === 0 ? 1 : 3);
        }
        const check = (10 - (sum % 10)) % 10;
        setManualBarcode(base + check);
    };

    const generateBarcodeSvg = (code: string): string => {
        if (!code) return '';
        const bars = code.split('').map((ch, i) => {
            const c = ch.charCodeAt(0);
            const widths = [(c >> 6) & 1, (c >> 5) & 1, (c >> 4) & 1, (c >> 3) & 1, (c >> 2) & 1, (c >> 1) & 1, c & 1, 0];
            return widths.map((w, j) => `<rect x="${(i * 8 + j) * 2}" y="0" width="${w ? 2 : 1}" height="100" fill="${j % 2 === 0 ? '#000' : '#fff'}"/>`).join('');
        }).join('');
        const totalW = code.length * 8 * 2;
        return `<svg viewBox="0 0 ${totalW} 100" preserveAspectRatio="none" style="width:90%;height:100%"><rect x="0" y="0" width="2" height="100" fill="#000"/>${bars}<rect x="${totalW - 2}" y="0" width="2" height="100" fill="#000"/></svg>`;
    };

    const handlePrint = () => {
        const code = manualBarcode.trim();
        if (!code) { showToast(t('sys.str_4157')); return; }
        const sz = LABEL_SIZES.find(s => s.value === labelSize) || LABEL_SIZES[3];
        const name = manualName || '';
        const price = selectedProduct?.sellPrice;

        const barSvg = code.split('').map((ch, i) => {
            const c = ch.charCodeAt(0);
            const widths = [(c >> 6) & 1, (c >> 5) & 1, (c >> 4) & 1, (c >> 3) & 1, (c >> 2) & 1, (c >> 1) & 1, c & 1, 0];
            return widths.map((w, j) => `<rect x="${(i * 8 + j) * 2}" y="0" width="${w ? 2 : 1}" height="100" fill="${j % 2 === 0 ? '#000' : '#fff'}"/>`).join('');
        }).join('');
        const totalBars = code.length * 8 * 2;

        let labels = '';
        for (let i = 0; i < qty; i++) {
            labels += `<div class="label">
                ${companyName ? `<div class="company">${companyName}</div>` : ''}
                ${name ? `<div class="name">${name}</div>` : ''}
                <svg class="barcode" viewBox="0 0 ${totalBars} 100" preserveAspectRatio="none"><rect x="0" y="0" width="2" height="100" fill="#000"/>${barSvg}<rect x="${totalBars - 2}" y="0" width="2" height="100" fill="#000"/></svg>
                <div class="code">${code}</div>
                ${showPrice && price ? `<div class="price">${price.toFixed(2)} ط±.ط³</div>` : ''}
            </div>`;
        }

        const pw = window.open('', '_blank', 'width=500,height=500');
        if (!pw) { showToast(t('sys.str_4158')); return; }
        pw.document.write(`<!DOCTYPE html><html dir="rtl"><head><meta charset="UTF-8"><title>ط·ط¨ط§ط¹ط© ط¨ط§ط±ظƒظˆط¯</title>
        <style>
            @import url('https://fonts.googleapis.com/css2?family=Noto Sans Arabic:wght@400;600;700&display=swap');
            * { margin: 0; padding: 0; box-sizing: border-box; }
            body { font-family: 'Noto Sans Arabic', sans-serif; display: flex; flex-wrap: wrap; justify-content: center; align-content: flex-start; padding: 2mm; gap: 1mm; }
            .label { width: ${sz.w}; height: ${sz.h}; display: flex; flex-direction: column; align-items: center; justify-content: center; padding: 1mm; overflow: hidden; page-break-inside: avoid; border: 0.5px dashed #ccc; }
            .company { font-size: ${sz.fontSize}; font-weight: 700; text-align: center; line-height: 1; overflow: hidden; white-space: nowrap; text-overflow: ellipsis; max-width: 100%; }
            .name { font-size: calc(${sz.fontSize} - 1px); text-align: center; line-height: 1; overflow: hidden; white-space: nowrap; text-overflow: ellipsis; max-width: 100%; color: #333; }
            .barcode { width: 90%; height: ${sz.barcodeH}; margin: 0.5mm 0; }
            .code { font-size: ${sz.fontSize}; font-weight: 600; letter-spacing: 1.5px; text-align: center; font-family: monospace, 'Noto Sans Arabic'; }
            .price { font-size: ${sz.fontSize}; font-weight: 700; text-align: center; }
            @media print { @page { margin: 0; size: auto; } body { padding: 0; } .label { border: none; } }
        </style></head><body>${labels}
        <script>window.onload=function(){setTimeout(function(){window.print();window.close();},400);};</script>
        </body></html>`);
        pw.document.close();
    };

    // Save selected barcode to product if it was generated
    const handleSaveBarcode = async () => {
        if (!selectedProduct || !manualBarcode) { showToast(t('sys.str_4159')); return; }
        const token = localStorage.getItem('token');
        try {
            const res = await fetch(`/api/products/${selectedProduct.id}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
                body: JSON.stringify({ barcode: manualBarcode }),
            });
            if (res.ok) {
                showToast(t('sys.str_4160'));
                setProducts(prev => prev.map(p => p.id === selectedProduct.id ? { ...p, barcode: manualBarcode } : p));
                setSelectedProduct({ ...selectedProduct, barcode: manualBarcode });
            } else {
                const d = await res.json();
                showToast(`â‌Œ ${d.error || t('sys.str_4161')}`);
            }
        } catch { showToast(t('sys.str_4162')); }
    };

    return (
        <>
            <div className="page-header">
                <h1 className="page-title">{t('sys.str_4139')}</h1>
            </div>
            <div className="page-content animate-fade-in">
                <div className="card" style={{ padding: '24px' }}>
                    {/* Product Search */}
                    <div style={{ marginBottom: '20px' }}>
                        <label className="input-label" style={{ fontSize: '14px', fontWeight: '700', marginBottom: '8px', display: 'block' }}>{t('sys.str_4140')}</label>
                        <div style={{ position: 'relative' }}>
                            <input
                                className="input"
                                placeholder={t('sys.str_4163')}
                                value={search}
                                onChange={e => { setSearch(e.target.value); setShowDropdown(true); }}
                                onFocus={() => setShowDropdown(true)}
                            />
                            {showDropdown && filteredProducts.length > 0 && (
                                <div style={{
                                    position: 'absolute', top: '100%', left: 0, right: 0, zIndex: 50,
                                    background: 'var(--bg-card)', border: '1px solid var(--border)',
                                    borderRadius: '10px', boxShadow: '0 8px 24px rgba(0,0,0,0.2)',
                                    maxHeight: '300px', overflowY: 'auto', marginTop: '4px',
                                }}>
                                    {filteredProducts.map(p => (
                                        <div
                                            key={p.id}
                                            onClick={() => selectProduct(p)}
                                            style={{
                                                padding: '10px 14px', cursor: 'pointer', display: 'flex',
                                                justifyContent: 'space-between', alignItems: 'center',
                                                borderBottom: '1px solid var(--border)',
                                                transition: 'background 0.15s',
                                            }}
                                            onMouseEnter={e => (e.currentTarget.style.background = 'var(--bg-card-hover)')}
                                            onMouseLeave={e => (e.currentTarget.style.background = '')}
                                        >
                                            <div>
                                                <div style={{ fontWeight: '600' }}>{p.name}</div>
                                                <div style={{ fontSize: '12px', color: 'var(--text-muted)', direction: 'ltr' }}>{p.barcode || t('sys.str_4164')}</div>
                                            </div>
                                            <div style={{ fontSize: '13px', color: 'var(--success-light)', fontWeight: '600' }}>
                                                {p.sellPrice?.toFixed(2)} {t('sys.str_4105')}</div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Selected Product Info */}
                    {selectedProduct && (
                        <div style={{
                            marginBottom: '20px', padding: '14px', borderRadius: '10px',
                            background: 'rgba(99,102,241,0.08)', border: '1px solid rgba(99,102,241,0.2)',
                            display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '10px',
                        }}>
                            <div>
                                <div style={{ fontWeight: '700', fontSize: '15px' }}>ًں“¦ {selectedProduct.name}</div>
                                <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
                                    {t('sys.str_4141')}<code style={{ direction: 'ltr' }}>{selectedProduct.barcode || t('sys.str_4165')}</code>
                                </div>
                            </div>
                            <div style={{ fontWeight: '700', fontSize: '16px', color: 'var(--success-light)' }}>
                                {selectedProduct.sellPrice?.toFixed(2)} {t('sys.str_4105')}</div>
                        </div>
                    )}

                    {/* Barcode Input & Generator */}
                    <div className="grid-2" style={{ marginBottom: '20px' }}>
                        <div className="input-group">
                            <label className="input-label">{t('sys.str_4142')}</label>
                            <div style={{ display: 'flex', gap: '6px' }}>
                                <input
                                    className="input"
                                    style={{ flex: 1 }}
                                    value={manualBarcode}
                                    onChange={e => setManualBarcode(e.target.value)}
                                    placeholder={t('sys.str_4166')}
                                    dir="ltr"
                                />
                                <button className="btn btn-primary btn-sm" onClick={generateBarcode} title={t('sys.str_4167')}>
                                    {t('sys.str_4143')}</button>
                            </div>
                        </div>
                        <div className="input-group">
                            <label className="input-label">{t('sys.str_4144')}</label>
                            <input
                                className="input"
                                value={manualName}
                                onChange={e => setManualName(e.target.value)}
                                placeholder={t('sys.str_4168')}
                            />
                        </div>
                    </div>

                    {/* Settings Row */}
                    <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap', alignItems: 'flex-end', marginBottom: '20px' }}>
                        <div className="input-group" style={{ minWidth: '180px' }}>
                            <label className="input-label">{t('sys.str_4145')}</label>
                            <select className="input" value={labelSize} onChange={e => setLabelSize(e.target.value)}>
                                {LABEL_SIZES.map(s => <option key={s.value} value={s.value}>{s.label}</option>)}
                            </select>
                        </div>
                        <div className="input-group" style={{ width: '100px' }}>
                            <label className="input-label">{t('sys.str_4093')}</label>
                            <input className="input" type="number" value={qty} onChange={e => setQty(Math.max(1, Math.min(200, parseInt(e.target.value) || 1)))} min="1" max="200" dir="ltr" />
                        </div>
                        <label style={{
                            display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer',
                            padding: '8px 14px', borderRadius: '8px', fontSize: '13px',
                            background: showPrice ? 'rgba(34,197,94,0.1)' : 'var(--bg-card-hover)',
                            border: showPrice ? '1px solid rgba(34,197,94,0.3)' : '1px solid var(--border)',
                        }}>
                            <input type="checkbox" checked={showPrice} onChange={e => setShowPrice(e.target.checked)} style={{ accentColor: '#22c55e' }} />
                            <span style={{ fontWeight: '600' }}>{t('sys.str_4146')}</span>
                        </label>
                    </div>

                    {/* Preview */}
                    {manualBarcode && (
                        <div style={{ marginBottom: '20px' }}>
                            <label className="input-label" style={{ marginBottom: '8px', display: 'block' }}>{t('sys.str_4147')}</label>
                            <div style={{
                                display: 'inline-flex', flexDirection: 'column', alignItems: 'center',
                                justifyContent: 'center', padding: '12px 20px',
                                border: '2px dashed var(--border)', borderRadius: '12px',
                                background: '#fff', color: '#000', minWidth: '180px',
                            }}>
                                {companyName && <div style={{ fontSize: '11px', fontWeight: '700' }}>{companyName}</div>}
                                {manualName && <div style={{ fontSize: '10px', color: '#555' }}>{manualName}</div>}
                                <div style={{ width: '150px', height: '50px', margin: '4px 0' }} dangerouslySetInnerHTML={{ __html: generateBarcodeSvg(manualBarcode) }} />
                                <div style={{ fontSize: '12px', fontWeight: '600', letterSpacing: '2px', fontFamily: 'monospace' }}>{manualBarcode}</div>
                                {showPrice && selectedProduct?.sellPrice && (
                                    <div style={{ fontSize: '12px', fontWeight: '700', marginTop: '2px' }}>{selectedProduct.sellPrice.toFixed(2)} {t('sys.str_4105')}</div>
                                )}
                            </div>
                        </div>
                    )}

                    {/* Action Buttons */}
                    <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
                        <button className="btn btn-primary" onClick={handlePrint} style={{ fontSize: '15px', padding: '10px 24px' }}>
                            {t('sys.str_4148')}</button>
                        {selectedProduct && manualBarcode && manualBarcode !== selectedProduct.barcode && (
                            <button className="btn" onClick={handleSaveBarcode} style={{
                                background: 'rgba(99,102,241,0.12)', color: '#6366f1',
                                border: '1px solid rgba(99,102,241,0.3)', fontWeight: '600',
                            }}>
                                {t('sys.str_4149')}</button>
                        )}
                    </div>

                    <p style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '16px' }}>
                        {t('sys.str_4150')}</p>
                </div>

                {/* Products without barcode */}
                <div className="card" style={{ padding: '24px', marginTop: '20px' }}>
                    <h3 style={{ fontSize: '16px', fontWeight: '700', marginBottom: '12px' }}>{t('sys.str_4151')}</h3>
                    <div className="table-container">
                        <table className="table">
                            <thead>
                                <tr>
                                    <th>#</th>
                                    <th>{t('sys.str_4152')}</th>
                                    <th>{t('sys.str_4094')}</th>
                                    <th>{t('sys.str_4153')}</th>
                                </tr>
                            </thead>
                            <tbody>
                                {products.filter(p => !p.barcode).length === 0 ? (
                                    <tr><td colSpan={4} style={{ textAlign: 'center', padding: '20px', color: 'var(--text-muted)' }}>{t('sys.str_4154')}</td></tr>
                                ) : products.filter(p => !p.barcode).slice(0, 20).map((p, i) => (
                                    <tr key={p.id}>
                                        <td>{i + 1}</td>
                                        <td style={{ fontWeight: '600' }}>{p.name}</td>
                                        <td>{p.sellPrice?.toFixed(2)} {t('sys.str_4105')}</td>
                                        <td>
                                            <button className="btn btn-primary btn-sm" onClick={() => {
                                                selectProduct(p);
                                                generateBarcode();
                                            }}>{t('sys.str_4155')}</button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
            {toast && <div className="toast-container"><div className={`toast ${toast.includes('âœ…') ? 'toast-success' : 'toast-error'}`}>{toast}</div></div>}
        </>
    );
}

