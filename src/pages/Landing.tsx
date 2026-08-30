import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  ArrowRight,
  Wallet,
  Target,
  CheckSquare,
  Sparkles,
  TrendingUp,
  Shield,
  Zap,
} from 'lucide-react';
import { Button } from '@/components/ui/button';

const features = [
  {
    icon: Wallet,
    title: 'Finanças',
    desc: 'Despesas, receitas, reserva e dívidas — em um painel só.',
  },
  {
    icon: CheckSquare,
    title: 'Hábitos',
    desc: 'Rotina diária com streaks, lembretes e heatmap.',
  },
  {
    icon: Target,
    title: 'Metas',
    desc: 'Defina, acompanhe e simule cenários de evolução.',
  },
  {
    icon: Sparkles,
    title: 'Insights',
    desc: 'Recomendações inteligentes baseadas no seu comportamento.',
  },
];

export default function Landing() {
  return (
    <div className="min-h-screen bg-[#0A0A0A] text-foreground overflow-x-hidden">
      {/* Ambient glows */}
      <div
        className="pointer-events-none absolute inset-0 -z-10 overflow-hidden"
        aria-hidden="true"
      >
        <div
          className="absolute -top-40 left-1/2 -translate-x-1/2 w-[900px] h-[900px] rounded-full opacity-60"
          style={{
            background:
              'radial-gradient(closest-side, hsl(var(--brand) / 0.18), transparent 70%)',
            filter: 'blur(20px)',
          }}
        />
        <div
          className="absolute top-1/3 -right-40 w-[500px] h-[500px] rounded-full opacity-40"
          style={{
            background:
              'radial-gradient(closest-side, hsl(var(--brand) / 0.12), transparent 70%)',
            filter: 'blur(30px)',
          }}
        />
        <div
          className="absolute inset-0 opacity-[0.04]"
          style={{
            backgroundImage:
              'linear-gradient(hsl(0 0% 100%) 1px, transparent 1px), linear-gradient(90deg, hsl(0 0% 100%) 1px, transparent 1px)',
            backgroundSize: '64px 64px',
            maskImage:
              'radial-gradient(ellipse 80% 60% at 50% 30%, black 30%, transparent 80%)',
          }}
        />
      </div>

      {/* Nav */}
      <header className="relative z-10 max-w-7xl mx-auto px-6 lg:px-10 py-6 flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div
            className="w-9 h-9 rounded-xl flex items-center justify-center"
            style={{
              background:
                'linear-gradient(135deg, hsl(var(--brand)), hsl(212 100% 42%))',
              boxShadow: '0 0 24px hsl(var(--brand-glow))',
            }}
          >
            <span className="text-sm font-bold text-black font-display">B</span>
          </div>
          <span className="font-display font-bold text-lg tracking-tight">
            BlacckCore
          </span>
        </div>
        <div className="flex items-center gap-2">
          <Link to="/auth">
            <Button
              variant="ghost"
              size="sm"
              className="text-sm text-muted-foreground hover:text-foreground"
            >
              Entrar
            </Button>
          </Link>
          <Link to="/auth">
            <Button
              size="sm"
              className="text-sm font-semibold"
              style={{
                background: 'hsl(var(--brand))',
                color: 'hsl(var(--brand-foreground))',
              }}
            >
              Começar
            </Button>
          </Link>
        </div>
      </header>

      {/* Hero */}
      <section className="relative z-10 max-w-7xl mx-auto px-6 lg:px-10 pt-16 lg:pt-28 pb-24 text-center">
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
          className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full border border-white/10 bg-white/[0.03] text-xs text-muted-foreground mb-8"
        >
          <span
            className="w-1.5 h-1.5 rounded-full animate-pulse"
            style={{ background: 'hsl(var(--brand))' }}
          />
          Seu centro de comando pessoal
        </motion.div>

        <motion.h1
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.05, ease: [0.16, 1, 0.3, 1] }}
          className="font-display font-bold tracking-tight text-5xl sm:text-6xl lg:text-7xl leading-[1.02] max-w-4xl mx-auto"
        >
          Finanças, hábitos e metas
          <br />
          <span
            style={{
              background:
                'linear-gradient(135deg, hsl(var(--brand)) 0%, #B7FFD5 100%)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              backgroundClip: 'text',
            }}
          >
            com inteligência.
          </span>
        </motion.h1>

        <motion.p
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.15 }}
          className="mt-7 text-base sm:text-lg text-muted-foreground max-w-2xl mx-auto leading-relaxed"
        >
          O BlacckCore conecta seu dinheiro, sua rotina e seus objetivos para
          mostrar onde você está evoluindo, onde está perdendo energia e quais
          decisões tomar agora.
        </motion.p>

        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.25 }}
          className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-3"
        >
          <Link to="/auth">
            <Button
              size="lg"
              className="h-12 px-7 text-sm font-semibold gap-2 group"
              style={{
                background: 'hsl(var(--brand))',
                color: 'hsl(var(--brand-foreground))',
                boxShadow: '0 0 32px hsl(var(--brand-glow))',
              }}
            >
              Começar agora
              <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
            </Button>
          </Link>
          <a href="#preview">
            <Button
              variant="outline"
              size="lg"
              className="h-12 px-7 text-sm font-medium border-white/15 bg-white/[0.02] hover:bg-white/[0.05]"
            >
              Ver demonstração
            </Button>
          </a>
        </motion.div>

        {/* Trust line */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.7, delay: 0.4 }}
          className="mt-12 flex items-center justify-center gap-6 text-xs text-muted-foreground"
        >
          <span className="flex items-center gap-1.5">
            <Shield className="h-3.5 w-3.5" /> Dados criptografados
          </span>
          <span className="flex items-center gap-1.5">
            <Zap className="h-3.5 w-3.5" /> Setup em 60 segundos
          </span>
        </motion.div>
      </section>

      {/* Features */}
      <section className="relative z-10 max-w-7xl mx-auto px-6 lg:px-10 pb-24">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {features.map((f, i) => (
            <motion.div
              key={f.title}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: i * 0.07 }}
              className="group relative p-6 rounded-2xl border border-white/10 bg-white/[0.02] hover:bg-white/[0.04] hover:border-white/15 transition-all"
            >
              <div
                className="w-10 h-10 rounded-xl flex items-center justify-center mb-4 transition-all group-hover:scale-105"
                style={{
                  background: 'hsl(var(--brand) / 0.12)',
                  boxShadow: 'inset 0 0 0 1px hsl(var(--brand) / 0.2)',
                }}
              >
                <f.icon className="h-5 w-5" style={{ color: 'hsl(var(--brand))' }} />
              </div>
              <h3 className="font-display font-semibold text-base mb-1.5">{f.title}</h3>
              <p className="text-sm text-muted-foreground leading-relaxed">{f.desc}</p>
            </motion.div>
          ))}
        </div>
      </section>

      {/* Dashboard preview */}
      <section
        id="preview"
        className="relative z-10 max-w-6xl mx-auto px-6 lg:px-10 pb-32"
      >
        <div className="text-center mb-12">
          <p className="text-xs font-medium uppercase tracking-widest text-muted-foreground mb-3">
            Dashboard inteligente
          </p>
          <h2 className="font-display text-3xl sm:text-4xl font-bold tracking-tight">
            Tudo o que importa, em uma tela.
          </h2>
        </div>

        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8 }}
          className="relative rounded-3xl border border-white/10 bg-gradient-to-b from-white/[0.04] to-transparent p-3 lg:p-4"
          style={{
            boxShadow:
              '0 0 80px hsl(var(--brand-glow)), 0 30px 60px -20px hsl(0 0% 0% / 0.5)',
          }}
        >
          <div className="rounded-2xl bg-[#0F0F0F] border border-white/5 p-6 lg:p-8">
            <div className="flex items-center justify-between mb-6">
              <div>
                <p className="text-[10px] uppercase tracking-widest text-muted-foreground mb-1">
                  Visão geral
                </p>
                <h3 className="font-display text-xl font-bold">Olá, este é o seu Core.</h3>
              </div>
              <div
                className="px-3 py-1.5 rounded-full text-xs font-medium"
                style={{
                  background: 'hsl(var(--brand) / 0.12)',
                  color: 'hsl(var(--brand))',
                  border: '1px solid hsl(var(--brand) / 0.25)',
                }}
              >
                Premium
              </div>
            </div>

            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-6">
              {[
                { label: 'Saldo', value: 'R$ 12.480', delta: '+8,2%' },
                { label: 'Despesas', value: 'R$ 3.210', delta: '-4,1%' },
                { label: 'Hábitos', value: '6/8', delta: 'Hoje' },
                { label: 'Metas', value: '72%', delta: 'Em dia' },
              ].map((s) => (
                <div
                  key={s.label}
                  className="p-4 rounded-xl border border-white/10 bg-white/[0.02]"
                >
                  <p className="text-[10px] uppercase tracking-widest text-muted-foreground mb-2">
                    {s.label}
                  </p>
                  <p className="font-display text-xl font-bold">{s.value}</p>
                  <p
                    className="text-[10px] mt-1"
                    style={{ color: 'hsl(var(--brand))' }}
                  >
                    {s.delta}
                  </p>
                </div>
              ))}
            </div>

            <div className="grid lg:grid-cols-3 gap-3">
              <div className="lg:col-span-2 p-5 rounded-xl border border-white/10 bg-white/[0.02] min-h-[180px]">
                <div className="flex items-center justify-between mb-4">
                  <p className="text-sm font-semibold">Evolução semanal</p>
                  <TrendingUp className="h-4 w-4" style={{ color: 'hsl(var(--brand))' }} />
                </div>
                <div className="flex items-end gap-2 h-24">
                  {[40, 65, 50, 80, 45, 90, 70].map((h, i) => (
                    <div
                      key={i}
                      className="flex-1 rounded-t-md transition-all"
                      style={{
                        height: `${h}%`,
                        background:
                          'linear-gradient(180deg, hsl(var(--brand) / 0.8), hsl(var(--brand) / 0.15))',
                      }}
                    />
                  ))}
                </div>
              </div>
              <div className="p-5 rounded-xl border border-white/10 bg-white/[0.02]">
                <div className="flex items-center gap-2 mb-3">
                  <Sparkles className="h-4 w-4" style={{ color: 'hsl(var(--brand))' }} />
                  <p className="text-sm font-semibold">Insight</p>
                </div>
                <p className="text-xs text-muted-foreground leading-relaxed">
                  Seus gastos com delivery subiram <strong className="text-foreground">18%</strong> esta semana. Reduza 2 pedidos e mantenha sua meta de reserva.
                </p>
              </div>
            </div>
          </div>
        </motion.div>
      </section>

      {/* Final CTA */}
      <section className="relative z-10 max-w-3xl mx-auto px-6 pb-32 text-center">
        <h2 className="font-display text-3xl sm:text-4xl font-bold tracking-tight mb-4">
          Pronto para tomar o controle?
        </h2>
        <p className="text-muted-foreground mb-8">
          Crie sua conta gratuita e configure seu BlacckCore em menos de um minuto.
        </p>
        <Link to="/auth">
          <Button
            size="lg"
            className="h-12 px-8 text-sm font-semibold gap-2"
            style={{
              background: 'hsl(var(--brand))',
              color: 'hsl(var(--brand-foreground))',
              boxShadow: '0 0 32px hsl(var(--brand-glow))',
            }}
          >
            Começar agora
            <ArrowRight className="h-4 w-4" />
          </Button>
        </Link>
      </section>

      <footer className="relative z-10 border-t border-white/5 py-8 text-center text-xs text-muted-foreground">
        © {new Date().getFullYear()} BlacckCore · Seu centro de comando pessoal
      </footer>
    </div>
  );
}
