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
                gap: "0.5rem",
                flexWrap: "wrap",
            }}
        >
            {/* Label */}
            <span
                style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "0.25rem",
                    fontSize: "0.75rem",
                    fontWeight: 600,
                    color: "var(--fg-muted)",
                    textTransform: "uppercase",
                    flexShrink: 0,
                    marginRight: "0.5rem",
                }}
            >
                <SlidersHorizontal size={14} />
            </span>

            {/* All chip */}
            <button
                onClick={() => onChange([])}
                style={{
                    padding: "0.25rem 0.75rem",
                    borderRadius: "99px",
                    fontSize: "0.8125rem",
                    fontWeight: 500,
                    fontFamily: "var(--font)",
                    cursor: "pointer",
                    border: "1px solid",
                    transition: "all 0.15s",
                    background: isAll ? "var(--fg)" : "var(--bg-surface)",
                    color: isAll ? "#ffffff" : "var(--fg-muted)",
                    borderColor: isAll ? "var(--fg)" : "var(--border)",
                    boxShadow: isAll ? "var(--shadow-sm)" : "none",
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
                            gap: "0.35rem",
                            padding: "0.25rem 0.75rem",
                            borderRadius: "99px",
                            fontSize: "0.8125rem",
                            fontWeight: 500,
                            fontFamily: "var(--font)",
                            cursor: "pointer",
                            border: "1px solid",
                            transition: "all 0.15s",
                            background: active ? `${subject.color}10` : "var(--bg-surface)",
                            color: active ? subject.color : "var(--fg-muted)",
                            borderColor: active ? `${subject.color}40` : "var(--border)",
                        }}
                    >
                        <span
                            style={{
                                width: "6px",
                                height: "6px",
                                borderRadius: "50%",
                                background: subject.color,
                                opacity: active ? 1 : 0.5,
                            }}
                        />
                        {subject.name}
                    </button>
                );
            })}
        </div>
    );
};
