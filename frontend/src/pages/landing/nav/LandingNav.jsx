// LandingNav - the top bar of the landing page: the logo, the theme toggle,
// and the two ways in. It sits on the rail's deep tone (data-surface="rail"),
// running straight into the hero band below it.
import { Link } from 'react-router';
import { Logo } from '../../../components/Logo.jsx';
import { ThemeToggle } from '../../../components/ui/ThemeToggle.jsx';
import { ButtonLink } from '../../../components/ui/ButtonLink.jsx';

export function LandingNav() {
  return (
    <header data-surface="rail" className="bg-surface-raised">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between gap-3 px-4 sm:px-6 lg:px-8">
        <Link to="/" className="rounded-md">
          <Logo size="md" />
        </Link>

        <nav aria-label="Account" className="flex items-center gap-2">
          <ThemeToggle />
          <ButtonLink to="/login" variant="ghost" size="sm">
            Log in
          </ButtonLink>
          <span className="hidden sm:inline-flex">
            <ButtonLink to="/register" size="sm">
              Create an organisation
            </ButtonLink>
          </span>
        </nav>
      </div>
    </header>
  );
}
