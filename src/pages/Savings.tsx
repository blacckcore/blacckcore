import { getFriendlyErrorMessage } from '@/lib/errors';
import { useState, useEffect, useMemo, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { PiggyBank, Edit2, Plus, Trash2, TrendingDown, Lightbulb, Shield, Sparkles, Wallet, Landmark, CreditCard, Banknote, LineChart } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ProgressBar } from '@/components/ProgressBar';
import { useSavings } from '@/hooks/useSavings';
import { SavingsAccount, SavingsAccountType, useSavingsAccounts } from '@/hooks/useSavingsAccounts';
import { useDebts } from '@/hooks/useDebts';
import { useIncome } from '@/hooks/useIncome';
import { useExpenses } from '@/hooks/useExpenses';
import { useSubscription } from '@/hooks/useSubscription';
import { useToast } from '@/hooks/use-toast';
import { useI18n } from '@/lib/i18n';
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
  const { t, money, locale } = useI18n();
  const { savings, upsertSavings } = useSavings();
  const { accounts, totals, addAccount, updateAccount, deleteAccount, seedDefaultAccounts } = useSavingsAccounts();
  const { debts, totalDebt, addDebt, updateDebt, deleteDebt } = useDebts();
  const { income } = useIncome();
  const { total: totalExpenses } = useExpenses();
  const { isPremium } = useSubscription();
  const { toast } = useToast();
  const [editing, setEditing] = useState(false);
  const [debtOpen, setDebtOpen] = useState(false);
  const [reserveOpen, setReserveOpen] = useState(false);
  const [accountOpen, setAccountOpen] = useState(false);
  const [editingAccount, setEditingAccount] = useState<SavingsAccount | null>(null);
  const [showConfetti, setShowConfetti] = useState(false);
  const [form, setForm] = useState({ total_saved: '', goal_amount: '', goal_date: '' });
  const [accountForm, setAccountForm] = useState({ name: '', type: 'account' as SavingsAccountType, amount: '' });
  const [debtForm, setDebtForm] = useState({ name: '', total_amount: '', remaining_amount: '', interest_rate: '', minimum_payment: '', due_date: '' });
  const [reserveForm, setReserveForm] = useState({ months: '6', type: 'auto' as 'auto' | 'manual', manual_goal: '' });
  const seededDefaults = useRef(false);

  const monthlyIncome = income.filter(i => i.status === 'received').reduce((s, i) => s + Number(i.amount), 0);
  const avgExpenses = totalExpenses; // current month expenses as proxy
  const monthlySavingsRate = Math.max(0, monthlyIncome - totalExpenses);

  const savedFromRow = Number(savings?.total_saved ?? 0);
  const saved = accounts.length > 0 ? totals.liquid : savedFromRow;
  const availableLimits = totals.limits;
  const investments = totals.investments;
  const goal = Number(savings?.goal_amount ?? 0);
  const savingsPercent = goal > 0 ? Math.min((saved / goal) * 100, 100) : 0;

  const accountTypes = useMemo(() => ({
    account: { label: t('savings.accountType.account'), color: '#22c55e', Icon: Wallet },
    investment: { label: t('savings.accountType.investment'), color: '#3b82f6', Icon: LineChart },
    card_limit: { label: t('savings.accountType.cardLimit'), color: '#a855f7', Icon: CreditCard },
    overdraft: { label: t('savings.accountType.overdraft'), color: '#f59e0b', Icon: Landmark },
    cash: { label: t('savings.accountType.cash'), color: '#14b8a6', Icon: Banknote },
    other: { label: t('savings.accountType.other'), color: '#94a3b8', Icon: PiggyBank },
  }), [t]);

  useEffect(() => {
    if (seededDefaults.current || accounts.length > 0 || savedFromRow <= 0) return;
    seededDefaults.current = true;
    seedDefaultAccounts.mutateAsync(savedFromRow).catch((e: any) => {
      console.error(e);
      seededDefaults.current = false;
    });
  }, [accounts.length, savedFromRow, seedDefaultAccounts]);

  useEffect(() => {
    if (accounts.length === 0 || !savings || Math.abs(Number(savings.total_saved ?? 0) - saved) < 0.01) return;
    upsertSavings.mutate({
      total_saved: saved,
      goal_amount: Number(savings.goal_amount ?? 0),
      goal_date: savings.goal_date || undefined,
    });
  }, [accounts.length, saved, savings, upsertSavings]);

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

  const openAccountDialog = (account?: SavingsAccount) => {
    setEditingAccount(account ?? null);
    setAccountForm({
      name: account?.name ?? '',
      type: account?.type ?? 'account',
      amount: String(account?.amount ?? ''),
    });
    setAccountOpen(true);
  };

  const handleSaveAccount = async () => {
    if (!accountForm.name.trim()) return;
    const meta = accountTypes[accountForm.type];
    const payload = {
      name: accountForm.name.trim(),
      type: accountForm.type,
      amount: Number(accountForm.amount || 0),
      color: meta.color,
    };

    try {
      if (editingAccount) {
        await updateAccount.mutateAsync({ id: editingAccount.id, ...payload });
      } else {
        await addAccount.mutateAsync(payload);
      }
      setAccountOpen(false);
      setEditingAccount(null);
      setAccountForm({ name: '', type: 'account', amount: '' });
      toast({ title: t('common.saved'), description: t('savings.accountSaved') });
    } catch (e: any) {
      console.error(e);
      toast({ title: 'Erro', description: getFriendlyErrorMessage(e), variant: 'destructive' });
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
  const canPaySmallestDebt = sortedDebts[0] && saved >= Number(sortedDebts[0].remaining_amount);

  return (
    <div className="space-y-6">
      <ConfettiOverlay show={showConfetti} />

      <div className="flex items-center justify-between">
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
          <h1 className="text-3xl font-bold font-display text-gradient-silver">{t('savings.title')}</h1>
        </motion.div>
        <Button variant="outline" onClick={startEdit} className="border-border">
          <Edit2 className="h-4 w-4 mr-1" /> {t('common.edit')}
        </Button>
      </div>

      {editing ? (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="glass-card p-6 space-y-4">
          <div>
            <label className="text-sm text-muted-foreground">{t('savings.savedValue')}</label>
            <Input type="number" value={form.total_saved} onChange={e => setForm({ ...form, total_saved: e.target.value })} className="bg-secondary border-border" />
          </div>
          <div>
            <label className="text-sm text-muted-foreground">{t('savings.goalAmount')}</label>
            <Input type="number" value={form.goal_amount} onChange={e => setForm({ ...form, goal_amount: e.target.value })} className="bg-secondary border-border" />
          </div>
          <div>
            <label className="text-sm text-muted-foreground">{t('savings.goalDate')}</label>
            <Input type="date" value={form.goal_date} onChange={e => setForm({ ...form, goal_date: e.target.value })} className="bg-secondary border-border" />
          </div>
          <div className="flex gap-2">
            <Button onClick={handleSave} className="gradient-silver text-primary-foreground">{t('common.save')}</Button>
            <Button variant="outline" onClick={() => setEditing(false)}>Cancelar</Button>
          </div>
        </motion.div>
      ) : (
        <div className="space-y-6">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="glass-card p-8">
            <div className="flex flex-col gap-4 mb-6 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex items-center gap-4">
              <div className="p-3 rounded-xl bg-accent">
                <PiggyBank className="h-8 w-8 text-silver" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">{t('savings.totalSaved')}</p>
                <motion.p
                  key={saved}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="text-4xl font-bold font-display text-foreground"
                >
                  {money(saved)}
                </motion.p>
              </div>
              </div>
              <Button onClick={startEdit} className="w-full sm:w-auto gradient-silver text-primary-foreground">
                <Edit2 className="h-4 w-4 mr-1" /> {t('savings.changeSaved')}
              </Button>
            </div>
            <ProgressBar value={saved} max={goal || 1} label={`${t('savings.goal')}: ${money(goal)}`} glow={savingsPercent >= 100} />
            <p className="text-xs text-muted-foreground mt-3">
              {t('savings.adjustHelp')}
            </p>
            {savings?.goal_date && (
              <p className="text-sm text-muted-foreground mt-3">
                {t('savings.deadline')}: {new Date(savings.goal_date + 'T00:00:00').toLocaleDateString(locale)}
              </p>
            )}
          </motion.div>
        </div>
      )}

      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.08 }} className="glass-card p-6 space-y-5">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="text-xl font-bold font-display text-foreground">{t('savings.moneyMap')}</h2>
            <p className="text-sm text-muted-foreground">{t('savings.moneyMapText')}</p>
          </div>
          <Button onClick={() => openAccountDialog()} size="sm" className="gradient-silver text-primary-foreground">
            <Plus className="h-4 w-4 mr-1" /> {t('savings.addMoneyType')}
          </Button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div className="p-4 rounded-xl bg-secondary/50 border border-border/50">
            <p className="text-xs uppercase tracking-widest text-muted-foreground">{t('savings.realMoney')}</p>
            <p className="text-2xl font-bold text-foreground mt-2">{money(saved)}</p>
          </div>
          <div className="p-4 rounded-xl bg-secondary/50 border border-border/50">
            <p className="text-xs uppercase tracking-widest text-muted-foreground">{t('savings.investments')}</p>
            <p className="text-2xl font-bold text-foreground mt-2">{money(investments)}</p>
          </div>
          <div className="p-4 rounded-xl bg-secondary/50 border border-border/50">
            <p className="text-xs uppercase tracking-widest text-muted-foreground">{t('savings.limitsCredit')}</p>
            <p className="text-2xl font-bold text-foreground mt-2">{money(availableLimits)}</p>
            <p className="text-xs text-muted-foreground mt-1">{t('savings.limitsHint')}</p>
          </div>
        </div>

        {accounts.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {accounts.map(account => {
              const meta = accountTypes[account.type] ?? accountTypes.other;
              const Icon = meta.Icon;
              return (
                <div key={account.id} className="flex items-center justify-between gap-3 rounded-xl bg-secondary/40 border border-border/50 p-4">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="h-10 w-10 rounded-lg flex items-center justify-center" style={{ backgroundColor: `${account.color}22`, color: account.color }}>
                      <Icon className="h-5 w-5" />
                    </div>
                    <div className="min-w-0">
                      <p className="font-semibold text-foreground truncate">{account.name}</p>
                      <p className="text-xs text-muted-foreground">{meta.label}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <p className="font-semibold text-foreground whitespace-nowrap">{money(account.amount)}</p>
                    <button onClick={() => openAccountDialog(account)} aria-label={t('common.edit')} className="text-muted-foreground hover:text-foreground">
                      <Edit2 className="h-4 w-4" />
                    </button>
                    <button onClick={() => deleteAccount.mutateAsync(account.id)} aria-label="Excluir" className="text-muted-foreground hover:text-destructive">
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="rounded-xl bg-secondary/30 border border-border/50 p-4 text-sm text-muted-foreground">
            {t('savings.noMoneyTypes')}
          </div>
        )}

        <Dialog open={accountOpen} onOpenChange={setAccountOpen}>
          <DialogContent className="bg-card border-border">
            <DialogHeader>
              <DialogTitle className="font-display">{editingAccount ? t('savings.editMoneyType') : t('savings.addMoneyType')}</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <label className="text-sm text-muted-foreground mb-1 block">{t('savings.moneyTypeName')}</label>
                <Input value={accountForm.name} onChange={e => setAccountForm({ ...accountForm, name: e.target.value })} className="bg-secondary border-border" placeholder="Ex: Nubank, Investimentos, Limite especial" />
              </div>
              <div>
                <label className="text-sm text-muted-foreground mb-1 block">{t('savings.moneyType')}</label>
                <Select value={accountForm.type} onValueChange={(value: SavingsAccountType) => setAccountForm({ ...accountForm, type: value })}>
                  <SelectTrigger className="bg-secondary border-border"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {(Object.keys(accountTypes) as SavingsAccountType[]).map(type => (
                      <SelectItem key={type} value={type}>{accountTypes[type].label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <label className="text-sm text-muted-foreground mb-1 block">{t('savings.moneyTypeAmount')}</label>
                <Input type="number" value={accountForm.amount} onChange={e => setAccountForm({ ...accountForm, amount: e.target.value })} className="bg-secondary border-border" placeholder="0,00" />
              </div>
              <Button onClick={handleSaveAccount} className="w-full gradient-silver text-primary-foreground">{t('common.save')}</Button>
            </div>
          </DialogContent>
        </Dialog>
      </motion.div>

      {/* Emergency Reserve Section */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }}>
        <div className="glass-card p-6 space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-accent">
                <Shield className="h-5 w-5 text-silver" />
              </div>
              <div>
                <h2 className="font-semibold text-foreground">{t('savings.emergencyReserve')}</h2>
                <p className="text-xs text-muted-foreground">
                  {reserveForm.type === 'auto' ? `Baseada em ${reserveMonths} meses de despesas` : 'Meta manual'}
                </p>
              </div>
            </div>
            <Dialog open={reserveOpen} onOpenChange={setReserveOpen}>
              <DialogTrigger asChild>
                <Button variant="outline" size="sm" className="border-border">
                  <Edit2 className="h-3.5 w-3.5 mr-1" /> {t('savings.editReserve')}
                </Button>
              </DialogTrigger>
              <DialogContent className="bg-card border-border">
                <DialogHeader><DialogTitle className="font-display">{t('savings.emergencyReserve')}</DialogTitle></DialogHeader>
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
                  <Button onClick={handleSaveReserve} className="w-full gradient-silver text-primary-foreground">{t('common.save')}</Button>
                </div>
              </DialogContent>
            </Dialog>
          </div>

          {/* Reserve progress */}
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Atual: {money(saved)}</span>
              <span className="text-muted-foreground">{t('savings.goal')}: {money(idealReserve)}</span>
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
        <h2 className="text-xl font-bold font-display text-foreground mb-4">{t('savings.debtsPlan')}</h2>

        <div className="glass-card p-6 space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-accent">
                <TrendingDown className="h-5 w-5 text-destructive" />
              </div>
              <div>
                <h2 className="font-semibold text-foreground">{t('savings.myDebts')}</h2>
                <p className="text-sm text-muted-foreground">{t('common.total')}: {money(totalDebt)}</p>
              </div>
            </div>
            <Dialog open={debtOpen} onOpenChange={setDebtOpen}>
              <DialogTrigger asChild>
                <Button size="sm" className="gradient-silver text-primary-foreground">
                  <Plus className="h-4 w-4 mr-1" /> {t('savings.addDebt')}
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
                      <span>{t('savings.remaining')}: {money(Number(debt.remaining_amount))}</span>
                      <span>Juros: {Number(debt.interest_rate)}%</span>
                      {debt.due_date && <span>{t('savings.due')}: {new Date(debt.due_date + 'T00:00:00').toLocaleDateString(locale)}</span>}
                    </div>
                    <ProgressBar value={progress} max={100} label={`${Math.round(progress)}% quitado`} />
                  </motion.div>
                );
              })}
            </div>
          ) : (
            <p className="text-sm text-muted-foreground text-center py-4">{t('savings.noDebts')}</p>
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
                <h2 className="font-semibold text-foreground">{t('savings.smartPlanTitle')}</h2>
                <p className="text-xs text-muted-foreground">{t('savings.smartPlanSubtitle')}</p>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="p-3 rounded-lg bg-secondary/50 border border-border/50">
                <p className="text-xs text-muted-foreground">{t('savings.realMoney')}</p>
                <p className="font-semibold text-foreground">{money(saved)}</p>
              </div>
              <div className="p-3 rounded-lg bg-secondary/50 border border-border/50">
                <p className="text-xs text-muted-foreground">{t('savings.limitsCredit')}</p>
                <p className="font-semibold text-foreground">{money(availableLimits)}</p>
              </div>
              <div className="p-3 rounded-lg bg-secondary/50 border border-border/50">
                <p className="text-xs text-muted-foreground">{t('savings.monthlySuggestion')}</p>
                <p className="font-semibold text-foreground">{money(suggestedPayment)}</p>
              </div>
            </div>

            <div className="p-4 rounded-xl bg-accent/50 border border-border/50">
              {canPaySmallestDebt ? (
                <p className="text-sm text-foreground">{t('savings.canPaySmallest', { debt: sortedDebts[0].name })}</p>
              ) : suggestedPayment > 0 && monthsToFree > 0 ? (
                <p className="text-sm text-foreground">{t('savings.freeInMonths', { value: money(suggestedPayment), months: monthsToFree })}</p>
              ) : (
                <p className="text-sm text-foreground">{t('savings.noPayoffMargin')}</p>
              )}
            </div>

            {sortedDebts.length > 1 && (
              <div>
                <p className="text-xs text-muted-foreground mb-2">{t('savings.payoffOrder')}</p>
                <div className="space-y-1">
                  {sortedDebts.map((d, i) => (
                    <div key={d.id} className="flex items-center gap-2 text-sm">
                      <span className="w-5 h-5 rounded-full bg-accent flex items-center justify-center text-xs font-bold text-foreground">{i + 1}</span>
                      <span className="text-foreground">{d.name}</span>
                      <span className="text-muted-foreground">- {money(Number(d.remaining_amount))}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </motion.div>
        )}

        {/* Legacy payoff plan kept disabled after the smarter money-map plan above. */}
        {false && debts.length > 0 && (
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
