import { useState, useEffect, useCallback } from 'react';
import { adminApi } from '../../api/admin.api';
import type { User } from '../../types';
import { Users, Search, ChevronLeft, ChevronRight, Loader2, ShieldOff, ShieldCheck, FileUp } from 'lucide-react';
import { toast } from 'react-hot-toast';
import './Users.css';

const ROLE_BADGE: Record<string, string> = {
  STUDENT: 'badge-student',
  PROFESSOR: 'badge-professor',
  ADMIN: 'badge-admin',
};

export default function AdminUsers() {
  const [users, setUsers] = useState<User[]>([]);
  const [page, setPage] = useState(1);
  const [lastPage, setLastPage] = useState(1);
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState('');
  const [isLoading, setIsLoading] = useState(true);

  const fetchUsers = useCallback(async () => {
    setIsLoading(true);
    try {
      const r = await adminApi.getUsers({ page, search, role: roleFilter || undefined, limit: 20 });
      setUsers(r.data.data);
      setLastPage(r.data.meta.lastPage);
    } catch { toast.error('Failed to load users'); }
    finally { setIsLoading(false); }
  }, [page, search, roleFilter]);

  useEffect(() => { fetchUsers(); }, [fetchUsers]);

  const toggleSuspend = async (user: User) => {
    try {
      if (user.status === 'SUSPENDED') {
        await adminApi.activateUser(user.id);
        setUsers(p => p.map(u => u.id === user.id ? { ...u, status: 'ACTIVE' } : u));
        toast.success('User activated');
      } else {
        await adminApi.suspendUser(user.id);
        setUsers(p => p.map(u => u.id === user.id ? { ...u, status: 'SUSPENDED' } : u));
        toast.success('User suspended');
      }
    } catch { toast.error('Operation failed'); }
  };

  const onImportCsv = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    toast.promise(adminApi.importUsersCsv(file).then(() => fetchUsers()), {
      loading: 'Importing...', success: 'Import complete!', error: 'Import failed',
    });
  };

  return (
    <div className="admin-page animate-fade-in">
      <div className="page-header">
        <div className="page-title"><Users size={24} /><h1>User Management</h1></div>
        <label className="btn btn-secondary" style={{ cursor: 'pointer' }}>
          <FileUp size={16} /> Import CSV
          <input type="file" hidden accept=".csv" onChange={onImportCsv} />
        </label>
      </div>

      <div className="page-filters">
        <div className="search-box"><Search size={16} />
          <input placeholder="Search name or email..." value={search} onChange={e => { setSearch(e.target.value); setPage(1); }} />
        </div>
        <select value={roleFilter} onChange={e => { setRoleFilter(e.target.value); setPage(1); }}>
          <option value="">All Roles</option>
          <option value="STUDENT">Student</option>
          <option value="PROFESSOR">Professor</option>
          <option value="ADMIN">Admin</option>
        </select>
      </div>

      {isLoading ? <div className="loading-state"><Loader2 className="spin" size={32} /></div> : (
        <>
          <div className="data-table">
            <table>
              <thead><tr>
                <th>Name</th><th>Email</th><th>Role</th><th>Status</th><th>Code/ID</th><th>Actions</th>
              </tr></thead>
              <tbody>
                {users.map(u => (
                  <tr key={u.id} className={u.status === 'SUSPENDED' ? 'row-suspended' : ''}>
                    <td>{u.firstName} {u.lastName}</td>
                    <td className="text-secondary">{u.email}</td>
                    <td><span className={`badge ${ROLE_BADGE[u.role] || ''}`}>{u.role}</span></td>
                    <td><span className={`status-badge ${u.status === 'ACTIVE' ? 'active' : 'suspended'}`}>{u.status}</span></td>
                    <td className="text-secondary text-sm">{u.studentProfile?.studentCode || '-'}</td>
                    <td>
                      <button
                        className={`btn-icon ${u.status === 'SUSPENDED' ? 'success' : 'danger'}`}
                        onClick={() => toggleSuspend(u)}
                        title={u.status === 'SUSPENDED' ? 'Activate' : 'Suspend'}
                      >
                        {u.status === 'SUSPENDED' ? <ShieldCheck size={15} /> : <ShieldOff size={15} />}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="pagination">
            <button disabled={page <= 1} onClick={() => setPage(p => p - 1)}><ChevronLeft size={16} /></button>
            <span>{page} / {lastPage}</span>
            <button disabled={page >= lastPage} onClick={() => setPage(p => p + 1)}><ChevronRight size={16} /></button>
          </div>
        </>
      )}
    </div>
  );
}
