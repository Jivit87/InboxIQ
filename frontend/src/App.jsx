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
      <div className="min-h-screen flex items-center justify-center bg-zinc-50 px-4">
        <div className="w-full max-w-md text-center space-y-6">
          <div className="flex flex-col items-center gap-3">
            <div className="inline-flex items-center justify-center w-12 h-12 rounded-lg bg-zinc-900 text-zinc-50 text-sm font-semibold">
              IQ
            </div>
            <div>
              <p className="text-base font-semibold text-zinc-900">Loading InboxIQ</p>
              <p className="text-sm text-zinc-500">
                Please wait a moment while we get things ready.
              </p>
            </div>
          </div>
          <Loader2 className="h-6 w-6 animate-spin mx-auto text-zinc-400" />
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-zinc-50 px-4">
        <div className="w-full max-w-md space-y-6">
          <div className="flex flex-col items-center gap-3 text-center">
            <div className="inline-flex items-center justify-center w-10 h-10 rounded-lg bg-zinc-900 text-zinc-50 text-xs font-semibold">
              IQ
            </div>
            <div>
              <p className="text-xl font-semibold tracking-tight text-zinc-900">
                {showRegister ? 'Create your InboxIQ account' : 'Welcome back to InboxIQ'}
              </p>
              <p className="mt-1 text-sm text-zinc-500">
                A clean, focused workspace for your email and AI assistant.
              </p>
            </div>
          </div>

          {showRegister ? (
            <Register onToggle={() => setShowRegister(false)} />
          ) : (
            <Login onToggle={() => setShowRegister(true)} />
          )}
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
