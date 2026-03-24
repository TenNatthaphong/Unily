import { useState, useEffect } from 'react';
import Portal from '../../components/ui/Portal';
import { facultyApi } from '../../api/faculty.api';
import { departmentApi } from '../../api/department.api';
import type { Faculty, Department } from '../../types';
import { Plus, Pencil, Trash2, ChevronDown, ChevronRight, Loader2, Building2 } from 'lucide-react';
import { toast } from 'react-hot-toast';
import './Faculties.css';

interface FacultyFormData {
  facultyCode: string;
  nameTh: string;
  nameEn: string;
}

interface DeptFormData {
  deptCode: string;
  shortName: string;
  nameTh: string;
  nameEn: string;
}

const emptyFaculty: FacultyFormData = { facultyCode: '', nameTh: '', nameEn: '' };
const emptyDept: DeptFormData = { deptCode: '', shortName: '', nameTh: '', nameEn: '' };

export default function AdminFaculties() {
  const [faculties, setFaculties] = useState<Faculty[]>([]);
  const [departments, setDepartments] = useState<Record<string, Department[]>>({});
  const [expanded, setExpanded] = useState<Record<string, boolean>>({});
  const [isLoading, setIsLoading] = useState(true);

  // Faculty modal
  const [showFacultyModal, setShowFacultyModal] = useState(false);
  const [editingFaculty, setEditingFaculty] = useState<Faculty | null>(null);
  const [facultyForm, setFacultyForm] = useState<FacultyFormData>(emptyFaculty);

  // Dept modal
  const [showDeptModal, setShowDeptModal] = useState(false);
  const [editingDept, setEditingDept] = useState<Department | null>(null);
  const [deptForm, setDeptForm] = useState<DeptFormData>(emptyDept);
  const [deptFacultyId, setDeptFacultyId] = useState('');

  useEffect(() => {
    facultyApi.getAll().then(r => {
      setFaculties(r.data);
      setIsLoading(false);
    }).catch(() => {
      toast.error('Failed to load faculties');
      setIsLoading(false);
    });
  }, []);

  const toggleFaculty = async (fid: string) => {
    const next = !expanded[fid];
    setExpanded(p => ({ ...p, [fid]: next }));
    if (next && !departments[fid]) {
      const r = await departmentApi.getByFaculty(fid);
      setDepartments(p => ({ ...p, [fid]: r.data }));
    }
  };

  // --- Faculty handlers ---
  const openAddFaculty = () => { setEditingFaculty(null); setFacultyForm(emptyFaculty); setShowFacultyModal(true); };
  const openEditFaculty = (f: Faculty) => { setEditingFaculty(f); setFacultyForm({ facultyCode: f.facultyCode, nameTh: f.nameTh, nameEn: f.nameEn }); setShowFacultyModal(true); };

  const submitFaculty = async () => {
    try {
      if (editingFaculty) {
        const r = await facultyApi.update(editingFaculty.id, facultyForm);
        setFaculties(p => p.map(f => f.id === editingFaculty.id ? r.data : f));
        toast.success('Faculty updated');
      } else {
        const r = await facultyApi.create(facultyForm);
        setFaculties(p => [...p, r.data]);
        toast.success('Faculty created');
      }
      setShowFacultyModal(false);
    } catch { toast.error('Operation failed'); }
  };

  const deleteFaculty = async (id: string) => {
    if (!confirm('Delete this faculty? All departments inside will also be deleted.')) return;
    try {
      await facultyApi.delete(id);
      setFaculties(p => p.filter(f => f.id !== id));
      toast.success('Faculty deleted');
    } catch { toast.error('Delete failed'); }
  };

  // --- Dept handlers ---
  const openAddDept = (facultyId: string) => {
    setEditingDept(null);
    setDeptForm(emptyDept);
    setDeptFacultyId(facultyId);
    setShowDeptModal(true);
  };
  const openEditDept = (d: Department) => {
    setEditingDept(d);
    setDeptForm({ deptCode: d.deptCode, shortName: d.shortName, nameTh: d.nameTh, nameEn: d.nameEn });
    setDeptFacultyId(d.facultyId);
    setShowDeptModal(true);
  };

  const submitDept = async () => {
    try {
      if (editingDept) {
        const r = await departmentApi.update(editingDept.id, deptForm);
        setDepartments(p => ({ ...p, [deptFacultyId]: p[deptFacultyId].map(d => d.id === editingDept.id ? r.data : d) }));
        toast.success('Department updated');
      } else {
        const r = await departmentApi.create({ ...deptForm, facultyId: deptFacultyId });
        setDepartments(p => ({ ...p, [deptFacultyId]: [...(p[deptFacultyId] || []), r.data] }));
        toast.success('Department created');
      }
      setShowDeptModal(false);
    } catch { toast.error('Operation failed'); }
  };

  const deleteDept = async (d: Department) => {
    if (!confirm('Delete this department?')) return;
    try {
      await departmentApi.delete(d.id);
      setDepartments(p => ({ ...p, [d.facultyId]: p[d.facultyId].filter(x => x.id !== d.id) }));
      toast.success('Department deleted');
    } catch { toast.error('Delete failed'); }
  };

  if (isLoading) return (
    <div className="loading-state"><Loader2 className="spin" size={40} /><p>Loading...</p></div>
  );

  return (
    <div className="admin-page animate-fade-in">
      <div className="page-header">
        <div className="page-title">
          <Building2 size={24} />
          <h1>Faculties & Departments</h1>
        </div>
        <button className="btn btn-primary" onClick={openAddFaculty}>
          <Plus size={16} /> Add Faculty
        </button>
      </div>

      <div className="faculties-list">
        {faculties.map(f => (
          <div key={f.id} className="faculty-card card">
            <div className="faculty-row" onClick={() => toggleFaculty(f.id)}>
              <div className="faculty-info">
                {expanded[f.id] ? <ChevronDown size={18} /> : <ChevronRight size={18} />}
                <span className="faculty-code badge">{f.facultyCode}</span>
                <div>
                  <div className="faculty-name">{f.nameTh}</div>
                  <div className="faculty-name-en">{f.nameEn}</div>
                </div>
              </div>
              <div className="row-actions" onClick={e => e.stopPropagation()}>
                <button className="btn-icon" onClick={() => openAddDept(f.id)} title="Add Department">
                  <Plus size={15} />
                </button>
                <button className="btn-icon edit" onClick={() => openEditFaculty(f)}>
                  <Pencil size={15} />
                </button>
                <button className="btn-icon delete" onClick={() => deleteFaculty(f.id)}>
                  <Trash2 size={15} />
                </button>
              </div>
            </div>

            {expanded[f.id] && (
              <div className="depts-list">
                {(departments[f.id] || []).map(d => (
                  <div key={d.id} className="dept-row">
                    <span className="dept-code badge badge-sm">{d.deptCode}</span>
                    <span className="dept-short">{d.shortName}</span>
                    <span className="dept-name">{d.nameTh}</span>
                    <div className="row-actions">
                      <button className="btn-icon edit" onClick={() => openEditDept(d)}>
                        <Pencil size={14} />
                      </button>
                      <button className="btn-icon delete" onClick={() => deleteDept(d)}>
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </div>
                ))}
                {departments[f.id]?.length === 0 && (
                  <p className="empty-depts">No departments yet</p>
                )}
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Faculty Modal */}
      {showFacultyModal && (
        <Portal>
          <div className="modal-overlay" onClick={() => setShowFacultyModal(false)}>
            <div className="modal" onClick={e => e.stopPropagation()}>
              <h3>{editingFaculty ? 'Edit Faculty' : 'Add Faculty'}</h3>
              <div className="form-group">
                <label>Faculty Code</label>
                <input value={facultyForm.facultyCode} onChange={e => setFacultyForm(p => ({ ...p, facultyCode: e.target.value }))} placeholder="e.g. SCI" />
              </div>
              <div className="form-group">
                <label>Name (Thai)</label>
                <input value={facultyForm.nameTh} onChange={e => setFacultyForm(p => ({ ...p, nameTh: e.target.value }))} />
              </div>
              <div className="form-group">
                <label>Name (English)</label>
                <input value={facultyForm.nameEn} onChange={e => setFacultyForm(p => ({ ...p, nameEn: e.target.value }))} />
              </div>
              <div className="modal-actions">
                <button className="btn btn-secondary" onClick={() => setShowFacultyModal(false)}>Cancel</button>
                <button className="btn btn-primary" onClick={submitFaculty}>Save</button>
              </div>
            </div>
          </div>
        </Portal>
      )}

      {/* Dept Modal */}
      {showDeptModal && (
        <Portal>
          <div className="modal-overlay" onClick={() => setShowDeptModal(false)}>
            <div className="modal" onClick={e => e.stopPropagation()}>
              <h3>{editingDept ? 'Edit Department' : 'Add Department'}</h3>
              <div className="form-group">
                <label>Department Code</label>
                <input value={deptForm.deptCode} onChange={e => setDeptForm(p => ({ ...p, deptCode: e.target.value }))} placeholder="e.g. CS" />
              </div>
              <div className="form-group">
                <label>Short Name</label>
                <input value={deptForm.shortName} onChange={e => setDeptForm(p => ({ ...p, shortName: e.target.value }))} placeholder="e.g. CS" />
              </div>
              <div className="form-group">
                <label>Name (Thai)</label>
                <input value={deptForm.nameTh} onChange={e => setDeptForm(p => ({ ...p, nameTh: e.target.value }))} />
              </div>
              <div className="form-group">
                <label>Name (English)</label>
                <input value={deptForm.nameEn} onChange={e => setDeptForm(p => ({ ...p, nameEn: e.target.value }))} />
              </div>
              <div className="modal-actions">
                <button className="btn btn-secondary" onClick={() => setShowDeptModal(false)}>Cancel</button>
                <button className="btn btn-primary" onClick={submitDept}>Save</button>
              </div>
            </div>
          </div>
        </Portal>
      )}
    </div>
  );
}
