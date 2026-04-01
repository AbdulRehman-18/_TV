import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Calendar, Clock } from 'lucide-react';

interface ClientScheduleFormProps {
    // Date range
    scheduleStartDate?: string;
    scheduleEndDate?: string;
    onStartDateChange: (date: string) => void;
    onEndDateChange: (date: string) => void;

    // Time slot
    scheduleTimeStart?: string;
    scheduleTimeEnd?: string;
    onTimeStartChange: (time: string) => void;
    onTimeEndChange: (time: string) => void;

    // Hide date range section (for events which use start_date/end_date instead)
    hideDateRange?: boolean;
}

export function ClientScheduleForm({
    scheduleStartDate,
    scheduleEndDate,
    onStartDateChange,
    onEndDateChange,
    scheduleTimeStart,
    scheduleTimeEnd,
    onTimeStartChange,
    onTimeEndChange,
    hideDateRange = false,
}: ClientScheduleFormProps) {
    return (
        <Card className="border-gray-200">
            <CardHeader className="pb-4">
                <CardTitle className="text-lg flex items-center gap-2">
                    <Calendar className="w-5 h-5 text-gray-600" />
                    Scheduling Options
                </CardTitle>
                <p className="text-sm text-gray-500 mt-1">
                    Configure when this content should be displayed (Optional)
                </p>
            </CardHeader>
            <CardContent className="space-y-6">
                {/* Date Range - hidden for events which use their own start_date/end_date */}
                {!hideDateRange && (
                    <div className="space-y-4">
                        <Label className="flex items-center gap-2">
                            <Calendar className="w-4 h-4 text-gray-500" />
                            Date Range
                        </Label>
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label htmlFor="start-date" className="text-xs text-gray-600">Start Date</Label>
                                <Input
                                    id="start-date"
                                    type="date"
                                    value={scheduleStartDate || ''}
                                    onChange={(e) => onStartDateChange(e.target.value)}
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="end-date" className="text-xs text-gray-600">End Date</Label>
                                <Input
                                    id="end-date"
                                    type="date"
                                    value={scheduleEndDate || ''}
                                    onChange={(e) => onEndDateChange(e.target.value)}
                                    min={scheduleStartDate || undefined}
                                />
                            </div>
                        </div>
                    </div>
                )}

                {/* Time Slot */}
                <div className="space-y-4">
                    <Label className="flex items-center gap-2">
                        <Clock className="w-4 h-4 text-gray-500" />
                        Daily Time Slot
                    </Label>
                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label htmlFor="time-start" className="text-xs text-gray-600">Start Time</Label>
                            <Input
                                id="time-start"
                                type="time"
                                value={scheduleTimeStart || ''}
                                onChange={(e) => onTimeStartChange(e.target.value)}
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="time-end" className="text-xs text-gray-600">End Time</Label>
                            <Input
                                id="time-end"
                                type="time"
                                value={scheduleTimeEnd || ''}
                                onChange={(e) => onTimeEndChange(e.target.value)}
                            />
                        </div>
                    </div>
                    <p className="text-xs text-gray-500">
                        Content will only display during these hours each day
                    </p>
                </div>

                {/* Summary */}
                {(scheduleStartDate || scheduleEndDate || scheduleTimeStart || scheduleTimeEnd) && (
                    <div className="bg-gray-100 border border-gray-300 rounded p-3 text-xs text-gray-800">
                        <span className="font-medium">Schedule Summary:</span>
                        <ul className="mt-1 space-y-1">
                            {scheduleStartDate && scheduleEndDate && (
                                <li>• Active from {new Date(scheduleStartDate).toLocaleDateString()} to {new Date(scheduleEndDate).toLocaleDateString()}</li>
                            )}
                            {scheduleTimeStart && scheduleTimeEnd && (
                                <li>• Daily display hours: {scheduleTimeStart} - {scheduleTimeEnd}</li>
                            )}
                        </ul>
                    </div>
                )}
            </CardContent>
        </Card>
    );
}
