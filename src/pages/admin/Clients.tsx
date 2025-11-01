import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
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
      console.log('All clients from DB:', clientsData);

      // Filter out admin user in app logic (more reliable)
      const filteredClients = (clientsData || []).filter(c => c.email !== adminEmail);
      console.log('Clients after filtering admin:', filteredClients);

      // Fetch all media (we'll filter by client_id in code)
      const { data: mediaData, error: mediaError } = await supabase
        .from('media')
        .select('*')
        .order('created_at', { ascending: false });

      if (mediaError) throw mediaError;
      console.log('All media from DB:', mediaData);
      
      // Filter media to only client uploads (exclude admin uploads with null client_id)
      const clientMediaData = (mediaData || []).filter(m => m.client_id !== null);
      console.log('Filtered media (non-admin):', clientMediaData);

      // Build client-media relationship
      const clientsWithMedia: ClientWithMedia[] = filteredClients.map((client) => {
        const clientMedia = (clientMediaData || []).filter((m) => m.client_id === client.id);
        console.log(`Client ${client.email}: ${clientMedia.length} media items`);
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

      console.log('Final clients with media:', clientsWithMedia);
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

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading clients...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl md:text-3xl font-semibold text-gray-900">Client Management</h1>
        <p className="text-sm md:text-base text-gray-500 mt-1">Review and approve media uploaded by clients</p>
      </div>

      {/* Stats Cards - Horizontal Scroll */}
      <div className="overflow-x-auto scrollbar-hide">
        <div className="flex gap-3 md:gap-4 pb-2 min-w-max md:min-w-0 md:grid md:grid-cols-4">
          {/* Total Clients */}
          <div className="bg-blue-50 rounded-2xl p-4 md:p-6 border border-gray-100 flex-shrink-0 w-64 md:w-auto">
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <p className="text-xs md:text-sm font-medium text-gray-600">Total Clients</p>
                <p className="text-2xl md:text-3xl font-bold text-blue-600 mt-2">{clients.length}</p>
              </div>
              <Users className="w-6 h-6 md:w-8 md:h-8 text-blue-500 opacity-20" />
            </div>
          </div>

          {/* Pending Review */}
          <div className="bg-yellow-50 rounded-2xl p-4 md:p-6 border border-gray-100 flex-shrink-0 w-64 md:w-auto">
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <p className="text-xs md:text-sm font-medium text-gray-600">Pending Review</p>
                <p className="text-2xl md:text-3xl font-bold text-yellow-600 mt-2">{clients.reduce((sum, c) => sum + c.pending_count, 0)}</p>
              </div>
              <Clock className="w-6 h-6 md:w-8 md:h-8 text-yellow-500 opacity-20" />
            </div>
          </div>

          {/* Approved */}
          <div className="bg-green-50 rounded-2xl p-4 md:p-6 border border-gray-100 flex-shrink-0 w-64 md:w-auto">
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <p className="text-xs md:text-sm font-medium text-gray-600">Approved</p>
                <p className="text-2xl md:text-3xl font-bold text-green-600 mt-2">{clients.reduce((sum, c) => sum + c.approved_count, 0)}</p>
              </div>
              <CheckCircle2 className="w-6 h-6 md:w-8 md:h-8 text-green-500 opacity-20" />
            </div>
          </div>

          {/* Rejected */}
          <div className="bg-red-50 rounded-2xl p-4 md:p-6 border border-gray-100 flex-shrink-0 w-64 md:w-auto">
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <p className="text-xs md:text-sm font-medium text-gray-600">Rejected</p>
                <p className="text-2xl md:text-3xl font-bold text-red-600 mt-2">{clients.reduce((sum, c) => sum + c.rejected_count, 0)}</p>
              </div>
              <XCircle className="w-6 h-6 md:w-8 md:h-8 text-red-500 opacity-20" />
            </div>
          </div>
        </div>
      </div>

      {/* Search and Filter */}
      <div className="flex flex-col md:flex-row gap-4">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
          <Input
            placeholder="Search by email or name..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>

        <div className="flex gap-2">
          <button
            onClick={() => setFilterStatus('all')}
            className={`px-4 py-2 rounded-lg font-medium transition-colors ${
              filterStatus === 'all'
                ? 'bg-blue-600 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            All
          </button>
          <button
            onClick={() => setFilterStatus('pending')}
            className={`px-4 py-2 rounded-lg font-medium transition-colors ${
              filterStatus === 'pending'
                ? 'bg-yellow-600 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            Pending
          </button>
          <button
            onClick={() => setFilterStatus('approved')}
            className={`px-4 py-2 rounded-lg font-medium transition-colors ${
              filterStatus === 'approved'
                ? 'bg-green-600 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            Approved
          </button>
          <button
            onClick={() => setFilterStatus('rejected')}
            className={`px-4 py-2 rounded-lg font-medium transition-colors ${
              filterStatus === 'rejected'
                ? 'bg-red-600 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            Rejected
          </button>
        </div>
      </div>

      {/* Clients List */}
      <div className="space-y-4">
        {filteredClients.length === 0 ? (
          <Card>
            <CardContent className="pt-6">
              <div className="text-center py-12">
                <Users className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-600">No clients found</p>
              </div>
            </CardContent>
          </Card>
        ) : (
          filteredClients.map((client) => {
            const isExpanded = expandedClientId === client.id;
            const clientMediaFiltered = filteredMediaByStatus(client.media_items);

            return (
              <Card key={client.id}>
                <div
                  className="p-4 cursor-pointer hover:bg-gray-50 transition-colors"
                  onClick={() => setExpandedClientId(isExpanded ? null : client.id)}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-4 flex-1">
                      <div className="flex-shrink-0">
                        <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                          <Users className="w-6 h-6 text-blue-600" />
                        </div>
                      </div>

                      <div className="flex-1">
                        <h3 className="font-semibold text-gray-900">{client.name || client.email}</h3>
                        <p className="text-sm text-gray-600">{client.email}</p>
                      </div>

                      <div className="flex items-center space-x-4">
                        <div className="text-right">
                          <p className="text-sm font-medium text-gray-900">{client.total_uploads}</p>
                          <p className="text-xs text-gray-600">uploads</p>
                        </div>

                        {client.pending_count > 0 && (
                          <div className="bg-yellow-50 px-3 py-1 rounded-full">
                            <p className="text-sm font-medium text-yellow-700">{client.pending_count} pending</p>
                          </div>
                        )}

                        {client.approved_count > 0 && (
                          <div className="bg-green-50 px-3 py-1 rounded-full">
                            <p className="text-sm font-medium text-green-700">{client.approved_count} approved</p>
                          </div>
                        )}

                        {client.rejected_count > 0 && (
                          <div className="bg-red-50 px-3 py-1 rounded-full">
                            <p className="text-sm font-medium text-red-700">{client.rejected_count} rejected</p>
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="flex-shrink-0 ml-4">
                      {isExpanded ? (
                        <ChevronUp className="w-5 h-5 text-gray-400" />
                      ) : (
                        <ChevronDown className="w-5 h-5 text-gray-400" />
                      )}
                    </div>
                  </div>
                </div>

                {isExpanded && (
                  <div className="border-t border-gray-200 p-4 bg-gray-50">
                    {clientMediaFiltered.length === 0 ? (
                      <p className="text-center text-gray-600 py-8">No media to review</p>
                    ) : (
                      <div className="space-y-4">
                        {clientMediaFiltered.map((media) => (
                          <div
                            key={media.id}
                            className="bg-white rounded-lg p-4 border border-gray-200 hover:border-gray-300 transition-colors"
                          >
                            <div className="flex items-start space-x-4">
                              {/* Thumbnail */}
                              <div className="w-20 h-20 flex-shrink-0 bg-gray-100 rounded overflow-hidden">
                                {media.file_type === 'image' ? (
                                  <img
                                    src={media.file_url}
                                    alt={media.title}
                                    className="w-full h-full object-cover"
                                  />
                                ) : (
                                  <video src={media.file_url} className="w-full h-full object-cover" />
                                )}
                              </div>

                              <div className="flex-1 min-w-0">
                                <div className="flex items-start justify-between mb-2">
                                  <div>
                                    <h4 className="font-semibold text-gray-900 truncate">{media.title}</h4>
                                    <p className="text-sm text-gray-600">{media.file_type}</p>
                                  </div>

                                  <div className="flex-shrink-0 ml-2">
                                    {media.status === 'pending' && (
                                      <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-yellow-50 text-yellow-700">
                                        <Clock className="w-4 h-4 mr-1" />
                                        Pending
                                      </span>
                                    )}
                                    {media.status === 'approved' && (
                                      <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-green-50 text-green-700">
                                        <CheckCircle2 className="w-4 h-4 mr-1" />
                                        Approved
                                      </span>
                                    )}
                                    {media.status === 'rejected' && (
                                      <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-red-50 text-red-700">
                                        <XCircle className="w-4 h-4 mr-1" />
                                        Rejected
                                      </span>
                                    )}
                                  </div>
                                </div>

                                {media.description && (
                                  <p className="text-sm text-gray-600 mb-2 line-clamp-2">{media.description}</p>
                                )}

                                {media.admin_notes && (
                                  <div className="mb-2 p-2 bg-blue-50 rounded border border-blue-200">
                                    <p className="text-xs font-medium text-blue-900 mb-1">Admin Notes:</p>
                                    <p className="text-xs text-blue-800">{media.admin_notes}</p>
                                  </div>
                                )}

                                <p className="text-xs text-gray-500">
                                  {new Date(media.created_at).toLocaleDateString()} at{' '}
                                  {new Date(media.created_at).toLocaleTimeString()}
                                </p>
                              </div>

                              {/* Actions */}
                              {media.status === 'pending' && (
                                <div className="flex-shrink-0 flex space-x-2">
                                  <Button
                                    onClick={() => setSelectedMedia(media)}
                                    variant="outline"
                                    size="sm"
                                    className="text-blue-600 border-blue-600 hover:bg-blue-50"
                                  >
                                    <Eye className="w-4 h-4 mr-1" />
                                    Review
                                  </Button>
                                </div>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </Card>
            );
          })
        )}
      </div>

      {/* Review Modal */}
      {selectedMedia && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <Card className="w-full max-w-2xl max-h-screen overflow-y-auto">
            <CardHeader>
              <CardTitle>Review Media - {selectedMedia.title}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Media Preview */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Preview</label>
                {selectedMedia.file_type === 'image' ? (
                  <img
                    src={selectedMedia.file_url}
                    alt={selectedMedia.title}
                    className="w-full h-auto rounded-lg border border-gray-200"
                  />
                ) : (
                  <video
                    src={selectedMedia.file_url}
                    controls
                    className="w-full rounded-lg border border-gray-200"
                  />
                )}
              </div>

              {/* Details */}
              <div className="space-y-2">
                <div>
                  <label className="block text-sm font-medium text-gray-700">Title</label>
                  <p className="text-gray-900">{selectedMedia.title}</p>
                </div>
                {selectedMedia.description && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Description</label>
                    <p className="text-gray-600">{selectedMedia.description}</p>
                  </div>
                )}
              </div>

              {/* Admin Notes */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Admin Notes</label>
                <Textarea
                  value={reviewNotes}
                  onChange={(e) => setReviewNotes(e.target.value)}
                  placeholder="Add notes for approval or rejection reason..."
                  rows={4}
                />
              </div>

              {/* Action Buttons */}
              <div className="flex gap-3 justify-end">
                <Button
                  variant="outline"
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
                  className="bg-red-600 hover:bg-red-700"
                >
                  <ThumbsDown className="w-4 h-4 mr-2" />
                  Reject
                </Button>

                <Button
                  onClick={() => handleApproveMedia(selectedMedia)}
                  className="bg-green-600 hover:bg-green-700"
                >
                  <ThumbsUp className="w-4 h-4 mr-2" />
                  Approve
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}

export default Clients;
