import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import {
  Users,
  Clock,
  Search,
  ChevronDown,
  ChevronUp,
  ThumbsUp,
  ThumbsDown,
  CheckCircle2,
  XCircle,
  MoreHorizontal,
  Image as ImageIcon,
  Megaphone,
  Calendar,
  MapPin
} from 'lucide-react';
import { Media, Announcement, Event } from '@/types';

type ContentType = 'media' | 'announcement' | 'event';
type ContentItem = (Media | Announcement | Event) & { content_type: ContentType };

interface ClientWithContent {
  id: string;
  email: string;
  name?: string;
  total_uploads: number;
  pending_count: number;
  approved_count: number;
  rejected_count: number;
  content_items: ContentItem[];
}

export function Clients() {
  const [clients, setClients] = useState<ClientWithContent[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [expandedClientId, setExpandedClientId] = useState<string | null>(null);
  const [selectedContent, setSelectedContent] = useState<ContentItem | null>(null);
  const [reviewNotes, setReviewNotes] = useState('');
  const [filterStatus, setFilterStatus] = useState<'all' | 'pending' | 'approved' | 'rejected'>('all');

  useEffect(() => {
    loadClients();
  }, []);

  const loadClients = async () => {
    try {
      setLoading(true);
      const adminEmail = import.meta.env.VITE_ADMIN_EMAIL;

      // Fetch all clients
      const { data: clientsData, error: clientsError } = await supabase
        .from('clients')
        .select('*')
        .order('created_at', { ascending: false });

      if (clientsError) throw clientsError;

      const filteredClients = (clientsData || []).filter(c => c.email !== adminEmail);

      // Fetch all media
      const { data: mediaData, error: mediaError } = await supabase
        .from('media')
        .select('*')
        .order('created_at', { ascending: false });

      if (mediaError) throw mediaError;

      // Fetch all announcements
      const { data: announcementsData, error: announcementsError } = await supabase
        .from('announcements')
        .select('*')
        .order('created_at', { ascending: false });

      if (announcementsError) throw announcementsError;

      // Fetch all events
      const { data: eventsData, error: eventsError } = await supabase
        .from('events')
        .select('*')
        .order('created_at', { ascending: false });

      if (eventsError) throw eventsError;

      // Filter to only client uploads
      const clientMedia = (mediaData || []).filter(m => m.client_id !== null);
      const clientAnnouncements = (announcementsData || []).filter(a => a.client_id !== null);
      const clientEvents = (eventsData || []).filter(e => e.client_id !== null);

      // Build client-content relationship
      const clientsWithContent: ClientWithContent[] = filteredClients.map((client) => {
        const media = clientMedia.filter(m => m.client_id === client.id).map(m => ({ ...m, content_type: 'media' as ContentType }));
        const announcements = clientAnnouncements.filter(a => a.client_id === client.id).map(a => ({ ...a, content_type: 'announcement' as ContentType }));
        const events = clientEvents.filter(e => e.client_id === client.id).map(e => ({ ...e, content_type: 'event' as ContentType }));

        const allContent = [...media, ...announcements, ...events].sort((a, b) =>
          new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
        );

        return {
          id: client.id,
          email: client.email,
          name: client.name || client.email,
          total_uploads: allContent.length,
          pending_count: allContent.filter(c => c.status === 'pending').length,
          approved_count: allContent.filter(c => c.status === 'approved').length,
          rejected_count: allContent.filter(c => c.status === 'rejected').length,
          content_items: allContent,
        };
      });

      setClients(clientsWithContent);
    } catch (error) {
      console.error('Error loading clients:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleApproveContent = async (content: ContentItem) => {
    try {
      const table = content.content_type === 'media' ? 'media' : content.content_type === 'announcement' ? 'announcements' : 'events';

      const { error } = await supabase
        .from(table)
        .update({
          status: 'approved',
          admin_notes: reviewNotes,
          is_active: true,
        })
        .eq('id', content.id);

      if (error) throw error;

      setReviewNotes('');
      setSelectedContent(null);
      await loadClients();
    } catch (error) {
      console.error('Error approving content:', error);
      alert('Error approving content. Please try again.');
    }
  };

  const handleRejectContent = async (content: ContentItem) => {
    try {
      const table = content.content_type === 'media' ? 'media' : content.content_type === 'announcement' ? 'announcements' : 'events';

      const { error } = await supabase
        .from(table)
        .update({
          status: 'rejected',
          admin_notes: reviewNotes,
        })
        .eq('id', content.id);

      if (error) throw error;

      setReviewNotes('');
      setSelectedContent(null);
      await loadClients();
    } catch (error) {
      console.error('Error rejecting content:', error);
      alert('Error rejecting content. Please try again.');
    }
  };

  const filteredClients = clients.filter((client) => {
    const matchesSearch =
      client.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
      client.name?.toLowerCase().includes(searchQuery.toLowerCase());

    if (filterStatus === 'all') return matchesSearch;
    if (filterStatus === 'pending') return matchesSearch && client.pending_count > 0;
    if (filterStatus === 'approved') return matchesSearch && client.approved_count > 0;
    if (filterStatus === 'rejected') return matchesSearch && client.rejected_count > 0;

    return matchesSearch;
  });

  const filteredContentByStatus = (content: ContentItem[]) => {
    if (filterStatus === 'all') return content;
    return content.filter((c) => c.status === filterStatus);
  };

  const getStatusButtonClass = (status: string) => {
    const base = "px-3 py-1.5 rounded-md text-sm font-medium transition-all duration-200 capitalize";
    if (filterStatus === status) {
      return `${base} bg-white text-gray-900 shadow-sm ring-1 ring-gray-200`;
    }
    return `${base} text-gray-500 hover:text-gray-900 hover:bg-gray-100/50`;
  };

  const getContentIcon = (type: ContentType) => {
    switch (type) {
      case 'media': return ImageIcon;
      case 'announcement': return Megaphone;
      case 'event': return Calendar;
    }
  };

  const getContentTypeLabel = (type: ContentType) => {
    return type.charAt(0).toUpperCase() + type.slice(1);
  };

  const renderContentPreview = (content: ContentItem) => {
    if (content.content_type === 'media') {
      const media = content as Media;
      return (
        <div className="w-24 h-16 flex-shrink-0 bg-gray-100 rounded-md overflow-hidden border border-gray-200 relative">
          {media.file_type === 'image' ? (
            <img src={media.file_url} alt={media.title} className="w-full h-full object-cover" />
          ) : (
            <div className="w-full h-full flex items-center justify-center bg-gray-900">
              <video src={media.file_url} className="w-full h-full object-cover opacity-60" />
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="w-6 h-6 rounded-full bg-white/20 flex items-center justify-center backdrop-blur-sm">
                  <div className="w-0 h-0 border-t-[4px] border-t-transparent border-l-[6px] border-l-white border-b-[4px] border-b-transparent ml-0.5"></div>
                </div>
              </div>
            </div>
          )}
        </div>
      );
    } else if (content.content_type === 'announcement') {
      return (
        <div className="w-24 h-16 flex-shrink-0 bg-purple-50 rounded-md border border-purple-100 flex items-center justify-center">
          <Megaphone className="w-8 h-8 text-purple-400" />
        </div>
      );
    } else {
      return (
        <div className="w-24 h-16 flex-shrink-0 bg-green-50 rounded-md border border-green-100 flex items-center justify-center">
          <Calendar className="w-8 h-8 text-green-400" />
        </div>
      );
    }
  };

  const getContentTitle = (content: ContentItem) => {
    if (content.content_type === 'media') return (content as Media).title || 'Untitled';
    if (content.content_type === 'announcement') return (content as Announcement).title;
    return (content as Event).title;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-[60vh]">
        <div className="flex flex-col items-center gap-4">
          <div className="w-8 h-8 border-2 border-gray-900 border-t-transparent rounded-full animate-spin"></div>
          <p className="text-gray-400 font-medium">Loading clients...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto space-y-8 p-1">
      {/* Header & Stats */}
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-gray-900">Clients</h1>
          <p className="text-gray-500 mt-1">Manage client accounts and review uploads.</p>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            { label: 'Total Clients', value: clients.length, icon: Users, color: 'text-blue-600', bg: 'bg-blue-50' },
            { label: 'Pending Review', value: clients.reduce((sum, c) => sum + c.pending_count, 0), icon: Clock, color: 'text-yellow-600', bg: 'bg-yellow-50' },
            { label: 'Approved', value: clients.reduce((sum, c) => sum + c.approved_count, 0), icon: CheckCircle2, color: 'text-emerald-600', bg: 'bg-emerald-50' },
            { label: 'Rejected', value: clients.reduce((sum, c) => sum + c.rejected_count, 0), icon: XCircle, color: 'text-red-600', bg: 'bg-red-50' },
          ].map((stat, idx) => (
            <div key={idx} className="bg-white rounded-xl border border-gray-100 p-5 shadow-[0_2px_10px_-4px_rgba(0,0,0,0.05)] flex flex-col justify-between h-28">
              <div className="flex justify-between items-start">
                <span className="text-sm font-medium text-gray-500">{stat.label}</span>
                <div className={`p-1.5 rounded-lg ${stat.bg}`}>
                  <stat.icon className={`w-4 h-4 ${stat.color}`} />
                </div>
              </div>
              <span className="text-3xl font-bold text-gray-900">{stat.value}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Toolbar */}
      <div className="flex flex-col md:flex-row gap-4 items-center justify-between bg-white p-2 rounded-xl border border-gray-100 shadow-sm">
        <div className="relative w-full md:w-80">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
          <Input
            placeholder="Search clients..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9 bg-transparent border-0 focus-visible:ring-0 focus-visible:ring-offset-0 placeholder:text-gray-400"
          />
        </div>

        <div className="flex items-center gap-1 bg-gray-50/80 p-1 rounded-lg w-full md:w-auto overflow-x-auto">
          {['all', 'pending', 'approved', 'rejected'].map((status) => (
            <button
              key={status}
            onClick={() => setFilterStatus(status as 'all' | 'pending' | 'approved' | 'rejected')}
              className={getStatusButtonClass(status)}
            >
              {status}
            </button>
          ))}
        </div>
      </div>

      {/* Clients List */}
      <div className="space-y-4">
        {filteredClients.length === 0 ? (
          <div className="bg-white rounded-xl border border-dashed border-gray-200 p-12 text-center">
            <div className="w-12 h-12 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-4">
              <Search className="w-6 h-6 text-gray-300" />
            </div>
            <p className="text-gray-900 font-medium">No clients found</p>
            <p className="text-sm text-gray-500">Try adjusting your search or filters</p>
          </div>
        ) : (
          filteredClients.map((client) => {
            const isExpanded = expandedClientId === client.id;
            const clientContentFiltered = filteredContentByStatus(client.content_items);

            return (
              <div
                key={client.id}
                className={`group bg-white rounded-xl border transition-all duration-200 overflow-hidden
                    ${isExpanded ? 'border-gray-200 shadow-sm ring-1 ring-gray-200' : 'border-gray-100 hover:border-gray-200 hover:shadow-sm'}
                `}
              >
                <div
                  className="p-5 cursor-pointer flex items-center gap-6"
                  onClick={() => setExpandedClientId(isExpanded ? null : client.id)}
                >
                  {/* Avatar */}
                  <div className="flex-shrink-0">
                    <div className="w-10 h-10 bg-gray-100 rounded-full flex items-center justify-center border border-gray-200">
                      <span className="font-semibold text-gray-600 text-sm">
                        {(client.name || client.email).charAt(0).toUpperCase()}
                      </span>
                    </div>
                  </div>

                  {/* Info */}
                  <div className="flex-1 min-w-0 grid grid-cols-1 md:grid-cols-12 gap-4 items-center">
                    <div className="md:col-span-4">
                      <h3 className="font-medium text-gray-900 truncate">{client.name || 'Unnamed Client'}</h3>
                      <p className="text-xs text-gray-500 truncate">{client.email}</p>
                    </div>

                    {/* Stats Pills */}
                    <div className="md:col-span-8 flex flex-wrap items-center gap-2">
                      <span className="px-2.5 py-1 rounded-full bg-gray-50 border border-gray-100 text-xs font-medium text-gray-600">
                        {client.total_uploads} Uploads
                      </span>

                      {client.pending_count > 0 && (
                        <span className="px-2.5 py-1 rounded-full bg-yellow-50 border border-yellow-100 text-xs font-medium text-yellow-700 flex items-center gap-1">
                          <div className="w-1.5 h-1.5 rounded-full bg-yellow-500"></div>
                          {client.pending_count} Pending
                        </span>
                      )}
                      {client.approved_count > 0 && (
                        <span className="px-2.5 py-1 rounded-full bg-emerald-50 border border-emerald-100 text-xs font-medium text-emerald-700">
                          {client.approved_count} Approved
                        </span>
                      )}
                      {client.rejected_count > 0 && (
                        <span className="px-2.5 py-1 rounded-full bg-red-50 border border-red-100 text-xs font-medium text-red-700">
                          {client.rejected_count} Rejected
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="flex-shrink-0 text-gray-300">
                    {isExpanded ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
                  </div>
                </div>

                {/* Expanded Content */}
                {isExpanded && (
                  <div className="border-t border-gray-100 bg-gray-50/50 p-4 md:p-6">
                    {clientContentFiltered.length === 0 ? (
                      <div className="text-center py-8 text-gray-400 text-sm">No content items match the current filter</div>
                    ) : (
                      <div className="space-y-3">
                        {clientContentFiltered.map((content) => {
                          const Icon = getContentIcon(content.content_type);
                          return (
                            <div
                              key={content.id}
                              className="bg-white rounded-lg p-3 border border-gray-100 flex gap-4 hover:border-gray-300 transition-colors group/item"
                            >
                              {/* Preview */}
                              {renderContentPreview(content)}

                              <div className="flex-1 min-w-0 flex flex-col justify-center">
                                <div className="flex items-start justify-between">
                                  <div>
                                    <div className="flex items-center gap-2 mb-1">
                                      <Icon className="w-3.5 h-3.5 text-gray-400" />
                                      <span className="text-xs text-gray-500 uppercase font-medium">{getContentTypeLabel(content.content_type)}</span>
                                    </div>
                                    <h4 className="text-sm font-medium text-gray-900 truncate pr-4">{getContentTitle(content)}</h4>
                                    <p className="text-xs text-gray-500 mt-0.5">
                                      {new Date(content.created_at).toLocaleDateString()}
                                    </p>
                                  </div>

                                  {/* Status Badge */}
                                  <div className="flex-shrink-0">
                                    {content.status === 'pending' && (
                                      <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-yellow-50 text-yellow-700 border border-yellow-100/50">Pending</span>
                                    )}
                                    {content.status === 'approved' && (
                                      <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-emerald-50 text-emerald-700 border border-emerald-100/50">Approved</span>
                                    )}
                                    {content.status === 'rejected' && (
                                      <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-red-50 text-red-700 border border-red-100/50">Rejected</span>
                                    )}
                                  </div>
                                </div>

                                {/* Admin Note Preview */}
                                {content.admin_notes && (
                                  <div className="mt-2 text-xs text-gray-500 bg-gray-50 p-1.5 rounded flex items-start gap-1.5">
                                    <MoreHorizontal className="w-3 h-3 mt-0.5 flex-shrink-0 opacity-50" />
                                    <span className="line-clamp-1">{content.admin_notes}</span>
                                  </div>
                                )}
                              </div>

                              {/* Action Button */}
                              {content.status === 'pending' && (
                                <div className="flex items-center self-center pl-2">
                                  <Button
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      setSelectedContent(content);
                                    }}
                                    variant="ghost"
                                    size="sm"
                                    className="h-8 text-blue-600 hover:text-blue-700 hover:bg-blue-50 font-normal text-xs"
                                  >
                                    Review
                                  </Button>
                                </div>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>

      {/* Review Modal */}
      {selectedContent && (
        <div className="fixed inset-0 bg-gray-900/40 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-in fade-in duration-200">
          <div className="bg-white w-full max-w-4xl max-h-[90vh] rounded-2xl shadow-2xl flex flex-col md:flex-row overflow-hidden">

            {/* Left: Content Preview */}
            <div className="w-full md:w-3/5 bg-gray-950 flex items-center justify-center p-4 md:p-8 relative">
              <div className="absolute top-4 left-4 z-10 flex gap-2">
                <span className="px-2 py-1 bg-black/50 text-white text-xs font-medium rounded backdrop-blur-md uppercase tracking-wide">
                  {getContentTypeLabel(selectedContent.content_type)}
                </span>
              </div>

              {selectedContent.content_type === 'media' ? (
                (selectedContent as Media).file_type === 'image' ? (
                  <img
                    src={(selectedContent as Media).file_url}
                    alt={getContentTitle(selectedContent)}
                    className="max-w-full max-h-full object-contain rounded-lg shadow-lg"
                  />
                ) : (
                  <video
                    src={(selectedContent as Media).file_url}
                    controls
                    className="max-w-full max-h-full rounded-lg shadow-lg"
                  />
                )
              ) : selectedContent.content_type === 'announcement' ? (
                <div className="w-full max-w-lg bg-white rounded-lg p-8 text-left">
                  {(selectedContent as Announcement).image_url && (
                    <img
                      src={(selectedContent as Announcement).image_url}
                      alt={(selectedContent as Announcement).title}
                      className="w-full h-48 object-cover rounded-lg mb-4"
                    />
                  )}
                  <h3 className="text-2xl font-bold text-gray-900 mb-4">{(selectedContent as Announcement).title}</h3>
                  <p className="text-gray-600 whitespace-pre-wrap">{(selectedContent as Announcement).body}</p>
                </div>
              ) : (
                <div className="w-full max-w-lg bg-white rounded-lg p-8 text-left">
                  {(selectedContent as Event).image_url && (
                    <img
                      src={(selectedContent as Event).image_url}
                      alt={(selectedContent as Event).title}
                      className="w-full h-48 object-cover rounded-lg mb-4"
                    />
                  )}
                  <h3 className="text-2xl font-bold text-gray-900 mb-4">{(selectedContent as Event).title}</h3>
                  <p className="text-gray-600 mb-4 whitespace-pre-wrap">{(selectedContent as Event).description}</p>
                  <div className="space-y-2 text-sm">
                    <div className="flex items-center gap-2 text-gray-500">
                      <Calendar className="w-4 h-4" />
                      <span>{new Date((selectedContent as Event).start_date).toLocaleString()}</span>
                    </div>
                    {(selectedContent as Event).location && (
                      <div className="flex items-center gap-2 text-gray-500">
                        <MapPin className="w-4 h-4" />
                        <span>{(selectedContent as Event).location}</span>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* Right: Controls */}
            <div className="w-full md:w-2/5 flex flex-col h-full bg-white">
              <div className="p-6 flex-1 overflow-y-auto">
                <div className="mb-6">
                  <h2 className="text-xl font-bold text-gray-900">{getContentTitle(selectedContent)}</h2>
                  {selectedContent.content_type === 'media' && (selectedContent as Media).description && (
                    <p className="text-gray-600 mt-2 text-sm leading-relaxed">{(selectedContent as Media).description}</p>
                  )}
                </div>

                <div className="space-y-4">
                  <div className="bg-gray-50 rounded-lg p-3 text-xs text-gray-500 space-y-1">
                    <div className="flex justify-between">
                      <span>Uploaded</span>
                      <span className="font-medium text-gray-900">{new Date(selectedContent.created_at).toLocaleDateString()}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Time</span>
                      <span className="font-medium text-gray-900">{new Date(selectedContent.created_at).toLocaleTimeString()}</span>
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Review Notes</label>
                    <Textarea
                      value={reviewNotes}
                      onChange={(e) => setReviewNotes(e.target.value)}
                      placeholder="Add optional reason for rejection or approval notes..."
                      className="min-h-[120px] resize-none text-sm"
                    />
                  </div>
                </div>
              </div>

              <div className="p-6 border-t border-gray-100 bg-gray-50 flex gap-3 justify-end">
                <Button
                  variant="ghost"
                  onClick={() => {
                    setSelectedContent(null);
                    setReviewNotes('');
                  }}
                >
                  Cancel
                </Button>
                <Button
                  variant="destructive"
                  onClick={() => handleRejectContent(selectedContent)}
                  className="bg-white border border-red-200 text-red-600 hover:bg-red-50 hover:border-red-300"
                >
                  <ThumbsDown className="w-4 h-4 mr-2" />
                  Reject
                </Button>
                <Button
                  onClick={() => handleApproveContent(selectedContent)}
                  className="bg-gray-900 hover:bg-gray-800 text-white"
                >
                  <ThumbsUp className="w-4 h-4 mr-2" />
                  Approve
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default Clients;