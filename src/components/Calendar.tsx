import { useState, type FC } from "react";
import { ChevronLeft, ChevronRight } from 'lucide-react';
import './Calendar.css';

interface CalendarEvent {
    id: string;
    date: string;
    subjects?: {
        color: string;
    };
}

interface CalendarProps {
    events: CalendarEvent[];
    onDateClick: (date: Date) => void;
}

export const Calendar: FC<CalendarProps> = ({ events, onDateClick }) => {
    const [currentDate, setCurrentDate] = useState(new Date());

    const daysInMonth = (year: number, month: number) => new Date(year, month + 1, 0).getDate();
    const firstDayOfMonth = (year: number, month: number) => new Date(year, month, 1).getDay();

    const prevMonth = () => {
        setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1));
    };

    const nextMonth = () => {
        setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1));
    };

    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const days = [];
    const totalDays = daysInMonth(year, month);
    const startDay = firstDayOfMonth(year, month);

    // Padding for start of month
    for (let i = 0; i < startDay; i++) {
        days.push(<div key={`empty-${i}`} className="calendar-day empty"></div>);
    }

    for (let d = 1; d <= totalDays; d++) {
        const date = new Date(year, month, d);
        const dateString = date.toISOString().split('T')[0];
        const dayEvents = events.filter(e => e.date === dateString);
        const isToday = date.getTime() === today.getTime();
        const hasEvents = dayEvents.length > 0;

        days.push(
            <div
                key={d}
                className={`calendar-day ${hasEvents ? 'has-events' : ''} ${isToday ? 'today' : ''}`}
                onClick={() => onDateClick(date)}
            >
                <span className="day-number">{d}</span>
                {hasEvents && (
                    <div className="event-indicators">
                        {dayEvents.slice(0, 3).map((e, i) => (
                            <span
                                key={i}
                                className="event-dot"
                                style={{ backgroundColor: e.subjects?.color || 'var(--primary)' }}
                            ></span>
                        ))}
                        {dayEvents.length > 3 && <span className="event-more">+</span>}
                    </div>
                )}
            </div>
        );
    }

    const monthNames = [
        "January", "February", "March", "April", "May", "June",
        "July", "August", "September", "October", "November", "December"
    ];

    return (
        <div className="calendar-container">
            <div className="calendar-header">
                <h2>{monthNames[month]} {year}</h2>
                <div className="calendar-nav">
                    <button onClick={prevMonth} className="btn btn-ghost"><ChevronLeft size={20} /></button>
                    <button onClick={nextMonth} className="btn btn-ghost"><ChevronRight size={20} /></button>
                </div>
            </div>

            <div className="calendar-grid">
                {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
                    <div key={day} className="weekday">{day}</div>
                ))}
                {days}
            </div>
        </div>
    );
};
