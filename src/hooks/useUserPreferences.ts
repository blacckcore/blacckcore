import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/lib/auth';

export interface UserPreferences {
  id: string;
  user_id: string;
  primary_goal: string | null;
  focus_area: string | null;
  main_difficulty: string | null;
  alert_style: string | null;
  completed_at: string | null;
}

export function useUserPreferences() {
  const { user } = useAuth();
  const qc = useQueryClient();

  const query = useQuery({
    queryKey: ['user_preferences', user?.id],
    enabled: !!user,
    queryFn: async (): Promise<UserPreferences | null> => {
      const { data, error } = await supabase
        .from('user_preferences')
        .select('*')
        .eq('user_id', user!.id)
        .maybeSingle();
      if (error) throw error;
      return (data as UserPreferences) ?? null;
    },
  });

  const save = useMutation({
    mutationFn: async (payload: Partial<UserPreferences>) => {
      if (!user) throw new Error('Não autenticado');
      const { data, error } = await supabase
        .from('user_preferences')
        .upsert(
          { user_id: user.id, ...payload, completed_at: new Date().toISOString() },
          { onConflict: 'user_id' }
        )
        .select()
        .single();
      if (error) throw error;
      return data as UserPreferences;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['user_preferences', user?.id] }),
  });

  return {
    preferences: query.data,
    isLoading: query.isLoading,
    needsOnboarding: !query.isLoading && !!user && !query.data?.completed_at,
    save,
  };
}
