import React, { useMemo } from 'react';
import { VideoTemplate } from '../types';
import { TemplateCard } from './TemplateCard';
import { SEO } from './SEO';
import { useLanguage } from '../LanguageContext';

interface TemplateDetailProps {
  template: VideoTemplate;
  allTemplates: VideoTemplate[]; // Added prop for recommendations
  onBack: () => void;
  onContact: () => void;
  onSwitchTemplate: (template: VideoTemplate) => void; // Added prop for switching
}

export const TemplateDetail: React.FC<TemplateDetailProps> = ({ 
  template, 
  allTemplates,
  onBack, 
  onContact,
  onSwitchTemplate
}) => {
  const { t } = useLanguage();
  
  // Calculate recommended templates based on tags
  const recommendedTemplates = useMemo(() => {
    if (!allTemplates) return [];
    return allTemplates
      .filter(t => t.id !== template.id) // Exclude current
      .map(t => ({
        ...t,
        // Calculate a score: number of matching tags
        matchScore: t.tags.filter(tag => template.tags.includes(tag)).length
      }))
      .sort((a, b) => b.matchScore - a.matchScore) // Sort by relevance
      .slice(0, 3); // Take top 3
  }, [template, allTemplates]);

  // Helper to determine how to render the video
  const renderVideoPlayer = (url: string, poster: string) => {
    // Case 1: Raw Iframe code pasted by user
    if (url.trim().startsWith('<iframe')) {
      return <div className="w-full h-full" dangerouslySetInnerHTML={{ __html: url }} />;
    }

    // Case 2: Bilibili Link (Convert standard link to player embed)
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
    
    // Case 3: YouTube Link
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

    // Case 4: Standard Direct Video File (.mp4, .webm, etc.)
    return (
      <video 
        src={url}
        poster={poster}
        controls
        autoPlay
        className="w-full h-full object-contain"
      >
        {t.card.browserNoSupport}
      </video>
    );
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 animate-fade-in pb-24">
      {/* Dynamic SEO for this specific template */}
      <SEO 
        title={template.title}
        description={`【${template.price}】${template.description} - 包含工程文件与使用教程。`}
        image={template.imageUrl}
        url={`${window.location.origin}?id=${template.id}`}
      />

      {/* Navigation */}
      <button 
        onClick={onBack}
        className="mb-8 flex items-center gap-2 px-4 py-2 rounded-full bg-anime-card hover:bg-anime-text-muted/10 text-anime-text-muted hover:text-anime-text transition-all group backdrop-blur-sm border border-anime-text-muted/10 shadow-sm"
      >
        <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="group-hover:-translate-x-1 transition-transform"><path d="M19 12H5"/><path d="M12 19l-7-7 7-7"/></svg>
        <span className="text-sm font-bold">{t.detail.back}</span>
      </button>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-12 mb-20">
        {/* Main Content - Video Player */}
        <div className="lg:col-span-2 space-y-8">
          <div className="rounded-3xl overflow-hidden border border-anime-primary/20 bg-black shadow-[0_0_40px_rgba(0,0,0,0.3)] aspect-video relative group z-10">
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
          
          {/* Additional Info Box */}
          <div className="bg-anime-card/80 backdrop-blur-md rounded-2xl p-8 border border-anime-text-muted/10 relative overflow-hidden shadow-sm">
             <div className="absolute top-0 right-0 p-8 opacity-5">
               <svg className="w-32 h-32 text-anime-primary" fill="currentColor" viewBox="0 0 24 24"><path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-5.82 3.25L7.38 14.14 2 9.27l6.91-1.01L12 2z"/></svg>
             </div>
             
             <h3 className="text-xl font-bold text-anime-text mb-6 flex items-center gap-2">
               <span className="w-1 h-6 bg-anime-primary rounded-full"></span>
               {t.detail.package}
             </h3>
             <ul className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-anime-text-muted text-sm relative z-10">
               {t.detail.packageItems.map((item, i) => (
                 <li key={i} className="flex items-center gap-3 bg-anime-dark p-3 rounded-lg border border-anime-text-muted/10">
                   <div className="text-anime-primary bg-anime-primary/10 p-1 rounded-full">
                     <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 13l4 4L19 7"/></svg>
                   </div>
                   {item}
                 </li>
               ))}
             </ul>
          </div>
        </div>

        {/* Sidebar - Details & Action */}
        <div className="space-y-8">
          <div className="bg-anime-card/60 backdrop-blur-lg p-6 rounded-3xl border border-anime-text-muted/10 shadow-sm">
            <h1 className="text-3xl font-black text-anime-text mb-2 leading-tight">{template.title}</h1>
            <p className="text-4xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-anime-primary to-anime-accent mt-4 mb-6">{template.price}</p>
            
            <button 
              onClick={onContact}
              className="w-full py-4 bg-gradient-to-r from-anime-primary to-anime-accent hover:from-pink-500 hover:to-purple-500 text-white text-lg font-bold rounded-2xl shadow-[0_0_20px_rgb(var(--color-primary)/0.3)] transition-all hover:scale-[1.02] flex items-center justify-center gap-2 group relative overflow-hidden"
            >
              <div className="absolute inset-0 bg-white/20 translate-y-full group-hover:translate-y-0 transition-transform duration-300"></div>
              <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="relative z-10"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>
              <span className="relative z-10">{t.detail.buyNow}</span>
            </button>
            <p className="text-center text-anime-text-muted text-xs mt-4">
              {t.detail.buyHint}
            </p>
          </div>

          <div className="bg-anime-card/60 backdrop-blur-lg p-6 rounded-3xl border border-anime-text-muted/10 shadow-sm">
            <h3 className="text-sm font-bold text-anime-text-muted uppercase tracking-wider mb-4 border-b border-anime-text-muted/10 pb-2">{t.detail.description}</h3>
            <div className="prose prose-sm max-w-none">
              <p className="text-anime-text leading-relaxed text-base font-medium">
                {template.description}
              </p>
              <p className="text-anime-text-muted text-sm mt-4 italic">
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

      {/* Recommended Section (Suggestion 4) */}
      {recommendedTemplates.length > 0 && (
        <div className="border-t border-anime-text-muted/10 pt-12">
          <div className="flex items-center gap-4 mb-8">
            <h3 className="text-2xl font-black text-anime-text italic uppercase">{t.detail.recommendations}</h3>
            <div className="h-px flex-1 bg-anime-text-muted/10"></div>
            <span className="text-xs text-anime-text-muted font-mono tracking-widest">{t.detail.recSubtitle}</span>
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