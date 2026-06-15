import { getFriendlyErrorMessage } from '@/lib/errors';
import { useState } from 'react';
import { motion } from 'framer-motion';
import { Plus, Trash2, Flame } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
import { useHabits } from '@/hooks/useHabits';
import { useToast } from '@/hooks/use-toast';
import { useSubscription } from '@/hooks/useSubscription';
import { UpgradeModal } from '@/components/UpgradeModal';

export default function Habits() {
  const { habits, completions, addHabit, deleteHabit, toggleCompletion, getStreak } = useHabits();
  const { toast } = useToast();
  const { features } = useSubscription();
  const [newHabit, setNewHabit] = useState('');
  const [showUpgrade, setShowUpgrade] = useState(false);
  const today = new Date().toISOString().split('T')[0];

  const handleAdd = async () => {
    if (!newHabit.trim()) return;
    if (habits.length >= features.maxHabits) {
      setShowUpgrade(true);
      toast({ title: 'Limite atingido', description: 'Você atingiu o limite do plano gratuito.', variant: 'destructive' });
      return;
    }
    try {
      await addHabit.mutateAsync(newHabit.trim());
      setNewHabit('');
    } catch (e: any) {
      console.error(e); toast({ title: 'Erro', description: getFriendlyErrorMessage(e), variant: 'destructive' });
    }
  };

  // Monthly consistency
  const daysInMonth = new Date(new Date().getFullYear(), new Date().getMonth() + 1, 0).getDate();
  const daysPassed = new Date().getDate();

  const getConsistency = (habitId: string) => {
    const month = new Date().getMonth() + 1;
    const year = new Date().getFullYear();
    const count = completions.filter(c => {
      const d = new Date(c.completed_date + 'T00:00:00');
      return c.habit_id === habitId && d.getMonth() + 1 === month && d.getFullYear() === year;
    }).length;
    return daysPassed > 0 ? Math.round((count / daysPassed) * 100) : 0;
  };

  // Heatmap last 30 days
  const last30 = Array.from({ length: 30 }, (_, i) => {
    const d = new Date();
    d.setDate(d.getDate() - (29 - i));
    return d.toISOString().split('T')[0];
  });

  return (
    <div className="space-y-6">
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
        <h1 className="text-3xl font-bold font-display text-gradient-silver">Hábitos Diários</h1>
        <p className="text-muted-foreground text-sm">Construa consistência todos os dias</p>
      </motion.div>

      <div className="flex gap-2">
        <Input
          placeholder="Novo hábito..."
          value={newHabit}
          onChange={e => setNewHabit(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && handleAdd()}
          className="bg-secondary border-border"
        />
        <Button onClick={handleAdd} className="gradient-silver text-primary-foreground shrink-0">
          <Plus className="h-4 w-4" />
        </Button>
      </div>

      <div className="space-y-3">
        {habits.map((habit, i) => {
          const isCompleted = completions.some(c => c.habit_id === habit.id && c.completed_date === today);
          const streak = getStreak(habit.id);
          const consistency = getConsistency(habit.id);

          return (
            <motion.div
              key={habit.id}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: i * 0.05 }}
              className="glass-card p-4"
            >
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-3">
                  <Checkbox
                    checked={isCompleted}
                    onCheckedChange={() => toggleCompletion.mutateAsync({ habitId: habit.id, date: today })}
                    className="border-silver data-[state=checked]:bg-silver data-[state=checked]:border-silver"
                  />
                  <span className={`font-medium ${isCompleted ? 'line-through text-muted-foreground' : 'text-foreground'}`}>
                    {habit.name}
                  </span>
                </div>
                <div className="flex items-center gap-3">
                  {streak > 0 && (
                    <div className="flex items-center gap-1 text-warning text-sm">
                      <Flame className="h-4 w-4" />
                      <span>{streak}</span>
                    </div>
                  )}
                  <span className="text-xs text-muted-foreground">{consistency}% este mês</span>
                  <button onClick={() => deleteHabit.mutateAsync(habit.id)} className="text-muted-foreground hover:text-destructive">
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>

              {/* Mini heatmap */}
              <div className="flex gap-1">
                {last30.map(date => {
                  const done = completions.some(c => c.habit_id === habit.id && c.completed_date === date);
                  return (
                    <div
                      key={date}
                      className={`h-2 flex-1 rounded-sm ${done ? 'bg-silver' : 'bg-secondary'}`}
                      title={date}
                    />
                  );
                })}
              </div>
            </motion.div>
          );
        })}
        {habits.length === 0 && (
          <div className="text-center py-12 text-muted-foreground">
            Adicione seu primeiro hábito acima
          </div>
        )}
      </div>

      {!features.unlimitedHabits && habits.length > 0 && (
        <p className="text-xs text-muted-foreground text-center">
          {habits.length}/{features.maxHabits} hábitos • Upgrade para ilimitados
        </p>
      )}

      <UpgradeModal open={showUpgrade} onOpenChange={setShowUpgrade} featureLabel="Hábitos ilimitados" />
    </div>
  );
}
