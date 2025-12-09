import { Activity, Mail, Clock, CheckCircle2 } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Badge } from '../ui/badge';

const SyncStatus = ({ status }) => {
  const formatDate = (date) => {
    if (!date) return 'Never';
    return new Date(date).toLocaleString();
  };

  return (
    <Card className="mb-6 border-zinc-200 shadow-sm bg-white">
      <CardHeader className="pb-3 border-b border-zinc-100">
        <CardTitle className="text-lg font-semibold text-zinc-900 flex items-center gap-2 tracking-tight">
          <div className="p-1.5 rounded-lg bg-zinc-100 border border-zinc-200">
            <Activity className="w-4 h-4 text-zinc-900" />
          </div>
          Sync Statistics
        </CardTitle>
      </CardHeader>
      <CardContent className="p-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Connected Platforms */}
          <div className="bg-zinc-50 rounded-xl p-4 border border-zinc-200">
            <h4 className="font-semibold text-zinc-900 mb-4 text-xs uppercase tracking-wider flex items-center gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-zinc-400"></span>
              Connected Platforms
            </h4>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm text-zinc-600 font-medium">Gmail</span>
                <Badge 
                  variant={status.connectedPlatforms?.gmail ? 'default' : 'secondary'}
                  className={`text-xs font-medium ${
                    status.connectedPlatforms?.gmail 
                      ? 'bg-zinc-900 text-zinc-50 hover:bg-zinc-800' 
                      : 'bg-zinc-200 text-zinc-500 hover:bg-zinc-300'
                  }`}
                >
                  {status.connectedPlatforms?.gmail ? 'Connected' : 'Not Connected'}
                </Badge>
              </div>
            </div>
          </div>

          {/* Last Sync */}
          <div className="bg-zinc-50 rounded-xl p-4 border border-zinc-200">
            <h4 className="font-semibold text-zinc-900 mb-4 text-xs uppercase tracking-wider flex items-center gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-zinc-400"></span>
              Last Sync
            </h4>
            <div className="space-y-3 text-sm">
              <div className="flex justify-between items-center">
                <span className="text-zinc-600 font-medium">Gmail</span>
                <span className="text-zinc-900 font-mono text-xs bg-white px-2 py-1 rounded border border-zinc-200">
                  {formatDate(status.lastSync?.gmail)}
                </span>
              </div>
            </div>
          </div>

          {/* Data Counts */}
          <div className="bg-zinc-50 rounded-xl p-4 border border-zinc-200">
            <h4 className="font-semibold text-zinc-900 mb-4 text-xs uppercase tracking-wider flex items-center gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-zinc-400"></span>
              Data Counts
            </h4>
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-white p-3 rounded-lg border border-zinc-100">
                <div className="text-xs text-zinc-500 mb-1 font-medium">Emails</div>
                <div className="text-2xl font-bold text-zinc-900 tracking-tight">{status.counts?.emails || 0}</div>
              </div>
              <div className="bg-white p-3 rounded-lg border border-zinc-100">
                <div className="text-xs text-zinc-500 mb-1 font-medium">Processed</div>
                <div className="text-2xl font-bold text-zinc-900 tracking-tight">{status.counts?.emailsProcessed || 0}</div>
              </div>
              <div className="col-span-2 bg-white p-3 rounded-lg border border-zinc-100 flex items-center justify-between">
                <div className="text-xs text-zinc-500 font-medium">Pending Actions</div>
                <div className="text-xl font-bold text-zinc-900 tracking-tight">{status.pendingActions || 0}</div>
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default SyncStatus;
