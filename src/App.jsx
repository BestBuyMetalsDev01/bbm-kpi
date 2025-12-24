import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import ReportDashboard from './components/ReportDashboard';
import { GoogleOAuthProvider } from '@react-oauth/google';
import { AuthProvider, useAuth } from './context/AuthContext';
import LoginScreen from './components/LoginScreen';

// PLACEHOLDER ID - User must replace this
const GOOGLE_CLIENT_ID = "173412503636-0bj3f3qthn0bp25vu40ije21dqac3g4b.apps.googleusercontent.com";

const AuthenticatedApp = () => {
  const { user } = useAuth();

  if (!user) {
    return <LoginScreen />;
  }

  return (
    <Router basename="/bbm-kpi">
      <Routes>
        <Route path="/" element={<ReportDashboard initialViewMode="viewer" />} />
        <Route path="/manager" element={<ReportDashboard initialViewMode="manager" />} />
        <Route path="/admin" element={<ReportDashboard initialViewMode="admin" />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Router>
  );
};

function App() {
  return (
    <GoogleOAuthProvider clientId={GOOGLE_CLIENT_ID}>
      <AuthProvider>
        <AuthenticatedApp />
      </AuthProvider>
    </GoogleOAuthProvider>
  );
}

export default App;
