import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/lib/auth';

export function useHabits() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const habitsQuery = useQuery({
    queryKey: ['habits', user?.id],
    enabled: !!user,
    refetchInterval: 5000,
    refetchIntervalInBackground: true,
    queryFn: async () => {
      const { data, error } = await supabase.from('habits').select('*').order('created_at');
      if (error) throw error;
      return data;
    },
  });

  const completionsQuery = useQuery({
    queryKey: ['habit_completions', user?.id],
    enabled: !!user,
    refetchInterval: 5000,
    refetchIntervalInBackground: true,
    queryFn: async () => {
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
      const { data, error } = await supabase
        .from('habit_completions')
        .select('*')
        .gte('completed_date', thirtyDaysAgo.toISOString().split('T')[0]);
      if (error) throw error;
      return data;
    },
  });

  const addHabit = useMutation({
    mutationFn: async (name: string) => {
      const { error } = await supabase.from('habits').insert({ name, user_id: user!.id });
      if (error) throw error;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['habits'] }),
  });

  const deleteHabit = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('habits').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['habits'] }),
  });

  const toggleCompletion = useMutation({
    mutationFn: async ({ habitId, date }: { habitId: string; date: string }) => {
      const existing = completionsQuery.data?.find(
        c => c.habit_id === habitId && c.completed_date === date
      );
      if (existing) {
        const { error } = await supabase.from('habit_completions').delete().eq('id', existing.id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from('habit_completions').insert({
          habit_id: habitId,
          user_id: user!.id,
          completed_date: date,
        });
        if (error) throw error;
      }
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['habit_completions'] }),
  });

  const getStreak = (habitId: string) => {
    if (!completionsQuery.data) return 0;
    const completions = completionsQuery.data
      .filter(c => c.habit_id === habitId)
      .map(c => c.completed_date)
      .sort()
      .reverse();
    
    let streak = 0;
    const today = new Date();
    for (let i = 0; i < 365; i++) {
      const d = new Date(today);
      d.setDate(d.getDate() - i);
      const dateStr = d.toISOString().split('T')[0];
      if (completions.includes(dateStr)) {
        streak++;
      } else if (i > 0) {
        break;
      }
    }
    return streak;
  };

  return {
    habits: habitsQuery.data ?? [],
    completions: completionsQuery.data ?? [],
    loading: habitsQuery.isLoading,
    addHabit,
    deleteHabit,
    toggleCompletion,
    getStreak,
  };
}
