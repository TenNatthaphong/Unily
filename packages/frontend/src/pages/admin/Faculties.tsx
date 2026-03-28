import { useState, useEffect, useCallback } from 'react';
import Portal from '../../components/ui/Portal';
import { facultyApi } from '../../api/faculty.api';
import { departmentApi } from '../../api/department.api';
import type { Faculty, Department } from '../../types';
import api from '../../api/axios';
import { 
  Plus, Pencil, Trash2, ChevronDown, ChevronRight, 
  Loader2, Building2, FileUp, Info, Search
} from 'lucide-react';
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
  const [search, setSearch] = useState('');

  // Faculty modal
  const [showFacultyModal, setShowFacultyModal] = useState(false);
  const [editingFaculty, setEditingFaculty] = useState<Faculty | null>(null);
  const [facultyForm, setFacultyForm] = useState<FacultyFormData>(emptyFaculty);

  // Dept modal
  const [showDeptModal, setShowDeptModal] = useState(false);
  const [editingDept, setEditingDept] = useState<Department | null>(null);
  const [deptForm, setDeptForm] = useState<DeptFormData>(emptyDept);
  const [deptFacultyId, setDeptFacultyId] = useState('');

  const fetchFaculties = useCallback(async () => {
    setIsLoading(true);
    try {
      const r = await facultyApi.getAll();
      // Handle standardized response if any, or raw array
      setFaculties(r.data);
    } catch {
      toast.error('ไม่สามารถโหลดข้อมูลคณะได้');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => { fetchFaculties(); }, [fetchFaculties]);

  const toggleFaculty = async (fid: string) => {
    const next = !expanded[fid];
    setExpanded(p => ({ ...p, [fid]: next }));
    if (next && !departments[fid]) {
      const r = await departmentApi.getByFaculty(fid);
      setDepartments(p => ({ ...p, [fid]: r.data }));
    }
  };

  const onImportCsv = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const tid = toast.loading('กำลังนำเข้าข้อมูล (คณะและภาควิชา)...');
    facultyApi.importCsv(file)
      .then((res: any) => {
        const { facultyCount, deptCount } = res.data;
        toast.success(`นำเข้าสำเร็จ: ${facultyCount} คณะ, ${deptCount} ภาควิชา`, { id: tid });
        fetchFaculties();
        setExpanded({}); 
      })
      .catch((err) => toast.error(err.response?.data?.message || 'นำเข้าไม่สำเร็จ', { id: tid }));
  };


  // --- Faculty handlers ---
  const openAddFaculty = () => { setEditingFaculty(null); setFacultyForm(emptyFaculty); setShowFacultyModal(true); };
  const openEditFaculty = (f: Faculty) => { setEditingFaculty(f); setFacultyForm({ facultyCode: f.facultyCode, nameTh: f.nameTh, nameEn: f.nameEn }); setShowFacultyModal(true); };

  const submitFaculty = async () => {
    try {
      if (editingFaculty) {
        await facultyApi.update(editingFaculty.id, facultyForm);
        toast.success('อัปเดตข้อมูลคณะสำเร็จ');
      } else {
        await facultyApi.create(facultyForm);
        toast.success('เพิ่มคณะใหม่สำเร็จ');
      }
      fetchFaculties();
      setShowFacultyModal(false);
    } catch { toast.error('เกิดข้อผิดพลาดในการบันทึกข้อมูล'); }
  };

  const deleteFaculty = async (f: Faculty) => {
    if (!window.confirm(`ต้องการลบคณะ ${f.nameTh} ใช่หรือไม่? ภาควิชาทั้งหมดจะถูกลบไปด้วย`)) return;
    try {
      await facultyApi.delete(f.facultyCode);
      toast.success('ลบคณะสำเร็จ');
      fetchFaculties();
    } catch { toast.error('ไม่สามารถลบคณะได้'); }
  };

  // --- Dept handlers ---
  const openAddDept = (facultyId: string) => { setEditingDept(null); setDeptForm(emptyDept); setDeptFacultyId(facultyId); setShowDeptModal(true); };
  const openEditDept = (d: Department) => { setEditingDept(d); setDeptForm({ deptCode: d.deptCode, shortName: d.shortName, nameTh: d.nameTh, nameEn: d.nameEn }); setDeptFacultyId(d.facultyId); setShowDeptModal(true); };

  const submitDept = async () => {
    try {
      if (editingDept) {
        await departmentApi.update(editingDept.id, deptForm);
        toast.success('อัปเดตภาควิชาสำเร็จ');
      } else {
        await departmentApi.create({ ...deptForm, facultyId: deptFacultyId });
        toast.success('เพิ่มภาควิชาสำเร็จ');
      }
      // Refresh current faculty's departments
      const r = await departmentApi.getByFaculty(deptFacultyId);
      setDepartments(p => ({ ...p, [deptFacultyId]: r.data }));
      setShowDeptModal(false);
    } catch { toast.error('เกิดข้อผิดพลาดในการบันทึกข้อมูล'); }
  };

  const deleteDept = async (d: Department) => {
    if (!window.confirm(`ต้องการลบภาควิชา ${d.nameTh} ใช่หรือไม่?`)) return;
    try {
      await departmentApi.delete(d.id);
      toast.success('ลบภาควิชาสำเร็จ');
      const r = await departmentApi.getByFaculty(d.facultyId);
      setDepartments(p => ({ ...p, [d.facultyId]: r.data }));
    } catch { toast.error('ไม่สามารถลบภาควิชาได้'); }
  };

  if (isLoading) return <div className="loading-state"><Loader2 className="spin" size={40} /></div>;

  return (
    <div className="admin-page animate-fade-in org-page">
      <div className="page-header">
        <div className="page-title">
          <Building2 size={24} />
          <h1>จัดการโครงสร้างองค์กร</h1>
          <span className="badge">Faculty & Depts</span>
        </div>
        <div className="header-actions">
           <div className="csv-dropdown-group">
            <label className="btn btn-secondary btn-sm" style={{ cursor: 'pointer', gap: 6 }}>
              <FileUp size={14} /> นำเข้าข้อมูล (CSV)
              <input type="file" hidden accept=".csv" onChange={onImportCsv} />
            </label>
          </div>
          <button className="btn btn-primary" onClick={openAddFaculty}><Plus size={16} /> เพิ่มคณะ</button>
        </div>
      </div>

      <div className="page-filters">
        <div className="search-box">
          <Search size={18} />
          <input placeholder="ค้นหาด้วยรหัสหรือชื่อคณะ..." value={search} onChange={e => setSearch(e.target.value)} />
        </div>
      </div>

      <div className="org-list">
        {faculties.map(f => {
          if (search && !f.nameTh.includes(search) && !f.facultyCode.includes(search)) return null;
          return (
            <div key={f.id} className={`org-card card ${expanded[f.id] ? 'expanded' : ''}`}>
              <div className="org-row" onClick={() => toggleFaculty(f.id)}>
                <div className="org-main">
                  <div className={`exp-icon ${expanded[f.id] ? 'active' : ''}`}>
                    <ChevronRight size={18} />
                  </div>
                  <div className="org-identity">
                    <span className="org-code">{f.facultyCode}</span>
                    <div className="org-text">
                      <h3 className="org-name-th">{f.nameTh}</h3>
                      <span className="org-name-en">{f.nameEn}</span>
                    </div>
                  </div>
                </div>
                <div className="org-meta">
                   <span className="org-count">{f._count?.departments || 0} ภาควิชา</span>
                   <div className="row-actions" onClick={e => e.stopPropagation()}>
                    <button className="btn-icon" onClick={() => openAddDept(f.id)} title="เพิ่มภาควิชา"><Plus size={15} /></button>
                    <button className="btn-icon edit" onClick={() => openEditFaculty(f)}><Pencil size={15} /></button>
                    <button className="btn-icon delete" onClick={() => deleteFaculty(f)}><Trash2 size={15} /></button>
                   </div>
                </div>
              </div>

              {expanded[f.id] && (
                <div className="dept-section">
                  <div className="dept-list-header">รายชื่อภาควิชาภายในสังกัด</div>
                  <div className="dept-container">
                    {(departments[f.id] || []).map(d => (
                      <div key={d.id} className="dept-item">
                        <div className="dept-info">
                          <span className="dept-code">{d.deptCode}</span>
                          <div className="dept-text">
                            <span className="dept-name">{d.nameTh}</span>
                            <span className="dept-short">{d.shortName}</span>
                          </div>
                        </div>
                        <div className="dept-actions">
                          <button className="btn-icon btn-sm edit" onClick={() => openEditDept(d)}><Pencil size={14} /></button>
                          <button className="btn-icon btn-sm delete" onClick={() => deleteDept(d)}><Trash2 size={14} /></button>
                        </div>
                      </div>
                    ))}
                    {departments[f.id]?.length === 0 && <div className="dept-empty">ไม่พบข้อมูลภาควิชา</div>}
                  </div>
                </div>
              )}
            </div>
          );
        })}

        {faculties.length === 0 && (
          <div className="card empty-state">
            <Info size={40} />
            <p>ไม่พบข้อมูลคณะในระบบ</p>
          </div>
        )}
      </div>

      {/* Faculty Modal */}
      {showFacultyModal && (
        <Portal>
          <div className="modal-overlay" onClick={() => setShowFacultyModal(false)}>
            <div className="modal animate-pop-in" onClick={e => e.stopPropagation()}>
              <div className="modal-header">
                <h3>{editingFaculty ? 'แก้ไขคณะ' : 'เพิ่มคณะใหม่'}</h3>
                <button className="btn-close" onClick={() => setShowFacultyModal(false)}>×</button>
              </div>
              <div className="modal-content">
                <div className="form-group">
                  <label>รหัสคณะ <small className="req">*</small></label>
                  <input value={facultyForm.facultyCode} onChange={e => setFacultyForm(p => ({ ...p, facultyCode: e.target.value.toUpperCase() }))} placeholder="เช่น SCI, ENGR" />
                </div>
                <div className="form-group">
                  <label>ชื่อคณะ (ภาษาไทย) <small className="req">*</small></label>
                  <input value={facultyForm.nameTh} onChange={e => setFacultyForm(p => ({ ...p, nameTh: e.target.value }))} />
                </div>
                <div className="form-group">
                  <label>ชื่อคณะ (ภาษาอังกฤษ)</label>
                  <input value={facultyForm.nameEn} onChange={e => setFacultyForm(p => ({ ...p, nameEn: e.target.value }))} />
                </div>
              </div>
              <div className="modal-footer">
                <button className="btn btn-ghost" onClick={() => setShowFacultyModal(false)}>ยกเลิก</button>
                <button className="btn btn-primary" onClick={submitFaculty}>บันทึกข้อมูล</button>
              </div>
            </div>
          </div>
        </Portal>
      )}

      {/* Dept Modal */}
      {showDeptModal && (
        <Portal>
          <div className="modal-overlay" onClick={() => setShowDeptModal(false)}>
            <div className="modal animate-pop-in" onClick={e => e.stopPropagation()}>
              <div className="modal-header">
                <h3>{editingDept ? 'แก้ไขภาควิชา' : 'เพิ่มภาควิชาในคณะ'}</h3>
                <button className="btn-close" onClick={() => setShowDeptModal(false)}>×</button>
              </div>
              <div className="modal-content">
                <div className="form-group">
                  <label>รหัสภาควิชา <small className="req">*</small></label>
                  <input value={deptForm.deptCode} onChange={e => setDeptForm(p => ({ ...p, deptCode: e.target.value.toUpperCase() }))} placeholder="เช่น CS, ME" />
                </div>
                <div className="form-group">
                  <label>ชื่อย่อ / ชื่อเล่น</label>
                  <input value={deptForm.shortName} onChange={e => setDeptForm(p => ({ ...p, shortName: e.target.value }))} placeholder="เช่น วิทยาการคอมพิวเตอร์" />
                </div>
                <div className="form-group">
                  <label>ชื่อเต็มภาษาไทย <small className="req">*</small></label>
                  <input value={deptForm.nameTh} onChange={e => setDeptForm(p => ({ ...p, nameTh: e.target.value }))} />
                </div>
                <div className="form-group">
                  <label>ชื่อเต็มภาษาอังกฤษ</label>
                  <input value={deptForm.nameEn} onChange={e => setDeptForm(p => ({ ...p, nameEn: e.target.value }))} />
                </div>
              </div>
              <div className="modal-footer">
                <button className="btn btn-ghost" onClick={() => setShowDeptModal(false)}>ยกเลิก</button>
                <button className="btn btn-primary" onClick={submitDept}>บันทึกข้อมูล</button>
              </div>
            </div>
          </div>
        </Portal>
      )}
    </div>
  );
}
