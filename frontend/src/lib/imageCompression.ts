/**
 * Compress an image File or base64 Data URL to a lightweight JPEG Data URL.
 * Prevents LocalStorage QuotaExceededError and improves loading performance.
 */
export async function compressImage(
  fileOrUrl: File | string,
  maxWidth = 1280,
  maxHeight = 1280,
  quality = 0.75
): Promise<string> {
  return new Promise((resolve) => {
    let originalDataUrl = typeof fileOrUrl === 'string' ? fileOrUrl : '';

    try {
      if (typeof fileOrUrl === 'string') {
        if (!fileOrUrl.startsWith('data:image')) {
          // Already an external URL or placeholder
          return resolve(fileOrUrl);
        }
      }

      const img = new Image();
      // Only set crossOrigin if loading external http(s) images, not data URLs
      if (typeof fileOrUrl === 'string' && !fileOrUrl.startsWith('data:')) {
        img.crossOrigin = 'anonymous';
      }

      const handleImageLoaded = () => {
        try {
          const canvas = document.createElement('canvas');
          let width = img.width || 800;
          let height = img.height || 600;

          if (width > maxWidth || height > maxHeight) {
            const ratio = Math.min(maxWidth / width, maxHeight / height);
            width = Math.max(1, Math.round(width * ratio));
            height = Math.max(1, Math.round(height * ratio));
          }

          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext('2d');
          if (!ctx) {
            return resolve(originalDataUrl);
          }

          ctx.drawImage(img, 0, 0, width, height);
          const compressed = canvas.toDataURL('image/jpeg', quality);
          resolve(compressed || originalDataUrl);
        } catch (err) {
          console.warn('Image compression fallback to original:', err);
          resolve(originalDataUrl);
        }
      };

      img.onload = handleImageLoaded;
      img.onerror = () => {
        resolve(originalDataUrl);
      };

      if (typeof fileOrUrl === 'string') {
        img.src = fileOrUrl;
      } else {
        const reader = new FileReader();
        reader.onload = (e) => {
          const res = (e.target?.result as string) || '';
          originalDataUrl = res;
          if (res) {
            img.src = res;
          } else {
            resolve('');
          }
        };
        reader.onerror = () => resolve('');
        reader.readAsDataURL(fileOrUrl);
      }
    } catch (e) {
      console.warn('compressImage exception:', e);
      resolve(originalDataUrl);
    }
  });
}
