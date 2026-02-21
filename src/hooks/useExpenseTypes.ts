import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/lib/auth';

export const EXPENSE_ICONS = [
  'UtensilsCrossed', 'Home', 'Car', 'Gamepad2', 'Heart', 'GraduationCap', 'CreditCard', 'AlertTriangle',
] as const;

export const EXPENSE_COLORS: string[] = [
  '#F87171', '#60A5FA', '#34D399', '#FBBF24', '#A78BFA', '#FB923C', '#F472B6', '#C0C0C0',
];

export const DEFAULT_EXPENSE_TYPES = [
  { name: 'Alimentação', color: '#FB923C', icon: 'UtensilsCrossed' },
  { name: 'Moradia', color: '#60A5FA', icon: 'Home' },
  { name: 'Transporte', color: '#34D399', icon: 'Car' },
  { name: 'Lazer', color: '#FBBF24', icon: 'Gamepad2' },
  { name: 'Saúde', color: '#F87171', icon: 'Heart' },
  { name: 'Educação', color: '#A78BFA', icon: 'GraduationCap' },
  { name: 'Assinaturas', color: '#F472B6', icon: 'CreditCard' },
  { name: 'Imprevistos', color: '#C0C0C0', icon: 'AlertTriangle' },
];

export function useExpenseTypes() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const query = useQuery({
    queryKey: ['expense_types', user?.id],
    enabled: !!user,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('expense_types')
        .select('*')
        .order('created_at', { ascending: true });
      if (error) throw error;
      return data;
    },
  });

  const addType = useMutation({
    mutationFn: async (type: { name: string; color: string; icon: string }) => {
      const { error } = await supabase.from('expense_types').insert({ ...type, user_id: user!.id });
      if (error) throw error;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['expense_types'] }),
  });

  const deleteType = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('expense_types').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['expense_types'] }),
  });

  const seedDefaults = useMutation({
    mutationFn: async () => {
      const inserts = DEFAULT_EXPENSE_TYPES.map(t => ({ ...t, user_id: user!.id }));
      const { error } = await supabase.from('expense_types').insert(inserts);
      if (error) throw error;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['expense_types'] }),
  });

  return {
    expenseTypes: query.data ?? [],
    loading: query.isLoading,
    addType,
    deleteType,
    seedDefaults,
  };
}
