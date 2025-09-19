import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { MediaCard } from '@/components/MediaCard';
import { MediaForm } from '@/components/MediaForm';
import { Plus, Upload, RefreshCw, Image as ImageIcon, Video } from 'lucide-react';
import { type Media } from '@/types';

export function Media() {
  const [media, setMedia] = useState<Media[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingMedia, setEditingMedia] = useState<Media | undefined>();

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

  // Helper functions for statistics
  const getImages = () => {
    return media.filter(m => m.file_type === 'image');
  };

  const getVideos = () => {
    return media.filter(m => m.file_type === 'video');
  };

  const getActiveMedia = () => {
    return media.filter(m => m.is_active);
  };

  const getTotalSize = () => {
    return media.reduce((total, m) => total + (m.file_size || 0), 0);
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

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Media Library</h1>
          <p className="text-gray-600">Upload and manage images and videos</p>
        </div>
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

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-6 text-center">
            <div className="text-2xl font-bold text-blue-600">
              {media.length}
            </div>
            <div className="text-sm text-blue-600">Total Files</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6 text-center">
            <div className="text-2xl font-bold text-green-600">
              {getImages().length}
            </div>
            <div className="text-sm text-green-600">Images</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6 text-center">
            <div className="text-2xl font-bold text-red-600">
              {getVideos().length}
            </div>
            <div className="text-sm text-red-600">Videos</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6 text-center">
            <div className="text-2xl font-bold text-purple-600">
              {formatFileSize(getTotalSize())}
            </div>
            <div className="text-sm text-purple-600">Total Size</div>
          </CardContent>
        </Card>
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
          {/* Active Media */}
          {getActiveMedia().length > 0 && (
            <div>
              <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                <Upload className="h-5 w-5 mr-2 text-green-600" />
                Active Media ({getActiveMedia().length})
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {getActiveMedia().map((mediaItem) => (
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

          {/* Images Section */}
          {getImages().filter(m => !m.is_active).length > 0 && (
            <div>
              <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                <ImageIcon className="h-5 w-5 mr-2 text-blue-600" />
                Inactive Images ({getImages().filter(m => !m.is_active).length})
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {getImages().filter(m => !m.is_active).map((mediaItem) => (
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

          {/* Videos Section */}
          {getVideos().filter(m => !m.is_active).length > 0 && (
            <div>
              <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                <Video className="h-5 w-5 mr-2 text-red-600" />
                Inactive Videos ({getVideos().filter(m => !m.is_active).length})
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {getVideos().filter(m => !m.is_active).map((mediaItem) => (
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
