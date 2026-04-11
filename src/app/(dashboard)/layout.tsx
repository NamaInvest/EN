import Sidebar from '@/components/Sidebar';
import ThemeSwitcher from '@/components/ThemeSwitcher';
import LanguageSwitcher from '@/components/LanguageSwitcher';
import SessionGuard from '@/components/SessionGuard';
import InactivityGuard from '@/components/InactivityGuard';
import SubscriptionGuard from '@/components/SubscriptionGuard';
import StockNotificationBell from '@/components/StockNotificationBell';
import AICopilotButton from '@/components/AICopilotButton';
import GlobalErrorBoundary from '@/components/GlobalErrorBoundary';
import PrintButton from '@/components/PrintButton';
import { I18nProvider } from '@/lib/i18n';
import { SettingsProvider } from '@/lib/SettingsContext';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export default function DashboardLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return (
        <I18nProvider>
            <SettingsProvider>
                <GlobalErrorBoundary>
                    <div className="app-layout">
                        <SessionGuard />
                        <InactivityGuard />
                        <SubscriptionGuard />
                        <AICopilotButton />
                        <Sidebar />
                <main className="main-content">
                    {/* Top bar with theme and language switchers */}
                    <div className="top-bar" style={{
                        background: 'var(--bg-darker)',
                        borderBottom: '1px solid var(--border)',
                        padding: '12px 28px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'flex-end',
                        position: 'sticky',
                        top: 0,
                        zIndex: 40
                    }}>
                        <div style={{
                            position: 'absolute',
                            left: '50%',
                            transform: 'translateX(-50%)',
                            fontSize: '32px',
                            fontWeight: '900',
                            background: 'var(--gradient-primary)',
                            WebkitBackgroundClip: 'text',
                            WebkitTextFillColor: 'transparent',
                            fontFamily: "'Cairo', sans-serif",
                            letterSpacing: '-0.5px'
                        }}>
                            نظام نما انفست
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                            <PrintButton />
                            <StockNotificationBell />
                            <LanguageSwitcher />
                            <ThemeSwitcher />
                        </div>
                    </div>
                    {children}
                </main>
            </div>
            </GlobalErrorBoundary>
            </SettingsProvider>
        </I18nProvider>
    );
}
