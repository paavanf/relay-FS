// NotFoundPage - the 404 screen for any route we do not recognise.
import { Link } from 'react-router';
import { Logo } from '../../components/Logo.jsx';
import { useDocumentTitle } from '../../hooks/useDocumentTitle.js';

function NotFoundPage() {
  useDocumentTitle('Page not found');

  return (
    <div className="flex h-full flex-col items-center justify-center bg-surface-base px-6 text-center">
      <Logo size="md" />

      <p className="data mt-8 text-body-sm text-content-tertiary">404</p>
      <h1 className="mt-2 text-h1 text-content-primary">Page not found</h1>
      <p className="mt-1.5 max-w-sm text-sm text-content-secondary">
        That link does not point anywhere in Relay. It may have moved, or never existed.
      </p>

      <Link
        to="/"
        className="mt-6 inline-flex h-9 items-center rounded-md border border-line-strong bg-surface-raised px-4 text-sm font-medium text-content-primary transition-colors hover:bg-surface-hover"
      >
        Back to Relay
      </Link>
    </div>
  );
}

export default NotFoundPage;
