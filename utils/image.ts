
import { Figure } from '../types';

export const cropImage = (originalCanvas: HTMLCanvasElement, figure: Figure): string => {
  const [ymin, xmin, ymax, xmax] = figure.box_2d;
  const w = originalCanvas.width;
  const h = originalCanvas.height;

  const padding = 15;
  const sx = Math.max(0, (xmin / 1000) * w - padding);
  const sy = Math.max(0, (ymin / 1000) * h - padding);
  const sWidth = Math.min(w - sx, ((xmax - xmin) / 1000) * w + padding * 2);
  const sHeight = Math.min(h - sy, ((ymax - ymin) / 1000) * h + padding * 2);

  const cropCanvas = document.createElement('canvas');
  cropCanvas.width = sWidth;
  cropCanvas.height = sHeight;
  const ctx = cropCanvas.getContext('2d');
  
  if (!ctx) return '';
  ctx.drawImage(originalCanvas, sx, sy, sWidth, sHeight, 0, 0, sWidth, sHeight);
  return cropCanvas.toDataURL('image/png');
};

/**
 * Rotates an image (data URL or source URL) by a specified angle in degrees.
 * Returns a Promise that resolves with the rotated image as a high-resolution PNG data URL.
 */
export const rotateImageDataUrl = (
  src: string,
  angleDeg: number,
  backgroundColor: string = '#ffffff'
): Promise<string> => {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => {
      let srcW = img.width || 1200;
      let srcH = img.height || 900;
      
      const rad = (angleDeg * Math.PI) / 180;
      const sin = Math.abs(Math.sin(rad));
      const cos = Math.abs(Math.cos(rad));
      const newW = Math.max(1, Math.round(srcW * cos + srcH * sin));
      const newH = Math.max(1, Math.round(srcW * sin + srcH * cos));

      const offscreen = document.createElement('canvas');
      offscreen.width = newW;
      offscreen.height = newH;
      const ctx = offscreen.getContext('2d');
      if (!ctx) {
        reject(new Error('Failed to obtain 2D canvas context for rotation'));
        return;
      }

      ctx.imageSmoothingEnabled = true;
      ctx.imageSmoothingQuality = 'high';

      if (backgroundColor) {
        ctx.fillStyle = backgroundColor;
        ctx.fillRect(0, 0, newW, newH);
      }

      ctx.translate(newW / 2, newH / 2);
      ctx.rotate(rad);
      ctx.drawImage(img, -srcW / 2, -srcH / 2);

      resolve(offscreen.toDataURL('image/png'));
    };
    img.onerror = (err) => reject(err);
    img.src = src;
  });
};

/**
 * Flips an image horizontally or vertically.
 */
export const flipImageDataUrl = (
  src: string,
  horizontal: boolean,
  backgroundColor: string = '#ffffff'
): Promise<string> => {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => {
      let srcW = img.width || 1200;
      let srcH = img.height || 900;

      const offscreen = document.createElement('canvas');
      offscreen.width = srcW;
      offscreen.height = srcH;
      const ctx = offscreen.getContext('2d');
      if (!ctx) {
        reject(new Error('Failed to obtain 2D canvas context for flip'));
        return;
      }

      ctx.imageSmoothingEnabled = true;
      ctx.imageSmoothingQuality = 'high';

      if (backgroundColor) {
        ctx.fillStyle = backgroundColor;
        ctx.fillRect(0, 0, srcW, srcH);
      }

      ctx.translate(horizontal ? srcW : 0, horizontal ? 0 : srcH);
      ctx.scale(horizontal ? -1 : 1, horizontal ? 1 : -1);
      ctx.drawImage(img, 0, 0);

      resolve(offscreen.toDataURL('image/png'));
    };
    img.onerror = (err) => reject(err);
    img.src = src;
  });
};
