import { useEffect, useRef, useState } from 'react';
import { motion, useInView } from 'framer-motion';

interface AnimatedCounterProps {
  value: string;
  className?: string;
}

export function AnimatedCounter({ value, className }: AnimatedCounterProps) {
  const ref = useRef<HTMLSpanElement>(null);
  const isInView = useInView(ref, { once: true });
  const [displayed, setDisplayed] = useState(value);

  // Extract numeric part for animation
  const numericMatch = value.match(/([\d.,]+)/);

  useEffect(() => {
    if (!isInView || !numericMatch) {
      setDisplayed(value);
      return;
    }

    const target = parseFloat(numericMatch[1].replace(/\./g, '').replace(',', '.'));
    if (isNaN(target) || target === 0) {
      setDisplayed(value);
      return;
    }

    const duration = 800;
    const startTime = performance.now();

    const animate = (now: number) => {
      const elapsed = now - startTime;
      const progress = Math.min(elapsed / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3); // easeOutCubic
      const current = target * eased;

      const formatted = value.replace(numericMatch[1],
        new Intl.NumberFormat('pt-BR', {
          minimumFractionDigits: numericMatch[1].includes(',') ? 2 : 0,
          maximumFractionDigits: 2,
        }).format(current)
      );
      setDisplayed(formatted);

      if (progress < 1) requestAnimationFrame(animate);
    };

    requestAnimationFrame(animate);
  }, [isInView, value]);

  return (
    <motion.span
      ref={ref}
      className={className}
      initial={{ opacity: 0, y: 8 }}
      animate={isInView ? { opacity: 1, y: 0 } : {}}
      transition={{ duration: 0.4 }}
    >
      {displayed}
    </motion.span>
  );
}
