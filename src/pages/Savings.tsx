import { useState } from 'react';
import { motion } from 'framer-motion';
import { PiggyBank, Edit2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ProgressBar } from '@/components/ProgressBar';
import { useSavings } from '@/hooks/useSavings';
import { useToast } from '@/hooks/use-toast';

const formatCurrency = (value: number) =>
  new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);

export default function Savings() {
  const { savings, upsertSavings } = useSavings();
  const { toast } = useToast();
  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState({
    total_saved: '',
    goal_amount: '',
    goal_date: '',
  });

  const startEdit = () => {
    setForm({
      total_saved: String(savings?.total_saved ?? 0),
      goal_amount: String(savings?.goal_amount ?? 0),
      goal_date: savings?.goal_date ?? '',
    });
    setEditing(true);
  };

  const handleSave = async () => {
    try {
      await upsertSavings.mutateAsync({
        total_saved: Number(form.total_saved),
        goal_amount: Number(form.goal_amount),
        goal_date: form.goal_date || undefined,
      });
      setEditing(false);
      toast({ title: 'Salvo!', description: 'Dados de economia atualizados.' });
    } catch (e: any) {
      toast({ title: 'Erro', description: e.message, variant: 'destructive' });
    }
  };

  const saved = Number(savings?.total_saved ?? 0);
  const goal = Number(savings?.goal_amount ?? 0);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
          <h1 className="text-3xl font-bold font-display text-gradient-silver">Economia</h1>
        </motion.div>
        <Button variant="outline" onClick={startEdit} className="border-border">
          <Edit2 className="h-4 w-4 mr-1" /> Editar
        </Button>
      </div>

      {editing ? (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="glass-card p-6 space-y-4">
          <div>
            <label className="text-sm text-muted-foreground">Valor total guardado</label>
            <Input type="number" value={form.total_saved} onChange={e => setForm({ ...form, total_saved: e.target.value })} className="bg-secondary border-border" />
          </div>
          <div>
            <label className="text-sm text-muted-foreground">Meta de economia</label>
            <Input type="number" value={form.goal_amount} onChange={e => setForm({ ...form, goal_amount: e.target.value })} className="bg-secondary border-border" />
          </div>
          <div>
            <label className="text-sm text-muted-foreground">Data da meta</label>
            <Input type="date" value={form.goal_date} onChange={e => setForm({ ...form, goal_date: e.target.value })} className="bg-secondary border-border" />
          </div>
          <div className="flex gap-2">
            <Button onClick={handleSave} className="gradient-silver text-primary-foreground">Salvar</Button>
            <Button variant="outline" onClick={() => setEditing(false)}>Cancelar</Button>
          </div>
        </motion.div>
      ) : (
        <div className="space-y-6">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="glass-card p-8">
            <div className="flex items-center gap-4 mb-6">
              <div className="p-3 rounded-xl bg-accent">
                <PiggyBank className="h-8 w-8 text-silver" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Total Guardado</p>
                <p className="text-4xl font-bold font-display text-foreground">{formatCurrency(saved)}</p>
              </div>
            </div>
            <ProgressBar value={saved} max={goal || 1} label={`Meta: ${formatCurrency(goal)}`} />
            {savings?.goal_date && (
              <p className="text-sm text-muted-foreground mt-3">
                Prazo: {new Date(savings.goal_date + 'T00:00:00').toLocaleDateString('pt-BR')}
              </p>
            )}
          </motion.div>
        </div>
      )}
    </div>
  );
}
