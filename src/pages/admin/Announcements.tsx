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
    <div className="space-y-8 max-w-7xl mx-auto animate-in fade-in duration-500">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-gray-900">Announcements</h1>
          <p className="text-gray-500 mt-1">Manage your digital signage announcements</p>
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

      {/* Stats Cards - Minimal Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {/* Total Announcements */}
        <div className="bg-white rounded-xl p-6 border border-gray-100 shadow-sm hover:shadow-md transition-all duration-300">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-500">Total Announcements</p>
              <h3 className="text-3xl font-bold text-gray-900 mt-2 tracking-tight">{announcements.length}</h3>
            </div>
            <div className="p-3 rounded-full bg-blue-50 text-blue-600">
              <Megaphone className="w-5 h-5" />
            </div>
          </div>
        </div>

        {/* Active */}
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

        {/* Inactive */}
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

      {/* Announcements List */}
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
          <h3 className="text-lg font-semibold text-gray-900 mb-2">
            No announcements yet
          </h3>
          <p className="text-gray-500 mb-6 max-w-sm mx-auto">
            Create your first announcement to start displaying messages on your screens.
          </p>
          <Button onClick={handleCreateNew} variant="outline" className="rounded-full">
            <Plus className="h-4 w-4 mr-2" />
            Create Announcement
          </Button>
        </div>
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
