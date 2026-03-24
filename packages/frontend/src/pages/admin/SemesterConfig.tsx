import { useState, useEffect } from 'react';
import { adminApi } from '../../api/admin.api';
import type { SemesterConfig } from '../../types';
import { Settings, Plus, Pencil, Loader2, CheckCircle } from 'lucide-react';
import { toast } from 'react-hot-toast';
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
  return new Date(d).toISOString().slice(0, 16);
}

export default function AdminSemesterConfig() {
  const [configs, setConfigs] = useState<SemesterConfig[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState<SemesterConfig | null>(null);
  const [form, setForm] = useState<FormData>(emptyForm);

  useEffect(() => {
    adminApi.getSemesterConfigs()
      .then(r => { setConfigs(r.data); setIsLoading(false); })
      .catch(() => { toast.error('Failed to load'); setIsLoading(false); });
  }, []);

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
    const payload = {
      ...form,
      regStart: new Date(form.regStart).toISOString(),
      regEnd: new Date(form.regEnd).toISOString(),
      withdrawStart: new Date(form.withdrawStart).toISOString(),
      withdrawEnd: new Date(form.withdrawEnd).toISOString(),
    };
    try {
      if (editing) {
        const r = await adminApi.updateSemesterConfig(editing.id, payload);
        setConfigs(p => p.map(c => c.id === editing.id ? r.data : c));
        toast.success('Updated');
      } else {
        const r = await adminApi.createSemesterConfig(payload);
        setConfigs(p => [...p, r.data]);
        toast.success('Created');
      }
      setShowModal(false);
    } catch { toast.error('Operation failed'); }
  };

  const fmt = (d: string) => d ? new Date(d).toLocaleString('th-TH', { dateStyle: 'medium', timeStyle: 'short' }) : '-';

  if (isLoading) return <div className="loading-state"><Loader2 className="spin" size={40} /></div>;

  return (
    <div className="admin-page animate-fade-in">
      <div className="page-header">
        <div className="page-title"><Settings size={24} /><h1>Semester Configuration</h1></div>
        <button className="btn btn-primary" onClick={openAdd}><Plus size={16} /> Add Semester</button>
      </div>

      <div className="sem-config-list">
        {configs.map(c => (
          <div key={c.id} className={`sem-config-card card ${c.isCurrent ? 'current' : ''}`}>
            <div className="sem-config-top">
              <div className="sem-config-title">
                <span className="sem-badge">Year {c.academicYear} / Sem {c.semester}</span>
                {c.isCurrent && <span className="live-badge"><CheckCircle size={12} /> LIVE</span>}
              </div>
              <button className="btn-icon edit" onClick={() => openEdit(c)}><Pencil size={15} /></button>
            </div>
            <div className="sem-config-dates">
              <div className="date-row">
                <span className="date-label">เปิดลงทะเบียน</span>
                <span className="date-range">{fmt(c.regStart)} → {fmt(c.regEnd)}</span>
              </div>
              <div className="date-row">
                <span className="date-label">ถอนวิชาถึง</span>
                <span className="date-range">{fmt(c.withdrawStart)} → {fmt(c.withdrawEnd)}</span>
              </div>
            </div>
          </div>
        ))}
        {configs.length === 0 && <p style={{ color: 'var(--text-muted)' }}>No semester configs yet</p>}
      </div>

      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal modal-lg" onClick={e => e.stopPropagation()}>
            <h3>{editing ? 'Edit Semester Config' : 'Add Semester Config'}</h3>
            <div className="form-grid-2">
              <div className="form-group">
                <label>Academic Year (B.E.)</label>
                <input type="number" value={form.academicYear} onChange={e => setForm(p => ({ ...p, academicYear: +e.target.value }))} />
              </div>
              <div className="form-group">
                <label>Semester</label>
                <select value={form.semester} onChange={e => setForm(p => ({ ...p, semester: +e.target.value }))}>
                  <option value={1}>1</option>
                  <option value={2}>2</option>
                  <option value={3}>3 (Summer)</option>
                </select>
              </div>
              <div className="form-group">
                <label>Registration Start</label>
                <input type="datetime-local" value={form.regStart} onChange={e => setForm(p => ({ ...p, regStart: e.target.value }))} />
              </div>
              <div className="form-group">
                <label>Registration End</label>
                <input type="datetime-local" value={form.regEnd} onChange={e => setForm(p => ({ ...p, regEnd: e.target.value }))} />
              </div>
              <div className="form-group">
                <label>Withdraw Start</label>
                <input type="datetime-local" value={form.withdrawStart} onChange={e => setForm(p => ({ ...p, withdrawStart: e.target.value }))} />
              </div>
              <div className="form-group">
                <label>Withdraw End</label>
                <input type="datetime-local" value={form.withdrawEnd} onChange={e => setForm(p => ({ ...p, withdrawEnd: e.target.value }))} />
              </div>
              <div className="form-group span-2">
                <label className="checkbox-label">
                  <input type="checkbox" checked={form.isCurrent} onChange={e => setForm(p => ({ ...p, isCurrent: e.target.checked }))} />
                  Set as Current Semester (LIVE)
                </label>
              </div>
            </div>
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
