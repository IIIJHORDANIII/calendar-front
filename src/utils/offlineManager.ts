interface OfflineData {
  lastSync: number;
  dashboardData: any;
  notifications: any[];
  eventos: any[];
  membros: any[];
  userPreferences: any;
}

interface SyncQueueItem {
  id: string;
  action: 'CREATE' | 'UPDATE' | 'DELETE';
  endpoint: string;
  data: any;
  timestamp: number;
  retryCount: number;
}

export class OfflineManager {
  private storageKey = 'igreja-offline-data';
  private syncQueueKey = 'igreja-sync-queue';
  private maxRetries = 3;
  private syncQueue: SyncQueueItem[] = [];
  private isOnline = navigator.onLine;
  private syncInProgress = false;

  constructor() {
    this.initializeOfflineManager();
  }

  private initializeOfflineManager() {
    // Registrar service worker
    this.registerServiceWorker();
    
    // Monitorar status de conexão
    this.setupConnectionMonitoring();
    
    // Carregar fila de sincronização
    this.loadSyncQueue();
    
    // Tentar sincronizar quando voltar online
    if (this.isOnline) {
      this.performSync();
    }
  }

  private async registerServiceWorker() {
    if ('serviceWorker' in navigator) {
      try {
        const registration = await navigator.serviceWorker.register('/sw.js');
        console.log('✅ Service Worker registrado:', registration.scope);
        
        // Escutar mensagens do service worker
        navigator.serviceWorker.addEventListener('message', (event) => {
          if (event.data.type === 'CACHE_UPDATED') {
            console.log('📦 Cache atualizado:', event.data.url);
          }
        });
      } catch (error) {
        console.error('❌ Erro ao registrar Service Worker:', error);
      }
    }
  }

  private setupConnectionMonitoring() {
    window.addEventListener('online', () => {
      console.log('🌐 Conexão restaurada');
      this.isOnline = true;
      this.showConnectionStatus('online');
      this.performSync();
    });

    window.addEventListener('offline', () => {
      console.log('📴 Conexão perdida');
      this.isOnline = false;
      this.showConnectionStatus('offline');
    });

    // Verificar conectividade periodicamente
    setInterval(async () => {
      const wasOnline = this.isOnline;
      this.isOnline = await this.checkConnectivity();
      
      if (!wasOnline && this.isOnline) {
        this.performSync();
      }
    }, 30000); // Verificar a cada 30 segundos
  }

  private async checkConnectivity(): Promise<boolean> {
    try {
      const response = await fetch('/api/config/public', {
        method: 'HEAD',
        cache: 'no-cache'
      });
      return response.ok;
    } catch {
      return false;
    }
  }

  private showConnectionStatus(status: 'online' | 'offline') {
    // Criar ou atualizar indicador de status
    let indicator = document.getElementById('connection-indicator');
    
    if (!indicator) {
      indicator = document.createElement('div');
      indicator.id = 'connection-indicator';
      indicator.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        padding: 8px 16px;
        border-radius: 20px;
        font-size: 14px;
        font-weight: bold;
        z-index: 10000;
        transition: all 0.3s ease;
      `;
      document.body.appendChild(indicator);
    }

    if (status === 'online') {
      indicator.textContent = '🌐 Online';
      indicator.style.background = '#10B981';
      indicator.style.color = 'white';
      
      // Remover após 3 segundos
      setTimeout(() => {
        if (indicator) {
          indicator.style.opacity = '0';
          setTimeout(() => indicator?.remove(), 300);
        }
      }, 3000);
    } else {
      indicator.textContent = '📴 Offline';
      indicator.style.background = '#EF4444';
      indicator.style.color = 'white';
      indicator.style.opacity = '1';
    }
  }

  // Armazenar dados para uso offline
  public storeOfflineData(key: keyof OfflineData, data: any) {
    try {
      const offlineData = this.getOfflineData();
      offlineData[key] = data;
      offlineData.lastSync = Date.now();
      
      localStorage.setItem(this.storageKey, JSON.stringify(offlineData));
      console.log(`💾 Dados offline salvos: ${key}`);
    } catch (error) {
      console.error('Erro ao salvar dados offline:', error);
    }
  }

  // Recuperar dados offline
  public getOfflineData(): OfflineData {
    try {
      const stored = localStorage.getItem(this.storageKey);
      if (stored) {
        return JSON.parse(stored);
      }
    } catch (error) {
      console.error('Erro ao recuperar dados offline:', error);
    }
    
    return {
      lastSync: 0,
      dashboardData: null,
      notifications: [],
      eventos: [],
      membros: [],
      userPreferences: {}
    };
  }

  // Adicionar item à fila de sincronização
  public addToSyncQueue(action: SyncQueueItem['action'], endpoint: string, data: any) {
    const item: SyncQueueItem = {
      id: Date.now().toString() + Math.random().toString(36),
      action,
      endpoint,
      data,
      timestamp: Date.now(),
      retryCount: 0
    };

    this.syncQueue.push(item);
    this.saveSyncQueue();
    
    console.log(`📝 Adicionado à fila de sincronização: ${action} ${endpoint}`);
    
    // Tentar sincronizar se estiver online
    if (this.isOnline) {
      this.performSync();
    }
  }

  // Carregar fila de sincronização
  private loadSyncQueue() {
    try {
      const stored = localStorage.getItem(this.syncQueueKey);
      if (stored) {
        this.syncQueue = JSON.parse(stored);
      }
    } catch (error) {
      console.error('Erro ao carregar fila de sincronização:', error);
      this.syncQueue = [];
    }
  }

  // Salvar fila de sincronização
  private saveSyncQueue() {
    try {
      localStorage.setItem(this.syncQueueKey, JSON.stringify(this.syncQueue));
    } catch (error) {
      console.error('Erro ao salvar fila de sincronização:', error);
    }
  }

  // Executar sincronização
  public async performSync() {
    if (this.syncInProgress || !this.isOnline || this.syncQueue.length === 0) {
      return;
    }

    this.syncInProgress = true;
    console.log(`🔄 Iniciando sincronização: ${this.syncQueue.length} itens`);

    const itemsToProcess = [...this.syncQueue];
    
    for (const item of itemsToProcess) {
      try {
        await this.syncItem(item);
        
        // Remover item da fila após sucesso
        this.syncQueue = this.syncQueue.filter(q => q.id !== item.id);
      } catch (error) {
        console.error(`❌ Erro ao sincronizar item ${item.id}:`, error);
        
        // Incrementar contador de retry
        const queueItem = this.syncQueue.find(q => q.id === item.id);
        if (queueItem) {
          queueItem.retryCount++;
          
          // Remover item se excedeu max retries
          if (queueItem.retryCount >= this.maxRetries) {
            console.warn(`⚠️ Item ${item.id} removido após ${this.maxRetries} tentativas`);
            this.syncQueue = this.syncQueue.filter(q => q.id !== item.id);
          }
        }
      }
    }

    this.saveSyncQueue();
    this.syncInProgress = false;
    
    console.log(`✅ Sincronização concluída: ${this.syncQueue.length} itens restantes`);
  }

  // Sincronizar item específico
  private async syncItem(item: SyncQueueItem) {
    const { action, endpoint, data } = item;
    
    let response: Response;
    
    switch (action) {
      case 'CREATE':
        response = await fetch(endpoint, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${localStorage.getItem('token')}`
          },
          body: JSON.stringify(data)
        });
        break;
        
      case 'UPDATE':
        response = await fetch(endpoint, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${localStorage.getItem('token')}`
          },
          body: JSON.stringify(data)
        });
        break;
        
      case 'DELETE':
        response = await fetch(endpoint, {
          method: 'DELETE',
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('token')}`
          }
        });
        break;
    }

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    return await response.json();
  }

  // Verificar se está em modo offline
  public isOffline(): boolean {
    return !this.isOnline;
  }

  // Obter status da sincronização
  public getSyncStatus() {
    return {
      isOnline: this.isOnline,
      syncInProgress: this.syncInProgress,
      queueLength: this.syncQueue.length,
      lastSync: this.getOfflineData().lastSync,
      failedItems: this.syncQueue.filter(item => item.retryCount > 0).length
    };
  }

  // Limpar dados offline
  public clearOfflineData() {
    localStorage.removeItem(this.storageKey);
    localStorage.removeItem(this.syncQueueKey);
    this.syncQueue = [];
    console.log('🗑️ Dados offline limpos');
  }

  // Forçar sincronização
  public forcSync() {
    this.syncInProgress = false;
    this.performSync();
  }

  // Background sync (quando suportado)
  public async requestBackgroundSync() {
    if ('serviceWorker' in navigator && 'sync' in window.ServiceWorkerRegistration.prototype) {
      try {
        const registration = await navigator.serviceWorker.ready;
        // Type assertion para Background Sync API
        const syncRegistration = registration as any;
        if (syncRegistration.sync) {
          await syncRegistration.sync.register('background-sync-dashboard');
          console.log('📡 Background sync registrado');
        }
      } catch (error) {
        console.error('Erro ao registrar background sync:', error);
      }
    }
  }

  // Preload dados essenciais
  public async preloadEssentialData() {
    if (!this.isOnline) return;

    try {
      const token = localStorage.getItem('token');
      if (!token) return;

      // Buscar dados essenciais e armazenar offline
      const [configResponse, notificationsResponse] = await Promise.all([
        fetch('/api/config/public'),
        fetch('/api/notificacao', {
          headers: { 'Authorization': `Bearer ${token}` }
        })
      ]);

      if (configResponse.ok) {
        const config = await configResponse.json();
        this.storeOfflineData('userPreferences', config);
      }

      if (notificationsResponse.ok) {
        const notifications = await notificationsResponse.json();
        this.storeOfflineData('notifications', notifications);
      }

      console.log('📦 Dados essenciais precarregados para modo offline');
    } catch (error) {
      console.error('Erro ao precarregar dados:', error);
    }
  }
}

// Instância global
export const offlineManager = new OfflineManager();