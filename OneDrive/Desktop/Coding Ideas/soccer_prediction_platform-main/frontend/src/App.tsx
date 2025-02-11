import React, { useEffect } from 'react';
import { BrowserRouter as Router, Route, Routes, Navigate, useLocation } from 'react-router-dom';
import { ChakraProvider, CSSReset } from '@chakra-ui/react';
import Navbar from './components/Navbar';
import Login from './pages/Login';
import Register from './pages/Register';
import Dashboard from './pages/Dashboard';
import Predictions from './pages/Predictions';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { initGA, logPageView } from './utils/analytics';
import theme from './theme';

interface PrivateRouteProps {
  children: React.ReactNode;
}

const PrivateRoute: React.FC<PrivateRouteProps> = ({ children }) => {
  const { isAuthenticated } = useAuth();
  return isAuthenticated ? <>{children}</> : <Navigate to="/login" />;
};

const PageTracker: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const location = useLocation();

  useEffect(() => {
    logPageView();
  }, [location]);

  return <>{children}</>;
};

const App: React.FC = () => {
  useEffect(() => {
    initGA();
  }, []);

  return (
    <ChakraProvider theme={theme}>
      <CSSReset />
      <AuthProvider>
        <Router>
          <PageTracker>
            <Navbar />
            <Routes>
              <Route path="/login" element={<Login />} />
              <Route path="/register" element={<Register />} />
              <Route
                path="/dashboard"
                element={
                  <PrivateRoute>
                    <Dashboard />
                  </PrivateRoute>
                }
              />
              <Route
                path="/predictions"
                element={
                  <PrivateRoute>
                    <Predictions />
                  </PrivateRoute>
                }
              />
              <Route path="/" element={<Navigate to="/dashboard" />} />
            </Routes>
          </PageTracker>
        </Router>
      </AuthProvider>
    </ChakraProvider>
  );
};

export default App; 