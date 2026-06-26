import { useState } from 'react';
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
import { useNavigate } from 'react-router-dom';
import { localDateString } from '@/lib/dates';
import { useToast } from '@/hooks/use-toast';

const formatCurrency = (value: number) =>
  new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);

type DashboardStat = {
  value: string;
  icon: LucideIcon;
  subtitle?: string;
};

type CopilotPrompt = {
  id: 'save' | 'habit' | 'reserve';
  label: string;
  route: string;
};

type CopilotAnswer = {
  title: string;
  text: string;
  actionLabel: string;
  route: string;
};

const Index = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [copilotAnswer, setCopilotAnswer] = useState<CopilotAnswer | null>(null);
  const { blocks } = useDashboardLayout();
  const { total: totalExpenses } = useExpenses();
  const { savings } = useSavings();
  const { totalPending, totalReceived } = useIncome();
  const { habits, completions } = useHabits();

  const today = localDateString();
  const completedToday = habits.filter(h =>
    completions.some(c => c.habit_id === h.id && c.completed_date === today)
  ).length;
  const pendingHabit = habits.find(h =>
    !completions.some(c => c.habit_id === h.id && c.completed_date === today)
  );

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
  const copilotPrompts: CopilotPrompt[] = [
    {
      id: 'save',
      label: 'Como posso economizar mais este mês?',
      route: '/despesas',
    },
    {
      id: 'habit',
      label: 'Qual hábito devo priorizar hoje?',
      route: '/habitos',
    },
    {
      id: 'reserve',
      label: 'Minha reserva está no ritmo certo?',
      route: '/economia',
    },
  ];

  const getCopilotAnswer = (prompt: CopilotPrompt): CopilotAnswer => {
    if (prompt.id === 'save') {
      if (totalExpenses <= 0) {
        return {
          title: 'Ainda nao tenho gastos para analisar',
          text: 'Registre algumas despesas pelo WhatsApp ou pela tela de despesas. Depois eu consigo apontar onde cortar primeiro.',
          actionLabel: 'Abrir despesas',
          route: prompt.route,
        };
      }

      if (netBalance < 0) {
        return {
          title: 'Corte um gasto variavel primeiro',
          text: `Suas despesas passaram as receitas recebidas em ${formatCurrency(Math.abs(netBalance))}. Comece revendo mercado, delivery, cartao e compras pequenas do mes.`,
          actionLabel: 'Ver despesas',
          route: prompt.route,
        };
      }

      return {
        title: 'Voce ainda tem margem positiva',
        text: `Sua margem atual e ${formatCurrency(netBalance)}. Para economizar mais, escolha um limite pequeno para gastos variaveis ate o fim do mes.`,
        actionLabel: 'Ver despesas',
        route: prompt.route,
      };
    }

    if (prompt.id === 'habit') {
      if (habitTotal <= 0) {
        return {
          title: 'Crie um habito bem simples',
          text: 'Comece com uma acao de ate 5 minutos, como ler 1 pagina, caminhar 500 metros ou beber agua.',
          actionLabel: 'Criar habito',
          route: prompt.route,
        };
      }

      if (pendingHabit) {
        return {
          title: `Priorize: ${pendingHabit.name}`,
          text: 'Esse e o proximo habito pendente de hoje. Faca uma versao pequena agora e marque como concluido.',
          actionLabel: 'Abrir habitos',
          route: prompt.route,
        };
      }

      return {
        title: 'Rotina de hoje completa',
        text: 'Todos os habitos de hoje foram concluidos. Mantenha o ritmo e evite criar coisa demais de uma vez.',
        actionLabel: 'Ver habitos',
        route: prompt.route,
      };
    }

    if (goalAmount <= 0) {
      return {
        title: 'Sua reserva ainda nao tem meta',
        text: `Voce tem ${formatCurrency(savedAmount)} guardado. Defina uma meta para eu conseguir acompanhar se a reserva esta no ritmo certo.`,
        actionLabel: 'Definir meta',
        route: prompt.route,
      };
    }

    if (savedAmount >= goalAmount) {
      return {
        title: 'Reserva acima da meta',
        text: `Voce tem ${formatCurrency(savedAmount)} guardado e a meta era ${formatCurrency(goalAmount)}. Agora vale criar a proxima camada da reserva.`,
        actionLabel: 'Ver economia',
        route: prompt.route,
      };
    }

    return {
      title: 'Reserva em andamento',
      text: `Voce tem ${formatCurrency(savedAmount)} de ${formatCurrency(goalAmount)} (${goalProgress}%). Faltam ${formatCurrency(goalMissing)} para completar a meta.`,
      actionLabel: 'Ver economia',
      route: prompt.route,
    };
  };

  const handleCopilotPrompt = (prompt: CopilotPrompt) => {
    const answer = getCopilotAnswer(prompt);
    setCopilotAnswer(answer);
    toast({
      title: answer.title,
      description: answer.text,
    });
  };

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
                  onClick={block.id === 'savings' ? () => navigate('/economia') : undefined}
                  actionLabel={block.id === 'savings' ? 'Clique para alterar' : undefined}
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
                key={prompt.label}
                type="button"
                onClick={() => handleCopilotPrompt(prompt)}
                className="w-full flex items-center justify-between gap-3 rounded-xl border border-border/70 bg-secondary/35 px-4 py-3 text-left text-sm text-foreground hover:border-silver/25 hover:bg-secondary/70"
              >
                <span>{prompt.label}</span>
                <ArrowRight className="h-4 w-4 text-muted-foreground shrink-0" />
              </button>
            ))}
          </div>
          <AnimatePresence mode="wait">
            {copilotAnswer && (
              <motion.div
                key={copilotAnswer.title}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                transition={{ duration: 0.2 }}
                className="mt-4 rounded-xl border border-border/70 bg-secondary/45 p-4"
              >
                <p className="text-sm font-semibold text-foreground mb-1">
                  {copilotAnswer.title}
                </p>
                <p className="text-xs leading-relaxed text-muted-foreground mb-3">
                  {copilotAnswer.text}
                </p>
                <button
                  type="button"
                  onClick={() => navigate(copilotAnswer.route)}
                  className="inline-flex items-center gap-2 rounded-lg border border-border/70 bg-background/60 px-3 py-2 text-xs font-medium text-foreground hover:bg-secondary"
                >
                  {copilotAnswer.actionLabel}
                  <ArrowRight className="h-3.5 w-3.5" />
                </button>
              </motion.div>
            )}
          </AnimatePresence>
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
