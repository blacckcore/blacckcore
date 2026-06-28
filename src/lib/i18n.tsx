import { createContext, ReactNode, useCallback, useContext, useEffect, useMemo, useState } from 'react';

export type Language = 'pt-BR' | 'en' | 'es';

export const languages: Array<{ code: Language; label: string; shortLabel: string }> = [
  { code: 'pt-BR', label: 'Portugues do Brasil', shortLabel: 'PT-BR' },
  { code: 'en', label: 'English', shortLabel: 'EN' },
  { code: 'es', label: 'Espanol', shortLabel: 'ES' },
];

const STORAGE_KEY = 'blackcore-language';

const dictionaries: Record<Language, Record<string, string>> = {
  'pt-BR': {
    'nav.dashboard': 'Dashboard',
    'nav.expenses': 'Despesas',
    'nav.savings': 'Economia',
    'nav.income': 'A Receber',
    'nav.habits': 'Habitos',
    'nav.goals': 'Metas',
    'nav.analytics': 'Analises',
    'nav.settings': 'Configuracoes',
    'nav.logout': 'Sair',
    'language.label': 'Idioma',
    'dashboard.eyebrow': 'Centro de comando',
    'dashboard.title': 'Bom te ver no BlacckCore',
    'dashboard.subtitle': 'Seu mes esta em atencao. Veja dinheiro, habitos e metas juntos para decidir o proximo passo sem ruido.',
    'dashboard.savedMoney': 'Dinheiro guardado',
    'dashboard.monthExpense': 'Gasto no mes',
    'dashboard.receivable': 'A receber',
    'dashboard.todayHabits': 'Habitos hoje',
    'dashboard.reserveGoal': 'Defina uma meta de reserva',
    'dashboard.monthExpenseSubtitle': 'Gasto registrado neste mes',
    'dashboard.received': '{value} recebido',
    'dashboard.firstHabit': 'Crie seu primeiro habito',
    'dashboard.goalPercent': '{value}% da meta',
    'dashboard.completedToday': '{value}% concluido hoje',
    'dashboard.insights': 'Insights inteligentes',
    'dashboard.attention': 'O que merece sua atencao agora',
    'dashboard.positiveFlow': 'Fluxo positivo',
    'dashboard.positiveFlowText': 'Voce esta com {value} de margem entre receitas recebidas e despesas.',
    'dashboard.adjustNeeded': 'Ajuste necessario',
    'dashboard.adjustNeededText': 'Suas despesas passaram as receitas em {value}. Corte um gasto variavel primeiro.',
    'dashboard.habitRhythm': 'Ritmo de habitos',
    'dashboard.habitGoodText': 'Voce concluiu {value}% da rotina de hoje. Mantenha o bloco principal intacto.',
    'dashboard.habitLowText': 'Voce concluiu {value}% da rotina de hoje. Escolha um habito pequeno para destravar agora.',
    'dashboard.startSimple': 'Comece simples',
    'dashboard.startSimpleText': 'Cadastre 3 habitos: sono, treino e planejamento. O dashboard fica util em poucos dias.',
    'dashboard.reserveTarget': 'Meta de reserva',
    'dashboard.reserveMissingText': 'Faltam {value} para fechar sua meta de economia.',
    'dashboard.reserveDoneText': 'Sua meta de economia foi alcancada. Crie a proxima camada da reserva.',
    'dashboard.smartReserve': 'Reserva inteligente',
    'dashboard.smartReserveText': 'Defina uma meta de economia para acompanhar prazo, progresso e valor restante.',
    'dashboard.copilot': 'Copiloto',
    'dashboard.copilotIntro': 'Use as perguntas prontas para transformar os dados do painel em uma proxima acao.',
    'dashboard.promptSave': 'Como posso economizar mais este mes?',
    'dashboard.promptHabit': 'Qual habito devo priorizar hoje?',
    'dashboard.promptReserve': 'Minha reserva esta no ritmo certo?',
    'dashboard.noExpensesTitle': 'Ainda nao tenho gastos para analisar',
    'dashboard.noExpensesText': 'Registre algumas despesas pelo WhatsApp ou pela tela de despesas. Depois eu consigo apontar onde cortar primeiro.',
    'dashboard.openExpenses': 'Abrir despesas',
    'dashboard.cutExpenseTitle': 'Corte um gasto variavel primeiro',
    'dashboard.cutExpenseText': 'Suas despesas passaram as receitas recebidas em {value}. Comece revendo mercado, delivery, cartao e compras pequenas do mes.',
    'dashboard.viewExpenses': 'Ver despesas',
    'dashboard.positiveMarginTitle': 'Voce ainda tem margem positiva',
    'dashboard.positiveMarginText': 'Sua margem atual e {value}. Para economizar mais, escolha um limite pequeno para gastos variaveis ate o fim do mes.',
    'dashboard.createSimpleHabitTitle': 'Crie um habito bem simples',
    'dashboard.createSimpleHabitText': 'Comece com uma acao de ate 5 minutos, como ler 1 pagina, caminhar 500 metros ou beber agua.',
    'dashboard.createHabit': 'Criar habito',
    'dashboard.prioritize': 'Priorize: {name}',
    'dashboard.prioritizeText': 'Esse e o proximo habito pendente de hoje. Faca uma versao pequena agora e marque como concluido.',
    'dashboard.openHabits': 'Abrir habitos',
    'dashboard.todayCompleteTitle': 'Rotina de hoje completa',
    'dashboard.todayCompleteText': 'Todos os habitos de hoje foram concluidos. Mantenha o ritmo e evite criar coisa demais de uma vez.',
    'dashboard.viewHabits': 'Ver habitos',
    'dashboard.noReserveGoalTitle': 'Sua reserva ainda nao tem meta',
    'dashboard.noReserveGoalText': 'Voce tem {value} guardado. Defina uma meta para eu conseguir acompanhar se a reserva esta no ritmo certo.',
    'dashboard.setGoal': 'Definir meta',
    'dashboard.reserveAboveTitle': 'Reserva acima da meta',
    'dashboard.reserveAboveText': 'Voce tem {saved} guardado e a meta era {goal}. Agora vale criar a proxima camada da reserva.',
    'dashboard.viewSavings': 'Ver economia',
    'dashboard.reserveProgressTitle': 'Reserva em andamento',
    'dashboard.reserveProgressText': 'Voce tem {saved} de {goal} ({progress}%). Faltam {missing} para completar a meta.',
    'dashboard.dailyProgress': 'Progresso Diario',
    'dashboard.completedHabits': 'Habitos completados',
    'dashboard.allHabitsDone': 'Todos os habitos foram completados hoje.',
    'dashboard.remainingHabits': '{count} habitos restantes',
    'dashboard.savingsGoal': 'Meta de Economia',
  },
  en: {
    'nav.dashboard': 'Dashboard',
    'nav.expenses': 'Expenses',
    'nav.savings': 'Savings',
    'nav.income': 'Receivables',
    'nav.habits': 'Habits',
    'nav.goals': 'Goals',
    'nav.analytics': 'Analytics',
    'nav.settings': 'Settings',
    'nav.logout': 'Log out',
    'language.label': 'Language',
    'dashboard.eyebrow': 'Command center',
    'dashboard.title': 'Good to see you in BlacckCore',
    'dashboard.subtitle': 'Your month needs attention. See money, habits and goals together to choose the next step without noise.',
    'dashboard.savedMoney': 'Saved money',
    'dashboard.monthExpense': 'Monthly spending',
    'dashboard.receivable': 'Receivable',
    'dashboard.todayHabits': 'Habits today',
    'dashboard.reserveGoal': 'Set a reserve goal',
    'dashboard.monthExpenseSubtitle': 'Spending recorded this month',
    'dashboard.received': '{value} received',
    'dashboard.firstHabit': 'Create your first habit',
    'dashboard.goalPercent': '{value}% of goal',
    'dashboard.completedToday': '{value}% completed today',
    'dashboard.insights': 'Smart insights',
    'dashboard.attention': 'What needs your attention now',
    'dashboard.positiveFlow': 'Positive cash flow',
    'dashboard.positiveFlowText': 'You have {value} of margin between received income and expenses.',
    'dashboard.adjustNeeded': 'Adjustment needed',
    'dashboard.adjustNeededText': 'Your expenses exceeded income by {value}. Cut one variable expense first.',
    'dashboard.habitRhythm': 'Habit rhythm',
    'dashboard.habitGoodText': 'You completed {value}% of today routine. Keep the main block intact.',
    'dashboard.habitLowText': 'You completed {value}% of today routine. Pick one small habit to unlock progress now.',
    'dashboard.startSimple': 'Start simple',
    'dashboard.startSimpleText': 'Add 3 habits: sleep, training and planning. The dashboard becomes useful in a few days.',
    'dashboard.reserveTarget': 'Reserve goal',
    'dashboard.reserveMissingText': 'You still need {value} to complete your savings goal.',
    'dashboard.reserveDoneText': 'Your savings goal was reached. Create the next reserve layer.',
    'dashboard.smartReserve': 'Smart reserve',
    'dashboard.smartReserveText': 'Set a savings goal to track deadline, progress and remaining amount.',
    'dashboard.copilot': 'Copilot',
    'dashboard.copilotIntro': 'Use ready questions to turn dashboard data into a next action.',
    'dashboard.promptSave': 'How can I save more this month?',
    'dashboard.promptHabit': 'Which habit should I prioritize today?',
    'dashboard.promptReserve': 'Is my reserve on track?',
    'dashboard.noExpensesTitle': 'I do not have expenses to analyze yet',
    'dashboard.noExpensesText': 'Record a few expenses by WhatsApp or the expenses screen. Then I can show where to cut first.',
    'dashboard.openExpenses': 'Open expenses',
    'dashboard.cutExpenseTitle': 'Cut one variable expense first',
    'dashboard.cutExpenseText': 'Your expenses exceeded received income by {value}. Start by reviewing groceries, delivery, card and small purchases.',
    'dashboard.viewExpenses': 'View expenses',
    'dashboard.positiveMarginTitle': 'You still have positive margin',
    'dashboard.positiveMarginText': 'Your current margin is {value}. To save more, set a small variable spending limit until the end of the month.',
    'dashboard.createSimpleHabitTitle': 'Create a very simple habit',
    'dashboard.createSimpleHabitText': 'Start with an action up to 5 minutes, like reading 1 page, walking 500 meters or drinking water.',
    'dashboard.createHabit': 'Create habit',
    'dashboard.prioritize': 'Prioritize: {name}',
    'dashboard.prioritizeText': 'This is the next pending habit for today. Do a small version now and mark it as completed.',
    'dashboard.openHabits': 'Open habits',
    'dashboard.todayCompleteTitle': 'Today routine is complete',
    'dashboard.todayCompleteText': 'All habits for today are completed. Keep the rhythm and avoid adding too much at once.',
    'dashboard.viewHabits': 'View habits',
    'dashboard.noReserveGoalTitle': 'Your reserve does not have a goal yet',
    'dashboard.noReserveGoalText': 'You have {value} saved. Set a goal so I can track whether your reserve is on pace.',
    'dashboard.setGoal': 'Set goal',
    'dashboard.reserveAboveTitle': 'Reserve above goal',
    'dashboard.reserveAboveText': 'You have {saved} saved and the goal was {goal}. Now create the next reserve layer.',
    'dashboard.viewSavings': 'View savings',
    'dashboard.reserveProgressTitle': 'Reserve in progress',
    'dashboard.reserveProgressText': 'You have {saved} of {goal} ({progress}%). {missing} left to complete the goal.',
    'dashboard.dailyProgress': 'Daily progress',
    'dashboard.completedHabits': 'Completed habits',
    'dashboard.allHabitsDone': 'All habits were completed today.',
    'dashboard.remainingHabits': '{count} habits remaining',
    'dashboard.savingsGoal': 'Savings goal',
  },
  es: {
    'nav.dashboard': 'Panel',
    'nav.expenses': 'Gastos',
    'nav.savings': 'Ahorros',
    'nav.income': 'Por cobrar',
    'nav.habits': 'Habitos',
    'nav.goals': 'Metas',
    'nav.analytics': 'Analisis',
    'nav.settings': 'Configuracion',
    'nav.logout': 'Salir',
    'language.label': 'Idioma',
    'dashboard.eyebrow': 'Centro de comando',
    'dashboard.title': 'Bueno verte en BlacckCore',
    'dashboard.subtitle': 'Tu mes necesita atencion. Mira dinero, habitos y metas juntos para decidir el proximo paso sin ruido.',
    'dashboard.savedMoney': 'Dinero guardado',
    'dashboard.monthExpense': 'Gasto del mes',
    'dashboard.receivable': 'Por cobrar',
    'dashboard.todayHabits': 'Habitos hoy',
    'dashboard.reserveGoal': 'Define una meta de reserva',
    'dashboard.monthExpenseSubtitle': 'Gasto registrado este mes',
    'dashboard.received': '{value} recibido',
    'dashboard.firstHabit': 'Crea tu primer habito',
    'dashboard.goalPercent': '{value}% de la meta',
    'dashboard.completedToday': '{value}% completado hoy',
    'dashboard.insights': 'Insights inteligentes',
    'dashboard.attention': 'Lo que merece tu atencion ahora',
    'dashboard.positiveFlow': 'Flujo positivo',
    'dashboard.positiveFlowText': 'Tienes {value} de margen entre ingresos recibidos y gastos.',
    'dashboard.adjustNeeded': 'Ajuste necesario',
    'dashboard.adjustNeededText': 'Tus gastos superaron los ingresos en {value}. Recorta primero un gasto variable.',
    'dashboard.habitRhythm': 'Ritmo de habitos',
    'dashboard.habitGoodText': 'Completaste {value}% de la rutina de hoy. Mantén intacto el bloque principal.',
    'dashboard.habitLowText': 'Completaste {value}% de la rutina de hoy. Elige un habito pequeno para avanzar ahora.',
    'dashboard.startSimple': 'Empieza simple',
    'dashboard.startSimpleText': 'Agrega 3 habitos: dormir, entrenar y planificar. El panel sera util en pocos dias.',
    'dashboard.reserveTarget': 'Meta de reserva',
    'dashboard.reserveMissingText': 'Faltan {value} para cerrar tu meta de ahorro.',
    'dashboard.reserveDoneText': 'Tu meta de ahorro fue alcanzada. Crea la siguiente capa de reserva.',
    'dashboard.smartReserve': 'Reserva inteligente',
    'dashboard.smartReserveText': 'Define una meta de ahorro para seguir plazo, progreso y valor restante.',
    'dashboard.copilot': 'Copiloto',
    'dashboard.copilotIntro': 'Usa preguntas listas para transformar los datos del panel en una proxima accion.',
    'dashboard.promptSave': 'Como puedo ahorrar mas este mes?',
    'dashboard.promptHabit': 'Que habito debo priorizar hoy?',
    'dashboard.promptReserve': 'Mi reserva va en buen ritmo?',
    'dashboard.noExpensesTitle': 'Aun no tengo gastos para analizar',
    'dashboard.noExpensesText': 'Registra algunos gastos por WhatsApp o por la pantalla de gastos. Luego puedo mostrar donde recortar primero.',
    'dashboard.openExpenses': 'Abrir gastos',
    'dashboard.cutExpenseTitle': 'Recorta un gasto variable primero',
    'dashboard.cutExpenseText': 'Tus gastos superaron los ingresos recibidos en {value}. Empieza revisando mercado, delivery, tarjeta y compras pequenas.',
    'dashboard.viewExpenses': 'Ver gastos',
    'dashboard.positiveMarginTitle': 'Todavia tienes margen positivo',
    'dashboard.positiveMarginText': 'Tu margen actual es {value}. Para ahorrar mas, elige un limite pequeno para gastos variables hasta fin de mes.',
    'dashboard.createSimpleHabitTitle': 'Crea un habito muy simple',
    'dashboard.createSimpleHabitText': 'Empieza con una accion de hasta 5 minutos, como leer 1 pagina, caminar 500 metros o beber agua.',
    'dashboard.createHabit': 'Crear habito',
    'dashboard.prioritize': 'Prioriza: {name}',
    'dashboard.prioritizeText': 'Este es el proximo habito pendiente de hoy. Haz una version pequena ahora y marcalo como completado.',
    'dashboard.openHabits': 'Abrir habitos',
    'dashboard.todayCompleteTitle': 'Rutina de hoy completa',
    'dashboard.todayCompleteText': 'Todos los habitos de hoy fueron completados. Mantén el ritmo y evita crear demasiadas cosas a la vez.',
    'dashboard.viewHabits': 'Ver habitos',
    'dashboard.noReserveGoalTitle': 'Tu reserva aun no tiene meta',
    'dashboard.noReserveGoalText': 'Tienes {value} guardado. Define una meta para que pueda acompanhar si la reserva va en buen ritmo.',
    'dashboard.setGoal': 'Definir meta',
    'dashboard.reserveAboveTitle': 'Reserva por encima de la meta',
    'dashboard.reserveAboveText': 'Tienes {saved} guardado y la meta era {goal}. Ahora conviene crear la siguiente capa de reserva.',
    'dashboard.viewSavings': 'Ver ahorros',
    'dashboard.reserveProgressTitle': 'Reserva en progreso',
    'dashboard.reserveProgressText': 'Tienes {saved} de {goal} ({progress}%). Faltan {missing} para completar la meta.',
    'dashboard.dailyProgress': 'Progreso diario',
    'dashboard.completedHabits': 'Habitos completados',
    'dashboard.allHabitsDone': 'Todos los habitos fueron completados hoy.',
    'dashboard.remainingHabits': '{count} habitos restantes',
    'dashboard.savingsGoal': 'Meta de ahorro',
  },
};

type I18nContextValue = {
  language: Language;
  locale: string;
  setLanguage: (language: Language) => void;
  t: (key: string, values?: Record<string, string | number>) => string;
  money: (value: number) => string;
};

const I18nContext = createContext<I18nContextValue | null>(null);

function getInitialLanguage(): Language {
  if (typeof window === 'undefined') return 'pt-BR';
  const stored = window.localStorage.getItem(STORAGE_KEY) as Language | null;
  if (stored === 'pt-BR' || stored === 'en' || stored === 'es') return stored;
  const browserLanguage = window.navigator.language.toLowerCase();
  if (browserLanguage.startsWith('es')) return 'es';
  if (browserLanguage.startsWith('en')) return 'en';
  return 'pt-BR';
}

export function getLocale(language: Language) {
  if (language === 'en') return 'en-US';
  if (language === 'es') return 'es-ES';
  return 'pt-BR';
}

export function LanguageProvider({ children }: { children: ReactNode }) {
  const [language, setLanguageState] = useState<Language>(getInitialLanguage);
  const locale = getLocale(language);

  const setLanguage = useCallback((nextLanguage: Language) => {
    setLanguageState(nextLanguage);
    window.localStorage.setItem(STORAGE_KEY, nextLanguage);
  }, []);

  useEffect(() => {
    document.documentElement.lang = language;
  }, [language]);

  const t = useCallback((key: string, values?: Record<string, string | number>) => {
    const template = dictionaries[language][key] ?? dictionaries['pt-BR'][key] ?? key;
    if (!values) return template;
    return template.replace(/\{(\w+)\}/g, (_, valueKey) => String(values[valueKey] ?? ''));
  }, [language]);

  const money = useCallback((value: number) => (
    new Intl.NumberFormat(locale, { style: 'currency', currency: 'BRL' }).format(value)
  ), [locale]);

  const value = useMemo(() => ({ language, locale, setLanguage, t, money }), [language, locale, setLanguage, t, money]);

  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>;
}

export function useI18n() {
  const context = useContext(I18nContext);
  if (!context) throw new Error('useI18n must be used inside LanguageProvider');
  return context;
}
