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

        // 1. Fetch Active Subject Subscriptions for the student
        if (!user) {
            setEvents([]);
            setSubjects([]);
            setLoading(false);
            return;
        }

        // Fetch subjects that this student is actively subscribed to
        const { data: subsData, error: subsError } = await supabase
            .from('student_subject_subscriptions')
            .select('subject_id, subjects(*)')
            .eq('student_id', user.id)
            .eq('is_active', true);

        if (subsError) {
            console.error("Error fetching subject subscriptions:", subsError);
            setEvents([]);
            setSubjects([]);
            setLoading(false);
            return;
        }

        // Extract subjects and valid IDs safely mapping arrays to single objects
        const subscribedSubjects = (subsData || [])
            .map((sub: any) => Array.isArray(sub.subjects) ? sub.subjects[0] : sub.subjects)
            .filter((s): s is any => s !== null && s !== undefined);

        const validSubjectIds = subscribedSubjects.map(s => s.id);

        // 2. Fetch Academic Events for these active subjects
        let academicEventsQuery = supabase
            .from('events')
            .select('*, subjects(*), event_types(*)')
            .gte('date', startDate)
            .lte('date', endDate);
        
        if (validSubjectIds.length > 0) {
            // Only fetch events for subjects the student is actively subscribed to
            academicEventsQuery = academicEventsQuery.in('subject_id', validSubjectIds);
        } else {
            // If no active subscriptions, return no academic events
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
        setSubjects(subscribedSubjects);
        setLoading(false);
    };

    useEffect(() => {
        fetchEvents();
    }, [startDate, endDate, batchId]);

    return { events, subjects, loading, refetchEvents: fetchEvents };
};
