/* =====================================================================
   PÃO NA CHAPA · Carrinho
   Fica salvo no navegador (funciona sem login e continua depois de entrar).
   Cada item: { k, produto_id, tamanho, adicionais:[ids], removidos:[], obs, qtd }
===================================================================== */
(function () {
  const PNC = window.PNC;
  const CHAVE = 'pnc_carrinho';

  const ler = () => {
    try { const v = JSON.parse(localStorage.getItem(CHAVE) || '[]'); return Array.isArray(v) ? v : []; } catch (e) { return []; }
  };

  let itens = ler();

  const salvar = () => {
    try { localStorage.setItem(CHAVE, JSON.stringify(itens)); } catch (e) { }
    document.dispatchEvent(new CustomEvent('pnc:carrinho'));
  };

  /* mesma escolha (produto + tamanho + adicionais + retirados + obs) = soma a quantidade */
  const assinatura = i => [i.produto_id, i.tamanho || '', (i.adicionais || []).slice().sort().join('.'), (i.removidos || []).slice().sort().join('.'), i.obs || ''].join('|');

  /* preço de uma unidade com as escolhas atuais (null = produto indisponível) */
  const precoUnit = i => {
    const p = PNC.produto(i.produto_id);
    if (!p || !p.disponivel) return null;
    let base = PNC.precoBase(p);
    const tams = PNC.tamanhos(p);
    if (tams.length) {
      const t = tams.find(x => x.nome === i.tamanho);
      if (!t) return null;
      base = Number(t.preco);
    }
    const permitidos = PNC.adicionaisDo(p);
    const adds = (i.adicionais || []).map(id => permitidos.find(a => a.id === id));
    if (adds.some(a => !a)) return null;
    return base + adds.reduce((s, a) => s + Number(a.preco), 0);
  };

  PNC.carrinho = {
    itens: () => itens.slice(),

    adicionar(item) {
      const novo = Object.assign({ adicionais: [], removidos: [], obs: '', tamanho: '', qtd: 1 }, item);
      novo.qtd = Math.max(1, Math.min(50, Number(novo.qtd) || 1));
      const igual = itens.find(x => assinatura(x) === assinatura(novo));
      if (igual) igual.qtd = Math.min(50, igual.qtd + novo.qtd);
      else itens.push(Object.assign(novo, { k: Date.now().toString(36) + Math.random().toString(36).slice(2, 6) }));
      salvar();
    },

    quantidade(k, qtd) {
      const i = itens.find(x => x.k === k);
      if (!i) return;
      i.qtd = Math.max(1, Math.min(50, qtd));
      salvar();
    },

    remover(k) { itens = itens.filter(x => x.k !== k); salvar(); },

    limpar() { itens = []; salvar(); },

    contar: () => itens.reduce((s, i) => s + i.qtd, 0),

    precoUnit,

    linha(i) {
      const u = precoUnit(i);
      return u == null ? null : u * i.qtd;
    },

    subtotal: () => itens.reduce((s, i) => s + (precoUnit(i) || 0) * i.qtd, 0),

    temIndisponivel: () => itens.some(i => precoUnit(i) == null),

    /* formato esperado pela função criar_pedido do banco */
    paraPedido: () => itens.filter(i => precoUnit(i) != null).map(i => ({
      produto_id: i.produto_id,
      quantidade: i.qtd,
      tamanho: i.tamanho || null,
      adicionais: i.adicionais || [],
      removidos: i.removidos || [],
      observacao: i.obs || ''
    }))
  };

  /* outra aba mudou o carrinho */
  addEventListener('storage', e => { if (e.key === CHAVE) { itens = ler(); document.dispatchEvent(new CustomEvent('pnc:carrinho')); } });
})();
