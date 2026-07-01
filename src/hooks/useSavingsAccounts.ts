import { useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/lib/auth';

export type SavingsAccountType = 'account' | 'investment' | 'card_limit' | 'overdraft' | 'cash' | 'other';

export type SavingsAccount = {
  id: string;
  user_id: string;
  name: string;
  type: SavingsAccountType;
  amount: number;
  color: string;
  created_at: string;
  updated_at: string;
};

type AccountInput = {
  name: string;
  type: SavingsAccountType;
  amount: number;
  color?: string;
};

const db = supabase as any;

export function useSavingsAccounts() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const query = useQuery({
    queryKey: ['savings-accounts', user?.id],
    enabled: !!user,
    queryFn: async () => {
      const { data, error } = await db
        .from('savings_accounts')
        .select('*')
        .eq('user_id', user!.id)
        .order('created_at', { ascending: true });

      if (error) {
        if (error.code === '42P01') return [] as SavingsAccount[];
        throw error;
      }

      return (data ?? []).map((row: any) => ({
        ...row,
        amount: Number(row.amount ?? 0),
      })) as SavingsAccount[];
    },
  });

  const invalidate = () => {
    queryClient.invalidateQueries({ queryKey: ['savings-accounts'] });
    queryClient.invalidateQueries({ queryKey: ['savings'] });
  };

  const addAccount = useMutation({
    mutationFn: async (data: AccountInput) => {
      const { error } = await db.from('savings_accounts').insert({
        ...data,
        user_id: user!.id,
        amount: Number(data.amount || 0),
        updated_at: new Date().toISOString(),
      });
      if (error) throw error;
    },
    onSuccess: invalidate,
  });

  const updateAccount = useMutation({
    mutationFn: async ({ id, ...data }: AccountInput & { id: string }) => {
      const { error } = await db
        .from('savings_accounts')
        .update({
          ...data,
          amount: Number(data.amount || 0),
          updated_at: new Date().toISOString(),
        })
        .eq('id', id)
        .eq('user_id', user!.id);
      if (error) throw error;
    },
    onSuccess: invalidate,
  });

  const deleteAccount = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await db.from('savings_accounts').delete().eq('id', id).eq('user_id', user!.id);
      if (error) throw error;
    },
    onSuccess: invalidate,
  });

  const seedDefaultAccounts = useMutation({
    mutationFn: async (initialSaved: number) => {
      const defaults: AccountInput[] = [
        { name: 'Saldo em conta', type: 'account', amount: initialSaved, color: '#22c55e' },
        { name: 'Investimentos', type: 'investment', amount: 0, color: '#3b82f6' },
        { name: 'Limite especial', type: 'overdraft', amount: 0, color: '#f59e0b' },
        { name: 'Limite/cartao', type: 'card_limit', amount: 0, color: '#a855f7' },
      ];

      const { error } = await db.from('savings_accounts').insert(
        defaults.map(item => ({
          ...item,
          user_id: user!.id,
          updated_at: new Date().toISOString(),
        }))
      );
      if (error) throw error;
    },
    onSuccess: invalidate,
  });

  const totals = useMemo(() => {
    const accounts = query.data ?? [];
    const liquid = accounts
      .filter(account => account.type !== 'card_limit' && account.type !== 'overdraft')
      .reduce((sum, account) => sum + account.amount, 0);
    const limits = accounts
      .filter(account => account.type === 'card_limit' || account.type === 'overdraft')
      .reduce((sum, account) => sum + account.amount, 0);
    const investments = accounts
      .filter(account => account.type === 'investment')
      .reduce((sum, account) => sum + account.amount, 0);

    return { liquid, limits, investments };
  }, [query.data]);

  return {
    accounts: query.data ?? [],
    loading: query.isLoading,
    tableReady: !query.error,
    totals,
    addAccount,
    updateAccount,
    deleteAccount,
    seedDefaultAccounts,
  };
}
