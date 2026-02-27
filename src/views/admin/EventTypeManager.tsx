import { useState, useEffect, type FormEvent } from 'react';
import { supabase } from '../../services/supabase.ts';
import { useAuth } from '../../context/AuthContext.tsx';
import { Plus, Trash2, Edit2, Check, X } from 'lucide-react';

interface EventType {
    id: string;
    name: string;
}

export const EventTypeManager = () => {
    const { user } = useAuth();
    const [types, setTypes] = useState<EventType[]>([]);
    const [loading, setLoading] = useState(true);
    const [newName, setNewName] = useState('');
    const [editingId, setEditingId] = useState<string | null>(null);

    const fetchTypes = async () => {
        if (!user) return;

        setLoading(true);
        const { data } = await supabase.from('event_types').select('*').order('created_at', { ascending: false });
        if (data) setTypes(data);
        setLoading(false);
    };

    useEffect(() => {
        fetchTypes();
    }, [user]);

    const handleAdd = async (e: FormEvent) => {
        e.preventDefault();
        if (!newName) return;

        const { data } = await supabase
            .from('event_types')
            .insert([{ name: newName }])
            .select();

        if (data) {
            setTypes([data[0], ...types]);
            setNewName('');
        }
    };

    const handleDelete = async (id: string) => {
        const { error } = await supabase.from('event_types').delete().eq('id', id);
        if (!error) {
            setTypes(types.filter(t => t.id !== id));
        }
    };

    const handleUpdate = async (id: string) => {
        const { error } = await supabase
            .from('event_types')
            .update({ name: newName })
            .eq('id', id);

        if (!error) {
            setTypes(types.map(t => t.id === id ? { ...t, name: newName } : t));
            setEditingId(null);
            setNewName('');
        }
    };

    return (
        <div>
            <h2 style={{ fontSize: '1.5rem', fontWeight: 600, marginBottom: '2rem' }}>Manage Event Types</h2>

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
                <button type="submit" className="btn btn-primary" style={{ alignSelf: 'flex-end', height: '42px' }} disabled={!!editingId}>
                    <Plus size={18} />
                    Add Type
                </button>
            </form>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                {loading ? <p>Loading types...</p> : types.map(type => (
                    <div key={type.id} className="premium-glass" style={{ padding: '1rem 1.5rem', borderRadius: 'var(--radius)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        {editingId === type.id ? (
                            <>
                                <input
                                    type="text"
                                    value={newName}
                                    onChange={(e) => setNewName(e.target.value)}
                                    style={{ flex: 1, padding: '0.5rem', borderRadius: '0.25rem', border: '1px solid var(--primary)' }}
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
                ))}
            </div>
        </div>
    );
};
