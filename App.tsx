import React, { useState, useEffect, useMemo, Suspense } from 'react';
import { TEMPLATES, WECHAT_ID as DEFAULT_WECHAT_ID } from './constants';
import { AppSection, VideoTemplate, SiteContent } from './types'; 
import { TemplateCard } from './components/TemplateCard';
// Lazy load heavy components
import { StickyFooter } from './components/StickyFooter';
import { ChatWidget } from './components/ChatWidget';
import { SEO } from './components/SEO';
import { Loading } from './components/Loading'; 
import { supabase, isConfigured, mapTemplateFromDB, mapTemplateToDB } from './services/supabaseClient';
import { useLanguage } from './LanguageContext';

// Handle Named Exports for Lazy Loading
const AdminPanel = React.lazy(() => import('./components/AdminPanel').then(module => ({ default: module.AdminPanel })));
const TemplateDetail = React.lazy(() => import('./components/TemplateDetail').then(module => ({ default: module.TemplateDetail })));

type Theme = 'cyberpunk' | 'anime';

const THEME_CONFIG = {
  cyberpunk: { // Cyberpunk Black Premium
    '--color-bg': '5 5 5',          
    '--color-card': '24 24 27',     
    '--color-primary': '255 0 128', 
    '--color-secondary': '0 240 255', 
    '--color-accent': '147 51 234',   
    '--color-text': '255 255 255',
    '--color-text-muted': '148 163 184',
    '--bg-gradient-1': 'rgba(147, 51, 234, 0.15)',
    '--bg-gradient-2': 'rgba(0, 240, 255, 0.1)',
    '--text-glow-primary': '-1px 0 #ff0080',
    '--text-glow-secondary': '-1px 0 #00f0ff',
  },
  anime: { // Anime Cute White
    '--color-bg': '255 245 248',    
    '--color-card': '255 255 255',     
    '--color-primary': '255 105 180', // Hot Pink
    '--color-secondary': '56 189 248', // Sky Blue
    '--color-accent': '244 114 182',     
    '--color-text': '51 65 85',       // Slate 700
    '--color-text-muted': '100 116 139', // Slate 500
    '--bg-gradient-1': 'rgba(255, 105, 180, 0.05)',
    '--bg-gradient-2': 'rgba(56, 189, 248, 0.08)',
    '--text-glow-primary': '0 0 transparent',
    '--text-glow-secondary': '0 0 transparent',
  }
};

const App: React.FC = () => {
  const { t, language, setLanguage } = useLanguage();
  
  // --- Check Configuration First ---
  if (!isConfigured) {
    return (
      <div className="min-h-screen bg-black text-white flex flex-col items-center justify-center p-8 text-center font-sans">
        <div className="max-w-2xl border-2 border-red-500 rounded-xl p-8 bg-red-900/10">
          <h1 className="text-3xl font-black mb-6 text-red-500">需要配置连接信息 / Setup Required</h1>
          <p className="mb-4 text-lg">您已重新部署，请先将 Supabase 的 URL 和 Key 填入代码。</p>
          <div className="bg-black/50 p-4 rounded text-left font-mono text-sm text-slate-300 mb-6 border border-white/10">
            1. 打开文件: <span className="text-yellow-400">services/supabaseClient.ts</span><br/>
            2. 找到 <span className="text-cyan-400">SUPABASE_URL</span> 和 <span className="text-cyan-400">SUPABASE_KEY</span><br/>
            3. 将 Supabase 后台 (Project Settings -&gt; API) 的信息填入
          </div>
          <button onClick={() => window.location.reload()} className="bg-white text-black px-6 py-2 rounded font-bold hover:bg-slate-200">
            填好后点击刷新
          </button>
        </div>
      </div>
    );
  }

  const [activeSection, setActiveSection] = useState<AppSection>(AppSection.HOME);
  const [selectedTemplate, setSelectedTemplate] = useState<VideoTemplate | null>(null);
  
  // Chat State
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [chatInitialMessage, setChatInitialMessage] = useState('');

  // Search and Filter State
  const [searchTerm, setSearchTerm] = useState('');
  const [activeTag, setActiveTag] = useState<string>('ALL');
  
  // Mobile Menu State
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  // Theme State
  const [theme, setTheme] = useState<Theme>(() => {
    return (localStorage.getItem('visionary_theme') as Theme) || 'cyberpunk';
  });

  // Data States
  const [templates, setTemplates] = useState<VideoTemplate[]>([]);
  const [wechatId, setWechatId] = useState(DEFAULT_WECHAT_ID);
  const [learningUrl, setLearningUrl] = useState('https://www.bilibili.com'); 
  const [dataSource, setDataSource] = useState<'DB' | 'STATIC'>('STATIC');
  const [connectionError, setConnectionError] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  // Dynamic Content State
  const [siteContent, setSiteContent] = useState<SiteContent>({
    brandName: { zh: '', en: '' },
    heroTitle: { zh: '', en: '' },
    heroSubtitle: { zh: '', en: '' }
  });

  // --- Supabase Data Loading ---
  useEffect(() => {
    const fetchData = async () => {
      // Templates
      // 尝试获取数据
      const { data: dbTemplates, error: tError } = await supabase
        .from('templates')
        .select('*')
        .order('id', { ascending: false }); 
      
      if (tError) {
        // --- 真正的连接错误 ---
        console.warn("Supabase connection failed:", (tError as any).message || tError);
        setConnectionError(true);
        // 获取错误详情，方便排查
        const msg = (tError as any).message || String(tError);
        setErrorMessage(msg);
        
        // 只有报错时才降级到静态数据
        setTemplates(TEMPLATES); 
        setDataSource('STATIC');
      } else {
        // --- 连接成功 ---
        setConnectionError(false);
        setErrorMessage('');
        setDataSource('DB');

        if (!dbTemplates || dbTemplates.length === 0) {
          console.log("Database connected but empty.");
          // 数据库为空时，显示空列表，而不是演示数据
          setTemplates([]); 
        } else {
          console.log("Supabase Data Loaded:", dbTemplates.length, "items");
          setTemplates(dbTemplates.map(mapTemplateFromDB));
        }
      }

      // Settings
      const { data: settings, error: sError } = await supabase.from('settings').select('*');
      if (!sError && settings) {
        const settingsArray = settings as { key: string; value: any }[];
        const wx = settingsArray.find((s) => s.key === 'wechat_id');
        const url = settingsArray.find((s) => s.key === 'learning_url');
        if (wx) setWechatId(String(wx.value));
        if (url) setLearningUrl(String(url.value));

        // Load Dynamic Content
        const getContent = (key: string) => {
             const found = settingsArray.find((s) => s.key === key);
             return found ? String(found.value) : '';
        };
        
        setSiteContent({
          brandName: {
            zh: getContent('brand_name_zh'),
            en: getContent('brand_name_en')
          },
          heroTitle: {
            zh: getContent('hero_title_zh'),
            en: getContent('hero_title_en')
          },
          heroSubtitle: {
            zh: getContent('hero_subtitle_zh'),
            en: getContent('hero_subtitle_en')
          }
        });
      }
    };

    fetchData();

    // Realtime
    const channels = supabase.channel('custom-all-channel')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'templates' },
        () => { fetchData(); }
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'settings' },
        () => { fetchData(); }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channels);
    };
  }, []);

  // Theme Effect
  useEffect(() => {
    const root = document.documentElement;
    const config = THEME_CONFIG[theme];
    Object.entries(config).forEach(([key, value]) => {
      root.style.setProperty(key, value);
    });
    localStorage.setItem('visionary_theme', theme);
  }, [theme]);

  // Handlers
  const handleViewDetails = (template: VideoTemplate) => {
    setSelectedTemplate(template);
    setActiveSection(AppSection.TEMPLATES);
    window.scrollTo(0, 0);
  };

  const handleContact = (templateName?: string) => {
    setChatInitialMessage(templateName ? `你好，我想咨询关于【${templateName}】的详情。` : '你好，我想咨询视频定制。');
    setIsChatOpen(true);
  };

  const handleBackToHome = () => {
    setSelectedTemplate(null);
    setActiveSection(AppSection.HOME);
  };

  // Admin Handlers
  const handleAddTemplate = async (t: VideoTemplate) => {
    const { error } = await supabase.from('templates').insert([mapTemplateToDB(t)] as any);
    if (error) {
      const errMsg = (error as any)?.message || String(error);
      alert("添加失败: " + errMsg);
      console.error("Add failed", error);
    }
  };

  const handleUpdateTemplate = async (t: VideoTemplate) => {
    const { error } = await supabase.from('templates').update(mapTemplateToDB(t) as any).eq('id', t.id);
    if (error) {
      const errMsg = (error as any)?.message || String(error);
      alert("更新失败: " + errMsg);
      console.error("Update failed", error);
    }
  };

  const handleDeleteTemplate = async (id: string) => {
    const { error } = await supabase.from('templates').delete().eq('id', id);
    if (error) {
      const errMsg = (error as any)?.message || String(error);
      alert("删除失败: " + errMsg);
      console.error("Delete failed", error);
    }
  };

  const handleReorderTemplates = async (newOrder: VideoTemplate[]) => {
    setTemplates(newOrder); 
  };
  
  const handleUpdateSetting = async (key: string, value: string) => {
     const { error } = await supabase.from('settings').upsert({ key, value } as any);
     if (error) console.error(`Setting ${key} failed`, error as any);
  };

  const handleUpdateSiteContent = async (content: SiteContent) => {
    const updates: { key: string; value: string }[] = [
      { key: 'brand_name_zh', value: content.brandName.zh },
      { key: 'brand_name_en', value: content.brandName.en },
      { key: 'hero_title_zh', value: content.heroTitle.zh },
      { key: 'hero_title_en', value: content.heroTitle.en },
      { key: 'hero_subtitle_zh', value: content.heroSubtitle.zh },
      { key: 'hero_subtitle_en', value: content.heroSubtitle.en },
    ];
    for (const update of updates) {
      await supabase.from('settings').upsert(update as any);
    }
    setSiteContent(content);
  };

  // Filter Logic
  const filteredTemplates = useMemo(() => {
    return templates.filter(t => {
      const matchesSearch = t.title.toLowerCase().includes(searchTerm.toLowerCase()) || 
                            t.tags.some(tag => tag.toLowerCase().includes(searchTerm.toLowerCase()));
      const matchesTag = activeTag === 'ALL' || t.tags.includes(activeTag);
      return matchesSearch && matchesTag;
    });
  }, [templates, searchTerm, activeTag]);

  const allTags = useMemo(() => {
    const tags = new Set<string>();
    templates.forEach(t => t.tags.forEach(tag => tags.add(tag)));
    return ['ALL', ...Array.from(tags)];
  }, [templates]);

  const displayBrandName = siteContent.brandName[language] || t.app.title + ' ' + t.app.store;
  const displayHeroTitle = siteContent.heroTitle[language] || t.app.heroTitle;
  const displayHeroSubtitle = siteContent.heroSubtitle[language] || t.app.heroSubtitle;

  const renderNavItems = (mobile = false) => (
    <>
      {connectionError && (
        <span className="text-[10px] bg-red-500/20 text-red-500 px-2 py-1 rounded border border-red-500/30 font-mono w-fit animate-pulse flex items-center gap-1">
            <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
            连接失败
        </span>
      )}
      {!connectionError && dataSource === 'STATIC' && (
        <span className="text-[10px] bg-yellow-500/20 text-yellow-600 px-2 py-1 rounded border border-yellow-500/30 font-mono w-fit">
            {t.app.demoMode}
        </span>
      )}
      {dataSource === 'DB' && (
        <span className="text-[10px] bg-green-500/20 text-green-600 px-2 py-1 rounded border border-green-500/30 font-mono flex items-center gap-1 w-fit">
          <span className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse"></span>
          已连接数据库
        </span>
      )}

      <button
        onClick={() => {
            setLanguage(language === 'zh' ? 'en' : 'zh');
            if(mobile) setIsMobileMenuOpen(false);
        }}
        className={`text-xs font-bold uppercase tracking-widest text-anime-text-muted hover:text-anime-text transition-colors ${mobile ? 'text-left py-2' : ''}`}
      >
        {language === 'zh' ? 'Switch to English' : '切换中文'}
      </button>
      
      {!mobile && <div className="h-4 w-px bg-anime-text-muted/20"></div>}

      <button 
        onClick={() => {
            setTheme(theme === 'cyberpunk' ? 'anime' : 'cyberpunk');
            if(mobile) setIsMobileMenuOpen(false);
        }}
        className={`text-xs font-bold uppercase tracking-widest text-anime-text-muted hover:text-anime-text transition-colors flex items-center gap-2 ${mobile ? 'text-left py-2' : ''}`}
      >
        {theme === 'cyberpunk' ? '⚫ Cyberpunk' : '⚪ Anime'}
      </button>
      
      {!mobile && <div className="h-4 w-px bg-anime-text-muted/20"></div>}
      
      <button 
            onClick={() => {
                setActiveSection(AppSection.ADMIN);
                setIsMobileMenuOpen(false);
            }}
            className={`text-xs font-bold uppercase tracking-widest text-anime-text-muted hover:text-anime-primary transition-colors ${mobile ? 'text-left py-2 border-t border-anime-text-muted/10 mt-2 pt-4' : ''}`}
      >
        {t.app.adminBtn}
      </button>
    </>
  );

  return (
    <div className={`min-h-screen bg-anime-grid text-anime-text font-sans selection:bg-anime-primary selection:text-white pb-20 transition-colors duration-500`}>
      <SEO title={displayBrandName} />
      
      {activeSection !== AppSection.ADMIN && (
        <header className="sticky top-0 z-40 bg-anime-dark/90 backdrop-blur-md border-b border-anime-text-muted/10 shadow-sm">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
            <div 
              className="flex items-center gap-2 cursor-pointer group" 
              onClick={() => { setActiveSection(AppSection.HOME); setSelectedTemplate(null); }}
            >
              <div className="w-8 h-8 bg-anime-primary rounded flex items-center justify-center font-black italic text-white shadow-[0_0_10px_rgb(var(--color-primary))] group-hover:rotate-12 transition-transform">
                V
              </div>
              <span className="font-bold text-xl tracking-tighter italic text-anime-text group-hover:text-anime-primary transition-all">
                {displayBrandName}
              </span>
            </div>

            <div className="hidden md:flex items-center gap-6">
               {renderNavItems(false)}
            </div>

            <button 
                className="md:hidden p-2 text-anime-text-muted hover:text-anime-text"
                onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            >
                {isMobileMenuOpen ? (
                     <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
                ) : (
                     <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="3" y1="12" x2="21" y2="12"/><line x1="3" y1="6" x2="21" y2="6"/><line x1="3" y1="18" x2="21" y2="18"/></svg>
                )}
            </button>
          </div>

          {isMobileMenuOpen && (
              <div className="md:hidden absolute top-16 left-0 right-0 bg-anime-card border-b border-anime-text-muted/10 p-4 shadow-xl flex flex-col gap-2 animate-fade-in z-50">
                   {renderNavItems(true)}
              </div>
          )}
        </header>
      )}

      {/* Error Banner for Connection Issues */}
      {connectionError && (
        <div className="bg-red-900/80 border-b border-red-500/50 text-white text-sm text-center py-4 font-bold tracking-wider animate-pulse px-4 backdrop-blur-sm">
           <div className="max-w-4xl mx-auto flex flex-col items-center gap-2">
             <div className="flex items-center gap-2 text-red-200">
               <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
               <span>数据库连接失败 (CONNECTION FAILED)</span>
             </div>
             <div className="bg-black/50 px-4 py-2 rounded font-mono text-xs text-red-300 border border-red-500/30">
               错误详情: {errorMessage || 'Unknown Error'}
             </div>
             <div className="text-xs text-red-200/70 mt-1">
               提示: 如果显示 "relation does not exist"，请在 Supabase 后台 SQL Editor 运行建表代码。
             </div>
           </div>
        </div>
      )}

      <main>
        <Suspense fallback={<Loading />}>
        {activeSection === AppSection.ADMIN ? (
          <AdminPanel 
            templates={templates}
            learningUrl={learningUrl}
            onUpdateUrl={(url) => handleUpdateSetting('learning_url', url)}
            wechatId={wechatId}
            onUpdateWechatId={(id) => handleUpdateSetting('wechat_id', id)}
            siteContent={siteContent}
            onUpdateSiteContent={handleUpdateSiteContent}
            onAdd={handleAddTemplate}
            onUpdate={handleUpdateTemplate}
            onDelete={handleDeleteTemplate}
            onReorder={handleReorderTemplates}
            onBack={() => setActiveSection(AppSection.HOME)}
          />
        ) : selectedTemplate ? (
          <TemplateDetail 
            template={selectedTemplate}
            allTemplates={templates}
            onBack={handleBackToHome}
            onContact={() => handleContact(selectedTemplate.title)}
            onSwitchTemplate={handleViewDetails}
          />
        ) : (
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 animate-fade-in">
             <div className="mb-12 space-y-6">
                <div className="text-center space-y-2">
                   <h1 className="text-4xl md:text-6xl font-black italic tracking-tighter text-transparent bg-clip-text bg-gradient-to-r from-anime-text via-anime-secondary to-anime-primary animate-pulse-slow">
                      {displayHeroTitle}
                   </h1>
                   <p className="text-anime-text-muted max-w-2xl mx-auto font-medium">
                     {displayHeroSubtitle}
                   </p>
                </div>

                <div className="flex flex-col md:flex-row gap-4 justify-between items-center bg-anime-card/50 p-4 rounded-2xl border border-anime-text-muted/10 backdrop-blur-sm shadow-sm">
                   <div className="flex gap-2 overflow-x-auto w-full md:w-auto pb-2 md:pb-0 no-scrollbar mask-linear-fade">
                      {allTags.map(tag => (
                        <button
                          key={tag}
                          onClick={() => setActiveTag(tag)}
                          className={`px-4 py-1.5 rounded-full text-xs font-bold uppercase tracking-wider whitespace-nowrap transition-all border ${
                            activeTag === tag 
                              ? 'bg-anime-primary text-white border-anime-primary shadow-lg shadow-anime-primary/20' 
                              : 'bg-anime-card text-anime-text-muted border-anime-text-muted/20 hover:bg-anime-text-muted/10 hover:text-anime-text'
                          }`}
                        >
                          {tag === 'ALL' ? t.app.allTags : `#${tag}`}
                        </button>
                      ))}
                   </div>
                   
                   <div className="relative w-full md:w-64 group">
                      <input 
                        type="text" 
                        placeholder={t.app.searchPlaceholder}
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full bg-anime-dark border border-anime-text-muted/20 rounded-lg pl-10 pr-4 py-2 text-sm text-anime-text focus:border-anime-secondary focus:outline-none transition-colors group-hover:border-anime-text-muted/40 placeholder-anime-text-muted/50"
                      />
                      <svg className="absolute left-3 top-2.5 text-anime-text-muted w-4 h-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"/></svg>
                   </div>
                </div>
             </div>

             {filteredTemplates.length > 0 ? (
               <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 lg:gap-8">
                 {filteredTemplates.map(template => (
                   <TemplateCard 
                     key={template.id} 
                     template={template} 
                     onContact={() => handleContact(template.title)}
                     onViewDetails={() => handleViewDetails(template)}
                   />
                 ))}
               </div>
             ) : (
               <div className="text-center py-20">
                  <div className="text-6xl mb-4 grayscale opacity-50">🛸</div>
                  <h3 className="text-xl font-bold text-anime-text mb-2">{t.app.noTemplatesTitle}</h3>
                  <p className="text-anime-text-muted">
                    {dataSource === 'DB' 
                      ? "数据库为空 (No Data)。请进入后台管理添加模版。" 
                      : t.app.noTemplatesDescStatic}
                  </p>
                  <button 
                    onClick={() => {setSearchTerm(''); setActiveTag('ALL');}}
                    className="mt-6 text-anime-secondary hover:underline font-bold"
                  >
                    {t.app.clearFilter}
                  </button>
               </div>
             )}
          </div>
        )}
        </Suspense>
      </main>

      <StickyFooter wechatId={wechatId} />
      
      <ChatWidget 
        isOpen={isChatOpen} 
        onClose={() => setIsChatOpen(false)} 
        defaultMessage={chatInitialMessage}
      />
    </div>
  );
};

export default App;