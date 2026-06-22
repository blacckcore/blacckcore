import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/lib/auth';

export function useSavings() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const query = useQuery({
    queryKey: ['savings', user?.id],
    enabled: !!user,
    refetchInterval: 3000,
    refetchIntervalInBackground: true,
    queryFn: async () => {
      const { data, error } = await supabase.from('savings').select('*').eq('user_id', user!.id).maybeSingle();
      if (error) throw error;
      return data;
    },
  });

  const upsertSavings = useMutation({
    mutationFn: async (values: { total_saved: number; goal_amount: number; goal_date?: string }) => {
      const { error } = await supabase.from('savings').upsert(
        { user_id: user!.id, ...values },
        { onConflict: 'user_id' }
      );
      if (error) throw error;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['savings'] }),
  });

  return { savings: query.data, loading: query.isLoading, upsertSavings };
}
