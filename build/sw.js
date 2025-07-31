// Service Worker para PWA
const CACHE_NAME = 'calendario-igreja-v1';
const STATIC_CACHE = 'static-v1';
const DYNAMIC_CACHE = 'dynamic-v1';

// Arquivos para cache estático (sempre disponíveis offline)
const STATIC_FILES = [
  '/',
  '/dashboard',
  '/login',
  '/static/js/bundle.js',
  '/static/css/main.css',
  '/manifest.json',
  '/favicon.ico',
  '/logo192.png',
  '/logo512.png'
];

// URLs que devem ser acessíveis offline
const OFFLINE_FALLBACK_PAGES = [
  '/dashboard',
  '/login'
];

// URLs da API que devem ser cacheadas
const API_CACHE_URLS = [
  '/igrejas',
  '/evento',
  '/dizimo',
  '/membro',
  '/notificacao'
];

// Instalação do Service Worker
self.addEventListener('install', (event) => {
  console.log('[SW] Instalando Service Worker...');
  
  event.waitUntil(
    Promise.all([
      // Cache estático
      caches.open(STATIC_CACHE).then((cache) => {
        console.log('[SW] Cache estático criado');
        return cache.addAll(STATIC_FILES);
      }),
      // Cache dinâmico
      caches.open(DYNAMIC_CACHE).then((cache) => {
        console.log('[SW] Cache dinâmico criado');
        return cache.addAll(OFFLINE_FALLBACK_PAGES);
      })
    ])
  );
  
  // Ativar imediatamente
  self.skipWaiting();
});

// Ativação do Service Worker
self.addEventListener('activate', (event) => {
  console.log('[SW] Ativando Service Worker...');
  
  event.waitUntil(
    // Limpar caches antigos
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== STATIC_CACHE && cacheName !== DYNAMIC_CACHE) {
            console.log('[SW] Removendo cache antigo:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    }).then(() => {
      // Assumir controle de todas as abas
      return self.clients.claim();
    })
  );
});

// Interceptação de requisições
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Só interceptar requisições HTTP/HTTPS
  if (!request.url.startsWith('http')) {
    return;
  }

  // Estratégia: Cache First para arquivos estáticos
  if (isStaticFile(request)) {
    event.respondWith(
      caches.match(request).then((cachedResponse) => {
        return cachedResponse || fetch(request).then((fetchResponse) => {
          return caches.open(STATIC_CACHE).then((cache) => {
            cache.put(request, fetchResponse.clone());
            return fetchResponse;
          });
        });
      }).catch(() => {
        // Fallback para página offline
        if (request.mode === 'navigate') {
          return caches.match('/dashboard');
        }
      })
    );
    return;
  }

  // Estratégia: Network First para API calls
  if (isApiCall(request)) {
    event.respondWith(
      fetch(request).then((fetchResponse) => {
        // Se a resposta é OK, armazenar no cache
        if (fetchResponse.ok) {
          caches.open(DYNAMIC_CACHE).then((cache) => {
            cache.put(request, fetchResponse.clone());
          });
        }
        return fetchResponse;
      }).catch(() => {
        // Se falhar, tentar o cache
        return caches.match(request).then((cachedResponse) => {
          if (cachedResponse) {
            console.log('[SW] Servindo do cache (offline):', request.url);
            return cachedResponse;
          }
          
          // Se é uma requisição de navegação, retornar página offline
          if (request.mode === 'navigate') {
            return caches.match('/dashboard');
          }
          
          // Para outras requisições, retornar resposta de erro
          return new Response(
            JSON.stringify({ 
              error: 'Você está offline. Dados podem estar desatualizados.',
              offline: true 
            }),
            {
              status: 503,
              statusText: 'Service Unavailable',
              headers: { 'Content-Type': 'application/json' }
            }
          );
        });
      })
    );
    return;
  }

  // Estratégia: Stale While Revalidate para navegação
  if (request.mode === 'navigate') {
    event.respondWith(
      caches.match(request).then((cachedResponse) => {
        const fetchPromise = fetch(request).then((fetchResponse) => {
          caches.open(DYNAMIC_CACHE).then((cache) => {
            cache.put(request, fetchResponse.clone());
          });
          return fetchResponse;
        });

        return cachedResponse || fetchPromise;
      }).catch(() => {
        return caches.match('/dashboard');
      })
    );
    return;
  }
});

// Background Sync para quando voltar online
self.addEventListener('sync', (event) => {
  console.log('[SW] Evento de sincronização:', event.tag);
  
  if (event.tag === 'background-sync') {
    event.waitUntil(
      // Aqui poderia sincronizar dados pendentes
      syncPendingData()
    );
  }
});

// Push Notifications
self.addEventListener('push', (event) => {
  console.log('[SW] Push recebido:', event);
  
  const options = {
    body: event.data ? event.data.text() : 'Nova notificação!',
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
        title: 'Ver Detalhes',
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

// Click em notificação
self.addEventListener('notificationclick', (event) => {
  console.log('[SW] Notificação clicada:', event);
  
  event.notification.close();

  if (event.action === 'explore') {
    event.waitUntil(
      clients.openWindow('/dashboard')
    );
  }
});

// Funções auxiliares
function isStaticFile(request) {
  return request.url.includes('/static/') || 
         request.url.includes('/manifest.json') ||
         request.url.includes('/favicon.ico') ||
         request.url.includes('/logo');
}

function isApiCall(request) {
  const url = new URL(request.url);
  return url.port === '3005' || // Backend port
         API_CACHE_URLS.some(apiUrl => request.url.includes(apiUrl));
}

async function syncPendingData() {
  // Implementar sincronização de dados pendentes
  console.log('[SW] Sincronizando dados pendentes...');
  
  try {
    // Aqui poderia enviar dados que ficaram pendentes durante offline
    const pendingRequests = await getPendingRequests();
    
    for (const pendingRequest of pendingRequests) {
      try {
        await fetch(pendingRequest.url, pendingRequest.options);
        await removePendingRequest(pendingRequest.id);
      } catch (error) {
        console.log('[SW] Falha ao sincronizar:', error);
      }
    }
  } catch (error) {
    console.log('[SW] Erro na sincronização:', error);
  }
}

async function getPendingRequests() {
  // Implementar busca de requisições pendentes
  return [];
}

async function removePendingRequest(id) {
  // Implementar remoção de requisição pendente
  console.log('[SW] Removendo requisição pendente:', id);
}