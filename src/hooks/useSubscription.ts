import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/lib/auth';

export type SubscriptionTier = 'free' | 'premium';

export interface FeatureAccess {
  unlimitedHabits: boolean;
  advancedAnalytics: boolean;
  customThemes: boolean;
  exportData: boolean;
  maxHabits: number;
}

const FREE_FEATURES: FeatureAccess = {
  unlimitedHabits: false,
  advancedAnalytics: false,
  customThemes: false,
  exportData: false,
  maxHabits: 3,
};

const PREMIUM_FEATURES: FeatureAccess = {
  unlimitedHabits: true,
  advancedAnalytics: true,
  customThemes: true,
  exportData: true,
  maxHabits: Infinity,
};

export function useSubscription() {
  const { user } = useAuth();

  const { data: subscription, isLoading } = useQuery({
    queryKey: ['subscription', user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('user_subscriptions')
        .select('*')
        .eq('user_id', user!.id)
        .maybeSingle();
      if (error) throw error;
      return data;
    },
    enabled: !!user,
  });

  const tier: SubscriptionTier = (subscription?.tier as SubscriptionTier) ?? 'free';
  const isPremium = tier === 'premium';
  const features: FeatureAccess = isPremium ? PREMIUM_FEATURES : FREE_FEATURES;

  const canUseFeature = (feature: keyof FeatureAccess): boolean => {
    return !!features[feature];
  };

  return {
    tier,
    isPremium,
    features,
    canUseFeature,
    isLoading,
    subscription,
  };
}
