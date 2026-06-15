import { getFriendlyErrorMessage } from '@/lib/errors';
import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { PiggyBank, Edit2, Plus, Trash2, TrendingDown, Lightbulb, Shield, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ProgressBar } from '@/components/ProgressBar';
import { useSavings } from '@/hooks/useSavings';
import { useDebts } from '@/hooks/useDebts';
import { useIncome } from '@/hooks/useIncome';
import { useExpenses } from '@/hooks/useExpenses';
import { useSubscription } from '@/hooks/useSubscription';
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

// Simple confetti effect
function ConfettiOverlay({ show }: { show: boolean }) {
  if (!show) return null;
  const particles = Array.from({ length: 30 }, (_, i) => ({
    id: i,
    x: Math.random() * 100,
    delay: Math.random() * 0.5,
    color: ['#F87171', '#60A5FA', '#34D399', '#FBBF24', '#A78BFA', '#FB923C'][i % 6],
  }));
  return (
    <div className="fixed inset-0 pointer-events-none z-50 overflow-hidden">
      {particles.map(p => (
        <motion.div
          key={p.id}
          className="absolute w-2 h-2 rounded-full"
          style={{ left: `${p.x}%`, backgroundColor: p.color }}
          initial={{ top: '-5%', opacity: 1, scale: 1 }}
          animate={{ top: '105%', opacity: 0, scale: 0.5, rotate: 360 }}
          transition={{ duration: 2.5 + Math.random(), delay: p.delay, ease: 'easeIn' }}
        />
      ))}
    </div>
  );
}

export default function Savings() {
  const { savings, upsertSavings } = useSavings();
  const { debts, totalDebt, addDebt, deleteDebt } = useDebts();
  const { income } = useIncome();
  const { total: totalExpenses } = useExpenses();
  const { isPremium } = useSubscription();
  const { toast } = useToast();
  const [editing, setEditing] = useState(false);
  const [debtOpen, setDebtOpen] = useState(false);
  const [reserveOpen, setReserveOpen] = useState(false);
  const [showConfetti, setShowConfetti] = useState(false);
  const [form, setForm] = useState({ total_saved: '', goal_amount: '', goal_date: '' });
  const [debtForm, setDebtForm] = useState({ name: '', total_amount: '', remaining_amount: '', interest_rate: '', minimum_payment: '', due_date: '' });
  const [reserveForm, setReserveForm] = useState({ months: '6', type: 'auto' as 'auto' | 'manual', manual_goal: '' });

  const monthlyIncome = income.filter(i => i.status === 'received').reduce((s, i) => s + Number(i.amount), 0);
  const avgExpenses = totalExpenses; // current month expenses as proxy
  const monthlySavingsRate = Math.max(0, monthlyIncome - totalExpenses);

  const saved = Number(savings?.total_saved ?? 0);
  const goal = Number(savings?.goal_amount ?? 0);
  const savingsPercent = goal > 0 ? Math.min((saved / goal) * 100, 100) : 0;

  // Confetti on 100%
  useEffect(() => {
    if (savingsPercent >= 100 && goal > 0) {
      setShowConfetti(true);
      const timer = setTimeout(() => setShowConfetti(false), 3000);
      return () => clearTimeout(timer);
    }
  }, [savingsPercent, goal]);

  // Emergency reserve calculations
  const reserveMonths = Number(reserveForm.months) || 6;
  const idealReserve = reserveForm.type === 'auto' ? avgExpenses * reserveMonths : Number(reserveForm.manual_goal) || 0;
  const reserveProgress = idealReserve > 0 ? Math.min((saved / idealReserve) * 100, 100) : 0;
  const monthsToReserve = monthlySavingsRate > 0 ? Math.ceil(Math.max(0, idealReserve - saved) / monthlySavingsRate) : 0;

  // Smart suggestions
  const suggestions: string[] = [];
  if (avgExpenses > 0 && monthlySavingsRate < avgExpenses * 0.1) {
    suggestions.push(`Reduzindo 10% das despesas você economiza ${formatCurrency(avgExpenses * 0.1)}/mês`);
  }
  if (monthlySavingsRate > 0 && monthsToReserve > 12) {
    suggestions.push(`Aumentar renda em ${formatCurrency(200)} acelera em ~30%`);
  }
  if (savingsPercent >= 100) {
    suggestions.push('🎉 Meta atingida! Considere aumentar sua reserva.');
  }

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
      console.error(e); toast({ title: 'Erro', description: getFriendlyErrorMessage(e), variant: 'destructive' });
    }
  };

  const handleSaveReserve = async () => {
    const newGoal = idealReserve;
    try {
      await upsertSavings.mutateAsync({
        total_saved: saved,
        goal_amount: newGoal,
        goal_date: savings?.goal_date || undefined,
      });
      setReserveOpen(false);
      toast({ title: 'Reserva atualizada!', description: `Meta: ${formatCurrency(newGoal)}` });
    } catch (e: any) {
      console.error(e); toast({ title: 'Erro', description: getFriendlyErrorMessage(e), variant: 'destructive' });
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
      console.error(e); toast({ title: 'Erro', description: getFriendlyErrorMessage(e), variant: 'destructive' });
    }
  };

  const availableForDebt = Math.max(0, monthlyIncome - totalExpenses);
  const suggestedPayment = Math.round(availableForDebt * 0.3);
  const sortedDebts = [...debts].sort((a, b) => Number(a.remaining_amount) - Number(b.remaining_amount));
  const estimateMonths = (payment: number) => {
    if (payment <= 0 || totalDebt <= 0) return 0;
    return Math.ceil(totalDebt / payment);
  };
  const monthsToFree = estimateMonths(suggestedPayment);

  return (
    <div className="space-y-6">
      <ConfettiOverlay show={showConfetti} />

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
                <motion.p
                  key={saved}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="text-4xl font-bold font-display text-foreground"
                >
                  {formatCurrency(saved)}
                </motion.p>
              </div>
            </div>
            <ProgressBar value={saved} max={goal || 1} label={`Meta: ${formatCurrency(goal)}`} glow={savingsPercent >= 100} />
            {savings?.goal_date && (
              <p className="text-sm text-muted-foreground mt-3">
                Prazo: {new Date(savings.goal_date + 'T00:00:00').toLocaleDateString('pt-BR')}
              </p>
            )}
          </motion.div>
        </div>
      )}

      {/* Emergency Reserve Section */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }}>
        <div className="glass-card p-6 space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-accent">
                <Shield className="h-5 w-5 text-silver" />
              </div>
              <div>
                <h2 className="font-semibold text-foreground">Reserva Emergencial</h2>
                <p className="text-xs text-muted-foreground">
                  {reserveForm.type === 'auto' ? `Baseada em ${reserveMonths} meses de despesas` : 'Meta manual'}
                </p>
              </div>
            </div>
            <Dialog open={reserveOpen} onOpenChange={setReserveOpen}>
              <DialogTrigger asChild>
                <Button variant="outline" size="sm" className="border-border">
                  <Edit2 className="h-3.5 w-3.5 mr-1" /> Editar Reserva
                </Button>
              </DialogTrigger>
              <DialogContent className="bg-card border-border">
                <DialogHeader><DialogTitle className="font-display">Configurar Reserva Emergencial</DialogTitle></DialogHeader>
                <div className="space-y-4">
                  <div>
                    <label className="text-sm text-muted-foreground mb-1 block">Tipo de cálculo</label>
                    <Select value={reserveForm.type} onValueChange={(v: 'auto' | 'manual') => setReserveForm({ ...reserveForm, type: v })}>
                      <SelectTrigger className="bg-secondary border-border"><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="auto">Baseada em despesas mensais</SelectItem>
                        <SelectItem value="manual">Valor manual</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  {reserveForm.type === 'auto' ? (
                    <div>
                      <label className="text-sm text-muted-foreground mb-1 block">Meses a cobrir</label>
                      <Select value={reserveForm.months} onValueChange={v => setReserveForm({ ...reserveForm, months: v })}>
                        <SelectTrigger className="bg-secondary border-border"><SelectValue /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="3">3 meses</SelectItem>
                          <SelectItem value="6">6 meses</SelectItem>
                          <SelectItem value="12">12 meses</SelectItem>
                        </SelectContent>
                      </Select>
                      <p className="text-xs text-muted-foreground mt-2">
                        Suas despesas médias: {formatCurrency(avgExpenses)} → reserva ideal: {formatCurrency(avgExpenses * Number(reserveForm.months))}
                      </p>
                    </div>
                  ) : (
                    <div>
                      <label className="text-sm text-muted-foreground mb-1 block">Meta da reserva (R$)</label>
                      <Input type="number" value={reserveForm.manual_goal} onChange={e => setReserveForm({ ...reserveForm, manual_goal: e.target.value })} className="bg-secondary border-border" placeholder="Ex: 15000" />
                    </div>
                  )}
                  <Button onClick={handleSaveReserve} className="w-full gradient-silver text-primary-foreground">Salvar como Meta</Button>
                </div>
              </DialogContent>
            </Dialog>
          </div>

          {/* Reserve progress */}
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Atual: {formatCurrency(saved)}</span>
              <span className="text-muted-foreground">Meta: {formatCurrency(idealReserve)}</span>
            </div>
            <ProgressBar value={saved} max={idealReserve || 1} showPercentage glow={reserveProgress >= 100} />
          </div>

          {monthlySavingsRate > 0 && idealReserve > saved && (
            <p className="text-sm text-foreground">
              💰 Guardando <strong>{formatCurrency(monthlySavingsRate)}</strong>/mês você chega lá em <strong>{monthsToReserve} {monthsToReserve === 1 ? 'mês' : 'meses'}</strong>
            </p>
          )}

          {/* Smart suggestions */}
          {suggestions.length > 0 && (
            <div className="space-y-2 pt-2 border-t border-border/50">
              {suggestions.map((s, i) => (
                <div key={i} className="flex items-start gap-2 text-xs text-muted-foreground">
                  <Lightbulb className="h-3.5 w-3.5 mt-0.5 text-warning flex-shrink-0" />
                  <span>{s}</span>
                </div>
              ))}
            </div>
          )}

          {/* Premium: scenario simulator */}
          {isPremium && idealReserve > saved && (
            <div className="pt-2 border-t border-border/50 space-y-2">
              <div className="flex items-center gap-2">
                <Sparkles className="h-3.5 w-3.5 text-warning" />
                <span className="text-xs font-medium text-foreground">Simulador de Cenários</span>
              </div>
              <div className="grid grid-cols-3 gap-2">
                {[
                  { label: 'Conservador', extra: 0 },
                  { label: 'Moderado', extra: 200 },
                  { label: 'Otimista', extra: 500 },
                ].map(scenario => {
                  const rate = monthlySavingsRate + scenario.extra;
                  const months = rate > 0 ? Math.ceil(Math.max(0, idealReserve - saved) / rate) : 0;
                  return (
                    <div key={scenario.label} className="p-2 rounded-lg bg-secondary/50 border border-border/50 text-center">
                      <p className="text-[10px] text-muted-foreground">{scenario.label}</p>
                      <p className="text-xs font-semibold text-foreground">{months > 0 ? `${months} meses` : '—'}</p>
                      {scenario.extra > 0 && <p className="text-[10px] text-muted-foreground">+{formatCurrency(scenario.extra)}/mês</p>}
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      </motion.div>

      {/* Debts Section */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
        <h2 className="text-xl font-bold font-display text-foreground mb-4">Dívidas e Plano de Quitação</h2>

        <div className="glass-card p-6 space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-accent">
                <TrendingDown className="h-5 w-5 text-destructive" />
              </div>
              <div>
                <h2 className="font-semibold text-foreground">Minhas Dívidas</h2>
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
                      <button onClick={() => deleteDebt.mutateAsync(debt.id)} aria-label={`Excluir dívida ${debt.name}`} className="text-muted-foreground hover:text-destructive">
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
                <h2 className="font-semibold text-foreground">Plano Inteligente de Saída</h2>
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
