import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { MediaCard } from '@/components/MediaCard';
import { MediaForm } from '@/components/MediaForm';
import { Plus, Upload, RefreshCw, Video, Check, X, AlertCircle, Image, CheckCircle2 } from 'lucide-react';
import { type Media } from '@/types';

export function Media() {
  const [media, setMedia] = useState<Media[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingMedia, setEditingMedia] = useState<Media | undefined>();
  const [reviewingMedia, setReviewingMedia] = useState<Media | null>(null);
  const [reviewNotes, setReviewNotes] = useState('');

  useEffect(() => {
    loadMedia();
  }, []);

  const loadMedia = async () => {
    try {
      const { data, error } = await supabase
        .from('media')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;

      setMedia(data || []);
    } catch (error) {
      console.error('Error loading media:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateNew = () => {
    setEditingMedia(undefined);
    setShowForm(true);
  };

  const handleEdit = (mediaItem: Media) => {
    setEditingMedia(mediaItem);
    setShowForm(true);
  };

  const handleFormSubmit = (mediaItem: Media) => {
    if (editingMedia) {
      // Update existing media
      setMedia(prev => prev.map(m => m.id === mediaItem.id ? mediaItem : m));
    } else {
      // Add new media
      setMedia(prev => [mediaItem, ...prev]);
    }

    setShowForm(false);
    setEditingMedia(undefined);
  };

  const handleDelete = (id: string) => {
    setMedia(prev => prev.filter(m => m.id !== id));

    // Notify other tabs/windows that a media item was deleted
    try {
      const bc = new BroadcastChannel('tv-updates');
      bc.postMessage({ channel: 'media', action: 'delete', payload: { id } });
      bc.close();
    } catch {
      // ignore
    }
  };

  const handleToggleActive = (id: string, isActive: boolean) => {
    setMedia(prev => prev.map(m => m.id === id ? { ...m, is_active: isActive } : m));
  };

  const handleApproveMedia = async (mediaItem: Media) => {
    try {
      const { error } = await supabase
        .from('media')
        .update({
          status: 'approved',
          admin_notes: reviewNotes,
          is_active: true,
        })
        .eq('id', mediaItem.id);

      if (error) throw error;

      setMedia(prev =>
        prev.map(m =>
          m.id === mediaItem.id
            ? { ...m, status: 'approved', admin_notes: reviewNotes, is_active: true }
            : m
        )
      );

      setReviewingMedia(null);
      setReviewNotes('');
    } catch (error) {
      console.error('Error approving media:', error);
    }
  };

  const handleRejectMedia = async (mediaItem: Media) => {
    try {
      const { error } = await supabase
        .from('media')
        .update({
          status: 'rejected',
          admin_notes: reviewNotes,
        })
        .eq('id', mediaItem.id);

      if (error) throw error;

      setMedia(prev =>
        prev.map(m =>
          m.id === mediaItem.id
            ? { ...m, status: 'rejected', admin_notes: reviewNotes }
            : m
        )
      );

      setReviewingMedia(null);
      setReviewNotes('');
    } catch (error) {
      console.error('Error rejecting media:', error);
    }
  };

  // Helper functions for statistics
  const getPendingMedia = () => {
    return media.filter(m => m.status === 'pending');
  };

  const getApprovedClientMedia = () => {
    return media.filter(m => m.status === 'approved' && m.client_id);
  };

  const getRejectedClientMedia = () => {
    return media.filter(m => m.status === 'rejected' && m.client_id);
  };

  const formatFileSize = (bytes: number) => {
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(1024));
    return Math.round(bytes / Math.pow(1024, i) * 100) / 100 + ' ' + sizes[i];
  };

  if (showForm) {
    return (
      <div className="max-w-4xl">
        <MediaForm
          media={editingMedia}
          onSubmit={handleFormSubmit}
          onCancel={() => {
            setShowForm(false);
            setEditingMedia(undefined);
          }}
        />
      </div>
    );
  }

  if (reviewingMedia) {
    return (
      <div className="max-w-2xl">
        <Card>
          <CardContent className="p-6 space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-bold text-gray-900">Review Media Submission</h2>
              <Button
                variant="outline"
                onClick={() => {
                  setReviewingMedia(null);
                  setReviewNotes('');
                }}
              >
                ← Back
              </Button>
            </div>

            {/* Media Preview */}
            <div className="bg-gray-100 rounded-lg p-4">
              {reviewingMedia.file_type === 'image' ? (
                <img
                  src={reviewingMedia.file_url}
                  alt={reviewingMedia.title}
                  className="w-full max-h-96 object-contain rounded"
                />
              ) : (
                <video
                  src={reviewingMedia.file_url}
                  controls
                  className="w-full max-h-96 rounded"
                />
              )}
            </div>

            {/* Media Details */}
            <div className="space-y-2">
              <div>
                <p className="text-sm text-gray-600">Title</p>
                <p className="text-lg font-semibold text-gray-900">{reviewingMedia.title}</p>
              </div>
              {reviewingMedia.description && (
                <div>
                  <p className="text-sm text-gray-600">Description</p>
                  <p className="text-gray-900">{reviewingMedia.description}</p>
                </div>
              )}
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <p className="text-gray-600">File Name</p>
                  <p className="text-gray-900">{reviewingMedia.file_name}</p>
                </div>
                <div>
                  <p className="text-gray-600">File Size</p>
                  <p className="text-gray-900">{formatFileSize(reviewingMedia.file_size || 0)}</p>
                </div>
              </div>
            </div>

            {/* Review Notes */}
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700">
                Admin Notes (optional)
              </label>
              <Textarea
                value={reviewNotes}
                onChange={(e) => setReviewNotes(e.target.value)}
                placeholder="Add notes about approval or rejection..."
                rows={4}
              />
            </div>

            {/* Action Buttons */}
            <div className="flex gap-3">
              <Button
                onClick={() => handleApproveMedia(reviewingMedia)}
                className="flex-1 bg-green-600 hover:bg-green-700"
              >
                <Check className="w-4 h-4 mr-2" />
                Approve & Publish
              </Button>
              <Button
                onClick={() => handleRejectMedia(reviewingMedia)}
                variant="outline"
                className="flex-1 text-red-600 hover:text-red-700 hover:bg-red-50"
              >
                <X className="w-4 h-4 mr-2" />
                Reject
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl md:text-3xl font-semibold text-gray-900">Media Library</h1>
        <p className="text-sm md:text-base text-gray-500 mt-1">Upload, manage, and approve client media submissions</p>
      </div>

      {/* Stats Cards - Horizontal Scroll */}
      <div className="overflow-x-auto scrollbar-hide">
        <div className="flex gap-3 md:gap-4 pb-2 min-w-max md:min-w-0 md:grid md:grid-cols-4">
          {/* Total Files */}
          <div className="bg-blue-50 rounded-2xl p-4 md:p-6 border border-gray-100 flex-shrink-0 w-64 md:w-auto">
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <p className="text-xs md:text-sm font-medium text-gray-600">Total Files</p>
                <p className="text-2xl md:text-3xl font-bold text-blue-600 mt-2">{media.length}</p>
              </div>
              <Upload className="w-6 h-6 md:w-8 md:h-8 text-blue-500 opacity-20" />
            </div>
          </div>

          {/* Images */}
          <div className="bg-purple-50 rounded-2xl p-4 md:p-6 border border-gray-100 flex-shrink-0 w-64 md:w-auto">
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <p className="text-xs md:text-sm font-medium text-gray-600">Images</p>
                <p className="text-2xl md:text-3xl font-bold text-purple-600 mt-2">{media.filter(m => m.file_type === 'image').length}</p>
              </div>
              <Image className="w-6 h-6 md:w-8 md:h-8 text-purple-500 opacity-20" />
            </div>
          </div>

          {/* Videos */}
          <div className="bg-green-50 rounded-2xl p-4 md:p-6 border border-gray-100 flex-shrink-0 w-64 md:w-auto">
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <p className="text-xs md:text-sm font-medium text-gray-600">Videos</p>
                <p className="text-2xl md:text-3xl font-bold text-green-600 mt-2">{media.filter(m => m.file_type === 'video').length}</p>
              </div>
              <Video className="w-6 h-6 md:w-8 md:h-8 text-green-500 opacity-20" />
            </div>
          </div>

          {/* Approved */}
          <div className="bg-emerald-50 rounded-2xl p-4 md:p-6 border border-gray-100 flex-shrink-0 w-64 md:w-auto">
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <p className="text-xs md:text-sm font-medium text-gray-600">Approved</p>
                <p className="text-2xl md:text-3xl font-bold text-emerald-600 mt-2">{media.filter(m => m.status === 'approved').length}</p>
              </div>
              <CheckCircle2 className="w-6 h-6 md:w-8 md:h-8 text-emerald-500 opacity-20" />
            </div>
          </div>
        </div>
      </div>

      {/* Action Bar */}
      <div className="flex justify-between items-center">
        <span></span>
        <div className="flex items-center space-x-3">
          <Button
            variant="outline"
            onClick={loadMedia}
            size="icon"
            title="Refresh"
          >
            <RefreshCw className="h-4 w-4" />
          </Button>
          <Button onClick={handleCreateNew} className="flex items-center space-x-2">
            <Plus className="h-4 w-4" />
            <span>Upload Media</span>
          </Button>
        </div>
      </div>

      {/* Media Grid */}
      {loading ? (
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        </div>
      ) : media.length === 0 ? (
        <Card>
          <CardContent className="text-center py-12">
            <Upload className="mx-auto h-12 w-12 text-gray-400 mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              No media files yet
            </h3>
            <p className="text-gray-500 mb-4">
              Upload your first image or video to get started.
            </p>
            <Button onClick={handleCreateNew}>
              <Plus className="h-4 w-4 mr-2" />
              Upload Media
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-8">
          {/* Pending Client Media - Highest Priority */}
          {getPendingMedia().length > 0 && (
            <div>
              <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                <AlertCircle className="h-5 w-5 mr-2 text-yellow-600 animate-pulse" />
                Pending Client Submissions ({getPendingMedia().length})
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {getPendingMedia().map((mediaItem) => (
                  <Card key={mediaItem.id} className="overflow-hidden border-2 border-yellow-200 hover:shadow-lg transition-shadow">
                    <div className="bg-yellow-50 px-4 py-2">
                      <button
                        onClick={() => setReviewingMedia(mediaItem)}
                        className="w-full text-left text-sm font-medium text-yellow-900 hover:text-yellow-700"
                      >
                        Click to review →
                      </button>
                    </div>
                    <CardContent className="p-0">
                      {mediaItem.file_type === 'image' ? (
                        <img
                          src={mediaItem.file_url}
                          alt={mediaItem.title}
                          className="w-full h-40 object-cover"
                        />
                      ) : (
                        <div className="w-full h-40 bg-gray-900 flex items-center justify-center">
                          <Video className="w-12 h-12 text-white" />
                        </div>
                      )}
                      <div className="p-4">
                        <h3 className="font-semibold text-gray-900 truncate">
                          {mediaItem.title}
                        </h3>
                        <p className="text-xs text-gray-600 mt-1">
                          {mediaItem.file_name}
                        </p>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          )}

          {/* Admin Uploaded Media */}
          {media.filter(m => !m.client_id).length > 0 && (
            <div>
              <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                <Upload className="h-5 w-5 mr-2 text-blue-600" />
                Admin Media ({media.filter(m => !m.client_id).length})
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {media.filter(m => !m.client_id).map((mediaItem) => (
                  <MediaCard
                    key={mediaItem.id}
                    media={mediaItem}
                    onEdit={handleEdit}
                    onDelete={handleDelete}
                    onToggleActive={handleToggleActive}
                  />
                ))}
              </div>
            </div>
          )}

          {/* Approved Client Media */}
          {getApprovedClientMedia().length > 0 && (
            <div>
              <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                <Check className="h-5 w-5 mr-2 text-green-600" />
                Approved Client Media ({getApprovedClientMedia().length})
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {getApprovedClientMedia().map((mediaItem) => (
                  <MediaCard
                    key={mediaItem.id}
                    media={mediaItem}
                    onEdit={handleEdit}
                    onDelete={handleDelete}
                    onToggleActive={handleToggleActive}
                  />
                ))}
              </div>
            </div>
          )}

          {/* Rejected Client Media */}
          {getRejectedClientMedia().length > 0 && (
            <div>
              <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                <X className="h-5 w-5 mr-2 text-red-600" />
                Rejected Client Media ({getRejectedClientMedia().length})
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {getRejectedClientMedia().map((mediaItem) => (
                  <MediaCard
                    key={mediaItem.id}
                    media={mediaItem}
                    onEdit={handleEdit}
                    onDelete={handleDelete}
                    onToggleActive={handleToggleActive}
                  />
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
