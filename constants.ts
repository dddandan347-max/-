import { VideoTemplate } from './types';

export const TEMPLATES: VideoTemplate[] = [
  {
    id: '1',
    title: '电影感旅行 Vlog',
    price: '¥199',
    description: '充满活力的转场和电影级调色预设，非常适合旅行内容创作。',
    imageUrl: 'https://picsum.photos/800/450?random=1',
    videoUrl: 'https://interactive-examples.mdn.mozilla.net/media/cc0-videos/flower.mp4', // Example video
    tags: ['旅行', 'Vlog', '4K']
  },
  {
    id: '2',
    title: '企业商务宣传片',
    price: '¥299',
    description: '简洁专业的排版和流畅的动画，专为商务演示设计。',
    imageUrl: 'https://picsum.photos/800/450?random=2',
    // No videoUrl, will display image
    tags: ['商务', '简洁', '企业']
  },
  {
    id: '3',
    title: '抖音/TikTok 故障风',
    price: '¥99',
    description: '快节奏的故障效果，专为在社交媒体上抓住眼球而设计。',
    imageUrl: 'https://picsum.photos/800/450?random=3',
    videoUrl: 'https://interactive-examples.mdn.mozilla.net/media/cc0-videos/flower.mp4', // Example video
    tags: ['社交媒体', '故障风', '短视频']
  },
  {
    id: '4',
    title: '婚礼高光时刻',
    price: '¥399',
    description: '浪漫的慢动作优化模版，带有优雅的光斑漏光效果。',
    imageUrl: 'https://picsum.photos/800/450?random=4',
    tags: ['婚礼', '浪漫', '优雅']
  },
  {
    id: '5',
    title: '游戏频道片头',
    price: '¥149',
    description: '霓虹风格和极具冲击力的动态图形，适合游戏频道。',
    imageUrl: 'https://picsum.photos/800/450?random=5',
    tags: ['游戏', '霓虹', '片头']
  },
  {
    id: '6',
    title: '极简产品展示',
    price: '¥249',
    description: '干净的背景和细腻的文字动画，专注于产品本身的展示。',
    imageUrl: 'https://picsum.photos/800/450?random=6',
    videoUrl: 'https://interactive-examples.mdn.mozilla.net/media/cc0-videos/flower.mp4', // Example video
    tags: ['产品', '极简', '电商']
  }
];

export const WECHAT_ID = "16626191333";