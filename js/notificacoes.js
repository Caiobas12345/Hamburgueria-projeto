/* =====================================================================
   PÃO NA CHAPA · Notificações (migração 008)
   - Sino no topo: avisos criados pelo banco (só os da própria conta).
     Atualiza na hora (tempo real) e, por garantia, a cada minuto.
   - Celular: "Ativar notificações neste aparelho" inscreve o navegador
     (sw.js). O envio é feito pela Edge Function "enviar-push" no Supabase.
     A chave pública fica em js/config.js (vapidPublica). A privada, nunca aqui.
===================================================================== */
(function () {
  const PNC = window.PNC, sb = PNC.sb, esc = PNC.esc;
  const $ = (s, r = document) => r.querySelector(s);
  const VAPID = ((window.PNC_CONFIG || {}).vapidPublica || '').trim();

  const btn = $('#btnSino'), painel = $('#sinoPainel'), num = $('#sinoNum');
  let usuario = null, canal = null, timer = 0, dados = { nao_lidas: 0, lista: [] }, ok = true, ultimoId = 0;

  const quando = d => {
    const min = Math.floor((Date.now() - new Date(d).getTime()) / 60000);
    if (min < 1) return 'agora';
    if (min < 60) return 'há ' + min + ' min';
    const h = Math.floor(min / 60);
    if (h < 24) return 'há ' + h + ' h';
    return new Date(d).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', timeZone: 'America/Sao_Paulo' });
  };

  /* ---------- som curto (painéis da equipe) ---------- */
  let audio = null;
  function tocar() {
    try {
      audio = audio || new (window.AudioContext || window.webkitAudioContext)();
      [0, 0.18].forEach((t, i) => {
        const o = audio.createOscillator(), g = audio.createGain();
        o.type = 'sine';
        o.frequency.value = i ? 1046 : 784;
        g.gain.setValueAtTime(0.0001, audio.currentTime + t);
        g.gain.exponentialRampToValueAtTime(0.25, audio.currentTime + t + 0.02);
        g.gain.exponentialRampToValueAtTime(0.0001, audio.currentTime + t + 0.16);
        o.connect(g).connect(audio.destination);
        o.start(audio.currentTime + t);
        o.stop(audio.currentTime + t + 0.18);
      });
    } catch (e) { }
  }
  const equipe = () => ['admin', 'cozinha', 'entregador'].includes(PNC.papel());

  /* ---------- carregar e desenhar ---------- */
  async function carregar(avisarNovas) {
    if (!usuario) return;
    const { data, error } = await sb.rpc('minhas_notificacoes', { p_limite: 30 });
    if (error) { ok = false; btn.hidden = true; return; } // migração 008 ainda não rodada
    ok = true;
    btn.hidden = false;
    const novas = (data.lista || []).filter(n => n.id > ultimoId && !n.lida);
    if (avisarNovas && ultimoId && novas.length) {
      const n = novas[0];
      PNC.toast(n.titulo, n.link ? { href: n.link, txt: 'Ver' } : null);
      if (equipe()) tocar();
    }
    ultimoId = Math.max(ultimoId, ...(data.lista || []).map(n => n.id), 0);
    dados = data;
    contador();
    if (!painel.hidden) desenhar();
  }

  function contador() {
    const n = Number(dados.nao_lidas) || 0;
    num.hidden = !n;
    num.textContent = n > 99 ? '99+' : n;
    btn.setAttribute('aria-label', n ? `Notificações: ${n} ${n === 1 ? 'nova' : 'novas'}` : 'Notificações');
  }

  function desenhar() {
    const lista = dados.lista || [];
    painel.innerHTML = `<div class="sino-cab"><h2>Notificações</h2>${Number(dados.nao_lidas) ? '<button type="button" class="btn-texto" data-sino-lidas>Marcar todas como lidas</button>' : ''}</div>
      ${lista.length ? `<ul class="sino-lista">${lista.map(n => `<li><a href="${esc(n.link || '#conta')}" class="${n.lida ? '' : 'nova'}" data-sino-item="${Number(n.id)}">
          <strong>${esc(n.titulo)}</strong>${n.corpo ? `<span>${esc(n.corpo)}</span>` : ''}<small>${quando(n.criada_em)}</small></a></li>`).join('')}</ul>`
        : '<p class="sino-vazio">Nenhuma notificação por enquanto. Os avisos dos seus pedidos aparecem aqui.</p>'}
      <div class="sino-push" id="sinoPush"></div>`;
    desenharPush();
  }

  /* ---------- celular (push) ---------- */
  const ehIOS = () => /iphone|ipad|ipod/i.test(navigator.userAgent) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
  const instalado = () => (window.matchMedia && matchMedia('(display-mode: standalone)').matches) || navigator.standalone === true;
  const temPush = () => 'serviceWorker' in navigator && 'PushManager' in window && 'Notification' in window;

  async function inscricaoAtual() {
    if (!temPush()) return null;
    const reg = await navigator.serviceWorker.getRegistration();
    return reg ? reg.pushManager.getSubscription() : null;
  }

  async function desenharPush() {
    const box = $('#sinoPush');
    if (!box || !VAPID) { if (box) box.remove(); return; }
    if (!temPush()) {
      box.innerHTML = ehIOS() && !instalado()
        ? '<p class="sm">Para receber no iPhone com o site fechado: no Safari, toque em <b>Compartilhar</b> e em <b>Adicionar à Tela de Início</b>. Depois abra o Pão na Chapa pelo ícone e ative aqui.</p>'
        : '<p class="sm">Este navegador não recebe notificações com o site fechado.</p>';
      return;
    }
    if (Notification.permission === 'denied') {
      box.innerHTML = '<p class="sm">As notificações estão bloqueadas neste navegador. Libere nas configurações do site para receber no celular.</p>';
      return;
    }
    let sub = await inscricaoAtual().catch(() => null);
    // o aparelho está inscrito, mas para ESTA conta? (outra pessoa pode ter usado o aparelho)
    if (sub && !mesmaChave(sub)) sub = null; // chave antiga: precisa ativar de novo
    if (sub) {
      const { data } = await sb.from('push_inscricoes').select('id').eq('endpoint', sub.endpoint).maybeSingle();
      if (!data) sub = null;
    }
    if (!$('#sinoPush')) return;
    box.innerHTML = sub
      ? '<p class="sm sino-ok">Este aparelho recebe as notificações.</p><button type="button" class="btn-texto" data-sino-push="desligar">Desativar neste aparelho</button>'
      : '<button type="button" class="btn amarelo largo" data-sino-push="ligar">Ativar notificações neste aparelho</button><p class="sm">Avisa mesmo com o site fechado.</p>';
  }

  function chaveBytes(b64) {
    const pad = '='.repeat((4 - b64.length % 4) % 4);
    const bin = atob((b64 + pad).replace(/-/g, '+').replace(/_/g, '/'));
    return Uint8Array.from(bin, c => c.charCodeAt(0));
  }

  function mesmaChave(sub) {
    try {
      const k = sub.options && sub.options.applicationServerKey;
      if (!k) return true; // navegador não informa: mantém
      const a = new Uint8Array(k), b = chaveBytes(VAPID);
      return a.length === b.length && a.every((x, i) => x === b[i]);
    } catch (e) { return true; }
  }

  async function ligarPush(botao) {
    botao.disabled = true;
    try {
      const reg = await navigator.serviceWorker.register('sw.js');
      const perm = await Notification.requestPermission();
      if (perm !== 'granted') { PNC.toast('Sem permissão, o aparelho não recebe notificações.'); return desenharPush(); }
      await navigator.serviceWorker.ready;
      let sub = await reg.pushManager.getSubscription();
      // inscrição feita com outra chave (ex.: chave trocada): descarta e cria de novo
      if (sub && !mesmaChave(sub)) { await sub.unsubscribe().catch(() => { }); sub = null; }
      if (!sub) sub = await reg.pushManager.subscribe({ userVisibleOnly: true, applicationServerKey: chaveBytes(VAPID) });
      const j = sub.toJSON();
      const aparelho = (navigator.userAgentData && navigator.userAgentData.platform) || (ehIOS() ? 'iPhone' : /android/i.test(navigator.userAgent) ? 'Android' : 'Computador');
      const { error } = await sb.rpc('salvar_inscricao_push', { p_endpoint: j.endpoint, p_p256dh: j.keys.p256dh, p_auth: j.keys.auth, p_aparelho: aparelho });
      if (error) throw error;
      PNC.toast('Pronto! Este aparelho vai receber as notificações.');
    } catch (e) {
      PNC.toast('Não foi possível ativar as notificações neste aparelho.');
    }
    desenharPush();
  }

  async function desligarPush(botao) {
    if (botao) botao.disabled = true;
    try {
      const sub = await inscricaoAtual();
      if (sub) {
        await sb.rpc('remover_inscricao_push', { p_endpoint: sub.endpoint });
        await sub.unsubscribe();
      }
    } catch (e) { }
    desenharPush();
  }

  /* ---------- abrir/fechar ---------- */
  function abrir(sim) {
    painel.hidden = !sim;
    btn.setAttribute('aria-expanded', sim);
    if (sim) { desenhar(); carregar(false); }
  }
  btn.addEventListener('click', e => { e.stopPropagation(); abrir(painel.hidden); });
  document.addEventListener('click', e => { if (!painel.hidden && !painel.contains(e.target) && e.target !== btn) abrir(false); });
  document.addEventListener('keydown', e => { if (e.key === 'Escape' && !painel.hidden) { abrir(false); btn.focus(); } });

  painel.addEventListener('click', async e => {
    const lidas = e.target.closest('[data-sino-lidas]');
    if (lidas) {
      await sb.rpc('marcar_notificacoes_lidas', { p_ids: null });
      return carregar(false);
    }
    const item = e.target.closest('[data-sino-item]');
    if (item) {
      sb.rpc('marcar_notificacoes_lidas', { p_ids: [Number(item.dataset.sinoItem)] }).then(() => carregar(false));
      abrir(false);
      return; // o link segue normalmente
    }
    const p = e.target.closest('[data-sino-push]');
    if (p) p.dataset.sinoPush === 'ligar' ? ligarPush(p) : desligarPush(p);
  });

  /* ---------- sessão ---------- */
  function parar() {
    clearInterval(timer);
    timer = 0;
    if (canal) { try { sb.removeChannel(canal); } catch (e) { } canal = null; }
  }

  PNC.notif = {
    sessao(user) {
      const id = user ? user.id : null;
      if (usuario && usuario.id === id) return;
      parar();
      usuario = user || null;
      ultimoId = 0;
      dados = { nao_lidas: 0, lista: [] };
      abrir(false);
      if (!usuario) { btn.hidden = true; return; }
      carregar(false);
      timer = setInterval(() => carregar(true), 60000);
      canal = PNC.canal('notif-' + usuario.id, c => c
        .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'notificacoes', filter: 'usuario_id=eq.' + usuario.id }, () => carregar(true)));
    },
    /* ao sair da conta: este aparelho para de receber os avisos dela */
    async antesDeSair() {
      if (!ok || !VAPID) return;
      try {
        const sub = await inscricaoAtual();
        if (sub) { await sb.rpc('remover_inscricao_push', { p_endpoint: sub.endpoint }); await sub.unsubscribe(); }
      } catch (e) { }
    }
  };
  if (!sb) PNC.notif = { sessao() { }, async antesDeSair() { } };
})();
