// Service Worker para PWA
const CACHE_NAME = 'sistema-igreja-v1.0.0';
const STATIC_CACHE_NAME = 'sistema-igreja-static-v1.0.0';
const DYNAMIC_CACHE_NAME = 'sistema-igreja-dynamic-v1.0.0';

// Arquivos para cache offline
const urlsToCache = [
  '/',
  '/static/js/bundle.js',
  '/static/css/main.css',
  '/manifest.json',
  '/favicon.ico',
  '/logo192.png',
  '/logo512.png',
  // Páginas principais
  '/dashboard',
  '/login',
  '/events',
  '/tithes',
  '/members',
  '/churches'
];

// Instalação do Service Worker
self.addEventListener('install', (event) => {
  console.log('🔧 Service Worker instalando...');
  
  event.waitUntil(
    caches.open(STATIC_CACHE_NAME)
      .then((cache) => {
        console.log('📦 Cache estático criado');
        return cache.addAll(urlsToCache);
      })
      .catch((error) => {
        console.error('❌ Erro ao criar cache:', error);
      })
  );
  
  // Força a ativação imediata
  self.skipWaiting();
});

// Ativação do Service Worker
self.addEventListener('activate', (event) => {
  console.log('✅ Service Worker ativado');
  
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          // Remove caches antigos
          if (cacheName !== STATIC_CACHE_NAME && 
              cacheName !== DYNAMIC_CACHE_NAME &&
              cacheName.startsWith('sistema-igreja-')) {
            console.log('🗑️ Removendo cache antigo:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
  
  // Assume controle imediatamente
  self.clients.claim();
});

// Interceptação de requisições (Fetch)
self.addEventListener('fetch', (event) => {
  const request = event.request;
  const url = new URL(request.url);
  
  // Ignorar requisições não HTTP/HTTPS
  if (!request.url.startsWith('http')) {
    return;
  }
  
  // Strategy: Cache First para arquivos estáticos
  if (request.destination === 'script' || 
      request.destination === 'style' || 
      request.destination === 'image' ||
      request.url.includes('/static/')) {
    
    event.respondWith(
      caches.match(request)
        .then((response) => {
          if (response) {
            return response;
          }
          
          return fetch(request).then((response) => {
            // Não cachear se não for uma resposta válida
            if (!response || response.status !== 200 || response.type !== 'basic') {
              return response;
            }
            
            const responseToCache = response.clone();
            caches.open(STATIC_CACHE_NAME)
              .then((cache) => {
                cache.put(request, responseToCache);
              });
            
            return response;
          });
        })
    );
    return;
  }
  
  // Strategy: Network First para API calls
  if (request.url.includes('/api/') || request.url.includes(':3005')) {
    event.respondWith(
      fetch(request)
        .then((response) => {
          // Se a requisição for bem-sucedida, cachear para uso offline
          if (response.status === 200) {
            const responseToCache = response.clone();
            caches.open(DYNAMIC_CACHE_NAME)
              .then((cache) => {
                cache.put(request, responseToCache);
              });
          }
          return response;
        })
        .catch(() => {
          // Se falhar, tentar buscar no cache
          return caches.match(request).then((response) => {
            if (response) {
              // Adicionar header indicando que é cache
              const headers = new Headers(response.headers);
              headers.append('X-Served-By', 'ServiceWorker-Cache');
              
              return new Response(response.body, {
                status: response.status,
                statusText: response.statusText,
                headers: headers
              });
            }
            
            // Se não tiver no cache, retornar resposta offline
            if (request.destination === 'document') {
              return new Response(
                getOfflineHTML(),
                { 
                  headers: { 'Content-Type': 'text/html' }
                }
              );
            }
            
            return new Response(
              JSON.stringify({ 
                error: 'Sem conexão', 
                offline: true,
                message: 'Dados não disponíveis offline' 
              }),
              { 
                headers: { 'Content-Type': 'application/json' }
              }
            );
          });
        })
    );
    return;
  }
  
  // Strategy: Cache First para navegação
  if (request.destination === 'document') {
    event.respondWith(
      caches.match(request)
        .then((response) => {
          if (response) {
            return response;
          }
          
          return fetch(request)
            .then((response) => {
              const responseToCache = response.clone();
              caches.open(DYNAMIC_CACHE_NAME)
                .then((cache) => {
                  cache.put(request, responseToCache);
                });
              return response;
            })
            .catch(() => {
              // Página offline
              return new Response(
                getOfflineHTML(),
                { headers: { 'Content-Type': 'text/html' } }
              );
            });
        })
    );
  }
});

// Sincronização em background
self.addEventListener('sync', (event) => {
  console.log('🔄 Background Sync:', event.tag);
  
  if (event.tag === 'background-sync-dashboard') {
    event.waitUntil(syncDashboardData());
  }
  
  if (event.tag === 'background-sync-notifications') {
    event.waitUntil(syncNotifications());
  }
});

// Push notifications
self.addEventListener('push', (event) => {
  console.log('🔔 Push recebido:', event);
  
  const options = {
    body: event.data ? event.data.text() : 'Nova notificação do Sistema Igreja',
    icon: '/logo192.png',
    badge: '/favicon.ico',
    vibrate: [100, 50, 100],
    data: {
      dateOfArrival: Date.now(),
      primaryKey: 1
    },
    actions: [
      {
        action: 'explore',
        title: 'Ver',
        icon: '/logo192.png'
      },
      {
        action: 'close',
        title: 'Fechar',
        icon: '/logo192.png'
      }
    ]
  };
  
  event.waitUntil(
    self.registration.showNotification('Sistema Igreja', options)
  );
});

// Click em notificações
self.addEventListener('notificationclick', (event) => {
  console.log('🔔 Notificação clicada:', event.notification.tag);
  
  event.notification.close();
  
  if (event.action === 'explore') {
    event.waitUntil(
      clients.openWindow('/dashboard')
    );
  }
});

// Funções auxiliares
function getOfflineHTML() {
  return `
    <!DOCTYPE html>
    <html lang="pt-BR">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Offline - Sistema Igreja</title>
      <style>
        body {
          font-family: Arial, sans-serif;
          display: flex;
          justify-content: center;
          align-items: center;
          min-height: 100vh;
          margin: 0;
          background: linear-gradient(135deg, #4472C4, #70AD47);
          color: white;
          text-align: center;
        }
        .container {
          max-width: 400px;
          padding: 20px;
        }
        .icon {
          font-size: 4rem;
          margin-bottom: 20px;
        }
        h1 {
          margin-bottom: 10px;
        }
        p {
          margin-bottom: 20px;
          opacity: 0.9;
        }
        button {
          background: white;
          color: #4472C4;
          border: none;
          padding: 12px 24px;
          border-radius: 6px;
          cursor: pointer;
          font-weight: bold;
        }
        button:hover {
          background: #f0f0f0;
        }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="icon">📱</div>
        <h1>Você está offline</h1>
        <p>Não foi possível conectar ao servidor. Algumas funcionalidades podem estar limitadas.</p>
        <button onclick="window.location.reload()">Tentar novamente</button>
        <div style="margin-top: 20px;">
          <small>Sistema Igreja - Modo Offline</small>
        </div>
      </div>
    </body>
    </html>
  `;
}

async function syncDashboardData() {
  try {
    const response = await fetch('/api/dashboard/sync');
    if (response.ok) {
      console.log('✅ Dashboard sincronizado');
    }
  } catch (error) {
    console.error('❌ Erro na sincronização:', error);
  }
}

async function syncNotifications() {
  try {
    const response = await fetch('/api/notifications/sync');
    if (response.ok) {
      console.log('✅ Notificações sincronizadas');
    }
  } catch (error) {
    console.error('❌ Erro na sincronização de notificações:', error);
  }
}

// Limpeza periódica de cache
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'CACHE_CLEANUP') {
    event.waitUntil(cleanupCaches());
  }
});

async function cleanupCaches() {
  const cacheNames = await caches.keys();
  const oldCaches = cacheNames.filter(name => 
    name.startsWith('sistema-igreja-') && 
    name !== STATIC_CACHE_NAME && 
    name !== DYNAMIC_CACHE_NAME
  );
  
  await Promise.all(
    oldCaches.map(cacheName => caches.delete(cacheName))
  );
  
  console.log('🧹 Cache limpo:', oldCaches.length, 'caches removidos');
}