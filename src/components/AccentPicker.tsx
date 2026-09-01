import { Check } from 'lucide-react';
import { useAccent } from '@/lib/accent';

export function AccentPicker() {
  const { accent, setAccent, accents } = useAccent();

  return (
    <div className="space-y-3">
      <div>
        <h2 className="text-lg font-semibold font-display">Cor de destaque</h2>
        <p className="text-sm text-muted-foreground">Escolha a cor principal do MeuBolso.</p>
      </div>
      <div className="flex flex-wrap gap-3">
        {accents.map(a => {
          const active = a.id === accent;
          return (
            <button
              key={a.id}
              type="button"
              onClick={() => setAccent(a.id)}
              aria-label={`Usar cor ${a.label}`}
              aria-pressed={active}
              className="group flex flex-col items-center gap-1.5"
            >
              <span
                className={`relative h-10 w-10 rounded-xl border transition-all duration-200 ${
                  active ? 'border-foreground/40 scale-105' : 'border-border hover:scale-105'
                }`}
                style={{ background: a.swatch, boxShadow: active ? `0 0 16px ${a.swatch}66` : undefined }}
              >
                {active && (
                  <Check className="absolute inset-0 m-auto h-4 w-4 text-white drop-shadow" strokeWidth={3} />
                )}
              </span>
              <span className={`text-[11px] ${active ? 'text-foreground' : 'text-muted-foreground'}`}>
                {a.label}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
