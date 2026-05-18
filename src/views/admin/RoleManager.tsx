import { useEffect, useState } from 'react';
import { supabase } from '../../services/supabase.ts';
import { useAuth } from '../../context/AuthContext.tsx';

interface RoleRecord {
    id: string;
    role: 'student' | 'admin' | 'super_admin';
    batch_id: string | null;
    batch_code: string | null;
    email: string;
}

interface Batch {
    id: string;
    batch_code: string;
}

interface StudentProfile {
    id: string;
    email: string;
}

export const RoleManager = () => {
    const { role } = useAuth();
    const [rolesList, setRolesList] = useState<RoleRecord[]>([]);
    const [batches, setBatches] = useState<Batch[]>([]);
    const [studentProfiles, setStudentProfiles] = useState<StudentProfile[]>([]);
    const [loading, setLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);

    // Form states
    const [emailInput, setEmailInput] = useState('');
    const [selectedRole, setSelectedRole] = useState<'student' | 'admin' | 'super_admin'>('student');
    const [selectedBatchId, setSelectedBatchId] = useState('');
    const [errorMsg, setErrorMsg] = useState<string | null>(null);
    const [successMsg, setSuccessMsg] = useState<string | null>(null);

    useEffect(() => {
        if (role === 'super_admin') {
            loadInitialData();
        }
    }, [role]);

    const loadInitialData = async () => {
        setLoading(true);
        setErrorMsg(null);
        try {
            await Promise.all([
                fetchRolesList(),
                fetchBatches(),
                fetchStudentProfiles()
            ]);
        } catch (err: any) {
            setErrorMsg(err.message || 'Failed to load system data.');
        } finally {
            setLoading(false);
        }
    };

    const fetchRolesList = async () => {
        const { data, error } = await supabase
            .from('user_roles')
            .select(`
                id,
                role,
                batch_id,
                batches:batch_id (
                    batch_code
                )
            `);
        
        if (error) throw error;

        // Since student_profiles is a view or a separate table, we fetch all profiles to map emails securely
        const { data: profiles, error: profileErr } = await supabase
            .from('student_profiles')
            .select('id, email');

        if (profileErr) throw profileErr;

        const profileMap = new Map<string, string>();
        profiles?.forEach(p => profileMap.set(p.id, p.email));

        const mapped: RoleRecord[] = (data || []).map((item: any) => {
            const batchObj = Array.isArray(item.batches) ? item.batches[0] : item.batches;
            return {
                id: item.id,
                role: item.role,
                batch_id: item.batch_id,
                batch_code: batchObj ? batchObj.batch_code : 'Global / None',
                email: profileMap.get(item.id) || `User (${item.id.substring(0, 8)})`
            };
        });

        setRolesList(mapped);
    };

    const fetchBatches = async () => {
        const { data, error } = await supabase
            .from('batches')
            .select('id, batch_code')
            .order('batch_code');
        if (error) throw error;
        setBatches(data || []);
        if (data && data.length > 0) {
            setSelectedBatchId(data[0].id);
        }
    };

    const fetchStudentProfiles = async () => {
        const { data, error } = await supabase
            .from('student_profiles')
            .select('id, email')
            .order('email');
        if (error) throw error;
        setStudentProfiles(data || []);
    };

    const handleAssignRole = async (e: React.FormEvent) => {
        e.preventDefault();
        setErrorMsg(null);
        setSuccessMsg(null);
        setIsSaving(true);

        try {
            // Find student ID from email input
            const emailClean = emailInput.trim().toLowerCase();
            const matchedProfile = studentProfiles.find(p => p.email.toLowerCase() === emailClean);

            if (!matchedProfile) {
                throw new Error(`No registered student account found with email "${emailClean}". Ask the student to register/sign up first!`);
            }

            const targetUserId = matchedProfile.id;
            const targetBatch = selectedRole === 'super_admin' ? null : selectedBatchId;

            // Perform insert/update using ON CONFLICT (id)
            const { error: upsertErr } = await supabase
                .from('user_roles')
                .upsert(
                    {
                        id: targetUserId,
                        role: selectedRole,
                        batch_id: targetBatch
                    },
                    { onConflict: 'id' }
                );

            if (upsertErr) throw upsertErr;

            setSuccessMsg(`Successfully updated role for ${emailClean} to ${selectedRole}!`);
            setEmailInput('');
            await fetchRolesList();
        } catch (err: any) {
            console.error('Role update error:', err);
            setErrorMsg(err.message || 'Failed to update user role.');
        } finally {
            setIsSaving(false);
        }
    };

    const handleDemoteToStudent = async (record: RoleRecord) => {
        if (!confirm(`Are you sure you want to demote ${record.email} to a standard Student?`)) return;
        setErrorMsg(null);
        setSuccessMsg(null);

        try {
            const { error } = await supabase
                .from('user_roles')
                .update({
                    role: 'student'
                })
                .eq('id', record.id);

            if (error) throw error;

            setSuccessMsg(`Demoted ${record.email} to Student successfully!`);
            await fetchRolesList();
        } catch (err: any) {
            setErrorMsg(err.message || 'Failed to demote user.');
        }
    };

    if (role !== 'super_admin') {
        return (
            <div style={{ padding: '2rem', color: 'var(--danger)', fontWeight: 600 }}>
                Access Denied. Only system Super Admins can manage roles.
            </div>
        );
    }

    const superAdminsCount = rolesList.filter(r => r.role === 'super_admin').length;
    const batchAdminsCount = rolesList.filter(r => r.role === 'admin').length;
    const studentsCount = rolesList.filter(r => r.role === 'student').length;

    return (
        <div className="admin-manager-container fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
            <div className="manager-header">
                <div>
                    <h1 style={{ fontSize: '1.5rem', marginBottom: '0.25rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <span className="material-symbols-outlined" style={{ fontSize: '1.8rem', color: 'var(--brand)' }}>admin_panel_settings</span>
                        Role Management
                    </h1>
                    <p style={{ color: 'var(--fg-muted)', fontSize: '0.85rem' }}>
                        Promote students to Class Representatives (Batch CRs) or Super Admins. Manage access controls securely.
                    </p>
                </div>
            </div>

            {/* Quick Stats Grid */}
            <div className="stats-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1.5rem' }}>
                <div className="stat-card premium-glass" style={{ display: 'flex', alignItems: 'center', gap: '1rem', padding: '1.25rem', borderRadius: 'var(--radius-sm)', background: 'var(--bg-surface)', border: '1px solid var(--border)' }}>
                    <span className="material-symbols-outlined" style={{ fontSize: '2rem', color: 'var(--brand)' }}>shield_person</span>
                    <div>
                        <div style={{ fontSize: '1.5rem', fontWeight: 700 }}>{superAdminsCount}</div>
                        <div style={{ fontSize: '0.75rem', color: 'var(--fg-muted)' }}>Super Admins</div>
                    </div>
                </div>
                <div className="stat-card premium-glass" style={{ display: 'flex', alignItems: 'center', gap: '1rem', padding: '1.25rem', borderRadius: 'var(--radius-sm)', background: 'var(--bg-surface)', border: '1px solid var(--border)' }}>
                    <span className="material-symbols-outlined" style={{ fontSize: '2rem', color: 'var(--success)' }}>manage_accounts</span>
                    <div>
                        <div style={{ fontSize: '1.5rem', fontWeight: 700 }}>{batchAdminsCount}</div>
                        <div style={{ fontSize: '0.75rem', color: 'var(--fg-muted)' }}>Batch CRs / Admins</div>
                    </div>
                </div>
                <div className="stat-card premium-glass" style={{ display: 'flex', alignItems: 'center', gap: '1rem', padding: '1.25rem', borderRadius: 'var(--radius-sm)', background: 'var(--bg-surface)', border: '1px solid var(--border)' }}>
                    <span className="material-symbols-outlined" style={{ fontSize: '2rem', color: 'var(--fg-muted)' }}>group</span>
                    <div>
                        <div style={{ fontSize: '1.5rem', fontWeight: 700 }}>{studentsCount}</div>
                        <div style={{ fontSize: '0.75rem', color: 'var(--fg-muted)' }}>Registered Students</div>
                    </div>
                </div>
            </div>

            {/* Assign Role Panel */}
            <div className="premium-glass" style={{ padding: '1.5rem', borderRadius: 'var(--radius-sm)', background: 'var(--bg-surface)', border: '1px solid var(--border)' }}>
                <h3 style={{ fontSize: '1rem', marginBottom: '1rem', fontWeight: 600 }}>Assign or Modify User Role</h3>
                
                <form onSubmit={handleAssignRole} style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1.5rem', alignItems: 'end' }}>
                    
                    {/* Email Input with Dynamic Datalist Autocomplete */}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                        <label style={{ fontSize: '0.8rem', color: 'var(--fg-muted)', fontWeight: 500 }}>User Email Address</label>
                        <input
                            type="email"
                            required
                            placeholder="Enter student email..."
                            value={emailInput}
                            onChange={(e) => setEmailInput(e.target.value)}
                            list="student-emails"
                            style={{
                                padding: '0.5rem 0.75rem',
                                borderRadius: 'var(--radius-sm)',
                                border: '1px solid var(--border)',
                                background: 'var(--bg)',
                                color: 'var(--fg)',
                                fontSize: '0.875rem'
                            }}
                        />
                        <datalist id="student-emails">
                            {studentProfiles.map(p => (
                                <option key={p.id} value={p.email} />
                            ))}
                        </datalist>
                    </div>

                    {/* Role Choice */}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                        <label style={{ fontSize: '0.8rem', color: 'var(--fg-muted)', fontWeight: 500 }}>Target Role</label>
                        <select
                            value={selectedRole}
                            onChange={(e) => setSelectedRole(e.target.value as any)}
                            style={{
                                padding: '0.5rem 0.75rem',
                                borderRadius: 'var(--radius-sm)',
                                border: '1px solid var(--border)',
                                background: 'var(--bg)',
                                color: 'var(--fg)',
                                fontSize: '0.875rem'
                            }}
                        >
                            <option value="student">Student</option>
                            <option value="admin">Class Representative (CR / Admin)</option>
                            <option value="super_admin">Super Admin</option>
                        </select>
                    </div>

                    {/* Batch Linkage */}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                        <label style={{ fontSize: '0.8rem', color: 'var(--fg-muted)', fontWeight: 500 }}>
                            Cohort Batch {selectedRole === 'super_admin' && '(Not Applicable)'}
                        </label>
                        <select
                            disabled={selectedRole === 'super_admin'}
                            value={selectedBatchId}
                            onChange={(e) => setSelectedBatchId(e.target.value)}
                            style={{
                                padding: '0.5rem 0.75rem',
                                borderRadius: 'var(--radius-sm)',
                                border: '1px solid var(--border)',
                                background: selectedRole === 'super_admin' ? 'var(--bg-raised)' : 'var(--bg)',
                                color: selectedRole === 'super_admin' ? 'var(--fg-subtle)' : 'var(--fg)',
                                fontSize: '0.875rem'
                            }}
                        >
                            {batches.map(b => (
                                <option key={b.id} value={b.id}>{b.batch_code}</option>
                            ))}
                        </select>
                    </div>

                    {/* Save Button */}
                    <button
                        type="submit"
                        disabled={isSaving}
                        className="btn btn-primary"
                        style={{
                            padding: '0.5rem 1rem',
                            borderRadius: 'var(--radius-sm)',
                            background: 'var(--brand)',
                            color: 'white',
                            border: 'none',
                            fontWeight: 600,
                            cursor: 'pointer',
                            fontSize: '0.875rem',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            gap: '0.25rem',
                            height: '38px'
                        }}
                    >
                        <span className="material-symbols-outlined" style={{ fontSize: '1.2rem' }}>save</span>
                        {isSaving ? 'Saving...' : 'Apply Role'}
                    </button>
                </form>

                {errorMsg && (
                    <div style={{ marginTop: '1rem', color: 'var(--danger)', fontSize: '0.85rem', background: 'rgba(239, 68, 68, 0.1)', padding: '0.5rem 0.75rem', borderRadius: 'var(--radius-sm)' }}>
                        ⚠️ {errorMsg}
                    </div>
                )}
                {successMsg && (
                    <div style={{ marginTop: '1rem', color: 'var(--success)', fontSize: '0.85rem', background: 'rgba(16, 185, 129, 0.1)', padding: '0.5rem 0.75rem', borderRadius: 'var(--radius-sm)' }}>
                        ✅ {successMsg}
                    </div>
                )}
            </div>

            {/* List of Roles Table */}
            <div className="manager-content">
                <h3 style={{ fontSize: '1rem', marginBottom: '1rem', fontWeight: 600 }}>Active Roles Registry</h3>
                {loading ? (
                    <div className="loading-state" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1rem', padding: '2rem' }}>
                        <div className="spinner" />
                        <p style={{ color: 'var(--fg-muted)', fontSize: '0.875rem' }}>Loading registry...</p>
                    </div>
                ) : (
                    <div className="admin-table-wrapper" style={{ overflowX: 'auto', border: '1px solid var(--border)', borderRadius: 'var(--radius-sm)', background: 'var(--bg-surface)' }}>
                        <table className="admin-table" style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.875rem' }}>
                            <thead>
                                <tr style={{ background: 'var(--bg-raised)', borderBottom: '1px solid var(--border)' }}>
                                    <th style={{ textAlign: 'left', padding: '0.75rem 1rem', color: 'var(--fg-muted)' }}>User Email</th>
                                    <th style={{ textAlign: 'left', padding: '0.75rem 1rem', color: 'var(--fg-muted)' }}>Assigned Role</th>
                                    <th style={{ textAlign: 'left', padding: '0.75rem 1rem', color: 'var(--fg-muted)' }}>Linked Cohort</th>
                                    <th style={{ textAlign: 'right', padding: '0.75rem 1rem', color: 'var(--fg-muted)' }}>Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {rolesList.map((item) => (
                                    <tr key={item.id} style={{ borderBottom: '1px solid var(--border)' }}>
                                        <td style={{ padding: '0.75rem 1rem', fontWeight: 500 }}>{item.email}</td>
                                        <td style={{ padding: '0.75rem 1rem' }}>
                                            <span style={{
                                                padding: '0.15rem 0.5rem',
                                                borderRadius: '1rem',
                                                fontSize: '0.75rem',
                                                fontWeight: 700,
                                                textTransform: 'uppercase',
                                                background: item.role === 'super_admin' ? 'rgba(59, 130, 246, 0.15)' : item.role === 'admin' ? 'rgba(16, 185, 129, 0.15)' : 'rgba(156, 163, 175, 0.15)',
                                                color: item.role === 'super_admin' ? 'var(--brand)' : item.role === 'admin' ? 'var(--success)' : 'var(--fg-muted)'
                                            }}>
                                                {item.role === 'super_admin' ? 'Super Admin' : item.role === 'admin' ? 'CR / Admin' : 'Student'}
                                            </span>
                                        </td>
                                        <td style={{ padding: '0.75rem 1rem' }}>
                                            <span style={{
                                                padding: '0.2rem 0.4rem',
                                                borderRadius: 'var(--radius-sm)',
                                                background: 'var(--bg)',
                                                border: '1px solid var(--border)',
                                                fontSize: '0.8rem',
                                                fontFamily: 'monospace'
                                            }}>
                                                {item.batch_code}
                                            </span>
                                        </td>
                                        <td style={{ padding: '0.75rem 1rem', textAlign: 'right' }}>
                                            {item.role !== 'student' ? (
                                                <button
                                                    onClick={() => handleDemoteToStudent(item)}
                                                    style={{
                                                        background: 'transparent',
                                                        border: 'none',
                                                        color: 'var(--danger)',
                                                        cursor: 'pointer',
                                                        display: 'inline-flex',
                                                        alignItems: 'center',
                                                        gap: '0.25rem',
                                                        fontSize: '0.8rem',
                                                        fontWeight: 600
                                                    }}
                                                >
                                                    <span className="material-symbols-outlined" style={{ fontSize: '1.1rem' }}>keyboard_double_arrow_down</span>
                                                    Demote
                                                </button>
                                            ) : (
                                                <span style={{ fontSize: '0.8rem', color: 'var(--fg-subtle)' }}>Standard Access</span>
                                            )}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>
        </div>
    );
};
