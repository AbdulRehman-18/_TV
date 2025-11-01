import { useState } from 'react';
import { supabase, MEDIA_BUCKET } from '@/lib/supabase';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
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
      // Delete from storage
      const filePath = media.file_url.split('/media/').pop();
      if (filePath) {
        await supabase.storage.from(MEDIA_BUCKET).remove([filePath]);
      }

      // Delete from database
      const { error } = await supabase.from('media').delete().eq('id', media.id);

      if (error) throw error;

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
          <div className="flex items-center space-x-1 bg-yellow-100 text-yellow-800 px-3 py-1 rounded-full text-xs font-medium">
            <Clock className="w-3 h-3" />
            <span>Pending Review</span>
          </div>
        );
      case 'approved':
        return (
          <div className="flex items-center space-x-1 bg-green-100 text-green-800 px-3 py-1 rounded-full text-xs font-medium">
            <CheckCircle className="w-3 h-3" />
            <span>Approved</span>
          </div>
        );
      case 'rejected':
        return (
          <div className="flex items-center space-x-1 bg-red-100 text-red-800 px-3 py-1 rounded-full text-xs font-medium">
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
      {/* Thumbnail */}
      <div className="relative bg-gray-200 h-48 overflow-hidden">
        {media.file_type === 'image' ? (
          <img
            src={media.file_url}
            alt={media.title}
            className="w-full h-full object-cover hover:scale-105 transition-transform duration-300"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center bg-gray-900">
            <Play className="w-12 h-12 text-white fill-white" />
          </div>
        )}

        {/* Status Badge */}
        <div className="absolute top-2 right-2">
          {getStatusBadge()}
        </div>

        {/* File Type Icon */}
        <div className="absolute top-2 left-2">
          {media.file_type === 'image' ? (
            <div className="bg-white rounded-full p-2">
              <ImageIcon className="w-4 h-4 text-gray-700" />
            </div>
          ) : (
            <div className="bg-white rounded-full p-2">
              <Play className="w-4 h-4 text-gray-700 fill-gray-700" />
            </div>
          )}
        </div>
      </div>

      <CardContent className="p-4">
        {/* Title */}
        <h3 className="text-sm font-semibold text-gray-900 truncate mb-1">
          {media.title}
        </h3>

        {/* Description */}
        {media.description && (
          <p className="text-xs text-gray-600 line-clamp-2 mb-3">
            {media.description}
          </p>
        )}

        {/* File Info */}
        <div className="text-xs text-gray-500 space-y-1 mb-3">
          <p>File: {media.file_name}</p>
          <p>Size: {formatFileSize(media.file_size || 0)}</p>
          <p>Uploaded: {formatDate(media.created_at)}</p>
        </div>

        {/* Admin Notes */}
        {media.status === 'rejected' && media.admin_notes && (
          <div className="bg-red-50 border border-red-200 rounded p-2 mb-3">
            <p className="text-xs font-medium text-red-800 mb-1">Rejection Reason:</p>
            <p className="text-xs text-red-700">{media.admin_notes}</p>
          </div>
        )}

        {media.status === 'approved' && media.admin_notes && (
          <div className="bg-green-50 border border-green-200 rounded p-2 mb-3">
            <p className="text-xs font-medium text-green-800 mb-1">Admin Note:</p>
            <p className="text-xs text-green-700">{media.admin_notes}</p>
          </div>
        )}

        {/* Actions */}
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => window.open(media.file_url, '_blank')}
            className="flex-1 text-xs"
          >
            View
          </Button>

          {showDeleteConfirm ? (
            <>
              <Button
                variant="destructive"
                size="sm"
                onClick={handleDelete}
                disabled={isDeleting}
                className="flex-1 text-xs"
              >
                {isDeleting ? 'Deleting...' : 'Confirm'}
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowDeleteConfirm(false)}
                className="flex-1 text-xs"
              >
                Cancel
              </Button>
            </>
          ) : (
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowDeleteConfirm(true)}
              className="flex-1 text-xs text-red-600 hover:text-red-700 hover:bg-red-50"
            >
              <Trash2 className="w-3 h-3" />
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
