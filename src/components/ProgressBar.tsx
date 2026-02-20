import { motion } from 'framer-motion';

interface ProgressBarProps {
  value: number;
  max: number;
  label?: string;
  showPercentage?: boolean;
  glow?: boolean;
}

export function ProgressBar({ value, max, label, showPercentage = true, glow = false }: ProgressBarProps) {
  const percentage = max > 0 ? Math.min((value / max) * 100, 100) : 0;

  return (
    <div className="space-y-2.5">
      {(label || showPercentage) && (
        <div className="flex justify-between items-center">
          {label && (
            <span className="text-xs text-muted-foreground font-medium leading-none">{label}</span>
          )}
          {showPercentage && (
            <span className="text-xs font-semibold text-silver tabular-nums">{percentage.toFixed(0)}%</span>
          )}
        </div>
      )}

      {/* Track */}
      <div className="h-1.5 bg-secondary/80 rounded-full overflow-hidden relative">
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: `${percentage}%` }}
          transition={{ duration: 1.4, ease: [0.16, 1, 0.3, 1] }}
          className="h-full gradient-silver rounded-full relative"
        >
          {glow && percentage > 0 && (
            <motion.div
              className="absolute inset-0 rounded-full"
              style={{
                boxShadow: '0 0 8px hsl(var(--glow-silver-strong)), 0 0 20px hsl(var(--glow-silver))',
              }}
              animate={{ opacity: [0.6, 1, 0.6] }}
              transition={{ duration: 2.5, repeat: Infinity, ease: 'easeInOut' }}
            />
          )}
        </motion.div>
      </div>
    </div>
  );
}
