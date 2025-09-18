import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { EventCard } from '@/components/EventCard';
import { EventForm } from '@/components/EventForm';
import { Plus, Calendar, RefreshCw, MapPin, Clock } from 'lucide-react';
import { Event } from '@/types';

export function Events() {
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingEvent, setEditingEvent] = useState<Event | undefined>();

  useEffect(() => {
    loadEvents();
  }, []);

  const loadEvents = async () => {
    try {
      const { data, error } = await supabase
        .from('events')
        .select('*')
        .order('start_date', { ascending: true });

      if (error) throw error;

      setEvents(data || []);
    } catch (error) {
      console.error('Error loading events:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateNew = () => {
    setEditingEvent(undefined);
    setShowForm(true);
  };

  const handleEdit = (event: Event) => {
    setEditingEvent(event);
    setShowForm(true);
  };

  const handleFormSubmit = (event: Event) => {
    if (editingEvent) {
      // Update existing event
      setEvents(prev => prev.map(e => e.id === event.id ? event : e));
    } else {
      // Add new event
      setEvents(prev => [event, ...prev]);
    }

    setShowForm(false);
    setEditingEvent(undefined);
  };

  const handleDelete = (id: string) => {
    setEvents(prev => prev.filter(e => e.id !== id));
  };

  const handleToggleActive = (id: string, isActive: boolean) => {
    setEvents(prev => prev.map(e => e.id === id ? { ...e, is_active: isActive } : e));
  };

  // Helper functions for statistics
  const getUpcomingEvents = () => {
    return events.filter(event => {
      const startDate = new Date(event.start_date);
      const now = new Date();
      return startDate > now && event.is_active;
    });
  };

  const getOngoingEvents = () => {
    return events.filter(event => {
      const startDate = new Date(event.start_date);
      const endDate = event.end_date ? new Date(event.end_date) : null;
      const now = new Date();
      return startDate <= now && (!endDate || endDate >= now) && event.is_active;
    });
  };

  const getPastEvents = () => {
    return events.filter(event => {
      const endDate = event.end_date ? new Date(event.end_date) : new Date(event.start_date);
      const now = new Date();
      return endDate < now && event.is_active;
    });
  };

  if (showForm) {
    return (
      <div className="max-w-4xl">
        <EventForm
          event={editingEvent}
          onSubmit={handleFormSubmit}
          onCancel={() => {
            setShowForm(false);
            setEditingEvent(undefined);
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
          <h1 className="text-2xl font-bold text-gray-900">Events</h1>
          <p className="text-gray-600">Manage your events and schedules</p>
        </div>
        <div className="flex items-center space-x-3">
          <Button
            variant="outline"
            onClick={loadEvents}
            size="icon"
            title="Refresh"
          >
            <RefreshCw className="h-4 w-4" />
          </Button>
          <Button onClick={handleCreateNew} className="flex items-center space-x-2">
            <Plus className="h-4 w-4" />
            <span>Create New Event</span>
          </Button>
        </div>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-6 text-center">
            <div className="text-2xl font-bold text-blue-600">
              {events.length}
            </div>
            <div className="text-sm text-blue-600">Total Events</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6 text-center">
            <div className="text-2xl font-bold text-green-600">
              {getUpcomingEvents().length}
            </div>
            <div className="text-sm text-green-600">Upcoming</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6 text-center">
            <div className="text-2xl font-bold text-purple-600">
              {getOngoingEvents().length}
            </div>
            <div className="text-sm text-purple-600">Ongoing</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6 text-center">
            <div className="text-2xl font-bold text-gray-600">
              {getPastEvents().length}
            </div>
            <div className="text-sm text-gray-600">Past Events</div>
          </CardContent>
        </Card>
      </div>

      {/* Events List */}
      {loading ? (
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        </div>
      ) : events.length === 0 ? (
        <Card>
          <CardContent className="text-center py-12">
            <Calendar className="mx-auto h-12 w-12 text-gray-400 mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              No events yet
            </h3>
            <p className="text-gray-500 mb-4">
              Create your first event to get started.
            </p>
            <Button onClick={handleCreateNew}>
              <Plus className="h-4 w-4 mr-2" />
              Create Event
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-6">
          {/* Upcoming Events */}
          {getUpcomingEvents().length > 0 && (
            <div>
              <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                <Clock className="h-5 w-5 mr-2 text-green-600" />
                Upcoming Events
              </h2>
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {getUpcomingEvents().map((event) => (
                  <EventCard
                    key={event.id}
                    event={event}
                    onEdit={handleEdit}
                    onDelete={handleDelete}
                    onToggleActive={handleToggleActive}
                  />
                ))}
              </div>
            </div>
          )}

          {/* Ongoing Events */}
          {getOngoingEvents().length > 0 && (
            <div>
              <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                <Calendar className="h-5 w-5 mr-2 text-blue-600" />
                Ongoing Events
              </h2>
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {getOngoingEvents().map((event) => (
                  <EventCard
                    key={event.id}
                    event={event}
                    onEdit={handleEdit}
                    onDelete={handleDelete}
                    onToggleActive={handleToggleActive}
                  />
                ))}
              </div>
            </div>
          )}

          {/* Past Events */}
          {getPastEvents().length > 0 && (
            <div>
              <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                <MapPin className="h-5 w-5 mr-2 text-gray-600" />
                Past Events
              </h2>
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {getPastEvents().map((event) => (
                  <EventCard
                    key={event.id}
                    event={event}
                    onEdit={handleEdit}
                    onDelete={handleDelete}
                    onToggleActive={handleToggleActive}
                  />
                ))}
              </div>
            </div>
          )}

          {/* Inactive Events */}
          {events.filter(e => !e.is_active).length > 0 && (
            <div>
              <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                <Calendar className="h-5 w-5 mr-2 text-gray-400" />
                Inactive Events
              </h2>
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {events.filter(e => !e.is_active).map((event) => (
                  <EventCard
                    key={event.id}
                    event={event}
                    onEdit={handleEdit}
                    onDelete={handleDelete}
                    onToggleActive={handleToggleActive}
                  />
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
