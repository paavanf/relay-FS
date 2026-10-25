// Hero - what Relay is, in one sentence, with the product doing it right
// underneath.
//
// The heading names the promise and its honest limit together: rules are
// kept, and a shift that cannot be filled within them is reported rather
// than forced. It sits on a band in the rail's deep tone; the demonstration -
// the real roster grid - is a raised window pulled up over the band's edge.
// In the public demo build the second button offers the shared demo instead
// of a login.
import { ButtonLink } from '../../../components/ui/ButtonLink.jsx';
import { DEMO_MODE } from '../../../features/demo/demoMode.js';
import { HeroRosterDemo } from './HeroRosterDemo.jsx';

export function Hero() {
  return (
    <section aria-labelledby="hero-title">
      <div data-surface="rail" className="bg-surface-raised">
        <div className="mx-auto max-w-7xl px-4 pt-10 pb-28 sm:px-6 sm:pt-16 sm:pb-36 lg:px-8">
          <div className="max-w-3xl">
            <h1 id="hero-title" className="text-h1 text-content-primary sm:text-display sm:[font-stretch:115%]">
              Staff rosters that follow your rules, and explain any shift they can&apos;t fill
            </h1>

            <p className="mt-5 max-w-2xl text-base leading-relaxed text-content-secondary">
              Relay gives each shift to someone qualified and available, inside the rest and
              working-time limits you set. If a shift can&apos;t be covered without breaking one, it
              stays empty and you are told which rule stopped it.
            </p>

            <div className="mt-8 flex flex-wrap gap-3">
              <ButtonLink to="/register" size="lg">
                Create an organisation
              </ButtonLink>
              <ButtonLink to="/login" size="lg" variant="secondary">
                {DEMO_MODE ? 'Try the demo' : 'Log in'}
              </ButtonLink>
            </div>
          </div>
        </div>
      </div>

      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="relative -mt-20 rounded-xl border border-line-subtle bg-surface-raised p-3 elevation-lg sm:-mt-24">
          <HeroRosterDemo />
        </div>
      </div>
    </section>
  );
}
