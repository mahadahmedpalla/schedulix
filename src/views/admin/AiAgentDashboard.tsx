import { useState, useEffect } from "react";
import { supabase } from "../../services/supabase.ts";
import { useAuth } from "../../context/AuthContext.tsx";
import { processAiPrompt } from "../../services/aiAgent.ts";
import type { AIAction } from "../../services/aiAgent.ts";
import { Bot, Send, Calendar, AlertTriangle, Trash2, CalendarPlus, Edit2 } from "lucide-react";

export const AiAgentDashboard = () => {
    const { user, batch_id, role } = useAuth();
    
    const [prompt, setPrompt] = useState("");
    const [loading, setLoading] = useState(false);
    const [actions, setActions] = useState<AIAction[]>([]);
    const [executing, setExecuting] = useState(false);
    const [successMsg, setSuccessMsg] = useState<string | null>(null);
    const [errorMsg, setErrorMsg] = useState<string | null>(null);

    const [subjects, setSubjects] = useState<any[]>([]);
    const [eventTypes, setEventTypes] = useState<any[]>([]);
    const [existingEvents, setExistingEvents] = useState<any[]>([]);

    useEffect(() => {
        if (!batch_id) return;
        
        const fetchContextData = async () => {
            const { data: subData } = await supabase
                .from("subjects")
                .select("id, name, color")
                .eq("batch_id", batch_id);
            if (subData) setSubjects(subData);

            const { data: typeData } = await supabase
                .from("event_types")
                .select("id, name");
            if (typeData) setEventTypes(typeData);

            if (subData && subData.length > 0) {
                const subjectIds = subData.map(s => s.id);
                const { data: eventData } = await supabase
                    .from("events")
                    .select("id, title, date, subject_id, type_id, subjects(name)")
                    .in("subject_id", subjectIds)
                    .gte("date", new Date().toISOString().split('T')[0]);
                if (eventData) setExistingEvents(eventData);
            }
        };

        fetchContextData();
    }, [batch_id]);

    const handlePromptSubmit = async () => {
        if (!prompt.trim()) return;
        setLoading(true);
        setErrorMsg(null);
        setSuccessMsg(null);
        setActions([]);

        try {
            const result = await processAiPrompt(prompt, subjects, eventTypes, existingEvents);
            setActions(result);
            if (result.length === 0) {
                setErrorMsg("AI could not extract any valid actions from your prompt.");
            }
        } catch (err: any) {
            setErrorMsg(err.message);
        } finally {
            setLoading(false);
        }
    };

    const handleApproveAll = async () => {
        if (actions.length === 0 || !user) return;
        setExecuting(true);
        setErrorMsg(null);
        
        try {
            for (const action of actions) {
                if (action.subject_id) {
                    const isValidSubject = subjects.find(s => s.id === action.subject_id);
                    if (!isValidSubject) {
                        throw new Error(`Unauthorized or invalid subject for action: ${action.title}`);
                    }
                }

                if (action.action === "CREATE") {
                    await supabase.from("events").insert({
                        title: action.title,
                        description: action.description,
                        date: action.date,
                        subject_id: action.subject_id,
                        type_id: action.type_id,
                        is_global: true,
                        created_by: user.id
                    });
                } else if (action.action === "UPDATE" && action.event_id) {
                    await supabase.from("events").update({
                        title: action.title,
                        description: action.description,
                        date: action.date,
                        type_id: action.type_id
                    }).eq("id", action.event_id);
                } else if (action.action === "DELETE" && action.event_id) {
                    await supabase.from("events").delete().eq("id", action.event_id);
                }
            }
            setSuccessMsg("Successfully executed all AI actions!");
            setActions([]);
            setPrompt("");
            
            const subjectIds = subjects.map(s => s.id);
            const { data: eventData } = await supabase
                .from("events")
                .select("id, title, date, subject_id, type_id, subjects(name)")
                .in("subject_id", subjectIds)
                .gte("date", new Date().toISOString().split('T')[0]);
            if (eventData) setExistingEvents(eventData);

        } catch (err: any) {
            console.error(err);
            setErrorMsg("Failed to execute some actions. " + err.message);
        } finally {
            setExecuting(false);
        }
    };

    if (role !== "admin" && role !== "super_admin") {
        return (
            <div style={{ padding: "2rem", textAlign: "center" }}>
                <AlertTriangle size={48} color="var(--danger)" />
                <h2>Access Denied</h2>
            </div>
        );
    }

    return (
        <div className="admin-manager-container fade-in">
            <div className="manager-header" style={{ marginBottom: "2rem" }}>
                <div>
                    <h1 style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                        <Bot size={28} style={{ color: "var(--accent)" }} />
                        AI Agent Dashboard
                    </h1>
                    <p>Bulk manage your cohort's calendar using natural language.</p>
                </div>
            </div>

            <div className="surface" style={{ padding: "1.5rem", borderRadius: "1rem", border: "1px solid var(--border)", marginBottom: "2rem" }}>
                <textarea 
                    value={prompt}
                    onChange={e => setPrompt(e.target.value)}
                    placeholder="E.g. Create a Midterm for DBMS next Friday, an OS Quiz on Nov 20th, and delete the existing Math Assignment."
                    rows={4}
                    style={{
                        width: "100%",
                        padding: "1rem",
                        borderRadius: "0.5rem",
                        background: "var(--surface-overlay)",
                        border: "1px solid var(--border)",
                        color: "var(--fg)",
                        resize: "vertical",
                        fontSize: "0.95rem",
                        fontFamily: "inherit"
                    }}
                />
                
                <div style={{ display: "flex", justifyContent: "flex-end", marginTop: "1rem" }}>
                    <button 
                        onClick={handlePromptSubmit} 
                        disabled={loading || !prompt.trim()}
                        className="btn btn-primary"
                        style={{ display: "flex", alignItems: "center", gap: "0.5rem", padding: "0.6rem 1.25rem" }}
                    >
                        {loading ? <span className="spinner" style={{ width: "16px", height: "16px" }} /> : <Send size={16} />}
                        {loading ? "Analyzing Context..." : "Generate Actions"}
                    </button>
                </div>
            </div>

            {errorMsg && (
                <div style={{ padding: "1rem", borderRadius: "0.5rem", background: "rgba(239, 68, 68, 0.1)", color: "var(--danger)", marginBottom: "2rem" }}>
                    <strong>Error: </strong> {errorMsg}
                </div>
            )}
            
            {successMsg && (
                <div style={{ padding: "1rem", borderRadius: "0.5rem", background: "rgba(34, 197, 94, 0.1)", color: "var(--success)", marginBottom: "2rem" }}>
                    <strong>Success: </strong> {successMsg}
                </div>
            )}

            {actions.length > 0 && (
                <div className="fade-in">
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1rem" }}>
                        <h3 style={{ fontSize: "1.2rem", fontWeight: 600 }}>Staged AI Actions</h3>
                        <button 
                            onClick={handleApproveAll}
                            disabled={executing}
                            className="btn btn-primary"
                            style={{ background: "var(--success)", borderColor: "var(--success)" }}
                        >
                            {executing ? "Executing..." : "Approve & Execute All"}
                        </button>
                    </div>

                    <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
                        {actions.map((act, i) => (
                            <div key={i} className="surface" style={{ padding: "1.25rem", borderRadius: "0.75rem", border: "1px solid var(--border)", display: "flex", gap: "1rem", alignItems: "flex-start" }}>
                                <div style={{ 
                                    padding: "0.5rem", 
                                    borderRadius: "0.5rem", 
                                    background: act.action === "CREATE" ? "rgba(34, 197, 94, 0.1)" : act.action === "DELETE" ? "rgba(239, 68, 68, 0.1)" : "rgba(96, 165, 250, 0.1)",
                                    color: act.action === "CREATE" ? "var(--success)" : act.action === "DELETE" ? "var(--danger)" : "var(--accent)"
                                }}>
                                    {act.action === "CREATE" ? <CalendarPlus size={24} /> : act.action === "DELETE" ? <Trash2 size={24} /> : <Edit2 size={24} />}
                                </div>
                                <div style={{ flex: 1 }}>
                                    <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginBottom: "0.25rem" }}>
                                        <h4 style={{ margin: 0, fontWeight: 600, fontSize: "1.1rem" }}>{act.title || "Delete Event"}</h4>
                                        <span className="badge" style={{ fontSize: "0.7rem", padding: "0.1rem 0.4rem" }}>{act.action}</span>
                                    </div>
                                    {act.date && (
                                        <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", color: "var(--fg-muted)", fontSize: "0.85rem", marginBottom: "0.5rem" }}>
                                            <Calendar size={14} />
                                            <span>{act.date}</span>
                                        </div>
                                    )}
                                    {act.description && (
                                        <p style={{ fontSize: "0.9rem", color: "var(--fg-muted)", marginBottom: "0.5rem" }}>
                                            {act.description}
                                        </p>
                                    )}
                                    <div style={{ background: "var(--surface-overlay)", padding: "0.5rem", borderRadius: "0.25rem", fontSize: "0.8rem", color: "var(--primary)", borderLeft: "2px solid var(--primary)" }}>
                                        <strong>AI Reasoning:</strong> {act.reasoning}
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
};
