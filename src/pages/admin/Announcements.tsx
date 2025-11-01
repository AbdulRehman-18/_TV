import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { AnnouncementCard } from '@/components/AnnouncementCard';
import { AnnouncementForm } from '@/components/AnnouncementForm';
import { Plus, Megaphone, RefreshCw, CheckCircle2, Circle, MessageSquare } from 'lucide-react';
import { Announcement } from '@/types';

export function Announcements() {
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingAnnouncement, setEditingAnnouncement] = useState<Announcement | undefined>();

  useEffect(() => {
    loadAnnouncements();
  }, []);

  const loadAnnouncements = async () => {
    try {
      const { data, error } = await supabase
        .from('announcements')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      
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
      // Update existing announcement
      setAnnouncements(prev => 
        prev.map(a => a.id === announcement.id ? announcement : a)
      );
    } else {
      // Add new announcement
      setAnnouncements(prev => [announcement, ...prev]);
    }
    
    setShowForm(false);
    setEditingAnnouncement(undefined);
  };

  const handleDelete = (id: string) => {
    setAnnouncements(prev => prev.filter(a => a.id !== id));

    // Notify other tabs/windows that an announcement was deleted
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

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl md:text-3xl font-semibold text-gray-900">Announcements</h1>
        <p className="text-sm md:text-base text-gray-500 mt-1">Manage and monitor your announcements</p>
      </div>

      {/* Stats Cards - Horizontal Scroll */}
      <div className="overflow-x-auto scrollbar-hide">
        <div className="flex gap-3 md:gap-4 pb-2 min-w-max md:min-w-0 md:grid md:grid-cols-3">
          {/* Total Announcements */}
          <div className="bg-blue-50 rounded-2xl p-4 md:p-6 border border-gray-100 flex-shrink-0 w-64 md:w-auto">
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <p className="text-xs md:text-sm font-medium text-gray-600">Total Announcements</p>
                <p className="text-2xl md:text-3xl font-bold text-blue-600 mt-2">{announcements.length}</p>
              </div>
              <Megaphone className="w-6 h-6 md:w-8 md:h-8 text-blue-500 opacity-20" />
            </div>
          </div>

          {/* Active */}
          <div className="bg-green-50 rounded-2xl p-4 md:p-6 border border-gray-100 flex-shrink-0 w-64 md:w-auto">
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <p className="text-xs md:text-sm font-medium text-gray-600">Active</p>
                <p className="text-2xl md:text-3xl font-bold text-green-600 mt-2">{announcements.filter(a => a.is_active).length}</p>
              </div>
              <CheckCircle2 className="w-6 h-6 md:w-8 md:h-8 text-green-500 opacity-20" />
            </div>
          </div>

          {/* Inactive */}
          <div className="bg-gray-50 rounded-2xl p-4 md:p-6 border border-gray-100 flex-shrink-0 w-64 md:w-auto">
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <p className="text-xs md:text-sm font-medium text-gray-600">Inactive</p>
                <p className="text-2xl md:text-3xl font-bold text-gray-600 mt-2">{announcements.filter(a => !a.is_active).length}</p>
              </div>
              <Circle className="w-6 h-6 md:w-8 md:h-8 text-gray-500 opacity-20" />
            </div>
          </div>
        </div>
      </div>

      {/* Action Bar */}
      <div className="flex justify-between items-center">
        <span></span>
        <div className="flex items-center space-x-3">
          <Button
            variant="outline"
            onClick={loadAnnouncements}
            size="icon"
            title="Refresh"
          >
            <RefreshCw className="h-4 w-4" />
          </Button>
          <Button onClick={handleCreateNew} className="flex items-center space-x-2">
            <Plus className="h-4 w-4" />
            <span>New Announcement</span>
          </Button>
        </div>
      </div>

      {/* Announcements List */}
      {loading ? (
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        </div>
      ) : announcements.length === 0 ? (
        <Card>
          <CardContent className="text-center py-12">
            <MessageSquare className="mx-auto h-12 w-12 text-gray-400 mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              No announcements yet
            </h3>
            <p className="text-gray-500 mb-4">
              Create your first announcement to get started.
            </p>
            <Button onClick={handleCreateNew}>
              <Plus className="h-4 w-4 mr-2" />
              Create Announcement
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {announcements.map((announcement) => (
            <AnnouncementCard
              key={announcement.id}
              announcement={announcement}
              onEdit={handleEdit}
              onDelete={handleDelete}
              onToggleActive={handleToggleActive}
            />
          ))}
        </div>
      )}
    </div>
  );
}
