import React, { useState, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { 
  DollarSign, 
  TrendingUp, 
  Target,
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
}

interface Dizimo {
  _id: string;
  mes: string;
  ano: number;
  igreja: Igreja;
  valorDizimos: number;
  valorOfertas: number;
  valorEspeciais: number;
  total: number;
  observacoes?: string;
}

const Tithes: React.FC = () => {
  const navigate = useNavigate();
  const api = useApi();
  const [dizimos, setDizimos] = useState<Dizimo[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingDizimo, setEditingDizimo] = useState<Dizimo | null>(null);

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value);
  };

  const fetchDizimos = useCallback(async () => {
    try {
      const response = await api.get('/dizimo');
      if (response.ok) {
        const data = await response.json();
        setDizimos(data);
      }
    } catch (err) {
      console.error('Erro ao carregar dízimos:', err);
    } finally {
      setLoading(false);
    }
  }, [api]);

  useEffect(() => {
    fetchDizimos();
  }, [fetchDizimos]);

  const openModal = (dizimo?: Dizimo) => {
    setEditingDizimo(dizimo || null);
    setShowModal(true);
  };

  const closeModal = () => {
    setShowModal(false);
    setEditingDizimo(null);
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm('Tem certeza que deseja excluir este registro?')) return;
    try {
      const response = await api.delete(`/dizimo/${id}`);
      if (response.ok) {
        await fetchDizimos();
      }
    } catch (err) {
      console.error('Erro ao excluir dízimo:', err);
    }
  };

  // Cálculos básicos
  const totalArrecadado = dizimos.reduce((sum, dizimo) => sum + dizimo.total, 0);
  const totalDizimos = dizimos.reduce((sum, dizimo) => sum + dizimo.valorDizimos, 0);
  const totalOfertas = dizimos.reduce((sum, dizimo) => sum + dizimo.valorOfertas, 0);
  const totalEspeciais = dizimos.reduce((sum, dizimo) => sum + dizimo.valorEspeciais, 0);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
          <p className="text-gray-900 dark:text-white">Carregando dados financeiros...</p>
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
              <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Análise Financeira</h1>
              <p className="text-gray-600 dark:text-gray-400">
                Dízimos, ofertas e projeções financeiras
              </p>
            </div>
          </div>

          <button
            onClick={() => openModal()}
            className="flex items-center space-x-2 px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg text-sm font-medium transition-colors"
          >
            <Plus className="w-4 h-4" />
            <span>Novo Registro</span>
          </button>
        </div>

        {/* KPI Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <motion.div 
            className="bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-900/20 dark:to-blue-800/20 border border-blue-200 dark:border-blue-500/20 rounded-xl p-6"
            whileHover={{ scale: 1.02 }}
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-blue-600 dark:text-blue-400 text-sm font-medium">Total Arrecadado</p>
                <p className="text-2xl font-bold text-blue-700 dark:text-blue-300">
                  {formatCurrency(totalArrecadado)}
                </p>
              </div>
              <DollarSign className="w-8 h-8 text-blue-500" />
            </div>
          </motion.div>

          <motion.div 
            className="bg-gradient-to-br from-green-50 to-green-100 dark:from-green-900/20 dark:to-green-800/20 border border-green-200 dark:border-green-500/20 rounded-xl p-6"
            whileHover={{ scale: 1.02 }}
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-green-600 dark:text-green-400 text-sm font-medium">Dízimos</p>
                <p className="text-2xl font-bold text-green-700 dark:text-green-300">
                  {formatCurrency(totalDizimos)}
                </p>
              </div>
              <TrendingUp className="w-8 h-8 text-green-500" />
            </div>
          </motion.div>

          <motion.div 
            className="bg-gradient-to-br from-yellow-50 to-yellow-100 dark:from-yellow-900/20 dark:to-yellow-800/20 border border-yellow-200 dark:border-yellow-500/20 rounded-xl p-6"
            whileHover={{ scale: 1.02 }}
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-yellow-600 dark:text-yellow-400 text-sm font-medium">Ofertas</p>
                <p className="text-2xl font-bold text-yellow-700 dark:text-yellow-300">
                  {formatCurrency(totalOfertas)}
                </p>
              </div>
              <Target className="w-8 h-8 text-yellow-500" />
            </div>
          </motion.div>

          <motion.div 
            className="bg-gradient-to-br from-purple-50 to-purple-100 dark:from-purple-900/20 dark:to-purple-800/20 border border-purple-200 dark:border-purple-500/20 rounded-xl p-6"
            whileHover={{ scale: 1.02 }}
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-purple-600 dark:text-purple-400 text-sm font-medium">Especiais</p>
                <p className="text-2xl font-bold text-purple-700 dark:text-purple-300">
                  {formatCurrency(totalEspeciais)}
                </p>
              </div>
              <TrendingUp className="w-8 h-8 text-purple-500" />
            </div>
          </motion.div>
        </div>

        {/* Records Table */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700">
          <div className="p-6">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-6">Registros Financeiros</h3>
            
            {dizimos.length === 0 ? (
              <div className="text-center py-12">
                <DollarSign className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">Nenhum registro encontrado</h3>
                <p className="text-gray-600 dark:text-gray-400 mb-6">
                  Comece adicionando o primeiro registro financeiro
                </p>
                <button
                  onClick={() => openModal()}
                  className="bg-blue-500 hover:bg-blue-600 text-white px-6 py-3 rounded-lg flex items-center space-x-2 mx-auto transition-colors"
                >
                  <Plus className="w-4 h-4" />
                  <span>Adicionar Primeiro Registro</span>
                </button>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-gray-200 dark:border-gray-600">
                      <th className="text-left py-3 px-4 font-medium text-gray-900 dark:text-white">Período</th>
                      <th className="text-left py-3 px-4 font-medium text-gray-900 dark:text-white">Igreja</th>
                      <th className="text-right py-3 px-4 font-medium text-gray-900 dark:text-white">Dízimos</th>
                      <th className="text-right py-3 px-4 font-medium text-gray-900 dark:text-white">Ofertas</th>
                      <th className="text-right py-3 px-4 font-medium text-gray-900 dark:text-white">Especiais</th>
                      <th className="text-right py-3 px-4 font-medium text-gray-900 dark:text-white">Total</th>
                      <th className="text-center py-3 px-4 font-medium text-gray-900 dark:text-white">Ações</th>
                    </tr>
                  </thead>
                  <tbody>
                    {dizimos.map((dizimo) => (
                      <tr key={dizimo._id} className="border-b border-gray-100 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700/50">
                        <td className="py-3 px-4 text-gray-900 dark:text-white">
                          {String(dizimo.mes).padStart(2, '0')}/{dizimo.ano}
                        </td>
                        <td className="py-3 px-4 text-gray-600 dark:text-gray-400">
                          {dizimo.igreja?.nome}
                        </td>
                        <td className="py-3 px-4 text-right text-gray-900 dark:text-white">
                          {formatCurrency(dizimo.valorDizimos)}
                        </td>
                        <td className="py-3 px-4 text-right text-gray-900 dark:text-white">
                          {formatCurrency(dizimo.valorOfertas)}
                        </td>
                        <td className="py-3 px-4 text-right text-gray-900 dark:text-white">
                          {formatCurrency(dizimo.valorEspeciais)}
                        </td>
                        <td className="py-3 px-4 text-right font-semibold text-gray-900 dark:text-white">
                          {formatCurrency(dizimo.total)}
                        </td>
                        <td className="py-3 px-4">
                          <div className="flex items-center justify-center space-x-2">
                            <button
                              onClick={() => openModal(dizimo)}
                              className="text-blue-500 hover:text-blue-600 p-1 rounded hover:bg-blue-50 dark:hover:bg-blue-900/20"
                              title="Editar registro"
                            >
                              <Edit className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => handleDelete(dizimo._id)}
                              className="text-red-500 hover:text-red-600 p-1 rounded hover:bg-red-50 dark:hover:bg-red-900/20"
                              title="Excluir registro"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
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
                {editingDizimo ? 'Editar Registro' : 'Novo Registro'}
              </h2>
              <button
                onClick={closeModal}
                className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200"
              >
                <X className="w-6 h-6" />
              </button>
            </div>
            
            <div className="text-center py-8">
              <DollarSign className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-600 dark:text-gray-400">
                Funcionalidade de {editingDizimo ? 'edição' : 'criação'} de registros financeiros em desenvolvimento...
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

export default Tithes;