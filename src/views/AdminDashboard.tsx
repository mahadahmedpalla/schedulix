import { useEffect, useState } from "react";
import { useNavigate, Routes, Route, Link, useLocation } from "react-router-dom";
import { supabase } from "../services/supabase.ts";
import { useAuth } from "../context/AuthContext.tsx";
import { Layout } from "../components/Layout.tsx";
import { BookOpen, Settings, PlusCircle, LogOut, Loader2 } from "lucide-react";
import { SubjectManager } from "./admin/SubjectManager.tsx";
import { EventTypeManager } from "./admin/EventTypeManager.tsx";
import { EventUploader } from "./admin/EventUploader.tsx";

const tabs = [
    { name: "Subjects", path: "/admin/subjects", icon: BookOpen },
    { name: "Event Types", path: "/admin/types", icon: Settings },
    { name: "Upload Event", path: "/admin/upload", icon: PlusCircle },
];

export const AdminDashboard = () => {
    const { user, role, loading } = useAuth();
    const navigate = useNavigate();
    const location = useLocation();

    // Fail-safe timeout: If auth takes more than 3 seconds, something is likely wrong with the session.
    // We redirect to login so the user can re-authenticate.
    const [timedOut, setTimedOut] = useState(false);

    useEffect(() => {
        const timer = setTimeout(() => {
            if (loading) setTimedOut(true);
        }, 3000);
        return () => clearTimeout(timer);
    }, [loading]);

    useEffect(() => {
        if (!loading || timedOut) {
            // Priority: verified session and role.
            if (!user || role !== "admin") {
                navigate("/sec/admin/login");
            }
        }
    }, [user, role, loading, timedOut, navigate]);

    // Premium Loading UI
    if (loading && !timedOut) {
        return (
            <div style={{
                height: '100vh',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'center',
                alignItems: 'center',
                background: 'var(--bg)',
                color: 'var(--fg)',
                gap: '1rem'
            }}>
                <Loader2 className="animate-spin" size={32} style={{ color: 'var(--primary)' }} />
                <p style={{ fontWeight: 500, opacity: 0.8, letterSpacing: '0.02em' }}>Verifying Admin Session...</p>
            </div>
        );
    }

    // Protection: If check finished and not admin
    if (!user || role !== "admin") return null;

    const handleLogout = async () => {
        await supabase.auth.signOut();
        navigate("/");
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
                    marginBottom: "2.5rem",
                    flexWrap: "wrap",
                    gap: "1rem",
                }}
            >
                <div>
                    <h1 style={{ fontSize: "1.5rem", marginBottom: "0.25rem" }}>
                        Admin Dashboard
                    </h1>
                    <p style={{ color: "var(--fg-muted)", fontSize: "0.875rem" }}>
                        Manage subjects, event types, and upload academic events.
                    </p>
                </div>

                <button
                    onClick={handleLogout}
                    style={{
                        display: "flex",
                        alignItems: "center",
                        gap: "0.35rem",
                        padding: "0.4rem 0.75rem",
                        borderRadius: "var(--radius-sm)",
                        background: "var(--bg-surface)",
                        border: "1px solid var(--border)",
                        color: "var(--fg)",
                        fontSize: "0.8125rem",
                        fontWeight: 500,
                        fontFamily: "var(--font)",
                        cursor: "pointer",
                        transition: "all 0.15s",
                        boxShadow: "var(--shadow-sm)"
                    }}
                    onMouseOver={e => { (e.currentTarget as HTMLElement).style.background = "var(--bg-raised)"; }}
                    onMouseOut={e => { (e.currentTarget as HTMLElement).style.background = "var(--bg-surface)"; }}
                >
                    <LogOut size={14} />
                    Sign out
                </button>
            </div>

            {/* ── Layout: sidebar + content ── */}
            <div
                style={{
                    display: "grid",
                    gridTemplateColumns: "200px 1fr",
                    gap: "2.5rem",
                    alignItems: "start",
                }}
            >
                {/* Sidebar */}
                <aside>
                    <nav style={{ display: "flex", flexDirection: "column", gap: "0.25rem" }}>
                        {tabs.map(tab => {
                            const active = isActive(tab.path);
                            return (
                                <Link
                                    key={tab.path}
                                    to={tab.path}
                                    style={{
                                        display: "flex",
                                        alignItems: "center",
                                        gap: "0.5rem",
                                        padding: "0.5rem 0.75rem",
                                        borderRadius: "var(--radius-sm)",
                                        fontSize: "0.875rem",
                                        fontWeight: active ? 600 : 500,
                                        color: active ? "var(--fg)" : "var(--fg-subtle)",
                                        background: active ? "var(--bg-raised)" : "transparent",
                                        textDecoration: "none",
                                        transition: "all 0.15s",
                                    }}
                                >
                                    <tab.icon size={16} strokeWidth={active ? 2.5 : 2} />
                                    {tab.name}
                                </Link>
                            );
                        })}
                    </nav>
                </aside>

                {/* Content panel */}
                <main
                    className="surface fade-in"
                    style={{
                        padding: "2rem",
                        minHeight: "500px",
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
