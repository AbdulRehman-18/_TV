import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { 
  Megaphone, 
  Calendar, 
  Activity,
  Image
} from 'lucide-react';
import { Announcement, Event, Media } from '@/types';

export function Dashboard() {
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [events, setEvents] = useState<Event[]>([]);
  const [media, setMedia] = useState<Media[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'announcements' | 'events' | 'media'>('announcements');

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      // Fetch announcements
      const { data: announcementsData, error: announcementsError } = await supabase
        .from('announcements')
        .select('*')
        .order('created_at', { ascending: false });

      if (announcementsError) throw announcementsError;

      // Fetch events
      const { data: eventsData, error: eventsError } = await supabase
        .from('events')
        .select('*')
        .order('created_at', { ascending: false });

      if (eventsError) throw eventsError;

      // Fetch media
      const { data: mediaData, error: mediaError } = await supabase
        .from('media')
        .select('*')
        .order('created_at', { ascending: false });

      if (mediaError) throw mediaError;

      setAnnouncements(announcementsData || []);
      setEvents(eventsData || []);
      setMedia(mediaData || []);
    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setLoading(false);
    }
  };

  const stats = [
    {
      title: 'Total Announcements',
      value: announcements.length,
      icon: Megaphone,
      bgColor: 'bg-blue-50',
      textColor: 'text-blue-600',
      iconColor: 'text-blue-500'
    },
    {
      title: 'Total Events',
      value: events.length,
      icon: Calendar,
      bgColor: 'bg-green-50',
      textColor: 'text-green-600',
      iconColor: 'text-green-500'
    },
    {
      title: 'Total Media',
      value: media.length,
      icon: Image,
      bgColor: 'bg-purple-50',
      textColor: 'text-purple-600',
      iconColor: 'text-purple-500'
    },
    {
      title: 'Active Content',
      value: announcements.filter(a => a.is_active).length + 
             events.filter(e => e.is_active).length + 
             media.filter(m => m.is_active).length,
      icon: Activity,
      bgColor: 'bg-emerald-50',
      textColor: 'text-emerald-600',
      iconColor: 'text-emerald-500'
    }
  ];

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-gray-400">Loading dashboard...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl md:text-3xl font-semibold text-gray-900">Dashboard</h1>
        <p className="text-sm md:text-base text-gray-500 mt-1">Smart TV content management overview</p>
      </div>

      {/* Stats Cards - Horizontal Scroll */}
      <div className="overflow-x-auto scrollbar-hide">
        <div className="flex gap-3 md:gap-4 pb-2 min-w-max md:min-w-0 md:grid md:grid-cols-4">
          {stats.map((stat, index) => (
            <div 
              key={index} 
              className={`${stat.bgColor} rounded-2xl p-4 md:p-6 border border-gray-100 flex-shrink-0 w-64 md:w-auto md:flex-shrink`}
            >
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <p className="text-xs md:text-sm font-medium text-gray-600">{stat.title}</p>
                  <p className={`text-2xl md:text-3xl font-bold ${stat.textColor} mt-2`}>
                    {stat.value}
                  </p>
                </div>
                <div className="flex-shrink-0">
                  <stat.icon className={`w-6 h-6 md:w-8 md:h-8 ${stat.iconColor} opacity-20`} />
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Tabbed Recent Items Section */}
      <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden">
        {/* Tab Navigation */}
        <div className="flex border-b border-gray-200">
          <button
            onClick={() => setActiveTab('announcements')}
            className={`flex-1 px-4 py-3 md:px-6 md:py-4 font-medium transition-colors border-b-2 ${
              activeTab === 'announcements'
                ? 'text-blue-600 border-blue-600'
                : 'text-gray-600 border-transparent hover:text-gray-900'
            }`}
          >
            <div className="flex items-center justify-center space-x-2">
              <Megaphone className="w-4 h-4 md:w-5 md:h-5" />
              <span className="hidden sm:inline">Announcements</span>
              <span className="sm:hidden text-xs">{announcements.length}</span>
            </div>
          </button>
          <button
            onClick={() => setActiveTab('events')}
            className={`flex-1 px-4 py-3 md:px-6 md:py-4 font-medium transition-colors border-b-2 ${
              activeTab === 'events'
                ? 'text-green-600 border-green-600'
                : 'text-gray-600 border-transparent hover:text-gray-900'
            }`}
          >
            <div className="flex items-center justify-center space-x-2">
              <Calendar className="w-4 h-4 md:w-5 md:h-5" />
              <span className="hidden sm:inline">Events</span>
              <span className="sm:hidden text-xs">{events.length}</span>
            </div>
          </button>
          <button
            onClick={() => setActiveTab('media')}
            className={`flex-1 px-4 py-3 md:px-6 md:py-4 font-medium transition-colors border-b-2 ${
              activeTab === 'media'
                ? 'text-purple-600 border-purple-600'
                : 'text-gray-600 border-transparent hover:text-gray-900'
            }`}
          >
            <div className="flex items-center justify-center space-x-2">
              <Image className="w-4 h-4 md:w-5 md:h-5" />
              <span className="hidden sm:inline">Media</span>
              <span className="sm:hidden text-xs">{media.length}</span>
            </div>
          </button>
        </div>

        {/* Tab Content - Announcements */}
        {activeTab === 'announcements' && (
          <div className="p-4 md:p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Recent Announcements</h3>
            {announcements.length === 0 ? (
              <div className="text-center py-12">
                <Megaphone className="mx-auto h-12 w-12 text-gray-300 mb-4" />
                <p className="text-gray-500">No announcements yet</p>
              </div>
            ) : (
              <div className="space-y-3">
                {announcements.slice(0, 5).map((announcement) => (
                  <div key={announcement.id} className="flex items-start space-x-3 p-3 hover:bg-gray-50 rounded-lg transition-colors">
                    <div className={`w-2 h-2 rounded-full mt-2 flex-shrink-0 ${
                      announcement.is_active ? 'bg-emerald-500' : 'bg-gray-300'
                    }`} />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900 truncate">
                        {announcement.title}
                      </p>
                      <p className="text-xs text-gray-500 mt-0.5">
                        {new Date(announcement.created_at).toLocaleDateString()}
                      </p>
                    </div>
                    <span className={`text-xs font-medium px-2 py-1 rounded-full whitespace-nowrap ${
                      announcement.is_active
                        ? 'bg-emerald-100 text-emerald-700'
                        : 'bg-gray-100 text-gray-700'
                    }`}>
                      {announcement.is_active ? 'Active' : 'Inactive'}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Tab Content - Events */}
        {activeTab === 'events' && (
          <div className="p-4 md:p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Recent Events</h3>
            {events.length === 0 ? (
              <div className="text-center py-12">
                <Calendar className="mx-auto h-12 w-12 text-gray-300 mb-4" />
                <p className="text-gray-500">No events yet</p>
              </div>
            ) : (
              <div className="space-y-3">
                {events.slice(0, 5).map((event) => (
                  <div key={event.id} className="flex items-start space-x-3 p-3 hover:bg-gray-50 rounded-lg transition-colors">
                    <div className={`w-2 h-2 rounded-full mt-2 flex-shrink-0 ${
                      event.is_active ? 'bg-emerald-500' : 'bg-gray-300'
                    }`} />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900 truncate">
                        {event.title}
                      </p>
                      <p className="text-xs text-gray-500 mt-0.5">
                        {new Date(event.start_date).toLocaleDateString()}
                        {event.location && ` • ${event.location}`}
                      </p>
                    </div>
                    <span className={`text-xs font-medium px-2 py-1 rounded-full whitespace-nowrap ${
                      event.is_active
                        ? 'bg-emerald-100 text-emerald-700'
                        : 'bg-gray-100 text-gray-700'
                    }`}>
                      {event.is_active ? 'Active' : 'Inactive'}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Tab Content - Media */}
        {activeTab === 'media' && (
          <div className="p-4 md:p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Recent Media</h3>
            {media.length === 0 ? (
              <div className="text-center py-12">
                <Image className="mx-auto h-12 w-12 text-gray-300 mb-4" />
                <p className="text-gray-500">No media yet</p>
              </div>
            ) : (
              <div className="space-y-3">
                {media.slice(0, 5).map((mediaItem) => (
                  <div key={mediaItem.id} className="flex items-start space-x-3 p-3 hover:bg-gray-50 rounded-lg transition-colors">
                    <div className={`w-2 h-2 rounded-full mt-2 flex-shrink-0 ${
                      mediaItem.is_active ? 'bg-emerald-500' : 'bg-gray-300'
                    }`} />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900 truncate">
                        {mediaItem.title || 'Untitled'}
                      </p>
                      <p className="text-xs text-gray-500 mt-0.5">
                        {mediaItem.file_type} • {new Date(mediaItem.created_at).toLocaleDateString()}
                      </p>
                    </div>
                    <span className={`text-xs font-medium px-2 py-1 rounded-full whitespace-nowrap ${
                      mediaItem.is_active
                        ? 'bg-emerald-100 text-emerald-700'
                        : 'bg-gray-100 text-gray-700'
                    }`}>
                      {mediaItem.is_active ? 'Active' : 'Inactive'}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Quick Stats Summary */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 md:gap-4">
        <div className="bg-gradient-to-br from-blue-50 to-blue-100/50 rounded-xl p-4 md:p-6 border border-blue-200">
          <h4 className="text-sm font-medium text-blue-900">System Status</h4>
          <div className="flex items-center mt-3">
            <div className="w-2 h-2 bg-emerald-500 rounded-full mr-2"></div>
            <span className="text-xs md:text-sm text-blue-700">Display Online</span>
          </div>
        </div>

        <div className="bg-gradient-to-br from-green-50 to-green-100/50 rounded-xl p-4 md:p-6 border border-green-200">
          <h4 className="text-sm font-medium text-green-900">Active Items</h4>
          <p className="text-2xl font-bold text-green-600 mt-2">
            {announcements.filter(a => a.is_active).length +
             events.filter(e => e.is_active).length +
             media.filter(m => m.is_active).length}
          </p>
        </div>

        <div className="bg-gradient-to-br from-purple-50 to-purple-100/50 rounded-xl p-4 md:p-6 border border-purple-200">
          <h4 className="text-sm font-medium text-purple-900">This Week</h4>
          <p className="text-2xl font-bold text-purple-600 mt-2">
            {announcements.filter(a => {
              const createdAt = new Date(a.created_at);
              const today = new Date();
              const diffTime = Math.abs(today.getTime() - createdAt.getTime());
              const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
              return diffDays <= 7;
            }).length +
            events.filter(e => {
              const createdAt = new Date(e.created_at);
              const today = new Date();
              const diffTime = Math.abs(today.getTime() - createdAt.getTime());
              const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
              return diffDays <= 7;
            }).length +
            media.filter(m => {
              const createdAt = new Date(m.created_at);
              const today = new Date();
              const diffTime = Math.abs(today.getTime() - createdAt.getTime());
              const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
              return diffDays <= 7;
            }).length}
          </p>
        </div>
      </div>
    </div>
  );
}
