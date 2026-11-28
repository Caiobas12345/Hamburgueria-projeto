/* =====================================================================
   PÃO NA CHAPA · Ligação com o Supabase
   Preencha com os dados do projeto Supabase DO PÃO NA CHAPA
   (Supabase > Project Settings > API):
     supabaseUrl: "Project URL"
     supabaseKey: chave "publishable" (ou "anon public")
   NUNCA coloque aqui a chave "service_role" / "secret" nem a chave privada das notificações.
   Enquanto estiver vazio, o site abre normalmente, mas sem cardápio, login e pedidos.
===================================================================== */
window.PNC_CONFIG = {
  supabaseUrl: 'https://xzytpqbkthctavnmdvte.supabase.co',
  supabaseKey: 'sb_publishable_MfMPh_KmWJHAjJhGv2aFBA_L22RdqQw',
  // notificações no celular: cole aqui a CHAVE PÚBLICA gerada em ferramentas/gerar-chaves-push.html
  // (a chave PRIVADA vai só nos Secrets do Supabase, nunca aqui). Vazio = sem notificações no celular.
  vapidPublica: 'zxBOGWnBCVOeuyKYFoR0vuKwRaYWxHCcVhPL0VfHSu8'
};
