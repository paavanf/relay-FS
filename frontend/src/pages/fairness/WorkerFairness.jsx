// WorkerFairness - what a worker sees: themselves against the team average,
// and nobody else. The server sent nothing about anyone else to show.
//
// While fewer than three people are measured, the server leaves out the
// average as well - with two, your own figure and the average would give
// away the other person's. The page then shows your own shifts and says
// when the comparison will appear.
import { Card, CardContent } from '../../components/ui/Card.jsx';
import { Callout } from '../../components/ui/Callout.jsx';
import { DeviationBar } from './DeviationBar.jsx';
import { BreakdownList } from './BreakdownList.jsx';
import { summarySentence, ownShiftsSentence } from './fairnessWords.js';

export function WorkerFairness({ data }) {
  const { you, window, comparison } = data;
  const compared = comparison?.available !== false;

  return (
    <div className="space-y-6">
      <Card>
        <CardContent className="space-y-4 py-5">
          <p className="text-h3 text-content-primary">
            {compared ? summarySentence(you, window) : ownShiftsSentence(you, window)}
          </p>

          {compared && you?.measured && <DeviationBar deviationPercent={you.deviationPercent} />}

          {!compared && (
            <Callout variant="info">
              The comparison with the team average appears once the team is larger: at least{' '}
              {comparison.minimumMeasured} people with hours or shifts in this period. With fewer,
              the average would give away a colleague&apos;s figures.
            </Callout>
          )}
        </CardContent>
      </Card>

      {you && (
        <section aria-labelledby="your-shifts" className="space-y-3">
          <h2 id="your-shifts" className="text-h3 text-content-primary">
            Your shifts in this period
          </h2>
          <BreakdownList you={you} />
        </section>
      )}
    </div>
  );
}
