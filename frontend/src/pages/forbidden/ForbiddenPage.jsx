// ForbiddenPage - the 403 screen. Shown when someone opens a page their role
// doesn't allow, or an organisation they aren't a member of.
import { Link } from 'react-router';
import { ShieldAlert } from 'lucide-react';
import { AuroraBackground } from '../../components/AuroraBackground.jsx';
import { Reveal } from '../../components/motion/Reveal.jsx';
import { useDocumentTitle } from '../../hooks/useDocumentTitle.js';

function ForbiddenPage() {
  useDocumentTitle('Not allowed');

  return (
    <div className="relative flex h-full flex-col items-center justify-center overflow-hidden px-5 py-16 text-center">
      <AuroraBackground />

      <Reveal delay={0} className="relative z-10">
        <div className="relative mx-auto w-fit">
          <div className="absolute inset-0 rounded-3xl bg-amber-500/35 blur-2xl" aria-hidden="true" />
          <div className="glass relative rounded-3xl p-5">
            <ShieldAlert className="size-8 text-amber-200" aria-hidden="true" />
          </div>
        </div>
      </Reveal>

      <Reveal delay={110} className="relative z-10">
        <p className="mt-8 text-xs font-semibold tracking-[0.3em] text-amber-300 uppercase">403</p>
        <h1 className="text-aurora mt-3 text-4xl font-semibold tracking-tight">
          You can&apos;t open this page
        </h1>
        <p className="mx-auto mt-3 max-w-sm text-sm leading-relaxed text-ink-soft">
          Your role in this organisation doesn&apos;t include access to this area. Ask an owner or
          manager if you think that&apos;s wrong.
        </p>
      </Reveal>

      <Reveal delay={230} className="relative z-10">
        {/* A Link styled like a secondary button - a <button> must not wrap a link. */}
        <Link
          to="/app"
          className="mt-8 inline-flex items-center rounded-xl border border-white/12 bg-white/6 px-5 py-2.5 text-sm font-medium text-ink backdrop-blur-xl transition-colors duration-300 hover:bg-white/11"
        >
          Back to my organisations
        </Link>
      </Reveal>
    </div>
  );
}

export default ForbiddenPage;
