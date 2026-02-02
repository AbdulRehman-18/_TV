import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Calendar, Clock, Repeat, AlertTriangle } from 'lucide-react';
import type { Priority, RecurrenceType } from '@/types';

interface ScheduleFormProps {
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

    // Recurrence
    recurrenceType?: RecurrenceType;
    recurrenceDays?: number[];
    onRecurrenceTypeChange: (type: RecurrenceType) => void;
    onRecurrenceDaysChange: (days: number[]) => void;

    // Priority
    priority?: Priority;
    onPriorityChange: (priority: Priority) => void;

    // Fallback (media only)
    isFallback?: boolean;
    onFallbackChange?: (isFallback: boolean) => void;
    showFallbackOption?: boolean;
}

const DAYS_OF_WEEK = [
    { value: 0, label: 'Sun' },
    { value: 1, label: 'Mon' },
    { value: 2, label: 'Tue' },
    { value: 3, label: 'Wed' },
    { value: 4, label: 'Thu' },
    { value: 5, label: 'Fri' },
    { value: 6, label: 'Sat' },
];

export function ScheduleForm({
    scheduleStartDate,
    scheduleEndDate,
    onStartDateChange,
    onEndDateChange,
    scheduleTimeStart,
    scheduleTimeEnd,
    onTimeStartChange,
    onTimeEndChange,
    recurrenceType = 'none',
    recurrenceDays = [],
    onRecurrenceTypeChange,
    onRecurrenceDaysChange,
    priority = 'normal',
    onPriorityChange,
    isFallback = false,
    onFallbackChange,
    showFallbackOption = false,
}: ScheduleFormProps) {
    const toggleDay = (day: number) => {
        if (recurrenceDays.includes(day)) {
            onRecurrenceDaysChange(recurrenceDays.filter(d => d !== day));
        } else {
            onRecurrenceDaysChange([...recurrenceDays, day].sort());
        }
    };

    return (
        <Card className="border-gray-200">
            <CardHeader className="pb-4">
                <CardTitle className="text-lg flex items-center gap-2">
                    <Calendar className="w-5 h-5 text-gray-600" />
                    Scheduling Options
                </CardTitle>
                <p className="text-sm text-gray-500 mt-1">
                    Configure when and how this content should be displayed
                </p>
            </CardHeader>
            <CardContent className="space-y-6">
                {/* Priority */}
                <div className="space-y-2">
                    <Label className="flex items-center gap-2">
                        <AlertTriangle className="w-4 h-4 text-gray-500" />
                        Priority Level
                    </Label>
                    <Select value={priority} onValueChange={(value) => onPriorityChange(value as Priority)}>
                        <SelectTrigger>
                            <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="normal">Normal - Standard display</SelectItem>
                            <SelectItem value="high">High - Prioritized in queue</SelectItem>
                            <SelectItem value="emergency">Emergency - Overrides all content</SelectItem>
                        </SelectContent>
                    </Select>
                    {priority === 'emergency' && (
                        <p className="text-xs text-amber-600 bg-amber-50 border border-amber-200 rounded-md p-2">
                            ⚠️ Emergency priority will override ALL other content on the display
                        </p>
                    )}
                </div>

                {/* Date Range */}
                <div className="space-y-4">
                    <Label className="flex items-center gap-2">
                        <Calendar className="w-4 h-4 text-gray-500" />
                        Date Range (Optional)
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
                            />
                        </div>
                    </div>
                </div>

                {/* Time Slot */}
                <div className="space-y-4">
                    <Label className="flex items-center gap-2">
                        <Clock className="w-4 h-4 text-gray-500" />
                        Daily Time Slot (Optional)
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

                {/* Recurrence */}
                <div className="space-y-4">
                    <Label className="flex items-center gap-2">
                        <Repeat className="w-4 h-4 text-gray-500" />
                        Recurrence Pattern
                    </Label>
                    <Select value={recurrenceType} onValueChange={(value) => onRecurrenceTypeChange(value as RecurrenceType)}>
                        <SelectTrigger>
                            <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="none">None - Show every day</SelectItem>
                            <SelectItem value="daily">Daily - Repeat every day</SelectItem>
                            <SelectItem value="weekly">Weekly - Specific days only</SelectItem>
                        </SelectContent>
                    </Select>

                    {/* Weekly Day Selection */}
                    {recurrenceType === 'weekly' && (
                        <div className="space-y-2">
                            <Label className="text-xs text-gray-600">Select Days</Label>
                            <div className="flex gap-2 flex-wrap">
                                {DAYS_OF_WEEK.map((day) => (
                                    <button
                                        key={day.value}
                                        type="button"
                                        onClick={() => toggleDay(day.value)}
                                        className={`
                      px-3 py-2 rounded-md text-sm font-medium transition-all
                      ${recurrenceDays.includes(day.value)
                                                ? 'bg-blue-600 text-white shadow-sm'
                                                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                                            }
                    `}
                                    >
                                        {day.label}
                                    </button>
                                ))}
                            </div>
                            {recurrenceDays.length === 0 && (
                                <p className="text-xs text-amber-600">Please select at least one day</p>
                            )}
                        </div>
                    )}
                </div>

                {/* Fallback Option (Media only) */}
                {showFallbackOption && onFallbackChange && (
                    <div className="space-y-2 pt-4 border-t border-gray-200">
                        <div className="flex items-center space-x-2">
                            <Checkbox
                                id="is-fallback"
                                checked={isFallback}
                                onCheckedChange={(checked) => onFallbackChange(checked as boolean)}
                            />
                            <Label
                                htmlFor="is-fallback"
                                className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer"
                            >
                                Mark as Fallback Content
                            </Label>
                        </div>
                        <p className="text-xs text-gray-500 ml-6">
                            Fallback content displays when no other content is scheduled
                        </p>
                    </div>
                )}
            </CardContent>
        </Card>
    );
}
