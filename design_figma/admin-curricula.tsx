import { useState } from 'react';
import { useNavigate } from 'react-router';
import { Search, FileText, ChevronRight, Filter, Eye, Edit2 } from 'lucide-react';
import { mockCurricula, faculties, departments, getFacultyName, getDeptName, type CurriculumInfo } from './admin-shared';

const statusConfig: Record<string, { label: string; color: string }> = {
  active: { label: 'ใช้งาน', color: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400' },
  draft: { label: 'ร่าง', color: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400' },
  archived: { label: 'เก็บถาวร', color: 'bg-muted text-muted-foreground' },
};

export function AdminCurricula() {
  const navigate = useNavigate();
  const [facultyFilter, setFacultyFilter] = useState<string>('all');
  const [deptFilter, setDeptFilter] = useState<string>('all');
  const [searched, setSearched] = useState(false);

  const availableDepts = facultyFilter === 'all'
    ? departments
    : departments.filter(d => d.facultyId === facultyFilter);

  const handleSearch = () => {
    setSearched(true);
  };

  const filteredCurricula = mockCurricula.filter(c => {
    if (!searched) return false;
    const matchFac = facultyFilter === 'all' || c.facultyId === facultyFilter;
    const matchDept = deptFilter === 'all' || c.deptId === deptFilter;
    return matchFac && matchDept;
  });

  return (
    <div className="p-6 lg:p-8 space-y-6 max-w-5xl mx-auto">
      <div>
        <h1 className="text-[24px]">ค้นหาหลักสูตร</h1>
        <p className="text-[14px] text-muted-foreground mt-1">เลือกคณะและภาควิชาเพื่อค้นหาหลักสูตร</p>
      </div>

      {/* Search Filters */}
      <div className="bg-card rounded-2xl border border-border p-6">
        <div className="flex items-center gap-2 mb-4">
          <Filter className="w-5 h-5 text-primary" />
          <h3 className="text-[16px]">ตัวกรอง</h3>
        </div>
        <div className="grid sm:grid-cols-2 gap-4 mb-4">
          <div>
            <label className="text-[13px] text-muted-foreground mb-1 block">คณะ</label>
            <select
              value={facultyFilter}
              onChange={e => { setFacultyFilter(e.target.value); setDeptFilter('all'); setSearched(false); }}
              className="w-full px-4 py-3 rounded-xl border-2 border-border bg-accent/30 focus:border-primary outline-none text-[14px] appearance-none cursor-pointer"
            >
              <option value="all">ทั้งหมด</option>
              {faculties.map(f => (
                <option key={f.id} value={f.id}>{f.name}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="text-[13px] text-muted-foreground mb-1 block">ภาควิชา</label>
            <select
              value={deptFilter}
              onChange={e => { setDeptFilter(e.target.value); setSearched(false); }}
              className="w-full px-4 py-3 rounded-xl border-2 border-border bg-accent/30 focus:border-primary outline-none text-[14px] appearance-none cursor-pointer"
            >
              <option value="all">ทั้งหมด</option>
              {availableDepts.map(d => (
                <option key={d.id} value={d.id}>{d.name}</option>
              ))}
            </select>
          </div>
        </div>
        <button
          onClick={handleSearch}
          className="flex items-center gap-2 px-6 py-3 rounded-xl bg-primary text-primary-foreground hover:bg-primary/90 transition-all"
        >
          <Search className="w-5 h-5" />
          ค้นหาหลักสูตร
        </button>
      </div>

      {/* Results */}
      {searched && (
        <div className="space-y-3">
          <p className="text-[14px] text-muted-foreground">
            พบ {filteredCurricula.length} หลักสูตร
            {facultyFilter !== 'all' && ` — ${getFacultyName(facultyFilter)}`}
            {deptFilter !== 'all' && ` / ${getDeptName(deptFilter)}`}
          </p>
          {filteredCurricula.length === 0 && (
            <div className="bg-card rounded-2xl border border-border p-12 text-center">
              <FileText className="w-12 h-12 text-muted-foreground mx-auto mb-3" />
              <p className="text-[14px] text-muted-foreground">ไม่พบหลักสูตรที่ตรงกับเงื่อนไข</p>
            </div>
          )}
          {filteredCurricula.map(cur => {
            const st = statusConfig[cur.status];
            return (
              <div
                key={cur.id}
                className="bg-card rounded-2xl border border-border p-5 hover:shadow-lg hover:border-primary/30 transition-all"
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="flex items-start gap-4 min-w-0">
                    <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
                      <FileText className="w-6 h-6 text-primary" />
                    </div>
                    <div className="min-w-0">
                      <h3 className="text-[16px]">{cur.name} พ.ศ. {cur.year}</h3>
                      <p className="text-[13px] text-muted-foreground">{cur.nameEn}</p>
                      <div className="flex items-center gap-3 mt-2 text-[12px] text-muted-foreground flex-wrap">
                        <span>{getFacultyName(cur.facultyId)}</span>
                        <span>•</span>
                        <span>{getDeptName(cur.deptId)}</span>
                        <span>•</span>
                        <span>{cur.totalCredits} หน่วยกิต</span>
                        <span className={`px-2 py-0.5 rounded-full text-[11px] ${st.color}`}>
                          {st.label}
                        </span>
                      </div>
                    </div>
                  </div>
                  <div className="flex gap-2 shrink-0">
                    <button
                      onClick={() => navigate(`/admin/curricula/${cur.id}`)}
                      className="flex items-center gap-1.5 px-4 py-2 rounded-xl border-2 border-border hover:bg-accent transition-all text-[13px]"
                    >
                      <Eye className="w-4 h-4" />
                      ดูโฟลว์
                    </button>
                    <button
                      onClick={() => navigate(`/admin/curricula/${cur.id}/edit`)}
                      className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-primary text-primary-foreground hover:bg-primary/90 transition-all text-[13px]"
                    >
                      <Edit2 className="w-4 h-4" />
                      แก้ไข
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
