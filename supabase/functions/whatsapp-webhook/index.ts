import { createClient } from "https://esm.sh/@supabase/supabase-js@2.96.0";

type ParsedAction =
  | { type: "expense"; amount: number; name: string }
  | { type: "income"; amount: number; source: string }
  | { type: "habit"; name: string }
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

function parseMoney(value: string) {
  const cleaned = value.replace(/\./g, "").replace(",", ".");
  const amount = Number(cleaned);
  return Number.isFinite(amount) ? amount : 0;
}

function parseMessage(body: string): ParsedAction {
  const text = body.trim().toLowerCase();
  const amountPattern = "(\\d+(?:[\\.,]\\d{1,2})?)";

  const expense = text.match(new RegExp(`^(?:gastei|paguei|despesa|comprei)\\s+${amountPattern}\\s*(?:em|no|na|com)?\\s*(.+)?$`, "i"));
  if (expense) {
    return {
      type: "expense",
      amount: parseMoney(expense[1]),
      name: expense[2]?.trim() || "Despesa via WhatsApp",
    };
  }

  const income = text.match(new RegExp(`^(?:recebi|receita|ganhei|entrada)\\s+${amountPattern}\\s*(?:de|do|da|com)?\\s*(.+)?$`, "i"));
  if (income) {
    return {
      type: "income",
      amount: parseMoney(income[1]),
      source: income[2]?.trim() || "Receita via WhatsApp",
    };
  }

  const habit = text.match(/^(?:completei|fiz|habito|hábito)\s+(.+)$/i);
  if (habit) {
    return {
      type: "habit",
      name: habit[1].trim(),
    };
  }

  return {
    type: "unknown",
    reason: "Formato não reconhecido",
  };
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

async function applyAction(userId: string, action: ParsedAction) {
  if (action.type === "expense") {
    const { error } = await supabase.from("expenses").insert({
      user_id: userId,
      name: action.name,
      amount: action.amount,
      status: "paid",
      date: new Date().toISOString().slice(0, 10),
    });
    if (error) throw error;
    return `Despesa salva: R$ ${action.amount.toFixed(2)} - ${action.name}`;
  }

  if (action.type === "income") {
    const { error } = await supabase.from("income").insert({
      user_id: userId,
      source: action.source,
      amount: action.amount,
      status: "received",
      expected_date: new Date().toISOString().slice(0, 10),
    });
    if (error) throw error;
    return `Receita salva: R$ ${action.amount.toFixed(2)} - ${action.source}`;
  }

  if (action.type === "habit") {
    const { data: existingHabit, error: findError } = await supabase
      .from("habits")
      .select("id,name")
      .eq("user_id", userId)
      .ilike("name", action.name)
      .maybeSingle();
    if (findError) throw findError;

    let habitId = existingHabit?.id;
    if (!habitId) {
      const { data: createdHabit, error: createError } = await supabase
        .from("habits")
        .insert({ user_id: userId, name: action.name })
        .select("id")
        .single();
      if (createError) throw createError;
      habitId = createdHabit.id;
    }

    const { error } = await supabase
      .from("habit_completions")
      .upsert({
        user_id: userId,
        habit_id: habitId,
        completed_date: new Date().toISOString().slice(0, 10),
      }, { onConflict: "habit_id,completed_date" });
    if (error) throw error;
    return `Hábito marcado como concluído: ${action.name}`;
  }

  return "Não entendi ainda. Tente: 'gastei 25 mercado', 'recebi 500 cliente' ou 'completei treino'.";
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
            "Esse número ainda não está conectado ao BlacckCore. Cadastre seu WhatsApp nas configurações do app.",
          );
          continue;
        }

        try {
          const result = await applyAction(connection.user_id, action);
          await reply(phoneNumberId, fromRaw, result);
        } catch (error) {
          console.error(error);
          await reply(phoneNumberId, fromRaw, "Não consegui salvar agora. Tente novamente em alguns minutos.");
        }
      }
    }
  }

  return new Response(JSON.stringify({ ok: true }), {
    status: 200,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
});
