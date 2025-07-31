import React, { useState, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { 
  Calendar, 
  Clock, 
  Church, 
  Plus, 
  Edit, 
  Trash2, 
  ArrowLeft,
  X
} from 'lucide-react';
import { useApi } from '../utils/api';

interface Igreja {
  _id: string;
  nome: string;
  tipo: string;
}

interface Evento {
  _id: string;
  titulo: string;
  descricao: string;
  data: string;
  igreja: Igreja;
  tipo: string;
  imagem?: string;
}

const Events: React.FC = () => {
  const navigate = useNavigate();
  const api = useApi();
  const [eventos, setEventos] = useState<Evento[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingEvent, setEditingEvent] = useState<Evento | null>(null);

  const fetchEventos = useCallback(async () => {
    try {
      const response = await api.get('/evento');
      if (response.ok) {
        const data = await response.json();
        setEventos(data);
      }
    } catch (err) {
      console.error('Erro ao carregar eventos:', err);
    } finally {
      setLoading(false);
    }
  }, [api]);

  useEffect(() => {
    fetchEventos();
  }, [fetchEventos]);

  const openModal = (evento?: Evento) => {
    setEditingEvent(evento || null);
    setShowModal(true);
  };

  const closeModal = () => {
    setShowModal(false);
    setEditingEvent(null);
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm('Tem certeza que deseja excluir este evento?')) return;
    try {
      const response = await api.delete(`/evento/${id}`);
      if (response.ok) {
        await fetchEventos();
      }
    } catch (err) {
      console.error('Erro ao excluir evento:', err);
    }
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
              <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Eventos</h1>
              <p className="text-gray-600 dark:text-gray-400">
                Gerencie os eventos e calendários das igrejas
              </p>
            </div>
          </div>

          <button
            onClick={() => openModal()}
            className="flex items-center space-x-2 px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg text-sm font-medium transition-colors"
          >
            <Plus className="w-4 h-4" />
            <span>Novo Evento</span>
          </button>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-white dark:bg-gray-800 rounded-xl p-6 border border-gray-200 dark:border-gray-700">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-blue-600 dark:text-blue-400 text-sm font-medium">Total de Eventos</p>
                <p className="text-2xl font-bold text-blue-700 dark:text-blue-300">{eventos.length}</p>
              </div>
              <Calendar className="w-8 h-8 text-blue-500" />
            </div>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-xl p-6 border border-gray-200 dark:border-gray-700">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-green-600 dark:text-green-400 text-sm font-medium">Eventos Hoje</p>
                <p className="text-2xl font-bold text-green-700 dark:text-green-300">
                  {eventos.filter(e => {
                    const today = new Date();
                    const eventDate = new Date(e.data);
                    return today.toDateString() === eventDate.toDateString();
                  }).length}
                </p>
              </div>
              <Clock className="w-8 h-8 text-green-500" />
            </div>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-xl p-6 border border-gray-200 dark:border-gray-700">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-yellow-600 dark:text-yellow-400 text-sm font-medium">Próximos</p>
                <p className="text-2xl font-bold text-yellow-700 dark:text-yellow-300">
                  {eventos.filter(e => new Date(e.data) > new Date()).length}
                </p>
              </div>
              <Calendar className="w-8 h-8 text-yellow-500" />
            </div>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-xl p-6 border border-gray-200 dark:border-gray-700">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-purple-600 dark:text-purple-400 text-sm font-medium">Igrejas</p>
                <p className="text-2xl font-bold text-purple-700 dark:text-purple-300">
                  {new Set(eventos.map(e => e.igreja?._id)).size}
                </p>
              </div>
              <Church className="w-8 h-8 text-purple-500" />
            </div>
          </div>
        </div>

        {/* Events List */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700">
          <div className="p-6">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-6">Lista de Eventos</h3>
            
            {eventos.length === 0 ? (
              <div className="text-center py-12">
                <Calendar className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">Nenhum evento encontrado</h3>
                <p className="text-gray-600 dark:text-gray-400 mb-6">
                  Comece adicionando o primeiro evento ao sistema
                </p>
                <button
                  onClick={() => openModal()}
                  className="bg-blue-500 hover:bg-blue-600 text-white px-6 py-3 rounded-lg flex items-center space-x-2 mx-auto transition-colors"
                >
                  <Plus className="w-4 h-4" />
                  <span>Adicionar Primeiro Evento</span>
                </button>
              </div>
            ) : (
              <div className="space-y-4">
                {eventos.map((evento) => (
                  <motion.div
                    key={evento._id}
                    className="border border-gray-200 dark:border-gray-600 rounded-lg p-4 hover:shadow-md transition-all"
                    whileHover={{ y: -2 }}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center space-x-2 mb-2">
                          <span className={`px-2 py-1 text-xs rounded-full ${
                            evento.tipo === 'sede' 
                              ? 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300'
                              : 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300'
                          }`}>
                            {evento.tipo === 'sede' ? 'Sede' : 'Congregação'}
                          </span>
                        </div>
                        
                        <h4 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                          {evento.titulo}
                        </h4>
                        <p className="text-gray-600 dark:text-gray-400 mb-3">
                          {evento.descricao}
                        </p>
                        
                        <div className="flex items-center space-x-6 text-sm text-gray-500 dark:text-gray-400">
                          <div className="flex items-center space-x-2">
                            <Calendar className="w-4 h-4" />
                            <span>{new Date(evento.data).toLocaleDateString('pt-BR')}</span>
                          </div>
                          <div className="flex items-center space-x-2">
                            <Clock className="w-4 h-4" />
                            <span>{new Date(evento.data).toLocaleTimeString('pt-BR', { 
                              hour: '2-digit', 
                              minute: '2-digit' 
                            })}</span>
                          </div>
                          <div className="flex items-center space-x-2">
                            <Church className="w-4 h-4" />
                            <span>{evento.igreja?.nome}</span>
                          </div>
                        </div>
                      </div>
                      
                      <div className="flex items-center space-x-2 ml-4">
                        <button
                          onClick={() => openModal(evento)}
                          className="text-blue-500 hover:text-blue-600 p-2 rounded-lg hover:bg-blue-50 dark:hover:bg-blue-900/20"
                          title="Editar evento"
                        >
                          <Edit className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDelete(evento._id)}
                          className="text-red-500 hover:text-red-600 p-2 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20"
                          title="Excluir evento"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Simple Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <motion.div
            className="bg-white dark:bg-gray-800 rounded-xl p-6 w-full max-w-md"
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
          >
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold text-gray-900 dark:text-white">
                {editingEvent ? 'Editar Evento' : 'Novo Evento'}
              </h2>
              <button
                onClick={closeModal}
                className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200"
              >
                <X className="w-6 h-6" />
              </button>
            </div>
            
            <div className="text-center py-8">
              <Calendar className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-600 dark:text-gray-400">
                Funcionalidade de {editingEvent ? 'edição' : 'criação'} de eventos em desenvolvimento...
              </p>
            </div>
            
            <div className="flex justify-end mt-6">
              <button
                onClick={closeModal}
                className="px-4 py-2 bg-gray-200 dark:bg-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-300 dark:hover:bg-gray-500 transition-colors"
              >
                Fechar
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  );
};

export default Events;