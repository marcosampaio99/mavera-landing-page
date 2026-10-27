import React from 'react';
import { createMaveraClient } from '@marcosampaio99/mavera-client';
import { MaveraProvider } from '@marcosampaio99/mavera-client/react';
import { Placeholder } from './pages/Placeholder';
import { tenant } from './tenant';

let client;
export function AuthProvider({ children }) {
  const tenantId = import.meta.env.VITE_LEANDROFARIA_TENANT_ID ?? tenant.id;
  if (!tenantId) {
    return <Placeholder eyebrow="Área de cliente" title="Acesso indisponível" text="O acesso está a ser configurado. Contacta o Leandro para obter ajuda." />;
  }
  try {
    if (!client) client = createMaveraClient({
      tenantId,
      tenantSlug: tenant.slug,
      apiBaseUrl: import.meta.env.VITE_MAVERA_API_URL || 'https://mavera-api-production.up.railway.app/api/v1',
      supabaseUrl: import.meta.env.VITE_SUPABASE_URL || 'https://uyuydeqkqywdqfnkcmgb.supabase.co',
      supabasePublishableKey: import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY || 'sb_publishable_EEGVAOaXszR6IzL6lfUvZA_-Lh76Jc6',
    });
  } catch {
    return <Placeholder eyebrow="Área de cliente" title="Acesso indisponível" text="O acesso está a ser configurado. Contacta o Leandro para obter ajuda." />;
  }
  return <MaveraProvider client={client}>{children}</MaveraProvider>;
}

export function authError(error) {
  const messages = {
    PHONE_CLAIM_NOT_CONFIRMED: 'Não foi possível confirmar a associação. Verifica o código ou contacta o Leandro.',
    PHONE_CLAIM_RATE_LIMITED: 'Demasiadas tentativas. Aguarda antes de tentar novamente.',
    PHONE_CLAIM_DISABLED: 'A associação por SMS está indisponível. Contacta o Leandro.',
    PHONE_CLAIM_UNAVAILABLE: 'A associação por SMS está indisponível. Tenta mais tarde.',
    invalid_credentials: 'O email ou a palavra-passe estão incorretos.',
    email_not_confirmed: 'Confirma o teu email antes de entrar.',
    weak_password: 'Escolhe uma palavra-passe mais forte.',
    same_password: 'Escolhe uma palavra-passe diferente da atual.',
    over_email_send_rate_limit: 'Aguarda alguns minutos antes de pedir outro email.',
    over_request_rate_limit: 'Demasiadas tentativas. Tenta novamente dentro de alguns minutos.',
    CUSTOMER_CLAIM_REQUIRES_VERIFIED_EMAIL: 'Confirma o teu email antes de associar o perfil.',
    CUSTOMER_PROFILE_AMBIGUOUS: 'Contacta o Leandro para confirmar o teu perfil de cliente.',
    CUSTOMER_PROFILE_ALREADY_CLAIMED: 'Este perfil já está associado. Contacta o Leandro.',
    CUSTOMER_PHONE_ALREADY_EXISTS: 'Este telefone já está associado a outro perfil. Contacta o Leandro.',
  };
  if (error?.kind === 'network') return 'Não foi possível ligar ao serviço. Verifica a ligação e tenta novamente.';
  return messages[error?.code] || 'Não foi possível concluir o pedido. Tenta novamente.';
}
