import { useState, useEffect } from 'react';
import { api } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { AnnouncementCard } from '@/components/AnnouncementCard';
import { AnnouncementForm } from '@/components/AnnouncementForm';
import { Plus, Megaphone, RefreshCw, CheckCircle2, Circle, MessageSquare, AlertCircle, Check, X } from 'lucide-react';
import { Announcement } from '@/types';

export function Announcements() {
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingAnnouncement, setEditingAnnouncement] = useState<Announcement | undefined>();
  const [reviewingAnnouncement, setReviewingAnnouncement] = useState<Announcement | null>(null);
  const [reviewNotes, setReviewNotes] = useState('');

  useEffect(() => {
    loadAnnouncements();
  }, []);

  const loadAnnouncements = async () => {
    try {
      const data = await api.get('/announcements/');

      setAnnouncements(data || []);
    } catch (error) {
      console.error('Error loading announcements:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateNew = () => {
    setEditingAnnouncement(undefined);
    setShowForm(true);
  };

  const handleEdit = (announcement: Announcement) => {
    setEditingAnnouncement(announcement);
    setShowForm(true);
  };

  const handleFormSubmit = (announcement: Announcement) => {
    if (editingAnnouncement) {
      setAnnouncements(prev =>
        prev.map(a => a.id === announcement.id ? announcement : a)
      );
    } else {
      setAnnouncements(prev => [announcement, ...prev]);
    }

    setShowForm(false);
    setEditingAnnouncement(undefined);
  };

  const handleDelete = (id: string) => {
    setAnnouncements(prev => prev.filter(a => a.id !== id));

    try {
      const bc = new BroadcastChannel('tv-updates');
      bc.postMessage({ channel: 'announcements', action: 'delete', payload: { id } });
      bc.close();
    } catch {
      // ignore
    }
  };

  const handleToggleActive = (id: string, isActive: boolean) => {
    setAnnouncements(prev =>
      prev.map(a => a.id === id ? { ...a, is_active: isActive } : a)
    );
  };

  const handleApprove = async (announcement: Announcement) => {
    try {
      await api.patch(`/announcements/${announcement.id}/`, {
        status: 'approved',
        admin_notes: reviewNotes,
        is_active: true,
      });

      setAnnouncements(prev =>
        prev.map(a =>
          a.id === announcement.id
            ? { ...a, status: 'approved', admin_notes: reviewNotes, is_active: true }
            : a
        )
      );

      setReviewingAnnouncement(null);
      setReviewNotes('');
    } catch (error) {
      console.error('Error approving announcement:', error);
    }
  };

  const handleReject = async (announcement: Announcement) => {
    try {
      await api.patch(`/announcements/${announcement.id}/`, {
        status: 'rejected',
        admin_notes: reviewNotes,
      });

      setAnnouncements(prev =>
        prev.map(a =>
          a.id === announcement.id
            ? { ...a, status: 'rejected', admin_notes: reviewNotes }
            : a
        )
      );

      setReviewingAnnouncement(null);
      setReviewNotes('');
    } catch (error) {
      console.error('Error rejecting announcement:', error);
    }
  };

  // Helper functions
  const getPendingAnnouncements = () => announcements.filter(a => a.status === 'pending');
  const getApprovedClientAnnouncements = () => announcements.filter(a => a.status === 'approved' && a.client_id);
  const getRejectedClientAnnouncements = () => announcements.filter(a => a.status === 'rejected' && a.client_id);
  const getAdminAnnouncements = () => announcements.filter(a => !a.client_id);

  if (showForm) {
    return (
      <div className="max-w-4xl">
        <AnnouncementForm
          announcement={editingAnnouncement}
          onSubmit={handleFormSubmit}
          onCancel={() => {
            setShowForm(false);
            setEditingAnnouncement(undefined);
          }}
        />
      </div>
    );
  }

  if (reviewingAnnouncement) {
    return (
      <div className="max-w-3xl mx-auto py-6">
        <div className="mb-6 flex items-center justify-between">
          <h2 className="text-2xl font-bold text-gray-900 tracking-tight">Review Announcement</h2>
          <Button
            variant="ghost"
            onClick={() => {
              setReviewingAnnouncement(null);
              setReviewNotes('');
            }}
          >
            ← Back to Announcements
          </Button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Left Column: Preview */}
          <div className="md:col-span-2 space-y-4">
            <Card className="overflow-hidden border-gray-200 shadow-sm">
              {reviewingAnnouncement.image_url && (
                <div className="bg-gray-50 aspect-video flex items-center justify-center p-2">
                  <img
                    src={reviewingAnnouncement.image_url}
                    alt={reviewingAnnouncement.title}
                    className="w-full h-full object-contain rounded-md"
                  />
                </div>
              )}
              <div className="p-6">
                <h3 className="text-xl font-semibold text-gray-900 mb-2">{reviewingAnnouncement.title}</h3>
                <p className="text-gray-600 whitespace-pre-wrap">{reviewingAnnouncement.body}</p>
                <div className="mt-4 pt-4 border-t border-gray-100 text-sm text-gray-500">
                  Submitted on {new Date(reviewingAnnouncement.created_at).toLocaleDateString()}
                </div>
              </div>
            </Card>
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
                    onClick={() => handleApprove(reviewingAnnouncement)}
                    className="w-full bg-emerald-600 hover:bg-emerald-700 text-white shadow-sm"
                  >
                    <Check className="w-4 h-4 mr-2" />
                    Approve Announcement
                  </Button>
                  <Button
                    onClick={() => handleReject(reviewingAnnouncement)}
                    variant="outline"
                    className="w-full text-red-600 border-red-200 hover:bg-red-50 hover:text-red-700 hover:border-red-300"
                  >
                    <X className="w-4 h-4 mr-2" />
                    Reject Announcement
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
    <div className="space-y-8 max-w-7xl mx-auto animate-in fade-in duration-500">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-gray-900">Announcements</h1>
          <p className="text-gray-500 mt-1">Manage announcements and review client submissions</p>
        </div>
        <div className="flex items-center gap-3">
          <Button
            variant="outline"
            onClick={loadAnnouncements}
            size="icon"
            title="Refresh"
            className="h-10 w-10 rounded-full border-gray-200 hover:bg-gray-50 hover:text-gray-900"
          >
            <RefreshCw className="h-4 w-4" />
          </Button>
          <Button
            onClick={handleCreateNew}
            className="h-10 rounded-full px-6 bg-gray-900 hover:bg-gray-800 text-white shadow-sm transition-all hover:shadow-md"
          >
            <Plus className="h-4 w-4 mr-2" />
            New Announcement
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
        <div className="bg-white rounded-xl p-6 border border-gray-100 shadow-sm hover:shadow-md transition-all duration-300">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-500">Total</p>
              <h3 className="text-3xl font-bold text-gray-900 mt-2 tracking-tight">{announcements.length}</h3>
            </div>
            <div className="p-3 rounded-full bg-blue-50 text-blue-600">
              <Megaphone className="w-5 h-5" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl p-6 border border-amber-200 shadow-sm hover:shadow-md transition-all duration-300">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-amber-600">Pending Review</p>
              <h3 className="text-3xl font-bold text-amber-600 mt-2 tracking-tight">{getPendingAnnouncements().length}</h3>
            </div>
            <div className="p-3 rounded-full bg-amber-50 text-amber-600">
              <AlertCircle className="w-5 h-5" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl p-6 border border-gray-100 shadow-sm hover:shadow-md transition-all duration-300">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-500">Active Now</p>
              <h3 className="text-3xl font-bold text-gray-900 mt-2 tracking-tight">{announcements.filter(a => a.is_active).length}</h3>
            </div>
            <div className="p-3 rounded-full bg-emerald-50 text-emerald-600">
              <CheckCircle2 className="w-5 h-5" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl p-6 border border-gray-100 shadow-sm hover:shadow-md transition-all duration-300">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-500">Inactive</p>
              <h3 className="text-3xl font-bold text-gray-900 mt-2 tracking-tight">{announcements.filter(a => !a.is_active).length}</h3>
            </div>
            <div className="p-3 rounded-full bg-gray-50 text-gray-600">
              <Circle className="w-5 h-5" />
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      {loading ? (
        <div className="flex items-center justify-center py-20">
          <div className="flex flex-col items-center gap-3">
            <div className="h-8 w-8 animate-spin rounded-full border-b-2 border-gray-900"></div>
            <p className="text-sm text-gray-500 font-medium">Loading announcements...</p>
          </div>
        </div>
      ) : announcements.length === 0 ? (
        <div className="bg-white rounded-xl border border-gray-200 border-dashed p-12 text-center">
          <div className="bg-gray-50 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
            <MessageSquare className="h-8 w-8 text-gray-400" />
          </div>
          <h3 className="text-lg font-semibold text-gray-900 mb-2">No announcements yet</h3>
          <p className="text-gray-500 mb-6 max-w-sm mx-auto">
            Create your first announcement to start displaying messages on your screens.
          </p>
          <Button onClick={handleCreateNew} variant="outline" className="rounded-full">
            <Plus className="h-4 w-4 mr-2" />
            Create Announcement
          </Button>
        </div>
      ) : (
        <div className="space-y-12">
          {/* Pending Client Announcements */}
          {getPendingAnnouncements().length > 0 && (
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <span className="relative flex h-3 w-3">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-3 w-3 bg-amber-500"></span>
                </span>
                <h2 className="text-lg font-semibold text-gray-900">Pending Reviews</h2>
                <span className="px-2 py-0.5 rounded-full bg-amber-100 text-xs font-medium text-amber-700">
                  {getPendingAnnouncements().length}
                </span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {getPendingAnnouncements().map((announcement) => (
                  <div
                    key={announcement.id}
                    className="group relative bg-white rounded-xl border border-amber-200 shadow-sm hover:shadow-md transition-all duration-200 overflow-hidden cursor-pointer"
                    onClick={() => setReviewingAnnouncement(announcement)}
                  >
                    <div className="absolute top-3 left-3 z-10 bg-white/90 backdrop-blur-sm px-2 py-1 rounded-md text-xs font-medium text-amber-700 border border-amber-100 shadow-sm flex items-center gap-1">
                      <AlertCircle className="w-3 h-3" />
                      Needs Review
                    </div>

                    {announcement.image_url && (
                      <div className="aspect-video bg-gray-100 relative">
                        <img
                          src={announcement.image_url}
                          alt={announcement.title}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                        />
                      </div>
                    )}

                    <div className="p-4">
                      <h3 className="font-semibold text-gray-900 truncate">{announcement.title}</h3>
                      <p className="text-sm text-gray-500 mt-1 line-clamp-2">{announcement.body}</p>
                      <div className="flex items-center justify-between mt-3 pt-3 border-t border-gray-100">
                        <span className="text-xs text-gray-400">
                          {new Date(announcement.created_at).toLocaleDateString()}
                        </span>
                        <span className="text-xs font-medium text-amber-600 group-hover:text-amber-700">
                          Click to review →
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Admin Announcements */}
          {getAdminAnnouncements().length > 0 && (
            <div className="space-y-4">
              <div className="flex items-center gap-2 pb-2 border-b border-gray-100">
                <h2 className="text-lg font-semibold text-gray-900">Admin Announcements</h2>
                <span className="text-gray-400 text-sm">/ {getAdminAnnouncements().length}</span>
              </div>
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {getAdminAnnouncements().map((announcement) => (
                  <AnnouncementCard
                    key={announcement.id}
                    announcement={announcement}
                    onEdit={handleEdit}
                    onDelete={handleDelete}
                    onToggleActive={handleToggleActive}
                  />
                ))}
              </div>
            </div>
          )}

          {/* Approved Client Announcements */}
          {getApprovedClientAnnouncements().length > 0 && (
            <div className="space-y-4">
              <div className="flex items-center gap-2 pb-2 border-b border-gray-100">
                <h2 className="text-lg font-semibold text-gray-900">Approved Client Announcements</h2>
                <CheckCircle2 className="w-4 h-4 text-emerald-500" />
              </div>
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {getApprovedClientAnnouncements().map((announcement) => (
                  <AnnouncementCard
                    key={announcement.id}
                    announcement={announcement}
                    onEdit={handleEdit}
                    onDelete={handleDelete}
                    onToggleActive={handleToggleActive}
                  />
                ))}
              </div>
            </div>
          )}

          {/* Rejected Client Announcements */}
          {getRejectedClientAnnouncements().length > 0 && (
            <div className="space-y-4">
              <div className="flex items-center gap-2 pb-2 border-b border-gray-100">
                <h2 className="text-lg font-semibold text-gray-900">Rejected</h2>
                <span className="text-gray-400 text-sm">/ {getRejectedClientAnnouncements().length}</span>
              </div>
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 opacity-80 hover:opacity-100 transition-opacity">
                {getRejectedClientAnnouncements().map((announcement) => (
                  <AnnouncementCard
                    key={announcement.id}
                    announcement={announcement}
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
