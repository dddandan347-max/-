import React, { useMemo } from 'react';
import { VideoTemplate } from '../types';
import { TemplateCard } from './TemplateCard';
import { SEO } from './SEO';
import { useLanguage } from '../LanguageContext';

interface TemplateDetailProps {
  template: VideoTemplate;
  allTemplates: VideoTemplate[]; 
  onBack: () => void;
  onContact: () => void;
  onSwitchTemplate: (template: VideoTemplate) => void;
}

export const TemplateDetail: React.FC<TemplateDetailProps> = ({ 
  template, 
  allTemplates,
  onBack, 
  onContact,
  onSwitchTemplate
}) => {
  const { t } = useLanguage();
  
  const recommendedTemplates = useMemo(() => {
    if (!allTemplates) return [];
    return allTemplates
      .filter(t => t.id !== template.id) 
      .map(t => ({
        ...t,
        matchScore: t.tags.filter(tag => template.tags.includes(tag)).length
      }))
      .sort((a, b) => b.matchScore - a.matchScore) 
      .slice(0, 3);
  }, [template, allTemplates]);

  const renderVideoPlayer = (url: string, poster: string) => {
    if (url.trim().startsWith('<iframe')) {
      return <div className="w-full h-full" dangerouslySetInnerHTML={{ __html: url }} />;
    }

    if (url.includes('bilibili.com/video/')) {
       const bvidMatch = url.match(/BV[a-zA-Z0-9]+/);
       if (bvidMatch) {
         const embedUrl = `//player.bilibili.com/player.html?bvid=${bvidMatch[0]}&page=1&high_quality=1&danmaku=0`;
         return (
           <iframe 
             src={embedUrl} 
             className="w-full h-full" 
             scrolling="no" 
             frameBorder="0" 
             allowFullScreen 
           />
         );
       }
    }
    
    if (url.includes('youtube.com') || url.includes('youtu.be')) {
        let embedUrl = url;
        if (url.includes('watch?v=')) {
            embedUrl = url.replace('watch?v=', 'embed/');
        } else if (url.includes('youtu.be/')) {
            embedUrl = url.replace('youtu.be/', 'youtube.com/embed/');
        }
        return (
           <iframe 
             src={embedUrl} 
             className="w-full h-full" 
             title="YouTube video player" 
             frameBorder="0" 
             allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" 
             allowFullScreen 
           />
        );
    }

    return (
      <video 
        src={url}
        poster={poster}
        controls
        autoPlay
        className="w-full h-full object-contain bg-black"
      >
        {t.card.browserNoSupport}
      </video>
    );
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 md:py-12 animate-fade-in pb-24 overflow-x-hidden">
      <SEO 
        title={template.title}
        description={`【${template.price}】${template.description} - 包含工程文件与使用教程。`}
        image={template.imageUrl}
        url={`${window.location.origin}?id=${template.id}`}
      />

      {/* Navigation */}
      <button 
        onClick={onBack}
        className="mb-6 md:mb-8 flex items-center gap-2 px-4 py-2 rounded-full bg-anime-card hover:bg-anime-text-muted/10 text-anime-text-muted hover:text-anime-text transition-all group backdrop-blur-sm border border-anime-text-muted/10 shadow-sm"
      >
        <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="group-hover:-translate-x-1 transition-transform"><path d="M19 12H5"/><path d="M12 19l-7-7 7-7"/></svg>
        <span className="text-sm font-bold">{t.detail.back}</span>
      </button>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 md:gap-12 mb-16 md:mb-20">
        {/* Main Content - Video Player */}
        <div className="lg:col-span-2">
          <div className="rounded-2xl md:rounded-3xl overflow-hidden border border-anime-primary/20 bg-black shadow-[0_0_40px_rgba(0,0,0,0.3)] aspect-video relative group z-10">
             {template.videoUrl ? (
               renderVideoPlayer(template.videoUrl, template.imageUrl)
            ) : (
              <div className="relative w-full h-full">
                <img 
                  src={template.imageUrl} 
                  alt={template.title} 
                  loading="lazy"
                  className="w-full h-full object-cover"
                />
                <div className="absolute inset-0 flex items-center justify-center bg-black/40 backdrop-blur-sm">
                  <span className="text-white/70 font-bold border border-white/20 px-4 py-2 rounded-lg">{t.detail.noPreview}</span>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Sidebar - Details & Action */}
        <div className="space-y-6 md:space-y-8">
          <div className="bg-anime-card/60 backdrop-blur-lg p-6 rounded-3xl border border-anime-text-muted/10 shadow-sm">
            {/* Title: Level 1 Typography */}
            <h1 className="text-2xl md:text-3xl font-black text-anime-text mb-2 leading-tight break-words">{template.title}</h1>
            
            {/* Price: Highlight */}
            <p className="text-3xl md:text-4xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-anime-primary to-anime-accent mt-4 mb-6">{template.price}</p>
            
            <button 
              onClick={onContact}
              className="w-full py-3.5 md:py-4 bg-gradient-to-r from-anime-primary to-anime-accent hover:from-pink-500 hover:to-purple-500 text-white text-base md:text-lg font-bold rounded-2xl shadow-[0_0_20px_rgb(var(--color-primary)/0.3)] transition-all hover:scale-[1.02] flex items-center justify-center gap-2 group relative overflow-hidden"
            >
              <div className="absolute inset-0 bg-white/20 translate-y-full group-hover:translate-y-0 transition-transform duration-300"></div>
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="relative z-10"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>
              <span className="relative z-10">{t.detail.buyNow}</span>
            </button>
            <p className="text-center text-anime-text-muted text-xs mt-3">
              {t.detail.buyHint}
            </p>
          </div>

          <div className="bg-anime-card/60 backdrop-blur-lg p-6 rounded-3xl border border-anime-text-muted/10 shadow-sm">
            {/* Section Header: Level 2 Typography */}
            <h3 className="text-sm font-bold text-anime-text-muted uppercase tracking-wider mb-4 border-b border-anime-text-muted/10 pb-2">{t.detail.description}</h3>
            
            <div className="prose prose-sm prose-invert max-w-none">
              <p className="text-anime-text leading-relaxed text-base font-normal">
                {template.description}
              </p>
              {/* Notes: Level 3 Typography (Small/Muted) */}
              <p className="text-anime-text-muted/80 text-xs mt-4 italic leading-relaxed">
                {t.detail.descriptionDisclaimer}
              </p>
            </div>
          </div>

          <div>
            <h3 className="text-sm font-bold text-anime-text-muted uppercase tracking-wider mb-3 px-2">{t.detail.tags}</h3>
            <div className="flex flex-wrap gap-2">
              {template.tags.map(tag => (
                <span key={tag} className="px-4 py-1.5 rounded-full bg-anime-card border border-anime-text-muted/20 text-anime-text text-sm font-medium hover:border-anime-primary hover:text-anime-primary hover:shadow-lg transition-all cursor-default">
                  #{tag}
                </span>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Recommended Section */}
      {recommendedTemplates.length > 0 && (
        <div className="border-t border-anime-text-muted/10 pt-10 md:pt-12">
          <div className="flex items-center gap-4 mb-6 md:mb-8">
            <h3 className="text-xl md:text-2xl font-black text-anime-text italic uppercase">{t.detail.recommendations}</h3>
            <div className="h-px flex-1 bg-anime-text-muted/10"></div>
            <span className="text-[10px] md:text-xs text-anime-text-muted font-mono tracking-widest">{t.detail.recSubtitle}</span>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {recommendedTemplates.map(rec => (
              <TemplateCard 
                key={rec.id} 
                template={rec}
                onContact={onContact}
                onViewDetails={() => onSwitchTemplate(rec)}
              />
            ))}
          </div>
        </div>
      )}
    </div>
  );
};