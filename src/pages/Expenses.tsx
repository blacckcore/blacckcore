import { useState } from 'react';
import { motion } from 'framer-motion';
import { Plus, Trash2, Edit2, Check, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useExpenses } from '@/hooks/useExpenses';
import { useCategories } from '@/hooks/useCategories';
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

export default function Expenses() {
  const [month, setMonth] = useState(new Date().getMonth() + 1);
  const [year] = useState(new Date().getFullYear());
  const { expenses, total, addExpense, updateExpense, deleteExpense } = useExpenses(month, year);
  const { categories, addCategory } = useCategories();
  const { toast } = useToast();
  const [open, setOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState({ name: '', category_id: '', amount: '', date: new Date().toISOString().split('T')[0], status: 'pending' });
  const [newCategory, setNewCategory] = useState('');

  const handleSubmit = async () => {
    if (!form.name || !form.amount) return;
    try {
      if (editingId) {
        await updateExpense.mutateAsync({ id: editingId, ...form, amount: Number(form.amount), category_id: form.category_id || undefined });
        setEditingId(null);
      } else {
        await addExpense.mutateAsync({ ...form, amount: Number(form.amount), category_id: form.category_id || undefined });
      }
      setForm({ name: '', category_id: '', amount: '', date: new Date().toISOString().split('T')[0], status: 'pending' });
      setOpen(false);
    } catch (e: any) {
      toast({ title: 'Erro', description: e.message, variant: 'destructive' });
    }
  };

  const startEdit = (exp: any) => {
    setForm({ name: exp.name, category_id: exp.category_id || '', amount: String(exp.amount), date: exp.date, status: exp.status });
    setEditingId(exp.id);
    setOpen(true);
  };

  const months = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'];

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
                <Select value={form.category_id} onValueChange={v => setForm({ ...form, category_id: v })}>
                  <SelectTrigger className="bg-secondary border-border"><SelectValue placeholder="Categoria" /></SelectTrigger>
                  <SelectContent>
                    {categories.map(c => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}
                  </SelectContent>
                </Select>
                <div className="flex gap-2">
                  <Input placeholder="Nova categoria" value={newCategory} onChange={e => setNewCategory(e.target.value)} className="bg-secondary border-border" />
                  <Button variant="outline" size="sm" onClick={async () => { if (newCategory) { await addCategory.mutateAsync(newCategory); setNewCategory(''); } }}>+</Button>
                </div>
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

      <div className="space-y-2">
        {expenses.map((exp, i) => (
          <motion.div
            key={exp.id}
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: i * 0.05 }}
            className="glass-card p-4 flex items-center justify-between"
          >
            <div className="flex-1 min-w-0">
              <p className="font-medium text-foreground truncate">{exp.name}</p>
              <div className="flex gap-2 text-xs text-muted-foreground">
                <span>{(exp as any).categories?.name || 'Sem categoria'}</span>
                <span>•</span>
                <span>{new Date(exp.date + 'T00:00:00').toLocaleDateString('pt-BR')}</span>
                <span>•</span>
                <span className={exp.status === 'paid' ? 'text-success' : 'text-warning'}>
                  {exp.status === 'paid' ? 'Pago' : 'Pendente'}
                </span>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <span className="font-semibold text-foreground">{formatCurrency(Number(exp.amount))}</span>
              <button onClick={() => startEdit(exp)} className="text-muted-foreground hover:text-foreground transition-colors">
                <Edit2 className="h-4 w-4" />
              </button>
              <button onClick={() => deleteExpense.mutateAsync(exp.id)} className="text-muted-foreground hover:text-destructive transition-colors">
                <Trash2 className="h-4 w-4" />
              </button>
            </div>
          </motion.div>
        ))}
        {expenses.length === 0 && (
          <div className="text-center py-12 text-muted-foreground">
            Nenhuma despesa neste mês
          </div>
        )}
      </div>
    </div>
  );
}
