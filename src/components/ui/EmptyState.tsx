import React from 'react';

export interface EmptyStateProps {
  title: string;
  message: string;
  illustration?: string;
  variant?: 'no-data' | 'no-results' | 'error';
  cta?: {
    label: string;
    onClick: () => void;
  };
}

export const EmptyState: React.FC<EmptyStateProps> = ({
  title,
  message,
  illustration,
  variant = 'no-data',
  cta
}) => {
  return (
    <div className="flex flex-col items-center justify-center p-8 text-center bg-gray-50 rounded-xl border border-dashed border-gray-300 m-4">
      {illustration ? (
        <img src={illustration} alt={title} className="w-48 h-48 mb-6 opacity-80" />
      ) : (
        <div className="w-48 h-48 mb-6 bg-gray-200 rounded-full flex items-center justify-center">
          <span className="text-gray-400">No Image</span>
        </div>
      )}
      
      <h3 className="text-xl font-bold text-gray-900 mb-2">{title}</h3>
      <p className="text-gray-500 mb-6 max-w-md">{message}</p>
      
      {cta && (
        <button 
          onClick={cta.onClick}
          className="px-6 py-2 bg-teal-700 text-white font-medium rounded-lg hover:bg-teal-800 transition-colors"
        >
          {cta.label}
        </button>
      )}
    </div>
  );
};
