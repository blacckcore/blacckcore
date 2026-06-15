import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/lib/auth';

export function useDebts() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const query = useQuery({
    queryKey: ['debts', user?.id],
    enabled: !!user,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('debts')
        .select('*')
        .order('created_at', { ascending: true });
      if (error) throw error;
      return data;
    },
  });

  const addDebt = useMutation({
    mutationFn: async (debt: {
      name: string;
      total_amount: number;
      remaining_amount: number;
      interest_rate: number;
      minimum_payment: number;
      due_date?: string;
    }) => {
      const { error } = await supabase.from('debts').insert({ ...debt, user_id: user!.id });
      if (error) throw error;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['debts'] }),
  });

  const updateDebt = useMutation({
    mutationFn: async ({ id, ...updates }: { id: string } & Partial<{ name: string; total_amount: number; remaining_amount: number; minimum_payment: number; interest_rate: number; due_date: string }>) => {
      const { error } = await supabase.from('debts').update(updates).eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['debts'] }),
  });

  const deleteDebt = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('debts').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['debts'] }),
  });

  const totalDebt = query.data?.reduce((s, d) => s + Number(d.remaining_amount), 0) ?? 0;

  return {
    debts: query.data ?? [],
    loading: query.isLoading,
    totalDebt,
    addDebt,
    updateDebt,
    deleteDebt,
  };
}
