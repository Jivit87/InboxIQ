import { useState, useEffect } from 'react';
import { syncAPI } from '../../services/api';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { useToast } from '../ui/use-toast';
import {
  Mail,
  Plug,
  Clock,
  RefreshCw,
  LogOut,
  Menu,
  X,
  MessageSquare,
} from 'lucide-react';
import PlatformConnections from './PlatformConnections';
import EmailList from '../Email/EmailList';
import ChatInterface from '../Chat/ChatInterface';

const Dashboard = ({ user, onLogout }) => {
  const [activeTab, setActiveTab] = useState('chat');  // Default to chat tab
  const [syncStatus, setSyncStatus] = useState(null);
  const [loading, setLoading] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    loadSyncStatus();
  }, []);

  const loadSyncStatus = async () => {
    try {
      const status = await syncAPI.getStatus();
      setSyncStatus(status);
    } catch (err) {
      console.error('Failed to load sync status:', err);
    }
  };

  const handleSync = async () => {
    setLoading(true);
    try {
      await syncAPI.syncAll();
      toast({
        title: 'Success',
        description: 'Sync completed successfully',
      });
      await loadSyncStatus();
    } catch (err) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: err.message || 'Sync failed',
      });
    } finally {
      setLoading(false);
    }
  };

  const menuItems = [
    { id: 'chat', label: 'AI Chat', icon: MessageSquare },
    { id: 'emails', label: 'Emails', icon: Mail, badge: syncStatus?.counts?.emails },
    { id: 'connections', label: 'Connections', icon: Plug },
  ];

  return (
    <div className="min-h-screen bg-zinc-50">
      {/* Header */}
      <header className="sticky top-0 z-50 w-full border-b border-zinc-200 bg-white/80 backdrop-blur-md">
        <div className="container flex h-16 items-center justify-between px-6">
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              size="icon"
              className="lg:hidden h-9 w-9"
              onClick={() => setSidebarOpen(!sidebarOpen)}
            >
              {sidebarOpen ? <X className="h-4 w-4" /> : <Menu className="h-4 w-4" />}
            </Button>
            <div className="flex items-center gap-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-zinc-900 text-zinc-50 font-bold text-sm">
                IQ
              </div>
              <span className="text-xl font-bold tracking-tight text-zinc-900 hidden sm:inline">InboxIQ</span>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Button
              onClick={handleSync}
              disabled={loading}
              variant="outline"
              size="sm"
              className="h-9 text-sm border-zinc-200 hover:bg-zinc-100 text-zinc-900"
            >
              <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
              <span className="hidden sm:inline">Sync</span>
            </Button>
            <div className="flex items-center gap-3 ml-4 pl-4 border-l border-zinc-200">
              <div className="hidden md:block text-right">
                <p className="text-sm font-medium text-zinc-900">{user?.name || 'User'}</p>
                <p className="text-xs text-zinc-500 truncate max-w-[120px]">{user?.email}</p>
              </div>
              <Button 
                variant="ghost" 
                size="icon" 
                onClick={onLogout} 
                title="Logout"
                className="h-9 w-9 hover:bg-zinc-100"
              >
                <LogOut className="h-4 w-4 text-zinc-500" />
              </Button>
            </div>
          </div>
        </div>
      </header>

      <div className="flex relative">
        {/* Sidebar */}
        <aside
          className={`${
            sidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
          } fixed lg:sticky top-16 left-0 z-40 h-[calc(100vh-4rem)] w-64 border-r border-zinc-200 bg-white lg:shadow-none shadow-xl`}
        >
          <nav className="p-4 space-y-1 h-full flex flex-col">
            <div className="flex-1 overflow-y-auto">
              {menuItems.map((item) => {
                const Icon = item.icon;
                return (
                  <button
                    key={item.id}
                    onClick={() => {
                      setActiveTab(item.id);
                      setSidebarOpen(false);
                    }}
                    className={`w-full flex items-center justify-between gap-3 px-3 py-2.5 rounded-lg text-sm font-medium ${
                      activeTab === item.id
                        ? 'bg-zinc-100 text-zinc-900'
                        : 'text-zinc-500 hover:bg-zinc-50 hover:text-zinc-900'
                    }`}
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <Icon className={`h-4 w-4 flex-shrink-0 ${activeTab === item.id ? 'text-zinc-900' : 'text-zinc-400'}`} />
                      <span className="truncate">{item.label}</span>
                    </div>
                    {item.badge !== undefined && item.badge > 0 && (
                      <Badge variant="secondary" className="ml-auto flex-shrink-0 text-xs px-1.5 py-0 bg-zinc-200 text-zinc-900 hover:bg-zinc-300">
                        {item.badge > 99 ? '99+' : item.badge}
                      </Badge>
                    )}
                  </button>
                );
              })}
            </div>

            {/* Sync Status */}
            {syncStatus && (
              <div className="p-4 border-t border-zinc-200 mt-auto bg-zinc-50/50">
                <p className="text-xs font-semibold mb-2.5 text-zinc-400 uppercase tracking-wider">
                  Platform Status
                </p>
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-zinc-600 font-medium">Gmail</span>
                    <div className={`h-2 w-2 rounded-full ${syncStatus.connectedPlatforms?.gmail ? 'bg-green-500' : 'bg-zinc-300'}`} />
                  </div>
                </div>
              </div>
            )}
          </nav>
        </aside>

        {/* Overlay for mobile */}
        {sidebarOpen && (
          <div
            className="fixed inset-0 bg-zinc-950/20 z-30 lg:hidden backdrop-blur-sm"
            onClick={() => setSidebarOpen(false)}
          />
        )}

        {/* Main Content */}
        <main className="flex-1 w-full min-w-0 p-0 overflow-hidden h-[calc(100vh-4rem)]">
          <div className="h-full w-full">
            {activeTab === 'chat' && <ChatInterface />}
            {activeTab === 'emails' && <EmailList />}
            {activeTab === 'connections' && (
              <PlatformConnections user={user} onUpdate={loadSyncStatus} />
            )}
          </div>
        </main>
      </div>
    </div>
  );
};

export default Dashboard;
