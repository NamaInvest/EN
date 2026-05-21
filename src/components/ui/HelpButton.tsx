"use client";

import React, { useState } from 'react';

export function HelpButton({ role }: { role: string }) {
    const [isOpen, setIsOpen] = useState(false);
    const [content, setContent] = useState('Loading...');

    const openHelp = async () => {
        setIsOpen(true);
        try {
            const res = await fetch(`/api/help?role=${role}`);
            if (res.ok) {
                const data = await res.json();
                setContent(data.content);
            } else {
                setContent('Help manual not found for this role.');
            }
        } catch (e) {
            setContent('Failed to load help.');
        }
    };

    return (
        <>
            <button 
                onClick={openHelp}
                className="fixed bottom-6 right-6 w-12 h-12 bg-teal-600 text-white rounded-full shadow-lg flex items-center justify-center hover:bg-teal-700 transition-colors z-50 text-xl font-bold"
            >
                ?
            </button>

            {isOpen && (
                <div className="fixed inset-y-0 right-0 w-96 bg-white shadow-2xl z-50 flex flex-col border-l border-gray-200">
                    <div className="p-4 border-b border-gray-200 flex justify-between items-center bg-gray-50">
                        <h2 className="text-lg font-bold text-teal-800">In-App Help</h2>
                        <button onClick={() => setIsOpen(false)} className="text-gray-500 hover:text-red-500 font-bold text-xl">&times;</button>
                    </div>
                    <div className="p-6 overflow-y-auto flex-1 prose prose-sm text-right rtl">
                        {/* Normally we'd use a markdown parser here, e.g., react-markdown */}
                        <pre className="whitespace-pre-wrap font-sans text-gray-800">{content}</pre>
                    </div>
                </div>
            )}
        </>
    );
}
