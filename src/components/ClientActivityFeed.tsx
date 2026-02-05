import { useState } from 'react';
import { Media, Announcement, Event } from '@/types';
import { ClientMediaCard } from '@/components/ClientMediaCard';
import { ClientAnnouncementCard } from '@/components/ClientAnnouncementCard';
import { ClientEventCard } from '@/components/ClientEventCard';
import { Image, Megaphone, Calendar, Filter, Archive } from 'lucide-react';


interface ClientActivityFeedProps {
  media: Media[];
  announcements: Announcement[];
  events: Event[];
  onDeleteMedia: (id: string) => void;
  onDeleteAnnouncement: (id: string) => void;
  onDeleteEvent: (id: string) => void;
}

type FilterType = 'all' | 'media' | 'announcements' | 'events';

export function ClientActivityFeed({
  media,
  announcements,
  events,
  onDeleteMedia,
  onDeleteAnnouncement,
  onDeleteEvent
}: ClientActivityFeedProps) {
  const [filter, setFilter] = useState<FilterType>('all');

  // Combine and sort all items by creation date (newest first)
  const getAllItems = () => {
    const mediaItems = media.map(m => ({ ...m, type: 'media' as const }));
    const announcementItems = announcements.map(a => ({ ...a, type: 'announcement' as const }));
    const eventItems = events.map(e => ({ ...e, type: 'event' as const }));

    return [...mediaItems, ...announcementItems, ...eventItems].sort((a, b) => 
      new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
    );
  };

  const getFilteredItems = () => {
    const all = getAllItems();
    if (filter === 'all') return all;
    return all.filter(item => item.type === filter.slice(0, -1)); // Remove 's' from filter name to match type
  };

  const filteredItems = getFilteredItems();

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <h3 className="text-lg font-bold text-gray-900 flex items-center gap-2">
          <Archive className="w-5 h-5 text-gray-500" />
          Content Feed
        </h3>
        
        <div className="flex items-center gap-2 p-1 bg-gray-100/80 rounded-lg overflow-x-auto">
          <FilterButton 
            active={filter === 'all'} 
            onClick={() => setFilter('all')} 
            label="All" 
          />
          <FilterButton 
            active={filter === 'media'} 
            onClick={() => setFilter('media')} 
            label="Media"
            icon={<Image className="w-4 h-4" />}
          />
          <FilterButton 
            active={filter === 'announcements'} 
            onClick={() => setFilter('announcements')} 
            label="Announcements" 
            icon={<Megaphone className="w-4 h-4" />}
          />
          <FilterButton 
            active={filter === 'events'} 
            onClick={() => setFilter('events')} 
            label="Events" 
            icon={<Calendar className="w-4 h-4" />}
          />
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredItems.length === 0 ? (
          <div className="col-span-full py-16 text-center bg-gray-50 rounded-2xl border-2 border-dashed border-gray-200">
            <Filter className="w-12 h-12 text-gray-300 mx-auto mb-3" />
            <p className="text-gray-500 font-medium">No items found</p>
            <p className="text-sm text-gray-400">Try changing the filter or upload new content</p>
          </div>
        ) : (
          filteredItems.map((item) => {
            if (item.type === 'media') {
              return (
                <ClientMediaCard 
                  key={`media-${item.id}`} 
                  media={item as Media} 
                  onDelete={onDeleteMedia} 
                />
              );
            } else if (item.type === 'announcement') {
              return (
                <ClientAnnouncementCard 
                  key={`announcement-${item.id}`} 
                  announcement={item as Announcement} 
                  onDelete={onDeleteAnnouncement} 
                />
              );
            } else {
              return (
                <ClientEventCard 
                  key={`event-${item.id}`} 
                  event={item as Event} 
                  onDelete={onDeleteEvent} 
                />
              );
            }
          })
        )}
      </div>
    </div>
  );
}

function FilterButton({ 
  active, 
  onClick, 
  label, 
  icon 
}: { 
  active: boolean; 
  onClick: () => void; 
  label: string; 
  icon?: React.ReactNode; 
}) {
  return (
    <button
      onClick={onClick}
      className={`
        flex items-center gap-2 px-3 py-1.5 rounded-md text-sm font-medium transition-all whitespace-nowrap
        ${active 
          ? 'bg-white text-gray-900 shadow-sm' 
          : 'text-gray-600 hover:text-gray-900 hover:bg-gray-200/50'
        }
      `}
    >
      {icon}
      {label}
    </button>
  );
}
