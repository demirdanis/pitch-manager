import { cn } from '@/utils';

interface BadgeProps {
  children: React.ReactNode;
  variant?: 'green' | 'red' | 'yellow' | 'blue' | 'slate' | 'gold';
  className?: string;
}

export function Badge({ children, variant = 'slate', className }: BadgeProps) {
  const variants = {
    green: 'bg-green-500/20 text-green-400 border-green-500/30',
    red: 'bg-red-500/20 text-red-400 border-red-500/30',
    yellow: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30',
    blue: 'bg-blue-500/20 text-blue-400 border-blue-500/30',
    slate: 'bg-slate-700/60 text-slate-300 border-slate-600',
    gold: 'bg-yellow-400/20 text-yellow-300 border-yellow-400/40',
  };

  return (
    <span
      className={cn(
        'inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold border',
        variants[variant],
        className
      )}
    >
      {children}
    </span>
  );
}
