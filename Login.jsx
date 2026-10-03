import { useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Loader2 } from 'lucide-react';
import AuthShell, { AuthLink, GoogleButton } from '../components/AuthShell.jsx';
import { useAuth } from '../hooks/useAuth.jsx';

export default function Login() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const { state } = useLocation();
  const [f, setF] = useState({ email: '', password: '', remember: true });
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  const submit = async (e) => {
    e.preventDefault();
    setError('');
    if (!f.email || !f.password) return setError('Enter your email and password.');
    setBusy(true);
    try { await login(f.email, f.password, f.remember); navigate(state?.from || '/dashboard', { replace: true }); }
    catch (err) { setError(err.message); }
    finally { setBusy(false); }
  };

  return (
    <AuthShell title="Welcome back" subtitle="Log in to see your translation projects." error={error}
      footer={<>New here? <AuthLink to="/register">Create an account</AuthLink></>}>
      <GoogleButton />
      <form onSubmit={submit} className="space-y-4" noValidate>
        <div><label className="label" htmlFor="email">Email</label>
          <input id="email" type="email" autoComplete="email" className="input" value={f.email} onChange={(e) => setF({ ...f, email: e.target.value })} required /></div>
        <div><label className="label" htmlFor="password">Password</label>
          <input id="password" type="password" autoComplete="current-password" className="input" value={f.password} onChange={(e) => setF({ ...f, password: e.target.value })} required /></div>
        <div className="flex items-center justify-between text-sm">
          <label className="flex min-h-[44px] items-center gap-2"><input type="checkbox" checked={f.remember} onChange={(e) => setF({ ...f, remember: e.target.checked })} className="h-4 w-4 accent-brand" /> Remember me</label>
          <AuthLink to="/forgot-password">Forgot password?</AuthLink>
        </div>
        <button className="btn-primary w-full" disabled={busy}>{busy && <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />}{busy ? 'Logging in…' : 'Log in'}</button>
      </form>
    </AuthShell>
  );
}
