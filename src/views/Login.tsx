import { useState, type FormEvent } from "react";
import { supabase } from '../services/supabase.ts';
import { useNavigate } from 'react-router-dom';
import { LogIn, Lock, Mail, ChevronLeft } from 'lucide-react';

export const Login = () => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const navigate = useNavigate();

    const handleLogin = async (e: FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError(null);

        const { error } = await supabase.auth.signInWithPassword({
            email,
            password,
        });

        if (error) {
            setError(error.message);
            setLoading(false);
        } else {
            navigate('/admin');
        }
    };

    return (
        <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--muted)', padding: '1.5rem' }}>
            <div className="premium-glass" style={{ width: '400px', padding: '2.5rem', borderRadius: '1rem' }}>
                <button
                    onClick={() => navigate('/')}
                    className="btn btn-ghost"
                    style={{ padding: '0.5rem', marginBottom: '1.5rem', marginLeft: '-0.5rem' }}
                >
                    <ChevronLeft size={20} />
                    Back to Calendar
                </button>

                <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
                    <h2 style={{ fontSize: '1.5rem', fontWeight: 700, marginBottom: '0.5rem' }}>Admin Login</h2>
                    <p style={{ color: 'var(--muted-foreground)', fontSize: '0.875rem' }}>Enter your credentials to manage events.</p>
                </div>

                {error && (
                    <div style={{ background: '#fee2e2', color: '#b91c1c', padding: '0.75rem', borderRadius: '0.5rem', fontSize: '0.875rem', marginBottom: '1.5rem' }}>
                        {error}
                    </div>
                )}

                <form onSubmit={handleLogin} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                        <label style={{ fontSize: '0.875rem', fontWeight: 500 }}>Email Address</label>
                        <div style={{ position: 'relative' }}>
                            <Mail size={18} style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--muted-foreground)' }} />
                            <input
                                type="email"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                placeholder="admin@example.com"
                                style={{ width: '100%', padding: '0.75rem 1rem 0.75rem 2.75rem', borderRadius: 'var(--radius)', border: '1px solid var(--border)', background: 'var(--background)' }}
                                required
                            />
                        </div>
                    </div>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                        <label style={{ fontSize: '0.875rem', fontWeight: 500 }}>Password</label>
                        <div style={{ position: 'relative' }}>
                            <Lock size={18} style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--muted-foreground)' }} />
                            <input
                                type="password"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                placeholder="••••••••"
                                style={{ width: '100%', padding: '0.75rem 1rem 0.75rem 2.75rem', borderRadius: 'var(--radius)', border: '1px solid var(--border)', background: 'var(--background)' }}
                                required
                            />
                        </div>
                    </div>

                    <button
                        type="submit"
                        disabled={loading}
                        className="btn btn-primary"
                        style={{ width: '100%', padding: '0.875rem', marginTop: '0.5rem' }}
                    >
                        {loading ? 'Logging in...' : 'Sign In'}
                        {!loading && <LogIn size={18} />}
                    </button>
                </form>
            </div>
        </div>
    );
};
