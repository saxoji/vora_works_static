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
}
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
    if (validArtifacts(data, config.siteUrl, product).length && JSON.stringify(data) !== JSON.stringify(manifest)) {
      manifest = data; render();
    }
  }
} catch { /* Build-time release links stay available when the update feed is offline. */ }
