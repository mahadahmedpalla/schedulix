import type { FC } from "react";
import { SlidersHorizontal } from "lucide-react";

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
    const toggle = (id: string) => {
        onChange(
            selectedSubjects.includes(id)
                ? selectedSubjects.filter(s => s !== id)
                : [...selectedSubjects, id]
        );
    };

    const isAll = selectedSubjects.length === 0;

    return (
        <div
            style={{
                display: "flex",
                alignItems: "center",
                gap: "0.625rem",
                flexWrap: "wrap",
            }}
        >
            {/* Label */}
            <span
                style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "0.35rem",
                    fontSize: "0.75rem",
                    fontWeight: 700,
                    color: "var(--fg-muted)",
                    letterSpacing: "0.06em",
                    textTransform: "uppercase",
                    flexShrink: 0,
                }}
            >
                <SlidersHorizontal size={13} />
                Filter
            </span>

            {/* All chip */}
            <button
                onClick={() => onChange([])}
                style={{
                    padding: "0.3rem 0.8rem",
                    borderRadius: "99px",
                    fontSize: "0.78rem",
                    fontWeight: 600,
                    fontFamily: "var(--font)",
                    cursor: "pointer",
                    border: "1px solid",
                    transition: "all 0.2s",
                    background: isAll ? "var(--primary-dim)" : "var(--bg-raised)",
                    color: isAll ? "var(--primary)" : "var(--fg-muted)",
                    borderColor: isAll ? "rgba(45,212,191,0.4)" : "var(--border)",
                    boxShadow: isAll ? "var(--glow)" : "none",
                }}
            >
                All
            </button>

            {/* Subject chips */}
            {subjects.map(subject => {
                const active = selectedSubjects.includes(subject.id);
                return (
                    <button
                        key={subject.id}
                        onClick={() => toggle(subject.id)}
                        style={{
                            display: "flex",
                            alignItems: "center",
                            gap: "0.4rem",
                            padding: "0.3rem 0.8rem",
                            borderRadius: "99px",
                            fontSize: "0.78rem",
                            fontWeight: 600,
                            fontFamily: "var(--font)",
                            cursor: "pointer",
                            border: "1px solid",
                            transition: "all 0.2s",
                            background: active ? `${subject.color}18` : "var(--bg-raised)",
                            color: active ? subject.color : "var(--fg-muted)",
                            borderColor: active ? `${subject.color}55` : "var(--border)",
                            boxShadow: active ? `0 0 12px ${subject.color}30` : "none",
                        }}
                    >
                        <span
                            style={{
                                width: "7px",
                                height: "7px",
                                borderRadius: "50%",
                                background: subject.color,
                                flexShrink: 0,
                                boxShadow: active ? `0 0 6px ${subject.color}` : "none",
                            }}
                        />
                        {subject.name}
                    </button>
                );
            })}
        </div>
    );
};
