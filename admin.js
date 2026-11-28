/* =====================================================================
   PÃO NA CHAPA · Painel administrativo (#admin)
   Só aparece para quem tem papel "admin" (a segurança real está no banco: RLS).
   Seções: visão geral, pedidos, produtos, categorias, adicionais,
   Explorar (campanhas), entrega, cupons e pontos, usuários (perfis e suspensão)
   e configurações.
===================================================================== */
(function () {
  const PNC = window.PNC, E = PNC.estado, sb = PNC.sb, esc = PNC.esc, brl = PNC.brl;
  if (!sb) { PNC.admin = { render: el => { el.innerHTML = '<section class="secao"><div class="caixa"><p>Ligue o Supabase em js/config.js para usar o painel.</p></div></section>'; } }; return; }

  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => Array.from(r.querySelectorAll(s));
  const I = PNC.ICON;

  const SECOES = [
    ['visao', 'Visão geral'],
    ['pedidos', 'Pedidos'],
    ['produtos', 'Produtos'],
    ['categorias', 'Categorias'],
    ['adicionais', 'Adicionais'],
    ['explorar', 'Explorar'],
    ['entrega', 'Entrega e taxas'],
    ['cupons', 'Cupons e pontos'],
    ['usuarios', 'Usuários'],
    ['config', 'Configurações']
  ];

  let limpar = [];
  const aoSair = fn => limpar.push(fn);

  /* ===================================================================
     ESTRUTURA
  =================================================================== */
  function render(app, params) {
    const sec = SECOES.some(s => s[0] === params[0]) ? params[0] : 'pedidos';
    app.innerHTML = `<section class="adm">
      <aside class="adm-menu"><p class="sobre">Painel</p><nav>${SECOES.map(s => `<a href="#admin/${s[0]}" class="${s[0] === sec ? 'on' : ''}">${s[1]}<i data-cont="${s[0]}"></i></a>`).join('')}</nav>
        <a class="adm-site adm-cozinha" href="#cozinha">Painel da cozinha</a>
        <a class="adm-site" href="#inicio">${I.voltar} Ver o site</a></aside>
      <div class="adm-corpo" id="adm"><p class="carregando">Carregando...</p></div>
    </section>`;
    const alvo = $('#adm');
    ({ visao, pedidos, produtos, categorias, adicionais, explorar, entrega, cupons, usuarios, config })[sec](alvo);
    contarAndamento();
  }

  function sair() { limpar.forEach(fn => { try { fn(); } catch (e) { } }); limpar = []; }

  async function contarAndamento() {
    const { count } = await sb.from('pedidos').select('id', { count: 'exact', head: true }).in('status', PNC.ANDAMENTO);
    const el = $('[data-cont="pedidos"]');
    if (el) el.textContent = count ? count : '';
  }

  const erro = (el, e) => { el.innerHTML = `<p class="msg erro">${esc(PNC.traduzErro(e && e.message))}</p>`; };
  const ok = m => PNC.toast(m);
  const atualizarSite = async () => { await PNC.carregar(); };

  /* ===================================================================
     CONSTRUTOR DE FORMULÁRIOS
     tipos: texto, area, numero, dinheiro, data, bool, select, lista, midia, midias,
            tamanhos, multi, horarios, pagamentos
  =================================================================== */
  function campo(f, v) {
    const id = 'f_' + f.k;
    const dica = f.dica ? `<small class="dica">${esc(f.dica)}</small>` : '';
    const rot = `<span>${esc(f.r)}${f.obrig ? ' *' : ''}</span>`;
    const val = v == null ? '' : v;

    switch (f.t) {
      case 'area':
        return `<label class="cp ${f.largo ? 'g2' : ''}">${rot}<textarea class="campo" id="${id}" data-k="${f.k}" rows="${f.linhas || 3}">${esc(val)}</textarea>${dica}</label>`;
      case 'numero':
      case 'dinheiro':
        return `<label class="cp">${rot}<input class="campo" id="${id}" data-k="${f.k}" type="number" step="${f.t === 'dinheiro' ? '0.01' : '1'}" min="0" inputmode="decimal" value="${esc(val)}">${dica}</label>`;
      case 'data':
        return `<label class="cp">${rot}<input class="campo" id="${id}" data-k="${f.k}" type="datetime-local" value="${val ? esc(paraLocal(val)) : ''}">${dica}</label>`;
      case 'bool':
        return `<label class="interruptor ${f.largo ? 'g2' : ''}"><input type="checkbox" id="${id}" data-k="${f.k}" ${val ? 'checked' : ''}><i></i><span>${esc(f.r)}${f.dica ? `<small>${esc(f.dica)}</small>` : ''}</span></label>`;
      case 'select':
        return `<label class="cp">${rot}<select class="campo" id="${id}" data-k="${f.k}">${(f.op || []).map(o => `<option value="${esc(o[0])}" ${String(o[0]) === String(val) ? 'selected' : ''}>${esc(o[1])}</option>`).join('')}</select>${dica}</label>`;
      case 'lista':
        return `<label class="cp ${f.largo ? 'g2' : ''}">${rot}<input class="campo" id="${id}" data-k="${f.k}" value="${esc((val || []).join(', '))}" placeholder="separe por vírgula">${dica}</label>`;
      case 'midia':
        return `<div class="cp am ${f.largo ? 'g2' : ''}" data-midia="${f.aceita || 'image'}">${rot}
          <div class="am-prev">${previa(val)}</div>
          <div class="am-linha"><input class="campo" id="${id}" data-k="${f.k}" value="${esc(val)}" placeholder="Envie um arquivo ou cole o endereço">
          <label class="btn linha pequeno">Enviar<input type="file" accept="${f.aceita === 'video' ? 'video/mp4,video/webm' : 'image/*'}" hidden></label></div>${dica}</div>`;
      case 'midias':
        return `<div class="cp am-lista g2" data-midias>${rot}
          <div class="am-grade">${(val || []).map(u => itemMidia(u)).join('')}</div>
          <label class="btn linha pequeno">Adicionar fotos<input type="file" accept="image/*" multiple hidden></label>
          <input type="hidden" data-k="${f.k}" value="${esc(JSON.stringify(val || []))}">${dica}</div>`;
      case 'tamanhos':
        return `<div class="cp g2" data-tamanhos>${rot}<div class="tam-linhas">${(val || []).map(linhaTam).join('')}</div>
          <button type="button" class="btn-texto" data-add-tam>+ Adicionar tamanho</button><input type="hidden" data-k="${f.k}">${dica}</div>`;
      case 'multi':
        return `<fieldset class="cp g2 multi" data-k="${f.k}" data-multi><legend>${esc(f.r)}</legend>${(f.op || []).length ? f.op.map(o => `<label class="check"><input type="checkbox" value="${esc(o[0])}" ${(val || []).map(String).includes(String(o[0])) ? 'checked' : ''}> ${esc(o[1])}</label>`).join('') : `<p class="sm">${esc(f.vazio || 'Nada cadastrado ainda.')}</p>`}${dica}</fieldset>`;
      case 'horarios':
        return `<fieldset class="cp g2 horarios" data-k="${f.k}" data-horarios><legend>${esc(f.r)}</legend>${PNC.DIAS.map((d, i) => {
          const h = (val || []).find(x => +x.dia === i);
          return `<div class="hr-linha" data-dia="${i}"><label class="check"><input type="checkbox" ${h ? 'checked' : ''}> ${d}</label><input class="campo" type="time" value="${h ? esc(h.abre) : '18:00'}" aria-label="${d}: abre"><span>às</span><input class="campo" type="time" value="${h ? esc(h.fecha) : '23:00'}" aria-label="${d}: fecha"></div>`;
        }).join('')}${dica}</fieldset>`;
      case 'pagamentos':
        return `<fieldset class="cp g2 multi" data-k="${f.k}" data-pagamentos><legend>${esc(f.r)}</legend>${Object.keys(PNC.PAGAMENTO).map(k => `<label class="check"><input type="checkbox" value="${k}" ${(val || {})[k] ? 'checked' : ''}> ${PNC.PAGAMENTO[k]}</label>`).join('')}</fieldset>`;
      default:
        return `<label class="cp ${f.largo ? 'g2' : ''}">${rot}<input class="campo" id="${id}" data-k="${f.k}" value="${esc(val)}" ${f.ph ? `placeholder="${esc(f.ph)}"` : ''}>${dica}</label>`;
    }
  }

  const linhaTam = t => `<div class="tam-linha"><input class="campo" placeholder="Nome (ex.: Duplo)" value="${esc((t || {}).nome || '')}"><input class="campo" type="number" step="0.01" min="0" placeholder="Preço" value="${esc((t || {}).preco != null ? t.preco : '')}"><button type="button" class="btn-texto" data-tira-tam>Remover</button></div>`;

  const ehVideo = u => /\.(mp4|webm)(\?|$)/i.test(u || '');
  const previa = u => !u ? '<span class="sm">Sem arquivo</span>' : ehVideo(u) ? `<video src="${esc(u)}" muted loop playsinline autoplay></video>` : `<img src="${esc(u)}" alt="">`;
  const itemMidia = u => `<div class="am-item" data-url="${esc(u)}"><img src="${esc(u)}" alt=""><button type="button" data-tira-midia aria-label="Remover foto">${I.fechar}</button></div>`;

  function paraLocal(iso) {
    const d = new Date(iso);
    const z = n => String(n).padStart(2, '0');
    return `${d.getFullYear()}-${z(d.getMonth() + 1)}-${z(d.getDate())}T${z(d.getHours())}:${z(d.getMinutes())}`;
  }

  function lerForm(form, campos) {
    const o = {};
    campos.forEach(f => {
      const el = form.querySelector(`[data-k="${f.k}"]`);
      if (!el) return;
      switch (f.t) {
        case 'numero': o[f.k] = el.value === '' ? (f.nulo ? null : 0) : Number(el.value); break;
        case 'dinheiro': o[f.k] = el.value === '' ? (f.nulo ? null : 0) : Math.round(Number(el.value) * 100) / 100; break;
        case 'data': o[f.k] = el.value ? new Date(el.value).toISOString() : null; break;
        case 'bool': o[f.k] = el.checked; break;
        case 'select': o[f.k] = el.value === '' ? null : (f.num ? Number(el.value) : el.value); break;
        case 'lista': o[f.k] = el.value.split(',').map(s => s.trim()).filter(Boolean); break;
        case 'midia': o[f.k] = el.value.trim() || null; break;
        case 'midias': o[f.k] = $$('.am-item', el.parentElement).map(x => x.dataset.url); break;
        case 'tamanhos': o[f.k] = $$('.tam-linha', el.parentElement).map(l => { const i = $$('input', l); return { nome: i[0].value.trim(), preco: Number(i[1].value) }; }).filter(t => t.nome && !isNaN(t.preco)); break;
        case 'multi': o[f.k] = $$('input:checked', el).map(x => f.num ? Number(x.value) : x.value); break;
        case 'horarios': o[f.k] = $$('.hr-linha', el).filter(l => l.querySelector('input[type=checkbox]').checked).map(l => { const t = $$('input[type=time]', l); return { dia: Number(l.dataset.dia), abre: t[0].value, fecha: t[1].value }; }).filter(h => h.abre && h.fecha); break;
        case 'pagamentos': o[f.k] = { pix: false, dinheiro: false, cartao: false }; $$('input:checked', el).forEach(x => (o[f.k][x.value] = true)); break;
        default: o[f.k] = el.value.trim();
      }
    });
    return o;
  }

  /* envio de fotos e vídeos para o Storage (bucket "midia") */
  async function enviar(arquivo, pasta) {
    const nome = PNC.slug(arquivo.name.replace(/\.[^.]+$/, '')) || 'arquivo';
    const ext = (arquivo.name.match(/\.[^.]+$/) || [''])[0].toLowerCase();
    const caminho = `${pasta}/${Date.now()}-${nome}${ext}`;
    const { error } = await sb.storage.from('midia').upload(caminho, arquivo, { cacheControl: '31536000', upsert: false, contentType: arquivo.type });
    if (error) throw error;
    return sb.storage.from('midia').getPublicUrl(caminho).data.publicUrl;
  }

  function ligarForm(form, pasta) {
    form.addEventListener('change', async e => {
      const inp = e.target;
      if (inp.type !== 'file' || !inp.files.length) return;
      const caixaM = inp.closest('[data-midia]'), lista = inp.closest('[data-midias]');
      const rotulo = inp.parentElement;
      const txt = rotulo.firstChild.textContent;
      rotulo.firstChild.textContent = 'Enviando...';
      try {
        for (const arq of Array.from(inp.files)) {
          if (arq.size > 50 * 1024 * 1024) { ok('Arquivo maior que 50 MB: ' + arq.name); continue; }
          const url = await enviar(arq, pasta);
          if (caixaM) { caixaM.querySelector('[data-k]').value = url; caixaM.querySelector('.am-prev').innerHTML = previa(url); }
          if (lista) lista.querySelector('.am-grade').insertAdjacentHTML('beforeend', itemMidia(url));
        }
      } catch (er) { ok('Falha no envio: ' + PNC.traduzErro(er.message)); }
      rotulo.firstChild.textContent = txt;
      inp.value = '';
    });
    form.addEventListener('input', e => {
      const c = e.target.closest('[data-midia]');
      if (c && e.target.matches('[data-k]')) c.querySelector('.am-prev').innerHTML = previa(e.target.value.trim());
    });
    form.addEventListener('click', e => {
      if (e.target.closest('[data-add-tam]')) e.target.closest('[data-tamanhos]').querySelector('.tam-linhas').insertAdjacentHTML('beforeend', linhaTam());
      if (e.target.closest('[data-tira-tam]')) e.target.closest('.tam-linha').remove();
      if (e.target.closest('[data-tira-midia]')) e.target.closest('.am-item').remove();
    });
  }

  /* janela com formulário (editar/criar) */
  function abrirForm({ titulo, campos, valores, pasta, salvar, excluir }) {
    PNC.abrirJanela(`<button class="j-fechar" type="button" data-fechar-janela aria-label="Fechar">${I.fechar}</button>
      <form class="adm-form" id="admForm" novalidate>
        <div class="adm-form-cab"><h2 id="janelaTitulo">${esc(titulo)}</h2></div>
        <div class="adm-form-corpo grid-end">${campos.map(f => campo(f, valores[f.k])).join('')}</div>
        <div class="adm-form-rodape"><p class="msg erro" id="admMsg" hidden></p>
          ${excluir ? '<button type="button" class="btn-texto" data-excluir>Excluir</button>' : '<span></span>'}
          <div class="botoes-fim"><button type="button" class="btn linha" data-fechar-janela>Cancelar</button><button class="btn amarelo" type="submit">Salvar</button></div></div>
      </form>`, 'janela-form');
    const form = $('#admForm');
    ligarForm(form, pasta);
    const msg = t => { const m = $('#admMsg'); m.textContent = t; m.hidden = !t; };
    form.addEventListener('submit', async e => {
      e.preventDefault();
      const dados = lerForm(form, campos);
      const falta = campos.find(f => f.obrig && (dados[f.k] == null || dados[f.k] === ''));
      if (falta) return msg('Preencha: ' + falta.r);
      const btn = form.querySelector('[type=submit]');
      btn.disabled = true;
      try { await salvar(dados); PNC.fecharJanela(); }
      catch (er) { msg(PNC.traduzErro(er.message)); }
      btn.disabled = false;
    });
    const bx = form.querySelector('[data-excluir]');
    if (bx) bx.addEventListener('click', async () => {
      if (!confirm('Excluir definitivamente?')) return;
      try { await excluir(); PNC.fecharJanela(); } catch (er) { msg(PNC.traduzErro(er.message)); }
    });
  }

  const tentar = async p => { const r = await p; if (r.error) throw r.error; return r; };

  /* ===================================================================
     VISÃO GERAL
  =================================================================== */
  async function visao(el) {
    const desde = new Date(Date.now() - 30 * 864e5).toISOString();
    const { data, error } = await sb.from('pedidos').select('id, total, status, criado_em, tipo').gte('criado_em', desde).order('criado_em', { ascending: false }).limit(2000);
    if (error) return erro(el, error);
    const validos = data.filter(p => p.status !== 'cancelado');
    const diaSP = d => new Date(d).toLocaleDateString('pt-BR', { timeZone: 'America/Sao_Paulo' });
    const hoje = diaSP(new Date());
    const deHoje = validos.filter(p => diaSP(p.criado_em) === hoje);
    const soma = l => l.reduce((s, p) => s + Number(p.total), 0);
    const andamento = data.filter(p => PNC.ANDAMENTO.includes(p.status)).length;

    const dias = [];
    for (let i = 13; i >= 0; i--) {
      const d = new Date(Date.now() - i * 864e5);
      const k = diaSP(d);
      dias.push({ k, rot: d.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', timeZone: 'America/Sao_Paulo' }), v: soma(validos.filter(p => diaSP(p.criado_em) === k)), n: validos.filter(p => diaSP(p.criado_em) === k).length });
    }
    const max = Math.max(1, ...dias.map(d => d.v));

    let top = [];
    const ids = validos.slice(0, 300).map(p => p.id);
    if (ids.length) {
      const { data: itens } = await sb.from('pedido_itens').select('nome, quantidade, total').in('pedido_id', ids);
      const m = {};
      (itens || []).forEach(i => { m[i.nome] = m[i.nome] || { q: 0, v: 0 }; m[i.nome].q += i.quantidade; m[i.nome].v += Number(i.total); });
      top = Object.entries(m).sort((a, b) => b[1].q - a[1].q).slice(0, 8);
    }

    el.innerHTML = `<div class="adm-cab"><div><p class="sobre">Últimos 30 dias</p><h1>Visão geral</h1></div></div>
      <div class="kpis">
        <div><small>Pedidos hoje</small><strong>${deHoje.length}</strong></div>
        <div><small>Faturamento hoje</small><strong>${brl(soma(deHoje))}</strong></div>
        <div><small>Em andamento agora</small><strong>${andamento}</strong></div>
        <div><small>Faturamento 30 dias</small><strong>${brl(soma(validos))}</strong></div>
        <div><small>Pedidos 30 dias</small><strong>${validos.length}</strong></div>
        <div><small>Ticket médio</small><strong>${brl(validos.length ? soma(validos) / validos.length : 0)}</strong></div>
      </div>
      <div class="adm-duas">
        <div class="painel-bloco"><h3>Faturamento por dia (14 dias)</h3>
          <div class="barras">${dias.map(d => `<div class="barra-d" title="${d.rot}: ${brl(d.v)} (${d.n} pedidos)"><i style="height:${Math.round(d.v / max * 100)}%"></i><small>${d.rot.slice(0, 2)}</small></div>`).join('')}</div></div>
        <div class="painel-bloco"><h3>Mais vendidos</h3>${top.length ? `<ol class="top">${top.map(t => `<li><span>${esc(t[0])}</span><b>${t[1].q} un.</b></li>`).join('')}</ol>` : '<p class="sm">Ainda não há vendas no período.</p>'}</div>
      </div>
      <p class="sm">Pedidos cancelados não entram nos valores.</p>`;
  }

  /* ===================================================================
     PEDIDOS
  =================================================================== */
  const ANDAMENTO = PNC.ANDAMENTO;
  let filtroPed = 'andamento';

  /* próximo passo de cada pedido para o admin (o banco confere de novo em mudar_status_pedido) */
  function acoesAdmin(p) {
    const pix = p.pagamento === 'pix';
    switch (p.status) {
      case 'aguardando_confirmacao': return [[pix ? 'aguardando_pagamento' : 'confirmado', 'Aceitar pedido']];
      case 'aguardando_pagamento': return [['pagamento_aprovado', 'Pagamento recebido']];
      case 'pagamento_aprovado':
      case 'confirmado': return [['em_preparo', 'Iniciar preparo']];
      case 'em_preparo': return [['pronto', 'Pedido pronto']];
      case 'pronto': return p.tipo === 'retirada' ? [['entregue', 'Cliente retirou']] : [['aguardando_entregador', 'Chamar entregador']];
      case 'aguardando_entregador': return [['saiu_entrega', 'Saiu para entrega']];
      case 'saiu_entrega': return [['entregue', 'Marcar como entregue']];
      default: return [];
    }
  }

  async function pedidos(el) {
    const filtros = [['andamento', 'Em andamento'], ['hoje', 'Hoje'], ['entregue', 'Entregues'], ['cancelado', 'Cancelados'], ['todos', 'Todos']];
    el.innerHTML = `<div class="adm-cab"><div><p class="sobre">Atualiza sozinho</p><h1>Pedidos</h1></div>
      <div class="filtros">${filtros.map(f => `<button type="button" class="chip ${f[0] === filtroPed ? 'on' : ''}" data-filtro="${f[0]}">${f[1]}</button>`).join('')}</div></div>
      <div id="listaPed"><p class="carregando">Carregando...</p></div>`;

    const carregarLista = async () => {
      const lista = $('#listaPed');
      if (!lista) return;
      let q = sb.from('pedidos').select('*').order('criado_em', { ascending: false }).limit(100);
      if (filtroPed === 'andamento') q = q.in('status', ANDAMENTO);
      else if (filtroPed === 'entregue' || filtroPed === 'cancelado') q = q.eq('status', filtroPed);
      else if (filtroPed === 'hoje') { const d = new Date(); d.setHours(0, 0, 0, 0); q = q.gte('criado_em', d.toISOString()); }
      const { data, error } = await q;
      if (error) return erro(lista, error);
      if (filtroPed === 'andamento') data.reverse();   /* mais antigo primeiro: a ordem da cozinha */
      const ids = data.map(p => p.id);
      const itens = {};
      if (ids.length) {
        const { data: it } = await sb.from('pedido_itens').select('*').in('pedido_id', ids).order('id');
        (it || []).forEach(i => (itens[i.pedido_id] = itens[i.pedido_id] || []).push(i));
      }
      const idsEnt = [...new Set(data.map(p => p.entregador_id).filter(Boolean))];
      if (idsEnt.length) {
        const { data: ents } = await sb.from('perfis').select('id, nome').in('id', idsEnt);
        (ents || []).forEach(u => { nomesEnt[u.id] = u.nome; });
      }
      const abertos = $$('textarea[data-recado]', lista).filter(t => t === document.activeElement || t.value !== t.defaultValue);
      if (abertos.length) return;   /* não apaga um recado que o admin está digitando */
      lista.innerHTML = data.length ? `<div class="cards-ped">${data.map(p => cartaoPedido(p, itens[p.id] || [])).join('')}</div>` : '<p class="aviso-vazio">Nenhum pedido aqui.</p>';
      contarAndamento();
    };

    el.addEventListener('click', async e => {
      const f = e.target.closest('[data-filtro]');
      if (f) { filtroPed = f.dataset.filtro; $$('[data-filtro]', el).forEach(b => b.classList.toggle('on', b === f)); return carregarLista(); }
      const st = e.target.closest('[data-status]');
      if (st) {
        const novo = st.dataset.status;
        let motivo = '';
        if (novo === 'cancelado') {
          motivo = prompt('Motivo do cancelamento (o cliente vê esta mensagem):', '');
          if (motivo === null) return;
        }
        if (novo === 'pagamento_aprovado' && !confirm(`Confirma que o PIX de ${st.dataset.valor} já caiu na conta da loja?`)) return;
        st.disabled = true;
        const { data: r, error } = await sb.rpc('mudar_status_pedido', { p_pedido: Number(st.dataset.id), p_status: novo, p_motivo: motivo.trim() });
        if (error) { st.disabled = false; return ok(PNC.traduzErro(error.message)); }
        ok('Pedido atualizado: ' + PNC.STATUS[(r && r.status) || novo]);
        carregarLista();
      }
      const rc = e.target.closest('[data-enviar-recado]');
      if (rc) {
        const t = $(`textarea[data-recado="${rc.dataset.enviarRecado}"]`, el);
        const { error } = await sb.from('pedidos').update({ mensagem_cliente: t.value.trim() }).eq('id', rc.dataset.enviarRecado);
        if (error) return ok(PNC.traduzErro(error.message));
        t.defaultValue = t.value;
        ok('Recado enviado ao cliente.');
        carregarLista();
      }
    });

    await carregarLista();

    /* tempo real: pedido novo toca um aviso; a lista se atualiza sozinha */
    let t = 0;
    const agendar = () => { clearTimeout(t); t = setTimeout(carregarLista, 400); };
    const canal = PNC.canal('admin-pedidos', c => c
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'pedidos' }, () => { bip(); ok('Novo pedido recebido!'); agendar(); })
      .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'pedidos' }, agendar));
    const intervalo = setInterval(carregarLista, 20000);
    aoSair(() => { if (canal) { try { sb.removeChannel(canal); } catch (e) { } } clearInterval(intervalo); clearTimeout(t); });
  }

  const nomesEnt = {};

  function cartaoPedido(p, itens) {
    const fim = PNC.FINAIS.includes(p.status);
    const rotulo = PNC.rotuloStatus(p.status, p.tipo);
    const msgZap = `Olá, ${p.cliente_nome.split(' ')[0]}! Seu pedido #${p.codigo} no ${E.config.nome_loja || 'Pão na Chapa'}: ${rotulo}.`;
    return `<article class="card-ped st-${p.status}">
      <header><div><strong>#${esc(p.codigo)}</strong><small>${PNC.dataHora(p.criado_em)}</small></div><span class="${PNC.corStatus(p.status)}">${rotulo}</span></header>
      <div class="cp-cliente"><b>${esc(p.cliente_nome)}</b><a href="${PNC.linkWhats(p.cliente_telefone.length <= 11 ? '55' + PNC.soNumeros(p.cliente_telefone) : p.cliente_telefone, msgZap)}" target="_blank" rel="noopener">${I.whats} ${esc(p.cliente_telefone)}</a>${p.cliente_email ? `<small>${esc(p.cliente_email)}</small>` : ''}</div>
      <div class="cp-tipo ${p.tipo}">${p.tipo === 'entrega' ? 'ENTREGA' : 'RETIRADA'}${p.endereco ? `<p>${esc(PNC.textoEndereco(p.endereco))}</p>` : ''}</div>
      <ul class="cp-itens">${itens.map(it => `<li><span><b>${it.quantidade}×</b> ${esc(it.nome)}${it.tamanho ? ' (' + esc(it.tamanho) + ')' : ''}${PNC.detalhesItem(it.adicionais, it.removidos, it.observacao)}</span><span>${brl(it.total)}</span></li>`).join('')}</ul>
      ${p.observacoes ? `<p class="cp-obs"><b>Obs.:</b> ${esc(p.observacoes)}</p>` : ''}
      ${p.tipo === 'entrega' && p.entregador_id ? `<p class="cp-ent">Entregador: <b>${esc(nomesEnt[p.entregador_id] || '—')}</b>${p.tentativas_codigo >= 5 ? ' · <span class="cp-alerta">código errado 5 vezes: confirme a entrega com o cliente</span>' : ''}</p>` : ''}
      <div class="cp-totais"><span>Subtotal ${brl(p.subtotal)}${p.tipo === 'entrega' ? ' · Entrega ' + brl(p.taxa_entrega) : ''}${Number(p.desconto) > 0 ? ` · <em class="cp-desc">Cupom ${esc(p.cupom_codigo || '')} − ${brl(p.desconto)}</em>` : ''}${Number(p.desconto_pontos) > 0 ? ` · <em class="cp-desc">${Number(p.pontos_usados)} pontos − ${brl(p.desconto_pontos)}</em>` : ''}</span><strong>${brl(p.total)}</strong></div>
      <p class="cp-pag">${PNC.PAGAMENTO[p.pagamento]}${p.troco_para ? ' · troco para ' + brl(p.troco_para) + ' (devolver ' + brl(p.troco_para - p.total) + ')' : ''}</p>
      ${p.status === 'cancelado' && p.cancelado_motivo ? `<p class="cp-obs">Cancelado: ${esc(p.cancelado_motivo)}</p>` : ''}
      ${fim ? '' : `<div class="cp-acoes">${acoesAdmin(p).map(a => `<button type="button" class="btn amarelo" data-status="${a[0]}" data-id="${p.id}" data-valor="${esc(brl(p.total))}">${a[1]}</button>`).join('')}<button type="button" class="btn-texto" data-status="cancelado" data-id="${p.id}">Cancelar</button></div>
      <div class="cp-recado"><textarea class="campo" rows="2" data-recado="${p.id}" placeholder="Recado para o cliente (aparece no acompanhamento do pedido)">${esc(p.mensagem_cliente)}</textarea><button type="button" class="btn linha pequeno" data-enviar-recado="${p.id}">Enviar recado</button></div>`}
    </article>`;
  }

  function bip() {
    try {
      const ctx = new (window.AudioContext || window.webkitAudioContext)();
      [0, 0.18].forEach(t0 => {
        const o = ctx.createOscillator(), g = ctx.createGain();
        o.frequency.value = 880; o.connect(g); g.connect(ctx.destination);
        g.gain.setValueAtTime(0.0001, ctx.currentTime + t0);
        g.gain.exponentialRampToValueAtTime(0.25, ctx.currentTime + t0 + 0.02);
        g.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + t0 + 0.15);
        o.start(ctx.currentTime + t0); o.stop(ctx.currentTime + t0 + 0.16);
      });
    } catch (e) { }
  }

  /* ===================================================================
     PRODUTOS
  =================================================================== */
  let filtroCat = '', buscaProd = '';

  async function produtos(el) {
    const [{ data: prods, error }, { data: cats }, { data: adds }, { data: pa }] = await Promise.all([
      sb.from('produtos').select('*').order('ordem').order('nome'),
      sb.from('categorias').select('id, nome').order('ordem'),
      sb.from('adicionais').select('id, nome, preco').order('ordem').order('nome'),
      sb.from('produto_adicionais').select('*')
    ]);
    if (error) return erro(el, error);
    const nomeCat = id => ((cats || []).find(c => c.id === id) || {}).nome || 'Sem categoria';

    const desenhar = () => {
      const l = prods.filter(p => (!filtroCat || String(p.categoria_id) === filtroCat) && (!buscaProd || p.nome.toLowerCase().includes(buscaProd.toLowerCase())));
      $('#tabProd').innerHTML = l.length ? l.map(p => `<div class="lin">
          <span class="lin-img">${(p.fotos || [])[0] ? `<img src="${esc(p.fotos[0])}" alt="">` : ''}</span>
          <span class="lin-nome"><b>${esc(p.nome)}</b><small>${esc(nomeCat(p.categoria_id))}${!p.ativo ? ' · <em>oculto no site</em>' : ''}${p.destaque ? ' · destaque' : ''}${p.novidade ? ' · novidade' : ''}</small></span>
          <span class="lin-preco">${PNC.emPromo(p) ? `<s>${brl(p.preco)}</s> ${brl(p.preco_promocional)}` : brl(p.preco)}</span>
          <label class="interruptor mini" title="Disponível hoje"><input type="checkbox" data-disp="${p.id}" ${p.disponivel ? 'checked' : ''}><i></i><span>${p.disponivel ? 'Disponível' : 'Esgotado'}</span></label>
          <button type="button" class="btn linha pequeno" data-editar="${p.id}">Editar</button></div>`).join('') : '<p class="aviso-vazio">Nenhum produto.</p>';
    };

    el.innerHTML = `<div class="adm-cab"><div><p class="sobre">${prods.length} cadastrados</p><h1>Produtos</h1></div><button type="button" class="btn amarelo" data-novo>+ Novo produto</button></div>
      <div class="adm-filtros"><input class="campo" id="bProd" type="search" placeholder="Buscar produto" value="${esc(buscaProd)}"><select class="campo" id="fCat"><option value="">Todas as categorias</option>${(cats || []).map(c => `<option value="${c.id}" ${String(c.id) === filtroCat ? 'selected' : ''}>${esc(c.nome)}</option>`).join('')}</select></div>
      <div class="tabela" id="tabProd"></div>`;
    desenhar();

    $('#bProd').addEventListener('input', e => { buscaProd = e.target.value; desenhar(); });
    $('#fCat').addEventListener('change', e => { filtroCat = e.target.value; desenhar(); });

    const campos = [
      { k: 'nome', r: 'Nome', obrig: true },
      { k: 'categoria_id', r: 'Categoria', t: 'select', num: true, op: [['', 'Sem categoria']].concat((cats || []).map(c => [c.id, c.nome])) },
      { k: 'descricao', r: 'Descrição', t: 'area', largo: true },
      { k: 'preco', r: 'Preço (R$)', t: 'dinheiro', obrig: true },
      { k: 'preco_promocional', r: 'Preço promocional (R$)', t: 'dinheiro', nulo: true, dica: 'Deixe vazio se não estiver em promoção.' },
      { k: 'promo_ate', r: 'Promoção válida até', t: 'data', dica: 'Opcional. Depois dessa data volta ao preço normal.' },
      { k: 'tamanhos', r: 'Tamanhos (opcional)', t: 'tamanhos', dica: 'Se tiver tamanhos, o preço de cada tamanho substitui o preço acima.' },
      { k: 'ingredientes', r: 'Ingredientes', t: 'lista', largo: true, dica: 'Ex.: pão brioche, blend 150 g, cheddar, bacon' },
      { k: 'removiveis', r: 'Ingredientes que o cliente pode retirar', t: 'lista', largo: true, dica: 'Ex.: cebola, picles, molho' },
      { k: 'inclui', r: 'O que vem no combo', t: 'lista', largo: true, dica: 'Só para combos. Ex.: hambúrguer, batata média, refrigerante lata' },
      { k: 'adicionais', r: 'Adicionais permitidos', t: 'multi', num: true, op: (adds || []).map(a => [a.id, a.nome + ' (+' + brl(a.preco) + ')']), vazio: 'Cadastre adicionais na seção Adicionais.' },
      { k: 'fotos', r: 'Fotos (a primeira é a capa)', t: 'midias' },
      { k: 'disponivel', r: 'Disponível hoje', t: 'bool', dica: 'Desligado = aparece como esgotado' },
      { k: 'ativo', r: 'Mostrar no site', t: 'bool' },
      { k: 'destaque', r: 'Destaque da casa', t: 'bool', dica: 'Aparece em "Mais pedidos" enquanto não houver vendas' },
      { k: 'novidade', r: 'Novidade', t: 'bool' },
      { k: 'ordem', r: 'Ordem', t: 'numero', dica: 'Menor aparece primeiro' }
    ];

    const editar = p => {
      const valores = p ? Object.assign({}, p, { adicionais: (pa || []).filter(x => x.produto_id === p.id).map(x => x.adicional_id) })
        : { disponivel: true, ativo: true, ordem: 0, tamanhos: [], fotos: [], categoria_id: filtroCat ? Number(filtroCat) : null };
      abrirForm({
        titulo: p ? 'Editar produto' : 'Novo produto', campos, valores, pasta: 'produtos',
        salvar: async d => {
          const ads = d.adicionais; delete d.adicionais;
          if (d.preco_promocional != null && d.preco_promocional >= d.preco) throw new Error('O preço promocional precisa ser menor que o preço normal.');
          const r = p ? await tentar(sb.from('produtos').update(d).eq('id', p.id).select().single()) : await tentar(sb.from('produtos').insert(d).select().single());
          const id = r.data.id;
          await tentar(sb.from('produto_adicionais').delete().eq('produto_id', id));
          if (ads.length) await tentar(sb.from('produto_adicionais').insert(ads.map(a => ({ produto_id: id, adicional_id: a }))));
          ok('Produto salvo.');
          await atualizarSite();
          produtos(el);
        },
        excluir: p ? async () => {
          await tentar(sb.from('produtos').delete().eq('id', p.id));
          ok('Produto excluído.');
          await atualizarSite();
          produtos(el);
        } : null
      });
    };

    el.onclick = e => {
      if (e.target.closest('[data-novo]')) editar(null);
      const b = e.target.closest('[data-editar]');
      if (b) editar(prods.find(p => p.id === Number(b.dataset.editar)));
    };
    el.onchange = async e => {
      const d = e.target.closest('[data-disp]');
      if (!d) return;
      const { error } = await sb.from('produtos').update({ disponivel: d.checked }).eq('id', d.dataset.disp);
      if (error) { d.checked = !d.checked; return ok(PNC.traduzErro(error.message)); }
      const p = prods.find(x => x.id === Number(d.dataset.disp));
      p.disponivel = d.checked;
      d.nextElementSibling.nextElementSibling.textContent = d.checked ? 'Disponível' : 'Esgotado';
      await atualizarSite();
    };
  }

  /* ===================================================================
     CATEGORIAS
  =================================================================== */
  async function categorias(el) {
    const { data: cats, error } = await sb.from('categorias').select('*').order('ordem');
    if (error) return erro(el, error);
    el.innerHTML = `<div class="adm-cab"><div><p class="sobre">Foto de capa + vídeo de cada categoria</p><h1>Categorias</h1></div><button type="button" class="btn amarelo" data-novo>+ Nova categoria</button></div>
      <div class="grade-adm">${cats.map(c => `<button type="button" class="card-adm" data-editar="${c.id}">
        <span class="card-adm-img">${c.capa_url ? `<img src="${esc(c.capa_url)}" alt="">` : '<span class="sm">Sem capa</span>'}${c.video_url ? '<i class="tag-video">vídeo</i>' : ''}</span>
        <b>${esc(c.nome)}</b><small>#categoria/${esc(c.slug)}${c.ativo ? '' : ' · oculta'}</small></button>`).join('')}</div>`;

    const campos = [
      { k: 'nome', r: 'Nome', obrig: true },
      { k: 'slug', r: 'Endereço (slug)', obrig: true, dica: 'Só letras minúsculas, números e hífen. Ex.: hamburgueres' },
      { k: 'descricao', r: 'Texto curto', t: 'area', largo: true },
      { k: 'capa_url', r: 'Foto de capa', t: 'midia', largo: true, dica: 'Vertical ou quadrada, boa qualidade. Aparece enquanto o vídeo carrega.' },
      { k: 'video_url', r: 'Vídeo MP4 (computador)', t: 'midia', aceita: 'video', largo: true, dica: 'MP4 sem áudio, 5 a 10 s, até ~8 MB.' },
      { k: 'video_mobile_url', r: 'Vídeo MP4 vertical (celular, opcional)', t: 'midia', aceita: 'video', largo: true },
      { k: 'foco', r: 'Foco do enquadramento', dica: '"horizontal vertical". Ex.: 50% 50% (centro), 50% 20% (mais para cima)' },
      { k: 'ordem', r: 'Ordem', t: 'numero' },
      { k: 'fotos', r: 'Fotos extras da página', t: 'midias' },
      { k: 'ativo', r: 'Mostrar no site', t: 'bool' }
    ];
    const editar = c => abrirForm({
      titulo: c ? 'Editar categoria' : 'Nova categoria', campos, valores: c || { ativo: true, foco: '50% 50%', ordem: cats.length + 1, fotos: [] }, pasta: 'categorias',
      salvar: async d => {
        d.slug = PNC.slug(d.slug || d.nome);
        c ? await tentar(sb.from('categorias').update(d).eq('id', c.id)) : await tentar(sb.from('categorias').insert(d));
        ok('Categoria salva.'); await atualizarSite(); categorias(el);
      },
      excluir: c ? async () => { await tentar(sb.from('categorias').delete().eq('id', c.id)); ok('Categoria excluída. Os produtos dela ficaram sem categoria.'); await atualizarSite(); categorias(el); } : null
    });
    el.onclick = e => {
      if (e.target.closest('[data-novo]')) editar(null);
      const b = e.target.closest('[data-editar]');
      if (b) editar(cats.find(c => c.id === Number(b.dataset.editar)));
    };
  }

  /* ===================================================================
     ADICIONAIS
  =================================================================== */
  async function adicionais(el) {
    const { data, error } = await sb.from('adicionais').select('*').order('ordem').order('nome');
    if (error) return erro(el, error);
    const linha = a => `<div class="lin lin-add" data-id="${a ? a.id : ''}">
      <input class="campo" data-c="nome" value="${esc(a ? a.nome : '')}" placeholder="Ex.: Bacon extra">
      <input class="campo" data-c="preco" type="number" step="0.01" min="0" value="${a ? esc(a.preco) : ''}" placeholder="Preço">
      <input class="campo" data-c="ordem" type="number" value="${a ? esc(a.ordem) : 0}" title="Ordem">
      <label class="interruptor mini"><input type="checkbox" data-c="disponivel" ${!a || a.disponivel ? 'checked' : ''}><i></i><span>Disponível</span></label>
      <button type="button" class="btn linha pequeno" data-salvar-add>Salvar</button>${a ? '<button type="button" class="btn-texto" data-apagar-add>Excluir</button>' : ''}</div>`;
    el.innerHTML = `<div class="adm-cab"><div><p class="sobre">Bacon, queijo, ovo, molhos...</p><h1>Adicionais</h1></div><button type="button" class="btn amarelo" data-novo>+ Novo adicional</button></div>
      <p class="sm">Depois de criar, escolha em cada produto quais adicionais ele aceita.</p>
      <div class="tabela" id="tabAdd">${data.map(linha).join('') || ''}</div>`;
    el.onclick = async e => {
      if (e.target.closest('[data-novo]')) { $('#tabAdd').insertAdjacentHTML('afterbegin', linha(null)); $('#tabAdd .campo').focus(); }
      const s = e.target.closest('[data-salvar-add]'), x = e.target.closest('[data-apagar-add]');
      const l = (s || x) && (s || x).closest('.lin');
      if (s) {
        const v = c => l.querySelector(`[data-c="${c}"]`);
        const d = { nome: v('nome').value.trim(), preco: Number(v('preco').value || 0), ordem: Number(v('ordem').value || 0), disponivel: v('disponivel').checked };
        if (!d.nome) return ok('Informe o nome.');
        const r = l.dataset.id ? await sb.from('adicionais').update(d).eq('id', l.dataset.id) : await sb.from('adicionais').insert(d);
        if (r.error) return ok(PNC.traduzErro(r.error.message));
        ok('Adicional salvo.'); await atualizarSite(); adicionais(el);
      }
      if (x && confirm('Excluir este adicional? Ele sai de todos os produtos.')) {
        const r = await sb.from('adicionais').delete().eq('id', l.dataset.id);
        if (r.error) return ok(PNC.traduzErro(r.error.message));
        ok('Adicional excluído.'); await atualizarSite(); adicionais(el);
      }
    };
  }

  /* ===================================================================
     EXPLORAR (campanhas)
  =================================================================== */
  async function explorar(el) {
    const [{ data: camps, error }, { data: prods }] = await Promise.all([
      sb.from('campanhas').select('*').order('ordem'),
      sb.from('produtos').select('id, nome').order('nome')
    ]);
    if (error) return erro(el, error);
    el.innerHTML = `<div class="adm-cab"><div><p class="sobre">Campanhas e destaques da home</p><h1>Explorar</h1></div><button type="button" class="btn amarelo" data-novo>+ Nova campanha</button></div>
      ${camps.length ? `<div class="grade-adm">${camps.map(c => `<button type="button" class="card-adm" data-editar="${c.id}"><span class="card-adm-img larga">${c.capa_url ? `<img src="${esc(c.capa_url)}" alt="">` : '<span class="sm">Sem capa</span>'}${c.video_url ? '<i class="tag-video">vídeo</i>' : ''}</span><b>${esc(c.titulo)}</b><small>${esc(c.chamada)}${c.ativo ? '' : ' · oculta'}</small></button>`).join('')}</div>`
        : '<p class="aviso-vazio">Nenhuma campanha. Ex.: "O hambúrguer do mês", "Favoritos da casa", "Combos de inverno". Sem campanhas, a seção Explorar não aparece no site.</p>'}`;
    const campos = [
      { k: 'titulo', r: 'Título', obrig: true },
      { k: 'slug', r: 'Endereço (slug)', dica: 'Gerado a partir do título se ficar vazio' },
      { k: 'chamada', r: 'Linha pequena acima do título', ph: 'Ex.: Só este mês' },
      { k: 'ordem', r: 'Ordem', t: 'numero' },
      { k: 'descricao', r: 'Texto da página', t: 'area', largo: true, linhas: 5 },
      { k: 'capa_url', r: 'Foto de capa', t: 'midia', largo: true },
      { k: 'video_url', r: 'Vídeo MP4', t: 'midia', aceita: 'video', largo: true },
      { k: 'video_mobile_url', r: 'Vídeo MP4 vertical (celular, opcional)', t: 'midia', aceita: 'video', largo: true },
      { k: 'foco', r: 'Foco do enquadramento', dica: 'Ex.: 50% 50%' },
      { k: 'fotos', r: 'Fotos extras', t: 'midias' },
      { k: 'produtos', r: 'Produtos ligados à campanha', t: 'multi', num: true, op: (prods || []).map(p => [p.id, p.nome]) },
      { k: 'ativo', r: 'Mostrar no site', t: 'bool' }
    ];
    const editar = c => abrirForm({
      titulo: c ? 'Editar campanha' : 'Nova campanha', campos, valores: c || { ativo: true, foco: '50% 50%', ordem: camps.length + 1, fotos: [], produtos: [] }, pasta: 'campanhas',
      salvar: async d => {
        d.slug = PNC.slug(d.slug || d.titulo);
        c ? await tentar(sb.from('campanhas').update(d).eq('id', c.id)) : await tentar(sb.from('campanhas').insert(d));
        ok('Campanha salva.'); await atualizarSite(); explorar(el);
      },
      excluir: c ? async () => { await tentar(sb.from('campanhas').delete().eq('id', c.id)); ok('Campanha excluída.'); await atualizarSite(); explorar(el); } : null
    });
    el.onclick = e => {
      if (e.target.closest('[data-novo]')) editar(null);
      const b = e.target.closest('[data-editar]');
      if (b) editar(camps.find(c => c.id === Number(b.dataset.editar)));
    };
  }

  /* ===================================================================
     ENTREGA E TAXAS
  =================================================================== */
  async function entrega(el) {
    const [{ data: cfg, error }, { data: bairros }] = await Promise.all([
      sb.from('configuracoes').select('*').eq('id', 1).single(),
      sb.from('bairros').select('*').order('nome')
    ]);
    if (error) return erro(el, error);
    const campos = [
      { k: 'entrega_ativa', r: 'Fazemos entrega', t: 'bool' },
      { k: 'retirada_ativa', r: 'Cliente pode retirar no balcão', t: 'bool' },
      { k: 'tempo_entrega', r: 'Tempo de entrega (texto)', ph: 'Ex.: 40 a 60 min' },
      { k: 'tempo_retirada', r: 'Tempo para retirada (texto)', ph: 'Ex.: 20 a 30 min' },
      { k: 'pedido_minimo', r: 'Pedido mínimo (R$)', t: 'dinheiro', dica: '0 = sem mínimo' },
      { k: 'taxa_padrao', r: 'Taxa padrão (R$)', t: 'dinheiro', nulo: true, dica: 'Usada para bairros que não estão na lista. Vazio = só entrega nos bairros da lista.' }
    ];
    const linhaB = b => `<div class="lin lin-bairro" data-id="${b ? b.id : ''}"><input class="campo" data-c="nome" value="${esc(b ? b.nome : '')}" placeholder="Bairro"><input class="campo" data-c="taxa" type="number" step="0.01" min="0" value="${b ? esc(b.taxa) : ''}" placeholder="Taxa (R$)"><label class="interruptor mini"><input type="checkbox" data-c="ativo" ${!b || b.ativo ? 'checked' : ''}><i></i><span>Ativo</span></label><button type="button" class="btn linha pequeno" data-salvar-b>Salvar</button>${b ? '<button type="button" class="btn-texto" data-apagar-b>Excluir</button>' : ''}</div>`;
    el.innerHTML = `<div class="adm-cab"><div><p class="sobre">Como o cliente recebe</p><h1>Entrega e taxas</h1></div></div>
      <form class="painel-bloco grid-end" id="formEnt" novalidate>${campos.map(f => campo(f, cfg[f.k])).join('')}<div class="g2"><button class="btn amarelo" type="submit">Salvar</button></div></form>
      <div class="adm-cab menor"><div><h2>Bairros atendidos</h2><p class="sm">Sem bairros cadastrados, todos pagam a taxa padrão (ou entrega grátis se ela estiver vazia).</p></div><button type="button" class="btn linha" data-novo-b>+ Bairro</button></div>
      <div class="tabela" id="tabB">${(bairros || []).map(linhaB).join('')}</div>`;
    $('#formEnt').addEventListener('submit', async e => {
      e.preventDefault();
      const { error: er } = await sb.from('configuracoes').update(lerForm(e.target, campos)).eq('id', 1);
      if (er) return ok(PNC.traduzErro(er.message));
      ok('Configurações de entrega salvas.'); await atualizarSite();
    });
    el.onclick = async e => {
      if (e.target.closest('[data-novo-b]')) { $('#tabB').insertAdjacentHTML('afterbegin', linhaB(null)); $('#tabB .campo').focus(); }
      const s = e.target.closest('[data-salvar-b]'), x = e.target.closest('[data-apagar-b]');
      const l = (s || x) && (s || x).closest('.lin');
      if (s) {
        const v = c => l.querySelector(`[data-c="${c}"]`);
        const d = { nome: v('nome').value.trim(), taxa: Number(v('taxa').value || 0), ativo: v('ativo').checked };
        if (!d.nome) return ok('Informe o bairro.');
        const r = l.dataset.id ? await sb.from('bairros').update(d).eq('id', l.dataset.id) : await sb.from('bairros').insert(d);
        if (r.error) return ok(PNC.traduzErro(r.error.message));
        ok('Bairro salvo.'); await atualizarSite(); entrega(el);
      }
      if (x && confirm('Excluir este bairro?')) {
        const r = await sb.from('bairros').delete().eq('id', l.dataset.id);
        if (r.error) return ok(PNC.traduzErro(r.error.message));
        await atualizarSite(); entrega(el);
      }
    };
  }

  /* ===================================================================
     CUPONS E PONTOS DE FIDELIDADE
     Tudo passa pelas funções do banco (migração 004): elas conferem se quem
     pede é administrador e validam os valores. Nenhum cupom vem pronto.
  =================================================================== */
  const TIPO_CUPOM = { percentual: 'Desconto em %', frete_gratis: 'Entrega grátis' };
  const CAMPOS_CUPOM = [
    { k: 'codigo', r: 'Código', obrig: true, ph: 'Ex.: BEMVINDO', dica: 'O que o cliente digita. Letras, números, - ou _, sem espaço.' },
    { k: 'descricao', r: 'Descrição (aparece para o cliente)', ph: 'Ex.: 10% no primeiro pedido' },
    { k: 'tipo', r: 'Tipo', t: 'select', op: [['percentual', 'Desconto em %'], ['frete_gratis', 'Entrega grátis']] },
    { k: 'valor', r: 'Desconto (%)', t: 'numero', nulo: true, dica: 'Só para desconto em %. Ex.: 10' },
    { k: 'desconto_maximo', r: 'Desconto máximo (R$)', t: 'dinheiro', nulo: true, dica: 'Vazio = sem limite' },
    { k: 'pedido_minimo', r: 'Pedido mínimo (R$)', t: 'dinheiro', dica: 'Valor dos produtos. 0 = qualquer valor' },
    { k: 'limite_total', r: 'Limite de usos no total', t: 'numero', nulo: true, dica: 'Vazio = sem limite' },
    { k: 'limite_por_cliente', r: 'Usos por cliente', t: 'numero', nulo: true, dica: 'Vazio = sem limite' },
    { k: 'inicio', r: 'Começa a valer em', t: 'data', dica: 'Vazio = já vale' },
    { k: 'fim', r: 'Vale até', t: 'data', dica: 'Vazio = sem prazo' },
    { k: 'so_primeiro_pedido', r: 'Só no primeiro pedido', t: 'bool', dica: 'Vale só para quem nunca fez pedido' },
    { k: 'ativo', r: 'Cupom ativo', t: 'bool' }
  ];

  function regrasCupom(c) {
    const r = [];
    if (Number(c.pedido_minimo) > 0) r.push('mínimo ' + brl(c.pedido_minimo));
    if (c.desconto_maximo) r.push('até ' + brl(c.desconto_maximo));
    if (c.so_primeiro_pedido) r.push('só 1º pedido');
    if (c.limite_por_cliente) r.push(c.limite_por_cliente === 1 ? '1 uso por cliente' : c.limite_por_cliente + ' usos por cliente');
    if (c.fim) r.push('até ' + new Date(c.fim).toLocaleDateString('pt-BR', { timeZone: 'America/Sao_Paulo' }));
    if (c.inicio && new Date(c.inicio) > new Date()) r.push('começa ' + new Date(c.inicio).toLocaleDateString('pt-BR', { timeZone: 'America/Sao_Paulo' }));
    return r.join(' · ');
  }

  function situacaoCupom(c) {
    if (!c.ativo) return '<span class="st cancelado">Desativado</span>';
    if (c.fim && new Date(c.fim) <= new Date()) return '<span class="st cancelado">Expirado</span>';
    if (c.limite_total && c.usos >= c.limite_total) return '<span class="st cancelado">Esgotado</span>';
    if (c.inicio && new Date(c.inicio) > new Date()) return '<span class="st andamento">Agendado</span>';
    return '<span class="st feito">Ativo</span>';
  }

  async function cupons(el) {
    const [{ data: lista, error }, { data: fid, error: e2 }, { data: resumo }] = await Promise.all([
      sb.rpc('admin_listar_cupons'),
      sb.from('fidelidade_config').select('*').eq('id', 1).maybeSingle(),
      sb.rpc('admin_resumo_fidelidade')
    ]);
    if (error || e2) return erro(el, error || e2);
    const f = fid || {};
    const camposFid = [
      { k: 'ativo', r: 'Programa de pontos ligado', t: 'bool', largo: true, dica: 'Desligado: ninguém ganha nem usa pontos, mas os saldos ficam guardados.' },
      { k: 'pontos_por_real', r: 'Pontos por real gasto', t: 'dinheiro', nulo: true, dica: 'Sobre os produtos, sem a taxa de entrega. Ex.: 1' },
      { k: 'pontos_para_resgate', r: 'Pontos para trocar', t: 'numero', nulo: true, dica: 'Tamanho de cada troca. Ex.: 100' },
      { k: 'valor_resgate', r: 'Desconto por troca (R$)', t: 'dinheiro', nulo: true, dica: 'Quanto vale cada troca. Ex.: 5' }
    ];
    const r = resumo || {};
    el.innerHTML = `<div class="adm-cab"><div><p class="sobre">Promoções</p><h1>Cupons e pontos</h1></div><button type="button" class="btn amarelo" data-novo-cupom>+ Novo cupom</button></div>
      <div class="tabela cupons-tab">${(lista || []).length ? lista.map(c => `<div class="lin lin-cupom" data-id="${c.id}">
          <div class="cup-cod"><strong>${esc(c.codigo)}</strong><small>${c.tipo === 'percentual' ? esc(String(Number(c.valor)).replace('.', ',')) + '% de desconto' : 'Entrega grátis'}${c.descricao ? ' · ' + esc(c.descricao) : ''}</small></div>
          <div class="cup-regras">${esc(regrasCupom(c)) || '<span class="sm">Sem restrições</span>'}</div>
          <div class="cup-usos"><b>${Number(c.usos)}${c.limite_total ? ' / ' + c.limite_total : ''}</b><small>${Number(c.usos) === 1 ? 'uso' : 'usos'} · ${brl(c.desconto_total)} em desconto</small></div>
          <div>${situacaoCupom(c)}</div>
          <div class="cup-acoes"><button type="button" class="btn linha pequeno" data-editar-cupom="${c.id}">Editar</button>
            <button type="button" class="btn-texto" data-ativar-cupom="${c.id}" data-ativo="${c.ativo ? '1' : ''}">${c.ativo ? 'Desativar' : 'Ativar'}</button></div>
        </div>`).join('') : '<p class="aviso-vazio">Nenhum cupom criado. Clique em "+ Novo cupom" para criar o primeiro.</p>'}</div>

      <div class="adm-cab menor"><div><h2>Pontos de fidelidade</h2><p class="sm">O cliente ganha pontos quando o pedido é entregue e troca por desconto no checkout. Pedido cancelado devolve os pontos usados.</p></div></div>
      ${f.ativo || Number(r.pontos_ganhos) > 0 ? `<div class="fid-resumo">
        <div><b>${Number(r.clientes_com_pontos || 0)}</b><small>${Number(r.clientes_com_pontos) === 1 ? 'cliente com pontos' : 'clientes com pontos'}</small></div>
        <div><b>${Number(r.pontos_em_aberto || 0)}</b><small>pontos guardados</small></div>
        <div><b>${brl(r.desconto_dado || 0)}</b><small>de desconto em pontos</small></div></div>` : ''}
      <form class="painel-bloco grid-end" id="formFid" novalidate>${camposFid.map(c => campo(c, f[c.k])).join('')}
        <p class="sm g2" id="fidExemplo"></p>
        <p class="msg erro g2" id="fidMsg" hidden></p>
        <div class="g2"><button class="btn amarelo" type="submit">Salvar programa de pontos</button></div></form>`;

    const formFid = $('#formFid');
    const exemplo = () => {
      const d = lerForm(formFid, camposFid);
      const t = $('#fidExemplo');
      if (!d.pontos_por_real || !d.pontos_para_resgate || !d.valor_resgate) { t.textContent = 'Preencha os três valores para ver um exemplo.'; return; }
      const ganho = Math.floor(50 * d.pontos_por_real);
      const pedidos = Math.ceil(d.pontos_para_resgate / Math.max(1, ganho));
      t.innerHTML = `Exemplo: um pedido de ${brl(50)} em produtos dá <b>${ganho} pontos</b>. Com <b>${d.pontos_para_resgate} pontos</b> (cerca de ${pedidos} ${pedidos === 1 ? 'pedido' : 'pedidos'} desse valor) o cliente troca por <b>${brl(d.valor_resgate)}</b> de desconto.`;
    };
    formFid.addEventListener('input', exemplo);
    formFid.addEventListener('change', exemplo);
    exemplo();
    formFid.addEventListener('submit', async e => {
      e.preventDefault();
      const d = lerForm(formFid, camposFid);
      const m = $('#fidMsg');
      const { error: er } = await sb.rpc('admin_salvar_fidelidade', {
        p_ativo: d.ativo, p_pontos_por_real: d.pontos_por_real,
        p_pontos_para_resgate: d.pontos_para_resgate == null ? null : Math.round(d.pontos_para_resgate), p_valor_resgate: d.valor_resgate
      });
      if (er) { m.textContent = PNC.traduzErro(er.message); m.hidden = false; return; }
      m.hidden = true;
      ok(d.ativo ? 'Programa de pontos salvo e ligado.' : 'Programa de pontos salvo (desligado).');
      cupons(el);
    });

    const editarCupom = c => abrirForm({
      titulo: c ? 'Editar cupom ' + c.codigo : 'Novo cupom',
      campos: CAMPOS_CUPOM,
      valores: c || { tipo: 'percentual', pedido_minimo: 0, limite_por_cliente: 1, ativo: true },
      salvar: async d => {
        const { error: er } = await sb.rpc('admin_salvar_cupom', {
          p_id: c ? c.id : null, p_codigo: d.codigo, p_descricao: d.descricao, p_tipo: d.tipo,
          p_valor: d.tipo === 'frete_gratis' ? 0 : d.valor, p_desconto_maximo: d.desconto_maximo, p_pedido_minimo: d.pedido_minimo,
          p_so_primeiro_pedido: d.so_primeiro_pedido,
          p_limite_total: d.limite_total == null ? null : Math.round(d.limite_total),
          p_limite_por_cliente: d.limite_por_cliente == null ? null : Math.round(d.limite_por_cliente),
          p_inicio: d.inicio, p_fim: d.fim, p_ativo: d.ativo
        });
        if (er) throw er;
        ok(c ? 'Cupom atualizado.' : 'Cupom criado.');
        cupons(el);
      }
    });

    el.onclick = async e => {
      if (e.target.closest('[data-novo-cupom]')) return editarCupom(null);
      const ed = e.target.closest('[data-editar-cupom]');
      if (ed) return editarCupom((lista || []).find(c => String(c.id) === ed.dataset.editarCupom));
      const at = e.target.closest('[data-ativar-cupom]');
      if (at) {
        const ligar = !at.dataset.ativo;
        if (!ligar && !confirm('Desativar este cupom? Quem tentar usar vai ver que ele não está mais ativo.')) return;
        at.disabled = true;
        const { error: er } = await sb.rpc('admin_ativar_cupom', { p_id: Number(at.dataset.ativarCupom), p_ativo: ligar });
        if (er) { at.disabled = false; return ok(PNC.traduzErro(er.message)); }
        ok(ligar ? 'Cupom ativado.' : 'Cupom desativado.');
        cupons(el);
      }
    };
  }

  /* ===================================================================
     USUÁRIOS — perfis, suspensão e histórico
     Tudo passa pelas funções admin_* do banco (migração 001), que conferem
     se quem pede é administrador. A tela só mostra e envia os pedidos.
  =================================================================== */
  const PAPEIS = PNC.PAPEIS;
  const PAPEL_DESC = {
    cliente: 'Faz pedidos pelo site e acompanha as entregas.',
    entregador: 'Recebe acesso às entregas da hamburgueria.',
    cozinha: 'Recebe acesso aos pedidos da cozinha.'
  };
  const ACAO = { papel: 'Perfil alterado', suspensao: 'Conta suspensa', reativacao: 'Conta reativada', curso_adicionado: 'Curso adicionado', curso_removido: 'Curso removido' };
  const filtroUsu = { busca: '', papel: '', situacao: '', aba: 'lista' };
  const dataCurta = d => d ? new Date(d).toLocaleDateString('pt-BR', { timeZone: 'America/Sao_Paulo' }) : '—';
  const seloPapel = p => `<span class="papel ${esc(p)}">${esc(PAPEIS[p] || p)}</span>`;
  const seloSituacao = u => u.ativo ? '<span class="st feito">Ativa</span>' : '<span class="st cancelado">Suspensa</span>';
  const valorAuditoria = (acao, v) => !v ? '—' : acao === 'papel' ? (PAPEIS[v] || v) : v === 'ativa' ? 'Ativa' : v === 'suspensa' ? 'Suspensa' : v;

  async function usuarios(el) {
    const meuId = PNC.sessao.user && PNC.sessao.user.id;
    const protegido = u => u.papel === 'admin' || u.id === meuId;
    let lista = [];
    let espera = 0;

    el.innerHTML = `<div class="adm-cab"><div><p class="sobre">Clientes, entregadores e cozinha</p><h1>Usuários</h1></div>
      <div class="filtros">${[['lista', 'Usuários'], ['historico', 'Histórico de alterações']].map(a => `<button type="button" class="chip ${a[0] === filtroUsu.aba ? 'on' : ''}" data-aba-usu="${a[0]}">${a[1]}</button>`).join('')}</div></div>
      <div id="usuCorpo"></div>`;
    const corpo = $('#usuCorpo');

    /* ---------- aba: lista ---------- */
    const montarLista = () => {
      corpo.innerHTML = `<div class="adm-filtros usu-filtros">
          <input class="campo" id="bUsu" type="search" placeholder="Buscar por nome ou e-mail" value="${esc(filtroUsu.busca)}" aria-label="Buscar usuário">
          <select class="campo" id="fSit" aria-label="Situação da conta"><option value="">Todas as situações</option><option value="ativas" ${filtroUsu.situacao === 'ativas' ? 'selected' : ''}>Ativas</option><option value="suspensas" ${filtroUsu.situacao === 'suspensas' ? 'selected' : ''}>Suspensas</option></select>
        </div>
        <div class="filtros usu-papeis">${[['', 'Todos'], ['cliente', 'Clientes'], ['entregador', 'Entregadores'], ['cozinha', 'Cozinha'], ['admin', 'Administradores']].map(p => `<button type="button" class="chip ${p[0] === filtroUsu.papel ? 'on' : ''}" data-papel-filtro="${p[0]}">${p[1]}</button>`).join('')}</div>
        <div id="tabUsu"><p class="carregando">Carregando...</p></div>`;
      $('#bUsu').addEventListener('input', e => { filtroUsu.busca = e.target.value; clearTimeout(espera); espera = setTimeout(carregar, 300); });
      $('#fSit').addEventListener('change', e => { filtroUsu.situacao = e.target.value; carregar(); });
      carregar();
    };

    const carregar = async () => {
      const alvo = $('#tabUsu');
      if (!alvo) return;
      const { data, error } = await sb.rpc('admin_listar_usuarios', { p_busca: filtroUsu.busca.trim(), p_papel: filtroUsu.papel, p_situacao: filtroUsu.situacao });
      if (!$('#tabUsu')) return;
      if (error) return erro(alvo, error);
      lista = data || [];
      alvo.innerHTML = lista.length ? `<p class="sm usu-contagem">${lista.length} ${lista.length > 1 ? 'usuários' : 'usuário'}</p>
        <div class="tab-usu" role="table" aria-label="Usuários cadastrados">
          <div class="tu-cab" role="row"><span role="columnheader">Nome</span><span role="columnheader">E-mail</span><span role="columnheader">Perfil</span><span role="columnheader">Cadastro</span><span role="columnheader">Situação</span><span role="columnheader"><span class="vh">Ações</span></span></div>
          ${lista.map(u => `<div class="tu-lin${u.ativo ? '' : ' suspensa'}" role="row">
            <span class="tu-nome" role="cell"><b>${esc(u.nome || 'Sem nome')}</b>${u.telefone ? `<small>${esc(u.telefone)}</small>` : ''}</span>
            <span class="tu-email" role="cell">${esc(u.email || '—')}</span>
            <span class="tu-papel" role="cell">${seloPapel(u.papel)}</span>
            <span class="tu-data" role="cell"><small class="tu-rot">Cadastro </small>${dataCurta(u.criado_em)}</span>
            <span class="tu-sit" role="cell">${seloSituacao(u)}</span>
            <span class="tu-acoes" role="cell">${protegido(u) ? `<small class="tu-protegido">${u.id === meuId ? 'Sua conta' : 'Protegido'}</small>` : `<button type="button" class="btn linha pequeno" data-alterar-papel="${esc(u.id)}">Alterar perfil</button>`}<button type="button" class="btn-texto" data-detalhes-usu="${esc(u.id)}">Ver detalhes</button></span>
          </div>`).join('')}
        </div>` : '<p class="aviso-vazio">Nenhum usuário encontrado com esses filtros.</p>';
    };

    /* ---------- aba: histórico ---------- */
    const montarHistorico = async () => {
      corpo.innerHTML = '<p class="carregando">Carregando...</p>';
      const { data, error } = await sb.rpc('admin_historico_perfis', { p_usuario: null, p_limite: 300 });
      if (error) return erro(corpo, error);
      corpo.innerHTML = (data || []).length ? `<div class="tab-usu tab-hist" role="table" aria-label="Histórico de alterações de perfil">
          <div class="tu-cab" role="row"><span role="columnheader">Data</span><span role="columnheader">Usuário</span><span role="columnheader">Alteração</span><span role="columnheader">Feita por</span><span role="columnheader">Motivo</span></div>
          ${data.map(h => `<div class="tu-lin" role="row">
            <span role="cell">${PNC.dataHora(h.criado_em)}</span>
            <span class="tu-nome" role="cell"><b>${esc(h.usuario_nome || 'Sem nome')}</b><small>${esc(h.usuario_email || '')}</small></span>
            <span role="cell"><b class="hist-acao">${ACAO[h.acao] || esc(h.acao)}</b><small class="hist-de">${esc(valorAuditoria(h.acao, h.valor_anterior))} → ${esc(valorAuditoria(h.acao, h.valor_novo))}</small></span>
            <span role="cell">${esc(h.alterado_por_nome || '—')}</span>
            <span class="hist-motivo" role="cell">${esc(h.motivo || '—')}</span>
          </div>`).join('')}
        </div>` : '<p class="aviso-vazio">Nenhuma alteração de perfil registrada ainda.</p>';
    };

    const recarregarAba = () => filtroUsu.aba === 'historico' ? montarHistorico() : montarLista();

    /* ---------- janela: alterar perfil ---------- */
    const abrirAlterar = u => {
      const opcoes = ['cliente', 'entregador', 'cozinha'];
      PNC.abrirJanela(`<button class="j-fechar" type="button" data-fechar-janela aria-label="Fechar">${I.fechar}</button>
        <form class="adm-form" id="formPapel" novalidate>
          <div class="adm-form-cab"><h2 id="janelaTitulo">Alterar perfil</h2><p class="sm">${esc(u.nome || 'Sem nome')} · ${esc(u.email || '')}</p></div>
          <div class="adm-form-corpo">
            <p class="papel-atual">Perfil atual: ${seloPapel(u.papel)}</p>
            <fieldset class="opcoes-papel"><legend>Novo perfil</legend>
              <div class="opcoes">${opcoes.map(p => `<label class="opcao"><input type="radio" name="papel" value="${p}" ${p === u.papel ? 'disabled' : ''}><span><strong>${PAPEIS[p]}${p === u.papel ? ' (atual)' : ''}</strong><small>${PAPEL_DESC[p]}</small></span></label>`).join('')}</div>
            </fieldset>
            <label class="cp papel-motivo"><span>Motivo (opcional)</span><input class="campo" name="motivo" maxlength="300" placeholder="Ex.: vai trabalhar nas entregas de fim de semana"></label>
            <p class="sm">Pedidos, endereços e dados da conta continuam guardados. A mudança vale a partir do próximo acesso da pessoa ao site.</p>
          </div>
          <div class="adm-form-rodape"><p class="msg erro" id="papelMsg" hidden></p><span></span>
            <div class="botoes-fim"><button type="button" class="btn linha" data-fechar-janela>Cancelar</button><button class="btn amarelo" type="submit">Confirmar alteração</button></div></div>
        </form>`, 'janela-form janela-media');
      const form = $('#formPapel');
      form.addEventListener('change', () => { $('#papelMsg').hidden = true; });
      form.addEventListener('submit', async e => {
        e.preventDefault();
        const msg = t => { const m = $('#papelMsg'); m.textContent = t; m.hidden = !t; };
        const novo = (form.querySelector('[name=papel]:checked') || {}).value;
        if (!novo) return msg('Escolha o novo perfil.');
        const btn = form.querySelector('[type=submit]');
        btn.disabled = true;
        const { error } = await sb.rpc('admin_alterar_papel', { p_usuario: u.id, p_papel: novo, p_motivo: form.motivo.value.trim() });
        btn.disabled = false;
        if (error) return msg(PNC.traduzErro(error.message));
        PNC.fecharJanela();
        ok(`${u.nome || 'Usuário'} agora tem o perfil ${PAPEIS[novo]}.`);
        carregar();
      });
    };

    /* ---------- janela: detalhes ---------- */
    const abrirDetalhes = async u => {
      PNC.abrirJanela(`<button class="j-fechar" type="button" data-fechar-janela aria-label="Fechar">${I.fechar}</button>
        <div class="adm-form"><div class="adm-form-cab"><h2 id="janelaTitulo">${esc(u.nome || 'Sem nome')}</h2><p class="sm">${esc(u.email || '')}</p></div>
        <div class="adm-form-corpo" id="detUsu"><p class="carregando">Carregando...</p></div></div>`, 'janela-form janela-media');
      const [hist, peds] = await Promise.all([
        sb.rpc('admin_historico_perfis', { p_usuario: u.id, p_limite: 50 }),
        sb.from('pedidos').select('id, codigo, criado_em, status, total').eq('usuario_id', u.id).order('criado_em', { ascending: false }).limit(5)
      ]);
      const alvo = $('#detUsu');
      if (!alvo) return;
      if (hist.error) return erro(alvo, hist.error);
      const podeSuspender = !protegido(u);
      alvo.innerHTML = `<dl class="det-dados">
          <dt>Telefone</dt><dd>${esc(u.telefone || '—')}</dd>
          <dt>Perfil</dt><dd>${seloPapel(u.papel)}</dd>
          <dt>Cadastro</dt><dd>${dataCurta(u.criado_em)}</dd>
          <dt>Situação</dt><dd>${seloSituacao(u)}${!u.ativo && u.suspenso_motivo ? `<small class="det-motivo">Motivo: ${esc(u.suspenso_motivo)}</small>` : ''}</dd>
          <dt>Pedidos</dt><dd>${u.pedidos || 0}${u.ultimo_pedido ? ` · último em ${dataCurta(u.ultimo_pedido)}` : ''}</dd>
        </dl>
        ${u.papel === 'entregador' ? '<section class="det-sec" id="detEnt"><h3>Perfil de entregador</h3><p class="carregando">Carregando...</p></section>' : ''}
        <section class="det-sec"><h3>Últimos pedidos</h3>${(peds.data || []).length ? `<ul class="det-lista">${peds.data.map(p => `<li><span><b>#${esc(p.codigo)}</b><small>${PNC.dataHora(p.criado_em)} · ${PNC.STATUS[p.status] || esc(p.status)}</small></span><b>${brl(p.total)}</b></li>`).join('')}</ul>` : '<p class="sm">Nenhum pedido ainda.</p>'}</section>
        <section class="det-sec"><h3>Histórico de alterações</h3>${(hist.data || []).length ? `<ul class="det-lista">${hist.data.map(h => `<li><span><b>${ACAO[h.acao] || esc(h.acao)}: ${esc(valorAuditoria(h.acao, h.valor_anterior))} → ${esc(valorAuditoria(h.acao, h.valor_novo))}</b><small>${PNC.dataHora(h.criado_em)} · por ${esc(h.alterado_por_nome || '—')}${h.motivo ? ' · ' + esc(h.motivo) : ''}</small></span></li>`).join('')}</ul>` : '<p class="sm">Nenhuma alteração registrada.</p>'}</section>
        ${podeSuspender ? `<section class="det-sec zona-risco"><h3>${u.ativo ? 'Suspender conta' : 'Reativar conta'}</h3>
          <p class="sm">${u.ativo ? 'A conta suspensa continua com todos os dados e pedidos guardados, mas não consegue fazer novos pedidos.' : 'A pessoa volta a poder fazer pedidos normalmente.'}</p>
          <label class="cp"><span>Motivo${u.ativo ? ' (obrigatório)' : ' (opcional)'}</span><input class="campo" id="motivoSusp" maxlength="300"></label>
          <p class="msg erro" id="suspMsg" hidden></p>
          <button type="button" class="btn ${u.ativo ? 'perigo' : 'escuro'}" id="btnSusp">${u.ativo ? 'Suspender conta' : 'Reativar conta'}</button></section>` : ''}`;
      if (u.papel === 'entregador') montarEntregador(u);
      const btn = $('#btnSusp');
      if (!btn) return;
      btn.addEventListener('click', async () => {
        const motivo = $('#motivoSusp').value.trim();
        const msg = t => { const m = $('#suspMsg'); m.textContent = t; m.hidden = !t; };
        if (u.ativo && motivo.length < 3) return msg('Informe o motivo da suspensão.');
        if (u.ativo && !confirm(`Suspender a conta de ${u.nome || u.email}?`)) return;
        btn.disabled = true;
        const { error } = await sb.rpc('admin_suspender_usuario', { p_usuario: u.id, p_suspender: u.ativo, p_motivo: motivo });
        btn.disabled = false;
        if (error) return msg(PNC.traduzErro(error.message));
        PNC.fecharJanela();
        ok(u.ativo ? 'Conta suspensa.' : 'Conta reativada.');
        carregar();
      });
    };

    /* perfil de entregador: o admin vê tudo e cadastra os cursos */
    const montarEntregador = async u => {
      const alvo = $('#detEnt');
      if (!alvo) return;
      const { data: e, error } = await sb.rpc('admin_entregador_perfil', { p_usuario: u.id });
      if (!$('#detEnt')) return;
      if (error) return erro(alvo, error);
      const hoje = new Date().toLocaleDateString('en-CA', { timeZone: 'America/Sao_Paulo' });
      alvo.innerHTML = `<h3>Perfil de entregador</h3>
        <div class="det-ent">${PNC.cartaoEntregador ? PNC.cartaoEntregador(e, 'Perfil público') : ''}</div>
        <p class="sm">${e.veiculo_placa ? `Placa: <b>${esc(e.veiculo_placa)}</b> · ${e.mostrar_placa ? 'aparece para o cliente' : 'escondida do cliente'}. ` : ''}O cliente vê só o primeiro nome. Foto, "sobre mim" e veículo são preenchidos pelo entregador.</p>
        <h4>Cursos</h4>
        ${(e.cursos || []).length ? `<ul class="det-lista">${e.cursos.map(c => `<li><span><b>${esc(c.nome)}</b><small>${[c.instituicao, c.concluido_em ? 'concluído em ' + dataCurta(c.concluido_em + 'T12:00:00') : ''].filter(Boolean).map(esc).join(' · ') || 'Sem detalhes'}</small></span><button type="button" class="btn-texto" data-remover-curso="${Number(c.id)}" data-nome-curso="${esc(c.nome)}">Remover</button></li>`).join('')}</ul>` : '<p class="sm">Nenhum curso cadastrado.</p>'}
        <form class="det-curso" id="formCurso" novalidate>
          <label class="cp"><span>Nome do curso</span><input class="campo" name="nome" maxlength="120" required placeholder="Como está no certificado"></label>
          <label class="cp"><span>Instituição (opcional)</span><input class="campo" name="instituicao" maxlength="120"></label>
          <label class="cp"><span>Concluído em (opcional)</span><input class="campo" name="data" type="date" max="${hoje}"></label>
          <p class="msg erro" id="cursoMsg" hidden></p>
          <button class="btn escuro" type="submit">Adicionar curso</button>
        </form>`;
      const msg = t => { const m = $('#cursoMsg'); if (m) { m.textContent = t; m.hidden = !t; } };
      $('#formCurso').addEventListener('submit', async ev => {
        ev.preventDefault();
        const f = ev.target;
        if (f.nome.value.trim().length < 2) return msg('Informe o nome do curso.');
        const b = f.querySelector('[type=submit]');
        b.disabled = true;
        const { error: er } = await sb.rpc('admin_adicionar_curso', { p_usuario: u.id, p_nome: f.nome.value.trim(), p_instituicao: f.instituicao.value.trim(), p_concluido_em: f.data.value || null });
        b.disabled = false;
        if (er) return msg(PNC.traduzErro(er.message));
        ok('Curso adicionado.');
        montarEntregador(u);
      });
      alvo.querySelectorAll('[data-remover-curso]').forEach(b => b.addEventListener('click', async () => {
        if (!confirm(`Remover o curso "${b.dataset.nomeCurso}"?`)) return;
        b.disabled = true;
        const { error: er } = await sb.rpc('admin_remover_curso', { p_curso: Number(b.dataset.removerCurso) });
        if (er) { b.disabled = false; return msg(PNC.traduzErro(er.message)); }
        ok('Curso removido.');
        montarEntregador(u);
      }));
    };

    el.onclick = e => {
      const aba = e.target.closest('[data-aba-usu]');
      if (aba) { filtroUsu.aba = aba.dataset.abaUsu; $$('[data-aba-usu]', el).forEach(b => b.classList.toggle('on', b === aba)); return recarregarAba(); }
      const pf = e.target.closest('[data-papel-filtro]');
      if (pf) { filtroUsu.papel = pf.dataset.papelFiltro; $$('[data-papel-filtro]', el).forEach(b => b.classList.toggle('on', b === pf)); return carregar(); }
      const ap = e.target.closest('[data-alterar-papel]');
      if (ap) { const u = lista.find(x => x.id === ap.dataset.alterarPapel); if (u) abrirAlterar(u); return; }
      const dt = e.target.closest('[data-detalhes-usu]');
      if (dt) { const u = lista.find(x => x.id === dt.dataset.detalhesUsu); if (u) abrirDetalhes(u); }
    };

    recarregarAba();
  }

  /* ===================================================================
     CONFIGURAÇÕES
  =================================================================== */
  async function config(el) {
    const { data: cfg, error } = await sb.from('configuracoes').select('*').eq('id', 1).single();
    if (error) return erro(el, error);
    const grupos = [
      ['Loja', [
        { k: 'aceitando_pedidos', r: 'Recebendo pedidos pelo site', t: 'bool', largo: true, dica: 'Desligue para pausar os pedidos na hora (ex.: cozinha cheia).' },
        { k: 'nome_loja', r: 'Nome da loja' },
        { k: 'whatsapp', r: 'WhatsApp da loja', ph: '5547999999999', dica: 'Só números, com 55 + DDD.' },
        { k: 'instagram', r: 'Link do Instagram', ph: 'https://instagram.com/...' },
        { k: 'endereco', r: 'Endereço da loja', largo: true },
        { k: 'aviso', r: 'Faixa de avisos no topo do site', largo: true, dica: 'Vazio = a faixa não aparece.' },
        { k: 'sobre', r: 'Sobre a hamburgueria (texto da home)', t: 'area', largo: true, linhas: 4 }
      ]],
      ['Horários', [
        { k: 'horarios', r: 'Dias e horários de funcionamento', t: 'horarios', dica: 'Fora destes horários o site não aceita pedidos. Sem nenhum dia marcado, aceita a qualquer hora.' }
      ]],
      ['Pagamento', [
        { k: 'pagamentos', r: 'Formas de pagamento aceitas', t: 'pagamentos' },
        { k: 'chave_pix', r: 'Chave PIX', largo: true, dica: 'Aparece para o cliente depois de confirmar o pedido com PIX.' }
      ]],
      ['Banner principal', [
        { k: 'banner_titulo', r: 'Título do banner', ph: 'Pão na Chapa' },
        { k: 'banner_texto', r: 'Texto do banner', ph: 'Hambúrgueres, porções, bebidas...' },
        { k: 'banner_video_url', r: 'Vídeo MP4 (computador)', t: 'midia', aceita: 'video', largo: true, dica: 'Widescreen (16:9), sem áudio, 5 a 15 s.' },
        { k: 'banner_video_mobile_url', r: 'Vídeo MP4 vertical (celular, opcional)', t: 'midia', aceita: 'video', largo: true, dica: 'Ex.: 1080×1350 ou 1080×1920. Sem ele, o celular usa o vídeo acima com enquadramento ajustado.' },
        { k: 'banner_poster_url', r: 'Foto de capa do banner', t: 'midia', largo: true, dica: 'Aparece enquanto o vídeo carrega.' },
        { k: 'banner_foco', r: 'Foco do enquadramento', dica: 'Ex.: 50% 50% (centro)' }
      ]]
    ];
    el.innerHTML = `<div class="adm-cab"><div><p class="sobre">Tudo o que aparece no site</p><h1>Configurações</h1></div></div>
      <form id="formCfg" novalidate>${grupos.map(g => `<section class="painel-bloco"><h3>${g[0]}</h3><div class="grid-end">${g[1].map(f => campo(f, cfg[f.k])).join('')}</div></section>`).join('')}
        <div class="salvar-fixo"><button class="btn amarelo" type="submit">Salvar configurações</button></div></form>`;
    const form = $('#formCfg');
    ligarForm(form, 'banner');
    const todos = grupos.flatMap(g => g[1]);
    form.addEventListener('submit', async e => {
      e.preventDefault();
      const d = lerForm(form, todos);
      d.whatsapp = PNC.soNumeros(d.whatsapp);
      const { error: er } = await sb.from('configuracoes').update(d).eq('id', 1);
      if (er) return ok(PNC.traduzErro(er.message));
      ok('Configurações salvas.');
      await atualizarSite();
    });
  }

  PNC.admin = { render, sair };
})();
