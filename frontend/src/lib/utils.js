// Small utility functions used across the app.

// Combines class names, filters out falsy values.
export function cn(...classes) {
  return classes.filter(Boolean).join(' ');
}

// Gets initials from a name (e.g. "John Doe" -> "JD").
export function getInitials(name) {
  if (!name) return '?';
  return name
    .split(' ')
    .map((part) => part[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);
}
