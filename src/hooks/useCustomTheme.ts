import { useState, useEffect } from 'react';
import { useApi } from '../utils/api';

interface CustomTheme {
  primaryColor: string;
  secondaryColor: string;
  accentColor: string;
  darkMode: boolean;
  customLogo?: string;
  customName?: string;
}

interface ChurchTheme extends CustomTheme {
  igrejaId: string;
  churchName: string;
}

export const useCustomTheme = (igrejaId?: string) => {
  const [theme, setTheme] = useState<CustomTheme>({
    primaryColor: '#4472C4',
    secondaryColor: '#70AD47',
    accentColor: '#FFC000',
    darkMode: false
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const api = useApi();

  // Carregar tema da igreja específica
  const loadChurchTheme = async (churchId: string) => {
    try {
      setLoading(true);
      setError(null);

      const response = await api.get(`/config/church/${churchId}`);
      const data = await response.json();

      if (response.ok && data.success) {
        const churchSettings = data.settings;
        if (churchSettings.customBranding) {
          setTheme({
            primaryColor: churchSettings.customBranding.primaryColor || '#4472C4',
            secondaryColor: '#70AD47',
            accentColor: '#FFC000',
            darkMode: false,
            customLogo: churchSettings.customBranding.logo,
            customName: churchSettings.customBranding.name
          });
        }
      }
    } catch (err) {
      console.error('Erro ao carregar tema da igreja:', err);
      setError('Erro ao carregar tema personalizado');
    } finally {
      setLoading(false);
    }
  };

  // Carregar tema global
  const loadGlobalTheme = async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await api.get('/config/public');
      const data = await response.json();

      if (response.ok && data.success) {
        const config = data.config;
        if (config.themeConfig) {
          setTheme({
            primaryColor: config.themeConfig.primaryColor || '#4472C4',
            secondaryColor: config.themeConfig.secondaryColor || '#70AD47',
            accentColor: config.themeConfig.accentColor || '#FFC000',
            darkMode: config.themeConfig.darkMode || false,
            customLogo: config.themeConfig.customLogo
          });
        }
      }
    } catch (err) {
      console.error('Erro ao carregar tema global:', err);
      setError('Erro ao carregar tema');
    } finally {
      setLoading(false);
    }
  };

  // Aplicar tema no CSS
  const applyTheme = (themeConfig: CustomTheme) => {
    const root = document.documentElement;
    
    // Aplicar variáveis CSS customizadas
    root.style.setProperty('--primary-color', themeConfig.primaryColor);
    root.style.setProperty('--secondary-color', themeConfig.secondaryColor);
    root.style.setProperty('--accent-color', themeConfig.accentColor);
    
    // Gerar variações de cor
    const primaryRgb = hexToRgb(themeConfig.primaryColor);
    const secondaryRgb = hexToRgb(themeConfig.secondaryColor);
    const accentRgb = hexToRgb(themeConfig.accentColor);
    
    if (primaryRgb) {
      root.style.setProperty('--primary-rgb', `${primaryRgb.r}, ${primaryRgb.g}, ${primaryRgb.b}`);
      root.style.setProperty('--primary-light', lightenColor(themeConfig.primaryColor, 20));
      root.style.setProperty('--primary-dark', darkenColor(themeConfig.primaryColor, 20));
    }
    
    if (secondaryRgb) {
      root.style.setProperty('--secondary-rgb', `${secondaryRgb.r}, ${secondaryRgb.g}, ${secondaryRgb.b}`);
      root.style.setProperty('--secondary-light', lightenColor(themeConfig.secondaryColor, 20));
      root.style.setProperty('--secondary-dark', darkenColor(themeConfig.secondaryColor, 20));
    }
    
    if (accentRgb) {
      root.style.setProperty('--accent-rgb', `${accentRgb.r}, ${accentRgb.g}, ${accentRgb.b}`);
      root.style.setProperty('--accent-light', lightenColor(themeConfig.accentColor, 20));
      root.style.setProperty('--accent-dark', darkenColor(themeConfig.accentColor, 20));
    }

    // Aplicar modo escuro
    if (themeConfig.darkMode) {
      document.body.classList.add('dark');
    } else {
      document.body.classList.remove('dark');
    }

    // Salvar tema no localStorage
    localStorage.setItem('customTheme', JSON.stringify(themeConfig));
  };

  // Resetar para tema padrão
  const resetTheme = () => {
    const defaultTheme: CustomTheme = {
      primaryColor: '#4472C4',
      secondaryColor: '#70AD47',
      accentColor: '#FFC000',
      darkMode: false
    };
    
    setTheme(defaultTheme);
    applyTheme(defaultTheme);
    localStorage.removeItem('customTheme');
  };

  // Atualizar tema específico
  const updateTheme = (updates: Partial<CustomTheme>) => {
    const newTheme = { ...theme, ...updates };
    setTheme(newTheme);
    applyTheme(newTheme);
  };

  // Effect para carregar tema inicial
  useEffect(() => {
    // Primeiro, tentar carregar do localStorage
    const savedTheme = localStorage.getItem('customTheme');
    if (savedTheme) {
      try {
        const parsedTheme = JSON.parse(savedTheme);
        setTheme(parsedTheme);
        applyTheme(parsedTheme);
      } catch (err) {
        console.error('Erro ao carregar tema salvo:', err);
      }
    }

    // Depois, carregar tema atualizado do servidor
    if (igrejaId) {
      loadChurchTheme(igrejaId);
    } else {
      loadGlobalTheme();
    }
  }, [igrejaId]);

  // Effect para aplicar tema quando mudar
  useEffect(() => {
    applyTheme(theme);
  }, [theme]);

  return {
    theme,
    loading,
    error,
    updateTheme,
    resetTheme,
    applyTheme: () => applyTheme(theme)
  };
};

// Utilidades para manipulação de cores
function hexToRgb(hex: string) {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  return result ? {
    r: parseInt(result[1], 16),
    g: parseInt(result[2], 16),
    b: parseInt(result[3], 16)
  } : null;
}

function lightenColor(hex: string, percent: number) {
  const rgb = hexToRgb(hex);
  if (!rgb) return hex;

  const increase = (val: number) => Math.min(255, Math.floor(val + (255 - val) * (percent / 100)));
  
  const newR = increase(rgb.r).toString(16).padStart(2, '0');
  const newG = increase(rgb.g).toString(16).padStart(2, '0');
  const newB = increase(rgb.b).toString(16).padStart(2, '0');
  
  return `#${newR}${newG}${newB}`;
}

function darkenColor(hex: string, percent: number) {
  const rgb = hexToRgb(hex);
  if (!rgb) return hex;

  const decrease = (val: number) => Math.max(0, Math.floor(val * (1 - percent / 100)));
  
  const newR = decrease(rgb.r).toString(16).padStart(2, '0');
  const newG = decrease(rgb.g).toString(16).padStart(2, '0');
  const newB = decrease(rgb.b).toString(16).padStart(2, '0');
  
  return `#${newR}${newG}${newB}`;
}