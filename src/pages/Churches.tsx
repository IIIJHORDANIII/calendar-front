import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { 
  Church, 
  MapPin, 
  Users, 
  Calendar, 
  Plus, 
  Edit, 
  Trash2, 
  ArrowLeft,
  Building,
  Home,
  X,
  Save,
  AlertCircle,
  Mail,
  Phone
} from 'lucide-react';
import { useApi } from '../utils/api';

interface Igreja {
  _id: string;
  nome: string;
  tipo: string;
  endereco: string;
  sede?: string;
  banners: string[];
  createdAt: string;
  updatedAt: string;
}

interface User {
  _id: string;
  nome: string;
  email: string;
  role: string;
  igreja?: string;
}

interface Pastor {
  _id?: string;
  nome: string;
  email: string;
  telefone: string;
  cargo: string;
  igreja?: string;
  biografia: string;
  foto: string;
  frase?: string;
}

interface Diretoria {
  id: string;
  nome: string;
  email: string;
  telefone?: string;
  cargo: string;
  foto?: string;
}

const Churches: React.FC = () => {
  const navigate = useNavigate();
  const api = useApi();
  const [igrejas, setIgrejas] = useState<Igreja[]>([]);
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [formData, setFormData] = useState({
    nome: '',
    endereco: '',
    tipo: 'congregacao'
  });
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState('');
  const [userFields, setUserFields] = useState({ nome: '', email: '', senha: '' });
  const [editMode, setEditMode] = useState(false);
  const [editIgrejaId, setEditIgrejaId] = useState<string | null>(null);
  const [selectedMatriz, setSelectedMatriz] = useState<Igreja | null>(null);
  const [showCongregacoes, setShowCongregacoes] = useState(false);
  const [showPastoresDiretoria, setShowPastoresDiretoria] = useState(false);
  const [selectedIgrejaPastores, setSelectedIgrejaPastores] = useState<Igreja | null>(null);
  const [pastores, setPastores] = useState<Pastor[]>([]);
  const [diretoria, setDiretoria] = useState<Diretoria[]>([]);
  const [loadingPastores, setLoadingPastores] = useState(false);

  const fetchIgrejas = useCallback(async () => {
    try {
      const response = await api.get('/igrejas');

      if (response.ok) {
        const data = await response.json();
        setIgrejas(data);
      } else {
        setError('Erro ao carregar igrejas');
      }
    } catch (error) {
      setError('Erro de conexão');
    } finally {
      setLoading(false);
    }
  }, [api]);

  useEffect(() => {
    const userData = localStorage.getItem('user');
    if (userData) {
      setUser(JSON.parse(userData));
    }
    fetchIgrejas();
  }, [fetchIgrejas]);

  // Redirecionar congregação
  useEffect(() => {
    if (user?.role === 'congregacao') {
      navigate('/dashboard');
    }
  }, [user, navigate]);

  const handleCreateIgreja = async () => {
    if (!formData.nome.trim() || !formData.endereco.trim()) {
      setFormError('Todos os campos são obrigatórios');
      return;
    }
    // Validação extra para admin e sede: nome, email e senha do responsável
    if ((user?.role === 'admin' || user?.role === 'sede')) {
      if (!userFields.nome.trim() || !userFields.email.trim() || !userFields.senha.trim()) {
        setFormError('Preencha nome, e-mail e senha do responsável');
        return;
      }
    }
    setSubmitting(true);
    setFormError('');
    try {
      const igrejaData = {
        ...formData,
        sede: user?.role === 'sede' ? user.igreja : (showCongregacoes && selectedMatriz ? selectedMatriz._id : undefined),
        usuario: (user?.role === 'admin' || user?.role === 'sede') ? userFields : undefined
      };
      const response = await api.post('/igrejas', igrejaData);
      if (response.ok) {
        const novaIgreja = await response.json();
        setIgrejas([...igrejas, novaIgreja]);
        setShowModal(false);
        setFormData({ nome: '', endereco: '', tipo: 'congregacao' });
        setUserFields({ nome: '', email: '', senha: '' });
        // Se estava criando uma congregação, mantém o contexto
        if (showCongregacoes && selectedMatriz) {
          setShowCongregacoes(true);
        }
      } else {
        const errorData = await response.json();
        setFormError(errorData.error || 'Erro ao criar congregação');
      }
    } catch (error) {
      setFormError('Erro de conexão');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteIgreja = async (id: string) => {
    if (!window.confirm('Tem certeza que deseja excluir esta igreja?')) return;
    try {
      const response = await api.delete(`/igrejas/${id}`);
      if (response.ok) {
        setIgrejas(igrejas.filter(i => i._id !== id));
      } else {
        const errorData = await response.json();
        setError(errorData.error || 'Erro ao excluir igreja');
      }
    } catch (error) {
      setError('Erro de conexão');
    }
  };

  const handleEditIgreja = (igreja: Igreja) => {
    setEditMode(true);
    setEditIgrejaId(igreja._id);
    setFormData({
      nome: igreja.nome,
      endereco: igreja.endereco,
      tipo: igreja.tipo
    });
    setShowModal(true);
  };

  // Função removida - não é mais necessária



  const handleBackToMatrizes = () => {
    setSelectedMatriz(null);
    setShowCongregacoes(false);
  };

  const handleViewPastoresDiretoria = async (igreja: Igreja) => {
    setSelectedIgrejaPastores(igreja);
    setShowPastoresDiretoria(true);
    setLoadingPastores(true);
    
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        navigate('/login');
        return;
      }

      // Buscar pastores da igreja (usando a mesma lógica do PastorCard)
      let pastoresData = [];
      if (igreja.tipo === 'congregacao') {
        // Para congregação, buscar dados duplos (matriz e congregação)
        const pastoresResponse = await api.get(`/pastor/duplo/${igreja._id}`);

        if (pastoresResponse.ok) {
          const data = await pastoresResponse.json();
          // Adicionar pastor da matriz se existir
          if (data.matriz) {
            pastoresData.push({
              ...data.matriz,
              cargo: 'Pastor Presidente'
            });
          }
          // Adicionar pastor da congregação se existir
          if (data.congregacao) {
            pastoresData.push({
              ...data.congregacao,
              cargo: 'Pastor da Congregação'
            });
          }
        }
      } else {
        // Para sede, buscar pastor normal
        const pastoresResponse = await api.get(`/pastor/${igreja._id}`);

        if (pastoresResponse.ok) {
          const data = await pastoresResponse.json();
          if (data) {
            pastoresData.push({
              ...data,
              cargo: data.cargo || 'Pastor Presidente'
            });
          }
        }
      }

      // Buscar diretoria da igreja (usando a mesma lógica do DiretoriaCard)
      const diretoriaResponse = await api.get(`/diretoria/${igreja._id}`);

      if (diretoriaResponse.ok) {
        const data = await diretoriaResponse.json();
        setDiretoria(data.membros || []);
      } else {
        setDiretoria([]);
      }

      setPastores(pastoresData);
    } catch (error) {
      console.error('Erro ao buscar pastores e diretoria:', error);
      setPastores([]);
      setDiretoria([]);
    } finally {
      setLoadingPastores(false);
    }
  };

  const handleSaveEditIgreja = async () => {
    if (!formData.nome.trim() || !formData.endereco.trim()) {
      setFormError('Todos os campos são obrigatórios');
      return;
    }
    setFormError('');
    setSubmitting(true);
    try {
      const response = await api.put(`/igrejas/${editIgrejaId}`, formData);
      if (response.ok) {
        const updated = await response.json();
        setIgrejas(igrejas.map(i => i._id === editIgrejaId ? updated : i));
        setShowModal(false);
        setEditMode(false);
        setEditIgrejaId(null);
        setFormData({ nome: '', endereco: '', tipo: 'congregacao' });
      } else {
        const errorData = await response.json();
        setFormError(errorData.error || 'Erro ao editar igreja');
      }
    } catch (error) {
      setFormError('Erro de conexão');
    } finally {
      setSubmitting(false);
    }
  };

  const canCreateIgreja = () => {
    return user?.role === 'admin' || user?.role === 'sede';
  };

  const getIgrejaIcon = (tipo: string) => {
    switch (tipo) {
      case 'sede':
        return <Building className="w-5 h-5 text-blue-500" />;
      case 'congregacao':
        return <Home className="w-5 h-5 text-green-500" />;
      default:
        return <Church className="w-5 h-5 text-gray-500" />;
    }
  };

  const getTipoLabel = (tipo: string) => {
    switch (tipo) {
      case 'sede':
        return 'Igreja Matriz';
      case 'congregacao':
        return 'Congregação';
      default:
        return tipo;
    }
  };

  const getTipoColor = (tipo: string) => {
    switch (tipo) {
      case 'sede':
        return 'bg-blue-500 text-white';
      case 'congregacao':
        return 'bg-green-500 text-white';
      default:
        return 'bg-gray-500 text-white';
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-white dark:bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
          <p className="text-gray-900 dark:text-white">Carregando igrejas...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen">
      {/* Header */}
      <header className="bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-700">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center">
              <button
                onClick={() => navigate('/dashboard')}
                className="text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors mr-4"
              >
                <ArrowLeft className="w-6 h-6" />
              </button>
              <Church className="w-8 h-8 text-blue-500 mr-3" />
              <h1 className="text-xl font-bold text-gray-900 dark:text-white">Gerenciar Igrejas</h1>
            </div>
            
            {canCreateIgreja() && (
              <button 
                onClick={() => setShowModal(true)}
                className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-lg flex items-center space-x-2 transition-colors"
              >
                <Plus className="w-4 h-4" />
                <span>
                  {showCongregacoes && selectedMatriz 
                    ? 'Nova Congregação'
                    : user?.role === 'admin' 
                      ? 'Nova Matriz'
                      : user?.role === 'sede' 
                        ? 'Nova Congregação' 
                        : 'Nova Igreja'
                  }
                </span>
              </button>
            )}
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
                className="text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors p-2 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-700"
                title="Voltar para matrizes"
              >
                <ArrowLeft className="w-5 h-5" />
              </button>
              <div>
                <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
                  Congregações de {selectedMatriz.nome}
                </h2>
                <p className="text-gray-600 dark:text-gray-400">
                  Gerencie as congregações desta igreja matriz
                </p>
              </div>
            </div>
          ) : (
            <>
              <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
                {user?.role === 'admin' 
                  ? 'Igrejas Matriz' 
                  : user?.role === 'sede' 
                    ? 'Minhas Congregações' 
                    : 'Minha Igreja'
                }
              </h2>
              <p className="text-gray-600 dark:text-gray-400">
                {user?.role === 'admin' 
                  ? 'Gerencie as igrejas matriz do sistema' 
                  : user?.role === 'sede' 
                    ? 'Gerencie suas congregações' 
                    : 'Informações da sua igreja'
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
          className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.1 }}
        >
          {showCongregacoes && selectedMatriz ? (
            <>
              <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-blue-500/20 rounded-xl p-6 shadow-sm">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-gray-700 dark:text-gray-400 text-sm">Matriz</p>
                    <p className="text-2xl font-bold text-black dark:text-white">{selectedMatriz.nome}</p>
                  </div>
                  <Building className="w-8 h-8 text-blue-500" />
                </div>
              </div>
              
              <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-green-500/20 rounded-xl p-6 shadow-sm">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-gray-700 dark:text-gray-400 text-sm">Total de Congregações</p>
                    <p className="text-2xl font-bold text-black dark:text-white">
                      {igrejas.filter(i => i.tipo === 'congregacao' && i.sede === selectedMatriz._id).length}
                    </p>
                  </div>
                  <Home className="w-8 h-8 text-green-500" />
                </div>
              </div>
              
              <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-purple-500/20 rounded-xl p-6 shadow-sm">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-gray-700 dark:text-gray-400 text-sm">Endereço da Matriz</p>
                    <p className="text-sm font-medium text-black dark:text-white truncate">{selectedMatriz.endereco}</p>
                  </div>
                  <MapPin className="w-8 h-8 text-purple-500" />
                </div>
              </div>
            </>
          ) : (
            <>
              <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-blue-500/20 rounded-xl p-6 shadow-sm">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-gray-700 dark:text-gray-400 text-sm">
                      {user?.role === 'admin' 
                        ? 'Total de Matrizes' 
                        : user?.role === 'sede' 
                          ? 'Total de Congregações' 
                          : 'Minha Igreja'
                      }
                    </p>
                    <p className="text-2xl font-bold text-black dark:text-white">
                      {user?.role === 'admin' 
                        ? igrejas.filter(i => i.tipo === 'sede').length
                        : igrejas.length
                      }
                    </p>
                  </div>
                  <Church className="w-8 h-8 text-blue-500" />
                </div>
              </div>
              
              {user?.role === 'admin' && (
                <>
                  <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-green-500/20 rounded-xl p-6 shadow-sm">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-gray-700 dark:text-gray-400 text-sm">Total de Congregações</p>
                        <p className="text-2xl font-bold text-black dark:text-white">
                          {igrejas.filter(i => i.tipo === 'congregacao').length}
                        </p>
                      </div>
                      <Home className="w-8 h-8 text-green-500" />
                    </div>
                  </div>
                  
                  <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-purple-500/20 rounded-xl p-6 shadow-sm">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-gray-700 dark:text-gray-400 text-sm">Sistema</p>
                        <p className="text-2xl font-bold text-black dark:text-white">Ativo</p>
                      </div>
                      <Building className="w-8 h-8 text-purple-500" />
                    </div>
                  </div>
                </>
              )}
            </>
          )}
        </motion.div>

        {/* Churches List */}
        <motion.div
          className="grid grid-cols-1 lg:grid-cols-2 gap-6"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.2 }}
        >
          {(showCongregacoes && selectedMatriz 
            ? igrejas.filter(i => i.tipo === 'congregacao' && i.sede === selectedMatriz._id)
            : user?.role === 'admin' 
              ? igrejas.filter(i => i.tipo === 'sede')
              : igrejas.filter(i => !(user?.role === 'sede' && i._id === user.igreja))
          ).map((igreja, index) => (
              <motion.div
                key={igreja._id}
                className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-blue-500/20 rounded-xl p-6 shadow-lg"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.3 + index * 0.1 }}
                // Removido efeito hover já que o card não é mais clicável
                onClick={() => {
                  // Remover a funcionalidade de clique no card
                  // Agora apenas o botão "Ver Pastores e Diretoria" abre o modal
                }}
              >
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center space-x-3">
                    {getIgrejaIcon(igreja.tipo)}
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900 dark:text-white">{igreja.nome}</h3>
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${getTipoColor(igreja.tipo)}`}>
                        {getTipoLabel(igreja.tipo)}
                      </span>
                    </div>
                  </div>
                  
                  <div className="flex items-center space-x-2" onClick={(e) => e.stopPropagation()}>
                    <button 
                      className="text-gray-600 dark:text-gray-400 hover:text-green-600 dark:hover:text-green-400 transition-colors p-2" 
                      onClick={() => handleViewPastoresDiretoria(igreja)}
                      title="Ver Pastores e Diretoria"
                    >
                      <Users className="w-4 h-4" />
                    </button>
                    <button className="text-gray-600 dark:text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 transition-colors p-2" onClick={() => handleEditIgreja(igreja)}>
                      <Edit className="w-4 h-4" />
                    </button>
                    <button className="text-gray-600 dark:text-gray-400 hover:text-red-600 dark:hover:text-red-400 transition-colors p-2" onClick={() => handleDeleteIgreja(igreja._id)}>
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                <div className="space-y-3">
                  <div className="flex items-center space-x-2 text-gray-800 dark:text-gray-400">
                    <MapPin className="w-4 h-4" />
                    <span className="text-sm">{igreja.endereco}</span>
                  </div>
                  
                  <div className="flex items-center space-x-4 text-sm text-gray-800 dark:text-gray-400">
                    <div className="flex items-center space-x-1">
                      <Users className="w-4 h-4" />
                      <span>0 membros</span>
                    </div>
                    <div className="flex items-center space-x-1">
                      <Calendar className="w-4 h-4" />
                      <span>0 eventos</span>
                    </div>
                  </div>
                  
                  <div className="pt-2 border-t border-gray-300 dark:border-gray-700">
                    <p className="text-blue-700 dark:text-blue-400 text-xs font-medium">
                      {showCongregacoes && selectedMatriz 
                        ? 'Use o botão ao lado para ver pastores e diretoria'
                        : user?.role === 'admin' && igreja.tipo === 'sede'
                          ? 'Use o botão ao lado para ver pastores e diretoria'
                          : 'Use o botão ao lado para ver pastores e diretoria'
                      }
                    </p>
                  </div>
                </div>
              </motion.div>
            ))}
        </motion.div>

        {/* Empty State */}
        {(showCongregacoes && selectedMatriz 
          ? igrejas.filter(i => i.tipo === 'congregacao' && i.sede === selectedMatriz._id).length === 0
          : user?.role === 'admin' 
            ? igrejas.filter(i => i.tipo === 'sede').length === 0
            : igrejas.length === 0
        ) && (
          <motion.div
            className="text-center py-12"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.4 }}
          >
            <Church className="w-16 h-16 text-gray-500 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
              {showCongregacoes && selectedMatriz 
                ? 'Nenhuma congregação encontrada'
                : user?.role === 'admin' 
                  ? 'Nenhuma igreja matriz encontrada'
                  : user?.role === 'sede' 
                    ? 'Nenhuma congregação encontrada' 
                    : 'Nenhuma igreja encontrada'
              }
            </h3>
            <p className="text-gray-600 dark:text-gray-400 mb-6">
              {showCongregacoes && selectedMatriz 
                ? 'Esta igreja matriz ainda não possui congregações cadastradas'
                : user?.role === 'admin' 
                  ? 'Comece cadastrando a primeira igreja matriz do sistema'
                  : user?.role === 'sede' 
                    ? 'Comece cadastrando sua primeira congregação' 
                    : 'Nenhuma igreja foi cadastrada ainda'
              }
            </p>
            {canCreateIgreja() && (
              <button
                onClick={() => setShowModal(true)}
                className="bg-blue-500 hover:bg-blue-600 text-white px-6 py-3 rounded-lg flex items-center space-x-2 mx-auto transition-colors"
              >
                <Plus className="w-5 h-5" />
                <span>
                  {showCongregacoes && selectedMatriz 
                    ? 'Cadastrar Primeira Congregação'
                    : user?.role === 'admin' 
                      ? 'Cadastrar Primeira Matriz'
                      : user?.role === 'sede' 
                        ? 'Cadastrar Primeira Congregação' 
                        : 'Cadastrar Primeira Igreja'
                  }
                </span>
              </button>
            )}
          </motion.div>
        )}
      </div>

      {/* Modal de Pastores e Diretoria */}
      <AnimatePresence>
        {showPastoresDiretoria && selectedIgrejaPastores && (
          <motion.div
            className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <motion.div
              className="bg-white dark:bg-gray-800 rounded-xl p-6 w-full max-w-6xl max-h-[90vh] overflow-y-auto border border-gray-200 dark:border-gray-700"
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              transition={{ type: "spring", duration: 0.5 }}
            >
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center space-x-3">
                  {getIgrejaIcon(selectedIgrejaPastores.tipo)}
                  <div>
                    <h3 className="text-xl font-semibold text-gray-900 dark:text-white">{selectedIgrejaPastores.nome}</h3>
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${getTipoColor(selectedIgrejaPastores.tipo)}`}>
                      {getTipoLabel(selectedIgrejaPastores.tipo)}
                    </span>
                  </div>
                </div>
                <button
                  onClick={() => {
                    setShowPastoresDiretoria(false);
                    setSelectedIgrejaPastores(null);
                    setPastores([]);
                    setDiretoria([]);
                  }}
                  className="text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>

              {loadingPastores ? (
                <div className="flex items-center justify-center py-12">
                  <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
                  <p className="text-gray-900 dark:text-white">Carregando pastores e diretoria...</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {/* Card dos Pastores */}
                  <div className="bg-gradient-to-br from-gray-100 to-gray-200 dark:bg-gray-700 border border-gray-300 dark:border-blue-500/20 rounded-xl p-6">
                    <h4 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center">
                      <Users className="w-5 h-5 text-blue-400 mr-2" />
                      Pastores
                    </h4>
                    
                    {pastores.length > 0 ? (
                      <div className="space-y-4">
                        {pastores.map((pastor) => (
                          <div key={pastor._id} className="bg-blue-500/10 border border-blue-500/20 rounded-lg p-4">
                            <div className="flex items-start space-x-4">
                              <div className="flex-shrink-0">
                                <img
                                  src={pastor.foto || "https://randomuser.me/api/portraits/men/32.jpg"}
                                  alt={pastor.nome}
                                  className="w-16 h-16 rounded-full border-2 border-blue-500 shadow-lg object-cover"
                                />
                              </div>
                                                             <div className="flex-1">
                                 <h5 className="text-lg font-bold text-black dark:text-white">{pastor.nome || 'Nome não informado'}</h5>
                                 <p className="text-blue-900 dark:text-blue-400 text-sm font-medium">{pastor.cargo}</p>
                                 {pastor.frase && (
                                   <div className="mt-2">
                                     <p className="text-black dark:text-gray-300 italic text-sm">"{pastor.frase}"</p>
                                   </div>
                                 )}
                                 <div className="mt-3 space-y-1">
                                   <div className="flex items-center space-x-2 text-black dark:text-gray-400">
                                     <Mail className="w-4 h-4" />
                                     <span className="text-sm">{pastor.email || 'Email não informado'}</span>
                                   </div>
                                   {pastor.telefone && (
                                     <div className="flex items-center space-x-2 text-black dark:text-gray-400">
                                       <Phone className="w-4 h-4" />
                                       <span className="text-sm">{pastor.telefone}</span>
                                     </div>
                                   )}
                                 </div>
                                 {pastor.biografia && (
                                   <div className="mt-3 pt-3 border-t border-gray-300 dark:border-gray-600">
                                     <h6 className="text-black dark:text-gray-400 text-xs font-semibold uppercase tracking-wide mb-2">Biografia</h6>
                                     <p className="text-black dark:text-gray-300 text-xs leading-relaxed">{pastor.biografia}</p>
                                   </div>
                                 )}
                               </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="text-center py-8">
                        <Users className="w-12 h-12 text-gray-500 mx-auto mb-2" />
                        <p className="text-black dark:text-gray-400">Nenhum pastor cadastrado</p>
                      </div>
                    )}
                  </div>

                  {/* Card da Diretoria */}
                  <div className="bg-gradient-to-br from-gray-100 to-gray-200 dark:bg-gray-700 border border-gray-300 dark:border-slate-500/20 rounded-xl p-6">
                    <h4 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center">
                      <Building className="w-5 h-5 text-blue-400 dark:text-slate-400 mr-2" />
                      Diretoria
                    </h4>
                    
                    {diretoria.length > 0 ? (
                      <div className="space-y-3">
                        {diretoria.map((membro) => (
                          <div key={membro.id} className="bg-white dark:bg-slate-500/10 border border-gray-200 dark:border-slate-500/20 rounded-lg p-4 shadow-sm">
                            <div className="flex items-center justify-between">
                              <div>
                                <h6 className="text-black dark:text-white font-semibold text-sm">{membro.nome || 'Nome não informado'}</h6>
                                <p className="text-blue-900 dark:text-slate-400 text-xs font-medium">{membro.cargo || 'Cargo não informado'}</p>
                                <p className="text-black dark:text-gray-400 text-xs">{membro.email || 'Email não informado'}</p>
                              </div>
                              {membro.telefone && (
                                <div className="flex items-center space-x-1 text-black dark:text-gray-400">
                                  <Phone className="w-3 h-3" />
                                  <span className="text-xs">{membro.telefone}</span>
                                </div>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="text-center py-8">
                        <Building className="w-12 h-12 text-gray-500 mx-auto mb-2" />
                        <p className="text-black dark:text-gray-400">Nenhum membro da diretoria cadastrado</p>
                      </div>
                    )}
                  </div>
                </div>
              )}

              <div className="mt-6 pt-6 border-t border-gray-300 dark:border-gray-700">
                <div className="flex items-center space-x-3 text-gray-600 dark:text-gray-400">
                  <MapPin className="w-4 h-4" />
                  <span className="text-sm">{selectedIgrejaPastores.endereco}</span>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Modal de Detalhes da Igreja - REMOVIDO */}

      {/* Modal de Cadastro */}
      <AnimatePresence>
        {showModal && (
          <motion.div
            className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <motion.div
              className="bg-white dark:bg-gray-800 rounded-xl p-6 w-full max-w-md border border-gray-200 dark:border-gray-700"
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              transition={{ type: "spring", duration: 0.5 }}
            >
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-xl font-semibold text-gray-900 dark:text-white">
                  {editMode 
                    ? 'Editar Igreja' 
                    : showCongregacoes && selectedMatriz 
                      ? 'Nova Congregação'
                      : user?.role === 'admin' 
                        ? 'Nova Matriz'
                        : user?.role === 'sede' 
                          ? 'Nova Congregação' 
                          : 'Nova Igreja'
                  }
                </h3>
                <button
                  onClick={() => {
                    setShowModal(false);
                    setEditMode(false);
                    setEditIgrejaId(null);
                    setFormData({ nome: '', endereco: '', tipo: 'congregacao' });
                    setUserFields({ nome: '', email: '', senha: '' });
                    setFormError('');
                    if (showCongregacoes && selectedMatriz) {
                      // Se estava criando uma congregação, volta para a lista de congregações
                      setShowCongregacoes(true);
                    }
                  }}
                  className="text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>

              {formError && (
                <div className="mb-4 p-3 bg-red-100 dark:bg-red-500/10 border border-red-300 dark:border-red-500/20 rounded-lg flex items-center space-x-2 text-red-600 dark:text-red-400">
                  <AlertCircle className="w-4 h-4" />
                  <span className="text-sm">{formError}</span>
                </div>
              )}

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Nome da {
                      showCongregacoes && selectedMatriz 
                        ? 'Congregação'
                        : user?.role === 'admin' 
                          ? 'Matriz'
                          : user?.role === 'sede' 
                            ? 'Congregação' 
                            : 'Igreja'
                    }
                  </label>
                  <input
                    type="text"
                    value={formData.nome}
                    onChange={(e) => setFormData({ ...formData, nome: e.target.value })}
                    className="w-full px-3 py-2 bg-gray-100 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:border-blue-500"
                    placeholder={`Nome da ${
                      showCongregacoes && selectedMatriz 
                        ? 'congregação'
                        : user?.role === 'admin' 
                          ? 'matriz'
                          : user?.role === 'sede' 
                            ? 'congregação' 
                            : 'igreja'
                    }`}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Endereço
                  </label>
                  <input
                    type="text"
                    value={formData.endereco}
                    onChange={(e) => setFormData({ ...formData, endereco: e.target.value })}
                    className="w-full px-3 py-2 bg-gray-100 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:border-blue-500"
                    placeholder="Endereço completo"
                  />
                </div>

                {/* Select de tipo só para admin */}
                {user?.role === 'admin' && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Tipo de igreja</label>
                    <select
                      value={formData.tipo}
                      onChange={e => setFormData({ ...formData, tipo: e.target.value })}
                      className="w-full px-3 py-2 bg-gray-100 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-900 dark:text-white focus:outline-none focus:border-blue-500"
                    >
                      <option value="sede">Igreja Matriz</option>
                      <option value="congregacao">Congregação</option>
                    </select>
                  </div>
                )}

                {/* Campos de responsável para admin e sede */}
                {(user?.role === 'admin' || user?.role === 'sede') && (
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Nome do responsável *</label>
                      <input
                        type="text"
                        value={userFields.nome}
                        onChange={e => setUserFields({ ...userFields, nome: e.target.value })}
                        className="w-full px-3 py-2 bg-gray-100 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:border-blue-500"
                        placeholder="Nome do responsável"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">E-mail do responsável *</label>
                      <input
                        type="email"
                        value={userFields.email}
                        onChange={e => setUserFields({ ...userFields, email: e.target.value })}
                        className="w-full px-3 py-2 bg-gray-100 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:border-blue-500"
                        placeholder="E-mail do responsável"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Senha *</label>
                      <input
                        type="password"
                        value={userFields.senha}
                        onChange={e => setUserFields({ ...userFields, senha: e.target.value })}
                        className="w-full px-3 py-2 bg-gray-100 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:border-blue-500"
                        placeholder="Senha do responsável"
                        required
                      />
                    </div>
                  </div>
                )}
              </div>

              <div className="flex items-center justify-end space-x-3 mt-6">
                <button
                  onClick={() => setShowModal(false)}
                  className="px-4 py-2 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors"
                  disabled={submitting}
                >
                  Cancelar
                </button>
                <button
                  onClick={editMode ? handleSaveEditIgreja : handleCreateIgreja}
                  disabled={submitting}
                  className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-lg flex items-center space-x-2 transition-colors disabled:opacity-50"
                >
                  {submitting ? (
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                  ) : (
                    <Save className="w-4 h-4" />
                  )}
                  <span>{submitting ? 'Salvando...' : 'Salvar'}</span>
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default Churches; 