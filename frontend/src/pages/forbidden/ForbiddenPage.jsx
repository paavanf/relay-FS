// ForbiddenPage - the 403 screen, shown when someone opens a page their role
// does not allow, or an organisation they do not belong to.
import { Link } from 'react-router';
import { ShieldAlert } from 'lucide-react';
import { useDocumentTitle } from '../../hooks/useDocumentTitle.js';

function ForbiddenPage() {
  useDocumentTitle('Not allowed');

  return (
    <div className="flex h-full flex-col items-center justify-center bg-surface-base px-6 text-center">
      <ShieldAlert className="size-6 text-warning-content" aria-hidden="true" />

      <p className="data mt-6 text-body-sm text-content-tertiary">403</p>
      <h1 className="mt-2 text-h1 tracking-[-0.01em] text-content-primary">
        You cannot open this page
      </h1>
      <p className="mt-1.5 max-w-sm text-sm text-content-secondary">
        Your role in this organisation does not include access to this area. Ask an owner or
        manager if you think that is wrong.
      </p>

      <Link
        to="/app"
        className="mt-6 inline-flex h-9 items-center rounded-md border border-line-strong bg-surface-raised px-4 text-sm font-medium text-content-primary transition-colors hover:bg-surface-hover"
      >
        Back to my organisations
      </Link>
    </div>
  );
}

export default ForbiddenPage;
