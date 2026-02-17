import { motion } from 'framer-motion';
import { Wallet, TrendingDown, TrendingUp, Target } from 'lucide-react';
import { StatCard } from '@/components/StatCard';
import { ProgressBar } from '@/components/ProgressBar';
import { useExpenses } from '@/hooks/useExpenses';
import { useSavings } from '@/hooks/useSavings';
import { useIncome } from '@/hooks/useIncome';
import { useHabits } from '@/hooks/useHabits';

const formatCurrency = (value: number) =>
  new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);

const Index = () => {
  const { total: totalExpenses } = useExpenses();
  const { savings } = useSavings();
  const { totalPending, totalReceived } = useIncome();
  const { habits, completions } = useHabits();

  const today = new Date().toISOString().split('T')[0];
  const completedToday = habits.filter(h =>
    completions.some(c => c.habit_id === h.id && c.completed_date === today)
  ).length;
  const habitProgress = habits.length > 0 ? (completedToday / habits.length) * 100 : 0;

  const savingsProgress = savings?.goal_amount
    ? (Number(savings.total_saved) / Number(savings.goal_amount)) * 100
    : 0;

  return (
    <div className="space-y-8">
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.5 }}
      >
        <h1 className="text-3xl font-bold font-display text-gradient-silver mb-1">
          Dashboard
        </h1>
        <p className="text-muted-foreground text-sm">
          Visão geral das suas finanças e produtividade
        </p>
      </motion.div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Dinheiro Guardado"
          value={formatCurrency(Number(savings?.total_saved ?? 0))}
          icon={Wallet}
          delay={0}
        />
        <StatCard
          title="Gasto no Mês"
          value={formatCurrency(totalExpenses)}
          icon={TrendingDown}
          delay={0.1}
        />
        <StatCard
          title="A Receber"
          value={formatCurrency(totalPending)}
          icon={TrendingUp}
          subtitle={`${formatCurrency(totalReceived)} recebido`}
          delay={0.2}
        />
        <StatCard
          title="Hábitos Hoje"
          value={`${completedToday}/${habits.length}`}
          icon={Target}
          delay={0.3}
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="glass-card p-6 space-y-4"
        >
          <h2 className="text-lg font-semibold font-display text-foreground">
            Progresso Diário
          </h2>
          <ProgressBar
            value={completedToday}
            max={habits.length || 1}
            label="Hábitos completados"
          />
          <div className="text-sm text-muted-foreground">
            {completedToday === habits.length && habits.length > 0
              ? '🎯 Todos os hábitos completados!'
              : `Faltam ${habits.length - completedToday} hábitos`}
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="glass-card p-6 space-y-4"
        >
          <h2 className="text-lg font-semibold font-display text-foreground">
            Meta de Economia
          </h2>
          <ProgressBar
            value={Number(savings?.total_saved ?? 0)}
            max={Number(savings?.goal_amount ?? 1)}
            label={`${formatCurrency(Number(savings?.total_saved ?? 0))} de ${formatCurrency(Number(savings?.goal_amount ?? 0))}`}
          />
          {savings?.goal_date && (
            <div className="text-sm text-muted-foreground">
              Meta até: {new Date(savings.goal_date + 'T00:00:00').toLocaleDateString('pt-BR')}
            </div>
          )}
        </motion.div>
      </div>
    </div>
  );
};

export default Index;
