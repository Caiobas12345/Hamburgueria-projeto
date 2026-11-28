/* =====================================================================
   PÃO NA CHAPA · Painel do entregador (#entregador) e perfil público
   - Entregas: pega os pedidos prontos (o primeiro que pegar fica com ele),
     marca a saída e confirma com o código de 4 números que o cliente informa.
   - Meu perfil: foto, "sobre mim" e veículo (ele mesmo edita); cursos só o
     administrador cadastra.
   Tudo passa por funções do banco que conferem o perfil de quem chama.
   Endereço, nome e telefone do cliente só aparecem nas entregas que estão
   com o entregador, e só enquanto a entrega está em andamento.
===================================================================== */
(function () {
  const PNC = window.PNC, sb = PNC.sb, esc = PNC.esc;
  const $ = (s, r = document) => r.querySelector(s);
  const brl = v => Number(v || 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });

  const ATUALIZA_MS = 15000;
  const VEICULOS = { moto: 'Moto', bicicleta: 'Bicicleta', carro: 'Carro' };
  const PAGTO = { pix: 'PIX', dinheiro: 'Dinheiro', cartao: 'Cartão' };

  let timer = 0;
  let aba = 'entregas';
  let dados = null;
  let assinatura = {};
  let leitor = null;

  /* ---------- localização para o cliente (migração 008) ----------
     Só nas entregas "a caminho", só com o painel aberto, e o banco apaga
     quando a entrega termina. */
  const LOCAL_MS = 15000;
  let local = { estado: 'parado', watch: null, ultimo: 0, pos: null };
  const aCaminho = () => ((dados && dados.minhas) || []).filter(p => p.status === 'saiu_entrega');
  function enviarLocal(forcar) {
    if (!local.pos || !aCaminho().length || (!forcar && Date.now() - local.ultimo < LOCAL_MS)) return;
    local.ultimo = Date.now();
    const c = local.pos.coords;
    aCaminho().forEach(p => sb.rpc('entregador_enviar_local', { p_pedido: Number(p.id), p_lat: c.latitude, p_lng: c.longitude, p_precisao: Math.round(c.accuracy || 0) }).then(() => { }, () => { }));
  }
  function mudarLocal(estado) {
    if (local.estado === estado) return;
    local.estado = estado;
    assinatura.entMinhas = null; // redesenha o aviso no cartão
    if ($('#entMinhas')) desenharEntregas();
  }
  function ligarLocal() {
    if (!navigator.geolocation) return mudarLocal('indisponivel');
    if (local.watch != null) return;
    local.watch = navigator.geolocation.watchPosition(pos => {
      const primeira = !local.pos;
      local.pos = pos;
      mudarLocal('ativo');
      enviarLocal(primeira);
    }, err => {
      pararWatch();
      mudarLocal(err && err.code === 1 ? 'negado' : 'erro');
    }, { enableHighAccuracy: true, maximumAge: 10000, timeout: 30000 });
  }
  function pararWatch() {
    if (local.watch != null && navigator.geolocation) navigator.geolocation.clearWatch(local.watch);
    local.watch = null;
    local.pos = null;
  }
  function desligarLocal() {
    aCaminho().forEach(p => sb.rpc('entregador_parar_local', { p_pedido: Number(p.id) }).then(() => { }, () => { }));
    pararWatch();
    mudarLocal('parado');
  }
  /* depois de cada atualização: liga sozinho se a permissão já foi dada; desliga sem entregas a caminho */
  async function conferirLocal() {
    if (!aCaminho().length) { if (local.watch != null) { pararWatch(); local.estado = 'parado'; } return; }
    if (local.watch != null || local.estado === 'parado_pelo_entregador') return;
    try {
      const st = navigator.permissions && await navigator.permissions.query({ name: 'geolocation' });
      if (st && st.state === 'granted') ligarLocal();
    } catch (e) { }
  }
  function avisoLocal() {
    if (local.estado === 'ativo') return `<div class="ent-local on"><span><i></i> O cliente está vendo onde você está.</span><button type="button" class="btn-texto" data-ent-local="parar">Parar</button></div>`;
    if (local.estado === 'negado') return '<p class="ent-local">A localização está bloqueada neste celular. Libere nas configurações do navegador para o cliente acompanhar a entrega.</p>';
    if (local.estado === 'indisponivel') return '<p class="ent-local">Este navegador não compartilha localização.</p>';
    return `<div class="ent-local"><span>${local.estado === 'erro' ? 'Não foi possível pegar a localização agora.' : 'O cliente pode acompanhar a entrega no mapa.'}</span><button type="button" class="btn linha pequeno" data-ent-local="ligar">Compartilhar localização</button></div>`;
  }

  const minutosDesde = d => { const t = new Date(d).getTime(); return isNaN(t) ? null : Math.max(0, Math.floor((Date.now() - t) / 60000)); };
  const hora = d => new Date(d).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit', timeZone: 'America/Sao_Paulo' });
  const mesAno = d => new Date(d).toLocaleDateString('pt-BR', { month: 'short', year: 'numeric', timeZone: 'America/Sao_Paulo' }).replace('.', '');
  const iniciais = n => (n || '?').trim().split(/\s+/).slice(0, 2).map(p => p[0]).join('').toUpperCase();

  /* ===================================================================
     CARTÃO PÚBLICO DO ENTREGADOR (cliente, prévia do perfil e admin)
  =================================================================== */
  function foto(e, classe) {
    return e.foto_url
      ? `<img class="${classe}" src="${esc(e.foto_url)}" alt="Foto de ${esc(e.nome)}" loading="lazy">`
      : `<span class="${classe} sem-foto" aria-hidden="true">${esc(iniciais(e.nome))}</span>`;
  }

  function linhaVeiculo(e) {
    if (!e.veiculo_tipo) return '';
    return [VEICULOS[e.veiculo_tipo] || e.veiculo_tipo, e.veiculo_cor, e.veiculo_placa].filter(Boolean).map(esc).join(' · ');
  }

  function listaCursos(cursos, vazio) {
    if (!cursos || !cursos.length) return vazio ? `<p class="sm">${vazio}</p>` : '';
    return `<ul class="ent-cursos">${cursos.map(c => `<li><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 12.5l5 5L20 6.5"/></svg><div><b>${esc(c.nome)}</b>${c.instituicao || c.concluido_em ? `<small>${[c.instituicao, c.concluido_em ? 'concluído em ' + new Date(c.concluido_em + 'T12:00:00').toLocaleDateString('pt-BR', { month: 'short', year: 'numeric' }).replace('.', '') : ''].filter(Boolean).map(esc).join(' · ')}</small>` : ''}</div></li>`).join('')}</ul>`;
  }

  PNC.cartaoEntregador = function (e, titulo) {
    const veic = linhaVeiculo(e);
    const n = Number(e.entregas || 0);
    return `<section class="ent-publico" aria-label="${esc(titulo || 'Seu entregador')}">
      <p class="sobre">${esc(titulo || 'Seu entregador')}</p>
      <div class="ent-pub-topo">
        ${foto(e, 'ent-pub-foto')}
        <div><h3>${esc(e.nome)}</h3>${veic ? `<p class="ent-veic">${veic}</p>` : ''}</div>
      </div>
      <dl class="ent-numeros">
        <div><dt>Entregas</dt><dd>${n}</dd></div>
        ${e.desde ? `<div><dt>Na equipe desde</dt><dd>${esc(mesAno(e.desde))}</dd></div>` : ''}
        <div><dt>Cursos</dt><dd>${(e.cursos || []).length}</dd></div>
        ${Number(e.avaliacoes) > 0 ? `<div><dt>Nota</dt><dd>★ ${PNC.fmtNota ? PNC.fmtNota(e.nota_media) : esc(String(e.nota_media))}</dd></div>` : ''}
      </dl>
      ${e.sobre ? `<p class="ent-sobre">${esc(e.sobre)}</p>` : ''}
      ${(e.cursos || []).length ? `<h4>Cursos</h4>${listaCursos(e.cursos)}` : ''}
    </section>`;
  };

  /* ===================================================================
     ESTRUTURA
  =================================================================== */
  function render(app, params) {
    sair();
    aba = params && params[0] === 'perfil' ? 'perfil' : 'entregas';
    assinatura = {};
    app.innerHTML = `<section class="ent">
      <div class="ent-cab">
        <div><p class="sobre">Entregador</p><h1 id="entOla">Entregas</h1></div>
        <nav class="ent-abas" aria-label="Seções do entregador">
          <a href="#entregador" class="${aba === 'entregas' ? 'on' : ''}" ${aba === 'entregas' ? 'aria-current="page"' : ''}>Entregas</a>
          <a href="#entregador/perfil" class="${aba === 'perfil' ? 'on' : ''}" ${aba === 'perfil' ? 'aria-current="page"' : ''}>Meu perfil</a>
        </nav>
      </div>
      <p class="msg erro" id="entAviso" hidden></p>
      <div id="entCorpo"><p class="carregando">Carregando...</p></div>
    </section>`;

    app.onclick = clique;
    app.onsubmit = enviar;
    app.onchange = mudou;
    app.oninput = digitou;

    carregar();
    if (aba === 'entregas') timer = setInterval(carregar, ATUALIZA_MS);
  }

  function sair() {
    clearInterval(timer);
    timer = 0;
    pararWatch();
    local.estado = 'parado';
    fecharLeitor();
    const app = $('#app');
    if (app) { app.onclick = app.onsubmit = app.onchange = app.oninput = null; }
  }

  async function carregar() {
    const { data, error } = await sb.rpc('entregador_painel');
    if (!$('#entCorpo')) return;
    const aviso = $('#entAviso');
    if (error) { aviso.textContent = PNC.traduzErro(error.message); aviso.hidden = false; if (!dados) $('#entCorpo').innerHTML = ''; return; }
    aviso.hidden = true;
    dados = data || { perfil: {}, disponiveis: [], minhas: [], hoje: [] };
    const nome = (dados.perfil.nome || '').split(' ')[0];
    $('#entOla').textContent = aba === 'perfil' ? 'Meu perfil' : nome ? 'Olá, ' + nome : 'Entregas';
    if (aba === 'perfil') desenharPerfil(); else desenharEntregas();
    conferirLocal();
    enviarLocal(false);
  }

  /* ===================================================================
     ENTREGAS
  =================================================================== */
  function textoEndereco(e) {
    if (!e) return '';
    return [[e.rua, e.numero].filter(Boolean).join(', '), e.complemento, e.bairro].filter(Boolean).join(' · ');
  }

  function cobranca(p) {
    if (p.pagamento === 'pix') return '<span class="ent-pago">Já pago no PIX: não cobrar</span>';
    if (p.pagamento === 'dinheiro') return `<span class="ent-cobrar">Cobrar ${brl(p.total)} em dinheiro${p.troco_para ? ` · levar troco para ${brl(p.troco_para)}` : ''}</span>`;
    return `<span class="ent-cobrar">Cobrar ${brl(p.total)} no cartão</span>`;
  }

  function cartaoMinha(p) {
    const end = p.endereco || {};
    const mapa = 'https://www.google.com/maps/search/?api=1&query=' + encodeURIComponent([[end.rua, end.numero].filter(Boolean).join(', '), end.bairro].filter(Boolean).join(', '));
    const tel = String(p.telefone || '').replace(/\D/g, '');
    const saiu = p.status === 'saiu_entrega';
    return `<article class="ent-card minha" data-ped="${Number(p.id)}">
      <header><strong>#${esc(p.codigo)}</strong><span class="st ${saiu ? 'andamento' : ''}">${saiu ? 'A caminho' : 'Retirar na loja'}</span></header>
      <div class="ent-cliente"><b>${esc(p.cliente)}</b>
        <p>${esc(textoEndereco(end))}</p>
        ${end.referencia ? `<p class="sm">Referência: ${esc(end.referencia)}</p>` : ''}
      </div>
      <div class="ent-links">
        <a class="btn linha pequeno" href="${mapa}" target="_blank" rel="noopener">Abrir no mapa</a>
        ${tel ? `<a class="btn linha pequeno" href="tel:${esc(tel)}">Ligar para ${esc(p.cliente)}</a>` : ''}
      </div>
      <p class="ent-pagto">${cobranca(p)}</p>
      ${Number(p.gorjeta) > 0 ? `<p class="ent-gorjeta">Gorjeta para você: <b>${brl(p.gorjeta)}</b>${p.pagamento === 'pix' ? ' (já paga no PIX)' : ' (já está no valor a cobrar)'}</p>` : ''}
      <ul class="ent-itens">${(p.itens || []).map(i => `<li><b>${Number(i.quantidade)}×</b> ${esc(i.nome)}${i.tamanho ? ' (' + esc(i.tamanho) + ')' : ''}</li>`).join('')}</ul>
      ${p.observacoes ? `<p class="coz-obs-ped"><b>Obs.:</b> ${esc(p.observacoes)}</p>` : ''}
      ${!saiu ? `<div class="ent-acoes"><button type="button" class="btn amarelo largo" data-ent-sair="${Number(p.id)}">Saí para entrega</button>
          <button type="button" class="btn-texto" data-ent-devolver="${Number(p.id)}">Devolver entrega</button></div>`
        : p.bloqueado ? avisoLocal() + '<p class="msg erro">Muitos códigos errados. Peça para a loja confirmar esta entrega.</p>'
          : avisoLocal() + `<form class="ent-codigo" data-ent-confirmar="${Number(p.id)}" data-codigo="${esc(p.codigo)}">
            <label for="cod${Number(p.id)}">Código de entrega <small>Peça ao cliente os 4 números que aparecem no pedido dele.</small></label>
            <div class="ent-codigo-linha">
              <input class="campo" id="cod${Number(p.id)}" name="codigo" inputmode="numeric" autocomplete="one-time-code" maxlength="4" pattern="[0-9]{4}" placeholder="0000" required>
              <button class="btn escuro" type="submit">Confirmar entrega</button>
            </div>
            ${podeLerQr() ? `<button type="button" class="btn linha ent-ler-qr" data-ent-ler="${Number(p.id)}">${ICONE_QR} Ler QR code do cliente</button>` : ''}
            <p class="msg erro" hidden></p>
          </form>`}
    </article>`;
  }

  function cartaoDisponivel(p) {
    const min = minutosDesde(p.pronto_em);
    return `<article class="ent-card">
      <header><strong>#${esc(p.codigo)}</strong><span class="ent-bairro">${esc(p.bairro || 'Bairro não informado')}</span></header>
      <p class="ent-meta">${Number(p.itens)} ${Number(p.itens) === 1 ? 'item' : 'itens'} · ${PAGTO[p.pagamento] || esc(p.pagamento)}${min == null ? '' : ' · pronto ' + (min < 1 ? 'agora' : 'há ' + min + ' min')}</p>
      ${Number(p.gorjeta) > 0 ? `<p class="ent-gorjeta">Com gorjeta de <b>${brl(p.gorjeta)}</b></p>` : ''}
      <button type="button" class="btn amarelo largo" data-ent-pegar="${Number(p.id)}">Pegar entrega</button>
    </article>`;
  }

  function secao(id, titulo, conteudo) {
    const atual = assinatura[id];
    if (atual === conteudo && $('#' + id)) return;
    assinatura[id] = conteudo;
    const el = $('#' + id);
    if (el) el.innerHTML = conteudo; // troca só o que mudou (não apaga o código que está sendo digitado)
  }

  function desenharEntregas() {
    const corpo = $('#entCorpo');
    if (!$('#entMinhas')) {
      corpo.innerHTML = `<div class="ent-grade">
        <section class="ent-col"><h2>Minhas entregas</h2><div id="entMinhas"></div></section>
        <section class="ent-col"><h2>Disponíveis <i id="entQtd">0</i></h2><div id="entDisp"></div>
          <p class="sm ent-rodape">A lista atualiza sozinha a cada 15 segundos. O primeiro entregador que pegar fica com a entrega.</p></div>
        </section>
        <section class="ent-col"><h2>Feitas hoje</h2><div id="entHoje"></div></section>
      </div>`;
      assinatura = {};
    }
    const m = dados.minhas || [], d = dados.disponiveis || [], h = dados.hoje || [];
    // não redesenha "minhas" enquanto alguém digita o código
    const digitando = document.activeElement && document.activeElement.closest && document.activeElement.closest('.ent-codigo');
    if (!digitando) secao('entMinhas', '', m.length ? m.map(cartaoMinha).join('') : '<p class="coz-vazio">Nenhuma entrega com você agora.</p>');
    secao('entDisp', '', d.length ? d.map(cartaoDisponivel).join('') : '<p class="coz-vazio">Nenhum pedido esperando entregador.</p>');
    $('#entQtd').textContent = d.length;
    const gorjHoje = h.reduce((t, x) => t + (Number(x.gorjeta) || 0), 0);
    secao('entHoje', '', h.length ? `${gorjHoje > 0 ? `<p class="ent-gorjeta total">Gorjetas de hoje: <b>${brl(gorjHoje)}</b></p>` : ''}<ul class="ent-hoje">${h.map(x => `<li><b>#${esc(x.codigo)}</b><span>${esc(x.bairro)}${Number(x.gorjeta) > 0 ? ' · gorjeta ' + brl(x.gorjeta) : ''}</span><small>${x.status === 'entregue' ? 'Entregue' : 'Cancelado'} às ${hora(x.quando)}</small></li>`).join('')}</ul>` : '<p class="coz-vazio">Nenhuma entrega concluída hoje.</p>');
  }

  /* ===================================================================
     MEU PERFIL
  =================================================================== */
  function completo(e) {
    const itens = [['Foto', !!e.foto_url], ['Sobre mim', !!(e.sobre || '').trim()], ['Veículo', !!e.veiculo_tipo]];
    return { itens, feitos: itens.filter(i => i[1]).length };
  }

  function desenharPerfil() {
    const e = dados.perfil || {};
    const c = completo(e);
    $('#entCorpo').innerHTML = `<div class="ent-perfil">
      <div class="ent-perfil-cab">
        <label class="ent-foto-troca" title="Trocar foto">
          ${foto(e, 'ent-foto')}
          <span class="ent-foto-btn">${e.foto_url ? 'Trocar foto' : 'Enviar foto'}</span>
          <input type="file" accept="image/jpeg,image/png,image/webp" id="entFoto" hidden>
        </label>
        <div>
          <h2>${esc(e.nome || '')}</h2>
          <p><span class="papel entregador">Entregador</span>${e.desde ? ` · na equipe desde ${esc(mesAno(e.desde))}` : ''}</p>
          <p class="ent-contagem"><b>${Number(e.entregas || 0)}</b> ${Number(e.entregas) === 1 ? 'entrega feita' : 'entregas feitas'}</p>
        </div>
      </div>

      <div class="ent-completo">
        <p><b>${c.feitos === c.itens.length ? 'Seu perfil está completo' : `Seu perfil está ${c.feitos} de ${c.itens.length}`}</b>
          ${c.feitos < c.itens.length ? `<small>Falta: ${c.itens.filter(i => !i[1]).map(i => i[0].toLowerCase()).join(', ')}</small>` : ''}</p>
        <div class="ent-barra" role="img" aria-label="${c.feitos} de ${c.itens.length} partes preenchidas">${c.itens.map(i => `<i class="${i[1] ? 'ok' : ''}"></i>`).join('')}</div>
      </div>

      <div class="ent-perfil-grade">
        <form class="ent-form" id="entPerfil" novalidate>
          <h3>Sobre mim</h3>
          <label class="cp"><span>Uma frase sobre você (aparece para o cliente)</span>
            <textarea class="campo" name="sobre" rows="4" maxlength="400" placeholder="Ex.: Entrego no bairro há 3 anos e cuido para o lanche chegar quentinho.">${esc(e.sobre || '')}</textarea>
            <small class="dica" id="entConta">${(e.sobre || '').length}/400</small></label>
          <h3>Veículo</h3>
          <div class="ent-veic-campos">
            <label class="cp"><span>Tipo</span><select class="campo" name="veiculo_tipo">
              <option value="">Escolha</option>${Object.keys(VEICULOS).map(k => `<option value="${k}" ${e.veiculo_tipo === k ? 'selected' : ''}>${VEICULOS[k]}</option>`).join('')}</select></label>
            <label class="cp"><span>Cor</span><input class="campo" name="veiculo_cor" maxlength="30" value="${esc(e.veiculo_cor || '')}" placeholder="Ex.: vermelha"></label>
            <label class="cp"><span>Placa</span><input class="campo" name="veiculo_placa" maxlength="10" value="${esc(e.veiculo_placa || '')}" placeholder="ABC1D23" autocapitalize="characters"></label>
          </div>
          <label class="check"><input type="checkbox" name="mostrar_placa" ${e.mostrar_placa ? 'checked' : ''}> Mostrar a placa para o cliente</label>
          <p class="msg erro" id="entMsg" hidden></p>
          <button class="btn amarelo" type="submit">Salvar perfil</button>
          <h3>Meus cursos</h3>
          ${listaCursos(e.cursos, 'Nenhum curso cadastrado ainda.')}
          <p class="sm">Os cursos são cadastrados pela hamburgueria. Fez um curso novo? Leve o certificado para a loja.</p>
        </form>
        <aside class="ent-previa">
          <p class="sm">Como o cliente vê você quando você pega o pedido dele:</p>
          <div id="entPrevia">${PNC.cartaoEntregador(Object.assign({}, e, { nome: (e.nome || '').split(' ')[0], veiculo_placa: e.mostrar_placa ? e.veiculo_placa : '' }))}</div>
        </aside>
      </div>
    </div>`;
  }

  function lerPerfil(fotoNova) {
    const f = $('#entPerfil');
    const e = dados.perfil || {};
    return {
      p_foto_url: fotoNova != null ? fotoNova : (e.foto_url || ''),
      p_sobre: f.sobre.value.trim(),
      p_veiculo_tipo: f.veiculo_tipo.value,
      p_veiculo_cor: f.veiculo_cor.value.trim(),
      p_veiculo_placa: f.veiculo_placa.value.trim(),
      p_mostrar_placa: f.mostrar_placa.checked
    };
  }

  async function salvar(fotoNova) {
    const msg = $('#entMsg');
    msg.hidden = true;
    const { data, error } = await sb.rpc('entregador_salvar_perfil', lerPerfil(fotoNova));
    if (error) { msg.textContent = PNC.traduzErro(error.message); msg.hidden = false; return false; }
    dados.perfil = data;
    desenharPerfil();
    return true;
  }

  /* reduz a foto no próprio celular (até 640 px) antes de enviar */
  function reduzir(arquivo) {
    return new Promise((ok, falha) => {
      const img = new Image();
      const url = URL.createObjectURL(arquivo);
      img.onload = () => {
        const lado = 640, k = Math.min(1, lado / Math.max(img.width, img.height));
        const c = document.createElement('canvas');
        c.width = Math.round(img.width * k); c.height = Math.round(img.height * k);
        c.getContext('2d').drawImage(img, 0, 0, c.width, c.height);
        URL.revokeObjectURL(url);
        c.toBlob(b => b ? ok(b) : falha(new Error('Não foi possível ler a foto.')), 'image/jpeg', 0.86);
      };
      img.onerror = () => { URL.revokeObjectURL(url); falha(new Error('Não foi possível ler a foto.')); };
      img.src = url;
    });
  }

  async function trocarFoto(inp) {
    const arq = inp.files && inp.files[0];
    inp.value = '';
    if (!arq) return;
    if (!/^image\/(jpeg|png|webp)$/.test(arq.type)) return PNC.toast('Envie uma foto JPG, PNG ou WEBP.');
    if (arq.size > 15 * 1024 * 1024) return PNC.toast('Foto muito grande (máximo 15 MB).');
    const btn = $('.ent-foto-btn');
    if (btn) btn.textContent = 'Enviando...';
    try {
      const blob = await reduzir(arq);
      const uid = PNC.sessao.user.id;
      const caminho = `entregadores/${uid}/${Date.now()}-foto.jpg`;
      const { error } = await sb.storage.from('midia').upload(caminho, blob, { contentType: 'image/jpeg', cacheControl: '31536000', upsert: false });
      if (error) throw error;
      const url = sb.storage.from('midia').getPublicUrl(caminho).data.publicUrl;
      const antiga = (dados.perfil || {}).foto_url || '';
      if (await salvar(url)) {
        PNC.toast('Foto atualizada.');
        const m = antiga.match(/\/midia\/(entregadores\/[^?]+)$/);
        if (m) sb.storage.from('midia').remove([m[1]]); // apaga a foto anterior
      }
    } catch (er) {
      PNC.toast('Falha ao enviar a foto: ' + PNC.traduzErro(er.message));
      if (btn) btn.textContent = 'Trocar foto';
    }
  }

  /* ===================================================================
     LEITOR DE QR
     Usa o leitor do próprio navegador quando existe (Chrome no Android e no Mac).
     Nos outros (iPhone, Chrome/Edge no Windows) carrega o leitor jsQR na hora,
     só quando o entregador toca no botão. A câmera precisa de HTTPS (a Vercel já usa).
  =================================================================== */
  const JSQR_URL = 'https://cdn.jsdelivr.net/npm/jsqr@1.4.0/dist/jsQR.js';
  const ICONE_QR = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 4h6v6H4zM14 4h6v6h-6zM4 14h6v6H4zM14 14h2v2h-2zM18 14h2v2h-2zM14 18h2v2h-2zM18 18h2v2h-2z"/></svg>';
  let jsqrCarregando = null;

  function podeLerQr() {
    return !!(navigator.mediaDevices && navigator.mediaDevices.getUserMedia && window.isSecureContext !== false);
  }

  function carregarJsQr() {
    if (window.jsQR) return Promise.resolve();
    if (!jsqrCarregando) {
      jsqrCarregando = new Promise((ok, falha) => {
        const s = document.createElement('script');
        s.src = JSQR_URL;
        s.async = true;
        s.onload = () => window.jsQR ? ok() : falha(new Error('leitor indisponível'));
        s.onerror = () => { jsqrCarregando = null; s.remove(); falha(new Error('leitor indisponível')); };
        document.head.appendChild(s);
      });
    }
    return jsqrCarregando;
  }

  /* devolve uma função que lê o QR de um quadro do vídeo (ou null se não achou) */
  async function criarLeitor() {
    if ('BarcodeDetector' in window) {
      try {
        const formatos = await window.BarcodeDetector.getSupportedFormats();
        if (formatos.includes('qr_code')) {
          const det = new window.BarcodeDetector({ formats: ['qr_code'] });
          return async v => { const a = await det.detect(v); return a[0] ? a[0].rawValue : null; };
        }
      } catch (e) { /* cai no jsQR */ }
    }
    await carregarJsQr();
    const tela = document.createElement('canvas');
    const ctx = tela.getContext('2d', { willReadFrequently: true });
    return async v => {
      const w = v.videoWidth, h = v.videoHeight;
      if (!w || !h) return null;
      const k = Math.min(1, 720 / Math.max(w, h));
      tela.width = Math.round(w * k); tela.height = Math.round(h * k);
      ctx.drawImage(v, 0, 0, tela.width, tela.height);
      const img = ctx.getImageData(0, 0, tela.width, tela.height);
      const r = window.jsQR(img.data, tela.width, tela.height, { inversionAttempts: 'dontInvert' });
      return r ? r.data : null;
    };
  }

  async function abrirLeitor(id) {
    const form = $(`[data-ent-confirmar="${id}"]`);
    if (!form) return;
    PNC.abrirJanela(`<button class="j-fechar" type="button" data-fechar-janela aria-label="Fechar">${PNC.ICON.fechar}</button>
      <div class="ent-leitor"><h2 id="janelaTitulo">Aponte para o QR do cliente</h2>
        <video id="entVideo" playsinline muted></video>
        <p class="sm" id="entLeitorMsg">O QR fica na página do pedido, no celular do cliente.</p></div>`, 'janela-media');
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' }, audio: false });
      const video = $('#entVideo');
      if (!video) { stream.getTracks().forEach(t => t.stop()); return; }
      video.srcObject = stream;
      await video.play();
      leitor = { stream, timer: 0 };
      let ler;
      try { ler = await criarLeitor(); } catch (e) {
        fecharLeitor();
        const msg = $('#entLeitorMsg');
        if (msg) msg.textContent = 'Não foi possível carregar o leitor de QR. Verifique a internet ou digite o código que o cliente informar.';
        return;
      }
      const procurar = async () => {
        if (!leitor || !$('#entVideo')) return fecharLeitor();
        try {
          const val = await ler(video);
          const m = val && String(val).trim().match(/^PNC:([A-Z0-9]+):(\d{4})$/);
          if (m) {
            if (m[1] !== form.dataset.codigo) { $('#entLeitorMsg').textContent = `Este QR é do pedido #${m[1]}, não do #${form.dataset.codigo}.`; }
            else {
              fecharLeitor(); PNC.fecharJanela();
              form.codigo.value = m[2];
              form.requestSubmit();
              return;
            }
          }
        } catch (e) { }
        leitor.timer = setTimeout(procurar, 300);
      };
      procurar();
    } catch (er) {
      fecharLeitor();
      const msg = $('#entLeitorMsg');
      if (msg) msg.textContent = er && er.name === 'NotAllowedError'
        ? 'A câmera foi bloqueada. Libere a câmera para este site nas configurações do navegador ou digite o código.'
        : 'Não foi possível abrir a câmera. Digite o código que o cliente informar.';
    }
  }

  function fecharLeitor() {
    if (!leitor) return;
    clearTimeout(leitor.timer);
    if (leitor.stream) leitor.stream.getTracks().forEach(t => t.stop());
    leitor = null;
  }

  /* ===================================================================
     EVENTOS
  =================================================================== */
  async function rpc(nome, args, botao) {
    if (botao) botao.disabled = true;
    const { data, error } = await sb.rpc(nome, args);
    if (error) { if (botao) botao.disabled = false; PNC.toast(PNC.traduzErro(error.message)); return null; }
    return data || {};
  }

  async function clique(e) {
    const t = e.target;
    if (t.closest('[data-fechar-janela]')) { fecharLeitor(); return; }
    const pegar = t.closest('[data-ent-pegar]');
    if (pegar) {
      if (await rpc('entregador_pegar', { p_pedido: Number(pegar.dataset.entPegar) }, pegar)) PNC.toast('Entrega é sua. Retire o pedido na loja.');
      return carregar();
    }
    const saiu = t.closest('[data-ent-sair]');
    if (saiu) {
      if (await rpc('entregador_sair', { p_pedido: Number(saiu.dataset.entSair) }, saiu)) {
        PNC.toast('Boa entrega! O cliente foi avisado que você está a caminho.');
        if (local.estado !== 'parado_pelo_entregador') ligarLocal();
      }
      return carregar();
    }
    const dev = t.closest('[data-ent-devolver]');
    if (dev) {
      if (!confirm('Devolver esta entrega? Ela volta para a lista de disponíveis.')) return;
      if (await rpc('entregador_devolver', { p_pedido: Number(dev.dataset.entDevolver) }, dev)) PNC.toast('Entrega devolvida.');
      return carregar();
    }
    const lc = t.closest('[data-ent-local]');
    if (lc) {
      if (lc.dataset.entLocal === 'ligar') { local.estado = 'parado'; ligarLocal(); }
      else { desligarLocal(); local.estado = 'parado_pelo_entregador'; assinatura.entMinhas = null; desenharEntregas(); }
      return;
    }
    const ler = t.closest('[data-ent-ler]');
    if (ler) return abrirLeitor(ler.dataset.entLer);
  }

  async function enviar(e) {
    const f = e.target;
    if (f.matches('[data-ent-confirmar]')) {
      e.preventDefault();
      const msg = f.querySelector('.msg');
      const codigo = f.codigo.value.replace(/\D/g, '');
      if (codigo.length !== 4) { msg.textContent = 'Digite os 4 números do código.'; msg.hidden = false; return; }
      const btn = f.querySelector('[type=submit]');
      btn.disabled = true;
      const { data, error } = await sb.rpc('entregador_confirmar', { p_pedido: Number(f.dataset.entConfirmar), p_codigo: codigo });
      btn.disabled = false;
      if (error) { msg.textContent = PNC.traduzErro(error.message); msg.hidden = false; return carregar(); }
      if (!data || !data.ok) {
        msg.textContent = `Código errado. ${data && data.restantes > 0 ? `Mais ${data.restantes} ${data.restantes === 1 ? 'tentativa' : 'tentativas'}.` : 'Peça para a loja confirmar.'}`;
        msg.hidden = false;
        f.codigo.select();
        if (data && data.restantes <= 0) { document.activeElement.blur(); carregar(); }
        return;
      }
      PNC.toast('Entrega confirmada!');
      document.activeElement && document.activeElement.blur && document.activeElement.blur();
      return carregar();
    }
    if (f.id === 'entPerfil') {
      e.preventDefault();
      const btn = f.querySelector('[type=submit]');
      btn.disabled = true;
      if (await salvar()) PNC.toast('Perfil salvo.');
      const b2 = $('#entPerfil [type=submit]');
      if (b2) b2.disabled = false;
    }
  }

  function mudou(e) {
    if (e.target.id === 'entFoto') trocarFoto(e.target);
  }

  function digitou(e) {
    if (e.target.name === 'sobre') { const c = $('#entConta'); if (c) c.textContent = e.target.value.length + '/400'; }
    if (e.target.name === 'codigo') e.target.value = e.target.value.replace(/\D/g, '').slice(0, 4);
  }

  PNC.entregador = sb
    ? { render, sair }
    : { render: el => { el.innerHTML = '<section class="secao"><div class="caixa"><p>Ligue o Supabase em js/config.js para usar o painel do entregador.</p></div></section>'; }, sair() { } };
})();
