import React from 'react';
import { ArrowRight, CheckCircle, Clock, XCircle } from 'lucide-react';

interface JourneyStep {
    id: string;
    title: string;
    documentId?: string;
    status: 'COMPLETED' | 'ACTIVE' | 'PENDING' | 'FAILED';
    timestamp?: string;
}

interface JourneyTimelineProps {
    journeyType: 'Q2C' | 'P2P';
    steps: JourneyStep[];
}

export function JourneyTimeline({ journeyType, steps }: JourneyTimelineProps) {
    return (
        <div className="flex flex-col md:flex-row items-center gap-4 w-full py-6 overflow-x-auto">
            {steps.map((step, idx) => (
                <React.Fragment key={step.id}>
                    <div className="flex flex-col items-center min-w-[120px]">
                        <div className={`w-12 h-12 rounded-full flex items-center justify-center mb-2 border-2 
                            ${step.status === 'COMPLETED' ? 'bg-green-100 border-green-500 text-green-600' :
                              step.status === 'ACTIVE' ? 'bg-blue-100 border-blue-500 text-blue-600 animate-pulse' :
                              step.status === 'FAILED' ? 'bg-red-100 border-red-500 text-red-600' :
                              'bg-gray-100 border-gray-300 text-gray-400'}`}>
                            {step.status === 'COMPLETED' && <CheckCircle className="w-6 h-6" />}
                            {step.status === 'ACTIVE' && <Clock className="w-6 h-6" />}
                            {step.status === 'FAILED' && <XCircle className="w-6 h-6" />}
                            {step.status === 'PENDING' && <div className="w-3 h-3 rounded-full bg-gray-300" />}
                        </div>
                        <p className="font-semibold text-sm text-center">{step.title}</p>
                        {step.documentId && (
                            <a href={`#doc-${step.documentId}`} className="text-xs text-blue-500 hover:underline mt-1 font-mono">
                                {step.documentId}
                            </a>
                        )}
                        {step.timestamp && <span className="text-[10px] text-gray-400 mt-1">{step.timestamp}</span>}
                    </div>
                    {idx < steps.length - 1 && (
                        <ArrowRight className={`w-6 h-6 hidden md:block ${step.status === 'COMPLETED' ? 'text-green-400' : 'text-gray-200'}`} />
                    )}
                </React.Fragment>
            ))}
        </div>
    );
}
