import { useState } from 'react';
import { api } from '@/lib/api';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogTrigger } from '@/components/ui/dialog';
import { Media } from '@/types';
import { Trash2, AlertCircle, CheckCircle, Clock, Image as ImageIcon, Play } from 'lucide-react';

interface ClientMediaCardProps {
  media: Media;
  onDelete: (id: string) => void;
}

export function ClientMediaCard({ media, onDelete }: ClientMediaCardProps) {
  const [isDeleting, setIsDeleting] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  const handleDelete = async () => {
    setIsDeleting(true);
    try {
      await api.delete(`/media/${media.id}/`);

      onDelete(media.id);
    } catch (error) {
      console.error('Error deleting media:', error);
    } finally {
      setIsDeleting(false);
      setShowDeleteConfirm(false);
    }
  };

  const getStatusBadge = () => {
    const status = media.status || 'approved';
    switch (status) {
      case 'pending':
        return (
          <div className="inline-flex items-center gap-1 bg-amber-100 text-amber-800 px-2 py-1 rounded-full text-xs font-medium">
            <Clock className="w-3 h-3" />
            <span>Pending Review</span>
          </div>
        );
      case 'approved':
        return (
          <div className="inline-flex items-center gap-1 bg-emerald-100 text-emerald-800 px-2 py-1 rounded-full text-xs font-medium">
            <CheckCircle className="w-3 h-3" />
            <span>Approved</span>
          </div>
        );
      case 'rejected':
        return (
          <div className="inline-flex items-center gap-1 bg-red-100 text-red-800 px-2 py-1 rounded-full text-xs font-medium">
            <AlertCircle className="w-3 h-3" />
            <span>Rejected</span>
          </div>
        );
      default:
        return null;
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const formatFileSize = (bytes: number) => {
    if (!bytes) return '0 B';
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(1024));
    return Math.round((bytes / Math.pow(1024, i)) * 100) / 100 + ' ' + sizes[i];
  };

  return (
    <Card className="overflow-hidden hover:shadow-lg transition-shadow">
      <CardContent className="p-4">
        <div className="flex gap-4">
          {/* Thumbnail / Trigger */}
          <Dialog>
            <DialogTrigger asChild>
              <div className="w-24 h-24 flex-shrink-0 bg-gray-100 rounded-lg overflow-hidden border border-gray-200 cursor-pointer hover:ring-2 hover:ring-blue-500 transition-all flex items-center justify-center group relative">
                {media.file_type === 'image' ? (
                  <>
                    <img
                      src={media.file_url}
                      alt={media.title}
                      className="w-full h-full object-cover"
                    />
                    <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors flex items-center justify-center opacity-0 group-hover:opacity-100">
                      <ImageIcon className="w-6 h-6 text-white drop-shadow-md" />
                    </div>
                  </>
                ) : (
                  <Play className="w-8 h-8 text-gray-400" />
                )}
              </div>
            </DialogTrigger>
            <DialogContent className="max-w-4xl border-none shadow-none bg-transparent p-0">
              <div className="relative w-full flex justify-center items-center pointer-events-none">
                <div className="pointer-events-auto">
                    {media.file_type === 'image' ? (
                      <img
                        src={media.file_url}
                        alt={media.title}
                        className="max-h-[85vh] w-auto max-w-full rounded-lg shadow-2xl"
                      />
                    ) : (
                      <div className="bg-white p-6 rounded-lg text-center shadow-xl">
                        <Play className="w-12 h-12 text-gray-400 mx-auto mb-3" />
                        <p className="font-medium">Video preview not available</p>
                        <Button 
                          variant="link" 
                          onClick={() => window.open(media.file_url, '_blank')}
                          className="mt-2"
                        >
                          Open in new tab
                        </Button>
                      </div>
                    )}
                </div>
              </div>
            </DialogContent>
          </Dialog>

          {/* Details */}
          <div className="flex-1 min-w-0 flex flex-col justify-between h-full">
            <div>
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0">
                  <h3 className="text-sm font-semibold text-gray-900 truncate" title={media.title || media.file_name}>
                    {media.title || media.file_name}
                  </h3>
                  {media.description && (
                    <p className="text-xs text-gray-500 truncate mt-0.5" title={media.description}>
                      {media.description}
                    </p>
                  )}
                </div>
                <div className="flex-shrink-0">
                   {getStatusBadge()}
                </div>
              </div>

              <div className="flex items-center gap-3 mt-2 text-xs text-gray-400">
                <span>{media.file_type === 'image' ? 'Image' : 'Video'}</span>
                <span>•</span>
                <span>{formatFileSize(media.file_size || 0)}</span>
                <span>•</span>
                <span>{formatDate(media.created_at)}</span>
              </div>
            </div>

            <div className="space-y-2 mt-3">
              {/* Status Messages */}
              {media.status === 'rejected' && media.admin_notes && (
                <div className="bg-red-50 border border-red-200 rounded p-2 text-xs text-red-700 flex items-start gap-2">
                   <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
                   <div>
                      <span className="font-semibold">Rejected:</span> {media.admin_notes}
                   </div>
                </div>
              )}
              {media.schedule_start_date && (
                <div className="bg-blue-50 border border-blue-200 rounded p-2 text-xs text-blue-700 flex items-center gap-1.5">
                  <Clock className="w-3 h-3" />
                  <span>
                    Scheduled: {new Date(media.schedule_start_date).toLocaleDateString()}
                    {media.schedule_end_date && ` - ${new Date(media.schedule_end_date).toLocaleDateString()}`}
                  </span>
                </div>
              )}

              {/* Actions */}
              <div className="flex gap-2 justify-end pt-2 border-t">
                {showDeleteConfirm ? (
                  <>
                    <Button
                      variant="destructive"
                      size="sm"
                      onClick={handleDelete}
                      disabled={isDeleting}
                    >
                      {isDeleting ? 'Deleting...' : 'Confirm'}
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setShowDeleteConfirm(false)}
                    >
                      Cancel
                    </Button>
                  </>
                ) : (
                  <>
                   <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => window.open(media.file_url, '_blank')}
                      className="text-gray-600 hover:text-gray-900"
                    >
                      Download
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setShowDeleteConfirm(true)}
                      className="text-red-600 hover:text-red-700 hover:bg-red-50"
                    >
                      <Trash2 className="w-4 h-4 mr-1.5" />
                      Delete
                    </Button>
                  </>
                )}
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
