import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { Edit, Save, X, Phone, Mail, MessageCircle, Loader } from 'lucide-react';

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
  podeEditar = false,
  onEditStart,
  isEditing,
  onSave,
  onCancel,
  saving,
  error,
  onInputChange,
  onPhotoChange,
  isCongregacao,
  editingPastorData
}: { 
  pastor: PastorData; 
  titulo: string; 
  podeEditar?: boolean;
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
}) => {
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
        {podeEditar && !isEditing ? (
          <button
            onClick={onEditStart}
            className="text-blue-400 hover:text-blue-300 transition-colors p-2 rounded-lg hover:bg-blue-500/10"
            title="Editar informações"
          >
            <Edit className="w-4 h-4" />
          </button>
        ) : podeEditar && isEditing ? (
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
          {podeEditar && isEditing && (
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
        {isEditing && podeEditar ? (
          // Modo de edição
          <div className="space-y-4">
            <div className="space-y-3">
              <input
                type="text"
                value={isCongregacao ? editingPastorData.nome : pastor.nome}
                onChange={(e) => onInputChange('nome', e.target.value)}
                className="w-full bg-gray-100 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 text-gray-900 dark:text-white text-center font-bold text-lg"
                placeholder="Nome do Pastor"
              />
              <input
                type="text"
                value={isCongregacao ? editingPastorData.cargo : pastor.cargo}
                onChange={(e) => onInputChange('cargo', e.target.value)}
                className="w-full bg-gray-100 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 text-blue-500 dark:text-blue-400 text-center text-sm"
                placeholder="Cargo"
              />
            </div>
            
            <textarea
              value={isCongregacao ? editingPastorData.frase : pastor.frase}
              onChange={(e) => onInputChange('frase', e.target.value)}
              className="w-full bg-gray-100 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 text-gray-600 dark:text-gray-300 text-center text-sm italic resize-none"
              placeholder="Frase inspiradora"
              rows={2}
            />
            
            <div className="space-y-3">
              <input
                type="email"
                value={isCongregacao ? editingPastorData.email : pastor.email}
                onChange={(e) => onInputChange('email', e.target.value)}
                className="w-full bg-gray-100 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 text-gray-600 dark:text-gray-400 text-sm"
                placeholder="Email"
              />
              <input
                type="tel"
                value={isCongregacao ? editingPastorData.telefone : pastor.telefone}
                onChange={(e) => onInputChange('telefone', e.target.value)}
                className="w-full bg-gray-100 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 text-gray-600 dark:text-gray-400 text-sm"
                placeholder="Telefone"
              />
            </div>
            
            <textarea
              value={isCongregacao ? editingPastorData.biografia : pastor.biografia}
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
  const [isEditing, setIsEditing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [isCongregacao, setIsCongregacao] = useState(false);
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
  const fetchPastorData = async () => {
    try {
      const user = JSON.parse(localStorage.getItem('user') || '{}');
      const token = localStorage.getItem('token');
      
      if (!user.igreja || !token) {
        setLoading(false);
        return;
      }

      // Verificar se é congregação e buscar dados duplos
      if (user.role === 'congregacao') {
        setIsCongregacao(true);
        const response = await fetch(`http://localhost:3005/pastor/duplo/${user.igreja}`, {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });

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
      } else {
        // Para sede ou admin, usar a rota normal
        const response = await fetch(`http://localhost:3005/pastor/${user.igreja}`, {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });

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
      }
    } catch (error) {
      console.error('Erro ao carregar dados do pastor:', error);
      setError('Erro ao carregar dados do pastor');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPastorData();
  }, []);

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

      const dadosParaSalvar = isCongregacao ? editingPastorData : pastorData;

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

      const response = await fetch('http://localhost:3005/pastor', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        },
        body: formData
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
          setPastorData(prev => ({
            ...prev,
            foto: savedData.foto || prev.foto
          }));
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
  }, [isCongregacao, editingPastorData, pastorData]);

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
    }
    setIsEditing(false);
    setError('');
  }, [isCongregacao, duploPastorData.congregacao]);

  const handleEditStart = useCallback(() => {
    if (isCongregacao && duploPastorData.congregacao) {
      setEditingPastorData({...duploPastorData.congregacao});
    }
    setIsEditing(true);
  }, [isCongregacao, duploPastorData.congregacao]);

  const handlePhotoChange = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        if (isCongregacao) {
          setEditingPastorData(prev => ({
            ...prev,
            foto: e.target?.result as string
          }));
        } else {
          setPastorData(prev => ({
            ...prev,
            foto: e.target?.result as string
          }));
        }
      };
      reader.readAsDataURL(file);
    }
  }, [isCongregacao]);

  const handleInputChange = useCallback((field: keyof PastorData, value: string) => {
    if (isCongregacao) {
      setEditingPastorData(prev => ({ ...prev, [field]: value }));
    } else {
      setPastorData(prev => ({ ...prev, [field]: value }));
    }
  }, [isCongregacao]);

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
            podeEditar={false}
            isEditing={false}
            onSave={handleSave}
            onCancel={handleCancel}
            saving={saving}
            error={error}
            onInputChange={handleInputChange}
            onPhotoChange={handlePhotoChange}
            isCongregacao={isCongregacao}
            editingPastorData={editingPastorData}
          />
        )}
        
        {/* Pastor da Congregação */}
        {duploPastorData.congregacao && (
          <PastorCardIndividual 
            pastor={duploPastorData.congregacao} 
            titulo="Pastor da Congregação" 
            podeEditar={true}
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
      podeEditar={true}
      isEditing={isEditing}
      onSave={handleSave}
      onCancel={handleCancel}
      saving={saving}
      error={error}
      onInputChange={handleInputChange}
      onPhotoChange={handlePhotoChange}
      isCongregacao={isCongregacao}
      editingPastorData={editingPastorData}
    />
  );
};

export default PastorCard; 