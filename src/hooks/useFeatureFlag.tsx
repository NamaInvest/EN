'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';

type FeatureContextType = {
    flags: Record<string, boolean>;
    loading: boolean;
};

const FeatureContext = createContext<FeatureContextType>({ flags: {}, loading: true });

export function FeatureProvider({ children, tenantAccountId }: { children: React.ReactNode, tenantAccountId?: number }) {
    const [flags, setFlags] = useState<Record<string, boolean>>({});
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchFlags = async () => {
            if (!tenantAccountId) {
                // Read from local storage if no account id provided
                try {
                    const cached = localStorage.getItem('tenant_feature_flags');
                    if (cached) {
                        const parsed = JSON.parse(cached);
                        const map: Record<string, boolean> = {};
                        parsed.forEach((f: any) => map[f.moduleName] = f.isEnabled);
                        setFlags(map);
                    }
                } catch {}
                setLoading(false);
                return;
            }

            try {
                const res = await fetch(`/api/ice/tenant-features?tenantAccountId=${tenantAccountId}`);
                if (res.ok) {
                    const data = await res.json();
                    if (data.success && data.flags) {
                        const map: Record<string, boolean> = {};
                        data.flags.forEach((f: any) => map[f.moduleName] = f.isEnabled);
                        setFlags(map);
                        localStorage.setItem('tenant_feature_flags', JSON.stringify(data.flags));
                    }
                }
            } catch (e) {
                console.error("Failed to fetch feature flags", e);
            } finally {
                setLoading(false);
            }
        };

        fetchFlags();
    }, [tenantAccountId]);

    return (
        <FeatureContext.Provider value={{ flags, loading }}>
            {children}
        </FeatureContext.Provider>
    );
}

export function useFeatureFlag(featureKey: string, defaultValue: boolean = true) {
    const { flags, loading } = useContext(FeatureContext);
    
    // If still loading, return default to prevent UI flicker
    if (loading) return defaultValue;

    // If flag is explicitly set to false, return false
    if (flags[featureKey] === false) return false;

    // Otherwise return true (allow by default)
    return true;
}
