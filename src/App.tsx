import React, { useState, useEffect } from 'react';
import { Login } from './components/Login';
import { AdminDashboard } from './components/AdminDashboard';
import { VoterDashboard } from './components/VoterDashboard';
import { storage } from './utils/storage';
import { User } from './types';

function App() {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Initialize admin account on app start
    storage.initializeAdminAccount();
    
    // Check for existing session
    const savedUser = storage.getCurrentUser();
    if (savedUser) {
      setCurrentUser(savedUser);
    }
    setIsLoading(false);
  }, []);

  const handleLogin = (user: User) => {
    setCurrentUser(user);
    storage.setCurrentUser(user);
  };

  const handleLogout = () => {
    setCurrentUser(null);
    storage.setCurrentUser(null);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="bg-white rounded-xl shadow-sm p-8">
          <div className="text-center">
            <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
            <p className="text-xl font-semibold text-gray-900">Loading Vote BNMIT...</p>
          </div>
        </div>
      </div>
    );
  }

  if (!currentUser) {
    return <Login onLogin={handleLogin} />;
  }

  if (currentUser.role === 'admin') {
    return <AdminDashboard user={currentUser} onLogout={handleLogout} />;
  }

  return <VoterDashboard user={currentUser} onLogout={handleLogout} />;
}

export default App;