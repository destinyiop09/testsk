import {useCallback, useEffect, useMemo, useRef, useState} from 'react';
import {
  AreaSeries,
  BarSeries,
  CandlestickSeries,
  ColorType,
  CrosshairMode,
  HistogramSeries,
  LineSeries,
  LineStyle,
  createChart,
  createSeriesMarkers,
} from 'lightweight-charts';
import type {
  IChartApi,
  IPriceLine,
  ISeriesApi,
  ISeriesMarkersPluginApi,
  SeriesMarker,
  SeriesType,
  Time,
  UTCTimestamp,
} from 'lightweight-charts';
import {
  Bell,
  Calendar,
  Camera,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Clock,
  Eye,
  EyeOff,
  Flag,
  GripVertical,
  HelpCircle,
  Layers,
  List,
  Lock,
  Magnet,
  Maximize2,
  Minimize2,
  MoreHorizontal,
  PaintBucket,
  Pause,
  Pencil,
  Play,
  Plus,
  Redo2,
  RefreshCw,
  Rewind,
  RotateCcw,
  Ruler,
  Save,
  Scissors,
  Search,
  Settings,
  SkipForward,
  SlidersHorizontal,
  Sparkles,
  Square,
  Star,
  Target,
  Trash2,
  TrendingUp,
  Undo2,
  Unlock,
  X,
  ZoomIn,
  ZoomOut,
} from 'lucide-react';
import type {PublicUser} from '../types';
import {apiFetch} from '../lib/apiClient';
import {DrawingOverlay} from './tv/DrawingOverlay';
import {SymbolBadge, TvToolSvg} from './tv/TvIcons';
import {
  DEFAULT_FAVORITE_TOOLS,
  DRAWING_CATALOG,
  SPEEDS,
  SYMBOLS,
  TIMEFRAMES,
  WATCHLIST_GROUPS,
  calcPips,
  calcPnl,
  computeBollinger,
  computeEMA,
  computeRSI,
  computeSMA,
  findNearestCandleIndex,
  formatBarTimestamp,
  formatSimPrice,
  type CandleBar,
  type CandlePaletteKey,
  type ChartDrawing,
  type ChartPoint,
  type ChartStyleKey,
  type DrawingToolId,
  type MarketPayload,
  type PriceAlert,
  type QuoteItem,
  type SimClosedTrade,
  type SimPosition,
  type TimeframeKey,
  type ToolCatalogGroup,
} from './tv/types';

interface TradingViewSimulatorProps {
  user: PublicUser;
  isDark: boolean;
}

const LAYOUT_STORAGE_KEY = 'skfx_tv_workspace_v3';

type FlyoutMenu = 'lines' | 'fib' | 'patterns' | 'projection' | null;
type RightDockTab = 'watchlist' | 'alerts' | 'objects' | 'order' | null;

export function TradingViewSimulator({user, isDark}: TradingViewSimulatorProps) {
  const rootRef = useRef<HTMLDivElement>(null);

  // Market & Timeframe State — defaults to XAUUSD Daily (2024–2026 real data)
  const [symbol, setSymbol] = useState('XAUUSD');
  const [timeframe, setTimeframe] = useState<TimeframeKey>('1d');
  const [pinnedTimeframes, setPinnedTimeframes] = useState<TimeframeKey[]>([
    '15m',
    '30m',
    '1h',
    '4h',
    '1d',
    '1wk',
    '1mo',
    '5m',
  ]);
  const [marketData, setMarketData] = useState<MarketPayload | null>(null);
  const [quotes, setQuotes] = useState<QuoteItem[]>([]);
  const [loadingChart, setLoadingChart] = useState(true);
  const [feedError, setFeedError] = useState('');

  // Chart Visual Config (matches TradingView screenshots)
  const [chartStyle, setChartStyle] = useState<ChartStyleKey>('candles');
  const [candlePalette, setCandlePalette] = useState<CandlePaletteKey>('tv_blue_black');
  const [showGrid, setShowGrid] = useState(true);
  const [showWatermark, setShowWatermark] = useState(true);
  const [isFullscreen, setIsFullscreen] = useState(false);

  // Indicators
  const [showEma20, setShowEma20] = useState(false);
  const [showEma50, setShowEma50] = useState(false);
  const [showEma200, setShowEma200] = useState(false);
  const [showSma50, setShowSma50] = useState(false);
  const [showBollinger, setShowBollinger] = useState(false);
  const [showVolume, setShowVolume] = useState(false);
  const [showRsi, setShowRsi] = useState(false);

  // Top Bar Popovers & Modals
  const [symbolMenuOpen, setSymbolMenuOpen] = useState(false);
  const [symbolSearch, setSymbolSearch] = useState('');
  const [tfMenuOpen, setTfMenuOpen] = useState(false);
  const [tfOpenSections, setTfOpenSections] = useState<Record<string, boolean>>({
    MINUTES: true,
    HOURS: true,
    DAYS: true,
  });
  const [chartStyleMenuOpen, setChartStyleMenuOpen] = useState(false);
  const [indicatorsMenuOpen, setIndicatorsMenuOpen] = useState(false);
  const [alertMenuOpen, setAlertMenuOpen] = useState(false);
  const [settingsMenuOpen, setSettingsMenuOpen] = useState(false);
  const [upgradeModalOpen, setUpgradeModalOpen] = useState(false);
  const [goToDateOpen, setGoToDateOpen] = useState(false);
  const [goToDateValue, setGoToDateValue] = useState('2025-01-15');

  // Left Drawing Rail + Flyouts
  const [activeTool, setActiveTool] = useState<DrawingToolId>('crosshair');
  const [openFlyout, setOpenFlyout] = useState<FlyoutMenu>(null);
  const [favoriteTools, setFavoriteTools] = useState<DrawingToolId[]>(DEFAULT_FAVORITE_TOOLS);
  const [showFavoritesBar, setShowFavoritesBar] = useState(true);
  const [stayInDrawingMode, setStayInDrawingMode] = useState(false);
  const [magnetEnabled, setMagnetEnabled] = useState(false);
  const [lockedAll, setLockedAll] = useState(false);
  const [hideAllDrawings, setHideAllDrawings] = useState(false);

  // Drawing Objects & Undo/Redo
  const [drawings, setDrawings] = useState<ChartDrawing[]>([]);
  const [redoStack, setRedoStack] = useState<ChartDrawing[][]>([]);
  const [undoStack, setUndoStack] = useState<ChartDrawing[][]>([]);
  const [draftPoints, setDraftPoints] = useState<ChartPoint[]>([]);
  const [cursorPoint, setCursorPoint] = useState<ChartPoint | null>(null);
  const [selectedDrawingId, setSelectedDrawingId] = useState<string | null>(null);
  const [isBrushDown, setIsBrushDown] = useState(false);

  // Selected Drawing Dragging & Settings Modal (Screenshots 7 & 8)
  const [draggingHandle, setDraggingHandle] = useState<{
    drawingId: string;
    handle: 'tp' | 'sl' | 'entry' | 'end';
  } | null>(null);
  const [propModalDrawingId, setPropModalDrawingId] = useState<string | null>(null);
  const [propTab, setPropTab] = useState<'Inputs' | 'Style' | 'Visibility'>('Inputs');
  const [propDraft, setPropDraft] = useState<{
    riskPercent: string;
    entryPrice: string;
    leverage: string;
    profitPrice: string;
    profitTicks: string;
    stopPrice: string;
    stopTicks: string;
    qtyPrecision: 'Default' | '0.01' | '0.1' | '1';
    fillColor: string;
    visible: boolean;
    locked: boolean;
  } | null>(null);

  // Pending Text Annotation Prompt
  const [pendingTextPoint, setPendingTextPoint] = useState<ChartPoint | null>(null);
  const [pendingTextValue, setPendingTextValue] = useState('');

  // Alerts
  const [alerts, setAlerts] = useState<PriceAlert[]>([]);
  const [newAlertPrice, setNewAlertPrice] = useState('');
  const [newAlertCondition, setNewAlertCondition] = useState<PriceAlert['condition']>('CROSSING');
  const [newAlertNote, setNewAlertNote] = useState('');

  // Bar Replay State
  const [replayIndex, setReplayIndex] = useState<number>(0);
  const [isReplayMode, setIsReplayMode] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [speedIdx, setSpeedIdx] = useState(1);
  const [selectingCutBar, setSelectingCutBar] = useState(false);

  // Crosshair & Canvas Geometry
  const [hoveredBar, setHoveredBar] = useState<CandleBar | null>(null);
  const [chartSize, setChartSize] = useState({width: 0, height: 0});
  const [overlayTick, setOverlayTick] = useState(0);
  const [utcNow, setUtcNow] = useState(() => new Date().toISOString().slice(11, 19));

  // Right Dock, Categorized Watchlist & Bottom Trade Panel (Screenshot 9)
  const [rightDock, setRightDock] = useState<RightDockTab>('watchlist');
  const [collapsedWatchlistGroups, setCollapsedWatchlistGroups] = useState<Record<string, boolean>>({});
  const [flaggedSymbols, setFlaggedSymbols] = useState<Record<string, boolean>>({
    'USDT.D': true,
    EURUSD: true,
    GBPUSD: true,
    AUDUSD: true,
    XAUUSD: true,
    USDCAD: true,
    USDJPY: true,
    BTCUSDT: true,
  });
  const [tradePanelOpen, setTradePanelOpen] = useState(false);
  const [bottomTab, setBottomTab] = useState<'positions' | 'orders' | 'history'>('positions');
  const [activeRangeBtn, setActiveRangeBtn] = useState<string>('All');
  const [layoutSavedAt, setLayoutSavedAt] = useState<string | null>(null);

  // Paper Trading Simulator Account
  const startingBalance = Math.max(1000, user.accountBalance || 10000);
  const [balance, setBalance] = useState<number>(startingBalance);
  const [positions, setPositions] = useState<SimPosition[]>([]);
  const [closedTrades, setClosedTrades] = useState<SimClosedTrade[]>([]);
  const [simNotice, setSimNotice] = useState<string | null>(null);

  // Order Ticket Inputs
  const [orderSide, setOrderSide] = useState<'BUY' | 'SELL'>('BUY');
  const [orderType, setOrderType] = useState<'MARKET' | 'LIMIT'>('MARKET');
  const [lotsInput, setLotsInput] = useState('0.10');
  const [limitPriceInput, setLimitPriceInput] = useState('');
  const [slInput, setSlInput] = useState('');
  const [tpInput, setTpInput] = useState('');

  // Chart API Refs
  const chartContainerRef = useRef<HTMLDivElement>(null);
  const rsiContainerRef = useRef<HTMLDivElement>(null);
  const chartApiRef = useRef<IChartApi | null>(null);
  const rsiChartApiRef = useRef<IChartApi | null>(null);
  const mainSeriesRef = useRef<ISeriesApi<SeriesType> | null>(null);
  const volumeSeriesRef = useRef<ISeriesApi<'Histogram'> | null>(null);
  const ema20SeriesRef = useRef<ISeriesApi<'Line'> | null>(null);
  const ema50SeriesRef = useRef<ISeriesApi<'Line'> | null>(null);
  const ema200SeriesRef = useRef<ISeriesApi<'Line'> | null>(null);
  const sma50SeriesRef = useRef<ISeriesApi<'Line'> | null>(null);
  const bbUpperSeriesRef = useRef<ISeriesApi<'Line'> | null>(null);
  const bbLowerSeriesRef = useRef<ISeriesApi<'Line'> | null>(null);
  const rsiSeriesRef = useRef<ISeriesApi<'Line'> | null>(null);
  const markersPluginRef = useRef<ISeriesMarkersPluginApi<Time> | null>(null);
  const priceLinesRef = useRef<IPriceLine[]>([]);

  // Mutable Refs for event listeners
  const allCandlesRef = useRef<CandleBar[]>([]);
  const visibleCandlesRef = useRef<CandleBar[]>([]);
  const replayIndexRef = useRef<number>(0);
  const positionsRef = useRef<SimPosition[]>([]);
  const alertsRef = useRef<PriceAlert[]>([]);
  const activeToolRef = useRef<DrawingToolId>('crosshair');
  const stayInDrawingModeRef = useRef(false);
  const selectingCutBarRef = useRef(false);
  const magnetRef = useRef(false);
  const lockedAllRef = useRef(false);
  const draftPointsRef = useRef<ChartPoint[]>([]);
  const symbolRef = useRef('XAUUSD');
  const decimalsRef = useRef(3);
  const pipSizeRef = useRef(0.1);

  const showNotice = useCallback((msg: string) => {
    setSimNotice(msg);
  }, []);

  useEffect(() => {
    if (!simNotice) return;
    const t = setTimeout(() => setSimNotice(null), 3800);
    return () => clearTimeout(t);
  }, [simNotice]);

  // Live UTC Clock (bottom right matching Screenshots 1–9)
  useEffect(() => {
    const id = setInterval(() => {
      setUtcNow(new Date().toISOString().slice(11, 19));
    }, 1000);
    return () => clearInterval(id);
  }, []);

  // Load saved TradingView layout from localStorage once on mount
  useEffect(() => {
    try {
      const raw = localStorage.getItem(LAYOUT_STORAGE_KEY);
      if (!raw) return;
      const saved = JSON.parse(raw) as {
        drawings?: ChartDrawing[];
        alerts?: PriceAlert[];
        favoriteTools?: DrawingToolId[];
        pinnedTimeframes?: TimeframeKey[];
        candlePalette?: CandlePaletteKey;
        showGrid?: boolean;
        showWatermark?: boolean;
        showEma20?: boolean;
        showEma50?: boolean;
        showEma200?: boolean;
        showSma50?: boolean;
        showBollinger?: boolean;
        showVolume?: boolean;
        showRsi?: boolean;
      };
      if (Array.isArray(saved.drawings)) setDrawings(saved.drawings);
      if (Array.isArray(saved.alerts)) setAlerts(saved.alerts);
      if (Array.isArray(saved.favoriteTools) && saved.favoriteTools.length > 0) {
        setFavoriteTools(saved.favoriteTools);
      }
      if (Array.isArray(saved.pinnedTimeframes) && saved.pinnedTimeframes.length > 0) {
        setPinnedTimeframes(saved.pinnedTimeframes);
      }
      if (saved.candlePalette) setCandlePalette(saved.candlePalette);
      if (typeof saved.showGrid === 'boolean') setShowGrid(saved.showGrid);
      if (typeof saved.showWatermark === 'boolean') setShowWatermark(saved.showWatermark);
      if (typeof saved.showEma20 === 'boolean') setShowEma20(saved.showEma20);
      if (typeof saved.showEma50 === 'boolean') setShowEma50(saved.showEma50);
      if (typeof saved.showEma200 === 'boolean') setShowEma200(saved.showEma200);
      if (typeof saved.showSma50 === 'boolean') setShowSma50(saved.showSma50);
      if (typeof saved.showBollinger === 'boolean') setShowBollinger(saved.showBollinger);
      if (typeof saved.showVolume === 'boolean') setShowVolume(saved.showVolume);
      if (typeof saved.showRsi === 'boolean') setShowRsi(saved.showRsi);
    } catch {
      // ignore corrupted storage
    }
  }, []);

  const saveLayout = useCallback(() => {
    try {
      localStorage.setItem(
        LAYOUT_STORAGE_KEY,
        JSON.stringify({
          drawings,
          alerts,
          favoriteTools,
          pinnedTimeframes,
          candlePalette,
          showGrid,
          showWatermark,
          showEma20,
          showEma50,
          showEma200,
          showSma50,
          showBollinger,
          showVolume,
          showRsi,
        }),
      );
      const stamp = new Date().toLocaleTimeString([], {hour: '2-digit', minute: '2-digit'});
      setLayoutSavedAt(stamp);
      showNotice(`Workspace layout saved (${drawings.length} drawings, indicators, alerts).`);
    } catch {
      showNotice('Could not save layout to browser storage.');
    }
  }, [
    alerts,
    candlePalette,
    drawings,
    favoriteTools,
    pinnedTimeframes,
    showBollinger,
    showEma20,
    showEma200,
    showEma50,
    showGrid,
    showRsi,
    showSma50,
    showVolume,
    showWatermark,
    showNotice,
  ]);

  // Drawing Mutation Helpers (with Undo/Redo)
  const commitDrawings = useCallback((updater: (prev: ChartDrawing[]) => ChartDrawing[]) => {
    setDrawings((prev) => {
      const next = updater(prev);
      setUndoStack((u) => [...u.slice(-24), prev]);
      setRedoStack([]);
      return next;
    });
  }, []);

  const handleUndo = useCallback(() => {
    setUndoStack((u) => {
      if (u.length === 0) return u;
      const previous = u[u.length - 1];
      setDrawings((curr) => {
        setRedoStack((r) => [...r.slice(-24), curr]);
        return previous;
      });
      return u.slice(0, -1);
    });
  }, []);

  const handleRedo = useCallback(() => {
    setRedoStack((r) => {
      if (r.length === 0) return r;
      const nextState = r[r.length - 1];
      setDrawings((curr) => {
        setUndoStack((u) => [...u.slice(-24), curr]);
        return nextState;
      });
      return r.slice(0, -1);
    });
  }, []);

  // Load real OHLCV candles from server proxy
  const loadMarketData = useCallback(async (targetSymbol: string, targetTf: TimeframeKey) => {
    setLoadingChart(true);
    setFeedError('');
    setIsPlaying(false);
    try {
      const res = await apiFetch(
        `/api/market/candles?symbol=${encodeURIComponent(targetSymbol)}&interval=${encodeURIComponent(targetTf)}`,
      );
      if (!res.ok) throw new Error('Failed to load market candles');
      const data = (await res.json()) as MarketPayload;
      setMarketData(data);
      allCandlesRef.current = data.candles;
      decimalsRef.current = data.decimals;
      pipSizeRef.current = data.pipSize;
      setReplayIndex(Math.max(0, data.candles.length - 1));
      setIsReplayMode(false);
      setSelectingCutBar(false);
      setActiveRangeBtn('All');

      const latest = data.candles[data.candles.length - 1];
      if (latest) {
        setLimitPriceInput(latest.close.toFixed(data.decimals));
        setNewAlertPrice(latest.close.toFixed(data.decimals));
        const slOffset =
          data.pipSize *
          (targetSymbol === 'XAUUSD'
            ? 120
            : targetSymbol === 'NAS100'
              ? 180
              : targetSymbol === 'BTCUSD' || targetSymbol === 'BTCUSDT'
                ? 1200
                : 35);
        setSlInput((latest.close - slOffset).toFixed(data.decimals));
        setTpInput((latest.close + slOffset * 3).toFixed(data.decimals));
      }
    } catch {
      setFeedError('Could not load market data feed.');
    } finally {
      setLoadingChart(false);
    }
  }, []);

  useEffect(() => {
    loadMarketData(symbol, timeframe);
  }, [symbol, timeframe, loadMarketData]);

  // Load Watchlist quotes
  useEffect(() => {
    let cancelled = false;
    apiFetch('/api/market/quotes')
      .then((r) => (r.ok ? r.json() : null))
      .then((d: {quotes?: QuoteItem[]} | null) => {
        if (!cancelled && d?.quotes) setQuotes(d.quotes);
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, []);

  const allCandles = marketData?.candles ?? [];
  const decimals = marketData?.decimals ?? 3;
  const pipSize = marketData?.pipSize ?? 0.1;

  const visibleCandles = useMemo(() => {
    if (allCandles.length === 0) return [];
    if (selectingCutBar) return allCandles;
    const clampedIdx = Math.min(Math.max(0, replayIndex), allCandles.length - 1);
    return allCandles.slice(0, clampedIdx + 1);
  }, [allCandles, replayIndex, selectingCutBar]);

  const currentBar = visibleCandles[visibleCandles.length - 1] ?? null;
  const displayBar = hoveredBar || currentBar;
  const hiddenFutureCount = Math.max(0, allCandles.length - 1 - replayIndex);

  useEffect(() => {
    visibleCandlesRef.current = visibleCandles;
    activeToolRef.current = activeTool;
    stayInDrawingModeRef.current = stayInDrawingMode;
    selectingCutBarRef.current = selectingCutBar;
    magnetRef.current = magnetEnabled;
    lockedAllRef.current = lockedAll;
    draftPointsRef.current = draftPoints;
    symbolRef.current = symbol;
    replayIndexRef.current = replayIndex;
    positionsRef.current = positions;
    alertsRef.current = alerts;
  }, [
    visibleCandles,
    activeTool,
    stayInDrawingMode,
    selectingCutBar,
    magnetEnabled,
    lockedAll,
    draftPoints,
    symbol,
    replayIndex,
    positions,
    alerts,
  ]);

  // Evaluate Pending Limits, SL/TP, and Price Alerts on new replay bar
  const evaluateBarExecutions = useCallback(
    (bar: CandleBar, activeSym: string, activePipSize: number) => {
      const currentAlerts = alertsRef.current;
      let alertsChanged = false;
      const updatedAlerts = currentAlerts.map((al) => {
        if (al.symbol !== activeSym || al.triggered) return al;
        const crossed = bar.low <= al.price && bar.high >= al.price;
        if (crossed) {
          alertsChanged = true;
          showNotice(
            `Alert Triggered: ${al.symbol} hit ${al.price.toFixed(decimalsRef.current)} ${al.note ? `(${al.note})` : ''}`,
          );
          return {...al, triggered: true};
        }
        return al;
      });
      if (alertsChanged) {
        alertsRef.current = updatedAlerts;
        setAlerts(updatedAlerts);
      }

      const prevPositions = positionsRef.current;
      if (prevPositions.length === 0) return;

      let realizedDelta = 0;
      const newlyClosed: SimClosedTrade[] = [];
      const remaining: SimPosition[] = [];
      let changed = false;

      for (const pos of prevPositions) {
        if (pos.symbol !== activeSym) {
          remaining.push(pos);
          continue;
        }
        let workingPos = pos;
        if (workingPos.status === 'PENDING') {
          if (bar.low <= workingPos.entryPrice && bar.high >= workingPos.entryPrice) {
            workingPos = {...workingPos, status: 'OPEN', entryTime: bar.time};
            changed = true;
            showNotice(
              `Limit Filled: ${workingPos.side} ${workingPos.lots} ${workingPos.symbol} @ ${workingPos.entryPrice.toFixed(decimalsRef.current)}`,
            );
          } else {
            remaining.push(workingPos);
            continue;
          }
        }

        const hitSL =
          workingPos.stopLoss !== null &&
          (workingPos.side === 'BUY'
            ? bar.low <= workingPos.stopLoss
            : bar.high >= workingPos.stopLoss);
        const hitTP =
          workingPos.takeProfit !== null &&
          (workingPos.side === 'BUY'
            ? bar.high >= workingPos.takeProfit
            : bar.low <= workingPos.takeProfit);

        if (hitSL || hitTP) {
          changed = true;
          const exitPrice = hitSL
            ? (workingPos.stopLoss as number)
            : (workingPos.takeProfit as number);
          const reason = hitSL ? 'SL Hit' : 'TP Hit';
          const pnl = calcPnl(workingPos.symbol, workingPos.side, workingPos.lots, workingPos.entryPrice, exitPrice);
          const pips = calcPips(workingPos.symbol, activePipSize, workingPos.side, workingPos.entryPrice, exitPrice);
          realizedDelta += pnl;
          newlyClosed.push({
            id: workingPos.id,
            symbol: workingPos.symbol,
            side: workingPos.side,
            lots: workingPos.lots,
            entryPrice: workingPos.entryPrice,
            exitPrice,
            entryTime: workingPos.entryTime,
            exitTime: bar.time,
            pnl,
            pips,
            reason,
          });
          showNotice(`${reason}: ${workingPos.symbol} ${pnl >= 0 ? '+' : ''}$${pnl.toFixed(2)}`);
        } else {
          remaining.push(workingPos);
        }
      }

      if (changed) {
        positionsRef.current = remaining;
        setPositions(remaining);
      }
      if (newlyClosed.length > 0) {
        setClosedTrades((prev) => [...newlyClosed, ...prev]);
        setBalance((b) => Number((b + realizedDelta).toFixed(2)));
      }
    },
    [showNotice],
  );

  // Bar Replay Navigation
  const stepForward = useCallback(() => {
    const candles = allCandlesRef.current;
    const cur = replayIndexRef.current;
    if (candles.length === 0 || cur >= candles.length - 1) {
      setIsPlaying(false);
      return;
    }
    const nextIdx = cur + 1;
    const nextBar = candles[nextIdx];
    replayIndexRef.current = nextIdx;
    setReplayIndex(nextIdx);
    if (nextBar) {
      evaluateBarExecutions(nextBar, symbolRef.current, pipSizeRef.current);
    }
    if (nextIdx >= candles.length - 1) {
      setIsPlaying(false);
      setIsReplayMode(false);
    }
  }, [evaluateBarExecutions]);

  const stepBackward = useCallback(() => {
    setIsPlaying(false);
    setIsReplayMode(true);
    setReplayIndex((prev) => Math.max(10, prev - 1));
  }, []);

  const jumpBackBars = useCallback(
    (barsBack: number) => {
      if (allCandles.length === 0) return;
      setIsPlaying(false);
      setSelectingCutBar(false);
      setIsReplayMode(true);
      setReplayIndex(Math.max(10, allCandles.length - 1 - barsBack));
    },
    [allCandles.length],
  );

  const jumpToLive = useCallback(() => {
    setIsPlaying(false);
    setSelectingCutBar(false);
    setIsReplayMode(false);
    if (allCandles.length > 0) {
      setReplayIndex(allCandles.length - 1);
    }
  }, [allCandles.length]);

  useEffect(() => {
    if (!isPlaying) return;
    const ms = SPEEDS[speedIdx]?.ms ?? 800;
    const timer = setInterval(stepForward, ms);
    return () => clearInterval(timer);
  }, [isPlaying, speedIdx, stepForward]);

  // Apply Long/Short Position Tool helper
  const populateTicketFromPosition = useCallback(
    (side: 'BUY' | 'SELL', entry: number, sl: number, tp: number) => {
      setOrderSide(side);
      setOrderType('MARKET');
      setLimitPriceInput(entry.toFixed(decimalsRef.current));
      setSlInput(sl.toFixed(decimalsRef.current));
      setTpInput(tp.toFixed(decimalsRef.current));
    },
    [],
  );

  // Snap point to OHLC candle when Magnet is ON
  const resolveChartPoint = useCallback(
    (point: {x: number; y: number}, paramTime?: Time): ChartPoint | null => {
      const series = mainSeriesRef.current;
      const chart = chartApiRef.current;
      const candles = visibleCandlesRef.current;
      if (!series || !chart || candles.length === 0) return null;

      const rawPrice = series.coordinateToPrice(point.y);
      if (rawPrice === null || !Number.isFinite(rawPrice)) return null;
      let price = Number(rawPrice);

      let timeVal: number;
      if (paramTime !== undefined && paramTime !== null) {
        timeVal = Number(paramTime);
      } else {
        const coordTime = chart.timeScale().coordinateToTime(point.x);
        if (coordTime !== null && coordTime !== undefined) {
          timeVal = Number(coordTime);
        } else {
          const logical = chart.timeScale().coordinateToLogical(point.x);
          const idx =
            logical !== null
              ? Math.max(0, Math.min(candles.length - 1, Math.round(logical)))
              : candles.length - 1;
          timeVal = candles[idx].time;
        }
      }

      if (magnetRef.current) {
        const idx = findNearestCandleIndex(candles, timeVal);
        if (idx >= 0) {
          const c = candles[idx];
          timeVal = c.time;
          const candidates = [c.open, c.high, c.low, c.close];
          let closest = candidates[0];
          let minD = Math.abs(price - closest);
          for (const cand of candidates) {
            const d = Math.abs(price - cand);
            if (d < minD) {
              minD = d;
              closest = cand;
            }
          }
          price = closest;
        }
      }

      return {
        time: timeVal,
        price: Number(price.toFixed(decimalsRef.current)),
      };
    },
    [],
  );

  // Build / Rebuild Main Chart Series whenever ChartStyle or Theme or Palette changes
  useEffect(() => {
    const container = chartContainerRef.current;
    if (!container) return;

    const gridColor = showGrid
      ? isDark
        ? 'rgba(42, 46, 57, 0.5)'
        : 'rgba(226, 232, 240, 0.78)'
      : 'transparent';

    const chart = createChart(container, {
      width: container.clientWidth,
      height: container.clientHeight,
      layout: {
        background: {type: ColorType.Solid, color: isDark ? '#131722' : '#FFFFFF'},
        textColor: isDark ? '#B2B5BE' : '#1E293B',
        fontFamily: 'JetBrains Mono, Plus Jakarta Sans, sans-serif',
        fontSize: 11,
      },
      grid: {
        vertLines: {color: gridColor},
        horzLines: {color: gridColor},
      },
      crosshair: {
        mode: CrosshairMode.Normal,
        vertLine: {
          color: isDark ? 'rgba(148, 163, 184, 0.45)' : 'rgba(100, 116, 139, 0.45)',
          style: LineStyle.Dashed,
          labelBackgroundColor: '#131722',
        },
        horzLine: {
          color: isDark ? 'rgba(148, 163, 184, 0.45)' : 'rgba(100, 116, 139, 0.45)',
          style: LineStyle.Dashed,
          labelBackgroundColor: '#131722',
        },
      },
      rightPriceScale: {
        borderColor: isDark ? '#2A2E39' : '#E2E8F0',
        scaleMargins: {top: 0.1, bottom: 0.14},
      },
      timeScale: {
        borderColor: isDark ? '#2A2E39' : '#E2E8F0',
        timeVisible: true,
        secondsVisible: false,
        rightOffset: 10,
      },
      handleScroll: true,
      handleScale: true,
    });

    const bullColor = candlePalette === 'tv_blue_black' ? '#2962FF' : '#089981';
    const bearColor =
      candlePalette === 'tv_blue_black'
        ? isDark
          ? '#CBD5E1'
          : '#131722'
        : '#F23645';

    let mainSeries: ISeriesApi<SeriesType>;
    if (chartStyle === 'line') {
      mainSeries = chart.addSeries(LineSeries, {color: '#2962FF', lineWidth: 2});
    } else if (chartStyle === 'area') {
      mainSeries = chart.addSeries(AreaSeries, {
        lineColor: '#2962FF',
        topColor: 'rgba(41, 98, 255, 0.28)',
        bottomColor: 'rgba(41, 98, 255, 0.02)',
        lineWidth: 2,
      });
    } else if (chartStyle === 'bars') {
      mainSeries = chart.addSeries(BarSeries, {upColor: bullColor, downColor: bearColor});
    } else if (chartStyle === 'hollow') {
      mainSeries = chart.addSeries(CandlestickSeries, {
        upColor: 'transparent',
        downColor: bearColor,
        borderUpColor: bullColor,
        borderDownColor: bearColor,
        wickUpColor: bullColor,
        wickDownColor: bearColor,
      });
    } else {
      mainSeries = chart.addSeries(CandlestickSeries, {
        upColor: bullColor,
        downColor: bearColor,
        borderUpColor: bullColor,
        borderDownColor: bearColor,
        wickUpColor: bullColor,
        wickDownColor: bearColor,
      });
    }

    const volumeSeries = chart.addSeries(HistogramSeries, {
      priceFormat: {type: 'volume'},
      priceScaleId: '',
    });
    volumeSeries.priceScale().applyOptions({scaleMargins: {top: 0.85, bottom: 0}});

    const ema20Series = chart.addSeries(LineSeries, {
      color: '#0EA5E9',
      lineWidth: 1,
      priceLineVisible: false,
      lastValueVisible: false,
    });
    const ema50Series = chart.addSeries(LineSeries, {
      color: '#F59E0B',
      lineWidth: 1,
      priceLineVisible: false,
      lastValueVisible: false,
    });
    const ema200Series = chart.addSeries(LineSeries, {
      color: '#8B5CF6',
      lineWidth: 2,
      priceLineVisible: false,
      lastValueVisible: false,
    });
    const sma50Series = chart.addSeries(LineSeries, {
      color: '#EC4899',
      lineWidth: 1,
      priceLineVisible: false,
      lastValueVisible: false,
    });
    const bbUpperSeries = chart.addSeries(LineSeries, {
      color: 'rgba(41, 98, 255, 0.55)',
      lineWidth: 1,
      lineStyle: LineStyle.Dashed,
      priceLineVisible: false,
      lastValueVisible: false,
    });
    const bbLowerSeries = chart.addSeries(LineSeries, {
      color: 'rgba(41, 98, 255, 0.55)',
      lineWidth: 1,
      lineStyle: LineStyle.Dashed,
      priceLineVisible: false,
      lastValueVisible: false,
    });

    const markersPlugin = createSeriesMarkers(mainSeries, []);

    chartApiRef.current = chart;
    mainSeriesRef.current = mainSeries;
    volumeSeriesRef.current = volumeSeries;
    ema20SeriesRef.current = ema20Series;
    ema50SeriesRef.current = ema50Series;
    ema200SeriesRef.current = ema200Series;
    sma50SeriesRef.current = sma50Series;
    bbUpperSeriesRef.current = bbUpperSeries;
    bbLowerSeriesRef.current = bbLowerSeries;
    markersPluginRef.current = markersPlugin;

    chart.subscribeCrosshairMove((param) => {
      if (!param.time) {
        setHoveredBar(null);
      } else {
        const bar = allCandlesRef.current.find((b) => b.time === Number(param.time));
        setHoveredBar(bar || null);
      }
      if (param.point) {
        const pt = resolveChartPoint(param.point, param.time);
        setCursorPoint(pt);
      } else {
        setCursorPoint(null);
      }
    });

    chart.subscribeClick((param) => {
      const candles = allCandlesRef.current;
      if (candles.length === 0) return;

      if (selectingCutBarRef.current || activeToolRef.current === 'cut') {
        if (param.time) {
          const idx = candles.findIndex((b) => b.time === Number(param.time));
          if (idx >= 5) {
            setReplayIndex(idx);
            setIsReplayMode(idx < candles.length - 1);
            setSelectingCutBar(false);
            setActiveTool('crosshair');
            setIsPlaying(false);
            showNotice(`Rewound chart to ${formatBarTimestamp(candles[idx].time)}`);
          }
        }
        return;
      }

      const tool = activeToolRef.current;
      if (tool === 'crosshair' || tool === 'brush') {
        setSelectedDrawingId(null);
        return;
      }
      if (lockedAllRef.current) {
        showNotice('Drawings are locked. Unlock in the left toolbar to add or edit objects.');
        return;
      }
      if (!param.point) return;
      const pt = resolveChartPoint(param.point, param.time);
      if (!pt) return;

      const meta = DRAWING_CATALOG.find((c) => c.id === tool);
      const reqPts = meta?.requiredPoints ?? 2;

      if (tool === 'text') {
        setPendingTextPoint(pt);
        setPendingTextValue('');
        return;
      }

      if (reqPts === 1) {
        const newDrawing: ChartDrawing = {
          id: `drw_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
          tool,
          symbol: symbolRef.current,
          points: [pt],
          color: '#2962FF',
          visible: true,
          locked: false,
          createdAt: Date.now(),
        };
        commitDrawings((prev) => [...prev, newDrawing]);
        setSelectedDrawingId(newDrawing.id);
        if (!stayInDrawingModeRef.current) setActiveTool('crosshair');
        return;
      }

      const nextDraft = [...draftPointsRef.current, pt];
      if (nextDraft.length >= reqPts) {
        const isPosTool = tool === 'longpos' || tool === 'shortpos';
        const entry = nextDraft[0].price;
        const sl = nextDraft[1].price;
        const dist = Math.max(pipSizeRef.current * 4, Math.abs(entry - sl));
        const tp = tool === 'longpos' ? entry + dist * 2.17 : entry - dist * 2.17;

        const newDrawing: ChartDrawing = {
          id: `drw_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
          tool,
          symbol: symbolRef.current,
          points: nextDraft,
          color: '#2962FF',
          fillColor: '#2962FF',
          visible: true,
          locked: false,
          createdAt: Date.now(),
          ...(isPosTool
            ? {
                riskPercent: 7.5,
                leverage: 10000,
                stopPrice: Number(sl.toFixed(decimalsRef.current)),
                targetPrice: Number(tp.toFixed(decimalsRef.current)),
                qtyPrecision: 'Default' as const,
              }
            : {}),
        };
        commitDrawings((prev) => [...prev, newDrawing]);
        setSelectedDrawingId(newDrawing.id);
        setDraftPoints([]);
        if (!stayInDrawingModeRef.current) setActiveTool('crosshair');

        if (isPosTool) {
          populateTicketFromPosition(tool === 'longpos' ? 'BUY' : 'SELL', entry, sl, tp);
        }
      } else {
        setDraftPoints(nextDraft);
      }
    });

    chart.timeScale().subscribeVisibleLogicalRangeChange(() => {
      setOverlayTick((t) => t + 1);
      if (rsiChartApiRef.current) {
        const lr = chart.timeScale().getVisibleLogicalRange();
        if (lr) {
          rsiChartApiRef.current.timeScale().setVisibleLogicalRange(lr);
        }
      }
    });

    const ro = new ResizeObserver((entries) => {
      for (const entry of entries) {
        const {width, height} = entry.contentRect;
        if (width > 0 && height > 0) {
          chart.applyOptions({width, height});
          setChartSize({width, height});
          setOverlayTick((t) => t + 1);
        }
      }
    });
    ro.observe(container);
    setChartSize({width: container.clientWidth, height: container.clientHeight});

    return () => {
      ro.disconnect();
      chart.remove();
      chartApiRef.current = null;
      mainSeriesRef.current = null;
      volumeSeriesRef.current = null;
      ema20SeriesRef.current = null;
      ema50SeriesRef.current = null;
      ema200SeriesRef.current = null;
      sma50SeriesRef.current = null;
      bbUpperSeriesRef.current = null;
      bbLowerSeriesRef.current = null;
      markersPluginRef.current = null;
    };
  }, [
    chartStyle,
    candlePalette,
    isDark,
    showGrid,
    resolveChartPoint,
    commitDrawings,
    populateTicketFromPosition,
    showNotice,
  ]);

  // Optional Lower RSI(14) Pane
  useEffect(() => {
    const rsiContainer = rsiContainerRef.current;
    if (!showRsi || !rsiContainer) {
      rsiChartApiRef.current = null;
      rsiSeriesRef.current = null;
      return;
    }

    const rsiChart = createChart(rsiContainer, {
      width: rsiContainer.clientWidth,
      height: rsiContainer.clientHeight,
      layout: {
        background: {type: ColorType.Solid, color: isDark ? '#131722' : '#FFFFFF'},
        textColor: isDark ? '#B2B5BE' : '#475569',
        fontFamily: 'JetBrains Mono, sans-serif',
        fontSize: 10,
      },
      grid: {
        vertLines: {
          color: showGrid ? (isDark ? 'rgba(42,46,57,0.4)' : 'rgba(226,232,240,0.7)') : 'transparent',
        },
        horzLines: {
          color: showGrid ? (isDark ? 'rgba(42,46,57,0.4)' : 'rgba(226,232,240,0.7)') : 'transparent',
        },
      },
      rightPriceScale: {
        borderColor: isDark ? '#2A2E39' : '#E2E8F0',
        scaleMargins: {top: 0.1, bottom: 0.1},
      },
      timeScale: {
        borderColor: isDark ? '#2A2E39' : '#E2E8F0',
        visible: false,
        rightOffset: 10,
      },
    });

    const rsiLine = rsiChart.addSeries(LineSeries, {
      color: '#7E57C2',
      lineWidth: 2,
      priceFormat: {type: 'price', precision: 1, minMove: 0.1},
    });
    rsiLine.createPriceLine({
      price: 70,
      color: 'rgba(242, 54, 69, 0.5)',
      lineWidth: 1,
      lineStyle: LineStyle.Dashed,
      axisLabelVisible: true,
      title: 'OB',
    });
    rsiLine.createPriceLine({
      price: 30,
      color: 'rgba(8, 153, 129, 0.5)',
      lineWidth: 1,
      lineStyle: LineStyle.Dashed,
      axisLabelVisible: true,
      title: 'OS',
    });

    rsiChartApiRef.current = rsiChart;
    rsiSeriesRef.current = rsiLine;

    const ro = new ResizeObserver((entries) => {
      for (const entry of entries) {
        const {width, height} = entry.contentRect;
        if (width > 0 && height > 0) rsiChart.applyOptions({width, height});
      }
    });
    ro.observe(rsiContainer);

    return () => {
      ro.disconnect();
      rsiChart.remove();
      rsiChartApiRef.current = null;
      rsiSeriesRef.current = null;
    };
  }, [showRsi, isDark, showGrid]);

  // Sync OHLCV + Indicators + RSI data
  useEffect(() => {
    const mainSeries = mainSeriesRef.current;
    const volumeSeries = volumeSeriesRef.current;
    const ema20Series = ema20SeriesRef.current;
    const ema50Series = ema50SeriesRef.current;
    const ema200Series = ema200SeriesRef.current;
    const sma50Series = sma50SeriesRef.current;
    const bbUpper = bbUpperSeriesRef.current;
    const bbLower = bbLowerSeriesRef.current;
    if (
      !mainSeries ||
      !volumeSeries ||
      !ema20Series ||
      !ema50Series ||
      !ema200Series ||
      !sma50Series ||
      !bbUpper ||
      !bbLower
    ) {
      return;
    }

    mainSeries.applyOptions({
      priceFormat: {
        type: 'price',
        precision: decimals,
        minMove: 1 / 10 ** decimals,
      },
    });

    if (visibleCandles.length === 0) {
      mainSeries.setData([]);
      volumeSeries.setData([]);
      ema20Series.setData([]);
      ema50Series.setData([]);
      ema200Series.setData([]);
      sma50Series.setData([]);
      bbUpper.setData([]);
      bbLower.setData([]);
      rsiSeriesRef.current?.setData([]);
      return;
    }

    if (chartStyle === 'line' || chartStyle === 'area') {
      mainSeries.setData(
        visibleCandles.map((b) => ({
          time: b.time as UTCTimestamp,
          value: b.close,
        })),
      );
    } else {
      mainSeries.setData(
        visibleCandles.map((b) => ({
          time: b.time as UTCTimestamp,
          open: b.open,
          high: b.high,
          low: b.low,
          close: b.close,
        })),
      );
    }

    volumeSeries.setData(
      showVolume
        ? visibleCandles.map((b) => ({
            time: b.time as UTCTimestamp,
            value: b.volume,
            color:
              b.close >= b.open
                ? candlePalette === 'tv_blue_black'
                  ? 'rgba(41, 98, 255, 0.25)'
                  : 'rgba(8, 153, 129, 0.35)'
                : candlePalette === 'tv_blue_black'
                  ? 'rgba(100, 116, 139, 0.25)'
                  : 'rgba(242, 54, 69, 0.35)',
          }))
        : [],
    );

    ema20Series.setData(showEma20 ? computeEMA(visibleCandles, 20) : []);
    ema50Series.setData(showEma50 ? computeEMA(visibleCandles, 50) : []);
    ema200Series.setData(showEma200 ? computeEMA(visibleCandles, 200) : []);
    sma50Series.setData(showSma50 ? computeSMA(visibleCandles, 50) : []);
    if (showBollinger) {
      const bb = computeBollinger(visibleCandles, 20, 2);
      bbUpper.setData(bb.upper);
      bbLower.setData(bb.lower);
    } else {
      bbUpper.setData([]);
      bbLower.setData([]);
    }

    if (showRsi && rsiSeriesRef.current) {
      rsiSeriesRef.current.setData(computeRSI(visibleCandles, 14));
      const mainLr = chartApiRef.current?.timeScale().getVisibleLogicalRange();
      if (mainLr && rsiChartApiRef.current) {
        rsiChartApiRef.current.timeScale().setVisibleLogicalRange(mainLr);
      }
    }

    setOverlayTick((t) => t + 1);
  }, [
    visibleCandles,
    decimals,
    chartStyle,
    candlePalette,
    showVolume,
    showEma20,
    showEma50,
    showEma200,
    showSma50,
    showBollinger,
    showRsi,
  ]);

  // Fit content cleanly after data loads or symbol/timeframe changes
  useEffect(() => {
    if (!loadingChart && chartApiRef.current && allCandles.length > 0) {
      chartApiRef.current.timeScale().fitContent();
      setOverlayTick((t) => t + 1);
    }
  }, [loadingChart, symbol, timeframe, allCandles.length]);

  // Sync Price Lines & Execution Markers
  useEffect(() => {
    const mainSeries = mainSeriesRef.current;
    const markersPlugin = markersPluginRef.current;
    if (!mainSeries || !markersPlugin) return;

    for (const line of priceLinesRef.current) {
      try {
        mainSeries.removePriceLine(line);
      } catch {
        // ignore stale
      }
    }
    priceLinesRef.current = [];

    for (const al of alerts.filter((a) => a.symbol === symbol)) {
      priceLinesRef.current.push(
        mainSeries.createPriceLine({
          price: al.price,
          color: al.triggered ? '#94A3B8' : '#F59E0B',
          lineWidth: 1,
          lineStyle: LineStyle.Dotted,
          axisLabelVisible: true,
          title: al.triggered ? 'ALERT HIT' : 'ALERT',
        }),
      );
    }

    const symPositions = positions.filter((p) => p.symbol === symbol);
    for (const pos of symPositions) {
      priceLinesRef.current.push(
        mainSeries.createPriceLine({
          price: pos.entryPrice,
          color: pos.status === 'PENDING' ? '#F59E0B' : '#2962FF',
          lineWidth: 2,
          lineStyle: pos.status === 'PENDING' ? LineStyle.Dotted : LineStyle.Solid,
          axisLabelVisible: true,
          title: `${pos.status === 'PENDING' ? 'LIMIT' : pos.side} ${pos.lots}`,
        }),
      );
      if (pos.stopLoss !== null) {
        priceLinesRef.current.push(
          mainSeries.createPriceLine({
            price: pos.stopLoss,
            color: '#F23645',
            lineWidth: 1,
            lineStyle: LineStyle.Dashed,
            axisLabelVisible: true,
            title: 'SL',
          }),
        );
      }
      if (pos.takeProfit !== null) {
        priceLinesRef.current.push(
          mainSeries.createPriceLine({
            price: pos.takeProfit,
            color: '#089981',
            lineWidth: 1,
            lineStyle: LineStyle.Dashed,
            axisLabelVisible: true,
            title: 'TP',
          }),
        );
      }
    }

    const lastVisibleTime = visibleCandles[visibleCandles.length - 1]?.time ?? 0;
    const markers: SeriesMarker<Time>[] = [];

    for (const pos of symPositions) {
      if (pos.status === 'OPEN' && pos.entryTime <= lastVisibleTime) {
        markers.push({
          time: pos.entryTime as UTCTimestamp,
          position: pos.side === 'BUY' ? 'belowBar' : 'aboveBar',
          color: pos.side === 'BUY' ? '#089981' : '#F23645',
          shape: pos.side === 'BUY' ? 'arrowUp' : 'arrowDown',
          text: `${pos.side} ${pos.lots}`,
        });
      }
    }

    for (const tr of closedTrades) {
      if (tr.symbol !== symbol) continue;
      if (tr.entryTime <= lastVisibleTime) {
        markers.push({
          time: tr.entryTime as UTCTimestamp,
          position: tr.side === 'BUY' ? 'belowBar' : 'aboveBar',
          color: '#2962FF',
          shape: tr.side === 'BUY' ? 'arrowUp' : 'arrowDown',
          text: `${tr.side}`,
        });
      }
      if (tr.exitTime <= lastVisibleTime) {
        markers.push({
          time: tr.exitTime as UTCTimestamp,
          position: tr.side === 'BUY' ? 'aboveBar' : 'belowBar',
          color: tr.pnl >= 0 ? '#089981' : '#F23645',
          shape: 'circle',
          text: tr.pnl >= 0 ? `+$${tr.pnl.toFixed(0)}` : `-$${Math.abs(tr.pnl).toFixed(0)}`,
        });
      }
    }

    markers.sort((a, b) => Number(a.time) - Number(b.time));
    markersPlugin.setMarkers(markers);
  }, [alerts, positions, closedTrades, symbol, visibleCandles, chartStyle]);

  // Keyboard shortcuts
  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement | null;
      if (target && ['INPUT', 'TEXTAREA', 'SELECT'].includes(target.tagName)) return;

      if (e.key === 'Escape') {
        setDraftPoints([]);
        setSelectingCutBar(false);
        setActiveTool('crosshair');
        setOpenFlyout(null);
        setPendingTextPoint(null);
        setSelectedDrawingId(null);
        return;
      }
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'z') {
        e.preventDefault();
        if (e.shiftKey) handleRedo();
        else handleUndo();
        return;
      }
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'y') {
        e.preventDefault();
        handleRedo();
        return;
      }
      if ((e.key === 'Delete' || e.key === 'Backspace') && selectedDrawingId) {
        e.preventDefault();
        commitDrawings((prev) => prev.filter((d) => d.id !== selectedDrawingId));
        setSelectedDrawingId(null);
        return;
      }
      if (e.altKey) {
        const k = e.key.toLowerCase();
        const map: Record<string, DrawingToolId> = {
          t: 'trendline',
          h: 'hline',
          j: 'hray',
          v: 'vline',
          c: 'crossline',
          f: 'fib',
        };
        if (map[k]) {
          e.preventDefault();
          setDraftPoints([]);
          setActiveTool(map[k]);
          setOpenFlyout(null);
        }
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [commitDrawings, handleRedo, handleUndo, selectedDrawingId]);

  // Interactive Handle Dragging (TP / SL / Entry / Box width) + Freehand Brush
  const handleChartPointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    if (activeTool !== 'brush' || lockedAll || !chartContainerRef.current) return;
    const rect = chartContainerRef.current.getBoundingClientRect();
    const pt = resolveChartPoint({x: e.clientX - rect.left, y: e.clientY - rect.top});
    if (!pt) return;
    setIsBrushDown(true);
    setDraftPoints([pt]);
  };

  const handleChartPointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!chartContainerRef.current) return;
    const rect = chartContainerRef.current.getBoundingClientRect();
    const pt = resolveChartPoint({x: e.clientX - rect.left, y: e.clientY - rect.top});
    if (!pt) return;

    if (draggingHandle) {
      setDrawings((prev) =>
        prev.map((d) => {
          if (d.id !== draggingHandle.drawingId || d.locked) return d;
          if (draggingHandle.handle === 'tp') {
            return {...d, targetPrice: pt.price};
          }
          if (draggingHandle.handle === 'sl') {
            return {
              ...d,
              stopPrice: pt.price,
              points: [d.points[0], {...d.points[1], price: pt.price}],
            };
          }
          if (draggingHandle.handle === 'entry') {
            const p0 = d.points[0];
            const deltaP = pt.price - p0.price;
            const deltaT = pt.time - p0.time;
            return {
              ...d,
              points: d.points.map((p) => ({time: p.time + deltaT, price: Number((p.price + deltaP).toFixed(decimalsRef.current))})),
              stopPrice: d.stopPrice !== undefined ? Number((d.stopPrice + deltaP).toFixed(decimalsRef.current)) : undefined,
              targetPrice: d.targetPrice !== undefined ? Number((d.targetPrice + deltaP).toFixed(decimalsRef.current)) : undefined,
            };
          }
          if (draggingHandle.handle === 'end') {
            return {
              ...d,
              points: [d.points[0], {time: pt.time, price: d.points[1].price}],
            };
          }
          return d;
        }),
      );
      return;
    }

    if (activeTool === 'brush' && isBrushDown) {
      setDraftPoints((prev) => [...prev, pt]);
    }
  };

  const handleChartPointerUp = () => {
    if (draggingHandle) {
      setDraggingHandle(null);
      return;
    }
    if (activeTool !== 'brush' || !isBrushDown) return;
    setIsBrushDown(false);
    if (draftPoints.length > 2) {
      commitDrawings((prev) => [
        ...prev,
        {
          id: `drw_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
          tool: 'brush',
          symbol,
          points: draftPoints,
          color: '#2962FF',
          visible: true,
          locked: false,
          createdAt: Date.now(),
        },
      ]);
    }
    setDraftPoints([]);
    if (!stayInDrawingMode) setActiveTool('crosshair');
  };

  // Bottom Date-Range Buttons (1D, 5D, 1M, 3M, 6M, YTD, 1Y, All)
  const applyDateRangePreset = (label: string) => {
    setActiveRangeBtn(label);
    const chart = chartApiRef.current;
    if (!chart || visibleCandles.length === 0) return;

    if (label === 'All') {
      chart.timeScale().fitContent();
      setOverlayTick((t) => t + 1);
      return;
    }

    const lastBar = visibleCandles[visibleCandles.length - 1];
    const endUnix = lastBar.time;
    let startUnix = visibleCandles[0].time;
    const d = new Date(endUnix * 1000);

    if (label === '1D') startUnix = endUnix - 86400;
    else if (label === '5D') startUnix = endUnix - 5 * 86400;
    else if (label === '1M') startUnix = endUnix - 30 * 86400;
    else if (label === '3M') startUnix = endUnix - 90 * 86400;
    else if (label === '6M') startUnix = endUnix - 180 * 86400;
    else if (label === 'YTD') startUnix = Math.floor(Date.UTC(d.getUTCFullYear(), 0, 1) / 1000);
    else if (label === '1Y') startUnix = endUnix - 365 * 86400;

    const firstAllowed = visibleCandles[0].time;
    const clampedFrom = Math.max(firstAllowed, startUnix);
    if (clampedFrom >= endUnix) {
      chart.timeScale().fitContent();
    } else {
      chart.timeScale().setVisibleRange({
        from: clampedFrom as UTCTimestamp,
        to: endUnix as UTCTimestamp,
      });
    }
    setOverlayTick((t) => t + 1);
  };

  // Calendar "Go to date" Handler
  const handleGoToDate = (mode: 'zoom' | 'replay') => {
    if (allCandles.length === 0 || !goToDateValue) return;
    const targetSec = Math.floor(new Date(`${goToDateValue}T00:00:00Z`).getTime() / 1000);
    if (!Number.isFinite(targetSec)) return;
    const idx = findNearestCandleIndex(allCandles, targetSec);
    if (idx < 0) return;

    if (mode === 'replay') {
      const safeIdx = Math.max(5, idx);
      setIsPlaying(false);
      setSelectingCutBar(false);
      setReplayIndex(safeIdx);
      setIsReplayMode(safeIdx < allCandles.length - 1);
      setGoToDateOpen(false);
      showNotice(`Bar Replay rewound to ${formatBarTimestamp(allCandles[safeIdx].time)}`);
      return;
    }

    const fromIdx = Math.max(0, idx - 30);
    const toIdx = Math.min(allCandles.length - 1, idx + 30);
    if (chartApiRef.current && toIdx > fromIdx) {
      chartApiRef.current.timeScale().setVisibleRange({
        from: allCandles[fromIdx].time as UTCTimestamp,
        to: allCandles[toIdx].time as UTCTimestamp,
      });
    }
    setGoToDateOpen(false);
  };

  // Screenshot PNG Export (Top Camera Icon)
  const handleTakeScreenshot = () => {
    const chart = chartApiRef.current;
    if (!chart) return;
    try {
      const canvas = chart.takeScreenshot();
      const url = canvas.toDataURL('image/png');
      const a = document.createElement('a');
      a.href = url;
      a.download = `${symbol}-${timeframe}-${new Date().toISOString().slice(0, 10)}.png`;
      a.click();
      showNotice(`Saved ${symbol} chart snapshot PNG.`);
    } catch {
      showNotice('Snapshot export is unavailable on this browser.');
    }
  };

  // Fullscreen Toggle
  const handleToggleFullscreen = async () => {
    if (!rootRef.current) return;
    try {
      if (!document.fullscreenElement) {
        await rootRef.current.requestFullscreen();
        setIsFullscreen(true);
      } else {
        await document.exitFullscreen();
        setIsFullscreen(false);
      }
    } catch {
      setIsFullscreen((v) => !v);
    }
  };

  // Zoom +/- Buttons
  const handleZoomStep = (direction: 'in' | 'out') => {
    const chart = chartApiRef.current;
    if (!chart) return;
    const lr = chart.timeScale().getVisibleLogicalRange();
    if (!lr) return;
    const span = lr.to - lr.from;
    const delta = direction === 'in' ? -span * 0.2 : span * 0.25;
    chart.timeScale().setVisibleLogicalRange({
      from: lr.from - delta / 2,
      to: lr.to + delta / 2,
    });
    setOverlayTick((t) => t + 1);
  };

  // Open Position / Drawing Properties Modal (Screenshot 8)
  const openPropertiesModal = (drawing: ChartDrawing) => {
    const entryP = drawing.points[0]?.price ?? liveBid;
    const stopP = drawing.stopPrice ?? drawing.points[1]?.price ?? entryP - pipSize * 40;
    const riskDist = Math.max(pipSize * 4, Math.abs(entryP - stopP));
    const targetP =
      drawing.targetPrice ??
      (drawing.tool === 'shortpos' ? entryP - riskDist * 2.17 : entryP + riskDist * 2.17);
    const tickMult = symbol === 'XAUUSD' ? 1000 : 10000;
    setPropDraft({
      riskPercent: String(drawing.riskPercent ?? 25.0),
      entryPrice: entryP.toFixed(decimals),
      leverage: String(drawing.leverage ?? 10000.0),
      profitPrice: targetP.toFixed(decimals),
      profitTicks: String(Math.round(Math.abs(targetP - entryP) * tickMult)),
      stopPrice: stopP.toFixed(decimals),
      stopTicks: String(Math.round(Math.abs(entryP - stopP) * tickMult)),
      qtyPrecision: drawing.qtyPrecision ?? 'Default',
      fillColor: drawing.fillColor || drawing.color || '#2962FF',
      visible: drawing.visible,
      locked: drawing.locked,
    });
    setPropTab('Inputs');
    setPropModalDrawingId(drawing.id);
  };

  const applyPropertiesModal = (e: React.FormEvent) => {
    e.preventDefault();
    if (!propModalDrawingId || !propDraft) return;
    const entryNum = Number(propDraft.entryPrice);
    const tpNum = Number(propDraft.profitPrice);
    const slNum = Number(propDraft.stopPrice);
    const riskNum = Number(propDraft.riskPercent);
    const levNum = Number(propDraft.leverage);

    commitDrawings((prev) =>
      prev.map((d) => {
        if (d.id !== propModalDrawingId) return d;
        return {
          ...d,
          color: propDraft.fillColor,
          fillColor: propDraft.fillColor,
          visible: propDraft.visible,
          locked: propDraft.locked,
          riskPercent: Number.isFinite(riskNum) ? riskNum : d.riskPercent,
          leverage: Number.isFinite(levNum) ? levNum : d.leverage,
          targetPrice: Number.isFinite(tpNum) ? tpNum : d.targetPrice,
          stopPrice: Number.isFinite(slNum) ? slNum : d.stopPrice,
          qtyPrecision: propDraft.qtyPrecision,
          points:
            Number.isFinite(entryNum) && d.points.length >= 1
              ? [
                  {...d.points[0], price: entryNum},
                  ...(d.points[1]
                    ? [{...d.points[1], price: Number.isFinite(slNum) ? slNum : d.points[1].price}]
                    : []),
                  ...d.points.slice(2),
                ]
              : d.points,
        };
      }),
    );
    setPropModalDrawingId(null);
    setPropDraft(null);
  };

  // One-Click Buy / Sell Execution (top-left widget in Screenshots 1 & 5)
  const handleOneClickOrder = (side: 'BUY' | 'SELL') => {
    if (!currentBar) return;
    const lots = Math.max(0.01, Math.min(50, Number(lotsInput) || 0.1));
    const entry = side === 'BUY' ? liveAsk : liveBid;
    const newPos: SimPosition = {
      id: `sim_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
      symbol,
      side,
      lots: Number(lots.toFixed(2)),
      entryPrice: Number(entry.toFixed(decimals)),
      stopLoss: null,
      takeProfit: null,
      entryTime: currentBar.time,
      status: 'OPEN',
    };
    setPositions((prev) => [newPos, ...prev]);
    setTradePanelOpen(true);
    setBottomTab('positions');
    showNotice(`One-Click ${side} ${newPos.lots} ${symbol} @ ${newPos.entryPrice.toFixed(decimals)}`);
  };

  // Order Ticket Submit
  const handlePlaceOrder = (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentBar) return;
    const lots = Math.max(0.01, Math.min(50, Number(lotsInput) || 0.1));
    const entry =
      orderType === 'MARKET'
        ? currentBar.close
        : Number(limitPriceInput) || currentBar.close;
    const parsedSl = slInput.trim() ? Number(slInput) : null;
    const parsedTp = tpInput.trim() ? Number(tpInput) : null;
    if (parsedSl !== null && !Number.isFinite(parsedSl)) return;
    if (parsedTp !== null && !Number.isFinite(parsedTp)) return;

    const newPos: SimPosition = {
      id: `sim_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
      symbol,
      side: orderSide,
      lots: Number(lots.toFixed(2)),
      entryPrice: Number(entry.toFixed(decimals)),
      stopLoss: parsedSl !== null ? Number(parsedSl.toFixed(decimals)) : null,
      takeProfit: parsedTp !== null ? Number(parsedTp.toFixed(decimals)) : null,
      entryTime: currentBar.time,
      status: orderType === 'MARKET' ? 'OPEN' : 'PENDING',
    };

    setPositions((prev) => [newPos, ...prev]);
    setTradePanelOpen(true);
    setBottomTab(orderType === 'MARKET' ? 'positions' : 'orders');
    showNotice(
      `${orderType === 'MARKET' ? 'Executed' : 'Placed Limit'} ${newPos.side} ${newPos.lots} ${newPos.symbol} @ ${newPos.entryPrice.toFixed(decimals)}`,
    );
  };

  const handleClosePosition = (posId: string) => {
    const pos = positions.find((p) => p.id === posId);
    if (!pos) return;
    if (pos.status === 'PENDING') {
      setPositions((prev) => prev.filter((p) => p.id !== posId));
      showNotice(`Cancelled pending ${pos.side} ${pos.symbol}`);
      return;
    }
    const markPrice =
      pos.symbol === symbol && currentBar
        ? currentBar.close
        : quotes.find((q) => q.symbol === pos.symbol)?.price ?? pos.entryPrice;
    const exitTime = currentBar?.time ?? pos.entryTime;
    const pnl = calcPnl(pos.symbol, pos.side, pos.lots, pos.entryPrice, markPrice);
    const pips = calcPips(pos.symbol, pipSize, pos.side, pos.entryPrice, markPrice);

    setPositions((prev) => prev.filter((p) => p.id !== posId));
    setClosedTrades((prev) => [
      {
        id: pos.id,
        symbol: pos.symbol,
        side: pos.side,
        lots: pos.lots,
        entryPrice: pos.entryPrice,
        exitPrice: markPrice,
        entryTime: pos.entryTime,
        exitTime,
        pnl,
        pips,
        reason: 'Manual Close',
      },
      ...prev,
    ]);
    setBalance((b) => Number((b + pnl).toFixed(2)));
    showNotice(`Closed ${pos.symbol} ${pnl >= 0 ? '+' : ''}$${pnl.toFixed(2)}`);
  };

  const handleCreateAlert = (e: React.FormEvent) => {
    e.preventDefault();
    const p = Number(newAlertPrice);
    if (!Number.isFinite(p) || p <= 0) return;
    const created: PriceAlert = {
      id: `alt_${Date.now()}`,
      symbol,
      price: Number(p.toFixed(decimals)),
      condition: newAlertCondition,
      note: newAlertNote.trim(),
      triggered: false,
      createdAt: Date.now(),
    };
    setAlerts((prev) => [created, ...prev]);
    setNewAlertNote('');
    setAlertMenuOpen(false);
    setRightDock('alerts');
    showNotice(`Price alert set on ${symbol} @ ${created.price.toFixed(decimals)}`);
  };

  const toggleFavoriteTool = (id: DrawingToolId) => {
    setFavoriteTools((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id],
    );
  };

  const togglePinnedTimeframe = (tfKey: TimeframeKey) => {
    setPinnedTimeframes((prev) => {
      if (prev.includes(tfKey)) {
        return prev.length > 1 ? prev.filter((x) => x !== tfKey) : prev;
      }
      return [...prev, tfKey];
    });
  };

  const selectTool = (id: DrawingToolId) => {
    setDraftPoints([]);
    setPendingTextPoint(null);
    setSelectingCutBar(id === 'cut');
    setActiveTool(id);
    setOpenFlyout(null);
  };

  const handleSubmitTextAnnotation = (e: React.FormEvent) => {
    e.preventDefault();
    if (!pendingTextPoint || !pendingTextValue.trim()) {
      setPendingTextPoint(null);
      return;
    }
    commitDrawings((prev) => [
      ...prev,
      {
        id: `drw_${Date.now()}`,
        tool: 'text',
        symbol,
        points: [pendingTextPoint],
        color: '#2962FF',
        text: pendingTextValue.trim(),
        visible: true,
        locked: false,
        createdAt: Date.now(),
      },
    ]);
    setPendingTextPoint(null);
    setPendingTextValue('');
    if (!stayInDrawingMode) setActiveTool('crosshair');
  };

  // Account Stats
  const openPositions = positions.filter((p) => p.status === 'OPEN');
  const pendingOrders = positions.filter((p) => p.status === 'PENDING');
  const unrealizedPnl = useMemo(() => {
    return openPositions.reduce((acc, pos) => {
      const mark =
        pos.symbol === symbol && currentBar
          ? currentBar.close
          : quotes.find((q) => q.symbol === pos.symbol)?.price ?? pos.entryPrice;
      return acc + calcPnl(pos.symbol, pos.side, pos.lots, pos.entryPrice, mark);
    }, 0);
  }, [openPositions, symbol, currentBar, quotes]);

  const equity = Number((balance + unrealizedPnl).toFixed(2));
  const realizedPnl = closedTrades.reduce((acc, t) => acc + t.pnl, 0);
  const winCount = closedTrades.filter((t) => t.pnl > 0).length;
  const winRate = closedTrades.length > 0 ? Math.round((winCount / closedTrades.length) * 100) : 0;

  const previewEntry =
    orderType === 'MARKET'
      ? currentBar?.close ?? 0
      : Number(limitPriceInput) || currentBar?.close || 0;
  const previewSl = Number(slInput);
  const previewTp = Number(tpInput);
  const previewLots = Math.max(0.01, Number(lotsInput) || 0.1);
  const riskUsd =
    previewEntry > 0 && Number.isFinite(previewSl) && previewSl > 0
      ? Math.abs(calcPnl(symbol, orderSide, previewLots, previewEntry, previewSl))
      : 0;
  const rewardUsd =
    previewEntry > 0 && Number.isFinite(previewTp) && previewTp > 0
      ? Math.abs(calcPnl(symbol, orderSide, previewLots, previewEntry, previewTp))
      : 0;
  const rrDisplay = riskUsd > 0 ? (rewardUsd / riskUsd).toFixed(2) : '—';

  const barDelta = displayBar ? displayBar.close - displayBar.open : 0;
  const barDeltaPct =
    displayBar && displayBar.open > 0 ? ((barDelta / displayBar.open) * 100).toFixed(2) : '0.00';
  const spreadStep = pipSize * (symbol === 'XAUUSD' ? 0.0 : symbol === 'BTCUSDT' ? 1.5 : 0.2);
  const liveBid = currentBar ? currentBar.close : marketData?.price ?? 0;
  const liveAsk = liveBid + spreadStep;

  const symbolDrawings = useMemo(
    () => drawings.filter((d) => d.symbol === symbol),
    [drawings, symbol],
  );
  const symbolAlerts = useMemo(
    () => alerts.filter((a) => a.symbol === symbol),
    [alerts, symbol],
  );
  const selectedDrawing = useMemo(
    () => symbolDrawings.find((d) => d.id === selectedDrawingId) || null,
    [symbolDrawings, selectedDrawingId],
  );

  const activeIndicatorCount =
    Number(showEma20) +
    Number(showEma50) +
    Number(showEma200) +
    Number(showSma50) +
    Number(showBollinger) +
    Number(showVolume) +
    Number(showRsi);

  const filteredSymbols = useMemo(() => {
    const q = symbolSearch.trim().toLowerCase();
    if (!q) return SYMBOLS;
    return SYMBOLS.filter(
      (s) =>
        s.key.toLowerCase().includes(q) ||
        s.label.toLowerCase().includes(q) ||
        s.category.toLowerCase().includes(q),
    );
  }, [symbolSearch]);

  const dateCoverageText = useMemo(() => {
    if (allCandles.length === 0) return '2024–2026';
    const d1 = new Date(allCandles[0].time * 1000).toISOString().slice(0, 10);
    const d2 = new Date(allCandles[allCandles.length - 1].time * 1000).toISOString().slice(0, 10);
    return `${d1} → ${d2}`;
  }, [allCandles]);

  const applyPositionPreset = (side: 'BUY' | 'SELL', rrRatio = 3) => {
    setOrderSide(side);
    setOrderType('MARKET');
    if (!currentBar) return;
    const entry = currentBar.close;
    const slDist =
      pipSize *
      (symbol === 'XAUUSD'
        ? 120
        : symbol === 'NAS100'
          ? 180
          : symbol === 'BTCUSDT' || symbol === 'BTCUSD'
            ? 1200
            : 35);
    const sl = side === 'BUY' ? entry - slDist : entry + slDist;
    const tp = side === 'BUY' ? entry + slDist * rrRatio : entry - slDist * rrRatio;
    populateTicketFromPosition(side, entry, sl, tp);
  };

  const flyoutGroupsMap: Record<Exclude<FlyoutMenu, null>, ToolCatalogGroup[]> = {
    lines: ['LINES', 'CHANNELS', 'PITCHFORKS'],
    fib: ['FIBONACCI', 'GANN'],
    patterns: ['CHART PATTERNS', 'ELLIOTT WAVES', 'CYCLES'],
    projection: ['PROJECTION', 'SHAPES'],
  };

  return (
    <div
      ref={rootRef}
      style={{['--tv-icon-bg' as string]: isDark ? '#131722' : '#FFFFFF'}}
      className="rounded-xl border border-slate-200 dark:border-[#2A2E39] bg-white dark:bg-[#131722] text-[#131722] dark:text-[#D1D4DC] overflow-hidden shadow-sm select-none"
    >
      {/* Inline Notice Bar */}
      {simNotice && (
        <div className="border-b border-[#2962FF]/25 bg-[#2962FF]/10 text-[#1D4ED8] dark:text-[#60A5FA] px-3.5 py-1.5 text-xs font-medium flex items-center justify-between">
          <span>{simNotice}</span>
          <button
            type="button"
            onClick={() => setSimNotice(null)}
            className="text-[11px] opacity-75 hover:opacity-100"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* ===================================================================== */}
      {/* TRADINGVIEW TOP TOOLBAR (Screenshot 1 & 9)                            */}
      {/* ===================================================================== */}
      <div className="relative z-30 h-11 px-2 border-b border-slate-200 dark:border-[#2A2E39] bg-white dark:bg-[#131722] flex items-center justify-between gap-2 overflow-x-auto no-scrollbar">
        <div className="flex items-center gap-1 shrink-0">
          {/* User Profile Initial Badge with Notification Dot (Screenshots 2,3,4,6,7,8,9) */}
          <div
            title={`Signed in as ${user.name} · ${user.tier}`}
            className="relative w-7 h-7 rounded-full bg-[#8D6E63] text-white text-xs font-bold flex items-center justify-center shrink-0 mr-1 cursor-default"
          >
            {(user.name || 'S').charAt(0).toUpperCase()}
            <span className="absolute -top-1 -right-1 px-1 min-w-[14px] h-3.5 rounded-full bg-[#F23645] text-white text-[8px] font-extrabold flex items-center justify-center">
              12
            </span>
          </div>

          {/* Symbol Search Trigger Pill (Screenshot 1: XAUUSD + compare icon) */}
          <div className="relative flex items-center gap-1">
            <div className="inline-flex items-center rounded-full bg-slate-100/90 dark:bg-[#1E222D] pl-2.5 pr-1.5 py-1 gap-1.5">
              <button
                type="button"
                onClick={() => {
                  setSymbolMenuOpen((v) => !v);
                  setTfMenuOpen(false);
                  setChartStyleMenuOpen(false);
                  setIndicatorsMenuOpen(false);
                  setAlertMenuOpen(false);
                  setSettingsMenuOpen(false);
                }}
                className="inline-flex items-center gap-1.5 text-xs font-bold text-[#131722] dark:text-white whitespace-nowrap"
              >
                <SymbolBadge symbol={symbol} size={15} />
                <span>{symbol}</span>
              </button>
              <button
                type="button"
                onClick={() => setSymbolMenuOpen((v) => !v)}
                title="Switch chart symbol"
                className="text-slate-400 hover:text-[#131722] dark:hover:text-white"
              >
                <Search className="w-3 h-3" />
              </button>
            </div>

            <button
              type="button"
              onClick={() => setSymbolMenuOpen((v) => !v)}
              title="Compare or Add Symbol"
              className="w-6 h-6 rounded-full border border-slate-300 dark:border-[#2A2E39] flex items-center justify-center text-slate-600 dark:text-[#B2B5BE] hover:bg-slate-100 dark:hover:bg-[#1E222D]"
            >
              <Plus className="w-3.5 h-3.5" />
            </button>

            {symbolMenuOpen && (
              <div className="fixed sm:absolute left-2 sm:left-0 top-12 sm:top-9 z-50 w-72 rounded-xl border border-slate-200 dark:border-[#2A2E39] bg-white dark:bg-[#1E222D] shadow-2xl p-2 space-y-2">
                <div className="flex items-center gap-2 px-2.5 py-1.5 rounded-lg bg-slate-100 dark:bg-[#131722]">
                  <Search className="w-3.5 h-3.5 text-slate-400" />
                  <input
                    type="text"
                    value={symbolSearch}
                    onChange={(e) => setSymbolSearch(e.target.value)}
                    placeholder="Symbol Search (e.g. XAUUSD)..."
                    className="w-full bg-transparent text-xs focus:outline-none text-[#131722] dark:text-white"
                    autoFocus
                  />
                </div>
                <div className="max-h-64 overflow-y-auto divide-y divide-slate-100 dark:divide-[#2A2E39]">
                  {filteredSymbols.map((s) => {
                    const q = quotes.find((item) => item.symbol === s.key);
                    return (
                      <button
                        key={s.key}
                        type="button"
                        onClick={() => {
                          setSymbol(s.key);
                          setSymbolMenuOpen(false);
                        }}
                        className={`w-full px-2.5 py-2 flex items-center justify-between text-left hover:bg-slate-50 dark:hover:bg-[#2A2E39] transition-colors ${
                          symbol === s.key ? 'bg-[#2962FF]/10' : ''
                        }`}
                      >
                        <div className="flex items-center gap-2 min-w-0">
                          <SymbolBadge symbol={s.key} size={18} />
                          <div className="min-w-0">
                            <div className="text-xs font-bold text-[#131722] dark:text-white truncate">
                              {s.key}
                            </div>
                            <div className="text-[10px] text-slate-500 dark:text-[#787B86] truncate">
                              {s.label} · {s.exchange}
                            </div>
                          </div>
                        </div>
                        <div className="text-right font-mono text-[11px] tabular-nums shrink-0">
                          <div>{q ? q.price.toFixed(q.decimals) : '—'}</div>
                          <div className="text-[10px] text-slate-400">{s.category}</div>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>
            )}
          </div>

          <div className="h-5 w-px bg-slate-200 dark:bg-[#2A2E39] mx-0.5" />

          {/* Pinned Timeframes Strip + Custom Interval Dropdown (Screenshot 1) */}
          <div className="relative flex items-center gap-0.5">
            {TIMEFRAMES.filter((tf) => pinnedTimeframes.includes(tf.key)).map((tf) => {
              const active = timeframe === tf.key;
              return (
                <button
                  key={tf.key}
                  type="button"
                  onClick={() => setTimeframe(tf.key)}
                  className={`px-2 py-1 rounded text-xs font-semibold transition-colors whitespace-nowrap ${
                    active
                      ? 'bg-slate-200/80 dark:bg-[#2A2E39] text-[#131722] dark:text-white'
                      : 'text-slate-600 dark:text-[#B2B5BE] hover:bg-slate-100 dark:hover:bg-[#1E222D]'
                  }`}
                >
                  {tf.tvLabel}
                </button>
              );
            })}
            <button
              type="button"
              onClick={() => {
                setTfMenuOpen((v) => !v);
                setSymbolMenuOpen(false);
                setChartStyleMenuOpen(false);
                setIndicatorsMenuOpen(false);
                setAlertMenuOpen(false);
              }}
              aria-label="Open timeframe selector"
              className="p-1 rounded hover:bg-slate-100 dark:hover:bg-[#1E222D] text-slate-500"
            >
              <ChevronDown className="w-3.5 h-3.5" />
            </button>

            {tfMenuOpen && (
              <div className="fixed sm:absolute left-2 sm:left-0 top-12 sm:top-9 z-50 w-56 max-h-[430px] overflow-y-auto rounded-xl border border-slate-200 dark:border-[#2A2E39] bg-white dark:bg-[#1E222D] shadow-2xl py-1.5 text-xs">
                <div className="px-3 py-2 border-b border-slate-100 dark:border-[#2A2E39] flex items-center gap-2 font-medium text-slate-700 dark:text-slate-200">
                  <Plus className="w-3.5 h-3.5" />
                  <span>Select active interval...</span>
                </div>
                {(['MINUTES', 'HOURS', 'DAYS'] as const).map((sec) => {
                  const secOpen = tfOpenSections[sec] !== false;
                  const items = TIMEFRAMES.filter((t) => t.section === sec);
                  return (
                    <div key={sec} className="border-b last:border-b-0 border-slate-100 dark:border-[#2A2E39] py-1">
                      <button
                        type="button"
                        onClick={() => setTfOpenSections((p) => ({...p, [sec]: !secOpen}))}
                        className="w-full px-3 py-1 flex items-center justify-between text-[10px] font-bold tracking-wider text-slate-400"
                      >
                        <span>{sec}</span>
                        <ChevronDown className={`w-3 h-3 transition-transform ${secOpen ? '' : '-rotate-90'}`} />
                      </button>
                      {secOpen &&
                        items.map((tf) => {
                          const isAct = timeframe === tf.key;
                          const isPinned = pinnedTimeframes.includes(tf.key);
                          return (
                            <div
                              key={tf.key}
                              className={`flex items-center justify-between px-3 py-1.5 ${
                                isAct
                                  ? 'bg-[#131722] text-white font-semibold'
                                  : 'hover:bg-slate-100 dark:hover:bg-[#2A2E39]'
                              }`}
                            >
                              <button
                                type="button"
                                onClick={() => {
                                  setTimeframe(tf.key);
                                  setTfMenuOpen(false);
                                }}
                                className="flex-1 text-left"
                              >
                                {tf.longLabel}
                              </button>
                              <button
                                type="button"
                                onClick={() => togglePinnedTimeframe(tf.key)}
                                title={isPinned ? 'Unpin from toolbar' : 'Pin to toolbar'}
                                className={isPinned ? 'text-amber-500' : 'text-slate-400 hover:text-amber-500'}
                              >
                                <Star className="w-3.5 h-3.5" fill={isPinned ? 'currentColor' : 'none'} />
                              </button>
                            </div>
                          );
                        })}
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          <div className="h-5 w-px bg-slate-200 dark:bg-[#2A2E39] mx-0.5" />

          {/* Chart Style Switcher (Candles Icon matching Screenshot 1) */}
          <div className="relative">
            <button
              type="button"
              onClick={() => {
                setChartStyleMenuOpen((v) => !v);
                setTfMenuOpen(false);
                setIndicatorsMenuOpen(false);
                setSymbolMenuOpen(false);
                setAlertMenuOpen(false);
              }}
              title="Chart style"
              className="inline-flex items-center gap-1 px-2 py-1 rounded hover:bg-slate-100 dark:hover:bg-[#1E222D] text-xs font-medium text-slate-700 dark:text-[#D1D4DC]"
            >
              <svg viewBox="0 0 24 24" className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="1.6">
                <line x1="7" y1="3" x2="7" y2="21" />
                <rect x="4.5" y="7" width="5" height="9" fill="currentColor" fillOpacity="0.2" />
                <line x1="17" y1="3" x2="17" y2="21" />
                <rect x="14.5" y="9" width="5" height="7" fill="currentColor" />
              </svg>
            </button>

            {chartStyleMenuOpen && (
              <div className="fixed sm:absolute left-2 sm:left-0 top-12 sm:top-9 z-50 w-44 rounded-xl border border-slate-200 dark:border-[#2A2E39] bg-white dark:bg-[#1E222D] shadow-xl py-1">
                {(
                  [
                    {key: 'candles', label: 'Candles'},
                    {key: 'hollow', label: 'Hollow candles'},
                    {key: 'bars', label: 'OHLC Bars'},
                    {key: 'line', label: 'Line'},
                    {key: 'area', label: 'Area'},
                  ] as const
                ).map((st) => (
                  <button
                    key={st.key}
                    type="button"
                    onClick={() => {
                      setChartStyle(st.key);
                      setChartStyleMenuOpen(false);
                    }}
                    className={`w-full px-3 py-1.5 text-left text-xs transition-colors ${
                      chartStyle === st.key
                        ? 'bg-[#2962FF]/12 text-[#2962FF] font-semibold'
                        : 'hover:bg-slate-100 dark:hover:bg-[#2A2E39]'
                    }`}
                  >
                    {st.label}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Indicators Menu (Exact TradingView Icon + Label) */}
          <div className="relative">
            <button
              type="button"
              onClick={() => {
                setIndicatorsMenuOpen((v) => !v);
                setTfMenuOpen(false);
                setChartStyleMenuOpen(false);
                setSymbolMenuOpen(false);
                setAlertMenuOpen(false);
              }}
              className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded text-xs font-medium transition-colors whitespace-nowrap ${
                indicatorsMenuOpen
                  ? 'bg-[#2962FF]/12 text-[#2962FF]'
                  : 'text-slate-700 dark:text-[#D1D4DC] hover:bg-slate-100 dark:hover:bg-[#1E222D]'
              }`}
            >
              <svg viewBox="0 0 24 24" className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="1.6">
                <path d="M4 17V13M9 17V9M14 17V11M19 17V6" strokeLinecap="round" />
                <path d="M4 10l5-3 5 2 6-5" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
              <span>Indicators</span>
              {activeIndicatorCount > 0 && (
                <span className="text-[10px] font-mono text-[#2962FF] font-bold">
                  ({activeIndicatorCount})
                </span>
              )}
              <ChevronDown className="w-3 h-3 opacity-70" />
            </button>

            {indicatorsMenuOpen && (
              <div className="fixed sm:absolute left-2 sm:left-0 top-12 sm:top-9 z-50 w-64 rounded-xl border border-slate-200 dark:border-[#2A2E39] bg-white dark:bg-[#1E222D] shadow-xl p-2 space-y-1">
                <div className="px-2 py-1 text-[10px] font-bold uppercase tracking-wider text-slate-400">
                  Technical Indicators
                </div>
                {[
                  {label: 'EMA 20 (Exponential)', checked: showEma20, toggle: () => setShowEma20((v) => !v), color: '#0EA5E9'},
                  {label: 'EMA 50 (Exponential)', checked: showEma50, toggle: () => setShowEma50((v) => !v), color: '#F59E0B'},
                  {label: 'EMA 200 (Long Trend)', checked: showEma200, toggle: () => setShowEma200((v) => !v), color: '#8B5CF6'},
                  {label: 'SMA 50 (Simple MA)', checked: showSma50, toggle: () => setShowSma50((v) => !v), color: '#EC4899'},
                  {label: 'Bollinger Bands (20, 2)', checked: showBollinger, toggle: () => setShowBollinger((v) => !v), color: '#2962FF'},
                  {label: 'Volume Histogram', checked: showVolume, toggle: () => setShowVolume((v) => !v), color: '#089981'},
                  {label: 'RSI (14) Lower Pane', checked: showRsi, toggle: () => setShowRsi((v) => !v), color: '#7E57C2'},
                ].map((ind) => (
                  <button
                    key={ind.label}
                    type="button"
                    onClick={ind.toggle}
                    className="w-full px-2.5 py-1.5 rounded-lg flex items-center justify-between text-xs hover:bg-slate-100 dark:hover:bg-[#2A2E39] transition-colors"
                  >
                    <span className="flex items-center gap-2">
                      <span className="w-2.5 h-2.5 rounded-xs shrink-0" style={{backgroundColor: ind.color}} />
                      <span>{ind.label}</span>
                    </span>
                    <span className={`text-[10px] font-bold ${ind.checked ? 'text-[#2962FF]' : 'text-slate-400'}`}>
                      {ind.checked ? 'ON' : 'OFF'}
                    </span>
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Alert Button (Clock+ Icon matching Screenshot 1) */}
          <div className="relative">
            <button
              type="button"
              onClick={() => {
                setAlertMenuOpen((v) => !v);
                setTfMenuOpen(false);
                setIndicatorsMenuOpen(false);
                setChartStyleMenuOpen(false);
                setSymbolMenuOpen(false);
                if (currentBar) setNewAlertPrice(currentBar.close.toFixed(decimals));
              }}
              className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded hover:bg-slate-100 dark:hover:bg-[#1E222D] text-xs font-medium text-slate-700 dark:text-[#D1D4DC] whitespace-nowrap"
            >
              <Clock className="w-3.5 h-3.5" />
              <span>Alert</span>
            </button>

            {alertMenuOpen && (
              <form
                onSubmit={handleCreateAlert}
                className="fixed sm:absolute left-2 sm:left-0 top-12 sm:top-9 z-50 w-72 rounded-xl border border-slate-200 dark:border-[#2A2E39] bg-white dark:bg-[#1E222D] shadow-xl p-3 space-y-2.5"
              >
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold">Create Alert · {symbol}</span>
                  <button type="button" onClick={() => setAlertMenuOpen(false)} className="text-slate-400">
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>
                <div>
                  <label className="block text-[10px] font-semibold text-slate-500 mb-1">Condition</label>
                  <select
                    value={newAlertCondition}
                    onChange={(e) => setNewAlertCondition(e.target.value as PriceAlert['condition'])}
                    className="w-full rounded-lg border border-slate-200 dark:border-[#2A2E39] bg-slate-50 dark:bg-[#131722] px-2.5 py-1.5 text-xs"
                  >
                    <option value="CROSSING">Crossing</option>
                    <option value="CROSSING_ABOVE">Crossing Up</option>
                    <option value="CROSSING_BELOW">Crossing Down</option>
                  </select>
                </div>
                <div>
                  <label className="block text-[10px] font-semibold text-slate-500 mb-1">Price Level</label>
                  <input
                    type="number"
                    step="any"
                    required
                    value={newAlertPrice}
                    onChange={(e) => setNewAlertPrice(e.target.value)}
                    className="w-full rounded-lg border border-slate-200 dark:border-[#2A2E39] bg-slate-50 dark:bg-[#131722] px-2.5 py-1.5 text-xs font-mono"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-semibold text-slate-500 mb-1">Message (Optional)</label>
                  <input
                    type="text"
                    value={newAlertNote}
                    onChange={(e) => setNewAlertNote(e.target.value)}
                    placeholder="e.g. Liquidity sweep level"
                    className="w-full rounded-lg border border-slate-200 dark:border-[#2A2E39] bg-slate-50 dark:bg-[#131722] px-2.5 py-1.5 text-xs"
                  />
                </div>
                <button type="submit" className="w-full py-1.5 rounded-lg bg-[#2962FF] hover:bg-[#1E53E5] text-white text-xs font-semibold">
                  Create Alert
                </button>
              </form>
            )}
          </div>

          {/* << Replay Button */}
          <button
            type="button"
            onClick={() => {
              if (!isReplayMode && !selectingCutBar) {
                setSelectingCutBar(true);
                setActiveTool('cut');
                setIsPlaying(false);
                showNotice('Click any historical candle (2024–2026) to rewind and replay into the future.');
              } else if (selectingCutBar) {
                setSelectingCutBar(false);
                setActiveTool('crosshair');
              } else {
                jumpToLive();
              }
            }}
            className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded text-xs font-semibold transition-colors whitespace-nowrap ${
              isReplayMode || selectingCutBar
                ? 'bg-[#2962FF] text-white'
                : 'text-slate-700 dark:text-[#D1D4DC] hover:bg-slate-100 dark:hover:bg-[#1E222D]'
            }`}
          >
            <Rewind className="w-3.5 h-3.5" />
            <span>{selectingCutBar ? 'Pick Candle' : isReplayMode ? 'Exit Replay' : 'Replay'}</span>
          </button>

          <div className="h-5 w-px bg-slate-200 dark:bg-[#2A2E39] mx-0.5" />

          {/* Undo / Redo */}
          <button
            type="button"
            onClick={handleUndo}
            disabled={undoStack.length === 0}
            title="Undo drawing (Ctrl+Z)"
            className="p-1.5 rounded hover:bg-slate-100 dark:hover:bg-[#1E222D] text-slate-600 dark:text-[#B2B5BE] disabled:opacity-30"
          >
            <Undo2 className="w-3.5 h-3.5" />
          </button>
          <button
            type="button"
            onClick={handleRedo}
            disabled={redoStack.length === 0}
            title="Redo drawing (Ctrl+Y)"
            className="p-1.5 rounded hover:bg-slate-100 dark:hover:bg-[#1E222D] text-slate-600 dark:text-[#B2B5BE] disabled:opacity-30"
          >
            <Redo2 className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Top Bar Right: Unnamed Save Layout, Refresh, Settings, Fullscreen, Camera, Trade, Upgrade */}
        <div className="flex items-center gap-1 shrink-0">
          <button
            type="button"
            onClick={saveLayout}
            title="Save drawings, indicators & preferences"
            className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded hover:bg-slate-100 dark:hover:bg-[#1E222D] text-xs whitespace-nowrap"
          >
            <Save className="w-3.5 h-3.5 text-slate-500" />
            <div className="text-left leading-none">
              <div className="font-semibold text-[11px]">Unnamed</div>
              <div className="text-[9px] text-[#2962FF]">
                {layoutSavedAt ? `Saved ${layoutSavedAt}` : 'Save'}
              </div>
            </div>
            <ChevronDown className="w-3 h-3 opacity-60" />
          </button>

          <button
            type="button"
            onClick={() => loadMarketData(symbol, timeframe)}
            title="Refresh real market feed"
            className="p-1.5 rounded hover:bg-slate-100 dark:hover:bg-[#1E222D] text-slate-600 dark:text-[#B2B5BE]"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loadingChart ? 'animate-spin' : ''}`} />
          </button>

          {/* Chart Settings Popover */}
          <div className="relative">
            <button
              type="button"
              onClick={() => setSettingsMenuOpen((v) => !v)}
              title="Chart settings"
              className="p-1.5 rounded hover:bg-slate-100 dark:hover:bg-[#1E222D] text-slate-600 dark:text-[#B2B5BE]"
            >
              <Settings className="w-3.5 h-3.5" />
            </button>

            {settingsMenuOpen && (
              <div className="fixed sm:absolute right-2 sm:right-0 top-12 sm:top-9 z-50 w-64 rounded-xl border border-slate-200 dark:border-[#2A2E39] bg-white dark:bg-[#1E222D] shadow-xl p-3 space-y-2.5 text-xs">
                <div className="flex items-center justify-between font-bold">
                  <span>Chart Settings</span>
                  <button type="button" onClick={() => setSettingsMenuOpen(false)} className="text-slate-400">
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>
                <div>
                  <label className="block text-[10px] font-semibold uppercase text-slate-400 mb-1">
                    Candle Colors
                  </label>
                  <div className="grid grid-cols-2 gap-1.5">
                    <button
                      type="button"
                      onClick={() => setCandlePalette('tv_blue_black')}
                      className={`py-1.5 px-2 rounded border text-[11px] font-semibold ${
                        candlePalette === 'tv_blue_black'
                          ? 'border-[#2962FF] bg-[#2962FF]/10 text-[#2962FF]'
                          : 'border-slate-200 dark:border-[#2A2E39]'
                      }`}
                    >
                      Blue / Black
                    </button>
                    <button
                      type="button"
                      onClick={() => setCandlePalette('classic_green_red')}
                      className={`py-1.5 px-2 rounded border text-[11px] font-semibold ${
                        candlePalette === 'classic_green_red'
                          ? 'border-[#089981] bg-[#089981]/10 text-[#089981]'
                          : 'border-slate-200 dark:border-[#2A2E39]'
                      }`}
                    >
                      Green / Red
                    </button>
                  </div>
                </div>
                <label className="flex items-center justify-between cursor-pointer">
                  <span>Background Grid Lines</span>
                  <input
                    type="checkbox"
                    checked={showGrid}
                    onChange={(e) => setShowGrid(e.target.checked)}
                    className="accent-[#2962FF]"
                  />
                </label>
                <label className="flex items-center justify-between cursor-pointer">
                  <span>Chart Symbol Watermark</span>
                  <input
                    type="checkbox"
                    checked={showWatermark}
                    onChange={(e) => setShowWatermark(e.target.checked)}
                    className="accent-[#2962FF]"
                  />
                </label>
              </div>
            )}
          </div>

          <button
            type="button"
            onClick={handleToggleFullscreen}
            title="Fullscreen mode"
            className="p-1.5 rounded hover:bg-slate-100 dark:hover:bg-[#1E222D] text-slate-600 dark:text-[#B2B5BE]"
          >
            {isFullscreen ? <Minimize2 className="w-3.5 h-3.5" /> : <Maximize2 className="w-3.5 h-3.5" />}
          </button>

          <button
            type="button"
            onClick={handleTakeScreenshot}
            title="Take chart snapshot (PNG)"
            className="p-1.5 rounded hover:bg-slate-100 dark:hover:bg-[#1E222D] text-slate-600 dark:text-[#B2B5BE]"
          >
            <Camera className="w-3.5 h-3.5" />
          </button>

          <button
            type="button"
            onClick={() => setTradePanelOpen((v) => !v)}
            className={`ml-1 px-3 py-1 rounded-full border text-xs font-bold transition-colors whitespace-nowrap ${
              tradePanelOpen
                ? 'border-[#2962FF] bg-[#2962FF] text-white'
                : 'border-slate-200 dark:border-[#2A2E39] hover:border-[#2962FF]'
            }`}
          >
            Trade
          </button>

          <button
            type="button"
            onClick={() => setUpgradeModalOpen(true)}
            className="hidden sm:inline-flex px-3.5 py-1 rounded-full bg-[#131722] dark:bg-white text-white dark:text-[#131722] text-xs font-bold whitespace-nowrap hover:opacity-90 transition-opacity"
          >
            Upgrade
          </button>
        </div>
      </div>

      {/* ===================================================================== */}
      {/* WORKSPACE BODY: LEFT RAIL + CHART CANVAS + RIGHT DOCK PANEL           */}
      {/* ===================================================================== */}
      <div className="flex min-h-[540px] sm:min-h-[600px]">
        {/* LEFT DRAWING VERTICAL RAIL (Screenshots 1–6 exact stack) */}
        <div className="relative z-30 w-11 shrink-0 border-r border-slate-200 dark:border-[#2A2E39] bg-white dark:bg-[#131722] py-1.5 flex flex-col items-center gap-0.5">
          {/* 1. Crosshair */}
          <button
            type="button"
            onClick={() => selectTool('crosshair')}
            title="Crosshair (Esc)"
            className={`w-8 h-8 rounded flex items-center justify-center transition-colors ${
              activeTool === 'crosshair' && !selectingCutBar
                ? 'bg-[#2962FF]/12 text-[#2962FF]'
                : 'text-slate-700 dark:text-[#B2B5BE] hover:bg-slate-100 dark:hover:bg-[#1E222D]'
            }`}
          >
            <TvToolSvg tool="crosshair" />
          </button>

          {/* 2. Trend Line / Channels / Pitchforks Flyout (Screenshot 3) */}
          <button
            type="button"
            onClick={() => setOpenFlyout((f) => (f === 'lines' ? null : 'lines'))}
            title="Trend Lines, Channels & Pitchforks"
            className={`relative w-8 h-8 rounded flex items-center justify-center transition-colors ${
              openFlyout === 'lines' ||
              [
                'trendline',
                'ray',
                'infoline',
                'extline',
                'angle',
                'hline',
                'hray',
                'vline',
                'crossline',
                'channel',
                'regtrend',
                'flattop',
                'disjoint',
                'pitchfork',
                'schiff',
              ].includes(activeTool)
                ? 'bg-[#2962FF]/12 text-[#2962FF]'
                : 'text-slate-700 dark:text-[#B2B5BE] hover:bg-slate-100 dark:hover:bg-[#1E222D]'
            }`}
          >
            <TvToolSvg tool="trendline" />
            <span className="absolute right-0.5 bottom-0.5 text-[7px] opacity-60">▸</span>
          </button>

          {/* 3. Fibonacci & Gann Flyout (Screenshot 2) */}
          <button
            type="button"
            onClick={() => setOpenFlyout((f) => (f === 'fib' ? null : 'fib'))}
            title="Fibonacci & Gann Tools"
            className={`relative w-8 h-8 rounded flex items-center justify-center transition-colors ${
              openFlyout === 'fib' ||
              [
                'fib',
                'fibext',
                'fibchannel',
                'fibtime',
                'fibfan',
                'fibtrendtime',
                'fibcircles',
                'fibspiral',
                'fibarcs',
                'fibwedge',
                'pitchfan',
                'gannbox',
                'gannsquarefixed',
                'gannsquare',
                'gannfan',
              ].includes(activeTool)
                ? 'bg-[#2962FF]/12 text-[#2962FF]'
                : 'text-slate-700 dark:text-[#B2B5BE] hover:bg-slate-100 dark:hover:bg-[#1E222D]'
            }`}
          >
            <TvToolSvg tool="fib_group" />
            <span className="absolute right-0.5 bottom-0.5 text-[7px] opacity-60">▸</span>
          </button>

          {/* 4. Chart Patterns, Elliott Waves & Cycles Flyout (Screenshot 4) */}
          <button
            type="button"
            onClick={() => setOpenFlyout((f) => (f === 'patterns' ? null : 'patterns'))}
            title="Patterns, Elliott Waves & Cycles"
            className={`relative w-8 h-8 rounded flex items-center justify-center transition-colors ${
              openFlyout === 'patterns' ||
              [
                'xabcd',
                'cypher',
                'headshoulders',
                'abcd',
                'triangle',
                'threedrives',
                'elliott5',
                'elliott3',
                'elliotttri',
                'elliottwxy',
                'elliottwxyz',
                'cyclic',
                'timecycles',
                'sine',
              ].includes(activeTool)
                ? 'bg-[#2962FF]/12 text-[#2962FF]'
                : 'text-slate-700 dark:text-[#B2B5BE] hover:bg-slate-100 dark:hover:bg-[#1E222D]'
            }`}
          >
            <TvToolSvg tool="patterns_group" />
            <span className="absolute right-0.5 bottom-0.5 text-[7px] opacity-60">▸</span>
          </button>

          {/* 5. Prediction / Long & Short Position Flyout (Screenshots 5, 6, 7, 8) */}
          <button
            type="button"
            onClick={() => setOpenFlyout((f) => (f === 'projection' ? null : 'projection'))}
            title="Long Position, Short Position & Projection Tools"
            className={`relative w-8 h-8 rounded flex items-center justify-center transition-colors ${
              openFlyout === 'projection' ||
              ['longpos', 'shortpos', 'forecast', 'daterange'].includes(activeTool)
                ? 'bg-[#2962FF]/12 text-[#2962FF]'
                : 'text-slate-700 dark:text-[#B2B5BE] hover:bg-slate-100 dark:hover:bg-[#1E222D]'
            }`}
          >
            <TvToolSvg tool="projection_group" />
            <span className="absolute right-0.5 bottom-0.5 text-[7px] opacity-60">▸</span>
          </button>

          {/* 6. Brush / Rectangle */}
          <button
            type="button"
            onClick={() => selectTool('brush')}
            title="Brush (Click & drag on chart)"
            className={`w-8 h-8 rounded flex items-center justify-center transition-colors ${
              activeTool === 'brush'
                ? 'bg-[#2962FF]/12 text-[#2962FF]'
                : 'text-slate-700 dark:text-[#B2B5BE] hover:bg-slate-100 dark:hover:bg-[#1E222D]'
            }`}
          >
            <TvToolSvg tool="brush" />
          </button>

          {/* 7. Text Tool */}
          <button
            type="button"
            onClick={() => selectTool('text')}
            title="Text Annotation (T)"
            className={`w-8 h-8 rounded flex items-center justify-center transition-colors ${
              activeTool === 'text'
                ? 'bg-[#2962FF]/12 text-[#2962FF]'
                : 'text-slate-700 dark:text-[#B2B5BE] hover:bg-slate-100 dark:hover:bg-[#1E222D]'
            }`}
          >
            <TvToolSvg tool="text" />
          </button>

          {/* 8. Callout / Sticker (Smiley in Screenshot 6) */}
          <button
            type="button"
            onClick={() => selectTool('callout')}
            title="Marker / Callout Note"
            className={`w-8 h-8 rounded flex items-center justify-center transition-colors ${
              activeTool === 'callout'
                ? 'bg-[#2962FF]/12 text-[#2962FF]'
                : 'text-slate-700 dark:text-[#B2B5BE] hover:bg-slate-100 dark:hover:bg-[#1E222D]'
            }`}
          >
            <TvToolSvg tool="callout" />
          </button>

          <div className="w-6 border-t border-slate-200 dark:border-[#2A2E39] my-0.5" />

          {/* 9. Rectangle / Zone */}
          <button
            type="button"
            onClick={() => selectTool('rect')}
            title="Rectangle / Supply-Demand Zone (R)"
            className={`w-8 h-8 rounded flex items-center justify-center transition-colors ${
              activeTool === 'rect'
                ? 'bg-[#2962FF]/12 text-[#2962FF]'
                : 'text-slate-700 dark:text-[#B2B5BE] hover:bg-slate-100 dark:hover:bg-[#1E222D]'
            }`}
          >
            <TvToolSvg tool="rect" />
          </button>

          {/* 10. Measure */}
          <button
            type="button"
            onClick={() => selectTool('measure')}
            title="Measure Price Range (M)"
            className={`w-8 h-8 rounded flex items-center justify-center transition-colors ${
              activeTool === 'measure'
                ? 'bg-[#2962FF]/12 text-[#2962FF]'
                : 'text-slate-700 dark:text-[#B2B5BE] hover:bg-slate-100 dark:hover:bg-[#1E222D]'
            }`}
          >
            <TvToolSvg tool="measure" />
          </button>

          {/* 11. Zoom In / Out */}
          <button
            type="button"
            onClick={() => handleZoomStep('in')}
            title="Zoom In"
            className="w-8 h-8 rounded flex items-center justify-center text-slate-700 dark:text-[#B2B5BE] hover:bg-slate-100 dark:hover:bg-[#1E222D]"
          >
            <ZoomIn className="w-4 h-4" />
          </button>
          <button
            type="button"
            onClick={() => handleZoomStep('out')}
            title="Zoom Out"
            className="w-8 h-8 rounded flex items-center justify-center text-slate-700 dark:text-[#B2B5BE] hover:bg-slate-100 dark:hover:bg-[#1E222D]"
          >
            <ZoomOut className="w-4 h-4" />
          </button>

          <div className="w-6 border-t border-slate-200 dark:border-[#2A2E39] my-0.5" />

          {/* 12. Magnet Snap */}
          <button
            type="button"
            onClick={() => {
              setMagnetEnabled((v) => !v);
              showNotice(!magnetEnabled ? 'OHLC Magnet Snap enabled.' : 'OHLC Magnet Snap disabled.');
            }}
            title="Weak Magnet (Snap to candle OHLC)"
            className={`w-8 h-8 rounded flex items-center justify-center transition-colors ${
              magnetEnabled
                ? 'bg-[#2962FF]/15 text-[#2962FF]'
                : 'text-slate-700 dark:text-[#B2B5BE] hover:bg-slate-100 dark:hover:bg-[#1E222D]'
            }`}
          >
            <Magnet className="w-4 h-4" />
          </button>

          {/* 13. Stay in Drawing Mode */}
          <button
            type="button"
            onClick={() => {
              setStayInDrawingMode((v) => !v);
              showNotice(
                !stayInDrawingMode
                  ? 'Stay in Drawing Mode enabled.'
                  : 'Single-draw mode restored.',
              );
            }}
            title="Stay in Drawing Mode"
            className={`w-8 h-8 rounded flex items-center justify-center transition-colors ${
              stayInDrawingMode
                ? 'bg-[#2962FF]/15 text-[#2962FF]'
                : 'text-slate-700 dark:text-[#B2B5BE] hover:bg-slate-100 dark:hover:bg-[#1E222D]'
            }`}
          >
            <Pencil className="w-4 h-4" />
          </button>

          {/* 14. Lock All Drawings */}
          <button
            type="button"
            onClick={() => setLockedAll((v) => !v)}
            title={lockedAll ? 'Unlock Drawings' : 'Lock All Drawings'}
            className={`w-8 h-8 rounded flex items-center justify-center transition-colors ${
              lockedAll
                ? 'bg-[#2962FF]/15 text-[#2962FF]'
                : 'text-slate-700 dark:text-[#B2B5BE] hover:bg-slate-100 dark:hover:bg-[#1E222D]'
            }`}
          >
            {lockedAll ? <Lock className="w-4 h-4" /> : <Unlock className="w-4 h-4" />}
          </button>

          {/* 15. Hide All Drawings */}
          <button
            type="button"
            onClick={() => setHideAllDrawings((v) => !v)}
            title={hideAllDrawings ? 'Show Drawings' : 'Hide All Drawings'}
            className={`w-8 h-8 rounded flex items-center justify-center transition-colors ${
              hideAllDrawings
                ? 'bg-[#2962FF]/15 text-[#2962FF]'
                : 'text-slate-700 dark:text-[#B2B5BE] hover:bg-slate-100 dark:hover:bg-[#1E222D]'
            }`}
          >
            {hideAllDrawings ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
          </button>

          {/* Bottom Trash + Star Favorites Toggle (Screenshot 6) */}
          <div className="mt-auto flex flex-col items-center gap-1 pt-2">
            <button
              type="button"
              onClick={() => {
                if (symbolDrawings.length === 0) return;
                commitDrawings((prev) => prev.filter((d) => d.symbol !== symbol));
                setSelectedDrawingId(null);
              }}
              disabled={symbolDrawings.length === 0}
              title="Remove all drawings on chart"
              className="w-8 h-8 rounded flex items-center justify-center text-slate-400 hover:text-[#F23645] disabled:opacity-30"
            >
              <Trash2 className="w-4 h-4" />
            </button>
            <button
              type="button"
              onClick={() => setShowFavoritesBar((v) => !v)}
              title="Toggle Floating Favorites Drawing Toolbar"
              className={`w-7 h-7 rounded-md flex items-center justify-center transition-colors ${
                showFavoritesBar
                  ? 'bg-[#131722] text-white dark:bg-white dark:text-[#131722]'
                  : 'text-slate-400 hover:bg-slate-100 dark:hover:bg-[#1E222D]'
              }`}
            >
              <Star className="w-3.5 h-3.5" fill={showFavoritesBar ? 'currentColor' : 'none'} />
            </button>
          </div>

          {/* POP-OUT FLYOUT MENU: LINES / FIB / PATTERNS / PROJECTION (Screenshots 2, 3, 4) */}
          {openFlyout && (
            <div className="absolute left-11 top-1 z-50 w-72 max-h-[480px] overflow-y-auto rounded-xl border border-slate-200 dark:border-[#2A2E39] bg-white dark:bg-[#1E222D] shadow-2xl p-2">
              {flyoutGroupsMap[openFlyout].map((grp) => (
                <div key={grp} className="mb-2 last:mb-0">
                  <div className="px-2 py-1 text-[10px] font-bold uppercase tracking-wider text-slate-400">
                    {grp}
                  </div>
                  {DRAWING_CATALOG.filter((item) => item.group === grp).map((item) => {
                    const isFav = favoriteTools.includes(item.id);
                    const isAct = activeTool === item.id;
                    return (
                      <div
                        key={item.id}
                        className={`flex items-center justify-between rounded-lg px-2 py-1.5 text-xs ${
                          isAct
                            ? 'bg-[#2962FF]/12 text-[#2962FF] font-semibold'
                            : 'hover:bg-slate-100 dark:hover:bg-[#2A2E39]'
                        }`}
                      >
                        <button
                          type="button"
                          onClick={() => selectTool(item.id)}
                          className="flex-1 flex items-center gap-2.5 text-left"
                        >
                          <TvToolSvg tool={item.id} className="w-4 h-4 shrink-0" />
                          <span className="truncate">{item.label}</span>
                        </button>
                        <div className="flex items-center gap-1.5 shrink-0">
                          {item.shortcut && (
                            <span className="text-[10px] font-mono text-slate-400">
                              {item.shortcut}
                            </span>
                          )}
                          <button
                            type="button"
                            onClick={() => toggleFavoriteTool(item.id)}
                            title="Add/remove from Favorites bar"
                            className={isFav ? 'text-amber-500' : 'text-slate-300 hover:text-amber-500'}
                          >
                            <Star className="w-3.5 h-3.5" fill={isFav ? 'currentColor' : 'none'} />
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* CENTER: MAIN CHART + SVG OVERLAY + CONTEXT TOOLBAR + BOTTOM RANGE BAR */}
        <div className="flex-1 min-w-0 flex flex-col">
          <div className="relative flex-1 min-h-[450px] sm:min-h-[520px]">
            {/* Subtle Centered Ticker Watermark (Toggleable in Settings — Screenshots 1–9) */}
            {showWatermark && (
              <div className="pointer-events-none absolute inset-0 z-0 flex items-center justify-center">
                <span className="font-display text-5xl sm:text-7xl font-extrabold tracking-widest text-slate-900/[0.06] dark:text-white/[0.05] select-none">
                  {symbol}
                </span>
              </div>
            )}

            {/* TOP-LEFT FLOATING ONE-CLICK SELL / BUY PILL + OHLC LEGEND (Screenshots 1 & 5) */}
            <div className="absolute top-2 left-2.5 right-14 z-20 flex flex-col gap-1.5 pointer-events-none">
              <div className="flex flex-wrap items-center gap-2">
                {/* One-Click Buy / Sell Widget (Screenshot 1 & 5 exact pill boxes) */}
                <div className="pointer-events-auto inline-flex items-center gap-1.5">
                  <button
                    type="button"
                    onClick={() => handleOneClickOrder('SELL')}
                    className="rounded-md border border-[#F23645]/80 bg-white/95 dark:bg-[#1E222D]/95 hover:bg-[#F23645] hover:text-white text-[#F23645] px-2.5 py-0.5 text-center transition-colors shadow-xs"
                  >
                    <div className="text-[11px] font-mono font-bold tabular-nums">
                      {formatSimPrice(liveBid, decimals)}
                    </div>
                    <div className="text-[8px] uppercase font-bold leading-tight">SELL</div>
                  </button>
                  <input
                    type="number"
                    step="0.01"
                    min="0.01"
                    max="50"
                    value={lotsInput}
                    onChange={(e) => setLotsInput(e.target.value)}
                    aria-label="Quick order lot size"
                    className="w-12 text-center bg-white/85 dark:bg-[#131722]/85 rounded py-1 text-[11px] font-mono tabular-nums focus:outline-none"
                  />
                  <button
                    type="button"
                    onClick={() => handleOneClickOrder('BUY')}
                    className="rounded-md border border-[#2962FF]/80 bg-white/95 dark:bg-[#1E222D]/95 hover:bg-[#2962FF] hover:text-white text-[#2962FF] px-2.5 py-0.5 text-center transition-colors shadow-xs"
                  >
                    <div className="text-[11px] font-mono font-bold tabular-nums">
                      {formatSimPrice(liveAsk, decimals)}
                    </div>
                    <div className="text-[8px] uppercase font-bold leading-tight">BUY</div>
                  </button>
                </div>

                {/* OHLC Legend + Feed Date Coverage */}
                <div className="hidden xl:flex flex-wrap items-center gap-x-2 text-[10px] font-mono tabular-nums bg-white/75 dark:bg-[#131722]/75 px-2 py-0.5 rounded">
                  <span className="font-sans font-bold text-[#131722] dark:text-white">
                    {symbol} · {TIMEFRAMES.find((t) => t.key === timeframe)?.tvLabel || timeframe}
                  </span>
                  <span className="text-slate-500 dark:text-[#787B86]">{dateCoverageText}</span>
                  {displayBar && (
                    <span className="flex items-center gap-1.5 text-slate-600 dark:text-[#B2B5BE]">
                      <span>O {formatSimPrice(displayBar.open, decimals)}</span>
                      <span>H {formatSimPrice(displayBar.high, decimals)}</span>
                      <span>L {formatSimPrice(displayBar.low, decimals)}</span>
                      <span className={barDelta >= 0 ? 'text-[#2962FF]' : 'text-[#F23645]'}>
                        C {formatSimPrice(displayBar.close, decimals)} ({barDelta >= 0 ? '+' : ''}
                        {barDeltaPct}%)
                      </span>
                    </span>
                  )}
                </div>
              </div>

              {/* Active Drawing Instruction or Replay Status */}
              {(activeTool !== 'crosshair' || selectingCutBar || isReplayMode) && (
                <div className="inline-flex self-start items-center gap-2 rounded-md bg-[#2962FF] text-white px-2.5 py-1 text-[11px] font-semibold shadow-sm pointer-events-auto">
                  {selectingCutBar ? (
                    <span>Click any historical candle to start Bar Replay from that date</span>
                  ) : activeTool !== 'crosshair' ? (
                    <>
                      <span>
                        Tool: {DRAWING_CATALOG.find((c) => c.id === activeTool)?.label || activeTool}
                        {draftPoints.length > 0
                          ? ` (${draftPoints.length} point placed — click next)`
                          : ' — Click on chart'}
                      </span>
                      <button
                        type="button"
                        onClick={() => selectTool('crosshair')}
                        className="underline text-[10px] opacity-90 hover:opacity-100"
                      >
                        Cancel
                      </button>
                    </>
                  ) : (
                    <span>
                      REPLAY ACTIVE · {currentBar ? formatBarTimestamp(currentBar.time) : ''} (
                      {hiddenFutureCount} future bars hidden)
                    </span>
                  )}
                </div>
              )}
            </div>

            {/* SELECTED DRAWING CONTEXT TOOLBAR (Screenshot 7) */}
            {selectedDrawing && (
              <div className="hidden sm:flex absolute top-2 left-1/2 -translate-x-1/2 z-30 items-center gap-1 px-2 py-1 rounded-lg border border-slate-200 dark:border-[#2A2E39] bg-white dark:bg-[#1E222D] shadow-lg">
                <GripVertical className="w-3.5 h-3.5 text-slate-400" />
                <button
                  type="button"
                  onClick={() => openPropertiesModal(selectedDrawing)}
                  title="Position / Drawing Settings"
                  className="p-1 rounded hover:bg-slate-100 dark:hover:bg-[#2A2E39] text-slate-600 dark:text-[#B2B5BE]"
                >
                  <SlidersHorizontal className="w-3.5 h-3.5" />
                </button>
                <button
                  type="button"
                  onClick={() => {
                    const colors = ['#2962FF', '#089981', '#8B5CF6', '#F59E0B', '#F23645'];
                    const idx = colors.indexOf(selectedDrawing.fillColor || '#2962FF');
                    const nextColor = colors[(idx + 1) % colors.length];
                    commitDrawings((prev) =>
                      prev.map((d) =>
                        d.id === selectedDrawing.id
                          ? {...d, color: nextColor, fillColor: nextColor}
                          : d,
                      ),
                    );
                  }}
                  title="Cycle Fill Color"
                  className="p-1 rounded hover:bg-slate-100 dark:hover:bg-[#2A2E39] text-slate-600 dark:text-[#B2B5BE]"
                >
                  <PaintBucket className="w-3.5 h-3.5" />
                </button>
                <button
                  type="button"
                  onClick={() => openPropertiesModal(selectedDrawing)}
                  title="Properties (Inputs / Style / Visibility)"
                  className="p-1 rounded hover:bg-slate-100 dark:hover:bg-[#2A2E39] text-slate-600 dark:text-[#B2B5BE]"
                >
                  <Settings className="w-3.5 h-3.5" />
                </button>
                <button
                  type="button"
                  onClick={() => {
                    const price = selectedDrawing.points[0]?.price;
                    if (price) {
                      setNewAlertPrice(price.toFixed(decimals));
                      setAlertMenuOpen(true);
                    }
                  }}
                  title="Create Alert at Drawing Price"
                  className="p-1 rounded hover:bg-slate-100 dark:hover:bg-[#2A2E39] text-slate-600 dark:text-[#B2B5BE]"
                >
                  <Clock className="w-3.5 h-3.5" />
                </button>
                <button
                  type="button"
                  onClick={() =>
                    commitDrawings((prev) =>
                      prev.map((d) =>
                        d.id === selectedDrawing.id ? {...d, locked: !d.locked} : d,
                      ),
                    )
                  }
                  title={selectedDrawing.locked ? 'Unlock Object' : 'Lock Object'}
                  className={`p-1 rounded hover:bg-slate-100 dark:hover:bg-[#2A2E39] ${
                    selectedDrawing.locked ? 'text-[#2962FF]' : 'text-slate-600 dark:text-[#B2B5BE]'
                  }`}
                >
                  <Lock className="w-3.5 h-3.5" />
                </button>
                <button
                  type="button"
                  onClick={() => {
                    commitDrawings((prev) => prev.filter((d) => d.id !== selectedDrawing.id));
                    setSelectedDrawingId(null);
                  }}
                  title="Delete Object"
                  className="p-1 rounded hover:bg-red-50 dark:hover:bg-red-500/15 text-slate-600 dark:text-[#B2B5BE] hover:text-[#F23645]"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
                <button
                  type="button"
                  onClick={() => setRightDock('objects')}
                  title="Show in Object Tree"
                  className="p-1 rounded hover:bg-slate-100 dark:hover:bg-[#2A2E39] text-slate-600 dark:text-[#B2B5BE]"
                >
                  <MoreHorizontal className="w-3.5 h-3.5" />
                </button>
              </div>
            )}

            {/* FLOATING FAVORITES DRAWING TOOLBAR (Top-Right of Chart, Screenshots 1–9) */}
            {showFavoritesBar && (
              <div className="hidden md:flex absolute top-2 right-2 z-20 items-center gap-0.5 px-1.5 py-1 rounded-lg border border-slate-200 dark:border-[#2A2E39] bg-white/95 dark:bg-[#1E222D]/95 shadow-md">
                <GripVertical className="w-3.5 h-3.5 text-slate-400 mr-0.5" />
                {favoriteTools.map((tid) => {
                  const meta = DRAWING_CATALOG.find((c) => c.id === tid);
                  return (
                    <button
                      key={tid}
                      type="button"
                      onClick={() => selectTool(tid)}
                      title={meta?.label || tid}
                      className={`p-1 rounded transition-colors ${
                        activeTool === tid
                          ? 'bg-[#2962FF]/15 text-[#2962FF]'
                          : 'text-slate-700 dark:text-[#B2B5BE] hover:bg-slate-100 dark:hover:bg-[#2A2E39]'
                      }`}
                    >
                      <TvToolSvg tool={tid} className="w-[17px] h-[17px]" />
                    </button>
                  );
                })}
              </div>
            )}

            {/* Position / Drawing Properties Modal (Screenshot 8 exact layout) */}
            {propModalDrawingId && propDraft && (
              <div className="absolute inset-0 z-40 flex items-center justify-center bg-black/25 p-3">
                <form
                  onSubmit={applyPropertiesModal}
                  className="w-full max-w-[360px] rounded-xl border border-slate-200 dark:border-[#2A2E39] bg-white dark:bg-[#1E222D] shadow-2xl overflow-hidden text-xs"
                >
                  <div className="px-4 py-3 border-b border-slate-200 dark:border-[#2A2E39] flex items-center justify-between">
                    <div className="flex items-center gap-2 font-bold text-sm text-[#131722] dark:text-white">
                      <span>Long / Short position</span>
                      <Pencil className="w-3.5 h-3.5 text-slate-400" />
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        setPropModalDrawingId(null);
                        setPropDraft(null);
                      }}
                      className="text-slate-400 hover:text-slate-600"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>

                  {/* Modal Tabs: Inputs | Style | Visibility */}
                  <div className="px-4 pt-2 border-b border-slate-200 dark:border-[#2A2E39] flex items-center gap-5 font-semibold">
                    {(['Inputs', 'Style', 'Visibility'] as const).map((tab) => (
                      <button
                        key={tab}
                        type="button"
                        onClick={() => setPropTab(tab)}
                        className={`pb-2 border-b-2 transition-colors ${
                          propTab === tab
                            ? 'border-[#131722] dark:border-white text-[#131722] dark:text-white'
                            : 'border-transparent text-slate-500'
                        }`}
                      >
                        {tab}
                      </button>
                    ))}
                  </div>

                  <div className="p-4 space-y-3 max-h-[320px] overflow-y-auto">
                    {propTab === 'Inputs' && (
                      <>
                        <div className="grid grid-cols-12 items-center gap-2">
                          <label className="col-span-5 text-slate-600 dark:text-slate-300">Risk</label>
                          <div className="col-span-7 flex gap-1.5">
                            <input
                              type="number"
                              step="any"
                              value={propDraft.riskPercent}
                              onChange={(e) => setPropDraft({...propDraft, riskPercent: e.target.value})}
                              className="w-full rounded-md border border-slate-200 dark:border-[#2A2E39] bg-transparent px-2.5 py-1.5 font-mono"
                            />
                            <span className="px-2.5 py-1.5 rounded-md border border-slate-200 dark:border-[#2A2E39] text-slate-500">
                              %
                            </span>
                          </div>
                        </div>

                        <div className="grid grid-cols-12 items-center gap-2">
                          <label className="col-span-5 text-slate-600 dark:text-slate-300">Entry price</label>
                          <input
                            type="number"
                            step="any"
                            value={propDraft.entryPrice}
                            onChange={(e) => setPropDraft({...propDraft, entryPrice: e.target.value})}
                            className="col-span-7 rounded-md border border-slate-200 dark:border-[#2A2E39] bg-transparent px-2.5 py-1.5 font-mono"
                          />
                        </div>

                        <div className="grid grid-cols-12 items-center gap-2">
                          <label className="col-span-5 text-slate-600 dark:text-slate-300">Leverage</label>
                          <input
                            type="number"
                            step="any"
                            value={propDraft.leverage}
                            onChange={(e) => setPropDraft({...propDraft, leverage: e.target.value})}
                            className="col-span-7 rounded-md border border-slate-200 dark:border-[#2A2E39] bg-transparent px-2.5 py-1.5 font-mono"
                          />
                        </div>

                        <div className="pt-1 text-[10px] font-bold uppercase tracking-wider text-slate-400">
                          PROFIT LEVEL
                        </div>
                        <div className="grid grid-cols-12 items-center gap-2">
                          <label className="col-span-5 text-slate-600 dark:text-slate-300">Ticks</label>
                          <input
                            type="number"
                            value={propDraft.profitTicks}
                            onChange={(e) => {
                              const t = Number(e.target.value);
                              const ep = Number(propDraft.entryPrice);
                              const tickMult = symbol === 'XAUUSD' ? 1000 : 10000;
                              setPropDraft({
                                ...propDraft,
                                profitTicks: e.target.value,
                                profitPrice:
                                  Number.isFinite(t) && Number.isFinite(ep)
                                    ? (ep + t / tickMult).toFixed(decimals)
                                    : propDraft.profitPrice,
                              });
                            }}
                            className="col-span-7 rounded-md border border-slate-200 dark:border-[#2A2E39] bg-transparent px-2.5 py-1.5 font-mono"
                          />
                        </div>
                        <div className="grid grid-cols-12 items-center gap-2">
                          <label className="col-span-5 text-slate-600 dark:text-slate-300">Price</label>
                          <input
                            type="number"
                            step="any"
                            value={propDraft.profitPrice}
                            onChange={(e) => setPropDraft({...propDraft, profitPrice: e.target.value})}
                            className="col-span-7 rounded-md border border-slate-200 dark:border-[#2A2E39] bg-transparent px-2.5 py-1.5 font-mono"
                          />
                        </div>

                        <div className="pt-1 text-[10px] font-bold uppercase tracking-wider text-slate-400">
                          STOP LEVEL
                        </div>
                        <div className="grid grid-cols-12 items-center gap-2">
                          <label className="col-span-5 text-slate-600 dark:text-slate-300">Ticks</label>
                          <input
                            type="number"
                            value={propDraft.stopTicks}
                            onChange={(e) => {
                              const t = Number(e.target.value);
                              const ep = Number(propDraft.entryPrice);
                              const tickMult = symbol === 'XAUUSD' ? 1000 : 10000;
                              setPropDraft({
                                ...propDraft,
                                stopTicks: e.target.value,
                                stopPrice:
                                  Number.isFinite(t) && Number.isFinite(ep)
                                    ? (ep - t / tickMult).toFixed(decimals)
                                    : propDraft.stopPrice,
                              });
                            }}
                            className="col-span-7 rounded-md border border-slate-200 dark:border-[#2A2E39] bg-transparent px-2.5 py-1.5 font-mono"
                          />
                        </div>
                        <div className="grid grid-cols-12 items-center gap-2">
                          <label className="col-span-5 text-slate-600 dark:text-slate-300">Price</label>
                          <input
                            type="number"
                            step="any"
                            value={propDraft.stopPrice}
                            onChange={(e) => setPropDraft({...propDraft, stopPrice: e.target.value})}
                            className="col-span-7 rounded-md border border-slate-200 dark:border-[#2A2E39] bg-transparent px-2.5 py-1.5 font-mono"
                          />
                        </div>

                        <div className="grid grid-cols-12 items-center gap-2">
                          <label className="col-span-5 text-slate-600 dark:text-slate-300">QTY precision</label>
                          <select
                            value={propDraft.qtyPrecision}
                            onChange={(e) =>
                              setPropDraft({
                                ...propDraft,
                                qtyPrecision: e.target.value as 'Default' | '0.01' | '0.1' | '1',
                              })
                            }
                            className="col-span-7 rounded-md border border-slate-200 dark:border-[#2A2E39] bg-transparent px-2.5 py-1.5"
                          >
                            <option value="Default">Default</option>
                            <option value="0.01">0.01</option>
                            <option value="0.1">0.1</option>
                            <option value="1">1</option>
                          </select>
                        </div>
                      </>
                    )}

                    {propTab === 'Style' && (
                      <div className="space-y-3">
                        <div>
                          <label className="block text-[11px] font-semibold text-slate-500 mb-2">
                            Profit Zone / Accent Color
                          </label>
                          <div className="flex items-center gap-2">
                            {['#2962FF', '#089981', '#8B5CF6', '#F59E0B', '#F23645'].map((c) => (
                              <button
                                key={c}
                                type="button"
                                onClick={() => setPropDraft({...propDraft, fillColor: c})}
                                style={{backgroundColor: c}}
                                className={`w-7 h-7 rounded-full border-2 ${
                                  propDraft.fillColor === c ? 'border-[#131722] dark:border-white scale-110' : 'border-transparent'
                                }`}
                              />
                            ))}
                          </div>
                        </div>
                      </div>
                    )}

                    {propTab === 'Visibility' && (
                      <div className="space-y-2.5">
                        <label className="flex items-center justify-between cursor-pointer">
                          <span>Show drawing on chart</span>
                          <input
                            type="checkbox"
                            checked={propDraft.visible}
                            onChange={(e) => setPropDraft({...propDraft, visible: e.target.checked})}
                            className="accent-[#2962FF]"
                          />
                        </label>
                        <label className="flex items-center justify-between cursor-pointer">
                          <span>Lock drawing coordinates</span>
                          <input
                            type="checkbox"
                            checked={propDraft.locked}
                            onChange={(e) => setPropDraft({...propDraft, locked: e.target.checked})}
                            className="accent-[#2962FF]"
                          />
                        </label>
                      </div>
                    )}
                  </div>

                  <div className="px-4 py-3 border-t border-slate-200 dark:border-[#2A2E39] flex items-center justify-between">
                    <span className="px-2.5 py-1 rounded border border-slate-200 dark:border-[#2A2E39] text-slate-500">
                      Template ▾
                    </span>
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => {
                          setPropModalDrawingId(null);
                          setPropDraft(null);
                        }}
                        className="px-3.5 py-1.5 rounded-md border border-slate-200 dark:border-[#2A2E39] font-semibold"
                      >
                        Cancel
                      </button>
                      <button
                        type="submit"
                        className="px-4 py-1.5 rounded-md bg-[#131722] dark:bg-[#2962FF] text-white font-semibold"
                      >
                        Ok
                      </button>
                    </div>
                  </div>
                </form>
              </div>
            )}

            {/* Inline Text Note Input Modal */}
            {pendingTextPoint && (
              <form
                onSubmit={handleSubmitTextAnnotation}
                className="absolute top-16 left-1/2 -translate-x-1/2 z-30 flex items-center gap-2 rounded-lg border border-slate-200 dark:border-[#2A2E39] bg-white dark:bg-[#1E222D] shadow-xl p-2"
              >
                <input
                  type="text"
                  value={pendingTextValue}
                  onChange={(e) => setPendingTextValue(e.target.value)}
                  placeholder="Enter chart label..."
                  className="px-2.5 py-1 text-xs rounded border border-slate-200 dark:border-[#2A2E39] bg-slate-50 dark:bg-[#131722] focus:outline-none"
                  autoFocus
                />
                <button type="submit" className="px-2.5 py-1 rounded bg-[#2962FF] text-white text-xs font-semibold">
                  Place
                </button>
                <button
                  type="button"
                  onClick={() => setPendingTextPoint(null)}
                  className="px-2 py-1 text-xs text-slate-400"
                >
                  Cancel
                </button>
              </form>
            )}

            {/* Loading / Error State */}
            {loadingChart && (
              <div className="absolute inset-0 z-20 flex items-center justify-center bg-white/80 dark:bg-[#131722]/80 backdrop-blur-xs text-xs font-medium">
                Loading real {symbol} 2024–2026 market data...
              </div>
            )}
            {feedError && !loadingChart && (
              <div className="absolute inset-0 z-20 flex items-center justify-center text-xs text-[#F23645]">
                {feedError}
              </div>
            )}

            {/* Main Chart Container + Interactive SVG Drawing Layer */}
            <div
              className={`relative w-full h-[450px] sm:h-[520px] ${
                activeTool !== 'crosshair' || selectingCutBar ? 'cursor-crosshair' : ''
              }`}
              onPointerDown={handleChartPointerDown}
              onPointerMove={handleChartPointerMove}
              onPointerUp={handleChartPointerUp}
            >
              <div ref={chartContainerRef} className="w-full h-full" />
              <DrawingOverlay
                chart={chartApiRef.current}
                mainSeries={mainSeriesRef.current}
                candles={visibleCandles}
                drawings={symbolDrawings}
                draftPoints={draftPoints}
                cursorPoint={cursorPoint}
                activeTool={activeTool}
                selectedId={selectedDrawingId}
                hideAll={hideAllDrawings}
                decimals={decimals}
                pipSize={pipSize}
                symbol={symbol}
                accountBalance={balance}
                currentPrice={liveBid}
                width={chartSize.width}
                height={chartSize.height}
                renderTick={overlayTick}
                onSelectDrawing={setSelectedDrawingId}
                onStartHandleDrag={(drawingId, handle) => {
                  setDraggingHandle({drawingId, handle});
                }}
              />

              {/* Subtle Bottom-Left TradingView Badge (Screenshots 1, 5, 6, 8, 9) */}
              <div className="pointer-events-none absolute bottom-8 left-3 z-10 inline-flex items-center gap-1 text-[11px] font-bold tracking-tight text-slate-800/75 dark:text-white/65">
                <svg viewBox="0 0 36 28" className="w-5 h-3.5 fill-current">
                  <path d="M14 22H7V11H0V4h14v18zM28 4h-8.5l-6 18h8.5L28 4zm4 7a3.5 3.5 0 1 1 0-7 3.5 3.5 0 0 1 0 7z" />
                </svg>
                <span>TradingView</span>
              </div>
            </div>
          </div>

          {/* Optional RSI(14) Lower Sub-Pane */}
          {showRsi && (
            <div className="relative h-28 border-t border-slate-200 dark:border-[#2A2E39]">
              <div className="pointer-events-none absolute top-1 left-2.5 z-10 text-[10px] font-mono font-bold text-[#7E57C2]">
                RSI (14, close)
              </div>
              <div ref={rsiContainerRef} className="w-full h-full" />
            </div>
          )}

          {/* BAR REPLAY CONTROLS */}
          {(isReplayMode || selectingCutBar) && (
            <div className="border-t border-slate-200 dark:border-[#2A2E39] bg-slate-50 dark:bg-[#1E222D] px-3 py-2 flex flex-wrap items-center justify-between gap-2.5">
              <div className="flex items-center gap-1.5">
                <button
                  type="button"
                  onClick={() => {
                    setSelectingCutBar((v) => !v);
                    setActiveTool((t) => (t === 'cut' ? 'crosshair' : 'cut'));
                    setIsPlaying(false);
                  }}
                  className={`inline-flex items-center gap-1 px-2.5 py-1 rounded text-[11px] font-semibold ${
                    selectingCutBar
                      ? 'bg-[#2962FF] text-white'
                      : 'bg-white dark:bg-[#131722] border border-slate-200 dark:border-[#2A2E39]'
                  }`}
                >
                  <Scissors className="w-3.5 h-3.5 text-[#2962FF]" />
                  <span>Jump to Bar</span>
                </button>
                <button
                  type="button"
                  onClick={stepBackward}
                  disabled={replayIndex <= 10}
                  title="Step back 1 bar"
                  className="p-1.5 rounded bg-white dark:bg-[#131722] border border-slate-200 dark:border-[#2A2E39] disabled:opacity-40"
                >
                  <ChevronLeft className="w-3.5 h-3.5" />
                </button>
                <button
                  type="button"
                  onClick={() => setIsPlaying((p) => !p)}
                  className="inline-flex items-center gap-1 px-3 py-1 rounded bg-[#2962FF] text-white text-xs font-bold"
                >
                  {isPlaying ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5" />}
                  <span>{isPlaying ? 'Pause' : 'Play'}</span>
                </button>
                <button
                  type="button"
                  onClick={stepForward}
                  disabled={replayIndex >= allCandles.length - 1}
                  title="Step forward 1 bar into future"
                  className="inline-flex items-center gap-1 px-2.5 py-1 rounded bg-white dark:bg-[#131722] border border-slate-200 dark:border-[#2A2E39] text-[11px] font-semibold disabled:opacity-40"
                >
                  <span>Forward</span>
                  <ChevronRight className="w-3.5 h-3.5" />
                </button>
                <select
                  value={speedIdx}
                  onChange={(e) => setSpeedIdx(Number(e.target.value))}
                  aria-label="Replay speed"
                  className="rounded bg-white dark:bg-[#131722] border border-slate-200 dark:border-[#2A2E39] px-2 py-1 text-[11px] font-mono"
                >
                  {SPEEDS.map((sp, idx) => (
                    <option key={sp.label} value={idx}>
                      {sp.label}
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex-1 min-w-[180px] flex items-center gap-2">
                <span className="text-[10px] font-mono text-slate-500 whitespace-nowrap">
                  {currentBar ? formatBarTimestamp(currentBar.time) : '—'}
                </span>
                <input
                  type="range"
                  min={Math.min(10, Math.max(0, allCandles.length - 1))}
                  max={Math.max(0, allCandles.length - 1)}
                  value={replayIndex}
                  onChange={(e) => {
                    const idx = Number(e.target.value);
                    setIsPlaying(false);
                    setSelectingCutBar(false);
                    setReplayIndex(idx);
                    setIsReplayMode(idx < allCandles.length - 1);
                  }}
                  aria-label="Replay timeline scrubber"
                  className="w-full accent-[#2962FF] cursor-pointer h-1.5"
                />
                <span className="text-[10px] font-mono tabular-nums text-slate-500 whitespace-nowrap">
                  {replayIndex + 1}/{allCandles.length}
                </span>
              </div>

              <div className="flex items-center gap-1">
                {[30, 90, 200].map((bars) => (
                  <button
                    key={bars}
                    type="button"
                    onClick={() => jumpBackBars(bars)}
                    disabled={allCandles.length <= bars + 10}
                    className="px-2 py-1 rounded bg-white dark:bg-[#131722] border border-slate-200 dark:border-[#2A2E39] text-[10px] font-mono font-semibold disabled:opacity-35"
                  >
                    -{bars}
                  </button>
                ))}
                <button
                  type="button"
                  onClick={jumpToLive}
                  className="inline-flex items-center gap-1 px-2.5 py-1 rounded bg-emerald-500/15 text-[#089981] text-[11px] font-bold"
                >
                  <SkipForward className="w-3 h-3" />
                  <span>Live</span>
                </button>
              </div>
            </div>
          )}

          {/* BOTTOM TIME-RANGE + GO TO DATE + UTC CLOCK BAR (Screenshots 1–9) */}
          <div className="relative h-9 px-3 border-t border-slate-200 dark:border-[#2A2E39] bg-white dark:bg-[#131722] flex items-center justify-between gap-2 text-xs">
            <div className="flex items-center gap-0.5 overflow-x-auto no-scrollbar">
              {['1D', '5D', '1M', '3M', '6M', 'YTD', '1Y', 'All'].map((rng) => (
                <button
                  key={rng}
                  type="button"
                  onClick={() => applyDateRangePreset(rng)}
                  className={`px-2 py-0.5 rounded text-[11px] font-semibold transition-colors whitespace-nowrap ${
                    activeRangeBtn === rng
                      ? 'text-[#2962FF] bg-[#2962FF]/10'
                      : 'text-slate-700 dark:text-[#B2B5BE] hover:text-[#131722] dark:hover:text-white'
                  }`}
                >
                  {rng}
                </button>
              ))}

              <div className="h-4 w-px bg-slate-200 dark:bg-[#2A2E39] mx-1.5" />

              {/* Go To Date Calendar Picker */}
              <div className="relative">
                <button
                  type="button"
                  onClick={() => setGoToDateOpen((v) => !v)}
                  title="Go to exact date (2024–2026)"
                  className="p-1 rounded hover:bg-slate-100 dark:hover:bg-[#1E222D] text-slate-600 dark:text-[#B2B5BE]"
                >
                  <Calendar className="w-3.5 h-3.5" />
                </button>

                {goToDateOpen && (
                  <div className="fixed sm:absolute left-4 sm:left-0 bottom-12 sm:bottom-9 z-50 w-64 rounded-xl border border-slate-200 dark:border-[#2A2E39] bg-white dark:bg-[#1E222D] shadow-xl p-3 space-y-2.5">
                    <div className="flex items-center justify-between text-xs font-bold">
                      <span>Go to Date (2024–2026)</span>
                      <button type="button" onClick={() => setGoToDateOpen(false)} className="text-slate-400">
                        <X className="w-3.5 h-3.5" />
                      </button>
                    </div>
                    <input
                      type="date"
                      min="2024-01-01"
                      max="2026-12-31"
                      value={goToDateValue}
                      onChange={(e) => setGoToDateValue(e.target.value)}
                      className="w-full rounded-lg border border-slate-200 dark:border-[#2A2E39] bg-slate-50 dark:bg-[#131722] px-2.5 py-1.5 text-xs font-mono"
                    />
                    <div className="grid grid-cols-2 gap-1.5">
                      <button
                        type="button"
                        onClick={() => handleGoToDate('zoom')}
                        className="py-1.5 rounded-lg border border-slate-200 dark:border-[#2A2E39] text-[11px] font-semibold hover:border-[#2962FF]"
                      >
                        Zoom View
                      </button>
                      <button
                        type="button"
                        onClick={() => handleGoToDate('replay')}
                        className="py-1.5 rounded-lg bg-[#2962FF] text-white text-[11px] font-semibold"
                      >
                        Replay Here
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>

            <div className="flex items-center gap-3 text-[11px] font-mono tabular-nums text-slate-600 dark:text-[#B2B5BE] shrink-0">
              <span>{utcNow} UTC</span>
            </div>
          </div>
        </div>

        {/* EXPANDABLE RIGHT DRAWER PANEL (Screenshot 9 Watchlist / Order Ticket / Alerts / Object Tree) */}
        {rightDock && (
          <div className="hidden lg:flex w-64 xl:w-72 shrink-0 border-l border-slate-200 dark:border-[#2A2E39] bg-white dark:bg-[#131722] flex-col">
            <div className="px-3 py-2 border-b border-slate-200 dark:border-[#2A2E39] flex items-center justify-between text-xs">
              <span className="font-semibold text-slate-500 dark:text-[#B2B5BE]">
                {rightDock === 'watchlist'
                  ? 'Symbol'
                  : rightDock === 'order'
                    ? 'Order Ticket'
                    : rightDock === 'alerts'
                      ? `Alerts (${symbolAlerts.length})`
                      : `Object Tree (${symbolDrawings.length})`}
              </span>
              <button type="button" onClick={() => setRightDock(null)} className="text-slate-400 hover:text-slate-600">
                <X className="w-3.5 h-3.5" />
              </button>
            </div>

            {/* CATEGORIZED WATCHLIST MATCHING SCREENSHOT 9 */}
            {rightDock === 'watchlist' && (
              <div className="flex-1 flex flex-col min-h-0">
                <div className="flex-1 overflow-y-auto py-1">
                  {WATCHLIST_GROUPS.map((grp) => {
                    const isCollapsed = Boolean(collapsedWatchlistGroups[grp.id]);
                    return (
                      <div key={grp.id} className="mb-1">
                        <button
                          type="button"
                          onClick={() =>
                            setCollapsedWatchlistGroups((p) => ({...p, [grp.id]: !isCollapsed}))
                          }
                          className="w-full px-3 py-1.5 flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-wider text-slate-500 dark:text-[#787B86] hover:text-[#131722] dark:hover:text-white"
                        >
                          <ChevronDown
                            className={`w-3 h-3 transition-transform ${isCollapsed ? '-rotate-90' : ''}`}
                          />
                          <span>{grp.label}</span>
                        </button>

                        {!isCollapsed &&
                          grp.symbols.map((item) => {
                            const q = quotes.find((x) => x.symbol === item.key);
                            const up = (q?.changePercent ?? 0) >= 0;
                            const isFlagged = Boolean(flaggedSymbols[item.key]);
                            const isActiveSym = symbol === item.key;
                            return (
                              <div
                                key={item.key}
                                className={`group flex items-center justify-between px-2 py-1.5 text-xs transition-colors ${
                                  isActiveSym
                                    ? 'bg-[#2962FF]/10'
                                    : 'hover:bg-slate-50 dark:hover:bg-[#1E222D]'
                                }`}
                              >
                                <div className="flex items-center gap-1.5 min-w-0">
                                  <button
                                    type="button"
                                    onClick={() =>
                                      setFlaggedSymbols((prev) => ({
                                        ...prev,
                                        [item.key]: !prev[item.key],
                                      }))
                                    }
                                    title="Flag symbol"
                                    className={`shrink-0 ${
                                      isFlagged
                                        ? 'text-[#F23645]'
                                        : 'text-transparent group-hover:text-slate-300'
                                    }`}
                                  >
                                    <Flag className="w-3 h-3" fill={isFlagged ? 'currentColor' : 'none'} />
                                  </button>

                                  <button
                                    type="button"
                                    onClick={() => setSymbol(item.key)}
                                    className="flex items-center gap-2 min-w-0 text-left"
                                  >
                                    <SymbolBadge symbol={item.key} size={18} />
                                    <span className="font-semibold text-[#131722] dark:text-white truncate">
                                      {item.key}
                                    </span>
                                    <span className="w-1.5 h-1.5 rounded-full bg-slate-300 dark:bg-slate-600 shrink-0" />
                                  </button>
                                </div>

                                <button
                                  type="button"
                                  onClick={() => setSymbol(item.key)}
                                  className="text-right font-mono tabular-nums text-[11px] shrink-0"
                                >
                                  <div className="font-semibold">
                                    {q ? q.price.toFixed(q.decimals) : '—'}
                                  </div>
                                  <div className={`text-[10px] ${up ? 'text-[#089981]' : 'text-[#F23645]'}`}>
                                    {q ? `${up ? '+' : ''}${q.changePercent.toFixed(2)}%` : ''}
                                  </div>
                                </button>
                              </div>
                            );
                          })}
                      </div>
                    );
                  })}
                </div>

                {/* Bottom Active Symbol Summary Bar (Screenshot 9 bottom right) */}
                <div className="border-t border-slate-200 dark:border-[#2A2E39] px-3 py-2.5 flex items-center justify-between">
                  <button
                    type="button"
                    onClick={() => setSymbolMenuOpen(true)}
                    className="flex items-center gap-2 text-xs font-bold text-[#131722] dark:text-white"
                  >
                    <SymbolBadge symbol={symbol} size={22} />
                    <span>{symbol}</span>
                  </button>
                  <div className="flex items-center gap-2 text-slate-500">
                    <button
                      type="button"
                      onClick={() => setRightDock('order')}
                      title="Open Order Ticket"
                      className="hover:text-[#2962FF]"
                    >
                      <SlidersHorizontal className="w-3.5 h-3.5" />
                    </button>
                    <button
                      type="button"
                      onClick={() => setTradePanelOpen((v) => !v)}
                      title="Toggle Positions Blotter"
                      className="hover:text-[#2962FF]"
                    >
                      <MoreHorizontal className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            )}

            {rightDock === 'order' && (
              <form onSubmit={handlePlaceOrder} className="p-3.5 space-y-3 flex-1 overflow-y-auto">
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setOrderSide('SELL')}
                    className={`rounded-lg py-2 px-2.5 border text-left transition-colors ${
                      orderSide === 'SELL'
                        ? 'border-[#F23645] bg-[#F23645] text-white'
                        : 'border-slate-200 dark:border-[#2A2E39] bg-slate-50 dark:bg-[#1E222D]'
                    }`}
                  >
                    <div className="text-[10px] uppercase font-bold opacity-80">Sell</div>
                    <div className="font-mono text-xs font-bold tabular-nums">
                      {formatSimPrice(liveBid, decimals)}
                    </div>
                  </button>
                  <button
                    type="button"
                    onClick={() => setOrderSide('BUY')}
                    className={`rounded-lg py-2 px-2.5 border text-right transition-colors ${
                      orderSide === 'BUY'
                        ? 'border-[#2962FF] bg-[#2962FF] text-white'
                        : 'border-slate-200 dark:border-[#2A2E39] bg-slate-50 dark:bg-[#1E222D]'
                    }`}
                  >
                    <div className="text-[10px] uppercase font-bold opacity-80">Buy</div>
                    <div className="font-mono text-xs font-bold tabular-nums">
                      {formatSimPrice(liveAsk, decimals)}
                    </div>
                  </button>
                </div>

                <div className="grid grid-cols-2 gap-1 rounded-lg bg-slate-100 dark:bg-[#1E222D] p-1">
                  {(['MARKET', 'LIMIT'] as const).map((t) => (
                    <button
                      key={t}
                      type="button"
                      onClick={() => {
                        setOrderType(t);
                        if (t === 'LIMIT' && currentBar) {
                          setLimitPriceInput(currentBar.close.toFixed(decimals));
                        }
                      }}
                      className={`py-1 rounded text-[11px] font-bold ${
                        orderType === t ? 'bg-white dark:bg-[#2A2E39] shadow-xs' : 'text-slate-500'
                      }`}
                    >
                      {t === 'MARKET' ? 'Market' : 'Limit'}
                    </button>
                  ))}
                </div>

                {orderType === 'LIMIT' && (
                  <div>
                    <label className="block text-[11px] font-medium text-slate-500 mb-1">Limit Price</label>
                    <input
                      type="number"
                      step="any"
                      required
                      value={limitPriceInput}
                      onChange={(e) => setLimitPriceInput(e.target.value)}
                      className="w-full rounded-lg border border-slate-200 dark:border-[#2A2E39] bg-slate-50 dark:bg-[#1E222D] px-2.5 py-1.5 text-xs font-mono"
                    />
                  </div>
                )}

                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="text-[11px] font-medium text-slate-500">Lots</label>
                    <div className="flex gap-1">
                      {['0.05', '0.10', '0.50', '1.00'].map((p) => (
                        <button
                          key={p}
                          type="button"
                          onClick={() => setLotsInput(p)}
                          className={`px-1.5 py-0.5 rounded text-[10px] font-mono ${
                            lotsInput === p ? 'bg-[#2962FF] text-white' : 'bg-slate-100 dark:bg-[#1E222D]'
                          }`}
                        >
                          {p}
                        </button>
                      ))}
                    </div>
                  </div>
                  <input
                    type="number"
                    step="0.01"
                    min="0.01"
                    max="50"
                    required
                    value={lotsInput}
                    onChange={(e) => setLotsInput(e.target.value)}
                    className="w-full rounded-lg border border-slate-200 dark:border-[#2A2E39] bg-slate-50 dark:bg-[#1E222D] px-2.5 py-1.5 text-xs font-mono"
                  />
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block text-[11px] font-medium text-[#F23645] mb-1">Stop Loss</label>
                    <input
                      type="number"
                      step="any"
                      value={slInput}
                      onChange={(e) => setSlInput(e.target.value)}
                      placeholder="Optional"
                      className="w-full rounded-lg border border-slate-200 dark:border-[#2A2E39] bg-slate-50 dark:bg-[#1E222D] px-2 py-1.5 text-xs font-mono"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-medium text-[#089981] mb-1">Take Profit</label>
                    <input
                      type="number"
                      step="any"
                      value={tpInput}
                      onChange={(e) => setTpInput(e.target.value)}
                      placeholder="Optional"
                      className="w-full rounded-lg border border-slate-200 dark:border-[#2A2E39] bg-slate-50 dark:bg-[#1E222D] px-2 py-1.5 text-xs font-mono"
                    />
                  </div>
                </div>

                <div className="flex items-center justify-between text-[10px]">
                  <span className="text-slate-500">Quick R:R Preset</span>
                  <div className="flex gap-1">
                    {[2, 3, 4].map((rr) => (
                      <button
                        key={rr}
                        type="button"
                        onClick={() => applyPositionPreset(orderSide, rr)}
                        className="px-2 py-0.5 rounded bg-slate-100 dark:bg-[#1E222D] font-mono font-semibold hover:text-[#2962FF]"
                      >
                        1:{rr}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="rounded-lg bg-slate-50 dark:bg-[#1E222D] border border-slate-200 dark:border-[#2A2E39] p-2.5 space-y-1 text-[11px] font-mono tabular-nums">
                  <div className="flex justify-between">
                    <span className="text-slate-500">Est. Risk</span>
                    <span className="text-[#F23645] font-semibold">
                      {riskUsd > 0 ? `-$${riskUsd.toFixed(2)}` : '—'}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Est. Reward</span>
                    <span className="text-[#089981] font-semibold">
                      {rewardUsd > 0 ? `+$${rewardUsd.toFixed(2)}` : '—'}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Risk : Reward</span>
                    <span className="font-bold">1 : {rrDisplay}</span>
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={!currentBar}
                  className={`w-full py-2.5 rounded-lg text-xs font-bold text-white transition-colors ${
                    orderSide === 'BUY' ? 'bg-[#2962FF] hover:bg-[#1E53E5]' : 'bg-[#F23645] hover:bg-[#D92D3B]'
                  }`}
                >
                  {orderType === 'MARKET' ? 'Market' : 'Limit'} {orderSide} {lotsInput} {symbol}
                </button>
              </form>
            )}

            {rightDock === 'alerts' && (
              <div className="p-3 space-y-2 overflow-y-auto flex-1">
                {symbolAlerts.length === 0 ? (
                  <p className="text-xs text-slate-500 py-4 text-center">
                    No price alerts on {symbol}. Use the Alert button above the chart to add one.
                  </p>
                ) : (
                  symbolAlerts.map((al) => (
                    <div
                      key={al.id}
                      className="rounded-lg border border-slate-200 dark:border-[#2A2E39] p-2.5 flex items-center justify-between text-xs"
                    >
                      <div>
                        <div className="font-mono font-bold">
                          {al.price.toFixed(decimals)}{' '}
                          <span className={al.triggered ? 'text-[#089981]' : 'text-amber-500'}>
                            {al.triggered ? 'TRIGGERED' : 'ACTIVE'}
                          </span>
                        </div>
                        {al.note && <div className="text-[10px] text-slate-500">{al.note}</div>}
                      </div>
                      <button
                        type="button"
                        onClick={() => setAlerts((prev) => prev.filter((x) => x.id !== al.id))}
                        className="text-slate-400 hover:text-[#F23645]"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ))
                )}
              </div>
            )}

            {rightDock === 'objects' && (
              <div className="p-3 space-y-1.5 overflow-y-auto flex-1">
                {symbolDrawings.length === 0 ? (
                  <p className="text-xs text-slate-500 py-4 text-center">
                    No drawings on {symbol} yet. Select a tool on the left rail to annotate.
                  </p>
                ) : (
                  symbolDrawings.map((drw) => (
                    <div
                      key={drw.id}
                      onClick={() => setSelectedDrawingId(drw.id)}
                      className={`rounded-lg border px-2.5 py-2 flex items-center justify-between text-xs cursor-pointer ${
                        selectedDrawingId === drw.id
                          ? 'border-[#2962FF] bg-[#2962FF]/10'
                          : 'border-slate-200 dark:border-[#2A2E39]'
                      }`}
                    >
                      <div className="flex items-center gap-2 min-w-0">
                        <TvToolSvg tool={drw.tool} className="w-4 h-4 shrink-0" />
                        <span className="truncate font-medium">
                          {DRAWING_CATALOG.find((c) => c.id === drw.tool)?.label || drw.tool}
                        </span>
                      </div>
                      <div className="flex items-center gap-1.5 shrink-0">
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            openPropertiesModal(drw);
                          }}
                          title="Properties"
                          className="text-slate-400 hover:text-[#2962FF]"
                        >
                          <Settings className="w-3.5 h-3.5" />
                        </button>
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            commitDrawings((prev) =>
                              prev.map((x) => (x.id === drw.id ? {...x, visible: !x.visible} : x)),
                            );
                          }}
                          className="text-slate-400 hover:text-[#2962FF]"
                        >
                          {drw.visible ? <Eye className="w-3.5 h-3.5" /> : <EyeOff className="w-3.5 h-3.5" />}
                        </button>
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            commitDrawings((prev) => prev.filter((x) => x.id !== drw.id));
                          }}
                          className="text-slate-400 hover:text-[#F23645]"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  ))
                )}
              </div>
            )}
          </div>
        )}

        {/* RIGHT VERTICAL ICON DOCK (Exact icons matching Screenshots 1, 6, 9) */}
        <div className="hidden lg:flex w-11 shrink-0 border-l border-slate-200 dark:border-[#2A2E39] bg-white dark:bg-[#131722] py-2 flex-col items-center gap-2">
          {(
            [
              {id: 'watchlist' as const, icon: List, label: 'Watchlist & Details'},
              {id: 'alerts' as const, icon: Clock, label: 'Alerts'},
              {id: 'objects' as const, icon: Layers, label: 'Object Tree'},
            ] as const
          ).map((dock) => {
            const Icon = dock.icon;
            const active = rightDock === dock.id;
            return (
              <button
                key={dock.id}
                type="button"
                onClick={() => setRightDock((curr) => (curr === dock.id ? null : dock.id))}
                title={dock.label}
                className={`w-8 h-8 rounded flex items-center justify-center transition-colors ${
                  active
                    ? 'bg-[#2962FF]/15 text-[#2962FF]'
                    : 'text-slate-700 dark:text-[#B2B5BE] hover:bg-slate-100 dark:hover:bg-[#1E222D]'
                }`}
              >
                <Icon className="w-4 h-4" />
              </button>
            );
          })}

          <div className="w-6 border-t border-slate-200 dark:border-[#2A2E39] my-0.5" />

          <button
            type="button"
            onClick={() => setRightDock((curr) => (curr === 'order' ? null : 'order'))}
            title="Order Ticket"
            className={`w-8 h-8 rounded flex items-center justify-center transition-colors ${
              rightDock === 'order'
                ? 'bg-[#2962FF]/15 text-[#2962FF]'
                : 'text-slate-700 dark:text-[#B2B5BE] hover:bg-slate-100 dark:hover:bg-[#1E222D]'
            }`}
          >
            <TrendingUp className="w-4 h-4" />
          </button>

          <button
            type="button"
            onClick={() => selectTool('longpos')}
            title="Quick Long Position Tool"
            className="w-8 h-8 rounded flex items-center justify-center text-slate-700 dark:text-[#B2B5BE] hover:bg-slate-100 dark:hover:bg-[#1E222D]"
          >
            <Target className="w-4 h-4" />
          </button>

          <button
            type="button"
            onClick={() => setIndicatorsMenuOpen((v) => !v)}
            title="Indicators"
            className="w-8 h-8 rounded flex items-center justify-center text-slate-700 dark:text-[#B2B5BE] hover:bg-slate-100 dark:hover:bg-[#1E222D]"
          >
            <Sparkles className="w-4 h-4" />
          </button>

          <button
            type="button"
            onClick={() => setAlertMenuOpen((v) => !v)}
            title="Add Price Alert"
            className="w-8 h-8 rounded flex items-center justify-center text-slate-700 dark:text-[#B2B5BE] hover:bg-slate-100 dark:hover:bg-[#1E222D]"
          >
            <Bell className="w-4 h-4" />
          </button>

          <div className="mt-auto flex flex-col items-center gap-2">
            <button
              type="button"
              onClick={() => setTradePanelOpen((v) => !v)}
              title="Toggle Trading Blotter"
              className="w-8 h-8 rounded-full bg-[#131722] dark:bg-white text-white dark:text-[#131722] flex items-center justify-center shadow-xs"
            >
              <Square className="w-3.5 h-3.5" />
            </button>
            <button
              type="button"
              onClick={() => setUpgradeModalOpen(true)}
              title="Keyboard Shortcuts & Workspace Guide"
              className="w-8 h-8 rounded flex items-center justify-center text-slate-500 hover:text-[#131722] dark:hover:text-white"
            >
              <HelpCircle className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* ===================================================================== */}
      {/* BOTTOM TRADING BLOTTER (Positions / Orders / History + Account Stats) */}
      {/* ===================================================================== */}
      {tradePanelOpen && (
        <div className="border-t border-slate-200 dark:border-[#2A2E39] bg-white dark:bg-[#131722]">
          <div className="px-3.5 py-2 border-b border-slate-200 dark:border-[#2A2E39] bg-slate-50 dark:bg-[#1E222D] flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-1.5">
              {[
                {id: 'positions' as const, label: `Positions (${openPositions.length})`},
                {id: 'orders' as const, label: `Orders (${pendingOrders.length})`},
                {id: 'history' as const, label: `History (${closedTrades.length})`},
              ].map((t) => (
                <button
                  key={t.id}
                  type="button"
                  onClick={() => setBottomTab(t.id)}
                  className={`px-2.5 py-1 rounded text-xs font-semibold transition-colors ${
                    bottomTab === t.id
                      ? 'bg-[#2962FF] text-white'
                      : 'text-slate-600 dark:text-[#B2B5BE] hover:text-[#131722] dark:hover:text-white'
                  }`}
                >
                  {t.label}
                </button>
              ))}
            </div>

            <div className="flex flex-wrap items-center gap-x-5 gap-y-1 text-xs font-mono tabular-nums">
              <div>
                <span className="text-slate-500 mr-1.5">Balance</span>
                <strong>
                  ${balance.toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})}
                </strong>
              </div>
              <div>
                <span className="text-slate-500 mr-1.5">Equity</span>
                <strong>
                  ${equity.toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})}
                </strong>
              </div>
              <div>
                <span className="text-slate-500 mr-1.5">Open P&amp;L</span>
                <strong className={unrealizedPnl >= 0 ? 'text-[#089981]' : 'text-[#F23645]'}>
                  {unrealizedPnl >= 0 ? '+' : ''}${unrealizedPnl.toFixed(2)}
                </strong>
              </div>
              <div>
                <span className="text-slate-500 mr-1.5">Realized</span>
                <strong className={realizedPnl >= 0 ? 'text-[#089981]' : 'text-[#F23645]'}>
                  {realizedPnl >= 0 ? '+' : ''}${realizedPnl.toFixed(2)}
                </strong>
              </div>
              <div>
                <span className="text-slate-500 mr-1.5">Win Rate</span>
                <strong className="text-[#2962FF]">{winRate}%</strong>
              </div>
              <button
                type="button"
                onClick={() => {
                  setBalance(startingBalance);
                  setPositions([]);
                  setClosedTrades([]);
                  showNotice(`Simulator account reset to $${startingBalance.toLocaleString()}`);
                }}
                className="font-sans inline-flex items-center gap-1 px-2 py-0.5 rounded border border-slate-200 dark:border-[#2A2E39] text-[11px] font-semibold hover:border-[#2962FF]"
              >
                <RotateCcw className="w-3 h-3" />
                <span>Reset</span>
              </button>
            </div>
          </div>

          <div className="overflow-x-auto max-h-48">
            {bottomTab === 'positions' &&
              (openPositions.length === 0 ? (
                <div className="p-4 text-center text-xs text-slate-500">
                  No open positions. Click the top-left BUY/SELL one-click buttons or place an order in the Order Ticket.
                </div>
              ) : (
                <table className="w-full text-left text-xs">
                  <thead className="border-b border-slate-200 dark:border-[#2A2E39] text-[10px] uppercase text-slate-500">
                    <tr>
                      <th className="px-4 py-2">Symbol</th>
                      <th className="px-4 py-2">Side</th>
                      <th className="px-4 py-2">Lots</th>
                      <th className="px-4 py-2">Entry</th>
                      <th className="px-4 py-2">SL / TP</th>
                      <th className="px-4 py-2">Unrealized P&amp;L</th>
                      <th className="px-4 py-2 text-right">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-[#2A2E39] font-mono tabular-nums">
                    {openPositions.map((pos) => {
                      const mark =
                        pos.symbol === symbol && currentBar
                          ? currentBar.close
                          : quotes.find((q) => q.symbol === pos.symbol)?.price ?? pos.entryPrice;
                      const pnl = calcPnl(pos.symbol, pos.side, pos.lots, pos.entryPrice, mark);
                      return (
                        <tr key={pos.id}>
                          <td className="px-4 py-2 font-sans font-bold">{pos.symbol}</td>
                          <td className={`px-4 py-2 font-bold ${pos.side === 'BUY' ? 'text-[#2962FF]' : 'text-[#F23645]'}`}>
                            {pos.side}
                          </td>
                          <td className="px-4 py-2">{pos.lots.toFixed(2)}</td>
                          <td className="px-4 py-2">{pos.entryPrice}</td>
                          <td className="px-4 py-2 text-slate-500">
                            {pos.stopLoss ?? '—'} / {pos.takeProfit ?? '—'}
                          </td>
                          <td className={`px-4 py-2 font-bold ${pnl >= 0 ? 'text-[#089981]' : 'text-[#F23645]'}`}>
                            {pnl >= 0 ? '+' : ''}${pnl.toFixed(2)}
                          </td>
                          <td className="px-4 py-2 text-right">
                            <button
                              type="button"
                              onClick={() => handleClosePosition(pos.id)}
                              className="font-sans px-2 py-0.5 rounded bg-slate-100 dark:bg-[#1E222D] hover:bg-[#F23645] hover:text-white text-[11px] font-semibold"
                            >
                              Close
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              ))}

            {bottomTab === 'orders' &&
              (pendingOrders.length === 0 ? (
                <div className="p-4 text-center text-xs text-slate-500">
                  No pending Limit orders. Switch the Order Ticket to Limit to queue orders for Bar Replay fills.
                </div>
              ) : (
                <table className="w-full text-left text-xs">
                  <thead className="border-b border-slate-200 dark:border-[#2A2E39] text-[10px] uppercase text-slate-500">
                    <tr>
                      <th className="px-4 py-2">Symbol</th>
                      <th className="px-4 py-2">Side</th>
                      <th className="px-4 py-2">Lots</th>
                      <th className="px-4 py-2">Limit</th>
                      <th className="px-4 py-2">SL / TP</th>
                      <th className="px-4 py-2 text-right">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-[#2A2E39] font-mono tabular-nums">
                    {pendingOrders.map((ord) => (
                      <tr key={ord.id}>
                        <td className="px-4 py-2 font-sans font-bold">{ord.symbol}</td>
                        <td className="px-4 py-2 font-bold">{ord.side} LIMIT</td>
                        <td className="px-4 py-2">{ord.lots.toFixed(2)}</td>
                        <td className="px-4 py-2">{ord.entryPrice}</td>
                        <td className="px-4 py-2 text-slate-500">
                          {ord.stopLoss ?? '—'} / {ord.takeProfit ?? '—'}
                        </td>
                        <td className="px-4 py-2 text-right">
                          <button
                            type="button"
                            onClick={() => handleClosePosition(ord.id)}
                            className="font-sans text-[#F23645] font-semibold"
                          >
                            Cancel
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              ))}

            {bottomTab === 'history' &&
              (closedTrades.length === 0 ? (
                <div className="p-4 text-center text-xs text-slate-500">
                  No closed backtest trades yet. Run Bar Replay or close an open position to log results.
                </div>
              ) : (
                <table className="w-full text-left text-xs">
                  <thead className="border-b border-slate-200 dark:border-[#2A2E39] text-[10px] uppercase text-slate-500">
                    <tr>
                      <th className="px-4 py-2">Symbol</th>
                      <th className="px-4 py-2">Side</th>
                      <th className="px-4 py-2">Entry → Exit</th>
                      <th className="px-4 py-2">Outcome</th>
                      <th className="px-4 py-2 text-right">Realized P&amp;L</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-[#2A2E39] font-mono tabular-nums">
                    {closedTrades.map((tr) => (
                      <tr key={tr.id}>
                        <td className="px-4 py-2 font-sans font-bold">{tr.symbol}</td>
                        <td className="px-4 py-2">{tr.side}</td>
                        <td className="px-4 py-2">
                          {tr.entryPrice} → {tr.exitPrice}
                        </td>
                        <td className="px-4 py-2 font-sans">{tr.reason}</td>
                        <td
                          className={`px-4 py-2 text-right font-bold ${
                            tr.pnl >= 0 ? 'text-[#089981]' : 'text-[#F23645]'
                          }`}
                        >
                          {tr.pnl >= 0 ? '+' : ''}${tr.pnl.toFixed(2)} ({tr.pips}p)
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              ))}
          </div>
        </div>
      )}

      {/* Workspace Shortcuts & Plan Info Modal */}
      {upgradeModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="w-full max-w-md rounded-2xl border border-slate-200 dark:border-[#2A2E39] bg-white dark:bg-[#1E222D] shadow-2xl p-5 space-y-4 text-xs">
            <div className="flex items-center justify-between">
              <h3 className="font-display text-base font-bold text-[#131722] dark:text-white">
                SKFX Trading Playground · Shortcuts &amp; Tools
              </h3>
              <button type="button" onClick={() => setUpgradeModalOpen(false)} className="text-slate-400">
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="grid grid-cols-2 gap-2 font-mono text-[11px]">
              {[
                ['Alt + T', 'Trendline'],
                ['Alt + H', 'Horizontal Line'],
                ['Alt + J', 'Horizontal Ray'],
                ['Alt + V', 'Vertical Line'],
                ['Alt + C', 'Crossline'],
                ['Alt + F', 'Fib Retracement'],
                ['Ctrl / ⌘ + Z', 'Undo Drawing'],
                ['Delete', 'Remove Selected'],
              ].map(([k, v]) => (
                <div
                  key={k}
                  className="flex items-center justify-between rounded-lg border border-slate-200 dark:border-[#2A2E39] px-2.5 py-1.5"
                >
                  <span className="font-bold text-[#2962FF]">{k}</span>
                  <span className="font-sans text-slate-600 dark:text-slate-300">{v}</span>
                </div>
              ))}
            </div>
            <p className="text-slate-500 dark:text-slate-400 leading-relaxed">
              Your SKFX {user.tier} workspace includes live 2024–2026 historical backtesting, Bar Replay,
              all Chart Patterns / Elliott Waves / Fibonacci / Gann tools, and instant paper execution.
            </p>
            <button
              type="button"
              onClick={() => setUpgradeModalOpen(false)}
              className="w-full py-2 rounded-lg bg-[#2962FF] text-white font-semibold"
            >
              Back to Chart
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
