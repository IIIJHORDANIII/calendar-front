import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  Users, 
  Church, 
  DollarSign, 
  Calendar,
  TrendingUp,
  MapPin,
  UserPlus,
  CalendarPlus,
  PlusCircle,
  FileText,
  Star
} from 'lucide-react';
import { useApi } from '../../utils/api';

interface SedeDashboardProps {
  user: any;
  dashboardData: any;
}

interface SedeStats {
  congregacoesSob: number;
  membrosTotal: number;
  eventosProximos: number;
  dizimosUltimoMes: number;
  crescimentoMensal: number;
  eventosRealizados: number;
}

const SedeDashboard: React.FC<SedeDashboardProps> = ({ user, dashboardData }) => {
  const [sedeStats, setSedeStats] = useState<SedeStats>({
    congregacoesSob: 0,
    membrosTotal: 0,
    eventosProximos: 0,
    dizimosUltimoMes: 0,
    crescimentoMensal: 0,
    eventosRealizados: 0
  });
  const [loading, setLoading] = useState(true);
  const api = useApi();

  useEffect(() => {
    loadSedeData();
  }, []);

  const loadSedeData = async () => {
    try {
      setLoading(true);
      
      // Dados específicos da sede
      const congregacoes = dashboardData.congregacoes?.filter(
        (cong: any) => cong.igreja.sede === user.igreja
      ) || [];
      
      const eventosProximos = dashboardData.eventosProximos?.filter(
        (evento: any) => evento.igreja?._id === user.igreja || 
        congregacoes.some((cong: any) => cong.igreja._id === evento.igreja?._id)
      ) || [];

      setSedeStats({
        congregacoesSob: congregacoes.length,
        membrosTotal: dashboardData.membros?.length || 0,
        eventosProximos: eventosProximos.length,
        dizimosUltimoMes: dashboardData.totalSede || 0,
        crescimentoMensal: 15, // Mock data
        eventosRealizados: 24 // Mock data
      });

    } catch (error) {
      console.error('Erro ao carregar dados da sede:', error);
    } finally {
      setLoading(false);
    }
  };

  const sedeCards = [
    {
      title: 'Congregações',
      value: sedeStats.congregacoesSob,
      icon: Church,
      color: 'from-blue-500 to-blue-600',
      trend: '+2',
      description: 'Sob minha supervisão'
    },
    {
      title: 'Membros Totais',
      value: sedeStats.membrosTotal,
      icon: Users,
      color: 'from-green-500 to-green-600',
      trend: `+${sedeStats.crescimentoMensal}%`,
      description: 'Sede + congregações'
    },
    {
      title: 'Próximos Eventos',
      value: sedeStats.eventosProximos,
      icon: Calendar,
      color: 'from-purple-500 to-purple-600',
      trend: '+3',
      description: 'Esta semana'
    },
    {
      title: 'Dízimos do Mês',
      value: `R$ ${sedeStats.dizimosUltimoMes.toLocaleString('pt-BR')}`,
      icon: DollarSign,
      color: 'from-yellow-500 to-yellow-600',
      trend: '+18%',
      description: 'Crescimento mensal'
    }
  ];

  const congregacoesList = dashboardData.congregacoes?.filter(
    (cong: any) => cong.igreja.sede === user.igreja
  ) || [];

  const quickActions = [
    {
      title: 'Nova Congregação',
      description: 'Cadastrar nova congregação',
      icon: Church,
      color: 'bg-blue-500',
      action: () => console.log('Nova congregação')
    },
    {
      title: 'Adicionar Pastor',
      description: 'Designar pastor para congregação',
      icon: UserPlus,
      color: 'bg-green-500',
      action: () => console.log('Adicionar pastor')
    },
    {
      title: 'Criar Evento',
      description: 'Organizar evento para sede ou congregações',
      icon: CalendarPlus,
      color: 'bg-purple-500',
      action: () => console.log('Criar evento')
    },
    {
      title: 'Relatório de Região',
      description: 'Gerar relatório das congregações',
      icon: FileText,
      color: 'bg-orange-500',
      action: () => console.log('Relatório')
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
      {/* Header da Sede */}
      <motion.div
        className="bg-gradient-to-r from-green-600 to-blue-600 text-white rounded-xl p-6"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold mb-2">
              Painel da Sede
            </h1>
            <p className="text-green-100">
              Supervisione suas congregações e coordene atividades regionais.
            </p>
          </div>
          <div className="text-right">
            <div className="text-3xl font-bold">
              {sedeStats.congregacoesSob}
            </div>
            <div className="text-green-100 text-sm">Congregações</div>
          </div>
        </div>
      </motion.div>

      {/* Cards de Estatísticas */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {sedeCards.map((card, index) => (
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
                <div className="text-xl font-bold text-gray-900 dark:text-white">
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

      {/* Ações Rápidas */}
      <motion.div
        className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-lg"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.3 }}
      >
        <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-6">
          Ações de Supervisão
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

      {/* Lista de Congregações */}
      <motion.div
        className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-lg"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.4 }}
      >
        <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-6">
          Minhas Congregações
        </h2>
        
        {congregacoesList.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {congregacoesList.map((congregacao: any, index: number) => (
              <motion.div
                key={congregacao.igreja._id}
                className="border border-gray-200 dark:border-gray-700 rounded-lg p-4 hover:shadow-md transition-shadow"
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.3, delay: index * 0.1 }}
              >
                <div className="flex items-center justify-between mb-3">
                  <h3 className="font-semibold text-gray-900 dark:text-white">
                    {congregacao.igreja.nome}
                  </h3>
                  <div className="flex items-center space-x-1">
                    <Star className="w-4 h-4 text-yellow-500" />
                    <span className="text-sm text-gray-600 dark:text-gray-400">
                      {Math.floor(Math.random() * 5) + 1}
                    </span>
                  </div>
                </div>
                
                <div className="space-y-2 text-sm text-gray-600 dark:text-gray-400">
                  <div className="flex items-center space-x-2">
                    <MapPin className="w-4 h-4" />
                    <span>{congregacao.igreja.endereco?.cidade || 'N/A'}</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <DollarSign className="w-4 h-4" />
                    <span>R$ {congregacao.total.toLocaleString('pt-BR')}</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Users className="w-4 h-4" />
                    <span>{Math.floor(Math.random() * 100) + 50} membros</span>
                  </div>
                </div>
                
                <div className="mt-4 pt-3 border-t border-gray-200 dark:border-gray-600">
                  <div className="flex justify-between text-xs text-gray-500">
                    <span>Última atualização</span>
                    <span>2 dias atrás</span>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        ) : (
          <div className="text-center py-8">
            <Church className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-600 dark:text-gray-400">
              Nenhuma congregação encontrada sob sua supervisão.
            </p>
          </div>
        )}
      </motion.div>
    </div>
  );
};

export default SedeDashboard;