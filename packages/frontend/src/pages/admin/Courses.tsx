import { useState, useEffect, useCallback, useRef } from 'react';
import Portal from '../../components/ui/Portal';
import { courseApi } from '../../api/course.api';
import { adminApi } from '../../api/admin.api';
import { facultyApi } from '../../api/faculty.api';
import { departmentApi } from '../../api/department.api';
import { Select } from '../../components/ui/Select';
import Pagination from '../../components/ui/Pagination';
import type { Course, Faculty, Department, CourseCategory } from '../../types';
import { 
  Plus, Pencil, Trash2, Loader2, BookOpen, 
  Search, Upload, Layers, School, Building, Check
} from 'lucide-react';
import { toast } from 'react-hot-toast';
import './Courses.css';

const CATEGORIES: CourseCategory[] = [
  'GENERAL_EDUCATION', 'CORE_COURSE', 'REQUIRED_COURSE',
  'MAJOR_ELECTIVE', 'FREE_ELECTIVE', 'COOP_COURSE',
];


const CAT_LABELS_TH: Record<CourseCategory, string> = {
  GENERAL_EDUCATION: 'ศึกษาทั่วไป',
  CORE_COURSE: 'วิชาแกน',
  REQUIRED_COURSE: 'วิชาบังคับ',
  MAJOR_ELECTIVE: 'วิชาเลือก',
  FREE_ELECTIVE: 'เสรี',
  COOP_COURSE: 'สหกิจ',
};

type FormData = Omit<Course, 'id' | 'prerequisites' | 'sections'>;

const emptyForm: Partial<FormData> = {
  courseCode: '', nameTh: '', nameEn: '', credits: 3,
  lectureHours: 3, labHours: 0, selfStudyHours: 6,
  category: 'REQUIRED_COURSE', isWildcard: false,
  facultyId: '', deptId: '',
};

export default function AdminCourses() {
  const [courses, setCourses] = useState<Course[]>([]);
  const [faculties, setFaculties] = useState<Faculty[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [page, setPage] = useState(1);
  const [lastPage, setLastPage] = useState(1);
  const [search, setSearch] = useState('');
  const [filterFaculty, setFilterFaculty] = useState('');
  const [filterCategory, setFilterCategory] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingCourse, setEditingCourse] = useState<Course | null>(null);
  const [form, setForm] = useState<Partial<FormData>>(emptyForm);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isImporting, setIsImporting] = useState(false);

  useEffect(() => {
    facultyApi.getAll().then(r => setFaculties(r.data));
  }, []);

  useEffect(() => {
    if (form.facultyId) {
      departmentApi.getByFaculty(form.facultyId).then(r => setDepartments(r.data));
    } else {
      setDepartments([]);
    }
  }, [form.facultyId]);

  const fetchCourses = useCallback(async () => {
    setIsLoading(true);
    try {
      const r = await courseApi.search({
        search,
        facultyId: filterFaculty || undefined,
        category: filterCategory || undefined,
        page,
        limit: 15,
      });
      setCourses(r.data.data);
      setLastPage(r.data.meta.lastPage);
    } catch { toast.error('โหลดข้อมูลไม่สำเร็จ'); }
    finally { setIsLoading(false); }
  }, [search, filterFaculty, filterCategory, page]);

  useEffect(() => { fetchCourses(); }, [fetchCourses]);

  const openAdd = () => { setEditingCourse(null); setForm(emptyForm); setShowModal(true); };
  const openEdit = (c: Course) => {
    setEditingCourse(c);
    setForm({
      courseCode: c.courseCode, nameTh: c.nameTh, nameEn: c.nameEn,
      credits: c.credits, lectureHours: c.lectureHours, labHours: c.labHours,
      selfStudyHours: c.selfStudyHours, category: c.category, isWildcard: c.isWildcard,
      facultyId: c.facultyId, deptId: c.deptId,
    });
    setShowModal(true);
  };

  const submit = async () => {
    if (!form.courseCode || !form.nameTh || !form.facultyId || !form.deptId) {
      toast.error('กรุณากรอกข้อมูลให้ครบถ้วน');
      return;
    }
    try {
      if (editingCourse) {
        const r = await courseApi.update(editingCourse.id, form);
        setCourses(p => p.map(c => c.id === editingCourse.id ? r.data : c));
        toast.success('อัปเดตรายวิชาสำเร็จ');
      } else {
        await courseApi.create(form);
        toast.success('สร้างรายวิชาสำเร็จ');
        setPage(1);
        fetchCourses();
      }
      setShowModal(false);
    } catch { toast.error('ดำเนินการไม่สำเร็จ'); }
  };

  const deleteCourse = async (id: string) => {
    if (!confirm('ยืนยันการลบรายวิชานี้?')) return;
    try {
      await courseApi.delete(id);
      setCourses(p => p.filter(c => c.id !== id));
      toast.success('ลบรายวิชาสำเร็จ');
    } catch { toast.error('ลบไม่สำเร็จ'); }
  };

  const handleImportCsv = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    setIsImporting(true);
    const toastId = toast.loading('กำลังนำเข้าข้อมูล...');
    try {
      await adminApi.importCoursesCsv(file);
      toast.success('นำเข้าข้อมูลสำเร็จ', { id: toastId });
      fetchCourses();
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'นำเข้าข้อมูลไม่สำเร็จ', { id: toastId });
    } finally {
      setIsImporting(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  return (
    <div className="admin-page animate-fade-in">
      <div className="page-header">
        <div className="page-title">
          <BookOpen size={24} />
          <h1>รายวิชา</h1>
          <span className="badge">{courses.length} รายการในหน้านี้</span>
        </div>
        <div className="header-actions" style={{ display: 'flex', gap: '12px' }}>
          <input 
            type="file" 
            ref={fileInputRef} 
            onChange={handleImportCsv} 
            accept=".csv" 
            style={{ display: 'none' }} 
          />
          <button 
            className="btn btn-import" 
            onClick={() => fileInputRef.current?.click()}
            disabled={isImporting}
          >
            {isImporting ? <Loader2 size={16} className="spin" /> : <Upload size={16} />}
            นำเข้า CSV
          </button>
          <button className="btn btn-primary" onClick={openAdd} style={{ padding: '8px 24px' }}>
            <Plus size={16} /> เพิ่มรายวิชา
          </button>
        </div>
      </div>

      <div className="page-filters glass-card">
        <div className="search-box">
          <Search size={16} />
          <input 
            placeholder="ค้นหารหัสหรือชื่อวิชา..." 
            value={search}
            onChange={e => { setSearch(e.target.value); setPage(1); }} 
          />
        </div>
        <div className="filter-group">
          <Select
            placeholder="ทุกคณะ"
            value={filterFaculty}
            onChange={v => { setFilterFaculty(v); setPage(1); }}
            autoWidth
            options={[
              { value: '', label: 'ทุกคณะ' },
              ...faculties.map(f => ({ value: f.id, label: f.nameTh || f.nameEn }))
            ]}
          />
        </div>
      </div>

      <div className="cat-filter-pills">
        <button
          className={`cat-pill ${filterCategory === '' ? 'active' : ''}`}
          onClick={() => { setFilterCategory(''); setPage(1); }}
        >
          ทั้งหมด
        </button>
        {CATEGORIES.map(cat => (
          <button
            key={cat}
            className={`cat-pill ${filterCategory === cat ? 'active' : ''}`}
            onClick={() => { setFilterCategory(cat); setPage(1); }}
          >
            {CAT_LABELS_TH[cat]}
          </button>
        ))}
      </div>

      {isLoading ? (
        <div className="loading-state"><Loader2 className="spin" size={32} /></div>
      ) : (
        <>
          <div className="card table-card">
            <div className="data-table-wrapper">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>รหัสวิชา</th>
                    <th>ชื่อรายวิชา</th>
                    <th className="text-center">หน่วยกิต</th>
                    <th className="text-center">หมวดหมู่</th>
                    <th className="text-center">Wildcard</th>
                    <th className="text-right">จัดการ</th>
                  </tr>
                </thead>
                <tbody>
                  {courses.map(c => (
                    <tr key={c.id}>
                      <td><span className="code-badge">{c.courseCode}</span></td>
                      <td>
                        <div className="course-name-stack">
                          <span className="name-th">{c.nameTh}</span>
                          <span className="name-en">{c.nameEn}</span>
                        </div>
                      </td>
                      <td className="text-center">
                        <span className="credits-display">
                          {c.credits} ({c.lectureHours}-{c.labHours}-{c.selfStudyHours})
                        </span>
                      </td>
                      <td className="text-center">
                        <span className={`cat-tag cat-${c.category.toLowerCase()}`}>
                          {CAT_LABELS_TH[c.category]}
                        </span>
                      </td>
                      <td className="text-center">
                        {c.isWildcard ? <span className="wildcard-check">✓</span> : <span className="text-muted">—</span>}
                      </td>
                      <td>
                        <div className="row-actions justify-end">
                          <button className="btn-icon edit" onClick={() => openEdit(c)} title="แก้ไข">
                            <Pencil size={14} />
                          </button>
                          <button className="btn-icon delete" onClick={() => deleteCourse(c.id)} title="ลบ">
                            <Trash2 size={14} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                  {courses.length === 0 && (
                    <tr>
                      <td colSpan={6} className="empty-row">ไม่พบข้อมูลรายวิชา</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
          
          <Pagination 
            currentPage={page} 
            lastPage={lastPage} 
            onPageChange={setPage} 
          />
        </>
      )}

      {showModal && (
        <Portal>
          <div className="modal-overlay" onClick={() => setShowModal(false)}>
            <div className="modal modal-lg animate-pop-in" onClick={e => e.stopPropagation()}>
              <div className="modal-header">
                <div>
                  <h3>{editingCourse ? 'แก้ไขรายวิชา' : 'เพิ่มรายวิชาใหม่'}</h3>
                  <p className="modal-subtitle">กรอกข้อมูลรายละเอียดของรายวิชาให้ครบถ้วน</p>
                </div>
                <button className="btn-close" onClick={() => setShowModal(false)}>×</button>
              </div>

              <div className="modal-content">
                <div className="form-grid-2">
                  <div className="form-group">
                    <label><School size={14} /> รหัสวิชา</label>
                    <input 
                      placeholder="เช่น 040613101"
                      value={form.courseCode} 
                      onChange={e => setForm(p => ({ ...p, courseCode: e.target.value }))} 
                    />
                  </div>
                  <div className="form-group">
                    <label><Layers size={14} /> หน่วยกิต</label>
                    <input 
                      type="number" 
                      value={form.credits} 
                      onChange={e => setForm(p => ({ ...p, credits: +e.target.value }))} 
                    />
                  </div>
                  
                  <div className="form-group span-2">
                    <label>หมวดหมู่รายวิชา</label>
                    <div className="cat-selector">
                      {CATEGORIES.map(cat => (
                        <button 
                          key={cat} 
                          type="button"
                          className={`cat-option ${form.category === cat ? 'selected' : ''}`}
                          onClick={() => setForm(p => ({ ...p, category: cat as CourseCategory }))}
                        >
                          {CAT_LABELS_TH[cat]}
                          {form.category === cat && <Check size={14} />}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="form-group span-2">
                    <label>ชื่อรายวิชา (ภาษาไทย)</label>
                    <input 
                      placeholder="เช่น คณิตศาสตร์วิศวกรรม"
                      value={form.nameTh} 
                      onChange={e => setForm(p => ({ ...p, nameTh: e.target.value }))} 
                    />
                  </div>
                  <div className="form-group span-2">
                    <label>ชื่อรายวิชา (ภาษาอังกฤษ)</label>
                    <input 
                      placeholder="เช่น Engineering Mathematics"
                      value={form.nameEn} 
                      onChange={e => setForm(p => ({ ...p, nameEn: e.target.value }))} 
                    />
                  </div>

                  <div className="form-group span-2">
                    <label>โครงสร้างหน่วยกิต (บรรยาย - ปฏิบัติ - ศึกษาด้วยตนเอง)</label>
                    <div className="hours-grid">
                      <div className="hour-input">
                        <span>บรรยาย</span>
                        <input type="number" value={form.lectureHours} onChange={e => setForm(p => ({ ...p, lectureHours: +e.target.value }))} />
                      </div>
                      <div className="hour-input">
                        <span>ปฏิบัติ</span>
                        <input type="number" value={form.labHours} onChange={e => setForm(p => ({ ...p, labHours: +e.target.value }))} />
                      </div>
                      <div className="hour-input">
                        <span>ศึกษาเอง</span>
                        <input type="number" value={form.selfStudyHours} onChange={e => setForm(p => ({ ...p, selfStudyHours: +e.target.value }))} />
                      </div>
                    </div>
                  </div>

                  <div className="form-group">
                    <label><Building size={14} /> คณะ</label>
                    <Select
                      placeholder="เลือกคณะ..."
                      value={form.facultyId || ''}
                      onChange={v => setForm(p => ({ ...p, facultyId: v, deptId: '' }))}
                      options={faculties.map(f => ({ value: f.id, label: f.nameTh || f.nameEn }))}
                    />
                  </div>
                  <div className="form-group">
                    <label><Building size={14} /> ภาควิชา</label>
                    <Select
                      placeholder="เลือกภาควิชา..."
                      disabled={!form.facultyId}
                      value={form.deptId || ''}
                      onChange={v => setForm(p => ({ ...p, deptId: v }))}
                      options={departments.map(d => ({ value: d.id, label: d.nameTh || d.nameEn }))}
                    />
                  </div>

                  <div className="form-group span-2">
                    <label className="checkbox-row">
                      <input 
                        type="checkbox" 
                        checked={form.isWildcard} 
                        onChange={e => setForm(p => ({ ...p, isWildcard: e.target.checked }))} 
                      />
                      <span>กำหนดเป็นวิชา Wildcard (ใช้เป็นตัวแทนวิชาเลือก)</span>
                    </label>
                  </div>
                </div>
              </div>

              <div className="modal-footer">
                <button className="btn btn-ghost" onClick={() => setShowModal(false)}>ยกเลิก</button>
                <button className="btn btn-primary" onClick={submit}>
                  {editingCourse ? 'บันทึกการแก้ไข' : 'สร้างรายวิชา'}
                </button>
              </div>
            </div>
          </div>
        </Portal>
      )}
    </div>
  );
}
