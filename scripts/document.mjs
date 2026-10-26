import { createView } from '../src/view.js';
import { getPageMeta, localeCodes, supportedLanguages } from '../src/seo.js';

export const routes = [{ path: '/', lang: 'ko' }, ...supportedLanguages.map(lang => ({ path: `/${lang}/`, lang }))];
const escape = value => String(value).replaceAll('&', '&amp;').replaceAll('"', '&quot;').replaceAll('<', '&lt;').replaceAll('>', '&gt;');

export function renderDocument(template, config, route) {
  const { lang, path } = route;
  const meta = getPageMeta(lang, config, path);
  const absolute = value => config.siteUrl ? new URL(value, config.siteUrl).href : value;
  const tag = (attribute, key, value) => `<meta ${attribute}="${key}" content="${escape(value)}" />`;
  const head = [
    `<title>${escape(meta.title)}</title>`,
    tag('name', 'description', meta.description),
    tag('name', 'robots', 'index, follow, max-image-preview:large'),
    `<link rel="canonical" href="${escape(meta.url)}" />`,
    ...supportedLanguages.map(code => `<link rel="alternate" hreflang="${code}" href="${escape(absolute(`/${code}/`))}" />`),
    `<link rel="alternate" hreflang="x-default" href="${escape(absolute('/'))}" />`,
    tag('property', 'og:type', 'website'),
    tag('property', 'og:site_name', 'VORA AI DOCS'),
    tag('property', 'og:title', meta.title),
    tag('property', 'og:description', meta.description),
    tag('property', 'og:url', meta.url),
    tag('property', 'og:locale', localeCodes[lang]),
    ...supportedLanguages.filter(code => code !== lang).map(code => tag('property', 'og:locale:alternate', localeCodes[code])),
    tag('property', 'og:image', meta.image),
    tag('property', 'og:image:secure_url', meta.image),
    tag('property', 'og:image:type', 'image/png'),
    tag('property', 'og:image:width', '1200'),
    tag('property', 'og:image:height', '630'),
    tag('property', 'og:image:alt', meta.imageAlt),
    tag('name', 'twitter:card', 'summary_large_image'),
    ...['title', 'description', 'image'].map(key => tag('name', `twitter:${key}`, meta[key])),
    tag('name', 'twitter:image:alt', meta.imageAlt),
    `<script type="application/ld+json" id="structured-data">${JSON.stringify(meta.structuredData).replaceAll('<', '\\u003c')}</script>`,
  ].join('\n    ');
  const content = createView({ lang, config, languagePreference: path === '/' ? 'auto' : lang }).html;
  return template.replace('<html lang="ko">', `<html lang="${lang}">`).replace('<!-- site-meta -->', head).replace('<!-- site-content -->', content);
}
