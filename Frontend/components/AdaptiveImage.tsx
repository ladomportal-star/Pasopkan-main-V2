import React, { useEffect, useState } from 'react';
import { extractDominantColor } from '../utils/imageColor';

interface AdaptiveImageProps {
  src?: string | null;
  alt?: string;
  fitMode?: 'contain' | 'cover';
  className?: string;
  imageClassName?: string;
  backdropClassName?: string;
  children?: React.ReactNode;
  onClick?: (e: React.MouseEvent<HTMLDivElement>) => void;
  showBlurBackdrop?: boolean;
}

export const AdaptiveImage: React.FC<AdaptiveImageProps> = ({
  src,
  alt = '',
  fitMode = 'contain',
  className = '',
  imageClassName = '',
  backdropClassName = '',
  children,
  onClick,
  showBlurBackdrop = true,
}) => {
  const [colors, setColors] = useState<{ dominant: string; dark: string; light: string }>({
    dominant: '#1e293b',
    dark: '#0f172a',
    light: '#334155',
  });

  useEffect(() => {
    if (!src) return;
    extractDominantColor(src, (extracted) => {
      setColors(extracted);
    });
  }, [src]);

  if (!src) {
    return (
      <div className={`relative overflow-hidden bg-slate-900 flex items-center justify-center ${className}`}>
        {children}
      </div>
    );
  }

  return (
    <div
      onClick={onClick}
      style={{ backgroundColor: colors.dark }}
      className={`relative overflow-hidden flex items-center justify-center select-none ${className}`}
    >
      {/* Ambient same-color blurred backdrop filling any non-matching aspect ratio letterbox */}
      {showBlurBackdrop && (
        <>
          <img
            src={src}
            alt=""
            aria-hidden="true"
            className={`absolute inset-0 w-full h-full object-cover blur-2xl scale-135 opacity-75 saturate-150 contrast-110 pointer-events-none filter ${backdropClassName}`}
          />
          {/* Subtle same-color gradient scrim to make the transition buttery smooth */}
          <div
            className="absolute inset-0 pointer-events-none opacity-30"
            style={{
              background: `radial-gradient(circle at center, transparent 40%, ${colors.dark} 95%)`,
            }}
          />
        </>
      )}

      {/* Crisp foreground image */}
      <img
        src={src}
        alt={alt}
        className={`relative z-10 w-full h-full transition-all duration-300 pointer-events-none ${
          fitMode === 'contain' ? 'object-contain drop-shadow-xl p-0.5' : 'object-cover'
        } ${imageClassName}`}
      />

      {/* Optional Overlay / Slot */}
      {children}
    </div>
  );
};

export default AdaptiveImage;
