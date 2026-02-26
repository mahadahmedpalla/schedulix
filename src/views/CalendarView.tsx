import { useState, useMemo } from "react";
import { Layout } from "../components/Layout.tsx";
import { Calendar } from "../components/Calendar.tsx";
import { EventDetailPanel } from "../components/EventDetailPanel.tsx";
import { useEvents } from "../hooks/useEvents.ts";
import { FilterBar } from "../components/FilterBar.tsx";

export const CalendarView = () => {
    const [selectedDate, setSelectedDate] = useState<Date | null>(null);
    const [selectedSubjects, setSelectedSubjects] = useState<string[]>([]);
    const { events, subjects, loading } = useEvents("2024-01-01", "2027-12-31");

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
            <div style={{ marginBottom: "2.5rem" }}>
                <h1
                    style={{
                        fontSize: "2rem",
                        fontWeight: 800,
                        letterSpacing: "-0.04em",
                        marginBottom: "0.4rem",
                        lineHeight: 1.1,
                    }}
                >
                    Academic Calendar
                    <span
                        style={{
                            display: "inline-block",
                            marginLeft: "0.5rem",
                            fontSize: "0.9rem",
                            fontWeight: 600,
                            color: "var(--primary)",
                            background: "var(--primary-dim)",
                            padding: "0.2rem 0.6rem",
                            borderRadius: "99px",
                            verticalAlign: "middle",
                            letterSpacing: "0.01em",
                        }}
                    >
                        {new Date().getFullYear()}
                    </span>
                </h1>
                <p style={{ color: "var(--fg-muted)", fontSize: "0.95rem", marginBottom: "1.25rem" }}>
                    Click any date to see scheduled events.
                </p>

                {/* Filter bar */}
                {subjects.length > 0 && (
                    <FilterBar
                        subjects={subjects}
                        selectedSubjects={selectedSubjects}
                        onChange={setSelectedSubjects}
                    />
                )}
            </div>

            {/* ── Calendar card ── */}
            <div
                className="premium-glass"
                style={{
                    borderRadius: "var(--radius-lg)",
                    padding: "2rem",
                    minHeight: "560px",
                }}
            >
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
                        <p style={{ color: "var(--fg-muted)", fontSize: "0.9rem" }}>
                            Loading events…
                        </p>
                    </div>
                ) : (
                    <Calendar events={filteredEvents} onDateClick={setSelectedDate} />
                )}
            </div>

            {/* ── Event panel ── */}
            <EventDetailPanel
                date={selectedDate}
                events={selectedDateEvents}
                onClose={() => setSelectedDate(null)}
            />
        </Layout>
    );
};
