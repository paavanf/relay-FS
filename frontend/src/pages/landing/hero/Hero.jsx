// Hero - what Relay is, in one sentence, with the product doing it right
// underneath.
//
// The heading names the promise and its honest limit together: rules are
// kept, and a shift that cannot be filled within them is reported rather
// than forced. The demonstration below is the real roster grid. In the public
// demo build the second button offers the shared demo instead of a login.
import { ButtonLink } from '../../../components/ui/ButtonLink.jsx';
import { DEMO_MODE } from '../../../features/demo/demoMode.js';
import { HeroRosterDemo } from './HeroRosterDemo.jsx';

export function Hero() {
  return (
    <section aria-labelledby="hero-title" className="pt-12 pb-16 sm:pt-16 sm:pb-20">
      <div className="max-w-2xl">
        <h1 id="hero-title" className="text-display tracking-[-0.02em] text-content-primary">
          Staff rosters that follow your rules, and explain any shift they can&apos;t fill
        </h1>

        <p className="mt-4 text-base leading-relaxed text-content-secondary">
          Relay gives each shift to someone qualified and available, inside the rest and
          working-time limits you set. If a shift can&apos;t be covered without breaking one, it
          stays empty and you are told which rule stopped it.
        </p>

        <div className="mt-7 flex flex-wrap gap-3">
          <ButtonLink to="/register" size="lg">
            Create an organisation
          </ButtonLink>
          <ButtonLink to="/login" size="lg" variant="secondary">
            {DEMO_MODE ? 'Try the demo' : 'Log in'}
          </ButtonLink>
        </div>
      </div>

      <div className="mt-12">
        <HeroRosterDemo />
      </div>
    </section>
  );
}
