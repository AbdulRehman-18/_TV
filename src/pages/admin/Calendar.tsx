import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { Event, Announcement, Media } from '@/types';
import { Calendar as CalendarIcon, ChevronLeft, ChevronRight, Clock, MapPin, MoreHorizontal, Image, Video, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
interface CalendarEvent {
  id: string;
  title: string;
  date: Date;
  type: 'event' | 'announcement' | 'media';
  data: Event | Announcement | Media;
}

export function CalendarView() {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedEvent, setSelectedEvent] = useState<CalendarEvent | null>(null);

  useEffect(() => {
    fetchEventsAndAnnouncements();

    // Set up real-time subscriptions for events
    const eventsSubscription = supabase
      .channel('calendar-events')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'events',
        },
        () => {
          console.log('Events updated, refreshing calendar...');
          fetchEventsAndAnnouncements();
        }
      )
      .subscribe();

    // Set up real-time subscriptions for announcements
    const announcementsSubscription = supabase
      .channel('calendar-announcements')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'announcements',
        },
        () => {
          console.log('Announcements updated, refreshing calendar...');
          fetchEventsAndAnnouncements();
        }
      )
      .subscribe();

    // Set up real-time subscriptions for media
    const mediaSubscription = supabase
      .channel('calendar-media')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'media',
        },
        () => {
          console.log('Media updated, refreshing calendar...');
          fetchEventsAndAnnouncements();
        }
      )
      .subscribe();

    return () => {
      eventsSubscription.unsubscribe();
      announcementsSubscription.unsubscribe();
      mediaSubscription.unsubscribe();
    };
  }, []);

  const fetchEventsAndAnnouncements = async () => {
    try {
      setLoading(true);

      // Fetch events
      const { data: eventsData, error: eventsError } = await supabase
        .from('events')
        .select('*')
        .eq('is_active', true)
        .order('start_date', { ascending: true });

      if (eventsError) throw eventsError;

      // Fetch announcements
      const { data: announcementsData, error: announcementsError } = await supabase
        .from('announcements')
        .select('*')
        .eq('is_active', true)
        .order('created_at', { ascending: true });

      if (announcementsError) throw announcementsError;

      // Fetch media
      const { data: mediaData, error: mediaError } = await supabase
        .from('media')
        .select('*')
        .eq('is_active', true)
        .order('created_at', { ascending: true });

      if (mediaError) throw mediaError;

      // Combine and format events
      const calendarEvents: CalendarEvent[] = [];

      // Add events
      eventsData?.forEach(event => {
        calendarEvents.push({
          id: event.id,
          title: event.title,
          date: new Date(event.start_date),
          type: 'event',
          data: event
        });
      });

      // Add announcements (show on creation date)
      announcementsData?.forEach(announcement => {
        calendarEvents.push({
          id: announcement.id,
          title: announcement.title,
          date: new Date(announcement.created_at),
          type: 'announcement',
          data: announcement
        });
      });

      // Add media (show on creation date)
      mediaData?.forEach(media => {
        calendarEvents.push({
          id: media.id,
          title: media.title || media.file_name || 'Untitled Media',
          date: new Date(media.created_at),
          type: 'media',
          data: media
        });
      });

      setEvents(calendarEvents);
    } catch (error) {
      console.error('Error fetching calendar data:', error);
    } finally {
      setLoading(false);
    }
  };

  const getDaysInMonth = (date: Date) => {
    const year = date.getFullYear();
    const month = date.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const daysInMonth = lastDay.getDate();
    const startingDayOfWeek = firstDay.getDay();

    const days = [];

    // Add empty cells for days before the first day of the month
    for (let i = 0; i < startingDayOfWeek; i++) {
      days.push(null);
    }

    // Add days of the month
    for (let day = 1; day <= daysInMonth; day++) {
      days.push(new Date(year, month, day));
    }

    return days;
  };

  const getEventsForDate = (date: Date) => {
    return events.filter(event =>
      event.date.toDateString() === date.toDateString()
    );
  };

  const navigateMonth = (direction: 'prev' | 'next') => {
    setCurrentDate(prevDate => {
      const newDate = new Date(prevDate);
      if (direction === 'prev') {
        newDate.setMonth(newDate.getMonth() - 1);
      } else {
        newDate.setMonth(newDate.getMonth() + 1);
      }
      return newDate;
    });
  };

  const goToToday = () => {
    setCurrentDate(new Date());
  };

  const days = getDaysInMonth(currentDate);
  const monthNames = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];
  const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="flex flex-col items-center gap-3">
          <div className="w-6 h-6 border-2 border-gray-900 border-t-transparent rounded-full animate-spin"></div>
          <p className="text-sm text-gray-500 font-medium">Loading calendar...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto space-y-8 p-1">
      {/* Header */}
      <div className="flex flex-col md:flex-row items-start md:items-end justify-between gap-4 pb-4 border-b border-gray-100">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-gray-900">Calendar</h1>
          <p className="text-gray-500 mt-1">Manage events and announcements.</p>
        </div>

        <div className="flex items-center gap-2 bg-gray-50 p-1 rounded-lg border border-gray-100">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => navigateMonth('prev')}
            className="h-8 w-8 hover:bg-white hover:shadow-sm"
          >
            <ChevronLeft className="w-4 h-4 text-gray-600" />
          </Button>
          <div className="px-4 font-semibold text-gray-900 min-w-[140px] text-center select-none">
            {monthNames[currentDate.getMonth()]} {currentDate.getFullYear()}
          </div>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => navigateMonth('next')}
            className="h-8 w-8 hover:bg-white hover:shadow-sm"
          >
            <ChevronRight className="w-4 h-4 text-gray-600" />
          </Button>
        </div>

        <Button onClick={goToToday} variant="outline" size="sm" className="hidden md:flex">
          Today
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Main Calendar Grid */}
        <div className="lg:col-span-8 xl:col-span-9 bg-white rounded-xl shadow-[0_2px_20px_-4px_rgba(0,0,0,0.05)] border border-gray-100 overflow-hidden">
          {/* Day Headers */}
          <div className="grid grid-cols-7 border-b border-gray-100">
            {dayNames.map(day => (
              <div key={day} className="py-3 text-center text-xs font-semibold uppercase tracking-wider text-gray-400 bg-white">
                {day}
              </div>
            ))}
          </div>

          {/* Calendar Body */}
          <div className="grid grid-cols-7 auto-rows-fr">
            {days.map((date, index) => {
              // Empty cells padding
              if (!date) {
                return <div key={`empty-${index}`} className="min-h-[140px] bg-gray-50/30 border-b border-r border-gray-100/50 last:border-r-0" />;
              }

              const dayEvents = getEventsForDate(date);
              const isToday = date.toDateString() === new Date().toDateString();
              const isWeekend = date.getDay() === 0 || date.getDay() === 6;

              return (
                <div
                  key={index}
                  className={`min-h-[140px] p-2 border-b border-r border-gray-100 transition-all hover:bg-gray-50/50 group relative
                    ${(index + 1) % 7 === 0 ? 'border-r-0' : ''}
                    ${isWeekend ? 'bg-gray-[5px]' : 'bg-white'}
                  `}
                >
                  {/* Date Number */}
                  <div className="flex justify-between items-start mb-2">
                    <span className={`
                        text-sm font-medium w-7 h-7 flex items-center justify-center rounded-full
                        ${isToday
                        ? 'bg-gray-900 text-white shadow-md'
                        : 'text-gray-500 group-hover:text-gray-900'
                      }
                    `}>
                      {date.getDate()}
                    </span>
                  </div>

                  {/* Events List */}
                  <div className="space-y-1.5">
                    {dayEvents.slice(0, 3).map(event => (
                      <button
                        key={event.id}
                        onClick={() => setSelectedEvent(event)}
                        className={`
                            w-full px-2 py-1 rounded text-xs truncate font-medium border text-left
                            hover:shadow-sm transition-all cursor-pointer
                            ${event.type === 'event'
                            ? 'bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100'
                            : event.type === 'announcement'
                            ? 'bg-blue-50 text-blue-700 border-blue-200 hover:bg-blue-100'
                            : 'bg-purple-50 text-purple-700 border-purple-200 hover:bg-purple-100'
                          }
                        `}
                        title={event.title}
                      >
                        <div className="flex items-center gap-1">
                          {event.type === 'media' && (
                            (event.data as Media).file_type === 'video' ? (
                              <Video className="w-3 h-3 flex-shrink-0" />
                            ) : (
                              <Image className="w-3 h-3 flex-shrink-0" />
                            )
                          )}
                          <span className="truncate">{event.title}</span>
                        </div>
                      </button>
                    ))}

                    {dayEvents.length > 3 && (
                      <div className="flex items-center gap-1 pl-1 text-[10px] font-medium text-gray-400">
                        <MoreHorizontal className="w-3 h-3" />
                        <span>{dayEvents.length - 3} more</span>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Sidebar: Upcoming Events */}
        <div className="lg:col-span-4 xl:col-span-3 space-y-6">
          <div className="bg-white rounded-xl shadow-[0_2px_20px_-4px_rgba(0,0,0,0.05)] border border-gray-100 p-6">
            <div className="flex items-center justify-between mb-6">
              <h3 className="font-semibold text-gray-900 flex items-center gap-2">
                <Clock className="w-4 h-4 text-gray-500" />
                Upcoming
              </h3>
              <span className="text-xs font-medium text-gray-400 bg-gray-100 px-2 py-1 rounded-full">
                Next 10
              </span>
            </div>

            <div className="space-y-1 relative">
              {/* Decorative Timeline Line (Optional, simple version used here) */}
              <div className="absolute left-[19px] top-2 bottom-2 w-px bg-gray-100" />

              {events
                .filter(event => event.date >= new Date())
                .sort((a, b) => a.date.getTime() - b.date.getTime())
                .slice(0, 10)
.map((event) => (
                  <button
                    key={event.id}
                    onClick={() => setSelectedEvent(event)}
                    className="relative pl-8 py-2 group w-full text-left"
                  >
                    {/* Timeline Dot */}
                    <div className={`
                                absolute left-4 top-4 -translate-x-1/2 w-2.5 h-2.5 rounded-full border-2 border-white ring-1 z-10
                                ${event.type === 'event'
                                  ? 'bg-emerald-500 ring-emerald-100'
                                  : event.type === 'announcement'
                                  ? 'bg-blue-500 ring-blue-100'
                                  : 'bg-purple-500 ring-purple-100'
                                }
                            `}></div>

                    <div className="p-3 rounded-lg hover:bg-gray-50 transition-colors border border-transparent hover:border-gray-100">
                      <div className="flex items-center gap-2 mb-1.5">
                        {event.type === 'media' && (
                          (event.data as Media).file_type === 'video' ? (
                            <Video className="w-3.5 h-3.5 text-purple-600 flex-shrink-0" />
                          ) : (
                            <Image className="w-3.5 h-3.5 text-purple-600 flex-shrink-0" />
                          )
                        )}
                        <h4 className="text-sm font-semibold text-gray-900 truncate leading-none">{event.title}</h4>
                      </div>
                      <div className="flex flex-col gap-1">
                        <span className="text-xs text-gray-500 font-medium">
                          {event.date.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}
                        </span>

                        {event.type === 'event' && (event.data as Event).location && (
                          <div className="flex items-center gap-1 text-xs text-gray-400">
                            <MapPin className="w-3 h-3" />
                            <span className="truncate max-w-[180px]">{(event.data as Event).location}</span>
                          </div>
                        )}
                      </div>
                    </div>
                  </button>
                ))}

              {events.filter(event => event.date >= new Date()).length === 0 && (
                <div className="text-center py-12">
                  <div className="bg-gray-50 w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-3">
                    <CalendarIcon className="w-5 h-5 text-gray-400" />
                  </div>
                  <p className="text-sm font-medium text-gray-900">No upcoming events</p>
                  <p className="text-xs text-gray-500 mt-1">Check back later for updates</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Event Details Modal */}
      {selectedEvent && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" onClick={() => setSelectedEvent(null)}>
          <div className="bg-white rounded-xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
            {/* Header */}
            <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className={`
                  w-10 h-10 rounded-lg flex items-center justify-center
                  ${selectedEvent.type === 'event'
                    ? 'bg-emerald-100 text-emerald-600'
                    : selectedEvent.type === 'announcement'
                    ? 'bg-blue-100 text-blue-600'
                    : 'bg-purple-100 text-purple-600'
                  }
                `}>
                  {selectedEvent.type === 'event' ? (
                    <CalendarIcon className="w-5 h-5" />
                  ) : selectedEvent.type === 'media' ? (
                    (selectedEvent.data as Media).file_type === 'video' ? (
                      <Video className="w-5 h-5" />
                    ) : (
                      <Image className="w-5 h-5" />
                    )
                  ) : (
                    <CalendarIcon className="w-5 h-5" />
                  )}
                </div>
                <div>
                  <h2 className="text-xl font-bold text-gray-900">{selectedEvent.title}</h2>
                  <p className="text-sm text-gray-500 capitalize">{selectedEvent.type}</p>
                </div>
              </div>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setSelectedEvent(null)}
                className="flex-shrink-0"
              >
                <X className="w-5 h-5" />
              </Button>
            </div>

            {/* Content */}
            <div className="p-6 space-y-4">
              {/* Date */}
              <div className="flex items-center gap-3 text-gray-700">
                <Clock className="w-5 h-5 text-gray-400" />
                <span className="font-medium">
                  {selectedEvent.date.toLocaleDateString(undefined, {
                    weekday: 'long',
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric'
                  })}
                </span>
              </div>

              {/* Event-specific details */}
              {selectedEvent.type === 'event' && (
                <>
                  {(selectedEvent.data as Event).location && (
                    <div className="flex items-center gap-3 text-gray-700">
                      <MapPin className="w-5 h-5 text-gray-400" />
                      <span>{(selectedEvent.data as Event).location}</span>
                    </div>
                  )}
                  {(selectedEvent.data as Event).description && (
                    <div className="mt-4">
                      <h3 className="font-semibold text-gray-900 mb-2">Description</h3>
                      <p className="text-gray-600 leading-relaxed">{(selectedEvent.data as Event).description}</p>
                    </div>
                  )}
                  {(selectedEvent.data as Event).image_url && (
                    <div className="mt-4">
                      <h3 className="font-semibold text-gray-900 mb-2">Event Image</h3>
                      <img
                        src={(selectedEvent.data as Event).image_url}
                        alt={selectedEvent.title}
                        className="w-full rounded-lg border border-gray-200"
                      />
                    </div>
                  )}
                </>
              )}

              {/* Announcement-specific details */}
              {selectedEvent.type === 'announcement' && (
                <>
                  {(selectedEvent.data as Announcement).body && (
                    <div className="mt-4">
                      <h3 className="font-semibold text-gray-900 mb-2">Message</h3>
                      <p className="text-gray-600 leading-relaxed">{(selectedEvent.data as Announcement).body}</p>
                    </div>
                  )}
                  {(selectedEvent.data as Announcement).image_url && (
                    <div className="mt-4">
                      <h3 className="font-semibold text-gray-900 mb-2">Image</h3>
                      <img
                        src={(selectedEvent.data as Announcement).image_url}
                        alt={selectedEvent.title}
                        className="w-full rounded-lg border border-gray-200"
                      />
                    </div>
                  )}
                </>
              )}

              {/* Media-specific details */}
              {selectedEvent.type === 'media' && (
                <>
                  <div className="flex items-center gap-3 text-gray-700">
                    {(selectedEvent.data as Media).file_type === 'video' ? (
                      <Video className="w-5 h-5 text-gray-400" />
                    ) : (
                      <Image className="w-5 h-5 text-gray-400" />
                    )}
                    <span className="capitalize">{(selectedEvent.data as Media).file_type} File</span>
                  </div>
                  {(selectedEvent.data as Media).description && (
                    <div className="mt-4">
                      <h3 className="font-semibold text-gray-900 mb-2">Description</h3>
                      <p className="text-gray-600 leading-relaxed">{(selectedEvent.data as Media).description}</p>
                    </div>
                  )}
                  <div className="mt-4">
                    <h3 className="font-semibold text-gray-900 mb-2">Preview</h3>
                    {(selectedEvent.data as Media).file_type === 'video' ? (
                      <video
                        src={(selectedEvent.data as Media).file_url}
                        controls
                        className="w-full rounded-lg border border-gray-200"
                      />
                    ) : (
                      <img
                        src={(selectedEvent.data as Media).file_url}
                        alt={selectedEvent.title}
                        className="w-full rounded-lg border border-gray-200"
                      />
                    )}
                  </div>
                  <div className="mt-4 p-4 bg-gray-50 rounded-lg border border-gray-200">
                    <h3 className="font-semibold text-gray-900 mb-2">File Details</h3>
                    <div className="space-y-1 text-sm">
                      <div className="flex justify-between">
                        <span className="text-gray-500">File Name:</span>
                        <span className="text-gray-900 font-medium">{(selectedEvent.data as Media).file_name}</span>
                      </div>
                      {(selectedEvent.data as Media).file_size && (
                        <div className="flex justify-between">
                          <span className="text-gray-500">File Size:</span>
                          <span className="text-gray-900 font-medium">
                            {((selectedEvent.data as Media).file_size! / 1024 / 1024).toFixed(2)} MB
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                </>
              )}
            </div>

            {/* Footer */}
            <div className="sticky bottom-0 bg-gray-50 border-t border-gray-200 px-6 py-4 flex justify-end gap-2">
              <Button
                variant="outline"
                onClick={() => setSelectedEvent(null)}
              >
                Close
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}