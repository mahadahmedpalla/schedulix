import { useState, useMemo, useEffect } from "react";
import { Layout } from "../components/Layout.tsx";
import { Calendar } from "../components/Calendar.tsx";
import { EventDetailPanel } from "../components/EventDetailPanel.tsx";
import { FilterBar } from "../components/FilterBar.tsx";
import { useEvents } from "../hooks/useEvents.ts";
import { useAuth } from "../context/AuthContext.tsx";
import { AddPersonalEventModal } from "../components/AddPersonalEventModal.tsx";
import { useNavigate } from "react-router-dom";

export const CalendarView = () => {
    const { user, batch_id, loading: authLoading } = useAuth();
    const navigate = useNavigate();
    const [selectedDate, setSelectedDate] = useState<Date | null>(null);
    const [selectedSubjects, setSelectedSubjects] = useState<string[]>([]);
    const [isAddModalOpen, setIsAddModalOpen] = useState(false);

    // Enforce Authentication: Redirect unsigned-in users
    useEffect(() => {
        if (!authLoading && !user) {
            navigate("/login");
        }
    }, [user, authLoading, navigate]);

    // Fetch events for the user's specific batch
    const { events, subjects, loading: eventsLoading, refetchEvents } = useEvents('2024-01-01', '2027-12-31', batch_id);

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

    // Render loading state during authentication check
    if (authLoading) {
        return (
            <Layout>
                <div className="skeleton-calendar">
                    <div className="spinner" />
                    <p>Authenticating your session...</p>
                </div>
            </Layout>
        );
    }

    // Gated View: If logged in but no batch assigned
    if (!batch_id) {
        return (
            <Layout>
                <div style={{
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                    minHeight: '60vh',
                    gap: '1rem',
                    textAlign: 'center',
                    color: 'var(--fg-muted)'
                }}>
                    <span className="material-symbols-outlined" style={{ fontSize: '3rem', color: 'var(--primary)' }}>
                        warning
                    </span>
                    <h2 style={{ fontWeight: 600, color: 'var(--fg)' }}>No Batch Linked</h2>
                    <p style={{ fontSize: '0.9rem' }}>
                        Your account is not linked to any academic batch.<br />
                        Please contact your coordinator or super admin to assign your cohort.
                    </p>
                </div>
            </Layout>
        );
    }

    return (
        <Layout>
            <div className="dashboard-content-wrapper">
                {/* ── Top Bar (Filters & Quick Actions) ── */}
                <div className="dashboard-top-bar">
                    <div className="filters-section">
                        {!eventsLoading && subjects.length > 0 && (
                            <FilterBar
                                subjects={subjects}
                                selectedSubjects={selectedSubjects}
                                onChange={setSelectedSubjects}
                            />
                        )}
                    </div>

                    <div className="quick-actions">
                        <button
                            onClick={() => setIsAddModalOpen(true)}
                            className="btn btn-primary"
                            style={{ gap: "0.5rem" }}
                        >
                            <span className="material-symbols-outlined">add</span>
                            <span>Add Event</span>
                        </button>
                    </div>
                </div>

                {/* ── Calendar Section ── */}
                <div className="dashboard-calendar-section">
                    {eventsLoading ? (
                        <div className="skeleton-calendar">
                            <div className="spinner" />
                            <p>Loading academic events...</p>
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
