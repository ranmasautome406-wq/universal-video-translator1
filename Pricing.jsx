import { Link } from 'react-router-dom';
import { Check } from 'lucide-react';
import { PLANS, CURRENCY } from '../config/plans.js';

export default function Pricing() {
  return (
    <section className="container-x py-14 sm:py-20">
      <h1 className="text-3xl font-semibold sm:text-4xl">Pricing</h1>
      <p className="mt-3 max-w-xl text-slate-400">Start free and upgrade when you need voice dubbing and higher limits.</p>
      <div className="mt-10 grid gap-5 md:grid-cols-3">
        {PLANS.map((p) => (
          <article key={p.id} className={`glass flex flex-col p-6 ${p.highlight ? 'border-brand/60 ring-1 ring-brand/40' : ''}`}>
            <h2 className="text-lg font-semibold">{p.name}</h2>
            <p className="mt-1 text-sm text-slate-400">{p.blurb}</p>
            <p className="mt-5 font-display text-4xl font-semibold text-white">
              {CURRENCY}{p.price}<span className="text-sm font-normal text-slate-400"> / {p.period}</span>
            </p>
            <ul className="mt-6 flex-1 space-y-2.5 text-sm">
              {p.features.map((f) => (
                <li key={f} className="flex items-start gap-2"><Check className="mt-0.5 h-4 w-4 shrink-0 text-brand-soft" aria-hidden="true" />{f}</li>
              ))}
            </ul>
            <Link to={`/register?plan=${p.id}`} className={`${p.highlight ? 'btn-primary' : 'btn-ghost'} mt-7`}>{p.cta}</Link>
          </article>
        ))}
      </div>
      <p className="mt-6 text-sm text-slate-500">Prices are placeholders and payments are not connected. An admin can change a user's plan from the admin panel.</p>
    </section>
  );
}
