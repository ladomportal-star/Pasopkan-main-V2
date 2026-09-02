import React from 'react';
import { Helmet } from 'react-helmet-async';
import { useLanguage } from '../LanguageContext';

export interface SEOProps {
  title?: string;
  description?: string;
  keywords?: string | string[];
  image?: string;
  url?: string;
  type?: 'website' | 'article' | 'event' | 'profile';
  canonical?: string;
  noindex?: boolean;
  children?: React.ReactNode;
}

const DEFAULT_META = {
  siteNameEn: 'Pasopkan - Experience & Event Ticketing in Laos',
  siteNameLo: 'Pasopkan (ປະສົບການ) - ເວທີຊື້-ຂາຍປີ້ງານ ແລະ ກິດຈະກຳໃນລາວ',
  defaultDescriptionEn: 'Discover, book, and experience top workshops, sports, festivals, and cultural events across Laos. Seamless cashless payment and digital ticketing.',
  defaultDescriptionLo: 'ຄົ້ນພົບ, ຈອງ ແລະ ເຂົ້າຮ່ວມກິດຈະກຳ, ງານເທດສະການ, ກິລາ ແລະ ເວີກຊັອບຊັ້ນນຳທົ່ວປະເທດລາວ. ຊຳລະເງິນງ່າຍ ແລະ ຮັບປີ້ດິຈິຕອນທັນທີ.',
  defaultKeywords: 'Laos events, Vientiane tickets, Luang Prabang festivals, Vang Vieng marathon, concert tickets Laos, workshops Laos, Pasopkan, ປີ້ງານ, ປີ້ຄອນເສີດ',
  defaultImage: '/Card.png',
  domain: typeof window !== 'undefined' ? window.location.origin : 'https://pasopkan.la',
};

export const SEO: React.FC<SEOProps> = ({
  title,
  description,
  keywords,
  image,
  url,
  type = 'website',
  canonical,
  noindex = false,
  children,
}) => {
  const { lang } = useLanguage();

  const siteName = lang === 'lo' ? DEFAULT_META.siteNameLo : DEFAULT_META.siteNameEn;
  const pageTitle = title 
    ? `${title} | ${lang === 'lo' ? 'Pasopkan (ປະສົບການ)' : 'Pasopkan'}`
    : siteName;
    
  const metaDescription = description || (lang === 'lo' ? DEFAULT_META.defaultDescriptionLo : DEFAULT_META.defaultDescriptionEn);
  
  const metaKeywords = Array.isArray(keywords) 
    ? keywords.join(', ') 
    : (keywords || DEFAULT_META.defaultKeywords);

  const currentUrl = url 
    ? (url.startsWith('http') ? url : `${DEFAULT_META.domain}${url.startsWith('/') ? url : `/${url}`}`)
    : (typeof window !== 'undefined' ? window.location.href : DEFAULT_META.domain);

  const metaImage = image 
    ? (image.startsWith('http') ? image : `${DEFAULT_META.domain}${image.startsWith('/') ? image : `/${image}`}`)
    : `${DEFAULT_META.domain}${DEFAULT_META.defaultImage}`;

  const canonicalUrl = canonical || currentUrl;

  return (
    <Helmet>
      {/* Standard HTML Metadata */}
      <html lang={lang === 'lo' ? 'lo' : 'en'} />
      <title>{pageTitle}</title>
      <meta name="description" content={metaDescription} />
      <meta name="keywords" content={metaKeywords} />
      {canonicalUrl && <link rel="canonical" href={canonicalUrl} />}

      {/* Robots */}
      {noindex ? (
        <meta name="robots" content="noindex, nofollow" />
      ) : (
        <meta name="robots" content="index, follow, max-image-preview:large" />
      )}

      {/* Open Graph / Facebook */}
      <meta property="og:type" content={type} />
      <meta property="og:site_name" content="Pasopkan" />
      <meta property="og:title" content={pageTitle} />
      <meta property="og:description" content={metaDescription} />
      <meta property="og:image" content={metaImage} />
      <meta property="og:url" content={currentUrl} />
      <meta property="og:locale" content={lang === 'lo' ? 'lo_LA' : 'en_US'} />

      {/* Twitter */}
      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:title" content={pageTitle} />
      <meta name="twitter:description" content={metaDescription} />
      <meta name="twitter:image" content={metaImage} />

      {/* Additional Tags injected directly */}
      {children}
    </Helmet>
  );
};

export default SEO;
