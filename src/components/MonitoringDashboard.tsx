import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Activity,
  AlertTriangle,
  CheckCircle,
  XCircle,
  Clock,
  Cpu,
  MemoryStick,
  HardDrive,
  Zap,
  TrendingUp,
  TrendingDown,
  AlertCircle,
  RefreshCw,
  Eye,
  EyeOff,
  Server,
  Database,
  Globe,
  Monitor,
  BarChart3,
  PieChart,
  LineChart
} from 'lucide-react';
import { useApi } from '../utils/api';

interface HealthCheck {
  status: string;
  message: string;
  duration: number;
  timestamp: string;
  details?: any;
}

interface SystemMetrics {
  cpu: {
    usage_percent: number;
  };
  memory: {
    usage_percent: number;
    system_usage_percent: number;
  };
  uptime: number;
  load: {
    load1: number;
    load5: number;
    load15: number;
  };
}

interface PerformanceMetrics {
  current: {
    active_requests: number;
    requests_per_minute: number;
    avg_response_time: number;
    error_rate: string;
    memory_usage: string;
    cpu_usage: string;
  };
  historical: {
    response_times: {
      p50: number;
      p95: number;
      p99: number;
    };
    requests_by_status: Record<string, number>;
    errors_by_type: Record<string, number>;
  };
  alerts: {
    high_response_time: boolean;
    high_error_rate: boolean;
    high_memory: boolean;
    high_cpu: boolean;
  };
}

interface Alert {
  _id: string;
  type: string;
  message: string;
  createdAt: string;
  acknowledged: boolean;
  resolved: boolean;
}

const MonitoringDashboard: React.FC = () => {
  const [healthData, setHealthData] = useState<any>(null);
  const [metrics, setMetrics] = useState<PerformanceMetrics | null>(null);
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [uptime, setUptime] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [autoRefresh, setAutoRefresh] = useState(true);
  const [activeTab, setActiveTab] = useState('overview');
  const api = useApi();

  useEffect(() => {
    loadDashboardData();
    
    if (autoRefresh) {
      const interval = setInterval(loadDashboardData, 30000); // 30 segundos
      return () => clearInterval(interval);
    }
  }, [autoRefresh]);

  const loadDashboardData = async () => {
    try {
      setLoading(true);
      
      const [healthResponse, metricsResponse, alertsResponse, uptimeResponse] = await Promise.all([
        api.get('/monitoring/health'),
        api.get('/monitoring/dashboard'),
        api.get('/monitoring/alerts?limit=10'),
        api.get('/monitoring/uptime')
      ]);

      if (healthResponse.ok) {
        const healthData = await healthResponse.json();
        setHealthData(healthData);
      }

      if (metricsResponse.ok) {
        const metricsData = await metricsResponse.json();
        setMetrics(metricsData);
      }

      if (alertsResponse.ok) {
        const alertsData = await alertsResponse.json();
        setAlerts(alertsData.alerts || []);
      }

      if (uptimeResponse.ok) {
        const uptimeData = await uptimeResponse.json();
        setUptime(uptimeData);
      }

    } catch (error) {
      console.error('Erro ao carregar dashboard:', error);
    } finally {
      setLoading(false);
    }
  };

  const acknowledgeAlert = async (alertId: string) => {
    try {
      const response = await api.post(`/monitoring/alerts/${alertId}/acknowledge`);
      if (response.ok) {
        loadDashboardData();
      }
    } catch (error) {
      console.error('Erro ao reconhecer alerta:', error);
    }
  };

  const resolveAlert = async (alertId: string) => {
    try {
      const response = await api.post(`/monitoring/alerts/${alertId}/resolve`);
      if (response.ok) {
        loadDashboardData();
      }
    } catch (error) {
      console.error('Erro ao resolver alerta:', error);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'healthy': return 'text-green-600 bg-green-100';
      case 'warning': return 'text-yellow-600 bg-yellow-100';
      case 'critical': return 'text-red-600 bg-red-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'healthy': return CheckCircle;
      case 'warning': return AlertTriangle;
      case 'critical': return XCircle;
      default: return AlertCircle;
    }
  };

  const formatUptime = (seconds: number) => {
    const days = Math.floor(seconds / 86400);
    const hours = Math.floor((seconds % 86400) / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    return `${days}d ${hours}h ${minutes}m`;
  };

  if (loading && !healthData) {
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
        className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-xl p-6"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold mb-2 flex items-center">
              <Monitor className="w-8 h-8 mr-3" />
              🔍 Sistema de Monitoramento
            </h1>
            <p className="text-blue-100">
              Observabilidade completa do sistema em tempo real
            </p>
          </div>
          <div className="flex items-center space-x-4">
            <button
              onClick={() => setAutoRefresh(!autoRefresh)}
              className={`flex items-center space-x-2 px-4 py-2 rounded-lg transition-colors ${
                autoRefresh 
                  ? 'bg-white/20 text-white' 
                  : 'bg-white/10 text-blue-200 hover:bg-white/20'
              }`}
            >
              {autoRefresh ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
              <span>Auto-refresh</span>
            </button>
            <button
              onClick={loadDashboardData}
              disabled={loading}
              className="flex items-center space-x-2 px-4 py-2 bg-white/20 rounded-lg hover:bg-white/30 transition-colors disabled:opacity-50"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
              <span>Atualizar</span>
            </button>
          </div>
        </div>
      </motion.div>

      {/* Status Overview */}
      {healthData && (
        <motion.div
          className="grid grid-cols-1 md:grid-cols-4 gap-6"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          {/* Status Geral */}
          <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-lg">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-medium text-gray-600 dark:text-gray-400">
                  Status Geral
                </h3>
                <div className={`inline-flex items-center mt-2 px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(healthData.status)}`}>
                  {React.createElement(getStatusIcon(healthData.status), { className: 'w-4 h-4 mr-2' })}
                  {healthData.status.toUpperCase()}
                </div>
              </div>
              <Activity className="w-8 h-8 text-blue-500" />
            </div>
          </div>

          {/* Uptime */}
          <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-lg">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-medium text-gray-600 dark:text-gray-400">
                  Uptime
                </h3>
                <div className="text-2xl font-bold text-gray-900 dark:text-white mt-2">
                  {uptime ? formatUptime(uptime.uptime.seconds) : '0s'}
                </div>
              </div>
              <Clock className="w-8 h-8 text-green-500" />
            </div>
          </div>

          {/* Requests Ativas */}
          <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-lg">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-medium text-gray-600 dark:text-gray-400">
                  Requests Ativas
                </h3>
                <div className="text-2xl font-bold text-gray-900 dark:text-white mt-2">
                  {metrics?.current.active_requests || 0}
                </div>
              </div>
              <Zap className="w-8 h-8 text-yellow-500" />
            </div>
          </div>

          {/* Taxa de Erro */}
          <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-lg">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-medium text-gray-600 dark:text-gray-400">
                  Taxa de Erro
                </h3>
                <div className="text-2xl font-bold text-gray-900 dark:text-white mt-2">
                  {metrics?.current.error_rate || '0.0'}%
                </div>
              </div>
              <AlertTriangle className="w-8 h-8 text-red-500" />
            </div>
          </div>
        </motion.div>
      )}

      {/* Métricas do Sistema */}
      {healthData?.system && (
        <motion.div
          className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-lg"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-6 flex items-center">
            <Server className="w-6 h-6 mr-2" />
            Métricas do Sistema
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* CPU */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <Cpu className="w-5 h-5 text-blue-500 mr-2" />
                  <span className="font-medium">CPU</span>
                </div>
                <span className="text-2xl font-bold">
                  {healthData.system.cpu.usage_percent?.toFixed(1) || '0.0'}%
                </span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div
                  className="bg-blue-600 h-2 rounded-full transition-all duration-500"
                  style={{ width: `${Math.min(100, healthData.system.cpu.usage_percent || 0)}%` }}
                ></div>
              </div>
            </div>

            {/* Memória */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <MemoryStick className="w-5 h-5 text-green-500 mr-2" />
                  <span className="font-medium">Memória</span>
                </div>
                <span className="text-2xl font-bold">
                  {healthData.system.memory.system_usage_percent?.toFixed(1) || '0.0'}%
                </span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div
                  className="bg-green-600 h-2 rounded-full transition-all duration-500"
                  style={{ width: `${Math.min(100, healthData.system.memory.system_usage_percent || 0)}%` }}
                ></div>
              </div>
            </div>

            {/* Load Average */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <TrendingUp className="w-5 h-5 text-purple-500 mr-2" />
                  <span className="font-medium">Load (1m)</span>
                </div>
                <span className="text-2xl font-bold">
                  {healthData.system.load.load1?.toFixed(2) || '0.00'}
                </span>
              </div>
              <div className="text-sm text-gray-600 dark:text-gray-400">
                5m: {healthData.system.load.load5?.toFixed(2)} | 
                15m: {healthData.system.load.load15?.toFixed(2)}
              </div>
            </div>
          </div>
        </motion.div>
      )}

      {/* Health Checks */}
      {healthData?.checks && (
        <motion.div
          className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-lg"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
        >
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-6 flex items-center">
            <CheckCircle className="w-6 h-6 mr-2" />
            Health Checks
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {Object.entries(healthData.checks).map(([name, check]: [string, any]) => {
              const StatusIcon = getStatusIcon(check.status);
              return (
                <motion.div
                  key={name}
                  className="border border-gray-200 dark:border-gray-700 rounded-lg p-4"
                  whileHover={{ scale: 1.02 }}
                >
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="font-medium text-gray-900 dark:text-white capitalize">
                      {name.replace('_', ' ')}
                    </h3>
                    <StatusIcon className={`w-5 h-5 ${
                      check.status === 'healthy' ? 'text-green-500' :
                      check.status === 'warning' ? 'text-yellow-500' : 'text-red-500'
                    }`} />
                  </div>
                  <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
                    {check.message}
                  </p>
                  <div className="text-xs text-gray-500">
                    {check.duration}ms
                  </div>
                </motion.div>
              );
            })}
          </div>
        </motion.div>
      )}

      {/* Performance Metrics */}
      {metrics && (
        <motion.div
          className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-lg"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
        >
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-6 flex items-center">
            <BarChart3 className="w-6 h-6 mr-2" />
            Performance
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="text-center">
              <div className="text-3xl font-bold text-blue-600 mb-2">
                {metrics.current.avg_response_time}ms
              </div>
              <div className="text-gray-600 dark:text-gray-400 text-sm">
                Tempo Médio de Resposta
              </div>
            </div>

            <div className="text-center">
              <div className="text-3xl font-bold text-green-600 mb-2">
                {metrics.current.requests_per_minute}
              </div>
              <div className="text-gray-600 dark:text-gray-400 text-sm">
                Requests por Minuto
              </div>
            </div>

            <div className="text-center">
              <div className="text-3xl font-bold text-purple-600 mb-2">
                {metrics.historical.response_times.p95}ms
              </div>
              <div className="text-gray-600 dark:text-gray-400 text-sm">
                P95 Response Time
              </div>
            </div>
          </div>

          {/* Alertas de Performance */}
          {Object.values(metrics.alerts).some(alert => alert) && (
            <div className="mt-6 p-4 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg">
              <h3 className="font-medium text-yellow-800 dark:text-yellow-200 mb-2">
                ⚠️ Alertas de Performance
              </h3>
              <div className="space-y-1 text-sm text-yellow-700 dark:text-yellow-300">
                {metrics.alerts.high_response_time && <div>• Tempo de resposta elevado</div>}
                {metrics.alerts.high_error_rate && <div>• Taxa de erro elevada</div>}
                {metrics.alerts.high_memory && <div>• Uso de memória elevado</div>}
                {metrics.alerts.high_cpu && <div>• Uso de CPU elevado</div>}
              </div>
            </div>
          )}
        </motion.div>
      )}

      {/* Alertas Recentes */}
      {alerts.length > 0 && (
        <motion.div
          className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-lg"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
        >
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-6 flex items-center">
            <AlertCircle className="w-6 h-6 mr-2" />
            Alertas Recentes
          </h2>

          <div className="space-y-3">
            {alerts.slice(0, 5).map((alert) => (
              <motion.div
                key={alert._id}
                className="flex items-center justify-between p-4 border border-gray-200 dark:border-gray-700 rounded-lg"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
              >
                <div className="flex-1">
                  <div className="flex items-center space-x-2">
                    <span className={`px-2 py-1 rounded text-xs font-medium ${
                      alert.type === 'critical' ? 'bg-red-100 text-red-800' :
                      alert.type === 'warning' ? 'bg-yellow-100 text-yellow-800' :
                      'bg-blue-100 text-blue-800'
                    }`}>
                      {alert.type}
                    </span>
                    <span className="text-sm text-gray-500">
                      {new Date(alert.createdAt).toLocaleString()}
                    </span>
                  </div>
                  <p className="text-gray-900 dark:text-white mt-1">
                    {alert.message}
                  </p>
                </div>
                
                <div className="flex space-x-2">
                  {!alert.acknowledged && (
                    <button
                      onClick={() => acknowledgeAlert(alert._id)}
                      className="px-3 py-1 bg-blue-100 text-blue-800 rounded text-sm hover:bg-blue-200 transition-colors"
                    >
                      Reconhecer
                    </button>
                  )}
                  {!alert.resolved && (
                    <button
                      onClick={() => resolveAlert(alert._id)}
                      className="px-3 py-1 bg-green-100 text-green-800 rounded text-sm hover:bg-green-200 transition-colors"
                    >
                      Resolver
                    </button>
                  )}
                </div>
              </motion.div>
            ))}
          </div>
        </motion.div>
      )}
    </div>
  );
};

export default MonitoringDashboard;