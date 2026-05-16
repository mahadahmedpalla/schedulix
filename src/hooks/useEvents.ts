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

export const useEvents = (startDate: string, endDate: string, batchId?: string | null) => {
    const [events, setEvents] = useState<CalendarEvent[]>([]);
    const [subjects, setSubjects] = useState<Subject[]>([]);
    const [loading, setLoading] = useState(true);

    const fetchEvents = async () => {
        setLoading(true);

        const { data: { user } } = await supabase.auth.getUser();

        // 1. Fetch Subjects for this batch
        // CRITICAL: If batchId is missing for a logged-in user, we should fetch NOTHING
        if (!batchId && user) {
            setEvents([]);
            setSubjects([]);
            setLoading(false);
            return;
        }

        let subjectsQuery = supabase.from('subjects').select('*');
        if (batchId) {
            subjectsQuery = subjectsQuery.eq('batch_id', batchId);
        } else {
            // For guests with no batch selected, we might want to show nothing 
            // or we can allow them to see everything (user's choice).
            // Let's default to nothing for security.
            setEvents([]);
            setSubjects([]);
            setLoading(false);
            return;
        }

        const subjectsRes = await subjectsQuery;
        const validSubjectIds = (subjectsRes.data || []).map(s => s.id);

        // 2. Fetch Academic Events for these subjects
        let academicEventsQuery = supabase
            .from('events')
            .select('*, subjects(*), event_types(*)')
            .gte('date', startDate)
            .lte('date', endDate);
        
        if (batchId && validSubjectIds.length > 0) {
            // Only fetch events for subjects belonging to this batch
            academicEventsQuery = academicEventsQuery.in('subject_id', validSubjectIds);
        } else if (batchId && validSubjectIds.length === 0) {
            // If batch is selected but has no subjects, we should return no academic events
            // (Unless we want truly global non-subject events, but usually they are linked)
            academicEventsQuery = academicEventsQuery.eq('id', '00000000-0000-0000-0000-000000000000'); // Force empty
        }

        // 3. Fetch Personal Events (only if user is logged in)
        const personalEventsPromise = user
            ? supabase
                .from('personal_events')
                .select('*, subjects(*)').order('date')
                .gte('date', startDate)
                .lte('date', endDate)
            : Promise.resolve({ data: [] as any[], error: null });

        // 4. Fetch Global Completions (only if user is logged in)
        const globalCompletionsPromise = user
            ? supabase
                .from('global_event_completions')
                .select('event_id')
                .eq('user_id', user.id)
            : Promise.resolve({ data: [] as any[], error: null });

        const [academicRes, personalRes, completionsRes] = await Promise.all([
            academicEventsQuery,
            personalEventsPromise,
            globalCompletionsPromise,
        ]);

        let allEvents: any[] = [];
        const completedGlobalIds = new Set((completionsRes.data || []).map((c: any) => c.event_id));

        // Aggregate and tag
        if (academicRes.data) {
            const taggedGlobal = academicRes.data.map((e: any) => ({
                ...e,
                is_global: true,
                is_completed: completedGlobalIds.has(e.id)
            }));
            allEvents = [...allEvents, ...taggedGlobal];
        }

        if (personalRes.data) {
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
    }, [startDate, endDate, batchId]);

    return { events, subjects, loading, refetchEvents: fetchEvents };
};
