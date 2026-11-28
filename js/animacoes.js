/* =====================================================================
   PÃO NA CHAPA · Animações
   Só visual: não muda pedido, carrinho, login nem banco.
   - Entrada da página e dos itens conforme a rolagem
   - Bolinha "voando" até a sacola ao adicionar
   - Item saindo do carrinho, contador pulando
   - Profundidade (parallax) do banner no computador
   Com "reduzir movimento" ligado no aparelho, nada disto roda.
===================================================================== */
(function () {
  const PNC = window.PNC || (window.PNC = {});
  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => Array.from(r.querySelectorAll(s));
  const mm = window.matchMedia ? matchMedia('(prefers-reduced-motion: reduce)') : { matches: false };
  const calmo = () => mm.matches;
  const app = $('#app');

  /* reinicia uma animação de classe (ex.: pular) */
  function bater(el, classe) {
    if (!el || calmo()) return;
    el.classList.remove(classe);
    void el.offsetWidth;
    el.classList.add(classe);
    el.addEventListener('animationend', () => el.classList.remove(classe), { once: true });
  }

  /* ---------- itens aparecendo durante a rolagem ---------- */
  // páginas da equipe ficam sem cascata (prioridade é velocidade)
  const EQUIPE = ['admin', 'cozinha', 'entregador'];
  const ALVOS = '.sec-cab, .pc, .cat, .exp, .depo, .item, .lp-item, .lista-pedidos > .linha-pedido, .pontos-saldo, .ind-codigo, .ind-numeros > div, .fid-resumo > div';
  const io = 'IntersectionObserver' in window ? new IntersectionObserver(entradas => {
    let ordem = 0;
    entradas.forEach(en => {
      if (!en.isIntersecting) return;
      const el = en.target;
      io.unobserve(el);
      el.style.setProperty('--rv-atraso', Math.min(ordem++ * 70, 420) + 'ms');
      el.classList.add('rv-on');
      // terminou de aparecer: volta ao estilo normal (hover etc.)
      setTimeout(() => { el.classList.remove('rv', 'rv-on'); el.style.removeProperty('--rv-atraso'); }, 1100);
    });
  }, { rootMargin: '0px 0px -8% 0px', threshold: 0.08 }) : null;

  function revelar(raiz) {
    if (!io || calmo() || !raiz) return;
    $$(ALVOS, raiz).forEach(el => {
      if (el.classList.contains('rv')) return;
      el.classList.add('rv');
      io.observe(el);
    });
  }

  /* ---------- página nova ---------- */
  let paginaAtual = '', janelaAte = 0;
  document.addEventListener('pnc:pagina', e => {
    paginaAtual = (e.detail && e.detail.nome) || '';
    janelaAte = Date.now() + 2500;
    if (calmo() || !app) return;
    bater(app, 'pagina-entra');
    if (!EQUIPE.includes(paginaAtual)) revelar(app);
    parallax();
  });
  // conteúdo que chega logo depois de abrir a página (cardápio carregando etc.).
  // Atualizações depois disso (ex.: mudar quantidade no carrinho) não animam de novo.
  if (app && 'MutationObserver' in window) {
    let pendente = 0;
    new MutationObserver(() => {
      if (pendente || Date.now() > janelaAte || EQUIPE.includes(paginaAtual) || calmo()) return;
      pendente = requestAnimationFrame(() => { pendente = 0; revelar(app); });
    }).observe(app, { childList: true, subtree: true });
  }

  /* ---------- adicionar ao carrinho: bolinha voando até a sacola ---------- */
  function alvoSacola() {
    return [$('.barra [data-nav="carrinho"]'), $('.ic-sacola')]
      .find(el => el && el.getClientRects().length && getComputedStyle(el).display !== 'none' && el.getBoundingClientRect().width > 0);
  }
  document.addEventListener('pnc:adicionado', e => {
    const origem = e.detail && e.detail.el;
    if (origem && origem.classList) bater(origem, 'pop');
    if (calmo()) return;
    const alvo = alvoSacola();
    if (!origem || !alvo || !origem.getBoundingClientRect || !document.body.animate) return;
    const a = origem.getBoundingClientRect(), b = alvo.getBoundingClientRect();
    const x0 = a.left + a.width / 2, y0 = a.top + a.height / 2;
    const x1 = b.left + b.width / 2, y1 = b.top + b.height / 2;
    const bola = document.createElement('span');
    bola.className = 'voo';
    bola.setAttribute('aria-hidden', 'true');
    document.body.appendChild(bola);
    const meioX = (x0 + x1) / 2, meioY = Math.min(y0, y1) - 90;
    bola.animate([
      { transform: `translate(${x0}px, ${y0}px) scale(1)`, opacity: 1 },
      { transform: `translate(${meioX}px, ${meioY}px) scale(.9)`, opacity: 1, offset: .5 },
      { transform: `translate(${x1}px, ${y1}px) scale(.35)`, opacity: .6 }
    ], { duration: 650, easing: 'cubic-bezier(.45,.05,.35,1)' }).onfinish = () => {
      bola.remove();
      bater(alvo, 'pula');
    };
  });

  /* ---------- contador da sacola e quantidade ---------- */
  let ultimoTotal = null, ultimaQtd = '';
  document.addEventListener('click', e => {
    const q = e.target.closest && e.target.closest('[data-qtd]');
    if (q) ultimaQtd = q.dataset.qtd;
  }, true);
  document.addEventListener('pnc:carrinho', () => {
    // espera a página redesenhar
    setTimeout(() => {
      const n = PNC.carrinho ? PNC.carrinho.contar() : 0;
      if (ultimoTotal != null && n !== ultimoTotal) $$('[data-badge]').forEach(b => bater(b, 'pula'));
      ultimoTotal = n;
      if (ultimaQtd) {
        const bt = $(`[data-qtd="${ultimaQtd}"]`);
        if (bt && bt.parentElement) bater(bt.parentElement.querySelector('span'), 'muda');
        ultimaQtd = '';
      }
      $$('.resumo .r-linha.total b').forEach(t => bater(t, 'muda'));
    }, 0);
  });
  setTimeout(() => { ultimoTotal = PNC.carrinho ? PNC.carrinho.contar() : 0; }, 0);

  /* ---------- item saindo da lista (carrinho) ---------- */
  function sair(el, depois) {
    if (!el || calmo()) return depois();
    let feito = false;
    const fim = () => { if (!feito) { feito = true; depois(); } };
    el.style.height = el.offsetHeight + 'px';
    el.classList.add('saindo');
    requestAnimationFrame(() => requestAnimationFrame(() => { el.style.height = '0px'; }));
    el.addEventListener('transitionend', ev => { if (ev.propertyName === 'height') fim(); });
    setTimeout(fim, 420); // garantia
  }

  /* ---------- banner: profundidade ao rolar (só computador) ---------- */
  const grande = window.matchMedia ? matchMedia('(min-width: 900px) and (pointer: fine)') : { matches: false };
  let rodando = false;
  function parallax() {
    const midia = $('.hero-midia');
    if (!midia || calmo() || !grande.matches) { if (midia) midia.style.removeProperty('--hero-y'); return; }
    if (rodando) return;
    rodando = true;
    requestAnimationFrame(() => {
      rodando = false;
      const h = midia.offsetHeight || innerHeight;
      const y = Math.min(scrollY, h);
      midia.style.setProperty('--hero-y', (y * 0.22).toFixed(1) + 'px');
    });
  }
  addEventListener('scroll', parallax, { passive: true });

  PNC.anim = { revelar, sair, bater };

  // primeira página do site (o app já desenhou antes deste arquivo carregar)
  janelaAte = Date.now() + 2500;
  paginaAtual = (location.hash.replace('#', '').split('/')[0]) || 'inicio';
  if (!EQUIPE.includes(paginaAtual)) revelar(app);
  parallax();
})();
