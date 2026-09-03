// Tabs - a horizontal row of tabs with a glowing underline on the active one.
// Controlled by the parent: pass `activeTab` and handle `onChange`.
import { cn } from '../../lib/utils.js';

export function Tabs({ tabs, activeTab, onChange }) {
  return (
    <div className="border-b border-white/8">
      <nav className="-mb-px flex gap-7">
        {tabs.map((tab) => {
          const isActive = tab.value === activeTab;

          return (
            <button
              key={tab.value}
              type="button"
              onClick={() => onChange(tab.value)}
              className={cn(
                'relative border-b-2 px-1 py-3.5 text-sm font-medium transition-colors duration-300',
                isActive
                  ? 'border-indigo-400 text-ink'
                  : 'border-transparent text-ink-faint hover:border-white/20 hover:text-ink-soft',
              )}
            >
              {tab.label}

              {/* Bloom under the active tab. */}
              {isActive && (
                <span
                  className="absolute inset-x-0 -bottom-px h-8 bg-indigo-400/25 blur-lg"
                  aria-hidden="true"
                />
              )}
            </button>
          );
        })}
      </nav>
    </div>
  );
}
