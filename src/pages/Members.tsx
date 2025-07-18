import React, { useState, useEffect } from 'react';
import { ArrowLeft, Plus, Edit, Trash2, X } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

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

const Members: React.FC = () => {
  const [membros, setMembros] = useState<Membro[]>([]);
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
  const navigate = useNavigate();

  useEffect(() => {
    fetchMembros();
  }, []);

  const fetchMembros = async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        navigate('/login');
        return;
      }
      const response = await fetch('http://localhost:3005/membro', {
        headers: { 'Authorization': `Bearer ${token}` },
      });
      if (response.ok) {
        const data = await response.json();
        setMembros(data);
      }
    } catch (err) {
      console.error('Erro ao carregar membros:', err);
    } finally {
      setLoading(false);
    }
  };

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
      const url = editMode
        ? `http://localhost:3005/membro/${editId}`
        : 'http://localhost:3005/membro';
      const method = editMode ? 'PUT' : 'POST';
      const response = await fetch(url, {
        method,
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });
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
      const response = await fetch(`http://localhost:3005/membro/${id}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` },
      });
      if (response.ok) {
        await fetchMembros();
      }
    } catch (err) {
      // erro silencioso
    }
  };

  if (loading) {
      return (
    <div className="min-h-screen flex items-center justify-center">
        <div className="text-gray-900 dark:text-white">Carregando membros...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen">
      <div className="max-w-4xl mx-auto py-10 px-4">
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center space-x-4">
            <button
              onClick={() => navigate('/dashboard')}
              className="text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors p-2 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-700"
              title="Voltar ao Dashboard"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Membros</h2>
          </div>
          <button
            className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-lg flex items-center space-x-2 transition-colors"
            onClick={() => openModal()}
          >
            <Plus className="w-4 h-4" />
            <span>Novo Membro</span>
          </button>
        </div>
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6 border border-gray-200 dark:border-gray-700">
          {membros.length === 0 ? (
            <div className="text-gray-600 dark:text-gray-400 text-center">Nenhum membro cadastrado.</div>
          ) : (
            <div className="space-y-4">
              {membros.map((membro) => (
                <div key={membro._id} className="flex items-center justify-between bg-gray-100 dark:bg-gray-700 rounded-lg p-4">
                  <div>
                    <div className="text-gray-900 dark:text-white font-semibold text-lg">{membro.nome}</div>
                    <div className="text-gray-600 dark:text-gray-400 text-sm">Nascimento: {new Date(membro.dataNascimento).toLocaleDateString('pt-BR')}</div>
                    <div className="text-gray-600 dark:text-gray-400 text-sm">Cargo: {membro.cargo}</div>
                    <div className="text-gray-600 dark:text-gray-400 text-sm">CPF: {membro.cpf}</div>
                    <div className="text-gray-600 dark:text-gray-400 text-xs">Igreja: {membro.igreja?.nome}</div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <button
                      className="text-blue-500 dark:text-blue-400 hover:text-blue-600 dark:hover:text-blue-300 transition-colors p-2"
                      onClick={() => openModal(membro)}
                      title="Editar"
                    >
                      <Edit className="w-4 h-4" />
                    </button>
                    <button
                      className="text-red-500 dark:text-red-400 hover:text-red-600 dark:hover:text-red-300 transition-colors p-2"
                      onClick={() => handleDelete(membro._id)}
                      title="Deletar"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}
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