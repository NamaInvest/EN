'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';

// Define the setting object shape based on previous API responses
export interface Setting {
    id: number;
    key: string;
    value: string;
    description: string;
}

interface SettingsContextType {
    settings: Setting[];
    loading: boolean;
    getSetting: (key: string, defaultValue?: string) => string;
    refreshSettings: () => Promise<void>;
}

const SettingsContext = createContext<SettingsContextType | undefined>(undefined);

export function SettingsProvider({ children }: { children: React.ReactNode }) {
    const [settings, setSettings] = useState<Setting[]>([]);
    const [loading, setLoading] = useState(true);

    const fetchSettings = async () => {
        try {
            const token = localStorage.getItem('token');
            if (!token) return;
            const res = await fetch('/api/settings', {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (res.ok) {
                const data = await res.json();
                setSettings(data);
            }
        } catch (error) {
            console.error('Failed to fetch settings:', error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchSettings();
    }, []);

    const getSetting = (key: string, defaultValue: string = '') => {
        const setting = settings.find(s => s.key === key);
        return setting ? setting.value : defaultValue;
    };

    return (
        <SettingsContext.Provider value={{ settings, loading, getSetting, refreshSettings: fetchSettings }}>
            {children}
        </SettingsContext.Provider>
    );
}

export function useSettings() {
    const context = useContext(SettingsContext);
    if (context === undefined) {
        throw new Error('useSettings must be used within a SettingsProvider');
    }
    return context;
}
