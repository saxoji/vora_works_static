import { readFile, writeFile, mkdir } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';

const root = fileURLToPath(new URL('../', import.meta.url));
const ids = ['word', 'slide', 'cell', 'hwp'];

async function readEnv(file) {
  try {
    const source = await readFile(`${root}${file}`, 'utf8');
    return Object.fromEntries(source.split(/\r?\n/).map(line => line.trim()).filter(line => line && !line.startsWith('#')).map(line => {
      const match = line.match(/^([A-Z_]+)\s*=\s*(.*?)\s*$/);
      if (!match) throw new Error(`Invalid configuration line in ${file}`);
      return [match[1], match[2].replace(/^(['"])(.*)\1$/, '$2')];
    }));
  } catch (error) {
    if (error.code === 'ENOENT') return {};
    throw error;
  }
}

export async function generateConfig() {
  // Only this explicit set of public links is exported to the browser.
  const env = { ...await readEnv('.env.defaults'), ...await readEnv('.env.local'), ...process.env };
  const url = (key, required = false) => {
    const value = (env[key] || '').trim();
    if (!value && !required) return '';
    let parsed;
    try { parsed = new URL(value); } catch { throw new Error(`${key} must be a valid HTTPS URL`); }
    if (parsed.protocol !== 'https:' || parsed.username || parsed.password) throw new Error(`${key} must be a public HTTPS URL`);
    return parsed.href;
  };
  const config = {
    siteUrl: url('PUBLIC_SITE_URL'),
    voraUrl: url('PUBLIC_VORA_URL', true),
    voraSignupUrl: url('PUBLIC_VORA_SIGNUP_URL', true),
    companyUrl: url('PUBLIC_COMPANY_URL', true),
    products: Object.fromEntries(ids.map(id => [id, {
      web: url(`PUBLIC_${id.toUpperCase()}_WEB_URL`, true),
      releaseManifestURL: url(`PUBLIC_${id.toUpperCase()}_RELEASE_MANIFEST_URL`),
      downloadPageURL: url(`PUBLIC_${id.toUpperCase()}_DOWNLOAD_PAGE_URL`),
      downloads: Object.fromEntries(['macos', 'windows', 'linux'].map(os => [os, url(`PUBLIC_${id.toUpperCase()}_${os.toUpperCase()}_DOWNLOAD_URL`)])),
    }])),
  };
  await mkdir(`${root}public`, { recursive: true });
  await writeFile(`${root}public/config.js`, `// Generated from public environment variables at build time.\nexport default ${JSON.stringify(config, null, 2)};\n`);
  console.log(`Public link configuration generated (${ids.length} products)`);
  return config;
}
