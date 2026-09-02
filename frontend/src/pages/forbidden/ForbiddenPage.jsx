// ForbiddenPage - the 403 screen. Shown when someone opens a page their role
// doesn't allow, or an organisation they aren't a member of.
import { Link } from 'react-router';
import { ShieldAlert } from 'lucide-react';
import { useDocumentTitle } from '../../hooks/useDocumentTitle.js';

function ForbiddenPage() {
  useDocumentTitle('Not allowed');

  return (
    <div className="flex h-full flex-col items-center justify-center px-4 py-16 text-center">
      <div className="rounded-full bg-amber-50 p-4">
        <ShieldAlert className="size-8 text-amber-600" aria-hidden="true" />
      </div>

      <p className="mt-6 text-sm font-medium text-amber-600">403</p>
      <h1 className="mt-2 text-2xl font-semibold text-slate-900">You can&apos;t open this page</h1>
      <p className="mt-2 max-w-sm text-sm text-slate-500">
        Your role in this organisation doesn&apos;t include access to this area. Ask an owner or
        manager if you think that&apos;s wrong.
      </p>

      {/* A Link styled like a secondary button - a <button> must not wrap a link. */}
      <Link
        to="/app"
        className="mt-6 inline-flex items-center rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 transition-colors hover:bg-slate-50"
      >
        Back to my organisations
      </Link>
    </div>
  );
}

export default ForbiddenPage;
