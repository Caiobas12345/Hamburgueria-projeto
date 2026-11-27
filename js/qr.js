/* =====================================================================
   PÃO NA CHAPA · QR code (sem biblioteca externa)
   Gera o QR do código de entrega que o cliente mostra ao entregador.
   Modo byte, correção de erro nível M, versões 1 a 3 (até 42 caracteres).
   Baseado no padrão ISO/IEC 18004.
===================================================================== */
(function () {
  const PNC = window.PNC = window.PNC || {};

  const DADOS = [0, 16, 28, 44];   // palavras de dados por versão (nível M)
  const CORRECAO = [0, 10, 16, 26]; // palavras de correção por versão (nível M)

  function mul(x, y) {
    let z = 0;
    for (let i = 7; i >= 0; i--) {
      z = (z << 1) ^ ((z >>> 7) * 0x11d);
      z ^= ((y >>> i) & 1) * x;
    }
    return z;
  }

  function divisor(grau) {
    const r = new Array(grau).fill(0);
    r[grau - 1] = 1;
    let raiz = 1;
    for (let i = 0; i < grau; i++) {
      for (let j = 0; j < r.length; j++) {
        r[j] = mul(r[j], raiz);
        if (j + 1 < r.length) r[j] ^= r[j + 1];
      }
      raiz = mul(raiz, 0x02);
    }
    return r;
  }

  function resto(dados, div) {
    const r = new Array(div.length).fill(0);
    dados.forEach(b => {
      const f = b ^ r.shift();
      r.push(0);
      div.forEach((c, i) => { r[i] ^= mul(c, f); });
    });
    return r;
  }

  function matriz(texto) {
    const bytes = Array.from(new TextEncoder().encode(texto));
    let v = 1;
    while (v <= 3 && 4 + 8 + bytes.length * 8 > DADOS[v] * 8) v++;
    if (v > 3) throw new Error('Texto longo demais para o QR.');

    /* bits: modo byte, tamanho, dados, terminador e preenchimento */
    const bits = [];
    const poe = (val, n) => { for (let i = n - 1; i >= 0; i--) bits.push((val >>> i) & 1); };
    poe(4, 4); poe(bytes.length, 8); bytes.forEach(b => poe(b, 8));
    const cap = DADOS[v] * 8;
    poe(0, Math.min(4, cap - bits.length));
    while (bits.length % 8) bits.push(0);
    const dados = [];
    for (let i = 0; i < bits.length; i += 8) dados.push(parseInt(bits.slice(i, i + 8).join(''), 2));
    for (let p = 0xec; dados.length < DADOS[v]; p ^= 0xec ^ 0x11) dados.push(p);
    const palavras = dados.concat(resto(dados, divisor(CORRECAO[v])));

    const n = v * 4 + 17;
    const m = Array.from({ length: n }, () => new Array(n).fill(false));
    const fixo = Array.from({ length: n }, () => new Array(n).fill(false));
    const set = (x, y, escuro) => { m[y][x] = escuro; fixo[y][x] = true; };

    /* localizadores com separador */
    [[3, 3], [n - 4, 3], [3, n - 4]].forEach(([cx, cy]) => {
      for (let dy = -4; dy <= 4; dy++) for (let dx = -4; dx <= 4; dx++) {
        const x = cx + dx, y = cy + dy;
        if (x < 0 || y < 0 || x >= n || y >= n) continue;
        const d = Math.max(Math.abs(dx), Math.abs(dy));
        set(x, y, d !== 2 && d !== 4);
      }
    });
    /* linhas de sincronismo */
    for (let i = 0; i < n; i++) {
      if (!fixo[6][i]) set(i, 6, i % 2 === 0);
      if (!fixo[i][6]) set(6, i, i % 2 === 0);
    }
    /* alinhamento (versões 2 e 3) */
    if (v > 1) {
      const c = n - 7;
      for (let dy = -2; dy <= 2; dy++) for (let dx = -2; dx <= 2; dx++) set(c + dx, c + dy, Math.max(Math.abs(dx), Math.abs(dy)) !== 1);
    }
    /* reserva da área de formato */
    const formato = mascara => {
      const d = mascara; // nível M = 00
      let r = d;
      for (let i = 0; i < 10; i++) r = (r << 1) ^ ((r >>> 9) * 0x537);
      const b = ((d << 10) | r) ^ 0x5412;
      const bit = i => ((b >>> i) & 1) === 1;
      for (let i = 0; i <= 5; i++) set(8, i, bit(i));
      set(8, 7, bit(6)); set(8, 8, bit(7)); set(7, 8, bit(8));
      for (let i = 9; i < 15; i++) set(14 - i, 8, bit(i));
      for (let i = 0; i < 8; i++) set(n - 1 - i, 8, bit(i));
      for (let i = 8; i < 15; i++) set(8, n - 15 + i, bit(i));
      set(8, n - 8, true);
    };
    formato(0);

    /* dados em zigue-zague */
    let i = 0;
    for (let dir = n - 1; dir >= 1; dir -= 2) {
      if (dir === 6) dir = 5;
      for (let vert = 0; vert < n; vert++) {
        for (let j = 0; j < 2; j++) {
          const x = dir - j;
          const sobe = ((dir + 1) & 2) === 0;
          const y = sobe ? n - 1 - vert : vert;
          if (!fixo[y][x] && i < palavras.length * 8) {
            m[y][x] = ((palavras[i >>> 3] >>> (7 - (i & 7))) & 1) === 1;
            i++;
          }
        }
      }
    }

    /* escolhe a máscara com menor penalidade */
    const regra = [
      (x, y) => (x + y) % 2, (x, y) => y % 2, (x, y) => x % 3, (x, y) => (x + y) % 3,
      (x, y) => (Math.floor(y / 2) + Math.floor(x / 3)) % 2, (x, y) => (x * y) % 2 + (x * y) % 3,
      (x, y) => ((x * y) % 2 + (x * y) % 3) % 2, (x, y) => ((x + y) % 2 + (x * y) % 3) % 2
    ];
    const aplica = k => { for (let y = 0; y < n; y++) for (let x = 0; x < n; x++) if (!fixo[y][x] && regra[k](x, y) === 0) m[y][x] = !m[y][x]; };
    const penalidade = () => {
      let p = 0, escuros = 0;
      const linhas = [];
      for (let y = 0; y < n; y++) {
        linhas.push(m[y].map(b => b ? 1 : 0).join(''));
        linhas.push(m.map(l => l[y] ? 1 : 0).join(''));
      }
      linhas.forEach(l => {
        (l.match(/0{5,}|1{5,}/g) || []).forEach(s => { p += s.length - 2; });
        p += ((l.match(/(?=10111010000|00001011101)/g) || []).length) * 40;
      });
      for (let y = 0; y < n; y++) for (let x = 0; x < n; x++) {
        if (m[y][x]) escuros++;
        if (x < n - 1 && y < n - 1 && m[y][x] === m[y][x + 1] && m[y][x] === m[y + 1][x] && m[y][x] === m[y + 1][x + 1]) p += 3;
      }
      p += (Math.ceil(Math.abs(escuros * 20 - n * n * 10) / (n * n)) - 1) * 10;
      return p;
    };
    let melhor = 0, menor = Infinity;
    for (let k = 0; k < 8; k++) {
      aplica(k); formato(k);
      const p = penalidade();
      if (p < menor) { menor = p; melhor = k; }
      aplica(k);
    }
    aplica(melhor); formato(melhor);
    return m;
  }

  /* SVG pronto para colocar na página */
  PNC.qrSvg = function (texto, rotulo) {
    const m = matriz(texto);
    const n = m.length, borda = 4;
    let d = '';
    m.forEach((l, y) => l.forEach((b, x) => { if (b) d += `M${x + borda} ${y + borda}h1v1h-1z`; }));
    return `<svg class="qr" viewBox="0 0 ${n + borda * 2} ${n + borda * 2}" role="img" aria-label="${rotulo || 'QR code'}" shape-rendering="crispEdges"><rect width="100%" height="100%" fill="#fff"/><path d="${d}" fill="#111"/></svg>`;
  };
  PNC.qrMatriz = matriz;
})();
