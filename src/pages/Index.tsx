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
import { useI18n } from '@/lib/i18n';

type DashboardStat = {
  title: string;
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
  const { t, money, locale } = useI18n();
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

  const blockTitle = (id: string, fallback: string) => {
    const titleByBlock: Record<string, string> = {
      savings: t('dashboard.savedMoney'),
      expenses: t('dashboard.monthExpense'),
      income: t('dashboard.receivable'),
      habits: t('dashboard.todayHabits'),
      'daily-progress': t('dashboard.dailyProgress'),
      'savings-goal': t('dashboard.savingsGoal'),
    };
    return titleByBlock[id] ?? fallback;
  };

  const statData: Record<string, DashboardStat> = {
    savings: {
      title: t('dashboard.savedMoney'),
      value: money(savedAmount),
      icon: Wallet,
      subtitle: goalAmount > 0 ? t('dashboard.goalPercent', { value: goalProgress }) : t('dashboard.reserveGoal'),
    },
    expenses: {
      title: t('dashboard.monthExpense'),
      value: money(totalExpenses),
      icon: TrendingDown,
      subtitle: t('dashboard.monthExpenseSubtitle'),
    },
    income: {
      title: t('dashboard.receivable'),
      value: money(totalPending),
      icon: TrendingUp,
      subtitle: t('dashboard.received', { value: money(totalReceived) }),
    },
    habits: {
      title: t('dashboard.todayHabits'),
      value: `${completedToday}/${habitTotal}`,
      icon: Target,
      subtitle: habitTotal > 0 ? t('dashboard.completedToday', { value: habitRate }) : t('dashboard.firstHabit'),
    },
  };

  const insights = [
    netBalance >= 0
      ? {
          title: t('dashboard.positiveFlow'),
          text: t('dashboard.positiveFlowText', { value: money(netBalance) }),
          icon: TrendingUp,
        }
      : {
          title: t('dashboard.adjustNeeded'),
          text: t('dashboard.adjustNeededText', { value: money(Math.abs(netBalance)) }),
          icon: TrendingDown,
        },
    habitTotal > 0
      ? {
          title: t('dashboard.habitRhythm'),
          text: habitRate >= 70
            ? t('dashboard.habitGoodText', { value: habitRate })
            : t('dashboard.habitLowText', { value: habitRate }),
          icon: CheckCircle2,
        }
      : {
          title: t('dashboard.startSimple'),
          text: t('dashboard.startSimpleText'),
          icon: CheckCircle2,
        },
    goalAmount > 0
      ? {
          title: t('dashboard.reserveTarget'),
          text: goalMissing > 0
            ? t('dashboard.reserveMissingText', { value: money(goalMissing) })
            : t('dashboard.reserveDoneText'),
          icon: ShieldCheck,
        }
      : {
          title: t('dashboard.smartReserve'),
          text: t('dashboard.smartReserveText'),
          icon: ShieldCheck,
        },
  ];

  const copilotPrompts: CopilotPrompt[] = [
    { id: 'save', label: t('dashboard.promptSave'), route: '/despesas' },
    { id: 'habit', label: t('dashboard.promptHabit'), route: '/habitos' },
    { id: 'reserve', label: t('dashboard.promptReserve'), route: '/economia' },
  ];

  const getCopilotAnswer = (prompt: CopilotPrompt): CopilotAnswer => {
    if (prompt.id === 'save') {
      if (totalExpenses <= 0) {
        return {
          title: t('dashboard.noExpensesTitle'),
          text: t('dashboard.noExpensesText'),
          actionLabel: t('dashboard.openExpenses'),
          route: prompt.route,
        };
      }

      if (netBalance < 0) {
        return {
          title: t('dashboard.cutExpenseTitle'),
          text: t('dashboard.cutExpenseText', { value: money(Math.abs(netBalance)) }),
          actionLabel: t('dashboard.viewExpenses'),
          route: prompt.route,
        };
      }

      return {
        title: t('dashboard.positiveMarginTitle'),
        text: t('dashboard.positiveMarginText', { value: money(netBalance) }),
        actionLabel: t('dashboard.viewExpenses'),
        route: prompt.route,
      };
    }

    if (prompt.id === 'habit') {
      if (habitTotal <= 0) {
        return {
          title: t('dashboard.createSimpleHabitTitle'),
          text: t('dashboard.createSimpleHabitText'),
          actionLabel: t('dashboard.createHabit'),
          route: prompt.route,
        };
      }

      if (pendingHabit) {
        return {
          title: t('dashboard.prioritize', { name: pendingHabit.name }),
          text: t('dashboard.prioritizeText'),
          actionLabel: t('dashboard.openHabits'),
          route: prompt.route,
        };
      }

      return {
        title: t('dashboard.todayCompleteTitle'),
        text: t('dashboard.todayCompleteText'),
        actionLabel: t('dashboard.viewHabits'),
        route: prompt.route,
      };
    }

    if (goalAmount <= 0) {
      return {
        title: t('dashboard.noReserveGoalTitle'),
        text: t('dashboard.noReserveGoalText', { value: money(savedAmount) }),
        actionLabel: t('dashboard.setGoal'),
        route: prompt.route,
      };
    }

    if (savedAmount >= goalAmount) {
      return {
        title: t('dashboard.reserveAboveTitle'),
        text: t('dashboard.reserveAboveText', { saved: money(savedAmount), goal: money(goalAmount) }),
        actionLabel: t('dashboard.viewSavings'),
        route: prompt.route,
      };
    }

    return {
      title: t('dashboard.reserveProgressTitle'),
      text: t('dashboard.reserveProgressText', {
        saved: money(savedAmount),
        goal: money(goalAmount),
        progress: goalProgress,
        missing: money(goalMissing),
      }),
      actionLabel: t('dashboard.viewSavings'),
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
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, ease: 'easeOut' }}
        className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between"
      >
        <div className="space-y-1">
          <p className="text-xs font-medium text-muted-foreground uppercase tracking-widest">{t('dashboard.eyebrow')}</p>
          <h1 className="text-3xl font-bold font-display text-gradient-silver leading-tight">{t('dashboard.title')}</h1>
          <p className="text-sm text-muted-foreground max-w-2xl">{t('dashboard.subtitle')}</p>
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
                initial={{ opacity: 0, scale: 0.96 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.96 }}
                transition={{ delay: i * 0.07, ease: [0.16, 1, 0.3, 1], duration: 0.4 }}
              >
                <StatCard
                  title={data.title}
                  value={data.value}
                  icon={data.icon}
                  subtitle={data.subtitle}
                  delay={i * 0.07}
                  onClick={block.id === 'savings' ? () => navigate('/economia') : undefined}
                  actionLabel={block.id === 'savings' ? t('dashboard.setGoal') : undefined}
                />
              </motion.div>
            );
          })}
        </AnimatePresence>
      </div>

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
                {t('dashboard.insights')}
              </p>
              <h2 className="text-lg font-semibold font-display text-foreground">
                {t('dashboard.attention')}
              </h2>
            </div>
            <div className="p-2 rounded-xl border border-border/80" style={{ background: 'hsl(var(--brand) / 0.1)' }}>
              <Sparkles className="h-4 w-4" style={{ color: 'hsl(var(--brand))' }} />
            </div>
          </div>

          <div className="grid gap-3 md:grid-cols-3">
            {insights.map((item) => (
              <div key={item.title} className="rounded-xl border border-border/70 bg-secondary/35 p-4">
                <item.icon className="h-4 w-4 mb-3" style={{ color: 'hsl(var(--brand))' }} />
                <h3 className="font-display text-sm font-semibold text-foreground mb-1">{item.title}</h3>
                <p className="text-xs leading-relaxed text-muted-foreground">{item.text}</p>
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
            <div className="p-2 rounded-xl border border-border/80" style={{ background: 'hsl(var(--brand) / 0.1)' }}>
              <MessageCircle className="h-4 w-4" style={{ color: 'hsl(var(--brand))' }} />
            </div>
            <div>
              <p className="text-xs font-medium text-muted-foreground uppercase tracking-widest">{t('dashboard.copilot')}</p>
              <h2 className="text-lg font-semibold font-display text-foreground">MeuBolso</h2>
            </div>
          </div>
          <p className="text-sm text-muted-foreground leading-relaxed mb-4">{t('dashboard.copilotIntro')}</p>
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
                <p className="text-sm font-semibold text-foreground mb-1">{copilotAnswer.title}</p>
                <p className="text-xs leading-relaxed text-muted-foreground mb-3">{copilotAnswer.text}</p>
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
                          {t('dashboard.dailyProgress')}
                        </p>
                        <h2 className="text-base font-semibold font-display text-foreground leading-none">
                          {blockTitle(block.id, block.title)}
                        </h2>
                      </div>
                      <div className="text-right">
                        <span className="text-2xl font-bold font-display text-gradient-silver">{completedToday}</span>
                        <span className="text-muted-foreground text-sm font-medium">/{habitTotal}</span>
                      </div>
                    </div>
                    <ProgressBar value={completedToday} max={habitTotal || 1} label={t('dashboard.completedHabits')} glow />
                    <p className="text-xs text-muted-foreground">
                      {completedToday === habitTotal && habitTotal > 0
                        ? t('dashboard.allHabitsDone')
                        : t('dashboard.remainingHabits', { count: habitTotal - completedToday })}
                    </p>
                  </>
                )}

                {block.id === 'savings-goal' && (
                  <>
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-xs font-medium text-muted-foreground uppercase tracking-widest mb-1">
                          {t('dashboard.savingsGoal')}
                        </p>
                        <h2 className="text-base font-semibold font-display text-foreground leading-none">
                          {blockTitle(block.id, block.title)}
                        </h2>
                      </div>
                      {savings?.goal_date && (
                        <span className="text-xs text-muted-foreground bg-secondary px-2.5 py-1 rounded-lg border border-border/60">
                          {new Date(savings.goal_date + 'T00:00:00').toLocaleDateString(locale, { month: 'short', year: 'numeric' })}
                        </span>
                      )}
                    </div>
                    <ProgressBar
                      value={Number(savings?.total_saved ?? 0)}
                      max={Number(savings?.goal_amount ?? 1)}
                      label={`${money(Number(savings?.total_saved ?? 0))} / ${money(Number(savings?.goal_amount ?? 0))}`}
                      glow
                    />
                    <p className="text-xs text-muted-foreground">
                      {savings?.goal_amount
                        ? t('dashboard.reserveMissingText', { value: money(Math.max(0, Number(savings.goal_amount) - Number(savings.total_saved ?? 0))) })
                        : t('dashboard.reserveGoal')}
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
