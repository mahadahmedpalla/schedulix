import { useEffect, useState } from 'react';
import { supabase } from '../services/supabase.ts';

export interface Subject {
    id: string;
    name: string;
    color: string;
}

export interface EventType {
    id: string;
    name: string;
}

export interface CalendarEvent {
    id: string;
    subject_id: string;
    type_id: string | null;
    title: string;
    description: string;
    file_url: string;
    date: string;
    subjects?: Subject;
    event_types?: EventType;
}

export const useEvents = (startDate: string, endDate: string) => {
    const [events, setEvents] = useState<CalendarEvent[]>([]);
    const [subjects, setSubjects] = useState<Subject[]>([]);
    const [loading, setLoading] = useState(true);

    const fetchEvents = async () => {
        setLoading(true);

        const [eventsRes, subjectsRes] = await Promise.all([
            supabase
                .from('events')
                .select('*, subjects(*), event_types(*)')
                .gte('date', startDate)
                .lte('date', endDate),
            supabase.from('subjects').select('*')
        ]);

        if (eventsRes.data) setEvents(eventsRes.data);
        if (subjectsRes.data) setSubjects(subjectsRes.data);
        setLoading(false);
    };

    useEffect(() => {
        fetchEvents();
    }, [startDate, endDate]);

    return { events, subjects, loading, refetchEvents: fetchEvents };
};
