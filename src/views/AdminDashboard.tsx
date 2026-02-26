import { useState, useEffect } from 'react';
import { useNavigate, Routes, Route, Link, useLocation } from 'react-router-dom';
import { supabase } from '../services/supabase.ts';
import { Layout } from '../components/Layout.tsx';
import { BookOpen, Settings, PlusCircle, LogOut, ChevronRight } from 'lucide-react';
import { SubjectManager } from './admin/SubjectManager.tsx';
import { EventTypeManager } from './admin/EventTypeManager.tsx';
import { EventUploader } from './admin/EventUploader.tsx';

export const AdminDashboard = () => {
    const [session, setSession] = useState<any>(null);
    const navigate = useNavigate();
    const location = useLocation();

    useEffect(() => {
        supabase.auth.getSession().then(({ data: { session } }) => {
            setSession(session);
            if (!session) navigate('/login');
        });

        const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
            setSession(session);
            if (!session) navigate('/login');
        });

        return () => subscription.unsubscribe();
    }, [navigate]);

    if (!session) return null;

    const tabs = [
        { name: 'Subjects', path: '/admin/subjects', icon: BookOpen },
        { name: 'Types', path: '/admin/types', icon: Settings },
        { name: 'Upload Event', path: '/admin/upload', icon: PlusCircle },
    ];

    const handleLogout = async () => {
        await supabase.auth.signOut();
        navigate('/login');
    };

    return (
        <Layout>
            <div className="admin-dashboard">
                <header style={{ marginBottom: '2.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div>
                        <h1 style={{ fontSize: '2rem', fontWeight: 700, letterSpacing: '-0.02em', marginBottom: '0.25rem' }}>Admin Dashboard</h1>
                        <p style={{ color: 'var(--muted-foreground)' }}>Manage subjects, categories, and calendar events.</p>
                    </div>
                    <button onClick={handleLogout} className="btn btn-ghost" style={{ color: '#ef4444' }}>
                        <LogOut size={18} />
                        Logout
                    </button>
                </header>

                <div style={{ display: 'grid', gridTemplateColumns: '240px 1fr', gap: '2.5rem' }}>
                    <aside>
                        <nav style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                            {tabs.map((tab) => {
                                const isActive = location.pathname === tab.path || (location.pathname === '/admin' && tab.path === '/admin/subjects');
                                return (
                                    <Link
                                        key={tab.path}
                                        to={tab.path}
                                        className="btn btn-ghost"
                                        style={{
                                            justifyContent: 'space-between',
                                            background: isActive ? 'var(--primary-light)' : 'transparent',
                                            color: isActive ? 'var(--primary)' : 'var(--muted-foreground)',
                                            fontWeight: isActive ? 600 : 500
                                        }}
                                    >
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                                            <tab.icon size={18} />
                                            {tab.name}
                                        </div>
                                        {isActive && <ChevronRight size={16} />}
                                    </Link>
                                );
                            })}
                        </nav>
                    </aside>

                    <main className="premium-glass" style={{ padding: '2.5rem', borderRadius: 'var(--radius)' }}>
                        <Routes>
                            <Route path="/" element={<SubjectManager />} />
                            <Route path="/subjects" element={<SubjectManager />} />
                            <Route path="/types" element={<EventTypeManager />} />
                            <Route path="/upload" element={<EventUploader />} />
                        </Routes>
                    </main>
                </div>
            </div>
        </Layout>
    );
};
