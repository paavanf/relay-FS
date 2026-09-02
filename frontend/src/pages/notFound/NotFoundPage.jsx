// NotFoundPage - the 404 screen for any route we don't recognise.
import { Link } from 'react-router';
import { Compass } from 'lucide-react';
import { useDocumentTitle } from '../../hooks/useDocumentTitle.js';

function NotFoundPage() {
  useDocumentTitle('Page not found');

  return (
    <div className="flex h-full flex-col items-center justify-center px-4 py-16 text-center">
      <div className="rounded-full bg-slate-100 p-4">
        <Compass className="size-8 text-slate-400" aria-hidden="true" />
      </div>

      <p className="mt-6 text-sm font-medium text-indigo-600">404</p>
      <h1 className="mt-2 text-2xl font-semibold text-slate-900">Page not found</h1>
      <p className="mt-2 max-w-sm text-sm text-slate-500">
        That link doesn&apos;t point anywhere in Relay. It may have moved, or never existed.
      </p>

      <Link
        to="/"
        className="mt-6 text-sm font-medium text-indigo-600 underline hover:text-indigo-700"
      >
        Back to Relay
      </Link>
    </div>
  );
}

export default NotFoundPage;
