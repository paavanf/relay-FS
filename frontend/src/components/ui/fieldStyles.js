// fieldStyles.js
// The class lists shared by Input and PasswordInput.
//
// PasswordInput has to look exactly like every other field, and the only way
// to guarantee that is for both to read the styling from one place. Copying
// the classes into each component works right up until someone changes one of
// them, at which point the password field quietly stops matching.

export const fieldLabel = 'mb-1.5 block text-label text-content-secondary';

export const fieldBase = [
  'h-9 w-full rounded-md border bg-surface-raised px-3 text-sm text-content-primary',
  'transition-colors placeholder:text-content-tertiary',
  'focus-visible:outline-2 focus-visible:outline-offset-0 focus-visible:outline-line-focus',
].join(' ');

export function fieldBorder(hasError) {
  return hasError ? 'border-danger-content' : 'border-line-strong hover:border-content-tertiary';
}

export const fieldHint = 'mt-1.5 text-xs text-content-tertiary';

export const fieldError = 'mt-1.5 text-xs text-danger-content';
