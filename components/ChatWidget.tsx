import React, { useState, useEffect, useRef } from 'react';
import { ChatMessage, ChatSession } from '../types';
import { supabase } from '../services/supabaseClient';
import { useLanguage } from '../LanguageContext';

interface ChatWidgetProps {
  isOpen: boolean;
  onClose: () => void;
  defaultMessage?: string;
}

export const ChatWidget: React.FC<ChatWidgetProps> = ({ isOpen, onClose, defaultMessage }) => {
  const { t } = useLanguage();
  const [input, setInput] = useState('');
  const [session, setSession] = useState<ChatSession | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const [userId] = useState(() => {
    const stored = localStorage.getItem('visionary_user_id');
    if (stored) return stored;
    const newId = 'user_' + Math.random().toString(36).substr(2, 9);
    localStorage.setItem('visionary_user_id', newId);
    return newId;
  });

  // Load or Create Session in Supabase
  useEffect(() => {
    const fetchOrCreateSession = async () => {
      // Try to find existing session
      const { data: existing, error } = await supabase
        .from('chat_sessions')
        .select('*')
        .eq('user_id', userId)
        .single();
      
      if (existing) {
         setSession({
           sessionId: existing.session_id,
           userId: existing.user_id,
           userName: existing.user_name,
           messages: existing.messages,
           lastUpdated: existing.last_updated,
           unreadAdminCount: existing.unread_admin_count,
           unreadUserCount: existing.unread_user_count
         });

         if (isOpen && existing.unread_user_count > 0) {
             await supabase.from('chat_sessions').update({ unread_user_count: 0 }).eq('session_id', existing.session_id);
         }

      } else {
        const newSessionId = userId; 
        const initialMessage: ChatMessage = {
           id: 'welcome',
           sender: 'admin',
           content: t.chat.defaultAdminMsg,
           timestamp: Date.now(),
           type: 'text'
        };

        const newSessionData = {
          session_id: newSessionId,
          user_id: userId,
          user_name: `访客 ${userId.substr(-4)}`,
          messages: [initialMessage],
          last_updated: Date.now(),
          unread_admin_count: 0,
          unread_user_count: 1
        };

        const { error: insertError } = await supabase.from('chat_sessions').insert([newSessionData]);
        if (!insertError) {
          setSession({
             sessionId: newSessionId,
             userId: userId,
             userName: newSessionData.user_name,
             messages: [initialMessage],
             lastUpdated: newSessionData.last_updated,
             unreadAdminCount: 0,
             unreadUserCount: 1
          });
        }
      }
    };

    fetchOrCreateSession();

    const channel = supabase.channel(`user-chat-${userId}`)
      .on(
        'postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'chat_sessions', filter: `user_id=eq.${userId}` },
        (payload) => {
          const newData = payload.new;
          setSession({
             sessionId: newData.session_id,
             userId: newData.user_id,
             userName: newData.user_name,
             messages: newData.messages,
             lastUpdated: newData.last_updated,
             unreadAdminCount: newData.unread_admin_count,
             unreadUserCount: newData.unread_user_count
          });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [userId]);

  useEffect(() => {
     if (isOpen && session && session.unreadUserCount > 0) {
        supabase.from('chat_sessions').update({ unread_user_count: 0 }).eq('session_id', session.sessionId);
     }
  }, [isOpen, session?.sessionId]);

  useEffect(() => {
    if (defaultMessage && session) {
      handleSend(defaultMessage, 'text');
    }
  }, [defaultMessage]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [session?.messages, isOpen]);

  const handleSend = async (content: string = input, type: 'text' | 'image' | 'video' = 'text') => {
    if (!content.trim() || !session) return;

    const newMessage: ChatMessage = {
      id: Date.now().toString(),
      sender: 'user',
      content: content,
      timestamp: Date.now(),
      type: 'text'
    };

    const updatedMessages = [...session.messages, newMessage];
    
    setSession(prev => prev ? { ...prev, messages: updatedMessages } : null);
    if (type === 'text') setInput('');

    await supabase.from('chat_sessions').update({
       messages: updatedMessages,
       last_updated: Date.now(),
       unread_admin_count: session.unreadAdminCount + 1
    }).eq('session_id', session.sessionId);
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || e.target.files.length === 0) return;
    const file = e.target.files[0];
    const isVideo = file.type.startsWith('video/');
    const isImage = file.type.startsWith('image/');

    if (!isVideo && !isImage) {
      alert("只支持图片或视频文件");
      return;
    }

    setIsUploading(true);
    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${userId}_${Date.now()}.${fileExt}`;
      const filePath = `${fileName}`;

      const { data, error } = await supabase.storage
        .from('chat-uploads')
        .upload(filePath, file);

      if (error) throw error;

      const { data: { publicUrl } } = supabase.storage
        .from('chat-uploads')
        .getPublicUrl(filePath);

      await handleSend(publicUrl, isVideo ? 'video' : 'image');
    } catch (error: any) {
      console.error('Upload failed:', error);
      alert('上传失败，请重试');
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const renderMessageContent = (msg: ChatMessage) => {
    if (msg.type === 'image') {
      return (
        <img 
          src={msg.content} 
          alt="sent image" 
          className="max-w-full rounded-lg cursor-pointer hover:opacity-90 transition-opacity"
          onClick={() => window.open(msg.content, '_blank')}
        />
      );
    }
    if (msg.type === 'video') {
      return (
        <video 
          src={msg.content} 
          controls 
          className="max-w-full rounded-lg"
        />
      );
    }
    return msg.content;
  };

  if (!isOpen) return null;

  return (
    <div className="fixed bottom-24 right-4 z-[60] w-[90vw] md:w-[380px] h-[500px] bg-anime-card border border-anime-text-muted/20 rounded-2xl shadow-2xl flex flex-col overflow-hidden animate-fade-in backdrop-blur-xl">
      {/* Header */}
      <div className="bg-anime-dark/90 p-4 border-b border-white/5 flex justify-between items-center relative overflow-hidden">
        <div className="absolute inset-0 bg-anime-grid opacity-10 pointer-events-none"></div>
        <div className="flex items-center gap-3 relative z-10">
          <div className="w-10 h-10 rounded-full bg-anime-primary flex items-center justify-center border-2 border-white/20 shadow-[0_0_10px_rgb(var(--color-primary))]">
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>
          </div>
          <div>
            <div className="font-black text-white italic tracking-wider">{t.chat.onlineService}</div>
            <div className="flex items-center gap-1.5">
               <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></span>
               <span className="text-[10px] text-green-400 font-bold uppercase">{t.chat.onlineStatus}</span>
            </div>
          </div>
        </div>
        <button onClick={onClose} className="p-2 hover:bg-white/10 rounded-full transition-colors relative z-10 group" aria-label={t.chat.closeLabel}>
          <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-slate-400 group-hover:text-white transition-colors"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
        </button>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-anime-dark/50">
        {session?.messages.map((msg) => (
          <div key={msg.id} className={`flex ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}>
             {msg.sender === 'admin' && (
                <div className="w-8 h-8 rounded-full bg-anime-secondary/20 flex items-center justify-center mr-2 shrink-0 border border-anime-secondary/50">
                   <span className="text-[10px] font-bold text-anime-secondary">{t.chat.adminLabel}</span>
                </div>
             )}
            <div className={`max-w-[80%] rounded-2xl p-3 text-sm font-medium leading-relaxed relative group ${
              msg.sender === 'user' 
                ? 'bg-anime-primary text-white rounded-br-none shadow-[0_0_15px_rgb(var(--color-primary)/0.3)]' 
                : 'bg-anime-card border border-anime-text-muted/10 text-anime-text rounded-bl-none shadow-sm'
            }`}>
              {renderMessageContent(msg)}
              <div className={`text-[9px] mt-1 opacity-50 ${msg.sender === 'user' ? 'text-white' : 'text-anime-text-muted'}`}>
                {new Date(msg.timestamp).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
              </div>
            </div>
          </div>
        ))}
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div className="p-4 bg-anime-card border-t border-anime-text-muted/10">
        <form 
          onSubmit={(e) => { e.preventDefault(); handleSend(input, 'text'); }}
          className="flex items-center gap-2 bg-anime-dark border border-anime-text-muted/20 rounded-full px-4 py-2 focus-within:border-anime-secondary transition-colors shadow-inner"
        >
          <input 
            type="file" 
            ref={fileInputRef}
            className="hidden" 
            accept="image/*,video/*"
            onChange={handleFileUpload}
          />
          <button 
            type="button"
            onClick={() => fileInputRef.current?.click()}
            disabled={isUploading}
            className="p-1 text-anime-text-muted hover:text-anime-primary transition-colors disabled:opacity-50"
          >
            {isUploading ? (
              <span className="w-4 h-4 border-2 border-anime-text-muted border-t-transparent rounded-full animate-spin block"></span>
            ) : (
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"/><circle cx="8.5" cy="8.5" r="1.5"/><polyline points="21 15 16 10 5 21"/></svg>
            )}
          </button>

          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder={t.chat.inputPlaceholder}
            className="flex-1 bg-transparent text-anime-text text-sm focus:outline-none placeholder-anime-text-muted/50"
          />
          <button 
            type="submit"
            disabled={!input.trim()}
            className="p-2 bg-anime-secondary/20 rounded-full text-anime-secondary hover:bg-anime-secondary hover:text-black transition-all disabled:opacity-50 disabled:hover:bg-anime-secondary/20 disabled:hover:text-anime-secondary"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="22" y1="2" x2="11" y2="13"/><polygon points="22 2 15 22 11 13 2 9 22 2"/></svg>
          </button>
        </form>
      </div>
    </div>
  );
};