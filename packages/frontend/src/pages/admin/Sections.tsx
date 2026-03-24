import { useState, useEffect, useCallback } from 'react';
import Portal from '../../components/ui/Portal';
import { adminApi } from '../../api/admin.api';
import { courseApi } from '../../api/course.api';
import { configApi } from '../../api/config.api';
import type { Section, Course, SemesterConfig, User } from '../../types';
import { Plus, Pencil, Trash2, Loader2, BookOpen, Search, ChevronLeft, ChevronRight, Users, Clock } from 'lucide-react';
import { toast } from 'react-hot-toast';
import './Sections.css';

const DAYS = ['MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT', 'SUN'];

type ScheduleForm = { dayOfWeek: string; startTime: string; endTime: string };
type FormData = { courseId: string; professorId: string; sectionNo: number; capacity: number; schedules: ScheduleForm[] };
const emptyForm: FormData = { 
  courseId: '', 
  professorId: '', 
  sectionNo: 1, 
  capacity: 40, 
  schedules: [{ dayOfWeek: 'MON', startTime: '09:00', endTime: '12:00' }] 
};

export default function AdminSections() {
  const [sections, setSections] = useState<Section[]>([]);
  const [courses, setCourses] = useState<Course[]>([]);
  const [professors, setProfessors] = useState<User[]>([]);
  const [config, setConfig] = useState<SemesterConfig | null>(null);
  const [page, setPage] = useState(1);
  const [lastPage, setLastPage] = useState(1);
  const [search, setSearch] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState<Section | null>(null);
  const [form, setForm] = useState<FormData>(emptyForm);

  useEffect(() => {
    Promise.all([
      courseApi.search({ limit: 500 }), 
      adminApi.getUsers({ role: 'PROFESSOR', limit: 500 }),
      configApi.getCurrentSemester()
    ]).then(([cr, pr, cfg]) => {
      setCourses(cr.data.data);
      setProfessors(pr.data.data);
      setConfig(cfg.data);
    });
  }, []);

  const fetchSections = useCallback(async () => {
    setIsLoading(true);
    try {
      const r = await adminApi.getAllSections({ page, search, academicYear: config?.academicYear, semester: config?.semester, limit: 15 });
      setSections(r.data.data);
      setLastPage(r.data.totalPages);
    } catch { toast.error('Failed to load sections'); }
    finally { setIsLoading(false); }
  }, [page, search, config]);

  useEffect(() => { if (config) fetchSections(); }, [fetchSections, config]);

  const openAdd = () => { setEditing(null); setForm(emptyForm); setShowModal(true); };
  const openEdit = (s: Section) => {
    setEditing(s);
    setForm({ 
      courseId: s.courseId, 
      professorId: s.professorId, 
      sectionNo: s.sectionNo, 
      capacity: s.capacity, 
      schedules: s.schedules?.map(sc => ({ dayOfWeek: sc.dayOfWeek, startTime: sc.startTime, endTime: sc.endTime })) || [] 
    });
    setShowModal(true);
  };

  const submit = async () => {
    try {
      if (editing) {
        await adminApi.updateSection(editing.id, form);
        toast.success('Section updated');
      } else {
        await adminApi.createSection({ ...form, academicYear: config?.academicYear, semester: config?.semester });
        toast.success('Section created');
      }
      fetchSections();
      setShowModal(false);
    } catch (e: any) { 
      toast.error(e.response?.data?.message || 'Operation failed'); 
    }
  };

  const deleteSection = async (id: string) => {
    if (!confirm('Delete this section?')) return;
    try {
      await adminApi.deleteSection(id);
      setSections(p => p.filter(s => s.id !== id));
      toast.success('Deleted');
    } catch { toast.error('Delete failed'); }
  };

  const addSchedule = () => setForm(p => ({ ...p, schedules: [...p.schedules, { dayOfWeek: 'MON', startTime: '09:00', endTime: '12:00' }] }));
  const removeSchedule = (i: number) => setForm(p => ({ ...p, schedules: p.schedules.filter((_, idx) => idx !== i) }));
  const updateSchedule = (i: number, field: keyof ScheduleForm, val: string) =>
    setForm(p => ({ ...p, schedules: p.schedules.map((s, idx) => idx === i ? { ...s, [field]: val } : s) }));

  const getCapColor = (s: Section) => {
    const ratio = s.enrolledCount / s.capacity;
    if (ratio >= 1) return 'danger';
    if (ratio >= 0.8) return 'warning';
    return 'success';
  };

  return (
    <div className="admin-page animate-fade-in">
      <div className="page-header">
        <div className="page-title"><Layers size={24} className="text-primary" /><h1>Section Management</h1>
          {config && <span className="badge badge-info">{config.academicYear}/{config.semester}</span>}
        </div>
        <button className="btn btn-primary shadow-glow" onClick={openAdd}><Plus size={18} /> New Section</button>
      </div>

      <div className="page-filters glass-panel">
        <div className="search-box">
          <Search size={18} className="text-muted" />
          <input placeholder="Search by course code or name..." value={search} onChange={e => { setSearch(e.target.value); setPage(1); }} />
        </div>
      </div>

      {isLoading ? (
        <div className="loading-state-premium h-64"><Loader2 className="spin" size={40} /></div>
      ) : (
        <>
          <div className="data-table-wrapper card glass-panel">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Course</th>
                  <th>Prof.</th>
                  <th>Schedule</th>
                  <th>Capacity</th>
                  <th className="text-center">Status</th>
                  <th className="text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {sections.map(s => (
                  <tr key={s.id} className="animate-fade-in-up">
                    <td>
                      <div className="course-cell">
                        <span className="code-pill">{s.course?.courseCode}</span>
                        <span className="course-name">{s.course?.nameTh}</span>
                      </div>
                    </td>
                    <td className="text-secondary">{s.professor?.user?.firstName} {s.professor?.user?.lastName}</td>
                    <td>
                      <div className="schedule-mini-stack">
                        {s.schedules?.map(sc => (
                          <div key={sc.id} className="sc-item font-mono text-xs">
                             <Clock size={12} /> {sc.dayOfWeek} {sc.startTime}-{sc.endTime}
                          </div>
                        ))}
                      </div>
                    </td>
                    <td>
                      <div className="cap-mini-bar">
                        <span className={`text-${getCapColor(s)} font-bold text-xs`}>{s.enrolledCount}/{s.capacity}</span>
                        <div className="bar-bg"><div className={`bar-fill bg-${getCapColor(s)}`} style={{ width: `${(s.enrolledCount/s.capacity)*100}%` }} /></div>
                      </div>
                    </td>
                    <td className="text-center"><span className={`status-dot bg-${getCapColor(s)}`} /></td>
                    <td className="text-right">
                      <div className="row-actions justify-end">
                        <button className="btn-icon" onClick={() => openEdit(s)}><Pencil size={14} /></button>
                        <button className="btn-icon text-danger" onClick={() => deleteSection(s.id)}><Trash2 size={14} /></button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="pagination">
            <button disabled={page <= 1} onClick={() => setPage(p => p - 1)}><ChevronLeft size={18} /></button>
            <span className="current-page">{page}</span>
            <button disabled={page >= lastPage} onClick={() => setPage(p => p + 1)}><ChevronRight size={18} /></button>
          </div>
        </>
      )}

      {showModal && (
        <Portal>
          <div className="modal-overlay animate-fade-in" onClick={() => setShowModal(false)}>
          <div className="modal-content glass-panel-premium w-full max-w-2xl" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h3>{editing ? 'Modify Section' : 'Create New Section'}</h3>
              <button className="btn-icon" onClick={() => setShowModal(false)}><Plus className="rotate-45" size={24} /></button>
            </div>
            <div className="form-stack p-lg">
              <div className="form-group">
                <label>Course Catalog</label>
                <select value={form.courseId} onChange={e => setForm(p => ({ ...p, courseId: e.target.value }))} disabled={!!editing}>
                  <option value="">Search & Select Course...</option>
                  {courses.map(c => <option key={c.id} value={c.id}>[{c.courseCode}] {c.nameTh}</option>)}
                </select>
              </div>
              <div className="form-group mt-md">
                <label>Assigned Professor</label>
                <select value={form.professorId} onChange={e => setForm(p => ({ ...p, professorId: e.target.value }))}>
                  <option value="">Assign Professor...</option>
                  {professors.map(p => <option key={p.id} value={p.id}>{p.firstName} {p.lastName}</option>)}
                </select>
              </div>
              <div className="grid grid-cols-2 gap-md mt-md">
                <div className="form-group">
                  <label>Section Number</label>
                  <input type="number" value={form.sectionNo} onChange={e => setForm(p => ({ ...p, sectionNo: +e.target.value }))} />
                </div>
                <div className="form-group">
                  <label>Max Enrollment (Capacity)</label>
                  <input type="number" value={form.capacity} onChange={e => setForm(p => ({ ...p, capacity: +e.target.value }))} />
                </div>
              </div>

              <div className="schedule-picker mt-lg">
                <div className="flex justify-between items-center mb-sm">
                  <label className="text-secondary font-bold">Class Schedule</label>
                  <button className="btn btn-secondary btn-sm" onClick={addSchedule}><Plus size={14} /> Add Pattern</button>
                </div>
                <div className="schedule-inputs-stack">
                  {form.schedules.map((sc, i) => (
                    <div key={i} className="flex gap-sm items-center mb-sm bg-black/20 p-sm rounded-md">
                      <select value={sc.dayOfWeek} className="w-32" onChange={e => updateSchedule(i, 'dayOfWeek', e.target.value)}>
                        {DAYS.map(d => <option key={d} value={d}>{d}</option>)}
                      </select>
                      <input type="time" value={sc.startTime} onChange={e => updateSchedule(i, 'startTime', e.target.value)} />
                      <span className="opacity-50">to</span>
                      <input type="time" value={sc.endTime} onChange={e => updateSchedule(i, 'endTime', e.target.value)} />
                      <button className="btn-icon text-danger" onClick={() => removeSchedule(i)}><Trash2 size={16} /></button>
                    </div>
                  ))}
                </div>
              </div>
            </div>
            <div className="modal-footer flex justify-end gap-md p-lg border-t">
              <button className="btn btn-secondary" onClick={() => setShowModal(false)}>Discard</button>
              <button className="btn btn-primary shadow-glow" onClick={submit}>Finalize & Save</button>
            </div>
          </div>
          </div>
        </Portal>
      )}
    </div>
  );
}
