import { Link } from 'react-router-dom';

export default function Logo() {
  return (
    <Link to="/" className="flex items-center gap-2 font-display text-base font-semibold text-white" aria-label="Universal Video Translator home">
      <span aria-hidden="true" className="text-xl">🌐</span>
      <span className="hidden min-[400px]:inline">Universal Video Translator</span>
    </Link>
  );
}
