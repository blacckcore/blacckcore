import { motion, AnimatePresence } from 'framer-motion';
import {
  ArrowRight,
  CheckCircle2,
  type LucideIcon,
  MessageCircle,
  ShieldCheck,
  Sparkles,
  Wallet,
  TrendingDown,
  TrendingUp,
  Target,
} from 'lucide-react';
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

type DashboardStat = {
  value: string;
  icon: LucideIcon;
  subtitle?: string;
};

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
  const habitTotal = habits.length || 0;
  const habitRate = habitTotal > 0 ? Math.round((completedToday / habitTotal) * 100) : 0;
  const savedAmount = Number(savings?.total_saved ?? 0);
  const goalAmount = Number(savings?.goal_amount ?? 0);
  const goalProgress = goalAmount > 0 ? Math.min(100, Math.round((savedAmount / goalAmount) * 100)) : 0;
  const goalMissing = Math.max(0, goalAmount - savedAmount);
  const netBalance = totalReceived - totalExpenses;
  const monthlyStatus = netBalance >= 0 ? 'positivo' : 'em atenção';

  const statData: Record<string, DashboardStat> = {
    savings: {
      value: formatCurrency(savedAmount),
      icon: Wallet,
      subtitle: goalAmount > 0 ? `${goalProgress}% da meta` : 'Defina uma meta de reserva',
    },
    expenses: {
      value: formatCurrency(totalExpenses),
      icon: TrendingDown,
      subtitle: 'Gasto registrado neste mês',
    },
    income: {
      value: formatCurrency(totalPending),
      icon: TrendingUp,
      subtitle: `${formatCurrency(totalReceived)} recebido`,
    },
    habits: {
      value: `${completedToday}/${habitTotal}`,
      icon: Target,
      subtitle: habitTotal > 0 ? `${habitRate}% concluído hoje` : 'Crie seu primeiro hábito',
    },
  };

  const insights = [
    netBalance >= 0
      ? {
          title: 'Fluxo positivo',
          text: `Você está com ${formatCurrency(netBalance)} de margem entre receitas recebidas e despesas.`,
          icon: TrendingUp,
        }
      : {
          title: 'Ajuste necessário',
          text: `Suas despesas passaram as receitas em ${formatCurrency(Math.abs(netBalance))}. Corte um gasto variável primeiro.`,
          icon: TrendingDown,
        },
    habitTotal > 0
      ? {
          title: 'Ritmo de hábitos',
          text: habitRate >= 70
            ? `Você concluiu ${habitRate}% da rotina de hoje. Mantenha o bloco principal intacto.`
            : `Você concluiu ${habitRate}% da rotina de hoje. Escolha um hábito pequeno para destravar agora.`,
          icon: CheckCircle2,
        }
      : {
          title: 'Comece simples',
          text: 'Cadastre 3 hábitos: sono, treino e planejamento. O dashboard fica útil em poucos dias.',
          icon: CheckCircle2,
        },
    goalAmount > 0
      ? {
          title: 'Meta de reserva',
          text: goalMissing > 0
            ? `Faltam ${formatCurrency(goalMissing)} para fechar sua meta de economia.`
            : 'Sua meta de economia foi alcançada. Crie a próxima camada da reserva.',
          icon: ShieldCheck,
        }
      : {
          title: 'Reserva inteligente',
          text: 'Defina uma meta de economia para acompanhar prazo, progresso e valor restante.',
          icon: ShieldCheck,
        },
  ];

  const copilotPrompts = [
    'Como posso economizar mais este mês?',
    'Qual hábito devo priorizar hoje?',
    'Minha reserva está no ritmo certo?',
  ];

  return (
    <div className="space-y-10">
      {/* Page header */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, ease: 'easeOut' }}
        className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between"
      >
        <div className="space-y-1">
          <p className="text-xs font-medium text-muted-foreground uppercase tracking-widest">Centro de comando</p>
          <h1 className="text-3xl font-bold font-display text-gradient-silver leading-tight">Bom te ver no BlacckCore</h1>
          <p className="text-sm text-muted-foreground max-w-2xl">
            Seu mês está {monthlyStatus}. Veja dinheiro, hábitos e metas juntos para decidir o próximo passo sem ruído.
          </p>
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

      {/* Intelligence layer */}
      <div className="grid grid-cols-1 xl:grid-cols-[1.3fr_0.7fr] gap-5">
        <motion.section
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2, duration: 0.45, ease: [0.16, 1, 0.3, 1] }}
          className="glass-card card-highlight p-6"
        >
          <div className="flex items-start justify-between gap-4 mb-5">
            <div>
              <p className="text-xs font-medium text-muted-foreground uppercase tracking-widest mb-1">
                Insights inteligentes
              </p>
              <h2 className="text-lg font-semibold font-display text-foreground">
                O que merece sua atenção agora
              </h2>
            </div>
            <div
              className="p-2 rounded-xl border border-border/80"
              style={{ background: 'hsl(var(--brand) / 0.1)' }}
            >
              <Sparkles className="h-4 w-4" style={{ color: 'hsl(var(--brand))' }} />
            </div>
          </div>

          <div className="grid gap-3 md:grid-cols-3">
            {insights.map((item) => (
              <div
                key={item.title}
                className="rounded-xl border border-border/70 bg-secondary/35 p-4"
              >
                <item.icon className="h-4 w-4 mb-3" style={{ color: 'hsl(var(--brand))' }} />
                <h3 className="font-display text-sm font-semibold text-foreground mb-1">
                  {item.title}
                </h3>
                <p className="text-xs leading-relaxed text-muted-foreground">
                  {item.text}
                </p>
              </div>
            ))}
          </div>
        </motion.section>

        <motion.section
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.28, duration: 0.45, ease: [0.16, 1, 0.3, 1] }}
          className="glass-card card-highlight p-6"
        >
          <div className="flex items-center gap-3 mb-5">
            <div
              className="p-2 rounded-xl border border-border/80"
              style={{ background: 'hsl(var(--brand) / 0.1)' }}
            >
              <MessageCircle className="h-4 w-4" style={{ color: 'hsl(var(--brand))' }} />
            </div>
            <div>
              <p className="text-xs font-medium text-muted-foreground uppercase tracking-widest">
                Copiloto
              </p>
              <h2 className="text-lg font-semibold font-display text-foreground">
                BlacckCore
              </h2>
            </div>
          </div>
          <p className="text-sm text-muted-foreground leading-relaxed mb-4">
            Use as perguntas prontas para transformar os dados do painel em uma próxima ação.
          </p>
          <div className="space-y-2">
            {copilotPrompts.map((prompt) => (
              <button
                key={prompt}
                type="button"
                className="w-full flex items-center justify-between gap-3 rounded-xl border border-border/70 bg-secondary/35 px-4 py-3 text-left text-sm text-foreground hover:border-silver/25 hover:bg-secondary/70"
              >
                <span>{prompt}</span>
                <ArrowRight className="h-4 w-4 text-muted-foreground shrink-0" />
              </button>
            ))}
          </div>
        </motion.section>
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
                          /{habitTotal}
                        </span>
                      </div>
                    </div>
                    <ProgressBar
                      value={completedToday}
                      max={habitTotal || 1}
                      label="Hábitos completados"
                      glow
                    />
                    <p className="text-xs text-muted-foreground">
                      {completedToday === habitTotal && habitTotal > 0
                        ? 'Todos os hábitos foram completados hoje.'
                        : `${habitTotal - completedToday} hábito${habitTotal - completedToday !== 1 ? 's' : ''} restante${habitTotal - completedToday !== 1 ? 's' : ''}`}
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
