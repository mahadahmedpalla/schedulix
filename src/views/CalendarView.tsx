import { useState, useMemo } from "react";
import { Layout } from "../components/Layout.tsx";
import { Calendar } from "../components/Calendar.tsx";
import { EventDetailPanel } from "../components/EventDetailPanel.tsx";
import { FilterBar } from "../components/FilterBar.tsx";
import { useEvents } from "../hooks/useEvents.ts";
import { useAuth } from "../context/AuthContext.tsx";
import { AddPersonalEventModal } from "../components/AddPersonalEventModal.tsx";

export const CalendarView = () => {
    const { user } = useAuth();
    const [selectedDate, setSelectedDate] = useState<Date | null>(null);
    const [selectedSubjects, setSelectedSubjects] = useState<string[]>([]);
    const [isAddModalOpen, setIsAddModalOpen] = useState(false);

    // Fetch a wide range of events
    const { events, subjects, loading, refetchEvents } = useEvents('2024-01-01', '2027-12-31');

    const filteredEvents = useMemo(() => {
        if (selectedSubjects.length === 0) return events;
        return events.filter(e => selectedSubjects.includes(e.subject_id));
    }, [events, selectedSubjects]);

    const selectedDateEvents = useMemo(() => {
        if (!selectedDate) return [];
        const yyyy = selectedDate.getFullYear();
        const mm = String(selectedDate.getMonth() + 1).padStart(2, '0');
        const dd = String(selectedDate.getDate()).padStart(2, '0');
        const dateStr = `${yyyy}-${mm}-${dd}`;
        return events.filter(e => e.date === dateStr);
    }, [events, selectedDate]);

    return (
        <Layout>
            <div className="dashboard-content-wrapper">
                {/* ── Top Bar (Filters & Quick Actions) ── */}
                <div className="dashboard-top-bar">
                    <div className="filters-section">
                        {!loading && subjects.length > 0 && (
                            <FilterBar
                                subjects={subjects}
                                selectedSubjects={selectedSubjects}
                                onChange={setSelectedSubjects}
                            />
                        )}
                    </div>

                    <div className="quick-actions">
                        <button
                            onClick={() => user ? setIsAddModalOpen(true) : (window.location.href = '/login')}
                            className={`btn ${user ? "btn-primary" : "btn-outline"}`}
                            style={{ gap: "0.5rem" }}
                        >
                            <span className="material-symbols-outlined">add</span>
                            <span>{user ? "Add Event" : "Sign in to add events"}</span>
                        </button>
                    </div>
                </div>

                {/* ── Calendar Section ── */}
                <div className="dashboard-calendar-section">
                    {loading ? (
                        <div className="skeleton-calendar">
                            <div className="spinner" />
                            <p>Connecting to Schedulix...</p>
                        </div>
                    ) : (
                        <Calendar
                            events={filteredEvents}
                            onDateClick={setSelectedDate}
                            selectedSubjectIds={selectedSubjects}
                            allSubjects={subjects}
                        />
                    )}
                </div>
            </div>

            {/* ── Detail Panel ── */}
            <EventDetailPanel
                date={selectedDate}
                events={selectedDateEvents}
                onClose={() => setSelectedDate(null)}
                onRefresh={refetchEvents}
            />

            {/* ── Modals ── */}
            {isAddModalOpen && (
                <AddPersonalEventModal
                    subjects={subjects}
                    onClose={() => setIsAddModalOpen(false)}
                    onSuccess={() => {
                        setIsAddModalOpen(false);
                        refetchEvents();
                    }}
                />
            )}
        </Layout>
    );
};
