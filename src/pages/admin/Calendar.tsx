import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { Event, Announcement } from '@/types';
import { Calendar, ChevronLeft, ChevronRight, Clock, MapPin } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface CalendarEvent {
  id: string;
  title: string;
  date: Date;
  type: 'event' | 'announcement';
  data: Event | Announcement;
}

export function CalendarView() {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchEventsAndAnnouncements();
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
      <div className="flex items-center justify-center h-64">
        <div className="text-gray-400">Loading calendar...</div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row items-start md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-semibold text-gray-900">Calendar</h1>
          <p className="text-sm md:text-base text-gray-500 mt-1">Events and announcements overview</p>
        </div>
        <Button onClick={goToToday} variant="outline" className="w-full md:w-auto">
          Today
        </Button>
      </div>

      {/* Calendar Navigation */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-medium text-gray-900">
            {monthNames[currentDate.getMonth()]} {currentDate.getFullYear()}
          </h2>
          <div className="flex items-center space-x-1">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => navigateMonth('prev')}
              className="h-8 w-8 p-0 hover:bg-gray-100"
            >
              <ChevronLeft className="w-4 h-4" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => navigateMonth('next')}
              className="h-8 w-8 p-0 hover:bg-gray-100"
            >
              <ChevronRight className="w-4 h-4" />
            </Button>
          </div>
        </div>

        {/* Calendar Grid */}
        <div className="grid grid-cols-7 gap-px bg-gray-100 rounded-lg overflow-hidden">
          {/* Day headers */}
          {dayNames.map(day => (
            <div key={day} className="bg-gray-50 p-4 text-center text-sm font-medium text-gray-600">
              {day}
            </div>
          ))}

          {/* Calendar days */}
          {days.map((date, index) => {
            if (!date) {
              return <div key={index} className="bg-white p-4"></div>;
            }

            const dayEvents = getEventsForDate(date);
            const isToday = date.toDateString() === new Date().toDateString();
            const isCurrentMonth = date.getMonth() === currentDate.getMonth();

            return (
              <div
                key={index}
                className={`bg-white p-4 min-h-[120px] hover:bg-gray-50 transition-colors ${
                  isToday ? 'bg-blue-50/50' : ''
                }`}
              >
                <div className={`text-sm font-medium mb-3 ${
                  isToday
                    ? 'text-blue-600'
                    : isCurrentMonth
                    ? 'text-gray-900'
                    : 'text-gray-400'
                }`}>
                  {date.getDate()}
                </div>

                {/* Events for this day */}
                <div className="space-y-2">
                  {dayEvents.slice(0, 3).map(event => (
                    <div
                      key={event.id}
                      className="flex items-center space-x-1"
                      title={event.title}
                    >
                      <div className={`w-2 h-2 rounded-full ${
                        event.type === 'event' ? 'bg-emerald-400' : 'bg-blue-400'
                      }`}></div>
                      <span className="text-xs text-gray-600 truncate flex-1">
                        {event.title}
                      </span>
                    </div>
                  ))}
                  {dayEvents.length > 3 && (
                    <div className="text-xs text-gray-400 px-1">
                      +{dayEvents.length - 3}
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Upcoming Events Summary */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
        <h3 className="text-lg font-medium text-gray-900 mb-6 flex items-center space-x-2">
          <Clock className="w-5 h-5 text-gray-400" />
          <span>Upcoming</span>
        </h3>
        <div className="space-y-4">
          {events
            .filter(event => event.date >= new Date())
            .sort((a, b) => a.date.getTime() - b.date.getTime())
            .slice(0, 10)
            .map(event => (
              <div key={event.id} className="flex items-start space-x-4 p-4 hover:bg-gray-50 rounded-xl transition-colors">
                <div className={`w-3 h-3 rounded-full mt-2 flex-shrink-0 ${
                  event.type === 'event' ? 'bg-emerald-400' : 'bg-blue-400'
                }`}></div>
                <div className="flex-1 min-w-0">
                  <h4 className="font-medium text-gray-900 truncate">{event.title}</h4>
                  <div className="flex items-center space-x-4 text-sm text-gray-500 mt-1">
                    <span>{event.date.toLocaleDateString()}</span>
                    {event.type === 'event' && (event.data as Event).location && (
                      <span className="flex items-center space-x-1">
                        <MapPin className="w-3 h-3" />
                        <span className="truncate">{(event.data as Event).location}</span>
                      </span>
                    )}
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                      event.type === 'event'
                        ? 'bg-emerald-100 text-emerald-700'
                        : 'bg-blue-100 text-blue-700'
                    }`}>
                      {event.type}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          {events.filter(event => event.date >= new Date()).length === 0 && (
            <div className="text-center py-12 text-gray-400">
              <Calendar className="w-8 h-8 mx-auto mb-3 opacity-50" />
              <p>No upcoming events</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
