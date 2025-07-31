import jsPDF from 'jspdf';
import 'jspdf-autotable';
import html2canvas from 'html2canvas';

// Estender o tipo jsPDF para incluir autoTable
declare module 'jspdf' {
  interface jsPDF {
    autoTable: (options: any) => jsPDF;
  }
}

interface ReportConfig {
  title: string;
  subtitle?: string;
  logoUrl?: string;
  churchName?: string;
  period?: string;
  author?: string;
  date?: string;
}

interface TableData {
  headers: string[];
  rows: any[][];
}

interface ChartConfig {
  elementId: string;
  title: string;
  width?: number;
  height?: number;
}

class PDFGenerator {
  private doc: jsPDF;
  private pageHeight: number;
  private pageWidth: number;
  private currentY: number;
  private config: ReportConfig;

  constructor(config: ReportConfig) {
    this.doc = new jsPDF();
    this.pageHeight = this.doc.internal.pageSize.height;
    this.pageWidth = this.doc.internal.pageSize.width;
    this.currentY = 20;
    this.config = config;
  }

  // Adicionar cabeçalho da igreja
  private addHeader(): void {
    const centerX = this.pageWidth / 2;

    // Logo (se fornecido)
    if (this.config.logoUrl) {
      // Placeholder para logo - em produção, você carregaria a imagem
      this.doc.setFillColor(59, 130, 246); // Azul
      this.doc.circle(30, 30, 10, 'F');
    }

    // Nome da igreja
    if (this.config.churchName) {
      this.doc.setFontSize(16);
      this.doc.setFont('helvetica', 'bold');
      this.doc.text(this.config.churchName, centerX, 25, { align: 'center' });
    }

    // Título do relatório
    this.doc.setFontSize(20);
    this.doc.setFont('helvetica', 'bold');
    this.doc.text(this.config.title, centerX, 40, { align: 'center' });

    // Subtítulo
    if (this.config.subtitle) {
      this.doc.setFontSize(12);
      this.doc.setFont('helvetica', 'normal');
      this.doc.text(this.config.subtitle, centerX, 50, { align: 'center' });
    }

    // Período
    if (this.config.period) {
      this.doc.setFontSize(10);
      this.doc.setFont('helvetica', 'italic');
      this.doc.text(`Período: ${this.config.period}`, centerX, 60, { align: 'center' });
    }

    // Linha separadora
    this.doc.setLineWidth(0.5);
    this.doc.line(20, 70, this.pageWidth - 20, 70);

    this.currentY = 80;
  }

  // Adicionar rodapé
  private addFooter(): void {
    const footerY = this.pageHeight - 20;
    
    // Data e autor
    this.doc.setFontSize(8);
    this.doc.setFont('helvetica', 'normal');
    
    const date = this.config.date || new Date().toLocaleDateString('pt-BR');
    const author = this.config.author || 'Sistema de Gestão Eclesiástica';
    
    this.doc.text(`Gerado em: ${date}`, 20, footerY);
    this.doc.text(`Por: ${author}`, 20, footerY + 10);
    
    // Número da página
    const pageNumber = this.doc.getCurrentPageInfo().pageNumber;
    this.doc.text(`Página ${pageNumber}`, this.pageWidth - 40, footerY, { align: 'right' });
    
    // Linha superior do rodapé
    this.doc.setLineWidth(0.3);
    this.doc.line(20, footerY - 5, this.pageWidth - 20, footerY - 5);
  }

  // Verificar se precisa de nova página
  private checkPageBreak(neededSpace: number): void {
    if (this.currentY + neededSpace > this.pageHeight - 40) {
      this.doc.addPage();
      this.currentY = 20;
    }
  }

  // Adicionar título de seção
  addSectionTitle(title: string): void {
    this.checkPageBreak(30);
    
    this.doc.setFontSize(14);
    this.doc.setFont('helvetica', 'bold');
    this.doc.text(title, 20, this.currentY);
    
    // Linha abaixo do título
    this.doc.setLineWidth(0.3);
    this.doc.line(20, this.currentY + 3, this.pageWidth - 20, this.currentY + 3);
    
    this.currentY += 15;
  }

  // Adicionar parágrafo de texto
  addParagraph(text: string): void {
    this.checkPageBreak(20);
    
    this.doc.setFontSize(11);
    this.doc.setFont('helvetica', 'normal');
    
    const lines = this.doc.splitTextToSize(text, this.pageWidth - 40);
    this.doc.text(lines, 20, this.currentY);
    
    this.currentY += lines.length * 5 + 10;
  }

  // Adicionar lista com bullets
  addBulletList(items: string[]): void {
    this.checkPageBreak(items.length * 8 + 10);
    
    this.doc.setFontSize(11);
    this.doc.setFont('helvetica', 'normal');
    
    items.forEach(item => {
      this.doc.text('•', 25, this.currentY);
      this.doc.text(item, 30, this.currentY);
      this.currentY += 8;
    });
    
    this.currentY += 5;
  }

  // Adicionar tabela
  addTable(data: TableData, title?: string): void {
    if (title) {
      this.addSectionTitle(title);
    }

    this.checkPageBreak(50);

    this.doc.autoTable({
      head: [data.headers],
      body: data.rows,
      startY: this.currentY,
      theme: 'striped',
      headStyles: {
        fillColor: [59, 130, 246], // Azul
        textColor: [255, 255, 255],
        fontStyle: 'bold'
      },
      styles: {
        fontSize: 10,
        cellPadding: 3
      },
      alternateRowStyles: {
        fillColor: [248, 250, 252] // Cinza claro
      },
      margin: { left: 20, right: 20 }
    });

    this.currentY = (this.doc as any).lastAutoTable.finalY + 15;
  }

  // Adicionar gráfico (captura de tela)
  async addChart(config: ChartConfig): Promise<void> {
    this.checkPageBreak(150);

    const element = document.getElementById(config.elementId);
    if (!element) {
      console.warn(`Elemento com ID ${config.elementId} não encontrado`);
      return;
    }

    try {
      // Capturar o gráfico como imagem
      const canvas = await html2canvas(element, {
        backgroundColor: '#ffffff',
        scale: 2,
        useCORS: true
      });

      const imgData = canvas.toDataURL('image/png');
      
      // Calcular dimensões proporcionais
      const imgWidth = config.width || 160;
      const imgHeight = (canvas.height * imgWidth) / canvas.width;

      // Adicionar título do gráfico
      if (config.title) {
        this.doc.setFontSize(12);
        this.doc.setFont('helvetica', 'bold');
        this.doc.text(config.title, 20, this.currentY);
        this.currentY += 15;
      }

      // Adicionar imagem
      this.doc.addImage(imgData, 'PNG', 20, this.currentY, imgWidth, imgHeight);
      this.currentY += imgHeight + 15;

    } catch (error) {
      console.error('Erro ao capturar gráfico:', error);
      this.addParagraph(`[Erro ao carregar gráfico: ${config.title}]`);
    }
  }

  // Adicionar estatísticas resumidas
  addStatsGrid(stats: Array<{label: string, value: string | number, color?: string}>): void {
    this.checkPageBreak(60);

    const columns = 2;
    const columnWidth = (this.pageWidth - 60) / columns;
    let currentColumn = 0;
    let startY = this.currentY;

    stats.forEach((stat, index) => {
      const x = 20 + (currentColumn * columnWidth);
      const y = startY + Math.floor(index / columns) * 30;

      // Fundo colorido
      if (stat.color) {
        this.doc.setFillColor(stat.color);
        this.doc.roundedRect(x, y - 5, columnWidth - 10, 25, 3, 3, 'F');
      }

      // Label
      this.doc.setFontSize(10);
      this.doc.setFont('helvetica', 'normal');
      this.doc.setTextColor(100, 100, 100);
      this.doc.text(stat.label, x + 5, y + 5);

      // Valor
      this.doc.setFontSize(16);
      this.doc.setFont('helvetica', 'bold');
      this.doc.setTextColor(0, 0, 0);
      this.doc.text(stat.value.toString(), x + 5, y + 15);

      currentColumn = (currentColumn + 1) % columns;
    });

    this.currentY = startY + Math.ceil(stats.length / columns) * 30 + 15;
    this.doc.setTextColor(0, 0, 0); // Reset cor
  }

  // Adicionar insights automáticos
  addInsights(insights: string[]): void {
    this.addSectionTitle('📊 Insights Automáticos');
    
    if (insights.length === 0) {
      this.addParagraph('Nenhum insight disponível para este período.');
      return;
    }

    insights.forEach((insight, index) => {
      this.checkPageBreak(15);
      
      this.doc.setFontSize(11);
      this.doc.setFont('helvetica', 'normal');
      
      // Ícone de insight
      this.doc.setFillColor(52, 211, 153); // Verde
      this.doc.circle(25, this.currentY - 2, 2, 'F');
      
      // Texto do insight
      const lines = this.doc.splitTextToSize(insight, this.pageWidth - 50);
      this.doc.text(lines, 30, this.currentY);
      
      this.currentY += lines.length * 5 + 8;
    });
  }

  // Finalizar PDF
  async generatePDF(): Promise<jsPDF> {
    // Adicionar cabeçalho na primeira página
    this.addHeader();
    
    // Adicionar rodapé em todas as páginas
    const totalPages = this.doc.getNumberOfPages();
    for (let i = 1; i <= totalPages; i++) {
      this.doc.setPage(i);
      this.addFooter();
    }

    return this.doc;
  }

  // Salvar PDF
  async savePDF(filename?: string): Promise<void> {
    const pdf = await this.generatePDF();
    const name = filename || `${this.config.title.replace(/\s+/g, '_')}_${new Date().getTime()}.pdf`;
    pdf.save(name);
  }

  // Obter blob do PDF para upload
  async getPDFBlob(): Promise<Blob> {
    const pdf = await this.generatePDF();
    return pdf.output('blob');
  }
}

// Relatórios pré-configurados
export class ReportTemplates {
  
  // Relatório de Dízimos
  static async generateTithesReport(data: {
    period: string;
    churchName: string;
    totalAmount: number;
    totalContributors: number;
    monthlyData: Array<{month: string, amount: number, contributors: number}>;
    topContributors: Array<{name: string, amount: number}>;
    insights: string[];
  }): Promise<jsPDF> {
    
    const config: ReportConfig = {
      title: 'Relatório de Dízimos e Ofertas',
      subtitle: 'Análise Financeira Detalhada',
      churchName: data.churchName,
      period: data.period,
      author: 'Sistema de Gestão Eclesiástica',
      date: new Date().toLocaleDateString('pt-BR')
    };

    const generator = new PDFGenerator(config);

    // Estatísticas gerais
    generator.addStatsGrid([
      { label: 'Total Arrecadado', value: `R$ ${data.totalAmount.toLocaleString('pt-BR')}`, color: '#059669' },
      { label: 'Total de Contribuintes', value: data.totalContributors, color: '#0284c7' },
      { label: 'Média Mensal', value: `R$ ${(data.totalAmount / data.monthlyData.length).toLocaleString('pt-BR')}`, color: '#7c3aed' },
      { label: 'Média por Contribuinte', value: `R$ ${(data.totalAmount / data.totalContributors).toLocaleString('pt-BR')}`, color: '#dc2626' }
    ]);

    // Tabela mensal
    const monthlyTable: TableData = {
      headers: ['Mês', 'Valor Arrecadado', 'Nº Contribuintes', 'Média por Pessoa'],
      rows: data.monthlyData.map(item => [
        item.month,
        `R$ ${item.amount.toLocaleString('pt-BR')}`,
        item.contributors.toString(),
        `R$ ${(item.amount / item.contributors).toLocaleString('pt-BR')}`
      ])
    };
    generator.addTable(monthlyTable, 'Evolução Mensal');

    // Top contribuintes
    if (data.topContributors.length > 0) {
      const contributorsTable: TableData = {
        headers: ['Contribuinte', 'Valor Total', 'Percentual do Total'],
        rows: data.topContributors.map(item => [
          item.name,
          `R$ ${item.amount.toLocaleString('pt-BR')}`,
          `${((item.amount / data.totalAmount) * 100).toFixed(2)}%`
        ])
      };
      generator.addTable(contributorsTable, 'Principais Contribuintes');
    }

    // Insights
    generator.addInsights(data.insights);

    return await generator.generatePDF();
  }

  // Relatório de Eventos
  static async generateEventsReport(data: {
    period: string;
    churchName: string;
    totalEvents: number;
    completedEvents: number;
    upcomingEvents: number;
    eventsByType: Array<{type: string, count: number}>;
    attendanceData: Array<{event: string, date: string, attendance: number}>;
    insights: string[];
  }): Promise<jsPDF> {
    
    const config: ReportConfig = {
      title: 'Relatório de Eventos',
      subtitle: 'Análise de Atividades e Participação',
      churchName: data.churchName,
      period: data.period,
      author: 'Sistema de Gestão Eclesiástica',
      date: new Date().toLocaleDateString('pt-BR')
    };

    const generator = new PDFGenerator(config);

    // Estatísticas gerais
    generator.addStatsGrid([
      { label: 'Total de Eventos', value: data.totalEvents, color: '#059669' },
      { label: 'Eventos Realizados', value: data.completedEvents, color: '#0284c7' },
      { label: 'Próximos Eventos', value: data.upcomingEvents, color: '#7c3aed' },
      { label: 'Taxa de Conclusão', value: `${((data.completedEvents / data.totalEvents) * 100).toFixed(1)}%`, color: '#dc2626' }
    ]);

    // Eventos por tipo
    const typeTable: TableData = {
      headers: ['Tipo de Evento', 'Quantidade', 'Percentual'],
      rows: data.eventsByType.map(item => [
        item.type,
        item.count.toString(),
        `${((item.count / data.totalEvents) * 100).toFixed(1)}%`
      ])
    };
    generator.addTable(typeTable, 'Eventos por Categoria');

    // Participação
    if (data.attendanceData.length > 0) {
      const attendanceTable: TableData = {
        headers: ['Evento', 'Data', 'Participantes'],
        rows: data.attendanceData.map(item => [
          item.event,
          item.date,
          item.attendance.toString()
        ])
      };
      generator.addTable(attendanceTable, 'Participação em Eventos');
    }

    // Insights
    generator.addInsights(data.insights);

    return await generator.generatePDF();
  }

  // Relatório de Membros
  static async generateMembersReport(data: {
    period: string;
    churchName: string;
    totalMembers: number;
    newMembers: number;
    membersByMinistry: Array<{ministry: string, count: number}>;
    ageDistribution: Array<{ageGroup: string, count: number}>;
    insights: string[];
  }): Promise<jsPDF> {
    
    const config: ReportConfig = {
      title: 'Relatório de Membros',
      subtitle: 'Análise da Congregação',
      churchName: data.churchName,
      period: data.period,
      author: 'Sistema de Gestão Eclesiástica',
      date: new Date().toLocaleDateString('pt-BR')
    };

    const generator = new PDFGenerator(config);

    // Estatísticas gerais
    generator.addStatsGrid([
      { label: 'Total de Membros', value: data.totalMembers, color: '#059669' },
      { label: 'Novos Membros', value: data.newMembers, color: '#0284c7' },
      { label: 'Taxa de Crescimento', value: `${((data.newMembers / data.totalMembers) * 100).toFixed(1)}%`, color: '#7c3aed' },
      { label: 'Ministérios Ativos', value: data.membersByMinistry.length, color: '#dc2626' }
    ]);

    // Membros por ministério
    const ministryTable: TableData = {
      headers: ['Ministério', 'Membros', 'Percentual'],
      rows: data.membersByMinistry.map(item => [
        item.ministry,
        item.count.toString(),
        `${((item.count / data.totalMembers) * 100).toFixed(1)}%`
      ])
    };
    generator.addTable(ministryTable, 'Distribuição por Ministério');

    // Distribuição por idade
    if (data.ageDistribution.length > 0) {
      const ageTable: TableData = {
        headers: ['Faixa Etária', 'Quantidade', 'Percentual'],
        rows: data.ageDistribution.map(item => [
          item.ageGroup,
          item.count.toString(),
          `${((item.count / data.totalMembers) * 100).toFixed(1)}%`
        ])
      };
      generator.addTable(ageTable, 'Distribuição por Idade');
    }

    // Insights
    generator.addInsights(data.insights);

    return await generator.generatePDF();
  }
}

export default PDFGenerator;