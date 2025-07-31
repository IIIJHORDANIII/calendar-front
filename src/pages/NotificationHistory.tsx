import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Bell, 
  Filter, 
  Search, 
  Clock, 
  CheckCircle, 
  XCircle, 
  Calendar, 
  DollarSign, 
  Users, 
  AlertTriangle,
  Info,
  Trash2,
  RotateCcw,
  ChevronLeft,
  ChevronRight
} from 'lucide-react';
import apiService from '../utils/api';

interface Igreja {
  _id: string;
  nome: string;
  tipo: string;
}

interface User {
  _id: string;
  nome: string;
  email: string;
}

interface BackendNotification {
  _id: string;
  tipo: string;
  acao: string;
  titulo: string;
  descricao: string;
  igreja: Igreja;
  usuario: User;
  itemId: string;
  itemTipo: string;
  lida: boolean;
  createdAt: string;
  updatedAt: string;
}

interface NotificationHistoryProps {}

type FilterStatus = 'all' | 'read' | 'unread';
type FilterType = 'all' | 'evento' | 'dizimo' | 'membro' | 'igreja' | 'pastor' | 'diretoria';

const NotificationHistory: React.FC<NotificationHistoryProps> = () => {
  const [notifications, setNotifications] = useState<BackendNotification[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<FilterStatus>('all');
  const [typeFilter, setTypeFilter] = useState<FilterType>('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(10);
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 10,
    total: 0,
    pages: 0
  });

  const fetchNotifications = useCallback(async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams({
        page: currentPage.toString(),
        limit: itemsPerPage.toString()
      });

      if (statusFilter !== 'all') {
        params.append('status', statusFilter);
      }
      
      if (typeFilter !== 'all') {
        params.append('tipo', typeFilter);
      }
      
      if (searchTerm.trim()) {
        params.append('search', searchTerm.trim());
      }

      const response = await apiService.get(`/notificacao?${params.toString()}`);
      
      if (response.ok) {
        const data = await response.json();
        
        if (data.notificacoes) {
          // Nova API com paginação
          setNotifications(data.notificacoes);
          setPagination(data.pagination);
        } else {
          // API antiga (fallback)
          setNotifications(data);
          setPagination({
            page: 1,
            limit: data.length,
            total: data.length,
            pages: 1
          });
        }
      } else {
        console.error('Erro ao buscar notificações:', response.status);
      }
    } catch (error) {
      console.error('Erro ao buscar histórico de notificações:', error);
    } finally {
      setLoading(false);
    }
  }, [currentPage, itemsPerPage, statusFilter, typeFilter, searchTerm]);

  useEffect(() => {
    fetchNotifications();
  }, [fetchNotifications]);

  // Reset to page 1 when filters change
  useEffect(() => {
    if (currentPage !== 1) {
      setCurrentPage(1);
    }
  }, [statusFilter, typeFilter, searchTerm]);

  const getNotificationIcon = (tipo: string) => {
    switch (tipo) {
      case 'evento':
        return <Calendar className="w-5 h-5" />;
      case 'dizimo':
        return <DollarSign className="w-5 h-5" />;
      case 'membro':
        return <Users className="w-5 h-5" />;
      case 'igreja':
        return <Bell className="w-5 h-5" />;
      default:
        return <Info className="w-5 h-5" />;
    }
  };

  const getNotificationColor = (acao: string) => {
    switch (acao) {
      case 'criado':
      case 'adicionado':
        return 'text-green-500 bg-green-50 dark:bg-green-900/20';
      case 'editado':
      case 'atualizado':
        return 'text-blue-500 bg-blue-50 dark:bg-blue-900/20';
      case 'removido':
      case 'deletado':
        return 'text-red-500 bg-red-50 dark:bg-red-900/20';
      default:
        return 'text-gray-500 bg-gray-50 dark:bg-gray-900/20';
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInMinutes = Math.floor((now.getTime() - date.getTime()) / (1000 * 60));
    
    if (diffInMinutes < 1) return 'Agora';
    if (diffInMinutes < 60) return `${diffInMinutes} min atrás`;
    if (diffInMinutes < 1440) return `${Math.floor(diffInMinutes / 60)}h atrás`;
    if (diffInMinutes < 10080) return `${Math.floor(diffInMinutes / 1440)} dias atrás`;
    
    return date.toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const markAsRead = async (notificationId: string) => {
    try {
      await apiService.put(`/notificacao/${notificationId}/ler`);
      setNotifications(notifications.map(n => 
        n._id === notificationId ? { ...n, lida: true } : n
      ));
    } catch (error) {
      console.error('Erro ao marcar notificação como lida:', error);
    }
  };

  const deleteNotification = async (notificationId: string) => {
    try {
      await apiService.delete(`/notificacao/${notificationId}`);
      setNotifications(notifications.filter(n => n._id !== notificationId));
    } catch (error) {
      console.error('Erro ao deletar notificação:', error);
    }
  };

  const clearReadNotifications = async () => {
    try {
      await apiService.delete('/notificacao/limpar-lidas');
      setNotifications(notifications.filter(n => !n.lida));
    } catch (error) {
      console.error('Erro ao limpar notificações lidas:', error);
    }
  };

  // As notificações já vêm filtradas e paginadas do backend
  const paginatedNotifications = notifications;
  const totalPages = pagination.pages;

  const statisticsData = {
    total: pagination.total,
    unread: notifications.filter(n => !n.lida).length,
    read: notifications.filter(n => n.lida).length,
    byType: {
      evento: notifications.filter(n => n.tipo === 'evento').length,
      dizimo: notifications.filter(n => n.tipo === 'dizimo').length,
      membro: notifications.filter(n => n.tipo === 'membro').length,
      igreja: notifications.filter(n => n.tipo === 'igreja').length,
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-4 sm:p-6">
      <div className="max-w-6xl mx-auto">
        
        {/* Header */}
        <motion.div
          className="mb-8"
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
        >
          <div className="flex items-center space-x-4 mb-4">
            <div className="p-3 bg-gradient-to-r from-blue-500 to-purple-600 rounded-xl">
              <Bell className="w-8 h-8 text-white" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
                Histórico de Notificações
              </h1>
              <p className="text-gray-600 dark:text-gray-400">
                Visualize e gerencie todas as suas notificações
              </p>
            </div>
          </div>

          {/* Estatísticas */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
            <div className="bg-white dark:bg-gray-800 rounded-xl p-4 border border-gray-200 dark:border-gray-700">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Total</p>
                  <p className="text-2xl font-bold text-gray-900 dark:text-white">{statisticsData.total}</p>
                </div>
                <Bell className="w-8 h-8 text-blue-500" />
              </div>
            </div>
            
            <div className="bg-white dark:bg-gray-800 rounded-xl p-4 border border-gray-200 dark:border-gray-700">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Não Lidas</p>
                  <p className="text-2xl font-bold text-orange-600">{statisticsData.unread}</p>
                </div>
                <XCircle className="w-8 h-8 text-orange-500" />
              </div>
            </div>
            
            <div className="bg-white dark:bg-gray-800 rounded-xl p-4 border border-gray-200 dark:border-gray-700">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Lidas</p>
                  <p className="text-2xl font-bold text-green-600">{statisticsData.read}</p>
                </div>
                <CheckCircle className="w-8 h-8 text-green-500" />
              </div>
            </div>
            
            <div className="bg-white dark:bg-gray-800 rounded-xl p-4 border border-gray-200 dark:border-gray-700">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Eventos</p>
                  <p className="text-2xl font-bold text-purple-600">{statisticsData.byType.evento}</p>
                </div>
                <Calendar className="w-8 h-8 text-purple-500" />
              </div>
            </div>
          </div>
        </motion.div>

        {/* Filtros e Busca */}
        <motion.div
          className="bg-white dark:bg-gray-800 rounded-xl p-6 border border-gray-200 dark:border-gray-700 mb-6"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.1 }}
        >
          <div className="flex flex-col lg:flex-row gap-4">
            
            {/* Busca */}
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <input
                type="text"
                placeholder="Buscar notificações..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            {/* Filtro de Status */}
            <div className="flex items-center space-x-2">
              <Filter className="w-5 h-5 text-gray-600 dark:text-gray-400" />
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value as FilterStatus)}
                className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="all">Todas</option>
                <option value="unread">Não Lidas</option>
                <option value="read">Lidas</option>
              </select>
            </div>

            {/* Filtro de Tipo */}
            <div>
              <select
                value={typeFilter}
                onChange={(e) => setTypeFilter(e.target.value as FilterType)}
                className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="all">Todos os Tipos</option>
                <option value="evento">Eventos</option>
                <option value="dizimo">Dízimos</option>
                <option value="membro">Membros</option>
                <option value="igreja">Igreja</option>
                <option value="pastor">Pastor</option>
                <option value="diretoria">Diretoria</option>
              </select>
            </div>

            {/* Ações */}
            <div className="flex items-center space-x-2">
              <button
                onClick={fetchNotifications}
                className="flex items-center space-x-2 px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg transition-colors"
              >
                <RotateCcw className="w-4 h-4" />
                <span>Atualizar</span>
              </button>
              
              <button
                onClick={clearReadNotifications}
                className="flex items-center space-x-2 px-4 py-2 bg-red-500 hover:bg-red-600 text-white rounded-lg transition-colors"
              >
                <Trash2 className="w-4 h-4" />
                <span>Limpar Lidas</span>
              </button>
            </div>
          </div>
        </motion.div>

        {/* Lista de Notificações */}
        <motion.div
          className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.2 }}
        >
          {loading ? (
            <div className="p-8 text-center">
              <div className="animate-spin w-8 h-8 mx-auto mb-4 border-2 border-gray-300 border-t-blue-600 rounded-full"></div>
              <p className="text-gray-500 dark:text-gray-400">Carregando histórico...</p>
            </div>
          ) : paginatedNotifications.length === 0 ? (
            <div className="p-8 text-center">
              <Bell className="w-16 h-16 mx-auto mb-4 text-gray-300 dark:text-gray-600" />
              <p className="text-gray-500 dark:text-gray-400">
                {searchTerm || statusFilter !== 'all' || typeFilter !== 'all' 
                  ? 'Nenhuma notificação encontrada com os filtros aplicados'
                  : 'Nenhuma notificação encontrada'
                }
              </p>
            </div>
          ) : (
            <div className="divide-y divide-gray-200 dark:divide-gray-700">
              <AnimatePresence>
                {paginatedNotifications.map((notification, index) => (
                  <motion.div
                    key={notification._id}
                    className={`p-6 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors ${
                      !notification.lida ? 'bg-blue-50 dark:bg-blue-900/10 border-l-4 border-blue-500' : ''
                    }`}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.3, delay: index * 0.05 }}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex items-start space-x-4">
                        
                        {/* Ícone da Notificação */}
                        <div className={`p-2 rounded-lg ${getNotificationColor(notification.acao)}`}>
                          {getNotificationIcon(notification.tipo)}
                        </div>

                        {/* Conteúdo */}
                        <div className="flex-1">
                          <div className="flex items-center space-x-2 mb-2">
                            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                              {notification.titulo}
                            </h3>
                            {!notification.lida && (
                              <span className="px-2 py-1 text-xs font-medium bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-400 rounded-full">
                                Nova
                              </span>
                            )}
                          </div>
                          
                          <p className="text-gray-600 dark:text-gray-400 mb-3">
                            {notification.descricao}
                          </p>
                          
                          <div className="flex items-center space-x-4 text-sm text-gray-500 dark:text-gray-400">
                            <span className="flex items-center space-x-1">
                              <Clock className="w-4 h-4" />
                              <span>{formatDate(notification.createdAt)}</span>
                            </span>
                            
                            <span className="flex items-center space-x-1">
                              <Bell className="w-4 h-4" />
                              <span>{notification.igreja.nome}</span>
                            </span>
                            
                            <span className={`px-2 py-1 rounded-full text-xs font-medium ${getNotificationColor(notification.acao)}`}>
                              {notification.acao.charAt(0).toUpperCase() + notification.acao.slice(1)}
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* Ações */}
                      <div className="flex items-center space-x-2 ml-4">
                        {!notification.lida && (
                          <button
                            onClick={() => markAsRead(notification._id)}
                            className="p-2 text-green-600 hover:bg-green-100 dark:hover:bg-green-900/30 rounded-lg transition-colors"
                            title="Marcar como lida"
                          >
                            <CheckCircle className="w-5 h-5" />
                          </button>
                        )}
                        
                        <button
                          onClick={() => deleteNotification(notification._id)}
                          className="p-2 text-red-600 hover:bg-red-100 dark:hover:bg-red-900/30 rounded-lg transition-colors"
                          title="Deletar notificação"
                        >
                          <Trash2 className="w-5 h-5" />
                        </button>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>
          )}

          {/* Paginação */}
          {totalPages > 1 && (
            <div className="p-6 border-t border-gray-200 dark:border-gray-700">
              <div className="flex items-center justify-between">
                <p className="text-sm text-gray-700 dark:text-gray-300">
                  Mostrando {((pagination.page - 1) * pagination.limit) + 1} a {Math.min(pagination.page * pagination.limit, pagination.total)} de {pagination.total} notificações
                </p>
                
                <div className="flex items-center space-x-2">
                  <button
                    onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                    disabled={currentPage === 1}
                    className="p-2 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <ChevronLeft className="w-5 h-5" />
                  </button>
                  
                  <div className="flex items-center space-x-1">
                    {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                      let pageNumber: number;
                      if (totalPages <= 5) {
                        pageNumber = i + 1;
                      } else if (currentPage <= 3) {
                        pageNumber = i + 1;
                      } else if (currentPage >= totalPages - 2) {
                        pageNumber = totalPages - 4 + i;
                      } else {
                        pageNumber = currentPage - 2 + i;
                      }
                      
                      return (
                        <button
                          key={pageNumber}
                          onClick={() => setCurrentPage(pageNumber)}
                          className={`px-3 py-1 rounded-lg text-sm font-medium transition-colors ${
                            pageNumber === currentPage
                              ? 'bg-blue-500 text-white'
                              : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
                          }`}
                        >
                          {pageNumber}
                        </button>
                      );
                    })}
                  </div>
                  
                  <button
                    onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                    disabled={currentPage === totalPages}
                    className="p-2 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <ChevronRight className="w-5 h-5" />
                  </button>
                </div>
              </div>
            </div>
          )}
        </motion.div>
      </div>
    </div>
  );
};

export default NotificationHistory;