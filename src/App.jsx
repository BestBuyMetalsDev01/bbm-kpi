import { GoogleOAuthProvider } from '@react-oauth/google';
import { AuthProvider, useAuth } from './context/AuthContext';
import LoginScreen from './components/LoginScreen';

// PLACEHOLDER ID - User must replace this
const GOOGLE_CLIENT_ID = "YOUR_GOOGLE_CLIENT_ID";

const AuthenticatedApp = () => {
  const { user } = useAuth();

  if (!user) {
    return <LoginScreen />;
  }

  return (
    <Router>
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
