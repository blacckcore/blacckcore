// Maps unknown/backend errors to safe, user-facing messages.
// Avoids leaking schema details from PostgREST/Supabase errors to users.

export function getFriendlyErrorMessage(err: unknown, fallback = 'Algo deu errado. Tente novamente.'): string {
  const msg = (err as { message?: string } | null | undefined)?.message?.toLowerCase() ?? '';

  // Common Supabase Auth errors -> localized strings
  if (msg.includes('invalid login credentials')) return 'Email ou senha inválidos.';
  if (msg.includes('email not confirmed')) return 'Confirme seu email antes de entrar.';
  if (msg.includes('user already registered') || msg.includes('already registered')) {
    return 'Este email já está cadastrado.';
  }
  if (msg.includes('password should be') || msg.includes('weak') || msg.includes('pwned')) {
    return 'Senha muito fraca. Use ao menos 8 caracteres com letras e números.';
  }

  if (msg.includes('rate limit') || msg.includes('too many')) {
    return 'Muitas tentativas. Aguarde um momento e tente novamente.';
  }
  if (msg.includes('network') || msg.includes('failed to fetch')) {
    return 'Falha de conexão. Verifique sua internet.';
  }

  return fallback;
}
