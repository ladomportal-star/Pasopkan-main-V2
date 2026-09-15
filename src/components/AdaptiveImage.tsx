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
  autoFrame?: boolean;
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
  autoFrame = false,
}) => {
  const [colors, setColors] = useState<ExtractedColors>(DEFAULT_FALLBACK_COLORS);
  const [isLandscape, setIsLandscape] = useState<boolean | null>(null);

  useEffect(() => {
    if (!src) return;
    
    const img = new Image();
    img.src = src;
    img.onload = () => {
      setIsLandscape(img.naturalWidth > img.naturalHeight);
    };

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

  const actualFitMode = autoFrame && isLandscape !== null 
    ? (isLandscape ? 'cover' : 'contain') 
    : fitMode;
    
  const actualShowBlur = autoFrame && isLandscape !== null 
    ? (isLandscape ? false : true) 
    : showBlurBackdrop;

  if (autoFrame) {
    return (
      <div
        onClick={onClick}
        style={{
          backgroundColor: colors.dark,
          transition: 'background-color 0.4s ease',
        }}
        className={`relative overflow-hidden flex items-center justify-center select-none ${className}`}
      >
        {actualShowBlur && (
          <>
            <img
              src={src}
              alt=""
              aria-hidden="true"
              className={`absolute inset-0 w-full h-full object-cover blur-[40px] scale-125 opacity-80 saturate-[1.2] contrast-110 pointer-events-none filter ${backdropClassName}`}
            />
            <div
              className="absolute inset-0 pointer-events-none opacity-50 mix-blend-multiply"
              style={{
                backgroundColor: colors.dark,
              }}
            />
            <div
              className="absolute inset-0 pointer-events-none opacity-40"
              style={{
                background: `linear-gradient(to bottom, transparent 0%, ${colors.dark} 100%)`,
              }}
            />
          </>
        )}
        <div className={`relative overflow-hidden w-full h-full ${imageClassName}`}>
          <img
            src={src}
            alt={alt}
            className={`relative z-10 w-full h-full transition-all duration-300 pointer-events-none ${
              actualFitMode === 'contain' 
                ? 'object-contain drop-shadow-[0_8px_30px_rgba(0,0,0,0.5)]' 
                : 'object-cover'
            }`}
          />
        </div>
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
      {actualShowBlur && (
        <>
          <img
            src={src}
            alt=""
            aria-hidden="true"
            className={`absolute inset-0 w-full h-full object-cover blur-2xl scale-135 opacity-75 saturate-150 contrast-110 pointer-events-none filter ${backdropClassName}`}
          />
          <div
            className="absolute inset-0 pointer-events-none opacity-30"
            style={{
              background: `radial-gradient(circle at center, transparent 40%, ${colors.dark} 95%)`,
            }}
          />
        </>
      )}
      <img
        src={src}
        alt={alt}
        className={`relative z-10 w-full h-full transition-all duration-300 pointer-events-none ${
          actualFitMode === 'contain' 
            ? 'object-contain drop-shadow-[0_4px_16px_rgba(0,0,0,0.25)]' 
            : 'object-cover'
        } ${imageClassName}`}
      />
      {children}
    </div>
  );
};

export default AdaptiveImage;
