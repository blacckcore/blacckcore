import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/lib/auth';
import { useToast } from '@/hooks/use-toast';

export interface GoalType {
  id: string;
  user_id: string;
  name: string;
  icon: string;
  color: string;
  is_default: boolean;
  created_at: string;
}

export interface Goal {
  id: string;
  user_id: string;
  goal_type_id: string | null;
  title: string;
  description: string | null;
  start_date: string;
  end_date: string | null;
  progress_type: string;
  current_value: number;
  target_value: number;
  status: string;
  created_at: string;
  updated_at: string;
}

const DEFAULT_TYPES: Omit<GoalType, 'id' | 'user_id' | 'created_at'>[] = [
  { name: 'Financeiras', icon: 'DollarSign', color: '#22C55E', is_default: true },
  { name: 'Pessoais', icon: 'Heart', color: '#EC4899', is_default: true },
  { name: 'Trabalho / Carreira', icon: 'Briefcase', color: '#3B82F6', is_default: true },
  { name: 'Aprendizagem', icon: 'BookOpen', color: '#A855F7', is_default: true },
  { name: 'Saúde', icon: 'Activity', color: '#14B8A6', is_default: true },
  { name: 'Hábitos', icon: 'Target', color: '#F97316', is_default: true },
];

export function useGoals() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [goals, setGoals] = useState<Goal[]>([]);
  const [goalTypes, setGoalTypes] = useState<GoalType[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchGoalTypes = useCallback(async () => {
    if (!user) return;
    const { data, error } = await supabase
      .from('goal_types')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at');
    if (error) return;
    if (data && data.length === 0) {
      // Seed defaults
      const inserts = DEFAULT_TYPES.map(t => ({ ...t, user_id: user.id }));
      const { data: seeded } = await supabase.from('goal_types').insert(inserts).select();
      if (seeded) setGoalTypes(seeded as GoalType[]);
    } else {
      setGoalTypes((data || []) as GoalType[]);
    }
  }, [user]);

  const fetchGoals = useCallback(async () => {
    if (!user) return;
    const { data } = await supabase
      .from('goals')
      .select('*')
      .eq('user_id', user.id)
      .order('updated_at', { ascending: false });
    setGoals((data || []) as Goal[]);
  }, [user]);

  useEffect(() => {
    if (!user) return;
    setLoading(true);
    Promise.all([fetchGoalTypes(), fetchGoals()]).finally(() => setLoading(false));
  }, [user, fetchGoalTypes, fetchGoals]);

  useEffect(() => {
    if (!user) return;
    const interval = window.setInterval(() => {
      fetchGoals();
    }, 5000);

    return () => window.clearInterval(interval);
  }, [user, fetchGoals]);

  const addGoal = async (goal: Partial<Goal>) => {
    if (!user) return;
    const { error } = await supabase.from('goals').insert({ ...goal, user_id: user.id } as any);
    if (error) { toast({ title: 'Erro', description: error.message, variant: 'destructive' }); return; }
    await fetchGoals();
    toast({ title: 'Meta criada!' });
  };

  const updateGoal = async (id: string, updates: Partial<Goal>) => {
    if (!user) return;
    const { error } = await supabase.from('goals').update(updates as any).eq('id', id).eq('user_id', user.id);
    if (error) { toast({ title: 'Erro', description: error.message, variant: 'destructive' }); return; }
    await fetchGoals();
  };

  const deleteGoal = async (id: string) => {
    if (!user) return;
    await supabase.from('goals').delete().eq('id', id).eq('user_id', user.id);
    await fetchGoals();
    toast({ title: 'Meta removida' });
  };

  const addGoalType = async (type: Partial<GoalType>) => {
    if (!user) return;
    const { error } = await supabase.from('goal_types').insert({ ...type, user_id: user.id } as any);
    if (error) { toast({ title: 'Erro', description: error.message, variant: 'destructive' }); return; }
    await fetchGoalTypes();
  };

  const deleteGoalType = async (id: string) => {
    if (!user) return;
    await supabase.from('goal_types').delete().eq('id', id).eq('user_id', user.id);
    await fetchGoalTypes();
  };

  return { goals, goalTypes, loading, addGoal, updateGoal, deleteGoal, addGoalType, deleteGoalType, refetch: () => { fetchGoals(); fetchGoalTypes(); } };
}
