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
}

export function StatCard({ title, value, icon: Icon, subtitle, delay = 0, expandedContent }: StatCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay }}
      whileHover={{ scale: 1.02, y: -2 }}
      className="glass-card p-5 hover:border-silver-dark/30 transition-all duration-300 group cursor-default hover:shadow-[0_0_30px_hsl(var(--glow-silver))]"
    >
      <div className="flex items-start justify-between">
        <div className="flex-1 min-w-0">
          <p className="text-sm text-muted-foreground mb-1">{title}</p>
          <AnimatedCounter
            value={value}
            className="text-2xl font-bold font-display text-foreground truncate block"
          />
          {subtitle && (
            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: delay + 0.3 }}
              className="text-xs text-muted-foreground mt-1"
            >
              {subtitle}
            </motion.p>
          )}
        </div>
        <motion.div
          className="p-2 rounded-lg bg-accent group-hover:bg-accent/80 transition-colors"
          whileHover={{ rotate: 12 }}
          transition={{ type: 'spring', stiffness: 300 }}
        >
          <Icon className="h-5 w-5 text-silver group-hover:text-silver-light transition-colors" />
        </motion.div>
      </div>
      {expandedContent && (
        <motion.div
          initial={{ height: 0, opacity: 0 }}
          animate={{ height: 'auto', opacity: 1 }}
          className="mt-3 pt-3 border-t border-border/50"
        >
          {expandedContent}
        </motion.div>
      )}
    </motion.div>
  );
}
