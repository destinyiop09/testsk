import {motion, useScroll, useTransform} from 'motion/react';

const LIVE_OVERLAY_CANDLES = [
  {x: 34, o: 122, c: 108, h: 102, l: 128, bull: true},
  {x: 52, o: 108, c: 116, h: 104, l: 122, bull: false},
  {x: 70, o: 116, c: 96, h: 90, l: 120, bull: true},
  {x: 88, o: 96, c: 78, h: 72, l: 102, bull: true},
  {x: 106, o: 78, c: 88, h: 74, l: 94, bull: false},
  {x: 124, o: 88, c: 64, h: 58, l: 92, bull: true},
  {x: 142, o: 64, c: 46, h: 38, l: 70, bull: true},
  {x: 160, o: 46, c: 56, h: 42, l: 64, bull: false},
  {x: 178, o: 56, c: 34, h: 26, l: 60, bull: true},
  {x: 196, o: 34, c: 22, h: 16, l: 40, bull: true},
];

export function AnimatedHeroBackdrop() {
  const {scrollY} = useScroll();
  const parallaxY = useTransform(scrollY, [0, 700], [0, 72]);
  const parallaxScale = useTransform(scrollY, [0, 700], [1, 1.04]);

  return (
    <div
      aria-hidden="true"
      className="pointer-events-none absolute inset-0 overflow-hidden"
    >
      {/* Ultra-HD Crisp Portrait Canvas positioned on right with seamless edge feathering & scroll parallax */}
      <motion.div
        style={{y: parallaxY, scale: parallaxScale}}
        className="absolute inset-y-0 right-0 w-full lg:w-[64%] xl:w-[60%] flex justify-center lg:justify-end"
      >
        <motion.div
          animate={{y: [0, -8, 0]}}
          transition={{duration: 9, repeat: Infinity, ease: 'easeInOut'}}
          className="relative h-full w-full"
          style={{
            maskImage:
              'linear-gradient(to right, transparent 0%, rgba(0,0,0,0.85) 22%, black 52%, black 92%, transparent 100%)',
            WebkitMaskImage:
              'linear-gradient(to right, transparent 0%, rgba(0,0,0,0.85) 22%, black 52%, black 92%, transparent 100%)',
          }}
        >
          <img
            src="/assets/aistudio/image_6256fa45.png"
            alt=""
            referrerPolicy="no-referrer"
            decoding="sync"
            className="h-full w-full object-cover object-top opacity-90 dark:opacity-95 contrast-[1.06] saturate-[1.08]"
          />

          {/* Subtle bottom fade into downstream sections */}
          <div className="absolute inset-x-0 bottom-0 h-40 bg-gradient-to-t from-[#F8FAFC] via-[#F8FAFC]/65 to-transparent dark:from-[#050924] dark:via-[#050924]/60 dark:to-transparent" />
        </motion.div>
      </motion.div>

      {/* Live Animated Candlestick & Liquidity Trace Overlay aligned over the chart */}
      <div className="absolute right-[4%] top-[10%] w-[240px] sm:w-[340px] lg:right-[6%] lg:top-[14%] lg:w-[440px] opacity-75 lg:opacity-80 dark:opacity-90">
        <svg viewBox="0 0 240 150" className="w-full h-auto overflow-visible">
          <defs>
            <linearGradient id="heroTraceGrad" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#38BDF8" stopOpacity="0.2" />
              <stop offset="50%" stopColor="#38BDF8" stopOpacity="0.95" />
              <stop offset="100%" stopColor="#22C55E" stopOpacity="1" />
            </linearGradient>
          </defs>

          {/* Sweeping bullish liquidity trajectory */}
          <motion.path
            d="M 20 124 L 52 112 L 88 82 L 106 88 L 142 46 L 160 56 L 196 22"
            fill="none"
            stroke="url(#heroTraceGrad)"
            strokeWidth="1.6"
            strokeLinecap="round"
            initial={{pathLength: 0, opacity: 0.4}}
            animate={{pathLength: [0, 1, 1], opacity: [0.35, 0.95, 0.35]}}
            transition={{
              duration: 5.5,
              repeat: Infinity,
              ease: 'easeInOut',
            }}
          />

          {/* Animated floating candlesticks synced with image chart */}
          {LIVE_OVERLAY_CANDLES.map((c, idx) => {
            const top = Math.min(c.o, c.c);
            const height = Math.max(4, Math.abs(c.c - c.o));
            const color = c.bull ? '#22C55E' : '#EF4444';
            const isTrailing = idx >= LIVE_OVERLAY_CANDLES.length - 3;

            return (
              <motion.g
                key={c.x}
                initial={{opacity: 0, y: 6}}
                animate={
                  isTrailing
                    ? {
                        opacity: [0.72, 1, 0.72],
                        y: [0, -3.5, 0],
                      }
                    : {opacity: [0.45, 0.85, 0.45], y: 0}
                }
                transition={{
                  duration: isTrailing ? 2.6 : 4.2,
                  delay: idx * 0.16,
                  repeat: Infinity,
                  ease: 'easeInOut',
                }}
              >
                <line
                  x1={c.x}
                  y1={c.h}
                  x2={c.x}
                  y2={c.l}
                  stroke={color}
                  strokeWidth="1.15"
                />
                <rect
                  x={c.x - 2.6}
                  y={top}
                  width="5.2"
                  height={height}
                  fill={color}
                  rx="1"
                />
              </motion.g>
            );
          })}
        </svg>
      </div>

      {/* Measured contrast scrim so left typography remains crisp */}
      <div className="absolute inset-0 bg-gradient-to-r from-[#F8FAFC]/95 via-[#F8FAFC]/68 to-transparent dark:from-[#050924]/95 dark:via-[#060C30]/68 dark:to-transparent" />
    </div>
  );
}
