import { useEffect, useState } from 'react';
import { supabase } from '../../services/supabase.ts';
import { useAuth } from '../../context/AuthContext.tsx';

interface Program {
    id: string;
    name: string;
    short_code: string;
    department_name: string;
}

export const ProgramManager = () => {
    const { role } = useAuth();
    const [programs, setPrograms] = useState<Program[]>([]);
    const [loading, setLoading] = useState(true);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingProgram, setEditingProgram] = useState<Program | null>(null);

    // Form State
    const [name, setName] = useState('');
    const [shortCode, setShortCode] = useState('');
    const [department, setDepartment] = useState('');

    useEffect(() => {
        fetchPrograms();
    }, []);

    const fetchPrograms = async () => {
        setLoading(true);
        const { data, error } = await supabase
            .from('programs')
            .select('*')
            .order('name');
        
        if (!error && data) setPrograms(data);
        setLoading(false);
    };

    const handleSave = async (e: React.FormEvent) => {
        e.preventDefault();
        const payload = {
            name,
            short_code: shortCode.toUpperCase(),
            department_name: department
        };

        if (editingProgram) {
            const { error } = await supabase
                .from('programs')
                .update(payload)
                .eq('id', editingProgram.id);
            if (error) alert(error.message);
        } else {
            const { error } = await supabase
                .from('programs')
                .insert([payload]);
            if (error) alert(error.message);
        }

        setIsModalOpen(false);
        resetForm();
        fetchPrograms();
    };

    const handleDelete = async (id: string) => {
        if (!confirm('Are you sure? This might affect batches linked to this program.')) return;
        const { error } = await supabase.from('programs').delete().eq('id', id);
        if (error) alert(error.message);
        else fetchPrograms();
    };

    const openEdit = (p: Program) => {
        setEditingProgram(p);
        setName(p.name);
        setShortCode(p.short_code);
        setDepartment(p.department_name);
        setIsModalOpen(true);
    };

    const resetForm = () => {
        setEditingProgram(null);
        setName('');
        setShortCode('');
        setDepartment('');
    };

    if (role !== 'super_admin') {
        return <div className="p-8">Access Denied. Super Admin only.</div>;
    }

    return (
        <div className="admin-manager-container fade-in">
            <div className="manager-header">
                <div>
                    <h1>Program Management</h1>
                    <p>Define academic programs and departments.</p>
                </div>
                <button className="btn btn-primary" onClick={() => { resetForm(); setIsModalOpen(true); }}>
                    <span className="material-symbols-outlined">add</span>
                    Add Program
                </button>
            </div>

            <div className="manager-content">
                {loading ? (
                    <div className="loading-state">
                        <div className="spinner" />
                        <p>Loading programs...</p>
                    </div>
                ) : (
                    <div className="admin-table-wrapper">
                        <table className="admin-table">
                            <thead>
                                <tr>
                                    <th>Program Name</th>
                                    <th>Code</th>
                                    <th>Department</th>
                                    <th style={{ textAlign: 'right' }}>Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {programs.map((p) => (
                                    <tr key={p.id}>
                                        <td className="font-medium">{p.name}</td>
                                        <td><span className="badge-code">{p.short_code}</span></td>
                                        <td>{p.department_name}</td>
                                        <td style={{ textAlign: 'right' }}>
                                            <div className="action-btns">
                                                <button className="btn-icon" onClick={() => openEdit(p)}>
                                                    <span className="material-symbols-outlined">edit</span>
                                                </button>
                                                <button className="btn-icon btn-icon-danger" onClick={() => handleDelete(p.id)}>
                                                    <span className="material-symbols-outlined">delete</span>
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                                {programs.length === 0 && (
                                    <tr>
                                        <td colSpan={4} className="empty-state">No programs found. Add your first program to get started.</td>
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
                            <h2>{editingProgram ? 'Edit Program' : 'Add New Program'}</h2>
                            <button className="btn-icon" onClick={() => setIsModalOpen(false)}>
                                <span className="material-symbols-outlined">close</span>
                            </button>
                        </div>
                        <form onSubmit={handleSave} className="admin-form">
                            <div className="form-group">
                                <label>Program Name</label>
                                <input 
                                    required 
                                    placeholder="e.g., Bachelor of Computer Science" 
                                    value={name}
                                    onChange={e => setName(e.target.value)}
                                />
                            </div>
                            <div className="form-row">
                                <div className="form-group">
                                    <label>Short Code</label>
                                    <input 
                                        required 
                                        placeholder="e.g., BCS" 
                                        maxLength={10}
                                        value={shortCode}
                                        onChange={e => setShortCode(e.target.value)}
                                    />
                                </div>
                                <div className="form-group">
                                    <label>Department</label>
                                    <input 
                                        required 
                                        placeholder="e.g., Computing" 
                                        value={department}
                                        onChange={e => setDepartment(e.target.value)}
                                    />
                                </div>
                            </div>
                            <div className="modal-footer">
                                <button type="button" className="btn btn-outline" onClick={() => setIsModalOpen(false)}>Cancel</button>
                                <button type="submit" className="btn btn-primary">Save Program</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};
