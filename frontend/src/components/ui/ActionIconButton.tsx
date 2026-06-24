import clsx from 'clsx';
import type { LucideIcon } from 'lucide-react';

type ActionVariant = 'neutral' | 'brand' | 'warning' | 'danger';

interface ActionIconButtonProps {
  icon: LucideIcon;
  title: string;
  onClick: () => void;
  variant?: ActionVariant;
  disabled?: boolean;
}

const variantStyles: Record<ActionVariant, string> = {
  neutral:
    'bg-ui-card/80 border-ui-card text-brand-deep hover:bg-brand-deep/12 hover:text-brand-dark hover:border-brand-deep/30 dark:bg-brand-deep/40 dark:border-brand-deep/60 dark:text-ui-bg dark:hover:bg-brand-deep/70',
  brand:
    'bg-brand-deep/8 border-brand-deep/20 text-brand-deep hover:bg-brand-primary/15 hover:text-brand-primary hover:border-brand-primary/35 dark:bg-brand-primary/10 dark:border-brand-primary/25 dark:text-brand-light dark:hover:bg-brand-primary/20',
  warning:
    'bg-accent-warning/10 border-accent-warning/25 text-accent-warning hover:bg-accent-warning/20 hover:border-accent-warning/40',
  danger:
    'bg-accent-danger/10 border-accent-danger/25 text-accent-danger hover:bg-accent-danger/20 hover:border-accent-danger/40',
};

export default function ActionIconButton({
  icon: Icon,
  title,
  onClick,
  variant = 'neutral',
  disabled,
}: ActionIconButtonProps) {
  return (
    <button
      type="button"
      title={title}
      aria-label={title}
      onClick={onClick}
      disabled={disabled}
      className={clsx(
        'inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border shadow-sm',
        'transition-all duration-200 hover:shadow-md hover:-translate-y-px active:scale-95',
        'disabled:pointer-events-none disabled:opacity-40',
        variantStyles[variant],
      )}
    >
      <Icon size={15} strokeWidth={2.25} />
    </button>
  );
}
