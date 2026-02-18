import { Crown, Zap, BarChart3, Palette, Download, Check, Infinity } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { useSubscription } from '@/hooks/useSubscription';

interface UpgradeModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  featureLabel?: string;
}

const premiumFeatures = [
  { icon: BarChart3, label: 'Análises avançadas', desc: 'Gráficos detalhados e insights' },
  { icon: Infinity, label: 'Hábitos ilimitados', desc: 'Sem limite de criação' },
  { icon: Palette, label: 'Temas personalizados', desc: 'Customize a aparência' },
  { icon: Download, label: 'Exportar dados', desc: 'CSV e relatórios completos' },
];

export function UpgradeModal({ open, onOpenChange, featureLabel }: UpgradeModalProps) {
  const { isPremium } = useSubscription();

  if (isPremium) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="bg-card border-border max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-xl">
            <div className="p-2 rounded-full bg-gradient-to-r from-amber-500 to-yellow-400">
              <Crown className="h-5 w-5 text-black" />
            </div>
            Upgrade para Premium
          </DialogTitle>
        </DialogHeader>

        {featureLabel && (
          <div className="bg-amber-500/10 border border-amber-500/20 rounded-lg p-3">
            <p className="text-sm text-amber-400">
              <Zap className="h-4 w-4 inline mr-1" />
              <strong>{featureLabel}</strong> é um recurso Premium
            </p>
          </div>
        )}

        <div className="space-y-3 py-2">
          {premiumFeatures.map(({ icon: Icon, label, desc }) => (
            <div key={label} className="flex items-start gap-3">
              <div className="mt-0.5 p-1.5 rounded-md bg-accent">
                <Icon className="h-4 w-4 text-amber-400" />
              </div>
              <div>
                <p className="text-sm font-medium text-foreground">{label}</p>
                <p className="text-xs text-muted-foreground">{desc}</p>
              </div>
              <Check className="h-4 w-4 text-emerald-400 ml-auto mt-1 shrink-0" />
            </div>
          ))}
        </div>

        <div className="space-y-3 pt-2">
          <div className="text-center">
            <p className="text-3xl font-bold font-display text-foreground">
              R$ 19<span className="text-lg text-muted-foreground">/mês</span>
            </p>
            <p className="text-xs text-muted-foreground">Cancele quando quiser</p>
          </div>
          <Button
            className="w-full bg-gradient-to-r from-amber-500 to-yellow-400 text-black font-bold hover:from-amber-600 hover:to-yellow-500"
            onClick={() => onOpenChange(false)}
          >
            <Crown className="h-4 w-4 mr-2" />
            Em breve — Fique ligado!
          </Button>
          <p className="text-xs text-center text-muted-foreground">
            Pagamento será disponibilizado em breve
          </p>
        </div>
      </DialogContent>
    </Dialog>
  );
}
