import { motion } from 'framer-motion';
import { useExpenses } from '@/hooks/useExpenses';
import { useSavings } from '@/hooks/useSavings';
import { useIncome } from '@/hooks/useIncome';
import { useHabits } from '@/hooks/useHabits';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';

const COLORS = ['hsl(0,0%,75%)', 'hsl(0,0%,60%)', 'hsl(0,0%,45%)', 'hsl(0,0%,35%)', 'hsl(142,70%,45%)', 'hsl(38,92%,50%)'];

export default function Analytics() {
  const { expenses } = useExpenses();
  const { savings } = useSavings();
  const { totalReceived, totalPending } = useIncome();
  const { habits, completions } = useHabits();

  // Expenses by category
  const categoryMap = new Map<string, number>();
  expenses.forEach(e => {
    const cat = (e as any).categories?.name || 'Sem categoria';
    categoryMap.set(cat, (categoryMap.get(cat) ?? 0) + Number(e.amount));
  });
  const categoryData = Array.from(categoryMap.entries()).map(([name, value]) => ({ name, value }));

  // Income vs Expenses
  const totalExpenses = expenses.reduce((s, e) => s + Number(e.amount), 0);
  const comparisonData = [
    { name: 'Receita', value: totalReceived },
    { name: 'Despesas', value: totalExpenses },
    { name: 'Pendente', value: totalPending },
  ];

  // Habit consistency per habit
  const habitData = habits.map(h => {
    const now = new Date();
    const daysPassed = now.getDate();
    const count = completions.filter(c => {
      const d = new Date(c.completed_date + 'T00:00:00');
      return c.habit_id === h.id && d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
    }).length;
    return { name: h.name.substring(0, 15), consistency: daysPassed > 0 ? Math.round((count / daysPassed) * 100) : 0 };
  });

  return (
    <div className="space-y-6">
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
        <h1 className="text-3xl font-bold font-display text-gradient-silver">Análises</h1>
      </motion.div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="glass-card p-6">
          <h2 className="text-lg font-semibold font-display mb-4">Despesas por Categoria</h2>
          {categoryData.length > 0 ? (
            <ResponsiveContainer width="100%" height={250}>
              <PieChart>
                <Pie data={categoryData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={80} label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}>
                  {categoryData.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                </Pie>
                <Tooltip contentStyle={{ backgroundColor: 'hsl(0,0%,8%)', border: '1px solid hsl(0,0%,16%)', borderRadius: '8px', color: 'hsl(0,0%,90%)' }} />
              </PieChart>
            </ResponsiveContainer>
          ) : <p className="text-muted-foreground text-sm text-center py-8">Sem dados</p>}
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="glass-card p-6">
          <h2 className="text-lg font-semibold font-display mb-4">Receita vs Despesas</h2>
          <ResponsiveContainer width="100%" height={250}>
            <BarChart data={comparisonData}>
              <XAxis dataKey="name" stroke="hsl(0,0%,55%)" fontSize={12} />
              <YAxis stroke="hsl(0,0%,55%)" fontSize={12} />
              <Tooltip contentStyle={{ backgroundColor: 'hsl(0,0%,8%)', border: '1px solid hsl(0,0%,16%)', borderRadius: '8px', color: 'hsl(0,0%,90%)' }} />
              <Bar dataKey="value" fill="hsl(0,0%,75%)" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }} className="glass-card p-6 lg:col-span-2">
          <h2 className="text-lg font-semibold font-display mb-4">Consistência dos Hábitos (%)</h2>
          {habitData.length > 0 ? (
            <ResponsiveContainer width="100%" height={250}>
              <BarChart data={habitData}>
                <XAxis dataKey="name" stroke="hsl(0,0%,55%)" fontSize={12} />
                <YAxis stroke="hsl(0,0%,55%)" fontSize={12} domain={[0, 100]} />
                <Tooltip contentStyle={{ backgroundColor: 'hsl(0,0%,8%)', border: '1px solid hsl(0,0%,16%)', borderRadius: '8px', color: 'hsl(0,0%,90%)' }} />
                <Bar dataKey="consistency" fill="hsl(142,70%,45%)" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          ) : <p className="text-muted-foreground text-sm text-center py-8">Sem dados de hábitos</p>}
        </motion.div>
      </div>
    </div>
  );
}
