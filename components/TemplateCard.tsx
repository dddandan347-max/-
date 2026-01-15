import React, { useState } from 'react';
import { VideoTemplate } from '../types';
import { useLanguage } from '../LanguageContext';

interface TemplateCardProps {
  template: VideoTemplate;
  onContact: () => void;
  onViewDetails: () => void;
}

export const TemplateCard: React.FC<TemplateCardProps> = ({ template, onContact, onViewDetails }) => {
  const { t } = useLanguage();
  const [isHovered, setIsHovered] = useState(false);
  const [isPlayingManual, setIsPlayingManual] = useState(false);
  const [showShareMenu, setShowShareMenu] = useState(false);
  const [isCopied, setIsCopied] = useState(false);
  
  // Image Loading State for Skeleton Effect
  const [isImageLoaded, setIsImageLoaded] = useState(false);

  const handleShareClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    setShowShareMenu(!showShareMenu);
  };

  const handleCopyLink = (e: React.MouseEvent) => {
    e.stopPropagation();
    const link = `${window.location.origin}?id=${template.id}`;
    
    navigator.clipboard.writeText(link).then(() => {
      setIsCopied(true);
      setTimeout(() => {
        setIsCopied(false);
        setShowShareMenu(false);
      }, 2000);
    });
  };

  const handleManualPlayToggle = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsPlayingManual(!isPlayingManual);
  };

  const isDirectVideo = (url?: string) => {
    if (!url) return false;
    return url.match(/\.(mp4|webm|ogg)$/i) !== null;
  };

  const showVideoPreview = (isHovered || isPlayingManual) && template.videoUrl && isDirectVideo(template.videoUrl);

  return (
    <div 
      className="group relative bg-anime-card rounded-xl overflow-hidden transition-all duration-300 hover:scale-[1.01] hover:-translate-y-1 flex flex-col h-full border border-anime-text-muted/10 hover:border-anime-secondary hover:shadow-[0_0_20px_rgb(var(--color-secondary)/0.3)] shadow-md"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => {
        setIsHovered(false);
        setIsPlayingManual(false);
        setShowShareMenu(false); 
      }}
    >
      {/* Media Container - Enforce Aspect Ratio */}
      <div 
        onClick={onViewDetails}
        className="aspect-video w-full overflow-hidden bg-anime-card cursor-pointer relative"
      >
        {/* Loading Skeleton */}
        <div className={`absolute inset-0 bg-slate-800 animate-pulse z-0 transition-opacity duration-500 ${isImageLoaded ? 'opacity-0' : 'opacity-100'}`} />

        {/* Rarity/Type Badge */}
        <div className="absolute top-3 left-3 z-30 bg-anime-primary text-white text-[10px] font-black uppercase tracking-wider px-2 py-1 skew-x-[-10deg] shadow-lg pointer-events-none">
           <div className="skew-x-[10deg]">{t.card.ssr}</div>
        </div>

        {/* Video Preview */}
        {showVideoPreview ? (
          <video 
            src={template.videoUrl}
            className="w-full h-full object-cover animate-fade-in relative z-10"
            autoPlay
            muted
            loop
            playsInline
          >
            {t.card.browserNoSupport}
          </video>
        ) : (
          /* Cover Image with Fade-in */
          <div className="relative w-full h-full z-10">
            <img 
              src={template.imageUrl} 
              alt={template.title} 
              loading="lazy"
              onLoad={() => setIsImageLoaded(true)}
              className={`w-full h-full object-cover transform group-hover:scale-105 transition-all duration-700 ease-out ${isImageLoaded ? 'opacity-100' : 'opacity-0'}`}
            />
            {/* Play Icon Indicator */}
            {template.videoUrl && !isPlayingManual && isImageLoaded && (
              <div className="absolute bottom-2 right-2 bg-black/60 backdrop-blur-sm px-2 py-1 rounded text-[10px] text-white font-bold flex items-center gap-1 border border-white/10 md:flex hidden">
                 <svg xmlns="http://www.w3.org/2000/svg" width="10" height="10" viewBox="0 0 24 24" fill="currentColor" stroke="none"><polygon points="5 3 19 12 5 21 5 3"/></svg>
                 {t.card.preview}
              </div>
            )}
          </div>
        )}
        
        {/* Scanline effect overlay */}
        <div className="absolute inset-0 bg-[linear-gradient(rgba(18,16,16,0)_50%,rgba(0,0,0,0.25)_50%),linear-gradient(90deg,rgba(255,0,0,0.06),rgba(0,255,0,0.02),rgba(0,0,255,0.06))] z-20 bg-[length:100%_2px,3px_100%] pointer-events-none opacity-30"></div>
        
        {/* Hover Overlay Button */}
        <div className={`absolute inset-0 flex items-center justify-center z-30 pointer-events-none transition-opacity duration-300 ${isHovered && !isPlayingManual ? 'opacity-100' : 'opacity-0'}`}>
           <div className="w-12 h-12 bg-white/10 backdrop-blur-md rounded-full flex items-center justify-center border border-white/50 shadow-lg">
              <span className="text-white text-xs font-black tracking-tighter">{t.card.open}</span>
           </div>
        </div>
      </div>

      {/* Content - Standardized Hierarchy */}
      <div className="p-4 flex flex-col flex-1 relative bg-anime-card border-t border-anime-text-muted/5">
        <div className="mb-3">
          <div className="flex justify-between items-start gap-2">
             {/* Title - Level 3 Hierarchy */}
             <h3 
               onClick={onViewDetails}
               className="text-base md:text-lg font-bold text-anime-text group-hover:text-anime-secondary transition-colors cursor-pointer leading-snug line-clamp-1"
               title={template.title}
             >
               {template.title}
             </h3>
             {/* Price - High Visibility */}
             <span className="text-lg font-black text-anime-yellow italic shrink-0 leading-none">{template.price}</span>
          </div>
        </div>
        
        {/* Description - Body Text */}
        <p className="text-anime-text-muted text-xs mb-4 line-clamp-2 leading-relaxed font-normal h-8">
          {template.description}
        </p>
        
        <div className="mt-auto">
          {/* Tags - Meta Text */}
          <div className="flex flex-wrap gap-1.5 mb-4 h-6 overflow-hidden">
            {template.tags.slice(0, 3).map(tag => (
              <span key={tag} className="text-[10px] font-bold text-anime-text-muted bg-anime-dark px-1.5 py-0.5 rounded border border-anime-text-muted/10">
                #{tag}
              </span>
            ))}
          </div>

          <div className="flex gap-2">
            <button 
              onClick={onViewDetails}
              className="flex-1 py-2 px-3 rounded bg-anime-dark hover:bg-anime-text-muted/10 text-anime-text-muted hover:text-anime-text font-bold text-xs uppercase tracking-wider transition-colors border border-anime-text-muted/20"
            >
              {t.card.details}
            </button>
            <button 
              onClick={onContact}
              className="flex-1 py-2 px-3 rounded bg-anime-primary hover:bg-pink-600 text-white font-bold text-xs uppercase tracking-wider transition-all shadow-[0_0_10px_rgba(255,0,128,0.3)] hover:shadow-[0_0_15px_rgba(255,0,128,0.5)]"
            >
              {t.card.get}
            </button>
            
            <div className="relative">
              <button 
                onClick={handleShareClick}
                className="h-full px-2 rounded bg-anime-dark hover:bg-anime-secondary hover:text-black text-anime-text-muted border border-anime-text-muted/20 hover:border-anime-secondary transition-all"
                title={t.card.share}
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M4 12v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8"/><polyline points="16 6 12 2 8 6"/><line x1="12" y1="2" x2="12" y2="15"/></svg>
              </button>

              {showShareMenu && (
                <div className="absolute bottom-full right-0 mb-2 w-32 bg-anime-card border border-anime-text-muted/30 rounded-lg shadow-xl overflow-hidden z-50 animate-fade-in">
                   <div className="p-1">
                      <button 
                        onClick={handleCopyLink}
                        className="w-full text-left px-3 py-2 text-xs font-bold text-anime-text hover:bg-anime-text-muted/10 rounded flex items-center gap-2 transition-colors"
                      >
                         {isCopied ? (
                           <>
                             <svg className="text-green-500" xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
                             <span className="text-green-500">{t.card.copied}</span>
                           </>
                         ) : (
                           <>
                              <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"/><path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"/></svg>
                              <span>{t.card.copyLink}</span>
                           </>
                         )}
                      </button>
                   </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};