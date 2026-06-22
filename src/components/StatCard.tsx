import { motion } from 'framer-motion';
import { LucideIcon } from 'lucide-react';
import { AnimatedCounter } from './AnimatedCounter';

interface StatCardProps {
  title: string;
  value: string;
  icon: LucideIcon;
  subtitle?: string;
  trend?: 'up' | 'down' | 'neutral';
  delay?: number;
  expandedContent?: React.ReactNode;
  onClick?: () => void;
  actionLabel?: string;
}

export function StatCard({ title, value, icon: Icon, subtitle, delay = 0, expandedContent, onClick, actionLabel }: StatCardProps) {
  return (
    <motion.div
      role={onClick ? 'button' : undefined}
      tabIndex={onClick ? 0 : undefined}
      onClick={onClick}
      onKeyDown={(event) => {
        if (!onClick) return;
        if (event.key === 'Enter' || event.key === ' ') {
          event.preventDefault();
          onClick();
        }
      }}
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.45, delay, ease: [0.16, 1, 0.3, 1] }}
      whileHover={{ y: -3, transition: { duration: 0.25, ease: 'easeOut' } }}
      className={`glass-card card-highlight p-6 group ${onClick ? 'cursor-pointer focus:outline-none focus:ring-2 focus:ring-silver/30' : 'cursor-default'}`}
    >
      {/* Header row */}
      <div className="flex items-start justify-between gap-3 mb-4">
        <p className="text-xs font-medium text-muted-foreground uppercase tracking-widest leading-none pt-0.5">
          {title}
        </p>
        <div className="p-2 rounded-xl gradient-silver-subtle border border-border/80 group-hover:border-silver/20 transition-colors duration-300 shrink-0">
          <Icon className="h-3.5 w-3.5 text-silver group-hover:text-silver-light transition-colors duration-300" />
        </div>
      </div>

      {/* Value */}
      <AnimatedCounter
        value={value}
        className="text-2xl font-bold font-display text-foreground tracking-tight leading-none block mb-1.5"
      />

      {/* Subtitle */}
      {subtitle && (
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: delay + 0.25 }}
          className="text-xs text-muted-foreground leading-relaxed"
        >
          {subtitle}
        </motion.p>
      )}

      {actionLabel && (
        <p className="mt-3 text-xs font-medium text-foreground/80 group-hover:text-foreground">
          {actionLabel}
        </p>
      )}

      {/* Expanded content */}
      {expandedContent && (
        <motion.div
          initial={{ height: 0, opacity: 0 }}
          animate={{ height: 'auto', opacity: 1 }}
          className="mt-4 pt-4 border-t border-border/60"
        >
          {expandedContent}
        </motion.div>
      )}
    </motion.div>
  );
}
