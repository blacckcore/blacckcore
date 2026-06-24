import { createClient } from "https://esm.sh/@supabase/supabase-js@2.96.0";

type ParsedAction =
  | { type: "expense"; amount: number; name: string; category: string; paymentMethod: string | null; status: "paid" | "pending"; date: string }
  | { type: "income"; amount: number; source: string; status: "received" | "pending"; date: string }
  | { type: "savings"; mode: "add" | "remove" | "set"; amount: number; description: string }
  | { type: "debt_create"; name: string; amount: number; dueDate: string | null }
  | { type: "debt_payment"; name: string; amount: number | null }
  | { type: "goal_create"; title: string; targetValue: number; endDate: string | null; progressType: "count" | "monetary" | "percentage" }
  | { type: "goal_progress"; title: string; amount: number }
  | { type: "query"; query: "expenses_today" | "expenses_week" | "savings" | "debts" | "receivables" | "month_summary" | "balance" }
  | { type: "ambiguous"; question: string }
  | { type: "habit"; name: string; complete: boolean; amount?: number; goalTitle?: string }
  | { type: "goal"; title: string; endDate: string | null; targetValue: number; progressType: "count" | "monetary" | "percentage" }
  | { type: "progress"; title: string; amount: number }
  | { type: "unknown"; reason: string };

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const supabaseUrl = Deno.env.get("SUPABASE_URL") ?? "";
const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";
const verifyToken = Deno.env.get("WHATSAPP_VERIFY_TOKEN") ?? "";
const whatsappToken = Deno.env.get("WHATSAPP_ACCESS_TOKEN") ?? "";
const graphVersion = Deno.env.get("WHATSAPP_GRAPH_VERSION") ?? "v23.0";

const supabase = createClient(supabaseUrl, serviceRoleKey);

function normalizePhone(value: string | undefined | null) {
  const digits = (value ?? "").replace(/\D/g, "");
  return digits ? `+${digits}` : "";
}

function stripAccents(value: string) {
  return value.normalize("NFD").replace(/[\u0300-\u036f]/g, "");
}

function normalizeText(value: string) {
  return stripAccents(value.toLowerCase()).replace(/\s+/g, " ").trim();
}

function parseMoney(value: string) {
  const raw = value.replace(/r\$/gi, "").replace(/\s/g, "");
  const hasComma = raw.includes(",");
  const hasDot = raw.includes(".");
  let cleaned = raw;

  if (hasComma && hasDot) {
    cleaned = raw.replace(/\./g, "").replace(",", ".");
  } else if (hasComma) {
    cleaned = raw.replace(",", ".");
  } else if (hasDot) {
    const parts = raw.split(".");
    cleaned = parts.length > 2 || parts.at(-1)?.length === 3 ? raw.replace(/\./g, "") : raw;
  }

  const amount = Number(cleaned);
  return Number.isFinite(amount) ? amount : 0;
}

function extractMoney(text: string) {
  const match = text.match(/(?:r\$\s*)?(\d{1,3}(?:\.\d{3})+(?:,\d{1,2})?|\d+(?:[,.]\d{1,2})?)/i);
  return match ? { raw: match[0], amount: parseMoney(match[1]) } : null;
}

function formatCurrency(value: number) {
  return new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(value);
}

function formatDisplayDate(date: string) {
  if (date === today()) return "Hoje";
  if (date === yesterday()) return "Ontem";
  if (date === tomorrow()) return "Amanha";
  const [year, month, day] = date.split("-");
  return `${day}/${month}/${year}`;
}

function today() {
  return localDateString(new Date());
}

function localDateString(date: Date) {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: "America/Sao_Paulo",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(date);

  const year = parts.find((part) => part.type === "year")?.value;
  const month = parts.find((part) => part.type === "month")?.value;
  const day = parts.find((part) => part.type === "day")?.value;
  return `${year}-${month}-${day}`;
}

function dateStringFromParts(year: number, month: number, day: number) {
  return `${year}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
}

function tomorrow() {
  const date = new Date();
  date.setDate(date.getDate() + 1);
  return localDateString(date);
}

function yesterday() {
  const date = new Date();
  date.setDate(date.getDate() - 1);
  return localDateString(date);
}

function addDays(days: number) {
  const date = new Date();
  date.setDate(date.getDate() + days);
  return localDateString(date);
}

const monthNames: Record<string, number> = {
  janeiro: 1,
  fevereiro: 2,
  marco: 3,
  abril: 4,
  maio: 5,
  junho: 6,
  julho: 7,
  agosto: 8,
  setembro: 9,
  outubro: 10,
  novembro: 11,
  dezembro: 12,
};

function parseDate(text: string) {
  const explicit = text.match(/\b(\d{1,2})[\/-](\d{1,2})(?:[\/-](\d{2,4}))?\b/);
  if (explicit) {
    const day = explicit[1].padStart(2, "0");
    const month = explicit[2].padStart(2, "0");
    const currentYear = new Date().getFullYear();
    const rawYear = explicit[3];
    const year = rawYear ? (rawYear.length === 2 ? `20${rawYear}` : rawYear) : String(currentYear);
    return `${year}-${month}-${day}`;
  }

  const dayOnly = text.match(/\bdia\s+(\d{1,2})\b/i);
  if (dayOnly) {
    const now = new Date();
    const day = Number(dayOnly[1]);
    const date = new Date(now.getFullYear(), now.getMonth(), day);
    if (date < new Date(now.getFullYear(), now.getMonth(), now.getDate())) {
      date.setMonth(date.getMonth() + 1);
    }
    return dateStringFromParts(date.getFullYear(), date.getMonth() + 1, date.getDate());
  }

  const untilMonth = text.match(/\b(?:ate|pra|para)\s+(janeiro|fevereiro|marco|abril|maio|junho|julho|agosto|setembro|outubro|novembro|dezembro)\b/i);
  if (untilMonth) {
    const now = new Date();
    const month = monthNames[untilMonth[1]];
    const year = month < now.getMonth() + 1 ? now.getFullYear() + 1 : now.getFullYear();
    return dateStringFromParts(year, month, new Date(year, month, 0).getDate());
  }

  if (/\bontem\b/i.test(text)) return yesterday();
  if (/\bamanha\b/i.test(text)) return tomorrow();
  if (/\bsemana que vem\b/i.test(text)) return addDays(7);
  if (/\bmes que vem\b/i.test(text)) {
    const date = new Date();
    date.setMonth(date.getMonth() + 1);
    return localDateString(date);
  }
  return today();
}

const numberWords: Record<string, number> = {
  um: 1,
  uma: 1,
  dois: 2,
  duas: 2,
  tres: 3,
  quatro: 4,
  cinco: 5,
  seis: 6,
  sete: 7,
  oito: 8,
  nove: 9,
  dez: 10,
};

function extractCount(text: string) {
  const numeric = text.match(/\b(\d+(?:[\.,]\d{1,2})?)\b/);
  if (numeric) return parseMoney(numeric[1]);

  for (const [word, value] of Object.entries(numberWords)) {
    if (new RegExp(`\\b${word}\\b`, "i").test(text)) return value;
  }

  return 0;
}

function cleanupLabel(text: string, options: { keepNumbers?: boolean } = {}) {
  let result = text
    .replace(/\b(?:hoje|ontem|amanha|semana que vem|mes que vem|dia|ate|em|no|na|para|pra|com|de|do|da|dos|das|o|a|os|as|reais|real|r\$)\b/gi, " ")
    .replace(/\b\d{1,2}[\/-]\d{1,2}(?:[\/-]\d{2,4})?\b/g, " ")
    .replace(/\s+/g, " ");

  if (!options.keepNumbers) {
    result = result
      .replace(/\b\d+(?:[\.,]\d{1,2})?\b/g, " ")
      .replace(/\b(?:um|uma|dois|duas|tres|quatro|cinco|seis|sete|oito|nove|dez)\b/gi, " ");
  }

  return result.replace(/\s+/g, " ").trim();
}

function stripMoneyAndDate(text: string) {
  const money = extractMoney(text);
  let result = money ? text.replace(money.raw, " ") : text;
  result = result
    .replace(/\b\d{1,2}[\/-]\d{1,2}(?:[\/-]\d{2,4})?\b/g, " ")
    .replace(/\bdia\s+\d{1,2}\b/gi, " ")
    .replace(/\b(?:hoje|ontem|amanha|semana que vem|mes que vem|ate\s+\w+)\b/gi, " ")
    .replace(/\s+/g, " ")
    .trim();
  return result;
}

function titleCase(value: string) {
  return value
    .trim()
    .split(" ")
    .filter(Boolean)
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
}

function inferCategory(text: string) {
  if (/\b(uber|99|taxi|onibus|gasolina|combustivel|transporte)\b/i.test(text)) return "Transporte";
  if (/\b(mercado|supermercado|comida|lanche|restaurante|ifood|alimento)\b/i.test(text)) return "Alimentacao";
  if (/\b(luz|agua|internet|telefone|energia|aluguel|condominio)\b/i.test(text)) return "Casa";
  if (/\b(cartao|nubank|banco|emprestimo|parcela|financiamento)\b/i.test(text)) return "Financeiro";
  if (/\b(remedio|farmacia|medico|saude)\b/i.test(text)) return "Saude";
  return "Sem categoria";
}

function inferPaymentMethod(text: string) {
  if (/\bpix\b/i.test(text)) return "Pix";
  if (/\bcartao\b/i.test(text)) return "Cartao";
  if (/\bdinheiro\b/i.test(text)) return "Dinheiro";
  if (/\bdebito\b/i.test(text)) return "Debito";
  if (/\bcredito\b/i.test(text)) return "Credito";
  return null;
}

function parseExpenseName(text: string) {
  const withoutCommand = stripMoneyAndDate(text).replace(/\b(gastei|paguei|despesa|comprei|compra|debito|boleto|pix|cartao|no|na|em|de|do|da)\b/gi, " ");
  return cleanupLabel(withoutCommand) || "Despesa via WhatsApp";
}

function parseIncomeSource(text: string) {
  const withoutCommand = stripMoneyAndDate(text).replace(/\b(recebi|receita|ganhei|entrada|entrou|vou receber|para receber|a receber|tenho|recebido|caiu|cliente|do|da|de)\b/gi, " ");
  return cleanupLabel(withoutCommand) || "Receita via WhatsApp";
}

function parseDebtName(text: string) {
  const withoutCommand = stripMoneyAndDate(text).replace(/\b(devo|divida|adicione|adicionar|paguei|quitei|quitei|da|do|de|no|na|vencendo)\b/gi, " ");
  return cleanupLabel(withoutCommand) || "Divida via WhatsApp";
}

function isAmbiguousMoneyMessage(text: string) {
  return /\b(cartao|nubank|banco)\b/i.test(text)
    && !!extractMoney(text)
    && !/\b(gastei|paguei|comprei|despesa|devo|divida|parcela|boleto)\b/i.test(text);
}

function normalizeKey(value: string) {
  return normalizeText(value)
    .replace(/\b(?:um|uma|dois|duas|tres|quatro|cinco|seis|sete|oito|nove|dez|\d+)\b/g, " ")
    .split(" ")
    .map((part) => part.replace(/s$/i, ""))
    .filter(Boolean)
    .join(" ");
}

function stripHabitCommand(text: string) {
  return normalizeText(text)
    .replace(/^(minha\s+)?(?:meta|objetivo)(?:\s+(?:de|para|pra)\s+hoje)?\s*(?:e|eh)?\s+/i, "")
    .replace(/^(?:novo|nova|criar|adicionar|add)\s+(?:habito|rotina)\s+(?:de\s+)?/i, "")
    .replace(/^(?:quero|preciso|vou)\s+(?:criar|adicionar|fazer|marcar)?\s*(?:o\s+)?(?:habito\s+)?(?:de\s+)?/i, "")
    .replace(/^(?:marcar|concluir|completar)\s+(?:o\s+)?(?:habito\s+)?(?:de\s+)?/i, "")
    .replace(/^(?:terminei|completei|conclui|fiz)\s+(?:de\s+)?/i, "")
    .trim();
}

function makeHabitInfinitive(text: string) {
  const replacements: Array<[RegExp, string]> = [
    [/^li\b/i, "ler"],
    [/^caminhei\b/i, "caminhar"],
    [/^corri\b/i, "correr"],
    [/^bebi\b/i, "beber"],
    [/^treinei\b/i, "treinar"],
    [/^estudei\b/i, "estudar"],
    [/^meditei\b/i, "meditar"],
    [/^alonguei\b/i, "alongar"],
    [/^acordei\b/i, "acordar"],
    [/^dormi\b/i, "dormir"],
    [/^vendi\b/i, "vender"],
  ];

  let result = stripHabitCommand(text);
  for (const [pattern, replacement] of replacements) {
    if (pattern.test(result)) {
      result = result.replace(pattern, replacement);
      break;
    }
  }
  return cleanupLabel(result, { keepNumbers: true }) || normalizeText(text);
}

function makeGoalTitle(text: string) {
  return cleanupLabel(makeHabitInfinitive(text), { keepNumbers: false }) || cleanupLabel(text);
}

function parseMessage(body: string): ParsedAction {
  const original = body.trim();
  const text = normalizeText(original);
  const money = extractMoney(text);
  const amount = money?.amount ?? 0;
  const date = parseDate(text);

  if (/\b(quanto|qual|quais|resumo|saldo|minhas|meu)\b/i.test(text)) {
    if (/\b(gastei|despesas?)\b/i.test(text) && /\bsemana\b/i.test(text)) return { type: "query", query: "expenses_week" };
    if (/\b(gastei|despesas?)\b/i.test(text)) return { type: "query", query: "expenses_today" };
    if (/\b(guardado|reserva|economia|poupado)\b/i.test(text)) return { type: "query", query: "savings" };
    if (/\b(dividas?|devo)\b/i.test(text)) return { type: "query", query: "debts" };
    if (/\b(a receber|receber|pendente)\b/i.test(text)) return { type: "query", query: "receivables" };
    if (/\b(resumo do mes|mes)\b/i.test(text)) return { type: "query", query: "month_summary" };
    if (/\bsaldo\b/i.test(text)) return { type: "query", query: "balance" };
  }

  if (isAmbiguousMoneyMessage(text)) {
    return { type: "ambiguous", question: `Voce quer registrar ${formatCurrency(amount)} como despesa no cartao ou como divida?` };
  }

  if (/\b(alterar|mudar|definir|setar|minha reserva agora|dinheiro guardado agora)\b/i.test(text) && /\b(reserva|guardado|economia|dinheiro guardado)\b/i.test(text)) {
    if (amount <= 0) return { type: "ambiguous", question: "Qual valor voce quer deixar como dinheiro guardado?" };
    return { type: "savings", mode: "set", amount, description: "Ajuste pelo WhatsApp" };
  }

  if (/\b(tirei|saquei|usei|retirei)\b/i.test(text) && /\b(reserva|guardado|economia)\b/i.test(text)) {
    if (amount <= 0) return { type: "ambiguous", question: "Quanto voce tirou da reserva?" };
    return { type: "savings", mode: "remove", amount, description: "Retirada pelo WhatsApp" };
  }

  if (/\b(guardei|poupei|economizei|reservei|adicione|adicionei|coloquei)\b/i.test(text) && /\b(reserva|guardado|economia|poupei|guardei|reservei)\b/i.test(text)) {
    if (amount <= 0) return { type: "ambiguous", question: "Quanto voce quer adicionar na reserva?" };
    return { type: "savings", mode: "add", amount, description: "Adicao pelo WhatsApp" };
  }

  if (/\b(quitei|quitei)\b/i.test(text) && /\b(divida|devo)\b/i.test(text)) {
    return { type: "debt_payment", name: parseDebtName(text), amount: null };
  }

  if (/\bpaguei\b/i.test(text) && /\b(divida|devo|cartao nubank|nubank)\b/i.test(text)) {
    if (amount <= 0) return { type: "ambiguous", question: "Quanto voce pagou dessa divida?" };
    return { type: "debt_payment", name: parseDebtName(text), amount };
  }

  if (/\b(devo|divida|adicione divida|adicionar divida)\b/i.test(text)) {
    if (amount <= 0) return { type: "ambiguous", question: "Qual o valor e o nome da divida?" };
    return { type: "debt_create", name: parseDebtName(text), amount, dueDate: /\b(venc|dia|amanha|semana que vem|mes que vem|\d{1,2}[\/-]\d{1,2})\b/i.test(text) ? date : null };
  }

  if (/\b(adicione|adicionei|coloquei|somei)\b/i.test(text) && /\bmeta\b/i.test(text)) {
    if (amount <= 0) return { type: "ambiguous", question: "Quanto voce quer adicionar nessa meta?" };
    const title = cleanupLabel(stripMoneyAndDate(text).replace(/\b(adicione|adicionei|coloquei|somei|na|no|meta)\b/gi, " ")) || "meta";
    return { type: "goal_progress", title, amount };
  }

  if (/\b(alterar|mudar|definir)\b/i.test(text) && /\bmeta\b/i.test(text)) {
    if (amount <= 0) return { type: "ambiguous", question: "Qual deve ser o novo valor alvo da meta?" };
    const title = cleanupLabel(stripMoneyAndDate(text).replace(/\b(alterar|mudar|definir|meta|para)\b/gi, " ")) || "meta";
    return { type: "goal_create", title, targetValue: amount, endDate: null, progressType: "monetary" };
  }

  const moneyGoalMatch = text.match(/^(?:criar\s+)?meta\s+(.+)$/i);
  if (moneyGoalMatch && amount > 0 && /\b(real|reais|r\$|reserva|viagem|notebook|comprar|guardar|juntar|economizar)\b/i.test(text)) {
    const title = cleanupLabel(stripMoneyAndDate(moneyGoalMatch[1]), { keepNumbers: false }) || "meta";
    return { type: "goal_create", title, targetValue: amount, endDate: /\b(ate|dia|\d{1,2}[\/-]\d{1,2}|dezembro|janeiro|fevereiro|marco|abril|maio|junho|julho|agosto|setembro|outubro|novembro)\b/i.test(text) ? date : null, progressType: "monetary" };
  }

  if (/\b(recebi|receita|ganhei|entrada|entrou|vou receber|para receber|a receber|tenho .* receber|cliente|salario)\b/i.test(text)) {
    if (amount <= 0) return { type: "ambiguous", question: "Qual valor voce recebeu ou vai receber?" };
    const received = /\b(recebi|recebido|caiu|entrou|ganhei)\b/i.test(text);
    return { type: "income", amount, source: parseIncomeSource(text), status: received ? "received" : "pending", date };
  }

  if (/\b(gastei|paguei|despesa|comprei|compra|debito|boleto|pix|cartao|vou pagar)\b/i.test(text) && amount > 0) {
    const pending = /\b(pendente|vou pagar|a pagar|para pagar)\b/i.test(text);
    const name = parseExpenseName(text);
    return { type: "expense", amount, name, category: inferCategory(text), paymentMethod: inferPaymentMethod(text), status: pending ? "pending" : "paid", date };
  }

  if (amount > 0 && cleanupLabel(stripMoneyAndDate(text))) {
    const name = parseExpenseName(text);
    return { type: "expense", amount, name, category: inferCategory(text), paymentMethod: inferPaymentMethod(text), status: "paid", date };
  }

  const goalMatch = text.match(/^(?:minha\s+)?(?:meta|objetivo)(?:\s+(?:de|para|pra)\s+hoje)?(?:\s+(?:e|eh))?\s+(.+)$/i);
  if (goalMatch) {
    const goalText = goalMatch[1];
    const title = makeGoalTitle(goalText);
    const moneyGoal = amount > 0 && /\b(real|reais|r\$|dinheiro|economizar|guardar|juntar)\b/i.test(text);
    const countGoal = extractCount(goalText) || 1;
    return {
      type: "goal",
      title,
      endDate: /\bhoje\b/i.test(text) ? today() : null,
      targetValue: moneyGoal ? amount : countGoal,
      progressType: moneyGoal ? "monetary" : "count",
    };
  }

  const habitCreate = text.match(/^(?:novo habito|nova rotina|criar habito|adicionar habito|adicionar novo habito|quero criar o habito de|quero criar habito de)\s+(.+)$/i);
  if (habitCreate) {
    return { type: "habit", name: makeHabitInfinitive(habitCreate[1]), complete: false };
  }

  const habitComplete = text.match(/^(?:completei|conclui|fiz|terminei|li|caminhei|corri|bebi|treinei|estudei|meditei|alonguei|acordei|dormi)\s+(.+)$/i);
  if (habitComplete) {
    return {
      type: "habit",
      name: makeHabitInfinitive(text),
      complete: true,
      amount: extractCount(text) || 1,
      goalTitle: makeGoalTitle(text),
    };
  }

  const directHabit = text.match(/^(?:beber|ler|caminhar|correr|treinar|estudar|meditar|alongar|dormir|acordar)\s+(.+)$/i);
  if (directHabit) {
    return {
      type: "habit",
      name: makeHabitInfinitive(text),
      complete: true,
      amount: extractCount(text) || 1,
      goalTitle: makeGoalTitle(text),
    };
  }

  const progressComplete = text.match(/^(?:vendi|vendeu|vendemos|bati|alcancei|terminei|completei|conclui)\s+(.+)$/i);
  if (progressComplete) {
    return { type: "progress", title: makeGoalTitle(text), amount: extractCount(text) || 1 };
  }

  return { type: "unknown", reason: "Formato nao reconhecido" };
}

async function reply(phoneNumberId: string, to: string, text: string) {
  if (!whatsappToken || !phoneNumberId) return;

  await fetch(`https://graph.facebook.com/${graphVersion}/${phoneNumberId}/messages`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${whatsappToken}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      messaging_product: "whatsapp",
      to,
      type: "text",
      text: { body: text },
    }),
  });
}

async function ensureHabit(userId: string, name: string) {
  const { data: habits, error: listError } = await supabase
    .from("habits")
    .select("id,name")
    .eq("user_id", userId);
  if (listError) throw listError;

  const wantedKey = normalizeKey(name);
  const existingHabit = (habits ?? []).find((habit) => {
    const habitKey = normalizeKey(habit.name);
    return habitKey === wantedKey || habitKey.includes(wantedKey) || wantedKey.includes(habitKey);
  });

  if (existingHabit?.id) return existingHabit;

  const { data: existingByName, error: findError } = await supabase
    .from("habits")
    .select("id,name")
    .eq("user_id", userId)
    .ilike("name", name)
    .maybeSingle();
  if (findError) throw findError;

  if (existingByName?.id) return existingByName;

  const { data: createdHabit, error: createError } = await supabase
    .from("habits")
    .insert({ user_id: userId, name })
    .select("id,name")
    .single();
  if (createError) throw createError;
  return createdHabit;
}

async function updateMatchingGoals(userId: string, title: string, amount: number) {
  const { data: goals, error: findError } = await supabase
    .from("goals")
    .select("id,title,current_value,target_value,status")
    .eq("user_id", userId)
    .eq("status", "in_progress");
  if (findError) throw findError;

  const wantedKey = normalizeKey(title);
  const goal = (goals ?? []).find((item) => {
    const goalKey = normalizeKey(item.title);
    return goalKey === wantedKey || goalKey.includes(wantedKey) || wantedKey.includes(goalKey);
  });

  if (!goal) return null;

  const current = Number(goal.current_value ?? 0);
  const target = Number(goal.target_value ?? 1);
  const next = Math.min(target, current + amount);
  const status = next >= target ? "completed" : "in_progress";

  const { error } = await supabase
    .from("goals")
    .update({ current_value: next, status })
    .eq("id", goal.id)
    .eq("user_id", userId);
  if (error) throw error;

  return { title: goal.title, current: next, target, completed: status === "completed" };
}

async function ensureExpenseCategory(userId: string, category: string) {
  if (!category || category === "Sem categoria") return null;

  const { data: existing, error: findError } = await supabase
    .from("categories")
    .select("id")
    .eq("user_id", userId)
    .eq("type", "expense")
    .ilike("name", category)
    .maybeSingle();
  if (findError) throw findError;
  if (existing?.id) return existing.id;

  const { data: created, error: createError } = await supabase
    .from("categories")
    .insert({ user_id: userId, name: category, type: "expense" })
    .select("id")
    .single();
  if (createError) throw createError;
  return created.id;
}

async function findDebt(userId: string, name: string) {
  const { data: debts, error } = await supabase
    .from("debts")
    .select("*")
    .eq("user_id", userId);
  if (error) throw error;

  const wantedKey = normalizeKey(name);
  return (debts ?? []).find((debt) => {
    const debtKey = normalizeKey(debt.name);
    return debtKey === wantedKey || debtKey.includes(wantedKey) || wantedKey.includes(debtKey);
  }) ?? null;
}

async function upsertGoal(userId: string, action: Extract<ParsedAction, { type: "goal_create" }>) {
  const { data: goals, error: findError } = await supabase
    .from("goals")
    .select("id,title")
    .eq("user_id", userId);
  if (findError) throw findError;

  const wantedKey = normalizeKey(action.title);
  const existing = (goals ?? []).find((goal) => {
    const goalKey = normalizeKey(goal.title);
    return goalKey === wantedKey || goalKey.includes(wantedKey) || wantedKey.includes(goalKey);
  });

  if (existing?.id) {
    const { error } = await supabase
      .from("goals")
      .update({
        target_value: action.targetValue,
        end_date: action.endDate,
        progress_type: action.progressType,
        status: "in_progress",
      })
      .eq("id", existing.id)
      .eq("user_id", userId);
    if (error) throw error;
    return { title: existing.title, updated: true };
  }

  const { error } = await supabase.from("goals").insert({
    user_id: userId,
    title: action.title,
    description: "Criada pelo WhatsApp",
    end_date: action.endDate,
    progress_type: action.progressType,
    current_value: 0,
    target_value: action.targetValue,
    status: "in_progress",
  });
  if (error) throw error;
  return { title: action.title, updated: false };
}

async function answerQuery(userId: string, query: Extract<ParsedAction, { type: "query" }>["query"]) {
  if (query === "savings") {
    const { data, error } = await supabase
      .from("savings")
      .select("total_saved,goal_amount")
      .eq("user_id", userId)
      .maybeSingle();
    if (error) throw error;
    return `Consulta:\nReserva atual: ${formatCurrency(Number(data?.total_saved ?? 0))}\nMeta da reserva: ${formatCurrency(Number(data?.goal_amount ?? 0))}`;
  }

  if (query === "debts") {
    const { data, error } = await supabase
      .from("debts")
      .select("name,total_amount,remaining_amount,due_date")
      .eq("user_id", userId)
      .gt("remaining_amount", 0)
      .order("created_at", { ascending: true });
    if (error) throw error;
    if (!data?.length) return "Consulta:\nVoce nao tem dividas ativas cadastradas.";
    const lines = data.map((debt) => `- ${debt.name}: falta ${formatCurrency(Number(debt.remaining_amount ?? 0))}`);
    return `Consulta:\nDividas ativas:\n${lines.join("\n")}`;
  }

  if (query === "receivables") {
    const { data, error } = await supabase
      .from("income")
      .select("amount,source,expected_date")
      .eq("user_id", userId)
      .eq("status", "pending")
      .order("expected_date", { ascending: true });
    if (error) throw error;
    const total = (data ?? []).reduce((sum, item) => sum + Number(item.amount ?? 0), 0);
    return `Consulta:\nA receber: ${formatCurrency(total)}\nRegistros pendentes: ${data?.length ?? 0}`;
  }

  const now = new Date();
  const monthStart = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-01`;
  const nextMonth = new Date(now.getFullYear(), now.getMonth() + 1, 1);
  const monthEnd = localDateString(nextMonth);

  if (query === "expenses_today" || query === "expenses_week") {
    const startDate = query === "expenses_week" ? addDays(-6) : today();
    const { data, error } = await supabase
      .from("expenses")
      .select("amount")
      .eq("user_id", userId)
      .gte("date", startDate)
      .lte("date", today());
    if (error) throw error;
    const total = (data ?? []).reduce((sum, item) => sum + Number(item.amount ?? 0), 0);
    return `Consulta:\n${query === "expenses_week" ? "Despesas da semana" : "Despesas de hoje"}: ${formatCurrency(total)}`;
  }

  const [{ data: expenses, error: expensesError }, { data: income, error: incomeError }, { data: savings, error: savingsError }] = await Promise.all([
    supabase.from("expenses").select("amount").eq("user_id", userId).gte("date", monthStart).lt("date", monthEnd),
    supabase.from("income").select("amount,status").eq("user_id", userId).gte("expected_date", monthStart).lt("expected_date", monthEnd),
    supabase.from("savings").select("total_saved").eq("user_id", userId).maybeSingle(),
  ]);
  if (expensesError) throw expensesError;
  if (incomeError) throw incomeError;
  if (savingsError) throw savingsError;

  const expenseTotal = (expenses ?? []).reduce((sum, item) => sum + Number(item.amount ?? 0), 0);
  const receivedTotal = (income ?? []).filter((item) => item.status === "received").reduce((sum, item) => sum + Number(item.amount ?? 0), 0);
  const pendingTotal = (income ?? []).filter((item) => item.status === "pending").reduce((sum, item) => sum + Number(item.amount ?? 0), 0);
  const balance = receivedTotal - expenseTotal;

  if (query === "balance") {
    return `Consulta:\nSaldo do mes: ${formatCurrency(balance)}\nRecebido: ${formatCurrency(receivedTotal)}\nGasto: ${formatCurrency(expenseTotal)}\nGuardado: ${formatCurrency(Number(savings?.total_saved ?? 0))}`;
  }

  return `Resumo do mes:\nRecebido: ${formatCurrency(receivedTotal)}\nA receber: ${formatCurrency(pendingTotal)}\nGasto: ${formatCurrency(expenseTotal)}\nSaldo: ${formatCurrency(balance)}\nGuardado: ${formatCurrency(Number(savings?.total_saved ?? 0))}`;
}

async function processWhatsAppMessage(message: string, userId: string) {
  const action = parseMessage(message);

  if (action.type === "ambiguous") {
    return { action, response: action.question };
  }

  if (action.type === "query") {
    return { action, response: await answerQuery(userId, action.query) };
  }

  if (action.type === "expense") {
    const categoryId = await ensureExpenseCategory(userId, action.category);
    const { error } = await supabase.from("expenses").insert({
      user_id: userId,
      name: action.name,
      amount: action.amount,
      status: action.status,
      date: action.date,
      category_id: categoryId,
      payment_method: action.paymentMethod,
      whatsapp_category: action.category,
    });
    if (error) throw error;

    return {
      action,
      response: `Registrado com sucesso:\nTipo: Despesa\nValor: ${formatCurrency(action.amount)}\nDescricao: ${titleCase(action.name)}\nCategoria: ${action.category}\nData: ${formatDisplayDate(action.date)}`,
    };
  }

  if (action.type === "income") {
    const { error } = await supabase.from("income").insert({
      user_id: userId,
      source: action.source,
      amount: action.amount,
      status: action.status,
      expected_date: action.date,
    });
    if (error) throw error;

    return {
      action,
      response: `Registrado com sucesso:\nTipo: ${action.status === "received" ? "Receita" : "A Receber"}\nValor: ${formatCurrency(action.amount)}\nDescricao: ${titleCase(action.source)}\nStatus: ${action.status === "received" ? "Recebido" : "Pendente"}\nData: ${formatDisplayDate(action.date)}`,
    };
  }

  if (action.type === "savings") {
    const { data: current, error: findError } = await supabase
      .from("savings")
      .select("total_saved,goal_amount,goal_date")
      .eq("user_id", userId)
      .maybeSingle();
    if (findError) throw findError;

    const previous = Number(current?.total_saved ?? 0);
    const delta = action.mode === "remove" ? -action.amount : action.amount;
    const nextTotal = action.mode === "set" ? action.amount : Math.max(0, previous + delta);
    const { error } = await supabase.from("savings").upsert({
      user_id: userId,
      total_saved: nextTotal,
      goal_amount: Number(current?.goal_amount ?? 0),
      goal_date: current?.goal_date ?? null,
    }, { onConflict: "user_id" });
    if (error) throw error;

    const now = new Date();
    await supabase.from("savings_history").insert({
      user_id: userId,
      amount: action.mode === "set" ? nextTotal - previous : delta,
      month: now.getMonth() + 1,
      year: now.getFullYear(),
    });

    await supabase.from("savings_movements").insert({
      user_id: userId,
      amount: action.amount,
      type: action.mode,
      previous_amount: previous,
      new_amount: nextTotal,
      description: action.description,
    });

    const signal = action.mode === "set" ? "" : `${delta >= 0 ? "+" : "-"}${formatCurrency(Math.abs(delta))}`;
    return {
      action,
      response: `Reserva atualizada:\nValor anterior: ${formatCurrency(previous)}\nAlteracao: ${action.mode === "set" ? "definida para " + formatCurrency(nextTotal) : signal}\nTotal atual: ${formatCurrency(nextTotal)}`,
    };
  }

  if (action.type === "debt_create") {
    const { error } = await supabase.from("debts").insert({
      user_id: userId,
      name: action.name,
      total_amount: action.amount,
      remaining_amount: action.amount,
      paid_amount: 0,
      status: "active",
      due_date: action.dueDate,
      interest_rate: 0,
      minimum_payment: 0,
    });
    if (error) throw error;

    return {
      action,
      response: `Registrado com sucesso:\nTipo: Divida\nValor: ${formatCurrency(action.amount)}\nDescricao: ${titleCase(action.name)}\nStatus: Ativa\nData: ${action.dueDate ? formatDisplayDate(action.dueDate) : "Sem vencimento"}`,
    };
  }

  if (action.type === "debt_payment") {
    const debt = await findDebt(userId, action.name);
    if (!debt) {
      return { action, response: `Nao achei uma divida parecida com "${action.name}". Tente: "devo 800 no Nubank".` };
    }

    const remaining = Number(debt.remaining_amount ?? 0);
    const alreadyPaid = Number(debt.paid_amount ?? Math.max(0, Number(debt.total_amount ?? 0) - remaining));
    const paid = action.amount ?? remaining;
    const nextRemaining = Math.max(0, remaining - paid);
    const nextPaid = alreadyPaid + Math.min(paid, remaining);
    const status = nextRemaining <= 0 ? "paid" : "partial";
    const { error } = await supabase
      .from("debts")
      .update({ remaining_amount: nextRemaining, paid_amount: nextPaid, status })
      .eq("id", debt.id)
      .eq("user_id", userId);
    if (error) throw error;

    return {
      action,
      response: `Registrado com sucesso:\nTipo: Pagamento de Divida\nValor: ${formatCurrency(paid)}\nDescricao: ${titleCase(debt.name)}\nSaldo restante: ${formatCurrency(nextRemaining)}\nStatus: ${nextRemaining <= 0 ? "Quitada" : "Parcial"}`,
    };
  }

  if (action.type === "goal_create") {
    const result = await upsertGoal(userId, action);
    return {
      action,
      response: `Registrado com sucesso:\nTipo: Meta\nDescricao: ${titleCase(result.title)}\nValor alvo: ${formatCurrency(action.targetValue)}\nData: ${action.endDate ? formatDisplayDate(action.endDate) : "Sem prazo"}`,
    };
  }

  if (action.type === "goal_progress") {
    const goalProgress = await updateMatchingGoals(userId, action.title, action.amount);
    if (!goalProgress) {
      return { action, response: `Nao achei uma meta parecida com "${action.title}". Crie antes assim: "criar meta ${action.title} 1000".` };
    }

    return {
      action,
      response: goalProgress.completed
        ? `Registrado com sucesso:\nTipo: Progresso de Meta\nDescricao: ${titleCase(goalProgress.title)}\nMeta finalizada.`
        : `Registrado com sucesso:\nTipo: Progresso de Meta\nDescricao: ${titleCase(goalProgress.title)}\nAtual: ${formatCurrency(goalProgress.current)} de ${formatCurrency(goalProgress.target)}`,
    };
  }

  if (action.type === "habit") {
    const habit = await ensureHabit(userId, action.name);

    if (!action.complete) {
      return { action, response: `Registrado com sucesso:\nTipo: Habito\nDescricao: ${titleCase(habit.name)}\nStatus: Criado` };
    }

    const { error } = await supabase
      .from("habit_completions")
      .upsert({
        user_id: userId,
        habit_id: habit.id,
        completed_date: today(),
      }, { onConflict: "habit_id,completed_date" });
    if (error) throw error;

    const goalProgress = await updateMatchingGoals(userId, action.goalTitle ?? action.name, action.amount ?? 1);
    if (goalProgress) {
      return {
        action,
        response: goalProgress.completed
          ? `Registrado com sucesso:\nTipo: Habito\nDescricao: ${titleCase(habit.name)}\nStatus: Concluido hoje\nMeta finalizada: ${titleCase(goalProgress.title)}`
          : `Registrado com sucesso:\nTipo: Habito\nDescricao: ${titleCase(habit.name)}\nStatus: Concluido hoje\nMeta atualizada: ${goalProgress.current}/${goalProgress.target}`,
      };
    }

    return { action, response: `Registrado com sucesso:\nTipo: Habito\nDescricao: ${titleCase(habit.name)}\nStatus: Concluido hoje` };
  }

  if (action.type === "goal") {
    const { error } = await supabase.from("goals").insert({
      user_id: userId,
      title: action.title,
      description: "Criada pelo WhatsApp",
      end_date: action.endDate,
      progress_type: action.progressType,
      current_value: 0,
      target_value: action.targetValue,
      status: "in_progress",
    });
    if (error) throw error;

    return {
      action,
      response: `Registrado com sucesso:\nTipo: Meta\nDescricao: ${titleCase(action.title)}\nValor alvo: ${action.targetValue}\nData: ${action.endDate ? formatDisplayDate(action.endDate) : "Sem prazo"}`,
    };
  }

  if (action.type === "progress") {
    const goalProgress = await updateMatchingGoals(userId, action.title, action.amount);
    if (!goalProgress) {
      return { action, response: `Nao achei uma meta parecida com "${action.title}". Crie antes assim: "meta de hoje ${action.title}".` };
    }

    return {
      action,
      response: goalProgress.completed
        ? `Registrado com sucesso:\nTipo: Progresso de Meta\nDescricao: ${titleCase(goalProgress.title)}\nMeta finalizada.`
        : `Registrado com sucesso:\nTipo: Progresso de Meta\nDescricao: ${titleCase(goalProgress.title)}\nAtual: ${goalProgress.current}/${goalProgress.target}`,
    };
  }

  return {
    action,
    response: "Nao entendi ainda. Tente assim: 'gastei 25 mercado', 'paguei 300 aluguel', 'vou receber 500 dia 20/07', 'guardei 100', 'devo 800 no Nubank', 'criar meta viagem 3000 ate dezembro' ou 'quanto tenho guardado?'.",
  };
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  const url = new URL(req.url);

  if (req.method === "GET") {
    const mode = url.searchParams.get("hub.mode");
    const token = url.searchParams.get("hub.verify_token");
    const challenge = url.searchParams.get("hub.challenge");

    if (mode === "subscribe" && token === verifyToken && challenge) {
      return new Response(challenge, { status: 200 });
    }

    return new Response("Invalid verification token", { status: 403 });
  }

  if (req.method !== "POST") {
    return new Response("Method not allowed", { status: 405, headers: corsHeaders });
  }

  const payload = await req.json();
  const entries = payload?.entry ?? [];

  for (const entry of entries) {
    for (const change of entry?.changes ?? []) {
      const value = change?.value;
      const phoneNumberId = value?.metadata?.phone_number_id;

      for (const message of value?.messages ?? []) {
        const fromRaw = message?.from;
        const fromPhone = normalizePhone(fromRaw);
        const body = message?.text?.body ?? "";
        const providerMessageId = message?.id;

        const { data: connection } = await supabase
          .from("whatsapp_connections")
          .select("id,user_id")
          .eq("phone_e164", fromPhone)
          .eq("is_active", true)
          .maybeSingle();

        if (!connection) {
          const action = parseMessage(body);
          await supabase.from("whatsapp_messages").insert({
            connection_id: null,
            user_id: null,
            provider_message_id: providerMessageId,
            direction: "inbound",
            body,
            parsed_action: action,
            raw_payload: message,
            status: "unlinked_phone",
          });

          await reply(
            phoneNumberId,
            fromRaw,
            "Esse numero ainda nao esta conectado ao BlacckCore. Cadastre seu WhatsApp nas configuracoes do app.",
          );
          continue;
        }

        try {
          const result = await processWhatsAppMessage(body, connection.user_id);
          await supabase.from("whatsapp_messages").insert({
            connection_id: connection.id,
            user_id: connection.user_id,
            provider_message_id: providerMessageId,
            direction: "inbound",
            body,
            parsed_action: result.action,
            raw_payload: message,
            status: "received",
          });
          await reply(phoneNumberId, fromRaw, result.response);
        } catch (error) {
          console.error(error);
          await supabase.from("whatsapp_messages").insert({
            connection_id: connection.id,
            user_id: connection.user_id,
            provider_message_id: providerMessageId,
            direction: "inbound",
            body,
            parsed_action: null,
            raw_payload: message,
            status: "error",
          });
          await reply(phoneNumberId, fromRaw, "Nao consegui salvar agora. Tente novamente em alguns minutos.");
        }
      }
    }
  }

  return new Response(JSON.stringify({ ok: true }), {
    status: 200,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
});
