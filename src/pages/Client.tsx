import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import {
  Menu,
  LogOut,
  User as UserIcon,
  Home as HomeIcon,
  Settings as SettingsIcon,
  Image,
  Megaphone,
  Calendar,
  Upload
} from 'lucide-react';
import type { Media, Client as ClientType, Announcement, Event } from '@/types';
import { ClientMediaCard } from '@/components/ClientMediaCard';
import { ClientMediaForm } from '@/components/ClientMediaForm';
import { ClientAnnouncementForm } from '@/components/ClientAnnouncementForm';
import { ClientAnnouncementCard } from '@/components/ClientAnnouncementCard';
import { ClientEventForm } from '@/components/ClientEventForm';
import { ClientEventCard } from '@/components/ClientEventCard';
import { ClientBottomNav } from '@/components/ClientBottomNav';
import { Settings } from '@/pages/client/Settings';

type TabType = 'home' | 'media' | 'announcements' | 'events' | 'settings';

export function Client() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [activeTab, setActiveTab] = useState<TabType>('home');
  const [showMediaForm, setShowMediaForm] = useState(false);
  const [showAnnouncementForm, setShowAnnouncementForm] = useState(false);
  const [showEventForm, setShowEventForm] = useState(false);
  const [mediaList, setMediaList] = useState<Media[]>([]);
  const [announcementList, setAnnouncementList] = useState<Announcement[]>([]);
  const [eventList, setEventList] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);
  const [clientProfile, setClientProfile] = useState<ClientType | null>(null);

  useEffect(() => {
    const loadClientProfile = async () => {
      if (!user?.id) return;
      try {
        const { data, error } = await supabase
          .from('clients')
          .select('*')
          .eq('id', user.id)
          .single();

        if (error) throw error;
        setClientProfile(data);
      } catch (error) {
        console.error('Error loading client profile:', error);
      }
    };

    const loadMedia = async () => {
      if (!user?.id) return;
      try {
        const { data, error } = await supabase
          .from('media')
          .select('*')
          .eq('client_id', user.id)
          .order('created_at', { ascending: false });

        if (error) throw error;
        setMediaList(data || []);
      } catch (error) {
        console.error('Error loading media:', error);
      }
    };

    const loadAnnouncements = async () => {
      if (!user?.id) return;
      try {
        const { data, error } = await supabase
          .from('announcements')
          .select('*')
          .eq('client_id', user.id)
          .order('created_at', { ascending: false });

        if (error) throw error;
        setAnnouncementList(data || []);
      } catch (error) {
        console.error('Error loading announcements:', error);
      }
    };

    const loadEvents = async () => {
      if (!user?.id) return;
      try {
        const { data, error } = await supabase
          .from('events')
          .select('*')
          .eq('client_id', user.id)
          .order('created_at', { ascending: false });

        if (error) throw error;
        setEventList(data || []);
      } catch (error) {
        console.error('Error loading events:', error);
      }
    };

    const loadAll = async () => {
      setLoading(true);
      await Promise.all([loadClientProfile(), loadMedia(), loadAnnouncements(), loadEvents()]);
      setLoading(false);
    };

    loadAll();
  }, [user?.id]);

  const handleMediaUpload = (newMedia: Media) => {
    setMediaList(prev => [newMedia, ...prev]);
    setShowMediaForm(false);
  };

  const handleMediaDelete = (id: string) => {
    setMediaList(prev => prev.filter(m => m.id !== id));
  };

  const handleAnnouncementSubmit = (newAnnouncement: Announcement) => {
    setAnnouncementList(prev => [newAnnouncement, ...prev]);
    setShowAnnouncementForm(false);
  };

  const handleAnnouncementDelete = (id: string) => {
    setAnnouncementList(prev => prev.filter(a => a.id !== id));
  };

  const handleEventSubmit = (newEvent: Event) => {
    setEventList(prev => [newEvent, ...prev]);
    setShowEventForm(false);
  };

  const handleEventDelete = (id: string) => {
    setEventList(prev => prev.filter(e => e.id !== id));
  };

  const handleLogout = async () => {
    try {
      await supabase.auth.signOut();
    } catch (error) {
      console.error('Logout error:', error);
    }
    navigate('/login', { replace: true });
  };

  // Stats helpers
  const getMediaStats = () => ({
    total: mediaList.length,
    pending: mediaList.filter(m => m.status === 'pending').length,
    approved: mediaList.filter(m => m.status === 'approved').length,
    rejected: mediaList.filter(m => m.status === 'rejected').length,
  });

  const getAnnouncementStats = () => ({
    total: announcementList.length,
    pending: announcementList.filter(a => a.status === 'pending').length,
    approved: announcementList.filter(a => a.status === 'approved').length,
    rejected: announcementList.filter(a => a.status === 'rejected').length,
  });

  const getEventStats = () => ({
    total: eventList.length,
    pending: eventList.filter(e => e.status === 'pending').length,
    approved: eventList.filter(e => e.status === 'approved').length,
    rejected: eventList.filter(e => e.status === 'rejected').length,
  });

  const getTabTitle = () => {
    switch (activeTab) {
      case 'home': return 'Dashboard';
      case 'media': return 'Media';
      case 'announcements': return 'Announcements';
      case 'events': return 'Events';
      case 'settings': return 'Settings';
    }
  };

  const getTabDescription = () => {
    switch (activeTab) {
      case 'home': return clientProfile?.organization || 'Your Organization';
      case 'media': return 'Upload and manage your media files';
      case 'announcements': return 'Create and manage announcements';
      case 'events': return 'Create and manage events';
      case 'settings': return 'Manage your profile and account information';
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  const sidebarItems = [
    { id: 'home' as TabType, icon: HomeIcon, label: 'Home' },
    { id: 'media' as TabType, icon: Image, label: 'Media' },
    { id: 'announcements' as TabType, icon: Megaphone, label: 'Announcements' },
    { id: 'events' as TabType, icon: Calendar, label: 'Events' },
    { id: 'settings' as TabType, icon: SettingsIcon, label: 'Settings' },
  ];

  return (
    <div className="h-screen bg-gray-50 flex flex-col md:flex-row overflow-hidden">
      {/* Sidebar - Hidden on mobile, visible on desktop */}
      <div className={`hidden md:flex md:flex-shrink-0 transition-all duration-300 ease-in-out ${sidebarCollapsed ? 'md:w-16' : 'md:w-64'} bg-white shadow-lg border-r`}>
        <div className="h-full flex flex-col w-full">
          <div className="p-3 md:p-4 border-b flex items-center justify-between">
            {!sidebarCollapsed && (
              <div>
                <h1 className="text-base md:text-lg font-bold text-gray-900">Client Portal</h1>
                <p className="text-xs text-gray-600">Content Manager</p>
              </div>
            )}
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
              className="p-1"
            >
              <Menu className="w-5 h-5" />
            </Button>
          </div>

          <nav className="flex-1 overflow-y-auto">
            <div className="px-3 md:px-4 py-4 md:py-6 space-y-1">
              {!sidebarCollapsed && (
                <p className="text-xs font-semibold text-gray-500 uppercase mb-2">Menu</p>
              )}

              {sidebarItems.map((item) => (
                <button
                  key={item.id}
                  onClick={() => {
                    setActiveTab(item.id);
                    if (item.id === 'media') setShowMediaForm(true);
                    if (item.id === 'announcements') setShowAnnouncementForm(true);
                    if (item.id === 'events') setShowEventForm(true);
                  }}
                  className={`w-full flex items-center space-x-3 px-3 py-3 rounded-lg transition-colors font-medium text-sm ${activeTab === item.id
                      ? 'bg-gray-100 text-gray-900 hover:bg-gray-200'
                      : 'text-gray-600 hover:bg-gray-100'
                    }`}
                >
                  <item.icon className="w-5 h-5" />
                  {!sidebarCollapsed && <span>{item.label}</span>}
                </button>
              ))}
            </div>
          </nav>

          <div className="p-3 md:p-4 border-t">
            <Button
              variant="outline"
              size="sm"
              onClick={handleLogout}
              className="w-full justify-center text-red-600 hover:text-red-700"
            >
              <LogOut className="w-4 h-4" />
              {!sidebarCollapsed && <span className="ml-2">Logout</span>}
            </Button>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col h-full overflow-hidden pb-20 md:pb-0">
        {/* Header */}
        <div className="bg-white border-b border-gray-200 px-3 md:px-6 py-3 md:py-4 flex-shrink-0">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
            <div>
              <h2 className="text-xl md:text-2xl font-semibold text-gray-900">
                {getTabTitle()}
              </h2>
              <p className="text-xs md:text-sm text-gray-500 mt-1">
                {getTabDescription()}
              </p>
            </div>
            <div className="hidden md:flex items-center gap-3">
              <div className="text-right">
                <p className="text-sm font-medium text-gray-900">
                  {clientProfile?.name || user?.email}
                </p>
                <p className="text-xs text-gray-500">{clientProfile?.email}</p>
              </div>
              <div className="w-9 h-9 bg-gray-900 rounded-full flex items-center justify-center flex-shrink-0">
                <UserIcon className="w-5 h-5 text-white" />
              </div>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-auto p-3 md:p-6">
          {/* Home Tab */}
          {activeTab === 'home' && (
            <>
              {/* Combined Statistics */}
              <div className="grid grid-cols-2 md:grid-cols-3 gap-3 md:gap-4 mb-6">
                <div className="bg-white border border-gray-200 rounded-lg p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <Image className="w-4 h-4 text-blue-600" />
                    <span className="text-xs font-medium text-gray-500">Media</span>
                  </div>
                  <span className="text-2xl font-bold text-gray-900">{getMediaStats().total}</span>
                  <div className="flex gap-2 mt-1 text-xs">
                    <span className="text-amber-600">{getMediaStats().pending} pending</span>
                    <span className="text-emerald-600">{getMediaStats().approved} approved</span>
                  </div>
                </div>

                <div className="bg-white border border-gray-200 rounded-lg p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <Megaphone className="w-4 h-4 text-purple-600" />
                    <span className="text-xs font-medium text-gray-500">Announcements</span>
                  </div>
                  <span className="text-2xl font-bold text-gray-900">{getAnnouncementStats().total}</span>
                  <div className="flex gap-2 mt-1 text-xs">
                    <span className="text-amber-600">{getAnnouncementStats().pending} pending</span>
                    <span className="text-emerald-600">{getAnnouncementStats().approved} approved</span>
                  </div>
                </div>

                <div className="bg-white border border-gray-200 rounded-lg p-4 col-span-2 md:col-span-1">
                  <div className="flex items-center gap-2 mb-2">
                    <Calendar className="w-4 h-4 text-green-600" />
                    <span className="text-xs font-medium text-gray-500">Events</span>
                  </div>
                  <span className="text-2xl font-bold text-gray-900">{getEventStats().total}</span>
                  <div className="flex gap-2 mt-1 text-xs">
                    <span className="text-amber-600">{getEventStats().pending} pending</span>
                    <span className="text-emerald-600">{getEventStats().approved} approved</span>
                  </div>
                </div>
              </div>

              {/* Quick Actions */}
              <div className="mb-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h3>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <Button
                    onClick={() => {
                      setActiveTab('media');
                      setShowMediaForm(true);
                    }}
                    variant="outline"
                    className="h-auto py-4 flex flex-col items-center gap-2"
                  >
                    <Image className="w-6 h-6 text-blue-600" />
                    <span>Upload Media</span>
                  </Button>
                  <Button
                    onClick={() => {
                      setActiveTab('announcements');
                      setShowAnnouncementForm(true);
                    }}
                    variant="outline"
                    className="h-auto py-4 flex flex-col items-center gap-2"
                  >
                    <Megaphone className="w-6 h-6 text-purple-600" />
                    <span>New Announcement</span>
                  </Button>
                  <Button
                    onClick={() => {
                      setActiveTab('events');
                      setShowEventForm(true);
                    }}
                    variant="outline"
                    className="h-auto py-4 flex flex-col items-center gap-2"
                  >
                    <Calendar className="w-6 h-6 text-green-600" />
                    <span>Create Event</span>
                  </Button>
                </div>
              </div>

              {/* Recent Activity */}
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Recent Media</h3>
                {mediaList.length === 0 ? (
                  <div className="bg-white border border-gray-200 rounded-lg p-8 text-center">
                    <Upload className="w-8 h-8 text-gray-400 mx-auto mb-2" />
                    <p className="text-gray-500">No media uploaded yet</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                    {mediaList.slice(0, 3).map(media => (
                      <ClientMediaCard
                        key={media.id}
                        media={media}
                        onDelete={handleMediaDelete}
                      />
                    ))}
                  </div>
                )}
              </div>
            </>
          )}

          {/* Media Tab */}
          {activeTab === 'media' && (
            <div className="space-y-6">
              {showMediaForm ? (
                <ClientMediaForm
                  clientId={user?.id || ''}
                  onMediaUpload={handleMediaUpload}
                />
              ) : (
                <>
                  <div className="flex items-center justify-between">
                    <h3 className="text-lg font-semibold text-gray-900">My Media</h3>
                    <Button
                      onClick={() => setShowMediaForm(true)}
                      className="bg-gray-900 hover:bg-gray-800 text-white"
                    >
                      <Upload className="w-4 h-4 mr-2" />
                      Upload Media
                    </Button>
                  </div>
                  {mediaList.length === 0 ? (
                    <div className="bg-white border border-gray-200 rounded-lg p-12 text-center">
                      <Image className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                      <h4 className="text-lg font-semibold text-gray-900 mb-2">No media uploaded yet</h4>
                      <p className="text-sm text-gray-500 mb-6">Upload images or videos to display on screens</p>
                      <Button onClick={() => setShowMediaForm(true)} className="bg-gray-900 hover:bg-gray-800">
                        <Upload className="w-4 h-4 mr-2" />
                        Upload Media
                      </Button>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                      {mediaList.map(media => (
                        <ClientMediaCard key={media.id} media={media} onDelete={handleMediaDelete} />
                      ))}
                    </div>
                  )}
                </>
              )}
            </div>
          )}

          {/* Announcements Tab */}
          {activeTab === 'announcements' && (
            <div className="space-y-6">
              {showAnnouncementForm ? (
                <div>
                  <Button
                    variant="ghost"
                    onClick={() => setShowAnnouncementForm(false)}
                    className="mb-4"
                  >
                    ← Back to Announcements
                  </Button>
                  <ClientAnnouncementForm
                    clientId={user?.id || ''}
                    onAnnouncementSubmit={handleAnnouncementSubmit}
                  />
                </div>
              ) : (
                <>
                  <div className="flex items-center justify-between">
                    <h3 className="text-lg font-semibold text-gray-900">My Announcements</h3>
                    <Button
                      onClick={() => setShowAnnouncementForm(true)}
                      className="bg-gray-900 hover:bg-gray-800 text-white"
                    >
                      <Megaphone className="w-4 h-4 mr-2" />
                      New Announcement
                    </Button>
                  </div>
                  {announcementList.length === 0 ? (
                    <div className="bg-white border border-gray-200 rounded-lg p-12 text-center">
                      <Megaphone className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                      <h4 className="text-lg font-semibold text-gray-900 mb-2">No announcements yet</h4>
                      <p className="text-sm text-gray-500 mb-6">Create announcements to display important messages</p>
                      <Button onClick={() => setShowAnnouncementForm(true)} className="bg-gray-900 hover:bg-gray-800">
                        <Megaphone className="w-4 h-4 mr-2" />
                        Create Announcement
                      </Button>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                      {announcementList.map(announcement => (
                        <ClientAnnouncementCard
                          key={announcement.id}
                          announcement={announcement}
                          onDelete={handleAnnouncementDelete}
                        />
                      ))}
                    </div>
                  )}
                </>
              )}
            </div>
          )}

          {/* Events Tab */}
          {activeTab === 'events' && (
            <div className="space-y-6">
              {showEventForm ? (
                <div>
                  <Button
                    variant="ghost"
                    onClick={() => setShowEventForm(false)}
                    className="mb-4"
                  >
                    ← Back to Events
                  </Button>
                  <ClientEventForm
                    clientId={user?.id || ''}
                    onEventSubmit={handleEventSubmit}
                  />
                </div>
              ) : (
                <>
                  <div className="flex items-center justify-between">
                    <h3 className="text-lg font-semibold text-gray-900">My Events</h3>
                    <Button
                      onClick={() => setShowEventForm(true)}
                      className="bg-gray-900 hover:bg-gray-800 text-white"
                    >
                      <Calendar className="w-4 h-4 mr-2" />
                      Create Event
                    </Button>
                  </div>
                  {eventList.length === 0 ? (
                    <div className="bg-white border border-gray-200 rounded-lg p-12 text-center">
                      <Calendar className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                      <h4 className="text-lg font-semibold text-gray-900 mb-2">No events yet</h4>
                      <p className="text-sm text-gray-500 mb-6">Create events to promote upcoming activities</p>
                      <Button onClick={() => setShowEventForm(true)} className="bg-gray-900 hover:bg-gray-800">
                        <Calendar className="w-4 h-4 mr-2" />
                        Create Event
                      </Button>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                      {eventList.map(event => (
                        <ClientEventCard key={event.id} event={event} onDelete={handleEventDelete} />
                      ))}
                    </div>
                  )}
                </>
              )}
            </div>
          )}

          {/* Settings Tab */}
          {activeTab === 'settings' && (
            <Settings
              clientProfile={clientProfile}
              onUpdate={setClientProfile}
            />
          )}
        </div>
      </div>

      {/* Bottom Navigation - Visible only on mobile */}
      <ClientBottomNav
        activeTab={activeTab}
        onTabChange={(tab) => {
          setActiveTab(tab);
          if (tab === 'media') setShowMediaForm(false);
          if (tab === 'announcements') setShowAnnouncementForm(false);
          if (tab === 'events') setShowEventForm(false);
        }}
      />
    </div>
  );
}
