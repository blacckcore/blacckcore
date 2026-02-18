import { Crown } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { useSubscription } from '@/hooks/useSubscription';

export function PremiumBadge() {
  const { isPremium } = useSubscription();

  if (!isPremium) return null;

  return (
    <Badge className="bg-gradient-to-r from-amber-500 to-yellow-400 text-black border-0 gap-1 text-xs font-bold">
      <Crown className="h-3 w-3" />
      PRO
    </Badge>
  );
}

export function TierBadge() {
  const { isPremium } = useSubscription();

  return (
    <Badge
      variant={isPremium ? 'default' : 'secondary'}
      className={
        isPremium
          ? 'bg-gradient-to-r from-amber-500 to-yellow-400 text-black border-0 gap-1 text-xs font-bold'
          : 'text-xs'
      }
    >
      {isPremium && <Crown className="h-3 w-3" />}
      {isPremium ? 'Premium' : 'Free'}
    </Badge>
  );
}
