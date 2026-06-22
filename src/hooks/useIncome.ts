import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/lib/auth';

export function useIncome() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const query = useQuery({
    queryKey: ['income', user?.id],
    enabled: !!user,
    refetchInterval: 3000,
    refetchIntervalInBackground: true,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('income')
        .select('*')
        .order('expected_date', { ascending: false });
      if (error) throw error;
      return data;
    },
  });

  const addIncome = useMutation({
    mutationFn: async (income: { source: string; amount: number; expected_date: string; status: string; income_type_id?: string | null }) => {
      const { error } = await supabase.from('income').insert({ ...income, user_id: user!.id });
      if (error) throw error;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['income'] }),
  });

  const updateIncome = useMutation({
    mutationFn: async ({ id, ...updates }: { id: string; source?: string; amount?: number; expected_date?: string; status?: string; income_type_id?: string | null }) => {
      const { error } = await supabase.from('income').update(updates).eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['income'] }),
  });

  const deleteIncome = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('income').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['income'] }),
  });

  const totalPending = query.data?.filter(i => i.status === 'pending').reduce((sum, i) => sum + Number(i.amount), 0) ?? 0;
  const totalReceived = query.data?.filter(i => i.status === 'received').reduce((sum, i) => sum + Number(i.amount), 0) ?? 0;

  return { income: query.data ?? [], loading: query.isLoading, totalPending, totalReceived, addIncome, updateIncome, deleteIncome };
}
