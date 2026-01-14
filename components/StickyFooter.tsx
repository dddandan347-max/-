import React, { useState } from 'react';
import { useLanguage } from '../LanguageContext';

interface StickyFooterProps {
  wechatId: string;
}

export const StickyFooter: React.FC<StickyFooterProps> = ({ wechatId }) => {
  const { t } = useLanguage();
  const [showToast, setShowToast] = useState(false);
  const [showModal, setShowModal] = useState(false);

  const handleCopyWeChat = () => {
    navigator.clipboard.writeText(wechatId).then(() => {
      setShowToast(true);
      setTimeout(() => setShowToast(false), 2000);
    });
  };

  return (
    <>
      {/* Toast Notification */}
      <div className={`fixed top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 z-[60] transition-all duration-300 pointer-events-none ${showToast ? 'opacity-100 scale-100' : 'opacity-0 scale-90'}`}>
        <div className="bg-anime-dark/90 border border-anime-secondary px-6 py-3 rounded-lg shadow-[0_0_20px_rgba(0,240,255,0.3)] backdrop-blur-md">
           <div className="flex items-center gap-2 text-anime-secondary font-bold">
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
              {t.footer.wechatCopied}
           </div>
        </div>
      </div>

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 z-[70] flex items-center justify-center p-4 animate-fade-in">
          <div className="absolute inset-0 bg-black/80 backdrop-blur-sm" onClick={() => setShowModal(false)}></div>
          <div className="relative bg-anime-card border-2 border-anime-primary rounded-2xl p-8 max-w-sm w-full shadow-[0_0_50px_rgba(255,0,128,0.3)] transform transition-all scale-100">
             {/* Decorative corners */}
             <div className="absolute -top-2 -left-2 w-6 h-6 border-t-4 border-l-4 border-anime-secondary"></div>
             <div className="absolute -bottom-2 -right-2 w-6 h-6 border-b-4 border-r-4 border-anime-secondary"></div>

             <div className="text-center">
                <h3 className="text-2xl font-black text-white italic mb-8">{t.footer.addWechat}</h3>
                
                <div className="bg-black/50 p-6 rounded-xl border border-slate-700 mb-8 flex flex-col gap-4">
                   <span className="text-slate-400 font-bold text-xs uppercase tracking-widest">{t.footer.wechatIdLabel}</span>
                   <div className="flex items-center justify-between gap-4 bg-white/5 p-3 rounded-lg border border-white/10">
                      <span className="text-white font-mono text-xl font-bold tracking-wider truncate">{wechatId}</span>
                      <button 
                        onClick={handleCopyWeChat} 
                        className="bg-anime-secondary text-black hover:bg-white px-4 py-2 rounded font-bold text-xs transition-colors shrink-0"
                      >
                        {t.footer.copy}
                      </button>
                   </div>
                </div>

                <button 
                  onClick={() => setShowModal(false)}
                  className="w-full py-3 bg-slate-800 hover:bg-slate-700 text-white font-bold rounded-lg transition-colors"
                >
                  {t.footer.close}
                </button>
             </div>
          </div>
        </div>
      )}

      {/* Sticky Footer Bar */}
      <div className="fixed bottom-0 left-0 right-0 z-50 bg-anime-dark/80 backdrop-blur-xl border-t border-white/10 shadow-[0_-5px_20px_rgba(0,0,0,0.5)] pb-safe">
        <div className="max-w-7xl mx-auto px-4 py-3 flex items-center justify-between gap-4">
           {/* Left: WeChat Copy */}
           <div 
             onClick={handleCopyWeChat}
             className="flex-1 flex items-center gap-3 cursor-pointer group active:scale-95 transition-transform"
           >
              <div className="w-10 h-10 bg-green-500/20 rounded-full flex items-center justify-center border border-green-500/30 group-hover:border-green-500 transition-colors relative overflow-hidden">
                 <div className="absolute inset-0 bg-green-500/20 animate-pulse-glow"></div>
                 <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-green-400 relative z-10"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>
              </div>
              <div className="flex flex-col">
                 <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider group-hover:text-green-400 transition-colors">{t.footer.wechatConsult}</span>
                 <span className="text-white font-mono font-bold text-sm sm:text-base leading-none group-hover:text-shadow-neon">{wechatId}</span>
              </div>
           </div>

           {/* Right: CTA Button */}
           <button 
             onClick={() => setShowModal(true)}
             className="relative overflow-hidden group bg-anime-primary hover:bg-pink-600 text-white px-6 py-3 rounded-lg font-black italic tracking-wider shadow-[0_0_15px_rgba(255,0,128,0.4)] transition-all transform hover:-translate-y-1 skew-x-[-10deg]"
           >
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-500"></div>
              <div className="skew-x-[10deg] flex items-center gap-2">
                 <span>{t.footer.contactUs}</span>
                 <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="9 18 15 12 9 6"/></svg>
              </div>
           </button>
        </div>
        {/* Safe area spacer for iPhone home indicator */}
        <div className="h-[env(safe-area-inset-bottom)]"></div>
      </div>
    </>
  );
};