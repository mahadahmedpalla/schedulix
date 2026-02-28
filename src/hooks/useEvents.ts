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
    is_global: boolean;
    subjects?: Subject;
    event_types?: EventType;
}

export const useEvents = (startDate: string, endDate: string) => {
    const [events, setEvents] = useState<CalendarEvent[]>([]);
    const [subjects, setSubjects] = useState<Subject[]>([]);
    const [loading, setLoading] = useState(true);

    const fetchEvents = async () => {
        setLoading(true);

        const { data: { user } } = await supabase.auth.getUser();

        // 1. Fetch Global Events
        const globalEventsPromise = supabase
            .from('events')
            .select('*, subjects(*), event_types(*)')
            .eq('is_global', true)
            .gte('date', startDate)
            .lte('date', endDate);

        // 2. Fetch Personal Events (only if user is logged in)
        const personalEventsPromise = user
            ? supabase
                .from('personal_events')
                .select('*, subjects(*)').order('date')
                .gte('date', startDate)
                .lte('date', endDate)
            : Promise.resolve({ data: [] as any[], error: null });

        // 3. Fetch Global Completions (only if user is logged in)
        const globalCompletionsPromise = user
            ? supabase
                .from('global_event_completions')
                .select('event_id')
                .eq('user_id', user.id)
            : Promise.resolve({ data: [] as any[], error: null });

        const [globalRes, personalRes, completionsRes, subjectsRes] = await Promise.all([
            globalEventsPromise,
            personalEventsPromise,
            globalCompletionsPromise,
            supabase.from('subjects').select('*')
        ]);

        let allEvents: any[] = [];
        const completedGlobalIds = new Set((completionsRes.data || []).map((c: any) => c.event_id));

        // Aggregate and tag
        if (globalRes.data) {
            const taggedGlobal = globalRes.data.map((e: any) => ({
                ...e,
                is_global: true,
                is_completed: completedGlobalIds.has(e.id)
            }));
            allEvents = [...allEvents, ...taggedGlobal];
        }

        if (personalRes.data) {
            // Tag personal events as is_global: false for UI compatibility
            const taggedPersonal = personalRes.data.map((e: any) => ({
                ...e,
                is_global: false
            }));
            allEvents = [...allEvents, ...taggedPersonal];
        }

        setEvents(allEvents);
        if (subjectsRes.data) setSubjects(subjectsRes.data);
        setLoading(false);
    };

    useEffect(() => {
        fetchEvents();
    }, [startDate, endDate]);

    return { events, subjects, loading, refetchEvents: fetchEvents };
};
