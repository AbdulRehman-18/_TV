import { useState } from 'react';
import { supabase, EVENTS_BUCKET } from '@/lib/supabase';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Upload, X } from 'lucide-react';
import { Event, Priority, RecurrenceType } from '@/types';
import { ScheduleForm } from '@/components/ScheduleForm';

interface EventFormProps {
  event?: Event;
  onSubmit: (event: Event) => void;
  onCancel: () => void;
}

export function EventForm({ event, onSubmit, onCancel }: EventFormProps) {
  const [title, setTitle] = useState(event?.title || '');
  const [description, setDescription] = useState(event?.description || '');
  const [location, setLocation] = useState(event?.location || '');
  const [startDate, setStartDate] = useState(
    event?.start_date
      ? new Date(event.start_date).toISOString().slice(0, 16)
      : ''
  );
  const [endDate, setEndDate] = useState(
    event?.end_date
      ? new Date(event.end_date).toISOString().slice(0, 16)
      : ''
  );
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imageUrl, setImageUrl] = useState(event?.image_url || '');
  const [loading, setLoading] = useState(false);

  // Scheduling state
  const [scheduleTimeStart, setScheduleTimeStart] = useState(event?.schedule_time_start || '');
  const [scheduleTimeEnd, setScheduleTimeEnd] = useState(event?.schedule_time_end || '');
  const [recurrenceType, setRecurrenceType] = useState<RecurrenceType>(event?.recurrence_type || 'none');
  const [recurrenceDays, setRecurrenceDays] = useState<number[]>(event?.recurrence_days || []);
  const [priority, setPriority] = useState<Priority>(event?.priority || 'normal');

  const handleImageUpload = async (file: File): Promise<string | null> => {
    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${Date.now()}.${fileExt}`;

      const { error: uploadError } = await supabase.storage
        .from(EVENTS_BUCKET)
        .upload(fileName, file);

      if (uploadError) {
        console.error('Upload error:', uploadError);
        return null;
      }

      const { data } = supabase.storage
        .from(EVENTS_BUCKET)
        .getPublicUrl(fileName);

      return data.publicUrl;
    } catch (error) {
      console.error('Error uploading image:', error);
      return null;
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      let finalImageUrl = imageUrl;

      // Upload new image if provided
      if (imageFile) {
        const uploadedUrl = await handleImageUpload(imageFile);
        if (uploadedUrl) {
          finalImageUrl = uploadedUrl;
        }
      }

      const eventData = {
        title,
        description,
        location: location || null,
        start_date: new Date(startDate).toISOString(),
        end_date: endDate ? new Date(endDate).toISOString() : null,
        image_url: finalImageUrl || null,
        is_active: true,
        // Scheduling fields (events use start_date/end_date for event timing, not schedule dates)
        schedule_time_start: scheduleTimeStart || null,
        schedule_time_end: scheduleTimeEnd || null,
        recurrence_type: recurrenceType,
        recurrence_days: recurrenceDays.length > 0 ? recurrenceDays : null,
        priority,
      };

      let result;

      if (event) {
        // Update existing event
        result = await supabase
          .from('events')
          .update(eventData)
          .eq('id', event.id)
          .select()
          .single();
      } else {
        // Create new event
        result = await supabase
          .from('events')
          .insert(eventData)
          .select()
          .single();
      }

      if (result.error) {
        throw result.error;
      }

      onSubmit(result.data);

      // Notify other tabs/windows (same origin) that events changed.
      try {
        const bc = new BroadcastChannel('tv-updates');
        const msg = { channel: 'events', action: event ? 'update' : 'create', payload: result.data };
        console.debug('[EventForm] broadcasting', msg);
        bc.postMessage(msg);
        bc.close();
      } catch {
        // ignore
      }
    } catch (error) {
      console.error('Error saving event:', error);
      alert('Error saving event. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setImageFile(file);
      // Create preview URL
      const previewUrl = URL.createObjectURL(file);
      setImageUrl(previewUrl);
    }
  };

  const removeImage = () => {
    setImageFile(null);
    setImageUrl('');
  };

  return (
    <Card className="w-full max-w-2xl mx-auto">
      <CardHeader>
        <CardTitle>
          {event ? 'Edit Event' : 'Create New Event'}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="title">Event Title</Label>
            <Input
              id="title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Enter event title"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Enter event description"
              className="min-h-[100px]"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="location">Location (Optional)</Label>
            <Input
              id="location"
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              placeholder="Enter event location"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="startDate">Start Date & Time</Label>
              <Input
                id="startDate"
                type="datetime-local"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="endDate">End Date & Time (Optional)</Label>
              <Input
                id="endDate"
                type="datetime-local"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label>Event Image (Optional)</Label>

            {imageUrl ? (
              <div className="relative">
                <img
                  src={imageUrl}
                  alt="Event preview"
                  className="w-full h-48 object-cover rounded-md"
                />
                <Button
                  type="button"
                  variant="destructive"
                  size="icon"
                  className="absolute top-2 right-2"
                  onClick={removeImage}
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            ) : (
              <div className="border-2 border-dashed border-gray-300 rounded-md p-8 text-center">
                <Upload className="mx-auto h-12 w-12 text-gray-400 mb-4" />
                <Label htmlFor="image-upload" className="cursor-pointer">
                  <span className="text-sm text-gray-600">
                    Click to upload an event image
                  </span>
                  <Input
                    id="image-upload"
                    type="file"
                    accept="image/*"
                    onChange={handleFileChange}
                    className="hidden"
                  />
                </Label>
              </div>
            )}
          </div>

          {/* Scheduling Options */}
          <ScheduleForm
            scheduleStartDate="" // Events use start_date/end_date fields instead
            scheduleEndDate=""
            onStartDateChange={() => { }} // No-op for events
            onEndDateChange={() => { }}
            scheduleTimeStart={scheduleTimeStart}
            scheduleTimeEnd={scheduleTimeEnd}
            onTimeStartChange={setScheduleTimeStart}
            onTimeEndChange={setScheduleTimeEnd}
            recurrenceType={recurrenceType}
            recurrenceDays={recurrenceDays}
            onRecurrenceTypeChange={setRecurrenceType}
            onRecurrenceDaysChange={setRecurrenceDays}
            priority={priority}
            onPriorityChange={setPriority}
            showFallbackOption={false}
          />
          <p className="text-xs text-gray-500 -mt-4">
            Note: Events use the Start/End Date fields above for scheduling. Time slots and recurrence control when the event announcement displays.
          </p>

          <div className="flex space-x-4">
            <Button type="submit" disabled={loading} className="flex-1">
              {loading ? 'Saving...' : event ? 'Update Event' : 'Create Event'}
            </Button>
            <Button type="button" variant="outline" onClick={onCancel}>
              Cancel
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}