import React from 'react';
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
  const handleToggleActive = async (checked: boolean) => {
    try {
      const { error } = await supabase
        .from('announcements')
        .update({ is_active: checked })
        .eq('id', announcement.id);

      if (error) throw error;
      
      onToggleActive(announcement.id, checked);
    } catch (error) {
      console.error('Error toggling announcement status:', error);
    }
  };

  const handleDelete = async () => {
    try {
      const { error } = await supabase
        .from('announcements')
        .delete()
        .eq('id', announcement.id);

      if (error) throw error;
      
      onDelete(announcement.id);
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
    <Card className={`transition-all duration-200 ${
      announcement.is_active 
        ? 'border-green-200 bg-green-50/30' 
        : 'border-gray-200 bg-gray-50/30'
    }`}>
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <CardTitle className="text-lg font-semibold line-clamp-2">
            {announcement.title}
          </CardTitle>
          <div className="flex items-center space-x-2 ml-4">
            <Switch
              checked={announcement.is_active}
              onCheckedChange={handleToggleActive}
            />
            <span className={`text-xs px-2 py-1 rounded-full ${
              announcement.is_active
                ? 'bg-green-100 text-green-800'
                : 'bg-gray-100 text-gray-600'
            }`}>
              {announcement.is_active ? 'Active' : 'Inactive'}
            </span>
          </div>
        </div>
        <p className="text-sm text-gray-500">
          Created: {formatDate(announcement.created_at)}
        </p>
      </CardHeader>

      <CardContent className="pt-0">
        <p className="text-gray-700 line-clamp-3 mb-4">
          {announcement.body}
        </p>
        
        {announcement.image_url && (
          <div className="flex items-center space-x-2 text-sm text-blue-600">
            <ImageIcon className="h-4 w-4" />
            <span>Image attached</span>
          </div>
        )}
      </CardContent>

      <CardFooter className="pt-0 flex justify-end space-x-2">
        <Button
          variant="outline"
          size="sm"
          onClick={() => onEdit(announcement)}
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
      </CardFooter>
    </Card>
  );
}