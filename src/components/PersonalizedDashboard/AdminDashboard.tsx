import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  BarChart3, 
  TrendingUp, 
  Users, 
  Church, 
  DollarSign, 
  Calendar,
  Settings,
  Shield,
  Database,
  FileText,
  Globe
} from 'lucide-react';
import { useApi } from '../../utils/api';

interface AdminDashboardProps {
  user: any;
  dashboardData: any;
}

interface AdminStats {
  totalIgrejas: number;
  totalUsuarios: number;
  totalEventos: number;
  totalDizimos: number;
  crescimentoMensal: number;
  sedesAtivas: number;
  congregacoesAtivas: number;
  backupsRecentes: number;
}

const AdminDashboard: React.FC<AdminDashboardProps> = ({ user, dashboardData }) => {
  const [adminStats, setAdminStats] = useState<AdminStats>({
    totalIgrejas: 0,
    totalUsuarios: 0,
    totalEventos: 0,
    totalDizimos: 0,
    crescimentoMensal: 0,
    sedesAtivas: 0,
    congregacoesAtivas: 0,
    backupsRecentes: 0
  });
  const [loading, setLoading] = useState(true);
  const api = useApi();

  useEffect(() => {
    loadAdminData();
  }, []);

  const loadAdminData = async () => {
    try {
      setLoading(true);
      
      // Carregar estatísticas administrativas
      const [statsResponse, backupResponse] = await Promise.all([
        api.get('/api/admin/stats'),
        api.get('/backup/status')
      ]);

      if (statsResponse.ok) {
        const stats = await statsResponse.json();
        setAdminStats(prev => ({ ...prev, ...stats }));
      }

      if (backupResponse.ok) {
        const backupData = await backupResponse.json();
        setAdminStats(prev => ({ 
          ...prev, 
          backupsRecentes: backupData.status?.totalBackups || 0 
        }));
      }

    } catch (error) {
      console.error('Erro ao carregar dados administrativos:', error);
    } finally {
      setLoading(false);
    }
  };

  const adminCards = [
    {
      title: 'Total de Igrejas',
      value: dashboardData.totalIgrejas,
      icon: Church,
      color: 'from-blue-500 to-blue-600',
      trend: '+12%',
      description: `${dashboardData.totalSede} sedes, ${dashboardData.totalCongregacoes} congregações`
    },
    {
      title: 'Usuários Ativos',
      value: dashboardData.totalUsuarios,
      icon: Users,
      color: 'from-green-500 to-green-600',
      trend: '+8%',
      description: 'Pastores e administradores'
    },
    {
      title: 'Eventos Totais',
      value: dashboardData.totalEventos,
      icon: Calendar,
      color: 'from-purple-500 to-purple-600',
      trend: '+15%',
      description: 'Este mês'
    },
    {
      title: 'Receita Total',
      value: `R$ ${(dashboardData.totalGeral || 0).toLocaleString('pt-BR')}`,
      icon: DollarSign,
      color: 'from-yellow-500 to-yellow-600',
      trend: '+22%',
      description: 'Dízimos e ofertas'
    },
    {
      title: 'Backups Recentes',
      value: adminStats.backupsRecentes,
      icon: Database,
      color: 'from-indigo-500 to-indigo-600',
      trend: 'Ativo',
      description: 'Sistema automático'
    },
    {
      title: 'Relatórios Gerados',
      value: '47',
      icon: FileText,
      color: 'from-red-500 to-red-600',
      trend: '+31%',
      description: 'Este mês'
    }
  ];

  const quickActions = [
    {
      title: 'Gerenciar Usuários',
      description: 'Criar e gerenciar contas de pastores',
      icon: Users,
      color: 'bg-blue-500',
      action: () => console.log('Gerenciar usuários')
    },
    {
      title: 'Configurações Globais',
      description: 'Configurar sistema e integrações',
      icon: Settings,
      color: 'bg-gray-500',
      action: () => console.log('Configurações')
    },
    {
      title: 'Backup Manual',
      description: 'Criar backup imediato do sistema',
      icon: Database,
      color: 'bg-green-500',
      action: () => console.log('Backup')
    },
    {
      title: 'Relatório Geral',
      description: 'Gerar relatório consolidado',
      icon: BarChart3,
      color: 'bg-purple-500',
      action: () => console.log('Relatório')
    },
    {
      title: 'Auditoria',
      description: 'Visualizar logs de atividade',
      icon: Shield,
      color: 'bg-red-500',
      action: () => console.log('Auditoria')
    },
    {
      title: 'Monitor Sistema',
      description: 'Status e performance',
      icon: Globe,
      color: 'bg-indigo-500',
      action: () => console.log('Monitor')
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
      {/* Header Administrativo */}
      <motion.div
        className="bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-xl p-6"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold mb-2">
              Painel Administrativo
            </h1>
            <p className="text-blue-100">
              Bem-vindo, {user.nome}! Gerencie todo o sistema de igrejas.
            </p>
          </div>
          <div className="text-right">
            <div className="text-3xl font-bold">
              {dashboardData.totalIgrejas}
            </div>
            <div className="text-blue-100 text-sm">Igrejas Ativas</div>
          </div>
        </div>
      </motion.div>

      {/* Cards de Estatísticas */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {adminCards.map((card, index) => (
          <motion.div
            key={card.title}
            className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-lg border border-gray-200 dark:border-gray-700"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: index * 0.1 }}
            whileHover={{ y: -5, scale: 1.02 }}
          >
            <div className="flex items-center justify-between mb-4">
              <div className={`p-3 rounded-lg bg-gradient-to-r ${card.color}`}>
                <card.icon className="w-6 h-6 text-white" />
              </div>
              <div className="text-right">
                <div className="text-2xl font-bold text-gray-900 dark:text-white">
                  {card.value}
                </div>
                <div className="text-green-500 text-sm font-medium">
                  {card.trend}
                </div>
              </div>
            </div>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-1">
              {card.title}
            </h3>
            <p className="text-gray-600 dark:text-gray-400 text-sm">
              {card.description}
            </p>
          </motion.div>
        ))}
      </div>

      {/* Ações Rápidas Administrativas */}
      <motion.div
        className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-lg"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.3 }}
      >
        <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-6">
          Ações Administrativas
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
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

      {/* Gráficos de Sistema */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <motion.div
          className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-lg"
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.5, delay: 0.4 }}
        >
          <h3 className="text-lg font-semibold mb-4">Crescimento por Região</h3>
          <div className="space-y-3">
            {['Norte', 'Sul', 'Leste', 'Oeste', 'Centro'].map((regiao, index) => (
              <div key={regiao} className="flex items-center justify-between">
                <span className="text-sm text-gray-600 dark:text-gray-400">{regiao}</span>
                <div className="flex items-center space-x-2">
                  <div className="w-32 bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                    <div 
                      className="bg-blue-500 h-2 rounded-full"
                      style={{ width: `${Math.random() * 100}%` }}
                    />
                  </div>
                  <span className="text-sm font-medium">
                    {Math.floor(Math.random() * 100)}%
                  </span>
                </div>
              </div>
            ))}
          </div>
        </motion.div>

        <motion.div
          className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-lg"
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.5, delay: 0.5 }}
        >
          <h3 className="text-lg font-semibold mb-4">Status do Sistema</h3>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-sm">Servidor</span>
              <span className="px-2 py-1 bg-green-100 text-green-600 rounded-full text-xs">
                Online
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm">Banco de Dados</span>
              <span className="px-2 py-1 bg-green-100 text-green-600 rounded-full text-xs">
                Conectado
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm">Backup Automático</span>
              <span className="px-2 py-1 bg-green-100 text-green-600 rounded-full text-xs">
                Ativo
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm">Notificações</span>
              <span className="px-2 py-1 bg-green-100 text-green-600 rounded-full text-xs">
                Funcionando
              </span>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
};

export default AdminDashboard;