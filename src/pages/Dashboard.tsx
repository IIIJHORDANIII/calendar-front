import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { 
  Users, 
  Calendar, 
  DollarSign, 
  Church, 
  FileText, 
  Plus,
  Bell,
  User,
  LogOut,
  TrendingUp,
  TrendingDown,
  Eye,
  EyeOff,
  RefreshCw,
  X,
  CheckCircle,
  AlertCircle,
  Clock,
  Trash2,
  Download,
  Menu,
  Home,
  Users as UsersIcon,
  Building
} from 'lucide-react';
import PastorCard from '../components/PastorCard';
import DiretoriaCard from '../components/DiretoriaCard';
import ThemeToggle from '../components/ThemeToggle';
import { useApi } from '../utils/api';
import jsPDF from 'jspdf';
import 'jspdf-autotable';

interface User {
  _id: string;
  nome: string;
  email: string;
  role: string;
  igreja?: string;
}

interface Igreja {
  _id: string;
  nome: string;
  tipo: string;
  endereco: string;
}

interface Calendario {
  _id: string;
  titulo: string;
  descricao: string;
  data: string;
  igreja: Igreja;
  tipo: string;
}

interface Dizimo {
  _id: string;
  titulo: string;
  descricao: string;
  valor: number;
  tipo: string;
  membro: string;
  igreja: Igreja;
  data: string;
  total?: number; // Adicionado para compatibilidade
}

interface Notificacao {
  _id: string;
  tipo: string;
  acao: string;
  titulo: string;
  descricao: string;
  igreja: Igreja;
  usuario: User;
  itemId: string;
  itemTipo: string;
  lida: boolean;
  createdAt: string;
  updatedAt: string;
}

interface DashboardData {
  totalIgrejas: number;
  totalUsuarios: number;
  totalEventos: number;
  totalDizimos: number;
  eventosProximos: Calendario[];
  atividadesRecentes: any[];
  dizimosPorIgreja: { igreja: Igreja; total: number; items: Dizimo[] }[];
  totalSede: number;
  totalCongregacoes: number;
  totalGeral: number;
  congregacoes: { igreja: Igreja; total: number; items: Dizimo[] }[];
}

const Dashboard: React.FC = () => {
  const navigate = useNavigate();
  const api = useApi();
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [dashboardData, setDashboardData] = useState<DashboardData>({
    totalIgrejas: 0,
    totalUsuarios: 0,
    totalEventos: 0,
    totalDizimos: 0,
    eventosProximos: [],
    atividadesRecentes: [],
    dizimosPorIgreja: [],
    totalSede: 0,
    totalCongregacoes: 0,
    totalGeral: 0,
    congregacoes: []
  });
  const [refreshing, setRefreshing] = useState(false);
  const [showDizimos, setShowDizimos] = useState(false);
  const [showCongregacoes, setShowCongregacoes] = useState(false);
  const [showAtividades, setShowAtividades] = useState(true);
  const [showRelatorioDizimistas, setShowRelatorioDizimistas] = useState(false);
  const [relatorioDizimistas, setRelatorioDizimistas] = useState<any[]>([]);
  const [loadingRelatorio, setLoadingRelatorio] = useState(false);
  const [isDizimoCardClicked, setIsDizimoCardClicked] = useState(false);
  const [isStatsCardClicked, setIsStatsCardClicked] = useState(false);
  
  // Mobile menu states
  const [showMobileMenu, setShowMobileMenu] = useState(false);
  const [currentMobileView, setCurrentMobileView] = useState<'dashboard' | 'pastor' | 'diretoria'>('dashboard');
  
  // Notification states
  const [notificacoes, setNotificacoes] = useState<Notificacao[]>([]);
  const [notificacoesNaoLidas, setNotificacoesNaoLidas] = useState(0);
  const [showNotificacoes, setShowNotificacoes] = useState(false);
  const [loadingNotificacoes, setLoadingNotificacoes] = useState(false);

  useEffect(() => {
    const userData = localStorage.getItem('user');
    if (userData) {
      setUser(JSON.parse(userData));
    }
    fetchDashboardData();
  }, []);

  useEffect(() => {
    if (user?.role === 'admin' || user?.role === 'sede') {
      fetchNotificacoes();
      fetchNotificacoesNaoLidas();
    }
  }, [user?.role]);

  // Close notifications when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Element;
      if (showNotificacoes && !target.closest('.notification-dropdown')) {
        setShowNotificacoes(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [showNotificacoes]);

  const fetchDashboardData = async () => {
    try {
      // Buscar dados das igrejas (filtrado por permissões)
      const igrejasResponse = await api.get('/igrejas');
      const igrejas = await igrejasResponse.ok ? await igrejasResponse.json() : [];
      console.log('Igrejas recebidas do backend:', igrejas);

      // Buscar dados dos usuários (filtrado por permissões)
      const usuariosResponse = await api.get('/auth/users');
      const usuarios = usuariosResponse.ok ? await usuariosResponse.json() : [];

      // Buscar eventos de calendário (filtrado por permissões)
      const calendarioResponse = await api.get('/evento');
      const calendarios = await calendarioResponse.ok ? await calendarioResponse.json() : [];

      // Buscar dízimos (filtrado por permissões)
      const dizimosResponse = await api.get('/dizimo');
      const dizimos = await dizimosResponse.ok ? await dizimosResponse.json() : [];
      console.log('Dízimos recebidos do backend:', dizimos);

      // Filtrar eventos futuros (a partir de hoje)
      const hoje = new Date();
      const eventosProximos = calendarios
        .filter((evento: Calendario) => {
          const eventoData = new Date(evento.data);
          return eventoData >= hoje;
        })
        .sort((a: Calendario, b: Calendario) => new Date(a.data).getTime() - new Date(b.data).getTime())
        .slice(0, 5);

      // Organizar dízimos por igreja
      const dizimosPorIgreja = igrejas.map((igreja: Igreja) => {
        const dizimosIgreja = dizimos.filter((dizimo: any) => dizimo.igreja && String(dizimo.igreja._id) === String(igreja._id));
        const total = dizimosIgreja.reduce((sum: number, dizimo: any) => {
          // Usar a estrutura correta do modelo DizimoOferta
          return sum + (dizimo.total || dizimo.valorDizimos || dizimo.valor || 0);
        }, 0);
        return {
          igreja,
          total,
          items: dizimosIgreja
        };
      });
      console.log('Dízimos por igreja:', dizimosPorIgreja);

      // Separar sede e congregações
      const sede = dizimosPorIgreja.find((d: any) => d.igreja.tipo === 'sede');
      const congregacoes = dizimosPorIgreja.filter((d: any) => d.igreja.tipo === 'congregacao');
      const totalSede = sede ? sede.total : 0;
      const totalCongregacoes = congregacoes.reduce((sum: number, c: any) => sum + c.total, 0);
      
      // Para congregações, o total geral é apenas o total da própria congregação
      let totalGeral;
      if (user?.role === 'congregacao') {
        const propriaCongregacao = congregacoes.find((c: any) => c.igreja._id === user.igreja);
        totalGeral = propriaCongregacao ? propriaCongregacao.total : 0;
      } else {
        totalGeral = totalSede + totalCongregacoes;
      }

      // Criar atividades recentes simuladas
      const atividadesRecentes = [
        { type: 'church', message: `${igrejas.length} igrejas cadastradas no sistema`, time: 'Agora' },
        { type: 'event', message: `${calendarios.length} eventos programados`, time: 'Agora' },
        { type: 'user', message: `${usuarios.length} usuários ativos`, time: 'Agora' },
        { type: 'dizimo', message: `R$ ${user?.role === 'congregacao' 
          ? dizimos.filter((d: any) => d.igreja && String(d.igreja._id) === String(user.igreja))
              .reduce((sum: number, d: any) => sum + (d.total || d.valorDizimos || d.valor || 0), 0).toFixed(2)
          : dizimos.reduce((sum: number, d: any) => sum + (d.total || d.valorDizimos || d.valor || 0), 0).toFixed(2)} em dízimos`, time: 'Agora' }
      ];

      setDashboardData({
        totalIgrejas: igrejas.length,
        totalUsuarios: usuarios.length,
        totalEventos: calendarios.length,
        totalDizimos: user?.role === 'congregacao' 
          ? dizimos.filter((d: any) => d.igreja && String(d.igreja._id) === String(user.igreja))
              .reduce((sum: number, d: any) => sum + (d.total || d.valorDizimos || d.valor || 0), 0)
          : dizimos.reduce((sum: number, d: any) => sum + (d.total || d.valorDizimos || d.valor || 0), 0),
        eventosProximos,
        atividadesRecentes: [
          { type: 'church', message: `${igrejas.length} igrejas cadastradas no sistema`, time: 'Agora' },
          { type: 'event', message: `${calendarios.length} eventos programados`, time: 'Agora' },
          { type: 'user', message: `${usuarios.length} usuários ativos`, time: 'Agora' },
          { type: 'dizimo', message: `R$ ${user?.role === 'congregacao' 
            ? dizimos.filter((d: any) => d.igreja && String(d.igreja._id) === String(user.igreja))
                .reduce((sum: number, d: any) => sum + (d.total || d.valorDizimos || d.valor || 0), 0).toFixed(2)
            : dizimos.reduce((sum: number, d: any) => sum + (d.total || d.valorDizimos || d.valor || 0), 0).toFixed(2)} em dízimos`, time: 'Agora' }
        ],
        dizimosPorIgreja,
        totalSede,
        totalCongregacoes,
        totalGeral,
        congregacoes
      });

    } catch (error) {
      console.error('Erro ao buscar dados:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchNotificacoes = async () => {
    try {
      const response = await api.get('/notificacao');
      if (response.ok) {
        const data = await response.json();
        setNotificacoes(data);
      }
    } catch (error) {
      console.error('Erro ao buscar notificações:', error);
    }
  };

  const fetchNotificacoesNaoLidas = async () => {
    try {
      const response = await api.get('/notificacao/nao-lidas');
      if (response.ok) {
        const data = await response.json();
        setNotificacoesNaoLidas(data.count);
      }
    } catch (error) {
      console.error('Erro ao buscar notificações não lidas:', error);
    }
  };

  const marcarComoLida = async (notificacaoId: string) => {
    try {
      const response = await api.put(`/notificacao/${notificacaoId}/ler`);
      if (response.ok) {
        // Update local state
        setNotificacoes(prev => prev.map(n => 
          n._id === notificacaoId ? { ...n, lida: true } : n
        ));
        setNotificacoesNaoLidas(prev => Math.max(0, prev - 1));
      }
    } catch (error) {
      console.error('Erro ao marcar notificação como lida:', error);
    }
  };

  const marcarTodasComoLidas = async () => {
    try {
      const response = await api.put('/notificacao/ler-todas');
      if (response.ok) {
        setNotificacoes(prev => prev.map(n => ({ ...n, lida: true })));
        setNotificacoesNaoLidas(0);
      }
    } catch (error) {
      console.error('Erro ao marcar todas como lidas:', error);
    }
  };

  const deletarNotificacao = async (notificacaoId: string) => {
    try {
      const response = await api.delete(`/notificacao/${notificacaoId}`);
      if (response.ok) {
        setNotificacoes(prev => prev.filter(n => n._id !== notificacaoId));
        // Update unread count if notification was unread
        const notificacao = notificacoes.find(n => n._id === notificacaoId);
        if (notificacao && !notificacao.lida) {
          setNotificacoesNaoLidas(prev => Math.max(0, prev - 1));
        }
      }
    } catch (error) {
      console.error('Erro ao deletar notificação:', error);
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    
    try {
      // Fetch fresh data
      const [igrejasResponse, usuariosResponse, calendarioResponse, dizimosResponse] = await Promise.all([
        api.get('/igrejas'),
        api.get('/auth/users'),
        api.get('/evento'),
        api.get('/dizimo')
      ]);

      const [igrejas, usuarios, calendarios, dizimos] = await Promise.all([
        igrejasResponse.ok ? igrejasResponse.json() : [],
        usuariosResponse.ok ? usuariosResponse.json() : [],
        calendarioResponse.ok ? calendarioResponse.json() : [],
        dizimosResponse.ok ? dizimosResponse.json() : []
      ]);

      // Check for changes by comparing with current data
      const hasChanges = 
        igrejas.length !== dashboardData.totalIgrejas ||
        usuarios.length !== dashboardData.totalUsuarios ||
        calendarios.length !== dashboardData.totalEventos ||
        dizimos.length !== dashboardData.dizimosPorIgreja.reduce((sum, d) => sum + d.items.length, 0);

      if (hasChanges) {
        // If there are changes, reload the entire page
        window.location.reload();
      } else {
        // If no changes, just refresh the data normally
        await fetchDashboardData();
      }
    } catch (error) {
      console.error('Erro ao verificar mudanças:', error);
      // Fallback to normal refresh
      await fetchDashboardData();
    } finally {
      setRefreshing(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    navigate('/login');
  };

  const handleQuickAction = (action: string) => {
    switch (action) {
      case 'igreja':
        navigate('/churches');
        break;
      case 'evento':
        navigate('/events');
        break;
      case 'dizimo':
        navigate('/tithes');
        break;
      case 'membro':
        navigate('/members');
        break;
      case 'relatorio-dizimistas':
        fetchRelatorioDizimistas();
        break;
    }
  };

  const fetchRelatorioDizimistas = async () => {
    setLoadingRelatorio(true);
    try {
      // Buscar dízimos (já filtrados pela API baseado no papel do usuário)
      const dizimosResponse = await api.get('/dizimo');
      const dizimos = dizimosResponse.ok ? await dizimosResponse.json() : [];

      // Buscar membros para mapear IDs para nomes
      const membrosResponse = await api.get('/membro');
      const membros = membrosResponse.ok ? await membrosResponse.json() : [];

      console.log('Dízimos recebidos (filtrados por permissão):', dizimos);
      console.log('Membros recebidos:', membros);

      // Criar mapa de IDs para nomes de membros
      const membrosMap = new Map();
      membros.forEach((membro: any) => {
        membrosMap.set(membro._id, membro.nome);
      });

      // Processar dados para criar relatório
      const relatorio = dizimos.map((dizimo: any) => {
        // Se a igreja já está populada, usar diretamente
        const igreja = dizimo.igreja;
        
        // Determinar o nome do membro
        let nomeMembro = 'Anônimo';
        if (dizimo.membro) {
          // Verificar se é um ID válido do MongoDB
          if (/^[a-f0-9]{24}$/i.test(dizimo.membro)) {
            // É um ID, buscar o nome no mapa
            nomeMembro = membrosMap.get(dizimo.membro) || 'Membro não encontrado';
          } else {
            // É um nome direto
            nomeMembro = dizimo.membro;
          }
        }
        
        return {
          nome: nomeMembro,
          valor: dizimo.valorDizimos || dizimo.valor || 0,
          data: dizimo.createdAt || dizimo.data || new Date().toISOString(),
          congregacao: igreja ? igreja.nome : 'Igreja não encontrada',
          tipo: igreja ? igreja.tipo : 'N/A'
        };
      }).filter((item: any) => item.valor > 0) // Filtrar apenas dízimos com valor
        .sort((a: any, b: any) => new Date(b.data).getTime() - new Date(a.data).getTime()); // Ordenar por data mais recente

      console.log('Relatório final (filtrado por permissão):', relatorio);
      setRelatorioDizimistas(relatorio);
      setShowRelatorioDizimistas(true);
    } catch (error) {
      console.error('Erro ao buscar relatório de dizimistas:', error);
    } finally {
      setLoadingRelatorio(false);
    }
  };

    const gerarPDF = async () => {
    if (relatorioDizimistas.length === 0) return;

    // Criar PDF em formato A4
    const doc = new jsPDF('p', 'mm', 'a4');
    
    // Configurações de estilo para A4
    const pageWidth = doc.internal.pageSize.width;
    const pageHeight = doc.internal.pageSize.height;
    const margin = 20;
    const contentWidth = pageWidth - (margin * 2);
    
    // Cores do tema - versão sóbria
    const primaryColor = [41, 128, 185] as const; // Azul mais escuro
    const secondaryColor = [27, 79, 114] as const; // Verde azulado escuro
    const darkColor = [52, 73, 94] as const; // Cinza azulado escuro
    const lightGray = [245, 246, 250] as const; // Cinza muito claro
    const textGray = [149, 165, 166] as const; // Cinza texto mais escuro
    
    // Cabeçalho com logo/ícone
    doc.setFillColor(primaryColor[0], primaryColor[1], primaryColor[2]);
    doc.rect(0, 0, pageWidth, 45, 'F');
    
    // Título principal
    doc.setFontSize(26);
    doc.setTextColor(255, 255, 255);
    doc.setFont('helvetica', 'bold');
    doc.text('Relatório de Dizimistas', pageWidth / 2, 28, { align: 'center' });
    
    // Data e hora do relatório
    doc.setFontSize(10);
    doc.setTextColor(255, 255, 255);
    doc.setFont('helvetica', 'normal');
    const dataAtual = new Date().toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
    const horaAtual = new Date().toLocaleTimeString('pt-BR', {
      hour: '2-digit',
      minute: '2-digit'
    });
    doc.text(`Gerado em: ${dataAtual} às ${horaAtual}`, pageWidth / 2, 38, { align: 'center' });

    // Posição inicial para os blocos por matriz
    let currentY = 35;
    // Definir larguras das colunas otimizadas (sem a coluna tipo)
    const colWidths = {
      nome: 80,
      congregacao: 30,
      valor: 35,
      data: 30
    };
    // Calcular posições das colunas com espaçamento mínimo
    const colPositions = {
      nome: margin + 2,
      congregacao: margin + 2 + colWidths.nome + 1,
      valor: margin + 2 + colWidths.nome + 1 + colWidths.congregacao + 1,
      data: margin + 2 + colWidths.nome + 1 + colWidths.congregacao + 1 + colWidths.valor + 1
    };

    console.log('Usuário atual:', user);
    console.log('Role do usuário:', user?.role);
    
    if (user?.role === 'admin') {
      // Buscar todas as igrejas para identificar matrizes
      const igrejasResponse = await api.get('/igrejas');
      const todasIgrejas = igrejasResponse.ok ? await igrejasResponse.json() : [];
      // Filtrar apenas matrizes (sede)
      const matrizes = todasIgrejas.filter((igreja: any) => igreja.tipo === 'sede');
      // Para cada matriz, buscar todos os dízimos relacionados (própria matriz + congregações)
      for (let matrizIndex = 0; matrizIndex < matrizes.length; matrizIndex++) {
        const matriz = matrizes[matrizIndex];
        // Nova página para cada matriz (exceto a primeira)
        if (matrizIndex > 0) {
          doc.addPage();
          currentY = 85;
        } else {
          // Para a primeira matriz, posicionar abaixo do cabeçalho
          currentY = 85;
        }
        // Título da matriz no topo da página
        doc.setFontSize(20);
        doc.setTextColor(primaryColor[0], primaryColor[1], primaryColor[2]);
        doc.setFont('helvetica', 'bold');
        doc.text(matriz.nome, pageWidth / 2, currentY, { align: 'center' });
        currentY += 15;
        // Filtrar dízimos que pertencem a esta matriz (própria matriz + congregações)
        const congregacoesMatriz = todasIgrejas.filter((igreja: any) => igreja.tipo === 'congregacao' && igreja.sede && igreja.sede.toString() === matriz._id.toString());
        let dizimosMatriz = relatorioDizimistas.filter((item: any) => {
          if (item.congregacao === matriz.nome) return true;
          return congregacoesMatriz.some((congregacao: any) => item.congregacao === congregacao.nome);
        });
        // Calcular totais da matriz
        const totalMatriz = dizimosMatriz.reduce((sum: number, item: any) => sum + item.valor, 0);
        const mediaMatriz = dizimosMatriz.length > 0 ? totalMatriz / dizimosMatriz.length : 0;
        // Cards de estatísticas para esta matriz
        const cardWidth = 42;
        const cardSpacing = 5;
        const totalCardsWidth = (cardWidth * 4) + (cardSpacing * 3);
        const startX = margin + (contentWidth - totalCardsWidth) / 2;
        // Card 1: Total de Dizimistas
        doc.setFillColor(primaryColor[0], primaryColor[1], primaryColor[2]);
        doc.roundedRect(startX, currentY, cardWidth, 28, 3, 3, 'F');
        doc.setFontSize(11);
        doc.setTextColor(255, 255, 255);
        doc.setFont('helvetica', 'bold');
        doc.text('Total', startX + cardWidth/2, currentY + 8, { align: 'center' });
        doc.text('Dizimistas', startX + cardWidth/2, currentY + 12, { align: 'center' });
        doc.setFontSize(16);
        doc.text(dizimosMatriz.length.toString(), startX + cardWidth/2, currentY + 22, { align: 'center' });
        // Card 2: Valor Total
        doc.setFillColor(secondaryColor[0], secondaryColor[1], secondaryColor[2]);
        doc.roundedRect(startX + cardWidth + cardSpacing, currentY, cardWidth, 28, 3, 3, 'F');
        doc.setFontSize(11);
        doc.setTextColor(255, 255, 255);
        doc.setFont('helvetica', 'bold');
        doc.text('Valor', startX + cardWidth + cardSpacing + cardWidth/2, currentY + 8, { align: 'center' });
        doc.text('Total', startX + cardWidth + cardSpacing + cardWidth/2, currentY + 12, { align: 'center' });
        doc.setFontSize(10);
        doc.text(`R$ ${totalMatriz.toFixed(2)}`, startX + cardWidth + cardSpacing + cardWidth/2, currentY + 22, { align: 'center' });
        // Card 3: Média por Dizimista
        doc.setFillColor(darkColor[0], darkColor[1], darkColor[2]);
        doc.roundedRect(startX + (cardWidth + cardSpacing) * 2, currentY, cardWidth, 28, 3, 3, 'F');
        doc.setFontSize(10);
        doc.setTextColor(255, 255, 255);
        doc.setFont('helvetica', 'bold');
        doc.text('Média', startX + (cardWidth + cardSpacing) * 2 + cardWidth/2, currentY + 8, { align: 'center' });
        doc.text('por Diz.', startX + (cardWidth + cardSpacing) * 2 + cardWidth/2, currentY + 12, { align: 'center' });
        doc.setFontSize(10);
        doc.text(`R$ ${mediaMatriz.toFixed(2)}`, startX + (cardWidth + cardSpacing) * 2 + cardWidth/2, currentY + 22, { align: 'center' });
        // Card 4: Congregações
        doc.setFillColor(142, 68, 173); // Roxo mais escuro
        doc.roundedRect(startX + (cardWidth + cardSpacing) * 3, currentY, cardWidth, 28, 3, 3, 'F');
        doc.setFontSize(11);
        doc.setTextColor(255, 255, 255);
        doc.setFont('helvetica', 'bold');
        doc.text('Cong.', startX + (cardWidth + cardSpacing) * 3 + cardWidth/2, currentY + 8, { align: 'center' });
        doc.setFontSize(16);
        doc.text(congregacoesMatriz.length.toString(), startX + (cardWidth + cardSpacing) * 3 + cardWidth/2, currentY + 22, { align: 'center' });
        currentY += 40;
        // Título da tabela de detalhamento
        doc.setFontSize(16);
        doc.setTextColor(darkColor[0], darkColor[1], darkColor[2]);
        doc.setFont('helvetica', 'bold');
        doc.text('Detalhamento por Dizimista', margin, currentY);
        currentY += 12;
        // Cabeçalho da tabela para esta matriz
        doc.setFillColor(darkColor[0], darkColor[1], darkColor[2]);
        doc.roundedRect(margin, currentY, contentWidth, 12, 2, 2, 'F');
        doc.setDrawColor(200, 200, 200);
        doc.setLineWidth(0.3);
        doc.line(margin, currentY + 12, pageWidth - margin, currentY + 12);
        doc.setFontSize(10);
        doc.setTextColor(255, 255, 255);
        doc.setFont('helvetica', 'bold');
        doc.text('Nome', colPositions.nome, currentY + 8);
        doc.text('Congregação', colPositions.congregacao, currentY + 8);
        doc.text('Valor (R$)', colPositions.valor, currentY + 8);
        doc.text('Data', colPositions.data, currentY + 8);
        currentY += 14;
        // Dados desta matriz (incluindo congregações)
        dizimosMatriz.forEach((item: any, index: number) => {
          if (currentY > pageHeight - 50) {
            doc.addPage();
            currentY = 35;
            doc.setFillColor(darkColor[0], darkColor[1], darkColor[2]);
            doc.roundedRect(margin, currentY, contentWidth, 12, 2, 2, 'F');
            doc.setDrawColor(200, 200, 200);
            doc.setLineWidth(0.3);
            doc.line(margin, currentY + 12, pageWidth - margin, currentY + 12);
            doc.setFontSize(10);
            doc.setTextColor(255, 255, 255);
            doc.setFont('helvetica', 'bold');
            doc.text('Nome', colPositions.nome, currentY + 8);
            doc.text('Congregação', colPositions.congregacao, currentY + 8);
            doc.text('Valor (R$)', colPositions.valor, currentY + 8);
            doc.text('Data', colPositions.data, currentY + 8);
            currentY += 14;
          }
          if (index % 2 === 0) {
            doc.setFillColor(lightGray[0], lightGray[1], lightGray[2]);
            doc.roundedRect(margin, currentY - 1, contentWidth, 10, 1, 1, 'F');
          }
          doc.setFontSize(9);
          doc.setFont('helvetica', 'normal');
          let nome = item.nome;
          if (/^[a-f0-9]{24}$/i.test(nome)) {
            nome = nome.substring(0, 8) + '...';
          }
          doc.setTextColor(darkColor[0], darkColor[1], darkColor[2]);
          doc.setFont('helvetica', 'normal');
          doc.text(nome, colPositions.nome, currentY + 7);
          const congregacao = item.congregacao.length > 15 ? item.congregacao.substring(0, 12) + '...' : item.congregacao;
          doc.text(congregacao, colPositions.congregacao, currentY + 7);
          doc.setTextColor(secondaryColor[0], secondaryColor[1], secondaryColor[2]);
          doc.setFont('helvetica', 'bold');
          const valorFormatado = new Intl.NumberFormat('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(item.valor);
          doc.text(valorFormatado, colPositions.valor, currentY + 7);
          doc.setTextColor(darkColor[0], darkColor[1], darkColor[2]);
          doc.setFont('helvetica', 'normal');
          doc.text(formatDate(item.data), colPositions.data, currentY + 7);
          currentY += 10;
        });
      }
    } else {
      // Para matriz/sede/congregação - bloco único
      // Posicionar cards abaixo do cabeçalho
      currentY = 75;
      
      // Calcular totais gerais
      const totalDizimistas = relatorioDizimistas.length;
      const valorTotal = relatorioDizimistas.reduce((sum, item) => sum + item.valor, 0);
      const mediaPorDizimista = valorTotal / totalDizimistas;
      const congregacoes = new Set(relatorioDizimistas.map(item => item.congregacao)).size;
      
      // Cards de estatísticas
      const cardWidth = 42;
      const cardSpacing = 5;
      const totalCardsWidth = (cardWidth * 4) + (cardSpacing * 3);
      const startX = margin + (contentWidth - totalCardsWidth) / 2;
      
      // Card 1: Total de Dizimistas
      doc.setFillColor(primaryColor[0], primaryColor[1], primaryColor[2]);
      doc.roundedRect(startX, currentY, cardWidth, 28, 3, 3, 'F');
      doc.setFontSize(11);
      doc.setTextColor(255, 255, 255);
      doc.setFont('helvetica', 'bold');
      doc.text('Total', startX + cardWidth/2, currentY + 8, { align: 'center' });
      doc.text('Dizimistas', startX + cardWidth/2, currentY + 12, { align: 'center' });
      doc.setFontSize(16);
      doc.text(totalDizimistas.toString(), startX + cardWidth/2, currentY + 22, { align: 'center' });
      
      // Card 2: Valor Total
      doc.setFillColor(secondaryColor[0], secondaryColor[1], secondaryColor[2]);
      doc.roundedRect(startX + cardWidth + cardSpacing, currentY, cardWidth, 28, 3, 3, 'F');
      doc.setFontSize(11);
      doc.setTextColor(255, 255, 255);
      doc.setFont('helvetica', 'bold');
      doc.text('Valor', startX + cardWidth + cardSpacing + cardWidth/2, currentY + 8, { align: 'center' });
      doc.text('Total', startX + cardWidth + cardSpacing + cardWidth/2, currentY + 12, { align: 'center' });
      doc.setFontSize(10);
      doc.text(`R$ ${valorTotal.toFixed(2)}`, startX + cardWidth + cardSpacing + cardWidth/2, currentY + 22, { align: 'center' });
      
      // Card 3: Média por Dizimista
      doc.setFillColor(darkColor[0], darkColor[1], darkColor[2]);
      doc.roundedRect(startX + (cardWidth + cardSpacing) * 2, currentY, cardWidth, 28, 3, 3, 'F');
      doc.setFontSize(10);
      doc.setTextColor(255, 255, 255);
      doc.setFont('helvetica', 'bold');
      doc.text('Média', startX + (cardWidth + cardSpacing) * 2 + cardWidth/2, currentY + 8, { align: 'center' });
      doc.text('por Diz.', startX + (cardWidth + cardSpacing) * 2 + cardWidth/2, currentY + 12, { align: 'center' });
      doc.setFontSize(10);
      doc.text(`R$ ${mediaPorDizimista.toFixed(2)}`, startX + (cardWidth + cardSpacing) * 2 + cardWidth/2, currentY + 22, { align: 'center' });
      
      // Card 4: Congregações
      doc.setFillColor(142, 68, 173); // Roxo mais escuro
      doc.roundedRect(startX + (cardWidth + cardSpacing) * 3, currentY, cardWidth, 28, 3, 3, 'F');
      doc.setFontSize(11);
      doc.setTextColor(255, 255, 255);
      doc.setFont('helvetica', 'bold');
      doc.text('Cong.', startX + (cardWidth + cardSpacing) * 3 + cardWidth/2, currentY + 8, { align: 'center' });
      doc.setFontSize(16);
      doc.text(congregacoes.toString(), startX + (cardWidth + cardSpacing) * 3 + cardWidth/2, currentY + 22, { align: 'center' });
      
      currentY += 40;
      
      // Título da tabela
      doc.setFontSize(16);
      doc.setTextColor(darkColor[0], darkColor[1], darkColor[2]);
      doc.setFont('helvetica', 'bold');
      doc.text('Detalhamento por Dizimista', margin, currentY);
      currentY += 12;
      
      // Cabeçalho da tabela
      doc.setFillColor(darkColor[0], darkColor[1], darkColor[2]);
      doc.roundedRect(margin, currentY, contentWidth, 12, 2, 2, 'F');
      doc.setDrawColor(200, 200, 200);
      doc.setLineWidth(0.3);
      doc.line(margin, currentY + 12, pageWidth - margin, currentY + 12);
      doc.setFontSize(10);
      doc.setTextColor(255, 255, 255);
      doc.setFont('helvetica', 'bold');
      doc.text('Nome', colPositions.nome, currentY + 8);
      doc.text('Congregação', colPositions.congregacao, currentY + 8);
      doc.text('Valor (R$)', colPositions.valor, currentY + 8);
      doc.text('Data', colPositions.data, currentY + 8);
      currentY += 14;
      
      // Dados da tabela
      relatorioDizimistas.forEach((item, index) => {
        if (currentY > pageHeight - 50) {
          doc.addPage();
          currentY = 35;
          doc.setFillColor(darkColor[0], darkColor[1], darkColor[2]);
          doc.roundedRect(margin, currentY, contentWidth, 12, 2, 2, 'F');
          doc.setDrawColor(200, 200, 200);
          doc.setLineWidth(0.3);
          doc.line(margin, currentY + 12, pageWidth - margin, currentY + 12);
          doc.setFontSize(10);
          doc.setTextColor(255, 255, 255);
          doc.setFont('helvetica', 'bold');
          doc.text('Nome', colPositions.nome, currentY + 8);
          doc.text('Congregação', colPositions.congregacao, currentY + 8);
          doc.text('Valor (R$)', colPositions.valor, currentY + 8);
          doc.text('Data', colPositions.data, currentY + 8);
          currentY += 14;
        }
        
        if (index % 2 === 0) {
          doc.setFillColor(lightGray[0], lightGray[1], lightGray[2]);
          doc.roundedRect(margin, currentY - 1, contentWidth, 10, 1, 1, 'F');
        }
        
        doc.setFontSize(9);
        doc.setFont('helvetica', 'normal');
        
        let nome = item.nome;
        if (/^[a-f0-9]{24}$/i.test(nome)) {
          nome = nome.substring(0, 8) + '...';
        }
        doc.setTextColor(darkColor[0], darkColor[1], darkColor[2]);
        doc.setFont('helvetica', 'normal');
        doc.text(nome, colPositions.nome, currentY + 7);
        
        const congregacao = item.congregacao.length > 15 ? item.congregacao.substring(0, 12) + '...' : item.congregacao;
        doc.text(congregacao, colPositions.congregacao, currentY + 7);
        
        doc.setTextColor(secondaryColor[0], secondaryColor[1], secondaryColor[2]);
        doc.setFont('helvetica', 'bold');
        const valorFormatado = new Intl.NumberFormat('pt-BR', {
          minimumFractionDigits: 2,
          maximumFractionDigits: 2
        }).format(item.valor);
        doc.text(valorFormatado, colPositions.valor, currentY + 7);
        
        doc.setTextColor(darkColor[0], darkColor[1], darkColor[2]);
        doc.setFont('helvetica', 'normal');
        doc.text(formatDate(item.data), colPositions.data, currentY + 7);
        
        currentY += 10;
      });
    }

    // Rodapé em todas as páginas
    const totalPages = doc.getNumberOfPages();
    for (let i = 1; i <= totalPages; i++) {
      doc.setPage(i);
      
      // Linha separadora
      doc.setDrawColor(textGray[0], textGray[1], textGray[2]);
      doc.setLineWidth(0.5);
      doc.line(margin, pageHeight - 30, pageWidth - margin, pageHeight - 30);
      
      // Informações do rodapé
      doc.setFontSize(9);
      doc.setTextColor(textGray[0], textGray[1], textGray[2]);
      doc.setFont('helvetica', 'normal');
      doc.text(`Página ${i} de ${totalPages}`, pageWidth / 2, pageHeight - 20, { align: 'center' });
      doc.text('Sistema de Gestão Eclesiástica', margin, pageHeight - 12);
      doc.text(`Gerado em ${dataAtual} às ${horaAtual}`, pageWidth - margin, pageHeight - 12, { align: 'right' });
    }
    
    // Salvar o PDF
    const fileName = `relatorio_dizimistas_${new Date().toISOString().split('T')[0]}.pdf`;
    doc.save(fileName);
  };

  const canCreateIgreja = () => {
    return user?.role === 'admin' || user?.role === 'sede';
  };

  const getActivityIcon = (type: string) => {
    switch (type) {
      case 'church': return <Church className="w-4 h-4" />;
      case 'event': return <Calendar className="w-4 h-4" />;
      case 'dizimo': return <DollarSign className="w-4 h-4" />;
      case 'user': return <Users className="w-4 h-4" />;
      default: return <FileText className="w-4 h-4" />;
    }
  };

  const getEventColor = (tipo: string) => {
    switch (tipo) {
      case 'sede': return 'bg-blue-500';
      case 'congregacao': return 'bg-green-500';
      default: return 'bg-gray-500';
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('pt-BR');
  };

  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
  };

  const formatNotificationTime = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInMinutes = Math.floor((now.getTime() - date.getTime()) / (1000 * 60));
    
    if (diffInMinutes < 1) return 'Agora';
    if (diffInMinutes < 60) return `${diffInMinutes} min atrás`;
    if (diffInMinutes < 1440) return `${Math.floor(diffInMinutes / 60)}h atrás`;
    return date.toLocaleDateString('pt-BR');
  };

  const getNotificationIcon = (tipo: string) => {
    switch (tipo) {
      case 'evento': return <Calendar className="w-4 h-4" />;
      case 'dizimo': return <DollarSign className="w-4 h-4" />;
      case 'igreja': return <Church className="w-4 h-4" />;
      case 'usuario': return <Users className="w-4 h-4" />;
      case 'calendario': return <Calendar className="w-4 h-4" />;
      case 'pastor': return <User className="w-4 h-4" />;
      case 'diretoria': return <Users className="w-4 h-4" />;
      default: return <AlertCircle className="w-4 h-4" />;
    }
  };

  const getNotificationColor = (tipo: string) => {
    switch (tipo) {
      case 'evento': return 'text-blue-400';
      case 'dizimo': return 'text-green-400';
      case 'igreja': return 'text-purple-400';
      case 'usuario': return 'text-yellow-400';
      case 'calendario': return 'text-indigo-400';
      case 'pastor': return 'text-orange-400';
      case 'diretoria': return 'text-pink-400';
      default: return 'text-gray-400';
    }
  };

  if (loading || !user) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
          <p className="text-gray-900 dark:text-white">Carregando dashboard...</p>
        </div>
      </div>
    );
  }

  const stats = [
    { 
      title: user?.role === 'admin' ? 'Total de Igrejas' : user?.role === 'sede' ? 'Minhas Congregações' : 'Minha Igreja', 
      value: dashboardData.totalIgrejas.toString(), 
      change: '+0', 
      trend: 'up', 
      icon: Church 
    },
    { 
      title: user?.role === 'admin' ? 'Usuários Ativos' : user?.role === 'sede' ? 'Usuários das Congregações' : 'Usuários da Igreja', 
      value: dashboardData.totalUsuarios.toString(), 
      change: '+0', 
      trend: 'up', 
      icon: Users 
    },
    { 
      title: user?.role === 'admin' ? 'Eventos Programados' : user?.role === 'sede' ? 'Eventos das Congregações' : 'Eventos da Igreja', 
      value: dashboardData.totalEventos.toString(), 
      change: '+0', 
      trend: 'up', 
      icon: Calendar 
    },
    { 
      title: 'Dízimos (R$)', 
      value: dashboardData.totalDizimos.toFixed(2), 
      change: '+0%', 
      trend: 'up', 
      icon: DollarSign,
      clickable: true,
      onClick: () => setShowDizimos(!showDizimos)
    }
  ];

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);
  };

  // Mobile Navigation Component
  const MobileNavigation = () => (
    <motion.div
      className="lg:hidden fixed bottom-0 left-0 right-0 bg-white dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700 z-40"
      initial={{ y: 100 }}
      animate={{ y: 0 }}
      transition={{ duration: 0.3 }}
    >
      <div className="flex justify-around py-2">
        <button
          onClick={() => setCurrentMobileView('dashboard')}
          className={`flex flex-col items-center p-2 rounded-lg transition-colors ${
            currentMobileView === 'dashboard'
              ? 'text-blue-500 bg-blue-50 dark:bg-blue-500/20'
              : 'text-gray-600 dark:text-gray-400 hover:text-blue-500'
          }`}
        >
          <Home className="w-5 h-5 mb-1" />
          <span className="text-xs">Dashboard</span>
        </button>
        
        {user?.role !== 'admin' && (
          <>
            <button
              onClick={() => setCurrentMobileView('pastor')}
              className={`flex flex-col items-center p-2 rounded-lg transition-colors ${
                currentMobileView === 'pastor'
                  ? 'text-blue-500 bg-blue-50 dark:bg-blue-500/20'
                  : 'text-gray-600 dark:text-gray-400 hover:text-blue-500'
              }`}
            >
              <User className="w-5 h-5 mb-1" />
              <span className="text-xs">Pastor</span>
            </button>
            
            <button
              onClick={() => setCurrentMobileView('diretoria')}
              className={`flex flex-col items-center p-2 rounded-lg transition-colors ${
                currentMobileView === 'diretoria'
                  ? 'text-blue-500 bg-blue-50 dark:bg-blue-500/20'
                  : 'text-gray-600 dark:text-gray-400 hover:text-blue-500'
              }`}
            >
              <UsersIcon className="w-5 h-5 mb-1" />
              <span className="text-xs">Diretoria</span>
            </button>
          </>
        )}
      </div>
    </motion.div>
  );

  // Mobile Views
  const MobilePastorView = () => (
    <motion.div
      className="lg:hidden flex-1 overflow-y-auto"
      initial={{ opacity: 0, x: 100 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -100 }}
      transition={{ duration: 0.3 }}
    >
      <div className="p-4 pb-20">
        <div className="w-full flex justify-center">
          <PastorCard />
        </div>
      </div>
    </motion.div>
  );

  const MobileDiretoriaView = () => (
    <motion.div
      className="lg:hidden flex-1 overflow-y-auto"
      initial={{ opacity: 0, x: 100 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -100 }}
      transition={{ duration: 0.3 }}
    >
      <div className="p-4 pb-20">
        <div className="w-full flex justify-center">
          <DiretoriaCard />
        </div>
      </div>
    </motion.div>
  );

  return (
    <div className="min-h-screen">
      <div className="w-full lg:w-[85%] mx-auto flex flex-col h-screen px-4 sm:px-6 lg:px-8 xl:px-10">
        {/* Header */}
        <header className="bg-transparent border-b border-gray-200 dark:border-gray-700 flex-shrink-0">
          <div className="py-4">
            <div className="flex items-center justify-between h-16">
              <div className="flex items-center">
                <Church className="w-8 h-8 text-blue-500 mr-3" />
                <h1 className="text-xl font-bold text-gray-900 dark:text-white">Sistema Igreja</h1>
              </div>
              
              <div className="flex items-center space-x-4">
                <ThemeToggle />
                <button 
                  onClick={handleRefresh}
                  disabled={refreshing}
                  className="text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors"
                  title="Atualizar dados"
                >
                  <RefreshCw className={`w-5 h-5 ${refreshing ? 'animate-spin' : ''}`} />
                </button>
                
                {/* Mobile Menu Button */}
                <button
                  onClick={() => setShowMobileMenu(!showMobileMenu)}
                  className="lg:hidden text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors"
                >
                  <Menu className="w-5 h-5" />
                </button>
                
                {/* Notification Bell */}
                {(user?.role === 'admin' || user?.role === 'sede') && (
                  <div className="relative notification-dropdown">
                    <button 
                      onClick={() => setShowNotificacoes(!showNotificacoes)}
                      className="text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors relative"
                      title="Notificações"
                    >
                      <Bell className="w-5 h-5" />
                      {notificacoesNaoLidas > 0 && (
                        <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                          {notificacoesNaoLidas > 9 ? '9+' : notificacoesNaoLidas}
                        </span>
                      )}
                    </button>
                    
                    {/* Notification Dropdown */}
                    <AnimatePresence>
                      {showNotificacoes && (
                        <motion.div
                          className="absolute right-0 mt-2 w-80 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg z-50 max-h-96 overflow-y-auto"
                          initial={{ opacity: 0, y: -10, scale: 0.95 }}
                          animate={{ opacity: 1, y: 0, scale: 1 }}
                          exit={{ opacity: 0, y: -10, scale: 0.95 }}
                          transition={{ duration: 0.2 }}
                        >
                          <div className="p-4 border-b border-gray-200 dark:border-gray-700">
                            <div className="flex items-center justify-between">
                              <h3 className="text-gray-900 dark:text-white font-semibold">Notificações</h3>
                              {notificacoesNaoLidas > 0 && (
                                <button
                                  onClick={marcarTodasComoLidas}
                                  className="text-blue-400 hover:text-blue-300 text-sm"
                                >
                                  Marcar todas como lidas
                                </button>
                              )}
                            </div>
                          </div>
                          
                          <div className="p-2">
                            {notificacoes.length > 0 ? (
                              notificacoes.map((notificacao) => (
                                <motion.div
                                  key={notificacao._id}
                                  className={`p-3 rounded-lg mb-2 transition-colors ${
                                    notificacao.lida ? 'bg-gray-100 dark:bg-gray-700/50' : 'bg-blue-50 dark:bg-blue-500/10 border border-blue-200 dark:border-blue-500/20'
                                  }`}
                                  initial={{ opacity: 0, x: -10 }}
                                  animate={{ opacity: 1, x: 0 }}
                                >
                                  <div className="flex items-start justify-between">
                                    <div className="flex items-start space-x-3 flex-1">
                                      <div className={`p-2 rounded-lg bg-gray-200 dark:bg-gray-600 ${getNotificationColor(notificacao.tipo)}`}>
                                        {getNotificationIcon(notificacao.tipo)}
                                      </div>
                                      <div className="flex-1 min-w-0">
                                        <p className={`text-sm font-medium ${notificacao.lida ? 'text-gray-600 dark:text-gray-300' : 'text-gray-900 dark:text-white'}`}>
                                          {notificacao.titulo}
                                        </p>
                                        <p className="text-gray-600 dark:text-gray-400 text-xs mt-1">
                                          {notificacao.descricao}
                                        </p>
                                        <div className="flex items-center space-x-2 mt-2">
                                          <span className="text-gray-500 text-xs">
                                            {notificacao.igreja?.nome || 'Sistema'}
                                          </span>
                                          <span className="text-gray-500 text-xs">•</span>
                                          <span className="text-gray-500 text-xs">
                                            {formatNotificationTime(notificacao.createdAt)}
                                          </span>
                                        </div>
                                      </div>
                                    </div>
                                    
                                    <div className="flex items-center space-x-1">
                                      {!notificacao.lida && (
                                        <button
                                          onClick={() => marcarComoLida(notificacao._id)}
                                          className="text-gray-400 hover:text-green-400 transition-colors p-1"
                                          title="Marcar como lida"
                                        >
                                          <CheckCircle className="w-3 h-3" />
              </button>
                                      )}
                                      <button
                                        onClick={() => deletarNotificacao(notificacao._id)}
                                        className="text-gray-400 hover:text-red-400 transition-colors p-1"
                                        title="Deletar"
                                      >
                                        <Trash2 className="w-3 h-3" />
              </button>
                                    </div>
                                  </div>
                                </motion.div>
                              ))
                            ) : (
                              <div className="text-center py-8">
                                <Bell className="w-8 h-8 text-gray-500 mx-auto mb-2" />
                                <p className="text-gray-600 dark:text-gray-400 text-sm">Nenhuma notificação</p>
                              </div>
                            )}
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                )}
                
                <div className="flex items-center space-x-2 text-gray-700 dark:text-gray-300">
                  <User className="w-4 h-4" />
                  <span className="text-sm hidden sm:inline">{user?.nome || 'Usuário'}</span>
                  <span className="text-xs text-gray-600 dark:text-gray-400 hidden sm:inline">({user?.role || 'N/A'})</span>
                </div>
                <button 
                  onClick={handleLogout}
                  className="text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors"
                  title="Sair"
                >
                  <LogOut className="w-5 h-5" />
                </button>
              </div>
            </div>
          </div>
        </header>

        {/* Mobile Views */}
        <AnimatePresence mode="wait">
          {currentMobileView === 'pastor' && <MobilePastorView key="pastor" />}
          {currentMobileView === 'diretoria' && <MobileDiretoriaView key="diretoria" />}
        </AnimatePresence>

        {/* Desktop Dashboard View */}
        <div className={`flex flex-col lg:flex-row justify-between gap-8 pt-8 flex-1 items-center ${currentMobileView !== 'dashboard' ? 'hidden lg:flex' : ''}`}>
          {/* Cards laterais - Apenas para usuários não-admin e desktop */}
          {user?.role !== 'admin' && (
            <div className="hidden lg:flex flex-col justify-center items-center flex-shrink-0 mb-8 lg:mb-0 w-full lg:w-64 lg:h-auto">
              <PastorCard />
            </div>
          )}
          
          <div className={`flex-1 min-w-0 flex flex-col ${user?.role === 'admin' ? 'w-full' : ''}`}>
            {/* Page Header */}
            <motion.div
              className="mb-8"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
            >
              <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">Dashboard</h2>
              <p className="text-gray-600 dark:text-gray-400">
                {user?.role === 'admin' 
                  ? 'Bem-vindo ao painel de controle do sistema' 
                  : user?.role === 'sede' 
                    ? 'Gerencie suas congregações e atividades' 
                    : 'Gerencie sua igreja e atividades'
                }
              </p>
            </motion.div>

            {/* Stats Cards */}
            <motion.div
              className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.1 }}
            >
              {stats.map((stat, index) => (
                <motion.div
                  key={stat.title}
                  className={`bg-gradient-to-br from-white to-gray-50 dark:from-gray-800 dark:to-gray-900 border border-gray-200 dark:border-blue-500/20 rounded-xl p-6 shadow-lg relative overflow-hidden ${
                    stat.clickable ? 'cursor-pointer' : ''
                  }`}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ 
                    opacity: 1, 
                    y: 0,
                    scale: stat.clickable && isStatsCardClicked && stat.title === 'Dízimos (R$)' ? 1.05 : 1
                  }}
                  transition={{ 
                    duration: 0.6, 
                    delay: 0.1 + index * 0.1,
                    scale: { duration: 0.2 }
                  }}
                  whileHover={{ y: -5, scale: 1.02 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => {
                    if (stat.clickable && stat.title === 'Dízimos (R$)') {
                      setIsStatsCardClicked(true);
                      setTimeout(() => setIsStatsCardClicked(false), 300);
                    }
                    stat.onClick?.();
                  }}
                >
                  {/* Ripple effect for stats card */}
                  {stat.clickable && isStatsCardClicked && stat.title === 'Dízimos (R$)' && (
                    <motion.div
                      className="absolute inset-0 bg-blue-400 opacity-20 rounded-xl"
                      initial={{ scale: 0, opacity: 0.5 }}
                      animate={{ scale: 2, opacity: 0 }}
                      transition={{ duration: 0.6 }}
                    />
                  )}
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-gray-600 dark:text-gray-400 text-sm">{stat.title}</p>
                      <p className="text-2xl font-bold text-gray-900 dark:text-white mt-1">{stat.value}</p>
                    </div>
                    <motion.div 
                      className={`p-3 rounded-lg bg-gradient-to-br from-blue-500 to-blue-700`}
                      animate={stat.clickable && isStatsCardClicked && stat.title === 'Dízimos (R$)' ? { scale: [1, 1.2, 1] } : {}}
                      transition={{ duration: 0.3 }}
                    >
                      <stat.icon className="w-6 h-6 text-white" />
                    </motion.div>
                  </div>
                  <div className="flex items-center mt-4">
                    {stat.trend === 'up' ? (
                      <TrendingUp className="w-4 h-4 text-green-500 mr-1" />
                    ) : (
                      <TrendingDown className="w-4 h-4 text-red-500 mr-1" />
                    )}
                    <span className={`text-sm ${stat.trend === 'up' ? 'text-green-500' : 'text-red-500'}`}>
                      {stat.change}
                    </span>
                    <span className="text-gray-600 dark:text-gray-400 text-sm ml-1">este mês</span>
                  </div>
                </motion.div>
              ))}
            </motion.div>

            {/* Dízimos por Igreja */}
            <AnimatePresence>
              {showDizimos && (
                <motion.div
                  className="mb-8 bg-gradient-to-br from-white to-gray-50 dark:from-gray-800 dark:to-gray-900 border border-gray-200 dark:border-blue-500/20 rounded-xl p-6 shadow-lg"
                  initial={{ opacity: 0, y: 30, scale: 0.95 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: -20, scale: 0.95 }}
                  transition={{ 
                    duration: 0.5, 
                    delay: 0.1,
                    ease: "easeOut"
                  }}
                >
                  <div className="flex items-center justify-between mb-6">
                    <h3 className="text-xl font-semibold text-gray-900 dark:text-white">
                      {user?.role === 'admin' 
                        ? 'Dízimos por Igreja' 
                        : user?.role === 'sede' 
                          ? 'Dízimos das Congregações' 
                          : 'Dízimos da Igreja'
                    }
                  </h3>
                  {/* Só mostra o botão de registrar dízimo se não for admin */}
                  {user?.role !== 'admin' && (
                    <button 
                      onClick={() => handleQuickAction('dizimo')}
                      className="text-blue-400 hover:text-blue-300 transition-colors"
                    >
                      <Plus className="w-5 h-5" />
                    </button>
                  )}
                </div>
                {(user?.role === 'admin' || user?.role === 'sede') && (
                  <motion.div
                    className={`bg-white dark:bg-gray-800 border border-blue-200 dark:border-blue-700/40 shadow-lg rounded-xl p-6 cursor-pointer relative overflow-hidden ${
                      isDizimoCardClicked ? 'ring-4 ring-blue-400 ring-opacity-50' : ''
                    }`}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ 
                      opacity: 1, 
                      y: 0,
                      scale: isDizimoCardClicked ? 1.05 : 1,
                      boxShadow: showCongregacoes 
                        ? "0 20px 25px -5px rgba(59, 130, 246, 0.3), 0 10px 10px -5px rgba(59, 130, 246, 0.2)" 
                        : "0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)"
                    }}
                    transition={{ 
                      duration: 0.6, 
                      delay: 0.4,
                      scale: { duration: 0.2 },
                      boxShadow: { duration: 0.3 }
                    }}
                    whileHover={{ y: -5, scale: 1.02 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => {
                      setIsDizimoCardClicked(true);
                      setShowCongregacoes(!showCongregacoes);
                      setTimeout(() => setIsDizimoCardClicked(false), 300);
                    }}
                  >
                    {isDizimoCardClicked && (
                      <motion.div
                        className="absolute inset-0 bg-blue-400 opacity-20 rounded-xl"
                        initial={{ scale: 0, opacity: 0.5 }}
                        animate={{ scale: 2, opacity: 0 }}
                        transition={{ duration: 0.6 }}
                      />
                    )}
                    <div className="flex items-center justify-between">
                      <div className="flex items-center">
                        <motion.div
                          animate={isDizimoCardClicked ? { scale: [1, 1.2, 1] } : {}}
                          transition={{ duration: 0.3 }}
                        >
                          <Church className="w-8 h-8 text-blue-400 mr-3" />
                        </motion.div>
                        <h3 className="text-lg font-semibold text-blue-400">SEDE</h3>
                      </div>
                      <motion.div
                        animate={{ rotate: showCongregacoes ? 180 : 0 }}
                        transition={{ duration: 0.3 }}
                        className="text-blue-400"
                      >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                        </svg>
                      </motion.div>
                    </div>
                    <div className="flex flex-col md:flex-row md:justify-between items-center mt-4">
                      <div className="text-center md:text-left mb-4 md:mb-0">
                        <span className="block text-gray-600 dark:text-gray-400 text-sm">Sede</span>
                        <p className="text-3xl font-bold text-gray-900 dark:text-white">{formatCurrency(dashboardData.totalSede)}</p>
                      </div>
                      <div className="text-center md:text-right">
                        <span className="block text-gray-600 dark:text-gray-400 text-sm">Total Geral (Sede + Congregações)</span>
                        <p className="text-3xl font-bold text-gray-900 dark:text-white">{formatCurrency(dashboardData.totalGeral)}</p>
                      </div>
                    </div>
                  </motion.div>
                )}
                <AnimatePresence>
                  {showCongregacoes && (user?.role === 'admin' || user?.role === 'sede') && (
                    <motion.div
                      className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mt-6"
                      initial={{ opacity: 0, height: 0, y: -20 }}
                      animate={{ opacity: 1, height: "auto", y: 0 }}
                      exit={{ opacity: 0, height: 0, y: -20 }}
                      transition={{ 
                        duration: 0.5,
                        ease: "easeInOut",
                        height: { duration: 0.4 }
                      }}
                    >
                      {dashboardData.congregacoes.map((igrejaData, index) => (
                        <motion.div
                          key={igrejaData.igreja._id}
                          className="bg-gray-100 dark:bg-gray-700 rounded-lg p-4"
                          initial={{ opacity: 0, y: 30, scale: 0.9 }}
                          animate={{ opacity: 1, y: 0, scale: 1 }}
                          transition={{ 
                            duration: 0.5, 
                            delay: 0.2 + index * 0.1,
                            ease: "easeOut"
                          }}
                          whileHover={{ y: -5, scale: 1.02 }}
                          whileTap={{ scale: 0.98 }}
                        >
                          <div className="flex items-center justify-between mb-3">
                            <div className="flex items-center gap-2">
                              <motion.div
                                initial={{ scale: 0 }}
                                animate={{ scale: 1 }}
                                transition={{ 
                                  duration: 0.3, 
                                  delay: 0.3 + index * 0.1,
                                  type: "spring",
                                  stiffness: 200
                                }}
                              >
                                <Church className="w-4 h-4 text-green-400" />
                              </motion.div>
                              <h4 className="text-gray-900 dark:text-white font-medium text-sm">{igrejaData.igreja?.nome || 'Igreja'}</h4>
                            </div>
                            <span className="px-2 py-1 rounded-full text-xs font-bold bg-green-500 text-white">
                              Congregação
                            </span>
                          </div>
                          <div className="text-center">
                            <motion.p 
                              className="text-2xl font-bold text-green-400"
                              initial={{ opacity: 0, y: 10 }}
                              animate={{ opacity: 1, y: 0 }}
                              transition={{ 
                                duration: 0.4, 
                                delay: 0.4 + index * 0.1 
                              }}
                            >
                              R$ {igrejaData.total.toFixed(2)}
                            </motion.p>
                            <motion.p 
                              className="text-gray-600 dark:text-gray-400 text-sm"
                              initial={{ opacity: 0 }}
                              animate={{ opacity: 1 }}
                              transition={{ 
                                duration: 0.4, 
                                delay: 0.5 + index * 0.1 
                              }}
                            >
                              {igrejaData.items.length} registro{igrejaData.items.length !== 1 ? 's' : ''}
                            </motion.p>
                          </div>
                        </motion.div>
                      ))}
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>
            )}
            </AnimatePresence>

            {/* Main Content */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              {/* Recent Activities */}
              <motion.div
                className="lg:col-span-2 bg-gradient-to-br from-white to-gray-50 dark:from-gray-800 dark:to-gray-900 border border-gray-200 dark:border-blue-500/20 rounded-xl p-6 shadow-lg"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.6, delay: 0.5 }}
              >
                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-xl font-semibold text-gray-900 dark:text-white">
                    {user?.role === 'admin' 
                      ? 'Atividades Recentes' 
                      : user?.role === 'sede' 
                        ? 'Atividades das Congregações' 
                        : 'Atividades da Igreja'
                    }
                  </h3>
                  <button 
                    className="text-blue-400 hover:text-blue-300 transition-colors"
                    onClick={() => setShowAtividades((prev) => !prev)}
                    title={showAtividades ? 'Ocultar atividades' : 'Mostrar atividades'}
                  >
                    {showAtividades ? <Eye className="w-5 h-5" /> : <EyeOff className="w-5 h-5" />}
              </button>
                </div>
                {showAtividades && (
                  <div className="space-y-4">
                    {dashboardData.atividadesRecentes.map((activity, index) => (
                      <motion.div
                        key={index}
                        className="flex items-center space-x-3 p-3 bg-gray-100 dark:bg-gray-700 rounded-lg"
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ duration: 0.6, delay: 0.4 + index * 0.1 }}
                      >
                        <div className="p-2 bg-blue-500 rounded-lg">
                          {getActivityIcon(activity.type)}
                        </div>
                        <div className="flex-1">
                          <p className="text-gray-900 dark:text-white text-sm">{activity.message}</p>
                          <p className="text-gray-600 dark:text-gray-400 text-xs">{activity.time}</p>
                        </div>
                      </motion.div>
                    ))}
                  </div>
                )}
              </motion.div>

              {/* Upcoming Events */}
              <motion.div
                className="bg-gradient-to-br from-white to-gray-50 dark:from-gray-800 dark:to-gray-900 border border-gray-200 dark:border-blue-500/20 rounded-xl p-6 shadow-lg"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.6, delay: 0.6 }}
              >
                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-xl font-semibold text-gray-900 dark:text-white">
                    {user?.role === 'admin' 
                      ? 'Próximos Eventos' 
                      : user?.role === 'sede' 
                        ? 'Eventos das Congregações' 
                        : 'Eventos da Igreja'
                    }
                  </h3>
                  <button 
                    onClick={() => handleQuickAction('evento')}
                    className="text-blue-400 hover:text-blue-300 transition-colors"
                  >
                    <Plus className="w-5 h-5" />
                  </button>
                </div>
                
                <div className="space-y-4">
                  {dashboardData.eventosProximos.length > 0 ? (
                    dashboardData.eventosProximos.map((event, index) => (
                      <motion.div
                        key={event._id}
                        className="p-4 bg-gray-100 dark:bg-gray-700 rounded-lg"
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.6, delay: 0.5 + index * 0.1 }}
                      >
                        <div className="flex items-center space-x-3">
                          <div className={`w-3 h-3 rounded-full ${getEventColor(event.tipo)}`}></div>
                          <div className="flex-1">
                            <div className="flex items-center justify-between mb-1">
                              <p className="text-gray-900 dark:text-white font-medium">{event.titulo}</p>
                              {/* Tag para identificar se é evento da sede ou congregação */}
                              {event.igreja && (
                                <span className={`px-2 py-1 rounded-full text-xs font-medium flex items-center gap-1 ${
                                  event.igreja.tipo === 'sede' 
                                    ? 'bg-blue-500 text-white' 
                                    : 'bg-green-500 text-white'
                                }`}>
                                  {event.igreja.tipo === 'sede' ? (
                                    <>
                                      <Church className="w-3 h-3" />
                                      Sede
                                    </>
                                  ) : (
                                    <>
                                      <Church className="w-3 h-3" />
                                      {event.igreja.nome}
                                    </>
                                  )}
                                </span>
                              )}
                            </div>
                            <p className="text-gray-600 dark:text-gray-400 text-sm">{formatDate(event.data)} às {formatTime(event.data)}</p>
                            <p className="text-gray-600 dark:text-gray-500 text-xs">{event.igreja?.nome || 'Sistema'}</p>
                          </div>
                        </div>
                      </motion.div>
                    ))
                  ) : (
                    <div className="text-center py-8">
                      <Calendar className="w-12 h-12 text-gray-500 mx-auto mb-2" />
                      <p className="text-gray-600 dark:text-gray-400 text-sm">Nenhum evento próximo</p>
                    </div>
                  )}
                </div>
              </motion.div>
            </div>

            {/* Quick Actions */}
            <motion.div
              className="mt-8 mb-24 lg:mb-8 bg-gradient-to-br from-white to-gray-50 dark:from-gray-800 dark:to-gray-900 border border-gray-200 dark:border-blue-500/20 rounded-xl p-6 shadow-lg"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.8 }}
            >
              <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-6">Ações Rápidas</h3>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    {/* Só mostra as ações de membro e dízimo se não for admin */}
                    {[
                      { title: 'Gerenciar Igrejas', icon: Church, color: 'from-blue-500 to-blue-700', action: 'igreja', show: user?.role === 'admin' || user?.role === 'sede' },
                      { title: 'Criar Evento', icon: Calendar, color: 'from-green-500 to-green-700', action: 'evento', show: true },
                      { title: 'Registrar Dízimo', icon: DollarSign, color: 'from-yellow-500 to-yellow-700', action: 'dizimo', show: user?.role !== 'admin' },
                      { title: 'Adicionar Membro', icon: Users, color: 'from-purple-500 to-purple-700', action: 'membro', show: user?.role !== 'admin' },
                      { title: 'Relatório Dizimistas', icon: FileText, color: 'from-orange-500 to-orange-700', action: 'relatorio-dizimistas', show: user?.role === 'admin' || user?.role === 'sede' }
                    ].filter(a => a.show).map((action, index) => (
                  <motion.button
                    key={action.title}
                    onClick={() => handleQuickAction(action.action)}
                    className={`bg-gradient-to-r ${action.color} text-white p-4 rounded-lg hover:scale-105 transition-all duration-300 flex flex-col items-center space-y-2`}
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ duration: 0.6, delay: 0.6 + index * 0.1 }}
                    whileHover={{ y: -5 }}
                  >
                    <action.icon className="w-6 h-6" />
                    <span className="text-sm font-medium">{action.title}</span>
                  </motion.button>
                ))}
              </div>
            </motion.div>
          </div>
          
          {/* Cards laterais - Apenas para usuários não-admin e desktop */}
          {user?.role !== 'admin' && (
            <div className="hidden lg:flex flex-col justify-center items-center flex-shrink-0 mt-8 lg:mt-0 w-full lg:w-64 lg:h-auto">
              <DiretoriaCard />
            </div>
          )}
        </div>
      </div>

      {/* Mobile Navigation */}
      <MobileNavigation />

      {/* Modal Relatório de Dizimistas */}
      <AnimatePresence>
        {showRelatorioDizimistas && (
          <motion.div
            className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setShowRelatorioDizimistas(false)}
          >
            <motion.div
              className="bg-gradient-to-br from-white to-gray-50 dark:from-gray-800 dark:to-gray-900 border border-gray-200 dark:border-blue-500/20 rounded-xl p-8 shadow-lg w-full max-w-6xl max-h-[90vh] overflow-hidden"
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-xl font-semibold text-gray-900 dark:text-white flex items-center gap-2">
                  <FileText className="w-6 h-6 text-orange-500" />
                  Relatório de Dizimistas
                </h3>
                <div className="flex items-center gap-3">
                  <button
                    onClick={async () => await gerarPDF()}
                    disabled={relatorioDizimistas.length === 0}
                    className="bg-gradient-to-r from-green-500 to-green-700 text-white px-4 py-2 rounded-lg hover:from-green-600 hover:to-green-800 transition-all duration-300 flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                    title="Gerar PDF"
                  >
                    <Download className="w-4 h-4" />
                    Gerar PDF
                  </button>
                  <button
                    onClick={() => setShowRelatorioDizimistas(false)}
                    className="text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors"
                  >
                    <X className="w-6 h-6" />
                  </button>
                </div>
              </div>

              {loadingRelatorio ? (
                <div className="flex items-center justify-center py-12">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-500"></div>
                  <span className="ml-3 text-gray-900 dark:text-white">Carregando relatório...</span>
                </div>
              ) : (
                <div className="overflow-y-auto max-h-[70vh]">
                  {relatorioDizimistas.length > 0 ? (
                    <div className="space-y-4">
                      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
                        <div className="bg-gray-100 dark:bg-gray-700 rounded-lg p-6">
                          <p className="text-gray-600 dark:text-gray-400 text-sm font-medium mb-2">Total de Dizimistas</p>
                          <p className="text-3xl font-bold text-gray-900 dark:text-white">{relatorioDizimistas.length}</p>
                        </div>
                        <div className="bg-gray-100 dark:bg-gray-700 rounded-lg p-6">
                          <p className="text-gray-600 dark:text-gray-400 text-sm font-medium mb-2">Valor Total</p>
                          <p className="text-3xl font-bold text-green-400">
                            R$ {relatorioDizimistas.reduce((sum, item) => sum + item.valor, 0).toFixed(2)}
                          </p>
                        </div>
                        <div className="bg-gray-100 dark:bg-gray-700 rounded-lg p-6">
                          <p className="text-gray-600 dark:text-gray-400 text-sm font-medium mb-2">Média por Dizimista</p>
                          <p className="text-3xl font-bold text-blue-400">
                            R$ {(relatorioDizimistas.reduce((sum, item) => sum + item.valor, 0) / relatorioDizimistas.length).toFixed(2)}
                          </p>
                        </div>
                        <div className="bg-gray-100 dark:bg-gray-700 rounded-lg p-6">
                          <p className="text-gray-600 dark:text-gray-400 text-sm font-medium mb-2">Congregações</p>
                          <p className="text-3xl font-bold text-purple-400">
                            {new Set(relatorioDizimistas.map(item => item.congregacao)).size}
                          </p>
                        </div>
                      </div>

                      <div className="bg-gray-100 dark:bg-gray-700 rounded-lg overflow-hidden">
                        <div className="overflow-x-auto">
                          <table className="w-full min-w-full">
                            <thead className="bg-gray-200 dark:bg-gray-600">
                              <tr>
                                <th className="px-4 py-3 text-left text-gray-900 dark:text-white font-semibold text-sm whitespace-nowrap">Nome</th>
                                <th className="px-2 py-3 text-left text-gray-900 dark:text-white font-semibold text-sm whitespace-nowrap">Congregação</th>
                                <th className="px-3 py-3 text-left text-gray-900 dark:text-white font-semibold text-sm whitespace-nowrap">Valor (R$)</th>
                                <th className="px-3 py-3 text-left text-gray-900 dark:text-white font-semibold text-sm whitespace-nowrap">Data</th>
                                <th className="px-4 py-3 text-left text-gray-900 dark:text-white font-semibold text-sm whitespace-nowrap">Tipo</th>
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-300 dark:divide-gray-600">
                              {relatorioDizimistas.map((item, index) => (
                                <motion.tr
                                  key={index}
                                  className="hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
                                  initial={{ opacity: 0, y: 10 }}
                                  animate={{ opacity: 1, y: 0 }}
                                  transition={{ delay: index * 0.05 }}
                                >
                                  <td className="px-4 py-3 text-gray-900 dark:text-white text-sm">
                                    <div className="max-w-md truncate" title={item.nome}>
                                      {item.nome}
                                    </div>
                                  </td>
                                  <td className="px-2 py-3 text-gray-700 dark:text-gray-300 text-sm">
                                    <div className="max-w-32 truncate" title={item.congregacao}>
                                      {item.congregacao}
                                    </div>
                                  </td>
                                  <td className="px-3 py-3 text-green-400 font-semibold text-sm whitespace-nowrap">
                                    {item.valor.toFixed(2)}
                                  </td>
                                  <td className="px-3 py-3 text-gray-700 dark:text-gray-300 text-sm whitespace-nowrap">
                                    {formatDate(item.data)}
                                  </td>
                                  <td className="px-4 py-3">
                                    <span className={`px-2 py-1 rounded-full text-xs font-medium whitespace-nowrap ${
                                      item.tipo === 'sede' 
                                        ? 'bg-blue-500 text-white' 
                                        : 'bg-green-500 text-white'
                                    }`}>
                                      {item.tipo === 'sede' ? 'Sede' : 'Congregação'}
                                    </span>
                                  </td>
                                </motion.tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="text-center py-12">
                      <FileText className="w-16 h-16 text-gray-500 mx-auto mb-4" />
                      <p className="text-gray-600 dark:text-gray-400 text-lg">Nenhum dízimo encontrado</p>
                      <p className="text-gray-600 dark:text-gray-500 text-sm">Não há registros de dizimistas no sistema</p>
                    </div>
                  )}
                </div>
              )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default Dashboard; 