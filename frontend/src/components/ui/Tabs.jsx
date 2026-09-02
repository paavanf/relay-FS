// Tabs - a horizontal row of tabs with an underline under the active one.
// Controlled by the parent: pass `activeTab` and handle `onChange`.
import { cn } from '../../lib/utils.js';

export function Tabs({ tabs, activeTab, onChange }) {
  return (
    <div className="border-b border-slate-200">
      <nav className="-mb-px flex gap-6">
        {tabs.map((tab) => {
          const isActive = tab.value === activeTab;

          return (
            <button
              key={tab.value}
              type="button"
              onClick={() => onChange(tab.value)}
              className={cn(
                'border-b-2 px-1 py-3 text-sm font-medium transition-colors',
                isActive
                  ? 'border-indigo-600 text-indigo-700'
                  : 'border-transparent text-slate-500 hover:border-slate-300 hover:text-slate-700',
              )}
            >
              {tab.label}
            </button>
          );
        })}
      </nav>
    </div>
  );
}
