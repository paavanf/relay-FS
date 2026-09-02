// Card and its parts. They all live in one file because each is only a
// styled wrapper - splitting them into six files would be noise.
import { cn } from '../../lib/utils.js';

export function Card({ children, className }) {
  return (
    <div className={cn('rounded-lg border border-slate-200 bg-white shadow-sm', className)}>
      {children}
    </div>
  );
}

export function CardHeader({ children, className }) {
  return <div className={cn('space-y-1 px-6 pt-6 pb-4', className)}>{children}</div>;
}

export function CardTitle({ children, className }) {
  return <h3 className={cn('text-lg font-semibold text-slate-900', className)}>{children}</h3>;
}

export function CardDescription({ children, className }) {
  return <p className={cn('text-sm text-slate-500', className)}>{children}</p>;
}

export function CardContent({ children, className }) {
  return <div className={cn('px-6 pb-6', className)}>{children}</div>;
}

export function CardFooter({ children, className }) {
  return (
    <div className={cn('flex items-center gap-3 border-t border-slate-200 px-6 py-4', className)}>
      {children}
    </div>
  );
}
