import { useEffect } from "react";
import { useNavigate, Routes, Route, Link, useLocation } from "react-router-dom";
import { supabase } from "../services/supabase.ts";
import { useAuth } from "../context/AuthContext.tsx";
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
    const { user, role, loading } = useAuth();
    const navigate = useNavigate();
    const location = useLocation();

    useEffect(() => {
        // ONLY redirect if loading is finished.
        if (!loading) {
            if (!user) {
                // Not logged in at all
                navigate("/sec/admin/login");
            } else if (role !== null && role !== "admin") {
                // Logged in, we have a role, and it's EXPLICITLY not admin.
                // We sign out just to be safe and clear any stuck state.
                supabase.auth.signOut().then(() => navigate("/sec/admin/login"));
            }
        }
    }, [user, role, loading, navigate]);

    // Show a silent background while loading or while we have a user but no confirmed role yet
    // This (along with the AuthContext changes) prevents the split-second bounce.
    if (loading || (user && role === null)) {
        return <div style={{ minHeight: '100vh', background: 'var(--bg)' }} />;
    }

    // Final safety check: if we're not an admin, don't show the dashboard content.
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
