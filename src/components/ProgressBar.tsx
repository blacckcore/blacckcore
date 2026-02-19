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
    <div className="space-y-2">
      {(label || showPercentage) && (
        <div className="flex justify-between text-sm">
          {label && <span className="text-muted-foreground">{label}</span>}
          {showPercentage && (
            <span className="text-silver font-medium">{percentage.toFixed(0)}%</span>
          )}
        </div>
      )}
      <div className="h-2.5 bg-secondary rounded-full overflow-hidden relative">
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: `${percentage}%` }}
          transition={{ duration: 1.2, ease: [0.16, 1, 0.3, 1] }}
          className="h-full gradient-silver rounded-full relative"
        >
          {glow && (
            <motion.div
              className="absolute inset-0 rounded-full"
              style={{ boxShadow: '0 0 12px hsl(var(--glow-silver)), 0 0 24px hsl(var(--glow-silver))' }}
              animate={{ opacity: [0.5, 1, 0.5] }}
              transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
            />
          )}
        </motion.div>
      </div>
    </div>
  );
}
