import Sidebar from '@/components/Sidebar';
import HijriDate from '@/components/HijriDate';
import ThemeSwitcher from '@/components/ThemeSwitcher';
import LanguageSwitcher from '@/components/LanguageSwitcher';
import SessionGuard from '@/components/SessionGuard';
import InactivityGuard from '@/components/InactivityGuard';
import SubscriptionGuard from '@/components/SubscriptionGuard';
import TrialBanner from '@/components/TrialBanner';
import StockNotificationBell from '@/components/StockNotificationBell';
import AICopilotButton from '@/components/AICopilotButton';
import GlobalErrorBoundary from '@/components/GlobalErrorBoundary';
import PrintButton from '@/components/PrintButton';
import { I18nProvider } from '@/lib/i18n';
import { SettingsProvider } from '@/lib/SettingsContext';
import { ToastProvider } from '@/components/Toast';
import { _t } from '@/lib/server-t';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export default async function DashboardLayout({
 children,
}: {
 children: React.ReactNode;
}) {
 const title = await _t('نظام نما إنفست', 'Nama Invest System');
 const mobileTitle = await _t('نما إنفست', 'Nama Invest');

 return (
 <I18nProvider>
 <SettingsProvider>
 <ToastProvider>
 <GlobalErrorBoundary>
 <div className="app-layout">
 <SessionGuard />
 <InactivityGuard />
 <SubscriptionGuard />
 <AICopilotButton />
 <Sidebar />
 <main className="main-content flex flex-col h-screen overflow-hidden">
 {/* Top Header Semantic UI */}
 <header className="bg-[var(--bg-darker)] border-b border-[var(--border)] px-4 md:px-7 py-3 flex items-center justify-between sticky top-0 z-40 shadow-sm w-full">
 
 {/* Left area / Mobile Title */}
 <div className="flex-1 flex justify-start">
 <h1 className="text-xl md:text-3xl font-black bg-clip-text text-transparent bg-[var(--gradient-primary)] font-['Noto_Sans_Arabic',sans-serif] tracking-tight truncate max-w-full">
 <span className="hidden sm:inline">{title}</span>
 <span className="sm:hidden">{mobileTitle}</span>
 </h1>
 </div>

 {/* Right area - Toolbars */}
 <div className="flex items-center gap-2 md:gap-4 flex-shrink-0">
 <div className="hidden md:block">
 <HijriDate />
 </div>
 <PrintButton />
 <StockNotificationBell />
 <LanguageSwitcher />
 <ThemeSwitcher />
 </div>
 </header>
 
 {/* Trial Tracking UI */}
 <TrialBanner />
 
 {/* Content Area */}
 <div className="flex-1 overflow-auto bg-[var(--bg-base)]">
 {children}
 </div>
 </main>
 </div>
 </GlobalErrorBoundary>
 </ToastProvider>
 </SettingsProvider>
 </I18nProvider>
 );
}

