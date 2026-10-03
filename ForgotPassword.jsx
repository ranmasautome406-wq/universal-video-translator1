import { useState } from 'react';
import { Loader2 } from 'lucide-react';
import AuthShell, { AuthLink } from '../components/AuthShell.jsx';
import { api } from '../services/api.js';

export default function ForgotPassword() {
  const [email, setEmail] = useState('');
  const [notice, setNotice] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  const submit = async (e) => {
    e.preventDefault();
    setError(''); setNotice('');
    if (!email) return setError('Enter your email address.');
    setBusy(true);
    try { const d = await api('/api/auth/forgot-password', { method: 'POST', body: { email } }); setNotice(d.message); }
    catch (err) { setError(err.message); }
    finally { setBusy(false); }
  };

  return (
    <AuthShell title="Reset your password" subtitle="Enter your email and we'll send reset instructions." error={error} notice={notice}
      footer={<AuthLink to="/login">Back to log in</AuthLink>}>
      <form onSubmit={submit} className="space-y-4" noValidate>
        <div><label className="label" htmlFor="email">Email</label><input id="email" type="email" autoComplete="email" className="input" value={email} onChange={(e) => setEmail(e.target.value)} required /></div>
        <button className="btn-primary w-full" disabled={busy}>{busy && <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />}Send reset link</button>
      </form>
    </AuthShell>
  );
}
