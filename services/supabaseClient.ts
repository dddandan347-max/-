import { createClient } from '@supabase/supabase-js';
import { VideoTemplate } from '../types';

// ==========================================
// 🔴 配置已自动更新 / Configuration Updated
// ==========================================

// 您的 Supabase 项目 URL
const SUPABASE_URL = 'https://jwtiagpzrfpifkpsljec.supabase.co';

// 您的 Supabase Anon Key
const SUPABASE_KEY = 'sb_publishable_vQM4QmpEz-IgaQsL-3RUTw_nVEL9O2X';

// ==========================================

// 检查配置是否已填写
export const isConfigured = 
  SUPABASE_URL.startsWith('https://') && 
  !SUPABASE_URL.includes('请在这里填入') &&
  (SUPABASE_KEY.startsWith('ey') || SUPABASE_KEY.startsWith('sb_')); // Updated check to allow new key format if applicable

// 创建客户端
export const supabase = createClient(
  isConfigured ? SUPABASE_URL : 'https://placeholder.supabase.co', 
  isConfigured ? SUPABASE_KEY : 'placeholder',
  {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
    },
  }
);

// --- 数据转换工具 ---

export const mapTemplateFromDB = (dbItem: any): VideoTemplate => ({
  id: dbItem.id,
  title: dbItem.title,
  price: dbItem.price,
  description: dbItem.description,
  imageUrl: dbItem.image_url || dbItem.imageUrl || '', 
  videoUrl: dbItem.video_url || dbItem.videoUrl || '', 
  tags: dbItem.tags || []
});

export const mapTemplateToDB = (item: VideoTemplate) => ({
  id: item.id,
  title: item.title,
  price: item.price,
  description: item.description,
  image_url: item.imageUrl,
  video_url: item.videoUrl,
  tags: item.tags
});