let carrinho = JSON.parse(localStorage.getItem('carrinho')) || [];
const botoesAdicionar = document.querySelectorAll('.adicionar');
botoesAdicionar.forEach(botao => {
    botao.addEventListener('click', () => {
        carrinho = JSON.parse(localStorage.getItem('carrinho')) || [];
        const id = botao.dataset.id;
        const nome = botao.dataset.nome;
        const preco = Number(botao.dataset.preco);
        const produtoExistente = carrinho.find(
            produto => produto.id === id
        );
        if (produtoExistente) {
            produtoExistente.quantidade++;
        } else {
            carrinho.push({
                id: id,
                nome: nome,
                preco: preco,
                quantidade: 1
            });
        }
        localStorage.setItem('carrinho', JSON.stringify(carrinho));
        alert(nome + ' adicionado ao carrinho!');
    });
});
const listaCarrinho = document.querySelector('#lista-carrinho');
const totalElemento = document.querySelector('#total');
function atualizarCarrinho() {
    if (!listaCarrinho || !totalElemento) return;
    carrinho = JSON.parse(localStorage.getItem('carrinho')) || [];
    listaCarrinho.innerHTML = '';
    let total = 0;
    carrinho.forEach((produto, indice) => {
        const subtotal = produto.preco * produto.quantidade;
        total += subtotal;
        const artigo = document.createElement('article');
        artigo.innerHTML = `
            <h3>${produto.nome}</h3>
            <p>Preço unitário: ${produto.preco.toLocaleString('pt-BR', {
                style: 'currency',
                currency: 'BRL'
            })}</p>
            <button class="diminuir" data-indice="${indice}">
                -
            </button>
            <span>${produto.quantidade}</span>
            <button class="aumentar" data-indice="${indice}">
                +
            </button>
            <p>Subtotal: ${subtotal.toLocaleString('pt-BR', {
                style: 'currency',
                currency: 'BRL'
            })}</p>
            <button class="remover" data-indice="${indice}">
                Remover produto
            </button>
            <hr>
        `;
        listaCarrinho.appendChild(artigo);
    });
    totalElemento.textContent = 'Total: ' + total.toLocaleString('pt-BR', {
        style: 'currency',
        currency: 'BRL'
    });
    localStorage.setItem('carrinho', JSON.stringify(carrinho));
}
if (listaCarrinho) {
    listaCarrinho.addEventListener('click', event => {
        if (!event.target.dataset.indice) return;
        const indice = Number(event.target.dataset.indice);
        if (event.target.classList.contains('aumentar')) {
            carrinho[indice].quantidade++;
        }
        if (event.target.classList.contains('diminuir')) {
            carrinho[indice].quantidade--;
            if (carrinho[indice].quantidade <= 0) {
                carrinho.splice(indice, 1);
            }
        }
        if (event.target.classList.contains('remover')) {
            carrinho.splice(indice, 1);
        }
        localStorage.setItem('carrinho', JSON.stringify(carrinho));
        atualizarCarrinho();
    });
}
atualizarCarrinho();
const botaoFinalizar = document.querySelector('#finalizar-pedido');
if (botaoFinalizar) {
    botaoFinalizar.addEventListener('click', () => {
        carrinho = JSON.parse(localStorage.getItem('carrinho')) || [];
        const usuario = JSON.parse(localStorage.getItem('usuario'));
        if (carrinho.length === 0) {
            alert('Seu carrinho está vazio!');
            return;
        }
        if (usuario) {
            window.location.href = 'finalizar.html';
        } else {
            window.location.href = 'cadastro.html';
        }
    });
}
const formularioCadastro = document.querySelector('#form-cadastro');
if (formularioCadastro) {
    formularioCadastro.addEventListener('submit', event => {
        event.preventDefault();
        const nome = document.querySelector('#nome').value.trim();
        const telefone = document.querySelector('#telefone').value.trim();
        const email = document.querySelector('#email').value.trim();
        const senha = document.querySelector('#senha').value.trim();
        if (!nome || !telefone || !email || !senha) {
            alert('Por favor, preencha todos os campos corretamente.');
            return;
        }
        const usuario = {
            nome: nome,
            telefone: telefone,
            email: email,
            senha: senha
        };
        localStorage.setItem('usuario', JSON.stringify(usuario));
        alert('Cadastro realizado com sucesso!');
        window.location.href = 'finalizar.html';
    });
}
const formularioLogin = document.querySelector('#form-login');
if (formularioLogin) {
    formularioLogin.addEventListener('submit', event => {
        event.preventDefault();
        const usuario = JSON.parse(localStorage.getItem('usuario'));
        const email = document.querySelector('#email-login').value.trim();
        const senha = document.querySelector('#senha-login').value.trim();
        if (usuario && usuario.email === email && usuario.senha === senha) {
            alert('Login realizado com sucesso!');
            window.location.href = 'finalizar.html';
        } else {
            alert('E-mail ou senha incorretos!');
        }
    });
}
if (window.location.pathname.endsWith('finalizar.html')) {

    localStorage.removeItem('carrinho');

}