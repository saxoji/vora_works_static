import { publishProductReleases } from './desktop-releases.mjs';
export const publishHwpReleases = options => publishProductReleases({...options,product:'hwp'});
