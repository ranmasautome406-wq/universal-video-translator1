import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Loader2 } from 'lucide-react';
import AuthShell, { AuthLink, GoogleButton } from '../components/AuthShell.jsx';
import { useAuth } from '../hooks/useAuth.jsx';

export default function Register() {
  const { register } = useAuth();
  const navigate = useNavigate();
  const [f, setF] = useState({ name: '', email: '', password: '', confirm: '' });
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const set = (k) => (e) => setF({ ...f, [k]: e.target.value });

  const submit = async (e) => {
    e.preventDefault();
    setError('');
    if (f.name.trim().length < 2) return setError('Enter your name.');
    if (f.password.length < 8) return setError('Password must be at least 8 characters.');
    if (f.password !== f.confirm) return setError('Passwords do not match.');
    setBusy(true);
    try { await register(f.name.trim(), f.email, f.password); navigate('/dashboard', { replace: true }); }
    catch (err) { setError(err.message); }
    finally { setBusy(false); }
  };

  return (
    <AuthShell title="Create your account" subtitle="Free plan includes 3 videos per month." error={error}
      footer={<>Already have an account? <AuthLink to="/login">Log in</AuthLink></>}>
      <GoogleButton />
      <form onSubmit={submit} className="space-y-4" noValidate>
        <div><label className="label" htmlFor="name">Name</label><input id="name" autoComplete="name" className="input" value={f.name} onChange={set('name')} required /></div>
        <div><label className="label" htmlFor="email">Email</label><input id="email" type="email" autoComplete="email" className="input" value={f.email} onChange={set('email')} required /></div>
        <div><label className="label" htmlFor="password">Password</label><input id="password" type="password" autoComplete="new-password" className="input" value={f.password} onChange={set('password')} aria-describedby="pw-hint" required />
          <p id="pw-hint" className="mt-1 text-xs text-slate-500">At least 8 characters.</p></div>
        <div><label className="label" htmlFor="confirm">Confirm password</label><input id="confirm" type="password" autoComplete="new-password" className="input" value={f.confirm} onChange={set('confirm')} required /></div>
        <button className="btn-primary w-full" disabled={busy}>{busy && <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />}{busy ? 'Creating account…' : 'Create account'}</button>
      </form>
    </AuthShell>
  );
}
