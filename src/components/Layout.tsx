import type { FC, ReactNode } from "react";
import { Calendar, User, LayoutDashboard, LogOut, ShieldCheck } from 'lucide-react';
import { useAuth } from "../context/AuthContext.tsx";
import { Link, useNavigate } from "react-router-dom";
import { supabase } from "../services/supabase.ts";

interface LayoutProps {
    children: ReactNode;
}

export const Layout: FC<LayoutProps> = ({ children }) => {
    const { user, role } = useAuth();
    const navigate = useNavigate();

    const handleLogout = async () => {
        await supabase.auth.signOut();
        navigate("/");
    };

    return (
        <div className="layout-container" style={{ display: 'flex', minHeight: '100vh', background: 'var(--bg)' }}>
            {/* Sidebar */}
            <aside className="premium-glass" style={{
                width: '280px',
                padding: '2rem',
                display: 'flex',
                flexDirection: 'column',
                borderRight: '1px solid var(--border)',
                zIndex: 10,
                background: 'var(--bg-surface)'
            }}>
                <Link to="/" style={{ textDecoration: 'none', color: 'inherit' }}>
                    <div className="logo" style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '3rem' }}>
                        <div style={{ background: 'var(--primary)', padding: '0.5rem', borderRadius: '0.5rem', color: 'white' }}>
                            <Calendar size={20} />
                        </div>
                        <span style={{ fontSize: '1.25rem', fontWeight: 700, letterSpacing: '-0.02em' }}>Schedulix</span>
                    </div>
                </Link>

                <nav style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', flex: 1 }}>
                    <Link to="/" className="btn btn-ghost" style={{ justifyContent: 'flex-start' }}>
                        <Calendar size={18} />
                        Calendar View
                    </Link>

                    {role === 'admin' && (
                        <Link to="/admin" className="btn btn-ghost" style={{ justifyContent: 'flex-start' }}>
                            <LayoutDashboard size={18} />
                            Admin Panel
                        </Link>
                    )}
                </nav>

                <div style={{ marginTop: 'auto', paddingTop: '2rem', borderTop: '1px solid var(--border)' }}>
                    {user ? (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', padding: '0.5rem' }}>
                                <div style={{
                                    width: '32px',
                                    height: '32px',
                                    borderRadius: '50%',
                                    background: role === 'admin' ? 'var(--fg)' : 'var(--primary)',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    color: 'white'
                                }}>
                                    {role === 'admin' ? <ShieldCheck size={16} /> : <User size={16} />}
                                </div>
                                <div style={{ overflow: 'hidden' }}>
                                    <p style={{ fontSize: '0.8125rem', fontWeight: 600, margin: 0, textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                        {user.email?.split('@')[0]}
                                    </p>
                                    <p style={{ fontSize: '0.6875rem', color: 'var(--fg-muted)', margin: 0 }}>
                                        {role === 'admin' ? 'Administrator' : 'Student'}
                                    </p>
                                </div>
                            </div>
                            <button onClick={handleLogout} className="btn btn-ghost" style={{ justifyContent: 'flex-start', width: '100%', color: '#ef4444' }}>
                                <LogOut size={16} />
                                Sign Out
                            </button>
                        </div>
                    ) : (
                        <Link to="/sec/admin/login" className="btn btn-ghost" style={{ justifyContent: 'flex-start', width: '100%' }}>
                            <ShieldCheck size={18} />
                            Admin Access
                        </Link>
                    )}
                </div>
            </aside>

            {/* Main Content */}
            <main style={{ flex: 1, padding: '3rem', overflowY: 'auto' }}>
                <div className="container" style={{ maxWidth: '1200px', margin: '0 auto' }}>
                    {children}
                </div>
            </main>
        </div>
    );
};
