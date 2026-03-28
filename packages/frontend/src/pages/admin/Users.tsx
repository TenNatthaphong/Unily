import { useState, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import { adminApi } from '../../api/admin.api';
import type { User } from '../../types';
import { 
  Users, Search, Loader2, ShieldOff, ShieldCheck, FileUp, 
  Mail, Info
} from 'lucide-react';
import { toast } from 'react-hot-toast';
import { Select } from '../../components/ui/Select';
import Pagination from '../../components/ui/Pagination';
import './Users.css';

const ROLE_BADGE: Record<string, string> = {
  STUDENT: 'badge-student',
  PROFESSOR: 'badge-professor',
  ADMIN: 'badge-admin',
};

const ROLE_TH: Record<string, string> = {
  STUDENT: 'นักศึกษา',
  PROFESSOR: 'อาจารย์',
  ADMIN: 'ผู้ดูแล',
};

const STATUS_TH: Record<string, string> = {
  ACTIVE: 'ใช้งานได้',
  SUSPENDED: 'ถูกระงับ',
  PENDING: 'รอยืนยัน',
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
      const r = await adminApi.getUsers({ page, search, role: roleFilter || undefined, limit: 15 });
      setUsers(r.data.data);
      setLastPage(r.data.meta?.lastPage ?? 1);
    } catch { toast.error('โหลดข้อมูลผู้ใช้ไม่สำเร็จ'); }
    finally { setIsLoading(false); }
  }, [page, search, roleFilter]);

  useEffect(() => { fetchUsers(); }, [fetchUsers]);

  const toggleSuspend = async (user: User) => {
    const action = user.status === 'SUSPENDED' ? 'เปิดใช้งาน' : 'ระงับ';
    if (!window.confirm(`คุณต้องการ${action}ผู้ใช้ ${user.firstName} หรือไม่?`)) return;
    try {
      if (user.status === 'SUSPENDED') {
        await adminApi.activateUser(user.id);
        setUsers(p => p.map(u => u.id === user.id ? { ...u, status: 'ACTIVE' } : u));
        toast.success('เปิดการใช้งานสำเร็จ');
      } else {
        await adminApi.suspendUser(user.id);
        setUsers(p => p.map(u => u.id === user.id ? { ...u, status: 'SUSPENDED' } : u));
        toast.success('ระงับการใช้งานสำเร็จ');
      }
    } catch { toast.error('ดำเนินการไม่สำเร็จ'); }
  };

  const onImportCsv = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const tid = toast.loading('กำลังนำเข้าข้อมูลผู้ใช้...');
    adminApi.importUsersCsv(file)
      .then(() => {
        toast.success('นำเข้าผู้ใช้สำเร็จ', { id: tid });
        setPage(1);
        fetchUsers();
      })
      .catch((err) => toast.error(err.response?.data?.message || 'นำเข้าไม่สำเร็จ', { id: tid }));
  };

  return (
    <div className="admin-page animate-fade-in user-page">
      <div className="page-header">
        <div className="page-title">
          <Users size={24} />
          <h1>จัดการรายชื่อผู้ใช้</h1>
          <span className="badge">User Directory</span>
        </div>
        <div className="header-actions">
           <label className="btn btn-import" style={{ cursor: 'pointer' }}>
            <FileUp size={16} /> นำเข้า CSV
            <input type="file" hidden accept=".csv" onChange={onImportCsv} />
          </label>
        </div>
      </div>

      <div className="page-filters">
        <div className="search-box">
          <Search size={18} />
          <input placeholder="ค้นหาด้วยชื่อ-นามสกุล หรือ อีเมล..." value={search} onChange={e => { setSearch(e.target.value); setPage(1); }} />
        </div>
        <div className="role-filters">
          <Select 
            value={roleFilter} 
            onChange={val => { setRoleFilter(val); setPage(1); }}
            placeholder="ทุกบทบาท (All Roles)"
            options={[
              { value: '', label: 'ทุกบทบาท' },
              { value: 'STUDENT', label: 'นักศึกษา' },
              { value: 'PROFESSOR', label: 'อาจารย์' },
              { value: 'ADMIN', label: 'ผู้ดูแลระบบ' }
            ]}
          />
        </div>
      </div>

      {isLoading ? (
        <div className="loading-state"><Loader2 className="spin" size={40} /></div>
      ) : (
        <>
          <div className="user-table-container card">
            <table className="data-table user-table">
              <thead>
                <tr>
                  <th>ชื่อ - นามสกุล</th>
                  <th>รายละเอียดติดต่อ</th>
                  <th className="text-center">รหัส / รหัสพนักงาน</th>
                  <th className="text-center">บทบาท</th>
                  <th className="text-center">สถานะ</th>
                  <th className="text-right">จัดการ</th>
                </tr>
              </thead>
              <tbody>
                {users.map((u, i) => (
                  <motion.tr 
                    key={u.id}
                    initial={{ opacity: 0, y: 5 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.03 }}
                    className={u.status === 'SUSPENDED' ? 'row-suspended' : ''}
                  >
                    <td>
                      <div className="user-identity">
                        <div className={`user-avatar ${u.role?.toLowerCase()}`}>
                          {u.firstName?.[0]}{u.lastName?.[0]}
                        </div>
                        <div className="user-name-stack">
                          <span className="user-fullname">{u.firstName} {u.lastName}</span>
                          <span className="user-subrole">{u.role}</span>
                        </div>
                      </div>
                    </td>
                    <td>
                      <div className="user-contact">
                        <div className="contact-item">
                           <Mail size={12} />
                           <span>{u.email}</span>
                        </div>
                      </div>
                    </td>
                    <td className="text-center">
                       {u.studentProfile?.studentCode || (u.professorProfile as any)?.id?.slice(0, 8) || '-'}
                    </td>
                    <td className="text-center">
                       <span className={`badge ${ROLE_BADGE[u.role] || ''}`}>{ROLE_TH[u.role] || u.role}</span>
                    </td>
                    <td className="text-center">
                      <div className="status-container j-center">
                        <span className={`status-tag st-${u.status?.toLowerCase() || 'pending'}`}>
                          {STATUS_TH[u.status] ?? u.status}
                        </span>
                      </div>
                    </td>
                    <td className="text-right">
                      <div className="row-actions justify-end">
                        <button
                          className={`btn-icon ${u.status === 'SUSPENDED' ? 'success' : 'danger'}`}
                          onClick={() => toggleSuspend(u)}
                          title={u.status === 'SUSPENDED' ? 'เปิดใช้งาน' : 'ระงับการใช้งาน'}
                        >
                          {u.status === 'SUSPENDED' ? <ShieldCheck size={16} /> : <ShieldOff size={16} />}
                        </button>
                      </div>
                    </td>
                  </motion.tr>
                ))}
              </tbody>
            </table>
            {users.length === 0 && (
                <div className="empty-state-full">
                    <Info size={40} />
                    <p>ไม่พบรายชื่อผู้ใช้ที่ต้องการตามเงื่อนไขที่กำหนด</p>
                </div>
            )}
          </div>
          <Pagination 
            currentPage={page} 
            lastPage={lastPage} 
            onPageChange={setPage} 
          />
        </>
      )}
    </div>
  );
}
