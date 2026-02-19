import { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Wallet, TrendingDown, TrendingUp, Target } from 'lucide-react';
import { StatCard } from '@/components/StatCard';
import { ProgressBar } from '@/components/ProgressBar';
import { DashboardCustomizer } from '@/components/DashboardCustomizer';
import { useDashboardLayout } from '@/hooks/useDashboardLayout';
import { useExpenses } from '@/hooks/useExpenses';
import { useSavings } from '@/hooks/useSavings';
import { useIncome } from '@/hooks/useIncome';
import { useHabits } from '@/hooks/useHabits';

const formatCurrency = (value: number) =>
  new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);

const ICON_MAP: Record<string, any> = { Wallet, TrendingDown, TrendingUp, Target };

const Index = () => {
  const { blocks } = useDashboardLayout();
  const { total: totalExpenses } = useExpenses();
  const { savings } = useSavings();
  const { totalPending, totalReceived } = useIncome();
  const { habits, completions } = useHabits();

  const today = new Date().toISOString().split('T')[0];
  const completedToday = habits.filter(h =>
    completions.some(c => c.habit_id === h.id && c.completed_date === today)
  ).length;

  const visibleBlocks = blocks.filter(b => b.visible);
  const statBlocks = visibleBlocks.filter(b => ['savings', 'expenses', 'income', 'habits'].includes(b.id));
  const bottomBlocks = visibleBlocks.filter(b => ['daily-progress', 'savings-goal'].includes(b.id));

  const statData: Record<string, { value: string; icon: any; subtitle?: string }> = {
    savings: { value: formatCurrency(Number(savings?.total_saved ?? 0)), icon: Wallet },
    expenses: { value: formatCurrency(totalExpenses), icon: TrendingDown },
    income: { value: formatCurrency(totalPending), icon: TrendingUp, subtitle: `${formatCurrency(totalReceived)} recebido` },
    habits: { value: `${completedToday}/${habits.length}`, icon: Target },
  };

  return (
    <div className="space-y-8">
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.5 }}
        className="flex items-center justify-between"
      >
        <div>
          <h1 className="text-3xl font-bold font-display text-gradient-silver mb-1">Dashboard</h1>
          <p className="text-muted-foreground text-sm">Visão geral das suas finanças e produtividade</p>
        </div>
        <DashboardCustomizer />
      </motion.div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <AnimatePresence mode="popLayout">
          {statBlocks.map((block, i) => {
            const data = statData[block.id];
            if (!data) return null;
            return (
              <motion.div
                key={block.id}
                layout
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9 }}
                transition={{ delay: i * 0.08 }}
              >
                <StatCard
                  title={block.title}
                  value={data.value}
                  icon={data.icon}
                  subtitle={data.subtitle}
                  delay={i * 0.08}
                />
              </motion.div>
            );
          })}
        </AnimatePresence>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <AnimatePresence mode="popLayout">
          {bottomBlocks.map((block, i) => (
            <motion.div
              key={block.id}
              layout
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ delay: 0.3 + i * 0.1 }}
              whileHover={{ scale: 1.01 }}
              className="glass-card p-6 space-y-4 hover:shadow-[0_0_30px_hsl(var(--glow-silver))] transition-shadow duration-500"
            >
              {block.id === 'daily-progress' && (
                <>
                  <h2 className="text-lg font-semibold font-display text-foreground">{block.title}</h2>
                  <ProgressBar
                    value={completedToday}
                    max={habits.length || 1}
                    label="Hábitos completados"
                    glow
                  />
                  <div className="text-sm text-muted-foreground">
                    {completedToday === habits.length && habits.length > 0
                      ? '🎯 Todos os hábitos completados!'
                      : `Faltam ${habits.length - completedToday} hábitos`}
                  </div>
                </>
              )}
              {block.id === 'savings-goal' && (
                <>
                  <h2 className="text-lg font-semibold font-display text-foreground">{block.title}</h2>
                  <ProgressBar
                    value={Number(savings?.total_saved ?? 0)}
                    max={Number(savings?.goal_amount ?? 1)}
                    label={`${formatCurrency(Number(savings?.total_saved ?? 0))} de ${formatCurrency(Number(savings?.goal_amount ?? 0))}`}
                    glow
                  />
                  {savings?.goal_date && (
                    <div className="text-sm text-muted-foreground">
                      Meta até: {new Date(savings.goal_date + 'T00:00:00').toLocaleDateString('pt-BR')}
                    </div>
                  )}
                </>
              )}
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </div>
  );
};

export default Index;
