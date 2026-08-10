'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import Image from 'next/image';

type AdPosition =
  | 'top-left'
  | 'top-center'
  | 'top-right'
  | 'center-left'
  | 'center'
  | 'center-right'
  | 'bottom-left'
  | 'bottom-center'
  | 'bottom-right';

interface DynamicAdProps {
  image: string;
  alt?: string;
  href?: string;
  label?: string;
  title?: string;
  description?: string;
  ctaText?: string;
  /** How long the ad stays visible (ms). Default: 18 seconds */
  displayDuration?: number;
}

const POSITIONS: AdPosition[] = [
  'top-left',
  'top-center',
  'top-right',
  'center-left',
  'center',
  'center-right',
  'bottom-left',
  'bottom-center',
  'bottom-right',
];

const POSITION_CLASSES: Record<AdPosition, string> = {
  'top-left': 'top-5 left-5 sm:top-6 sm:left-6',
  'top-center': 'top-5 left-1/2 -translate-x-1/2 sm:top-6',
  'top-right': 'top-5 right-5 sm:top-6 sm:right-6',
  'center-left': 'top-1/2 left-5 -translate-y-1/2 sm:left-6',
  'center': 'top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2',
  'center-right': 'top-1/2 right-5 -translate-y-1/2 sm:right-6',
  'bottom-left': 'bottom-5 left-5 sm:bottom-6 sm:left-6',
  'bottom-center': 'bottom-5 left-1/2 -translate-x-1/2 sm:bottom-6',
  'bottom-right': 'bottom-5 right-5 sm:bottom-6 sm:right-6',
};

function getRandomDelay() {
  // Random between 40 000 – 50 000 ms
  return Math.floor(Math.random() * 10000) + 40000;
}

function getRandomPosition(exclude?: AdPosition): AdPosition {
  const available = exclude
    ? POSITIONS.filter((p) => p !== exclude)
    : POSITIONS;
  return available[Math.floor(Math.random() * available.length)];
}

export default function DynamicAd({
  image,
  alt = 'Sponsored',
  href,
  label = 'Sponsored',
  title,
  description,
  ctaText = 'Learn more',
  displayDuration = 18000,
}: DynamicAdProps) {
  const [isVisible, setIsVisible] = useState(false);
  const [isAnimatingOut, setIsAnimatingOut] = useState(false);
  const [showCloseButton, setShowCloseButton] = useState(false);
  const [currentPosition, setCurrentPosition] = useState<AdPosition>('bottom-right');

  const showTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const hideTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const closeButtonTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const animTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const isMountedRef = useRef(true);
  const lastPositionRef = useRef<AdPosition | undefined>(undefined);

  const clearAllTimers = useCallback(() => {
    if (showTimerRef.current) {
      clearTimeout(showTimerRef.current);
      showTimerRef.current = null;
    }
    if (hideTimerRef.current) {
      clearTimeout(hideTimerRef.current);
      hideTimerRef.current = null;
    }
    if (closeButtonTimerRef.current) {
      clearTimeout(closeButtonTimerRef.current);
      closeButtonTimerRef.current = null;
    }
    if (animTimerRef.current) {
      clearTimeout(animTimerRef.current);
      animTimerRef.current = null;
    }
  }, []);

  const scheduleNextAppearance = useCallback(() => {
    clearAllTimers();

    const delay = getRandomDelay();

    showTimerRef.current = setTimeout(() => {
      if (!isMountedRef.current) return;

      // New random position every appearance
      const nextPos = getRandomPosition(lastPositionRef.current);
      lastPositionRef.current = nextPos;
      setCurrentPosition(nextPos);

      setIsAnimatingOut(false);
      setShowCloseButton(false);
      setIsVisible(true);

      // Show close button after exactly 10 seconds
      closeButtonTimerRef.current = setTimeout(() => {
        if (!isMountedRef.current) return;
        setShowCloseButton(true);
      }, 10000);

      // Auto-hide after displayDuration
      hideTimerRef.current = setTimeout(() => {
        if (!isMountedRef.current) return;

        setIsAnimatingOut(true);

        animTimerRef.current = setTimeout(() => {
          if (!isMountedRef.current) return;
          setIsVisible(false);
          setIsAnimatingOut(false);
          setShowCloseButton(false);
          scheduleNextAppearance();
        }, 320);
      }, displayDuration);
    }, delay);
  }, [clearAllTimers, displayDuration]);

  // Start cycle on mount
  useEffect(() => {
    isMountedRef.current = true;
    scheduleNextAppearance();

    return () => {
      isMountedRef.current = false;
      clearAllTimers();
    };
  }, [scheduleNextAppearance, clearAllTimers]);

  const handleClose = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    // Only allow close after the X is visible
    if (!showCloseButton) return;

    setIsAnimatingOut(true);

    animTimerRef.current = setTimeout(() => {
      if (!isMountedRef.current) return;
      setIsVisible(false);
      setIsAnimatingOut(false);
      setShowCloseButton(false);
      // Restart random 40–50s cycle
      scheduleNextAppearance();
    }, 320);
  };

  if (!isVisible) return null;

  const cardContent = (
    <div
      className={`
        relative w-[340px] sm:w-[380px] max-w-[calc(100vw-2rem)]
        bg-white
        rounded-xl
        border border-[#dadce0]
        shadow-[0_4px_16px_rgba(60,64,67,0.18),0_1px_3px_rgba(60,64,67,0.12)]
        overflow-hidden
        transition-all duration-300 ease-out
        ${
          isAnimatingOut
            ? 'opacity-0 scale-[0.96] translate-y-3'
            : 'opacity-100 scale-100 translate-y-0'
        }
      `}
    >
      {/* Header row */}
      <div className="flex items-center justify-between px-4 pt-3 pb-1.5">
        <span className="text-[11px] font-medium text-[#5f6368] tracking-[0.025em]">
          {label}
        </span>

        {/* Close button – appears only after 10s with fade/scale */}
        <div
          className={`
            transition-all duration-300 ease-out
            ${
              showCloseButton
                ? 'opacity-100 scale-100'
                : 'opacity-0 scale-75 pointer-events-none'
            }
          `}
        >
          <button
            type="button"
            onClick={handleClose}
            aria-label="Close ad"
            className="
              flex items-center justify-center
              w-6 h-6 rounded-full
              text-[#5f6368] hover:text-[#202124] hover:bg-[#f1f3f4]
              transition-colors
            "
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 20 20"
              fill="currentColor"
              className="w-4 h-4"
            >
              <path d="M6.28 5.22a.75.75 0 00-1.06 1.06L8.94 10l-3.72 3.72a.75.75 0 101.06 1.06L10 11.06l3.72 3.72a.75.75 0 101.06-1.06L11.06 10l3.72-3.72a.75.75 0 00-1.06-1.06L10 8.94 6.28 5.22z" />
            </svg>
          </button>
        </div>
      </div>

      {/* Large image area */}
      <div className="px-4 pt-1">
        <div className="relative w-full aspect-[16/10] rounded-lg overflow-hidden bg-[#f8f9fa]">
          <Image
            src={image}
            alt={alt}
            fill
            className="object-contain"
            sizes="(max-width: 640px) 340px, 380px"
            priority={false}
          />
        </div>
      </div>

      {/* Text + CTA */}
      <div className="px-4 pt-3 pb-4">
        {title && (
          <p className="text-[15px] font-medium text-[#202124] leading-snug mb-1 line-clamp-1">
            {title}
          </p>
        )}

        {description && (
          <p className="text-[13px] text-[#5f6368] leading-relaxed line-clamp-2 mb-3">
            {description}
          </p>
        )}

        {/* Action button – always visible from the start */}
        {ctaText && (
          <div className="flex items-center justify-between gap-3">
            <span className="inline-flex items-center gap-1.5 text-[13px] font-medium text-[#1a73e8]">
              {ctaText}
              <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 16 16"
                fill="currentColor"
                className="w-3.5 h-3.5"
              >
                <path
                  fillRule="evenodd"
                  d="M6.22 3.22a.75.75 0 011.06 0l4.25 4.25a.75.75 0 010 1.06l-4.25 4.25a.75.75 0 01-1.06-1.06L9.94 8 6.22 4.28a.75.75 0 010-1.06z"
                  clipRule="evenodd"
                />
              </svg>
            </span>
          </div>
        )}
      </div>
    </div>
  );

  return (
    <div
      className={`
        fixed z-[9999]
        pointer-events-auto
        ${POSITION_CLASSES[currentPosition]}
      `}
    >
      {href ? (
        <a
          href={href}
          target="_blank"
          rel="noopener noreferrer"
          className="block no-underline hover:no-underline"
        >
          {cardContent}
        </a>
      ) : (
        cardContent
      )}
    </div>
  );
}