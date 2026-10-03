import { useEffect, useState } from 'react';
import { Link, NavLink, useLocation, useNavigate } from 'react-router-dom';
import { Menu, X } from 'lucide-react';
import Logo from './Logo.jsx';
import { useAuth } from '../hooks/useAuth.jsx';

const LINKS = [
  { label: 'Home', to: '/' },
  { label: 'How It Works', to: '/#how-it-works' },
  { label: 'Features', to: '/#features' },
  { label: 'Languages', to: '/#languages' },
  { label: 'Pricing', to: '/pricing' },
  { label: 'About', to: '/#about' },
];

export default function Navbar() {
  const [open, setOpen] = useState(false);
  const { user, logout } = useAuth();
  const { pathname, hash } = useLocation();
  const navigate = useNavigate();

  useEffect(() => setOpen(false), [pathname, hash]);
  useEffect(() => {
    const onKey = (e) => e.key === 'Escape' && setOpen(false);
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  const linkCls = 'rounded-lg px-3 py-2 text-sm text-slate-300 transition hover:bg-white/5 hover:text-white';
  const items = LINKS.map((l) => (
    <NavLink key={l.label} to={l.to} end className={({ isActive }) => `${linkCls} ${isActive && !l.to.includes('#') ? 'text-white' : ''}`}>
      {l.label}
    </NavLink>
  ));

  const actions = user ? (
    <>
      <Link to="/dashboard" className="btn-ghost">Dashboard</Link>
      {user.role === 'admin' && <Link to="/admin" className="btn-ghost">Admin</Link>}
      <button className="btn-ghost" onClick={() => { logout(); navigate('/'); }}>Log out</button>
    </>
  ) : (
    <>
      <Link to="/login" className="btn-ghost">Log In</Link>
      <Link to="/register" className="btn-primary">Get Started</Link>
    </>
  );

  return (
    <header className="sticky top-0 z-40 border-b border-white/10 bg-ink-950/80 backdrop-blur-md">
      <div className="container-x flex h-16 items-center justify-between gap-4">
        <Logo />
        <nav aria-label="Main" className="hidden items-center gap-1 lg:flex">{items}</nav>
        <div className="hidden items-center gap-2 lg:flex">{actions}</div>
        <button
          className="grid h-11 w-11 place-items-center rounded-lg border border-white/15 text-white lg:hidden"
          aria-label={open ? 'Close menu' : 'Open menu'} aria-expanded={open} aria-controls="mobile-menu"
          onClick={() => setOpen((o) => !o)}
        >
          {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </button>
      </div>
      {open && (
        <div id="mobile-menu" className="container-x animate-fade pb-4 lg:hidden">
          <nav aria-label="Mobile" className="flex flex-col gap-1">{items}</nav>
          <div className="mt-3 flex flex-col gap-2 [&>*]:w-full">{actions}</div>
        </div>
      )}
    </header>
  );
}
