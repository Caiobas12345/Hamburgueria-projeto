/* =====================================================================
   PÃO NA CHAPA · Service worker
   Só recebe as notificações do celular e abre o site no toque.
   Não guarda páginas em cache (o site continua sempre atualizado).
===================================================================== */
self.addEventListener('install', () => self.skipWaiting());
self.addEventListener('activate', e => e.waitUntil(self.clients.claim()));

self.addEventListener('push', e => {
  let d = {};
  try { d = e.data ? e.data.json() : {}; } catch (er) { d = { titulo: e.data ? e.data.text() : '' }; }
  e.waitUntil(self.registration.showNotification(d.titulo || 'Pão na Chapa', {
    body: d.corpo || '',
    icon: 'assets/img/icone-192.png',
    badge: 'assets/img/icone-badge.png',
    tag: d.tag || undefined,
    lang: 'pt-BR',
    data: { link: typeof d.link === 'string' && /^#[a-z0-9/_-]*$/.test(d.link) ? d.link : '#inicio' }
  }));
});

self.addEventListener('notificationclick', e => {
  e.notification.close();
  const alvo = new URL(e.notification.data.link || '#inicio', self.registration.scope).href;
  e.waitUntil(self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then(janelas => {
    const aberta = janelas.find(j => j.url.indexOf(self.registration.scope) === 0);
    if (aberta) return aberta.focus().then(j => (j && j.navigate ? j.navigate(alvo) : null)).catch(() => self.clients.openWindow(alvo));
    return self.clients.openWindow(alvo);
  }));
});
