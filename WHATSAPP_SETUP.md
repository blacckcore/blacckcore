# WhatsApp no BlacckCore

Este MVP recebe mensagens do WhatsApp, interpreta comandos simples e salva no Supabase.

## O que o usuario pode mandar

```text
gastei 25 mercado
paguei 42,90 uber
recebi 500 cliente
completei treino
```

## Secrets no Supabase

Configure estes secrets na Edge Function:

```text
WHATSAPP_VERIFY_TOKEN=um_token_qualquer_criado_por_voce
WHATSAPP_ACCESS_TOKEN=token_da_meta_whatsapp_cloud_api
WHATSAPP_GRAPH_VERSION=v23.0
```

O Supabase ja fornece:

```text
SUPABASE_URL
SUPABASE_SERVICE_ROLE_KEY
```

## Webhook

Depois do deploy, use esta URL no painel da Meta:

```text
https://SEU_PROJECT_REF.supabase.co/functions/v1/whatsapp-webhook
```

Eventos para assinar:

```text
messages
```

## Vincular numero ao usuario

Insira uma linha em `whatsapp_connections`:

```sql
insert into public.whatsapp_connections (user_id, phone_e164, display_name)
values ('USER_ID_DO_SUPABASE_AUTH', '+5511999999999', 'Lucas');
```

O telefone precisa estar em formato E.164, com `+55` no Brasil.

## Proximo passo

Criar uma tela em Configuracoes para o usuario cadastrar o WhatsApp sem precisar mexer no banco.
