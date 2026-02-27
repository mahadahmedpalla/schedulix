import { useState, useEffect, type FormEvent, useCallback } from 'react';
import { supabase } from '../../services/supabase.ts';
import { useAuth } from '../../context/AuthContext.tsx';
import { Plus, Trash2, Edit2, Check, X, RefreshCw } from 'lucide-react';

interface EventType {
    id: string;
    name: string;
}

export const EventTypeManager = () => {
    const { user, loading: authLoading } = useAuth();
    const [types, setTypes] = useState<EventType[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [newName, setNewName] = useState('');
    const [editingId, setEditingId] = useState<string | null>(null);

    const fetchTypes = useCallback(async () => {
        if (!user) return;

        setLoading(true);
        setError(null);
        try {
            const { data, error: fetchError } = await supabase
                .from('event_types')
                .select('*')
                .order('created_at', { ascending: false });

            if (fetchError) throw fetchError;
            if (data) setTypes(data);
        } catch (err: any) {
            console.error("Fetch types error:", err);
            setError(err.message || "Failed to load event types.");
        } finally {
            setLoading(false);
        }
    }, [user]);

    useEffect(() => {
        fetchTypes();
    }, [fetchTypes]);

    useEffect(() => {
        if (!authLoading && !user) {
            setLoading(false);
        }
    }, [authLoading, user]);

    const handleAdd = async (e: FormEvent) => {
        e.preventDefault();
        if (!newName) return;

        const { data, error: insertError } = await supabase
            .from('event_types')
            .insert([{ name: newName }])
            .select();

        if (insertError) {
            alert("Error adding type: " + insertError.message);
            return;
        }

        if (data) {
            setTypes([data[0], ...types]);
            setNewName('');
        }
    };

    const handleDelete = async (id: string) => {
        const { error: deleteError } = await supabase.from('event_types').delete().eq('id', id);
        if (deleteError) {
            alert("Error deleting type: " + deleteError.message);
            return;
        }
        setTypes(types.filter(t => t.id !== id));
    };

    const handleUpdate = async (id: string) => {
        const { error: updateError } = await supabase
            .from('event_types')
            .update({ name: newName })
            .eq('id', id);

        if (updateError) {
            alert("Error updating type: " + updateError.message);
            return;
        }

        setTypes(types.map(t => t.id === id ? { ...t, name: newName } : t));
        setEditingId(null);
        setNewName('');
    };

    return (
        <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
                <h2 style={{ fontSize: '1.5rem', fontWeight: 600, margin: 0 }}>Manage Event Types</h2>
                <button
                    onClick={fetchTypes}
                    className="btn btn-ghost"
                    title="Refresh list"
                    style={{ padding: '0.4rem' }}
                >
                    <RefreshCw size={16} className={loading ? "animate-spin" : ""} />
                </button>
            </div>

            <form onSubmit={handleAdd} style={{ display: 'flex', gap: '1rem', marginBottom: '3rem', background: 'var(--muted)', padding: '1.5rem', borderRadius: 'var(--radius)' }}>
                <div style={{ flex: 1 }}>
                    <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 600, textTransform: 'uppercase', marginBottom: '0.5rem', color: 'var(--muted-foreground)' }}>Type Name</label>
                    <input
                        type="text"
                        value={editingId ? '' : newName}
                        onChange={(e) => !editingId && setNewName(e.target.value)}
                        placeholder="e.g. Assignment, Quiz, Exam"
                        style={{ width: '100%', padding: '0.75rem', borderRadius: '0.5rem', border: '1px solid var(--border)', background: 'var(--background)' }}
                        disabled={!!editingId}
                    />
                </div>
                <button type="submit" className="btn btn-primary" style={{ alignSelf: 'flex-end', height: '42px' }} disabled={!!editingId || loading}>
                    <Plus size={18} />
                    Add Type
                </button>
            </form>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                {error && (
                    <div style={{ padding: '1rem', background: '#fef2f2', border: '1px solid #fee2e2', color: '#991b1b', borderRadius: 'var(--radius)', fontSize: '0.875rem' }}>
                        {error}
                        <button onClick={fetchTypes} style={{ marginLeft: '1rem', textDecoration: 'underline', color: 'inherit', fontWeight: 600 }}>Retry</button>
                    </div>
                )}

                {loading ? (
                    <div style={{ textAlign: 'center', padding: '2rem', color: 'var(--muted-foreground)' }}>
                        <RefreshCw size={24} className="animate-spin" style={{ margin: '0 auto 1rem' }} />
                        <p>Loading types...</p>
                    </div>
                ) : types.length === 0 && !error ? (
                    <p style={{ textAlign: 'center', color: 'var(--muted-foreground)', padding: '2rem' }}>No event types found.</p>
                ) : (
                    types.map(type => (
                        <div key={type.id} className="premium-glass" style={{ padding: '1rem 1.5rem', borderRadius: 'var(--radius)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            {editingId === type.id ? (
                                <>
                                    <input
                                        type="text"
                                        value={newName}
                                        onChange={(e) => setNewName(e.target.value)}
                                        style={{ flex: 1, padding: '0.5rem', borderRadius: '0.25rem', border: '1px solid var(--primary)', background: 'var(--background)' }}
                                        autoFocus
                                    />
                                    <div style={{ display: 'flex', gap: '0.5rem', marginLeft: '1rem' }}>
                                        <button onClick={() => handleUpdate(type.id)} className="btn btn-primary" style={{ padding: '0.5rem' }}><Check size={18} /></button>
                                        <button onClick={() => setEditingId(null)} className="btn btn-ghost" style={{ padding: '0.5rem' }}><X size={18} /></button>
                                    </div>
                                </>
                            ) : (
                                <>
                                    <span style={{ fontWeight: 500 }}>{type.name}</span>
                                    <div style={{ display: 'flex', gap: '0.5rem' }}>
                                        <button onClick={() => { setEditingId(type.id); setNewName(type.name); }} className="btn btn-ghost" style={{ padding: '0.5rem' }}><Edit2 size={16} /></button>
                                        <button onClick={() => handleDelete(type.id)} className="btn btn-ghost" style={{ padding: '0.5rem', color: '#ef4444' }}><Trash2 size={16} /></button>
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
