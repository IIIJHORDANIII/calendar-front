import { useState, useEffect, useCallback } from 'react';

/**
 * Sistema de Notificações Push
 * Implementa notificações push nativas do navegador
 */

interface PushNotificationOptions {
  title: string;
  body: string;
  icon?: string;
  badge?: string;
  image?: string;
  tag?: string;
  data?: any;
  requireInteraction?: boolean;
  silent?: boolean;
  vibrate?: number[];
  actions?: Array<{
    action: string;
    title: string;
    icon?: string;
  }>;
}

interface PushSubscriptionData {
  endpoint: string;
  keys: {
    p256dh: string;
    auth: string;
  };
}

class PushNotificationService {
  private registration: ServiceWorkerRegistration | null = null;
  private subscription: PushSubscription | null = null;
  private isSupported: boolean = false;
  private isPermissionGranted: boolean = false;

  constructor() {
    this.checkSupport();
    this.initializeService();
  }

  // Verificar suporte do navegador
  private checkSupport(): void {
    this.isSupported = 
      'serviceWorker' in navigator &&
      'PushManager' in window &&
      'Notification' in window;
  }

  // Inicializar serviço
  private async initializeService(): Promise<void> {
    if (!this.isSupported) {
      console.warn('Push notifications não são suportadas neste navegador');
      return;
    }

    try {
      // Registrar service worker se não estiver registrado
      this.registration = await navigator.serviceWorker.getRegistration() || null;
      
      if (!this.registration) {
        this.registration = await navigator.serviceWorker.register('/sw.js');
        console.log('Service Worker registrado para push notifications');
      }

      // Verificar permissão atual
      this.checkPermission();
      
      // Tentar obter subscription existente
      await this.getExistingSubscription();

    } catch (error) {
      console.error('Erro ao inicializar push notifications:', error);
    }
  }

  // Verificar permissão atual
  private checkPermission(): void {
    this.isPermissionGranted = Notification.permission === 'granted';
  }

  // Solicitar permissão do usuário
  async requestPermission(): Promise<boolean> {
    if (!this.isSupported) {
      throw new Error('Push notifications não são suportadas');
    }

    if (Notification.permission === 'granted') {
      this.isPermissionGranted = true;
      return true;
    }

    if (Notification.permission === 'denied') {
      throw new Error('Permissão para notificações foi negada pelo usuário');
    }

    try {
      const permission = await Notification.requestPermission();
      this.isPermissionGranted = permission === 'granted';
      
      if (this.isPermissionGranted) {
        console.log('Permissão para push notifications concedida');
        await this.subscribeToPush();
      }
      
      return this.isPermissionGranted;
    } catch (error) {
      console.error('Erro ao solicitar permissão:', error);
      return false;
    }
  }

  // Obter subscription existente
  private async getExistingSubscription(): Promise<void> {
    if (!this.registration) return;

    try {
      this.subscription = await this.registration.pushManager.getSubscription();
      if (this.subscription) {
        console.log('Subscription existente encontrada');
        // Aqui você pode enviar a subscription para o servidor se necessário
        await this.syncSubscriptionWithServer();
      }
    } catch (error) {
      console.error('Erro ao obter subscription existente:', error);
    }
  }

  // Fazer subscription para push notifications
  async subscribeToPush(): Promise<PushSubscriptionData | null> {
    if (!this.isSupported || !this.isPermissionGranted || !this.registration) {
      throw new Error('Pré-requisitos para push notifications não atendidos');
    }

    try {
      // Chave pública VAPID (em produção, deve vir do servidor)
const vapidPublicKey = 'BFbjRcdJsEhS-cfVfP_Cxc5xi7lFKwQ7DYqRiTQA9Dl_LcaitlSw0LPrX94lBdZCjHSyWziyERNNA9JBty_GaR8';

      const subscription = await this.registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: this.urlBase64ToUint8Array(vapidPublicKey)
      });

      this.subscription = subscription;
      
      const subscriptionData: PushSubscriptionData = {
        endpoint: subscription.endpoint,
        keys: {
          p256dh: this.arrayBufferToBase64(subscription.getKey('p256dh')!),
          auth: this.arrayBufferToBase64(subscription.getKey('auth')!)
        }
      };

      console.log('Subscription criada com sucesso');
      
      // Enviar subscription para o servidor
      await this.syncSubscriptionWithServer(subscriptionData);
      
      return subscriptionData;

    } catch (error) {
      console.error('Erro ao fazer subscription:', error);
      throw error;
    }
  }

  // Sincronizar subscription com servidor
  private async syncSubscriptionWithServer(subscriptionData?: PushSubscriptionData): Promise<void> {
    try {
      const token = localStorage.getItem('token');
      const user = JSON.parse(localStorage.getItem('user') || '{}');
      
      if (!token || !user._id) {
        console.warn('Usuário não autenticado, não é possível sincronizar subscription');
        return;
      }

      const data = subscriptionData || {
        endpoint: this.subscription?.endpoint,
        keys: {
          p256dh: this.arrayBufferToBase64(this.subscription?.getKey('p256dh')!),
          auth: this.arrayBufferToBase64(this.subscription?.getKey('auth')!)
        }
      };

      // Enviar para o backend (implementar endpoint no backend)
      const response = await fetch('http://localhost:3005/push/subscribe', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          subscription: data,
          userId: user._id
        })
      });

      if (response.ok) {
        console.log('Subscription sincronizada com o servidor');
      } else {
        console.warn('Falha ao sincronizar subscription com o servidor');
      }

    } catch (error) {
      console.error('Erro ao sincronizar com servidor:', error);
    }
  }

  // Cancelar subscription
  async unsubscribe(): Promise<boolean> {
    if (!this.subscription) {
      console.log('Nenhuma subscription ativa para cancelar');
      return true;
    }

    try {
      const success = await this.subscription.unsubscribe();
      
      if (success) {
        this.subscription = null;
        console.log('Subscription cancelada com sucesso');
        
        // Notificar o servidor sobre o cancelamento
        await this.notifyServerUnsubscribe();
      }
      
      return success;
    } catch (error) {
      console.error('Erro ao cancelar subscription:', error);
      return false;
    }
  }

  // Notificar servidor sobre cancelamento
  private async notifyServerUnsubscribe(): Promise<void> {
    try {
      const token = localStorage.getItem('token');
      const user = JSON.parse(localStorage.getItem('user') || '{}');
      
      if (!token || !user._id) return;

      await fetch('http://localhost:3005/push/unsubscribe', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ userId: user._id })
      });

    } catch (error) {
      console.error('Erro ao notificar servidor sobre cancelamento:', error);
    }
  }

  // Mostrar notificação local (não push, mas usando a API de notificações)
  async showLocalNotification(options: PushNotificationOptions): Promise<void> {
    if (!this.isSupported || !this.isPermissionGranted) {
      console.warn('Notificações não estão disponíveis');
      return;
    }

    try {
      const notification = new Notification(options.title, {
        body: options.body,
        icon: options.icon || '/logo192.png',
        badge: options.badge || '/favicon.ico',
        image: options.image,
        tag: options.tag,
        data: options.data,
        requireInteraction: options.requireInteraction || false,
        silent: options.silent || false,
        vibrate: options.vibrate || [100, 50, 100]
      });

      // Event listeners
      notification.onclick = (event) => {
        event.preventDefault();
        window.focus();
        
        if (options.data?.url) {
          window.open(options.data.url, '_blank');
        }
        
        notification.close();
      };

      notification.onclose = () => {
        console.log('Notificação fechada');
      };

      notification.onerror = (error) => {
        console.error('Erro na notificação:', error);
      };

      // Auto-close após 5 segundos (se não for requireInteraction)
      if (!options.requireInteraction) {
        setTimeout(() => {
          notification.close();
        }, 5000);
      }

    } catch (error) {
      console.error('Erro ao mostrar notificação:', error);
    }
  }

  // Verificar status
  getStatus(): {
    isSupported: boolean;
    hasPermission: boolean;
    isSubscribed: boolean;
  } {
    return {
      isSupported: this.isSupported,
      hasPermission: this.isPermissionGranted,
      isSubscribed: !!this.subscription
    };
  }

  // Métodos utilitários
  private urlBase64ToUint8Array(base64String: string): Uint8Array {
    const padding = '='.repeat((4 - base64String.length % 4) % 4);
    const base64 = (base64String + padding)
      .replace(/-/g, '+')
      .replace(/_/g, '/');

    const rawData = window.atob(base64);
    const outputArray = new Uint8Array(rawData.length);

    for (let i = 0; i < rawData.length; ++i) {
      outputArray[i] = rawData.charCodeAt(i);
    }
    return outputArray;
  }

  private arrayBufferToBase64(buffer: ArrayBuffer): string {
    const bytes = new Uint8Array(buffer);
    let binary = '';
    bytes.forEach(byte => binary += String.fromCharCode(byte));
    return window.btoa(binary);
  }
}

// Instância global do serviço
export const pushService = new PushNotificationService();

// Hook React para usar push notifications
export const usePushNotifications = () => {
  const [status, setStatus] = useState(pushService.getStatus());
  const [loading, setLoading] = useState(false);

  // Atualizar status
  const updateStatus = useCallback(() => {
    setStatus(pushService.getStatus());
  }, []);

  // Solicitar permissão
  const requestPermission = useCallback(async () => {
    try {
      setLoading(true);
      const granted = await pushService.requestPermission();
      updateStatus();
      return granted;
    } catch (error) {
      console.error('Erro ao solicitar permissão:', error);
      return false;
    } finally {
      setLoading(false);
    }
  }, [updateStatus]);

  // Fazer subscription
  const subscribe = useCallback(async () => {
    try {
      setLoading(true);
      const subscription = await pushService.subscribeToPush();
      updateStatus();
      return subscription;
    } catch (error) {
      console.error('Erro ao fazer subscription:', error);
      return null;
    } finally {
      setLoading(false);
    }
  }, [updateStatus]);

  // Cancelar subscription
  const unsubscribe = useCallback(async () => {
    try {
      setLoading(true);
      const success = await pushService.unsubscribe();
      updateStatus();
      return success;
    } catch (error) {
      console.error('Erro ao cancelar subscription:', error);
      return false;
    } finally {
      setLoading(false);
    }
  }, [updateStatus]);

  // Mostrar notificação local
  const showNotification = useCallback(async (options: PushNotificationOptions) => {
    try {
      await pushService.showLocalNotification(options);
    } catch (error) {
      console.error('Erro ao mostrar notificação:', error);
    }
  }, []);

  // Verificar status na inicialização
  useEffect(() => {
    const checkStatus = () => {
      setTimeout(updateStatus, 1000); // Dar tempo para inicialização
    };
    
    checkStatus();
  }, [updateStatus]);

  return {
    status,
    loading,
    requestPermission,
    subscribe,
    unsubscribe,
    showNotification
  };
};

// Tipos de notificação pré-definidos para a igreja
export const NotificationTemplates = {
  newEvent: (eventName: string, date: string): PushNotificationOptions => ({
    title: '📅 Novo Evento Programado',
    body: `${eventName} - ${date}`,
    icon: '/logo192.png',
    tag: 'new-event',
    data: { type: 'event', url: '/events' },
    requireInteraction: false,
    vibrate: [100, 50, 100, 50, 100]
  }),

  eventReminder: (eventName: string, timeUntil: string): PushNotificationOptions => ({
    title: '🔔 Lembrete de Evento',
    body: `${eventName} começa em ${timeUntil}`,
    icon: '/logo192.png',
    tag: 'event-reminder',
    data: { type: 'reminder', url: '/events' },
    requireInteraction: true,
    vibrate: [200, 100, 200]
  }),

  titheReminder: (): PushNotificationOptions => ({
    title: '💰 Lembrete de Dízimo',
    body: 'Não se esqueça de registrar sua contribuição deste mês',
    icon: '/logo192.png',
    tag: 'tithe-reminder',
    data: { type: 'tithe', url: '/tithes' },
    requireInteraction: false,
    vibrate: [100, 50, 100]
  }),

  newMember: (memberName: string): PushNotificationOptions => ({
    title: '🎉 Novo Membro!',
    body: `${memberName} foi adicionado à congregação`,
    icon: '/logo192.png',
    tag: 'new-member',
    data: { type: 'member', url: '/members' },
    requireInteraction: false,
    vibrate: [100, 50, 100, 50, 100, 50, 100]
  }),

  systemAlert: (message: string): PushNotificationOptions => ({
    title: '⚠️ Alerta do Sistema',
    body: message,
    icon: '/logo192.png',
    tag: 'system-alert',
    data: { type: 'system', url: '/dashboard' },
    requireInteraction: true,
    vibrate: [200, 100, 200, 100, 200]
  }),

  weeklyReport: (churchName: string): PushNotificationOptions => ({
    title: '📊 Relatório Semanal Disponível',
    body: `Novo relatório de ${churchName} está pronto para visualização`,
    icon: '/logo192.png',
    tag: 'weekly-report',
    data: { type: 'report', url: '/dashboard' },
    requireInteraction: false,
    vibrate: [100, 50, 100]
  })
};

export default PushNotificationService;