import { useMemo, type FC } from "react";
import { X, FileText, Tag, CalendarX, User } from "lucide-react";
import "./EventDetailPanel.css";

interface EventDetailPanelProps {
    date: Date | null;
    events: {
        id: string;
        title: string;
        description?: string;
        file_url?: string;
        is_global: boolean;
        subjects?: { name: string; color: string };
        event_types?: { name: string };
    }[];
    onClose: () => void;
}

export const EventDetailPanel: FC<EventDetailPanelProps> = ({ date, events, onClose }) => {
    if (!date) return null;

    const formatDate = (d: Date) =>
        d.toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric" });

    // SORTING: Personal (custom) events first, then global
    const sortedEvents = useMemo(() => {
        return [...events].sort((a, b) => {
            if (a.is_global === b.is_global) return 0;
            return a.is_global ? 1 : -1; // false (custom) comes before true (global)
        });
    }, [events]);

    const lastCustomIndex = useMemo(() => {
        let lastIndex = -1;
        sortedEvents.forEach((e, i) => {
            if (e.is_global === false) lastIndex = i;
        });
        return lastIndex;
    }, [sortedEvents]);

    return (
        <>
            <div className={`panel-overlay${date ? " active" : ""}`} onClick={onClose} />
            <aside className={`event-detail-panel${date ? " active" : ""}`}>
                {/* Header */}
                <div className="panel-header">
                    <div className="panel-header-info">
                        <h3>{formatDate(date)}</h3>
                        <p className="event-count">
                            {events.length === 0
                                ? "No events scheduled"
                                : `${events.length} event${events.length > 1 ? "s" : ""} this day`}
                        </p>
                    </div>
                    <button className="close-btn" onClick={onClose} aria-label="Close panel">
                        <X size={16} />
                    </button>
                </div>

                {/* Content */}
                <div className="panel-content">
                    {events.length === 0 ? (
                        <div className="empty-state">
                            <div className="empty-state-icon">
                                <CalendarX size={24} />
                            </div>
                            <p style={{ fontWeight: 600, color: "var(--fg-muted)" }}>Nothing scheduled</p>
                            <p style={{ fontSize: "0.8rem", color: "var(--fg-subtle)" }}>
                                Enjoy your free day!
                            </p>
                        </div>
                    ) : (
                        <div className="event-list">
                            {sortedEvents.map((event, index) => (
                                <div key={event.id || index}>
                                    <div
                                        className="event-card"
                                        style={{ borderLeftColor: event.subjects?.color ?? (event.is_global ? "var(--primary)" : "#000000") }}
                                    >
                                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.75rem', flexWrap: 'wrap', gap: '0.5rem' }}>
                                            {/* Subject tag */}
                                            {event.subjects && (
                                                <div
                                                    className="event-tag"
                                                    style={{
                                                        color: event.subjects.color,
                                                        backgroundColor: `${event.subjects.color}18`,
                                                        margin: 0
                                                    }}
                                                >
                                                    <Tag size={10} />
                                                    {event.subjects.name}
                                                </div>
                                            )}

                                            {/* Custom Badge */}
                                            {!event.is_global && (
                                                <div className="custom-badge" style={{ fontSize: '0.55rem', padding: '1px 6px' }}>
                                                    <User size={8} style={{ marginRight: '2px' }} />
                                                    Personal
                                                </div>
                                            )}
                                        </div>

                                        <h4 style={{ marginTop: 0 }}>{event.title || "Untitled"}</h4>

                                        {event.description && (
                                            <p className="event-desc">{event.description}</p>
                                        )}

                                        <div className="event-meta">
                                            {event.event_types && (
                                                <span className="meta-item">
                                                    <FileText size={11} />
                                                    {event.event_types.name}
                                                </span>
                                            )}
                                            {event.file_url && (
                                                <a
                                                    href={event.file_url}
                                                    target="_blank"
                                                    rel="noopener noreferrer"
                                                    className="meta-item file-link"
                                                >
                                                    <FileText size={11} />
                                                    View Attachment
                                                </a>
                                            )}
                                        </div>
                                    </div>

                                    {/* Divider after the last custom event */}
                                    {index === lastCustomIndex && index < sortedEvents.length - 1 && (
                                        <div className="panel-divider">
                                            <span>Global Schedule</span>
                                        </div>
                                    )}
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </aside>
        </>
    );
};
