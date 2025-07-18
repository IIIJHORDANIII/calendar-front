import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { 
  DollarSign, 
  TrendingUp, 
  TrendingDown, 
  Calendar, 
  Church, 
  Plus, 
  Edit, 
  Trash2, 
  ArrowLeft,
  BarChart3,
  PieChart,
  Download,
  X
} from 'lucide-react';

interface Igreja {
  _id: string;
  nome: string;
  tipo: string;
}

interface Dizimo {
  _id: string;
  igreja: Igreja;
  mes: string;
  ano: number;
  valorDizimos: number;
  valorOfertas: number;
  valorEspeciais: number;
  total: number;
  observacoes?: string;
  createdAt: string;
  updatedAt: string;
}

interface Membro {
  _id: string;
  nome: string;
  igreja: Igreja;
}

const Tithes: React.FC = () => {
  const navigate = useNavigate();
  const [dizimos, setDizimos] = useState<Dizimo[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [filterIgreja, setFilterIgreja] = useState('all');
  const [filterAno, setFilterAno] = useState(new Date().getFullYear().toString());
  const [membros, setMembros] = useState<Membro[]>([]);
  const [selectedMembro, setSelectedMembro] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [formData, setFormData] = useState({
    igreja: '',
    mes: '',
    ano: new Date().getFullYear().toString(),
    valorDizimos: '',
    valorOfertas: '',
    valorEspeciais: '',
    observacoes: '',
  });
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState('');
  const [user, setUser] = useState<any>(null);
  const [selectedMatriz, setSelectedMatriz] = useState<Igreja | null>(null);
  const [showCongregacoes, setShowCongregacoes] = useState(false);

  useEffect(() => {
    const userData = localStorage.getItem('user');
    if (userData) {
      setUser(JSON.parse(userData));
    }
    fetchDizimos();
    fetchMembros();
  }, []);

  const handleViewMatrizCongregacoes = (matriz: Igreja) => {
    setSelectedMatriz(matriz);
    setShowCongregacoes(true);
  };

  const handleBackToMatrizes = () => {
    setSelectedMatriz(null);
    setShowCongregacoes(false);
  };

  const fetchDizimos = async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        navigate('/login');
        return;
      }

      const response = await fetch('http://localhost:3005/dizimo', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.ok) {
        const data = await response.json();
        setDizimos(Array.isArray(data) ? data : []);
      } else {
        setError('Erro ao carregar dízimos');
      }
    } catch (error) {
      setError('Erro de conexão');
    } finally {
      setLoading(false);
    }
  };

  const fetchMembros = async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) return;
      const response = await fetch('http://localhost:3005/membro', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (response.ok) {
        const data = await response.json();
        setMembros(data);
      }
    } catch (err) {}
  };

  const filteredDizimos = dizimos.filter(dizimo => {
    const matchesIgreja = filterIgreja === 'all' || (dizimo.igreja && dizimo.igreja._id === filterIgreja);
    const matchesAno = dizimo.ano !== undefined && dizimo.ano !== null && dizimo.ano.toString() === filterAno;
    
    // Para admin, filtrar por hierarquia matriz → congregações
    if (user?.role === 'admin') {
      if (showCongregacoes && selectedMatriz) {
        // Se está vendo congregações, mostrar apenas dízimos das congregações da matriz selecionada
        return matchesAno && dizimo.igreja && dizimo.igreja.tipo === 'congregacao' && 
               dizimo.igreja._id !== selectedMatriz._id; // Excluir a própria matriz
      } else {
        // Se está vendo matrizes, mostrar apenas dízimos das matrizes
        return matchesAno && dizimo.igreja && dizimo.igreja.tipo === 'sede';
      }
    }
    
    return matchesIgreja && matchesAno;
  });

  const totalGeral = filteredDizimos.reduce((sum, dizimo) => sum + dizimo.total, 0);
  const totalDizimos = filteredDizimos.reduce((sum, dizimo) => sum + dizimo.valorDizimos, 0);
  const totalOfertas = filteredDizimos.reduce((sum, dizimo) => sum + dizimo.valorOfertas, 0);
  const totalEspeciais = filteredDizimos.reduce((sum, dizimo) => sum + dizimo.valorEspeciais, 0);

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value);
  };

  const getMesLabel = (mes: string) => {
    const meses = {
      '01': 'Janeiro', '02': 'Fevereiro', '03': 'Março', '04': 'Abril',
      '05': 'Maio', '06': 'Junho', '07': 'Julho', '08': 'Agosto',
      '09': 'Setembro', '10': 'Outubro', '11': 'Novembro', '12': 'Dezembro'
    };
    return meses[mes as keyof typeof meses] || mes;
  };

  const getAnosDisponiveis = () => {
    const anos = Array.from(new Set(dizimos.map(d => d.ano).filter(ano => ano !== undefined && ano !== null)) ).sort((a, b) => b - a);
    return anos.length > 0 ? anos : [new Date().getFullYear()];
  };

  // Função para excluir dízimo
  const handleDeleteDizimo = async (id: string) => {
    if (!window.confirm('Tem certeza que deseja excluir este registro de dízimo?')) return;
    try {
      const token = localStorage.getItem('token');
      if (!token) return;
      const response = await fetch(`http://localhost:3005/dizimo/${id}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (response.ok) {
        await fetchDizimos();
      } else {
        alert('Erro ao excluir dízimo.');
      }
    } catch (err) {
      alert('Erro de conexão ao excluir dízimo.');
    }
  };

  if (loading) {
      return (
    <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
          <p className="text-gray-900 dark:text-white">Carregando dízimos...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen">
      {/* Header */}
      <header className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center">
              <button
                onClick={() => navigate('/dashboard')}
                className="text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors mr-4"
              >
                <ArrowLeft className="w-6 h-6" />
              </button>
              <DollarSign className="w-8 h-8 text-blue-500 mr-3" />
              <h1 className="text-xl font-bold text-gray-900 dark:text-white">Gerenciar Dízimos</h1>
            </div>
            
            <button
              className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-lg flex items-center space-x-2 transition-colors"
              onClick={() => setShowModal(true)}
            >
              <Plus className="w-4 h-4" />
              <span>
                {showCongregacoes && selectedMatriz 
                  ? 'Novo Registro Congregação'
                  : user?.role === 'admin' 
                    ? 'Novo Registro Matriz'
                    : 'Novo Registro'
                }
              </span>
            </button>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Page Header */}
        <motion.div
          className="mb-8"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
        >
          {showCongregacoes && selectedMatriz ? (
            <div className="flex items-center space-x-4">
              <button
                onClick={handleBackToMatrizes}
                className="text-gray-400 hover:text-white transition-colors p-2 rounded-lg hover:bg-gray-700"
                title="Voltar para matrizes"
              >
                <ArrowLeft className="w-5 h-5" />
              </button>
              <div>
                <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
                  Dízimos das Congregações - {selectedMatriz.nome}
                </h2>
                <p className="text-gray-600 dark:text-gray-400">
                  Gerencie os dízimos e ofertas das congregações desta matriz
                </p>
              </div>
            </div>
          ) : (
            <>
              <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
                {user?.role === 'admin' ? 'Dízimos das Matrizes' : 'Dízimos e Ofertas'}
              </h2>
              <p className="text-gray-600 dark:text-gray-400">
                {user?.role === 'admin' 
                  ? 'Gerencie os dízimos e ofertas das igrejas matriz' 
                  : 'Gerencie os dízimos e ofertas das igrejas'
                }
              </p>
            </>
          )}
        </motion.div>

        {/* Error Message */}
        {error && (
          <motion.div
            className="mb-6 p-4 bg-red-500/10 border border-red-500/20 rounded-lg text-red-400"
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
          >
            {error}
          </motion.div>
        )}

        {/* Stats */}
        <motion.div
          className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.1 }}
        >
          {showCongregacoes && selectedMatriz ? (
            <>
              <div className="bg-white dark:bg-gradient-to-br dark:from-gray-800 dark:to-gray-900 border border-gray-200 dark:border-blue-500/20 rounded-xl p-6 shadow-lg">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-gray-600 dark:text-gray-400 text-sm">Matriz</p>
                    <p className="text-lg font-bold text-gray-900 dark:text-white">{selectedMatriz.nome}</p>
                  </div>
                  <Church className="w-8 h-8 text-blue-500" />
                </div>
              </div>

              <div className="bg-white dark:bg-gradient-to-br dark:from-gray-800 dark:to-gray-900 border border-gray-200 dark:border-green-500/20 rounded-xl p-6 shadow-lg">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-gray-600 dark:text-gray-400 text-sm">Total Geral</p>
                    <p className="text-2xl font-bold text-gray-900 dark:text-white">{formatCurrency(totalGeral)}</p>
                  </div>
                  <DollarSign className="w-8 h-8 text-green-500" />
                </div>
              </div>

              <div className="bg-white dark:bg-gradient-to-br dark:from-gray-800 dark:to-gray-900 border border-gray-200 dark:border-yellow-500/20 rounded-xl p-6 shadow-lg">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-gray-600 dark:text-gray-400 text-sm">Dízimos</p>
                    <p className="text-2xl font-bold text-gray-900 dark:text-white">{formatCurrency(totalDizimos)}</p>
                  </div>
                  <TrendingUp className="w-8 h-8 text-yellow-500" />
                </div>
              </div>

              <div className="bg-white dark:bg-gradient-to-br dark:from-gray-800 dark:to-gray-900 border border-gray-200 dark:border-purple-500/20 rounded-xl p-6 shadow-lg">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-gray-600 dark:text-gray-400 text-sm">Ofertas</p>
                    <p className="text-2xl font-bold text-gray-900 dark:text-white">{formatCurrency(totalOfertas)}</p>
                  </div>
                  <BarChart3 className="w-8 h-8 text-purple-500" />
                </div>
              </div>
            </>
          ) : (
            <>
              <div className="bg-white dark:bg-gradient-to-br dark:from-gray-800 dark:to-gray-900 border border-gray-200 dark:border-blue-500/20 rounded-xl p-6 shadow-lg">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-gray-600 dark:text-gray-400 text-sm">Total Geral</p>
                    <p className="text-2xl font-bold text-gray-900 dark:text-white">{formatCurrency(totalGeral)}</p>
                  </div>
                  <DollarSign className="w-8 h-8 text-blue-500" />
                </div>
              </div>

              <div className="bg-white dark:bg-gradient-to-br dark:from-gray-800 dark:to-gray-900 border border-gray-200 dark:border-green-500/20 rounded-xl p-6 shadow-lg">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-gray-600 dark:text-gray-400 text-sm">Dízimos</p>
                    <p className="text-2xl font-bold text-gray-900 dark:text-white">{formatCurrency(totalDizimos)}</p>
                  </div>
                  <TrendingUp className="w-8 h-8 text-green-500" />
                </div>
              </div>

              <div className="bg-white dark:bg-gradient-to-br dark:from-gray-800 dark:to-gray-900 border border-gray-200 dark:border-yellow-500/20 rounded-xl p-6 shadow-lg">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-gray-600 dark:text-gray-400 text-sm">Ofertas</p>
                    <p className="text-2xl font-bold text-gray-900 dark:text-white">{formatCurrency(totalOfertas)}</p>
                  </div>
                  <BarChart3 className="w-8 h-8 text-yellow-500" />
                </div>
              </div>

              <div className="bg-white dark:bg-gradient-to-br dark:from-gray-800 dark:to-gray-900 border border-gray-200 dark:border-purple-500/20 rounded-xl p-6 shadow-lg">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-gray-600 dark:text-gray-400 text-sm">Especiais</p>
                    <p className="text-2xl font-bold text-gray-900 dark:text-white">{formatCurrency(totalEspeciais)}</p>
                  </div>
                  <PieChart className="w-8 h-8 text-purple-500" />
                </div>
              </div>
            </>
          )}
        </motion.div>

        {/* Filters */}
        <motion.div
          className="bg-white dark:bg-gradient-to-br dark:from-gray-800 dark:to-gray-900 border border-gray-200 dark:border-blue-500/20 rounded-xl p-6 shadow-lg mb-8"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.2 }}
        >
          <div className="flex flex-col md:flex-row gap-4">
            {!showCongregacoes && (
              <div className="flex-1">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  {user?.role === 'admin' ? 'Matriz' : 'Igreja'}
                </label>
                <select
                  value={filterIgreja}
                  onChange={(e) => setFilterIgreja(e.target.value)}
                  className="w-full px-4 py-3 bg-gray-100 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-300"
                >
                  <option value="all">
                    {user?.role === 'admin' ? 'Todas as Matrizes' : 'Todas as Igrejas'}
                  </option>
                  {Array.from(new Set(dizimos.filter(d => d.igreja).map(d => d.igreja._id))).map(igrejaId => {
                    const igreja = dizimos.find(d => d.igreja && d.igreja._id === igrejaId)?.igreja;
                    return (
                      <option key={igrejaId} value={igrejaId}>
                        {igreja?.nome}
                      </option>
                    );
                  })}
                </select>
              </div>
            )}

            <div className="flex-1">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Ano</label>
              <select
                value={filterAno}
                onChange={(e) => setFilterAno(e.target.value)}
                className="w-full px-4 py-3 bg-gray-100 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-300"
              >
                {getAnosDisponiveis().map(ano => (
                  <option key={ano} value={ano.toString()}>
                    {ano}
                  </option>
                ))}
              </select>
            </div>

                          <div className="flex items-end">
                <button className="bg-gray-600 hover:bg-gray-700 text-white px-4 py-3 rounded-lg flex items-center space-x-2 transition-colors">
                  <Download className="w-4 h-4" />
                  <span>Exportar</span>
                </button>
              </div>
          </div>
        </motion.div>

        {/* Dizimos List */}
        <motion.div
          className="space-y-4"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.3 }}
        >
          {filteredDizimos.length > 0 ? (
            filteredDizimos.filter(dizimo => dizimo.igreja).map((dizimo, index) => (
              <motion.div
                key={dizimo._id}
                className={`bg-white dark:bg-gradient-to-br dark:from-gray-800 dark:to-gray-900 border border-gray-200 dark:border-blue-500/20 rounded-xl p-6 shadow-lg ${
                  user?.role === 'admin' && !showCongregacoes && dizimo.igreja.tipo === 'sede' 
                    ? 'cursor-pointer' 
                    : ''
                }`}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.4 + index * 0.05 }}
                whileHover={{ y: -2 }}
                onClick={() => {
                  if (user?.role === 'admin' && !showCongregacoes && dizimo.igreja.tipo === 'sede') {
                    handleViewMatrizCongregacoes(dizimo.igreja);
                  }
                }}
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center space-x-3 mb-4">
                      <Church className="w-5 h-5 text-blue-500" />
                      <h3 className="text-lg font-semibold text-gray-900 dark:text-white">{dizimo.igreja.nome}</h3>
                      <span className="px-2 py-1 bg-blue-500 text-white text-xs rounded-full">
                        {getMesLabel(dizimo.mes)} {dizimo.ano}
                      </span>
                      {user?.role === 'admin' && !showCongregacoes && dizimo.igreja.tipo === 'sede' && (
                        <span className="px-2 py-1 bg-green-500 text-white text-xs rounded-full">
                          Clique para ver congregações
                        </span>
                      )}
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-4">
                      <div className="p-3 bg-gray-100 dark:bg-gray-700 rounded-lg">
                        <p className="text-sm text-gray-600 dark:text-gray-400">Dízimos</p>
                        <p className="text-lg font-semibold text-green-600 dark:text-green-400">{formatCurrency(dizimo.valorDizimos)}</p>
                      </div>
                      <div className="p-3 bg-gray-100 dark:bg-gray-700 rounded-lg">
                        <p className="text-sm text-gray-600 dark:text-gray-400">Ofertas</p>
                        <p className="text-lg font-semibold text-yellow-600 dark:text-yellow-400">{formatCurrency(dizimo.valorOfertas)}</p>
                      </div>
                      <div className="p-3 bg-gray-100 dark:bg-gray-700 rounded-lg">
                        <p className="text-sm text-gray-600 dark:text-gray-400">Especiais</p>
                        <p className="text-lg font-semibold text-purple-600 dark:text-purple-400">{formatCurrency(dizimo.valorEspeciais)}</p>
                      </div>
                      <div className="p-3 bg-blue-100 dark:bg-blue-500/20 rounded-lg border border-blue-200 dark:border-blue-500/30">
                        <p className="text-sm text-gray-600 dark:text-gray-400">Total</p>
                        <p className="text-lg font-semibold text-blue-600 dark:text-blue-400">{formatCurrency(dizimo.total)}</p>
                      </div>
                    </div>

                    {dizimo.observacoes && (
                      <div className="mb-4 p-3 bg-gray-100 dark:bg-gray-700 rounded-lg">
                        <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">Observações:</p>
                        <p className="text-gray-900 dark:text-white text-sm">{dizimo.observacoes}</p>
                      </div>
                    )}

                    <div className="flex items-center space-x-4 text-xs text-gray-500 dark:text-gray-400">
                      <span>Registrado em: {new Date(dizimo.createdAt).toLocaleDateString('pt-BR')}</span>
                      <span>Atualizado em: {new Date(dizimo.updatedAt).toLocaleDateString('pt-BR')}</span>
                    </div>
                  </div>
                  
                  <div className="flex items-center space-x-2 ml-4">
                    <button className="text-gray-500 dark:text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 transition-colors p-2">
                      <Edit className="w-4 h-4" />
                    </button>
                    <button className="text-gray-500 dark:text-gray-400 hover:text-red-600 dark:hover:text-red-400 transition-colors p-2" onClick={() => handleDeleteDizimo(dizimo._id)}>
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
          </div>
        </motion.div>
            ))
          ) : (
          <motion.div
            className="text-center py-12"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.6 }}
          >
              <DollarSign className="w-16 h-16 text-gray-500 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-gray-600 dark:text-gray-400 mb-2">
              {showCongregacoes && selectedMatriz 
                ? 'Nenhum dízimo das congregações encontrado'
                : user?.role === 'admin' 
                  ? 'Nenhum dízimo das matrizes encontrado'
                  : 'Nenhum registro encontrado'
              }
            </h3>
            <p className="text-gray-500 dark:text-gray-400 mb-6">
              {showCongregacoes && selectedMatriz 
                ? 'Esta matriz ainda não possui dízimos registrados de suas congregações'
                : user?.role === 'admin' 
                  ? 'Comece registrando o primeiro dízimo de uma matriz'
                  : filterIgreja !== 'all' || filterAno !== new Date().getFullYear().toString()
                    ? 'Tente ajustar os filtros de busca' 
                    : 'Comece registrando o primeiro dízimo do sistema'
              }
            </p>
              <button className="bg-blue-500 hover:bg-blue-600 text-white px-6 py-3 rounded-lg flex items-center space-x-2 mx-auto transition-colors" onClick={() => setShowModal(true)}>
                <Plus className="w-4 h-4" />
                <span>
                  {showCongregacoes && selectedMatriz 
                    ? 'Registrar Primeiro Dízimo das Congregações'
                    : user?.role === 'admin' 
                      ? 'Registrar Primeiro Dízimo das Matrizes'
                      : 'Registrar Primeiro Dízimo'
                  }
                </span>
              </button>
          </motion.div>
        )}
        </motion.div>
      </div>

      {/* Modal de registro de dízimo */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-900 rounded-xl p-8 w-full max-w-md relative border border-gray-200 dark:border-gray-700">
            <button
              className="absolute top-3 right-3 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white"
              onClick={() => setShowModal(false)}
            >
              <X className="w-5 h-5" />
            </button>
            <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-6">
              {showCongregacoes && selectedMatriz 
                ? 'Registrar Dízimo das Congregações'
                : user?.role === 'admin' 
                  ? 'Registrar Dízimo das Matrizes'
                  : 'Registrar Dízimo'
              }
            </h3>
            <form onSubmit={async (e) => {
              e.preventDefault();
              setSubmitting(true);
              setFormError('');
              if (!formData.mes || !formData.ano || !formData.valorDizimos || !selectedMembro) {
                setFormError('Preencha todos os campos obrigatórios');
                setSubmitting(false);
                return;
              }
              try {
                const token = localStorage.getItem('token');
                if (!token) return;
                // Buscar o membro selecionado para obter o ID da igreja
                const membroObj = membros.find(m => m._id === selectedMembro);
                const igrejaId = membroObj ? membroObj.igreja._id : '';
                const requestData = { ...formData, membro: selectedMembro, igreja: igrejaId };
                const response = await fetch('http://localhost:3005/dizimo', {
                  method: 'POST',
                  headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json',
                  },
                  body: JSON.stringify(requestData),
                });
                if (response.ok) {
                  await fetchDizimos();
                  setShowModal(false);
                  setFormData({ igreja: '', mes: '', ano: new Date().getFullYear().toString(), valorDizimos: '', valorOfertas: '', valorEspeciais: '', observacoes: '' });
                  setSelectedMembro('');
                } else {
                  const error = await response.json();
                  setFormError(error.error || 'Erro ao registrar dízimo');
                }
              } catch (err) {
                setFormError('Erro de conexão');
              } finally {
                setSubmitting(false);
              }
            }} className="space-y-4">
              <div>
                <label className="block text-gray-700 dark:text-gray-300 mb-1">Membro</label>
                <select
                  value={selectedMembro}
                  onChange={e => setSelectedMembro(e.target.value)}
                  className="w-full rounded-lg bg-gray-100 dark:bg-gray-800 text-gray-900 dark:text-white border border-gray-300 dark:border-gray-600 px-3 py-2 focus:outline-none"
                  required
                >
                  <option value="">Selecione o membro</option>
                  {membros.map(m => (
                    <option key={m._id} value={m._id}>{m.nome}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-gray-700 dark:text-gray-300 mb-1">Mês</label>
                <select
                  name="mes"
                  value={formData.mes}
                  onChange={e => setFormData({ ...formData, mes: e.target.value })}
                  className="w-full rounded-lg bg-gray-100 dark:bg-gray-800 text-gray-900 dark:text-white border border-gray-300 dark:border-gray-600 px-3 py-2 focus:outline-none"
                  required
                >
                  <option value="">Selecione o mês</option>
                  <option value="01">Janeiro</option>
                  <option value="02">Fevereiro</option>
                  <option value="03">Março</option>
                  <option value="04">Abril</option>
                  <option value="05">Maio</option>
                  <option value="06">Junho</option>
                  <option value="07">Julho</option>
                  <option value="08">Agosto</option>
                  <option value="09">Setembro</option>
                  <option value="10">Outubro</option>
                  <option value="11">Novembro</option>
                  <option value="12">Dezembro</option>
                </select>
              </div>
              <div>
                <label className="block text-gray-700 dark:text-gray-300 mb-1">Ano</label>
                <input
                  type="text"
                  name="ano"
                  value={formData.ano}
                  onChange={e => setFormData({ ...formData, ano: e.target.value })}
                  className="w-full rounded-lg bg-gray-100 dark:bg-gray-800 text-gray-900 dark:text-white border border-gray-300 dark:border-gray-600 px-3 py-2 focus:outline-none"
                  required
                />
              </div>
              <div>
                <label className="block text-gray-700 dark:text-gray-300 mb-1">Valor Dízimos</label>
                <input
                  type="number"
                  name="valorDizimos"
                  value={formData.valorDizimos}
                  onChange={e => setFormData({ ...formData, valorDizimos: e.target.value })}
                  className="w-full rounded-lg bg-gray-100 dark:bg-gray-800 text-gray-900 dark:text-white border border-gray-300 dark:border-gray-600 px-3 py-2 focus:outline-none"
                  required
                />
              </div>
              <div>
                <label className="block text-gray-700 dark:text-gray-300 mb-1">Valor Ofertas</label>
                <input
                  type="number"
                  name="valorOfertas"
                  value={formData.valorOfertas}
                  onChange={e => setFormData({ ...formData, valorOfertas: e.target.value })}
                  className="w-full rounded-lg bg-gray-100 dark:bg-gray-800 text-gray-900 dark:text-white border border-gray-300 dark:border-gray-600 px-3 py-2 focus:outline-none"
                />
              </div>
              <div>
                <label className="block text-gray-700 dark:text-gray-300 mb-1">Valor Especiais</label>
                <input
                  type="number"
                  name="valorEspeciais"
                  value={formData.valorEspeciais}
                  onChange={e => setFormData({ ...formData, valorEspeciais: e.target.value })}
                  className="w-full rounded-lg bg-gray-100 dark:bg-gray-800 text-gray-900 dark:text-white border border-gray-300 dark:border-gray-600 px-3 py-2 focus:outline-none"
                />
              </div>
              <div>
                <label className="block text-gray-700 dark:text-gray-300 mb-1">Observações</label>
                <textarea
                  name="observacoes"
                  value={formData.observacoes}
                  onChange={e => setFormData({ ...formData, observacoes: e.target.value })}
                  className="w-full rounded-lg bg-gray-100 dark:bg-gray-800 text-gray-900 dark:text-white border border-gray-300 dark:border-gray-600 px-3 py-2 focus:outline-none"
                  rows={2}
                />
              </div>
              {formError && <div className="text-red-500 dark:text-red-400 text-sm">{formError}</div>}
              <button
                type="submit"
                className="w-full bg-blue-500 hover:bg-blue-600 text-white py-2 rounded-lg font-semibold transition-colors"
                disabled={submitting}
              >
                {submitting ? 'Salvando...' : 'Registrar'}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Tithes; 