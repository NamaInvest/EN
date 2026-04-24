import React from 'react';
import { useFeatureFlag } from './useFeatureFlag';

export function FeatureGuard({ featureKey, children, fallback = null }: { featureKey: string, children: React.ReactNode, fallback?: React.ReactNode }) {
    const isEnabled = useFeatureFlag(featureKey);
    
    if (!isEnabled) {
        return <>{fallback}</>;
    }
    
    return <>{children}</>;
}
