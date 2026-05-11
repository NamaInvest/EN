'use client';

/**
 * Mobile Layout Wrapper
 * ──────────────────────────────────────────────────────────
 * Wraps content to provide a responsive, touch-friendly UI on mobile devices.
 * Features a bottom navigation bar and collapsible sidebar.
 */

import React, { useState, useEffect } from 'react';

interface MobileLayoutProps {
  children: React.ReactNode;
  sidebar: React.ReactNode;
  title?: string;
  actions?: React.ReactNode;
}

export function MobileLayout({ children, sidebar, title = 'نما إنفست', actions }: MobileLayoutProps) {
  const [isMobile, setIsMobile] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 768);
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  if (!isMobile) {
    // Desktop layout
    return (
      <div style={{ display: 'flex', minHeight: '100vh', background: 'var(--bg-default, #f3f4f6)' }}>
        <aside style={{ width: '260px', background: 'var(--bg-white dark:bg-slate-900, #fff)', borderLeft: '1px solid var(--border-color, #e5e7eb)', flexShrink: 0 }}>
          {sidebar}
        </aside>
        <main style={{ flex: 1, padding: '2rem', overflowY: 'auto' }}>
          <header style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '2rem' }}>
            <h1 style={{ margin: 0, fontSize: '1.5rem', color: 'var(--text-primary, #111827)' }}>{title}</h1>
            <div>{actions}</div>
          </header>
          {children}
        </main>
      </div>
    );
  }

  // Mobile layout
  return (
    <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh', background: 'var(--bg-default, #f3f4f6)' }}>
      {/* Top Header */}
      <header style={{ 
        display: 'flex', justifyContent: 'space-between', alignItems: 'center', 
        padding: '1rem', background: 'var(--bg-white dark:bg-slate-900, #fff)', borderBottom: '1px solid var(--border-color, #e5e7eb)',
        position: 'sticky', top: 0, zIndex: 40
      }}>
        <button onClick={() => setSidebarOpen(true)} style={{ background: 'none', border: 'none', fontSize: '1.5rem', cursor: 'pointer' }}>
          ☰
        </button>
        <h1 style={{ margin: 0, fontSize: '1.2rem', color: 'var(--text-primary, #111827)' }}>{title}</h1>
        <div>{actions}</div>
      </header>

      {/* Main Content */}
      <main style={{ flex: 1, padding: '1rem', overflowY: 'auto', paddingBottom: '80px' }}>
        {children}
      </main>

      {/* Mobile Drawer (Sidebar) */}
      {sidebarOpen && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 50, display: 'flex' }}>
          <div 
            style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.5)' }} 
            onClick={() => setSidebarOpen(false)} 
          />
          <aside style={{ 
            position: 'relative', width: '280px', height: '100%', background: 'var(--bg-white dark:bg-slate-900, #fff)',
            transform: sidebarOpen ? 'translateX(0)' : 'translateX(100%)', transition: 'transform 0.3s ease-in-out',
            display: 'flex', flexDirection: 'column'
          }}>
            <div style={{ padding: '1rem', borderBottom: '1px solid var(--border-color, #e5e7eb)', display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ fontWeight: 'bold' }}>القائمة الرئيسية</span>
              <button onClick={() => setSidebarOpen(false)} style={{ background: 'none', border: 'none', fontSize: '1.2rem' }}>✕</button>
            </div>
            <div style={{ flex: 1, overflowY: 'auto' }}>
              {sidebar}
            </div>
          </aside>
        </div>
      )}

      {/* Bottom Navigation */}
      <nav style={{
        position: 'fixed', bottom: 0, left: 0, right: 0, height: '60px',
        background: 'var(--bg-white dark:bg-slate-900, #fff)', borderTop: '1px solid var(--border-color, #e5e7eb)',
        display: 'flex', justifyContent: 'space-around', alignItems: 'center', zIndex: 40
      }}>
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', fontSize: '0.7rem', color: 'var(--text-secondary, #6b7280)' }}>
          <span style={{ fontSize: '1.2rem' }}>🏠</span>
          <span>الرئيسية</span>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', fontSize: '0.7rem', color: 'var(--text-secondary, #6b7280)' }}>
          <span style={{ fontSize: '1.2rem' }}>📊</span>
          <span>التقارير</span>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', fontSize: '0.7rem', color: '#6366f1' }}>
          <span style={{ fontSize: '1.2rem' }}>➕</span>
          <span>إضافة</span>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', fontSize: '0.7rem', color: 'var(--text-secondary, #6b7280)' }}>
          <span style={{ fontSize: '1.2rem' }}>⚙️</span>
          <span>الإعدادات</span>
        </div>
      </nav>
    </div>
  );
}
