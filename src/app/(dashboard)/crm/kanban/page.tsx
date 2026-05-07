'use client';
import { useState, useEffect } from 'react';
import { useTranslation } from '@/lib/i18n';

type KanbanCard = { id: number; title: string; subtitle?: string; amount?: number };
type KanbanCol = { id: string; title: string; titleAr: string; color: string; cards: KanbanCard[]; count: number };

export default function KanbanPage() {
  const { lang: language } = useTranslation();
  const isAr = language === 'ar';
  const [columns, setColumns] = useState<KanbanCol[]>([]);
  const [dragging, setDragging] = useState<{ cardId: number; fromCol: string } | null>(null);

  useEffect(() => {
    fetch('/api/system/kanban?preset=crm_leads').then(r => r.json()).then(d => setColumns(d.board || [])).catch(() => {});
  }, []);

  const moveCard = async (cardId: number, newStatus: string) => {
    await fetch('/api/system/kanban', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ preset: 'crm_leads', cardId, newStatus }),
    });
    // Optimistic update
    setColumns(prev => {
      const card = prev.flatMap(c => c.cards).find(c => c.id === cardId);
      if (!card) return prev;
      return prev.map(col => ({
        ...col,
        cards: col.id === newStatus ? [...col.cards, card] : col.cards.filter(c => c.id !== cardId),
        count: col.id === newStatus ? col.count + 1 : col.cards.filter(c => c.id !== cardId).length,
      }));
    });
  };

  return (
    <div style={{ padding: 24, direction: isAr ? 'rtl' : 'ltr' }}>
      <h1 style={{ fontSize: 24, fontWeight: 700, marginBottom: 20 }}>{isAr ? '📋 لوحة CRM' : '📋 CRM Board'}</h1>
      <div style={{ display: 'flex', gap: 12, overflowX: 'auto', paddingBottom: 20 }}>
        {columns.map(col => (
          <div key={col.id} style={{ minWidth: 240, background: '#f8f9fa', borderRadius: 12, padding: 12, borderTop: `3px solid ${col.color}` }}
            onDragOver={e => e.preventDefault()}
            onDrop={() => { if (dragging) { moveCard(dragging.cardId, col.id); setDragging(null); } }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12, padding: '4px 8px' }}>
              <span style={{ fontWeight: 700, fontSize: 14 }}>{isAr ? col.titleAr : col.title}</span>
              <span style={{ background: col.color, color: '#fff', borderRadius: 12, padding: '2px 8px', fontSize: 11, fontWeight: 600 }}>{col.count}</span>
            </div>
            {col.cards.map(card => (
              <div key={card.id} draggable onDragStart={() => setDragging({ cardId: card.id, fromCol: col.id })}
                style={{ background: '#fff', borderRadius: 8, padding: 12, marginBottom: 8, boxShadow: '0 1px 3px rgba(0,0,0,0.08)', cursor: 'grab', transition: 'transform 0.15s', border: '1px solid #f0f0f0' }}>
                <div style={{ fontWeight: 600, fontSize: 13, marginBottom: 4 }}>{card.title}</div>
                {card.subtitle && <div style={{ fontSize: 11, color: '#888' }}>{card.subtitle}</div>}
                {card.amount && <div style={{ fontSize: 12, color: '#4CAF50', fontWeight: 600, marginTop: 4 }}>{card.amount.toLocaleString()} {isAr ? 'ر.س' : 'SAR'}</div>}
              </div>
            ))}
            {col.cards.length === 0 && <div style={{ textAlign: 'center', color: '#ccc', padding: 20, fontSize: 12 }}>{isAr ? 'فارغ' : 'Empty'}</div>}
          </div>
        ))}
      </div>
    </div>
  );
}
