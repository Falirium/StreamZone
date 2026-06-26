import { type ReactNode } from 'react';

type BadgeVariant = 'success' | 'warning' | 'danger' | 'info' | 'neutral';

interface StatusBadgeProps {
  variant: BadgeVariant;
  children: ReactNode;
}

const variantStyles: Record<BadgeVariant, string> = {
  success: 'bg-emerald-500/15 text-emerald-400 border-emerald-500/20',
  warning: 'bg-amber-500/15 text-amber-400 border-amber-500/20',
  danger: 'bg-red-500/15 text-red-400 border-red-500/20',
  info: 'bg-brand-500/15 text-brand-400 border-brand-500/20',
  neutral: 'bg-white/5 text-white/50 border-white/10',
};

export function StatusBadge({ variant, children }: StatusBadgeProps) {
  return (
    <span
      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${variantStyles[variant]}`}
    >
      {children}
    </span>
  );
}

/** Map common status strings to badge variants */
export function getStatusVariant(status: string): BadgeVariant {
  switch (status) {
    case 'active':
    case 'approved':
    case 'available':
    case 'resolved':
      return 'success';
    case 'pending':
    case 'assigned':
    case 'in_progress':
      return 'warning';
    case 'rejected':
    case 'revoked':
    case 'closed':
      return 'danger';
    case 'redeemed':
      return 'info';
    default:
      return 'neutral';
  }
}
