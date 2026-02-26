import type { FC, ReactNode } from "react";
import { useLocation, Link, useNavigate } from "react-router-dom";
import { CalendarDays, ShieldCheck, User, LogOut } from "lucide-react";
import { useAuth } from "../context/AuthContext.tsx";
import { supabase } from "../services/supabase.ts";
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

    return (
        <div style={{ minHeight: "100vh", display: "flex", flexDirection: "column" }}>
            {/* ── Top Navbar ── */}
            <header className="navbar">
                <div className="navbar-inner">
                    {/* Logo */}
                    <Link to="/" className="nav-logo">
                        <div className="nav-logo-icon">
                            <CalendarDays size={20} />
                        </div>
                        <span className="nav-logo-text">Schedulix</span>
                    </Link>

                    {/* Nav Links */}
                    <nav className="nav-links">
                        <Link
                            to="/"
                            className={`nav-link ${location.pathname === "/" ? "active" : ""}`}
                        >
                            Calendar
                        </Link>

                        {/* Show Admin link in main nav if they are an admin */}
                        {role === "admin" && (
                            <Link
                                to="/admin"
                                className={`nav-link ${location.pathname.startsWith("/admin") ? "active" : ""}`}
                            >
                                Admin Panel
                            </Link>
                        )}
                    </nav>

                    {/* Actions */}
                    <div className="nav-actions">
                        {!loading && (
                            <>
                                {user ? (
                                    <div style={{ display: "flex", alignItems: "center", gap: "1rem" }}>
                                        <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", fontSize: "0.8125rem", color: "var(--fg-muted)" }}>
                                            <User size={14} />
                                            <span style={{ fontWeight: 500, color: "var(--fg)" }}>
                                                {user.email?.split("@")[0]}
                                            </span>
                                            {role === "admin" && (
                                                <span className="admin-badge" style={{ padding: "0.15rem 0.4rem", fontSize: "0.65rem" }}>
                                                    <ShieldCheck size={12} /> Admin
                                                </span>
                                            )}
                                        </div>

                                        <button
                                            onClick={handleLogout}
                                            className="btn btn-ghost"
                                            style={{ padding: "0.35rem 0.6rem", fontSize: "0.75rem", color: "var(--fg-subtle)" }}
                                            title="Sign out"
                                        >
                                            <LogOut size={14} />
                                        </button>
                                    </div>
                                ) : (
                                    <>
                                        <Link to="/login" className="nav-link" style={{ padding: "0.35rem 0.6rem", fontSize: "0.8125rem", fontWeight: 500 }}>
                                            Log in
                                        </Link>
                                        <Link to="/signup" className="btn btn-primary" style={{ padding: "0.35rem 0.75rem", fontSize: "0.8125rem", height: "auto" }}>
                                            Sign up
                                        </Link>
                                    </>
                                )}
                            </>
                        )}
                    </div>
                </div>
            </header>

            {/* ── Page Content ── */}
            <main style={{ flex: 1 }}>
                <div className="page-wrapper">
                    {children}
                </div>
            </main>
        </div>
    );
};
