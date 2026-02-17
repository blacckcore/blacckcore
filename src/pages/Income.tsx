import { useState } from 'react';
import { motion } from 'framer-motion';
import { Plus, Trash2, Edit2, DollarSign } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { StatCard } from '@/components/StatCard';
import { useIncome } from '@/hooks/useIncome';
import { useToast } from '@/hooks/use-toast';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';

const formatCurrency = (value: number) =>
  new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);

export default function Income() {
  const { income, totalPending, totalReceived, addIncome, updateIncome, deleteIncome } = useIncome();
  const { toast } = useToast();
  const [open, setOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState({ source: '', amount: '', expected_date: new Date().toISOString().split('T')[0], status: 'pending' });

  const sources = ['Salário', 'Freelance', 'Comissão', 'Investimento', 'Outro'];

  const handleSubmit = async () => {
    if (!form.source || !form.amount) return;
    try {
      if (editingId) {
        await updateIncome.mutateAsync({ id: editingId, ...form, amount: Number(form.amount) });
        setEditingId(null);
      } else {
        await addIncome.mutateAsync({ ...form, amount: Number(form.amount) });
      }
      setForm({ source: '', amount: '', expected_date: new Date().toISOString().split('T')[0], status: 'pending' });
      setOpen(false);
    } catch (e: any) {
      toast({ title: 'Erro', description: e.message, variant: 'destructive' });
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
          <h1 className="text-3xl font-bold font-display text-gradient-silver">A Receber</h1>
        </motion.div>
        <Dialog open={open} onOpenChange={v => { setOpen(v); if (!v) setEditingId(null); }}>
          <DialogTrigger asChild>
            <Button className="gradient-silver text-primary-foreground">
              <Plus className="h-4 w-4 mr-1" /> Adicionar
            </Button>
          </DialogTrigger>
          <DialogContent className="bg-card border-border">
            <DialogHeader><DialogTitle className="font-display">{editingId ? 'Editar' : 'Novo'} Recebimento</DialogTitle></DialogHeader>
            <div className="space-y-3">
              <Select value={form.source} onValueChange={v => setForm({ ...form, source: v })}>
                <SelectTrigger className="bg-secondary border-border"><SelectValue placeholder="Fonte" /></SelectTrigger>
                <SelectContent>{sources.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}</SelectContent>
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

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <StatCard title="Pendente" value={formatCurrency(totalPending)} icon={DollarSign} />
        <StatCard title="Recebido" value={formatCurrency(totalReceived)} icon={DollarSign} delay={0.1} />
      </div>

      <div className="space-y-2">
        {income.map((item, i) => (
          <motion.div key={item.id} initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.05 }} className="glass-card p-4 flex items-center justify-between">
            <div className="flex-1 min-w-0">
              <p className="font-medium text-foreground">{item.source}</p>
              <div className="flex gap-2 text-xs text-muted-foreground">
                <span>{new Date(item.expected_date + 'T00:00:00').toLocaleDateString('pt-BR')}</span>
                <span>•</span>
                <span className={item.status === 'received' ? 'text-success' : 'text-warning'}>{item.status === 'received' ? 'Recebido' : 'Pendente'}</span>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <span className="font-semibold text-foreground">{formatCurrency(Number(item.amount))}</span>
              <button onClick={() => { setForm({ source: item.source, amount: String(item.amount), expected_date: item.expected_date, status: item.status }); setEditingId(item.id); setOpen(true); }} className="text-muted-foreground hover:text-foreground"><Edit2 className="h-4 w-4" /></button>
              <button onClick={() => deleteIncome.mutateAsync(item.id)} className="text-muted-foreground hover:text-destructive"><Trash2 className="h-4 w-4" /></button>
            </div>
          </motion.div>
        ))}
        {income.length === 0 && <div className="text-center py-12 text-muted-foreground">Nenhum recebimento cadastrado</div>}
      </div>
    </div>
  );
}
