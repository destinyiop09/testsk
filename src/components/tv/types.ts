import type {UTCTimestamp} from 'lightweight-charts';

export interface CandleBar {
  time: number;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
}

export interface MarketPayload {
  symbol: string;
  displayName: string;
  interval: string;
  decimals: number;
  pipSize: number;
  price: number;
  previousClose: number;
  change: number;
  changePercent: number;
  source: string;
  dateRange?: {from: number; to: number; count: number};
  candles: CandleBar[];
}

export interface QuoteItem {
  symbol: string;
  name: string;
  decimals: number;
  price: number;
  change: number;
  changePercent: number;
}

export interface SimPosition {
  id: string;
  symbol: string;
  side: 'BUY' | 'SELL';
  lots: number;
  entryPrice: number;
  stopLoss: number | null;
  takeProfit: number | null;
  entryTime: number;
  status: 'OPEN' | 'PENDING';
}

export interface SimClosedTrade {
  id: string;
  symbol: string;
  side: 'BUY' | 'SELL';
  lots: number;
  entryPrice: number;
  exitPrice: number;
  entryTime: number;
  exitTime: number;
  pnl: number;
  pips: number;
  reason: 'TP Hit' | 'SL Hit' | 'Manual Close';
}

export interface PriceAlert {
  id: string;
  symbol: string;
  price: number;
  condition: 'CROSSING_ABOVE' | 'CROSSING_BELOW' | 'CROSSING';
  note: string;
  triggered: boolean;
  createdAt: number;
}

export type TimeframeKey = '5m' | '15m' | '30m' | '1h' | '4h' | '1d' | '1wk' | '1mo';
export type ChartStyleKey = 'candles' | 'hollow' | 'bars' | 'line' | 'area';
export type CandlePaletteKey = 'tv_blue_black' | 'classic_green_red';

export type DrawingToolId =
  | 'crosshair'
  | 'cut'
  // LINES & CHANNELS & PITCHFORKS (Screenshot 3)
  | 'trendline'
  | 'ray'
  | 'infoline'
  | 'extline'
  | 'angle'
  | 'hline'
  | 'hray'
  | 'vline'
  | 'crossline'
  | 'channel'
  | 'regtrend'
  | 'flattop'
  | 'disjoint'
  | 'pitchfork'
  | 'schiff'
  // FIBONACCI & GANN (Screenshot 2)
  | 'fib'
  | 'fibext'
  | 'fibchannel'
  | 'fibtime'
  | 'fibfan'
  | 'fibtrendtime'
  | 'fibcircles'
  | 'fibspiral'
  | 'fibarcs'
  | 'fibwedge'
  | 'pitchfan'
  | 'gannbox'
  | 'gannsquarefixed'
  | 'gannsquare'
  | 'gannfan'
  // PATTERNS, ELLIOTT WAVES & CYCLES (Screenshot 4)
  | 'xabcd'
  | 'cypher'
  | 'headshoulders'
  | 'abcd'
  | 'triangle'
  | 'threedrives'
  | 'elliott5'
  | 'elliott3'
  | 'elliotttri'
  | 'elliottwxy'
  | 'elliottwxyz'
  | 'cyclic'
  | 'timecycles'
  | 'sine'
  // PROJECTION & POSITION TOOLS (Screenshots 5, 6, 7, 8)
  | 'longpos'
  | 'shortpos'
  | 'forecast'
  | 'daterange'
  // BRUSH, TEXT, SHAPES & MEASURE
  | 'rect'
  | 'brush'
  | 'text'
  | 'callout'
  | 'measure';

export interface ChartPoint {
  time: number;
  price: number;
}

export interface ChartDrawing {
  id: string;
  tool: Exclude<DrawingToolId, 'crosshair' | 'cut'>;
  symbol: string;
  points: ChartPoint[];
  color: string;
  fillColor?: string;
  lineWidth?: number;
  text?: string;
  visible: boolean;
  locked: boolean;
  createdAt: number;
  // Position-specific editable settings (Screenshot 8)
  riskPercent?: number;
  leverage?: number;
  targetPrice?: number;
  stopPrice?: number;
  qtyPrecision?: 'Default' | '0.01' | '0.1' | '1';
}

export type ToolCatalogGroup =
  | 'LINES'
  | 'CHANNELS'
  | 'PITCHFORKS'
  | 'FIBONACCI'
  | 'GANN'
  | 'CHART PATTERNS'
  | 'ELLIOTT WAVES'
  | 'CYCLES'
  | 'PROJECTION'
  | 'SHAPES';

export interface ToolCatalogEntry {
  id: DrawingToolId;
  label: string;
  shortcut?: string;
  group: ToolCatalogGroup;
  requiredPoints: number;
}

export const DRAWING_CATALOG: ToolCatalogEntry[] = [
  // LINES (Screenshot 3)
  {id: 'trendline', label: 'Trendline', shortcut: 'Alt + T', group: 'LINES', requiredPoints: 2},
  {id: 'ray', label: 'Ray', group: 'LINES', requiredPoints: 2},
  {id: 'infoline', label: 'Info line', group: 'LINES', requiredPoints: 2},
  {id: 'extline', label: 'Extended line', group: 'LINES', requiredPoints: 2},
  {id: 'angle', label: 'Trend angle', group: 'LINES', requiredPoints: 2},
  {id: 'hline', label: 'Horizontal line', shortcut: 'Alt + H', group: 'LINES', requiredPoints: 1},
  {id: 'hray', label: 'Horizontal ray', shortcut: 'Alt + J', group: 'LINES', requiredPoints: 1},
  {id: 'vline', label: 'Vertical line', shortcut: 'Alt + V', group: 'LINES', requiredPoints: 1},
  {id: 'crossline', label: 'Crossline', shortcut: 'Alt + C', group: 'LINES', requiredPoints: 1},
  // CHANNELS (Screenshot 3)
  {id: 'channel', label: 'Parallel channel', group: 'CHANNELS', requiredPoints: 3},
  {id: 'regtrend', label: 'Regression trend', group: 'CHANNELS', requiredPoints: 2},
  {id: 'flattop', label: 'Flat top/bottom', group: 'CHANNELS', requiredPoints: 3},
  {id: 'disjoint', label: 'Disjoint channel', group: 'CHANNELS', requiredPoints: 3},
  // PITCHFORKS (Screenshot 3)
  {id: 'pitchfork', label: 'Pitchfork', group: 'PITCHFORKS', requiredPoints: 3},
  {id: 'schiff', label: 'Schiff pitchfork', group: 'PITCHFORKS', requiredPoints: 3},
  // FIBONACCI (Screenshot 2)
  {id: 'fib', label: 'Fib retracement', shortcut: 'Alt + F', group: 'FIBONACCI', requiredPoints: 2},
  {id: 'fibext', label: 'Trend-based fib extension', group: 'FIBONACCI', requiredPoints: 2},
  {id: 'fibchannel', label: 'Fib channel', group: 'FIBONACCI', requiredPoints: 3},
  {id: 'fibtime', label: 'Fib time zone', group: 'FIBONACCI', requiredPoints: 2},
  {id: 'fibfan', label: 'Fib speed resistance fan', group: 'FIBONACCI', requiredPoints: 2},
  {id: 'fibtrendtime', label: 'Trend-based fib time', group: 'FIBONACCI', requiredPoints: 2},
  {id: 'fibcircles', label: 'Fib circles', group: 'FIBONACCI', requiredPoints: 2},
  {id: 'fibspiral', label: 'Fib spiral', group: 'FIBONACCI', requiredPoints: 2},
  {id: 'fibarcs', label: 'Fib speed resistance arcs', group: 'FIBONACCI', requiredPoints: 2},
  {id: 'fibwedge', label: 'Fib wedge', group: 'FIBONACCI', requiredPoints: 3},
  {id: 'pitchfan', label: 'Pitchfan', group: 'FIBONACCI', requiredPoints: 3},
  // GANN (Screenshot 2)
  {id: 'gannbox', label: 'Gann box', group: 'GANN', requiredPoints: 2},
  {id: 'gannsquarefixed', label: 'Gann square fixed', group: 'GANN', requiredPoints: 2},
  {id: 'gannsquare', label: 'Gann square', group: 'GANN', requiredPoints: 2},
  {id: 'gannfan', label: 'Gann fan', group: 'GANN', requiredPoints: 2},
  // CHART PATTERNS (Screenshot 4)
  {id: 'xabcd', label: 'XABCD pattern', group: 'CHART PATTERNS', requiredPoints: 5},
  {id: 'cypher', label: 'Cypher pattern', group: 'CHART PATTERNS', requiredPoints: 5},
  {id: 'headshoulders', label: 'Head and shoulders', group: 'CHART PATTERNS', requiredPoints: 5},
  {id: 'abcd', label: 'ABCD pattern', group: 'CHART PATTERNS', requiredPoints: 4},
  {id: 'triangle', label: 'Triangle pattern', group: 'CHART PATTERNS', requiredPoints: 3},
  {id: 'threedrives', label: 'Three drives pattern', group: 'CHART PATTERNS', requiredPoints: 5},
  // ELLIOTT WAVES (Screenshot 4)
  {id: 'elliott5', label: 'Elliott impulse wave (1·2·3·4·5)', group: 'ELLIOTT WAVES', requiredPoints: 5},
  {id: 'elliott3', label: 'Elliott correction wave (A·B·C)', group: 'ELLIOTT WAVES', requiredPoints: 3},
  {id: 'elliotttri', label: 'Elliott triangle wave (A·B·C·D·E)', group: 'ELLIOTT WAVES', requiredPoints: 5},
  {id: 'elliottwxy', label: 'Elliott double combo wave (W·X·Y)', group: 'ELLIOTT WAVES', requiredPoints: 3},
  {id: 'elliottwxyz', label: 'Elliott triple combo wave (W·X·Y·Z)', group: 'ELLIOTT WAVES', requiredPoints: 4},
  // CYCLES (Screenshot 4)
  {id: 'cyclic', label: 'Cyclic lines', group: 'CYCLES', requiredPoints: 2},
  {id: 'timecycles', label: 'Time cycles', group: 'CYCLES', requiredPoints: 2},
  {id: 'sine', label: 'Sine line', group: 'CYCLES', requiredPoints: 2},
  // PROJECTION & POSITIONS (Screenshots 5, 6, 7, 8)
  {id: 'longpos', label: 'Long position', shortcut: 'L', group: 'PROJECTION', requiredPoints: 2},
  {id: 'shortpos', label: 'Short position', shortcut: 'S', group: 'PROJECTION', requiredPoints: 2},
  {id: 'forecast', label: 'Forecast', group: 'PROJECTION', requiredPoints: 2},
  {id: 'daterange', label: 'Date range', group: 'PROJECTION', requiredPoints: 2},
  // SHAPES & ANNOTATION
  {id: 'rect', label: 'Rectangle', shortcut: 'R', group: 'SHAPES', requiredPoints: 2},
  {id: 'brush', label: 'Brush', group: 'SHAPES', requiredPoints: -1},
  {id: 'text', label: 'Text', shortcut: 'T', group: 'SHAPES', requiredPoints: 1},
  {id: 'callout', label: 'Callout / Marker', group: 'SHAPES', requiredPoints: 1},
  {id: 'measure', label: 'Price range', shortcut: 'M', group: 'SHAPES', requiredPoints: 2},
];

export interface WatchlistGroup {
  id: string;
  label: string;
  symbols: {key: string; label: string; exchange: string; defaultFlagged?: boolean}[];
}

// Exact categorized watchlist matching Screenshot 9
export const WATCHLIST_GROUPS: WatchlistGroup[] = [
  {
    id: 'CONFIRMATION',
    label: 'CONFIRMATION',
    symbols: [
      {key: 'DXY', label: 'US Dollar Index', exchange: 'TVC'},
      {key: 'USDT.D', label: 'Tether Dominance %', exchange: 'CRYPTOCAP', defaultFlagged: true},
    ],
  },
  {
    id: 'USD QU',
    label: 'USD QU',
    symbols: [
      {key: 'EURUSD', label: 'Euro / US Dollar', exchange: 'OANDA', defaultFlagged: true},
      {key: 'GBPUSD', label: 'British Pound / USD', exchange: 'OANDA', defaultFlagged: true},
      {key: 'AUDUSD', label: 'Australian Dollar / USD', exchange: 'OANDA', defaultFlagged: true},
      {key: 'XAUUSD', label: 'Gold / US Dollar', exchange: 'COMEX', defaultFlagged: true},
      {key: 'NZDUSD', label: 'New Zealand Dollar / USD', exchange: 'OANDA'},
    ],
  },
  {
    id: 'USD BASE',
    label: 'USD BASE',
    symbols: [
      {key: 'USDCAD', label: 'US Dollar / Canadian Dollar', exchange: 'OANDA', defaultFlagged: true},
      {key: 'USDJPY', label: 'US Dollar / Japanese Yen', exchange: 'OANDA', defaultFlagged: true},
      {key: 'USDCHF', label: 'US Dollar / Swiss Franc', exchange: 'OANDA'},
    ],
  },
  {
    id: 'CRYPTO -USDT',
    label: 'CRYPTO -USDT',
    symbols: [
      {key: 'BTCUSDT', label: 'Bitcoin / TetherUS', exchange: 'BINANCE', defaultFlagged: true},
    ],
  },
];

export const SYMBOLS: {key: string; label: string; exchange: string; category: string}[] = [
  {key: 'XAUUSD', label: 'Gold / US Dollar', exchange: 'COMEX', category: 'USD QU'},
  {key: 'DXY', label: 'US Dollar Index', exchange: 'TVC', category: 'CONFIRMATION'},
  {key: 'USDT.D', label: 'Tether Dominance %', exchange: 'CRYPTOCAP', category: 'CONFIRMATION'},
  {key: 'EURUSD', label: 'Euro / US Dollar', exchange: 'OANDA', category: 'USD QU'},
  {key: 'GBPUSD', label: 'British Pound / US Dollar', exchange: 'OANDA', category: 'USD QU'},
  {key: 'AUDUSD', label: 'Australian Dollar / USD', exchange: 'OANDA', category: 'USD QU'},
  {key: 'NZDUSD', label: 'New Zealand Dollar / USD', exchange: 'OANDA', category: 'USD QU'},
  {key: 'USDCAD', label: 'US Dollar / Canadian Dollar', exchange: 'OANDA', category: 'USD BASE'},
  {key: 'USDJPY', label: 'US Dollar / Yen', exchange: 'OANDA', category: 'USD BASE'},
  {key: 'USDCHF', label: 'US Dollar / Swiss Franc', exchange: 'OANDA', category: 'USD BASE'},
  {key: 'BTCUSDT', label: 'Bitcoin / TetherUS', exchange: 'BINANCE', category: 'CRYPTO'},
  {key: 'NAS100', label: 'Nasdaq 100 Futures', exchange: 'CME', category: 'INDICES'},
];

export const TIMEFRAMES: {key: TimeframeKey; label: string; tvLabel: string; longLabel: string; section: 'MINUTES' | 'HOURS' | 'DAYS'}[] = [
  {key: '15m', label: '15m', tvLabel: '15m', longLabel: '15 minutes', section: 'MINUTES'},
  {key: '30m', label: '30m', tvLabel: '30m', longLabel: '30 minutes', section: 'MINUTES'},
  {key: '1h', label: '1h', tvLabel: '1h', longLabel: '1 hour', section: 'HOURS'},
  {key: '4h', label: '4h', tvLabel: '4h', longLabel: '4 hours', section: 'HOURS'},
  {key: '1d', label: 'D', tvLabel: 'D', longLabel: '1 day', section: 'DAYS'},
  {key: '1wk', label: 'W', tvLabel: 'W', longLabel: '1 week', section: 'DAYS'},
  {key: '1mo', label: 'M', tvLabel: 'M', longLabel: '1 month', section: 'DAYS'},
  {key: '5m', label: '5m', tvLabel: '5m', longLabel: '5 minutes', section: 'MINUTES'},
];

export const SPEEDS = [
  {label: '0.5x', ms: 1400},
  {label: '1x', ms: 800},
  {label: '2x', ms: 420},
  {label: '5x', ms: 180},
  {label: '10x', ms: 80},
];

// Matches the 10-icon floating favorites toolbar visible in Screenshots 1–9
export const DEFAULT_FAVORITE_TOOLS: DrawingToolId[] = [
  'hline',
  'hray',
  'rect',
  'channel',
  'trendline',
  'fib',
  'fibext',
  'text',
  'shortpos',
  'longpos',
];

export function computeEMA(candles: CandleBar[], period: number): {time: UTCTimestamp; value: number}[] {
  if (candles.length === 0) return [];
  const k = 2 / (period + 1);
  let ema = candles[0].close;
  const out: {time: UTCTimestamp; value: number}[] = [];
  for (let i = 0; i < candles.length; i++) {
    ema = i === 0 ? candles[i].close : candles[i].close * k + ema * (1 - k);
    out.push({time: candles[i].time as UTCTimestamp, value: ema});
  }
  return out;
}

export function computeSMA(candles: CandleBar[], period: number): {time: UTCTimestamp; value: number}[] {
  const out: {time: UTCTimestamp; value: number}[] = [];
  let sum = 0;
  for (let i = 0; i < candles.length; i++) {
    sum += candles[i].close;
    if (i >= period) sum -= candles[i - period].close;
    if (i >= period - 1) {
      out.push({time: candles[i].time as UTCTimestamp, value: sum / period});
    }
  }
  return out;
}

export function computeBollinger(
  candles: CandleBar[],
  period = 20,
  mult = 2,
): {
  upper: {time: UTCTimestamp; value: number}[];
  lower: {time: UTCTimestamp; value: number}[];
} {
  const upper: {time: UTCTimestamp; value: number}[] = [];
  const lower: {time: UTCTimestamp; value: number}[] = [];
  for (let i = period - 1; i < candles.length; i++) {
    let sum = 0;
    for (let j = i - period + 1; j <= i; j++) sum += candles[j].close;
    const mean = sum / period;
    let sq = 0;
    for (let j = i - period + 1; j <= i; j++) sq += (candles[j].close - mean) ** 2;
    const sd = Math.sqrt(sq / period);
    const t = candles[i].time as UTCTimestamp;
    upper.push({time: t, value: mean + mult * sd});
    lower.push({time: t, value: mean - mult * sd});
  }
  return {upper, lower};
}

export function computeRSI(candles: CandleBar[], period = 14): {time: UTCTimestamp; value: number}[] {
  if (candles.length <= period) return [];
  const out: {time: UTCTimestamp; value: number}[] = [];
  let gainSum = 0;
  let lossSum = 0;
  for (let i = 1; i <= period; i++) {
    const diff = candles[i].close - candles[i - 1].close;
    if (diff >= 0) gainSum += diff;
    else lossSum += Math.abs(diff);
  }
  let avgGain = gainSum / period;
  let avgLoss = lossSum / period;
  const rs0 = avgLoss === 0 ? 100 : avgGain / avgLoss;
  out.push({
    time: candles[period].time as UTCTimestamp,
    value: avgLoss === 0 ? 100 : 100 - 100 / (1 + rs0),
  });

  for (let i = period + 1; i < candles.length; i++) {
    const diff = candles[i].close - candles[i - 1].close;
    const g = diff > 0 ? diff : 0;
    const l = diff < 0 ? Math.abs(diff) : 0;
    avgGain = (avgGain * (period - 1) + g) / period;
    avgLoss = (avgLoss * (period - 1) + l) / period;
    const rsi = avgLoss === 0 ? 100 : 100 - 100 / (1 + avgGain / avgLoss);
    out.push({time: candles[i].time as UTCTimestamp, value: rsi});
  }
  return out;
}

export function getDollarPerPointPerLot(symbol: string, currentPrice: number): number {
  switch (symbol) {
    case 'XAUUSD':
      return 100;
    case 'USDJPY':
      return currentPrice > 0 ? 100_000 / currentPrice : 650;
    case 'NAS100':
      return 20;
    case 'BTCUSD':
    case 'BTCUSDT':
      return 1;
    default:
      return 100_000;
  }
}

export function calcPnl(
  symbol: string,
  side: 'BUY' | 'SELL',
  lots: number,
  entry: number,
  exit: number,
): number {
  const diff = side === 'BUY' ? exit - entry : entry - exit;
  const perPoint = getDollarPerPointPerLot(symbol, exit);
  return Number((diff * lots * perPoint).toFixed(2));
}

export function calcPips(
  symbol: string,
  pipSize: number,
  side: 'BUY' | 'SELL',
  entry: number,
  exit: number,
): number {
  const diff = side === 'BUY' ? exit - entry : entry - exit;
  const divisor = symbol === 'XAUUSD' ? 0.1 : pipSize || 0.0001;
  return Number((diff / divisor).toFixed(1));
}

export function formatBarTimestamp(unixSec: number): string {
  const d = new Date(unixSec * 1000);
  const weekday = d.toLocaleString('en-US', {weekday: 'short', timeZone: 'UTC'});
  const day = String(d.getUTCDate()).padStart(2, '0');
  const month = d.toLocaleString('en-US', {month: 'short', timeZone: 'UTC'});
  const yr = String(d.getUTCFullYear()).slice(-2);
  const hh = String(d.getUTCHours()).padStart(2, '0');
  const mm = String(d.getUTCMinutes()).padStart(2, '0');
  return `${weekday} ${day} ${month} '${yr} ${hh}:${mm}`;
}

export function formatSimPrice(price: number, decimals: number): string {
  if (!Number.isFinite(price)) return '0.000';
  return price.toLocaleString('en-US', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  });
}

export function findNearestCandleIndex(candles: CandleBar[], targetTime: number): number {
  if (candles.length === 0) return -1;
  let lo = 0;
  let hi = candles.length - 1;
  while (lo < hi) {
    const mid = (lo + hi) >> 1;
    if (candles[mid].time < targetTime) lo = mid + 1;
    else hi = mid;
  }
  if (
    lo > 0 &&
    Math.abs(candles[lo - 1].time - targetTime) < Math.abs(candles[lo].time - targetTime)
  ) {
    return lo - 1;
  }
  return lo;
}
