import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import {
  Users,
  Clock,
  Search,
  ChevronDown,
  ChevronUp,
  Eye,
  ThumbsUp,
  ThumbsDown,
  CheckCircle2,
  XCircle,
  Filter,
  MoreHorizontal
} from 'lucide-react';
import { Media } from '@/types';

interface ClientWithMedia {
  id: string;
  email: string;
  name?: string;
  total_uploads: number;
  pending_count: number;
  approved_count: number;
  rejected_count: number;
  media_items: Media[];
}

export function Clients() {
  const [clients, setClients] = useState<ClientWithMedia[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [expandedClientId, setExpandedClientId] = useState<string | null>(null);
  const [selectedMedia, setSelectedMedia] = useState<Media | null>(null);
  const [reviewNotes, setReviewNotes] = useState('');
  const [filterStatus, setFilterStatus] = useState<'all' | 'pending' | 'approved' | 'rejected'>('all');

  useEffect(() => {
    loadClients();
  }, []);

  const loadClients = async () => {
    try {
      setLoading(true);
      const adminEmail = import.meta.env.VITE_ADMIN_EMAIL;
      console.log('Admin email:', adminEmail);

      // Fetch all clients (including those without media)
      const { data: clientsData, error: clientsError } = await supabase
        .from('clients')
        .select('*')
        .order('created_at', { ascending: false });

      if (clientsError) throw clientsError;

      // Filter out admin user in app logic
      const filteredClients = (clientsData || []).filter(c => c.email !== adminEmail);

      // Fetch all media
      const { data: mediaData, error: mediaError } = await supabase
        .from('media')
        .select('*')
        .order('created_at', { ascending: false });

      if (mediaError) throw mediaError;

      // Filter media to only client uploads
      const clientMediaData = (mediaData || []).filter(m => m.client_id !== null);

      // Build client-media relationship
      const clientsWithMedia: ClientWithMedia[] = filteredClients.map((client) => {
        const clientMedia = (clientMediaData || []).filter((m) => m.client_id === client.id);
        return {
          id: client.id,
          email: client.email,
          name: client.name || client.email,
          total_uploads: clientMedia.length,
          pending_count: clientMedia.filter((m) => m.status === 'pending').length,
          approved_count: clientMedia.filter((m) => m.status === 'approved').length,
          rejected_count: clientMedia.filter((m) => m.status === 'rejected').length,
          media_items: clientMedia,
        };
      });

      setClients(clientsWithMedia);
    } catch (error) {
      console.error('Error loading clients:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleApproveMedia = async (media: Media) => {
    try {
      const { error } = await supabase
        .from('media')
        .update({
          status: 'approved',
          admin_notes: reviewNotes,
          is_active: true,
        })
        .eq('id', media.id);

      if (error) throw error;

      setReviewNotes('');
      setSelectedMedia(null);
      await loadClients();
    } catch (error) {
      console.error('Error approving media:', error);
      alert('Error approving media. Please try again.');
    }
  };

  const handleRejectMedia = async (media: Media) => {
    try {
      const { error } = await supabase
        .from('media')
        .update({
          status: 'rejected',
          admin_notes: reviewNotes,
        })
        .eq('id', media.id);

      if (error) throw error;

      setReviewNotes('');
      setSelectedMedia(null);
      await loadClients();
    } catch (error) {
      console.error('Error rejecting media:', error);
      alert('Error rejecting media. Please try again.');
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

  const filteredMediaByStatus = (media: Media[]) => {
    if (filterStatus === 'all') return media;
    return media.filter((m) => m.status === filterStatus);
  };

  const getStatusButtonClass = (status: string) => {
    const base = "px-3 py-1.5 rounded-md text-sm font-medium transition-all duration-200 capitalize";
    if (filterStatus === status) {
      return `${base} bg-white text-gray-900 shadow-sm ring-1 ring-gray-200`;
    }
    return `${base} text-gray-500 hover:text-gray-900 hover:bg-gray-100/50`;
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
          {/* Stat Card Component */}
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
              onClick={() => setFilterStatus(status as any)}
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
            const clientMediaFiltered = filteredMediaByStatus(client.media_items);

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
                    {clientMediaFiltered.length === 0 ? (
                      <div className="text-center py-8 text-gray-400 text-sm">No media items match the current filter</div>
                    ) : (
                      <div className="space-y-3">
                        {clientMediaFiltered.map((media) => (
                          <div
                            key={media.id}
                            className="bg-white rounded-lg p-3 border border-gray-100 flex gap-4 hover:border-gray-300 transition-colors group/item"
                          >
                            {/* Thumbnail */}
                            <div className="w-24 h-16 flex-shrink-0 bg-gray-100 rounded-md overflow-hidden border border-gray-200 relative">
                              {media.file_type === 'image' ? (
                                <img
                                  src={media.file_url}
                                  alt={media.title}
                                  className="w-full h-full object-cover"
                                />
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

                            <div className="flex-1 min-w-0 flex flex-col justify-center">
                              <div className="flex items-start justify-between">
                                <div>
                                  <h4 className="text-sm font-medium text-gray-900 truncate pr-4">{media.title}</h4>
                                  <p className="text-xs text-gray-500 mt-0.5 flex items-center gap-2">
                                    <span className="uppercase">{media.file_type}</span>
                                    <span className="w-0.5 h-0.5 rounded-full bg-gray-300"></span>
                                    <span>{new Date(media.created_at).toLocaleDateString()}</span>
                                  </p>
                                </div>

                                {/* Status Badge */}
                                <div className="flex-shrink-0">
                                  {media.status === 'pending' && (
                                    <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-yellow-50 text-yellow-700 border border-yellow-100/50">Pending</span>
                                  )}
                                  {media.status === 'approved' && (
                                    <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-emerald-50 text-emerald-700 border border-emerald-100/50">Approved</span>
                                  )}
                                  {media.status === 'rejected' && (
                                    <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-red-50 text-red-700 border border-red-100/50">Rejected</span>
                                  )}
                                </div>
                              </div>

                              {/* Admin Note Preview */}
                              {media.admin_notes && (
                                <div className="mt-2 text-xs text-gray-500 bg-gray-50 p-1.5 rounded flex items-start gap-1.5">
                                  <MoreHorizontal className="w-3 h-3 mt-0.5 flex-shrink-0 opacity-50" />
                                  <span className="line-clamp-1">{media.admin_notes}</span>
                                </div>
                              )}
                            </div>

                            {/* Action Button */}
                            {media.status === 'pending' && (
                              <div className="flex items-center self-center pl-2">
                                <Button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    setSelectedMedia(media);
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
                        ))}
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
      {selectedMedia && (
        <div className="fixed inset-0 bg-gray-900/40 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-in fade-in duration-200">
          <div className="bg-white w-full max-w-4xl max-h-[90vh] rounded-2xl shadow-2xl flex flex-col md:flex-row overflow-hidden">

            {/* Left: Media Preview */}
            <div className="w-full md:w-3/5 bg-gray-950 flex items-center justify-center p-4 md:p-8 relative">
              <div className="absolute top-4 left-4 z-10">
                <span className="px-2 py-1 bg-black/50 text-white text-xs font-medium rounded backdrop-blur-md uppercase tracking-wide">
                  {selectedMedia.file_type}
                </span>
              </div>
              {selectedMedia.file_type === 'image' ? (
                <img
                  src={selectedMedia.file_url}
                  alt={selectedMedia.title}
                  className="max-w-full max-h-full object-contain rounded-lg shadow-lg"
                />
              ) : (
                <video
                  src={selectedMedia.file_url}
                  controls
                  className="max-w-full max-h-full rounded-lg shadow-lg"
                />
              )}
            </div>

            {/* Right: Controls */}
            <div className="w-full md:w-2/5 flex flex-col h-full bg-white">
              <div className="p-6 flex-1 overflow-y-auto">
                <div className="mb-6">
                  <h2 className="text-xl font-bold text-gray-900">{selectedMedia.title}</h2>
                  {selectedMedia.description ? (
                    <p className="text-gray-600 mt-2 text-sm leading-relaxed">{selectedMedia.description}</p>
                  ) : (
                    <p className="text-gray-400 mt-2 text-sm italic">No description provided.</p>
                  )}
                </div>

                <div className="space-y-4">
                  <div className="bg-gray-50 rounded-lg p-3 text-xs text-gray-500 space-y-1">
                    <div className="flex justify-between">
                      <span>Uploaded</span>
                      <span className="font-medium text-gray-900">{new Date(selectedMedia.created_at).toLocaleDateString()}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Time</span>
                      <span className="font-medium text-gray-900">{new Date(selectedMedia.created_at).toLocaleTimeString()}</span>
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
                    setSelectedMedia(null);
                    setReviewNotes('');
                  }}
                >
                  Cancel
                </Button>
                <Button
                  variant="destructive"
                  onClick={() => handleRejectMedia(selectedMedia)}
                  className="bg-white border border-red-200 text-red-600 hover:bg-red-50 hover:border-red-300"
                >
                  <ThumbsDown className="w-4 h-4 mr-2" />
                  Reject
                </Button>
                <Button
                  onClick={() => handleApproveMedia(selectedMedia)}
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