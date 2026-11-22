// RouteErrorPage - what a page shows when something in it crashed, instead
// of a white screen. Inside the app it takes the page's place and leaves the
// sidebar and top bar working, so the rest of Relay is still a click away.
//
// "Try again" reloads, which also fetches a fresh copy of the page's code -
// the usual cure when a new version was deployed while the tab was open.
//
// A page whose code could not be downloaded - offline, say - is not a bug in
// the page, so it gets plain words instead of the browser's message, and it
// reloads by itself once the connection is back.
import { useEffect } from 'react';
import { Link, useRouteError } from 'react-router';
import { Button } from '../../components/ui/Button.jsx';
import { useDocumentTitle } from '../../hooks/useDocumentTitle.js';
import { reloadPage } from '../../lib/reloadPage.js';

const LOAD_FAILURE = /dynamically imported module|Importing a module script failed/i;

function RouteErrorPage() {
  const error = useRouteError();
  const couldNotLoad = LOAD_FAILURE.test(error?.message ?? '');
  useDocumentTitle(couldNotLoad ? 'Page could not load' : 'Something went wrong');

  useEffect(() => {
    if (!couldNotLoad) return undefined;
    window.addEventListener('online', reloadPage);
    return () => window.removeEventListener('online', reloadPage);
  }, [couldNotLoad]);

  return (
    <div role="alert" className="mx-auto flex max-w-md flex-col items-center px-6 py-16 text-center">
      <h1 className="text-h2 text-content-primary">
        {couldNotLoad ? 'This page could not be loaded' : 'Something went wrong on this page'}
      </h1>
      <p className="mt-2 text-body-sm text-content-secondary">
        {couldNotLoad
          ? 'Check your connection. Once you are back online the page loads by itself.'
          : 'Nothing you saved has been lost. Try again, or go back to the start.'}
      </p>
      {!couldNotLoad && error?.message && <p className="mt-2 text-xs break-words text-content-tertiary">{error.message}</p>}
      <div className="mt-6 flex flex-wrap justify-center gap-2">
        <Button onClick={reloadPage}>Try again</Button>
        <Link
          to="/"
          className="inline-flex h-9 items-center rounded-md border border-line-strong bg-surface-raised px-4 text-sm font-medium text-content-primary transition-colors hover:bg-surface-hover"
        >
          Back to the start
        </Link>
      </div>
    </div>
  );
}

export default RouteErrorPage;
