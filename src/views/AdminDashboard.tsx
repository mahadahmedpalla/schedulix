import { useEffect, useState } from "react";
import { useNavigate, Routes, Route, Link, useLocation, Navigate } from "react-router-dom";
import { supabase } from "../services/supabase.ts";
import { useAuth } from "../context/AuthContext.tsx";
import { Layout } from "../components/Layout.tsx";
import { BookOpen, Settings, PlusCircle, LogOut, ClipboardCheck, Users } from "lucide-react";
import { SubjectManager } from "./admin/SubjectManager.tsx";
import { EventTypeManager } from "./admin/EventTypeManager.tsx";
import { EventUploader } from "./admin/EventUploader.tsx";
import { ProgramManager } from "./admin/ProgramManager.tsx";
import { BatchManager } from "./admin/BatchManager.tsx";
import { CrRequestsView } from "./admin/CrRequestsView.tsx";
import { RoleManager } from "./admin/RoleManager.tsx";

const tabs = [
    { name: "Subjects", path: "/admin/subjects", icon: BookOpen },
    { name: "Event Types", path: "/admin/types", icon: Settings },
    { name: "Upload Event", path: "/admin/upload", icon: PlusCircle },
];

export const AdminDashboard = () => {
    const { user, role, loading } = useAuth();
    const navigate = useNavigate();
    const location = useLocation();
    const [pendingCount, setPendingCount] = useState(0);

    // Fetch pending request count
    useEffect(() => {
        if (loading || !user || (role !== "admin" && role !== "super_admin")) return;

        const fetchPendingCount = async () => {
            try {
                let query = supabase
                    .from("student_subject_requests")
                    .select("id", { count: "exact", head: true })
                    .eq("status", "pending");

                if (role === "admin") {
                    // Batch CR: count only their directly assigned requests
                    query = query.eq("assigned_cr_id", user.id);
                } else {
                    // super_admin: edge case — only unassigned requests
                    query = query.is("assigned_cr_id", null);
                }

                const { count, error } = await query;
                if (!error && count !== null) {
                    setPendingCount(count);
                }
            } catch (err) {
                console.error("Error fetching pending requests count:", err);
            }
        };

        fetchPendingCount();

        // Refresh count every 15 seconds to keep dashboard live and reactive
        const interval = setInterval(fetchPendingCount, 15000);
        return () => clearInterval(interval);
    }, [user, role, loading]);

    // REDIRECT LOGIC: Patiently wait for loading to finish.
    useEffect(() => {
        if (!loading) {
            // We only redirect if we are DEFINITELY not an admin or super_admin and not loading.
            if (!user && !role) {
                navigate("/sec/admin/login");
            } else if (role !== null && role !== "admin" && role !== "super_admin") {
                // If we found a role (student) but it's not admin/super_admin.
                supabase.auth.signOut().then(() => navigate("/sec/admin/login"));
            }
        }
    }, [user, role, loading, navigate]);

    // INSTANT RENDER: 
    // If we have the 'admin' or 'super_admin' role, we show the dashboard IMMEDIATELY.
    if (loading && !role) {
        return <div style={{ minHeight: '100vh', background: 'var(--bg)' }} />;
    }

    // Protection: If loading finished and we are NOT an admin or super_admin.
    if (!loading && role !== "admin" && role !== "super_admin") return null;

    // While waiting for user object (hydrating in background), we still show the shell.
    // If role is admin, we render the dashboard.

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

                        {/* Dynamic Course Requests with live badge notification */}
                        <Link
                            to="/admin/requests"
                            style={{
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "space-between",
                                padding: "0.5rem 0.75rem",
                                borderRadius: "var(--radius-sm)",
                                fontSize: "0.875rem",
                                fontWeight: location.pathname === "/admin/requests" ? 600 : 500,
                                color: location.pathname === "/admin/requests" ? "var(--fg)" : "var(--fg-subtle)",
                                background: location.pathname === "/admin/requests" ? "var(--bg-raised)" : "transparent",
                                textDecoration: "none",
                                transition: "all 0.15s",
                            }}
                        >
                            <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                                <ClipboardCheck size={16} strokeWidth={location.pathname === "/admin/requests" ? 2.5 : 2} />
                                <span>Course Requests</span>
                            </div>
                            {pendingCount > 0 && (
                                <span style={{
                                    background: "var(--danger)",
                                    color: "white",
                                    fontSize: "0.75rem",
                                    fontWeight: 700,
                                    padding: "0.1rem 0.4rem",
                                    borderRadius: "1rem",
                                    minWidth: "18px",
                                    textAlign: "center"
                                }}>
                                    {pendingCount}
                                </span>
                            )}
                        </Link>

                        {role === 'super_admin' && (
                            <>
                                <div style={{ marginTop: '1.5rem', marginBottom: '0.5rem', paddingLeft: '0.75rem', fontSize: '0.7rem', color: 'var(--fg-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                                    System
                                </div>
                                <Link
                                    to="/admin/programs"
                                    style={{
                                        display: "flex",
                                        alignItems: "center",
                                        gap: "0.5rem",
                                        padding: "0.5rem 0.75rem",
                                        borderRadius: "var(--radius-sm)",
                                        fontSize: "0.875rem",
                                        fontWeight: location.pathname === '/admin/programs' ? 600 : 500,
                                        color: location.pathname === '/admin/programs' ? "var(--fg)" : "var(--fg-subtle)",
                                        background: location.pathname === '/admin/programs' ? "var(--bg-raised)" : "transparent",
                                        textDecoration: "none",
                                        transition: "all 0.15s",
                                    }}
                                >
                                    <Settings size={16} />
                                    Programs
                                </Link>
                                <Link
                                    to="/admin/batches"
                                    style={{
                                        display: "flex",
                                        alignItems: "center",
                                        gap: "0.5rem",
                                        padding: "0.5rem 0.75rem",
                                        borderRadius: "var(--radius-sm)",
                                        fontSize: "0.875rem",
                                        fontWeight: location.pathname === '/admin/batches' ? 600 : 500,
                                        color: location.pathname === '/admin/batches' ? "var(--fg)" : "var(--fg-subtle)",
                                        background: location.pathname === '/admin/batches' ? "var(--bg-raised)" : "transparent",
                                        textDecoration: "none",
                                        transition: "all 0.15s",
                                    }}
                                >
                                    <PlusCircle size={16} />
                                    Batches
                                </Link>
                                <Link
                                    to="/admin/roles"
                                    style={{
                                        display: "flex",
                                        alignItems: "center",
                                        gap: "0.5rem",
                                        padding: "0.5rem 0.75rem",
                                        borderRadius: "var(--radius-sm)",
                                        fontSize: "0.875rem",
                                        fontWeight: location.pathname === '/admin/roles' ? 600 : 500,
                                        color: location.pathname === '/admin/roles' ? "var(--fg)" : "var(--fg-subtle)",
                                        background: location.pathname === '/admin/roles' ? "var(--bg-raised)" : "transparent",
                                        textDecoration: "none",
                                        transition: "all 0.15s",
                                    }}
                                >
                                    <Users size={16} />
                                    Roles
                                </Link>
                            </>
                        )}
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
                        <Route path="subjects" element={<SubjectManager />} />
                        <Route path="types" element={<EventTypeManager />} />
                        <Route path="upload" element={<EventUploader />} />
                        <Route path="requests" element={<CrRequestsView />} />
                        {role === 'super_admin' && (
                            <>
                                <Route path="programs" element={<ProgramManager />} />
                                <Route path="batches" element={<BatchManager />} />
                                <Route path="roles" element={<RoleManager />} />
                            </>
                        )}
                        <Route path="*" element={<Navigate to="subjects" replace />} />
                    </Routes>
                </main>
            </div>
        </Layout>
    );
};
