import { useEffect, useState } from 'react';
import { FlaskConical, WifiOff } from 'lucide-react';

export default function DemoBanner() {
  const [state, setState] = useState(null);
  useEffect(() => {
    const base = import.meta.env.VITE_API_URL || '';
    fetch(`${base}/api/health`).then((r) => r.json()).then((d) => setState(d.demoMode ? 'demo' : null)).catch(() => setState('offline'));
  }, []);
  if (!state) return null;
  const demo = state === 'demo';
  const Icon = demo ? FlaskConical : WifiOff;
  return (
    <div role="status" className={`px-4 py-2 text-center text-xs sm:text-sm ${demo ? 'bg-brand/15 text-brand-soft' : 'bg-red-500/15 text-red-200'}`}>
      <Icon className="mr-1.5 inline h-4 w-4 align-[-3px]" aria-hidden="true" />
      {demo ? 'Demo Mode — AI providers are not connected.' : 'The backend is not reachable. Start it with "npm run dev" in /backend.'}
    </div>
  );
}
