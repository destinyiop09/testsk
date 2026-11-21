import {useEffect, useRef, useState} from 'react';
import {ArrowRight, ChevronLeft, ChevronRight, Play} from 'lucide-react';
import {ResilientImage} from './ResilientImage';
import type {SiteRoute} from './DedicatedPages';

export interface ShowcaseSlide {
  id: string;
  category: string;
  meta: string;
  title: string;
  caption: string;
  imageUrl: string;
  route: SiteRoute;
}

const SHOWCASE_SLIDES: ShowcaseSlide[] = [
  {
    id: 'slide-desk',
    category: 'Live Signals',
    meta: 'London & NY Killzones',
    title: 'Institutional XAUUSD Execution Desk',
    caption: 'Structured entries, defined stop-losses, and multi-target take profits in real time.',
    imageUrl: '/src/assets/images/hero_sk_trading_desk_1795218764551.jpg',
    route: 'signals',
  },
  {
    id: 'slide-classroom',
    category: 'Mentorship',
    meta: 'Weekly Live Breakdowns',
    title: 'Guided Chart Review Sessions',
    caption: 'Interactive workshops focused on live price delivery, bias, and execution timing.',
    imageUrl: '/src/assets/images/academy_classroom_session_1795227629901.jpg',
    route: 'mentorship',
  },
  {
    id: 'slide-gold',
    category: 'Gold Blueprint',
    meta: 'XAUUSD Framework',
    title: 'Premium Gold Strategy Model',
    caption: 'Asian range sweeps, COMEX open displacement, and Fair Value Gap entries.',
    imageUrl: '/src/assets/images/course_xauusd_mastery_1795218762721.jpg',
    route: 'gold-blueprint',
  },
  {
    id: 'slide-smc',
    category: 'SKFX Academy',
    meta: 'Curriculum · 15+ Lessons',
    title: 'Market Structure & Liquidity Concepts',
    caption: 'Build independent chart-reading precision from foundational structure to order flow.',
    imageUrl: '/src/assets/images/course_smc_liquidity_1795218764204.jpg',
    route: 'academy',
  },
  {
    id: 'slide-risk',
    category: 'Trading Simulator',
    meta: 'Virtual Risk Lab',
    title: 'Position Sizing & Discipline Calibration',
    caption: 'Test lot sizing, drawdown limits, and 20-trade expectancy without risking capital.',
    imageUrl: '/src/assets/images/course_risk_psychology_1795218763621.jpg',
    route: 'simulator',
  },
  {
    id: 'slide-mentor',
    category: 'Kombat Ecosystem',
    meta: 'Community & Strategy',
    title: 'Trade Alongside Kombat Sampson',
    caption: 'Connect with disciplined Forex and Gold traders in structured study rooms.',
    imageUrl: '/src/assets/images/mentor_kombat_sampson_1795218763545.jpg',
    route: 'community',
  },
];

interface MediaMarqueeCarouselProps {
  onNavigate: (route: SiteRoute) => void;
}

export function MediaMarqueeCarousel({onNavigate}: MediaMarqueeCarouselProps) {
  const trackRef = useRef<HTMLDivElement>(null);
  const offsetRef = useRef(0);
  const targetBoostRef = useRef(0);
  const [paused, setPaused] = useState(false);

  useEffect(() => {
    const prefersReduced =
      typeof window !== 'undefined' &&
      window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    let rafId = 0;
    let lastTime = performance.now();

    const step = (now: number) => {
      const dt = Math.min(48, now - lastTime);
      lastTime = now;

      const track = trackRef.current;
      if (track) {
        const halfWidth = track.scrollWidth / 2;
        if (halfWidth > 0) {
          if (!paused && !prefersReduced) {
            offsetRef.current += (dt / 1000) * 38;
          }

          if (Math.abs(targetBoostRef.current) > 0.5) {
            const delta = targetBoostRef.current * 0.16;
            offsetRef.current += delta;
            targetBoostRef.current -= delta;
          } else {
            targetBoostRef.current = 0;
          }

          if (offsetRef.current >= halfWidth) {
            offsetRef.current -= halfWidth;
          } else if (offsetRef.current < 0) {
            offsetRef.current += halfWidth;
          }

          track.style.transform = `translate3d(-${offsetRef.current.toFixed(2)}px, 0, 0)`;
        }
      }

      rafId = requestAnimationFrame(step);
    };

    rafId = requestAnimationFrame(step);
    return () => cancelAnimationFrame(rafId);
  }, [paused]);

  const scrubBy = (direction: -1 | 1) => {
    targetBoostRef.current += direction * 380;
  };

  const slides = [...SHOWCASE_SLIDES, ...SHOWCASE_SLIDES];

  return (
    <div
      className="relative"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      onFocus={() => setPaused(true)}
      onBlur={() => setPaused(false)}
    >
      {/* Left / Right Circular Overlay Navigation Buttons */}
      <button
        type="button"
        onClick={() => scrubBy(-1)}
        aria-label="Scroll showcase left"
        className="absolute left-3 sm:left-5 top-1/2 -translate-y-1/2 z-20 inline-flex items-center justify-center w-11 h-11 rounded-full bg-white text-[#001B44] border border-slate-200 shadow-[0_10px_28px_rgba(0,27,68,0.16)] hover:scale-105 hover:bg-slate-50 transition-all dark:bg-[#022156] dark:text-white dark:border-blue-400/25"
      >
        <ChevronLeft className="w-5 h-5" />
      </button>

      <button
        type="button"
        onClick={() => scrubBy(1)}
        aria-label="Scroll showcase right"
        className="absolute right-3 sm:right-5 top-1/2 -translate-y-1/2 z-20 inline-flex items-center justify-center w-11 h-11 rounded-full bg-white text-[#001B44] border border-slate-200 shadow-[0_10px_28px_rgba(0,27,68,0.16)] hover:scale-105 hover:bg-slate-50 transition-all dark:bg-[#022156] dark:text-white dark:border-blue-400/25"
      >
        <ChevronRight className="w-5 h-5" />
      </button>

      {/* Edge Soft Fades */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-y-0 left-0 w-10 sm:w-20 z-10 bg-gradient-to-r from-white via-white/70 to-transparent dark:from-[#050924] dark:via-[#050924]/70"
      />
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-y-0 right-0 w-10 sm:w-20 z-10 bg-gradient-to-l from-white via-white/70 to-transparent dark:from-[#050924] dark:via-[#050924]/70"
      />

      <div className="overflow-hidden py-2">
        <div ref={trackRef} className="flex gap-5 w-max will-change-transform">
          {slides.map((slide, idx) => (
            <button
              key={`${slide.id}-${idx}`}
              type="button"
              onClick={() => onNavigate(slide.route)}
              className="group text-left w-[300px] sm:w-[356px] shrink-0 rounded-2xl bg-white dark:bg-[#08153A] border border-slate-200/90 dark:border-blue-400/20 shadow-[0_10px_30px_-12px_rgba(0,27,68,0.08)] hover:shadow-[0_18px_40px_-14px_rgba(0,27,68,0.16)] hover:-translate-y-1 transition-all duration-200 overflow-hidden flex flex-col"
            >
              <div className="relative h-48 w-full overflow-hidden bg-[#001B44]">
                <ResilientImage
                  src={slide.imageUrl}
                  alt={slide.title}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                />
                <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-[#001B44]/80 via-[#001B44]/20 to-transparent" />
                <span className="absolute bottom-3 left-3 inline-flex items-center justify-center w-9 h-9 rounded-full bg-white/95 text-[#001B44] shadow-md group-hover:scale-105 transition-transform">
                  <Play className="w-3.5 h-3.5 fill-[#001B44] ml-0.5" />
                </span>
              </div>

              <div className="p-5 flex-1 flex flex-col justify-between gap-4">
                <div>
                  <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-300/80">
                    <span className="font-semibold text-[#059669] dark:text-emerald-400">
                      {slide.category}
                    </span>
                    <span aria-hidden="true">·</span>
                    <span>{slide.meta}</span>
                  </div>
                  <h3 className="mt-2 font-display text-base sm:text-lg font-bold text-[#001B44] dark:text-white leading-snug">
                    {slide.title}
                  </h3>
                  <p className="mt-1.5 text-xs sm:text-sm text-slate-600 dark:text-slate-300/85 leading-relaxed">
                    {slide.caption}
                  </p>
                </div>

                <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#1D4ED8] dark:text-sky-300 group-hover:gap-2 transition-all">
                  <span>Explore module</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </span>
              </div>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
