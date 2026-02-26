import { useState, type FormEvent, useEffect, useRef } from "react";
import { X, CalendarPlus } from "lucide-react";
import { supabase } from "../services/supabase.ts";
import { useAuth } from "../context/AuthContext.tsx";

interface AddPersonalEventModalProps {
    onClose: () => void;
    onSuccess: () => void;
    subjects: { id: string; name: string }[];
}

export const AddPersonalEventModal = ({ onClose, onSuccess, subjects }: AddPersonalEventModalProps) => {
    const { user } = useAuth();
    const [title, setTitle] = useState("");
    const [date, setDate] = useState("");
    const [subjectId, setSubjectId] = useState("");
    const [description, setDescription] = useState("");
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const modalRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        // Escape to close
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === "Escape") onClose();
        };
        window.addEventListener("keydown", handleKeyDown);
        return () => window.removeEventListener("keydown", handleKeyDown);
    }, [onClose]);

    const handleSubmit = async (e: FormEvent) => {
        e.preventDefault();
        if (!user) return;

        setLoading(true);
        setError(null);

        // Private event -> is_global = false
        const { error: insertError } = await supabase.from("events").insert([
            {
                title,
                date,
                subject_id: subjectId,
                description,
                created_by: user.id,
                is_global: false,
            }
        ]);

        if (insertError) {
            setError(insertError.message);
            setLoading(false);
        } else {
            setLoading(false);
            onSuccess();
        }
    };

    return (
        <div
            style={{
                position: "fixed",
                inset: 0,
                zIndex: 200,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                background: "rgba(0, 0, 0, 0.4)",
                backdropFilter: "blur(2px)",
                padding: "1rem",
                animation: "fadeIn 0.2s ease-out",
            }}
            onClick={(e) => {
                if (e.target === e.currentTarget) onClose();
            }}
        >
            <div
                ref={modalRef}
                className="surface"
                style={{
                    width: "100%",
                    maxWidth: "440px",
                    display: "flex",
                    flexDirection: "column",
                    animation: "fadeIn 0.2s ease-out",
                }}
            >
                {/* Header */}
                <div
                    style={{
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "space-between",
                        padding: "1.25rem 1.5rem",
                        borderBottom: "1px solid var(--border)",
                    }}
                >
                    <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                        <CalendarPlus size={18} color="var(--primary)" />
                        <h2 style={{ fontSize: "1.125rem", fontWeight: 600 }}>Add Personal Event</h2>
                    </div>
                    <button
                        onClick={onClose}
                        className="btn btn-ghost"
                        style={{ padding: "0.35rem", borderRadius: "50%", height: "auto" }}
                    >
                        <X size={16} />
                    </button>
                </div>

                {/* Content */}
                <div style={{ padding: "1.5rem" }}>
                    {error && (
                        <div
                            style={{
                                background: "#fef2f2",
                                border: "1px solid #fecaca",
                                color: "#b91c1c",
                                borderRadius: "var(--radius-sm)",
                                padding: "0.75rem",
                                fontSize: "0.8125rem",
                                marginBottom: "1.25rem",
                                fontWeight: 500,
                            }}
                        >
                            {error}
                        </div>
                    )}

                    <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
                        <div>
                            <label style={{ display: "block", fontSize: "0.8125rem", fontWeight: 500, marginBottom: "0.4rem" }}>
                                Title
                            </label>
                            <input
                                type="text"
                                value={title}
                                onChange={e => setTitle(e.target.value)}
                                required
                                style={{ width: "100%" }}
                                placeholder="Study Group, Homework, etc."
                            />
                        </div>

                        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem" }}>
                            <div>
                                <label style={{ display: "block", fontSize: "0.8125rem", fontWeight: 500, marginBottom: "0.4rem" }}>
                                    Date
                                </label>
                                <input
                                    type="date"
                                    value={date}
                                    onChange={e => setDate(e.target.value)}
                                    required
                                    style={{ width: "100%" }}
                                />
                            </div>

                            <div>
                                <label style={{ display: "block", fontSize: "0.8125rem", fontWeight: 500, marginBottom: "0.4rem" }}>
                                    Subject / Category
                                </label>
                                <select
                                    value={subjectId}
                                    onChange={e => setSubjectId(e.target.value)}
                                    required
                                    style={{ width: "100%" }}
                                >
                                    <option value="" disabled>Select...</option>
                                    {subjects.map(s => (
                                        <option key={s.id} value={s.id}>{s.name}</option>
                                    ))}
                                </select>
                            </div>
                        </div>

                        <div>
                            <label style={{ display: "block", fontSize: "0.8125rem", fontWeight: 500, marginBottom: "0.4rem" }}>
                                Description (Optional)
                            </label>
                            <textarea
                                value={description}
                                onChange={e => setDescription(e.target.value)}
                                rows={3}
                                style={{ width: "100%", resize: "vertical" }}
                                placeholder="Details about this event..."
                            />
                        </div>

                        <div style={{ display: "flex", justifyContent: "flex-end", gap: "0.75rem", marginTop: "1rem" }}>
                            <button
                                type="button"
                                onClick={onClose}
                                className="btn btn-ghost"
                            >
                                Cancel
                            </button>
                            <button
                                type="submit"
                                disabled={loading}
                                className="btn btn-primary"
                            >
                                {loading ? "Adding..." : "Add Event"}
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    );
};
