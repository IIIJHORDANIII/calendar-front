import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Shield, 
  Filter, 
  Search, 
  Clock, 
  User, 
  AlertTriangle,
  Download,
  Eye,
  FileText,
  Activity,
  TrendingUp,
  ChevronLeft,
  ChevronRight,
  Calendar,
  MapPin,
  Smartphone
} from 'lucide-react';
import apiService from '../utils/api';
import { useIntelligentCache, CacheTTL } from '../utils/cache';

interface AuditLog {
  _id: string;
  usuario: {
    _id: string;
    nome: string;
    email: string;
    role: string;
  } | null;
  usuarioNome: string;
  usuarioEmail: string;
  usuarioRole: string;
  acao: string;
  entidade: string;
  entidadeId?: string;
  entidadeNome?: string;
  descricao: string;
  metodo: string;
  endpoint: string;
  statusCode: number;
  dadosAntigos?: any;
  dadosNovos?: any;
  ip: string;
  userAgent: string;
  origem: string;
  igreja?: {
    _id: string;
    nome: string;
    tipo: string;
  };
  igrejaNome?: string;
  sucesso: boolean;
  erro?: string;
  duracao?: number;
  nivelSeguranca: 'baixo' | 'medio' | 'alto' | 'critico';
  risco: boolean;
  timestamp: string;
  data: string;
  hora: string;
}

interface Pagination {
  page: number;
  limit: number;
  total: number;
  pages: number;
}

interface AuditLogResponse {
  logs: AuditLog[];
  pagination: Pagination;
}

interface Estatisticas {
  geral: {
    total: number;
    sucessos: number;
    erros: number;
    riscos: number;
  };
  porAcao: Array<{ _id: string; total: number; sucessos: number; erros: number }>;
  porEntidade: Array<{ _id: string; total: number; sucessos: number; erros: number }>;
  porUsuario: Array<{ _id: string; nome: string; total: number; sucessos: number; erros: number }>;
  porHora: Array<{ _id: number; total: number }>;
}

type FilterAcao = 'all' | 'login' | 'logout' | 'criar' | 'editar' | 'deletar' | 'visualizar' | 'exportar';
type FilterEntidade = 'all' | 'usuario' | 'igreja' | 'evento' | 'dizimo' | 'membro' | 'pastor' | 'diretoria' | 'notificacao';
type FilterSeguranca = 'all' | 'baixo' | 'medio' | 'alto' | 'critico';

const AuditLogs: React.FC = () => {
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [acaoFilter, setAcaoFilter] = useState<FilterAcao>('all');
  const [entidadeFilter, setEntidadeFilter] = useState<FilterEntidade>('all');
  const [segurancaFilter, setSegurancaFilter] = useState<FilterSeguranca>('all');
  const [riscoFilter, setRiscoFilter] = useState<'all' | 'true' | 'false'>('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(20);
  const [pagination, setPagination] = useState<Pagination>({
    page: 1,
    limit: 20,
    total: 0,
    pages: 0
  });
  const [showStats, setShowStats] = useState(false);
  const [stats, setStats] = useState<Estatisticas | null>(null);
  const [selectedLog, setSelectedLog] = useState<AuditLog | null>(null);
  const [dataInicio, setDataInicio] = useState('');
  const [dataFim, setDataFim] = useState('');

  const { getCached, setCached } = useIntelligentCache();

  const fetchLogs = useCallback(async () => {
    try {
      setLoading(true);
      
      const params = new URLSearchParams({
        page: currentPage.toString(),
        limit: itemsPerPage.toString()
      });

      if (acaoFilter !== 'all') params.append('acao', acaoFilter);
      if (entidadeFilter !== 'all') params.append('entidade', entidadeFilter);
      if (segurancaFilter !== 'all') params.append('nivelSeguranca', segurancaFilter);
      if (riscoFilter !== 'all') params.append('risco', riscoFilter);
      if (dataInicio) params.append('dataInicio', dataInicio);
      if (dataFim) params.append('dataFim', dataFim);
      if (searchTerm.trim()) params.append('search', searchTerm.trim());

      const response = await apiService.get(`/audit?${params.toString()}`);
      
      if (response.ok) {
        const data: AuditLogResponse = await response.json();
        setLogs(data.logs);
        setPagination(data.pagination);
      }
    } catch (error) {
      console.error('Erro ao buscar logs de auditoria:', error);
    } finally {
      setLoading(false);
    }
  }, [currentPage, itemsPerPage, acaoFilter, entidadeFilter, segurancaFilter, riscoFilter, dataInicio, dataFim, searchTerm]);

  const fetchStats = useCallback(async () => {
    try {
      const cacheKey = 'audit_stats';
      const cachedStats = getCached<Estatisticas>(cacheKey);
      
      if (cachedStats) {
        setStats(cachedStats);
        return;
      }

      const params = new URLSearchParams();
      if (dataInicio) params.append('dataInicio', dataInicio);
      if (dataFim) params.append('dataFim', dataFim);

      const response = await apiService.get(`/audit/estatisticas?${params.toString()}`);
      
      if (response.ok) {
        const data: Estatisticas = await response.json();
        setStats(data);
        setCached(cacheKey, data, CacheTTL.REPORTS_DATA);
      }
    } catch (error) {
      console.error('Erro ao buscar estatísticas:', error);
    }
  }, [dataInicio, dataFim, getCached, setCached]);

  useEffect(() => {
    fetchLogs();
  }, [fetchLogs]);

  useEffect(() => {
    if (showStats) {
      fetchStats();
    }
  }, [showStats, fetchStats]);

  // Reset para página 1 quando filtros mudarem
  useEffect(() => {
    if (currentPage !== 1) {
      setCurrentPage(1);
    }
  }, [acaoFilter, entidadeFilter, segurancaFilter, riscoFilter, searchTerm]);

  const exportLogs = async (formato: 'json' | 'csv') => {
    try {
      const params = new URLSearchParams();
      if (dataInicio) params.append('dataInicio', dataInicio);
      if (dataFim) params.append('dataFim', dataFim);
      params.append('formato', formato);

      const response = await apiService.get(`/audit/exportar?${params.toString()}`);
      
      if (response.ok) {
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `audit_logs.${formato}`;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
      }
    } catch (error) {
      console.error('Erro ao exportar logs:', error);
    }
  };

  const getActionColor = (acao: string) => {
    const colors = {
      'login': 'text-green-600 bg-green-50 dark:bg-green-900/20',
      'logout': 'text-gray-600 bg-gray-50 dark:bg-gray-900/20',
      'criar': 'text-blue-600 bg-blue-50 dark:bg-blue-900/20',
      'editar': 'text-yellow-600 bg-yellow-50 dark:bg-yellow-900/20',
      'deletar': 'text-red-600 bg-red-50 dark:bg-red-900/20',
      'visualizar': 'text-purple-600 bg-purple-50 dark:bg-purple-900/20',
      'exportar': 'text-indigo-600 bg-indigo-50 dark:bg-indigo-900/20'
    };
    return colors[acao as keyof typeof colors] || 'text-gray-600 bg-gray-50 dark:bg-gray-900/20';
  };

  const getSecurityColor = (nivel: string) => {
    const colors = {
      'baixo': 'text-green-600 bg-green-50',
      'medio': 'text-yellow-600 bg-yellow-50',
      'alto': 'text-orange-600 bg-orange-50',
      'critico': 'text-red-600 bg-red-50'
    };
    return colors[nivel as keyof typeof colors] || 'text-gray-600 bg-gray-50';
  };

  const getStatusColor = (sucesso: boolean) => {
    return sucesso 
      ? 'text-green-600 bg-green-50' 
      : 'text-red-600 bg-red-50';
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-4 sm:p-6">
      <div className="max-w-7xl mx-auto">
        
        {/* Header */}
        <motion.div
          className="mb-8"
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
        >
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center space-x-4">
              <div className="p-3 bg-gradient-to-r from-red-500 to-orange-600 rounded-xl">
                <Shield className="w-8 h-8 text-white" />
              </div>
              <div>
                <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
                  Logs de Auditoria
                </h1>
                <p className="text-gray-600 dark:text-gray-400">
                  Monitoramento completo de atividades do sistema
                </p>
              </div>
            </div>

            <div className="flex items-center space-x-2">
              <button
                onClick={() => setShowStats(!showStats)}
                className={`flex items-center space-x-2 px-4 py-2 rounded-lg transition-colors ${
                  showStats 
                    ? 'bg-blue-500 text-white' 
                    : 'bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 border border-gray-300 dark:border-gray-600'
                }`}
              >
                <Activity className="w-4 h-4" />
                <span>Estatísticas</span>
              </button>

              <div className="flex items-center space-x-1">
                <button
                  onClick={() => exportLogs('json')}
                  className="p-2 bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                  title="Exportar JSON"
                >
                  <FileText className="w-4 h-4" />
                </button>
                <button
                  onClick={() => exportLogs('csv')}
                  className="p-2 bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                  title="Exportar CSV"
                >
                  <Download className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>

          {/* Estatísticas */}
          <AnimatePresence>
            {showStats && stats && (
              <motion.div
                className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6"
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                transition={{ duration: 0.3 }}
              >
                <div className="bg-white dark:bg-gray-800 rounded-xl p-4 border border-gray-200 dark:border-gray-700">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-gray-600 dark:text-gray-400">Total</p>
                      <p className="text-2xl font-bold text-gray-900 dark:text-white">{stats.geral.total}</p>
                    </div>
                    <Activity className="w-8 h-8 text-blue-500" />
                  </div>
                </div>
                
                <div className="bg-white dark:bg-gray-800 rounded-xl p-4 border border-gray-200 dark:border-gray-700">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-gray-600 dark:text-gray-400">Sucessos</p>
                      <p className="text-2xl font-bold text-green-600">{stats.geral.sucessos}</p>
                    </div>
                    <TrendingUp className="w-8 h-8 text-green-500" />
                  </div>
                </div>
                
                <div className="bg-white dark:bg-gray-800 rounded-xl p-4 border border-gray-200 dark:border-gray-700">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-gray-600 dark:text-gray-400">Erros</p>
                      <p className="text-2xl font-bold text-red-600">{stats.geral.erros}</p>
                    </div>
                    <AlertTriangle className="w-8 h-8 text-red-500" />
                  </div>
                </div>
                
                <div className="bg-white dark:bg-gray-800 rounded-xl p-4 border border-gray-200 dark:border-gray-700">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-gray-600 dark:text-gray-400">Riscos</p>
                      <p className="text-2xl font-bold text-orange-600">{stats.geral.riscos}</p>
                    </div>
                    <Shield className="w-8 h-8 text-orange-500" />
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>

        {/* Filtros */}
        <motion.div
          className="bg-white dark:bg-gray-800 rounded-xl p-6 border border-gray-200 dark:border-gray-700 mb-6"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.1 }}
        >
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 xl:grid-cols-6 gap-4">
            
            {/* Busca */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <input
                type="text"
                placeholder="Buscar..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            {/* Filtro de Ação */}
            <select
              value={acaoFilter}
              onChange={(e) => setAcaoFilter(e.target.value as FilterAcao)}
              className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="all">Todas as Ações</option>
              <option value="login">Login</option>
              <option value="logout">Logout</option>
              <option value="criar">Criar</option>
              <option value="editar">Editar</option>
              <option value="deletar">Deletar</option>
              <option value="visualizar">Visualizar</option>
              <option value="exportar">Exportar</option>
            </select>

            {/* Filtro de Entidade */}
            <select
              value={entidadeFilter}
              onChange={(e) => setEntidadeFilter(e.target.value as FilterEntidade)}
              className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="all">Todas as Entidades</option>
              <option value="usuario">Usuário</option>
              <option value="igreja">Igreja</option>
              <option value="evento">Evento</option>
              <option value="dizimo">Dízimo</option>
              <option value="membro">Membro</option>
              <option value="pastor">Pastor</option>
              <option value="diretoria">Diretoria</option>
              <option value="notificacao">Notificação</option>
            </select>

            {/* Filtro de Segurança */}
            <select
              value={segurancaFilter}
              onChange={(e) => setSegurancaFilter(e.target.value as FilterSeguranca)}
              className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="all">Todos os Níveis</option>
              <option value="baixo">Baixo</option>
              <option value="medio">Médio</option>
              <option value="alto">Alto</option>
              <option value="critico">Crítico</option>
            </select>

            {/* Data Início */}
            <input
              type="date"
              value={dataInicio}
              onChange={(e) => setDataInicio(e.target.value)}
              className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />

            {/* Data Fim */}
            <input
              type="date"
              value={dataFim}
              onChange={(e) => setDataFim(e.target.value)}
              className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
        </motion.div>

        {/* Lista de Logs */}
        <motion.div
          className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.2 }}
        >
          {loading ? (
            <div className="p-8 text-center">
              <div className="animate-spin w-8 h-8 mx-auto mb-4 border-2 border-gray-300 border-t-blue-600 rounded-full"></div>
              <p className="text-gray-500 dark:text-gray-400">Carregando logs...</p>
            </div>
          ) : logs.length === 0 ? (
            <div className="p-8 text-center">
              <Shield className="w-16 h-16 mx-auto mb-4 text-gray-300 dark:text-gray-600" />
              <p className="text-gray-500 dark:text-gray-400">Nenhum log encontrado</p>
            </div>
          ) : (
            <div className="divide-y divide-gray-200 dark:divide-gray-700">
              <AnimatePresence>
                {logs.map((log, index) => (
                  <motion.div
                    key={log._id}
                    className="p-6 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors cursor-pointer"
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.3, delay: index * 0.05 }}
                    onClick={() => setSelectedLog(log)}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex items-start space-x-4 flex-1">
                        
                        {/* Informações Principais */}
                        <div className="flex-1">
                          <div className="flex items-center space-x-2 mb-2">
                            <span className={`px-2 py-1 text-xs font-medium rounded-full ${getActionColor(log.acao)}`}>
                              {log.acao.charAt(0).toUpperCase() + log.acao.slice(1)}
                            </span>
                            <span className={`px-2 py-1 text-xs font-medium rounded-full ${getSecurityColor(log.nivelSeguranca)}`}>
                              {log.nivelSeguranca.charAt(0).toUpperCase() + log.nivelSeguranca.slice(1)}
                            </span>
                            {log.risco && (
                              <span className="px-2 py-1 text-xs font-medium bg-red-100 text-red-800 rounded-full">
                                Risco
                              </span>
                            )}
                            <span className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(log.sucesso)}`}>
                              {log.sucesso ? 'Sucesso' : 'Falha'}
                            </span>
                          </div>
                          
                          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-1">
                            {log.descricao}
                          </h3>
                          
                          <div className="flex items-center space-x-4 text-sm text-gray-500 dark:text-gray-400">
                            <span className="flex items-center space-x-1">
                              <User className="w-4 h-4" />
                              <span>{log.usuarioNome}</span>
                            </span>
                            
                            <span className="flex items-center space-x-1">
                              <Clock className="w-4 h-4" />
                              <span>{log.data} às {log.hora}</span>
                            </span>
                            
                            {log.igreja && (
                              <span className="flex items-center space-x-1">
                                <MapPin className="w-4 h-4" />
                                <span>{log.igreja.nome}</span>
                              </span>
                            )}
                            
                            <span className="flex items-center space-x-1">
                              <Smartphone className="w-4 h-4" />
                              <span>{log.ip}</span>
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* Ações */}
                      <div className="flex items-center space-x-2 ml-4">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setSelectedLog(log);
                          }}
                          className="p-2 text-blue-600 hover:bg-blue-100 dark:hover:bg-blue-900/30 rounded-lg transition-colors"
                          title="Ver detalhes"
                        >
                          <Eye className="w-5 h-5" />
                        </button>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>
          )}

          {/* Paginação */}
          {pagination.pages > 1 && (
            <div className="p-6 border-t border-gray-200 dark:border-gray-700">
              <div className="flex items-center justify-between">
                <p className="text-sm text-gray-700 dark:text-gray-300">
                  Mostrando {((pagination.page - 1) * pagination.limit) + 1} a {Math.min(pagination.page * pagination.limit, pagination.total)} de {pagination.total} logs
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
                    {Array.from({ length: Math.min(5, pagination.pages) }, (_, i) => {
                      let pageNumber: number;
                      if (pagination.pages <= 5) {
                        pageNumber = i + 1;
                      } else if (currentPage <= 3) {
                        pageNumber = i + 1;
                      } else if (currentPage >= pagination.pages - 2) {
                        pageNumber = pagination.pages - 4 + i;
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
                    onClick={() => setCurrentPage(Math.min(pagination.pages, currentPage + 1))}
                    disabled={currentPage === pagination.pages}
                    className="p-2 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <ChevronRight className="w-5 h-5" />
                  </button>
                </div>
              </div>
            </div>
          )}
        </motion.div>

        {/* Modal de Detalhes */}
        <AnimatePresence>
          {selectedLog && (
            <motion.div
              className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setSelectedLog(null)}
            >
              <motion.div
                className="bg-white dark:bg-gray-800 rounded-xl p-6 max-w-4xl w-full max-h-[90vh] overflow-y-auto"
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.9, opacity: 0 }}
                onClick={(e) => e.stopPropagation()}
              >
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
                    Detalhes do Log
                  </h2>
                  <button
                    onClick={() => setSelectedLog(null)}
                    className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
                  >
                    ×
                  </button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        Descrição
                      </label>
                      <p className="text-gray-900 dark:text-white">{selectedLog.descricao}</p>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        Usuário
                      </label>
                      <p className="text-gray-900 dark:text-white">
                        {selectedLog.usuarioNome} ({selectedLog.usuarioEmail})
                      </p>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        Igreja
                      </label>
                      <p className="text-gray-900 dark:text-white">
                        {selectedLog.igreja?.nome || 'N/A'}
                      </p>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        Data/Hora
                      </label>
                      <p className="text-gray-900 dark:text-white">
                        {selectedLog.data} às {selectedLog.hora}
                      </p>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        Endpoint
                      </label>
                      <p className="text-gray-900 dark:text-white font-mono text-sm">
                        {selectedLog.metodo} {selectedLog.endpoint}
                      </p>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        Status
                      </label>
                      <span className={`px-2 py-1 text-sm font-medium rounded-full ${getStatusColor(selectedLog.sucesso)}`}>
                        {selectedLog.statusCode} - {selectedLog.sucesso ? 'Sucesso' : 'Falha'}
                      </span>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        IP
                      </label>
                      <p className="text-gray-900 dark:text-white font-mono text-sm">
                        {selectedLog.ip}
                      </p>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        User Agent
                      </label>
                      <p className="text-gray-900 dark:text-white text-sm break-all">
                        {selectedLog.userAgent}
                      </p>
                    </div>
                  </div>
                </div>

                {selectedLog.dadosNovos && (
                  <div className="mt-6">
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Dados da Requisição
                    </label>
                    <pre className="bg-gray-100 dark:bg-gray-700 p-4 rounded-lg text-sm overflow-x-auto">
                      {JSON.stringify(selectedLog.dadosNovos, null, 2)}
                    </pre>
                  </div>
                )}

                {selectedLog.erro && (
                  <div className="mt-6">
                    <label className="block text-sm font-medium text-red-700 dark:text-red-400 mb-2">
                      Erro
                    </label>
                    <p className="text-red-900 dark:text-red-300 bg-red-50 dark:bg-red-900/20 p-4 rounded-lg">
                      {selectedLog.erro}
                    </p>
                  </div>
                )}
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};

export default AuditLogs;