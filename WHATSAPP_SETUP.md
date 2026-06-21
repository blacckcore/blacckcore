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

## Deploy automatico

No PowerShell, dentro da pasta do projeto, rode:

```powershell
.\scripts\deploy-whatsapp.ps1
```

O script vai pedir:

```text
SUPABASE_ACCESS_TOKEN
senha do banco Supabase
WHATSAPP_VERIFY_TOKEN
WHATSAPP_ACCESS_TOKEN
```

Ele faz sozinho:

```text
link do projeto Supabase
migrations do banco
secrets da funcao
deploy do whatsapp-webhook publico
```

## Webhook

Depois do deploy, use esta URL no painel da Meta:

```text
https://vpaewrtqszfcycnniggv.supabase.co/functions/v1/whatsapp-webhook
```

Eventos para assinar:

```text
messages
```

## Vincular numero ao usuario pelo app

Entre no BlacckCore e va em:

```text
Configuracoes > WhatsApp inteligente
```

Digite o telefone com DDD.

## Vincular numero manualmente

Insira uma linha em `whatsapp_connections`:

```sql
insert into public.whatsapp_connections (user_id, phone_e164, display_name)
values ('USER_ID_DO_SUPABASE_AUTH', '+5511999999999', 'Lucas');
```

O telefone precisa estar em formato E.164, com `+55` no Brasil.

## Proximo passo

Conectar a Meta WhatsApp Cloud API e assinar o evento `messages`.
