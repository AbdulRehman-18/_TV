import { supabase } from '@/lib/supabase';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { Edit, Trash2, Image as ImageIcon, Video, FileText, Play } from 'lucide-react';
import { Media } from '@/types';

interface MediaCardProps {
  media: Media;
  onEdit: (media: Media) => void;
  onDelete: (id: string) => void;
  onToggleActive: (id: string, isActive: boolean) => void;
}

export function MediaCard({
  media,
  onEdit,
  onDelete,
  onToggleActive
}: MediaCardProps) {
  const handleToggleActive = async (checked: boolean) => {
    try {
      const { error } = await supabase
        .from('media')
        .update({ is_active: checked })
        .eq('id', media.id);

      if (error) throw error;

      onToggleActive(media.id, checked);

      try {
        const bc = new BroadcastChannel('tv-updates');
        const msg = { channel: 'media', action: 'update', payload: { id: media.id, is_active: checked } };
        console.debug('[MediaCard] broadcasting', msg);
        bc.postMessage(msg);
        bc.close();
      } catch {
        // ignore
      }
    } catch (error) {
      console.error('Error toggling media status:', error);
    }
  };

  const handleDelete = async () => {
    try {
      // Delete from storage first
      const { error: storageError } = await supabase.storage
        .from('media')
        .remove([media.file_name]);

      if (storageError) {
        console.error('Error deleting from storage:', storageError);
      }

      // Delete from database
      const { error: dbError } = await supabase
        .from('media')
        .delete()
        .eq('id', media.id);

      if (dbError) throw dbError;

      onDelete(media.id);

      try {
        const bc = new BroadcastChannel('tv-updates');
        const msg = { channel: 'media', action: 'delete', payload: { id: media.id } };
        console.debug('[MediaCard] broadcasting', msg);
        bc.postMessage(msg);
        bc.close();
      } catch {
        // ignore
      }
    } catch (error) {
      console.error('Error deleting media:', error);
    }
  };

  const formatFileSize = (bytes?: number) => {
    if (!bytes) return 'Unknown';
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(1024));
    return Math.round(bytes / Math.pow(1024, i) * 100) / 100 + ' ' + sizes[i];
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

  return (
    <Card className={`transition-all duration-200 ${
      media.is_active
        ? 'border-blue-200 bg-blue-50/30'
        : 'border-gray-200 bg-gray-50/30'
    }`}>
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <CardTitle className="text-lg font-semibold line-clamp-2 flex items-center space-x-2">
            {media.file_type === 'image' ? (
              <ImageIcon className="h-5 w-5 text-blue-600" />
            ) : (
              <Video className="h-5 w-5 text-red-600" />
            )}
            <span>{media.title}</span>
          </CardTitle>
          <div className="flex items-center space-x-2 ml-4">
            <Switch
              checked={media.is_active}
              onCheckedChange={handleToggleActive}
            />
            <span className={`text-xs px-2 py-1 rounded-full ${
              media.is_active
                ? 'bg-blue-100 text-blue-800'
                : 'bg-gray-100 text-gray-600'
            }`}>
              {media.is_active ? 'Active' : 'Inactive'}
            </span>
          </div>
        </div>
        <p className="text-sm text-gray-500">
          Uploaded: {formatDate(media.created_at)}
        </p>
      </CardHeader>

      <CardContent className="pt-0">
        {/* Media Preview */}
        <div className="mb-4">
          {media.file_type === 'image' ? (
            <div className="relative aspect-video bg-gray-100 rounded-lg overflow-hidden">
              <img
                src={media.file_url}
                alt={media.title}
                className="w-full h-full object-cover"
                onError={(e) => {
                  e.currentTarget.src = '/placeholder-image.png';
                }}
              />
            </div>
          ) : (
            <div className="relative aspect-video bg-gray-900 rounded-lg overflow-hidden flex items-center justify-center">
              <video
                src={media.file_url}
                className="w-full h-full object-cover"
                onError={(e) => {
                  e.currentTarget.style.display = 'none';
                  e.currentTarget.nextElementSibling!.classList.remove('hidden');
                }}
              />
              <div className="absolute inset-0 flex items-center justify-center bg-gray-900 bg-opacity-75 hidden">
                <div className="text-center text-white">
                  <Video className="h-12 w-12 mx-auto mb-2" />
                  <p className="text-sm">Video preview not available</p>
                </div>
              </div>
              <div className="absolute bottom-2 right-2 bg-black bg-opacity-75 text-white px-2 py-1 rounded text-xs flex items-center space-x-1">
                <Play className="h-3 w-3" />
                <span>Video</span>
              </div>
            </div>
          )}
        </div>

        {/* Media Info */}
        <div className="space-y-2 text-sm text-gray-600">
          <div className="flex items-center space-x-2">
            <FileText className="h-4 w-4" />
            <span className="truncate">{media.file_name}</span>
          </div>
          <div className="flex items-center space-x-2">
            <span className="font-medium">Size:</span>
            <span>{formatFileSize(media.file_size)}</span>
          </div>
          <div className="flex items-center space-x-2">
            <span className="font-medium">Type:</span>
            <span className="capitalize">{media.file_type}</span>
          </div>
        </div>

        {media.description && (
          <p className="text-gray-700 text-sm mt-3 line-clamp-2">
            {media.description}
          </p>
        )}
      </CardContent>

      <CardFooter className="pt-0 flex justify-end space-x-2">
        <Button
          variant="outline"
          size="sm"
          onClick={() => onEdit(media)}
          className="flex items-center space-x-1"
        >
          <Edit className="h-4 w-4" />
          <span>Edit</span>
        </Button>

        <AlertDialog>
          <AlertDialogTrigger asChild>
            <Button variant="destructive" size="sm" className="flex items-center space-x-1">
              <Trash2 className="h-4 w-4" />
              <span>Delete</span>
            </Button>
          </AlertDialogTrigger>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Delete Media</AlertDialogTitle>
              <AlertDialogDescription>
                Are you sure you want to delete "{media.title}"? This will permanently remove the file from storage and cannot be undone.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction onClick={handleDelete} className="bg-red-600 hover:bg-red-700">
                Delete
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </CardFooter>
    </Card>
  );
}