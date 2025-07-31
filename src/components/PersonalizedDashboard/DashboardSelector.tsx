import React from 'react';
import AdminDashboard from './AdminDashboard';
import SedeDashboard from './SedeDashboard';
import CongregacaoDashboard from './CongregacaoDashboard';

interface DashboardSelectorProps {
  user: any;
  dashboardData: any;
}

const DashboardSelector: React.FC<DashboardSelectorProps> = ({ user, dashboardData }) => {
  // Selecionar dashboard baseado no role do usuário
  const renderDashboard = () => {
    switch (user?.role) {
      case 'admin':
        return <AdminDashboard user={user} dashboardData={dashboardData} />;
      
      case 'sede':
        return <SedeDashboard user={user} dashboardData={dashboardData} />;
      
      case 'congregacao':
        return <CongregacaoDashboard user={user} dashboardData={dashboardData} />;
      
      default:
        // Fallback para usuários sem role definido
        return <CongregacaoDashboard user={user} dashboardData={dashboardData} />;
    }
  };

  return (
    <div className="personalized-dashboard">
      {renderDashboard()}
    </div>
  );
};

export default DashboardSelector;