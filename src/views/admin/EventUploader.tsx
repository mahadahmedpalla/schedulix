import { useState, useEffect, type FormEvent } from 'react';
import { supabase } from '../../services/supabase.ts';
import { Upload, Calendar, Send, CheckCircle } from 'lucide-react';

export const EventUploader = () => {
    const [subjects, setSubjects] = useState<any[]>([]);
    const [types, setTypes] = useState<any[]>([]);
    const [loading, setLoading] = useState(false);
    const [success, setSuccess] = useState(false);

    const [formData, setFormData] = useState({
        subject_id: '',
        type_id: '',
        title: '',
        description: '',
        date: new Date().toISOString().split('T')[0],
        file: null as File | null
    });

    const fetchData = async () => {
        const [subs, typs] = await Promise.all([
            supabase.from('subjects').select('*'),
            supabase.from('event_types').select('*')
        ]);
        if (subs.data) setSubjects(subs.data);
        if (typs.data) setTypes(typs.data);
    };

    useEffect(() => {
        fetchData();
    }, []);

    const handleSubmit = async (e: FormEvent) => {
        e.preventDefault();
        if (!formData.subject_id || !formData.date) return;
        setLoading(true);
        setSuccess(false);

        let fileUrl = '';
        if (formData.file) {
            const fileName = `${Date.now()}_${formData.file.name}`;
            const { data } = await supabase.storage
                .from('event-attachments')
                .upload(fileName, formData.file);

            if (data) {
                const { data: { publicUrl } } = supabase.storage
                    .from('event-attachments')
                    .getPublicUrl(fileName);
                fileUrl = publicUrl;
            }
        }

        const { error } = await supabase.from('events').insert([{
            subject_id: formData.subject_id,
            type_id: formData.type_id || null,
            title: formData.title,
            description: formData.description,
            date: formData.date,
            file_url: fileUrl
        }]);

        setLoading(false);
        if (!error) {
            setSuccess(true);
            setFormData({
                subject_id: '',
                type_id: '',
                title: '',
                description: '',
                date: new Date().toISOString().split('T')[0],
                file: null
            });
            setTimeout(() => setSuccess(false), 3000);
        }
    };

    return (
        <div style={{ maxWidth: '600px' }}>
            <h2 style={{ fontSize: '1.5rem', fontWeight: 600, marginBottom: '2rem' }}>Upload Event</h2>

            {success && (
                <div style={{ background: '#ecfdf5', color: '#059669', padding: '1rem', borderRadius: 'var(--radius)', marginBottom: '2rem', display: 'flex', alignItems: 'center', gap: '0.75rem', animation: 'fadeIn 0.3s ease' }}>
                    <CheckCircle size={20} />
                    Event created successfully and added to calendar!
                </div>
            )}

            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>
                    <div>
                        <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 600, textTransform: 'uppercase', marginBottom: '0.5rem', color: 'var(--muted-foreground)' }}>Subject</label>
                        <select
                            value={formData.subject_id}
                            onChange={(e) => setFormData({ ...formData, subject_id: e.target.value })}
                            style={{ width: '100%', padding: '0.75rem', borderRadius: '0.5rem', border: '1px solid var(--border)', background: 'var(--background)' }}
                            required
                        >
                            <option value="">Select Subject</option>
                            {subjects.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                        </select>
                    </div>
                    <div>
                        <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 600, textTransform: 'uppercase', marginBottom: '0.5rem', color: 'var(--muted-foreground)' }}>Event Type</label>
                        <select
                            value={formData.type_id}
                            onChange={(e) => setFormData({ ...formData, type_id: e.target.value })}
                            style={{ width: '100%', padding: '0.75rem', borderRadius: '0.5rem', border: '1px solid var(--border)', background: 'var(--background)' }}
                        >
                            <option value="">None</option>
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
                        style={{ width: '100%', padding: '0.75rem', borderRadius: '0.5rem', border: '1px solid var(--border)', background: 'var(--background)' }}
                        required={!formData.description}
                    />
                </div>

                <div>
                    <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 600, textTransform: 'uppercase', marginBottom: '0.5rem', color: 'var(--muted-foreground)' }}>Description</label>
                    <textarea
                        value={formData.description}
                        onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                        placeholder="Add some details about the event..."
                        style={{ width: '100%', padding: '0.75rem', borderRadius: '0.5rem', border: '1px solid var(--border)', background: 'var(--background)', minHeight: '100px', resize: 'vertical' }}
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
                                style={{ width: '100%', padding: '0.75rem', borderRadius: '0.5rem', border: '1px solid var(--border)', background: 'var(--background)' }}
                                required
                            />
                        </div>
                    </div>
                    <div>
                        <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 600, textTransform: 'uppercase', marginBottom: '0.5rem', color: 'var(--muted-foreground)' }}>Attachment</label>
                        <label className="btn btn-ghost" style={{ width: '100%', height: '42px', border: '1px dashed var(--border)', cursor: 'pointer', display: 'flex', gap: '0.5rem' }}>
                            <Upload size={18} />
                            {formData.file ? formData.file.name : 'Upload File'}
                            <input type="file" style={{ display: 'none' }} onChange={(e) => setFormData({ ...formData, file: e.target.files?.[0] || null })} />
                        </label>
                    </div>
                </div>

                <button type="submit" className="btn btn-primary" style={{ padding: '1rem', marginTop: '1rem' }} disabled={loading}>
                    {loading ? 'Processing...' : 'Create Scheduled Event'}
                    <Send size={18} />
                </button>
            </form>
        </div>
    );
};
