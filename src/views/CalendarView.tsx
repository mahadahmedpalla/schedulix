import { useState, useMemo } from "react";
import { Layout } from "../components/Layout.tsx";
import { Calendar } from "../components/Calendar.tsx";
import { EventDetailPanel } from "../components/EventDetailPanel.tsx";
import { FilterBar } from "../components/FilterBar.tsx";
import { useEvents } from "../hooks/useEvents.ts";
import { useAuth } from "../context/AuthContext.tsx";
import { AddPersonalEventModal } from "../components/AddPersonalEventModal.tsx";
import { Plus } from "lucide-react";

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
        const dateStr = selectedDate.toISOString().split("T")[0];
        return events.filter(e => e.date === dateStr);
    }, [events, selectedDate]);

    return (
        <Layout>
            {/* ── Page header ── */}
            <div style={{ marginBottom: "2rem" }}>
                <h1 style={{ fontSize: "1.75rem", marginBottom: "0.25rem" }}>
                    Academic Calendar
                    <span
                        style={{
                            display: "inline-block",
                            marginLeft: "0.75rem",
                            fontSize: "0.75rem",
                            fontWeight: 600,
                            color: "var(--fg)",
                            background: "var(--bg-raised)",
                            border: "1px solid var(--border)",
                            padding: "0.15rem 0.5rem",
                            borderRadius: "99px",
                            verticalAlign: "middle",
                        }}
                    >
                        {new Date().getFullYear()}
                    </span>
                </h1>
                <p style={{ color: "var(--fg-muted)", fontSize: "0.875rem", marginBottom: "1.25rem" }}>
                    Click any date to see scheduled events.
                </p>

                {/* Filter bar & Actions row */}
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "1rem" }}>
                    {subjects.length > 0 && (
                        <FilterBar
                            subjects={subjects}
                            selectedSubjects={selectedSubjects}
                            onChange={setSelectedSubjects}
                        />
                    )}

                    {user && (
                        <button
                            onClick={() => setIsAddModalOpen(true)}
                            className="btn btn-outline"
                            style={{ padding: "0.4rem 0.75rem", fontSize: "0.8125rem" }}
                        >
                            <Plus size={14} />
                            Personal Event
                        </button>
                    )}
                </div>
            </div>

            {/* ── Calendar card ── */}
            <div className="surface" style={{ padding: "1.5rem", minHeight: "560px" }}>
                {loading ? (
                    <div
                        style={{
                            display: "flex",
                            flexDirection: "column",
                            alignItems: "center",
                            justifyContent: "center",
                            height: "400px",
                            gap: "1rem",
                        }}
                    >
                        <div className="spinner" />
                        <p style={{ color: "var(--fg-muted)", fontSize: "0.875rem" }}>
                            Loading calendar…
                        </p>
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

            {/* ── Event panel ── */}
            <EventDetailPanel
                date={selectedDate}
                events={selectedDateEvents}
                onClose={() => setSelectedDate(null)}
                onRefresh={refetchEvents}
            />

            {/* ── Add Event Modal ── */}
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
