import { motion } from 'framer-motion';
import { Target, TrendingUp, Calendar, Award } from 'lucide-react';
import { StatCard } from '@/components/StatCard';
import { ProgressBar } from '@/components/ProgressBar';
import { useSavings } from '@/hooks/useSavings';
import { useHabits } from '@/hooks/useHabits';
import { useExpenses } from '@/hooks/useExpenses';

export default function Goals() {
  const { savings } = useSavings();
  const { habits, completions } = useHabits();
  const { total: monthlyExpenses } = useExpenses();

  const now = new Date();
  const daysPassed = now.getDate();
  const daysInMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();

  // Consistent days this month
  const consistentDays = (() => {
    let count = 0;
    for (let d = 1; d <= daysPassed; d++) {
      const dateStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
      const allDone = habits.length > 0 && habits.every(h =>
        completions.some(c => c.habit_id === h.id && c.completed_date === dateStr)
      );
      if (allDone) count++;
    }
    return count;
  })();

  const savedAmount = Number(savings?.total_saved ?? 0);
  const goalAmount = Number(savings?.goal_amount ?? 0);

  return (
    <div className="space-y-6">
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
        <h1 className="text-3xl font-bold font-display text-gradient-silver">Metas do Mês</h1>
        <p className="text-muted-foreground text-sm">{now.toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' })}</p>
      </motion.div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard title="Economizado" value={`R$ ${savedAmount.toFixed(0)}`} icon={TrendingUp} delay={0} />
        <StatCard title="Dias Consistentes" value={`${consistentDays}/${daysPassed}`} icon={Calendar} delay={0.1} />
        <StatCard title="Hábitos Ativos" value={String(habits.length)} icon={Target} delay={0.2} />
        <StatCard title="Score" value={`${habits.length > 0 ? Math.round((consistentDays / daysPassed) * 100) : 0}%`} icon={Award} delay={0.3} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }} className="glass-card p-6 space-y-4">
          <h2 className="text-lg font-semibold font-display">Progresso Economia</h2>
          <ProgressBar value={savedAmount} max={goalAmount || 1} label="Meta de economia" />
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.5 }} className="glass-card p-6 space-y-4">
          <h2 className="text-lg font-semibold font-display">Consistência</h2>
          <ProgressBar value={consistentDays} max={daysInMonth} label={`${consistentDays} de ${daysInMonth} dias`} />
        </motion.div>
      </div>
    </div>
  );
}
