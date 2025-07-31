import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Palette, 
  Settings, 
  Save, 
  RotateCcw, 
  Eye, 
  Sun, 
  Moon,
  Upload,
  X,
  Check
} from 'lucide-react';
import { useCustomTheme } from '../hooks/useCustomTheme';
import { useApi } from '../utils/api';

interface ThemeCustomizerProps {
  isOpen: boolean;
  onClose: () => void;
  igrejaId?: string;
  userRole?: string;
}

const ThemeCustomizer: React.FC<ThemeCustomizerProps> = ({ 
  isOpen, 
  onClose, 
  igrejaId, 
  userRole 
}) => {
  const { theme, updateTheme, resetTheme } = useCustomTheme(igrejaId);
  const [tempTheme, setTempTheme] = useState(theme);
  const [saving, setSaving] = useState(false);
  const [previewMode, setPreviewMode] = useState(false);
  const api = useApi();

  useEffect(() => {
    setTempTheme(theme);
  }, [theme]);

  const presetColors = [
    { name: 'Azul Clássico', primary: '#4472C4', secondary: '#70AD47', accent: '#FFC000' },
    { name: 'Verde Natureza', primary: '#228B22', secondary: '#32CD32', accent: '#FFD700' },
    { name: 'Roxo Elegante', primary: '#8A2BE2', secondary: '#9370DB', accent: '#FFB6C1' },
    { name: 'Laranja Vibrante', primary: '#FF6347', secondary: '#FFA500', accent: '#FFFF00' },
    { name: 'Azul Oceano', primary: '#1E90FF', secondary: '#00CED1', accent: '#F0E68C' },
    { name: 'Vermelho Coral', primary: '#DC143C', secondary: '#FF7F50', accent: '#FFFFE0' }
  ];

  const handleColorChange = (property: string, value: string | boolean) => {
    const newTheme = { ...tempTheme, [property]: value };
    setTempTheme(newTheme);
    
    if (previewMode) {
      updateTheme(newTheme);
    }
  };

  const handlePresetSelect = (preset: typeof presetColors[0]) => {
    const newTheme = {
      ...tempTheme,
      primaryColor: preset.primary,
      secondaryColor: preset.secondary,
      accentColor: preset.accent
    };
    setTempTheme(newTheme);
    
    if (previewMode) {
      updateTheme(newTheme);
    }
  };

  const handleSave = async () => {
    try {
      setSaving(true);
      
      // Aplicar tema localmente
      updateTheme(tempTheme);
      
      // Salvar no servidor se for admin ou sede
      if ((userRole === 'admin' || userRole === 'sede') && igrejaId) {
        const response = await api.put(`/config/church/${igrejaId}`, {
          customBranding: {
            primaryColor: tempTheme.primaryColor,
            name: tempTheme.customName,
            logo: tempTheme.customLogo
          }
        });
        
        if (!response.ok) {
          throw new Error('Erro ao salvar tema no servidor');
        }
      } else if (userRole === 'admin') {
        // Salvar tema global
        const response = await api.put('/config/theme', {
          primaryColor: tempTheme.primaryColor,
          secondaryColor: tempTheme.secondaryColor,
          accentColor: tempTheme.accentColor,
          darkMode: tempTheme.darkMode,
          customLogo: tempTheme.customLogo
        });
        
        if (!response.ok) {
          throw new Error('Erro ao salvar tema global');
        }
      }
      
      onClose();
    } catch (error) {
      console.error('Erro ao salvar tema:', error);
      alert('Erro ao salvar tema. Tente novamente.');
    } finally {
      setSaving(false);
    }
  };

  const handleReset = () => {
    resetTheme();
    setTempTheme({
      primaryColor: '#4472C4',
      secondaryColor: '#70AD47',
      accentColor: '#FFC000',
      darkMode: false
    });
    setPreviewMode(false);
  };

  const togglePreview = () => {
    setPreviewMode(!previewMode);
    if (!previewMode) {
      updateTheme(tempTheme);
    } else {
      updateTheme(theme);
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
        >
          <motion.div
            className="bg-white dark:bg-gray-800 rounded-xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto"
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.9, opacity: 0 }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="flex items-center justify-between p-6 border-b dark:border-gray-700">
              <div className="flex items-center space-x-3">
                <Palette className="w-6 h-6 text-primary" />
                <h2 className="text-xl font-semibold">Personalizar Tema</h2>
              </div>
              
              <div className="flex items-center space-x-2">
                <button
                  onClick={togglePreview}
                  className={`flex items-center space-x-2 px-3 py-1 rounded-lg transition-colors ${
                    previewMode 
                      ? 'bg-green-100 text-green-600 dark:bg-green-900 dark:text-green-300'
                      : 'bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-300'
                  }`}
                >
                  <Eye className="w-4 h-4" />
                  <span className="text-sm">Preview</span>
                </button>
                
                <button
                  onClick={onClose}
                  className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            <div className="p-6 space-y-6">
              {/* Cores Principais */}
              <div>
                <h3 className="text-lg font-medium mb-4">Cores Principais</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-medium mb-2">Cor Primária</label>
                    <div className="flex items-center space-x-3">
                      <input
                        type="color"
                        value={tempTheme.primaryColor}
                        onChange={(e) => handleColorChange('primaryColor', e.target.value)}
                        className="w-12 h-12 rounded-lg border-2 border-gray-300 cursor-pointer"
                      />
                      <input
                        type="text"
                        value={tempTheme.primaryColor}
                        onChange={(e) => handleColorChange('primaryColor', e.target.value)}
                        className="flex-1 px-3 py-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600"
                        placeholder="#4472C4"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-2">Cor Secundária</label>
                    <div className="flex items-center space-x-3">
                      <input
                        type="color"
                        value={tempTheme.secondaryColor}
                        onChange={(e) => handleColorChange('secondaryColor', e.target.value)}
                        className="w-12 h-12 rounded-lg border-2 border-gray-300 cursor-pointer"
                      />
                      <input
                        type="text"
                        value={tempTheme.secondaryColor}
                        onChange={(e) => handleColorChange('secondaryColor', e.target.value)}
                        className="flex-1 px-3 py-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600"
                        placeholder="#70AD47"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-2">Cor de Destaque</label>
                    <div className="flex items-center space-x-3">
                      <input
                        type="color"
                        value={tempTheme.accentColor}
                        onChange={(e) => handleColorChange('accentColor', e.target.value)}
                        className="w-12 h-12 rounded-lg border-2 border-gray-300 cursor-pointer"
                      />
                      <input
                        type="text"
                        value={tempTheme.accentColor}
                        onChange={(e) => handleColorChange('accentColor', e.target.value)}
                        className="flex-1 px-3 py-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600"
                        placeholder="#FFC000"
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* Presets */}
              <div>
                <h3 className="text-lg font-medium mb-4">Temas Pré-definidos</h3>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                  {presetColors.map((preset, index) => (
                    <button
                      key={index}
                      onClick={() => handlePresetSelect(preset)}
                      className="flex items-center space-x-3 p-3 border rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                    >
                      <div className="flex space-x-1">
                        <div 
                          className="w-4 h-4 rounded"
                          style={{ backgroundColor: preset.primary }}
                        />
                        <div 
                          className="w-4 h-4 rounded"
                          style={{ backgroundColor: preset.secondary }}
                        />
                        <div 
                          className="w-4 h-4 rounded"
                          style={{ backgroundColor: preset.accent }}
                        />
                      </div>
                      <span className="text-sm font-medium">{preset.name}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Configurações Adicionais */}
              <div>
                <h3 className="text-lg font-medium mb-4">Configurações</h3>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <label className="text-sm font-medium">Modo Escuro</label>
                      <p className="text-xs text-gray-500">Ativar tema escuro por padrão</p>
                    </div>
                    <button
                      onClick={() => handleColorChange('darkMode', !tempTheme.darkMode)}
                      className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                        tempTheme.darkMode ? 'bg-primary' : 'bg-gray-200'
                      }`}
                    >
                      <span
                        className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                          tempTheme.darkMode ? 'translate-x-6' : 'translate-x-1'
                        }`}
                      />
                    </button>
                  </div>

                  {(userRole === 'admin' || userRole === 'sede') && (
                    <div>
                      <label className="block text-sm font-medium mb-2">Nome Personalizado</label>
                      <input
                        type="text"
                        value={tempTheme.customName || ''}
                        onChange={(e) => handleColorChange('customName', e.target.value)}
                        className="w-full px-3 py-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600"
                        placeholder="Nome da Igreja"
                      />
                    </div>
                  )}
                </div>
              </div>

              {/* Preview */}
              <div>
                <h3 className="text-lg font-medium mb-4">Visualização</h3>
                <div className="border rounded-lg p-4 bg-gray-50 dark:bg-gray-700">
                  <div className="flex items-center space-x-4 mb-4">
                    <div 
                      className="w-8 h-8 rounded-lg"
                      style={{ backgroundColor: tempTheme.primaryColor }}
                    />
                    <div>
                      <h4 className="font-medium" style={{ color: tempTheme.primaryColor }}>
                        {tempTheme.customName || 'Sistema Igreja'}
                      </h4>
                      <p className="text-sm text-gray-500">Tema personalizado</p>
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <div 
                      className="px-3 py-2 rounded text-white text-sm"
                      style={{ backgroundColor: tempTheme.primaryColor }}
                    >
                      Botão Primário
                    </div>
                    <div 
                      className="px-3 py-2 rounded text-white text-sm"
                      style={{ backgroundColor: tempTheme.secondaryColor }}
                    >
                      Botão Secundário
                    </div>
                    <div 
                      className="px-3 py-2 rounded text-white text-sm"
                      style={{ backgroundColor: tempTheme.accentColor }}
                    >
                      Destaque
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Footer */}
            <div className="flex items-center justify-between p-6 border-t dark:border-gray-700">
              <button
                onClick={handleReset}
                className="flex items-center space-x-2 px-4 py-2 text-gray-600 hover:text-gray-800 dark:text-gray-400 dark:hover:text-gray-200"
              >
                <RotateCcw className="w-4 h-4" />
                <span>Resetar</span>
              </button>

              <div className="flex items-center space-x-3">
                <button
                  onClick={onClose}
                  className="px-4 py-2 text-gray-600 hover:text-gray-800 dark:text-gray-400 dark:hover:text-gray-200"
                >
                  Cancelar
                </button>
                <button
                  onClick={handleSave}
                  disabled={saving}
                  className="flex items-center space-x-2 px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary-dark disabled:opacity-50"
                >
                  {saving ? (
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  ) : (
                    <Save className="w-4 h-4" />
                  )}
                  <span>{saving ? 'Salvando...' : 'Salvar'}</span>
                </button>
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default ThemeCustomizer;