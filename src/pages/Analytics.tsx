import { motion } from 'framer-motion';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { FeatureGate } from '@/components/FeatureGate';
import { useExpenses } from '@/hooks/useExpenses';
import { useExpenseTypes } from '@/hooks/useExpenseTypes';
import { useIncome } from '@/hooks/useIncome';
import { useIncomeTypes } from '@/hooks/useIncomeTypes';
import { useHabits } from '@/hooks/useHabits';
import { useI18n } from '@/lib/i18n';

const COLORS = ['hsl(0,0%,75%)', 'hsl(0,0%,60%)', 'hsl(0,0%,45%)', 'hsl(0,0%,35%)', 'hsl(142,70%,45%)', 'hsl(38,92%,50%)'];

const tooltipStyle = {
  backgroundColor: 'hsl(0,0%,8%)',
  border: '1px solid hsl(0,0%,16%)',
  borderRadius: '8px',
  color: 'hsl(0,0%,90%)',
};

export default function Analytics() {
  const { t, money } = useI18n();
  const { expenses } = useExpenses();
  const { expenseTypes } = useExpenseTypes();
  const { income, totalReceived, totalPending } = useIncome();
  const { habits, completions } = useHabits();
  const { incomeTypes } = useIncomeTypes();

  const expensesByType = expenseTypes
    .map((type) => {
      const total = expenses
        .filter((expense: any) => expense.expense_type_id === type.id)
        .reduce((sum, expense) => sum + Number(expense.amount), 0);
      return { name: type.name, value: total, color: type.color };
    })
    .filter((item) => item.value > 0);

  const categoryMap = new Map<string, number>();
  expenses.forEach((expense: any) => {
    const category = expense.categories?.name || t('analytics.noCategory');
    categoryMap.set(category, (categoryMap.get(category) ?? 0) + Number(expense.amount));
  });
  const categoryData = Array.from(categoryMap.entries()).map(([name, value]) => ({ name, value }));

  const totalExpenses = expenses.reduce((sum, expense) => sum + Number(expense.amount), 0);
  const comparisonData = [
    { name: t('analytics.revenue'), value: totalReceived },
    { name: t('analytics.expenses'), value: totalExpenses },
    { name: t('analytics.pending'), value: totalPending },
  ];

  const incomeByType = incomeTypes
    .map((type) => {
      const total = income
        .filter((item) => (item as any).income_type_id === type.id)
        .reduce((sum, item) => sum + Number(item.amount), 0);
      return { name: type.name, value: total, color: type.color };
    })
    .filter((item) => item.value > 0);

  const habitData = habits.map((habit) => {
    const now = new Date();
    const daysPassed = now.getDate();
    const count = completions.filter((completion) => {
      const date = new Date(`${completion.completed_date}T00:00:00`);
      return completion.habit_id === habit.id && date.getMonth() === now.getMonth() && date.getFullYear() === now.getFullYear();
    }).length;
    return { name: habit.name.substring(0, 15), consistency: daysPassed > 0 ? Math.round((count / daysPassed) * 100) : 0 };
  });

  const cardVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: (i: number) => ({ opacity: 1, y: 0, transition: { delay: i * 0.1 } }),
  };

  const expensePieData = expensesByType.length > 0 ? expensesByType : categoryData;
  const expensePieTitle = expensesByType.length > 0 ? t('analytics.expensesByType') : t('analytics.expensesByCategory');

  return (
    <div className="space-y-6">
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
        <h1 className="text-3xl font-bold font-display text-gradient-silver">{t('analytics.title')}</h1>
      </motion.div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <motion.div
          variants={cardVariants}
          initial="hidden"
          animate="visible"
          custom={0}
          whileHover={{ scale: 1.01 }}
          className="glass-card p-6 hover:shadow-[0_0_30px_hsl(var(--glow-silver))] transition-shadow duration-500"
        >
          <h2 className="text-lg font-semibold font-display mb-4">{expensePieTitle}</h2>
          {expensePieData.length > 0 ? (
            <ResponsiveContainer width="100%" height={250}>
              <PieChart>
                <Pie data={expensePieData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={80} label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}>
                  {expensePieData.map((item: any, index) => <Cell key={index} fill={item.color || COLORS[index % COLORS.length]} />)}
                </Pie>
                <Tooltip contentStyle={tooltipStyle} formatter={(value: number) => money(value)} />
              </PieChart>
            </ResponsiveContainer>
          ) : (
            <p className="text-muted-foreground text-sm text-center py-8">{t('common.noData')}</p>
          )}
        </motion.div>

        <motion.div
          variants={cardVariants}
          initial="hidden"
          animate="visible"
          custom={1}
          whileHover={{ scale: 1.01 }}
          className="glass-card p-6 hover:shadow-[0_0_30px_hsl(var(--glow-silver))] transition-shadow duration-500"
        >
          <h2 className="text-lg font-semibold font-display mb-4">{t('analytics.revenueVsExpenses')}</h2>
          <ResponsiveContainer width="100%" height={250}>
            <BarChart data={comparisonData}>
              <XAxis dataKey="name" stroke="hsl(0,0%,55%)" fontSize={12} />
              <YAxis stroke="hsl(0,0%,55%)" fontSize={12} />
              <Tooltip contentStyle={tooltipStyle} formatter={(value: number) => money(value)} />
              <Bar dataKey="value" fill="hsl(0,0%,75%)" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </motion.div>

        {incomeByType.length > 0 && (
          <motion.div
            variants={cardVariants}
            initial="hidden"
            animate="visible"
            custom={2}
            whileHover={{ scale: 1.01 }}
            className="glass-card p-6 hover:shadow-[0_0_30px_hsl(var(--glow-silver))] transition-shadow duration-500"
          >
            <h2 className="text-lg font-semibold font-display mb-4">{t('analytics.revenueBySource')}</h2>
            <ResponsiveContainer width="100%" height={250}>
              <PieChart>
                <Pie data={incomeByType} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={80} label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}>
                  {incomeByType.map((item, index) => <Cell key={index} fill={item.color} />)}
                </Pie>
                <Tooltip contentStyle={tooltipStyle} formatter={(value: number) => money(value)} />
              </PieChart>
            </ResponsiveContainer>
          </motion.div>
        )}

        <FeatureGate feature="advancedAnalytics" label={t('analytics.advanced')}>
          <motion.div
            variants={cardVariants}
            initial="hidden"
            animate="visible"
            custom={3}
            whileHover={{ scale: 1.01 }}
            className="glass-card p-6 hover:shadow-[0_0_30px_hsl(var(--glow-silver))] transition-shadow duration-500"
          >
            <h2 className="text-lg font-semibold font-display mb-4">{t('analytics.habitConsistency')}</h2>
            {habitData.length > 0 ? (
              <ResponsiveContainer width="100%" height={250}>
                <BarChart data={habitData}>
                  <XAxis dataKey="name" stroke="hsl(0,0%,55%)" fontSize={12} />
                  <YAxis stroke="hsl(0,0%,55%)" fontSize={12} domain={[0, 100]} />
                  <Tooltip contentStyle={tooltipStyle} />
                  <Bar dataKey="consistency" fill="hsl(142,70%,45%)" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <p className="text-muted-foreground text-sm text-center py-8">{t('analytics.noHabitData')}</p>
            )}
          </motion.div>
        </FeatureGate>
      </div>
    </div>
  );
}
