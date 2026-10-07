// LandingFooter - the logo and a link to the source code. Nothing else: there
// is no company page, pricing or social account to point at, and inventing
// filler links would be worse than a short footer.
import { Logo } from '../../../components/Logo.jsx';

const REPOSITORY_URL = 'https://github.com/paavanf/relay-FS';

export function LandingFooter() {
  return (
    <footer className="border-t border-line-subtle">
      <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-4 px-4 py-6 sm:px-6 lg:px-8">
        <Logo size="sm" />
        <a
          href={REPOSITORY_URL}
          rel="noreferrer"
          className="rounded-sm text-body-sm text-content-secondary underline-offset-2 transition-colors hover:text-content-primary hover:underline"
        >
          Source code on GitHub
        </a>
      </div>
    </footer>
  );
}
