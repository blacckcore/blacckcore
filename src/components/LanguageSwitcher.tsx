import { Globe2 } from 'lucide-react';
import { languages, useI18n, type Language } from '@/lib/i18n';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

export function LanguageSwitcher() {
  const { language, setLanguage, t } = useI18n();

  return (
    <div className="flex items-center gap-1">
      <Globe2 className="h-4 w-4 text-muted-foreground" aria-hidden="true" />
      <Select value={language} onValueChange={(value) => setLanguage(value as Language)}>
        <SelectTrigger
          aria-label={t('language.label')}
          className="h-9 w-[92px] border-border bg-secondary/70 text-xs"
        >
          <SelectValue />
        </SelectTrigger>
        <SelectContent align="end">
          {languages.map(item => (
            <SelectItem key={item.code} value={item.code}>
              {item.shortLabel}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}
