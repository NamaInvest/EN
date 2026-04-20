'use client';
import { useState, useMemo } from 'react';

interface Module {
  cat: string;
  path: string;
  icon: string;
  title: string;
  desc: string;
  features?: string[];
}

interface Category {
  id: string;
  label: string;
  icon: string;
  color: string;
}

const ICON_MAP: Record<string, string> = {
  ShoppingCart: 'ًں›’', Receipt: 'ًں§¾', Undo: 'â†©ï¸ڈ', Users: 'ًں‘¥', Package: 'ًں“¦',
  Truck: 'ًںڑڑ', BarChart3: 'ًں“ٹ', Calculator: 'ًں§®', CreditCard: 'ًں’³', Building2: 'ًںڈ¢',
  FileText: 'ًں“„', DollarSign: 'ًں’°', TrendingUp: 'ًں“ˆ', Warehouse: 'ًںڈ­', ShoppingBag: 'ًں›چï¸ڈ',
  RefreshCcw: 'ًں”„', UserCheck: 'âœ…', Clock: 'âڈ°', Briefcase: 'ًں’¼', Heart: 'â‌¤ï¸ڈ',
  Shield: 'ًں›،ï¸ڈ', Zap: 'âڑ،', Globe: 'ًںŒگ', Cpu: 'ًں–¥ï¸ڈ', MessageSquare: 'ًں’¬',
  Bot: 'ًں¤–', Camera: 'ًں“·', Archive: 'ًں“‚', Settings: 'âڑ™ï¸ڈ', Key: 'ًں”‘',
  Star: 'â­گ', Award: 'ًںڈ†', Target: 'ًںژ¯', Layers: 'ًں“ڑ', GitBranch: 'ًں”€',
  Factory: 'ًںڈ—ï¸ڈ', Leaf: 'ًںŒ؟', Anchor: 'âڑ“', Radio: 'ًں“،', Thermometer: 'ًںŒ،ï¸ڈ',
  Wrench: 'ًں”§', Car: 'ًںڑ—', Home: 'ًںڈ ', Scissors: 'âœ‚ï¸ڈ', Coffee: 'âک•',
  Music: 'ًںژµ', Book: 'ًں“•', Map: 'ًں—؛ï¸ڈ', Flag: 'ًںڈ³ï¸ڈ', Tool: 'ًں› ï¸ڈ',
  Activity: 'ًں“‰', PieChart: 'ًں¥§', Lock: 'ًں”’', Mail: 'ًں“§', Phone: 'ًں“‍',
  Tablet: 'ًں“±', Monitor: 'ًں–¥ï¸ڈ', Printer: 'ًں–¨ï¸ڈ', Database: 'ًں’¾', Server: 'ًں–§',
  Cloud: 'âکپï¸ڈ', Search: 'ًں”چ', Filter: 'â–¼', Edit: 'âœڈï¸ڈ', Trash: 'ًں—‘ï¸ڈ',
  Plus: 'â‍•', Minus: 'â‍–', Check: 'âœ”ï¸ڈ', X: 'âœ–ï¸ڈ', Info: 'â„¹ï¸ڈ',
  AlertTriangle: 'âڑ ï¸ڈ', HelpCircle: 'â‌“', ChevronRight: 'â€؛', ChevronDown: 'âŒ„',
};

function getIcon(name: string): string {
  return ICON_MAP[name] || 'ًں“‹';
}

const CAT_COLORS: Record<string, { bg: string; text: string; border: string }> = {
  all: { bg: 'bg-indigo-600', text: 'text-white', border: 'border-indigo-600' },
  sales: { bg: 'bg-emerald-600', text: 'text-white', border: 'border-emerald-600' },
  purchases: { bg: 'bg-blue-600', text: 'text-white', border: 'border-blue-600' },
  finance: { bg: 'bg-violet-600', text: 'text-white', border: 'border-violet-600' },
  inventory: { bg: 'bg-amber-600', text: 'text-white', border: 'border-amber-600' },
  hr: { bg: 'bg-rose-600', text: 'text-white', border: 'border-rose-600' },
  crm: { bg: 'bg-cyan-600', text: 'text-white', border: 'border-cyan-600' },
  operations: { bg: 'bg-orange-600', text: 'text-white', border: 'border-orange-600' },
  ai: { bg: 'bg-pink-600', text: 'text-white', border: 'border-pink-600' },
  system: { bg: 'bg-slate-600', text: 'text-white', border: 'border-slate-600' },
};

interface ModuleFilterProps {
  modules: Module[];
  categories: Category[];
}

export default function ModuleFilter({ modules, categories }: ModuleFilterProps) {
  const [activeTab, setActiveTab] = useState('all');
  const [search, setSearch] = useState('');

  const filtered = useMemo(() => {
    let list = activeTab === 'all' ? modules : modules.filter(m => m.cat === activeTab);
    if (search.trim()) {
      const q = search.trim().toLowerCase();
      list = list.filter(m =>
        m.title.toLowerCase().includes(q) || m.desc.toLowerCase().includes(q)
      );
    }
    return list;
  }, [modules, activeTab, search]);

  const counts = useMemo(() => {
    const c: Record<string, number> = { all: modules.length };
    modules.forEach(m => { c[m.cat] = (c[m.cat] || 0) + 1; });
    return c;
  }, [modules]);

  return (
    <section id="modules" style={{
      padding: '60px 20px',
      background: 'linear-gradient(180deg, #f8fafc 0%, #f1f5f9 100%)',
      direction: 'rtl',
    }}>
      {/* Section Header */}
      <div style={{ textAlign: 'center', marginBottom: '40px' }}>
        <h2 style={{ fontSize: '2rem', fontWeight: 800, color: '#0f172a', marginBottom: '8px' }}>
          ط§ط³طھعرض ط§ظ„ظ€ <span style={{ color: '#6366f1' }}>104 ظˆط­ط¯ط©</span> ط§ظ„ط¨ط±ظ…ط¬ظٹط©
        </h2>
        <p style={{ color: '#64748b', fontSize: '1rem' }}>
          ط§ط¶ط؛ط· ط¹ظ„ظ‰ ط£ظٹ ظپط¦ط© ظ„طھطµظپظٹط© ط§ظ„ظˆط­ط¯ط§طھ
        </p>
      </div>

      {/* Search */}
      <div style={{ maxWidth: '500px', margin: '0 auto 32px auto' }}>
        <input
          type="text"
          placeholder="ط§بحث ط¹ظ† ظˆط­ط¯ط©... (ظ…ط«ط§ظ„: ظ…ط®ط²ظˆظ†طŒ فاتورةطŒ ظ…ظˆط¸ظپظٹظ†)"
          value={search}
          onChange={e => setSearch(e.target.value)}
          style={{
            width: '100%', padding: '12px 20px', borderRadius: '12px',
            border: '2px solid #e2e8f0', fontSize: '1rem', fontFamily: "'Lateef', sans-serif",
            direction: 'rtl', outline: 'none', boxSizing: 'border-box',
            boxShadow: '0 2px 8px rgba(0,0,0,0.06)',
          }}
        />
      </div>

      {/* Category Tabs */}
      <div style={{
        display: 'flex', flexWrap: 'wrap', gap: '10px',
        justifyContent: 'center', marginBottom: '36px',
      }}>
        {categories.map(cat => {
          const isActive = activeTab === cat.id;
          const colors = CAT_COLORS[cat.id] || CAT_COLORS.system;
          return (
            <button
              key={cat.id}
              onClick={() => setActiveTab(cat.id)}
              style={{
                padding: '8px 18px',
                borderRadius: '999px',
                border: `2px solid ${isActive ? 'transparent' : '#e2e8f0'}`,
                background: isActive ? '#6366f1' : 'white',
                color: isActive ? 'white' : '#475569',
                fontFamily: "'Lateef', sans-serif",
                fontWeight: 600,
                fontSize: '0.9rem',
                cursor: 'pointer',
                transition: 'all 0.2s',
                display: 'flex', alignItems: 'center', gap: '6px',
                boxShadow: isActive ? '0 4px 12px rgba(99,102,241,0.3)' : 'none',
              }}
            >
              <span>{cat.icon}</span>
              <span>{cat.label}</span>
              <span style={{
                background: isActive ? 'rgba(255,255,255,0.25)' : '#f1f5f9',
                color: isActive ? 'white' : '#64748b',
                borderRadius: '999px',
                padding: '1px 8px',
                fontSize: '0.8rem',
                fontWeight: 700,
              }}>{counts[cat.id] || 0}</span>
            </button>
          );
        })}
      </div>

      {/* Module Cards Grid */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))',
        gap: '16px',
        maxWidth: '1200px',
        margin: '0 auto',
      }}>
        {filtered.map(mod => (
          <div key={mod.path} style={{
            background: 'white',
            borderRadius: '16px',
            padding: '20px',
            border: '1px solid #e2e8f0',
            transition: 'all 0.2s',
            cursor: 'default',
            boxShadow: '0 2px 8px rgba(0,0,0,0.04)',
          }}
            onMouseEnter={e => {
              (e.currentTarget as HTMLDivElement).style.transform = 'translateY(-3px)';
              (e.currentTarget as HTMLDivElement).style.boxShadow = '0 8px 24px rgba(99,102,241,0.15)';
              (e.currentTarget as HTMLDivElement).style.borderColor = '#c7d2fe';
            }}
            onMouseLeave={e => {
              (e.currentTarget as HTMLDivElement).style.transform = 'translateY(0)';
              (e.currentTarget as HTMLDivElement).style.boxShadow = '0 2px 8px rgba(0,0,0,0.04)';
              (e.currentTarget as HTMLDivElement).style.borderColor = '#e2e8f0';
            }}
          >
            <div style={{ display: 'flex', alignItems: 'flex-start', gap: '14px' }}>
              <div style={{
                width: '44px', height: '44px', borderRadius: '12px',
                background: 'linear-gradient(135deg, #6366f1 0%, #4f46e5 100%)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: '1.3rem', flexShrink: 0,
              }}>
                {getIcon(mod.icon)}
              </div>
              <div style={{ flex: 1 }}>
                <h3 style={{ margin: '0 0 4px 0', fontSize: '1rem', fontWeight: 700, color: '#0f172a' }}>
                  {mod.title}
                </h3>
                <p style={{ margin: 0, fontSize: '0.83rem', color: '#64748b', lineHeight: 1.5 }}>
                  {mod.desc}
                </p>
              </div>
            </div>
          </div>
        ))}
      </div>

      {filtered.length === 0 && (
        <div style={{ textAlign: 'center', padding: '60px 20px', color: '#94a3b8' }}>
          <div style={{ fontSize: '3rem', marginBottom: '12px' }}>ًں”چ</div>
          <p style={{ fontSize: '1.1rem' }}>لا طھظˆط¬ط¯ ظˆط­ط¯ط§طھ طھط·ط§ط¨ظ‚ ط§ظ„بحث</p>
        </div>
      )}

      {/* Count */}
      <p style={{ textAlign: 'center', color: '#94a3b8', marginTop: '32px', fontSize: '0.9rem' }}>
        عرض <strong style={{ color: '#6366f1' }}>{filtered.length}</strong> ظ…ظ† ط£طµظ„{' '}
        <strong>{modules.length}</strong> ظˆط­ط¯ط©
      </p>
    </section>
  );
}

