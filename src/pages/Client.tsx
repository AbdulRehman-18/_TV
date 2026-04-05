import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '@/lib/api';
import { useAuth } from '@/hooks/useAuth';
import {
  Image,
  Megaphone,
  Calendar,
  ArrowRight
} from 'lucide-react';
import type { Media, Client as ClientType, Announcement, Event } from '@/types';
import { ClientMediaForm } from '@/components/ClientMediaForm';
import { ClientAnnouncementForm } from '@/components/ClientAnnouncementForm';
import { ClientEventForm } from '@/components/ClientEventForm';
import { Settings } from '@/pages/client/Settings';
import { ClientHeader } from '@/components/ClientHeader';
import { ClientActivityFeed } from '@/components/ClientActivityFeed';
import { Breadcrumbs } from '@/components/ui/breadcrumbs';

export function Client() {
  const { user } = useAuth();
  const navigate = useNavigate();
  
  // Modal states
  const [showMediaForm, setShowMediaForm] = useState(false);
  const [showAnnouncementForm, setShowAnnouncementForm] = useState(false);
  const [showEventForm, setShowEventForm] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  
  // Data states
  const [mediaList, setMediaList] = useState<Media[]>([]);
  const [announcementList, setAnnouncementList] = useState<Announcement[]>([]);
  const [eventList, setEventList] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);
  const [clientProfile, setClientProfile] = useState<ClientType | null>(null);

  useEffect(() => {
    const loadClientProfile = async () => {
      if (!user?.id) return;
      try {
        const data = await api.auth.getMe();
        if (data && data.client_profile) {
            setClientProfile(data.client_profile); // Assuming user returns client profile
        } else {
            setClientProfile(data as any); 
        }
      } catch (error) {
        console.error('Error loading client profile:', error);
      }
    };

    const loadMedia = async () => {
      if (!user?.id) return;
      try {
        const data = await api.get('/media/');
        setMediaList(data || []);
      } catch (error) {
        console.error('Error loading media:', error);
      }
    };

    const loadAnnouncements = async () => {
      if (!user?.id) return;
      try {
        const data = await api.get('/announcements/');
        setAnnouncementList(data || []);
      } catch (error) {
        console.error('Error loading announcements:', error);
      }
    };

    const loadEvents = async () => {
      if (!user?.id) return;
      try {
        const data = await api.get('/events/');
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
      api.auth.logout();
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
  });

  const getAnnouncementStats = () => ({
    total: announcementList.length,
    pending: announcementList.filter(a => a.status === 'pending').length,
    approved: announcementList.filter(a => a.status === 'approved').length,
  });

  const getEventStats = () => ({
    total: eventList.length,
    pending: eventList.filter(e => e.status === 'pending').length,
    approved: eventList.filter(e => e.status === 'approved').length,
  });

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900"></div>
      </div>
    );
  }

  // If showing a full-screen feature like Forms or Settings
  if (showSettings) {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col">
        <ClientHeader 
          clientProfile={clientProfile} 
          userEmail={user?.email} 
          onLogout={handleLogout}
          onSettingsClick={() => setShowSettings(true)}
        />
        <div className="flex-1 max-w-4xl mx-auto w-full p-6">
          <Breadcrumbs 
            items={[
              { label: 'Dashboard', onClick: () => setShowSettings(false) },
              { label: 'Settings', isActive: true }
            ]} 
          />
          <Settings
            clientProfile={clientProfile}
            onUpdate={setClientProfile}
          />
        </div>
      </div>
    );
  }

  if (showMediaForm) {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col">
          <ClientHeader 
            clientProfile={clientProfile} 
            userEmail={user?.email} 
            onLogout={handleLogout}
            onSettingsClick={() => {
                setShowMediaForm(false);
                setShowSettings(true);
            }}
          />
        <div className="flex-1 max-w-4xl mx-auto w-full p-6">
            <Breadcrumbs 
              items={[
                { label: 'Dashboard', onClick: () => setShowMediaForm(false) },
                { label: 'Upload Media', isActive: true }
              ]} 
            />
            <ClientMediaForm
                clientId={user?.id || ''}
                onMediaUpload={handleMediaUpload}
            />
        </div>
      </div>
    );
  }

  if (showAnnouncementForm) {
    return (
        <div className="min-h-screen bg-gray-50 flex flex-col">
             <ClientHeader 
                clientProfile={clientProfile} 
                userEmail={user?.email} 
                onLogout={handleLogout}
                onSettingsClick={() => {
                    setShowAnnouncementForm(false);
                    setShowSettings(true);
                }}
            />
            <div className="flex-1 max-w-4xl mx-auto w-full p-6">
                <Breadcrumbs 
                  items={[
                    { label: 'Dashboard', onClick: () => setShowAnnouncementForm(false) },
                    { label: 'New Announcement', isActive: true }
                  ]} 
                />
                <ClientAnnouncementForm
                    clientId={user?.id || ''}
                    onAnnouncementSubmit={handleAnnouncementSubmit}
                />
            </div>
        </div>
    );
  }

  if (showEventForm) {
    return (
        <div className="min-h-screen bg-gray-50 flex flex-col">
             <ClientHeader 
                clientProfile={clientProfile} 
                userEmail={user?.email} 
                onLogout={handleLogout}
                onSettingsClick={() => {
                    setShowEventForm(false);
                    setShowSettings(true);
                }}
            />
            <div className="flex-1 max-w-4xl mx-auto w-full p-6">
                <Breadcrumbs 
                  items={[
                    { label: 'Dashboard', onClick: () => setShowEventForm(false) },
                    { label: 'Create Event', isActive: true }
                  ]} 
                />
                <ClientEventForm
                    clientId={user?.id || ''}
                    onEventSubmit={handleEventSubmit}
                />
            </div>
        </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50/50 flex flex-col font-sans text-gray-900">
      <ClientHeader 
        clientProfile={clientProfile} 
        userEmail={user?.email} 
        onLogout={handleLogout}
        onSettingsClick={() => setShowSettings(true)}
      />

      <main className="flex-1 w-full max-w-6xl mx-auto px-4 sm:px-6 py-8">
        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10">
          <StatCard 
            label="Media Files" 
            count={getMediaStats().total} 
            substats={getMediaStats()}
            icon={<Image className="w-5 h-5 text-blue-600" />}
            onClick={() => {}} 
          />
          <StatCard 
            label="Announcements" 
            count={getAnnouncementStats().total} 
            substats={getAnnouncementStats()}
            icon={<Megaphone className="w-5 h-5 text-purple-600" />}
            onClick={() => {}} 
          />
          <StatCard 
            label="Upcoming Events" 
            count={getEventStats().total} 
            substats={getEventStats()}
            icon={<Calendar className="w-5 h-5 text-green-600" />}
            onClick={() => {}} 
          />
        </div>

        {/* Quick Actions */}
        <div className="mb-12">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-bold text-gray-900">Quick Actions</h3>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <QuickActionButton 
                label="Upload Media" 
                desc="Add images or videos"
                icon={<Image className="w-6 h-6 text-blue-600" />}
                onClick={() => setShowMediaForm(true)}
                variant="blue"
            />
            <QuickActionButton 
                label="New Announcement"
                desc="Broadcast a message"
                icon={<Megaphone className="w-6 h-6 text-purple-600" />}
                onClick={() => setShowAnnouncementForm(true)}
                variant="purple"
            />
            <QuickActionButton 
                label="Create Event" 
                desc="Schedule an event"
                icon={<Calendar className="w-6 h-6 text-green-600" />}
                onClick={() => setShowEventForm(true)}
                variant="green"
            />
          </div>
        </div>

        {/* Unified Feed */}
        <ClientActivityFeed 
            media={mediaList}
            announcements={announcementList}
            events={eventList}
            onDeleteMedia={handleMediaDelete}
            onDeleteAnnouncement={handleAnnouncementDelete}
            onDeleteEvent={handleEventDelete}
        />
      </main>
    </div>
  );
}

function StatCard({ label, count, substats, icon, onClick }: { 
    label: string, 
    count: number, 
    substats: { pending: number, approved: number }, 
    icon: React.ReactNode, 
    onClick: () => void 
}) {
    return (
        <div 
            onClick={onClick}
            className="bg-white p-5 rounded-xl border border-gray-100 shadow-sm hover:shadow-md transition-shadow cursor-default"
        >
            <div className="flex items-start justify-between mb-4">
                <div className="p-2 bg-gray-50 rounded-lg">{icon}</div>
                <span className="text-3xl font-bold text-gray-900 tracking-tight">{count}</span>
            </div>
            <p className="text-sm font-medium text-gray-600 mb-2">{label}</p>
            <div className="flex items-center gap-3 text-xs font-medium">
                <span className="flex items-center gap-1 text-amber-600 bg-amber-50 px-2 py-0.5 rounded-full">
                    <span className="w-1.5 h-1.5 rounded-full bg-amber-500"></span>
                    {substats.pending} Pending
                </span>
                <span className="flex items-center gap-1 text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                    {substats.approved} Active
                </span>
            </div>
        </div>
    );
}

interface QuickActionButtonProps {
    label: string; 
    desc: string; 
    icon: React.ReactNode; 
    onClick: () => void;
    variant: 'blue' | 'purple' | 'green';
}

function QuickActionButton({ label, desc, icon, onClick, variant }: QuickActionButtonProps) {
    const variants = {
        blue: 'bg-blue-50 border-blue-100 hover:border-blue-200 hover:bg-blue-100/50',
        purple: 'bg-purple-50 border-purple-100 hover:border-purple-200 hover:bg-purple-100/50',
        green: 'bg-green-50 border-green-100 hover:border-green-200 hover:bg-green-100/50'
    };

    const iconBgVariants = {
        blue: 'bg-blue-100',
        purple: 'bg-purple-100',
        green: 'bg-green-100'
    };

    return (
        <button 
            onClick={onClick}
            className={`flex items-center gap-4 p-4 border rounded-xl transition-all text-left group ${variants[variant]}`}
        >
            <div className={`p-3 rounded-lg transition-colors ${iconBgVariants[variant]}`}>
                {icon}
            </div>
            <div className="flex-1">
                <p className="font-bold text-gray-900">{label}</p>
                <p className="text-xs text-gray-600">{desc}</p>
            </div>
            <div className="opacity-0 group-hover:opacity-100 transition-opacity transform translate-x-[-10px] group-hover:translate-x-0">
                <ArrowRight className="w-4 h-4 text-gray-500" />
            </div>
        </button>
    );
}
