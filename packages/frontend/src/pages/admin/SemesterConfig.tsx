import { useState, useEffect, useCallback } from 'react';
import Portal from '../../components/ui/Portal';
import { adminApi } from '../../api/admin.api';
import type { SemesterConfig } from '../../types';
import { 
  Settings, Plus, Pencil, Loader2, CheckCircle, 
  Trash2, AlertTriangle, CalendarDays, TrendingUp,
  BarChart3, Info
} from 'lucide-react';
import { toast } from 'react-hot-toast';
import { Select } from '../../components/ui/Select';
import './SemesterConfig.css';

type FormData = Omit<SemesterConfig, 'id'>;
const emptyForm: FormData = {
  academicYear: new Date().getFullYear() + 543,
  semester: 1,
  regStart: '',
  regEnd: '',
  withdrawStart: '',
  withdrawEnd: '',
  isCurrent: false,
};

function toInputDate(d: string) {
  if (!d) return '';
  const date = new Date(d);
  // Adjust for local time input
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
}

const fmt = (d: string) =>
  d ? new Date(d).toLocaleString('th-TH', { dateStyle: 'medium', timeStyle: 'short' }) : '-';



export default function AdminSemesterConfig() {
  const [configs, setConfigs] = useState<SemesterConfig[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState<SemesterConfig | null>(null);
  const [form, setForm] = useState<FormData>(emptyForm);
  const [isClosingSem, setIsClosingSem] = useState(false);
  const [selectedYear, setSelectedYear] = useState<number | null>(null);

  // Stats
  const [topEnrolled, setTopEnrolled] = useState<{ courseCode: string; nameTh: string; enrollCount: number }[]>([]);
  const [topFailed, setTopFailed] = useState<{ courseCode: string; nameTh: string; failCount: number }[]>([]);
  const [isLoadingStats, setIsLoadingStats] = useState(false);

  const fetchConfigs = useCallback(async () => {
    try {
      const r = await adminApi.getSemesterConfigs();
      const sorted = [...r.data].sort((a, b) =>
        b.academicYear !== a.academicYear
          ? b.academicYear - a.academicYear
          : b.semester - a.semester
      );
      setConfigs(sorted);
      const current = sorted.find(c => c.isCurrent);
      const active = current || sorted[0];
      if (!selectedId && active) {
        setSelectedId(active.id);
        setSelectedYear(active.academicYear);
      } else if (active && !selectedYear) {
        setSelectedYear(active.academicYear);
      }
    } catch {
      toast.error('โหลดข้อมูลไม่สำเร็จ');
    } finally {
      setIsLoading(false);
    }
  }, [selectedId]);

  useEffect(() => { fetchConfigs(); }, [fetchConfigs]);

  const selected = configs.find(c => c.id === selectedId) ?? null;

  const fetchStats = useCallback(async () => {
    if (!selected) return;
    setIsLoadingStats(true);
    try {
      const [enrolled, failed] = await Promise.all([
        adminApi.getTopEnrolledCourses(selected.academicYear, selected.semester),
        adminApi.getTopFailedCourses(selected.academicYear, selected.semester)
      ]);
      setTopEnrolled(enrolled.data);
      setTopFailed(failed.data);
    } catch {
      setTopEnrolled([]);
      setTopFailed([]);
    } finally {
      setIsLoadingStats(false);
    }
  }, [selected]);

  useEffect(() => {
    fetchStats();
  }, [fetchStats]);

  const openAdd = () => { setEditing(null); setForm(emptyForm); setShowModal(true); };
  const openEdit = (c: SemesterConfig) => {
    setEditing(c);
    setForm({
      academicYear: c.academicYear,
      semester: c.semester,
      regStart: toInputDate(c.regStart),
      regEnd: toInputDate(c.regEnd),
      withdrawStart: toInputDate(c.withdrawStart),
      withdrawEnd: toInputDate(c.withdrawEnd),
      isCurrent: c.isCurrent,
    });
    setShowModal(true);
  };

  const submit = async () => {
    try {
      if (editing) {
        const r = await adminApi.updateSemesterConfig(editing.id, form);
        setConfigs(p => p.map(c => c.id === editing.id ? r.data : c));
        toast.success('อัปเดตการตั้งค่าแล้ว');
      } else {
        const r = await adminApi.createSemesterConfig(form);
        setConfigs(p => {
          const next = [...p, r.data].sort((a, b) =>
            b.academicYear !== a.academicYear
              ? b.academicYear - a.academicYear
              : b.semester - a.semester
          );
          return next;
        });
        setSelectedId(r.data.id);
        toast.success('เพิ่มภาคเรียนสำเร็จ');
      }
      setShowModal(false);
    } catch { toast.error('ดำเนินการไม่สำเร็จ'); }
  };

  const handleDelete = async (c: SemesterConfig) => {
    if (!window.confirm(`ลบภาคเรียน ${c.academicYear}/${c.semester}? ข้อมูลการลงทะเบียนอาจได้รับผลกระทบ`)) return;
    try {
      await adminApi.deleteSemesterConfig(c.id);
      setConfigs(p => {
        const next = p.filter(x => x.id !== c.id);
        setSelectedId(next[0]?.id ?? null);
        return next;
      });
      toast.success('ลบภาคเรียนสำเร็จ');
    } catch { toast.error('ดำเนินการไม่สำเร็จ'); }
  };

  const handleClose = async () => {
    if (!selected || !window.confirm('ยืนยันระบบการปิดภาคเรียน? โปรดตรวจสอบคะแนนและเกรดของอาจารย์ผู้สอนให้เรียบร้อยก่อนกดยืนยัน')) return;
    setIsClosingSem(true);
    const tid = toast.loading('กำลังประมวลผลเกรดและปิดภาคเรียน...');
    try {
      await adminApi.closeSemester(selected.academicYear, selected.semester);
      toast.success('ปิดภาคเรียนและประมวลผลเกรดเฉลี่ยรายบุคคลเรียบร้อย', { id: tid });
      fetchConfigs();
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'ดำเนินการไม่สำเร็จ', { id: tid });
    }
    finally { setIsClosingSem(false); }
  };

  if (isLoading) return <div className="loading-state"><Loader2 className="spin" size={40} /></div>;

  return (
    <div className="admin-page animate-fade-in sem-page">
      <div className="page-header">
        <div className="page-title">
          <Settings size={24} />
          <h1>ข้อมูลภาคเรียน</h1>
          <span className="badge">Config Hub</span>
        </div>
        <button className="btn btn-primary" onClick={openAdd}>
          <Plus size={16} /> เพิ่มภาคเรียน
        </button>
      </div>

      <div className="sem-filter-container card">
        <div className="sem-filter-header">
          <CalendarDays size={18} />
          <span>เลือกปีการศึกษาและภาคเรียน</span>
        </div>
        <div className="sem-filter-controls">
          <div className="year-select-group">
            <label>ปีการศึกษา:</label>
            <Select 
              value={selectedYear?.toString() || ''} 
              onChange={val => {
                const yr = +val;
                setSelectedYear(yr);
                const firstInYr = configs.find(c => c.academicYear === yr);
                if (firstInYr) setSelectedId(firstInYr.id);
              }}
              options={Array.from(new Set(configs.map(c => c.academicYear))).toSorted((a,b)=>b-a).map(y => ({ value: y.toString(), label: ` ${y}` }))}
              className="year-drop"
            />
          </div>
          <div className="sem-button-group">
            {configs.filter(c => c.academicYear === selectedYear).sort((a,b)=>a.semester - b.semester).map(c => (
              <button
                key={c.id}
                className={`sem-btn-pill ${c.id === selectedId ? 'active' : ''}`}
                onClick={() => setSelectedId(c.id)}
              >
                {c.isCurrent && <span className="live-dot" />}
                {c.semester}
              </button>
            ))}
          </div>
        </div>
      </div>

      {selected ? (
        <div className="sem-layout">
          {/* Detail Card */}
          <div className="card sem-detail-card main-panel">
            <div className="sem-detail-header">
              <div className="sdh-left">
                <h2>ภาคเรียนที่ {selected.semester}  ปี {selected.academicYear}</h2>
              </div>
              <div className="badge-group">
                {selected.isCurrent && <span className="live-tag">ปัจจุบัน (ACTIVE)</span>}
                <button className="btn-icon edit" onClick={() => openEdit(selected)}><Pencil size={15} /></button>
                <button className="btn-icon delete" onClick={() => handleDelete(selected)}><Trash2 size={15} /></button>
              </div>
            </div>

            <div className="sem-dates-grid">
              <div className="date-box">
                <span className="box-label">เริ่มลงทะเบียน</span>
                <span className="box-val">{fmt(selected.regStart)}</span>
              </div>
              <div className="date-box">
                <span className="box-label">สิ้นสุดลงทะเบียน</span>
                <span className="box-val">{fmt(selected.regEnd)}</span>
              </div>
              <div className="date-box">
                <span className="box-label">เริ่มถอนรายวิชา</span>
                <span className="box-val">{fmt(selected.withdrawStart)}</span>
              </div>
              <div className="date-box">
                <span className="box-label">สิ้นสุดถอนรายวิชา</span>
                <span className="box-val">{fmt(selected.withdrawEnd)}</span>
              </div>
            </div>

            {selected.isCurrent && (
              <div className="danger-zone card">
                <div className="dz-header">
                  <AlertTriangle size={20} />
                  <div>
                    <h4>ปิดภาคเรียน / ตัดเกรด (Finalize)</h4>
                    <p>เมื่อสิ้นสุดเทอม แอดมินต้องทำการปิดภาคเรียนเพื่อย้ายข้อมูลเข้า Transcript และรีเซ็ตสถานะลงทะเบียน</p>
                  </div>
                </div>
                <button 
                  className="btn btn-danger" 
                  onClick={handleClose}
                  disabled={isClosingSem}
                >
                  {isClosingSem ? <Loader2 className="spin" size={16} /> : <CheckCircle size={16} />}
                  ประมวลผลและปิดภาคเรียน
                </button>
              </div>
            )}
          </div>

          {/* Stats Sidebar */}
          <div className="stats-sidebar">
            <div className="card stats-card">
              <div className="stats-header">
                <TrendingUp size={18} />
                <h3>วิชาที่ลงทะเบียนสูงสุด (ภาพรวม)</h3>
              </div>
              {isLoadingStats ? <div className="stats-loading"><Loader2 className="spin" /></div> : (
                <div className="stats-list">
                  {topEnrolled.map((s, i) => {
                    const max = Math.max(...topEnrolled.map(x => x.enrollCount), 1);
                    const pct = (s.enrollCount / max) * 100;
                    return (
                      <div key={i} className="bar-row">
                        <div className="bar-labels">
                          <div className="stat-info">
                            <span className="stat-code">{s.courseCode}</span>
                            <span className="stat-name">{s.nameTh}</span>
                          </div>
                          <span className="stat-val">{s.enrollCount}</span>
                        </div>
                        <div className="bar-bg">
                          <div className="bar-fill" style={{ width: `${pct}%`, background: 'var(--primary)' }} />
                        </div>
                      </div>
                    );
                  })}
                  {topEnrolled.length === 0 && <p className="stats-empty">ไม่มีข้อมูล</p>}
                </div>
              )}
            </div>

            {(!selected.isCurrent) && (
              <div className="card stats-card failed-card">
                <div className="stats-header">
                  <BarChart3 size={18} />
                  <h3>วิชาที่ได้เกรด F สูงสุด (Top 5)</h3>
                </div>
                {isLoadingStats ? <div className="stats-loading"><Loader2 className="spin" /></div> : (
                  <div className="chart-container">
                    {topFailed.map((s, i) => {
                      const max = Math.max(...topFailed.map(x => x.failCount), 1);
                      const pct = (s.failCount / max) * 100;
                      return (
                        <div key={i} className="bar-row">
                          <div className="bar-labels">
                            <div className="stat-info">
                              <span className="stat-code">{s.courseCode}</span>
                              <span className="stat-name">{s.nameTh}</span>
                            </div>
                            <span className="stat-val">{s.failCount}</span>
                          </div>
                          <div className="bar-bg">
                            <div className="bar-fill" style={{ width: `${pct}%` }} />
                          </div>
                        </div>
                      );
                    })}
                    {topFailed.length === 0 && <p className="stats-empty">ไม่มีข้อมูลการติด F</p>}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      ) : (
        <div className="card empty-state-card">
          <Info size={40} />
          <p>เลือกหรือสร้างภาคเรียนใหม่เพื่อเริ่มกำหนดค่า</p>
        </div>
      )}

      {showModal && (
        <Portal>
          <div className="modal-overlay" onClick={() => setShowModal(false)}>
            <div className="modal modal-lg animate-pop-in" onClick={e => e.stopPropagation()}>
              <div className="modal-header">
                <h3>{editing ? 'แก้ไขภาคเรียน' : 'เพิ่มภาคเรียนใหม่'}</h3>
                <button className="btn-close" onClick={() => setShowModal(false)}>×</button>
              </div>
              <div className="modal-content">
                <div className="sem-form-grid">
                  <div className="form-group">
                    <label>ปีการศึกษา (พ.ศ.)</label>
                    <input
                      type="number"
                      value={form.academicYear}
                      onChange={e => setForm(p => ({ ...p, academicYear: +e.target.value }))}
                    />
                  </div>
                  <div className="form-group">
                    <label>ภาคเรียน</label>
                    <Select 
                      value={form.semester.toString()} 
                      onChange={val => setForm(p => ({ ...p, semester: +val }))}
                      options={[
                        { value: '1', label: 'ภาคต้น (1)' },
                        { value: '2', label: 'ภาคปลาย (2)' },
                        { value: '3', label: 'ภาคฤดูร้อน (3)' }
                      ]}
                    />
                  </div>
                  <div className="form-group">
                    <label>เริ่มลงทะเบียน</label>
                    <input type="datetime-local" value={form.regStart} onChange={e => setForm(p => ({ ...p, regStart: e.target.value }))} />
                  </div>
                  <div className="form-group">
                    <label>สิ้นสุดลงทะเบียน</label>
                    <input type="datetime-local" value={form.regEnd} onChange={e => setForm(p => ({ ...p, regEnd: e.target.value }))} />
                  </div>
                  <div className="form-group">
                    <label>เริ่มถอนรายวิชา</label>
                    <input type="datetime-local" value={form.withdrawStart} onChange={e => setForm(p => ({ ...p, withdrawStart: e.target.value }))} />
                  </div>
                  <div className="form-group">
                    <label>สิ้นสุดถอนรายวิชา</label>
                    <input type="datetime-local" value={form.withdrawEnd} onChange={e => setForm(p => ({ ...p, withdrawEnd: e.target.value }))} />
                  </div>
                  <div className="form-group span-2">
                    <label className="checkbox-row">
                      <input type="checkbox" checked={form.isCurrent} onChange={e => setForm(p => ({ ...p, isCurrent: e.target.checked }))} />
                      <span>กำหนดเป็นภาคเรียนปัจจุบัน (Active Semester)</span>
                    </label>
                  </div>
                </div>
              </div>
              <div className="modal-footer">
                <button className="btn btn-ghost" onClick={() => setShowModal(false)}>ยกเลิก</button>
                <button className="btn btn-primary" onClick={submit}>บันทึกการตั้งค่า</button>
              </div>
            </div>
          </div>
        </Portal>
      )}
    </div>
  );
}
