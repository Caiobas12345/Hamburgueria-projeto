/* =====================================================================
   PÃO NA CHAPA · Site
   Rotas (#inicio, #cardapio, #categoria/slug, #explorar/slug, #novidades,
   #entrar, #criar-conta, #recuperar-senha, #nova-senha, #conta, #pedido/id,
   #carrinho, #checkout, #admin, #cozinha, #entregador), janela do produto, busca, login e pedidos.
===================================================================== */
(function () {
  const PNC = window.PNC, E = PNC.estado, sb = PNC.sb, esc = PNC.esc, brl = PNC.brl;
  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => Array.from(r.querySelectorAll(s));
  const app = $('#app');

  /* ===================================================================
     ÍCONES
  =================================================================== */
  const ICON = {
    seta: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M5 12h14M13 6l6 6-6 6"/></svg>',
    voltar: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M19 12H5M11 6l-6 6 6 6"/></svg>',
    fechar: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M6 6l12 12M18 6L6 18"/></svg>',
    mais: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 5v14M5 12h14"/></svg>',
    menos: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M5 12h14"/></svg>',
    lixo: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 7h16M10 11v6M14 11v6M6 7l1 13h10l1-13M9 7V4h6v3"/></svg>',
    camera: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 8h3l2-2.5h6L17 8h3v11H4z"/><circle cx="12" cy="13" r="3.5"/></svg>',
    repetir: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 12a8 8 0 0114-5.3L20 9M20 4v5h-5M20 12a8 8 0 01-14 5.3L4 15M4 20v-5h5"/></svg>',
    relogio: '<svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="12" r="8.5"/><path d="M12 7.5V12l3 2"/></svg>',
    carrinho: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M3 4h2.2l2.1 10.2a1.5 1.5 0 001.5 1.2h8.4a1.5 1.5 0 001.5-1.1L20.5 8H6.1"/><circle cx="9.5" cy="19.5" r="1.4"/><circle cx="16.5" cy="19.5" r="1.4"/></svg>',
    coracao: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 20s-7-4.4-7-10a4 4 0 017-2.4A4 4 0 0119 10c0 5.6-7 10-7 10z"/></svg>',
    chama: '<svg viewBox="0 0 32 40" aria-hidden="true"><path d="M16 1c1.6 6.2-2.8 8.9-4.9 13.2C9.6 17.4 10 21 12.4 23c-.3-2.9.9-5.2 3.2-6.9-.2 3.3 1.5 5.4 3.4 7.2 1.9 1.8 2.6 4.5 1.4 6.9 3-1.3 5.1-4.1 5.2-7.6.1-2.6-.9-4.9-2.3-6.9.9 2.4.6 4.3-.8 5.6C23.6 14.6 21.3 6 16 1zM5.5 19.5C3.9 22 3 24.6 3 27.3 3 34.3 8.8 39 16 39s13-4.7 13-11.7c0-1.3-.2-2.5-.6-3.7-.4 5.6-5.6 9.4-12.4 9.4S4.6 30 4.3 25.1c-.1-1.9.3-3.8 1.2-5.6z"/></svg>',
    whats: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 20l1.3-3.9A8 8 0 1112 20a8 8 0 01-4-1.1z"/><path d="M9 9.5c.3 1.9 2.6 4.2 4.5 4.5l1-1.2 1.8.8-.4 1.6c-3 .4-7.4-4-7-7l1.6-.4.8 1.8z"/></svg>',
    insta: '<svg viewBox="0 0 24 24" aria-hidden="true"><rect x="3" y="3" width="18" height="18" rx="5"/><circle cx="12" cy="12" r="4.2"/><circle cx="17.4" cy="6.6" r=".9" fill="currentColor" stroke="none"/></svg>',
    google: '<svg viewBox="0 0 48 48" aria-hidden="true"><path fill="#EA4335" d="M24 9.5c3.5 0 6.6 1.2 9 3.5l6.7-6.7C35.6 2.4 30.2 0 24 0 14.6 0 6.6 5.4 2.6 13.3l7.8 6C12.2 13.6 17.6 9.5 24 9.5z"/><path fill="#4285F4" d="M46.1 24.5c0-1.6-.1-3.1-.4-4.5H24v9h12.4c-.5 2.9-2.2 5.3-4.6 6.9l7.4 5.8c4.3-4 6.9-9.9 6.9-17.2z"/><path fill="#FBBC05" d="M10.4 28.7c-.5-1.4-.8-3-.8-4.7s.3-3.2.8-4.7l-7.8-6C.9 16.6 0 20.2 0 24s.9 7.4 2.6 10.7l7.8-6z"/><path fill="#34A853" d="M24 48c6.5 0 11.9-2.1 15.9-5.8l-7.4-5.8c-2.1 1.4-4.8 2.2-8.5 2.2-6.4 0-11.8-4.1-13.6-9.8l-7.8 6C6.6 42.6 14.6 48 24 48z"/></svg>'
  };
  PNC.ICON = ICON;

  /* ===================================================================
     SESSÃO / LOGIN
  =================================================================== */
  const S = (PNC.sessao = { user: null, perfil: null, pronto: !sb, favs: new Set() });
  PNC.PAPEIS = { cliente: 'Cliente', entregador: 'Entregador', cozinha: 'Cozinha', admin: 'Administrador' };
  /* a permissão de verdade é conferida no banco; aqui só decide o que mostrar */
  PNC.contaAtiva = () => !S.perfil || S.perfil.ativo !== false;
  PNC.papel = () => (S.perfil && S.perfil.ativo !== false ? S.perfil.papel || 'cliente' : null);
  PNC.ehAdmin = () => PNC.papel() === 'admin';

  async function carregarPerfil() {
    S.favs = new Set();
    if (!S.user) { S.perfil = null; return; }
    const [{ data }, fav] = await Promise.all([
      sb.from('perfis').select('*').eq('id', S.user.id).maybeSingle(),
      sb.from('favoritos').select('produto_id')
    ]);
    S.perfil = data || { id: S.user.id, nome: '', telefone: '', papel: 'cliente', email: S.user.email };
    (fav.data || []).forEach(f => S.favs.add(Number(f.produto_id)));
  }

  /* depois do login volta para onde a pessoa estava (ex.: checkout) */
  function pedirLogin(msg, volta) {
    try { sessionStorage.setItem('pnc_volta', volta || location.hash || '#inicio'); } catch (e) { }
    S.aviso = msg || '';
    location.hash = 'entrar';
  }

  function irDepoisDoLogin() {
    let v = '';
    try { v = sessionStorage.getItem('pnc_volta') || ''; sessionStorage.removeItem('pnc_volta'); } catch (e) { }
    v = v.replace(/^#/, '');
    // veio por um link de convite: leva para a aba onde o código é aplicado
    try { if (localStorage.getItem('pnc_convite')) v = 'conta/indique'; } catch (e) { }
    if (!v || /^(entrar|criar-conta|recuperar-senha|nova-senha)/.test(v)) v = PNC.ehAdmin() ? 'admin' : PNC.papel() === 'cozinha' ? 'cozinha' : PNC.papel() === 'entregador' ? 'entregador' : 'conta';
    location.hash === '#' + v ? render() : (location.hash = v);
  }

  /* remove ?code= / ?error= que o Supabase coloca na volta do Google ou do e-mail */
  function limparUrl() {
    if (/[?&](code|error|error_description)=/.test(location.search)) {
      history.replaceState(null, '', location.pathname + location.hash);
    }
  }

  if (sb) {
    const erroUrl = new URLSearchParams(location.search).get('error_description');
    if (erroUrl) setTimeout(() => toast(erroUrl.replace(/\+/g, ' ')), 600);

    sb.auth.onAuthStateChange((evento, sessao) => {
      /* setTimeout: recomendação do Supabase para não travar dentro do callback */
      setTimeout(async () => {
        const antes = (S.user && S.user.id) || '';
        const estavaPronto = S.pronto;
        S.user = sessao ? sessao.user : null;
        await carregarPerfil();
        S.pronto = true;
        limparUrl();
        atualizarTopo();

        if (evento === 'PASSWORD_RECOVERY') { location.hash = 'nova-senha'; return; }

        let viaGoogle = false;
        try { viaGoogle = sessionStorage.getItem('pnc_oauth') === '1'; sessionStorage.removeItem('pnc_oauth'); } catch (e) { }

        if (S.user && (viaGoogle || /^#(entrar|criar-conta)$/.test(location.hash))) { irDepoisDoLogin(); return; }

        /* só redesenha se a pessoa entrou/saiu ou se a página depende do login (evita reiniciar o vídeo) */
        const mudou = antes !== ((S.user && S.user.id) || '');
        const r = rotaAtual().nome;
        if (!E.carregado) return;
        if (mudou || (!estavaPronto && PRIVADAS[r])) render();
        else montarRodape();
      }, 0);
    });
  }

  /* ===================================================================
     PEQUENAS PEÇAS
  =================================================================== */
  let toastT = 0;
  function toast(msg, link) {
    const t = $('#toast');
    t.innerHTML = esc(msg) + (link ? ` <a href="${link.href}">${esc(link.txt)}</a>` : '');
    t.hidden = false;
    requestAnimationFrame(() => t.classList.add('on'));
    clearTimeout(toastT);
    toastT = setTimeout(() => { t.classList.remove('on'); setTimeout(() => (t.hidden = true), 300); }, 3200);
  }
  PNC.toast = toast;

  /* status do pedido (as regras de quem muda cada um ficam no banco: mudar_status_pedido) */
  const STATUS = (PNC.STATUS = {
    aguardando_confirmacao: 'Aguardando confirmação',
    aguardando_pagamento: 'Aguardando pagamento',
    pagamento_aprovado: 'Pagamento aprovado',
    confirmado: 'Pedido confirmado',
    em_preparo: 'Em preparação',
    pronto: 'Pedido pronto',
    aguardando_entregador: 'Aguardando entregador',
    saiu_entrega: 'Saiu para entrega',
    entregue: 'Entregue',
    cancelado: 'Cancelado'
  });
  PNC.FINAIS = ['entregue', 'cancelado'];
  PNC.ANDAMENTO = Object.keys(STATUS).filter(s => !PNC.FINAIS.includes(s));
  /* nome do status para mostrar (retirada termina em "Retirado") */
  PNC.rotuloStatus = (s, tipo) => s === 'entregue' && tipo === 'retirada' ? 'Retirado' : s === 'pronto' && tipo === 'retirada' ? 'Pronto para retirada' : (STATUS[s] || s);
  /* etapas que o cliente vê na linha do tempo */
  PNC.passos = (tipo, pagamento) => [].concat(
    ['aguardando_confirmacao'],
    pagamento === 'pix' ? ['aguardando_pagamento', 'pagamento_aprovado'] : ['confirmado'],
    ['em_preparo', 'pronto'],
    tipo === 'entrega' ? ['aguardando_entregador', 'saiu_entrega'] : [],
    ['entregue']
  );
  PNC.corStatus = s => s === 'cancelado' ? 'st cancelado' : s === 'entregue' ? 'st feito' : 'st andamento';

  const PAGAMENTO = (PNC.PAGAMENTO = { pix: 'PIX', dinheiro: 'Dinheiro', cartao: 'Cartão (na entrega/retirada)' });

  const dataHora = d => new Date(d).toLocaleString('pt-BR', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' });
  PNC.dataHora = dataHora;

  const linkWhats = (numero, texto) => 'https://wa.me/' + PNC.soNumeros(numero) + (texto ? '?text=' + encodeURIComponent(texto) : '');
  PNC.linkWhats = linkWhats;

  /* foto/vídeo com reserva: a foto aparece primeiro; o vídeo entra por cima quando começa a tocar */
  function midia(o) {
    const foco = esc(o.foco || '50% 50%');
    const poster = o.poster ? esc(o.poster) : '';
    const img = poster ? `<img class="m-img" src="${poster}" alt="${esc(o.alt || '')}" style="object-position:${foco}" ${o.prioridade ? 'fetchpriority="high"' : 'loading="lazy"'} decoding="async">` : '';
    if (!o.video) return img;
    return img + `<video class="m-vid" data-video="${o.modo || 'auto'}" muted loop playsinline preload="${o.modo === 'hover' ? 'none' : 'metadata'}" ${poster ? `poster="${poster}"` : ''} style="object-position:${foco}" aria-hidden="true">` +
      (o.mobile ? `<source src="${esc(o.mobile)}" type="video/mp4" media="(max-width:760px) and (orientation:portrait)">` : '') +
      `<source src="${esc(o.video)}" type="video/mp4"></video>`;
  }
  PNC.midia = midia;

  /* liga os vídeos da página: tocam quando aparecem (ou ao passar o mouse nos cartões) */
  let obsVideo = null;
  const semMovimento = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const toque = matchMedia('(hover: none)').matches;

  function tocar(v) {
    v.muted = true;
    const p = v.play();
    if (p && p.catch) p.catch(() => { });
  }

  function ligarVideos(raiz) {
    if (obsVideo) obsVideo.disconnect();
    const vids = $$('video[data-video]', raiz);
    vids.forEach(v => {
      v.addEventListener('playing', () => v.parentElement.classList.add('tocando'));
      v.addEventListener('error', () => v.remove(), true);
    });
    if (semMovimento) return;

    obsVideo = 'IntersectionObserver' in window ? new IntersectionObserver(es => es.forEach(e => {
      const v = e.target;
      if (v.dataset.video === 'hover' && !toque) { if (!e.isIntersecting) v.pause(); return; }
      e.isIntersecting ? tocar(v) : v.pause();
    }), { threshold: 0.45 }) : null;

    vids.forEach(v => {
      if (obsVideo) obsVideo.observe(v); else tocar(v);
      if (v.dataset.video === 'hover' && !toque) {
        const card = v.closest('[data-card]') || v.parentElement;
        card.addEventListener('mouseenter', () => { if (v.preload === 'none') v.preload = 'auto'; tocar(v); });
        card.addEventListener('mouseleave', () => v.pause());
        card.addEventListener('focusin', () => tocar(v));
      }
    });
  }

  /* ---------- cartões ---------- */
  function precoHTML(p) {
    const tams = PNC.tamanhos(p);
    if (tams.length) return `<span class="preco"><small>a partir de</small> ${brl(PNC.precoMinimo(p))}</span>`;
    if (PNC.emPromo(p)) return `<span class="preco"><s>${brl(p.preco)}</s> <b>${brl(p.preco_promocional)}</b></span>`;
    return `<span class="preco">${brl(p.preco)}</span>`;
  }

  /* estrelas: só leitura (média) */
  const fmtNota = n => Number(n).toFixed(1).replace('.', ',');
  function estrelas(n, rotulo) {
    const cheias = Math.round(Number(n) || 0);
    return `<span class="estrelas" role="img" aria-label="${esc(rotulo || fmtNota(n) + ' de 5 estrelas')}">${[1, 2, 3, 4, 5].map(i => `<i class="${i <= cheias ? 'on' : ''}">★</i>`).join('')}</span>`;
  }
  PNC.estrelas = estrelas;
  PNC.fmtNota = fmtNota;
  const notaProduto = p => (E.notas || {})[p.id];

  function cartaoProduto(p) {
    const foto = (p.fotos || [])[0];
    const selos = [
      PNC.emPromo(p) ? '<i class="selo promo">Promoção</i>' : '',
      p.novidade ? '<i class="selo">Novidade</i>' : '',
      !p.disponivel ? '<i class="selo esgotado">Esgotado</i>' : ''
    ].join('');
    const fav = S.favs.has(p.id);
    return `<div class="pc${p.disponivel ? '' : ' off'}">
      <button type="button" class="pc-abrir" data-produto="${p.id}">
      <span class="pc-img">${foto ? `<img src="${esc(foto)}" alt="" loading="lazy" decoding="async">` : `<span class="sem-foto">${ICON.chama}</span>`}<span class="selos">${selos}</span></span>
      <span class="pc-info"><strong>${esc(p.nome)}</strong>${notaProduto(p) ? `<span class="pc-nota" aria-label="Nota ${fmtNota(notaProduto(p).media)} de 5, ${notaProduto(p).total} ${notaProduto(p).total === 1 ? 'avaliação' : 'avaliações'}"><b>★</b> ${fmtNota(notaProduto(p).media)} <small>(${notaProduto(p).total})</small></span>` : ''}${precoHTML(p)}</span>
      </button>
      <button type="button" class="pc-fav${fav ? ' on' : ''}" data-fav="${p.id}" aria-pressed="${fav}" aria-label="${fav ? 'Remover dos favoritos' : 'Favoritar'}: ${esc(p.nome)}">${ICON.coracao}</button>
      ${p.disponivel ? `<button type="button" class="pc-add" data-add-rapido="${p.id}" aria-label="Adicionar ao carrinho: ${esc(p.nome)}">${ICON.carrinho}</button>` : ''}
    </div>`;
  }
  PNC.cartaoProduto = cartaoProduto;

  const grade = lista => `<div class="grade">${lista.map(cartaoProduto).join('')}</div>`;

  function cabecalhoSecao(sobre, titulo, link) {
    return `<div class="sec-cab"><div>${sobre ? `<p class="sobre">${esc(sobre)}</p>` : ''}<h2>${esc(titulo)}</h2></div>${link ? `<a class="link-seta" href="${link.href}">${esc(link.txt)} ${ICON.seta}</a>` : ''}</div>`;
  }

  function vazio(titulo, texto, acao) {
    return `<div class="vazio">${ICON.chama}<h2>${esc(titulo)}</h2>${texto ? `<p>${esc(texto)}</p>` : ''}${acao || ''}</div>`;
  }

  function cartaoCategoria(c, grande) {
    const prods = PNC.produtosDaCategoria(c.slug).length;
    return `<a class="cat${grande ? ' grande' : ''}${c.capa_url || c.video_url ? '' : ' sem-midia'}" href="#categoria/${esc(c.slug)}" data-card>
      ${midia({ video: c.video_url, mobile: c.video_mobile_url, poster: c.capa_url, foco: c.foco, modo: 'hover' })}
      <span class="cat-txt"><strong>${esc(c.nome)}</strong>${c.descricao ? `<small>${esc(c.descricao)}</small>` : ''}<em>${prods ? prods + (prods > 1 ? ' opções' : ' opção') : 'Ver'} ${ICON.seta}</em></span>
    </a>`;
  }

  /* ===================================================================
     PÁGINAS
  =================================================================== */
  const P = {};

  /* ---------- INÍCIO ---------- */
  P.inicio = function () {
    const c = E.config;
    const aberto = PNC.abertoAgora();
    const hoje = PNC.horarioHoje();
    const zap = c.whatsapp ? linkWhats(c.whatsapp, 'Olá! Vim pelo site do Pão na Chapa.') : '';

    const hero = `<section class="hero" aria-label="Pão na Chapa">
      <div class="hero-midia">${midia({ video: c.banner_video_url, mobile: c.banner_video_mobile_url, poster: c.banner_poster_url, foco: c.banner_foco, prioridade: true })}</div>
      <div class="hero-sombra"></div>
      <div class="hero-txt">
        ${aberto != null ? `<p class="status-loja ${aberto ? 'on' : ''}"><i></i>${aberto ? 'Aberto agora' : 'Fechado agora'}${hoje ? ' · hoje ' + esc(hoje) : ''}</p>` : ''}
        <h1>${esc(c.banner_titulo || 'Pão na Chapa')}</h1>
        <p class="hero-sub">${esc(c.banner_texto || 'Hambúrgueres, porções, bebidas, sobremesas e combos.')}</p>
        <div class="botoes">
          <a class="btn amarelo" href="#cardapio">Ver cardápio</a>
        </div>
      </div>
    </section>`;

    const cats = `<section class="secao escuro" aria-labelledby="t-cats">
      <div class="caixa">${cabecalhoSecao('Escolha por categoria', 'Nosso cardápio', { href: '#cardapio', txt: 'Ver tudo' }).replace('<h2>', '<h2 id="t-cats">')}</div>
      <div class="cats" id="cats">${E.categorias.map((cat, i) => cartaoCategoria(cat, i === 0)).join('')}</div>
    </section>`;

    const explorar = E.campanhas.length ? `<section class="secao" aria-labelledby="t-exp">
      <div class="caixa sec-cab-linha">${cabecalhoSecao('Explorar', 'Destaques da casa').replace('<h2>', '<h2 id="t-exp">')}
        <div class="setas"><button type="button" data-rolar="-1" aria-label="Anterior">${ICON.voltar}</button><button type="button" data-rolar="1" aria-label="Próximo">${ICON.seta}</button></div></div>
      <div class="trilho" id="trilhoExp">${E.campanhas.map(k => `<a class="exp" href="#explorar/${esc(k.slug)}" data-card>
        ${midia({ video: k.video_url, mobile: k.video_mobile_url, poster: k.capa_url, foco: k.foco, modo: 'auto' })}
        <span class="exp-txt">${k.chamada ? `<small>${esc(k.chamada)}</small>` : ''}<strong>${esc(k.titulo)}</strong><em>Conhecer</em></span></a>`).join('')}</div>
    </section>` : '';

    const pagamentos = Object.keys(PAGAMENTO).filter(k => (c.pagamentos || {})[k]).map(k => k === 'cartao' ? 'cartão' : PAGAMENTO[k].toLowerCase().replace('pix', 'PIX'));
    const infos = [
      hoje ? ['Horário de hoje', hoje] : null,
      c.entrega_ativa ? ['Entrega', c.tempo_entrega || 'Peça pelo site'] : null,
      c.retirada_ativa ? ['Retirada no balcão', c.tempo_retirada || 'Peça e retire'] : null,
      pagamentos.length ? ['Pagamento', pagamentos.join(', ').replace(/, ([^,]*)$/, ' e $1')] : null
    ].filter(Boolean);
    const faixa = infos.length ? `<section class="faixa" aria-label="Informações da hamburgueria"><div class="caixa faixa-in">${infos.map(i => `<div><small>${esc(i[0])}</small><strong>${esc(i[1])}</strong></div>`).join('')}</div></section>` : '';

    const mais = (E.maisPedidos.length ? E.maisPedidos.map(PNC.produto).filter(Boolean) : E.produtos.filter(p => p.destaque)).slice(0, 8);
    const combos = PNC.produtosDaCategoria('combos').slice(0, 4);
    const promos = E.produtos.filter(PNC.emPromo).slice(0, 4);

    const blocos = [
      mais.length ? `<section class="secao"><div class="caixa">${cabecalhoSecao(E.maisPedidos.length ? 'Os favoritos dos clientes' : 'Escolhidos pela casa', 'Mais pedidos', { href: '#cardapio', txt: 'Cardápio completo' })}${grade(mais)}</div></section>` : '',
      combos.length ? `<section class="secao suave"><div class="caixa">${cabecalhoSecao('Para matar a fome', 'Combos especiais', { href: '#categoria/combos', txt: 'Todos os combos' })}${grade(combos)}</div></section>` : '',
      promos.length ? `<section class="secao"><div class="caixa">${cabecalhoSecao('Por tempo limitado', 'Promoções', { href: '#categoria/promocoes', txt: 'Ver promoções' })}${grade(promos)}</div></section>` : ''
    ].join('');

    const emBreve = !E.produtos.length ? `<section class="secao"><div class="caixa">${vazio(E.erro || 'Cardápio chegando', E.erro ? 'Tente novamente em instantes.' : 'Estamos preparando o cardápio online. Volte em breve!', zap ? `<a class="btn escuro" href="${zap}" target="_blank" rel="noopener">${ICON.whats} Falar no WhatsApp</a>` : '')}</div></section>` : '';

    const temSobre = c.sobre || c.endereco || (c.horarios || []).length || c.instagram;
    const sobre = temSobre ? `<section class="secao escuro sobre-casa" aria-labelledby="t-sobre"><div class="caixa sobre-grid">
      <div><p class="sobre">A hamburgueria</p><h2 id="t-sobre">${esc(c.nome_loja || 'Pão na Chapa')}</h2>${c.sobre ? `<p class="texto">${esc(c.sobre).replace(/\n/g, '<br>')}</p>` : ''}
        <div class="botoes">${zap ? `<a class="btn amarelo" href="${zap}" target="_blank" rel="noopener">${ICON.whats} WhatsApp</a>` : ''}${c.instagram ? `<a class="btn vidro" href="${esc(c.instagram)}" target="_blank" rel="noopener">${ICON.insta} Instagram</a>` : ''}</div></div>
      <dl class="dados-casa">${c.endereco ? `<dt>Endereço</dt><dd>${esc(c.endereco)}</dd>` : ''}${(c.horarios || []).length ? `<dt>Horários</dt><dd>${horariosLista()}</dd>` : ''}</dl>
    </div></section>` : '';

    const deps = (E.depoimentos || []).slice(0, 6);
    const depoimentos = deps.length ? `<section class="secao suave" aria-labelledby="t-dep"><div class="caixa">${cabecalhoSecao('Avaliações de quem pediu', 'O que dizem nossos clientes').replace('<h2>', '<h2 id="t-dep">')}
      <div class="depoimentos">${deps.map(d => `<figure class="depo">${estrelas(d.nota, d.nota + ' de 5 estrelas')}<blockquote>${esc(d.comentario)}</blockquote><figcaption>${esc(d.nome)} · ${new Date(d.criado_em).toLocaleDateString('pt-BR', { month: 'short', year: 'numeric', timeZone: 'America/Sao_Paulo' }).replace('.', '')}</figcaption></figure>`).join('')}</div>
    </div></section>` : '';

    app.innerHTML = hero + cats + explorar + faixa + blocos + depoimentos + emBreve + sobre;
  };

  function horariosLista() {
    const h = E.config.horarios || [];
    return PNC.DIAS.map((d, i) => {
      const t = h.filter(x => +x.dia === i).map(x => esc(x.abre) + '–' + esc(x.fecha));
      return `<span class="hr"><b>${d}</b> ${t.length ? t.join(', ') : 'Fechado'}</span>`;
    }).join('');
  }

  /* ---------- CARDÁPIO ---------- */
  P.cardapio = function () {
    const secoes = E.categorias.map(c => ({ c, lista: PNC.produtosDaCategoria(c.slug) })).filter(x => x.lista.length);
    app.innerHTML = `<section class="titulo-pag"><div class="caixa"><p class="sobre">Peça online</p><h1>Cardápio</h1></div></section>
      <nav class="chips-cat" aria-label="Categorias"><div class="caixa chips-in">${E.categorias.map(c => `<a class="chip" href="#categoria/${esc(c.slug)}">${esc(c.nome)}</a>`).join('')}</div></nav>
      ${secoes.length ? secoes.map(x => `<section class="secao curta"><div class="caixa">${cabecalhoSecao('', x.c.nome, { href: '#categoria/' + x.c.slug, txt: 'Ver categoria' })}${grade(x.lista)}</div></section>`).join('')
        : `<section class="secao escuro"><div class="caixa">${!E.produtos.length ? '<p class="aviso-vazio">Os produtos aparecem aqui assim que forem cadastrados no painel.</p>' : ''}</div><div class="cats">${E.categorias.map(c => cartaoCategoria(c)).join('')}</div></section>`}`;
  };

  /* ---------- CATEGORIA ---------- */
  P.categoria = function (params) {
    const c = PNC.categoria(params[0]);
    if (!c) return P.cardapio();
    const lista = PNC.produtosDaCategoria(c.slug);
    const outras = E.categorias.filter(x => x.slug !== c.slug);
    app.innerHTML = `<section class="cat-topo${c.capa_url || c.video_url ? '' : ' sem-midia'}">
        <div class="hero-midia">${midia({ video: c.video_url, mobile: c.video_mobile_url, poster: c.capa_url, foco: c.foco, prioridade: true })}</div>
        <div class="hero-sombra"></div>
        <div class="caixa cat-topo-txt"><a class="voltar" href="#cardapio">${ICON.voltar} Cardápio</a><h1>${esc(c.nome)}</h1>${c.descricao ? `<p>${esc(c.descricao)}</p>` : ''}</div>
      </section>
      ${(c.fotos || []).length ? `<div class="fotos-faixa">${c.fotos.map(f => `<img src="${esc(f)}" alt="" loading="lazy" decoding="async">`).join('')}</div>` : ''}
      <section class="secao curta"><div class="caixa">
        <p class="contagem">${lista.length ? lista.length + (lista.length > 1 ? ' opções' : ' opção') : ''}</p>
        ${lista.length ? grade(lista) : vazio('Em breve', 'Os produtos desta categoria aparecem aqui assim que forem cadastrados.')}
      </div></section>
      <section class="secao escuro curta"><div class="caixa">${cabecalhoSecao('Continue explorando', 'Outras categorias')}</div><div class="cats mini">${outras.map(x => cartaoCategoria(x)).join('')}</div></section>`;
  };

  /* ---------- NOVIDADES ---------- */
  P.novidades = function () {
    const lista = E.produtos.filter(p => p.novidade).sort(PNC.ordenar);
    app.innerHTML = `<section class="titulo-pag"><div class="caixa"><p class="sobre">Acabou de chegar</p><h1>Novidades</h1></div></section>
      ${E.campanhas.length ? `<section class="secao curta"><div class="trilho">${E.campanhas.map(k => `<a class="exp" href="#explorar/${esc(k.slug)}" data-card>${midia({ video: k.video_url, mobile: k.video_mobile_url, poster: k.capa_url, foco: k.foco })}<span class="exp-txt">${k.chamada ? `<small>${esc(k.chamada)}</small>` : ''}<strong>${esc(k.titulo)}</strong><em>Conhecer</em></span></a>`).join('')}</div></section>` : ''}
      <section class="secao curta"><div class="caixa">${lista.length ? grade(lista) : vazio('Nenhuma novidade por enquanto', 'Quando chegar algo novo no cardápio, você vê primeiro aqui.', '<a class="btn escuro" href="#cardapio">Ver cardápio</a>')}</div></section>`;
  };

  /* ---------- EXPLORAR (campanha) ---------- */
  P.explorar = function (params) {
    const k = E.campanhas.find(x => x.slug === params[0]);
    if (!k) { location.hash = 'inicio'; return; }
    const prods = (k.produtos || []).map(PNC.produto).filter(Boolean);
    app.innerHTML = `<section class="cat-topo${k.capa_url || k.video_url ? '' : ' sem-midia'}">
        <div class="hero-midia">${midia({ video: k.video_url, mobile: k.video_mobile_url, poster: k.capa_url, foco: k.foco, prioridade: true })}</div>
        <div class="hero-sombra"></div>
        <div class="caixa cat-topo-txt"><a class="voltar" href="#inicio">${ICON.voltar} Início</a>${k.chamada ? `<p class="sobre">${esc(k.chamada)}</p>` : ''}<h1>${esc(k.titulo)}</h1></div>
      </section>
      ${k.descricao ? `<section class="secao curta"><div class="caixa texto-campanha"><p>${esc(k.descricao).replace(/\n/g, '<br>')}</p></div></section>` : ''}
      ${(k.fotos || []).length ? `<div class="fotos-faixa">${k.fotos.map(f => `<img src="${esc(f)}" alt="" loading="lazy" decoding="async">`).join('')}</div>` : ''}
      ${prods.length ? `<section class="secao curta"><div class="caixa">${cabecalhoSecao('Para pedir agora', 'Produtos da campanha')}${grade(prods)}</div></section>` : ''}`;
  };

  /* ---------- LOGIN ---------- */
  function telaAuth(titulo, sub, corpo) {
    const c = E.config;
    return `<section class="auth">
      <div class="auth-form">
        <div class="auth-box">
          <a class="auth-logo" href="#inicio" aria-label="Pão na Chapa, início"><img class="logo-img" src="assets/img/logo.svg" alt="" width="92" height="92"></a>
          <h1>${esc(titulo)}</h1>
          <p class="auth-sub">${esc(sub)}</p>
          ${!sb ? '<p class="msg erro">O login ainda não foi configurado (falta ligar o Supabase em js/config.js).</p>' : ''}
          ${corpo}
        </div>
      </div>
      <div class="auth-arte" aria-hidden="true">${midia({ video: c.banner_video_url, poster: c.banner_poster_url, foco: c.banner_foco })}<div class="hero-sombra"></div>${c.banner_titulo ? `<p>${esc(c.banner_titulo)}</p>` : ''}</div>
    </section>`;
  }

  const campo = (id, rotulo, tipo, auto, extra) => `<label class="cp"><span>${rotulo}</span><input class="campo" id="${id}" type="${tipo || 'text'}" autocomplete="${auto || 'off'}" ${extra || ''}></label>`;
  const botaoGoogle = '<div class="ou"><span>ou</span></div><button type="button" class="btn google" data-google>' + ICON.google + ' Continuar com Google</button>';

  function mostrarMsg(txt, erro) {
    const m = $('#msgAuth');
    if (m) { m.textContent = txt; m.className = 'msg' + (erro ? ' erro' : ' ok'); m.hidden = !txt; }
  }

  P.entrar = function () {
    app.innerHTML = telaAuth('Entrar', 'Acesse sua conta para fazer pedidos e acompanhar a entrega.', `
      <form class="form-auth" data-auth="entrar" novalidate>
        ${campo('aEmail', 'E-mail', 'email', 'email')}
        ${campo('aSenha', 'Senha', 'password', 'current-password')}
        <a class="link-pequeno" href="#recuperar-senha">Esqueceu a senha?</a>
        <p class="msg" id="msgAuth" role="status" hidden></p>
        <button class="btn amarelo largo" type="submit">Entrar</button>
        ${botaoGoogle}
        <p class="troca">Ainda não tem conta? <a href="#criar-conta">Criar conta</a></p>
      </form>`);
    if (S.aviso) { mostrarMsg(S.aviso); S.aviso = ''; }
  };

  P['criar-conta'] = function () {
    app.innerHTML = telaAuth('Criar conta', 'Cadastre-se para pedir online, salvar endereços e acompanhar seus pedidos.', `
      <form class="form-auth" data-auth="criar" novalidate>
        ${campo('cNome', 'Nome', 'text', 'name')}
        ${campo('cEmail', 'E-mail', 'email', 'email')}
        ${campo('cTel', 'Telefone (WhatsApp)', 'tel', 'tel', 'placeholder="(47) 99999-9999"')}
        ${campo('cSenha', 'Senha (mínimo 6 caracteres)', 'password', 'new-password')}
        ${campo('cSenha2', 'Confirme a senha', 'password', 'new-password')}
        <p class="msg" id="msgAuth" role="status" hidden></p>
        <button class="btn amarelo largo" type="submit">Criar conta</button>
        ${botaoGoogle}
        <p class="troca">Já tem conta? <a href="#entrar">Entrar</a></p>
      </form>`);
    if (S.aviso) { mostrarMsg(S.aviso); S.aviso = ''; }
  };

  P['recuperar-senha'] = function () {
    app.innerHTML = telaAuth('Recuperar senha', 'Informe o e-mail da sua conta. Enviaremos um link para criar uma nova senha.', `
      <form class="form-auth" data-auth="recuperar" novalidate>
        ${campo('rEmail', 'E-mail', 'email', 'email')}
        <p class="msg" id="msgAuth" role="status" hidden></p>
        <button class="btn amarelo largo" type="submit">Enviar link</button>
        <p class="troca"><a href="#entrar">Voltar para entrar</a></p>
      </form>`);
  };

  P['nova-senha'] = function () {
    app.innerHTML = telaAuth('Nova senha', 'Crie sua nova senha.', `
      <form class="form-auth" data-auth="nova" novalidate>
        ${campo('nSenha', 'Nova senha (mínimo 6 caracteres)', 'password', 'new-password')}
        ${campo('nSenha2', 'Confirme a nova senha', 'password', 'new-password')}
        <p class="msg" id="msgAuth" role="status" hidden></p>
        <button class="btn amarelo largo" type="submit">Salvar nova senha</button>
      </form>`);
  };

  const traduzErro = m => {
    m = String(m || '');
    if (/invalid login credentials/i.test(m)) return 'E-mail ou senha incorretos.';
    if (/email not confirmed/i.test(m)) return 'Confirme seu e-mail pelo link que enviamos antes de entrar.';
    if (/already registered|already been registered/i.test(m)) return 'Este e-mail já tem conta. Tente entrar.';
    if (/rate limit|too many/i.test(m)) return 'Muitas tentativas. Aguarde um pouco e tente de novo.';
    if (/password should be at least/i.test(m)) return 'A senha precisa ter pelo menos 6 caracteres.';
    if (/provider is not enabled/i.test(m)) return 'O login com Google ainda não foi ativado no Supabase.';
    if (/produtos_promo_menor/i.test(m)) return 'O preço promocional precisa ser menor que o preço normal.';
    if (/could not find the function|function .* does not exist/i.test(m)) return 'Esta função ainda não está ativa no banco. Rode a migração mais recente no SQL Editor do Supabase.';
    return m || 'Algo deu errado. Tente novamente.';
  };
  PNC.traduzErro = traduzErro;

  const urlVolta = () => location.origin + location.pathname;

  async function enviarAuth(tipo, form) {
    if (!sb) return;
    const btn = form.querySelector('button[type=submit]');
    const val = id => ($('#' + id).value || '').trim();
    btn.disabled = true;
    try {
      if (tipo === 'entrar') {
        if (!val('aEmail') || !val('aSenha')) return mostrarMsg('Preencha e-mail e senha.', true);
        const { error } = await sb.auth.signInWithPassword({ email: val('aEmail'), password: $('#aSenha').value });
        if (error) return mostrarMsg(traduzErro(error.message), true);
        mostrarMsg('Entrando...');
      }
      if (tipo === 'criar') {
        if (val('cNome').length < 2) return mostrarMsg('Informe seu nome.', true);
        if (!/^\S+@\S+\.\S+$/.test(val('cEmail'))) return mostrarMsg('Informe um e-mail válido.', true);
        if (PNC.soNumeros(val('cTel')).length < 10) return mostrarMsg('Informe o telefone com DDD.', true);
        if ($('#cSenha').value.length < 6) return mostrarMsg('A senha precisa ter pelo menos 6 caracteres.', true);
        if ($('#cSenha').value !== $('#cSenha2').value) return mostrarMsg('As senhas não são iguais.', true);
        const { data, error } = await sb.auth.signUp({
          email: val('cEmail'), password: $('#cSenha').value,
          options: { data: { nome: val('cNome'), telefone: val('cTel') }, emailRedirectTo: urlVolta() }
        });
        if (error) return mostrarMsg(traduzErro(error.message), true);
        if (!data.session) {
          form.reset();
          return mostrarMsg('Conta criada! Enviamos um link de confirmação para o seu e-mail. Confirme e depois entre.');
        }
        mostrarMsg('Conta criada!');
      }
      if (tipo === 'recuperar') {
        if (!/^\S+@\S+\.\S+$/.test(val('rEmail'))) return mostrarMsg('Informe um e-mail válido.', true);
        const { error } = await sb.auth.resetPasswordForEmail(val('rEmail'), { redirectTo: urlVolta() });
        if (error) return mostrarMsg(traduzErro(error.message), true);
        mostrarMsg('Se este e-mail tiver conta, você vai receber o link em instantes. Confira também o spam.');
      }
      if (tipo === 'nova') {
        if ($('#nSenha').value.length < 6) return mostrarMsg('A senha precisa ter pelo menos 6 caracteres.', true);
        if ($('#nSenha').value !== $('#nSenha2').value) return mostrarMsg('As senhas não são iguais.', true);
        const { error } = await sb.auth.updateUser({ password: $('#nSenha').value });
        if (error) return mostrarMsg(traduzErro(error.message), true);
        toast('Senha alterada com sucesso.');
        location.hash = 'conta';
      }
    } finally {
      btn.disabled = false;
    }
  }

  async function entrarComGoogle() {
    if (!sb) return toast('O login ainda não foi configurado.');
    try { sessionStorage.setItem('pnc_oauth', '1'); } catch (e) { }
    const { error } = await sb.auth.signInWithOAuth({ provider: 'google', options: { redirectTo: urlVolta() } });
    if (error) { mostrarMsg(traduzErro(error.message), true); toast(traduzErro(error.message)); }
  }

  /* ---------- MINHA CONTA ---------- */
  const corStatus = PNC.corStatus;

  P.conta = async function (params) {
    const aba = params[0] || 'pedidos';
    const abas = [['pedidos', 'Meus pedidos'], ['dados', 'Dados pessoais'], ['enderecos', 'Endereços'], ['favoritos', 'Favoritos']];
    // a aba de pontos aparece quando o programa está ligado ou o cliente já tem histórico
    const [{ data: pts }, { data: ind }] = await Promise.all([sb.rpc('meus_pontos'), sb.rpc('minha_indicacao')]);
    if (pts && (pts.ativo || (pts.extrato || []).length)) abas.splice(1, 0, ['pontos', 'Meus pontos']);
    // indique e ganhe (migração 007): aparece com o programa ligado ou se a pessoa já participou
    if (ind && (ind.ativo || ind.indicados > 0 || ind.recebida)) abas.splice(abas.length - 1, 0, ['indique', 'Indique e ganhe']);
    const nome = (S.perfil && S.perfil.nome) || (S.user && S.user.email) || '';
    const papel = (S.perfil && S.perfil.papel) || 'cliente';
    const suspensa = !PNC.contaAtiva();
    const foto = (S.perfil && S.perfil.foto_url) || '';
    app.innerHTML = `<section class="titulo-pag claro"><div class="caixa conta-topo"><div class="conta-quem">
      <div class="avatar-conta">${foto ? `<img src="${esc(foto)}" alt="Sua foto de perfil">` : `<span aria-hidden="true">${esc((nome || '?').trim().charAt(0).toUpperCase())}</span>`}
        <label class="avatar-trocar" title="${foto ? 'Trocar foto' : 'Adicionar foto'}"><input type="file" accept="image/jpeg,image/png,image/webp" id="fotoPerfil" class="vh"><span class="vh">${foto ? 'Trocar foto de perfil' : 'Adicionar foto de perfil'}</span>${ICON.camera}</label></div>
      <div><p class="sobre">Minha conta</p><h1>Olá${nome ? ', ' + esc(nome.split(' ')[0]) : ''}</h1>${foto ? '<button class="btn-texto" type="button" id="tirarFoto">Remover foto</button>' : ''}${papel !== 'cliente' ? `<p class="conta-papel">Perfil: <span class="papel ${esc(papel)}">${esc(PNC.PAPEIS[papel] || papel)}</span></p>` : ''}</div></div>
      <div class="conta-acoes">${PNC.ehAdmin() ? '<a class="btn escuro" href="#admin">Painel administrativo</a>' : ''}${PNC.ehAdmin() || PNC.papel() === 'cozinha' ? '<a class="btn escuro" href="#cozinha">Painel da cozinha</a>' : ''}${PNC.papel() === 'entregador' ? '<a class="btn escuro" href="#entregador">Painel do entregador</a>' : ''}<button class="btn linha" type="button" data-sair>Sair da conta</button></div></div></section>
      ${suspensa ? `<div class="caixa"><p class="msg erro conta-aviso">Sua conta está suspensa${S.perfil.suspenso_motivo ? ' (' + esc(S.perfil.suspenso_motivo) + ')' : ''}. Você continua vendo seus pedidos, mas não pode fazer novos. Fale com a hamburgueria.</p></div>` : ''}
      <nav class="abas"><div class="caixa abas-in">${abas.map(a => `<a href="#conta/${a[0]}" class="${a[0] === aba ? 'on' : ''}">${a[1]}</a>`).join('')}</div></nav>
      <section class="secao curta"><div class="caixa" id="contaCorpo"><p class="carregando">Carregando...</p></div></section>`;
    const corpo = $('#contaCorpo');
    $('#fotoPerfil').addEventListener('change', e => { const f = e.target.files[0]; e.target.value = ''; if (f) trocarFoto(f); });
    if ($('#tirarFoto')) $('#tirarFoto').addEventListener('click', () => trocarFoto(null));

    if (aba === 'pedidos') {
      const [{ data, error }, { data: avs }] = await Promise.all([
        sb.from('pedidos').select('*').order('criado_em', { ascending: false }).limit(50),
        sb.from('avaliacoes').select('pedido_id')
      ]);
      if (error) { corpo.innerHTML = vazio('Não foi possível carregar', traduzErro(error.message)); return; }
      const avaliados = new Set((avs || []).map(a => Number(a.pedido_id)));
      const podeAvaliarLista = !!avs;
      corpo.innerHTML = data.length ? `<div class="lista-pedidos">${data.map(p => `<div class="lp-item"><a class="linha-pedido" href="#pedido/${p.id}">
          <span><strong>Pedido #${esc(p.codigo)}</strong><small>${dataHora(p.criado_em)} · ${p.tipo === 'entrega' ? 'Entrega' : 'Retirada'}${p.agendado_para ? ' · agendado para ' + esc(PNC.fmtAgendado(p.agendado_para)) : ''}</small></span>
          <span class="${corStatus(p.status)}">${PNC.rotuloStatus(p.status, p.tipo)}</span>${podeAvaliarLista && p.status === 'entregue' && !avaliados.has(Number(p.id)) ? '<span class="lp-avaliar">★ Avaliar</span>' : ''}<b>${brl(p.total)}</b>${ICON.seta}</a>
          ${PNC.FINAIS.includes(p.status) ? `<button class="lp-repetir" type="button" data-repetir="${p.id}">${ICON.repetir} Pedir de novo</button>` : ''}</div>`).join('')}</div>`
        : vazio('Você ainda não fez pedidos', 'Quando fizer, você acompanha tudo por aqui.', '<a class="btn amarelo" href="#cardapio">Ver cardápio</a>');
    }

    if (aba === 'dados') {
      const p = S.perfil || {};
      corpo.innerHTML = `<form class="form-conta" data-form="dados" novalidate>
        ${campo('dNome', 'Nome', 'text', 'name')}${campo('dTel', 'Telefone (WhatsApp)', 'tel', 'tel')}
        <label class="cp"><span>E-mail</span><input class="campo" value="${esc(S.user.email)}" disabled></label>
        <button class="btn escuro" type="submit">Salvar</button></form>`;
      $('#dNome').value = p.nome || '';
      $('#dTel').value = p.telefone || '';
    }

    if (aba === 'enderecos') {
      const { data } = await sb.from('enderecos').select('*').order('criado_em');
      corpo.innerHTML = `<div class="enderecos">${(data || []).map(e => `<div class="end-card"><strong>${esc(e.apelido)}</strong><p>${esc(textoEndereco(e))}</p><button class="btn-texto" type="button" data-apagar-end="${e.id}">Remover</button></div>`).join('') || '<p class="aviso-vazio">Nenhum endereço salvo.</p>'}</div>
        <h3 class="subt">Novo endereço</h3>
        <form class="form-conta" data-form="endereco" novalidate>${formEndereco('n')}<button class="btn escuro" type="submit">Salvar endereço</button></form>`;
    }

    if (aba === 'pontos') {
      if (!pts) { corpo.innerHTML = vazio('Programa de pontos indisponível', 'Tente novamente mais tarde.'); return; }
      const temRegra = pts.pontos_para_resgate && pts.valor_resgate;
      const pct = temRegra ? Math.min(100, Math.round((pts.saldo % pts.pontos_para_resgate) / pts.pontos_para_resgate * 100)) : 0;
      const blocos = temRegra ? Math.floor(pts.saldo / pts.pontos_para_resgate) : 0;
      const ROT = { ganho: 'Ganhou', resgate: 'Usou', estorno: 'Devolvido', indicacao: 'Indicação' };
      corpo.innerHTML = `<div class="pontos-conta">
        <div class="pontos-saldo">
          <p class="sobre">Seu saldo</p>
          <p class="pontos-num">${Number(pts.saldo)} <small>pontos</small></p>
          ${!pts.ativo ? '<p class="sm">O programa de pontos está pausado pela loja. Seus pontos continuam guardados.</p>'
          : blocos > 0 ? `<p>Você já pode trocar <b>${blocos * pts.pontos_para_resgate} pontos</b> por <b>${brl(blocos * pts.valor_resgate)}</b> de desconto no próximo pedido.</p>`
            : `<p>Faltam <b>${pts.pontos_para_resgate - (pts.saldo % pts.pontos_para_resgate)} pontos</b> para ganhar ${brl(pts.valor_resgate)} de desconto.</p>`}
          ${pts.ativo && temRegra ? `<div class="pontos-barra" role="img" aria-label="${pct}% do caminho até o próximo desconto"><i style="width:${pct}%"></i></div>` : ''}
        </div>
        ${pts.ativo ? `<div class="pontos-regras"><h3>Como funciona</h3><ul>
          <li>Você ganha <b>${String(pts.pontos_por_real).replace('.', ',')} ${Number(pts.pontos_por_real) === 1 ? 'ponto' : 'pontos'} por real</b> gasto em produtos, quando o pedido é entregue.</li>
          <li>Cada <b>${pts.pontos_para_resgate} pontos</b> viram <b>${brl(pts.valor_resgate)}</b> de desconto.</li>
          <li>Para usar, marque "Usar meus pontos" ao finalizar o pedido.</li>
          <li>Se um pedido com pontos for cancelado, os pontos voltam para você.</li></ul></div>` : ''}
        <div class="pontos-extrato"><h3>Extrato</h3>${(pts.extrato || []).length ? `<ul>${pts.extrato.map(m => `<li><span><b>${ROT[m.tipo] || m.tipo}</b><small>${esc(m.descricao)} · ${dataHora(m.criado_em)}</small></span><strong class="${m.pontos > 0 ? 'mais' : 'menos'}">${m.pontos > 0 ? '+' : '−'}${Math.abs(m.pontos)}</strong></li>`).join('')}</ul>` : '<p class="sm">Seus pontos aparecem aqui quando um pedido for entregue.</p>'}</div>
      </div>`;
    }

    if (aba === 'indique') desenharIndique(corpo, ind);

    if (aba === 'favoritos') {
      const lista = Array.from(S.favs).map(PNC.produto).filter(Boolean);
      corpo.innerHTML = lista.length ? grade(lista) : vazio('Nenhum favorito', 'Toque no coração dentro de um produto para salvar aqui.', '<a class="btn amarelo" href="#cardapio">Ver cardápio</a>');
    }
  };

  /* ---------- INDIQUE E GANHE ---------- */
  function desenharIndique(corpo, ind) {
    if (!ind) { corpo.innerHTML = vazio('Indique e ganhe indisponível', 'Tente novamente mais tarde.'); return; }
    // o convite guardado só serve enquanto a pessoa ainda pode usar um código
    if (!(ind.ativo && ind.pode_usar_codigo)) { try { localStorage.removeItem('pnc_convite'); } catch (e) { } }
    const pct = ind.desconto_percentual != null ? String(Number(ind.desconto_percentual)).replace('.', ',') + '%' : '';
    const link = ind.codigo ? location.origin + location.pathname + '#convite/' + ind.codigo : '';
    const texto = 'Peça no ' + (E.config.nome_loja || 'Pão na Chapa') + ' com o meu código ' + ind.codigo + ' e ganhe ' + pct + ' de desconto no seu primeiro pedido: ' + link;
    corpo.innerHTML = `<div class="indique">
      ${ind.ativo && ind.codigo ? `<div class="ind-codigo">
        <p class="sobre">Seu código</p>
        <p class="ind-num">${esc(ind.codigo)}</p>
        <div class="ind-botoes">
          <a class="btn verde" href="https://wa.me/?text=${encodeURIComponent(texto)}" target="_blank" rel="noopener">${ICON.whats} Enviar pelo WhatsApp</a>
          <button class="btn linha" type="button" data-copiar-link="${esc(link)}">Copiar link</button>
          ${navigator.share ? '<button class="btn linha" type="button" id="indShare">Compartilhar</button>' : ''}
        </div>
      </div>
      <div class="pontos-regras"><h3>Como funciona</h3><ul>
        <li>Seu amigo cria a conta pelo seu link (ou digita o seu código) e ganha <b>${pct} de desconto</b>${ind.desconto_maximo ? ' (até ' + brl(ind.desconto_maximo) + ')' : ''} no primeiro pedido.</li>
        <li>Quando o pedido dele for entregue, você ganha <b>${Number(ind.pontos_indicador)} pontos</b>.</li>
        <li>O desconto de indicação não junta com cupom.</li></ul></div>`
        : '<p class="msg">O indique e ganhe está pausado pela loja no momento.</p>'}
      <div class="ind-numeros"><div><b>${Number(ind.indicados)}</b><small>${Number(ind.indicados) === 1 ? 'amigo indicado' : 'amigos indicados'}</small></div>
        <div><b>${Number(ind.concluidas)}</b><small>${Number(ind.concluidas) === 1 ? 'já pediu' : 'já pediram'}</small></div>
        <div><b>${Number(ind.pontos_ganhos)}</b><small>pontos ganhos</small></div></div>
      ${ind.desconto_no_proximo ? `<p class="msg ok">Você foi indicado com o código ${esc(ind.recebida.codigo)}: seu desconto de ${pct} já vale no seu primeiro pedido.</p>` : ''}
      ${ind.ativo && ind.pode_usar_codigo ? `<form class="ind-usar" id="formIndicacao" novalidate>
        <label class="cp"><span>Recebeu um código de um amigo?</span>
        <div class="cupom-linha"><input class="campo" id="indCodigo" autocomplete="off" autocapitalize="characters" spellcheck="false" maxlength="20" placeholder="Ex.: PNCAB12C"><button class="btn escuro" type="submit">Usar código</button></div></label>
        <p class="sm">Vale só antes do seu primeiro pedido.</p><p class="msg erro" id="msgIndicacao" hidden></p></form>` : ''}
    </div>`;
    if ($('#indShare')) $('#indShare').addEventListener('click', () => navigator.share({ title: E.config.nome_loja || 'Pão na Chapa', text: texto }).catch(() => { }));
    const f = $('#formIndicacao');
    if (!f) return;
    const usar = async cod => {
      const m = $('#msgIndicacao');
      const { error } = await sb.rpc('usar_indicacao', { p_codigo: cod });
      try { localStorage.removeItem('pnc_convite'); } catch (e) { }
      if (error) { m.textContent = traduzErro(error.message); m.hidden = false; return; }
      toast('Código aplicado! Seu desconto vale no primeiro pedido.');
      render();
    };
    f.addEventListener('submit', e => {
      e.preventDefault();
      const v = $('#indCodigo').value.trim();
      if (!v) { const m = $('#msgIndicacao'); m.textContent = 'Digite o código.'; m.hidden = false; return; }
      usar(v);
    });
    // veio por um link de convite: aplica o código guardado
    let convite = '';
    try { convite = localStorage.getItem('pnc_convite') || ''; } catch (e) { }
    if (convite) { $('#indCodigo').value = convite; usar(convite); }
  }

  /* link de convite: #convite/CODIGO */
  P.convite = function (params) {
    const cod = String(params[0] || '').toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 20);
    try { if (cod) localStorage.setItem('pnc_convite', cod); } catch (e) { }
    if (S.user) { location.hash = 'conta/indique'; return; }
    try { sessionStorage.setItem('pnc_volta', '#conta/indique'); } catch (e) { }
    S.aviso = 'Você foi convidado! Crie sua conta para ganhar o desconto no primeiro pedido.';
    location.hash = 'criar-conta';
  };

  /* ---------- FOTO DE PERFIL ---------- */
  function reduzirFoto(arquivo, lado) {
    return new Promise((ok, falha) => {
      const img = new Image();
      const url = URL.createObjectURL(arquivo);
      img.onload = () => {
        // recorta no centro (quadrada) e reduz
        const q = Math.min(img.width, img.height), k = Math.min(1, lado / q);
        const c = document.createElement('canvas');
        c.width = c.height = Math.round(q * k);
        c.getContext('2d').drawImage(img, (img.width - q) / 2, (img.height - q) / 2, q, q, 0, 0, c.width, c.height);
        URL.revokeObjectURL(url);
        c.toBlob(b => b ? ok(b) : falha(new Error('Não foi possível ler a foto.')), 'image/jpeg', 0.86);
      };
      img.onerror = () => { URL.revokeObjectURL(url); falha(new Error('Não foi possível ler a foto.')); };
      img.src = url;
    });
  }
  async function trocarFoto(arquivo) {
    const antiga = (S.perfil && S.perfil.foto_url) || '';
    let url = '';
    try {
      if (arquivo) {
        if (!/^image\/(jpeg|png|webp)$/.test(arquivo.type)) return toast('Escolha uma foto em JPG, PNG ou WEBP.');
        if (arquivo.size > 15 * 1024 * 1024) return toast('Essa foto é muito grande. Escolha uma de até 15 MB.');
        toast('Enviando foto...');
        const blob = await reduzirFoto(arquivo, 400);
        const caminho = 'clientes/' + S.user.id + '/' + Date.now().toString(36) + '.jpg';
        const { error: eu } = await sb.storage.from('midia').upload(caminho, blob, { contentType: 'image/jpeg', upsert: false });
        if (eu) throw eu;
        url = sb.storage.from('midia').getPublicUrl(caminho).data.publicUrl;
      } else if (!confirm('Remover sua foto de perfil?')) return;
      const { error } = await sb.rpc('salvar_minha_foto', { p_url: url });
      if (error) throw error;
      // apaga a foto anterior (só funciona na própria pasta)
      const m = /\/midia\/(clientes\/[^?]+)$/.exec(antiga);
      if (m) sb.storage.from('midia').remove([m[1]]).catch(() => { });
      S.perfil.foto_url = url;
      atualizarTopo();
      toast(url ? 'Foto atualizada.' : 'Foto removida.');
      render();
    } catch (er) {
      toast(traduzErro((er && er.message) || 'Não foi possível salvar a foto.'));
    }
  }

  /* ---------- PEDIR DE NOVO ---------- */
  async function repetirPedido(id) {
    const { data: itens, error } = await sb.from('pedido_itens').select('*').eq('pedido_id', id).order('id');
    if (error) return toast(traduzErro(error.message));
    let ok = 0;
    const fora = [], mudou = [];
    (itens || []).forEach(i => {
      const p = i.produto_id && PNC.produto(i.produto_id);
      const tams = p ? PNC.tamanhos(p) : [];
      if (!p || !p.disponivel || (tams.length && !tams.some(t => t.nome === i.tamanho))) { fora.push(i.nome); return; }
      // adicionais foram gravados pelo nome: procura os que ainda existem para este produto
      const permitidos = PNC.adicionaisDo(p);
      const ids = [];
      (i.adicionais || []).forEach(a => { const x = permitidos.find(y => y.nome === a.nome); if (x) ids.push(x.id); });
      if (ids.length < (i.adicionais || []).length) mudou.push(i.nome);
      const item = { produto_id: p.id, tamanho: tams.length ? i.tamanho : '', adicionais: ids, removidos: (i.removidos || []).filter(r => (p.removiveis || []).includes(r)), obs: i.observacao || '', qtd: i.quantidade };
      if (PNC.carrinho.precoUnit(item) == null) { fora.push(i.nome); return; }
      PNC.carrinho.adicionar(item);
      ok++;
    });
    if (!ok) return toast('Os itens deste pedido não estão disponíveis agora.');
    location.hash = 'carrinho';
    const avisos = [];
    if (fora.length) avisos.push('Fora do cardápio agora: ' + fora.join(', ') + '.');
    if (mudou.length) avisos.push('Algum adicional não está disponível: ' + mudou.join(', ') + '.');
    setTimeout(() => toast('Itens adicionados ao carrinho. Os preços são os de hoje. ' + avisos.join(' ')), 150);
  }

  function textoEndereco(e) {
    return [e.rua + ', ' + e.numero, e.complemento, e.bairro, e.cidade, e.referencia ? 'Ref.: ' + e.referencia : ''].filter(Boolean).join(' · ');
  }
  PNC.textoEndereco = textoEndereco;

  function formEndereco(pre) {
    const bairros = E.bairros.filter(b => b.ativo !== false);
    return `<div class="grid-end">
      <label class="cp g2"><span>Rua</span><input class="campo" id="${pre}Rua" autocomplete="address-line1"></label>
      <label class="cp"><span>Número</span><input class="campo" id="${pre}Num" inputmode="numeric"></label>
      <label class="cp"><span>Complemento</span><input class="campo" id="${pre}Comp" autocomplete="address-line2" placeholder="Apto, bloco..."></label>
      <label class="cp"><span>Bairro</span>${bairros.length
        ? `<select class="campo" id="${pre}Bairro"><option value="">Escolha o bairro</option>${bairros.map(b => `<option>${esc(b.nome)}</option>`).join('')}${E.config.taxa_padrao != null ? '<option value="__outro">Outro bairro</option>' : ''}</select><input class="campo" id="${pre}BairroOutro" placeholder="Nome do bairro" hidden>`
        : `<input class="campo" id="${pre}Bairro">`}</label>
      <label class="cp"><span>Cidade</span><input class="campo" id="${pre}Cidade" autocomplete="address-level2"></label>
      <label class="cp g2"><span>Ponto de referência</span><input class="campo" id="${pre}Ref"></label>
      <label class="cp g2"><span>Nome do endereço</span><input class="campo" id="${pre}Apelido" placeholder="Casa, Trabalho..."></label>
    </div>`;
  }

  function lerEndereco(pre) {
    const v = id => ($('#' + pre + id) ? $('#' + pre + id).value.trim() : '');
    let bairro = v('Bairro');
    if (bairro === '__outro') bairro = v('BairroOutro');
    return { rua: v('Rua'), numero: v('Num'), complemento: v('Comp'), bairro, cidade: v('Cidade'), referencia: v('Ref'), apelido: v('Apelido') || 'Casa' };
  }

  /* ---------- PEDIDO (acompanhamento) ---------- */
  let canalPedido = null, pollPedido = 0;

  /* abre um canal de tempo real; se o tempo real falhar, a página segue funcionando
     (as telas também se atualizam sozinhas de tempos em tempos) */
  PNC.canal = function (nome, montar) {
    if (!sb || !sb.channel) return null;
    try {
      const unico = nome + '-' + Date.now().toString(36) + Math.random().toString(36).slice(2, 6);
      return montar(sb.channel(unico)).subscribe();
    } catch (er) {
      console.warn('Tempo real indisponível:', er && er.message);
      return null;
    }
  };

  P.pedido = async function (params) {
    const id = Number(params[0]);
    const novo = params[1] === 'novo';
    app.innerHTML = '<section class="secao"><div class="caixa"><p class="carregando">Carregando pedido...</p></div></section>';
    let terminado = false;

    const desenhar = async () => {
      const [{ data: p, error }, { data: itens }, { data: ev }, { data: ent }, { data: avs, error: erroAv }] = await Promise.all([
        sb.from('pedidos').select('*').eq('id', id).maybeSingle(),
        sb.from('pedido_itens').select('*').eq('pedido_id', id).order('id'),
        sb.from('pedido_eventos').select('*').eq('pedido_id', id).order('criado_em'),
        sb.rpc('entregador_do_pedido', { p_pedido: id }),
        sb.from('avaliacoes').select('*').eq('pedido_id', id)
      ]);
      if (location.hash.indexOf('#pedido/' + id) !== 0) return;
      if (error || !p) { app.innerHTML = `<section class="secao"><div class="caixa">${vazio('Pedido não encontrado', '', '<a class="btn escuro" href="#conta">Meus pedidos</a>')}</div></section>`; return; }

      const passos = PNC.passos(p.tipo, p.pagamento);
      const atual = passos.indexOf(p.status);
      const c = E.config;
      const recados = (ev || []).filter(e => e.mensagem);
      const podeCancelar = ['aguardando_confirmacao', 'aguardando_pagamento'].includes(p.status) && S.user && p.usuario_id === S.user.id;
      const pixPendente = p.pagamento === 'pix' && ['aguardando_confirmacao', 'aguardando_pagamento'].includes(p.status);
      const mostraCodigo = p.tipo === 'entrega' && p.codigo_entrega && ['aguardando_entregador', 'saiu_entrega'].includes(p.status);
      const temEntregador = ent && ent.nome && PNC.cartaoEntregador;
      // avaliação: só para quem fez o pedido, depois de entregue (a migração 005 precisa estar rodada)
      const minhaAv = (avs || [])[0] || null;
      let notasAv = [];
      if (minhaAv) { const { data: np } = await sb.from('avaliacao_produtos').select('*').eq('avaliacao_id', minhaAv.id); notasAv = np || []; }
      const podeAvaliar = !erroAv && p.status === 'entregue' && S.user && p.usuario_id === S.user.id;
      // pedido terminado não muda mais: para a atualização automática (não apaga o que o cliente digita)
      terminado = PNC.FINAIS.includes(p.status);
      if (terminado) {
        clearInterval(pollPedido);
        if (canalPedido) { try { sb.removeChannel(canalPedido); } catch (e) { } canalPedido = null; }
      }

      app.innerHTML = `<section class="titulo-pag claro"><div class="caixa">
          <a class="voltar escuro" href="#conta">${ICON.voltar} Meus pedidos</a>
          ${novo ? '<p class="sobre">Recebemos seu pedido!</p>' : '<p class="sobre">Acompanhe seu pedido</p>'}
          <h1>Pedido #${esc(p.codigo)}</h1><p class="sub">${dataHora(p.criado_em)} · ${p.tipo === 'entrega' ? 'Entrega' : 'Retirada no balcão'}</p></div></section>
        <section class="secao curta"><div class="caixa pedido-grid">
          <div>
            ${p.agendado_para && p.status !== 'cancelado' ? `<div class="agendado-box">${ICON.relogio}<span><small>Pedido agendado</small><b>${esc(PNC.fmtAgendado(p.agendado_para))}</b></span></div>` : ''}
            ${p.status === 'cancelado' ? `<div class="cancelado-box">Este pedido foi cancelado.${p.cancelado_motivo ? `<small>${esc(p.cancelado_motivo)}</small>` : ''}</div>` : `<ol class="linha-tempo">${passos.map((s, i) => {
        const e = (ev || []).filter(x => x.status === s && !x.mensagem).pop();
        const final = p.status === 'entregue';
        return `<li class="${i < atual || (final && i === atual) ? 'feito' : i === atual ? 'agora' : ''}"${i === atual ? ' aria-current="step"' : ''}><i></i><div><strong>${PNC.rotuloStatus(s, p.tipo)}</strong>${e && i <= atual ? `<small>${dataHora(e.criado_em)}</small>` : ''}</div></li>`;
      }).join('')}</ol>`}
            ${mostraCodigo ? `<div class="codigo-entrega">
              <div><small>Código de entrega</small>
                <p class="codigo-num" aria-label="Código ${esc(p.codigo_entrega.split('').join(' '))}">${esc(p.codigo_entrega)}</p>
                <p class="sm">Informe este código ao entregador só quando receber o pedido. Ele também pode ler o QR code.</p></div>
              ${PNC.qrSvg ? PNC.qrSvg('PNC:' + p.codigo + ':' + p.codigo_entrega, 'QR code do código de entrega') : ''}
            </div>` : ''}
            ${podeAvaliar ? (minhaAv ? avaliacaoFeita(minhaAv, notasAv, itens || [], temEntregador ? ent : null) : formAvaliacao(p, itens || [], temEntregador ? ent : null)) : ''}
            ${temEntregador && p.status !== 'cancelado' ? PNC.cartaoEntregador(ent, p.status === 'entregue' ? 'Quem entregou' : 'Seu entregador') : ''}
            ${p.mensagem_cliente ? `<div class="recado"><small>Mensagem da hamburgueria</small><p>${esc(p.mensagem_cliente)}</p></div>` : ''}
            ${recados.length > 1 ? `<details class="historico"><summary>Histórico de mensagens</summary>${recados.map(r => `<p><small>${dataHora(r.criado_em)}</small> ${esc(r.mensagem)}</p>`).join('')}</details>` : ''}
            ${pixPendente && c.chave_pix ? `<div class="pix-box"><small>Pagamento via PIX</small><p>Valor: <b>${brl(p.total)}</b></p><p>Chave PIX: <b>${esc(c.chave_pix)}</b></p><button class="btn linha" type="button" data-copiar="${esc(c.chave_pix)}">Copiar chave</button><p class="sm">Depois de pagar, envie o comprovante pelo WhatsApp. O pedido vai para a cozinha quando a loja confirmar o pagamento.</p></div>` : ''}
            ${p.pagamento === 'pix' && PNC.passos(p.tipo, p.pagamento).indexOf(p.status) >= 2 ? '<p class="msg ok">Pagamento PIX confirmado pela loja.</p>' : ''}
            <div class="pedido-acoes">${c.whatsapp ? `<a class="btn verde" href="${linkWhats(c.whatsapp, mensagemPedido(p, itens || []))}" target="_blank" rel="noopener">${ICON.whats} Enviar resumo pelo WhatsApp</a>` : ''}
            ${terminado && S.user && p.usuario_id === S.user.id ? `<button class="btn linha" type="button" data-repetir="${p.id}">${ICON.repetir} Pedir de novo</button>` : ''}
            ${podeCancelar ? `<button class="btn-texto" type="button" data-cancelar-pedido="${p.id}">Cancelar pedido</button>` : ''}</div>
          </div>
          <aside class="resumo">
            <h3>Itens</h3>
            ${(itens || []).map(i => `<div class="r-item"><div><strong>${i.quantidade}× ${esc(i.nome)}${i.tamanho ? ' (' + esc(i.tamanho) + ')' : ''}</strong>${detalhesItem(i.adicionais, i.removidos, i.observacao)}</div><b>${brl(i.total)}</b></div>`).join('')}
            <div class="r-linha"><span>Subtotal</span><b>${brl(p.subtotal)}</b></div>
            ${p.tipo === 'entrega' ? `<div class="r-linha"><span>Taxa de entrega</span><b>${brl(p.taxa_entrega)}</b></div>` : ''}
            ${Number(p.desconto) > 0 ? `<div class="r-linha desconto"><span>Cupom ${esc(p.cupom_codigo || '')}</span><b>− ${brl(p.desconto)}</b></div>` : ''}
            ${Number(p.desconto_pontos) > 0 ? `<div class="r-linha desconto"><span>${Number(p.pontos_usados)} pontos</span><b>− ${brl(p.desconto_pontos)}</b></div>` : ''}
            ${Number(p.desconto_indicacao) > 0 ? `<div class="r-linha desconto"><span>Desconto de indicação</span><b>− ${brl(p.desconto_indicacao)}</b></div>` : ''}
            ${Number(p.gorjeta) > 0 ? `<div class="r-linha"><span>Gorjeta do entregador</span><b>${brl(p.gorjeta)}</b></div>` : ''}
            <div class="r-linha total"><span>Total</span><b>${brl(p.total)}</b></div>
            <dl class="r-dados"><dt>Pagamento</dt><dd>${PAGAMENTO[p.pagamento]}${p.troco_para ? ' · troco para ' + brl(p.troco_para) : ''}</dd>
            ${p.endereco ? `<dt>Endereço</dt><dd>${esc(textoEndereco(p.endereco))}</dd>` : ''}
            ${p.observacoes ? `<dt>Observações</dt><dd>${esc(p.observacoes)}</dd>` : ''}</dl>
          </aside>
        </div></section>`;
    };

    await desenhar();
    avalAtual = { id, redesenhar: desenhar };
    if (terminado) return; // entregue ou cancelado: não precisa ficar atualizando

    /* atualização automática: em tempo real (Supabase Realtime) e, por garantia, a cada 30 s.
       Cada abertura usa um canal com nome próprio: reabrir o mesmo pedido antes do canal
       anterior terminar de fechar não pode quebrar a página. */
    pollPedido = setInterval(desenhar, 30000);
    canalPedido = PNC.canal('pedido-' + id, c => c
      .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'pedidos', filter: 'id=eq.' + id }, () => desenhar()));
  };

  /* ---------- AVALIAÇÃO DO PEDIDO ---------- */
  const ROT_NOTA = ['', 'Ruim', 'Regular', 'Bom', 'Muito bom', 'Excelente'];
  function seletorEstrelas(nome, legenda, obrig) {
    return `<fieldset class="estrelas-in" data-estrelas="${esc(nome)}"><legend>${esc(legenda)}${obrig ? '' : ' <small>(opcional)</small>'}</legend>
      <div class="estrelas-op">${[1, 2, 3, 4, 5].map(i => `<label><input type="radio" name="${esc(nome)}" value="${i}"><span aria-hidden="true">★</span><b class="vh">${i} ${i === 1 ? 'estrela' : 'estrelas'} (${ROT_NOTA[i]})</b></label>`).join('')}
      <em class="estrelas-rot" aria-hidden="true"></em></div></fieldset>`;
  }
  const produtosDoPedido = itens => {
    const vistos = new Set();
    return itens.filter(i => i.produto_id && !vistos.has(i.produto_id) && vistos.add(i.produto_id));
  };
  function formAvaliacao(p, itens, ent) {
    const prods = produtosDoPedido(itens);
    return `<form class="avaliar" id="formAval" novalidate>
      <p class="sobre">Pedido entregue</p><h3>Como foi o seu pedido?</h3>
      ${seletorEstrelas('nota', 'Nota do pedido', true)}
      <label class="cp"><span>Comentário <small>(opcional)</small></span><textarea class="campo" name="comentario" rows="3" maxlength="500" placeholder="Conte o que achou do lanche, da entrega..."></textarea></label>
      ${prods.length ? `<div class="avaliar-prods">${prods.map(i => seletorEstrelas('prod_' + i.produto_id, i.nome, false)).join('')}</div>` : ''}
      ${ent ? seletorEstrelas('nota_ent', 'Entregador: ' + ent.nome, false) : ''}
      <p class="msg erro" id="msgAval" hidden></p>
      <button class="btn amarelo" type="submit">Enviar avaliação</button>
      <p class="sm">Seu comentário pode aparecer no site depois de aprovado pela hamburgueria, só com o seu primeiro nome e a inicial do sobrenome.</p>
    </form>`;
  }
  function avaliacaoFeita(a, notas, itens, ent) {
    const nomeProd = id => (itens.find(i => i.produto_id === id) || {}).nome || 'Produto';
    return `<div class="avaliar feita"><p class="sobre">Sua avaliação</p>
      <p class="av-geral">${estrelas(a.nota, a.nota + ' de 5 estrelas')} <b>${ROT_NOTA[a.nota]}</b></p>
      ${a.comentario ? `<blockquote>${esc(a.comentario)}</blockquote>` : ''}
      ${notas.length || a.nota_entregador ? `<ul class="av-itens">${notas.map(n => `<li><span>${esc(nomeProd(n.produto_id))}</span>${estrelas(n.nota, n.nota + ' de 5 estrelas')}</li>`).join('')}${a.nota_entregador ? `<li><span>Entregador${ent ? ': ' + esc(ent.nome) : ''}</span>${estrelas(a.nota_entregador, a.nota_entregador + ' de 5 estrelas')}</li>` : ''}</ul>` : ''}
      <p class="sm">Obrigado por avaliar!${a.comentario ? (a.aprovada ? ' Seu comentário está publicado no site.' : ' Seu comentário aparece no site depois de aprovado pela hamburgueria.') : ''}</p></div>`;
  }
  /* os eventos do formulário de avaliação são ligados uma vez só; o pedido aberto fica em avalAtual */
  let avalAtual = null;
  (function ligarAvaliacao() {
    app.addEventListener('change', e => {
      const fs = e.target.closest('[data-estrelas]');
      if (!fs) return;
      const v = Number(e.target.value);
      fs.querySelectorAll('label').forEach((l, i) => l.classList.toggle('on', i < v));
      const rot = fs.querySelector('.estrelas-rot');
      if (rot) rot.textContent = ROT_NOTA[v] || '';
      const m = $('#msgAval');
      if (m && fs.dataset.estrelas === 'nota') m.hidden = true;
    });
    app.addEventListener('submit', async e => {
      if (e.target.id !== 'formAval') return;
      e.preventDefault();
      const f = e.target;
      const val = n => { const x = f.querySelector(`[name="${n}"]:checked`); return x ? Number(x.value) : null; };
      const msg = $('#msgAval');
      const nota = val('nota');
      if (!nota) { msg.textContent = 'Escolha de 1 a 5 estrelas para o pedido.'; msg.hidden = false; return; }
      const produtos = Array.from(f.querySelectorAll('[data-estrelas^="prod_"]')).map(fs => ({ produto_id: Number(fs.dataset.estrelas.slice(5)), nota: val(fs.dataset.estrelas) })).filter(x => x.nota);
      const btn = f.querySelector('[type=submit]');
      btn.disabled = true;
      if (!avalAtual) return;
      const { id, redesenhar } = avalAtual;
      const { error } = await sb.rpc('avaliar_pedido', { p_pedido: id, p_nota: nota, p_comentario: f.comentario.value.trim(), p_produtos: produtos, p_nota_entregador: val('nota_ent') });
      if (error) { btn.disabled = false; msg.textContent = traduzErro(error.message); msg.hidden = false; return; }
      toast('Obrigado pela avaliação!');
      redesenhar();
    });
  })();

  function detalhesItem(adicionais, removidos, obs) {
    const a = (adicionais || []).map(x => '+ ' + esc(x.nome));
    const r = (removidos || []).map(x => 'sem ' + esc(x));
    const linhas = a.concat(r);
    return (linhas.length ? `<small>${linhas.join(' · ')}</small>` : '') + (obs ? `<small class="obs">Obs.: ${esc(obs)}</small>` : '');
  }
  PNC.detalhesItem = detalhesItem;

  function mensagemPedido(p, itens) {
    const l = [`*Pedido #${p.codigo}* · ${E.config.nome_loja || 'Pão na Chapa'}`, ''];
    if (p.agendado_para) l.splice(1, 0, `*Agendado para ${PNC.fmtAgendado(p.agendado_para)}*`);
    itens.forEach(i => {
      l.push(`${i.quantidade}x ${i.nome}${i.tamanho ? ' (' + i.tamanho + ')' : ''} — ${brl(i.total)}`);
      (i.adicionais || []).forEach(a => l.push('   + ' + a.nome));
      (i.removidos || []).forEach(r => l.push('   sem ' + r));
      if (i.observacao) l.push('   Obs.: ' + i.observacao);
    });
    l.push('', `Subtotal: ${brl(p.subtotal)}`);
    if (p.tipo === 'entrega') l.push(`Entrega: ${brl(p.taxa_entrega)}`);
    if (Number(p.desconto) > 0) l.push(`Cupom ${p.cupom_codigo || ''}: − ${brl(p.desconto)}`);
    if (Number(p.desconto_pontos) > 0) l.push(`${p.pontos_usados} pontos: − ${brl(p.desconto_pontos)}`);
    if (Number(p.desconto_indicacao) > 0) l.push(`Desconto de indicação: − ${brl(p.desconto_indicacao)}`);
    if (Number(p.gorjeta) > 0) l.push(`Gorjeta do entregador: ${brl(p.gorjeta)}`);
    l.push(`*Total: ${brl(p.total)}*`, '', `Pagamento: ${PAGAMENTO[p.pagamento]}${p.troco_para ? ' (troco para ' + brl(p.troco_para) + ')' : ''}`);
    l.push(p.tipo === 'entrega' && p.endereco ? 'Entrega em: ' + textoEndereco(p.endereco) : 'Retirada no balcão');
    l.push(`Cliente: ${p.cliente_nome} · ${p.cliente_telefone}`);
    if (p.observacoes) l.push('Obs.: ' + p.observacoes);
    return l.join('\n');
  }
  PNC.mensagemPedido = mensagemPedido;

  /* ---------- CARRINHO ---------- */
  P.carrinho = function () {
    const itens = PNC.carrinho.itens();
    if (!itens.length) {
      app.innerHTML = `<section class="titulo-pag claro"><div class="caixa"><p class="sobre">Seu pedido</p><h1>Carrinho</h1></div></section>
        <section class="secao curta"><div class="caixa">${vazio('Seu carrinho está vazio', 'Escolha seus favoritos no cardápio.', '<a class="btn amarelo" href="#cardapio">Ver cardápio</a>')}</div></section>`;
      return;
    }
    const sub = PNC.carrinho.subtotal();
    const min = Number(E.config.pedido_minimo || 0);
    app.innerHTML = `<section class="titulo-pag claro"><div class="caixa"><p class="sobre">Seu pedido</p><h1>Carrinho</h1></div></section>
      <section class="secao curta"><div class="caixa carrinho-grid">
        <div class="itens">${itens.map(i => {
      const p = PNC.produto(i.produto_id);
      const unit = PNC.carrinho.precoUnit(i);
      const adds = (i.adicionais || []).map(id => E.adicionais.find(a => a.id === id)).filter(Boolean).map(a => ({ nome: a.nome }));
      const foto = p && (p.fotos || [])[0];
      return `<article class="item${unit == null ? ' indisp' : ''}">
            <span class="item-img">${foto ? `<img src="${esc(foto)}" alt="" loading="lazy">` : `<span class="sem-foto">${ICON.chama}</span>`}</span>
            <div class="item-info"><strong>${esc(p ? p.nome : 'Produto removido')}${i.tamanho ? ' <small>(' + esc(i.tamanho) + ')</small>' : ''}</strong>
              ${detalhesItem(adds, i.removidos, i.obs)}
              ${unit == null ? '<small class="erro">Indisponível no momento. Remova para continuar.</small>' : `<small>${brl(unit)} cada</small>`}
              <div class="item-acoes">${unit != null ? `<div class="qtd"><button type="button" data-qtd="${i.k}" data-d="-1" aria-label="Diminuir">${ICON.menos}</button><span>${i.qtd}</span><button type="button" data-qtd="${i.k}" data-d="1" aria-label="Aumentar">${ICON.mais}</button></div>` : ''}
              <button class="btn-texto" type="button" data-remover="${i.k}">${ICON.lixo} Remover</button></div>
            </div>
            <b class="item-total">${unit == null ? '—' : brl(unit * i.qtd)}</b>
          </article>`;
    }).join('')}</div>
        <aside class="resumo">
          <h3>Resumo</h3>
          <div class="r-linha"><span>Subtotal</span><b>${brl(sub)}</b></div>
          <div class="r-linha"><span>Taxa de entrega</span><span class="cinza">calculada no checkout</span></div>
          <div class="r-linha total"><span>Total</span><b>${brl(sub)}</b></div>
          ${min && sub < min ? `<p class="msg erro">Pedido mínimo: ${brl(min)}.</p>` : ''}
          <button class="btn amarelo largo" type="button" data-finalizar ${PNC.carrinho.temIndisponivel() || (min && sub < min) ? 'disabled' : ''}>Finalizar pedido</button>
          <a class="btn linha largo" href="#cardapio">Continuar comprando</a>
        </aside>
      </div></section>`;
  };

  /* ---------- CHECKOUT ---------- */
  P.checkout = async function () {
    if (!PNC.carrinho.itens().length) { location.hash = 'carrinho'; return; }
    const c = E.config;
    const { data: ends } = await sb.from('enderecos').select('*').order('criado_em');
    const tipos = [c.entrega_ativa && 'entrega', c.retirada_ativa && 'retirada'].filter(Boolean);
    const pags = Object.keys(PAGAMENTO).filter(k => (c.pagamentos || {})[k]);
    const aberto = PNC.abertoAgora();
    const suspensa = !PNC.contaAtiva();
    // agendamento: com a loja fechada agora ainda dá para agendar para um horário de funcionamento
    const slots = c.agendamento_ativo && c.aceitando_pedidos ? PNC.horariosAgendamento() : [];
    const fechadoAgora = aberto === false;
    const soAgendar = fechadoAgora && slots.length > 0;
    const fechado = suspensa || !c.aceitando_pedidos || (fechadoAgora && !soAgendar) || !tipos.length || !pags.length;
    const dias = [...new Set(slots.map(x => x.data))];
    const perfil = S.perfil || {};
    // pontos (migração 004) e desconto de indicação (migração 007): sem elas, a tela segue sem esses blocos
    const [{ data: pts }, { data: indR }] = await Promise.all([sb.rpc('meus_pontos'), sb.rpc('minha_indicacao')]);
    const fid = pts && pts.ativo ? pts : null;
    const ind = indR && indR.desconto_no_proximo ? indR : null;
    const pctInd = ind ? String(Number(ind.desconto_percentual)).replace('.', ',') + '%' : '';
    let cupom = null; // cupom aplicado: { codigo, tipo, desconto }

    app.innerHTML = `<section class="titulo-pag claro"><div class="caixa"><a class="voltar escuro" href="#carrinho">${ICON.voltar} Carrinho</a><h1>Finalizar pedido</h1></div></section>
      <section class="secao curta"><div class="caixa carrinho-grid">
        <form class="checkout" id="formCheckout" novalidate>
          ${fechado ? `<p class="msg erro">${suspensa ? 'Sua conta está suspensa e não pode fazer pedidos. Fale com a hamburgueria.' : !c.aceitando_pedidos || aberto === false ? 'A loja não está recebendo pedidos agora.' + (PNC.horarioHoje() ? ' Hoje: ' + esc(PNC.horarioHoje()) + '.' : '') : 'A loja ainda não configurou entrega/retirada ou pagamento.'}</p>` : ''}
          ${!fechado && soAgendar ? '<p class="msg">A loja está fechada agora, mas você pode agendar o seu pedido para um horário de funcionamento.</p>' : ''}
          <fieldset><legend>1. Como você quer receber?</legend>
            <div class="opcoes">${tipos.map((t, i) => `<label class="opcao"><input type="radio" name="tipo" value="${t}" ${i ? '' : 'checked'}><span><strong>${t === 'entrega' ? 'Entrega' : 'Retirada no balcão'}</strong><small>${esc(t === 'entrega' ? c.tempo_entrega : c.tempo_retirada) || (t === 'entrega' ? 'Levamos até você' : (c.endereco ? esc(c.endereco) : 'Você retira na loja'))}</small></span></label>`).join('')}</div>
            ${slots.length ? `<div class="quando">
              <p class="quando-tit">Para quando?</p>
              <div class="pilulas">
                <label><input type="radio" name="quando" value="agora" ${soAgendar ? 'disabled' : 'checked'}><span>${soAgendar ? 'Agora (fechado)' : 'O quanto antes'}</span></label>
                <label><input type="radio" name="quando" value="agendar" ${soAgendar ? 'checked' : ''}><span>${ICON.relogio} Agendar</span></label>
              </div>
              <div class="agendar" id="blocoAgendar" hidden>
                <label class="cp"><span>Dia</span><select class="campo" id="kDia">${dias.map(d => `<option value="${d}">${esc(PNC.rotuloDia(d))}</option>`).join('')}</select></label>
                <label class="cp"><span>Horário</span><select class="campo" id="kHora"></select></label>
              </div>
            </div>` : ''}
          </fieldset>
          <fieldset><legend>2. Seus dados</legend><div class="grid-end">
            <label class="cp"><span>Nome</span><input class="campo" id="kNome" autocomplete="name" value="${esc(perfil.nome || '')}"></label>
            <label class="cp"><span>Telefone (WhatsApp)</span><input class="campo" id="kTel" type="tel" autocomplete="tel" value="${esc(perfil.telefone || '')}"></label></div>
          </fieldset>
          <fieldset id="blocoEnd"><legend>3. Endereço de entrega</legend>
            ${(ends || []).length ? `<div class="opcoes">${ends.map((e, i) => `<label class="opcao"><input type="radio" name="end" value="${e.id}" ${i ? '' : 'checked'}><span><strong>${esc(e.apelido)}</strong><small>${esc(textoEndereco(e))}</small></span></label>`).join('')}
              <label class="opcao"><input type="radio" name="end" value="novo"><span><strong>Usar outro endereço</strong></span></label></div>` : '<input type="radio" name="end" value="novo" checked hidden>'}
            <div id="endNovo" ${(ends || []).length ? 'hidden' : ''}>${formEndereco('k')}<label class="check"><input type="checkbox" id="kSalvar" checked> Salvar este endereço na minha conta</label></div>
            <p class="msg erro" id="msgBairro" hidden></p>
          </fieldset>
          <fieldset><legend id="legPag">4. Pagamento</legend>
            <div class="opcoes">${pags.map((k, i) => `<label class="opcao"><input type="radio" name="pag" value="${k}" ${i ? '' : 'checked'}><span><strong>${PAGAMENTO[k]}</strong>${k === 'pix' ? '<small>A chave PIX aparece depois de confirmar</small>' : ''}</span></label>`).join('')}</div>
            <label class="cp" id="campoTroco" hidden><span>Troco para quanto? (opcional)</span><input class="campo" id="kTroco" inputmode="decimal" placeholder="Ex.: 100"></label>
            ${c.gorjeta_ativa ? `<label class="cp campo-gorjeta" id="campoGorjeta" hidden><span>Gorjeta para o entregador <small>(opcional)</small></span><input class="campo" id="kGorjeta" inputmode="decimal" maxlength="7" placeholder="R$ 0,00"><small class="sm">O valor vai inteiro para quem entregar o seu pedido.</small></label>` : ''}
          </fieldset>
          <fieldset><legend id="legObs">5. Observações</legend>
            <textarea class="campo" id="kObs" rows="3" maxlength="500" placeholder="Ex.: interfone não funciona, chamar no portão"></textarea>
          </fieldset>
        </form>
        <aside class="resumo">
          <h3>Seu pedido</h3>
          ${PNC.carrinho.itens().map(i => { const p = PNC.produto(i.produto_id); const t = PNC.carrinho.linha(i); return p && t != null ? `<div class="r-item"><div><strong>${i.qtd}× ${esc(p.nome)}${i.tamanho ? ' (' + esc(i.tamanho) + ')' : ''}</strong></div><b>${brl(t)}</b></div>` : ''; }).join('')}
          <div class="r-linha"><span>Subtotal</span><b>${brl(PNC.carrinho.subtotal())}</b></div>
          <div class="r-linha" id="linhaTaxa"><span>Taxa de entrega</span><b id="kTaxa">—</b></div>
          <div class="r-linha desconto" id="linhaCupom" hidden><span id="kCupomRot">Cupom</span><b id="kCupomVal"></b></div>
          <div class="r-linha desconto" id="linhaPontos" hidden><span id="kPontosRot">Pontos</span><b id="kPontosVal"></b></div>
          ${ind ? `<div class="r-linha desconto" id="linhaInd"><span>Desconto de indicação (${pctInd})</span><b id="kIndVal"></b></div>` : ''}
          <div class="r-linha" id="linhaGorjeta" hidden><span>Gorjeta do entregador</span><b id="kGorjetaVal"></b></div>
          <div class="r-linha total"><span>Total</span><b id="kTotal">${brl(PNC.carrinho.subtotal())}</b></div>
          <p class="r-quando" id="kQuando" hidden></p>
          ${ind ? '<p class="sm cupom-ind">Seu desconto de indicação já está aplicado. Ele não junta com cupom.</p>' : ''}
          <div class="cupom-box" ${ind ? 'hidden' : ''}>
            <label for="kCupom">Cupom de desconto</label>
            <div class="cupom-linha" id="cupomForm"><input class="campo" id="kCupom" autocomplete="off" autocapitalize="characters" spellcheck="false" maxlength="30" placeholder="Digite o código"><button class="btn linha" type="button" id="btnCupom">Aplicar</button></div>
            <div class="cupom-ok" id="cupomOk" hidden><span><b id="cupomCod"></b><small id="cupomDesc"></small></span><button class="btn-texto" type="button" id="btnTiraCupom">Remover</button></div>
            <p class="sm cupom-msg" id="msgCupom" role="status" hidden></p>
          </div>
          ${fid ? `<div class="pontos-box" id="pontosBox"></div>` : ''}
          <p class="msg erro" id="msgCheckout" hidden></p>
          <button class="btn amarelo largo" type="submit" form="formCheckout" id="btnConfirmar" ${fechado ? 'disabled' : ''}>Confirmar pedido</button>
          <p class="sm">O valor final é conferido pela loja no momento do pedido.</p>
        </aside>
      </div></section>`;

    const form = $('#formCheckout');
    const atualizar = () => {
      const tipo = (form.querySelector('[name=tipo]:checked') || {}).value;
      const pag = (form.querySelector('[name=pag]:checked') || {}).value;
      const endSel = (form.querySelector('[name=end]:checked') || {}).value;
      $('#blocoEnd').hidden = tipo !== 'entrega';
      $('#legPag').textContent = (tipo === 'entrega' ? '4' : '3') + '. Pagamento';
      $('#legObs').textContent = (tipo === 'entrega' ? '5' : '4') + '. Observações';
      $('#endNovo').hidden = endSel !== 'novo';
      $('#campoTroco').hidden = pag !== 'dinheiro';
      const bSel = $('#kBairro');
      if (bSel && $('#kBairroOutro')) $('#kBairroOutro').hidden = bSel.value !== '__outro';

      let taxa = 0, ok = true;
      if (tipo === 'entrega') {
        const bairro = endSel === 'novo' ? lerEndereco('k').bairro : ((ends || []).find(e => String(e.id) === endSel) || {}).bairro;
        const r = bairro ? PNC.taxaPara(bairro) : { ok: true, taxa: null };
        ok = r.ok; taxa = r.taxa;
        $('#kTaxa').textContent = !bairro ? 'escolha o bairro' : r.ok ? brl(r.taxa) : 'fora da área';
        const m = $('#msgBairro');
        m.hidden = r.ok;
        m.textContent = r.ok ? '' : 'Ainda não entregamos neste bairro. Escolha retirada ou outro endereço.';
      }
      $('#linhaTaxa').hidden = tipo !== 'entrega';
      const sub = PNC.carrinho.subtotal();
      // agendamento
      const quando = (form.querySelector('[name=quando]:checked') || {}).value || 'agora';
      if ($('#blocoAgendar')) $('#blocoAgendar').hidden = quando !== 'agendar';
      const hora = quando === 'agendar' && $('#kHora') ? $('#kHora').value : '';
      const q = $('#kQuando');
      q.hidden = !hora;
      if (hora) q.innerHTML = ICON.relogio + ' Agendado para <b>' + esc(PNC.fmtAgendado(hora)) + '</b>';
      // gorjeta (só na entrega)
      if ($('#campoGorjeta')) $('#campoGorjeta').hidden = tipo !== 'entrega';
      const gorj = tipo === 'entrega' ? lerGorjeta() : 0;
      $('#linhaGorjeta').hidden = !(gorj > 0);
      if (gorj > 0) $('#kGorjetaVal').textContent = brl(gorj);
      // indicação: prévia (o banco recalcula)
      let dInd = 0;
      if (ind) {
        dInd = Math.round(sub * Number(ind.desconto_percentual)) / 100;
        if (ind.desconto_maximo != null) dInd = Math.min(dInd, Number(ind.desconto_maximo));
        $('#kIndVal').textContent = '− ' + brl(dInd);
      }
      ultimaTaxa = taxa || 0;
      // prévia do desconto (o valor final é recalculado pelo banco ao criar o pedido)
      let dCupom = 0;
      if (cupom) dCupom = cupom.tipo === 'frete_gratis' ? (tipo === 'entrega' ? (taxa || 0) : 0) : cupom.desconto;
      $('#linhaCupom').hidden = !cupom;
      if (cupom) {
        $('#kCupomRot').textContent = 'Cupom ' + cupom.codigo;
        $('#kCupomVal').textContent = cupom.tipo === 'frete_gratis' && tipo !== 'entrega' ? 'só na entrega' : '− ' + brl(dCupom);
      }
      const dPontos = desenharPontos(sub - dInd - (cupom && cupom.tipo !== 'frete_gratis' ? dCupom : 0));
      $('#linhaPontos').hidden = !dPontos;
      if (dPontos) $('#kPontosVal').textContent = '− ' + brl(dPontos);
      $('#kTotal').textContent = brl(Math.max(0, sub + (taxa || 0) - dCupom - dPontos - dInd) + (gorj > 0 ? gorj : 0));
      if (cupom && tipoCupom !== tipo) { tipoCupom = tipo; revalidarCupom(); }
      $('#btnConfirmar').disabled = fechado || !ok || (quando === 'agora' && fechadoAgora) || (quando === 'agendar' && !hora);
    };

    /* gorjeta digitada: aceita "5", "7,50" ou "7.50". NaN = valor inválido */
    function lerGorjeta() {
      const el = $('#kGorjeta');
      if (!el) return 0;
      let v = el.value.replace(/[^\d,.]/g, '');
      if (!v) return 0;
      v = v.indexOf(',') >= 0 ? v.replace(/\./g, '').replace(',', '.') : v;
      const n = Math.round(Number(v) * 100) / 100;
      return isNaN(n) ? NaN : n;
    }
    /* horários do dia escolhido */
    function preencherHoras() {
      const sel = $('#kHora');
      if (!sel) return;
      const antes = sel.value;
      const doDia = slots.filter(x => x.data === $('#kDia').value);
      sel.innerHTML = doDia.map(x => `<option value="${x.iso}">${x.hora}</option>`).join('');
      if (doDia.some(x => x.iso === antes)) sel.value = antes;
    }
    if ($('#kDia')) { $('#kDia').addEventListener('change', preencherHoras); preencherHoras(); }

    /* pontos: mostra o saldo e, se der, a opção de trocar por desconto */
    let ultimaTaxa = 0, tipoCupom = null;
    function desenharPontos(produtosRestantes) {
      const box = $('#pontosBox');
      if (!fid || !box) return 0;
      const blocos = Math.floor(fid.saldo / fid.pontos_para_resgate);
      const cabe = Math.floor(Math.max(0, produtosRestantes) / fid.valor_resgate + 1e-9);
      const usar = Math.min(blocos, cabe);
      const marcado = $('#kPontos') && $('#kPontos').checked;
      if (blocos < 1) {
        const falta = fid.pontos_para_resgate - fid.saldo;
        box.innerHTML = `<p class="sm"><b>Seus pontos: ${fid.saldo}</b> · faltam ${falta} para trocar por ${brl(fid.valor_resgate)} de desconto.</p>`;
        return 0;
      }
      if (usar < 1) {
        box.innerHTML = `<p class="sm"><b>Seus pontos: ${fid.saldo}</b> · o pedido precisa ter pelo menos ${brl(fid.valor_resgate)} em produtos para usar pontos.</p>`;
        return 0;
      }
      box.innerHTML = `<label class="check pontos-check"><input type="checkbox" id="kPontos" ${marcado ? 'checked' : ''}>
        <span>Usar meus pontos<small>${usar * fid.pontos_para_resgate} de ${fid.saldo} pontos = ${brl(usar * fid.valor_resgate)} de desconto</small></span></label>`;
      return marcado ? usar * fid.valor_resgate : 0;
    }

    /* cupom: confere o código no banco e mostra a prévia do desconto */
    const msgCupom = (t, bom) => { const m = $('#msgCupom'); m.textContent = t || ''; m.hidden = !t; m.classList.toggle('ok', !!bom); };
    async function aplicarCupom(codigo) {
      const tipo = (form.querySelector('[name=tipo]:checked') || {}).value;
      const btn = $('#btnCupom');
      btn.disabled = true;
      const { data, error } = await sb.rpc('validar_cupom', { p_codigo: codigo, p_subtotal: PNC.carrinho.subtotal(), p_tipo: tipo, p_taxa: ultimaTaxa });
      btn.disabled = false;
      if (error) { msgCupom(traduzErro(error.message)); return; }
      if (!data || !data.ok) { cupom = null; mostrarCupom(); msgCupom(data && data.mensagem); atualizar(); return; }
      cupom = { codigo: data.codigo, tipo: data.tipo, desconto: Number(data.desconto) || 0, descricao: data.descricao };
      tipoCupom = tipo;
      mostrarCupom();
      msgCupom('');
      atualizar();
    }
    function revalidarCupom() { if (cupom) aplicarCupom(cupom.codigo); }
    function mostrarCupom() {
      $('#cupomForm').hidden = !!cupom;
      $('#cupomOk').hidden = !cupom;
      if (cupom) {
        $('#cupomCod').textContent = cupom.codigo;
        $('#cupomDesc').textContent = cupom.descricao || (cupom.tipo === 'frete_gratis' ? 'Entrega grátis' : 'Desconto aplicado');
      }
    }
    $('#btnCupom').addEventListener('click', () => {
      const v = $('#kCupom').value.trim();
      if (!v) return msgCupom('Digite o código do cupom.');
      aplicarCupom(v);
    });
    $('#kCupom').addEventListener('keydown', e => { if (e.key === 'Enter') { e.preventDefault(); $('#btnCupom').click(); } });
    $('#btnTiraCupom').addEventListener('click', () => { cupom = null; $('#kCupom').value = ''; mostrarCupom(); msgCupom(''); atualizar(); $('#kCupom').focus(); });
    if (fid) $('#pontosBox').addEventListener('change', atualizar);
    form.addEventListener('change', atualizar);
    form.addEventListener('input', e => { if (['kBairro', 'kBairroOutro', 'kGorjeta'].includes(e.target.id)) atualizar(); });
    atualizar();

    form.addEventListener('submit', async e => {
      e.preventDefault();
      const msg = t => { const m = $('#msgCheckout'); m.textContent = t; m.hidden = !t; };
      const tipo = (form.querySelector('[name=tipo]:checked') || {}).value;
      const pag = (form.querySelector('[name=pag]:checked') || {}).value;
      const endSel = (form.querySelector('[name=end]:checked') || {}).value;
      const nome = $('#kNome').value.trim(), tel = $('#kTel').value.trim();
      if (nome.length < 2) return msg('Informe seu nome.');
      if (PNC.soNumeros(tel).length < 10) return msg('Informe o telefone com DDD.');

      let endereco = null;
      if (tipo === 'entrega') {
        endereco = endSel === 'novo' ? lerEndereco('k') : (ends || []).find(x => String(x.id) === endSel);
        if (!endereco || !endereco.rua || !endereco.numero || !endereco.bairro) return msg('Preencha rua, número e bairro.');
      }
      const troco = pag === 'dinheiro' && $('#kTroco').value ? Number($('#kTroco').value.replace(/\./g, '').replace(',', '.')) : null;
      const quando = (form.querySelector('[name=quando]:checked') || {}).value || 'agora';
      const hora = quando === 'agendar' && $('#kHora') ? $('#kHora').value : '';
      if (quando === 'agendar' && !hora) return msg('Escolha o dia e o horário do agendamento.');
      const gorj = tipo === 'entrega' ? lerGorjeta() : 0;
      if (isNaN(gorj) || gorj < 0) return msg('Confira o valor da gorjeta.');
      if (gorj > 200) return msg('A gorjeta pode ser de até R$ 200,00.');

      const btn = $('#btnConfirmar');
      btn.disabled = true;
      btn.textContent = 'Enviando...';
      msg('');
      const chave = chavePedido();
      const extras = {};
      if (cupom) extras.p_cupom = cupom.codigo;
      if ($('#kPontos') && $('#kPontos').checked) extras.p_usar_pontos = true;
      if (hora) extras.p_agendar_para = hora;
      if (gorj > 0) extras.p_gorjeta = gorj;
      const { data, error } = await sb.rpc('criar_pedido', {
        ...extras,
        p_itens: PNC.carrinho.paraPedido(),
        p_tipo: tipo,
        p_endereco: endereco ? { rua: endereco.rua, numero: endereco.numero, complemento: endereco.complemento || '', bairro: endereco.bairro, cidade: endereco.cidade || '', referencia: endereco.referencia || '' } : null,
        p_pagamento: pag,
        p_troco_para: troco && !isNaN(troco) ? troco : null,
        p_observacoes: $('#kObs').value.trim(),
        p_nome: nome,
        p_telefone: tel,
        p_chave: chave
      });
      if (error) {
        btn.disabled = false;
        btn.textContent = 'Confirmar pedido';
        msg(traduzErro(error.message));
        if (/não está mais disponível|não está disponível/.test(error.message)) { await PNC.carregar(); }
        if (/cupom/i.test(error.message)) { cupom = null; mostrarCupom(); msgCupom(traduzErro(error.message)); atualizar(); }
        return;
      }
      if (tipo === 'entrega' && endSel === 'novo' && $('#kSalvar') && $('#kSalvar').checked) {
        await sb.from('enderecos').insert({ apelido: endereco.apelido || 'Casa', rua: endereco.rua, numero: endereco.numero, complemento: endereco.complemento, bairro: endereco.bairro, cidade: endereco.cidade, referencia: endereco.referencia });
      }
      if (S.perfil && (!S.perfil.nome || !S.perfil.telefone)) await carregarPerfil();
      try { sessionStorage.removeItem('pnc_chave'); } catch (er) { }
      PNC.carrinho.limpar();
      location.hash = 'pedido/' + data.id + '/novo';
    });
  };

  /* mesma tentativa de pedido = mesma chave (o banco não cria o pedido duas vezes).
     A chave muda quando o carrinho muda ou depois que o pedido é criado. */
  function chavePedido() {
    const assinatura = JSON.stringify(PNC.carrinho.paraPedido());
    let salvo = null;
    try { salvo = JSON.parse(sessionStorage.getItem('pnc_chave') || 'null'); } catch (e) { }
    if (salvo && salvo.a === assinatura && salvo.c) return salvo.c;
    const nova = (crypto.randomUUID && crypto.randomUUID()) || 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, ch => {
      const r = crypto.getRandomValues(new Uint8Array(1))[0] % 16;
      return (ch === 'x' ? r : (r & 3) | 8).toString(16);
    });
    try { sessionStorage.setItem('pnc_chave', JSON.stringify({ a: assinatura, c: nova })); } catch (e) { }
    return nova;
  }

  /* ---------- ADMIN ---------- */
  P.admin = function (params) {
    if (PNC.admin) PNC.admin.render(app, params);
  };

  /* ---------- COZINHA ---------- */
  P.entregador = function (params) {
    if (PNC.entregador) PNC.entregador.render(app, params);
  };

  P.cozinha = function () {
    if (PNC.cozinha) PNC.cozinha.render(app);
  };

  /* ===================================================================
     JANELA DO PRODUTO
  =================================================================== */
  const janela = $('#janela'), caixa = $('#janelaCaixa');
  let focoAntes = null;

  function abrirJanela(html, classe) {
    focoAntes = document.activeElement;
    caixa.className = 'janela-caixa ' + (classe || '');
    caixa.innerHTML = html;
    janela.hidden = false;
    document.body.classList.add('travado');
    requestAnimationFrame(() => janela.classList.add('on'));
    const f = caixa.querySelector('[data-foco]') || caixa.querySelector('button, input, select, textarea, a');
    if (f) f.focus({ preventScroll: true });
  }

  function fecharJanela() {
    if (janela.hidden) return;
    janela.classList.remove('on');
    document.body.classList.remove('travado');
    setTimeout(() => { janela.hidden = true; caixa.innerHTML = ''; }, 250);
    if (focoAntes && focoAntes.focus) focoAntes.focus({ preventScroll: true });
  }
  PNC.abrirJanela = abrirJanela;
  PNC.fecharJanela = fecharJanela;

  function abrirProduto(id) {
    const p = PNC.produto(id);
    if (!p) return;
    const cat = PNC.categoriaDe(p);
    const fotos = (p.fotos || []).filter(Boolean);
    const tams = PNC.tamanhos(p);
    const adds = PNC.adicionaisDo(p);
    const fav = S.favs.has(p.id);

    abrirJanela(`<button class="j-fechar" type="button" data-fechar-janela aria-label="Fechar">${ICON.fechar}</button>
      <div class="prod">
        <div class="prod-galeria">
          <div class="prod-foto">${fotos.length ? `<img id="fotoPrincipal" src="${esc(fotos[0])}" alt="${esc(p.nome)}">` : `<span class="sem-foto grande">${ICON.chama}</span>`}</div>
          ${fotos.length > 1 ? `<div class="miniaturas">${fotos.map((f, i) => `<button type="button" class="${i ? '' : 'on'}" data-foto="${esc(f)}" aria-label="Foto ${i + 1}"><img src="${esc(f)}" alt=""></button>`).join('')}</div>` : ''}
        </div>
        <form class="prod-info" id="formProduto" novalidate>
          <div class="prod-rolar">
            <p class="sobre">${esc(cat ? cat.nome : '')}</p>
            <div class="prod-titulo"><h2 id="janelaTitulo">${esc(p.nome)}</h2>${S.user ? `<button type="button" class="fav${fav ? ' on' : ''}" data-fav="${p.id}" aria-pressed="${fav}" aria-label="Favoritar">${ICON.coracao}</button>` : ''}</div>
            <p class="prod-preco">${precoHTML(p)}</p>
            ${p.disponivel && p.controla_estoque && p.estoque_minimo != null && Number(p.estoque) <= Number(p.estoque_minimo) ? `<p class="prod-restam">${Number(p.estoque) === 1 ? 'Última unidade' : 'Últimas ' + Number(p.estoque) + ' unidades'}</p>` : ''}
            ${notaProduto(p) ? `<p class="prod-nota">${estrelas(notaProduto(p).media)} <b>${fmtNota(notaProduto(p).media)}</b> <small>${notaProduto(p).total} ${notaProduto(p).total === 1 ? 'avaliação' : 'avaliações'}</small></p>` : ''}
            ${p.descricao ? `<p class="prod-desc">${esc(p.descricao)}</p>` : ''}
            ${(p.inclui || []).length ? `<div class="bloco"><h3>O combo inclui</h3><ul class="inclui">${p.inclui.map(x => `<li>${esc(x)}</li>`).join('')}</ul></div>` : ''}
            ${(p.ingredientes || []).length ? `<div class="bloco"><h3>Ingredientes</h3><p class="ingr">${p.ingredientes.map(esc).join(', ')}</p></div>` : ''}
            ${tams.length ? `<fieldset class="bloco"><legend>Tamanho <em>obrigatório</em></legend><div class="pilulas">${tams.map((t, i) => `<label><input type="radio" name="tam" value="${esc(t.nome)}" ${i ? '' : 'checked'}><span>${esc(t.nome)} · ${brl(t.preco)}</span></label>`).join('')}</div></fieldset>` : ''}
            ${adds.length ? `<fieldset class="bloco"><legend>Adicionais</legend>${adds.map(a => `<label class="linha-op"><input type="checkbox" name="add" value="${a.id}"><span>${esc(a.nome)}</span><b>+ ${brl(a.preco)}</b></label>`).join('')}</fieldset>` : ''}
            ${(p.removiveis || []).length ? `<fieldset class="bloco"><legend>Retirar ingredientes</legend>${p.removiveis.map(r => `<label class="linha-op"><input type="checkbox" name="rem" value="${esc(r)}"><span>Sem ${esc(r)}</span></label>`).join('')}</fieldset>` : ''}
            ${p.disponivel ? `<label class="bloco cp"><span>Observações</span><textarea class="campo" name="obs" rows="2" maxlength="200" placeholder="Ex.: ponto da carne, sem sal..."></textarea></label>` : ''}
          </div>
          <div class="prod-rodape">
            ${p.disponivel ? `<div class="qtd"><button type="button" data-pq="-1" aria-label="Diminuir">${ICON.menos}</button><span id="pQtd">1</span><button type="button" data-pq="1" aria-label="Aumentar">${ICON.mais}</button></div>
            <button class="btn linha" type="submit">Adicionar ao carrinho</button>
            <button class="btn amarelo btn-comprar" type="button" data-comprar data-foco>Comprar agora <span id="pTotal"></span></button>` : '<p class="esgotado-txt">Esgotado no momento</p>'}
          </div>
        </form>
      </div>`, 'janela-produto');

    if (!p.disponivel) return;
    const form = $('#formProduto');
    let qtd = 1;
    const calcular = () => {
      const tam = (form.querySelector('[name=tam]:checked') || {}).value;
      const ids = $$('[name=add]:checked', form).map(x => Number(x.value));
      const item = { produto_id: p.id, tamanho: tam || '', adicionais: ids, qtd };
      const u = PNC.carrinho.precoUnit(item) || 0;
      $('#pTotal').textContent = '· ' + brl(u * qtd);
      $('#pQtd').textContent = qtd;
      return item;
    };
    form.addEventListener('change', calcular);
    const colocarNoCarrinho = () => {
      const item = calcular();
      item.removidos = $$('[name=rem]:checked', form).map(x => x.value);
      item.obs = (form.querySelector('[name=obs]') || { value: '' }).value.trim();
      PNC.carrinho.adicionar(item);
      fecharJanela();
    };
    form.addEventListener('click', e => {
      const b = e.target.closest('[data-pq]');
      if (b) { qtd = Math.max(1, Math.min(p.controla_estoque ? Math.max(1, Number(p.estoque)) : 50, 50, qtd + Number(b.dataset.pq))); calcular(); }
      /* Comprar agora: põe no carrinho e vai direto para finalizar o pedido */
      if (e.target.closest('[data-comprar]')) { colocarNoCarrinho(); irParaCheckout(); }
    });
    form.addEventListener('submit', e => {
      e.preventDefault();
      colocarNoCarrinho();
      toast(p.nome + ' adicionado ao carrinho.', { href: '#carrinho', txt: 'Ver carrinho' });
    });
    calcular();
  }
  PNC.abrirProduto = abrirProduto;

  /* ===================================================================
     BUSCA
  =================================================================== */
  const busca = $('#busca'), buscaTexto = $('#buscaTexto');
  const norm = s => String(s || '').normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase();

  function abrirBusca() {
    busca.hidden = false;
    requestAnimationFrame(() => busca.classList.add('on'));
    setTimeout(() => buscaTexto.focus(), 60);
    buscar();
  }
  function fecharBusca() { busca.classList.remove('on'); setTimeout(() => (busca.hidden = true), 200); }

  function buscar() {
    const q = norm(buscaTexto.value.trim());
    const res = $('#buscaRes');
    if (!q) { res.innerHTML = `<div class="busca-cats">${E.categorias.map(c => `<a href="#categoria/${esc(c.slug)}">${esc(c.nome)}</a>`).join('')}</div>`; return; }
    const lista = E.produtos.filter(p => norm(p.nome + ' ' + p.descricao + ' ' + (p.ingredientes || []).join(' ') + ' ' + ((PNC.categoriaDe(p) || {}).nome || '')).includes(q)).slice(0, 12);
    res.innerHTML = lista.length ? lista.map(p => `<button type="button" class="busca-item" data-produto="${p.id}"><span class="bi-img">${(p.fotos || [])[0] ? `<img src="${esc(p.fotos[0])}" alt="">` : ICON.chama}</span><span><strong>${esc(p.nome)}</strong>${precoHTML(p)}</span></button>`).join('')
      : `<p class="aviso-vazio">${E.produtos.length ? 'Nada encontrado para "' + esc(buscaTexto.value) + '".' : 'O cardápio ainda está sendo cadastrado.'}</p>`;
  }

  $('#btnBusca').addEventListener('click', abrirBusca);
  $('#buscaFechar').addEventListener('click', fecharBusca);
  buscaTexto.addEventListener('input', buscar);
  busca.addEventListener('click', e => { if (e.target === busca) fecharBusca(); });

  /* ===================================================================
     CABEÇALHO, RODAPÉ, MENU
  =================================================================== */
  const topo = $('#topo');
  const ICONE_PERFIL = $('.ic-perfil').innerHTML;
  function atualizarTopo() {
    const r = rotaAtual().nome;
    const temHero = r === 'inicio' || r === 'categoria' || r === 'explorar';
    topo.classList.toggle('sobre-video', temHero && scrollY < 40 && $('#menuCel').hidden);
    $$('[data-nav]').forEach(a => {
      const alvo = a.dataset.nav;
      const atual = r === 'categoria' ? (['combos', 'promocoes'].includes(rotaAtual().params[0]) ? rotaAtual().params[0] : 'cardapio') : r === 'pedido' ? 'conta' : r;
      a.toggleAttribute('aria-current', alvo === atual);
    });
    const n = PNC.carrinho.contar();
    $$('[data-badge]').forEach(b => { b.hidden = !n; b.textContent = n > 99 ? '99+' : n; });
    const ic = $('.ic-perfil'), foto = S.user && S.perfil && S.perfil.foto_url;
    ic.setAttribute('aria-label', S.user ? 'Minha conta' : 'Entrar');
    if (foto && ic.dataset.foto !== foto) { ic.dataset.foto = foto; ic.innerHTML = `<img class="avatar-topo" src="${esc(foto)}" alt="">`; }
    else if (!foto && ic.dataset.foto) { delete ic.dataset.foto; ic.innerHTML = ICONE_PERFIL; }
  }

  function montarAviso() {
    const a = $('#aviso');
    const txt = (E.config.aviso || '').trim();
    a.hidden = !txt;
    a.textContent = txt;
    document.documentElement.style.setProperty('--aviso-h', txt ? a.offsetHeight + 'px' : '0px');
  }

  function montarRodape() {
    const c = E.config;
    const zap = c.whatsapp ? linkWhats(c.whatsapp, 'Olá! Vim pelo site do Pão na Chapa.') : '';
    $('#rodape').innerHTML = `<div class="caixa rodape-cols">
        <div class="rd-marca"><a class="logo" href="#inicio" aria-label="Pão na Chapa, início"><img class="logo-img" src="assets/img/logo.svg" alt="" width="112" height="112" loading="lazy"></a>${c.endereco ? `<p>${esc(c.endereco)}</p>` : ''}${PNC.horarioHoje() ? `<p>Hoje: ${esc(PNC.horarioHoje())}</p>` : ''}</div>
        <div><h3>Cardápio</h3>${E.categorias.map(x => `<a href="#categoria/${esc(x.slug)}">${esc(x.nome)}</a>`).join('')}</div>
        <div><h3>Minha conta</h3><a href="#conta">${S.user ? 'Minha conta' : 'Entrar'}</a>${S.user ? '' : '<a href="#criar-conta">Criar conta</a>'}<a href="#conta/pedidos">Meus pedidos</a><a href="#carrinho">Carrinho</a></div>
        <div><h3>Atendimento</h3>${zap ? `<a href="${zap}" target="_blank" rel="noopener">WhatsApp</a>` : ''}${c.instagram ? `<a href="${esc(c.instagram)}" target="_blank" rel="noopener">Instagram</a>` : ''}<a href="#novidades">Novidades</a></div>
      </div>
      <div class="rodape-fim caixa"><span>© ${new Date().getFullYear()} ${esc(c.nome_loja || 'Pão na Chapa')}</span>${zap || c.instagram ? `<span class="redes">${c.instagram ? `<a href="${esc(c.instagram)}" target="_blank" rel="noopener" aria-label="Instagram">${ICON.insta}</a>` : ''}${zap ? `<a href="${zap}" target="_blank" rel="noopener" aria-label="WhatsApp">${ICON.whats}</a>` : ''}</span>` : ''}</div>`;
  }

  const menuCel = $('#menuCel'), btnMenu = $('#btnMenu');
  function menu(abrir) {
    menuCel.hidden = !abrir;
    btnMenu.setAttribute('aria-expanded', abrir);
    btnMenu.innerHTML = abrir ? ICON.fechar : '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 7h16M4 12h16M4 17h10"/></svg>';
    document.body.classList.toggle('travado', abrir);
    atualizarTopo();
  }
  btnMenu.addEventListener('click', () => menu(menuCel.hidden));
  menuCel.addEventListener('click', e => { if (e.target.closest('a')) menu(false); });

  /* cabeçalho some ao rolar para baixo e volta ao rolar para cima */
  let ultimoY = scrollY;
  function esconderTopo() {
    const y = Math.max(0, scrollY);
    const b = document.body;
    let esconder = b.classList.contains('topo-oculto');
    if (y < 120 || !menuCel.hidden || b.classList.contains('travado') || topo.contains(document.activeElement)) { esconder = false; ultimoY = y; }
    else if (y > ultimoY + 8) { esconder = true; ultimoY = y; }
    else if (y < ultimoY - 8) { esconder = false; ultimoY = y; }
    b.classList.toggle('topo-oculto', esconder);
  }
  addEventListener('scroll', () => { atualizarTopo(); esconderTopo(); }, { passive: true });
  topo.addEventListener('focusin', () => document.body.classList.remove('topo-oculto'));

  /* finalizar pedido: pede login antes, se precisar */
  function irParaCheckout() {
    S.user ? (location.hash = 'checkout') : pedirLogin('Entre ou crie sua conta para finalizar o pedido. Seu carrinho continua salvo.', '#checkout');
  }

  /* carrinho do cartão: adiciona 1 unidade sem abrir a janela.
     Se o produto tem tamanho para escolher, abre a janela. */
  function adicionarRapido(id) {
    const p = PNC.produto(id);
    if (!p || !p.disponivel) return;
    if (PNC.tamanhos(p).length) return abrirProduto(id);
    if (p.controla_estoque) {
      const noCarrinho = PNC.carrinho.itens().filter(i => Number(i.produto_id) === p.id).reduce((s, i) => s + i.qtd, 0);
      if (noCarrinho >= Number(p.estoque)) return toast('Só temos ' + Number(p.estoque) + ' de ' + p.nome + ' no momento, e já estão no seu carrinho.');
    }
    PNC.carrinho.adicionar({ produto_id: p.id, qtd: 1 });
    toast(p.nome + ' adicionado ao carrinho.', { href: '#carrinho', txt: 'Ver carrinho' });
  }

  /* ===================================================================
     CLIQUES E FORMULÁRIOS (delegação)
  =================================================================== */
  document.addEventListener('click', async e => {
    const t = e.target.closest('[data-produto],[data-fechar-janela],[data-foto],[data-qtd],[data-remover],[data-finalizar],[data-sair],[data-google],[data-fav],[data-add-rapido],[data-repetir],[data-copiar-link],[data-apagar-end],[data-copiar],[data-rolar],[data-cancelar-pedido]');
    if (!t) return;
    const d = t.dataset;

    if (d.produto) { if (!busca.hidden) fecharBusca(); abrirProduto(d.produto); }
    else if (d.fecharJanela !== undefined) fecharJanela();
    else if (d.foto) { $('#fotoPrincipal').src = d.foto; $$('.miniaturas button').forEach(b => b.classList.toggle('on', b === t)); }
    else if (d.qtd) { const i = PNC.carrinho.itens().find(x => x.k === d.qtd); if (i) PNC.carrinho.quantidade(d.qtd, i.qtd + Number(d.d)); }
    else if (d.remover) PNC.carrinho.remover(d.remover);
    else if (d.finalizar !== undefined) irParaCheckout();
    else if (d.addRapido) adicionarRapido(Number(d.addRapido));
    else if (d.repetir) { t.disabled = true; await repetirPedido(Number(d.repetir)); t.disabled = false; }
    else if (d.copiarLink) { try { await navigator.clipboard.writeText(d.copiarLink); toast('Link copiado. É só colar e enviar.'); } catch (er) { toast(d.copiarLink); } }
    else if (d.sair !== undefined) { await sb.auth.signOut(); toast('Você saiu da conta.'); location.hash = 'inicio'; }
    else if (d.google !== undefined) entrarComGoogle();
    else if (d.fav) {
      if (!S.user) return pedirLogin('Entre na sua conta para salvar seus favoritos.', location.hash);
      if (t.dataset.ocupado) return;
      const id = Number(d.fav);
      const tem = S.favs.has(id);
      t.dataset.ocupado = '1';
      const { error } = tem ? await sb.from('favoritos').delete().eq('produto_id', id) : await sb.from('favoritos').insert({ produto_id: id });
      delete t.dataset.ocupado;
      if (error) return toast(traduzErro(error.message));
      tem ? S.favs.delete(id) : S.favs.add(id);
      /* atualiza todos os corações desse produto (cartão e janela) */
      $$('[data-fav="' + id + '"]').forEach(b => {
        b.classList.toggle('on', !tem);
        b.setAttribute('aria-pressed', !tem);
        if (b.classList.contains('pc-fav')) b.setAttribute('aria-label', (tem ? 'Favoritar' : 'Remover dos favoritos') + ': ' + ((PNC.produto(id) || {}).nome || ''));
      });
      toast(tem ? 'Removido dos favoritos.' : 'Salvo nos favoritos.', tem ? null : { href: '#conta/favoritos', txt: 'Ver favoritos' });
    }
    else if (d.apagarEnd) { if (confirm('Remover este endereço?')) { await sb.from('enderecos').delete().eq('id', d.apagarEnd); render(); } }
    else if (d.copiar) { try { await navigator.clipboard.writeText(d.copiar); toast('Chave PIX copiada.'); } catch (er) { toast(d.copiar); } }
    else if (d.cancelarPedido) {
      if (!confirm('Cancelar este pedido?')) return;
      t.disabled = true;
      const { error } = await sb.rpc('mudar_status_pedido', { p_pedido: Number(d.cancelarPedido), p_status: 'cancelado', p_motivo: '' });
      if (error) { t.disabled = false; return toast(traduzErro(error.message)); }
      toast('Pedido cancelado.');
      render();
    }
    else if (d.rolar) { const tr = t.closest('.secao').querySelector('.trilho'); tr.scrollBy({ left: Number(d.rolar) * tr.clientWidth * 0.8, behavior: 'smooth' }); }
  });

  document.addEventListener('submit', async e => {
    const f = e.target;
    if (f.dataset.auth) { e.preventDefault(); enviarAuth(f.dataset.auth, f); }
    if (f.dataset.form === 'dados') {
      e.preventDefault();
      const { error } = await sb.from('perfis').update({ nome: $('#dNome').value.trim(), telefone: $('#dTel').value.trim() }).eq('id', S.user.id);
      if (error) return toast(traduzErro(error.message));
      await carregarPerfil();
      toast('Dados salvos.');
    }
    if (f.dataset.form === 'endereco') {
      e.preventDefault();
      const en = lerEndereco('n');
      if (!en.rua || !en.numero || !en.bairro) return toast('Preencha rua, número e bairro.');
      const { error } = await sb.from('enderecos').insert(en);
      if (error) return toast(traduzErro(error.message));
      toast('Endereço salvo.');
      render();
    }
  });

  document.addEventListener('change', e => {
    if (e.target.id === 'nBairro' && $('#nBairroOutro')) $('#nBairroOutro').hidden = e.target.value !== '__outro';
  });

  document.addEventListener('keydown', e => {
    if (e.key === 'Escape') { fecharJanela(); if (!busca.hidden) fecharBusca(); if (!menuCel.hidden) menu(false); }
  });

  document.addEventListener('pnc:carrinho', () => {
    atualizarTopo();
    if (rotaAtual().nome === 'carrinho') { const y = scrollY; P.carrinho(); scrollTo(0, y); }
  });

  /* ===================================================================
     ROTAS
  =================================================================== */
  const PRIVADAS = {
    checkout: 'Entre ou crie sua conta para finalizar o pedido. Seu carrinho continua salvo.',
    conta: 'Entre para ver sua conta e seus pedidos.',
    pedido: 'Entre para acompanhar seu pedido.',
    admin: 'Entre com a conta de administrador.',
    cozinha: 'Entre com a conta da cozinha.',
    entregador: 'Entre com a conta de entregador.'
  };

  function rotaAtual() {
    const h = decodeURIComponent(location.hash.replace(/^#\/?/, ''));
    const partes = h.split('/').filter(Boolean);
    const nome = P[partes[0]] ? partes[0] : 'inicio';
    return { nome, params: partes.slice(1) };
  }

  let ultimaRota = '';

  async function render() {
    const r = rotaAtual();

    /* limpa o que a página anterior deixou ligado */
    if (canalPedido) { try { sb.removeChannel(canalPedido); } catch (e) { } canalPedido = null; }
    clearInterval(pollPedido);
    if (PNC.admin && PNC.admin.sair) PNC.admin.sair();
    if (PNC.cozinha && PNC.cozinha.sair) PNC.cozinha.sair();
    if (PNC.entregador && PNC.entregador.sair) PNC.entregador.sair();
    fecharJanela();

    document.body.dataset.rota = r.nome;

    if (PRIVADAS[r.nome]) {
      if (!sb) { app.innerHTML = `<section class="secao"><div class="caixa">${vazio('Em breve', 'Login e pedidos online serão ativados em breve.')}</div></section>`; return fim(r); }
      if (!S.pronto) { app.innerHTML = '<section class="secao"><div class="caixa"><p class="carregando">Carregando...</p></div></section>'; return fim(r); }
      if (!S.user) { pedirLogin(PRIVADAS[r.nome], location.hash); return; }
      if (r.nome === 'cozinha' && !(PNC.ehAdmin() || PNC.papel() === 'cozinha')) {
        app.innerHTML = `<section class="secao"><div class="caixa">${vazio('Acesso restrito', 'Esta área é só para a equipe da cozinha.', '<a class="btn escuro" href="#conta">Minha conta</a>')}</div></section>`;
        return fim(r);
      }
      if (r.nome === 'entregador' && PNC.papel() !== 'entregador') {
        app.innerHTML = `<section class="secao"><div class="caixa">${vazio('Acesso restrito', 'Esta área é só para os entregadores da hamburgueria.', '<a class="btn escuro" href="#conta">Minha conta</a>')}</div></section>`;
        return fim(r);
      }
      if (r.nome === 'admin' && !PNC.ehAdmin()) {
        app.innerHTML = `<section class="secao"><div class="caixa">${vazio('Acesso restrito', 'Esta área é só para administradores da hamburgueria.', '<a class="btn escuro" href="#conta">Minha conta</a>')}</div></section>`;
        return fim(r);
      }
    }
    if ((r.nome === 'entrar' || r.nome === 'criar-conta') && S.user) { irDepoisDoLogin(); return; }

    try {
      await P[r.nome](r.params);
    } catch (er) {
      console.error(er);
      app.innerHTML = `<section class="secao"><div class="caixa">${vazio('Algo deu errado', 'Recarregue a página e tente novamente.')}</div></section>`;
    }
    fim(r);
  }
  PNC.render = render;

  function fim(r) {
    const chave = location.hash;
    if (chave !== ultimaRota && !(r.nome === 'conta' && ultimaRota.indexOf('#conta') === 0 && chave.indexOf('#conta') === 0)) scrollTo(0, 0);
    ultimaRota = chave;
    ligarVideos(app);
    atualizarTopo();
    montarRodape();
    document.title = ({ inicio: 'Pão na Chapa · Hamburgueria', cardapio: 'Cardápio · Pão na Chapa', carrinho: 'Carrinho · Pão na Chapa', checkout: 'Finalizar pedido · Pão na Chapa', conta: 'Minha conta · Pão na Chapa', entrar: 'Entrar · Pão na Chapa', 'criar-conta': 'Criar conta · Pão na Chapa', admin: 'Painel · Pão na Chapa', cozinha: 'Cozinha · Pão na Chapa', entregador: 'Entregador · Pão na Chapa' })[r.nome] || 'Pão na Chapa';
  }

  addEventListener('hashchange', render);

  /* ---------- início ---------- */
  (async function iniciar() {
    await PNC.carregar();
    montarAviso();
    addEventListener('resize', montarAviso);
    render();
  })();
})();
