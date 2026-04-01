import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { MediaCard } from '@/components/MediaCard';
import { MediaForm } from '@/components/MediaForm';
import {
  Plus,
  Upload,
  RefreshCw,
  Video,
  Check,
  X,
  AlertCircle,
  Image as ImageIcon,
  CheckCircle2,
  LayoutGrid,
  FileVideo
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
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
  // --- STATS COMPONENT ---
  interface StatCardProps {
    title: string;
    value: number;
    icon: LucideIcon;
    colorClass: string;
    bgClass: string;
  }

  const StatCard = ({ title, value, icon: Icon, colorClass, bgClass }: StatCardProps) => (
    <div className="bg-white rounded-xl p-5 border border-gray-100 shadow-sm hover:shadow-md transition-shadow duration-200 flex-shrink-0 w-64 md:w-auto">
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <p className="text-sm font-medium text-gray-500 mb-1">{title}</p>
          <h4 className="text-2xl font-bold text-gray-900 tracking-tight">{value}</h4>
        </div>
        <div className={`p-2 rounded-lg ${bgClass}`}>
          <Icon className={`w-5 h-5 ${colorClass}`} />
        </div>
      </div>
    </div>
  );

  if (showForm) {
    return (
      <div className="max-w-4xl mx-auto py-6">
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
      <div className="max-w-3xl mx-auto py-6">
        <div className="mb-6 flex items-center justify-between">
          <h2 className="text-2xl font-bold text-gray-900 tracking-tight">Review Submission</h2>
          <Button
            variant="ghost"
            onClick={() => {
              setReviewingMedia(null);
              setReviewNotes('');
            }}
          >
            ← Back to Library
          </Button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Left Column: Media Preview */}
          <div className="md:col-span-2 space-y-4">
            <Card className="overflow-hidden border-gray-200 shadow-sm">
              <div className="bg-gray-50 aspect-video flex items-center justify-center p-2 relative">
                {reviewingMedia.file_type === 'image' ? (
                  <img
                    src={reviewingMedia.file_url}
                    alt={reviewingMedia.title}
                    className="w-full h-full object-contain rounded-md"
                  />
                ) : (
                  <video
                    src={reviewingMedia.file_url}
                    controls
                    className="w-full h-full object-contain rounded-md"
                  />
                )}
              </div>
            </Card>
            <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
              <h3 className="text-lg font-semibold text-gray-900 mb-1">{reviewingMedia.title}</h3>
              {reviewingMedia.description && (
                <p className="text-gray-600 mb-4">{reviewingMedia.description}</p>
              )}
              <div className="grid grid-cols-2 gap-4 pt-4 border-t border-gray-100">
                <div>
                  <p className="text-xs font-medium text-gray-400 uppercase tracking-wider">File Name</p>
                  <p className="text-sm font-medium text-gray-700 truncate">{reviewingMedia.file_name}</p>
                </div>
                <div>
                  <p className="text-xs font-medium text-gray-400 uppercase tracking-wider">Size</p>
                  <p className="text-sm font-medium text-gray-700">{formatFileSize(reviewingMedia.file_size || 0)}</p>
                </div>
              </div>
            </div>
          </div>

          {/* Right Column: Actions */}
          <div className="space-y-6">
            <Card className="border-gray-200 shadow-sm h-full">
              <CardContent className="p-6 space-y-6">
                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-700">
                    Review Notes <span className="text-gray-400 font-normal">(Optional)</span>
                  </label>
                  <Textarea
                    value={reviewNotes}
                    onChange={(e) => setReviewNotes(e.target.value)}
                    placeholder="Add context for approval or rejection..."
                    className="resize-none min-h-[120px] bg-gray-50 border-gray-200 focus:bg-white transition-colors"
                  />
                </div>

                <div className="space-y-3 pt-2">
                  <Button
                    onClick={() => handleApproveMedia(reviewingMedia)}
                    className="w-full bg-emerald-600 hover:bg-emerald-700 text-white shadow-sm"
                  >
                    <Check className="w-4 h-4 mr-2" />
                    Approve Media
                  </Button>
                  <Button
                    onClick={() => handleRejectMedia(reviewingMedia)}
                    variant="outline"
                    className="w-full text-red-600 border-red-200 hover:bg-red-50 hover:text-red-700 hover:border-red-300"
                  >
                    <X className="w-4 h-4 mr-2" />
                    Reject Media
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 tracking-tight">Media Library</h1>
          <p className="text-gray-500 mt-1">Manage content and review client submissions.</p>
        </div>
        <div className="flex items-center space-x-3">
          <Button
            variant="outline"
            onClick={loadMedia}
            size="icon"
            className="rounded-full h-10 w-10 border-gray-200 hover:bg-gray-50 text-gray-500"
            title="Refresh"
          >
            <RefreshCw className="h-4 w-4" />
          </Button>
          <Button
            onClick={handleCreateNew}
            className="flex items-center space-x-2 rounded-full px-5 shadow-sm bg-gray-900 hover:bg-gray-800 text-white"
          >
            <Plus className="h-4 w-4" />
            <span>Upload Media</span>
          </Button>
        </div>
      </div>

      {/* Stats Cards - Horizontal Scroll */}
      <div className="overflow-x-auto pb-2 scrollbar-hide">
        <div className="flex gap-4 min-w-max md:min-w-0 md:grid md:grid-cols-4">
          <StatCard
            title="Total Files"
            value={media.length}
            icon={LayoutGrid}
            bgClass="bg-blue-50"
            colorClass="text-blue-600"
          />
          <StatCard
            title="Images"
            value={media.filter(m => m.file_type === 'image').length}
            icon={ImageIcon}
            bgClass="bg-purple-50"
            colorClass="text-purple-600"
          />
          <StatCard
            title="Videos"
            value={media.filter(m => m.file_type === 'video').length}
            icon={FileVideo}
            bgClass="bg-indigo-50"
            colorClass="text-indigo-600"
          />
          <StatCard
            title="Approved"
            value={media.filter(m => m.status === 'approved').length}
            icon={CheckCircle2}
            bgClass="bg-emerald-50"
            colorClass="text-emerald-600"
          />
        </div>
      </div>

      {/* Media Grid */}
      {loading ? (
        <div className="flex items-center justify-center py-24">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
        </div>
      ) : media.length === 0 ? (
        <Card className="border-dashed border-2 border-gray-200 bg-gray-50/50">
          <CardContent className="text-center py-20">
            <div className="w-16 h-16 bg-white rounded-full flex items-center justify-center mx-auto mb-4 shadow-sm border border-gray-100">
              <Upload className="h-8 w-8 text-gray-400" />
            </div>
            <h3 className="text-xl font-semibold text-gray-900 mb-2">
              No media files yet
            </h3>
            <p className="text-gray-500 mb-6 max-w-sm mx-auto">
              Upload your first image or video to get started with your content library.
            </p>
            <Button onClick={handleCreateNew} variant="outline" className="border-gray-300">
              <Plus className="h-4 w-4 mr-2" />
              Upload Media
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-12">

          {/* Pending Client Media - Highest Priority */}
          {getPendingMedia().length > 0 && (
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <span className="relative flex h-3 w-3">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-3 w-3 bg-amber-500"></span>
                </span>
                <h2 className="text-lg font-semibold text-gray-900">Pending Reviews</h2>
                <span className="px-2 py-0.5 rounded-full bg-gray-100 text-xs font-medium text-gray-600">
                  {getPendingMedia().length}
                </span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {getPendingMedia().map((mediaItem) => (
                  <div
                    key={mediaItem.id}
                    className="group relative bg-white rounded-xl border border-amber-200 shadow-sm hover:shadow-md transition-all duration-200 overflow-hidden cursor-pointer"
                    onClick={() => setReviewingMedia(mediaItem)}
                  >
                    {/* Badge */}
                    <div className="absolute top-3 left-3 z-10 bg-white/90 backdrop-blur-sm px-2 py-1 rounded-md text-xs font-medium text-amber-700 border border-amber-100 shadow-sm flex items-center gap-1">
                      <AlertCircle className="w-3 h-3" />
                      Needs Review
                    </div>

                    <div className="aspect-video bg-gray-100 relative">
                      {mediaItem.file_type === 'image' ? (
                        <img
                          src={mediaItem.file_url}
                          alt={mediaItem.title}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center bg-gray-900 group-hover:bg-gray-800 transition-colors">
                          <Video className="w-10 h-10 text-white opacity-70" />
                        </div>
                      )}

                      {/* Hover Overlay */}
                      <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-all flex items-center justify-center">
                        <span className="opacity-0 group-hover:opacity-100 transform translate-y-2 group-hover:translate-y-0 transition-all bg-white text-gray-900 px-4 py-2 rounded-full text-sm font-medium shadow-lg">
                          Review Now
                        </span>
                      </div>
                    </div>

                    <div className="p-4">
                      <h3 className="font-semibold text-gray-900 truncate pr-4">
                        {mediaItem.title}
                      </h3>
                      <div className="flex items-center justify-between mt-2 text-xs text-gray-500">
                        <span className="truncate max-w-[150px]">{mediaItem.file_name}</span>
                        <span>{formatFileSize(mediaItem.file_size || 0)}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Admin Uploaded Media */}
          {media.filter(m => !m.client_id).length > 0 && (
            <div className="space-y-4">
              <div className="flex items-center gap-2 pb-2 border-b border-gray-100">
                <h2 className="text-lg font-semibold text-gray-900">Admin Uploads</h2>
                <span className="text-gray-400 text-sm">/ {media.filter(m => !m.client_id).length}</span>
              </div>
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
            <div className="space-y-4">
              <div className="flex items-center gap-2 pb-2 border-b border-gray-100">
                <h2 className="text-lg font-semibold text-gray-900">Approved Client Media</h2>
                <CheckCircle2 className="w-4 h-4 text-emerald-500" />
              </div>
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
            <div className="space-y-4">
              <div className="flex items-center gap-2 pb-2 border-b border-gray-100">
                <h2 className="text-lg font-semibold text-gray-900">Rejected</h2>
                <span className="text-gray-400 text-sm">/ {getRejectedClientMedia().length}</span>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 opacity-80 hover:opacity-100 transition-opacity">
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