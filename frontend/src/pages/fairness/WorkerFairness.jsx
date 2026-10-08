// WorkerFairness - what a worker sees: themselves against the team average,
// and nobody else. The server sent nothing about anyone else to show.
import { Card, CardContent } from '../../components/ui/Card.jsx';
import { DeviationBar } from './DeviationBar.jsx';
import { BreakdownList } from './BreakdownList.jsx';
import { summarySentence } from './fairnessWords.js';

export function WorkerFairness({ data }) {
  const { you, window } = data;

  return (
    <div className="space-y-6">
      <Card>
        <CardContent className="space-y-4 py-5">
          <p className="text-h3 text-content-primary">{summarySentence(you, window)}</p>
          {you?.measured && <DeviationBar deviationPercent={you.deviationPercent} />}
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
