import { useState } from 'react';
import { supabase, EVENTS_BUCKET } from '@/lib/supabase';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Upload, AlertCircle, Calendar, X, MapPin } from 'lucide-react';
import { Event } from '@/types';
import { ClientScheduleForm } from '@/components/ClientScheduleForm';

interface ClientEventFormProps {
    clientId: string;
    onEventSubmit: (event: Event) => void;
}

export function ClientEventForm({ clientId, onEventSubmit }: ClientEventFormProps) {
    const [title, setTitle] = useState('');
    const [description, setDescription] = useState('');
    const [location, setLocation] = useState('');
    const [startDate, setStartDate] = useState('');
    const [endDate, setEndDate] = useState('');
    const [imageFile, setImageFile] = useState<File | null>(null);
    const [imagePreview, setImagePreview] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState('');
    const [scheduleStartDate, setScheduleStartDate] = useState('');
    const [scheduleEndDate, setScheduleEndDate] = useState('');
    const [scheduleTimeStart, setScheduleTimeStart] = useState('');
    const [scheduleTimeEnd, setScheduleTimeEnd] = useState('');

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const selectedFile = e.target.files?.[0];
        if (!selectedFile) return;

        // Validate file size (max 10MB for images)
        const MAX_SIZE = 10 * 1024 * 1024;
        if (selectedFile.size > MAX_SIZE) {
            setError('Image size must be less than 10MB');
            return;
        }

        // Validate file type
        const validTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
        if (!validTypes.includes(selectedFile.type)) {
            setError('Please upload an image file (JPG, PNG, GIF, WebP)');
            return;
        }

        setImageFile(selectedFile);
        setError('');

        // Create preview
        const reader = new FileReader();
        reader.onloadend = () => {
            setImagePreview(reader.result as string);
        };
        reader.readAsDataURL(selectedFile);
    };

    const removeImage = () => {
        setImageFile(null);
        setImagePreview(null);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);
        setError('');

        try {
            if (!title.trim()) {
                setError('Please enter an event title');
                setIsLoading(false);
                return;
            }

            if (!description.trim()) {
                setError('Please enter the event description');
                setIsLoading(false);
                return;
            }

            if (!startDate) {
                setError('Please select an event start date');
                setIsLoading(false);
                return;
            }

            let imageUrl: string | null = null;

            // Upload image if provided
            if (imageFile) {
                const fileExt = imageFile.name.split('.').pop();
                const fileName = `${Date.now()}-${Math.random().toString(36).substring(2)}.${fileExt}`;
                const filePath = `client-uploads/${clientId}/${fileName}`;

                const { error: uploadError } = await supabase.storage
                    .from(EVENTS_BUCKET)
                    .upload(filePath, imageFile);

                if (uploadError) throw uploadError;

                const { data: urlData } = supabase.storage
                    .from(EVENTS_BUCKET)
                    .getPublicUrl(filePath);

                imageUrl = urlData.publicUrl;
            }

            // Create event record with 'pending' status
            const { data, error: insertError } = await supabase
                .from('events')
                .insert({
                    title,
                    description,
                    location: location || null,
                    start_date: startDate,
                    end_date: endDate || null,
                    image_url: imageUrl,
                    client_id: clientId,
                    status: 'pending',
                    is_active: false,
                    schedule_start_date: scheduleStartDate || null,
                    schedule_end_date: scheduleEndDate || null,
                    schedule_time_start: scheduleTimeStart || null,
                    schedule_time_end: scheduleTimeEnd || null,
                })
                .select()
                .single();

            if (insertError) throw insertError;

            onEventSubmit(data as Event);

            // Reset form
            setTitle('');
            setDescription('');
            setLocation('');
            setStartDate('');
            setEndDate('');
            setImageFile(null);
            setImagePreview(null);
            setScheduleStartDate('');
            setScheduleEndDate('');
            setScheduleTimeStart('');
            setScheduleTimeEnd('');
        } catch (err) {
            console.error('Error submitting event:', err);
            setError(err instanceof Error ? err.message : 'Failed to submit event');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <Card>
            <CardHeader>
                <CardTitle className="flex items-center gap-2">
                    <Calendar className="w-5 h-5" />
                    Create Event
                </CardTitle>
            </CardHeader>
            <CardContent>
                <form onSubmit={handleSubmit} className="space-y-6">
                    {error && (
                        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-md flex items-start">
                            <AlertCircle className="w-5 h-5 mr-3 flex-shrink-0 mt-0.5" />
                            <span>{error}</span>
                        </div>
                    )}

                    <div className="space-y-2">
                        <Label htmlFor="event-title">Event Title *</Label>
                        <Input
                            id="event-title"
                            type="text"
                            value={title}
                            onChange={(e) => setTitle(e.target.value)}
                            placeholder="e.g., Annual Meeting 2026"
                            required
                        />
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="event-description">Description *</Label>
                        <Textarea
                            id="event-description"
                            value={description}
                            onChange={(e) => setDescription(e.target.value)}
                            placeholder="Describe your event..."
                            rows={4}
                            required
                        />
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="event-location" className="flex items-center gap-1">
                            <MapPin className="w-4 h-4" />
                            Location (Optional)
                        </Label>
                        <Input
                            id="event-location"
                            type="text"
                            value={location}
                            onChange={(e) => setLocation(e.target.value)}
                            placeholder="e.g., Conference Room A"
                        />
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label htmlFor="event-start-date">Event Start Date *</Label>
                            <Input
                                id="event-start-date"
                                type="datetime-local"
                                value={startDate}
                                onChange={(e) => setStartDate(e.target.value)}
                                required
                            />
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="event-end-date">Event End Date (Optional)</Label>
                            <Input
                                id="event-end-date"
                                type="datetime-local"
                                value={endDate}
                                onChange={(e) => setEndDate(e.target.value)}
                                min={startDate || undefined}
                            />
                        </div>
                    </div>

                    <div className="space-y-2">
                        <Label>Event Image (Optional)</Label>
                        {imagePreview ? (
                            <div className="relative rounded-lg overflow-hidden bg-gray-100">
                                <img src={imagePreview} alt="Preview" className="w-full h-48 object-cover" />
                                <button
                                    type="button"
                                    onClick={removeImage}
                                    className="absolute top-2 right-2 p-1 bg-red-500 text-white rounded-full hover:bg-red-600 transition-colors"
                                >
                                    <X className="w-4 h-4" />
                                </button>
                            </div>
                        ) : (
                            <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-gray-400 transition-colors">
                                <input
                                    id="event-image"
                                    type="file"
                                    onChange={handleFileChange}
                                    accept="image/*"
                                    className="hidden"
                                />
                                <label htmlFor="event-image" className="cursor-pointer">
                                    <Upload className="w-8 h-8 mx-auto text-gray-400 mb-2" />
                                    <p className="text-sm text-gray-600">Click to upload an event image</p>
                                    <p className="text-xs text-gray-500 mt-1">JPG, PNG, GIF, WebP up to 10MB</p>
                                </label>
                            </div>
                        )}
                    </div>

                    <ClientScheduleForm
                        scheduleStartDate={scheduleStartDate}
                        scheduleEndDate={scheduleEndDate}
                        onStartDateChange={setScheduleStartDate}
                        onEndDateChange={setScheduleEndDate}
                        scheduleTimeStart={scheduleTimeStart}
                        scheduleTimeEnd={scheduleTimeEnd}
                        onTimeStartChange={setScheduleTimeStart}
                        onTimeEndChange={setScheduleTimeEnd}
                    />

                    <div className="bg-gray-50 border border-gray-200 text-gray-800 px-4 py-3 rounded-md text-sm">
                        <p className="font-medium mb-1">Note:</p>
                        <p>Your event will be submitted for admin review. Once approved, it will appear on the display.</p>
                    </div>

                    <Button
                        type="submit"
                        disabled={isLoading || !title.trim() || !description.trim() || !startDate}
                        className="w-full bg-gray-900 hover:bg-gray-800 text-white"
                    >
                        {isLoading ? (
                            <>
                                <span className="animate-spin mr-2">⟳</span>
                                Submitting...
                            </>
                        ) : (
                            <>
                                <Calendar className="w-4 h-4 mr-2" />
                                Submit for Review
                            </>
                        )}
                    </Button>
                </form>
            </CardContent>
        </Card>
    );
}
