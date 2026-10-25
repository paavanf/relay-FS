// themeStorage.js
// Reading, writing and applying the theme. Kept apart from the provider so
// the provider is only wiring, and so index.html's inline script and this
// module agree on one storage key.
//
// There are two different things here, and mixing them up is what makes
// theme toggles feel broken:
//   preference  - what the user chose: 'system', 'light' or 'dark'
//   resolved    - what is actually painted: 'light' or 'dark'
// Only 'system' needs resolving, and it can change under us when the OS
// switches, which is why the provider listens for it.

export const STORAGE_KEY = 'relay-theme';

export const SYSTEM = 'system';

const VALID = [SYSTEM, 'light', 'dark'];

export function readPreference() {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    return VALID.includes(saved) ? saved : SYSTEM;
  } catch {
    // Private modes can refuse storage entirely. Following the OS is the
    // right fallback: it is also the default.
    return SYSTEM;
  }
}

export function writePreference(preference) {
  try {
    localStorage.setItem(STORAGE_KEY, preference);
  } catch {
    // The theme still applies for this session, it just is not remembered.
  }
}

export function systemTheme() {
  // Guarded so the module can be imported outside a browser (a test runner,
  // a render harness) without exploding on the first call.
  if (typeof window === 'undefined' || !window.matchMedia) return 'light';
  return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
}

export function resolveTheme(preference) {
  return preference === SYSTEM ? systemTheme() : preference;
}

// The attribute index.css keys off, plus the browser-chrome colour so the
// address bar on mobile matches the page rather than flashing white.
export function applyTheme(resolved) {
  document.documentElement.dataset.theme = resolved;

  const meta = document.querySelector('meta[name="theme-color"]');
  if (meta) meta.setAttribute('content', resolved === 'dark' ? '#132023' : '#edf1f2');
}
