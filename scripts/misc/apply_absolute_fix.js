const fs = require('fs');
const file = 'c:/Users/1/Desktop/alfa/src/app/(dashboard)/sales/page.tsx';
let content = fs.readFileSync(file, 'utf8');

const targetStr = `                                <div className="pos-total-row" style={{ display: 'flex', alignItems: 'center', gap: '6px', flexWrap: 'wrap' }}>
                                    <span>{t('sys.str_769')}</span>
                                    <input className="input" type="number" min="0" step="0.01"
                                        id="discount-input"
                                        value={discountRate} onChange={e => setDiscountRate(parseFloat(e.target.value) || 0)}
                                        onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); showToast(\`✅ تم تطبيق خصم \${discountRate}%\`); } }}
                                        style={{ width: '70px', textAlign: 'center', padding: '6px 8px', fontWeight: '700' }} dir="ltr" />
                                    <span style={{ fontSize: '14px', fontWeight: '600' }}>%</span>
                                    <button onClick={() => { if (discountRate > 0) { showToast(\`✅ تم تطبيق خصم \${discountRate}% = \${fmt(regularDiscountValue)} ر.س\`); } }}
                                        style={{ padding: '6px 14px', borderRadius: '8px', border: 'none', background: discountRate > 0 ? 'var(--primary)' : 'var(--bg-card-hover)', color: discountRate > 0 ? '#fff' : 'var(--text-muted)', cursor: 'pointer', fontWeight: '700', fontSize: '13px', transition: 'all 0.2s' }}>
                                        {t('sys.str_770')}</button>
                                    {discountRate > 0 && (
                                        <button onClick={() => { setDiscountRate(0); showToast(t('sys.str_847')); }}
                                            style={{ padding: '4px 8px', borderRadius: '6px', border: 'none', background: 'rgba(239,68,68,0.1)', color: '#ef4444', cursor: 'pointer', fontSize: '12px', fontWeight: '600' }}>
                                            {t('sys.str_771')}</button>
                                    )}
                                    <span style={{ marginRight: 'auto', fontWeight: '600', color: discountRate > 0 ? '#ef4444' : 'var(--text-muted)' }}>
                                        {discountRate > 0 ? \`- \${fmt(regularDiscountValue)}\` : '0.00'} {t('sys.str_68')}</span>
                                </div>
                                <div className="pos-total-row" style={{ display: 'flex', alignItems: 'center', gap: '6px', flexWrap: 'wrap', marginTop: '4px' }}>
                                    <span>{t('sys.str_772')}</span>
                                    <input className="input" type="text"
                                        value={couponCode} onChange={e => setCouponCode(e.target.value)}
                                        onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); applyCoupon(); } }}
                                        placeholder={t('sys.str_848')}
                                        style={{ width: '100px', textAlign: 'center', padding: '6px 8px', fontWeight: '700', textTransform: 'uppercase' }} dir="ltr" disabled={!!appliedCoupon} />
                                    
                                    {!appliedCoupon ? (
                                        <button onClick={applyCoupon} disabled={couponApplying || !couponCode}
                                            style={{ padding: '6px 14px', borderRadius: '8px', border: 'none', background: couponCode ? 'var(--primary)' : 'var(--bg-card-hover)', color: couponCode ? '#fff' : 'var(--text-muted)', cursor: 'pointer', fontWeight: '700', fontSize: '13px', transition: 'all 0.2s' }}>
                                            {couponApplying ? '⏳' : t('sys.str_849')}
                                        </button>
                                    ) : (
                                        <button onClick={() => { setAppliedCoupon(null); setCouponCode(''); showToast(t('sys.str_850')); }}
                                            style={{ padding: '4px 8px', borderRadius: '6px', border: 'none', background: 'rgba(239,68,68,0.1)', color: '#ef4444', cursor: 'pointer', fontSize: '12px', fontWeight: '600' }}>
                                            {t('sys.str_771')}</button>
                                    )}
                                    <span style={{ marginRight: 'auto', fontWeight: '600', color: appliedCoupon ? '#ef4444' : 'var(--text-muted)' }}>
                                        {appliedCoupon ? \`- \${fmt(couponDiscountValue)}\` : '0.00'} {t('sys.str_68')}</span>
                                </div>`;

const newStr = `                                {discountEnabled && (
                                    <div className="pos-total-row" style={{ display: 'flex', alignItems: 'center', gap: '6px', flexWrap: 'wrap' }}>
                                        <span>{t('sys.str_769')}</span>
                                        <input className="input" type="number" min="0" step="0.01"
                                            id="discount-input"
                                            value={discountRate} onChange={e => {
                                                const val = parseFloat(e.target.value) || 0;
                                                if (discountRules.length > 0 && val > maxAllowedDiscountPercent) {
                                                    showToast(\`❌ عذراً، أقصى نسبة خصم مسموحة هي \${maxAllowedDiscountPercent}%\`);
                                                    return;
                                                }
                                                setDiscountRate(val);
                                            }}
                                            onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); showToast(\`✅ تم تطبيق خصم \${discountRate}%\`); } }}
                                            style={{ width: '70px', textAlign: 'center', padding: '6px 8px', fontWeight: '700' }} dir="ltr" />
                                        <span style={{ fontSize: '14px', fontWeight: '600' }}>%</span>
                                        <input className="input" type="number" min="0" step="0.01"
                                            placeholder="خصم بالريال"
                                            value={discountValueState} 
                                            onChange={e => {
                                                const val = parseFloat(e.target.value) || 0;
                                                if (discountRules.length > 0 && val > maxAllowedDiscount) {
                                                    showToast(\`❌ عذراً، أقصى خصم بالريال مسموح لهذه الفاتورة هو \${maxAllowedDiscount} ريال\`);
                                                    return;
                                                }
                                                setDiscountValueState(val);
                                            }}
                                            onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); showToast(\`✅ تم تطبيق خصم \${discountValueState} ر.س\`); } }}
                                            style={{ width: '90px', textAlign: 'center', padding: '6px 8px', fontWeight: '700', marginLeft: '10px' }} dir="ltr" />
                                        <span style={{ fontSize: '14px', fontWeight: '600' }}>ر.س</span>
                                        <button onClick={() => { if (discountRate > 0) { showToast(\`✅ تم تطبيق خصم \${discountRate}% = \${fmt(regularDiscountValue)} ر.س\`); } }}
                                            style={{ padding: '6px 14px', borderRadius: '8px', border: 'none', background: discountRate > 0 ? 'var(--primary)' : 'var(--bg-card-hover)', color: discountRate > 0 ? '#fff' : 'var(--text-muted)', cursor: 'pointer', fontWeight: '700', fontSize: '13px', transition: 'all 0.2s' }}>
                                            {t('sys.str_770')}</button>
                                        {(discountRate > 0 || discountValueState > 0) && (
                                            <button onClick={() => { setDiscountRate(0); setDiscountValueState(0); showToast(t('sys.str_847')); }}
                                                style={{ padding: '4px 8px', borderRadius: '6px', border: 'none', background: 'rgba(239,68,68,0.1)', color: '#ef4444', cursor: 'pointer', fontSize: '12px', fontWeight: '600' }}>
                                                {t('sys.str_771')}</button>
                                        )}
                                        <span style={{ marginRight: 'auto', fontWeight: '600', color: discountRate > 0 ? '#ef4444' : 'var(--text-muted)' }}>
                                            {(discountRate > 0 || discountValueState > 0) ? \`- \${fmt(regularDiscountValue)}\` : '0.00'} {t('sys.str_68')}</span>
                                    </div>
                                )}
                                {couponsEnabled && (
                                    <div className="pos-total-row" style={{ display: 'flex', alignItems: 'center', gap: '6px', flexWrap: 'wrap', marginTop: '4px' }}>
                                        <span>{t('sys.str_772')}</span>
                                        <input className="input" type="text"
                                            value={couponCode} onChange={e => setCouponCode(e.target.value)}
                                            onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); applyCoupon(); } }}
                                            placeholder={t('sys.str_848')}
                                            style={{ width: '100px', textAlign: 'center', padding: '6px 8px', fontWeight: '700', textTransform: 'uppercase' }} dir="ltr" disabled={!!appliedCoupon} />
                                        
                                        {!appliedCoupon ? (
                                            <button onClick={applyCoupon} disabled={couponApplying || !couponCode}
                                                style={{ padding: '6px 14px', borderRadius: '8px', border: 'none', background: couponCode ? 'var(--primary)' : 'var(--bg-card-hover)', color: couponCode ? '#fff' : 'var(--text-muted)', cursor: 'pointer', fontWeight: '700', fontSize: '13px', transition: 'all 0.2s' }}>
                                                {couponApplying ? '⏳' : t('sys.str_849')}
                                            </button>
                                        ) : (
                                            <button onClick={() => { setAppliedCoupon(null); setCouponCode(''); showToast(t('sys.str_850')); }}
                                                style={{ padding: '4px 8px', borderRadius: '6px', border: 'none', background: 'rgba(239,68,68,0.1)', color: '#ef4444', cursor: 'pointer', fontSize: '12px', fontWeight: '600' }}>
                                                {t('sys.str_771')}</button>
                                        )}
                                        <span style={{ marginRight: 'auto', fontWeight: '600', color: appliedCoupon ? '#ef4444' : 'var(--text-muted)' }}>
                                            {appliedCoupon ? \`- \${fmt(couponDiscountValue)}\` : '0.00'} {t('sys.str_68')}</span>
                                    </div>
                                )}`;

if (content.includes(targetStr)) {
    content = content.replace(targetStr, newStr);
    console.log("Successfully replaced target string!!");
} else {
    console.log("COULD NOT FIND TARGET STRING!!");
}

fs.writeFileSync(file, content);
