import { useState, useEffect } from "react";
import { useNavigate, Routes, Route, Link, useLocation } from "react-router-dom";
import { supabase } from "../services/supabase.ts";
import { Layout } from "../components/Layout.tsx";
import { BookOpen, Settings, PlusCircle, LogOut } from "lucide-react";
import { SubjectManager } from "./admin/SubjectManager.tsx";
import { EventTypeManager } from "./admin/EventTypeManager.tsx";
import { EventUploader } from "./admin/EventUploader.tsx";

const tabs = [
    { name: "Subjects", path: "/admin/subjects", icon: BookOpen },
    { name: "Event Types", path: "/admin/types", icon: Settings },
    { name: "Upload Event", path: "/admin/upload", icon: PlusCircle },
];

export const AdminDashboard = () => {
    const [session, setSession] = useState<any>(null);
    const navigate = useNavigate();
    const location = useLocation();

    useEffect(() => {
        supabase.auth.getSession().then(({ data: { session } }) => {
            setSession(session);
            if (!session) navigate("/login");
        });

        const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
            setSession(session);
            if (!session) navigate("/login");
        });

        return () => subscription.unsubscribe();
    }, [navigate]);

    if (!session) return null;

    const handleLogout = async () => {
        await supabase.auth.signOut();
        navigate("/login");
    };

    const isActive = (path: string) =>
        location.pathname === path ||
        (location.pathname === "/admin" && path === "/admin/subjects");

    return (
        <Layout>
            {/* ── Page header ── */}
            <div
                style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    marginBottom: "2rem",
                    flexWrap: "wrap",
                    gap: "1rem",
                }}
            >
                <div>
                    <h1
                        style={{
                            fontSize: "1.75rem",
                            fontWeight: 800,
                            letterSpacing: "-0.04em",
                            marginBottom: "0.25rem",
                        }}
                    >
                        Admin Dashboard
                    </h1>
                    <p style={{ color: "var(--fg-muted)", fontSize: "0.9rem" }}>
                        Manage subjects, event types, and upload academic events.
                    </p>
                </div>

                <button
                    onClick={handleLogout}
                    style={{
                        display: "flex",
                        alignItems: "center",
                        gap: "0.5rem",
                        padding: "0.5rem 1rem",
                        borderRadius: "var(--radius-sm)",
                        background: "rgba(239,68,68,0.1)",
                        border: "1px solid rgba(239,68,68,0.25)",
                        color: "#f87171",
                        fontSize: "0.85rem",
                        fontWeight: 600,
                        fontFamily: "var(--font)",
                        cursor: "pointer",
                        transition: "all 0.2s",
                    }}
                    onMouseOver={e => { (e.currentTarget as HTMLElement).style.background = "rgba(239,68,68,0.18)"; }}
                    onMouseOut={e => { (e.currentTarget as HTMLElement).style.background = "rgba(239,68,68,0.1)"; }}
                >
                    <LogOut size={15} />
                    Logout
                </button>
            </div>

            {/* ── Layout: sidebar + content ── */}
            <div
                style={{
                    display: "grid",
                    gridTemplateColumns: "220px 1fr",
                    gap: "2rem",
                    alignItems: "start",
                }}
            >
                {/* Sidebar */}
                <aside>
                    <nav style={{ display: "flex", flexDirection: "column", gap: "0.375rem" }}>
                        {tabs.map(tab => {
                            const active = isActive(tab.path);
                            return (
                                <Link
                                    key={tab.path}
                                    to={tab.path}
                                    style={{
                                        display: "flex",
                                        alignItems: "center",
                                        gap: "0.75rem",
                                        padding: "0.7rem 1rem",
                                        borderRadius: "var(--radius-sm)",
                                        fontSize: "0.875rem",
                                        fontWeight: active ? 700 : 500,
                                        color: active ? "var(--primary)" : "var(--fg-muted)",
                                        background: active ? "var(--primary-dim)" : "transparent",
                                        border: `1px solid ${active ? "rgba(45,212,191,0.25)" : "transparent"}`,
                                        textDecoration: "none",
                                        transition: "all 0.2s",
                                        boxShadow: active ? "var(--glow)" : "none",
                                    }}
                                >
                                    <tab.icon size={16} />
                                    {tab.name}
                                </Link>
                            );
                        })}
                    </nav>
                </aside>

                {/* Content panel */}
                <main
                    className="premium-glass"
                    style={{
                        borderRadius: "var(--radius-lg)",
                        padding: "2rem",
                        minHeight: "500px",
                        border: "1px solid var(--border-strong)",
                    }}
                >
                    <Routes>
                        <Route path="/" element={<SubjectManager />} />
                        <Route path="/subjects" element={<SubjectManager />} />
                        <Route path="/types" element={<EventTypeManager />} />
                        <Route path="/upload" element={<EventUploader />} />
                    </Routes>
                </main>
            </div>
        </Layout>
    );
};
