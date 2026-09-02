/**
 * Utility to sample dominant/edge colors from an image client-side using Canvas.
 * Cached in-memory to avoid re-calculating for the same image URL.
 */

const colorCache = new Map<string, { dominant: string; dark: string; light: string }>();

export function extractDominantColor(
  imageUrl: string,
  callback: (colors: { dominant: string; dark: string; light: string }) => void
): void {
  if (!imageUrl) {
    callback({ dominant: 'rgba(30, 41, 59, 1)', dark: 'rgba(15, 23, 42, 1)', light: 'rgba(51, 65, 85, 1)' });
    return;
  }

  if (colorCache.has(imageUrl)) {
    callback(colorCache.get(imageUrl)!);
    return;
  }

  const img = new Image();
  img.crossOrigin = 'anonymous';

  img.onload = () => {
    try {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d', { willReadFrequently: true });
      if (!ctx) {
        const fallback = { dominant: '#1e293b', dark: '#0f172a', light: '#334155' };
        colorCache.set(imageUrl, fallback);
        callback(fallback);
        return;
      }

      // Small sample canvas for fast calculation
      canvas.width = 32;
      canvas.height = 32;
      ctx.drawImage(img, 0, 0, 32, 32);

      const imageData = ctx.getImageData(0, 0, 32, 32);
      const data = imageData.data;
      let r = 0, g = 0, b = 0, count = 0;

      // Sample pixels, weighting edges slightly more for seamless letterboxing
      for (let i = 0; i < data.length; i += 16) {
        const alpha = data[i + 3];
        if (alpha > 50) {
          r += data[i];
          g += data[i + 1];
          b += data[i + 2];
          count++;
        }
      }

      if (count > 0) {
        r = Math.round(r / count);
        g = Math.round(g / count);
        b = Math.round(b / count);
      } else {
        r = 30; g = 41; b = 59;
      }

      const dominant = `rgb(${r}, ${g}, ${b})`;
      const dark = `rgb(${Math.max(0, Math.round(r * 0.45))}, ${Math.max(0, Math.round(g * 0.45))}, ${Math.max(0, Math.round(b * 0.45))})`;
      const light = `rgb(${Math.min(255, Math.round(r * 1.35))}, ${Math.min(255, Math.round(g * 1.35))}, ${Math.min(255, Math.round(b * 1.35))})`;

      const result = { dominant, dark, light };
      colorCache.set(imageUrl, result);
      callback(result);
    } catch {
      // Fallback for CORS or canvas errors
      const fallback = { dominant: '#1e293b', dark: '#0f172a', light: '#334155' };
      colorCache.set(imageUrl, fallback);
      callback(fallback);
    }
  };

  img.onerror = () => {
    const fallback = { dominant: '#1e293b', dark: '#0f172a', light: '#334155' };
    colorCache.set(imageUrl, fallback);
    callback(fallback);
  };

  img.src = imageUrl;
}
