import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  MessageSquare, 
  Mail, 
  Phone, 
  Send, 
  Users, 
  TrendingUp, 
  AlertCircle,
  CheckCircle,
  Clock,
  Settings,
  Plus,
  FileText,
  BarChart3
} from 'lucide-react';
import { useApi } from '../utils/api';

interface ServiceStats {
  sent: number;
  failed: number;
  delivered?: number;
  opened?: number;
}

interface CommunicationStats {
  whatsapp: ServiceStats;
  email: ServiceStats;
  sms: ServiceStats;
  total: { sent: number; failed: number };
}

interface Service {
  whatsapp: boolean;
  email: boolean;
  sms: boolean;
  initialized: boolean;
}

const CommunicationDashboard: React.FC = () => {
  const [stats, setStats] = useState<CommunicationStats | null>(null);
  const [services, setServices] = useState<Service>({
    whatsapp: false,
    email: false,
    sms: false,
    initialized: false
  });
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('overview');
  const api = useApi();

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    try {
      setLoading(true);
      
      // Carregar status dos serviços
      const statusResponse = await api.get('/communication/status');
      if (statusResponse.ok) {
        const statusData = await statusResponse.json();
        setServices(statusData.services);
      }

      // Carregar estatísticas
      const statsResponse = await api.get('/communication/stats');
      if (statsResponse.ok) {
        const statsData = await statsResponse.json();
        setStats(statsData.stats);
      }
    } catch (error) {
      console.error('Erro ao carregar dashboard:', error);
    } finally {
      setLoading(false);
    }
  };

  const getServiceStatus = (isActive: boolean) => {
    return isActive ? (
      <div className="flex items-center space-x-1 text-green-600">
        <CheckCircle className="w-4 h-4" />
        <span className="text-sm">Ativo</span>
      </div>
    ) : (
      <div className="flex items-center space-x-1 text-red-600">
        <AlertCircle className="w-4 h-4" />
        <span className="text-sm">Inativo</span>
      </div>
    );
  };

  const serviceCards = [
    {
      title: 'WhatsApp Business',
      icon: MessageSquare,
      color: 'from-green-500 to-green-600',
      active: services.whatsapp,
      stats: stats?.whatsapp,
      description: 'Notificações e lembretes automáticos',
      hasDelivered: true,
      hasOpened: false
    },
    {
      title: 'Email Marketing',
      icon: Mail,
      color: 'from-blue-500 to-blue-600',
      active: services.email,
      stats: stats?.email,
      description: 'Campanhas e newsletters',
      hasDelivered: false,
      hasOpened: true
    },
    {
      title: 'SMS Urgente',
      icon: Phone,
      color: 'from-purple-500 to-purple-600',
      active: services.sms,
      stats: stats?.sms,
      description: 'Lembretes urgentes e confirmações',
      hasDelivered: true,
      hasOpened: false
    }
  ];

  const quickActions = [
    {
      title: 'Enviar Notificação',
      description: 'Enviar mensagem para evento ou grupo',
      icon: Send,
      color: 'bg-blue-500',
      action: () => setActiveTab('send')
    },
    {
      title: 'Gerenciar Templates',
      description: 'Criar e editar templates de mensagens',
      icon: FileText,
      color: 'bg-green-500',
      action: () => setActiveTab('templates')
    },
    {
      title: 'Ver Relatórios',
      description: 'Estatísticas detalhadas de envios',
      icon: BarChart3,
      color: 'bg-purple-500',
      action: () => setActiveTab('reports')
    },
    {
      title: 'Configurações',
      description: 'Configurar integrações e APIs',
      icon: Settings,
      color: 'bg-gray-500',
      action: () => setActiveTab('settings')
    }
  ];

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <motion.div
        className="bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-xl p-6"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold mb-2">
              📱 Central de Comunicação
            </h1>
            <p className="text-blue-100">
              Gerencie WhatsApp, Email e SMS em um só lugar
            </p>
          </div>
          <div className="text-right">
            <div className="text-3xl font-bold">
              {stats?.total.sent || 0}
            </div>
            <div className="text-blue-100 text-sm">Mensagens Enviadas</div>
          </div>
        </div>
      </motion.div>

      {/* Cards de Serviços */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {serviceCards.map((service, index) => (
          <motion.div
            key={service.title}
            className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-lg border border-gray-200 dark:border-gray-700"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: index * 0.1 }}
            whileHover={{ y: -5, scale: 1.02 }}
          >
            <div className="flex items-center justify-between mb-4">
              <div className={`p-3 rounded-lg bg-gradient-to-r ${service.color}`}>
                <service.icon className="w-6 h-6 text-white" />
              </div>
              {getServiceStatus(service.active)}
            </div>
            
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
              {service.title}
            </h3>
            <p className="text-gray-600 dark:text-gray-400 text-sm mb-4">
              {service.description}
            </p>

            {service.stats && (
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600 dark:text-gray-400">Enviados:</span>
                  <span className="font-medium text-green-600">{service.stats.sent}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600 dark:text-gray-400">Falharam:</span>
                  <span className="font-medium text-red-600">{service.stats.failed}</span>
                </div>
                {service.hasDelivered && service.stats.delivered !== undefined && (
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600 dark:text-gray-400">Entregues:</span>
                    <span className="font-medium text-blue-600">{service.stats.delivered}</span>
                  </div>
                )}
                {service.hasOpened && service.stats.opened !== undefined && (
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600 dark:text-gray-400">Abertos:</span>
                    <span className="font-medium text-purple-600">{service.stats.opened}</span>
                  </div>
                )}
              </div>
            )}
          </motion.div>
        ))}
      </div>

      {/* Resumo Geral */}
      {stats && (
        <motion.div
          className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-lg"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.4 }}
        >
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-6">
            📊 Resumo dos Últimos 30 Dias
          </h2>
          
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            <div className="text-center">
              <div className="text-3xl font-bold text-blue-600 mb-2">
                {stats.total.sent}
              </div>
              <div className="text-gray-600 dark:text-gray-400 text-sm">
                Total Enviado
              </div>
            </div>
            
            <div className="text-center">
              <div className="text-3xl font-bold text-green-600 mb-2">
                {stats.total.sent - stats.total.failed}
              </div>
              <div className="text-gray-600 dark:text-gray-400 text-sm">
                Bem-sucedidos
              </div>
            </div>
            
            <div className="text-center">
              <div className="text-3xl font-bold text-red-600 mb-2">
                {stats.total.failed}
              </div>
              <div className="text-gray-600 dark:text-gray-400 text-sm">
                Falharam
              </div>
            </div>
            
            <div className="text-center">
              <div className="text-3xl font-bold text-purple-600 mb-2">
                {stats.total.sent > 0 ? Math.round(((stats.total.sent - stats.total.failed) / stats.total.sent) * 100) : 0}%
              </div>
              <div className="text-gray-600 dark:text-gray-400 text-sm">
                Taxa de Sucesso
              </div>
            </div>
          </div>
        </motion.div>
      )}

      {/* Ações Rápidas */}
      <motion.div
        className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-lg"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.5 }}
      >
        <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-6">
          ⚡ Ações Rápidas
        </h2>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {quickActions.map((action, index) => (
            <motion.button
              key={action.title}
              onClick={action.action}
              className="flex items-start space-x-4 p-4 rounded-lg border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors text-left"
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              <div className={`p-2 rounded-lg ${action.color} text-white flex-shrink-0`}>
                <action.icon className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-medium text-gray-900 dark:text-white">
                  {action.title}
                </h3>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  {action.description}
                </p>
              </div>
            </motion.button>
          ))}
        </div>
      </motion.div>

      {/* Status de Inicialização */}
      {!services.initialized && (
        <motion.div
          className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-4"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
        >
          <div className="flex items-center">
            <Clock className="w-5 h-5 text-yellow-600 mr-2" />
            <div>
              <h3 className="text-yellow-800 dark:text-yellow-200 font-medium">
                Sistema de Comunicação
              </h3>
              <p className="text-yellow-700 dark:text-yellow-300 text-sm">
                Alguns serviços podem não estar configurados. Verifique as configurações de API.
              </p>
            </div>
          </div>
        </motion.div>
      )}

      {/* Configuração Necessária */}
      {(!services.whatsapp && !services.email && !services.sms) && (
        <motion.div
          className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
        >
          <div className="flex items-center">
            <AlertCircle className="w-5 h-5 text-red-600 mr-2" />
            <div>
              <h3 className="text-red-800 dark:text-red-200 font-medium">
                Configuração Necessária
              </h3>
              <p className="text-red-700 dark:text-red-300 text-sm">
                Nenhum serviço de comunicação está ativo. Configure as APIs no arquivo .env
              </p>
            </div>
          </div>
        </motion.div>
      )}
    </div>
  );
};

export default CommunicationDashboard;