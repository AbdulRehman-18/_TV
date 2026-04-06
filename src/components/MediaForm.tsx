import { useState } from 'react';
import { api } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Upload, X, Image as ImageIcon, Video } from 'lucide-react';
import { Media, Priority, RecurrenceType } from '@/types';
import { ScheduleForm } from '@/components/ScheduleForm';

interface MediaFormProps {
  media?: Media;
  onSubmit: (media: Media) => void;
  onCancel: () => void;
}

export function MediaForm({ media, onSubmit, onCancel }: MediaFormProps) {
  const [title, setTitle] = useState(media?.title || '');
  const [description, setDescription] = useState(media?.description || '');
  const [file, setFile] = useState<File | null>(null);
  const [filePreview, setFilePreview] = useState<string | null>(media?.file_url || null);
  const [fileType, setFileType] = useState<'image' | 'video' | null>(media?.file_type || null);
  const [loading, setLoading] = useState(false);

  // Scheduling state
  const [scheduleStartDate, setScheduleStartDate] = useState(media?.schedule_start_date || '');
  const [scheduleEndDate, setScheduleEndDate] = useState(media?.schedule_end_date || '');
  const [scheduleTimeStart, setScheduleTimeStart] = useState(media?.schedule_time_start || '');
  const [scheduleTimeEnd, setScheduleTimeEnd] = useState(media?.schedule_time_end || '');
  const [recurrenceType, setRecurrenceType] = useState<RecurrenceType>(media?.recurrence_type || 'none');
  const [recurrenceDays, setRecurrenceDays] = useState<number[]>(media?.recurrence_days || []);
  const [priority, setPriority] = useState<Priority>(media?.priority || 'normal');
  const [duration, setDuration] = useState<number>(media?.duration || 12);
  const [isFallback, setIsFallback] = useState(media?.is_fallback || false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const formData = new FormData();
      
      // Ensure title is present as it is required in the backend
      const finalTitle = title.trim() || (file ? file.name : (media?.title || 'Untitled Media'));
      formData.append('title', finalTitle);
      
      if (description) formData.append('description', description);
      
      formData.append('is_active', 'true');
      formData.append('status', 'approved');
      
      if (file) {
        formData.append('file', file);
        formData.append('file_type', file.type.startsWith('video/') ? 'video' : 'image');
        formData.append('file_name', file.name);
        formData.append('file_size', file.size.toString());
      }

      if (scheduleStartDate) formData.append('schedule_start_date', scheduleStartDate);
      if (scheduleEndDate) formData.append('schedule_end_date', scheduleEndDate);
      if (scheduleTimeStart) formData.append('schedule_time_start', scheduleTimeStart);
      if (scheduleTimeEnd) formData.append('schedule_time_end', scheduleTimeEnd);
      
      if (recurrenceType) {
        formData.append('recurrence_type', recurrenceType);
      }
      
      // Send recurrence_days as a JSON string to ensure JSONField parses it correctly
      formData.append('recurrence_days', JSON.stringify(recurrenceDays));
      
      formData.append('priority', priority);
      formData.append('duration', duration.toString());
      formData.append('is_fallback', String(isFallback));

      let resultData;

      if (media) {
        resultData = await api.patchUpload(`/media/${media.id}/`, formData);
      } else {
        resultData = await api.upload('/media/', formData);
      }

      onSubmit(resultData);

      // Notify other tabs/windows (same origin) that media changed.
      try {
        const bc = new BroadcastChannel('tv-updates');
        const msg = { channel: 'media', action: media ? 'update' : 'create', payload: resultData };
        console.debug('[MediaForm] broadcasting', msg);
        bc.postMessage(msg);
        bc.close();
      } catch {
        // ignore
      }
    } catch (error) {
      console.error('Error saving media:', error);
      alert('Error saving media. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      setFile(selectedFile);

      // Determine file type
      if (selectedFile.type.startsWith('video/')) {
        setFileType('video');
      } else if (selectedFile.type.startsWith('image/')) {
        setFileType('image');
      }

      // Create preview
      if (selectedFile.type.startsWith('image/')) {
        const reader = new FileReader();
        reader.onload = (e) => {
          setFilePreview(e.target?.result as string);
        };
        reader.readAsDataURL(selectedFile);
      } else {
        setFilePreview(null);
      }
    }
  };

  const removeFile = () => {
    setFile(null);
    setFilePreview(null);
    setFileType(null);
  };

  const acceptedTypes = "image/*,video/*";

  return (
    <Card className="w-full max-w-2xl mx-auto">
      <CardHeader>
        <CardTitle>
          {media ? 'Edit Media' : 'Upload New Media'}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="title">Media Title (Optional)</Label>
            <Input
              id="title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Enter media title"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Description (Optional)</Label>
            <Textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Enter media description"
              className="min-h-[80px]"
            />
          </div>

          <div className="space-y-2">
            <Label>Media File</Label>

            {filePreview ? (
              <div className="relative">
                {fileType === 'image' ? (
                  <img
                    src={filePreview}
                    alt="Preview"
                    className="w-full h-48 object-cover rounded-md"
                  />
                ) : (
                  <div className="w-full h-48 bg-gray-900 rounded-md flex items-center justify-center">
                    <div className="text-center text-white">
                      <Video className="h-12 w-12 mx-auto mb-2" />
                      <p className="text-sm">Video file selected</p>
                      <p className="text-xs text-gray-300">{file?.name}</p>
                    </div>
                  </div>
                )}
                <Button
                  type="button"
                  variant="destructive"
                  size="icon"
                  className="absolute top-2 right-2"
                  onClick={removeFile}
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            ) : media?.file_url ? (
              <div className="relative">
                {media.file_type === 'image' ? (
                  <img
                    src={media.file_url}
                    alt="Current media"
                    className="w-full h-48 object-cover rounded-md"
                  />
                ) : (
                  <div className="w-full h-48 bg-gray-900 rounded-md flex items-center justify-center">
                    <div className="text-center text-white">
                      <Video className="h-12 w-12 mx-auto mb-2" />
                      <p className="text-sm">Current video file</p>
                    </div>
                  </div>
                )}
                <div className="absolute top-2 left-2 bg-black bg-opacity-75 text-white px-2 py-1 rounded text-xs">
                  Current file
                </div>
              </div>
            ) : (
              <div className="border-2 border-dashed border-gray-300 rounded-md p-8 text-center">
                <Upload className="mx-auto h-12 w-12 text-gray-400 mb-4" />
                <Label htmlFor="file-upload" className="cursor-pointer">
                  <span className="text-sm text-gray-600 block mb-2">
                    Click to upload an image or video
                  </span>
                  <span className="text-xs text-gray-500">
                    Supports: JPG, PNG, GIF, MP4, WebM, MOV
                  </span>
                  <Input
                    id="file-upload"
                    type="file"
                    accept={acceptedTypes}
                    onChange={handleFileChange}
                    className="hidden"
                    required={!media}
                  />
                </Label>
              </div>
            )}

            {file && (
              <div className="flex items-center space-x-2 text-sm text-gray-600 mt-2">
                {fileType === 'image' ? (
                  <ImageIcon className="h-4 w-4" />
                ) : (
                  <Video className="h-4 w-4" />
                )}
                <span>{file.name}</span>
                <span className="text-gray-400">•</span>
                <span>{(file.size / 1024 / 1024).toFixed(2)} MB</span>
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
            isFallback={isFallback}
            onFallbackChange={setIsFallback}
            showFallbackOption={true}
          />

          <div className="flex space-x-4">
            <Button type="submit" disabled={loading} className="flex-1">
              {loading ? 'Uploading...' : media ? 'Update Media' : 'Upload Media'}
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