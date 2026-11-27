/* =====================================================================
   PÃO NA CHAPA · Painel da cozinha (#cozinha)
   Para quem tem o perfil "cozinha" (e para o admin).
   Os pedidos vêm da função cozinha_pedidos do banco, que só entrega o
   necessário para preparar: número, hora, itens, adicionais, ingredientes
   retirados e observações (sem telefone, endereço ou valores).
   Cada botão chama mudar_status_pedido, que confere a permissão no banco.
===================================================================== */
(function () {
  const PNC = window.PNC, sb = PNC.sb, esc = PNC.esc;
  const $ = (s, r = document) => r.querySelector(s);

  const ATUALIZA_MS = 10000;      // atualiza sozinho a cada 10 segundos
  const ATRASO_MIN = 25;          // destaca pedidos parados há mais de 25 minutos
  let timer = 0, relogio = 0;
  let conhecidos = null;          // pedidos já vistos na coluna "Novos" (para tocar o aviso só nos novos)
  let somAtivo = false;
  let audio = null;

  const COLUNAS = [
    { id: 'novos', titulo: 'Novos', status: ['confirmado', 'pagamento_aprovado'], vazio: 'Nenhum pedido novo.' },
    { id: 'preparo', titulo: 'Em preparação', status: ['em_preparo'], vazio: 'Nada no fogo agora.' },
    { id: 'prontos', titulo: 'Prontos', status: ['pronto', 'aguardando_entregador'], vazio: 'Nenhum pedido esperando.' }
  ];

  const hora = d => new Date(d).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit', timeZone: 'America/Sao_Paulo' });
  const minutosDesde = d => Math.max(0, Math.floor((Date.now() - new Date(d).getTime()) / 60000));

  function acao(p) {
    if (p.status === 'confirmado' || p.status === 'pagamento_aprovado') return ['em_preparo', 'Iniciar preparo'];
    if (p.status === 'em_preparo') return ['pronto', 'Pedido pronto'];
    if (p.status === 'pronto' && p.tipo === 'retirada') return ['entregue', 'Cliente retirou'];
    return null;
  }

  function situacao(p) {
    if (p.status === 'aguardando_entregador') return p.entregador ? esc(p.entregador) + ' vem buscar' : 'Aguardando entregador';
    if (p.status === 'pronto' && p.tipo === 'retirada') return 'Aguardando o cliente no balcão';
    return '';
  }

  function cartao(p) {
    const min = minutosDesde(p.criado_em);
    const atrasado = min >= ATRASO_MIN && p.status !== 'aguardando_entregador';
    const a = acao(p);
    const sit = situacao(p);
    return `<article class="coz-card ${esc(p.tipo)}${atrasado ? ' atrasado' : ''}">
      <header><strong>#${esc(p.codigo)}</strong><span class="coz-tipo">${p.tipo === 'entrega' ? 'Entrega' : 'Retirada'}</span></header>
      <p class="coz-meta">${esc(p.cliente || '')}${p.cliente ? ' · ' : ''}pedido às ${hora(p.criado_em)} · <span class="coz-tempo">${min < 1 ? 'agora' : 'há ' + min + ' min'}</span></p>
      <ul class="coz-itens">${(p.itens || []).map(i => `<li>
        <span class="coz-qtd">${Number(i.quantidade)}×</span>
        <div><b>${esc(i.nome)}${i.tamanho ? ` <em>(${esc(i.tamanho)})</em>` : ''}</b>
          ${(i.adicionais || []).map(x => `<span class="coz-add">+ ${esc(x)}</span>`).join('')}
          ${(i.removidos || []).map(x => `<span class="coz-rem">Sem ${esc(x)}</span>`).join('')}
          ${i.observacao ? `<span class="coz-obs">${esc(i.observacao)}</span>` : ''}</div></li>`).join('')}</ul>
      ${p.observacoes ? `<p class="coz-obs-ped"><b>Obs. do pedido:</b> ${esc(p.observacoes)}</p>` : ''}
      ${sit ? `<p class="coz-sit">${sit}</p>` : ''}
      ${a ? `<button type="button" class="btn ${a[0] === 'em_preparo' ? 'amarelo' : 'escuro'} largo" data-coz-status="${a[0]}" data-coz-id="${Number(p.id)}">${a[1]}</button>` : ''}
    </article>`;
  }

  function desenhar(lista) {
    const cols = $('#cozCols');
    if (!cols) return;
    cols.innerHTML = COLUNAS.map(c => {
      const itens = lista.filter(p => c.status.includes(p.status));
      return `<section class="coz-col" aria-labelledby="coz-${c.id}">
        <h2 id="coz-${c.id}">${c.titulo} <i>${itens.length}</i></h2>
        <div class="coz-lista">${itens.length ? itens.map(cartao).join('') : `<p class="coz-vazio">${c.vazio}</p>`}</div>
      </section>`;
    }).join('');
  }

  async function carregar() {
    const aviso = $('#cozAviso');
    const { data, error } = await sb.rpc('cozinha_pedidos');
    if (!$('#cozCols')) return;
    if (error) { aviso.textContent = PNC.traduzErro(error.message); aviso.hidden = false; return; }
    aviso.hidden = true;
    const lista = Array.isArray(data) ? data : [];

    const novos = lista.filter(p => p.status === 'confirmado' || p.status === 'pagamento_aprovado').map(p => p.id);
    if (conhecidos) {
      const chegaram = novos.filter(id => !conhecidos.has(id));
      if (chegaram.length) { bip(); PNC.toast(chegaram.length > 1 ? chegaram.length + ' pedidos novos na cozinha.' : 'Pedido novo na cozinha.'); }
    }
    conhecidos = new Set(novos);

    desenhar(lista);
    const at = $('#cozAtualizado');
    if (at) at.textContent = 'Atualizado às ' + new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
  }

  /* aviso sonoro: o navegador só deixa tocar som depois de um clique na página */
  function bip() {
    if (!somAtivo || !audio) return;
    try {
      [0, 0.2, 0.4].forEach(t0 => {
        const o = audio.createOscillator(), g = audio.createGain();
        o.frequency.value = 880; o.connect(g); g.connect(audio.destination);
        g.gain.setValueAtTime(0.0001, audio.currentTime + t0);
        g.gain.exponentialRampToValueAtTime(0.3, audio.currentTime + t0 + 0.02);
        g.gain.exponentialRampToValueAtTime(0.0001, audio.currentTime + t0 + 0.16);
        o.start(audio.currentTime + t0); o.stop(audio.currentTime + t0 + 0.17);
      });
    } catch (e) { }
  }

  function alternarSom(btn) {
    somAtivo = !somAtivo;
    if (somAtivo) {
      try { audio = audio || new (window.AudioContext || window.webkitAudioContext)(); audio.resume(); } catch (e) { }
      bip();
    }
    btn.setAttribute('aria-pressed', somAtivo);
    btn.textContent = somAtivo ? 'Som ligado' : 'Ligar som de aviso';
    try { localStorage.setItem('pnc_coz_som', somAtivo ? '1' : ''); } catch (e) { }
  }

  function render(app) {
    sair();
    conhecidos = null;
    app.innerHTML = `<section class="coz">
      <div class="coz-cab">
        <div><p class="sobre">Cozinha</p><h1>Pedidos</h1></div>
        <div class="coz-ferramentas">
          <span class="coz-relogio" id="cozRelogio"></span>
          <button type="button" class="btn linha pequeno" id="cozSom" aria-pressed="false">Ligar som de aviso</button>
          ${PNC.ehAdmin() ? '<a class="btn-texto" href="#admin/pedidos">Voltar ao painel</a>' : ''}
        </div>
      </div>
      <p class="msg erro" id="cozAviso" hidden></p>
      <div class="coz-colunas" id="cozCols"><p class="carregando">Carregando...</p></div>
      <p class="sm coz-rodape"><span id="cozAtualizado"></span> · atualiza sozinho a cada 10 segundos</p>
    </section>`;

    const btnSom = $('#cozSom');
    btnSom.addEventListener('click', () => alternarSom(btnSom));
    let lembrado = false;
    try { lembrado = localStorage.getItem('pnc_coz_som') === '1'; } catch (e) { }
    if (lembrado) btnSom.textContent = 'Ligar som de aviso (toque para reativar)';

    app.onclick = async e => {
      const b = e.target.closest('[data-coz-status]');
      if (!b) return;
      b.disabled = true;
      const { error } = await sb.rpc('mudar_status_pedido', { p_pedido: Number(b.dataset.cozId), p_status: b.dataset.cozStatus, p_motivo: '' });
      if (error) { b.disabled = false; PNC.toast(PNC.traduzErro(error.message)); return; }
      carregar();
    };

    const tick = () => { const r = $('#cozRelogio'); if (r) r.textContent = new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit', timeZone: 'America/Sao_Paulo' }); };
    tick();
    relogio = setInterval(tick, 15000);
    carregar();
    timer = setInterval(carregar, ATUALIZA_MS);
  }

  function sair() {
    clearInterval(timer); clearInterval(relogio);
    timer = relogio = 0;
    const app = $('#app');
    if (app && app.onclick) app.onclick = null;
  }

  PNC.cozinha = sb
    ? { render, sair }
    : { render: el => { el.innerHTML = '<section class="secao"><div class="caixa"><p>Ligue o Supabase em js/config.js para usar a cozinha.</p></div></section>'; }, sair() { } };
})();
