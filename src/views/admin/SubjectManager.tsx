import { useState, useEffect, type FormEvent, useCallback } from 'react';
import { supabase } from '../../services/supabase.ts';
import { useAuth } from '../../context/AuthContext.tsx';
import { Plus, Trash2, Edit2, Check, X, RefreshCw } from 'lucide-react';

interface Subject {
    id: string;
    name: string;
    color: string;
}

export const SubjectManager = () => {
    const { user, loading: authLoading } = useAuth();
    const [subjects, setSubjects] = useState<Subject[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [newName, setNewName] = useState('');
    const [newColor, setNewColor] = useState('#0d9488');
    const [editingId, setEditingId] = useState<string | null>(null);

    const fetchSubjects = useCallback(async () => {
        // We wait for the user to be available to avoid RLS 401/403 errors
        if (!user) return;

        setLoading(true);
        setError(null);
        try {
            const { data, error: fetchError } = await supabase
                .from('subjects')
                .select('*')
                .order('created_at', { ascending: false });

            if (fetchError) throw fetchError;
            if (data) setSubjects(data);
        } catch (err: any) {
            console.error("Fetch subjects error:", err);
            setError(err.message || "Failed to load subjects.");
        } finally {
            setLoading(false);
        }
    }, [user]);

    useEffect(() => {
        fetchSubjects();
    }, [fetchSubjects]);

    // Handle initial loading hang: if auth finished but user is still null, 
    // we stop local "Loading..." to avoid eternal spinner.
    useEffect(() => {
        if (!authLoading && !user) {
            setLoading(false);
        }
    }, [authLoading, user]);

    const handleAdd = async (e: FormEvent) => {
        e.preventDefault();
        if (!newName) return;

        const { data, error: insertError } = await supabase
            .from('subjects')
            .insert([{ name: newName, color: newColor }])
            .select();

        if (insertError) {
            alert("Error adding subject: " + insertError.message);
            return;
        }

        if (data) {
            setSubjects([data[0], ...subjects]);
            setNewName('');
        }
    };

    const handleDelete = async (id: string) => {
        const { error: deleteError } = await supabase.from('subjects').delete().eq('id', id);
        if (deleteError) {
            alert("Error deleting subject: " + deleteError.message);
            return;
        }
        setSubjects(subjects.filter(s => s.id !== id));
    };

    const startEdit = (subject: Subject) => {
        setEditingId(subject.id);
        setNewName(subject.name);
        setNewColor(subject.color);
    };

    const handleUpdate = async (id: string) => {
        const { error: updateError } = await supabase
            .from('subjects')
            .update({ name: newName, color: newColor })
            .eq('id', id);

        if (updateError) {
            alert("Error updating subject: " + updateError.message);
            return;
        }

        setSubjects(subjects.map(s => s.id === id ? { ...s, name: newName, color: newColor } : s));
        setEditingId(null);
        setNewName('');
        setNewColor('#0d9488');
    };

    return (
        <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
                <h2 style={{ fontSize: '1.5rem', fontWeight: 600, margin: 0 }}>Manage Subjects</h2>
                <button
                    onClick={fetchSubjects}
                    className="btn btn-ghost"
                    title="Refresh list"
                    style={{ padding: '0.4rem' }}
                >
                    <RefreshCw size={16} className={loading ? "animate-spin" : ""} />
                </button>
            </div>

            <form onSubmit={handleAdd} style={{ display: 'flex', gap: '1rem', marginBottom: '3rem', background: 'var(--muted)', padding: '1.5rem', borderRadius: 'var(--radius)' }}>
                <div style={{ flex: 1 }}>
                    <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 600, textTransform: 'uppercase', marginBottom: '0.5rem', color: 'var(--muted-foreground)' }}>Subject Name</label>
                    <input
                        type="text"
                        value={editingId ? '' : newName}
                        onChange={(e) => !editingId && setNewName(e.target.value)}
                        placeholder="e.g. Mathematics"
                        style={{ width: '100%', padding: '0.75rem', borderRadius: '0.5rem', border: '1px solid var(--border)', background: 'var(--background)' }}
                        disabled={!!editingId}
                    />
                </div>
                <div>
                    <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 600, textTransform: 'uppercase', marginBottom: '0.5rem', color: 'var(--muted-foreground)' }}>Color</label>
                    <input
                        type="color"
                        value={editingId ? '#0d9488' : newColor}
                        onChange={(e) => !editingId && setNewColor(e.target.value)}
                        style={{ width: '60px', height: '42px', padding: '2px', borderRadius: '0.5rem', border: '1px solid var(--border)', cursor: 'pointer' }}
                        disabled={!!editingId}
                    />
                </div>
                <button type="submit" className="btn btn-primary" style={{ alignSelf: 'flex-end', height: '42px' }} disabled={!!editingId || loading}>
                    <Plus size={18} />
                    Add Subject
                </button>
            </form>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                {error && (
                    <div style={{ padding: '1rem', background: '#fef2f2', border: '1px solid #fee2e2', color: '#991b1b', borderRadius: 'var(--radius)', fontSize: '0.875rem' }}>
                        {error}
                        <button onClick={fetchSubjects} style={{ marginLeft: '1rem', textDecoration: 'underline', color: 'inherit', fontWeight: 600 }}>Retry</button>
                    </div>
                )}

                {loading ? (
                    <div style={{ textAlign: 'center', padding: '2rem', color: 'var(--muted-foreground)' }}>
                        <RefreshCw size={24} className="animate-spin" style={{ margin: '0 auto 1rem' }} />
                        <p>Loading subjects...</p>
                    </div>
                ) : subjects.length === 0 && !error ? (
                    <p style={{ textAlign: 'center', color: 'var(--muted-foreground)', padding: '2rem' }}>No subjects found. Add your first one above!</p>
                ) : (
                    subjects.map(subject => (
                        <div key={subject.id} className="premium-glass" style={{ padding: '1rem 1.5rem', borderRadius: 'var(--radius)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            {editingId === subject.id ? (
                                <>
                                    <div style={{ display: 'flex', gap: '1rem', flex: 1 }}>
                                        <input
                                            type="text"
                                            value={newName}
                                            onChange={(e) => setNewName(e.target.value)}
                                            style={{ flex: 1, padding: '0.5rem', borderRadius: '0.25rem', border: '1px solid var(--primary)', background: 'var(--background)' }}
                                            autoFocus
                                        />
                                        <input
                                            type="color"
                                            value={newColor}
                                            onChange={(e) => setNewColor(e.target.value)}
                                            style={{ width: '40px', height: '34px' }}
                                        />
                                    </div>
                                    <div style={{ display: 'flex', gap: '0.5rem', marginLeft: '1rem' }}>
                                        <button onClick={() => handleUpdate(subject.id)} className="btn btn-primary" style={{ padding: '0.5rem' }}><Check size={18} /></button>
                                        <button onClick={() => setEditingId(null)} className="btn btn-ghost" style={{ padding: '0.5rem' }}><X size={18} /></button>
                                    </div>
                                </>
                            ) : (
                                <>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                                        <div style={{ width: '12px', height: '12px', borderRadius: '50%', background: subject.color }}></div>
                                        <span style={{ fontWeight: 500 }}>{subject.name}</span>
                                    </div>
                                    <div style={{ display: 'flex', gap: '0.5rem' }}>
                                        <button onClick={() => startEdit(subject)} className="btn btn-ghost" style={{ padding: '0.5rem' }}><Edit2 size={16} /></button>
                                        <button onClick={() => handleDelete(subject.id)} className="btn btn-ghost" style={{ padding: '0.5rem', color: '#ef4444' }}><Trash2 size={16} /></button>
                                    </div>
                                </>
                            )}
                        </div>
                    ))
                )}
            </div>
        </div>
    );
};
