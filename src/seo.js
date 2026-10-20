import { copy, products } from './content.js';

export const localeCodes = { ko: 'ko_KR', ja: 'ja_JP', en: 'en_US' };
export const supportedLanguages = Object.keys(localeCodes);
// Version the image URL so clients fetch the revised thumbnail composition.
export const socialImagePath = lang => `/brand/social-${lang}-v2.png`;

const descriptions = {
  ko: '개인 누구나 무료로, 자유롭게. VORA WORD·SLIDE·CELL·HWP로 문서, 발표, 스프레드시트, 한글 문서를 만드세요. VORA.IM과 무료 클라우드 HYPER RAG로 연결되는 AI 작업 공간.',
  ja: '個人なら誰でも無料で自由に。VORA WORD・SLIDE・CELL・HWPで文書、プレゼン、表計算、ハングル文書を作成。VORA.IMと無料クラウドHYPER RAGにつながるAIワークスペース。',
  en: 'Free for personal use. Create documents, slides, spreadsheets and HWP files with VORA AI WORKS. Connect your knowledge through VORA.IM and free cloud HYPER RAG.',
};

export function getPageMeta(lang, config, pathname = `/${lang}/`) {
  const text = copy[lang];
  const origin = config.siteUrl;
  const absolute = path => origin ? new URL(path, origin).href : path;
  const url = absolute(pathname);
  const image = absolute(socialImagePath(lang));
  const title = `VORA AI WORKS — ${text.pageTitle}`;
  const description = descriptions[lang];
  return {
    title, description, url, image,
    imageAlt: `VORA AI WORKS — ${text.pageTitle}. ${text.free}. WORD · SLIDE · CELL · HWP.`,
    structuredData: {
      '@context': 'https://schema.org',
      '@graph': [
        { '@type': 'Organization', '@id': `${config.companyUrl}#organization`, name: 'Linkbricks Horizon-AI', url: config.companyUrl, logo: absolute('/brand/horizon-light.webp') },
        { '@type': 'WebSite', '@id': `${absolute('/')}#website`, name: 'VORA AI WORKS', url: absolute('/'), inLanguage: supportedLanguages, publisher: { '@id': `${config.companyUrl}#organization` } },
        {
          '@type': 'CollectionPage', '@id': `${url}#page`, url, name: title, description,
          inLanguage: lang, image, isPartOf: { '@id': `${absolute('/')}#website` },
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
