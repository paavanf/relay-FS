// ValidationNotice - the answer to "would this edit be legal?", shown before
// saving rather than after.
//
// The point of the whole section: a manager finds out an edit breaks minimum
// rest while they can still change their mind, not once it is already saved.
// The wording comes from the constraint engine, which phrases violations for
// people rather than for logs.
import { Callout } from '../../../components/ui/Callout.jsx';
import { Spinner } from '../../../components/ui/Spinner.jsx';

export function ValidationNotice({ isChecking, result }) {
  if (isChecking) {
    return (
      <p className="flex items-center gap-2 text-body-sm text-content-secondary">
        <Spinner size="sm" />
        Checking the rules...
      </p>
    );
  }

  if (!result) return null;

  if (result.allowed) {
    return <Callout variant="success">This assignment is valid.</Callout>;
  }

  return (
    <Callout variant="danger">
      {result.violations.length === 1 ? (
        result.violations[0].message
      ) : (
        <>
          This assignment breaks {result.violations.length} rules:
          <ul className="mt-1 list-disc pl-5">
            {result.violations.map((v) => (
              <li key={v.code + v.assignmentIds.join()}>{v.message}</li>
            ))}
          </ul>
        </>
      )}
    </Callout>
  );
}
