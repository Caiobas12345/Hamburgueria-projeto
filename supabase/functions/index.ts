// =====================================================================
// PÃO NA CHAPA · Edge Function "enviar-push"
// Chamada pelo Database Webhook quando entra uma linha nova em "notificacoes".
// Envia a notificação para os celulares inscritos da pessoa.
//
// Secrets necessários (Edge Functions > Secrets):
//   VAPID_PUBLICA   chave pública (a mesma do js/config.js)
//   VAPID_PRIVADA   chave privada (SEGREDO: só aqui)
//   VAPID_EMAIL     e-mail de contato, ex.: rafatomasi214@gmail.com
//   PUSH_SEGREDO    texto secreto que o Webhook manda no cabeçalho x-pnc-segredo
// SUPABASE_URL e SUPABASE_SERVICE_ROLE_KEY já existem automaticamente.
// =====================================================================
import { createClient } from "npm:@supabase/supabase-js@2";
import webpush from "npm:web-push@3.6.7";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL") ?? "";
const SERVICE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";
const SEGREDO = Deno.env.get("PUSH_SEGREDO") ?? "";
const PUBLICA = Deno.env.get("VAPID_PUBLICA") ?? "";
const PRIVADA = Deno.env.get("VAPID_PRIVADA") ?? "";
const EMAIL = Deno.env.get("VAPID_EMAIL") ?? "";

const resposta = (status: number, corpo: unknown) =>
  new Response(JSON.stringify(corpo), { status, headers: { "Content-Type": "application/json" } });

// comparação que não "vaza" o segredo pelo tempo de resposta
function iguais(a: string, b: string) {
  if (a.length !== b.length) return false;
  let r = 0;
  for (let i = 0; i < a.length; i++) r |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return r === 0;
}

Deno.serve(async (req) => {
  if (req.method !== "POST") return resposta(405, { erro: "Método não permitido" });
  if (!SEGREDO || !iguais(req.headers.get("x-pnc-segredo") ?? "", SEGREDO)) return resposta(401, { erro: "Não autorizado" });
  if (!PUBLICA || !PRIVADA || !EMAIL || !SERVICE_KEY) return resposta(500, { erro: "Faltam secrets da função" });

  let corpo: { record?: { id?: number } } = {};
  try { corpo = await req.json(); } catch { return resposta(400, { erro: "Corpo inválido" }); }
  const id = Number(corpo?.record?.id);
  if (!Number.isInteger(id) || id <= 0) return resposta(400, { erro: "Aviso inválido" });

  const sb = createClient(SUPABASE_URL, SERVICE_KEY, { auth: { persistSession: false } });

  // lê o aviso no banco (não confia no que veio na chamada)
  const { data: n, error } = await sb.from("notificacoes")
    .select("id, usuario_id, tipo, titulo, corpo, link, criada_em").eq("id", id).maybeSingle();
  if (error) return resposta(500, { erro: error.message });
  if (!n) return resposta(404, { erro: "Aviso não encontrado" });
  // aviso antigo não é reenviado
  if (Date.now() - new Date(n.criada_em).getTime() > 10 * 60 * 1000) return resposta(200, { enviados: 0, motivo: "antigo" });

  const { data: aparelhos } = await sb.from("push_inscricoes")
    .select("id, endpoint, p256dh, auth").eq("usuario_id", n.usuario_id);
  if (!aparelhos || !aparelhos.length) return resposta(200, { enviados: 0 });

  webpush.setVapidDetails("mailto:" + EMAIL, PUBLICA, PRIVADA);
  const conteudo = JSON.stringify({ titulo: n.titulo, corpo: n.corpo, link: n.link || "#inicio", tag: n.tipo + "-" + n.id });

  let enviados = 0;
  await Promise.all(aparelhos.map(async (a) => {
    try {
      await webpush.sendNotification({ endpoint: a.endpoint, keys: { p256dh: a.p256dh, auth: a.auth } }, conteudo, { TTL: 3600, urgency: "high" });
      enviados++;
    } catch (e) {
      const status = (e as { statusCode?: number }).statusCode;
      // aparelho desinstalou ou recusou: tira da lista
      if (status === 404 || status === 410) await sb.from("push_inscricoes").delete().eq("id", a.id);
      else console.error("push falhou", status, (e as Error).message);
    }
  }));
  return resposta(200, { enviados });
});
