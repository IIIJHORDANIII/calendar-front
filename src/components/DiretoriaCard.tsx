import React, { useState, useEffect, useCallback } from 'react';
import { Edit, Save, X, Mail, Plus, Trash2, Loader } from 'lucide-react';
import { useApi } from '../utils/api';

interface MembroDiretoria {
  id: string;
  nome: string;
  cargo: string;
  email: string;
  foto?: string;
}

const DiretoriaCard: React.FC = () => {
  const api = useApi();
  const [isEditing, setIsEditing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [membros, setMembros] = useState<MembroDiretoria[]>([]);
  const [userIgrejaTipo, setUserIgrejaTipo] = useState<string>('');

  // Buscar dados da diretoria da igreja
  const fetchDiretoriaData = useCallback(async () => {
    try {
      const user = JSON.parse(localStorage.getItem('user') || '{}');
      const token = localStorage.getItem('token');
      
      if (!user.igreja || !token) {
        setLoading(false);
        return;
      }

      // Buscar informações da igreja para verificar o tipo
      const igrejaResponse = await api.get(`/igrejas/${user.igreja}`);

      if (igrejaResponse.ok) {
        const igrejaData = await igrejaResponse.json();
        setUserIgrejaTipo(igrejaData.tipo || '');
      } else {
        console.log('Erro ao buscar dados da igreja:', igrejaResponse.status);
      }

              const response = await api.get(`/diretoria/${user.igreja}`);

      if (response.ok) {
        const data = await response.json();
        setMembros(data.membros || []);
      } else if (response.status === 404) {
        // Diretoria não encontrada, usar array vazio
        setMembros([]);
      }
    } catch (error) {
      console.error('Erro ao carregar dados da diretoria:', error);
      setError('Erro ao carregar dados da diretoria');
    } finally {
      setLoading(false);
    }
  }, [api]);

  useEffect(() => {
    fetchDiretoriaData();
  }, [fetchDiretoriaData]);

  const handleSave = async () => {
    try {
      setSaving(true);
      setError('');
      
      const user = JSON.parse(localStorage.getItem('user') || '{}');
      const token = localStorage.getItem('token');
      
      if (!user.igreja || !token) {
        setError('Usuário não tem igreja associada');
        return;
      }

      const formData = new FormData();
      formData.append('membros', JSON.stringify(membros));
      formData.append('igreja', user.igreja);

      const response = await api.request('/diretoria', {
        method: 'POST',
        body: formData,
        headers: {} // Remove Content-Type header for FormData
      });

      if (response.ok) {
        setIsEditing(false);
        console.log('Dados da diretoria salvos com sucesso');
      } else {
        const errorData = await response.json();
        setError(errorData.error || 'Erro ao salvar dados da diretoria');
      }
    } catch (error) {
      console.error('Erro ao salvar diretoria:', error);
      setError('Erro de conexão ao salvar dados');
    } finally {
      setSaving(false);
    }
  };

  const handleCancel = () => {
    fetchDiretoriaData(); // Recarregar dados originais
    setIsEditing(false);
    setError('');
  };

  const addMembro = () => {
    const newMembro: MembroDiretoria = {
      id: Date.now().toString(),
      nome: '',
      cargo: '',
      email: ''
    };
    setMembros([...membros, newMembro]);
  };

  const removeMembro = (id: string) => {
    setMembros(membros.filter(m => m.id !== id));
  };

  const updateMembro = (id: string, field: keyof MembroDiretoria, value: string) => {
    setMembros(membros.map(m => 
      m.id === id ? { ...m, [field]: value } : m
    ));
  };

  const openEmail = (email: string) => {
    const subject = 'Contato - Igreja';
    const body = 'Olá! Gostaria de entrar em contato.';
    const mailtoUrl = `mailto:${email}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
    window.open(mailtoUrl);
  };

  if (loading) {
    return (
      <div className="bg-gradient-to-br from-white to-gray-50 dark:from-gray-800 dark:to-gray-900 border border-gray-200 dark:border-slate-500/20 rounded-xl p-6 shadow-lg flex flex-col w-full max-w-xs mx-auto">
        <div className="flex items-center justify-center h-32">
          <Loader className="w-6 h-6 text-slate-500 animate-spin" />
        </div>
      </div>
    );
  }

  return (
    <div className="bg-gradient-to-br from-white to-gray-50 dark:from-gray-800 dark:to-gray-900 border border-gray-200 dark:border-slate-500/20 rounded-xl p-6 shadow-lg flex flex-col w-full max-w-xs mx-auto">
      {/* Header com botão de editar */}
      <div className="w-full flex justify-between items-center mb-6">
        <h2 className="text-xl font-bold text-gray-900 dark:text-white">Diretoria</h2>
        {!isEditing && userIgrejaTipo !== 'congregacao' ? (
          <button
            onClick={() => setIsEditing(true)}
            className="text-slate-400 hover:text-slate-300 transition-colors p-2 rounded-lg hover:bg-slate-500/10"
            title="Editar diretoria"
          >
            <Edit className="w-4 h-4" />
          </button>
        ) : isEditing ? (
          <div className="flex space-x-1">
            <button
              onClick={handleSave}
              disabled={saving}
              className="text-green-400 hover:text-green-300 transition-colors p-2 rounded-lg hover:bg-green-500/10 disabled:opacity-50"
              title="Salvar"
            >
              {saving ? <Loader className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
            </button>
            <button
              onClick={handleCancel}
              disabled={saving}
              className="text-red-400 hover:text-red-300 transition-colors p-2 rounded-lg hover:bg-red-500/10 disabled:opacity-50"
              title="Cancelar"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        ) : null}
      </div>

      {/* Mensagem de erro */}
      {error && (
        <div className="mb-4 p-3 bg-red-500/10 border border-red-500/20 rounded-lg text-red-400 text-sm">
          {error}
        </div>
      )}

      {/* Conteúdo da Diretoria */}
      <div className="space-y-4">
        {isEditing ? (
          // Modo de edição
          <div className="space-y-4">
            <div className="space-y-3">
              {membros.map((membro) => (
                <div key={membro.id} className="bg-gray-100 dark:bg-gray-700/50 border border-gray-200 dark:border-gray-600/50 rounded-lg p-4 space-y-3">
                  <div className="flex items-center justify-between">
                    <h4 className="text-gray-700 dark:text-slate-400 text-sm font-semibold">Membro</h4>
                    <button
                      onClick={() => removeMembro(membro.id)}
                      className="text-red-600 dark:text-red-400 hover:text-red-700 dark:hover:text-red-300 transition-colors p-1 rounded hover:bg-red-500/10"
                      title="Remover membro"
                    >
                      <Trash2 className="w-3 h-3" />
                    </button>
                  </div>
                  
                  <input
                    type="text"
                    value={membro.nome}
                    onChange={(e) => updateMembro(membro.id, 'nome', e.target.value)}
                    className="w-full bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 text-gray-900 dark:text-white text-sm"
                    placeholder="Nome do membro"
                  />
                  
                  <input
                    type="text"
                    value={membro.cargo}
                    onChange={(e) => updateMembro(membro.id, 'cargo', e.target.value)}
                    className="w-full bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 text-gray-700 dark:text-slate-400 text-sm"
                    placeholder="Cargo"
                  />
                  
                  <input
                    type="email"
                    value={membro.email}
                    onChange={(e) => updateMembro(membro.id, 'email', e.target.value)}
                    className="w-full bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 text-gray-700 dark:text-gray-400 text-sm"
                    placeholder="Email"
                  />
                </div>
              ))}
            </div>
            
            <button
              onClick={addMembro}
              className="w-full bg-gray-100 dark:bg-slate-500/20 border border-gray-200 dark:border-slate-500/30 rounded-lg p-3 text-gray-700 dark:text-slate-400 hover:bg-gray-200 dark:hover:bg-slate-500/30 transition-colors flex items-center justify-center space-x-2"
            >
              <Plus className="w-4 h-4" />
              <span className="text-sm font-medium">Adicionar Membro</span>
            </button>
          </div>
        ) : (
          // Modo de visualização
          <div className="space-y-4">
            {membros.length > 0 ? (
              <div className="bg-gray-100 dark:bg-slate-500/10 border border-gray-200 dark:border-slate-500/20 rounded-lg p-4">
                <h4 className="text-gray-700 dark:text-slate-400 text-xs font-semibold uppercase tracking-wide mb-3">Membros da Diretoria</h4>
                <div className="space-y-4">
                  {membros.map((membro) => (
                    <div key={membro.id} className="bg-white dark:bg-gray-700/30 border border-gray-200 dark:border-gray-600/50 rounded-lg p-3">
                      <div className="flex items-center justify-between mb-2">
                        <h5 className="text-gray-900 dark:text-white font-semibold text-sm">{membro.nome}</h5>
                        {membro.email && (
                          <button
                            onClick={() => openEmail(membro.email)}
                            className="text-gray-600 dark:text-slate-400 hover:text-gray-800 dark:hover:text-slate-300 transition-colors p-1 rounded hover:bg-gray-200 dark:hover:bg-slate-500/10"
                            title="Enviar email"
                          >
                            <Mail className="w-3 h-3" />
                          </button>
                        )}
                      </div>
                      <p className="text-gray-700 dark:text-slate-400 text-xs font-medium mb-1">{membro.cargo}</p>
                      {membro.email && <p className="text-gray-600 dark:text-gray-400 text-xs">{membro.email}</p>}
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <div className="bg-gray-100 dark:bg-slate-500/10 border border-gray-200 dark:border-slate-500/20 rounded-lg p-4 text-center">
                <p className="text-gray-700 dark:text-slate-400 text-sm">Nenhum membro da diretoria cadastrado</p>
                <p className="text-gray-600 dark:text-slate-500 text-xs mt-1">Clique em editar para adicionar membros</p>
              </div>
            )}
            
            <div className="bg-gray-100 dark:bg-gray-700/50 border border-gray-200 dark:border-gray-600/50 rounded-lg p-4">
              <h4 className="text-gray-700 dark:text-gray-400 text-xs font-semibold uppercase tracking-wide mb-2">Informações</h4>
              <p className="text-gray-900 dark:text-gray-300 text-xs leading-relaxed">
                A diretoria é responsável pela administração e gestão da igreja, trabalhando em conjunto com o pastor para o crescimento espiritual e organizacional da comunidade.
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default DiretoriaCard; 