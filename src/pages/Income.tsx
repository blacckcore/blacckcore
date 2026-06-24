import { getFriendlyErrorMessage } from '@/lib/errors';
import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, Trash2, Edit2, DollarSign, Briefcase, Laptop, TrendingUp, Coins, CreditCard, Banknote, Gem, Filter, Palette } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { StatCard } from '@/components/StatCard';
import { useIncome } from '@/hooks/useIncome';
import { useIncomeTypes, INCOME_COLORS, INCOME_ICONS } from '@/hooks/useIncomeTypes';
import { useToast } from '@/hooks/use-toast';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { localDateString } from '@/lib/dates';

const ICON_COMPONENTS: Record<string, any> = { DollarSign, Briefcase, Laptop, TrendingUp, Coins, CreditCard, Banknote, Gem };

const formatCurrency = (value: number) =>
  new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);

export default function Income() {
  const { income, totalPending, totalReceived, addIncome, updateIncome, deleteIncome } = useIncome();
  const { incomeTypes, seedDefaults, addType, deleteType, loading: typesLoading } = useIncomeTypes();
  const { toast } = useToast();
  const [open, setOpen] = useState(false);
  const [typeOpen, setTypeOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [filterType, setFilterType] = useState<string>('all');
  const [form, setForm] = useState({ source: '', amount: '', expected_date: localDateString(), status: 'pending', income_type_id: '' });
  const [newType, setNewType] = useState({ name: '', color: INCOME_COLORS[0], icon: 'DollarSign' });

  // Seed defaults if no types exist
  useEffect(() => {
    if (!typesLoading && incomeTypes.length === 0) {
      seedDefaults.mutateAsync();
    }
  }, [typesLoading, incomeTypes.length]);

  const handleSubmit = async () => {
    if (!form.source || !form.amount) return;
    try {
      const payload = { 
        source: form.source, 
        amount: Number(form.amount), 
        expected_date: form.expected_date, 
        status: form.status,
        income_type_id: form.income_type_id || null,
      };
      if (editingId) {
        await updateIncome.mutateAsync({ id: editingId, ...payload });
        setEditingId(null);
      } else {
        await addIncome.mutateAsync(payload);
      }
      setForm({ source: '', amount: '', expected_date: localDateString(), status: 'pending', income_type_id: '' });
      setOpen(false);
    } catch (e: any) {
      console.error(e); toast({ title: 'Erro', description: getFriendlyErrorMessage(e), variant: 'destructive' });
    }
  };

  const handleAddType = async () => {
    if (!newType.name) return;
    await addType.mutateAsync(newType);
    setNewType({ name: '', color: INCOME_COLORS[0], icon: 'DollarSign' });
    setTypeOpen(false);
  };

  const filteredIncome = filterType === 'all' ? income : income.filter(i => (i as any).income_type_id === filterType);

  // Analytics by source
  const byType = incomeTypes.map(t => {
    const items = income.filter(i => (i as any).income_type_id === t.id);
    const total = items.reduce((s, i) => s + Number(i.amount), 0);
    return { ...t, total, count: items.length };
  }).filter(t => t.count > 0);

  const getTypeForItem = (item: any) => incomeTypes.find(t => t.id === item.income_type_id);

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
          <h1 className="text-3xl font-bold font-display text-gradient-silver">A Receber</h1>
        </motion.div>
        <div className="flex gap-2">
          <Dialog open={typeOpen} onOpenChange={setTypeOpen}>
            <DialogTrigger asChild>
              <Button variant="outline" size="sm" className="border-border">
                <Palette className="h-4 w-4 mr-1" /> Tipos
              </Button>
            </DialogTrigger>
            <DialogContent className="bg-card border-border">
              <DialogHeader><DialogTitle className="font-display">Tipos de Renda</DialogTitle></DialogHeader>
              <div className="space-y-4">
                <div className="space-y-2">
                  {incomeTypes.map(t => {
                    const IconComp = ICON_COMPONENTS[t.icon] || DollarSign;
                    return (
                      <div key={t.id} className="flex items-center gap-3 p-2 rounded-lg bg-secondary/50">
                        <div className="w-3 h-3 rounded-full" style={{ backgroundColor: t.color }} />
                        <IconComp className="h-4 w-4 text-muted-foreground" />
                        <span className="flex-1 text-sm">{t.name}</span>
                        <button onClick={() => deleteType.mutateAsync(t.id)} aria-label={`Excluir tipo ${t.name}`} className="text-muted-foreground hover:text-destructive">
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
                      {INCOME_COLORS.map(c => (
                        <button key={c} onClick={() => setNewType({ ...newType, color: c })} className={`w-6 h-6 rounded-full border-2 transition-all ${newType.color === c ? 'border-foreground scale-110' : 'border-transparent'}`} style={{ backgroundColor: c }} />
                      ))}
                    </div>
                  </div>
                  <div className="flex gap-1 flex-wrap">
                    {INCOME_ICONS.map(iconName => {
                      const IC = ICON_COMPONENTS[iconName] || DollarSign;
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
          <Dialog open={open} onOpenChange={v => { setOpen(v); if (!v) setEditingId(null); }}>
            <DialogTrigger asChild>
              <Button className="gradient-silver text-primary-foreground">
                <Plus className="h-4 w-4 mr-1" /> Adicionar
              </Button>
            </DialogTrigger>
            <DialogContent className="bg-card border-border">
              <DialogHeader><DialogTitle className="font-display">{editingId ? 'Editar' : 'Novo'} Recebimento</DialogTitle></DialogHeader>
              <div className="space-y-3">
                <Input placeholder="Descrição" value={form.source} onChange={e => setForm({ ...form, source: e.target.value })} className="bg-secondary border-border" />
                <Select value={form.income_type_id || 'none'} onValueChange={v => setForm({ ...form, income_type_id: v === 'none' ? '' : v })}>
                  <SelectTrigger className="bg-secondary border-border"><SelectValue placeholder="Tipo" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">Sem tipo</SelectItem>
                    {incomeTypes.map(t => <SelectItem key={t.id} value={t.id}>{t.name}</SelectItem>)}
                  </SelectContent>
                </Select>
                <Input type="number" placeholder="Valor" value={form.amount} onChange={e => setForm({ ...form, amount: e.target.value })} className="bg-secondary border-border" />
                <Input type="date" value={form.expected_date} onChange={e => setForm({ ...form, expected_date: e.target.value })} className="bg-secondary border-border" />
                <Select value={form.status} onValueChange={v => setForm({ ...form, status: v })}>
                  <SelectTrigger className="bg-secondary border-border"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="pending">Pendente</SelectItem>
                    <SelectItem value="received">Recebido</SelectItem>
                  </SelectContent>
                </Select>
                <Button onClick={handleSubmit} className="w-full gradient-silver text-primary-foreground">{editingId ? 'Salvar' : 'Adicionar'}</Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <StatCard title="Pendente" value={formatCurrency(totalPending)} icon={DollarSign} />
        <StatCard title="Recebido" value={formatCurrency(totalReceived)} icon={DollarSign} delay={0.1} />
      </div>

      {/* Analytics by type */}
      {byType.length > 0 && (
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="glass-card p-4">
          <h2 className="text-sm font-semibold text-muted-foreground mb-3">Por Tipo</h2>
          <div className="flex gap-3 flex-wrap">
            {byType.map(t => {
              const IC = ICON_COMPONENTS[t.icon] || DollarSign;
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
            {incomeTypes.map(t => <SelectItem key={t.id} value={t.id}>{t.name}</SelectItem>)}
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-2">
        <AnimatePresence mode="popLayout">
          {filteredIncome.map((item, i) => {
            const type = getTypeForItem(item);
            const IC = type ? (ICON_COMPONENTS[type.icon] || DollarSign) : DollarSign;
            return (
              <motion.div
                key={item.id}
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
                    <p className="font-medium text-foreground">{item.source}</p>
                    <div className="flex gap-2 text-xs text-muted-foreground">
                      {type && <span>{type.name}</span>}
                      {type && <span>•</span>}
                      <span>{new Date(item.expected_date + 'T00:00:00').toLocaleDateString('pt-BR')}</span>
                      <span>•</span>
                      <span className={item.status === 'received' ? 'text-success' : 'text-warning'}>{item.status === 'received' ? 'Recebido' : 'Pendente'}</span>
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <span className="font-semibold text-foreground">{formatCurrency(Number(item.amount))}</span>
                  <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button onClick={() => { setForm({ source: item.source, amount: String(item.amount), expected_date: item.expected_date, status: item.status, income_type_id: (item as any).income_type_id || '' }); setEditingId(item.id); setOpen(true); }} aria-label={`Editar receita ${item.source}`} className="text-muted-foreground hover:text-foreground"><Edit2 className="h-4 w-4" /></button>
                    <button onClick={() => deleteIncome.mutateAsync(item.id)} aria-label={`Excluir receita ${item.source}`} className="text-muted-foreground hover:text-destructive"><Trash2 className="h-4 w-4" /></button>
                  </div>
                </div>
              </motion.div>
            );
          })}
        </AnimatePresence>
        {filteredIncome.length === 0 && <div className="text-center py-12 text-muted-foreground">Nenhum recebimento encontrado</div>}
      </div>
    </div>
  );
}
