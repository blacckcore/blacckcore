import { getFriendlyErrorMessage } from '@/lib/errors';
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
import { getRemindersEnabled, setRemindersEnabled, getNotificationEngagement } from '@/hooks/useNotifications';
import { TierBadge } from '@/components/PremiumBadge';
import { FeatureGate } from '@/components/FeatureGate';
import { useSubscription } from '@/hooks/useSubscription';
import { UpgradeModal } from '@/components/UpgradeModal';

export default function SettingsPage() {
  const { categories, addCategory, deleteCategory } = useCategories();
  const { user, signOut } = useAuth();
  const { toast } = useToast();
  const { tier, isPremium } = useSubscription();
  const [newCat, setNewCat] = useState('');
  const [reminders, setReminders] = useState(getRemindersEnabled);
  const [deleteConfirm, setDeleteConfirm] = useState(false);
  const [showUpgrade, setShowUpgrade] = useState(false);

  const handleExport = async () => {
    try {
      const { data: expenses } = await supabase.from('expenses').select('*');
      const { data: income } = await supabase.from('income').select('*');
      const { data: savings } = await supabase.from('savings').select('*');

      const csvEscape = (v: unknown) => {
        const s = String(v ?? '');
        const safe = /^[=+\-@\t\r]/.test(s) ? `'${s}` : s;
        return `"${safe.replace(/"/g, '""')}"`;
      };
      const row = (...vals: unknown[]) => vals.map(csvEscape).join(',');

      const csvData = [
        '--- DESPESAS ---',
        row('Nome', 'Valor', 'Data', 'Status'),
        ...(expenses ?? []).map(e => row(e.name, e.amount, e.date, e.status)),
        '',
        '--- RECEITAS ---',
        row('Fonte', 'Valor', 'Data', 'Status'),
        ...(income ?? []).map(i => row(i.source, i.amount, i.expected_date, i.status)),
        '',
        '--- ECONOMIA ---',
        row('Total Guardado', 'Meta'),
        ...(savings ?? []).map(s => row(s.total_saved, s.goal_amount)),
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
      console.error(e); toast({ title: 'Erro', description: getFriendlyErrorMessage(e), variant: 'destructive' });
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
        <div className="flex items-center gap-3">
          <h1 className="text-3xl font-bold font-display text-gradient-silver">Configurações</h1>
          <TierBadge />
        </div>
        <p className="text-muted-foreground text-sm">{user?.email}</p>
      </motion.div>

      {!isPremium && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.05 }}
          className="glass-card p-4 border-amber-500/20 cursor-pointer hover:border-amber-500/40 transition-colors"
          onClick={() => setShowUpgrade(true)}
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-semibold text-foreground">🚀 Upgrade para Premium</p>
              <p className="text-xs text-muted-foreground">Desbloqueie análises avançadas, hábitos ilimitados e mais</p>
            </div>
            <Button size="sm" className="bg-gradient-to-r from-amber-500 to-yellow-400 text-black font-bold hover:from-amber-600 hover:to-yellow-500">
              Upgrade
            </Button>
          </div>
        </motion.div>
      )}

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
              <button onClick={() => deleteCategory.mutateAsync(c.id)} aria-label={`Excluir categoria ${c.name}`} className="text-muted-foreground hover:text-destructive">
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
              <p className="text-xs text-muted-foreground">Notificações às 20:00 e 22:00 se houver hábitos incompletos</p>
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
        {reminders && (() => {
          const engagement = getNotificationEngagement();
          const rate = engagement.sent > 0 ? Math.round((engagement.clicked / engagement.sent) * 100) : 0;
          return (
            <div className="flex items-center gap-4 pt-2 border-t border-border">
              <div className="text-center">
                <p className="text-lg font-semibold text-foreground">{engagement.sent}</p>
                <p className="text-xs text-muted-foreground">Enviadas</p>
              </div>
              <div className="text-center">
                <p className="text-lg font-semibold text-foreground">{engagement.clicked}</p>
                <p className="text-xs text-muted-foreground">Clicadas</p>
              </div>
              <div className="text-center">
                <p className="text-lg font-semibold text-foreground">{rate}%</p>
                <p className="text-xs text-muted-foreground">Engajamento</p>
              </div>
            </div>
          );
        })()}
      </motion.div>

      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="glass-card p-6 space-y-4">
        <h2 className="text-lg font-semibold font-display">Dados</h2>
        <FeatureGate feature="exportData" label="Exportar dados">
          <Button variant="outline" onClick={handleExport} className="w-full border-border">
            <Download className="h-4 w-4 mr-2" /> Exportar CSV
          </Button>
        </FeatureGate>
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

      <UpgradeModal open={showUpgrade} onOpenChange={setShowUpgrade} />
    </div>
  );
}
