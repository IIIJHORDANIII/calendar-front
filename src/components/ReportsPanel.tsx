import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { 
  FileText, 
  Download, 
  Calendar, 
  DollarSign, 
  Users, 
  BarChart3,
  Loader,
  CheckCircle,
  AlertCircle
} from 'lucide-react';
import { ReportTemplates } from '../utils/pdfGenerator';
import { generateQuickInsights } from '../utils/insightsEngine';

interface ReportsPanelProps {
  dashboardData: any;
  className?: string;
}

const ReportsPanel: React.FC<ReportsPanelProps> = ({ dashboardData, className = '' }) => {
  const [generatingReport, setGeneratingReport] = useState<string | null>(null);
  const [reportStatus, setReportStatus] = useState<{ type: 'success' | 'error', message: string } | null>(null);

  const generateTithesReport = async () => {
    try {
      setGeneratingReport('tithes');
      setReportStatus(null);
      
      // Simular preparação de dados (em produção, estes dados viriam da API)
      const reportData = {
        period: 'Janeiro - Dezembro 2024',
        churchName: JSON.parse(localStorage.getItem('user') || '{}').igrejaNome || 'Igreja Local',
        totalAmount: dashboardData.totalDizimos,
        totalContributors: dashboardData.membros.length,
        monthlyData: [
          { month: 'Janeiro', amount: dashboardData.totalDizimos * 0.08, contributors: Math.floor(dashboardData.membros.length * 0.7) },
          { month: 'Fevereiro', amount: dashboardData.totalDizimos * 0.09, contributors: Math.floor(dashboardData.membros.length * 0.75) },
          { month: 'Março', amount: dashboardData.totalDizimos * 0.07, contributors: Math.floor(dashboardData.membros.length * 0.65) },
          { month: 'Abril', amount: dashboardData.totalDizimos * 0.085, contributors: Math.floor(dashboardData.membros.length * 0.72) },
          { month: 'Maio', amount: dashboardData.totalDizimos * 0.09, contributors: Math.floor(dashboardData.membros.length * 0.78) },
          { month: 'Junho', amount: dashboardData.totalDizimos * 0.095, contributors: Math.floor(dashboardData.membros.length * 0.80) }
        ],
        topContributors: [
          { name: 'João Silva', amount: dashboardData.totalDizimos * 0.15 },
          { name: 'Maria Santos', amount: dashboardData.totalDizimos * 0.12 },
          { name: 'Pedro Costa', amount: dashboardData.totalDizimos * 0.10 },
          { name: 'Ana Oliveira', amount: dashboardData.totalDizimos * 0.08 },
          { name: 'Carlos Ferreira', amount: dashboardData.totalDizimos * 0.07 }
        ],
        insights: generateQuickInsights(dashboardData)
          .filter(i => i.category === 'financial')
          .map(i => i.description)
      };

      const pdf = await ReportTemplates.generateTithesReport(reportData);
      pdf.save(`Relatorio_Dizimos_${new Date().getTime()}.pdf`);
      
      setReportStatus({ type: 'success', message: 'Relatório de dízimos gerado com sucesso!' });
      
    } catch (error) {
      console.error('Erro ao gerar relatório:', error);
      setReportStatus({ type: 'error', message: 'Erro ao gerar relatório. Tente novamente.' });
    } finally {
      setGeneratingReport(null);
      setTimeout(() => setReportStatus(null), 5000);
    }
  };

  const generateEventsReport = async () => {
    try {
      setGeneratingReport('events');
      setReportStatus(null);
      
      const reportData = {
        period: 'Janeiro - Dezembro 2024',
        churchName: JSON.parse(localStorage.getItem('user') || '{}').igrejaNome || 'Igreja Local',
        totalEvents: dashboardData.totalEventos,
        completedEvents: Math.floor(dashboardData.totalEventos * 0.85),
        upcomingEvents: Math.floor(dashboardData.totalEventos * 0.15),
        eventsByType: [
          { type: 'Culto', count: Math.floor(dashboardData.totalEventos * 0.4) },
          { type: 'Reunião', count: Math.floor(dashboardData.totalEventos * 0.25) },
          { type: 'Evento Especial', count: Math.floor(dashboardData.totalEventos * 0.2) },
          { type: 'Escola Bíblica', count: Math.floor(dashboardData.totalEventos * 0.15) }
        ],
        attendanceData: dashboardData.eventosProximos.slice(0, 10).map((evento: any, index: number) => ({
          event: evento.titulo,
          date: new Date(evento.data).toLocaleDateString('pt-BR'),
          attendance: Math.floor(Math.random() * 200) + 50
        })),
        insights: generateQuickInsights(dashboardData)
          .filter(i => i.category === 'events')
          .map(i => i.description)
      };

      const pdf = await ReportTemplates.generateEventsReport(reportData);
      pdf.save(`Relatorio_Eventos_${new Date().getTime()}.pdf`);
      
      setReportStatus({ type: 'success', message: 'Relatório de eventos gerado com sucesso!' });
      
    } catch (error) {
      console.error('Erro ao gerar relatório:', error);
      setReportStatus({ type: 'error', message: 'Erro ao gerar relatório. Tente novamente.' });
    } finally {
      setGeneratingReport(null);
      setTimeout(() => setReportStatus(null), 5000);
    }
  };

  const generateMembersReport = async () => {
    try {
      setGeneratingReport('members');
      setReportStatus(null);
      
      const reportData = {
        period: 'Janeiro - Dezembro 2024',
        churchName: JSON.parse(localStorage.getItem('user') || '{}').igrejaNome || 'Igreja Local',
        totalMembers: dashboardData.membros.length,
        newMembers: Math.floor(dashboardData.membros.length * 0.15),
        membersByMinistry: [
          { ministry: 'Louvor', count: Math.floor(dashboardData.membros.length * 0.25) },
          { ministry: 'Evangelismo', count: Math.floor(dashboardData.membros.length * 0.20) },
          { ministry: 'Jovens', count: Math.floor(dashboardData.membros.length * 0.30) },
          { ministry: 'Crianças', count: Math.floor(dashboardData.membros.length * 0.15) },
          { ministry: 'Idosos', count: Math.floor(dashboardData.membros.length * 0.10) }
        ],
        ageDistribution: [
          { ageGroup: '0-17 anos', count: Math.floor(dashboardData.membros.length * 0.20) },
          { ageGroup: '18-35 anos', count: Math.floor(dashboardData.membros.length * 0.35) },
          { ageGroup: '36-55 anos', count: Math.floor(dashboardData.membros.length * 0.30) },
          { ageGroup: '56+ anos', count: Math.floor(dashboardData.membros.length * 0.15) }
        ],
        insights: generateQuickInsights(dashboardData)
          .filter(i => i.category === 'members')
          .map(i => i.description)
      };

      const pdf = await ReportTemplates.generateMembersReport(reportData);
      pdf.save(`Relatorio_Membros_${new Date().getTime()}.pdf`);
      
      setReportStatus({ type: 'success', message: 'Relatório de membros gerado com sucesso!' });
      
    } catch (error) {
      console.error('Erro ao gerar relatório:', error);
      setReportStatus({ type: 'error', message: 'Erro ao gerar relatório. Tente novamente.' });
    } finally {
      setGeneratingReport(null);
      setTimeout(() => setReportStatus(null), 5000);
    }
  };

  const reportOptions = [
    {
      id: 'tithes',
      title: 'Relatório de Dízimos',
      description: 'Análise completa da arrecadação de dízimos e ofertas',
      icon: DollarSign,
      color: 'bg-green-500',
      handler: generateTithesReport,
      stats: `R$ ${dashboardData.totalDizimos?.toLocaleString('pt-BR') || '0'}`
    },
    {
      id: 'events',
      title: 'Relatório de Eventos',
      description: 'Análise de atividades e participação em eventos',
      icon: Calendar,
      color: 'bg-blue-500',
      handler: generateEventsReport,
      stats: `${dashboardData.totalEventos || 0} eventos`
    },
    {
      id: 'members',
      title: 'Relatório de Membros',
      description: 'Análise da congregação e distribuição por ministérios',
      icon: Users,
      color: 'bg-purple-500',
      handler: generateMembersReport,
      stats: `${dashboardData.membros?.length || 0} membros`
    }
  ];

  return (
    <div className={`bg-white dark:bg-gray-800 rounded-xl p-6 border border-gray-200 dark:border-gray-700 ${className}`}>
      <div className="flex items-center space-x-3 mb-6">
        <div className="p-2 bg-indigo-100 dark:bg-indigo-900/30 rounded-lg">
          <FileText className="w-6 h-6 text-indigo-600 dark:text-indigo-400" />
        </div>
        <div>
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
            Relatórios PDF
          </h3>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Gere relatórios detalhados em PDF
          </p>
        </div>
      </div>

      {/* Status Message */}
      {reportStatus && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className={`mb-4 p-3 rounded-lg flex items-center space-x-2 ${
            reportStatus.type === 'success' 
              ? 'bg-green-50 text-green-800 dark:bg-green-900/20 dark:text-green-400'
              : 'bg-red-50 text-red-800 dark:bg-red-900/20 dark:text-red-400'
          }`}
        >
          {reportStatus.type === 'success' ? (
            <CheckCircle className="w-4 h-4" />
          ) : (
            <AlertCircle className="w-4 h-4" />
          )}
          <span className="text-sm">{reportStatus.message}</span>
        </motion.div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {reportOptions.map((option, index) => (
          <motion.div
            key={option.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: index * 0.1 }}
            className="group"
          >
            <button
              onClick={option.handler}
              disabled={generatingReport === option.id}
              className="w-full p-4 border border-gray-200 dark:border-gray-700 rounded-lg hover:border-indigo-300 dark:hover:border-indigo-600 transition-all duration-200 hover:shadow-md disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <div className="flex items-center space-x-3 mb-3">
                <div className={`p-2 ${option.color} rounded-lg`}>
                  {generatingReport === option.id ? (
                    <Loader className="w-5 h-5 text-white animate-spin" />
                  ) : (
                    <option.icon className="w-5 h-5 text-white" />
                  )}
                </div>
                <div className="text-left flex-1">
                  <h4 className="font-medium text-gray-900 dark:text-white group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">
                    {option.title}
                  </h4>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                    {option.description}
                  </p>
                </div>
              </div>
              
              <div className="flex items-center justify-between">
                <span className="text-sm font-semibold text-gray-600 dark:text-gray-400">
                  {option.stats}
                </span>
                
                <div className="flex items-center space-x-1">
                  <Download className="w-4 h-4 text-gray-400 group-hover:text-indigo-500 transition-colors" />
                  <span className="text-xs text-gray-400 group-hover:text-indigo-500 transition-colors">
                    PDF
                  </span>
                </div>
              </div>
            </button>
          </motion.div>
        ))}
      </div>

      <div className="mt-6 p-4 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
        <div className="flex items-start space-x-3">
          <BarChart3 className="w-5 h-5 text-blue-500 mt-0.5" />
          <div>
            <h4 className="font-medium text-gray-900 dark:text-white mb-1">
              Recursos dos Relatórios
            </h4>
            <ul className="text-sm text-gray-600 dark:text-gray-400 space-y-1">
              <li>• Gráficos e tabelas detalhadas</li>
              <li>• Insights automáticos baseados em IA</li>
              <li>• Logo e identidade visual da igreja</li>
              <li>• Comparativos temporais e projeções</li>
              <li>• Formato profissional para apresentações</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ReportsPanel;