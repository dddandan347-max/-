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
  const [isPlayingManual, setIsPlayingManual] = useState(false); // New state for mobile toggle
  const [showShareMenu, setShowShareMenu] = useState(false);
  const [isCopied, setIsCopied] = useState(false);

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

  // Check if the video URL is a direct file that supports hover autoplay
  const isDirectVideo = (url?: string) => {
    if (!url) return false;
    return url.match(/\.(mp4|webm|ogg)$/i) !== null;
  };

  // Show video if hovered OR manually toggled (for mobile)
  const showVideoPreview = (isHovered || isPlayingManual) && template.videoUrl && isDirectVideo(template.videoUrl);

  return (
    <div 
      className="group relative bg-anime-card rounded-xl overflow-hidden transition-all duration-300 hover:scale-[1.02] hover:-translate-y-1 flex flex-col h-full border border-anime-text-muted/10 hover:border-anime-secondary hover:shadow-[0_0_20px_rgb(var(--color-secondary)/0.3)] shadow-md"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => {
        setIsHovered(false);
        setIsPlayingManual(false); // Reset manual play on leave
        setShowShareMenu(false); 
      }}
    >
      {/* Decorative Corner lines */}
      <div className="absolute top-0 right-0 w-8 h-8 border-t-2 border-r-2 border-white/20 rounded-tr-xl z-20 group-hover:border-anime-secondary transition-colors pointer-events-none"></div>
      <div className="absolute bottom-0 left-0 w-8 h-8 border-b-2 border-l-2 border-white/20 rounded-bl-xl z-20 group-hover:border-anime-primary transition-colors pointer-events-none"></div>

      {/* Media Container */}
      <div 
        onClick={onViewDetails}
        className="aspect-video w-full overflow-hidden bg-black cursor-pointer relative"
      >
        {/* Rarity/Type Badge */}
        <div className="absolute top-3 left-3 z-30 bg-anime-primary text-white text-[10px] font-black uppercase tracking-wider px-2 py-1 skew-x-[-10deg] shadow-lg pointer-events-none">
           <div className="skew-x-[10deg]">{t.card.ssr}</div>
        </div>

        {/* Mobile/Touch Play Toggle Button (Visible when video exists) */}
        {template.videoUrl && isDirectVideo(template.videoUrl) && (
          <button
            onClick={handleManualPlayToggle}
            className={`absolute top-3 right-3 z-40 p-2 rounded-full backdrop-blur-md border transition-all md:hidden ${
              isPlayingManual 
                ? 'bg-anime-secondary/80 text-black border-anime-secondary' 
                : 'bg-black/40 text-white border-white/20'
            }`}
          >
             {isPlayingManual ? (
               <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="currentColor" stroke="none"><rect x="6" y="4" width="4" height="16"/><rect x="14" y="4" width="4" height="16"/></svg>
             ) : (
               <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="currentColor" stroke="none"><polygon points="5 3 19 12 5 21 5 3"/></svg>
             )}
          </button>
        )}

        {/* Video Preview */}
        {showVideoPreview ? (
          <video 
            src={template.videoUrl}
            className="w-full h-full object-cover animate-fade-in"
            autoPlay
            muted
            loop
            playsInline
          >
            {t.card.browserNoSupport}
          </video>
        ) : (
          /* Cover Image (Default view) */
          <div className="relative w-full h-full">
            <img 
              src={template.imageUrl} 
              alt={template.title} 
              loading="lazy"
              className="w-full h-full object-cover transform group-hover:scale-110 transition-transform duration-700"
            />
            {/* Play Icon Indicator if video exists */}
            {template.videoUrl && !isPlayingManual && (
              <div className="absolute bottom-3 right-3 bg-black/60 backdrop-blur-sm px-2 py-1 rounded text-[10px] text-white font-bold flex items-center gap-1 border border-white/10 md:flex hidden">
                 <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="currentColor" stroke="none"><polygon points="5 3 19 12 5 21 5 3"/></svg>
                 {t.card.preview}
              </div>
            )}
          </div>
        )}
        
        {/* Scanline effect */}
        <div className="absolute inset-0 bg-[linear-gradient(rgba(18,16,16,0)_50%,rgba(0,0,0,0.25)_50%),linear-gradient(90deg,rgba(255,0,0,0.06),rgba(0,255,0,0.02),rgba(0,0,255,0.06))] z-20 bg-[length:100%_2px,3px_100%] pointer-events-none opacity-50"></div>
        
        {/* Hover Overlay Center Play Button (Desktop) */}
        <div className={`absolute inset-0 flex items-center justify-center z-30 pointer-events-none transition-opacity duration-300 ${isHovered && !isPlayingManual ? 'opacity-100' : 'opacity-0'}`}>
           <div className="w-12 h-12 bg-white/10 backdrop-blur-md rounded-full flex items-center justify-center border border-white/50">
              <span className="text-white text-xs font-black tracking-tighter">{t.card.open}</span>
           </div>
        </div>
      </div>

      {/* Content */}
      <div className="p-5 flex flex-col flex-1 relative bg-anime-card">
        <div className="mb-4">
          <div className="flex justify-between items-start">
             <h3 
               onClick={onViewDetails}
               className="text-lg font-bold text-anime-text group-hover:text-anime-secondary transition-colors cursor-pointer leading-tight truncate pr-2 font-sans"
             >
               {template.title}
             </h3>
          </div>
          <div className="flex items-center gap-2 mt-1">
             <div className="h-px flex-1 bg-anime-text-muted/20 group-hover:bg-gradient-to-r from-anime-secondary to-transparent transition-colors"></div>
             <span className="text-xl font-black text-anime-yellow italic">{template.price}</span>
          </div>
        </div>
        
        <p className="text-anime-text-muted text-xs mb-6 line-clamp-2 leading-relaxed font-medium">
          {template.description}
        </p>
        
        <div className="mt-auto">
          {/* Tags */}
          <div className="flex flex-wrap gap-2 mb-4">
            {template.tags.slice(0, 3).map(tag => (
              <span key={tag} className="text-[10px] font-bold text-anime-text-muted bg-anime-dark px-2 py-1 rounded border border-anime-text-muted/10">
                #{tag}
              </span>
            ))}
          </div>

          <div className="flex gap-2">
            <button 
              onClick={onViewDetails}
              className="flex-1 py-3 md:py-2 px-3 rounded bg-anime-dark hover:bg-anime-text-muted/10 text-anime-text-muted hover:text-anime-text font-bold text-xs uppercase tracking-wider transition-colors border border-anime-text-muted/20"
            >
              {t.card.details}
            </button>
            <button 
              onClick={onContact}
              className="flex-1 py-3 md:py-2 px-3 rounded bg-anime-primary hover:bg-pink-600 text-white font-bold text-xs uppercase tracking-wider transition-all shadow-[0_0_10px_rgba(255,0,128,0.4)] hover:shadow-[0_0_15px_rgba(255,0,128,0.6)]"
            >
              {t.card.get}
            </button>
            
            {/* Share Button with Popup */}
            <div className="relative">
              <button 
                onClick={handleShareClick}
                className="h-full px-3 rounded bg-anime-dark hover:bg-anime-secondary hover:text-black text-anime-text-muted border border-anime-text-muted/20 hover:border-anime-secondary transition-all"
                title={t.card.share}
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M4 12v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8"/><polyline points="16 6 12 2 8 6"/><line x1="12" y1="2" x2="12" y2="15"/></svg>
              </button>

              {/* Popup Menu */}
              {showShareMenu && (
                <div className="absolute bottom-full right-0 mb-2 w-36 bg-anime-card border border-anime-text-muted/30 rounded-lg shadow-xl overflow-hidden z-50 animate-fade-in">
                   <div className="p-1">
                      <button 
                        onClick={handleCopyLink}
                        className="w-full text-left px-3 py-2 text-xs font-bold text-anime-text hover:bg-anime-text-muted/10 rounded flex items-center gap-2 transition-colors"
                      >
                         {isCopied ? (
                           <>
                             <svg className="text-green-500" xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
                             <span className="text-green-500">{t.card.copied}</span>
                           </>
                         ) : (
                           <>
                              <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"/><path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"/></svg>
                              <span>{t.card.copyLink}</span>
                           </>
                         )}
                      </button>
                   </div>
                   {/* Triangle Arrow */}
                   <div className="absolute -bottom-1 right-3 w-2 h-2 bg-anime-card border-b border-r border-anime-text-muted/30 transform rotate-45"></div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};