import { useState, useRef, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Target, TrendingUp, Award, CheckCircle2, Plus, Trash2, Calendar,
  DollarSign, Heart, Briefcase, BookOpen, Activity, Clock, Filter,
  ChevronDown, X, Zap, Gauge, Rocket
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
                      aria-label={`Excluir meta ${goal.title ?? ''}`}
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

      {/* Scenario Simulator */}
      {activeGoals.length > 0 && <ScenarioSimulator goals={activeGoals} />}
    </div>
  );
}

/* ─── Scenario Simulator Component ─── */

interface Scenario {
  label: string;
  icon: any;
  multiplier: number;
  color: string;
  description: string;
}

const SCENARIOS: Scenario[] = [
  { label: 'Conservador', icon: Gauge, multiplier: 0.7, color: 'hsl(var(--warning))', description: 'Ritmo mais lento, sem pressão' },
  { label: 'Moderado', icon: TrendingUp, multiplier: 1.0, color: 'hsl(var(--silver))', description: 'Mantendo o ritmo atual' },
  { label: 'Otimista', icon: Rocket, multiplier: 1.5, color: 'hsl(var(--success))', description: 'Acelerando o progresso' },
];

function ScenarioSimulator({ goals }: { goals: Goal[] }) {
  const [selectedScenario, setSelectedScenario] = useState(1); // default moderado

  const projections = useMemo(() => {
    return SCENARIOS.map(scenario => {
      const goalProjections = goals.map(goal => {
        const remaining = goal.target_value - goal.current_value;
        if (remaining <= 0) return { ...goal, daysLeft: 0, projectedDate: 'Concluída' };

        // Calculate daily rate from start to now
        const startDate = new Date(goal.start_date);
        const now = new Date();
        const daysSinceStart = Math.max(1, Math.floor((now.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24)));
        const dailyRate = (goal.current_value / daysSinceStart) * scenario.multiplier;

        if (dailyRate <= 0) return { ...goal, daysLeft: Infinity, projectedDate: 'Sem dados suficientes' };

        const daysLeft = Math.ceil(remaining / dailyRate);
        const projDate = new Date(now.getTime() + daysLeft * 24 * 60 * 60 * 1000);

        return {
          ...goal,
          daysLeft,
          projectedDate: projDate.toLocaleDateString('pt-BR', { day: '2-digit', month: 'short', year: 'numeric' }),
          onTrack: goal.end_date ? projDate <= new Date(goal.end_date) : true,
        };
      });

      const avgDays = goalProjections.filter(g => g.daysLeft !== Infinity && g.daysLeft > 0);
      const averageDaysLeft = avgDays.length > 0 ? Math.round(avgDays.reduce((s, g) => s + g.daysLeft, 0) / avgDays.length) : 0;

      return { scenario, goalProjections, averageDaysLeft };
    });
  }, [goals]);

  const current = projections[selectedScenario];

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.3 }}
      className="glass-card p-5 space-y-4"
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Zap className="h-4 w-4 text-silver" />
          <h2 className="text-sm font-semibold font-display">Simulador de Cenários</h2>
        </div>
        <span className="text-[10px] text-muted-foreground">Baseado no seu ritmo atual</span>
      </div>

      {/* Scenario tabs */}
      <div className="grid grid-cols-3 gap-2">
        {SCENARIOS.map((s, i) => {
          const Icon = s.icon;
          const isActive = selectedScenario === i;
          return (
            <button
              key={s.label}
              onClick={() => setSelectedScenario(i)}
              className={`flex flex-col items-center gap-1.5 p-3 rounded-xl border transition-all ${
                isActive
                  ? 'border-silver/30 bg-secondary/80 shadow-sm'
                  : 'border-transparent bg-secondary/30 hover:bg-secondary/50'
              }`}
            >
              <Icon className="h-4 w-4" style={{ color: isActive ? s.color : undefined }} />
              <span className="text-xs font-medium">{s.label}</span>
              <span className="text-[10px] text-muted-foreground leading-tight text-center">{s.description}</span>
            </button>
          );
        })}
      </div>

      {/* Projections */}
      <div className="space-y-2.5">
        {current.goalProjections.map(proj => {
          const pct = proj.target_value > 0 ? Math.min((proj.current_value / proj.target_value) * 100, 100) : 0;
          return (
            <div key={proj.id} className="flex items-center gap-3 py-1.5">
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs font-medium truncate">{proj.title}</span>
                  <span className="text-[10px] text-muted-foreground shrink-0 ml-2">
                    {proj.daysLeft === Infinity
                      ? '—'
                      : proj.daysLeft === 0
                        ? '✓'
                        : `${proj.daysLeft} dias`}
                  </span>
                </div>
                <div className="h-1 bg-secondary/80 rounded-full overflow-hidden">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${pct}%` }}
                    transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
                    className="h-full rounded-full"
                    style={{ backgroundColor: current.scenario.color }}
                  />
                </div>
              </div>
              <span className="text-[10px] text-muted-foreground shrink-0 w-20 text-right">
                {proj.projectedDate}
              </span>
            </div>
          );
        })}
      </div>

      {/* Summary */}
      {current.averageDaysLeft > 0 && (
        <div className="pt-2 border-t border-border/60">
          <p className="text-xs text-muted-foreground">
            No cenário <span className="font-medium text-foreground">{current.scenario.label.toLowerCase()}</span>, suas metas serão concluídas em média em{' '}
            <span className="font-semibold text-foreground">{current.averageDaysLeft} dias</span>
            {current.averageDaysLeft > 30 && ` (~${Math.round(current.averageDaysLeft / 30)} meses)`}.
          </p>
        </div>
      )}
    </motion.div>
  );
}
