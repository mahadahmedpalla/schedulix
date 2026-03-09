import type { FC } from "react";

interface Subject {
    id: string;
    name: string;
    color: string;
}

interface FilterBarProps {
    subjects: Subject[];
    selectedSubjects: string[];
    onChange: (ids: string[]) => void;
}

import "./FilterBar.css";

export const FilterBar: FC<FilterBarProps> = ({ subjects, selectedSubjects, onChange }) => {
    const toggle = (id: string) => {
        onChange(selectedSubjects.includes(id) ? [] : [id]);
    };

    const isAll = selectedSubjects.length === 0;

    return (
        <div className="filter-bar">
            {/* All chip */}
            <button
                onClick={() => onChange([])}
                className={`filter-chip all-chip ${isAll ? "active" : ""}`}
            >
                <span className="material-symbols-outlined chip-icon">grid_view</span>
                All Events
            </button>

            {/* Subject chips */}
            {subjects.map(subject => {
                const active = selectedSubjects.includes(subject.id);
                return (
                    <button
                        key={subject.id}
                        onClick={() => toggle(subject.id)}
                        className={`filter-chip ${active ? "active" : ""}`}
                        style={{
                            '--chip-color': subject.color,
                            '--chip-bg': `${subject.color}15`,
                            '--chip-border': `${subject.color}30`
                        } as React.CSSProperties}
                    >
                        <div className="chip-color-dot" />
                        {subject.name}
                    </button>
                );
            })}
        </div>
    );
};
