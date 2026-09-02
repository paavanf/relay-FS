// Re-exports every UI component so pages can import them in one line:
//   import { Button, Card, Badge } from '@/components/ui';

export { Button } from './Button.jsx';
export { Input } from './Input.jsx';
export { Textarea } from './Textarea.jsx';
export { Select } from './Select.jsx';
export { Checkbox } from './Checkbox.jsx';
export { Badge } from './Badge.jsx';
export { Spinner } from './Spinner.jsx';
export { EmptyState } from './EmptyState.jsx';
export { ErrorState } from './ErrorState.jsx';
export { Skeleton } from './Skeleton.jsx';
export { Avatar } from './Avatar.jsx';
export { PageHeader } from './PageHeader.jsx';
export { Tabs } from './Tabs.jsx';

export {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  CardFooter,
} from './Card.jsx';

export * from './table/index.js';
export * from './dialog/index.js';
export * from './toast/index.js';
