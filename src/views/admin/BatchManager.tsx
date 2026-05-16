import { useEffect, useState, useMemo } from 'react';
import { supabase } from '../../services/supabase.ts';
import { useAuth } from '../../context/AuthContext.tsx';

interface Program {
    id: string;
    name: string;
    short_code: string;
}

interface Batch {
    id: string;
    program_id: string;
    batch_year: number;
    session: 'Fall' | 'Spring';
    section: string | null;
    current_semester: number;
    batch_code: string;
    programs?: Program;
}

export const BatchManager = () => {
    const { role } = useAuth();
    const [batches, setBatches] = useState<Batch[]>([]);
    const [programs, setPrograms] = useState<Program[]>([]);
    const [loading, setLoading] = useState(true);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingBatch, setEditingBatch] = useState<Batch | null>(null);

    // Form State
    const [programId, setProgramId] = useState('');
    const [batchYear, setBatchYear] = useState(new Date().getFullYear());
    const [session, setSession] = useState<'Fall' | 'Spring'>('Fall');
    const [section, setSection] = useState('');
    const [semester, setSemester] = useState(1);
    const [customCode, setCustomCode] = useState('');
    const [useCustomCode, setUseCustomCode] = useState(false);

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        setLoading(true);
        const [batchesRes, programsRes] = await Promise.all([
            supabase.from('batches').select('*, programs(*)').order('batch_code'),
            supabase.from('programs').select('*').order('name')
        ]);
        
        if (batchesRes.data) setBatches(batchesRes.data);
        if (programsRes.data) setPrograms(programsRes.data);
        setLoading(false);
    };

    const generatedCode = useMemo(() => {
        if (useCustomCode) return customCode;
        const program = programs.find(p => p.id === programId);
        if (!program) return '';
        
        const year = batchYear.toString();
        const sess = session === 'Fall' ? 'FA' : 'SP';
        const prog = program.short_code.toUpperCase();
        const sect = section ? `-${section.toUpperCase()}` : '';
        
        // Pattern: [YEAR][SESSION]-[PROGRAM][SECTION]-[SEM]
        // Example: 2024FA-BCS-A-4
        return `${year}${sess}-${prog}${sect}-${semester}`;
    }, [programId, batchYear, session, section, semester, customCode, useCustomCode, programs]);

    const handleSave = async (e: React.FormEvent) => {
        e.preventDefault();
        const payload = {
            program_id: programId,
            batch_year: batchYear,
            session,
            section: section || null,
            current_semester: semester,
            batch_code: useCustomCode ? customCode : generatedCode
        };

        if (editingBatch) {
            const { error } = await supabase
                .from('batches')
                .update(payload)
                .eq('id', editingBatch.id);
            if (error) alert(error.message);
        } else {
            const { error } = await supabase
                .from('batches')
                .insert([payload]);
            if (error) alert(error.message);
        }

        setIsModalOpen(false);
        resetForm();
        fetchData();
    };

    const handleDelete = async (id: string) => {
        if (!confirm('Are you sure? This will affect all students and subjects linked to this batch.')) return;
        const { error } = await supabase.from('batches').delete().eq('id', id);
        if (error) alert(error.message);
        else fetchData();
    };

    const openEdit = (b: Batch) => {
        setEditingBatch(b);
        setProgramId(b.program_id);
        setBatchYear(b.batch_year);
        setSession(b.session);
        setSection(b.section || '');
        setSemester(b.current_semester);
        setCustomCode(b.batch_code);
        setUseCustomCode(true); // Default to custom if editing existing
        setIsModalOpen(true);
    };

    const resetForm = () => {
        setEditingBatch(null);
        setProgramId(programs[0]?.id || '');
        setBatchYear(new Date().getFullYear());
        setSession('Fall');
        setSection('');
        setSemester(1);
        setCustomCode('');
        setUseCustomCode(false);
    };

    if (role !== 'super_admin') {
        return <div className="p-8">Access Denied. Super Admin only.</div>;
    }

    return (
        <div className="admin-manager-container fade-in">
            <div className="manager-header">
                <div>
                    <h1>Batch Management</h1>
                    <p>Orchestrate academic cohorts and maintain unique identification across programs.</p>
                </div>
                <button className="btn btn-primary" onClick={() => { resetForm(); setIsModalOpen(true); }}>
                    <span className="material-symbols-outlined">group_add</span>
                    Initialize Batch
                </button>
            </div>

            <div className="stats-grid">
                <div className="stat-card premium-glass">
                    <span className="material-symbols-outlined stat-icon">groups</span>
                    <div className="stat-info">
                        <span className="stat-value">{batches.length}</span>
                        <span className="stat-label">Total Batches</span>
                    </div>
                </div>
                <div className="stat-card premium-glass">
                    <span className="material-symbols-outlined stat-icon">school</span>
                    <div className="stat-info">
                        <span className="stat-value">{new Set(batches.map(b => b.program_id)).size}</span>
                        <span className="stat-label">Programs Represented</span>
                    </div>
                </div>
                <div className="stat-card premium-glass">
                    <span className="material-symbols-outlined stat-icon">event_note</span>
                    <div className="stat-info">
                        <span className="stat-value">{batches.filter(b => b.current_semester <= 2).length}</span>
                        <span className="stat-label">Freshman Cohorts</span>
                    </div>
                </div>
            </div>

            <div className="manager-content">
                {loading ? (
                    <div className="loading-state">
                        <div className="spinner" />
                        <p>Loading batches...</p>
                    </div>
                ) : (
                    <div className="admin-table-wrapper">
                        <table className="admin-table">
                            <thead>
                                <tr>
                                    <th>Batch Code</th>
                                    <th>Program</th>
                                    <th>Session</th>
                                    <th>Semester</th>
                                    <th style={{ textAlign: 'right' }}>Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {batches.map((b) => (
                                    <tr key={b.id}>
                                        <td><span className="batch-badge-pill">{b.batch_code}</span></td>
                                        <td className="font-medium">{b.programs?.name}</td>
                                        <td>{b.session} {b.batch_year}</td>
                                        <td><span className="sem-indicator">S{b.current_semester}</span></td>
                                        <td style={{ textAlign: 'right' }}>
                                            <div className="action-btns">
                                                <button className="btn-icon" onClick={() => openEdit(b)}>
                                                    <span className="material-symbols-outlined">edit</span>
                                                </button>
                                                <button className="btn-icon btn-icon-danger" onClick={() => handleDelete(b.id)}>
                                                    <span className="material-symbols-outlined">delete</span>
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                                {batches.length === 0 && (
                                    <tr>
                                        <td colSpan={5} className="empty-state">No batches found. Create your first batch to start organizing subjects.</td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>

            {/* Modal */}
            {isModalOpen && (
                <div className="admin-modal-overlay">
                    <div className="admin-modal premium-glass fade-in">
                        <div className="modal-header">
                            <h2>{editingBatch ? 'Edit Batch' : 'Create New Batch'}</h2>
                            <button className="btn-icon" onClick={() => setIsModalOpen(false)}>
                                <span className="material-symbols-outlined">close</span>
                            </button>
                        </div>
                        <form onSubmit={handleSave} className="admin-form">
                            <div className="form-group">
                                <label>Program</label>
                                <select required value={programId} onChange={e => setProgramId(e.target.value)}>
                                    <option value="" disabled>Select Program</option>
                                    {programs.map(p => (
                                        <option key={p.id} value={p.id}>{p.name} ({p.short_code})</option>
                                    ))}
                                </select>
                            </div>

                            <div className="form-row">
                                <div className="form-group">
                                    <label>Year</label>
                                    <input type="number" required value={batchYear} onChange={e => setBatchYear(parseInt(e.target.value))} />
                                </div>
                                <div className="form-group">
                                    <label>Session</label>
                                    <select value={session} onChange={e => setSession(e.target.value as any)}>
                                        <option value="Fall">Fall</option>
                                        <option value="Spring">Spring</option>
                                    </select>
                                </div>
                            </div>

                            <div className="form-row">
                                <div className="form-group">
                                    <label>Section (Optional)</label>
                                    <input placeholder="e.g., A, B" value={section} onChange={e => setSection(e.target.value)} />
                                </div>
                                <div className="form-group">
                                    <label>Current Semester</label>
                                    <input type="number" min={1} max={12} value={semester} onChange={e => setSemester(parseInt(e.target.value))} />
                                </div>
                            </div>

                            <div className="form-group code-preview-group">
                                <div className="code-label-row">
                                    <label>Batch Code (Unique ID)</label>
                                    <button type="button" className="btn-text-toggle" onClick={() => setUseCustomCode(!useCustomCode)}>
                                        {useCustomCode ? 'Use Auto-Generate' : 'Enter Manually'}
                                    </button>
                                </div>
                                {useCustomCode ? (
                                    <input required placeholder="ENTER-CUSTOM-CODE" value={customCode} onChange={e => setCustomCode(e.target.value.toUpperCase())} />
                                ) : (
                                    <div className="code-preview">
                                        <code>{generatedCode || 'Select a program to generate code...'}</code>
                                    </div>
                                )}
                            </div>

                            <div className="modal-footer">
                                <button type="button" className="btn btn-outline" onClick={() => setIsModalOpen(false)}>Cancel</button>
                                <button type="submit" className="btn btn-primary" disabled={!generatedCode && !useCustomCode}>Create Batch</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};
