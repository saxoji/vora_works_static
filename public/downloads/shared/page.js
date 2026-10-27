import config from '/config.js';
import { LANGUAGE_KEY, THEME_KEY, resolveLanguage, readPreference, savePreference } from '/src/preferences.js';
import { copyFor, products, languages } from './content.js';
import { renderBody, validArtifacts } from './view.js';
const product = location.pathname.split('/')[2];
if (!products[product]) throw new Error('Unknown download product');
const query = new URL(location.href).searchParams;
const routeLanguage = location.pathname.match(/\/(ko|en|ja)\/?$/)?.[1];
let language = resolveLanguage(query.get('lang') || routeLanguage || readPreference(LANGUAGE_KEY, 'auto'), navigator.languages);
const requestedTheme = query.get('theme') || readPreference(THEME_KEY, 'system');
let theme = ['system','light','dark'].includes(requestedTheme) ? requestedTheme : 'system';
let manifest = JSON.parse(document.getElementById('release-data')?.textContent || 'null');
function render() {
  document.documentElement.lang = language;
  document.documentElement.dataset.theme = theme;
  document.title = copyFor(language, product).pageTitle;
  document.getElementById('app').innerHTML = renderBody(language, config, manifest, theme, product);
  const platform = ['macos','windows','linux'].includes(query.get('os')) ? query.get('os') : 'macos';
  document.querySelectorAll('.installation-guide').forEach(guide => { guide.open = guide.dataset.platform === platform; });
}
document.addEventListener('click', event => {
  const link = event.target.closest('.install-help');
  const guide = link && document.querySelector(link.getAttribute('href'));
  if (guide) guide.open = true;
});
document.addEventListener('change', event => {
  if (event.target.id === 'theme') {
    theme = event.target.value; savePreference(THEME_KEY, theme);
    document.documentElement.dataset.theme = theme;
  }
  if (event.target.id === 'language' && languages.includes(event.target.value)) {
    savePreference(LANGUAGE_KEY, event.target.value);
    location.assign(`/downloads/${product}/${event.target.value}/`);
  }
});
render();
try {
  const response = await fetch(config.products[product].releaseManifestURL || `/releases/${product}/stable.json`, {cache:'no-store'});
  if (response.ok) {
    const data = await response.json();
    // A valid pending feed intentionally withdraws the build-time download links.
    // Missing/invalid artifacts alone are not authority to remove a release.
    const pending = data?.schemaVersion === 1 && data.product === product && data.status === 'pending'
      && typeof data.version === 'string' && data.version === data.version.trim() && /^\d+\.\d+\.\d+$/.test(data.version)
      && Array.isArray(data.artifacts) && data.artifacts.length === 0;
    const available = data?.status !== 'pending' && validArtifacts(data, config.siteUrl, product).length > 0;
    if ((pending || available) && JSON.stringify(data) !== JSON.stringify(manifest)) {
      manifest = data; render();
    }
  }
} catch { /* Build-time release links stay available when the update feed is offline. */ }
