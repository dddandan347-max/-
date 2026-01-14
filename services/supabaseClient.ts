import { createClient } from '@supabase/supabase-js';
import { VideoTemplate } from '../types';

// ==========================================
// 🔴 配置已自动更新
// ==========================================

// 您的 Supabase 项目 URL (从您的 Key 中解析得出)
const SUPABASE_URL = 'https://jzjhnnqopldqwauuhttm.supabase.co';

// 您的 Supabase Anon Key
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imp6amhubnFvcGxkcXdhdXVodHRtIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njg0MDYwNzUsImV4cCI6MjA4Mzk4MjA3NX0.NvMm8QMCKJP0RoF0FYbQERCs8q8X6-jUjMdJcOIQ3e4';

// ==========================================

// 检查配置是否已填写
export const isConfigured = 
  SUPABASE_URL.startsWith('https://') && 
  !SUPABASE_URL.includes('请在这里填入') &&
  SUPABASE_KEY.startsWith('ey');

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