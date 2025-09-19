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
      color: 'bg-blue-500',
      bgColor: 'bg-blue-50',
      textColor: 'text-blue-600'
    },
    {
      title: 'Total Events',
      value: events.length,
      icon: Calendar,
      color: 'bg-green-500',
      bgColor: 'bg-green-50',
      textColor: 'text-green-600'
    },
    {
      title: 'Total Media',
      value: media.length,
      icon: Image,
      color: 'bg-purple-500',
      bgColor: 'bg-purple-50',
      textColor: 'text-purple-600'
    },
    {
      title: 'Active Content',
      value: announcements.filter(a => a.is_active).length + 
             events.filter(e => e.is_active).length + 
             media.filter(m => m.is_active).length,
      icon: Activity,
      color: 'bg-emerald-500',
      bgColor: 'bg-emerald-50',
      textColor: 'text-emerald-600'
    }
  ];

  const recentAnnouncements = announcements.slice(0, 3);
  const recentEvents = events.slice(0, 3);
  const recentMedia = media.slice(0, 3);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-gray-400">Loading dashboard...</div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-light text-gray-900">Dashboard</h1>
        <p className="text-gray-500 mt-1">Smart TV content management overview</p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat, index) => (
          <div key={index} className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-500">{stat.title}</p>
                <p className={`text-3xl font-light ${stat.textColor} mt-1`}>
                  {stat.value}
                </p>
              </div>
              <div className={`p-3 rounded-xl ${stat.bgColor}`}>
                <stat.icon className={`h-6 w-6 ${stat.textColor}`} />
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Recent Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Recent Announcements */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4 flex items-center space-x-2">
            <Megaphone className="h-5 w-5 text-blue-500" />
            <span>Recent Announcements</span>
          </h3>
          {recentAnnouncements.length === 0 ? (
            <div className="text-center py-8 text-gray-400">
              <Megaphone className="mx-auto h-8 w-8 opacity-50 mb-2" />
              <p>No announcements yet</p>
            </div>
          ) : (
            <div className="space-y-3">
              {recentAnnouncements.map((announcement) => (
                <div key={announcement.id} className="flex items-start space-x-3 p-3 hover:bg-gray-50 rounded-xl transition-colors">
                  <div className={`w-2 h-2 rounded-full mt-2 flex-shrink-0 ${
                    announcement.is_active ? 'bg-emerald-400' : 'bg-gray-300'
                  }`} />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900 truncate">
                      {announcement.title}
                    </p>
                    <p className="text-xs text-gray-500 mt-1">
                      {new Date(announcement.created_at).toLocaleDateString()}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Recent Events */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4 flex items-center space-x-2">
            <Calendar className="h-5 w-5 text-green-500" />
            <span>Recent Events</span>
          </h3>
          {recentEvents.length === 0 ? (
            <div className="text-center py-8 text-gray-400">
              <Calendar className="mx-auto h-8 w-8 opacity-50 mb-2" />
              <p>No events yet</p>
            </div>
          ) : (
            <div className="space-y-3">
              {recentEvents.map((event) => (
                <div key={event.id} className="flex items-start space-x-3 p-3 hover:bg-gray-50 rounded-xl transition-colors">
                  <div className={`w-2 h-2 rounded-full mt-2 flex-shrink-0 ${
                    event.is_active ? 'bg-emerald-400' : 'bg-gray-300'
                  }`} />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900 truncate">
                      {event.title}
                    </p>
                    <p className="text-xs text-gray-500 mt-1">
                      {new Date(event.start_date).toLocaleDateString()}
                      {event.location && ` • ${event.location}`}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Recent Media */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4 flex items-center space-x-2">
            <Image className="h-5 w-5 text-purple-500" />
            <span>Recent Media</span>
          </h3>
          {recentMedia.length === 0 ? (
            <div className="text-center py-8 text-gray-400">
              <Image className="mx-auto h-8 w-8 opacity-50 mb-2" />
              <p>No media yet</p>
            </div>
          ) : (
            <div className="space-y-3">
              {recentMedia.map((mediaItem) => (
                <div key={mediaItem.id} className="flex items-start space-x-3 p-3 hover:bg-gray-50 rounded-xl transition-colors">
                  <div className={`w-2 h-2 rounded-full mt-2 flex-shrink-0 ${
                    mediaItem.is_active ? 'bg-emerald-400' : 'bg-gray-300'
                  }`} />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900 truncate">
                      {mediaItem.title}
                    </p>
                    <p className="text-xs text-gray-500 mt-1">
                      {mediaItem.file_type} • {new Date(mediaItem.created_at).toLocaleDateString()}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Quick Actions */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
        <h3 className="text-lg font-medium text-gray-900 mb-6 flex items-center space-x-2">
          <Activity className="h-5 w-5 text-emerald-500" />
          <span>Quick Actions</span>
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="p-4 bg-blue-50/50 rounded-xl border border-blue-100 hover:bg-blue-50/70 transition-colors">
            <h4 className="font-medium text-blue-900">System Status</h4>
            <p className="text-sm text-blue-700 mt-1">All systems operational</p>
            <div className="flex items-center mt-3">
              <div className="w-2 h-2 bg-emerald-400 rounded-full mr-2"></div>
              <span className="text-xs text-emerald-600">Display Online</span>
            </div>
          </div>

          <div className="p-4 bg-green-50/50 rounded-xl border border-green-100 hover:bg-green-50/70 transition-colors">
            <h4 className="font-medium text-green-900">Content Overview</h4>
            <p className="text-sm text-green-700 mt-1">
              {announcements.filter(a => a.is_active).length +
               events.filter(e => e.is_active).length +
               media.filter(m => m.is_active).length} active items
            </p>
          </div>

          <div className="p-4 bg-purple-50/50 rounded-xl border border-purple-100 hover:bg-purple-50/70 transition-colors">
            <h4 className="font-medium text-purple-900">Recent Activity</h4>
            <p className="text-sm text-purple-700 mt-1">
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
              }).length} items this week
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
