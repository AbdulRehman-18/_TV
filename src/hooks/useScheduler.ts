import { useCallback } from 'react';
import type { Announcement, Event, Media, ScheduleFields } from '@/types';

/**
 * Centralized scheduling hook for all content types.
 * Handles date ranges, time slots, recurrence patterns, priority, and fallback logic.
 */
export function useScheduler() {
    /**
     * Check if a scheduled item should be displayed at the current time.
     * Considers date range, time slot, and recurrence pattern.
     */
    const isScheduledNow = useCallback((item: ScheduleFields): boolean => {
        const now = new Date();

        // 1. Check date range (start/end dates)
        if (!isWithinDateRange(item, now)) {
            return false;
        }

        // 2. Check time slot (daily hours)
        if (!isWithinTimeSlot(item, now)) {
            return false;
        }

        // 3. Check recurrence pattern
        if (!matchesRecurrencePattern(item, now)) {
            return false;
        }

        return true;
    }, []);

    /**
     * Check if current date is within the item's date range.
     */
    const isWithinDateRange = (item: ScheduleFields, now: Date): boolean => {
        // If no date constraints, always pass
        if (!item.schedule_start_date && !item.schedule_end_date) {
            return true;
        }

        // Check start date
        if (item.schedule_start_date) {
            const startDate = new Date(item.schedule_start_date);
            startDate.setHours(0, 0, 0, 0);
            if (now < startDate) {
                return false; // Not yet started
            }
        }

        // Check end date
        if (item.schedule_end_date) {
            const endDate = new Date(item.schedule_end_date);
            endDate.setHours(23, 59, 59, 999);
            if (now > endDate) {
                return false; // Already ended
            }
        }

        return true;
    };

    /**
     * Check if current time is within the item's daily time slot.
     */
    const isWithinTimeSlot = (item: ScheduleFields, now: Date): boolean => {
        // If no time constraints, always pass
        if (!item.schedule_time_start && !item.schedule_time_end) {
            return true;
        }

        const currentTime = now.getHours() * 60 + now.getMinutes(); // Minutes since midnight

        // Check start time
        if (item.schedule_time_start) {
            const [startHour, startMin] = item.schedule_time_start.split(':').map(Number);
            const startTime = startHour * 60 + startMin;
            if (currentTime < startTime) {
                return false; // Too early
            }
        }

        // Check end time
        if (item.schedule_time_end) {
            const [endHour, endMin] = item.schedule_time_end.split(':').map(Number);
            const endTime = endHour * 60 + endMin;
            if (currentTime > endTime) {
                return false; // Too late
            }
        }

        return true;
    };

    /**
     * Check if current day matches the item's recurrence pattern.
     */
    const matchesRecurrencePattern = (item: ScheduleFields, now: Date): boolean => {
        const recurrenceType = item.recurrence_type || 'none';

        // No recurrence - show every day (within date/time constraints)
        if (recurrenceType === 'none') {
            return true;
        }

        // Daily recurrence - show every day
        if (recurrenceType === 'daily') {
            return true;
        }

        // Weekly recurrence - show only on specified days
        if (recurrenceType === 'weekly') {
            if (!item.recurrence_days || item.recurrence_days.length === 0) {
                return false; // No days specified
            }

            const currentDay = now.getDay(); // 0=Sunday, 6=Saturday
            return item.recurrence_days.includes(currentDay);
        }

        return false;
    };

    /**
     * Filter and sort items based on schedule and priority.
     * Returns only items that should be displayed now, sorted by priority.
     */
    const getScheduledItems = useCallback(<T extends ScheduleFields>(
        items: T[]
    ): T[] => {
        const scheduledItems = items.filter(item => isScheduledNow(item));

        // Sort by priority: emergency > high > normal
        return scheduledItems.sort((a, b) => {
            const priorityOrder = { emergency: 3, high: 2, normal: 1 };
            const aPriority = priorityOrder[a.priority || 'normal'];
            const bPriority = priorityOrder[b.priority || 'normal'];
            return bPriority - aPriority; // Descending order
        });
    }, [isScheduledNow]);

    /**
     * Get only emergency priority items that are scheduled now.
     * Emergency items override all other content.
     */
    const getEmergencyItems = useCallback(<T extends ScheduleFields>(items: T[]): T[] => {
        return items.filter(item =>
            item.priority === 'emergency' && isScheduledNow(item)
        );
    }, [isScheduledNow]);

    /**
     * Get fallback media items (to show when no scheduled content is available).
     */
    const getFallbackItems = useCallback((media: Media[]): Media[] => {
        return media.filter(item => item.is_fallback === true && item.is_active);
    }, []);

    /**
     * Main function to get content to display.
     * Handles priority logic: Emergency > Scheduled > Fallback
     */
    const getContentToDisplay = useCallback((
        announcements: Announcement[],
        events: Event[],
        media: Media[]
    ): {
        items: (Announcement | Event | Media)[];
        mode: 'emergency' | 'scheduled' | 'fallback' | 'empty';
    } => {
        // 1. Check for emergency content first
        const emergencyAnnouncements = getEmergencyItems(announcements.filter(a => a.is_active));
        const emergencyEvents = getEmergencyItems(events.filter(e => e.is_active));
        const emergencyMedia = getEmergencyItems(media.filter(m => m.is_active));

        const allEmergency = [
            ...emergencyAnnouncements,
            ...emergencyEvents,
            ...emergencyMedia
        ];

        if (allEmergency.length > 0) {
            return { items: allEmergency, mode: 'emergency' };
        }

        // 2. Get scheduled content
        const scheduledAnnouncements = getScheduledItems(announcements.filter(a => a.is_active));
        const scheduledEvents = getScheduledItems(events.filter(e => e.is_active));
        const scheduledMedia = getScheduledItems(media.filter(m => m.is_active && !m.is_fallback));

        const allScheduled = [
            ...scheduledAnnouncements,
            ...scheduledEvents,
            ...scheduledMedia
        ];

        if (allScheduled.length > 0) {
            return { items: allScheduled, mode: 'scheduled' };
        }

        // 3. Get fallback content
        const fallbackMedia = getFallbackItems(media);

        if (fallbackMedia.length > 0) {
            return { items: fallbackMedia, mode: 'fallback' };
        }

        // 4. No content available
        return { items: [], mode: 'empty' };
    }, [getEmergencyItems, getScheduledItems, getFallbackItems]);

    return {
        isScheduledNow,
        getScheduledItems,
        getEmergencyItems,
        getFallbackItems,
        getContentToDisplay
    };
}
