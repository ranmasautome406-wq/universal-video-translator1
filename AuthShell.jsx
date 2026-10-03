import { Link } from 'react-router-dom';
import { AlertCircle } from 'lucide-react';

export default function AuthShell({ title, subtitle, error, notice, children, footer }) {
  return (
    <section className="container-x grid place-items-center py-12 sm:py-20">
      <div className="glass w-full max-w-md animate-rise p-6 sm:p-8">
        <h1 className="text-2xl font-semibold">{title}</h1>
        {subtitle && <p className="mt-1.5 text-sm text-slate-400">{subtitle}</p>}
        {error && <p role="alert" className="mt-5 flex items-start gap-2 rounded-xl border border-red-400/30 bg-red-500/10 p-3 text-sm text-red-200"><AlertCircle className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />{error}</p>}
        {notice && <p role="status" className="mt-5 rounded-xl border border-brand/30 bg-brand/10 p-3 text-sm text-brand-soft">{notice}</p>}
        <div className="mt-6">{children}</div>
        {footer && <p className="mt-6 text-center text-sm text-slate-400">{footer}</p>}
      </div>
    </section>
  );
}

export function GoogleButton() {
  return (
    <>
      <button type="button" className="btn-ghost w-full" disabled aria-describedby="g-note">Continue with Google</button>
      <p id="g-note" className="mt-1.5 text-center text-xs text-slate-500">Google sign-in is not available until OAuth credentials are configured.</p>
      <div className="my-5 flex items-center gap-3 text-xs text-slate-500" aria-hidden="true"><span className="h-px flex-1 bg-white/10" />or<span className="h-px flex-1 bg-white/10" /></div>
    </>
  );
}

export const AuthLink = ({ to, children }) => <Link to={to} className="text-brand-soft underline-offset-2 hover:underline">{children}</Link>;
