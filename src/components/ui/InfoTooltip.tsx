"use client";

import React, { useState } from 'react';

export function InfoTooltip({ topic }: { topic: string }) {
    const [isHovered, setIsHovered] = useState(false);
    const [content, setContent] = useState('');

    const fetchTooltip = async () => {
        setIsHovered(true);
        if (!content) {
            try {
                const res = await fetch(`/api/help?topic=${topic}`);
                if (res.ok) {
                    const data = await res.json();
                    setContent(data.content);
                } else {
                    setContent('No info available.');
                }
            } catch (e) {
                setContent('Error loading info.');
            }
        }
    };

    return (
        <span 
            className="relative inline-block ml-1"
            onMouseEnter={fetchTooltip}
            onMouseLeave={() => setIsHovered(false)}
        >
            <span className="text-gray-400 hover:text-teal-600 cursor-help transition-colors text-sm">
                ⓘ
            </span>
            
            {isHovered && content && (
                <div className="absolute z-10 w-64 p-3 mt-2 text-sm text-white bg-gray-900 rounded-lg shadow-lg bottom-full left-1/2 transform -translate-x-1/2 mb-2">
                    <p className="text-right whitespace-pre-wrap">{content}</p>
                    <div className="absolute bottom-[-6px] left-1/2 transform -translate-x-1/2 border-t-8 border-t-gray-900 border-l-8 border-l-transparent border-r-8 border-r-transparent"></div>
                </div>
            )}
        </span>
    );
}
