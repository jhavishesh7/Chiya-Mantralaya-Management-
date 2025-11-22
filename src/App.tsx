import { useState } from 'react';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { Login } from './pages/Login';
import { Register } from './pages/Register';
import { AwaitingVerification } from './pages/AwaitingVerification';
import { Orders } from './pages/Orders';
import { EmployeeManagement } from './pages/admin/EmployeeManagement';
import { MenuManagement } from './pages/admin/MenuManagement';
import { TableManagement } from './pages/admin/TableManagement';
import { ExpenseManagement } from './pages/admin/ExpenseManagement';
import { RevenueReport } from './pages/admin/RevenueReport';
import { Navigation } from './components/Navigation';
import { useToast } from './components/Toast';

function AppContent() {
  const { user, profile, loading } = useAuth();
  const [authView, setAuthView] = useState<'login' | 'register' | 'awaiting'>('login');
  const [activeTab, setActiveTab] = useState('orders');
  const { ToastContainer } = useToast();

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-orange-500"></div>
      </div>
    );
  }

  if (!user || !profile) {
    if (authView === 'register') {
      return (
        <>
          <Register
            onSwitchToLogin={() => setAuthView('login')}
            onRegistrationComplete={() => setAuthView('awaiting')}
          />
          <ToastContainer />
        </>
      );
    }

    if (authView === 'awaiting') {
      return (
        <>
          <AwaitingVerification />
          <ToastContainer />
        </>
      );
    }

    return (
      <>
        <Login onSwitchToRegister={() => setAuthView('register')} />
        <ToastContainer />
      </>
    );
  }

  if (profile.role === 'employee' && !profile.verified) {
    return (
      <>
        <AwaitingVerification />
        <ToastContainer />
      </>
    );
  }

  const isAdmin = profile.role === 'admin';

  return (
    <div className="min-h-screen bg-gray-100">
      <Navigation activeTab={activeTab} onTabChange={setActiveTab} />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-6 lg:py-8">
        {activeTab === 'orders' && <Orders />}
        {activeTab === 'employees' && isAdmin && <EmployeeManagement />}
        {activeTab === 'menu' && isAdmin && <MenuManagement />}
        {activeTab === 'tables' && isAdmin && <TableManagement />}
        {activeTab === 'expenses' && isAdmin && <ExpenseManagement />}
        {activeTab === 'revenue' && isAdmin && <RevenueReport />}
      </main>

      <ToastContainer />
    </div>
  );
}

function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}

export default App;
