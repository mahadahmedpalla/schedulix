import type { FC } from "react";
import { Filter } from 'lucide-react';

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

export const FilterBar: FC<FilterBarProps> = ({ subjects, selectedSubjects, onChange }) => {
    const toggleSubject = (id: string) => {
        if (selectedSubjects.includes(id)) {
            onChange(selectedSubjects.filter(sid => sid !== id));
        } else {
            onChange([...selectedSubjects, id]);
        }
    };

    return (
        <div className="filter-bar" style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--muted-foreground)', fontSize: '0.875rem', fontWeight: 500 }}>
                <Filter size={16} />
                Filter:
            </div>
            <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                <button
                    className="btn btn-ghost"
                    style={{
                        fontSize: '0.75rem',
                        padding: '0.4rem 0.8rem',
                        background: selectedSubjects.length === 0 ? 'var(--primary-light)' : 'transparent',
                        color: selectedSubjects.length === 0 ? 'var(--primary)' : 'var(--muted-foreground)'
                    }}
                    onClick={() => onChange([])}
                >
                    All Subjects
                </button>
                {subjects.map(subject => (
                    <button
                        key={subject.id}
                        className="btn btn-ghost"
                        style={{
                            fontSize: '0.75rem',
                            padding: '0.4rem 0.8rem',
                            background: selectedSubjects.includes(subject.id) ? `${subject.color}15` : 'transparent',
                            color: selectedSubjects.includes(subject.id) ? subject.color : 'var(--muted-foreground)',
                            borderColor: selectedSubjects.includes(subject.id) ? subject.color : 'transparent',
                            border: '1px solid'
                        }}
                        onClick={() => toggleSubject(subject.id)}
                    >
                        <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: subject.color }}></span>
                        {subject.name}
                    </button>
                ))}
            </div>
        </div>
    );
};
