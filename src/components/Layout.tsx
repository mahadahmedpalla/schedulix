import type { FC, ReactNode } from "react";
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
    const { user, role, loading } = useAuth();

    const handleLogout = async () => {
        await supabase.auth.signOut();
        navigate("/");
    };

    const navItems = [
        { label: "Dashboard", path: "/dashboard", icon: "dashboard", disabled: true },
        { label: "Calendar", path: "/", icon: "calendar_month" },
        { label: "Courses", path: "/courses", icon: "menu_book", disabled: true },
        { label: "Tasks", path: "/tasks", icon: "task_alt", disabled: true },
        { label: "Settings", path: "/settings", icon: "settings", disabled: true },
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

                    {role === "admin" && (
                        <Link
                            to="/admin"
                            className={`sidebar-link admin-link ${location.pathname.startsWith("/admin") ? "active" : ""}`}
                        >
                            <span className="material-symbols-outlined link-icon">
                                shield_person
                            </span>
                            <span className="link-label">Admin Panel</span>
                        </Link>
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
                                <p className="user-detail">{role || 'Student'}</p>
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
