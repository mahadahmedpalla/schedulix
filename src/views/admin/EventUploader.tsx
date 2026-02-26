import { useState, useEffect, type FormEvent } from 'react';
import { supabase } from '../../services/supabase.ts';
import { Upload, Calendar, Send, CheckCircle } from 'lucide-react';

// Inject toast keyframes once
const toastStyles = document.createElement('style');
toastStyles.textContent = `
@keyframes toastSlideIn {
    from { transform: translateX(120%); opacity: 0; }
    to { transform: translateX(0); opacity: 1; }
}
@keyframes toastFadeOut {
    from { transform: translateX(0); opacity: 1; }
    to { transform: translateX(120%); opacity: 0; }
}
`;
if (!document.querySelector('[data-toast-styles]')) {
    toastStyles.setAttribute('data-toast-styles', '');
    document.head.appendChild(toastStyles);
}

const SuccessToast = ({ show, message }: { show: boolean; message: string }) => {
    const [visible, setVisible] = useState(false);
    const [leaving, setLeaving] = useState(false);

    useEffect(() => {
        if (show) {
            setVisible(true);
            setLeaving(false);
            const timer = setTimeout(() => setLeaving(true), 2200);
            const hide = setTimeout(() => setVisible(false), 2700);
            return () => { clearTimeout(timer); clearTimeout(hide); };
        }
    }, [show]);

    if (!visible) return null;

    return (
        <div
            style={{
                position: 'fixed',
                top: '1.5rem',
                right: '1.5rem',
                zIndex: 9999,
                display: 'flex',
                alignItems: 'center',
                gap: '0.6rem',
                background: '#18181b',
                color: '#ffffff',
                padding: '0.85rem 1.25rem',
                borderRadius: '10px',
                fontSize: '0.875rem',
                fontWeight: 500,
                boxShadow: '0 8px 30px rgba(0,0,0,0.18)',
                animation: leaving ? 'toastFadeOut 0.5s ease forwards' : 'toastSlideIn 0.4s ease forwards',
            }}
        >
            <CheckCircle size={18} color="#34d399" />
            {message}
        </div>
    );
};

export const EventUploader = () => {
    const [subjects, setSubjects] = useState<any[]>([]);
    const [types, setTypes] = useState<any[]>([]);
    const [loading, setLoading] = useState(false);
    const [toastKey, setToastKey] = useState(0);

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
            file_url: fileUrl,
            is_global: true
        }]);

        setLoading(false);
        if (!error) {
            setToastKey(prev => prev + 1);
            setFormData({
                subject_id: '',
                type_id: '',
                title: '',
                description: '',
                date: new Date().toISOString().split('T')[0],
                file: null
            });
        }
    };

    return (
        <div style={{ maxWidth: '600px' }}>
            <SuccessToast key={toastKey} show={toastKey > 0} message="Event created successfully!" />

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
