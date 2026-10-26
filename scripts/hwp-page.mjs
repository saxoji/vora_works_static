import { desktopRoutes, renderDesktopPage, buildDesktopPages } from './desktop-pages.mjs';
export const hwpRoutes = desktopRoutes.filter(path=>path.startsWith('/downloads/hwp/'));
export const renderHwpPage = (config,lang,manifest,path) => renderDesktopPage(config,'hwp',lang,manifest,path);
export const buildHwpPages = buildDesktopPages;
