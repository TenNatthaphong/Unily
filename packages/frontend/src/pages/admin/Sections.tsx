import { useState, useEffect, useCallback } from 'react';
import { sectionApi } from '../../api/section.api';
import { courseApi } from '../../api/course.api';
import { configApi } from '../../api/config.api';
import type { Section, Course, SemesterConfig } from '../../types';
import { Plus, Pencil, Trash2, Loader2, BookOpen, Search, ChevronLeft, ChevronRight, Users } from 'lucide-react';
import { toast } from 'react-hot-toast';
import './Sections.css';

const DAYS = ['MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT', 'SUN'];

type ScheduleForm = { dayOfWeek: string; startTime: string; endTime: string };
type FormData = { courseId: string; sectionNo: number; capacity: number; schedules: ScheduleForm[] };
const emptyForm: FormData = { courseId: '', sectionNo: 1, capacity: 50, schedules: [{ dayOfWeek: 'MON', startTime: '09:00', endTime: '12:00' }] };

export default function AdminSections() {
  const [sections, setSections] = useState<Section[]>([]);
  const [courses, setCourses] = useState<Course[]>([]);
  const [config, setConfig] = useState<SemesterConfig | null>(null);
  const [page, setPage] = useState(1);
  const [lastPage, setLastPage] = useState(1);
  const [search, setSearch] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState<Section | null>(null);
  const [form, setForm] = useState<FormData>(emptyForm);

  useEffect(() => {
    Promise.all([courseApi.search({ limit: 200 }), configApi.getCurrentSemester()]).then(([cr, cfg]) => {
      setCourses(cr.data.data);
      setConfig(cfg.data);
    });
  }, []);

  const fetchSections = useCallback(async () => {
    setIsLoading(true);
    try {
      const r = await sectionApi.getAll({ page, search, academicYear: config?.academicYear, semester: config?.semester, limit: 15 });
      setSections(r.data.data);
      setLastPage(r.data.meta.lastPage);
    } catch { toast.error('Failed to load sections'); }
    finally { setIsLoading(false); }
  }, [page, search, config]);

  useEffect(() => { if (config) fetchSections(); }, [fetchSections, config]);

  const openAdd = () => { setEditing(null); setForm(emptyForm); setShowModal(true); };
  const openEdit = (s: Section) => {
    setEditing(s);
    setForm({ courseId: s.courseId, sectionNo: s.sectionNo, capacity: s.capacity, schedules: s.schedules?.map(sc => ({ dayOfWeek: sc.dayOfWeek, startTime: sc.startTime, endTime: sc.endTime })) || [] });
    setShowModal(true);
  };

  const submit = async () => {
    try {
      if (editing) {
        const r = await sectionApi.update(editing.id, { sectionNo: form.sectionNo, capacity: form.capacity });
        setSections(p => p.map(s => s.id === editing.id ? r.data : s));
        toast.success('Section updated');
      } else {
        await sectionApi.create({ ...form, academicYear: config?.academicYear, semester: config?.semester });
        toast.success('Section created');
        fetchSections();
      }
      setShowModal(false);
    } catch { toast.error('Operation failed'); }
  };

  const deleteSection = async (id: string) => {
    if (!confirm('Delete this section?')) return;
    try {
      await sectionApi.delete(id);
      setSections(p => p.filter(s => s.id !== id));
      toast.success('Deleted');
    } catch { toast.error('Delete failed'); }
  };

  const addSchedule = () => setForm(p => ({ ...p, schedules: [...p.schedules, { dayOfWeek: 'MON', startTime: '09:00', endTime: '12:00' }] }));
  const removeSchedule = (i: number) => setForm(p => ({ ...p, schedules: p.schedules.filter((_, idx) => idx !== i) }));
  const updateSchedule = (i: number, field: keyof ScheduleForm, val: string) =>
    setForm(p => ({ ...p, schedules: p.schedules.map((s, idx) => idx === i ? { ...s, [field]: val } : s) }));

  const getCapacityColor = (s: Section) => {
    const ratio = s.enrolledCount / s.capacity;
    if (ratio >= 1) return 'danger';
    if (ratio >= 0.7) return 'warning';
    return 'success';
  };

  return (
    <div className="admin-page animate-fade-in">
      <div className="page-header">
        <div className="page-title"><BookOpen size={24} /><h1>Sections</h1>
          {config && <span className="badge">{config.academicYear}/{config.semester}</span>}
        </div>
        <button className="btn btn-primary" onClick={openAdd}><Plus size={16} /> Add Section</button>
      </div>

      <div className="page-filters">
        <div className="search-box"><Search size={16} />
          <input placeholder="Search course..." value={search} onChange={e => { setSearch(e.target.value); setPage(1); }} />
        </div>
      </div>

      {isLoading ? <div className="loading-state"><Loader2 className="spin" size={32} /></div> : (
        <>
          <div className="data-table">
            <table>
              <thead><tr>
                <th>Course</th><th>Sec</th><th>Professor</th>
                <th>Schedule</th><th>Capacity</th><th>Status</th><th>Actions</th>
              </tr></thead>
              <tbody>
                {sections.map(s => (
                  <tr key={s.id}>
                    <td><span className="badge">{s.course?.courseCode}</span> {s.course?.nameTh}</td>
                    <td>{s.sectionNo}</td>
                    <td>{s.professor?.user?.firstName} {s.professor?.user?.lastName}</td>
                    <td className="text-secondary text-sm">
                      {s.schedules?.map(sc => `${sc.dayOfWeek} ${sc.startTime}-${sc.endTime}`).join(', ')}
                    </td>
                    <td>
                      <div className="capacity-cell">
                        <span>{s.enrolledCount}/{s.capacity}</span>
                        <div className="capacity-bar-sm">
                          <div className={`capacity-fill ${getCapacityColor(s)}`}
                            style={{ width: `${Math.min(100, (s.enrolledCount / s.capacity) * 100)}%` }} />
                        </div>
                      </div>
                    </td>
                    <td><span className={`status-dot ${getCapacityColor(s)}`} /></td>
                    <td>
                      <div className="row-actions">
                        <button className="btn-icon" title="View students"><Users size={14} /></button>
                        <button className="btn-icon edit" onClick={() => openEdit(s)}><Pencil size={14} /></button>
                        <button className="btn-icon delete" onClick={() => deleteSection(s.id)}><Trash2 size={14} /></button>
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
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal modal-lg" onClick={e => e.stopPropagation()}>
            <h3>{editing ? 'Edit Section' : 'Add Section'}</h3>
            <div className="form-grid-2">
              <div className="form-group span-2">
                <label>Course</label>
                <select value={form.courseId} onChange={e => setForm(p => ({ ...p, courseId: e.target.value }))} disabled={!!editing}>
                  <option value="">Select course...</option>
                  {courses.map(c => <option key={c.id} value={c.id}>{c.courseCode} - {c.nameTh}</option>)}
                </select>
              </div>
              <div className="form-group">
                <label>Section No.</label>
                <input type="number" value={form.sectionNo} onChange={e => setForm(p => ({ ...p, sectionNo: +e.target.value }))} />
              </div>
              <div className="form-group">
                <label>Capacity</label>
                <input type="number" value={form.capacity} onChange={e => setForm(p => ({ ...p, capacity: +e.target.value }))} />
              </div>
            </div>
            {!editing && (
              <div className="schedules-section">
                <div className="schedules-header">
                  <label>Schedules</label>
                  <button type="button" className="btn btn-secondary btn-sm" onClick={addSchedule}><Plus size={12} /> Add</button>
                </div>
                {form.schedules.map((sc, i) => (
                  <div key={i} className="schedule-row">
                    <select value={sc.dayOfWeek} onChange={e => updateSchedule(i, 'dayOfWeek', e.target.value)}>
                      {DAYS.map(d => <option key={d} value={d}>{d}</option>)}
                    </select>
                    <input type="time" value={sc.startTime} onChange={e => updateSchedule(i, 'startTime', e.target.value)} />
                    <input type="time" value={sc.endTime} onChange={e => updateSchedule(i, 'endTime', e.target.value)} />
                    <button type="button" className="btn-icon delete" onClick={() => removeSchedule(i)}><Trash2 size={14} /></button>
                  </div>
                ))}
              </div>
            )}
            <div className="modal-actions">
              <button className="btn btn-secondary" onClick={() => setShowModal(false)}>Cancel</button>
              <button className="btn btn-primary" onClick={submit}>Save</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
