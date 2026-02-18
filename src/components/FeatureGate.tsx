import { useState, ReactNode } from 'react';
import { Lock } from 'lucide-react';
import { useSubscription, type FeatureAccess } from '@/hooks/useSubscription';
import { UpgradeModal } from '@/components/UpgradeModal';

interface FeatureGateProps {
  feature: keyof FeatureAccess;
  label?: string;
  children: ReactNode;
  fallback?: ReactNode;
}

export function FeatureGate({ feature, label, children, fallback }: FeatureGateProps) {
  const { canUseFeature } = useSubscription();
  const [showUpgrade, setShowUpgrade] = useState(false);

  if (canUseFeature(feature)) {
    return <>{children}</>;
  }

  if (fallback) {
    return <>{fallback}</>;
  }

  return (
    <>
      <div
        className="relative cursor-pointer group"
        onClick={() => setShowUpgrade(true)}
      >
        <div className="opacity-40 pointer-events-none select-none">
          {children}
        </div>
        <div className="absolute inset-0 flex items-center justify-center bg-background/60 backdrop-blur-sm rounded-lg border border-amber-500/20">
          <div className="flex items-center gap-2 text-amber-400 text-sm font-medium">
            <Lock className="h-4 w-4" />
            Premium
          </div>
        </div>
      </div>
      <UpgradeModal open={showUpgrade} onOpenChange={setShowUpgrade} featureLabel={label} />
    </>
  );
}
