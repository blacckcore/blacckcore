import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/lib/auth';

export function useExpenses(month?: number, year?: number) {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const now = new Date();
  const m = month ?? now.getMonth() + 1;
  const y = year ?? now.getFullYear();

  const query = useQuery({
    queryKey: ['expenses', user?.id, m, y],
    enabled: !!user,
    queryFn: async () => {
      const startDate = `${y}-${String(m).padStart(2, '0')}-01`;
      const endDate = m === 12 ? `${y + 1}-01-01` : `${y}-${String(m + 1).padStart(2, '0')}-01`;
      const { data, error } = await supabase
        .from('expenses')
        .select('*, categories(name)')
        .gte('date', startDate)
        .lt('date', endDate)
        .order('date', { ascending: false });
      if (error) throw error;
      return data;
    },
  });

  const addExpense = useMutation({
    mutationFn: async (expense: { name: string; category_id?: string; amount: number; date: string; status: string }) => {
      const { error } = await supabase.from('expenses').insert({ ...expense, user_id: user!.id });
      if (error) throw error;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['expenses'] }),
  });

  const updateExpense = useMutation({
    mutationFn: async ({ id, ...updates }: { id: string; name?: string; category_id?: string; amount?: number; date?: string; status?: string }) => {
      const { error } = await supabase.from('expenses').update(updates).eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['expenses'] }),
  });

  const deleteExpense = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('expenses').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['expenses'] }),
  });

  const total = query.data?.reduce((sum, e) => sum + Number(e.amount), 0) ?? 0;
  const totalPaid = query.data?.filter(e => e.status === 'paid').reduce((sum, e) => sum + Number(e.amount), 0) ?? 0;

  return { expenses: query.data ?? [], loading: query.isLoading, total, totalPaid, addExpense, updateExpense, deleteExpense };
}
