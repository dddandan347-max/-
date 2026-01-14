import React, { useState } from 'react';
import { analyzeImage } from '../services/geminiService';

export const ImageAnalyzer: React.FC = () => {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [result, setResult] = useState<string>('');
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [prompt, setPrompt] = useState('请详细描述这张图片/视频帧，并建议什么样的视频模版或剪辑风格最适合它。');

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setSelectedFile(file);
      const url = URL.createObjectURL(file);
      setPreviewUrl(url);
      setResult('');
    }
  };

  const handleAnalyze = async () => {
    if (!selectedFile) return;

    setIsAnalyzing(true);
    try {
      // Convert file to base64
      const reader = new FileReader();
      reader.readAsDataURL(selectedFile);
      reader.onloadend = async () => {
        const base64data = reader.result as string;
        try {
          const analysis = await analyzeImage(base64data, prompt);
          setResult(analysis);
        } catch (error) {
          setResult("图片分析失败，请重试。");
        } finally {
          setIsAnalyzing(false);
        }
      };
    } catch (error) {
      console.error(error);
      setIsAnalyzing(false);
    }
  };

  return (
    <div className="bg-dark-800 rounded-xl border border-slate-700 shadow-2xl p-6 h-full flex flex-col">
       <div className="flex items-center gap-3 mb-6">
        <div className="p-2 bg-purple-500/20 rounded-lg">
          <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-purple-400"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"/><circle cx="8.5" cy="8.5" r="1.5"/><polyline points="21 15 16 10 5 21"/></svg>
        </div>
        <div>
          <h3 className="font-bold text-white">智能视觉分析</h3>
          <p className="text-xs text-slate-400">上传图片或视频截图以获取模版建议</p>
        </div>
      </div>

      <div className="flex-1 space-y-6">
        {/* Upload Area */}
        <div className="relative border-2 border-dashed border-slate-600 rounded-xl p-8 text-center hover:bg-slate-800/50 hover:border-brand-500 transition-all cursor-pointer group">
          <input 
            type="file" 
            accept="image/*" 
            onChange={handleFileChange}
            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
          />
          {previewUrl ? (
            <div className="relative h-48 w-full">
              <img src={previewUrl} alt="Preview" className="w-full h-full object-contain rounded-lg" />
              <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity rounded-lg">
                 <p className="text-white font-medium">点击更换图片</p>
              </div>
            </div>
          ) : (
            <div className="py-8">
              <svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round" className="mx-auto text-slate-500 mb-4 group-hover:text-brand-400 transition-colors"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/></svg>
              <p className="text-slate-400">点击或拖拽上传图片</p>
            </div>
          )}
        </div>

        {/* Prompt Input */}
        <div>
          <label className="block text-xs uppercase tracking-wider text-slate-500 font-semibold mb-2">指令 (Prompt)</label>
          <textarea
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            className="w-full bg-dark-950 border border-slate-700 rounded-lg p-3 text-sm text-white focus:border-purple-500 focus:outline-none transition-colors"
            rows={3}
          />
        </div>

        <button
          onClick={handleAnalyze}
          disabled={!selectedFile || isAnalyzing}
          className="w-full py-3 bg-purple-600 hover:bg-purple-500 disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-lg font-bold shadow-lg shadow-purple-900/20 transition-all flex justify-center items-center gap-2"
        >
          {isAnalyzing ? (
             <>
               <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></span>
               分析中...
             </>
          ) : (
            <>
              <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>
              开始智能分析
            </>
          )}
        </button>

        {/* Result Area */}
        {result && (
          <div className="bg-slate-900/80 rounded-lg p-4 border border-slate-700 mt-4 animate-fade-in">
            <h4 className="text-purple-400 font-bold mb-2 flex items-center gap-2">
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/></svg>
              分析结果
            </h4>
            <div className="text-sm text-slate-300 leading-relaxed max-h-48 overflow-y-auto pr-2">
              {result}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};