/**
 * Utility to sample dominant/edge colors from an image client-side using Canvas.
 * Cached in-memory to avoid re-calculating for the same image URL.
 */

export interface ExtractedColors {
  dominant: string;
  dark: string;
  medium: string;
  light: string;
  edgeColor: string;
  background: string;
}

export const DEFAULT_FALLBACK_COLORS: ExtractedColors = {
  dominant: 'rgb(30, 41, 59)',
  dark: 'rgb(15, 23, 42)',
  medium: 'rgb(24, 33, 47)',
  light: 'rgb(51, 65, 85)',
  edgeColor: 'rgb(15, 23, 42)',
  background: 'radial-gradient(ellipse at center, rgb(28, 38, 54) 0%, rgb(13, 19, 31) 100%)',
};

const colorCache = new Map<string, ExtractedColors>();

export function extractDominantColor(
  imageUrl: string,
  callback: (colors: ExtractedColors) => void
): void {
  if (!imageUrl) {
    callback(DEFAULT_FALLBACK_COLORS);
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
        colorCache.set(imageUrl, DEFAULT_FALLBACK_COLORS);
        callback(DEFAULT_FALLBACK_COLORS);
        return;
      }

      // Small sample canvas (32x32) for lightning-fast calculation
      const W = 32;
      const H = 32;
      canvas.width = W;
      canvas.height = H;
      ctx.drawImage(img, 0, 0, W, H);

      const imageData = ctx.getImageData(0, 0, W, H);
      const data = imageData.data;

      // 1. Sample perimeter edge pixels (where non-matching aspect ratio letterboxing touches the image)
      let edgeR = 0, edgeG = 0, edgeB = 0, edgeCount = 0;
      const edgePixels: [number, number, number][] = [];

      for (let x = 0; x < W; x++) {
        // Top edge: y = 0
        const topIdx = (0 * W + x) * 4;
        if (data[topIdx + 3] > 50) {
          const r = data[topIdx], g = data[topIdx + 1], b = data[topIdx + 2];
          edgeR += r; edgeG += g; edgeB += b; edgeCount++;
          edgePixels.push([r, g, b]);
        }
        // Bottom edge: y = H - 1
        const btmIdx = ((H - 1) * W + x) * 4;
        if (data[btmIdx + 3] > 50) {
          const r = data[btmIdx], g = data[btmIdx + 1], b = data[btmIdx + 2];
          edgeR += r; edgeG += g; edgeB += b; edgeCount++;
          edgePixels.push([r, g, b]);
        }
      }

      for (let y = 1; y < H - 1; y++) {
        // Left edge: x = 0
        const leftIdx = (y * W + 0) * 4;
        if (data[leftIdx + 3] > 50) {
          const r = data[leftIdx], g = data[leftIdx + 1], b = data[leftIdx + 2];
          edgeR += r; edgeG += g; edgeB += b; edgeCount++;
          edgePixels.push([r, g, b]);
        }
        // Right edge: x = W - 1
        const rightIdx = (y * W + (W - 1)) * 4;
        if (data[rightIdx + 3] > 50) {
          const r = data[rightIdx], g = data[rightIdx + 1], b = data[rightIdx + 2];
          edgeR += r; edgeG += g; edgeB += b; edgeCount++;
          edgePixels.push([r, g, b]);
        }
      }

      // 2. Sample overall dominant color
      let domR = 0, domG = 0, domB = 0, domCount = 0;
      for (let i = 0; i < data.length; i += 4) {
        const a = data[i + 3];
        if (a > 50) {
          domR += data[i];
          domG += data[i + 1];
          domB += data[i + 2];
          domCount++;
        }
      }

      const rDom = domCount > 0 ? Math.round(domR / domCount) : 30;
      const gDom = domCount > 0 ? Math.round(domG / domCount) : 41;
      const bDom = domCount > 0 ? Math.round(domB / domCount) : 59;

      const rEdge = edgeCount > 0 ? Math.round(edgeR / edgeCount) : rDom;
      const gEdge = edgeCount > 0 ? Math.round(edgeG / edgeCount) : gDom;
      const bEdge = edgeCount > 0 ? Math.round(edgeB / edgeCount) : bDom;

      // Variance among edge pixels to detect solid or uniform borders
      let edgeVariance = 0;
      if (edgePixels.length > 0) {
        for (const [r, g, b] of edgePixels) {
          edgeVariance += (r - rEdge) ** 2 + (g - gEdge) ** 2 + (b - bEdge) ** 2;
        }
        edgeVariance /= edgePixels.length;
      }
      const edgeStdDev = Math.sqrt(edgeVariance);

      const edgeLum = 0.299 * rEdge + 0.587 * gEdge + 0.114 * bEdge;
      const domLum = 0.299 * rDom + 0.587 * gDom + 0.114 * bDom;

      let background: string;
      let darkColor: string;
      let mediumColor: string;
      let lightColor: string;

      if (edgeStdDev < 20) {
        // Uniform edge - blend seamlessly with the image border color
        background = `rgb(${rEdge}, ${gEdge}, ${bEdge})`;
        darkColor = `rgb(${Math.max(0, Math.round(rEdge * 0.45))}, ${Math.max(0, Math.round(gEdge * 0.45))}, ${Math.max(0, Math.round(bEdge * 0.45))})`;
        mediumColor = `rgb(${rEdge}, ${gEdge}, ${bEdge})`;
        lightColor = `rgb(${Math.min(255, Math.round(rEdge * 1.2))}, ${Math.min(255, Math.round(gEdge * 1.2))}, ${Math.min(255, Math.round(bEdge * 1.2))})`;
      } else if (edgeLum > 195 || domLum > 200) {
        // Light image / flyer - soft complementary light ambient tint
        const rSoft = Math.max(0, Math.round(rDom * 0.90));
        const gSoft = Math.max(0, Math.round(gDom * 0.90));
        const bSoft = Math.max(0, Math.round(bDom * 0.90));
        background = `radial-gradient(ellipse at center, rgb(${rDom}, ${gDom}, ${bDom}) 0%, rgb(${rSoft}, ${gSoft}, ${bSoft}) 100%)`;
        darkColor = `rgb(${rSoft}, ${gSoft}, ${bSoft})`;
        mediumColor = `rgb(${rDom}, ${gDom}, ${bDom})`;
        lightColor = `rgb(255, 255, 255)`;
      } else {
        // Rich photographic or vibrant image - deep atmospheric gradient matching image palette
        const rMed = Math.max(16, Math.round(rDom * 0.48));
        const gMed = Math.max(16, Math.round(gDom * 0.48));
        const bMed = Math.max(16, Math.round(bDom * 0.48));

        const rDark = Math.max(8, Math.round(rDom * 0.20));
        const gDark = Math.max(8, Math.round(gDom * 0.20));
        const bDark = Math.max(8, Math.round(bDom * 0.20));

        background = `radial-gradient(ellipse at center, rgb(${rMed}, ${gMed}, ${bMed}) 0%, rgb(${rDark}, ${gDark}, ${bDark}) 100%)`;
        darkColor = `rgb(${rDark}, ${gDark}, ${bDark})`;
        mediumColor = `rgb(${rMed}, ${gMed}, ${bMed})`;
        lightColor = `rgb(${Math.min(255, Math.round(rDom * 1.35))}, ${Math.min(255, Math.round(gDom * 1.35))}, ${Math.min(255, Math.round(bDom * 1.35))})`;
      }

      const result: ExtractedColors = {
        dominant: `rgb(${rDom}, ${gDom}, ${bDom})`,
        dark: darkColor,
        medium: mediumColor,
        light: lightColor,
        edgeColor: `rgb(${rEdge}, ${gEdge}, ${bEdge})`,
        background,
      };

      colorCache.set(imageUrl, result);
      callback(result);
    } catch {
      // Fallback for CORS or canvas errors
      colorCache.set(imageUrl, DEFAULT_FALLBACK_COLORS);
      callback(DEFAULT_FALLBACK_COLORS);
    }
  };

  img.onerror = () => {
    colorCache.set(imageUrl, DEFAULT_FALLBACK_COLORS);
    callback(DEFAULT_FALLBACK_COLORS);
  };

  img.src = imageUrl;
}
