import React, { useState } from 'react';
import { api } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Upload, X } from 'lucide-react';
import { Announcement, RecurrenceType, Priority } from '@/types';
import { ScheduleForm } from '@/components/ScheduleForm';

interface AnnouncementFormProps {
  announcement?: Announcement;
  onSubmit: (announcement: Announcement) => void;
  onCancel: () => void;
}

export function AnnouncementForm({ announcement, onSubmit, onCancel }: AnnouncementFormProps) {
  const [title, setTitle] = useState(announcement?.title || '');
  const [body, setBody] = useState(announcement?.body || '');
  const [imageUrl, setImageUrl] = useState(announcement?.image_url || '');
  const [loading, setLoading] = useState(false);

  // Scheduling state
  const [scheduleStartDate, setScheduleStartDate] = useState(announcement?.schedule_start_date || '');
  const [scheduleEndDate, setScheduleEndDate] = useState(announcement?.schedule_end_date || '');
  const [scheduleTimeStart, setScheduleTimeStart] = useState(announcement?.schedule_time_start || '');
  const [scheduleTimeEnd, setScheduleTimeEnd] = useState(announcement?.schedule_time_end || '');
  const [recurrenceType, setRecurrenceType] = useState<RecurrenceType>(announcement?.recurrence_type || 'none');
  const [recurrenceDays, setRecurrenceDays] = useState<number[]>(announcement?.recurrence_days || []);
  const [priority, setPriority] = useState<Priority>(announcement?.priority || 'normal');
  const [duration, setDuration] = useState<number>(announcement?.duration || 12);


  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      let result;
      const data = {
        title,
        body,
        is_active: true,
        // Scheduling fields
        schedule_start_date: scheduleStartDate || null,
        schedule_end_date: scheduleEndDate || null,
        schedule_time_start: scheduleTimeStart || null,
        schedule_time_end: scheduleTimeEnd || null,
        recurrence_type: recurrenceType,
        recurrence_days: recurrenceDays,
        priority,
        duration,
      };

      if (announcement) {
        // DRF update
        result = await api.patch(`/announcements/${announcement.id}/`, data);
      } else {
        // DRF create
        result = await api.post('/announcements/', data);
      }

      onSubmit(result);

      // Notify other tabs/windows (same origin) that announcements changed.
      try {
        const bc = new BroadcastChannel('tv-updates');
        bc.postMessage({
          channel: 'announcements',
          action: announcement ? 'update' : 'create',
          payload: result
        });
        bc.close();
      } catch {
        // ignore silently
      }
    } catch (error) {
      console.error('Error saving announcement:', error);
      alert('Error saving announcement. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // Create preview URL
      const previewUrl = URL.createObjectURL(file);
      setImageUrl(previewUrl);
    }
  };

  const removeImage = () => {
    setImageUrl('');
  };

  return (
    <Card className="w-full max-w-2xl mx-auto">
      <CardHeader>
        <CardTitle>
          {announcement ? 'Edit Announcement' : 'Create New Announcement'}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="title">Title</Label>
            <Input
              id="title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Enter announcement title"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="body">Message</Label>
            <Textarea
              id="body"
              value={body}
              onChange={(e) => setBody(e.target.value)}
              placeholder="Enter announcement message"
              className="min-h-[100px]"
              required
            />
          </div>

          <div className="space-y-2">
            <Label>Image (Optional)</Label>

            {imageUrl ? (
              <div className="relative">
                <img
                  src={imageUrl}
                  alt="Preview"
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
                    Click to upload an image
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
            scheduleStartDate={scheduleStartDate}
            scheduleEndDate={scheduleEndDate}
            onStartDateChange={setScheduleStartDate}
            onEndDateChange={setScheduleEndDate}
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
            duration={duration}
            onDurationChange={setDuration}
            showFallbackOption={false}
          />

          <div className="flex space-x-4">
            <Button type="submit" disabled={loading} className="flex-1">
              {loading ? 'Saving...' : announcement ? 'Update' : 'Create'}
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