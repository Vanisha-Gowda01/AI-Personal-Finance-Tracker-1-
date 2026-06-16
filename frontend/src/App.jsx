import React, { useState, useEffect } from 'react';
import { ConfigProvider, theme, Spin, message } from 'antd';
import axios from 'axios';

// Layout & Pages
import MainLayout from './components/MainLayout';
import Auth from './pages/Auth';
import Dashboard from './pages/Dashboard';
import Transactions from './pages/Transactions';
import Analytics from './pages/Analytics';
import AIInsights from './pages/AIInsights';
import Goals from './pages/Goals';
import Profile from './pages/Profile';

export default function App() {
  const [user, setUser] = useState(null);
  const [currentPage, setCurrentPage] = useState('Dashboard');
  const [monthlyBudget, setMonthlyBudget] = useState(50000);
  const [transactions, setTransactions] = useState([]);
  const [goals, setGoals] = useState([]);
  const [loading, setLoading] = useState(false);
  const [checkingAuth, setCheckingAuth] = useState(true);

  // 1. Initial Authentication Check
  useEffect(() => {
    const savedUser = localStorage.getItem('user');
    if (savedUser) {
      const parsedUser = JSON.parse(savedUser);
      setUser(parsedUser);
      
      // Load saved budget limit if present
      const savedBudget = localStorage.getItem(`budget_${parsedUser.id}`);
      if (savedBudget) {
        setMonthlyBudget(parseFloat(savedBudget));
      }
    }
    setCheckingAuth(false);
  }, []);

  // 2. Fetch User Data (Transactions & Goals)
  const fetchData = async (currentUser) => {
    if (!currentUser) return;
    setLoading(true);
    try {
      const [txResponse, goalsResponse] = await Promise.all([
        axios.get('/api/transactions', { params: { user_id: currentUser.id } }),
        axios.get('/api/goals', { params: { user_id: currentUser.id } })
      ]);
      
      setTransactions(txResponse.data);
      setGoals(goalsResponse.data);
    } catch (error) {
      console.error('Failed to fetch finance records:', error);
      message.error('Could not sync data from server.');
    } finally {
      setLoading(false);
    }
  };

  // Sync data whenever the user logs in
  useEffect(() => {
    if (user) {
      fetchData(user);
    }
  }, [user]);

  // Save monthly budget adjustments
  const handleBudgetChange = (newBudget) => {
    setMonthlyBudget(newBudget);
    if (user) {
      localStorage.setItem(`budget_${user.id}`, newBudget);
    }
  };

  const handleLoginSuccess = (userData) => {
    setUser(userData);
    localStorage.setItem('user', JSON.stringify(userData));
    
    // Load user budget limit
    const savedBudget = localStorage.getItem(`budget_${userData.id}`);
    if (savedBudget) {
      setMonthlyBudget(parseFloat(savedBudget));
    } else {
      setMonthlyBudget(50000); // Reset to default
    }
  };

  const handleLogout = () => {
    setUser(null);
    setTransactions([]);
    setGoals([]);
    setCurrentPage('Dashboard');
    localStorage.removeItem('user');
    message.info('Logged out.');
  };

  const handleUpdateUser = (updatedUserData) => {
    const newUserState = { ...user, ...updatedUserData };
    setUser(newUserState);
    localStorage.setItem('user', JSON.stringify(newUserState));
  };

  // Spinner on initial checks
  if (checkingAuth) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#f8fafc' }}>
        <Spin size="large" style={{ color: '#10b981' }} />
      </div>
    );
  }

  // Not authenticated? Show Auth Form
  if (!user) {
    return (
      <ConfigProvider
        theme={{
          algorithm: theme.defaultAlgorithm,
          token: {
            colorPrimary: '#10b981',
            colorBgBase: '#ffffff',
            colorBgContainer: '#ffffff',
            colorBorder: 'rgba(0, 0, 0, 0.06)',
            fontFamily: 'Plus Jakarta Sans',
          },
        }}
      >
        <Auth onLoginSuccess={handleLoginSuccess} />
      </ConfigProvider>
    );
  }

  // Render correct sub-page
  const renderPage = () => {
    if (loading && transactions.length === 0) {
      return (
        <div style={{ display: 'flex', justifyContent: 'center', padding: '60px 0' }}>
          <Spin size="large" tip="Loading ledger data..." style={{ color: '#14b8a6' }} />
        </div>
      );
    }

    switch (currentPage) {
      case 'Dashboard':
        return <Dashboard transactions={transactions} monthlyBudget={monthlyBudget} />;
      case 'Transactions':
        return <Transactions transactions={transactions} user={user} onRefresh={() => fetchData(user)} />;
      case 'Analytics':
        return <Analytics transactions={transactions} />;
      case 'AI Insights':
        return <AIInsights transactions={transactions} user={user} />;
      case 'Goals':
        return <Goals goals={goals} user={user} onRefresh={() => fetchData(user)} />;
      case 'Profile':
        return (
          <Profile 
            user={user} 
            transactionsCount={transactions.length} 
            onUpdateUser={handleUpdateUser} 
          />
        );
      default:
        return <Dashboard transactions={transactions} monthlyBudget={monthlyBudget} />;
    }
  };

  return (
    <ConfigProvider
      theme={{
        algorithm: theme.defaultAlgorithm,
        token: {
          colorPrimary: '#10b981',
          colorBgBase: '#ffffff',
          colorBgContainer: '#ffffff',
          colorBorder: 'rgba(0, 0, 0, 0.06)',
          fontFamily: 'Plus Jakarta Sans',
        },
      }}
    >
      <MainLayout
        user={user}
        currentPage={currentPage}
        setCurrentPage={setCurrentPage}
        monthlyBudget={monthlyBudget}
        setMonthlyBudget={handleBudgetChange}
        onLogout={handleLogout}
      >
        {renderPage()}
      </MainLayout>
    </ConfigProvider>
  );
}
