import { useState, useEffect, useCallback } from "react";
import { supabase } from "../../services/supabase.ts";
import { useAuth } from "../../context/AuthContext.tsx";
import { Check, X, RefreshCw, AlertCircle, Clock, User, Send } from "lucide-react";

interface RequestItem {
    id: string;
    student_id: string;
    subject_id: string;
    status: string;
    notes: string | null;
    created_at: string;
    subjects: {
        id: string;
        name: string;
        color: string;
        batches?: {
            batch_code: string;
        } | null;
    } | null;
    student_profiles?: {
        email: string;
    } | null;
}

export const CrRequestsView = () => {
    const { user, role, batch_id, loading: authLoading } = useAuth();
    const [requests, setRequests] = useState<RequestItem[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [actionLoading, setActionLoading] = useState<string | null>(null);
    const [rejectionNotes, setRejectionNotes] = useState<{ [key: string]: string }>({});
    const [showRejectInput, setShowRejectInput] = useState<string | null>(null);

    const fetchRequests = useCallback(async () => {
        if (authLoading) return;

        if (!user || (role !== "admin" && role !== "super_admin")) {
            setLoading(false);
            setError("Unauthorized access. Admin privileges required.");
            return;
        }

        setLoading(true);
        setError(null);
        try {
            // ── Query based on batch_id assignment ──
            // For batch admins: requests for their assigned batch_id
            // For super_admin: see all requests
            let query = supabase
                .from("student_subject_requests")
                .select(`
                    id,
                    student_id,
                    subject_id,
                    status,
                    notes,
                    created_at,
                    batch_id,
                    subjects:subject_id (
                        id,
                        name,
                        color,
                        batches:batch_id (
                            batch_code
                        )
                    )
                `)
                .eq("status", "pending")
                .order("created_at", { ascending: false });

            if (role === "admin") {
                // Batch CR: only requests matching their assigned batch
                query = query.eq("batch_id", batch_id);
            }

            const { data, error: fetchError } = await query;
            if (fetchError) throw fetchError;

            let mappedData: RequestItem[] = [];

            if (data && data.length > 0) {
                // Fetch student emails separately (avoids PostgREST view-join schema cache issues)
                const studentIds = Array.from(new Set(data.map((item: any) => item.student_id)));

                const { data: profileData } = await supabase
                    .from("student_profiles")
                    .select("id, email")
                    .in("id", studentIds);

                const profileMap = new Map<string, string>();
                if (profileData) {
                    profileData.forEach((p: any) => profileMap.set(p.id, p.email));
                }

                mappedData = data.map((item: any) => {
                    const subj = Array.isArray(item.subjects) ? item.subjects[0] : item.subjects;
                    const batch = subj
                        ? (Array.isArray(subj.batches) ? subj.batches[0] : subj.batches)
                        : null;
                    const email = profileMap.get(item.student_id) || `Student (${item.student_id.substring(0, 8)}...)`;

                    return {
                        id: item.id,
                        student_id: item.student_id,
                        subject_id: item.subject_id,
                        status: item.status,
                        notes: item.notes,
                        created_at: item.created_at,
                        subjects: subj ? { id: subj.id, name: subj.name, color: subj.color, batches: batch } : null,
                        student_profiles: { email }
                    };
                });
            }

            setRequests(mappedData);
        } catch (err: any) {
            console.error("Fetch requests error:", err);
            setError(err.message || "Failed to load requests.");
        } finally {
            setLoading(false);
        }
    }, [user, role, batch_id, authLoading]);

    useEffect(() => {
        fetchRequests();
    }, [fetchRequests]);

    // Approve Request (Updates status to approved, which triggers the DB subscription insertion)
    const handleApprove = async (req: RequestItem) => {
        if (!user) return;
        setActionLoading(req.id);
        try {
            const { error: updateError } = await supabase
                .from("student_subject_requests")
                .update({
                    status: "approved",
                    resolved_by: user.id,
                    resolved_at: new Date().toISOString()
                })
                .eq("id", req.id);

            if (updateError) throw updateError;

            // Remove from local list
            setRequests(prev => prev.filter(r => r.id !== req.id));
        } catch (err: any) {
            console.error("Approve request error:", err);
            alert("Failed to approve request: " + err.message);
        } finally {
            setActionLoading(null);
        }
    };

    // Reject Request with optional notes
    const handleReject = async (req: RequestItem) => {
        if (!user) return;
        setActionLoading(req.id);
        const reason = rejectionNotes[req.id]?.trim() || "Rejected by Cohort Admin";
        try {
            const { error: updateError } = await supabase
                .from("student_subject_requests")
                .update({
                    status: "rejected",
                    resolved_by: user.id,
                    resolved_at: new Date().toISOString(),
                    notes: reason
                })
                .eq("id", req.id);

            if (updateError) throw updateError;

            // Remove from local list and reset rejection notes/fields
            setRequests(prev => prev.filter(r => r.id !== req.id));
            setShowRejectInput(null);
            setRejectionNotes(prev => {
                const copy = { ...prev };
                delete copy[req.id];
                return copy;
            });
        } catch (err: any) {
            console.error("Reject request error:", err);
            alert("Failed to reject request: " + err.message);
        } finally {
            setActionLoading(null);
        }
    };

    const formatDate = (dateStr: string) => {
        try {
            const d = new Date(dateStr);
            return d.toLocaleDateString(undefined, { 
                month: "short", 
                day: "numeric", 
                hour: "2-digit", 
                minute: "2-digit" 
            });
        } catch {
            return dateStr;
        }
    };

    if (loading && requests.length === 0) {
        return (
            <div style={{ display: "flex", justifyContent: "center", alignItems: "center", minHeight: "300px" }}>
                <div className="spinner" style={{ width: "2.5rem", height: "2.5rem" }} />
            </div>
        );
    }

    return (
        <div>
            {/* ── Header Area ── */}
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "2rem" }}>
                <div>
                    <h2 style={{ fontSize: "1.5rem", fontWeight: 600, margin: 0, color: "var(--fg)" }}>
                        Course Access Requests
                    </h2>
                    <p style={{ color: "var(--fg-muted)", fontSize: "0.85rem", marginTop: "0.25rem" }}>
                        Approve or reject students requesting to link subjects belonging to your cohort.
                    </p>
                </div>
                <button
                    onClick={fetchRequests}
                    className="btn btn-ghost"
                    title="Refresh list"
                    style={{ padding: "0.5rem" }}
                    disabled={loading}
                >
                    <RefreshCw size={16} className={loading ? "animate-spin" : ""} />
                </button>
            </div>

            {error && (
                <div style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "0.75rem",
                    padding: "1rem",
                    background: "rgba(var(--danger-rgb), 0.05)",
                    border: "1px solid rgba(var(--danger-rgb), 0.2)",
                    borderRadius: "0.5rem",
                    color: "var(--danger)",
                    marginBottom: "1.5rem",
                    fontSize: "0.9rem"
                }}>
                    <AlertCircle size={18} />
                    <span>{error}</span>
                </div>
            )}

            {/* ── Requests Listing ── */}
            {requests.length === 0 ? (
                <div className="surface" style={{ 
                    textAlign: "center", 
                    padding: "4rem 2rem", 
                    borderRadius: "1rem", 
                    border: "1px solid var(--border)",
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "center",
                    gap: "1rem"
                }}>
                    <div style={{
                        width: "3.5rem",
                        height: "3.5rem",
                        borderRadius: "50%",
                        background: "rgba(var(--primary-rgb), 0.08)",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        color: "var(--primary)"
                    }}>
                        <Check size={24} />
                    </div>
                    <div>
                        <h4 style={{ fontWeight: 650, color: "var(--fg)", marginBottom: "0.25rem" }}>All caught up!</h4>
                        <p style={{ color: "var(--fg-muted)", fontSize: "0.85rem" }}>
                            There are currently no pending course registration requests for your batch.
                        </p>
                    </div>
                </div>
            ) : (
                <div style={{ display: "grid", gridTemplateColumns: "1fr", gap: "1.25rem" }}>
                    {requests.map(req => (
                        <div 
                            key={req.id}
                            className="surface premium-glass"
                            style={{
                                display: "flex",
                                flexDirection: "column",
                                padding: "1.5rem",
                                borderRadius: "1rem",
                                border: "1px solid var(--border)",
                                gap: "1rem",
                                transition: "transform 0.2s ease"
                            }}
                        >
                            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: "1rem" }}>
                                {/* Left Side Details */}
                                <div style={{ display: "flex", gap: "1rem" }}>
                                    <div style={{
                                        width: "2.75rem",
                                        height: "2.75rem",
                                        borderRadius: "50%",
                                        background: "var(--primary-gradient)",
                                        display: "flex",
                                        alignItems: "center",
                                        justifyContent: "center",
                                        color: "#fff"
                                    }}>
                                        <User size={18} />
                                    </div>
                                    <div>
                                        <h4 style={{ fontWeight: 600, color: "var(--fg)", fontSize: "1rem", marginBottom: "0.2rem" }}>
                                            {req.student_profiles?.email || "Unknown Student"}
                                        </h4>
                                        <div style={{ display: "flex", gap: "0.75rem", alignItems: "center", flexWrap: "wrap" }}>
                                            <span style={{ display: "inline-flex", alignItems: "center", gap: "0.25rem", fontSize: "0.75rem", color: "var(--fg-muted)" }}>
                                                <Clock size={12} />
                                                Requested {formatDate(req.created_at)}
                                            </span>
                                            <span className="badge badge-outline" style={{ fontSize: "0.7rem", padding: "0.1rem 0.4rem" }}>
                                                Student ID: {req.student_id.substring(0, 8)}...
                                            </span>
                                        </div>
                                    </div>
                                </div>

                                {/* Right Side Course Tag */}
                                <div style={{ display: "flex", alignItems: "center", gap: "0.6rem", background: "var(--surface-overlay)", padding: "0.5rem 0.75rem", borderRadius: "0.5rem", border: "1px solid var(--border)" }}>
                                    <div style={{ width: "10px", height: "10px", borderRadius: "50%", background: req.subjects?.color || "var(--primary)" }} />
                                    <div>
                                        <span style={{ fontWeight: 550, fontSize: "0.8rem", color: "var(--fg)" }}>{req.subjects?.name}</span>
                                        <span style={{ fontSize: "0.7rem", color: "var(--fg-muted)", display: "block" }}>
                                            Cohort: {req.subjects?.batches?.batch_code || "Global"}
                                        </span>
                                    </div>
                                </div>
                            </div>

                            {/* Approve / Reject Controls */}
                            {showRejectInput !== req.id ? (
                                <div style={{ display: "flex", justifyContent: "flex-end", gap: "0.75rem", borderTop: "1px solid var(--border)", paddingTop: "1rem" }}>
                                    <button
                                        onClick={() => setShowRejectInput(req.id)}
                                        disabled={actionLoading === req.id}
                                        className="btn btn-outline"
                                        style={{ 
                                            padding: "0.5rem 1rem", 
                                            fontSize: "0.8rem", 
                                            color: "var(--danger)", 
                                            borderColor: "rgba(var(--danger-rgb), 0.2)",
                                            gap: "0.3rem"
                                        }}
                                    >
                                        <X size={14} />
                                        <span>Reject</span>
                                    </button>
                                    <button
                                        onClick={() => handleApprove(req)}
                                        disabled={actionLoading === req.id}
                                        className="btn btn-primary"
                                        style={{ padding: "0.5rem 1rem", fontSize: "0.8rem", gap: "0.3rem" }}
                                    >
                                        {actionLoading === req.id ? (
                                            <span className="spinner" style={{ width: "12px", height: "12px" }} />
                                        ) : (
                                            <>
                                                <Check size={14} />
                                                <span>Approve Registration</span>
                                            </>
                                        )}
                                    </button>
                                </div>
                            ) : (
                                <div style={{ 
                                    display: "flex", 
                                    flexDirection: "column", 
                                    gap: "0.75rem", 
                                    borderTop: "1px solid var(--border)", 
                                    paddingTop: "1rem",
                                    animation: "fade-in 0.2s ease"
                                }}>
                                    <label style={{ fontSize: "0.8rem", fontWeight: 550, color: "var(--danger)" }}>
                                        Rejection Reason / Comment
                                    </label>
                                    <textarea
                                        value={rejectionNotes[req.id] || ""}
                                        onChange={(e) => setRejectionNotes({ ...rejectionNotes, [req.id]: e.target.value })}
                                        placeholder="Provide reason for rejection (e.g. 'Class capacity reached' or 'Please contact CR directly'). This will be visible to the student."
                                        rows={3}
                                        style={{
                                            width: "100%",
                                            padding: "0.75rem",
                                            borderRadius: "0.5rem",
                                            border: "1px solid rgba(var(--danger-rgb), 0.2)",
                                            background: "rgba(var(--danger-rgb), 0.01)",
                                            color: "var(--fg)",
                                            fontSize: "0.85rem",
                                            fontFamily: "var(--font)"
                                        }}
                                    />
                                    <div style={{ display: "flex", justifyContent: "flex-end", gap: "0.75rem" }}>
                                        <button
                                            onClick={() => {
                                                setShowRejectInput(null);
                                                setRejectionNotes(prev => {
                                                    const copy = { ...prev };
                                                    delete copy[req.id];
                                                    return copy;
                                                });
                                            }}
                                            className="btn btn-outline"
                                            style={{ padding: "0.4rem 0.8rem", fontSize: "0.75rem" }}
                                        >
                                            Cancel
                                        </button>
                                        <button
                                            onClick={() => handleReject(req)}
                                            disabled={actionLoading === req.id}
                                            className="btn btn-primary"
                                            style={{ 
                                                padding: "0.4rem 0.8rem", 
                                                fontSize: "0.75rem", 
                                                background: "var(--danger)",
                                                borderColor: "var(--danger)"
                                            }}
                                        >
                                            {actionLoading === req.id ? (
                                                <span className="spinner" style={{ width: "12px", height: "12px" }} />
                                            ) : (
                                                <>
                                                    <Send size={12} style={{ marginRight: "0.25rem" }} />
                                                    Confirm Rejection
                                                </>
                                            )}
                                        </button>
                                    </div>
                                </div>
                            )}
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};
