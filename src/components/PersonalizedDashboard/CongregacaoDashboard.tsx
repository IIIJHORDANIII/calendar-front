import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  Users, 
  Calendar, 
  DollarSign, 
  Heart,
  UserPlus,
  CalendarPlus,
  Plus,
  TrendingUp,
  Award,
  Clock,
  MapPin
} from 'lucide-react';
import { useApi } from '../../utils/api';

interface CongregacaoDashboardProps {
  user: any;
  dashboardData: any;
}

interface CongregacaoStats {
  membros: number;
  eventosEsteMs: number;
  dizimosRecebidos: number;
  frequenciaMedia: number;
  crescimentoMensal: number;
  aniversariantesHoje: number;
}

const CongregacaoDashboard: React.FC<CongregacaoDashboardProps> = ({ user, dashboardData }) => {
  const [congregacaoStats, setCongregacaoStats] = useState<CongregacaoStats>({
    membros: 0,
    eventosEsteMs: 0,
    dizimosRecebidos: 0,
    frequenciaMedia: 0,
    crescimentoMensal: 0,
    aniversariantesHoje: 0
  });
  const [loading, setLoading] = useState(true);
  const api = useApi();

  useEffect(() => {
    loadCongregacaoData();
  }, []);

  const loadCongregacaoData = async () => {
    try {
      setLoading(true);
      
      // Filtrar dados específicos da congregação
      const membrosDaIgreja = dashboardData.membros?.filter(
        (membro: any) => membro.igreja === user.igreja
      ) || [];
      
      const eventosDaIgreja = dashboardData.eventosProximos?.filter(
        (evento: any) => evento.igreja?._id === user.igreja
      ) || [];

      const dizimosDaIgreja = dashboardData.dizimosPorIgreja?.find(
        (d: any) => d.igreja._id === user.igreja
      );

      setCongregacaoStats({
        membros: membrosDaIgreja.length,
        eventosEsteMs: eventosDaIgreja.length,
        dizimosRecebidos: dizimosDaIgreja?.total || 0,
        frequenciaMedia: 85, // Mock data
        crescimentoMensal: 12, // Mock data
        aniversariantesHoje: 3 // Mock data
      });

    } catch (error) {
      console.error('Erro ao carregar dados da congregação:', error);
    } finally {
      setLoading(false);
    }
  };

  const congregacaoCards = [
    {
      title: 'Membros Ativos',
      value: congregacaoStats.membros,
      icon: Users,
      color: 'from-blue-500 to-blue-600',
      trend: `+${congregacaoStats.crescimentoMensal}%`,
      description: 'Crescimento este mês'
    },
    {
      title: 'Eventos do Mês',
      value: congregacaoStats.eventosEsteMs,
      icon: Calendar,
      color: 'from-green-500 to-green-600',
      trend: '+2',
      description: 'Próximos eventos'
    },
    {
      title: 'Dízimos Recebidos',
      value: `R$ ${congregacaoStats.dizimosRecebidos.toLocaleString('pt-BR')}`,
      icon: DollarSign,
      color: 'from-yellow-500 to-yellow-600',
      trend: '+15%',
      description: 'Último mês'
    },
    {
      title: 'Frequência Média',
      value: `${congregacaoStats.frequenciaMedia}%`,
      icon: Heart,
      color: 'from-red-500 to-red-600',
      trend: '+5%',
      description: 'Presença nos cultos'
    }
  ];

  const quickActions = [
    {
      title: 'Adicionar Membro',
      description: 'Cadastrar novo membro da igreja',
      icon: UserPlus,
      color: 'bg-blue-500',
      action: () => console.log('Adicionar membro')
    },
    {
      title: 'Criar Evento',
      description: 'Organizar culto ou atividade',
      icon: CalendarPlus,
      color: 'bg-green-500',
      action: () => console.log('Criar evento')
    },
    {
      title: 'Registrar Dízimo',
      description: 'Lançar contribuição recebida',
      icon: DollarSign,
      color: 'bg-yellow-500',
      action: () => console.log('Registrar dízimo')
    },
    {
      title: 'Lista de Presença',
      description: 'Controlar frequência dos membros',
      icon: Clock,
      color: 'bg-purple-500',
      action: () => console.log('Lista presença')
    }
  ];

  const proximosEventos = dashboardData.eventosProximos?.filter(
    (evento: any) => evento.igreja?._id === user.igreja
  ).slice(0, 5) || [];

  const aniversariantes = [
    { nome: 'Maria Silva', data: 'Hoje' },
    { nome: 'João Santos', data: 'Amanhã' },
    { nome: 'Ana Costa', data: '3 dias' }
  ]; // Mock data

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header da Congregação */}
      <motion.div
        className="bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-xl p-6"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold mb-2">
              Minha Congregação
            </h1>
            <p className="text-purple-100">
              Cuide do seu rebanho e acompanhe o crescimento da igreja.
            </p>
          </div>
          <div className="text-right">
            <div className="text-3xl font-bold">
              {congregacaoStats.membros}
            </div>
            <div className="text-purple-100 text-sm">Membros</div>
          </div>
        </div>
      </motion.div>

      {/* Cards de Estatísticas */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {congregacaoCards.map((card, index) => (
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
          Ações Pastorais
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

      {/* Próximos Eventos e Aniversariantes */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Próximos Eventos */}
        <motion.div
          className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-lg"
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.5, delay: 0.4 }}
        >
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
            Próximos Eventos
          </h3>
          
          {proximosEventos.length > 0 ? (
            <div className="space-y-3">
              {proximosEventos.map((evento: any, index: number) => (
                <div 
                  key={evento._id}
                  className="flex items-center space-x-3 p-3 bg-gray-50 dark:bg-gray-700 rounded-lg"
                >
                  <div className="p-2 bg-purple-100 dark:bg-purple-900 rounded-lg">
                    <Calendar className="w-4 h-4 text-purple-600 dark:text-purple-300" />
                  </div>
                  <div className="flex-1">
                    <h4 className="font-medium text-gray-900 dark:text-white text-sm">
                      {evento.titulo}
                    </h4>
                    <p className="text-xs text-gray-600 dark:text-gray-400">
                      {new Date(evento.data).toLocaleDateString('pt-BR')}
                    </p>
                  </div>
                  <div className="text-xs text-gray-500">
                    {new Date(evento.data).toLocaleDateString('pt-BR', { weekday: 'short' })}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-6">
              <Calendar className="w-8 h-8 text-gray-400 mx-auto mb-2" />
              <p className="text-gray-600 dark:text-gray-400 text-sm">
                Nenhum evento programado
              </p>
            </div>
          )}
        </motion.div>

        {/* Aniversariantes */}
        <motion.div
          className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-lg"
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.5, delay: 0.5 }}
        >
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
            Aniversariantes
          </h3>
          
          <div className="space-y-3">
            {aniversariantes.map((aniversariante, index) => (
              <div 
                key={index}
                className="flex items-center space-x-3 p-3 bg-gray-50 dark:bg-gray-700 rounded-lg"
              >
                <div className="p-2 bg-pink-100 dark:bg-pink-900 rounded-lg">
                  <Heart className="w-4 h-4 text-pink-600 dark:text-pink-300" />
                </div>
                <div className="flex-1">
                  <h4 className="font-medium text-gray-900 dark:text-white text-sm">
                    {aniversariante.nome}
                  </h4>
                  <p className="text-xs text-gray-600 dark:text-gray-400">
                    Aniversário {aniversariante.data}
                  </p>
                </div>
                <div className="text-xs text-pink-500 font-medium">
                  🎂
                </div>
              </div>
            ))}
          </div>
        </motion.div>
      </div>
    </div>
  );
};

export default CongregacaoDashboard;