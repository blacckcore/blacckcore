param(
  [string]$ProjectRef = "vpaewrtqszfcycnniggv"
)

$ErrorActionPreference = "Stop"

Write-Host "BlacckCore WhatsApp deploy" -ForegroundColor Green
Write-Host "Project ref: $ProjectRef"
Write-Host ""

if (-not $env:SUPABASE_ACCESS_TOKEN) {
  $env:SUPABASE_ACCESS_TOKEN = Read-Host "Cole o SUPABASE_ACCESS_TOKEN"
}

$dbPassword = Read-Host "Cole a senha do banco Supabase"
$verifyToken = Read-Host "Crie um WHATSAPP_VERIFY_TOKEN qualquer"
$whatsappAccessToken = Read-Host "Cole o WHATSAPP_ACCESS_TOKEN da Meta"
$graphVersion = Read-Host "Graph version (Enter para v23.0)"

if ([string]::IsNullOrWhiteSpace($graphVersion)) {
  $graphVersion = "v23.0"
}

Write-Host ""
Write-Host "1/4 Linkando projeto Supabase..." -ForegroundColor Cyan
npx supabase link --project-ref $ProjectRef --password $dbPassword

Write-Host ""
Write-Host "2/4 Aplicando migrations no banco..." -ForegroundColor Cyan
npx supabase db push --linked --password $dbPassword --yes

Write-Host ""
Write-Host "3/4 Configurando secrets da Edge Function..." -ForegroundColor Cyan
npx supabase secrets set `
  --project-ref $ProjectRef `
  WHATSAPP_VERIFY_TOKEN="$verifyToken" `
  WHATSAPP_ACCESS_TOKEN="$whatsappAccessToken" `
  WHATSAPP_GRAPH_VERSION="$graphVersion"

Write-Host ""
Write-Host "4/4 Publicando webhook do WhatsApp..." -ForegroundColor Cyan
npx supabase functions deploy whatsapp-webhook --project-ref $ProjectRef --no-verify-jwt --use-api

Write-Host ""
Write-Host "Deploy concluido." -ForegroundColor Green
Write-Host "Webhook URL:"
Write-Host "https://$ProjectRef.supabase.co/functions/v1/whatsapp-webhook" -ForegroundColor Yellow
Write-Host ""
Write-Host "Use o mesmo WHATSAPP_VERIFY_TOKEN no painel da Meta."
