import type { FC } from "react";
import { X, FileText, Tag } from 'lucide-react';
import './EventDetailPanel.css';

interface EventDetailPanelProps {
    date: Date | null;
    events: {
        title: string;
        description?: string;
        file_url?: string;
        subjects?: {
            name: string;
            color: string;
        };
        event_types?: {
            name: string;
        };
    }[];
    onClose: () => void;
}

export const EventDetailPanel: FC<EventDetailPanelProps> = ({ date, events, onClose }) => {
    if (!date) return null;

    const formatDate = (d: Date) => {
        return d.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' });
    };

    return (
        <>
            <div className={`panel-overlay ${date ? 'active' : ''}`} onClick={onClose}></div>
            <aside className={`event-detail-panel premium-glass ${date ? 'active' : ''}`}>
                <div className="panel-header">
                    <div>
                        <h3>{formatDate(date)}</h3>
                        <p className="event-count">{events.length} upcoming events</p>
                    </div>
                    <button onClick={onClose} className="btn btn-ghost close-btn">
                        <X size={24} />
                    </button>
                </div>

                <div className="panel-content">
                    {events.length === 0 ? (
                        <div className="empty-state">
                            <p>No events scheduled for this day.</p>
                        </div>
                    ) : (
                        <div className="event-list">
                            {events.map((event, index) => (
                                <div key={index} className="event-card" style={{ borderLeftColor: event.subjects?.color }}>
                                    <div className="event-tag" style={{ color: event.subjects?.color, backgroundColor: `${event.subjects?.color}15` }}>
                                        <Tag size={12} />
                                        {event.subjects?.name}
                                    </div>
                                    <h4>{event.title || 'No Title'}</h4>
                                    {event.description && <p className="event-desc">{event.description}</p>}

                                    <div className="event-meta">
                                        {event.event_types && (
                                            <span className="meta-item">
                                                <FileText size={14} />
                                                {event.event_types.name}
                                            </span>
                                        )}
                                        {event.file_url && (
                                            <a href={event.file_url} target="_blank" rel="noopener noreferrer" className="meta-item file-link">
                                                <FileText size={14} />
                                                View Attachment
                                            </a>
                                        )}
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </aside>
        </>
    );
};
