# Prompt para o ChatGPT — configurar Supabase e login com Google no site Pão na Chapa

Copie TUDO o que está abaixo da linha e cole no ChatGPT.

---

Você vai me guiar, com paciência e um passo de cada vez, a configurar o Supabase e o login com Google
no site da minha hamburgueria **Pão na Chapa**. Eu não sou programador: explique onde clicar, o que copiar
e onde colar. Depois de cada etapa, pergunte se deu certo antes de passar para a próxima.
Se algum menu tiver outro nome na tela que eu vejo, me ajude a encontrar o equivalente
(os painéis do Supabase e do Google mudam de nome com o tempo). Se tiver dúvida sobre algo atual,
consulte a documentação oficial: https://supabase.com/docs/guides/auth/social-login/auth-google

## Como o site é feito (não precisa mudar o código)

- Site estático em HTML/CSS/JavaScript, publicado na **Vercel** a partir do meu repositório no **GitHub**.
- Arquivos importantes:
  - `js/config.js`: tem `supabaseUrl` e `supabaseKey` (vazios até eu preencher).
  - `supabase/schema.sql`: o banco inteiro, já pronto (tabelas, segurança RLS, função que cria pedidos
    recalculando os preços, bucket de fotos/vídeos "midia", as 6 categorias do cardápio).
  - `js/app.js`: já chama `supabase.auth.signInWithOAuth({ provider: 'google', options: { redirectTo: <endereço do site> } })`
    e usa `flowType: 'pkce'` (o Google volta para o site com `?code=` e o site limpa isso sozinho).
- O administrador é o e-mail **rafatomasi214@gmail.com**: o banco transforma essa conta em administradora
  automaticamente assim que o e-mail estiver confirmado (cadastro confirmado ou login com Google).
- O painel do site fica em `https://MEU-SITE/#admin`.

## Regras de segurança que você deve seguir

- No `js/config.js` vai só a **Project URL** e a chave **publishable** (ou "anon public").
  **Nunca** me peça para colocar a chave `service_role` / `secret` no site ou no GitHub.
- Não me peça para desativar o RLS das tabelas.
- Não me peça para inventar produtos, preços, taxas ou horários: isso eu cadastro no painel do site.
- Este projeto Supabase é só do Pão na Chapa (não misturar com outro projeto meu).

## Etapas que quero fazer com você

1. **Criar o projeto no Supabase** (nome, senha do banco, região mais próxima — São Paulo se existir).
2. **Rodar o banco**: abrir o **SQL Editor**, colar o conteúdo inteiro de `supabase/schema.sql`, clicar em **Run**
   e conferir que não deu erro. (Pode ser rodado de novo sem estragar nada.)
   Depois me ajude a conferir em **Table Editor** que existem as tabelas `categorias`, `produtos`,
   `pedidos`, `configuracoes` etc., e em **Storage** que existe o bucket `midia` (público).
3. **Ligar o site ao Supabase**: em **Project Settings > API** (ou "API Keys"), copiar a Project URL e a chave
   publishable/anon para o `js/config.js`, assim:
   ```js
   window.PNC_CONFIG = {
     supabaseUrl: 'https://SEU-PROJETO.supabase.co',
     supabaseKey: 'sb_publishable_...'
   };
   ```
   Depois: salvar, enviar para o GitHub (commit/push) e esperar a Vercel publicar.
4. **Endereços permitidos**: em **Authentication > URL Configuration**:
   - *Site URL*: o endereço do site na Vercel (ex.: `https://pao-na-chapa.vercel.app`).
   - *Redirect URLs*: o mesmo endereço, também com `/` no fim e com `/index.html`
     (e `http://localhost:5500` se eu testar no computador com Live Server).
5. **E-mail de confirmação**: explicar como funciona a confirmação de e-mail do cadastro
   (Authentication > Sign In / Providers > Email) e onde personalizar o texto em **Email Templates**,
   em português. Avisar sobre o limite de e-mails do servidor gratuito do Supabase e,
   se eu quiser, como configurar um SMTP próprio depois.
6. **Login com Google — parte do Google Cloud**:
   - Criar (ou escolher) um projeto em https://console.cloud.google.com
   - Abrir o **Google Auth Platform** e configurar: **Branding** (nome "Pão na Chapa", e-mail de suporte, logo),
     **Audience** (usuários externos; enquanto estiver em "Testing", só e-mails cadastrados como teste conseguem
     entrar — me explique como publicar para "In production"), **Data Access (Scopes)** com `openid`,
     `.../auth/userinfo.email` e `.../auth/userinfo.profile`.
   - Em **Clients**, criar um **OAuth client ID** do tipo **Web application**:
     - *Authorized JavaScript origins*: o endereço do site, sem barra e sem caminho
       (ex.: `https://pao-na-chapa.vercel.app`).
     - *Authorized redirect URIs*: o **Callback URL** que aparece no Supabase na página do provedor Google
       (algo como `https://SEU-PROJETO.supabase.co/auth/v1/callback`). Copiar de lá, não digitar.
   - Guardar o **Client ID** e o **Client Secret**.
7. **Login com Google — parte do Supabase**: em **Authentication > Sign In / Providers > Google**
   (ou Authentication > Providers > Google), ativar, colar Client ID e Client Secret e salvar.
8. **Testar**:
   - Abrir o site numa aba anônima, clicar no ícone de perfil > **Continuar com Google**.
   - Entrar com **rafatomasi214@gmail.com** e conferir que aparece o botão **Painel administrativo**
     em Minha conta (ou abrir `#admin`).
   - Criar uma conta de cliente com outro e-mail, confirmar o e-mail, montar um carrinho e fazer um pedido
     de teste; ver o pedido chegar no painel, mudar o status e mandar um recado; conferir que o cliente vê.
9. **Tempo real**: conferir em **Database > Publications** (ou Replication) que a tabela `pedidos`
   está na publicação `supabase_realtime` (o SQL já tenta adicionar). Se não estiver, me ajude a ativar.

## Problemas comuns (me ajude a resolver se acontecer)

- **"redirect_uri_mismatch"** no Google: o Authorized redirect URI não é exatamente o Callback URL do Supabase.
- **Volto do Google e não fico logado / vou para outra página**: o endereço do site não está em
  *Site URL / Redirect URLs* do Supabase.
- **"provider is not enabled"**: o provedor Google não foi ativado/salvo no Supabase.
- **"Access blocked" / só eu consigo entrar**: o app do Google está em modo de teste (Audience).
- **Entrei com o e-mail do admin mas não aparece o painel**: o e-mail ainda não está confirmado,
  ou a conta foi criada antes de rodar o SQL. Nesse caso, rode no SQL Editor:
  ```sql
  update public.perfis p set papel = 'admin'
  from auth.users u
  where u.id = p.id and u.email_confirmed_at is not null
    and lower(u.email) in (select email from public.admins_autorizados);
  ```
- **Quero outro administrador**: `insert into public.admins_autorizados (email) values ('email@exemplo.com');`
  (a pessoa precisa entrar/confirmar o e-mail depois disso; se já tinha conta, rode o `update` acima).
- **Erro ao enviar foto/vídeo no painel**: conferir o bucket `midia` em Storage e se o arquivo tem até 50 MB
  e é JPG, PNG, WEBP, AVIF, MP4 ou WEBM.

Comece pela etapa 1 e me pergunte o que você precisar saber.
