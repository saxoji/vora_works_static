import { copy, products } from './content.js';
import { installCopy } from './install.js';

export const localeCodes = { ko: 'ko_KR', ja: 'ja_JP', en: 'en_US' };
export const supportedLanguages = Object.keys(localeCodes);
// Version the image URL so clients fetch the revised thumbnail composition.
export const socialImagePath = lang => `/brand/social-${lang}-v7.png`;

const descriptions = {
  ko: '개인 누구나 무료로 사용하는 VORA AI DOCS. WORD·SLIDE·CELL·HWP 웹 앱, 공개된 데스크톱 다운로드와 macOS·Windows·Linux 설치 방법을 확인하세요. VORA.IM과 무료 클라우드 HYPER RAG로 작업을 이어가세요.',
  ja: '個人利用は無料のVORA AI DOCS。WORD・SLIDE・CELL・HWPのウェブ版、公開済みのデスクトップ版とmacOS・Windows・Linuxのインストール方法をご案内。VORA.IMと無料のHYPER RAGにつながります。',
  en: 'Free personal document, slide, spreadsheet and HWP editing with VORA AI DOCS. Explore web apps, published desktop downloads and macOS, Windows and Linux installation guides.',
};

export function getPageMeta(lang, config, pathname = `/${lang}/`) {
  const text = copy[lang];
  const origin = config.siteUrl;
  const absolute = path => origin ? new URL(path, origin).href : path;
  const url = absolute(pathname);
  const image = absolute(socialImagePath(lang));
  const title = `VORA AI DOCS — ${text.pageTitle}`;
  const description = descriptions[lang];
  return {
    title, description, url, image,
    imageAlt: `VORA AI DOCS — ${text.pageTitle}. ${text.free}. ${installCopy[lang].title}. WORD · SLIDE · CELL · HWP.`,
    structuredData: {
      '@context': 'https://schema.org',
      '@graph': [
        { '@type': 'Organization', '@id': `${config.companyUrl}#organization`, name: 'Linkbricks Horizon-AI', url: config.companyUrl, logo: absolute('/brand/horizon-light.webp') },
        { '@type': 'WebSite', '@id': `${absolute('/')}#website`, name: 'VORA AI DOCS', url: absolute('/'), inLanguage: supportedLanguages, publisher: { '@id': `${config.companyUrl}#organization` } },
        {
          '@type': 'CollectionPage', '@id': `${url}#page`, url, name: title, description,
          inLanguage: lang, image, hasPart: products.map(product => ({'@type':'WebPage',name:`VORA ${product.name} · ${installCopy[lang].title}`,url:absolute(`/downloads/${product.id}/${lang}/`)})), isPartOf: { '@id': `${absolute('/')}#website` },
          mainEntity: {
            '@type': 'ItemList', numberOfItems: products.length,
            itemListElement: products.map((product, index) => ({
              '@type': 'ListItem', position: index + 1,
              item: { '@type': 'WebApplication', name: `VORA ${product.name}`, url: config.products[product.id].web, description: text[`${product.id}Desc`], applicationCategory: 'ProductivityApplication', operatingSystem: 'Web', isAccessibleForFree: true },
            })),
          },
        },
      ],
    },
  };
}
