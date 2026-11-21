import type {DrawingToolId} from './types';

export function TvToolSvg({
  tool,
  className = 'w-[18px] h-[18px]',
}: {
  tool: DrawingToolId | 'patterns_group' | 'projection_group' | 'fib_group';
  className?: string;
}) {
  switch (tool) {
    case 'crosshair':
      return (
        <svg viewBox="0 0 28 28" className={className} fill="none" stroke="currentColor" strokeWidth="1.4">
          <path d="M14 4v6M14 18v6M4 14h6M18 14h6" strokeLinecap="round" />
          <circle cx="14" cy="14" r="1.5" fill="currentColor" />
        </svg>
      );

    case 'trendline':
      return (
        <svg viewBox="0 0 28 28" className={className} fill="none" stroke="currentColor" strokeWidth="1.4">
          <line x1="6.5" y1="21.5" x2="21.5" y2="6.5" />
          <circle cx="6" cy="22" r="2.2" fill="var(--tv-icon-bg, #fff)" />
          <circle cx="22" cy="6" r="2.2" fill="var(--tv-icon-bg, #fff)" />
        </svg>
      );

    case 'ray':
      return (
        <svg viewBox="0 0 28 28" className={className} fill="none" stroke="currentColor" strokeWidth="1.4">
          <line x1="6.5" y1="21.5" x2="23" y2="5" />
          <circle cx="6" cy="22" r="2.2" fill="var(--tv-icon-bg, #fff)" />
          <circle cx="15" cy="13" r="2.2" fill="var(--tv-icon-bg, #fff)" />
        </svg>
      );

    case 'infoline':
      return (
        <svg viewBox="0 0 28 28" className={className} fill="none" stroke="currentColor" strokeWidth="1.4">
          <line x1="5.5" y1="22.5" x2="18.5" y2="9.5" />
          <circle cx="5.5" cy="22.5" r="2" fill="var(--tv-icon-bg, #fff)" />
          <circle cx="18.5" cy="9.5" r="2" fill="var(--tv-icon-bg, #fff)" />
          <rect x="13" y="4" width="11" height="7" rx="1.5" />
        </svg>
      );

    case 'extline':
      return (
        <svg viewBox="0 0 28 28" className={className} fill="none" stroke="currentColor" strokeWidth="1.4">
          <line x1="4" y1="24" x2="24" y2="4" />
          <circle cx="10" cy="18" r="2" fill="var(--tv-icon-bg, #fff)" />
          <circle cx="18" cy="10" r="2" fill="var(--tv-icon-bg, #fff)" />
        </svg>
      );

    case 'angle':
      return (
        <svg viewBox="0 0 28 28" className={className} fill="none" stroke="currentColor" strokeWidth="1.4">
          <path d="M6 21h17M6 21L20 7" />
          <path d="M13 21a7 7 0 0 0-2-5" strokeDasharray="2 1.5" />
          <circle cx="6" cy="21" r="2" fill="var(--tv-icon-bg, #fff)" />
          <circle cx="20" cy="7" r="2" fill="var(--tv-icon-bg, #fff)" />
        </svg>
      );

    case 'hline':
      return (
        <svg viewBox="0 0 28 28" className={className} fill="none" stroke="currentColor" strokeWidth="1.5">
          <line x1="4" y1="14" x2="24" y2="14" />
          <circle cx="14" cy="14" r="2.2" fill="var(--tv-icon-bg, #fff)" />
        </svg>
      );

    case 'hray':
      return (
        <svg viewBox="0 0 28 28" className={className} fill="none" stroke="currentColor" strokeWidth="1.5">
          <line x1="7" y1="14" x2="24" y2="14" />
          <circle cx="6.5" cy="14" r="2.2" fill="var(--tv-icon-bg, #fff)" />
        </svg>
      );

    case 'vline':
      return (
        <svg viewBox="0 0 28 28" className={className} fill="none" stroke="currentColor" strokeWidth="1.5">
          <line x1="14" y1="4" x2="14" y2="24" />
          <circle cx="14" cy="14" r="2.2" fill="var(--tv-icon-bg, #fff)" />
        </svg>
      );

    case 'crossline':
      return (
        <svg viewBox="0 0 28 28" className={className} fill="none" stroke="currentColor" strokeWidth="1.4">
          <line x1="4" y1="14" x2="24" y2="14" />
          <line x1="14" y1="4" x2="14" y2="24" />
          <circle cx="14" cy="14" r="2.2" fill="var(--tv-icon-bg, #fff)" />
        </svg>
      );

    case 'channel':
    case 'regtrend':
    case 'flattop':
    case 'disjoint':
      return (
        <svg viewBox="0 0 28 28" className={className} fill="none" stroke="currentColor" strokeWidth="1.35">
          <line x1="5" y1="16" x2="19" y2="6" />
          <line x1="9" y1="22" x2="23" y2="12" />
          <line x1="7" y1="19" x2="21" y2="9" strokeDasharray="2 2" opacity="0.7" />
          <circle cx="5" cy="16" r="1.8" fill="var(--tv-icon-bg, #fff)" />
          <circle cx="19" cy="6" r="1.8" fill="var(--tv-icon-bg, #fff)" />
          <circle cx="9" cy="22" r="1.8" fill="var(--tv-icon-bg, #fff)" />
        </svg>
      );

    case 'pitchfork':
    case 'schiff':
      return (
        <svg viewBox="0 0 28 28" className={className} fill="none" stroke="currentColor" strokeWidth="1.35">
          <line x1="5" y1="23" x2="22" y2="6" />
          <path d="M7 15L19 3M11 25L23 13" />
          <line x1="7" y1="15" x2="17" y2="19" strokeDasharray="2 1.5" />
          <circle cx="5" cy="23" r="1.8" fill="var(--tv-icon-bg, #fff)" />
          <circle cx="9" cy="13" r="1.8" fill="var(--tv-icon-bg, #fff)" />
          <circle cx="15" cy="21" r="1.8" fill="var(--tv-icon-bg, #fff)" />
        </svg>
      );

    case 'fib':
    case 'fib_group':
      return (
        <svg viewBox="0 0 28 28" className={className} fill="none" stroke="currentColor" strokeWidth="1.35">
          <line x1="4" y1="7" x2="24" y2="7" />
          <line x1="4" y1="12" x2="24" y2="12" />
          <line x1="4" y1="17" x2="24" y2="17" />
          <line x1="4" y1="22" x2="24" y2="22" />
          <circle cx="9" cy="7" r="1.7" fill="var(--tv-icon-bg, #fff)" />
          <circle cx="19" cy="22" r="1.7" fill="var(--tv-icon-bg, #fff)" />
        </svg>
      );

    case 'fibext':
      return (
        <svg viewBox="0 0 28 28" className={className} fill="none" stroke="currentColor" strokeWidth="1.35">
          <path d="M5 21L12 10L17 16" />
          <line x1="11" y1="7" x2="24" y2="7" />
          <line x1="11" y1="12" x2="24" y2="12" />
          <line x1="11" y1="19" x2="24" y2="19" />
          <circle cx="5" cy="21" r="1.6" fill="var(--tv-icon-bg, #fff)" />
          <circle cx="12" cy="10" r="1.6" fill="var(--tv-icon-bg, #fff)" />
          <circle cx="17" cy="16" r="1.6" fill="var(--tv-icon-bg, #fff)" />
        </svg>
      );

    case 'fibchannel':
    case 'fibtime':
    case 'fibfan':
    case 'fibtrendtime':
    case 'fibwedge':
    case 'pitchfan':
      return (
        <svg viewBox="0 0 28 28" className={className} fill="none" stroke="currentColor" strokeWidth="1.35">
          <path d="M5 22L22 6M5 22L24 12M5 22L24 18" />
          <circle cx="5" cy="22" r="1.8" fill="var(--tv-icon-bg, #fff)" />
          <circle cx="16" cy="11" r="1.8" fill="var(--tv-icon-bg, #fff)" />
        </svg>
      );

    case 'fibcircles':
    case 'fibspiral':
    case 'fibarcs':
      return (
        <svg viewBox="0 0 28 28" className={className} fill="none" stroke="currentColor" strokeWidth="1.35">
          <circle cx="14" cy="14" r="9" />
          <circle cx="14" cy="14" r="5" />
          <circle cx="14" cy="14" r="1.8" fill="currentColor" />
        </svg>
      );

    case 'gannbox':
    case 'gannsquarefixed':
    case 'gannsquare':
    case 'gannfan':
      return (
        <svg viewBox="0 0 28 28" className={className} fill="none" stroke="currentColor" strokeWidth="1.35">
          <rect x="5" y="5" width="18" height="18" rx="1" />
          <line x1="5" y1="14" x2="23" y2="14" opacity="0.7" />
          <line x1="14" y1="5" x2="14" y2="23" opacity="0.7" />
          <line x1="5" y1="23" x2="23" y2="5" />
        </svg>
      );

    case 'patterns_group':
    case 'xabcd':
    case 'cypher':
    case 'headshoulders':
    case 'abcd':
    case 'triangle':
    case 'threedrives':
      return (
        <svg viewBox="0 0 28 28" className={className} fill="none" stroke="currentColor" strokeWidth="1.35">
          <path d="M4 20L9 7L14 16L19 6L24 18" />
          <line x1="4" y1="20" x2="24" y2="18" strokeDasharray="2 1.5" opacity="0.55" />
          <circle cx="4" cy="20" r="1.7" fill="var(--tv-icon-bg, #fff)" />
          <circle cx="9" cy="7" r="1.7" fill="var(--tv-icon-bg, #fff)" />
          <circle cx="14" cy="16" r="1.7" fill="var(--tv-icon-bg, #fff)" />
          <circle cx="19" cy="6" r="1.7" fill="var(--tv-icon-bg, #fff)" />
          <circle cx="24" cy="18" r="1.7" fill="var(--tv-icon-bg, #fff)" />
        </svg>
      );

    case 'elliott5':
    case 'elliott3':
    case 'elliotttri':
    case 'elliottwxy':
    case 'elliottwxyz':
      return (
        <svg viewBox="0 0 28 28" className={className} fill="none" stroke="currentColor" strokeWidth="1.35">
          <path d="M5 20L10 10L15 16L22 7" />
          <circle cx="5" cy="20" r="1.7" fill="var(--tv-icon-bg, #fff)" />
          <circle cx="10" cy="10" r="1.7" fill="var(--tv-icon-bg, #fff)" />
          <circle cx="15" cy="16" r="1.7" fill="var(--tv-icon-bg, #fff)" />
          <circle cx="22" cy="7" r="1.7" fill="var(--tv-icon-bg, #fff)" />
        </svg>
      );

    case 'cyclic':
    case 'timecycles':
    case 'sine':
      return (
        <svg viewBox="0 0 28 28" className={className} fill="none" stroke="currentColor" strokeWidth="1.35">
          <path d="M4 16c3-7 6-7 10 0s7 7 10 0" />
          <circle cx="9" cy="11" r="1.6" fill="var(--tv-icon-bg, #fff)" />
          <circle cx="19" cy="21" r="1.6" fill="var(--tv-icon-bg, #fff)" />
        </svg>
      );

    case 'projection_group':
    case 'longpos':
      return (
        <svg viewBox="0 0 28 28" className={className} fill="none" stroke="currentColor" strokeWidth="1.35">
          <rect x="6" y="5" width="16" height="9" fill="#2962FF" fillOpacity="0.18" stroke="#2962FF" />
          <rect x="6" y="14" width="16" height="8" fill="#64748B" fillOpacity="0.18" stroke="currentColor" />
          <line x1="4" y1="14" x2="24" y2="14" stroke="#2962FF" strokeWidth="1.5" />
        </svg>
      );

    case 'shortpos':
      return (
        <svg viewBox="0 0 28 28" className={className} fill="none" stroke="currentColor" strokeWidth="1.35">
          <rect x="6" y="6" width="16" height="8" fill="#64748B" fillOpacity="0.18" stroke="currentColor" />
          <rect x="6" y="14" width="16" height="9" fill="#2962FF" fillOpacity="0.18" stroke="#2962FF" />
          <line x1="4" y1="14" x2="24" y2="14" stroke="#2962FF" strokeWidth="1.5" />
        </svg>
      );

    case 'forecast':
    case 'daterange':
      return (
        <svg viewBox="0 0 28 28" className={className} fill="none" stroke="currentColor" strokeWidth="1.4">
          <path d="M5 19l6-6 4 4 8-9" />
          <path d="M18 8h5v5" />
        </svg>
      );

    case 'rect':
      return (
        <svg viewBox="0 0 28 28" className={className} fill="none" stroke="currentColor" strokeWidth="1.4">
          <rect x="6" y="7" width="16" height="14" rx="1" />
          <circle cx="6" cy="7" r="1.8" fill="var(--tv-icon-bg, #fff)" />
          <circle cx="22" cy="21" r="1.8" fill="var(--tv-icon-bg, #fff)" />
        </svg>
      );

    case 'brush':
      return (
        <svg viewBox="0 0 28 28" className={className} fill="none" stroke="currentColor" strokeWidth="1.4">
          <path d="M19.5 4.5l4 4L11 21H7v-4L19.5 4.5z" />
          <path d="M6 22.5c-1.5 1-2.5 1-3 0 .8-1 1.8-1.5 3 0z" fill="currentColor" />
        </svg>
      );

    case 'text':
      return (
        <svg viewBox="0 0 28 28" className={className} fill="none" stroke="currentColor" strokeWidth="1.7">
          <path d="M7 7h14M14 7v15M10.5 22h7" strokeLinecap="round" />
        </svg>
      );

    case 'callout':
      return (
        <svg viewBox="0 0 28 28" className={className} fill="none" stroke="currentColor" strokeWidth="1.4">
          <circle cx="14" cy="14" r="9" />
          <circle cx="11" cy="12" r="1" fill="currentColor" />
          <circle cx="17" cy="12" r="1" fill="currentColor" />
          <path d="M10.5 16.5c1 1.5 6 1.5 7 0" strokeLinecap="round" />
        </svg>
      );

    case 'measure':
      return (
        <svg viewBox="0 0 28 28" className={className} fill="none" stroke="currentColor" strokeWidth="1.4">
          <path d="M5 18L18 5l5 5L10 23z" />
          <path d="M10 13l2 2M13 10l2 2M16 7l2 2" />
        </svg>
      );

    default:
      return (
        <svg viewBox="0 0 28 28" className={className} fill="none" stroke="currentColor" strokeWidth="1.4">
          <line x1="6" y1="22" x2="22" y2="6" />
        </svg>
      );
  }
}

export function SymbolBadge({symbol, size = 18}: {symbol: string; size?: number}) {
  const s = symbol.toUpperCase();
  if (s === 'XAUUSD') {
    return (
      <span
        style={{width: size, height: size}}
        className="inline-flex items-center justify-center rounded-full bg-gradient-to-br from-[#FACC15] via-[#EAB308] to-[#CA8A04] text-[#422006] font-extrabold text-[8px] shrink-0 ring-1 ring-amber-500/40"
      >
        Au
      </span>
    );
  }
  if (s === 'DXY') {
    return (
      <span
        style={{width: size, height: size}}
        className="inline-flex items-center justify-center rounded-full bg-[#16A34A] text-white font-extrabold text-[9px] shrink-0"
      >
        $
      </span>
    );
  }
  if (s === 'USDT.D') {
    return (
      <span
        style={{width: size, height: size}}
        className="inline-flex items-center justify-center rounded-full bg-[#26A17B] text-white font-extrabold text-[9px] shrink-0"
      >
        ₮
      </span>
    );
  }
  if (s === 'BTCUSDT' || s === 'BTCUSD') {
    return (
      <span
        style={{width: size, height: size}}
        className="inline-flex items-center justify-center rounded-full bg-[#F7931A] text-white font-extrabold text-[9px] shrink-0"
      >
        ₿
      </span>
    );
  }
  if (s === 'NAS100') {
    return (
      <span
        style={{width: size, height: size}}
        className="inline-flex items-center justify-center rounded-full bg-[#0284C7] text-white font-extrabold text-[7px] shrink-0"
      >
        NQ
      </span>
    );
  }

  // Dual overlapping FX flags matching Screenshot 9 (EURUSD, GBPUSD, AUDUSD, NZDUSD, USDCAD, USDJPY, USDCHF)
  const flagPalette: Record<string, {bg1: string; bg2: string; txt1: string; txt2: string}> = {
    EURUSD: {bg1: '#1D4ED8', bg2: '#DC2626', txt1: 'E', txt2: 'U'},
    GBPUSD: {bg1: '#1E3A8A', bg2: '#DC2626', txt1: '£', txt2: '$'},
    AUDUSD: {bg1: '#1E40AF', bg2: '#DC2626', txt1: 'A', txt2: '$'},
    NZDUSD: {bg1: '#0F172A', bg2: '#DC2626', txt1: 'N', txt2: '$'},
    USDCAD: {bg1: '#1D4ED8', bg2: '#EF4444', txt1: '$', txt2: 'C'},
    USDJPY: {bg1: '#1D4ED8', bg2: '#F8FAFC', txt1: '$', txt2: '¥'},
    USDCHF: {bg1: '#1D4ED8', bg2: '#DC2626', txt1: '$', txt2: '₣'},
  };
  const cfg = flagPalette[s] || {bg1: '#2563EB', bg2: '#0F172A', txt1: s[0], txt2: s[3] || '$'};

  return (
    <span style={{width: size + 4, height: size}} className="relative inline-flex items-center shrink-0">
      <span
        style={{
          width: size * 0.68,
          height: size * 0.68,
          backgroundColor: cfg.bg1,
        }}
        className="rounded-full text-white font-bold text-[7px] flex items-center justify-center ring-1 ring-white dark:ring-[#131722]"
      >
        {cfg.txt1}
      </span>
      <span
        style={{
          width: size * 0.68,
          height: size * 0.68,
          backgroundColor: cfg.bg2,
          color: cfg.bg2 === '#F8FAFC' ? '#DC2626' : '#FFFFFF',
          marginLeft: -size * 0.22,
          marginTop: size * 0.22,
        }}
        className="rounded-full font-bold text-[7px] flex items-center justify-center ring-1 ring-white dark:ring-[#131722]"
      >
        {cfg.txt2}
      </span>
    </span>
  );
}
