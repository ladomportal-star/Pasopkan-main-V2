import React, { useEffect, useState } from 'react';
import { extractDominantColor, ExtractedColors, DEFAULT_FALLBACK_COLORS } from '../utils/imageColor';

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
  showBlurBackdrop = false,
}) => {
  const [colors, setColors] = useState<ExtractedColors>(DEFAULT_FALLBACK_COLORS);

  useEffect(() => {
    if (!src) return;
    extractDominantColor(src, (extracted) => {
      setColors(extracted);
    });
  }, [src]);

  if (!src) {
    return (
      <div className={`relative overflow-hidden bg-gray-100 flex items-center justify-center ${className}`}>
        {children}
      </div>
    );
  }

  return (
    <div
      onClick={onClick}
      style={{
        background: colors.background,
        backgroundColor: colors.dark,
        transition: 'background 0.4s ease, background-color 0.4s ease',
      }}
      className={`relative overflow-hidden flex items-center justify-center select-none ${className}`}
    >
      {/* Ambient same-color blurred backdrop only if explicitly enabled */}
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
          fitMode === 'contain' 
            ? 'object-contain drop-shadow-[0_4px_16px_rgba(0,0,0,0.25)]' 
            : 'object-cover'
        } ${imageClassName}`}
      />

      {/* Optional Overlay / Slot */}
      {children}
    </div>
  );
};

export default AdaptiveImage;
