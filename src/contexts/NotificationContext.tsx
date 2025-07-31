import React, { createContext, useContext, useState, useEffect, ReactNode, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Bell, 
  X, 
  CheckCircle, 
  AlertTriangle, 
  Info, 
  AlertCircle,
  Calendar,
  DollarSign,
  Users,
  Church
} from 'lucide-react';
import apiService from '../utils/api';

// Tipos do backend
interface BackendNotification {
  _id: string;
  tipo: 'evento' | 'dizimo' | 'igreja' | 'usuario' | 'calendario' | 'pastor' | 'diretoria';
  acao: 'criado' | 'editado' | 'deletado';
  titulo: string;
  descricao: string;
  igreja: {
    _id: string;
    nome: string;
    tipo: string;
  };
  usuario: {
    _id: string;
    nome: string;
    email: string;
  };
  itemId: string;
  itemTipo: string;
  lida: boolean;
  createdAt: string;
  updatedAt: string;
}

// Interface unificada para o frontend
export interface Notification {
  id: string;
  type: 'success' | 'error' | 'warning' | 'info';
  category: 'system' | 'event' | 'financial' | 'member' | 'church';
  title: string;
  message: string;
  timestamp: Date;
  read: boolean;
  action?: {
    label: string;
    onClick: () => void;
  };
  autoRemove?: boolean;
  duration?: number;
  // Dados do backend
  backendId?: string;
  churchName?: string;
  userName?: string;
}

interface NotificationContextType {
  notifications: Notification[];
  addNotification: (notification: Omit<Notification, 'id' | 'timestamp' | 'read'>) => void;
  removeNotification: (id: string) => void;
  markAsRead: (id: string) => void;
  markAllAsRead: () => void;
  clearAll: () => void;
  unreadCount: number;
  refreshNotifications: () => Promise<void>;
  loading: boolean;
}

const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

export const useNotifications = () => {
  const context = useContext(NotificationContext);
  if (!context) {
    throw new Error('useNotifications must be used within a NotificationProvider');
  }
  return context;
};

interface NotificationProviderProps {
  children: ReactNode;
}

export const NotificationProvider: React.FC<NotificationProviderProps> = ({ children }) => {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(false);

  // Converter notificação do backend para o formato do frontend
  const convertBackendNotification = (backendNotif: BackendNotification): Notification => {
    // Mapear tipos do backend para categorias do frontend
    const categoryMap: Record<string, Notification['category']> = {
      'evento': 'event',
      'calendario': 'event',
      'dizimo': 'financial',
      'igreja': 'church',
      'pastor': 'church',
      'diretoria': 'church',
      'usuario': 'member'
    };

    // Mapear ações para tipos de notificação
    const typeMap: Record<string, Notification['type']> = {
      'criado': 'success',
      'editado': 'info',
      'deletado': 'warning'
    };

    return {
      id: backendNotif._id,
      type: typeMap[backendNotif.acao] || 'info',
      category: categoryMap[backendNotif.tipo] || 'system',
      title: backendNotif.titulo,
      message: `${backendNotif.descricao} • ${backendNotif.igreja.nome}`,
      timestamp: new Date(backendNotif.createdAt),
      read: backendNotif.lida,
      backendId: backendNotif._id,
      churchName: backendNotif.igreja.nome,
      userName: backendNotif.usuario.nome,
      // Configurar auto-remove para notificações do backend
      autoRemove: true,
      duration: 5000 // 5 segundos para notificações do backend
    };
  };



  // Atualizar notificações
  const refreshNotifications = useCallback(async () => {
    const token = localStorage.getItem('token');
    if (!token) return; // Só buscar se estiver logado

    setLoading(true);
    try {
      const response = await apiService.get('/notificacao');
      if (response.ok) {
        const backendNotifications: BackendNotification[] = await response.json();
        const convertedNotifications = backendNotifications.map(convertBackendNotification);
        setNotifications(convertedNotifications);
      }
    } catch (error) {
      console.error('Erro ao atualizar notificações:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  const addNotification = useCallback((notification: Omit<Notification, 'id' | 'timestamp' | 'read'>) => {
    const newNotification: Notification = {
      ...notification,
      id: Date.now().toString() + Math.random().toString(36).substr(2, 9),
      timestamp: new Date(),
      read: false,
      autoRemove: notification.autoRemove ?? true,
      duration: notification.duration ?? 5000
    };

    setNotifications(prev => [newNotification, ...prev]);

    // Auto remove notification if specified
    if (newNotification.autoRemove) {
      setTimeout(() => {
        setNotifications(prev => prev.filter(n => n.id !== newNotification.id));
      }, newNotification.duration);
    }
  }, []);

  const removeNotification = useCallback(async (id: string) => {
    setNotifications(prev => {
      const notification = prev.find(n => n.id === id);
      
      // Se é uma notificação do backend, deletar no servidor
      if (notification?.backendId) {
        apiService.delete(`/notificacao/${notification.backendId}`)
          .then(response => {
            if (!response.ok) {
              console.error('Erro ao deletar notificação no servidor');
            }
          })
          .catch(error => {
            console.error('Erro ao deletar notificação:', error);
          });
      }
      
      // Sempre remover da lista local imediatamente
      return prev.filter(notification => notification.id !== id);
    });
  }, []);

  const markAsRead = useCallback(async (id: string) => {
    setNotifications(prev => {
      const notification = prev.find(n => n.id === id);
      
      // Se é uma notificação do backend, marcar como lida no servidor
      if (notification?.backendId) {
        apiService.put(`/notificacao/${notification.backendId}/ler`)
          .then(response => {
            if (!response.ok) {
              console.error('Erro ao marcar notificação como lida no servidor');
            }
          })
          .catch(error => {
            console.error('Erro ao marcar notificação como lida:', error);
          });
      }
      
      // Sempre atualizar o estado local imediatamente
      return prev.map(notification => 
        notification.id === id ? { ...notification, read: true } : notification
      );
    });
  }, []);

  const markAllAsRead = useCallback(async () => {
    setNotifications(prev => {
      // Tentar atualizar no servidor
      apiService.put('/notificacao/ler-todas')
        .then(response => {
          if (!response.ok) {
            console.error('Erro ao marcar todas as notificações como lidas no servidor');
          }
        })
        .catch(error => {
          console.error('Erro ao marcar todas as notificações como lidas:', error);
        });
      
      // Sempre atualizar o estado local imediatamente
      return prev.map(notification => ({ ...notification, read: true }));
    });
  }, []);

  const clearAll = useCallback(() => {
    // Manter apenas notificações não lidas do backend
    setNotifications(prev => prev.filter(n => n.backendId && !n.read));
  }, []);

  const unreadCount = notifications.filter(n => !n.read).length;

  // Buscar notificações quando o componente monta
  useEffect(() => {
    const token = localStorage.getItem('token');
    if (token) {
      refreshNotifications();
    }
  }, []); // Removido refreshNotifications da dependência

  // Polling para atualizar notificações a cada 60 segundos (apenas se logado)
  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) return;

    const interval = setInterval(async () => {
      const currentToken = localStorage.getItem('token');
      if (currentToken) {
        try {
          const response = await apiService.get('/notificacao');
          if (response.ok) {
            const backendNotifications: BackendNotification[] = await response.json();
            const convertedNotifications = backendNotifications.map(convertBackendNotification);
            
            // Mesclar com notificações locais em vez de substituir tudo
            setNotifications(prev => {
              // Manter notificações locais (sem backendId)
              const localNotifications = prev.filter(n => !n.backendId);
              // Adicionar notificações do backend
              return [...localNotifications, ...convertedNotifications];
            });
          }
        } catch (error) {
          console.error('Erro no polling de notificações:', error);
        }
      }
    }, 60000); // 60 segundos - aumentado para reduzir chamadas

    return () => clearInterval(interval);
  }, []); // Sem dependências

  // Mostrar notificação de boas-vindas apenas se logado
  useEffect(() => {
    const token = localStorage.getItem('token');
    if (token) {
      const timeout = setTimeout(() => {
        const currentToken = localStorage.getItem('token');
        if (currentToken) {
          const welcomeNotification: Notification = {
            id: 'welcome-' + Date.now(),
            type: 'success',
            category: 'system',
            title: 'Sistema Iniciado',
            message: 'Bem-vindo! O sistema foi carregado com sucesso.',
            timestamp: new Date(),
            read: false,
            autoRemove: true,
            duration: 5000
          };
          setNotifications(prev => [welcomeNotification, ...prev]);
        }
      }, 2000);

      return () => clearTimeout(timeout);
    }
  }, []); // Sem dependências

  return (
    <NotificationContext.Provider value={{
      notifications,
      addNotification,
      removeNotification,
      markAsRead,
      markAllAsRead,
      clearAll,
      unreadCount,
      refreshNotifications,
      loading
    }}>
      {children}
      <NotificationToasts />
    </NotificationContext.Provider>
  );
};

const NotificationToasts: React.FC = () => {
  const { notifications, removeNotification } = useNotifications();

  const getIcon = (type: Notification['type']) => {
    switch (type) {
      case 'success':
        return <CheckCircle className="w-5 h-5 text-green-500" />;
      case 'error':
        return <AlertCircle className="w-5 h-5 text-red-500" />;
      case 'warning':
        return <AlertTriangle className="w-5 h-5 text-yellow-500" />;
      case 'info':
      default:
        return <Info className="w-5 h-5 text-blue-500" />;
    }
  };

  const getCategoryIcon = (category: Notification['category']) => {
    switch (category) {
      case 'event':
        return <Calendar className="w-4 h-4" />;
      case 'financial':
        return <DollarSign className="w-4 h-4" />;
      case 'member':
        return <Users className="w-4 h-4" />;
      case 'church':
        return <Church className="w-4 h-4" />;
      default:
        return <Bell className="w-4 h-4" />;
    }
  };

  const getToastStyle = (type: Notification['type']) => {
    switch (type) {
      case 'success':
        return 'border-green-200 bg-green-50 dark:bg-green-900/20 dark:border-green-500/20';
      case 'error':
        return 'border-red-200 bg-red-50 dark:bg-red-900/20 dark:border-red-500/20';
      case 'warning':
        return 'border-yellow-200 bg-yellow-50 dark:bg-yellow-900/20 dark:border-yellow-500/20';
      case 'info':
      default:
        return 'border-blue-200 bg-blue-50 dark:bg-blue-900/20 dark:border-blue-500/20';
    }
  };

  // Only show auto-remove notifications as toasts
  const toastNotifications = notifications.filter(n => n.autoRemove).slice(0, 3);

  return (
    <div className="fixed top-4 right-4 z-50 space-y-2">
      <AnimatePresence>
        {toastNotifications.map((notification) => (
          <motion.div
            key={notification.id}
            initial={{ opacity: 0, x: 300, scale: 0.3 }}
            animate={{ opacity: 1, x: 0, scale: 1 }}
            exit={{ opacity: 0, x: 300, scale: 0.5, transition: { duration: 0.2 } }}
            className={`flex items-start p-4 rounded-lg border shadow-lg max-w-sm ${getToastStyle(notification.type)}`}
          >
            <div className="flex-shrink-0 mr-3">
              {getIcon(notification.type)}
            </div>
            
            <div className="flex-1 min-w-0">
              <div className="flex items-center space-x-2 mb-1">
                {getCategoryIcon(notification.category)}
                <p className="text-sm font-medium text-gray-900 dark:text-white">
                  {notification.title}
                </p>
              </div>
              <p className="text-sm text-gray-600 dark:text-gray-300">
                {notification.message}
              </p>
              {notification.action && (
                <button
                  onClick={() => {
                    notification.action!.onClick();
                    removeNotification(notification.id);
                  }}
                  className="mt-2 text-sm font-medium text-blue-600 hover:text-blue-500 dark:text-blue-400 dark:hover:text-blue-300"
                >
                  {notification.action.label}
                </button>
              )}
            </div>

            <button
              onClick={() => removeNotification(notification.id)}
              className="flex-shrink-0 ml-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200"
            >
              <X className="w-4 h-4" />
            </button>
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
};

export default NotificationProvider;