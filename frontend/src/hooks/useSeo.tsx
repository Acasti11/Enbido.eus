import { useEffect } from 'react';

interface SeoProps {
  title: string;
  description: string;
  keywords?: string;
  ogTitle?: string;
  ogDescription?: string;
  ogImage?: string;
  canonical?: string;
  lang?: 'eu' | 'es';
  jsonLd?: Record<string, any>;
}

export const useSeo = ({
  title,
  description,
  keywords,
  ogTitle,
  ogDescription,
  ogImage,
  canonical,
  lang,
  jsonLd,
}: SeoProps): void => {
  const jsonLdString = jsonLd ? JSON.stringify(jsonLd) : '';

  useEffect(() => {
    // 1. Update document title
    document.title = title;

    // 2. Update meta description
    let metaDescription = document.querySelector('meta[name="description"]');
    if (!metaDescription) {
      metaDescription = document.createElement('meta');
      metaDescription.setAttribute('name', 'description');
      document.head.appendChild(metaDescription);
    }
    metaDescription.setAttribute('content', description);

    // 3. Update meta keywords (if provided)
    if (keywords) {
      let metaKeywords = document.querySelector('meta[name="keywords"]');
      if (!metaKeywords) {
        metaKeywords = document.createElement('meta');
        metaKeywords.setAttribute('name', 'keywords');
        document.head.appendChild(metaKeywords);
      }
      metaKeywords.setAttribute('content', keywords);
    }

    // 4. Update Open Graph Title
    const titleVal = ogTitle || title;
    let metaOgTitle = document.querySelector('meta[property="og:title"]');
    if (!metaOgTitle) {
      metaOgTitle = document.createElement('meta');
      metaOgTitle.setAttribute('property', 'og:title');
      document.head.appendChild(metaOgTitle);
    }
    metaOgTitle.setAttribute('content', titleVal);

    // 5. Update Open Graph Description
    const descVal = ogDescription || description;
    let metaOgDesc = document.querySelector('meta[property="og:description"]');
    if (!metaOgDesc) {
      metaOgDesc = document.createElement('meta');
      metaOgDesc.setAttribute('property', 'og:description');
      document.head.appendChild(metaOgDesc);
    }
    metaOgDesc.setAttribute('content', descVal);

    // 6. Update Open Graph Image
    if (ogImage) {
      let metaOgImage = document.querySelector('meta[property="og:image"]');
      if (!metaOgImage) {
        metaOgImage = document.createElement('meta');
        metaOgImage.setAttribute('property', 'og:image');
        document.head.appendChild(metaOgImage);
      }
      metaOgImage.setAttribute('content', ogImage);

      let metaTwitterImage = document.querySelector('meta[name="twitter:image"]');
      if (!metaTwitterImage) {
        metaTwitterImage = document.createElement('meta');
        metaTwitterImage.setAttribute('name', 'twitter:image');
        document.head.appendChild(metaTwitterImage);
      }
      metaTwitterImage.setAttribute('content', ogImage);
    }

    // 7. Update Canonical Link
    let linkCanonical = document.querySelector('link[rel="canonical"]');
    if (canonical) {
      if (!linkCanonical) {
        linkCanonical = document.createElement('link');
        linkCanonical.setAttribute('rel', 'canonical');
        document.head.appendChild(linkCanonical);
      }
      linkCanonical.setAttribute('href', canonical);
    }

    // 8. Update document language (lang)
    const oldLang = document.documentElement.lang;
    if (lang) {
      document.documentElement.lang = lang;
    }

    // 9. Inject Structured Data (JSON-LD)
    let jsonLdScript: HTMLScriptElement | null = null;
    if (jsonLdString) {
      jsonLdScript = document.createElement('script');
      jsonLdScript.type = 'application/ld+json';
      jsonLdScript.id = 'jsonld-dynamic-seo';
      jsonLdScript.textContent = jsonLdString;
      document.head.appendChild(jsonLdScript);
    }

    // Cleanup: restore language and injection on component unmount
    return () => {
      if (lang) {
        document.documentElement.lang = oldLang;
      }
      if (jsonLdScript && jsonLdScript.parentNode) {
        jsonLdScript.parentNode.removeChild(jsonLdScript);
      }
    };

  }, [title, description, keywords, ogTitle, ogDescription, ogImage, canonical, lang, jsonLdString]);
};
