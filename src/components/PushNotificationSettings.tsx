import React, { useState } from 'react';
import { 
  Bell, 
  BellOff, 
  Shield, 
  Smartphone, 
  CheckCircle, 
  AlertCircle,
  Info,
  Zap,
  MessageSquare
} from 'lucide-react';
import { usePushNotifications } from '../utils/pushNotifications';

interface PushNotificationSettingsProps {
  className?: string;
}

const PushNotificationSettings: React.FC<PushNotificationSettingsProps> = ({ className = '' }) => {
  const { 
    status, 
    loading, 
    requestPermission, 
    subscribe, 
    unsubscribe, 
    showNotification 
  } = usePushNotifications();

  const [testNotificationSent, setTestNotificationSent] = useState(false);

  const handleEnableNotifications = async () => {
    try {
      const granted = await requestPermission();
      if (granted) {
        await subscribe();
      }
    } catch (error) {
      console.error('Erro ao ativar notificações:', error);
    }
  };

  const handleDisableNotifications = async () => {
    try {
      await unsubscribe();
    } catch (error) {
      console.error('Erro ao desativar notificações:', error);
    }
  };

  const handleTestNotification = async () => {
    try {
      await showNotification({
        title: '🎉 Teste de Notificação',
        body: 'As notificações estão funcionando perfeitamente! Você receberá alertas sobre eventos, lembretes e atualizações importantes.',
        tag: 'test-notification',
        requireInteraction: true,
        data: { type: 'test' }
      });
      
      setTestNotificationSent(true);
      setTimeout(() => setTestNotificationSent(false), 3000);
    } catch (error) {
      console.error('Erro ao enviar notificação de teste:', error);
    }
  };

  const getStatusInfo = () => {
    if (!status.isSupported) {
      return {
        icon: AlertCircle,
        color: 'text-red-500',
        bgColor: 'bg-red-50 dark:bg-red-900/20',
        borderColor: 'border-red-200 dark:border-red-800',
        title: 'Não Suportado',
        message: 'Seu navegador não suporta notificações push'
      };
    }

    if (!status.hasPermission) {
      return {
        icon: Info,
        color: 'text-blue-500',
        bgColor: 'bg-blue-50 dark:bg-blue-900/20',
        borderColor: 'border-blue-200 dark:border-blue-800',
        title: 'Permissão Necessária',
        message: 'Clique em "Ativar" para receber notificações importantes'
      };
    }

    if (status.hasPermission && !status.isSubscribed) {
      return {
        icon: AlertCircle,
        color: 'text-yellow-500',
        bgColor: 'bg-yellow-50 dark:bg-yellow-900/20',
        borderColor: 'border-yellow-200 dark:border-yellow-800',
        title: 'Configuração Pendente',
        message: 'Permissão concedida, mas ainda não registrado'
      };
    }

    return {
      icon: CheckCircle,
      color: 'text-green-500',
      bgColor: 'bg-green-50 dark:bg-green-900/20',
      borderColor: 'border-green-200 dark:border-green-800',
      title: 'Ativo',
      message: 'Você receberá notificações importantes'
    };
  };

  const statusInfo = getStatusInfo();
  const IconComponent = statusInfo.icon;

  return (
    <div className={`bg-white dark:bg-gray-800 rounded-xl p-6 border border-gray-200 dark:border-gray-700 ${className}`}>
      <div className="flex items-center space-x-3 mb-6">
        <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
          <Bell className="w-6 h-6 text-blue-600 dark:text-blue-400" />
        </div>
        <div>
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
            Notificações Push
          </h3>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Receba alertas importantes diretamente no seu dispositivo
          </p>
        </div>
      </div>

      {/* Status Card */}
      <div className={`p-4 ${statusInfo.bgColor} ${statusInfo.borderColor} border rounded-lg mb-6`}>
        <div className="flex items-center space-x-3">
          <IconComponent className={`w-6 h-6 ${statusInfo.color}`} />
          <div>
            <h4 className={`font-medium ${statusInfo.color}`}>
              {statusInfo.title}
            </h4>
            <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
              {statusInfo.message}
            </p>
          </div>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="space-y-3">
        {status.isSupported && (
          <>
            {!status.hasPermission || !status.isSubscribed ? (
              <button
                onClick={handleEnableNotifications}
                disabled={loading}
                className="w-full flex items-center justify-center space-x-2 px-4 py-3 bg-blue-500 hover:bg-blue-600 disabled:bg-gray-400 text-white rounded-lg font-medium transition-colors"
              >
                {loading ? (
                  <div className="animate-spin w-5 h-5 border-2 border-white border-t-transparent rounded-full"></div>
                ) : (
                  <Bell className="w-5 h-5" />
                )}
                <span>
                  {loading ? 'Ativando...' : 'Ativar Notificações'}
                </span>
              </button>
            ) : (
              <div className="space-y-3">
                <button
                  onClick={handleTestNotification}
                  className="w-full flex items-center justify-center space-x-2 px-4 py-3 bg-green-500 hover:bg-green-600 text-white rounded-lg font-medium transition-colors"
                >
                  {testNotificationSent ? (
                    <>
                      <CheckCircle className="w-5 h-5" />
                      <span>Notificação Enviada!</span>
                    </>
                  ) : (
                    <>
                      <Zap className="w-5 h-5" />
                      <span>Testar Notificação</span>
                    </>
                  )}
                </button>

                <button
                  onClick={handleDisableNotifications}
                  disabled={loading}
                  className="w-full flex items-center justify-center space-x-2 px-4 py-3 bg-red-500 hover:bg-red-600 disabled:bg-gray-400 text-white rounded-lg font-medium transition-colors"
                >
                  {loading ? (
                    <div className="animate-spin w-5 h-5 border-2 border-white border-t-transparent rounded-full"></div>
                  ) : (
                    <BellOff className="w-5 h-5" />
                  )}
                  <span>
                    {loading ? 'Desativando...' : 'Desativar Notificações'}
                  </span>
                </button>
              </div>
            )}
          </>
        )}

        {!status.isSupported && (
          <div className="text-center py-4">
            <Smartphone className="w-12 h-12 text-gray-400 mx-auto mb-3" />
            <p className="text-gray-500 dark:text-gray-400 text-sm">
              Para receber notificações, use um navegador moderno como Chrome, Firefox ou Safari.
            </p>
          </div>
        )}
      </div>

      {/* Features List */}
      {status.isSupported && (
        <div className="mt-6 p-4 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
          <div className="flex items-start space-x-3">
            <MessageSquare className="w-5 h-5 text-indigo-500 mt-0.5" />
            <div>
              <h4 className="font-medium text-gray-900 dark:text-white mb-2">
                Tipos de Notificações
              </h4>
              <ul className="text-sm text-gray-600 dark:text-gray-400 space-y-1">
                <li>📅 Novos eventos programados</li>
                <li>🔔 Lembretes de eventos próximos</li>
                <li>💰 Lembretes de dízimos</li>
                <li>🎉 Novos membros na congregação</li>
                <li>📊 Relatórios semanais disponíveis</li>
                <li>⚠️ Alertas importantes do sistema</li>
              </ul>
            </div>
          </div>
        </div>
      )}

      {/* Privacy Notice */}
      <div className="mt-4 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
        <div className="flex items-start space-x-2">
          <Shield className="w-4 h-4 text-blue-500 mt-0.5 flex-shrink-0" />
          <div>
            <p className="text-xs text-blue-800 dark:text-blue-300">
              <strong>Privacidade:</strong> Suas informações de notificação são mantidas seguras e usadas apenas para enviar alertas relevantes da igreja. Você pode desativar a qualquer momento.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PushNotificationSettings;