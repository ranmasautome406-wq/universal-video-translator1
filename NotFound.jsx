import { Link } from 'react-router-dom';

export default function NotFound() {
  return (
    <section className="container-x py-24 text-center">
      <h1 className="text-3xl font-semibold">Page not found</h1>
      <p className="mt-3 text-slate-400">The page you're looking for doesn't exist or has moved.</p>
      <Link to="/" className="btn-primary mt-6">Go home</Link>
    </section>
  );
}
