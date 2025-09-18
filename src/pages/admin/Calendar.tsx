import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { Event, Announcement } from '@/types';
import { Calendar, ChevronLeft, ChevronRight, Clock, MapPin, Megaphone } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

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
        <div className="text-gray-500">Loading calendar...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Calendar View</h1>
          <p className="text-gray-600">View all events and announcements in calendar format</p>
        </div>
        <Button onClick={goToToday} variant="outline">
          Today
        </Button>
      </div>

      {/* Calendar Navigation */}
      <Card>
        <CardHeader className="pb-4">
          <div className="flex items-center justify-between">
            <CardTitle className="text-xl">
              {monthNames[currentDate.getMonth()]} {currentDate.getFullYear()}
            </CardTitle>
            <div className="flex items-center space-x-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => navigateMonth('prev')}
              >
                <ChevronLeft className="w-4 h-4" />
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => navigateMonth('next')}
              >
                <ChevronRight className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </CardHeader>

        <CardContent>
          {/* Calendar Grid */}
          <div className="grid grid-cols-7 gap-1">
            {/* Day headers */}
            {dayNames.map(day => (
              <div key={day} className="p-3 text-center font-medium text-gray-700 bg-gray-50 rounded">
                {day}
              </div>
            ))}

            {/* Calendar days */}
            {days.map((date, index) => {
              if (!date) {
                return <div key={index} className="p-3 bg-gray-50 rounded"></div>;
              }

              const dayEvents = getEventsForDate(date);
              const isToday = date.toDateString() === new Date().toDateString();
              const isCurrentMonth = date.getMonth() === currentDate.getMonth();

              return (
                <div
                  key={index}
                  className={`min-h-[120px] p-2 border rounded-lg ${
                    isToday
                      ? 'bg-blue-50 border-blue-200'
                      : isCurrentMonth
                      ? 'bg-white border-gray-200'
                      : 'bg-gray-50 border-gray-100'
                  }`}
                >
                  <div className={`text-sm font-medium mb-2 ${
                    isToday
                      ? 'text-blue-600'
                      : isCurrentMonth
                      ? 'text-gray-900'
                      : 'text-gray-400'
                  }`}>
                    {date.getDate()}
                  </div>

                  {/* Events for this day */}
                  <div className="space-y-1">
                    {dayEvents.slice(0, 3).map(event => (
                      <div
                        key={event.id}
                        className={`text-xs p-1 rounded truncate ${
                          event.type === 'event'
                            ? 'bg-green-100 text-green-800'
                            : 'bg-blue-100 text-blue-800'
                        }`}
                        title={event.title}
                      >
                        {event.type === 'event' ? '📅' : '📢'} {event.title}
                      </div>
                    ))}
                    {dayEvents.length > 3 && (
                      <div className="text-xs text-gray-500 px-1">
                        +{dayEvents.length - 3} more
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Upcoming Events Summary */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Clock className="w-5 h-5" />
            <span>Upcoming Events & Announcements</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {events
              .filter(event => event.date >= new Date())
              .sort((a, b) => a.date.getTime() - b.date.getTime())
              .slice(0, 10)
              .map(event => (
                <div key={event.id} className="flex items-start space-x-3 p-3 border rounded-lg">
                  <div className={`p-2 rounded-full ${
                    event.type === 'event' ? 'bg-green-100' : 'bg-blue-100'
                  }`}>
                    {event.type === 'event' ? (
                      <Calendar className="w-4 h-4 text-green-600" />
                    ) : (
                      <Megaphone className="w-4 h-4 text-blue-600" />
                    )}
                  </div>
                  <div className="flex-1">
                    <h4 className="font-medium text-gray-900">{event.title}</h4>
                    <div className="flex items-center space-x-4 text-sm text-gray-600 mt-1">
                      <span className="flex items-center space-x-1">
                        <Clock className="w-3 h-3" />
                        <span>{event.date.toLocaleDateString()}</span>
                      </span>
                      {event.type === 'event' && (event.data as Event).location && (
                        <span className="flex items-center space-x-1">
                          <MapPin className="w-3 h-3" />
                          <span>{(event.data as Event).location}</span>
                        </span>
                      )}
                      <span className={`px-2 py-1 rounded-full text-xs ${
                        event.type === 'event'
                          ? 'bg-green-100 text-green-800'
                          : 'bg-blue-100 text-blue-800'
                      }`}>
                        {event.type === 'event' ? 'Event' : 'Announcement'}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            {events.filter(event => event.date >= new Date()).length === 0 && (
              <div className="text-center py-8 text-gray-500">
                No upcoming events or announcements
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
