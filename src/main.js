import { createView } from './view.js';
import { getPageMeta, localeCodes } from './seo.js';
import config from '/config.js';
import { validArtifacts, preferredArtifact } from '/downloads/shared/releases.js';

import { LANGUAGE_KEY, THEME_KEY, languages, resolveLanguage, resolveTheme, readPreference, savePreference } from './preferences.js';

const params = new URLSearchParams(location.search);
const browserLanguages = () => navigator.languages?.length ? navigator.languages : [navigator.language];
const colorScheme = matchMedia('(prefers-color-scheme: dark)');
const routeLanguage = location.pathname.match(/^\/(ko|ja|en)(?:\/|$)/)?.[1];
let languagePreference = params.get('lang') || routeLanguage || readPreference(LANGUAGE_KEY, 'auto');
if (![...languages, 'auto'].includes(languagePreference)) languagePreference = 'auto';
let themePreference = params.get('theme') || readPreference(THEME_KEY, 'system');
if (!['dark', 'light', 'system'].includes(themePreference)) themePreference = 'system';
let lang = resolveLanguage(languagePreference, browserLanguages());
let theme = resolveTheme(themePreference, colorScheme.matches);
const app = document.querySelector('#app');
let view;
const syncPreferences = () => {
  const url = new URL(location.href);
  url.pathname = languagePreference === 'auto' ? '/' : `/${lang}/`;
  url.searchParams.delete('lang');
  if (themePreference === 'system') url.searchParams.delete('theme');
  else url.searchParams.set('theme', themePreference);
  url.searchParams.delete('concept');
  history.replaceState(null, '', url);
};

function render() {
  document.documentElement.lang = lang;
  document.documentElement.dataset.theme = theme;
  document.body.className = 'design-editorial';
  const meta = getPageMeta(lang, config, location.pathname);
  document.title = meta.title;
  const metadata = {
    'meta[name="description"]': meta.description,
    'meta[property="og:title"]': meta.title,
    'meta[property="og:description"]': meta.description,
    'meta[property="og:locale"]': localeCodes[lang],
    'meta[property="og:url"]': meta.url,
    'meta[property="og:image"]': meta.image,
    'meta[property="og:image:secure_url"]': meta.image,
    'meta[property="og:image:alt"]': meta.imageAlt,
    'meta[name="twitter:title"]': meta.title,
    'meta[name="twitter:description"]': meta.description,
    'meta[name="twitter:image"]': meta.image,
    'meta[name="twitter:image:alt"]': meta.imageAlt,
    'meta[name="theme-color"]': theme === 'dark' ? '#151619' : '#f6f5f1',
  };
  for (const [selector, value] of Object.entries(metadata)) {
    const element = document.querySelector(selector);
    if (element) element.content = value;
  }
  const canonical = document.querySelector('link[rel="canonical"]');
  if (canonical) canonical.href = meta.url;
  document.querySelectorAll('meta[property="og:locale:alternate"]').forEach((element, index) => {
    element.content = Object.entries(localeCodes).filter(([code]) => code !== lang)[index][1];
  });
  const structuredData = document.querySelector('#structured-data');
  if (structuredData) structuredData.textContent = JSON.stringify(meta.structuredData);
  view = createView({ lang, theme, languagePreference, themePreference, config });
  app.innerHTML = view.html;
}

app.addEventListener('change', event => {
  if (event.target.id === 'language') {
    languagePreference = event.target.value;
    lang = resolveLanguage(languagePreference, browserLanguages());
    savePreference(LANGUAGE_KEY, languagePreference);
  } else if (event.target.id === 'theme') {
    themePreference = event.target.value;
    theme = resolveTheme(themePreference, colorScheme.matches);
    savePreference(THEME_KEY, themePreference);
  } else return;
  const control = event.target.id;
  const scrollY = window.scrollY;
  syncPreferences();
  render();
  document.getElementById(control).focus({ preventScroll: true });
  window.scrollTo({ top: scrollY, behavior: 'instant' });
});

let dialogRequest = 0;
app.addEventListener('click', async event => {
  const scrollProduct = event.target.closest('[data-scroll-product]');
  if (scrollProduct) {
    event.preventDefault();
    document.querySelector(`#${scrollProduct.dataset.scrollProduct}-overview`)?.scrollIntoView({ behavior: matchMedia('(prefers-reduced-motion: reduce)').matches ? 'instant' : 'smooth', block: 'center' });
  }
  const download = event.target.closest('[data-download]');
  if (download) {
    document.querySelector('#dialog-content').innerHTML = view.downloadDialog(download.dataset.download, download.dataset.os);
    document.querySelector('#dialog-content').scrollTop = 0;
    document.querySelector('#download-dialog').showModal();
    const request = ++dialogRequest, currentView = view, product = download.dataset.download;
    try {
      const response = await fetch(config.products[product].releaseManifestURL || `/releases/${product}/stable.json`, {cache:'no-store'});
      if (!response.ok) return;
      const data = await response.json(), artifacts = validArtifacts(data, config.siteUrl, product);
      const pending = data?.schemaVersion === 1 && data.product === product && data.status === 'pending'
        && typeof data.version === 'string' && data.version === data.version.trim() && /^\d+\.\d+\.\d+$/.test(data.version)
        && Array.isArray(data.artifacts) && data.artifacts.length === 0;
      const available = data?.status !== 'pending' && artifacts.length > 0;
      if (!pending && !available) return;
      if (request !== dialogRequest || view !== currentView || !document.querySelector('#download-dialog').open) return;
      const release = Object.fromEntries(['macos','windows','linux'].map(os=>[os,preferredArtifact(artifacts,os)]));
      const content = document.querySelector('#dialog-content'), scrollTop = content.scrollTop;
      content.innerHTML = view.downloadDialog(product, download.dataset.os, release);
      content.scrollTop = scrollTop;
    } catch { /* Configured links to the product download page remain usable offline. */ }
  }
  if (event.target.closest('[data-action="close-dialog"]')) { dialogRequest++; document.querySelector('#download-dialog').close(); }
  if (event.target.matches('dialog')) {
    const rect = event.target.getBoundingClientRect();
    if (event.clientX < rect.left || event.clientX > rect.right || event.clientY < rect.top || event.clientY > rect.bottom) event.target.close();
  }
});

colorScheme.addEventListener('change', () => {
  if (themePreference !== 'system') return;
  theme = resolveTheme(themePreference, colorScheme.matches);
  document.documentElement.dataset.theme = theme;
  document.querySelector('meta[name="theme-color"]').content = theme === 'dark' ? '#151619' : '#f6f5f1';
  document.querySelector('.maker img').src = `/brand/horizon-${theme}.webp`;
});
window.addEventListener('languagechange', () => {
  if (languagePreference !== 'auto') return;
  lang = resolveLanguage(languagePreference, browserLanguages());
  render();
});

if (languagePreference !== 'auto') syncPreferences();
render();
