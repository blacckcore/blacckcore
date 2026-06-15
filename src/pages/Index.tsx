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
    income: {
      value: formatCurrency(totalPending),
      icon: TrendingUp,
      subtitle: `${formatCurrency(totalReceived)} recebido`,
    },
    habits: { value: `${completedToday}/${habits.length}`, icon: Target },
  };

  return (
    <div className="space-y-10">
      {/* Page header */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, ease: 'easeOut' }}
        className="flex items-end justify-between gap-4"
      >
        <div className="space-y-1">
          <p className="text-xs font-medium text-muted-foreground uppercase tracking-widest">Visão geral</p>
          <h1 className="text-3xl font-bold font-display text-gradient-silver leading-none">Dashboard Financeiro</h1>
        </div>
        <DashboardCustomizer />
      </motion.div>

      {/* Stat cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <AnimatePresence mode="popLayout">
          {statBlocks.map((block, i) => {
            const data = statData[block.id];
            if (!data) return null;
            return (
              <motion.div
                key={block.id}
                layout
                initial={{ opacity: 0, scale: 0.96 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.96 }}
                transition={{ delay: i * 0.07, ease: [0.16, 1, 0.3, 1], duration: 0.4 }}
              >
                <StatCard
                  title={block.title}
                  value={data.value}
                  icon={data.icon}
                  subtitle={data.subtitle}
                  delay={i * 0.07}
                />
              </motion.div>
            );
          })}
        </AnimatePresence>
      </div>

      {/* Bottom blocks */}
      {bottomBlocks.length > 0 && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
          <AnimatePresence mode="popLayout">
            {bottomBlocks.map((block, i) => (
              <motion.div
                key={block.id}
                layout
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -12 }}
                transition={{ delay: 0.28 + i * 0.1, ease: [0.16, 1, 0.3, 1], duration: 0.45 }}
                whileHover={{ y: -3, transition: { duration: 0.25 } }}
                className="glass-card card-highlight p-6 space-y-5"
              >
                {block.id === 'daily-progress' && (
                  <>
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-xs font-medium text-muted-foreground uppercase tracking-widest mb-1">
                          Progresso
                        </p>
                        <h2 className="text-base font-semibold font-display text-foreground leading-none">
                          {block.title}
                        </h2>
                      </div>
                      <div className="text-right">
                        <span className="text-2xl font-bold font-display text-gradient-silver">
                          {completedToday}
                        </span>
                        <span className="text-muted-foreground text-sm font-medium">
                          /{habits.length}
                        </span>
                      </div>
                    </div>
                    <ProgressBar
                      value={completedToday}
                      max={habits.length || 1}
                      label="Hábitos completados"
                      glow
                    />
                    <p className="text-xs text-muted-foreground">
                      {completedToday === habits.length && habits.length > 0
                        ? '🎯 Todos os hábitos completados hoje!'
                        : `${habits.length - completedToday} hábito${habits.length - completedToday !== 1 ? 's' : ''} restante${habits.length - completedToday !== 1 ? 's' : ''}`}
                    </p>
                  </>
                )}

                {block.id === 'savings-goal' && (
                  <>
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-xs font-medium text-muted-foreground uppercase tracking-widest mb-1">
                          Poupança
                        </p>
                        <h2 className="text-base font-semibold font-display text-foreground leading-none">
                          {block.title}
                        </h2>
                      </div>
                      {savings?.goal_date && (
                        <span className="text-xs text-muted-foreground bg-secondary px-2.5 py-1 rounded-lg border border-border/60">
                          {new Date(savings.goal_date + 'T00:00:00').toLocaleDateString('pt-BR', { month: 'short', year: 'numeric' })}
                        </span>
                      )}
                    </div>
                    <ProgressBar
                      value={Number(savings?.total_saved ?? 0)}
                      max={Number(savings?.goal_amount ?? 1)}
                      label={`${formatCurrency(Number(savings?.total_saved ?? 0))} de ${formatCurrency(Number(savings?.goal_amount ?? 0))}`}
                      glow
                    />
                    <p className="text-xs text-muted-foreground">
                      {savings?.goal_amount
                        ? `Faltam ${formatCurrency(Math.max(0, Number(savings.goal_amount) - Number(savings.total_saved ?? 0)))} para atingir a meta`
                        : 'Defina uma meta de poupança'}
                    </p>
                  </>
                )}
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      )}
    </div>
  );
};

export default Index;
