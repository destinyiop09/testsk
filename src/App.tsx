import {useCallback, useEffect, useState} from 'react';
import {AnimatePresence, MotionConfig, motion} from 'motion/react';
import type {PublicUser, ShowcasePayload} from './types';
import {LandingPage} from './components/LandingPage';
import {TradingDesk} from './components/TradingDesk';

export default function App() {
  const [view, setView] = useState<'landing' | 'desk'>('landing');
  const [user, setUser] = useState<PublicUser | null>(null);
  const [showcase, setShowcase] = useState<ShowcasePayload | null>(null);
  const [isDark, setIsDark] = useState<boolean>(() => {
    try {
      const saved = window.localStorage.getItem('skfx-theme');
      if (saved === 'light-blue') return false;
      if (saved === 'dark') return true;
    } catch {
      // ignore storage errors
    }
    return true;
  });
  const [bootstrapped, setBootstrapped] = useState(false);

  useEffect(() => {
    const root = document.documentElement;
    if (isDark) {
      root.classList.add('dark');
    } else {
      root.classList.remove('dark');
    }
    try {
      window.localStorage.setItem('skfx-theme', isDark ? 'dark' : 'light-blue');
    } catch {
      // ignore storage errors
    }
  }, [isDark]);

  const loadBootstrap = useCallback(async () => {
    try {
      const [meRes, pubRes] = await Promise.all([
        fetch('/api/auth/me'),
        fetch('/api/public/showcase'),
      ]);
      if (meRes.ok) {
        const meData = (await meRes.json()) as {user: PublicUser | null};
        setUser(meData.user);
      }
      if (pubRes.ok) {
        const pubData = (await pubRes.json()) as ShowcasePayload;
        setShowcase(pubData);
      }
    } finally {
      setBootstrapped(true);
    }
  }, []);

  useEffect(() => {
    loadBootstrap();
  }, [loadBootstrap]);

  const handleAuthenticated = (authedUser: PublicUser) => {
    setUser(authedUser);
    setView('desk');
  };

  const handleLogout = async () => {
    await fetch('/api/auth/logout', {method: 'POST'});
    setUser(null);
    setView('landing');
    loadBootstrap();
  };

  if (!bootstrapped) {
    return (
      <div
        className={`min-h-screen flex items-center justify-center ${
          isDark ? 'bg-[#050924] text-white' : 'bg-[#F8FAFC] text-[#0F172A]'
        }`}
      >
        <div className="text-center space-y-2">
          <div className="font-display text-lg font-bold tracking-tight">
            SKFX ACADEMY
          </div>
          <p className={`text-xs ${isDark ? 'text-blue-200/80' : 'text-slate-500'}`}>
            Loading trading desk...
          </p>
        </div>
      </div>
    );
  }

  return (
    <MotionConfig reducedMotion="user">
      <AnimatePresence mode="wait">
        {view === 'desk' && user ? (
          <motion.div
            key="desk-view"
            initial={{opacity: 0, y: 6}}
            animate={{opacity: 1, y: 0}}
            exit={{opacity: 0, y: -6}}
            transition={{duration: 0.2, ease: [0.16, 1, 0.3, 1]}}
          >
            <TradingDesk
              user={user}
              isDark={isDark}
              onToggleTheme={() => setIsDark((d) => !d)}
              onBackToLanding={() => {
                setView('landing');
                loadBootstrap();
              }}
              onUserUpdated={(updated) => setUser(updated)}
              onLogout={handleLogout}
            />
          </motion.div>
        ) : (
          <motion.div
            key="landing-view"
            initial={{opacity: 0}}
            animate={{opacity: 1}}
            exit={{opacity: 0}}
            transition={{duration: 0.2, ease: [0.16, 1, 0.3, 1]}}
          >
            <LandingPage
              showcase={showcase}
              currentUser={user}
              isDark={isDark}
              onToggleTheme={() => setIsDark((d) => !d)}
              onAuthenticated={handleAuthenticated}
              onEnterDesk={() => setView('desk')}
            />
          </motion.div>
        )}
      </AnimatePresence>
    </MotionConfig>
  );
}
