import { useState, useMemo } from 'react';
import { useSearchParams } from 'react-router';
import { Search, User, Shield, GraduationCap, UserCheck, Mail, Eye, ChevronDown } from 'lucide-react';
import { mockAllUsersDetailed, type AdminUserRecord } from './admin-shared';

const roleConfig = {
  student: { label: 'นักศึกษา', icon: <GraduationCap className="w-4 h-4" />, color: 'text-primary', bg: 'bg-primary/10' },
  professor: { label: 'อาจารย์', icon: <UserCheck className="w-4 h-4" />, color: 'text-emerald-600 dark:text-emerald-400', bg: 'bg-emerald-100 dark:bg-emerald-900/30' },
  admin: { label: 'ผู้ดูแลระบบ', icon: <Shield className="w-4 h-4" />, color: 'text-amber-600 dark:text-amber-400', bg: 'bg-amber-100 dark:bg-amber-900/30' },
};

export function AdminUsers() {
  const [searchParams, setSearchParams] = useSearchParams();
  const initialRole = searchParams.get('role') ?? 'all';
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState<string>(initialRole);
  const [selectedUser, setSelectedUser] = useState<AdminUserRecord | null>(null);

  const filtered = useMemo(() => {
    return mockAllUsersDetailed.filter(u => {
      const q = search.toLowerCase();
      const matchSearch = u.name.includes(search) || u.name.toLowerCase().includes(q) || u.username.includes(q) || u.email.includes(q);
      const matchRole = roleFilter === 'all' || u.role === roleFilter;
      return matchSearch && matchRole;
    });
  }, [search, roleFilter]);

  const handleRoleFilter = (r: string) => {
    setRoleFilter(r);
    if (r === 'all') {
      searchParams.delete('role');
    } else {
      searchParams.set('role', r);
    }
    setSearchParams(searchParams);
  };

  const roleCounts = useMemo(() => ({
    all: mockAllUsersDetailed.length,
    student: mockAllUsersDetailed.filter(u => u.role === 'student').length,
    professor: mockAllUsersDetailed.filter(u => u.role === 'professor').length,
    admin: mockAllUsersDetailed.filter(u => u.role === 'admin').length,
  }), []);

  return (
    <div className="p-6 lg:p-8 space-y-6 max-w-7xl mx-auto">
      <div>
        <h1 className="text-[24px]">ฐานข้อมูลผู้ใช้</h1>
        <p className="text-[14px] text-muted-foreground mt-1">ดูข้อมูลผู้ใช้ทั้งหมดในระบบ (Mock Data)</p>
      </div>

      {/* Role tabs */}
      <div className="flex gap-2 flex-wrap">
        {(['all', 'student', 'professor', 'admin'] as const).map(r => {
          const count = roleCounts[r];
          return (
            <button
              key={r}
              onClick={() => handleRoleFilter(r)}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-[13px] border-2 transition-all ${
                roleFilter === r
                  ? 'bg-primary text-primary-foreground border-primary shadow-md'
                  : 'border-border hover:bg-accent'
              }`}
            >
              {r === 'all' ? <User className="w-4 h-4" /> : roleConfig[r].icon}
              {r === 'all' ? 'ทั้งหมด' : roleConfig[r].label}
              <span className={`text-[11px] px-1.5 py-0.5 rounded-full ${
                roleFilter === r ? 'bg-white/20' : 'bg-accent'
              }`}>{count}</span>
            </button>
          );
        })}
      </div>

      {/* Search */}
      <div className="relative max-w-md">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
        <input
          type="text"
          placeholder="ค้นหาชื่อ, username, email..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          className="w-full pl-12 pr-4 py-3 rounded-2xl bg-accent/50 border-2 border-border focus:border-primary transition-all outline-none text-[14px]"
        />
      </div>

      {/* User Table */}
      <div className="bg-card rounded-2xl border border-border overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-border bg-accent/30">
                <th className="text-left px-5 py-3 text-[12px] text-muted-foreground">ผู้ใช้</th>
                <th className="text-left px-5 py-3 text-[12px] text-muted-foreground">บทบาท</th>
                <th className="text-left px-5 py-3 text-[12px] text-muted-foreground hidden md:table-cell">คณะ/ภาค</th>
                <th className="text-left px-5 py-3 text-[12px] text-muted-foreground hidden lg:table-cell">สถานะ</th>
                <th className="text-left px-5 py-3 text-[12px] text-muted-foreground w-20"></th>
              </tr>
            </thead>
            <tbody>
              {filtered.map(user => {
                const config = roleConfig[user.role];
                return (
                  <tr key={user.id} className="border-b border-border/50 hover:bg-accent/20 transition-colors">
                    <td className="px-5 py-3">
                      <div className="flex items-center gap-3">
                        <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${config.bg} ${config.color}`}>
                          <span className="text-[13px]">{user.name.slice(0, 2)}</span>
                        </div>
                        <div className="min-w-0">
                          <p className="text-[14px] truncate">{user.name}</p>
                          <p className="text-[11px] text-muted-foreground truncate flex items-center gap-1">
                            <Mail className="w-3 h-3" />
                            {user.email}
                          </p>
                        </div>
                      </div>
                    </td>
                    <td className="px-5 py-3">
                      <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] ${config.bg} ${config.color}`}>
                        {config.icon}
                        {config.label}
                      </span>
                    </td>
                    <td className="px-5 py-3 hidden md:table-cell">
                      <p className="text-[12px] text-muted-foreground">{user.faculty ?? '—'}</p>
                      <p className="text-[11px] text-muted-foreground/70">{user.department ?? ''}</p>
                    </td>
                    <td className="px-5 py-3 hidden lg:table-cell">
                      <span className={`text-[11px] px-2 py-0.5 rounded-full ${
                        user.status === 'active'
                          ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400'
                          : 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400'
                      }`}>
                        {user.status === 'active' ? 'ใช้งาน' : 'ระงับ'}
                      </span>
                    </td>
                    <td className="px-5 py-3">
                      <button
                        onClick={() => setSelectedUser(user)}
                        className="p-2 rounded-lg hover:bg-accent text-primary transition-colors"
                      >
                        <Eye className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                );
              })}
              {filtered.length === 0 && (
                <tr>
                  <td colSpan={5} className="text-center py-12 text-muted-foreground text-[14px]">
                    ไม่พบผู้ใช้ที่ตรงกับการค้นหา
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* User Detail Modal */}
      {selectedUser && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" onClick={() => setSelectedUser(null)}>
          <div className="bg-card rounded-2xl p-6 w-full max-w-md border border-border" onClick={e => e.stopPropagation()}>
            <div className="text-center mb-6">
              <div className={`w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-3 ${roleConfig[selectedUser.role].bg} ${roleConfig[selectedUser.role].color}`}>
                <span className="text-[20px]">{selectedUser.name.slice(0, 2)}</span>
              </div>
              <h3 className="text-[18px]">{selectedUser.name}</h3>
              <p className="text-[13px] text-muted-foreground">{selectedUser.email}</p>
            </div>
            <div className="space-y-3 text-[13px]">
              <div className="flex justify-between py-2 border-b border-border/50">
                <span className="text-muted-foreground">Username</span>
                <span>{selectedUser.username}</span>
              </div>
              <div className="flex justify-between py-2 border-b border-border/50">
                <span className="text-muted-foreground">บทบาท</span>
                <span className={`inline-flex items-center gap-1 ${roleConfig[selectedUser.role].color}`}>
                  {roleConfig[selectedUser.role].icon}
                  {roleConfig[selectedUser.role].label}
                </span>
              </div>
              {selectedUser.faculty && (
                <div className="flex justify-between py-2 border-b border-border/50">
                  <span className="text-muted-foreground">คณะ</span>
                  <span>{selectedUser.faculty}</span>
                </div>
              )}
              {selectedUser.department && (
                <div className="flex justify-between py-2 border-b border-border/50">
                  <span className="text-muted-foreground">ภาควิชา</span>
                  <span>{selectedUser.department}</span>
                </div>
              )}
              {selectedUser.year && (
                <div className="flex justify-between py-2 border-b border-border/50">
                  <span className="text-muted-foreground">ชั้นปี</span>
                  <span>ปี {selectedUser.year}</span>
                </div>
              )}
              <div className="flex justify-between py-2">
                <span className="text-muted-foreground">สถานะ</span>
                <span className={selectedUser.status === 'active' ? 'text-emerald-600' : 'text-red-500'}>
                  {selectedUser.status === 'active' ? 'ใช้งาน' : 'ระงับ'}
                </span>
              </div>
            </div>
            <button
              onClick={() => setSelectedUser(null)}
              className="w-full mt-6 py-3 rounded-xl border-2 border-border hover:bg-accent transition-colors text-[14px]"
            >
              ปิด
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
