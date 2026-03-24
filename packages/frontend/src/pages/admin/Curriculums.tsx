import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { curriculumApi } from '../../api/curriculum.api';
import { facultyApi } from '../../api/faculty.api';
import { departmentApi } from '../../api/department.api';
import type { Curriculum, Faculty, Department } from '../../types';
import { Plus, Pencil, Trash2, Loader2, GraduationCap, GitBranch } from 'lucide-react';
import { toast } from 'react-hot-toast';
import './Curriculums.css';

type FormData = { curriculumCode: string; name: string; description: string; year: number; totalCredits: number; facultyId: string; deptId: string; };
const emptyForm: FormData = { curriculumCode: '', name: '', description: '', year: new Date().getFullYear() + 543, totalCredits: 128, facultyId: '', deptId: '' };

export default function AdminCurriculums() {
  const navigate = useNavigate();
  const [curriculums, setCurriculums] = useState<Curriculum[]>([]);
  const [faculties, setFaculties] = useState<Faculty[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState<Curriculum | null>(null);
  const [form, setForm] = useState<FormData>(emptyForm);

  useEffect(() => {
    Promise.all([
      curriculumApi.search({}),
      facultyApi.getAll(),
    ]).then(([cr, fr]) => {
      setCurriculums(cr.data);
      setFaculties(fr.data);
      setIsLoading(false);
    }).catch(() => { toast.error('Failed to load'); setIsLoading(false); });
  }, []);

  useEffect(() => {
    if (form.facultyId) {
      departmentApi.getByFaculty(form.facultyId).then(r => setDepartments(r.data));
    }
  }, [form.facultyId]);

  const openAdd = () => { setEditing(null); setForm(emptyForm); setShowModal(true); };
  const openEdit = (c: Curriculum) => {
    setEditing(c);
    setForm({ curriculumCode: c.curriculumCode, name: c.name, description: c.description || '', year: c.year, totalCredits: c.totalCredits, facultyId: c.facultyId, deptId: c.deptId });
    setShowModal(true);
  };

  const submit = async () => {
    try {
      if (editing) {
        const r = await curriculumApi.update(editing.id, form);
        setCurriculums(p => p.map(c => c.id === editing.id ? r.data : c));
        toast.success('Updated');
      } else {
        const r = await curriculumApi.create(form);
        setCurriculums(p => [...p, r.data]);
        toast.success('Created');
      }
      setShowModal(false);
    } catch { toast.error('Operation failed'); }
  };

  const deleteCurriculum = async (id: string) => {
    if (!confirm('Delete this curriculum?')) return;
    try {
      await curriculumApi.delete(id);
      setCurriculums(p => p.filter(c => c.id !== id));
      toast.success('Deleted');
    } catch { toast.error('Delete failed'); }
  };

  if (isLoading) return <div className="loading-state"><Loader2 className="spin" size={40} /></div>;

  return (
    <div className="admin-page animate-fade-in">
      <div className="page-header">
        <div className="page-title"><GraduationCap size={24} /><h1>Curriculums</h1></div>
        <button className="btn btn-primary" onClick={openAdd}><Plus size={16} /> Add Curriculum</button>
      </div>

      <div className="curriculum-grid">
        {curriculums.map(c => (
          <div key={c.id} className="curriculum-card card">
            <div className="curriculum-card-header">
              <span className="badge">{c.curriculumCode}</span>
              <span className={`status-badge ${c.status === 'ACTIVE' ? 'active' : ''}`}>{c.status}</span>
            </div>
            <h3>{c.name}</h3>
            <div className="curriculum-meta">
              <span>Year: {c.year}</span>
              <span>{c.totalCredits} credits</span>
            </div>
            {c.description && <p className="curriculum-desc">{c.description}</p>}
            <div className="curriculum-actions">
              <button className="btn btn-secondary btn-sm" onClick={() => navigate(`/admin/curriculums/${c.id}/flow`)}>
                <GitBranch size={14} /> Edit Flow
              </button>
              <button className="btn-icon edit" onClick={() => openEdit(c)}><Pencil size={14} /></button>
              <button className="btn-icon delete" onClick={() => deleteCurriculum(c.id)}><Trash2 size={14} /></button>
            </div>
          </div>
        ))}
      </div>

      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal modal-lg" onClick={e => e.stopPropagation()}>
            <h3>{editing ? 'Edit Curriculum' : 'Add Curriculum'}</h3>
            <div className="form-grid-2">
              <div className="form-group">
                <label>Curriculum Code</label>
                <input value={form.curriculumCode} onChange={e => setForm(p => ({ ...p, curriculumCode: e.target.value }))} />
              </div>
              <div className="form-group">
                <label>Year (B.E.)</label>
                <input type="number" value={form.year} onChange={e => setForm(p => ({ ...p, year: +e.target.value }))} />
              </div>
              <div className="form-group span-2">
                <label>Name</label>
                <input value={form.name} onChange={e => setForm(p => ({ ...p, name: e.target.value }))} />
              </div>
              <div className="form-group span-2">
                <label>Description</label>
                <textarea rows={2} value={form.description} onChange={e => setForm(p => ({ ...p, description: e.target.value }))} />
              </div>
              <div className="form-group">
                <label>Total Credits</label>
                <input type="number" value={form.totalCredits} onChange={e => setForm(p => ({ ...p, totalCredits: +e.target.value }))} />
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
