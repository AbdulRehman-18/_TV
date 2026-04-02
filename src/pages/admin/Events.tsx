import { useState, useEffect } from 'react';
import { api } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { EventCard } from '@/components/EventCard';
import { EventForm } from '@/components/EventForm';
import { Plus, Calendar, RefreshCw, Clock, CheckCircle2, AlertCircle, Check, X, MapPin } from 'lucide-react';
import { Event } from '@/types';

export function Events() {
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingEvent, setEditingEvent] = useState<Event | undefined>();
  const [reviewingEvent, setReviewingEvent] = useState<Event | null>(null);
  const [reviewNotes, setReviewNotes] = useState('');

  useEffect(() => {
    loadEvents();
  }, []);

  const loadEvents = async () => {
    try {
      const data = await api.get('/events/');
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
      setEvents(prev => prev.map(e => e.id === event.id ? event : e));
    } else {
      setEvents(prev => [event, ...prev]);
    }

    setShowForm(false);
    setEditingEvent(undefined);
  };

  const handleDelete = (id: string) => {
    setEvents(prev => prev.filter(e => e.id !== id));

    try {
      const bc = new BroadcastChannel('tv-updates');
      bc.postMessage({ channel: 'events', action: 'delete', payload: { id } });
      bc.close();
    } catch {
      // ignore
    }
  };

  const handleToggleActive = (id: string, isActive: boolean) => {
    setEvents(prev => prev.map(e => e.id === id ? { ...e, is_active: isActive } : e));
  };

  const handleApprove = async (event: Event) => {
    try {
      const { error } = await supabase
        .from('events')
        .update({
          status: 'approved',
          admin_notes: reviewNotes,
          is_active: true,
        })
        .eq('id', event.id);

      if (error) throw error;

      setEvents(prev =>
        prev.map(e =>
          e.id === event.id
            ? { ...e, status: 'approved', admin_notes: reviewNotes, is_active: true }
            : e
        )
      );

      setReviewingEvent(null);
      setReviewNotes('');
    } catch (error) {
      console.error('Error approving event:', error);
    }
  };

  const handleReject = async (event: Event) => {
    try {
      const { error } = await supabase
        .from('events')
        .update({
          status: 'rejected',
          admin_notes: reviewNotes,
        })
        .eq('id', event.id);

      if (error) throw error;

      setEvents(prev =>
        prev.map(e =>
          e.id === event.id
            ? { ...e, status: 'rejected', admin_notes: reviewNotes }
            : e
        )
      );

      setReviewingEvent(null);
      setReviewNotes('');
    } catch (error) {
      console.error('Error rejecting event:', error);
    }
  };

  // Helper functions
  const getPendingEvents = () => events.filter(e => e.status === 'pending');
  const getApprovedClientEvents = () => events.filter(e => e.status === 'approved' && e.client_id);
  const getRejectedClientEvents = () => events.filter(e => e.status === 'rejected' && e.client_id);
  const getAdminEvents = () => events.filter(e => !e.client_id);

  const getUpcomingEvents = () => {
    return getAdminEvents().filter(event => {
      const startDate = new Date(event.start_date);
      const now = new Date();
      return startDate > now && event.is_active;
    });
  };

  const getOngoingEvents = () => {
    return getAdminEvents().filter(event => {
      const startDate = new Date(event.start_date);
      const endDate = event.end_date ? new Date(event.end_date) : null;
      const now = new Date();
      return startDate <= now && (!endDate || endDate >= now) && event.is_active;
    });
  };

  const formatEventDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
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

  if (reviewingEvent) {
    return (
      <div className="max-w-3xl mx-auto py-6">
        <div className="mb-6 flex items-center justify-between">
          <h2 className="text-2xl font-bold text-gray-900 tracking-tight">Review Event</h2>
          <Button
            variant="ghost"
            onClick={() => {
              setReviewingEvent(null);
              setReviewNotes('');
            }}
          >
            ← Back to Events
          </Button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Left Column: Preview */}
          <div className="md:col-span-2 space-y-4">
            <Card className="overflow-hidden border-gray-200 shadow-sm">
              {reviewingEvent.image_url && (
                <div className="bg-gray-50 aspect-video flex items-center justify-center p-2">
                  <img
                    src={reviewingEvent.image_url}
                    alt={reviewingEvent.title}
                    className="w-full h-full object-contain rounded-md"
                  />
                </div>
              )}
              <div className="p-6 space-y-4">
                <h3 className="text-xl font-semibold text-gray-900">{reviewingEvent.title}</h3>
                <p className="text-gray-600 whitespace-pre-wrap">{reviewingEvent.description}</p>

                <div className="grid grid-cols-2 gap-4 pt-4 border-t border-gray-100">
                  <div>
                    <p className="text-xs font-medium text-gray-400 uppercase tracking-wider">Start Date</p>
                    <p className="text-sm font-medium text-gray-700">{formatEventDate(reviewingEvent.start_date)}</p>
                  </div>
                  {reviewingEvent.end_date && (
                    <div>
                      <p className="text-xs font-medium text-gray-400 uppercase tracking-wider">End Date</p>
                      <p className="text-sm font-medium text-gray-700">{formatEventDate(reviewingEvent.end_date)}</p>
                    </div>
                  )}
                  {reviewingEvent.location && (
                    <div className="col-span-2">
                      <p className="text-xs font-medium text-gray-400 uppercase tracking-wider flex items-center gap-1">
                        <MapPin className="w-3 h-3" /> Location
                      </p>
                      <p className="text-sm font-medium text-gray-700">{reviewingEvent.location}</p>
                    </div>
                  )}
                </div>
              </div>
            </Card>
          </div>

          {/* Right Column: Actions */}
          <div className="space-y-6">
            <Card className="border-gray-200 shadow-sm h-full">
              <CardContent className="p-6 space-y-6">
                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-700">
                    Review Notes <span className="text-gray-400 font-normal">(Optional)</span>
                  </label>
                  <Textarea
                    value={reviewNotes}
                    onChange={(e) => setReviewNotes(e.target.value)}
                    placeholder="Add context for approval or rejection..."
                    className="resize-none min-h-[120px] bg-gray-50 border-gray-200 focus:bg-white transition-colors"
                  />
                </div>

                <div className="space-y-3 pt-2">
                  <Button
                    onClick={() => handleApprove(reviewingEvent)}
                    className="w-full bg-emerald-600 hover:bg-emerald-700 text-white shadow-sm"
                  >
                    <Check className="w-4 h-4 mr-2" />
                    Approve Event
                  </Button>
                  <Button
                    onClick={() => handleReject(reviewingEvent)}
                    variant="outline"
                    className="w-full text-red-600 border-red-200 hover:bg-red-50 hover:text-red-700 hover:border-red-300"
                  >
                    <X className="w-4 h-4 mr-2" />
                    Reject Event
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-semibold text-gray-900">Events</h1>
          <p className="text-sm md:text-base text-gray-500 mt-1">Manage events and review client submissions</p>
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
            <span>New Event</span>
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="overflow-x-auto scrollbar-hide">
        <div className="flex gap-3 md:gap-4 pb-2 min-w-max md:min-w-0 md:grid md:grid-cols-5">
          <div className="bg-blue-50 rounded-2xl p-4 md:p-6 border border-gray-100 flex-shrink-0 w-48 md:w-auto">
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <p className="text-xs md:text-sm font-medium text-gray-600">Total Events</p>
                <p className="text-2xl md:text-3xl font-bold text-blue-600 mt-2">{events.length}</p>
              </div>
              <Calendar className="w-6 h-6 md:w-8 md:h-8 text-blue-500 opacity-20" />
            </div>
          </div>

          <div className="bg-amber-50 rounded-2xl p-4 md:p-6 border border-amber-200 flex-shrink-0 w-48 md:w-auto">
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <p className="text-xs md:text-sm font-medium text-amber-700">Pending Review</p>
                <p className="text-2xl md:text-3xl font-bold text-amber-600 mt-2">{getPendingEvents().length}</p>
              </div>
              <AlertCircle className="w-6 h-6 md:w-8 md:h-8 text-amber-500 opacity-40" />
            </div>
          </div>

          <div className="bg-purple-50 rounded-2xl p-4 md:p-6 border border-gray-100 flex-shrink-0 w-48 md:w-auto">
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <p className="text-xs md:text-sm font-medium text-gray-600">Upcoming</p>
                <p className="text-2xl md:text-3xl font-bold text-purple-600 mt-2">{getUpcomingEvents().length}</p>
              </div>
              <Clock className="w-6 h-6 md:w-8 md:h-8 text-purple-500 opacity-20" />
            </div>
          </div>

          <div className="bg-green-50 rounded-2xl p-4 md:p-6 border border-gray-100 flex-shrink-0 w-48 md:w-auto">
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <p className="text-xs md:text-sm font-medium text-gray-600">Ongoing</p>
                <p className="text-2xl md:text-3xl font-bold text-green-600 mt-2">{getOngoingEvents().length}</p>
              </div>
              <CheckCircle2 className="w-6 h-6 md:w-8 md:h-8 text-green-500 opacity-20" />
            </div>
          </div>

          <div className="bg-gray-50 rounded-2xl p-4 md:p-6 border border-gray-100 flex-shrink-0 w-48 md:w-auto">
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <p className="text-xs md:text-sm font-medium text-gray-600">Inactive</p>
                <p className="text-2xl md:text-3xl font-bold text-gray-600 mt-2">{events.filter(e => !e.is_active).length}</p>
              </div>
              <Calendar className="w-6 h-6 md:w-8 md:h-8 text-gray-500 opacity-20" />
            </div>
          </div>
        </div>
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
            <h3 className="text-lg font-medium text-gray-900 mb-2">No events yet</h3>
            <p className="text-gray-500 mb-4">Create your first event to get started.</p>
            <Button onClick={handleCreateNew}>
              <Plus className="h-4 w-4 mr-2" />
              Create Event
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-12">
          {/* Pending Client Events */}
          {getPendingEvents().length > 0 && (
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <span className="relative flex h-3 w-3">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-3 w-3 bg-amber-500"></span>
                </span>
                <h2 className="text-lg font-semibold text-gray-900">Pending Reviews</h2>
                <span className="px-2 py-0.5 rounded-full bg-amber-100 text-xs font-medium text-amber-700">
                  {getPendingEvents().length}
                </span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {getPendingEvents().map((event) => (
                  <div
                    key={event.id}
                    className="group relative bg-white rounded-xl border border-amber-200 shadow-sm hover:shadow-md transition-all duration-200 overflow-hidden cursor-pointer"
                    onClick={() => setReviewingEvent(event)}
                  >
                    <div className="absolute top-3 left-3 z-10 bg-white/90 backdrop-blur-sm px-2 py-1 rounded-md text-xs font-medium text-amber-700 border border-amber-100 shadow-sm flex items-center gap-1">
                      <AlertCircle className="w-3 h-3" />
                      Needs Review
                    </div>

                    {event.image_url && (
                      <div className="aspect-video bg-gray-100 relative">
                        <img
                          src={event.image_url}
                          alt={event.title}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                        />
                      </div>
                    )}

                    <div className="p-4">
                      <h3 className="font-semibold text-gray-900 truncate">{event.title}</h3>
                      <p className="text-sm text-gray-500 mt-1 line-clamp-2">{event.description}</p>
                      <div className="flex items-center gap-2 mt-2 text-xs text-gray-500">
                        <Calendar className="w-3 h-3" />
                        {formatEventDate(event.start_date)}
                      </div>
                      {event.location && (
                        <div className="flex items-center gap-1 mt-1 text-xs text-gray-400">
                          <MapPin className="w-3 h-3" />
                          {event.location}
                        </div>
                      )}
                      <div className="flex items-center justify-between mt-3 pt-3 border-t border-gray-100">
                        <span className="text-xs text-gray-400">
                          Submitted {new Date(event.created_at).toLocaleDateString()}
                        </span>
                        <span className="text-xs font-medium text-amber-600 group-hover:text-amber-700">
                          Click to review →
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Admin Events - Upcoming */}
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

          {/* Admin Events - Ongoing */}
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

          {/* Approved Client Events */}
          {getApprovedClientEvents().length > 0 && (
            <div className="space-y-4">
              <div className="flex items-center gap-2 pb-2 border-b border-gray-100">
                <h2 className="text-lg font-semibold text-gray-900">Approved Client Events</h2>
                <CheckCircle2 className="w-4 h-4 text-emerald-500" />
              </div>
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {getApprovedClientEvents().map((event) => (
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

          {/* Rejected Client Events */}
          {getRejectedClientEvents().length > 0 && (
            <div className="space-y-4">
              <div className="flex items-center gap-2 pb-2 border-b border-gray-100">
                <h2 className="text-lg font-semibold text-gray-900">Rejected</h2>
                <span className="text-gray-400 text-sm">/ {getRejectedClientEvents().length}</span>
              </div>
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 opacity-80 hover:opacity-100 transition-opacity">
                {getRejectedClientEvents().map((event) => (
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
          {events.filter(e => !e.is_active && !e.client_id).length > 0 && (
            <div>
              <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                <Calendar className="h-5 w-5 mr-2 text-gray-400" />
                Inactive Admin Events
              </h2>
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {events.filter(e => !e.is_active && !e.client_id).map((event) => (
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
