import React, { useMemo, useState, useRef } from 'react';
import { motion } from 'framer-motion';
import {
  LineChart,
  Line,
  AreaChart,
  Area,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer
} from 'recharts';
import { format, parseISO, startOfMonth, endOfMonth, eachMonthOfInterval, subMonths, subYears } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { TrendingUp, Calendar, Users, DollarSign, PieChart as PieChartIcon, BarChart3, Filter, FileImage, FileText } from 'lucide-react';
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';

interface DashboardChartsProps {
  dizimos: any[];
  eventos: any[];
  igrejas: any[];
  membros?: any[];
  userRole: string;
  sedes?: { igreja: any; total: number; items: any[] }[];
  congregacoes?: { igreja: any; total: number; items: any[] }[];
  user?: { _id: string; nome: string; email: string; role: string; igreja?: string };
}

type PeriodFilter = '1m' | '3m' | '6m' | '1y';

interface PeriodOption {
  value: PeriodFilter;
  label: string;
  months: number;
}

const DashboardCharts: React.FC<DashboardChartsProps> = ({
  dizimos,
  eventos,
  igrejas,
  membros = [],
  userRole,
  sedes = [],
  congregacoes = [],
  user
}) => {
  // Estados para filtros e funcionalidades
  const [selectedPeriod, setSelectedPeriod] = useState<PeriodFilter>('6m');
  const [showYearComparison, setShowYearComparison] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  
  // Refs para captura de gráficos
  const chartsContainerRef = useRef<HTMLDivElement>(null);
  
  // Opções de período
  const periodOptions: PeriodOption[] = useMemo(() => [
    { value: '1m', label: '1 Mês', months: 1 },
    { value: '3m', label: '3 Meses', months: 3 },
    { value: '6m', label: '6 Meses', months: 6 },
    { value: '1y', label: '1 Ano', months: 12 }
  ], []);

  // Cores para os gráficos
  const colors = {
    primary: '#3B82F6',
    secondary: '#10B981',
    accent: '#F59E0B',
    purple: '#8B5CF6',
    pink: '#EC4899',
    indigo: '#6366F1',
    orange: '#FB923C',
    red: '#EF4444'
  };

  // Processar dados de dízimos por mês baseado no período selecionado
  const dizimosPorMes = useMemo(() => {
    const periodConfig = periodOptions.find(p => p.value === selectedPeriod);
    const mesesAtras = periodConfig ? periodConfig.months - 1 : 5;
    
    const intervaloPeriodo = eachMonthOfInterval({
      start: subMonths(new Date(), mesesAtras),
      end: new Date()
    });

    return intervaloPeriodo.map(mes => {
      const inicioMes = startOfMonth(mes);
      const fimMes = endOfMonth(mes);
      
      const dizimosDoMes = dizimos.filter(dizimo => {
        const dataDizimo = parseISO(dizimo.createdAt || dizimo.data);
        return dataDizimo >= inicioMes && dataDizimo <= fimMes;
      });

      const valorTotal = dizimosDoMes.reduce((sum, dizimo) => {
        return sum + (dizimo.total || dizimo.valorDizimos || dizimo.valor || 0);
      }, 0);

      // Calcular dados do ano anterior para comparação
      const mesAnoAnterior = subYears(mes, 1);
      const inicioMesAnoAnterior = startOfMonth(mesAnoAnterior);
      const fimMesAnoAnterior = endOfMonth(mesAnoAnterior);
      
      const dizimosAnoAnterior = dizimos.filter(dizimo => {
        const dataDizimo = parseISO(dizimo.createdAt || dizimo.data);
        return dataDizimo >= inicioMesAnoAnterior && dataDizimo <= fimMesAnoAnterior;
      });

      const valorAnoAnterior = dizimosAnoAnterior.reduce((sum, dizimo) => {
        return sum + (dizimo.total || dizimo.valorDizimos || dizimo.valor || 0);
      }, 0);

      const crescimento = valorAnoAnterior > 0 ? ((valorTotal - valorAnoAnterior) / valorAnoAnterior) * 100 : 0;

      return {
        mes: format(mes, 'MMM yyyy', { locale: ptBR }),
        valor: valorTotal,
        valorAnoAnterior,
        crescimento,
        quantidade: dizimosDoMes.length,
        mesNumerico: format(mes, 'yyyy-MM')
      };
    });
  }, [dizimos, selectedPeriod, periodOptions]);

  // Processar dados de eventos por mês baseado no período selecionado
  const eventosPorMes = useMemo(() => {
    const periodConfig = periodOptions.find(p => p.value === selectedPeriod);
    const mesesAtras = periodConfig ? periodConfig.months - 1 : 5;
    
    const intervaloPeriodo = eachMonthOfInterval({
      start: subMonths(new Date(), mesesAtras),
      end: new Date()
    });

    return intervaloPeriodo.map(mes => {
      const inicioMes = startOfMonth(mes);
      const fimMes = endOfMonth(mes);
      
      const eventosDoMes = eventos.filter(evento => {
        const dataEvento = parseISO(evento.data);
        return dataEvento >= inicioMes && dataEvento <= fimMes;
      });

      // Separar eventos por tipo
      const eventosSede = eventosDoMes.filter(e => e.igreja?.tipo === 'sede').length;
      const eventosCongregacao = eventosDoMes.filter(e => e.igreja?.tipo === 'congregacao').length;

      return {
        mes: format(mes, 'MMM yyyy', { locale: ptBR }),
        eventos: eventosDoMes.length,
        eventosSede,
        eventosCongregacao,
        mesNumerico: format(mes, 'yyyy-MM')
      };
    });
  }, [eventos, selectedPeriod, periodOptions]);

  // Processar dados de dízimos por sede (filtrado por permissões)
  const dizimosPorSede = useMemo(() => {
    // Verificar se deve exibir dados por sede/congregação
    if (!sedes.length && !congregacoes.length) return [];
    
    // Filtrar dados baseado no role do usuário
    let dadosParaExibir: { igreja: any; total: number; items: any[] }[] = [];
    
    if (userRole === 'admin') {
      // Admin vê todas as sedes
      dadosParaExibir = sedes;
    } else if (userRole === 'sede' && user?.igreja) {
      // Sede vê apenas sua própria sede + suas congregações
      const propriaSede = sedes.find(s => s.igreja._id === user.igreja);
      const suasCongregacoes = congregacoes.filter(c => c.igreja.sede === user.igreja);
      dadosParaExibir = propriaSede ? [propriaSede, ...suasCongregacoes] : suasCongregacoes;
    } else if (userRole === 'congregacao' && user?.igreja) {
      // Congregação vê apenas suas próprias informações
      const propriaCongregacao = congregacoes.find(c => c.igreja._id === user.igreja);
      dadosParaExibir = propriaCongregacao ? [propriaCongregacao] : [];
    }

    if (!dadosParaExibir.length) return [];

    const periodConfig = periodOptions.find(p => p.value === selectedPeriod);
    const mesesAtras = periodConfig ? periodConfig.months - 1 : 5;
    
    const intervaloPeriodo = eachMonthOfInterval({
      start: subMonths(new Date(), mesesAtras),
      end: new Date()
    });

    return intervaloPeriodo.map(mes => {
      const inicioMes = startOfMonth(mes);
      const fimMes = endOfMonth(mes);
      
      const resultado: any = {
        mes: format(mes, 'MMM yyyy', { locale: ptBR }),
        mesNumerico: format(mes, 'yyyy-MM')
      };

      // Para cada igreja/sede, calcular o total de dízimos no mês
      dadosParaExibir.forEach(igrejaData => {
        const nomeAbreviado = igrejaData.igreja.nome.length > 10 
          ? igrejaData.igreja.nome.substring(0, 10) + '...' 
          : igrejaData.igreja.nome;

        const dizimosIgrejaNoMes = igrejaData.items.filter(dizimo => {
          const dataDizimo = parseISO(dizimo.createdAt || dizimo.data);
          return dataDizimo >= inicioMes && dataDizimo <= fimMes;
        });

        const valorTotalIgreja = dizimosIgrejaNoMes.reduce((sum, dizimo) => {
          return sum + (dizimo.total || dizimo.valorDizimos || dizimo.valor || 0);
        }, 0);

        resultado[nomeAbreviado] = valorTotalIgreja;
      });

      return resultado;
    });
  }, [sedes, congregacoes, selectedPeriod, periodOptions, userRole, user]);

  // Processar dados de eventos por sede (filtrado por permissões)
  const eventosPorSede = useMemo(() => {
    // Verificar se deve exibir dados por sede/congregação
    if (!sedes.length && !congregacoes.length) return [];
    
    // Filtrar dados baseado no role do usuário
    let dadosParaExibir: { igreja: any; total: number; items: any[] }[] = [];
    
    if (userRole === 'admin') {
      // Admin vê todas as sedes
      dadosParaExibir = sedes;
    } else if (userRole === 'sede' && user?.igreja) {
      // Sede vê apenas sua própria sede + suas congregações
      const propriaSede = sedes.find(s => s.igreja._id === user.igreja);
      const suasCongregacoes = congregacoes.filter(c => c.igreja.sede === user.igreja);
      dadosParaExibir = propriaSede ? [propriaSede, ...suasCongregacoes] : suasCongregacoes;
    } else if (userRole === 'congregacao' && user?.igreja) {
      // Congregação vê apenas suas próprias informações
      const propriaCongregacao = congregacoes.find(c => c.igreja._id === user.igreja);
      dadosParaExibir = propriaCongregacao ? [propriaCongregacao] : [];
    }

    if (!dadosParaExibir.length) return [];

    return dadosParaExibir.map(igrejaData => {
      // Contar eventos desta igreja no período selecionado
      const periodConfig = periodOptions.find(p => p.value === selectedPeriod);
      const mesesAtras = periodConfig ? periodConfig.months - 1 : 5;
      const dataInicio = subMonths(new Date(), mesesAtras);

      const eventosIgrejaNoPeriodo = eventos.filter(evento => {
        const dataEvento = parseISO(evento.data);
        return evento.igreja && evento.igreja._id === igrejaData.igreja._id && dataEvento >= dataInicio;
      });

      return {
        sede: igrejaData.igreja.nome.length > 15 ? igrejaData.igreja.nome.substring(0, 15) + '...' : igrejaData.igreja.nome,
        eventos: eventosIgrejaNoPeriodo.length,
        valor: igrejaData.total
      };
    });
  }, [sedes, congregacoes, eventos, selectedPeriod, periodOptions, userRole, user]);

  // Processar dados de membros por igreja
  const membrosPorIgreja = useMemo(() => {
    return igrejas.map(igreja => {
      const membrosIgreja = membros.filter(membro => 
        membro.igreja && membro.igreja._id === igreja._id
      );
      
      // Distribuição por cargo
      const distribucaoCargos = membrosIgreja.reduce((acc, membro) => {
        acc[membro.cargo] = (acc[membro.cargo] || 0) + 1;
        return acc;
      }, {} as Record<string, number>);

      return {
        igreja: igreja.nome.length > 15 ? igreja.nome.substring(0, 15) + '...' : igreja.nome,
        total: membrosIgreja.length,
        tipo: igreja.tipo,
        cargos: distribucaoCargos
      };
    }).sort((a, b) => b.total - a.total);
  }, [membros, igrejas]);

  // Processar dados por tipo de igreja
  const dadosPorTipoIgreja = useMemo(() => {
    const sedes = igrejas.filter(igreja => igreja.tipo === 'sede');
    const congregacoes = igrejas.filter(igreja => igreja.tipo === 'congregacao');

    const dizimosSedes = dizimos.filter(dizimo => 
      dizimo.igreja && sedes.some(sede => sede._id === dizimo.igreja._id)
    ).reduce((sum, dizimo) => sum + (dizimo.total || dizimo.valorDizimos || dizimo.valor || 0), 0);

    const dizimosCongreacoes = dizimos.filter(dizimo => 
      dizimo.igreja && congregacoes.some(cong => cong._id === dizimo.igreja._id)
    ).reduce((sum, dizimo) => sum + (dizimo.total || dizimo.valorDizimos || dizimo.valor || 0), 0);

    return [
      { name: 'Sedes', value: dizimosSedes, count: sedes.length },
      { name: 'Congregações', value: dizimosCongreacoes, count: congregacoes.length }
    ];
  }, [dizimos, igrejas]);

  // Funções de exportação
  const exportToPNG = async () => {
    if (!chartsContainerRef.current) return;
    
    setIsExporting(true);
    try {
      const canvas = await html2canvas(chartsContainerRef.current, {
        backgroundColor: '#ffffff',
        scale: 2,
        useCORS: true,
        logging: false
      });
      
      const link = document.createElement('a');
      link.download = `dashboard-analytics-${format(new Date(), 'yyyy-MM-dd')}.png`;
      link.href = canvas.toDataURL();
      link.click();
    } catch (error) {
      console.error('Erro ao exportar PNG:', error);
    } finally {
      setIsExporting(false);
    }
  };

  const exportToPDF = async () => {
    if (!chartsContainerRef.current) return;
    
    setIsExporting(true);
    try {
      const canvas = await html2canvas(chartsContainerRef.current, {
        backgroundColor: '#ffffff',
        scale: 2,
        useCORS: true,
        logging: false
      });
      
      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF('l', 'mm', 'a4'); // landscape
      
      const imgWidth = 280;
      const pageHeight = 210;
      const imgHeight = (canvas.height * imgWidth) / canvas.width;
      let heightLeft = imgHeight;
      
      let position = 10;
      
      // Adicionar título
      pdf.setFontSize(16);
      pdf.setTextColor(59, 130, 246);
      pdf.text('Dashboard Analytics - Sistema Igreja', 20, 20);
      pdf.setFontSize(12);
      pdf.setTextColor(107, 114, 128);
      pdf.text(`Gerado em: ${format(new Date(), 'dd/MM/yyyy HH:mm')}`, 20, 30);
      
      position = 40;
      
      pdf.addImage(imgData, 'PNG', 10, position, imgWidth, imgHeight);
      heightLeft -= pageHeight;
      
      while (heightLeft >= 0) {
        position = heightLeft - imgHeight;
        pdf.addPage();
        pdf.addImage(imgData, 'PNG', 10, position, imgWidth, imgHeight);
        heightLeft -= pageHeight;
      }
      
      pdf.save(`dashboard-analytics-${format(new Date(), 'yyyy-MM-dd')}.pdf`);
    } catch (error) {
      console.error('Erro ao exportar PDF:', error);
    } finally {
      setIsExporting(false);
    }
  };

  // Dados combinados para gráfico de comparação
  const dadosComparativos = useMemo(() => {
    return dizimosPorMes.map((item, index) => ({
      ...item,
      eventos: eventosPorMes[index]?.eventos || 0,
      eventosSede: eventosPorMes[index]?.eventosSede || 0,
      eventosCongregacao: eventosPorMes[index]?.eventosCongregacao || 0
    }));
  }, [dizimosPorMes, eventosPorMes]);

  // KPIs avançados
  const kpisAvancados = useMemo(() => {
    const totalDizimos = dizimosPorMes.reduce((sum, item) => sum + item.valor, 0);
    const totalDizimosAnoAnterior = dizimosPorMes.reduce((sum, item) => sum + item.valorAnoAnterior, 0);
    const crescimentoTotal = totalDizimosAnoAnterior > 0 ? ((totalDizimos - totalDizimosAnoAnterior) / totalDizimosAnoAnterior) * 100 : 0;
    
    const totalEventos = eventosPorMes.reduce((sum, item) => sum + item.eventos, 0);
    const totalMembros = membrosPorIgreja.reduce((sum, item) => sum + item.total, 0);
    const mediaDizimosPorMes = totalDizimos / dizimosPorMes.length;
    const mediaEventosPorMes = totalEventos / eventosPorMes.length;
    
    return {
      totalDizimos,
      crescimentoTotal,
      totalEventos,
      totalMembros,
      mediaDizimosPorMes,
      mediaEventosPorMes,
      igrejasMaisAtivas: membrosPorIgreja.slice(0, 3),
      tendenciaCrescimento: crescimentoTotal > 0 ? 'up' : crescimentoTotal < 0 ? 'down' : 'stable'
    };
  }, [dizimosPorMes, eventosPorMes, membrosPorIgreja]);



  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(value);
  };

  const formatCurrencyDetailed = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value);
  };

  return (
    <div className="space-y-8">
      {/* Header com controles */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between space-y-4 lg:space-y-0">
        <div className="flex items-center space-x-3">
          <div className="p-3 bg-gradient-to-r from-blue-500 to-blue-700 rounded-lg">
            <BarChart3 className="w-6 h-6 text-white" />
          </div>
          <div>
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Analytics Dashboard</h2>
            <p className="text-gray-600 dark:text-gray-400">Insights e métricas detalhadas do sistema</p>
          </div>
        </div>
        
        {/* Controles de filtro e exportação */}
        <div className="flex flex-wrap items-center gap-3">
          {/* Filtro de período */}
          <div className="flex items-center space-x-2">
            <Filter className="w-4 h-4 text-gray-600 dark:text-gray-400" />
            <select
              value={selectedPeriod}
              onChange={(e) => setSelectedPeriod(e.target.value as PeriodFilter)}
              className="px-3 py-1 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              {periodOptions.map(option => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>
          
          {/* Toggle comparação ano anterior */}
          <button
            onClick={() => setShowYearComparison(!showYearComparison)}
            className={`px-3 py-1 rounded-lg text-sm font-medium transition-colors ${
              showYearComparison 
                ? 'bg-blue-500 text-white' 
                : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-600'
            }`}
          >
            Comparar Ano Anterior
          </button>
          
          {/* Botões de exportação */}
          <div className="flex items-center space-x-2">
            <button
              onClick={exportToPNG}
              disabled={isExporting}
              className="flex items-center space-x-1 px-3 py-1 bg-green-500 hover:bg-green-600 text-white rounded-lg text-sm font-medium transition-colors disabled:opacity-50"
            >
              <FileImage className="w-4 h-4" />
              <span>PNG</span>
            </button>
            <button
              onClick={exportToPDF}
              disabled={isExporting}
              className="flex items-center space-x-1 px-3 py-1 bg-red-500 hover:bg-red-600 text-white rounded-lg text-sm font-medium transition-colors disabled:opacity-50"
            >
              <FileText className="w-4 h-4" />
              <span>PDF</span>
            </button>
          </div>
        </div>
      </div>

      {/* KPIs Dashboard */}
      <motion.div
        className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
      >
        <div className="bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-900/20 dark:to-blue-800/20 border border-blue-200 dark:border-blue-500/20 rounded-xl p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-blue-600 dark:text-blue-400 text-xs font-medium">Total Dízimos</p>
              <p className="text-xl font-bold text-blue-700 dark:text-blue-300">{formatCurrency(kpisAvancados.totalDizimos)}</p>
            </div>
            <DollarSign className="w-8 h-8 text-blue-500" />
          </div>
          <div className="flex items-center mt-2">
            <TrendingUp className={`w-3 h-3 mr-1 ${kpisAvancados.tendenciaCrescimento === 'up' ? 'text-green-500' : 'text-red-500'}`} />
            <span className={`text-xs ${kpisAvancados.tendenciaCrescimento === 'up' ? 'text-green-500' : 'text-red-500'}`}>
              {kpisAvancados.crescimentoTotal.toFixed(1)}%
            </span>
          </div>
        </div>
        
        <div className="bg-gradient-to-br from-green-50 to-green-100 dark:from-green-900/20 dark:to-green-800/20 border border-green-200 dark:border-green-500/20 rounded-xl p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-green-600 dark:text-green-400 text-xs font-medium">Total Eventos</p>
              <p className="text-xl font-bold text-green-700 dark:text-green-300">{kpisAvancados.totalEventos}</p>
            </div>
            <Calendar className="w-8 h-8 text-green-500" />
          </div>
          <p className="text-green-600 dark:text-green-400 text-xs mt-2">
            Média: {kpisAvancados.mediaEventosPorMes.toFixed(1)}/mês
          </p>
        </div>
        
        <div className="bg-gradient-to-br from-purple-50 to-purple-100 dark:from-purple-900/20 dark:to-purple-800/20 border border-purple-200 dark:border-purple-500/20 rounded-xl p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-purple-600 dark:text-purple-400 text-xs font-medium">Total Membros</p>
              <p className="text-xl font-bold text-purple-700 dark:text-purple-300">{kpisAvancados.totalMembros}</p>
            </div>
            <Users className="w-8 h-8 text-purple-500" />
          </div>
          <p className="text-purple-600 dark:text-purple-400 text-xs mt-2">
            {igrejas.length} igrejas
          </p>
        </div>
        
        <div className="bg-gradient-to-br from-orange-50 to-orange-100 dark:from-orange-900/20 dark:to-orange-800/20 border border-orange-200 dark:border-orange-500/20 rounded-xl p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-orange-600 dark:text-orange-400 text-xs font-medium">Média Dízimos</p>
              <p className="text-xl font-bold text-orange-700 dark:text-orange-300">{formatCurrency(kpisAvancados.mediaDizimosPorMes)}</p>
            </div>
            <TrendingUp className="w-8 h-8 text-orange-500" />
          </div>
          <p className="text-orange-600 dark:text-orange-400 text-xs mt-2">Por mês</p>
        </div>
        
        <div className="bg-gradient-to-br from-indigo-50 to-indigo-100 dark:from-indigo-900/20 dark:to-indigo-800/20 border border-indigo-200 dark:border-indigo-500/20 rounded-xl p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-indigo-600 dark:text-indigo-400 text-xs font-medium">Igreja + Ativa</p>
              <p className="text-sm font-bold text-indigo-700 dark:text-indigo-300">{kpisAvancados.igrejasMaisAtivas[0]?.igreja || 'N/A'}</p>
            </div>
            <BarChart3 className="w-8 h-8 text-indigo-500" />
          </div>
          <p className="text-indigo-600 dark:text-indigo-400 text-xs mt-2">
            {kpisAvancados.igrejasMaisAtivas[0]?.total || 0} membros
          </p>
        </div>
        
        <div className="bg-gradient-to-br from-pink-50 to-pink-100 dark:from-pink-900/20 dark:to-pink-800/20 border border-pink-200 dark:border-pink-500/20 rounded-xl p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-pink-600 dark:text-pink-400 text-xs font-medium">Período</p>
              <p className="text-xl font-bold text-pink-700 dark:text-pink-300">{periodOptions.find(p => p.value === selectedPeriod)?.label}</p>
            </div>
            <Filter className="w-8 h-8 text-pink-500" />
          </div>
          <p className="text-pink-600 dark:text-pink-400 text-xs mt-2">Análise atual</p>
        </div>
      </motion.div>

      {/* Container principal dos gráficos */}
      <div ref={chartsContainerRef} className="space-y-8">

      {/* Gráficos por Sede/Congregação - Baseado em Permissões */}
      {((userRole === 'admin' && sedes.length > 0) || 
        (userRole === 'sede' && (sedes.length > 0 || congregacoes.length > 0)) || 
        (userRole === 'congregacao' && congregacoes.length > 0)) && (
        <motion.div
          className="space-y-8"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.2 }}
        >
          <h3 className="text-xl font-bold text-gray-900 dark:text-white flex items-center space-x-2">
            <div className="p-2 bg-purple-500 rounded-lg">
              <BarChart3 className="w-5 h-5 text-white" />
            </div>
            <span>
              {userRole === 'admin' ? 'Análise por Sede' :
               userRole === 'sede' ? 'Análise da Sede e Congregações' :
               'Análise da Congregação'}
            </span>
          </h3>

          {/* Grid específico para gráficos de sede */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            
            {/* Gráfico de Dízimos por Sede (Evolução no Tempo) */}
            <div className="bg-gradient-to-br from-white to-gray-50 dark:from-gray-800 dark:to-gray-900 border border-gray-200 dark:border-purple-500/20 rounded-xl p-6 shadow-lg">
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center space-x-3">
                  <div className="p-2 bg-purple-500 rounded-lg">
                    <DollarSign className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <h4 className="text-lg font-semibold text-gray-900 dark:text-white">
                      {userRole === 'admin' ? 'Dízimos por Sede' :
                       userRole === 'sede' ? 'Dízimos da Sede e Congregações' :
                       'Dízimos da Congregação'}
                    </h4>
                    <p className="text-sm text-gray-600 dark:text-gray-400">Evolução temporal comparada</p>
                  </div>
                </div>
              </div>
              
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={dizimosPorSede}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#374151" opacity={0.3} />
                  <XAxis 
                    dataKey="mes" 
                    stroke="#6B7280"
                    fontSize={12}
                  />
                  <YAxis 
                    stroke="#6B7280"
                    fontSize={12}
                    tickFormatter={formatCurrency}
                  />
                  <Tooltip 
                    formatter={(value: number) => [formatCurrencyDetailed(value), 'Dízimos']}
                    labelStyle={{ color: '#374151' }}
                    contentStyle={{ 
                      backgroundColor: '#F9FAFB', 
                      border: '1px solid #E5E7EB',
                      borderRadius: '8px'
                    }}
                  />
                  <Legend />
                  {sedes.map((sedeData, index) => {
                    const nomeAbreviado = sedeData.igreja.nome.length > 10 
                      ? sedeData.igreja.nome.substring(0, 10) + '...' 
                      : sedeData.igreja.nome;
                    const coresDisponiveis = [colors.primary, colors.secondary, colors.purple, colors.orange, colors.pink, colors.indigo];
                    return (
                      <Line
                        key={sedeData.igreja._id}
                        type="monotone"
                        dataKey={nomeAbreviado}
                        stroke={coresDisponiveis[index % coresDisponiveis.length]}
                        strokeWidth={3}
                        name={sedeData.igreja.nome}
                        dot={{ r: 4 }}
                      />
                    );
                  })}
                </LineChart>
              </ResponsiveContainer>
            </div>

            {/* Gráfico de Pizza - Participação de Cada Sede no Total */}
            <div className="bg-gradient-to-br from-white to-gray-50 dark:from-gray-800 dark:to-gray-900 border border-gray-200 dark:border-purple-500/20 rounded-xl p-6 shadow-lg">
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center space-x-3">
                  <div className="p-2 bg-purple-500 rounded-lg">
                    <PieChartIcon className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <h4 className="text-lg font-semibold text-gray-900 dark:text-white">
                  {userRole === 'admin' ? 'Participação por Sede' :
                   userRole === 'sede' ? 'Participação da Sede e Congregações' :
                   'Participação da Congregação'}
                </h4>
                    <p className="text-sm text-gray-600 dark:text-gray-400">Total de dízimos no período</p>
                  </div>
                </div>
              </div>
              
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={eventosPorSede}
                    cx="50%"
                    cy="50%"
                    outerRadius={100}
                    dataKey="valor"
                    nameKey="sede"
                    label={({ sede, percent }) => `${sede}: ${((percent || 0) * 100).toFixed(1)}%`}
                  >
                    {eventosPorSede.map((entry, index) => {
                      const coresDisponiveis = [colors.primary, colors.secondary, colors.purple, colors.orange, colors.pink, colors.indigo, colors.red];
                      return (
                        <Cell 
                          key={`cell-${index}`} 
                          fill={coresDisponiveis[index % coresDisponiveis.length]} 
                        />
                      );
                    })}
                  </Pie>
                  <Tooltip 
                    formatter={(value: number) => [formatCurrencyDetailed(value), 'Total']}
                    contentStyle={{ 
                      backgroundColor: '#F9FAFB', 
                      border: '1px solid #E5E7EB',
                      borderRadius: '8px'
                    }}
                  />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            </div>

            {/* Gráfico de Barras - Comparativo Dízimos e Eventos */}
            <div className="bg-gradient-to-br from-white to-gray-50 dark:from-gray-800 dark:to-gray-900 border border-gray-200 dark:border-purple-500/20 rounded-xl p-6 shadow-lg">
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center space-x-3">
                  <div className="p-2 bg-purple-500 rounded-lg">
                    <BarChart3 className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <h4 className="text-lg font-semibold text-gray-900 dark:text-white">
                  {userRole === 'admin' ? 'Comparativo por Sede' :
                   userRole === 'sede' ? 'Comparativo da Sede e Congregações' :
                   'Dados da Congregação'}
                </h4>
                    <p className="text-sm text-gray-600 dark:text-gray-400">Dízimos e eventos no período</p>
                  </div>
                </div>
              </div>
              
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={eventosPorSede}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#374151" opacity={0.3} />
                  <XAxis 
                    dataKey="sede"
                    stroke="#6B7280"
                    fontSize={10}
                    angle={-45}
                    textAnchor="end"
                    height={80}
                  />
                  <YAxis 
                    yAxisId="left"
                    stroke="#6B7280"
                    fontSize={12}
                    tickFormatter={formatCurrency}
                  />
                  <YAxis 
                    yAxisId="right"
                    orientation="right"
                    stroke="#6B7280"
                    fontSize={12}
                  />
                  <Tooltip 
                    formatter={(value: number, name: string) => [
                      name === 'valor' ? formatCurrencyDetailed(value) : value, 
                      name === 'valor' ? 'Dízimos' : 'Eventos'
                    ]}
                    contentStyle={{ 
                      backgroundColor: '#F9FAFB', 
                      border: '1px solid #E5E7EB',
                      borderRadius: '8px'
                    }}
                  />
                  <Legend />
                  <Bar 
                    yAxisId="left"
                    dataKey="valor" 
                    fill={colors.primary}
                    name="Dízimos (R$)"
                    radius={[4, 4, 0, 0]}
                  />
                  <Bar 
                    yAxisId="right"
                    dataKey="eventos" 
                    fill={colors.secondary}
                    name="Eventos"
                    radius={[4, 4, 0, 0]}
                  />
                </BarChart>
              </ResponsiveContainer>
            </div>

          </div>
        </motion.div>
      )}

      {/* Grid de Gráficos Gerais */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        
        {/* Gráfico de Evolução de Dízimos */}
        <motion.div
          className="bg-gradient-to-br from-white to-gray-50 dark:from-gray-800 dark:to-gray-900 border border-gray-200 dark:border-blue-500/20 rounded-xl p-6 shadow-lg"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
        >
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-blue-500 rounded-lg">
                <TrendingUp className="w-5 h-5 text-white" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Evolução de Dízimos</h3>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  {periodOptions.find(p => p.value === selectedPeriod)?.label} {showYearComparison ? '(com comparação anual)' : ''}
                </p>
              </div>
            </div>
          </div>
          
          <ResponsiveContainer width="100%" height={300}>
            <AreaChart data={dizimosPorMes}>
              <defs>
                <linearGradient id="colorDizimos" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor={colors.primary} stopOpacity={0.3}/>
                  <stop offset="95%" stopColor={colors.primary} stopOpacity={0.0}/>
                </linearGradient>
                <linearGradient id="colorDizimosAnoAnterior" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor={colors.orange} stopOpacity={0.2}/>
                  <stop offset="95%" stopColor={colors.orange} stopOpacity={0.0}/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#374151" opacity={0.3} />
              <XAxis 
                dataKey="mes" 
                stroke="#6B7280"
                fontSize={12}
              />
              <YAxis 
                stroke="#6B7280"
                fontSize={12}
                tickFormatter={formatCurrency}
              />
              <Tooltip 
                formatter={(value: number, name: string) => [formatCurrencyDetailed(value), name === 'valor' ? 'Atual' : 'Ano Anterior']}
                labelStyle={{ color: '#374151' }}
                contentStyle={{ 
                  backgroundColor: '#F9FAFB', 
                  border: '1px solid #E5E7EB',
                  borderRadius: '8px'
                }}
              />
              <Legend />
              <Area
                type="monotone"
                dataKey="valor"
                stroke={colors.primary}
                strokeWidth={3}
                fillOpacity={1}
                fill="url(#colorDizimos)"
                name="Atual"
              />
              {showYearComparison && (
                <Area
                  type="monotone"
                  dataKey="valorAnoAnterior"
                  stroke={colors.orange}
                  strokeWidth={2}
                  strokeDasharray="5 5"
                  fillOpacity={1}
                  fill="url(#colorDizimosAnoAnterior)"
                  name="Ano Anterior"
                />
              )}
            </AreaChart>
          </ResponsiveContainer>
        </motion.div>

        {/* Gráfico de Frequência de Eventos */}
        <motion.div
          className="bg-gradient-to-br from-white to-gray-50 dark:from-gray-800 dark:to-gray-900 border border-gray-200 dark:border-green-500/20 rounded-xl p-6 shadow-lg"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.1 }}
        >
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-green-500 rounded-lg">
                <Calendar className="w-5 h-5 text-white" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Frequência de Eventos</h3>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Por tipo de igreja - {periodOptions.find(p => p.value === selectedPeriod)?.label}
                </p>
              </div>
            </div>
          </div>
          
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={eventosPorMes}>
              <CartesianGrid strokeDasharray="3 3" stroke="#374151" opacity={0.3} />
              <XAxis 
                dataKey="mes" 
                stroke="#6B7280"
                fontSize={12}
              />
              <YAxis 
                stroke="#6B7280"
                fontSize={12}
              />
              <Tooltip 
                formatter={(value: number, name: string) => {
                  const displayName = name === 'eventosSede' ? 'Sede' : 
                                    name === 'eventosCongregacao' ? 'Congregação' : 'Total';
                  return [value, displayName];
                }}
                labelStyle={{ color: '#374151' }}
                contentStyle={{ 
                  backgroundColor: '#F9FAFB', 
                  border: '1px solid #E5E7EB',
                  borderRadius: '8px'
                }}
              />
              <Legend 
                formatter={(value) => value === 'eventosSede' ? 'Sede' : 
                                   value === 'eventosCongregacao' ? 'Congregação' : 'Total'}
              />
              <Bar 
                dataKey="eventosSede" 
                stackId="a"
                fill={colors.primary}
                radius={[0, 0, 0, 0]}
                name="eventosSede"
              />
              <Bar 
                dataKey="eventosCongregacao" 
                stackId="a"
                fill={colors.secondary}
                radius={[4, 4, 0, 0]}
                name="eventosCongregacao"
              />
            </BarChart>
          </ResponsiveContainer>
        </motion.div>

        {/* Gráfico de Pizza - Dízimos por Tipo de Igreja */}
        <motion.div
          className="bg-gradient-to-br from-white to-gray-50 dark:from-gray-800 dark:to-gray-900 border border-gray-200 dark:border-purple-500/20 rounded-xl p-6 shadow-lg"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.2 }}
        >
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-purple-500 rounded-lg">
                <PieChartIcon className="w-5 h-5 text-white" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Dízimos por Tipo</h3>
                <p className="text-sm text-gray-600 dark:text-gray-400">Sede vs Congregações</p>
              </div>
            </div>
          </div>
          
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={dadosPorTipoIgreja}
                cx="50%"
                cy="50%"
                innerRadius={60}
                outerRadius={120}
                paddingAngle={5}
                dataKey="value"
              >
                {dadosPorTipoIgreja.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={index === 0 ? colors.purple : colors.pink} />
                ))}
              </Pie>
              <Tooltip 
                formatter={(value: number) => [formatCurrencyDetailed(value), 'Valor']}
                contentStyle={{ 
                  backgroundColor: '#F9FAFB', 
                  border: '1px solid #E5E7EB',
                  borderRadius: '8px'
                }}
              />
              <Legend />
            </PieChart>
          </ResponsiveContainer>
        </motion.div>

        {/* Gráfico de Membros por Igreja */}
        <motion.div
          className="bg-gradient-to-br from-white to-gray-50 dark:from-gray-800 dark:to-gray-900 border border-gray-200 dark:border-orange-500/20 rounded-xl p-6 shadow-lg"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.3 }}
        >
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-orange-500 rounded-lg">
                <Users className="w-5 h-5 text-white" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Membros por Igreja</h3>
                <p className="text-sm text-gray-600 dark:text-gray-400">Distribuição de membros</p>
              </div>
            </div>
          </div>
          
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={membrosPorIgreja} layout="horizontal">
              <CartesianGrid strokeDasharray="3 3" stroke="#374151" opacity={0.3} />
              <XAxis 
                type="number"
                stroke="#6B7280"
                fontSize={12}
              />
              <YAxis 
                type="category"
                dataKey="igreja"
                stroke="#6B7280"
                fontSize={11}
                width={100}
              />
              <Tooltip 
                formatter={(value: number) => [value, 'Membros']}
                labelStyle={{ color: '#374151' }}
                contentStyle={{ 
                  backgroundColor: '#F9FAFB', 
                  border: '1px solid #E5E7EB',
                  borderRadius: '8px'
                }}
              />
              <Bar 
                dataKey="total" 
                fill={colors.orange}
                radius={[0, 4, 4, 0]}
              />
            </BarChart>
          </ResponsiveContainer>
        </motion.div>
      </div>

      {/* Gráfico de Análise de Crescimento */}
      <motion.div
        className="bg-gradient-to-br from-white to-gray-50 dark:from-gray-800 dark:to-gray-900 border border-gray-200 dark:border-indigo-500/20 rounded-xl p-6 shadow-lg"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 0.4 }}
      >
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-indigo-500 rounded-lg">
              <TrendingUp className="w-5 h-5 text-white" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Análise de Crescimento</h3>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Crescimento percentual dos dízimos vs frequência de eventos
              </p>
            </div>
          </div>
        </div>
        
        <ResponsiveContainer width="100%" height={400}>
          <LineChart data={dadosComparativos}>
            <CartesianGrid strokeDasharray="3 3" stroke="#374151" opacity={0.3} />
            <XAxis 
              dataKey="mes" 
              stroke="#6B7280"
              fontSize={12}
            />
            <YAxis 
              yAxisId="left"
              stroke="#6B7280"
              fontSize={12}
              tickFormatter={(value) => `${value.toFixed(1)}%`}
            />
            <YAxis 
              yAxisId="right" 
              orientation="right"
              stroke="#6B7280"
              fontSize={12}
            />
            <Tooltip 
              formatter={(value: number, name: string) => {
                if (name === 'Crescimento %') {
                  return [`${value.toFixed(1)}%`, name];
                } else if (name === 'Dízimos') {
                  return [formatCurrencyDetailed(value), name];
                }
                return [value, name];
              }}
              labelStyle={{ color: '#374151' }}
              contentStyle={{ 
                backgroundColor: '#F9FAFB', 
                border: '1px solid #E5E7EB',
                borderRadius: '8px'
              }}
            />
            <Legend />
            
            {/* Linha de crescimento percentual */}
            <Line 
              yAxisId="left"
              type="monotone" 
              dataKey="crescimento" 
              stroke={colors.red}
              strokeWidth={3}
              name="Crescimento %"
              dot={{ fill: colors.red, strokeWidth: 2, r: 6 }}
            />
            
            {/* Linha de dízimos atuais */}
            <Line 
              yAxisId="right"
              type="monotone" 
              dataKey="valor" 
              stroke={colors.primary}
              strokeWidth={2}
              name="Dízimos"
              dot={{ fill: colors.primary, strokeWidth: 2, r: 4 }}
            />
            
            {/* Linhas de eventos por tipo */}
            <Line 
              yAxisId="right"
              type="monotone" 
              dataKey="eventosSede" 
              stroke={colors.purple}
              strokeWidth={2}
              strokeDasharray="5 5"
              name="Eventos Sede"
              dot={{ fill: colors.purple, strokeWidth: 2, r: 4 }}
            />
            
            <Line 
              yAxisId="right"
              type="monotone" 
              dataKey="eventosCongregacao" 
              stroke={colors.secondary}
              strokeWidth={2}
              strokeDasharray="3 3"
              name="Eventos Congregação"
              dot={{ fill: colors.secondary, strokeWidth: 2, r: 4 }}
            />
          </LineChart>
        </ResponsiveContainer>
      </motion.div>

      {/* Grid adicional de insights */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <motion.div
          className="bg-gradient-to-br from-green-50 to-green-100 dark:from-green-900/20 dark:to-green-800/20 border border-green-200 dark:border-green-500/20 rounded-xl p-6"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.5 }}
        >
          <div className="flex items-center space-x-3 mb-4">
            <TrendingUp className="w-6 h-6 text-green-500" />
            <h4 className="text-lg font-semibold text-green-700 dark:text-green-300">Crescimento</h4>
          </div>
          <p className="text-3xl font-bold text-green-700 dark:text-green-300 mb-2">
            {kpisAvancados.crescimentoTotal > 0 ? '+' : ''}{kpisAvancados.crescimentoTotal.toFixed(1)}%
          </p>
          <p className="text-sm text-green-600 dark:text-green-400">
            {kpisAvancados.crescimentoTotal > 0 ? 'Crescimento' : 'Redução'} em relação ao ano anterior
          </p>
        </motion.div>

        <motion.div
          className="bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-900/20 dark:to-blue-800/20 border border-blue-200 dark:border-blue-500/20 rounded-xl p-6"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.6 }}
        >
          <div className="flex items-center space-x-3 mb-4">
            <BarChart3 className="w-6 h-6 text-blue-500" />
            <h4 className="text-lg font-semibold text-blue-700 dark:text-blue-300">Eficiência</h4>
          </div>
          <p className="text-3xl font-bold text-blue-700 dark:text-blue-300 mb-2">
            {(kpisAvancados.totalDizimos / Math.max(kpisAvancados.totalEventos, 1)).toFixed(0)}
          </p>
          <p className="text-sm text-blue-600 dark:text-blue-400">
            Dízimos por evento (em R$)
          </p>
        </motion.div>

        <motion.div
          className="bg-gradient-to-br from-purple-50 to-purple-100 dark:from-purple-900/20 dark:to-purple-800/20 border border-purple-200 dark:border-purple-500/20 rounded-xl p-6"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.7 }}
        >
          <div className="flex items-center space-x-3 mb-4">
            <Users className="w-6 h-6 text-purple-500" />
            <h4 className="text-lg font-semibold text-purple-700 dark:text-purple-300">Engajamento</h4>
          </div>
          <p className="text-3xl font-bold text-purple-700 dark:text-purple-300 mb-2">
            {(kpisAvancados.totalDizimos / Math.max(kpisAvancados.totalMembros, 1)).toFixed(0)}
          </p>
          <p className="text-sm text-purple-600 dark:text-purple-400">
            Dízimo médio por membro (R$)
          </p>
        </motion.div>
      </div>
      </div>
    </div>
  );
};

export default DashboardCharts;