import { useEffect } from 'react';
import { Link, Outlet, useLocation } from 'react-router-dom';
import Navbar from '../components/Navbar.jsx';
import DemoBanner from '../components/DemoBanner.jsx';
import Logo from '../components/Logo.jsx';

function ScrollManager() {
  const { pathname, hash } = useLocation();
  useEffect(() => {
    if (hash) setTimeout(() => document.getElementById(hash.slice(1))?.scrollIntoView(), 50);
    else window.scrollTo(0, 0);
  }, [pathname, hash]);
  return null;
}

export default function MainLayout() {
  return (
    <div className="flex min-h-screen flex-col">
      <a href="#main" className="sr-only focus:not-sr-only focus:absolute focus:left-3 focus:top-3 focus:z-50 focus:rounded-lg focus:bg-white focus:px-3 focus:py-2 focus:text-ink-950">Skip to content</a>
      <DemoBanner />
      <Navbar />
      <ScrollManager />
      <main id="main" className="flex-1"><Outlet /></main>
      <footer className="border-t border-white/10 py-8">
        <div className="container-x flex flex-col items-start justify-between gap-4 text-sm text-slate-400 sm:flex-row sm:items-center">
          <Logo />
          <nav aria-label="Footer" className="flex flex-wrap gap-x-5 gap-y-2">
            <Link to="/pricing" className="hover:text-white">Pricing</Link>
            <Link to="/translate" className="hover:text-white">Translate</Link>
            <Link to="/login" className="hover:text-white">Log in</Link>
          </nav>
        </div>
      </footer>
    </div>
  );
}
