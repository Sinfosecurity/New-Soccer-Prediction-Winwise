import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, useParams } from 'react-router-dom';
import {
  Box,
  Container,
  ChakraProvider,
} from '@chakra-ui/react';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { NotificationProvider } from './contexts/NotificationContext';
import { SocialProvider } from './contexts/SocialContext';
import { ProtectedRoute } from './components/ProtectedRoute';
import { LoginForm } from './components/LoginForm';
import { RegisterForm } from './components/RegisterForm';
import Navbar from './components/Navbar';
import NewDashboard from './components/NewDashboard';
import LiveScores from './components/LiveScores';
import ValueBets from './components/ValueBets';
import BettingAnalytics from './components/BettingAnalytics';
import Community from './components/Community';
import Notifications from './components/Notifications';
import UserProfile from './components/UserProfile';
import UpcomingMatches from './components/UpcomingMatches';
import PredictionHistory from './components/PredictionHistory';
import PredictionAnalytics from './components/PredictionAnalytics';
import ActivePredictions from './components/ActivePredictions';
import MatchDetails from './components/MatchDetails';
import theme from './theme';
import ModelMonitoring from './components/ModelMonitoring';

const UserProfileWrapper = () => {
  const { userId } = useParams();
  return <UserProfile userId={userId || ''} />;
};

const App: React.FC = () => {
  return (
    <ChakraProvider theme={theme}>
      <AuthProvider>
        <NotificationProvider>
          <SocialProvider>
            <Router>
              <Box minH="100vh">
                <Navbar />
                <Notifications />
                <Container maxW="container.xl" py={8}>
                  <Routes>
                    {/* Public routes */}
                    <Route path="/login" element={<LoginForm />} />
                    <Route path="/register" element={<RegisterForm />} />
                    
                    {/* Protected routes */}
                    <Route
                      path="/dashboard"
                      element={
                        <ProtectedRoute>
                          <NewDashboard />
                        </ProtectedRoute>
                      }
                    />
                    <Route
                      path="/predictions/history"
                      element={
                        <ProtectedRoute>
                          <PredictionHistory />
                        </ProtectedRoute>
                      }
                    />
                    <Route
                      path="/predictions/analytics"
                      element={
                        <ProtectedRoute>
                          <PredictionAnalytics />
                        </ProtectedRoute>
                      }
                    />
                    <Route
                      path="/predictions/active"
                      element={
                        <ProtectedRoute>
                          <ActivePredictions />
                        </ProtectedRoute>
                      }
                    />
                    <Route
                      path="/matches/upcoming"
                      element={
                        <ProtectedRoute>
                          <UpcomingMatches />
                        </ProtectedRoute>
                      }
                    />
                    <Route
                      path="/matches/:matchId"
                      element={
                        <ProtectedRoute>
                          <MatchDetails />
                        </ProtectedRoute>
                      }
                    />
                    <Route
                      path="/monitoring"
                      element={
                        <ProtectedRoute>
                          <ModelMonitoring />
                        </ProtectedRoute>
                      }
                    />
                    
                    {/* Redirect root to dashboard */}
                    <Route path="/" element={<Navigate to="/dashboard" replace />} />
                    
                    {/* Catch all route - redirect to dashboard */}
                    <Route path="*" element={<Navigate to="/dashboard" replace />} />
                  </Routes>
                </Container>
              </Box>
            </Router>
          </SocialProvider>
        </NotificationProvider>
      </AuthProvider>
    </ChakraProvider>
  );
};

export default App;
