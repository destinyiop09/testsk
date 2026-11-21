import {useCallback, useEffect, useMemo, useState} from 'react';
import {AnimatePresence, motion} from 'motion/react';
import {
  Award,
  Bell,
  BookOpen,
  Calculator,
  Calendar,
  CandlestickChart,
  CheckCircle2,
  ChevronDown,
  ClipboardList,
  Compass,
  Globe,
  GraduationCap,
  HelpCircle,
  LogOut,
  Menu,
  Moon,
  PlayCircle,
  Plus,
  Radio,
  Search,
  Settings,
  ShieldCheck,
  Sun,
  Trash2,
  TrendingDown,
  TrendingUp,
  User,
  Users,
  X,
} from 'lucide-react';
import type {
  Briefing,
  Course,
  LeadInquiry,
  Lesson,
  PublicUser,
  Signal,
  SignalStatus,
  TakenTrade,
} from '../types';
import {apiFetch} from '../lib/apiClient';
import {
  calculatePositionSizing,
  formatPrice,
  formatRelativeTime,
} from '../lib/forexMath';
import {BrandLogo} from './BrandLogo';
import {ChartStructureDiagram} from './ChartStructureDiagram';
import {LotCalculatorPanel} from './LotCalculatorPanel';
import {ResilientImage} from './ResilientImage';
import {TradingViewSimulator} from './TradingViewSimulator';

type DeskTab =
  | 'academy'
  | 'courses'
  | 'lessons'
  | 'paths'
  | 'simulator'
  | 'events'
  | 'community'
  | 'journal'
  | 'certificates'
  | 'settings'
  | 'support'
  | 'signals'
  | 'calculator'
  | 'briefings'
  | 'mentor';

interface TradingDeskProps {
  user: PublicUser;
  isDark: boolean;
  onToggleTheme: () => void;
  onBackToLanding: () => void;
  onUserUpdated: (user: PublicUser) => void;
  onLogout: () => void;
}

export function TradingDesk({
  user,
  isDark,
  onToggleTheme,
  onBackToLanding,
  onUserUpdated,
  onLogout,
}: TradingDeskProps) {
  const [activeTab, setActiveTab] = useState<DeskTab>('academy');
  const [playgroundSubTab, setPlaygroundSubTab] = useState<'chart' | 'signals' | 'calculator'>('chart');
  const [openGroups, setOpenGroups] = useState<Record<string, boolean>>({
    LEARNING: false,
    'PRACTICE & COMMUNITY': false,
    ACCOUNT: false,
  });
  const [settingsBalance, setSettingsBalance] = useState(String(user.accountBalance || 10000));
  const [settingsRisk, setSettingsRisk] = useState(String(user.defaultRiskPercent || 1.0));
  const [settingsTimezone, setSettingsTimezone] = useState(
    () => (typeof window !== 'undefined' && localStorage.getItem('skfx_timezone')) || 'UTC',
  );
  const [settingsNotifySignals, setSettingsNotifySignals] = useState(
    () => (typeof window !== 'undefined' ? localStorage.getItem('skfx_notify_signals') !== 'false' : true),
  );
  const [settingsNotifySessions, setSettingsNotifySessions] = useState(
    () => (typeof window !== 'undefined' ? localStorage.getItem('skfx_notify_sessions') !== 'false' : true),
  );
  const [settingsConfirmOrders, setSettingsConfirmOrders] = useState(
    () => (typeof window !== 'undefined' ? localStorage.getItem('skfx_confirm_orders') !== 'false' : true),
  );
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const [signals, setSignals] = useState<Signal[]>([]);
  const [selectedSignalId, setSelectedSignalId] = useState<string | null>(null);
  const [signalFilter, setSignalFilter] = useState<'all' | 'active' | 'won' | 'closed'>('all');
  const [signalQuery, setSignalQuery] = useState('');

  const [trades, setTrades] = useState<TakenTrade[]>([]);
  const [courses, setCourses] = useState<Course[]>([]);
  const [lessons, setLessons] = useState<Lesson[]>([]);
  const [completedLessonIds, setCompletedLessonIds] = useState<string[]>([]);
  const [activeCourseId, setActiveCourseId] = useState<string>('');
  const [activeLessonId, setActiveLessonId] = useState<string>('');
  const [quizAnswer, setQuizAnswer] = useState<number | null>(null);

  const [briefings, setBriefings] = useState<Briefing[]>([]);
  const [leads, setLeads] = useState<LeadInquiry[]>([]);
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState<{type: 'ok' | 'err'; msg: string} | null>(null);

  const [execRiskPct, setExecRiskPct] = useState(String(user.defaultRiskPercent || 1.0));
  const [execBalance, setExecBalance] = useState(String(user.accountBalance || 10000));
  const [execTargetTier, setExecTargetTier] = useState<'tp1' | 'tp2' | 'tp3'>('tp2');
  const [execNotes, setExecNotes] = useState('');
  const [takingTrade, setTakingTrade] = useState(false);

  const [calcSeed, setCalcSeed] = useState<{
    pair: string;
    entry: number;
    stopLoss: number;
    takeProfit: number;
  } | null>(null);

  const [newPair, setNewPair] = useState('XAUUSD');
  const [newDirection, setNewDirection] = useState<'BUY' | 'SELL'>('BUY');
  const [newOrderType, setNewOrderType] = useState<Signal['orderType']>('Buy Limit');
  const [newEntry, setNewEntry] = useState('2642.00');
  const [newSl, setNewSl] = useState('2634.50');
  const [newTp1, setNewTp1] = useState('2652.00');
  const [newTp2, setNewTp2] = useState('2664.00');
  const [newTp3, setNewTp3] = useState('2678.00');
  const [newTf, setNewTf] = useState<Signal['timeframe']>('M15');
  const [newSession, setNewSession] = useState<Signal['session']>('New York');
  const [newThesis, setNewThesis] = useState('');
  const [publishingSignal, setPublishingSignal] = useState(false);

  const [brfTitle, setBrfTitle] = useState('');
  const [brfSession, setBrfSession] = useState<Briefing['session']>('New York');
  const [brfBias, setBrfBias] = useState<Briefing['bias']>('Bullish');
  const [brfPairs, setBrfPairs] = useState('XAUUSD, EURUSD');
  const [brfSummary, setBrfSummary] = useState('');
  const [brfLevels, setBrfLevels] = useState('');

  const [lesCourseId, setLesCourseId] = useState('crs_xauusd_mastery');
  const [lesTitle, setLesTitle] = useState('');
  const [lesSummary, setLesSummary] = useState('');
  const [lesDuration, setLesDuration] = useState('24');
  const [lesContent, setLesContent] = useState('');
  const [lesRules, setLesRules] = useState('');

  const showToast = useCallback((type: 'ok' | 'err', msg: string) => {
    setToast({type, msg});
    window.setTimeout(() => {
      setToast((prev) => (prev?.msg === msg ? null : prev));
    }, 3500);
  }, []);

  const loadWorkspace = useCallback(async () => {
    setLoading(true);
    try {
      const [sigRes, trdRes, acdRes, brfRes] = await Promise.all([
        apiFetch('/api/signals'),
        apiFetch('/api/trades'),
        apiFetch('/api/academy'),
        apiFetch('/api/briefings'),
      ]);

      if (sigRes.ok) {
        const d = (await sigRes.json()) as {signals: Signal[]};
        setSignals(d.signals);
        setSelectedSignalId((prev) =>
          prev && d.signals.some((s) => s.id === prev)
            ? prev
            : d.signals[0]?.id || null,
        );
      }
      if (trdRes.ok) {
        const d = (await trdRes.json()) as {trades: TakenTrade[]};
        setTrades(d.trades);
      }
      if (acdRes.ok) {
        const d = (await acdRes.json()) as {
          courses: Course[];
          lessons: Lesson[];
          completedLessonIds: string[];
        };
        setCourses(d.courses);
        setLessons(d.lessons);
        setCompletedLessonIds(d.completedLessonIds);
        setActiveCourseId((prev) => prev || d.courses[0]?.id || '');
        setActiveLessonId((prev) => prev || d.lessons[0]?.id || '');
      }
      if (brfRes.ok) {
        const d = (await brfRes.json()) as {briefings: Briefing[]};
        setBriefings(d.briefings);
      }
      if (user.role === 'mentor') {
        const leadRes = await apiFetch('/api/leads');
        if (leadRes.ok) {
          const d = (await leadRes.json()) as {leads: LeadInquiry[]};
          setLeads(d.leads);
        }
      }
    } finally {
      setLoading(false);
    }
  }, [user.role]);

  useEffect(() => {
    loadWorkspace();
  }, [loadWorkspace]);

  const filteredSignals = useMemo(() => {
    return signals.filter((s) => {
      if (signalFilter === 'active' && s.status !== 'Active') return false;
      if (
        signalFilter === 'won' &&
        !['TP1 Hit', 'TP2 Hit', 'TP3 Hit'].includes(s.status)
      )
        return false;
      if (
        signalFilter === 'closed' &&
        !['SL Hit', 'Closed'].includes(s.status)
      )
        return false;
      if (signalQuery.trim()) {
        const q = signalQuery.trim().toLowerCase();
        return (
          s.pair.toLowerCase().includes(q) ||
          s.session.toLowerCase().includes(q) ||
          s.thesis.toLowerCase().includes(q)
        );
      }
      return true;
    });
  }, [signals, signalFilter, signalQuery]);

  const selectedSignal = useMemo(
    () => signals.find((s) => s.id === selectedSignalId) || filteredSignals[0] || null,
    [signals, selectedSignalId, filteredSignals],
  );

  const signalSizing = useMemo(() => {
    if (!selectedSignal) return null;
    const tp =
      execTargetTier === 'tp1'
        ? selectedSignal.tp1
        : execTargetTier === 'tp3'
          ? selectedSignal.tp3
          : selectedSignal.tp2;
    return calculatePositionSizing({
      pair: selectedSignal.pair,
      accountBalance: Math.max(50, Number(execBalance) || user.accountBalance),
      riskPercent: Math.max(0.1, Number(execRiskPct) || user.defaultRiskPercent),
      entry: selectedSignal.entry,
      stopLoss: selectedSignal.stopLoss,
      takeProfit: tp,
    });
  }, [selectedSignal, execBalance, execRiskPct, execTargetTier, user]);

  const handleTakeSignal = async () => {
    if (!selectedSignal || !signalSizing) return;
    setTakingTrade(true);
    try {
      const tp =
        execTargetTier === 'tp1'
          ? selectedSignal.tp1
          : execTargetTier === 'tp3'
            ? selectedSignal.tp3
            : selectedSignal.tp2;
      const res = await apiFetch('/api/trades', {
        method: 'POST',
        headers: {'Content-Type': 'application/json'},
        body: JSON.stringify({
          signalId: selectedSignal.id,
          lotSize: signalSizing.lotSize,
          riskPercent: Number(execRiskPct) || 1.0,
          riskAmount: Math.round(signalSizing.riskAmount * 100) / 100,
          takeProfit: tp,
          notes: execNotes.trim(),
        }),
      });
      const data = (await res.json()) as {trade?: TakenTrade; error?: string};
      if (!res.ok || !data.trade) {
        showToast('err', data.error || 'Could not log trade.');
        return;
      }
      setTrades((prev) => [data.trade!, ...prev]);
      setExecNotes('');
      showToast(
        'ok',
        `Logged ${selectedSignal.pair} ${selectedSignal.direction} (${signalSizing.lotSize.toFixed(2)} lots) to your journal.`,
      );
    } finally {
      setTakingTrade(false);
    }
  };

  const handleUpdateTradeOutcome = async (
    trade: TakenTrade,
    outcome: TakenTrade['outcome'],
  ) => {
    let nextPnl = trade.realizedPnl;
    let nextPips = trade.pipsCaptured;
    if (outcome === 'Won' && nextPnl <= 0) {
      nextPnl = Math.round(trade.riskAmount * 2.5 * 100) / 100;
      nextPips = 50;
    } else if (outcome === 'Lost') {
      nextPnl = -Math.abs(trade.riskAmount);
      nextPips = -25;
    } else if (outcome === 'Breakeven') {
      nextPnl = 0;
      nextPips = 0;
    }

    const res = await apiFetch(`/api/trades/${trade.id}`, {
      method: 'PATCH',
      headers: {'Content-Type': 'application/json'},
      body: JSON.stringify({
        outcome,
        realizedPnl: nextPnl,
        pipsCaptured: nextPips,
      }),
    });
    if (res.ok) {
      const data = (await res.json()) as {trade: TakenTrade};
      setTrades((prev) => prev.map((t) => (t.id === trade.id ? data.trade : t)));
      showToast('ok', `Updated ${trade.pair} journal outcome to ${outcome}.`);
    }
  };

  const handleToggleLessonComplete = async (lessonId: string) => {
    const isCompleted = completedLessonIds.includes(lessonId);
    const res = await apiFetch('/api/academy/progress', {
      method: 'POST',
      headers: {'Content-Type': 'application/json'},
      body: JSON.stringify({lessonId, completed: !isCompleted}),
    });
    if (res.ok) {
      const data = (await res.json()) as {completedLessonIds: string[]};
      setCompletedLessonIds(data.completedLessonIds);
      showToast(
        'ok',
        !isCompleted ? 'Lesson marked completed.' : 'Lesson completion cleared.',
      );
    }
  };

  const handleSavePrefs = async (balance: number, riskPercent: number) => {
    const res = await apiFetch('/api/auth/preferences', {
      method: 'PATCH',
      headers: {'Content-Type': 'application/json'},
      body: JSON.stringify({accountBalance: balance, defaultRiskPercent: riskPercent}),
    });
    if (res.ok) {
      const data = (await res.json()) as {user: PublicUser};
      onUserUpdated(data.user);
      setExecBalance(String(data.user.accountBalance));
      setExecRiskPct(String(data.user.defaultRiskPercent));
      showToast('ok', 'Account balance and default risk saved.');
    }
  };

  const handlePublishSignal = async (e: React.FormEvent) => {
    e.preventDefault();
    setPublishingSignal(true);
    try {
      const res = await apiFetch('/api/signals', {
        method: 'POST',
        headers: {'Content-Type': 'application/json'},
        body: JSON.stringify({
          pair: newPair,
          direction: newDirection,
          orderType: newOrderType,
          entry: Number(newEntry),
          stopLoss: Number(newSl),
          tp1: Number(newTp1),
          tp2: Number(newTp2),
          tp3: Number(newTp3),
          timeframe: newTf,
          session: newSession,
          thesis: newThesis,
        }),
      });
      const data = (await res.json()) as {signal?: Signal; error?: string};
      if (!res.ok || !data.signal) {
        showToast('err', data.error || 'Failed to publish signal.');
        return;
      }
      setSignals((prev) => [data.signal!, ...prev]);
      setSelectedSignalId(data.signal.id);
      setNewThesis('');
      showToast('ok', `Published ${data.signal.pair} ${data.signal.direction} signal to all members.`);
    } finally {
      setPublishingSignal(false);
    }
  };

  const handleUpdateSignalStatus = async (
    signalId: string,
    status: SignalStatus,
    pipsResult: number,
  ) => {
    const res = await apiFetch(`/api/signals/${signalId}`, {
      method: 'PATCH',
      headers: {'Content-Type': 'application/json'},
      body: JSON.stringify({status, pipsResult}),
    });
    if (res.ok) {
      const data = (await res.json()) as {signal: Signal};
      setSignals((prev) => prev.map((s) => (s.id === signalId ? data.signal : s)));
      showToast('ok', `Signal marked ${status}.`);
    }
  };

  const handleDeleteSignal = async (signalId: string) => {
    const res = await apiFetch(`/api/signals/${signalId}`, {method: 'DELETE'});
    if (res.ok) {
      setSignals((prev) => prev.filter((s) => s.id !== signalId));
      showToast('ok', 'Signal removed from feed.');
    }
  };

  const handlePublishBriefing = async (e: React.FormEvent) => {
    e.preventDefault();
    const res = await apiFetch('/api/briefings', {
      method: 'POST',
      headers: {'Content-Type': 'application/json'},
      body: JSON.stringify({
        title: brfTitle,
        session: brfSession,
        bias: brfBias,
        pairsWatched: brfPairs,
        summary: brfSummary,
        keyLevels: brfLevels,
      }),
    });
    const data = (await res.json()) as {briefing?: Briefing; error?: string};
    if (!res.ok || !data.briefing) {
      showToast('err', data.error || 'Could not publish briefing.');
      return;
    }
    setBriefings((prev) => [data.briefing!, ...prev]);
    setBrfTitle('');
    setBrfSummary('');
    setBrfLevels('');
    showToast('ok', 'Market briefing published.');
  };

  const handleAddLesson = async (e: React.FormEvent) => {
    e.preventDefault();
    const res = await apiFetch('/api/academy/lessons', {
      method: 'POST',
      headers: {'Content-Type': 'application/json'},
      body: JSON.stringify({
        courseId: lesCourseId,
        title: lesTitle,
        summary: lesSummary,
        durationMinutes: Number(lesDuration) || 20,
        content: lesContent,
        keyRules: lesRules,
      }),
    });
    const data = (await res.json()) as {lesson?: Lesson; error?: string};
    if (!res.ok || !data.lesson) {
      showToast('err', data.error || 'Could not add lesson.');
      return;
    }
    setLessons((prev) => [...prev, data.lesson!]);
    setLesTitle('');
    setLesSummary('');
    setLesContent('');
    setLesRules('');
    showToast('ok', `Added lesson "${data.lesson.title}" to curriculum.`);
  };

  const courseLessons = useMemo(
    () =>
      lessons
        .filter((l) => l.courseId === activeCourseId)
        .sort((a, b) => a.order - b.order),
    [lessons, activeCourseId],
  );

  const activeLesson = useMemo(
    () =>
      lessons.find((l) => l.id === activeLessonId) ||
      courseLessons[0] ||
      lessons[0] ||
      null,
    [lessons, activeLessonId, courseLessons],
  );

  const journalStats = useMemo(() => {
    const closed = trades.filter((t) => t.outcome !== 'Open');
    const won = closed.filter((t) => t.outcome === 'Won').length;
    const netPnl = trades.reduce((acc, t) => acc + t.realizedPnl, 0);
    const totalPips = trades.reduce((acc, t) => acc + t.pipsCaptured, 0);
    const winRate = closed.length > 0 ? Math.round((won / closed.length) * 100) : 0;
    return {
      netPnl,
      totalPips,
      winRate,
      openCount: trades.filter((t) => t.outcome === 'Open').length,
    };
  }, [trades]);

  const academyPct =
    lessons.length > 0
      ? Math.round((completedLessonIds.length / lessons.length) * 100)
      : 0;

  const navGroups: {
    heading: string;
    items: {id: DeskTab; label: string; icon: typeof Radio}[];
  }[] = [
    {
      heading: 'LEARNING',
      items: [
        {id: 'academy', label: 'My Academy', icon: GraduationCap},
        {id: 'courses', label: 'All Courses', icon: BookOpen},
        {id: 'lessons', label: 'Video Lessons', icon: PlayCircle},
        {id: 'paths', label: 'Learning Paths', icon: Compass},
      ],
    },
    {
      heading: 'PRACTICE & COMMUNITY',
      items: [
        {id: 'simulator', label: 'Trading Playground', icon: CandlestickChart},
        {id: 'events', label: 'Events & Webinars', icon: Calendar},
        {id: 'community', label: 'Community', icon: Users},
        {id: 'journal', label: 'Trading Journal', icon: ClipboardList},
      ],
    },
    {
      heading: 'ACCOUNT',
      items: [
        {id: 'certificates', label: 'Certificates', icon: Award},
        {id: 'settings', label: 'General Settings', icon: Settings},
        {id: 'support', label: 'Help & Support', icon: HelpCircle},
      ],
    },
  ];

  const navItems = navGroups.flatMap((g) => g.items);
  if (user.role === 'mentor') {
    navItems.push({id: 'mentor', label: 'SK Mentor Desk', icon: ShieldCheck});
  }

  const activeGroup =
    navGroups.find((g) => g.items.some((item) => item.id === activeTab)) ||
    (activeTab === 'signals' || activeTab === 'calculator'
      ? navGroups[1]
      : navGroups[0]);

  const toggleGroup = (heading: string) => {
    setOpenGroups((prev) => ({...prev, [heading]: !prev[heading]}));
  };

  const activeTabLabel =
    navItems.find((n) => n.id === activeTab)?.label ||
    (activeTab === 'signals'
      ? 'Live Signals'
      : activeTab === 'calculator'
        ? 'Lot Calculator'
        : 'My Academy');

  return (
    <div className="relative min-h-screen overflow-x-clip bg-[#F8FAFC] dark:bg-[#070B14] text-[#0F172A] dark:text-[#F8FAFC] flex">
      {/* Desktop Sidebar */}
      <aside className="relative z-10 hidden lg:flex w-64 shrink-0 flex-col border-r border-slate-200/85 dark:border-blue-400/15 bg-white dark:bg-[#0D2448] text-[#0F172A] dark:text-white">
        <div className="px-5 py-4 border-b border-slate-200/85 dark:border-blue-400/20 flex items-center justify-between">
          <button
            type="button"
            onClick={onBackToLanding}
            className="inline-flex items-center gap-2.5 font-display text-base font-bold tracking-tight text-[#0F172A] dark:text-white hover:text-[#1D4ED8] dark:hover:text-emerald-400 transition-colors whitespace-nowrap"
          >
            <BrandLogo className="w-7 h-7 rounded-full shadow-sm" />
            <span>SKFX ACADEMY</span>
          </button>
        </div>

        <nav className="flex-1 overflow-y-auto px-3 py-4 space-y-3">
          {navGroups.map((group) => {
            const isOpen = Boolean(openGroups[group.heading]);
            const activeItemInGroup = group.items.find((item) => item.id === activeTab);
            const hasActiveChild = Boolean(activeItemInGroup);
            return (
              <div
                key={group.heading}
                className={`rounded-xl border p-2 transition-colors ${
                  hasActiveChild
                    ? 'border-[#2563EB]/30 bg-blue-50/45 dark:border-blue-400/25 dark:bg-[#081733]/85'
                    : 'border-slate-200/80 bg-slate-50/75 dark:border-blue-400/12 dark:bg-[#081733]/50'
                }`}
              >
                <button
                  type="button"
                  onClick={() => toggleGroup(group.heading)}
                  aria-expanded={isOpen}
                  className="w-full flex items-center justify-between gap-2 px-2 py-1.5 text-left transition-colors"
                >
                  <div className="min-w-0">
                    <span className="block text-[10px] font-bold uppercase tracking-[0.16em] text-slate-500 dark:text-blue-200/75 hover:text-[#0F172A] dark:hover:text-white">
                      {group.heading}
                    </span>
                    {!isOpen && activeItemInGroup && (
                      <span className="block truncate text-[11px] font-semibold text-[#2563EB] dark:text-blue-400 mt-0.5">
                        {activeItemInGroup.label}
                      </span>
                    )}
                  </div>
                  <ChevronDown
                    className={`w-3.5 h-3.5 shrink-0 text-slate-500 dark:text-blue-200/75 transition-transform duration-200 ${
                      isOpen ? 'rotate-180' : ''
                    }`}
                  />
                </button>

                <AnimatePresence initial={false}>
                  {isOpen && (
                    <motion.div
                      initial={{height: 0, opacity: 0}}
                      animate={{height: 'auto', opacity: 1}}
                      exit={{height: 0, opacity: 0}}
                      transition={{duration: 0.18, ease: [0.16, 1, 0.3, 1]}}
                      className="overflow-hidden"
                    >
                      <div className="pt-1 space-y-0.5">
                        {group.items.map((item) => {
                          const Icon = item.icon;
                          const active = activeTab === item.id;
                          return (
                            <button
                              key={item.id}
                              type="button"
                              onClick={() => setActiveTab(item.id)}
                              className={`relative w-full flex items-center gap-2.5 px-2.5 py-2 rounded-lg text-[13px] font-medium transition-colors whitespace-nowrap ${
                                active
                                  ? 'text-white'
                                  : 'text-slate-600 dark:text-blue-100/80 hover:bg-white/80 dark:hover:bg-blue-900/50 hover:text-[#0F172A] dark:hover:text-white'
                              }`}
                            >
                              {active && (
                                <motion.span
                                  layoutId="desk-sidebar-active"
                                  transition={{type: 'spring', stiffness: 450, damping: 35}}
                                  className="absolute inset-0 rounded-lg bg-[#2563EB] shadow-sm"
                                />
                              )}
                              <Icon className="relative z-10 w-4 h-4 shrink-0" />
                              <span className="relative z-10">{item.label}</span>
                            </button>
                          );
                        })}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            );
          })}

          {user.role === 'mentor' && (
            <button
              type="button"
              onClick={() => setActiveTab('mentor')}
              className={`relative w-full flex items-center gap-2.5 px-3.5 py-2.5 rounded-xl border text-[13px] font-semibold transition-colors whitespace-nowrap ${
                activeTab === 'mentor'
                  ? 'border-[#16A34A] bg-[#16A34A] text-white'
                  : 'border-slate-200/80 dark:border-blue-400/15 bg-slate-50/75 dark:bg-[#081733]/50 text-slate-700 dark:text-blue-100 hover:text-[#0F172A] dark:hover:text-white'
              }`}
            >
              <ShieldCheck className="w-4 h-4 shrink-0" />
              <span>SK Mentor Desk</span>
            </button>
          )}
        </nav>

        <div className="p-4 border-t border-slate-200/85 dark:border-blue-400/20">
          <button
            type="button"
            onClick={onLogout}
            aria-label="Sign out"
            className="w-full inline-flex items-center justify-center gap-2 py-2 px-3 rounded-md border border-slate-200/90 dark:border-blue-400/30 bg-[#F8FAFC] dark:bg-transparent text-xs font-medium text-slate-600 dark:text-blue-200 hover:text-[#DC2626] dark:hover:text-[#F87171] hover:border-red-300 transition-colors"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span>Sign out</span>
          </button>
        </div>
      </aside>

      {/* Mobile Drawer */}
      <AnimatePresence>
        {mobileMenuOpen && (
          <div className="fixed inset-0 z-50 lg:hidden flex">
            <motion.div
              initial={{opacity: 0}}
              animate={{opacity: 1}}
              exit={{opacity: 0}}
              transition={{duration: 0.18}}
              className="fixed inset-0 bg-slate-900/45 backdrop-blur-sm"
              onClick={() => setMobileMenuOpen(false)}
            />
            <motion.div
              initial={{x: -264}}
              animate={{x: 0}}
              exit={{x: -264}}
              transition={{duration: 0.22, ease: [0.16, 1, 0.3, 1]}}
              className="relative z-10 w-64 max-w-[82vw] max-h-screen overflow-y-auto bg-white dark:bg-[#0D2448] text-[#0F172A] dark:text-white border-r border-slate-200/85 dark:border-blue-400/20 flex flex-col p-4"
            >
              <div className="flex items-center justify-between pb-4 border-b border-slate-200/85 dark:border-blue-400/20">
                <span className="inline-flex items-center gap-2 font-display font-bold text-[#0F172A] dark:text-white">
                  <BrandLogo className="w-7 h-7 rounded-full shadow-sm" />
                  <span>SKFX ACADEMY</span>
                </span>
                <button
                  type="button"
                  onClick={() => setMobileMenuOpen(false)}
                  className="p-1.5 text-slate-500 dark:text-blue-200"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
              <nav className="flex-1 py-3 space-y-3 overflow-y-auto">
                {navGroups.map((group) => {
                  const isOpen = Boolean(openGroups[group.heading]);
                  const activeItemInGroup = group.items.find((item) => item.id === activeTab);
                  const hasActiveChild = Boolean(activeItemInGroup);
                  return (
                    <div
                      key={group.heading}
                      className={`rounded-xl border p-2 transition-colors ${
                        hasActiveChild
                          ? 'border-[#2563EB]/30 bg-blue-50/45 dark:border-blue-400/25 dark:bg-[#081733]/85'
                          : 'border-slate-200/80 bg-slate-50/75 dark:border-blue-400/12 dark:bg-[#081733]/50'
                      }`}
                    >
                      <button
                        type="button"
                        onClick={() => toggleGroup(group.heading)}
                        aria-expanded={isOpen}
                        className="w-full flex items-center justify-between gap-2 px-2 py-1.5 text-left"
                      >
                        <div className="min-w-0">
                          <span className="block text-[10px] font-bold uppercase tracking-[0.16em] text-slate-500 dark:text-blue-200/75">
                            {group.heading}
                          </span>
                          {!isOpen && activeItemInGroup && (
                            <span className="block truncate text-[11px] font-semibold text-[#2563EB] dark:text-blue-400 mt-0.5">
                              {activeItemInGroup.label}
                            </span>
                          )}
                        </div>
                        <ChevronDown
                          className={`w-3.5 h-3.5 shrink-0 text-slate-500 dark:text-blue-200/75 transition-transform duration-200 ${
                            isOpen ? 'rotate-180' : ''
                          }`}
                        />
                      </button>

                      <AnimatePresence initial={false}>
                        {isOpen && (
                          <motion.div
                            initial={{height: 0, opacity: 0}}
                            animate={{height: 'auto', opacity: 1}}
                            exit={{height: 0, opacity: 0}}
                            transition={{duration: 0.18, ease: [0.16, 1, 0.3, 1]}}
                            className="overflow-hidden"
                          >
                            <div className="pt-1 space-y-0.5">
                              {group.items.map((item) => {
                                const Icon = item.icon;
                                const active = activeTab === item.id;
                                return (
                                  <button
                                    key={item.id}
                                    type="button"
                                    onClick={() => {
                                      setActiveTab(item.id);
                                      setMobileMenuOpen(false);
                                    }}
                                    className={`relative w-full flex items-center gap-2.5 px-2.5 py-2 rounded-lg text-[13px] font-medium transition-colors ${
                                      active
                                        ? 'text-white'
                                        : 'text-slate-600 dark:text-blue-100/80'
                                    }`}
                                  >
                                    {active && (
                                      <motion.span
                                        layoutId="desk-drawer-active"
                                        transition={{type: 'spring', stiffness: 450, damping: 35}}
                                        className="absolute inset-0 rounded-lg bg-[#2563EB]"
                                      />
                                    )}
                                    <Icon className="relative z-10 w-4 h-4 shrink-0" />
                                    <span className="relative z-10">{item.label}</span>
                                  </button>
                                );
                              })}
                            </div>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>
                  );
                })}
              </nav>
              <div className="mt-auto pt-3 border-t border-slate-200/85 dark:border-blue-400/20">
                <button
                  type="button"
                  onClick={onLogout}
                  className="w-full py-2 px-3 rounded-lg border border-red-300 dark:border-red-400/40 text-xs font-medium text-[#DC2626] dark:text-red-300"
                >
                  Sign Out
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Main Content Viewport */}
      <div className="relative z-10 flex-1 min-w-0 flex flex-col">
        {/* Workspace Header */}
        <header className="sticky top-0 z-30 border-b border-slate-200/85 dark:border-blue-400/15 bg-white/95 dark:bg-[#071122]/95 backdrop-blur-xl px-4 sm:px-6 py-3.5 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3 min-w-0">
            <button
              type="button"
              onClick={() => setMobileMenuOpen(true)}
              aria-label="Open navigation menu"
              className="lg:hidden p-2 rounded-lg border border-slate-200/90 dark:border-blue-400/20 text-[#0F172A] dark:text-slate-200"
            >
              <Menu className="w-4 h-4" />
            </button>
            <div className="flex items-center gap-2 text-xs sm:text-sm text-slate-500 dark:text-slate-400 truncate">
              <span className="font-semibold text-[#0F172A] dark:text-white truncate">
                {activeTabLabel}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2.5 shrink-0">
            <button
              type="button"
              onClick={onToggleTheme}
              aria-label="Toggle color theme"
              className="p-2 rounded-lg border border-slate-200/90 dark:border-blue-400/20 text-[#0F172A] dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-[#12223F] transition-colors"
            >
              {isDark ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
            </button>
            {user.role === 'mentor' && (
              <button
                type="button"
                onClick={() => setActiveTab('mentor')}
                className="inline-flex items-center gap-1.5 px-2.5 sm:px-3.5 py-2 rounded-lg bg-[#16A34A] text-white text-xs font-semibold hover:bg-[#15803D] transition-colors whitespace-nowrap shrink-0"
              >
                <Plus className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Publish Signal</span>
                <span className="sm:hidden">Publish</span>
              </button>
            )}
          </div>
        </header>

        {/* Mobile Encapsulated Category + Sub-Tab Strip */}
        <div className="lg:hidden border-b border-slate-200/85 dark:border-blue-400/15 bg-white dark:bg-[#071122] px-3 sm:px-4 py-2 space-y-2">
          <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar">
            {navGroups.map((group) => {
              const groupActive = activeGroup.heading === group.heading && activeTab !== 'mentor';
              return (
                <button
                  key={group.heading}
                  type="button"
                  onClick={() => {
                    if (group.items[0]) setActiveTab(group.items[0].id);
                  }}
                  className={`px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-[0.12em] whitespace-nowrap shrink-0 transition-colors ${
                    groupActive
                      ? 'bg-[#0F172A] text-white dark:bg-white dark:text-[#070B14]'
                      : 'bg-slate-100 dark:bg-white/[0.06] text-slate-500 dark:text-blue-200/70'
                  }`}
                >
                  {group.heading}
                </button>
              );
            })}
            {user.role === 'mentor' && (
              <button
                type="button"
                onClick={() => setActiveTab('mentor')}
                className={`px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-[0.12em] whitespace-nowrap shrink-0 transition-colors ${
                  activeTab === 'mentor'
                    ? 'bg-[#16A34A] text-white'
                    : 'bg-slate-100 dark:bg-white/[0.06] text-slate-500 dark:text-blue-200/70'
                }`}
              >
                MENTOR DESK
              </button>
            )}
          </div>

          {activeTab !== 'mentor' && (
            <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar rounded-xl border border-slate-200/80 dark:border-blue-400/15 bg-slate-50 dark:bg-[#0B1528] p-1">
              {activeGroup.items.map((item) => {
                const Icon = item.icon;
                const active = activeTab === item.id;
                return (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => setActiveTab(item.id)}
                    className={`relative inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap shrink-0 transition-colors ${
                      active
                        ? 'text-white'
                        : 'text-slate-600 dark:text-blue-100/80'
                    }`}
                  >
                    {active && (
                      <motion.span
                        layoutId="desk-mobile-tab-active"
                        transition={{type: 'spring', stiffness: 450, damping: 35}}
                        className="absolute inset-0 rounded-lg bg-[#2563EB] shadow-sm"
                      />
                    )}
                    <Icon className="relative z-10 w-3.5 h-3.5 shrink-0" />
                    <span className="relative z-10">{item.label}</span>
                  </button>
                );
              })}
            </div>
          )}
        </div>

        {/* Feedback Toast */}
        <AnimatePresence>
          {toast && (
            <motion.div
              initial={{opacity: 0, y: -8}}
              animate={{opacity: 1, y: 0}}
              exit={{opacity: 0, y: -8}}
              transition={{duration: 0.18}}
              className="px-4 sm:px-6 pt-4"
            >
              <div
                className={`rounded-lg px-4 py-2.5 text-xs font-medium border ${
                  toast.type === 'ok'
                    ? 'bg-[#16A34A]/10 border-[#16A34A]/30 text-[#15803D] dark:text-emerald-400'
                    : 'bg-[#DC2626]/10 border-[#DC2626]/30 text-[#DC2626] dark:text-red-400'
                }`}
              >
                {toast.msg}
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        <main
          className={`flex-1 w-full mx-auto ${
            activeTab === 'simulator' && playgroundSubTab === 'chart'
              ? 'p-2 sm:p-3.5 max-w-[1680px]'
              : 'p-4 sm:p-6 max-w-[1360px]'
          }`}
        >
          {loading ? (
            <div className="space-y-4">
              <div className="h-12 rounded-xl bg-slate-200/70 dark:bg-[#0B1528] animate-pulse" />
              <div className="h-80 rounded-xl bg-slate-200/70 dark:bg-[#0B1528] animate-pulse" />
            </div>
          ) : (
            <motion.div
              key={activeTab}
              initial={{opacity: 0, y: 6}}
              animate={{opacity: 1, y: 0}}
              transition={{duration: 0.18, ease: [0.16, 1, 0.3, 1]}}
            >
              {/* TAB 1: LIVE SIGNALS FEED */}
              {activeTab === 'signals' && (
                <div className="space-y-6">
                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div className="flex flex-wrap items-center gap-1 p-1 rounded-lg bg-white dark:bg-[#0B1528] border border-slate-200/85 dark:border-blue-400/20 self-start">
                      {[
                        {id: 'all', label: 'All Setups'},
                        {id: 'active', label: 'Active'},
                        {id: 'won', label: 'Targets Hit'},
                        {id: 'closed', label: 'Closed / SL'},
                      ].map((tab) => {
                        const active = signalFilter === tab.id;
                        return (
                          <button
                            key={tab.id}
                            type="button"
                            onClick={() =>
                              setSignalFilter(tab.id as typeof signalFilter)
                            }
                            className={`relative px-3 py-1.5 rounded-md text-xs font-medium transition-colors whitespace-nowrap ${
                              active
                                ? 'text-white'
                                : 'text-slate-600 dark:text-slate-300 hover:text-[#0F172A] dark:hover:text-white'
                            }`}
                          >
                            {active && (
                              <motion.span
                                layoutId="desk-signal-filter"
                                transition={{type: 'spring', stiffness: 450, damping: 34}}
                                className="absolute inset-0 rounded-md bg-[#1D4ED8] shadow-sm"
                              />
                            )}
                            <span className="relative z-10">{tab.label}</span>
                          </button>
                        );
                      })}
                    </div>

                    <div className="relative w-full md:w-64">
                      <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                      <input
                        type="text"
                        value={signalQuery}
                        onChange={(e) => setSignalQuery(e.target.value)}
                        placeholder="Filter pair or session..."
                        className="w-full pl-9 pr-3 py-2 rounded-lg border border-slate-200/85 dark:border-blue-400/20 bg-white dark:bg-[#0B1528] text-xs text-[#0F172A] dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-[#1D4ED8]"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 xl:grid-cols-12 gap-6 items-start">
                    {/* Signals List */}
                    <div className="xl:col-span-7 rounded-xl border border-slate-200/85 dark:border-blue-400/20 bg-white dark:bg-[#0B1528] overflow-hidden">
                      {filteredSignals.length === 0 ? (
                        <div className="p-10 text-center">
                          <p className="text-sm font-medium text-slate-700 dark:text-slate-300">
                            No signals match this filter.
                          </p>
                          <button
                            type="button"
                            onClick={() => {
                              setSignalFilter('all');
                              setSignalQuery('');
                            }}
                            className="mt-3 px-3 py-1.5 rounded-lg bg-[#1D4ED8] text-white text-xs font-medium"
                          >
                            Reset Filter
                          </button>
                        </div>
                      ) : (
                        <div className="divide-y divide-slate-200/80 dark:divide-blue-400/15">
                          {filteredSignals.map((sig) => {
                            const isSelected = selectedSignal?.id === sig.id;
                            const isBuy = sig.direction === 'BUY';
                            const isWin = ['TP1 Hit', 'TP2 Hit', 'TP3 Hit'].includes(
                              sig.status,
                            );
                            const isLoss = sig.status === 'SL Hit';
                            return (
                              <button
                                key={sig.id}
                                type="button"
                                onClick={() => setSelectedSignalId(sig.id)}
                                className={`w-full text-left p-4 transition-colors flex flex-col sm:flex-row sm:items-center justify-between gap-3 ${
                                  isSelected
                                    ? 'bg-blue-50 dark:bg-[#132648]'
                                    : 'hover:bg-slate-50 dark:hover:bg-[#10203B]'
                                }`}
                              >
                                <div className="min-w-0">
                                  <div className="flex items-center gap-2.5">
                                    <span className="font-display font-bold text-base text-[#0F172A] dark:text-white">
                                      {sig.pair}
                                    </span>
                                    <span
                                      className={`inline-flex items-center gap-1 text-xs font-bold ${
                                        isBuy
                                          ? 'text-[#16A34A] dark:text-emerald-400'
                                          : 'text-[#DC2626] dark:text-red-400'
                                      }`}
                                    >
                                      {isBuy ? (
                                        <TrendingUp className="w-3.5 h-3.5" />
                                      ) : (
                                        <TrendingDown className="w-3.5 h-3.5" />
                                      )}
                                      {sig.direction}
                                    </span>
                                    <span className="text-xs text-slate-500 dark:text-slate-400">
                                      · {sig.orderType}
                                    </span>
                                  </div>
                                  <div className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                                    {sig.session} Session · {sig.timeframe} ·{' '}
                                    {formatRelativeTime(sig.createdAt)}
                                  </div>
                                </div>

                                <div className="flex sm:flex-col items-center sm:items-end justify-between gap-1 shrink-0">
                                  <span className="font-mono tabular-nums text-xs font-semibold text-[#0F172A] dark:text-slate-100">
                                    Entry {formatPrice(sig.pair, sig.entry)} ·{' '}
                                    <span className="text-[#DC2626] dark:text-red-400">
                                      SL {formatPrice(sig.pair, sig.stopLoss)}
                                    </span>
                                  </span>
                                  <span
                                    className={`text-xs font-semibold ${
                                      isWin
                                        ? 'text-[#16A34A] dark:text-emerald-400'
                                        : isLoss
                                          ? 'text-[#DC2626] dark:text-red-400'
                                          : 'text-[#1D4ED8] dark:text-blue-400'
                                    }`}
                                  >
                                    {sig.status} · {sig.riskReward} R:R
                                  </span>
                                </div>
                              </button>
                            );
                          })}
                        </div>
                      )}
                    </div>

                    {/* Signal Inspector & One-Click Execution */}
                    <div className="xl:col-span-5 space-y-4">
                      {selectedSignal && (
                        <div className="rounded-xl border border-slate-200/85 dark:border-blue-400/20 bg-white dark:bg-[#0B1528] p-4 sm:p-5 space-y-5">
                          <div className="flex flex-wrap items-start justify-between gap-2.5 sm:gap-3">
                            <div>
                              <p className="text-xs font-medium text-[#1D4ED8] dark:text-blue-400">
                                {selectedSignal.confidence} · {selectedSignal.session} Killzone
                              </p>
                              <h2 className="font-display text-xl font-bold text-[#0F172A] dark:text-white mt-0.5">
                                {selectedSignal.pair}{' '}
                                <span
                                  className={
                                    selectedSignal.direction === 'BUY'
                                      ? 'text-[#16A34A]'
                                      : 'text-[#DC2626]'
                                  }
                                >
                                  {selectedSignal.direction}
                                </span>
                              </h2>
                            </div>
                            <button
                              type="button"
                              onClick={() => {
                                setCalcSeed({
                                  pair: selectedSignal.pair,
                                  entry: selectedSignal.entry,
                                  stopLoss: selectedSignal.stopLoss,
                                  takeProfit: selectedSignal.tp2,
                                });
                                setActiveTab('calculator');
                              }}
                              className="px-3 py-1.5 rounded-lg border border-slate-200/90 dark:border-blue-400/25 text-xs font-medium text-[#0F172A] dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-[#132648] transition-colors whitespace-nowrap"
                            >
                              Open in Calculator
                            </button>
                          </div>

                          <ChartStructureDiagram mode="signal" signal={selectedSignal} />

                          <div className="grid grid-cols-3 gap-1.5 sm:gap-2.5 text-[11px] sm:text-xs">
                            <div className="p-2 sm:p-2.5 rounded-lg bg-[#F8FAFC] dark:bg-[#071122] border border-slate-200/80 dark:border-blue-400/15 min-w-0">
                              <span className="text-slate-500 dark:text-slate-400 block">
                                Entry
                              </span>
                              <span className="font-mono tabular-nums font-semibold text-[#1D4ED8] dark:text-blue-400">
                                {formatPrice(selectedSignal.pair, selectedSignal.entry)}
                              </span>
                            </div>
                            <div className="p-2 sm:p-2.5 rounded-lg bg-[#F8FAFC] dark:bg-[#071122] border border-slate-200/80 dark:border-blue-400/15 min-w-0">
                              <span className="text-slate-500 dark:text-slate-400 block">
                                Stop Loss
                              </span>
                              <span className="font-mono tabular-nums font-semibold text-[#DC2626]">
                                {formatPrice(selectedSignal.pair, selectedSignal.stopLoss)}
                              </span>
                            </div>
                            <div className="p-2 sm:p-2.5 rounded-lg bg-[#F8FAFC] dark:bg-[#071122] border border-slate-200/80 dark:border-blue-400/15 min-w-0">
                              <span className="text-slate-500 dark:text-slate-400 block">
                                TP1 / TP2 / TP3
                              </span>
                              <span className="font-mono tabular-nums font-semibold text-[#16A34A] dark:text-emerald-400">
                                {formatPrice(selectedSignal.pair, selectedSignal.tp1)}
                              </span>
                            </div>
                          </div>

                          <div>
                            <h3 className="text-xs font-semibold text-[#0F172A] dark:text-white mb-1">
                              SKFX ACADEMY Institutional Thesis
                            </h3>
                            <p className="text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
                              {selectedSignal.thesis}
                            </p>
                          </div>

                          {/* Execution & Log Panel */}
                          <div className="pt-4 border-t border-slate-200/80 dark:border-blue-400/15 space-y-3">
                            <div className="flex flex-wrap items-center justify-between gap-1.5">
                              <span className="text-xs font-semibold text-[#0F172A] dark:text-white">
                                Take Signal & Log to Journal
                              </span>
                              {signalSizing && (
                                <span className="font-mono tabular-nums text-xs font-bold text-[#1D4ED8] dark:text-blue-400">
                                  Recommended: {signalSizing.lotSize.toFixed(2)} lots
                                </span>
                              )}
                            </div>

                            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 sm:gap-2">
                              <div>
                                <label className="block text-[11px] text-slate-500 dark:text-slate-400 mb-1">
                                  Balance ($)
                                </label>
                                <input
                                  type="number"
                                  value={execBalance}
                                  onChange={(e) => setExecBalance(e.target.value)}
                                  className="w-full rounded-md border border-slate-200/85 dark:border-blue-400/20 bg-[#F8FAFC] dark:bg-[#071122] px-2.5 py-1.5 text-xs font-mono tabular-nums"
                                />
                              </div>
                              <div>
                                <label className="block text-[11px] text-slate-500 dark:text-slate-400 mb-1">
                                  Risk (%)
                                </label>
                                <input
                                  type="number"
                                  step="0.25"
                                  value={execRiskPct}
                                  onChange={(e) => setExecRiskPct(e.target.value)}
                                  className="w-full rounded-md border border-slate-200/85 dark:border-blue-400/20 bg-[#F8FAFC] dark:bg-[#071122] px-2.5 py-1.5 text-xs font-mono tabular-nums"
                                />
                              </div>
                              <div>
                                <label className="block text-[11px] text-slate-500 dark:text-slate-400 mb-1">
                                  Target Tier
                                </label>
                                <select
                                  value={execTargetTier}
                                  onChange={(e) =>
                                    setExecTargetTier(e.target.value as 'tp1' | 'tp2' | 'tp3')
                                  }
                                  className="w-full rounded-md border border-slate-200/85 dark:border-blue-400/20 bg-[#F8FAFC] dark:bg-[#071122] px-2 py-1.5 text-xs font-mono"
                                >
                                  <option value="tp1">TP1</option>
                                  <option value="tp2">TP2</option>
                                  <option value="tp3">TP3</option>
                                </select>
                              </div>
                            </div>

                            <input
                              type="text"
                              value={execNotes}
                              onChange={(e) => setExecNotes(e.target.value)}
                              placeholder="Optional execution note (e.g. entered on M15 CHoCH)..."
                              className="w-full rounded-md border border-slate-200/85 dark:border-blue-400/20 bg-[#F8FAFC] dark:bg-[#071122] px-3 py-2 text-xs"
                            />

                            <button
                              type="button"
                              disabled={takingTrade}
                              onClick={handleTakeSignal}
                              className="w-full py-2.5 px-4 rounded-lg bg-[#16A34A] text-white text-xs font-semibold hover:bg-[#15803D] transition-colors disabled:opacity-60"
                            >
                              {takingTrade
                                ? 'Logging Execution...'
                                : `Take Trade (${signalSizing?.lotSize.toFixed(2) || '0.10'} lots · Risk $${signalSizing?.riskAmount.toFixed(0) || '100'})`}
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )}

              {/* TAB 2: SK ACADEMY */}
              {activeTab === 'academy' && (
                <div className="space-y-6">
                  <div className="rounded-xl border border-slate-200/85 dark:border-blue-400/20 bg-white dark:bg-[#0D2448] text-[#0F172A] dark:text-white p-5 flex flex-col md:flex-row md:items-center justify-between gap-4 shadow-sm">
                    <div>
                      <h2 className="font-display text-xl font-bold text-[#0F172A] dark:text-white">
                        SKFX ACADEMY Forex Curriculum
                      </h2>
                      <p className="text-xs text-[#2563EB] dark:text-blue-200 font-medium mt-0.5">
                        {completedLessonIds.length} of {lessons.length} lessons completed ({academyPct}%)
                      </p>
                    </div>
                    <div className="w-full md:w-64">
                      <div className="h-2.5 rounded-full bg-slate-100 dark:bg-blue-950 overflow-hidden border border-slate-200/80 dark:border-transparent">
                        <div
                          className="h-full bg-[#2563EB] dark:bg-[#16A34A] transition-all duration-300"
                          style={{width: `${academyPct}%`}}
                        />
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {courses.map((course) => {
                      const isCourseActive = activeCourseId === course.id;
                      const cLessons = lessons.filter((l) => l.courseId === course.id);
                      const cDone = cLessons.filter((l) =>
                        completedLessonIds.includes(l.id),
                      ).length;
                      return (
                        <button
                          key={course.id}
                          type="button"
                          onClick={() => {
                            setActiveCourseId(course.id);
                            setQuizAnswer(null);
                            if (cLessons[0]) setActiveLessonId(cLessons[0].id);
                          }}
                          className={`text-left rounded-xl border overflow-hidden transition-colors flex items-center gap-3.5 p-3 ${
                            isCourseActive
                              ? 'border-[#1D4ED8] bg-blue-50 dark:bg-[#132648]'
                              : 'border-slate-200/85 dark:border-blue-400/20 bg-white dark:bg-[#0B1528] hover:bg-slate-50 dark:hover:bg-[#10203B]'
                          }`}
                        >
                          <div className="w-16 h-14 rounded-lg overflow-hidden shrink-0">
                            <ResilientImage
                              src={course.thumbnailUrl}
                              alt={course.title}
                              className="w-full h-full object-cover"
                            />
                          </div>
                          <div className="min-w-0">
                            <p className="text-xs font-semibold text-[#0F172A] dark:text-white truncate">
                              {course.title}
                            </p>
                            <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5 font-mono tabular-nums">
                              {cDone}/{cLessons.length} completed · {course.estimatedHours}h
                            </p>
                          </div>
                        </button>
                      );
                    })}
                  </div>

                  <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
                    <div className="lg:col-span-4 rounded-xl border border-slate-200/85 dark:border-blue-400/20 bg-white dark:bg-[#0B1528] divide-y divide-slate-200/80 dark:divide-blue-400/15">
                      {courseLessons.map((les) => {
                        const done = completedLessonIds.includes(les.id);
                        const selected = activeLesson?.id === les.id;
                        return (
                          <button
                            key={les.id}
                            type="button"
                            onClick={() => {
                              setActiveLessonId(les.id);
                              setQuizAnswer(null);
                            }}
                            className={`w-full text-left p-4 flex items-start gap-3 transition-colors ${
                              selected
                                ? 'bg-blue-50 dark:bg-[#132648]'
                                : 'hover:bg-slate-50 dark:hover:bg-[#10203B]'
                            }`}
                          >
                            <CheckCircle2
                              className={`w-4 h-4 mt-0.5 shrink-0 ${
                                done
                                  ? 'text-[#16A34A]'
                                  : 'text-slate-300 dark:text-slate-600'
                              }`}
                            />
                            <div className="min-w-0">
                              <p className="text-xs font-semibold text-[#0F172A] dark:text-white">
                                {les.order}. {les.title}
                              </p>
                              <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5 font-mono tabular-nums">
                                {les.durationMinutes} min study
                              </p>
                            </div>
                          </button>
                        );
                      })}
                    </div>

                    <div className="lg:col-span-8">
                      {activeLesson && (
                        <div className="rounded-xl border border-slate-200/85 dark:border-blue-400/20 bg-white dark:bg-[#0B1528] p-4 sm:p-6 space-y-6">
                          <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4 pb-4 border-b border-slate-200/80 dark:border-blue-400/15">
                            <div>
                              <p className="text-xs text-[#1D4ED8] dark:text-blue-400 font-semibold">
                                Lesson {activeLesson.order} · {activeLesson.durationMinutes} Minutes
                              </p>
                              <h3 className="font-display text-2xl font-bold text-[#0F172A] dark:text-white mt-1">
                                {activeLesson.title}
                              </h3>
                              <p className="text-sm text-slate-600 dark:text-slate-300 mt-1">
                                {activeLesson.summary}
                              </p>
                            </div>
                            <button
                              type="button"
                              onClick={() => handleToggleLessonComplete(activeLesson.id)}
                              className={`px-4 py-2 rounded-lg text-xs font-semibold transition-colors whitespace-nowrap shrink-0 ${
                                completedLessonIds.includes(activeLesson.id)
                                  ? 'bg-[#16A34A]/15 text-[#15803D] dark:text-emerald-400 border border-[#16A34A]/40'
                                  : 'bg-[#16A34A] text-white hover:bg-[#15803D]'
                              }`}
                            >
                              {completedLessonIds.includes(activeLesson.id)
                                ? 'Completed ✓'
                                : 'Mark Lesson Complete'}
                            </button>
                          </div>

                          <ChartStructureDiagram
                            mode="lesson"
                            diagramType={activeLesson.diagramType}
                          />

                          <div className="space-y-3 text-sm leading-relaxed text-slate-700 dark:text-slate-200 max-w-3xl">
                            {activeLesson.content.map((para, idx) => (
                              <p key={idx}>{para}</p>
                            ))}
                          </div>

                          <div className="rounded-lg border border-slate-200/80 dark:border-blue-400/15 bg-[#F8FAFC] dark:bg-[#071122] p-4">
                            <h4 className="text-xs font-semibold text-[#0F172A] dark:text-white mb-2.5">
                              SK Execution Rules
                            </h4>
                            <ul className="space-y-2 text-sm text-slate-700 dark:text-slate-300">
                              {activeLesson.keyRules.map((rule, idx) => (
                                <li key={idx} className="flex items-start gap-2">
                                  <span className="font-mono text-xs text-[#1D4ED8] dark:text-blue-400 font-semibold mt-0.5">
                                    0{idx + 1}.
                                  </span>
                                  <span>{rule}</span>
                                </li>
                              ))}
                            </ul>
                          </div>

                          <div className="pt-4 border-t border-slate-200/80 dark:border-blue-400/15 space-y-3">
                            <h4 className="text-xs font-semibold text-[#0F172A] dark:text-white">
                              Comprehension Checkpoint
                            </h4>
                            <p className="text-sm font-medium text-[#0F172A] dark:text-slate-100">
                              {activeLesson.quiz.question}
                            </p>
                            <div className="space-y-2">
                              {activeLesson.quiz.options.map((opt, idx) => {
                                const chosen = quizAnswer === idx;
                                const isCorrect = idx === activeLesson.quiz.correctIndex;
                                return (
                                  <button
                                    key={idx}
                                    type="button"
                                    onClick={() => setQuizAnswer(idx)}
                                    className={`w-full text-left px-4 py-2.5 rounded-lg border text-xs transition-colors ${
                                      chosen
                                        ? isCorrect
                                          ? 'border-[#16A34A] bg-[#16A34A]/10 text-[#15803D] dark:text-emerald-400 font-semibold'
                                          : 'border-[#DC2626] bg-[#DC2626]/10 text-[#DC2626] font-semibold'
                                        : 'border-slate-200/85 dark:border-blue-400/20 hover:bg-slate-50 dark:hover:bg-[#132648] text-slate-700 dark:text-slate-200'
                                    }`}
                                  >
                                    {opt}
                                  </button>
                                );
                              })}
                            </div>
                            {quizAnswer !== null && (
                              <p className="text-xs text-slate-700 dark:text-slate-200 bg-slate-100 dark:bg-[#132648] rounded-lg p-3">
                                {quizAnswer === activeLesson.quiz.correctIndex
                                  ? `Correct — ${activeLesson.quiz.explanation}`
                                  : `Review: ${activeLesson.quiz.explanation}`}
                              </p>
                            )}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )}

              {/* TAB 3: PERSONAL TRADE JOURNAL */}
              {activeTab === 'journal' && (
                <div className="space-y-6">
                  <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
                    <div className="rounded-xl border border-slate-200/85 dark:border-blue-400/20 bg-white dark:bg-[#0B1528] p-3.5 sm:p-4">
                      <span className="text-xs text-slate-500 dark:text-slate-400">
                        Realized P&L
                      </span>
                      <div
                        className={`mt-1 text-xl sm:text-2xl font-display font-bold font-mono tabular-nums ${
                          journalStats.netPnl >= 0
                            ? 'text-[#16A34A] dark:text-emerald-400'
                            : 'text-[#DC2626]'
                        }`}
                      >
                        {journalStats.netPnl >= 0 ? '+' : ''}$
                        {journalStats.netPnl.toFixed(2)}
                      </div>
                    </div>
                    <div className="rounded-xl border border-slate-200/85 dark:border-blue-400/20 bg-white dark:bg-[#0B1528] p-3.5 sm:p-4">
                      <span className="text-xs text-slate-500 dark:text-slate-400">
                        Net Pips Captured
                      </span>
                      <div className="mt-1 text-xl sm:text-2xl font-display font-bold font-mono tabular-nums text-[#0F172A] dark:text-white">
                        {journalStats.totalPips >= 0 ? '+' : ''}
                        {journalStats.totalPips} pips
                      </div>
                    </div>
                    <div className="rounded-xl border border-slate-200/85 dark:border-blue-400/20 bg-white dark:bg-[#0B1528] p-3.5 sm:p-4">
                      <span className="text-xs text-slate-500 dark:text-slate-400">
                        Closed Win Rate
                      </span>
                      <div className="mt-1 text-xl sm:text-2xl font-display font-bold font-mono tabular-nums text-[#1D4ED8] dark:text-blue-400">
                        {journalStats.winRate}%
                      </div>
                    </div>
                    <div className="rounded-xl border border-slate-200/85 dark:border-blue-400/20 bg-white dark:bg-[#0B1528] p-3.5 sm:p-4">
                      <span className="text-xs text-slate-500 dark:text-slate-400">
                        Open Executions
                      </span>
                      <div className="mt-1 text-xl sm:text-2xl font-display font-bold font-mono tabular-nums text-[#0F172A] dark:text-white">
                        {journalStats.openCount}
                      </div>
                    </div>
                  </div>

                  <div className="rounded-xl border border-slate-200/85 dark:border-blue-400/20 bg-white dark:bg-[#0B1528] overflow-hidden">
                    <div className="p-4 sm:p-5 border-b border-slate-200/80 dark:border-blue-400/15 flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-4">
                      <div>
                        <h2 className="font-display text-lg font-bold text-[#0F172A] dark:text-white">
                          Executed Signals Ledger
                        </h2>
                        <p className="text-xs text-slate-500 dark:text-slate-400">
                          Track trades taken from SKFX ACADEMY’s live feed and record settled outcomes.
                        </p>
                      </div>
                      <button
                        type="button"
                        onClick={() => setActiveTab('signals')}
                        className="w-full sm:w-auto px-3.5 py-2 rounded-lg bg-[#1D4ED8] text-white text-xs font-semibold hover:bg-[#1E40AF] transition-colors whitespace-nowrap"
                      >
                        Browse Live Signals
                      </button>
                    </div>

                    {trades.length === 0 ? (
                      <div className="p-10 text-center">
                        <p className="text-sm font-medium text-slate-700 dark:text-slate-300">
                          You haven’t logged any signals yet.
                        </p>
                        <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                          Select any active setup in Live Signals and click "Take Trade" to start tracking.
                        </p>
                      </div>
                    ) : (
                      <div className="overflow-x-auto">
                        <table className="w-full min-w-[600px] text-left border-collapse">
                          <thead>
                            <tr className="bg-[#F1F5F9] dark:bg-[#0D2448] text-[#0F172A] dark:text-blue-100 text-xs font-semibold">
                              <th className="py-3 px-4">Pair & Direction</th>
                              <th className="py-3 px-4 text-right">Lots</th>
                              <th className="py-3 px-4 text-right">Entry / SL / TP</th>
                              <th className="py-3 px-4 text-right">Risk ($)</th>
                              <th className="py-3 px-4 text-right">Realized P&L</th>
                              <th className="py-3 px-4">Settle Outcome</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-200/80 dark:divide-blue-400/15 text-sm">
                            {trades.map((trd) => (
                              <tr key={trd.id}>
                                <td className="py-3.5 px-4">
                                  <div className="font-semibold text-[#0F172A] dark:text-white">
                                    {trd.pair} ·{' '}
                                    <span
                                      className={
                                        trd.direction === 'BUY'
                                          ? 'text-[#16A34A]'
                                          : 'text-[#DC2626]'
                                      }
                                    >
                                      {trd.direction}
                                    </span>
                                  </div>
                                  <div className="text-xs text-slate-500 dark:text-slate-400 truncate max-w-xs">
                                    {trd.notes}
                                  </div>
                                </td>
                                <td className="py-3.5 px-4 text-right font-mono tabular-nums">
                                  {trd.lotSize.toFixed(2)}
                                </td>
                                <td className="py-3.5 px-4 text-right font-mono tabular-nums text-xs">
                                  {formatPrice(trd.pair, trd.entryPrice)} /{' '}
                                  <span className="text-[#DC2626]">
                                    {formatPrice(trd.pair, trd.stopLoss)}
                                  </span>{' '}
                                  /{' '}
                                  <span className="text-[#16A34A]">
                                    {formatPrice(trd.pair, trd.takeProfit)}
                                  </span>
                                </td>
                                <td className="py-3.5 px-4 text-right font-mono tabular-nums text-slate-600 dark:text-slate-300">
                                  ${trd.riskAmount.toFixed(2)}
                                </td>
                                <td
                                  className={`py-3.5 px-4 text-right font-mono tabular-nums font-semibold ${
                                    trd.realizedPnl > 0
                                      ? 'text-[#16A34A]'
                                      : trd.realizedPnl < 0
                                        ? 'text-[#DC2626]'
                                        : 'text-slate-400'
                                  }`}
                                >
                                  {trd.realizedPnl >= 0 ? '+' : ''}$
                                  {trd.realizedPnl.toFixed(2)}
                                </td>
                                <td className="py-3.5 px-4">
                                  <select
                                    value={trd.outcome}
                                    onChange={(e) =>
                                      handleUpdateTradeOutcome(
                                        trd,
                                        e.target.value as TakenTrade['outcome'],
                                      )
                                    }
                                    className="rounded-md border border-slate-200/85 dark:border-blue-400/20 bg-[#F8FAFC] dark:bg-[#071122] px-2.5 py-1 text-xs font-medium"
                                  >
                                    <option value="Open">Open</option>
                                    <option value="Won">Won</option>
                                    <option value="Lost">Lost</option>
                                    <option value="Breakeven">Breakeven</option>
                                  </select>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* TAB 4: LOT CALCULATOR */}
              {activeTab === 'calculator' && (
                <LotCalculatorPanel
                  initialPair={calcSeed?.pair || 'XAUUSD'}
                  initialBalance={user.accountBalance}
                  initialRiskPercent={user.defaultRiskPercent}
                  initialEntry={calcSeed?.entry || 2638.5}
                  initialStopLoss={calcSeed?.stopLoss || 2631.0}
                  initialTakeProfit={calcSeed?.takeProfit || 2658.5}
                  onSavePreferences={handleSavePrefs}
                />
              )}

              {/* TAB 5: MARKET BRIEFINGS */}
              {activeTab === 'briefings' && (
                <div className="space-y-5">
                  <div>
                    <h2 className="font-display text-2xl font-bold text-[#0F172A] dark:text-white">
                      Institutional Market Briefings
                    </h2>
                    <p className="text-sm text-slate-600 dark:text-slate-300 mt-1">
                      Session outlooks and macro liquidity roadmaps authored by SKFX ACADEMY.
                    </p>
                  </div>

                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
                    {briefings.map((brf) => (
                      <article
                        key={brf.id}
                        className="rounded-xl border border-slate-200/85 dark:border-blue-400/20 bg-white dark:bg-[#0B1528] p-6 space-y-3"
                      >
                        <div className="flex items-center justify-between gap-3 text-xs text-slate-500 dark:text-slate-400">
                          <span>
                            {brf.session} Session · {brf.pairsWatched.join(', ')}
                          </span>
                          <span
                            className={`font-semibold ${
                              brf.bias === 'Bullish'
                                ? 'text-[#16A34A]'
                                : brf.bias === 'Bearish'
                                  ? 'text-[#DC2626]'
                                  : 'text-[#1D4ED8] dark:text-blue-400'
                            }`}
                          >
                            {brf.bias} Bias
                          </span>
                        </div>
                        <h3 className="font-display text-lg font-bold text-[#0F172A] dark:text-white">
                          {brf.title}
                        </h3>
                        <p className="text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
                          {brf.summary}
                        </p>
                        <div className="pt-3 border-t border-slate-200/80 dark:border-blue-400/15 text-xs font-mono text-[#1D4ED8] dark:text-blue-400">
                          {brf.keyLevels}
                        </div>
                      </article>
                    ))}
                  </div>
                </div>
              )}

              {/* TAB: TRADING PLAYGROUND (TradingView Simulator, Live Signals, Lot Calculator) */}
              {activeTab === 'simulator' && (
                <div className="space-y-4">
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <div>
                      <h2 className="font-display text-xl font-bold text-[#0F172A] dark:text-white">
                        Trading Playground
                      </h2>
                      <p className="text-xs text-slate-500 dark:text-slate-400">
                        Live TradingView Bar Replay, real-time institutional setups, and position sizing.
                      </p>
                    </div>
                    <div className="flex items-center gap-1 p-1 rounded-lg bg-white dark:bg-[#0B1528] border border-slate-200/85 dark:border-blue-400/20">
                      {[
                        {id: 'chart' as const, label: 'TradingView Simulator'},
                        {id: 'signals' as const, label: `Live Signals (${signals.length})`},
                        {id: 'calculator' as const, label: 'Lot Calculator'},
                      ].map((sub) => (
                        <button
                          key={sub.id}
                          type="button"
                          onClick={() => setPlaygroundSubTab(sub.id)}
                          className={`px-3 py-1.5 rounded-md text-xs font-semibold transition-colors ${
                            playgroundSubTab === sub.id
                              ? 'bg-[#2563EB] text-white'
                              : 'text-slate-600 dark:text-slate-300 hover:text-[#0F172A] dark:hover:text-white'
                          }`}
                        >
                          {sub.label}
                        </button>
                      ))}
                    </div>
                  </div>

                  {playgroundSubTab === 'chart' && (
                    <TradingViewSimulator user={user} isDark={isDark} />
                  )}

                  {playgroundSubTab === 'signals' && (
                    <div className="rounded-xl border border-slate-200/85 dark:border-blue-400/20 bg-white dark:bg-[#0B1528] divide-y divide-slate-200/80 dark:divide-blue-400/15">
                      {signals.map((sig) => (
                        <div
                          key={sig.id}
                          className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                        >
                          <div>
                            <div className="flex items-center gap-2">
                              <span className="font-display font-bold text-sm text-[#0F172A] dark:text-white">
                                {sig.pair}
                              </span>
                              <span
                                className={`text-xs font-bold ${
                                  sig.direction === 'BUY' ? 'text-[#16A34A]' : 'text-[#DC2626]'
                                }`}
                              >
                                {sig.direction}
                              </span>
                              <span className="text-xs text-slate-500">
                                · {sig.timeframe} · {sig.session}
                              </span>
                            </div>
                            <p className="text-xs text-slate-600 dark:text-slate-300 mt-1">
                              {sig.thesis}
                            </p>
                          </div>
                          <div className="flex items-center gap-3 shrink-0 font-mono text-xs tabular-nums">
                            <span>
                              Entry {formatPrice(sig.pair, sig.entry)} · SL{' '}
                              <span className="text-[#DC2626]">{formatPrice(sig.pair, sig.stopLoss)}</span>
                            </span>
                            <button
                              type="button"
                              onClick={() => {
                                setSelectedSignalId(sig.id);
                                setActiveTab('signals');
                              }}
                              className="font-sans px-3 py-1.5 rounded-lg bg-[#2563EB] text-white text-xs font-semibold hover:bg-[#1D4ED8]"
                            >
                              Inspect
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}

                  {playgroundSubTab === 'calculator' && (
                    <LotCalculatorPanel
                      initialPair={calcSeed?.pair || 'XAUUSD'}
                      initialBalance={user.accountBalance}
                      initialRiskPercent={user.defaultRiskPercent}
                      initialEntry={calcSeed?.entry || 2638.5}
                      initialStopLoss={calcSeed?.stopLoss || 2631.0}
                      initialTakeProfit={calcSeed?.takeProfit || 2658.5}
                      onSavePreferences={handleSavePrefs}
                    />
                  )}
                </div>
              )}

              {/* TAB: ALL COURSES */}
              {activeTab === 'courses' && (
                <div className="space-y-6">
                  <div>
                    <h2 className="font-display text-2xl font-bold text-[#0F172A] dark:text-white">
                      All Courses
                    </h2>
                    <p className="text-sm text-slate-600 dark:text-slate-300 mt-1">
                      Structured Forex, Smart Money Concepts, and Gold mastery tracks.
                    </p>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                    {courses.map((course) => {
                      const cLessons = lessons.filter((l) => l.courseId === course.id);
                      const cDone = cLessons.filter((l) => completedLessonIds.includes(l.id)).length;
                      const pct = cLessons.length > 0 ? Math.round((cDone / cLessons.length) * 100) : 0;
                      return (
                        <div
                          key={course.id}
                          className="rounded-xl border border-slate-200/85 dark:border-blue-400/20 bg-white dark:bg-[#0B1528] overflow-hidden flex flex-col"
                        >
                          <div className="h-40 overflow-hidden">
                            <ResilientImage
                              src={course.thumbnailUrl}
                              alt={course.title}
                              className="w-full h-full object-cover"
                            />
                          </div>
                          <div className="p-5 flex-1 flex flex-col space-y-3">
                            <div className="flex items-center justify-between text-[11px] font-semibold text-[#1D4ED8] dark:text-blue-400">
                              <span>{course.level}</span>
                              <span>{course.estimatedHours} Hours</span>
                            </div>
                            <h3 className="font-display text-lg font-bold text-[#0F172A] dark:text-white">
                              {course.title}
                            </h3>
                            <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed flex-1">
                              {course.description}
                            </p>
                            <div className="space-y-1.5 pt-2">
                              <div className="flex justify-between text-[11px] font-mono text-slate-500">
                                <span>{cDone}/{cLessons.length} Lessons</span>
                                <span>{pct}%</span>
                              </div>
                              <div className="h-1.5 rounded-full bg-slate-100 dark:bg-blue-950 overflow-hidden">
                                <div className="h-full bg-[#2563EB]" style={{width: `${pct}%`}} />
                              </div>
                            </div>
                            <button
                              type="button"
                              onClick={() => {
                                setActiveCourseId(course.id);
                                if (cLessons[0]) setActiveLessonId(cLessons[0].id);
                                setActiveTab('academy');
                              }}
                              className="w-full py-2.5 rounded-lg bg-[#2563EB] hover:bg-[#1D4ED8] text-white text-xs font-bold transition-colors"
                            >
                              Open Course
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* TAB: VIDEO LESSONS */}
              {activeTab === 'lessons' && (
                <div className="space-y-6">
                  <div>
                    <h2 className="font-display text-2xl font-bold text-[#0F172A] dark:text-white">
                      Video Lessons Library
                    </h2>
                    <p className="text-sm text-slate-600 dark:text-slate-300 mt-1">
                      Jump straight into any institutional breakdown, chart model, or execution rulebook.
                    </p>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {lessons.map((les) => {
                      const course = courses.find((c) => c.id === les.courseId);
                      const done = completedLessonIds.includes(les.id);
                      return (
                        <div
                          key={les.id}
                          className="rounded-xl border border-slate-200/85 dark:border-blue-400/20 bg-white dark:bg-[#0B1528] p-5 flex flex-col justify-between gap-4"
                        >
                          <div className="space-y-2">
                            <div className="flex items-center justify-between text-[11px] font-semibold">
                              <span className="text-[#1D4ED8] dark:text-blue-400">
                                {course?.title || 'SKFX Curriculum'}
                              </span>
                              <span className={done ? 'text-[#16A34A]' : 'text-slate-400 font-mono'}>
                                {done ? 'Completed ✓' : `${les.durationMinutes} min`}
                              </span>
                            </div>
                            <h3 className="font-display text-base font-bold text-[#0F172A] dark:text-white">
                              {les.order}. {les.title}
                            </h3>
                            <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
                              {les.summary}
                            </p>
                          </div>
                          <button
                            type="button"
                            onClick={() => {
                              setActiveCourseId(les.courseId);
                              setActiveLessonId(les.id);
                              setQuizAnswer(null);
                              setActiveTab('academy');
                            }}
                            className="self-start inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-[#0F172A] dark:bg-[#2563EB] text-white text-xs font-semibold hover:opacity-90 transition-opacity"
                          >
                            <PlayCircle className="w-3.5 h-3.5" />
                            <span>Watch &amp; Study Lesson</span>
                          </button>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* TAB: LEARNING PATHS */}
              {activeTab === 'paths' && (
                <div className="space-y-6">
                  <div>
                    <h2 className="font-display text-2xl font-bold text-[#0F172A] dark:text-white">
                      Learning Paths
                    </h2>
                    <p className="text-sm text-slate-600 dark:text-slate-300 mt-1">
                      Follow the three-stage SKFX progression from market foundations to live Gold execution.
                    </p>
                  </div>
                  <div className="space-y-4">
                    {[
                      {
                        stage: 'STAGE 01 · FOUNDATION',
                        level: 'Foundation' as const,
                        summary: 'Master market structure, liquidity sweeps, and session timing.',
                      },
                      {
                        stage: 'STAGE 02 · INTERMEDIATE SMC',
                        level: 'Intermediate' as const,
                        summary: 'Apply Order Blocks, Fair Value Gaps, and CHoCH/BOS confirmation entries.',
                      },
                      {
                        stage: 'STAGE 03 · INSTITUTIONAL XAUUSD',
                        level: 'Institutional' as const,
                        summary: 'Execute London/New York killzones with strict position sizing and backtesting.',
                      },
                    ].map((track) => {
                      const matchingCourses = courses.filter((c) => c.level === track.level);
                      const fallbackCourse = matchingCourses[0] || courses[0];
                      const trackLessons = fallbackCourse
                        ? lessons.filter((l) => l.courseId === fallbackCourse.id)
                        : [];
                      const doneCount = trackLessons.filter((l) =>
                        completedLessonIds.includes(l.id),
                      ).length;
                      return (
                        <div
                          key={track.stage}
                          className="rounded-xl border border-slate-200/85 dark:border-blue-400/20 bg-white dark:bg-[#0B1528] p-5 sm:p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4"
                        >
                          <div className="space-y-1.5">
                            <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-[#1D4ED8] dark:text-blue-400">
                              {track.stage}
                            </p>
                            <h3 className="font-display text-lg font-bold text-[#0F172A] dark:text-white">
                              {fallbackCourse?.title || track.level}
                            </h3>
                            <p className="text-xs text-slate-600 dark:text-slate-300 max-w-xl">
                              {track.summary}
                            </p>
                            <p className="text-[11px] font-mono text-slate-500">
                              {doneCount}/{trackLessons.length} milestones completed
                            </p>
                          </div>
                          <button
                            type="button"
                            onClick={() => {
                              if (fallbackCourse) {
                                setActiveCourseId(fallbackCourse.id);
                                if (trackLessons[0]) setActiveLessonId(trackLessons[0].id);
                              }
                              setActiveTab('academy');
                            }}
                            className="px-5 py-2.5 rounded-lg bg-[#2563EB] hover:bg-[#1D4ED8] text-white text-xs font-bold whitespace-nowrap"
                          >
                            Continue Path
                          </button>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* TAB: EVENTS & WEBINARS */}
              {activeTab === 'events' && (
                <div className="space-y-6">
                  <div>
                    <h2 className="font-display text-2xl font-bold text-[#0F172A] dark:text-white">
                      Events, Live Webinars &amp; Session Briefings
                    </h2>
                    <p className="text-sm text-slate-600 dark:text-slate-300 mt-1">
                      Weekly live mentorship schedule and institutional market outlooks.
                    </p>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {[
                      {
                        day: 'MONDAYS · 13:30 UTC',
                        title: 'Weekly XAUUSD Liquidity Outlook',
                        host: 'Kombat Sampson (SK)',
                        desc: 'Higher-timeframe bias mapping for Gold, EURUSD, and GBPUSD ahead of London/NY overlap.',
                      },
                      {
                        day: 'WEDNESDAYS · 13:00 UTC',
                        title: 'Live NY Killzone Execution Lab',
                        host: 'SKFX Mentorship Desk',
                        desc: 'Real-time chart markups, liquidity sweep setups, and live Q&A trade reviews.',
                      },
                      {
                        day: 'FRIDAYS · 16:00 UTC',
                        title: 'Trade Journal & Psychology Audit',
                        host: 'Kombat Sampson (SK)',
                        desc: 'Review weekly wins/losses, R-multiple consistency, and discipline checkpoints.',
                      },
                    ].map((ev) => (
                      <div
                        key={ev.title}
                        className="rounded-xl border border-slate-200/85 dark:border-blue-400/20 bg-white dark:bg-[#0B1528] p-5 space-y-2.5"
                      >
                        <p className="text-[11px] font-bold uppercase tracking-wider text-[#1D4ED8] dark:text-blue-400">
                          {ev.day}
                        </p>
                        <h3 className="font-display text-base font-bold text-[#0F172A] dark:text-white">
                          {ev.title}
                        </h3>
                        <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
                          {ev.desc}
                        </p>
                        <p className="text-[11px] font-semibold text-slate-500 pt-1">
                          Host: {ev.host}
                        </p>
                      </div>
                    ))}
                  </div>

                  <div className="space-y-3">
                    <h3 className="font-display text-lg font-bold text-[#0F172A] dark:text-white">
                      Latest Institutional Briefings
                    </h3>
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                      {briefings.map((brf) => (
                        <article
                          key={brf.id}
                          className="rounded-xl border border-slate-200/85 dark:border-blue-400/20 bg-white dark:bg-[#0B1528] p-5 space-y-2.5"
                        >
                          <div className="flex items-center justify-between text-xs text-slate-500">
                            <span>
                              {brf.session} Session · {brf.pairsWatched.join(', ')}
                            </span>
                            <span
                              className={`font-semibold ${
                                brf.bias === 'Bullish'
                                  ? 'text-[#16A34A]'
                                  : brf.bias === 'Bearish'
                                    ? 'text-[#DC2626]'
                                    : 'text-[#1D4ED8]'
                              }`}
                            >
                              {brf.bias} Bias
                            </span>
                          </div>
                          <h4 className="font-display text-base font-bold text-[#0F172A] dark:text-white">
                            {brf.title}
                          </h4>
                          <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
                            {brf.summary}
                          </p>
                          <div className="pt-2 border-t border-slate-200/80 dark:border-blue-400/15 text-xs font-mono text-[#1D4ED8] dark:text-blue-400">
                            {brf.keyLevels}
                          </div>
                        </article>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {/* TAB: COMMUNITY */}
              {activeTab === 'community' && (
                <div className="space-y-6">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div>
                      <h2 className="font-display text-2xl font-bold text-[#0F172A] dark:text-white">
                        SKFX Traders Community &amp; Live Setups
                      </h2>
                      <p className="text-sm text-slate-600 dark:text-slate-300 mt-1">
                        Shared institutional market setups, active signals, and peer execution discussions.
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        setPlaygroundSubTab('signals');
                        setActiveTab('signals');
                      }}
                      className="px-4 py-2 rounded-lg bg-[#2563EB] text-white text-xs font-bold hover:bg-[#1D4ED8] self-start"
                    >
                      Open Full Signal Inspector
                    </button>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {signals.slice(0, 6).map((sig) => (
                      <div
                        key={sig.id}
                        className="rounded-xl border border-slate-200/85 dark:border-blue-400/20 bg-white dark:bg-[#0B1528] p-5 space-y-3"
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <span className="font-display font-bold text-base text-[#0F172A] dark:text-white">
                              {sig.pair}
                            </span>
                            <span
                              className={`text-xs font-bold ${
                                sig.direction === 'BUY' ? 'text-[#16A34A]' : 'text-[#DC2626]'
                              }`}
                            >
                              {sig.direction}
                            </span>
                          </div>
                          <span className="text-[11px] font-mono text-[#1D4ED8] dark:text-blue-400 font-semibold">
                            {sig.status} · {sig.riskReward}
                          </span>
                        </div>
                        <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
                          {sig.thesis}
                        </p>
                        <div className="flex items-center justify-between pt-2 border-t border-slate-200/80 dark:border-blue-400/15 text-[11px] text-slate-500">
                          <span>
                            Shared by <strong className="text-[#0F172A] dark:text-white">{sig.authorName}</strong> · {sig.session}
                          </span>
                          <button
                            type="button"
                            onClick={() => {
                              setSelectedSignalId(sig.id);
                              setActiveTab('signals');
                            }}
                            className="text-[#2563EB] dark:text-blue-400 font-semibold hover:underline"
                          >
                            Log to Journal →
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* TAB: CERTIFICATES */}
              {activeTab === 'certificates' && (
                <div className="space-y-6">
                  <div>
                    <h2 className="font-display text-2xl font-bold text-[#0F172A] dark:text-white">
                      Certificates &amp; Credentials
                    </h2>
                    <p className="text-sm text-slate-600 dark:text-slate-300 mt-1">
                      Complete every lesson inside a course track to unlock your verified SKFX Academy certificate.
                    </p>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {courses.map((course) => {
                      const cLessons = lessons.filter((l) => l.courseId === course.id);
                      const cDone = cLessons.filter((l) => completedLessonIds.includes(l.id)).length;
                      const unlocked = cLessons.length > 0 && cDone === cLessons.length;
                      return (
                        <div
                          key={course.id}
                          className={`rounded-xl border p-5 space-y-3 ${
                            unlocked
                              ? 'border-[#16A34A]/50 bg-emerald-50/40 dark:bg-emerald-950/20'
                              : 'border-slate-200/85 dark:border-blue-400/20 bg-white dark:bg-[#0B1528]'
                          }`}
                        >
                          <div className="flex items-center justify-between">
                            <Award className={`w-6 h-6 ${unlocked ? 'text-[#16A34A]' : 'text-slate-400'}`} />
                            <span
                              className={`text-[11px] font-bold px-2.5 py-0.5 rounded-full ${
                                unlocked
                                  ? 'bg-[#16A34A]/15 text-[#15803D] dark:text-emerald-400'
                                  : 'bg-slate-100 dark:bg-white/10 text-slate-500'
                              }`}
                            >
                              {unlocked ? 'Earned' : `${cDone}/${cLessons.length} Lessons`}
                            </span>
                          </div>
                          <h3 className="font-display text-base font-bold text-[#0F172A] dark:text-white">
                            {course.title}
                          </h3>
                          <p className="text-xs text-slate-500 dark:text-slate-400">
                            Issued to {user.name} upon 100% completion of module checkpoints.
                          </p>
                          {!unlocked && (
                            <button
                              type="button"
                              onClick={() => {
                                setActiveCourseId(course.id);
                                if (cLessons[0]) setActiveLessonId(cLessons[0].id);
                                setActiveTab('academy');
                              }}
                              className="text-xs font-semibold text-[#2563EB] dark:text-blue-400 hover:underline"
                            >
                              Resume Course →
                            </button>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* TAB: GENERAL SETTINGS */}
              {activeTab === 'settings' && (
                <div className="space-y-6 max-w-3xl">
                  <div>
                    <h2 className="font-display text-2xl font-bold text-[#0F172A] dark:text-white">
                      General Settings
                    </h2>
                    <p className="text-sm text-slate-600 dark:text-slate-300 mt-1">
                      Manage your account profile, workspace appearance, session timezone, and default trading parameters.
                    </p>
                  </div>

                  {/* Account Profile Card */}
                  <div className="rounded-xl border border-slate-200/85 dark:border-blue-400/20 bg-white dark:bg-[#0B1528] p-5 sm:p-6 space-y-4">
                    <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-[#2563EB] dark:text-blue-400">
                      <User className="w-3.5 h-3.5" />
                      <span>Account Information</span>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-sm">
                      <div className="p-3 rounded-lg bg-[#F8FAFC] dark:bg-[#071122] border border-slate-200/80 dark:border-blue-400/15">
                        <span className="block text-[11px] text-slate-500 dark:text-slate-400">
                          Full Name
                        </span>
                        <span className="font-semibold text-[#0F172A] dark:text-white mt-0.5 block truncate">
                          {user.name}
                        </span>
                      </div>
                      <div className="p-3 rounded-lg bg-[#F8FAFC] dark:bg-[#071122] border border-slate-200/80 dark:border-blue-400/15">
                        <span className="block text-[11px] text-slate-500 dark:text-slate-400">
                          Email Address
                        </span>
                        <span className="font-medium text-[#0F172A] dark:text-slate-200 mt-0.5 block truncate">
                          {user.email}
                        </span>
                      </div>
                      <div className="p-3 rounded-lg bg-[#F8FAFC] dark:bg-[#071122] border border-slate-200/80 dark:border-blue-400/15">
                        <span className="block text-[11px] text-slate-500 dark:text-slate-400">
                          Account Access
                        </span>
                        <span className="font-semibold text-[#15803D] dark:text-emerald-400 mt-0.5 block">
                          {user.tier}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* General Preferences Form */}
                  <form
                    onSubmit={(e) => {
                      e.preventDefault();
                      if (typeof window !== 'undefined') {
                        localStorage.setItem('skfx_timezone', settingsTimezone);
                        localStorage.setItem('skfx_notify_signals', String(settingsNotifySignals));
                        localStorage.setItem('skfx_notify_sessions', String(settingsNotifySessions));
                        localStorage.setItem('skfx_confirm_orders', String(settingsConfirmOrders));
                      }
                      handleSavePrefs(
                        Math.max(100, Number(settingsBalance) || 10000),
                        Math.max(0.1, Math.min(10, Number(settingsRisk) || 1.0)),
                      );
                    }}
                    className="rounded-xl border border-slate-200/85 dark:border-blue-400/20 bg-white dark:bg-[#0B1528] p-5 sm:p-6 space-y-6"
                  >
                    <div className="space-y-4">
                      <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-[#2563EB] dark:text-blue-400">
                        <Globe className="w-3.5 h-3.5" />
                        <span>Workspace &amp; Trading Defaults</span>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                        <div>
                          <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300 mb-1.5">
                            Default Account Balance ($)
                          </label>
                          <input
                            type="number"
                            min="100"
                            step="any"
                            value={settingsBalance}
                            onChange={(e) => setSettingsBalance(e.target.value)}
                            className="w-full rounded-lg border border-slate-200/85 dark:border-blue-400/20 bg-[#F8FAFC] dark:bg-[#071122] px-3 py-2 text-sm font-mono tabular-nums"
                          />
                        </div>
                        <div>
                          <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300 mb-1.5">
                            Default Risk Per Trade (%)
                          </label>
                          <input
                            type="number"
                            min="0.1"
                            max="10"
                            step="0.1"
                            value={settingsRisk}
                            onChange={(e) => setSettingsRisk(e.target.value)}
                            className="w-full rounded-lg border border-slate-200/85 dark:border-blue-400/20 bg-[#F8FAFC] dark:bg-[#071122] px-3 py-2 text-sm font-mono tabular-nums"
                          />
                        </div>
                        <div>
                          <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300 mb-1.5">
                            Display Timezone
                          </label>
                          <select
                            value={settingsTimezone}
                            onChange={(e) => setSettingsTimezone(e.target.value)}
                            className="w-full rounded-lg border border-slate-200/85 dark:border-blue-400/20 bg-[#F8FAFC] dark:bg-[#071122] px-3 py-2 text-sm"
                          >
                            <option value="UTC">UTC (Universal)</option>
                            <option value="Europe/London">London (GMT / BST)</option>
                            <option value="America/New_York">New York (EST / EDT)</option>
                            <option value="Asia/Tokyo">Tokyo (JST)</option>
                          </select>
                        </div>
                      </div>
                    </div>

                    <div className="pt-5 border-t border-slate-200/80 dark:border-blue-400/15 space-y-3">
                      <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-[#2563EB] dark:text-blue-400">
                        <Bell className="w-3.5 h-3.5" />
                        <span>General Preferences &amp; Alerts</span>
                      </div>

                      <div className="space-y-2.5">
                        {[
                          {
                            label: 'Live Signal Desk Notifications',
                            desc: 'Highlight new mentor trade setups and TP/SL updates across the workspace.',
                            checked: settingsNotifySignals,
                            onChange: setSettingsNotifySignals,
                          },
                          {
                            label: 'London & New York Session Reminders',
                            desc: 'Display killzone session markers inside your trading tools and briefings.',
                            checked: settingsNotifySessions,
                            onChange: setSettingsNotifySessions,
                          },
                          {
                            label: 'Order Execution Confirmation',
                            desc: 'Require confirmation summaries before logging simulated or paper trades.',
                            checked: settingsConfirmOrders,
                            onChange: setSettingsConfirmOrders,
                          },
                        ].map((pref) => (
                          <label
                            key={pref.label}
                            className="flex items-center justify-between gap-4 p-3 rounded-lg border border-slate-200/80 dark:border-blue-400/15 bg-[#F8FAFC] dark:bg-[#071122] cursor-pointer"
                          >
                            <div className="min-w-0">
                              <span className="block text-xs font-semibold text-[#0F172A] dark:text-white">
                                {pref.label}
                              </span>
                              <span className="block text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                                {pref.desc}
                              </span>
                            </div>
                            <input
                              type="checkbox"
                              checked={pref.checked}
                              onChange={(e) => pref.onChange(e.target.checked)}
                              className="h-4 w-4 rounded border-slate-300 text-[#2563EB] focus:ring-[#2563EB] shrink-0"
                            />
                          </label>
                        ))}
                      </div>
                    </div>

                    <div className="flex flex-wrap items-center justify-between gap-3 pt-4 border-t border-slate-200/80 dark:border-blue-400/15">
                      <button
                        type="button"
                        onClick={onToggleTheme}
                        className="inline-flex items-center gap-2 px-4 py-2 rounded-lg border border-slate-200/85 dark:border-blue-400/25 text-xs font-semibold hover:bg-slate-50 dark:hover:bg-[#132648] transition-colors"
                      >
                        {isDark ? <Sun className="w-3.5 h-3.5" /> : <Moon className="w-3.5 h-3.5" />}
                        <span>{isDark ? 'Switch to Light Theme' : 'Switch to Dark Theme'}</span>
                      </button>
                      <button
                        type="submit"
                        className="px-5 py-2.5 rounded-lg bg-[#2563EB] hover:bg-[#1D4ED8] text-white text-xs font-bold transition-colors"
                      >
                        Save General Settings
                      </button>
                    </div>
                  </form>
                </div>
              )}

              {/* TAB: HELP & SUPPORT */}
              {activeTab === 'support' && (
                <div className="space-y-6 max-w-3xl">
                  <div>
                    <h2 className="font-display text-2xl font-bold text-[#0F172A] dark:text-white">
                      Help &amp; Support
                    </h2>
                    <p className="text-sm text-slate-600 dark:text-slate-300 mt-1">
                      Guidance for using the SKFX Academy lessons, TradingView Bar Replay simulator, and trade journal.
                    </p>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="rounded-xl border border-slate-200/85 dark:border-blue-400/20 bg-white dark:bg-[#0B1528] p-5 space-y-2">
                      <h3 className="font-display text-base font-bold text-[#0F172A] dark:text-white">
                        How to Use Bar Replay
                      </h3>
                      <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
                        Open <strong>Trading Playground</strong>, click <strong>Bar Replay</strong> (or the Scissors tool), and click any historical candle on the chart to rewind time. Use Play or +1 Bar to step forward into future candles while practicing Buy/Sell setups.
                      </p>
                    </div>
                    <div className="rounded-xl border border-slate-200/85 dark:border-blue-400/20 bg-white dark:bg-[#0B1528] p-5 space-y-2">
                      <h3 className="font-display text-base font-bold text-[#0F172A] dark:text-white">
                        Mentorship &amp; Account Desk
                      </h3>
                      <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
                        Need help with your membership tier, Exness copy-trading setup, or lesson progression? Reach the SKFX support team at <strong>support@skfxacademy.com</strong>.
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {/* TAB 6: SK MENTOR ADMIN DESK */}
              {activeTab === 'mentor' && user.role === 'mentor' && (
                <div className="space-y-8">
                  <div className="grid grid-cols-1 xl:grid-cols-12 gap-6">
                    <form
                      onSubmit={handlePublishSignal}
                      className="xl:col-span-6 rounded-xl border border-slate-200/85 dark:border-blue-400/20 bg-white dark:bg-[#0B1528] p-4 sm:p-6 space-y-4"
                    >
                      <h2 className="font-display text-lg font-bold text-[#0F172A] dark:text-white">
                        Publish Live Forex Signal
                      </h2>

                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                        <div>
                          <label className="block text-xs text-slate-500 mb-1">Pair</label>
                          <input
                            type="text"
                            required
                            value={newPair}
                            onChange={(e) => setNewPair(e.target.value.toUpperCase())}
                            className="w-full rounded-lg border border-slate-200/85 dark:border-blue-400/20 bg-[#F8FAFC] dark:bg-[#071122] px-3 py-2 text-xs font-mono"
                          />
                        </div>
                        <div>
                          <label className="block text-xs text-slate-500 mb-1">Direction</label>
                          <select
                            value={newDirection}
                            onChange={(e) => {
                              const d = e.target.value as 'BUY' | 'SELL';
                              setNewDirection(d);
                              setNewOrderType(d === 'BUY' ? 'Buy Limit' : 'Sell Limit');
                            }}
                            className="w-full rounded-lg border border-slate-200/85 dark:border-blue-400/20 bg-[#F8FAFC] dark:bg-[#071122] px-2.5 py-2 text-xs"
                          >
                            <option value="BUY">BUY</option>
                            <option value="SELL">SELL</option>
                          </select>
                        </div>
                        <div>
                          <label className="block text-xs text-slate-500 mb-1">Order Type</label>
                          <select
                            value={newOrderType}
                            onChange={(e) =>
                              setNewOrderType(e.target.value as Signal['orderType'])
                            }
                            className="w-full rounded-lg border border-slate-200/85 dark:border-blue-400/20 bg-[#F8FAFC] dark:bg-[#071122] px-2 py-2 text-xs"
                          >
                            <option>Market Execution</option>
                            <option>Buy Limit</option>
                            <option>Sell Limit</option>
                            <option>Buy Stop</option>
                            <option>Sell Stop</option>
                          </select>
                        </div>
                        <div>
                          <label className="block text-xs text-slate-500 mb-1">Session</label>
                          <select
                            value={newSession}
                            onChange={(e) =>
                              setNewSession(e.target.value as Signal['session'])
                            }
                            className="w-full rounded-lg border border-slate-200/85 dark:border-blue-400/20 bg-[#F8FAFC] dark:bg-[#071122] px-2.5 py-2 text-xs"
                          >
                            <option>London</option>
                            <option>New York</option>
                            <option>Asian</option>
                          </select>
                        </div>
                      </div>

                      <div className="grid grid-cols-2 sm:grid-cols-6 gap-2.5">
                        <div>
                          <label className="block text-xs text-slate-500 mb-1">TF</label>
                          <select
                            value={newTf}
                            onChange={(e) =>
                              setNewTf(e.target.value as Signal['timeframe'])
                            }
                            className="w-full rounded-lg border border-slate-200/85 dark:border-blue-400/20 bg-[#F8FAFC] dark:bg-[#071122] px-2 py-2 text-xs font-mono"
                          >
                            <option>M15</option>
                            <option>M30</option>
                            <option>H1</option>
                            <option>H4</option>
                          </select>
                        </div>
                        <div>
                          <label className="block text-xs text-slate-500 mb-1">Entry</label>
                          <input
                            type="number"
                            step="any"
                            required
                            value={newEntry}
                            onChange={(e) => setNewEntry(e.target.value)}
                            className="w-full rounded-lg border border-slate-200/85 dark:border-blue-400/20 bg-[#F8FAFC] dark:bg-[#071122] px-2.5 py-2 text-xs font-mono tabular-nums"
                          />
                        </div>
                        <div>
                          <label className="block text-xs text-slate-500 mb-1">Stop Loss</label>
                          <input
                            type="number"
                            step="any"
                            required
                            value={newSl}
                            onChange={(e) => setNewSl(e.target.value)}
                            className="w-full rounded-lg border border-slate-200/85 dark:border-blue-400/20 bg-[#F8FAFC] dark:bg-[#071122] px-2.5 py-2 text-xs font-mono tabular-nums"
                          />
                        </div>
                        <div>
                          <label className="block text-xs text-slate-500 mb-1">TP1</label>
                          <input
                            type="number"
                            step="any"
                            required
                            value={newTp1}
                            onChange={(e) => setNewTp1(e.target.value)}
                            className="w-full rounded-lg border border-slate-200/85 dark:border-blue-400/20 bg-[#F8FAFC] dark:bg-[#071122] px-2.5 py-2 text-xs font-mono tabular-nums"
                          />
                        </div>
                        <div>
                          <label className="block text-xs text-slate-500 mb-1">TP2</label>
                          <input
                            type="number"
                            step="any"
                            value={newTp2}
                            onChange={(e) => setNewTp2(e.target.value)}
                            className="w-full rounded-lg border border-slate-200/85 dark:border-blue-400/20 bg-[#F8FAFC] dark:bg-[#071122] px-2.5 py-2 text-xs font-mono tabular-nums"
                          />
                        </div>
                        <div>
                          <label className="block text-xs text-slate-500 mb-1">TP3</label>
                          <input
                            type="number"
                            step="any"
                            value={newTp3}
                            onChange={(e) => setNewTp3(e.target.value)}
                            className="w-full rounded-lg border border-slate-200/85 dark:border-blue-400/20 bg-[#F8FAFC] dark:bg-[#071122] px-2.5 py-2 text-xs font-mono tabular-nums"
                          />
                        </div>
                      </div>

                      <div>
                        <label className="block text-xs text-slate-500 mb-1">
                          SMC Execution Thesis
                        </label>
                        <textarea
                          rows={3}
                          required
                          value={newThesis}
                          onChange={(e) => setNewThesis(e.target.value)}
                          placeholder="Explain the liquidity sweep, BOS, and Order Block / FVG entry..."
                          className="w-full rounded-lg border border-slate-200/85 dark:border-blue-400/20 bg-[#F8FAFC] dark:bg-[#071122] px-3 py-2 text-xs"
                        />
                      </div>

                      <button
                        type="submit"
                        disabled={publishingSignal}
                        className="w-full py-2.5 px-4 rounded-lg bg-[#16A34A] text-white text-xs font-semibold hover:bg-[#15803D] transition-colors disabled:opacity-60"
                      >
                        {publishingSignal ? 'Publishing...' : 'Publish Signal to Desk'}
                      </button>
                    </form>

                    <div className="xl:col-span-6 rounded-xl border border-slate-200/85 dark:border-blue-400/20 bg-white dark:bg-[#0B1528] p-4 sm:p-6 space-y-4">
                      <h2 className="font-display text-lg font-bold text-[#0F172A] dark:text-white">
                        Manage Live Signal Statuses
                      </h2>
                      <div className="divide-y divide-slate-200/80 dark:divide-blue-400/15 max-h-[380px] overflow-y-auto">
                        {signals.map((sig) => (
                          <div
                            key={sig.id}
                            className="py-3 flex flex-col sm:flex-row sm:items-center justify-between gap-2"
                          >
                            <div>
                              <span className="font-semibold text-sm text-[#0F172A] dark:text-white">
                                {sig.pair}{' '}
                                <span
                                  className={
                                    sig.direction === 'BUY'
                                      ? 'text-[#16A34A]'
                                      : 'text-[#DC2626]'
                                  }
                                >
                                  {sig.direction}
                                </span>
                              </span>
                              <span className="text-xs text-slate-500 ml-2 font-mono tabular-nums">
                                @ {formatPrice(sig.pair, sig.entry)}
                              </span>
                            </div>
                            <div className="flex items-center gap-2">
                              <select
                                value={sig.status}
                                onChange={(e) => {
                                  const st = e.target.value as SignalStatus;
                                  const pips =
                                    st === 'TP1 Hit'
                                      ? 45
                                      : st === 'TP2 Hit'
                                        ? 95
                                        : st === 'TP3 Hit'
                                          ? 180
                                          : st === 'SL Hit'
                                            ? -30
                                            : 0;
                                  handleUpdateSignalStatus(sig.id, st, pips);
                                }}
                                className="rounded-md border border-slate-200/85 dark:border-blue-400/20 bg-[#F8FAFC] dark:bg-[#071122] px-2.5 py-1 text-xs"
                              >
                                <option>Active</option>
                                <option>TP1 Hit</option>
                                <option>TP2 Hit</option>
                                <option>TP3 Hit</option>
                                <option>SL Hit</option>
                                <option>Closed</option>
                              </select>
                              <button
                                type="button"
                                onClick={() => handleDeleteSignal(sig.id)}
                                aria-label={`Delete ${sig.pair} signal`}
                                className="p-1.5 text-slate-400 hover:text-[#DC2626] transition-colors"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 xl:grid-cols-12 gap-6">
                    <form
                      onSubmit={handleAddLesson}
                      className="xl:col-span-6 rounded-xl border border-slate-200/85 dark:border-blue-400/20 bg-white dark:bg-[#0B1528] p-4 sm:p-6 space-y-3.5"
                    >
                      <h2 className="font-display text-lg font-bold text-[#0F172A] dark:text-white">
                        Add Lesson to SK Academy
                      </h2>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <select
                          value={lesCourseId}
                          onChange={(e) => setLesCourseId(e.target.value)}
                          className="rounded-lg border border-slate-200/85 dark:border-blue-400/20 bg-[#F8FAFC] dark:bg-[#071122] px-3 py-2 text-xs"
                        >
                          {courses.map((c) => (
                            <option key={c.id} value={c.id}>
                              {c.title}
                            </option>
                          ))}
                        </select>
                        <input
                          type="number"
                          value={lesDuration}
                          onChange={(e) => setLesDuration(e.target.value)}
                          placeholder="Minutes (e.g. 25)"
                          className="rounded-lg border border-slate-200/85 dark:border-blue-400/20 bg-[#F8FAFC] dark:bg-[#071122] px-3 py-2 text-xs font-mono"
                        />
                      </div>
                      <input
                        type="text"
                        required
                        value={lesTitle}
                        onChange={(e) => setLesTitle(e.target.value)}
                        placeholder="Lesson Title"
                        className="w-full rounded-lg border border-slate-200/85 dark:border-blue-400/20 bg-[#F8FAFC] dark:bg-[#071122] px-3 py-2 text-xs"
                      />
                      <input
                        type="text"
                        required
                        value={lesSummary}
                        onChange={(e) => setLesSummary(e.target.value)}
                        placeholder="One-line summary"
                        className="w-full rounded-lg border border-slate-200/85 dark:border-blue-400/20 bg-[#F8FAFC] dark:bg-[#071122] px-3 py-2 text-xs"
                      />
                      <textarea
                        rows={3}
                        required
                        value={lesContent}
                        onChange={(e) => setLesContent(e.target.value)}
                        placeholder="Lesson study notes (separate paragraphs with new lines)..."
                        className="w-full rounded-lg border border-slate-200/85 dark:border-blue-400/20 bg-[#F8FAFC] dark:bg-[#071122] px-3 py-2 text-xs"
                      />
                      <textarea
                        rows={2}
                        value={lesRules}
                        onChange={(e) => setLesRules(e.target.value)}
                        placeholder="Key rules (one per line)..."
                        className="w-full rounded-lg border border-slate-200/85 dark:border-blue-400/20 bg-[#F8FAFC] dark:bg-[#071122] px-3 py-2 text-xs"
                      />
                      <button
                        type="submit"
                        className="px-4 py-2 rounded-lg bg-[#1D4ED8] text-white text-xs font-semibold hover:bg-[#1E40AF] transition-colors"
                      >
                        Publish Academy Lesson
                      </button>
                    </form>

                    <div className="xl:col-span-6 space-y-6">
                      <form
                        onSubmit={handlePublishBriefing}
                        className="rounded-xl border border-slate-200/85 dark:border-blue-400/20 bg-white dark:bg-[#0B1528] p-4 sm:p-6 space-y-3"
                      >
                        <h2 className="font-display text-lg font-bold text-[#0F172A] dark:text-white">
                          Post Market Briefing
                        </h2>
                        <input
                          type="text"
                          required
                          value={brfTitle}
                          onChange={(e) => setBrfTitle(e.target.value)}
                          placeholder="Briefing headline..."
                          className="w-full rounded-lg border border-slate-200/85 dark:border-blue-400/20 bg-[#F8FAFC] dark:bg-[#071122] px-3 py-2 text-xs"
                        />
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                          <select
                            value={brfSession}
                            onChange={(e) =>
                              setBrfSession(e.target.value as Briefing['session'])
                            }
                            className="rounded-lg border border-slate-200/85 dark:border-blue-400/20 bg-[#F8FAFC] dark:bg-[#071122] px-2.5 py-2 text-xs"
                          >
                            <option>London</option>
                            <option>New York</option>
                            <option>Asian</option>
                          </select>
                          <select
                            value={brfBias}
                            onChange={(e) =>
                              setBrfBias(e.target.value as Briefing['bias'])
                            }
                            className="rounded-lg border border-slate-200/85 dark:border-blue-400/20 bg-[#F8FAFC] dark:bg-[#071122] px-2.5 py-2 text-xs"
                          >
                            <option>Bullish</option>
                            <option>Bearish</option>
                            <option>Neutral</option>
                          </select>
                          <input
                            type="text"
                            value={brfPairs}
                            onChange={(e) => setBrfPairs(e.target.value)}
                            placeholder="XAUUSD, EURUSD"
                            className="rounded-lg border border-slate-200/85 dark:border-blue-400/20 bg-[#F8FAFC] dark:bg-[#071122] px-2.5 py-2 text-xs font-mono"
                          />
                        </div>
                        <textarea
                          rows={2}
                          required
                          value={brfSummary}
                          onChange={(e) => setBrfSummary(e.target.value)}
                          placeholder="Macro liquidity roadmap..."
                          className="w-full rounded-lg border border-slate-200/85 dark:border-blue-400/20 bg-[#F8FAFC] dark:bg-[#071122] px-3 py-2 text-xs"
                        />
                        <input
                          type="text"
                          value={brfLevels}
                          onChange={(e) => setBrfLevels(e.target.value)}
                          placeholder="Key levels (e.g. XAUUSD Demand 2635.00)"
                          className="w-full rounded-lg border border-slate-200/85 dark:border-blue-400/20 bg-[#F8FAFC] dark:bg-[#071122] px-3 py-2 text-xs font-mono"
                        />
                        <button
                          type="submit"
                          className="px-4 py-2 rounded-lg bg-[#16A34A] text-white text-xs font-semibold hover:bg-[#15803D] transition-colors"
                        >
                          Publish Briefing
                        </button>
                      </form>

                      <div className="rounded-xl border border-slate-200/85 dark:border-blue-400/20 bg-white dark:bg-[#0B1528] p-4 sm:p-6">
                        <h2 className="font-display text-lg font-bold text-[#0F172A] dark:text-white mb-3">
                          Mentorship & Partner Leads ({leads.length})
                        </h2>
                        <div className="space-y-3 max-h-48 overflow-y-auto">
                          {leads.map((ld) => (
                            <div
                              key={ld.id}
                              className="p-3 rounded-lg bg-[#F8FAFC] dark:bg-[#071122] border border-slate-200/80 dark:border-blue-400/15 text-xs"
                            >
                              <div className="flex items-center justify-between font-semibold text-[#0F172A] dark:text-white">
                                <span>{ld.name}</span>
                                <span className="text-[#1D4ED8] dark:text-blue-400">
                                  {ld.interest}
                                </span>
                              </div>
                              <p className="text-slate-500 mt-0.5">
                                {ld.email} · {ld.experience}
                              </p>
                              {ld.message && (
                                <p className="text-slate-600 dark:text-slate-300 mt-1">
                                  {ld.message}
                                </p>
                              )}
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </motion.div>
          )}
        </main>
      </div>
    </div>
  );
}
