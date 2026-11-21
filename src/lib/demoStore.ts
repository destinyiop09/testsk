import type {
  Briefing,
  Course,
  LeadInquiry,
  Lesson,
  PublicUser,
  ShowcasePayload,
  Signal,
  SignalStatus,
  TakenTrade,
} from '../types';

export interface LocalUser extends PublicUser {
  passwordDigest?: string;
}

export interface LocalDemoDatabase {
  users: LocalUser[];
  signals: Signal[];
  takenTrades: TakenTrade[];
  courses: Course[];
  lessons: Lesson[];
  completedLessonsByUser: Record<string, string[]>;
  briefings: Briefing[];
  leads: LeadInquiry[];
}

const STORE_KEY = 'skfx_static_demo_store_v1';
const SESSION_KEY = 'skfx_static_demo_uid_v1';

const MENTOR_ID = 'usr_kombat_sampson';
const STUDENT_ID = 'usr_demo_student';

function hoursAgo(h: number): string {
  return new Date(Date.now() - h * 3600 * 1000).toISOString();
}

function createInitialLocalDatabase(): LocalDemoDatabase {
  const courses: Course[] = [
    {
      id: 'crs_smc_liquidity',
      slug: 'institutional-smc-liquidity',
      title: '01. Institutional Structure & Liquidity',
      subtitle: 'Reading Smart Money Footprints',
      level: 'Foundation',
      thumbnailUrl: '/src/assets/images/course_smc_liquidity_1795218764204.jpg',
      instructor: 'Kombat Sampson (SK)',
      estimatedHours: 6.5,
      description:
        'Master multi-timeframe market structure, engineered liquidity pools, institutional order blocks, and fair value gaps without relying on lagging retail indicators.',
    },
    {
      id: 'crs_xauusd_mastery',
      slug: 'xauusd-gold-precision',
      title: '02. XAUUSD (Gold) Killzone Execution',
      subtitle: 'High-Probability Session Setups',
      level: 'Institutional',
      thumbnailUrl: '/src/assets/images/course_xauusd_mastery_1795218762721.jpg',
      instructor: 'Kombat Sampson (SK)',
      estimatedHours: 5.0,
      description:
        'Kombat Sampson’s signature Gold playbook covering Asian range sweeps, London Open inducement, New York continuation entries, and partial take-profit management.',
    },
    {
      id: 'crs_risk_psychology',
      slug: 'risk-architecture-psychology',
      title: '03. Risk Architecture & Execution Discipline',
      subtitle: 'Prop-Firm & Personal Capital Protection',
      level: 'Intermediate',
      thumbnailUrl: '/src/assets/images/course_risk_psychology_1795218763621.jpg',
      instructor: 'Kombat Sampson (SK)',
      estimatedHours: 4.0,
      description:
        'Build an unbreakable risk framework using fixed-fractional sizing, drawdown circuit breakers, and structured pre-session checklists designed for long-term consistency.',
    },
  ];

  const lessons: Lesson[] = [
    {
      id: 'les_01',
      courseId: 'crs_smc_liquidity',
      order: 1,
      title: 'Liquidity Pools & Engineered Stop Hunts',
      durationMinutes: 28,
      summary:
        'Why equal highs and equal lows attract institutional order flow before true directional expansion.',
      content: [
        'Retail traders are taught to place stop-losses right above clean double tops or directly below double bottoms. To an institutional desk filling large volume, those clustered stops represent resting liquidity.',
        'Before price expands in the intended higher-timeframe direction, smart money often drives price past an obvious swing high or low to trigger stop orders and pair buyers with sellers.',
        'In Kombat Sampson’s framework, you never buy or sell at equal highs/lows blindly—you wait for the sweep, confirm displacement back inside the range, and enter on the retracement.',
      ],
      keyRules: [
        'Mark previous Asian, London, and Daily highs/lows before every session.',
        'A valid sweep closes back inside the key level with impulsive displacement.',
        'Never enter before the liquidity grab completes on your execution timeframe.',
      ],
      diagramType: 'liquidity_sweep',
      quiz: {
        question:
          'What confirms an institutional liquidity sweep rather than a genuine breakout?',
        options: [
          'A sharp wick beyond equal highs/lows followed by strong displacement back inside the range',
          'RSI crossing above 70 on the 5-minute chart',
          'Three consecutive small doji candles inside the Asian range',
        ],
        correctIndex: 0,
        explanation:
          'Institutions raid resting stop orders beyond key highs/lows and immediately displace price back toward the opposite liquidity pool.',
      },
    },
    {
      id: 'les_02',
      courseId: 'crs_smc_liquidity',
      order: 2,
      title: 'Break of Structure (BOS) vs. Change of Character (CHoCH)',
      durationMinutes: 32,
      summary: 'Distinguishing trend continuation from early institutional reversal shifts.',
      content: [
        'Market structure is the backbone of directional bias. A Break of Structure (BOS) confirms trend continuation when price closes with a candle body beyond a protected swing point.',
        'A Change of Character (CHoCH) is the first counter-trend structural break following a higher-timeframe liquidity sweep—signaling that order flow has shifted from accumulation to distribution or vice versa.',
        'Always verify candle body closes rather than wicks alone when validating BOS on H1 and H4 timeframes.',
      ],
      keyRules: [
        'Require a full candle body close beyond structure for a valid H1/H4 BOS.',
        'Only act on M15 CHoCH signals after price taps a higher-timeframe POI.',
        'Protected lows in an uptrend must hold until a confirmed CHoCH occurs.',
      ],
      diagramType: 'bos_choch',
      quiz: {
        question: 'When is an M15 Change of Character (CHoCH) highest probability?',
        options: [
          'In the middle of an empty consolidation range',
          'Immediately after price taps an H4 Point of Interest or sweeps a major liquidity level',
          'During the final 15 minutes before daily rollover spread widening',
        ],
        correctIndex: 1,
        explanation:
          'Lower-timeframe CHoCH shifts carry institutional weight when aligned with an H1/H4 liquidity sweep or order block.',
      },
    },
    {
      id: 'les_03',
      courseId: 'crs_smc_liquidity',
      order: 3,
      title: 'Fair Value Gaps (FVG) & Pricing Imbalances',
      durationMinutes: 26,
      summary:
        'Identifying three-candle displacement inefficiencies where institutions leave resting limit orders.',
      content: [
        'When aggressive institutional buying or selling enters the market, price leaves behind a three-candle gap where candle 1’s wick and candle 3’s wick do not overlap.',
        'Markets seek efficiency. Price frequently rebalances into at least 50% (Consequent Encroachment) of a Fair Value Gap before resuming its impulsive move.',
        'Combine FVGs with Premium and Discount Fibonacci zones (above or below 50% of the dealing range) to filter out low-probability entries.',
      ],
      keyRules: [
        'Buy only inside Discount Fair Value Gaps (below 50% of the impulse leg).',
        'Sell only inside Premium Fair Value Gaps (above 50% of the impulse leg).',
        'Prioritize FVGs created during London or New York Killzones.',
      ],
      diagramType: 'fvg_imbalance',
      quiz: {
        question: 'In a bullish dealing range, where should you look to buy a Fair Value Gap?',
        options: [
          'In the Premium zone above the 75% retracement',
          'In the Discount zone below the 50% equilibrium level',
          'Only after price breaks the next weekly high',
        ],
        correctIndex: 1,
        explanation:
          'Buying in Discount (below 50% equilibrium) maximizes reward-to-risk and aligns with institutional accumulation.',
      },
    },
    {
      id: 'les_04',
      courseId: 'crs_smc_liquidity',
      order: 4,
      title: 'Institutional Order Blocks & Mitigation',
      durationMinutes: 35,
      summary: 'Refining the exact origin candle before displacement to tighten stop-losses cleanly.',
      content: [
        'An Order Block is the final opposing candle prior to an impulsive institutional move that breaks structure and leaves an FVG.',
        'Not every opposing candle is valid. Valid SK Order Blocks must sweep prior minor liquidity, create displacement with an FVG, and sit cleanly inside Premium or Discount.',
        'Place stop-losses safely beyond the structural swing extreme rather than shaving ticks off the candle body.',
      ],
      keyRules: [
        'An Order Block without an accompanying FVG or BOS is low probability.',
        'Refine from H4 down to M15 only when the H4 zone is wide.',
        'Avoid unmitigated Order Blocks that have already been tapped multiple times.',
      ],
      diagramType: 'order_block',
      quiz: {
        question: 'Which feature makes an Order Block valid under SK rules?',
        options: [
          'It leads directly into displacement that creates an FVG and breaks market structure',
          'It is the largest green candle after a news spike',
          'It forms on a Sunday evening market open gap',
        ],
        correctIndex: 0,
        explanation:
          'True institutional order blocks cause energetic displacement, leaving an imbalance (FVG) and a structural break.',
      },
    },
    {
      id: 'les_05',
      courseId: 'crs_smc_liquidity',
      order: 5,
      title: 'Premium vs. Discount Dealing Ranges',
      durationMinutes: 22,
      summary: 'Anchoring Fibonacci 0.50 equilibrium across swing legs so you stop buying tops.',
      content: [
        'Even a valid Order Block fails if you execute in the wrong half of the dealing range. Draw your range from the swing origin to the impulse extreme.',
        'Everything above 50% is Premium (priced for sellers); everything below 50% is Discount (priced for buyers).',
        'Waiting for price to retrace into Discount or Premium eliminates 70% of impulsive chasing errors.',
      ],
      keyRules: [
        'Anchor ranges strictly from the structural swing that caused the BOS.',
        'Optimal Trade Entry (OTE) clusters between 0.618 and 0.786 inside the zone.',
      ],
      diagramType: 'bos_choch',
      quiz: {
        question: 'If EURUSD is bullish on H4, where is the optimal buying region?',
        options: [
          'At 0.236 near the recent swing high',
          'Between 0.618 and 0.786 inside Discount',
          'At exact 0.000 resistance',
        ],
        correctIndex: 1,
        explanation:
          'Deep discount retracements (0.618–0.786) offer high R:R aligned with institutional order blocks.',
      },
    },
    {
      id: 'les_06',
      courseId: 'crs_smc_liquidity',
      order: 6,
      title: 'Multi-Timeframe Top-Down Synchronization',
      durationMinutes: 30,
      summary: 'Linking Daily bias, H4 structure, H1 POI, and M15 trigger entries.',
      content: [
        'Kombat Sampson executes a strict 3-tier top-down sequence before posting any live signal: Daily/H4 for narrative & draw on liquidity, H1 for key Point of Interest, and M15 for precise CHoCH entry.',
        'Never trade an M15 setup that opposes the H4 draw on liquidity unless specifically scalping a sweep reversal with reduced risk.',
      ],
      keyRules: [
        'Daily/H4 sets the target liquidity pool.',
        'H1 defines the supply/demand zone.',
        'M15 confirms entry trigger and stop-loss placement.',
      ],
      diagramType: 'order_block',
      quiz: {
        question: 'In SK’s top-down sequence, what is the primary job of the H4 timeframe?',
        options: [
          'Finding 1-pip sniper entries',
          'Determining directional narrative and the next major liquidity draw',
          'Measuring broker spreads',
        ],
        correctIndex: 1,
        explanation: 'H4 establishes macro structure and identifies where price is gravitating next.',
      },
    },
    {
      id: 'les_07',
      courseId: 'crs_xauusd_mastery',
      order: 1,
      title: 'Gold Session Volatility & Institutional Killzones',
      durationMinutes: 27,
      summary: 'Why XAUUSD moves cleanly during London Open and NY Open—and stalls in dead zones.',
      content: [
        'Gold respects time before price. Nearly 80% of SK’s winning XAUUSD signals trigger inside two windows: London Killzone (02:00–05:00 EST) and New York Killzone (07:00–10:30 EST).',
        'Trading XAUUSD during late New York lunch or thin Asian hours exposes accounts to chop and unnecessary spread spikes.',
      ],
      keyRules: [
        'Trade XAUUSD primarily between 02:00–05:00 EST and 07:30–10:30 EST.',
        'Avoid holding market orders blindly into US CPI or FOMC releases.',
      ],
      diagramType: 'gold_killzone',
      quiz: {
        question: 'Which two EST windows generate the cleanest XAUUSD institutional moves?',
        options: [
          'London Killzone (02:00–05:00 EST) and New York Killzone (07:00–10:30 EST)',
          'Sydney Rollover (17:00–19:00 EST)',
          'Friday afternoon close (15:30–17:00 EST)',
        ],
        correctIndex: 0,
        explanation: 'Institutional bullion liquidity peaks during London and New York open overlaps.',
      },
    },
    {
      id: 'les_08',
      courseId: 'crs_xauusd_mastery',
      order: 2,
      title: 'Asian Range Liquidity Sweeps on XAUUSD',
      durationMinutes: 31,
      summary: 'Using the 20:00–00:00 EST Asian consolidation box to frame London manipulation.',
      content: [
        'When Gold consolidates in a tight 60–120 pip Asian range, equal highs and lows build above and below the box.',
        'At London Open, price routinely spikes one side of the Asian box to induce breakout traders—then violently reverses toward the opposite side of the Asian range and previous daily liquidity.',
      ],
      keyRules: [
        'Box the Asian session high and low before London opens.',
        'Wait for one side to be swept and confirmed with an M15 engulfing / CHoCH.',
      ],
      diagramType: 'liquidity_sweep',
      quiz: {
        question: 'What is the typical Judas Swing behavior on XAUUSD at London Open?',
        options: [
          'Sweeping one side of the Asian Range to trap breakout traders before reversing',
          'Staying completely flat for 8 hours',
          'Moving identically with JPY pairs 1:1',
        ],
        correctIndex: 0,
        explanation:
          'London Open frequently engineers a false move beyond Asian highs or lows to fill institutional orders.',
      },
    },
    {
      id: 'les_09',
      courseId: 'crs_xauusd_mastery',
      order: 3,
      title: 'New York Open Continuation Models',
      durationMinutes: 29,
      summary: 'Catching the 08:30 EST NY pullback when you missed the London entry.',
      content: [
        'If London already initiated the daily move, do not chase at 08:00 EST. Wait for the 08:30 EST New York equity/macro open pullback into London’s Fair Value Gap or Breaker Block.',
        'NY continuation trades typically deliver crisp 1:3 to 1:5 setups targeting London’s extreme.',
      ],
      keyRules: [
        'Check 08:30 EST high-impact USD news calendar before entry.',
        'Enter on retracement into London’s 50% FVG or Breaker.',
      ],
      diagramType: 'fvg_imbalance',
      quiz: {
        question:
          'If London already made a strong directional push on Gold, what should you wait for in New York?',
        options: [
          'Market buy/sell immediately at the extreme',
          'A retracement into London’s Fair Value Gap or Order Block around 08:30 EST',
          'Counter-trend selling with no structural shift',
        ],
        correctIndex: 1,
        explanation:
          'NY Open often rebalances London’s initial expansion before continuing the daily move.',
      },
    },
    {
      id: 'les_10',
      courseId: 'crs_xauusd_mastery',
      order: 4,
      title: 'Scaling Out & Trailing Stop Protocol (TP1 / TP2 / TP3)',
      durationMinutes: 25,
      summary:
        'How SK locks profits at TP1, moves SL to breakeven, and lets runners capture TP3.',
      content: [
        'Every signal published by Kombat Sampson includes three staged targets: TP1 (1:1.5 to 1:2), TP2 (1:3), and TP3 (runner liquidity target).',
        'Once TP1 hits, close 50% of your lot size and move Stop Loss to entry (Breakeven). At TP2, secure another 25–30% and trail behind the latest M15 structural swing.',
      ],
      keyRules: [
        'Take 50% off at TP1 and move Stop Loss to Entry.',
        'Never let a trade that hit TP1 turn into a full loss.',
      ],
      diagramType: 'gold_killzone',
      quiz: {
        question: 'Under SK signal management, what happens immediately when TP1 is reached?',
        options: [
          'Double your lot size on the same trade',
          'Close 50% partial profit and move Stop Loss to Breakeven',
          'Remove the Stop Loss completely',
        ],
        correctIndex: 1,
        explanation:
          'Securing partials at TP1 and eliminating risk protects equity during sudden gold reversals.',
      },
    },
    {
      id: 'les_11',
      courseId: 'crs_xauusd_mastery',
      order: 5,
      title: 'DXY Correlation & Yield Confluence',
      durationMinutes: 24,
      summary: 'Confirming XAUUSD direction using US Dollar Index (DXY) SMT divergence.',
      content: [
        'XAUUSD and DXY generally move inversely. When DXY sweeps a major high while XAUUSD refuses to make a lower low (Smart Money Technique divergence), bullish institutional accumulation on Gold is strongly confirmed.',
      ],
      keyRules: [
        'Keep DXY open alongside XAUUSD and EURUSD.',
        'Look for SMT divergence at H1/H4 highs and lows.',
      ],
      diagramType: 'order_block',
      quiz: {
        question: 'What is bullish SMT divergence between DXY and XAUUSD?',
        options: [
          'DXY makes a higher high while Gold fails to make a lower low',
          'Both DXY and Gold rally simultaneously for 5 days',
          'DXY volume drops to zero',
        ],
        correctIndex: 0,
        explanation:
          'When DXY pushes higher to sweep highs without Gold breaking lower, Gold reveals underlying institutional strength.',
      },
    },
    {
      id: 'les_12',
      courseId: 'crs_risk_psychology',
      order: 1,
      title: 'Fixed Fractional Position Sizing Math',
      durationMinutes: 22,
      summary: 'Calculating exact lot sizes so a 15-pip SL and a 45-pip SL risk identical account %.',
      content: [
        'Amateur traders use the same fixed lot size (e.g. 0.50 lots) on every trade regardless of Stop Loss width. That turns a 50-pip Gold SL into catastrophic over-leverage.',
        'Formula: Lot Size = (Account Balance × Risk %) / (Stop Loss Pips × Pip Value per Standard Lot). Use the built-in SK Lot Calculator before executing every single signal.',
      ],
      keyRules: [
        'Cap risk at 0.5%–1.0% per trade on funded or personal accounts.',
        'Never exceed 2.0% total open correlated exposure (e.g. EURUSD + GBPUSD).',
      ],
      diagramType: 'risk_curve',
      quiz: {
        question:
          'If your balance is $10,000, risk is 1% ($100), and XAUUSD SL is 20 pips ($10/pip per standard lot), what is the exact lot size?',
        options: ['1.00 lot', '0.50 lots', '0.10 lots'],
        correctIndex: 1,
        explanation: '20 pips × $10 × 0.50 lots = $100 exact risk (1% of $10,000).',
      },
    },
    {
      id: 'les_13',
      courseId: 'crs_risk_psychology',
      order: 2,
      title: 'Drawdown Circuit Breakers & Recovery Protocol',
      durationMinutes: 25,
      summary: 'Preventing emotional tilt by cutting risk in half after two consecutive losses.',
      content: [
        'Drawdowns are mathematical inevitabilities, not personal failures. What destroys accounts is doubling lot sizes to win back a loss.',
        'SK Rule: After 2 consecutive full stop-outs in a day, trading stops for 24 hours. If account drawdown reaches 4%, cut per-trade risk from 1% to 0.5% until back at high-water mark.',
      ],
      keyRules: [
        'Max 2 losses per day — step away from the terminal.',
        'Halve risk % during 4%+ drawdowns until equity recovers.',
      ],
      diagramType: 'risk_curve',
      quiz: {
        question: 'What is the SK Circuit Breaker rule after two consecutive full losses in one day?',
        options: [
          'Double lot size on the next New York candle',
          'Stop trading for the rest of the day and review execution logs',
          'Switch to 1-minute scalping',
        ],
        correctIndex: 1,
        explanation:
          'Stepping away after two consecutive losses eliminates revenge trading and preserves capital.',
      },
    },
    {
      id: 'les_14',
      courseId: 'crs_risk_psychology',
      order: 3,
      title: 'Eliminating FOMO & Signal Hesitation',
      durationMinutes: 20,
      summary: 'Trusting predetermined invalidation levels instead of chasing late candles.',
      content: [
        'If a signal has already moved 60% toward TP1 before you saw the alert, do not market-enter at a terrible R:R. Either set a limit at the original entry or wait for the next setup.',
        'Markets run every day—missing one trade costs zero dollars, while chasing a late fill damages both equity and confidence.',
      ],
      keyRules: [
        'Never enter if current price worsens your R:R below 1:1.5 to TP1.',
        'Journal every skipped vs. taken setup objectively.',
      ],
      diagramType: 'risk_curve',
      quiz: {
        question:
          'What should you do if price has already moved most of the way to TP1 before you see a signal?',
        options: [
          'Chase at market with a wider Stop Loss',
          'Skip or place a limit near original entry—never chase poor R:R',
          'Enter the opposite direction',
        ],
        correctIndex: 1,
        explanation:
          'Preserving asymmetric Risk-to-Reward is more important than catching every single move.',
      },
    },
    {
      id: 'les_15',
      courseId: 'crs_risk_psychology',
      order: 4,
      title: 'Pre-Session Institutional Checklist',
      durationMinutes: 18,
      summary: 'The 5-minute routine Kombat Sampson runs before London and New York opens.',
      content: [
        'Check Economic Calendar for Red-Folder USD/EUR/GBP events.',
        'Mark Previous Day High/Low, Asian Range High/Low, and H4 Directional Bias.',
        'Verify account equity, max daily risk budget, and broker spreads before placing orders.',
      ],
      keyRules: [
        'Complete your 5-minute checklist before every killzone.',
        'Log every executed signal inside your SK Trade Journal.',
      ],
      diagramType: 'gold_killzone',
      quiz: {
        question: 'What is the very first item on SK’s pre-session checklist?',
        options: [
          'Checking social media commentary',
          'Reviewing the high-impact Economic Calendar for Red-Folder news',
          'Opening 5 random charts at once',
        ],
        correctIndex: 1,
        explanation:
          'High-impact macroeconomic releases drive volatility spikes and spread widening.',
      },
    },
  ];

  const signals: Signal[] = [
    {
      id: 'sig_xau_001',
      pair: 'XAUUSD',
      direction: 'BUY',
      orderType: 'Buy Limit',
      entry: 2638.5,
      stopLoss: 2631.0,
      tp1: 2648.0,
      tp2: 2658.5,
      tp3: 2672.0,
      riskReward: '1:4.5',
      timeframe: 'M15',
      session: 'New York',
      status: 'Active',
      pipsResult: 0,
      confidence: 'High Conviction',
      thesis:
        'Asian low liquidity swept cleanly at 2634.20 followed by an energetic H1/M15 Break of Structure. Waiting for retracement into the unmitigated M15 Discount Order Block & 50% FVG at 2638.50.',
      chartPattern: 'liquidity_sweep',
      createdAt: hoursAgo(1.5),
      updatedAt: hoursAgo(1.5),
      authorName: 'Kombat Sampson (SK)',
    },
    {
      id: 'sig_eur_002',
      pair: 'EURUSD',
      direction: 'SELL',
      orderType: 'Market Execution',
      entry: 1.0584,
      stopLoss: 1.0604,
      tp1: 1.0554,
      tp2: 1.0524,
      tp3: 1.049,
      riskReward: '1:4.7',
      timeframe: 'H1',
      session: 'London',
      status: 'Active',
      pipsResult: 0,
      confidence: 'High Conviction',
      thesis:
        'London Open Judas swing raided Previous Day High at 1.0598 while DXY held institutional demand. Confirmed M15 CHoCH bearish displacement leaving a clean Premium FVG.',
      chartPattern: 'order_block',
      createdAt: hoursAgo(3.2),
      updatedAt: hoursAgo(2.8),
      authorName: 'Kombat Sampson (SK)',
    },
    {
      id: 'sig_nas_003',
      pair: 'NAS100',
      direction: 'BUY',
      orderType: 'Buy Limit',
      entry: 20780.0,
      stopLoss: 20725.0,
      tp1: 20865.0,
      tp2: 20945.0,
      tp3: 21040.0,
      riskReward: '1:4.7',
      timeframe: 'M15',
      session: 'New York',
      status: 'Active',
      pipsResult: 0,
      confidence: 'Standard Setup',
      thesis:
        'Pre-market NY equity sweep below 20,760 internal low followed by bullish displacement above 20,810. Bid resting at 50% FVG equilibrium with strict 55-point invalidation.',
      chartPattern: 'fvg_continuation',
      createdAt: hoursAgo(4.5),
      updatedAt: hoursAgo(4.5),
      authorName: 'Kombat Sampson (SK)',
    },
    {
      id: 'sig_gbp_004',
      pair: 'GBPUSD',
      direction: 'SELL',
      orderType: 'Market Execution',
      entry: 1.2695,
      stopLoss: 1.272,
      tp1: 1.266,
      tp2: 1.2625,
      tp3: 1.2585,
      riskReward: '1:4.4',
      timeframe: 'H1',
      session: 'London',
      status: 'TP2 Hit',
      pipsResult: 70,
      confidence: 'High Conviction',
      thesis:
        'H4 Supply Breaker tapped during London Killzone after sweeping equal highs. Partialed 50% at TP1 (+35 pips), secured another 30% at TP2 (+70 pips), runner trailing at BE.',
      chartPattern: 'bos_retest',
      createdAt: hoursAgo(18),
      updatedAt: hoursAgo(11),
      authorName: 'Kombat Sampson (SK)',
    },
    {
      id: 'sig_xau_005',
      pair: 'XAUUSD',
      direction: 'SELL',
      orderType: 'Sell Limit',
      entry: 2664.0,
      stopLoss: 2671.5,
      tp1: 2652.0,
      tp2: 2640.0,
      tp3: 2628.0,
      riskReward: '1:4.8',
      timeframe: 'M15',
      session: 'New York',
      status: 'TP3 Hit',
      pipsResult: 360,
      confidence: 'High Conviction',
      thesis:
        'Full institutional distribution from H4 Premium Order Block after NFP liquidity spike. All three targets cleared cleanly inside NY afternoon session.',
      chartPattern: 'liquidity_sweep',
      createdAt: hoursAgo(42),
      updatedAt: hoursAgo(34),
      authorName: 'Kombat Sampson (SK)',
    },
    {
      id: 'sig_us30_006',
      pair: 'US30',
      direction: 'BUY',
      orderType: 'Market Execution',
      entry: 43420.0,
      stopLoss: 43340.0,
      tp1: 43540.0,
      tp2: 43660.0,
      tp3: 43800.0,
      riskReward: '1:4.7',
      timeframe: 'M30',
      session: 'New York',
      status: 'TP1 Hit',
      pipsResult: 120,
      confidence: 'Standard Setup',
      thesis:
        'Clean NY open demand bounce off H1 Bullish Order Block. TP1 secured (+120 pts), stop moved to entry.',
      chartPattern: 'order_block',
      createdAt: hoursAgo(64),
      updatedAt: hoursAgo(58),
      authorName: 'Kombat Sampson (SK)',
    },
    {
      id: 'sig_eurjpy_007',
      pair: 'EURJPY',
      direction: 'BUY',
      orderType: 'Buy Limit',
      entry: 163.45,
      stopLoss: 163.15,
      tp1: 163.95,
      tp2: 164.45,
      tp3: 164.95,
      riskReward: '1:5.0',
      timeframe: 'H1',
      session: 'Asian',
      status: 'SL Hit',
      pipsResult: -30,
      confidence: 'Standard Setup',
      thesis:
        'BOJ commentary induced sudden Yen strength invalidating M15 structure. Fixed 1% risk honored cleanly with zero slippage.',
      chartPattern: 'bos_retest',
      createdAt: hoursAgo(86),
      updatedAt: hoursAgo(82),
      authorName: 'Kombat Sampson (SK)',
    },
  ];

  const takenTrades: TakenTrade[] = [
    {
      id: 'trd_demo_01',
      userId: STUDENT_ID,
      signalId: 'sig_xau_005',
      pair: 'XAUUSD',
      direction: 'SELL',
      entryPrice: 2664.0,
      stopLoss: 2671.5,
      takeProfit: 2640.0,
      lotSize: 0.25,
      riskPercent: 1.0,
      riskAmount: 187.5,
      outcome: 'Won',
      realizedPnl: 600.0,
      pipsCaptured: 240,
      notes: 'Executed limit order on NY Open pullback. Closed 50% at TP1 and held remainder to TP2.',
      takenAt: hoursAgo(40),
    },
    {
      id: 'trd_demo_02',
      userId: STUDENT_ID,
      signalId: 'sig_gbp_004',
      pair: 'GBPUSD',
      direction: 'SELL',
      entryPrice: 1.2695,
      stopLoss: 1.272,
      takeProfit: 1.2625,
      lotSize: 0.4,
      riskPercent: 1.0,
      riskAmount: 100.0,
      outcome: 'Won',
      realizedPnl: 280.0,
      pipsCaptured: 70,
      notes: 'Clean London sweep entry, moved SL to breakeven at TP1.',
      takenAt: hoursAgo(17),
    },
  ];

  const briefings: Briefing[] = [
    {
      id: 'brf_01',
      title: 'Gold (XAUUSD) & DXY New York Liquidity Roadmap',
      session: 'New York',
      bias: 'Bullish',
      pairsWatched: ['XAUUSD', 'EURUSD', 'NAS100'],
      summary:
        'DXY is approaching H4 Premium Supply near 106.85 after sweeping weekly highs. Expecting Gold to hold 2631.00 structural demand and expand toward 2658.50–2672.00 once NY equity liquidity clears.',
      keyLevels: 'XAUUSD Demand: 2634.00–2638.50 · Invalidation: 2631.00 · Target: 2672.00',
      publishedAt: hoursAgo(2),
      author: 'Kombat Sampson (SK)',
    },
    {
      id: 'brf_02',
      title: 'London Session FX Majors Inducement Watch',
      session: 'London',
      bias: 'Bearish',
      pairsWatched: ['EURUSD', 'GBPUSD'],
      summary:
        'Both Euro and Cable engineered equal highs across yesterday’s NY afternoon consolidation. Look for shallow London sweeps into H1 Premium FVGs before targeting 1.0524 and 1.2585 respectively.',
      keyLevels: 'EURUSD Supply: 1.0584–1.0598 · GBPUSD Supply: 1.2695–1.2715',
      publishedAt: hoursAgo(8),
      author: 'Kombat Sampson (SK)',
    },
    {
      id: 'brf_03',
      title: 'High-Impact Macro Risk Protocol (CPI / FOMC Week)',
      session: 'New York',
      bias: 'Neutral',
      pairsWatched: ['XAUUSD', 'NAS100', 'US30'],
      summary:
        'Ahead of 08:30 EST inflation releases, reduce position risk to 0.5% and ensure active London positions are either closed or protected at Breakeven 15 minutes prior to release.',
      keyLevels: 'Max Daily Risk: 1.5% · News Buffer: ±15 mins around 08:30 EST',
      publishedAt: hoursAgo(26),
      author: 'Kombat Sampson (SK)',
    },
  ];

  const leads: LeadInquiry[] = [
    {
      id: 'lead_01',
      name: 'David Mensah',
      email: 'david.mensah@example.com',
      experience: 'Intermediate (6–24 Months)',
      interest: 'VIP Signals & Academy',
      message: 'Trading XAUUSD during London session and looking to master SK order block refinement.',
      status: 'Reviewed',
      createdAt: hoursAgo(14),
    },
  ];

  const users: LocalUser[] = [
    {
      id: MENTOR_ID,
      name: 'Kombat Sampson (SK)',
      email: 'sk@kombatsampson.com',
      role: 'mentor',
      tier: 'Mentor',
      accountBalance: 250000,
      defaultRiskPercent: 0.5,
      createdAt: hoursAgo(720),
    },
    {
      id: STUDENT_ID,
      name: 'Marcus Vance',
      email: 'student@kombatsampson.com',
      role: 'student',
      tier: 'VIP Desk',
      accountBalance: 10000,
      defaultRiskPercent: 1.0,
      createdAt: hoursAgo(240),
    },
  ];

  return {
    users,
    signals,
    takenTrades,
    courses,
    lessons,
    completedLessonsByUser: {
      [STUDENT_ID]: ['les_01', 'les_02', 'les_07', 'les_12'],
      [MENTOR_ID]: lessons.map((l) => l.id),
    },
    briefings,
    leads,
  };
}

function readDb(): LocalDemoDatabase {
  try {
    const raw = window.localStorage.getItem(STORE_KEY);
    if (raw) {
      return JSON.parse(raw) as LocalDemoDatabase;
    }
  } catch {
    // ignore storage errors
  }
  const initial = createInitialLocalDatabase();
  writeDb(initial);
  return initial;
}

function writeDb(db: LocalDemoDatabase): void {
  try {
    window.localStorage.setItem(STORE_KEY, JSON.stringify(db));
  } catch {
    // ignore storage quota errors
  }
}

function getSessionUserId(): string | null {
  try {
    return window.localStorage.getItem(SESSION_KEY);
  } catch {
    return null;
  }
}

function setSessionUserId(uid: string | null): void {
  try {
    if (uid) {
      window.localStorage.setItem(SESSION_KEY, uid);
    } else {
      window.localStorage.removeItem(SESSION_KEY);
    }
  } catch {
    // ignore storage errors
  }
}

function toPublicUser(user: LocalUser): PublicUser {
  return {
    id: user.id,
    name: user.name,
    email: user.email,
    role: user.role,
    tier: user.tier,
    accountBalance: user.accountBalance,
    defaultRiskPercent: user.defaultRiskPercent,
    createdAt: user.createdAt,
  };
}

async function digestPassword(password: string): Promise<string> {
  if (typeof crypto !== 'undefined' && crypto.subtle) {
    const data = new TextEncoder().encode(`skfx-local:${password}`);
    const hash = await crypto.subtle.digest('SHA-256', data);
    return Array.from(new Uint8Array(hash))
      .map((b) => b.toString(16).padStart(2, '0'))
      .join('');
  }
  let h = 2166136261;
  for (let i = 0; i < password.length; i++) {
    h ^= password.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return `fnv_${(h >>> 0).toString(16)}`;
}

function genId(prefix: string): string {
  const rand =
    typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function'
      ? crypto.randomUUID().slice(0, 8)
      : Math.random().toString(36).slice(2, 10);
  return `${prefix}_${rand}`;
}

function jsonRes(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: {'Content-Type': 'application/json'},
  });
}

function cleanStr(val: unknown, maxLen: number): string {
  if (typeof val !== 'string') return '';
  return val.trim().slice(0, maxLen);
}

function cleanNum(val: unknown, fallback = 0): number {
  const n = Number(val);
  return Number.isFinite(n) ? n : fallback;
}

const SYMBOL_CONFIG: Record<
  string,
  {name: string; decimals: number; defaultPrice: number; pipSize: number}
> = {
  XAUUSD: {name: 'Gold / US Dollar', decimals: 3, defaultPrice: 3538.128, pipSize: 0.1},
  DXY: {name: 'US Dollar Index', decimals: 3, defaultPrice: 104.25, pipSize: 0.01},
  'USDT.D': {name: 'Tether Dominance Proxy', decimals: 2, defaultPrice: 4.82, pipSize: 0.01},
  EURUSD: {name: 'Euro / US Dollar', decimals: 5, defaultPrice: 1.0975, pipSize: 0.0001},
  GBPUSD: {name: 'British Pound / US Dollar', decimals: 5, defaultPrice: 1.2845, pipSize: 0.0001},
  AUDUSD: {name: 'Australian Dollar / USD', decimals: 5, defaultPrice: 0.6584, pipSize: 0.0001},
  NZDUSD: {name: 'New Zealand Dollar / USD', decimals: 5, defaultPrice: 0.5942, pipSize: 0.0001},
  USDCAD: {name: 'US Dollar / Canadian Dollar', decimals: 5, defaultPrice: 1.3895, pipSize: 0.0001},
  USDJPY: {name: 'US Dollar / Japanese Yen', decimals: 3, defaultPrice: 152.45, pipSize: 0.01},
  USDCHF: {name: 'US Dollar / Swiss Franc', decimals: 5, defaultPrice: 0.8812, pipSize: 0.0001},
  BTCUSDT: {name: 'Bitcoin / TetherUS', decimals: 2, defaultPrice: 91250.0, pipSize: 1.0},
  NAS100: {name: 'Nasdaq 100 Futures', decimals: 2, defaultPrice: 20480.5, pipSize: 1.0},
  BTCUSD: {name: 'Bitcoin / US Dollar', decimals: 2, defaultPrice: 91250.0, pipSize: 1.0},
};

const INTERVAL_STEP_SEC: Record<string, number> = {
  '5m': 300,
  '15m': 900,
  '30m': 1800,
  '1h': 3600,
  '4h': 14400,
  '1d': 86400,
  '1wk': 604800,
  '1mo': 2592000,
};

function roundPrice(val: number, decimals: number): number {
  const f = 10 ** decimals;
  return Math.round(val * f) / f;
}

function generateLocalCandles(symbolKey: string, intervalKey: string) {
  const cfg = SYMBOL_CONFIG[symbolKey] || SYMBOL_CONFIG.XAUUSD;
  const stepSec = INTERVAL_STEP_SEC[intervalKey] || 86400;
  const nowSec = Math.floor(Date.now() / 1000);
  const count = 260;
  const candles = [];
  let p = cfg.defaultPrice * 0.985;
  const step =
    cfg.pipSize *
    (symbolKey === 'XAUUSD'
      ? 28
      : symbolKey === 'NAS100'
        ? 42
        : symbolKey === 'BTCUSD' || symbolKey === 'BTCUSDT'
          ? 280
          : 14);
  const seedOffset = symbolKey.charCodeAt(0) * 0.13 + intervalKey.charCodeAt(0) * 0.05;
  for (let i = count; i >= 1; i--) {
    const t = Math.floor((nowSec - i * stepSec) / stepSec) * stepSec;
    const wave =
      Math.sin((i + seedOffset) * 0.19) * 0.65 +
      Math.cos((i + seedOffset) * 0.07) * 0.45;
    const delta = wave * step;
    const open = roundPrice(p, cfg.decimals);
    const close = roundPrice(p + delta, cfg.decimals);
    const wickUp = Math.abs(Math.sin(i * 0.43)) * step * 0.9;
    const wickDn = Math.abs(Math.cos(i * 0.37)) * step * 0.9;
    const high = roundPrice(Math.max(open, close) + wickUp, cfg.decimals);
    const low = roundPrice(Math.min(open, close) - wickDn, cfg.decimals);
    candles.push({
      time: t,
      open,
      high,
      low,
      close,
      volume: Math.round(1200 + Math.abs(wave) * 2400),
    });
    p = close;
  }
  const last = candles[candles.length - 1];
  const first = candles[0];
  return {
    symbol: symbolKey,
    displayName: cfg.name,
    interval: intervalKey,
    decimals: cfg.decimals,
    pipSize: cfg.pipSize,
    price: last.close,
    previousClose: first.open,
    change: roundPrice(last.close - first.open, cfg.decimals),
    changePercent: Number((((last.close - first.open) / first.open) * 100).toFixed(2)),
    source: 'Demo Market Feed',
    dateRange: {from: first.time, to: last.time, count: candles.length},
    candles,
  };
}

export async function handleLocalApi(urlStr: string, init?: RequestInit): Promise<Response> {
  const url = new URL(urlStr, window.location.origin);
  const pathname = url.pathname;
  const method = (init?.method || 'GET').toUpperCase();
  let body: Record<string, unknown> = {};
  if (typeof init?.body === 'string' && init.body.trim()) {
    try {
      body = JSON.parse(init.body) as Record<string, unknown>;
    } catch {
      body = {};
    }
  }

  const db = readDb();
  const sessionUid = getSessionUserId();
  const currentUser = sessionUid ? db.users.find((u) => u.id === sessionUid) : undefined;

  if (pathname === '/api/public/showcase' && method === 'GET') {
    const resolvedSignals = db.signals.filter((s) => s.status !== 'Active');
    const wins = resolvedSignals.filter(
      (s) =>
        s.status === 'TP1 Hit' ||
        s.status === 'TP2 Hit' ||
        s.status === 'TP3 Hit' ||
        s.pipsResult > 0,
    ).length;
    const winRatePercent =
      resolvedSignals.length > 0 ? Math.round((wins / resolvedSignals.length) * 100) : 84;
    const netPips90Days = resolvedSignals.reduce((acc, s) => acc + s.pipsResult, 0) + 1840;
    const payload: ShowcasePayload = {
      metrics: {
        winRatePercent,
        netPips90Days,
        activeSignalsCount: db.signals.filter((s) => s.status === 'Active').length,
        totalLessonsCount: db.lessons.length,
        avgRiskReward: '1:4.2',
      },
      recentSignals: db.signals.slice(0, 6),
      courses: db.courses.map((c) => ({
        ...c,
        lessonCount: db.lessons.filter((l) => l.courseId === c.id).length,
      })),
      briefings: db.briefings.slice(0, 3),
    };
    return jsonRes(payload);
  }

  if (pathname === '/api/auth/me' && method === 'GET') {
    return jsonRes({user: currentUser ? toPublicUser(currentUser) : null});
  }

  if (pathname === '/api/auth/demo' && method === 'POST') {
    const role = body.role === 'mentor' ? 'mentor' : 'student';
    const target = db.users.find((u) => u.role === role) || db.users[0];
    if (!target) {
      return jsonRes({error: 'Demo profile not found.'}, 404);
    }
    setSessionUserId(target.id);
    return jsonRes({user: toPublicUser(target)});
  }

  if (pathname === '/api/auth/register' && method === 'POST') {
    const name = cleanStr(body.name, 80);
    const email = cleanStr(body.email, 120).toLowerCase();
    const password = typeof body.password === 'string' ? body.password : '';
    const accountBalance = Math.max(100, cleanNum(body.accountBalance, 10000));

    if (name.length < 2) {
      return jsonRes({error: 'Please enter your full name.'}, 400);
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return jsonRes({error: 'Please enter a valid email address.'}, 400);
    }
    if (password.length < 6) {
      return jsonRes({error: 'Password must be at least 6 characters.'}, 400);
    }
    if (db.users.some((u) => u.email === email)) {
      return jsonRes({error: 'An account with this email already exists.'}, 409);
    }

    const newUser: LocalUser = {
      id: genId('usr'),
      name,
      email,
      passwordDigest: await digestPassword(password),
      role: 'student',
      tier: 'VIP Desk',
      accountBalance,
      defaultRiskPercent: 1.0,
      createdAt: new Date().toISOString(),
    };
    db.users.push(newUser);
    db.completedLessonsByUser[newUser.id] = [];
    writeDb(db);
    setSessionUserId(newUser.id);
    return jsonRes({user: toPublicUser(newUser)}, 201);
  }

  if (pathname === '/api/auth/login' && method === 'POST') {
    const email = cleanStr(body.email, 120).toLowerCase();
    const password = typeof body.password === 'string' ? body.password : '';
    const found = db.users.find((u) => u.email === email);
    if (!found || !found.passwordDigest) {
      return jsonRes(
        {
          error:
            'Use 1-Click Demo Login below or create a new account for static browser access.',
        },
        401,
      );
    }
    const candidate = await digestPassword(password);
    if (candidate !== found.passwordDigest) {
      return jsonRes({error: 'Invalid email or password.'}, 401);
    }
    setSessionUserId(found.id);
    return jsonRes({user: toPublicUser(found)});
  }

  if (pathname === '/api/auth/logout' && method === 'POST') {
    setSessionUserId(null);
    return jsonRes({ok: true});
  }

  if (pathname === '/api/leads' && method === 'POST') {
    const name = cleanStr(body.name, 80);
    const email = cleanStr(body.email, 120).toLowerCase();
    const message = cleanStr(body.message, 800);
    if (name.length < 2 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return jsonRes({error: 'Please enter a valid name and email address.'}, 400);
    }
    const lead: LeadInquiry = {
      id: genId('lead'),
      name,
      email,
      experience:
        (cleanStr(body.experience, 60) as LeadInquiry['experience']) ||
        'Intermediate (6–24 Months)',
      interest:
        (cleanStr(body.interest, 60) as LeadInquiry['interest']) || 'VIP Signals & Academy',
      message,
      status: 'New',
      createdAt: new Date().toISOString(),
    };
    db.leads.unshift(lead);
    writeDb(db);
    return jsonRes({lead}, 201);
  }

  if (pathname === '/api/market/candles' && method === 'GET') {
    const rawSymbol = (url.searchParams.get('symbol') || 'XAUUSD').trim().toUpperCase();
    const rawInterval = (url.searchParams.get('interval') || '1d').trim().toLowerCase();
    const symbolKey = SYMBOL_CONFIG[rawSymbol] ? rawSymbol : 'XAUUSD';
    const intervalKey = INTERVAL_STEP_SEC[rawInterval] ? rawInterval : '1d';
    return jsonRes(generateLocalCandles(symbolKey, intervalKey));
  }

  if (pathname === '/api/market/quotes' && method === 'GET') {
    const quotes = Object.keys(SYMBOL_CONFIG).map((sym) => {
      const data = generateLocalCandles(sym, '1d');
      return {
        symbol: sym,
        name: data.displayName,
        decimals: data.decimals,
        price: data.price,
        change: data.change,
        changePercent: data.changePercent,
      };
    });
    return jsonRes({quotes});
  }

  // Protected routes below
  if (!currentUser) {
    return jsonRes({error: 'Sign in required to access your trading desk.'}, 401);
  }

  if (pathname === '/api/auth/preferences' && method === 'PATCH') {
    if (body.accountBalance !== undefined) {
      currentUser.accountBalance = Math.max(
        50,
        Math.min(10000000, cleanNum(body.accountBalance, currentUser.accountBalance)),
      );
    }
    if (body.defaultRiskPercent !== undefined) {
      currentUser.defaultRiskPercent = Math.max(
        0.1,
        Math.min(10, cleanNum(body.defaultRiskPercent, currentUser.defaultRiskPercent)),
      );
    }
    writeDb(db);
    return jsonRes({user: toPublicUser(currentUser)});
  }

  if (pathname === '/api/signals' && method === 'GET') {
    const sorted = [...db.signals].sort(
      (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
    );
    return jsonRes({signals: sorted});
  }

  if (pathname === '/api/signals' && method === 'POST') {
    if (currentUser.role !== 'mentor') {
      return jsonRes({error: 'Mentor clearance required for this action.'}, 403);
    }
    const pair = cleanStr(body.pair, 20).toUpperCase();
    const direction = body.direction === 'SELL' ? 'SELL' : 'BUY';
    const orderType = ([
      'Market Execution',
      'Buy Limit',
      'Sell Limit',
      'Buy Stop',
      'Sell Stop',
    ].includes(String(body.orderType))
      ? String(body.orderType)
      : direction === 'BUY'
        ? 'Buy Limit'
        : 'Sell Limit') as Signal['orderType'];

    const entry = cleanNum(body.entry);
    const stopLoss = cleanNum(body.stopLoss);
    const tp1 = cleanNum(body.tp1);
    const tp2 = cleanNum(body.tp2);
    const tp3 = cleanNum(body.tp3);
    const thesis = cleanStr(body.thesis, 800);

    if (!pair || entry <= 0 || stopLoss <= 0 || tp1 <= 0 || !thesis) {
      return jsonRes(
        {error: 'Pair, valid Entry, Stop Loss, TP1, and Thesis are required.'},
        400,
      );
    }

    const riskDist = Math.abs(entry - stopLoss);
    const rewardDist = Math.abs((tp3 || tp2 || tp1) - entry);
    const rrVal = riskDist > 0 ? (rewardDist / riskDist).toFixed(1) : '3.0';
    const now = new Date().toISOString();
    const created: Signal = {
      id: genId('sig'),
      pair,
      direction,
      orderType,
      entry,
      stopLoss,
      tp1,
      tp2: tp2 || tp1,
      tp3: tp3 || tp2 || tp1,
      riskReward: `1:${rrVal}`,
      timeframe: (['M15', 'M30', 'H1', 'H4'].includes(String(body.timeframe))
        ? String(body.timeframe)
        : 'M15') as Signal['timeframe'],
      session: (['London', 'New York', 'Asian'].includes(String(body.session))
        ? String(body.session)
        : 'New York') as Signal['session'],
      status: 'Active',
      pipsResult: 0,
      confidence:
        body.confidence === 'Standard Setup' ? 'Standard Setup' : 'High Conviction',
      thesis,
      chartPattern: ([
        'liquidity_sweep',
        'order_block',
        'fvg_continuation',
        'bos_retest',
      ].includes(String(body.chartPattern))
        ? String(body.chartPattern)
        : 'liquidity_sweep') as Signal['chartPattern'],
      createdAt: now,
      updatedAt: now,
      authorName: currentUser.name,
    };
    db.signals.unshift(created);
    writeDb(db);
    return jsonRes({signal: created}, 201);
  }

  if (pathname.startsWith('/api/signals/')) {
    if (currentUser.role !== 'mentor') {
      return jsonRes({error: 'Mentor clearance required for this action.'}, 403);
    }
    const signalId = pathname.slice('/api/signals/'.length);
    const signal = db.signals.find((s) => s.id === signalId);
    if (!signal) {
      return jsonRes({error: 'Signal not found.'}, 404);
    }
    if (method === 'PATCH') {
      const validStatuses: SignalStatus[] = [
        'Active',
        'TP1 Hit',
        'TP2 Hit',
        'TP3 Hit',
        'SL Hit',
        'Closed',
      ];
      if (validStatuses.includes(body.status as SignalStatus)) {
        signal.status = body.status as SignalStatus;
      }
      if (body.pipsResult !== undefined) {
        signal.pipsResult = cleanNum(body.pipsResult, signal.pipsResult);
      }
      signal.updatedAt = new Date().toISOString();
      writeDb(db);
      return jsonRes({signal});
    }
    if (method === 'DELETE') {
      db.signals = db.signals.filter((s) => s.id !== signalId);
      writeDb(db);
      return jsonRes({ok: true});
    }
  }

  if (pathname === '/api/trades' && method === 'GET') {
    const userTrades = db.takenTrades
      .filter((t) => t.userId === currentUser.id)
      .sort((a, b) => new Date(b.takenAt).getTime() - new Date(a.takenAt).getTime());
    return jsonRes({trades: userTrades});
  }

  if (pathname === '/api/trades' && method === 'POST') {
    const signalId = cleanStr(body.signalId, 60);
    const signal = db.signals.find((s) => s.id === signalId);
    if (!signal) {
      return jsonRes({error: 'Target signal not found.'}, 404);
    }
    const newTrade: TakenTrade = {
      id: genId('trd'),
      userId: currentUser.id,
      signalId: signal.id,
      pair: signal.pair,
      direction: signal.direction,
      entryPrice: signal.entry,
      stopLoss: signal.stopLoss,
      takeProfit: cleanNum(body.takeProfit, signal.tp2),
      lotSize: Math.max(0.01, cleanNum(body.lotSize, 0.1)),
      riskPercent: Math.max(0.1, cleanNum(body.riskPercent, 1.0)),
      riskAmount: Math.max(1, cleanNum(body.riskAmount, 100)),
      outcome: 'Open',
      realizedPnl: 0,
      pipsCaptured: 0,
      notes:
        cleanStr(body.notes, 400) ||
        `Executed ${signal.pair} ${signal.direction} from SK live signal.`,
      takenAt: new Date().toISOString(),
    };
    db.takenTrades.unshift(newTrade);
    writeDb(db);
    return jsonRes({trade: newTrade}, 201);
  }

  if (pathname.startsWith('/api/trades/') && method === 'PATCH') {
    const tradeId = pathname.slice('/api/trades/'.length);
    const trade = db.takenTrades.find(
      (t) => t.id === tradeId && t.userId === currentUser.id,
    );
    if (!trade) {
      return jsonRes({error: 'Trade journal entry not found.'}, 404);
    }
    if (['Open', 'Won', 'Lost', 'Breakeven'].includes(String(body.outcome))) {
      trade.outcome = body.outcome as TakenTrade['outcome'];
    }
    if (body.realizedPnl !== undefined) {
      trade.realizedPnl = cleanNum(body.realizedPnl, trade.realizedPnl);
    }
    if (body.pipsCaptured !== undefined) {
      trade.pipsCaptured = cleanNum(body.pipsCaptured, trade.pipsCaptured);
    }
    if (typeof body.notes === 'string') {
      trade.notes = cleanStr(body.notes, 400);
    }
    writeDb(db);
    return jsonRes({trade});
  }

  if (pathname === '/api/academy' && method === 'GET') {
    const completedIds = db.completedLessonsByUser[currentUser.id] || [];
    return jsonRes({
      courses: db.courses,
      lessons: db.lessons,
      completedLessonIds: completedIds,
    });
  }

  if (pathname === '/api/academy/progress' && method === 'POST') {
    const lessonId = cleanStr(body.lessonId, 60);
    if (!db.lessons.some((l) => l.id === lessonId)) {
      return jsonRes({error: 'Lesson not found.'}, 404);
    }
    const current = [...(db.completedLessonsByUser[currentUser.id] || [])];
    const shouldComplete =
      typeof body.completed === 'boolean' ? body.completed : !current.includes(lessonId);
    if (shouldComplete && !current.includes(lessonId)) {
      current.push(lessonId);
    } else if (!shouldComplete) {
      const idx = current.indexOf(lessonId);
      if (idx !== -1) current.splice(idx, 1);
    }
    db.completedLessonsByUser[currentUser.id] = current;
    writeDb(db);
    return jsonRes({completedLessonIds: current});
  }

  if (pathname === '/api/academy/lessons' && method === 'POST') {
    if (currentUser.role !== 'mentor') {
      return jsonRes({error: 'Mentor clearance required for this action.'}, 403);
    }
    const courseId = cleanStr(body.courseId, 60);
    if (!db.courses.some((c) => c.id === courseId)) {
      return jsonRes({error: 'Target course not found.'}, 404);
    }
    const title = cleanStr(body.title, 120);
    const summary = cleanStr(body.summary, 280);
    const rawContent = cleanStr(body.content, 3000);
    const rawRules = cleanStr(body.keyRules, 1000);
    const durationMinutes = Math.max(
      5,
      Math.min(180, cleanNum(body.durationMinutes, 20)),
    );
    if (!title || !summary || !rawContent) {
      return jsonRes(
        {error: 'Title, summary, and lesson content are required.'},
        400,
      );
    }
    const courseLessons = db.lessons.filter((l) => l.courseId === courseId);
    const newLesson: Lesson = {
      id: genId('les'),
      courseId,
      order: courseLessons.length + 1,
      title,
      durationMinutes,
      summary,
      content: rawContent
        .split(/\n+/)
        .map((p) => p.trim())
        .filter(Boolean),
      keyRules: rawRules
        ? rawRules
            .split(/\n+/)
            .map((r) => r.trim())
            .filter(Boolean)
        : ['Verify higher-timeframe liquidity alignment before executing.'],
      diagramType: 'order_block',
      quiz: {
        question: `What is the core institutional takeaway from "${title}"?`,
        options: [
          'Wait for liquidity sweep + structural confirmation inside Premium/Discount',
          'Enter at market regardless of stop-loss distance',
          'Ignore session timing and news calendars',
        ],
        correctIndex: 0,
        explanation:
          'Discipline around liquidity and structural confirmation protects capital.',
      },
    };
    db.lessons.push(newLesson);
    writeDb(db);
    return jsonRes({lesson: newLesson}, 201);
  }

  if (pathname === '/api/briefings' && method === 'GET') {
    return jsonRes({briefings: db.briefings});
  }

  if (pathname === '/api/briefings' && method === 'POST') {
    if (currentUser.role !== 'mentor') {
      return jsonRes({error: 'Mentor clearance required for this action.'}, 403);
    }
    const title = cleanStr(body.title, 140);
    const summary = cleanStr(body.summary, 1200);
    const keyLevels = cleanStr(body.keyLevels, 300);
    const pairsRaw = cleanStr(body.pairsWatched, 120);
    if (!title || !summary) {
      return jsonRes(
        {error: 'Briefing title and analysis summary are required.'},
        400,
      );
    }
    const briefing: Briefing = {
      id: genId('brf'),
      title,
      session: (['London', 'New York', 'Asian'].includes(String(body.session))
        ? String(body.session)
        : 'New York') as Briefing['session'],
      bias: (['Bullish', 'Bearish', 'Neutral'].includes(String(body.bias))
        ? String(body.bias)
        : 'Neutral') as Briefing['bias'],
      pairsWatched: pairsRaw
        ? pairsRaw
            .split(',')
            .map((p) => p.trim().toUpperCase())
            .filter(Boolean)
        : ['XAUUSD', 'EURUSD'],
      summary,
      keyLevels: keyLevels || 'Key zones updated inside live signals feed.',
      publishedAt: new Date().toISOString(),
      author: currentUser.name,
    };
    db.briefings.unshift(briefing);
    writeDb(db);
    return jsonRes({briefing}, 201);
  }

  if (pathname === '/api/leads' && method === 'GET') {
    if (currentUser.role !== 'mentor') {
      return jsonRes({error: 'Mentor clearance required for this action.'}, 403);
    }
    return jsonRes({leads: db.leads});
  }

  return jsonRes({error: 'Endpoint not found.'}, 404);
}
