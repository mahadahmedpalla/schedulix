import type { FC, ReactNode } from "react";
import { Calendar, User } from 'lucide-react';

interface LayoutProps {
    children: ReactNode;
}

export const Layout: FC<LayoutProps> = ({ children }) => {
    return (
        <div className="layout-container" style={{ display: 'flex', minHeight: '100vh', background: 'var(--background)' }}>
            {/* Sidebar */}
            <aside className="premium-glass" style={{ width: '280px', padding: '2rem', display: 'flex', flexDirection: 'column', borderRight: '1px solid var(--border)', zIndex: 10 }}>
                <div className="logo" style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '3rem' }}>
                    <div style={{ background: 'var(--primary)', padding: '0.5rem', borderRadius: '0.5rem', color: 'white' }}>
                        <Calendar size={20} />
                    </div>
                    <span style={{ fontSize: '1.25rem', fontWeight: 700, letterSpacing: '-0.02em' }}>Schedulix</span>
                </div>

                <nav style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                    <a href="/" className="btn btn-ghost" style={{ justifyContent: 'flex-start', background: 'var(--primary-light)', color: 'var(--primary)' }}>
                        <Calendar size={18} />
                        Calendar
                    </a>
                    <div style={{ marginTop: 'auto', paddingTop: '2rem', borderTop: '1px solid var(--border)' }}>
                        <a href="/login" className="btn btn-ghost" style={{ justifyContent: 'flex-start', width: '100%' }}>
                            <User size={18} />
                            Admin Login
                        </a>
                    </div>
                </nav>
            </aside>

            {/* Main Content */}
            <main style={{ flex: 1, padding: '3rem' }}>
                <div className="container">
                    {children}
                </div>
            </main>
        </div>
    );
};
