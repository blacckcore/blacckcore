import { useCallback, useEffect, useState } from 'react';

export type AccentId = 'azul' | 'esmeralda' | 'violeta' | 'laranja' | 'rosa' | 'ciano';

type Accent = {
  id: AccentId;
  label: string;
  /** hue saturation lightness for light theme */
  light: string;
  /** hue saturation lightness for dark theme */
  dark: string;
  /** deeper shade used in gradients */
  deep: string;
  swatch: string;
};

export const ACCENTS: Accent[] = [
  { id: 'azul', label: 'Azul', light: '218 90% 46%', dark: '212 100% 52%', deep: '212 100% 42%', swatch: '#2563eb' },
  { id: 'esmeralda', label: 'Esmeralda', light: '160 84% 32%', dark: '158 84% 42%', deep: '162 84% 30%', swatch: '#10b981' },
  { id: 'violeta', label: 'Violeta', light: '263 70% 50%', dark: '263 85% 62%', deep: '263 70% 44%', swatch: '#8b5cf6' },
  { id: 'laranja', label: 'Laranja', light: '24 90% 46%', dark: '28 95% 54%', deep: '20 90% 44%', swatch: '#f97316' },
  { id: 'rosa', label: 'Rosa', light: '335 78% 46%', dark: '335 85% 58%', deep: '335 78% 42%', swatch: '#ec4899' },
  { id: 'ciano', label: 'Ciano', light: '190 85% 36%', dark: '188 90% 46%', deep: '192 85% 32%', swatch: '#06b6d4' },
];

const STORAGE_KEY = 'meubolso-accent';

export function getStoredAccent(): AccentId {
  try {
    const v = localStorage.getItem(STORAGE_KEY) as AccentId | null;
    return ACCENTS.some(a => a.id === v) ? (v as AccentId) : 'azul';
  } catch {
    return 'azul';
  }
}

export function applyAccent(id: AccentId) {
  const accent = ACCENTS.find(a => a.id === id) ?? ACCENTS[0];
  const root = document.documentElement;
  const isLight = root.classList.contains('light');
  const base = isLight ? accent.light : accent.dark;
  root.style.setProperty('--brand', base);
  root.style.setProperty('--brand-deep', accent.deep);
  root.style.setProperty('--brand-glow', `${base} / ${isLight ? '0.18' : '0.35'}`);
  root.dataset.accent = accent.id;
}

/** Applies the saved accent and keeps it in sync with light/dark theme changes. */
export function useAccent() {
  const [accent, setAccentState] = useState<AccentId>(() =>
    typeof window === 'undefined' ? 'azul' : getStoredAccent()
  );

  useEffect(() => {
    applyAccent(accent);
    const observer = new MutationObserver(() => applyAccent(accent));
    observer.observe(document.documentElement, { attributes: true, attributeFilter: ['class'] });
    return () => observer.disconnect();
  }, [accent]);

  const setAccent = useCallback((id: AccentId) => {
    try {
      localStorage.setItem(STORAGE_KEY, id);
    } catch {
      /* ignore */
    }
    setAccentState(id);
  }, []);

  return { accent, setAccent, accents: ACCENTS };
}

export function AccentProvider({ children }: { children: React.ReactNode }) {
  useAccent();
  return <>{children}</>;
}
