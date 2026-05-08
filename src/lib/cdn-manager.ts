/**
 * CDN Manager
 * ──────────────────────────────────────────────────────────
 * Handles asset URL generation and CDN fallbacks.
 */

const CDN_BASE_URL = process.env.NEXT_PUBLIC_CDN_URL || 'https://cdn.namainvist.com';
const USE_CDN = process.env.NEXT_PUBLIC_USE_CDN === 'true';

export const cdnManager = {
  /**
   * Get the full URL for an asset
   * @param path The relative path to the asset (e.g. '/images/logo.png')
   * @param fallback The local path if CDN is disabled
   */
  getAssetUrl(path: string, fallback?: string): string {
    if (!path.startsWith('/')) {
      path = '/' + path;
    }

    if (USE_CDN) {
      return `${CDN_BASE_URL}${path}`;
    }

    return fallback || path;
  },

  /**
   * Generate an optimized image URL via CDN (if supported)
   */
  getOptimizedImageUrl(path: string, width: number, quality: number = 80): string {
    const url = this.getAssetUrl(path);
    if (USE_CDN) {
      // Assuming a CDN service like Cloudflare Image Resizing or similar
      return `${url}?w=${width}&q=${quality}&format=auto`;
    }
    return url;
  }
};
