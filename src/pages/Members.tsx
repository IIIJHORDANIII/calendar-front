import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { 
  ArrowLeft, 
  Plus, 
  Edit, 
  Trash2, 
  X, 
  Search, 
  Filter, 
  Download, 
  Users, 
  Calendar, 
  BarChart3, 
  Grid3X3, 
  List,
  UserCheck,

  Eye,
  EyeOff,

  SortAsc,
  SortDesc
} from 'lucide-react';
import { useApi } from '../utils/api';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import jsPDF from 'jspdf';
import 'jspdf-autotable';

interface Igreja {
  _id: string;
  nome: string;
  tipo: string;
}

interface User {
  _id: string;
  nome: string;
  email: string;
  role: string;
  igreja?: string;
}

interface Membro {
  _id: string;
  nome: string;
  dataNascimento: string;
  cargo: string;
  cpf: string;
  igreja: Igreja;
}

const cargos = [
  'Membro',
  'Líder',
  'Pastor',
  'Diácono',
  'Presbítero',
  'Evangelista',
  'Missionário',
  'Músico',
  'Professor',
  'Auxiliar'
];

type ViewMode = 'grid' | 'list';
type SortField = 'nome' | 'dataNascimento' | 'cargo' | 'igreja';
type SortOrder = 'asc' | 'desc';

interface MemberFilters {
  search: string;
  cargo: string;
  igreja: string;
  faixaEtaria: string;
}

interface MemberStats {
  total: number;
  porCargo: { cargo: string; count: number; percentage: number }[];
  porIdade: { faixa: string; count: number; percentage: number }[];
  porIgreja: { igreja: string; count: number; percentage: number }[];
  idadeMedia: number;
  cargoMaisComum: string;
}

const Members: React.FC = () => {
  const api = useApi();
  const [membros, setMembros] = useState<Membro[]>([]);
  const [igrejas, setIgrejas] = useState<Igreja[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [editId, setEditId] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState('');
  const [formData, setFormData] = useState({
    nome: '',
    dataNascimento: '',
    cargo: '',
    cpf: ''
  });
  
  // Novos estados para funcionalidades avançadas
  const [viewMode, setViewMode] = useState<ViewMode>('grid');
  const [showStats, setShowStats] = useState(true);
  const [showFilters, setShowFilters] = useState(false);
  const [sortField, setSortField] = useState<SortField>('nome');
  const [sortOrder, setSortOrder] = useState<SortOrder>('asc');
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(12);
  const [filters, setFilters] = useState<MemberFilters>({
    search: '',
    cargo: '',
    igreja: '',
    faixaEtaria: ''
  });
  const [isExporting, setIsExporting] = useState(false);
  
  const navigate = useNavigate();

  const fetchMembros = useCallback(async () => {
    try {
      const response = await api.get('/membro');
      if (response.ok) {
        const data = await response.json();
        setMembros(data);
      }
    } catch (err) {
      console.error('Erro ao carregar membros:', err);
    } finally {
      setLoading(false);
    }
  }, [api]);

  const fetchIgrejas = useCallback(async () => {
    try {
      const response = await api.get('/igrejas');
      if (response.ok) {
        const data = await response.json();
        setIgrejas(data);
      }
    } catch (err) {
      console.error('Erro ao carregar igrejas:', err);
    }
  }, [api]);

  useEffect(() => {
    fetchMembros();
    fetchIgrejas();
  }, [fetchMembros, fetchIgrejas]);

  // Função para calcular idade
  const calcularIdade = (dataNascimento: string): number => {
    const hoje = new Date();
    const nascimento = new Date(dataNascimento);
    let idade = hoje.getFullYear() - nascimento.getFullYear();
    const mesAtual = hoje.getMonth();
    const mesNascimento = nascimento.getMonth();
    
    if (mesAtual < mesNascimento || (mesAtual === mesNascimento && hoje.getDate() < nascimento.getDate())) {
      idade--;
    }
    
    return idade;
  };

  // Função para determinar faixa etária
  const getFaixaEtaria = (idade: number): string => {
    if (idade < 18) return 'Menor de 18';
    if (idade < 30) return '18-29';
    if (idade < 50) return '30-49';
    if (idade < 65) return '50-64';
    return '65+';
  };

  // Calcular estatísticas
  const memberStats = useMemo((): MemberStats => {
    if (membros.length === 0) {
      return {
        total: 0,
        porCargo: [],
        porIdade: [],
        porIgreja: [],
        idadeMedia: 0,
        cargoMaisComum: ''
      };
    }

    // Distribuição por cargo
    const cargoCount = cargos.reduce((acc, cargo) => {
      acc[cargo] = membros.filter(m => m.cargo === cargo).length;
      return acc;
    }, {} as Record<string, number>);

    const porCargo = Object.entries(cargoCount)
      .filter(([_, count]) => count > 0)
      .map(([cargo, count]) => ({
        cargo,
        count,
        percentage: (count / membros.length) * 100
      }))
      .sort((a, b) => b.count - a.count);

    // Distribuição por idade
    const idades = membros.map(m => calcularIdade(m.dataNascimento));
    const faixasEtarias = ['Menor de 18', '18-29', '30-49', '50-64', '65+'];
    const idadeCount = faixasEtarias.reduce((acc, faixa) => {
      acc[faixa] = idades.filter(idade => getFaixaEtaria(idade) === faixa).length;
      return acc;
    }, {} as Record<string, number>);

    const porIdade = Object.entries(idadeCount)
      .filter(([_, count]) => count > 0)
      .map(([faixa, count]) => ({
        faixa,
        count,
        percentage: (count / membros.length) * 100
      }));

    // Distribuição por igreja
    const igrejaCount: Record<string, number> = {};
    membros.forEach(m => {
      const nomeIgreja = m.igreja?.nome || 'Sem igreja';
      igrejaCount[nomeIgreja] = (igrejaCount[nomeIgreja] || 0) + 1;
    });

    const porIgreja = Object.entries(igrejaCount).map(([igreja, count]) => ({
      igreja,
      count,
      percentage: (count / membros.length) * 100
    })).sort((a, b) => b.count - a.count);

    // Idade média
    const idadeMedia = idades.length > 0 ? idades.reduce((sum, idade) => sum + idade, 0) / idades.length : 0;

    // Cargo mais comum
    const cargoMaisComum = porCargo.length > 0 ? porCargo[0].cargo : '';

    return {
      total: membros.length,
      porCargo,
      porIdade,
      porIgreja,
      idadeMedia,
      cargoMaisComum
    };
  }, [membros]);

  // Filtrar e ordenar membros
  const filteredAndSortedMembers = useMemo(() => {
    let filtered = membros.filter(membro => {
      const matchesSearch = membro.nome.toLowerCase().includes(filters.search.toLowerCase()) ||
                           membro.cpf.includes(filters.search);
      const matchesCargo = !filters.cargo || membro.cargo === filters.cargo;
      const matchesIgreja = !filters.igreja || membro.igreja?._id === filters.igreja;
      
      let matchesFaixaEtaria = true;
      if (filters.faixaEtaria) {
        const idade = calcularIdade(membro.dataNascimento);
        matchesFaixaEtaria = getFaixaEtaria(idade) === filters.faixaEtaria;
      }

      return matchesSearch && matchesCargo && matchesIgreja && matchesFaixaEtaria;
    });

    // Ordenar
    filtered.sort((a, b) => {
      let aValue: any;
      let bValue: any;

      switch (sortField) {
        case 'nome':
          aValue = a.nome.toLowerCase();
          bValue = b.nome.toLowerCase();
          break;
        case 'dataNascimento':
          aValue = new Date(a.dataNascimento);
          bValue = new Date(b.dataNascimento);
          break;
        case 'cargo':
          aValue = a.cargo;
          bValue = b.cargo;
          break;
        case 'igreja':
          aValue = a.igreja?.nome || '';
          bValue = b.igreja?.nome || '';
          break;
        default:
          return 0;
      }

      if (aValue < bValue) return sortOrder === 'asc' ? -1 : 1;
      if (aValue > bValue) return sortOrder === 'asc' ? 1 : -1;
      return 0;
    });

    return filtered;
  }, [membros, filters, sortField, sortOrder]);

  // Paginação
  const totalPages = Math.ceil(filteredAndSortedMembers.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const paginatedMembers = filteredAndSortedMembers.slice(startIndex, startIndex + itemsPerPage);

  const openModal = (membro?: Membro) => {
    if (membro) {
      setEditMode(true);
      setEditId(membro._id);
      setFormData({
        nome: membro.nome,
        dataNascimento: membro.dataNascimento.split('T')[0],
        cargo: membro.cargo,
        cpf: membro.cpf
      });
    } else {
      setEditMode(false);
      setEditId('');
      setFormData({
        nome: '',
        dataNascimento: '',
        cargo: '',
        cpf: ''
      });
    }
    setFormError('');
    setShowModal(true);
  };

  const closeModal = () => {
    setShowModal(false);
    setEditMode(false);
    setEditId('');
    setFormError('');
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setFormError('');

    if (!formData.nome.trim() || !formData.dataNascimento || !formData.cargo || !formData.cpf.trim()) {
      setFormError('Todos os campos são obrigatórios');
      setSubmitting(false);
      return;
    }
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        navigate('/login');
        return;
      }
              const response = editMode
          ? await api.put(`/membro/${editId}`, formData)
          : await api.post('/membro', formData);

      if (response.ok) {
        await fetchMembros();
        closeModal();
      } else {
        const error = await response.json();
        setFormError(error.error || 'Erro ao salvar membro');
      }
    } catch (err) {
      setFormError('Erro de conexão');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm('Tem certeza que deseja deletar este membro?')) return;
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        navigate('/login');
        return;
      }
      const response = await api.delete(`/membro/${id}`);
      if (response.ok) {
        await fetchMembros();
      }
    } catch (err) {
      // erro silencioso
    }
  };

  // Funções de manipulação de filtros
  const handleSearchChange = (value: string) => {
    setFilters(prev => ({ ...prev, search: value }));
    setCurrentPage(1);
  };

  const handleFilterChange = (key: keyof MemberFilters, value: string) => {
    setFilters(prev => ({ ...prev, [key]: value }));
    setCurrentPage(1);
  };

  const clearFilters = () => {
    setFilters({
      search: '',
      cargo: '',
      igreja: '',
      faixaEtaria: ''
    });
    setCurrentPage(1);
  };

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortOrder('asc');
    }
  };

  // Função de exportação para PDF
  const exportToPDF = async () => {
    setIsExporting(true);
    try {
      const doc = new jsPDF();
      
      // Cabeçalho
      doc.setFontSize(20);
      doc.setTextColor(59, 130, 246);
      doc.text('Relatório de Membros', 20, 20);
      
      doc.setFontSize(12);
      doc.setTextColor(107, 114, 128);
      doc.text(`Gerado em: ${new Date().toLocaleDateString('pt-BR')}`, 20, 30);
      doc.text(`Total de membros: ${filteredAndSortedMembers.length}`, 20, 40);

      // Estatísticas resumidas
      doc.setFontSize(14);
      doc.setTextColor(0, 0, 0);
      doc.text('Estatísticas Gerais:', 20, 55);
      
      doc.setFontSize(10);
      doc.text(`Idade média: ${memberStats.idadeMedia.toFixed(1)} anos`, 20, 65);
      doc.text(`Cargo mais comum: ${memberStats.cargoMaisComum}`, 20, 75);

      // Tabela de membros
      const tableColumn = ['Nome', 'Idade', 'Cargo', 'CPF', 'Igreja'];
      const tableRows = filteredAndSortedMembers.map(membro => [
        membro.nome,
        calcularIdade(membro.dataNascimento).toString(),
        membro.cargo,
        membro.cpf,
        membro.igreja?.nome || 'N/A'
      ]);

      (doc as any).autoTable({
        head: [tableColumn],
        body: tableRows,
        startY: 85,
        styles: { fontSize: 8 },
        headStyles: { fillColor: [59, 130, 246] }
      });

      doc.save(`relatorio_membros_${new Date().toISOString().split('T')[0]}.pdf`);
    } catch (error) {
      console.error('Erro ao exportar PDF:', error);
    } finally {
      setIsExporting(false);
    }
  };

  // Cores para gráficos
  const chartColors = ['#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6', '#F97316', '#06B6D4', '#84CC16'];

  if (loading) {
      return (
    <div className="min-h-screen flex items-center justify-center">
        <div className="text-gray-900 dark:text-white">Carregando membros...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="max-w-7xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between mb-8">
          <div className="flex items-center space-x-4 mb-4 lg:mb-0">
            <button
              onClick={() => navigate('/dashboard')}
              className="text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors p-2 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-700"
              title="Voltar ao Dashboard"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
            <div>
              <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Membros</h1>
              <p className="text-gray-600 dark:text-gray-400">
                {filteredAndSortedMembers.length} de {memberStats.total} membros
              </p>
            </div>
          </div>

          {/* Actions */}
          <div className="flex flex-wrap items-center gap-3">
            <button
              onClick={() => setShowStats(!showStats)}
              className={`flex items-center space-x-2 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                showStats ? 'bg-blue-500 text-white' : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300'
              }`}
            >
              {showStats ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              <span>Estatísticas</span>
            </button>

            <button
              onClick={() => setShowFilters(!showFilters)}
              className={`flex items-center space-x-2 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                showFilters ? 'bg-purple-500 text-white' : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300'
              }`}
            >
              <Filter className="w-4 h-4" />
              <span>Filtros</span>
            </button>

            <button
              onClick={exportToPDF}
              disabled={isExporting}
              className="flex items-center space-x-2 px-3 py-2 bg-green-500 hover:bg-green-600 text-white rounded-lg text-sm font-medium transition-colors disabled:opacity-50"
            >
              <Download className="w-4 h-4" />
              <span>{isExporting ? 'Exportando...' : 'Exportar PDF'}</span>
            </button>

          <button
            onClick={() => openModal()}
              className="flex items-center space-x-2 px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg text-sm font-medium transition-colors"
          >
            <Plus className="w-4 h-4" />
            <span>Novo Membro</span>
          </button>
        </div>
        </div>

        {/* Statistics Cards */}
        <AnimatePresence>
          {showStats && (
            <motion.div
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="mb-8"
            >
              {/* KPI Cards */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">
                <motion.div 
                  className="bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-900/20 dark:to-blue-800/20 border border-blue-200 dark:border-blue-500/20 rounded-xl p-6"
                  whileHover={{ scale: 1.02 }}
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-blue-600 dark:text-blue-400 text-sm font-medium">Total de Membros</p>
                      <p className="text-3xl font-bold text-blue-700 dark:text-blue-300">{memberStats.total}</p>
                    </div>
                    <Users className="w-8 h-8 text-blue-500" />
                  </div>
                </motion.div>

                <motion.div 
                  className="bg-gradient-to-br from-green-50 to-green-100 dark:from-green-900/20 dark:to-green-800/20 border border-green-200 dark:border-green-500/20 rounded-xl p-6"
                  whileHover={{ scale: 1.02 }}
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-green-600 dark:text-green-400 text-sm font-medium">Idade Média</p>
                      <p className="text-3xl font-bold text-green-700 dark:text-green-300">{memberStats.idadeMedia.toFixed(1)}</p>
                    </div>
                    <Calendar className="w-8 h-8 text-green-500" />
                  </div>
                  <p className="text-green-600 dark:text-green-400 text-xs mt-2">anos</p>
                </motion.div>

                <motion.div 
                  className="bg-gradient-to-br from-purple-50 to-purple-100 dark:from-purple-900/20 dark:to-purple-800/20 border border-purple-200 dark:border-purple-500/20 rounded-xl p-6"
                  whileHover={{ scale: 1.02 }}
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-purple-600 dark:text-purple-400 text-sm font-medium">Cargo Mais Comum</p>
                      <p className="text-lg font-bold text-purple-700 dark:text-purple-300">{memberStats.cargoMaisComum}</p>
                    </div>
                    <UserCheck className="w-8 h-8 text-purple-500" />
                  </div>
                </motion.div>

                <motion.div 
                  className="bg-gradient-to-br from-orange-50 to-orange-100 dark:from-orange-900/20 dark:to-orange-800/20 border border-orange-200 dark:border-orange-500/20 rounded-xl p-6"
                  whileHover={{ scale: 1.02 }}
                >
                  <div className="flex items-center justify-between">
                  <div>
                      <p className="text-orange-600 dark:text-orange-400 text-sm font-medium">Igrejas</p>
                      <p className="text-3xl font-bold text-orange-700 dark:text-orange-300">{memberStats.porIgreja.length}</p>
                    </div>
                    <BarChart3 className="w-8 h-8 text-orange-500" />
                  </div>
                </motion.div>
              </div>

              {/* Charts */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Distribuição por Cargo */}
                <div className="bg-white dark:bg-gray-800 rounded-xl p-6 border border-gray-200 dark:border-gray-700">
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Distribuição por Cargo</h3>
                  <ResponsiveContainer width="100%" height={250}>
                    <PieChart>
                      <Pie
                        data={memberStats.porCargo}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        label={({ cargo, percentage }) => `${cargo}: ${percentage.toFixed(1)}%`}
                        outerRadius={80}
                        fill="#8884d8"
                        dataKey="count"
                      >
                        {memberStats.porCargo.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={chartColors[index % chartColors.length]} />
                        ))}
                      </Pie>
                      <Tooltip formatter={(value, name) => [value, 'Membros']} />
                    </PieChart>
                  </ResponsiveContainer>
                </div>

                {/* Distribuição por Faixa Etária */}
                <div className="bg-white dark:bg-gray-800 rounded-xl p-6 border border-gray-200 dark:border-gray-700">
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Distribuição por Idade</h3>
                  <ResponsiveContainer width="100%" height={250}>
                    <BarChart data={memberStats.porIdade}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="faixa" />
                      <YAxis />
                      <Tooltip formatter={(value, name) => [value, 'Membros']} />
                      <Bar dataKey="count" fill="#3B82F6" />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Filters */}
        <AnimatePresence>
          {showFilters && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="mb-6"
            >
              <div className="bg-white dark:bg-gray-800 rounded-xl p-6 border border-gray-200 dark:border-gray-700">
                <div className="flex flex-wrap gap-4">
                  {/* Search */}
                  <div className="flex-1 min-w-64">
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Buscar
                    </label>
                    <div className="relative">
                      <Search className="w-5 h-5 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                      <input
                        type="text"
                        placeholder="Nome ou CPF..."
                        value={filters.search}
                        onChange={(e) => handleSearchChange(e.target.value)}
                        className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      />
                    </div>
                  </div>

                  {/* Cargo Filter */}
                  <div className="min-w-40">
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Cargo
                    </label>
                    <select
                      value={filters.cargo}
                      onChange={(e) => handleFilterChange('cargo', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    >
                      <option value="">Todos os cargos</option>
                      {cargos.map(cargo => (
                        <option key={cargo} value={cargo}>{cargo}</option>
                      ))}
                    </select>
                  </div>

                  {/* Igreja Filter */}
                  <div className="min-w-40">
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Igreja
                    </label>
                    <select
                      value={filters.igreja}
                      onChange={(e) => handleFilterChange('igreja', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    >
                      <option value="">Todas as igrejas</option>
                      {igrejas.map(igreja => (
                        <option key={igreja._id} value={igreja._id}>{igreja.nome}</option>
                      ))}
                    </select>
                  </div>

                  {/* Faixa Etária Filter */}
                  <div className="min-w-40">
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Faixa Etária
                    </label>
                    <select
                      value={filters.faixaEtaria}
                      onChange={(e) => handleFilterChange('faixaEtaria', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    >
                      <option value="">Todas as idades</option>
                      <option value="Menor de 18">Menor de 18</option>
                      <option value="18-29">18-29 anos</option>
                      <option value="30-49">30-49 anos</option>
                      <option value="50-64">50-64 anos</option>
                      <option value="65+">65+ anos</option>
                    </select>
                  </div>

                  {/* Clear Filters */}
                  <div className="flex items-end">
                    <button
                      onClick={clearFilters}
                      className="px-4 py-2 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors"
                    >
                      Limpar filtros
                    </button>
                  </div>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Toolbar */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-6">
          <div className="flex items-center space-x-4 mb-4 sm:mb-0">
            {/* View Mode Toggle */}
            <div className="flex rounded-lg bg-gray-200 dark:bg-gray-700 p-1">
              <button
                onClick={() => setViewMode('grid')}
                className={`flex items-center space-x-2 px-3 py-1 rounded-md text-sm font-medium transition-colors ${
                  viewMode === 'grid' 
                    ? 'bg-white dark:bg-gray-600 text-gray-900 dark:text-white shadow-sm' 
                    : 'text-gray-600 dark:text-gray-400'
                }`}
              >
                <Grid3X3 className="w-4 h-4" />
                <span>Grid</span>
              </button>
              <button
                onClick={() => setViewMode('list')}
                className={`flex items-center space-x-2 px-3 py-1 rounded-md text-sm font-medium transition-colors ${
                  viewMode === 'list' 
                    ? 'bg-white dark:bg-gray-600 text-gray-900 dark:text-white shadow-sm' 
                    : 'text-gray-600 dark:text-gray-400'
                }`}
              >
                <List className="w-4 h-4" />
                <span>Lista</span>
              </button>
            </div>

            {/* Sort Options */}
            <div className="flex items-center space-x-2">
              <span className="text-sm text-gray-600 dark:text-gray-400">Ordenar por:</span>
              <div className="flex rounded-lg bg-gray-200 dark:bg-gray-700 p-1">
                {[
                  { field: 'nome' as SortField, label: 'Nome' },
                  { field: 'dataNascimento' as SortField, label: 'Idade' },
                  { field: 'cargo' as SortField, label: 'Cargo' }
                ].map(({ field, label }) => (
                  <button
                    key={field}
                    onClick={() => handleSort(field)}
                    className={`flex items-center space-x-1 px-2 py-1 rounded text-xs font-medium transition-colors ${
                      sortField === field 
                        ? 'bg-white dark:bg-gray-600 text-gray-900 dark:text-white shadow-sm' 
                        : 'text-gray-600 dark:text-gray-400'
                    }`}
                  >
                    <span>{label}</span>
                    {sortField === field && (
                      sortOrder === 'asc' ? <SortAsc className="w-3 h-3" /> : <SortDesc className="w-3 h-3" />
                    )}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Results Info */}
          <div className="text-sm text-gray-600 dark:text-gray-400">
            Mostrando {startIndex + 1}-{Math.min(startIndex + itemsPerPage, filteredAndSortedMembers.length)} de {filteredAndSortedMembers.length} membros
          </div>
        </div>

        {/* Members Content */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700">
          {filteredAndSortedMembers.length === 0 ? (
            <div className="p-12 text-center">
              <Users className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">Nenhum membro encontrado</h3>
              <p className="text-gray-600 dark:text-gray-400">
                {filters.search || filters.cargo || filters.igreja || filters.faixaEtaria 
                  ? 'Tente ajustar os filtros para encontrar mais resultados.'
                  : 'Comece adicionando o primeiro membro da igreja.'
                }
              </p>
            </div>
          ) : viewMode === 'grid' ? (
            <div className="p-6">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {paginatedMembers.map((membro) => (
                  <motion.div
                    key={membro._id}
                    layout
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4 hover:shadow-md transition-all duration-200"
                  >
                    <div className="flex items-center justify-between mb-3">
                      <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center">
                        <span className="text-white font-semibold text-sm">
                          {membro.nome.charAt(0).toUpperCase()}
                        </span>
                      </div>
                      <div className="flex space-x-1">
                        <button
                          onClick={() => openModal(membro)}
                          className="p-1 text-blue-500 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded"
                          title="Editar"
                    >
                      <Edit className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handleDelete(membro._id)}
                          className="p-1 text-red-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded"
                      title="Deletar"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                    <h3 className="font-semibold text-gray-900 dark:text-white text-sm mb-1 truncate">
                      {membro.nome}
                    </h3>
                    
                    <div className="space-y-1 text-xs text-gray-600 dark:text-gray-400">
                      <div className="flex items-center justify-between">
                        <span>Idade:</span>
                        <span>{calcularIdade(membro.dataNascimento)} anos</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span>Cargo:</span>
                        <span className="bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-300 px-2 py-0.5 rounded-full text-xs">
                          {membro.cargo}
                        </span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span>Igreja:</span>
                        <span className="truncate max-w-20" title={membro.igreja?.nome}>
                          {membro.igreja?.nome || 'N/A'}
                        </span>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>
            </div>
          ) : (
            <div className="overflow-hidden">
              <table className="w-full">
                <thead className="bg-gray-50 dark:bg-gray-700">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      Nome
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      Idade
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      Cargo
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      CPF
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      Igreja
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      Ações
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                  {paginatedMembers.map((membro, index) => (
                    <motion.tr
                      key={membro._id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.05 }}
                      className="hover:bg-gray-50 dark:hover:bg-gray-700"
                    >
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center mr-3">
                            <span className="text-white font-semibold text-xs">
                              {membro.nome.charAt(0).toUpperCase()}
                            </span>
                          </div>
                          <div className="text-sm font-medium text-gray-900 dark:text-white">
                            {membro.nome}
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600 dark:text-gray-400">
                        {calcularIdade(membro.dataNascimento)} anos
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-300">
                          {membro.cargo}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600 dark:text-gray-400">
                        {membro.cpf}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600 dark:text-gray-400">
                        {membro.igreja?.nome || 'N/A'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <div className="flex justify-end space-x-2">
                          <button
                            onClick={() => openModal(membro)}
                            className="text-blue-500 hover:text-blue-600 p-1 rounded"
                            title="Editar"
                          >
                            <Edit className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleDelete(membro._id)}
                            className="text-red-500 hover:text-red-600 p-1 rounded"
                            title="Deletar"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </motion.tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="px-6 py-3 bg-gray-50 dark:bg-gray-700 border-t border-gray-200 dark:border-gray-600">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <button
                    onClick={() => setCurrentPage(currentPage - 1)}
                    disabled={currentPage === 1}
                    className="px-3 py-1 text-sm border border-gray-300 dark:border-gray-600 rounded-md disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-100 dark:hover:bg-gray-600"
                  >
                    Anterior
                  </button>
                  
                  <div className="flex space-x-1">
                    {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                      const pageNum = i + 1;
                      return (
                        <button
                          key={pageNum}
                          onClick={() => setCurrentPage(pageNum)}
                          className={`px-3 py-1 text-sm rounded-md ${
                            currentPage === pageNum
                              ? 'bg-blue-500 text-white'
                              : 'border border-gray-300 dark:border-gray-600 hover:bg-gray-100 dark:hover:bg-gray-600'
                          }`}
                        >
                          {pageNum}
                        </button>
                      );
                    })}
                  </div>

                  <button
                    onClick={() => setCurrentPage(currentPage + 1)}
                    disabled={currentPage === totalPages}
                    className="px-3 py-1 text-sm border border-gray-300 dark:border-gray-600 rounded-md disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-100 dark:hover:bg-gray-600"
                  >
                    Próximo
                  </button>
                </div>

                <div className="text-sm text-gray-600 dark:text-gray-400">
                  Página {currentPage} de {totalPages}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
      {/* Modal de cadastro/edição */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-900 rounded-xl p-8 w-full max-w-md relative border border-gray-200 dark:border-gray-700">
            <button
              className="absolute top-3 right-3 text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-white"
              onClick={closeModal}
            >
              <X className="w-5 h-5" />
            </button>
            <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-6">{editMode ? 'Editar Membro' : 'Novo Membro'}</h3>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-gray-700 dark:text-gray-300 mb-1">Nome</label>
                <input
                  type="text"
                  name="nome"
                  value={formData.nome}
                  onChange={handleChange}
                  className="w-full rounded-lg bg-gray-100 dark:bg-gray-800 text-gray-900 dark:text-white px-3 py-2 focus:outline-none border border-gray-300 dark:border-gray-600"
                  required
                />
              </div>
              <div>
                <label className="block text-gray-700 dark:text-gray-300 mb-1">Data de Nascimento</label>
                <input
                  type="date"
                  name="dataNascimento"
                  value={formData.dataNascimento}
                  onChange={handleChange}
                  className="w-full rounded-lg bg-gray-100 dark:bg-gray-800 text-gray-900 dark:text-white px-3 py-2 focus:outline-none border border-gray-300 dark:border-gray-600"
                  required
                />
              </div>
              <div>
                <label className="block text-gray-700 dark:text-gray-300 mb-1">Cargo</label>
                <select
                  name="cargo"
                  value={formData.cargo}
                  onChange={handleChange}
                  className="w-full rounded-lg bg-gray-100 dark:bg-gray-800 text-gray-900 dark:text-white px-3 py-2 focus:outline-none border border-gray-300 dark:border-gray-600"
                  required
                >
                  {cargos.map((cargo) => (
                    <option key={cargo} value={cargo}>{cargo}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-gray-700 dark:text-gray-300 mb-1">CPF</label>
                <input
                  type="text"
                  name="cpf"
                  value={formData.cpf}
                  onChange={handleChange}
                  className="w-full rounded-lg bg-gray-100 dark:bg-gray-800 text-gray-900 dark:text-white px-3 py-2 focus:outline-none border border-gray-300 dark:border-gray-600"
                  required
                  maxLength={14}
                />
              </div>
              {formError && <div className="text-red-500 dark:text-red-400 text-sm">{formError}</div>}
              <button
                type="submit"
                className="w-full bg-blue-500 hover:bg-blue-600 text-white py-2 rounded-lg font-semibold transition-colors"
                disabled={submitting}
              >
                {submitting ? 'Salvando...' : editMode ? 'Salvar Alterações' : 'Cadastrar'}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Members; 