import { useState, useEffect, type FC, type ReactNode } from "react";
import { useLocation, Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext.tsx";
import { supabase } from "../services/supabase.ts";
import { Header } from "./Header.tsx";
import "./Layout.css";

interface LayoutProps {
    children: ReactNode;
}

export const Layout: FC<LayoutProps> = ({ children }) => {
    const location = useLocation();
    const navigate = useNavigate();
    const { user, role, batch_id, batch_code, loading } = useAuth();
    const [pendingCount, setPendingCount] = useState(0);

    useEffect(() => {
        if (loading || !user || (role !== "admin" && role !== "super_admin")) return;

        const fetchPendingCount = async () => {
            try {
                let query = supabase
                    .from("student_subject_requests")
                    .select("id", { count: "exact", head: true })
                    .eq("status", "pending");

                if (role === "admin") {
                    // Batch CR: count only requests matching their assigned batch
                    query = query.eq("batch_id", batch_id);
                }

                const { count, error } = await query;
                if (!error && count !== null) {
                    setPendingCount(count);
                }
            } catch (err) {
                console.error("Error fetching pending count:", err);
            }
        };

        fetchPendingCount();
        const interval = setInterval(fetchPendingCount, 15000);
        return () => clearInterval(interval);
    }, [user, role, batch_id, loading]);

    const handleLogout = async () => {
        await supabase.auth.signOut();
        navigate("/");
    };

    const navItems = [
        { label: "Dashboard", path: "/dashboard", icon: "dashboard", disabled: true },
        { label: "Calendar", path: "/", icon: "calendar_month" },
        { label: "Courses", path: "/courses", icon: "menu_book", disabled: true },
        { label: "Tasks", path: "/tasks", icon: "task_alt", disabled: true },
        { label: "Settings", path: "/settings", icon: "settings" },
    ];

    return (
        <div className="app-container">
            {/* ── Side Navigation ── */}
            <aside className="sidebar">
                <div className="sidebar-logo">
                    <div className="logo-icon">
                        <span className="material-symbols-outlined">auto_schedule</span>
                    </div>
                    <div className="logo-text">
                        <h1>Schedulix</h1>
                        <p>Student Dashboard</p>
                    </div>
                </div>

                <nav className="sidebar-nav">
                    {navItems.map((item) => (
                        <Link
                            key={item.label}
                            to={item.disabled ? "#" : item.path}
                            className={`sidebar-link ${location.pathname === item.path ? "active" : ""} ${item.disabled ? "disabled" : ""}`}
                            onClick={(e) => item.disabled && e.preventDefault()}
                        >
                            <span className={`material-symbols-outlined link-icon ${location.pathname === item.path ? "fill-1" : ""}`}>
                                {item.icon}
                            </span>
                            <span className="link-label">{item.label}</span>
                            {item.disabled && <span className="coming-soon">soon</span>}
                        </Link>
                    ))}

                    {(role === "admin" || role === "super_admin") && (
                        <Link
                            to="/admin"
                            className={`sidebar-link admin-link ${location.pathname.startsWith("/admin") ? "active" : ""}`}
                            style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}
                        >
                            <div style={{ display: "flex", alignItems: "center" }}>
                                <span className="material-symbols-outlined link-icon">
                                    shield_person
                                </span>
                                <span className="link-label">Admin Panel</span>
                            </div>
                            {pendingCount > 0 && (
                                <span style={{
                                    background: "var(--danger)",
                                    color: "white",
                                    fontSize: "0.7rem",
                                    fontWeight: 700,
                                    padding: "0.1rem 0.4rem",
                                    borderRadius: "1rem",
                                    minWidth: "18px",
                                    textAlign: "center",
                                    marginRight: "0.5rem"
                                }}>
                                    {pendingCount}
                                </span>
                            )}
                        </Link>
                    )}

                    {role === "super_admin" && (
                        <>
                            <div className="nav-divider" />
                            <p className="nav-section-title">Global Management</p>
                            <Link
                                to="/admin/programs"
                                className={`sidebar-link ${location.pathname === "/admin/programs" ? "active" : ""}`}
                            >
                                <span className="material-symbols-outlined link-icon">
                                    account_tree
                                </span>
                                <span className="link-label">Programs</span>
                            </Link>
                            <Link
                                to="/admin/batches"
                                className={`sidebar-link ${location.pathname === "/admin/batches" ? "active" : ""}`}
                            >
                                <span className="material-symbols-outlined link-icon">
                                    groups
                                </span>
                                <span className="link-label">Batches</span>
                            </Link>
                        </>
                    )}
                </nav>

                <div className="sidebar-footer">
                    {!loading && user && (
                        <div className="user-profile-card">
                            <div className="user-avatar" style={{ backgroundImage: user.user_metadata?.avatar_url ? `url(${user.user_metadata.avatar_url})` : 'none' }}>
                                {!user.user_metadata?.avatar_url && (
                                    <span className="material-symbols-outlined">account_circle</span>
                                )}
                            </div>
                            <div className="user-info">
                                <p className="user-name">{user.email?.split("@")[0]}</p>
                                <div className="user-status-group">
                                    <p className="user-detail">{role || 'Student'}</p>
                                    {batch_code && (
                                        <>
                                            <span className="dot-separator">·</span>
                                            <p className="user-batch">{batch_code}</p>
                                        </>
                                    )}
                                </div>
                            </div>
                            <button onClick={handleLogout} className="logout-btn" title="Sign out">
                                <span className="material-symbols-outlined">logout</span>
                            </button>
                        </div>
                    )}
                </div>
            </aside>

            {/* ── Main Content ── */}
            <main className="main-content">
                <Header />
                <div className="content-scroll-area">
                    <div className="content-container">
                        {children}
                    </div>
                </div>
            </main>
        </div>
    );
};
