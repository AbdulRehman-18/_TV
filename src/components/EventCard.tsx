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
import { Edit, Trash2, Image as ImageIcon, MapPin, Calendar, Clock } from 'lucide-react';
import { Event } from '@/types';

interface EventCardProps {
  event: Event;
  onEdit: (event: Event) => void;
  onDelete: (id: string) => void;
  onToggleActive: (id: string, isActive: boolean) => void;
}

export function EventCard({
  event,
  onEdit,
  onDelete,
  onToggleActive
}: EventCardProps) {
  const handleToggleActive = async (checked: boolean) => {
    try {
      const { error } = await supabase
        .from('events')
        .update({ is_active: checked })
        .eq('id', event.id);

      if (error) throw error;

      onToggleActive(event.id, checked);

      try {
        const bc = new BroadcastChannel('tv-updates');
        const msg = { channel: 'events', action: 'update', payload: { id: event.id, is_active: checked } };
        console.debug('[EventCard] broadcasting', msg);
        bc.postMessage(msg);
        bc.close();
      } catch {
        // ignore
      }
    } catch (error) {
      console.error('Error toggling event status:', error);
    }
  };

  const handleDelete = async () => {
    try {
      const { error } = await supabase
        .from('events')
        .delete()
        .eq('id', event.id);

      if (error) throw error;

      onDelete(event.id);

      try {
        const bc = new BroadcastChannel('tv-updates');
        const msg = { channel: 'events', action: 'delete', payload: { id: event.id } };
        console.debug('[EventCard] broadcasting', msg);
        bc.postMessage(msg);
        bc.close();
      } catch {
        // ignore
      }
    } catch (error) {
      console.error('Error deleting event:', error);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  const formatTime = (dateString: string) => {
    return new Date(dateString).toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const isUpcoming = new Date(event.start_date) > new Date();
  const isOngoing = new Date(event.start_date) <= new Date() &&
                   (!event.end_date || new Date(event.end_date) >= new Date());

  return (
    <Card className={`transition-all duration-200 ${
      event.is_active
        ? isOngoing
          ? 'border-blue-200 bg-blue-50/30'
          : isUpcoming
            ? 'border-green-200 bg-green-50/30'
            : 'border-gray-200 bg-gray-50/30'
        : 'border-gray-200 bg-gray-50/30'
    }`}>
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <CardTitle className="text-lg font-semibold line-clamp-2">
            {event.title}
          </CardTitle>
          <div className="flex items-center space-x-2 ml-4">
            <Switch
              checked={event.is_active}
              onCheckedChange={handleToggleActive}
            />
            <span className={`text-xs px-2 py-1 rounded-full ${
              event.is_active
                ? isOngoing
                  ? 'bg-blue-100 text-blue-800'
                  : isUpcoming
                    ? 'bg-green-100 text-green-800'
                    : 'bg-gray-100 text-gray-600'
                : 'bg-gray-100 text-gray-600'
            }`}>
              {event.is_active
                ? isOngoing
                  ? 'Ongoing'
                  : isUpcoming
                    ? 'Upcoming'
                    : 'Past'
                : 'Inactive'}
            </span>
          </div>
        </div>
        <p className="text-sm text-gray-500">
          Created: {formatDate(event.created_at)}
        </p>
      </CardHeader>

      <CardContent className="pt-0">
        <p className="text-gray-700 line-clamp-3 mb-4">
          {event.description}
        </p>

        {/* Event Details */}
        <div className="space-y-2 mb-4">
          <div className="flex items-center space-x-2 text-sm text-gray-600">
            <Calendar className="h-4 w-4" />
            <span>{formatDate(event.start_date)}</span>
          </div>

          <div className="flex items-center space-x-2 text-sm text-gray-600">
            <Clock className="h-4 w-4" />
            <span>
              {formatTime(event.start_date)}
              {event.end_date && ` - ${formatTime(event.end_date)}`}
            </span>
          </div>

          {event.location && (
            <div className="flex items-center space-x-2 text-sm text-gray-600">
              <MapPin className="h-4 w-4" />
              <span>{event.location}</span>
            </div>
          )}
        </div>

        {event.image_url && (
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
          onClick={() => onEdit(event)}
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
              <AlertDialogTitle>Delete Event</AlertDialogTitle>
              <AlertDialogDescription>
                Are you sure you want to delete "{event.title}"? This action cannot be undone.
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