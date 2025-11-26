import { useState, useContext } from 'react';
import { AuthProvider, AuthContext } from './context/AuthContext';
import Login from './components/Auth/Login';
import Register from './components/Auth/Register';
import Dashboard from './components/Dashboard/Dashboard';
import { Toaster } from './components/ui/toaster';
import { Loader2 } from 'lucide-react';

function AppContent() {
  const { user, loading, logout } = useContext(AuthContext);
  const [showRegister, setShowRegister] = useState(false);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center space-y-4">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-lg bg-primary/10">
            <span className="text-2xl font-bold text-primary">IQ</span>
          </div>
          <Loader2 className="h-8 w-8 animate-spin mx-auto text-muted-foreground" />
          <p className="text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4 bg-background">
        <div className="w-full max-w-md space-y-4">
          {showRegister ? (
            <Register
              onToggle={() => setShowRegister(false)}
            />
          ) : (
            <Login
              onToggle={() => setShowRegister(true)}
            />
          )}
          <div className="text-center">
            <button
              onClick={() => setShowRegister(!showRegister)}
              className="text-sm text-muted-foreground hover:text-foreground transition-colors"
            >
              {showRegister
                ? 'Already have an account? Sign in'
                : "Don't have an account? Sign up"}
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <>
      <Dashboard user={user} onLogout={logout} />
    </>
  );
}

export default function App() {
  return (
      <AuthProvider>
        <AppContent />
        <Toaster />
      </AuthProvider>
  
  );
}
