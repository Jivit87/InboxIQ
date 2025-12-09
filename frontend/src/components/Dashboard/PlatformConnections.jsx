import { useState } from 'react';
import { authAPI } from '../../services/api';
import { Button } from '../ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../ui/card';
import { Badge } from '../ui/badge';
import { useToast } from '../ui/use-toast';
import { Plug, Mail, MessageSquare, FileText, AlertCircle, CheckCircle2 } from 'lucide-react';

const PlatformConnections = ({ user, onUpdate }) => {
  const [loading, setLoading] = useState('');
  const { toast } = useToast();

  const handleConnect = async (platform) => {
    setLoading(platform);
    try {
      let authUrl;
      if (platform === 'google') {
        authUrl = await authAPI.getGoogleAuthUrl();
      } else if (platform === 'slack') {
        authUrl = await authAPI.getSlackAuthUrl();
      } else if (platform === 'notion') {
        authUrl = await authAPI.getNotionAuthUrl();
      }

      window.open(authUrl, '_blank', 'width=600,height=700');
      
      const code = prompt(
        `Please complete the OAuth flow in the opened window.\n\n` +
        `After authorization, you'll be redirected to a URL with a "code" parameter.\n` +
        `Copy the code from the URL and paste it here:`,
        ''
      );

      if (code && code.trim()) {
        try {
          if (platform === 'google') {
            await authAPI.connectGoogle(code.trim());
          } else if (platform === 'slack') {
            await authAPI.connectSlack(code.trim());
          } else if (platform === 'notion') {
            await authAPI.connectNotion(code.trim());
          }
          toast({
            title: 'Success',
            description: `${platform} connected successfully`,
          });
          onUpdate();
        } catch (err) {
          toast({
            variant: 'destructive',
            title: 'Error',
            description: err.message,
          });
        }
      }
    } catch (err) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: err.message,
      });
    } finally {
      setLoading('');
    }
  };

  const handleDisconnect = async (platform) => {
    if (!confirm(`Are you sure you want to disconnect ${platform}?`)) {
      return;
    }

    setLoading(platform);
    try {
      await authAPI.disconnectPlatform(platform);
      toast({
        title: 'Success',
        description: `${platform} disconnected successfully`,
      });
      onUpdate();
    } catch (err) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: err.message,
      });
    } finally {
      setLoading('');
    }
  };

  const platforms = [
    {
      id: 'google',
      name: 'Google',
      description: 'Gmail',
      icon: Mail,
      connected: user?.connectedPlatforms?.gmail,
    },
  ];

  return (
    <div className="h-full flex flex-col bg-white overflow-y-auto">
      <div className="px-6 py-4 border-b border-zinc-200 bg-white">
        <div className="max-w-6xl mx-auto w-full">
          <h2 className="flex items-center gap-2 text-lg md:text-xl font-semibold text-zinc-900 tracking-tight">
            <div className="p-1.5 rounded-lg bg-zinc-100 border border-zinc-200">
              <Plug className="h-4 w-4 md:h-5 md:w-5 text-zinc-900" />
            </div>
            Platform Connections
          </h2>
          <p className="mt-1 text-xs md:text-sm text-zinc-500 ml-9">
            Connect your accounts to sync data
          </p>
        </div>
      </div>
      <div className="flex-1 p-6 bg-zinc-50/30">
        <div className="max-w-6xl mx-auto w-full">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {platforms.map((platform) => {
            const Icon = platform.icon;
            return (
              <Card
                key={platform.id}
                className={`hover:shadow-md border-zinc-200 ${
                  platform.connected ? 'border-zinc-900 bg-zinc-50' : 'bg-white'
                }`}
              >
                <CardContent className="p-4 md:p-6">
                  <div className="flex items-start justify-between mb-4">
                    <div className={`h-12 w-12 md:h-14 md:w-14 rounded-xl flex items-center justify-center border ${
                      platform.connected ? 'bg-zinc-900 border-zinc-900' : 'bg-zinc-100 border-zinc-200'
                    }`}>
                      <Icon className={`h-6 w-6 md:h-7 md:w-7 ${platform.connected ? 'text-zinc-50' : 'text-zinc-900'}`} />
                    </div>
                    {platform.connected && (
                      <Badge className="flex items-center gap-1 bg-zinc-900 text-zinc-50 hover:bg-zinc-800">
                        <CheckCircle2 className="h-3 w-3" />
                        Connected
                      </Badge>
                    )}
                  </div>
                  <h3 className="text-base md:text-lg font-semibold mb-1 text-zinc-900 tracking-tight">{platform.name}</h3>
                  <p className="text-xs md:text-sm text-zinc-500 mb-6">
                    {platform.description}
                  </p>
                  <Button
                    onClick={() =>
                      platform.connected
                        ? handleDisconnect(platform.id)
                        : handleConnect(platform.id)
                    }
                    disabled={loading === platform.id}
                    variant={platform.connected ? 'destructive' : 'default'}
                    className={`w-full h-9 md:h-10 text-xs md:text-sm font-medium ${
                      platform.connected 
                        ? 'bg-white border border-red-200 text-red-600 hover:bg-red-50 hover:text-red-700 hover:border-red-300 shadow-sm' 
                        : 'bg-zinc-900 text-zinc-50 hover:bg-zinc-900/90 shadow-sm'
                    }`}
                  >
                    {loading === platform.id
                      ? 'Loading...'
                      : platform.connected
                      ? 'Disconnect'
                      : 'Connect'}
                  </Button>
                </CardContent>
              </Card>
            );
          })}
        </div>

        <div className="mt-6 p-4 bg-zinc-50 rounded-lg border border-zinc-200 flex items-start gap-3">
          <AlertCircle className="h-5 w-5 text-zinc-400 mt-0.5 flex-shrink-0" />
          <div className="text-xs md:text-sm text-zinc-600 space-y-1">
            <p className="font-semibold text-zinc-900">OAuth Connection</p>
            <p className="leading-relaxed">
              When connecting a platform, a new window will open for authentication. After
              authorizing, copy the "code" parameter from the redirect URL and paste it in the
              prompt.
            </p>
          </div>
        </div>
        </div>
      </div>
    </div>
  );
};

export default PlatformConnections;
