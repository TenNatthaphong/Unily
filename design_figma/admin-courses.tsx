import { useState, useEffect, useCallback, useMemo } from 'react';
import { useNavigate } from 'react-router';
import {
  Search, Plus, Edit2, Trash2, X, Filter, Cloud, Loader2, RefreshCw, Eye,
  BookOpen, ChevronRight, CloudOff, Save
} from 'lucide-react';
import { getCategoryLabel, getCategoryColor, type Course, type CourseCategory } from '../mock-data';
import { fetchAllCurriculumData } from './curriculum-api';
import { faculties, departments, getFacultyName, getDeptName } from './admin-shared';

export function AdminCourses() {
  const navigate = useNavigate();
  const [courses, setCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<CourseCategory | 'all'>('all');
  const [facultyFilter, setFacultyFilter] = useState('all');
  const [deptFilter, setDeptFilter] = useState('all');
  const [showModal, setShowModal] = useState(false);
  const [editingCourse, setEditingCourse] = useState<Course | null>(null);

  const loadCourses = useCallback(async () => {
    setLoading(true); setError(null);
    try {
      const data = await fetchAllCurriculumData();
      // Exclude wildcard
      const nonWild = data.courses.filter(c => !c.isWildcard);
      setCourses(nonWild);
      console.log(`Loaded ${nonWild.length} courses (excl wildcard)`);
    } catch (err) {
      setError(`${err}`);
      console.error('Failed to load courses:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { loadCourses(); }, [loadCourses]);

  const filtered = useMemo(() => {
    return courses.filter(c => {
      const q = search.toLowerCase();
      const matchSearch = c.id.toLowerCase().includes(q) || c.nameEn.toLowerCase().includes(q) || c.nameTh.includes(search);
      const matchCat = categoryFilter === 'all' || c.category === categoryFilter;
      return matchSearch && matchCat;
    });
  }, [courses, search, categoryFilter]);

  const handleDelete = (id: string) => {
    setCourses(prev => prev.filter(c => c.id !== id));
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full min-h-[400px]">
        <div className="text-center space-y-3">
          <div className="relative"><div className="w-14 h-14 border-4 border-primary/20 border-t-primary rounded-full animate-spin mx-auto" /><Cloud className="w-5 h-5 text-primary absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2" /></div>
          <p className="text-[14px]">กำลังโหลดรายวิชาจาก Supabase...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-full min-h-[400px]">
        <div className="text-center space-y-3">
          <CloudOff className="w-12 h-12 text-red-500 mx-auto" />
          <p className="text-[14px]">{error}</p>
          <button onClick={loadCourses} className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-primary text-primary-foreground text-[13px]"><RefreshCw className="w-4 h-4" />ลองใหม่</button>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 lg:p-8 space-y-6 max-w-7xl mx-auto">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-[24px]">รายวิชาทั้งหมด</h1>
          <p className="text-[14px] text-muted-foreground mt-1 flex items-center gap-1">
            <Cloud className="w-3.5 h-3.5 text-emerald-500" />
            {courses.length} วิชาจาก Supabase (ไม่รวม wildcard)
          </p>
        </div>
        <button
          onClick={() => { setEditingCourse(null); setShowModal(true); }}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-primary text-primary-foreground hover:bg-primary/90 transition-all"
        >
          <Plus className="w-5 h-5" />
          เพิ่มวิชา
        </button>
      </div>

      {/* Filters */}
      <div className="bg-card rounded-2xl border border-border p-4">
        <div className="flex items-center gap-2 mb-3">
          <Filter className="w-4 h-4 text-primary" />
          <span className="text-[14px]">ตัวกรอง</span>
        </div>
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
            <input
              type="text"
              placeholder="ค้นหารหัสวิชา, ชื่อ..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="w-full pl-12 pr-4 py-2.5 rounded-xl bg-accent/50 border-2 border-border focus:border-primary transition-all outline-none text-[14px]"
            />
          </div>
          <select
            value={facultyFilter}
            onChange={e => setFacultyFilter(e.target.value)}
            className="px-4 py-2.5 rounded-xl border-2 border-border bg-accent/30 focus:border-primary outline-none text-[13px] min-w-[180px]"
          >
            <option value="all">คณะทั้งหมด</option>
            {faculties.map(f => <option key={f.id} value={f.id}>{f.name}</option>)}
          </select>
          <select
            value={deptFilter}
            onChange={e => setDeptFilter(e.target.value)}
            className="px-4 py-2.5 rounded-xl border-2 border-border bg-accent/30 focus:border-primary outline-none text-[13px] min-w-[220px]"
          >
            <option value="all">ภาควิชาทั้งหมด</option>
            {departments.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
          </select>
        </div>
        <div className="flex gap-1.5 mt-3 flex-wrap">
          {(['all', 'required', 'elective', 'general', 'free'] as const).map(cat => (
            <button
              key={cat}
              onClick={() => setCategoryFilter(cat)}
              className={`px-3 py-1.5 rounded-full text-[12px] border transition-all ${
                categoryFilter === cat
                  ? 'bg-primary text-primary-foreground border-primary'
                  : 'border-border hover:bg-accent'
              }`}
            >
              {cat === 'all' ? 'ทั้งหมด' : getCategoryLabel(cat)}
            </button>
          ))}
        </div>
      </div>

      {/* Course Table */}
      <div className="bg-card rounded-2xl border border-border overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-border bg-accent/30">
                <th className="text-left px-5 py-3 text-[12px] text-muted-foreground">รหัสวิชา</th>
                <th className="text-left px-5 py-3 text-[12px] text-muted-foreground">ชื่อวิชา</th>
                <th className="text-left px-5 py-3 text-[12px] text-muted-foreground hidden md:table-cell">หน่วยกิต</th>
                <th className="text-left px-5 py-3 text-[12px] text-muted-foreground hidden lg:table-cell">ประเภท</th>
                <th className="text-left px-5 py-3 text-[12px] text-muted-foreground w-32">จัดการ</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map(course => (
                <tr key={course.id} className="border-b border-border/50 hover:bg-accent/20 transition-colors group">
                  <td className="px-5 py-3">
                    <span className="text-[14px] text-primary">{course.id}</span>
                  </td>
                  <td className="px-5 py-3">
                    <p className="text-[14px]">{course.nameEn}</p>
                    <p className="text-[12px] text-muted-foreground">{course.nameTh}</p>
                  </td>
                  <td className="px-5 py-3 hidden md:table-cell text-[13px]">
                    {course.credits}({course.lectureHours}-{course.labHours}-{course.selfStudyHours})
                  </td>
                  <td className="px-5 py-3 hidden lg:table-cell">
                    <span className={`text-[11px] px-2.5 py-1 rounded-full ${getCategoryColor(course.category)}`}>
                      {getCategoryLabel(course.category)}
                    </span>
                  </td>
                  <td className="px-5 py-3">
                    <div className="flex gap-1.5">
                      <button
                        onClick={() => navigate(`/admin/courses/${course.id}`)}
                        className="p-2 rounded-lg hover:bg-accent text-primary transition-colors"
                        title="ดูรายละเอียด"
                      >
                        <Eye className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => { setEditingCourse(course); setShowModal(true); }}
                        className="p-2 rounded-lg hover:bg-accent text-primary transition-colors"
                        title="แก้ไข"
                      >
                        <Edit2 className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleDelete(course.id)}
                        className="p-2 rounded-lg hover:bg-destructive/10 text-destructive transition-colors"
                        title="ลบ"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {filtered.length === 0 && (
                <tr><td colSpan={5} className="text-center py-12 text-muted-foreground text-[14px]">ไม่พบรายวิชา</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add/Edit Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" onClick={() => setShowModal(false)}>
          <div className="bg-card rounded-2xl p-6 w-full max-w-lg border border-border" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-[18px]">{editingCourse ? 'แก้ไขวิชา' : 'เพิ่มวิชาใหม่'}</h3>
              <button onClick={() => setShowModal(false)} className="p-2 rounded-lg hover:bg-accent"><X className="w-5 h-5" /></button>
            </div>
            <div className="space-y-4">
              <div>
                <label className="text-[13px] text-muted-foreground">รหัสวิชา</label>
                <input defaultValue={editingCourse?.id} className="w-full mt-1 px-4 py-2.5 rounded-xl border-2 border-border bg-accent/30 focus:border-primary outline-none text-[14px]" placeholder="เช่น CS101" />
              </div>
              <div>
                <label className="text-[13px] text-muted-foreground">ชื่อวิชา (EN)</label>
                <input defaultValue={editingCourse?.nameEn} className="w-full mt-1 px-4 py-2.5 rounded-xl border-2 border-border bg-accent/30 focus:border-primary outline-none text-[14px]" placeholder="Course name" />
              </div>
              <div>
                <label className="text-[13px] text-muted-foreground">ชื่อวิชา (TH)</label>
                <input defaultValue={editingCourse?.nameTh} className="w-full mt-1 px-4 py-2.5 rounded-xl border-2 border-border bg-accent/30 focus:border-primary outline-none text-[14px]" placeholder="ชื่อภาษาไทย" />
              </div>
              <div className="grid grid-cols-4 gap-3">
                <div><label className="text-[12px] text-muted-foreground">หน่วยกิต</label><input defaultValue={editingCourse?.credits || 3} type="number" className="w-full mt-1 px-3 py-2 rounded-xl border-2 border-border bg-accent/30 focus:border-primary outline-none text-[14px]" /></div>
                <div><label className="text-[12px] text-muted-foreground">บรรยาย</label><input defaultValue={editingCourse?.lectureHours || 0} type="number" className="w-full mt-1 px-3 py-2 rounded-xl border-2 border-border bg-accent/30 focus:border-primary outline-none text-[14px]" /></div>
                <div><label className="text-[12px] text-muted-foreground">ปฏิบัติ</label><input defaultValue={editingCourse?.labHours || 0} type="number" className="w-full mt-1 px-3 py-2 rounded-xl border-2 border-border bg-accent/30 focus:border-primary outline-none text-[14px]" /></div>
                <div><label className="text-[12px] text-muted-foreground">ศึกษาเอง</label><input defaultValue={editingCourse?.selfStudyHours || 0} type="number" className="w-full mt-1 px-3 py-2 rounded-xl border-2 border-border bg-accent/30 focus:border-primary outline-none text-[14px]" /></div>
              </div>
              <button onClick={() => setShowModal(false)} className="w-full py-3 rounded-xl bg-primary text-primary-foreground hover:bg-primary/90 transition-all flex items-center justify-center gap-2">
                <Save className="w-4 h-4" />
                {editingCourse ? 'บันทึกการแก้ไข' : 'เพิ่มวิชา'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
