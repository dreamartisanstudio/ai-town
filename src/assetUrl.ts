// Asset paths are stored base-agnostic; rows written by sub-path deployments carry
// a '/ai-town/' prefix, so normalize everything onto the current Vite base.
export function assetUrl(url: string): string {
  if (/^https?:\/\//.test(url)) return url;
  const rel = url.replace(/^\/ai-town\//, '/').replace(/^\//, '');
  return import.meta.env.BASE_URL + rel;
}
