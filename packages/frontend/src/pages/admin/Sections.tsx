import { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import React from 'react';
import Portal from '../../components/ui/Portal';
import { sectionApi } from '../../api/section.api';
import { courseApi } from '../../api/course.api';
import { adminApi } from '../../api/admin.api';
import { Select } from '../../components/ui/Select';
import {
  Plus, Pencil, Trash2, Loader2, Search,
  Upload, BookOpen, Users, Clock, CalendarDays, ChevronRight,
} from 'lucide-react';
import { toast } from 'react-hot-toast';
import Pagination from '../../components/ui/Pagination';
import { facultyApi } from '../../api/faculty.api';
import './Sections.css';
import { ScheduleBadge } from '../../components/ui/ScheduleBadge';

import { DAY_CONFIG, DAYS } from '../../types/day';
import type { DayOfWeek } from '../../types/index';
import type { Section, Course, Faculty } from '../../types';

interface ScheduleForm {
  dayOfWeek: DayOfWeek;
  startTime: string;
  endTime: string;
}

interface FormState {
  courseId: string;
  professorId: string;
  sectionNo: number | string;
  capacity: number | string;
  academicYear: number;
  semester: number;
  schedules: ScheduleForm[];
}

const emptyForm: FormState = {
  courseId: '',
  professorId: '',
  sectionNo: '',
  capacity: 30,
  academicYear: new Date().getFullYear() + 543,
  semester: 1,
  schedules: [{ dayOfWeek: 'MON', startTime: '08:00', endTime: '10:00' }],
};

function getCapacityClass(enrolled: number, cap: number) {
  const r = enrolled / Math.max(1, cap);
  if (r >= 1) return 'danger';
  if (r >= 0.7) return 'warning';
  return 'success';
}

export default function AdminSections() {
  const [fullSections, setFullSections] = useState<Section[]>([]);
  const [courses, setCourses] = useState<Course[]>([]);
  const [faculties, setFaculties] = useState<Faculty[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filterFaculty, setFilterFaculty] = useState('');
  const [page, setPage] = useState(1);
  const [config, setConfig] = useState<any>(null);
  const [total, setTotal] = useState(0);
  const [expandedCourses, setExpandedCourses] = useState<Record<string, boolean>>({});
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState<Section | null>(null);
  const [form, setForm] = useState<FormState>(emptyForm);
  const [isSaving, setIsSaving] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [isImporting, setIsImporting] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const fetchFullData = useCallback(async () => {
    if (!config) return;
    setIsLoading(true);
    try {
      const r = await sectionApi.getAll({
        limit: 2000, // Fetch large enough to cover "all"
        search: search || undefined,
        academicYear: config.academicYear,
        semester: config.semester,
      });
      setFullSections(r.data.data);
      setTotal(r.data.meta.total);
    } catch {
      toast.error('โหลดข้อมูล Section ไม่สำเร็จ');
    } finally {
      setIsLoading(false);
    }
  }, [search, config]);

  useEffect(() => { fetchFullData(); }, [fetchFullData]);

  const groupedSections = useMemo(() => {
    const groups: Record<string, { course: Course, sections: Section[] }> = {};
    fullSections.forEach(sec => {
      const cid = sec.courseId;
      if (!sec.course || !cid) return; // Skip if no course relation or ID
      if (!groups[cid]) {
        groups[cid] = { course: { ...sec.course, id: cid }, sections: [] }; // Explicitly inject id
      }
      groups[cid].sections.push(sec);
    });
    return Object.values(groups);
  }, [fullSections]);

  const toggleCourse = (cid: string) => {
    setExpandedCourses(prev => ({ ...prev, [cid]: !prev[cid] }));
  };

  useEffect(() => {
    import('../../api/config.api').then(({ configApi }) => {
      configApi.getCurrentSemester().then(r => {
        if (r.data) setConfig(r.data);
      });
    });
    courseApi.search({ limit: 2000 }).then(r => setCourses(r.data.data));
    facultyApi.getAll().then(r => setFaculties(r.data));
  }, []);

  const openEdit = (sec: Section) => {
    setEditing(sec);
    setForm({
      courseId: sec.courseId,
      professorId: sec.professorId,
      sectionNo: sec.sectionNo,
      capacity: sec.capacity,
      academicYear: sec.academicYear,
      semester: sec.semester,
      schedules: sec.schedules?.map(s => ({
        dayOfWeek: s.dayOfWeek,
        startTime: s.startTime,
        endTime: s.endTime,
      })) || [{ dayOfWeek: 'MON', startTime: '08:00', endTime: '10:00' }],
    });
    setShowModal(true);
  };

  const handleSave = async () => {
    if (!form.courseId) {
      toast.error('กรุณาระบุรายวิชา');
      return;
    }
    
    setIsSaving(true);
    try {
      let finalSectionNo = Number(form.sectionNo);
      
      // Auto generate section number if not provided
      if (!form.sectionNo || finalSectionNo === 0) {
        const existingSections = fullSections.filter(s => s.courseId === form.courseId);
        const maxNo = existingSections.reduce((max, s) => Math.max(max, s.sectionNo), 0);
        finalSectionNo = maxNo + 1;
      }

      const payload = {
        courseId: form.courseId,
        professorId: form.professorId || undefined,
        sectionNo: finalSectionNo,
        capacity: Number(form.capacity),
        academicYear: Number(form.academicYear),
        semester: Number(form.semester),
        schedules: form.schedules as any,
      };
      if (editing) {
        await sectionApi.update(editing.id, payload);
        toast.success('อัปเดต Section สำเร็จ');
      } else {
        await sectionApi.create(payload);
        toast.success(`สร้างรายวิชากลุ่มที่ ${finalSectionNo} สำเร็จ`);
      }
      setShowModal(false);
      fetchFullData();
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'บันทึกไม่สำเร็จ');
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!confirm('ยืนยันลบ Section นี้?')) return;
    setDeletingId(id);
    try {
      await sectionApi.delete(id);
      toast.success('ลบ Section สำเร็จ');
      fetchFullData();
    } catch {
      toast.error('ลบไม่สำเร็จ');
    } finally {
      setDeletingId(null);
    }
  };

  const handleImportCsv = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setIsImporting(true);
    const tid = toast.loading('กำลังนำเข้าข้อมูล...');
    try {
      await adminApi.importSectionsCsv(file);
      toast.success('นำเข้าข้อมูลสำเร็จ', { id: tid });
      fetchFullData();
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'นำเข้าไม่สำเร็จ', { id: tid });
    } finally {
      setIsImporting(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const updateSchedule = (idx: number, field: keyof ScheduleForm, value: string) => {
    setForm(p => {
      const s = [...p.schedules];
      s[idx] = { ...s[idx], [field]: value } as ScheduleForm;
      
      if (field === 'startTime' && p.courseId) {
        const c = courses.find(c => c.id === p.courseId);
        if (c && value) {
          const duration = (c.lectureHours || 0) + (c.labHours || 0);
          if (duration > 0) {
            const [hh, mm] = value.split(':').map(Number);
            const totalMins = hh * 60 + mm + Math.floor(duration * 60);
            const newH = String(Math.floor(totalMins / 60) % 24).padStart(2, '0');
            const newM = String(totalMins % 60).padStart(2, '0');
            s[idx].endTime = `${newH}:${newM}`;
          }
        }
      }
      return { ...p, schedules: s };
    });
  };

  const openCreateForCourse = (course: Course, currentSections: Section[]) => {
    setEditing(null);
    const maxNo = currentSections.reduce((max, s) => Math.max(max, s.sectionNo), 0);
    
    // Find full course object from state to get lecture/lab hours
    const fullCourse = courses.find(c => c.id === course.id);
    const duration = (fullCourse?.lectureHours || 0) + (fullCourse?.labHours || 0);
    
    // Calculate default end time based on 08:00 start time
    let defaultEnd = '10:00';
    if (duration > 0) {
      const totalMins = 8 * 60 + 0 + Math.floor(duration * 60);
      const newH = String(Math.floor(totalMins / 60) % 24).padStart(2, '0');
      const newM = String(totalMins % 60).padStart(2, '0');
      defaultEnd = `${newH}:${newM}`;
    }

    setForm({
      ...emptyForm,
      courseId: course.id,
      sectionNo: maxNo + 1,
      academicYear: config?.academicYear || emptyForm.academicYear,
      semester: config?.semester || emptyForm.semester,
      schedules: [{ dayOfWeek: 'MON', startTime: '08:00', endTime: defaultEnd }],
    });
    setShowModal(true);
  };

  return (
    <div className="admin-page animate-fade-in">
      {/* ── Header ── */}
      <div className="page-header">
        <div className="page-title">
          <BookOpen size={24} />
          <h1>กลุ่มเรียน (Sections)</h1>
          <span className="badge">{total} รายการ</span>
        </div>
        <div className="header-actions">
          <input
            ref={fileInputRef}
            type="file"
            accept=".csv"
            style={{ display: 'none' }}
            onChange={handleImportCsv}
          />
          <button
            className="btn btn-import"
            onClick={() => fileInputRef.current?.click()}
            disabled={isImporting}
          >
            {isImporting ? <Loader2 size={16} className="spin" /> : <Upload size={16} />}
            นำเข้า CSV
          </button>
        </div>
      </div>

      {/* ── Filters ── */}
      <div className="page-filters glass-card flex-between">
        <div className="filter-row-top" style={{ display: 'flex', gap: '12px', flex: 1 }}>
          <div className="search-box fill-search" style={{ flex: 1 }}>
            <Search size={16} />
            <input
              placeholder="ค้นหารหัสวิชา หรือชื่อวิชา..."
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
      </div>

      {/* ── List (Grouped by Course) ── */}
      {isLoading ? (
        <div className="loading-state"><Loader2 className="spin" size={40} /></div>
      ) : (
        <div className="org-list">
          {(() => {
            const filtered = groupedSections.filter(g => !filterFaculty || g.course.facultyId === filterFaculty);
            const paged = filtered.slice((page - 1) * 10, page * 10);
            const lastPage = Math.ceil(filtered.length / 10);

            if (filtered.length === 0) {
              return (
                <div className="empty-state-full" style={{ padding: '80px 0' }}>
                  <BookOpen size={48} style={{ opacity: 0.2, marginBottom: '16px' }} />
                  <p>ไม่พบข้อมูลรายวิชาและกลุ่มเรียนที่ค้นหา</p>
                </div>
              );
            }

            return (
              <React.Fragment>
                 {paged.map((group, idx) => {
                  const currentId = group.course.id;
                  const isExpanded = !!expandedCourses[currentId];
                  const key = currentId || `course-idx-${idx}`;
                  return (
                    <div key={`course-card-wrap-${key}`} className={`org-card card ${isExpanded ? 'expanded' : ''}`}>
                      <div className="org-row" onClick={() => toggleCourse(group.course.id)}>
                        <div className="org-main">
                          <div className={`exp-icon ${isExpanded ? 'active' : ''}`}>
                            <ChevronRight size={18} />
                          </div>
                          <div className="org-identity">
                            <span className="org-code">{group.course.courseCode}</span>
                            <div className="org-text">
                              <h3 className="org-name-th">{group.course.nameTh}</h3>
                              <p className="org-name-en">{group.course.nameEn}</p>
                            </div>
                          </div>
                        </div>
                        <div className="org-meta">
                          <div className="org-counts">
                            <span className="org-count-item main">{group.sections.length} กลุ่มเรียน</span>
                          </div>
                          <button
                            className="btn btn-primary btn-sm"
                            onClick={(e) => { e.stopPropagation(); openCreateForCourse(group.course, group.sections); }}
                          >
                            <Plus size={14} /> เพิ่ม Sec
                          </button>
                        </div>
                      </div>

                      {isExpanded && (
                        <div className="dept-section">
                          <div className="sec-sub-list">
                            {group.sections.map(sec => {
                              const capClass = getCapacityClass(sec.enrolledCount, sec.capacity);
                              const fillPct = Math.min(100, Math.round((sec.enrolledCount / Math.max(1, sec.capacity)) * 100));
                              return (
                                <div key={`section-row-${sec.id}`} className="sec-row-item">
                                  <div className="sec-info-main">
                                    <span style={{ fontWeight: 700, fontSize: '0.85rem' }}>กลุ่ม {sec.sectionNo}</span>
                                    <div className="sec-sch-group">
                                      {sec.schedules?.map((sch, i) => (
                                        <ScheduleBadge key={sch.id || i} schedule={sch as any} />
                                      ))}
                                    </div>
                                    <div className="sec-prof">
                                      <Users size={13} />
                                      <span>{sec.professor?.user ? `${sec.professor.user.firstName} ${sec.professor.user.lastName}` : 'ไม่ระบุผู้สอน'}</span>
                                    </div>
                                  </div>

                                  <div className="sec-cap-wrap">
                                    <div className="cap-meta">
                                      <span>{sec.enrolledCount}/{sec.capacity}</span>
                                    </div>
                                    <div className="cap-bar-mini">
                                      <div className={`cap-fill-mini ${capClass}`} style={{ width: `${fillPct}%` }} />
                                    </div>
                                  </div>

                                  <div className="sec-actions-mini">
                                    <button className="btn-icon sm edit" onClick={() => openEdit(sec)}><Pencil size={14} /></button>
                                    <button
                                      className="btn-icon sm delete"
                                      onClick={(e) => handleDelete(sec.id, e)}
                                      disabled={deletingId === sec.id}
                                    >
                                      {deletingId === sec.id ? <Loader2 size={14} className="spin" /> : <Trash2 size={14} />}
                                    </button>
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
                
                <div key="pagination-row-footer" style={{ marginTop: '24px' }}>
                  <Pagination 
                    currentPage={page} 
                    lastPage={lastPage} 
                    onPageChange={setPage} 
                  />
                </div>
              </React.Fragment>
            );
          })()}
        </div>
      )}

      {/* ── Modal ── */}
      {showModal && (
        <Portal>
          <div className="modal-overlay" onClick={() => setShowModal(false)}>
            <div className="modal modal-lg animate-pop-in" onClick={e => e.stopPropagation()}>
              <div className="modal-header">
                <div>
                  <h3>{editing ? 'แก้ไข Section' : 'เพิ่ม Section ใหม่'}</h3>
                  <p className="modal-subtitle">กรอกข้อมูลกลุ่มเรียนและตารางสอน</p>
                </div>
                <button className="btn-close" onClick={() => setShowModal(false)}>×</button>
              </div>

              <div className="modal-content">
                <div className="form-grid-2">
                  <div className="form-group span-2">
                    <label>รายวิชา <small className="req">*</small></label>
                    <Select
                      value={form.courseId}
                      onChange={v => setForm(p => ({ ...p, courseId: v }))}
                      options={courses.map(c => ({ value: c.id, label: `${c.courseCode} – ${c.nameTh}` }))}
                      placeholder="เลือกรายวิชา..."
                      disabled={!!editing || !!form.courseId} 
                    />
                  </div>
                  <div className="form-group">
                    <label>กลุ่มที่</label>
                    <input
                      type="number"
                      placeholder="เช่น 1"
                      value={form.sectionNo}
                      onChange={e => setForm(p => ({ ...p, sectionNo: e.target.value }))}
                      disabled={!!editing || (!!form.courseId && !!form.sectionNo)} 
                      style={(!!editing || (!!form.courseId && !!form.sectionNo)) ? { opacity: 0.6, background: 'var(--bg-elevated)', cursor: 'not-allowed' } : {}}
                    />
                  </div>
                  <div className="form-group">
                    <label><Users size={13} /> จำนวนที่นั่ง</label>
                    <input
                      type="number"
                      value={form.capacity}
                      onChange={e => setForm(p => ({ ...p, capacity: e.target.value }))}
                    />
                  </div>
                  <div className="form-group">
                    <label><CalendarDays size={13} /> ปีการศึกษา</label>
                    <input type="number" value={form.academicYear} disabled style={{ opacity: 0.6, background: 'var(--bg-elevated)', cursor: 'not-allowed' }} />
                  </div>
                  <div className="form-group">
                    <label>ภาคเรียน</label>
                    <input type="text" value={`ภาคเรียนที่ ${form.semester}`} disabled style={{ opacity: 0.6, background: 'var(--bg-elevated)', cursor: 'not-allowed' }} />
                  </div>
                </div>

                {/* Schedule (Single Only) */}
                <div className="schedule-section">
                  <div className="schedule-header">
                    <span className="schedule-title"><Clock size={15} /> ตารางเรียน</span>
                  </div>
                  {form.schedules.slice(0, 1).map((sch, idx) => (
                    <div key={idx} className="schedule-row single-sch">
                      <div className="form-group" style={{ margin: 0 }}>
                        <label>วัน</label>
                        <Select
                          value={sch.dayOfWeek}
                          onChange={v => updateSchedule(idx, 'dayOfWeek', v)}
                          options={DAYS.map(d => ({ value: d, label: DAY_CONFIG[d].label }))}
                        />
                      </div>
                      <div className="form-group" style={{ margin: 0 }}>
                        <label>เวลาเริ่ม</label>
                        <input type="time" value={sch.startTime} onChange={e => updateSchedule(idx, 'startTime', e.target.value)} />
                      </div>
                      <div className="form-group" style={{ margin: 0 }}>
                        <label>เวลาสิ้นสุด</label>
                        <input 
                          type="time" 
                          value={sch.endTime} 
                          disabled 
                          style={{ opacity: 0.6, background: 'var(--bg-elevated)', cursor: 'not-allowed' }}
                          onChange={e => updateSchedule(idx, 'endTime', e.target.value)} 
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="modal-footer">
                <button className="btn btn-ghost" onClick={() => setShowModal(false)}>ยกเลิก</button>
                <button className="btn btn-primary" onClick={handleSave} disabled={isSaving}>
                  {isSaving && <Loader2 size={15} className="spin" />}
                  {editing ? 'บันทึกการแก้ไข' : 'สร้าง Section'}
                </button>
              </div>
            </div>
          </div>
        </Portal>
      )}
    </div>
  );
}
