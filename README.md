Pão na Chapa · site de pedidos

Site da hamburgueria Pão na Chapa: cardápio com fotos e vídeos, janela de detalhes com adicionais, carrinho, login/cadastro, checkout com entrega ou retirada, acompanhamento do pedido em tempo real e painel administrativo. Feito em HTML, CSS e JavaScript puros (sem instalação), com Supabase.

Projeto independente da Brands: banco, usuários, produtos e pedidos próprios.

Estrutura
index.html                    estrutura do site (cabeçalho, rodapé, barra do celular, janela)
css/style.css                 todo o visual (preto, creme, amarelo nos botões principais)
js/config.js                  URL e chave pública do Supabase
js/dados.js                   leitura do cardápio e regras de preço
js/carrinho.js                carrinho (salvo no navegador, funciona sem login)
js/app.js                     páginas, login, conta, checkout, acompanhamento do pedido
js/admin.js                   painel administrativo (#admin)
supabase/schema.sql           banco inicial (já rodado): tabelas, segurança (RLS), criar_pedido, Storage
supabase/migracoes/           melhorias do banco, uma por etapa (rodar em ordem, uma vez cada)
assets/video/banner.mp4       vídeo do banner
assets/img/banner.jpg         capa do banner
assets/img/logo.svg           logo do site (cabeçalho, rodapé e login)
assets/img/icone.svg          ícone da aba do navegador
assets/img/icone-*.png        ícone do "Adicionar à tela inicial"
assets/img/apple-touch-icon.png  ícone na tela inicial do iPhone
manifest.webmanifest          "Adicionar à tela inicial" no celular
PROMPT-CHATGPT.md             passo a passo para configurar Supabase + login com Google
Migrações do banco (melhorias por etapa)

Cada arquivo de supabase/migracoes/ só adiciona tabelas, colunas e regras: não apaga contas, pedidos, endereços nem produtos. Use sempre o mesmo projeto Supabase do site.

Supabase > SQL Editor > New query.
Cole o conteúdo inteiro do arquivo da migração e clique em Run.
Confira que apareceu "Success". Pode rodar de novo sem estragar nada.
Arquivo	O que faz
001_perfis_usuarios.sql	Perfis cliente, entregador, cozinha e admin; suspensão de contas; histórico de auditoria; funções do painel Usuários
002_fluxo_pedidos.sql	Novo fluxo de status do pedido, painel da cozinha, cancelamento pelo cliente, histórico com quem mudou cada status, proteção contra pedido duplicado
002b_troca_entregadores_antigo.sql	Só para quem já tinha rodado um 003 de entregadores antigo. Limpa o sistema antigo e adapta os dados. Rode antes do 003
003_entregadores.sql	Painel do entregador, código de entrega (com QR), perfil público do entregador (foto, sobre, veículo, cursos)
004_cupons_fidelidade.sql	Cupons (desconto em %, entrega grátis, só no 1º pedido) e pontos de fidelidade, com o desconto calculado no banco
005_avaliacoes.sql	Avaliações depois da entrega: nota e comentário do pedido, estrelas por produto e para o entregador, com aprovação no painel
006_estoque_relatorios.sql	Estoque por produto (baixa no pedido, devolução no cancelamento, histórico) e relatórios de vendas
007_extras.sql	Pedido agendado, gorjeta para o entregador, foto de perfil do cliente e indique e ganhe
Perfis e permissões
Cliente: perfil de todo cadastro novo. Faz pedidos, salva endereços e favoritos.
Entregador e Cozinha: o administrador muda no painel (Usuários > Alterar perfil).
Administrador: só pela tabela admins_autorizados no SQL Editor (nunca pelo painel): insert into admins_autorizados (email) values ('email@exemplo.com'); A pessoa precisa entrar com o e-mail confirmado depois disso.
Ninguém altera o próprio perfil; o banco confere tudo, não só a tela.
Conta suspensa continua com todos os dados e pedidos, mas não consegue fazer novos pedidos.
Toda alteração de perfil e suspensão fica no Histórico de alterações (quem fez, quando e o motivo).
Fluxo do pedido
Aguardando confirmação → (PIX: Aguardando pagamento → Pagamento aprovado) → Pedido confirmado
→ Em preparação → Pedido pronto → (entrega: Aguardando entregador → Saiu para entrega) → Entregue
O banco só aceita o próximo passo certo: ninguém pula etapa, e pedido entregue ou cancelado não muda mais.
Administrador: aceita, confirma o PIX recebido, despacha, marca como entregue e cancela (com motivo).
Cozinha (#cozinha): vê só os pedidos aceitos, com itens, adicionais, retiradas e observações. Não vê telefone, endereço nem valores. Inicia o preparo, marca pronto e entrega as retiradas no balcão.
Cliente: acompanha cada etapa e pode cancelar enquanto o pedido ainda não foi aceito.
"Pagamento aprovado" é marcado à mão pela loja depois de conferir o PIX (o site não simula pagamento).
Entregadores
Entregador (#entregador): vê os pedidos prontos só com bairro e forma de pagamento. Quem clicar primeiro em Pegar entrega fica com ela. Aí aparecem endereço, primeiro nome e telefone do cliente, só enquanto a entrega está em andamento.
Código de entrega: o cliente vê 4 números e um QR code na página do pedido. O entregador digita o código (ou lê o QR no Chrome do Android) para marcar como entregue. Depois de 5 códigos errados, só a loja confirma pelo painel.
Perfil público: o entregador edita foto, "sobre mim" e veículo em Meu perfil. Os cursos só o administrador cadastra, em Usuários → Ver detalhes. O cliente vê foto, primeiro nome, sobre, veículo, cursos e número de entregas. Telefone e e-mail do entregador nunca aparecem. A placa só aparece se o entregador permitir.
Cupons e pontos
Cupons (painel → Cupons e pontos): desconto em % (com desconto máximo opcional) ou entrega grátis. Cada cupom pode ter pedido mínimo, limite de usos (total e por cliente), período de validade e a opção "só no primeiro pedido". O cliente digita o código no checkout. Pedido cancelado libera o uso do cupom.
Pontos de fidelidade: começam desligados. A loja define quantos pontos o cliente ganha por real gasto em produtos (sem a taxa de entrega), quantos pontos formam uma troca e quanto vale cada troca. Os pontos entram quando o pedido é entregue. Pedido cancelado devolve os pontos usados. O cliente vê o saldo e o extrato em Minha conta → Meus pontos.
O desconto é sempre recalculado e conferido pelo banco ao criar o pedido; o site só mostra uma prévia.
Avaliações
Depois que o pedido é entregue, o cliente que fez o pedido avalia uma única vez, na página do pedido: nota geral (obrigatória) com comentário, estrelas para cada produto e estrelas para o entregador (opcionais).
Os comentários só aparecem no site (seção "O que dizem nossos clientes" na página inicial) depois que a loja aprova em painel → Avaliações. No site aparece só o primeiro nome e a inicial do sobrenome.
As estrelas dos produtos no cardápio contam só avaliações aprovadas. A nota do entregador aparece no cartão dele.
A loja não responde avaliações pelo site.
Estoque e relatórios
Estoque (painel → Estoque): o controle é ligado produto a produto. A quantidade baixa quando o cliente faz o pedido e volta se o pedido for cancelado. Com estoque zerado o produto aparece como esgotado e o banco não deixa vender. "Entrada" soma o que chegou; "Contagem" corrige para o número contado. Todo movimento fica no histórico. O aviso de estoque baixo (opcional) também mostra "Últimas unidades" no site.
Relatórios (painel → Relatórios): faturamento por dia/semana/mês, produtos mais vendidos, formas de pagamento e descontos, para hoje, 7 ou 30 dias, este mês, mês passado ou datas escolhidas. Vendas = pedidos entregues. Os dados podem ser baixados em planilha (CSV, abre no Excel).
Extras (Etapa 8A)

Tudo começa desligado.

Pedir de novo: em Minha conta → Meus pedidos (e na página de um pedido terminado). Coloca no carrinho os mesmos itens, com os preços de hoje. Itens que saíram do cardápio ficam de fora e o site avisa.
Pedido agendado (Configurações → Horários → "Aceitar pedidos agendados"): o cliente escolhe dia e horário, de 30 em 30 minutos, com 30 minutos de antecedência e até 7 dias, sempre dentro dos horários de funcionamento. Com a loja fechada, o site ainda deixa agendar. Cozinha e painel mostram "Agendado para ...".
Gorjeta (Configurações → Pagamento → "Gorjeta para o entregador"): só em pedidos com entrega, valor livre até R$ 200. Entra no total do pedido, aparece para o entregador e fica fora do faturamento nos relatórios.
Foto de perfil: o cliente troca a própria foto em Minha conta (fica na pasta clientes/<id> do Storage). Ela aparece no topo do site e na conta. O entregador não vê.
Indique e ganhe (Cupons e pontos → Indique e ganhe): cada cliente tem um código e um link. Quem chega pelo link (ou digita o código antes do 1º pedido) ganha o desconto em % no primeiro pedido (não junta com cupom). Quem indicou ganha os pontos quando esse pedido é entregue. Se o 1º pedido for cancelado, o desconto vale no próximo.
O que fica no painel (nada é inventado no código)
Pedidos: endereço, telefone, itens, adicionais, troco; mudar status e mandar recado ao cliente. Pedido novo toca um aviso e a lista se atualiza sozinha.
Produtos: preço, promoção (com data final), tamanhos, ingredientes, o que pode retirar, adicionais permitidos, fotos, disponível/esgotado, destaque, novidade.
Categorias: foto de capa, vídeo MP4 (computador) e vídeo vertical (celular), fotos extras.
Adicionais, Explorar (campanhas com foto/vídeo e produtos), Entrega e taxas (bairros).
Usuários: busca, filtros por perfil e situação, alterar perfil, ver detalhes, suspender/reativar, histórico de alterações.
Configurações: WhatsApp, horários, formas de pagamento, chave PIX, faixa de avisos, banner.
Fotos e vídeos
Envie pelo painel (botão Enviar): vão para o Storage do Supabase (bucket midia, até 50 MB).
Vídeos: MP4 (H.264), sem áudio, 5 a 15 s em loop, idealmente até ~8 MB.
Banner e páginas de categoria: horizontal 1920×1080.
Versão para celular (opcional): vertical 1080×1350 ou 1080×1920.
Sem vídeo, o site usa a foto de capa. Sem foto, mostra um cartão escuro.
Campo foco (ex.: 50% 30%): qual parte da imagem fica sempre visível quando o celular corta.
Segurança (resumo)
O preço do pedido é recalculado no banco (função criar_pedido): o navegador não consegue alterar valores.
Cliente só vê os próprios pedidos e endereços; só administrador edita cardápio e muda status.
Perfis, suspensões e auditoria só mudam pelas funções admin_* do banco, que conferem se quem pede é administrador.
No js/config.js vai só a chave publishable/anon. Nunca a service_role/secret.
