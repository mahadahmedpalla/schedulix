import { useState, useEffect, type FormEvent, useCallback } from 'react';
import { supabase } from '../../services/supabase.ts';
import { useAuth } from '../../context/AuthContext.tsx';
import { Upload, Calendar, Send, CheckCircle, RefreshCw, AlertCircle } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export const EventUploader = () => {
    const { user, role, loading: authLoading } = useAuth();
    const navigate = useNavigate();
    const [subjects, setSubjects] = useState<any[]>([]);
    const [types, setTypes] = useState<any[]>([]);
    const [fetching, setFetching] = useState(true);
    const [fetchError, setFetchError] = useState<string | null>(null);
    const [loading, setLoading] = useState(false);
    const [success, setSuccess] = useState(false);

    const [formData, setFormData] = useState({
        subject_id: '',
        type_id: '',
        title: '',
        description: '',
        date: (() => {
            const now = new Date();
            const y = now.getFullYear();
            const m = String(now.getMonth() + 1).padStart(2, '0');
            const d = String(now.getDate()).padStart(2, '0');
            return `${y}-${m}-${d}`;
        })(),
        file: null as File | null
    });

    const fetchData = useCallback(async () => {
        if (authLoading) return;

        if (!user || role !== 'admin') {
            setFetching(false);
            setFetchError("Admin session required. Please log in.");
            return;
        }

        setFetching(true);
        setFetchError(null);
        try {
            const [subs, typs] = await Promise.all([
                supabase.from('subjects').select('*').order('name'),
                supabase.from('event_types').select('*').order('name')
            ]);

            if (subs.error) throw subs.error;
            if (typs.error) throw typs.error;

            if (subs.data) setSubjects(subs.data);
            if (typs.data) setTypes(typs.data);
        } catch (err: any) {
            console.error("Fetch options error:", err);
            setFetchError(err.message || "Failed to load subjects or types.");
        } finally {
            setFetching(false);
        }
    }, [user, role, authLoading]);

    useEffect(() => {
        fetchData();
    }, [fetchData]);

    const handleSubmit = async (e: FormEvent) => {
        e.preventDefault();
        if (!formData.subject_id || !formData.date || loading) return;
        setLoading(true);
        setSuccess(false);

        try {
            let fileUrl = '';
            if (formData.file) {
                const fileName = `${Date.now()}_${formData.file.name}`;
                const { data, error: uploadError } = await supabase.storage
                    .from('event-attachments')
                    .upload(fileName, formData.file);

                if (uploadError) throw uploadError;

                if (data) {
                    const { data: { publicUrl } } = supabase.storage
                        .from('event-attachments')
                        .getPublicUrl(fileName);
                    fileUrl = publicUrl;
                }
            }

            const { error: insertError } = await supabase.from('events').insert([{
                subject_id: formData.subject_id,
                type_id: formData.type_id || null,
                title: formData.title,
                description: formData.description,
                date: formData.date,
                file_url: fileUrl,
                is_global: true
            }]);

            if (insertError) throw insertError;

            setSuccess(true);
            setFormData({
                subject_id: '',
                type_id: '',
                title: '',
                description: '',
                date: (() => {
                    const now = new Date();
                    const y = now.getFullYear();
                    const m = String(now.getMonth() + 1).padStart(2, '0');
                    const d = String(now.getDate()).padStart(2, '0');
                    return `${y}-${m}-${d}`;
                })(),
                file: null
            });
            setTimeout(() => setSuccess(false), 3000);
        } catch (err: any) {
            alert("Error creating event: " + err.message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div style={{ maxWidth: '600px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
                <h2 style={{ fontSize: '1.5rem', fontWeight: 600, margin: 0 }}>Upload Event</h2>
                {fetchError && (
                    <button onClick={fetchData} className="btn btn-ghost" style={{ color: '#ef4444' }}>
                        <RefreshCw size={14} /> Retry Sync
                    </button>
                )}
            </div>

            {success && (
                <div style={{ background: '#ecfdf5', color: '#059669', padding: '1rem', borderRadius: 'var(--radius)', marginBottom: '2rem', display: 'flex', alignItems: 'center', gap: '0.75rem', animation: 'fadeIn 0.3s ease' }}>
                    <CheckCircle size={20} />
                    Event created successfully!
                </div>
            )}

            {fetchError && (
                <div style={{ background: '#fef2f2', border: '1px solid #fee2e2', color: '#991b1b', padding: '1.25rem', borderRadius: 'var(--radius)', marginBottom: '2rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                        <AlertCircle size={20} />
                        <div style={{ fontWeight: 500 }}>{fetchError}</div>
                    </div>
                    {!user && (
                        <button onClick={() => navigate('/sec/admin/login')} className="btn btn-primary" style={{ width: 'fit-content', padding: '0.5rem 1rem' }}>
                            Go to Login Dashboard
                        </button>
                    )}
                </div>
            )}

            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem', opacity: (fetching || authLoading) ? 0.6 : 1, pointerEvents: (fetching || authLoading) ? 'none' : 'auto' }}>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>
                    <div>
                        <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 600, textTransform: 'uppercase', marginBottom: '0.5rem', color: 'var(--muted-foreground)' }}>Subject</label>
                        <select
                            value={formData.subject_id}
                            onChange={(e) => setFormData({ ...formData, subject_id: e.target.value })}
                            style={{ width: '100%', padding: '0.75rem', borderRadius: '0.5rem', border: '1px solid var(--border)', background: 'var(--background)', color: 'var(--fg)' }}
                            required
                            disabled={fetching || authLoading}
                        >
                            <option value="">{authLoading ? 'Verifying Session...' : fetching ? 'Syncing...' : 'Select Subject'}</option>
                            {subjects.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                        </select>
                    </div>
                    <div>
                        <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 600, textTransform: 'uppercase', marginBottom: '0.5rem', color: 'var(--muted-foreground)' }}>Event Type</label>
                        <select
                            value={formData.type_id}
                            onChange={(e) => setFormData({ ...formData, type_id: e.target.value })}
                            style={{ width: '100%', padding: '0.75rem', borderRadius: '0.5rem', border: '1px solid var(--border)', background: 'var(--background)', color: 'var(--fg)' }}
                            disabled={fetching || authLoading}
                        >
                            <option value="">{authLoading ? 'Verifying Session...' : fetching ? 'Syncing...' : 'None'}</option>
                            {types.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
                        </select>
                    </div>
                </div>

                <div>
                    <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 600, textTransform: 'uppercase', marginBottom: '0.5rem', color: 'var(--muted-foreground)' }}>Title</label>
                    <input
                        type="text"
                        value={formData.title}
                        onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                        placeholder="e.g. Midterm Exam"
                        style={{ width: '100%', padding: '0.75rem', borderRadius: '0.5rem', border: '1px solid var(--border)', background: 'var(--background)', color: 'var(--fg)' }}
                        required={!formData.description}
                        disabled={authLoading}
                    />
                </div>

                <div>
                    <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 600, textTransform: 'uppercase', marginBottom: '0.5rem', color: 'var(--muted-foreground)' }}>Description</label>
                    <textarea
                        value={formData.description}
                        onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                        placeholder="Add some details about the event..."
                        style={{ width: '100%', padding: '0.75rem', borderRadius: '0.5rem', border: '1px solid var(--border)', background: 'var(--background)', color: 'var(--fg)', minHeight: '100px', resize: 'vertical' }}
                        disabled={authLoading}
                    />
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>
                    <div>
                        <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 600, textTransform: 'uppercase', marginBottom: '0.5rem', color: 'var(--muted-foreground)' }}>Date</label>
                        <div style={{ position: 'relative' }}>
                            <Calendar size={18} style={{ position: 'absolute', right: '1rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--muted-foreground)', pointerEvents: 'none' }} />
                            <input
                                type="date"
                                value={formData.date}
                                onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                                style={{ width: '100%', padding: '0.75rem', borderRadius: '0.5rem', border: '1px solid var(--border)', background: 'var(--background)', color: 'var(--fg)' }}
                                required
                                disabled={authLoading}
                            />
                        </div>
                    </div>
                    <div>
                        <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 600, textTransform: 'uppercase', marginBottom: '0.5rem', color: 'var(--muted-foreground)' }}>Attachment</label>
                        <label className="btn btn-ghost" style={{ width: '100%', height: '42px', border: '1px dashed var(--border)', cursor: 'pointer', display: 'flex', gap: '0.5rem', alignItems: 'center', justifyContent: 'center', opacity: authLoading ? 0.5 : 1 }}>
                            <Upload size={18} />
                            <span style={{ maxWidth: '180px', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                                {formData.file ? formData.file.name : 'Upload File'}
                            </span>
                            <input type="file" style={{ display: 'none' }} onChange={(e) => setFormData({ ...formData, file: e.target.files?.[0] || null })} disabled={authLoading} />
                        </label>
                    </div>
                </div>

                <button type="submit" className="btn btn-primary" style={{ padding: '1rem', marginTop: '1rem' }} disabled={loading || fetching || authLoading}>
                    {authLoading ? 'Verifying...' : loading ? 'Processing...' : 'Create Scheduled Event'}
                    <Send size={18} />
                </button>
            </form>
        </div>
    );
};
