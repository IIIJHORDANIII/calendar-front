import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  TrendingUp, 
  TrendingDown, 
  Lightbulb, 
  AlertTriangle, 
  Info, 
  CheckCircle,
  Brain,
  Zap,
  Target,
  X
} from 'lucide-react';
import { generateQuickInsights, formatInsightForDisplay, Insight } from '../utils/insightsEngine';

interface InsightsPanelProps {
  dashboardData: any;
  className?: string;
}

const InsightsPanel: React.FC<InsightsPanelProps> = ({ dashboardData, className = '' }) => {
  const [insights, setInsights] = useState<Insight[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedInsight, setSelectedInsight] = useState<Insight | null>(null);
  const [showAll, setShowAll] = useState(false);

  const generateInsights = useCallback(async () => {
    try {
      setLoading(true);
      const generatedInsights = generateQuickInsights(dashboardData);
      setInsights(generatedInsights);
    } catch (error) {
      console.error('Erro ao gerar insights:', error);
    } finally {
      setLoading(false);
    }
  }, [dashboardData]);

  useEffect(() => {
    if (dashboardData) {
      generateInsights();
    }
  }, [generateInsights]);

  const getInsightIcon = (type: string) => {
    const icons = {
      success: CheckCircle,
      warning: AlertTriangle,
      info: Info,
      alert: AlertTriangle,
      prediction: Brain
    };
    
    const IconComponent = icons[type as keyof typeof icons] || Info;
    return <IconComponent className="w-5 h-5" />;
  };

  const getPriorityColor = (priority: string) => {
    const colors = {
      critical: 'bg-red-500',
      high: 'bg-orange-500',
      medium: 'bg-yellow-500',
      low: 'bg-blue-500'
    };
    return colors[priority as keyof typeof colors] || 'bg-gray-500';
  };

  const displayInsights = showAll ? insights : insights.slice(0, 3);

  if (loading) {
    return (
      <div className={`bg-white dark:bg-gray-800 rounded-xl p-6 border border-gray-200 dark:border-gray-700 ${className}`}>
        <div className="flex items-center space-x-3 mb-4">
          <Lightbulb className="w-6 h-6 text-yellow-500" />
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
            Insights Automáticos
          </h3>
        </div>
        
        <div className="space-y-3">
          {[1, 2, 3].map(i => (
            <div key={i} className="animate-pulse">
              <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-3/4 mb-2"></div>
              <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-full"></div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (insights.length === 0) {
    return (
      <div className={`bg-white dark:bg-gray-800 rounded-xl p-6 border border-gray-200 dark:border-gray-700 ${className}`}>
        <div className="flex items-center space-x-3 mb-4">
          <Lightbulb className="w-6 h-6 text-yellow-500" />
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
            Insights Automáticos
          </h3>
        </div>
        
        <div className="text-center py-8">
          <Brain className="w-12 h-12 text-gray-400 mx-auto mb-3" />
          <p className="text-gray-500 dark:text-gray-400">
            Dados insuficientes para gerar insights
          </p>
        </div>
      </div>
    );
  }

  return (
    <>
      <div className={`bg-white dark:bg-gray-800 rounded-xl p-6 border border-gray-200 dark:border-gray-700 ${className}`}>
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-yellow-100 dark:bg-yellow-900/30 rounded-lg">
              <Lightbulb className="w-6 h-6 text-yellow-600 dark:text-yellow-400" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                Insights Automáticos
              </h3>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                {insights.length} insights detectados
              </p>
            </div>
          </div>
          
          <div className="flex items-center space-x-2">
            <button
              onClick={generateInsights}
              className="p-2 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
              title="Atualizar insights"
            >
              <Zap className="w-4 h-4" />
            </button>
            
            {insights.length > 3 && (
              <button
                onClick={() => setShowAll(!showAll)}
                className="text-sm text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300 font-medium"
              >
                {showAll ? 'Ver menos' : `Ver todos (${insights.length})`}
              </button>
            )}
          </div>
        </div>

        <div className="space-y-3">
          <AnimatePresence>
            {displayInsights.map((insight, index) => {
              const formatting = formatInsightForDisplay(insight);
              
              return (
                <motion.div
                  key={insight.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  transition={{ duration: 0.3, delay: index * 0.1 }}
                  className="group cursor-pointer"
                  onClick={() => setSelectedInsight(insight)}
                >
                  <div className="p-4 border border-gray-200 dark:border-gray-700 rounded-lg hover:border-blue-300 dark:hover:border-blue-600 transition-colors">
                    <div className="flex items-start space-x-3">
                      
                      {/* Indicador de Prioridade */}
                      <div className={`w-2 h-2 rounded-full ${getPriorityColor(insight.priority)} mt-2 flex-shrink-0`}></div>
                      
                      {/* Ícone do Insight */}
                      <div className={`p-1.5 rounded-lg ${formatting.badgeColor} flex-shrink-0`}>
                        {getInsightIcon(insight.type)}
                      </div>
                      
                      {/* Conteúdo */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between">
                          <h4 className={`font-medium ${formatting.color} group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors`}>
                            {insight.title}
                          </h4>
                          
                          {insight.value && (
                            <span className="text-sm font-semibold text-gray-600 dark:text-gray-400">
                              {insight.value}
                            </span>
                          )}
                        </div>
                        
                        <p className="text-sm text-gray-600 dark:text-gray-400 mt-1 line-clamp-2">
                          {insight.description}
                        </p>
                        
                        <div className="flex items-center justify-between mt-2">
                          <div className="flex items-center space-x-2">
                            <span className={`px-2 py-1 text-xs rounded-full ${formatting.badgeColor}`}>
                              {insight.category}
                            </span>
                            
                            {insight.trend && (
                              <div className="flex items-center space-x-1">
                                {insight.trend === 'up' ? (
                                  <TrendingUp className="w-3 h-3 text-green-500" />
                                ) : insight.trend === 'down' ? (
                                  <TrendingDown className="w-3 h-3 text-red-500" />
                                ) : null}
                              </div>
                            )}
                          </div>
                          
                          <div className="flex items-center space-x-2">
                            {insight.actionable && (
                              <Target className="w-3 h-3 text-orange-500" />
                            )}
                            
                            <span className="text-xs text-gray-400">
                              {insight.confidence}% confiança
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </AnimatePresence>
        </div>

        {insights.length === 0 && (
          <div className="text-center py-6">
            <Brain className="w-12 h-12 text-gray-400 mx-auto mb-3" />
            <p className="text-gray-500 dark:text-gray-400">
              Nenhum insight disponível no momento
            </p>
          </div>
        )}
      </div>

      {/* Modal de Detalhes do Insight */}
      <AnimatePresence>
        {selectedInsight && (
          <motion.div
            className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setSelectedInsight(null)}
          >
            <motion.div
              className="bg-white dark:bg-gray-800 rounded-xl p-6 max-w-2xl w-full max-h-[80vh] overflow-y-auto"
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center space-x-3">
                  <div className={`p-2 rounded-lg ${formatInsightForDisplay(selectedInsight).badgeColor}`}>
                    {getInsightIcon(selectedInsight.type)}
                  </div>
                  <div>
                    <h2 className="text-xl font-bold text-gray-900 dark:text-white">
                      {selectedInsight.title}
                    </h2>
                    <div className="flex items-center space-x-2 mt-1">
                      <span className={`px-2 py-1 text-xs rounded-full ${formatInsightForDisplay(selectedInsight).badgeColor}`}>
                        {selectedInsight.category}
                      </span>
                      <span className={`px-2 py-1 text-xs rounded-full text-white ${getPriorityColor(selectedInsight.priority)}`}>
                        {selectedInsight.priority}
                      </span>
                    </div>
                  </div>
                </div>
                
                <button
                  onClick={() => setSelectedInsight(null)}
                  className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="space-y-4">
                <div>
                  <h3 className="font-semibold text-gray-900 dark:text-white mb-2">
                    Descrição
                  </h3>
                  <p className="text-gray-600 dark:text-gray-400">
                    {selectedInsight.description}
                  </p>
                </div>

                {selectedInsight.value && (
                  <div>
                    <h3 className="font-semibold text-gray-900 dark:text-white mb-2">
                      Valor
                    </h3>
                    <p className="text-lg font-bold text-blue-600 dark:text-blue-400">
                      {selectedInsight.value}
                    </p>
                  </div>
                )}

                {selectedInsight.recommendation && (
                  <div>
                    <h3 className="font-semibold text-gray-900 dark:text-white mb-2">
                      Recomendação
                    </h3>
                    <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg border-l-4 border-blue-500">
                      <p className="text-blue-800 dark:text-blue-300">
                        {selectedInsight.recommendation}
                      </p>
                    </div>
                  </div>
                )}

                <div className="grid grid-cols-2 gap-4 pt-4 border-t border-gray-200 dark:border-gray-700">
                  <div>
                    <h4 className="font-medium text-gray-900 dark:text-white mb-1">
                      Confiança
                    </h4>
                    <div className="flex items-center space-x-2">
                      <div className="flex-1 bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                        <div 
                          className="bg-blue-500 h-2 rounded-full transition-all duration-300"
                          style={{ width: `${selectedInsight.confidence}%` }}
                        ></div>
                      </div>
                      <span className="text-sm font-medium text-gray-600 dark:text-gray-400">
                        {selectedInsight.confidence}%
                      </span>
                    </div>
                  </div>

                  <div>
                    <h4 className="font-medium text-gray-900 dark:text-white mb-1">
                      Ação Necessária
                    </h4>
                    <span className={`px-2 py-1 text-xs rounded-full ${
                      selectedInsight.actionable 
                        ? 'bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-400'
                        : 'bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-400'
                    }`}>
                      {selectedInsight.actionable ? 'Sim' : 'Não'}
                    </span>
                  </div>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
};

export default InsightsPanel;