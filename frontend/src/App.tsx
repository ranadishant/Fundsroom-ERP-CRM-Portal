import React, { useState } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import { Sidebar } from './components/Sidebar';
import { Header } from './components/Header';
import { LoginPage } from './pages/LoginPage';
import { DashboardPage } from './pages/DashboardPage';
import { CustomersPage } from './pages/CustomersPage';
import { CustomerDetailPage } from './pages/CustomerDetailPage';
import { InventoryPage } from './pages/InventoryPage';
import { ChallansPage } from './pages/ChallansPage';
import { CreateChallanPage } from './pages/CreateChallanPage';

const AppContent: React.FC = () => {
  const { user, loading } = useAuth();
  const [activeTab, setActiveTab] = useState<string>('dashboard');
  const [selectedCustomerId, setSelectedCustomerId] = useState<string | null>(null);

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 text-white flex items-center justify-center font-semibold">
        Initializing Fundsroom ERP System...
      </div>
    );
  }

  if (!user) {
    return <LoginPage />;
  }

  const renderTabContent = () => {
    if (selectedCustomerId) {
      return (
        <CustomerDetailPage
          customerId={selectedCustomerId}
          onBack={() => setSelectedCustomerId(null)}
        />
      );
    }

    switch (activeTab) {
      case 'dashboard':
        return <DashboardPage setActiveTab={setActiveTab} />;
      case 'customers':
        return (
          <CustomersPage
            onSelectCustomer={(id) => setSelectedCustomerId(id)}
          />
        );
      case 'inventory':
        return <InventoryPage />;
      case 'challans':
        return <ChallansPage onNewChallan={() => setActiveTab('create-challan')} />;
      case 'create-challan':
        return (
          <CreateChallanPage
            onSuccess={() => setActiveTab('challans')}
            onCancel={() => setActiveTab('challans')}
          />
        );
      default:
        return <DashboardPage setActiveTab={setActiveTab} />;
    }
  };

  return (
    <div className="flex min-h-screen bg-slate-950">
      <Sidebar activeTab={activeTab} setActiveTab={(tab) => {
        setSelectedCustomerId(null);
        setActiveTab(tab);
      }} />

      <main className="flex-1 flex flex-col min-w-0 overflow-y-auto">
        <Header title={selectedCustomerId ? 'Customer Profile' : activeTab.replace('-', ' ')} />
        <div className="flex-1">
          {renderTabContent()}
        </div>
      </main>
    </div>
  );
};

export const App: React.FC = () => {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
};

export default App;
