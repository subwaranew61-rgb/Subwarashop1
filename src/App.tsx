import { useState, useEffect } from 'react';
import { User } from './types';
import Auth from './components/Auth';
import Sidebar from './components/Sidebar';
import Dashboard from './components/Dashboard';
import POS from './components/POS';
import StockInComponent from './components/StockIn';
import Products from './components/Products';
import Customers from './components/Customers';
import Accounting from './components/Accounting';
import Reports from './components/Reports';

export default function App() {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [activeTab, setActiveTab] = useState('dashboard');

  // Check if session is stored locally to maintain state on page reload
  useEffect(() => {
    const cachedUser = localStorage.getItem('subwara_session_user');
    if (cachedUser) {
      try {
        setCurrentUser(JSON.parse(cachedUser));
      } catch (e) {
        localStorage.removeItem('subwara_session_user');
      }
    }
  }, []);

  const handleLogin = (user: User) => {
    setCurrentUser(user);
    localStorage.setItem('subwara_session_user', JSON.stringify(user));
  };

  const handleLogout = () => {
    setCurrentUser(null);
    localStorage.removeItem('subwara_session_user');
    setActiveTab('dashboard');
  };

  // Render correct tab view content
  const renderTabContent = () => {
    if (!currentUser) return null;

    switch (activeTab) {
      case 'dashboard':
        return <Dashboard />;
      case 'pos':
        return <POS currentUser={currentUser} />;
      case 'stockin':
        return <StockInComponent />;
      case 'products':
        return <Products currentUser={currentUser} />;
      case 'customers':
        return <Customers currentUser={currentUser} />;
      case 'accounting':
        return <Accounting currentUser={currentUser} />;
      case 'reports':
        return <Reports />;
      default:
        return <Dashboard />;
    }
  };

  if (!currentUser) {
    return <Auth onLogin={handleLogin} />;
  }

  return (
    <div className="flex flex-col lg:flex-row min-h-screen bg-brand-bg text-brand-text antialiased selection:bg-brand-green/20 selection:text-brand-green font-sans">
      
      {/* Sidebar Navigation Workspace */}
      <Sidebar 
        currentUser={currentUser} 
        activeTab={activeTab} 
        setActiveTab={setActiveTab} 
        onLogout={handleLogout} 
      />

      {/* Primary tab workspace block */}
      <main className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8 h-screen">
        {renderTabContent()}
      </main>
      
    </div>
  );
}
