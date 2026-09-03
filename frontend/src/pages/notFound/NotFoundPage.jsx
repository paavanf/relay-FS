// NotFoundPage - the 404 screen for any route we don't recognise.
import { Link } from 'react-router';
import { Compass } from 'lucide-react';
import { AuroraBackground } from '../../components/AuroraBackground.jsx';
import { Reveal } from '../../components/motion/Reveal.jsx';
import { useDocumentTitle } from '../../hooks/useDocumentTitle.js';

function NotFoundPage() {
  useDocumentTitle('Page not found');

  return (
    <div className="relative flex h-full flex-col items-center justify-center overflow-hidden px-5 py-16 text-center">
      <AuroraBackground />

      <Reveal delay={0} className="relative z-10">
        <div className="relative mx-auto w-fit">
          <div className="absolute inset-0 rounded-3xl bg-indigo-500/35 blur-2xl" aria-hidden="true" />
          <div className="glass relative rounded-3xl p-5">
            <Compass className="size-8 text-indigo-200" aria-hidden="true" />
          </div>
        </div>
      </Reveal>

      <Reveal delay={110} className="relative z-10">
        <p className="mt-8 text-xs font-semibold tracking-[0.3em] text-indigo-300 uppercase">404</p>
        <h1 className="text-aurora mt-3 text-4xl font-semibold tracking-tight">Page not found</h1>
        <p className="mx-auto mt-3 max-w-sm text-sm leading-relaxed text-ink-soft">
          That link doesn&apos;t point anywhere in Relay. It may have moved, or never existed.
        </p>
      </Reveal>

      <Reveal delay={230} className="relative z-10">
        <Link
          to="/"
          className="mt-8 inline-flex items-center rounded-xl border border-white/12 bg-white/6 px-5 py-2.5 text-sm font-medium text-ink backdrop-blur-xl transition-colors duration-300 hover:bg-white/11"
        >
          Back to Relay
        </Link>
      </Reveal>
    </div>
  );
}

export default NotFoundPage;
