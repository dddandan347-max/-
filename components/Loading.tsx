import React from 'react';

export const Loading: React.FC = () => {
  return (
    <div className="min-h-[50vh] flex flex-col items-center justify-center p-8 space-y-4 animate-fade-in">
      <div className="relative w-16 h-16">
        <div className="absolute inset-0 border-4 border-anime-text-muted/20 rounded-full"></div>
        <div className="absolute inset-0 border-4 border-anime-primary border-t-transparent rounded-full animate-spin"></div>
        <div className="absolute inset-0 flex items-center justify-center">
             <div className="w-2 h-2 bg-anime-secondary rounded-full animate-pulse"></div>
        </div>
      </div>
      <p className="text-anime-text-muted text-sm font-mono tracking-widest animate-pulse">LOADING SYSTEM...</p>
    </div>
  );
};