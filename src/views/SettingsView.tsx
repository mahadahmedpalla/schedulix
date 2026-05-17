import { useEffect, useState } from "react";
import { Layout } from "../components/Layout.tsx";
import { useAuth } from "../context/AuthContext.tsx";
import { supabase } from "../services/supabase.ts";
import { useNavigate } from "react-router-dom";

interface Subscription {
    id: string;
    subject_id: string;
    is_active: boolean;
    subjects: {
        id: string;
        name: string;
        color: string;
        batch_id: string;
    };
}

interface Batch {
    id: string;
    batch_code: string;
    batch_year: number;
    session: string;
    section: string;
}

interface Subject {
    id: string;
    name: string;
    color: string;
    batch_id: string;
}

export const SettingsView = () => {
    const { user, batch_id, batch_code, loading: authLoading } = useAuth();
    const navigate = useNavigate();

    const [subscriptions, setSubscriptions] = useState<Subscription[]>([]);
    const [batches, setBatches] = useState<Batch[]>([]);
    const [selectedBatchId, setSelectedBatchId] = useState<string>("");
    const [batchSubjects, setBatchSubjects] = useState<Subject[]>([]);
    const [loadingSubs, setLoadingSubs] = useState(true);
    const [actionLoading, setActionLoading] = useState<string | null>(null);

    // Enforce Authentication
    useEffect(() => {
        if (!authLoading && !user) {
            navigate("/login");
        }
    }, [user, authLoading, navigate]);

    // Fetch student subscriptions
    const fetchSubscriptions = async () => {
        if (!user) return;
        setLoadingSubs(true);
        const { data, error } = await supabase
            .from("student_subject_subscriptions")
            .select("id, subject_id, is_active, subjects(*)")
            .eq("student_id", user.id);

        if (error) {
            console.error("Error fetching subscriptions:", error);
        } else {
            // Safely map subjects array to a single object if inferred as an array by the query
            const mappedData: Subscription[] = (data || []).map((item: any) => ({
                id: item.id,
                subject_id: item.subject_id,
                is_active: item.is_active,
                subjects: Array.isArray(item.subjects) 
                    ? item.subjects[0] 
                    : item.subjects
            })).filter(item => item.subjects !== null && item.subjects !== undefined);
            
            setSubscriptions(mappedData);
        }
        setLoadingSubs(false);
    };

    // Fetch other batches for repeating/cross courses
    const fetchBatches = async () => {
        const { data, error } = await supabase
            .from("batches")
            .select("*")
            .order("batch_code");
        
        if (error) {
            console.error("Error fetching batches:", error);
        } else {
            // Filter out student's primary batch so they only see other cohorts
            const otherBatches = (data || []).filter(b => b.id !== batch_id);
            setBatches(otherBatches);
        }
    };

    useEffect(() => {
        if (user) {
            fetchSubscriptions();
            fetchBatches();
        }
    }, [user, batch_id]);

    // Fetch subjects when another batch is selected
    useEffect(() => {
        const fetchBatchSubjects = async () => {
            if (!selectedBatchId) {
                setBatchSubjects([]);
                return;
            }
            const { data, error } = await supabase
                .from("subjects")
                .select("*")
                .eq("batch_id", selectedBatchId);

            if (error) {
                console.error("Error fetching subjects:", error);
            } else {
                setBatchSubjects(data || []);
            }
        };
        fetchBatchSubjects();
    }, [selectedBatchId]);

    // Toggle active status for core/subscribed courses
    const handleToggleSubscription = async (sub: Subscription) => {
        setActionLoading(sub.id);
        const { error } = await supabase
            .from("student_subject_subscriptions")
            .update({ is_active: !sub.is_active })
            .eq("id", sub.id);

        if (error) {
            console.error("Error updating subscription:", error);
        } else {
            await fetchSubscriptions();
        }
        setActionLoading(null);
    };

    // Subscribe to a repeating course (junior cohort)
    const handleSubscribeToSubject = async (subject: Subject) => {
        if (!user) return;
        setActionLoading(subject.id);
        const { error } = await supabase
            .from("student_subject_subscriptions")
            .upsert({
                student_id: user.id,
                subject_id: subject.id,
                is_active: true
            }, {
                onConflict: "student_id, subject_id"
            });

        if (error) {
            console.error("Error subscribing to course:", error);
        } else {
            await fetchSubscriptions();
            // Remove from the selectable list
            setBatchSubjects(prev => prev.filter(s => s.id !== subject.id));
        }
        setActionLoading(null);
    };

    // Unsubscribe from a custom added course completely
    const handleUnsubscribeSubject = async (sub: Subscription) => {
        setActionLoading(sub.id);
        const { error } = await supabase
            .from("student_subject_subscriptions")
            .delete()
            .eq("id", sub.id);

        if (error) {
            console.error("Error deleting subscription:", error);
        } else {
            await fetchSubscriptions();
        }
        setActionLoading(null);
    };

    // Separate subscriptions into core batch and custom added repeat/cross courses
    const coreSubscriptions = subscriptions.filter(
        sub => sub.subjects && sub.subjects.batch_id === batch_id
    );

    const repeatSubscriptions = subscriptions.filter(
        sub => sub.subjects && sub.subjects.batch_id !== batch_id
    );

    // Filter selectable subjects to exclude already subscribed ones
    const subscribedSubjectIds = new Set(subscriptions.map(s => s.subject_id));
    const availableBatchSubjects = batchSubjects.filter(
        s => !subscribedSubjectIds.has(s.id)
    );

    if (authLoading || loadingSubs) {
        return (
            <Layout>
                <div style={{
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "center",
                    justifyContent: "center",
                    minHeight: "60vh",
                    gap: "1.5rem"
                }}>
                    <div className="spinner" />
                    <p style={{ color: "var(--fg-muted)" }}>Loading academic preferences...</p>
                </div>
            </Layout>
        );
    }

    return (
        <Layout>
            <div className="settings-container fade-in" style={{ padding: "0.5rem", display: "flex", flexDirection: "column", gap: "2.5rem" }}>
                
                {/* ── Dashboard Header ── */}
                <div style={{ borderBottom: "1px solid var(--border)", paddingBottom: "1.5rem" }}>
                    <h2 style={{ fontSize: "2rem", fontWeight: 700, color: "var(--fg)", marginBottom: "0.25rem" }}>Academic Settings</h2>
                    <p style={{ color: "var(--fg-muted)", fontSize: "0.9rem" }}>Manage your timetable preferences, drop courses, or link repeating junior subjects.</p>
                </div>

                {/* ── Student Profile Header Card ── */}
                <div className="surface premium-glass" style={{ padding: "2rem", borderRadius: "1rem", display: "flex", alignItems: "center", gap: "1.5rem", flexWrap: "wrap" }}>
                    <div style={{
                        width: "3.5rem",
                        height: "3.5rem",
                        borderRadius: "50%",
                        background: "var(--primary-gradient)",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        color: "#fff"
                    }}>
                        <span className="material-symbols-outlined" style={{ fontSize: "2rem" }}>person_filled</span>
                    </div>
                    <div>
                        <h3 style={{ fontSize: "1.25rem", fontWeight: 600, color: "var(--fg)", marginBottom: "0.2rem" }}>{user?.email}</h3>
                        <div style={{ display: "flex", alignItems: "center", gap: "0.75rem", flexWrap: "wrap" }}>
                            <span className="badge badge-primary" style={{ display: "inline-flex", gap: "0.3rem", alignItems: "center" }}>
                                <span className="material-symbols-outlined" style={{ fontSize: "1rem" }}>school</span>
                                {batch_code || "No Cohort linked"}
                            </span>
                            <span className="badge badge-outline" style={{ display: "inline-flex", gap: "0.3rem", alignItems: "center" }}>
                                <span className="material-symbols-outlined" style={{ fontSize: "1rem" }}>fingerprint</span>
                                Student Account
                            </span>
                        </div>
                    </div>
                </div>

                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))", gap: "2rem" }}>
                    
                    {/* ── Left Column: My Core Timetable ── */}
                    <div style={{ display: "flex", flexDirection: "column", gap: "2rem" }}>
                        <div className="surface" style={{ padding: "2rem", borderRadius: "1rem", border: "1px solid var(--border)" }}>
                            <div style={{ display: "flex", alignItems: "center", gap: "0.75rem", marginBottom: "1.5rem" }}>
                                <span className="material-symbols-outlined" style={{ color: "var(--primary)", fontSize: "1.75rem" }}>fact_check</span>
                                <h4 style={{ fontSize: "1.15rem", fontWeight: 600, color: "var(--fg)" }}>My Core Courses</h4>
                            </div>
                            <p style={{ color: "var(--fg-muted)", fontSize: "0.85rem", marginBottom: "1.5rem" }}>
                                Subjects registered to your primary cohort ({batch_code}). Uncheck any subject that you have dropped to remove its events from your calendar.
                            </p>

                            {coreSubscriptions.length === 0 ? (
                                <div style={{ textAlign: "center", padding: "2rem", color: "var(--fg-muted)", fontSize: "0.9rem" }}>
                                    No subjects found for your primary cohort.
                                </div>
                            ) : (
                                <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
                                    {coreSubscriptions.map((sub) => (
                                        <div 
                                            key={sub.id} 
                                            style={{ 
                                                display: "flex", 
                                                alignItems: "center", 
                                                justifyContent: "space-between",
                                                padding: "1rem",
                                                borderRadius: "0.75rem",
                                                background: sub.is_active ? "rgba(var(--primary-rgb), 0.03)" : "rgba(var(--fg-muted-rgb), 0.05)",
                                                border: "1px solid var(--border)",
                                                transition: "all 0.2s ease"
                                            }}
                                        >
                                            <div style={{ display: "flex", alignItems: "center", gap: "1rem" }}>
                                                <div style={{ 
                                                    width: "12px", 
                                                    height: "12px", 
                                                    borderRadius: "50%", 
                                                    background: sub.subjects?.color || "var(--primary)" 
                                                }} />
                                                <div>
                                                    <p style={{ fontWeight: 550, color: sub.is_active ? "var(--fg)" : "var(--fg-muted)", textDecoration: sub.is_active ? "none" : "line-through", fontSize: "0.95rem" }}>
                                                        {sub.subjects?.name}
                                                    </p>
                                                    <span style={{ fontSize: "0.75rem", color: "var(--fg-muted)" }}>
                                                        {sub.is_active ? "Active Timeline" : "Dropped (Hidden)"}
                                                    </span>
                                                </div>
                                            </div>
                                            <button
                                                onClick={() => handleToggleSubscription(sub)}
                                                disabled={actionLoading === sub.id}
                                                className={`btn ${sub.is_active ? "btn-outline" : "btn-primary"}`}
                                                style={{ padding: "0.4rem 0.8rem", fontSize: "0.8rem" }}
                                            >
                                                {actionLoading === sub.id ? (
                                                    <span className="spinner" style={{ width: "12px", height: "12px" }} />
                                                ) : sub.is_active ? (
                                                    "Drop Course"
                                                ) : (
                                                    "Restore"
                                                )}
                                            </button>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>

                        {/* ── Sub-Column: Active Custom Repeat Courses ── */}
                        {repeatSubscriptions.length > 0 && (
                            <div className="surface" style={{ padding: "2rem", borderRadius: "1rem", border: "1px solid var(--border)" }}>
                                <div style={{ display: "flex", alignItems: "center", gap: "0.75rem", marginBottom: "1.5rem" }}>
                                    <span className="material-symbols-outlined" style={{ color: "var(--primary)", fontSize: "1.75rem" }}>library_add_check</span>
                                    <h4 style={{ fontSize: "1.15rem", fontWeight: 600, color: "var(--fg)" }}>Repeating / Custom Courses</h4>
                                </div>
                                <p style={{ color: "var(--fg-muted)", fontSize: "0.85rem", marginBottom: "1.5rem" }}>
                                    Courses you are taking from other cohorts or junior batches.
                                </p>

                                <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
                                    {repeatSubscriptions.map((sub) => (
                                        <div 
                                            key={sub.id} 
                                            style={{ 
                                                display: "flex", 
                                                alignItems: "center", 
                                                justifyContent: "space-between",
                                                padding: "1rem",
                                                borderRadius: "0.75rem",
                                                background: "rgba(var(--primary-rgb), 0.03)",
                                                border: "1px solid var(--border)"
                                            }}
                                        >
                                            <div style={{ display: "flex", alignItems: "center", gap: "1rem" }}>
                                                <div style={{ 
                                                    width: "12px", 
                                                    height: "12px", 
                                                    borderRadius: "50%", 
                                                    background: sub.subjects?.color || "var(--primary)" 
                                                }} />
                                                <div>
                                                    <p style={{ fontWeight: 550, color: "var(--fg)", fontSize: "0.95rem" }}>
                                                        {sub.subjects?.name}
                                                    </p>
                                                    <span style={{ fontSize: "0.75rem", color: "var(--fg-muted)" }}>
                                                        Repeat Course (Active Timeline)
                                                    </span>
                                                </div>
                                            </div>
                                            <button
                                                onClick={() => handleUnsubscribeSubject(sub)}
                                                disabled={actionLoading === sub.id}
                                                className="btn btn-outline"
                                                style={{ padding: "0.4rem 0.8rem", fontSize: "0.8rem", color: "var(--danger)", borderColor: "var(--danger)" }}
                                            >
                                                {actionLoading === sub.id ? (
                                                    <span className="spinner" style={{ width: "12px", height: "12px" }} />
                                                ) : (
                                                    "Unsubscribe"
                                                )}
                                            </button>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>

                    {/* ── Right Column: Cross-Enrollment / Repeat Panel ── */}
                    <div className="surface" style={{ padding: "2rem", borderRadius: "1rem", border: "1px solid var(--border)", height: "fit-content" }}>
                        <div style={{ display: "flex", alignItems: "center", gap: "0.75rem", marginBottom: "1.5rem" }}>
                            <span className="material-symbols-outlined" style={{ color: "var(--primary)", fontSize: "1.75rem" }}>add_card</span>
                            <h4 style={{ fontSize: "1.15rem", fontWeight: 600, color: "var(--fg)" }}>Link Repeating Subject</h4>
                        </div>
                        <p style={{ color: "var(--fg-muted)", fontSize: "0.85rem", marginBottom: "1.5rem" }}>
                            Need to catch up on a failed course or proceed with a course from a junior batch? Subscribe to that specific subject to show its events on your calendar.
                        </p>

                        <div style={{ display: "flex", flexDirection: "column", gap: "1.25rem" }}>
                            <div style={{ display: "flex", flexDirection: "column", gap: "0.4rem" }}>
                                <label style={{ fontSize: "0.8rem", fontWeight: 550, color: "var(--fg-muted)" }}>Select Target Cohort</label>
                                <select 
                                    value={selectedBatchId} 
                                    onChange={e => setSelectedBatchId(e.target.value)}
                                    className="input-select"
                                    style={{
                                        width: "100%",
                                        padding: "0.75rem",
                                        borderRadius: "0.5rem",
                                        background: "var(--surface-overlay)",
                                        border: "1px solid var(--border)",
                                        color: "var(--fg)"
                                    }}
                                >
                                    <option value="">-- Choose Junior / Other Batch --</option>
                                    {batches.map(b => (
                                        <option key={b.id} value={b.id}>{b.batch_code}</option>
                                    ))}
                                </select>
                            </div>

                            {selectedBatchId && (
                                <div style={{ borderTop: "1px solid var(--border)", paddingTop: "1.25rem", display: "flex", flexDirection: "column", gap: "1rem" }}>
                                    <h5 style={{ fontSize: "0.85rem", fontWeight: 600, color: "var(--fg)" }}>Available Subjects</h5>
                                    
                                    {availableBatchSubjects.length === 0 ? (
                                        <p style={{ fontSize: "0.8rem", color: "var(--fg-muted)", textAlign: "center", padding: "1rem" }}>
                                            No additional subjects available to subscribe (or you are already subscribed to all of them).
                                        </p>
                                    ) : (
                                        <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
                                            {availableBatchSubjects.map(sub => (
                                                <div 
                                                    key={sub.id} 
                                                    style={{
                                                        display: "flex",
                                                        alignItems: "center",
                                                        justifyContent: "space-between",
                                                        padding: "0.75rem",
                                                        borderRadius: "0.5rem",
                                                        background: "var(--surface)",
                                                        border: "1px solid var(--border)"
                                                    }}
                                                >
                                                    <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
                                                        <div style={{ width: "10px", height: "10px", borderRadius: "50%", background: sub.color }} />
                                                        <span style={{ fontSize: "0.85rem", fontWeight: 500, color: "var(--fg)" }}>{sub.name}</span>
                                                    </div>
                                                    <button
                                                        onClick={() => handleSubscribeToSubject(sub)}
                                                        disabled={actionLoading === sub.id}
                                                        className="btn btn-primary"
                                                        style={{ padding: "0.3rem 0.6rem", fontSize: "0.75rem", gap: "0.25rem" }}
                                                    >
                                                        {actionLoading === sub.id ? (
                                                            <span className="spinner" style={{ width: "10px", height: "10px" }} />
                                                        ) : (
                                                            <>
                                                                <span className="material-symbols-outlined" style={{ fontSize: "0.9rem" }}>add</span>
                                                                <span>Link</span>
                                                            </>
                                                        )}
                                                    </button>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </Layout>
    );
};
