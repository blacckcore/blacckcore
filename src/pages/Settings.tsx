import { useState } from 'react';
import { motion } from 'framer-motion';
import { Trash2, Plus, Download, AlertTriangle, Bell } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import { useCategories } from '@/hooks/useCategories';
import { useAuth } from '@/lib/auth';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { getRemindersEnabled, setRemindersEnabled } from '@/hooks/useNotifications';

export default function SettingsPage() {
  const { categories, addCategory, deleteCategory } = useCategories();
  const { user, signOut } = useAuth();
  const { toast } = useToast();
  const [newCat, setNewCat] = useState('');
  const [reminders, setReminders] = useState(getRemindersEnabled);
  const [deleteConfirm, setDeleteConfirm] = useState(false);

  const handleExport = async () => {
    try {
      const { data: expenses } = await supabase.from('expenses').select('*');
      const { data: income } = await supabase.from('income').select('*');
      const { data: savings } = await supabase.from('savings').select('*');

      const csvData = [
        '--- DESPESAS ---',
        'Nome,Valor,Data,Status',
        ...(expenses ?? []).map(e => `${e.name},${e.amount},${e.date},${e.status}`),
        '',
        '--- RECEITAS ---',
        'Fonte,Valor,Data,Status',
        ...(income ?? []).map(i => `${i.source},${i.amount},${i.expected_date},${i.status}`),
        '',
        '--- ECONOMIA ---',
        'Total Guardado,Meta',
        ...(savings ?? []).map(s => `${s.total_saved},${s.goal_amount}`),
      ].join('\n');

      const blob = new Blob([csvData], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `painel-controle-${new Date().toISOString().split('T')[0]}.csv`;
      a.click();
      URL.revokeObjectURL(url);
      toast({ title: 'Exportado!', description: 'Arquivo CSV baixado.' });
    } catch (e: any) {
      toast({ title: 'Erro', description: e.message, variant: 'destructive' });
    }
  };

  const handleDeleteAccount = async () => {
    // Just sign out for now - full delete requires admin
    await signOut();
    toast({ title: 'Conta desconectada' });
  };

  return (
    <div className="space-y-6 max-w-2xl">
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
        <h1 className="text-3xl font-bold font-display text-gradient-silver">Configurações</h1>
        <p className="text-muted-foreground text-sm">{user?.email}</p>
      </motion.div>

      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="glass-card p-6 space-y-4">
        <h2 className="text-lg font-semibold font-display">Categorias</h2>
        <div className="flex gap-2">
          <Input placeholder="Nova categoria" value={newCat} onChange={e => setNewCat(e.target.value)} onKeyDown={e => { if (e.key === 'Enter' && newCat) { addCategory.mutateAsync(newCat); setNewCat(''); } }} className="bg-secondary border-border" />
          <Button variant="outline" onClick={() => { if (newCat) { addCategory.mutateAsync(newCat); setNewCat(''); } }}>
            <Plus className="h-4 w-4" />
          </Button>
        </div>
        <div className="space-y-1">
          {categories.map(c => (
            <div key={c.id} className="flex items-center justify-between py-2 px-3 rounded-lg hover:bg-accent transition-colors">
              <span className="text-sm text-foreground">{c.name}</span>
              <button onClick={() => deleteCategory.mutateAsync(c.id)} className="text-muted-foreground hover:text-destructive">
                <Trash2 className="h-4 w-4" />
              </button>
            </div>
          ))}
        </div>
      </motion.div>

      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }} className="glass-card p-6 space-y-4">
        <h2 className="text-lg font-semibold font-display">Notificações</h2>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Bell className="h-4 w-4 text-muted-foreground" />
            <div>
              <p className="text-sm text-foreground">Lembrete diário de hábitos</p>
              <p className="text-xs text-muted-foreground">Notificação às 20:00 se houver hábitos incompletos</p>
            </div>
          </div>
          <Switch
            checked={reminders}
            onCheckedChange={(checked) => {
              setReminders(checked);
              setRemindersEnabled(checked);
              if (checked && 'Notification' in window && Notification.permission === 'default') {
                Notification.requestPermission();
              }
              toast({ title: checked ? 'Lembretes ativados' : 'Lembretes desativados' });
            }}
          />
        </div>
      </motion.div>

      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="glass-card p-6 space-y-4">
        <h2 className="text-lg font-semibold font-display">Dados</h2>
        <Button variant="outline" onClick={handleExport} className="w-full border-border">
          <Download className="h-4 w-4 mr-2" /> Exportar CSV
        </Button>
      </motion.div>

      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }} className="glass-card p-6 space-y-4 border-destructive/30">
        <h2 className="text-lg font-semibold font-display text-destructive">Zona de Perigo</h2>
        <Dialog open={deleteConfirm} onOpenChange={setDeleteConfirm}>
          <DialogTrigger asChild>
            <Button variant="outline" className="w-full border-destructive/50 text-destructive hover:bg-destructive/10">
              <AlertTriangle className="h-4 w-4 mr-2" /> Excluir Conta
            </Button>
          </DialogTrigger>
          <DialogContent className="bg-card border-border">
            <DialogHeader><DialogTitle>Tem certeza?</DialogTitle></DialogHeader>
            <p className="text-sm text-muted-foreground">Esta ação não pode ser desfeita.</p>
            <div className="flex gap-2 justify-end">
              <Button variant="outline" onClick={() => setDeleteConfirm(false)}>Cancelar</Button>
              <Button variant="destructive" onClick={handleDeleteAccount}>Excluir</Button>
            </div>
          </DialogContent>
        </Dialog>
      </motion.div>
    </div>
  );
}
