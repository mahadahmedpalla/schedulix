import { useEffect, useState } from 'react';
import { supabase } from '../../services/supabase.ts';
import { useAuth } from '../../context/AuthContext.tsx';
import { Shield, ShieldAlert, Users, Search, PlusCircle, Edit2, CheckCircle2, AlertCircle } from 'lucide-react';

interface UserRole {
    id: string;
    email: string;
    role: 'student' | 'admin' | 'super_admin';
    batch_id: string | null;
    batch_code: string | null;
    created_at: string;
}

interface Batch {
    id: string;
    batch_code: string;
}

export const RoleManager = () => {
    const { role: currentUserRole } = useAuth();
    const [roles, setRoles] = useState<UserRole[]>([]);
    const [batches, setBatches] = useState<Batch[]>([]);
    const [loading, setLoading] = useState(true);
    
    // Search/filter states
    const [searchQuery, setSearchQuery] = useState('');
    const [roleFilter, setRoleFilter] = useState<string>('all');

    // Modal state
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingRole, setEditingRole] = useState<UserRole | null>(null);

    // Form states
    const [email, setEmail] = useState('');
    const [selectedRole, setSelectedRole] = useState<'student' | 'admin' | 'super_admin'>('student');
    const [selectedBatchId, setSelectedBatchId] = useState<string>('');
    const [formError, setFormError] = useState<string | null>(null);
    const [formSuccess, setFormSuccess] = useState<string | null>(null);
    const [submitting, setSubmitting] = useState(false);

    useEffect(() => {
        if (currentUserRole === 'super_admin') {
            fetchRolesAndBatches();
        }
    }, [currentUserRole]);

    const fetchRolesAndBatches = async () => {
        setLoading(true);
        try {
            // 1. Fetch all batches for the selection lists
            const { data: batchData, error: batchErr } = await supabase
                .from('batches')
                .select('id, batch_code')
                .order('batch_code');
            
            if (batchErr) throw batchErr;
            setBatches(batchData || []);

            // 2. Fetch all user roles mapped with their emails from auth.users (via student_profiles)
            const { data: roleData, error: roleErr } = await supabase
                .from('user_roles')
                .select(`
                    id,
                    role,
                    batch_id,
                    created_at,
                    batches:batch_id (
                        batch_code
                    )
                `);

            if (roleErr) throw roleErr;

            // Fetch email addresses from student_profiles view to combine details
            const userIds = roleData?.map(r => r.id) || [];
            
            let profileMap = new Map<string, string>();
            if (userIds.length > 0) {
                const { data: profileData } = await supabase
                    .from('student_profiles')
                    .select('id, email')
                    .in('id', userIds);
                
                profileData?.forEach(p => profileMap.set(p.id, p.email));
            }

            const mappedRoles: UserRole[] = (roleData || []).map(r => {
                const batch = Array.isArray(r.batches) ? r.batches[0] : r.batches;
                return {
                    id: r.id,
                    email: profileMap.get(r.id) || `User (${r.id.substring(0, 8)})`,
                    role: r.role as any,
                    batch_id: r.batch_id,
                    batch_code: batch ? batch.batch_code : null,
                    created_at: r.created_at
                };
            });

            setRoles(mappedRoles);
        } catch (err: any) {
            console.error('Error fetching role management data:', err);
        } finally {
            setLoading(false);
        }
    };

    const handleOpenCreate = () => {
        setEditingRole(null);
        setEmail('');
        setSelectedRole('student');
        setSelectedBatchId(batches[0]?.id || '');
        setFormError(null);
        setFormSuccess(null);
        setIsModalOpen(true);
    };

    const handleOpenEdit = (roleItem: UserRole) => {
        setEditingRole(roleItem);
        setEmail(roleItem.email);
        setSelectedRole(roleItem.role);
        setSelectedBatchId(roleItem.batch_id || '');
        setFormError(null);
        setFormSuccess(null);
        setIsModalOpen(true);
    };

    const handleSave = async (e: React.FormEvent) => {
        e.preventDefault();
        setFormError(null);
        setFormSuccess(null);
        setSubmitting(true);

        try {
            let targetUserId = editingRole?.id;

            // If creating new: we must look up the user by email first
            if (!targetUserId) {
                const cleanedEmail = email.trim().toLowerCase();
                const { data: searchData, error: searchError } = await supabase
                    .from('student_profiles')
                    .select('id')
                    .eq('email', cleanedEmail)
                    .maybeSingle();

                if (searchError) throw searchError;
                
                if (!searchData) {
                    throw new Error('No registered account found with this email. Make sure the user has signed up/created an account first.');
                }
                
                targetUserId = searchData.id;
            }

            // Perform upsert on user_roles
            const payload = {
                id: targetUserId,
                role: selectedRole,
                batch_id: selectedRole === 'super_admin' ? null : (selectedBatchId || null)
            };

            const { error: upsertError } = await supabase
                .from('user_roles')
                .upsert(payload, { onConflict: 'id' });

            if (upsertError) throw upsertError;

            setFormSuccess(`Successfully assigned ${selectedRole.toUpperCase()} role!`);
            
            // Wait brief moment so they see success animation, then refresh & close
            setTimeout(() => {
                setIsModalOpen(false);
                fetchRolesAndBatches();
            }, 800);

        } catch (err: any) {
            console.error('Error saving role change:', err);
            setFormError(err.message || 'An error occurred while saving the role.');
        } finally {
            setSubmitting(false);
        }
    };

    if (currentUserRole !== 'super_admin') {
        return (
            <div style={{ padding: '2rem', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1rem' }}>
                <ShieldAlert size={48} color="var(--danger)" />
                <h2>Access Denied</h2>
                <p style={{ color: 'var(--fg-muted)' }}>This panel is reserved for Super Admins only.</p>
            </div>
        );
    }

    // Filter roles based on user inputs
    const filteredRoles = roles.filter(r => {
        const matchesSearch = r.email.toLowerCase().includes(searchQuery.toLowerCase());
        const matchesRole = roleFilter === 'all' || r.role === roleFilter;
        return matchesSearch && matchesRole;
    });

    const totalCRs = roles.filter(r => r.role === 'admin').length;
    const totalSuperAdmins = roles.filter(r => r.role === 'super_admin').length;
    const totalStudents = roles.filter(r => r.role === 'student').length;

    return (
        <div className="admin-manager-container fade-in">
            <div className="manager-header">
                <div>
                    <h1 style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <Shield size={24} style={{ color: 'var(--primary)' }} />
                        User Roles Management
                    </h1>
                    <p>Assign roles (student, class representative/admin, super admin) and associate them with target batches.</p>
                </div>
                <button className="btn btn-primary" onClick={handleOpenCreate}>
                    <PlusCircle size={16} />
                    Assign Role
                </button>
            </div>

            {/* Stats Summary Cards */}
            <div className="stats-grid">
                <div className="stat-card premium-glass">
                    <Users className="stat-icon" size={24} style={{ color: 'var(--primary)' }} />
                    <div className="stat-info">
                        <span className="stat-value">{totalStudents}</span>
                        <span className="stat-label">Students</span>
                    </div>
                </div>
                <div className="stat-card premium-glass">
                    <Shield className="stat-icon" size={24} style={{ color: 'var(--accent)' }} />
                    <div className="stat-info">
                        <span className="stat-value">{totalCRs}</span>
                        <span className="stat-label">Class Reps (Admins)</span>
                    </div>
                </div>
                <div className="stat-card premium-glass">
                    <ShieldAlert className="stat-icon" size={24} style={{ color: 'var(--success)' }} />
                    <div className="stat-info">
                        <span className="stat-value">{totalSuperAdmins}</span>
                        <span className="stat-label">Super Admins</span>
                    </div>
                </div>
            </div>

            {/* Filter controls */}
            <div style={{
                display: 'flex',
                gap: '1rem',
                marginBottom: '1.5rem',
                flexWrap: 'wrap'
            }}>
                <div className="form-group" style={{ flex: 1, minWidth: '250px', marginBottom: 0 }}>
                    <div style={{ position: 'relative' }}>
                        <Search size={16} style={{
                            position: 'absolute',
                            left: '0.75rem',
                            top: '50%',
                            transform: 'translateY(-50%)',
                            color: 'var(--fg-muted)'
                        }} />
                        <input
                            placeholder="Search by registered email..."
                            value={searchQuery}
                            onChange={e => setSearchQuery(e.target.value)}
                            style={{
                                paddingLeft: '2.5rem',
                                width: '100%'
                            }}
                        />
                    </div>
                </div>
                <div className="form-group" style={{ width: '180px', marginBottom: 0 }}>
                    <select
                        value={roleFilter}
                        onChange={e => setRoleFilter(e.target.value)}
                        style={{ width: '100%' }}
                    >
                        <option value="all">All Roles</option>
                        <option value="student">Student</option>
                        <option value="admin">Class Rep (Admin)</option>
                        <option value="super_admin">Super Admin</option>
                    </select>
                </div>
            </div>

            {/* Manager Content */}
            <div className="manager-content">
                {loading ? (
                    <div className="loading-state">
                        <div className="spinner" />
                        <p>Loading active users...</p>
                    </div>
                ) : (
                    <div className="admin-table-wrapper">
                        <table className="admin-table">
                            <thead>
                                <tr>
                                    <th>Registered Email</th>
                                    <th>Role</th>
                                    <th>Assigned Cohort / Batch</th>
                                    <th style={{ textAlign: 'right' }}>Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {filteredRoles.map((r) => (
                                    <tr key={r.id}>
                                        <td className="font-medium">{r.email}</td>
                                        <td>
                                            <span style={{
                                                display: 'inline-flex',
                                                alignItems: 'center',
                                                gap: '0.35rem',
                                                padding: '0.2rem 0.6rem',
                                                borderRadius: '1rem',
                                                fontSize: '0.75rem',
                                                fontWeight: 600,
                                                textTransform: 'uppercase',
                                                background: r.role === 'super_admin' ? 'rgba(74, 222, 128, 0.15)' :
                                                            r.role === 'admin' ? 'rgba(96, 165, 250, 0.15)' :
                                                            'rgba(156, 163, 175, 0.15)',
                                                color: r.role === 'super_admin' ? 'var(--success)' :
                                                       r.role === 'admin' ? 'var(--accent)' :
                                                       'var(--fg-muted)'
                                            }}>
                                                {r.role === 'super_admin' ? <ShieldAlert size={12} /> : 
                                                 r.role === 'admin' ? <Shield size={12} /> : 
                                                 <Users size={12} />}
                                                {r.role === 'admin' ? 'Class Rep' : r.role === 'super_admin' ? 'Super Admin' : 'Student'}
                                            </span>
                                        </td>
                                        <td>
                                            {r.role === 'super_admin' ? (
                                                <span style={{ color: 'var(--fg-muted)', fontSize: '0.85rem', fontStyle: 'italic' }}>Global Access</span>
                                            ) : r.batch_code ? (
                                                <span className="badge-code">{r.batch_code}</span>
                                            ) : (
                                                <span style={{ color: 'var(--danger)', fontSize: '0.85rem' }}>No Batch Linked!</span>
                                            )}
                                        </td>
                                        <td style={{ textAlign: 'right' }}>
                                            <div className="action-btns">
                                                <button className="btn-icon" onClick={() => handleOpenEdit(r)} title="Edit Role">
                                                    <Edit2 size={14} />
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                                {filteredRoles.length === 0 && (
                                    <tr>
                                        <td colSpan={4} className="empty-state">No users found matching your search.</td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>

            {/* Add / Edit Modal */}
            {isModalOpen && (
                <div className="admin-modal-overlay">
                    <div className="admin-modal premium-glass fade-in" style={{ maxWidth: '480px' }}>
                        <div className="modal-header">
                            <h2>{editingRole ? 'Update Role Settings' : 'Assign New User Role'}</h2>
                            <button className="btn-icon" onClick={() => setIsModalOpen(false)}>
                                <span className="material-symbols-outlined">close</span>
                            </button>
                        </div>
                        <form onSubmit={handleSave} className="admin-form">
                            {formError && (
                                <div style={{
                                    display: 'flex',
                                    alignItems: 'start',
                                    gap: '0.5rem',
                                    padding: '0.75rem',
                                    background: 'rgba(239, 68, 68, 0.1)',
                                    border: '1px solid rgba(239, 68, 68, 0.2)',
                                    borderRadius: 'var(--radius-sm)',
                                    color: 'var(--danger)',
                                    fontSize: '0.85rem',
                                    marginBottom: '1rem'
                                }}>
                                    <AlertCircle size={16} style={{ flexShrink: 0, marginTop: '0.1rem' }} />
                                    <span>{formError}</span>
                                </div>
                            )}

                            {formSuccess && (
                                <div style={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '0.5rem',
                                    padding: '0.75rem',
                                    background: 'rgba(34, 197, 94, 0.1)',
                                    border: '1px solid rgba(34, 197, 94, 0.2)',
                                    borderRadius: 'var(--radius-sm)',
                                    color: 'var(--success)',
                                    fontSize: '0.85rem',
                                    marginBottom: '1rem'
                                }}>
                                    <CheckCircle2 size={16} />
                                    <span>{formSuccess}</span>
                                </div>
                            )}

                            <div className="form-group">
                                <label>User Email Address</label>
                                <input
                                    required
                                    type="email"
                                    disabled={!!editingRole}
                                    placeholder="student@university.edu"
                                    value={email}
                                    onChange={e => setEmail(e.target.value)}
                                    style={{ opacity: editingRole ? 0.7 : 1 }}
                                />
                                {!editingRole && (
                                    <p style={{ fontSize: '0.75rem', color: 'var(--fg-muted)', marginTop: '0.25rem' }}>
                                        User must have already registered an account using this email address.
                                    </p>
                                )}
                            </div>

                            <div className="form-group">
                                <label>System Role</label>
                                <select
                                    value={selectedRole}
                                    onChange={e => setSelectedRole(e.target.value as any)}
                                >
                                    <option value="student">Student</option>
                                    <option value="admin">Class Rep (Admin)</option>
                                    <option value="super_admin">Super Admin</option>
                                </select>
                            </div>

                            {selectedRole !== 'super_admin' && (
                                <div className="form-group">
                                    <label>Associated Batch / Cohort</label>
                                    <select
                                        required
                                        value={selectedBatchId}
                                        onChange={e => setSelectedBatchId(e.target.value)}
                                    >
                                        <option value="" disabled>Select Batch...</option>
                                        {batches.map(b => (
                                            <option key={b.id} value={b.id}>{b.batch_code}</option>
                                        ))}
                                    </select>
                                    <p style={{ fontSize: '0.75rem', color: 'var(--fg-muted)', marginTop: '0.25rem' }}>
                                        Select the class/batch this user belongs to or is managing.
                                    </p>
                                </div>
                            )}

                            <div className="modal-footer" style={{ marginTop: '2rem' }}>
                                <button type="button" className="btn btn-outline" onClick={() => setIsModalOpen(false)}>Cancel</button>
                                <button
                                    type="submit"
                                    className="btn btn-primary"
                                    disabled={submitting}
                                    style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}
                                >
                                    {submitting ? (
                                        <>
                                            <div className="spinner" style={{ width: '14px', height: '14px', borderWidth: '2px' }} />
                                            Saving...
                                        </>
                                    ) : (
                                        'Save Role'
                                    )}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};
