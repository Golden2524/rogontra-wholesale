export function resolveStorefrontAsset(assetPath, baseUrl = window.location.href) {
  const normalizedPath = String(assetPath ?? '').replace(/^\/+/, '');

  if (!normalizedPath.startsWith('images/')) return '';

  return new URL(normalizedPath, baseUrl).href;
}
