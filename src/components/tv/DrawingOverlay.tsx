import type {IChartApi, ISeriesApi, SeriesType, UTCTimestamp} from 'lightweight-charts';
import {
  calcPips,
  formatSimPrice,
  type CandleBar,
  type ChartDrawing,
  type ChartPoint,
  type DrawingToolId,
} from './types';

interface DrawingOverlayProps {
  chart: IChartApi | null;
  mainSeries: ISeriesApi<SeriesType> | null;
  candles: CandleBar[];
  drawings: ChartDrawing[];
  draftPoints: ChartPoint[];
  cursorPoint: ChartPoint | null;
  activeTool: DrawingToolId;
  selectedId: string | null;
  hideAll: boolean;
  decimals: number;
  pipSize: number;
  symbol: string;
  accountBalance: number;
  currentPrice: number;
  width: number;
  height: number;
  renderTick: number;
  onSelectDrawing: (id: string | null) => void;
  onStartHandleDrag?: (
    drawingId: string,
    handle: 'tp' | 'sl' | 'entry' | 'end',
    e: React.PointerEvent,
  ) => void;
}

interface ScreenPoint {
  x: number;
  y: number;
}

const FIB_LEVELS = [
  {level: 0, color: '#787B86'},
  {level: 0.236, color: '#F23645'},
  {level: 0.382, color: '#F59E0B'},
  {level: 0.5, color: '#089981'},
  {level: 0.618, color: '#2962FF'},
  {level: 0.786, color: '#0EA5E9'},
  {level: 1, color: '#787B86'},
];

const FIB_EXT_LEVELS = [
  {level: 0, color: '#787B86'},
  {level: 0.618, color: '#2962FF'},
  {level: 1, color: '#089981'},
  {level: 1.272, color: '#F59E0B'},
  {level: 1.618, color: '#EF4444'},
  {level: 2.618, color: '#8B5CF6'},
];

export function DrawingOverlay({
  chart,
  mainSeries,
  candles,
  drawings,
  draftPoints,
  cursorPoint,
  activeTool,
  selectedId,
  hideAll,
  decimals,
  pipSize,
  symbol,
  accountBalance,
  currentPrice,
  width,
  height,
  onSelectDrawing,
  onStartHandleDrag,
}: DrawingOverlayProps) {
  if (!chart || !mainSeries || width <= 0 || height <= 0 || candles.length === 0) {
    return null;
  }

  const timeScale = chart.timeScale();
  const firstBar = candles[0];
  const lastBar = candles[candles.length - 1];
  const firstX = timeScale.timeToCoordinate(firstBar.time as UTCTimestamp);
  const lastX = timeScale.timeToCoordinate(lastBar.time as UTCTimestamp);

  const projectPoint = (pt: ChartPoint): ScreenPoint | null => {
    const y = mainSeries.priceToCoordinate(pt.price);
    if (y === null || !Number.isFinite(y)) return null;

    let x = timeScale.timeToCoordinate(pt.time as UTCTimestamp);
    if (x === null && firstX !== null && lastX !== null && lastBar.time > firstBar.time) {
      const ratio = (pt.time - firstBar.time) / (lastBar.time - firstBar.time);
      x = (firstX + ratio * (lastX - firstX)) as typeof firstX;
    }
    if (x === null || !Number.isFinite(x)) return null;
    return {x, y};
  };

  const extendRay = (p1: ScreenPoint, p2: ScreenPoint, bothWays = false): [ScreenPoint, ScreenPoint] => {
    const dx = p2.x - p1.x;
    const dy = p2.y - p1.y;
    const len = Math.hypot(dx, dy);
    if (len < 0.001) return [p1, {x: width, y: p1.y}];
    const ux = dx / len;
    const uy = dy / len;
    const span = Math.max(width, height) * 3;
    return [
      bothWays ? {x: p1.x - ux * span, y: p1.y - uy * span} : p1,
      {x: p1.x + ux * span, y: p1.y + uy * span},
    ];
  };

  const renderSingleDrawing = (d: ChartDrawing, isPreview = false) => {
    if (!d.visible) return null;
    const pts = d.points.map(projectPoint);
    if (pts.some((p) => p === null)) return null;
    const sp = pts as ScreenPoint[];
    const isSelected = !isPreview && selectedId === d.id;
    const stroke = isSelected ? '#2962FF' : d.color || '#2962FF';
    const sw = d.lineWidth || 1.6;

    const hitHandlers = isPreview
      ? {}
      : {
          onClick: (e: React.MouseEvent) => {
            e.stopPropagation();
            onSelectDrawing(isSelected ? null : d.id);
          },
          style: {cursor: 'pointer' as const, pointerEvents: 'all' as const},
        };

    switch (d.tool) {
      case 'hline': {
        const p1 = sp[0];
        const priceLabel = formatSimPrice(d.points[0].price, decimals);
        return (
          <g key={d.id}>
            <line x1={0} y1={p1.y} x2={width} y2={p1.y} stroke={stroke} strokeWidth={sw} />
            <line x1={0} y1={p1.y} x2={width} y2={p1.y} stroke="transparent" strokeWidth={12} {...hitHandlers} />
            <rect x={8} y={p1.y - 16} width={76} height={15} rx={3} fill={stroke} opacity={0.92} />
            <text x={13} y={p1.y - 5} fill="#FFFFFF" fontSize={10} fontFamily="JetBrains Mono, monospace">
              {priceLabel}
            </text>
            {isSelected && (
              <circle cx={width * 0.45} cy={p1.y} r={4.5} fill="#FFFFFF" stroke="#2962FF" strokeWidth={1.8} />
            )}
          </g>
        );
      }

      case 'hray': {
        const p1 = sp[0];
        return (
          <g key={d.id}>
            <line x1={p1.x} y1={p1.y} x2={width} y2={p1.y} stroke={stroke} strokeWidth={sw} />
            <line x1={p1.x} y1={p1.y} x2={width} y2={p1.y} stroke="transparent" strokeWidth={12} {...hitHandlers} />
            <circle cx={p1.x} cy={p1.y} r={4} fill="#FFFFFF" stroke={stroke} strokeWidth={1.6} {...hitHandlers} />
          </g>
        );
      }

      case 'vline': {
        const p1 = sp[0];
        return (
          <g key={d.id}>
            <line x1={p1.x} y1={0} x2={p1.x} y2={height} stroke={stroke} strokeWidth={sw} strokeDasharray="4 3" />
            <line x1={p1.x} y1={0} x2={p1.x} y2={height} stroke="transparent" strokeWidth={12} {...hitHandlers} />
          </g>
        );
      }

      case 'crossline': {
        const p1 = sp[0];
        return (
          <g key={d.id}>
            <line x1={0} y1={p1.y} x2={width} y2={p1.y} stroke={stroke} strokeWidth={1.3} strokeDasharray="3 3" />
            <line x1={p1.x} y1={0} x2={p1.x} y2={height} stroke={stroke} strokeWidth={1.3} strokeDasharray="3 3" />
            <circle cx={p1.x} cy={p1.y} r={4.5} fill="#FFFFFF" stroke={stroke} strokeWidth={1.6} {...hitHandlers} />
          </g>
        );
      }

      case 'trendline':
      case 'ray':
      case 'extline':
      case 'infoline':
      case 'angle':
      case 'forecast': {
        if (sp.length < 2) return null;
        const [a, b] = sp;
        const [start, end] =
          d.tool === 'ray'
            ? extendRay(a, b, false)
            : d.tool === 'extline'
              ? extendRay(a, b, true)
              : [a, b];

        const priceDiff = d.points[1].price - d.points[0].price;
        const pct = d.points[0].price > 0 ? (priceDiff / d.points[0].price) * 100 : 0;
        const deg = -Math.round((Math.atan2(b.y - a.y, b.x - a.x) * 180) / Math.PI);
        const midX = (a.x + b.x) / 2;
        const midY = (a.y + b.y) / 2;

        return (
          <g key={d.id}>
            <line
              x1={start.x}
              y1={start.y}
              x2={end.x}
              y2={end.y}
              stroke={stroke}
              strokeWidth={sw}
              strokeDasharray={d.tool === 'forecast' ? '5 4' : undefined}
            />
            <line x1={start.x} y1={start.y} x2={end.x} y2={end.y} stroke="transparent" strokeWidth={12} {...hitHandlers} />
            {d.tool === 'angle' && (
              <>
                <line x1={a.x} y1={a.y} x2={a.x + 56} y2={a.y} stroke={stroke} strokeDasharray="3 3" strokeWidth={1} />
                <text x={a.x + 60} y={a.y + 4} fill={stroke} fontSize={10} fontWeight={700} fontFamily="JetBrains Mono, monospace">
                  {deg}°
                </text>
              </>
            )}
            {(d.tool === 'infoline' || d.tool === 'forecast') && (
              <g transform={`translate(${midX + 6}, ${midY - 22})`}>
                <rect width={138} height={20} rx={4} fill="#131722" opacity={0.9} />
                <text x={6} y={13} fill="#FFFFFF" fontSize={10} fontFamily="JetBrains Mono, monospace">
                  {priceDiff >= 0 ? '+' : ''}
                  {formatSimPrice(priceDiff, decimals)} ({pct >= 0 ? '+' : ''}
                  {pct.toFixed(2)}%)
                </text>
              </g>
            )}
            <circle cx={a.x} cy={a.y} r={3.8} fill="#FFFFFF" stroke={stroke} strokeWidth={1.6} />
            <circle cx={b.x} cy={b.y} r={3.8} fill="#FFFFFF" stroke={stroke} strokeWidth={1.6} />
          </g>
        );
      }

      case 'channel':
      case 'regtrend':
      case 'flattop':
      case 'disjoint':
      case 'fibchannel': {
        if (sp.length < 2) return null;
        const a = sp[0];
        const b = sp[1];
        const c = sp[2] || {x: b.x, y: b.y - 48};
        const dx = b.x - a.x;
        const dy = b.y - a.y;
        const offsetY = c.y - (a.y + ((c.x - a.x) / (dx || 1)) * dy);
        const a2 = {x: a.x, y: d.tool === 'flattop' ? c.y : a.y + offsetY};
        const b2 = {x: b.x, y: d.tool === 'flattop' ? c.y : b.y + offsetY};
        const midA = {x: a.x, y: (a.y + a2.y) / 2};
        const midB = {x: b.x, y: (b.y + b2.y) / 2};
        const polyPts = `${a.x},${a.y} ${b.x},${b.y} ${b2.x},${b2.y} ${a2.x},${a2.y}`;
        return (
          <g key={d.id}>
            <polygon points={polyPts} fill={stroke} fillOpacity={0.1} {...hitHandlers} />
            <line x1={a.x} y1={a.y} x2={b.x} y2={b.y} stroke={stroke} strokeWidth={sw} {...hitHandlers} />
            <line x1={a2.x} y1={a2.y} x2={b2.x} y2={b2.y} stroke={stroke} strokeWidth={sw} {...hitHandlers} />
            <line x1={midA.x} y1={midA.y} x2={midB.x} y2={midB.y} stroke={stroke} strokeWidth={1} strokeDasharray="4 4" />
            {d.tool === 'fibchannel' && (
              <>
                <line x1={a.x} y1={a.y + offsetY * 0.382} x2={b.x} y2={b.y + offsetY * 0.382} stroke="#F59E0B" strokeWidth={1} strokeDasharray="2 3" />
                <line x1={a.x} y1={a.y + offsetY * 0.618} x2={b.x} y2={b.y + offsetY * 0.618} stroke="#089981" strokeWidth={1} strokeDasharray="2 3" />
              </>
            )}
            <circle cx={a.x} cy={a.y} r={3.5} fill="#FFFFFF" stroke={stroke} strokeWidth={1.5} />
            <circle cx={b.x} cy={b.y} r={3.5} fill="#FFFFFF" stroke={stroke} strokeWidth={1.5} />
            {sp[2] && <circle cx={c.x} cy={c.y} r={3.5} fill="#FFFFFF" stroke={stroke} strokeWidth={1.5} />}
          </g>
        );
      }

      case 'pitchfork':
      case 'schiff':
      case 'pitchfan': {
        if (sp.length < 2) return null;
        const a = sp[0];
        const b = sp[1];
        const c = sp[2] || {x: b.x + 24, y: b.y + 42};
        const origin = d.tool === 'schiff' ? {x: (a.x + b.x) / 2, y: (a.y + b.y) / 2} : a;
        const midBC = {x: (b.x + c.x) / 2, y: (b.y + c.y) / 2};
        const [, medEnd] = extendRay(origin, midBC, false);
        const slopeX = medEnd.x - origin.x;
        const slopeY = medEnd.y - origin.y;
        return (
          <g key={d.id}>
            <line x1={b.x} y1={b.y} x2={c.x} y2={c.y} stroke={stroke} strokeWidth={1} strokeDasharray="3 3" />
            <line x1={origin.x} y1={origin.y} x2={medEnd.x} y2={medEnd.y} stroke="#F23645" strokeWidth={1.5} {...hitHandlers} />
            <line x1={b.x} y1={b.y} x2={b.x + slopeX} y2={b.y + slopeY} stroke={stroke} strokeWidth={1.3} {...hitHandlers} />
            <line x1={c.x} y1={c.y} x2={c.x + slopeX} y2={c.y + slopeY} stroke={stroke} strokeWidth={1.3} {...hitHandlers} />
            {d.tool === 'pitchfan' && (
              <>
                <line x1={origin.x} y1={origin.y} x2={origin.x + slopeX} y2={origin.y + (b.y - origin.y) * 2} stroke="#F59E0B" strokeWidth={1} />
                <line x1={origin.x} y1={origin.y} x2={origin.x + slopeX} y2={origin.y + (c.y - origin.y) * 2} stroke="#089981" strokeWidth={1} />
              </>
            )}
            <circle cx={a.x} cy={a.y} r={3.5} fill="#FFFFFF" stroke={stroke} strokeWidth={1.5} />
            <circle cx={b.x} cy={b.y} r={3.5} fill="#FFFFFF" stroke={stroke} strokeWidth={1.5} />
            {sp[2] && <circle cx={c.x} cy={c.y} r={3.5} fill="#FFFFFF" stroke={stroke} strokeWidth={1.5} />}
          </g>
        );
      }

      case 'fib':
      case 'fibext': {
        if (sp.length < 2) return null;
        const [a, b] = sp;
        const leftX = Math.min(a.x, b.x);
        const rightX = Math.max(a.x, b.x, leftX + 190);
        const p0 = d.points[0].price;
        const p1 = d.points[1].price;
        const levels = d.tool === 'fib' ? FIB_LEVELS : FIB_EXT_LEVELS;

        return (
          <g key={d.id}>
            <line x1={a.x} y1={a.y} x2={b.x} y2={b.y} stroke="#787B86" strokeWidth={1} strokeDasharray="3 3" />
            {levels.map((lv, idx) => {
              const priceAtLevel =
                d.tool === 'fib' ? p1 + (p0 - p1) * lv.level : p1 + (p1 - p0) * (lv.level - 1);
              const ly = mainSeries.priceToCoordinate(priceAtLevel);
              if (ly === null || !Number.isFinite(ly)) return null;
              const nextLv = levels[idx + 1];
              const nextPrice = nextLv
                ? d.tool === 'fib'
                  ? p1 + (p0 - p1) * nextLv.level
                  : p1 + (p1 - p0) * (nextLv.level - 1)
                : null;
              const nextY = nextPrice !== null ? mainSeries.priceToCoordinate(nextPrice) : null;
              return (
                <g key={lv.level}>
                  {nextY !== null && Number.isFinite(nextY) && (
                    <rect
                      x={leftX}
                      y={Math.min(ly, nextY)}
                      width={Math.max(40, rightX - leftX)}
                      height={Math.abs(nextY - ly)}
                      fill={lv.color}
                      fillOpacity={0.07}
                    />
                  )}
                  <line
                    x1={leftX}
                    y1={ly}
                    x2={rightX}
                    y2={ly}
                    stroke={lv.color}
                    strokeWidth={lv.level === 0.5 || lv.level === 0.618 || lv.level === 1.618 ? 1.5 : 1}
                    {...hitHandlers}
                  />
                  <text
                    x={leftX + 4}
                    y={ly - 3}
                    fill={lv.color}
                    fontSize={10}
                    fontWeight={600}
                    fontFamily="JetBrains Mono, monospace"
                  >
                    {lv.level} ({formatSimPrice(priceAtLevel, decimals)})
                  </text>
                </g>
              );
            })}
            <circle cx={a.x} cy={a.y} r={3.5} fill="#FFFFFF" stroke={stroke} strokeWidth={1.5} />
            <circle cx={b.x} cy={b.y} r={3.5} fill="#FFFFFF" stroke={stroke} strokeWidth={1.5} />
          </g>
        );
      }

      case 'fibtime':
      case 'fibtrendtime':
      case 'cyclic':
      case 'timecycles': {
        if (sp.length < 2) return null;
        const [a, b] = sp;
        const dx = Math.max(12, Math.abs(b.x - a.x)) * (b.x >= a.x ? 1 : -1);
        const seq = d.tool === 'cyclic' || d.tool === 'timecycles' ? [0, 1, 2, 3, 4, 5, 6, 7] : [0, 1, 2, 3, 5, 8, 13, 21];
        return (
          <g key={d.id}>
            {seq.map((n) => {
              const vx = a.x + dx * n;
              if (vx < 0 || vx > width) return null;
              return (
                <g key={n}>
                  <line x1={vx} y1={0} x2={vx} y2={height} stroke={stroke} strokeWidth={1.2} strokeDasharray="3 3" {...hitHandlers} />
                  {d.tool === 'timecycles' && n > 0 && (
                    <circle cx={vx - dx / 2} cy={a.y} r={Math.abs(dx) / 2} fill="none" stroke={stroke} strokeOpacity={0.45} strokeWidth={1} />
                  )}
                  <text x={vx + 4} y={26} fill={stroke} fontSize={10} fontFamily="JetBrains Mono, monospace">
                    {n}
                  </text>
                </g>
              );
            })}
          </g>
        );
      }

      case 'fibfan':
      case 'fibwedge':
      case 'gannfan': {
        if (sp.length < 2) return null;
        const [a, b] = sp;
        const ratios = d.tool === 'gannfan' ? [1, 2, 0.5, 3, 0.333] : [0.382, 0.5, 0.618, 0.786, 1];
        return (
          <g key={d.id}>
            {ratios.map((r) => {
              const target = {x: b.x, y: a.y + (b.y - a.y) * r};
              const [, end] = extendRay(a, target, false);
              return (
                <line
                  key={r}
                  x1={a.x}
                  y1={a.y}
                  x2={end.x}
                  y2={end.y}
                  stroke={r === 1 || r === 0.618 ? '#2962FF' : '#787B86'}
                  strokeWidth={r === 1 || r === 0.618 ? 1.5 : 1}
                  {...hitHandlers}
                />
              );
            })}
            <circle cx={a.x} cy={a.y} r={3.5} fill="#FFFFFF" stroke={stroke} strokeWidth={1.5} />
          </g>
        );
      }

      case 'fibcircles':
      case 'fibspiral':
      case 'fibarcs': {
        if (sp.length < 2) return null;
        const [a, b] = sp;
        const radius = Math.max(14, Math.hypot(b.x - a.x, b.y - a.y));
        const rings = [0.382, 0.5, 0.618, 1, 1.618];
        return (
          <g key={d.id}>
            <line x1={a.x} y1={a.y} x2={b.x} y2={b.y} stroke="#787B86" strokeDasharray="3 3" strokeWidth={1} />
            {rings.map((r) => (
              <circle
                key={r}
                cx={a.x}
                cy={a.y}
                r={radius * r}
                fill="none"
                stroke={r === 0.618 || r === 1 ? '#2962FF' : '#787B86'}
                strokeWidth={1.1}
                {...hitHandlers}
              />
            ))}
            <circle cx={a.x} cy={a.y} r={3.5} fill="#FFFFFF" stroke={stroke} strokeWidth={1.5} />
          </g>
        );
      }

      case 'gannbox':
      case 'gannsquarefixed':
      case 'gannsquare': {
        if (sp.length < 2) return null;
        const [a, b] = sp;
        const x = Math.min(a.x, b.x);
        const y = Math.min(a.y, b.y);
        const w = Math.max(14, Math.abs(b.x - a.x));
        const h = Math.max(14, Math.abs(b.y - a.y));
        const fracs = [0.25, 0.382, 0.5, 0.618, 0.75];
        return (
          <g key={d.id}>
            <rect x={x} y={y} width={w} height={h} fill={stroke} fillOpacity={0.06} stroke={stroke} strokeWidth={1.4} {...hitHandlers} />
            {fracs.map((f) => (
              <g key={f}>
                <line x1={x} y1={y + h * f} x2={x + w} y2={y + h * f} stroke={stroke} strokeOpacity={0.45} strokeWidth={0.9} />
                <line x1={x + w * f} y1={y} x2={x + w * f} y2={y + h} stroke={stroke} strokeOpacity={0.45} strokeWidth={0.9} />
              </g>
            ))}
            <line x1={x} y1={y} x2={x + w} y2={y + h} stroke="#F59E0B" strokeWidth={1.1} />
            <line x1={x} y1={y + h} x2={x + w} y2={y} stroke="#089981" strokeWidth={1.1} />
          </g>
        );
      }

      case 'xabcd':
      case 'cypher':
      case 'headshoulders':
      case 'abcd':
      case 'triangle':
      case 'threedrives':
      case 'elliott5':
      case 'elliott3':
      case 'elliotttri':
      case 'elliottwxy':
      case 'elliottwxyz': {
        if (sp.length < 2) return null;
        const labelsMap: Record<string, string[]> = {
          xabcd: ['X', 'A', 'B', 'C', 'D'],
          cypher: ['X', 'A', 'B', 'C', 'D'],
          headshoulders: ['LS', 'L1', 'H', 'R1', 'RS'],
          abcd: ['A', 'B', 'C', 'D'],
          triangle: ['A', 'B', 'C'],
          threedrives: ['1', 'A', '2', 'B', '3'],
          elliott5: ['1', '2', '3', '4', '5'],
          elliott3: ['A', 'B', 'C'],
          elliotttri: ['A', 'B', 'C', 'D', 'E'],
          elliottwxy: ['W', 'X', 'Y'],
          elliottwxyz: ['W', 'X', 'Y', 'Z'],
        };
        const labels = labelsMap[d.tool] || ['1', '2', '3', '4', '5'];
        const polyLine = sp.map((p) => `${p.x.toFixed(1)},${p.y.toFixed(1)}`).join(' ');
        const fillPoly = sp.length >= 3 ? `${polyLine} ${sp[0].x.toFixed(1)},${sp[0].y.toFixed(1)}` : '';
        return (
          <g key={d.id}>
            {fillPoly && <polygon points={fillPoly} fill={stroke} fillOpacity={0.11} {...hitHandlers} />}
            <polyline points={polyLine} fill="none" stroke={stroke} strokeWidth={1.8} {...hitHandlers} />
            {sp.map((pt, i) => (
              <g key={i}>
                <circle cx={pt.x} cy={pt.y} r={3.6} fill="#FFFFFF" stroke={stroke} strokeWidth={1.5} />
                <text
                  x={pt.x + 5}
                  y={pt.y - 6}
                  fill={stroke}
                  fontSize={10}
                  fontWeight={700}
                  fontFamily="JetBrains Mono, monospace"
                >
                  {labels[i] || i + 1}
                </text>
              </g>
            ))}
          </g>
        );
      }

      case 'sine': {
        if (sp.length < 2) return null;
        const [a, b] = sp;
        const amp = b.y - a.y;
        const halfWave = Math.max(20, Math.abs(b.x - a.x));
        const segments: string[] = [];
        for (let i = 0; i <= 60; i++) {
          const t = (i / 60) * Math.PI * 3;
          const px = a.x + (i / 60) * halfWave * 3;
          const py = a.y + Math.sin(t) * amp;
          segments.push(`${i === 0 ? 'M' : 'L'} ${px.toFixed(1)} ${py.toFixed(1)}`);
        }
        return (
          <g key={d.id}>
            <path d={segments.join(' ')} fill="none" stroke={stroke} strokeWidth={1.6} {...hitHandlers} />
            <circle cx={a.x} cy={a.y} r={3.5} fill="#FFFFFF" stroke={stroke} strokeWidth={1.5} />
          </g>
        );
      }

      case 'rect':
      case 'daterange': {
        if (sp.length < 2) return null;
        const [a, b] = sp;
        const x = Math.min(a.x, b.x);
        const y = Math.min(a.y, b.y);
        const w = Math.max(10, Math.abs(b.x - a.x));
        const h = Math.max(10, Math.abs(b.y - a.y));
        const days = Math.max(1, Math.round(Math.abs(d.points[1].time - d.points[0].time) / 86400));
        return (
          <g key={d.id}>
            <rect
              x={x}
              y={d.tool === 'daterange' ? 0 : y}
              width={w}
              height={d.tool === 'daterange' ? height : h}
              fill={d.fillColor || stroke}
              fillOpacity={0.12}
              stroke={stroke}
              strokeWidth={1.3}
              {...hitHandlers}
            />
            {d.tool === 'daterange' && (
              <g transform={`translate(${x + w / 2 - 42}, ${y})`}>
                <rect width={84} height={20} rx={4} fill="#2962FF" />
                <text x={42} y={13} textAnchor="middle" fill="#FFFFFF" fontSize={10} fontWeight={700} fontFamily="JetBrains Mono, monospace">
                  {days} days
                </text>
              </g>
            )}
            <circle cx={a.x} cy={a.y} r={3.2} fill="#FFFFFF" stroke={stroke} strokeWidth={1.5} />
            <circle cx={b.x} cy={b.y} r={3.2} fill="#FFFFFF" stroke={stroke} strokeWidth={1.5} />
          </g>
        );
      }

      case 'brush': {
        if (sp.length < 2) return null;
        const pathD = sp.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x.toFixed(1)} ${p.y.toFixed(1)}`).join(' ');
        return (
          <g key={d.id}>
            <path d={pathD} fill="none" stroke={stroke} strokeWidth={2.2} strokeLinecap="round" strokeLinejoin="round" />
            <path d={pathD} fill="none" stroke="transparent" strokeWidth={10} {...hitHandlers} />
          </g>
        );
      }

      case 'text':
      case 'callout': {
        const p1 = sp[0];
        const label = d.text || (d.tool === 'callout' ? 'Liquidity Sweep' : 'Note');
        const boxW = Math.max(72, label.length * 6.8 + 18);
        return (
          <g key={d.id} {...hitHandlers} style={{cursor: 'pointer', pointerEvents: isPreview ? 'none' : 'all'}}>
            <rect x={p1.x} y={p1.y - 14} width={boxW} height={22} rx={4} fill={stroke} fillOpacity={0.92} />
            <text x={p1.x + 9} y={p1.y + 1} fill="#FFFFFF" fontSize={11} fontWeight={600}>
              {label}
            </text>
          </g>
        );
      }

      case 'longpos':
      case 'shortpos': {
        if (sp.length < 2) return null;
        const [a, b] = sp;
        const isLong = d.tool === 'longpos';
        const entryP = d.points[0].price;
        const stopP = d.stopPrice ?? d.points[1].price;
        const riskDist = Math.max(pipSize * 4, Math.abs(entryP - stopP));
        const defaultTarget = isLong ? entryP + riskDist * 2.17 : entryP - riskDist * 2.17;
        const targetP = d.targetPrice ?? defaultTarget;

        const slY = mainSeries.priceToCoordinate(stopP);
        const tpY = mainSeries.priceToCoordinate(targetP);
        if (slY === null || tpY === null || !Number.isFinite(slY) || !Number.isFinite(tpY)) return null;

        const boxLeft = Math.min(a.x, b.x);
        const boxW = Math.max(135, Math.abs(b.x - a.x));
        const slTop = Math.min(a.y, slY);
        const slH = Math.max(14, Math.abs(slY - a.y));
        const tpTop = Math.min(a.y, tpY);
        const tpH = Math.max(14, Math.abs(tpY - a.y));

        const riskDiff = Math.abs(entryP - stopP);
        const rewardDiff = Math.abs(targetP - entryP);
        const rrNum = riskDiff > 0 ? rewardDiff / riskDiff : 1;
        const riskPct = d.riskPercent ?? 7.5;
        const riskAmt = (accountBalance * riskPct) / 100;
        const targetAmt = riskAmt * rrNum;
        const stopPct = entryP > 0 ? (riskDiff / entryP) * 100 : 0;
        const targetPct = entryP > 0 ? (rewardDiff / entryP) * 100 : 0;
        const qty = riskDiff > 0 ? riskAmt / (riskDiff * (symbol === 'XAUUSD' ? 10 : 1000)) : 1;
        const liveDiff = isLong ? currentPrice - entryP : entryP - currentPrice;
        const openPnl = liveDiff * qty * (symbol === 'XAUUSD' ? 10 : 1000);
        const stopTicks = Math.round(Math.abs(calcPips(symbol, pipSize, isLong ? 'BUY' : 'SELL', entryP, stopP)) * 10);
        const tpTicks = Math.round(Math.abs(calcPips(symbol, pipSize, isLong ? 'BUY' : 'SELL', entryP, targetP)) * 10);

        const profitFill = d.fillColor || '#2962FF';
        const stopFill = '#64748B';

        return (
          <g key={d.id}>
            {/* Profit Target Box (Translucent Blue matching Screenshots 5, 7, 8) */}
            <rect
              x={boxLeft}
              y={tpTop}
              width={boxW}
              height={tpH}
              fill={profitFill}
              fillOpacity={0.22}
              stroke={isSelected ? profitFill : 'transparent'}
              strokeWidth={1}
              {...hitHandlers}
            />
            {/* Stop Loss Box (Translucent Grey matching Screenshots 5, 7, 8) */}
            <rect
              x={boxLeft}
              y={slTop}
              width={boxW}
              height={slH}
              fill={stopFill}
              fillOpacity={0.24}
              stroke={isSelected ? stopFill : 'transparent'}
              strokeWidth={1}
              {...hitHandlers}
            />
            {/* Diagonal Dashed Trajectory Arrow inside Zone (Screenshot 5 & 7) */}
            <line
              x1={boxLeft}
              y1={a.y}
              x2={boxLeft + boxW}
              y2={tpY}
              stroke="#787B86"
              strokeWidth={1}
              strokeDasharray="3 3"
            />
            {/* Entry Divider Line */}
            <line x1={boxLeft} y1={a.y} x2={boxLeft + boxW} y2={a.y} stroke="#475569" strokeWidth={1.2} {...hitHandlers} />

            {/* Target Label Badge (Screenshot 5 & 7) */}
            <g transform={`translate(${Math.max(4, boxLeft + boxW / 2 - 125)}, ${isLong ? tpTop - 24 : tpTop + tpH + 5})`}>
              <rect width={250} height={19} rx={3} fill="#2962FF" />
              <text x={125} y={13} textAnchor="middle" fill="#FFFFFF" fontSize={10} fontWeight={600} fontFamily="JetBrains Mono, monospace">
                Target: {formatSimPrice(rewardDiff, decimals)} ({targetPct.toFixed(3)}%) {tpTicks.toLocaleString()}, Amount: {targetAmt.toFixed(2)}
              </text>
            </g>

            {/* Center Open PnL / Qty / Risk-Reward Badge (Screenshot 5 & 7) */}
            <g transform={`translate(${Math.max(4, boxLeft + boxW / 2 - 108)}, ${a.y - 16})`} {...hitHandlers}>
              <rect width={216} height={32} rx={4} fill={openPnl >= 0 ? '#2962FF' : '#1E293B'} opacity={0.94} />
              <text x={108} y={13} textAnchor="middle" fill="#FFFFFF" fontSize={10} fontWeight={600} fontFamily="JetBrains Mono, monospace">
                Open PnL: {openPnl.toFixed(3)}, Qty: {qty.toFixed(3)}
              </text>
              <text x={108} y={26} textAnchor="middle" fill="#E2E8F0" fontSize={10} fontWeight={600} fontFamily="JetBrains Mono, monospace">
                Risk/reward ratio: {rrNum.toFixed(2)}
              </text>
            </g>

            {/* Stop Label Badge (Screenshot 5 & 7) */}
            <g transform={`translate(${Math.max(4, boxLeft + boxW / 2 - 120)}, ${isLong ? slTop + slH + 5 : slTop - 24})`}>
              <rect width={240} height={19} rx={3} fill="#1E293B" />
              <text x={120} y={13} textAnchor="middle" fill="#FFFFFF" fontSize={10} fontWeight={600} fontFamily="JetBrains Mono, monospace">
                Stop: {formatSimPrice(riskDiff, decimals)} ({stopPct.toFixed(3)}%) {stopTicks.toLocaleString()}, Amount: {riskAmt.toFixed(0)}
              </text>
            </g>

            {/* Interactive Corner Handles when Selected (Screenshots 5 & 7) */}
            {isSelected && (
              <>
                <circle
                  cx={boxLeft}
                  cy={tpY}
                  r={5}
                  fill="#FFFFFF"
                  stroke="#2962FF"
                  strokeWidth={2}
                  style={{cursor: 'ns-resize', pointerEvents: 'all'}}
                  onPointerDown={(e) => {
                    e.stopPropagation();
                    onStartHandleDrag?.(d.id, 'tp', e);
                  }}
                />
                <circle
                  cx={boxLeft}
                  cy={slY}
                  r={5}
                  fill="#FFFFFF"
                  stroke="#2962FF"
                  strokeWidth={2}
                  style={{cursor: 'ns-resize', pointerEvents: 'all'}}
                  onPointerDown={(e) => {
                    e.stopPropagation();
                    onStartHandleDrag?.(d.id, 'sl', e);
                  }}
                />
                <circle
                  cx={boxLeft}
                  cy={a.y}
                  r={5}
                  fill="#FFFFFF"
                  stroke="#2962FF"
                  strokeWidth={2}
                  style={{cursor: 'move', pointerEvents: 'all'}}
                  onPointerDown={(e) => {
                    e.stopPropagation();
                    onStartHandleDrag?.(d.id, 'entry', e);
                  }}
                />
                <circle
                  cx={boxLeft + boxW}
                  cy={a.y}
                  r={5}
                  fill="#FFFFFF"
                  stroke="#2962FF"
                  strokeWidth={2}
                  style={{cursor: 'ew-resize', pointerEvents: 'all'}}
                  onPointerDown={(e) => {
                    e.stopPropagation();
                    onStartHandleDrag?.(d.id, 'end', e);
                  }}
                />
              </>
            )}
          </g>
        );
      }

      case 'measure': {
        if (sp.length < 2) return null;
        const [a, b] = sp;
        const x = Math.min(a.x, b.x);
        const y = Math.min(a.y, b.y);
        const w = Math.max(10, Math.abs(b.x - a.x));
        const h = Math.max(10, Math.abs(b.y - a.y));
        const diff = d.points[1].price - d.points[0].price;
        const pct = d.points[0].price > 0 ? (diff / d.points[0].price) * 100 : 0;
        const pips = Math.round(diff / (symbol === 'XAUUSD' ? 0.1 : pipSize || 0.0001));
        const boxColor = diff >= 0 ? '#2962FF' : '#F23645';
        return (
          <g key={d.id}>
            <rect x={x} y={y} width={w} height={h} fill={boxColor} fillOpacity={0.14} stroke={boxColor} strokeWidth={1.2} {...hitHandlers} />
            <line x1={a.x} y1={a.y} x2={b.x} y2={b.y} stroke={boxColor} strokeWidth={1} strokeDasharray="3 3" />
            <g transform={`translate(${x + w / 2 - 78}, ${diff >= 0 ? y - 28 : y + h + 6})`}>
              <rect width={156} height={22} rx={4} fill={boxColor} />
              <text x={78} y={14} textAnchor="middle" fill="#FFFFFF" fontSize={10} fontWeight={700} fontFamily="JetBrains Mono, monospace">
                {diff >= 0 ? '+' : ''}
                {formatSimPrice(diff, decimals)} ({pct >= 0 ? '+' : ''}
                {pct.toFixed(2)}%) · {pips}p
              </text>
            </g>
          </g>
        );
      }

      default:
        return null;
    }
  };

  let draftPreview: ChartDrawing | null = null;
  if (
    activeTool !== 'crosshair' &&
    activeTool !== 'cut' &&
    draftPoints.length > 0 &&
    cursorPoint
  ) {
    draftPreview = {
      id: '__draft__',
      tool: activeTool,
      symbol,
      points: activeTool === 'brush' ? draftPoints : [...draftPoints, cursorPoint],
      color: '#2962FF',
      visible: true,
      locked: false,
      createdAt: 0,
    };
  }

  return (
    <svg
      width={width}
      height={height}
      className="absolute inset-0 z-10 pointer-events-none select-none"
      style={{overflow: 'hidden'}}
    >
      {!hideAll && drawings.map((d) => renderSingleDrawing(d, false))}
      {draftPreview && renderSingleDrawing(draftPreview, true)}
    </svg>
  );
}
