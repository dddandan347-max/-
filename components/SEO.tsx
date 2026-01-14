import React from 'react';
import { Helmet } from 'react-helmet-async';

interface SEOProps {
  title: string;
  description?: string;
  image?: string;
  url?: string;
}

export const SEO: React.FC<SEOProps> = ({ title, description, image, url }) => {
  const siteTitle = "短短AI定制商店";
  const fullTitle = title === siteTitle ? title : `${title} | ${siteTitle}`;
  const defaultDescription = "一个展示优质视频模版的高端平台，助力内容创作者打造专属优质视频。我们提供电影感Vlog、商务宣传、故障风等多种风格的高清模版。";
  const metaDescription = description || defaultDescription;
  
  // Default hero image if no specific image is provided
  const metaImage = image || "https://images.unsplash.com/photo-1614726365723-49cfae97d6bd?q=80&w=2000&auto=format&fit=crop"; 
  const metaUrl = url || window.location.href;

  return (
    <Helmet>
      {/* Basic */}
      <title>{fullTitle}</title>
      <meta name="description" content={metaDescription} />

      {/* Open Graph / Facebook / WeChat */}
      <meta property="og:type" content="website" />
      <meta property="og:url" content={metaUrl} />
      <meta property="og:title" content={fullTitle} />
      <meta property="og:description" content={metaDescription} />
      <meta property="og:image" content={metaImage} />
      <meta property="og:site_name" content={siteTitle} />

      {/* Twitter */}
      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:url" content={metaUrl} />
      <meta name="twitter:title" content={fullTitle} />
      <meta name="twitter:description" content={metaDescription} />
      <meta name="twitter:image" content={metaImage} />
    </Helmet>
  );
};