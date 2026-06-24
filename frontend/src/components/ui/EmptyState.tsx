import { Inbox } from 'lucide-react';

interface EmptyStateProps {
  title?: string;
  message?: string;
}

export default function EmptyState({ title = 'No data found', message = 'Get started by adding a new record.' }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center py-12 text-center">
      <Inbox size={48} className="text-ui-card mb-4" />
      <h3 className="text-lg font-medium">{title}</h3>
      <p className="text-sm text-brand-deep/70 dark:text-ui-card/70 mt-1">{message}</p>
    </div>
  );
}
