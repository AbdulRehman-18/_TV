import { useState } from 'react';
import { api } from '@/lib/api';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Megaphone, Trash2, Clock, CheckCircle, XCircle, AlertCircle } from 'lucide-react';
import { Announcement } from '@/types';

interface ClientAnnouncementCardProps {
    announcement: Announcement;
    onDelete: (id: string) => void;
}

export function ClientAnnouncementCard({ announcement, onDelete }: ClientAnnouncementCardProps) {
    const [isDeleting, setIsDeleting] = useState(false);

    const handleDelete = async () => {
        if (!confirm('Are you sure you want to delete this announcement?')) return;

        setIsDeleting(true);
        try {
            await api.delete(`/announcements/${announcement.id}/`);
            onDelete(announcement.id);
        } catch (err) {
            console.error('Error deleting announcement:', err);
            alert('Failed to delete announcement');
        } finally {
            setIsDeleting(false);
        }
    };

    const getStatusBadge = () => {
        switch (announcement.status) {
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

    return (
        <Card className="overflow-hidden hover:shadow-md transition-shadow">
            <CardContent className="p-0">
                {announcement.image_url && (
                    <div className="relative h-32 bg-gray-100">
                        <img
                            src={announcement.image_url}
                            alt={announcement.title}
                            className="w-full h-full object-cover"
                        />
                    </div>
                )}

                <div className="p-4 space-y-3">
                    <div className="flex items-start justify-between gap-2">
                        <div className="flex items-center gap-2 text-gray-600">
                            <Megaphone className="w-4 h-4" />
                            <span className="text-xs">{new Date(announcement.created_at).toLocaleDateString()}</span>
                        </div>
                        {getStatusBadge()}
                    </div>

                    <div>
                        <h3 className="font-semibold text-gray-900 line-clamp-1">{announcement.title}</h3>
                        <p className="text-sm text-gray-600 mt-1 line-clamp-2">{announcement.body}</p>
                    </div>

                    {announcement.status === 'rejected' && announcement.admin_notes && (
                        <div className="bg-red-50 border border-red-200 rounded p-2 text-xs text-red-700 flex items-start gap-2">
                            <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
                            <div>
                                <span className="font-medium">Rejection reason: </span>
                                {announcement.admin_notes}
                            </div>
                        </div>
                    )}

                    {announcement.schedule_start_date && announcement.schedule_end_date && (
                        <div className="text-xs text-gray-500">
                            Scheduled: {new Date(announcement.schedule_start_date).toLocaleDateString()} - {new Date(announcement.schedule_end_date).toLocaleDateString()}
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
