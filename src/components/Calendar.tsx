import { useState, type FC } from "react";
import "./Calendar.css";

interface CalendarEvent {
    id: string;
    date: string;
    title: string;
    is_global?: boolean;
    is_completed?: boolean;
    subjects?: { color: string };
}

interface CalendarProps {
    events: CalendarEvent[];
    onDateClick: (date: Date) => void;
    selectedSubjectIds?: string[];
    allSubjects?: { id: string; color: string }[];
}

const MONTH_NAMES = [
    "January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December",
];
const DAY_NAMES = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

export const Calendar: FC<CalendarProps> = ({ events, onDateClick }) => {
    const [currentDate, setCurrentDate] = useState(new Date());

    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const totalDays = new Date(year, month + 1, 0).getDate();
    const startDay = new Date(year, month, 1).getDay();

    const goToToday = () => setCurrentDate(new Date());
    const prevMonth = () => setCurrentDate(new Date(year, month - 1, 1));
    const nextMonth = () => setCurrentDate(new Date(year, month + 1, 1));

    // Build cells
    const cells: React.ReactNode[] = [];

    // Empty leading cells
    for (let i = 0; i < startDay; i++) {
        cells.push(<div key={`e-${i}`} className="calendar-day other-month" />);
    }

    // Day cells
    for (let d = 1; d <= totalDays; d++) {
        const date = new Date(year, month, d);
        const yyyy = date.getFullYear();
        const mm = String(date.getMonth() + 1).padStart(2, '0');
        const dd = String(date.getDate()).padStart(2, '0');
        const dateStr = `${yyyy}-${mm}-${dd}`;

        const dayEvents = events.filter(e => e.date === dateStr);
        const isToday = date.getTime() === today.getTime();
        const isCurrentMonth = date.getMonth() === month;

        cells.push(
            <div
                key={dateStr}
                className={`calendar-day ${!isCurrentMonth ? "other-month" : ""} ${isToday ? "today" : ""}`}
                onClick={() => onDateClick(date)}
            >
                <div className="day-header">
                    <span className={`day-number ${isToday ? "today-badge" : ""}`}>
                        {d}
                    </span>
                </div>

                <div className="day-events-container">
                    {dayEvents.slice(0, 3).map((e) => (
                        <div
                            key={e.id}
                            className="event-pill"
                            style={{
                                backgroundColor: `${e.subjects?.color ?? '#94a3b8'}15`,
                                color: e.subjects?.color ?? 'var(--fg-subtle)',
                                borderLeft: `3px solid ${e.subjects?.color ?? '#94a3b8'}`
                            }}
                        >
                            <span className="pill-title">
                                {e.title}
                            </span>
                        </div>
                    ))}
                    {dayEvents.length > 3 && (
                        <div className="event-pill-more">
                            +{dayEvents.length - 3} more
                        </div>
                    )}
                </div>
            </div>
        );
    }

    return (
        <div className="calendar-card">
            {/* ── Calendar Controls ── */}
            <div className="calendar-controls">
                <div className="calendar-title-group">
                    <nav className="breadcrumb">
                        <span>Dashboard</span>
                        <span className="separator">/</span>
                        <span className="active">Calendar</span>
                    </nav>
                    <div className="calendar-current-info">
                        <h2 className="current-month-text">{MONTH_NAMES[month]} {year}</h2>
                        <div className="mini-nav">
                            <button className="nav-icon-btn" onClick={prevMonth}>
                                <span className="material-symbols-outlined">chevron_left</span>
                            </button>
                            <button className="nav-today-btn" onClick={goToToday}>Today</button>
                            <button className="nav-icon-btn" onClick={nextMonth}>
                                <span className="material-symbols-outlined">chevron_right</span>
                            </button>
                        </div>
                    </div>
                </div>

                <div className="view-switcher">
                    <div className="pill-group">
                        <button className="pill-btn disabled">Day</button>
                        <button className="pill-btn disabled">Week</button>
                        <button className="pill-btn active">Month</button>
                    </div>
                </div>
            </div>

            {/* ── Grid ── */}
            <div className="calendar-grid-header">
                {DAY_NAMES.map(day => (
                    <div key={day} className="weekday-label">{day}</div>
                ))}
            </div>
            <div className="calendar-grid">
                {cells}
            </div>
        </div>
    );
};
