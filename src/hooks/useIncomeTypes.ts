import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/lib/auth';

export const INCOME_ICONS = [
  'DollarSign', 'Briefcase', 'Laptop', 'TrendingUp', 'Coins', 'CreditCard', 'Banknote', 'Gem',
] as const;

export const INCOME_COLORS: string[] = [
  '#C0C0C0', '#60A5FA', '#34D399', '#FBBF24', '#F87171', '#A78BFA', '#FB923C', '#F472B6',
];

export const DEFAULT_TYPES = [
  { name: 'Salário', color: '#60A5FA', icon: 'Briefcase' },
  { name: 'Freelance', color: '#34D399', icon: 'Laptop' },
  { name: 'Comissão', color: '#FBBF24', icon: 'Coins' },
  { name: 'Investimento', color: '#A78BFA', icon: 'TrendingUp' },
  { name: 'Outro', color: '#C0C0C0', icon: 'DollarSign' },
];

export function useIncomeTypes() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const query = useQuery({
    queryKey: ['income_types', user?.id],
    enabled: !!user,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('income_types')
        .select('*')
        .order('created_at', { ascending: true });
      if (error) throw error;
      return data;
    },
  });

  const addType = useMutation({
    mutationFn: async (type: { name: string; color: string; icon: string }) => {
      const { error } = await supabase.from('income_types').insert({ ...type, user_id: user!.id });
      if (error) throw error;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['income_types'] }),
  });

  const deleteType = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('income_types').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['income_types'] }),
  });

  const seedDefaults = useMutation({
    mutationFn: async () => {
      const inserts = DEFAULT_TYPES.map(t => ({ ...t, user_id: user!.id }));
      const { error } = await supabase.from('income_types').insert(inserts);
      if (error) throw error;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['income_types'] }),
  });

  return {
    incomeTypes: query.data ?? [],
    loading: query.isLoading,
    addType,
    deleteType,
    seedDefaults,
  };
}
