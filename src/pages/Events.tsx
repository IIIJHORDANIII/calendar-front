import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { 
  Calendar, 
  Clock, 
  MapPin, 
  Church, 
  Plus, 
  Edit, 
  Trash2, 
  ArrowLeft,
  Filter,
  Search,
  Upload,
  X,
  Image,
  AlertCircle,
  CheckCircle,
  Loader,
  Save
} from 'lucide-react';
import { useApi } from '../utils/api';

interface Igreja {
  _id: string;
  nome: string;
  tipo: string;
  sede?: string;
}

interface User {
  _id: string;
  nome: string;
  email: string;
  role: string;
  igreja?: string;
}

interface Evento {
  _id: string;
  titulo: string;
  descricao: string;
  data: string;
  igreja: Igreja;
  tipo: string;
  imagem?: string;
  createdAt: string;
  updatedAt: string;
}

interface EventFormData {
  titulo: string;
  descricao: string;
  data: string;
  igreja: string;
  tipo: string;
}

const Events: React.FC = () => {
  const navigate = useNavigate();
  const api = useApi();
  const [eventos, setEventos] = useState<Evento[]>([]);
  const [igrejas, setIgrejas] = useState<Igreja[]>([]);
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [filterIgreja, setFilterIgreja] = useState('all');
  const [filterTipo, setFilterTipo] = useState('all');
  
  // Modal states
  const [showModal, setShowModal] = useState(false);
  const [editingEvent, setEditingEvent] = useState<Evento | null>(null);
  const [formData, setFormData] = useState<EventFormData>({
    titulo: '',
    descricao: '',
    data: '',
    igreja: '',
    tipo: 'sede'
  });
  
  // Banner upload states
  const [bannerFile, setBannerFile] = useState<File | null>(null);
  const [bannerPreview, setBannerPreview] = useState<string>('');
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState('');
  const [aspectRatioError, setAspectRatioError] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [selectedCongregacao, setSelectedCongregacao] = useState('');

  useEffect(() => {
    const userData = localStorage.getItem('user');
    if (userData) {
      const parsedUser = JSON.parse(userData);
      console.log('Usuário definido no useEffect:', parsedUser);
      setUser(parsedUser);
    }
    fetchEventos();
    fetchIgrejas();
  }, []);

  const fetchEventos = async () => {
    try {
      const response = await api.get('/evento');
      if (response.ok) {
        const data = await response.json();
        console.log('Eventos recebidos do backend:', data);
        console.log('Usuário atual:', user);
        setEventos(data);
      } else {
        setError('Erro ao carregar eventos');
      }
    } catch (error) {
      if (error instanceof Error) {
        setError(error.message);
      } else {
        setError('Erro de conexão');
      }
    } finally {
      setLoading(false);
    }
  };

  const fetchIgrejas = async () => {
    try {
      const response = await api.get('/igrejas');
      if (response.ok) {
        const data = await response.json();
        setIgrejas(data);
      }
    } catch (error) {
      console.error('Erro ao carregar igrejas:', error);
    }
  };

  const openModal = (event?: Evento) => {
    // Verificar se congregação está tentando editar evento da sede
    if (event && user?.role === 'congregacao' && event.igreja.tipo === 'sede') {
      alert('Você não tem permissão para editar eventos criados pela sede.');
      return;
    }
    
    if (event) {
      setEditingEvent(event);
      setFormData({
        titulo: event.titulo,
        descricao: event.descricao,
        data: new Date(event.data).toISOString().slice(0, 16),
        igreja: event.igreja._id,
        tipo: event.tipo
      });
      setSelectedCongregacao('');
      if (event.imagem) {
        setBannerPreview(`http://localhost:3005/uploads/${event.imagem.split('/').pop()}`);
      }
    } else {
      setEditingEvent(null);
      let defaultTipo = 'sede';
      if (user?.role === 'sede') {
        defaultTipo = 'congregacao';
      } else if (user?.role === 'congregacao') {
        defaultTipo = 'congregacao';
      }
      setFormData({
        titulo: '',
        descricao: '',
        data: '',
        igreja: user?.igreja || '',
        tipo: defaultTipo
      });
      setSelectedCongregacao('');
    }
    setShowModal(true);
    setBannerFile(null);
    setBannerPreview('');
    setUploadError('');
    setAspectRatioError('');
  };

  const closeModal = () => {
    setShowModal(false);
    setEditingEvent(null);
    let defaultTipo = 'sede';
    if (user?.role === 'sede') {
      defaultTipo = 'congregacao';
    } else if (user?.role === 'congregacao') {
      defaultTipo = 'congregacao';
    }
    setFormData({
      titulo: '',
      descricao: '',
      data: '',
      igreja: user?.igreja || '',
      tipo: defaultTipo
    });
    setSelectedCongregacao('');
    setBannerFile(null);
    setBannerPreview('');
    setUploadError('');
    setAspectRatioError('');
    // Reset filters
    setSearchTerm('');
    setFilterIgreja('all');
    setFilterTipo('all');
  };

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Check file type
    if (!file.type.startsWith('image/')) {
      setUploadError('Apenas arquivos de imagem são permitidos');
      return;
    }

    // Check file size (5MB)
    if (file.size > 5 * 1024 * 1024) {
      setUploadError('Arquivo muito grande. Máximo 5MB.');
      return;
    }

    // Check aspect ratio (9:16)
    const img = new window.Image();
    img.onload = () => {
      const aspectRatio = img.width / img.height;
      const targetRatio = 9 / 16;
      const tolerance = 0.1; // Allow some tolerance

      if (Math.abs(aspectRatio - targetRatio) > tolerance) {
        setAspectRatioError('A imagem deve ter proporção 9:16 (vertical)');
        setBannerFile(null);
        setBannerPreview('');
      } else {
        setAspectRatioError('');
        setUploadError('');
        setBannerFile(file);
        setBannerPreview(URL.createObjectURL(file));
      }
    };
    img.src = URL.createObjectURL(file);
  };

  const uploadBanner = async (): Promise<string | null> => {
    if (!bannerFile) return null;

    const formData = new FormData();
    formData.append('banner', bannerFile);

    try {
      const token = localStorage.getItem('token');
      const response = await fetch('http://localhost:3005/uploads/banner', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        },
        body: formData
      });

      if (response.ok) {
        const result = await response.json();
        return result.path;
      } else {
        const error = await response.json();
        throw new Error(error.error || 'Erro no upload');
      }
    } catch (error) {
      setUploadError(error instanceof Error ? error.message : 'Erro no upload');
      return null;
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setUploading(true);
    setUploadError('');

    try {
      const token = localStorage.getItem('token');
      if (!token) {
        navigate('/login');
        return;
      }

      // Upload banner if selected
      let imagemPath = editingEvent?.imagem || '';
      if (bannerFile) {
        const uploadedPath = await uploadBanner();
        if (uploadedPath) {
          imagemPath = uploadedPath;
        } else {
          setUploading(false);
          return;
        }
      }

      let igrejaId = formData.igreja;
      if (user?.role === 'sede') {
        igrejaId = selectedCongregacao || user.igreja || '';
      }

      const eventData = {
        ...formData,
        imagem: imagemPath,
        igreja: igrejaId
      };

      const url = editingEvent 
        ? `http://localhost:3005/evento/${editingEvent._id}`
        : 'http://localhost:3005/evento';
      
      const method = editingEvent ? 'PUT' : 'POST';

      const response = await fetch(url, {
        method,
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(eventData)
      });

      if (response.ok) {
        await fetchEventos();
        closeModal();
      } else {
        const error = await response.json();
        setUploadError(error.error || 'Erro ao salvar evento');
      }
    } catch (error) {
      setUploadError('Erro de conexão');
    } finally {
      setUploading(false);
    }
  };

  const handleDeleteEvent = async (eventId: string) => {
    // Encontrar o evento para verificar se congregação pode deletar
    const evento = eventos.find(e => e._id === eventId);
    if (evento && user?.role === 'congregacao' && evento.igreja.tipo === 'sede') {
      alert('Você não tem permissão para excluir eventos criados pela sede.');
      return;
    }
    
    if (!window.confirm('Tem certeza que deseja deletar este evento?')) return;

    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`http://localhost:3005/evento/${eventId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.ok) {
        await fetchEventos();
      } else {
        setError('Erro ao deletar evento');
      }
    } catch (error) {
      setError('Erro de conexão');
    }
  };

  const filteredEventos = eventos.filter(evento => {
    const matchesSearch = evento.titulo.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         evento.descricao.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesIgreja = filterIgreja === 'all' || evento.igreja._id === filterIgreja;
    const matchesTipo = filterTipo === 'all' || evento.igreja.tipo === filterTipo;
    return matchesSearch && matchesIgreja && matchesTipo;
  });

  const getEventColor = (tipo: string) => {
    switch (tipo) {
      case 'sede': return 'bg-blue-500';
      case 'congregacao': return 'bg-green-500';
      default: return 'bg-gray-500';
    }
  };

  const getEventTag = (evento: Evento) => {
    if (evento.igreja.tipo === 'sede') {
      return {
        text: 'Sede',
        color: 'bg-blue-500 text-white',
        icon: '🏛️'
      };
    } else if (evento.igreja.tipo === 'congregacao') {
      return {
        text: evento.igreja.nome,
        color: 'bg-green-500 text-white',
        icon: '⛪'
      };
    }
    return {
      text: 'Evento',
      color: 'bg-gray-500 text-white',
      icon: '📅'
    };
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('pt-BR');
  };

  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
  };

  const formatDateTime = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleString('pt-BR');
  };

  const getDayOfWeek = (dateString: string) => {
    const date = new Date(dateString);
    const days = ['Domingo', 'Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta', 'Sábado'];
    return days[date.getDay()];
  };

  const isToday = (dateString: string) => {
    const today = new Date();
    const eventDate = new Date(dateString);
    return today.toDateString() === eventDate.toDateString();
  };

  const isUpcoming = (dateString: string) => {
    const today = new Date();
    const eventDate = new Date(dateString);
    return eventDate > today;
  };

  if (loading) {
      return (
    <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
          <p className="text-gray-900 dark:text-white">Carregando eventos...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen overflow-x-hidden">
      {/* Header */}
      <header className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
        <div className="max-w-7xl mx-auto px-8 sm:px-6 lg:px-8 w-full">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center">
              <button
                onClick={() => navigate('/dashboard')}
                className="text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors mr-4"
              >
                <ArrowLeft className="w-6 h-6" />
              </button>
              <Calendar className="w-8 h-8 text-blue-500 mr-3" />
              <h1 className="text-xl font-bold text-gray-900 dark:text-white">Gerenciar Eventos</h1>
            </div>
            
            <button 
              onClick={() => openModal()}
              className="bg-blue-500 hover:bg-blue-600 text-white px-3 py-1.5 rounded-lg flex items-center space-x-2 transition-colors text-sm"
            >
              <Plus className="w-4 h-4" />
              <span>Novo Evento</span>
            </button>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-10 sm:px-6 lg:px-8 py-8 w-full">
        {/* Page Header */}
        <motion.div
          className="mb-8 w-full"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
        >
          <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">Eventos</h2>
          <p className="text-gray-600 dark:text-gray-400">Gerencie os eventos e calendários das igrejas</p>
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
          className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8 w-full"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.1 }}
        >
          <div className="bg-gradient-to-br from-white to-gray-50 dark:from-gray-800 dark:to-gray-900 border border-gray-200 dark:border-blue-500/20 rounded-xl p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-600 dark:text-gray-400 text-sm">Total de Eventos</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">{eventos.length}</p>
              </div>
              <Calendar className="w-8 h-8 text-blue-500" />
            </div>
          </div>
          
          <div className="bg-gradient-to-br from-white to-gray-50 dark:from-gray-800 dark:to-gray-900 border border-gray-200 dark:border-green-500/20 rounded-xl p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-600 dark:text-gray-400 text-sm">Eventos Hoje</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">
                  {eventos.filter(e => isToday(e.data)).length}
                </p>
              </div>
              <Clock className="w-8 h-8 text-green-500" />
            </div>
          </div>
          
          <div className="bg-gradient-to-br from-white to-gray-50 dark:from-gray-800 dark:to-gray-900 border border-gray-200 dark:border-yellow-500/20 rounded-xl p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-600 dark:text-gray-400 text-sm">Próximos Eventos</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">
                  {eventos.filter(e => isUpcoming(e.data)).length}
                </p>
              </div>
              <Calendar className="w-8 h-8 text-yellow-500" />
            </div>
          </div>

          <div className="bg-gradient-to-br from-white to-gray-50 dark:from-gray-800 dark:to-gray-900 border border-gray-200 dark:border-purple-500/20 rounded-xl p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-600 dark:text-gray-400 text-sm">Igrejas Ativas</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">
                  {new Set(eventos.map(e => e.igreja._id)).size}
                </p>
              </div>
              <Church className="w-8 h-8 text-purple-500" />
            </div>
          </div>
        </motion.div>

        {/* Search and Filter */}
        <motion.div
          className="bg-gradient-to-br from-white to-gray-50 dark:from-gray-800 dark:to-gray-900 border border-gray-200 dark:border-blue-500/20 rounded-xl p-4 shadow-lg mb-8 w-full"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.2 }}
        >
          <div className="flex flex-col sm:flex-row gap-3">
            {/* Search */}
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <input
                  type="text"
                  placeholder="Buscar eventos..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-9 pr-4 py-2 bg-gray-100 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-300 text-sm"
                />
              </div>
            </div>

            {/* Filter */}
            <div className="flex gap-2">
              <select
                value={filterIgreja}
                onChange={(e) => setFilterIgreja(e.target.value)}
                className="px-3 py-2 bg-gray-100 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-300 text-sm min-w-0"
              >
                <option value="all">Todas Igrejas</option>
                {Array.from(new Set(eventos.map(e => e.igreja._id))).slice(0, 5).map(igrejaId => {
                  const igreja = eventos.find(e => e.igreja._id === igrejaId)?.igreja;
                  return (
                    <option key={igrejaId} value={igrejaId}>
                      {igreja?.nome && igreja.nome.length > 15 ? igreja.nome.substring(0, 15) + '...' : igreja?.nome || 'Igreja'}
                    </option>
                  );
                })}
              </select>
              
              <select
                value={filterTipo}
                onChange={(e) => setFilterTipo(e.target.value)}
                className="px-3 py-2 bg-gray-100 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-300 text-sm"
              >
                <option value="all">Todos</option>
                <option value="sede">Sede</option>
                <option value="congregacao">Congregação</option>
              </select>
            </div>
          </div>
        </motion.div>

        {/* Events List */}
        <motion.div
          className="space-y-4 w-full"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.3 }}
        >
          {filteredEventos.length > 0 ? (
            filteredEventos.map((evento, index) => (
              <motion.div
                key={evento._id}
                className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl p-6 shadow-lg w-full"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.4 + index * 0.05 }}
                whileHover={{ y: -2 }}
              >
                <div className="flex items-start justify-between">
                  <div className="flex items-start space-x-4">
                    <div className={`w-3 h-3 rounded-full ${getEventColor(evento.tipo)} mt-2`}></div>
                    <div className="flex-1">
                      {/* Tags em cima do título */}
                      <div className="flex items-center space-x-2 mb-2">
                        {/* Tag de tipo de evento (Sede/Congregação) */}
                        <span className={`px-2 py-1 text-xs rounded-full flex items-center gap-1 ${getEventTag(evento).color}`}>
                          <span>{getEventTag(evento).icon}</span>
                          {getEventTag(evento).text}
                        </span>
                        {isToday(evento.data) && (
                          <span className="px-2 py-1 bg-green-500 text-white text-xs rounded-full">
                            Hoje
                          </span>
                        )}
                        {evento.imagem && (
                          <span className="px-2 py-1 bg-blue-500 text-white text-xs rounded-full flex items-center gap-1">
                            <Image className="w-3 h-3" />
                            Banner
                          </span>
                        )}
                      </div>
                      
                      {/* Título */}
                      <h3 className="text-base sm:text-lg font-semibold text-gray-900 dark:text-white mb-2">{evento.titulo}</h3>
                      
                      <p className="text-gray-600 dark:text-gray-400 mb-3 break-words truncate max-w-full">{evento.descricao}</p>
                      
                      <div className="flex items-center space-x-6 text-sm text-gray-600 dark:text-gray-400 flex-wrap min-w-0">
                        <div className="flex items-center space-x-2 min-w-0">
                          <Calendar className="w-4 h-4" />
                          <span className="truncate break-words max-w-[90px]">{formatDate(evento.data)}</span>
                        </div>
                        <div className="flex items-center space-x-2 min-w-0">
                          <Clock className="w-4 h-4" />
                          <span className="truncate break-words max-w-[70px]">{formatTime(evento.data)}</span>
                        </div>
                        <div className="flex items-center space-x-2 min-w-0">
                          <Church className="w-4 h-4" />
                          <span className="truncate break-words max-w-[90px]">{evento.igreja.nome}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex items-center space-x-2 flex-shrink-0 -mr-2">
                    {/* Só permite editar se for admin, sede, ou se for evento da própria congregação */}
                    {(user?.role === 'admin' || 
                      user?.role === 'sede' || 
                      (user?.role === 'congregacao' && evento.igreja.tipo === 'congregacao' && evento.igreja._id === user.igreja)) && (
                      <button 
                        onClick={() => openModal(evento)}
                        className="text-gray-600 dark:text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 transition-colors p-2"
                        title="Editar evento"
                      >
                        <Edit className="w-4 h-4" />
                      </button>
                    )}
                    
                    {/* Só permite excluir se for admin, sede, ou se for evento da própria congregação */}
                    {(user?.role === 'admin' || 
                      user?.role === 'sede' || 
                      (user?.role === 'congregacao' && evento.igreja.tipo === 'congregacao' && evento.igreja._id === user.igreja)) && (
                      <button 
                        onClick={() => handleDeleteEvent(evento._id)}
                        className="text-gray-600 dark:text-gray-400 hover:text-red-600 dark:hover:text-red-400 transition-colors p-2"
                        title="Excluir evento"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                    
                    {/* Mostra indicador visual quando congregação não pode editar/excluir evento da sede */}
                    {user?.role === 'congregacao' && evento.igreja.tipo === 'sede' && (
                      <span className="text-gray-500 text-xs px-2 py-1 bg-gray-200 dark:bg-gray-700 rounded" title="Evento da sede - não pode ser editado">
                        Somente leitura
                      </span>
                    )}
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
              <Calendar className="w-16 h-16 text-gray-500 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-gray-600 dark:text-gray-400 mb-2">Nenhum evento encontrado</h3>
              <p className="text-gray-500 dark:text-gray-400 mb-6">
                {searchTerm || filterIgreja !== 'all' || filterTipo !== 'all'
                  ? 'Tente ajustar os filtros de busca' 
                  : 'Comece adicionando o primeiro evento ao sistema'
                }
              </p>
              <button 
                onClick={() => openModal()}
                className="bg-blue-500 hover:bg-blue-600 text-white px-6 py-3 rounded-lg flex items-center space-x-2 mx-auto transition-colors"
              >
                <Plus className="w-4 h-4" />
                <span>Adicionar Primeiro Evento</span>
              </button>
            </motion.div>
          )}
        </motion.div>
      </div>

      {/* Event Modal */}
      <AnimatePresence>
        {showModal && (
          <motion.div
            className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <motion.div
              className="bg-white dark:bg-gray-800 rounded-xl p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto border border-gray-200 dark:border-gray-700"
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
            >
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
                  {editingEvent ? 'Editar Evento' : 'Novo Evento'}
                </h2>
                <button
                  onClick={closeModal}
                  className="text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>

              <form onSubmit={handleSubmit} className="space-y-6">
                {/* Basic Info */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Título *
                    </label>
                    <input
                      type="text"
                      required
                      value={formData.titulo}
                      onChange={(e) => setFormData({...formData, titulo: e.target.value})}
                      className="w-full px-4 py-3 bg-gray-100 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Data e Hora *
                    </label>
                    <input
                      type="datetime-local"
                      required
                      value={formData.data}
                      onChange={(e) => setFormData({...formData, data: e.target.value})}
                      className="w-full px-4 py-3 bg-gray-100 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Descrição
                  </label>
                  <textarea
                    value={formData.descricao}
                    onChange={(e) => setFormData({...formData, descricao: e.target.value})}
                    rows={3}
                    className="w-full px-4 py-3 bg-gray-100 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>

                <div className={`grid grid-cols-1 ${user?.role === 'admin' ? 'md:grid-cols-2' : ''} gap-4`}>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    </label>
                    {user?.role === 'sede' && (
                      <>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                            Congregação (opcional)
                          </label>
                          <select
                            value={selectedCongregacao}
                            onChange={e => setSelectedCongregacao(e.target.value)}
                            className="w-full px-4 py-3 bg-gray-100 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          >
                            <option value="">Selecione uma congregação (ou deixe em branco para evento na sede)</option>
                            {igrejas.filter(i => i.sede?.toString() === user.igreja).map(cong => (
                              <option key={cong._id} value={cong._id}>{cong.nome}</option>
                            ))}
                          </select>
                        </div>
                      </>
                    )}
                    {user?.role === 'admin' && (
                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                          Tipo *
                        </label>
                        <select
                          required
                          value={formData.tipo}
                          onChange={(e) => setFormData({...formData, tipo: e.target.value})}
                          className="w-full px-4 py-3 bg-gray-100 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        >
                          <option value="sede">Sede</option>
                          <option value="congregacao">Congregação</option>
                        </select>
                      </div>
                    )}
                  </div>
                </div>

                {/* Banner Upload */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Banner do Evento (9:16)
                  </label>
                  <div className="border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg p-6 text-center">
                    {bannerPreview ? (
                      <div className="space-y-4">
                        <div className="relative inline-block">
                          <img
                            src={bannerPreview}
                            alt="Banner preview"
                            className="w-32 h-56 object-cover rounded-lg border border-gray-300 dark:border-gray-600"
                          />
                          <button
                            type="button"
                            onClick={() => {
                              setBannerFile(null);
                              setBannerPreview('');
                              if (fileInputRef.current) fileInputRef.current.value = '';
                            }}
                            className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center hover:bg-red-600 transition-colors"
                          >
                            <X className="w-4 h-4" />
                          </button>
                        </div>
                        <p className="text-green-400 text-sm flex items-center justify-center gap-2">
                          <CheckCircle className="w-4 h-4" />
                          Banner selecionado
                        </p>
                      </div>
                    ) : (
                      <div className="space-y-4">
                        <Upload className="w-12 h-12 text-gray-400 mx-auto" />
                        <div>
                          <p className="text-gray-700 dark:text-gray-300 font-medium">Clique para selecionar um banner</p>
                          <p className="text-gray-500 text-sm mt-1">
                            Formato: JPG, PNG • Tamanho: Máx 5MB • Proporção: 9:16 (vertical)
                          </p>
                        </div>
                        <button
                          type="button"
                          onClick={() => fileInputRef.current?.click()}
                          className="bg-blue-500 hover:bg-blue-600 text-white px-6 py-2 rounded-lg transition-colors"
                        >
                          Selecionar Arquivo
                        </button>
                      </div>
                    )}
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/*"
                      onChange={handleFileSelect}
                      className="hidden"
                    />
                  </div>

                  {/* Error Messages */}
                  {aspectRatioError && (
                    <div className="mt-2 p-3 bg-red-500/10 border border-red-500/20 rounded-lg text-red-400 text-sm flex items-center gap-2">
                      <AlertCircle className="w-4 h-4" />
                      {aspectRatioError}
                    </div>
                  )}
                  
                  {uploadError && (
                    <div className="mt-2 p-3 bg-red-500/10 border border-red-500/20 rounded-lg text-red-400 text-sm flex items-center gap-2">
                      <AlertCircle className="w-4 h-4" />
                      {uploadError}
                    </div>
                  )}
                </div>

                {/* Action Buttons */}
                <div className="flex justify-end space-x-4 pt-4">
                  <button
                    type="button"
                    onClick={closeModal}
                    className="px-6 py-3 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    disabled={uploading}
                    className="bg-blue-500 hover:bg-blue-600 disabled:bg-gray-600 text-white px-6 py-3 rounded-lg transition-colors flex items-center space-x-2"
                  >
                    {uploading ? (
                      <Loader className="w-5 h-5 animate-spin" />
                    ) : (
                      <Save className="w-5 h-5" />
                    )}
                    {editingEvent ? 'Salvar Alterações' : 'Criar Evento'}
                  </button>
                </div>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default Events; 