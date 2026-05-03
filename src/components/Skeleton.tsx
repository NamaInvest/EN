import React from 'react';

interface SkeletonProps {
    className?: string;
    type?: 'text' | 'circular' | 'rectangular' | 'table';
    rows?: number;
}

export function Skeleton({ className = '', type = 'text', rows = 3 }: SkeletonProps) {
    const baseClass = "animate-pulse bg-gray-200 dark:bg-gray-700";

    if (type === 'circular') {
        return <div className={`rounded-full ${baseClass} ${className}`}></div>;
    }

    if (type === 'rectangular') {
        return <div className={`rounded-lg ${baseClass} ${className}`}></div>;
    }

    if (type === 'table') {
        return (
            <div className="w-full space-y-4">
                {/* Header skeleton */}
                <div className={`h-10 w-full rounded-lg ${baseClass}`}></div>
                {/* Rows skeleton */}
                {Array.from({ length: rows }).map((_, i) => (
                    <div key={i} className="flex gap-4">
                        <div className={`h-8 w-1/4 rounded ${baseClass}`}></div>
                        <div className={`h-8 w-1/4 rounded ${baseClass}`}></div>
                        <div className={`h-8 w-1/4 rounded ${baseClass}`}></div>
                        <div className={`h-8 w-1/4 rounded ${baseClass}`}></div>
                    </div>
                ))}
            </div>
        );
    }

    // Default: text
    return <div className={`h-4 rounded ${baseClass} ${className}`}></div>;
}
