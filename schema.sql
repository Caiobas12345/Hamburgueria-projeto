-- =====================================================================
-- PÃO NA CHAPA · Banco de dados (Supabase / PostgreSQL)
-- Rode este arquivo inteiro UMA vez no SQL Editor do projeto Supabase do Pão na Chapa.
-- (Projeto próprio: não use o banco da Brands.)
--
-- O que ele cria:
--   perfis (clientes e administradores), categorias, produtos, adicionais, campanhas (Explorar),
--   bairros (taxas de entrega), configurações da loja, endereços, favoritos, pedidos, itens e histórico.
--   Segurança (RLS) em todas as tabelas, função criar_pedido que recalcula os preços no servidor,
--   bucket "midia" para fotos e vídeos e as 6 categorias do cardápio (sem produtos inventados).
--
-- Administrador: e-mails da tabela admins_autorizados viram administradores
-- assim que o e-mail estiver CONFIRMADO (cadastro confirmado ou login com Google).
-- =====================================================================

create extension if not exists pgcrypto;

-- ---------------------------------------------------------------------
-- 1. PERFIS E ADMINISTRADORES
-- ---------------------------------------------------------------------
create table if not exists public.admins_autorizados (
  email text primary key check (email = lower(email))
);

insert into public.admins_autorizados (email)
values ('rafatomasi214@gmail.com')
on conflict do nothing;

create table if not exists public.perfis (
  id uuid primary key references auth.users (id) on delete cascade,
  nome text not null default '',
  telefone text not null default '',
  email text,
  papel text not null default 'cliente' check (papel in ('cliente', 'admin')),
  criado_em timestamptz not null default now()
);

-- quem está logado é administrador?
create or replace function public.eh_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.perfis
    where id = auth.uid() and papel = 'admin'
  );
$$;

-- cria o perfil quando alguém se cadastra (e-mail/senha ou Google)
-- e promove a administrador só quando o e-mail estiver confirmado
create or replace function public.sincroniza_perfil()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_admin boolean;
begin
  v_admin := new.email_confirmed_at is not null
    and exists (select 1 from public.admins_autorizados a where a.email = lower(new.email));

  insert into public.perfis (id, nome, telefone, email, papel)
  values (
    new.id,
    left(coalesce(new.raw_user_meta_data ->> 'nome',
                  new.raw_user_meta_data ->> 'full_name',
                  new.raw_user_meta_data ->> 'name', ''), 120),
    left(coalesce(new.raw_user_meta_data ->> 'telefone', ''), 30),
    lower(new.email),
    case when v_admin then 'admin' else 'cliente' end
  )
  on conflict (id) do update
    set email = excluded.email,
        papel = case when v_admin then 'admin' else public.perfis.papel end;

  return new;
end;
$$;

drop trigger if exists ao_salvar_usuario on auth.users;
create trigger ao_salvar_usuario
after insert or update of email, email_confirmed_at on auth.users
for each row execute function public.sincroniza_perfil();

-- ---------------------------------------------------------------------
-- 2. CARDÁPIO
-- ---------------------------------------------------------------------
create table if not exists public.categorias (
  id bigint generated always as identity primary key,
  slug text not null unique check (slug ~ '^[a-z0-9-]+$'),
  nome text not null,
  descricao text not null default '',
  capa_url text,
  video_url text,
  video_mobile_url text,
  foco text not null default '50% 50%',
  fotos text[] not null default '{}',
  ordem int not null default 0,
  ativo boolean not null default true
);

create table if not exists public.produtos (
  id bigint generated always as identity primary key,
  categoria_id bigint references public.categorias (id) on delete set null,
  nome text not null,
  descricao text not null default '',
  ingredientes text[] not null default '{}',
  removiveis text[] not null default '{}',   -- ingredientes que o cliente pode retirar
  inclui text[] not null default '{}',       -- para combos: o que vem no combo
  preco numeric(10, 2) not null check (preco >= 0),
  preco_promocional numeric(10, 2) check (preco_promocional is null or preco_promocional >= 0),
  promo_ate timestamptz,
  tamanhos jsonb not null default '[]',      -- [{"nome":"Médio","preco":32.9}] (preço final do tamanho)
  fotos text[] not null default '{}',
  destaque boolean not null default false,
  novidade boolean not null default false,
  disponivel boolean not null default true,  -- esgotado hoje = false
  ativo boolean not null default true,       -- some do site = false
  ordem int not null default 0,
  criado_em timestamptz not null default now()
);

create index if not exists produtos_categoria_idx on public.produtos (categoria_id);

create table if not exists public.adicionais (
  id bigint generated always as identity primary key,
  nome text not null,
  preco numeric(10, 2) not null default 0 check (preco >= 0),
  disponivel boolean not null default true,
  ordem int not null default 0
);

create table if not exists public.produto_adicionais (
  produto_id bigint not null references public.produtos (id) on delete cascade,
  adicional_id bigint not null references public.adicionais (id) on delete cascade,
  primary key (produto_id, adicional_id)
);

create index if not exists produto_adicionais_adicional_idx on public.produto_adicionais (adicional_id);

-- Explorar: campanhas e destaques especiais
create table if not exists public.campanhas (
  id bigint generated always as identity primary key,
  slug text not null unique check (slug ~ '^[a-z0-9-]+$'),
  titulo text not null,
  chamada text not null default '',
  descricao text not null default '',
  capa_url text,
  video_url text,
  video_mobile_url text,
  foco text not null default '50% 50%',
  fotos text[] not null default '{}',
  produtos bigint[] not null default '{}',
  ordem int not null default 0,
  ativo boolean not null default true
);

-- ---------------------------------------------------------------------
-- 3. LOJA: CONFIGURAÇÕES E ENTREGA (tudo editável no painel)
-- ---------------------------------------------------------------------
create table if not exists public.configuracoes (
  id int primary key default 1 check (id = 1),
  nome_loja text not null default 'Pão na Chapa',
  whatsapp text not null default '',          -- só números com DDI, ex.: 5547999999999
  aviso text not null default '',             -- texto da faixa do topo
  endereco text not null default '',
  sobre text not null default '',
  instagram text not null default '',
  horarios jsonb not null default '[]',       -- [{"dia":1,"abre":"18:00","fecha":"23:30"}] (0 = domingo)
  aceitando_pedidos boolean not null default true,
  entrega_ativa boolean not null default true,
  retirada_ativa boolean not null default true,
  taxa_padrao numeric(10, 2) check (taxa_padrao is null or taxa_padrao >= 0),
  pedido_minimo numeric(10, 2) not null default 0 check (pedido_minimo >= 0),
  tempo_entrega text not null default '',
  tempo_retirada text not null default '',
  pagamentos jsonb not null default '{"pix": true, "dinheiro": true, "cartao": true}',
  chave_pix text not null default '',
  banner_video_url text default 'assets/video/banner.mp4',
  banner_video_mobile_url text,
  banner_poster_url text default 'assets/img/banner.jpg',
  banner_titulo text not null default '',
  banner_texto text not null default '',
  banner_foco text not null default '50% 50%'
);

insert into public.configuracoes (id) values (1) on conflict do nothing;

create table if not exists public.bairros (
  id bigint generated always as identity primary key,
  nome text not null unique,
  taxa numeric(10, 2) not null check (taxa >= 0),
  ativo boolean not null default true
);

-- ---------------------------------------------------------------------
-- 4. CLIENTE: ENDEREÇOS E FAVORITOS
-- ---------------------------------------------------------------------
create table if not exists public.enderecos (
  id bigint generated always as identity primary key,
  usuario_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  apelido text not null default 'Casa',
  rua text not null,
  numero text not null,
  complemento text not null default '',
  bairro text not null,
  cidade text not null default '',
  referencia text not null default '',
  criado_em timestamptz not null default now()
);

create index if not exists enderecos_usuario_idx on public.enderecos (usuario_id);

create table if not exists public.favoritos (
  usuario_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  produto_id bigint not null references public.produtos (id) on delete cascade,
  criado_em timestamptz not null default now(),
  primary key (usuario_id, produto_id)
);

-- ---------------------------------------------------------------------
-- 5. PEDIDOS
-- ---------------------------------------------------------------------
create table if not exists public.pedidos (
  id bigint generated always as identity primary key,
  codigo text not null unique default upper(substr(md5(gen_random_uuid()::text), 1, 6)),
  usuario_id uuid not null references auth.users (id) on delete restrict,
  cliente_nome text not null,
  cliente_telefone text not null,
  cliente_email text,
  tipo text not null check (tipo in ('entrega', 'retirada')),
  endereco jsonb,                              -- cópia do endereço no momento do pedido
  pagamento text not null check (pagamento in ('pix', 'dinheiro', 'cartao')),
  troco_para numeric(10, 2),
  observacoes text not null default '',
  subtotal numeric(10, 2) not null check (subtotal >= 0),
  taxa_entrega numeric(10, 2) not null default 0 check (taxa_entrega >= 0),
  total numeric(10, 2) not null check (total >= 0),
  status text not null default 'recebido'
    check (status in ('recebido', 'em_preparo', 'saiu_entrega', 'pronto_retirada', 'concluido', 'cancelado')),
  mensagem_cliente text not null default '',  -- recado da loja que o cliente vê no pedido
  criado_em timestamptz not null default now(),
  atualizado_em timestamptz not null default now()
);

create index if not exists pedidos_usuario_idx on public.pedidos (usuario_id, criado_em desc);
create index if not exists pedidos_status_idx on public.pedidos (status, criado_em desc);

create table if not exists public.pedido_itens (
  id bigint generated always as identity primary key,
  pedido_id bigint not null references public.pedidos (id) on delete cascade,
  produto_id bigint references public.produtos (id) on delete set null,
  nome text not null,
  tamanho text,
  quantidade int not null check (quantidade between 1 and 50),
  preco_unitario numeric(10, 2) not null,     -- produto + adicionais, por unidade
  adicionais jsonb not null default '[]',     -- [{"nome":"Bacon","preco":4}]
  removidos text[] not null default '{}',
  observacao text not null default '',
  total numeric(10, 2) not null
);

create index if not exists pedido_itens_pedido_idx on public.pedido_itens (pedido_id);
create index if not exists pedido_itens_produto_idx on public.pedido_itens (produto_id);

-- histórico que o cliente vê (cada mudança de status ou recado)
create table if not exists public.pedido_eventos (
  id bigint generated always as identity primary key,
  pedido_id bigint not null references public.pedidos (id) on delete cascade,
  status text not null,
  mensagem text not null default '',
  criado_em timestamptz not null default now()
);

create index if not exists pedido_eventos_pedido_idx on public.pedido_eventos (pedido_id, criado_em);

-- registra no histórico quando o administrador muda status ou recado
create or replace function public.registra_evento_pedido()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if new.status is distinct from old.status or new.mensagem_cliente is distinct from old.mensagem_cliente then
    new.atualizado_em := now();
    insert into public.pedido_eventos (pedido_id, status, mensagem)
    values (new.id, new.status,
            case when new.mensagem_cliente is distinct from old.mensagem_cliente then new.mensagem_cliente else '' end);
  end if;
  return new;
end;
$$;

drop trigger if exists ao_atualizar_pedido on public.pedidos;
create trigger ao_atualizar_pedido
before update on public.pedidos
for each row execute function public.registra_evento_pedido();

-- ---------------------------------------------------------------------
-- 6. CRIAR PEDIDO (o preço é SEMPRE recalculado aqui, nunca vem do navegador)
-- p_itens: [{"produto_id":1,"quantidade":2,"tamanho":"Duplo","adicionais":[3,4],"removidos":["Cebola"],"observacao":"..."}]
-- p_endereco (entrega): {"rua":"...","numero":"...","complemento":"","bairro":"...","cidade":"","referencia":""}
-- ---------------------------------------------------------------------
create or replace function public.criar_pedido(
  p_itens jsonb,
  p_tipo text,
  p_endereco jsonb,
  p_pagamento text,
  p_troco_para numeric,
  p_observacoes text,
  p_nome text,
  p_telefone text
)
returns json
language plpgsql
security definer
set search_path = public
as $$
declare
  v_uid uuid := auth.uid();
  v_cfg public.configuracoes;
  v_item jsonb;
  v_prod public.produtos;
  v_qtd int;
  v_base numeric(10, 2);
  v_tam text;
  v_tam_preco numeric(10, 2);
  v_add_ids bigint[];
  v_adds jsonb;
  v_add_total numeric(10, 2);
  v_removidos text[];
  v_unit numeric(10, 2);
  v_subtotal numeric(10, 2) := 0;
  v_taxa numeric(10, 2) := 0;
  v_total numeric(10, 2);
  v_bairro text;
  v_tem_bairros boolean;
  v_endereco jsonb;
  v_pedido public.pedidos;
  v_linhas jsonb := '[]';
  v_agora timestamp := (now() at time zone 'America/Sao_Paulo');
  v_aberto boolean;
  v_email text;
begin
  if v_uid is null then
    raise exception 'Entre na sua conta para finalizar o pedido.';
  end if;

  select * into v_cfg from public.configuracoes where id = 1;

  if not v_cfg.aceitando_pedidos then
    raise exception 'A loja não está recebendo pedidos agora.';
  end if;

  -- horários: se configurados, o pedido precisa estar dentro de algum horário do dia
  if jsonb_array_length(v_cfg.horarios) > 0 then
    select exists (
      select 1 from jsonb_array_elements(v_cfg.horarios) h
      where (
        -- turno no mesmo dia
        (h ->> 'abre')::time <= (h ->> 'fecha')::time
        and (h ->> 'dia')::int = extract(dow from v_agora)::int
        and v_agora::time between (h ->> 'abre')::time and (h ->> 'fecha')::time
      ) or (
        -- turno que passa da meia-noite (ex.: 18:00 às 02:00)
        (h ->> 'abre')::time > (h ->> 'fecha')::time
        and (
          ((h ->> 'dia')::int = extract(dow from v_agora)::int and v_agora::time >= (h ->> 'abre')::time)
          or ((h ->> 'dia')::int = (extract(dow from v_agora)::int + 6) % 7 and v_agora::time <= (h ->> 'fecha')::time)
        )
      )
    ) into v_aberto;

    if not v_aberto then
      raise exception 'Estamos fechados agora. Confira nossos horários.';
    end if;
  end if;

  if p_tipo = 'entrega' and not v_cfg.entrega_ativa then
    raise exception 'Entrega indisponível no momento.';
  elsif p_tipo = 'retirada' and not v_cfg.retirada_ativa then
    raise exception 'Retirada indisponível no momento.';
  elsif p_tipo not in ('entrega', 'retirada') then
    raise exception 'Escolha entrega ou retirada.';
  end if;

  if p_pagamento not in ('pix', 'dinheiro', 'cartao')
     or coalesce((v_cfg.pagamentos ->> p_pagamento)::boolean, false) = false then
    raise exception 'Forma de pagamento indisponível.';
  end if;

  if length(trim(coalesce(p_nome, ''))) < 2 then
    raise exception 'Informe seu nome.';
  end if;

  if length(regexp_replace(coalesce(p_telefone, ''), '\D', '', 'g')) < 10 then
    raise exception 'Informe um telefone com DDD.';
  end if;

  if p_itens is null or jsonb_typeof(p_itens) <> 'array'
     or jsonb_array_length(p_itens) = 0 or jsonb_array_length(p_itens) > 40 then
    raise exception 'Seu carrinho está vazio.';
  end if;

  for v_item in select * from jsonb_array_elements(p_itens) loop
    select * into v_prod
    from public.produtos
    where id = (v_item ->> 'produto_id')::bigint and ativo and disponivel;

    if not found then
      raise exception 'Um item do carrinho não está mais disponível. Revise seu pedido.';
    end if;

    v_qtd := coalesce((v_item ->> 'quantidade')::int, 0);
    if v_qtd < 1 or v_qtd > 50 then
      raise exception 'Quantidade inválida para %.', v_prod.nome;
    end if;

    -- preço base: promoção válida ou preço normal
    v_base := case
      when v_prod.preco_promocional is not null and (v_prod.promo_ate is null or v_prod.promo_ate > now())
        then v_prod.preco_promocional
      else v_prod.preco
    end;

    -- tamanho (preço próprio do tamanho)
    v_tam := nullif(trim(coalesce(v_item ->> 'tamanho', '')), '');
    if jsonb_array_length(v_prod.tamanhos) > 0 then
      select (t ->> 'preco')::numeric into v_tam_preco
      from jsonb_array_elements(v_prod.tamanhos) t
      where t ->> 'nome' = v_tam;

      if v_tam_preco is null then
        raise exception 'Escolha o tamanho de %.', v_prod.nome;
      end if;
      v_base := v_tam_preco;
    else
      v_tam := null;
    end if;

    -- adicionais: só os ligados ao produto e disponíveis
    select coalesce(array_agg(distinct x::bigint), '{}') into v_add_ids
    from jsonb_array_elements_text(case when jsonb_typeof(v_item -> 'adicionais') = 'array' then v_item -> 'adicionais' else '[]' end) x;

    select coalesce(jsonb_agg(jsonb_build_object('nome', a.nome, 'preco', a.preco) order by a.ordem, a.nome), '[]'),
           coalesce(sum(a.preco), 0)
      into v_adds, v_add_total
    from public.adicionais a
    join public.produto_adicionais pa on pa.adicional_id = a.id and pa.produto_id = v_prod.id
    where a.id = any (v_add_ids) and a.disponivel;

    if jsonb_array_length(v_adds) <> coalesce(array_length(v_add_ids, 1), 0) then
      raise exception 'Um adicional de % não está disponível. Revise seu pedido.', v_prod.nome;
    end if;

    -- ingredientes retirados: só os permitidos
    select coalesce(array_agg(distinct x), '{}') into v_removidos
    from jsonb_array_elements_text(case when jsonb_typeof(v_item -> 'removidos') = 'array' then v_item -> 'removidos' else '[]' end) x
    where x = any (v_prod.removiveis);

    v_unit := v_base + v_add_total;
    v_subtotal := v_subtotal + v_unit * v_qtd;

    v_linhas := v_linhas || jsonb_build_object(
      'produto_id', v_prod.id,
      'nome', v_prod.nome,
      'tamanho', v_tam,
      'quantidade', v_qtd,
      'preco_unitario', v_unit,
      'adicionais', v_adds,
      'removidos', to_jsonb(v_removidos),
      'observacao', left(coalesce(v_item ->> 'observacao', ''), 200),
      'total', v_unit * v_qtd
    );
  end loop;

  if v_subtotal < v_cfg.pedido_minimo then
    raise exception 'O pedido mínimo é de R$ %.', to_char(v_cfg.pedido_minimo, 'FM999G990D00');
  end if;

  -- entrega: endereço completo e taxa pelo bairro
  if p_tipo = 'entrega' then
    if p_endereco is null
       or length(trim(coalesce(p_endereco ->> 'rua', ''))) < 2
       or length(trim(coalesce(p_endereco ->> 'numero', ''))) < 1
       or length(trim(coalesce(p_endereco ->> 'bairro', ''))) < 2 then
      raise exception 'Informe rua, número e bairro para a entrega.';
    end if;

    v_bairro := trim(p_endereco ->> 'bairro');
    select exists (select 1 from public.bairros where ativo) into v_tem_bairros;

    if v_tem_bairros then
      select taxa into v_taxa from public.bairros
      where ativo and lower(nome) = lower(v_bairro);

      if v_taxa is null then
        if v_cfg.taxa_padrao is null then
          raise exception 'Ainda não entregamos no bairro %.', v_bairro;
        end if;
        v_taxa := v_cfg.taxa_padrao;
      end if;
    else
      v_taxa := coalesce(v_cfg.taxa_padrao, 0);
    end if;

    v_endereco := jsonb_build_object(
      'rua', left(trim(p_endereco ->> 'rua'), 120),
      'numero', left(trim(p_endereco ->> 'numero'), 20),
      'complemento', left(trim(coalesce(p_endereco ->> 'complemento', '')), 80),
      'bairro', left(v_bairro, 80),
      'cidade', left(trim(coalesce(p_endereco ->> 'cidade', '')), 80),
      'referencia', left(trim(coalesce(p_endereco ->> 'referencia', '')), 120)
    );
  end if;

  v_total := v_subtotal + v_taxa;

  if p_pagamento = 'dinheiro' and p_troco_para is not null and p_troco_para < v_total then
    raise exception 'O valor para troco precisa ser maior que o total do pedido.';
  end if;

  select email into v_email from auth.users where id = v_uid;

  insert into public.pedidos (
    usuario_id, cliente_nome, cliente_telefone, cliente_email, tipo, endereco,
    pagamento, troco_para, observacoes, subtotal, taxa_entrega, total
  ) values (
    v_uid, left(trim(p_nome), 120), left(trim(p_telefone), 30), v_email, p_tipo, v_endereco,
    p_pagamento, case when p_pagamento = 'dinheiro' then p_troco_para end,
    left(coalesce(p_observacoes, ''), 500), v_subtotal, v_taxa, v_total
  ) returning * into v_pedido;

  insert into public.pedido_itens (
    pedido_id, produto_id, nome, tamanho, quantidade, preco_unitario, adicionais, removidos, observacao, total
  )
  select v_pedido.id,
         (l ->> 'produto_id')::bigint,
         l ->> 'nome',
         l ->> 'tamanho',
         (l ->> 'quantidade')::int,
         (l ->> 'preco_unitario')::numeric,
         l -> 'adicionais',
         array(select jsonb_array_elements_text(l -> 'removidos')),
         l ->> 'observacao',
         (l ->> 'total')::numeric
  from jsonb_array_elements(v_linhas) l;

  insert into public.pedido_eventos (pedido_id, status) values (v_pedido.id, 'recebido');

  -- guarda nome/telefone no perfil se ainda estiverem vazios
  update public.perfis
     set nome = case when nome = '' then left(trim(p_nome), 120) else nome end,
         telefone = case when telefone = '' then left(trim(p_telefone), 30) else telefone end
   where id = v_uid;

  return json_build_object('id', v_pedido.id, 'codigo', v_pedido.codigo, 'total', v_pedido.total);
end;
$$;

revoke all on function public.criar_pedido(jsonb, text, jsonb, text, numeric, text, text, text) from public, anon;
grant execute on function public.criar_pedido(jsonb, text, jsonb, text, numeric, text, text, text) to authenticated;

-- "Mais pedidos" da home (só ids e quantidades, sem dados de clientes)
create or replace function public.mais_pedidos(p_limite int default 8)
returns table (produto_id bigint, vendidos bigint)
language sql
stable
security definer
set search_path = public
as $$
  select i.produto_id, sum(i.quantidade)::bigint as vendidos
  from public.pedido_itens i
  join public.pedidos p on p.id = i.pedido_id
  join public.produtos pr on pr.id = i.produto_id and pr.ativo
  where p.status <> 'cancelado' and p.criado_em > now() - interval '60 days'
  group by i.produto_id
  order by vendidos desc
  limit least(greatest(p_limite, 1), 24);
$$;

grant execute on function public.mais_pedidos(int) to anon, authenticated;

-- ---------------------------------------------------------------------
-- 7. SEGURANÇA (RLS)
-- ---------------------------------------------------------------------
alter table public.admins_autorizados enable row level security;
alter table public.perfis enable row level security;
alter table public.categorias enable row level security;
alter table public.produtos enable row level security;
alter table public.adicionais enable row level security;
alter table public.produto_adicionais enable row level security;
alter table public.campanhas enable row level security;
alter table public.configuracoes enable row level security;
alter table public.bairros enable row level security;
alter table public.enderecos enable row level security;
alter table public.favoritos enable row level security;
alter table public.pedidos enable row level security;
alter table public.pedido_itens enable row level security;
alter table public.pedido_eventos enable row level security;

-- administradores autorizados: só admin vê/edita
drop policy if exists "admins: admin" on public.admins_autorizados;
create policy "admins: admin" on public.admins_autorizados
  for all to authenticated using (public.eh_admin()) with check (public.eh_admin());

-- perfis: cada um vê o seu; admin vê todos
drop policy if exists "perfis: ver" on public.perfis;
create policy "perfis: ver" on public.perfis
  for select to authenticated using (id = auth.uid() or public.eh_admin());

drop policy if exists "perfis: editar o seu" on public.perfis;
create policy "perfis: editar o seu" on public.perfis
  for update to authenticated using (id = auth.uid()) with check (id = auth.uid());

-- o cliente só pode mudar nome e telefone (nunca o papel)
revoke update on public.perfis from authenticated, anon;
grant update (nome, telefone) on public.perfis to authenticated;

-- cardápio, campanhas e bairros: todos veem o que está ativo; admin vê e edita tudo
drop policy if exists "categorias: ver" on public.categorias;
create policy "categorias: ver" on public.categorias for select using (ativo or public.eh_admin());
drop policy if exists "categorias: admin" on public.categorias;
create policy "categorias: admin" on public.categorias for all to authenticated
  using (public.eh_admin()) with check (public.eh_admin());

drop policy if exists "produtos: ver" on public.produtos;
create policy "produtos: ver" on public.produtos for select using (ativo or public.eh_admin());
drop policy if exists "produtos: admin" on public.produtos;
create policy "produtos: admin" on public.produtos for all to authenticated
  using (public.eh_admin()) with check (public.eh_admin());

drop policy if exists "adicionais: ver" on public.adicionais;
create policy "adicionais: ver" on public.adicionais for select using (true);
drop policy if exists "adicionais: admin" on public.adicionais;
create policy "adicionais: admin" on public.adicionais for all to authenticated
  using (public.eh_admin()) with check (public.eh_admin());

drop policy if exists "produto_adicionais: ver" on public.produto_adicionais;
create policy "produto_adicionais: ver" on public.produto_adicionais for select using (true);
drop policy if exists "produto_adicionais: admin" on public.produto_adicionais;
create policy "produto_adicionais: admin" on public.produto_adicionais for all to authenticated
  using (public.eh_admin()) with check (public.eh_admin());

drop policy if exists "campanhas: ver" on public.campanhas;
create policy "campanhas: ver" on public.campanhas for select using (ativo or public.eh_admin());
drop policy if exists "campanhas: admin" on public.campanhas;
create policy "campanhas: admin" on public.campanhas for all to authenticated
  using (public.eh_admin()) with check (public.eh_admin());

drop policy if exists "bairros: ver" on public.bairros;
create policy "bairros: ver" on public.bairros for select using (ativo or public.eh_admin());
drop policy if exists "bairros: admin" on public.bairros;
create policy "bairros: admin" on public.bairros for all to authenticated
  using (public.eh_admin()) with check (public.eh_admin());

drop policy if exists "configuracoes: ver" on public.configuracoes;
create policy "configuracoes: ver" on public.configuracoes for select using (true);
drop policy if exists "configuracoes: admin" on public.configuracoes;
create policy "configuracoes: admin" on public.configuracoes for update to authenticated
  using (public.eh_admin()) with check (public.eh_admin());

-- endereços e favoritos: só do próprio cliente
drop policy if exists "enderecos: dono" on public.enderecos;
create policy "enderecos: dono" on public.enderecos for all to authenticated
  using (usuario_id = auth.uid()) with check (usuario_id = auth.uid());

drop policy if exists "favoritos: dono" on public.favoritos;
create policy "favoritos: dono" on public.favoritos for all to authenticated
  using (usuario_id = auth.uid()) with check (usuario_id = auth.uid());

-- pedidos: cliente vê os seus; admin vê todos e muda status/recado.
-- Ninguém insere direto: só pela função criar_pedido.
drop policy if exists "pedidos: ver" on public.pedidos;
create policy "pedidos: ver" on public.pedidos for select to authenticated
  using (usuario_id = auth.uid() or public.eh_admin());

drop policy if exists "pedidos: admin atualiza" on public.pedidos;
create policy "pedidos: admin atualiza" on public.pedidos for update to authenticated
  using (public.eh_admin()) with check (public.eh_admin());

revoke insert, update, delete on public.pedidos from authenticated, anon;
grant update (status, mensagem_cliente) on public.pedidos to authenticated;

drop policy if exists "itens: ver" on public.pedido_itens;
create policy "itens: ver" on public.pedido_itens for select to authenticated
  using (exists (select 1 from public.pedidos p where p.id = pedido_id
                 and (p.usuario_id = auth.uid() or public.eh_admin())));
revoke insert, update, delete on public.pedido_itens from authenticated, anon;

drop policy if exists "eventos: ver" on public.pedido_eventos;
create policy "eventos: ver" on public.pedido_eventos for select to authenticated
  using (exists (select 1 from public.pedidos p where p.id = pedido_id
                 and (p.usuario_id = auth.uid() or public.eh_admin())));
revoke insert, update, delete on public.pedido_eventos from authenticated, anon;

-- ---------------------------------------------------------------------
-- 8. ATUALIZAÇÃO EM TEMPO REAL (status para o cliente, pedidos novos para o painel)
-- ---------------------------------------------------------------------
do $$
begin
  if exists (select 1 from pg_publication where pubname = 'supabase_realtime')
     and not exists (select 1 from pg_publication_tables
                     where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = 'pedidos') then
    alter publication supabase_realtime add table public.pedidos;
  end if;
end $$;

-- ---------------------------------------------------------------------
-- 9. FOTOS E VÍDEOS (Storage: bucket "midia", todos veem, só admin envia)
-- ---------------------------------------------------------------------
do $$
begin
  if exists (select 1 from pg_namespace where nspname = 'storage') then
    insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
    values ('midia', 'midia', true, 52428800,
            array['image/jpeg', 'image/png', 'image/webp', 'image/avif', 'video/mp4', 'video/webm'])
    on conflict (id) do update set public = true,
      file_size_limit = excluded.file_size_limit,
      allowed_mime_types = excluded.allowed_mime_types;

    drop policy if exists "midia: ver" on storage.objects;
    create policy "midia: ver" on storage.objects for select using (bucket_id = 'midia');

    drop policy if exists "midia: admin envia" on storage.objects;
    create policy "midia: admin envia" on storage.objects for insert to authenticated
      with check (bucket_id = 'midia' and public.eh_admin());

    drop policy if exists "midia: admin altera" on storage.objects;
    create policy "midia: admin altera" on storage.objects for update to authenticated
      using (bucket_id = 'midia' and public.eh_admin());

    drop policy if exists "midia: admin apaga" on storage.objects;
    create policy "midia: admin apaga" on storage.objects for delete to authenticated
      using (bucket_id = 'midia' and public.eh_admin());
  end if;
end $$;

-- ---------------------------------------------------------------------
-- 10. AS 6 CATEGORIAS DO CARDÁPIO (fotos, vídeos e textos entram pelo painel)
-- ---------------------------------------------------------------------
insert into public.categorias (slug, nome, ordem) values
  ('hamburgueres', 'Hambúrgueres', 1),
  ('porcoes', 'Porções', 2),
  ('bebidas', 'Bebidas', 3),
  ('sobremesas', 'Sobremesas', 4),
  ('combos', 'Combos', 5),
  ('promocoes', 'Promoções', 6)
on conflict (slug) do nothing;

-- Se você já tinha criado sua conta antes de rodar este arquivo, isto cria o perfil
-- e libera o administrador (precisa do e-mail confirmado).
insert into public.perfis (id, email, nome)
select u.id, lower(u.email), coalesce(u.raw_user_meta_data ->> 'full_name', u.raw_user_meta_data ->> 'name', '')
from auth.users u
on conflict (id) do nothing;

update public.perfis p set papel = 'admin'
from auth.users u
where u.id = p.id and u.email_confirmed_at is not null
  and lower(u.email) in (select email from public.admins_autorizados);
