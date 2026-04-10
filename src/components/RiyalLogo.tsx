import React from 'react';

export const RiyalLogo = ({ width = 24, height = 24, className = '', color = 'currentColor' }: { width?: number | string, height?: number | string, className?: string, color?: string }) => {
    return (
        <svg 
            width={width} 
            height={height} 
            viewBox="0 0 100 100" 
            fill={color} 
            className={className}
            xmlns="http://www.w3.org/2000/svg"
            style={{ display: 'inline-block', verticalAlign: 'middle' }}
        >
            <path d="M42.5 10 L42.5 50 L20 55 L20 40 L30 37.5 L30 10 Z" />
            <path d="M42.5 58 L42.5 75 C 42.5 85, 30 90, 15 90 L 15 78 C 25 78, 30 75, 30 65 L 30 60 L 20 62 L 20 48 Z" />
            <path d="M57.5 10 L57.5 60 L80 55 L80 40 L67.5 42.5 L67.5 10 Z" />
            <path d="M57.5 68 L57.5 90 L85 85 L85 75 L67.5 78 L67.5 68 Z" />
        </svg>
    );
};
