import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/lib/auth';

export interface DashboardBlock {
  id: string;
  title: string;
  icon: string;
  visible: boolean;
  order: number;
}

export const DEFAULT_BLOCKS: DashboardBlock[] = [
  { id: 'savings', title: 'Dinheiro Guardado', icon: 'Wallet', visible: true, order: 0 },
  { id: 'expenses', title: 'Gasto no Mês', icon: 'TrendingDown', visible: true, order: 1 },
  { id: 'income', title: 'A Receber', icon: 'TrendingUp', visible: true, order: 2 },
  { id: 'habits', title: 'Hábitos Hoje', icon: 'Target', visible: true, order: 3 },
  { id: 'daily-progress', title: 'Progresso Diário', icon: 'CheckSquare', visible: true, order: 4 },
  { id: 'savings-goal', title: 'Meta de Economia', icon: 'PiggyBank', visible: true, order: 5 },
];

export function useDashboardLayout() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const query = useQuery({
    queryKey: ['dashboard_layout', user?.id],
    enabled: !!user,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('dashboard_layouts')
        .select('*')
        .eq('user_id', user!.id)
        .maybeSingle();
      if (error) throw error;
      if (!data) return DEFAULT_BLOCKS;
      const saved = data.layout as unknown as DashboardBlock[];
      // Merge with defaults to handle new blocks
      const merged = DEFAULT_BLOCKS.map(def => {
        const found = saved.find(s => s.id === def.id);
        return found ? { ...def, ...found } : def;
      });
      return merged.sort((a, b) => a.order - b.order);
    },
  });

  const saveLayout = useMutation({
    mutationFn: async (blocks: DashboardBlock[]) => {
      const { error } = await supabase
        .from('dashboard_layouts')
        .upsert({ user_id: user!.id, layout: blocks as any }, { onConflict: 'user_id' });
      if (error) throw error;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['dashboard_layout'] }),
  });

  return {
    blocks: query.data ?? DEFAULT_BLOCKS,
    loading: query.isLoading,
    saveLayout,
  };
}
