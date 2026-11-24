/* =====================================================================
   PÃO NA CHAPA · Dados
   Liga no Supabase, carrega o cardápio e as configurações da loja,
   e guarda as funções de preço usadas no site (o preço FINAL do pedido
   é sempre recalculado no banco, na função criar_pedido).
===================================================================== */
(function () {
  const cfg = window.PNC_CONFIG || {};
  const PNC = (window.PNC = window.PNC || {});

  PNC.configurado = !!(cfg.supabaseUrl && cfg.supabaseKey && window.supabase);

  PNC.sb = PNC.configurado
    ? window.supabase.createClient(cfg.supabaseUrl, cfg.supabaseKey, {
      auth: {
        flowType: 'pkce',            // login com Google volta com ?code= (não briga com as rotas #)
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: true
      }
    })
    : null;

  /* categorias do cardápio (usadas enquanto o banco não estiver ligado) */
  PNC.CATEGORIAS_PADRAO = [
    { id: -1, slug: 'hamburgueres', nome: 'Hambúrgueres', ordem: 1 },
    { id: -2, slug: 'porcoes', nome: 'Porções', ordem: 2 },
    { id: -3, slug: 'bebidas', nome: 'Bebidas', ordem: 3 },
    { id: -4, slug: 'sobremesas', nome: 'Sobremesas', ordem: 4 },
    { id: -5, slug: 'combos', nome: 'Combos', ordem: 5 },
    { id: -6, slug: 'promocoes', nome: 'Promoções', ordem: 6 }
  ].map(c => Object.assign({ descricao: '', capa_url: '', video_url: '', video_mobile_url: '', foco: '50% 50%', fotos: [], ativo: true }, c));

  PNC.CONFIG_PADRAO = {
    nome_loja: 'Pão na Chapa',
    whatsapp: '',
    aviso: '',
    endereco: '',
    sobre: '',
    instagram: '',
    horarios: [],
    aceitando_pedidos: true,
    entrega_ativa: true,
    retirada_ativa: true,
    taxa_padrao: null,
    pedido_minimo: 0,
    tempo_entrega: '',
    tempo_retirada: '',
    pagamentos: { pix: true, dinheiro: true, cartao: true },
    chave_pix: '',
    banner_video_url: 'assets/video/banner.mp4',
    banner_video_mobile_url: '',
    banner_poster_url: 'assets/img/banner.jpg',
    banner_titulo: '',
    banner_texto: '',
    banner_foco: '50% 50%'
  };

  const E = (PNC.estado = {
    carregado: false,
    erro: '',
    config: Object.assign({}, PNC.CONFIG_PADRAO),
    categorias: PNC.CATEGORIAS_PADRAO.slice(),
    produtos: [],
    adicionais: [],
    prodAdd: {},          // produto_id -> [adicional_id]
    campanhas: [],
    bairros: [],
    maisPedidos: []       // [produto_id] por ordem de vendas
  });

  /* ---------- utilidades ---------- */
  PNC.esc = s => String(s == null ? '' : s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  PNC.brl = n => Number(n || 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
  PNC.slug = s => String(s || '').normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');
  PNC.soNumeros = s => String(s || '').replace(/\D/g, '');

  /* ---------- preços ---------- */
  PNC.emPromo = p => p && p.preco_promocional != null && p.preco_promocional !== '' &&
    (!p.promo_ate || new Date(p.promo_ate) > new Date()) && Number(p.preco_promocional) < Number(p.preco);

  PNC.precoBase = p => PNC.emPromo(p) ? Number(p.preco_promocional) : Number(p.preco);

  PNC.tamanhos = p => Array.isArray(p && p.tamanhos) ? p.tamanhos.filter(t => t && t.nome) : [];

  /* menor preço possível (para "a partir de") */
  PNC.precoMinimo = p => {
    const t = PNC.tamanhos(p);
    return t.length ? Math.min.apply(null, t.map(x => Number(x.preco))) : PNC.precoBase(p);
  };

  PNC.adicionaisDo = p => (E.prodAdd[p.id] || [])
    .map(id => E.adicionais.find(a => a.id === id))
    .filter(a => a && a.disponivel)
    .sort((a, b) => (a.ordem || 0) - (b.ordem || 0) || a.nome.localeCompare(b.nome, 'pt'));

  PNC.produto = id => E.produtos.find(p => p.id === Number(id));
  PNC.categoria = slug => E.categorias.find(c => c.slug === slug);
  PNC.categoriaDe = p => E.categorias.find(c => c.id === p.categoria_id);

  PNC.produtosDaCategoria = slug => {
    const c = PNC.categoria(slug);
    if (!c) return [];
    const lista = E.produtos.filter(p => p.categoria_id === c.id);
    /* Promoções: também tudo o que está com preço promocional ativo */
    if (slug === 'promocoes') E.produtos.forEach(p => { if (PNC.emPromo(p) && !lista.includes(p)) lista.push(p); });
    return lista.sort(PNC.ordenar);
  };

  PNC.ordenar = (a, b) => (a.ordem || 0) - (b.ordem || 0) || a.nome.localeCompare(b.nome, 'pt');

  /* taxa de entrega mostrada no checkout (a cobrada é calculada no banco do mesmo jeito) */
  PNC.taxaPara = bairro => {
    const c = E.config;
    const ativos = E.bairros.filter(b => b.ativo !== false);
    if (!ativos.length) return { ok: true, taxa: Number(c.taxa_padrao || 0) };
    const b = ativos.find(x => x.nome.toLowerCase() === String(bairro || '').trim().toLowerCase());
    if (b) return { ok: true, taxa: Number(b.taxa) };
    if (c.taxa_padrao != null && c.taxa_padrao !== '') return { ok: true, taxa: Number(c.taxa_padrao) };
    return { ok: false, taxa: 0 };
  };

  /* ---------- horários ---------- */
  const DIAS = ['Domingo', 'Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta', 'Sábado'];
  PNC.DIAS = DIAS;
  const min = t => { const m = /^(\d{1,2}):(\d{2})/.exec(t || ''); return m ? +m[1] * 60 + +m[2] : null; };

  PNC.agoraSP = () => {
    const f = new Intl.DateTimeFormat('en-US', { timeZone: 'America/Sao_Paulo', weekday: 'short', hour: '2-digit', minute: '2-digit', hour12: false }).formatToParts(new Date());
    const g = k => (f.find(x => x.type === k) || {}).value;
    return { dia: ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].indexOf(g('weekday')), min: (+g('hour') % 24) * 60 + +g('minute') };
  };

  /* null = horários não configurados (não dá para afirmar) */
  PNC.abertoAgora = () => {
    const h = E.config.horarios || [];
    if (!h.length) return null;
    const n = PNC.agoraSP();
    return h.some(x => {
      const a = min(x.abre), f = min(x.fecha);
      if (a == null || f == null) return false;
      if (a <= f) return +x.dia === n.dia && n.min >= a && n.min <= f;
      return (+x.dia === n.dia && n.min >= a) || (+x.dia === (n.dia + 6) % 7 && n.min <= f);
    });
  };

  PNC.horarioHoje = () => {
    const h = (E.config.horarios || []).filter(x => +x.dia === PNC.agoraSP().dia);
    return h.map(x => x.abre + ' às ' + x.fecha).join(' e ');
  };

  /* ---------- carregar tudo ---------- */
  PNC.carregar = async function () {
    if (!PNC.sb) { E.carregado = true; return; }
    try {
      const sb = PNC.sb;
      const [cfgR, catR, prodR, addR, paR, campR, baiR, maisR] = await Promise.all([
        sb.from('configuracoes').select('*').eq('id', 1).maybeSingle(),
        sb.from('categorias').select('*').eq('ativo', true).order('ordem'),
        sb.from('produtos').select('*').eq('ativo', true).order('ordem'),
        sb.from('adicionais').select('*').order('ordem'),
        sb.from('produto_adicionais').select('produto_id, adicional_id'),
        sb.from('campanhas').select('*').eq('ativo', true).order('ordem'),
        sb.from('bairros').select('*').eq('ativo', true).order('nome'),
        sb.rpc('mais_pedidos', { p_limite: 8 })
      ]);
      const erro = [cfgR, catR, prodR, addR, paR, campR, baiR].find(r => r.error);
      if (erro) throw erro.error;

      E.config = Object.assign({}, PNC.CONFIG_PADRAO, cfgR.data || {});
      if (!E.config.banner_video_url) E.config.banner_video_url = '';
      E.categorias = (catR.data && catR.data.length) ? catR.data : PNC.CATEGORIAS_PADRAO.slice();
      E.produtos = (prodR.data || []).map(p => Object.assign(p, { id: Number(p.id), categoria_id: p.categoria_id == null ? null : Number(p.categoria_id) }));
      E.adicionais = (addR.data || []).map(a => Object.assign(a, { id: Number(a.id) }));
      E.prodAdd = {};
      (paR.data || []).forEach(r => { (E.prodAdd[Number(r.produto_id)] = E.prodAdd[Number(r.produto_id)] || []).push(Number(r.adicional_id)); });
      E.campanhas = campR.data || [];
      E.bairros = baiR.data || [];
      E.maisPedidos = (maisR && !maisR.error && maisR.data ? maisR.data : []).map(r => Number(r.produto_id));
      E.erro = '';
    } catch (e) {
      console.error('Erro ao carregar o cardápio:', e);
      E.erro = 'Não foi possível carregar o cardápio agora.';
    }
    E.carregado = true;
  };
})();
