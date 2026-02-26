import { useState, type FC } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import "./Calendar.css";

interface CalendarEvent {
    id: string;
    date: string;
    subjects?: { color: string };
}

interface CalendarProps {
    events: CalendarEvent[];
    onDateClick: (date: Date) => void;
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
        cells.push(<div key={`e-${i}`} className="calendar-day empty" />);
    }

    // Day cells
    for (let d = 1; d <= totalDays; d++) {
        const date = new Date(year, month, d);
        const dateStr = date.toISOString().split("T")[0];
        const dayEvents = events.filter(e => e.date === dateStr);
        const isToday = date.getTime() === today.getTime();
        const hasEvents = dayEvents.length > 0;

        cells.push(
            <div
                key={d}
                className={`calendar-day${hasEvents ? " has-events" : ""}${isToday ? " today" : ""}`}
                onClick={() => onDateClick(date)}
                title={hasEvents ? `${dayEvents.length} event${dayEvents.length > 1 ? "s" : ""}` : undefined}
            >
                <span className="day-number">{d}</span>

                {hasEvents && (
                    <div className="event-indicators">
                        {dayEvents.slice(0, 4).map((e, i) => (
                            <span
                                key={i}
                                className="event-dot"
                                style={{ backgroundColor: e.subjects?.color ?? "var(--fg-subtle)" }}
                            />
                        ))}
                        {dayEvents.length > 4 && (
                            <span className="event-more">+{dayEvents.length - 4}</span>
                        )}
                    </div>
                )}
            </div>
        );
    }

    return (
        <div className="calendar-container">
            {/* ── Header ── */}
            <div className="calendar-header">
                <h2 className="calendar-month-title">
                    {MONTH_NAMES[month]} {year}
                </h2>

                <div className="calendar-nav">
                    <button className="calendar-today-btn" onClick={goToToday}>Today</button>
                    <button className="calendar-nav-btn" onClick={prevMonth} aria-label="Previous month">
                        <ChevronLeft size={16} />
                    </button>
                    <button className="calendar-nav-btn" onClick={nextMonth} aria-label="Next month">
                        <ChevronRight size={16} />
                    </button>
                </div>
            </div>

            {/* ── Grid ── */}
            <div className="calendar-grid">
                {DAY_NAMES.map(day => (
                    <div key={day} className="weekday">{day}</div>
                ))}
                {cells}
            </div>
        </div>
    );
};
