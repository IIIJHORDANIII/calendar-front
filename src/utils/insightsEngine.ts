/**
 * Sistema de Insights Automáticos
 * Analisa dados do sistema e gera insights inteligentes
 */

import { parseISO, differenceInDays } from 'date-fns';

interface DashboardData {
  totalIgrejas: number;
  totalUsuarios: number;
  totalEventos: number;
  totalDizimos: number;
  eventosProximos: any[];
  dizimosPorIgreja: Array<{ igreja: any; total: number; items: any[] }>;
  sedes: Array<{ igreja: any; total: number; items: any[] }>;
  congregacoes: Array<{ igreja: any; total: number; items: any[] }>;
  membros: any[];
  atividadesRecentes: any[];
}

export interface Insight {
  id: string;
  type: 'success' | 'warning' | 'info' | 'alert' | 'prediction';
  category: 'financial' | 'events' | 'members' | 'growth' | 'performance' | 'prediction';
  title: string;
  description: string;
  value?: number | string;
  trend?: 'up' | 'down' | 'stable';
  priority: 'low' | 'medium' | 'high' | 'critical';
  actionable?: boolean;
  recommendation?: string;
  confidence: number; // 0-100%
}

export class InsightsEngine {
  private data: DashboardData;
  private historicalData?: DashboardData[]; // Para comparações temporais

  constructor(data: DashboardData, historicalData?: DashboardData[]) {
    this.data = data;
    this.historicalData = historicalData;
  }

  // Gerar todos os insights
  generateAllInsights(): Insight[] {
    const insights: Insight[] = [
      ...this.analyzeFinancialInsights(),
      ...this.analyzeEventInsights(),
      ...this.analyzeMemberInsights(),
      ...this.analyzeGrowthInsights(),
      ...this.analyzePerformanceInsights(),
      ...this.generatePredictions()
    ];

    // Ordenar por prioridade e confiança
    return insights.sort((a, b) => {
      const priorityOrder = { critical: 4, high: 3, medium: 2, low: 1 };
      const priorityDiff = priorityOrder[b.priority] - priorityOrder[a.priority];
      
      if (priorityDiff !== 0) return priorityDiff;
      return b.confidence - a.confidence;
    });
  }

  // Insights Financeiros
  private analyzeFinancialInsights(): Insight[] {
    const insights: Insight[] = [];
    
    // Análise de concentração de dízimos
    const totalDizimos = this.data.totalDizimos;
    const igrejaComMaiorDizimo = this.data.dizimosPorIgreja
      .sort((a, b) => b.total - a.total)[0];
    
    if (igrejaComMaiorDizimo && this.data.dizimosPorIgreja.length > 1) {
      const percentual = (igrejaComMaiorDizimo.total / totalDizimos) * 100;
      
      if (percentual > 60) {
        insights.push({
          id: 'financial_concentration_high',
          type: 'warning',
          category: 'financial',
          title: 'Alta Concentração de Dízimos',
          description: `${igrejaComMaiorDizimo.igreja.nome} representa ${percentual.toFixed(1)}% dos dízimos totais`,
          value: `${percentual.toFixed(1)}%`,
          trend: 'stable',
          priority: 'medium',
          actionable: true,
          recommendation: 'Considere estratégias para estimular contribuições em outras igrejas',
          confidence: 85
        });
      }
    }

    // Meta de dízimos
    const metaMensal = 50000; // Configurável
    const mediaMensal = totalDizimos / 12; // Assumindo dados anuais
    
    if (mediaMensal < metaMensal * 0.8) {
      insights.push({
        id: 'financial_below_target',
        type: 'alert',
        category: 'financial',
        title: 'Arrecadação Abaixo da Meta',
        description: `Média mensal de R$ ${mediaMensal.toLocaleString('pt-BR')} está 20% abaixo da meta`,
        value: `R$ ${mediaMensal.toLocaleString('pt-BR')}`,
        trend: 'down',
        priority: 'high',
        actionable: true,
        recommendation: 'Revisar estratégias de arrecadação e engajamento dos membros',
        confidence: 90
      });
    } else if (mediaMensal > metaMensal * 1.1) {
      insights.push({
        id: 'financial_above_target',
        type: 'success',
        category: 'financial',
        title: 'Meta de Arrecadação Superada',
        description: `Média mensal de R$ ${mediaMensal.toLocaleString('pt-BR')} supera a meta em ${((mediaMensal / metaMensal - 1) * 100).toFixed(1)}%`,
        value: `+${((mediaMensal / metaMensal - 1) * 100).toFixed(1)}%`,
        trend: 'up',
        priority: 'low',
        actionable: false,
        confidence: 95
      });
    }

    // Análise de sazonalidade (se houver dados históricos)
    if (this.historicalData && this.historicalData.length >= 3) {
      const tendencia = this.calculateFinancialTrend();
      if (tendencia.isSignificant) {
        insights.push({
          id: 'financial_trend',
          type: tendencia.direction === 'up' ? 'success' : 'warning',
          category: 'financial',
          title: `Tendência ${tendencia.direction === 'up' ? 'Crescente' : 'Decrescente'} nos Dízimos`,
          description: `Variação de ${tendencia.percentage}% nos últimos ${this.historicalData.length} períodos`,
          trend: tendencia.direction,
          priority: Math.abs(tendencia.percentage) > 15 ? 'high' : 'medium',
          actionable: tendencia.direction === 'down',
          recommendation: tendencia.direction === 'down' 
            ? 'Investigar causas da queda e implementar ações corretivas'
            : 'Manter estratégias atuais que estão funcionando',
          confidence: tendencia.confidence
        });
      }
    }

    return insights;
  }

  // Insights de Eventos
  private analyzeEventInsights(): Insight[] {
    const insights: Insight[] = [];
    
    const hoje = new Date();
    const proximosSete = this.data.eventosProximos.filter(evento => {
      const dataEvento = parseISO(evento.data);
      return differenceInDays(dataEvento, hoje) <= 7 && dataEvento >= hoje;
    });

    const proximosTrinta = this.data.eventosProximos.filter(evento => {
      const dataEvento = parseISO(evento.data);
      return differenceInDays(dataEvento, hoje) <= 30 && dataEvento >= hoje;
    });

    // Eventos próximos
    if (proximosSete.length > 5) {
      insights.push({
        id: 'events_busy_week',
        type: 'info',
        category: 'events',
        title: 'Semana Intensa de Eventos',
        description: `${proximosSete.length} eventos programados para os próximos 7 dias`,
        value: proximosSete.length,
        priority: 'medium',
        actionable: true,
        recommendation: 'Verificar recursos necessários e possíveis conflitos de agenda',
        confidence: 100
      });
    }

    if (proximosTrinta.length === 0) {
      insights.push({
        id: 'events_no_upcoming',
        type: 'warning',
        category: 'events',
        title: 'Calendário Vazio',
        description: 'Nenhum evento programado para os próximos 30 dias',
        priority: 'high',
        actionable: true,
        recommendation: 'Planejar e programar atividades para manter engajamento da comunidade',
        confidence: 100
      });
    }

    // Análise de distribuição de eventos
    const eventosPorTipo = this.data.eventosProximos.reduce((acc, evento) => {
      acc[evento.tipo] = (acc[evento.tipo] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    const tipoMaisComum = Object.entries(eventosPorTipo)
      .sort(([,a], [,b]) => (b as number) - (a as number))[0];

    if (tipoMaisComum && (tipoMaisComum[1] as number) > this.data.totalEventos * 0.6) {
      insights.push({
        id: 'events_type_concentration',
        type: 'info',
        category: 'events',
        title: 'Concentração em Tipo de Evento',
        description: `${tipoMaisComum[1]} de ${this.data.totalEventos} eventos são do tipo "${tipoMaisComum[0]}"`,
        value: `${(((tipoMaisComum[1] as number) / this.data.totalEventos) * 100).toFixed(1)}%`,
        priority: 'low',
        actionable: true,
        recommendation: 'Considere diversificar os tipos de eventos para atender diferentes públicos',
        confidence: 80
      });
    }

    return insights;
  }

  // Insights de Membros
  private analyzeMemberInsights(): Insight[] {
    const insights: Insight[] = [];
    
    const totalMembros = this.data.membros.length;
    const totalIgrejas = this.data.totalIgrejas;
    const mediaMembros = totalMembros / totalIgrejas;

    // Distribuição de membros
    const membrosSedeVsCongregacao = {
      sede: this.data.sedes.reduce((sum, sede) => sum + sede.items.length, 0),
      congregacao: this.data.congregacoes.reduce((sum, cong) => sum + cong.items.length, 0)
    };

    if (membrosSedeVsCongregacao.sede < membrosSedeVsCongregacao.congregacao) {
      insights.push({
        id: 'members_congregation_larger',
        type: 'info',
        category: 'members',
        title: 'Congregações Maiores que Sedes',
        description: `Congregações têm ${membrosSedeVsCongregacao.congregacao} membros vs ${membrosSedeVsCongregacao.sede} em sedes`,
        priority: 'low',
        actionable: false,
        confidence: 100
      });
    }

    // Meta de crescimento de membros
    const metaCrescimento = 0.05; // 5% ao mês
    if (this.historicalData && this.historicalData.length >= 2) {
      const crescimentoMembros = this.calculateMemberGrowth();
      
      if (crescimentoMembros.rate < metaCrescimento) {
        insights.push({
          id: 'members_low_growth',
          type: 'warning',
          category: 'growth',
          title: 'Crescimento de Membros Baixo',
          description: `Taxa de crescimento de ${(crescimentoMembros.rate * 100).toFixed(1)}% está abaixo da meta de ${(metaCrescimento * 100)}%`,
          value: `${(crescimentoMembros.rate * 100).toFixed(1)}%`,
          trend: 'down',
          priority: 'medium',
          actionable: true,
          recommendation: 'Implementar estratégias de evangelismo e retenção de membros',
          confidence: 85
        });
      }
    }

    // Igreja com mais membros por dízimo (eficiência)
    const eficienciaPorIgreja = this.data.dizimosPorIgreja
      .map(igreja => {
        const membrosIgreja = this.data.membros.filter(m => m.igreja === igreja.igreja._id).length;
        return {
          igreja: igreja.igreja.nome,
          eficiencia: membrosIgreja > 0 ? igreja.total / membrosIgreja : 0,
          membros: membrosIgreja,
          dizimos: igreja.total
        };
      })
      .filter(i => i.membros > 0)
      .sort((a, b) => b.eficiencia - a.eficiencia);

    if (eficienciaPorIgreja.length > 1) {
      const maisEficiente = eficienciaPorIgreja[0];
      const menosEficiente = eficienciaPorIgreja[eficienciaPorIgreja.length - 1];
      
      if (maisEficiente.eficiencia > menosEficiente.eficiencia * 2) {
        insights.push({
          id: 'members_efficiency_gap',
          type: 'info',
          category: 'performance',
          title: 'Diferença na Contribuição por Membro',
          description: `${maisEficiente.igreja} tem contribuição média 2x maior que ${menosEficiente.igreja}`,
          priority: 'medium',
          actionable: true,
          recommendation: 'Analisar boas práticas da igreja mais eficiente e aplicar em outras unidades',
          confidence: 90
        });
      }
    }

    return insights;
  }

  // Insights de Crescimento
  private analyzeGrowthInsights(): Insight[] {
    const insights: Insight[] = [];
    
    if (!this.historicalData || this.historicalData.length < 3) {
      return insights;
    }

    // Crescimento geral do sistema
    const crescimentoGeral = this.calculateOverallGrowth();
    
    if (crescimentoGeral.igrejas > 0) {
      insights.push({
        id: 'growth_new_churches',
        type: 'success',
        category: 'growth',
        title: 'Expansão da Rede de Igrejas',
        description: `${crescimentoGeral.igrejas} novas igrejas adicionadas recentemente`,
        value: `+${crescimentoGeral.igrejas}`,
        trend: 'up',
        priority: 'low',
        actionable: false,
        confidence: 100
      });
    }

    // Projeção de crescimento
    const projecao = this.projectGrowth();
    if (projecao.isReliable) {
      insights.push({
        id: 'growth_projection',
        type: 'prediction',
        category: 'prediction',
        title: 'Projeção de Crescimento',
        description: `Baseado na tendência atual, estimativa de ${projecao.projectedMembers} membros em 6 meses`,
        value: `${projecao.projectedMembers} membros`,
        priority: 'low',
        actionable: false,
        confidence: projecao.confidence
      });
    }

    return insights;
  }

  // Insights de Performance
  private analyzePerformanceInsights(): Insight[] {
    const insights: Insight[] = [];
    
    // Razão eventos/igreja
    const eventosPerIgreja = this.data.totalEventos / this.data.totalIgrejas;
    
    if (eventosPerIgreja < 2) {
      insights.push({
        id: 'performance_few_events',
        type: 'warning',
        category: 'performance',
        title: 'Baixa Atividade de Eventos',
        description: `Média de ${eventosPerIgreja.toFixed(1)} eventos por igreja pode indicar baixo engajamento`,
        value: eventosPerIgreja.toFixed(1),
        priority: 'medium',
        actionable: true,
        recommendation: 'Incentivar igrejas a organizarem mais atividades comunitárias',
        confidence: 75
      });
    }

    // Usuários ativos vs igrejas
    const usuariosPerIgreja = this.data.totalUsuarios / this.data.totalIgrejas;
    
    if (usuariosPerIgreja < 2) {
      insights.push({
        id: 'performance_low_digital_adoption',
        type: 'alert',
        category: 'performance',
        title: 'Baixa Adoção Digital',
        description: `Apenas ${usuariosPerIgreja.toFixed(1)} usuários por igreja sugere baixo uso do sistema`,
        value: usuariosPerIgreja.toFixed(1),
        priority: 'high',
        actionable: true,
        recommendation: 'Implementar treinamentos e campanhas para aumentar uso do sistema',
        confidence: 90
      });
    }

    return insights;
  }

  // Gerar Predições
  private generatePredictions(): Insight[] {
    const insights: Insight[] = [];
    
    if (!this.historicalData || this.historicalData.length < 4) {
      return insights;
    }

    // Predição de arrecadação
    const predicaoDizimos = this.predictTithes();
    if (predicaoDizimos.confidence > 70) {
      insights.push({
        id: 'prediction_tithes',
        type: 'prediction',
        category: 'prediction',
        title: 'Projeção de Arrecadação',
        description: `Estimativa de R$ ${predicaoDizimos.predicted.toLocaleString('pt-BR')} no próximo mês`,
        value: `R$ ${predicaoDizimos.predicted.toLocaleString('pt-BR')}`,
        trend: predicaoDizimos.trend,
        priority: 'low',
        actionable: false,
        confidence: predicaoDizimos.confidence
      });
    }

    // Detecção de anomalias
    const anomalias = this.detectAnomalies();
    anomalias.forEach(anomalia => {
      insights.push({
        id: `anomaly_${anomalia.type}`,
        type: 'alert',
        category: anomalia.category,
        title: `Anomalia Detectada: ${anomalia.title}`,
        description: anomalia.description,
        priority: 'high',
        actionable: true,
        recommendation: anomalia.recommendation,
        confidence: anomalia.confidence
      });
    });

    return insights;
  }

  // Métodos auxiliares para cálculos
  private calculateFinancialTrend() {
    if (!this.historicalData || this.historicalData.length < 3) {
      return { isSignificant: false, direction: 'stable' as const, percentage: 0, confidence: 0 };
    }

    const values = this.historicalData.map(d => d.totalDizimos);
    const first = values[0];
    const last = values[values.length - 1];
    const percentage = ((last - first) / first) * 100;
    
    return {
      isSignificant: Math.abs(percentage) > 5,
      direction: percentage > 0 ? 'up' as const : 'down' as const,
      percentage: Math.abs(percentage),
      confidence: Math.min(90, Math.abs(percentage) * 5)
    };
  }

  private calculateMemberGrowth() {
    if (!this.historicalData || this.historicalData.length < 2) {
      return { rate: 0, isPositive: false };
    }

    const previous = this.historicalData[this.historicalData.length - 2].membros.length;
    const current = this.data.membros.length;
    const rate = (current - previous) / previous;
    
    return {
      rate,
      isPositive: rate > 0
    };
  }

  private calculateOverallGrowth() {
    if (!this.historicalData || this.historicalData.length < 2) {
      return { igrejas: 0, usuarios: 0, eventos: 0 };
    }

    const previous = this.historicalData[this.historicalData.length - 2];
    
    return {
      igrejas: this.data.totalIgrejas - previous.totalIgrejas,
      usuarios: this.data.totalUsuarios - previous.totalUsuarios,
      eventos: this.data.totalEventos - previous.totalEventos
    };
  }

  private projectGrowth() {
    if (!this.historicalData || this.historicalData.length < 4) {
      return { isReliable: false, projectedMembers: 0, confidence: 0 };
    }

    const memberCounts = this.historicalData.map(d => d.membros.length);
    const avgGrowth = memberCounts.reduce((sum, count, index) => {
      if (index === 0) return sum;
      return sum + (count - memberCounts[index - 1]);
    }, 0) / (memberCounts.length - 1);

    const projectedMembers = Math.round(this.data.membros.length + (avgGrowth * 6));
    const variance = this.calculateVariance(memberCounts);
    const confidence = Math.max(50, 100 - variance * 2);

    return {
      isReliable: confidence > 70,
      projectedMembers,
      confidence: Math.round(confidence)
    };
  }

  private predictTithes() {
    if (!this.historicalData || this.historicalData.length < 3) {
      return { predicted: 0, trend: 'stable' as const, confidence: 0 };
    }

    const values = this.historicalData.map(d => d.totalDizimos);
    const avgGrowth = values.reduce((sum, value, index) => {
      if (index === 0) return sum;
      return sum + (value - values[index - 1]);
    }, 0) / (values.length - 1);

    const predicted = this.data.totalDizimos + avgGrowth;
    const trend = avgGrowth > 0 ? 'up' as const : avgGrowth < 0 ? 'down' as const : 'stable' as const;
    const variance = this.calculateVariance(values);
    const confidence = Math.max(60, 100 - variance / 1000);

    return {
      predicted,
      trend,
      confidence: Math.round(confidence)
    };
  }

  private detectAnomalies() {
    const anomalies: Array<{
      type: string;
      category: 'financial' | 'events' | 'members';
      title: string;
      description: string;
      recommendation: string;
      confidence: number;
    }> = [];

    if (!this.historicalData || this.historicalData.length < 3) {
      return anomalies;
    }

    // Detectar queda abrupta nos dízimos
    const currentTithes = this.data.totalDizimos;
    const avgPreviousTithes = this.historicalData
      .slice(-3)
      .reduce((sum, d) => sum + d.totalDizimos, 0) / 3;

    if (currentTithes < avgPreviousTithes * 0.7) {
      anomalies.push({
        type: 'tithes_drop',
        category: 'financial',
        title: 'Queda Abrupta nos Dízimos',
        description: `Redução de ${(((avgPreviousTithes - currentTithes) / avgPreviousTithes) * 100).toFixed(1)}% em relação à média`,
        recommendation: 'Investigar causas imediatas: mudanças econômicas, eventos especiais, ou problemas operacionais',
        confidence: 95
      });
    }

    // Detectar aumento anormal de eventos
    const currentEvents = this.data.totalEventos;
    const avgPreviousEvents = this.historicalData
      .slice(-3)
      .reduce((sum, d) => sum + d.totalEventos, 0) / 3;

    if (currentEvents > avgPreviousEvents * 2) {
      anomalies.push({
        type: 'events_spike',
        category: 'events',
        title: 'Pico de Eventos',
        description: `Aumento de ${Math.round(((currentEvents - avgPreviousEvents) / avgPreviousEvents) * 100)}% no número de eventos`,
        recommendation: 'Verificar se há recursos suficientes para suportar todos os eventos planejados',
        confidence: 85
      });
    }

    return anomalies;
  }

  private calculateVariance(values: number[]): number {
    const mean = values.reduce((sum, val) => sum + val, 0) / values.length;
    const squaredDiffs = values.map(val => Math.pow(val - mean, 2));
    return squaredDiffs.reduce((sum, diff) => sum + diff, 0) / values.length;
  }
}

// Função helper para gerar insights rápidos
export const generateQuickInsights = (data: DashboardData): Insight[] => {
  const engine = new InsightsEngine(data);
  return engine.generateAllInsights().slice(0, 5); // Top 5 insights
};

// Função para formatar insights para exibição
export const formatInsightForDisplay = (insight: Insight): {
  icon: string;
  color: string;
  badgeColor: string;
} => {
  const typeConfig = {
    success: { icon: '✅', color: 'text-green-600', badgeColor: 'bg-green-100 text-green-800' },
    warning: { icon: '⚠️', color: 'text-yellow-600', badgeColor: 'bg-yellow-100 text-yellow-800' },
    info: { icon: 'ℹ️', color: 'text-blue-600', badgeColor: 'bg-blue-100 text-blue-800' },
    alert: { icon: '🚨', color: 'text-red-600', badgeColor: 'bg-red-100 text-red-800' },
    prediction: { icon: '🔮', color: 'text-purple-600', badgeColor: 'bg-purple-100 text-purple-800' }
  };

  return typeConfig[insight.type];
};

export default InsightsEngine;