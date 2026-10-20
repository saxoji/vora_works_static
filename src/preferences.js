export const LANGUAGE_KEY = 'vora-works-language-v1';
export const THEME_KEY = 'vora-works-theme-v1';
export const languages = ['ko', 'ja', 'en'];

export function resolveLanguage(preference, browserLanguages = []) {
  if (languages.includes(preference)) return preference;
  for (const locale of browserLanguages) {
    const language = String(locale).toLowerCase().split(/[-_]/)[0];
    if (languages.includes(language)) return language;
  }
  return 'en';
}

export function resolveTheme(preference, prefersDark) {
  return ['dark', 'light'].includes(preference) ? preference : prefersDark ? 'dark' : 'light';
}

export function readPreference(key, fallback) {
  try { return localStorage.getItem(key) || fallback; } catch { return fallback; }
}

export function savePreference(key, value) {
  try { localStorage.setItem(key, value); } catch { /* Session controls remain usable when storage is blocked. */ }
}
