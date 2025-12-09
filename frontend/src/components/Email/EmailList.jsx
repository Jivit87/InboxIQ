import { useState, useEffect } from 'react';
import { emailAPI } from '../../services/api';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../ui/card';
import { Badge } from '../ui/badge';
import { ScrollArea } from '../ui/scroll-area';
import { Separator } from '../ui/separator';
import { useToast } from '../ui/use-toast';
import { Mail, Search, Loader2, Inbox, ChevronLeft, ChevronRight, Star, Trash2, CheckCircle, XCircle } from 'lucide-react';

const EmailList = () => {
  const [emails, setEmails] = useState([]);
  const [selectedEmail, setSelectedEmail] = useState(null);
  const [page, setPage] = useState(1);
  const [pagination, setPagination] = useState(null);
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [view, setView] = useState('list');
  const [showDetail, setShowDetail] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    loadEmails();
  }, [page, view]);

  const loadEmails = async () => {
    setLoading(true);
    try {
      let data;
      if (view === 'unread') {
        data = await emailAPI.getUnread();
        setEmails(data.emails || []);
      } else {
        data = await emailAPI.getAll(page, 20);
        setEmails(data.emails || []);
        setPagination(data.pagination);
      }
    } catch (error) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: error.message,
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = async () => {
    if (!searchQuery.trim()) {
      loadEmails();
      return;
    }
    setLoading(true);
    try {
      const data = await emailAPI.search(searchQuery);
      setEmails(data.emails || []);
      setPagination(null);
    } catch (error) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: error.message,
      });
    } finally {
      setLoading(false);
    }
  };

  const handleEmailClick = async (emailId) => {
    try {
      const email = await emailAPI.getById(emailId);
      
      // Mark as read if not already
      if (!email.isRead) {
        await emailAPI.markRead(emailId, true);
        setEmails(prev => prev.map(e => e._id === emailId ? { ...e, isRead: true } : e));
      }
      
      setSelectedEmail(email);
      setShowDetail(true);
    } catch (error) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: error.message,
      });
    }
  };

  const handleToggleStar = async (e, email) => {
    e.stopPropagation();
    try {
      const newStatus = !email.isStarred;
      await emailAPI.toggleStar(email._id, newStatus);
      
      // Update local state
      setEmails(prev => prev.map(e => e._id === email._id ? { ...e, isStarred: newStatus } : e));
      if (selectedEmail?._id === email._id) {
        setSelectedEmail(prev => ({ ...prev, isStarred: newStatus }));
      }
    } catch (error) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Failed to update star status',
      });
    }
  };

  const handleDelete = async (e, emailId) => {
    e.stopPropagation();
    if (!confirm('Are you sure you want to delete this email?')) return;
    
    try {
      await emailAPI.delete(emailId);
      
      // Remove from local state
      setEmails(prev => prev.filter(e => e._id !== emailId));
      if (selectedEmail?._id === emailId) {
        setSelectedEmail(null);
        setShowDetail(false);
      }
      
      toast({
        title: 'Deleted',
        description: 'Email deleted successfully',
      });
    } catch (error) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Failed to delete email',
      });
    }
  };

  const handleDeleteAll = async () => {
    if (!confirm('WARNING: This will delete ALL emails. This action cannot be undone. Are you sure?')) return;
    
    try {
      await emailAPI.deleteAll();
      setEmails([]);
      setSelectedEmail(null);
      setShowDetail(false);
      
      toast({
        title: 'Reset Complete',
        description: 'All emails have been deleted',
      });
    } catch (error) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Failed to delete all emails',
      });
    }
  };

  const formatDate = (date) => {
    return new Date(date).toLocaleString();
  };

  return (
    <div className="h-full flex flex-col bg-white">
      <div className="px-6 py-4 border-b border-zinc-200 bg-white">
        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div>
            <CardTitle className="flex items-center gap-2 text-lg md:text-xl text-zinc-900 tracking-tight">
              <div className="p-1.5 rounded-lg bg-zinc-100 border border-zinc-200">
                <Mail className="h-4 w-4 md:h-5 md:w-5 text-zinc-900" />
              </div>
              Emails
            </CardTitle>
            <CardDescription className="mt-1 text-xs md:text-sm text-zinc-500">
              Manage your emails
            </CardDescription>
          </div>
          <div className="flex gap-2 items-center">
             <Button
              variant={view === 'list' ? 'default' : 'outline'}
              size="sm"
              onClick={() => {
                setView('list');
                setPage(1);
              }}
              className={`text-xs md:text-sm h-8 md:h-9 ${view === 'list' ? 'bg-zinc-900 text-zinc-50 hover:bg-zinc-900/90' : 'text-zinc-600 hover:text-zinc-900'}`}
            >
              All
            </Button>
            <Button
              variant={view === 'unread' ? 'default' : 'outline'}
              size="sm"
              onClick={() => {
                setView('unread');
                setPage(1);
              }}
              className={`text-xs md:text-sm h-8 md:h-9 ${view === 'unread' ? 'bg-zinc-900 text-zinc-50 hover:bg-zinc-900/90' : 'text-zinc-600 hover:text-zinc-900'}`}
            >
              Unread
            </Button>
            
            <Separator orientation="vertical" className="h-6 mx-1" />
            
            <Button
              variant="destructive"
              size="sm"
              onClick={handleDeleteAll}
              className="text-xs md:text-sm h-8 md:h-9 bg-red-50 text-red-600 hover:bg-red-100 border border-red-200 shadow-none"
            >
              <Trash2 className="h-3.5 w-3.5 mr-1.5" />
              Reset All
            </Button>
          </div>
        </div>
        <div className="flex gap-2 mt-3 md:mt-4">
          <Input
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
            placeholder="Search emails..."
            className="text-sm md:text-base h-9 md:h-10 bg-zinc-50 border-zinc-200 focus:ring-zinc-950 focus:border-zinc-950"
          />
          <Button 
            onClick={handleSearch} 
            disabled={loading}
            size="icon"
            className="h-9 w-9 md:h-10 md:w-10 flex-shrink-0 bg-zinc-900 text-zinc-50 hover:bg-zinc-900/90"
          >
            <Search className="h-4 w-4" />
          </Button>
        </div>
      </div>
      <div className="flex-1 flex flex-col lg:flex-row gap-0 lg:gap-0 overflow-hidden p-0 relative bg-white">
        {/* Email List */}
        <div className={`${
          showDetail ? 'hidden lg:flex' : 'flex'
        } lg:w-1/2 border-r border-zinc-200 flex-col min-w-0 h-full`}>
          <ScrollArea className="flex-1">
            {loading && (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="h-6 w-6 animate-spin text-zinc-400" />
              </div>
            )}
            {!loading && emails.length === 0 && (
              <div className="flex flex-col items-center justify-center py-12 text-zinc-500">
                <Inbox className="h-12 w-12 mb-4 opacity-20" />
                <p className="text-sm md:text-base font-medium">No emails found</p>
              </div>
            )}
            {!loading && emails.map((email) => (
              <div
                key={email._id}
                onClick={() => handleEmailClick(email._id)}
                className={`p-4 border-b border-zinc-100 cursor-pointer group relative ${
                  selectedEmail?._id === email._id
                    ? 'bg-zinc-50 border-l-4 border-l-zinc-900 pl-[12px]' 
                    : 'hover:bg-zinc-50 border-l-4 border-l-transparent'
                }`}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <div className={`text-sm md:text-base truncate flex-1 ${!email.isRead ? 'font-semibold text-zinc-900' : 'font-medium text-zinc-700'}`}>
                        {email.from?.name || email.from?.email || 'Unknown'}
                      </div>
                      <button 
                        onClick={(e) => handleToggleStar(e, email)}
                        className="text-zinc-400 hover:text-yellow-400 focus:outline-none transition-colors"
                      >
                        <Star className={`h-4 w-4 ${email.isStarred ? 'fill-yellow-400 text-yellow-400' : ''}`} />
                      </button>
                    </div>
                    
                    <div className={`text-xs md:text-sm truncate mt-0.5 ${!email.isRead ? 'font-medium text-zinc-900' : 'text-zinc-500'}`}>
                      {email.subject}
                    </div>
                    <div className="text-xs text-zinc-400 line-clamp-2 mt-1.5">
                      {email.snippet}
                    </div>
                    {!email.isRead && (
                      <Badge variant="default" className="mt-2 text-[10px] h-5 bg-zinc-900 text-zinc-50 hover:bg-zinc-800">
                        Unread
                      </Badge>
                    )}
                  </div>
                  <div className="flex flex-col items-end gap-2">
                    <div className="text-xs text-zinc-400 whitespace-nowrap font-medium">
                      {new Date(email.date).toLocaleDateString()}
                    </div>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={(e) => handleDelete(e, email._id)}
                      className="h-6 w-6 text-zinc-400 hover:text-red-600 hover:bg-red-50 opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                </div>
              </div>
            ))}
          </ScrollArea>
          {pagination && (
            <div className="p-3 md:p-4 border-t border-zinc-200 flex justify-between items-center bg-zinc-50 flex-shrink-0">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setPage(page - 1)}
                disabled={page === 1}
                className="h-8 text-xs md:text-sm border-zinc-200 text-zinc-700 hover:text-zinc-900"
              >
                <ChevronLeft className="h-3 w-3 md:h-4 md:w-4 mr-1" />
                Previous
              </Button>
              <span className="text-xs md:text-sm text-zinc-500 font-medium">
                Page {pagination.page} of {pagination.pages}
              </span>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setPage(page + 1)}
                disabled={page >= pagination.pages}
                className="h-8 text-xs md:text-sm border-zinc-200 text-zinc-700 hover:text-zinc-900"
              >
                Next
                <ChevronRight className="h-3 w-3 md:h-4 md:w-4 ml-1" />
              </Button>
            </div>
          )}
        </div>

        {/* Email Detail */}
        <div className={`${
          showDetail ? 'flex' : 'hidden lg:flex'
        } lg:w-1/2 flex-col h-full lg:relative bg-white ${
          showDetail ? 'absolute inset-0 z-10 lg:z-auto' : ''
        }`}>
          {selectedEmail ? (
            <>
              <div className="lg:hidden p-3 border-b border-zinc-200 bg-white flex-shrink-0">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    setShowDetail(false);
                    setSelectedEmail(null);
                  }}
                  className="h-9 text-zinc-600"
                >
                  <ChevronLeft className="h-4 w-4 mr-2" />
                  Back
                </Button>
              </div>
              <ScrollArea className="flex-1 p-6">
                <div className="flex items-start justify-between mb-4">
                  <h3 className="text-lg md:text-xl font-semibold break-words text-zinc-900 tracking-tight flex-1 pr-4">
                    {selectedEmail.subject}
                  </h3>
                  <div className="flex gap-1">
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={(e) => handleToggleStar(e, selectedEmail)}
                      className="h-8 w-8 text-zinc-400 hover:text-yellow-400"
                    >
                      <Star className={`h-5 w-5 ${selectedEmail.isStarred ? 'fill-yellow-400 text-yellow-400' : ''}`} />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={(e) => handleDelete(e, selectedEmail._id)}
                      className="h-8 w-8 text-zinc-400 hover:text-red-600 hover:bg-red-50"
                    >
                      <Trash2 className="h-5 w-5" />
                    </Button>
                  </div>
                </div>
                
                <div className="flex items-center gap-3 mb-6 pb-6 border-b border-zinc-100">
                  <div className="h-10 w-10 rounded-full bg-zinc-100 flex items-center justify-center text-zinc-500 font-medium">
                    {(selectedEmail.from?.name || selectedEmail.from?.email || '?')[0].toUpperCase()}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-medium text-zinc-900">
                      {selectedEmail.from?.name || selectedEmail.from?.email}
                    </div>
                    <div className="text-xs text-zinc-500">
                      {formatDate(selectedEmail.date)}
                    </div>
                  </div>
                </div>
                <div className="whitespace-pre-wrap text-sm md:text-base leading-relaxed break-words text-zinc-800">
                  {selectedEmail.body || selectedEmail.snippet}
                </div>
              </ScrollArea>
            </>
          ) : (
            <div className="flex items-center justify-center h-full text-center text-zinc-400 p-6 bg-zinc-50/30">
              <div>
                <Mail className="h-12 w-12 md:h-16 md:w-16 mx-auto mb-4 opacity-20" />
                <p className="text-sm md:text-base font-medium text-zinc-600">Select an email to view</p>
                <p className="text-xs md:text-sm mt-1">Choose an email from the list</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default EmailList;
