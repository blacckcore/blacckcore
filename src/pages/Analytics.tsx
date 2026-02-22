import { motion } from 'framer-motion';
import { useExpenses } from '@/hooks/useExpenses';
import { useExpenseTypes } from '@/hooks/useExpenseTypes';
import { useSavings } from '@/hooks/useSavings';
import { useIncome } from '@/hooks/useIncome';
import { useHabits } from '@/hooks/useHabits';
import { useIncomeTypes } from '@/hooks/useIncomeTypes';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { FeatureGate } from '@/components/FeatureGate';

const COLORS = ['hsl(0,0%,75%)', 'hsl(0,0%,60%)', 'hsl(0,0%,45%)', 'hsl(0,0%,35%)', 'hsl(142,70%,45%)', 'hsl(38,92%,50%)'];

const tooltipStyle = { backgroundColor: 'hsl(0,0%,8%)', border: '1px solid hsl(0,0%,16%)', borderRadius: '8px', color: 'hsl(0,0%,90%)' };

const formatCurrency = (value: number) =>
  new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);

export default function Analytics() {
  const { expenses } = useExpenses();
  const { expenseTypes } = useExpenseTypes();
  const { savings } = useSavings();
  const { income, totalReceived, totalPending } = useIncome();
  const { habits, completions } = useHabits();
  const { incomeTypes } = useIncomeTypes();

  // Expenses by type
  const expensesByType = expenseTypes.map(t => {
    const total = expenses.filter((e: any) => e.expense_type_id === t.id).reduce((s, e) => s + Number(e.amount), 0);
    return { name: t.name, value: total, color: t.color };
  }).filter(d => d.value > 0);

  // Fallback: expenses by old category
  const categoryMap = new Map<string, number>();
  expenses.forEach(e => {
    const cat = (e as any).categories?.name || 'Sem categoria';
    categoryMap.set(cat, (categoryMap.get(cat) ?? 0) + Number(e.amount));
  });
  const categoryData = Array.from(categoryMap.entries()).map(([name, value]) => ({ name, value }));

  const totalExpenses = expenses.reduce((s, e) => s + Number(e.amount), 0);
  const comparisonData = [
    { name: 'Receita', value: totalReceived },
    { name: 'Despesas', value: totalExpenses },
    { name: 'Pendente', value: totalPending },
  ];

  const incomeByType = incomeTypes.map(t => {
    const total = income.filter(i => (i as any).income_type_id === t.id).reduce((s, i) => s + Number(i.amount), 0);
    return { name: t.name, value: total, color: t.color };
  }).filter(d => d.value > 0);

  const habitData = habits.map(h => {
    const now = new Date();
    const daysPassed = now.getDate();
    const count = completions.filter(c => {
      const d = new Date(c.completed_date + 'T00:00:00');
      return c.habit_id === h.id && d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
    }).length;
    return { name: h.name.substring(0, 15), consistency: daysPassed > 0 ? Math.round((count / daysPassed) * 100) : 0 };
  });

  const cardVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: (i: number) => ({ opacity: 1, y: 0, transition: { delay: i * 0.1 } }),
  };

  // Use expense types chart if available, otherwise fall back to categories
  const expensePieData = expensesByType.length > 0 ? expensesByType : categoryData;
  const expensePieTitle = expensesByType.length > 0 ? 'Despesas por Tipo' : 'Despesas por Categoria';

  return (
    <div className="space-y-6">
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
        <h1 className="text-3xl font-bold font-display text-gradient-silver">Análises</h1>
      </motion.div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <motion.div
          variants={cardVariants} initial="hidden" animate="visible" custom={0}
          whileHover={{ scale: 1.01 }}
          className="glass-card p-6 hover:shadow-[0_0_30px_hsl(var(--glow-silver))] transition-shadow duration-500"
        >
          <h2 className="text-lg font-semibold font-display mb-4">{expensePieTitle}</h2>
          {expensePieData.length > 0 ? (
            <ResponsiveContainer width="100%" height={250}>
              <PieChart>
                <Pie data={expensePieData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={80} label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}>
                  {expensePieData.map((d: any, i) => <Cell key={i} fill={d.color || COLORS[i % COLORS.length]} />)}
                </Pie>
                <Tooltip contentStyle={tooltipStyle} formatter={(v: number) => formatCurrency(v)} />
              </PieChart>
            </ResponsiveContainer>
          ) : <p className="text-muted-foreground text-sm text-center py-8">Sem dados</p>}
        </motion.div>

        <motion.div
          variants={cardVariants} initial="hidden" animate="visible" custom={1}
          whileHover={{ scale: 1.01 }}
          className="glass-card p-6 hover:shadow-[0_0_30px_hsl(var(--glow-silver))] transition-shadow duration-500"
        >
          <h2 className="text-lg font-semibold font-display mb-4">Receita vs Despesas</h2>
          <ResponsiveContainer width="100%" height={250}>
            <BarChart data={comparisonData}>
              <XAxis dataKey="name" stroke="hsl(0,0%,55%)" fontSize={12} />
              <YAxis stroke="hsl(0,0%,55%)" fontSize={12} />
              <Tooltip contentStyle={tooltipStyle} formatter={(v: number) => formatCurrency(v)} />
              <Bar dataKey="value" fill="hsl(0,0%,75%)" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </motion.div>

        {incomeByType.length > 0 && (
          <motion.div
            variants={cardVariants} initial="hidden" animate="visible" custom={2}
            whileHover={{ scale: 1.01 }}
            className="glass-card p-6 hover:shadow-[0_0_30px_hsl(var(--glow-silver))] transition-shadow duration-500"
          >
            <h2 className="text-lg font-semibold font-display mb-4">Receita por Fonte</h2>
            <ResponsiveContainer width="100%" height={250}>
              <PieChart>
                <Pie data={incomeByType} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={80} label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}>
                  {incomeByType.map((d, i) => <Cell key={i} fill={d.color} />)}
                </Pie>
                <Tooltip contentStyle={tooltipStyle} formatter={(v: number) => formatCurrency(v)} />
              </PieChart>
            </ResponsiveContainer>
          </motion.div>
        )}

        <FeatureGate feature="advancedAnalytics" label="Análises avançadas">
          <motion.div
            variants={cardVariants} initial="hidden" animate="visible" custom={3}
            whileHover={{ scale: 1.01 }}
            className="glass-card p-6 hover:shadow-[0_0_30px_hsl(var(--glow-silver))] transition-shadow duration-500"
          >
            <h2 className="text-lg font-semibold font-display mb-4">Consistência dos Hábitos (%)</h2>
            {habitData.length > 0 ? (
              <ResponsiveContainer width="100%" height={250}>
                <BarChart data={habitData}>
                  <XAxis dataKey="name" stroke="hsl(0,0%,55%)" fontSize={12} />
                  <YAxis stroke="hsl(0,0%,55%)" fontSize={12} domain={[0, 100]} />
                  <Tooltip contentStyle={tooltipStyle} />
                  <Bar dataKey="consistency" fill="hsl(142,70%,45%)" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            ) : <p className="text-muted-foreground text-sm text-center py-8">Sem dados de hábitos</p>}
          </motion.div>
        </FeatureGate>
      </div>
    </div>
  );
}
