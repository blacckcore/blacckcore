import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, Trash2, Edit2, Palette, Filter, UtensilsCrossed, Home, Car, Gamepad2, Heart, GraduationCap, CreditCard, AlertTriangle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useExpenses } from '@/hooks/useExpenses';
import { useExpenseTypes, EXPENSE_COLORS, EXPENSE_ICONS } from '@/hooks/useExpenseTypes';
import { useToast } from '@/hooks/use-toast';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';

const ICON_COMPONENTS: Record<string, any> = { UtensilsCrossed, Home, Car, Gamepad2, Heart, GraduationCap, CreditCard, AlertTriangle };

const formatCurrency = (value: number) =>
  new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);

export default function Expenses() {
  const [month, setMonth] = useState(new Date().getMonth() + 1);
  const [year] = useState(new Date().getFullYear());
  const { expenses, total, addExpense, updateExpense, deleteExpense } = useExpenses(month, year);
  const { expenseTypes, seedDefaults, addType, deleteType, loading: typesLoading } = useExpenseTypes();
  const { toast } = useToast();
  const [open, setOpen] = useState(false);
  const [typeOpen, setTypeOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [filterType, setFilterType] = useState<string>('all');
  const [form, setForm] = useState({ name: '', expense_type_id: '', amount: '', date: new Date().toISOString().split('T')[0], status: 'pending' });
  const [newType, setNewType] = useState({ name: '', color: EXPENSE_COLORS[0], icon: 'CreditCard' });

  // Seed defaults if no types exist
  useEffect(() => {
    if (!typesLoading && expenseTypes.length === 0) {
      seedDefaults.mutateAsync();
    }
  }, [typesLoading, expenseTypes.length]);

  const handleSubmit = async () => {
    if (!form.name || !form.amount) return;
    try {
      const payload = {
        name: form.name,
        amount: Number(form.amount),
        date: form.date,
        status: form.status,
        expense_type_id: form.expense_type_id || null,
        category_id: undefined,
      };
      if (editingId) {
        await updateExpense.mutateAsync({ id: editingId, ...payload });
        setEditingId(null);
      } else {
        await addExpense.mutateAsync(payload);
      }
      setForm({ name: '', expense_type_id: '', amount: '', date: new Date().toISOString().split('T')[0], status: 'pending' });
      setOpen(false);
    } catch (e: any) {
      toast({ title: 'Erro', description: e.message, variant: 'destructive' });
    }
  };

  const handleAddType = async () => {
    if (!newType.name) return;
    await addType.mutateAsync(newType);
    setNewType({ name: '', color: EXPENSE_COLORS[0], icon: 'CreditCard' });
    setTypeOpen(false);
  };

  const startEdit = (exp: any) => {
    setForm({ name: exp.name, expense_type_id: exp.expense_type_id || '', amount: String(exp.amount), date: exp.date, status: exp.status });
    setEditingId(exp.id);
    setOpen(true);
  };

  const filteredExpenses = filterType === 'all' ? expenses : expenses.filter((e: any) => e.expense_type_id === filterType);
  const getTypeForItem = (item: any) => expenseTypes.find(t => t.id === item.expense_type_id);

  const months = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'];

  // Analytics by type
  const byType = expenseTypes.map(t => {
    const items = expenses.filter((e: any) => e.expense_type_id === t.id);
    const typeTotal = items.reduce((s, e) => s + Number(e.amount), 0);
    return { ...t, total: typeTotal, count: items.length };
  }).filter(t => t.count > 0);

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
          <h1 className="text-3xl font-bold font-display text-gradient-silver">Despesas</h1>
          <p className="text-muted-foreground text-sm">Total: {formatCurrency(total)}</p>
        </motion.div>
        <div className="flex gap-2 items-center">
          <Select value={String(month)} onValueChange={(v) => setMonth(Number(v))}>
            <SelectTrigger className="w-28 bg-secondary border-border">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {months.map((m, i) => (
                <SelectItem key={i} value={String(i + 1)}>{m}</SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Dialog open={typeOpen} onOpenChange={setTypeOpen}>
            <DialogTrigger asChild>
              <Button variant="outline" size="sm" className="border-border">
                <Palette className="h-4 w-4 mr-1" /> Tipos
              </Button>
            </DialogTrigger>
            <DialogContent className="bg-card border-border">
              <DialogHeader><DialogTitle className="font-display">Tipos de Despesa</DialogTitle></DialogHeader>
              <div className="space-y-4">
                <div className="space-y-2 max-h-60 overflow-y-auto">
                  {expenseTypes.map(t => {
                    const IconComp = ICON_COMPONENTS[t.icon] || CreditCard;
                    return (
                      <div key={t.id} className="flex items-center gap-3 p-2 rounded-lg bg-secondary/50">
                        <div className="w-3 h-3 rounded-full" style={{ backgroundColor: t.color }} />
                        <IconComp className="h-4 w-4 text-muted-foreground" />
                        <span className="flex-1 text-sm">{t.name}</span>
                        <button onClick={() => deleteType.mutateAsync(t.id)} className="text-muted-foreground hover:text-destructive">
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    );
                  })}
                </div>
                <div className="border-t border-border pt-3 space-y-2">
                  <Input placeholder="Nome do tipo" value={newType.name} onChange={e => setNewType({ ...newType, name: e.target.value })} className="bg-secondary border-border" />
                  <div className="flex gap-2">
                    <div className="flex gap-1 flex-wrap flex-1">
                      {EXPENSE_COLORS.map(c => (
                        <button key={c} onClick={() => setNewType({ ...newType, color: c })} className={`w-6 h-6 rounded-full border-2 transition-all ${newType.color === c ? 'border-foreground scale-110' : 'border-transparent'}`} style={{ backgroundColor: c }} />
                      ))}
                    </div>
                  </div>
                  <div className="flex gap-1 flex-wrap">
                    {EXPENSE_ICONS.map(iconName => {
                      const IC = ICON_COMPONENTS[iconName] || CreditCard;
                      return (
                        <button key={iconName} onClick={() => setNewType({ ...newType, icon: iconName })} className={`p-1.5 rounded-md transition-all ${newType.icon === iconName ? 'bg-accent text-foreground' : 'text-muted-foreground hover:text-foreground'}`}>
                          <IC className="h-4 w-4" />
                        </button>
                      );
                    })}
                  </div>
                  <Button onClick={handleAddType} className="w-full gradient-silver text-primary-foreground" size="sm">Criar Tipo</Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>

          <Dialog open={open} onOpenChange={(v) => { setOpen(v); if (!v) setEditingId(null); }}>
            <DialogTrigger asChild>
              <Button className="gradient-silver text-primary-foreground">
                <Plus className="h-4 w-4 mr-1" /> Adicionar
              </Button>
            </DialogTrigger>
            <DialogContent className="bg-card border-border">
              <DialogHeader>
                <DialogTitle className="font-display">{editingId ? 'Editar' : 'Nova'} Despesa</DialogTitle>
              </DialogHeader>
              <div className="space-y-3">
                <Input placeholder="Nome" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} className="bg-secondary border-border" />
                <Select value={form.expense_type_id || 'none'} onValueChange={v => setForm({ ...form, expense_type_id: v === 'none' ? '' : v })}>
                  <SelectTrigger className="bg-secondary border-border"><SelectValue placeholder="Tipo" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">Sem tipo</SelectItem>
                    {expenseTypes.map(t => <SelectItem key={t.id} value={t.id}>{t.name}</SelectItem>)}
                  </SelectContent>
                </Select>
                <Input type="number" placeholder="Valor" value={form.amount} onChange={e => setForm({ ...form, amount: e.target.value })} className="bg-secondary border-border" />
                <Input type="date" value={form.date} onChange={e => setForm({ ...form, date: e.target.value })} className="bg-secondary border-border" />
                <Select value={form.status} onValueChange={v => setForm({ ...form, status: v })}>
                  <SelectTrigger className="bg-secondary border-border"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="pending">Não pago</SelectItem>
                    <SelectItem value="paid">Pago</SelectItem>
                  </SelectContent>
                </Select>
                <Button onClick={handleSubmit} className="w-full gradient-silver text-primary-foreground">
                  {editingId ? 'Salvar' : 'Adicionar'}
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Analytics by type */}
      {byType.length > 0 && (
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="glass-card p-4">
          <h3 className="text-sm font-semibold text-muted-foreground mb-3">Por Tipo</h3>
          <div className="flex gap-3 flex-wrap">
            {byType.map(t => {
              const IC = ICON_COMPONENTS[t.icon] || CreditCard;
              return (
                <motion.div key={t.id} whileHover={{ scale: 1.05 }} className="flex items-center gap-2 px-3 py-2 rounded-lg bg-secondary/50 border border-border/50">
                  <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: t.color }} />
                  <IC className="h-3.5 w-3.5 text-muted-foreground" />
                  <span className="text-xs font-medium">{t.name}</span>
                  <span className="text-xs text-muted-foreground">{formatCurrency(t.total)}</span>
                </motion.div>
              );
            })}
          </div>
        </motion.div>
      )}

      {/* Filter */}
      <div className="flex items-center gap-2">
        <Filter className="h-4 w-4 text-muted-foreground" />
        <Select value={filterType} onValueChange={setFilterType}>
          <SelectTrigger className="w-48 bg-secondary border-border h-8 text-sm"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos</SelectItem>
            {expenseTypes.map(t => <SelectItem key={t.id} value={t.id}>{t.name}</SelectItem>)}
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-2">
        <AnimatePresence mode="popLayout">
          {filteredExpenses.map((exp, i) => {
            const type = getTypeForItem(exp);
            const IC = type ? (ICON_COMPONENTS[type.icon] || CreditCard) : CreditCard;
            return (
              <motion.div
                key={exp.id}
                layout
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                transition={{ delay: i * 0.03 }}
                whileHover={{ scale: 1.01, x: 4 }}
                className="glass-card p-4 flex items-center justify-between group"
              >
                <div className="flex items-center gap-3 flex-1 min-w-0">
                  {type && <div className="w-2 h-8 rounded-full" style={{ backgroundColor: type.color }} />}
                  <div className="p-1.5 rounded-md bg-accent">
                    <IC className="h-4 w-4 text-silver" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-foreground truncate">{exp.name}</p>
                    <div className="flex gap-2 text-xs text-muted-foreground">
                      {type && <span>{type.name}</span>}
                      {type && <span>•</span>}
                      <span>{new Date(exp.date + 'T00:00:00').toLocaleDateString('pt-BR')}</span>
                      <span>•</span>
                      <span className={exp.status === 'paid' ? 'text-success' : 'text-warning'}>
                        {exp.status === 'paid' ? 'Pago' : 'Pendente'}
                      </span>
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <span className="font-semibold text-foreground">{formatCurrency(Number(exp.amount))}</span>
                  <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button onClick={() => startEdit(exp)} className="text-muted-foreground hover:text-foreground transition-colors">
                      <Edit2 className="h-4 w-4" />
                    </button>
                    <button onClick={() => deleteExpense.mutateAsync(exp.id)} className="text-muted-foreground hover:text-destructive transition-colors">
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              </motion.div>
            );
          })}
        </AnimatePresence>
        {filteredExpenses.length === 0 && (
          <div className="text-center py-12 text-muted-foreground">
            Nenhuma despesa neste mês
          </div>
        )}
      </div>
    </div>
  );
}
