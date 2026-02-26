import type { FC, ReactNode } from "react";
import { useLocation } from "react-router-dom";
import { CalendarDays, ShieldCheck } from "lucide-react";
import "./Layout.css";

interface LayoutProps {
    children: ReactNode;
}

export const Layout: FC<LayoutProps> = ({ children }) => {
    const location = useLocation();

    return (
        <div style={{ minHeight: "100vh", display: "flex", flexDirection: "column" }}>
            {/* ── Top Navbar ── */}
            <header className="navbar">
                <div className="navbar-inner">
                    {/* Logo */}
                    <a href="/" className="nav-logo">
                        <div className="nav-logo-icon">
                            <CalendarDays size={18} strokeWidth={2.5} />
                        </div>
                        <span className="nav-logo-text">
                            Schedu<span>lix</span>
                        </span>
                    </a>

                    {/* Nav Links */}
                    <nav className="nav-links">
                        <a
                            href="/"
                            className={`nav-link ${location.pathname === "/" ? "active" : ""}`}
                        >
                            <CalendarDays size={16} />
                            Calendar
                        </a>
                    </nav>

                    {/* Actions */}
                    <div className="nav-actions">
                        {location.pathname.startsWith("/admin") ? (
                            <span
                                style={{
                                    display: "flex",
                                    alignItems: "center",
                                    gap: "0.4rem",
                                    fontSize: "0.8rem",
                                    color: "var(--primary)",
                                    fontWeight: 600,
                                    background: "var(--primary-dim)",
                                    padding: "0.35rem 0.75rem",
                                    borderRadius: "99px",
                                }}
                            >
                                <ShieldCheck size={14} />
                                Admin Panel
                            </span>
                        ) : (
                            <a href="/login" className="btn btn-outline" style={{ padding: "0.45rem 1rem", fontSize: "0.8rem" }}>
                                <ShieldCheck size={14} />
                                Admin Login
                            </a>
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
