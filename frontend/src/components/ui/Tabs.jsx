// Tabs - underline style with a teal active indicator. Sentence-case labels.
import { cn } from '../../lib/utils.js';

export function Tabs({ tabs, activeTab, onChange }) {
  return (
    <div className="border-b border-line">
      <nav className="-mb-px flex gap-6" role="tablist">
        {tabs.map((tab) => {
          const isActive = tab.value === activeTab;

          return (
            <button
              key={tab.value}
              type="button"
              role="tab"
              aria-selected={isActive}
              onClick={() => onChange(tab.value)}
              className={cn(
                'border-b-2 px-0.5 py-2.5 text-sm transition-colors',
                isActive
                  ? 'border-brand-600 font-medium text-ink'
                  : 'border-transparent text-ink-muted hover:border-line-strong hover:text-ink',
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
