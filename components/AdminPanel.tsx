import React, { useState, useEffect, useRef } from 'react';
import { VideoTemplate, ChatSession, ChatMessage, SiteContent } from '../types';
import { supabase } from '../services/supabaseClient';
import { useLanguage } from '../LanguageContext';

interface AdminPanelProps {
  templates: VideoTemplate[];
  learningUrl: string;
  onUpdateUrl: (url: string) => void;
  wechatId: string;
  onUpdateWechatId: (id: string) => void;
  siteContent: SiteContent;
  onUpdateSiteContent: (content: SiteContent) => void;
  onAdd: (template: VideoTemplate) => void;
  onUpdate: (template: VideoTemplate) => void;
  onDelete: (id: string) => void;
  onReorder: (templates: VideoTemplate[]) => void;
  onBack: () => void;
}

// Helper to generate UUIDs compatible with Supabase uuid type
function generateUUID() {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) {
    return crypto.randomUUID();
  }
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
    var r = Math.random() * 16 | 0, v = c == 'x' ? r : (r & 0x3 | 0x8);
    return v.toString(16);
  });
}

export const AdminPanel: React.FC<AdminPanelProps> = ({ 
  templates, 
  learningUrl, 
  onUpdateUrl, 
  wechatId,
  onUpdateWechatId,
  siteContent,
  onUpdateSiteContent,
  onAdd, 
  onUpdate, 
  onDelete,
  onReorder,
  onBack 
}) => {
  const { t } = useLanguage();
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [editingTemplate, setEditingTemplate] = useState<VideoTemplate | null>(null);
  const [isCreating, setIsCreating] = useState(false);
  const [activeTab, setActiveTab] = useState<'templates' | 'chat'>('templates');

  // Config State
  const [configUrl, setConfigUrl] = useState('');
  const [configWechatId, setConfigWechatId] = useState('');
  const [localSiteContent, setLocalSiteContent] = useState<SiteContent>({
    brandName: { zh: '', en: '' },
    heroTitle: { zh: '', en: '' },
    heroSubtitle: { zh: '', en: '' },
  });

  // Chat State
  const [sessions, setSessions] = useState<ChatSession[]>([]);
  const [selectedSessionId, setSelectedSessionId] = useState<string | null>(null);
  const [chatInput, setChatInput] = useState('');
  const chatEndRef = useRef<HTMLDivElement>(null);

  // Form state
  const [formData, setFormData] = useState<VideoTemplate>({
    id: '',
    title: '',
    price: '',
    description: '',
    imageUrl: '',
    videoUrl: '',
    tags: []
  });

  const [tagsInput, setTagsInput] = useState('');

  // Auto-login
  useEffect(() => {
    const sessionAuth = sessionStorage.getItem('admin_auth');
    if (sessionAuth === 'true') {
      setIsAuthenticated(true);
    }
  }, []);

  // Sync props to local state
  useEffect(() => {
    setConfigUrl(learningUrl);
    setConfigWechatId(wechatId);
    setLocalSiteContent(siteContent);
  }, [learningUrl, wechatId, siteContent]);

  // Poll/Subscribe for chat sessions from Supabase
  useEffect(() => {
    if (!isAuthenticated) return;
    
    const fetchSessions = async () => {
      const { data, error } = await supabase
        .from('chat_sessions')
        .select('*')
        .order('last_updated', { ascending: false });
      
      if (!error && data) {
        const mappedSessions: ChatSession[] = data.map(s => ({
            sessionId: s.session_id,
            userId: s.user_id,
            userName: s.user_name,
            messages: s.messages,
            lastUpdated: s.last_updated,
            unreadAdminCount: s.unread_admin_count,
            unreadUserCount: s.unread_user_count
        }));
        setSessions(mappedSessions);
      }
    };

    fetchSessions();

    const channel = supabase.channel('admin-chat-list')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'chat_sessions' },
        () => {
          fetchSessions();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [isAuthenticated]);

  useEffect(() => {
    if (activeTab === 'chat' && selectedSessionId) {
       chatEndRef.current?.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    }
  }, [sessions, activeTab, selectedSessionId]);

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (password === '4066') {
      setIsAuthenticated(true);
      sessionStorage.setItem('admin_auth', 'true');
      setError('');
    } else {
      setError(t.admin.errorPass);
    }
  };

  const handleSendReply = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!chatInput.trim() || !selectedSessionId) return;

    const currentSession = sessions.find(s => s.sessionId === selectedSessionId);
    if (!currentSession) return;

    const newMessage: ChatMessage = {
      id: Date.now().toString(),
      sender: 'admin',
      content: chatInput,
      timestamp: Date.now(),
      type: 'text'
    };

    const updatedMessages = [...currentSession.messages, newMessage];

    const { error } = await supabase
      .from('chat_sessions')
      .update({
        messages: updatedMessages,
        last_updated: Date.now(),
        unread_user_count: currentSession.unreadUserCount + 1,
        unread_admin_count: 0
      })
      .eq('session_id', selectedSessionId);

    if (!error) {
      setChatInput('');
      setSessions(prev => prev.map(s => 
        s.sessionId === selectedSessionId 
          ? { 
              ...s, 
              messages: updatedMessages, 
              lastUpdated: Date.now(), 
              unreadUserCount: s.unreadUserCount + 1,
              unreadAdminCount: 0 
            }
          : s
      ).sort((a, b) => b.lastUpdated - a.lastUpdated));
    } else {
      alert("发送失败，请重试");
    }
  };

  const handleSelectSession = async (id: string) => {
    setSelectedSessionId(id);
    
    const session = sessions.find(s => s.sessionId === id);
    if (session && session.unreadAdminCount > 0) {
      await supabase
        .from('chat_sessions')
        .update({ unread_admin_count: 0 })
        .eq('session_id', id);
        
      setSessions(prev => prev.map(s => 
        s.sessionId === id ? { ...s, unreadAdminCount: 0 } : s
      ));
    }
  };

  const handleStartEdit = (template: VideoTemplate) => {
    setEditingTemplate(template);
    setFormData(template);
    setTagsInput(template.tags.join(', '));
    setIsCreating(false);
  };

  const handleStartCreate = () => {
    const newTemplate: VideoTemplate = {
      id: generateUUID(),
      title: '',
      price: '¥',
      description: '',
      imageUrl: '',
      videoUrl: '',
      tags: []
    };
    setEditingTemplate(newTemplate);
    setFormData(newTemplate);
    setTagsInput('');
    setIsCreating(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    const finalData: VideoTemplate = {
      ...formData,
      tags: tagsInput.split(/[,，]/).map(t => t.trim()).filter(Boolean)
    };

    if (isCreating) {
      onAdd(finalData);
    } else {
      onUpdate(finalData);
    }

    setEditingTemplate(null);
  };

  const handleConfigSave = () => {
    onUpdateUrl(configUrl);
    onUpdateWechatId(configWechatId);
    onUpdateSiteContent(localSiteContent);
    alert('配置已保存 / Configuration Saved');
  };

  const moveUp = (index: number) => {
    if (index === 0) return;
    const newTemplates = [...templates];
    [newTemplates[index - 1], newTemplates[index]] = [newTemplates[index], newTemplates[index - 1]];
    onReorder(newTemplates);
  };

  const moveDown = (index: number) => {
    if (index === templates.length - 1) return;
    const newTemplates = [...templates];
    [newTemplates[index + 1], newTemplates[index]] = [newTemplates[index], newTemplates[index + 1]];
    onReorder(newTemplates);
  };

  if (!isAuthenticated) {
    return (
      <div className="flex items-center justify-center min-h-[70vh] animate-fade-in bg-anime-grid bg-grid-size">
        <div className="bg-anime-dark/90 backdrop-blur-lg p-1 border-2 border-anime-primary/50 rounded-none w-full max-w-md relative shadow-[0_0_50px_rgba(255,0,128,0.2)]">
          <div className="absolute top-0 left-0 w-4 h-4 bg-anime-primary"></div>
          <div className="absolute bottom-0 right-0 w-4 h-4 bg-anime-primary"></div>
          
          <div className="bg-slate-900/80 p-10 border border-white/5">
            <div className="text-center mb-8">
              <div className="text-anime-secondary font-mono text-xs mb-2 tracking-[0.5em]">{t.admin.systemLogin}</div>
              <h2 className="text-3xl font-black text-white uppercase italic tracking-tighter"><span className="text-anime-primary">{t.admin.terminal}</span></h2>
            </div>
            <form onSubmit={handleLogin} className="space-y-6">
              <div>
                <label className="block text-[10px] font-bold text-anime-secondary uppercase mb-2 tracking-widest font-mono">{t.admin.passkey}</label>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full bg-black border border-slate-700 p-4 text-white focus:border-anime-primary focus:ring-1 focus:ring-anime-primary outline-none transition-all font-mono text-center tracking-[0.5em] text-xl text-anime-primary"
                  placeholder="••••"
                />
              </div>
              {error && <div className="text-red-500 text-xs font-mono border border-red-500/30 bg-red-500/10 p-2 text-center blinking-cursor">&gt;&gt; {error}</div>}
              <button
                type="submit"
                className="w-full bg-white text-black font-black uppercase tracking-widest py-4 hover:bg-anime-primary hover:text-white transition-all skew-x-[-10deg]"
              >
                <div className="skew-x-[10deg]">{t.admin.verify}</div>
              </button>
              <button
                type="button"
                onClick={onBack}
                className="w-full text-slate-500 hover:text-white text-xs py-2 uppercase tracking-widest font-mono hover:underline"
              >
                {t.admin.exit}
              </button>
            </form>
          </div>
        </div>
      </div>
    );
  }

  if (editingTemplate) {
    return (
      <div className="max-w-4xl mx-auto p-6 animate-fade-in font-sans">
        <div className="flex items-center gap-2 mb-6 text-slate-400 hover:text-anime-secondary cursor-pointer" onClick={() => setEditingTemplate(null)}>
           <span className="font-mono text-lg">&lt;</span>
           <span className="text-xs font-bold uppercase tracking-widest">{t.detail.back}</span>
        </div>
        
        <div className="bg-slate-900 border-l-4 border-anime-secondary p-8 shadow-2xl relative overflow-hidden">
          <div className="absolute top-0 right-0 p-4 opacity-10 text-9xl font-black text-white select-none pointer-events-none">EDIT</div>
          
          <div className="relative z-10">
             <h2 className="text-3xl font-black text-white mb-8 italic uppercase">
               {isCreating ? t.admin.create : t.admin.edit}
             </h2>
             
             <form onSubmit={handleSubmit} className="space-y-8">
               <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                 <div className="group">
                   <label className="block text-[10px] font-bold text-anime-secondary uppercase mb-2 tracking-widest font-mono">{t.admin.title}</label>
                   <input
                     type="text"
                     required
                     value={formData.title}
                     onChange={e => setFormData({...formData, title: e.target.value})}
                     className="w-full bg-black border border-slate-700 p-3 text-white focus:border-anime-secondary outline-none transition-colors font-medium"
                   />
                 </div>
                 <div className="group">
                   <label className="block text-[10px] font-bold text-anime-secondary uppercase mb-2 tracking-widest font-mono">{t.admin.price}</label>
                   <input
                     type="text"
                     required
                     value={formData.price}
                     onChange={e => setFormData({...formData, price: e.target.value})}
                     className="w-full bg-black border border-slate-700 p-3 text-white focus:border-anime-secondary outline-none transition-colors font-medium"
                   />
                 </div>
               </div>
   
               <div className="group">
                 <label className="block text-[10px] font-bold text-anime-secondary uppercase mb-2 tracking-widest font-mono">{t.admin.description}</label>
                 <textarea
                   required
                   rows={4}
                   value={formData.description}
                   onChange={e => setFormData({...formData, description: e.target.value})}
                   className="w-full bg-black border border-slate-700 p-3 text-white focus:border-anime-secondary outline-none transition-colors font-medium"
                 />
               </div>
   
               <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                 <div className="group">
                   <label className="block text-[10px] font-bold text-anime-secondary uppercase mb-2 tracking-widest font-mono">{t.admin.imageUrl}</label>
                   <input
                     type="text"
                     required
                     value={formData.imageUrl}
                     onChange={e => setFormData({...formData, imageUrl: e.target.value})}
                     className="w-full bg-black border border-slate-700 p-3 text-white focus:border-anime-secondary outline-none transition-colors font-mono text-xs"
                   />
                 </div>
                 <div className="group">
                   <label className="block text-[10px] font-bold text-anime-secondary uppercase mb-2 tracking-widest font-mono">{t.admin.videoUrl}</label>
                   <input
                     type="text"
                     value={formData.videoUrl || ''}
                     onChange={e => setFormData({...formData, videoUrl: e.target.value})}
                     placeholder="支持 MP4直链 / Bilibili / YouTube 链接"
                     className="w-full bg-black border border-slate-700 p-3 text-white focus:border-anime-secondary outline-none transition-colors font-mono text-xs"
                   />
                   <p className="text-[9px] text-slate-500 mt-1">{t.admin.videoUrlHint}</p>
                 </div>
               </div>
   
               <div className="group">
                 <label className="block text-[10px] font-bold text-anime-secondary uppercase mb-2 tracking-widest font-mono">{t.admin.tags}</label>
                 <input
                   type="text"
                   value={tagsInput}
                   onChange={e => setTagsInput(e.target.value)}
                   className="w-full bg-black border border-slate-700 p-3 text-white focus:border-anime-secondary outline-none transition-colors font-mono text-sm"
                 />
               </div>
   
               <div className="pt-6 flex gap-4">
                 <button
                   type="submit"
                   className="flex-1 bg-anime-primary hover:bg-pink-600 text-white font-black py-4 uppercase tracking-widest transition-all skew-x-[-10deg]"
                 >
                   <div className="skew-x-[10deg]">{t.admin.save}</div>
                 </button>
                 <button
                   type="button"
                   onClick={() => setEditingTemplate(null)}
                   className="px-8 bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold py-4 uppercase tracking-widest transition-all skew-x-[-10deg]"
                 >
                   <div className="skew-x-[10deg]">{t.admin.cancel}</div>
                 </button>
               </div>
             </form>
          </div>
        </div>
      </div>
    );
  }

  const currentSession = sessions.find(s => s.sessionId === selectedSessionId);

  return (
    <div className="max-w-7xl mx-auto px-4 py-8 animate-fade-in font-sans">
      <div className="flex flex-col md:flex-row justify-between items-end mb-10 border-b border-white/10 pb-6 gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
             <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
             <span className="text-[10px] font-mono text-green-500 uppercase tracking-widest">{t.admin.systemOnline}</span>
          </div>
          <h2 className="text-4xl font-black text-white tracking-tighter italic">{t.admin.panelTitle}</h2>
        </div>
        <div className="flex gap-4">
           <button
            onClick={onBack}
            className="px-6 py-2 text-slate-500 hover:text-white transition-colors font-mono text-xs border border-transparent hover:border-slate-500 uppercase tracking-widest"
          >
            {t.admin.logout}
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-4 mb-8">
        <button 
          onClick={() => setActiveTab('templates')}
          className={`flex-1 py-3 px-6 text-sm font-bold uppercase tracking-widest transition-all border ${
            activeTab === 'templates' 
              ? 'bg-anime-primary text-white border-anime-primary' 
              : 'bg-slate-900 text-slate-500 border-slate-700 hover:border-slate-500'
          }`}
        >
          {t.admin.tabTemplates}
        </button>
        <button 
          onClick={() => setActiveTab('chat')}
          className={`flex-1 py-3 px-6 text-sm font-bold uppercase tracking-widest transition-all border ${
            activeTab === 'chat' 
              ? 'bg-anime-secondary text-black border-anime-secondary' 
              : 'bg-slate-900 text-slate-500 border-slate-700 hover:border-slate-500'
          }`}
        >
          {t.admin.tabChat}
          {sessions.reduce((acc, s) => acc + s.unreadAdminCount, 0) > 0 && (
            <span className="ml-2 bg-red-500 text-white px-2 py-0.5 rounded-full text-xs animate-pulse">
              {sessions.reduce((acc, s) => acc + s.unreadAdminCount, 0)}
            </span>
          )}
        </button>
      </div>

      {/* Content Area */}
      {activeTab === 'templates' ? (
        <>
          {/* Global Config Section */}
          <div className="bg-slate-900/50 border border-slate-700 p-6 mb-8 rounded-lg">
            <h3 className="text-xl font-black text-white italic mb-4 flex items-center gap-2">
              <span className="text-anime-primary">#</span> {t.admin.globalConfig}
            </h3>
            
            <div className="space-y-6">
               {/* 1. Basic Links */}
               <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pb-6 border-b border-white/5">
                 <div>
                    <label className="block text-[10px] font-bold text-slate-400 uppercase mb-2 tracking-widest">{t.admin.learningLink}</label>
                    <input 
                      type="text" 
                      value={configUrl}
                      onChange={(e) => setConfigUrl(e.target.value)}
                      className="w-full bg-black border border-slate-600 p-3 text-white text-sm focus:border-anime-secondary outline-none font-mono"
                    />
                 </div>
                 <div>
                    <label className="block text-[10px] font-bold text-slate-400 uppercase mb-2 tracking-widest">{t.admin.wechatId}</label>
                    <input 
                      type="text" 
                      value={configWechatId}
                      onChange={(e) => setConfigWechatId(e.target.value)}
                      className="w-full bg-black border border-slate-600 p-3 text-white text-sm focus:border-anime-secondary outline-none font-mono"
                    />
                 </div>
               </div>

               {/* 2. Site Content Editing */}
               <div>
                  <h4 className="text-sm font-bold text-white mb-4 uppercase tracking-widest border-l-2 border-anime-secondary pl-2">文案设置 / Site Content</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                     {/* Brand Name */}
                     <div className="p-4 bg-black/40 rounded border border-white/5 space-y-3">
                        <label className="text-[10px] font-bold text-anime-secondary uppercase tracking-widest">Logo 品牌名 (Brand)</label>
                        <input 
                           placeholder="中文 (默认: VISIONARY STORE)"
                           value={localSiteContent.brandName.zh}
                           onChange={e => setLocalSiteContent({...localSiteContent, brandName: {...localSiteContent.brandName, zh: e.target.value}})}
                           className="w-full bg-slate-900 border border-slate-600 p-2 text-white text-xs mb-2"
                        />
                         <input 
                           placeholder="English (Default: VISIONARY STORE)"
                           value={localSiteContent.brandName.en}
                           onChange={e => setLocalSiteContent({...localSiteContent, brandName: {...localSiteContent.brandName, en: e.target.value}})}
                           className="w-full bg-slate-900 border border-slate-600 p-2 text-white text-xs"
                        />
                     </div>

                     {/* Hero Title */}
                     <div className="p-4 bg-black/40 rounded border border-white/5 space-y-3">
                        <label className="text-[10px] font-bold text-anime-secondary uppercase tracking-widest">主标题 (Hero Title)</label>
                        <input 
                           placeholder="中文 (默认: CREATIVE TEMPLATES)"
                           value={localSiteContent.heroTitle.zh}
                           onChange={e => setLocalSiteContent({...localSiteContent, heroTitle: {...localSiteContent.heroTitle, zh: e.target.value}})}
                           className="w-full bg-slate-900 border border-slate-600 p-2 text-white text-xs mb-2"
                        />
                         <input 
                           placeholder="English (Default: CREATIVE TEMPLATES)"
                           value={localSiteContent.heroTitle.en}
                           onChange={e => setLocalSiteContent({...localSiteContent, heroTitle: {...localSiteContent.heroTitle, en: e.target.value}})}
                           className="w-full bg-slate-900 border border-slate-600 p-2 text-white text-xs"
                        />
                     </div>

                     {/* Hero Subtitle */}
                     <div className="p-4 bg-black/40 rounded border border-white/5 space-y-3 md:col-span-2">
                        <label className="text-[10px] font-bold text-anime-secondary uppercase tracking-widest">副标题 (Hero Subtitle)</label>
                        <input 
                           placeholder="中文描述..."
                           value={localSiteContent.heroSubtitle.zh}
                           onChange={e => setLocalSiteContent({...localSiteContent, heroSubtitle: {...localSiteContent.heroSubtitle, zh: e.target.value}})}
                           className="w-full bg-slate-900 border border-slate-600 p-2 text-white text-xs mb-2"
                        />
                         <input 
                           placeholder="English description..."
                           value={localSiteContent.heroSubtitle.en}
                           onChange={e => setLocalSiteContent({...localSiteContent, heroSubtitle: {...localSiteContent.heroSubtitle, en: e.target.value}})}
                           className="w-full bg-slate-900 border border-slate-600 p-2 text-white text-xs"
                        />
                     </div>
                  </div>
               </div>

               <div className="flex justify-end pt-4">
                <button 
                  onClick={handleConfigSave}
                  className="px-8 py-3 bg-anime-primary hover:bg-pink-600 text-white font-bold transition-all shadow-lg shadow-anime-primary/20"
                >
                  {t.admin.saveConfig}
                </button>
               </div>
            </div>
          </div>

          <div className="flex justify-end mb-4">
            <button
              onClick={handleStartCreate}
              className="bg-anime-secondary text-black hover:bg-white px-6 py-2 font-bold uppercase tracking-wider flex items-center gap-2 shadow-[0_0_15px_rgba(0,240,255,0.3)] transition-all skew-x-[-10deg]"
            >
              <div className="skew-x-[10deg] flex items-center gap-2">
                 <span>{t.admin.addTemplate}</span>
              </div>
            </button>
          </div>

          <div className="grid gap-4">
            {templates.map((template, index) => (
              <div key={template.id} className="bg-slate-900 border border-slate-700 p-4 flex flex-col sm:flex-row items-center gap-6 hover:border-anime-primary transition-all group relative overflow-hidden">
                <div className="absolute top-0 right-0 p-2 opacity-5 font-black text-6xl text-white select-none pointer-events-none group-hover:opacity-10 transition-opacity">DATA</div>
                
                {/* Sort Controls */}
                <div className="flex flex-col gap-1 z-10">
                  <button 
                    onClick={() => moveUp(index)}
                    disabled={index === 0}
                    className="p-1 text-slate-500 hover:text-anime-secondary disabled:opacity-30 disabled:hover:text-slate-500 transition-colors bg-slate-800 rounded-sm"
                    title={t.admin.moveUp}
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="18 15 12 9 6 15"/></svg>
                  </button>
                  <button 
                    onClick={() => moveDown(index)}
                    disabled={index === templates.length - 1}
                    className="p-1 text-slate-500 hover:text-anime-secondary disabled:opacity-30 disabled:hover:text-slate-500 transition-colors bg-slate-800 rounded-sm"
                    title={t.admin.moveDown}
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="6 9 12 15 18 9"/></svg>
                  </button>
                </div>

                <div className="relative w-32 h-20 flex-shrink-0 border border-slate-600 group-hover:border-anime-secondary transition-colors">
                   <img src={template.imageUrl} alt={template.title} className="w-full h-full object-cover" />
                   <div className="absolute top-0 left-0 bg-anime-secondary text-black text-[9px] font-bold px-1 font-mono">ID: {template.id}</div>
                </div>
                
                <div className="flex-1 text-center sm:text-left min-w-0 z-10">
                  <h3 className="font-bold text-white text-lg truncate font-sans">{template.title}</h3>
                  <div className="flex flex-wrap gap-2 mt-2 justify-center sm:justify-start">
                     {template.tags.map(t => <span key={t} className="text-[10px] bg-black text-slate-400 border border-slate-800 px-1 font-mono uppercase">{t}</span>)}
                  </div>
                </div>
                
                <div className="flex items-center gap-6 flex-shrink-0 z-10">
                  <span className="font-black text-anime-yellow text-xl italic">{template.price}</span>
                  <div className="flex gap-2">
                    <button 
                      onClick={() => handleStartEdit(template)}
                      className="px-4 py-2 bg-blue-600/20 text-blue-400 hover:bg-blue-600 hover:text-white border border-blue-600/50 uppercase text-xs font-bold tracking-wider transition-colors"
                    >
                      {t.admin.editBtn}
                    </button>
                    <button 
                      onClick={() => {
                        if(window.confirm(t.admin.confirmDelete)) {
                          onDelete(template.id);
                        }
                      }}
                      className="px-4 py-2 bg-red-600/20 text-red-400 hover:bg-red-600 hover:text-white border border-red-600/50 uppercase text-xs font-bold tracking-wider transition-colors"
                    >
                      {t.admin.deleteBtn}
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </>
      ) : (
        /* Chat Console */
        <div className="flex h-[600px] border border-slate-700 bg-slate-900 rounded-lg overflow-hidden animate-fade-in">
          {/* Sidebar */}
          <div className="w-1/3 border-r border-slate-700 flex flex-col">
            <div className="p-4 border-b border-slate-700 bg-black/20">
               <h3 className="font-bold text-white">{t.admin.chatList} ({sessions.length})</h3>
            </div>
            <div className="flex-1 overflow-y-auto">
              {sessions.length === 0 ? (
                <div className="p-8 text-center text-slate-500 text-sm">{t.admin.noMessages}</div>
              ) : (
                sessions.map(session => (
                  <div 
                    key={session.sessionId}
                    onClick={() => handleSelectSession(session.sessionId)}
                    className={`p-4 border-b border-slate-800 cursor-pointer transition-colors hover:bg-white/5 ${selectedSessionId === session.sessionId ? 'bg-anime-primary/10 border-l-4 border-l-anime-primary' : ''}`}
                  >
                    <div className="flex justify-between items-start mb-1">
                       <span className={`font-bold ${session.unreadAdminCount > 0 ? 'text-white' : 'text-slate-300'}`}>{session.userName}</span>
                       <span className="text-[10px] text-slate-500">{new Date(session.lastUpdated).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</span>
                    </div>
                    <div className="flex justify-between items-center">
                       <p className="text-xs text-slate-400 truncate max-w-[150px]">
                         {session.messages[session.messages.length - 1]?.content || 'No messages'}
                       </p>
                       {session.unreadAdminCount > 0 && (
                         <span className="w-5 h-5 rounded-full bg-anime-secondary text-black text-[10px] font-bold flex items-center justify-center">
                           {session.unreadAdminCount}
                         </span>
                       )}
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Chat Area */}
          <div className="flex-1 flex flex-col bg-black/40">
            {selectedSessionId && currentSession ? (
              <>
                 <div className="p-4 border-b border-slate-700 bg-black/20 flex justify-between items-center">
                    <span className="font-bold text-white">{currentSession.userName}</span>
                 </div>
                 
                 <div className="flex-1 overflow-y-auto p-4 space-y-4">
                    {currentSession.messages.map(msg => (
                      <div key={msg.id} className={`flex ${msg.sender === 'admin' ? 'justify-end' : 'justify-start'}`}>
                         <div className={`max-w-[70%] rounded-xl p-3 text-sm ${
                           msg.sender === 'admin' 
                             ? 'bg-anime-secondary text-black' 
                             : 'bg-slate-700 text-white'
                         }`}>
                            {msg.content}
                         </div>
                      </div>
                    ))}
                    <div ref={chatEndRef} />
                 </div>

                 <div className="p-4 border-t border-slate-700 bg-black/20">
                    <form onSubmit={handleSendReply} className="flex gap-2">
                       <input 
                         type="text" 
                         value={chatInput}
                         onChange={(e) => setChatInput(e.target.value)}
                         placeholder={t.admin.replyPlaceholder}
                         className="flex-1 bg-slate-800 border border-slate-600 rounded-lg px-4 py-2 text-white text-sm focus:border-anime-secondary focus:outline-none"
                       />
                       <button 
                         type="submit"
                         className="bg-anime-primary text-white px-6 py-2 rounded-lg font-bold text-sm hover:bg-pink-600 transition-colors"
                       >
                         {t.admin.send}
                       </button>
                    </form>
                 </div>
              </>
            ) : (
              <div className="flex-1 flex flex-col items-center justify-center text-slate-500">
                 <div className="text-4xl mb-4">💬</div>
                 <p>{t.admin.selectChat}</p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};