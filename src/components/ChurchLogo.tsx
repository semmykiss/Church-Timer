import React from 'react';
import { ChurchLogoConfig } from '../types/timer';

interface ChurchLogoProps {
  config?: ChurchLogoConfig;
  className?: string;
  showText?: boolean;
}

export const ChurchLogo: React.FC<ChurchLogoProps> = ({
  config,
  className = '',
  showText = true,
}) => {
  if (!config || !config.enabled) return null;

  const sizeMap: Record<string, { icon: string; text: string; wrap: string }> = {
    sm: { icon: 'w-7 h-7', text: 'text-xs', wrap: 'gap-2' },
    md: { icon: 'w-9 h-9', text: 'text-sm', wrap: 'gap-2.5' },
    lg: { icon: 'w-12 h-12', text: 'text-base', wrap: 'gap-3' },
    xl: { icon: 'w-16 h-16', text: 'text-lg', wrap: 'gap-3.5' },
  };

  const currentSize = sizeMap[config.size] || sizeMap.md;

  const renderIcon = () => {
    if (config.customDataUrl) {
      return (
        <img
          src={config.customDataUrl}
          alt={config.churchName || 'Church Logo'}
          className={`${currentSize.icon} object-contain rounded-md drop-shadow-md`}
        />
      );
    }

    switch (config.presetId) {
      case 'dove':
        return (
          <div className={`${currentSize.icon} flex items-center justify-center rounded-xl bg-gradient-to-br from-amber-500/20 to-red-500/20 border border-amber-500/40 p-1.5 shadow-sm`}>
            <svg viewBox="0 0 24 24" fill="none" className="w-full h-full text-amber-400" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
              {/* Holy Spirit Dove / Flame */}
              <path d="M12 2C9 5 8 9 9 12c1 3 3 5 3 8 0-3 2-5 3-8 1-3 0-7-3-10z" fill="currentColor" fillOpacity="0.3" />
              <path d="M5 9c2-1 5 0 7 3" />
              <path d="M19 9c-2-1-5 0-7 3" />
              <circle cx="12" cy="7" r="1.5" fill="currentColor" />
            </svg>
          </div>
        );
      case 'shield':
        return (
          <div className={`${currentSize.icon} flex items-center justify-center rounded-xl bg-gradient-to-br from-blue-600/20 to-indigo-600/20 border border-blue-400/40 p-1.5 shadow-sm`}>
            <svg viewBox="0 0 24 24" fill="none" className="w-full h-full text-blue-400" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
              <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" fill="currentColor" fillOpacity="0.2" />
              <path d="M12 8v8" stroke="currentColor" strokeWidth="2" />
              <path d="M9 11h6" stroke="currentColor" strokeWidth="2" />
            </svg>
          </div>
        );
      case 'cathedral':
        return (
          <div className={`${currentSize.icon} flex items-center justify-center rounded-xl bg-gradient-to-br from-purple-600/20 to-pink-600/20 border border-purple-400/40 p-1.5 shadow-sm`}>
            <svg viewBox="0 0 24 24" fill="none" className="w-full h-full text-purple-300" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
              <path d="M12 2v4" />
              <path d="M10 4h4" />
              <path d="M5 21V10l7-5 7 5v11H5z" fill="currentColor" fillOpacity="0.2" />
              <path d="M10 21v-5a2 2 0 0 1 4 0v5" />
            </svg>
          </div>
        );
      case 'cross':
      default:
        return (
          <div className={`${currentSize.icon} flex items-center justify-center rounded-xl bg-gradient-to-br from-emerald-500/20 to-amber-500/20 border border-emerald-500/40 p-1.5 shadow-sm`}>
            <svg viewBox="0 0 24 24" fill="none" className="w-full h-full text-amber-400" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <rect x="10.5" y="3" width="3" height="18" rx="1" fill="#fbbf24" stroke="none" />
              <rect x="5" y="7.5" width="14" height="3" rx="1" fill="#fbbf24" stroke="none" />
            </svg>
          </div>
        );
    }
  };

  return (
    <div
      className={`inline-flex items-center ${currentSize.wrap} ${className}`}
      style={{ opacity: config.opacity ?? 0.9 }}
    >
      {renderIcon()}
      {showText && config.churchName && (
        <span className={`font-semibold tracking-wide text-white/95 uppercase ${currentSize.text} drop-shadow-sm`}>
          {config.churchName}
        </span>
      )}
    </div>
  );
};
