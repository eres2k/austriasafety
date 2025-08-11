import React, { useState, useEffect, createContext, useContext } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import netlifyIdentity from 'netlify-identity-widget';
import './App.css';

// Import components
import Login from './components/Auth/Login';
import Dashboard from './components/Dashboard/Dashboard';
import TemplateManager from './components/Templates/TemplateManager';
import AuditForm from './components/Audits/AuditForm';
import AuditList from './components/Audits/AuditList';
import Settings from './components/Settings/Settings';

// Auth Context
const AuthContext = createContext();

export const useAuth = () => useContext(AuthContext);

// Auth Provider
export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Initialize Netlify Identity
    netlifyIdentity.init();
    
    const user = netlifyIdentity.currentUser();
    setUser(user);
    setLoading(false);

    // Listen for auth changes
    netlifyIdentity.on('login', (user) => {
      setUser(user);
      netlifyIdentity.close();
    });

    netlifyIdentity.on('logout', () => {
      setUser(null);
    });

    return () => {
      netlifyIdentity.off('login');
      netlifyIdentity.off('logout');
    };
  }, []);

  const login = () => {
    netlifyIdentity.open();
  };

  const logout = () => {
    netlifyIdentity.logout();
  };

  const value = {
    user,
    login,
    logout,
    loading
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

// Protected Route Component
const ProtectedRoute = ({ children }) => {
  const { user, loading } = useAuth();
  
  if (loading) {
    return (
      <div className="loading-container">
        <div className="loader">
          <div className="spinner"></div>
          <p>Loading...</p>
        </div>
      </div>
    );
  }
  
  return user ? children : <Navigate to="/login" />;
};

// Main App Component
function App() {
  return (
    <AuthProvider>
      <Router>
        <div className="App">
          <Routes>
            <Route path="/login" element={<Login />} />
            <Route path="/" element={
              <ProtectedRoute>
                <Dashboard />
              </ProtectedRoute>
            } />
            <Route path="/templates" element={
              <ProtectedRoute>
                <TemplateManager />
              </ProtectedRoute>
            } />
            <Route path="/audits" element={
              <ProtectedRoute>
                <AuditList />
              </ProtectedRoute>
            } />
            <Route path="/audit/new" element={
              <ProtectedRoute>
                <AuditForm />
              </ProtectedRoute>
            } />
            <Route path="/audit/:id" element={
              <ProtectedRoute>
                <AuditForm />
              </ProtectedRoute>
            } />
            <Route path="/settings" element={
              <ProtectedRoute>
                <Settings />
              </ProtectedRoute>
            } />
            <Route path="*" element={<Navigate to="/" />} />
          </Routes>
        </div>
      </Router>
    </AuthProvider>
  );
}

export default App;