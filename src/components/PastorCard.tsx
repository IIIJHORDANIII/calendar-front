import React, { useState, useEffect, useCallback } from 'react';
import { Edit, Save, X, Phone, Mail, MessageCircle, Loader } from 'lucide-react';
import { useApi } from '../utils/api';

interface PastorData {
  nome: string;
  cargo: string;
  foto: string;
  telefone: string;
  email: string;
  biografia: string;
  frase: string;
}

interface DuploPastorData {
  matriz: PastorData | null;
  congregacao: PastorData | null;
}

// Componente para renderizar um card de pastor individual
const PastorCardIndividual = React.memo(({ 
  pastor, 
  titulo, 
  userIgrejaTipo,
  onEditStart,
  isEditing,
  onSave,
  onCancel,
  saving,
  error,
  onInputChange,
  onPhotoChange,
  isCongregacao,
  editingPastorData,
  isCardCongregacao = false
}: { 
  pastor: PastorData; 
  titulo: string; 
  userIgrejaTipo: string;
  onEditStart?: () => void;
  isEditing: boolean;
  onSave: () => void;
  onCancel: () => void;
  saving: boolean;
  error: string;
  onInputChange: (field: keyof PastorData, value: string) => void;
  onPhotoChange: (event: React.ChangeEvent<HTMLInputElement>) => void;
  isCongregacao: boolean;
  editingPastorData: PastorData;
  isCardCongregacao?: boolean;
}) => {
  // Determinar se este card pode ser editado pelo usuário atual
  const podeEditarEsteCard = () => {
    // Sedes/admin podem editar qualquer card
    if (userIgrejaTipo !== 'congregacao') {
      return true;
    }
    // Congregações só podem editar o card do pastor da congregação
    return isCardCongregacao;
  };

  const openWhatsApp = (telefone: string) => {
    const phoneNumber = telefone.replace(/\D/g, '');
    const message = 'Olá Pastor! Gostaria de conversar com o senhor.';
    const whatsappUrl = `https://wa.me/55${phoneNumber}?text=${encodeURIComponent(message)}`;
    window.open(whatsappUrl, '_blank');
  };

  const openEmail = (email: string) => {
    const subject = 'Contato - Igreja';
    const body = 'Olá Pastor! Gostaria de entrar em contato.';
    const mailtoUrl = `mailto:${email}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
    window.open(mailtoUrl);
  };

  const openPhone = (telefone: string) => {
    window.open(`tel:${telefone}`);
  };

  return (
    <div className="bg-gradient-to-br from-white to-gray-50 dark:from-gray-800 dark:to-gray-900 border border-gray-200 dark:border-blue-500/20 rounded-xl p-6 shadow-lg flex flex-col w-full max-w-xs mx-auto mb-4">
      {/* Header com botão de editar */}
      <div className="w-full flex justify-between items-center mb-6">
        <h2 className="text-xl font-bold text-gray-900 dark:text-white">{titulo}</h2>
        {!isEditing && podeEditarEsteCard() ? (
          <button
            onClick={onEditStart}
            className="text-blue-400 hover:text-blue-300 transition-colors p-2 rounded-lg hover:bg-blue-500/10"
            title="Editar informações"
          >
            <Edit className="w-4 h-4" />
          </button>
        ) : isEditing ? (
          <div className="flex space-x-1">
            <button
              onClick={onSave}
              disabled={saving}
              className="text-green-400 hover:text-green-300 transition-colors p-2 rounded-lg hover:bg-green-500/10 disabled:opacity-50"
              title="Salvar"
            >
              {saving ? <Loader className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
            </button>
            <button
              onClick={onCancel}
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

      {/* Foto do Pastor */}
      <div className="flex justify-center mb-6">
        <div className="relative">
          <img
            src={pastor.foto}
            alt="Pastor"
            className="w-28 h-28 rounded-full border-4 border-blue-500 shadow-lg object-cover"
          />
          {isEditing && podeEditarEsteCard() && (
            <label className="absolute -bottom-1 -right-1 bg-blue-500 hover:bg-blue-600 text-white rounded-full p-2 cursor-pointer transition-colors shadow-lg">
              <input
                type="file"
                accept="image/*"
                onChange={onPhotoChange}
                className="hidden"
              />
              <Edit className="w-3 h-3" />
            </label>
          )}
        </div>
      </div>

      {/* Informações do Pastor */}
      <div className="space-y-4">
        {isEditing ? (
          // Modo de edição
          <div className="space-y-4">
            <div className="space-y-3">
              <input
                type="text"
                value={editingPastorData.nome}
                onChange={(e) => onInputChange('nome', e.target.value)}
                className="w-full bg-gray-100 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 text-gray-900 dark:text-white text-center font-bold text-lg"
                placeholder="Nome do Pastor"
              />
              <input
                type="text"
                value={editingPastorData.cargo}
                onChange={(e) => onInputChange('cargo', e.target.value)}
                className="w-full bg-gray-100 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 text-blue-500 dark:text-blue-400 text-center text-sm"
                placeholder="Cargo"
              />
            </div>
            
            <textarea
              value={editingPastorData.frase}
              onChange={(e) => onInputChange('frase', e.target.value)}
              className="w-full bg-gray-100 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 text-gray-600 dark:text-gray-300 text-center text-sm italic resize-none"
              placeholder="Frase inspiradora"
              rows={2}
            />
            
            <div className="space-y-3">
              <input
                type="email"
                value={editingPastorData.email}
                onChange={(e) => onInputChange('email', e.target.value)}
                className="w-full bg-gray-100 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 text-gray-600 dark:text-gray-400 text-sm"
                placeholder="Email"
              />
              <input
                type="tel"
                value={editingPastorData.telefone}
                onChange={(e) => onInputChange('telefone', e.target.value)}
                className="w-full bg-gray-100 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 text-gray-600 dark:text-gray-400 text-sm"
                placeholder="Telefone"
              />
            </div>
            
            <textarea
              value={editingPastorData.biografia}
              onChange={(e) => onInputChange('biografia', e.target.value)}
              className="w-full bg-gray-100 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 text-gray-600 dark:text-gray-300 text-sm resize-none"
              placeholder="Biografia"
              rows={3}
            />
          </div>
        ) : (
          // Modo de visualização
          <div className="space-y-4">
            <div className="text-center">
              <h3 className="text-lg font-bold text-gray-900 dark:text-white">{pastor.nome || 'Nome não informado'}</h3>
              <p className="text-blue-500 dark:text-blue-400 text-sm">{pastor.cargo}</p>
            </div>
            
            {pastor.frase && (
              <p className="text-gray-600 dark:text-gray-300 text-sm italic text-center">"{pastor.frase}"</p>
            )}
            
            {(pastor.telefone || pastor.email) && (
              <div className="flex justify-center space-x-2">
                {pastor.telefone && (
                  <button
                    onClick={() => openPhone(pastor.telefone)}
                    className="bg-green-600 hover:bg-green-700 text-white p-2 rounded-full transition-colors"
                    title="Ligar"
                  >
                    <Phone className="w-4 h-4" />
                  </button>
                )}
                {pastor.email && (
                  <button
                    onClick={() => openEmail(pastor.email)}
                    className="bg-blue-600 hover:bg-blue-700 text-white p-2 rounded-full transition-colors"
                    title="Enviar email"
                  >
                    <Mail className="w-4 h-4" />
                  </button>
                )}
                {pastor.telefone && (
                  <button
                    onClick={() => openWhatsApp(pastor.telefone)}
                    className="bg-green-500 hover:bg-green-600 text-white p-2 rounded-full transition-colors"
                    title="WhatsApp"
                  >
                    <MessageCircle className="w-4 h-4" />
                  </button>
                )}
              </div>
            )}
            
            {pastor.biografia && (
              <div className="bg-gray-100 dark:bg-gray-700/50 rounded-lg p-3">
                <p className="text-gray-900 dark:text-gray-300 text-sm">{pastor.biografia}</p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
});

PastorCardIndividual.displayName = 'PastorCardIndividual';

const PastorCard: React.FC = () => {
  const api = useApi();
  const [isEditing, setIsEditing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [isCongregacao, setIsCongregacao] = useState(false);
  const [userIgrejaTipo, setUserIgrejaTipo] = useState<string>('');
  const [pastorData, setPastorData] = useState<PastorData>({
    nome: '',
    cargo: 'Pastor Presidente',
    foto: 'https://randomuser.me/api/portraits/men/32.jpg',
    telefone: '',
    email: '',
    biografia: '',
    frase: ''
  });
  const [duploPastorData, setDuploPastorData] = useState<DuploPastorData>({
    matriz: null,
    congregacao: null
  });
  const [editingPastorData, setEditingPastorData] = useState<PastorData>({
    nome: '',
    cargo: 'Pastor da Congregação',
    foto: 'https://randomuser.me/api/portraits/men/33.jpg',
    telefone: '',
    email: '',
    biografia: '',
    frase: ''
  });

  // Buscar dados do pastor da igreja
  const fetchPastorData = useCallback(async () => {
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

      // Verificar se é congregação e buscar dados duplos
      if (user.role === 'congregacao') {
        setIsCongregacao(true);
        const response = await api.get(`/pastor/duplo/${user.igreja}`);

        if (response.ok) {
          const data = await response.json();
          const congregacaoData = data.congregacao || {
            nome: '',
            cargo: 'Pastor da Congregação',
            foto: 'https://randomuser.me/api/portraits/men/33.jpg',
            telefone: '',
            email: '',
            biografia: '',
            frase: ''
          };
          
          setDuploPastorData({
            matriz: data.matriz || {
              nome: '',
              cargo: 'Pastor Presidente',
              foto: 'https://randomuser.me/api/portraits/men/32.jpg',
              telefone: '',
              email: '',
              biografia: '',
              frase: ''
            },
            congregacao: congregacaoData
          });
          
          // Inicializar também o editingPastorData
          setEditingPastorData({...congregacaoData});
        }
      } else if (user.role === 'sede' || user.role === 'admin') {
        // Para sede ou admin, usar a rota normal
        setIsCongregacao(false);
        const response = await api.get(`/pastor/${user.igreja}`);

        if (response.ok) {
          const data = await response.json();
          setPastorData({
            nome: data.nome || '',
            cargo: data.cargo || 'Pastor Presidente',
            foto: data.foto || 'https://randomuser.me/api/portraits/men/32.jpg',
            telefone: data.telefone || '',
            email: data.email || '',
            biografia: data.biografia || '',
            frase: data.frase || ''
          });
        } else if (response.status === 404) {
          // Pastor não encontrado, usar dados padrão
          setPastorData({
            nome: '',
            cargo: 'Pastor Presidente',
            foto: 'https://randomuser.me/api/portraits/men/32.jpg',
            telefone: '',
            email: '',
            biografia: '',
            frase: ''
          });
        }
      } else {
        console.warn('PastorCard - Role não reconhecido:', user.role);
      }
    } catch (error) {
      console.error('Erro ao carregar dados do pastor:', error);
      setError('Erro ao carregar dados do pastor');
    } finally {
      setLoading(false);
    }
  }, [api]);

  useEffect(() => {
    fetchPastorData();
  }, [fetchPastorData]);

  const handleSave = useCallback(async () => {
    try {
      setSaving(true);
      setError('');
      
      const user = JSON.parse(localStorage.getItem('user') || '{}');
      const token = localStorage.getItem('token');
      
      if (!user.igreja || !token) {
        setError('Usuário não tem igreja associada');
        return;
      }

      const dadosParaSalvar = editingPastorData;

      const formData = new FormData();
      formData.append('nome', dadosParaSalvar.nome);
      formData.append('cargo', dadosParaSalvar.cargo);
      formData.append('telefone', dadosParaSalvar.telefone);
      formData.append('email', dadosParaSalvar.email);
      formData.append('biografia', dadosParaSalvar.biografia);
      formData.append('frase', dadosParaSalvar.frase);
      formData.append('igreja', user.igreja);

      // Se a foto foi alterada (não é uma URL externa), adicionar ao formData
      if (dadosParaSalvar.foto && !dadosParaSalvar.foto.startsWith('http')) {
        // Converter base64 para arquivo
        const response = await fetch(dadosParaSalvar.foto);
        const blob = await response.blob();
        const file = new File([blob], 'pastor-foto.jpg', { type: 'image/jpeg' });
        formData.append('foto', file);
      }

      const response = await api.request('/pastor', {
        method: 'POST',
        body: formData,
        headers: {} // Remove Content-Type header for FormData
      });

      if (response.ok) {
        const savedData = await response.json();
        if (isCongregacao) {
          setEditingPastorData(prev => ({
            ...prev,
            foto: savedData.foto || prev.foto
          }));
          // Atualizar também o duploPastorData
          setDuploPastorData(prev => ({
            ...prev,
            congregacao: {
              ...prev.congregacao!,
              ...savedData
            }
          }));
        } else {
          // Para sede/admin, atualizar pastorData com dados salvos
          setPastorData({
            ...savedData,
            foto: savedData.foto || editingPastorData.foto
          });
        }
        setIsEditing(false);
        console.log('Dados do pastor salvos com sucesso');
      } else {
        const errorData = await response.json();
        setError(errorData.error || 'Erro ao salvar dados do pastor');
      }
    } catch (error) {
      console.error('Erro ao salvar pastor:', error);
      setError('Erro de conexão ao salvar dados');
    } finally {
      setSaving(false);
    }
  }, [api, isCongregacao, editingPastorData]);

  const handleCancel = useCallback(() => {
    if (isCongregacao) {
      // Restaurar dados originais da congregação
      setEditingPastorData({...(duploPastorData.congregacao || {
        nome: '',
        cargo: 'Pastor da Congregação',
        foto: 'https://randomuser.me/api/portraits/men/33.jpg',
        telefone: '',
        email: '',
        biografia: '',
        frase: ''
      })});
    } else {
      // Para sede/admin, restaurar dados originais
      setEditingPastorData({...pastorData});
    }
    setIsEditing(false);
    setError('');
  }, [isCongregacao, duploPastorData.congregacao, pastorData]);

  const handleEditStart = useCallback(() => {
    if (isCongregacao && duploPastorData.congregacao) {
      setEditingPastorData({...duploPastorData.congregacao});
    } else if (!isCongregacao) {
      // Para sede/admin, inicializar editingPastorData com dados atuais
      setEditingPastorData({...pastorData});
    }
    setIsEditing(true);
  }, [isCongregacao, duploPastorData.congregacao, pastorData]);

  const handlePhotoChange = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        // Sempre atualizar editingPastorData durante a edição
        setEditingPastorData(prev => ({
          ...prev,
          foto: e.target?.result as string
        }));
      };
      reader.readAsDataURL(file);
    }
  }, []);

  const handleInputChange = useCallback((field: keyof PastorData, value: string) => {
    // Sempre atualizar editingPastorData durante a edição
    setEditingPastorData(prev => ({ ...prev, [field]: value }));
  }, []);

  if (loading) {
    return (
      <div className="bg-gradient-to-br from-gray-800 to-gray-900 border-blue-500/20 rounded-xl p-6 shadow-lg flex flex-col w-full max-w-xs mx-auto">
        <div className="flex items-center justify-center h-32">
          <Loader className="w-6 h-6 text-blue-500 animate-spin" />
        </div>
      </div>
    );
  }

  // Se for congregação, exibir dois cards
  if (isCongregacao) {
    return (
      <div className="space-y-6">
        {/* Pastor Presidente */}
        {duploPastorData.matriz && (
          <PastorCardIndividual 
            pastor={duploPastorData.matriz} 
            titulo="Pastor Presidente" 
            userIgrejaTipo={userIgrejaTipo}
            isEditing={false}
            onSave={handleSave}
            onCancel={handleCancel}
            saving={saving}
            error={error}
            onInputChange={handleInputChange}
            onPhotoChange={handlePhotoChange}
            isCongregacao={isCongregacao}
            editingPastorData={editingPastorData}
            isCardCongregacao={false}
          />
        )}
        
        {/* Pastor da Congregação */}
        {duploPastorData.congregacao && (
          <PastorCardIndividual 
            pastor={duploPastorData.congregacao} 
            titulo="Pastor da Congregação" 
            userIgrejaTipo={userIgrejaTipo}
            onEditStart={handleEditStart}
            isEditing={isEditing}
            onSave={handleSave}
            onCancel={handleCancel}
            saving={saving}
            error={error}
            onInputChange={handleInputChange}
            onPhotoChange={handlePhotoChange}
            isCongregacao={isCongregacao}
            editingPastorData={editingPastorData}
            isCardCongregacao={true}
          />
        )}
      </div>
    );
  }

  // Para sede ou admin, exibir card único
  return (
    <PastorCardIndividual 
      pastor={pastorData} 
      titulo="Pastor" 
      userIgrejaTipo={userIgrejaTipo}
      onEditStart={handleEditStart}
      isEditing={isEditing}
      onSave={handleSave}
      onCancel={handleCancel}
      saving={saving}
      error={error}
      onInputChange={handleInputChange}
      onPhotoChange={handlePhotoChange}
      isCongregacao={isCongregacao}
      editingPastorData={editingPastorData}
      isCardCongregacao={false}
    />
  );
};

export default PastorCard; 