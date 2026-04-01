import { api } from '@/lib/api';
import { Button } from '@/components/ui/button';
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
import { Edit, Trash2, Image as ImageIcon } from 'lucide-react';
import { Announcement } from '@/types';

interface AnnouncementCardProps {
  announcement: Announcement;
  onEdit: (announcement: Announcement) => void;
  onDelete: (id: string) => void;
  onToggleActive: (id: string, isActive: boolean) => void;
}

export function AnnouncementCard({
  announcement,
  onEdit,
  onDelete,
  onToggleActive
}: AnnouncementCardProps) {
  const [isActive, setIsActive] = useState(announcement.is_active);

  const handleToggleActive = async (checked: boolean) => {
    // Optimistic update
    setIsActive(checked);

    try {
      await api.patch(`/announcements/${announcement.id}/`, { is_active: checked });

      onToggleActive(announcement.id, checked);

      try {
        const bc = new BroadcastChannel('tv-updates');
        bc.postMessage({ channel: 'announcements', action: 'update', payload: { id: announcement.id, is_active: checked } });
        bc.close();
      } catch {
        // ignore
      }
    } catch (error) {
      console.error('Error toggling announcement status:', error);
      // Revert on error
      setIsActive(!checked);
    }
  };

  const handleDelete = async () => {
    try {
      await api.delete(`/announcements/${announcement.id}/`);

      onDelete(announcement.id);

      try {
        const bc = new BroadcastChannel('tv-updates');
        bc.postMessage({ channel: 'announcements', action: 'delete', payload: { id: announcement.id } });
        bc.close();
      } catch {
        // ignore
      }
    } catch (error) {
      console.error('Error deleting announcement:', error);
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

  return (
    <div className="group relative flex flex-col justify-between rounded-lg border border-gray-200 bg-white p-5 shadow-sm transition-all hover:shadow-md">
      <div className="space-y-3">
        <div className="flex items-start justify-between gap-4">
          <div className="space-y-1">
            <h3 className="font-semibold text-gray-900 line-clamp-1">
              {announcement.title}
            </h3>
            <div className="flex items-center gap-2 text-xs text-gray-500">
              <span className={`flex items-center gap-1.5 ${isActive ? "text-emerald-600 font-medium" : ""}`}>
                <span className={`w-1.5 h-1.5 rounded-full ${isActive ? "bg-emerald-500" : "bg-gray-300"}`} />
                {isActive ? 'Live' : 'Draft'}
              </span>
              <span>•</span>
              <span>{formatDate(announcement.created_at)}</span>
            </div>
          </div>
          <Switch
            checked={isActive}
            onCheckedChange={handleToggleActive}
            className="data-[state=checked]:bg-gray-900"
          />
        </div>

        <p className="text-sm text-gray-600 line-clamp-3 leading-relaxed">
          {announcement.body}
        </p>

        {announcement.image_url && (
          <div className="flex items-center gap-1.5 text-xs text-gray-400">
            <ImageIcon className="w-3.5 h-3.5" />
            <span>Image attached</span>
          </div>
        )}
      </div>

      <div className="mt-4 flex items-center justify-end gap-2 opacity-0 transition-opacity group-hover:opacity-100">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => onEdit(announcement)}
          className="h-8 w-8 text-gray-400 hover:text-gray-900 hover:bg-gray-100 rounded-full"
          title="Edit"
        >
          <Edit className="h-4 w-4" />
        </Button>

        <AlertDialog>
          <AlertDialogTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-full"
              title="Delete"
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </AlertDialogTrigger>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Delete Announcement</AlertDialogTitle>
              <AlertDialogDescription>
                Are you sure you want to delete "{announcement.title}"? This action cannot be undone.
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
      </div>
    </div>
  );
}