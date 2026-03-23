import Sidebar from '@/components/Sidebar';
import ThemeSwitcher from '@/components/ThemeSwitcher';
import LanguageSwitcher from '@/components/LanguageSwitcher';
import SessionGuard from '@/components/SessionGuard';
import InactivityGuard from '@/components/InactivityGuard';
import SubscriptionGuard from '@/components/SubscriptionGuard';
import StockNotificationBell from '@/components/StockNotificationBell';
import AICopilotButton from '@/components/AICopilotButton';
import GlobalErrorBoundary from '@/components/GlobalErrorBoundary';
import { I18nProvider } from '@/lib/i18n';
import { SettingsProvider } from '@/lib/SettingsContext';

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
                    <div className="top-bar">
                        <div className="top-bar-spacer" />
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
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
