-- Colar no Supabase > SQL Editor > Run
create table if not exists public.encomendas (
  id uuid primary key default gen_random_uuid(),
  stripe_session_id text unique not null,
  criado_em timestamptz not null default now(),
  estado_pagamento text,
  valor_total integer,          -- em cêntimos (1990 = 19,90 €)
  moeda text,
  nome text,
  email text,
  telefone text,
  nif text,
  fatura_linha1 text,
  fatura_linha2 text,
  fatura_cidade text,
  fatura_codigo_postal text,
  fatura_regiao text,
  fatura_pais text,
  envio_nome text,
  envio_linha1 text,
  envio_linha2 text,
  envio_cidade text,
  envio_codigo_postal text,
  envio_regiao text,
  envio_pais text,
  enviado boolean not null default false,
  codigo_rastreio text,
  notas text
);

-- Segurança: ninguém lê nem escreve a partir do browser.
-- Só a função da Vercel (chave service_role) consegue gravar.
alter table public.encomendas enable row level security;
