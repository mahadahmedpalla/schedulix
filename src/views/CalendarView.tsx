import { useState, useMemo } from 'react';
import { Layout } from '../components/Layout.tsx';
import { Calendar } from '../components/Calendar.tsx';
import { EventDetailPanel } from '../components/EventDetailPanel.tsx';
import { useEvents } from '../hooks/useEvents.ts';
import { FilterBar } from '../components/FilterBar.tsx';
import { useAuth } from '../context/AuthContext.tsx';
import { Plus } from 'lucide-react';
import { AddPersonalEventModal } from '../components/AddPersonalEventModal.tsx';

export const CalendarView = () => {
    const { user } = useAuth();
    const [selectedDate, setSelectedDate] = useState<Date | null>(null);
    const [selectedSubjects, setSelectedSubjects] = useState<string[]>([]);
    const [showAddModal, setShowAddModal] = useState(false);

    // For now, fetch a wide range of events
    const { events, subjects, loading, refetchEvents } = useEvents('2026-01-01', '2026-12-31');

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
                <header style={{ marginBottom: '2.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', flexWrap: 'wrap', gap: '1rem' }}>
                    <div>
                        <h1 style={{ fontSize: '2.25rem', fontWeight: 700, letterSpacing: '-0.02em', marginBottom: '0.5rem' }}>Student Calendar</h1>
                        <p style={{ color: 'var(--fg-muted)', fontSize: '1.125rem' }}>Track your academic journey with ease.</p>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                        {user && (
                            <button
                                onClick={() => setShowAddModal(true)}
                                className="btn btn-primary"
                                style={{ gap: '0.5rem' }}
                            >
                                <Plus size={18} />
                                Personal Event
                            </button>
                        )}
                        <FilterBar
                            subjects={subjects}
                            selectedSubjects={selectedSubjects}
                            onChange={setSelectedSubjects}
                        />
                    </div>
                </header>

                <div className="premium-glass" style={{ padding: '2rem', borderRadius: 'var(--radius)', minHeight: '600px', background: 'var(--bg-surface)', border: '1px solid var(--border)' }}>
                    {loading ? (
                        <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', height: '400px', gap: '1rem' }}>
                            <div className="spinner" />
                            <p style={{ color: 'var(--fg-muted)', fontSize: '0.875rem' }}>Loading events...</p>
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

                {showAddModal && (
                    <AddPersonalEventModal
                        subjects={subjects}
                        onClose={() => setShowAddModal(false)}
                        onSuccess={() => {
                            setShowAddModal(false);
                            refetchEvents();
                        }}
                    />
                )}
            </div>
        </Layout>
    );
};
