import { useState } from 'react';
import { supabase } from '@/lib/supabase';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Calendar, Trash2, Clock, CheckCircle, XCircle, AlertCircle, MapPin } from 'lucide-react';
import { Event } from '@/types';

interface ClientEventCardProps {
    event: Event;
    onDelete: (id: string) => void;
}

export function ClientEventCard({ event, onDelete }: ClientEventCardProps) {
    const [isDeleting, setIsDeleting] = useState(false);

    const handleDelete = async () => {
        if (!confirm('Are you sure you want to delete this event?')) return;

        setIsDeleting(true);
        try {
            const { error } = await supabase
                .from('events')
                .delete()
                .eq('id', event.id);

            if (error) throw error;
            onDelete(event.id);
        } catch (err) {
            console.error('Error deleting event:', err);
            alert('Failed to delete event');
        } finally {
            setIsDeleting(false);
        }
    };

    const getStatusBadge = () => {
        switch (event.status) {
            case 'pending':
                return (
                    <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium bg-amber-100 text-amber-800">
                        <Clock className="w-3 h-3" />
                        Pending Review
                    </span>
                );
            case 'approved':
                return (
                    <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium bg-emerald-100 text-emerald-800">
                        <CheckCircle className="w-3 h-3" />
                        Approved
                    </span>
                );
            case 'rejected':
                return (
                    <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium bg-red-100 text-red-800">
                        <XCircle className="w-3 h-3" />
                        Rejected
                    </span>
                );
            default:
                return null;
        }
    };

    const formatEventDate = (dateString: string) => {
        const date = new Date(dateString);
        return date.toLocaleDateString('en-US', {
            month: 'short',
            day: 'numeric',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    };

    return (
        <Card className="overflow-hidden hover:shadow-md transition-shadow">
            <CardContent className="p-0">
                {event.image_url && (
                    <div className="relative h-32 bg-gray-100">
                        <img
                            src={event.image_url}
                            alt={event.title}
                            className="w-full h-full object-cover"
                        />
                    </div>
                )}

                <div className="p-4 space-y-3">
                    <div className="flex items-start justify-between gap-2">
                        <div className="flex items-center gap-2 text-gray-600">
                            <Calendar className="w-4 h-4" />
                            <span className="text-xs">{formatEventDate(event.start_date)}</span>
                        </div>
                        {getStatusBadge()}
                    </div>

                    <div>
                        <h3 className="font-semibold text-gray-900 line-clamp-1">{event.title}</h3>
                        <p className="text-sm text-gray-600 mt-1 line-clamp-2">{event.description}</p>
                    </div>

                    {event.location && (
                        <div className="flex items-center gap-1 text-xs text-gray-500">
                            <MapPin className="w-3 h-3" />
                            {event.location}
                        </div>
                    )}

                    {event.status === 'rejected' && event.admin_notes && (
                        <div className="bg-red-50 border border-red-200 rounded p-2 text-xs text-red-700 flex items-start gap-2">
                            <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
                            <div>
                                <span className="font-medium">Rejection reason: </span>
                                {event.admin_notes}
                            </div>
                        </div>
                    )}

                    {event.schedule_start_date && event.schedule_end_date && (
                        <div className="text-xs text-gray-500">
                            Display scheduled: {new Date(event.schedule_start_date).toLocaleDateString()} - {new Date(event.schedule_end_date).toLocaleDateString()}
                        </div>
                    )}

                    <div className="flex justify-end pt-2 border-t">
                        <Button
                            variant="ghost"
                            size="sm"
                            onClick={handleDelete}
                            disabled={isDeleting}
                            className="text-red-600 hover:text-red-700 hover:bg-red-50"
                        >
                            <Trash2 className="w-4 h-4 mr-1" />
                            {isDeleting ? 'Deleting...' : 'Delete'}
                        </Button>
                    </div>
                </div>
            </CardContent>
        </Card>
    );
}
