import { useState, useMemo } from 'react';
import { Layout } from '../components/Layout.tsx';
import { Calendar } from '../components/Calendar.tsx';
import { EventDetailPanel } from '../components/EventDetailPanel.tsx';
import { useEvents } from '../hooks/useEvents.ts';
import { FilterBar } from '../components/FilterBar.tsx';

export const CalendarView = () => {
    const [selectedDate, setSelectedDate] = useState<Date | null>(null);
    const [selectedSubjects, setSelectedSubjects] = useState<string[]>([]);

    // For now, fetch a wide range of events
    // In a real app, this should update based on current month in Calendar
    const { events, subjects, loading } = useEvents('2026-01-01', '2026-12-31');

    const filteredEvents = useMemo(() => {
        if (selectedSubjects.length === 0) return events;
        return events.filter(e => selectedSubjects.includes(e.subject_id));
    }, [events, selectedSubjects]);

    const selectedDateEvents = useMemo(() => {
        if (!selectedDate) return [];
        const dateStr = selectedDate.toISOString().split('T')[0];
        return events.filter(e => e.date === dateStr);
    }, [events, selectedDate]);

    return (
        <Layout>
            <div className="calendar-view">
                <header style={{ marginBottom: '2.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
                    <div>
                        <h1 style={{ fontSize: '2.25rem', fontWeight: 700, letterSpacing: '-0.02em', marginBottom: '0.5rem' }}>Student Calendar</h1>
                        <p style={{ color: 'var(--muted-foreground)', fontSize: '1.125rem' }}>Track your academic journey with ease.</p>
                    </div>

                    <FilterBar
                        subjects={subjects}
                        selectedSubjects={selectedSubjects}
                        onChange={setSelectedSubjects}
                    />
                </header>

                <div className="premium-glass" style={{ padding: '2rem', borderRadius: 'var(--radius)', minHeight: '600px' }}>
                    {loading ? (
                        <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '400px' }}>
                            <p>Loading events...</p>
                        </div>
                    ) : (
                        <Calendar
                            events={filteredEvents}
                            onDateClick={setSelectedDate}
                        />
                    )}
                </div>

                <EventDetailPanel
                    date={selectedDate}
                    events={selectedDateEvents}
                    onClose={() => setSelectedDate(null)}
                />
            </div>
        </Layout>
    );
};
