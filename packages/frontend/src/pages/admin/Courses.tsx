import { useState, useEffect, useCallback } from 'react';
import Portal from '../../components/ui/Portal';
import { courseApi } from '../../api/course.api';
import { facultyApi } from '../../api/faculty.api';
import { departmentApi } from '../../api/department.api';
import type { Course, Faculty, Department, CourseCategory } from '../../types';
import { Plus, Pencil, Trash2, Loader2, BookOpen, Search, ChevronLeft, ChevronRight } from 'lucide-react';
import { toast } from 'react-hot-toast';
import './Courses.css';

const CATEGORIES: CourseCategory[] = [
  'GENERAL_EDUCATION', 'CORE_COURSE', 'REQUIRED_COURSE',
  'MAJOR_ELECTIVE', 'FREE_ELECTIVE', 'COOP_COURSE',
];

const CAT_LABELS: Record<CourseCategory, string> = {
  GENERAL_EDUCATION: 'GE',
  CORE_COURSE: 'Core',
  REQUIRED_COURSE: 'Required',
  MAJOR_ELECTIVE: 'Major Elec.',
  FREE_ELECTIVE: 'Free Elec.',
  COOP_COURSE: 'Co-op',
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
  const [isLoading, setIsLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingCourse, setEditingCourse] = useState<Course | null>(null);
  const [form, setForm] = useState<Partial<FormData>>(emptyForm);

  useEffect(() => {
    facultyApi.getAll().then(r => setFaculties(r.data));
  }, []);

  useEffect(() => {
    if (form.facultyId) {
      departmentApi.getByFaculty(form.facultyId).then(r => setDepartments(r.data));
    }
  }, [form.facultyId]);

  const fetchCourses = useCallback(async () => {
    setIsLoading(true);
    try {
      const r = await courseApi.search({ search, facultyId: filterFaculty || undefined, page, limit: 15 });
      setCourses(r.data.data);
      setLastPage(r.data.meta.lastPage);
    } catch { toast.error('Failed to load courses'); }
    finally { setIsLoading(false); }
  }, [search, filterFaculty, page]);

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
    try {
      if (editingCourse) {
        const r = await courseApi.update(editingCourse.id, form);
        setCourses(p => p.map(c => c.id === editingCourse.id ? r.data : c));
        toast.success('Course updated');
      } else {
        await courseApi.create(form);
        toast.success('Course created');
        fetchCourses();
      }
      setShowModal(false);
    } catch { toast.error('Operation failed'); }
  };

  const deleteCourse = async (id: string) => {
    if (!confirm('Delete this course?')) return;
    try {
      await courseApi.delete(id);
      setCourses(p => p.filter(c => c.id !== id));
      toast.success('Course deleted');
    } catch { toast.error('Delete failed'); }
  };

  return (
    <div className="admin-page animate-fade-in">
      <div className="page-header">
        <div className="page-title"><BookOpen size={24} /><h1>Courses</h1></div>
        <button className="btn btn-primary" onClick={openAdd}><Plus size={16} /> Add Course</button>
      </div>

      <div className="page-filters">
        <div className="search-box">
          <Search size={16} />
          <input placeholder="Search code or name..." value={search}
            onChange={e => { setSearch(e.target.value); setPage(1); }} />
        </div>
        <select value={filterFaculty} onChange={e => { setFilterFaculty(e.target.value); setPage(1); }}>
          <option value="">All Faculties</option>
          {faculties.map(f => <option key={f.id} value={f.id}>{f.nameEn}</option>)}
        </select>
      </div>

      {isLoading ? (
        <div className="loading-state"><Loader2 className="spin" size={32} /></div>
      ) : (
        <>
          <div className="data-table">
            <table>
              <thead>
                <tr>
                  <th>Code</th><th>Name (TH)</th><th>Name (EN)</th>
                  <th>Credits</th><th>Category</th><th>Wildcard</th><th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {courses.map(c => (
                  <tr key={c.id}>
                    <td><span className="badge">{c.courseCode}</span></td>
                    <td>{c.nameTh}</td>
                    <td className="text-secondary">{c.nameEn}</td>
                    <td>{c.credits}({c.lectureHours}-{c.labHours}-{c.selfStudyHours})</td>
                    <td><span className={`badge cat-${c.category}`}>{CAT_LABELS[c.category]}</span></td>
                    <td>{c.isWildcard ? '✓' : ''}</td>
                    <td>
                      <div className="row-actions">
                        <button className="btn-icon edit" onClick={() => openEdit(c)}><Pencil size={14} /></button>
                        <button className="btn-icon delete" onClick={() => deleteCourse(c.id)}><Trash2 size={14} /></button>
                      </div>
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

      {showModal && (
        <Portal>
          <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal modal-lg" onClick={e => e.stopPropagation()}>
            <h3>{editingCourse ? 'Edit Course' : 'Add Course'}</h3>
            <div className="form-grid-2">
              <div className="form-group">
                <label>Course Code</label>
                <input value={form.courseCode} onChange={e => setForm(p => ({ ...p, courseCode: e.target.value }))} />
              </div>
              <div className="form-group">
                <label>Category</label>
                <select value={form.category} onChange={e => setForm(p => ({ ...p, category: e.target.value as CourseCategory }))}>
                  {CATEGORIES.map(c => <option key={c} value={c}>{CAT_LABELS[c]}</option>)}
                </select>
              </div>
              <div className="form-group span-2">
                <label>Name (Thai)</label>
                <input value={form.nameTh} onChange={e => setForm(p => ({ ...p, nameTh: e.target.value }))} />
              </div>
              <div className="form-group span-2">
                <label>Name (English)</label>
                <input value={form.nameEn} onChange={e => setForm(p => ({ ...p, nameEn: e.target.value }))} />
              </div>
              <div className="form-group">
                <label>Credits</label>
                <input type="number" value={form.credits} onChange={e => setForm(p => ({ ...p, credits: +e.target.value }))} />
              </div>
              <div className="form-group">
                <label>Lecture / Lab / Self-study</label>
                <div style={{ display: 'flex', gap: 4 }}>
                  <input type="number" value={form.lectureHours} onChange={e => setForm(p => ({ ...p, lectureHours: +e.target.value }))} />
                  <input type="number" value={form.labHours} onChange={e => setForm(p => ({ ...p, labHours: +e.target.value }))} />
                  <input type="number" value={form.selfStudyHours} onChange={e => setForm(p => ({ ...p, selfStudyHours: +e.target.value }))} />
                </div>
              </div>
              <div className="form-group">
                <label>Faculty</label>
                <select value={form.facultyId} onChange={e => setForm(p => ({ ...p, facultyId: e.target.value, deptId: '' }))}>
                  <option value="">Select...</option>
                  {faculties.map(f => <option key={f.id} value={f.id}>{f.nameEn}</option>)}
                </select>
              </div>
              <div className="form-group">
                <label>Department</label>
                <select value={form.deptId} onChange={e => setForm(p => ({ ...p, deptId: e.target.value }))}>
                  <option value="">Select...</option>
                  {departments.map(d => <option key={d.id} value={d.id}>{d.nameEn}</option>)}
                </select>
              </div>
              <div className="form-group">
                <label className="checkbox-label">
                  <input type="checkbox" checked={form.isWildcard} onChange={e => setForm(p => ({ ...p, isWildcard: e.target.checked }))} />
                  Wildcard / Placeholder
                </label>
              </div>
            </div>
            <div className="modal-actions">
              <button className="btn btn-secondary" onClick={() => setShowModal(false)}>Cancel</button>
              <button className="btn btn-primary" onClick={submit}>Save</button>
            </div>
          </div>
          </div>
        </Portal>
      )}
    </div>
  );
}
