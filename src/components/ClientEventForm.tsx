import { useState } from 'react';
import { api } from '@/lib/api';
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

            const formData = new FormData();
            formData.append('client_id', clientId);
            formData.append('title', title);
            formData.append('description', description);
            if (location) formData.append('location', location);
            formData.append('start_date', startDate);
            if (endDate) formData.append('end_date', endDate);
            
            formData.append('status', 'pending');
            formData.append('is_active', 'false');
            
            if (scheduleTimeStart) formData.append('schedule_time_start', scheduleTimeStart);
            if (scheduleTimeEnd) formData.append('schedule_time_end', scheduleTimeEnd);

            if (imageFile) {
                formData.append('image', imageFile);
            }

            const data = await api.upload('/events/', formData);

            onEventSubmit(data as Event);

            // Reset form
            setTitle('');
            setDescription('');
            setLocation('');
            setStartDate('');
            setEndDate('');
            setImageFile(null);
            setImagePreview(null);
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

                    {/* Events use their start_date/end_date for scheduling, so hide date range picker */}
                    <ClientScheduleForm
                        scheduleStartDate=""
                        scheduleEndDate=""
                        onStartDateChange={() => {}}
                        onEndDateChange={() => {}}
                        scheduleTimeStart={scheduleTimeStart}
                        scheduleTimeEnd={scheduleTimeEnd}
                        onTimeStartChange={setScheduleTimeStart}
                        onTimeEndChange={setScheduleTimeEnd}
                        hideDateRange={true}
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
