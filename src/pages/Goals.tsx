import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Target, TrendingUp, Award, CheckCircle2, Plus, Trash2, Calendar,
  DollarSign, Heart, Briefcase, BookOpen, Activity, Clock, Filter,
  ChevronDown, X
} from 'lucide-react';
import { StatCard } from '@/components/StatCard';
import { ProgressBar } from '@/components/ProgressBar';
import { useGoals, Goal, GoalType } from '@/hooks/useGoals';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';

const ICON_MAP: Record<string, any> = {
  DollarSign, Heart, Briefcase, BookOpen, Activity, Target, TrendingUp, Award, Calendar, Clock,
};

function GoalIcon({ name, className, style }: { name: string; className?: string; style?: React.CSSProperties }) {
  const Icon = ICON_MAP[name] || Target;
  return <Icon className={className || 'h-4 w-4'} style={style} />;
}

const STATUS_LABELS: Record<string, string> = {
  in_progress: 'Em andamento',
  delayed: 'Atrasada',
  completed: 'Concluída',
};

const PROGRESS_LABELS: Record<string, string> = {
  percentage: '%',
  monetary: 'R$',
  count: 'un',
};

export default function Goals() {
  const { goals, goalTypes, loading, addGoal, updateGoal, deleteGoal } = useGoals();
  const { toast } = useToast();
  const [filterType, setFilterType] = useState<string>('all');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [sortBy, setSortBy] = useState<string>('updated');
  const [newOpen, setNewOpen] = useState(false);
  const [editingField, setEditingField] = useState<{ id: string; field: string } | null>(null);
  const editRef = useRef<HTMLInputElement>(null);

  // New goal form
  const [form, setForm] = useState({
    title: '', description: '', goal_type_id: '', progress_type: 'percentage',
    target_value: '100', end_date: '',
  });

  useEffect(() => {
    if (editingField && editRef.current) editRef.current.focus();
  }, [editingField]);

  // Stats
  const activeGoals = goals.filter(g => g.status === 'in_progress');
  const completedThisMonth = goals.filter(g => {
    if (g.status !== 'completed') return false;
    const d = new Date(g.updated_at);
    const now = new Date();
    return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
  });
  const overallProgress = goals.length > 0
    ? Math.round(goals.reduce((sum, g) => sum + Math.min((g.current_value / (g.target_value || 1)) * 100, 100), 0) / goals.length)
    : 0;

  // Filter & sort
  let filtered = [...goals];
  if (filterType !== 'all') filtered = filtered.filter(g => g.goal_type_id === filterType);
  if (filterStatus !== 'all') filtered = filtered.filter(g => g.status === filterStatus);
  filtered.sort((a, b) => {
    if (sortBy === 'deadline') return (a.end_date || '9999') < (b.end_date || '9999') ? -1 : 1;
    if (sortBy === 'progress') return (b.current_value / (b.target_value || 1)) - (a.current_value / (a.target_value || 1));
    return new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime();
  });

  const handleCreate = async () => {
    if (!form.title.trim()) { toast({ title: 'Insira um título', variant: 'destructive' }); return; }
    await addGoal({
      title: form.title,
      description: form.description || null,
      goal_type_id: form.goal_type_id || null,
      progress_type: form.progress_type,
      target_value: Number(form.target_value) || 100,
      end_date: form.end_date || null,
    });
    setForm({ title: '', description: '', goal_type_id: '', progress_type: 'percentage', target_value: '100', end_date: '' });
    setNewOpen(false);
  };

  const handleInlineUpdate = async (goal: Goal, field: string, value: string) => {
    setEditingField(null);
    const updates: any = {};
    if (field === 'title') updates.title = value;
    else if (field === 'current_value') updates.current_value = Number(value) || 0;
    else if (field === 'target_value') updates.target_value = Number(value) || 1;
    else if (field === 'description') updates.description = value;
    if (Object.keys(updates).length > 0 && updates[field] !== (goal as any)[field]) {
      // Auto-complete
      if (field === 'current_value' && Number(value) >= goal.target_value) {
        updates.status = 'completed';
      }
      await updateGoal(goal.id, updates);
    }
  };

  const getType = (id: string | null) => goalTypes.find(t => t.id === id);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="h-6 w-6 border-2 border-silver border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold font-display text-gradient-silver">Metas</h1>
          <p className="text-muted-foreground text-sm">Acompanhe e conquiste seus objetivos</p>
        </div>
        <Dialog open={newOpen} onOpenChange={setNewOpen}>
          <DialogTrigger asChild>
            <Button size="sm" className="gradient-silver text-primary-foreground gap-1.5">
              <Plus className="h-4 w-4" /> Nova Meta
            </Button>
          </DialogTrigger>
          <DialogContent className="glass-card max-w-md">
            <DialogHeader><DialogTitle className="font-display">Nova Meta</DialogTitle></DialogHeader>
            <div className="space-y-4 pt-2">
              <div className="space-y-1.5">
                <Label className="text-xs uppercase tracking-wider text-muted-foreground">Título</Label>
                <Input value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))} placeholder="Ex: Economizar R$ 5.000" />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs uppercase tracking-wider text-muted-foreground">Descrição (opcional)</Label>
                <Input value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} placeholder="Detalhes da meta" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label className="text-xs uppercase tracking-wider text-muted-foreground">Tipo</Label>
                  <Select value={form.goal_type_id} onValueChange={v => setForm(f => ({ ...f, goal_type_id: v }))}>
                    <SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger>
                    <SelectContent>
                      {goalTypes.map(t => (
                        <SelectItem key={t.id} value={t.id}>
                          <span className="flex items-center gap-2"><GoalIcon name={t.icon} className="h-3.5 w-3.5" />{t.name}</span>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs uppercase tracking-wider text-muted-foreground">Progresso</Label>
                  <Select value={form.progress_type} onValueChange={v => setForm(f => ({ ...f, progress_type: v }))}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="percentage">Porcentagem (%)</SelectItem>
                      <SelectItem value="monetary">Valor (R$)</SelectItem>
                      <SelectItem value="count">Contagem (un)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label className="text-xs uppercase tracking-wider text-muted-foreground">Valor alvo</Label>
                  <Input type="number" value={form.target_value} onChange={e => setForm(f => ({ ...f, target_value: e.target.value }))} />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs uppercase tracking-wider text-muted-foreground">Prazo (opcional)</Label>
                  <Input type="date" value={form.end_date} onChange={e => setForm(f => ({ ...f, end_date: e.target.value }))} />
                </div>
              </div>
              <Button onClick={handleCreate} className="w-full gradient-silver text-primary-foreground">Criar Meta</Button>
            </div>
          </DialogContent>
        </Dialog>
      </motion.div>

      {/* Summary cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard title="Metas Ativas" value={String(activeGoals.length)} icon={Target} delay={0} />
        <StatCard title="Concluídas (mês)" value={String(completedThisMonth.length)} icon={CheckCircle2} delay={0.1} />
        <StatCard title="Progresso Geral" value={`${overallProgress}%`} icon={TrendingUp} delay={0.2} />
        <StatCard title="Total" value={String(goals.length)} icon={Award} delay={0.3} />
      </div>

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-2">
        <Filter className="h-4 w-4 text-muted-foreground" />
        <Select value={filterType} onValueChange={setFilterType}>
          <SelectTrigger className="w-auto h-8 text-xs gap-1 bg-secondary/60 border-border">
            <SelectValue placeholder="Tipo" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos os tipos</SelectItem>
            {goalTypes.map(t => <SelectItem key={t.id} value={t.id}>{t.name}</SelectItem>)}
          </SelectContent>
        </Select>
        <Select value={filterStatus} onValueChange={setFilterStatus}>
          <SelectTrigger className="w-auto h-8 text-xs gap-1 bg-secondary/60 border-border">
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos</SelectItem>
            <SelectItem value="in_progress">Em andamento</SelectItem>
            <SelectItem value="delayed">Atrasada</SelectItem>
            <SelectItem value="completed">Concluída</SelectItem>
          </SelectContent>
        </Select>
        <Select value={sortBy} onValueChange={setSortBy}>
          <SelectTrigger className="w-auto h-8 text-xs gap-1 bg-secondary/60 border-border">
            <SelectValue placeholder="Ordenar" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="updated">Recentes</SelectItem>
            <SelectItem value="deadline">Prazo</SelectItem>
            <SelectItem value="progress">Progresso</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Goals list */}
      <div className="space-y-3">
        <AnimatePresence>
          {filtered.length === 0 && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="glass-card p-8 text-center">
              <Target className="h-8 w-8 mx-auto text-muted-foreground mb-2" />
              <p className="text-muted-foreground text-sm">Nenhuma meta encontrada. Crie sua primeira meta!</p>
            </motion.div>
          )}
          {filtered.map((goal, i) => {
            const type = getType(goal.goal_type_id);
            const pct = goal.target_value > 0 ? Math.min((goal.current_value / goal.target_value) * 100, 100) : 0;
            const isEditing = (field: string) => editingField?.id === goal.id && editingField?.field === field;

            return (
              <motion.div
                key={goal.id}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -12 }}
                transition={{ delay: i * 0.04 }}
                className="glass-card p-4 space-y-3 group"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-3 flex-1 min-w-0">
                    {/* Type badge */}
                    {type && (
                      <div
                        className="flex items-center justify-center h-8 w-8 rounded-lg shrink-0"
                        style={{ backgroundColor: type.color + '18' }}
                      >
                        <GoalIcon name={type.icon} className="h-4 w-4" style={{ color: type.color } as any} />
                      </div>
                    )}
                    <div className="flex-1 min-w-0">
                      {/* Inline editable title */}
                      {isEditing('title') ? (
                        <input
                          ref={editRef}
                          defaultValue={goal.title}
                          onBlur={e => handleInlineUpdate(goal, 'title', e.target.value)}
                          onKeyDown={e => { if (e.key === 'Enter') (e.target as HTMLInputElement).blur(); }}
                          className="text-sm font-semibold bg-transparent border-b border-silver/30 outline-none w-full py-0.5"
                        />
                      ) : (
                        <h3
                          onClick={() => setEditingField({ id: goal.id, field: 'title' })}
                          className="text-sm font-semibold truncate cursor-text hover:text-silver transition-colors"
                        >
                          {goal.title}
                        </h3>
                      )}
                      <div className="flex items-center gap-2 mt-0.5">
                        {type && <span className="text-[10px] text-muted-foreground">{type.name}</span>}
                        <Badge
                          variant="outline"
                          className="text-[10px] px-1.5 py-0"
                          style={goal.status === 'completed' ? { borderColor: 'hsl(var(--success))', color: 'hsl(var(--success))' } : goal.status === 'delayed' ? { borderColor: 'hsl(var(--warning))', color: 'hsl(var(--warning))' } : {}}
                        >
                          {STATUS_LABELS[goal.status] || goal.status}
                        </Badge>
                        {goal.end_date && (
                          <span className="text-[10px] text-muted-foreground flex items-center gap-0.5">
                            <Calendar className="h-2.5 w-2.5" />
                            {new Date(goal.end_date).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' })}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {/* Status toggle */}
                    {goal.status !== 'completed' ? (
                      <button
                        onClick={() => updateGoal(goal.id, { status: 'completed', current_value: goal.target_value })}
                        className="text-muted-foreground hover:text-success transition-colors"
                        title="Marcar como concluída"
                      >
                        <CheckCircle2 className="h-4 w-4" />
                      </button>
                    ) : (
                      <button
                        onClick={() => updateGoal(goal.id, { status: 'in_progress' })}
                        className="text-success hover:text-muted-foreground transition-colors"
                        title="Reabrir"
                      >
                        <CheckCircle2 className="h-4 w-4" />
                      </button>
                    )}
                    <button
                      onClick={() => deleteGoal(goal.id)}
                      className="text-muted-foreground hover:text-destructive transition-colors opacity-0 group-hover:opacity-100"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </div>

                {/* Progress */}
                <div className="flex items-center gap-3">
                  <div className="flex-1">
                    <ProgressBar value={goal.current_value} max={goal.target_value || 1} showPercentage={false} />
                  </div>
                  <div className="flex items-center gap-1 text-xs tabular-nums shrink-0">
                    {isEditing('current_value') ? (
                      <input
                        ref={editRef}
                        type="number"
                        defaultValue={goal.current_value}
                        onBlur={e => handleInlineUpdate(goal, 'current_value', e.target.value)}
                        onKeyDown={e => { if (e.key === 'Enter') (e.target as HTMLInputElement).blur(); }}
                        className="w-16 text-xs bg-transparent border-b border-silver/30 outline-none text-right"
                      />
                    ) : (
                      <span
                        onClick={() => setEditingField({ id: goal.id, field: 'current_value' })}
                        className="cursor-text hover:text-silver font-medium transition-colors"
                      >
                        {goal.progress_type === 'monetary' ? `R$ ${goal.current_value.toFixed(0)}` : goal.current_value}
                      </span>
                    )}
                    <span className="text-muted-foreground">/</span>
                    <span className="text-muted-foreground">
                      {goal.progress_type === 'monetary' ? `R$ ${goal.target_value.toFixed(0)}` : goal.target_value}
                    </span>
                    <span className="text-muted-foreground text-[10px] ml-0.5">{PROGRESS_LABELS[goal.progress_type]}</span>
                  </div>
                </div>
              </motion.div>
            );
          })}
        </AnimatePresence>
      </div>
    </div>
  );
}
