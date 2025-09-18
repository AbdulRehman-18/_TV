import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { AnnouncementCard } from '@/components/AnnouncementCard';
import { AnnouncementForm } from '@/components/AnnouncementForm';
import { Plus, Monitor, RefreshCw } from 'lucide-react';
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
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Announcements</h1>
          <p className="text-gray-600">Manage your display announcements</p>
        </div>
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
            <span>Create New</span>
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="p-6 text-center">
            <div className="text-2xl font-bold text-blue-600">
              {announcements.length}
            </div>
            <div className="text-sm text-blue-600">Total Announcements</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6 text-center">
            <div className="text-2xl font-bold text-green-600">
              {announcements.filter(a => a.is_active).length}
            </div>
            <div className="text-sm text-green-600">Active Announcements</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6 text-center">
            <div className="text-2xl font-bold text-gray-600">
              {announcements.filter(a => !a.is_active).length}
            </div>
            <div className="text-sm text-gray-600">Inactive Announcements</div>
          </CardContent>
        </Card>
      </div>

      {/* Announcements List */}
      {loading ? (
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        </div>
      ) : announcements.length === 0 ? (
        <Card>
          <CardContent className="text-center py-12">
            <Monitor className="mx-auto h-12 w-12 text-gray-400 mb-4" />
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
