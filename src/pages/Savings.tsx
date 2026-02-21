import { useState } from 'react';
import { motion } from 'framer-motion';
import { PiggyBank, Edit2, Plus, Trash2, TrendingDown, Lightbulb } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ProgressBar } from '@/components/ProgressBar';
import { useSavings } from '@/hooks/useSavings';
import { useDebts } from '@/hooks/useDebts';
import { useIncome } from '@/hooks/useIncome';
import { useExpenses } from '@/hooks/useExpenses';
import { useToast } from '@/hooks/use-toast';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';

const formatCurrency = (value: number) =>
  new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);

export default function Savings() {
  const { savings, upsertSavings } = useSavings();
  const { debts, totalDebt, addDebt, deleteDebt } = useDebts();
  const { income } = useIncome();
  const { total: totalExpenses } = useExpenses();
  const { toast } = useToast();
  const [editing, setEditing] = useState(false);
  const [debtOpen, setDebtOpen] = useState(false);
  const [form, setForm] = useState({ total_saved: '', goal_amount: '', goal_date: '' });
  const [debtForm, setDebtForm] = useState({ name: '', total_amount: '', remaining_amount: '', interest_rate: '', minimum_payment: '', due_date: '' });

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

  const handleAddDebt = async () => {
    if (!debtForm.name || !debtForm.total_amount) return;
    try {
      await addDebt.mutateAsync({
        name: debtForm.name,
        total_amount: Number(debtForm.total_amount),
        remaining_amount: Number(debtForm.remaining_amount || debtForm.total_amount),
        interest_rate: Number(debtForm.interest_rate || 0),
        minimum_payment: Number(debtForm.minimum_payment || 0),
        due_date: debtForm.due_date || undefined,
      });
      setDebtForm({ name: '', total_amount: '', remaining_amount: '', interest_rate: '', minimum_payment: '', due_date: '' });
      setDebtOpen(false);
    } catch (e: any) {
      toast({ title: 'Erro', description: e.message, variant: 'destructive' });
    }
  };

  const saved = Number(savings?.total_saved ?? 0);
  const goal = Number(savings?.goal_amount ?? 0);

  // Smart payoff calculations
  const monthlyIncome = income.filter(i => i.status === 'received').reduce((s, i) => s + Number(i.amount), 0);
  const availableForDebt = Math.max(0, monthlyIncome - totalExpenses);
  const suggestedPayment = Math.round(availableForDebt * 0.3); // 30% of available

  // Snowball method: sort by remaining amount ascending
  const sortedDebts = [...debts].sort((a, b) => Number(a.remaining_amount) - Number(b.remaining_amount));

  const estimateMonths = (payment: number) => {
    if (payment <= 0 || totalDebt <= 0) return 0;
    return Math.ceil(totalDebt / payment);
  };

  const monthsToFree = estimateMonths(suggestedPayment);

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

      {/* Debts Section */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
        <h2 className="text-xl font-bold font-display text-foreground mb-4">Dívidas e Plano de Quitação</h2>

        {/* My Debts Card */}
        <div className="glass-card p-6 space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-accent">
                <TrendingDown className="h-5 w-5 text-destructive" />
              </div>
              <div>
                <h3 className="font-semibold text-foreground">Minhas Dívidas</h3>
                <p className="text-sm text-muted-foreground">Total: {formatCurrency(totalDebt)}</p>
              </div>
            </div>
            <Dialog open={debtOpen} onOpenChange={setDebtOpen}>
              <DialogTrigger asChild>
                <Button size="sm" className="gradient-silver text-primary-foreground">
                  <Plus className="h-4 w-4 mr-1" /> Adicionar Dívida
                </Button>
              </DialogTrigger>
              <DialogContent className="bg-card border-border">
                <DialogHeader><DialogTitle className="font-display">Nova Dívida</DialogTitle></DialogHeader>
                <div className="space-y-3">
                  <Input placeholder="Nome da dívida" value={debtForm.name} onChange={e => setDebtForm({ ...debtForm, name: e.target.value })} className="bg-secondary border-border" />
                  <Input type="number" placeholder="Valor total" value={debtForm.total_amount} onChange={e => setDebtForm({ ...debtForm, total_amount: e.target.value })} className="bg-secondary border-border" />
                  <Input type="number" placeholder="Valor restante" value={debtForm.remaining_amount} onChange={e => setDebtForm({ ...debtForm, remaining_amount: e.target.value })} className="bg-secondary border-border" />
                  <Input type="number" placeholder="Taxa de juros (%)" value={debtForm.interest_rate} onChange={e => setDebtForm({ ...debtForm, interest_rate: e.target.value })} className="bg-secondary border-border" />
                  <Input type="number" placeholder="Valor mínimo mensal" value={debtForm.minimum_payment} onChange={e => setDebtForm({ ...debtForm, minimum_payment: e.target.value })} className="bg-secondary border-border" />
                  <Input type="date" value={debtForm.due_date} onChange={e => setDebtForm({ ...debtForm, due_date: e.target.value })} className="bg-secondary border-border" />
                  <Button onClick={handleAddDebt} className="w-full gradient-silver text-primary-foreground">Adicionar</Button>
                </div>
              </DialogContent>
            </Dialog>
          </div>

          {debts.length > 0 ? (
            <div className="space-y-3">
              {debts.map((debt, i) => {
                const progress = Number(debt.total_amount) > 0
                  ? ((Number(debt.total_amount) - Number(debt.remaining_amount)) / Number(debt.total_amount)) * 100
                  : 0;
                return (
                  <motion.div
                    key={debt.id}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: i * 0.05 }}
                    className="p-4 rounded-xl bg-secondary/50 border border-border/50 space-y-2"
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-medium text-foreground">{debt.name}</span>
                      <button onClick={() => deleteDebt.mutateAsync(debt.id)} className="text-muted-foreground hover:text-destructive">
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                    <div className="flex gap-4 text-xs text-muted-foreground">
                      <span>Restante: {formatCurrency(Number(debt.remaining_amount))}</span>
                      <span>Juros: {Number(debt.interest_rate)}%</span>
                      {debt.due_date && <span>Venc: {new Date(debt.due_date + 'T00:00:00').toLocaleDateString('pt-BR')}</span>}
                    </div>
                    <ProgressBar value={progress} max={100} label={`${Math.round(progress)}% quitado`} />
                  </motion.div>
                );
              })}
            </div>
          ) : (
            <p className="text-sm text-muted-foreground text-center py-4">Nenhuma dívida cadastrada</p>
          )}
        </div>

        {/* Smart Payoff Plan */}
        {debts.length > 0 && (
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }} className="glass-card p-6 space-y-4 mt-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-accent">
                <Lightbulb className="h-5 w-5 text-warning" />
              </div>
              <div>
                <h3 className="font-semibold text-foreground">Plano Inteligente de Saída</h3>
                <p className="text-xs text-muted-foreground">Método bola de neve • Menor dívida primeiro</p>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="p-3 rounded-lg bg-secondary/50 border border-border/50">
                <p className="text-xs text-muted-foreground">Renda mensal</p>
                <p className="font-semibold text-foreground">{formatCurrency(monthlyIncome)}</p>
              </div>
              <div className="p-3 rounded-lg bg-secondary/50 border border-border/50">
                <p className="text-xs text-muted-foreground">Despesas fixas</p>
                <p className="font-semibold text-foreground">{formatCurrency(totalExpenses)}</p>
              </div>
              <div className="p-3 rounded-lg bg-secondary/50 border border-border/50">
                <p className="text-xs text-muted-foreground">Sugestão mensal</p>
                <p className="font-semibold text-foreground">{formatCurrency(suggestedPayment)}</p>
              </div>
            </div>

            {suggestedPayment > 0 && monthsToFree > 0 && (
              <div className="p-4 rounded-xl bg-accent/50 border border-border/50">
                <p className="text-sm text-foreground">
                  💡 Se você pagar <strong>{formatCurrency(suggestedPayment)}</strong> por mês, estará livre das dívidas em <strong>{monthsToFree} {monthsToFree === 1 ? 'mês' : 'meses'}</strong>.
                </p>
              </div>
            )}

            {sortedDebts.length > 1 && (
              <div>
                <p className="text-xs text-muted-foreground mb-2">Ordem recomendada de quitação:</p>
                <div className="space-y-1">
                  {sortedDebts.map((d, i) => (
                    <div key={d.id} className="flex items-center gap-2 text-sm">
                      <span className="w-5 h-5 rounded-full bg-accent flex items-center justify-center text-xs font-bold text-foreground">{i + 1}</span>
                      <span className="text-foreground">{d.name}</span>
                      <span className="text-muted-foreground">— {formatCurrency(Number(d.remaining_amount))}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </motion.div>
        )}
      </motion.div>
    </div>
  );
}
