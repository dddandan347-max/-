import { createClient } from '@supabase/supabase-js';
import { VideoTemplate } from '../types';

// Safe environment variable access
const getEnv = (key: string) => {
  try {
    return process.env[key];
  } catch (e) {
    return undefined;
  }
};

const envUrl = getEnv('SUPABASE_URL');
const envKey = getEnv('SUPABASE_ANON_KEY');

// 使用用户提供的真实 Supabase 配置 (Project Ref: ubtmcellazkddqquesus)
const rawUrl = (envUrl || 'https://ubtmcellazkddqquesus.supabase.co').trim();

// 更新为正确的 JWT Anon Key
const rawKey = (envKey || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVidG1jZWxsYXprZGRxa3Vlc3VzIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjgzOTk0MTIsImV4cCI6MjA4Mzk3NTQxMn0.4NIh-cWteOaPj07BXCM0-VY-kAjMyMiBSgCRMVec1nQ').trim();

// 检查 URL 是否有效
const isValidUrl = (url: string) => {
  try {
    if (!url) return false;
    new URL(url);
    return true;
  } catch (e) {
    return false;
  }
};

const supabaseUrl = isValidUrl(rawUrl) ? rawUrl : 'https://example.supabase.co';
const supabaseKey = rawKey;

if (!isValidUrl(rawUrl)) {
  console.warn('⚠️ 检测到 Supabase URL 为无效占位符。应用将运行在演示模式。');
}

export const supabase = createClient(supabaseUrl, supabaseKey);

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