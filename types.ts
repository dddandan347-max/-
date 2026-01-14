export interface VideoTemplate {
  id: string;
  title: string;
  price: string;
  description: string;
  imageUrl: string;
  videoUrl?: string; // Optional video URL
  tags: string[];
}

export interface ChatMessage {
  id: string;
  sender: 'user' | 'admin' | 'model';
  content: string;
  timestamp: number;
  type: 'text' | 'image' | 'system' | 'video';
}

export interface ChatSession {
  sessionId: string;
  userId: string;
  userName: string;
  avatar?: string;
  messages: ChatMessage[];
  lastUpdated: number;
  unreadAdminCount: number; // Messages user sent that admin hasn't read
  unreadUserCount: number;  // Messages admin sent that user hasn't read
}

export interface SiteContent {
  brandName: { zh: string; en: string };
  heroTitle: { zh: string; en: string };
  heroSubtitle: { zh: string; en: string };
}

export enum AppSection {
  HOME = 'home',
  TEMPLATES = 'templates',
  CONTACT = 'contact',
  ADMIN = 'admin'
}