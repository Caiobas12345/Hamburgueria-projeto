-- =====================================================================
-- PÃO NA CHAPA · Migração 001 — Perfis, gerenciamento de usuários e auditoria
--
-- Rode este arquivo UMA vez no SQL Editor do MESMO projeto Supabase do site
-- (depois do schema.sql, que já foi rodado). Pode rodar de novo sem estragar nada.
--
-- O que faz (só ADICIONA; não apaga contas, pedidos, endereços nem produtos):
--   1. Perfis: cliente, entregador, cozinha e admin.
--   2. Conta ativa/suspensa (conta suspensa não consegue fazer pedidos).
--   3. Histórico de auditoria de todas as alterações de perfil e suspensões.
--   4. Funções que SÓ administradores podem usar para listar usuários,
--      alterar perfil e suspender/reativar contas (tudo verificado no banco).
--   5. Proteção extra: preço promocional precisa ser menor que o preço normal.
--
-- Administrador continua sendo concedido SÓ pela tabela admins_autorizados
-- (nunca pela tela do painel).
-- =====================================================================

-- ---------------------------------------------------------------------
-- 1. PERFIS
-- ---------------------------------------------------------------------
alter table public.perfis drop constraint if exists perfis_papel_check;
alter table public.perfis
  add constraint perfis_papel_check check (papel in ('cliente', 'entregador', 'cozinha', 'admin'));

alter table public.perfis add column if not exists ativo boolean not null default true;
alter table public.perfis add column if not exists suspenso_motivo text not null default '';
alter table public.perfis add column if not exists papel_atualizado_em timestamptz;

create index if not exists perfis_papel_idx on public.perfis (papel);

-- administrador só conta se a conta estiver ativa
create or replace function public.eh_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.perfis
    where id = auth.uid() and papel = 'admin' and ativo
  );
$$;

-- perfil de quem está logado (null = sem conta ou conta suspensa)
create or replace function public.meu_papel()
returns text
language sql
stable
security definer
set search_path = public
as $$
  select papel from public.perfis where id = auth.uid() and ativo;
$$;

revoke all on function public.meu_papel() from public, anon;
grant execute on function public.meu_papel() to authenticated;

-- ---------------------------------------------------------------------
-- 2. HISTÓRICO DE AUDITORIA
-- ---------------------------------------------------------------------
create table if not exists public.perfil_auditoria (
  id bigint generated always as identity primary key,
  usuario_id uuid not null references auth.users (id) on delete cascade,
  alterado_por uuid references auth.users (id) on delete set null,
  acao text not null check (acao in ('papel', 'suspensao', 'reativacao')),
  valor_anterior text not null default '',
  valor_novo text not null default '',
  motivo text not null default '',
  criado_em timestamptz not null default now()
);

create index if not exists perfil_auditoria_usuario_idx on public.perfil_auditoria (usuario_id, criado_em desc);
create index if not exists perfil_auditoria_data_idx on public.perfil_auditoria (criado_em desc);

alter table public.perfil_auditoria enable row level security;

drop policy if exists "auditoria: admin vê" on public.perfil_auditoria;
create policy "auditoria: admin vê" on public.perfil_auditoria
  for select to authenticated using (public.eh_admin());

-- ninguém grava direto: só as funções abaixo
revoke insert, update, delete on public.perfil_auditoria from authenticated, anon;

-- ---------------------------------------------------------------------
-- 3. ENTREGA ATIVA (usada para não tirar o perfil de um entregador no meio de uma entrega)
-- Por enquanto não existem entregas atribuídas; a etapa do painel do entregador
-- substitui esta função pela verificação real.
-- ---------------------------------------------------------------------
create or replace function public.entregador_tem_entrega_ativa(p_usuario uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select false;
$$;

revoke all on function public.entregador_tem_entrega_ativa(uuid) from public, anon, authenticated;

-- ---------------------------------------------------------------------
-- 4. FUNÇÕES DO ADMINISTRADOR
-- ---------------------------------------------------------------------

-- lista de usuários com busca e filtros
create or replace function public.admin_listar_usuarios(
  p_busca text default '',
  p_papel text default '',
  p_situacao text default '',
  p_limite int default 300
)
returns table (
  id uuid,
  nome text,
  email text,
  telefone text,
  papel text,
  ativo boolean,
  suspenso_motivo text,
  criado_em timestamptz,
  pedidos bigint,
  ultimo_pedido timestamptz
)
language plpgsql
stable
security definer
set search_path = public
as $$
declare
  v_busca text := lower(trim(coalesce(p_busca, '')));
begin
  if not public.eh_admin() then
    raise exception 'Acesso restrito a administradores.';
  end if;

  return query
  select p.id, p.nome, p.email, p.telefone, p.papel, p.ativo, p.suspenso_motivo, p.criado_em,
         coalesce(ped.qtd, 0), ped.ultimo
  from public.perfis p
  left join lateral (
    select count(*) as qtd, max(x.criado_em) as ultimo
    from public.pedidos x where x.usuario_id = p.id
  ) ped on true
  where (v_busca = '' or position(v_busca in lower(p.nome)) > 0 or position(v_busca in lower(coalesce(p.email, ''))) > 0)
    and (coalesce(p_papel, '') = '' or p.papel = p_papel)
    and (coalesce(p_situacao, '') = ''
         or (p_situacao = 'ativas' and p.ativo)
         or (p_situacao = 'suspensas' and not p.ativo))
  order by p.criado_em desc
  limit least(greatest(coalesce(p_limite, 300), 1), 1000);
end;
$$;

-- alterar perfil: cliente <-> entregador <-> cozinha (nunca admin)
create or replace function public.admin_alterar_papel(
  p_usuario uuid,
  p_papel text,
  p_motivo text default ''
)
returns json
language plpgsql
security definer
set search_path = public
as $$
declare
  v_alvo public.perfis;
begin
  if not public.eh_admin() then
    raise exception 'Somente administradores podem alterar perfis.';
  end if;

  if p_papel is null or p_papel not in ('cliente', 'entregador', 'cozinha') then
    raise exception 'Perfil inválido. O perfil de administrador não pode ser concedido pelo painel.';
  end if;

  if p_usuario = auth.uid() then
    raise exception 'Você não pode alterar o seu próprio perfil.';
  end if;

  select * into v_alvo from public.perfis where id = p_usuario for update;
  if not found then
    raise exception 'Usuário não encontrado.';
  end if;

  if v_alvo.papel = 'admin' then
    raise exception 'Este usuário é administrador. Administradores só podem ser alterados diretamente no banco de dados.';
  end if;

  if v_alvo.papel = p_papel then
    raise exception 'O usuário já tem este perfil.';
  end if;

  if v_alvo.papel = 'entregador' and public.entregador_tem_entrega_ativa(p_usuario) then
    raise exception 'Este entregador tem uma entrega em andamento. Conclua ou reatribua a entrega antes de mudar o perfil.';
  end if;

  update public.perfis
     set papel = p_papel, papel_atualizado_em = now()
   where id = p_usuario;

  insert into public.perfil_auditoria (usuario_id, alterado_por, acao, valor_anterior, valor_novo, motivo)
  values (p_usuario, auth.uid(), 'papel', v_alvo.papel, p_papel, left(trim(coalesce(p_motivo, '')), 300));

  return json_build_object('id', p_usuario, 'papel_anterior', v_alvo.papel, 'papel', p_papel);
end;
$$;

-- suspender ou reativar uma conta (os dados e o histórico continuam guardados)
create or replace function public.admin_suspender_usuario(
  p_usuario uuid,
  p_suspender boolean,
  p_motivo text default ''
)
returns json
language plpgsql
security definer
set search_path = public
as $$
declare
  v_alvo public.perfis;
  v_motivo text := left(trim(coalesce(p_motivo, '')), 300);
begin
  if not public.eh_admin() then
    raise exception 'Somente administradores podem suspender ou reativar contas.';
  end if;

  if p_usuario = auth.uid() then
    raise exception 'Você não pode suspender a sua própria conta.';
  end if;

  select * into v_alvo from public.perfis where id = p_usuario for update;
  if not found then
    raise exception 'Usuário não encontrado.';
  end if;

  if v_alvo.papel = 'admin' then
    raise exception 'Contas de administrador não podem ser suspensas pelo painel.';
  end if;

  if p_suspender then
    if not v_alvo.ativo then
      raise exception 'Esta conta já está suspensa.';
    end if;
    if length(v_motivo) < 3 then
      raise exception 'Informe o motivo da suspensão.';
    end if;
    if v_alvo.papel = 'entregador' and public.entregador_tem_entrega_ativa(p_usuario) then
      raise exception 'Este entregador tem uma entrega em andamento. Conclua ou reatribua a entrega antes de suspender.';
    end if;
    update public.perfis set ativo = false, suspenso_motivo = v_motivo where id = p_usuario;
    insert into public.perfil_auditoria (usuario_id, alterado_por, acao, valor_anterior, valor_novo, motivo)
    values (p_usuario, auth.uid(), 'suspensao', 'ativa', 'suspensa', v_motivo);
  else
    if v_alvo.ativo then
      raise exception 'Esta conta já está ativa.';
    end if;
    update public.perfis set ativo = true, suspenso_motivo = '' where id = p_usuario;
    insert into public.perfil_auditoria (usuario_id, alterado_por, acao, valor_anterior, valor_novo, motivo)
    values (p_usuario, auth.uid(), 'reativacao', 'suspensa', 'ativa', v_motivo);
  end if;

  return json_build_object('id', p_usuario, 'ativo', not p_suspender);
end;
$$;

-- histórico de alterações (de um usuário ou de todos)
create or replace function public.admin_historico_perfis(
  p_usuario uuid default null,
  p_limite int default 100
)
returns table (
  id bigint,
  usuario_id uuid,
  usuario_nome text,
  usuario_email text,
  alterado_por_nome text,
  acao text,
  valor_anterior text,
  valor_novo text,
  motivo text,
  criado_em timestamptz
)
language plpgsql
stable
security definer
set search_path = public
as $$
begin
  if not public.eh_admin() then
    raise exception 'Acesso restrito a administradores.';
  end if;

  return query
  select a.id, a.usuario_id, u.nome, u.email, coalesce(nullif(r.nome, ''), r.email, 'Sistema'),
         a.acao, a.valor_anterior, a.valor_novo, a.motivo, a.criado_em
  from public.perfil_auditoria a
  left join public.perfis u on u.id = a.usuario_id
  left join public.perfis r on r.id = a.alterado_por
  where p_usuario is null or a.usuario_id = p_usuario
  order by a.criado_em desc
  limit least(greatest(coalesce(p_limite, 100), 1), 500);
end;
$$;

revoke all on function public.admin_listar_usuarios(text, text, text, int) from public, anon;
revoke all on function public.admin_alterar_papel(uuid, text, text) from public, anon;
revoke all on function public.admin_suspender_usuario(uuid, boolean, text) from public, anon;
revoke all on function public.admin_historico_perfis(uuid, int) from public, anon;
grant execute on function public.admin_listar_usuarios(text, text, text, int) to authenticated;
grant execute on function public.admin_alterar_papel(uuid, text, text) to authenticated;
grant execute on function public.admin_suspender_usuario(uuid, boolean, text) to authenticated;
grant execute on function public.admin_historico_perfis(uuid, int) to authenticated;

-- ---------------------------------------------------------------------
-- 5. CONTA SUSPENSA NÃO FAZ PEDIDOS (vale para qualquer caminho, inclusive criar_pedido)
-- ---------------------------------------------------------------------
create or replace function public.bloqueia_pedido_suspenso()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if exists (select 1 from public.perfis where id = new.usuario_id and not ativo) then
    raise exception 'Sua conta está suspensa e não pode fazer pedidos. Fale com a hamburgueria.';
  end if;
  return new;
end;
$$;

drop trigger if exists antes_de_criar_pedido on public.pedidos;
create trigger antes_de_criar_pedido
before insert on public.pedidos
for each row execute function public.bloqueia_pedido_suspenso();

-- ---------------------------------------------------------------------
-- 6. PROMOÇÃO SEMPRE MENOR QUE O PREÇO NORMAL
-- (vale para produtos novos e editados; produtos antigos não são bloqueados)
-- ---------------------------------------------------------------------
alter table public.produtos drop constraint if exists produtos_promo_menor;
alter table public.produtos
  add constraint produtos_promo_menor
  check (preco_promocional is null or preco_promocional < preco) not valid;
