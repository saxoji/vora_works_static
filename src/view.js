import { products as definitions, copy } from './content.js';

// Shared by the static build and the browser: crawlers receive the full page.
export function createView({ lang, theme = 'dark', languagePreference = lang, themePreference = 'system', config }) {
  const t = key => copy[lang][key];
  const products = definitions.map(product => ({ ...product, url: config.products[product.id].web, downloads: config.products[product.id].downloads, downloadPageURL: config.products[product.id].downloadPageURL }));
  const svg = (body, className = '') => `<svg class="icon ${className}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${body}</svg>`;
  const icons = {
    arrow: svg('<path d="M5 12h14M13 6l6 6-6 6"/>'),
    diagonal: svg('<path d="M6 18 18 6M6 6h12v12"/>'),
    down: svg('<path d="M12 4v12m-5-5 5 5 5-5M5 20h14"/>'),
    globe: svg('<circle cx="12" cy="12" r="9"/><ellipse cx="12" cy="12" rx="4" ry="9"/><path d="M3 12h18"/>'),
    sun: svg('<circle cx="12" cy="12" r="4"/><path d="M12 2v2m0 16v2M2 12h2m16 0h2M5 5l1.5 1.5m11 11L19 19M5 19l1.5-1.5m11-11L19 5"/>'),
    system: svg('<rect x="3" y="4" width="18" height="13" rx="2"/><path d="M8 21h8m-4-4v4"/>'),
    moon: svg('<path d="M20 15.5A9 9 0 0 1 8.5 4 9 9 0 1 0 20 15.5Z"/>'),
    windows: svg('<path d="M3 3h8v8H3Zm10 0h8v8h-8ZM3 13h8v8H3Zm10 0h8v8h-8Z" fill="currentColor" stroke="none"/>', 'os-icon os-icon-windows'),
    // Apple silhouette from Simple Icons (CC0); normalized for optical balance.
    mac: svg('<g transform="translate(1.2 1.2) scale(.9)"><path d="M12.152 6.896c-.948 0-2.415-1.078-3.96-1.04-2.04.027-3.91 1.183-4.961 3.014-2.117 3.675-.546 9.103 1.519 12.09 1.013 1.454 2.208 3.09 3.792 3.039 1.52-.065 2.09-.987 3.935-.987 1.831 0 2.35.987 3.96.948 1.637-.026 2.676-1.48 3.676-2.948 1.156-1.688 1.636-3.325 1.662-3.415-.039-.013-3.182-1.221-3.22-4.857-.026-3.04 2.48-4.494 2.597-4.559-1.429-2.09-3.623-2.324-4.39-2.376-2-.156-3.675 1.09-4.61 1.09zM15.53 3.83c.843-1.012 1.4-2.427 1.245-3.83-1.207.052-2.662.805-3.532 1.818-.78.896-1.454 2.338-1.273 3.714 1.338.104 2.715-.688 3.559-1.701" fill="currentColor" stroke="none"/></g>', 'os-icon os-icon-mac'),
    linux: svg('<g transform="translate(-.96 -.96) scale(1.08)"><path d="M8 10c0-4 1-7 4-7s4 3 4 7l3 8-4 3-3-2-3 2-4-3Z"/><path d="m9 11 3 2 3-2m-6 7h6M10 8h.01M14 8h.01"/></g>', 'os-icon os-icon-linux'),
    cloud: svg('<path d="M6 18a5 5 0 0 1-1-9.9 7 7 0 0 1 13.5.9A4.5 4.5 0 0 1 18 18Z"/>'),
    check: svg('<path d="m5 12 4 4L19 6"/>'),
    close: svg('<path d="m6 6 12 12M6 18 18 6"/>'),
  };
  const brand = (id = 'works', cls = '', alt = '') => `<img class="product-icon ${cls}" src="/brand/vora-${id}.svg" alt="${alt}" width="128" height="128" />`;
  const wordmark = (cls = '') => `<span class="wordmark ${cls}">VORA <em>AI</em> WORKS</span>`;
  const escapeAttribute = value => value.replaceAll('&', '&amp;').replaceAll('"', '&quot;').replaceAll('<', '&lt;').replaceAll('>', '&gt;');
  const link = (url, text, cls = '') => `<a class="${cls}" href="${escapeAttribute(url)}" target="_blank" rel="noopener noreferrer">${text}</a>`;

  function controls() {
    return `<div class="controls"><label class="language">${icons.globe}<span class="sr-only">${t('language')}</span><select aria-label="${t('language')}" id="language"><option value="auto" ${languagePreference === 'auto' ? 'selected' : ''}>${t('autoLanguage')}</option>${[['ko', '한국어'], ['ja', '日本語'], ['en', 'English']].map(([value, label]) => `<option value="${value}" ${languagePreference === value ? 'selected' : ''}>${label}</option>`).join('')}</select></label><label class="theme-picker" title="${t('themeLabel')}: ${t(themePreference + 'Theme')}"><span class="sr-only">${t('themeLabel')}</span>${icons[themePreference === 'system' ? 'system' : theme === 'dark' ? 'moon' : 'sun']}<select id="theme" aria-label="${t('themeLabel')}">${['system', 'light', 'dark'].map(value => `<option value="${value}" ${themePreference === value ? 'selected' : ''}>${t(value + 'Theme')}</option>`).join('')}</select></label></div>`;
  }

  function header() {
    return `<a class="skip-link" href="#main">${t('skip')}</a><header class="header wrap"><a href="#" class="header-brand" aria-label="VORA AI WORKS">${brand()}${wordmark()}</a><nav class="main-nav" aria-label="VORA WORKS"><a href="#products">${t('navProducts')}</a><a href="#vora">${t('navAI')} ${icons.diagonal}</a></nav>${controls()}</header>`;
  }

  function platformButtons(product, full = false) {
    const pending = Object.values(product.downloads).every(value => !value);
    return `<div class="platforms"><span class="platform-label">${product.downloadPageURL ? `<a href="${escapeAttribute(product.downloadPageURL)}">${t('download')}</a>` : t('download')} ${pending ? `<small>${t('coming')}</small>` : ''}</span><div class="os-buttons">${[['mac', 'macos', 'macOS'], ['windows', 'windows', 'Windows'], ['linux', 'linux', 'Linux']].map(([icon, os, name]) => {
      const content = `${icons[icon]}<span${full ? '' : ' class="os-name"'}>${name}</span>`;
      const url = product.downloads[os];
      return url ? `<a href="${escapeAttribute(url)}" class="os-button available-download" target="_blank" rel="noopener noreferrer" aria-label="VORA ${product.name} ${name} — ${t('download')}">${content}${icons.down}</a>` : `<button data-download="${product.id}" data-os="${name}" class="os-button" aria-label="VORA ${product.name} ${name} — ${t('coming')}" title="${name} · ${t('coming')}">${content}</button>`;
    }).join('')}</div></div>`;
  }

  function productCard(p, i, type = 'standard') {
    return `<article id="${p.id}-overview" class="product-card product-${p.id}" style="--product-color:${p.color}"><div class="product-card-top"><span class="small-code">0${i + 1} / ${p.category}</span>${brand(p.id)}</div><div class="product-card-copy"><h3>VORA ${p.name}</h3><h4>${t(`${p.id}Title`)}</h4><p>${t(`${p.id}Desc`)}</p></div><div class="product-card-bottom"><div class="product-meta"><span>${p.format}</span><span class="free-dot">${t('free')}</span></div>${link(p.url, `${t('online')}${icons.diagonal}`, 'product-open')}${platformButtons(p, type === 'wide')}</div></article>`;
  }

  function collection(type = 'standard') {
    return `<section class="collection wrap" id="products"><div class="section-heading"><div><span class="eyebrow">THE WORKS COLLECTION / 01—04</span><h2>${t('collection')}</h2></div><p>${t('collectionBody')}</p></div><div class="product-grid">${products.map((p, i) => productCard(p, i, type)).join('')}</div></section>`;
  }

  function editorial() {
    const description = escapeAttribute(t('description')).replace(escapeAttribute(t('descriptionHighlight')), `<strong class="hand-underline">${escapeAttribute(t('descriptionHighlight'))}</strong>`);
    return `${header()}<main id="main"><section class="editorial-hero wrap"><div class="editorial-topline"><span class="eyebrow">TOOLS FOR YOUR NEXT CHAPTER</span><span class="availability"><i></i>${t('free')}</span></div><h1 class="editorial-title"><span>VORA <em>AI</em></span><span class="works-line">WORKS<span class="hero-symbol">${brand()}</span></span></h1><div class="editorial-intro"><h2>${t('hero1')}<br /><span>${t('hero2')}</span></h2><div><p>${description}</p><p class="enterprise-contact"><span>${t('enterpriseContact')}</span><a href="mailto:contact@horizonai.ai">contact@horizonai.ai</a></p></div></div><div class="mini-collection">${products.map(p => `<a href="#${p.id}-overview" data-scroll-product="${p.id}">${brand(p.id)}<span>VORA ${p.name}</span>${icons.diagonal}</a>`).join('')}</div></section>${collection()}${anywhere()}${connection()}${footer()}</main>`;
  }

  function anywhere() {
    return `<section class="anywhere wrap"><div class="anywhere-title"><span class="eyebrow">ON YOUR TERMS</span><h2>${t('anywhereTitle')}</h2><p>${t('anywhereBody')}</p></div><div class="anywhere-options"><div>${icons.globe}<div><h3>${t('browser')}</h3><p>${t('browserBody')}</p></div>${icons.check}</div><div><span class="anywhere-os">${icons.mac}${icons.windows}${icons.linux}</span><div><h3>${t('desktop')}</h3><p>${t(products.some(p => Object.values(p.downloads).some(Boolean)) ? 'desktopAvailable' : 'desktopBody')}</p></div></div></div></section>`;
  }

  function connection() {
    return `<section class="connection wrap" id="vora"><div class="connection-copy"><span class="eyebrow">${t('aiEyebrow')}</span><h2><span class="hand-underline">${t('aiTitle1')}</span><br/><em class="hand-underline">${t('aiTitle2')}</em></h2><p>${t('aiBody')}</p>${link(config.voraUrl, `${t('aiCTA')} ${icons.diagonal}`, 'button solid')}<small>${t('aiNote')}</small></div><div class="connection-visual"><div class="connection-cloud">${icons.cloud}<span>${t('aiCloud')}<small>${t('aiCloudSub')}</small></span></div><div class="vertical-connector"></div><a class="vora-logo" href="${escapeAttribute(config.voraUrl)}" target="_blank" rel="noopener noreferrer"><img src="/brand/vora-wide.png" alt="VORA.IM" width="240" height="66"/><span>www.vora.im ${icons.diagonal}</span></a><div class="connection-branches"></div><div class="connected-products">${products.map(p => `<div>${brand(p.id)}<span>${p.name}</span></div>`).join('')}</div><p class="connection-caption">${t('aiConnect')}</p></div><ol class="connection-steps">${t('aiSteps').map((s, i) => `<li><span>0${i + 1}</span>${s}</li>`).join('')}</ol></section>`;
  }

  function footer() {
    return `<footer class="footer wrap"><div class="footer-top"><div><a class="footer-brand" href="/${lang}/">${brand('works')}<span>VORA AI WORKS</span></a><p>${t('intro')}</p></div><a class="maker" href="${escapeAttribute(config.companyUrl)}" target="_blank" rel="noopener noreferrer"><span>${t('madeBy')}</span><img src="/brand/horizon-${theme}.webp" alt="Linkbricks Horizon-AI" width="220" height="54"/><span>www.horizonai.ai ${icons.diagonal}</span></a></div><div class="footer-bottom"><small>${t('copyright')}</small><nav class="footer-languages" aria-label="${t('language')}">${[['ko', '한국어'], ['ja', '日本語'], ['en', 'English']].map(([code, name]) => `<a href="/${code}/" lang="${code}" hreflang="${code}" ${lang === code ? 'aria-current="page"' : ''}>${name}</a>`).join('')}</nav><a href="#">↑ TOP</a></div></footer>`;
  }


  function downloadDialog(id, osName) {
    const p = products.find(product => product.id === id);
    if (!p) return '';
    return `${brand(p.id)}<span class="eyebrow">VORA ${p.name} / ${escapeAttribute(osName)}</span><h2 id="dialog-title">${t('dialogTitle')}</h2><p>${t('dialogBody')}</p><div class="dialog-platforms">${[['mac', 'macos', 'macOS'], ['windows', 'windows', 'Windows'], ['linux', 'linux', 'Linux']].map(([id, os, name]) => `<div>${icons[id]}<span>${name}</span>${p.downloads[os] ? link(p.downloads[os], t('download')) : `<small>${t('coming')}</small>`}</div>`).join('')}</div>${link(p.url, `${t('online')} ${icons.diagonal}`, 'button solid')}`;
  }

  return { html: editorial() + `<dialog id="download-dialog" aria-labelledby="dialog-title"><button class="dialog-close" data-action="close-dialog" aria-label="${t('close')}">${icons.close}</button><div id="dialog-content"></div></dialog>`, downloadDialog };
}
