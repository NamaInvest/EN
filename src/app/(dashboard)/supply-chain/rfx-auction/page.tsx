'use client';

import { useState, useEffect, useCallback } from 'react';
import { useTranslation } from '@/lib/i18n';
import { Hammer, RefreshCw, TrendingDown, DollarSign, Clock, CheckCircle, Package, ArrowDownToLine } from 'lucide-react';

interface Bid {
  vendorName: string;
  bidAmount: number;
  deliveryDays: number;
  qualityScore: number;
  submissionTime: string;
  isWinning: boolean;
}

interface RFxAuction {
  id: string;
  itemName: string;
  quantity: number;
  targetPrice: number;
  auctionEndTime: string;
  status: string;
  bids: Bid[];
  bestBidAmount: number | null;
  savings: number;
}

interface RFxAuctionData {
  asOfDate: string;
  auctions: RFxAuction[];
  summary: {
    activeAuctionsCount: number;
    totalTargetSpend: number;
    projectedSavings: number;
    bidsReceived: number;
  };
}

export default function RFxAuctionPage() {
  const { lang } = useTranslation();
  const _t = (ar: string, en: string) => lang === 'ar' ? ar : en;

  const [data, setData] = useState<RFxAuctionData | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  const fetchRFxData = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/supply-chain/rfx-auction`);
      const json = await res.json();
      if (json.success) {
        setData(json.data);
      } else {
        alert(json.error || 'Failed to fetch RFx Data');
      }
    } catch (err) {
      console.error(err);
      alert('Network error fetching RFx data');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchRFxData();
  }, [fetchRFxData]);

  const formatCurrency = (num: number) => {
    return new Intl.NumberFormat(lang === 'ar' ? 'ar-SA' : 'en-US', {
      style: 'currency',
      currency: 'SAR',
      minimumFractionDigits: 0
    }).format(num);
  };

  const renderStatus = (status: string) => {
    switch(status) {
      case 'ACTIVE': return <span style={{ background: '#DCFCE7', color: '#166534', padding: '6px 12px', borderRadius: '999px', fontSize: '12px', fontWeight: '800', display: 'flex', alignItems: 'center', gap: '4px' }}><Activity size={14}/> {_t('نشط', 'Active')}</span>;
      case 'CLOSED': return <span style={{ background: '#F1F5F9', color: '#475569', padding: '6px 12px', borderRadius: '999px', fontSize: '12px', fontWeight: '800', display: 'flex', alignItems: 'center', gap: '4px' }}><CheckCircle size={14}/> {_t('مغلق', 'Closed')}</span>;
      default: return <span style={{ background: 'var(--bg-muted)', color: 'var(--text-muted)', padding: '6px 12px', borderRadius: '999px', fontSize: '12px', fontWeight: '800', display: 'flex', alignItems: 'center', gap: '4px' }}><Clock size={14}/> {_t('مسودة', 'Draft')}</span>;
    }
  };

  // Helper Activity icon for active status
  const Activity = ({ size }: { size: number }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="22 12 18 12 15 21 9 3 6 12 2 12"></polyline></svg>
  );

  return (
    <div style={{ padding: '24px', animation: 'fadeIn 0.5s ease', maxWidth: '1400px', margin: '0 auto' }}>
      
      {/* Header section */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '32px', flexWrap: 'wrap', gap: '16px' }}>
        <div>
          <h1 style={{ fontSize: '28px', fontWeight: '900', display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '8px', color: 'var(--text)' }}>
            <Hammer size={32} color="#6366F1" />
            {_t('المناقصات العكسية (RFx)', 'RFx Reverse Auctions')}
          </h1>
          <p style={{ color: 'var(--text-muted)', fontSize: '14px', maxWidth: '650px', lineHeight: '1.6' }}>
            {_t(
              'منصة المناقصات العكسية التي تسمح للموردين بالتنافس لتخفيض الأسعار الحية (Bidding Down)، مما يعظم الوفورات المالية للمشتريات الاستراتيجية.',
              'Reverse auction platform allowing suppliers to compete by bidding downwards in real-time, maximizing financial savings for strategic procurement.'
            )}
          </p>
        </div>
        
        <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
          <button onClick={fetchRFxData} style={{ padding: '10px 16px', background: '#6366F1', color: 'white', borderRadius: '8px', cursor: 'pointer', transition: 'all 0.2s', border: 'none', display: 'flex', alignItems: 'center', gap: '8px', fontWeight: 'bold', boxShadow: '0 4px 6px -1px rgba(99, 102, 241, 0.2)' }}>
            <RefreshCw size={16} className={loading ? 'animate-spin' : ''} />
            {_t('تحديث العطاءات', 'Refresh Bids')}
          </button>
        </div>
      </div>

      {/* KPI Stats */}
      {data && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '20px', marginBottom: '32px' }}>
          
          <div style={{ padding: '24px', background: 'var(--bg-card)', borderRadius: '16px', borderLeft: '4px solid #6366F1', boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.05)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
              <div style={{ color: 'var(--text-muted)', fontSize: '14px', fontWeight: '600' }}>{_t('المناقصات النشطة', 'Active Auctions')}</div>
              <Activity size={24} />
            </div>
            <div style={{ fontSize: '32px', fontWeight: '900', color: '#6366F1', fontFamily: 'monospace' }}>
              {data.summary.activeAuctionsCount}
            </div>
          </div>

          <div style={{ padding: '24px', background: 'var(--bg-card)', borderRadius: '16px', borderLeft: '4px solid #10B981', boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.05)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
              <div style={{ color: 'var(--text-muted)', fontSize: '14px', fontWeight: '600' }}>{_t('الوفورات المحققة', 'Projected Savings')}</div>
              <TrendingDown size={24} color="#10B981" />
            </div>
            <div style={{ fontSize: '32px', fontWeight: '900', color: '#10B981', fontFamily: 'monospace' }}>
              {formatCurrency(data.summary.projectedSavings)}
            </div>
          </div>

          <div style={{ padding: '24px', background: 'var(--bg-card)', borderRadius: '16px', borderLeft: '4px solid #F59E0B', boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.05)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
              <div style={{ color: 'var(--text-muted)', fontSize: '14px', fontWeight: '600' }}>{_t('العطاءات المستلمة', 'Bids Received')}</div>
              <ArrowDownToLine size={24} color="#F59E0B" />
            </div>
            <div style={{ fontSize: '32px', fontWeight: '900', color: '#F59E0B', fontFamily: 'monospace' }}>
              {data.summary.bidsReceived}
            </div>
          </div>

          <div style={{ padding: '24px', background: 'var(--bg-card)', borderRadius: '16px', borderLeft: '4px solid #475569', boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.05)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
              <div style={{ color: 'var(--text-muted)', fontSize: '14px', fontWeight: '600' }}>{_t('إجمالي الميزانية المستهدفة', 'Total Target Spend')}</div>
              <DollarSign size={24} color="#475569" />
            </div>
            <div style={{ fontSize: '32px', fontWeight: '900', color: '#475569', fontFamily: 'monospace' }}>
              {formatCurrency(data.summary.totalTargetSpend)}
            </div>
          </div>

        </div>
      )}

      {/* Details Table */}
      <div style={{ background: 'var(--bg-card)', borderRadius: '16px', overflow: 'hidden', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.05)', border: '1px solid var(--border)' }}>
        <div style={{ padding: '20px', borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'center', gap: '10px' }}>
          <Package size={20} color="#6366F1" />
          <h2 style={{ fontSize: '18px', fontWeight: '700', margin: 0, color: 'var(--text)' }}>{_t('سجل المناقصات', 'Auction Room')}</h2>
        </div>
        
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: lang === 'ar' ? 'right' : 'left' }}>
            <thead>
              <tr style={{ background: 'var(--bg-muted)' }}>
                <th style={{ padding: '16px 20px', fontWeight: '700', fontSize: '13px', color: 'var(--text-muted)' }}>{_t('رقم / اسم المناقصة', 'Auction Ref')}</th>
                <th style={{ padding: '16px 20px', fontWeight: '700', fontSize: '13px', color: 'var(--text-muted)' }}>{_t('الميزانية المستهدفة', 'Target Price')}</th>
                <th style={{ padding: '16px 20px', fontWeight: '700', fontSize: '13px', color: 'var(--text-muted)' }}>{_t('أفضل عطاء', 'Best Bid')}</th>
                <th style={{ padding: '16px 20px', fontWeight: '700', fontSize: '13px', color: 'var(--text-muted)', borderLeft: '2px solid var(--border)', borderRight: '2px solid var(--border)' }}>{_t('التوفير (Savings)', 'Savings')}</th>
                <th style={{ padding: '16px 20px', fontWeight: '700', fontSize: '13px', color: 'var(--text-muted)' }}>{_t('المورد الفائز/الرائد', 'Winning Vendor')}</th>
                <th style={{ padding: '16px 20px', fontWeight: '700', fontSize: '13px', color: 'var(--text-muted)' }}>{_t('الحالة', 'Status')}</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={6} style={{ padding: '60px', textAlign: 'center', color: 'var(--text-muted)' }}>
                    <RefreshCw size={32} className="animate-spin" style={{ margin: '0 auto 12px' }} />
                    <div style={{ fontSize: '16px' }}>{_t('جاري مزامنة العطاءات الحية...', 'Syncing live bids...')}</div>
                  </td>
                </tr>
              ) : data?.auctions.length === 0 ? (
                <tr>
                  <td colSpan={6} style={{ padding: '60px', textAlign: 'center', color: 'var(--text-muted)' }}>
                    <Hammer size={48} style={{ margin: '0 auto 12px', opacity: 0.3 }} />
                    <div style={{ fontSize: '16px' }}>{_t('لا توجد مناقصات', 'No auctions found')}</div>
                  </td>
                </tr>
              ) : (
                data?.auctions.map((row, idx) => (
                  <tr key={idx} style={{ borderBottom: '1px solid var(--border)', transition: 'background 0.2s' }}>
                    <td style={{ padding: '16px 20px', fontWeight: '600', color: 'var(--text)' }}>
                      {row.itemName}
                      <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '4px', fontFamily: 'monospace' }}>{row.id} • {row.bids.length} {_t('عطاءات', 'Bids')}</div>
                    </td>
                    <td style={{ padding: '16px 20px', fontFamily: 'monospace', fontWeight: '500', color: 'var(--text-muted)' }}>
                      {formatCurrency(row.targetPrice)}
                    </td>
                    <td style={{ padding: '16px 20px', fontFamily: 'monospace', fontWeight: '800', color: row.bestBidAmount ? (row.bestBidAmount < row.targetPrice ? '#10B981' : '#F59E0B') : 'var(--text-muted)' }}>
                      {row.bestBidAmount ? formatCurrency(row.bestBidAmount) : '-'}
                    </td>
                    <td style={{ padding: '16px 20px', fontFamily: 'monospace', fontWeight: '900', borderLeft: '2px solid var(--border)', borderRight: '2px solid var(--border)', color: row.savings > 0 ? '#10B981' : 'var(--text-muted)' }}>
                      {row.savings > 0 ? `+${formatCurrency(row.savings)}` : '-'}
                    </td>
                    <td style={{ padding: '16px 20px' }}>
                      {row.bestBidAmount ? (
                        <div>
                          <div style={{ fontWeight: '600', fontSize: '13px' }}>{row.bids.find(b => b.isWinning)?.vendorName}</div>
                          <div style={{ fontSize: '10px', color: 'var(--text-muted)', marginTop: '2px' }}>
                            {_t('التوصيل:', 'Delivery:')} {row.bids.find(b => b.isWinning)?.deliveryDays} {_t('أيام', 'Days')}
                          </div>
                        </div>
                      ) : (
                        <span style={{ fontSize: '13px', color: 'var(--text-muted)' }}>{_t('بانتظار العطاءات', 'Awaiting bids')}</span>
                      )}
                    </td>
                    <td style={{ padding: '16px 20px' }}>
                      {renderStatus(row.status)}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      <style>{`
        .animate-spin { animation: spin 1s linear infinite; }
        @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
        @keyframes fadeIn { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }
      `}</style>
    </div>
  );
}
