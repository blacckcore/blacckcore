import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowRight, Check, Wallet, CheckSquare, Target, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useUserPreferences } from '@/hooks/useUserPreferences';
import { useToast } from '@/hooks/use-toast';
import { getFriendlyErrorMessage } from '@/lib/errors';

type Answers = {
  primary_goal: string;
  focus_area: string;
  main_difficulty: string;
  alert_style: string;
};

const focusOptions = [
  { value: 'financas', label: 'Finanças', icon: Wallet, desc: 'Organizar dinheiro e gastos' },
  { value: 'habitos', label: 'Hábitos', icon: CheckSquare, desc: 'Construir rotina diária' },
  { value: 'metas', label: 'Metas', icon: Target, desc: 'Atingir objetivos concretos' },
  { value: 'tudo', label: 'Tudo junto', icon: Sparkles, desc: 'Visão integrada completa' },
];

const difficultyOptions = [
  'Gasto mais do que devo',
  'Não consigo manter rotina',
  'Falta clareza sobre metas',
  'Procrastino decisões importantes',
];

const alertOptions = [
  { value: 'suaves', label: 'Suaves', desc: 'Sugestões gentis e contextuais' },
  { value: 'diretos', label: 'Diretos', desc: 'Sem rodeios, direto ao ponto' },
];

export default function Onboarding() {
  const navigate = useNavigate();
  const { save } = useUserPreferences();
  const { toast } = useToast();
  const [step, setStep] = useState(0);
  const [answers, setAnswers] = useState<Answers>({
    primary_goal: '',
    focus_area: '',
    main_difficulty: '',
    alert_style: '',
  });

  const totalSteps = 4;
  const canAdvance =
    (step === 0 && answers.primary_goal.trim().length > 1) ||
    (step === 1 && !!answers.focus_area) ||
    (step === 2 && !!answers.main_difficulty) ||
    (step === 3 && !!answers.alert_style);

  const handleNext = async () => {
    if (step < totalSteps - 1) {
      setStep((s) => s + 1);
      return;
    }
    try {
      await save.mutateAsync(answers);
      toast({ title: 'Tudo pronto!', description: 'Seu BlacckCore foi personalizado.' });
      navigate('/', { replace: true });
    } catch (e) {
      toast({
        title: 'Erro',
        description: getFriendlyErrorMessage(e, 'Não foi possível salvar.'),
        variant: 'destructive',
      });
    }
  };

  return (
    <div className="min-h-screen bg-[#0A0A0A] text-foreground flex items-center justify-center p-6">
      <div
        className="pointer-events-none absolute inset-0 overflow-hidden"
        aria-hidden="true"
      >
        <div
          className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[700px] h-[700px] rounded-full opacity-40"
          style={{
            background:
              'radial-gradient(closest-side, hsl(var(--brand) / 0.18), transparent 70%)',
            filter: 'blur(30px)',
          }}
        />
      </div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="relative w-full max-w-xl"
      >
        {/* Progress */}
        <div className="flex items-center gap-2 mb-10">
          {Array.from({ length: totalSteps }).map((_, i) => (
            <div
              key={i}
              className="flex-1 h-1 rounded-full transition-all duration-500"
              style={{
                background:
                  i <= step ? 'hsl(var(--brand))' : 'hsl(0 0% 100% / 0.08)',
                boxShadow:
                  i === step ? '0 0 12px hsl(var(--brand-glow))' : undefined,
              }}
            />
          ))}
        </div>

        <AnimatePresence mode="wait">
          <motion.div
            key={step}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.25 }}
            className="space-y-6"
          >
            <div>
              <p className="text-xs uppercase tracking-widest text-muted-foreground mb-2">
                Passo {step + 1} de {totalSteps}
              </p>
              <h1 className="font-display text-2xl sm:text-3xl font-bold tracking-tight">
                {step === 0 && 'Qual seu objetivo principal agora?'}
                {step === 1 && 'No que você quer focar primeiro?'}
                {step === 2 && 'Qual sua maior dificuldade hoje?'}
                {step === 3 && 'Como prefere receber alertas?'}
              </h1>
            </div>

            {step === 0 && (
              <Input
                autoFocus
                value={answers.primary_goal}
                onChange={(e) =>
                  setAnswers({ ...answers, primary_goal: e.target.value })
                }
                placeholder="Ex: economizar R$ 5.000 e dormir melhor"
                className="h-12 bg-white/[0.03] border-white/10 text-base"
              />
            )}

            {step === 1 && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {focusOptions.map((opt) => {
                  const active = answers.focus_area === opt.value;
                  return (
                    <button
                      key={opt.value}
                      onClick={() => setAnswers({ ...answers, focus_area: opt.value })}
                      className="text-left p-4 rounded-xl border transition-all"
                      style={{
                        background: active
                          ? 'hsl(var(--brand) / 0.08)'
                          : 'hsl(0 0% 100% / 0.02)',
                        borderColor: active
                          ? 'hsl(var(--brand) / 0.5)'
                          : 'hsl(0 0% 100% / 0.08)',
                      }}
                    >
                      <opt.icon
                        className="h-5 w-5 mb-2"
                        style={{ color: active ? 'hsl(var(--brand))' : undefined }}
                      />
                      <p className="font-semibold text-sm">{opt.label}</p>
                      <p className="text-xs text-muted-foreground">{opt.desc}</p>
                    </button>
                  );
                })}
              </div>
            )}

            {step === 2 && (
              <div className="space-y-2">
                {difficultyOptions.map((opt) => {
                  const active = answers.main_difficulty === opt;
                  return (
                    <button
                      key={opt}
                      onClick={() => setAnswers({ ...answers, main_difficulty: opt })}
                      className="w-full flex items-center justify-between p-4 rounded-xl border text-left transition-all"
                      style={{
                        background: active
                          ? 'hsl(var(--brand) / 0.08)'
                          : 'hsl(0 0% 100% / 0.02)',
                        borderColor: active
                          ? 'hsl(var(--brand) / 0.5)'
                          : 'hsl(0 0% 100% / 0.08)',
                      }}
                    >
                      <span className="text-sm font-medium">{opt}</span>
                      {active && (
                        <Check
                          className="h-4 w-4"
                          style={{ color: 'hsl(var(--brand))' }}
                        />
                      )}
                    </button>
                  );
                })}
              </div>
            )}

            {step === 3 && (
              <div className="grid grid-cols-2 gap-3">
                {alertOptions.map((opt) => {
                  const active = answers.alert_style === opt.value;
                  return (
                    <button
                      key={opt.value}
                      onClick={() => setAnswers({ ...answers, alert_style: opt.value })}
                      className="p-5 rounded-xl border text-left transition-all"
                      style={{
                        background: active
                          ? 'hsl(var(--brand) / 0.08)'
                          : 'hsl(0 0% 100% / 0.02)',
                        borderColor: active
                          ? 'hsl(var(--brand) / 0.5)'
                          : 'hsl(0 0% 100% / 0.08)',
                      }}
                    >
                      <p className="font-semibold text-base mb-1">{opt.label}</p>
                      <p className="text-xs text-muted-foreground">{opt.desc}</p>
                    </button>
                  );
                })}
              </div>
            )}

            <div className="flex items-center justify-between pt-4">
              <Button
                variant="ghost"
                onClick={() => (step > 0 ? setStep(step - 1) : navigate('/'))}
                className="text-muted-foreground"
              >
                {step > 0 ? 'Voltar' : 'Pular'}
              </Button>
              <Button
                disabled={!canAdvance || save.isPending}
                onClick={handleNext}
                className="h-11 px-6 font-semibold gap-2"
                style={{
                  background: 'hsl(var(--brand))',
                  color: 'hsl(var(--brand-foreground))',
                  boxShadow: '0 0 24px hsl(var(--brand-glow))',
                }}
              >
                {step === totalSteps - 1 ? 'Finalizar' : 'Continuar'}
                <ArrowRight className="h-4 w-4" />
              </Button>
            </div>
          </motion.div>
        </AnimatePresence>
      </motion.div>
    </div>
  );
}
