import React, { useState, useRef, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { ArrowDown, RefreshCw, CheckCircle2 } from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';

export interface PullToRefreshProps {
  onRefresh: () => Promise<void> | void;
  isRefreshing: boolean;
  children: React.ReactNode;
  disabled?: boolean;
}

const PULL_THRESHOLD = 68; // pixels needed to trigger refresh
const MAX_PULL = 115; // maximum drag distance in px

export default function PullToRefresh({
  onRefresh,
  isRefreshing,
  children,
  disabled = false,
}: PullToRefreshProps) {
  const { lang } = useLanguage();
  const [pullDistance, setPullDistance] = useState<number>(0);
  const [showSuccess, setShowSuccess] = useState<boolean>(false);

  const startYRef = useRef<number>(0);
  const isDraggingRef = useRef<boolean>(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const isReadyToRelease = pullDistance >= PULL_THRESHOLD;

  const t = {
    en: {
      pull: 'Pull down to refresh',
      release: 'Release to refresh',
      refreshing: 'Fetching latest updates...',
      success: 'Up to date!',
    },
    lo: {
      pull: 'ດຶງລົງເພື່ອໂຫຼດໃໝ່',
      release: 'ປ່ອຍເພື່ອໂຫຼດໃໝ່',
      refreshing: 'ກຳລັງໂຫຼດຂໍ້ມູນຫຼ້າສຸດຈາກເຊີບເວີ...',
      success: 'ອັບເດດລາຍການແລ້ວ!',
    },
  }[lang];

  // When refreshing finishes, show a brief success state
  const prevRefreshingRef = useRef<boolean>(isRefreshing);
  useEffect(() => {
    if (prevRefreshingRef.current && !isRefreshing) {
      setShowSuccess(true);
      const timer = setTimeout(() => {
        setShowSuccess(false);
        setPullDistance(0);
      }, 700);
      return () => clearTimeout(timer);
    }
    prevRefreshingRef.current = isRefreshing;
  }, [isRefreshing]);

  const handleTouchStart = (e: React.TouchEvent) => {
    if (disabled || isRefreshing) return;
    // Only allow pull down when page scroll is at the top
    const scrollTop = window.scrollY || document.documentElement.scrollTop;
    if (scrollTop <= 0) {
      startYRef.current = e.touches[0].clientY;
      isDraggingRef.current = true;
    }
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (!isDraggingRef.current || disabled || isRefreshing) return;
    const currentY = e.touches[0].clientY;
    const diff = currentY - startYRef.current;

    const scrollTop = window.scrollY || document.documentElement.scrollTop;
    if (scrollTop <= 0 && diff > 0) {
      // Damped pull curve (diminishing return physics)
      const damped = Math.min(MAX_PULL, diff * 0.46);
      setPullDistance(damped);
    } else {
      setPullDistance(0);
      isDraggingRef.current = false;
    }
  };

  const triggerRefresh = useCallback(async () => {
    if (isRefreshing) return;
    try {
      await onRefresh();
    } catch (err) {
      console.error('Refresh error:', err);
    }
  }, [isRefreshing, onRefresh]);

  const handleTouchEnd = () => {
    if (!isDraggingRef.current) return;
    isDraggingRef.current = false;

    if (pullDistance >= PULL_THRESHOLD && !isRefreshing) {
      setPullDistance(PULL_THRESHOLD * 0.85);
      triggerRefresh();
    } else if (!isRefreshing) {
      setPullDistance(0);
    }
  };

  // Mouse drag support for desktop users
  const handleMouseDown = (e: React.MouseEvent) => {
    if (disabled || isRefreshing || e.button !== 0) return;
    const scrollTop = window.scrollY || document.documentElement.scrollTop;
    if (scrollTop <= 0) {
      startYRef.current = e.clientY;
      isDraggingRef.current = true;
    }
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDraggingRef.current || disabled || isRefreshing) return;
    const diff = e.clientY - startYRef.current;
    const scrollTop = window.scrollY || document.documentElement.scrollTop;
    if (scrollTop <= 0 && diff > 0) {
      const damped = Math.min(MAX_PULL, diff * 0.42);
      setPullDistance(damped);
    } else if (diff < 0) {
      setPullDistance(0);
      isDraggingRef.current = false;
    }
  };

  const handleMouseUp = () => {
    if (!isDraggingRef.current) return;
    isDraggingRef.current = false;
    if (pullDistance >= PULL_THRESHOLD && !isRefreshing) {
      setPullDistance(PULL_THRESHOLD * 0.85);
      triggerRefresh();
    } else if (!isRefreshing) {
      setPullDistance(0);
    }
  };

  // Determine indicator display height
  const indicatorHeight = isRefreshing || showSuccess
    ? 52
    : pullDistance;

  // Rotation percentage for arrow
  const progressRatio = Math.min(1, pullDistance / PULL_THRESHOLD);
  const arrowRotation = progressRatio * 180;

  return (
    <div
      ref={containerRef}
      className="relative select-none"
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
      onMouseDown={handleMouseDown}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
    >
      {/* Pull-to-refresh Indicator banner */}
      <div
        style={{
          height: `${indicatorHeight}px`,
          opacity: indicatorHeight > 8 ? 1 : 0,
        }}
        className="w-full overflow-hidden flex items-center justify-center transition-[height] duration-200 ease-out pointer-events-none"
        aria-live="polite"
      >
        <div className="flex items-center gap-2.5 px-4 py-2 rounded-2xl bg-white/95 border border-orange-100 shadow-sm backdrop-blur-sm text-xs font-bold text-adv-slate">
          {showSuccess ? (
            <>
              <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
              <span className="text-emerald-600 font-bold">{t.success}</span>
            </>
          ) : isRefreshing ? (
            <>
              <RefreshCw className="w-4 h-4 text-adv-orange animate-spin shrink-0" />
              <span className="text-gray-600 font-medium">{t.refreshing}</span>
            </>
          ) : (
            <>
              <div 
                className="w-5 h-5 rounded-full bg-orange-50 border border-orange-200 flex items-center justify-center text-adv-orange shrink-0 transition-transform duration-100"
                style={{ transform: `rotate(${arrowRotation}deg)` }}
              >
                <ArrowDown className="w-3.5 h-3.5" />
              </div>
              <span className={isReadyToRelease ? 'text-adv-orange font-bold' : 'text-gray-500'}>
                {isReadyToRelease ? t.release : t.pull}
              </span>
            </>
          )}
        </div>
      </div>

      {/* Content wrapper with slight transform while pulling */}
      <motion.div
        animate={{
          y: isRefreshing ? 0 : pullDistance * 0.25,
        }}
        transition={{ type: 'spring', stiffness: 400, damping: 30 }}
      >
        {children}
      </motion.div>
    </div>
  );
}
