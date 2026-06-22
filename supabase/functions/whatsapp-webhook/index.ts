import { createClient } from "https://esm.sh/@supabase/supabase-js@2.96.0";

type ParsedAction =
  | { type: "expense"; amount: number; name: string; status: "paid" | "pending"; date: string }
  | { type: "income"; amount: number; source: string; status: "received" | "pending"; date: string }
  | { type: "savings"; amount: number }
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
  const cleaned = value.replace(/\./g, "").replace(",", ".");
  const amount = Number(cleaned);
  return Number.isFinite(amount) ? amount : 0;
}

function today() {
  return new Date().toISOString().slice(0, 10);
}

function tomorrow() {
  const date = new Date();
  date.setDate(date.getDate() + 1);
  return date.toISOString().slice(0, 10);
}

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

  if (/\bamanha\b/i.test(text)) return tomorrow();
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
    .replace(/\b(?:hoje|amanha|dia|em|no|na|para|pra|com|de|do|da|dos|das|o|a|os|as|reais|real|r\$)\b/gi, " ")
    .replace(/\b\d{1,2}[\/-]\d{1,2}(?:[\/-]\d{2,4})?\b/g, " ")
    .replace(/\s+/g, " ");

  if (!options.keepNumbers) {
    result = result
      .replace(/\b\d+(?:[\.,]\d{1,2})?\b/g, " ")
      .replace(/\b(?:um|uma|dois|duas|tres|quatro|cinco|seis|sete|oito|nove|dez)\b/gi, " ");
  }

  return result.replace(/\s+/g, " ").trim();
}

function normalizeKey(value: string) {
  return normalizeText(value)
    .replace(/\b(?:um|uma|dois|duas|tres|quatro|cinco|seis|sete|oito|nove|dez|\d+)\b/g, " ")
    .split(" ")
    .map((part) => part.replace(/s$/i, ""))
    .filter(Boolean)
    .join(" ");
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

  let result = text.trim();
  result = result.replace(/^(terminei|completei|conclui)\s+(de\s+)?/i, "");
  for (const [pattern, replacement] of replacements) {
    if (pattern.test(result)) {
      result = result.replace(pattern, replacement);
      break;
    }
  }
  return cleanupLabel(result, { keepNumbers: true }) || text.trim();
}

function makeGoalTitle(text: string) {
  return cleanupLabel(makeHabitInfinitive(text), { keepNumbers: false }) || cleanupLabel(text);
}

function parseMessage(body: string): ParsedAction {
  const original = body.trim();
  const text = normalizeText(original);
  const amountMatch = text.match(/\b(\d+(?:[\.,]\d{1,2})?)\b/);
  const amount = amountMatch ? parseMoney(amountMatch[1]) : 0;
  const date = parseDate(text);

  if (/\b(guardei|poupei|economizei|reservei|guardar|guardar dinheiro|dinheiro guardado)\b/i.test(text) && amount > 0) {
    return { type: "savings", amount };
  }

  if (/\b(gastei|paguei|despesa|comprei|compra|debito|boleto|pix|cartao|pendente|devo|vou pagar)\b/i.test(text) && amount > 0) {
    const pending = /\b(pendente|devo|vou pagar|a pagar|para pagar)\b/i.test(text);
    const withoutAmount = text.replace(amountMatch?.[0] ?? "", "");
    const withoutCommand = withoutAmount.replace(/\b(gastei|paguei|despesa|comprei|compra|debito|boleto|pix|cartao|pendente|devo|vou pagar|pago|quitado|quitei)\b/gi, "");
    const name = cleanupLabel(withoutCommand) || "Despesa via WhatsApp";

    return { type: "expense", amount, name, status: pending ? "pending" : "paid", date };
  }

  if (/\b(recebi|receita|ganhei|entrada|vou receber|para receber|a receber|tenho .* receber|cliente|salario)\b/i.test(text) && amount > 0) {
    const received = /\b(recebi|recebido|caiu|entrou|ganhei)\b/i.test(text);
    const withoutAmount = text.replace(amountMatch?.[0] ?? "", "");
    const withoutCommand = withoutAmount.replace(/\b(recebi|receita|ganhei|entrada|vou receber|para receber|a receber|tenho|reais|recebido|caiu|entrou)\b/gi, "");
    const source = cleanupLabel(withoutCommand) || "Receita via WhatsApp";

    return { type: "income", amount, source, status: received ? "received" : "pending", date };
  }

  const goalMatch = text.match(/^(?:meta|objetivo)(?:\s+de\s+hoje|\s+para\s+hoje)?\s+(.+)$/i);
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
      name: makeHabitInfinitive(original),
      complete: true,
      amount: extractCount(text) || 1,
      goalTitle: makeGoalTitle(original),
    };
  }

  const progressComplete = text.match(/^(?:vendi|vendeu|vendemos|bati|alcancei|terminei|completei|conclui)\s+(.+)$/i);
  if (progressComplete) {
    return { type: "progress", title: makeGoalTitle(original), amount: extractCount(text) || 1 };
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

async function applyAction(userId: string, action: ParsedAction) {
  if (action.type === "expense") {
    const { error } = await supabase.from("expenses").insert({
      user_id: userId,
      name: action.name,
      amount: action.amount,
      status: action.status,
      date: action.date,
    });
    if (error) throw error;

    return `Despesa salva como ${action.status === "paid" ? "paga" : "pendente"}: R$ ${action.amount.toFixed(2)} - ${action.name}`;
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

    return `Receita salva como ${action.status === "received" ? "recebida" : "pendente"}: R$ ${action.amount.toFixed(2)} - ${action.source}`;
  }

  if (action.type === "savings") {
    const { data: current, error: findError } = await supabase
      .from("savings")
      .select("total_saved,goal_amount,goal_date")
      .eq("user_id", userId)
      .maybeSingle();
    if (findError) throw findError;

    const nextTotal = Number(current?.total_saved ?? 0) + action.amount;
    const { error } = await supabase.from("savings").upsert({
      user_id: userId,
      total_saved: nextTotal,
      goal_amount: Number(current?.goal_amount ?? 0),
      goal_date: current?.goal_date ?? null,
    });
    if (error) throw error;

    const now = new Date();
    await supabase.from("savings_history").insert({
      user_id: userId,
      amount: action.amount,
      month: now.getMonth() + 1,
      year: now.getFullYear(),
    });

    return `Economia salva: R$ ${action.amount.toFixed(2)}. Total guardado: R$ ${nextTotal.toFixed(2)}`;
  }

  if (action.type === "habit") {
    const habit = await ensureHabit(userId, action.name);

    if (!action.complete) {
      return `Habito criado: ${habit.name}. Quando terminar, mande: "fiz ${habit.name}".`;
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
      return goalProgress.completed
        ? `Habito concluido e meta finalizada: ${goalProgress.title}`
        : `Habito concluido: ${habit.name}. Meta atualizada: ${goalProgress.current}/${goalProgress.target}`;
    }

    return `Habito concluido hoje: ${habit.name}`;
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

    return action.endDate === today()
      ? `Meta de hoje criada: ${action.title}`
      : `Meta criada: ${action.title}`;
  }

  if (action.type === "progress") {
    const goalProgress = await updateMatchingGoals(userId, action.title, action.amount);
    if (!goalProgress) {
      return `Nao achei uma meta parecida com "${action.title}". Crie antes assim: "meta de hoje ${action.title}".`;
    }

    return goalProgress.completed
      ? `Meta finalizada: ${goalProgress.title}`
      : `Meta atualizada: ${goalProgress.title} (${goalProgress.current}/${goalProgress.target})`;
  }

  return "Nao entendi ainda. Tente assim: 'gastei 25 mercado', 'paguei 300 aluguel', 'vou receber 500 dia 20/07', 'guardei 100', 'novo habito caminhar 500 metros', 'li uma pagina do livro hoje' ou 'meta de hoje ler uma pagina'.";
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

        const action = parseMessage(body);

        await supabase.from("whatsapp_messages").insert({
          connection_id: connection?.id ?? null,
          user_id: connection?.user_id ?? null,
          provider_message_id: providerMessageId,
          direction: "inbound",
          body,
          parsed_action: action,
          raw_payload: message,
          status: connection ? "received" : "unlinked_phone",
        });

        if (!connection) {
          await reply(
            phoneNumberId,
            fromRaw,
            "Esse numero ainda nao esta conectado ao BlacckCore. Cadastre seu WhatsApp nas configuracoes do app.",
          );
          continue;
        }

        try {
          const result = await applyAction(connection.user_id, action);
          await reply(phoneNumberId, fromRaw, result);
        } catch (error) {
          console.error(error);
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
